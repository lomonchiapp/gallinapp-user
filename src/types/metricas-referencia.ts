/**
 * Tipos para métricas de referencia y benchmarks
 */

import { TipoAve } from './enums';

/**
 * Métrica de peso por edad para una raza específica
 */
export interface PesoReferencia {
  edad: number; // días
  pesoPromedio: number; // gramos o libras
  pesoMinimo?: number;
  pesoMaximo?: number;
}

/**
 * Métrica de producción de huevos por edad
 */
export interface ProduccionHuevosReferencia {
  edad: number; // semanas
  tasaPostura: number; // porcentaje (0-100)
  huevosPorDia: number; // huevos por gallina por día
}

/**
 * Configuración de métricas para engorde
 */
export interface MetricasEngordeReferencia {
  id?: string;
  raza: string;
  pesosPorEdad: PesoReferencia[];
  conversionAlimenticia?: number; // kg alimento / kg peso ganado
  mortalidadEsperada?: number; // porcentaje
  edadSacrificio?: number; // días
  pesoObjetivoFinal?: number; // libras
  observaciones?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Configuración de métricas para levantes
 */
export interface MetricasLevantesReferencia {
  id?: string;
  raza: string;
  pesosPorEdad: PesoReferencia[];
  conversionAlimenticia?: number;
  mortalidadEsperada?: number;
  edadMadurezSexual?: number; // días
  pesoObjetivoVenta?: number; // libras
  observaciones?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Configuración de métricas para ponedoras
 */
export interface MetricasPonedorasReferencia {
  id?: string;
  raza: string;
  produccionPorEdad: ProduccionHuevosReferencia[];
  edadPrimerHuevo?: number; // semanas
  picoProduccion?: number; // semana en la que alcanza el pico
  tasaPicoProduccion?: number; // porcentaje
  mortalidadEsperada?: number;
  pesoPromedioGallina?: number; // libras
  observaciones?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Configuración completa de métricas de referencia
 */
export interface ConfiguracionMetricas {
  userId: string;
  engorde: MetricasEngordeReferencia[];
  levantes: MetricasLevantesReferencia[];
  ponedoras: MetricasPonedorasReferencia[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Resultado de comparación de desempeño
 */
export interface ComparacionDesempeno {
  loteId: string;
  tipoLote: TipoAve;
  raza: string;
  edadActual: number;
  
  // Peso
  pesoActual?: number;
  pesoEsperado?: number;
  desviacionPeso?: number; // porcentaje
  estadoPeso?: 'por_encima' | 'normal' | 'por_debajo';
  
  // Producción (para ponedoras)
  produccionActual?: number;
  produccionEsperada?: number;
  desviacionProduccion?: number;
  estadoProduccion?: 'por_encima' | 'normal' | 'por_debajo';
  
  // Mortalidad
  mortalidadActual?: number;
  mortalidadEsperada?: number;
  estadoMortalidad?: 'alta' | 'normal' | 'baja';
  
  // Evaluación general
  evaluacionGeneral: 'excelente' | 'bueno' | 'regular' | 'preocupante';
  recomendaciones: string[];
}

/**
 * Métricas estándar predefinidas por raza
 */
export const METRICAS_PREDEFINIDAS = {
  ENGORDE: {
    COBB: {
      raza: 'COBB 500',
      pesosPorEdad: [
        { edad: 7, pesoPromedio: 185, pesoMinimo: 165, pesoMaximo: 205 },
        { edad: 14, pesoPromedio: 475, pesoMinimo: 430, pesoMaximo: 520 },
        { edad: 21, pesoPromedio: 925, pesoMinimo: 860, pesoMaximo: 990 },
        { edad: 28, pesoPromedio: 1530, pesoMinimo: 1450, pesoMaximo: 1610 },
        { edad: 35, pesoPromedio: 2250, pesoMinimo: 2150, pesoMaximo: 2350 },
        { edad: 42, pesoPromedio: 3050, pesoMinimo: 2930, pesoMaximo: 3170 },
      ],
      conversionAlimenticia: 1.75,
      mortalidadEsperada: 4,
      edadSacrificio: 42,
      pesoObjetivoFinal: 6.7, // libras
    },
    ROSS_308: {
      raza: 'Ross 308',
      pesosPorEdad: [
        { edad: 7, pesoPromedio: 180, pesoMinimo: 160, pesoMaximo: 200 },
        { edad: 14, pesoPromedio: 465, pesoMinimo: 420, pesoMaximo: 510 },
        { edad: 21, pesoPromedio: 900, pesoMinimo: 840, pesoMaximo: 960 },
        { edad: 28, pesoPromedio: 1500, pesoMinimo: 1420, pesoMaximo: 1580 },
        { edad: 35, pesoPromedio: 2200, pesoMinimo: 2100, pesoMaximo: 2300 },
        { edad: 42, pesoPromedio: 3000, pesoMinimo: 2880, pesoMaximo: 3120 },
      ],
      conversionAlimenticia: 1.77,
      mortalidadEsperada: 4.5,
      edadSacrificio: 42,
      pesoObjetivoFinal: 6.6,
    },
  },
  PONEDORAS: {
    LOHMANN_BROWN: {
      raza: 'Lohmann Brown',
      produccionPorEdad: [
        { edad: 18, tasaPostura: 5, huevosPorDia: 0.05 },
        { edad: 20, tasaPostura: 50, huevosPorDia: 0.5 },
        { edad: 24, tasaPostura: 95, huevosPorDia: 0.95 },
        { edad: 28, tasaPostura: 96, huevosPorDia: 0.96 },
        { edad: 40, tasaPostura: 92, huevosPorDia: 0.92 },
        { edad: 60, tasaPostura: 85, huevosPorDia: 0.85 },
        { edad: 80, tasaPostura: 75, huevosPorDia: 0.75 },
      ],
      edadPrimerHuevo: 18,
      picoProduccion: 26,
      tasaPicoProduccion: 96,
      mortalidadEsperada: 5,
      pesoPromedioGallina: 4.2,
    },
    ISA_BROWN: {
      raza: 'Isa Brown',
      produccionPorEdad: [
        { edad: 18, tasaPostura: 5, huevosPorDia: 0.05 },
        { edad: 20, tasaPostura: 52, huevosPorDia: 0.52 },
        { edad: 24, tasaPostura: 94, huevosPorDia: 0.94 },
        { edad: 28, tasaPostura: 95, huevosPorDia: 0.95 },
        { edad: 40, tasaPostura: 91, huevosPorDia: 0.91 },
        { edad: 60, tasaPostura: 84, huevosPorDia: 0.84 },
        { edad: 80, tasaPostura: 73, huevosPorDia: 0.73 },
      ],
      edadPrimerHuevo: 18,
      picoProduccion: 27,
      tasaPicoProduccion: 95,
      mortalidadEsperada: 5,
      pesoPromedioGallina: 4.0,
    },
  },
  LEVANTES: {
    COBB: {
      raza: 'COBB 500',
      pesosPorEdad: [
        { edad: 7, pesoPromedio: 185, pesoMinimo: 165, pesoMaximo: 205 },
        { edad: 14, pesoPromedio: 475, pesoMinimo: 430, pesoMaximo: 520 },
        { edad: 21, pesoPromedio: 925, pesoMinimo: 860, pesoMaximo: 990 },
        { edad: 28, pesoPromedio: 1530, pesoMinimo: 1450, pesoMaximo: 1610 },
      ],
      conversionAlimenticia: 1.6,
      mortalidadEsperada: 3,
      edadMadurezSexual: 140,
      pesoObjetivoVenta: 4.5,
    },
  },
};



















