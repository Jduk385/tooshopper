# tooshopper
“Tienda online de ropa premium Tooshopper — React + Vite + NodeJS”
## 🚀 Inicio Rápido

### Desarrollo Local

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd tooshopper
```

2. **Configurar variables de entorno**
```bash
# Copia el archivo de ejemplo
cp .env.example .env

# El archivo .env ya contiene:
# VITE_API_URL=http://localhost:5000
```

3. **Instalar dependencias**
```bash
# Frontend
npm install

# Backend
cd backend
npm install
cd ..
```

4. **Iniciar la aplicación**
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
npm run dev
```

La aplicación estará disponible en:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## 📦 Deploy a Producción

Para deployar a producción, consulta [DEPLOY.md](./DEPLOY.md) para instrucciones detalladas sobre:
- Configuración de variables de entorno
- Deploy en Vercel, Netlify, Railway, Render
- Configuración de CORS
- Troubleshooting

### ⚠️ Importante para Producción
Debes configurar la variable de entorno `VITE_API_URL` con la URL de tu backend en producción. Sin esto, la aplicación intentará conectarse a `localhost:5000` y fallará.

## 📁 Estructura del Proyecto

Ver [SETUP.md](./SETUP.md) para más detalles sobre la estructura del proyecto.

## 🛠️ Tecnologías

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Base de datos**: MongoDB
- **Estilos**: CSS puro
