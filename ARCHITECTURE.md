# Arquitectura Multi-Farm SaaS

## Principios de Diseño

Este sistema sigue los principios **SOLID** y garantiza **Single Source of Truth**:

### SOLID Principles

1. **Single Responsibility**: Cada servicio/clase tiene una responsabilidad única
   - `FarmService`: Gestión de farms
   - `MigrationService`: Migración de datos
   - `Adapter`: Conversión de tipos

2. **Open/Closed**: Extensible sin modificar código existente
   - Nuevas migraciones se agregan sin cambiar código existente
   - Nuevos tipos de adaptación se pueden agregar fácilmente

3. **Liskov Substitution**: Los tipos son intercambiables donde sea apropiado
   - `Organization` puede usarse como `Farm` durante la migración

4. **Interface Segregation**: Interfaces específicas y pequeñas
   - Cada servicio tiene interfaces claras y específicas

5. **Dependency Inversion**: Dependencias de abstracciones, no implementaciones
   - Los stores dependen de servicios, no de implementaciones específicas

### Single Source of Truth

**Farm es la única fuente de verdad** para:
- Datos de granjas
- Suscripciones y planes
- Colaboradores y permisos
- Configuración de granjas

`Organization` existe solo para **compatibilidad temporal** durante la migración.

## Arquitectura de Capas

```
┌─────────────────────────────────────────┐
│         UI Layer (Components)           │
│  - DashboardHeader                     │
│  - FarmSwitcher                        │
│  - MigrationPanel                      │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         State Layer (Stores)            │
│  - useFarmStore (Single Source)        │
│  - useAccountStore                     │
│  - useOrganizationStore (Legacy)       │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      Service Layer (Business Logic)     │
│  - farmUnifiedService (Orchestrator)    │
│  - farm.service.ts                      │
│  - organization.service.ts (Legacy)     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│    Migration & Compatibility Layer      │
│  - organizationToFarmMigration          │
│  - OrganizationFarmAdapter             │
│  - FarmIdResolver                      │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Data Layer (Firebase)           │
│  - farms/                               │
│  - organizations/ (Legacy)              │
│  - collaborators/                       │
│  - lotes/                               │
└─────────────────────────────────────────┘
```

## Flujo de Datos

### Lectura (Single Source of Truth)

```
1. UI Component
   ↓
2. useFarmStore.loadFarms()
   ↓
3. farmUnifiedService.getUserFarms()
   ↓
4. farm.service.loadUserFarms() [PRIMARY]
   ↓
5. Firebase: farms/
```

**Fallback para compatibilidad:**
```
Si no hay farms:
   ↓
organization.service.getUserOrganizations()
   ↓
OrganizationFarmAdapter.organizationToFarm()
   ↓
Retornar Farms adaptadas
```

### Escritura (Siempre a Farm)

```
1. UI Component
   ↓
2. useFarmStore.createFarm()
   ↓
3. farmUnifiedService.createFarm()
   ↓
4. Verificar si hay Organization activa
   ↓
5a. Si hay Organization → Migrar automáticamente
5b. Si no → Crear nueva Farm
   ↓
6. Firebase: farms/
```

## Migración Organization → Farm

### Estrategia de Migración

1. **Fase 1: Compatibilidad Dual**
   - Ambos sistemas coexisten
   - `FarmIdResolver` resuelve IDs automáticamente
   - Los documentos pueden tener `organizationId` y `farmId`

2. **Fase 2: Migración Gradual**
   - Migrar Organizations a Farms usando `organizationToFarmMigration`
   - Actualizar referencias en lotes y otros documentos
   - Mantener Organizations por compatibilidad temporal

3. **Fase 3: Deprecación**
   - Remover soporte para Organizations
   - Solo Farms como fuente de verdad

### Proceso de Migración

```typescript
// 1. Verificar si hay Organizations sin migrar
const needsMigration = await farmUnifiedService.hasUnmigratedOrganizations();

// 2. Migrar todas las Organizations
const result = await organizationToFarmMigration.migrateAll();

// 3. Actualizar referencias
await migration.updateReferences(orgId, farmId);

// 4. Recargar Farms
await farmStore.loadFarms();
```

## Estructura de Datos

### Farm (Single Source of Truth)

```typescript
interface Farm {
  id: string;
  name: string;
  farmCode: string; // Código único de 8 caracteres
  ownerId: string;
  subscription: Subscription;
  settings: FarmSettings;
  // ...
}
```

### Organization (Legacy, solo lectura)

```typescript
interface Organization {
  id: string;
  name: string;
  createdBy: string;
  // ...
}
```

**Mapeo:**
- `Organization.id` → `Farm.id` (mismo ID)
- `Organization.createdBy` → `Farm.ownerId`
- `Organization.subscription` → `Farm.subscription` (mapeado)

## Resolución de IDs

Durante la migración, los documentos pueden tener:
- `organizationId` (antiguo)
- `farmId` (nuevo)
- Ambos (durante transición)

`FarmIdResolver` resuelve automáticamente:

```typescript
// Prioridad:
1. farmId (si existe)
2. organizationId (compatibilidad)
3. null (si no hay ninguno)
```

## Servicios Clave

### farmUnifiedService

**Responsabilidad**: Garantizar Farm como Single Source of Truth

```typescript
// Siempre intenta obtener Farms primero
const farms = await farmUnifiedService.getUserFarms();

// Si no hay Farms, adapta Organizations temporalmente
// Sugiere migración si hay Organizations sin migrar
```

### OrganizationFarmAdapter

**Responsabilidad**: Convertir entre Organization y Farm

```typescript
// Organization → Farm
const farm = OrganizationFarmAdapter.organizationToFarm(org);

// Farm → Organization (compatibilidad inversa)
const org = OrganizationFarmAdapter.farmToOrganization(farm);
```

### organizationToFarmMigration

**Responsabilidad**: Migrar datos de Organization a Farm

```typescript
// Migrar una organización
await migration.migrateOrganization(org);

// Migrar todas
const result = await migration.migrateAll();
```

## Mejores Prácticas

### ✅ Hacer

1. **Siempre usar `farmUnifiedService`** para obtener farms
2. **Usar `FarmIdResolver`** para resolver IDs en queries
3. **Migrar Organizations** cuando sea posible
4. **Escribir siempre a Farms**, nunca a Organizations

### ❌ Evitar

1. **No escribir directamente a Organizations**
2. **No usar `organizationId` directamente** (usar `FarmIdResolver`)
3. **No crear nuevas Organizations** (usar Farms)
4. **No asumir que `organizationId === farmId`** (usar resolver)

## Migración de Referencias

Los documentos relacionados (lotes, ventas, etc.) deben actualizarse:

```typescript
// Antes (legacy)
{
  organizationId: "org123"
}

// Durante migración (compatibilidad dual)
{
  organizationId: "org123",
  farmId: "org123" // Mismo ID
}

// Después (solo Farm)
{
  farmId: "farm123"
}
```

## Testing

### Unit Tests

- `OrganizationFarmAdapter`: Conversión de tipos
- `FarmIdResolver`: Resolución de IDs
- `MigrationService`: Proceso de migración

### Integration Tests

- Flujo completo de migración
- Compatibilidad dual durante transición
- Fallback a Organizations cuando no hay Farms

## Roadmap

- [x] Crear tipos Farm y Account
- [x] Crear servicios de migración
- [x] Crear adaptadores de compatibilidad
- [x] Implementar Single Source of Truth
- [ ] Migrar todas las Organizations existentes
- [ ] Actualizar todos los repositorios para usar farmId
- [ ] Deprecar Organization completamente
- [ ] Remover código legacy de Organization

## Referencias

- [Plan de Migración](./.cursor/plans/multi-farm_saas_architecture_5b15052c.plan.md)
- [Tipos Farm](./src/types/farm.ts)
- [Tipos Account](./src/types/account.ts)
- [Servicio de Migración](./src/services/migration/organization-to-farm.migration.ts)


