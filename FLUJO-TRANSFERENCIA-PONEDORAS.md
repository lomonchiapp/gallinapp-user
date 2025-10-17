# Flujo de Transferencia: Levante → Ponedoras

## 📋 Resumen

Este documento describe el flujo completo para manejar gallinas ponedoras desde pollitas hasta producción de huevos, incluyendo la transferencia de costos entre fases.

## 🎯 Problema Resuelto

**Situación**: Las gallinas ponedoras no producen huevos inmediatamente. Pasan por una fase de levante (0-20 semanas) antes de comenzar a poner huevos.

**Desafío**: ¿Cómo registrar y rastrear los costos de levante y producción de forma separada pero integrada?

**Solución**: Sistema de transferencia de lotes que hereda costos de levante y permite tracking independiente de cada fase.

## 🔄 Flujo Completo

```
┌─────────────────────────────────────────────────────────────┐
│ FASE 1: LEVANTE (0-20 semanas)                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 1. Crear Lote Levante                                       │
│    - Tipo: LEVANTE_PONEDORAS                                │
│    - Registrar pollitas recibidas                           │
│    - Asignar a galpón                                       │
│                                                              │
│ 2. Registrar Costos de Levante                              │
│    - Alimento especializado para pollitas                   │
│    - Medicinas y vacunas                                    │
│    - Mantenimiento                                          │
│    - Mano de obra                                           │
│                                                              │
│ 3. Monitoreo de Crecimiento                                 │
│    - Registrar pesos semanales                              │
│    - Registrar mortalidad                                   │
│    - Tracking de desarrollo                                 │
│                                                              │
│ 4. Alerta Automática (Semana 18)                            │
│    - Sistema notifica: "Lote listo para transferir"         │
│    - Muestra edad actual y cantidad disponible              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ TRANSFERENCIA (Semana 18-22)                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 1. Validación Automática                                    │
│    ✓ Edad mínima: 16 semanas                                │
│    ✓ Edad óptima: 18-20 semanas                             │
│    ✓ Estado: ACTIVO                                         │
│    ✓ Cantidad disponible                                    │
│                                                              │
│ 2. Cálculo de Costos Heredados                              │
│    - Suma todos los gastos de levante                       │
│    - Calcula costo por ave                                  │
│    - Prepara datos para transferir                          │
│                                                              │
│ 3. Proceso de Transferencia (Transacción Atómica)           │
│    a) Crear nuevo lote de ponedoras                         │
│    b) Heredar costos de levante                             │
│    c) Actualizar lote de levante → TRANSFERIDO              │
│    d) Registrar evento de transferencia                     │
│                                                              │
│ 4. Resultado                                                 │
│    - Lote Ponedoras creado con costos heredados             │
│    - Lote Levante marcado como transferido                  │
│    - Trazabilidad completa mantenida                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ FASE 2: PRODUCCIÓN (20+ semanas)                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 1. Inicio de Producción                                     │
│    - Lote activo en galpón de ponedoras                     │
│    - Costos de levante ya registrados                       │
│    - Listo para registrar producción                        │
│                                                              │
│ 2. Registrar Costos de Producción                           │
│    - Alimento para ponedoras                                │
│    - Medicinas específicas                                  │
│    - Mantenimiento de instalaciones                         │
│    - Costos de recolección                                  │
│                                                              │
│ 3. Registrar Producción de Huevos                           │
│    - Cantidad diaria/semanal                                │
│    - Clasificación por tamaño                               │
│    - Calidad                                                │
│                                                              │
│ 4. Cálculo de Costos por Huevo                              │
│    Costo Total = Costo Levante Amortizado + Costo Producción│
│                                                              │
│    Ejemplo:                                                  │
│    - Costo levante: RD$5,000 (100 aves × RD$50)            │
│    - Costo producción: RD$3,000                             │
│    - Total huevos: 10,000                                   │
│    - Costo por huevo: (5,000 + 3,000) / 10,000 = RD$0.80   │
│                                                              │
│ 5. Análisis de Rentabilidad                                 │
│    - Punto de equilibrio                                    │
│    - Margen por huevo                                       │
│    - ROI del lote                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 💾 Estructura de Datos

### Lote Levante (con Subtipo Ponedoras)

```typescript
{
  id: "LEV-001",
  nombre: "Pollitas ISA Brown - Enero 2025",
  tipo: TipoAve.POLLO_LEVANTE,
  subtipo: SubtipoLevante.LEVANTE_PONEDORAS,  // ← Nuevo
  cantidadInicial: 100,
  cantidadActual: 95,
  fechaNacimiento: "2025-01-01",
  fechaInicio: "2025-01-01",
  estado: EstadoLote.ACTIVO,
  edadTransferencia: 20,  // Semanas recomendadas
  loteDestinoId: null,    // Se llena al transferir
  fechaTransferencia: null
}
```

### Lote Ponedoras (Después de Transferencia)

```typescript
{
  id: "PON-001",
  nombre: "Pollitas ISA Brown - Enero 2025 (Producción)",
  tipo: TipoAve.PONEDORA,
  cantidadInicial: 95,
  cantidadActual: 95,
  fechaNacimiento: "2025-01-01",
  fechaInicio: "2025-05-15",  // Fecha de transferencia
  estado: EstadoLote.ACTIVO,
  
  // Información de transferencia
  esTransferido: true,
  loteLevanteOrigen: "LEV-001",
  fechaInicioProduccion: "2025-05-15",
  
  // Costos heredados de levante
  costosLevante: {
    total: 5000,           // RD$ total gastado en levante
    porAve: 52.63,         // RD$ por ave (5000 / 95)
    fechaInicio: "2025-01-01",
    fechaFin: "2025-05-15",
    cantidadInicial: 100,
    cantidadTransferida: 95
  }
}
```

## 📊 Cálculos de Costos

### 1. Desglose de Costos

```typescript
{
  costosLevante: {
    total: 5000,      // RD$
    porAve: 52.63,    // RD$
    porcentaje: 62.5  // % del costo total
  },
  costosProduccion: {
    total: 3000,      // RD$
    porAve: 31.58,    // RD$
    porcentaje: 37.5  // % del costo total
  },
  costoTotalPorAve: 84.21,  // RD$
  costoTotalLote: 8000      // RD$
}
```

### 2. Costo por Huevo

```typescript
{
  costoTotal: 0.80,          // RD$ por huevo
  costoLevante: 0.50,        // Parte del levante amortizado
  costoProduccion: 0.30,     // Costo de producción
  totalHuevosProducidos: 10000,
  edadLoteEnSemanas: 45,
  diasEnProduccion: 175
}
```

### 3. Punto de Equilibrio

```typescript
{
  huevosNecesarios: 5000,    // Para cubrir costos de levante
  huevosProducidos: 3500,
  alcanzado: false,
  porcentajeAlcanzado: 70,   // %
  ingresosNecesarios: 5000,  // RD$
  ingresosActuales: 3500     // RD$
}
```

## 🎨 Interfaz de Usuario

### Pantalla de Lote Levante

```
┌─────────────────────────────────────────┐
│ Lote: Pollitas ISA Brown                │
│ Edad: 19 semanas                        │
│ Cantidad: 95 pollitas                   │
├─────────────────────────────────────────┤
│                                         │
│ 🔔 ¡Lote listo para transferir!        │
│                                         │
│ ✅ Edad óptima para transferir         │
│                                         │
│ [Transferir a Ponedoras]                │
│                                         │
└─────────────────────────────────────────┘
```

### Modal de Transferencia

```
┌─────────────────────────────────────────┐
│ Transferir a Ponedoras                  │
│ Pollitas ISA Brown                      │
├─────────────────────────────────────────┤
│                                         │
│ ✅ Edad óptima para transferir         │
│ Edad actual: 19 semanas                 │
│ Cantidad disponible: 95 pollitas        │
│                                         │
│ Cantidad a Transferir                   │
│ ┌─────────────────────────────────┐   │
│ │   [-]    95    [+]              │   │
│ └─────────────────────────────────┘   │
│ [Transferir todas (95)]                 │
│                                         │
│ Galpón de Destino                       │
│ [Seleccionar galpón ▼]                  │
│                                         │
│ Observaciones (Opcional)                │
│ ┌─────────────────────────────────┐   │
│ │                                 │   │
│ └─────────────────────────────────┘   │
│                                         │
│ ℹ️ ¿Qué sucederá?                      │
│ • Se creará un nuevo lote de ponedoras │
│ • Los costos de levante se heredarán   │
│ • El lote de levante se marcará como   │
│   transferido                           │
│ • Podrás comenzar a registrar          │
│   producción de huevos                  │
│                                         │
│ [Cancelar]  [Transferir]                │
└─────────────────────────────────────────┘
```

### Pantalla de Lote Ponedoras

```
┌─────────────────────────────────────────┐
│ Lote: Pollitas ISA Brown (Producción)   │
│ Edad: 45 semanas                        │
│ En producción: 175 días                 │
├─────────────────────────────────────────┤
│                                         │
│ 💰 Costos del Lote                     │
│                                         │
│ Levante (62.5%)      RD$ 5,000.00      │
│ Producción (37.5%)   RD$ 3,000.00      │
│ ─────────────────────────────────      │
│ Total                RD$ 8,000.00      │
│                                         │
│ Costo por ave:       RD$ 84.21         │
│                                         │
│ 🥚 Producción de Huevos                │
│                                         │
│ Total producidos:    10,000 huevos     │
│ Costo por huevo:     RD$ 0.80          │
│   - Levante:         RD$ 0.50          │
│   - Producción:      RD$ 0.30          │
│                                         │
│ 📊 Punto de Equilibrio                 │
│                                         │
│ Progreso: ████████░░ 70%               │
│ Faltan 1,500 huevos para cubrir        │
│ costos de levante                       │
│                                         │
└─────────────────────────────────────────┘
```

## 🔧 Archivos Implementados

### Tipos y Enums
- ✅ `src/types/enums.ts` - Agregado `EstadoLote.TRANSFERIDO` y `SubtipoLevante`
- ✅ `src/types/levantes/loteLevante.ts` - Campos de transferencia
- ✅ `src/types/ponedoras/lotePonedora.ts` - Campos de costos heredados

### Servicios
- ✅ `src/services/transferencia-lotes.service.ts` - Lógica de transferencia
- ✅ `src/services/costos-produccion-huevos.service.ts` - Cálculos de costos

### Hooks
- ✅ `src/hooks/useTransferenciaLotes.ts` - Hook para UI

### Componentes
- ✅ `src/components/transferencia/ModalTransferenciaLote.tsx` - Modal de transferencia

## 📈 Beneficios del Flujo

| Aspecto | Beneficio |
|---------|-----------|
| **Trazabilidad** | Historial completo desde pollita hasta fin de producción |
| **Costos** | Separación clara entre levante y producción |
| **Análisis** | Métricas específicas por fase |
| **Decisiones** | Datos claros para optimizar cada etapa |
| **Flexibilidad** | Permite vender pollitas en levante si es necesario |
| **Realidad** | Refleja el proceso real de la granja |
| **Rentabilidad** | Cálculo preciso de costo por huevo |
| **Punto de Equilibrio** | Saber cuándo se recupera la inversión |

## 🎯 Casos de Uso

### Caso 1: Transferencia Total

```
Situación: 100 pollitas de 20 semanas, todas listas
Acción: Transferir las 100 a ponedoras
Resultado: 
- Lote levante → TRANSFERIDO
- Nuevo lote ponedoras con 100 aves
- Costos heredados: RD$5,000
```

### Caso 2: Transferencia Parcial

```
Situación: 100 pollitas, solo 80 cumplen estándar
Acción: Transferir 80, mantener 20 en levante
Resultado:
- Lote levante → ACTIVO (20 aves restantes)
- Nuevo lote ponedoras con 80 aves
- Costos heredados: RD$4,000 (80% del total)
```

### Caso 3: Venta de Pollitas

```
Situación: Cliente quiere comprar pollitas de 18 semanas
Acción: Vender desde lote de levante (no transferir)
Resultado:
- Lote levante → VENDIDO o cantidad reducida
- No se crea lote de ponedoras
- Venta registrada en facturación
```

## 🚀 Próximos Pasos

### Pendientes de Implementar

1. **Alertas Automáticas**
   - Notificación cuando lote alcanza 18 semanas
   - Recordatorio si pasa de 22 semanas sin transferir

2. **Reportes Avanzados**
   - Comparativa de costos entre lotes
   - Eficiencia de levante vs producción
   - Proyecciones de rentabilidad

3. **Integración con Producción**
   - Conectar con registros de huevos
   - Cálculo automático de punto de equilibrio
   - Alertas de rentabilidad

4. **Optimizaciones**
   - Sugerencias de edad óptima según raza
   - Benchmarking con estándares de industria
   - Predicción de producción

## 📝 Notas Importantes

1. **Edad Óptima**: 18-20 semanas es el rango recomendado para transferir
2. **Costos Heredados**: Se mantienen separados para análisis claro
3. **Trazabilidad**: Siempre se puede rastrear origen del lote
4. **Flexibilidad**: Sistema soporta tanto transferencia como venta directa
5. **Transacciones**: Todas las operaciones son atómicas para garantizar consistencia

---

**Última Actualización**: Octubre 2025
**Estado**: ✅ Implementado y Documentado
**Versión**: 1.0







