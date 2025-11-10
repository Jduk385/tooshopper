// src/pages/ProductDetailAC.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { addToCart } from "../lib/cart";
import "../styles/product-detail-ac.css";

/** ======= Utilidades ======= */
const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

// Colores visibles en los swatches
const COLOR_HEX = {
  BLANCA: "#ffffff",
  BLANCO: "#ffffff",
  AZUL: "#1f3a93",
  "AZUL OSCURO": "#0b3d91",
  NEGRA: "#000000",
  NEGRO: "#000000",
  ROJA: "#B91C1C",
  VERDE: "#0f4d2f",
  "VERDE OSCURO": "#0f4d2f",
  BEIGE: "#D6D3D1",
  GRIS: "#9CA3AF",
};
const COLOR_KEYS = Object.keys(COLOR_HEX);
const ALL_SIZES = ["S", "M", "L", "XL"];

// Helpers sin optional chaining
function colorFromSkuOrName(item) {
  const sku = String(item && item.sku ? item.sku : "");
  const fromSku = sku.split("-").pop().toUpperCase();
  if (COLOR_HEX[fromSku]) return fromSku;

  const name = String(item && item.name ? item.name : "").toUpperCase();
  for (let i = 0; i < COLOR_KEYS.length; i++) {
    if (name.indexOf(COLOR_KEYS[i]) !== -1) return COLOR_KEYS[i];
  }
  return "BLANCA";
}
function familyFromSku(sku) {
  const parts = String(sku || "").split("-");
  return parts.length >= 2
    ? (parts[0] + "-" + parts[1]).toUpperCase()
    : String(sku || "").toUpperCase();
}
function baseName(name) {
  return String(name || "").replace(/\s*\(.*?\)\s*$/, "").trim();
}
function stripColorWords(text) {
  let t = String(text || "");
  const re = new RegExp("\\b(" + COLOR_KEYS.join("|") + ")\\b", "gi");
  return t.replace(re, " ").replace(/\s{2,}/g, " ").trim();
}

export default function ProductDetailAC() {
  const { id } = useParams(); // /producto/:id (puede ser _id o prefijo de SKU)
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // selección actual
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [photo, setPhoto] = useState(0);

  /** ======= Carga robusta del catálogo ======= */
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      let ok = false;
      const candidates = [
        "/products.json",
        "/products/products.json",
        "/data/products.json",
      ];

      for (let i = 0; i < candidates.length; i++) {
        try {
          const r = await fetch(candidates[i], { cache: "no-store" });
          if (!r.ok) continue;
          const j = await r.json();
          const arr = Array.isArray(j) ? j : j?.items ?? [];
          if (arr && arr.length) {
            if (alive) setItems(arr);
            ok = true;
            break;
          }
        } catch {
          /* sigue intentando */
        }
      }
      if (!ok && alive) setItems([]);
      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  /** ======= Construye familia/variantes ======= */
  const data = useMemo(() => {
    if (!items.length) return null;

    const idStr = String(id || "");
    const exact = items.find((p) => String(p._id) === idStr);

    const famKey = exact ? familyFromSku(exact.sku) : familyFromSku(idStr);
    let famItems = items.filter((p) => familyFromSku(p.sku) === famKey);

    if (!famItems.length) {
      // fallback: por si la ruta es prefijo del SKU
      famItems = items.filter((p) =>
        String(p.sku || "").toUpperCase().startsWith(idStr.toUpperCase())
      );
      if (!famItems.length) return null;
    }

    const rawName = famItems[0]?.name || "Producto";
    const name = stripColorWords(baseName(rawName)); // título sin color
    const colors = {}; // { [color]: { variants: { [size]: item }, images: [] } }
    let price = 0;

    for (let i = 0; i < famItems.length; i++) {
      const p = famItems[i];
      const c = colorFromSkuOrName(p);
      const sz = String(p.variant || "ÚNICA").toUpperCase();

      if (!colors[c]) colors[c] = { variants: {}, images: [] };
      colors[c].variants[sz] = p;
      price = p.price != null ? p.price : price;

      const imgs = Array.isArray(p.images) ? p.images : [];
      for (let k = 0; k < imgs.length; k++) {
        const src = imgs[k];
        if (src && !colors[c].images.includes(src)) colors[c].images.push(src);
      }
    }

    // selección inicial
    let initColor = Object.keys(colors)[0] || "";
    let initSize = "";

    if (exact) {
      initColor = colorFromSkuOrName(exact);
      initSize = String(exact.variant || "ÚNICA").toUpperCase();
    } else if (initColor) {
      const sizes = Object.keys(colors[initColor]?.variants || {});
      if (sizes.length) {
        initSize = sizes[0];
        for (let s = 0; s < sizes.length; s++) {
          const key = sizes[s];
          const av =
            (colors[initColor].variants[key]?.available_stock) || 0;
          if (av > 0) {
            initSize = key;
            break;
          }
        }
      }
    }

    return { name, price, colors, initColor, initSize };
  }, [items, id]);

  // setea selección inicial
  useEffect(() => {
    if (!data) return;
    setPhoto(0);
    setColor((prev) => prev || data.initColor || "");
    setSize((prev) => prev || data.initSize || "");
  }, [data]);

  if (loading) return <section className="pdp-container">Cargando…</section>;
  if (!data) return <section className="pdp-container">Producto no encontrado.</section>;

  const colorData = data.colors[color] || { variants: {}, images: [] };
  const current = colorData.variants[size] || null;
  const images =
    (Array.isArray(colorData.images) && colorData.images.length
      ? colorData.images
      : current?.images) || [];

  const canAdd = !!current;

  function onColorChange(c) {
    setColor(c);
    const sizes = Object.keys(data.colors[c]?.variants || {});
    let first = sizes.length ? sizes[0] : "";
    for (let i = 0; i < sizes.length; i++) {
      const key = sizes[i];
      const av = data.colors[c].variants[key]?.available_stock || 0;
      if (av > 0) {
        first = key;
        break;
      }
    }
    setSize(first);
    setPhoto(0);
  }
  function onSizeChange(s) {
    setSize(s);
  }
  function add() {
    if (!current) return;
    const img =
      images?.[0] || (Array.isArray(current.images) ? current.images[0] : "") || "";
    addToCart(
      {
        _id: current._id,
        id: current._id,
        name: data.name,
        price: current.price != null ? current.price : data.price || 0,
        image: img,
      },
      1
    );
    navigate("/carrito");
  }

  /** ======= UI ======= */
  return (
    <section className="pdp-container">
      <div className="pdp-grid">
        {/* === Galería === */}
        <div className="pdp-gallery">
          {/* Thumbs */}
          <div className="pdp-thumbs">
            {images.map((src, i) => (
              <button
                key={src + i}
                className={`pdp-thumb ${i === photo ? "is-active" : ""}`}
                onClick={() => setPhoto(i)}
                aria-label={`Ver imagen ${i + 1}`}
              >
                <img src={src} alt={`Vista ${i + 1}`} loading="lazy" />
              </button>
            ))}
          </div>

          {/* Imagen principal */}
          <div className="pdp-hero">
            {images[photo] ? (
              <img
                src={images[photo]}
                alt={`${data.name} ${color || ""}`}
                loading="eager"
              />
            ) : (
              <div style={{ height: 480 }} />
            )}
          </div>
        </div>

        {/* === Panel derecho === */}
        <div className="pdp-info">
          <h1 className="pdp-title">{data.name}</h1>
          <div className="pdp-price-row">
            <div className="pdp-price">
              {currency.format(
                current && current.price != null ? current.price : data.price || 0
              )}
            </div>
          </div>

          {/* Colores */}
          <div className="pdp-block">
            <div className="pdp-label">COLOR</div>
            <div className="pdp-swatches">
              {Object.keys(data.colors).map((c) => (
                <button
                  key={c}
                  className={`swatch ${c === color ? "is-active" : ""}`}
                  style={{
                    ["--bg"]: COLOR_HEX[c] || "#ddd",
                    ["--bd"]: c === color ? "#111" : "#bbb",
                  }}
                  onClick={() => onColorChange(c)}
                  title={c.toLowerCase()}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>

          {/* Tallas */}
          <div className="pdp-block">
            <div className="pdp-label">TALLA</div>
            <div className="pdp-sizes">
              {ALL_SIZES.map((sz) => {
                const enabled = !!colorData.variants[sz];
                const active = enabled && sz === size;
                return (
                  <button
                    key={sz}
                    disabled={!enabled}
                    onClick={() => enabled && onSizeChange(sz)}
                    className={`size-chip ${active ? "is-active" : ""}`}
                    aria-label={`Talla ${sz}`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <button className="pdp-cta" onClick={add} disabled={!canAdd}>
            {canAdd ? "Agregar al carrito" : "Sin stock"}
          </button>

          {/* Descripción */}
          <div className="pdp-accordion">
            <h4>Descripción</h4>
            <p>Camiseta tipo polo de algodón suave. Corte clásico. Ideal para uso diario.</p>

            <h4>Información del producto</h4>
            <ul>
              <li>Composición: 100% algodón</li>
              <li>Cuidados: lavar a máquina en frío</li>
              <li>Hecho en Colombia</li>
              <li>Familia: {Object.keys(data.colors)[0] || "—"}</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

