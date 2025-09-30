import { UnidadMedida } from "../enums";


export interface Articulo {
    id: string;
    nombre: string;
    descripcion?: string;
    unidadMedida: UnidadMedida;
    costoFijo: boolean;
    precio?: number;
    activo: boolean;
  }

