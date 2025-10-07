import { TipoAve } from "../enums";
import { LoteBase } from "../loteBase";

export interface LoteLevante extends LoteBase {
    tipo: TipoAve.POLLO_LEVANTE;
    /** Días estimados de maduración/venta del lote (opcional) */
    diasMaduracion?: number;
}
