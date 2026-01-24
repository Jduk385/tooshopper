#!/bin/bash

# Script de deploy para VPS Hostinger
# Asegúrate de configurar las variables antes de ejecutar

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Iniciando deploy a producción...${NC}"

# Variables - CONFIGURA ESTAS
VPS_USER="usuario"  # Tu usuario SSH
VPS_HOST="tudominio.com"  # IP o dominio del VPS
VPS_PATH="/var/www/tooshopper"  # Ruta del proyecto en el VPS
BRANCH="dev"  # Rama a deployar

echo -e "${BLUE}📦 Step 1: Committing local changes...${NC}"
git add .
git commit -m "Deploy: $(date +'%Y-%m-%d %H:%M:%S')"

echo -e "${BLUE}📤 Step 2: Pushing to repository...${NC}"
git push origin $BRANCH

echo -e "${BLUE}🔗 Step 3: Connecting to VPS and deploying...${NC}"

ssh $VPS_USER@$VPS_HOST << 'ENDSSH'
    cd /var/www/tooshopper
    
    echo "📥 Pulling latest changes..."
    git pull origin dev
    
    echo "🔧 Updating backend..."
    cd backend
    npm install --production
    
    echo "🔄 Restarting backend service..."
    pm2 restart tooshopper-backend
    
    echo "⚛️  Building frontend..."
    cd ..
    npm install
    npm run build
    
    echo "✅ Deploy completed!"
    pm2 status
ENDSSH

echo -e "${GREEN}✅ Deploy completado exitosamente!${NC}"
echo -e "${BLUE}🌐 Verifica tu sitio en: https://$VPS_HOST${NC}"
