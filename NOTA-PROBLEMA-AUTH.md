# ⚠️ Problema Detectado: Sincronización de Autenticación

## Fecha: 27 de Octubre, 2025
## Estado: 🔴 **REQUIERE ATENCIÓN**

---

## 🔍 Problema Identificado

### Síntomas en los Logs

```
LOG  ✅ [AuthStore] Hidratación completada: {"hasUser": true, "isAuthenticated": true, "userEmail": "admin@gmail.com"}
LOG  🔄 AuthGuard: Inicializando listener de Firebase Auth...
LOG  🔥 Firebase Auth State Changed: {"currentAuthState": true, "hasUser": false, "userEmail": undefined}
LOG  🚪 AuthListener: Usuario cerrado sesión
WARN  ⚠️ Usuario persistido pero no en Firebase - limpiando sesión
```

### Causa Raíz

Firebase Auth no está persistiendo la sesión correctamente. El warning de Firebase lo confirma:

```
WARN  [2025-10-27T18:38:52.132Z]  @firebase/auth: Auth (12.2.0): 
You are initializing Firebase Auth for React Native without providing
AsyncStorage. Auth state will default to memory persistence and will not
persist between sessions.
```

---

## 💡 Solución

### Configurar Firebase Auth con AsyncStorage

Necesitas modificar la inicialización de Firebase Auth para usar persistencia correcta.

**Archivo a modificar:** `src/components/config/firebase.ts` (o donde inicialices Firebase)

**Cambio necesario:**

```typescript
// ANTES (incorrecto - sin persistencia)
import { getAuth } from 'firebase/auth';
export const auth = getAuth(app);

// DESPUÉS (correcto - con persistencia)
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
```

---

## 🎯 Impacto

### Actual (Sin arreglar)
- Usuario debe hacer login cada vez que abre la app
- Cache de appConfig se pierde (porque se desautentica)
- Push notifications fallan
- Notificaciones fallan

### Después del Arreglo
- Usuario mantiene sesión entre cierres de app
- Cache persiste correctamente
- Todo funciona como esperado

---

## 📝 Pasos para Resolver

1. Verificar que `@react-native-async-storage/async-storage` esté instalado:
   ```bash
   npm list @react-native-async-storage/async-storage
   ```

2. Si no está instalado:
   ```bash
   npm install @react-native-async-storage/async-storage
   npx pod-install  # Solo para iOS
   ```

3. Modificar `src/components/config/firebase.ts` según el código arriba

4. Reiniciar app y probar login

---

## ✅ Verificación

Después de aplicar el fix, los logs deberían mostrar:

```
✅ [AuthStore] Hidratación completada: {"hasUser": true, "isAuthenticated": true, "userEmail": "admin@gmail.com"}
✅ Firebase Auth State Changed: {"currentAuthState": true, "hasUser": true, "userEmail": "admin@gmail.com"}
✅ Usuario autenticado correctamente
```

Sin warnings de Firebase Auth.

---

## 📚 Notas

Este problema es independiente de las mejoras implementadas hoy (cache de productos, appConfig, etc.). Sin embargo, **debe resolverse** para que todo funcione correctamente.

La buena noticia es que las implementaciones de cache y suscripciones ya están listas - solo falta arreglar la persistencia de Firebase Auth.

---

**Estado:** Pendiente de implementar
**Prioridad:** Alta
**Tiempo estimado:** 5 minutos






