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

### 5. Sincronización en Tiempo Real (IMPLEMENTADO ✅)

**Problema Resuelto**: Los lotes no aparecían consistentemente en el inventario de facturación.

**Solución Implementada**:

#### A. Suscripciones Automáticas (`useFacturacionMejorado.ts`)

El hook ahora se suscribe a cambios en Firestore para los tres tipos de lotes:

```typescript
useEffect(() => {
  // Suscribirse a cambios en lotes de ponedoras
  const unsubscribePonedoras = subscribeToPonedoras(async (lotesPonedoras) => {
    await actualizarProductos();
  });
  
  // Suscribirse a cambios en lotes de levante
  const unsubscribeLevantes = subscribeToLevantes(async (lotesLevante) => {
    await actualizarProductos();
  });
  
  // Suscribirse a cambios en lotes de engorde
  const unsubscribeEngorde = suscribirseALotesEngorde(async (lotesEngorde) => {
    await actualizarProductos();
  });
  
  return () => {
    unsubscribePonedoras();
    unsubscribeLevantes();
    unsubscribeEngorde();
  };
}, [actualizarProductos]);
```

**Beneficios**:
- ✅ El inventario se actualiza automáticamente cuando cualquier lote cambia
- ✅ No es necesario recargar manualmente la pantalla
- ✅ Múltiples usuarios ven los cambios en tiempo real

#### B. Actualización Inmediata Después de Ventas

Cuando se crea una factura:

```typescript
const nuevaFactura = await facturacionTransaccionalService.crearFactura(datos, userId);
setFacturas(prev => [nuevaFactura, ...prev]);

// Actualizar productos inmediatamente después de la venta
await actualizarProductos();
```

**Resultado**: Los lotes vendidos desaparecen del inventario al instante.

#### C. Logging Detallado para Debugging

El servicio `productos-inventario-simplificado.service.ts` ahora incluye logs informativos:

```
🔄 [INVENTARIO] Generando productos desde inventario...
📊 [INVENTARIO] Lotes encontrados: { ponedoras: 2, levante: 1, engorde: 3 }
✅ [PONEDORA] Lote convertido: Lote A → 2 productos
✅ [INVENTARIO] Total de productos generados: 12
```

**Beneficios**: Es fácil identificar por qué un lote no aparece en el inventario.

#### D. Criterios de Disponibilidad

Un lote aparece en el inventario **SOLO SI**:
- Estado = `ACTIVO`
- Cantidad > 0

Si no cumple estos criterios, se registra en el log:
```
⚠️ [PONEDORA] Lote "Mi Lote" excluido: {
  estado: "VENDIDO",
  esActivo: false,
  cantidadActual: 0,
  razon: "Estado no es ACTIVO"
}
```

### 6. Actualización de Inventario en Transacciones

Cuando se vende un producto:

1. **Transacción atómica** garantiza consistencia
2. **Lote original** se modifica:
   - Lote completo → Estado cambia a `VENDIDO`
   - Unidades → Cantidad se reduce
3. **Suscripciones** detectan el cambio
4. **UI se actualiza** automáticamente

## Beneficios de esta Arquitectura

✅ **Sin duplicación de datos**: Los lotes siguen siendo la fuente única de verdad

✅ **Sincronización en tiempo real**: Cambios en lotes se reflejan automáticamente en la UI

✅ **Precios dinámicos**: Se calculan en base a características reales del lote

✅ **Trazabilidad completa**: Cada venta se puede rastrear al lote original

✅ **Escalabilidad**: Fácil agregar nuevos tipos de productos (huevos, etc.)

✅ **Confiabilidad**: Los lotes SIEMPRE aparecen cuando están activos y tienen cantidad

## Verificación y Debugging

### Cómo Verificar que Funciona

#### 1. Verificar Suscripciones
Abre la consola y busca estos logs al cargar facturación:

```
🔔 Configurando suscripciones en tiempo real para lotes...
🔄 [INVENTARIO] Generando productos desde inventario...
📊 [INVENTARIO] Lotes encontrados: { ponedoras: X, levante: Y, engorde: Z }
✅ [INVENTARIO] Total de productos generados: N
```

#### 2. Verificar Actualización en Tiempo Real
1. Abre la pantalla de facturación
2. En otro dispositivo/pestaña, crea un nuevo lote activo
3. Observa cómo el inventario se actualiza automáticamente
4. Verás en el log:
   ```
   🐔 Lotes de ponedoras actualizados: X
   🔄 Actualizando productos desde inventario...
   ```

#### 3. Verificar Actualización Después de Venta
1. Crea una factura con un lote
2. Observa en el log:
   ```
   🔄 Actualizando inventario después de crear factura...
   ✅ [INVENTARIO] Total de productos generados: N
   ```
3. El lote vendido debe desaparecer o su cantidad debe reducirse

### Solución de Problemas

#### Problema: Un lote no aparece en el inventario

**Paso 1**: Verifica el estado del lote
- ¿Está en estado ACTIVO?
- ¿Tiene cantidad mayor a 0?

**Paso 2**: Revisa los logs en la consola
- Busca el nombre del lote
- Lee la razón de exclusión

**Paso 3**: Corrige el problema
- Si está VENDIDO: Es correcto que no aparezca
- Si tiene cantidad 0: Actualiza la cantidad
- Si está en otro estado: Cambia a ACTIVO

#### Problema: El inventario no se actualiza

**Solución 1**: Verifica las suscripciones
- Busca en el log: "🔔 Configurando suscripciones..."
- Si no aparece, hay un problema con los listeners

**Solución 2**: Refresca manualmente
- Usa el botón "Actualizar inventario" en la pantalla
- Esto forzará una recarga

**Solución 3**: Verifica la conexión a Firestore
- Asegúrate de que el usuario esté autenticado
- Verifica los permisos de Firestore

## Flujo de Venta Completo (Actualizado)

```
1. Usuario abre facturación
   ↓
2. Hook se suscribe a cambios en lotes (Firestore)
   ↓
3. Se cargan lotes activos con cantidad > 0
   ↓
4. Se convierten a productos vendibles
   ↓
5. Se muestran en el inventario
   ↓
6. [Tiempo Real] Si un lote cambia → Se actualiza automáticamente
   ↓
7. Usuario selecciona productos (lotes completos o unidades)
   ↓
8. Crea factura → Se calculan precios y totales
   ↓
9. Confirma venta → Transacción atómica actualiza lotes
   ↓
10. Inventario se refresca inmediatamente
   ↓
11. [Tiempo Real] Otros usuarios ven los cambios
   ↓
12. Genera reporte → Trazabilidad completa
```

## Archivos Clave

### Hooks
- **`src/hooks/useFacturacionMejorado.ts`**: Hook principal con suscripciones en tiempo real

### Servicios
- **`src/services/productos-inventario-simplificado.service.ts`**: Conversión de lotes a productos con logging
- **`src/services/facturacion-transaccional.service.ts`**: Gestión de facturas con transacciones atómicas

### UI
- **`app/(tabs)/facturacion/nueva-factura.tsx`**: Pantalla de creación de facturas
- **`app/(tabs)/facturacion/productos.tsx`**: Vista de inventario de productos

## Resumen

Esta arquitectura mantiene la lógica de negocio avícola intacta mientras proporciona un sistema de facturación robusto, profesional y **confiable en tiempo real**.

**Estado Actual**: ✅ Completamente implementado y funcional

**Última Actualización**: Octubre 2025 - Sincronización en tiempo real implementada























