/**
 * Hook genérico reutilizable para detalles de lotes
 * Elimina código duplicado entre levantes, engorde y ponedoras
 */

import { useCallback, useEffect, useState } from 'react';
import { EstadisticasVentasLote, VentaLote } from '../services/ventas.service';
import { LoteBase } from '../types';
import { TipoAve } from '../types/enums';
import { useVentasLote } from './useVentasLote';

interface UseLoteDetallesOptions<T extends LoteBase> {
  loteId: string | undefined;
  tipoAve: TipoAve;
  store: {
    loteActual: T | null;
    cargarLote: (id: string) => Promise<void>;
    isLoading: boolean;
    error: string | null;
  };
  loadMortalidad: (tipoAve: TipoAve) => Promise<void>;
  loadGastos: (loteId: string) => Promise<void>;
  loadRegistrosPeso: (loteId: string, tipoAve: TipoAve) => Promise<void>;
  loadGalpones: () => Promise<void>;
}

interface UseLoteDetallesReturn<T extends LoteBase> {
  // Estado del lote
  lote: T | null;
  isLoading: boolean;
  error: string | null;
  
  // Estado de ventas
  ventas: VentaLote[];
  estadisticasVentas: EstadisticasVentasLote | null;
  isLoadingVentas: boolean;
  errorVentas: string | null;
  
  // Estado general
  isLoadingGeneral: boolean;
  hasError: boolean;
  
  // Acciones
  cargarDatosLote: () => Promise<void>;
  refrescarDatos: () => Promise<void>;
  limpiarErrores: () => void;
}

export const useLoteDetalles = <T extends LoteBase>({
  loteId,
  tipoAve,
  store,
  loadMortalidad,
  loadGastos,
  loadRegistrosPeso,
  loadGalpones,
}: UseLoteDetallesOptions<T>): UseLoteDetallesReturn<T> => {
  const [isLoadingGeneral, setIsLoadingGeneral] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Hook de ventas
  const { 
    ventas, 
    estadisticasVentas, 
    isLoading: isLoadingVentas, 
    error: errorVentas 
  } = useVentasLote(loteId, tipoAve);

  /**
   * Cargar todos los datos del lote
   */
  const cargarDatosLote = useCallback(async () => {
    if (!loteId) {
      setIsLoadingGeneral(false);
      return;
    }

    try {
      setIsLoadingGeneral(true);
      setHasError(false);

      await Promise.all([
        store.cargarLote(loteId),
        loadMortalidad(tipoAve),
        loadGastos(loteId),
        loadRegistrosPeso(loteId, tipoAve),
        loadGalpones(),
      ]);

    } catch (error) {
      console.error('Error al cargar datos del lote:', error);
      setHasError(true);
    } finally {
      setIsLoadingGeneral(false);
    }
  }, [loteId, tipoAve, store, loadMortalidad, loadGastos, loadRegistrosPeso, loadGalpones]);

  /**
   * Refrescar todos los datos
   */
  const refrescarDatos = useCallback(async () => {
    await cargarDatosLote();
  }, [cargarDatosLote]);

  /**
   * Limpiar errores
   */
  const limpiarErrores = useCallback(() => {
    setHasError(false);
  }, []);

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDatosLote();
  }, [cargarDatosLote]);

  // Determinar estado de carga general
  const isLoading = store.isLoading || isLoadingGeneral;
  const error = store.error || (hasError ? 'Error al cargar datos del lote' : null);

  return {
    // Estado del lote
    lote: store.loteActual,
    isLoading,
    error,
    
    // Estado de ventas
    ventas,
    estadisticasVentas,
    isLoadingVentas,
    errorVentas,
    
    // Estado general
    isLoadingGeneral,
    hasError,
    
    // Acciones
    cargarDatosLote,
    refrescarDatos,
    limpiarErrores,
  };
};












