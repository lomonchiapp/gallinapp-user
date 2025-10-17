import { SubtipoLevante, TipoAve } from "../enums";
import { LoteBase } from "../loteBase";

export interface LoteLevante extends LoteBase {
    tipo: TipoAve.POLLO_LEVANTE;
    /** Días estimados de maduración/venta del lote (opcional) */
    diasMaduracion?: number;
    /** Subtipo de levante: para engorde o para ponedoras */
    subtipo?: SubtipoLevante;
    /** Edad en semanas recomendada para transferir a ponedoras (solo para LEVANTE_PONEDORAS) */
    edadTransferencia?: number;
    /** ID del lote de ponedoras creado después de la transferencia */
    loteDestinoId?: string;
    /** Fecha en que se realizó la transferencia */
    fechaTransferencia?: Date;
}
