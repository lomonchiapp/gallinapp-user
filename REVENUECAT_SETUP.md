# 🎯 Configuración de RevenueCat

## 📋 Resumen

Esta guía te ayudará a configurar RevenueCat para gestionar suscripciones en Gallinapp.

---

## 🔧 1. Configuración en RevenueCat Dashboard

### Paso 1: Crear Proyecto
1. Ve a [app.revenuecat.com](https://app.revenuecat.com)
2. Crea un nuevo proyecto llamado "Gallinapp"
3. Selecciona las plataformas: iOS y Android

### Paso 2: Configurar Entitlement
1. Ve a **Entitlements** en el menú
2. Crea un nuevo entitlement llamado: `Gallinapp Pro`
3. Este es el nombre que usamos en el código

### Paso 3: Crear Productos
En **Products**, crea estos productos:

#### Plan Básico
| Producto ID | Nombre | Tipo | Precio |
|-------------|--------|------|--------|
| `basic_monthly` | Plan Básico Mensual | Subscription | $19.99/mes |
| `basic_trimestral` | Plan Básico Trimestral | Subscription | $54.99/trim |
| `basic_annual` | Plan Básico Anual | Subscription | $199.99/año |

#### Plan Pro
| Producto ID | Nombre | Tipo | Precio |
|-------------|--------|------|--------|
| `pro_monthly` | Plan Pro Mensual | Subscription | $49.99/mes |
| `pro_trimestral` | Plan Pro Trimestral | Subscription | $134.99/trim |
| `pro_annual` | Plan Pro Anual | Subscription | $499.99/año |

#### Plan Enterprise
| Producto ID | Nombre | Tipo | Precio |
|-------------|--------|------|--------|
| `enterprise_monthly` | Plan Enterprise Mensual | Subscription | $99.99/mes |
| `enterprise_trimestral` | Plan Enterprise Trimestral | Subscription | $269.99/trim |
| `enterprise_annual` | Plan Enterprise Anual | Subscription | $999.99/año |

### Paso 4: Configurar Offering
1. Ve a **Offerings**
2. Crea un nuevo offering llamado "Default"
3. Agrega los 9 productos creados (3 planes x 3 períodos)
4. Asocia cada producto con el entitlement `Gallinapp Pro`

**Tip**: Organiza los productos por paquetes:
- **Monthly Package**: basic_monthly, pro_monthly, enterprise_monthly
- **Quarterly Package**: basic_trimestral, pro_trimestral, enterprise_trimestral
- **Annual Package**: basic_annual, pro_annual, enterprise_annual

### Paso 5: Configurar Paywall
1. Ve a **Paywalls** en el menú
2. Crea un nuevo paywall
3. Diseña tu paywall con:
   - 3 planes (Basic, Pro, Enterprise)
   - Toggle para seleccionar período (Mensual, Trimestral, Anual)
   - Destacar el plan más popular (Pro)
   - Mostrar ahorro en planes anuales
4. Asócialo con el offering "Default"

---

## 🔑 2. API Keys

Ya tienes configurada tu API key de test en `.env`:

```env
EXPO_PUBLIC_REVENUECAT_API_KEY=test_ymFMDrtBLXkdfqUwhdHMZKBPjfB
```

### Para Producción:
1. Ve a **API Keys** en RevenueCat Dashboard
2. Copia la **Public SDK Key** de producción
3. Actualiza `.env` con la key de producción cuando estés listo

---

## 📱 3. Configuración en App Store Connect (iOS)

### Crear Productos de Suscripción:
1. Ve a [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Selecciona tu app
3. Ve a **Features** → **In-App Purchases**
4. Crea productos con los mismos IDs (9 productos en total):

**Básico:**
- `basic_monthly` - $19.99/mes
- `basic_trimestral` - $54.99/3 meses
- `basic_annual` - $199.99/año

**Pro:**
- `pro_monthly` - $49.99/mes
- `pro_trimestral` - $134.99/3 meses
- `pro_annual` - $499.99/año

**Enterprise:**
- `enterprise_monthly` - $99.99/mes
- `enterprise_trimestral` - $269.99/3 meses
- `enterprise_annual` - $999.99/año

### Conectar con RevenueCat:
1. En RevenueCat Dashboard, ve a **App Settings** → **Apple App Store**
2. Sube tu **App Store Connect API Key**
3. RevenueCat sincronizará automáticamente

---

## 🤖 4. Configuración en Google Play Console (Android)

### Crear Productos de Suscripción:
1. Ve a [play.google.com/console](https://play.google.com/console)
2. Selecciona tu app
3. Ve a **Monetization** → **Subscriptions**
4. Crea productos con los mismos IDs (9 productos en total):

**Básico:**
- `basic_monthly` - $19.99/mes
- `basic_trimestral` - $54.99/3 meses
- `basic_annual` - $199.99/año

**Pro:**
- `pro_monthly` - $49.99/mes
- `pro_trimestral` - $134.99/3 meses
- `pro_annual` - $499.99/año

**Enterprise:**
- `enterprise_monthly` - $99.99/mes
- `enterprise_trimestral` - $269.99/3 meses
- `enterprise_annual` - $999.99/año

### Conectar con RevenueCat:
1. En RevenueCat Dashboard, ve a **App Settings** → **Google Play Store**
2. Sube tu **Service Account JSON**
3. RevenueCat sincronizará automáticamente

---

## 🧪 5. Testing

### En Expo Go (Modo Preview):
```bash
# Ya configurado con datos mock
pnpm start
```
- ✅ La app carga sin errores
- ✅ Puedes ver la UI de suscripción
- ❌ NO puedes hacer compras reales

### En Development Build:
```bash
# Crear build de desarrollo
eas build --profile development --platform ios

# O para Android
eas build --profile development --platform android
```
- ✅ Funcionalidad completa
- ✅ Compras en sandbox
- ✅ Testing de flujo completo

### Testing de Sandbox:
1. **iOS**: Crea un **Sandbox Tester** en App Store Connect
2. **Android**: Usa cuentas de prueba en Google Play Console
3. Prueba compras sin cargos reales

---

## 🔍 6. Verificar Configuración

### Logs a buscar:
```
✅ RevenueCat inicializado correctamente (ios)
🔐 Entitlement check: true/false
💳 Presentando paywall...
```

### Comandos de debug:
```typescript
// Verificar entitlement
const hasAccess = await checkEntitlement();
console.log('Usuario tiene acceso:', hasAccess);

// Mostrar paywall
await presentPaywall();
```

---

## 🚀 7. Flujo de Usuario

### Compra:
1. Usuario presiona "Mejorar Plan"
2. Se muestra el paywall de RevenueCat
3. Usuario selecciona plan y paga
4. RevenueCat procesa el pago
5. App verifica entitlement
6. Usuario obtiene acceso premium

### Verificación:
```typescript
// En cualquier parte de tu app
import { useSubscription } from '@/src/hooks/useSubscription';

const { checkEntitlement } = useSubscription();

// Verificar antes de mostrar feature premium
const canAccess = await checkEntitlement();
if (canAccess) {
  // Mostrar feature premium
} else {
  // Mostrar paywall
  await presentPaywall();
}
```

---

## 📊 8. Monitoreo

### Dashboard de RevenueCat:
- **Overview**: Ingresos, suscriptores activos
- **Charts**: Métricas de conversión
- **Customers**: Lista de usuarios y sus suscripciones
- **Events**: Log de eventos en tiempo real

---

## 🆘 9. Troubleshooting

### Error: "No products found"
- ✅ Verifica que los productos existan en App Store/Play Store
- ✅ Verifica que estén asociados al entitlement
- ✅ Espera ~24h para sincronización inicial

### Error: "Paywall no se presenta"
- ✅ Verifica que tengas un paywall configurado
- ✅ Verifica que esté en el offering "Default"
- ✅ Revisa logs de RevenueCat Dashboard

### Compra no se refleja:
- ✅ Verifica webhooks en RevenueCat
- ✅ Revisa la sincronización con Firebase
- ✅ Llama a `refreshSubscription()` manualmente

---

## 🔗 Links Útiles

- [RevenueCat Dashboard](https://app.revenuecat.com)
- [Documentación RevenueCat](https://www.revenuecat.com/docs)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Google Play Console](https://play.google.com/console)

---

## ✅ Checklist de Producción

- [ ] Productos creados en App Store Connect
- [ ] Productos creados en Google Play Console
- [ ] Entitlement "Gallinapp Pro" configurado
- [ ] Offering "Default" con los 3 productos
- [ ] Paywall diseñado y publicado
- [ ] API Keys de producción en `.env`
- [ ] Development build creado y probado
- [ ] Sandbox testing completado
- [ ] Webhooks configurados (si los necesitas)
- [ ] Sincronización con Firebase funcionando

---

## 💡 Próximos Pasos

1. **Ahora (Desarrollo)**:
   - ✅ Configuración básica lista
   - ✅ UI funcionando en Expo Go
   - ⏳ Pendiente: Configurar productos en tiendas

2. **Para Testing**:
   - Crear development build con EAS
   - Configurar sandbox testers
   - Probar flujo completo de compra

3. **Para Producción**:
   - Actualizar a API keys de producción
   - Enviar app para revisión
   - Monitorear métricas en RevenueCat Dashboard

