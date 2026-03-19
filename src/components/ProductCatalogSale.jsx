import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addBundleToCart } from "../lib/cart";
import { api } from "../api";

const BASE_URL = import.meta?.env?.BASE_URL || "/";

function resolveSrc(src) {
  if (!src) return "/marcas.webp";
  if (/^https?:\/\//i.test(src)) return src;
  const cleanSrc = String(src).replace(/^\//, "");
  return `${BASE_URL.replace(/\/$/, "")}/${cleanSrc}`;
}

function ComboBuilder({ products }) {
  const navigate = useNavigate();
  const [bundleSize, setBundleSize] = useState(2);
  const [selection, setSelection] = useState([]);
  const [tempProduct, setTempProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("");

  useEffect(() => {
    setSelection([]);
  }, [bundleSize]);

  const multiplier = bundleSize === 2 ? 0.88 : 0.82;

  const handleSelect = (p) => {
    if (selection.length < bundleSize) {
      setTempProduct(p);
      setSelectedSize("");
    } 
  };

  const confirmSize = () => {
    if (!selectedSize) return alert("Por favor elige una talla");
    setSelection([...selection, { ...tempProduct, chosenSize: selectedSize }]);
    setTempProduct(null);
  };

  const handleAdd = async () => {
    try {
      if (selection.length < bundleSize) return;

      const itemsReq = selection.map((item) => ({
        sku: item.id,
        size: item.chosenSize,
      }));

      const { data } = await api.post("/api/combos/quote", {
        bundleSize,
        items: itemsReq,
      });

      const itemsForCart = selection.map((item, idx) => ({
        ...item,
        productId: data.items[idx].productId,
        sku: item.id,
        price: data.unitPrice,
        image: item.front,
        name: `${data.items[idx].name}`,
      }));

      addBundleToCart(itemsForCart, `${bundleSize} Pack`);
      alert(`¡Combo agregado!`);
      setSelection([]);
    } catch (e) {
      alert("Error al procesar el combo.");
    }
  };

  const totalActual = selection.reduce((acc, item) => acc + item.price, 0);

  return (
    <section className="combo-area">
      {tempProduct && (
        <div className="size-modal-overlay">
          <div className="size-modal">
            <h3 className="modal-title">Talla para {tempProduct.name}</h3>

            <div className="size-options">
              {["S", "M", "L", "XL"].map((size) => {
                const hasStock = !!tempProduct.variantIds[size];
                return (
                  <button
                    key={size}
                    className={selectedSize === size ? "active" : ""}
                    disabled={!hasStock}
                    onClick={() => setSelectedSize(size)}
                    style={!hasStock ? { opacity: 0.2, cursor: "not-allowed" } : {}}
                  >
                    {size}
                  </button>
                );
              })}
            </div>

            <div className="modal-actions">
              <button className="btn-back" onClick={() => setTempProduct(null)}>
                Cerrar
              </button>
              <button
                className="btn-add-modal"
                onClick={confirmSize}
                disabled={!selectedSize}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="combo-box">
        <div className="combo-controls">
          <div className="tabs">
            <button
              className={bundleSize === 2 ? "active" : ""}
              onClick={() => setBundleSize(2)}
            >
              Dúo (2)
            </button>
            <button
              className={bundleSize === 3 ? "active" : ""}
              onClick={() => setBundleSize(3)}
            >
              Triple (3)
            </button>
          </div>

          <h2 className="main-title">Arma tu Combo 🔥</h2>

          <div className="mini-previews">
            {selection.map((s, i) => (
              <div key={i} className="preview-item">
                <img src={s.front} alt="p" />
                <span className="size-badge">{s.chosenSize}</span>
              </div>
            ))}
            {Array.from({ length: bundleSize - selection.length }).map((_, i) => (
              <div key={i} className="preview-placeholder" />
            ))}
          </div>

          <div className="total-card">
            <h3 className="price-tag">
              ${Number(totalActual * multiplier).toLocaleString("es-CO")}
            </h3>
            <button
              className="cta-buy-main"
              disabled={selection.length < bundleSize}
              onClick={handleAdd}
            >
              AGREGAR AL CARRITO
            </button>
          </div>

          {/* ✅ En vez de repetir abajo, dejamos un botón directo */}
          <div style={{ marginTop: 18 }}>
            <button
              className="cta-buy-main"
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
              onClick={() => navigate("/hombre")}
            >
              Ver catálogo completo →
            </button>
          </div>
        </div>

        <div className="combo-items-grid custom-scrollbar">
          {products.map((p) => (
            <div key={p.id} className="big-tile" onClick={() => handleSelect(p)}>
              <div className="img-container">
                <img src={p.front} alt={p.name} loading="lazy" />
              </div>
              <div className="tile-txt">
                <p className="n">{p.name}</p>
                <p className="p">${Number(p.price).toLocaleString("es-CO")}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function ProductCatalogSale() {
  const [rawItems, setRawItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/products?limit=250")
      .then((res) => setRawItems(res.data.items || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const finalTiles = useMemo(() => {
    const fams = {};
    for (const p of rawItems) {
      if (!fams[p.sku]) {
        fams[p.sku] = {
          id: p.sku,
          name: p.name,
          price: p.price,
          img: p.image || (p.images && p.images[0]),
          variantIds: {},
        };
      }
      const v = String(p.variant || "").trim().toUpperCase();
      if (v && p.available_stock > 0) {
        fams[p.sku].variantIds[v] = String(p._id);
      }
    }
    return Object.values(fams).map((v) => ({
      ...v,
      front: resolveSrc(v.img),
    }));
  }, [rawItems]);

  return (
    <main className="sale-page">
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <div className="top-banner">
        <span className="marquee">
          ENVÍOS A TODO EL PAÍS • DÚO 12% OFF • TRIPLE 18% OFF • TOOSHOPPER 🔥
        </span>
      </div>

      {!loading ? (
        <ComboBuilder products={finalTiles} />
      ) : (
        <p style={{ textAlign: "center", padding: 50 }}>Cargando...</p>
      )}
    </main>
  );
}

const styles = `
  /* 1. VARIABLES Y BASE */
  :root { 
    --fucsia: #e11d48; 
    --green: #22c55e; 
    --bg-blue: #0f172a; 
    --card-bg: #1e293b; 
  }

  .sale-page { 
    background: var(--bg-blue); 
    color: #fff; 
    min-height: 100vh; 
    padding: 20px; 
    font-family: 'Inter', sans-serif, system-ui; 
  }

  /* 2. BANNER CON MOVIMIENTO */
  .top-banner { 
    background: var(--fucsia); 
    padding: 10px; 
    font-weight: bold; 
    overflow: hidden; 
    border-radius: 12px; 
    margin-bottom: 20px; 
  }
  .marquee { 
    display: inline-block; 
    padding-left: 100%; 
    animation: marquee 15s linear infinite; 
    white-space: nowrap; 
  }
  @keyframes marquee { 0% { transform: translate(0, 0); } 100% { transform: translate(-100%, 0); } }

  /* 3. CONTENEDOR PRINCIPAL (COMBO BOX) */
  .combo-box { 
    display: grid; 
    grid-template-columns: 400px 1fr; /* Ancho fijo para la foto en PC */
    gap: 40px; 
    background: var(--card-bg); 
    padding: 35px; 
    border-radius: 30px; 
    max-width: 1200px; 
    margin: 0 auto;
    align-items: start;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  }

  /* 4. IMAGEN DE REFERENCIA (Aquí corregimos que se vea completa) */
  .img-container { 
    width: 100%; 
    aspect-ratio: 1 / 1.2; /* Un poco más vertical para prendas */
    overflow: hidden; 
    border-radius: 20px; 
    background: #000; 
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .img-container img { 
    width: 100%; 
    height: 100%; 
    object-fit: contain; /* Esto hace que la camiseta se vea completa sin cortes */
    background: #000;
  }

  /* 5. TABS Y BOTONES DE COMPRA */
  .tabs { display: flex; gap: 10px; margin-bottom: 20px; }
  .tabs button { 
    flex: 1; 
    padding: 14px; 
    border-radius: 12px; 
    border: none; 
    background: #0f172a; 
    color: #fff; 
    cursor: pointer; 
    font-weight: bold;
    transition: 0.3s;
  }
  .tabs button.active { background: var(--fucsia); }

  .cta-buy-main { 
    width: 100%; 
    padding: 20px; 
    border-radius: 16px; 
    border: none; 
    background: var(--green); 
    color: #fff; 
    font-weight: bold; 
    font-size: 1.1rem;
    cursor: pointer; 
    transition: transform 0.2s;
  }
  .cta-buy-main:active { transform: scale(0.98); }

  /* 6. GRILLA DE REFERENCIAS (Lado derecho en PC) */
  .combo-items-grid { 
    display: grid; 
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); 
    gap: 15px; 
    max-height: 650px; 
    overflow-y: auto; 
    padding-right: 10px;
  }

  .big-tile { 
    background: #0f172a; 
    border-radius: 18px; 
    cursor: pointer; 
    transition: 0.3s; 
    overflow: hidden; 
    border: 2px solid transparent;
  }
  .big-tile:hover { border-color: var(--fucsia); transform: translateY(-3px); }
  
  .tile-txt { padding: 12px; text-align: center; font-size: 13px; }
  .tile-txt .p { color: var(--fucsia); font-weight: bold; margin-top: 5px; }

  /* 7. MODAL DE TALLAS (Corregido para PC) */
  .size-modal-overlay { 
    position: fixed; 
    inset: 0; 
    background: rgba(0,0,0,0.85); 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    z-index: 9999; 
    backdrop-filter: blur(5px);
  }
  .size-modal { 
    background: var(--card-bg); 
    padding: 40px; 
    border-radius: 30px; 
    border: 1px solid var(--fucsia); 
    text-align: center; 
    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
    max-width: 90%;
  }
  .size-options { margin: 20px 0; }
  .size-options button { 
    width: 65px; 
    height: 65px; 
    margin: 8px; 
    border-radius: 15px; 
    cursor: pointer; 
    font-weight: bold; 
    font-size: 1.1rem;
    background: #fff;
    color: #000;
    border: 2px solid transparent;
    transition: 0.2s;
  }
  .size-options button.active { 
    background: var(--fucsia); 
    color: #fff; 
    border-color: #fff;
  }

  /* 8. PREVIEWS Y OTROS */
  .mini-previews { display: flex; gap: 10px; margin: 20px 0; justify-content: center; }
  .preview-item, .preview-placeholder { 
    width: 70px; height: 70px; border-radius: 12px; border: 1px solid var(--fucsia); 
    position: relative; overflow: hidden;
  }
  .preview-item img { width: 100%; height: 100%; object-fit: cover; }
  .size-badge { 
    position: absolute; bottom: 0; right: 0; background: var(--fucsia); 
    color: white; font-size: 11px; padding: 2px 6px; font-weight: bold;
  }

  /* 9. RESPONSIVE (CELULAR) */
  @media (max-width: 850px) {
    .combo-box { 
      grid-template-columns: 1fr; 
      padding: 15px; 
      gap: 20px;
    }
    .img-container { aspect-ratio: 1/1; }
    .combo-controls { order: 1; }
    .combo-items-grid { 
      order: 2; 
      max-height: 450px; 
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    }
    .size-modal { padding: 25px; }
    .size-options button { width: 55px; height: 55px; }
  }

  /* SCROLLBAR PERSONALIZADA */
  .custom-scrollbar::-webkit-scrollbar { width: 6px; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--fucsia); border-radius: 10px; }
`;