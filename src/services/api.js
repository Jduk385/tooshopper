// src/services/api.js
const getApiBase = () => {
  const apiUrl = import.meta?.env?.VITE_API_URL;
  
  // En producción, si no hay URL configurada, mostrar error claro
  if (import.meta.env.PROD && !apiUrl) {
    console.error('⚠️  VITE_API_URL no está configurada en producción!');
    console.error('Configure la variable de entorno VITE_API_URL con la URL de su backend.');
  }
  
  // Fallback a localhost solo en desarrollo
  const defaultUrl = import.meta.env.DEV ? 'http://127.0.0.1:5000' : '';
  return (apiUrl || defaultUrl).replace(/\/$/, '');
};

const BASE = getApiBase();
export const API_BASE = BASE;

export async function api(path, opts = {}) {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });

  const raw = await res.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = { raw }; }

  if (!res.ok) {
    const msg = data?.message || data?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}
