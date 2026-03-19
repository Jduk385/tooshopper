import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Forzamos el scroll a cero en todos los niveles posibles
    const scrollToTop = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    scrollToTop();

    // Pequeño refuerzo por si la página carga lento
    const timer = setTimeout(scrollToTop, 50);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}