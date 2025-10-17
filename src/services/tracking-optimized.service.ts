/**
 * Servicio optimizado para rastrear registros de peso y producción de huevos
 * Usa datos de los stores en lugar de hacer consultas directas a Firestore
 */

import { TipoAve } from '../types/enums';
import { isAuthenticated } from './auth.service';
import { PesoRegistro } from '../types/pesoRegistro';
import { HuevoRegistro } from '../types/ponedoras/HuevoRegistro';

export interface WeightTrackingInfo {
  loteId: string;
  loteName: string;
  tipoAve: TipoAve;
  lastWeightDate: Date | null;
  diasSinPesar: number;
  nuncanPesado: boolean;
  estadoPesaje: 'normal' | 'advertencia' | 'emergencia';
}

export interface EggTrackingInfo {
  loteId: string;
  loteName: string;
  lastCollectionDate: Date | null;
  diasSinRecoleccion: number;
  nuncaRecolectado: boolean;
  estadoRecoleccion: 'normal' | 'advertencia' | 'emergencia';
}

export interface AlertSummary {
  totalAlertas: number;
  emergencias: number;
  advertencias: number;
  pesajeEmergencias: number;
  pesajeAdvertencias: number;
  recoleccionEmergencias: number;
  recoleccionAdvertencias: number;
}

/**
 * Obtener información de pesaje para lotes usando datos del store
 */
export const getWeightTrackingInfoFromStore = (
  lotes: any[],
  tipoAve: TipoAve.POLLO_ENGORDE | TipoAve.POLLO_LEVANTE,
  registrosPeso: PesoRegistro[]
): WeightTrackingInfo[] => {
  // Verificar autenticación antes de proceder
  if (!isAuthenticated()) {
    console.warn('⚖️ getWeightTrackingInfoFromStore: Usuario no autenticado');
    return [];
  }

  console.log(`⚖️ Procesando tracking para ${lotes.length} lotes de ${tipoAve}`);
  console.log(`⚖️ Registros de peso disponibles: ${registrosPeso.length}`);

  const trackingInfo: WeightTrackingInfo[] = [];
  const now = new Date();

  for (const lote of lotes) {
    try {
      // Obtener registros de peso para este lote específico
      const registrosLote = registrosPeso
        .filter(registro => {
          const matches = registro.loteId === lote.id && registro.tipoLote === tipoAve;
          if (matches) {
            console.log(`⚖️ Registro encontrado para lote ${lote.id}:`, {
              fecha: registro.fecha,
              pesoPromedio: registro.pesoPromedio
            });
          }
          return matches;
        })
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      
      let lastWeightDate: Date | null = null;
      let nuncanPesado = true;
      
      if (registrosLote.length > 0) {
        lastWeightDate = new Date(registrosLote[0].fecha);
        nuncanPesado = false;
        console.log(`⚖️ Último peso para lote ${lote.id}:`, lastWeightDate);
      } else {
        console.log(`⚖️ No hay registros de peso para lote ${lote.id}`);
      }

      // Calcular días sin pesar
      let diasSinPesar: number;
      if (nuncanPesado) {
        // Si nunca ha sido pesado, contar desde fechaNacimiento
        const fechaNacimiento = lote.fechaNacimiento?.toDate ? 
          lote.fechaNacimiento.toDate() : 
          new Date(lote.fechaNacimiento);
        diasSinPesar = Math.floor((now.getTime() - fechaNacimiento.getTime()) / (1000 * 60 * 60 * 24));
      } else {
        diasSinPesar = Math.floor((now.getTime() - lastWeightDate!.getTime()) / (1000 * 60 * 60 * 24));
      }

      // Determinar estado de pesaje
      let estadoPesaje: 'normal' | 'advertencia' | 'emergencia';
      
      if (nuncanPesado) {
        if (diasSinPesar <= 3) {
          estadoPesaje = 'normal'; // Lote muy joven
        } else if (diasSinPesar <= 7) {
          estadoPesaje = 'advertencia'; // Ya debería haber sido pesado
        } else {
          estadoPesaje = 'emergencia'; // Urgente pesar
        }
      } else {
        if (diasSinPesar <= 7) {
          estadoPesaje = 'normal';
        } else if (diasSinPesar <= 10) {
          estadoPesaje = 'advertencia';
        } else {
          estadoPesaje = 'emergencia';
        }
      }

      trackingInfo.push({
        loteId: lote.id,
        loteName: lote.nombre,
        tipoAve,
        lastWeightDate,
        diasSinPesar,
        nuncanPesado,
        estadoPesaje
      });

      console.log(`⚖️ Tracking para lote ${lote.nombre}:`, {
        diasSinPesar,
        nuncanPesado,
        estadoPesaje
      });

    } catch (error) {
      console.error(`Error obteniendo tracking de peso para lote ${lote.id}:`, error);
      trackingInfo.push({
        loteId: lote.id,
        loteName: lote.nombre,
        tipoAve,
        lastWeightDate: null,
        diasSinPesar: 0,
        nuncanPesado: true,
        estadoPesaje: 'normal'
      });
    }
  }

  console.log(`⚖️ Tracking info generado para ${trackingInfo.length} lotes`);
  return trackingInfo;
};

/**
 * Obtener información de recolección de huevos usando datos del store
 */
export const getEggTrackingInfoFromStore = (
  lotes: any[],
  registrosHuevos: HuevoRegistro[]
): EggTrackingInfo[] => {
  // Verificar autenticación antes de proceder
  if (!isAuthenticated()) {
    console.warn('🥚 getEggTrackingInfoFromStore: Usuario no autenticado');
    return [];
  }

  console.log(`🥚 Procesando tracking para ${lotes.length} lotes ponedoras`);
  console.log(`🥚 Registros de huevos disponibles: ${registrosHuevos.length}`);

  const trackingInfo: EggTrackingInfo[] = [];
  const now = new Date();

  for (const lote of lotes) {
    try {
      // Obtener registros de huevos para este lote específico
      const registrosLote = registrosHuevos
        .filter(registro => {
          const matches = registro.loteId === lote.id;
          if (matches) {
            console.log(`🥚 Registro encontrado para lote ${lote.id}:`, {
              fecha: registro.fecha,
              cantidad: registro.cantidad
            });
          }
          return matches;
        })
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      
      let lastCollectionDate: Date | null = null;
      let nuncaRecolectado = true;
      
      if (registrosLote.length > 0) {
        lastCollectionDate = new Date(registrosLote[0].fecha);
        nuncaRecolectado = false;
        console.log(`🥚 Última recolección para lote ${lote.id}:`, lastCollectionDate);
      } else {
        console.log(`🥚 No hay registros de recolección para lote ${lote.id}`);
      }

      // Calcular días sin recolección
      let diasSinRecoleccion: number;
      if (nuncaRecolectado) {
        // Si nunca ha sido recolectado, contar desde fechaInicio
        const fechaInicio = lote.fechaInicio?.toDate ? 
          lote.fechaInicio.toDate() : 
          new Date(lote.fechaInicio);
        diasSinRecoleccion = Math.floor((now.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24));
      } else {
        diasSinRecoleccion = Math.floor((now.getTime() - lastCollectionDate!.getTime()) / (1000 * 60 * 60 * 24));
      }

      // Determinar estado de recolección
      let estadoRecoleccion: 'normal' | 'advertencia' | 'emergencia';
      
      // Calcular edad del lote en semanas para determinar si ya deberían estar poniendo
      const fechaNacimiento = lote.fechaNacimiento?.toDate ? 
        lote.fechaNacimiento.toDate() : 
        new Date(lote.fechaNacimiento);
      const edadSemanas = Math.floor((now.getTime() - fechaNacimiento.getTime()) / (1000 * 60 * 60 * 24 * 7));
      
      if (nuncaRecolectado) {
        if (edadSemanas < 18) {
          estadoRecoleccion = 'normal'; // Muy jóvenes para poner huevos
        } else if (edadSemanas < 22) {
          estadoRecoleccion = 'advertencia'; // Deberían empezar a poner
        } else {
          estadoRecoleccion = 'emergencia'; // Definitivamente deberían estar poniendo
        }
      } else {
        if (diasSinRecoleccion <= 2) {
          estadoRecoleccion = 'normal';
        } else if (diasSinRecoleccion <= 5) {
          estadoRecoleccion = 'advertencia';
        } else {
          estadoRecoleccion = 'emergencia';
        }
      }

      trackingInfo.push({
        loteId: lote.id,
        loteName: lote.nombre,
        lastCollectionDate,
        diasSinRecoleccion,
        nuncaRecolectado,
        estadoRecoleccion
      });

      console.log(`🥚 Tracking para lote ${lote.nombre}:`, {
        diasSinRecoleccion,
        nuncaRecolectado,
        estadoRecoleccion,
        edadSemanas
      });

    } catch (error) {
      console.error(`Error obteniendo tracking de huevos para lote ${lote.id}:`, error);
      trackingInfo.push({
        loteId: lote.id,
        loteName: lote.nombre,
        lastCollectionDate: null,
        diasSinRecoleccion: 0,
        nuncaRecolectado: true,
        estadoRecoleccion: 'normal'
      });
    }
  }

  console.log(`🥚 Tracking info generado para ${trackingInfo.length} lotes`);
  return trackingInfo;
};

/**
 * Obtener resumen de alertas usando datos de los stores
 */
export const getAlertSummaryFromStore = (
  ponedorasLotes: any[],
  levantesLotes: any[],
  engordeLotes: any[],
  registrosPeso: PesoRegistro[],
  registrosHuevos: HuevoRegistro[]
): AlertSummary => {
  // Verificar autenticación antes de proceder
  if (!isAuthenticated()) {
    console.warn('📊 getAlertSummaryFromStore: Usuario no autenticado');
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
    const weightTrackingLevantes = getWeightTrackingInfoFromStore(levantesLotes, TipoAve.POLLO_LEVANTE, registrosPeso);
    const weightTrackingEngorde = getWeightTrackingInfoFromStore(engordeLotes, TipoAve.POLLO_ENGORDE, registrosPeso);
    const eggTracking = getEggTrackingInfoFromStore(ponedorasLotes, registrosHuevos);

    // Contar alertas de peso
    let pesajeEmergencias = 0;
    let pesajeAdvertencias = 0;

    [...weightTrackingLevantes, ...weightTrackingEngorde].forEach(info => {
      if (info.estadoPesaje === 'emergencia') {
        pesajeEmergencias++;
      } else if (info.estadoPesaje === 'advertencia') {
        pesajeAdvertencias++;
      }
    });

    // Contar alertas de recolección
    let recoleccionEmergencias = 0;
    let recoleccionAdvertencias = 0;

    eggTracking.forEach(info => {
      if (info.estadoRecoleccion === 'emergencia') {
        recoleccionEmergencias++;
      } else if (info.estadoRecoleccion === 'advertencia') {
        recoleccionAdvertencias++;
      }
    });

    const emergencias = pesajeEmergencias + recoleccionEmergencias;
    const advertencias = pesajeAdvertencias + recoleccionAdvertencias;
    const totalAlertas = emergencias + advertencias;

    console.log('📊 Resumen de alertas:', {
      totalAlertas,
      emergencias,
      advertencias,
      pesajeEmergencias,
      pesajeAdvertencias,
      recoleccionEmergencias,
      recoleccionAdvertencias
    });

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
    console.error('Error al calcular resumen de alertas:', error);
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






























