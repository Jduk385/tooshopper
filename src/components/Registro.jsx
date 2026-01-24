import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import "./AuthForms.css";

const getApiUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (import.meta.env.PROD && !apiUrl) {
    console.error('⚠️  VITE_API_URL no está configurada en producción!');
  }
  return (apiUrl || (import.meta.env.DEV ? 'http://localhost:5000' : '')).replace(/\/+$/, '');
};

const API = getApiUrl();
const BASE = `${API}/api/auth`;                        // 🔧 ruta base correcta

export default function Registro() {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const password = watch("password");

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // 🔧 mapear a lo que espera el backend
      const payload = { name: data.nombre, email: data.email, password: data.password };

      const res = await fetch(`${BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // credentials: "include", // opcional; no hace falta si usas JWT en localStorage
        body: JSON.stringify(payload),
      });

      const result = await res.json().catch(() => ({}));
      if (res.ok) {
        alert("Registro exitoso");
        navigate("/login");
      } else {
        alert(result.message || "No se pudo registrar");
      }
    } catch (err) {
      console.error(err);
      alert("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Crear cuenta</h2>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <input
          type="text"
          placeholder="Nombre"
          {...register("nombre", { required: "El nombre es obligatorio" })}
        />
        {errors.nombre && <p className="error">{errors.nombre.message}</p>}

        <input
          type="email"
          placeholder="Correo electrónico"
          {...register("email", { required: "El correo es obligatorio" })}
        />
        {errors.email && <p className="error">{errors.email.message}</p>}

        <input
          type="password"
          placeholder="Contraseña"
          {...register("password", {
            required: "La contraseña es obligatoria",
            minLength: { value: 6, message: "Mínimo 6 caracteres" },
          })}
        />
        {errors.password && <p className="error">{errors.password.message}</p>}

        <input
          type="password"
          placeholder="Confirmar contraseña"
          {...register("confirmPassword", {
            validate: (v) => v === password || "Las contraseñas no coinciden",
          })}
        />
        {errors.confirmPassword && (
          <p className="error">{errors.confirmPassword.message}</p>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Creando..." : "Registrarme"}
        </button>
      </form>

      <p className="alt-action">
        ¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link>
      </p>
    </div>
  );
}
