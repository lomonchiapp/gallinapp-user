#!/bin/bash

# 📱 Script de instalación rápida de Push Notifications
# Este script instala todas las dependencias necesarias

echo "🚀 Instalando sistema de Push Notifications..."
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Instalar dependencias
echo "📦 Instalando dependencias..."
npx expo install expo-notifications expo-device

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencias instaladas correctamente${NC}"
else
    echo "❌ Error al instalar dependencias"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Instalación completada!${NC}"
echo ""
echo "📋 Próximos pasos:"
echo ""
echo "1. Agregar en app/_layout.tsx:"
echo "   ${YELLOW}import { initializePushNotifications } from '../src/services/push-notifications.service';${NC}"
echo ""
echo "   ${YELLOW}useEffect(() => {${NC}"
echo "   ${YELLOW}  initializePushNotifications();${NC}"
echo "   ${YELLOW}}, []);${NC}"
echo ""
echo "2. Rebuildar la app:"
echo "   ${YELLOW}npx expo prebuild${NC}"
echo ""
echo "3. Ejecutar en dispositivo físico:"
echo "   ${YELLOW}npx expo run:android${NC}  o  ${YELLOW}npx expo run:ios${NC}"
echo ""
echo "4. Testear con:"
echo "   ${YELLOW}import { sendLocalPushNotification } from '../src/services/push-notifications.service';${NC}"
echo "   ${YELLOW}sendLocalPushNotification('Test', 'Funciona!');${NC}"
echo ""
echo "📚 Lee RESUMEN-PUSH-NOTIFICATIONS.md para más detalles"
echo ""









