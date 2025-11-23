/**
 * Hook personalizado para calcular el costo de producción unitario de un lote
 */

import { useEffect, useState } from 'react';
import { calcularCostoProduccionUnitario } from '../services/gastos.service';
import { TipoAve } from '../types/enums';

export const useCostUnitario = (loteId: string, tipoLote: TipoAve, cantidadInicial: number) => {
  const [costoTotal, setCostoTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCostoUnitario = async () => {
    if (!loteId) return;

    setIsLoading(true);
    setError(null);

    try {
      const costo = await calcularCostoProduccionUnitario(loteId, tipoLote);
      setCostoTotal(costo);
    } catch (err: any) {
      setError(err.message || 'Error al calcular costo unitario');
      console.error('Error en useCostUnitario:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCostoUnitario();
  }, [loteId, tipoLote]);

  // Calcular costo unitario usando cantidadInicial (no debe cambiar al vender aves)
  const costoUnitario = cantidadInicial > 0 ? costoTotal / cantidadInicial : 0;

  return {
    costoTotal,
    costoUnitario,
    isLoading,
    error,
    refetch: loadCostoUnitario
  };
};






























