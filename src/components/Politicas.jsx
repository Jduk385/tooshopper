import "./Politicas.css";

export default function Politicas() {
  const hoy = new Date().toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="policy">
      <header className="policy-header">
        <h1>Políticas Tooshopper</h1>
        <p className="policy-meta">Última actualización: {hoy}</p>
      </header>

      <nav className="policy-toc" aria-label="Tabla de contenido">
        <a href="#privacidad">1. Privacidad y Datos</a>
        <a href="#terminos">2. Términos y Condiciones</a>
        <a href="#cambios">3. Cambios y Devoluciones</a>
        <a href="#envios">4. Envíos y Entregas</a>
        <a href="#garantia">5. Garantía</a>
        <a href="#cookies">6. Cookies</a>
        <a href="#contacto">7. Contacto</a>
      </nav>

      <section id="privacidad" className="policy-section">
        <h2>1. Privacidad y Datos (Habeas Data)</h2>
        <p>
          Recolectamos: nombre, datos de contacto, dirección de envío, historial
          de pedidos y referencias de pago (no almacenamos datos de tarjetas).
        </p>
        <p>
          Usos: procesar pedidos, gestionar envíos, postventa y comunicaciones
          comerciales solo si las aceptas.
        </p>
        <p>
          Derechos: conocer, actualizar, rectificar y suprimir datos; revocar
          autorización. Escríbenos para ejercerlos.
        </p>
      </section>

      <section id="terminos" className="policy-section">
        <h2>2. Términos y Condiciones</h2>
        <p>Precios en COP. Disponibilidad sujeta a inventario.</p>
        <p>
          Si alguna referencia no tiene stock, te contactamos para cambio o
          reembolso.
        </p>
        <p>
          Métodos de pago: PayU (tarjeta/PSE), Nequi y Daviplata (según
          disponibilidad en checkout).
        </p>
        <p>
          No respondemos por fallas de servicios de terceros (pasarelas,
          transportadoras) fuera de nuestro control.
        </p>
      </section>

      <section id="cambios" className="policy-section">
        <h2>3. Cambios y Devoluciones</h2>
        <p>
          Cambios por talla/color: hasta <strong>30 días</strong> desde la
          entrega. La prenda debe estar sin uso, con etiqueta y empaque.
        </p>
        <p>
          Fletes: por preferencia del cliente los asume el cliente; por defecto
          de fabricación los asume Tooshopper.
        </p>
        <p>
          Proceso: envíanos número de pedido y fotos por WhatsApp para validar y
          coordinar.
        </p>
      </section>

      <section id="envios" className="policy-section">
        <h2>4. Envíos y Entregas</h2>
        <p>
          Cobertura nacional (Colombia). Transportadora: Interrapidísimo u otra
          disponible.
        </p>
        <p>
          Tiempos estimados: 2–5 días hábiles en principales ciudades; zonas
          especiales pueden tardar más.
        </p>
        <p>
          Costo: se calcula en checkout o se confirma por WhatsApp. Siempre
          enviamos la guía para rastreo.
        </p>
      </section>

      <section id="garantia" className="policy-section">
        <h2>5. Garantía</h2>
        <p>
          Cubre defectos de fabricación (costuras, tela, apliques) por{" "}
          <strong>30 días</strong> desde la entrega.
        </p>
        <p>
          Soluciones: reparación, cambio por una referencia disponible o
          devolución del dinero según aplique.
        </p>
        <p>No cubre: desgaste normal, lavado/plancha inadecuados, manchas por uso.</p>
      </section>

      <section id="cookies" className="policy-section">
        <h2>6. Cookies</h2>
        <p>
          Usamos cookies necesarias y analíticas para mejorar tu experiencia.
          Puedes desactivarlas en tu navegador; algunas funciones podrían verse
          limitadas.
        </p>
      </section>

      <section id="contacto" className="policy-section">
        <h2>7. Contacto</h2>
        <p>Email: <a href="mailto:contacto@tooshopper.com">contacto@tooshopper.com</a></p>
        <p>WhatsApp: <a href="https://wa.me/573113987975" target="_blank" rel="noopener noreferrer">+57 311 398 7975</a></p>
        <p>Medellín, Colombia</p>
      </section>

      <a href="#top" className="policy-top" aria-label="Volver arriba">↑ Arriba</a>
    </main>
  );
}
