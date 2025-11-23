/**
 * Hook para gestionar facturas
 * Las facturas son comprobantes de ventas
 */

import { useCallback, useEffect, useState } from 'react';
import { facturasService, Factura, EstadoFactura } from '../services/facturas.service';

export function useFacturas() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getFacturas = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔄 [useFacturas] Cargando facturas...');
      const facturasData = await facturasService.getFacturas();
      console.log(`✅ [useFacturas] ${facturasData.length} facturas cargadas`);
      setFacturas(facturasData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar facturas';
      setError(errorMessage);
      console.error('❌ [useFacturas] Error:', err);
      setFacturas([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    getFacturas();
  }, [getFacturas]);

  return {
    facturas,
    isLoading,
    error,
    getFacturas,
  };
}





