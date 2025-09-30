import { TipoAve } from "../enums";
import { LoteBase } from "../loteBase";

export interface LoteEngorde extends LoteBase {
    tipo: TipoAve.POLLO_ENGORDE;
}
