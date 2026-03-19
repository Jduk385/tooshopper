const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");

const router = express.Router();

router.post("/quote", async (req, res) => {
  try {
    const { bundleSize, items } = req.body;

    // 1) Leer la promo de la base de datos
    const promo = await mongoose.connection.db
      .collection("promos")
      .findOne({ key: "pack-camisetas", active: true });

    if (!promo) return res.status(404).json({ error: "No existe la promo en Atlas" });
    const tier = (promo.tiers || []).find(t => t.qty === bundleSize);

    // 2) Buscar productos en Atlas usando SKU y Talla ✅
    // Esto es necesario porque tus IDs del JSON no coinciden con los de Atlas
    const normalized = [];
    let subtotal = 0;

    for (const it of items) {
      // Buscamos por SKU y Variant (Talla) que es lo que sí coincide
      const p = await Product.findOne({ 
        sku: it.sku, 
        variant: it.size 
      }).lean();

      if (!p) {
        return res.status(400).json({ 
          error: `No encontré en Atlas: ${it.name || it.sku} Talla ${it.size}. Revisa que el SKU coincida exactamente.` 
        });
      }

      if (p.available_stock <= 0) {
        return res.status(400).json({ error: `Sin stock en Atlas para: ${p.name}` });
      }

      const price = Number(p.price || 0);
      subtotal += price;

      normalized.push({
        productId: String(p._id), // Guardamos el ID REAL de Atlas
        name: p.name,
        basePrice: price,
        size: p.variant
      });
    }

    // 3) Cálculos
    const discount = Math.round(subtotal * (Number(tier.discountPercent) / 100));
    const total = Math.round(subtotal - discount);

    return res.json({
      bundleSize,
      total,
      unitPrice: Math.round(total / bundleSize),
      items: normalized
    });

  } catch (err) {
    console.error("❌ Error en combo:", err);
    return res.status(500).json({ error: "Error interno" });
  }
});

module.exports = router;