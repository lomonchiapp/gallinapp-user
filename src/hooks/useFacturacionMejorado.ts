/**
 * Hook mejorado para facturación con transacciones atómicas y sincronización en tiempo real
 */

import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { requireAuth } from '../services/auth.service';
import { suscribirseALotesEngorde } from '../services/engorde.service';
import { facturacionTransaccionalService, suscribirseAClientes, suscribirseAFacturas, suscribirseAVentas } from '../services/facturacion-transaccional.service';
import { subscribeToLevantes } from '../services/levantes.service';
import { subscribeToPonedoras } from '../services/ponedoras.service';
import { productosInventarioSimplificadoService } from '../services/productos-inventario-simplificado.service';
import {
    InsufficientQuantityError,
    InvalidQuantityError,
    ValidationError,
    getErrorCode,
    getErrorMessage
} from '../types/errors';
import {
    Cliente,
    CrearCliente,
    CrearFactura,
    Factura,
    ItemFactura,
    Producto
} from '../types/facturacion';

interface UseFacturacionMejoradoReturn {
  // Estado
  facturas: Factura[];
  clientes: Cliente[];
  productos: Producto[];
  ventas: any[];
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  crearFactura: (datos: CrearFactura) => Promise<Factura | null>;
  actualizarEstadoFactura: (id: string, estado: string) => Promise<void>;
  crearCliente: (cliente: CrearCliente) => Promise<Cliente | null>;
  actualizarCliente: (id: string, datos: Partial<Cliente>) => Promise<void>;
  calcularItemFactura: (producto: Producto, cantidad: number, descuento?: number) => ItemFactura;
  actualizarProductos: () => Promise<void>;
  refrescarDatos: () => Promise<void>;
  
  // Utilidades
  limpiarError: () => void;
}

export const useFacturacionMejorado = (): UseFacturacionMejoradoReturn => {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ventas, setVentas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Cargar todos los datos iniciales
   */
  const cargarDatosIniciales = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [facturasData, clientesData, productosData] = await Promise.all([
        facturacionTransaccionalService.getFacturas(),
        facturacionTransaccionalService.getClientes(),
        productosInventarioSimplificadoService.generarProductosDesdeInventario(),
      ]);
      
      setFacturas(facturasData);
      setClientes(clientesData);
      setProductos(productosData);
      
    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Actualizar productos desde inventario
   */
  const actualizarProductos = useCallback(async () => {
    try {
      setError(null);
      console.log('🔄 Actualizando productos desde inventario...');
      const productosData = await productosInventarioSimplificadoService.generarProductosDesdeInventario();
      console.log('✅ Productos actualizados:', productosData.length);
      setProductos(productosData);
    } catch (error) {
      console.error('Error al actualizar productos:', error);
      setError(getErrorMessage(error));
    }
  }, []);

  /**
   * Suscribirse a cambios en los lotes para actualizar productos en tiempo real
   */
  useEffect(() => {
    console.log('🔔 Configurando suscripciones en tiempo real para lotes...');
    
    // Suscribirse a cambios en lotes de ponedoras
    const unsubscribePonedoras = subscribeToPonedoras(async (lotesPonedoras) => {
      console.log('🐔 Lotes de ponedoras actualizados:', lotesPonedoras.length);
      await actualizarProductos();
    });
    
    // Suscribirse a cambios en lotes de levante
    const unsubscribeLevantes = subscribeToLevantes(async (lotesLevante) => {
      console.log('🐣 Lotes de levante actualizados:', lotesLevante.length);
      await actualizarProductos();
    });
    
    // Suscribirse a cambios en lotes de engorde
    const unsubscribeEngorde = suscribirseALotesEngorde(async (lotesEngorde) => {
      console.log('🐓 Lotes de engorde actualizados:', lotesEngorde.length);
      await actualizarProductos();
    });
    
    return () => {
      console.log('🔕 Desuscribiendo de cambios en lotes...');
      unsubscribePonedoras();
      unsubscribeLevantes();
      unsubscribeEngorde();
    };
  }, [actualizarProductos]);

  /**
   * Suscribirse a cambios en facturas, clientes y ventas en tiempo real
   */
  useEffect(() => {
    console.log('🔔 Configurando suscripciones en tiempo real para facturación...');
    
    // Suscripción a facturas
    const unsubscribeFacturas = suscribirseAFacturas((facturasActualizadas) => {
      console.log('📄 Facturas actualizadas:', facturasActualizadas.length);
      setFacturas(facturasActualizadas);
    });
    
    // Suscripción a clientes
    const unsubscribeClientes = suscribirseAClientes((clientesActualizados) => {
      console.log('👥 Clientes actualizados:', clientesActualizados.length);
      setClientes(clientesActualizados);
    });
    
    // Suscripción a ventas
    const unsubscribeVentas = suscribirseAVentas((ventasActualizadas) => {
      console.log('💰 Ventas actualizadas:', ventasActualizadas.length);
      setVentas(ventasActualizadas);
    });
    
    return () => {
      console.log('🔕 Desuscribiendo de cambios en facturación...');
      unsubscribeFacturas();
      unsubscribeClientes();
      unsubscribeVentas();
    };
  }, []);

  /**
   * Crear nueva factura
   */
  const crearFactura = useCallback(async (datos: CrearFactura): Promise<Factura | null> => {
    try {
      console.log('🔧 [useFacturacionMejorado] Iniciando creación de factura...');
      setError(null);
      
      console.log('🔐 [useFacturacionMejorado] Verificando autenticación...');
      const userId = requireAuth();
      console.log('👤 [useFacturacionMejorado] Usuario autenticado:', userId);
      
      // Validaciones básicas
      console.log('✅ [useFacturacionMejorado] Validando datos de entrada...');
      if (!datos.cliente || !datos.cliente.id) {
        throw new ValidationError('cliente', datos.cliente, 'Cliente es requerido');
      }
      
      if (!datos.items || datos.items.length === 0) {
        throw new ValidationError('items', datos.items, 'La factura debe tener al menos un item');
      }
      
      // Validar que todos los items tengan cantidad válida
      for (const item of datos.items) {
        if (item.cantidad <= 0) {
          throw new InvalidQuantityError(item.cantidad);
        }
      }
      
      console.log('📊 [useFacturacionMejorado] Datos validados correctamente:', {
        cliente: datos.cliente.nombre,
        items: datos.items.length,
        total: datos.items.reduce((sum, item) => sum + item.total, 0)
      });
      
      console.log('💾 [useFacturacionMejorado] Llamando al servicio de facturación...');
      const nuevaFactura = await facturacionTransaccionalService.crearFactura(datos, userId);
      
      console.log('✅ [useFacturacionMejorado] Factura creada exitosamente:', nuevaFactura.id);
      
      // Actualizar estado local
      setFacturas(prev => [nuevaFactura, ...prev]);
      
      // Actualizar productos inmediatamente después de la venta
      console.log('🔄 [useFacturacionMejorado] Actualizando inventario después de crear factura...');
      await actualizarProductos();
      
      // Mostrar éxito
      Alert.alert(
        'Factura Creada',
        `Factura ${nuevaFactura.numero} creada exitosamente por RD$${nuevaFactura.total.toFixed(2)}`,
        [{ text: 'OK' }]
      );
      
      return nuevaFactura;
      
    } catch (error) {
      console.error('❌ [useFacturacionMejorado] Error al crear factura:', error);
      
      const errorCode = getErrorCode(error);
      const errorMessage = getErrorMessage(error);
      
      console.log('🔍 [useFacturacionMejorado] Detalles del error:', {
        code: errorCode,
        message: errorMessage,
        type: error.constructor.name
      });
      
      // Mostrar error específico según el tipo
      if (error instanceof InsufficientQuantityError) {
        Alert.alert(
          'Stock Insuficiente',
          errorMessage,
          [{ text: 'OK' }]
        );
      } else if (error instanceof InvalidQuantityError) {
        Alert.alert(
          'Cantidad Inválida',
          errorMessage,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Error al Crear Factura',
          errorMessage,
          [{ text: 'OK' }]
        );
      }
      
      setError(errorMessage);
      return null;
    }
  }, [actualizarProductos]);

  /**
   * Actualizar estado de factura
   */
  const actualizarEstadoFactura = useCallback(async (id: string, estado: string) => {
    try {
      setError(null);
      
      const facturaActualizada = await facturacionTransaccionalService.actualizarFactura(id, { estado });
      
      // Actualizar estado local
      setFacturas(prev => 
        prev.map(f => f.id === id ? facturaActualizada : f)
      );
      
      Alert.alert(
        'Estado Actualizado',
        `Factura ${facturaActualizada.numero} actualizada a ${estado}`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Error al actualizar estado de factura:', error);
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
    }
  }, []);

  /**
   * Crear nuevo cliente
   */
  const crearCliente = useCallback(async (cliente: CrearCliente): Promise<Cliente | null> => {
    try {
      setError(null);
      
      // Validaciones básicas
      if (!cliente.nombre || cliente.nombre.trim() === '') {
        throw new ValidationError('nombre', cliente.nombre, 'Nombre del cliente es requerido');
      }
      
      if (!cliente.email || cliente.email.trim() === '') {
        throw new ValidationError('email', cliente.email, 'Email del cliente es requerido');
      }
      
      const nuevoCliente = await facturacionTransaccionalService.crearCliente(cliente);
      
      // Actualizar estado local
      setClientes(prev => [...prev, nuevoCliente]);
      
      Alert.alert(
        'Cliente Creado',
        `Cliente ${nuevoCliente.nombre} creado exitosamente`,
        [{ text: 'OK' }]
      );
      
      return nuevoCliente;
      
    } catch (error) {
      console.error('Error al crear cliente:', error);
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      Alert.alert('Error al Crear Cliente', errorMessage, [{ text: 'OK' }]);
      return null;
    }
  }, []);

  /**
   * Actualizar cliente
   */
  const actualizarCliente = useCallback(async (id: string, datos: Partial<Cliente>) => {
    try {
      setError(null);
      
      const clienteActualizado = await facturacionTransaccionalService.actualizarCliente(id, datos);
      
      // Actualizar estado local
      setClientes(prev => 
        prev.map(c => c.id === id ? clienteActualizado : c)
      );
      
      Alert.alert(
        'Cliente Actualizado',
        `Cliente ${clienteActualizado.nombre} actualizado exitosamente`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      Alert.alert('Error al Actualizar Cliente', errorMessage, [{ text: 'OK' }]);
    }
  }, []);

  /**
   * Calcular item de factura
   */
  const calcularItemFactura = useCallback((
    producto: Producto, 
    cantidad: number, 
    descuento: number = 0
  ): ItemFactura => {
    return facturacionTransaccionalService.calcularItemFactura(producto, cantidad, descuento);
  }, []);

  /**
   * Refrescar todos los datos
   */
  const refrescarDatos = useCallback(async () => {
    await cargarDatosIniciales();
  }, [cargarDatosIniciales]);

  /**
   * Limpiar error
   */
  const limpiarError = useCallback(() => {
    setError(null);
  }, []);

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDatosIniciales();
  }, [cargarDatosIniciales]);

  return {
    // Estado
    facturas,
    clientes,
    productos,
    ventas,
    isLoading,
    error,
    
    // Acciones
    crearFactura,
    actualizarEstadoFactura,
    crearCliente,
    actualizarCliente,
    calcularItemFactura,
    actualizarProductos,
    refrescarDatos,
    
    // Utilidades
    limpiarError,
  };
};

