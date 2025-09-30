/**
 * Servicio para rastrear registros de peso y producción de huevos
 * Versión optimizada que usa los stores en lugar de consultas directas
 */

import { TipoAve } from '../types/enums';
import { isAuthenticated } from './auth.service';
import { PesoRegistro } from '../types/pesoRegistro';
import { HuevoRegistro } from '../types/ponedoras/HuevoRegistro';

export interface WeightTrackingInfo {
  loteId: string;
  loteName: string;
  tipoAve: TipoAve;
  fechaNacimiento: Date;
  diasSinPesar: number;
  ultimoPesaje?: Date;
  nuncanPesado: boolean;
  estadoPesaje: 'normal' | 'advertencia' | 'emergencia';
}

export interface EggTrackingInfo {
  loteId: string;
  loteName: string;
  fechaInicio: Date;
  diasSinRecoleccion: number;
  ultimaRecoleccion?: Date;
  nuncaRecolectado: boolean;
  estadoRecoleccion: 'normal' | 'advertencia' | 'emergencia';
}

/**
 * Obtener información de pesaje para lotes de engorde y levantes
 */
export const getWeightTrackingInfo = async (
  lotes: any[],
  tipoAve: TipoAve.POLLO_ENGORDE | TipoAve.POLLO_LEVANTE
): Promise<WeightTrackingInfo[]> => {
  // Verificar autenticación antes de proceder
  if (!isAuthenticated()) {
    console.warn('⚖️ getWeightTrackingInfo: Usuario no autenticado');
    return [];
  }

  const trackingInfo: WeightTrackingInfo[] = [];
  const now = new Date();

  for (const lote of lotes) {
    try {
      // Obtener el último registro de peso para este lote
      const pesoQuery = query(
        collection(db, 'registrosPeso'),
        where('loteId', '==', lote.id),
        orderBy('fechaRegistro', 'desc')
      );

      const pesoSnapshot = await getDocs(pesoQuery);
      const ultimoPesoDoc = pesoSnapshot.docs[0];
      const ultimoPesaje = ultimoPesoDoc?.data()?.fechaRegistro?.toDate();

      // Calcular días desde el nacimiento
      const fechaNacimiento = lote.fechaNacimiento?.toDate ? 
        lote.fechaNacimiento.toDate() : 
        new Date(lote.fechaNacimiento);
      
      const diasDesdeNacimiento = Math.floor(
        (now.getTime() - fechaNacimiento.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Calcular días sin pesar
      let diasSinPesar: number;
      let nuncanPesado = false;

      if (ultimoPesaje) {
        diasSinPesar = Math.floor(
          (now.getTime() - ultimoPesaje.getTime()) / (1000 * 60 * 60 * 24)
        );
      } else {
        // Nunca ha sido pesado, contar desde el nacimiento
        diasSinPesar = diasDesdeNacimiento;
        nuncanPesado = true;
      }

      // Determinar estado de pesaje
      let estadoPesaje: 'normal' | 'advertencia' | 'emergencia';
      
      if (diasDesdeNacimiento < 3) {
        // Los primeros 3 días es normal no pesar
        estadoPesaje = 'normal';
      } else if (diasSinPesar >= 7) {
        // Más de 7 días sin pesar = emergencia
        estadoPesaje = 'emergencia';
      } else if (diasSinPesar >= 5) {
        // 5-6 días sin pesar = advertencia
        estadoPesaje = 'advertencia';
      } else {
        estadoPesaje = 'normal';
      }

      trackingInfo.push({
        loteId: lote.id,
        loteName: lote.nombre,
        tipoAve,
        fechaNacimiento,
        diasSinPesar,
        ultimoPesaje,
        nuncanPesado,
        estadoPesaje,
      });
    } catch (error) {
      console.error(`Error al obtener info de pesaje para lote ${lote.id}:`, error);
    }
  }

  return trackingInfo;
};

/**
 * Obtener información de recolección de huevos para lotes de ponedoras
 */
export const getEggTrackingInfo = async (lotes: any[]): Promise<EggTrackingInfo[]> => {
  // Verificar autenticación antes de proceder
  if (!isAuthenticated()) {
    console.warn('🥚 getEggTrackingInfo: Usuario no autenticado');
    return [];
  }

  const trackingInfo: EggTrackingInfo[] = [];
  const now = new Date();

  for (const lote of lotes) {
    try {
      // Obtener el último registro de huevos para este lote
      const huevosQuery = query(
        collection(db, 'registrosProduccion'),
        where('loteId', '==', lote.id),
        orderBy('fecha', 'desc')
      );

      const huevosSnapshot = await getDocs(huevosQuery);
      const ultimoHuevoDoc = huevosSnapshot.docs[0];
      const ultimaRecoleccion = ultimoHuevoDoc?.data()?.fecha?.toDate();

      // Calcular días desde el inicio del lote
      const fechaInicio = lote.fechaInicio?.toDate ? 
        lote.fechaInicio.toDate() : 
        new Date(lote.fechaInicio);
      
      const diasDesdeInicio = Math.floor(
        (now.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Calcular días sin recolección
      let diasSinRecoleccion: number;
      let nuncaRecolectado = false;

      if (ultimaRecoleccion) {
        diasSinRecoleccion = Math.floor(
          (now.getTime() - ultimaRecoleccion.getTime()) / (1000 * 60 * 60 * 24)
        );
      } else {
        // Nunca ha sido recolectado, contar desde el inicio
        diasSinRecoleccion = diasDesdeInicio;
        nuncaRecolectado = true;
      }

      // Determinar estado de recolección
      let estadoRecoleccion: 'normal' | 'advertencia' | 'emergencia';
      
      if (diasDesdeInicio < 21) {
        // Las primeras 3 semanas es normal no tener producción
        estadoRecoleccion = 'normal';
      } else if (diasSinRecoleccion >= 3) {
        // Más de 3 días sin recolectar = emergencia
        estadoRecoleccion = 'emergencia';
      } else if (diasSinRecoleccion >= 2) {
        // 2 días sin recolectar = advertencia
        estadoRecoleccion = 'advertencia';
      } else {
        estadoRecoleccion = 'normal';
      }

      trackingInfo.push({
        loteId: lote.id,
        loteName: lote.nombre,
        fechaInicio,
        diasSinRecoleccion,
        ultimaRecoleccion,
        nuncaRecolectado,
        estadoRecoleccion,
      });
    } catch (error) {
      console.error(`Error al obtener info de recolección para lote ${lote.id}:`, error);
    }
  }

  return trackingInfo;
};

/**
 * Obtener resumen de alertas para mostrar en el header
 */
export interface AlertSummary {
  totalAlertas: number;
  emergencias: number;
  advertencias: number;
  pesajeEmergencias: number;
  pesajeAdvertencias: number;
  recoleccionEmergencias: number;
  recoleccionAdvertencias: number;
}

export const getAlertSummary = async (
  ponedorasLotes: any[],
  levantesLotes: any[],
  engordeLotes: any[]
): Promise<AlertSummary> => {
  // Verificar autenticación antes de proceder
  if (!isAuthenticated()) {
    console.warn('📊 getAlertSummary: Usuario no autenticado');
    return {
      totalAlertas: 0,
      emergencias: 0,
      advertencias: 0,
      pesajeEmergencias: 0,
      pesajeAdvertencias: 0,
      recoleccionEmergencias: 0,
      recoleccionAdvertencias: 0,
    };
  }

  try {
    const [
      weightTrackingLevantes,
      weightTrackingEngorde,
      eggTracking
    ] = await Promise.all([
      getWeightTrackingInfo(levantesLotes, TipoAve.POLLO_LEVANTE),
      getWeightTrackingInfo(engordeLotes, TipoAve.POLLO_ENGORDE),
      getEggTrackingInfo(ponedorasLotes)
    ]);

    const allWeightTracking = [...weightTrackingLevantes, ...weightTrackingEngorde];

    const pesajeEmergencias = allWeightTracking.filter(w => w.estadoPesaje === 'emergencia').length;
    const pesajeAdvertencias = allWeightTracking.filter(w => w.estadoPesaje === 'advertencia').length;
    
    const recoleccionEmergencias = eggTracking.filter(e => e.estadoRecoleccion === 'emergencia').length;
    const recoleccionAdvertencias = eggTracking.filter(e => e.estadoRecoleccion === 'advertencia').length;

    const emergencias = pesajeEmergencias + recoleccionEmergencias;
    const advertencias = pesajeAdvertencias + recoleccionAdvertencias;
    const totalAlertas = emergencias + advertencias;

    return {
      totalAlertas,
      emergencias,
      advertencias,
      pesajeEmergencias,
      pesajeAdvertencias,
      recoleccionEmergencias,
      recoleccionAdvertencias,
    };
  } catch (error) {
    console.error('Error al obtener resumen de alertas:', error);
    return {
      totalAlertas: 0,
      emergencias: 0,
      advertencias: 0,
      pesajeEmergencias: 0,
      pesajeAdvertencias: 0,
      recoleccionEmergencias: 0,
      recoleccionAdvertencias: 0,
    };
  }
};
