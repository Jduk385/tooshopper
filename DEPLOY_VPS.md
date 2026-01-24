# Deploy a VPS Hostinger

Guía completa para hacer deploy del proyecto TooShopper en un VPS de Hostinger.

## Pre-requisitos

- Acceso SSH al VPS
- Node.js instalado en el VPS (versión 18 o superior)
- MongoDB instalado o acceso a MongoDB Atlas
- Nginx instalado
- PM2 instalado (para mantener el backend corriendo)
- Tu dominio apuntando al VPS

## Paso 1: Commitear y Push de los Cambios

Desde tu máquina local:

```bash
# Agregar todos los cambios
git add .

# Commit
git commit -m "Fix: Configuración de API y mejoras de autenticación"

# Push a la rama principal (main o master)
git push origin dev  # o main, según tu configuración
```

## Paso 2: Conectar al VPS

```bash
ssh usuario@tu-ip-o-dominio
# o
ssh usuario@tudominio.com
```

## Paso 3: Configurar el Backend

### 3.1. Navegar o clonar el proyecto

```bash
# Si ya existe el proyecto
cd /var/www/tooshopper
git pull origin dev  # o la rama que uses

# Si es la primera vez
cd /var/www
git clone https://github.com/tu-usuario/tooshopper.git
cd tooshopper
```

### 3.2. Configurar variables de entorno del backend

```bash
cd backend
nano .env  # o vim .env
```

Agregar:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tooshopper  # o tu MongoDB Atlas URI
JWT_SECRET=tu_super_secreto_seguro_aqui_cambiar_en_produccion
NODE_ENV=production
```

### 3.3. Instalar dependencias y arrancar con PM2

```bash
# Instalar dependencias
npm install --production

# Si PM2 no está instalado
npm install -g pm2

# Iniciar el backend con PM2
pm2 start index.js --name tooshopper-backend

# Guardar la configuración de PM2
pm2 save

# Configurar PM2 para inicio automático
pm2 startup
```

## Paso 4: Configurar el Frontend

### 4.1. Configurar variables de entorno

```bash
cd /var/www/tooshopper
nano .env.production
```

Agregar:

```env
VITE_API_URL=https://tudominio.com/api
# O si usas un subdominio para el API:
# VITE_API_URL=https://api.tudominio.com
```

### 4.2. Build del frontend

```bash
npm install
npm run build
```

Esto creará la carpeta `dist/` con los archivos estáticos del frontend.

## Paso 5: Configurar Nginx

### 5.1. Crear configuración de Nginx

```bash
sudo nano /etc/nginx/sites-available/tooshopper
```

Agregar la siguiente configuración:

```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    # Frontend - Archivos estáticos de React
    root /var/www/tooshopper/dist;
    index index.html;

    # Configuración para React Router (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy para el backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Archivos estáticos - caché
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 5.2. Activar el sitio

```bash
# Crear symlink
sudo ln -s /etc/nginx/sites-available/tooshopper /etc/nginx/sites-enabled/

# Probar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

## Paso 6: Configurar SSL con Certbot (HTTPS)

```bash
# Instalar Certbot (si no está instalado)
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obtener certificado SSL
sudo certbot --nginx -d tudominio.com -d www.tudominio.com

# Renovación automática (ya viene configurada)
sudo certbot renew --dry-run
```

## Paso 7: Actualizar CORS en el Backend

Asegúrate de que el backend acepte requests de tu dominio. Edita `backend/index.js`:

```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',           // desarrollo local
    'https://tudominio.com',           // producción
    'https://www.tudominio.com'        // con www
  ],
  credentials: true
}));
```

Después de editar, reinicia el backend:

```bash
pm2 restart tooshopper-backend
```

## Comandos Útiles para Actualizaciones Futuras

### Script de actualización rápida

Crea un archivo `deploy.sh` en el VPS:

```bash
nano /var/www/tooshopper/deploy.sh
```

Contenido:

```bash
#!/bin/bash
cd /var/www/tooshopper

echo "📦 Pulling latest changes..."
git pull origin dev

echo "🔧 Installing backend dependencies..."
cd backend
npm install --production

echo "🔄 Restarting backend..."
pm2 restart tooshopper-backend

echo "⚛️  Building frontend..."
cd ..
npm install
npm run build

echo "✅ Deploy completed!"
```

Hacer ejecutable:

```bash
chmod +x /var/www/tooshopper/deploy.sh
```

Uso:

```bash
./deploy.sh
```

### Comandos PM2 útiles

```bash
# Ver status
pm2 status

# Ver logs
pm2 logs tooshopper-backend

# Reiniciar
pm2 restart tooshopper-backend

# Detener
pm2 stop tooshopper-backend

# Ver monitoreo
pm2 monit
```

### Comandos Nginx útiles

```bash
# Probar configuración
sudo nginx -t

# Reiniciar
sudo systemctl restart nginx

# Ver logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

## Troubleshooting

### Error: Cannot GET /api/...

- Verifica que el backend esté corriendo: `pm2 status`
- Verifica logs: `pm2 logs tooshopper-backend`
- Verifica configuración de Nginx: `sudo nginx -t`

### Error: CORS

- Asegúrate de que tu dominio esté en la lista de `origin` en `backend/index.js`
- Reinicia el backend después de cambios: `pm2 restart tooshopper-backend`

### Página en blanco

- Verifica que el build se haya creado: `ls -la dist/`
- Verifica permisos: `sudo chown -R www-data:www-data /var/www/tooshopper/dist`
- Verifica configuración de Nginx para React Router

### Backend no arranca

- Verifica que MongoDB esté corriendo: `sudo systemctl status mongod`
- Verifica las variables de entorno: `cd backend && cat .env`
- Verifica logs: `pm2 logs tooshopper-backend`

## Checklist de Deploy

- [ ] Git push de los cambios
- [ ] SSH al VPS
- [ ] Git pull en el servidor
- [ ] Configurar .env del backend
- [ ] Instalar dependencias del backend
- [ ] Iniciar/reiniciar backend con PM2
- [ ] Configurar .env.production del frontend
- [ ] Build del frontend
- [ ] Configurar Nginx
- [ ] Configurar SSL
- [ ] Verificar CORS en backend
- [ ] Probar la aplicación

## Notas de Seguridad

1. **MongoDB**: Si usas MongoDB local, configura autenticación
2. **JWT_SECRET**: Usa un secreto fuerte y diferente al de desarrollo
3. **Firewall**: Configura UFW para solo permitir puertos necesarios (80, 443, 22)
4. **SSH**: Considera deshabilitar autenticación por password y usar solo SSH keys
5. **.env**: Nunca subas archivos .env a git
