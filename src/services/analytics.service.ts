/**
 * Servicio para análisis y comparación de lotes
 */

import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '../components/config/firebase';
import { PesoRegistro, TipoAve } from '../types';
import { calculateAgeInDays } from '../utils/dateUtils';
import { getCurrentUserId } from './auth.service';

export interface LoteComparativo {
  id: string;
  nombre: string;
  tipoAve: TipoAve;
  fechaInicio: Date;
  fechaNacimiento: Date;
  cantidadInicial: number;
  cantidadActual: number;
  edadActual: number;
  pesoPromedio: number;
  tasaMortalidad: number;
  gananciaPromedioDiaria: number;
  eficienciaAlimenticia?: number;
  costoTotal?: number;
  ingresoTotal?: number;
  margenGanancia?: number;
  estado: 'activo' | 'finalizado';
}

export interface ComparativaLotes {
  lotes: LoteComparativo[];
  promedios: {
    edadPromedio: number;
    pesoPromedio: number;
    mortalidadPromedio: number;
    gananciaPromedio: number;
    margenPromedio: number;
  };
  mejorLote: {
    mejorCrecimiento: LoteComparativo | null;
    menorMortalidad: LoteComparativo | null;
    mayorRentabilidad: LoteComparativo | null;
  };
}

/**
 * Obtener datos comparativos de lotes por tipo
 */
export const obtenerDatosComparativos = async (
  tipoAve: TipoAve,
  incluirFinalizados: boolean = true
): Promise<ComparativaLotes> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }

    // Determinar colección según tipo de ave
    let collectionName = '';
    switch (tipoAve) {
      case TipoAve.POLLO_LEVANTE:
        collectionName = 'lotesLevantes';
        break;
      case TipoAve.POLLO_ENGORDE:
        collectionName = 'lotesEngorde';
        break;
      case TipoAve.PONEDORA:
        collectionName = 'lotesPonedoras';
        break;
      default:
        throw new Error('Tipo de ave no válido');
    }

    // Consultar lotes
    let constraints = [
      where('userId', '==', userId),
      orderBy('fechaInicio', 'desc')
    ];

    if (!incluirFinalizados) {
      constraints.push(where('estado', '==', 'ACTIVO'));
    }

    const q = query(collection(db, collectionName), ...constraints);
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return {
        lotes: [],
        promedios: {
          edadPromedio: 0,
          pesoPromedio: 0,
          mortalidadPromedio: 0,
          gananciaPromedio: 0,
          margenPromedio: 0
        },
        mejorLote: {
          mejorCrecimiento: null,
          menorMortalidad: null,
          mayorRentabilidad: null
        }
      };
    }

    // Obtener registros de peso para todos los lotes
    const registrosPesoQuery = query(
      collection(db, 'registrosPeso'),
      where('tipoLote', '==', tipoAve),
      where('createdBy', '==', userId),
      orderBy('fecha', 'desc')
    );
    const registrosPesoSnapshot = await getDocs(registrosPesoQuery);
    
    // Agrupar registros de peso por lote
    const registrosPorLote: { [loteId: string]: PesoRegistro[] } = {};
    registrosPesoSnapshot.docs.forEach(doc => {
      const registro = {
        id: doc.id,
        ...doc.data(),
        fecha: doc.data().fecha?.toDate ? doc.data().fecha.toDate() : new Date(doc.data().fecha)
      } as PesoRegistro;
      
      if (!registrosPorLote[registro.loteId]) {
        registrosPorLote[registro.loteId] = [];
      }
      registrosPorLote[registro.loteId].push(registro);
    });

    // Obtener registros de mortalidad
    const mortalidadQuery = query(
      collection(db, 'mortalidad'),
      where('tipoLote', '==', tipoAve),
      where('createdBy', '==', userId)
    );
    const mortalidadSnapshot = await getDocs(mortalidadQuery);
    
    // Agrupar mortalidad por lote
    const mortalidadPorLote: { [loteId: string]: number } = {};
    mortalidadSnapshot.docs.forEach(doc => {
      const registro = doc.data();
      if (!mortalidadPorLote[registro.loteId]) {
        mortalidadPorLote[registro.loteId] = 0;
      }
      mortalidadPorLote[registro.loteId] += registro.cantidad;
    });

    // Procesar datos de lotes
    const lotes: LoteComparativo[] = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const loteId = doc.id;
      
      // Convertir fechas
      const fechaInicio = data.fechaInicio?.toDate ? data.fechaInicio.toDate() : new Date(data.fechaInicio);
      const fechaNacimiento = data.fechaNacimiento?.toDate ? data.fechaNacimiento.toDate() : new Date(data.fechaNacimiento);
      
      // Calcular métricas
      const edadActual = calculateAgeInDays(fechaNacimiento);
      const registrosPeso = registrosPorLote[loteId] || [];
      const pesoPromedio = registrosPeso.length > 0 ? registrosPeso[0]?.pesoPromedio || 0 : 0;
      const mortalidadTotal = mortalidadPorLote[loteId] || 0;
      const tasaMortalidad = data.cantidadInicial > 0 ? (mortalidadTotal / data.cantidadInicial) * 100 : 0;
      
      // Calcular ganancia promedio diaria
      let gananciaPromedioDiaria = 0;
      if (registrosPeso.length >= 2) {
        const pesoInicial = registrosPeso[registrosPeso.length - 1]?.pesoPromedio || 0;
        const pesoActual = registrosPeso[0]?.pesoPromedio || 0;
        const diasTranscurridos = edadActual;
        gananciaPromedioDiaria = diasTranscurridos > 0 ? (pesoActual - pesoInicial) / diasTranscurridos : 0;
      }

      return {
        id: loteId,
        nombre: data.nombre,
        tipoAve,
        fechaInicio,
        fechaNacimiento,
        cantidadInicial: data.cantidadInicial || data.numeroAves,
        cantidadActual: data.cantidadActual || data.numeroAves,
        edadActual,
        pesoPromedio,
        tasaMortalidad,
        gananciaPromedioDiaria,
        eficienciaAlimenticia: 0, // TODO: Calcular cuando tengamos datos de alimento
        costoTotal: 0, // TODO: Obtener de gastos
        ingresoTotal: 0, // TODO: Obtener de ventas
        margenGanancia: 0,
        estado: data.estado === 'ACTIVO' ? 'activo' : 'finalizado'
      };
    });

    // Calcular promedios
    const promedios = {
      edadPromedio: lotes.reduce((sum, lote) => sum + lote.edadActual, 0) / lotes.length,
      pesoPromedio: lotes.reduce((sum, lote) => sum + lote.pesoPromedio, 0) / lotes.length,
      mortalidadPromedio: lotes.reduce((sum, lote) => sum + lote.tasaMortalidad, 0) / lotes.length,
      gananciaPromedio: lotes.reduce((sum, lote) => sum + lote.gananciaPromedioDiaria, 0) / lotes.length,
      margenPromedio: lotes.reduce((sum, lote) => sum + lote.margenGanancia, 0) / lotes.length
    };

    // Encontrar mejores lotes
    const mejorLote = {
      mejorCrecimiento: lotes.reduce((mejor, actual) => 
        (!mejor || actual.gananciaPromedioDiaria > mejor.gananciaPromedioDiaria) ? actual : mejor, 
        null as LoteComparativo | null
      ),
      menorMortalidad: lotes.reduce((mejor, actual) => 
        (!mejor || actual.tasaMortalidad < mejor.tasaMortalidad) ? actual : mejor, 
        null as LoteComparativo | null
      ),
      mayorRentabilidad: lotes.reduce((mejor, actual) => 
        (!mejor || actual.margenGanancia > mejor.margenGanancia) ? actual : mejor, 
        null as LoteComparativo | null
      )
    };

    return {
      lotes,
      promedios,
      mejorLote
    };

  } catch (error) {
    console.error('Error obteniendo datos comparativos:', error);
    throw error;
  }
};

/**
 * Obtener tendencias históricas de rendimiento
 */
export const obtenerTendenciasHistoricas = async (
  tipoAve: TipoAve,
  mesesAtras: number = 6
): Promise<{
  labels: string[];
  datasets: {
    pesoPromedio: number[];
    mortalidad: number[];
    rentabilidad: number[];
  };
}> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Usuario no autenticado');

    const fechaLimite = new Date();
    fechaLimite.setMonth(fechaLimite.getMonth() - mesesAtras);

    // Obtener datos comparativos
    const datos = await obtenerDatosComparativos(tipoAve, true);
    
    // Filtrar lotes por fecha
    const lotesFiltrados = datos.lotes.filter(lote => lote.fechaInicio >= fechaLimite);
    
    // Agrupar por mes
    const datosPorMes: { [mes: string]: LoteComparativo[] } = {};
    lotesFiltrados.forEach(lote => {
      const mesKey = `${lote.fechaInicio.getFullYear()}-${String(lote.fechaInicio.getMonth() + 1).padStart(2, '0')}`;
      if (!datosPorMes[mesKey]) {
        datosPorMes[mesKey] = [];
      }
      datosPorMes[mesKey].push(lote);
    });

    // Generar etiquetas y datasets
    const labels = Object.keys(datosPorMes).sort();
    const datasets = {
      pesoPromedio: labels.map(mes => {
        const lotesMes = datosPorMes[mes];
        return lotesMes.reduce((sum, lote) => sum + lote.pesoPromedio, 0) / lotesMes.length;
      }),
      mortalidad: labels.map(mes => {
        const lotesMes = datosPorMes[mes];
        return lotesMes.reduce((sum, lote) => sum + lote.tasaMortalidad, 0) / lotesMes.length;
      }),
      rentabilidad: labels.map(mes => {
        const lotesMes = datosPorMes[mes];
        return lotesMes.reduce((sum, lote) => sum + lote.margenGanancia, 0) / lotesMes.length;
      })
    };

    return { labels, datasets };

  } catch (error) {
    console.error('Error obteniendo tendencias históricas:', error);
    throw error;
  }
};



















