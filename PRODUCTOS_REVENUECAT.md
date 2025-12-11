# 📦 Productos de RevenueCat - Gallinapp

## Lista Completa de Productos

### 🔵 Plan Básico (Basic)

| Product ID | Nombre Completo | Duración | Precio Sugerido | Ahorro vs Mensual |
|------------|-----------------|----------|-----------------|-------------------|
| `basic_monthly` | Plan Básico Mensual | 1 mes | $19.99 | - |
| `basic_trimestral` | Plan Básico Trimestral | 3 meses | $54.99 | 8% ($5) |
| `basic_annual` | Plan Básico Anual | 12 meses | $199.99 | 17% ($40) |

**Características del Plan Básico:**
- Hasta 10 lotes
- 3 colaboradores
- 5 GB almacenamiento
- 500 transacciones/mes
- Analytics avanzados
- Exportación de datos
- Alertas avanzadas

---

### 🟢 Plan Pro (Professional)

| Product ID | Nombre Completo | Duración | Precio Sugerido | Ahorro vs Mensual |
|------------|-----------------|----------|-----------------|-------------------|
| `pro_monthly` | Plan Pro Mensual | 1 mes | $49.99 | - |
| `pro_trimestral` | Plan Pro Trimestral | 3 meses | $134.99 | 10% ($15) |
| `pro_annual` | Plan Pro Anual | 12 meses | $499.99 | 17% ($100) |

**Características del Plan Pro:**
- Hasta 50 lotes
- 10 colaboradores
- 25 GB almacenamiento
- 2,000 transacciones/mes
- Todo lo de Básico +
- Acceso API
- Reportes personalizados
- Múltiples ubicaciones

---

### 🟡 Plan Enterprise (Empresarial)

| Product ID | Nombre Completo | Duración | Precio Sugerido | Ahorro vs Mensual |
|------------|-----------------|----------|-----------------|-------------------|
| `enterprise_monthly` | Plan Enterprise Mensual | 1 mes | $99.99 | - |
| `enterprise_trimestral` | Plan Enterprise Trimestral | 3 meses | $269.99 | 10% ($30) |
| `enterprise_annual` | Plan Enterprise Anual | 12 meses | $999.99 | 17% ($200) |

**Características del Plan Enterprise:**
- Lotes ilimitados
- Colaboradores ilimitados
- Almacenamiento ilimitado
- Transacciones ilimitadas
- Todo lo de Pro +
- Integraciones personalizadas
- Soporte prioritario 24/7
- Gerente de cuenta dedicado

---

## 🎯 Configuración en RevenueCat Dashboard

### 1. Crear Productos

Para cada producto, configura:

```json
{
  "identifier": "basic_monthly",
  "display_name": "Plan Básico Mensual",
  "type": "subscription",
  "entitlement": "Gallinapp Pro",
  "duration": "P1M"  // ISO 8601: P1M=1 mes, P3M=3 meses, P1Y=1 año
}
```

### 2. Duración en formato ISO 8601

| Período | Código ISO 8601 |
|---------|-----------------|
| Mensual | `P1M` |
| Trimestral | `P3M` |
| Anual | `P1Y` |

### 3. Offering Structure

```
Default Offering
├── Monthly Package
│   ├── basic_monthly
│   ├── pro_monthly
│   └── enterprise_monthly
├── Quarterly Package
│   ├── basic_trimestral
│   ├── pro_trimestral
│   └── enterprise_trimestral
└── Annual Package
    ├── basic_annual
    ├── pro_annual
    └── enterprise_annual
```

---

## 💰 Estrategia de Precios

### Descuentos Aplicados

| Plan | Mensual | Trimestral (ahorro) | Anual (ahorro) |
|------|---------|---------------------|----------------|
| **Basic** | $19.99 | $54.99 (8%) | $199.99 (17%) |
| **Pro** | $49.99 | $134.99 (10%) | $499.99 (17%) |
| **Enterprise** | $99.99 | $269.99 (10%) | $999.99 (17%) |

### Cálculo de Ahorro

```
Mensual x 12 = Precio anual sin descuento
(Precio mensual x 12) - Precio anual = Ahorro total
(Ahorro / (Precio mensual x 12)) x 100 = % Ahorro
```

**Ejemplo - Plan Pro:**
- Mensual: $49.99 x 12 = $599.88
- Anual: $499.99
- Ahorro: $599.88 - $499.99 = $99.89 (≈17%)

---

## 🎨 Recomendaciones de UI

### Mostrar en Paywall

1. **Destacar Plan Anual:**
   ```
   ⭐ MÁS POPULAR
   Plan Pro Anual
   $499.99/año
   Ahorra $100 (17%)
   ```

2. **Badge de Ahorro:**
   ```
   🎉 AHORRA 17%
   ```

3. **Precio por Mes:**
   ```
   Plan Pro Anual
   $499.99/año
   Solo $41.67/mes
   ```

### Toggle de Período

```
┌─────────┬─────────────┬─────────┐
│ Mensual │ Trimestral  │  Anual  │
│         │ (Ahorra 10%)│(Ahorra 17%)|
└─────────┴─────────────┴─────────┘
```

---

## 📱 Implementación en Código

Los identificadores ya están configurados en `src/services/subscription.service.ts`:

```typescript
const REVENUE_CAT_CONFIG = {
  products: {
    basic: {
      monthly: 'basic_monthly',
      quarterly: 'basic_trimestral',
      annual: 'basic_annual',
    },
    pro: {
      monthly: 'pro_monthly',
      quarterly: 'pro_trimestral',
      annual: 'pro_annual',
    },
    enterprise: {
      monthly: 'enterprise_monthly',
      quarterly: 'enterprise_trimestral',
      annual: 'enterprise_annual',
    }
  }
};
```

---

## ✅ Checklist de Configuración

### En RevenueCat Dashboard
- [ ] Crear 9 productos con los IDs correctos
- [ ] Configurar duración (P1M, P3M, P1Y)
- [ ] Asociar todos al entitlement "Gallinapp Pro"
- [ ] Crear offering "Default"
- [ ] Agregar productos al offering
- [ ] Diseñar paywall con los 3 períodos
- [ ] Publicar paywall

### En App Store Connect
- [ ] Crear 9 productos de suscripción
- [ ] Usar los mismos IDs
- [ ] Configurar precios en todas las regiones
- [ ] Configurar período de prueba gratuita (opcional)
- [ ] Enviar para revisión

### En Google Play Console
- [ ] Crear 9 productos de suscripción
- [ ] Usar los mismos IDs
- [ ] Configurar precios en todas las regiones
- [ ] Configurar período de prueba gratuita (opcional)
- [ ] Activar productos

---

## 🧪 Testing

### Productos a Probar

Prueba al menos uno de cada tipo:
1. `basic_monthly` - Caso base
2. `pro_trimestral` - Período trimestral
3. `enterprise_annual` - Plan anual más caro

### Escenarios de Test

1. **Compra Nueva**
   - Usuario sin suscripción compra `basic_monthly`
   - Verificar entitlement activo
   - Verificar fecha de renovación

2. **Upgrade**
   - Usuario con `basic_monthly` cambia a `pro_monthly`
   - Verificar prorrateción
   - Verificar cambio de entitlement

3. **Cambio de Período**
   - Usuario con `pro_monthly` cambia a `pro_annual`
   - Verificar nuevo ciclo de facturación

4. **Downgrade**
   - Usuario con `pro_monthly` cambia a `basic_monthly`
   - Verificar que el cambio ocurre al final del período

---

## 📊 Monitoreo

### Métricas Clave a Vigilar

1. **Por Período:**
   - % de usuarios que eligen anual vs mensual
   - Tasa de renovación por período
   - Churn por período

2. **Por Plan:**
   - Distribución de usuarios por plan
   - Upgrade/downgrade rate
   - Revenue por plan

3. **Conversión:**
   - Trial to paid conversion
   - Free to paid conversion
   - Paywall presentation to purchase

---

## 💡 Tips

1. **Destacar Plan Anual:**
   - Muestra el ahorro en dólares, no solo porcentaje
   - "Ahorra $100" es más impactante que "Ahorra 17%"

2. **Precios Psicológicos:**
   - $49.99 es mejor que $50.00
   - Considera $199 en lugar de $199.99 para anual

3. **Trial Periods:**
   - Considera 7 días gratis para planes mensuales
   - Considera 14 días gratis para planes anuales

4. **First-Time User Offers:**
   - 30% off primer mes
   - 3 meses por el precio de 2

---

## 🔗 Referencias

- [RevenueCat Product IDs Best Practices](https://www.revenuecat.com/docs/product-ids)
- [iOS Subscription Groups](https://developer.apple.com/app-store/subscriptions/)
- [Android Subscription Upgrades](https://developer.android.com/google/play/billing/subscriptions)

