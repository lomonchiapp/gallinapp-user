/**
 * Application Service: LoteApplicationService
 * Coordina los casos de uso del dominio de lotes
 */

import { ILoteRepository } from '../../domain/repositories/ILoteRepository';
import { CrearLoteUseCase, CrearLoteCommand } from '../../domain/usecases/CrearLoteUseCase';
import { Lote, TipoLote, EstadoLote } from '../../domain/entities/Lote';

export interface LoteApplicationService {
  // Casos de uso principales
  crearLote(command: CrearLoteCommand): Promise<Lote>;
  
  // Consultas
  obtenerLotesPorOrganizacion(organizationId: string): Promise<Lote[]>;
  obtenerLotesPorTipo(organizationId: string, tipo: TipoLote): Promise<Lote[]>;
  obtenerLotesActivos(organizationId: string): Promise<Lote[]>;
  obtenerLotesDisponiblesParaVenta(organizationId: string): Promise<Lote[]>;
  obtenerLotePorId(id: string, organizationId: string): Promise<Lote | null>;
  
  // Operaciones de negocio
  actualizarCantidad(loteId: string, organizationId: string, nuevaCantidad: number): Promise<void>;
  marcarComoVendido(loteId: string, organizationId: string): Promise<void>;
  actualizarPeso(loteId: string, organizationId: string, nuevoPeso: number): Promise<void>;
  
  // Estadísticas
  contarLotesPorOrganizacion(organizationId: string): Promise<number>;
  obtenerEstadisticasPorTipo(organizationId: string): Promise<Record<TipoLote, number>>;
  
  // Suscripciones
  suscribirseALotes(organizationId: string, callback: (lotes: Lote[]) => void): () => void;
}

export class LoteApplicationServiceImpl implements LoteApplicationService {
  private crearLoteUseCase: CrearLoteUseCase;

  constructor(
    private readonly loteRepository: ILoteRepository
  ) {
    this.crearLoteUseCase = new CrearLoteUseCase(loteRepository);
  }

  async crearLote(command: CrearLoteCommand): Promise<Lote> {
    return await this.crearLoteUseCase.execute(command);
  }

  async obtenerLotesPorOrganizacion(organizationId: string): Promise<Lote[]> {
    return await this.loteRepository.findByOrganization(organizationId);
  }

  async obtenerLotesPorTipo(organizationId: string, tipo: TipoLote): Promise<Lote[]> {
    return await this.loteRepository.findByOrganizationAndType(organizationId, tipo);
  }

  async obtenerLotesActivos(organizationId: string): Promise<Lote[]> {
    return await this.loteRepository.findActiveLotes(organizationId);
  }

  async obtenerLotesDisponiblesParaVenta(organizationId: string): Promise<Lote[]> {
    return await this.loteRepository.findAvailableForSale(organizationId);
  }

  async obtenerLotePorId(id: string, organizationId: string): Promise<Lote | null> {
    return await this.loteRepository.findById(id, organizationId);
  }

  async actualizarCantidad(loteId: string, organizationId: string, nuevaCantidad: number): Promise<void> {
    const lote = await this.loteRepository.findById(loteId, organizationId);
    if (!lote) {
      throw new Error('Lote no encontrado');
    }

    if (nuevaCantidad < 0) {
      throw new Error('La cantidad no puede ser negativa');
    }

    if (nuevaCantidad > lote.cantidadInicial) {
      throw new Error('La cantidad no puede ser mayor a la inicial');
    }

    lote.cantidadActual = nuevaCantidad;
    lote.updatedAt = new Date();

    await this.loteRepository.update(lote);
  }

  async marcarComoVendido(loteId: string, organizationId: string): Promise<void> {
    const lote = await this.loteRepository.findById(loteId, organizationId);
    if (!lote) {
      throw new Error('Lote no encontrado');
    }

    lote.estado = EstadoLote.VENDIDO;
    lote.updatedAt = new Date();

    await this.loteRepository.update(lote);
  }

  async actualizarPeso(loteId: string, organizationId: string, nuevoPeso: number): Promise<void> {
    const lote = await this.loteRepository.findById(loteId, organizationId);
    if (!lote) {
      throw new Error('Lote no encontrado');
    }

    lote.actualizarPeso(nuevoPeso);
    await this.loteRepository.update(lote);
  }

  async contarLotesPorOrganizacion(organizationId: string): Promise<number> {
    return await this.loteRepository.countByOrganization(organizationId);
  }

  async obtenerEstadisticasPorTipo(organizationId: string): Promise<Record<TipoLote, number>> {
    const estadisticas: Record<TipoLote, number> = {} as any;

    for (const tipo of Object.values(TipoLote)) {
      estadisticas[tipo] = await this.loteRepository.countByOrganizationAndType(organizationId, tipo);
    }

    return estadisticas;
  }

  suscribirseALotes(organizationId: string, callback: (lotes: Lote[]) => void): () => void {
    return this.loteRepository.subscribeToLotes(organizationId, callback);
  }
}



