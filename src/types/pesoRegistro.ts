import { TipoAve } from './enums';

export interface PesoRegistro {
  id: string;
  loteId: string;
  tipoLote: TipoAve;
  fecha: Date;
  edadEnDias: number; // Edad calculada automáticamente al momento del registro
  edadEnSemanas: number; // Edad en semanas para referencia rápida
  cantidadPollosPesados: number;
  pesosIndividuales: number[]; // Array con los pesos individuales en kg
  pesoPromedio: number; // Promedio calculado en kg
  pesoTotal: number; // Suma total de todos los pesos
  observaciones?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CrearPesoRegistro = Omit<PesoRegistro, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>;
