/**
 * Servicio para calcular costos de producción de huevos
 * Incluye costos heredados de levante y costos de producción
 */

import { TipoAve } from '../types/enums';
import { LotePonedora } from '../types/ponedoras/lotePonedora';
import { obtenerGastosPorLote } from './gastos.service';

/**
 * Desglose detallado de costos
 */
export interface DesgloseCostos {
  // Costos de levante (heredados)
  costosLevante: {
    total: number;
    porAve: number;
    porcentaje: number;
  };
  // Costos de producción (desde que empezó a poner)
  costosProduccion: {
    total: number;
    porAve: number;
    porcentaje: number;
  };
  // Totales
  costoTotalPorAve: number;
  costoTotalLote: number;
}

/**
 * Costo por huevo con desglose
 */
export interface CostoPorHuevo {
  // Costo total por huevo
  costoTotal: number;
  // Desglose
  costoLevante: number;      // Parte del costo de levante amortizado
  costoProduccion: number;   // Costo de producción por huevo
  // Información adicional
  totalHuevosProducidos: number;
  edadLoteEnSemanas: number;
  diasEnProduccion: number;
}

/**
 * Calcula el desglose completo de costos de un lote de ponedoras
 */
export const calcularDesgloseCostos = async (
  lote: LotePonedora
): Promise<DesgloseCostos> => {
  try {
    // 1. Costos de levante (si existen)
    const costosLevante = lote.costosLevante || {
      total: 0,
      porAve: 0,
      fechaInicio: lote.fechaInicio,
      fechaFin: lote.fechaInicio,
      cantidadInicial: lote.cantidadInicial,
      cantidadTransferida: lote.cantidadInicial,
    };

    // 2. Costos de producción (desde que empezó a poner)
    const gastosProduccion = await obtenerGastosPorLote(lote.id!, TipoAve.PONEDORA);
    const costoTotalProduccion = gastosProduccion.reduce((sum, gasto) => sum + gasto.total, 0);
    const costoPorAveProduccion = lote.cantidadActual > 0 
      ? costoTotalProduccion / lote.cantidadActual 
      : 0;

    // 3. Calcular totales
    const costoTotalLote = costosLevante.total + costoTotalProduccion;
    const costoTotalPorAve = costosLevante.porAve + costoPorAveProduccion;

    // 4. Calcular porcentajes
    const porcentajeLevante = costoTotalLote > 0 
      ? (costosLevante.total / costoTotalLote) * 100 
      : 0;
    const porcentajeProduccion = costoTotalLote > 0 
      ? (costoTotalProduccion / costoTotalLote) * 100 
      : 0;

    return {
      costosLevante: {
        total: costosLevante.total,
        porAve: costosLevante.porAve,
        porcentaje: porcentajeLevante,
      },
      costosProduccion: {
        total: costoTotalProduccion,
        porAve: costoPorAveProduccion,
        porcentaje: porcentajeProduccion,
      },
      costoTotalPorAve,
      costoTotalLote,
    };
  } catch (error) {
    console.error('Error al calcular desglose de costos:', error);
    throw error;
  }
};

/**
 * Calcula el costo por huevo producido
 */
export const calcularCostoPorHuevo = async (
  lote: LotePonedora,
  totalHuevosProducidos: number
): Promise<CostoPorHuevo> => {
  try {
    if (totalHuevosProducidos === 0) {
      return {
        costoTotal: 0,
        costoLevante: 0,
        costoProduccion: 0,
        totalHuevosProducidos: 0,
        edadLoteEnSemanas: 0,
        diasEnProduccion: 0,
      };
    }

    // Obtener desglose de costos
    const desglose = await calcularDesgloseCostos(lote);

    // Calcular días en producción
    const fechaInicio = lote.fechaInicioProduccion || lote.fechaInicio;
    const diasEnProduccion = Math.floor(
      (new Date().getTime() - new Date(fechaInicio).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calcular edad del lote en semanas
    const edadEnDias = Math.floor(
      (new Date().getTime() - new Date(lote.fechaNacimiento).getTime()) / (1000 * 60 * 60 * 24)
    );
    const edadEnSemanas = Math.floor(edadEnDias / 7);

    // Amortizar costos de levante sobre todos los huevos producidos
    const costoLevanteTotal = desglose.costosLevante.total;
    const costoLevanteAmortizadoPorHuevo = costoLevanteTotal / totalHuevosProducidos;

    // Costo de producción por huevo
    const costoProduccionPorHuevo = desglose.costosProduccion.total / totalHuevosProducidos;

    // Costo total por huevo
    const costoTotalPorHuevo = costoLevanteAmortizadoPorHuevo + costoProduccionPorHuevo;

    return {
      costoTotal: costoTotalPorHuevo,
      costoLevante: costoLevanteAmortizadoPorHuevo,
      costoProduccion: costoProduccionPorHuevo,
      totalHuevosProducidos,
      edadLoteEnSemanas: edadEnSemanas,
      diasEnProduccion,
    };
  } catch (error) {
    console.error('Error al calcular costo por huevo:', error);
    throw error;
  }
};

/**
 * Calcula el punto de equilibrio (cuántos huevos se necesitan para cubrir costos de levante)
 */
export const calcularPuntoEquilibrio = async (
  lote: LotePonedora,
  precioVentaHuevo: number
): Promise<{
  huevosNecesarios: number;
  huevosProducidos: number;
  alcanzado: boolean;
  porcentajeAlcanzado: number;
  ingresosNecesarios: number;
  ingresosActuales: number;
}> => {
  try {
    const desglose = await calcularDesgloseCostos(lote);
    
    // Huevos necesarios para cubrir costos de levante
    const huevosNecesarios = Math.ceil(desglose.costosLevante.total / precioVentaHuevo);
    
    // Obtener producción actual (esto debería venir de registros de producción)
    // Por ahora usamos un placeholder
    const huevosProducidos = 0; // TODO: Obtener de registros de producción
    
    const alcanzado = huevosProducidos >= huevosNecesarios;
    const porcentajeAlcanzado = huevosNecesarios > 0 
      ? (huevosProducidos / huevosNecesarios) * 100 
      : 0;
    
    return {
      huevosNecesarios,
      huevosProducidos,
      alcanzado,
      porcentajeAlcanzado: Math.min(porcentajeAlcanzado, 100),
      ingresosNecesarios: desglose.costosLevante.total,
      ingresosActuales: huevosProducidos * precioVentaHuevo,
    };
  } catch (error) {
    console.error('Error al calcular punto de equilibrio:', error);
    throw error;
  }
};

/**
 * Genera un reporte completo de costos para un lote de ponedoras
 */
export interface ReporteCostosLote {
  lote: {
    id: string;
    nombre: string;
    esTransferido: boolean;
    edadEnSemanas: number;
    diasEnProduccion: number;
  };
  desgloseCostos: DesgloseCostos;
  costoPorHuevo: CostoPorHuevo | null;
  puntoEquilibrio: Awaited<ReturnType<typeof calcularPuntoEquilibrio>> | null;
  recomendaciones: string[];
}

export const generarReporteCostos = async (
  lote: LotePonedora,
  totalHuevosProducidos: number,
  precioVentaHuevo: number
): Promise<ReporteCostosLote> => {
  try {
    const desgloseCostos = await calcularDesgloseCostos(lote);
    
    const costoPorHuevo = totalHuevosProducidos > 0
      ? await calcularCostoPorHuevo(lote, totalHuevosProducidos)
      : null;
    
    const puntoEquilibrio = precioVentaHuevo > 0
      ? await calcularPuntoEquilibrio(lote, precioVentaHuevo)
      : null;

    // Calcular edad
    const edadEnDias = Math.floor(
      (new Date().getTime() - new Date(lote.fechaNacimiento).getTime()) / (1000 * 60 * 60 * 24)
    );
    const edadEnSemanas = Math.floor(edadEnDias / 7);

    const fechaInicio = lote.fechaInicioProduccion || lote.fechaInicio;
    const diasEnProduccion = Math.floor(
      (new Date().getTime() - new Date(fechaInicio).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Generar recomendaciones
    const recomendaciones: string[] = [];

    if (lote.esTransferido && desgloseCostos.costosLevante.porcentaje > 60) {
      recomendaciones.push('Los costos de levante representan más del 60% del costo total. Considera optimizar la fase de levante.');
    }

    if (costoPorHuevo && costoPorHuevo.costoTotal > precioVentaHuevo) {
      recomendaciones.push(`⚠️ El costo por huevo (RD$${costoPorHuevo.costoTotal.toFixed(2)}) es mayor al precio de venta (RD$${precioVentaHuevo.toFixed(2)}). Revisa tus costos.`);
    }

    if (puntoEquilibrio && !puntoEquilibrio.alcanzado) {
      recomendaciones.push(`Necesitas producir ${puntoEquilibrio.huevosNecesarios - puntoEquilibrio.huevosProducidos} huevos más para cubrir los costos de levante.`);
    }

    if (edadEnSemanas > 80) {
      recomendaciones.push('El lote tiene más de 80 semanas. Considera evaluar si es rentable mantenerlo en producción.');
    }

    return {
      lote: {
        id: lote.id!,
        nombre: lote.nombre,
        esTransferido: lote.esTransferido || false,
        edadEnSemanas,
        diasEnProduccion,
      },
      desgloseCostos,
      costoPorHuevo,
      puntoEquilibrio,
      recomendaciones,
    };
  } catch (error) {
    console.error('Error al generar reporte de costos:', error);
    throw error;
  }
};
