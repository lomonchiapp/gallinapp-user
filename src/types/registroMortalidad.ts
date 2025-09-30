import { TipoAve } from "./enums";

export interface RegistroMortalidad {
    id: string;
    loteId: string;
    tipoLote: TipoAve.PONEDORA | TipoAve.POLLO_ENGORDE | TipoAve.POLLO_LEVANTE; // ponedoras, israelies, engorde
    fecha: Date;
    cantidad: number;
    causa?: string;
    createdBy: string;
    createdAt: Date;
  }