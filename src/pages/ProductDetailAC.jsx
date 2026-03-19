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
  BEIGE: "#965428",
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

// ✅ id real de mongo aunque venga como _id o id
function getMongoId(p) {
  return String((p && (p._id || p.id || p.productId || p.variantId)) || "");
}

// ✅ imágenes aunque vengan como images o image
function getImages(p) {
  if (p && Array.isArray(p.images) && p.images.length) return p.images;
  if (p && p.image) return [p.image];
  return [];
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

  /** ======= Carga del catálogo DESDE MONGO (API) ======= */
  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      try {
        const r = await fetch("/api/products?limit=250", { cache: "no-store" });
        if (!r.ok) throw new Error("No OK");
        const j = await r.json();
        const arr = Array.isArray(j) ? j : (Array.isArray(j && j.items) ? j.items : []);
        if (alive) setItems(Array.isArray(arr) ? arr : []);
      } catch {
        if (alive) setItems([]);
      }
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

    // ✅ busca por _id o id
    const exact = items.find((p) => getMongoId(p) === idStr);

    // Si viene exacto, familia por SKU de ese producto; si no, intenta interpretar el id como "family"
    const famKey = exact ? familyFromSku(exact.sku) : familyFromSku(idStr);

    let famItems = items.filter((p) => familyFromSku(p.sku) === famKey);

    if (!famItems.length) {
      // fallback: por si la ruta es prefijo del SKU
      famItems = items.filter((p) =>
        String(p.sku || "").toUpperCase().startsWith(idStr.toUpperCase())
      );
      if (!famItems.length) return null;
    }

    const rawName = (famItems[0] && famItems[0].name) ? famItems[0].name : "Producto";
    const name = stripColorWords(baseName(rawName)); // título sin color
    const colors = {}; // { [color]: { variants: { [size]: item }, images: [] } }
    let price = 0;

    for (let i = 0; i < famItems.length; i++) {
      const p = famItems[i];
      const c = colorFromSkuOrName(p);
      const sz = String((p && (p.variant || p.size)) || "ÚNICA").toUpperCase();

      if (!colors[c]) colors[c] = { variants: {}, images: [] };
      colors[c].variants[sz] = p;
      price = p && p.price != null ? p.price : price;

      const imgs = getImages(p);
      for (let k = 0; k < imgs.length; k++) {
        const src = imgs[k];
        if (src && colors[c].images.indexOf(src) === -1) colors[c].images.push(src);
      }
    }

    // selección inicial
    let initColor = Object.keys(colors)[0] || "";
    let initSize = "";

    if (exact) {
      initColor = colorFromSkuOrName(exact);
      initSize = String((exact && (exact.variant || exact.size)) || "ÚNICA").toUpperCase();
    } else if (initColor) {
      const sizes = Object.keys((colors[initColor] && colors[initColor].variants) || {});
      if (sizes.length) {
        initSize = sizes[0];
        for (let s = 0; s < sizes.length; s++) {
          const key = sizes[s];
          const av = ((colors[initColor].variants[key] && colors[initColor].variants[key].available_stock) || 0);
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
      : (current ? getImages(current) : [])) || [];

  // Ahora revisamos que el producto exista Y que tenga stock disponible
const canAdd = current && current.available_stock > 0;

  function onColorChange(c) {
    setColor(c);
    const sizes = Object.keys((data.colors[c] && data.colors[c].variants) || {});
    let first = sizes.length ? sizes[0] : "";
    for (let i = 0; i < sizes.length; i++) {
      const key = sizes[i];
      const av = (data.colors[c].variants[key] && data.colors[c].variants[key].available_stock) || 0;
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

    const pid = getMongoId(current);
    if (!pid) {
      alert("Este producto no tiene ID válido en Mongo.");
      return;
    }

    const img =
      (images && images[0]) ||
      (Array.isArray(current.images) ? current.images[0] : "") ||
      current.image ||
      "";

    const variant = String((current.variant || current.size || size || "")).toUpperCase();

    addToCart(
      {
        _id: pid,
        id: pid,
        productId: pid,
        sku: current.sku || null,
        variant: variant || null,
        size: variant || "",
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
  {canAdd ? "Agregar al carrito" : "Agotado"}
</button>

          {/* Descripción */}
          <div className="pdp-accordion">
            <h4>Descripción</h4>
            <p>
              Camiseta confeccionada en algodón peruano de alta suavidad.
              Corte clásico y cómodo, ideal para uso diario.
            </p>

            <h4>Información del producto</h4>
            <ul>
              <li>Composición: 100% algodón Jersey peruano</li>
              <li>Cuidados: lavar a máquina en frío</li>
              <li>Corte clásico</li>
              <li>Familia: {Object.keys(data.colors)[0] || "—"}</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}