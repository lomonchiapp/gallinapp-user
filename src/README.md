# Sistema de Gestión Avícola - Asoaves

## Descripción

Sistema completo de gestión para producción avícola que incluye manejo de lotes de gallinas ponedoras, pollos israelíes, pollos de engorde, control de gastos, registros de mortalidad y análisis de rentabilidad.

## Arquitectura del Proyecto

### 📁 Estructura de Carpetas

```
src/
├── components/          # Componentes reutilizables
│   ├── forms/          # Formularios específicos
│   ├── layouts/        # Layouts y guardias
│   └── ui/             # Componentes de UI básicos
├── hooks/              # Hooks personalizados
├── services/           # Servicios de API (Firebase)
├── stores/             # Estados globales (Zustand)
├── types/              # Definiciones de tipos TypeScript
│   ├── engorde/        # Tipos para pollos de engorde
│   ├── israelies/      # Tipos para pollos israelíes  
│   ├── ponedoras/      # Tipos para gallinas ponedoras
│   └── gastos/         # Tipos para gastos y artículos
└── utils/              # Utilidades generales
```

## 🎯 Características Principales

### Gestión de Lotes
- **Gallinas Ponedoras**: Control de producción de huevos, ventas, estadísticas
- **Pollos de Levante**: Seguimiento de edad, crecimiento, ventas por peso/edad
- **Pollos de Engorde**: Control de peso, conversión alimenticia, rendimiento

### Control Financiero
- Registro de gastos por categorías (Alimento, Medicación, Mantenimiento, Otros)
- Gestión de artículos con precios y unidades de medida
- Cálculo automático de rentabilidad por lote
- Reportes financieros mensuales y anuales

### Monitoreo de Salud
- Registro de mortalidad con causas
- Alertas automáticas por tasas de mortalidad elevadas
- Seguimiento de tratamientos y medicaciones

### Analytics y Reportes
- Dashboard con métricas en tiempo real
- Análisis de tendencias de producción
- Comparación de períodos
- Exportación de datos (CSV, Excel, PDF)

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React Native con Expo
- **Estado Global**: Zustand
- **Backend**: Firebase (Firestore, Auth)
- **Tipos**: TypeScript
- **Navegación**: Expo Router
- **UI**: Componentes personalizados con React Native

## 📚 Hooks Personalizados

### `useLotesUnificados`
Hook unificado para manejo de todos los tipos de lotes:

```typescript
const { 
  todosLosLotes, 
  estadisticasGenerales, 
  cargarTodosLosLotes,
  ponedorasStore,
  israeliesStore,
  engordeStore 
} = useLotes();
```

### `useGastos`
Manejo completo de gastos y artículos:

```typescript
const { 
  articulos, 
  registrarGasto, 
  calcularEstadisticas,
  validarGasto 
} = useGastos();
```

### `useMortalidad`
Control de registros de mortalidad:

```typescript
const { 
  registros, 
  registrarMortalidad, 
  obtenerAlertasMortalidad 
} = useMortalidad();
```

### `useAnalytics`
Analytics y reportes avanzados:

```typescript
const { 
  dashboardData, 
  generarReporteDetallado, 
  exportarDatos 
} = useAnalytics();
```

## 🗃️ Stores (Zustand)

### AuthStore
Manejo de autenticación de usuarios:
```typescript
const { user, login, logout, register } = useAuthStore();
```

### PonedorasStore
Estado específico para gallinas ponedoras:
```typescript
const { 
  lotes, 
  crearLote, 
  registrarProduccion, 
  registrarVenta 
} = usePonedorasStore();
```

### IsraeliesStore
Estado específico para pollos israelíes:
```typescript
const { 
  lotes, 
  crearLote, 
  registrarEdad, 
  registrarVenta 
} = useIsraeliesStore();
```

### EngordeStore
Estado específico para pollos de engorde:
```typescript
const { 
  lotes, 
  crearLote, 
  registrarPeso 
} = useEngordeStore();
```

## 🔧 Servicios

### Firebase Services
Cada módulo tiene su servicio correspondiente:

- `auth.service.ts` - Autenticación
- `ponedoras.service.ts` - Operaciones de ponedoras
- `israelies.service.ts` - Operaciones de israelíes
- `engorde.service.ts` - Operaciones de engorde
- `articulos.service.ts` - Gestión de artículos
- `mortality.service.ts` - Registros de mortalidad

### Funciones Principales por Servicio

```typescript
// Crear lote
await crearLotePonedora(loteData);

// Registrar producción
await registrarProduccionDiaria(registro);

// Registrar gasto
await registrarGastoPonedora(gasto);

// Calcular estadísticas
await calcularEstadisticasLotePonedora(loteId);
```

## 📊 Tipos de Datos

### Lotes
```typescript
interface LotePonedora {
  id: string;
  userId: string;
  nombre: string;
  fechaInicio: Date;
  numeroAves: number;
  raza: string;
  estadoSalud: string;
  tipo: TipoAve.PONEDORA;
  activo: boolean;
}
```

### Registros
```typescript
interface HuevoRegistro {
  id: string;
  loteId: string;
  fecha: Date;
  cantidad: number;
  huevosVendidos: number;
  precioVentaUnitario: number;
}
```

### Gastos
```typescript
interface IGasto {
  id: string;
  loteId: string;
  tipoLote: string;
  articuloId: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
  categoria: CategoriaGasto;
  fecha: Date;
}
```

## 🚀 Uso del Sistema

### 1. Crear un Nuevo Lote
```typescript
import { NuevoLoteUnificado } from '../components/forms/NuevoLoteUnificado';

<NuevoLoteUnificado 
  tipoLote={TipoAve.PONEDORA}
  onSuccess={() => navigation.goBack()}
/>
```

### 2. Registrar Gastos
```typescript
import { RegistrarGastoForm } from '../components/forms/RegistrarGastoForm';

<RegistrarGastoForm 
  loteId="lote123"
  tipoLote={TipoAve.PONEDORA}
  onSuccess={() => refrescarDatos()}
/>
```

### 3. Ver Dashboard
El dashboard se actualiza automáticamente con datos reales:
```typescript
// En app/(tabs)/index.tsx
const { dashboardData, isLoading } = useAnalytics();
```

## 🔍 Funciones de Validación

El sistema incluye validaciones completas:

```typescript
// Validar gasto antes de registrar
const errores = validarGasto(gastoData);
if (errores.length === 0) {
  await registrarGasto(loteId, tipoLote, gastoData);
}

// Validar artículo
const errores = validarArticulo(articuloData);
```

## 📈 Analytics y Reportes

### Dashboard en Tiempo Real
- Resumen de lotes activos/inactivos
- Estadísticas financieras del mes
- Alertas de mortalidad
- Actividad reciente

### Reportes Detallados
- Análisis por períodos
- Comparación de rendimiento
- Exportación de datos
- Métricas de eficiencia

## 🛡️ Seguridad y Validaciones

- Autenticación con Firebase Auth
- Validación de datos en cliente y servidor
- Control de acceso por usuario
- Sanitización de inputs

## 🎨 UI/UX

- Diseño responsivo y moderno
- Componentes reutilizables
- Navegación intuitiva
- Feedback visual para acciones del usuario
- Estados de carga y error

## 📱 Compatibilidad

- iOS y Android
- Expo managed workflow
- TypeScript para mayor seguridad de tipos
- Soporte offline básico (próximamente)

## 🔄 Estado de Desarrollo

- ✅ Estructura base completa
- ✅ Hooks y stores implementados
- ✅ Servicios de Firebase
- ✅ Dashboard funcional
- ✅ Formularios de creación
- 🔄 Implementación de CRUD completo
- 🔄 Reportes avanzados
- ⏳ Tests unitarios
- ⏳ Documentación API

## 🤝 Contribución

Para contribuir al proyecto:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crea un Pull Request

## 📞 Soporte

Para soporte técnico o preguntas sobre el sistema, contacta al equipo de desarrollo.

---

**Nota**: Este sistema está en desarrollo activo. Algunas funcionalidades pueden estar en estado de implementación.
