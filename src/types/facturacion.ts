/**
 * Tipos para el sistema de facturación
 */

import { TipoAve } from './enums';

// Tipos de productos vendibles
export enum TipoProducto {
  LOTE_COMPLETO = 'LOTE_COMPLETO',
  UNIDADES_GALLINAS_PONEDORAS = 'UNIDADES_GALLINAS_PONEDORAS',
  UNIDADES_POLLOS_LEVANTE = 'UNIDADES_POLLOS_LEVANTE',
  UNIDADES_POLLOS_ENGORDE = 'UNIDADES_POLLOS_ENGORDE',
  HUEVOS = 'HUEVOS',
}

// Tipos de venta
export enum TipoVenta {
  LOTE_COMPLETO = 'LOTE_COMPLETO',
  UNIDADES_AVES = 'UNIDADES_AVES',
  UNIDADES_HUEVOS = 'UNIDADES_HUEVOS',
  CAJAS_HUEVOS = 'CAJAS_HUEVOS',
}

// Unidad de venta para huevos
export enum UnidadVentaHuevos {
  UNIDADES = 'UNIDADES',
  CAJAS = 'CAJAS',
}

// Información del producto base
export interface ProductoBase {
  id: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoProducto;
  tipoAve: TipoAve;
  precioUnitario: number;
  unidadMedida: string;
  disponible: number; // Cantidad disponible
}

// Producto específico para lotes completos
export interface ProductoLoteCompleto extends ProductoBase {
  tipo: TipoProducto.LOTE_COMPLETO;
  loteId: string;
  edadActual: number;
  cantidadTotal: number;
  raza: string;
  fechaInicio: Date;
  pesoPromedio?: number;
}

// Producto específico para unidades individuales
export interface ProductoUnidades extends ProductoBase {
  tipo: TipoProducto.UNIDADES_GALLINAS_PONEDORAS | TipoProducto.UNIDADES_POLLOS_LEVANTE | TipoProducto.UNIDADES_POLLOS_ENGORDE;
  loteId: string;
  edadActual: number;
  cantidadTotal: number;
  raza: string;
  fechaInicio: Date;
  pesoPromedio?: number;
}

// Producto específico para huevos
export interface ProductoHuevos extends ProductoBase {
  tipo: TipoProducto.HUEVOS;
  tamano: string;
  calidad: string;
  fechaRecoleccion: Date;
  // Nuevos campos para venta desde registros
  registroId?: string; // ID del registro de producción (HuevoRegistro)
  loteId: string; // ID del lote de ponedoras
  unidadVenta: UnidadVentaHuevos; // UNIDADES o CAJAS
  cantidadPorCaja?: number; // Cantidad de huevos por caja (si aplica)
  registrosIds?: string[]; // IDs de los registros de producción que generan este producto
}

// Union type para todos los productos
export type Producto = ProductoLoteCompleto | ProductoUnidades | ProductoHuevos;

// Item de factura
export interface ItemFactura {
  id: string;
  productoId: string;
  producto: Producto;
  cantidad: number;
  precioUnitario: number;
  descuento?: number;
  subtotal: number;
  impuestos?: number;
  total: number;
}

// Información del cliente
export interface Cliente {
  id: string;
  nombre: string;
  documento?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  departamento?: string;
}

// Factura completa
export interface Factura {
  id: string;
  numero: string;
  fecha: Date;
  cliente: Cliente;
  items: ItemFactura[];
  subtotal: number;
  descuentoTotal: number;
  impuestosTotal: number;
  total: number;
  observaciones?: string;
  metodoPago: string;
  estado: EstadoFactura;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Estados de la factura
export enum EstadoFactura {
  BORRADOR = 'BORRADOR',
  EMITIDA = 'EMITIDA',
  PAGADA = 'PAGADA',
  CANCELADA = 'CANCELADA',
}

// Métodos de pago
export enum MetodoPago {
  EFECTIVO = 'EFECTIVO',
  TRANSFERENCIA = 'TRANSFERENCIA',
  CHEQUE = 'CHEQUE',
  CREDITO = 'CREDITO',
}

// Configuración de facturación
export interface ConfiguracionFacturacion {
  empresa: {
    nombre: string;
    nit?: string;
    direccion?: string;
    telefono?: string;
    email?: string;
  };
  numeracion: {
    prefijo: string;
    siguienteNumero: number;
    formato: string; // Ej: "FAC-{numero}"
  };
  impuestos: {
    iva: number; // Siempre 0 - sistema sin impuestos
    retencion?: number; // Opcional, siempre 0 o undefined
  };
}

// Tipos para crear facturas
export type CrearCliente = Omit<Cliente, 'id'>;
export type CrearItemFactura = Omit<ItemFactura, 'id' | 'subtotal' | 'total'>;
export type CrearFactura = Omit<Factura, 'id' | 'numero' | 'subtotal' | 'descuentoTotal' | 'impuestosTotal' | 'total' | 'createdBy' | 'createdAt' | 'updatedAt'>;

// Resumen de ventas
export interface ResumenVentas {
  periodo: {
    inicio: Date;
    fin: Date;
  };
  totalFacturas: number;
  totalVentas: number;
  ventasPorTipo: {
    [key in TipoProducto]: {
      cantidad: number;
      valor: number;
    };
  };
  ventasPorAve: {
    [key in TipoAve]: {
      cantidad: number;
      valor: number;
    };
  };
  clientesMasCompradores: {
    cliente: Cliente;
    totalCompras: number;
    valorTotal: number;
  }[];
}

// Venta - Entidad separada de Factura (relación 1:1)
export interface Venta {
  id: string;
  facturaId: string; // Referencia a la factura (1:1)
  loteId?: string; // ID del lote (si aplica)
  tipoVenta: TipoVenta; // Tipo de venta
  // Información del producto vendido
  productoId: string;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  descuento?: number;
  subtotal: number;
  total: number;
  // Información del cliente
  clienteId: string;
  clienteNombre: string;
  // Para ventas de huevos
  registrosIds?: string[]; // IDs de registros de producción vendidos
  unidadVenta?: UnidadVentaHuevos; // Para huevos: unidades o cajas
  // Metadatos
  fecha: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}








