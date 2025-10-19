/**
 * Hook para manejar ventas de lotes
 * Proporciona suscripción en tiempo real y estadísticas de ventas
 */

import { useEffect, useState } from 'react';
import { calcularEstadisticasVentasLote, EstadisticasVentasLote, suscribirseAVentasLote, VentaLote } from '../services/ventas.service';
import { TipoAve } from '../types/enums';

export const useVentasLote = (loteId: string | undefined, tipoAve: TipoAve) => {
  const [ventas, setVentas] = useState<VentaLote[]>([]);
  const [estadisticasVentas, setEstadisticasVentas] = useState<EstadisticasVentasLote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loteId) {
      setVentas([]);
      setEstadisticasVentas(null);
      setLoading(false);
      return;
    }

    console.log('🔄 Configurando suscripción de ventas para lote:', loteId);
    
    const unsubscribe = suscribirseAVentasLote(
      loteId,
      tipoAve,
      (ventasActualizadas) => {
        console.log('📊 Ventas actualizadas:', ventasActualizadas.length);
        setVentas(ventasActualizadas);
        
        // Calcular estadísticas de ventas
        calcularEstadisticasVentasLote(loteId, tipoAve)
          .then(setEstadisticasVentas)
          .catch(error => console.error('Error calculando estadísticas de ventas:', error));
        
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [loteId, tipoAve]);

  return {
    ventas,
    estadisticasVentas,
    loading,
  };
};












