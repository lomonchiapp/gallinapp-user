/**
 * Store para la gestión de artículos usando Zustand
 */

import { create } from 'zustand';
import {
  crearArticulo,
  obtenerArticulos
} from '../services/gastos.service';
import { Articulo } from '../types/gastos/articulo';

interface ArticulosState {
  // Estado
  articulos: Articulo[];
  articuloActual: Articulo | null;
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  loadArticulos: (soloActivos?: boolean) => Promise<void>;
  crearNuevoArticulo: (articulo: Omit<Articulo, 'id'>) => Promise<void>;
  clearError: () => void;
}

export const useArticulosStore = create<ArticulosState>((set, get) => ({
  // Estado inicial
  articulos: [],
  articuloActual: null,
  isLoading: false,
  error: null,
  
  // Cargar todos los artículos
  loadArticulos: async (soloActivos = true) => {
    set({ isLoading: true, error: null });
    try {
      const articulos = await obtenerArticulos(soloActivos);
      set({ articulos: articulos as any, isLoading: false });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Error al cargar artículos' 
      });
    }
  },
  
  // Crear un nuevo artículo
  crearNuevoArticulo: async (articulo: Omit<Articulo, 'id'>) => {
    set({ isLoading: true, error: null });
    try {
      const nuevoArticulo = await crearArticulo(articulo);
      
      set(state => ({ 
        articulos: [...state.articulos, nuevoArticulo as any],
        articuloActual: nuevoArticulo as any,
        isLoading: false 
      }));
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Error al crear artículo' 
      });
    }
  },
  
  // Limpiar error
  clearError: () => set({ error: null }),
}));




