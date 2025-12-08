export interface HuevoRegistro {
    id: string;
    loteId: string;
    fecha: Date;
    cantidad: number;
    cantidadVendida?: number; // Cantidad de huevos ya vendidos de este registro
  }
  