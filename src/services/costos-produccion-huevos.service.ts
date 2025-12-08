/**
 * Servicio para calcular costos de producción de huevos
 * Incluye costos heredados de levante y costos de producción
 */

import { TipoAve } from '../types/enums';
import { LotePonedora } from '../types/ponedoras/lotePonedora';
import { obtenerGastos } from './gastos.service';
import { obtenerLotePonedora } from './ponedoras.service';
import { obtenerRegistrosProduccionPorLote } from './ponedoras.service';
import {
  CostoProduccionDiario,
  AnalisisCostroPorFases,
  EstadisticasRendimientoHuevos,
  ReporteCostosProduccion,
  GastoProductivo,
  AlertaCostoHuevo
} from '../types/costosProduccionHuevos';
import { CategoriaGasto } from '../types/enums';

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
    const gastosProduccion = await obtenerGastos(lote.id!, TipoAve.PONEDORA);
    const costoTotalProduccion = gastosProduccion.reduce((sum, gasto) => sum + gasto.total, 0);
    // CPU se calcula con cantidadInicial, no cantidadActual (no debe cambiar al vender aves)
    const costoPorAveProduccion = lote.cantidadInicial > 0 
      ? costoTotalProduccion / lote.cantidadInicial 
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
    // Los días se calculan basándose en medianoche (00:00), no en 24 horas exactas
    const fechaNacimiento = new Date(lote.fechaNacimiento);
    const fechaNacimientoMidnight = new Date(fechaNacimiento);
    fechaNacimientoMidnight.setHours(0, 0, 0, 0);
    
    const ahora = new Date();
    const ahoraMidnight = new Date(ahora);
    ahoraMidnight.setHours(0, 0, 0, 0);
    
    const edadEnDias = Math.floor(
      (ahoraMidnight.getTime() - fechaNacimientoMidnight.getTime()) / (1000 * 60 * 60 * 24)
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
    // Los días se calculan basándose en medianoche (00:00), no en 24 horas exactas
    const fechaNacimiento = new Date(lote.fechaNacimiento);
    const fechaNacimientoMidnight = new Date(fechaNacimiento);
    fechaNacimientoMidnight.setHours(0, 0, 0, 0);
    
    const ahora = new Date();
    const ahoraMidnight = new Date(ahora);
    ahoraMidnight.setHours(0, 0, 0, 0);
    
    const edadEnDias = Math.floor(
      (ahoraMidnight.getTime() - fechaNacimientoMidnight.getTime()) / (1000 * 60 * 60 * 24)
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

/**
 * Clase servicio para costos de producción de huevos
 * Implementa todos los métodos necesarios para el cálculo de costos
 */
class CostosProduccionHuevosService {
  /**
   * Calcula el costo de producción diario para una fecha específica
   */
  async calcularCostoProduccionDiario(
    loteId: string,
    fecha: Date = new Date()
  ): Promise<CostoProduccionDiario> {
    try {
      console.log(`💰 Calculando costo de producción diario para lote ${loteId} en fecha ${fecha.toISOString()}`);
      
      // Obtener el lote
      const lote = await obtenerLotePonedora(loteId);
      if (!lote) {
        throw new Error(`Lote ${loteId} no encontrado`);
      }

      // Obtener gastos del día específico
      const gastosDelDia = await this.obtenerGastosDelDia(loteId, fecha);
      
      // Obtener producción del día
      const registrosDelDia = await this.obtenerProduccionDelDia(loteId, fecha);
      const cantidadHuevos = registrosDelDia.reduce((total, registro) => {
        return total + 
          (registro.cantidadHuevosPequenos || 0) +
          (registro.cantidadHuevosMedianos || 0) +
          (registro.cantidadHuevosGrandes || 0) +
          (registro.cantidadHuevosExtraGrandes || 0);
      }, 0);

      // Calcular gasto total del día
      const gastoTotalDelDia = gastosDelDia.reduce((sum, gasto) => sum + gasto.total, 0);

      // Calcular costo por huevo (gasto total ÷ cantidad de huevos)
      const costoPorHuevo = cantidadHuevos > 0 
        ? gastoTotalDelDia / cantidadHuevos 
        : 0;

      return {
        fecha,
        loteId,
        cantidadHuevos,
        gastosDelDia,
        gastoTotalDelDia,
        costoPorHuevo
      };
    } catch (error) {
      console.error('Error al calcular costo de producción diario:', error);
      throw error;
    }
  }

  /**
   * Obtiene los gastos de un día específico para un lote
   */
  private async obtenerGastosDelDia(loteId: string, fecha: Date): Promise<GastoProductivo[]> {
    try {
      const gastos = await obtenerGastos(loteId, TipoAve.PONEDORA);
      
      // Filtrar gastos del día específico
      const fechaInicio = new Date(fecha);
      fechaInicio.setHours(0, 0, 0, 0);
      const fechaFin = new Date(fecha);
      fechaFin.setHours(23, 59, 59, 999);

      return gastos
        .filter(gasto => {
          const gastoFecha = gasto.fecha instanceof Date ? gasto.fecha : new Date(gasto.fecha);
          return gastoFecha >= fechaInicio && gastoFecha <= fechaFin;
        })
        .map(gasto => ({
          id: gasto.id,
          loteId: gasto.loteId,
          fecha: gasto.fecha instanceof Date ? gasto.fecha : new Date(gasto.fecha),
          articuloNombre: gasto.articuloNombre || '',
          cantidad: gasto.cantidad || 0,
          precioUnitario: gasto.precioUnitario || 0,
          total: gasto.total || 0,
          categoria: gasto.categoria || CategoriaGasto.OTHER,
          descripcion: gasto.descripcion,
          faseProductiva: true as const
        }));
    } catch (error) {
      console.error('Error al obtener gastos del día:', error);
      return [];
    }
  }

  /**
   * Obtiene la producción de un día específico
   */
  private async obtenerProduccionDelDia(loteId: string, fecha: Date): Promise<any[]> {
    try {
      const registros = await obtenerRegistrosProduccionPorLote(loteId);
      
      // Filtrar registros del día específico
      const fechaInicio = new Date(fecha);
      fechaInicio.setHours(0, 0, 0, 0);
      const fechaFin = new Date(fecha);
      fechaFin.setHours(23, 59, 59, 999);

      return registros.filter(registro => {
        const registroFecha = registro.fecha instanceof Date ? registro.fecha : new Date(registro.fecha);
        return registroFecha >= fechaInicio && registroFecha <= fechaFin;
      });
    } catch (error) {
      console.error('Error al obtener producción del día:', error);
      return [];
    }
  }

  /**
   * Analiza los costos por fases (inicial y productiva)
   */
  async analizarCostoPorFases(loteId: string): Promise<AnalisisCostroPorFases> {
    try {
      console.log(`📊 Analizando costos por fases para lote ${loteId}`);
      
      const lote = await obtenerLotePonedora(loteId);
      if (!lote) {
        throw new Error(`Lote ${loteId} no encontrado`);
      }

      // Obtener todos los gastos
      const todosLosGastos = await obtenerGastos(loteId, TipoAve.PONEDORA);
      
      // Fecha de inicio de producción
      const fechaInicioProduccion = lote.fechaInicioProduccion || lote.fechaInicio;
      const fechaInicioProduccionDate = fechaInicioProduccion instanceof Date 
        ? fechaInicioProduccion 
        : new Date(fechaInicioProduccion);

      // Separar gastos por fase
      const gastosFaseInicial = todosLosGastos.filter(gasto => {
        const gastoFecha = gasto.fecha instanceof Date ? gasto.fecha : new Date(gasto.fecha);
        return gastoFecha < fechaInicioProduccionDate;
      });

      const gastosFaseProductiva = todosLosGastos.filter(gasto => {
        const gastoFecha = gasto.fecha instanceof Date ? gasto.fecha : new Date(gasto.fecha);
        return gastoFecha >= fechaInicioProduccionDate;
      });

      // Calcular costos fase inicial (incluye costos de levante si es transferido)
      const costoFaseInicial = lote.costosLevante?.total || 0;
      const costoFaseInicialGastos = gastosFaseInicial.reduce((sum, gasto) => sum + gasto.total, 0);
      const costoTotalFaseInicial = costoFaseInicial + costoFaseInicialGastos;
      const costoUnitarioFaseInicial = lote.cantidadInicial > 0 
        ? costoTotalFaseInicial / lote.cantidadInicial 
        : 0;

      // Calcular días de fase inicial
      const fechaNacimiento = new Date(lote.fechaNacimiento);
      const fechaNacimientoMidnight = new Date(fechaNacimiento);
      fechaNacimientoMidnight.setHours(0, 0, 0, 0);
      
      const fechaInicioProdMidnight = new Date(fechaInicioProduccionDate);
      fechaInicioProdMidnight.setHours(0, 0, 0, 0);
      
      const duracionFaseInicial = Math.floor(
        (fechaInicioProdMidnight.getTime() - fechaNacimientoMidnight.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Obtener producción total
      const registrosProduccion = await obtenerRegistrosProduccionPorLote(loteId);
      const huevosTotalesProducidos = registrosProduccion.reduce((total, registro) => {
        return total + 
          (registro.cantidadHuevosPequenos || 0) +
          (registro.cantidadHuevosMedianos || 0) +
          (registro.cantidadHuevosGrandes || 0) +
          (registro.cantidadHuevosExtraGrandes || 0);
      }, 0);

      // Calcular costos fase productiva
      const gastoTotalMantenimiento = gastosFaseProductiva.reduce((sum, gasto) => sum + gasto.total, 0);
      const costoPromedioPorHuevo = huevosTotalesProducidos > 0
        ? gastoTotalMantenimiento / huevosTotalesProducidos
        : 0;

      // Calcular días en producción
      const ahora = new Date();
      const ahoraMidnight = new Date(ahora);
      ahoraMidnight.setHours(0, 0, 0, 0);
      
      const diasEnProduccion = Math.floor(
        (ahoraMidnight.getTime() - fechaInicioProdMidnight.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Calcular costos diarios para encontrar mejor y peor día (limitado a 30 días)
      const costosDiarios: CostoProduccionDiario[] = [];
      const fechasUnicas = new Set<string>();
      
      registrosProduccion.forEach(registro => {
        const fechaRegistro = registro.fecha instanceof Date ? registro.fecha : new Date(registro.fecha);
        const fechaKey = fechaRegistro.toISOString().split('T')[0];
        if (!fechasUnicas.has(fechaKey)) {
          fechasUnicas.add(fechaKey);
        }
      });

      const fechasArray = Array.from(fechasUnicas).slice(0, 30);
      for (const fechaKey of fechasArray) {
        const fecha = new Date(fechaKey);
        try {
          const costoDiario = await this.calcularCostoProduccionDiario(loteId, fecha);
          costosDiarios.push(costoDiario);
        } catch (error) {
          console.warn(`Error calculando costo diario para ${fechaKey}:`, error);
        }
      }

      // Encontrar mejor y peor día
      const mejorDiaCosto = costosDiarios.length > 0
        ? costosDiarios.reduce((mejor, actual) => 
            actual.costoPorHuevo < mejor.costoPorHuevo ? actual : mejor
          )
        : {
            fecha: fechaInicioProduccionDate,
            loteId,
            cantidadHuevos: 0,
            gastosDelDia: [],
            gastoTotalDelDia: 0,
            costoPorHuevo: 0
          };

      const peorDiaCosto = costosDiarios.length > 0
        ? costosDiarios.reduce((peor, actual) => 
            actual.costoPorHuevo > peor.costoPorHuevo ? actual : peor
          )
        : mejorDiaCosto;

      // Calcular métricas combinadas
      const costoTotalLote = costoTotalFaseInicial + gastoTotalMantenimiento;
      const costoPromedioIntegral = huevosTotalesProducidos > 0
        ? costoTotalLote / huevosTotalesProducidos
        : 0;

      // Calcular rentabilidad (simplificado - necesitaría ingresos reales)
      const rentabilidad = 0; // TODO: Calcular con ingresos reales

      return {
        loteId,
        faseInicial: {
          costoTotal: costoTotalFaseInicial,
          costoUnitario: costoUnitarioFaseInicial,
          fechaInicio: fechaNacimiento,
          fechaFinalizacion: fechaInicioProduccionDate,
          duracionDias: duracionFaseInicial,
          gastosDetalle: gastosFaseInicial
        },
        faseProductiva: {
          fechaInicioProduccion: fechaInicioProduccionDate,
          diasEnProduccion,
          huevosTotalesProducidos,
          gastoTotalMantenimiento,
          costoPromedioPorHuevo,
          costosDetalleDiario: costosDiarios,
          mejorDiaCosto,
          peorDiaCosto
        },
        costoTotalLote,
        costoPromedioIntegral,
        rentabilidad
      };
    } catch (error) {
      console.error('Error al analizar costos por fases:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de rendimiento para un período específico
   */
  async obtenerEstadisticasRendimiento(
    loteId: string,
    fechaInicio: Date,
    fechaFin: Date
  ): Promise<EstadisticasRendimientoHuevos> {
    try {
      console.log(`📈 Obteniendo estadísticas de rendimiento para lote ${loteId}`);
      
      const lote = await obtenerLotePonedora(loteId);
      if (!lote) {
        throw new Error(`Lote ${loteId} no encontrado`);
      }

      // Obtener registros de producción en el período
      const todosLosRegistros = await obtenerRegistrosProduccionPorLote(loteId);
      const registrosPeriodo = todosLosRegistros.filter(registro => {
        const registroFecha = registro.fecha instanceof Date ? registro.fecha : new Date(registro.fecha);
        return registroFecha >= fechaInicio && registroFecha <= fechaFin;
      });

      // Calcular producción total
      const huevosTotales = registrosPeriodo.reduce((total, registro) => {
        return total + 
          (registro.cantidadHuevosPequenos || 0) +
          (registro.cantidadHuevosMedianos || 0) +
          (registro.cantidadHuevosGrandes || 0) +
          (registro.cantidadHuevosExtraGrandes || 0);
      }, 0);

      // Calcular días del período
      const dias = Math.floor((fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const promedioHuevosPorDia = dias > 0 ? huevosTotales / dias : 0;
      const promedioHuevosPorGallina = lote.cantidadActual > 0 
        ? huevosTotales / (lote.cantidadActual * dias) 
        : 0;

      // Obtener gastos del período
      const todosLosGastos = await obtenerGastos(loteId, TipoAve.PONEDORA);
      const gastosPeriodo = todosLosGastos.filter(gasto => {
        const gastoFecha = gasto.fecha instanceof Date ? gasto.fecha : new Date(gasto.fecha);
        return gastoFecha >= fechaInicio && gastoFecha <= fechaFin;
      });

      const gastoTotalPeriodo = gastosPeriodo.reduce((sum, gasto) => sum + gasto.total, 0);
      const gastoPromedioPorDia = dias > 0 ? gastoTotalPeriodo / dias : 0;
      const costoPromedioPorHuevo = huevosTotales > 0 
        ? gastoTotalPeriodo / huevosTotales 
        : 0;

      // Calcular eficiencia (simplificado)
      const eficienciaProduccion = 85; // TODO: Calcular con métricas reales

      // Calcular tendencia de costo (últimos 7 días)
      const costosDiarios: number[] = [];
      const fechasUnicas = new Set<string>();
      
      registrosPeriodo.forEach(registro => {
        const fechaRegistro = registro.fecha instanceof Date ? registro.fecha : new Date(registro.fecha);
        const fechaKey = fechaRegistro.toISOString().split('T')[0];
        if (!fechasUnicas.has(fechaKey)) {
          fechasUnicas.add(fechaKey);
        }
      });

      const fechasArray = Array.from(fechasUnicas).slice(0, 7);
      for (const fechaKey of fechasArray) {
        try {
          const fecha = new Date(fechaKey);
          const costoDiario = await this.calcularCostoProduccionDiario(loteId, fecha);
          costosDiarios.push(costoDiario.costoPorHuevo);
        } catch (error) {
          // Ignorar errores individuales
        }
      }

      let tendenciaCosto: 'INCREMENTO' | 'DECREMENTO' | 'ESTABLE' = 'ESTABLE';
      if (costosDiarios.length >= 2) {
        const primeros = costosDiarios.slice(0, Math.floor(costosDiarios.length / 2));
        const ultimos = costosDiarios.slice(Math.floor(costosDiarios.length / 2));
        const promedioPrimeros = primeros.reduce((a, b) => a + b, 0) / primeros.length;
        const promedioUltimos = ultimos.reduce((a, b) => a + b, 0) / ultimos.length;
        
        const diferencia = promedioUltimos - promedioPrimeros;
        const porcentajeCambio = promedioPrimeros > 0 ? (diferencia / promedioPrimeros) * 100 : 0;
        
        if (porcentajeCambio > 5) {
          tendenciaCosto = 'INCREMENTO';
        } else if (porcentajeCambio < -5) {
          tendenciaCosto = 'DECREMENTO';
        }
      }

      // Generar alertas
      const alertas = this.generarAlertas(
        costoPromedioPorHuevo,
        promedioHuevosPorDia,
        eficienciaProduccion,
        tendenciaCosto,
        lote.cantidadActual
      );

      return {
        loteId,
        periodoAnalisis: {
          fechaInicio,
          fechaFin,
          dias
        },
        huevosTotales,
        promedioHuevosPorDia,
        promedioHuevosPorGallina,
        gastoTotalPeriodo,
        gastoPromedioPorDia,
        costoPromedioPorHuevo,
        eficienciaProduccion,
        tendenciaCosto,
        alertas
      };
    } catch (error) {
      console.error('Error al obtener estadísticas de rendimiento:', error);
      throw error;
    }
  }

  /**
   * Genera alertas basadas en métricas de rendimiento
   */
  private generarAlertas(
    costoPromedioPorHuevo: number,
    promedioHuevosPorDia: number,
    eficienciaProduccion: number,
    tendenciaCosto: 'INCREMENTO' | 'DECREMENTO' | 'ESTABLE',
    cantidadGallinas: number
  ): AlertaCostoHuevo[] {
    const alertas: AlertaCostoHuevo[] = [];
    const ahora = new Date();

    // Alerta por costo alto
    if (costoPromedioPorHuevo > 5) {
      alertas.push({
        tipo: 'COSTO_ALTO',
        mensaje: `El costo por huevo (RD$${costoPromedioPorHuevo.toFixed(2)}) está por encima del umbral recomendado`,
        severidad: 'WARNING',
        fecha: ahora,
        valorActual: costoPromedioPorHuevo,
        valorReferencia: 5,
        accionRecomendada: 'Revisar gastos de alimentación y medicamentos'
      });
    }

    // Alerta por baja producción
    const produccionEsperadaPorGallina = 0.8;
    const produccionEsperadaTotal = cantidadGallinas * produccionEsperadaPorGallina;
    if (promedioHuevosPorDia < produccionEsperadaTotal * 0.7) {
      alertas.push({
        tipo: 'BAJA_PRODUCCION',
        mensaje: `La producción diaria (${promedioHuevosPorDia.toFixed(0)} huevos) está por debajo de lo esperado`,
        severidad: 'WARNING',
        fecha: ahora,
        valorActual: promedioHuevosPorDia,
        valorReferencia: produccionEsperadaTotal,
        accionRecomendada: 'Revisar salud del lote y condiciones ambientales'
      });
    }

    // Alerta por incremento de costos
    if (tendenciaCosto === 'INCREMENTO') {
      alertas.push({
        tipo: 'INCREMENTO_GASTOS',
        mensaje: 'Se detectó una tendencia de incremento en los costos diarios',
        severidad: 'INFO',
        fecha: ahora,
        valorActual: costoPromedioPorHuevo,
        valorReferencia: costoPromedioPorHuevo * 0.9,
        accionRecomendada: 'Monitorear gastos recientes y comparar con períodos anteriores'
      });
    }

    return alertas;
  }

  /**
   * Genera un reporte completo de costos de producción
   */
  async generarReporte(loteId: string): Promise<ReporteCostosProduccion> {
    try {
      console.log(`📄 Generando reporte de costos para lote ${loteId}`);
      
      const lote = await obtenerLotePonedora(loteId);
      if (!lote) {
        throw new Error(`Lote ${loteId} no encontrado`);
      }

      // Obtener análisis por fases
      const analisisPorFases = await this.analizarCostoPorFases(loteId);

      // Obtener estadísticas de rendimiento (últimos 30 días)
      const fechaFin = new Date();
      const fechaInicio = new Date();
      fechaInicio.setDate(fechaInicio.getDate() - 30);
      const estadisticasRendimiento = await this.obtenerEstadisticasRendimiento(
        loteId,
        fechaInicio,
        fechaFin
      );

      // Calcular costo actual por huevo
      const costoActual = await this.calcularCostoProduccionDiario(loteId);

      // Calcular rentabilidad (simplificado)
      const rentabilidadPorcentaje = 0; // TODO: Calcular con ingresos reales

      // Generar recomendación principal
      let recomendacionPrincipal = 'El lote está funcionando dentro de parámetros normales';
      if (costoActual.costoPorHuevo > 5) {
        recomendacionPrincipal = 'Se recomienda revisar los costos de producción, están por encima del umbral óptimo';
      } else if (estadisticasRendimiento.eficienciaProduccion < 70) {
        recomendacionPrincipal = 'La eficiencia de producción está baja, revisar condiciones del lote';
      }

      return {
        loteId,
        nombreLote: lote.nombre,
        fechaGeneracion: new Date(),
        resumenEjecutivo: {
          costoPorHuevoActual: costoActual.costoPorHuevo,
          eficienciaGeneral: estadisticasRendimiento.eficienciaProduccion,
          rentabilidadPorcentaje,
          recomendacionPrincipal
        },
        analisisPorFases,
        estadisticasRendimiento,
        proyeccionesFuturas: {
          costosEstimados30Dias: estadisticasRendimiento.gastoPromedioPorDia * 30,
          huevosEstimados30Dias: estadisticasRendimiento.promedioHuevosPorDia * 30,
          rentabilidadEstimada: 0 // TODO: Calcular con proyecciones reales
        }
      };
    } catch (error) {
      console.error('Error al generar reporte:', error);
      throw error;
    }
  }
}

// Exportar instancia del servicio
export const costosProduccionHuevosService = new CostosProduccionHuevosService();
