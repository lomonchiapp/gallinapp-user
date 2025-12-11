/**
 * Domain Use Case: Crear Venta
 * Implementa la lógica de negocio para crear una nueva venta
 */

import { Venta, EstadoVenta, ItemVenta, Cliente } from '../entities/Venta';
import { Lote, EstadoLote } from '../entities/Lote';
import { IVentaRepository } from '../repositories/IVentaRepository';
import { ILoteRepository } from '../repositories/ILoteRepository';

export interface CrearVentaCommand {
  organizationId: string;
  cliente: Cliente;
  items: Array<{
    loteId: string;
    tipoProducto: string;
    cantidad: number;
    precioUnitario: number;
    descripcion?: string;
  }>;
  descuentoTotal?: number;
  observaciones?: string;
  createdBy: string;
}

export interface ICrearVentaUseCase {
  execute(command: CrearVentaCommand): Promise<Venta>;
}

export class CrearVentaUseCase implements ICrearVentaUseCase {
  constructor(
    private readonly ventaRepository: IVentaRepository,
    private readonly loteRepository: ILoteRepository
  ) {}

  async execute(command: CrearVentaCommand): Promise<Venta> {
    // Validaciones de negocio
    await this.validateBusinessRules(command);

    // Generar número de venta
    const numero = await this.ventaRepository.getNextVentaNumber(command.organizationId);

    // Procesar items y calcular totales
    const processedItems = await this.processItems(command);
    const subtotal = processedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const descuentoTotal = command.descuentoTotal || 0;
    const total = subtotal - descuentoTotal;

    // Generar ID único
    const id = this.generateVentaId();

    // Crear entidad Venta
    const venta = new Venta(
      id,
      command.organizationId,
      numero,
      new Date(),
      command.cliente,
      processedItems,
      subtotal,
      descuentoTotal,
      total,
      EstadoVenta.PENDIENTE,
      command.createdBy,
      new Date(),
      new Date(),
      command.observaciones
    );

    // Persistir venta
    await this.ventaRepository.save(venta);

    // Actualizar inventario de lotes
    await this.updateLoteInventory(command.organizationId, processedItems);

    return venta;
  }

  private async validateBusinessRules(command: CrearVentaCommand): Promise<void> {
    if (!command.items || command.items.length === 0) {
      throw new Error('La venta debe tener al menos un item');
    }

    // Validar cliente
    if (!command.cliente.nombre || command.cliente.nombre.trim() === '') {
      throw new Error('El nombre del cliente es requerido');
    }

    // Validar descuento
    if (command.descuentoTotal && command.descuentoTotal < 0) {
      throw new Error('El descuento no puede ser negativo');
    }

    // Validar disponibilidad de lotes
    for (const item of command.items) {
      const lote = await this.loteRepository.findById(item.loteId, command.organizationId);
      
      if (!lote) {
        throw new Error(`Lote ${item.loteId} no encontrado`);
      }

      if (!lote.puedeSerVendido()) {
        throw new Error(`Lote ${lote.nombre} no puede ser vendido en su estado actual`);
      }

      if (item.cantidad > lote.cantidadActual) {
        throw new Error(
          `No hay suficiente stock en el lote ${lote.nombre}. ` +
          `Disponible: ${lote.cantidadActual}, Solicitado: ${item.cantidad}`
        );
      }

      if (item.precioUnitario <= 0) {
        throw new Error(`El precio unitario debe ser mayor a 0 para el lote ${lote.nombre}`);
      }
    }

    // Validar que el descuento no sea mayor al subtotal
    const subtotalCalculado = command.items.reduce(
      (sum, item) => sum + (item.cantidad * item.precioUnitario), 
      0
    );
    
    if (command.descuentoTotal && command.descuentoTotal > subtotalCalculado) {
      throw new Error('El descuento no puede ser mayor al subtotal');
    }
  }

  private async processItems(command: CrearVentaCommand): Promise<ItemVenta[]> {
    const processedItems: ItemVenta[] = [];

    for (const item of command.items) {
      const lote = await this.loteRepository.findById(item.loteId, command.organizationId);
      if (!lote) {
        throw new Error(`Lote ${item.loteId} no encontrado`);
      }

      const subtotal = item.cantidad * item.precioUnitario;
      const productoId = `${item.tipoProducto.toLowerCase()}-${item.loteId}`;

      const processedItem: ItemVenta = {
        productoId,
        loteId: item.loteId,
        tipoProducto: item.tipoProducto as any,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        subtotal,
        descripcion: item.descripcion || `${lote.nombre} - ${lote.raza}`
      };

      processedItems.push(processedItem);
    }

    return processedItems;
  }

  private async updateLoteInventory(organizationId: string, items: ItemVenta[]): Promise<void> {
    for (const item of items) {
      const lote = await this.loteRepository.findById(item.loteId, organizationId);
      if (!lote) {
        continue; // Ya validado previamente, pero por seguridad
      }

      // Reducir cantidad del lote
      lote.reducirCantidad(item.cantidad, 'venta');

      // Actualizar en el repositorio
      await this.loteRepository.update(lote);
    }
  }

  private generateVentaId(): string {
    // Generar ID único basado en timestamp y random
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `venta_${timestamp}_${random}`;
  }
}


