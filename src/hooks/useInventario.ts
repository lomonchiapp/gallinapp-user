/**
 * useInventario - Hook para productos y disponibilidad
 * 
 * Maneja:
 * - Estado de productos disponibles
 * - Cache inteligente con invalidación selectiva
 * - Búsqueda y filtrado de productos
 * - Actualizaciones en tiempo real
 */

import { useCallback, useEffect, useState } from 'react';
import { inventarioService, getProductos, invalidateInventarioCache, preloadCommonProducts } from '../services/inventario.service';
import { Producto, TipoProducto, ProductoHuevos } from '../types/facturacion';
import { TipoAve } from '../types/enums';

interface UseInventarioReturn {
  // Estado
  productos: Producto[];
  productosLotes: Producto[];
  productosUnidades: Producto[];
  productosHuevos: ProductoHuevos[];
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  actualizarProductos: (forceRefresh?: boolean) => Promise<void>;
  buscarProductos: (termino: string) => Producto[];
  filtrarPorTipo: (tipo: TipoProducto) => Producto[];
  filtrarPorAve: (tipoAve: TipoAve) => Producto[];
  invalidarCache: (tipo?: 'ponedoras' | 'levantes' | 'engorde' | 'huevos' | 'all') => void;
  
  // Utilidades
  getProductoPorId: (id: string) => Producto | null;
  clearError: () => void;
}

export const useInventario = (): UseInventarioReturn => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Actualiza los productos desde el inventario
   */
  const actualizarProductos = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`🔄 [useInventario] Actualizando productos (forceRefresh: ${forceRefresh})...`);
      
      const productosData = await getProductos(forceRefresh);
      setProductos(productosData);
      
      console.log(`✅ [useInventario] ${productosData.length} productos actualizados`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar productos';
      setError(errorMessage);
      console.error('❌ [useInventario] Error al actualizar productos:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Busca productos por término
   */
  const buscarProductos = useCallback((termino: string): Producto[] => {
    if (!termino.trim()) return productos;
    
    const terminoLower = termino.toLowerCase();
    return productos.filter(producto => 
      producto.nombre.toLowerCase().includes(terminoLower) ||
      producto.descripcion?.toLowerCase().includes(terminoLower)
    );
  }, [productos]);

  /**
   * Filtra productos por tipo
   */
  const filtrarPorTipo = useCallback((tipo: TipoProducto): Producto[] => {
    return productos.filter(producto => producto.tipo === tipo);
  }, [productos]);

  /**
   * Filtra productos por tipo de ave
   */
  const filtrarPorAve = useCallback((tipoAve: TipoAve): Producto[] => {
    return productos.filter(producto => producto.tipoAve === tipoAve);
  }, [productos]);

  /**
   * Invalida cache selectivamente
   */
  const invalidarCache = useCallback((tipo?: 'ponedoras' | 'levantes' | 'engorde' | 'huevos' | 'all') => {
    invalidateInventarioCache(tipo);
    console.log(`🗑️ [useInventario] Cache de inventario invalidado: ${tipo || 'all'}`);
  }, []);

  /**
   * Obtiene un producto por ID
   */
  const getProductoPorId = useCallback((id: string): Producto | null => {
    return productos.find(producto => producto.id === id) || null;
  }, [productos]);

  /**
   * Limpia el error actual
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Productos separados por categoría (computed)
  const productosLotes = productos.filter(p => p.tipo === TipoProducto.LOTE_COMPLETO);
  const productosUnidades = productos.filter(p => 
    p.tipo !== TipoProducto.LOTE_COMPLETO && p.tipo !== TipoProducto.HUEVOS
  );
  const productosHuevos = productos.filter(p => p.tipo === TipoProducto.HUEVOS) as ProductoHuevos[];

  // Cargar productos al montar el hook
  useEffect(() => {
    actualizarProductos();
    
    // Pre-cargar productos comunes
    preloadCommonProducts().catch(error => {
      console.warn('⚠️ [useInventario] Error en pre-carga:', error);
    });
  }, [actualizarProductos]);

  return {
    // Estado
    productos,
    productosLotes,
    productosUnidades,
    productosHuevos,
    isLoading,
    error,
    
    // Acciones
    actualizarProductos,
    buscarProductos,
    filtrarPorTipo,
    filtrarPorAve,
    invalidarCache,
    
    // Utilidades
    getProductoPorId,
    clearError,
  };
};




