// src/lib/api.js
import axios from "axios";

const getBaseURL = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  
  if (import.meta.env.PROD && !apiUrl) {
    console.error('⚠️  VITE_API_URL no está configurada en producción!');
    console.error('Configure la variable de entorno VITE_API_URL con la URL de su backend.');
  }
  
  const defaultUrl = import.meta.env.DEV ? 'http://localhost:5000' : '';
  return (apiUrl || defaultUrl).replace(/\/+$/, "");
};

export const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers["Content-Type"] = "application/json";
  return config;
});
