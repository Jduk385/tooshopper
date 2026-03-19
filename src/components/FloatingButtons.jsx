import React from "react";
import { FaWhatsapp, FaInstagram } from "react-icons/fa";
import './FloatingButtons.css';

export default function FloatingButtons() {
  const phoneNumber = "573113987975"; 
  const message = "Hola TooShopper! Vengo de la pagina web y me gustaría recibir mas información sobre sus productos.";
  
  const waLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  // Estilo "mágico" para forzar la mano y que el botón esté al frente
  const powerStyle = { 
    cursor: 'pointer', 
    display: 'flex', 
    zIndex: 999999, 
    pointerEvents: 'auto' 
  };

  return (
    <div className="floating-buttons-container" style={{ zIndex: 999999 }}>
      {/* Botón WhatsApp */}
      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        className="floating-button whatsapp"
        style={powerStyle}
      >
        <FaWhatsapp size={30} style={{ pointerEvents: 'none' }} />
      </a>

      {/* Botón Instagram */}
      <a
        href="https://instagram.com/tooshopper"
        target="_blank"
        rel="noopener noreferrer"
        className="floating-button instagram"
        style={powerStyle}
      >
        <FaInstagram size={30} style={{ pointerEvents: 'none' }} />
      </a>
    </div>
  );
}