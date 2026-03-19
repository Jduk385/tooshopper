import "./Footer.css";
import { Link } from "react-router-dom";
import { FaFacebookF, FaInstagram, FaWhatsapp, FaTiktok } from "react-icons/fa";

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h2 className="footer-title">Tooshopper</h2>
          <p className="footer-text">
            Ropa premium con calidad garantizada. <br />
            Nuestras prendas son 100% algodón.
          </p>
        </div>

        <div className="footer-section">
          <h2 className="footer-title">Navegación</h2>
          <ul className="footer-nav">
            <li><Link to="/">Inicio</Link></li>
            <li><Link to="/nosotros">Nosotros</Link></li>
            <li><Link to="/politicas">Políticas y Contacto</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h2 className="footer-title">Síguenos</h2>
          <div className="social-icons">
            <a href="https://wa.me/573113987975" target="_blank" rel="noreferrer"><FaWhatsapp /></a>
            <a href="https://instagram.com/tooshopper" target="_blank" rel="noreferrer"><FaInstagram /></a>
            <a href="https://facebook.com/share/1F7JVUFnN9/" target="_blank" rel="noreferrer"><FaFacebookF /></a>
            <a href="https://tiktok.com/@tooshopper" target="_blank" rel="noreferrer"><FaTiktok /></a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">© {year} Tooshopper. Todos los derechos reservados.</div>
    </footer>
  );
}

export default Footer;