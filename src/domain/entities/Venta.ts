/**
 * Domain Entity: Venta
 * Entidad para representar ventas en el dominio avícola
 */

export enum TipoVenta {
  LOTE_COMPLETO = 'LOTE_COMPLETO',
  UNIDADES = 'UNIDADES',
  HUEVOS = 'HUEVOS'
}

export enum EstadoVenta {
  PENDIENTE = 'PENDIENTE',
  CONFIRMADA = 'CONFIRMADA',
  ENTREGADA = 'ENTREGADA',
  CANCELADA = 'CANCELADA'
}

export interface ItemVenta {
  productoId: string;
  loteId: string;
  tipoProducto: TipoVenta;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  descripcion: string;
}

export interface Cliente {
  id: string;
  nombre: string;
  documento?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
}

export class Venta {
  constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly numero: string,
    public readonly fecha: Date,
    public readonly cliente: Cliente,
    public readonly items: ItemVenta[],
    public readonly subtotal: number,
    public readonly descuentoTotal: number,
    public readonly total: number,
    public estado: EstadoVenta,
    public readonly createdBy: string,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public observaciones?: string,
    public fechaEntrega?: Date
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id || this.id.trim() === '') {
      throw new Error('El ID de la venta es requerido');
    }

    if (!this.organizationId || this.organizationId.trim() === '') {
      throw new Error('El ID de la organización es requerido');
    }

    if (!this.numero || this.numero.trim() === '') {
      throw new Error('El número de venta es requerido');
    }

    if (!this.cliente.nombre || this.cliente.nombre.trim() === '') {
      throw new Error('El nombre del cliente es requerido');
    }

    if (!this.items || this.items.length === 0) {
      throw new Error('La venta debe tener al menos un item');
    }

    if (this.subtotal < 0) {
      throw new Error('El subtotal no puede ser negativo');
    }

    if (this.descuentoTotal < 0) {
      throw new Error('El descuento no puede ser negativo');
    }

    if (this.total < 0) {
      throw new Error('El total no puede ser negativo');
    }

    // Validar que el total calculado coincida
    const subtotalCalculado = this.items.reduce((sum, item) => sum + item.subtotal, 0);
    if (Math.abs(subtotalCalculado - this.subtotal) > 0.01) {
      throw new Error('El subtotal no coincide con la suma de los items');
    }

    const totalCalculado = this.subtotal - this.descuentoTotal;
    if (Math.abs(totalCalculado - this.total) > 0.01) {
      throw new Error('El total no coincide con subtotal - descuento');
    }

    // Validar items
    this.items.forEach((item, index) => {
      if (!item.loteId || item.loteId.trim() === '') {
        throw new Error(`Item ${index + 1}: ID del lote es requerido`);
      }

      if (item.cantidad <= 0) {
        throw new Error(`Item ${index + 1}: La cantidad debe ser mayor a 0`);
      }

      if (item.precioUnitario <= 0) {
        throw new Error(`Item ${index + 1}: El precio unitario debe ser mayor a 0`);
      }

      const subtotalCalculado = item.cantidad * item.precioUnitario;
      if (Math.abs(subtotalCalculado - item.subtotal) > 0.01) {
        throw new Error(`Item ${index + 1}: El subtotal no coincide con cantidad × precio`);
      }
    });
  }

  // Métodos de negocio

  /**
   * Confirma la venta
   */
  confirmar(): void {
    if (this.estado !== EstadoVenta.PENDIENTE) {
      throw new Error('Solo se pueden confirmar ventas pendientes');
    }

    this.estado = EstadoVenta.CONFIRMADA;
    this.updatedAt = new Date();
  }

  /**
   * Marca la venta como entregada
   */
  marcarComoEntregada(fechaEntrega?: Date): void {
    if (this.estado !== EstadoVenta.CONFIRMADA) {
      throw new Error('Solo se pueden entregar ventas confirmadas');
    }

    this.estado = EstadoVenta.ENTREGADA;
    this.fechaEntrega = fechaEntrega || new Date();
    this.updatedAt = new Date();
  }

  /**
   * Cancela la venta
   */
  cancelar(motivo?: string): void {
    if (this.estado === EstadoVenta.ENTREGADA) {
      throw new Error('No se puede cancelar una venta ya entregada');
    }

    if (this.estado === EstadoVenta.CANCELADA) {
      throw new Error('La venta ya está cancelada');
    }

    this.estado = EstadoVenta.CANCELADA;
    this.observaciones = motivo ? `Cancelada: ${motivo}` : 'Cancelada';
    this.updatedAt = new Date();
  }

  /**
   * Obtiene el total de unidades vendidas
   */
  getTotalUnidades(): number {
    return this.items.reduce((total, item) => total + item.cantidad, 0);
  }

  /**
   * Obtiene los lotes involucrados en la venta
   */
  getLotesInvolucrados(): string[] {
    return [...new Set(this.items.map(item => item.loteId))];
  }

  /**
   * Verifica si la venta incluye un lote específico
   */
  incluyeLote(loteId: string): boolean {
    return this.items.some(item => item.loteId === loteId);
  }

  /**
   * Obtiene el item de venta para un lote específico
   */
  getItemPorLote(loteId: string): ItemVenta | undefined {
    return this.items.find(item => item.loteId === loteId);
  }

  /**
   * Calcula el porcentaje de descuento total
   */
  getPorcentajeDescuento(): number {
    return this.subtotal > 0 ? (this.descuentoTotal / this.subtotal) * 100 : 0;
  }

  /**
   * Verifica si la venta puede ser modificada
   */
  puedeSerModificada(): boolean {
    return this.estado === EstadoVenta.PENDIENTE || this.estado === EstadoVenta.CONFIRMADA;
  }

  /**
   * Verifica si la venta puede ser cancelada
   */
  puedeSerCancelada(): boolean {
    return this.estado !== EstadoVenta.ENTREGADA && this.estado !== EstadoVenta.CANCELADA;
  }

  /**
   * Agrega observaciones a la venta
   */
  agregarObservaciones(observaciones: string): void {
    this.observaciones = this.observaciones 
      ? `${this.observaciones}\n${observaciones}`
      : observaciones;
    this.updatedAt = new Date();
  }

  /**
   * Clona la venta para crear una nueva instancia
   */
  clone(): Venta {
    return new Venta(
      this.id,
      this.organizationId,
      this.numero,
      new Date(this.fecha.getTime()),
      { ...this.cliente },
      this.items.map(item => ({ ...item })),
      this.subtotal,
      this.descuentoTotal,
      this.total,
      this.estado,
      this.createdBy,
      new Date(this.createdAt.getTime()),
      new Date(this.updatedAt.getTime()),
      this.observaciones,
      this.fechaEntrega ? new Date(this.fechaEntrega.getTime()) : undefined
    );
  }

  /**
   * Convierte la entidad a un objeto plano para persistencia
   */
  toPlainObject(): Record<string, any> {
    return {
      id: this.id,
      organizationId: this.organizationId,
      numero: this.numero,
      fecha: this.fecha,
      cliente: this.cliente,
      items: this.items,
      subtotal: this.subtotal,
      descuentoTotal: this.descuentoTotal,
      total: this.total,
      estado: this.estado,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      observaciones: this.observaciones,
      fechaEntrega: this.fechaEntrega,
    };
  }

  /**
   * Crea una instancia desde un objeto plano
   */
  static fromPlainObject(data: any): Venta {
    return new Venta(
      data.id,
      data.organizationId,
      data.numero,
      data.fecha instanceof Date ? data.fecha : new Date(data.fecha),
      data.cliente,
      data.items,
      data.subtotal,
      data.descuentoTotal,
      data.total,
      data.estado,
      data.createdBy,
      data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt),
      data.updatedAt instanceof Date ? data.updatedAt : new Date(data.updatedAt),
      data.observaciones,
      data.fechaEntrega ? (data.fechaEntrega instanceof Date ? data.fechaEntrega : new Date(data.fechaEntrega)) : undefined
    );
  }
}


