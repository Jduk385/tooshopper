import "./Header.css";
import { FaSearch, FaShoppingCart, FaBars, FaTimes, FaUser, FaShieldAlt } from "react-icons/fa";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getMe } from "../services/auth";
import { getCart } from "../lib/cart";

const ADMIN_EMAILS = ["info@tooshopper.com"];

function isAdminUser(user) {
  if (!user) return false;
  const role = String(user.role || "").toLowerCase();
  const email = String(user.email || "").trim().toLowerCase();
  return user.isAdmin === true || role === "admin" || ADMIN_EMAILS.includes(email);
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState(null); // ✅ Estado para orden pendiente
  const navigate = useNavigate();
  const location = useLocation();

  // Sticky efecto
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Cerrar panel al navegar
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // ✅ Nueva función para buscar órdenes pendientes
  async function findPendingOrder() {
    const token = localStorage.getItem("token");
    if (!token) { setPendingOrderId(null); return; }
    try {
      const r = await fetch("/api/orders/pending", { headers: { Authorization: `Bearer ${token}` } });
      const data = await r.json();
      setPendingOrderId(r.ok && data?.id ? data.id : null);
    } catch {
      setPendingOrderId(null);
    }
  }

  function fetchUser() {
    getMe()
      .then((data) => {
        const u = data?.user || data;
        if (u) {
          setUser(u);
          localStorage.setItem("me", JSON.stringify(u));
        } else {
          setUser(null);
          localStorage.removeItem("me");
          setPendingOrderId(null); // Limpia si no hay usuario
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("me");
        setUser(null);
      });
  }

  useEffect(() => {
    // Cargar usuario, carrito Y orden pendiente
    fetchUser();
    findPendingOrder();

    const loadCartCount = () => {
      const items = getCart();
      const count = items.reduce((acc, it) => acc + (it.qty || 1), 0);
      setCartCount(count);
    };
    loadCartCount();

    const authHandler = () => {
      fetchUser();
      findPendingOrder(); // Vuelve a buscar al cambiar auth
    };
    const cartHandler = () => loadCartCount(); // El carrito no afecta la orden pendiente

    window.addEventListener("auth-changed", authHandler);
    window.addEventListener("cart-changed", cartHandler);

    return () => {
      window.removeEventListener("auth-changed", authHandler);
      window.removeEventListener("cart-changed", cartHandler);
    };
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("me");
    setUser(null);
    window.dispatchEvent(new Event("auth-changed"));
    navigate("/login");
  };

  return (
    <header className={`header ${scrolled ? "scrolled" : ""}`} role="banner">
      <div className="container">

        {/* LOGO (si tienes /logo1.png en public) */}
        <div className="logo1">
          <Link to="/" aria-label="Ir al inicio">
            <img src="/logo1.png" alt="Tooshopper" />
          </Link>
        </div>

        {/* MENÚ (solo desktop) */}
        <nav className="nav" aria-label="Principal">
          <NavLink to="/nuevo"  className={({ isActive }) => (isActive ? "active" : undefined)}>Nuevo</NavLink>
          <NavLink to="/mujer"  className={({ isActive }) => (isActive ? "active" : undefined)}>Mujer</NavLink>
          <NavLink to="/hombre" className={({ isActive }) => (isActive ? "active" : undefined)}>Hombre</NavLink>
          <NavLink to="/sale"   className={({ isActive }) => `sale ${isActive ? "active" : ""}`}>SALE</NavLink>
        </nav>

        {/* ACCIONES (siempre visibles) */}
        <div className="actions">
          <button
            type="button"
            className="icon-button"
            aria-label="Buscar"
            onClick={() => navigate("/buscar")}
          >
            <FaSearch />
          </button>

          <button
            type="button"
            className="icon-button cart-button"
            aria-label={`Carrito (${cartCount})`}
            onClick={() => navigate("/carrito")}
          >
            <FaShoppingCart />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>

          {/* ✅ Botón para pagar orden pendiente (si existe) */}
          {pendingOrderId && (
            <Link to={`/pagar/${pendingOrderId}`} className="auth-link" style={{ background: '#fef9c3', color: '#713f12', border: '1px solid #fde047' }}>
              Pagar orden pendiente
            </Link>
          )}

          {/* Links de auth (ocultos en móvil por CSS) */}
          {user && isAdminUser(user) && (
            <Link to="/admin/orders" className="auth-link">
              Admin
            </Link>
          )}

          {user ? (
            <>
              <Link to="/perfil" className="auth-link">
                Hola, {user.name || user.email}
              </Link>
              <button type="button" className="auth-link" onClick={logout}>
                Salir
              </button>
            </>
          ) : (
            <>
              <Link to="/registro" className="auth-link">Registrarse</Link>
              <Link to="/login" className="auth-link">Iniciar sesión</Link>
            </>
          )}

          {/* Botón hamburguesa (solo móvil por CSS) */}
          <button
            type="button"
            className="burger"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(v => !v)}
          >
            {open ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {/* ====== PANEL MÓVIL ====== */}
      <div id="mobile-menu" className={`mobile ${open ? "open" : ""}`}>
        <button className="mobile-overlay" onClick={() => setOpen(false)} aria-label="Cerrar menú" />
        <div className="mobile-panel">
          {user ? (
            <Link to="/perfil" className="mobile-user">
              <FaUser /> Hola, {user.name || user.email}
            </Link>
          ) : (
            <Link to="/login" className="mobile-user">
              <FaUser /> Ingresar / Registrarse
            </Link>
          )}

          {user && isAdminUser(user) && (
            <Link to="/admin/orders" className="mobile-admin">
              <FaShieldAlt /> Panel Admin
            </Link>
          )}

          <nav className="mobile-nav" aria-label="Menú móvil">
            <NavLink to="/nuevo"  className="m-link">Nuevo</NavLink>
            <NavLink to="/mujer"  className="m-link">Mujer</NavLink>
            <NavLink to="/hombre" className="m-link">Hombre</NavLink>
            <NavLink to="/nosotros" className="m-link">Nosotros</NavLink>
            <NavLink to="/politicas" className="m-link">Políticas</NavLink>
            <NavLink to="/buscar" className="m-link">Buscar</NavLink>
            <NavLink to="/carrito" className="m-link">Carrito</NavLink>
            <NavLink to="/sale" className="m-link">SALE</NavLink>
          </nav>

          {user && (
            <button type="button" className="m-link" onClick={logout}>
              Cerrar sesión
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
