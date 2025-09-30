import { TipoAve } from "../enums";
import { LoteBase } from "../loteBase";

export interface LotePonedora extends LoteBase {
    tipo: TipoAve.PONEDORA;
    // Campos específicos de ponedoras
    estadoSalud?: string;
    activo?: boolean;
}

/**
 * Tipos de datos para crear lotes de ponedoras (sin campos autogenerados)
 */
export type CrearLotePonedora = Omit<LotePonedora, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>;

/**
 * Tipos de datos para actualizar lotes de ponedoras
 */
export type ActualizarLotePonedora = Partial<Omit<LotePonedora, 'id' | 'createdBy' | 'createdAt'>>;