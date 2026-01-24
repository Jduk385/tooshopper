# Guía de Configuración - Tooshopper

## Requisitos Previos
- Node.js (v16 o superior)
- MongoDB (local o remoto)
- npm o yarn

## Instalación

### 1. Instalar dependencias del Frontend
```bash
npm install
```

### 2. Instalar dependencias del Backend
```bash
cd backend
npm install
cd ..
```

### 3. Configurar Variables de Entorno
Crear archivo `.env` en la carpeta `backend/` con:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tooshopper
JWT_SECRET=tu_secreto_jwt_aqui
NODE_ENV=development
```

## Ejecución en Desarrollo

### Opción 1: Dos terminales separadas

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### Opción 2: Comandos individuales
```bash
# Backend (puerto 5000)
cd backend && npm run dev

# Frontend (puerto 5173) - en otra terminal
npm run dev
```

## Acceso
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

## Construcción para Producción

### Build del Frontend
```bash
npm run build
```
Genera la carpeta `dist/` con archivos optimizados.

### Preview del Build
```bash
npm run preview
```

## Comandos Útiles

### Desarrollo
```bash
npm run dev          # Inicia servidor de desarrollo
npm run build        # Compila para producción
npm run preview      # Preview del build de producción
npm run lint         # Ejecuta el linter
```

### Backend
```bash
cd backend
npm start            # Producción (node)
npm run dev          # Desarrollo (nodemon)
```

## Estructura del Proyecto
```
tooshopper/
├── backend/         # API Node.js + Express
├── dist/           # Build de producción (generado)
├── public/         # Archivos estáticos
├── src/            # Código fuente React
└── package.json    # Dependencias frontend
```
