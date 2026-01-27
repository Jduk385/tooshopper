// ProductCatalogSale.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// Respeta BASE_URL de Vite
const BASE_URL = import.meta?.env?.BASE_URL || "/";
function resolveSrc(src) {
  if (!src) return null;
  if (/^https?:\/\//i.test(src)) return src;
  const base = BASE_URL.replace(/\/$/, "");
  const path = String(src).replace(/^\//, "");
  return `${base}/${path}`;
}

const USE_DEMO_FALLBACK = true;

export default function ProductCatalogSale() {
  const navigate = useNavigate();
  const [rawItems, setRawItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Countdown
  const target = useMemo(() => new Date("2025-11-28T00:00:00-05:00"), []);
  const [remaining, setRemaining] = useState(getRemaining(target));
  useEffect(() => {
    const id = setInterval(() => setRemaining(getRemaining(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  // Carga productos
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      setLoading(true); setErr("");
      const candidates = ["/products.json","/products/products.json","/data/products.json"];
      let ok = false;
      for (const url of candidates) {
        try {
          const r = await fetch(url, { cache: "no-store", signal: ac.signal });
          if (!r.ok) continue;
          const j = await r.json();
          const arr = Array.isArray(j) ? j : (Array.isArray(j?.items) ? j.items : []);
          if (!arr?.length) continue;
          setRawItems(arr); ok = true; break;
        } catch (e) {
          if (e?.name === "AbortError") break;
          console.warn("Failed to fetch", url, e);
        }
      }
      if (!ok && USE_DEMO_FALLBACK) setRawItems(DEMO_ITEMS);
      if (!ok && !USE_DEMO_FALLBACK) setErr("No se pudieron cargar los productos.");
      setLoading(false);
    })();
    return () => ac.abort();
  }, []);

  // Agrupación + filtro “básicas”
  const basicsTiles = useMemo(() => {
    const fams = {};
    for (const p of rawItems) {
      const fam = familyFromSku(p.sku);
      if (!fams[fam]) fams[fam] = { name: niceName(p.name), variants: [], images: [] };
      const variantId = p._id || `${p.sku}-${String(p.variant || "ÚNICA").toUpperCase()}`;
      const images = Array.isArray(p.images) ? p.images : [];
      fams[fam].variants.push({ id: variantId, price: p.price ?? 0, images, stock: p.available_stock ?? 0 });
      for (const s of images) if (s && !fams[fam].images.includes(s)) fams[fam].images.push(s);
    }
    return Object.entries(fams)
      .filter(([, v]) => /básica|basica|clásica|clasica/i.test(v.name || ""))
      .map(([famKey, v]) => {
        const withStock = v.variants.find(x => (x.stock ?? 0) > 0) || v.variants[0];
        const idForDetail = withStock?.id || famKey;
        const front = resolveSrc(v.images[0]) || resolveSrc("/marcas.webp");
        const back  = resolveSrc(v.images[1]) || front;
        const price = Math.min(...v.variants.map(x => x.price || 0).filter(Boolean)) || (withStock?.price || 0);
        return { id: idForDetail, name: v.name, price, front, back };
      })
      .sort((a,b) => a.name.localeCompare(b.name,"es"));
  }, [rawItems]);

  // Inyecciones manuales
  const withoutLacoste = useMemo(
    () => basicsTiles.filter(p => !/lacoste/i.test(p.name)),
    [basicsTiles]
  );
  const bossFranja = useMemo(() => ({
    id: "BOSS-FRANJA-1",
    name: "Camiseta Hugo Boss con Franja Negra",
    price: 80000,
    front: resolveSrc("/products/BossFranja/bossFranjaFrenteNegra.webp") || resolveSrc("/marcas.webp"),
    back:  resolveSrc("/products/BossFranja/bossFranjaAtrasNegra.webp") || resolveSrc("/products/BossFranja/bossFranjaFrenteNegra.webp") || resolveSrc("/marcas.webp"),
  }), []);
  const finalTiles = useMemo(() => {
    const merged = [bossFranja, ...withoutLacoste];
    const seen = new Set();
    return merged.filter(p => (seen.has(p.id) ? false : (seen.add(p.id), true)));
  }, [bossFranja, withoutLacoste]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="sale-page">
      {/* CSS embebido (unificado) */}
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      {/* Barra promo */}
      <div className="promo-bar" role="status" aria-live="polite">
        <span className="promo-pill">HOT SALE</span>
        <strong>Hasta 60% OFF</strong>
        <span className="divider">•</span>
        {remaining.totalMs > 0
          ? <span className="countdown">Termina en {fmtTime(remaining)}</span>
          : <span className="countdown">¡Últimas unidades!</span>}
      </div>

      {/* Hero */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <h1>SALE</h1>
            <p>Descuentos reales en referencias seleccionadas. Paga contraentrega, Nequi, Daviplata o tarjeta.</p>
            <ul className="hero-bullets">
              <li>Envíos rápidos en Colombia</li>
              <li>Calidad verificada Tooshopper</li>
              <li>Cambios fáciles</li>
            </ul>
          </div>
          <div className="hero-card">
            <span className="badge">Ofertas Especiales</span>
            <div className="price-row">
              <h3 style={{margin: 0}}>¡Hasta 25% de descuento!</h3>
            </div>
            <button className="cta" onClick={() => scrollTo("sale-grid")}>Ver Ofertas</button>
            <p className="mini">Stock limitado — productos seleccionados.</p>
          </div>
        </div>
      </section>

      {/* GRID */}
      <section id="sale-grid" className="grid" aria-live="polite">
        {loading && <div className="skeleton-grid">{Array.from({length:8}).map((_,i)=><div className="skeleton" key={i} />)}</div>}
        {!loading && err && <div className="empty"><h3>Error</h3><p>{err}</p></div>}
        {!loading && !err && finalTiles.length===0 && <div className="empty"><h3>Sin resultados</h3><p>No hay productos en promoción.</p></div>}

        {!loading && finalTiles.length>0 && (
          <div className="cards">
            {finalTiles.map((p)=>(
              <article key={p.id} className="sale-card">
                <div
                  className="sale-media"
                  title="Ver detalles"
                  onClick={() => navigate("/producto/"+encodeURIComponent(p.id))}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e)=>{ if(e.key==="Enter") navigate("/producto/"+encodeURIComponent(p.id)); }}
                >
                  <img
                    className="img front"
                    src={p.front}
                    alt={p.name}
                    loading="lazy"
                    onError={(e)=>{ e.currentTarget.src = resolveSrc("/marcas.webp"); }}
                  />
                  <img
                    className="img back"
                    src={p.back || p.front}
                    alt={p.name}
                    loading="lazy"
                    onError={(e)=>{ e.currentTarget.src = p.front || resolveSrc("/marcas.webp"); }}
                  />
                </div>

                <div className="sale-info">
                  <h3 className="title" onClick={() => navigate("/producto/"+encodeURIComponent(p.id))}>
                    {p.name}
                  </h3>

                  <div className="price-row">
                    <div className="price">{fmtCOP(p.price)}</div>
                    <div className="original-price">{fmtCOP(Math.round(p.price / 0.75))}</div>
                  </div>

                  <button className="cta small" onClick={() => navigate("/producto/"+encodeURIComponent(p.id))}>
                    Ver producto
                  </button>
                </div>

                <div className="discount-badge">25% OFF</div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Trust */}
      <section className="trust">
        <div className="trust-row">
          <div className="trust-item"><span className="trust-icon">🛡️</span> Pagos seguros</div>
          <div className="trust-item"><span className="trust-icon">🚚</span> Envío nacional</div>
          <div className="trust-item"><span className="trust-icon">🔁</span> Cambios sencillos</div>
          <div className="trust-item"><span className="trust-icon">💬</span> WhatsApp Business</div>
        </div>
      </section>

      {/* Footer */}
      <section className="footer-cta">
        <div className="footer-inner">
          <div>
            <h2>¿Listo para renovar el closet?</h2>
            <p>Fotos reales y envíos rápidos a todo Colombia.</p>
          </div>
          <a className="cta secondary" href="/checkout">Ir a pagar</a>
        </div>
      </section>
    </main>
  );
}

/* ===== Helpers ===== */
function fmtCOP(n){ try{ return new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(n||0);}catch{ return `COP ${Math.round(n||0).toLocaleString("es-CO")}`}}
function getRemaining(t){const now=new Date();const d=Math.max(0,t-now);const s=Math.floor(d/1000);return{days:Math.floor(s/86400),hrs:Math.floor((s%86400)/3600),mins:Math.floor((s%3600)/60),secs:s%60,totalMs:d}}
function fmtTime(r){ if(r.totalMs<=0) return "Finalizó"; return `${r.days}d ${String(r.hrs).padStart(2,"0")}:${String(r.mins).padStart(2,"0")}:${String(r.secs).padStart(2,"0")}`;}
const COLOR_HEX = { BLANCA:"#fff", BLANCO:"#fff", AZUL:"#031a42", "AZUL OSCURO":"#031a42", NEGRA:"#000", NEGRO:"#000", ROJA:"#B91C1C", VERDE:"#0f4d2f", "VERDE OSCURO":"#0f4d2f", BEIGE:"#D6D3D1", GRIS:"#9CA3AF" };
const COLOR_WORDS = Object.keys(COLOR_HEX);
function stripParen(t){return String(t||"").replace(/\s*\(.*?\)\s*$/,"").trim()}
function stripColorWords(t){const re=new RegExp(`\\b(${COLOR_WORDS.join("|")})\\b`,"gi");return String(t||"").replace(re," ").replace(/\s{2,}/g," ").trim()}
function niceName(n){return stripColorWords(stripParen(n))}
function familyFromSku(sku){const p=String(sku||"").split("-");return p.length>=2?`${p[0]}-${p[1]}`.toUpperCase():String(sku||"").toUpperCase()}

/* ===== Demo ===== */
const DEMO_ITEMS = [
  { _id:"BOSS-BASICA-1-M", sku:"BOSS-BASICA-1-NEGRA", name:"Camiseta Hugo Boss Básica Negra", price:70000, images:["/products/BossBasica/BossBasicaFrenteNegra.webp","/products/BossBasica/BossBasicaEspaldaNegra.webp"], variant:"M", available_stock:4 },
  { _id:"LACOSTE-POLO-1-M", sku:"LACOSTE-POLO-1-AZUL", name:"Camiseta Polo Lacoste Clásica Azul", price:70000, images:["/products/LacostePoloClasica/LacosteAzul.webp","/products/LacostePoloClasica/LacosteAzul2.webp"], variant:"M", available_stock:3 },
  { _id:"RALPH-BASICA-1-M", sku:"RALPH-BASICA-1-BLANCA", name:"Camiseta Ralph Lauren Básica Blanca", price:90000, images:["/products/RalphBasica/RalphBlanca.webp","/products/RalphBasica/RalphBlanca2.webp"], variant:"M", available_stock:2 },
];

/* ===== CSS unificado (sin sale.css) ===== */
const styles = String.raw`
:root{ --bg:#0a0a0b; --card:#121216; --ink:#f6f7fb; --muted:#7a7a85; --line:#23232a; --accent:#e11d48; }

/* Seguridad anti-scroll lateral SOLO para esta página */
.sale-page { overflow-x: hidden; max-width: 100vw; }
.sale-page * { box-sizing: border-box; }

/* Promo bar / hero */
body{margin:0;background:var(--bg);color:var(--ink);font-family:Inter, system-ui, Segoe UI, Helvetica, Arial, sans-serif}
.sale-page{display:flex;flex-direction:column;gap:24px}
.promo-bar{position:sticky;top:0;z-index:40;display:flex;align-items:center;gap:12px;padding:10px 16px;background:#0f0f14cc;border-bottom:1px solid var(--line);backdrop-filter: blur(6px)}
.promo-pill{background:var(--accent);color:#fff;padding:4px 10px;border-radius:999px;font-weight:700;font-size:12px}
.divider{opacity:.5}
.countdown{color:#c8c8d2}
.hero{padding:24px; max-width:100vw;}
.hero-inner{display:grid;gap:24px;grid-template-columns:1.2fr .8fr;align-items:stretch;background:linear-gradient(180deg,#0b0b11 0%, #0a0a0b 100%);border:1px solid var(--line);border-radius:20px;overflow:hidden}
.hero-copy{padding:28px}
.hero-copy h1{margin:0 0 6px 0;font-size:44px;letter-spacing:-.02em}
.hero-copy p,.hero-bullets{color:#cfd0d8}
.hero-card{padding:24px;border-left:1px solid var(--line);display:flex;flex-direction:column;justify-content:center;background:#0d0d12}
.hero-card .badge{align-self:flex-start;background:#111827;color:#cbd5e1;border:1px solid #1f2937;padding:6px 10px;border-radius:999px;font-size:12px;margin-bottom:8px}
.price-row{display:flex;align-items:baseline;gap:10px}
.price{font-size:34px;font-weight:800;color:#e5e7eb}
.compare{text-decoration:line-through;color:#9ca3af}
.cta{cursor:pointer;border:0;padding:12px 16px;border-radius:12px;background:var(--accent);color:white;font-weight:700;text-decoration:none;display:inline-block}
.cta.secondary{background:transparent;border:1px solid #30303a}
.mini{margin:8px 0 0 0;color:#a1a1aa;font-size:12px}

/* Grid */
.grid{padding:0 24px 24px; max-width:100vw;}
.cards{
  display:grid;
  gap:24px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  max-width: 1200px;
  margin: 48px auto;
  justify-items: center;
}

/* Tarjeta */
.sale-card{
  background:var(--card);
  border:1px solid var(--line);
  border-radius:16px;
  overflow:hidden;
  display:flex;
  flex-direction:column;
  position: relative;
  max-width: 100%;
}
.sale-card.is-soldout{opacity:.9}

.sale-media{position:relative;background:#0f0f14;border-bottom:1px solid var(--line);cursor:pointer}
.sale-card.is-soldout .sale-media{cursor:not-allowed}
.sale-media .img{display:block;width:100%;aspect-ratio:4/5;object-fit:cover;object-position:center;transition:opacity .25s}
.sale-media .back{position:absolute;inset:0;opacity:0}
.sale-media:hover .back{opacity:1}

.sale-info{padding:14px;display:flex;flex-direction:column;gap:8px}
.title{margin:0;font-size:16px;line-height:1.3;cursor:pointer}
.price{font-weight:800}
.cta.small{align-self:stretch;border:1px solid #2b2b33;background:#101017;color:#f2f3f7;border-radius:10px;padding:10px 12px;cursor:pointer;font-weight:700}
.cta.small:disabled{opacity:.6;cursor:not-allowed}
.cta.small:hover:not(:disabled){background:#15151c}

/* Precio tachado */
.price-row { display: flex; align-items: center; gap: 8px; }
.original-price { color: #6b7280; text-decoration: line-through; font-size: 0.9em; }

/* Badge */
.discount-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: var(--accent);
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: bold;
  font-size: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

/* Skeleton / Empty / Trust / Footer */
.skeleton-grid{display:grid;gap:16px;grid-template-columns:repeat(4,minmax(0,1fr))}
.skeleton{height:340px;border-radius:16px;background:linear-gradient(90deg,#15151b,#1b1b23,#15151b);animation:shimmer 1.3s infinite}
@keyframes shimmer{0%{background-position:0%}100%{background-position:100%}}
.empty{border:1px dashed #30303a;padding:24px;border-radius:16px;text-align:center;color:#babccc}
.trust{padding:0 24px; max-width:100vw;}
.trust-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.trust-item{border:1px solid var(--line);border-radius:12px;padding:12px;background:#0f0f14;color:#cfd0d8;display:flex;gap:8px;align-items:center}
.footer-cta{padding:0 24px 28px; max-width:100vw;}
.footer-inner{border:1px solid var(--line);border-radius:16px;display:flex;align-items:center;justify-content:space-between;padding:18px 20px;background:linear-gradient(180deg,#0f0f14,#0b0b11)}

/* ===== Fragmentos heredados del antiguo sale.css (unificados) ===== */
/* Tarjeta genérica .producto (por si algo la usa) */
.producto {
  background:#fff;
  padding:1rem;
  border:1px solid #eee;
  border-radius:10px;
  width:min(200px,100%);
  max-width:100%;
  transition:transform .3s ease;
}
.producto:hover { transform:scale(1.05); }
.producto img { display:block; width:100%; height:auto; border-radius:6px; object-fit:cover; }
.precio-original { text-decoration:line-through; color:gray; }
.precio-descuento { color:red; font-weight:bold; }

/* Responsive */
@media (max-width:1100px){ .hero-inner{grid-template-columns:1fr} }
@media (max-width:900px){
  .cards{ grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:20px; }
}
@media (max-width:480px){
  .hero-inner { grid-template-columns:1fr; padding:16px; }
  .hero-card { border-left:none; border-top:1px solid var(--line); padding:20px; }
  .cards{ grid-template-columns: minmax(240px, 1fr); gap:16px; }
}
`;
