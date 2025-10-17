# 🐔 SISTEMA DE MONITOREO DE BIENESTAR ANIMAL

## ⚠️ IMPLEMENTACIÓN CRÍTICA PARA EL CUIDADO DE LOS ANIMALES

Este documento describe el sistema automático de monitoreo del bienestar animal implementado en la aplicación. **Este sistema es FUNDAMENTAL** y no debe ser deshabilitado nunca.

---

## 🌟 ACTUALIZACIÓN v1.1.0 - SISTEMA INTELIGENTE PARA PONEDORAS

### ¿Qué cambió?

El sistema ahora es **inteligente con la edad de las gallinas ponedoras**:

- ✅ **Antes**: Alertaba por falta de huevos sin importar la edad (causaba falsas alarmas en gallinas jóvenes)
- ✅ **Ahora**: Evalúa 4 fases de desarrollo y solo alerta cuando corresponde

### Beneficios Inmediatos:

1. **No más falsas alarmas**: Gallinas de 8 semanas no generarán alertas por no poner huevos
2. **Alertas preparatorias**: Te avisa 7 días antes de que empiecen a poner para que prepares los nidos
3. **Detección de problemas reales**: Si tienen 22 semanas y no han puesto, ¡te alerta que algo está mal!
4. **Información contextual**: Todas las alertas incluyen la edad en semanas para mejor comprensión

### Ejemplo Real:

**Antes**: 🔴 "Lote Ponedoras A lleva 60 días sin recolección" → *Gallina de 10 semanas, todavía no debe poner*

**Ahora**: ✅ "Lote Ponedoras A en fase de desarrollo (10 semanas). No se esperan huevos todavía." → *Sin alerta, es normal*

---

## 🎯 Objetivo

**Proteger y cuidar activamente la salud y bienestar de las aves** mediante alertas automáticas cuando se detectan condiciones que ponen en riesgo su salud.

---

## 📋 ¿Qué Monitorea?

### 1. **Control de Peso (CRÍTICO)**

#### Pollos de Engorde
- ⚠️ **Advertencia**: 5 días sin pesar
- 🚨 **Emergencia**: 7 días sin pesar
- 🚨 **Emergencia**: Si nunca ha sido pesado y tiene más de 7 días

#### Pollos de Levante  
- ⚠️ **Advertencia**: 7 días sin pesar
- 🚨 **Emergencia**: 10 días sin pesar
- 🚨 **Emergencia**: Si nunca ha sido pesado y tiene más de 10 días

#### Gallinas Ponedoras
- ⚠️ **Advertencia**: 14 días sin pesar
- 🚨 **Emergencia**: 21 días sin pesar
- 🚨 **Emergencia**: Si nunca ha sido pesado y tiene más de 21 días

**¿Por qué es crítico?**
- El peso es el indicador #1 de salud y crecimiento adecuado
- Detecta problemas de alimentación tempranamente
- Permite identificar enfermedades antes de que se agraven
- Es esencial para determinar el momento óptimo de comercialización

### 2. **Producción de Huevos (Ponedoras) - INTELIGENTE POR EDAD** 🥚

El sistema **considera la edad del lote** para crear alertas apropiadas:

```
📊 LÍNEA DE TIEMPO DE DESARROLLO DE PONEDORAS

0 días                    133 días (19 sem)      140 días (20 sem)      161 días (23 sem)      Adultas
|-------------------------|----------------------|----------------------|---------------------|--------->
        DESARROLLO                PREPARACIÓN         INICIO POSTURA         POSTURA PLENA
     (Peso crítico)          (Alertas preventivas)   (Primera postura)    (Producción 100%)
         
         ✅ No alerta             📢 Recordatorio          ⚠️ Alerta si             🚨 Alerta si
         falta huevos            preparar nidos          no empiezan               no producen
                                                                                   regularmente
```

#### **Fase 1: Desarrollo (< 19 semanas)**
- ✅ **No se alerta** por falta de huevos
- Es normal que no pongan todavía
- El control de peso es prioritario

#### **Fase 2: Preparación (19-20 semanas)**
- 📢 **Alerta informativa** 7 días antes del inicio esperado
- Mensaje: "Prepara los nidos, pronto comenzarán a poner"
- Sin urgencia, es recordatorio preventivo

#### **Fase 3: Inicio de Postura (20-23 semanas)**
- 🚨 **Emergencia** si llevan 14+ días desde edad esperada sin poner
- ⚠️ **Alerta** si empezaron a poner pero se detuvieron 3+ días
- Edad esperada de inicio: 140 días (20 semanas)

#### **Fase 4: Postura Plena (23+ semanas)**
- 🚨 **Emergencia crítica** si nunca han puesto huevos
- 🚨 **Emergencia** si llevan 3+ días sin recolección
- ⚠️ **Advertencia** si llevan 2+ días sin recolección

**¿Por qué es crítico considerar la edad?**
- Las gallinas jóvenes NO deben poner huevos todavía
- Alertar antes de tiempo causa estrés innecesario
- La edad es el factor #1 para determinar si algo está mal
- Permite detectar problemas reales de madurez sexual
- Ayuda a prepararse para el inicio de postura

**Beneficios de este enfoque:**
- ❌ No más falsas alarmas en gallinas jóvenes
- ✅ Alertas precisas según fase de desarrollo
- ✅ Detecta problemas de madurez a tiempo
- ✅ Preparación anticipada para inicio de postura
- ✅ Mejor comprensión del ciclo productivo

### 3. **Mortalidad**

- ⚠️ **Advertencia**: 5% de mortalidad
- 🚨 **Emergencia**: 10% de mortalidad

**¿Por qué es crítico?**
- Indica problemas sanitarios graves
- Puede ser señal de enfermedad contagiosa
- Requiere atención veterinaria inmediata
- Afecta la rentabilidad del lote

---

## 🔔 Sistema de Notificaciones

### Niveles de Prioridad

1. **🚨 CRÍTICA (Rojo)**
   - Requiere acción INMEDIATA
   - Envía notificación push
   - Situación de emergencia para los animales

2. **⚠️ ALTA (Amarillo)**
   - Requiere atención pronto
   - Envía notificación push
   - Situación preocupante

3. **ℹ️ MEDIA (Azul)**
   - Información importante
   - No urgente

4. **📊 BAJA (Gris)**
   - Información general
   - Seguimiento rutinario

### Ejemplos de Alertas

#### Emergencia - Lote sin Pesar
```
🚨 EMERGENCIA: Lote "Levante A" sin control

CRÍTICO: Los pollos de levante del lote "Levante A" llevan 9 días 
sin control de peso. Esto pone en riesgo su salud y puede indicar 
problemas de crecimiento o alimentación. Acción INMEDIATA requerida.
```

#### Advertencia - Mortalidad Elevada
```
⚠️ Atención: Mortalidad elevada

El lote "Engorde B" tiene una mortalidad del 6.5% (39 de 600 pollos). 
Monitorea de cerca y considera revisar condiciones del lote y consultar 
con un veterinario.
```

#### Preparación - Ponedoras Próximas a Poner
```
🥚 Preparación: Ponedoras A próximo a poner

Las gallinas del lote "Ponedoras A" tienen 19 semanas de edad. 
Se espera que comiencen a poner huevos en aproximadamente 6 días. 
Asegúrate de tener nidos limpios y preparados.
```

#### Emergencia - Ponedoras sin Producción
```
🚨 EMERGENCIA: Ponedoras B sin poner huevos

CRÍTICO: Las gallinas del lote "Ponedoras B" tienen 22 semanas de edad 
y NO han comenzado a poner huevos. Esto es anormal. Verifica: nutrición, 
iluminación, estrés, y consulta a un veterinario URGENTE.
```

#### Info - Lote Joven (Sin Alerta)
```
✅ Lote Ponedoras C en fase de desarrollo (12 semanas). 
   No se esperan huevos todavía.
   
[No se crea notificación - Es normal]
```

---

## 🔧 Implementación Técnica

### Archivos Creados/Modificados

1. **`src/services/animal-welfare-monitoring.service.ts`** ⭐ NUEVO
   - Servicio principal de monitoreo
   - Contiene todos los umbrales de bienestar
   - Funciones de verificación automática
   - Creación de alertas

2. **`src/stores/levantesStore.ts`** ✅ Modificado
   - Integrado monitoreo automático en suscripción

3. **`src/stores/engordeStore.ts`** ✅ Modificado
   - Integrado monitoreo automático en suscripción

4. **`src/stores/ponedorasStore.ts`** ✅ Modificado
   - Integrado monitoreo automático en suscripción

### ¿Cuándo se Ejecuta?

El monitoreo se ejecuta **automáticamente** en los siguientes momentos:

1. ✅ Al cargar la lista de lotes (cada vez que se abre la pestaña)
2. ✅ Cuando se actualiza la lista de lotes en tiempo real (suscripción Firebase)
3. ✅ Cuando se registra un nuevo peso
4. ✅ Cuando se registra mortalidad
5. ✅ Cuando se registra producción de huevos

**No requiere intervención manual** - El sistema funciona automáticamente en segundo plano.

---

## 📊 Beneficios Inmediatos

### Para los Animales 🐔
- ✅ Detección temprana de problemas de salud
- ✅ Mejor control de crecimiento y desarrollo
- ✅ Reducción de mortalidad por intervención oportuna
- ✅ Mejor calidad de vida

### Para el Usuario 👨‍🌾
- ✅ Notificaciones push cuando algo requiere atención
- ✅ No más olvidos de pesaje o recolección
- ✅ Reducción de pérdidas económicas
- ✅ Mejor toma de decisiones basada en datos
- ✅ Cumplimiento de estándares de bienestar animal

### Para el Negocio 💼
- ✅ Mayor rentabilidad por menor mortalidad
- ✅ Mejor calidad de producto final
- ✅ Cumplimiento de regulaciones
- ✅ Trazabilidad completa

---

## 🚀 Próximos Pasos Recomendados

### Corto Plazo (1-2 semanas)
1. ✅ Monitorear que las notificaciones se generen correctamente
2. ⏳ Ajustar umbrales si es necesario según experiencia real
3. ⏳ Agregar estadísticas de alertas generadas

### Mediano Plazo (1 mes)
1. ⏳ Integrar con calendario para programar pesajes
2. ⏳ Agregar recordatorios preventivos (antes de la emergencia)
3. ⏳ Dashboard de bienestar animal con gráficas

### Largo Plazo (3+ meses)
1. ⏳ Integración con sistema de vacunación
2. ⏳ Alertas de densidad poblacional
3. ⏳ ML para predecir problemas antes de que ocurran
4. ⏳ Integración con sensores IoT (temperatura, humedad, etc.)

---

## ⚠️ ADVERTENCIAS IMPORTANTES

### ❌ NUNCA Hacer:
1. **NO** deshabilitar el sistema de monitoreo
2. **NO** ignorar las alertas de emergencia
3. **NO** modificar los umbrales sin consultar a un veterinario
4. **NO** desactivar las notificaciones push para alertas críticas

### ✅ SIEMPRE Hacer:
1. **SÍ** responder a las alertas de emergencia inmediatamente
2. **SÍ** investigar las causas de las alertas recurrentes
3. **SÍ** mantener registros de peso actualizados
4. **SÍ** consultar a un veterinario cuando sea necesario

---

## 📞 Soporte Técnico

Si experimentas problemas con el sistema de alertas:

1. Verifica los logs de consola (busca 🐔 o 🚨)
2. Asegúrate de que el usuario esté autenticado
3. Verifica que los stores estén suscritos correctamente
4. Revisa la pantalla de notificaciones en la app

---

## 📝 Registro de Cambios

### v1.1.0 - 2024-10-11 (Actualización Ponedoras Inteligente) 🥚
- ✅ **MEJORA CRÍTICA**: Sistema inteligente por edad para ponedoras
- ✅ 4 fases de desarrollo con alertas específicas
- ✅ No más falsas alarmas en gallinas jóvenes
- ✅ Alertas de preparación antes del inicio de postura
- ✅ Detección de problemas de madurez sexual
- ✅ Mensajes contextuales según edad (incluye semanas de vida)
- ✅ Logs detallados de evaluación por fase
- ✅ Documentación actualizada con ejemplos

### v1.0.0 - 2024-10-11 (Implementación Inicial)
- ✅ Implementación inicial del sistema de monitoreo
- ✅ Alertas de pesaje para todos los tipos de aves
- ✅ Alertas de producción de huevos (básicas)
- ✅ Alertas de mortalidad
- ✅ Integración con stores de Zustand
- ✅ Sistema de notificaciones push
- ✅ Documentación completa

---

## 💚 Compromiso con el Bienestar Animal

Este sistema fue creado con un **profundo respeto por la vida animal** y el compromiso de proporcionar el **mejor cuidado posible** a las aves bajo nuestra responsabilidad.

**Los animales dependen de nosotros** - Usemos la tecnología para ser mejores guardianes.

---

*"La grandeza de una nación y su progreso moral pueden ser juzgados por la forma en que sus animales son tratados." - Mahatma Gandhi*

