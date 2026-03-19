import { useNavigate } from "react-router-dom";
import "./ComboInvite.css";

function ComboInvite() {
  const navigate = useNavigate();

  return (
    <section className="combo-invite-container">
      {/* Marquee superior */}
      <div className="invite-marquee">
        <div className="marquee-content">
          🔥 ARMA TU PACK • 10% DE DESCUENTO • COMBOS EXCLUSIVOS • ELIGE TUS FAVORITOS • ARMA TU PACK • 10% DE DESCUENTO • COMBOS EXCLUSIVOS 🔥
        </div>
      </div>

      <div className="invite-content">
        <div className="invite-text-box">
          <h2 className="invite-title">ARMA TU <br/><span>COMBO</span></h2>
          <p>Lleva 2 o 3 prendas con descuento especial aplicado al carrito.</p>
          <button className="invite-btn" onClick={() => navigate("/sale")}>
            IR A ARMAR MI PACK 🔥
          </button>
        </div>

        <div className="invite-visual">
          <div className="bundle-badge">
            <span style={{fontWeight: 800}}>PACK</span>
            <span className="badge-main">2x3</span>
            <span style={{fontWeight: 800}}>SALE</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ComboInvite;