import "./Footer.css";
import { Link } from "react-router-dom";
import { FaFacebookF, FaInstagram, FaWhatsapp, FaTiktok } from "react-icons/fa";

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">

        {/* Acerca de */}
        <div className="footer-section footer-about">
          <h2 className="footer-title">Tooshopper</h2>
          <p className="footer-text">
            Ropa premium con calidad garantizada. <br />
            Nuestras prendas son 100% algodón. <br />
            Envíos a toda Colombia y atención personalizada.
          </p>
        </div>

        {/* Navegación (usa Link para no recargar la SPA) */}
        <div className="footer-section">
          <h2 className="footer-title">Navegación</h2>
          <ul className="footer-nav">
            <li><Link to="/">Inicio</Link></li>
            <li><Link to="/nosotros">Nosotros</Link></li>
            <li><Link to="/contacto">Contacto</Link></li>
            <li><Link to="/politicas">Políticas</Link></li>
          </ul>
        </div>

        {/* Redes */}
        <div className="footer-section">
          <h2 className="footer-title">Síguenos</h2>
          <div className="social-icons">
            <a aria-label="WhatsApp" href="https://wa.me/573113987975" target="_blank" rel="noopener noreferrer">
              <FaWhatsapp />
            </a>
            <a aria-label="Instagram" href="https://instagram.com/tooshopper" target="_blank" rel="noopener noreferrer">
              <FaInstagram />
            </a>
            <a aria-label="Facebook" href="https://facebook.com/share/1F7JVUFnN9/" target="_blank" rel="noopener noreferrer">
              <FaFacebookF />
            </a>
            <a aria-label="TikTok" href="https://tiktok.com/@tooshopper" target="_blank" rel="noopener noreferrer">
              <FaTiktok />
            </a>
          </div>
        </div>

      </div>

      <div className="footer-bottom">
        © {year} Tooshopper. Todos los derechos reservados.
      </div>
    </footer>
  );
}

export default Footer;
