/**
 * Tipos relacionados con el cálculo de costos de producción de huevos
 * Maneja las dos fases de costos de gallinas ponedoras según requerimientos del cliente
 */

import { CategoriaGasto } from './enums';
import { Gasto } from './gastos/gasto';

/**
 * Enum para las fases de costo de gallinas ponedoras
 */
export enum FaseCosto {
  INICIAL = 'inicial',      // Desde nacimiento hasta inicio de postura
  PRODUCTIVA = 'productiva' // Durante la etapa de producción de huevos
}

/**
 * Interface para el cálculo diario de costo por huevo
 */
export interface CostoProduccionDiario {
  fecha: Date;
  loteId: string;
  cantidadHuevos: number;           // Huevos producidos ese día
  gastosDelDia: GastoProductivo[];  // Gastos de mantenimiento del día
  gastoTotalDelDia: number;         // Suma de todos los gastos del día
  costoPorHuevo: number;            // Gasto total ÷ cantidad de huevos
}

/**
 * Interface para gastos en la fase productiva
 */
export interface GastoProductivo {
  id: string;
  loteId: string;
  fecha: Date;
  articuloNombre: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
  categoria: CategoriaGasto;
  descripcion?: string;
  // Campos adicionales para identificar gastos de fase productiva
  faseProductiva: true;
}

/**
 * Interface para el análisis de costos por fases
 */
export interface AnalisisCostroPorFases {
  loteId: string;
  
  // Fase Inicial (Costo de crianza hasta producción)
  faseInicial: {
    costoTotal: number;
    costoUnitario: number;      // Costo total ÷ número de gallinas
    fechaInicio: Date;
    fechaFinalizacion?: Date;   // Cuando empezaron a poner huevos
    duracionDias: number;
    gastosDetalle: Gasto[];
  };
  
  // Fase Productiva (Costo de mantenimiento diario)
  faseProductiva: {
    fechaInicioProduccion: Date;
    diasEnProduccion: number;
    huevosTotalesProducidos: number;
    gastoTotalMantenimiento: number;
    costoPromedioPorHuevo: number;
    costosDetalleDiario: CostoProduccionDiario[];
    
    // Métricas adicionales
    mejorDiaCosto: CostoProduccionDiario;  // Día con menor costo por huevo
    peorDiaCosto: CostoProduccionDiario;   // Día con mayor costo por huevo
  };
  
  // Métricas combinadas
  costoTotalLote: number;        // Fase inicial + fase productiva
  costoPromedioIntegral: number; // Costo total ÷ huevos producidos
  rentabilidad: number;          // (Ingresos - costos) ÷ costos * 100
}

/**
 * Interface para estadísticas de rendimiento del lote en producción
 */
export interface EstadisticasRendimientoHuevos {
  loteId: string;
  periodoAnalisis: {
    fechaInicio: Date;
    fechaFin: Date;
    dias: number;
  };
  
  // Producción
  huevosTotales: number;
  promedioHuevosPorDia: number;
  promedioHuevosPorGallina: number;
  
  // Costos
  gastoTotalPeriodo: number;
  gastoPromedioPorDia: number;
  costoPromedioPorHuevo: number;
  
  // Eficiencia
  eficienciaProduccion: number;    // Huevos reales / huevos teóricos
  tendenciaCosto: 'INCREMENTO' | 'DECREMENTO' | 'ESTABLE';
  
  // Alertas y recomendaciones
  alertas: AlertaCostoHuevo[];
}

/**
 * Interface para alertas relacionadas con costos de huevos
 */
export interface AlertaCostoHuevo {
  tipo: 'COSTO_ALTO' | 'BAJA_PRODUCCION' | 'INEFICIENCIA' | 'INCREMENTO_GASTOS';
  mensaje: string;
  severidad: 'INFO' | 'WARNING' | 'CRITICAL';
  fecha: Date;
  valorActual: number;
  valorReferencia: number;
  accionRecomendada: string;
}

/**
 * Interface para configuración de análisis de costos
 */
export interface ConfiguracionAnalisisCostos {
  // Umbrales para alertas
  costoMaximoPorHuevo: number;
  eficienciaMinima: number;
  incrementoMaximoCosto: number; // Porcentaje máximo de incremento diario
  
  // Configuración de cálculos
  considerarFinasDeSemana: boolean;
  incluirGastosIndirectos: boolean;
  factorDepreciacionEquipo: number;
}

/**
 * Interface para el reporte de costos de producción
 */
export interface ReporteCostosProduccion {
  loteId: string;
  nombreLote: string;
  fechaGeneracion: Date;
  
  resumenEjecutivo: {
    costoPorHuevoActual: number;
    eficienciaGeneral: number;
    rentabilidadPorcentaje: number;
    recomendacionPrincipal: string;
  };
  
  analisisPorFases: AnalisisCostroPorFases;
  estadisticasRendimiento: EstadisticasRendimientoHuevos;
  
  // Comparativas
  comparativaConOtrosLotes?: {
    posicionRanking: number;
    totalLotes: number;
    mejorLote: { id: string; costoPorHuevo: number };
    promedioGeneral: number;
  };
  
  // Proyecciones
  proyeccionesFuturas: {
    costosEstimados30Dias: number;
    huevosEstimados30Dias: number;
    rentabilidadEstimada: number;
  };
}















