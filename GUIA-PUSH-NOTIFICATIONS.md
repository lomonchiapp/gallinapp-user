# 📱 GUÍA COMPLETA: PUSH NOTIFICATIONS PARA ALERTAS DE BIENESTAR ANIMAL

## 🎯 Objetivo

Configurar notificaciones push para que las **alertas críticas de bienestar animal** lleguen al dispositivo móvil del usuario **incluso cuando la app está cerrada**.

---

## 📋 PROCESO COMPLETO (Paso a Paso)

### **FASE 1: Instalación de Dependencias** 📦

#### 1.1 Instalar Expo Notifications

```bash
npx expo install expo-notifications expo-device
```

**¿Qué hace?**
- `expo-notifications`: API para enviar y recibir notificaciones push
- `expo-device`: Detecta si el dispositivo es físico (push solo funciona en dispositivos reales)

#### 1.2 Actualizar package.json

El archivo `package.json` se actualizará automáticamente con:
```json
{
  "dependencies": {
    "expo-notifications": "~0.29.0",
    "expo-device": "~6.0.0"
  }
}
```

---

### **FASE 2: Configuración de Permisos** 🔐

#### 2.1 Configurar app.json / app.config.js

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff",
          "sounds": [
            "./assets/notification-sound.wav"
          ]
        }
      ]
    ],
    "android": {
      "permissions": [
        "RECEIVE_BOOT_COMPLETED",
        "WAKE_LOCK"
      ],
      "useNextNotificationsApi": true
    },
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": [
          "remote-notification"
        ]
      }
    }
  }
}
```

**¿Qué hace?**
- **Android**: Permisos para recibir notificaciones incluso si el dispositivo se reinicia
- **iOS**: Permite notificaciones en segundo plano

---

### **FASE 3: Crear Servicio de Push Notifications** 💻

#### 3.1 Archivo: `src/services/push-notifications.service.ts`

Este servicio maneja:
- ✅ Solicitar permisos al usuario
- ✅ Obtener el token Expo Push (único por dispositivo)
- ✅ Guardar el token en Firebase (para enviar notificaciones)
- ✅ Escuchar notificaciones cuando la app está abierta
- ✅ Manejar notificaciones cuando se hace tap en ellas

```typescript
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../components/config/firebase';
import { getCurrentUserId } from './auth.service';

/**
 * Configurar comportamiento de notificaciones cuando la app está en primer plano
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,    // Mostrar alerta
    shouldPlaySound: true,    // Reproducir sonido
    shouldSetBadge: true,     // Actualizar badge
  }),
});

/**
 * Solicitar permisos de notificaciones push
 */
export const requestPushPermissions = async (): Promise<boolean> => {
  // Solo funciona en dispositivos físicos
  if (!Device.isDevice) {
    console.warn('📱 Push notifications solo funcionan en dispositivos físicos');
    return false;
  }

  try {
    // Verificar permisos actuales
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Si no tiene permisos, solicitarlos
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('⚠️ Usuario denegó permisos de notificaciones push');
      return false;
    }

    console.log('✅ Permisos de push notifications concedidos');
    return true;
  } catch (error) {
    console.error('❌ Error al solicitar permisos:', error);
    return false;
  }
};

/**
 * Obtener token Expo Push del dispositivo
 */
export const getExpoPushToken = async (): Promise<string | null> => {
  if (!Device.isDevice) {
    return null;
  }

  try {
    const hasPermissions = await requestPushPermissions();
    if (!hasPermissions) {
      return null;
    }

    // Configuración del proyecto Expo
    const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
    
    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    console.log('🔑 Expo Push Token obtenido:', token.data);
    return token.data;
  } catch (error) {
    console.error('❌ Error al obtener token:', error);
    return null;
  }
};

/**
 * Guardar token en Firebase (para el usuario actual)
 */
export const savePushTokenToFirebase = async (token: string): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }

    await setDoc(
      doc(db, 'userPushTokens', userId),
      {
        token,
        platform: Platform.OS,
        deviceModel: Device.modelName,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    console.log('✅ Token guardado en Firebase para userId:', userId);
  } catch (error) {
    console.error('❌ Error al guardar token:', error);
    throw error;
  }
};

/**
 * Inicializar servicio de push notifications
 * Debe llamarse al iniciar la app
 */
export const initializePushNotifications = async (): Promise<void> => {
  try {
    console.log('🚀 Inicializando push notifications...');

    // 1. Obtener token
    const token = await getExpoPushToken();
    if (!token) {
      console.warn('⚠️ No se pudo obtener token de push');
      return;
    }

    // 2. Guardar en Firebase
    await savePushTokenToFirebase(token);

    // 3. Configurar listeners
    setupNotificationListeners();

    console.log('✅ Push notifications inicializadas correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar push notifications:', error);
  }
};

/**
 * Configurar listeners para notificaciones
 */
const setupNotificationListeners = () => {
  // Listener para cuando llega una notificación (app abierta)
  Notifications.addNotificationReceivedListener((notification) => {
    console.log('🔔 Notificación recibida:', notification);
  });

  // Listener para cuando el usuario hace tap en la notificación
  Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('👆 Usuario hizo tap en notificación:', response);
    
    // Aquí puedes navegar a una pantalla específica según el tipo de notificación
    const data = response.notification.request.content.data;
    if (data.loteId) {
      // Ejemplo: navegar a detalles del lote
      console.log('Navegar a lote:', data.loteId);
    }
  });
};

/**
 * Enviar notificación push inmediata (local)
 * Para testing
 */
export const sendLocalPushNotification = async (
  title: string,
  body: string,
  data?: any
): Promise<void> => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null, // Enviar inmediatamente
  });
};
```

---

### **FASE 4: Integrar con Servicio de Notificaciones** 🔗

#### 4.1 Actualizar `notifications.service.ts`

Reemplazar la función `schedulePushNotification`:

```typescript
import { sendPushNotification } from './push-notification-sender.service';
import { getCurrentUserId } from './auth.service';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../components/config/firebase';

/**
 * Programar y enviar push notification
 */
const schedulePushNotification = async (
  notificationId: string,
  notification: any
): Promise<void> => {
  try {
    console.log('📤 Enviando push notification:', notification.title);

    // 1. Obtener token del usuario desde Firebase
    const userId = notification.userId || getCurrentUserId();
    if (!userId) {
      console.warn('⚠️ No hay userId, no se puede enviar push');
      return;
    }

    const tokenDoc = await getDoc(doc(db, 'userPushTokens', userId));
    if (!tokenDoc.exists()) {
      console.warn('⚠️ Usuario no tiene token de push registrado');
      return;
    }

    const { token } = tokenDoc.data();
    if (!token) {
      console.warn('⚠️ Token de push no válido');
      return;
    }

    // 2. Enviar notificación push
    await sendPushNotification({
      to: token,
      title: notification.title,
      body: notification.message,
      data: notification.data,
      sound: 'default',
      priority: notification.priority === 'CRITICAL' ? 'high' : 'default',
      badge: 1,
    });

    // 3. Actualizar estado en Firebase
    await updateDoc(doc(db, 'notifications', notificationId), {
      sentToPush: true,
      pushSentAt: serverTimestamp(),
    });

    console.log('✅ Push notification enviada correctamente');
  } catch (error) {
    console.error('❌ Error al enviar push notification:', error);
  }
};
```

---

### **FASE 5: Crear Servicio de Envío** 📨

#### 5.1 Archivo: `src/services/push-notification-sender.service.ts`

```typescript
/**
 * Servicio para enviar notificaciones push usando Expo Push API
 */

export interface PushMessage {
  to: string;           // Token del dispositivo
  title: string;        // Título de la notificación
  body: string;         // Mensaje
  data?: any;           // Datos adicionales
  sound?: 'default' | null;
  priority?: 'default' | 'normal' | 'high';
  badge?: number;
  channelId?: string;
}

/**
 * Enviar notificación push usando la API de Expo
 */
export const sendPushNotification = async (
  message: PushMessage
): Promise<void> => {
  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    
    if (result.data?.status === 'error') {
      throw new Error(result.data.message);
    }

    console.log('✅ Push enviado correctamente:', result);
  } catch (error) {
    console.error('❌ Error al enviar push:', error);
    throw error;
  }
};
```

---

### **FASE 6: Inicializar en la App** 🚀

#### 6.1 Actualizar `app/_layout.tsx`

```typescript
import { useEffect } from 'react';
import { initializePushNotifications } from '../src/services/push-notifications.service';

export default function RootLayout() {
  useEffect(() => {
    // Inicializar push notifications al cargar la app
    initializePushNotifications().catch((error) => {
      console.error('Error al inicializar push notifications:', error);
    });
  }, []);

  // ... resto del código
}
```

---

## 🔔 FLUJO COMPLETO DE FUNCIONAMIENTO

### Ejemplo: Lote de Levante con 9 días sin pesar

```
1. Usuario abre la app
   ↓
2. App solicita permisos de notificaciones
   ↓
3. Usuario acepta permisos
   ↓
4. App obtiene token Expo Push único
   ↓
5. Token se guarda en Firebase: userPushTokens/userId123
   ↓
6. Sistema de monitoreo detecta lote con 9 días sin pesar
   ↓
7. animal-welfare-monitoring.service.ts crea alerta con sendPush: true
   ↓
8. notifications.service.ts guarda notificación en Firebase
   ↓
9. schedulePushNotification() busca el token del usuario
   ↓
10. Envía request a API de Expo: https://exp.host/--/api/v2/push/send
    ↓
11. Expo envía push al dispositivo del usuario
    ↓
12. Usuario recibe notificación en su teléfono (incluso con app cerrada)
    ↓
13. Usuario hace tap en la notificación
    ↓
14. App se abre y navega a detalles del lote
```

---

## 📊 ESTRUCTURA DE DATOS EN FIREBASE

### Colección: `userPushTokens`

```javascript
{
  "userId123": {
    "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
    "platform": "android",
    "deviceModel": "Samsung Galaxy S21",
    "updatedAt": "2024-10-11T10:30:00Z"
  }
}
```

### Colección: `notifications`

```javascript
{
  "notif123": {
    "userId": "userId123",
    "title": "🚨 EMERGENCIA: Levante A sin control",
    "message": "Los pollos llevan 9 días sin pesar...",
    "priority": "CRITICAL",
    "sendPush": true,
    "sentToPush": true,
    "pushSentAt": "2024-10-11T10:30:05Z",
    "pushDelivered": true,
    "status": "UNREAD",
    "data": {
      "loteId": "lote123",
      "diasSinPesar": 9
    }
  }
}
```

---

## ⚠️ CONSIDERACIONES IMPORTANTES

### 1. **Solo Dispositivos Físicos**
- ❌ Emuladores/simuladores NO reciben push notifications
- ✅ Usa un teléfono real para testing

### 2. **Límites de Expo**
- Plan gratuito: Limitado a cierto número de notificaciones
- Para producción: Considera [Expo EAS](https://expo.dev/eas)

### 3. **Batería y Rendimiento**
- Las push notifications son eficientes
- No afectan significativamente la batería

### 4. **Permisos del Usuario**
- El usuario DEBE aceptar permisos
- Si rechaza, las notificaciones solo se verán dentro de la app

---

## 🧪 TESTING

### Test 1: Notificación Local (Inmediata)

```typescript
import { sendLocalPushNotification } from './push-notifications.service';

// Enviar notificación de prueba
await sendLocalPushNotification(
  '🐔 Test de Bienestar Animal',
  'Esta es una notificación de prueba',
  { loteId: 'test123' }
);
```

### Test 2: Verificar Token

```typescript
import { getExpoPushToken } from './push-notifications.service';

const token = await getExpoPushToken();
console.log('Tu token es:', token);
// Copia este token y úsalo en: https://expo.dev/notifications
```

### Test 3: Simular Alerta de Bienestar

```typescript
import { checkWeightAlerts } from './animal-welfare-monitoring.service';

await checkWeightAlerts(
  'lote123',
  'Levante Test',
  TipoAve.POLLO_LEVANTE,
  9,  // 9 días sin pesar
  false,
  30  // 30 días de edad
);

// Deberías recibir una push notification en tu teléfono
```

---

## 🎯 PRÓXIMOS PASOS RECOMENDADOS

1. **Instalar dependencias** (5 min)
2. **Crear servicio de push** (15 min)
3. **Actualizar notifications.service** (10 min)
4. **Inicializar en app** (5 min)
5. **Testing en dispositivo real** (15 min)

**Tiempo total estimado: 50 minutos**

---

## 📚 RECURSOS ADICIONALES

- [Expo Notifications Docs](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo Push Notifications Tool](https://expo.dev/notifications)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)

---

## 💡 MEJORAS FUTURAS

### Fase 2: Notificaciones Programadas
- Recordatorios diarios a las 8 AM para pesar lotes
- Resumen semanal de alertas

### Fase 3: Canales de Notificación (Android)
- Canal "Emergencias" (sonido alto, vibración)
- Canal "Recordatorios" (sonido suave)
- Canal "Informativas" (sin sonido)

### Fase 4: Notificaciones Ricas
- Acciones directas ("Pesar ahora", "Ver lote")
- Imágenes (foto del lote)
- Progreso (barra de producción)

---

¿Quieres que implemente el código completo ahora? 🚀














