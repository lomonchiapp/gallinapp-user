/**
 * Domain Repository Interface: ILoteRepository
 * Define el contrato para operaciones de persistencia de lotes
 */

import { Lote, TipoLote, EstadoLote } from '../entities/Lote';

export interface ILoteRepository {
  // Operaciones básicas CRUD
  save(lote: Lote): Promise<void>;
  findById(id: string, organizationId: string): Promise<Lote | null>;
  update(lote: Lote): Promise<void>;
  delete(id: string, organizationId: string): Promise<void>;

  // Consultas por organización
  findByOrganization(organizationId: string): Promise<Lote[]>;
  findByOrganizationAndType(organizationId: string, tipo: TipoLote): Promise<Lote[]>;
  findByOrganizationAndState(organizationId: string, estado: EstadoLote): Promise<Lote[]>;

  // Consultas específicas
  findActiveLotes(organizationId: string): Promise<Lote[]>;
  findLotesByGalpon(organizationId: string, galponId: string): Promise<Lote[]>;
  findLotesByDateRange(organizationId: string, fechaInicio: Date, fechaFin: Date): Promise<Lote[]>;

  // Consultas de negocio
  findAvailableForSale(organizationId: string): Promise<Lote[]>;
  countByOrganization(organizationId: string): Promise<number>;
  countByOrganizationAndType(organizationId: string, tipo: TipoLote): Promise<number>;

  // Operaciones transaccionales
  updateQuantity(loteId: string, organizationId: string, newQuantity: number): Promise<void>;
  markAsSold(loteId: string, organizationId: string): Promise<void>;

  // Subscripciones en tiempo real
  subscribeToLotes(organizationId: string, callback: (lotes: Lote[]) => void): () => void;
  subscribeToLote(id: string, organizationId: string, callback: (lote: Lote | null) => void): () => void;
}

export interface LoteQuery {
  organizationId: string;
  tipo?: TipoLote;
  estado?: EstadoLote;
  galponId?: string;
  fechaInicio?: Date;
  fechaFin?: Date;
  limit?: number;
  offset?: number;
  orderBy?: 'fechaInicio' | 'fechaNacimiento' | 'nombre' | 'cantidadActual';
  orderDirection?: 'asc' | 'desc';
}


