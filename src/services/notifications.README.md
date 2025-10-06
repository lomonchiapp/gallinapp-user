# Sistema de Notificaciones - Asoaves

## 📋 Descripción General

El sistema de notificaciones de Asoaves es una solución robusta y escalable diseñada para manejar notificaciones en tiempo real, con soporte preparado para push notifications.

## 🏗️ Arquitectura

### Componentes Principales

1. **Tipos (`src/types/notification.ts`)**
   - Definiciones TypeScript completas
   - Enums para categorías, prioridades, tipos y estados
   - Interfaces para notificaciones, configuración y filtros

2. **Servicio (`src/services/notifications.service.ts`)**
   - CRUD completo de notificaciones
   - Integración con Firestore
   - Templates predefinidos
   - Preparado para push notifications

3. **Store (`src/stores/notificationsStore.ts`)**
   - Estado global con Zustand
   - Actualizaciones en tiempo real
   - Gestión de configuración
   - Estadísticas automáticas

4. **Hook (`src/hooks/useNotifications.ts`)**
   - API simplificada para componentes
   - Funciones categorizadas
   - Auto-inicialización

5. **Componentes UI**
   - `notifications.tsx`: Página principal
   - `NotificationSettingsModal.tsx`: Configuración
   - `NotificationBadge.tsx`: Contador visual

## 🚀 Uso Básico

### 1. En un Componente

```typescript
import { useNotifications } from '../hooks/useNotifications';

function MyComponent() {
  const { notify, production, unreadCount } = useNotifications();

  const handleEvent = async () => {
    // Notificación simple
    await notify('Título', 'Mensaje', {
      priority: NotificationPriority.HIGH,
      sendPush: true
    });

    // Notificación específica
    await production.mortalidadAlta('lote123', 'Lote A', 15.5);
  };

  return (
    <View>
      <Text>Notificaciones sin leer: {unreadCount}</Text>
      <Button onPress={handleEvent} title="Notificar" />
    </View>
  );
}
```

### 2. En un Hook Personalizado

```typescript
import { useNotifications } from '../hooks/useNotifications';

export const useMyHook = () => {
  const { production, financial } = useNotifications();

  const processData = async (data: any) => {
    // Lógica de negocio...
    
    if (data.mortality > threshold) {
      await production.mortalidadAlta(data.loteId, data.name, data.mortality);
    }
    
    if (data.expense > limit) {
      await financial.gastoAlto(data.amount, data.category);
    }
  };

  return { processData };
};
```

## 📊 Tipos de Notificaciones

### Por Categoría

- **PRODUCTION**: Producción y rendimiento
- **FINANCIAL**: Finanzas y gastos
- **SYSTEM**: Sistema y mantenimiento
- **REMINDER**: Recordatorios
- **EVENT**: Eventos importantes
- **CUSTOM**: Personalizadas

### Por Prioridad

- **CRITICAL**: Requiere atención inmediata
- **HIGH**: Importante, notificar pronto
- **MEDIUM**: Normal
- **LOW**: Informativa

### Tipos Específicos

```typescript
// Producción
NotificationType.MORTALIDAD_ALTA
NotificationType.PRODUCCION_BAJA
NotificationType.PESO_OBJETIVO
NotificationType.MADURACION_LISTA

// Finanzas
NotificationType.GASTO_ALTO
NotificationType.RENTABILIDAD_BAJA
NotificationType.META_INGRESOS

// Eventos
NotificationType.LOTE_CREADO
NotificationType.LOTE_FINALIZADO
NotificationType.VENTA_REGISTRADA

// Recordatorios
NotificationType.REGISTRO_PENDIENTE
NotificationType.VACUNACION_PENDIENTE
NotificationType.REVISION_LOTE
```

## 🔧 API del Hook `useNotifications`

### Estado
```typescript
const {
  notifications,     // Array de notificaciones
  stats,            // Estadísticas
  settings,         // Configuración del usuario
  unreadCount,      // Contador de no leídas
  isLoading,        // Estado de carga
  error,            // Errores
} = useNotifications();
```

### Funciones Básicas
```typescript
// Crear notificación personalizada
await createNotification({
  type: NotificationType.CUSTOM,
  category: NotificationCategory.CUSTOM,
  priority: NotificationPriority.MEDIUM,
  title: 'Mi Título',
  message: 'Mi mensaje',
  sendPush: true
});

// Notificación simple
await notify('Título', 'Mensaje', {
  priority: NotificationPriority.HIGH,
  sendPush: true
});
```

### Notificaciones Categorizadas

#### Producción
```typescript
const { production } = useNotifications();

await production.mortalidadAlta(loteId, loteName, percentage);
await production.pesoObjetivo(loteId, loteName, pesoActual, pesoObjetivo);
await production.produccionBaja(loteId, loteName, actual, esperada);
await production.maduracionLista(loteId, loteName, tipoAve, edadDias);
```

#### Finanzas
```typescript
const { financial } = useNotifications();

await financial.gastoAlto(amount, categoria, loteId?, loteName?);
await financial.rentabilidadBaja(loteId, loteName, margen);
await financial.metaIngresos(metaAmount, actualAmount, periodo);
```

#### Eventos
```typescript
const { events } = useNotifications();

await events.loteCreado(loteId, loteName, tipoAve);
await events.loteFinalizadoCallback(loteId, loteName, tipoAve, duracionDias);
await events.ventaRegistrada(loteId, loteName, cantidad, monto);
```

#### Recordatorios
```typescript
const { reminders } = useNotifications();

await reminders.registroPendiente(loteId, loteName, tipoRegistro);
await reminders.vacunacionPendiente(loteId, loteName, tipoVacuna, fechaVencimiento);
await reminders.revisionLote(loteId, loteName, diasSinRevision);
```

## 🎨 Componentes UI

### Badge de Notificaciones
```typescript
import NotificationBadge, { NotificationIconBadge } from '../components/ui/NotificationBadge';

// Badge simple
<NotificationBadge count={5} />

// Badge con icono
<NotificationIconBadge count={unreadCount}>
  <Ionicons name="notifications" size={24} />
</NotificationIconBadge>
```

### Modal de Configuración
```typescript
import NotificationSettingsModal from '../components/ui/NotificationSettingsModal';

<NotificationSettingsModal
  visible={showSettings}
  onClose={() => setShowSettings(false)}
  settings={settings}
  onSave={updateSettings}
/>
```

## 🔔 Push Notifications

### Preparación
El sistema está preparado para push notifications. Para implementar:

1. **Instalar dependencias**:
```bash
npx expo install expo-notifications expo-device expo-constants
```

2. **Configurar en `notifications.service.ts`**:
```typescript
import * as Notifications from 'expo-notifications';

const schedulePushNotification = async (notificationId, notification) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: notification.title,
      body: notification.message,
      data: { notificationId, ...notification.data },
    },
    trigger: null, // Inmediato
  });
};
```

3. **Solicitar permisos**:
```typescript
const { status } = await Notifications.requestPermissionsAsync();
```

## 📱 Integración en Tabs

Para agregar el badge de notificaciones a los tabs:

```typescript
// En _layout.tsx
import { NotificationIconBadge } from '../src/components/ui/NotificationBadge';
import { useNotifications } from '../src/hooks/useNotifications';

function TabIcon({ name, color }: { name: string, color: string }) {
  const { unreadCount } = useNotifications();
  
  if (name === 'settings') {
    return (
      <NotificationIconBadge count={unreadCount}>
        <Ionicons name="settings" size={24} color={color} />
      </NotificationIconBadge>
    );
  }
  
  return <Ionicons name={name} size={24} color={color} />;
}
```

## 🔍 Filtros y Búsqueda

```typescript
const { applyFilter } = useNotificationsStore();

// Filtrar por estado
await applyFilter({
  status: [NotificationStatus.UNREAD]
});

// Filtrar por categoría y prioridad
await applyFilter({
  category: [NotificationCategory.PRODUCTION],
  priority: [NotificationPriority.HIGH, NotificationPriority.CRITICAL]
});

// Filtrar por lote específico
await applyFilter({
  loteId: 'lote123'
});
```

## 📊 Estadísticas

```typescript
const { stats } = useNotifications();

console.log(stats?.total);        // Total de notificaciones
console.log(stats?.unread);       // No leídas
console.log(stats?.byCategory);   // Por categoría
console.log(stats?.byPriority);   // Por prioridad
console.log(stats?.byStatus);     // Por estado
```

## 🛠️ Configuración Avanzada

### Configuración por Usuario
```typescript
await updateSettings({
  enabled: true,
  pushEnabled: true,
  categories: {
    [NotificationCategory.PRODUCTION]: {
      enabled: true,
      pushEnabled: true,
      priority: NotificationPriority.HIGH
    }
  },
  quietHours: {
    enabled: true,
    startTime: '22:00',
    endTime: '07:00'
  }
});
```

### Limpieza Automática
```typescript
const { cleanupExpired } = useNotificationsStore();
await cleanupExpired(); // Elimina notificaciones expiradas
```

## 🔄 Tiempo Real

Las notificaciones se actualizan automáticamente en tiempo real usando Firestore subscriptions. No necesitas hacer nada adicional.

## 🚨 Manejo de Errores

```typescript
const { error, clearError } = useNotifications();

if (error) {
  Alert.alert('Error', error);
  clearError();
}
```

## 📝 Mejores Prácticas

1. **Usa las funciones categorizadas** en lugar de `createNotification` directamente
2. **Configura `sendPush: true`** solo para notificaciones importantes
3. **Incluye `data.loteId`** para notificaciones relacionadas con lotes
4. **Establece `expiresAt`** para recordatorios temporales
5. **Usa prioridades apropiadas** para no saturar al usuario
6. **Verifica configuración** antes de enviar notificaciones masivas

## 🎯 Próximos Pasos

1. Implementar push notifications completas
2. Agregar notificaciones por email
3. Crear plantillas visuales personalizadas
4. Implementar notificaciones programadas
5. Agregar analytics de engagement

---

**Nota**: Este sistema está diseñado para ser escalable y fácil de usar. Para dudas o mejoras, consulta la documentación del código fuente.

















