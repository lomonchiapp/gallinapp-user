# Sistema de Facturación - Arquitectura Integrada

## Resumen del Problema Resuelto

**Problema Original**: Se estaba creando una capa de "productos" separada cuando en realidad los lotes **SON** los productos en el sistema avícola.

**Solución**: Integración directa del sistema de facturación con los lotes existentes, donde los lotes se convierten automáticamente en productos vendibles.

## Arquitectura Corregida

### 1. Flujo de Datos Integrado

```
Lotes Existentes → Productos Vendibles → Facturas
     ↑                    ↑                ↑
 (Ponedoras)      (Lotes Completos)   (Ventas)
 (Levante)        (Unidades Indiv.)   (Pagos)
 (Engorde)        (Huevos)            (Estados)
```

### 2. Servicios Principales

#### `productos-inventario.service.ts`
- **Función**: Puente entre lotes existentes y sistema de facturación
- **Responsabilidad**: Convertir lotes activos en productos vendibles
- **Integración**: Se conecta con servicios existentes de ponedoras, levantes y engorde

#### `facturacion.service.ts`  
- **Función**: Gestión completa de facturas y clientes
- **Responsabilidad**: CRUD de facturas, cálculos, reportes
- **Integración**: Usa `productos-inventario.service` para obtener productos

### 3. Tipos de Productos Generados

Para cada lote activo se generan **2 productos vendibles**:

1. **Lote Completo** (`TipoProducto.LOTE_COMPLETO`)
   - ID: `lote-{loteId}`
   - Precio: Con descuento por volumen (5-10%)
   - Disponible: 1 unidad (el lote completo)
   - Al venderse: Lote se marca como `VENDIDO`

2. **Unidades Individuales** (`TipoProducto.UNIDADES_*`)
   - ID: `unidades-{loteId}`
   - Precio: Por unidad individual
   - Disponible: `lote.cantidadActual`
   - Al venderse: Se reduce la cantidad del lote

### 4. Cálculo de Precios Inteligente

Los precios se calculan automáticamente basados en:

- **Tipo de ave**: Ponedoras, Levante, Engorde
- **Edad del lote**: Más edad = diferentes precios
- **Peso promedio**: Para pollos de engorde principalmente
- **Cantidad**: Descuentos por volumen en lotes completos
- **Raza**: Diferentes razas tienen precios diferentes

### 5. Actualización de Inventario en Tiempo Real

Cuando se vende un producto:

1. **Cache local** se actualiza inmediatamente
2. **Lote original** se modifica:
   - Lote completo → Estado cambia a `VENDIDO`
   - Unidades → Cantidad se reduce

## Beneficios de esta Arquitectura

✅ **Sin duplicación de datos**: Los lotes siguen siendo la fuente única de verdad

✅ **Sincronización automática**: Cambios en lotes se reflejan en productos vendibles

✅ **Precios dinámicos**: Se calculan en base a características reales del lote

✅ **Trazabilidad completa**: Cada venta se puede rastrear al lote original

✅ **Escalabilidad**: Fácil agregar nuevos tipos de productos (huevos, etc.)

## Integración Futura

Para conectar con los servicios reales de lotes, solo hay que:

1. **Descomentar las importaciones** en `productos-inventario.service.ts`
2. **Reemplazar métodos de ejemplo** con llamadas reales a servicios
3. **Implementar actualizaciones** de estado en los servicios de lotes

```typescript
// Ejemplo de integración real:
const lotesPonedoras = await ponedorasService.getLotes();
const lotesLevante = await levantesService.getLotes();
const lotesEngorde = await engordeService.getLotes();
```

## Flujo de Venta Completo

1. **Usuario abre facturación** → Se cargan productos desde lotes activos
2. **Selecciona productos** → Puede elegir lotes completos o unidades individuales  
3. **Crea factura** → Se calculan precios y totales automáticamente
4. **Confirma venta** → Se actualiza inventario real de lotes
5. **Genera reporte** → Trazabilidad completa desde lote hasta venta

Esta arquitectura mantiene la lógica de negocio avícola intacta mientras proporciona un sistema de facturación robusto y profesional.
















