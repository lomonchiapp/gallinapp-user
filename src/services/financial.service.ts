/**
 * Servicio para cálculos financieros y estadísticas de ganancias
 */

import { Farm } from '../types/farm';
import { getFarmConfig } from '../utils/farmConfig';
import { obtenerEstadisticasGastos } from './gastos.service';
import { obtenerRegistrosMortalidad } from './mortality.service';
import { obtenerRegistrosHuevos } from './ponedoras.service';

export interface EstadisticasFinancieras {
  // Ingresos
  ingresosPonedoras: number;
  ingresosEngorde: number;
  ingresosIsraelies: number;
  ingresosTotal: number;
  
  // Gastos
  gastosPonedoras: number;
  gastosEngorde: number;
  gastosIsraelies: number;
  gastosTotal: number;
  
  // Ganancias
  gananciasPonedoras: number;
  gananciasEngorde: number;
  gananciasIsraelies: number;
  gananciasTotal: number;
  
  // Métricas
  margenGanancia: number; // Porcentaje
  retornoInversion: number; // Porcentaje
  
  // Producción
  huevosTotales: number;
  pollosVendidos: number;
  israeliesVendidos: number;
  
  // Mortalidad
  muertesTotales: number;
  tasaMortalidad: number; // Porcentaje
}

export interface EstadisticasLote {
  loteId: string;
  tipoLote: 'ponedoras' | 'engorde' | 'israelies';
  nombre: string;
  
  // Producción
  produccionTotal: number; // huevos, peso, o unidades
  produccionPromedio: number;
  
  // Financiero
  ingresos: number;
  gastos: number;
  ganancias: number;
  margenGanancia: number;
  
  // Mortalidad
  muertes: number;
  tasaMortalidad: number;
  
  // Eficiencia
  costoPorUnidad: number; // costo por huevo, libra, o pollo
  ingresoPorUnidad: number;
  
  fechaInicio: Date;
  diasActivo: number;
}

/**
 * Calcular estadísticas financieras generales
 */
export const calcularEstadisticasFinancieras = async (
  farm: Farm | null,
  lotesPonedoras: any[],
  lotesEngorde: any[],
  lotesIsraelies: any[]
): Promise<EstadisticasFinancieras> => {
  try {
    const config = getFarmConfig(farm);
    
    // Calcular ingresos de ponedoras
    let ingresosPonedoras = 0;
    let huevosTotales = 0;
    
    for (const lote of lotesPonedoras) {
      const registrosHuevos = await obtenerRegistrosHuevos(lote.id);
      const huevosLote = registrosHuevos.reduce((total, registro) => total + registro.cantidad, 0);
      huevosTotales += huevosLote;
      ingresosPonedoras += huevosLote * config.defaultEggPrice;
    }
    
    // Calcular ingresos de engorde basado en peso estimado y precio por libra
    let ingresosEngorde = 0;
    for (const lote of lotesEngorde) {
      // Calcular peso total estimado del lote (peso promedio * cantidad actual)
      const pesoPromedioLbs = lote.pesoPromedio || 0; // Ya está en libras
      const pesoTotalEstimado = pesoPromedioLbs * lote.cantidadActual;
      ingresosEngorde += pesoTotalEstimado * config.defaultChickenPricePerPound;
    }
    
    // Calcular ingresos potenciales de levantes (israelíes) basado en precio unitario
    let ingresosIsraelies = 0;
    for (const lote of lotesIsraelies) {
      // Los levantes se venden por unidad completa
      ingresosIsraelies += lote.cantidadActual * config.defaultLevantePricePerUnit;
    }
    
    const ingresosTotal = ingresosPonedoras + ingresosEngorde + ingresosIsraelies;
    
    // Calcular gastos por tipo de lote
    const estadisticasGastos = await obtenerEstadisticasGastos();
    const gastosPonedoras = estadisticasGastos.ponedoras || 0;
    const gastosEngorde = estadisticasGastos.engorde || 0;
    const gastosIsraelies = estadisticasGastos.israelies || 0;
    const gastosTotal = estadisticasGastos.total || 0;
    
    // Calcular ganancias
    const gananciasPonedoras = ingresosPonedoras - gastosPonedoras;
    const gananciasEngorde = ingresosEngorde - gastosEngorde;
    const gananciasIsraelies = ingresosIsraelies - gastosIsraelies;
    const gananciasTotal = ingresosTotal - gastosTotal;
    
    // Calcular métricas
    const margenGanancia = ingresosTotal > 0 ? (gananciasTotal / ingresosTotal) * 100 : 0;
    const retornoInversion = gastosTotal > 0 ? (gananciasTotal / gastosTotal) * 100 : 0;
    
    // Calcular mortalidad total
    let muertesTotales = 0;
    let avesTotales = 0;
    
    for (const lote of [...lotesPonedoras, ...lotesEngorde, ...lotesIsraelies]) {
      // Usar el tipo del lote directamente (ya es TipoAve enum)
      const tipoLote = lote.tipo;
      const registrosMortalidad = await obtenerRegistrosMortalidad(lote.id, tipoLote);
      const muertesLote = registrosMortalidad.reduce((total, registro) => total + registro.cantidad, 0);
      muertesTotales += muertesLote;
      // Usar cantidadInicial si existe, sino cantidadActual
      avesTotales += lote.cantidadInicial || lote.cantidadActual || 0;
    }
    
    const tasaMortalidad = avesTotales > 0 ? (muertesTotales / avesTotales) * 100 : 0;
    
    return {
      // Ingresos
      ingresosPonedoras,
      ingresosEngorde,
      ingresosIsraelies,
      ingresosTotal,
      
      // Gastos
      gastosPonedoras,
      gastosEngorde,
      gastosIsraelies,
      gastosTotal,
      
      // Ganancias
      gananciasPonedoras,
      gananciasEngorde,
      gananciasIsraelies,
      gananciasTotal,
      
      // Métricas
      margenGanancia,
      retornoInversion,
      
      // Producción
      huevosTotales,
      pollosVendidos: 0, // Placeholder
      israeliesVendidos: 0, // Placeholder
      
      // Mortalidad
      muertesTotales,
      tasaMortalidad,
    };
  } catch (error) {
    console.error('Error al calcular estadísticas financieras:', error);
    throw error;
  }
};

/**
 * Calcular estadísticas detalladas de un lote específico
 */
export const calcularEstadisticasLote = async (
  lote: any,
  config: AppConfig
): Promise<EstadisticasLote> => {
  try {
    const tipoLote = lote.tipo === 'gallina_ponedora' ? 'ponedoras' : 
                   lote.tipo === 'pollo_engorde' ? 'engorde' : 'israelies';
    
    // Calcular producción según tipo de lote
    let produccionTotal = 0;
    let ingresos = 0;
    
    if (tipoLote === 'ponedoras') {
      const registrosHuevos = await obtenerRegistrosHuevos(lote.id);
      produccionTotal = registrosHuevos.reduce((total, registro) => total + registro.cantidad, 0);
      ingresos = produccionTotal * config.precioHuevo;
    }
    // TODO: Implementar para engorde e israelíes
    
    // Calcular gastos del lote
    const estadisticasGastos = await obtenerEstadisticasGastos();
    const gastos = 0; // Implementar obtención de gastos por lote específico
    
    // Calcular mortalidad
    const registrosMortalidad = await obtenerRegistrosMortalidad(lote.id, tipoLote);
    const muertes = registrosMortalidad.reduce((total, registro) => total + registro.cantidad, 0);
    const cantidadInicial = lote.cantidadInicial || lote.cantidadActual || 0;
    const tasaMortalidad = cantidadInicial > 0 ? (muertes / cantidadInicial) * 100 : 0;
    
    // Calcular métricas
    const ganancias = ingresos - gastos;
    const margenGanancia = ingresos > 0 ? (ganancias / ingresos) * 100 : 0;
    
    // Calcular días activo
    const fechaInicio = new Date(lote.fechaInicio);
    const diasActivo = Math.floor((Date.now() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calcular promedios
    const produccionPromedio = diasActivo > 0 ? produccionTotal / diasActivo : 0;
    const costoPorUnidad = produccionTotal > 0 ? gastos / produccionTotal : 0;
    const ingresoPorUnidad = produccionTotal > 0 ? ingresos / produccionTotal : 0;
    
    return {
      loteId: lote.id,
      tipoLote,
      nombre: lote.nombre,
      
      // Producción
      produccionTotal,
      produccionPromedio,
      
      // Financiero
      ingresos,
      gastos,
      ganancias,
      margenGanancia,
      
      // Mortalidad
      muertes,
      tasaMortalidad,
      
      // Eficiencia
      costoPorUnidad,
      ingresoPorUnidad,
      
      fechaInicio,
      diasActivo,
    };
  } catch (error) {
    console.error('Error al calcular estadísticas del lote:', error);
    throw error;
  }
};


























