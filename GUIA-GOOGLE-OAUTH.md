# 🔐 Guía de Configuración de Google OAuth para Expo

## ❌ Problema: Error 400 "invalid request"

Este error ocurre porque el Client ID que creaste es de tipo **iOS**, pero cuando pruebas en **Expo Go** necesitas un Client ID de tipo **Web application**.

## ✅ Solución: Crear Client ID de tipo Web

### Paso 1: Ir a Google Cloud Console

1. Ve a: https://console.cloud.google.com/apis/credentials
2. Selecciona tu proyecto
3. Haz clic en **"+ CREAR CREDENCIALES"** → **"ID de cliente de OAuth"**

### Paso 2: Configurar el Client ID para Expo Go

**Tipo de aplicación:** Selecciona **"Aplicación web"** (Web application)

**Nombre:** `Gallinapp_Web` (o el nombre que prefieras)

**⚠️ Orígenes JavaScript autorizados:** 
- **DEBE ESTAR VACÍO** o dejar en blanco
- **NO agregues** `exp://localhost:8081` aquí - causará error
- Este campo es solo para URLs HTTP/HTTPS de aplicaciones web

**✅ URI de redirección autorizados:** Agrega este URI (usa HTTP, NO exp://):

```
http://localhost:8081
```

**⚠️ IMPORTANTE:** 
- Usa `http://localhost:8081` (con HTTP), NO `exp://localhost:8081`
- Google Cloud Console rechaza esquemas personalizados como `exp://`
- `expo-auth-session` manejará automáticamente la conversión a `exp://` internamente
- **NO agregues** `gallinapp://` - Google no acepta esquemas personalizados en redirect URIs

### Paso 3: Copiar el Client ID

Después de crear, copia el **ID de cliente** que se genera (será diferente al de iOS).

### Paso 4: Actualizar la configuración

Actualiza el archivo `.env` con el nuevo Client ID:

```env
EXPO_PUBLIC_GOOGLE_CLIENT_ID=tu-nuevo-client-id-web.apps.googleusercontent.com
```

O actualiza directamente en `app.config.js` línea 106.

## 📱 Para Producción (Builds Nativos)

Cuando construyas la app nativa, necesitarás:

### iOS (para builds nativos iOS)
- Client ID de tipo **iOS**
- Bundle ID: `com.gallinapp.pro`
- Usar: `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`

### Android (para builds nativos Android)
- Client ID de tipo **Android**
- Package name: `com.gallinapp.pro`
- SHA-1 fingerprint (obtener con: `keytool -list -v -keystore tu-keystore.jks`)
- Usar: `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`

## 🔄 Reiniciar el Servidor

Después de actualizar el Client ID:

```bash
# Detener el servidor (Ctrl+C)
# Limpiar caché
pnpm start --clear

# O simplemente reiniciar
pnpm start
```

## 🧪 Probar

1. Abre la app en Expo Go
2. Ve a la pantalla de login
3. Presiona "Continuar con Google"
4. Debería abrirse el navegador para autenticación

## ⚠️ Notas Importantes

- **Expo Go** usa Client ID de tipo **Web**
- **Builds nativos** usan Client IDs específicos de cada plataforma
- Los redirect URIs deben coincidir exactamente
- Puede tardar unos minutos en aplicarse la configuración

## 🐛 Troubleshooting

### Error 400: invalid request
- Verifica que el Client ID sea de tipo **Web application**
- Verifica que los redirect URIs estén configurados correctamente

### Error: redirect_uri_mismatch
- Asegúrate de que el redirect URI en Google Console sea: `http://localhost:8081`
- Expo manejará internamente la conversión a `exp://localhost:8081`
- Si Google rechaza `exp://localhost:8081`, usa `http://localhost:8081` en su lugar

### No se abre el navegador
- Verifica que `expo-web-browser` esté instalado
- Reinicia el servidor de Expo

