/**
 * Servicio para gestión de facturación
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { TipoAve } from '../types/enums';
import {
    Cliente,
    ConfiguracionFacturacion,
    CrearCliente,
    CrearFactura,
    EstadoFactura,
    Factura,
    ItemFactura,
    Producto,
    ResumenVentas,
    TipoProducto
} from '../types/facturacion';
import { productosInventarioService } from './productos-inventario.service';
import { procesarFacturaParaVentas } from './ventas.service';

const STORAGE_KEYS = {
  FACTURAS: 'facturas',
  CLIENTES: 'clientes',
  PRODUCTOS: 'productos_disponibles',
  CONFIGURACION: 'configuracion_facturacion',
  CONTADOR_FACTURAS: 'contador_facturas',
};

class FacturacionService {
  // Configuración por defecto
  private configuracionDefault: ConfiguracionFacturacion = {
    empresa: {
      nombre: 'Asoaves',
      nit: '',
      direccion: '',
      telefono: '',
      email: '',
    },
    numeracion: {
      prefijo: 'FAC',
      siguienteNumero: 1,
      formato: '{prefijo}-{numero:4}',
    },
    impuestos: {
      iva: 0.19,
      retencion: 0,
    },
  };

  // Gestión de configuración
  async getConfiguracion(): Promise<ConfiguracionFacturacion> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CONFIGURACION);
      return data ? JSON.parse(data) : this.configuracionDefault;
    } catch (error) {
      console.error('Error al obtener configuración de facturación:', error);
      return this.configuracionDefault;
    }
  }

  async actualizarConfiguracion(config: Partial<ConfiguracionFacturacion>): Promise<void> {
    try {
      const configActual = await this.getConfiguracion();
      const nuevaConfig = { ...configActual, ...config };
      await AsyncStorage.setItem(STORAGE_KEYS.CONFIGURACION, JSON.stringify(nuevaConfig));
    } catch (error) {
      console.error('Error al actualizar configuración de facturación:', error);
      throw error;
    }
  }

  // Gestión de clientes
  async getClientes(): Promise<Cliente[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CLIENTES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error al obtener clientes:', error);
      return [];
    }
  }

  async crearCliente(cliente: CrearCliente): Promise<Cliente> {
    try {
      const clientes = await this.getClientes();
      const nuevoCliente: Cliente = {
        ...cliente,
        id: Date.now().toString(),
      };
      
      clientes.push(nuevoCliente);
      await AsyncStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(clientes));
      
      return nuevoCliente;
    } catch (error) {
      console.error('Error al crear cliente:', error);
      throw error;
    }
  }

  async actualizarCliente(id: string, datos: Partial<Cliente>): Promise<Cliente> {
    try {
      const clientes = await this.getClientes();
      const index = clientes.findIndex(c => c.id === id);
      
      if (index === -1) {
        throw new Error('Cliente no encontrado');
      }
      
      clientes[index] = { ...clientes[index], ...datos };
      await AsyncStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(clientes));
      
      return clientes[index];
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      throw error;
    }
  }

  // Gestión de productos disponibles
  async getProductosDisponibles(): Promise<Producto[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PRODUCTOS);
      return data ? JSON.parse(data, this.dateReviver) : [];
    } catch (error) {
      console.error('Error al obtener productos disponibles:', error);
      return [];
    }
  }

  async actualizarProductosDisponibles(productos: Producto[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTOS, JSON.stringify(productos));
    } catch (error) {
      console.error('Error al actualizar productos disponibles:', error);
      throw error;
    }
  }

  // Generar productos desde lotes activos
  async generarProductosDesdeInventario(): Promise<Producto[]> {
    try {
      // Usar el servicio integrador que conecta con los lotes existentes
      const productos = await productosInventarioService.generarProductosDesdeInventario();
      
      // Guardar en cache local
      await this.actualizarProductosDisponibles(productos);
      
      return productos;
    } catch (error) {
      console.error('Error al generar productos desde inventario:', error);
      throw error;
    }
  }

  // Generación de número de factura
  private async generarNumeroFactura(): Promise<string> {
    try {
      const config = await this.getConfiguracion();
      const contador = await this.getContadorFacturas();
      
      const numero = config.numeracion.formato
        .replace('{prefijo}', config.numeracion.prefijo)
        .replace('{numero:4}', contador.toString().padStart(4, '0'));
      
      await this.actualizarContadorFacturas(contador + 1);
      
      return numero;
    } catch (error) {
      console.error('Error al generar número de factura:', error);
      throw error;
    }
  }

  private async getContadorFacturas(): Promise<number> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CONTADOR_FACTURAS);
      return data ? parseInt(data) : 1;
    } catch (error) {
      return 1;
    }
  }

  private async actualizarContadorFacturas(contador: number): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CONTADOR_FACTURAS, contador.toString());
    } catch (error) {
      console.error('Error al actualizar contador de facturas:', error);
    }
  }

  // Cálculos de factura
  private calcularSubtotal(items: ItemFactura[]): number {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  }

  private calcularDescuentoTotal(items: ItemFactura[]): number {
    return items.reduce((sum, item) => sum + (item.descuento || 0), 0);
  }

  private calcularImpuestosTotal(items: ItemFactura[]): number {
    return items.reduce((sum, item) => sum + (item.impuestos || 0), 0);
  }

  private calcularTotal(items: ItemFactura[]): number {
    return items.reduce((sum, item) => sum + item.total, 0);
  }

  // Calcular item de factura
  calcularItemFactura(
    producto: Producto, 
    cantidad: number, 
    descuento: number = 0
  ): Omit<ItemFactura, 'id'> {
    const precioUnitario = producto.precioUnitario;
    const subtotal = cantidad * precioUnitario;
    const descuentoAplicado = (subtotal * descuento) / 100;
    const subtotalConDescuento = subtotal - descuentoAplicado;
    
    // Calcular impuestos (IVA por ejemplo)
    const impuestos = subtotalConDescuento * 0.19; // 19% IVA por defecto
    const total = subtotalConDescuento + impuestos;

    return {
      productoId: producto.id,
      producto,
      cantidad,
      precioUnitario,
      descuento: descuentoAplicado,
      subtotal,
      impuestos,
      total,
    };
  }

  // Gestión de facturas
  async getFacturas(): Promise<Factura[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.FACTURAS);
      return data ? JSON.parse(data, this.dateReviver) : [];
    } catch (error) {
      console.error('Error al obtener facturas:', error);
      return [];
    }
  }

  async getFacturaPorId(id: string): Promise<Factura | null> {
    try {
      const facturas = await this.getFacturas();
      return facturas.find(f => f.id === id) || null;
    } catch (error) {
      console.error('Error al obtener factura por ID:', error);
      return null;
    }
  }

  async crearFactura(datosFactura: CrearFactura, userId: string): Promise<Factura> {
    try {
      const numero = await this.generarNumeroFactura();
      const ahora = new Date();
      
      // Calcular totales
      const subtotal = this.calcularSubtotal(datosFactura.items);
      const descuentoTotal = this.calcularDescuentoTotal(datosFactura.items);
      const impuestosTotal = this.calcularImpuestosTotal(datosFactura.items);
      const total = this.calcularTotal(datosFactura.items);

      const nuevaFactura: Factura = {
        ...datosFactura,
        id: Date.now().toString(),
        numero,
        subtotal,
        descuentoTotal,
        impuestosTotal,
        total,
        createdBy: userId,
        createdAt: ahora,
        updatedAt: ahora,
      };

      const facturas = await this.getFacturas();
      facturas.push(nuevaFactura);
      await AsyncStorage.setItem(STORAGE_KEYS.FACTURAS, JSON.stringify(facturas));

      // Actualizar inventario (reducir disponibilidad)
      await this.actualizarInventarioPorVenta(datosFactura.items);

      // Procesar ventas para registro en lotes
      await procesarFacturaParaVentas(nuevaFactura);

      return nuevaFactura;
    } catch (error) {
      console.error('Error al crear factura:', error);
      throw error;
    }
  }

  async actualizarFactura(id: string, datos: Partial<Factura>): Promise<Factura> {
    try {
      const facturas = await this.getFacturas();
      const index = facturas.findIndex(f => f.id === id);
      
      if (index === -1) {
        throw new Error('Factura no encontrada');
      }

      facturas[index] = { 
        ...facturas[index], 
        ...datos, 
        updatedAt: new Date() 
      };
      
      await AsyncStorage.setItem(STORAGE_KEYS.FACTURAS, JSON.stringify(facturas));
      
      return facturas[index];
    } catch (error) {
      console.error('Error al actualizar factura:', error);
      throw error;
    }
  }

  // Actualizar inventario después de una venta
  private async actualizarInventarioPorVenta(items: ItemFactura[]): Promise<void> {
    try {
      // Actualizar tanto el cache local como el inventario real de lotes
      const productos = await this.getProductosDisponibles();
      
      for (const item of items) {
        // Actualizar cache local
        const productoIndex = productos.findIndex(p => p.id === item.productoId);
        if (productoIndex !== -1) {
          productos[productoIndex].disponible -= item.cantidad;
          
          // Si es un lote completo, marcarlo como vendido
          if (productos[productoIndex].tipo === TipoProducto.LOTE_COMPLETO) {
            productos[productoIndex].disponible = 0;
          }
        }
        
        // Actualizar inventario real de lotes
        await productosInventarioService.actualizarInventarioPorVenta(
          item.productoId, 
          item.cantidad,
          item.producto.tipoAve
        );
      }
      
      await this.actualizarProductosDisponibles(productos);
    } catch (error) {
      console.error('Error al actualizar inventario por venta:', error);
    }
  }

  // Generar resumen de ventas
  async generarResumenVentas(fechaInicio: Date, fechaFin: Date): Promise<ResumenVentas> {
    try {
      const facturas = await this.getFacturas();
      const facturasEnPeriodo = facturas.filter(f => 
        f.fecha >= fechaInicio && 
        f.fecha <= fechaFin && 
        f.estado !== EstadoFactura.CANCELADA
      );

      const resumen: ResumenVentas = {
        periodo: { inicio: fechaInicio, fin: fechaFin },
        totalFacturas: facturasEnPeriodo.length,
        totalVentas: facturasEnPeriodo.reduce((sum, f) => sum + f.total, 0),
        ventasPorTipo: {
          [TipoProducto.LOTE_COMPLETO]: { cantidad: 0, valor: 0 },
          [TipoProducto.UNIDADES_GALLINAS_PONEDORAS]: { cantidad: 0, valor: 0 },
          [TipoProducto.UNIDADES_POLLOS_LEVANTE]: { cantidad: 0, valor: 0 },
          [TipoProducto.UNIDADES_POLLOS_ENGORDE]: { cantidad: 0, valor: 0 },
          [TipoProducto.HUEVOS]: { cantidad: 0, valor: 0 },
        },
        ventasPorAve: {
          [TipoAve.PONEDORA]: { cantidad: 0, valor: 0 },
          [TipoAve.POLLO_LEVANTE]: { cantidad: 0, valor: 0 },
          [TipoAve.POLLO_ENGORDE]: { cantidad: 0, valor: 0 },
        },
        clientesMasCompradores: [],
      };

      // Calcular estadísticas
      for (const factura of facturasEnPeriodo) {
        for (const item of factura.items) {
          const tipo = item.producto.tipo;
          const tipoAve = item.producto.tipoAve;
          
          resumen.ventasPorTipo[tipo].cantidad += item.cantidad;
          resumen.ventasPorTipo[tipo].valor += item.total;
          
          resumen.ventasPorAve[tipoAve].cantidad += item.cantidad;
          resumen.ventasPorAve[tipoAve].valor += item.total;
        }
      }

      return resumen;
    } catch (error) {
      console.error('Error al generar resumen de ventas:', error);
      throw error;
    }
  }

  // Helper para parsear fechas desde JSON
  private dateReviver(key: string, value: any): any {
    const dateFields = ['fecha', 'fechaInicio', 'fechaRecoleccion', 'createdAt', 'updatedAt'];
    if (dateFields.includes(key) && typeof value === 'string') {
      return new Date(value);
    }
    return value;
  }
}

export const facturacionService = new FacturacionService();
