/**
 * Domain Repository Interface: IVentaRepository
 * Define el contrato para operaciones de persistencia de ventas
 */

import { Venta, EstadoVenta } from '../entities/Venta';

export interface IVentaRepository {
  // Operaciones básicas CRUD
  save(venta: Venta): Promise<void>;
  findById(id: string, organizationId: string): Promise<Venta | null>;
  update(venta: Venta): Promise<void>;
  delete(id: string, organizationId: string): Promise<void>;

  // Consultas por organización
  findByOrganization(organizationId: string): Promise<Venta[]>;
  findByOrganizationAndState(organizationId: string, estado: EstadoVenta): Promise<Venta[]>;
  findByClient(organizationId: string, clienteId: string): Promise<Venta[]>;

  // Consultas por fecha
  findByDateRange(organizationId: string, fechaInicio: Date, fechaFin: Date): Promise<Venta[]>;
  findByMonth(organizationId: string, year: number, month: number): Promise<Venta[]>;

  // Consultas específicas de negocio
  findByLote(organizationId: string, loteId: string): Promise<Venta[]>;
  findPendingVentas(organizationId: string): Promise<Venta[]>;
  findVentasForDelivery(organizationId: string): Promise<Venta[]>;

  // Estadísticas
  countByOrganization(organizationId: string): Promise<number>;
  getTotalSalesByOrganization(organizationId: string): Promise<number>;
  getTotalSalesByMonth(organizationId: string, year: number, month: number): Promise<number>;

  // Numeración automática
  getNextVentaNumber(organizationId: string): Promise<string>;

  // Subscripciones en tiempo real
  subscribeToVentas(organizationId: string, callback: (ventas: Venta[]) => void): () => void;
  subscribeToVenta(id: string, organizationId: string, callback: (venta: Venta | null) => void): () => void;
}

export interface VentaQuery {
  organizationId: string;
  estado?: EstadoVenta;
  clienteId?: string;
  loteId?: string;
  fechaInicio?: Date;
  fechaFin?: Date;
  limit?: number;
  offset?: number;
  orderBy?: 'fecha' | 'numero' | 'total';
  orderDirection?: 'asc' | 'desc';
}



