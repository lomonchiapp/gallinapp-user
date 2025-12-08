/**
 * Store para el módulo de gallinas ponedoras usando Zustand
 */

import { create } from 'zustand';
import { runAutomaticWelfareCheck } from '../services/animal-welfare-monitoring.service';
import { costosProduccionHuevosService } from '../services/costos-produccion-huevos.service';
import { obtenerRegistrosMortalidad } from '../services/mortality.service';
import {
    actualizarLotePonedora,
    calcularEstadisticasLotePonedora,
    crearLotePonedora,
    eliminarLotePonedora,
    finalizarLotePonedora,
    obtenerGastosPonedora,
    obtenerIngresosPonedora,
    obtenerLotePonedora,
    obtenerLotesPonedoras,
    obtenerRegistrosDiarios,
    obtenerRegistrosHuevos,
    obtenerVentasHuevos,
    registrarGastoPonedora,
    registrarIngresoPonedora,
    registrarProduccionDiaria,
    registrarProduccionHuevos,
    registrarVentaHuevos,
    subscribeToPonedoras
} from '../services/ponedoras.service';
import { LotePonedora, TipoAve } from '../types';
// Interfaces temporales para el store - deben coincidir con las del servicio
import { EstadoLote, Gasto } from '../types';
import {
    AnalisisCostroPorFases,
    CostoProduccionDiario,
    EstadisticasRendimientoHuevos
} from '../types/costosProduccionHuevos';

interface EstadisticasLotePonedora {
  loteId: string;
  produccionTotal: number;
  promedioProduccionDiaria: number;
  tasaPostura: number;
  mortalidad: number;
  ingresoTotal: number;
  gastoTotal: number;
  gananciaTotal: number;
}

interface FiltroLote {
  status?: EstadoLote;
}

interface RegistroDiarioPonedora {
  id: string;
  loteId: string;
  fecha: Date;
  cantidadHuevosPequenos: number;
  cantidadHuevosMedianos: number;
  cantidadHuevosGrandes: number;
  cantidadHuevosExtraGrandes: number;
  observaciones?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface VentaHuevos {
  id: string;
  loteId: string;
  fecha: Date;
  cantidad: number;
  tamano: string;
  calidad: string;
  precioUnitario: number;
  total: number;
  cliente?: string;
  observaciones?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IngresoPonedora {
  id: string;
  loteId: string;
  tipo: string;
  descripcion: string;
  monto: number;
  fecha: Date;
  comprobante?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Simplificamos usando solo Zustand sin eventos externos

interface PonedorasState {
  // Estado
  lotes: LotePonedora[];
  loteActual: LotePonedora | null;
  estadisticasLotes: { [loteId: string]: { huevos: number; muertes: number } };
  registros: RegistroDiarioPonedora[];
  registrosDiarios: RegistroDiarioPonedora[];
  registrosHuevos: any[];
  ventas: VentaHuevos[];
  ventasHuevos: VentaHuevos[];
  gastos: Gasto[];
  gastosLote: Gasto[];
  ingresos: IngresoPonedora[];
  estadisticas: EstadisticasLotePonedora | null;
  estadisticasLote: EstadisticasLotePonedora | null;
  registrosMortalidad: any[];
  filtro: FiltroLote | undefined;
  isLoading: boolean;
  error: string | null;

  // Estado para costos de producción de huevos
  costosProduccion: {
    costoDelDia: CostoProduccionDiario | null;
    analisisPorFases: AnalisisCostroPorFases | null;
    estadisticasRendimiento: EstadisticasRendimientoHuevos | null;
    costosPorLote: { [loteId: string]: CostoProduccionDiario[] };
    isLoadingCostos: boolean;
    errorCostos: string | null;
  };
  
  // Acciones - Lotes
  cargarLotes: (filtro?: FiltroLote) => Promise<void>;
  cargarLote: (id: string) => Promise<LotePonedora | null>;
  cargarLotePonedora: (id: string) => Promise<void>;
  cargarEstadisticasLotes: () => Promise<void>;
  crearLote: (lote: Omit<LotePonedora, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  actualizarLote: (id: string, lote: Partial<LotePonedora>) => Promise<void>;
  finalizarLote: (id: string, fechaFin: Date) => Promise<void>;
  eliminarLote: (id: string) => Promise<void>;
  
  // Suscripción a ponedoras
  suscribirseAPonedoras: () => () => void;
  
  // Acción para actualizar después de registrar mortalidad
  actualizarDespuesMortalidad: (loteId: string, cantidadMuertes: number) => void;
  
  // Acciones - Registros Diarios
  cargarRegistrosDiarios: (loteId: string) => Promise<void>;
  cargarRegistrosHuevos: (loteId: string) => Promise<void>;
  registrarProduccion: (registro: Omit<RegistroDiarioPonedora, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  registrarProduccionHuevos: (registro: { loteId: string; fecha: Date; cantidadHuevos: number; observaciones?: string }) => Promise<void>;
  
  // Acciones - Ventas
  cargarVentas: (loteId: string) => Promise<void>;
  registrarVenta: (venta: Omit<VentaHuevos, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  
  // Acciones - Gastos
  cargarGastos: (loteId: string) => Promise<void>;
  registrarGasto: (gasto: Omit<Gasto, 'id' | 'tipoLote' | 'createdBy' | 'createdAt'>) => Promise<void>;
  
  // Acciones - Ingresos
  cargarIngresos: (loteId: string) => Promise<void>;
  registrarIngreso: (ingreso: Omit<IngresoPonedora, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  
  // Acciones - Estadísticas
  calcularEstadisticas: (loteId: string) => Promise<void>;
  cargarEstadisticasLote: (loteId: string) => Promise<void>;
  
  // Acciones - Mortalidad
  cargarRegistrosMortalidad: (loteId: string) => Promise<void>;
  
  // Acciones - Refrescar datos
  refrescarDatosLote: (loteId: string) => Promise<void>;
  

  // Acciones - Filtros
  setFiltro: (filtro: FiltroLote | undefined) => void;
  
  // Acciones - Errores
  clearError: () => void;

  // Acciones - Costos de producción de huevos
  calcularCostoProduccionDiario: (loteId: string, fecha?: Date) => Promise<void>;
  analizarCostoPorFases: (loteId: string) => Promise<void>;
  obtenerEstadisticasRendimientoCostos: (loteId: string, dias?: number) => Promise<void>;
  clearErrorCostos: () => void;
  resetCostosProduccion: () => void;
}

export const usePonedorasStore = create<PonedorasState>((set, get) => ({
  // Estado inicial
  lotes: [],
  loteActual: null,
  estadisticasLotes: {},
  registros: [],
  registrosDiarios: [],
  registrosHuevos: [],
  ventas: [],
  ventasHuevos: [],
  gastos: [],
  gastosLote: [],
  ingresos: [],
  estadisticas: null,
  estadisticasLote: null,
  registrosMortalidad: [],
  filtro: undefined,
  isLoading: false,
  error: null,

  // Estado inicial para costos de producción de huevos
  costosProduccion: {
    costoDelDia: null,
    analisisPorFases: null,
    estadisticasRendimiento: null,
    costosPorLote: {},
    isLoadingCostos: false,
    errorCostos: null
  },
  
  // Acciones - Lotes
  cargarLotes: async (filtro?: FiltroLote) => {
    // Evitamos múltiples cargas simultáneas
    if (get().isLoading) {
      console.log('🔄 Ya hay una carga en progreso, evitando carga duplicada');
      return;
    }
    
    set({ isLoading: true, error: null });
    console.log('🔄 Cargando lotes de ponedoras...');
    
    try {
      const filtroActual = filtro || get().filtro;
      const lotes = await obtenerLotesPonedoras(filtroActual);
      
      // Verificamos si el estado ha cambiado durante la carga
      if (get().isLoading) {
        console.log(`✅ Cargados ${lotes.length} lotes de ponedoras`);
        set({ lotes, isLoading: false });
      } else {
        console.log('⚠️ La carga fue cancelada o reemplazada por otra operación');
      }
    } catch (error: any) {
      console.error('❌ Error al cargar lotes de ponedoras:', error);
      set({ 
        isLoading: false, 
        error: error.message || 'Error al cargar lotes de ponedoras'
      });
    }
  },
  
  cargarLote: async (id: string) => {
    // Evitamos múltiples cargas simultáneas
    if (get().isLoading) {
      console.log('🔄 Ya hay una carga en progreso, evitando carga duplicada');
      return get().loteActual;
    }
    
    // Verificamos si ya tenemos el lote en memoria
    const loteEnMemoria = get().lotes.find(l => l.id === id);
    if (loteEnMemoria) {
      console.log('📋 Usando lote en memoria:', loteEnMemoria.nombre);
      set({ loteActual: loteEnMemoria });
      
      // Cargamos datos relacionados en segundo plano
      Promise.all([
        get().cargarRegistrosDiarios(id),
        get().cargarVentas(id),
        get().cargarGastos(id),
        get().cargarIngresos(id),
        get().calcularEstadisticas(id)
      ]).catch(err => console.error('Error al cargar datos relacionados:', err));
      
      return loteEnMemoria;
    }
    
    set({ isLoading: true, error: null });
    console.log(`🔄 Cargando lote de ponedoras: ${id}`);
    
    try {
      const lote = await obtenerLotePonedora(id);
      set({ loteActual: lote, isLoading: false });
      
      // Cargar datos relacionados
      if (lote) {
        console.log(`✅ Lote cargado: ${lote.nombre}`);
        
        // Actualizamos la lista de lotes si el lote no estaba en memoria
        set(state => ({
          lotes: state.lotes.some(l => l.id === id) 
            ? state.lotes 
            : [lote, ...state.lotes]
        }));
        
        // Cargamos datos relacionados en paralelo
        Promise.all([
          get().cargarRegistrosDiarios(id),
          get().cargarVentas(id),
          get().cargarGastos(id),
          get().cargarIngresos(id),
          get().calcularEstadisticas(id)
        ]).catch(err => console.error('Error al cargar datos relacionados:', err));
      }
      
      return lote;
    } catch (error: any) {
      console.error('❌ Error al cargar lote de ponedoras:', error);
      set({ 
        isLoading: false, 
        error: error.message || 'Error al cargar lote de ponedoras'
      });
      return null;
    }
  },
  
  crearLote: async (lote: Omit<LotePonedora, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>) => {
    set({ isLoading: true, error: null });
    try {
      const nuevoLote = await crearLotePonedora(lote);
      // No agregamos manualmente al estado - la suscripción se encarga
      set({ 
        loteActual: nuevoLote, 
        isLoading: false 
      });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Error al crear lote de ponedoras'
      });
    }
  },
  
  actualizarLote: async (id: string, lote: Partial<LotePonedora>) => {
    set({ isLoading: true, error: null });
    try {
      await actualizarLotePonedora(id, lote);
      
      // Actualizar en el estado
      set(state => {
        const loteActualizado = state.loteActual && state.loteActual.id === id
          ? { ...state.loteActual, ...lote, updatedAt: new Date() }
          : state.loteActual;
          
        const lotesActualizados = state.lotes.map(l => 
          l.id === id ? { ...l, ...lote, updatedAt: new Date() } : l
        );
        
        return { 
          lotes: lotesActualizados,
          loteActual: loteActualizado as LotePonedora, 
          isLoading: false 
        };
      });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Error al actualizar lote de ponedoras'
      });
    }
  },
  
  finalizarLote: async (id: string, fechaFin: Date) => {
    set({ isLoading: true, error: null });
    try {
      await finalizarLotePonedora(id, fechaFin);
      
      // Actualizar en el estado
      set(state => {
          const loteActualizado = state.loteActual && state.loteActual.id === id
            ? { ...state.loteActual, activo: false, fechaFin, updatedAt: new Date() }
            : state.loteActual;
            
          const lotesActualizados = state.lotes.map(l => 
            l.id === id ? { ...l, activo: false, fechaFin, updatedAt: new Date() } : l
          );
        
        return { 
          lotes: lotesActualizados,
          loteActual: loteActualizado as LotePonedora, 
          isLoading: false 
        };
      });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Error al finalizar lote de ponedoras'
      });
    }
  },
  
  // Acciones - Registros Diarios
  cargarRegistrosDiarios: async (loteId: string) => {
    set({ isLoading: true, error: null });
    try {
      const registros = await obtenerRegistrosDiarios(loteId);
      set({ registros, isLoading: false });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Error al cargar registros diarios'
      });
    }
  },
  
  registrarProduccion: async (registro: Omit<RegistroDiarioPonedora, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>) => {
    set({ isLoading: true, error: null });
    try {
      const nuevoRegistro = await registrarProduccionDiaria(registro);
      
      set(state => ({ 
        registros: [nuevoRegistro, ...state.registros],
        isLoading: false 
      }));
      
      // Recalcular estadísticas
      const loteActualCalc = get().loteActual;
      if (loteActualCalc) {
        get().calcularEstadisticas(loteActualCalc.id);
      }
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Error al registrar producción diaria'
      });
    }
  },
  
  // Acciones - Ventas
  cargarVentas: async (loteId: string) => {
    set({ isLoading: true, error: null });
    try {
      const ventas = await obtenerVentasHuevos(loteId);
      set({ ventas, isLoading: false });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Error al cargar ventas de huevos'
      });
    }
  },
  
  registrarVenta: async (venta: Omit<VentaHuevos, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>) => {
    set({ isLoading: true, error: null });
    try {
      const nuevaVenta = await registrarVentaHuevos(venta);
      
      set(state => ({ 
        ventas: [nuevaVenta, ...state.ventas],
        isLoading: false 
      }));
      
      // Recalcular estadísticas
      const loteActualVenta = get().loteActual;
      if (loteActualVenta) {
        get().calcularEstadisticas(loteActualVenta.id);
        get().cargarIngresos(loteActualVenta.id);
      }
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Error al registrar venta de huevos'
      });
    }
  },
  
  // Acciones - Gastos
  cargarGastos: async (loteId: string) => {
    set({ isLoading: true, error: null });
    try {
      const gastos = await obtenerGastosPonedora(loteId);
      set({ gastos, isLoading: false });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Error al cargar gastos'
      });
    }
  },
  
  registrarGasto: async (gasto: Omit<Gasto, 'id' | 'tipoLote' | 'createdBy' | 'createdAt'>) => {
    set({ isLoading: true, error: null });
    try {
      const nuevoGasto = await registrarGastoPonedora(gasto);
      
      set(state => ({ 
        gastos: [nuevoGasto, ...state.gastos],
        isLoading: false 
      }));
      
      // Recalcular estadísticas
      const loteActualCalc = get().loteActual;
      if (loteActualCalc) {
        get().calcularEstadisticas(loteActualCalc.id);
      }
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Error al registrar gasto'
      });
    }
  },
  
  // Acciones - Ingresos
  cargarIngresos: async (loteId: string) => {
    set({ isLoading: true, error: null });
    try {
      const ingresos = await obtenerIngresosPonedora(loteId);
      set({ ingresos, isLoading: false });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Error al cargar ingresos'
      });
    }
  },
  
  registrarIngreso: async (ingreso: Omit<IngresoPonedora, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>) => {
    set({ isLoading: true, error: null });
    try {
      const nuevoIngreso = await registrarIngresoPonedora(ingreso);
      
      set(state => ({ 
        ingresos: [nuevoIngreso, ...state.ingresos],
        isLoading: false 
      }));
      
      // Recalcular estadísticas
      const loteActualCalc = get().loteActual;
      if (loteActualCalc) {
        get().calcularEstadisticas(loteActualCalc.id);
      }
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Error al registrar ingreso'
      });
    }
  },
  
  // Acciones - Estadísticas
  calcularEstadisticas: async (loteId: string) => {
    set({ isLoading: true, error: null });
    try {
      const estadisticas = await calcularEstadisticasLotePonedora(loteId);
      set({ estadisticas, isLoading: false });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Error al calcular estadísticas'
      });
    }
  },
  
  // Acciones - Filtros
  setFiltro: (filtro: FiltroLote | undefined) => {
    set({ filtro });
    // Cargar lotes con el nuevo filtro
    get().cargarLotes(filtro);
  },
  
  // Acción para actualizar después de registrar mortalidad
  actualizarDespuesMortalidad: (loteId: string, cantidadMuertes: number) => {
    // Actualizar solo las estadísticas del lote específico
    get().cargarEstadisticasLotes();
  },

  // Cargar lote específico para detalles
  cargarLotePonedora: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const lote = await obtenerLotePonedora(id);
      set({ loteActual: lote, isLoading: false });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Error al cargar lote'
      });
    }
  },

  // Cargar estadísticas del lote
  cargarEstadisticasLote: async (loteId: string) => {
    try {
      const estadisticas = await calcularEstadisticasLotePonedora(loteId);
      set({ estadisticas });
    } catch (error: any) {
      console.error('Error al cargar estadísticas:', error);
    }
  },

  // Cargar gastos del lote
  cargarGastosLote: async (loteId: string) => {
    try {
      const gastos = await obtenerGastosPonedora(loteId);
      set({ gastosLote: gastos });
    } catch (error: any) {
      console.error('Error al cargar gastos:', error);
    }
  },

  // Cargar ventas del lote
  cargarVentasHuevos: async (loteId: string) => {
    try {
      const ventas = await obtenerVentasHuevos(loteId);
      set({ ventasHuevos: ventas });
    } catch (error: any) {
      console.error('Error al cargar ventas:', error);
    }
  },

  // Cargar registros de mortalidad del lote
  cargarRegistrosMortalidad: async (loteId: string) => {
    try {
      const registros = await obtenerRegistrosMortalidad(loteId, TipoAve.PONEDORA);
      set({ registrosMortalidad: registros });
    } catch (error: any) {
      console.error('Error al cargar registros de mortalidad:', error);
    }
  },

  // Cargar registros de huevos del lote
  cargarRegistrosHuevos: async (loteId: string) => {
    try {
      const registros = await obtenerRegistrosHuevos(loteId);
      set({ registrosHuevos: registros });
    } catch (error: any) {
      console.error('Error al cargar registros de huevos:', error);
    }
  },

  // Registrar producción de huevos
  registrarProduccionHuevos: async (registro: { loteId: string; fecha: Date; cantidadHuevos: number; observaciones?: string }) => {
    set({ isLoading: true, error: null });
    try {
      const nuevoRegistro = await registrarProduccionHuevos(registro);
      
      // Actualizar registros de huevos en el estado
      set(state => ({ 
        registrosHuevos: [nuevoRegistro, ...state.registrosHuevos],
        isLoading: false 
      }));
      
      // Refrescar datos del lote para actualizar estadísticas
      await get().refrescarDatosLote(registro.loteId);
      
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Error al registrar producción de huevos'
      });
      throw error;
    }
  },

  // Cargar estadísticas básicas para todos los lotes
  cargarEstadisticasLotes: async () => {
    try {
      const { lotes } = get();
      const estadisticas: { [loteId: string]: { huevos: number; muertes: number } } = {};

      // Importar servicio de ventas para obtener ventas de huevos
      const { getVentasPorLote } = await import('../services/ventas.service');

      for (const lote of lotes) {
        // Cargar registros de huevos
        const registrosHuevos = await obtenerRegistrosHuevos(lote.id);
        const huevosProducidos = registrosHuevos.reduce((total, registro) => total + registro.cantidad, 0);

        // Obtener ventas de huevos para este lote
        let huevosVendidos = 0;
        try {
          const ventas = await getVentasPorLote(lote.id, TipoAve.PONEDORA);
          const ventasConfirmadas = ventas.filter(v => v.estado === 'CONFIRMADA');
          
          huevosVendidos = ventasConfirmadas.reduce((sum, venta) => {
            return sum + venta.items.reduce((itemSum: number, item: any) => {
              if (item.producto.tipo === 'HUEVOS') {
                const productoHuevos = item.producto;
                if (productoHuevos.unidadVenta === 'CAJAS') {
                  return itemSum + (item.cantidad * (productoHuevos.cantidadPorCaja || 30));
                }
                return itemSum + item.cantidad;
              }
              return itemSum;
            }, 0);
          }, 0);
        } catch (error) {
          console.warn(`Error al obtener ventas de huevos para lote ${lote.id}:`, error);
        }

        // Calcular huevos disponibles (producidos - vendidos)
        const huevos = Math.max(0, huevosProducidos - huevosVendidos);

        // Cargar registros de mortalidad
        const registrosMortalidad = await obtenerRegistrosMortalidad(lote.id, TipoAve.PONEDORA);
        const muertes = registrosMortalidad.reduce((total, registro) => total + registro.cantidad, 0);

        estadisticas[lote.id] = { huevos, muertes };
      }

      set({ estadisticasLotes: estadisticas });
    } catch (error: any) {
      console.error('Error al cargar estadísticas de lotes:', error);
    }
  },

  // Refrescar todos los datos de un lote específico
  refrescarDatosLote: async (loteId: string) => {
    try {
      // Actualizar estadísticas
      await get().cargarEstadisticasLotes();
    } catch (error: any) {
      console.error('Error al refrescar datos del lote:', error);
    }
  },


  // Eliminar lote
  eliminarLote: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await eliminarLotePonedora(id);
      
      // Eliminar del estado
      set(state => ({
        lotes: state.lotes.filter(l => l.id !== id),
        loteActual: state.loteActual?.id === id ? null : state.loteActual,
        isLoading: false
      }));
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Error al eliminar lote'
      });
      throw error;
    }
  },

  // Suscripción a ponedoras
  suscribirseAPonedoras: () => {
    return subscribeToPonedoras(async (lotes) => {
      set({ lotes, error: null });
      
      // 🐔 MONITOREO AUTOMÁTICO DE BIENESTAR ANIMAL
      try {
        console.log('🐔 [Ponedoras] Ejecutando monitoreo automático de bienestar animal...');
        
        const { useMortalityStore } = await import('./mortalityStore');
        
        // Para ponedoras necesitamos registros de huevos
        const state = usePonedorasStore.getState();
        const registrosHuevos = state.registrosHuevos || [];
        const registrosMortalidad = useMortalityStore.getState().registros || [];
        
        await runAutomaticWelfareCheck(
          lotes,
          [], // Ponedoras no usan registros de peso regularmente
          registrosHuevos,
          registrosMortalidad
        );
        
        console.log('✅ [Ponedoras] Monitoreo de bienestar completado');
      } catch (error) {
        console.error('❌ [Ponedoras] Error en monitoreo automático:', error);
      }
    });
  },

  // Acciones - Errores
  clearError: () => set({ error: null }),

  // Acciones - Costos de producción de huevos
  calcularCostoProduccionDiario: async (loteId: string, fecha: Date = new Date()) => {
    set(state => ({
      costosProduccion: {
        ...state.costosProduccion,
        isLoadingCostos: true,
        errorCostos: null
      }
    }));

    try {
      const costoDelDia = await costosProduccionHuevosService.calcularCostoProduccionDiario(loteId, fecha);
      
      set(state => ({
        costosProduccion: {
          ...state.costosProduccion,
          costoDelDia,
          isLoadingCostos: false,
          // Actualizar cache de costos por lote
          costosPorLote: {
            ...state.costosProduccion.costosPorLote,
            [loteId]: costoDelDia 
              ? [costoDelDia, ...(state.costosProduccion.costosPorLote[loteId] || []).filter(c => 
                  c.fecha.toDateString() !== fecha.toDateString()
                )]
              : state.costosProduccion.costosPorLote[loteId] || []
          }
        }
      }));

      console.log('✅ Costo de producción diario calculado:', costoDelDia);
    } catch (error: any) {
      console.error('❌ Error al calcular costo de producción diario:', error);
      set(state => ({
        costosProduccion: {
          ...state.costosProduccion,
          isLoadingCostos: false,
          errorCostos: error.message || 'Error al calcular costo de producción diario'
        }
      }));
    }
  },

  analizarCostoPorFases: async (loteId: string) => {
    set(state => ({
      costosProduccion: {
        ...state.costosProduccion,
        isLoadingCostos: true,
        errorCostos: null
      }
    }));

    try {
      const analisisPorFases = await costosProduccionHuevosService.analizarCostoPorFases(loteId);
      
      set(state => ({
        costosProduccion: {
          ...state.costosProduccion,
          analisisPorFases,
          isLoadingCostos: false
        }
      }));

      console.log('✅ Análisis por fases completado:', analisisPorFases);
    } catch (error: any) {
      console.error('❌ Error al analizar costo por fases:', error);
      set(state => ({
        costosProduccion: {
          ...state.costosProduccion,
          isLoadingCostos: false,
          errorCostos: error.message || 'Error al analizar costo por fases'
        }
      }));
    }
  },

  obtenerEstadisticasRendimientoCostos: async (loteId: string, dias: number = 30) => {
    set(state => ({
      costosProduccion: {
        ...state.costosProduccion,
        isLoadingCostos: true,
        errorCostos: null
      }
    }));

    try {
      const fechaFin = new Date();
      const fechaInicio = new Date();
      fechaInicio.setDate(fechaInicio.getDate() - dias);

      const estadisticasRendimiento = await costosProduccionHuevosService.obtenerEstadisticasRendimiento(
        loteId,
        fechaInicio,
        fechaFin
      );
      
      set(state => ({
        costosProduccion: {
          ...state.costosProduccion,
          estadisticasRendimiento,
          isLoadingCostos: false
        }
      }));

      console.log('✅ Estadísticas de rendimiento obtenidas:', estadisticasRendimiento);
    } catch (error: any) {
      console.error('❌ Error al obtener estadísticas de rendimiento:', error);
      set(state => ({
        costosProduccion: {
          ...state.costosProduccion,
          isLoadingCostos: false,
          errorCostos: error.message || 'Error al obtener estadísticas de rendimiento'
        }
      }));
    }
  },

  clearErrorCostos: () => set(state => ({
    costosProduccion: {
      ...state.costosProduccion,
      errorCostos: null
    }
  })),

  resetCostosProduccion: () => set(state => ({
    costosProduccion: {
      costoDelDia: null,
      analisisPorFases: null,
      estadisticasRendimiento: null,
      costosPorLote: {},
      isLoadingCostos: false,
      errorCostos: null
    }
  }))
}));




