# 🚀 GUÍA COMPLETA: EAS BUILD & SUBMIT

## ✅ TU CONFIGURACIÓN ESTÁ OPTIMIZADA

He revisado y mejorado tu configuración de EAS Build y Submit. Aquí está todo lo que necesitas saber:

---

## 📋 RESUMEN DE CAMBIOS

### ✅ **Lo que agregué:**

1. **Incremento automático de versión** ✅
   - `autoIncrement: true` en producción
   - `appVersionSource: "remote"` en CLI

2. **Números de build iniciales**
   - Android: `versionCode: 1`
   - iOS: `buildNumber: "1"`

3. **Package ID de Android**
   - `package: "com.ixiapps.asoaves"`

4. **Permisos de notificaciones**
   - `NOTIFICATIONS`
   - `RECEIVE_BOOT_COMPLETED`
   - `VIBRATE`

5. **Plugin de notificaciones**
   - Configurado para producción
   - Color verde para el ícono

6. **Perfiles de build optimizados**
   - `development`: APK para desarrollo
   - `preview`: APK para testing interno
   - `production`: AAB para Play Store
   - `production-apk`: APK de producción (para distribución directa)

---

## 🎯 CÓMO FUNCIONA EL AUTO-INCREMENT

### **Android (versionCode)**

```json
{
  "android": {
    "versionCode": 1  // ← Punto de partida
  }
}
```

Con `autoIncrement: true`, EAS **automáticamente**:
- Lee el último `versionCode` de EAS servers
- Lo incrementa en 1
- Lo usa para el nuevo build

**NO necesitas cambiar manualmente el `versionCode`**

### **iOS (buildNumber)**

```json
{
  "ios": {
    "buildNumber": "1"  // ← Punto de partida
  }
}
```

Con `autoIncrement: true`, EAS **automáticamente**:
- Lee el último `buildNumber` de EAS servers
- Lo incrementa en 1
- Lo usa para el nuevo build

**NO necesitas cambiar manualmente el `buildNumber`**

---

## 🛠️ COMANDOS DE BUILD

### **1. Build de Desarrollo (con push notifications funcionando)**

```bash
# Android
eas build --profile development --platform android

# iOS
eas build --profile development --platform ios

# Ambos
eas build --profile development --platform all
```

**Qué genera:**
- APK para Android (fácil de instalar)
- App de desarrollo para iOS
- Push notifications funcionan 100%
- Hot reload habilitado

### **2. Build de Preview (Testing interno)**

```bash
# Android
eas build --profile preview --platform android

# iOS  
eas build --profile preview --platform ios
```

**Qué genera:**
- APK para testing
- No requiere publicar en stores
- Para compartir con testers

### **3. Build de Producción (Play Store / App Store)**

```bash
# Android AAB (para Play Store)
eas build --profile production --platform android

# iOS (para App Store)
eas build --profile production --platform ios

# Ambos
eas build --profile production --platform all
```

**Qué genera:**
- AAB para Google Play Store
- IPA para Apple App Store
- **versionCode/buildNumber se incrementan automáticamente**

### **4. Build de Producción APK (para distribución directa)**

```bash
eas build --profile production-apk --platform android
```

**Qué genera:**
- APK de producción
- Para compartir directamente (sin Play Store)
- Mismo código que producción

---

## 📤 COMANDOS DE SUBMIT

### **Prerequisitos:**

#### **Para Android (Google Play):**

1. Crear cuenta de servicio en Google Cloud Console
2. Habilitar API de Google Play Developer
3. Descargar archivo JSON de credenciales
4. Guardar como `android-service-account.json` en la raíz del proyecto
5. **NO subir a Git** (agregar a `.gitignore`)

#### **Para iOS (App Store):**

1. Crear App Store Connect API Key
2. Tener Apple Developer account
3. Configurar en `eas.json` (o usar flags en comando)

### **Submit a Play Store:**

```bash
# Submit el último build de producción
eas submit --platform android --latest

# Submit un build específico
eas submit --platform android --id <build-id>

# Submit a un track específico
eas submit --platform android --track internal  # internal, alpha, beta, production
```

### **Submit a App Store:**

```bash
# Submit el último build de producción
eas submit --platform ios --latest

# Submit un build específico
eas submit --platform ios --id <build-id>
```

---

## 🔄 FLUJO DE TRABAJO RECOMENDADO

### **Desarrollo Diario:**

```bash
# Testear en Expo Go (rápido)
npm start

# O con push notifications (build de desarrollo)
eas build --profile development --platform android
```

### **Testing Interno (para testers):**

```bash
# 1. Build de preview
eas build --profile preview --platform android

# 2. Compartir el APK con testers
```

### **Release a Producción:**

```bash
# 1. Build de producción (auto-increment activado)
eas build --profile production --platform android

# 2. Submit a Play Store (track interno primero)
eas submit --platform android --latest --track internal

# 3. Testear en internal track

# 4. Promocionar a production desde Play Console
```

---

## 📊 GESTIÓN DE VERSIONES

### **Versión de la App (version)**

```json
{
  "version": "1.0.0"  // ← Cambiar manualmente
}
```

**Cuándo cambiar:**
- Nueva funcionalidad importante: `1.1.0`
- Cambios menores: `1.0.1`
- Breaking changes: `2.0.0`

Sigue [Semantic Versioning](https://semver.org/):
- `MAJOR.MINOR.PATCH`
- `2.3.1` = Major 2, Minor 3, Patch 1

### **Build Number (versionCode/buildNumber)**

```json
{
  "android": { "versionCode": 1 },
  "ios": { "buildNumber": "1" }
}
```

**NO cambiar manualmente** - EAS lo hace automáticamente

---

## ⚙️ CONFIGURACIÓN DE SUBMIT

### **Tu `eas.json` actual:**

```json
{
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./android-service-account.json",
        "track": "internal"
      },
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-asc-app-id",
        "appleTeamId": "your-team-id"
      }
    }
  }
}
```

### **Qué debes configurar:**

#### **Para Android:**

1. Crear service account en Google Cloud:
   - https://console.cloud.google.com
   - APIs & Services → Credentials
   - Create Service Account
   - Download JSON

2. Habilitar API:
   - https://console.cloud.google.com/apis/library
   - Buscar "Google Play Android Developer API"
   - Enable

3. Dar permisos en Play Console:
   - https://play.google.com/console
   - Users and permissions
   - Invite service account email
   - Dar permisos de "Release manager"

4. Guardar JSON:
   ```bash
   # Guardar el archivo JSON descargado como:
   ./android-service-account.json
   ```

5. Agregar a `.gitignore`:
   ```gitignore
   # Credenciales de EAS Submit
   android-service-account.json
   ```

#### **Para iOS:**

1. Crear App Store Connect API Key:
   - https://appstoreconnect.apple.com
   - Users and Access → Keys
   - Generate API Key
   - Download

2. Opción A: Configurar en `eas.json`
3. Opción B: Usar comando interactivo (EAS preguntará)

---

## 🎯 COMANDOS ÚTILES

### **Ver builds:**

```bash
# Listar todos los builds
eas build:list

# Ver detalles de un build
eas build:view <build-id>

# Ver último build
eas build:view --platform android
```

### **Cancelar build:**

```bash
eas build:cancel <build-id>
```

### **Ver submissions:**

```bash
# Listar submissions
eas submit:list

# Ver detalles
eas submit:view <submission-id>
```

### **Configurar credenciales:**

```bash
# Android
eas credentials

# Seleccionar Android
# Seleccionar proyecto
# Upload/Generate signing key
```

---

## 📱 INSTALAR BUILDS

### **Development Build (con push notifications):**

```bash
# 1. Build
eas build --profile development --platform android

# 2. Cuando termine, verás un QR code
# 3. Escanea con tu teléfono
# 4. Descarga e instala

# O instala directamente:
adb install path/to/app.apk
```

### **Preview/Production APK:**

```bash
# Descarga el APK desde el link de EAS
# Transfiérelo a tu teléfono
# Instala (habilita "Install from unknown sources")
```

---

## ✅ CHECKLIST ANTES DE RELEASE

### **Primera vez (Setup):**

- [ ] Crear cuenta de Google Play Developer ($25 una vez)
- [ ] Crear app en Google Play Console
- [ ] Configurar service account
- [ ] Guardar `android-service-account.json`
- [ ] Agregar a `.gitignore`
- [ ] Configurar store listing en Play Console
- [ ] Subir screenshots, descripción, etc.

### **Cada Release:**

- [ ] Incrementar `version` en `app.json` si es necesario
- [ ] Testear en development build
- [ ] Crear changelog (qué hay de nuevo)
- [ ] Build de producción: `eas build --profile production --platform android`
- [ ] Submit: `eas submit --platform android --latest --track internal`
- [ ] Testear en internal track
- [ ] Promocionar a production en Play Console
- [ ] Anunciar release

---

## 🆘 TROUBLESHOOTING

### **"Build number already exists"**

Si ves este error, significa que EAS no pudo incrementar automáticamente.

**Solución:**
```bash
# Ver el último versionCode usado
eas build:list --platform android

# Actualizar manualmente en app.json
"android": {
  "versionCode": 2  // ← Incrementar en 1
}
```

### **"Service account key not found"**

**Solución:**
```bash
# Verificar que el archivo existe
ls -la android-service-account.json

# Verificar permisos en Play Console
# El service account debe tener rol "Release manager"
```

### **"App not found in Play Console"**

**Solución:**
```bash
# 1. Crear app manualmente en Play Console
# 2. Asegurarte de que el package ID coincida:
#    app.json: "com.ixiapps.asoaves"
#    Play Console: mismo package ID
```

---

## 📚 RECURSOS

- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [EAS Submit Docs](https://docs.expo.dev/submit/introduction/)
- [Version Management](https://docs.expo.dev/build-reference/app-versions/)
- [Google Play Service Account](https://docs.expo.dev/submit/android/)
- [App Store Connect API](https://docs.expo.dev/submit/ios/)

---

## 💡 TIPS PRO

### **1. Usar GitHub Actions para CI/CD:**

```yaml
# .github/workflows/eas-build.yml
name: EAS Build
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: eas build --profile production --platform android --non-interactive
```

### **2. Usar EAS Update para hot fixes:**

```bash
# Publicar actualización OTA (sin rebuild)
eas update --branch production --message "Fix crítico"
```

### **3. Mantener múltiples versiones:**

```json
{
  "build": {
    "production-v1": {
      "extends": "production",
      "channel": "production-v1"
    },
    "production-v2": {
      "extends": "production", 
      "channel": "production-v2"
    }
  }
}
```

---

## 🎉 RESUMEN

### ✅ **Tu configuración AHORA incluye:**

1. ✅ Auto-increment de build numbers
2. ✅ Perfiles de build optimizados
3. ✅ Configuración de submit
4. ✅ Permisos de notificaciones
5. ✅ Plugin de notificaciones configurado

### 📝 **Lo que debes hacer:**

1. **Para Android:**
   - Crear service account en Google Cloud
   - Guardar JSON como `android-service-account.json`
   - Agregar a `.gitignore`

2. **Para iOS:**
   - Crear App Store Connect API Key
   - Configurar valores en `eas.json` O usar comando interactivo

3. **Primer build:**
   ```bash
   eas build --profile production --platform android
   ```

### 🚀 **¡Listo para producción!**

Ya no necesitas incrementar manualmente ningún número de versión. EAS lo hace todo automáticamente.

---

*¿Necesitas ayuda con algún paso específico? ¡Pregunta!*









