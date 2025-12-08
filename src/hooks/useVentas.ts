/**
 * useVentas - Hook para estado y acciones de ventas
 * 
 * Maneja:
 * - Estado centralizado de ventas
 * - Acciones para crear, obtener y cancelar ventas
 * - Validación en tiempo real
 * - Manejo de errores específicos
 */

import { useCallback, useEffect, useState } from 'react';
import { ventasService, Venta, CrearVenta, ItemVenta } from '../services/ventas.service';
import { Producto, TipoProducto, ProductoLibrasEngorde } from '../types/facturacion';

interface UseVentasReturn {
  // Estado
  ventas: Venta[];
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  crearVenta: (datos: CrearVenta) => Promise<Venta | null>;
  getVentas: () => Promise<void>;
  cancelarVenta: (id: string) => Promise<void>;
  
  // Utilidades
  calcularItemVenta: (producto: Producto, cantidad: number, descuento?: number) => ItemVenta;
  clearError: () => void;
}

export const useVentas = (): UseVentasReturn => {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carga las ventas del usuario
   */
  const getVentas = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 [useVentas] Iniciando carga de ventas...');
      const ventasData = await ventasService.getVentas();
      
      console.log(`✅ [useVentas] ${ventasData.length} ventas recibidas del servicio`);
      console.log('📊 [useVentas] Primeras ventas:', ventasData.slice(0, 2).map(v => ({
        id: v.id,
        numero: v.numero,
        fecha: v.fecha,
        estado: v.estado,
      })));
      
      setVentas(ventasData);
      
      console.log(`✅ [useVentas] ${ventasData.length} ventas cargadas en estado`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar ventas';
      setError(errorMessage);
      console.error('❌ [useVentas] Error al cargar ventas:', err);
      // Asegurar que el estado de carga se actualice incluso si hay error
      setVentas([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Crea una nueva venta
   */
  const crearVenta = useCallback(async (datos: CrearVenta): Promise<Venta | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🛒 [useVentas] Iniciando creación de venta...');
      
      const nuevaVenta = await ventasService.crearVenta(datos);
      
      // Validar que la venta tenga ID
      if (!nuevaVenta || !nuevaVenta.id) {
        console.error('❌ [useVentas] ERROR: Venta creada sin ID!', nuevaVenta);
        throw new Error('La venta se creó sin ID. Por favor, intente nuevamente.');
      }
      
      console.log(`✅ [useVentas] Venta ${nuevaVenta.numero} creada exitosamente con ID: ${nuevaVenta.id}`);
      
      // Actualizar estado local inmediatamente
      setVentas(prev => [nuevaVenta, ...prev]);
      
      // Recargar todas las ventas en segundo plano para asegurar consistencia
      getVentas().catch(err => {
        console.warn('⚠️ [useVentas] Error al recargar ventas después de crear:', err);
      });
      
      return nuevaVenta;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear venta';
      setError(errorMessage);
      console.error('❌ [useVentas] Error al crear venta:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getVentas]);

  /**
   * Cancela una venta
   */
  const cancelarVenta = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await ventasService.cancelarVenta(id);
      
      // Actualizar estado local
      setVentas(prev => prev.filter(venta => venta.id !== id));
      
      console.log(`✅ [useVentas] Venta ${id} cancelada`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cancelar venta';
      setError(errorMessage);
      console.error('❌ [useVentas] Error al cancelar venta:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Calcula un item de venta desde un producto
   */
  const calcularItemVenta = useCallback((
    producto: Producto,
    cantidad: number,
    descuento: number = 0
  ): ItemVenta => {
    const subtotal = producto.precioUnitario * cantidad;
    const total = subtotal - descuento;
    
    // Calcular cantidad de pollos si es venta por libras
    let cantidadPollos: number | undefined;
    if (producto.tipo === TipoProducto.LIBRAS_POLLOS_ENGORDE) {
      const productoLibras = producto as ProductoLibrasEngorde;
      if (productoLibras.pesoPromedio && productoLibras.pesoPromedio > 0) {
        // Calcular pollos necesarios: libras vendidas / peso promedio (redondeado hacia arriba)
        cantidadPollos = Math.ceil(cantidad / productoLibras.pesoPromedio);
      }
    }
    
    return {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      productoId: producto.id,
      producto,
      cantidad,
      precioUnitario: producto.precioUnitario,
      descuento,
      subtotal,
      total,
      cantidadPollos,
    };
  }, []);

  /**
   * Limpia el error actual
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cargar ventas al montar el hook
  useEffect(() => {
    getVentas();
  }, [getVentas]);

  return {
    // Estado
    ventas,
    isLoading,
    error,
    
    // Acciones
    crearVenta,
    getVentas,
    cancelarVenta,
    
    // Utilidades
    calcularItemVenta,
    clearError,
  };
};
