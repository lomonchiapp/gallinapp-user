/**
 * Servicio de predicciones de rendimiento usando algoritmos de Machine Learning simples
 */

import { PesoRegistro, TipoAve } from '../types';
import { calculateAgeInDays } from '../utils/dateUtils';
import { obtenerDatosComparativos } from './analytics.service';

export interface PredictionData {
  loteId: string;
  tipoAve: TipoAve;
  fechaNacimiento: Date;
  cantidadInicial: number;
  cantidadActual: number;
  registrosPeso: PesoRegistro[];
  registrosMortalidad: any[];
  gastoTotal: number;
}

export interface PredictionResult {
  pesoFinal: {
    valor: number;
    confianza: number;
    diasParaAlcanzar: number;
  };
  mortalidadEsperada: {
    valor: number;
    confianza: number;
    factoresRiesgo: string[];
  };
  rentabilidad: {
    ingresoEstimado: number;
    gananciaNeta: number;
    roi: number;
    confianza: number;
  };
  recomendaciones: {
    tipo: 'critico' | 'importante' | 'sugerencia';
    mensaje: string;
    accion: string;
  }[];
  fechaOptimaSalida: Date;
  eficienciaProyectada: number;
}

/**
 * Predictor de peso final usando regresión lineal simple
 */
class WeightPredictor {
  private slope: number = 0;
  private intercept: number = 0;
  private rSquared: number = 0;

  train(registrosPeso: PesoRegistro[]): void {
    if (registrosPeso.length < 2) return;

    // Ordenar por edad
    const datosOrdenados = registrosPeso
      .sort((a, b) => a.edadEnDias - b.edadEnDias)
      .map(r => ({ x: r.edadEnDias, y: r.pesoPromedio }));

    const n = datosOrdenados.length;
    const sumX = datosOrdenados.reduce((sum, point) => sum + point.x, 0);
    const sumY = datosOrdenados.reduce((sum, point) => sum + point.y, 0);
    const sumXY = datosOrdenados.reduce((sum, point) => sum + point.x * point.y, 0);
    const sumXX = datosOrdenados.reduce((sum, point) => sum + point.x * point.x, 0);

    // Calcular pendiente e intercepto
    this.slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    this.intercept = (sumY - this.slope * sumX) / n;

    // Calcular R²
    const yMean = sumY / n;
    const ssRes = datosOrdenados.reduce((sum, point) => {
      const predicted = this.slope * point.x + this.intercept;
      return sum + Math.pow(point.y - predicted, 2);
    }, 0);
    const ssTot = datosOrdenados.reduce((sum, point) => 
      sum + Math.pow(point.y - yMean, 2), 0
    );
    this.rSquared = 1 - (ssRes / ssTot);
  }

  predict(edad: number): { peso: number; confianza: number } {
    const peso = Math.max(0, this.slope * edad + this.intercept);
    const confianza = Math.max(0, Math.min(1, this.rSquared));
    return { peso, confianza };
  }

  getGrowthRate(): number {
    return this.slope;
  }
}

/**
 * Predictor de mortalidad usando análisis de tendencias
 */
class MortalityPredictor {
  private tasaPromedioDiaria: number = 0;
  private factoresRiesgo: string[] = [];

  train(
    cantidadInicial: number,
    cantidadActual: number,
    edadActual: number,
    registrosMortalidad: any[],
    tipoAve: TipoAve
  ): void {
    const mortalidadTotal = cantidadInicial - cantidadActual;
    this.tasaPromedioDiaria = edadActual > 0 ? mortalidadTotal / edadActual : 0;

    // Identificar factores de riesgo
    this.factoresRiesgo = [];
    const tasaMortalidad = (mortalidadTotal / cantidadInicial) * 100;

    if (tasaMortalidad > 10) {
      this.factoresRiesgo.push('Alta mortalidad histórica');
    }

    if (this.tasaPromedioDiaria > 0.5) {
      this.factoresRiesgo.push('Tendencia creciente de mortalidad');
    }

    // Factores específicos por tipo de ave
    if (tipoAve === TipoAve.POLLO_LEVANTE && edadActual > 35) {
      this.factoresRiesgo.push('Edad crítica para levante');
    }

    if (tipoAve === TipoAve.POLLO_ENGORDE && edadActual > 42) {
      this.factoresRiesgo.push('Edad avanzada para engorde');
    }
  }

  predict(diasFuturos: number): { mortalidad: number; confianza: number } {
    const mortalidadAdicional = this.tasaPromedioDiaria * diasFuturos;
    const confianza = this.factoresRiesgo.length === 0 ? 0.8 : 
                     this.factoresRiesgo.length <= 2 ? 0.6 : 0.4;

    return {
      mortalidad: Math.max(0, mortalidadAdicional),
      confianza
    };
  }

  getFactoresRiesgo(): string[] {
    return this.factoresRiesgo;
  }
}

/**
 * Predictor de rentabilidad
 */
class ProfitabilityPredictor {
  private costoPorKg: number = 0;
  private precioVentaEstimado: number = 0;

  train(tipoAve: TipoAve, gastoTotal: number, pesoTotal: number): void {
    // Estimar costo por kg basado en gastos actuales
    this.costoPorKg = pesoTotal > 0 ? gastoTotal / pesoTotal : 0;

    // Precios de venta estimados por tipo (en RD$ por kg)
    switch (tipoAve) {
      case TipoAve.POLLO_LEVANTE:
        this.precioVentaEstimado = 180; // RD$ por kg
        break;
      case TipoAve.POLLO_ENGORDE:
        this.precioVentaEstimado = 200; // RD$ por kg
        break;
      case TipoAve.PONEDORA:
        this.precioVentaEstimado = 250; // RD$ por ave (no por kg)
        break;
    }
  }

  predict(
    pesoFinalEstimado: number,
    cantidadFinal: number,
    gastosTotalesEstimados: number
  ): { ingreso: number; ganancia: number; roi: number; confianza: number } {
    const ingresoTotal = pesoFinalEstimado * cantidadFinal * this.precioVentaEstimado;
    const gananciaNeta = ingresoTotal - gastosTotalesEstimados;
    const roi = gastosTotalesEstimados > 0 ? (gananciaNeta / gastosTotalesEstimados) * 100 : 0;

    // Confianza basada en la estabilidad del mercado
    const confianza = 0.7; // 70% de confianza en predicciones de precio

    return {
      ingreso: ingresoTotal,
      ganancia: gananciaNeta,
      roi,
      confianza
    };
  }
}

/**
 * Función principal para generar predicciones
 */
export const generarPredicciones = async (data: PredictionData): Promise<PredictionResult> => {
  const {
    loteId,
    tipoAve,
    fechaNacimiento,
    cantidadInicial,
    cantidadActual,
    registrosPeso,
    registrosMortalidad,
    gastoTotal
  } = data;

  const edadActual = calculateAgeInDays(fechaNacimiento);
  
  // Obtener datos históricos para comparación
  const datosComparativos = await obtenerDatosComparativos(tipoAve, true);

  // Entrenar predictores
  const weightPredictor = new WeightPredictor();
  if (registrosPeso.length >= 2) {
    weightPredictor.train(registrosPeso);
  }

  const mortalityPredictor = new MortalityPredictor();
  mortalityPredictor.train(
    cantidadInicial,
    cantidadActual,
    edadActual,
    registrosMortalidad,
    tipoAve
  );

  const profitPredictor = new ProfitabilityPredictor();
  const pesoTotalActual = registrosPeso.reduce((sum, r) => sum + r.pesoTotal, 0);
  profitPredictor.train(tipoAve, gastoTotal, pesoTotalActual);

  // Determinar edad objetivo según tipo de ave
  let edadObjetivo = 42; // días
  switch (tipoAve) {
    case TipoAve.POLLO_LEVANTE:
      edadObjetivo = 42;
      break;
    case TipoAve.POLLO_ENGORDE:
      edadObjetivo = 45;
      break;
    case TipoAve.PONEDORA:
      edadObjetivo = 140; // 20 semanas
      break;
  }

  const diasRestantes = Math.max(0, edadObjetivo - edadActual);

  // Generar predicciones
  const pesoPrediccion = weightPredictor.predict(edadObjetivo);
  const mortalidadPrediccion = mortalityPredictor.predict(diasRestantes);

  const cantidadFinalEstimada = cantidadActual - mortalidadPrediccion.mortalidad;
  const gastosTotalesEstimados = gastoTotal * 1.5; // Estimar 50% más de gastos

  const rentabilidadPrediccion = profitPredictor.predict(
    pesoPrediccion.peso,
    cantidadFinalEstimada,
    gastosTotalesEstimados
  );

  // Generar recomendaciones
  const recomendaciones = generarRecomendaciones({
    edadActual,
    edadObjetivo,
    pesoActual: registrosPeso[0]?.pesoPromedio || 0,
    pesoObjetivo: pesoPrediccion.peso,
    tasaCrecimiento: weightPredictor.getGrowthRate(),
    factoresRiesgoMortalidad: mortalityPredictor.getFactoresRiesgo(),
    rentabilidadProyectada: rentabilidadPrediccion.roi,
    promedioMercado: datosComparativos.promedios
  });

  // Calcular fecha óptima de salida
  const fechaOptimaSalida = new Date(fechaNacimiento);
  fechaOptimaSalida.setDate(fechaOptimaSalida.getDate() + edadObjetivo);

  // Calcular eficiencia proyectada
  const eficienciaProyectada = calcularEficienciaProyectada({
    pesoFinal: pesoPrediccion.peso,
    diasTotal: edadObjetivo,
    tasaMortalidad: (mortalidadPrediccion.mortalidad / cantidadInicial) * 100,
    roi: rentabilidadPrediccion.roi
  });

  return {
    pesoFinal: {
      valor: pesoPrediccion.peso,
      confianza: pesoPrediccion.confianza,
      diasParaAlcanzar: diasRestantes
    },
    mortalidadEsperada: {
      valor: mortalidadPrediccion.mortalidad,
      confianza: mortalidadPrediccion.confianza,
      factoresRiesgo: mortalityPredictor.getFactoresRiesgo()
    },
    rentabilidad: {
      ingresoEstimado: rentabilidadPrediccion.ingreso,
      gananciaNeta: rentabilidadPrediccion.ganancia,
      roi: rentabilidadPrediccion.roi,
      confianza: rentabilidadPrediccion.confianza
    },
    recomendaciones,
    fechaOptimaSalida,
    eficienciaProyectada
  };
};

/**
 * Generar recomendaciones basadas en las predicciones
 */
function generarRecomendaciones(params: {
  edadActual: number;
  edadObjetivo: number;
  pesoActual: number;
  pesoObjetivo: number;
  tasaCrecimiento: number;
  factoresRiesgoMortalidad: string[];
  rentabilidadProyectada: number;
  promedioMercado: any;
}): PredictionResult['recomendaciones'] {
  const recomendaciones: PredictionResult['recomendaciones'] = [];

  // Recomendaciones de crecimiento
  if (params.tasaCrecimiento < 0.04) {
    recomendaciones.push({
      tipo: 'importante',
      mensaje: 'Tasa de crecimiento por debajo del promedio',
      accion: 'Revisar calidad del alimento y programa nutricional'
    });
  }

  // Recomendaciones de mortalidad
  if (params.factoresRiesgoMortalidad.length > 0) {
    recomendaciones.push({
      tipo: 'critico',
      mensaje: 'Factores de riesgo de mortalidad detectados',
      accion: 'Implementar medidas sanitarias preventivas inmediatas'
    });
  }

  // Recomendaciones de rentabilidad
  if (params.rentabilidadProyectada < 15) {
    recomendaciones.push({
      tipo: 'importante',
      mensaje: 'ROI proyectado por debajo del objetivo (15%)',
      accion: 'Optimizar costos de alimentación y reducir desperdicios'
    });
  }

  // Recomendaciones de timing
  const diasRestantes = params.edadObjetivo - params.edadActual;
  if (diasRestantes < 7 && params.pesoActual >= params.pesoObjetivo * 0.9) {
    recomendaciones.push({
      tipo: 'sugerencia',
      mensaje: 'El lote está cerca del peso objetivo',
      accion: 'Considerar adelantar la venta para optimizar rentabilidad'
    });
  }

  return recomendaciones;
}

/**
 * Calcular eficiencia proyectada del lote
 */
function calcularEficienciaProyectada(params: {
  pesoFinal: number;
  diasTotal: number;
  tasaMortalidad: number;
  roi: number;
}): number {
  // Fórmula de eficiencia que considera múltiples factores
  const factorPeso = Math.min(1, params.pesoFinal / 2.5); // Normalizado a 2.5kg máximo
  const factorTiempo = Math.min(1, 50 / params.diasTotal); // Normalizado a 50 días
  const factorMortalidad = Math.max(0, 1 - params.tasaMortalidad / 100);
  const factorRentabilidad = Math.min(1, Math.max(0, params.roi / 100));

  return (factorPeso * 0.3 + factorTiempo * 0.2 + factorMortalidad * 0.3 + factorRentabilidad * 0.2) * 100;
}





































