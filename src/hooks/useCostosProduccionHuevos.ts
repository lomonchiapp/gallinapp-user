/**
 * Hook personalizado para gestionar costos de producción de huevos
 * Proporciona funciones reactivas para calcular costos según las especificaciones del cliente
 */

import { useCallback, useEffect, useState } from 'react';
import { costosProduccionHuevosService } from '../services/costos-produccion-huevos.service';
import {
    AnalisisCostroPorFases,
    CostoProduccionDiario,
    EstadisticasRendimientoHuevos,
    ReporteCostosProduccion
} from '../types/costosProduccionHuevos';

interface UseCostosProduccionHuevosReturn {
  // Estados de datos
  costoDelDia: CostoProduccionDiario | null;
  analisisPorFases: AnalisisCostroPorFases | null;
  estadisticasRendimiento: EstadisticasRendimientoHuevos | null;
  reporte: ReporteCostosProduccion | null;
  
  // Estados de carga y errores
  isLoadingCostoDiario: boolean;
  isLoadingAnalisis: boolean;
  isLoadingEstadisticas: boolean;
  isLoadingReporte: boolean;
  error: string | null;
  
  // Funciones de cálculo
  calcularCostoDiario: (loteId: string, fecha?: Date) => Promise<void>;
  analizarCostoPorFases: (loteId: string) => Promise<void>;
  obtenerEstadisticasRendimiento: (loteId: string, dias?: number) => Promise<void>;
  generarReporte: (loteId: string) => Promise<void>;
  
  // Utilidades
  clearData: () => void;
  refetchAll: (loteId: string) => Promise<void>;
}

export const useCostosProduccionHuevos = (): UseCostosProduccionHuevosReturn => {
  // Estados de datos
  const [costoDelDia, setCostoDelDia] = useState<CostoProduccionDiario | null>(null);
  const [analisisPorFases, setAnalisisPorFases] = useState<AnalisisCostroPorFases | null>(null);
  const [estadisticasRendimiento, setEstadisticasRendimiento] = useState<EstadisticasRendimientoHuevos | null>(null);
  const [reporte, setReporte] = useState<ReporteCostosProduccion | null>(null);
  
  // Estados de carga
  const [isLoadingCostoDiario, setIsLoadingCostoDiario] = useState(false);
  const [isLoadingAnalisis, setIsLoadingAnalisis] = useState(false);
  const [isLoadingEstadisticas, setIsLoadingEstadisticas] = useState(false);
  const [isLoadingReporte, setIsLoadingReporte] = useState(false);
  
  // Estado de error
  const [error, setError] = useState<string | null>(null);

  /**
   * Calcula el costo de producción diario para una fecha específica
   */
  const calcularCostoDiario = useCallback(async (loteId: string, fecha: Date = new Date()) => {
    if (!loteId) {
      setError('ID del lote es requerido');
      return;
    }

    setIsLoadingCostoDiario(true);
    setError(null);

    try {
      const resultado = await costosProduccionHuevosService.calcularCostoProduccionDiario(loteId, fecha);
      setCostoDelDia(resultado);
      
      console.log('✅ Costo diario calculado:', resultado);
    } catch (err: any) {
      const errorMessage = err.message || 'Error al calcular costo diario';
      setError(errorMessage);
      console.error('❌ Error en calcularCostoDiario:', err);
    } finally {
      setIsLoadingCostoDiario(false);
    }
  }, []);

  /**
   * Realiza el análisis completo de costos por fases
   */
  const analizarCostoPorFases = useCallback(async (loteId: string) => {
    if (!loteId) {
      setError('ID del lote es requerido');
      return;
    }

    setIsLoadingAnalisis(true);
    setError(null);

    try {
      const resultado = await costosProduccionHuevosService.analizarCostoPorFases(loteId);
      setAnalisisPorFases(resultado);
      
      console.log('✅ Análisis por fases completado:', resultado);
    } catch (err: any) {
      const errorMessage = err.message || 'Error al analizar costos por fases';
      setError(errorMessage);
      console.error('❌ Error en analizarCostoPorFases:', err);
    } finally {
      setIsLoadingAnalisis(false);
    }
  }, []);

  /**
   * Obtiene estadísticas de rendimiento para un período específico
   */
  const obtenerEstadisticasRendimiento = useCallback(async (loteId: string, dias: number = 30) => {
    if (!loteId) {
      setError('ID del lote es requerido');
      return;
    }

    setIsLoadingEstadisticas(true);
    setError(null);

    try {
      const fechaFin = new Date();
      const fechaInicio = new Date();
      fechaInicio.setDate(fechaInicio.getDate() - dias);

      const resultado = await costosProduccionHuevosService.obtenerEstadisticasRendimiento(
        loteId, 
        fechaInicio, 
        fechaFin
      );
      setEstadisticasRendimiento(resultado);
      
      console.log('✅ Estadísticas de rendimiento obtenidas:', resultado);
    } catch (err: any) {
      const errorMessage = err.message || 'Error al obtener estadísticas de rendimiento';
      setError(errorMessage);
      console.error('❌ Error en obtenerEstadisticasRendimiento:', err);
    } finally {
      setIsLoadingEstadisticas(false);
    }
  }, []);

  /**
   * Genera un reporte completo de costos de producción
   */
  const generarReporte = useCallback(async (loteId: string) => {
    if (!loteId) {
      setError('ID del lote es requerido');
      return;
    }

    setIsLoadingReporte(true);
    setError(null);

    try {
      const resultado = await costosProduccionHuevosService.generarReporte(loteId);
      setReporte(resultado);
      
      console.log('✅ Reporte generado:', resultado);
    } catch (err: any) {
      const errorMessage = err.message || 'Error al generar reporte';
      setError(errorMessage);
      console.error('❌ Error en generarReporte:', err);
    } finally {
      setIsLoadingReporte(false);
    }
  }, []);

  /**
   * Limpia todos los datos del estado
   */
  const clearData = useCallback(() => {
    setCostoDelDia(null);
    setAnalisisPorFases(null);
    setEstadisticasRendimiento(null);
    setReporte(null);
    setError(null);
    
    console.log('🧹 Datos de costos limpiados');
  }, []);

  /**
   * Recarga todos los datos para un lote específico
   */
  const refetchAll = useCallback(async (loteId: string) => {
    if (!loteId) {
      setError('ID del lote es requerido');
      return;
    }

    console.log('🔄 Recargando todos los datos de costos para el lote:', loteId);

    // Ejecutar todas las funciones en paralelo para mejor rendimiento
    await Promise.all([
      calcularCostoDiario(loteId),
      analizarCostoPorFases(loteId),
      obtenerEstadisticasRendimiento(loteId),
      generarReporte(loteId)
    ]);
  }, [calcularCostoDiario, analizarCostoPorFases, obtenerEstadisticasRendimiento, generarReporte]);

  return {
    // Estados de datos
    costoDelDia,
    analisisPorFases,
    estadisticasRendimiento,
    reporte,
    
    // Estados de carga y errores
    isLoadingCostoDiario,
    isLoadingAnalisis,
    isLoadingEstadisticas,
    isLoadingReporte,
    error,
    
    // Funciones de cálculo
    calcularCostoDiario,
    analizarCostoPorFases,
    obtenerEstadisticasRendimiento,
    generarReporte,
    
    // Utilidades
    clearData,
    refetchAll
  };
};

/**
 * Hook específico para obtener el costo del día actual de forma automática
 */
export const useCostoDelDiaActual = (loteId: string | null) => {
  const [costo, setCosto] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loteId) {
      setCosto(null);
      return;
    }

    let isActive = true;

    const fetchCostoDelDia = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const resultado = await costosProduccionHuevosService.calcularCostoProduccionDiario(
          loteId, 
          new Date()
        );
        
        if (isActive) {
          setCosto(resultado?.costoPorHuevo || null);
        }
      } catch (err: any) {
        if (isActive) {
          setError(err.message || 'Error al obtener costo del día');
          console.error('❌ Error en useCostoDelDiaActual:', err);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    fetchCostoDelDia();

    // Cleanup
    return () => {
      isActive = false;
    };
  }, [loteId]);

  return {
    costo,
    isLoading,
    error
  };
};

/**
 * Hook para obtener el resumen de alertas de un lote
 */
export const useAlertasCostoHuevos = (loteId: string | null) => {
  const [alertas, setAlertas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!loteId) {
      setAlertas([]);
      return;
    }

    let isActive = true;

    const fetchAlertas = async () => {
      setIsLoading(true);

      try {
        // Obtener estadísticas de los últimos 7 días para generar alertas rápidas
        const fechaFin = new Date();
        const fechaInicio = new Date();
        fechaInicio.setDate(fechaInicio.getDate() - 7);

        const estadisticas = await costosProduccionHuevosService.obtenerEstadisticasRendimiento(
          loteId, 
          fechaInicio, 
          fechaFin
        );
        
        if (isActive) {
          setAlertas(estadisticas.alertas || []);
        }
      } catch (err) {
        console.error('❌ Error al obtener alertas:', err);
        if (isActive) {
          setAlertas([]);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    fetchAlertas();

    // Cleanup
    return () => {
      isActive = false;
    };
  }, [loteId]);

  return {
    alertas,
    isLoading,
    tieneAlertas: alertas.length > 0,
    alertasCriticas: alertas.filter(a => a.severidad === 'CRITICAL').length,
    alertasWarning: alertas.filter(a => a.severidad === 'WARNING').length
  };
};















