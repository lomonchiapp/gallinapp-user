/**
 * Hook para gestión de facturación
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { suscribirseALotesEngorde } from '../services/engorde.service';
import { facturacionTransaccionalService, suscribirseAClientes, suscribirseAFacturas } from '../services/facturacion-transaccional.service';
import { subscribeToLevantes } from '../services/levantes.service';
import { subscribeToPonedoras } from '../services/ponedoras.service';
import { productosInventarioSimplificadoService } from '../services/productos-inventario-simplificado.service';
import { LoteEngorde } from '../types/engorde/loteEngorde';
import {
    Cliente,
    ConfiguracionFacturacion,
    CrearCliente,
    CrearFactura,
    Factura,
    Producto,
    ResumenVentas,
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
  // Estados
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
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
    const unsubscribeFacturas = suscribirseAFacturas(setFacturas);
    const unsubscribeClientes = suscribirseAClientes(setClientes);

    return () => {
      unsubscribePonedoras();
      unsubscribeLevantes();
      unsubscribeEngorde();
      unsubscribeFacturas();
      unsubscribeClientes();
    };
  }, []);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        facturasData,
        clientesData,
        productosData,
        configuracionData,
      ] = await Promise.all([
        facturacionTransaccionalService.getFacturas(),
        facturacionTransaccionalService.getClientes(),
        productosInventarioSimplificadoService.generarProductosDesdeInventario(),
        facturacionTransaccionalService.getConfiguracion(),
      ]);

      setFacturas(facturasData);
      setClientes(clientesData);
      setProductos(productosData);
      setConfiguracion(configuracionData);
      
      console.log('✅ Datos iniciales cargados:', {
        facturas: facturasData.length,
        clientes: clientesData.length,
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
  const crearFactura = useCallback(async (datos: CrearFactura): Promise<Factura | null> => {
    try {
      setLoading(true);
      setError(null);

      const { requireAuth } = await import('../services/auth.service');
      const userId = requireAuth();
      const nuevaFactura = await facturacionTransaccionalService.crearFactura(datos, userId);
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

      // Por ahora solo soportamos actualización de estado
      if (datos.estado) {
        const facturaActualizada = await facturacionTransaccionalService.actualizarEstadoFactura(id, datos.estado);
        
        setFacturas(prev => 
          prev.map(f => f.id === id ? facturaActualizada : f)
        );

        return facturaActualizada;
      } else {
        throw new Error('Solo se puede actualizar el estado de la factura por ahora');
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
      const factura = await facturacionTransaccionalService.getFacturaPorId(id);
      return factura;
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al obtener factura';
      setError(mensaje);
      return null;
    }
  }, []);

  // Métodos de clientes
  const crearCliente = useCallback(async (datos: CrearCliente): Promise<Cliente | null> => {
    try {
      setLoading(true);
      setError(null);

      const nuevoCliente = await facturacionTransaccionalService.crearCliente(datos);
      setClientes(prev => [...prev, nuevoCliente]);

      return nuevoCliente;
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al crear cliente';
      setError(mensaje);
      Alert.alert('Error', mensaje);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const actualizarCliente = useCallback(async (
    id: string, 
    datos: Partial<Cliente>
  ): Promise<Cliente | null> => {
    try {
      setLoading(true);
      setError(null);

      const clienteActualizado = await facturacionTransaccionalService.actualizarCliente(id, datos);
      
      setClientes(prev => 
        prev.map(c => c.id === id ? clienteActualizado : c)
      );

      return clienteActualizado;
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al actualizar cliente';
      setError(mensaje);
      Alert.alert('Error', mensaje);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Métodos de productos
  const actualizarProductos = useCallback(async (): Promise<void> => {
    try {
      // Generar productos desde el inventario actual
      const nuevosProductos = await productosInventarioSimplificadoService.generarProductosDesdeInventario();
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

      const resumen = await facturacionTransaccionalService.generarResumenVentas(fechaInicio, fechaFin);
      return resumen;
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

      await facturacionTransaccionalService.actualizarConfiguracion(config);
      const nuevaConfiguracion = await facturacionTransaccionalService.getConfiguracion();
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








