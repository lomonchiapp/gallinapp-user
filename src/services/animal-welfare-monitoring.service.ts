/**
 * ⚠️ SERVICIO CRÍTICO DE MONITOREO DEL BIENESTAR ANIMAL ⚠️
 * 
 * Este servicio es FUNDAMENTAL para el cuidado de los animales.
 * Monitorea activamente las condiciones de los lotes y genera alertas
 * automáticas cuando se detectan situaciones que ponen en riesgo su bienestar.
 * 
 * NUNCA deshabilitar o ignorar las alertas de este servicio.
 */

import { TipoAve } from '../types/enums';
import {
    NotificationCategory,
    NotificationPriority,
    NotificationType
} from '../types/notification';
import { isAuthenticated } from './auth.service';
import { createNotification } from './notifications.service';

/**
 * UMBRALES CRÍTICOS DE BIENESTAR ANIMAL
 * Estos valores están basados en estándares de bienestar animal y buenas prácticas avícolas
 */
export const WELFARE_THRESHOLDS = {
  // Pesaje - Monitoreo de crecimiento y salud
  PESO: {
    ENGORDE: {
      ADVERTENCIA_DIAS: 5,    // Advertir después de 5 días sin pesar
      EMERGENCIA_DIAS: 7,     // Emergencia después de 7 días sin pesar
      NUNCA_PESADO_DIAS: 7,   // Si nunca ha sido pesado y tiene más de 7 días
    },
    LEVANTE: {
      ADVERTENCIA_DIAS: 7,    // Advertir después de 7 días sin pesar
      EMERGENCIA_DIAS: 10,    // Emergencia después de 10 días sin pesar
      NUNCA_PESADO_DIAS: 10,  // Si nunca ha sido pesado y tiene más de 10 días
    },
    PONEDORAS: {
      ADVERTENCIA_DIAS: 14,   // Advertir después de 14 días sin pesar
      EMERGENCIA_DIAS: 21,    // Emergencia después de 21 días sin pesar
      NUNCA_PESADO_DIAS: 21,  // Si nunca ha sido pesado y tiene más de 21 días
    }
  },
  
  // Producción de huevos - CRÍTICO: Considerar edad de madurez sexual
  PRODUCCION: {
    // Fases de desarrollo de ponedoras
    EDAD_INICIO_POSTURA: 140,        // Día 140 (20 semanas) inicio esperado de postura
    EDAD_POSTURA_PLENA: 161,         // Día 161 (23 semanas) postura plena esperada
    EDAD_MINIMA_ALERTA: 133,         // Día 133 (19 semanas) edad mínima para alertar
    
    // Alertas durante desarrollo (antes de postura)
    DESARROLLO: {
      ADVERTENCIA_PESO_DIAS: 14,     // Control de peso cada 14 días en desarrollo
      EMERGENCIA_PESO_DIAS: 21,      // Emergencia si no se pesa por 21 días
    },
    
    // Alertas durante período productivo (después de inicio de postura)
    PRODUCTIVO: {
      ADVERTENCIA_DIAS: 2,           // Advertir si no se recolectan huevos por 2 días
      EMERGENCIA_DIAS: 3,            // Emergencia si no se recolectan por 3 días
      PRODUCCION_BAJA_UMBRAL: 60,    // Alerta si producción cae bajo 60% del esperado
    },
    
    // Alertas de madurez
    ALERTA_PRONTA_POSTURA: 7,        // Alertar 7 días antes del inicio esperado
    ALERTA_SIN_POSTURA: 14,          // Días después de edad esperada sin producción
  },
  
  // Mortalidad
  MORTALIDAD: {
    TASA_ADVERTENCIA: 5,      // 5% de mortalidad es preocupante
    TASA_EMERGENCIA: 10,      // 10% de mortalidad es crítico
  },
  
  // Densidad poblacional (aves por metro cuadrado)
  DENSIDAD: {
    ENGORDE_MAX: 10,          // Máximo 10 pollos/m² en engorde
    LEVANTE_MAX: 8,           // Máximo 8 pollos/m² en levante
    PONEDORAS_MAX: 6,         // Máximo 6 gallinas/m² en ponedoras
  }
};

/**
 * Verificar y crear alertas de pesaje para un lote
 */
export const checkWeightAlerts = async (
  loteId: string,
  loteName: string,
  tipoAve: TipoAve,
  diasSinPesar: number,
  nuncaPesado: boolean,
  edadDias: number
): Promise<void> => {
  if (!isAuthenticated()) {
    console.warn('🚨 checkWeightAlerts: Usuario no autenticado, no se pueden crear alertas');
    return;
  }

  let thresholds;
  let tipoAveNombre = '';
  
  switch (tipoAve) {
    case TipoAve.POLLO_ENGORDE:
      thresholds = WELFARE_THRESHOLDS.PESO.ENGORDE;
      tipoAveNombre = 'pollos de engorde';
      break;
    case TipoAve.POLLO_LEVANTE:
      thresholds = WELFARE_THRESHOLDS.PESO.LEVANTE;
      tipoAveNombre = 'pollos de levante';
      break;
    case TipoAve.PONEDORA:
      thresholds = WELFARE_THRESHOLDS.PESO.PONEDORAS;
      tipoAveNombre = 'gallinas ponedoras';
      break;
    default:
      return;
  }

  // EMERGENCIA: Nunca ha sido pesado y ya tiene edad suficiente
  if (nuncaPesado && edadDias >= thresholds.NUNCA_PESADO_DIAS) {
    console.warn(`🚨 EMERGENCIA BIENESTAR ANIMAL: Lote ${loteName} NUNCA ha sido pesado (${edadDias} días de edad)`);
    
    await createNotification({
      type: NotificationType.CUSTOM,
      category: NotificationCategory.PRODUCTION,
      priority: NotificationPriority.CRITICAL,
      title: `🚨 EMERGENCIA: ${loteName} sin pesar`,
      message: `Los ${tipoAveNombre} del lote "${loteName}" tienen ${edadDias} días de edad y NUNCA han sido pesados. Es URGENTE realizar un control de peso para verificar su salud y crecimiento.`,
      icon: 'warning',
      data: { 
        loteId, 
        loteName, 
        tipoAve: tipoAve.toString(),
        diasSinPesar: edadDias,
        nuncaPesado: true,
        razon: 'NUNCA_PESADO'
      },
      sendPush: true,
    });
    return;
  }

  // EMERGENCIA: Hace demasiado tiempo sin pesar
  if (!nuncaPesado && diasSinPesar >= thresholds.EMERGENCIA_DIAS) {
    console.warn(`🚨 EMERGENCIA BIENESTAR ANIMAL: Lote ${loteName} lleva ${diasSinPesar} días sin pesar`);
    
    await createNotification({
      type: NotificationType.CUSTOM,
      category: NotificationCategory.PRODUCTION,
      priority: NotificationPriority.CRITICAL,
      title: `🚨 EMERGENCIA: ${loteName} sin control`,
      message: `CRÍTICO: Los ${tipoAveNombre} del lote "${loteName}" llevan ${diasSinPesar} días sin control de peso. Esto pone en riesgo su salud y puede indicar problemas de crecimiento o alimentación. Acción INMEDIATA requerida.`,
      icon: 'warning',
      data: { 
        loteId, 
        loteName, 
        tipoAve: tipoAve.toString(),
        diasSinPesar,
        razon: 'DIAS_EXCESIVOS'
      },
      sendPush: true,
    });
    return;
  }

  // ADVERTENCIA: Se está acercando al límite
  if (!nuncaPesado && diasSinPesar >= thresholds.ADVERTENCIA_DIAS) {
    console.warn(`⚠️ ADVERTENCIA BIENESTAR ANIMAL: Lote ${loteName} lleva ${diasSinPesar} días sin pesar`);
    
    await createNotification({
      type: NotificationType.CUSTOM,
      category: NotificationCategory.PRODUCTION,
      priority: NotificationPriority.HIGH,
      title: `⚠️ Atención: ${loteName} necesita control`,
      message: `Los ${tipoAveNombre} del lote "${loteName}" llevan ${diasSinPesar} días sin control de peso. Es importante pesarlos pronto para monitorear su desarrollo y detectar posibles problemas a tiempo.`,
      icon: 'alert-circle',
      data: { 
        loteId, 
        loteName, 
        tipoAve: tipoAve.toString(),
        diasSinPesar,
        razon: 'ADVERTENCIA'
      },
      sendPush: true,
    });
  }
};

/**
 * Verificar y crear alertas de producción de huevos
 * CRÍTICO: Considera la edad del lote para alertas apropiadas
 */
export const checkEggProductionAlerts = async (
  loteId: string,
  loteName: string,
  edadDias: number,
  diasSinRecoleccion: number,
  nuncaRecolectado: boolean
): Promise<void> => {
  if (!isAuthenticated()) {
    return;
  }

  const thresholds = WELFARE_THRESHOLDS.PRODUCCION;
  const edadSemanas = Math.floor(edadDias / 7);

  console.log(`🐔 [Ponedoras] Evaluando producción para lote ${loteName} - Edad: ${edadDias} días (${edadSemanas} semanas)`);

  // FASE 1: DESARROLLO (antes de la edad de postura)
  if (edadDias < thresholds.EDAD_MINIMA_ALERTA) {
    // Las gallinas son demasiado jóvenes para poner huevos - NO alertar por falta de producción
    console.log(`✅ Lote ${loteName} en fase de desarrollo (${edadSemanas} semanas). No se esperan huevos todavía.`);
    
    // En esta fase, el control de peso es lo más importante (ya manejado por checkWeightAlerts)
    return;
  }

  // FASE 2: PREPARACIÓN PARA POSTURA (19-20 semanas)
  if (edadDias >= thresholds.EDAD_MINIMA_ALERTA && edadDias < thresholds.EDAD_INICIO_POSTURA) {
    const diasParaPostura = thresholds.EDAD_INICIO_POSTURA - edadDias;
    
    console.log(`📢 Lote ${loteName} próximo a iniciar postura en ${diasParaPostura} días`);
    
    // Alerta informativa de preparación
    if (diasParaPostura <= thresholds.ALERTA_PRONTA_POSTURA && nuncaRecolectado) {
      await createNotification({
        type: NotificationType.CUSTOM,
        category: NotificationCategory.PRODUCTION,
        priority: NotificationPriority.MEDIUM,
        title: `🥚 Preparación: ${loteName} próximo a poner`,
        message: `Las gallinas del lote "${loteName}" tienen ${edadSemanas} semanas de edad. Se espera que comiencen a poner huevos en aproximadamente ${diasParaPostura} días. Asegúrate de tener nidos limpios y preparados.`,
        icon: 'calendar',
        data: { 
          loteId, 
          loteName, 
          edadDias,
          edadSemanas,
          diasParaPostura,
          tipoAve: TipoAve.PONEDORA.toString(),
          fase: 'PREPARACION'
        },
        sendPush: true,
      });
    }
    
    return;
  }

  // FASE 3: INICIO DE POSTURA (20-23 semanas)
  if (edadDias >= thresholds.EDAD_INICIO_POSTURA && edadDias < thresholds.EDAD_POSTURA_PLENA) {
    const diasDesdeInicioEsperado = edadDias - thresholds.EDAD_INICIO_POSTURA;
    
    console.log(`🥚 Lote ${loteName} en fase de inicio de postura (${edadSemanas} semanas)`);
    
    // Si nunca ha puesto huevos y ya pasó la edad esperada
    if (nuncaRecolectado && diasDesdeInicioEsperado >= thresholds.ALERTA_SIN_POSTURA) {
      console.error(`🚨 EMERGENCIA: Lote ${loteName} sin producción a ${edadSemanas} semanas`);
      
      await createNotification({
        type: NotificationType.PRODUCCION_BAJA,
        category: NotificationCategory.PRODUCTION,
        priority: NotificationPriority.CRITICAL,
        title: `🚨 EMERGENCIA: ${loteName} sin poner huevos`,
        message: `CRÍTICO: Las gallinas del lote "${loteName}" tienen ${edadSemanas} semanas de edad y NO han comenzado a poner huevos. Esto es anormal. Verifica: nutrición, iluminación, estrés, y consulta a un veterinario URGENTE.`,
        icon: 'alert',
        data: { 
          loteId, 
          loteName, 
          edadDias,
          edadSemanas,
          diasDesdeInicioEsperado,
          tipoAve: TipoAve.PONEDORA.toString(),
          fase: 'INICIO_SIN_PRODUCCION'
        },
        sendPush: true,
      });
      return;
    }
    
    // Si ya empezó a poner pero dejó de hacerlo
    if (!nuncaRecolectado && diasSinRecoleccion >= thresholds.PRODUCTIVO.EMERGENCIA_DIAS) {
      console.error(`🚨 ALERTA: Lote ${loteName} detuvo producción en fase inicial`);
      
      await createNotification({
        type: NotificationType.PRODUCCION_BAJA,
        category: NotificationCategory.PRODUCTION,
        priority: NotificationPriority.CRITICAL,
        title: `🚨 ALERTA: ${loteName} detuvo producción`,
        message: `El lote "${loteName}" (${edadSemanas} semanas) había comenzado a poner huevos pero lleva ${diasSinRecoleccion} días sin recolección. Verifica salud del lote INMEDIATAMENTE.`,
        icon: 'warning',
        data: { 
          loteId, 
          loteName, 
          edadDias,
          edadSemanas,
          diasSinRecoleccion,
          tipoAve: TipoAve.PONEDORA.toString(),
          fase: 'INICIO_DETENIDO'
        },
        sendPush: true,
      });
      return;
    }
    
    return;
  }

  // FASE 4: POSTURA PLENA (23+ semanas)
  if (edadDias >= thresholds.EDAD_POSTURA_PLENA) {
    console.log(`🥚 Lote ${loteName} en fase de postura plena (${edadSemanas} semanas)`);
    
    // En esta fase, las gallinas DEBEN estar poniendo huevos regularmente
    
    // CRÍTICO: Nunca ha puesto huevos y ya está en postura plena
    if (nuncaRecolectado) {
      console.error(`🚨 EMERGENCIA CRÍTICA: Lote ${loteName} a ${edadSemanas} semanas sin poner`);
      
      await createNotification({
        type: NotificationType.PRODUCCION_BAJA,
        category: NotificationCategory.PRODUCTION,
        priority: NotificationPriority.CRITICAL,
        title: `🚨 EMERGENCIA: ${loteName} NO produce`,
        message: `EMERGENCIA CRÍTICA: El lote "${loteName}" tiene ${edadSemanas} semanas y NUNCA ha producido huevos. Esto indica un problema GRAVE. Requiere evaluación veterinaria URGENTE. Posibles causas: enfermedad, mala nutrición, problemas genéticos, estrés severo.`,
        icon: 'alert',
        data: { 
          loteId, 
          loteName, 
          edadDias,
          edadSemanas,
          tipoAve: TipoAve.PONEDORA.toString(),
          fase: 'PLENA_SIN_PRODUCCION'
        },
        sendPush: true,
      });
      return;
    }
    
    // EMERGENCIA: Demasiado tiempo sin recolección en fase productiva
    if (diasSinRecoleccion >= thresholds.PRODUCTIVO.EMERGENCIA_DIAS) {
      console.error(`🚨 EMERGENCIA: Lote ${loteName} lleva ${diasSinRecoleccion} días sin recolección`);
      
      await createNotification({
        type: NotificationType.PRODUCCION_BAJA,
        category: NotificationCategory.PRODUCTION,
        priority: NotificationPriority.CRITICAL,
        title: `🚨 EMERGENCIA: Recolección de huevos`,
        message: `El lote "${loteName}" (${edadSemanas} semanas) lleva ${diasSinRecoleccion} días sin recolección de huevos. Esto causa pérdidas económicas y afecta el bienestar de las gallinas. Si dejaron de poner, requiere atención veterinaria. Acción INMEDIATA requerida.`,
        icon: 'warning',
        data: { 
          loteId, 
          loteName, 
          edadDias,
          edadSemanas,
          diasSinRecoleccion,
          tipoAve: TipoAve.PONEDORA.toString(),
          fase: 'PLENA_SIN_RECOLECCION'
        },
        sendPush: true,
      });
      return;
    }
    
    // ADVERTENCIA: Se está acercando al límite
    if (diasSinRecoleccion >= thresholds.PRODUCTIVO.ADVERTENCIA_DIAS) {
      console.warn(`⚠️ ADVERTENCIA: Lote ${loteName} lleva ${diasSinRecoleccion} días sin recolección`);
      
      await createNotification({
        type: NotificationType.PRODUCCION_BAJA,
        category: NotificationCategory.PRODUCTION,
        priority: NotificationPriority.HIGH,
        title: `⚠️ Atención: Recolección pendiente`,
        message: `El lote "${loteName}" (${edadSemanas} semanas) lleva ${diasSinRecoleccion} días sin recolección de huevos. Programa la recolección pronto para evitar pérdidas.`,
        icon: 'egg',
        data: { 
          loteId, 
          loteName, 
          edadDias,
          edadSemanas,
          diasSinRecoleccion,
          tipoAve: TipoAve.PONEDORA.toString(),
          fase: 'PLENA_ADVERTENCIA'
        },
        sendPush: true,
      });
    }
  }
};

/**
 * Verificar y crear alertas de mortalidad
 */
export const checkMortalityAlerts = async (
  loteId: string,
  loteName: string,
  tipoAve: TipoAve,
  cantidadInicial: number,
  muertes: number
): Promise<void> => {
  if (!isAuthenticated()) {
    return;
  }

  const tasaMortalidad = (muertes / cantidadInicial) * 100;
  const thresholds = WELFARE_THRESHOLDS.MORTALIDAD;

  // EMERGENCIA: Mortalidad crítica
  if (tasaMortalidad >= thresholds.TASA_EMERGENCIA) {
    console.error(`🚨 EMERGENCIA MORTALIDAD: Lote ${loteName} tiene ${tasaMortalidad.toFixed(1)}% de mortalidad`);
    
    await createNotification({
      type: NotificationType.MORTALIDAD_ALTA,
      category: NotificationCategory.PRODUCTION,
      priority: NotificationPriority.CRITICAL,
      title: `🚨 EMERGENCIA: Mortalidad crítica`,
      message: `El lote "${loteName}" tiene una mortalidad del ${tasaMortalidad.toFixed(1)}% (${muertes} de ${cantidadInicial} aves). Esto es CRÍTICO y requiere atención veterinaria INMEDIATA. Revisa condiciones sanitarias, ventilación, alimentación y agua.`,
      icon: 'alert',
      data: { 
        loteId, 
        loteName, 
        tipoAve: tipoAve.toString(),
        percentage: tasaMortalidad,
        muertes,
        cantidadInicial
      },
      sendPush: true,
    });
    return;
  }

  // ADVERTENCIA: Mortalidad preocupante
  if (tasaMortalidad >= thresholds.TASA_ADVERTENCIA) {
    console.warn(`⚠️ ADVERTENCIA MORTALIDAD: Lote ${loteName} tiene ${tasaMortalidad.toFixed(1)}% de mortalidad`);
    
    await createNotification({
      type: NotificationType.MORTALIDAD_ALTA,
      category: NotificationCategory.PRODUCTION,
      priority: NotificationPriority.HIGH,
      title: `⚠️ Atención: Mortalidad elevada`,
      message: `El lote "${loteName}" tiene una mortalidad del ${tasaMortalidad.toFixed(1)}% (${muertes} de ${cantidadInicial} aves). Monitorea de cerca y considera revisar condiciones del lote y consultar con un veterinario.`,
      icon: 'alert-circle',
      data: { 
        loteId, 
        loteName, 
        tipoAve: tipoAve.toString(),
        percentage: tasaMortalidad,
        muertes,
        cantidadInicial
      },
      sendPush: true,
    });
  }
};

/**
 * Monitoreo completo de bienestar animal para un lote
 */
export const monitorLoteWelfare = async (
  lote: any,
  weightInfo?: {
    diasSinPesar: number;
    nuncaPesado: boolean;
    edadDias: number;
  },
  eggInfo?: {
    diasSinRecoleccion: number;
    nuncaRecolectado: boolean;
  },
  mortalityInfo?: {
    muertes: number;
  }
): Promise<void> => {
  console.log(`🐔 Monitoreando bienestar del lote: ${lote.nombre}`);

  try {
    // Monitorear pesaje
    if (weightInfo) {
      await checkWeightAlerts(
        lote.id,
        lote.nombre,
        lote.tipo || lote.tipoAve,
        weightInfo.diasSinPesar,
        weightInfo.nuncaPesado,
        weightInfo.edadDias
      );
    }

    // Monitorear producción de huevos (solo ponedoras)
    if (eggInfo && (lote.tipo === TipoAve.PONEDORA || lote.tipoAve === TipoAve.PONEDORA)) {
      // Calcular edad del lote
      const now = new Date();
      const fechaNacimiento = lote.fechaNacimiento?.toDate ? 
        lote.fechaNacimiento.toDate() : 
        new Date(lote.fechaNacimiento);
      const edadDias = Math.floor((now.getTime() - fechaNacimiento.getTime()) / (1000 * 60 * 60 * 24));
      
      await checkEggProductionAlerts(
        lote.id,
        lote.nombre,
        edadDias,
        eggInfo.diasSinRecoleccion,
        eggInfo.nuncaRecolectado
      );
    }

    // Monitorear mortalidad
    if (mortalityInfo) {
      await checkMortalityAlerts(
        lote.id,
        lote.nombre,
        lote.tipo || lote.tipoAve,
        lote.cantidadInicial,
        mortalityInfo.muertes
      );
    }

    console.log(`✅ Monitoreo completado para lote: ${lote.nombre}`);
  } catch (error) {
    console.error(`❌ Error monitoreando bienestar del lote ${lote.nombre}:`, error);
  }
};

/**
 * Ejecutar monitoreo automático para todos los lotes activos
 * Esta función debe ser llamada periódicamente (por ejemplo, cada hora)
 */
export const runAutomaticWelfareCheck = async (
  lotes: any[],
  registrosPeso: any[],
  registrosHuevos: any[],
  registrosMortalidad: any[]
): Promise<void> => {
  if (!isAuthenticated()) {
    console.warn('🚨 runAutomaticWelfareCheck: Usuario no autenticado');
    return;
  }

  console.log(`🐔 Iniciando monitoreo automático de bienestar para ${lotes.length} lotes`);
  
  const now = new Date();
  
  for (const lote of lotes) {
    // Solo monitorear lotes activos
    if (lote.estado !== 'ACTIVO') continue;

    // Calcular edad del lote
    const fechaNacimiento = lote.fechaNacimiento?.toDate ? 
      lote.fechaNacimiento.toDate() : 
      new Date(lote.fechaNacimiento);
    const edadDias = Math.floor((now.getTime() - fechaNacimiento.getTime()) / (1000 * 60 * 60 * 24));

    // Información de pesaje
    const pesosLote = registrosPeso.filter(p => p.loteId === lote.id);
    const weightInfo = {
      diasSinPesar: 0,
      nuncaPesado: pesosLote.length === 0,
      edadDias
    };

    if (!weightInfo.nuncaPesado) {
      const ultimoPeso = pesosLote.sort((a, b) => 
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      )[0];
      weightInfo.diasSinPesar = Math.floor(
        (now.getTime() - new Date(ultimoPeso.fecha).getTime()) / (1000 * 60 * 60 * 24)
      );
    } else {
      weightInfo.diasSinPesar = edadDias;
    }

    // Información de huevos (solo ponedoras)
    let eggInfo = undefined;
    if (lote.tipo === TipoAve.PONEDORA || lote.tipoAve === TipoAve.PONEDORA) {
      const huevosLote = registrosHuevos.filter(h => h.loteId === lote.id);
      eggInfo = {
        diasSinRecoleccion: 0,
        nuncaRecolectado: huevosLote.length === 0
      };

      if (!eggInfo.nuncaRecolectado) {
        const ultimaRecoleccion = huevosLote.sort((a, b) => 
          new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        )[0];
        eggInfo.diasSinRecoleccion = Math.floor(
          (now.getTime() - new Date(ultimaRecoleccion.fecha).getTime()) / (1000 * 60 * 60 * 24)
        );
      }
    }

    // Información de mortalidad
    const muertesLote = registrosMortalidad
      .filter(m => m.loteId === lote.id)
      .reduce((sum, m) => sum + m.cantidad, 0);
    const mortalityInfo = {
      muertes: muertesLote
    };

    // Ejecutar monitoreo
    await monitorLoteWelfare(lote, weightInfo, eggInfo, mortalityInfo);
  }

  console.log(`✅ Monitoreo automático completado para ${lotes.length} lotes`);
};

