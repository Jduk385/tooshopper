import { useEffect, useRef, useState } from "react";
import "./hero.css";

const videos = ["/video2.mp4", "/video3.mp4", "/video1.mp4"];

export default function Hero() {
  const [current, setCurrent] = useState(0);
  const videoRefs = useRef([]);

  // Cambia cada 5s (ajusta si quieres)
  useEffect(() => {
    const id = setInterval(() => {
      setCurrent((prev) => (prev + 1) % videos.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  // Controla reproducción del slide activo y pausa el resto
  useEffect(() => {
    videoRefs.current.forEach((v, idx) => {
      if (!v) return;
      try {
        if (idx === current) {
          v.currentTime = 0;
          v.muted = true; // necesario para autoplay en móviles
          const p = v.play();
          if (p && typeof p.catch === "function") {
            p.catch((err) => {
              // Ignorar errores de autoplay sin romper ESLint
              void err;
            });
          }
        } else {
          v.pause();
          v.currentTime = 0;
        }
      } catch (err) {
        // Evita "catch vacío" y "no-unused-vars"
        void err;
      }
    });
  }, [current]);

  // Asegura arranque en 0 cuando el video termina de cargar
  const handleLoaded = (idx) => (e) => {
    const v = e.currentTarget;
    try {
      if (idx === current) {
        v.currentTime = 0;
        const p = v.play();
        if (p && typeof p.catch === "function") {
          p.catch((err) => {
            void err;
          });
        }
      } else {
        v.pause();
        v.currentTime = 0;
      }
    } catch (err) {
      void err;
    }
  };

  return (
    <section className="hero-slider" aria-label="Promociones">
      {videos.map((src, idx) => (
        <video
          key={src}
          ref={(el) => (videoRefs.current[idx] = el)}
          src={src}
          className={idx === current ? "slide active" : "slide"}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedMetadata={handleLoaded(idx)}
        />
      ))}

      <div className="dots" role="tablist" aria-label="Cambiar video">
        {videos.map((_, idx) => (
          <button
            key={idx}
            aria-label={`Ir al video ${idx + 1}`}
            aria-selected={idx === current}
            className={idx === current ? "dot active" : "dot"}
            onClick={() => setCurrent(idx)}
          />
        ))}
      </div>
    </section>
  );
}
