# 🔥 Optimización de Consultas Firestore

## Problema: Múltiples Filtros de Rango

Firestore **NO permite** consultas con filtros de rango (>, <, >=, <=, !=, `not-in`) en **múltiples campos** sin índices compuestos.

### ❌ Consulta Incorrecta

```typescript
// ERROR: Múltiples campos con filtros de rango
const q = query(
  collection(db, 'facturas'),
  where('createdBy', '==', userId),
  where('fecha', '>=', fechaInicio),    // Rango en 'fecha'
  where('fecha', '<=', fechaFin),        // Rango en 'fecha'
  where('estado', '!=', 'CANCELADA')     // Desigualdad en 'estado' ❌
);
```

**Error:** `The query requires an index` o `multiple range fields`

---

## ✅ Soluciones

### Solución 1: Filtrado en el Cliente (Recomendada)

Hacer la consulta en Firestore con filtros de rango en **un solo campo**, y filtrar el resto en el cliente.

```typescript
// Query solo con filtros de rango en 'fecha'
const q = query(
  collection(db, 'facturas'),
  where('createdBy', '==', userId),
  where('fecha', '>=', fechaInicio),
  where('fecha', '<=', fechaFin),
  orderBy('fecha', 'desc')
);

const querySnapshot = await getDocs(q);
const facturas: Factura[] = [];

querySnapshot.forEach((doc) => {
  const data = doc.data();
  
  // Filtrar 'estado' en el cliente
  if (data.estado === 'CANCELADA') {
    return; // Excluir
  }
  
  facturas.push({ id: doc.id, ...data } as Factura);
});
```

**Ventajas:**
- No requiere índices compuestos
- Más flexible
- Mantenimiento más fácil

**Desventajas:**
- Mayor transferencia de datos
- Filtrado adicional en el cliente

---

### Solución 2: Usar `in` en Lugar de `!=`

En lugar de excluir con `!=`, incluir explícitamente los valores deseados con `in`.

```typescript
// ❌ Antes: where('estado', '!=', 'CANCELADA')
// ✅ Después: Incluir solo los estados válidos
const q = query(
  collection(db, 'facturas'),
  where('createdBy', '==', userId),
  where('fecha', '>=', fechaInicio),
  where('fecha', '<=', fechaFin),
  where('estado', 'in', ['PENDIENTE', 'PAGADA', 'VENCIDA'])
);
```

**Nota:** `in` también puede requerir índices compuestos si se combina con rangos.

---

### Solución 3: Reestructurar Datos

Agregar campos calculados para facilitar consultas.

```typescript
// Agregar campo 'activa' (boolean) en lugar de verificar estado
interface Factura {
  // ... otros campos
  estado: EstadoFactura;
  activa: boolean; // true si estado !== 'CANCELADA'
}

// Query simple
const q = query(
  collection(db, 'facturas'),
  where('createdBy', '==', userId),
  where('fecha', '>=', fechaInicio),
  where('fecha', '<=', fechaFin),
  where('activa', '==', true)  // Igualdad simple ✅
);
```

---

### Solución 4: Crear Índices Compuestos

Si realmente necesitas la consulta completa en Firestore, crea un índice compuesto.

**Firebase Console:**
1. Ir a Firestore → Índices
2. Crear índice compuesto con:
   - `createdBy` (Ascending)
   - `fecha` (Ascending)
   - `estado` (Ascending)

O usar el error de Firebase para generar el enlace automático al índice.

**firestore.indexes.json:**
```json
{
  "indexes": [
    {
      "collectionGroup": "facturas",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "createdBy", "order": "ASCENDING" },
        { "fieldPath": "fecha", "order": "ASCENDING" },
        { "fieldPath": "estado", "order": "ASCENDING" }
      ]
    }
  ]
}
```

**Desventajas:**
- Costo de almacenamiento adicional
- Más complejidad de mantenimiento
- Límite de 200 índices compuestos por proyecto

---

## 📋 Reglas de Firestore para Consultas

### Filtros de Igualdad (`==`)
✅ Múltiples filtros de igualdad están permitidos:
```typescript
where('userId', '==', userId),
where('tipo', '==', 'LOTE'),
where('activo', '==', true)
```

### Filtros de Rango (`>`, `<`, `>=`, `<=`)
⚠️ Solo **un campo** puede tener filtros de rango:
```typescript
// ✅ Correcto: Rango en un solo campo
where('userId', '==', userId),
where('fecha', '>=', start),
where('fecha', '<=', end)

// ❌ Incorrecto: Rangos en múltiples campos
where('edad', '>', 18),
where('fecha', '<', now)  // Error ❌
```

### Filtros de Desigualdad (`!=`, `not-in`)
⚠️ `!=` y `not-in` **cuentan como filtros de rango**:
```typescript
// ❌ Incorrecto
where('fecha', '>=', start),
where('estado', '!=', 'CANCELADA')  // Cuenta como rango ❌
```

### Operador `in`
✅ `in` e `array-contains` se comportan como igualdad:
```typescript
// ✅ Correcto
where('userId', '==', userId),
where('estado', 'in', ['ACTIVO', 'PENDIENTE']),
where('fecha', '>=', start)
```

---

## 🎯 Mejores Prácticas

### 1. Limitar Filtros de Rango
- Usar **un solo campo** para rangos
- Filtrar el resto en el cliente

### 2. Priorizar Consultas Simples
- Evitar consultas complejas innecesarias
- Diseñar el esquema de datos para consultas simples

### 3. Usar Campos Calculados
- Agregar campos booleanos o categóricos
- Facilita consultas con igualdades

### 4. Ordenar Correctamente
- `orderBy` debe incluir todos los campos con filtros de rango
- Primero filtros de igualdad, luego rangos, finalmente `orderBy`

### 5. Paginar Resultados
- Usar `limit()` y `startAfter()` para grandes conjuntos
- Reducir transferencia de datos

---

## 📊 Ejemplos del Proyecto

### Facturas por Rango de Fechas
```typescript
async generarResumenVentas(fechaInicio: Date, fechaFin: Date): Promise<ResumenVentas> {
  const userId = requireAuth();
  
  // Query con rangos solo en 'fecha'
  const q = query(
    collection(db, 'facturas'),
    where('createdBy', '==', userId),
    where('fecha', '>=', fechaInicio),
    where('fecha', '<=', fechaFin),
    orderBy('fecha', 'desc')
  );
  
  const snapshot = await getDocs(q);
  
  // Filtrar estado en el cliente
  const facturas = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(factura => factura.estado !== 'CANCELADA');
  
  return calcularResumen(facturas);
}
```

### Ventas por Lote
```typescript
async obtenerVentasLote(loteId: string, tipoAve: TipoAve): Promise<VentaLote[]> {
  const userId = requireAuth();
  
  // Múltiples igualdades + orderBy está permitido
  const q = query(
    collection(db, 'ventas'),
    where('loteId', '==', loteId),
    where('tipoAve', '==', tipoAve),
    where('createdBy', '==', userId),
    orderBy('fecha', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
```

### Notificaciones con Filtros
```typescript
async getUserNotifications(userId: string, filter?: NotificationFilter) {
  // Query base con igualdad + orderBy
  let q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  let notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  // Filtros adicionales en el cliente
  if (filter?.status) {
    notifications = notifications.filter(n => filter.status.includes(n.status));
  }
  
  if (filter?.priority) {
    notifications = notifications.filter(n => filter.priority.includes(n.priority));
  }
  
  if (filter?.limit) {
    notifications = notifications.slice(0, filter.limit);
  }
  
  return notifications;
}
```

---

## 🔗 Recursos

- [Firestore Query Documentation](https://firebase.google.com/docs/firestore/query-data/queries)
- [Query Limitations](https://firebase.google.com/docs/firestore/query-data/queries#query_limitations)
- [Index Selection Best Practices](https://cloud.google.com/firestore/docs/query-data/multiple-range-fields)
- [Composite Indexes](https://firebase.google.com/docs/firestore/query-data/indexing)

---

## ✅ Checklist de Revisión

Al escribir una consulta Firestore, verifica:

- [ ] ¿Uso más de un campo con filtros de rango?
- [ ] ¿Uso `!=` o `not-in` junto con otros rangos?
- [ ] ¿Puedo mover algunos filtros al cliente?
- [ ] ¿Puedo usar campos calculados en lugar de rangos?
- [ ] ¿Necesito realmente un índice compuesto?
- [ ] ¿Estoy usando `limit()` para grandes conjuntos?
- [ ] ¿Mi `orderBy` es consistente con los filtros?

---

**Última actualización:** 2025-10-12













