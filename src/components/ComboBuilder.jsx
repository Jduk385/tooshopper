import { useState } from "react";
import { addBundleToCart } from "../lib/cart";

export default function ComboBuilder({ products }) {
  const [step, setStep] = useState(1);
  const [selection, setSelection] = useState({ top: null, bottom: null });
  const [sizes, setSizes] = useState({ top: "", bottom: "" });

  // Filtrado por categorías
  const tops = products.filter(p => p.category?.toLowerCase().includes("camiseta") || p.category?.toLowerCase().includes("superior"));
  const bottoms = products.filter(p => p.category?.toLowerCase().includes("pantalon") || p.category?.toLowerCase().includes("inferior"));

  const handleComplete = () => {
    if (!sizes.top || !sizes.bottom) {
      alert("Por favor selecciona las tallas de ambas prendas");
      return;
    }

    const pricePerItem = 45000; 
    const bundleItems = [
      { ...selection.top, price: pricePerItem, selectedSize: sizes.top, image: selection.top.variants?.[0]?.images?.[0] },
      { ...selection.bottom, price: pricePerItem, selectedSize: sizes.bottom, image: selection.bottom.variants?.[0]?.images?.[0] }
    ];
    
    addBundleToCart(bundleItems, "Duo Pack");
    setStep(1);
    setSelection({ top: null, bottom: null });
    setSizes({ top: "", bottom: "" });
    alert("¡Combo agregado a Tooshopper!");
  };

  return (
    <section className="combo-invite-container">
      {/* Banner Animado (Marquee) */}
      <div className="invite-marquee">
        <div className="marquee-content">
          🔥 ARMA TU COMBO - 2 PRENDAS POR $90.000 - ENVÍO GRATIS 🔥 ARMA TU COMBO - 2 PRENDAS POR $90.000 - ENVÍO GRATIS
        </div>
      </div>

      <div className="invite-content">
        <div className="text-side">
          <h2 className="invite-title">DUO <span>PACK</span></h2>
          <p>Paso {step}: Selecciona tu prenda {step === 1 ? 'Superior' : 'Inferior'}</p>
          
          {/* Selector de Tallas Dinámico */}
          {(step === 1 ? selection.top : selection.bottom) && (
            <div style={{ marginTop: '10px' }}>
              <label>Talla: </label>
              <select 
                value={step === 1 ? sizes.top : sizes.bottom}
                onChange={(e) => setSizes({ ...sizes, [step === 1 ? 'top' : 'bottom']: e.target.value })}
                style={{ padding: '5px', borderRadius: '5px', marginLeft: '10px' }}
              >
                <option value="">Selecciona...</option>
                {/* Aquí mapeamos las tallas reales de tu MongoDB */}
                {['S', 'M', 'L', 'XL'].map(size => <option key={size} value={size}>{size}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="bundle-badge">
          <span className="badge-main">$90k</span>
          <span className="badge-sub">POR 2</span>
        </div>
      </div>

      {/* Grid de Productos con scroll horizontal o grid */}
      <div className="product-selection-grid">
        {(step === 1 ? tops : bottoms).map(p => (
          <div 
            key={p.id} 
            className={`product-card ${((step === 1 ? selection.top : selection.bottom)?.id === p.id) ? 'selected' : ''}`}
            onClick={() => setSelection({ ...selection, [step === 1 ? 'top' : 'bottom']: p })}
          >
            <img src={p.variants?.[0]?.images?.[0]} alt={p.name} />
            <p>{p.name}</p>
          </div>
        ))}
      </div>

      <div className="combo-controls">
        {step === 2 && <button className="back-btn" onClick={() => setStep(1)}>⬅ Volver</button>}
        {selection.top && step === 1 && <button className="next-btn" onClick={() => setStep(2)}>Siguiente ➡</button>}
        {selection.top && selection.bottom && (
          <button className="invite-btn" onClick={handleComplete}>
            FINALIZAR COMBO
          </button>
        )}
      </div>
    </section>
  );
}