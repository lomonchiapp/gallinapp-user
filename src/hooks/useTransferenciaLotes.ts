/**
 * Hook para manejar transferencias de lotes de levante a ponedoras
 */

import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import {
    DatosTransferencia,
    ResultadoTransferencia,
    transferirLevantePonedoras,
    validarTransferencia,
    verificarLoteListoParaTransferir,
} from '../services/transferencia-lotes.service';
import { LoteLevante } from '../types/levantes/loteLevante';

interface UseTransferenciaLotesReturn {
  // Estado
  loading: boolean;
  error: string | null;
  
  // Acciones
  transferir: (datos: DatosTransferencia) => Promise<ResultadoTransferencia | null>;
  validar: (loteLevanteId: string, cantidad: number) => Promise<{ valido: boolean; mensaje?: string }>;
  verificarListo: (lote: LoteLevante) => { listo: boolean; mensaje: string; edadEnSemanas: number };
  limpiarError: () => void;
}

export const useTransferenciaLotes = (): UseTransferenciaLotesReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Valida si una transferencia es posible
   */
  const validar = useCallback(async (loteLevanteId: string, cantidad: number) => {
    try {
      setError(null);
      const resultado = await validarTransferencia(loteLevanteId, cantidad);
      return resultado;
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al validar transferencia';
      setError(mensaje);
      return { valido: false, mensaje };
    }
  }, []);

  /**
   * Verifica si un lote está listo para transferir
   */
  const verificarListo = useCallback((lote: LoteLevante) => {
    return verificarLoteListoParaTransferir(lote);
  }, []);

  /**
   * Realiza la transferencia de un lote de levante a ponedoras
   */
  const transferir = useCallback(async (datos: DatosTransferencia): Promise<ResultadoTransferencia | null> => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Iniciando transferencia desde hook...');

      // Validar antes de transferir
      const validacion = await validarTransferencia(
        datos.loteLevanteId,
        datos.cantidadTransferir
      );

      if (!validacion.valido) {
        Alert.alert('Validación Fallida', validacion.mensaje || 'No se puede realizar la transferencia');
        setError(validacion.mensaje || 'Validación fallida');
        return null;
      }

      // Si hay advertencia, mostrarla
      if (validacion.mensaje && validacion.mensaje.includes('⚠️')) {
        Alert.alert('Advertencia', validacion.mensaje);
      }

      // Realizar transferencia
      const resultado = await transferirLevantePonedoras(datos);

      // Mostrar éxito
      Alert.alert(
        'Transferencia Exitosa',
        `Se transfirieron ${datos.cantidadTransferir} pollitas a producción.\n\n` +
        `Costos heredados: RD$${resultado.costosHeredados.total.toFixed(2)}\n` +
        `Costo por ave: RD$${resultado.costosHeredados.porAve.toFixed(2)}`,
        [{ text: 'OK' }]
      );

      console.log('✅ Transferencia completada desde hook');
      return resultado;

    } catch (err) {
      console.error('❌ Error en transferencia:', err);
      const mensaje = err instanceof Error ? err.message : 'Error al transferir lote';
      setError(mensaje);
      
      Alert.alert(
        'Error en Transferencia',
        mensaje,
        [{ text: 'OK' }]
      );
      
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Limpia el error actual
   */
  const limpiarError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    transferir,
    validar,
    verificarListo,
    limpiarError,
  };
};







