/**
 * Interfaz base para todos los tipos de lotes
 */

import { EstadoLote, TipoAve } from "./enums";

export interface LoteBase {
    id: string;
    nombre: string;
    galponId: string;
    fechaInicio: Date;
    fechaNacimiento: Date;
    costo?: number; // Costo total del lote
    costoUnitario?: number; // Costo por pollo/gallina
    tipo: TipoAve;
    cantidadActual: number;
    cantidadInicial: number;
    raza: string;
    estado: EstadoLote;
    createdBy?: string;
    createdAt: Date;
    updatedAt: Date;
    observaciones?: string;
}

/**
 * Tipos de datos para crear lotes (sin campos autogenerados)
 */
export type CrearLoteBase = Omit<LoteBase, 'id' | 'uid' | 'createdBy' | 'createdAt' | 'updatedAt'>;

/**
 * Tipos de datos para actualizar lotes
 */
export type ActualizarLoteBase = Partial<Omit<LoteBase, 'id' | 'uid' | 'createdBy' | 'createdAt'>>;
