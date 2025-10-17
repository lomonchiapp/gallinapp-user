# Solución: Facturas no visibles en build interno

## 🔍 Problema Identificado

En el build interno, las facturas realizadas no se mostraban en la pantalla principal de facturación.

## 🎯 Causa Raíz

El sistema tenía **dos servicios de facturación** funcionando en paralelo:

1. **`facturacion.service.ts`**: Usa AsyncStorage (almacenamiento local)
2. **`facturacion-transaccional.service.ts`**: Usa Firestore (almacenamiento remoto)

### El Conflicto

- Las facturas se creaban con `facturacion-transaccional.service.ts` (Firestore) ✅
- Pero se consultaban con `facturacion.service.ts` (AsyncStorage) ❌
- Resultado: La pantalla buscaba en el lugar equivocado

### Detalles Técnicos

**Hook `useFacturacion.ts` (líneas 100-104)**:
```typescript
const [facturasData, clientesData, productosData, configuracionData] = await Promise.all([
  facturacionService.getFacturas(),        // ❌ Buscaba en AsyncStorage
  facturacionService.getClientes(),        // ❌ Buscaba en AsyncStorage
  facturacionService.getProductosDisponibles(), // ❌ Buscaba en AsyncStorage
  facturacionService.getConfiguracion(),   // ❌ Buscaba en AsyncStorage
]);
```

**Pantalla principal `app/(tabs)/facturacion/index.tsx` (línea 124)**:
```typescript
const [facturasData, resumenData] = await Promise.all([
  facturacionService.getFacturas(),  // ❌ Buscaba en AsyncStorage (duplicado)
  generarResumenMensual(),
]);
```

## ✅ Solución Implementada

### 1. Actualización del Hook `useFacturacion.ts`

Se actualizó para usar **exclusivamente** el servicio transaccional (Firestore):

```typescript
// Antes
import { facturacionService } from '../services/facturacion.service';

// Después
import { facturacionTransaccionalService } from '../services/facturacion-transaccional.service';
import { productosInventarioSimplificadoService } from '../services/productos-inventario-simplificado.service';
```

#### Cambios en todas las funciones:

**Carga inicial de datos**:
```typescript
const [facturasData, clientesData, productosData, configuracionData] = await Promise.all([
  facturacionTransaccionalService.getFacturas(),        // ✅ Firestore
  facturacionTransaccionalService.getClientes(),        // ✅ Firestore
  productosInventarioSimplificadoService.generarProductosDesdeInventario(), // ✅ Firestore
  facturacionTransaccionalService.getConfiguracion(),   // ✅ Firestore
]);
```

**Otras operaciones actualizadas**:
- ✅ `crearFactura`: Usa `facturacionTransaccionalService.crearFactura()`
- ✅ `actualizarFactura`: Usa `facturacionTransaccionalService.actualizarFactura()`
- ✅ `obtenerFactura`: Usa `facturacionTransaccionalService.getFacturaPorId()`
- ✅ `crearCliente`: Usa `facturacionTransaccionalService.crearCliente()`
- ✅ `actualizarCliente`: Usa `facturacionTransaccionalService.actualizarCliente()`
- ✅ `actualizarProductos`: Usa `productosInventarioSimplificadoService`
- ✅ `generarResumenVentas`: Usa `facturacionTransaccionalService.generarResumenVentas()`
- ✅ `actualizarConfiguracion`: Usa `facturacionTransaccionalService`

### 2. Actualización de la Pantalla Principal

**Antes** (líneas 19-27):
```typescript
import { facturacionService } from '../../../src/services/facturacion.service';

const { facturas, clientes, productos, lotes, configuracion, loading, error, 
        refrescarDatos, actualizarProductos } = useFacturacion();

const cargarDatos = async () => {
  const [facturasData, resumenData] = await Promise.all([
    facturacionService.getFacturas(),  // ❌ Duplicado e incorrecto
    generarResumenMensual(),
  ]);
  // ...
};
```

**Después**:
```typescript
// Eliminado: import { facturacionService }

const { facturas, clientes, productos, lotes, configuracion, loading, error, 
        refrescarDatos, actualizarProductos, generarResumenVentas } = useFacturacion();

const cargarDatos = async () => {
  console.log('📊 Cargando datos de facturación...');
  const resumenData = await generarResumenMensual();
  setResumen(resumenData);
  console.log('✅ Datos de facturación cargados:', {
    facturas: facturas.length,
    resumen: resumenData
  });
};
```

### 3. Logging Mejorado

Se agregaron logs para facilitar el debugging:

```typescript
console.log('✅ Datos iniciales cargados:', {
  facturas: facturasData.length,
  clientes: clientesData.length,
  productos: productosData.length,
});
```

## 📊 Beneficios de la Solución

### 1. **Consistencia de Datos** 🎯
- Todas las operaciones ahora usan la misma fuente de verdad (Firestore)
- No hay desincronización entre escritura y lectura

### 2. **Persistencia Real** 💾
- Los datos persisten entre sesiones y dispositivos
- No se pierden al cerrar la aplicación

### 3. **Sincronización Multi-dispositivo** 🔄
- Las facturas se sincronizan automáticamente entre dispositivos
- Cambios en tiempo real reflejados en todos los clientes

### 4. **Código Más Limpio** ✨
- Eliminada la duplicación de llamadas
- Un solo punto de verdad para datos
- Más fácil de mantener y debuggear

### 5. **Mejor Performance** ⚡
- Elimina llamadas redundantes
- Aprovecha las suscripciones en tiempo real de Firestore

## 🔧 Archivos Modificados

1. **`src/hooks/useFacturacion.ts`**
   - ✅ Actualizado para usar `facturacionTransaccionalService`
   - ✅ Actualizado para usar `productosInventarioSimplificadoService`
   - ✅ Agregado logging mejorado

2. **`app/(tabs)/facturacion/index.tsx`**
   - ✅ Eliminado import de `facturacionService`
   - ✅ Eliminadas llamadas directas duplicadas
   - ✅ Usa exclusivamente el hook `useFacturacion`
   - ✅ Agregado logging para debugging

## 🧪 Verificación

Para verificar que todo funcione correctamente:

### En Desarrollo:
1. Crear una factura desde la pantalla de nueva factura
2. Volver a la pantalla principal de facturación
3. La factura debe aparecer inmediatamente en "Facturas recientes"
4. Hacer pull-to-refresh para sincronizar
5. Las facturas deben mantenerse visibles

### En Build Interno:
1. Instalar el build interno actualizado
2. Iniciar sesión
3. Crear facturas de prueba
4. Verificar que aparezcan en la lista
5. Cerrar y abrir la app
6. Las facturas deben seguir visibles

### Logs Esperados:
```
📊 Cargando datos de facturación...
✅ Datos iniciales cargados: { facturas: 5, clientes: 3, productos: 12 }
✅ Datos de facturación cargados: { facturas: 5, resumen: {...} }
```

## 🚀 Próximos Pasos

1. ⚠️ **Deprecar `facturacion.service.ts`**:
   - Considerar eliminar o marcar como obsoleto
   - Migrar cualquier funcionalidad única que tenga

2. 📝 **Actualizar otras pantallas**:
   - Verificar que no haya otras pantallas usando el servicio viejo
   - Asegurar consistencia en todo el sistema

3. 🧪 **Testing**:
   - Agregar tests para verificar la persistencia
   - Tests de integración para el flujo completo

4. 📱 **Monitoreo**:
   - Monitorear logs en producción
   - Verificar que no haya errores de sincronización

## 🎓 Lecciones Aprendidas

1. **Un solo servicio por funcionalidad**: Tener dos servicios para lo mismo causa confusión
2. **Consistencia en abstracciones**: Si usas un hook, confía en él
3. **Logging es esencial**: Los logs ayudaron a identificar el problema rápidamente
4. **Verificar la fuente de datos**: Siempre asegurarse de leer del mismo lugar donde se escribe

