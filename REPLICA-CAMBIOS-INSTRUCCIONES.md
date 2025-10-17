# Instrucciones para Replicar Cambios en Engorde y Ponedoras

## Cambios ya implementados en Levantes que necesitas replicar:

### 1. Importaciones necesarias en `detalles/[id].tsx`

```typescript
// Agregar estas importaciones
import { useVentasLote } from '../../../../src/hooks/useVentasLote';
import { VentaLote, EstadisticasVentasLote } from '../../../../src/services/ventas.service';
```

### 2. Agregar hook de ventas (después de otros hooks)

```typescript
// Hook para manejar ventas del lote
const { ventas: ventasLote, estadisticasVentas } = useVentasLote(id, TipoAve.POLLO_ENGORDE); // o TipoAve.PONEDORA
```

### 3. Agregar tab de ventas al array de tabs

```typescript
const tabs = [
  // ... tabs existentes ...
  { id: 'ventas', label: 'Ventas', icon: 'cash-outline' },
  // ... más tabs ...
];
```

### 4. Agregar renderizado del TabVentas

```typescript
{tabActivo === 'ventas' && (
  <TabVentas
    lote={loteActual}
    ventas={ventasLote}
    estadisticasVentas={estadisticasVentas}
  />
)}
```

### 5. Actualizar TabGeneral para incluir ventas

```typescript
// En la definición de TabGeneral, agregar props:
ventas: VentaLote[];
estadisticasVentas: EstadisticasVentasLote | null;

// Y pasar las props cuando se llama:
<TabGeneral
  // ... otras props ...
  ventas={ventasLote}
  estadisticasVentas={estadisticasVentas}
/>
```

### 6. Actualizar el resumen en TabGeneral

Reemplazar "Muertes Totales" con "Pollos Vendidos":
```typescript
<View style={styles.summaryItem}>
  <Text style={styles.summaryValue}>{estadisticasVentas?.cantidadVendida || 0}</Text>
  <Text style={styles.summaryLabel}>Pollos Vendidos</Text>
</View>
```

### 7. Actualizar estadísticas financieras

```typescript
<View style={styles.statItem}>
  <Text style={styles.statValue}>
    {estadisticasVentas?.ingresosTotales ? `RD$${estadisticasVentas.ingresosTotales.toFixed(2)}` : 'RD$0.00'}
  </Text>
  <Text style={styles.statLabel}>Ingresos por Ventas</Text>
</View>
```

### 8. Copiar componente TabVentas completo

```typescript
// Copiar desde levantes/detalles/[id].tsx líneas 1005-1137
function TabVentas({ 
  lote, 
  ventas,
  estadisticasVentas 
}: { 
  lote: LoteEngorde; // o LotePonedora
  ventas: VentaLote[];
  estadisticasVentas: EstadisticasVentasLote | null;
}) {
  // ... todo el código del componente ...
}
```

### 9. Copiar estilos de ventas

```typescript
// Agregar al StyleSheet.create(), desde línea 2012 en adelante:
ventasStatsCard: { /* ... */ },
ventasStatsGrid: { /* ... */ },
ventasStatItem: { /* ... */ },
// ... etc
```

---

## IMPORTANTE: Cambios según el módulo

### Para ENGORDE:
- `TipoAve.POLLO_ENGORDE`
- `LoteEngorde`
- No tiene `diasMaduracion`

### Para PONEDORAS:
- `TipoAve.PONEDORA`
- `LotePonedora`
- No tiene `diasMaduracion`

---

## Verificación Final

1. ✅ Tab "Ventas" aparece en detalles
2. ✅ Muestra estadísticas de ventas
3. ✅ Lista ventas con detalles
4. ✅ Botón "Nueva Factura" funciona
5. ✅ Estadísticas en tab General actualizadas
6. ✅ CPU incluye costo inicial del lote

