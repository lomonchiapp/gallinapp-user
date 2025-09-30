/**
 * Hook para gestión de facturación
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { suscribirseALotesEngorde } from '../services/engorde.service';
import { facturacionService } from '../services/facturacion.service';
import { subscribeToLevantes } from '../services/levantes.service';
import { subscribeToPonedoras } from '../services/ponedoras.service';
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
        clientesData,
        productosData,
        configuracionData,
      ] = await Promise.all([
        facturacionService.getFacturas(),
        facturacionService.getClientes(),
        facturacionService.getProductosDisponibles(),
        facturacionService.getConfiguracion(),
      ]);

      setFacturas(facturasData);
      setClientes(clientesData);
      setProductos(productosData);
      setConfiguracion(configuracionData);
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al cargar datos';
      setError(mensaje);
      console.error('Error en cargarDatosIniciales:', err);
    } finally {
      setLoading(false);
    }
  };

  // Métodos de facturación
  const crearFactura = useCallback(async (datos: CrearFactura): Promise<Factura | null> => {
    try {
      setLoading(true);
      setError(null);

      const nuevaFactura = await facturacionService.crearFactura(datos, 'current-user');
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

      const facturaActualizada = await facturacionService.actualizarFactura(id, datos);
      
      setFacturas(prev => 
        prev.map(f => f.id === id ? facturaActualizada : f)
      );

      return facturaActualizada;
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
      const factura = await facturacionService.getFacturaPorId(id);
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

      const nuevoCliente = await facturacionService.crearCliente(datos);
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

      const clienteActualizado = await facturacionService.actualizarCliente(id, datos);
      
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
      const nuevosProductos = await facturacionService.generarProductosDesdeInventario();
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

      const resumen = await facturacionService.generarResumenVentas(fechaInicio, fechaFin);
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

      await facturacionService.actualizarConfiguracion(config);
      const nuevaConfiguracion = await facturacionService.getConfiguracion();
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








