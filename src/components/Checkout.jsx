// src/components/Checkout.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCart, clearCart } from "../lib/cart";
import { getMe } from "../services/auth";

const API = (
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");

const looksLikeObjectId = (s) =>
  typeof s === "string" && /^[a-f0-9]{24}$/i.test(s);

const inputStyle = {
  width: "100%",
  marginTop: 4,
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #ddd",
  outline: "none",
};

export default function Checkout() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    direccion: "",
    ciudad: "",
    notas: "",
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  // ✅ CSS responsive embebido
  const responsiveCSS = `
  .co-wrap{padding:16px;max-width:1000px;margin:0 auto}
  .co-grid{display:grid;grid-template-columns:1fr 380px;gap:20px;align-items:start}
  .co-card{background:#fff;padding:16px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.06)}
  .co-list{list-style:none;padding:0;margin:0}
  .co-line{display:grid;grid-template-columns:60px 1fr auto;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid #eee}
  .co-img{width:60px;height:60px;object-fit:cover;border-radius:8px}
  .co-skel{width:60px;height:60px;background:#f3f3f3;border-radius:8px}

  @media (max-width: 900px){
    .co-grid{grid-template-columns:1fr}
  }
  `;

  // 1) Cargar carrito + total
  useEffect(() => {
    const load = () => {
      const c = getCart();
      setItems(c);
      setTotal(
        c.reduce(
          (acc, it) => acc + (Number(it.price) || 0) * (Number(it.qty) || 1),
          0
        )
      );
    };
    load();
    window.addEventListener("cart-changed", load);
    return () => window.removeEventListener("cart-changed", load);
  }, []);

  // 2) Prefill desde el usuario (si hay token) – silencioso, sin spam de consola
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    (async () => {
      try {
        const data = await getMe(token);
        const u = data?.user || data || {};
        setForm((f) => ({
          ...f,
          nombre: u.name || f.nombre,
          email: u.email || f.email,
        }));
      } catch {
        /* no-op */
      }
    })();
  }, []);

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // 3) Completar variantes faltantes consultando el backend
  async function fillMissingVariants(itemsNorm) {
    const out = [];
    for (const it of itemsNorm) {
      if (it.productId || it.variant || !it.sku) {
        out.push(it);
        continue;
      }
      try {
        const url = `${API}/api/products?sku=${encodeURIComponent(
          it.sku
        )}&limit=1`;
        const r = await fetch(url);
        const j = await r.json().catch(() => ({}));
        const variant = j?.items?.[0]?.variant || "M";
        out.push({ ...it, variant });
      } catch {
        out.push(it);
      }
    }
    return out;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!items.length) {
      alert("Tu carrito está vacío.");
      return;
    }
    if (!form.nombre || !form.email || !form.direccion || !form.ciudad) {
      alert("Completa nombre, email, dirección y ciudad.");
      return;
    }

    setLoading(true);
    try {
      const baseItems = items.map((it) => {
        const candidateId = it.productId || it._id || it.id;
        const productId = looksLikeObjectId(candidateId) ? candidateId : null;
        const sku =
          String(
            it.sku || it.SKU || it.code || it.ref || it.reference || ""
          ).trim() || null;
        const variant =
          (it.variant == null ? null : String(it.variant).trim()) || null;

        return {
          productId,
          sku,
          variant,
          name: it.name || null,
          qty: Math.max(1, Number(it.qty) || 1),
        };
      });

      const itemsPayload = await fillMissingVariants(baseItems);

      const payload = {
        items: itemsPayload,
        shipping: {
          nombre: form.nombre,
          email: form.email,
          telefono: form.telefono,
          direccion: form.direccion,
          ciudad: form.ciudad,
          notas: form.notas || "",
        },
        customer: {
          nombre: form.nombre,
          email: form.email,
          telefono: form.telefono,
        },
        paymentMethod: "nequi",
      };

      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();

      if (!res.ok) {
        let message = text;
        try {
          const j = JSON.parse(text);
          message = j?.message || j?.error || message;
        } catch {
          /* noop */
        }
        throw new Error(message || "No se pudo crear la orden");
      }

      const data = JSON.parse(text);
      if (!data?.id) throw new Error("El backend no devolvió id de la orden");

      // ✅ Añadido: Limpia el carrito después de crear la orden
      clearCart();
      navigate(`/pagar/${data.id}`);
    } catch (e2) {
      setErr(e2?.message || "Error creando la orden");
    } finally {
      setLoading(false);
    }
  }

  if (!items.length) {
    return (
      <div style={{ padding: 16 }}>
        <h2>Checkout</h2>
        <p>Tu carrito está vacío.</p>
        <Link to="/nuevo">Ver productos</Link>
      </div>
    );
  }

  return (
    <div className="co-wrap">
      <style>{responsiveCSS}</style>

      <h2>Checkout</h2>

      {err && (
        <div
          className="co-card"
          style={{
            background: "#ffe5e5",
            color: "#b00020",
            marginBottom: 10,
          }}
        >
          {err}
        </div>
      )}

      <div className="co-grid">
        <form onSubmit={onSubmit} className="co-card" noValidate>
          <h3>Datos de envío</h3>

          {/* Evitamos nested labels raros: el texto y el input separados */}
          <div style={{ display: "grid", gap: 10 }}>
            <div>
              <div>Nombre completo *</div>
              <input
                name="nombre"
                value={form.nombre}
                onChange={onChange}
                required
                style={inputStyle}
              />
            </div>

            <div>
              <div>Email *</div>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                required
                style={inputStyle}
              />
            </div>

            <div>
              <div>Teléfono</div>
              <input
                name="telefono"
                value={form.telefono}
                onChange={onChange}
                style={inputStyle}
              />
            </div>

            <div>
              <div>Dirección *</div>
              <input
                name="direccion"
                value={form.direccion}
                onChange={onChange}
                required
                style={inputStyle}
              />
            </div>

            <div>
              <div>Ciudad *</div>
              <input
                name="ciudad"
                value={form.ciudad}
                onChange={onChange}
                required
                style={inputStyle}
              />
            </div>

            <div>
              <div>Notas para el envío</div>
              <textarea
                name="notas"
                value={form.notas}
                onChange={onChange}
                style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ marginTop: 12 }}>
            {loading ? "Creando orden…" : "Confirmar pedido"}
          </button>
        </form>

        <aside className="co-card">
          <h3>Resumen</h3>
          <ul className="co-list">
            {items.map((it, i) => {
              const keyBase =
                it.id || it._id || it.productId || it.sku || it.name || "x";
              const key = `${keyBase}-${i}`; // ✅ evita warning de keys duplicadas
              const lineTotal =
                (Number(it.price) || 0) * Math.max(1, Number(it.qty) || 1);

              return (
                <li key={key} className="co-line">
                  {it.image ? (
                    <img className="co-img" src={it.image} alt={it.name} />
                  ) : (
                    <div className="co-skel" />
                  )}
                  <div>
                    <div style={{ fontWeight: 600 }}>{it.name}</div>
                    <div style={{ opacity: 0.8, fontSize: 13 }}>
                      x{Math.max(1, Number(it.qty) || 1)}
                      {it.variant ? ` · ${String(it.variant)}` : ""}
                    </div>
                  </div>
                  <div>${lineTotal.toLocaleString()}</div>
                </li>
              );
            })}
          </ul>
          <div
            style={{
              marginTop: 12,
              display: "flex",
              justifyContent: "space-between",
              fontWeight: 700,
            }}
          >
            <span>Total</span>
            <span>${total.toLocaleString()}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
