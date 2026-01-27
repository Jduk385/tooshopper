// src/pages/Buscar.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

/* ===== helpers ===== */
const BASE_URL = (import.meta?.env?.BASE_URL || "/").replace(/\/$/, "");
const withBase = (p) => `${BASE_URL}/${String(p || "").replace(/^\//, "")}`;
const isHttp = (s) => /^https?:\/\//i.test(String(s || ""));

function resolveSrc(src) {
  if (!src) return withBase("/marcas.webp");
  if (isHttp(src)) return src;
  return withBase(src);
}

export default function Buscar() {
  const [qParams, setQParams] = useSearchParams();
  const [q, setQ] = useState(qParams.get("q") || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const navigate = useNavigate();
  const abortRef = useRef(null);

  // Sincroniza ?q=
  useEffect(() => {
    if (q) setQParams({ q });
    else setQParams({});
  }, [q, setQParams]);

  async function loadCatalog(signal) {
    // Prioriza tu ruta real
    const urls = [
      withBase("/products/products.json"),
      withBase("/products.json"),
      withBase("/data/products.json"),
    ];

    for (const url of urls) {
      try {
        const r = await fetch(url, { cache: "no-store", signal });
        if (!r.ok) continue;
        const j = await r.json();
        const items = Array.isArray(j) ? j : (Array.isArray(j.items) ? j.items : []);
        if (items.length) return items;
      } catch (e) {
        if (e?.name === "AbortError") throw e; // salir silenciosamente si aborta
        // intenta siguiente url
      }
    }
    throw new Error("No se encontró el catálogo local");
  }

  async function runSearch(term) {
    const text = String(term || "").trim().toLowerCase();
    if (!text) {
      setResults([]);
      setErr("");
      return;
    }

    // cancela búsquedas anteriores (evita error de "AbortError" en consola)
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setErr("");
    try {
      const items = await loadCatalog(controller.signal);

      const filtered = items.filter((p) => {
        const name = (p.name || "").toLowerCase();
        const sku = (p.sku || "").toLowerCase();
        const desc = (p.description || "").toLowerCase();
        return (
          name.includes(text) ||
          sku.includes(text) ||
          desc.includes(text)
        );
      });

      setResults(filtered);
    } catch (e) {
      // Silenciar abortos (pasan en React Strict Mode doble render)
      if (e?.name !== "AbortError") {
        setErr("No se pudo cargar el catálogo local.");
        setResults([]);
      }
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    runSearch(q);
  }

  // Busca si ya viene ?q= en la URL
  useEffect(() => {
    const initial = qParams.get("q");
    if (initial) runSearch(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // (Opcional) búsqueda en vivo con debounce de 300ms:
  useEffect(() => {
    if (!q) {
      setResults([]);
      setErr("");
      return;
    }
    const id = setTimeout(() => runSearch(q), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const noResults = useMemo(
    () => !loading && q && results.length === 0 && !err,
    [loading, q, results, err]
  );

  return (
    <section style={{ maxWidth: 960, margin: "24px auto", padding: "0 16px" }}>
      <h2 style={{ textAlign: "center", marginBottom: 16 }}>Buscar productos</h2>

      <form onSubmit={onSubmit} style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        <input
          type="search"
          autoFocus
          placeholder="Ej: boss, lacoste, básica…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{
            flex: 1,
            maxWidth: 540,
            padding: "10px 12px",
            border: "1px solid #ddd",
            borderRadius: 12,
            outline: "none",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            background: "#e11d48",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
            border: "none",
          }}
        >
          Buscar
        </button>
      </form>

      <div style={{ marginTop: 24 }}>
        {loading && <p style={{ textAlign: "center", color: "#666" }}>Buscando productos...</p>}
        {err && <p style={{ textAlign: "center", color: "red" }}>{err}</p>}
        {noResults && (
          <p style={{ textAlign: "center", color: "#666" }}>
            No se encontraron resultados para <strong>"{q}"</strong>.
          </p>
        )}

        {results.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 20,
              marginTop: 24,
            }}
          >
            {results.map((p) => {
              const id = p._id || p.sku;
              const firstImg =
                Array.isArray(p.images) && p.images[0]
                  ? resolveSrc(p.images[0])
                  : resolveSrc("/marcas.webp");

              return (
                <article
                  key={id}
                  onClick={() => navigate("/producto/" + encodeURIComponent(id))}
                  style={{
                    border: "1px solid #eee",
                    borderRadius: 12,
                    overflow: "hidden",
                    cursor: "pointer",
                    background: "#fff",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                    transition: "transform .2s",
                  }}
                >
                  <img
                    src={firstImg}
                    alt={p.name}
                    style={{ width: "100%", height: 260, objectFit: "cover" }}
                    onError={(e) => (e.currentTarget.src = resolveSrc("/marcas.webp"))}
                  />
                  <div style={{ padding: "10px 12px" }}>
                    <h3 style={{ fontSize: 16, margin: "4px 0" }}>{p.name}</h3>
                    <div style={{ color: "#e11d48", fontWeight: 700 }}>
                      {new Intl.NumberFormat("es-CO", {
                        style: "currency",
                        currency: "COP",
                        maximumFractionDigits: 0,
                      }).format(p.price || 0)}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
