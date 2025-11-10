// src/components/FeaturedProducts.jsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './FeaturedProducts.css';

// ===== helpers =====
function familyFromSku(sku) {
  const parts = String(sku || '').split('-');
  return parts.length >= 2
    ? (parts[0] + '-' + parts[1]).toUpperCase()
    : String(sku || '').toUpperCase();
}
function firstImage(p) {
  if (p && p.image) return p.image;
  if (p && Array.isArray(p.images) && p.images.length) return p.images[0];
  return null;
}
function productPath(p) {
  if (p && p.sku) return '/producto/' + familyFromSku(p.sku);
  if (p && p._id) return '/producto/' + String(p._id);
  if (p && p.id)  return '/producto/' + String(p.id);
  return '/nuevo';
}
// 🔹 quitar paréntesis como "(M)", "(L)", "(XL)" del nombre mostrado
function cleanName(name) {
  return String(name || '')
    .replace(/\s*\([^()]*\)\s*/g, ' ') // elimina cualquier "(...)"
    .replace(/\s{2,}/g, ' ')           // compacta espacios dobles
    .trim();
}
// ====================

export default function FeaturedProducts() {
  const navigate = useNavigate();
  const [allItems, setAllItems] = useState([]);
  const [items, setItems] = useState([]);     // ← solo las 5 tarjetas finales
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let alive = true;
    (async function () {
      try {
        setLoading(true);
        setErr('');

        // cargar desde el mismo JSON que usa tu ProductDetailAC
        const sources = ['/products.json', '/products/products.json', '/data/products.json'];
        let ok = false;
        for (let i = 0; i < sources.length; i++) {
          try {
            const r = await fetch(sources[i], { cache: 'no-store' });
            if (!r.ok) continue;
            const j = await r.json();
            const arr = Array.isArray(j) ? j : (j && Array.isArray(j.items) ? j.items : []);
            if (arr && arr.length) {
              if (alive) setAllItems(arr);
              ok = true;
              break;
            }
          } catch {
            // probar siguiente
          }
        }
        if (!ok && alive) setErr('No se pudieron cargar los productos');
      } catch {
        if (alive) setErr('Error inesperado');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // seleccionar exactamente las 5 referencias pedidas (preferir variante M si existe)
  useEffect(() => {
    if (!allItems.length) return;

    // SKUs objetivo (los que nos pasaste en tu JSON)
    const TARGETS_IN_ORDER = [
      'POLO-BASICA-BLANCO', // RL blanca
      'POLO-BASICA-AZUL',   // RL azul (oscuro)
      'BOSS-BASICA-NEGRO',  // Boss negra
      'BOSS-BASICA-BLANCO', // Boss blanca
      'BOSS-BASICA-AZUL'    // Boss azul
    ];

    function pickOneBySkuPreferM(arr, sku) {
      const list = arr.filter(p => String(p.sku || '').toUpperCase() === sku);
      if (!list.length) return null;
      // preferimos variante M si existe, si no la primera
      const m = list.find(p => String(p.variant || '').toUpperCase() === 'M');
      return m || list[0];
    }

    const selected = [];
    for (const sku of TARGETS_IN_ORDER) {
      const item = pickOneBySkuPreferM(allItems, sku);
      if (item) selected.push(item);
    }

    setItems(selected.slice(0, 5));
  }, [allItems]);

  return (
    <section className="featured-products" aria-labelledby="featured-title">
      <h2 id="featured-title" className="title">Productos Destacados</h2>

      {loading && <p style={{ textAlign: 'center' }}>Cargando productos…</p>}
      {err && !loading && <p style={{ textAlign: 'center', color: 'crimson' }}>{err}</p>}

      {!loading && !err && (
        <div className="products-grid">
          {items.map((p) => {
            const img = firstImage(p);
            const to = productPath(p);
            const title = cleanName(p?.name); // ← ✅ nombre sin talla

            return (
              <article className="product-card" key={p?._id || p?.id || p?.sku}>
                {/* Imagen clickeable */}
                <Link to={to} aria-label={`Ver ${title}`} className="image-wrap">
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '1 / 1',
                      background: '#f3f3f3',
                      borderRadius: 8,
                      marginBottom: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      color: '#888',
                      overflow: 'hidden'
                    }}
                  >
                    {img ? (
                      <img
                        src={img}
                        alt={title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        loading="lazy"
                      />
                    ) : (
                      'Sin imagen'
                    )}
                  </div>
                </Link>

                {/* Título clickeable SIN talla */}
                <h3 style={{ marginBottom: 10 }}>
                  <Link to={to} className="product-link">{title}</Link>
                </h3>

                {/* ✅ SIN precio, SIN talla */}

                {/* Botón “Ver más” que navega */}
                <button
                  type="button"
                  className="btn-more"
                  onClick={() => navigate(to)}
                  aria-label={`Ver más de ${title}`}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #111',
                    background: '#111',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Ver más
                </button>
              </article>
            );
          })}

          {items.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', opacity: 0.8 }}>
              No hay productos destacados todavía.
            </div>
          )}
        </div>
      )}
    </section>
  );
}
