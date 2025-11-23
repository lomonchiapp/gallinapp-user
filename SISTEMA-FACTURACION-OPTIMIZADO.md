# Sistema de Facturación Optimizado - Rediseño Completo

## Análisis de Problemas Actuales

### Problemas Identificados:

1. **Lecturas redundantes en transacción**: 
   - Se lee el lote en `validarItemsEnTransaccion`
   - Se vuelve a leer en `marcarLoteComoVendidoEnTransaccion` o `reducirCantidadLoteEnTransaccion`
   - Esto causa múltiples round-trips a Firebase dentro de la misma transacción

2. **Transacción demasiado larga**:
   - Validación lee documentos
   - Actualización de inventario lee documentos de nuevo
   - Registro de ventas crea documentos
   - Esto puede causar timeouts

3. **Falta de pre-validación**:
   - Validaciones básicas se hacen antes, pero no se verifica disponibilidad real
   - Esto causa que la transacción falle después de haber iniciado

4. **Manejo de errores genérico**:
   - Los errores no son específicos sobre qué falló exactamente

## Arquitectura Optimizada

### Principios de Diseño:

1. **Pre-validación completa ANTES de la transacción**
   - Validar disponibilidad de stock
   - Validar que los lotes existen y están activos
   - Validar que los productos son válidos

2. **Lectura única de documentos en transacción**
   - Leer todos los documentos necesarios al INICIO
   - Trabajar con datos en memoria
   - Actualizar sin releer

3. **Transacción minimalista**
   - Solo operaciones de escritura
   - Sin lógica compleja
   - Rollback automático si algo falla

4. **Manejo de errores específico**
   - Errores descriptivos por tipo de falla
   - Identificar qué producto falló
   - Identificar qué lote tiene problema

## Flujo Optimizado

### Paso 1: Pre-validación (Fuera de transacción)
```
1. Validar que cliente existe
2. Validar que todos los items tienen cantidad > 0
3. Para cada item:
   - Extraer loteId
   - Leer lote desde Firebase
   - Verificar que existe
   - Verificar que está ACTIVO
   - Verificar disponibilidad de stock
   - Guardar datos del lote en memoria
4. Si todo es válido, continuar
5. Si hay error, retornar error específico ANTES de transacción
```

### Paso 2: Preparación de datos (Fuera de transacción)
```
1. Obtener configuración (desde cache)
2. Generar número de factura (puede ser fuera de transacción si usamos contador optimista)
3. Calcular todos los totales
4. Preparar datos de factura
5. Preparar datos de ventas
6. Preparar actualizaciones de inventario
```

### Paso 3: Transacción atómica (Mínima)
```
1. Leer contador de facturas (una vez)
2. Actualizar contador
3. Crear documento de factura
4. Para cada lote:
   - Leer lote (una vez, al inicio)
   - Verificar estado (debe ser ACTIVO)
   - Aplicar actualización de inventario
5. Crear documentos de ventas
6. Si es huevos, crear documentos en ventasHuevos
7. Confirmar transacción
```

## Implementación

### Servicio Optimizado

```typescript
class FacturacionServiceOptimizado {
  
  /**
   * Pre-valida todos los items ANTES de la transacción
   */
  private async preValidarItems(items: ItemFactura[]): Promise<Map<string, any>> {
    const lotesData = new Map<string, any>();
    
    for (const item of items) {
      // Si es huevos, validar registros
      if (item.producto.tipo === TipoProducto.HUEVOS) {
        // Validación de huevos ya está en el producto
        continue;
      }
      
      // Extraer loteId
      const { tipo, loteId } = this.extractLoteIdFromProductoId(item.productoId);
      
      // Leer lote
      const loteRef = this.getLoteRef(item.producto.tipoAve, loteId);
      const loteSnap = await getDoc(loteRef);
      
      if (!loteSnap.exists()) {
        throw new LoteNotFoundError(loteId);
      }
      
      const lote = loteSnap.data();
      
      // Validar estado
      if (lote.estado === 'VENDIDO') {
        throw new DomainError('LOTE_ALREADY_SOLD', `Lote ${loteId} ya está vendido`);
      }
      
      // Validar disponibilidad
      if (tipo === 'lote') {
        if (lote.cantidadActual <= 0) {
          throw new InsufficientQuantityError(loteId, 1, lote.cantidadActual, item.producto.tipoAve);
        }
      } else if (tipo === 'unidades') {
        if (item.cantidad > lote.cantidadActual) {
          throw new InsufficientQuantityError(loteId, item.cantidad, lote.cantidadActual, item.producto.tipoAve);
        }
      }
      
      // Guardar datos del lote para usar en transacción
      lotesData.set(`${item.producto.tipoAve}-${loteId}`, {
        loteRef,
        lote,
        tipo,
        item
      });
    }
    
    return lotesData;
  }
  
  /**
   * Crea factura con transacción optimizada
   */
  async crearFactura(datosFactura: CrearFactura, userId: string): Promise<Factura> {
    // 1. PRE-VALIDACIÓN (fuera de transacción)
    console.log('🔍 [Facturacion] Pre-validando items...');
    const lotesData = await this.preValidarItems(datosFactura.items);
    console.log('✅ [Facturacion] Pre-validación exitosa');
    
    // 2. PREPARACIÓN (fuera de transacción)
    console.log('📝 [Facturacion] Preparando datos...');
    const config = await this.getConfiguracion(); // Desde cache
    const totales = this.calcularTotales(datosFactura.items);
    
    // 3. TRANSACCIÓN (mínima)
    return await runTransaction(db, async (transaction) => {
      // Leer contador una vez
      const contadorRef = doc(db, COLLECTIONS.CONTADOR_FACTURAS, userId);
      const contadorSnap = await transaction.get(contadorRef);
      
      const contador = contadorSnap.exists() 
        ? (contadorSnap.data().siguienteNumero || 1)
        : 1;
      
      // Generar número
      const numero = config.numeracion.formato
        .replace('{prefijo}', config.numeracion.prefijo)
        .replace('{numero:4}', contador.toString().padStart(4, '0'));
      
      // Actualizar contador
      if (contadorSnap.exists()) {
        transaction.update(contadorRef, {
          siguienteNumero: contador + 1,
          updatedAt: serverTimestamp(),
        });
      } else {
        transaction.set(contadorRef, {
          siguienteNumero: contador + 1,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      
      // Leer todos los lotes necesarios (una vez)
      const lotesEnTransaccion = new Map();
      for (const [key, data] of lotesData.entries()) {
        const loteSnap = await transaction.get(data.loteRef);
        if (!loteSnap.exists()) {
          throw new LoteNotFoundError(data.lote.id);
        }
        const lote = loteSnap.data();
        
        // Verificar que sigue siendo válido (race condition check)
        if (lote.estado === 'VENDIDO') {
          throw new DomainError('LOTE_ALREADY_SOLD', `Lote ${data.lote.id} fue vendido mientras se procesaba`);
        }
        
        lotesEnTransaccion.set(key, { loteRef: data.loteRef, lote, item: data.item });
      }
      
      // Crear factura
      const facturaRef = doc(collection(db, COLLECTIONS.FACTURAS));
      const ahora = new Date();
      const nuevaFactura: Factura = {
        ...datosFactura,
        id: facturaRef.id,
        numero,
        ...totales,
        estado: EstadoFactura.PENDIENTE,
        createdBy: userId,
        createdAt: ahora,
        updatedAt: ahora,
      };
      
      transaction.set(facturaRef, {
        ...nuevaFactura,
        createdAt: Timestamp.fromDate(ahora),
        updatedAt: Timestamp.fromDate(ahora),
      });
      
      // Actualizar inventario (sin releer)
      for (const [key, data] of lotesEnTransaccion.entries()) {
        const { loteRef, lote, item } = data;
        const { tipo } = this.extractLoteIdFromProductoId(item.productoId);
        
        if (tipo === 'lote') {
          transaction.update(loteRef, {
            estado: 'VENDIDO',
            fechaVenta: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else if (tipo === 'unidades') {
          const nuevaCantidad = lote.cantidadActual - item.cantidad;
          const actualizacion: any = {
            cantidadActual: nuevaCantidad,
            updatedAt: serverTimestamp(),
          };
          if (nuevaCantidad === 0) {
            actualizacion.estado = 'VENDIDO';
            actualizacion.fechaVenta = serverTimestamp();
          }
          transaction.update(loteRef, actualizacion);
        }
      }
      
      // Crear ventas
      for (const item of datosFactura.items) {
        const ventaRef = doc(collection(db, COLLECTIONS.VENTAS));
        transaction.set(ventaRef, {
          facturaId: nuevaFactura.id,
          ...this.prepararDatosVenta(item, nuevaFactura),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        
        // Si es huevos, crear registro en ventasHuevos
        if (item.producto.tipo === TipoProducto.HUEVOS) {
          const productoHuevos = item.producto as ProductoHuevos;
          const ventaHuevosRef = doc(collection(db, 'ventasHuevos'));
          transaction.set(ventaHuevosRef, {
            facturaId: nuevaFactura.id,
            loteId: productoHuevos.loteId,
            cantidad: this.calcularCantidadHuevos(item, productoHuevos),
            ...this.prepararDatosVentaHuevos(item, productoHuevos),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }
      
      return nuevaFactura;
    });
  }
}
```

## Ventajas del Nuevo Sistema

1. **Más rápido**: Pre-validación elimina transacciones que fallarían
2. **Menos lecturas**: Solo lee documentos una vez en la transacción
3. **Más confiable**: Verifica estado justo antes de actualizar (race condition check)
4. **Mejor UX**: Errores específicos antes de iniciar transacción
5. **Menos timeouts**: Transacción más corta y eficiente

## Comparación

### Antes:
- Validación dentro de transacción (lenta)
- Lecturas múltiples del mismo documento
- Transacción puede fallar al final
- Timeouts frecuentes

### Después:
- Pre-validación fuera (rápida)
- Lectura única por documento
- Transacción solo falla por race conditions (raras)
- Transacciones más rápidas





