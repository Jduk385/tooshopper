import './PromoBanner.css';
import banner from '../assets/banner.jpg';
import { useNavigate } from 'react-router-dom';

function PromoBanner() {
  const navigate = useNavigate();

  return (
    <section className="promo-banner">
      <img src={banner} alt="Colección nueva" className="promo-image" />

      <div className="promo-content">
        <h2>Productos nuevos 2026</h2>
        <p>Descubre los estilos que están marcando tendencia esta temporada.</p>

        <button onClick={() => navigate('/nuevo')}>
          Explorar colección
        </button>
      </div>
    </section>
  );
}

export default PromoBanner;
