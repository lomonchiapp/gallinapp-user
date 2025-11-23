/**
 * Hook para gestión de facturación
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { suscribirseALotesEngorde } from '../services/engorde.service';
import { subscribeToLevantes } from '../services/levantes.service';
import { subscribeToPonedoras } from '../services/ponedoras.service';
import { inventarioService } from '../services/inventario.service';
import { ventasService } from '../services/ventas.service';
import { facturasService } from '../services/facturas.service';
import { configService } from '../services/config.service';
import { useClientes } from './useClientes';
import { LoteEngorde } from '../types/engorde/loteEngorde';
import {
    Cliente,
    ConfiguracionFacturacion,
    CrearCliente,
    CrearFactura,
    Factura,
    Producto,
    ResumenVentas,
    EstadoFactura,
} from '../types/facturacion';
import { LoteLevante } from '../types/levantes/loteLevante';
import { LotePonedora } from '../types/ponedoras/lotePonedora';

export interface UseFacturacionReturn {
  // Estados
  facturas: Factura[];
  clientes: Cliente[];
  productos: Producto[];
  lotes: {
    ponedoras: LotePonedora[];
    levantes: LoteLevante[];
    engordes: LoteEngorde[];
  };
  configuracion: ConfiguracionFacturacion | null;
  loading: boolean;
  error: string | null;

  // Métodos de facturación
  crearFactura: (datos: CrearFactura) => Promise<Factura | null>;
  actualizarFactura: (id: string, datos: Partial<Factura>) => Promise<Factura | null>;
  obtenerFactura: (id: string) => Promise<Factura | null>;
  
  // Métodos de clientes
  crearCliente: (datos: CrearCliente) => Promise<Cliente | null>;
  actualizarCliente: (id: string, datos: Partial<Cliente>) => Promise<Cliente | null>;
  
  // Métodos de productos
  actualizarProductos: () => Promise<void>;
  
  // Reportes
  generarResumenVentas: (fechaInicio: Date, fechaFin: Date) => Promise<ResumenVentas | null>;
  
  // Configuración
  actualizarConfiguracion: (config: Partial<ConfiguracionFacturacion>) => Promise<void>;
  
  // Utilidades
  refrescarDatos: () => Promise<void>;
  limpiarError: () => void;
}

export const useFacturacion = (): UseFacturacionReturn => {
  // Usar hook de clientes
  const { clientes, crearCliente: crearClienteHook, actualizarCliente: actualizarClienteHook } = useClientes();
  
  // Estados
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [lotesPonedora, setLotesPonedora] = useState<LotePonedora[]>([]);
  const [lotesLevante, setLotesLevante] = useState<LoteLevante[]>([]);
  const [lotesEngorde, setLotesEngorde] = useState<LoteEngorde[]>([]);
  const lotes = useMemo(() => ({ ponedoras: lotesPonedora, levantes: lotesLevante, engordes: lotesEngorde }), [lotesPonedora, lotesLevante, lotesEngorde]);
  const [configuracion, setConfiguracion] = useState<ConfiguracionFacturacion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatosIniciales();

    const unsubscribePonedoras = subscribeToPonedoras(setLotesPonedora);
    const unsubscribeLevantes = subscribeToLevantes(setLotesLevante);
    const unsubscribeEngorde = suscribirseALotesEngorde(setLotesEngorde);

    return () => {
      unsubscribePonedoras();
      unsubscribeLevantes();
      unsubscribeEngorde();
    };
  }, []);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        facturasData,
        productosData,
        configuracionData,
      ] = await Promise.all([
        facturasService.getFacturas(),
        inventarioService.getProductos(),
        configService.getConfigAsync(),
      ]);

      setFacturas(facturasData);
      setProductos(productosData);
      setConfiguracion(configuracionData);
      
      console.log('✅ Datos iniciales cargados:', {
        facturas: facturasData.length,
        productos: productosData.length,
      });
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al cargar datos';
      setError(mensaje);
      console.error('❌ Error en cargarDatosIniciales:', err);
    } finally {
      setLoading(false);
    }
  };

  // Métodos de facturación
  // NOTA: Este método está deprecado. Usar useVentas.crearVenta() en su lugar
  const crearFactura = useCallback(async (datos: CrearFactura): Promise<Factura | null> => {
    try {
      setLoading(true);
      setError(null);

      console.warn('⚠️ [useFacturacion] crearFactura está deprecado. Usar useVentas.crearVenta() en su lugar');
      
      // Convertir CrearFactura a formato de venta
      const venta = await ventasService.crearVenta({
        cliente: datos.cliente,
        items: datos.items.map(item => ({
          id: item.id,
          productoId: item.productoId,
          producto: item.producto,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          descuento: item.descuento,
          subtotal: item.subtotal,
          total: item.total,
        })),
        metodoPago: datos.metodoPago || 'efectivo',
        observaciones: datos.observaciones,
      });

      // Generar factura automáticamente
      const nuevaFactura = await facturasService.generarFactura({ ventaId: venta.id });
      setFacturas(prev => [nuevaFactura, ...prev]);

      // Actualizar productos disponibles después de la venta
      await actualizarProductos();

      return nuevaFactura;
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al crear factura';
      setError(mensaje);
      Alert.alert('Error', mensaje);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const actualizarFactura = useCallback(async (
    id: string, 
    datos: Partial<Factura>
  ): Promise<Factura | null> => {
    try {
      setLoading(true);
      setError(null);

      // Por ahora solo soportamos anulación de factura
      if (datos.estado === EstadoFactura.CANCELADA) {
        const facturaAnulada = await facturasService.anularFactura(id);
        
        setFacturas(prev => 
          prev.map(f => f.id === id ? facturaAnulada : f)
        );

        return facturaAnulada;
      } else {
        throw new Error('Solo se puede anular la factura. Para otros cambios, usar el servicio de facturas directamente.');
      }
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al actualizar factura';
      setError(mensaje);
      Alert.alert('Error', mensaje);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const obtenerFactura = useCallback(async (id: string): Promise<Factura | null> => {
    try {
      const factura = await facturasService.getFactura(id);
      return factura;
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al obtener factura';
      setError(mensaje);
      return null;
    }
  }, []);

  // Métodos de clientes (delegados al hook useClientes)
  const crearCliente = useCallback(async (datos: CrearCliente): Promise<Cliente | null> => {
    return await crearClienteHook(datos);
  }, [crearClienteHook]);

  const actualizarCliente = useCallback(async (
    id: string, 
    datos: Partial<Cliente>
  ): Promise<Cliente | null> => {
    await actualizarClienteHook(id, datos);
    return clientes.find(c => c.id === id) || null;
  }, [actualizarClienteHook, clientes]);

  // Métodos de productos
  const actualizarProductos = useCallback(async (): Promise<void> => {
    try {
      // Generar productos desde el inventario actual
      const nuevosProductos = await inventarioService.getProductos(true); // forceRefresh = true
      setProductos(nuevosProductos);
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al actualizar productos';
      setError(mensaje);
      console.error('Error al actualizar productos:', err);
    }
  }, []);

  // Reportes
  const generarResumenVentas = useCallback(async (
    fechaInicio: Date, 
    fechaFin: Date
  ): Promise<ResumenVentas | null> => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Implementar generarResumenVentas en ventasService
      // Por ahora retornar resumen vacío
      console.warn('⚠️ [useFacturacion] generarResumenVentas no implementado aún en ventasService');
      return {
        periodo: { inicio: fechaInicio, fin: fechaFin },
        totalFacturas: 0,
        totalVentas: 0,
        ventasPorTipo: {},
        ventasPorAve: {},
        clientesMasCompradores: [],
      };
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al generar resumen';
      setError(mensaje);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Configuración
  const actualizarConfiguracion = useCallback(async (
    config: Partial<ConfiguracionFacturacion>
  ): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await configService.actualizarConfig(config);
      const nuevaConfiguracion = await configService.getConfigAsync();
      setConfiguracion(nuevaConfiguracion);
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al actualizar configuración';
      setError(mensaje);
      Alert.alert('Error', mensaje);
    } finally {
      setLoading(false);
    }
  }, []);

  // Utilidades
  const refrescarDatos = useCallback(async (): Promise<void> => {
    await cargarDatosIniciales();
  }, []);

  const limpiarError = useCallback((): void => {
    setError(null);
  }, []);

  return {
    // Estados
    facturas,
    clientes,
    productos,
    lotes,
    configuracion,
    loading,
    error,

    // Métodos de facturación
    crearFactura,
    actualizarFactura,
    obtenerFactura,

    // Métodos de clientes
    crearCliente,
    actualizarCliente,

    // Métodos de productos
    actualizarProductos,

    // Reportes
    generarResumenVentas,

    // Configuración
    actualizarConfiguracion,

    // Utilidades
    refrescarDatos,
    limpiarError,
  };
};

export default useFacturacion;








