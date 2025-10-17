/**
 * Servicio para transferir lotes de levante a ponedoras
 * Maneja el flujo completo de transferencia incluyendo costos heredados
 */

import { collection, doc, runTransaction, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { EstadoLote, SubtipoLevante, TipoAve } from '../types/enums';
import { LoteLevante } from '../types/levantes/loteLevante';
import { CostosLevante, LotePonedora } from '../types/ponedoras/lotePonedora';
import { requireAuth } from './auth.service';
import { obtenerGastosPorLote } from './gastos.service';
import { obtenerLoteLevante } from './levantes.service';

/**
 * Datos necesarios para realizar una transferencia
 */
export interface DatosTransferencia {
  /** ID del lote de levante a transferir */
  loteLevanteId: string;
  /** Cantidad de aves a transferir */
  cantidadTransferir: number;
  /** ID del galpón destino para las ponedoras */
  galponDestinoId: string;
  /** Observaciones sobre la transferencia */
  observaciones?: string;
  /** Fecha de inicio de producción esperada */
  fechaInicioProduccion?: Date;
}

/**
 * Resultado de una transferencia exitosa
 */
export interface ResultadoTransferencia {
  /** Lote de levante actualizado */
  loteLevante: LoteLevante;
  /** Nuevo lote de ponedoras creado */
  lotePonedoras: LotePonedora;
  /** Costos heredados del levante */
  costosHeredados: CostosLevante;
}

/**
 * Valida que un lote de levante pueda ser transferido
 */
export const validarTransferencia = async (
  loteLevanteId: string,
  cantidadTransferir: number
): Promise<{ valido: boolean; mensaje?: string }> => {
  try {
    const lote = await obtenerLoteLevante(loteLevanteId);

    // Validar que el lote existe
    if (!lote) {
      return { valido: false, mensaje: 'Lote no encontrado' };
    }

    // Validar que sea subtipo LEVANTE_PONEDORAS
    if (lote.subtipo !== SubtipoLevante.LEVANTE_PONEDORAS) {
      return {
        valido: false,
        mensaje: 'Solo se pueden transferir lotes de levante para ponedoras',
      };
    }

    // Validar que esté activo
    if (lote.estado !== EstadoLote.ACTIVO) {
      return {
        valido: false,
        mensaje: `El lote está en estado ${lote.estado}, debe estar ACTIVO`,
      };
    }

    // Validar cantidad disponible
    if (cantidadTransferir > lote.cantidadActual) {
      return {
        valido: false,
        mensaje: `Cantidad insuficiente. Disponible: ${lote.cantidadActual}, solicitado: ${cantidadTransferir}`,
      };
    }

    // Validar edad mínima (18 semanas recomendado)
    const edadEnDias = Math.floor(
      (new Date().getTime() - new Date(lote.fechaNacimiento).getTime()) / (1000 * 60 * 60 * 24)
    );
    const edadEnSemanas = Math.floor(edadEnDias / 7);

    if (edadEnSemanas < 16) {
      return {
        valido: false,
        mensaje: `Las pollitas deben tener al menos 16 semanas. Edad actual: ${edadEnSemanas} semanas`,
      };
    }

    if (edadEnSemanas < 18) {
      return {
        valido: true,
        mensaje: `⚠️ Advertencia: Se recomienda transferir a las 18-20 semanas. Edad actual: ${edadEnSemanas} semanas`,
      };
    }

    return { valido: true };
  } catch (error) {
    console.error('Error al validar transferencia:', error);
    return { valido: false, mensaje: 'Error al validar la transferencia' };
  }
};

/**
 * Calcula los costos acumulados durante la fase de levante
 */
export const calcularCostosLevante = async (
  loteLevanteId: string,
  cantidadTransferir: number,
  lote: LoteLevante
): Promise<CostosLevante> => {
  try {
    // Obtener todos los gastos del lote de levante
    const gastos = await obtenerGastosPorLote(loteLevanteId, TipoAve.POLLO_LEVANTE);

    // Calcular costo total
    const costoTotal = gastos.reduce((sum, gasto) => sum + gasto.total, 0);

    // Calcular costo por ave
    const costoPorAve = cantidadTransferir > 0 ? costoTotal / cantidadTransferir : 0;

    const costosLevante: CostosLevante = {
      total: costoTotal,
      porAve: costoPorAve,
      fechaInicio: lote.fechaInicio,
      fechaFin: new Date(),
      cantidadInicial: lote.cantidadInicial,
      cantidadTransferida: cantidadTransferir,
    };

    console.log('💰 Costos de levante calculados:', {
      total: costoTotal,
      porAve: costoPorAve,
      cantidadTransferida: cantidadTransferir,
    });

    return costosLevante;
  } catch (error) {
    console.error('Error al calcular costos de levante:', error);
    throw error;
  }
};

/**
 * Transfiere un lote de levante a ponedoras
 * Usa transacciones para garantizar consistencia
 */
export const transferirLevantePonedoras = async (
  datos: DatosTransferencia
): Promise<ResultadoTransferencia> => {
  try {
    const userId = requireAuth();
    console.log('🔄 Iniciando transferencia de lote:', datos.loteLevanteId);

    // Validar transferencia
    const validacion = await validarTransferencia(
      datos.loteLevanteId,
      datos.cantidadTransferir
    );

    if (!validacion.valido) {
      throw new Error(validacion.mensaje);
    }

    // Obtener lote de levante
    const loteLevante = await obtenerLoteLevante(datos.loteLevanteId);
    if (!loteLevante) {
      throw new Error('Lote de levante no encontrado');
    }

    // Calcular costos heredados
    const costosLevante = await calcularCostosLevante(
      datos.loteLevanteId,
      datos.cantidadTransferir,
      loteLevante
    );

    // Ejecutar transferencia en transacción
    const resultado = await runTransaction(db, async (transaction) => {
      // Referencias a documentos
      const levanteRef = doc(db, 'lotes_levante', datos.loteLevanteId);
      const ponedorasRef = doc(collection(db, 'lotes_ponedoras'));

      // Crear lote de ponedoras
      const nuevaCantidad = loteLevante.cantidadActual - datos.cantidadTransferir;
      const nuevoEstado =
        nuevaCantidad === 0 ? EstadoLote.TRANSFERIDO : EstadoLote.ACTIVO;

      const lotePonedoras: Omit<LotePonedora, 'id'> = {
        nombre: `${loteLevante.nombre} (Producción)`,
        tipo: TipoAve.PONEDORA,
        cantidadInicial: datos.cantidadTransferir,
        cantidadActual: datos.cantidadTransferir,
        raza: loteLevante.raza,
        fechaNacimiento: loteLevante.fechaNacimiento,
        fechaInicio: new Date(),
        galponId: datos.galponDestinoId,
        estado: EstadoLote.ACTIVO,
        observaciones: datos.observaciones || `Transferido desde lote de levante ${loteLevante.nombre}`,
        loteLevanteOrigen: datos.loteLevanteId,
        costosLevante,
        fechaInicioProduccion: datos.fechaInicioProduccion || new Date(),
        esTransferido: true,
        createdBy: userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // Guardar lote de ponedoras
      transaction.set(ponedorasRef, lotePonedoras);

      // Actualizar lote de levante
      const actualizacionLevante = {
        cantidadActual: nuevaCantidad,
        estado: nuevoEstado,
        loteDestinoId: ponedorasRef.id,
        fechaTransferencia: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      transaction.update(levanteRef, actualizacionLevante);

      // Registrar evento de transferencia
      const eventoRef = doc(collection(db, 'eventos_transferencia'));
      const evento = {
        tipo: 'TRANSFERENCIA_LEVANTE_PONEDORAS',
        loteOrigenId: datos.loteLevanteId,
        loteDestinoId: ponedorasRef.id,
        cantidad: datos.cantidadTransferir,
        costosHeredados: costosLevante,
        fecha: Timestamp.now(),
        realizadoPor: userId,
        observaciones: datos.observaciones,
      };

      transaction.set(eventoRef, evento);

      return {
        loteLevante: {
          ...loteLevante,
          ...actualizacionLevante,
          fechaTransferencia: new Date(),
        } as LoteLevante,
        lotePonedoras: {
          ...lotePonedoras,
          id: ponedorasRef.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as LotePonedora,
        costosHeredados: costosLevante,
      };
    });

    console.log('✅ Transferencia completada exitosamente');
    console.log('📊 Resultado:', {
      loteLevanteId: resultado.loteLevante.id,
      lotePonedorasId: resultado.lotePonedoras.id,
      cantidadTransferida: datos.cantidadTransferir,
      costosHeredados: resultado.costosHeredados.total,
    });

    return resultado;
  } catch (error) {
    console.error('❌ Error al transferir lote:', error);
    throw error;
  }
};

/**
 * Obtiene el historial de transferencias de un lote de levante
 */
export const obtenerHistorialTransferencias = async (
  loteLevanteId: string
): Promise<any[]> => {
  try {
    const eventosRef = collection(db, 'eventos_transferencia');
    const { query, where, getDocs, orderBy } = await import('firebase/firestore');

    const q = query(
      eventosRef,
      where('loteOrigenId', '==', loteLevanteId),
      orderBy('fecha', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      fecha: doc.data().fecha?.toDate(),
    }));
  } catch (error) {
    console.error('Error al obtener historial de transferencias:', error);
    return [];
  }
};

/**
 * Verifica si un lote de levante está listo para transferir
 */
export const verificarLoteListoParaTransferir = (lote: LoteLevante): {
  listo: boolean;
  mensaje: string;
  edadEnSemanas: number;
} => {
  if (lote.subtipo !== SubtipoLevante.LEVANTE_PONEDORAS) {
    return {
      listo: false,
      mensaje: 'Este lote no es para ponedoras',
      edadEnSemanas: 0,
    };
  }

  if (lote.estado !== EstadoLote.ACTIVO) {
    return {
      listo: false,
      mensaje: `El lote está en estado ${lote.estado}`,
      edadEnSemanas: 0,
    };
  }

  const edadEnDias = Math.floor(
    (new Date().getTime() - new Date(lote.fechaNacimiento).getTime()) / (1000 * 60 * 60 * 24)
  );
  const edadEnSemanas = Math.floor(edadEnDias / 7);

  if (edadEnSemanas < 16) {
    return {
      listo: false,
      mensaje: `Faltan ${16 - edadEnSemanas} semanas para poder transferir`,
      edadEnSemanas,
    };
  }

  if (edadEnSemanas >= 18 && edadEnSemanas <= 22) {
    return {
      listo: true,
      mensaje: '✅ Edad óptima para transferir',
      edadEnSemanas,
    };
  }

  if (edadEnSemanas > 22) {
    return {
      listo: true,
      mensaje: '⚠️ Se recomienda transferir pronto',
      edadEnSemanas,
    };
  }

  return {
    listo: true,
    mensaje: '⚠️ Se puede transferir, pero se recomienda esperar a las 18 semanas',
    edadEnSemanas,
  };
};







