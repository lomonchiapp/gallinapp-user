/**
 * Servicio para transferir lotes de levante a ponedoras
 * Maneja el flujo completo de transferencia incluyendo costos heredados
 */

import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../components/config/firebase';
import { EstadoLote, TipoAve } from '../types/enums';
import { LoteLevante } from '../types/levantes/loteLevante';
import { CostosLevante, LotePonedora } from '../types/ponedoras/lotePonedora';
import { requireAuth } from './auth.service';
import { obtenerLoteEngorde } from './engorde.service';
import { obtenerGastos } from './gastos.service';
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
 * Valida que un lote pueda ser transferido a ponedoras
 * Permite transferir lotes de levante (cualquier subtipo) y engorde
 * NO permite transferir lotes de ponedoras
 */
export const validarTransferencia = async (
  loteId: string,
  cantidadTransferir: number,
  tipoLote?: TipoAve
): Promise<{ valido: boolean; mensaje?: string }> => {
  try {
    // Si se proporciona el tipo, validar que no sea ponedora
    if (tipoLote === TipoAve.PONEDORA) {
      return {
        valido: false,
        mensaje: 'Los lotes de ponedoras no pueden transferirse a otros tipos',
      };
    }

    // Intentar obtener el lote según su tipo
    let lote: any = null;
    
    if (tipoLote === TipoAve.POLLO_ENGORDE) {
      lote = await obtenerLoteEngorde(loteId);
    } else {
      // Por defecto intentar como levante (también funciona si no se especifica el tipo)
      lote = await obtenerLoteLevante(loteId);
      // Si no se encuentra como levante, intentar como engorde
      if (!lote) {
        lote = await obtenerLoteEngorde(loteId);
      }
    }

    // Validar que el lote existe
    if (!lote) {
      return { valido: false, mensaje: 'Lote no encontrado' };
    }

    // Validar que NO sea un lote de ponedoras
    if (lote.tipo === TipoAve.PONEDORA) {
      return {
        valido: false,
        mensaje: 'Los lotes de ponedoras no pueden transferirse',
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

    // Calcular edad para mostrar advertencias (pero no bloquear)
    // Los días se calculan basándose en medianoche (00:00), no en 24 horas exactas
    const fechaNacimiento = new Date(lote.fechaNacimiento);
    const fechaNacimientoMidnight = new Date(fechaNacimiento);
    fechaNacimientoMidnight.setHours(0, 0, 0, 0);
    
    const ahora = new Date();
    const ahoraMidnight = new Date(ahora);
    ahoraMidnight.setHours(0, 0, 0, 0);
    
    const edadEnDias = Math.floor(
      (ahoraMidnight.getTime() - fechaNacimientoMidnight.getTime()) / (1000 * 60 * 60 * 24)
    );
    const edadEnSemanas = Math.floor(edadEnDias / 7);

    // Solo mostrar advertencias, no bloquear la transferencia
    if (edadEnSemanas < 16) {
      return {
        valido: true,
        mensaje: `⚠️ Advertencia: Se recomienda esperar hasta las 16 semanas. Edad actual: ${edadEnSemanas} semanas. Puede continuar si lo desea.`,
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
 * Calcula los costos acumulados durante la fase de levante o engorde
 */
export const calcularCostosLevante = async (
  loteId: string,
  cantidadTransferir: number,
  lote: LoteLevante | any,
  tipoAve: TipoAve = TipoAve.POLLO_LEVANTE
): Promise<CostosLevante> => {
  try {
    // Obtener todos los gastos del lote según su tipo
    const gastos = await obtenerGastos(loteId, tipoAve);

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

    // Obtener lote primero para saber su tipo
    let loteOrigen: any = await obtenerLoteLevante(datos.loteLevanteId);
    if (!loteOrigen) {
      loteOrigen = await obtenerLoteEngorde(datos.loteLevanteId);
    }
    if (!loteOrigen) {
      throw new Error('Lote no encontrado');
    }
    
    // Validar transferencia (permitir cualquier lote de levante o engorde)
    const validacion = await validarTransferencia(
      datos.loteLevanteId,
      datos.cantidadTransferir,
      loteOrigen.tipo
    );

    if (!validacion.valido) {
      throw new Error(validacion.mensaje);
    }

    // Calcular costos heredados
    const tipoAveOrigen = loteOrigen.tipo === TipoAve.POLLO_ENGORDE 
      ? TipoAve.POLLO_ENGORDE 
      : TipoAve.POLLO_LEVANTE;
    
    const costosLevante = await calcularCostosLevante(
      datos.loteLevanteId,
      datos.cantidadTransferir,
      loteOrigen,
      tipoAveOrigen
    );

    // Ejecutar transferencia en transacción
    const resultado = await runTransaction(db, async (transaction) => {
      // Referencias a documentos (usar las colecciones correctas)
      const levanteRef = loteOrigen.tipo === TipoAve.POLLO_ENGORDE
        ? doc(db, 'lotesEngorde', datos.loteLevanteId)
        : doc(db, 'lotesLevantes', datos.loteLevanteId);
      const ponedorasRef = doc(collection(db, 'lotesPonedoras'));

      // Crear lote de ponedoras
      const nuevaCantidad = loteOrigen.cantidadActual - datos.cantidadTransferir;
      const nuevoEstado =
        nuevaCantidad === 0 ? EstadoLote.TRANSFERIDO : EstadoLote.ACTIVO;

      const tipoOrigen = loteOrigen.tipo === TipoAve.POLLO_ENGORDE ? 'engorde' : 'levante';
      
      const lotePonedoras: Omit<LotePonedora, 'id'> = {
        nombre: `${loteOrigen.nombre} (Producción)`,
        tipo: TipoAve.PONEDORA,
        cantidadInicial: datos.cantidadTransferir,
        cantidadActual: datos.cantidadTransferir,
        raza: loteOrigen.raza,
        fechaNacimiento: loteOrigen.fechaNacimiento,
        fechaInicio: new Date(),
        galponId: datos.galponDestinoId,
        estado: EstadoLote.ACTIVO,
        observaciones: datos.observaciones || `Transferido desde lote de ${tipoOrigen} ${loteOrigen.nombre}`,
        loteLevanteOrigen: datos.loteLevanteId,
        costosLevante,
        fechaInicioProduccion: datos.fechaInicioProduccion || new Date(),
        esTransferido: true,
        createdBy: userId,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
      };

      // Guardar lote de ponedoras
      transaction.set(ponedorasRef, lotePonedoras);

      // Actualizar lote de origen (levante o engorde)
      const actualizacionOrigen = {
        cantidadActual: nuevaCantidad,
        estado: nuevoEstado,
        loteDestinoId: ponedorasRef.id,
        fechaTransferencia: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Determinar la referencia correcta según el tipo
      const origenRef = loteOrigen.tipo === TipoAve.POLLO_ENGORDE
        ? doc(db, 'lotesEngorde', datos.loteLevanteId)
        : levanteRef;
      
      transaction.update(origenRef, actualizacionOrigen);

      // Registrar evento de transferencia
      const eventoRef = doc(collection(db, 'eventos_transferencia'));
      const evento: any = {
        tipo: 'TRANSFERENCIA_LEVANTE_PONEDORAS',
        loteOrigenId: datos.loteLevanteId,
        loteDestinoId: ponedorasRef.id,
        cantidad: datos.cantidadTransferir,
        costosHeredados: costosLevante,
        fecha: serverTimestamp(),
        realizadoPor: userId,
      };

      // Solo incluir observaciones si tiene un valor definido
      if (datos.observaciones && datos.observaciones.trim()) {
        evento.observaciones = datos.observaciones.trim();
      }

      transaction.set(eventoRef, evento);

      return {
        loteLevante: {
          ...loteOrigen,
          ...actualizacionOrigen,
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
 * Verifica si un lote está listo para transferir a ponedoras
 * Permite lotes de levante (cualquier subtipo) y engorde
 * NO permite lotes de ponedoras
 */
export const verificarLoteListoParaTransferir = (lote: LoteLevante | any): {
  listo: boolean;
  mensaje: string;
  edadEnSemanas: number;
} => {
  // Validar que NO sea un lote de ponedoras
  if (lote.tipo === TipoAve.PONEDORA) {
    return {
      listo: false,
      mensaje: 'Los lotes de ponedoras no pueden transferirse',
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

  // Los días se calculan basándose en medianoche (00:00), no en 24 horas exactas
  const fechaNacimiento = new Date(lote.fechaNacimiento);
  const fechaNacimientoMidnight = new Date(fechaNacimiento);
  fechaNacimientoMidnight.setHours(0, 0, 0, 0);
  
  const ahora = new Date();
  const ahoraMidnight = new Date(ahora);
  ahoraMidnight.setHours(0, 0, 0, 0);
  
  const edadEnDias = Math.floor(
    (ahoraMidnight.getTime() - fechaNacimientoMidnight.getTime()) / (1000 * 60 * 60 * 24)
  );
  const edadEnSemanas = Math.floor(edadEnDias / 7);

  // Siempre permitir transferir, solo mostrar advertencias
  if (edadEnSemanas < 16) {
    return {
      listo: true,
      mensaje: `⚠️ Se recomienda esperar hasta las 16 semanas. Edad actual: ${edadEnSemanas} semanas. Puede continuar si lo desea.`,
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
    mensaje: '⚠️ Se recomienda esperar a las 18 semanas, pero puede continuar',
    edadEnSemanas,
  };
};














