# 🔍 Análisis Crítico de Arquitectura - Asoaves

## 📊 RESUMEN EJECUTIVO

**Estado Actual**: 🟡 MODERADO - Funcional pero con riesgos significativos
**Prioridad de Mejoras**: 🔴 ALTA
**Deuda Técnica Estimada**: 65%

---

## ⚠️ PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. **AUSENCIA DE TRANSACCIONES ATÓMICAS** 🔴 CRÍTICO

**Problema**: Las operaciones de venta NO son atómicas.

```typescript
// ❌ CÓDIGO ACTUAL (productos-inventario.service.ts)
async actualizarInventarioPorVenta(productoId: string, cantidadVendida: number, tipoAve: TipoAve) {
  await this.marcarLoteComoVendido(loteId, tipoAve);  // Operación 1
  await this.reducirCantidadLote(loteId, cantidad, tipoAve);  // Operación 2
  // Si falla operación 2, operación 1 ya se ejecutó = INCONSISTENCIA
}

// ❌ CÓDIGO ACTUAL (facturacion.service.ts)
async crearFactura() {
  await AsyncStorage.setItem(FACTURAS, facturas);  // Operación 1
  await this.actualizarInventarioPorVenta(items);    // Operación 2
  await procesarFacturaParaVentas(factura);          // Operación 3
  // Si falla operación 3, las anteriores ya se ejecutaron = DATOS CORRUPTOS
}
```

**Impacto**:
- ❌ Facturas sin ventas registradas
- ❌ Inventario descontado pero sin factura
- ❌ Dinero perdido sin trazabilidad
- ❌ Reportes financieros incorrectos

**Solución Requerida**:
```typescript
// ✅ IMPLEMENTACIÓN CORRECTA
import { runTransaction } from 'firebase/firestore';

async crearFactura(datosFactura: CrearFactura, userId: string): Promise<Factura> {
  return await runTransaction(db, async (transaction) => {
    // 1. Guardar factura
    const facturaRef = doc(collection(db, 'facturas'));
    const nuevaFactura = { ...datosFactura, id: facturaRef.id };
    transaction.set(facturaRef, nuevaFactura);
    
    // 2. Actualizar inventario
    for (const item of datosFactura.items) {
      const loteRef = doc(db, 'lotes', item.loteId);
      const loteSnap = await transaction.get(loteRef);
      const lote = loteSnap.data();
      
      transaction.update(loteRef, {
        cantidadActual: lote.cantidadActual - item.cantidad
      });
    }
    
    // 3. Registrar ventas
    for (const venta of ventas) {
      const ventaRef = doc(collection(db, 'ventas'));
      transaction.set(ventaRef, venta);
    }
    
    // Todo o nada - ATOMICIDAD GARANTIZADA
    return nuevaFactura;
  });
}
```

---

### 2. **DOBLE PERSISTENCIA (AsyncStorage + Firebase)** 🔴 CRÍTICO

**Problema**: Datos duplicados en 2 sistemas diferentes sin sincronización garantizada.

```typescript
// ❌ PROBLEMA ACTUAL
// facturacion.service.ts usa AsyncStorage
await AsyncStorage.setItem(STORAGE_KEYS.FACTURAS, JSON.stringify(facturas));

// ventas.service.ts usa Firebase
await addDoc(collection(db, VENTAS_COLLECTION), ventaData);

// lotes.service.ts usa Firebase
await updateDoc(loteRef, { cantidadActual: nuevaCantidad });
```

**Consecuencias**:
- ❌ Facturas en AsyncStorage pero ventas en Firebase
- ❌ Si falla AsyncStorage, se pierde la factura pero las ventas existen
- ❌ Sincronización manual propensa a errores
- ❌ No hay single source of truth

**Solución**:
```typescript
// ✅ USAR SOLO FIREBASE PARA TODO
// Eliminar AsyncStorage para datos críticos
// Implementar cache en memoria con React Query o SWR
```

---

### 3. **VALIDACIÓN DE DATOS INSUFICIENTE** 🟡 ALTO

**Problema**: No hay validación de integridad referencial.

```typescript
// ❌ FALTA VALIDAR
async reducirCantidadLote(loteId: string, cantidad: number) {
  // ¿Y si cantidad > cantidadActual? ✗
  // ¿Y si el lote ya está vendido? ✗
  // ¿Y si el usuario no tiene permiso? ✗
  
  const nuevaCantidad = Math.max(0, lote.cantidadActual - cantidad);
  // Math.max oculta el problema, pero no lo resuelve
}
```

**Solución**:
```typescript
// ✅ VALIDACIÓN COMPLETA
async reducirCantidadLote(loteId: string, cantidad: number) {
  // Validaciones de negocio
  if (cantidad <= 0) {
    throw new Error('INVALID_QUANTITY');
  }
  
  const lote = await this.getLote(loteId);
  
  if (!lote) {
    throw new Error('LOTE_NOT_FOUND');
  }
  
  if (lote.estado === EstadoLote.VENDIDO) {
    throw new Error('LOTE_ALREADY_SOLD');
  }
  
  if (cantidad > lote.cantidadActual) {
    throw new Error('INSUFFICIENT_QUANTITY');
  }
  
  // Ahora sí, proceder
  await this.updateLote(loteId, {
    cantidadActual: lote.cantidadActual - cantidad
  });
}
```

---

### 4. **MANEJO DE ERRORES INCONSISTENTE** 🟡 ALTO

**Problema**: Errores se loguean pero no se manejan correctamente.

```typescript
// ❌ PROBLEMA ACTUAL
async crearFactura() {
  try {
    await this.actualizarInventarioPorVenta(items);
  } catch (error) {
    console.error('Error al crear factura:', error);
    throw error;  // ¿Y los rollbacks? ¿Y la compensación?
  }
}

// ❌ EN OTRO LUGAR
private async actualizarInventarioPorVenta(items: ItemFactura[]): Promise<void> {
  try {
    // ...
  } catch (error) {
    console.error('Error al actualizar inventario por venta:', error);
    // ¡NO SE LANZA EL ERROR! = FALLO SILENCIOSO
  }
}
```

**Solución**:
```typescript
// ✅ MANEJO ESTRUCTURADO DE ERRORES
class DomainError extends Error {
  constructor(
    public code: string,
    message: string,
    public metadata?: any
  ) {
    super(message);
  }
}

class InsufficientQuantityError extends DomainError {
  constructor(loteId: string, requested: number, available: number) {
    super(
      'INSUFFICIENT_QUANTITY',
      `Lote ${loteId}: solicitado ${requested}, disponible ${available}`,
      { loteId, requested, available }
    );
  }
}

// Uso
try {
  await crearFactura(datos);
} catch (error) {
  if (error instanceof InsufficientQuantityError) {
    Alert.alert('Stock insuficiente', error.message);
  } else if (error instanceof DomainError) {
    Alert.alert('Error', `[${error.code}] ${error.message}`);
  } else {
    // Error inesperado
    Sentry.captureException(error);
    Alert.alert('Error inesperado', 'Contacte soporte');
  }
}
```

---

### 5. **AUSENCIA DE AUDITORIA** 🟡 ALTO

**Problema**: No hay trazabilidad de cambios críticos.

```typescript
// ❌ NO SE REGISTRA QUIÉN CAMBIÓ QUÉ Y CUÁNDO
await updateDoc(loteRef, {
  cantidadActual: nuevaCantidad
});
// ¿Quién lo cambió?
// ¿Por qué?
// ¿Desde dónde?
// ¿Cuál era el valor anterior?
```

**Solución**:
```typescript
// ✅ IMPLEMENTAR AUDIT LOG
interface AuditEntry {
  id: string;
  entityType: 'lote' | 'factura' | 'venta';
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'sell';
  userId: string;
  timestamp: Date;
  before: any;
  after: any;
  metadata: {
    ip?: string;
    userAgent?: string;
    reason?: string;
  };
}

async auditedUpdate(loteId: string, changes: any) {
  const before = await this.getLote(loteId);
  
  await updateDoc(loteRef, changes);
  
  const after = await this.getLote(loteId);
  
  await addDoc(collection(db, 'audit_log'), {
    entityType: 'lote',
    entityId: loteId,
    action: 'update',
    userId: currentUser.id,
    timestamp: new Date(),
    before,
    after,
    metadata: { reason: 'venta' }
  });
}
```

---

### 6. **CÓDIGO DUPLICADO** 🟢 MODERADO

**Problema**: Lógica repetida en múltiples lugares.

```typescript
// ❌ REPETIDO 3 VECES (levantes, engorde, ponedoras)
// En cada [id].tsx
const cargarDatosLote = async () => {
  await Promise.all([
    cargarLote(id),
    cargarMortalidad(id),
    cargarGastos(id),
    cargarVentas(id),
    calcularEstadisticas(id),
    // ...
  ]);
};
```

**Solución**:
```typescript
// ✅ HOOK GENÉRICO REUTILIZABLE
export const useLoteDetalles = <T extends LoteBase>(
  loteId: string,
  tipoAve: TipoAve,
  store: LoteStore<T>
) => {
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadAll = async () => {
      await Promise.all([
        store.cargarLote(loteId),
        store.cargarMortalidad(loteId),
        store.cargarGastos(loteId),
        store.cargarVentas(loteId),
        store.calcularEstadisticas(loteId),
      ]);
      setLoading(false);
    };
    
    loadAll();
  }, [loteId]);
  
  return { loading, lote: store.loteActual, ... };
};
```

---

### 7. **SECURITY RULES AUSENTES** 🔴 CRÍTICO

**Problema**: No vimos reglas de seguridad de Firebase.

```javascript
// ❌ FALTA firestore.rules
// Cualquiera puede leer/escribir cualquier cosa

// ✅ IMPLEMENTAR REGLAS
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // Lotes
    match /lotes/{loteId} {
      allow read: if isAuthenticated() && 
                     resource.data.createdBy == request.auth.uid;
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() && 
                               resource.data.createdBy == request.auth.uid;
    }
    
    // Facturas
    match /facturas/{facturaId} {
      allow read: if isAuthenticated() && 
                     resource.data.createdBy == request.auth.uid;
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && 
                       resource.data.createdBy == request.auth.uid &&
                       request.resource.data.estado != 'CANCELADA'; // No cancelar facturas
      allow delete: if false; // Nunca eliminar facturas
    }
  }
}
```

---

## 🏗️ ARQUITECTURA RECOMENDADA

### Patrón Repository + Unit of Work

```typescript
// ✅ ARQUITECTURA PROPUESTA
interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<void>;
  delete(id: string): Promise<void>;
}

interface IUnitOfWork {
  lotes: IRepository<Lote>;
  facturas: IRepository<Factura>;
  ventas: IRepository<Venta>;
  
  commit(): Promise<void>;  // Transacción
  rollback(): Promise<void>;
}

// Uso
const uow = createUnitOfWork();
try {
  const factura = await uow.facturas.save(nuevaFactura);
  
  for (const item of factura.items) {
    const lote = await uow.lotes.findById(item.loteId);
    lote.cantidadActual -= item.cantidad;
    await uow.lotes.save(lote);
    
    await uow.ventas.save(nuevaVenta);
  }
  
  await uow.commit();  // Todo o nada
} catch (error) {
  await uow.rollback();
  throw error;
}
```

---

## 📋 PRIORIDADES DE REFACTORING

### 🔴 **PRIORIDAD 1 - INMEDIATO** (1-2 semanas)
1. Implementar transacciones en operaciones críticas (ventas)
2. Migrar facturas de AsyncStorage a Firebase
3. Agregar validaciones de negocio robustas
4. Implementar reglas de seguridad de Firebase

### 🟡 **PRIORIDAD 2 - CORTO PLAZO** (2-4 semanas)
5. Sistema de audit log
6. Manejo estructurado de errores
7. Tests unitarios para lógica de negocio crítica
8. Documentación de APIs

### 🟢 **PRIORIDAD 3 - MEDIANO PLAZO** (1-2 meses)
9. Refactoring de código duplicado
10. Implementar cache con React Query
11. Optimizaciones de performance
12. Monitoreo y alertas (Sentry, Firebase Analytics)

---

## 💡 RECOMENDACIONES ADICIONALES

### Testing
```typescript
// ❌ NO HAY TESTS
// ✅ IMPLEMENTAR
describe('VentasService', () => {
  it('should rollback if inventory update fails', async () => {
    // Arrange
    const factura = createMockFactura();
    jest.spyOn(inventoryService, 'update').mockRejectedValue(new Error());
    
    // Act & Assert
    await expect(crearFactura(factura)).rejects.toThrow();
    
    // Verify no factura was created
    const facturas = await getFacturas();
    expect(facturas).not.toContainEqual(expect.objectContaining({ id: factura.id }));
  });
});
```

### Monitoring
```typescript
// ✅ AGREGAR TELEMETRÍA
import * as Sentry from '@sentry/react-native';

async crearFactura(datos: CrearFactura) {
  const span = Sentry.startTransaction({
    op: 'facturacion',
    name: 'crearFactura'
  });
  
  try {
    const result = await this._crearFactura(datos);
    span.setStatus('ok');
    return result;
  } catch (error) {
    span.setStatus('error');
    Sentry.captureException(error, {
      extra: { facturaData: datos }
    });
    throw error;
  } finally {
    span.finish();
  }
}
```

### Optimistic Updates
```typescript
// ✅ MEJORAR UX CON OPTIMISTIC UPDATES
const { mutate } = useMutation({
  mutationFn: crearFactura,
  onMutate: async (nuevaFactura) => {
    // Actualizar UI inmediatamente
    queryClient.setQueryData(['facturas'], (old) => [...old, nuevaFactura]);
  },
  onError: (error, variables, context) => {
    // Revertir si falla
    queryClient.setQueryData(['facturas'], context.previousFacturas);
  }
});
```

---

## 🎯 CONCLUSIÓN

**La app es funcional** pero tiene **riesgos críticos de integridad de datos**.

**Prioridad absoluta**:
1. ✅ Transacciones atómicas
2. ✅ Single source of truth (solo Firebase)
3. ✅ Validaciones robustas
4. ✅ Security rules

**Sin estas mejoras**, hay riesgo de:
- 💰 Pérdida de dinero (ventas sin factura)
- 📊 Reportes incorrectos
- 🔒 Vulnerabilidades de seguridad
- 😤 Frustración del usuario

**Tiempo estimado de mejoras críticas**: 2-3 semanas con 1 desarrollador senior.

