# Solución: Factura se queda en "Guardando..."

## Problema Reportado
Al intentar crear una factura, la pantalla se queda en estado "Guardando..." indefinidamente.

## Causa Raíz Identificada

El problema ocurre **ANTES** de que se muestre el estado de loading al usuario.

### Flujo del Problema

1. Usuario presiona "Guardar factura"
2. Se ejecuta `guardarFactura()` en `nueva-factura.tsx`
3. Se llama a `crearFactura()` del hook `useFacturacionMejorado`
4. Se llama a `facturacionTransaccionalService.crearFactura()`
5. **AQUÍ OCURRE EL BLOQUEO**:
   - Se ejecuta `validarItemsFactura()` 
   - Esta función llama a `getProductosDisponibles()`
   - Que a su vez llama a `productosInventarioSimplificadoService.generarProductosDesdeInventario()`
   - Esta función consulta **TODOS los lotes** en Firestore (ponedoras, levantes, engorde)
   - Si hay muchos lotes o conexión lenta, puede tardar mucho o bloquearse
   - **No había timeout en esta validación**

6. Solo después de esto se muestra `setLoading(true)` y se inicia la transacción

## Solución Implementada

### Cambios en `facturacion-transaccional.service.ts`

1. **Timeout en validación de productos**:
   ```typescript
   const productosPromise = this.getProductosDisponibles();
   const productos = await withTimeout(productosPromise, 10000, 'Obtención de productos disponibles');
   ```

2. **Timeout adicional en el flujo principal**:
   ```typescript
   const validacionPromise = this.validarItemsFactura(datosFactura.items);
   await withTimeout(validacionPromise, 10000, 'Validación de items');
   ```

3. **Logs mejorados** para identificar dónde se queda trabado:
   - `🔍 [FacturacionService] Iniciando validación de items...`
   - `📦 [FacturacionService] Obteniendo productos disponibles para validación...`
   - `✅ [FacturacionService] N productos obtenidos, validando items...`
   - `✅ [FacturacionService] Todos los items validados correctamente`

### Timeouts Aplicados

- **10 segundos**: Obtención de productos disponibles (antes de validar)
- **10 segundos**: Validación completa de items
- **30 segundos**: Transacción de Firestore
- **35 segundos**: Timeout del cliente (con margen)

## Resultado Esperado

1. Si la obtención de productos tarda más de 10s → Error claro al usuario
2. Si la validación tarda más de 10s → Error claro al usuario
3. Si la transacción tarda más de 30s → Error claro al usuario
4. Loading se muestra inmediatamente después de iniciar la validación
5. Logs permiten identificar exactamente dónde falla

## Cómo Verificar

Al crear una factura, revisa los logs en la consola:

```
🚀 Iniciando creación de factura...
🔧 [useFacturacionMejorado] Iniciando creación de factura...
🏭 [FacturacionService] Iniciando creación de factura...
🔍 [FacturacionService] Iniciando validación de items...
📦 [FacturacionService] Obteniendo productos disponibles para validación...
✅ [FacturacionService] N productos obtenidos, validando items...
✅ [FacturacionService] Todos los items validados correctamente
🔄 [FacturacionService] Iniciando transacción de Firestore con timeout de 30s...
```

Si ves que se queda trabado en algún paso, el log te indicará exactamente dónde.

## Mejoras Adicionales Recomendadas

1. **Cache de productos**: Mantener productos en memoria durante la sesión
2. **Validación lazy**: Solo validar productos cuando realmente se necesiten
3. **Indicador de progreso**: Mostrar "Obteniendo inventario..." antes de mostrar "Guardando..."
4. **Optimización de consultas**: Paginar o limitar la consulta de lotes si hay muchos






