// src/components/ProductCatalogNuevo.jsx
import { useMemo } from 'react';
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

// ✅ Color -> sufijo EXACTO del archivo
const FILE_SUFFIX = {
  BLANCO: 'Blanca',
  NEGRO: 'Negra',
  BEIGE: 'Beige',
  ROJO: 'Roja',
};

export default function ProductCatalogNuevo() {
  const navigate = useNavigate();

  // Crear tarjetas fijas para los 4 colores de Boss Franja
  const cards = useMemo(() => {
    const colors = ['BLANCO', 'NEGRO', 'BEIGE', 'ROJO'];
    return colors.map((color) => {
      const suffix = FILE_SUFFIX[color]; // Blanca/Negra/Beige/Roja
      const path = `/products/BossFranja/bossFranjaFrente${suffix}.webp`;
      return {
        key: `BOSS-FRANJA-${color}`,
        color,
        name: 'Camiseta Hugo Boss con Franja',
        basePrice: 80000,
        image: resolveSrc(path),
        imageUpper: resolveSrc(path.replace('.webp', '.webp')), // fallback si la extensión está en mayúsculas
      };
    });
  }, []);

  function goDetail(card) {
    navigate('/producto/' + encodeURIComponent(card.key));
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
                  // 1) intenta .webp  2) si tampoco existe, usa /marcas.webp
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

        {cards.length === 0 && (
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
