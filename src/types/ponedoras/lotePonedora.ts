import { TipoAve } from "../enums";
import { LoteBase } from "../loteBase";

/**
 * Información de costos heredados de la fase de levante
 */
export interface CostosLevante {
    /** Costo total acumulado durante la fase de levante */
    total: number;
    /** Costo por ave durante el levante */
    porAve: number;
    /** Fecha de inicio de la fase de levante */
    fechaInicio: Date;
    /** Fecha de fin de la fase de levante (transferencia) */
    fechaFin: Date;
    /** Número de aves al inicio del levante */
    cantidadInicial: number;
    /** Número de aves transferidas */
    cantidadTransferida: number;
}

export interface LotePonedora extends LoteBase {
    tipo: TipoAve.PONEDORA;
    // Campos específicos de ponedoras
    estadoSalud?: string;
    activo?: boolean;
    /** ID del lote de levante del que proviene (si aplica) */
    loteLevanteOrigen?: string;
    /** Costos acumulados durante la fase de levante */
    costosLevante?: CostosLevante;
    /** Fecha en que el lote comenzó a producir huevos */
    fechaInicioProduccion?: Date;
    /** Indica si el lote fue transferido desde levante (true) o creado directamente (false) */
    esTransferido?: boolean;
}

/**
 * Tipos de datos para crear lotes de ponedoras (sin campos autogenerados)
 */
export type CrearLotePonedora = Omit<LotePonedora, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>;

/**
 * Tipos de datos para actualizar lotes de ponedoras
 */
export type ActualizarLotePonedora = Partial<Omit<LotePonedora, 'id' | 'createdBy' | 'createdAt'>>;