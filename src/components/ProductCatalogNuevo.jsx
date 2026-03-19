// src/components/ProductCatalogNuevo.jsx
import { useEffect, useMemo, useState } from 'react';
import './ProductCatalogNuevo.css';
import { useNavigate } from 'react-router-dom';

// Resolver rutas respetando el BASE_URL de Vite
const BASE_URL = import.meta?.env?.BASE_URL || import.meta.env.BASE_URL || '/';
function resolveSrc(src) {
  if (!src) return null;
  if (/^https?:\/\//i.test(src)) return src;
  const base = String(BASE_URL || '/').replace(/\/$/, '');
  const path = String(src).replace(/^\//, '');
  return `${base}/${path}`;
}

// Formato moneda COP
const currency = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

// Color -> color chip
const COLOR_HEX = {
  BLANCO: '#ffffff',
  NEGRO: '#000000',
  BEIGE: '#D6D3D1',
  ROJO: '#B91C1C',
};

// ✅ Color -> sufijo EXACTO del archivo (fallback si no hay imágenes en Mongo)
const FILE_SUFFIX = {
  BLANCO: 'Blanca',
  NEGRO: 'Negra',
  BEIGE: 'Beige',
  ROJO: 'Roja',
};

function normalizeColorFromSkuOrName(p) {
  const sku = String(p?.sku || '').toUpperCase();
  const name = String(p?.name || '').toUpperCase();

  // intenta por palabras en nombre
  if (name.includes('BLANCO') || name.includes('BLANCA')) return 'BLANCO';
  if (name.includes('NEGRO') || name.includes('NEGRA')) return 'NEGRO';
  if (name.includes('BEIGE')) return 'BEIGE';
  if (name.includes('ROJO') || name.includes('ROJA')) return 'ROJO';

  // intenta por sufijo en sku (por si tu sku tiene -NEGRO, -BLANCO etc.)
  const tail = sku.split('-').pop();
  if (tail.includes('BLANCO') || tail.includes('BLANCA')) return 'BLANCO';
  if (tail.includes('NEGRO') || tail.includes('NEGRA')) return 'NEGRO';
  if (tail.includes('BEIGE')) return 'BEIGE';
  if (tail.includes('ROJO') || tail.includes('ROJA')) return 'ROJO';

  return null;
}

function getImages(p) {
  if (Array.isArray(p?.images) && p.images.length) return p.images;
  if (p?.image) return [p.image];
  return [];
}

function getMongoId(p) {
  return String(p?._id || p?.id || p?.productId || p?.variantId || '');
}

export default function ProductCatalogNuevo() {
  const navigate = useNavigate();

  const [rawItems, setRawItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  async function loadProducts(signal) {
    setLoading(true);
    setErr('');

    try {
      const r = await fetch('/api/products?limit=250', { cache: 'no-store', signal });
      if (!r.ok) throw new Error('No OK');
      const j = await r.json();
      const arr = Array.isArray(j) ? j : (Array.isArray(j?.items) ? j.items : []);
      setRawItems(Array.isArray(arr) ? arr : []);
    } catch {
      setRawItems([]);
      setErr('No se pudieron cargar los productos desde /api/products.');
    }

    setLoading(false);
  }

  useEffect(() => {
    const ac = new AbortController();
    loadProducts(ac.signal);
    return () => ac.abort();
  }, []);

  // Crear tarjetas para los 4 colores, pero usando Mongo (id real)
  const cards = useMemo(() => {
    const colors = ['BLANCO', 'NEGRO', 'BEIGE', 'ROJO'];

    // Filtra productos de Boss Franja desde Mongo
    const bossFranja = rawItems.filter((p) => {
      const sku = String(p?.sku || '').toUpperCase();
      const name = String(p?.name || '').toUpperCase();
      return sku.includes('BOSS-FRANJA') || name.includes('BOSS') && name.includes('FRANJA');
    });

    // Agrupa por color, escogiendo un producto representativo con _id real
    const byColor = {};
    for (const p of bossFranja) {
      const color = normalizeColorFromSkuOrName(p);
      if (!color) continue;

      const stock = Number(p?.available_stock ?? 0);
      const pid = getMongoId(p);
      if (!pid) continue;

      // si ya hay uno, preferimos el que tenga stock > 0
      if (!byColor[color]) {
        byColor[color] = p;
      } else {
        const prevStock = Number(byColor[color]?.available_stock ?? 0);
        if (prevStock <= 0 && stock > 0) byColor[color] = p;
      }
    }

    // Construye las 4 cards fijas (con fallback a imágenes estáticas si Mongo no trae)
    return colors.map((color) => {
      const p = byColor[color] || null;

      const suffix = FILE_SUFFIX[color]; // Blanca/Negra/Beige/Roja
      const fallbackPath = `/products/BossFranja/bossFranjaFrente${suffix}.webp`;

      const imgs = p ? getImages(p) : [];
      const img0 = imgs[0] || resolveSrc(fallbackPath);

      return {
        key: `BOSS-FRANJA-${color}`,
        color,
        name: 'Camiseta Hugo Boss con Franja',
        basePrice: 70000, // ✅ CAMBIO: ahora 70.000
        image: img0,
        imageUpper: img0, // mismo fallback
        productId: p ? getMongoId(p) : null, // ✅ ID REAL de Mongo (si existe)
      };
    });
  }, [rawItems]);

  function goDetail(card) {
    // ✅ si hay productId real, navegamos al detalle real
    if (card?.productId) {
      navigate('/producto/' + encodeURIComponent(card.productId));
      return;
    }
    // si no hay ID (no se encontró en Mongo), no navegamos a una ruta “inventada”
    alert('Este producto no está cargado en la base de datos (Mongo) todavía.');
  }

  return (
    <section
      className="product-catalog-hombre"
      style={{ padding: 20, textAlign: 'center' }}
    >
      <h2 style={{ marginBottom: 12 }}>Camiseta Hugo Boss con Franja</h2>
      <p style={{ marginBottom: 24, color: '#666' }}>
        Selecciona el color deseado
      </p>

      {loading && <p>Cargando productos…</p>}
      {!loading && err && <p style={{ color: 'crimson' }}>{err}</p>}

      <div
        className="product-list"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 20,
        }}
      >
        {cards.map((card) => (
          <article
            key={card.key}
            className="product-card"
            style={{
              border: '1px solid #ddd',
              borderRadius: 12,
              padding: 12,
              width: 240,
              display: 'flex',
              flexDirection: 'column',
              cursor: 'pointer',
              background: '#fff',
            }}
            onClick={() => goDetail(card)}
          >
            <div
              style={{
                width: '100%',
                height: 200,
                background: '#fff',
                borderRadius: 10,
                overflow: 'hidden',
                border: '1px solid #eee',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={card.image}
                alt={`${card.name} ${card.color}`}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                loading="lazy"
                onError={(e) => {
                  // 1) intenta fallback  2) si tampoco existe, usa /marcas.webp
                  if (e.currentTarget.src !== card.imageUpper) {
                    e.currentTarget.src = card.imageUpper || '';
                  } else {
                    e.currentTarget.src = resolveSrc('/marcas.webp') || '';
                  }
                }}
              />
            </div>

            <h3 style={{ margin: '8px 0', fontSize: 18, minHeight: 44 }}>
              {card.name}
            </h3>

            <div style={{ fontWeight: 700, marginBottom: 8 }}>
              {currency.format(card.basePrice || 0)}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <span
                title={card.color?.toLowerCase?.() || ''}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  border: '1px solid #bbb',
                  background: COLOR_HEX[card.color] || '#ddd',
                }}
              />
            </div>
          </article>
        ))}

        {!loading && !err && cards.length === 0 && (
          <div
            style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              opacity: 0.8,
            }}
          >
            No hay productos disponibles por ahora.
          </div>
        )}
      </div>
    </section>
  );
}