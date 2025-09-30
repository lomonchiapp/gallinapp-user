/**
 * Store para el módulo de pollos israelíes usando Zustand
 */

import { create } from 'zustand';
import {
    actualizarLoteLevante,
    calcularEstadisticasLoteLevante,
    crearLoteLevante,
    EstadisticasLoteLevante,
    FiltroLoteLevante,
    finalizarLoteLevante,
    IngresoLevante,
    obtenerGastosLevante,
    obtenerLoteLevante,
    obtenerLotesLevantes,
    obtenerMortalidadLevante,
    obtenerRegistrosEdad,
    obtenerVentasLevante,
    registrarEdadLevante,
    registrarGastoLevante,
    registrarMortalidadLevante,
    registrarVentaLevante,
    subscribeToLevantes
} from '../services/levantes.service';
import {
    EdadRegistro,
    Gasto,
    LoteLevante,
    RegistroMortalidad
} from '../types';

interface LevantesState {
    // Estado
    lotes: LoteLevante[];
    loteActual: LoteLevante | null;
    registrosEdad: EdadRegistro[];
    mortalidad: RegistroMortalidad[];
    gastos: Gasto[];
    ventas: IngresoLevante[];
    estadisticas: EstadisticasLoteLevante | null;
    filtro: FiltroLoteLevante | null;
    isLoading: boolean;
    error: string | null;
    observaciones: string | null;
    
    // Acciones - Lotes
    cargarLotes: (filtro?: FiltroLoteLevante) => Promise<void>;
    cargarLote: (id: string) => Promise<LoteLevante | null>;
    crearLote: (lote: Omit<LoteLevante, 'id'>) => Promise<void>;
    actualizarLote: (id: string, lote: Partial<LoteLevante>) => Promise<void>;
    finalizarLote: (id: string) => Promise<void>;
    
    // Acciones - Registros de Edad
    cargarRegistrosEdad: (loteId: string) => Promise<void>;
    registrarEdad: (registro: Omit<EdadRegistro, 'id'>) => Promise<void>;
    
    // Acciones - Mortalidad
    cargarMortalidad: (loteId: string) => Promise<void>;
    registrarMortalidad: (mortalidad: Omit<RegistroMortalidad, 'id' | 'tipoLote' | 'createdBy' | 'createdAt'>) => Promise<void>;
    
    // Acciones - Gastos
    cargarGastos: (loteId: string) => Promise<void>;
    registrarGasto: (gasto: Omit<Gasto, 'id' | 'tipoLote' | 'createdBy' | 'createdAt'>) => Promise<void>;
    
    // Acciones - Ventas
    cargarVentas: (loteId: string) => Promise<void>;
    registrarVenta: (venta: Omit<IngresoLevante, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    
    // Acciones - Estadísticas
    calcularEstadisticas: (loteId: string) => Promise<void>;
    
    // Acciones - Filtros
    setFiltro: (filtro: FiltroLoteLevante | null) => void;
    
    // Acciones - Errores
    clearError: () => void;
    setObservaciones: (observaciones: string) => void;

    // Suscripcion a levantes
    suscribirseALevantes: () => () => void;

}

export const useLevantesStore = create<LevantesState>((set, get) => ({
    // Estado inicial
    lotes: [],
    loteActual: null,
    registrosEdad: [],
    mortalidad: [],
    gastos: [],
    ventas: [],
    estadisticas: null,
    filtro: null,
    isLoading: false,
    error: null,
    observaciones: null,
    suscribirseALevantes: () => {
        return subscribeToLevantes(lotes => {
            set({ lotes });
        });
    },
    // Acciones - Lotes
    cargarLotes: async () => {
        set({ isLoading: true, error: null });
        try {
            const lotes = await obtenerLotesLevantes();
            set({ lotes, isLoading: false });
        } catch (error: any) {
            set({ 
                isLoading: false, 
                error: error.message || 'Error al cargar lotes israelíes'
            });
        }
    },
    
    cargarLote: async (id: string) => {
        // Verificamos si ya tenemos el lote en memoria
        const loteEnMemoria = get().lotes.find(l => l.id === id);
        if (loteEnMemoria) {
            console.log('📋 Usando lote en memoria:', loteEnMemoria.nombre);
            set({ loteActual: loteEnMemoria });
            return loteEnMemoria;
        }
        
        set({ isLoading: true, error: null });
        try {
            const lote = await obtenerLoteLevante(id);
            set({ loteActual: lote, isLoading: false });
            
            // Actualizamos la lista de lotes si el lote no estaba en memoria
            if (lote) {
                set(state => ({
                    lotes: state.lotes.some(l => l.id === id) 
                        ? state.lotes 
                        : [lote, ...state.lotes]
                }));
                
                // Cargar datos relacionados
                get().cargarRegistrosEdad(id);
                get().cargarMortalidad(id);
                get().cargarGastos(id);
                get().cargarVentas(id);
                get().calcularEstadisticas(id);
            }
            
            return lote;
        } catch (error: any) {
            set({ 
                isLoading: false, 
                error: error.message || 'Error al cargar lote israelí'
            });
            return null;
        }
    },
    
    crearLote: async (lote: Omit<LoteLevante, 'id'>) => {
        set({ isLoading: true, error: null });
        try {
            const nuevoLote = await crearLoteLevante(lote);
            // No agregamos manualmente al estado - la suscripción se encarga
            set({ 
                loteActual: nuevoLote, 
                isLoading: false 
            });
        } catch (error: any) {
            set({ 
                isLoading: false, 
                error: error.message || 'Error al crear lote israelí'
            });
        }
    },
    
    actualizarLote: async (id: string, lote: Partial<LoteLevante>) => {
        set({ isLoading: true, error: null });
        try {
            await actualizarLoteLevante(id, lote);
            
            // Actualizar en el estado
            set(state => {
                const loteActualizado = state.loteActual && state.loteActual.id === id
                    ? { ...state.loteActual, ...lote }
                    : state.loteActual;
                    
                const lotesActualizados = state.lotes.map(l => 
                    l.id === id ? { ...l, ...lote } : l
                );
                
                return { 
                    lotes: lotesActualizados,
                        loteActual: loteActualizado as LoteLevante, 
                    isLoading: false 
                };
            });
        } catch (error: any) {
            set({ 
                isLoading: false, 
                error: error.message || 'Error al actualizar lote israelí'
            });
        }
    },
    
    finalizarLote: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
            await finalizarLoteLevante(id);
            
            // Actualizar en el estado
            set(state => {
                const loteActualizado = state.loteActual && state.loteActual.id === id
                    ? { ...state.loteActual, activo: false }
                    : state.loteActual;
                    
                const lotesActualizados = state.lotes.map(l => 
                    l.id === id ? { ...l, activo: false } : l
                );
                
                return { 
                    lotes: lotesActualizados,
                    loteActual: loteActualizado as LoteLevante, 
                    isLoading: false 
                };
            });
        } catch (error: any) {
            set({ 
                isLoading: false, 
                error: error.message || 'Error al finalizar lote israelí'
            });
        }
    },
    
    // Acciones - Registros de Edad
    cargarRegistrosEdad: async (loteId: string) => {
        try {
            const registros = await obtenerRegistrosEdad(loteId);
            set({ registrosEdad: registros });
        } catch (error: any) {
            set({ error: error.message || 'Error al cargar registros de edad' });
        }
    },
    
    registrarEdad: async (registro: Omit<EdadRegistro, 'id'>) => {
        set({ isLoading: true, error: null });
        try {
            const nuevoRegistro = await registrarEdadLevante(registro);
            
            set(state => ({ 
                registrosEdad: [nuevoRegistro, ...state.registrosEdad],
                isLoading: false 
            }));
            
            // Recalcular estadísticas
            if (get().loteActual) {
                get().calcularEstadisticas(get().loteActual?.id || '');
            }
        } catch (error: any) {
            set({ 
                isLoading: false, 
                error: error.message || 'Error al registrar edad'
            });
        }
    },
    
    // Acciones - Mortalidad
    cargarMortalidad: async (loteId: string) => {
        try {
            const mortalidad = await obtenerMortalidadLevante(loteId);
            set({ mortalidad });
        } catch (error: any) {
            set({ error: error.message || 'Error al cargar mortalidad' });
        }
    },
    
    registrarMortalidad: async (mortalidad: Omit<RegistroMortalidad, 'id' | 'tipoLote' | 'createdBy' | 'createdAt'>) => {
        set({ isLoading: true, error: null });
        try {
            const nuevoRegistro = await registrarMortalidadLevante(mortalidad);
            
            set(state => ({ 
                mortalidad: [nuevoRegistro, ...state.mortalidad],
                isLoading: false 
            }));
            
            // Recalcular estadísticas
            if (get().loteActual) {
                get().calcularEstadisticas(get().loteActual?.id || '');
            }
        } catch (error: any) {
            set({ 
                isLoading: false, 
                error: error.message || 'Error al registrar mortalidad'
            });
        }
    },
    
    // Acciones - Gastos
    cargarGastos: async (loteId: string) => {
        try {
            const gastos = await obtenerGastosLevante(loteId);
            set({ gastos });
        } catch (error: any) {
            set({ error: error.message || 'Error al cargar gastos' });
        }
    },
    
    registrarGasto: async (gasto: Omit<Gasto, 'id' | 'tipoLote' | 'createdBy' | 'createdAt'>) => {
        set({ isLoading: true, error: null });
        try {
            const nuevoGasto = await registrarGastoLevante(gasto);
            
            set(state => ({ 
                gastos: [nuevoGasto, ...state.gastos],
                isLoading: false 
            }));
            
            // Recalcular estadísticas
            if (get().loteActual) {
                get().calcularEstadisticas(get().loteActual?.id || '');
            }
        } catch (error: any) {
            set({ 
                isLoading: false, 
                error: error.message || 'Error al registrar gasto'
            });
        }
    },
    
    // Acciones - Ventas
    cargarVentas: async (loteId: string) => {
        try {
            const ventas = await obtenerVentasLevante(loteId);
            set({ ventas });
        } catch (error: any) {
            set({ error: error.message || 'Error al cargar ventas' });
        }
    },
    
    registrarVenta: async (venta: Omit<IngresoLevante, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>) => {
        set({ isLoading: true, error: null });
        try {
            const nuevaVenta = await registrarVentaLevante(venta);
            
            set(state => ({ 
                ventas: [nuevaVenta, ...state.ventas],
                isLoading: false 
            }));
            
            // Recalcular estadísticas
            if (get().loteActual) {
                get().calcularEstadisticas(get().loteActual?.id || '');
            }
        } catch (error: any) {
            set({ 
                isLoading: false, 
                error: error.message || 'Error al registrar venta'
            });
        }
    },
    
    // Acciones - Estadísticas
    calcularEstadisticas: async (loteId: string) => {
        try {
            const estadisticas = await calcularEstadisticasLoteLevante(loteId);
            set({ estadisticas });
        } catch (error: any) {
            set({ error: error.message || 'Error al calcular estadísticas' });
        }
    },
    
    // Acciones - Filtros
    setFiltro: (filtro: FiltroLoteLevante | null) => {
        set({ filtro });
        // Cargar lotes con el nuevo filtro
        get().cargarLotes(filtro || undefined);
    },
    
    // Acciones - Errores
    clearError: () => set({ error: null }),
    setObservaciones: (observaciones: string) => set({ observaciones })
}));
