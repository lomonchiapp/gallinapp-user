# 🔐 Solución: Error de Google OAuth en Development Build

## ❌ Error Actual

```
FirebaseError: Invalid Idp Response: the Google id_token is not allowed to be used with this application. 
Its audience (OAuth 2.0 client ID) is 58539992128-orbman05sk0j6qjspo32femr44ervmq0.apps.googleusercontent.com, 
which is not authorized to be used in the project with project_number: 216089169768.
```

## 🎯 Causa del Problema

El OAuth Client ID que estás usando **NO** está autorizado en Firebase Authentication. Firebase necesita que agregues explícitamente este Client ID como un proveedor autorizado.

## ✅ Solución Paso a Paso

### Paso 1: Ir a Firebase Console

1. Abre [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: **gallinapp-ac9d8**
3. Ve a: **Authentication** → **Sign-in method**

### Paso 2: Configurar Google como Proveedor

1. Busca **Google** en la lista de proveedores
2. Haz clic en el proveedor de Google
3. Asegúrate de que esté **Habilitado**

### Paso 3: Agregar Client IDs Autorizados

En la configuración de Google, verás una sección llamada **"OAuth client IDs for use with Google's One Tap, iOS, and Android"** o **"Allowlist client IDs from external projects (optional)"**.

Aquí necesitas agregar el Client ID que estás usando:

```
58539992128-orbman05sk0j6qjspo32femr44ervmq0.apps.googleusercontent.com
```

**Pasos específicos:**
1. En la configuración del proveedor de Google en Firebase
2. Expande la sección **"Web SDK configuration"** (configuración del SDK web)
3. En **"Allowlist client IDs from external projects"**, haz clic en **"Add an OAuth client ID"**
4. Pega: `58539992128-orbman05sk0j6qjspo32femr44ervmq0.apps.googleusercontent.com`
5. Haz clic en **"Save"** o **"Guardar"**

### Paso 4: Crear Client IDs Específicos para Android/iOS (Recomendado)

Para production y mejor experiencia, deberías crear Client IDs específicos:

#### 📱 Para Android Development Build

1. Ve a [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
2. Selecciona tu proyecto
3. Clic en **"CREATE CREDENTIALS"** → **"OAuth client ID"**
4. Tipo: **Android**
5. Configuración:
   - **Name**: `Gallinapp Android Development`
   - **Package name**: `com.gallinapp.pro`
   - **SHA-1 certificate fingerprint**: Necesitas obtener el SHA-1 del keystore de desarrollo

**Obtener SHA-1 del Development Keystore:**

```bash
# En Windows, el keystore de debug está en:
# C:\Users\tu-usuario\.android\debug.keystore

keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

Busca la línea que dice **SHA1:** y copia ese valor.

6. Pega el SHA-1 en Google Cloud Console
7. Clic en **"Create"**
8. **Copia el Client ID generado**

#### 📱 Para iOS Development Build

1. En Google Cloud Console
2. Clic en **"CREATE CREDENTIALS"** → **"OAuth client ID"**
3. Tipo: **iOS**
4. Configuración:
   - **Name**: `Gallinapp iOS Development`
   - **Bundle ID**: `com.gallinapp.pro`
5. Clic en **"Create"**
6. **Copia el Client ID generado**

### Paso 5: Agregar TODOS los Client IDs a Firebase

Una vez que tengas los Client IDs específicos de Android e iOS, agrégalos TODOS a Firebase:

1. Ve a Firebase Console → Authentication → Sign-in method → Google
2. En **"Allowlist client IDs from external projects"**, agrega:
   - Tu Web Client ID actual: `58539992128-orbman05sk0j6qjspo32femr44ervmq0.apps.googleusercontent.com`
   - El nuevo Android Client ID que creaste
   - El nuevo iOS Client ID que creaste
3. Guarda los cambios

### Paso 6: Actualizar la Configuración de la App

Crea o actualiza el archivo `.env` en la raíz del proyecto:

```env
# Web Client ID (para Expo Go o Web)
EXPO_PUBLIC_GOOGLE_CLIENT_ID=58539992128-orbman05sk0j6qjspo32femr44ervmq0.apps.googleusercontent.com

# Android Client ID (para development y production builds)
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=TU_NUEVO_ANDROID_CLIENT_ID.apps.googleusercontent.com

# iOS Client ID (para development y production builds)
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=TU_NUEVO_IOS_CLIENT_ID.apps.googleusercontent.com

# Web Client ID para Firebase (importante para signInWithCredential)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=58539992128-orbman05sk0j6qjspo32femr44ervmq0.apps.googleusercontent.com
```

**⚠️ IMPORTANTE:** El `GOOGLE_WEB_CLIENT_ID` debe ser el mismo que usas en Firebase Console como el principal Client ID del proyecto.

### Paso 7: Verificar app.config.js

Asegúrate de que `app.config.js` use las variables de entorno correctamente (ya lo tienes configurado en las líneas 108-111).

### Paso 8: Limpiar y Rebuildearel Development Build

```bash
# Limpiar caché
pnpm start --clear

# Para Android
eas build --profile development --platform android

# Para iOS
eas build --profile development --platform ios
```

## 🔍 Verificación Rápida (Solución Temporal)

Si solo quieres probar rápidamente sin crear nuevos Client IDs:

1. Ve a Firebase Console → Authentication → Sign-in method → Google
2. Agrega `58539992128-orbman05sk0j6qjspo32femr44ervmq0.apps.googleusercontent.com` a los Client IDs permitidos
3. Guarda los cambios
4. Espera 5-10 minutos para que se propague la configuración
5. Reinstala el development build
6. Prueba de nuevo

## 🎯 ¿Por Qué Sucede Esto?

El flujo de Google OAuth funciona así:

1. Tu app solicita autenticación con un Client ID específico
2. Google genera un `id_token` con ese Client ID como "audience"
3. Envías el `id_token` a Firebase
4. Firebase verifica que el "audience" del token esté autorizado
5. **Si el Client ID no está en la lista permitida → ERROR**

## 🐛 Troubleshooting

### Error persiste después de agregar el Client ID

- Espera 10-15 minutos para que se propague la configuración
- Desinstala y reinstala el development build
- Verifica que hayas guardado los cambios en Firebase Console

### No sé cuál es mi Web Client ID

1. Ve a [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
2. Busca el Client ID de tipo **"Web application"**
3. Ese es tu Web Client ID

### El SHA-1 no coincide

Si usas un keystore diferente para desarrollo:
- Encuentra tu keystore
- Extrae el SHA-1 con el comando `keytool`
- Actualiza el Client ID de Android en Google Cloud Console

### Error: "Error 10" en Android

Este error significa que el package name o SHA-1 no coinciden. Verifica:
- Package name en `app.json`: `com.gallinapp.pro`
- SHA-1 del keystore que estás usando
- Client ID de Android en Google Cloud Console

## 📚 Referencias

- [Firebase Authentication - Google](https://firebase.google.com/docs/auth/android/google-signin)
- [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- [Expo Google Authentication](https://docs.expo.dev/guides/google-authentication/)

## ✅ Checklist Final

- [ ] Proveedor de Google habilitado en Firebase
- [ ] Web Client ID agregado a Firebase allowlist
- [ ] Android Client ID creado (si usas Android)
- [ ] iOS Client ID creado (si usas iOS)
- [ ] Todos los Client IDs agregados a Firebase allowlist
- [ ] Variables de entorno configuradas en `.env`
- [ ] Development build reconstruido
- [ ] Esperado 10 minutos para propagación
- [ ] Probado en el dispositivo

---

**Última actualización:** Diciembre 2025

