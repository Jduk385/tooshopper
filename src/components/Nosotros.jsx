import "./Nosotros.css";
import { FaWhatsapp, FaCheckCircle, FaTruck, FaTshirt, FaHandshake } from "react-icons/fa";

export default function Nosotros() {
  return (
    <main className="about">
      {/* Hero */}
      <section className="about-hero">
        <div className="about-hero-inner">
          <h1>Sobre Tooshopper</h1>
          <p>Ropa premium, 100% algodón, atención cercana y envíos a toda Colombia.</p>
          <a
            className="about-cta"
            href="https://wa.me/573113987975?text=Hola%20Tooshopper%2C%20quiero%20asesor%C3%ADa%20para%20comprar%20%F0%9F%91%9F"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaWhatsapp /> Escríbenos por WhatsApp
          </a>
        </div>
      </section>

      {/* Quiénes somos + Historia */}
      <section className="about-grid">
        <div className="about-card">
          <h2>Quiénes somos</h2>
          <p>
            Tooshopper es una tienda colombiana enfocada en ofrecer ropa premium con
            calidad garantizada. Seleccionamos telas, confección y acabados para que cada
            prenda tenga el ajuste, textura y durabilidad que mereces.
          </p>
          <p>
            Nos especializamos en prendas <strong>100% algodón</strong>  calidad
            <strong> y durabilidad</strong>, revisadas una a una antes de enviarlas.
          </p>
        </div>

        <div className="about-card">
          <h2>Nuestra historia</h2>
          <p>
            Nacimos después de visitar fábricas y talleres en Lima (Perú), donde
            encontramos la calidad que queríamos traer a Colombia. El algodón peruano es de muy alta calidad a nivel mundial, Empezamos vendiendo a
            amigos y familia, y gracias a su confianza hoy enviamos a todo el país.
          </p>
          <p>
            Creemos en la honestidad, las fotos reales y una atención cercana por WhatsApp.
          </p>
        </div>
      </section>

      {/* Diferenciales */}
      <section className="about-diffs">
        <h2>¿Por qué elegirnos?</h2>
        <ul className="diff-list">
          <li><FaTshirt /><span>Texturas 100% algodón y calidad</span></li>
          <li><FaCheckCircle /><span>Prendas revisadas una a una</span></li>
          <li><FaTruck /><span>Envíos nacionales 2–5 días hábiles</span></li>
          <li><FaHandshake /><span>Cambios fáciles por talla o color</span></li>
        </ul>
      </section>

      {/* Misión / Visión / Valores */}
      <section className="about-mvv">
        <div className="mvv-card">
          <h3>Misión</h3>
          <p>Entregar ropa premium a precios justos, con procesos honestos, rápidos y seguros.</p>
        </div>
        <div className="mvv-card">
          <h3>Visión</h3>
          <p>Ser una marca reconocida en Colombia por calidad real y atención cercana.</p>
        </div>
        <div className="mvv-card">
          <h3>Valores</h3>
          <ul>
            <li>Honestidad (fotos reales)</li>
            <li>Responsabilidad en envíos</li>
            <li>Calidad sobre cantidad</li>
            <li>Servicio cercano y respetuoso</li>
          </ul>
        </div>
      </section>

      {/* Galería (usa imágenes públicas o cámbialas por las tuyas) */}
      <section className="about-gallery">
        <h2>Detrás de escena</h2>
        <p className="gallery-sub">Nuestro proceso real: selección, control y empaque.</p>
        <div className="gallery-grid">
          {/* Coloca estas imágenes en /public/images/ ... o cambia las rutas */}
          <img src="/images/nosotros-1.jpg" alt="Selección de prendas" />
          <img src="/images/nosotros-2.jpg" alt="Control de calidad" />
          <img src="/images/nosotros-3.jpg" alt="Empaque para envío" />
        </div>
      </section>

      {/* CTA final */}
      <section className="about-cta-block">
        <h2>¿Necesitas ayuda para elegir tu talla?</h2>
        <p>Escríbenos y te asesoramos en minutos.</p>
        <a
          className="about-cta about-cta-inline"
          href="https://wa.me/573113987975?text=Hola%20Tooshopper%2C%20necesito%20ayuda%20con%20tallas%20%F0%9F%91%9F"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaWhatsapp /> WhatsApp inmediato
        </a>
      </section>
    </main>
  );
}
