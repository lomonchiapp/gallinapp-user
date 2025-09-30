import { TipoAve } from "../enums";
import { LoteBase } from "../loteBase";

export interface LoteLevante extends LoteBase {
    tipo: TipoAve.POLLO_LEVANTE;
}
