/**
 * Domain Use Case: Crear Lote
 * Implementa la lógica de negocio para crear un nuevo lote
 */

import { Lote, TipoLote, EstadoLote } from '../entities/Lote';
import { ILoteRepository } from '../repositories/ILoteRepository';

export interface CrearLoteCommand {
  organizationId: string;
  tipo: TipoLote;
  nombre: string;
  raza: string;
  fechaInicio: Date;
  fechaNacimiento: Date;
  cantidadInicial: number;
  createdBy: string;
  galponId?: string;
  observaciones?: string;
}

export interface ICrearLoteUseCase {
  execute(command: CrearLoteCommand): Promise<Lote>;
}

export class CrearLoteUseCase implements ICrearLoteUseCase {
  constructor(
    private readonly loteRepository: ILoteRepository
  ) {}

  async execute(command: CrearLoteCommand): Promise<Lote> {
    // Validaciones de negocio
    await this.validateBusinessRules(command);

    // Generar ID único
    const id = this.generateLoteId();

    // Crear entidad Lote
    const lote = new Lote(
      id,
      command.organizationId,
      command.tipo,
      command.nombre,
      command.raza,
      command.fechaInicio,
      command.fechaNacimiento,
      command.cantidadInicial,
      command.cantidadInicial, // cantidadActual inicialmente igual a inicial
      EstadoLote.ACTIVO,
      command.createdBy,
      new Date(),
      new Date(),
      command.galponId,
      undefined, // peso promedio se establecerá después
      command.observaciones
    );

    // Persistir
    await this.loteRepository.save(lote);

    return lote;
  }

  private async validateBusinessRules(command: CrearLoteCommand): Promise<void> {
    // Validar que no existe otro lote activo con el mismo nombre en la organización
    const existingLotes = await this.loteRepository.findByOrganization(command.organizationId);
    const duplicateName = existingLotes.find(
      lote => lote.nombre.toLowerCase() === command.nombre.toLowerCase() && 
              lote.estado === EstadoLote.ACTIVO
    );

    if (duplicateName) {
      throw new Error(`Ya existe un lote activo con el nombre "${command.nombre}"`);
    }

    // Validar fechas
    if (command.fechaNacimiento > command.fechaInicio) {
      throw new Error('La fecha de nacimiento no puede ser posterior a la fecha de inicio');
    }

    if (command.fechaInicio > new Date()) {
      throw new Error('La fecha de inicio no puede ser futura');
    }

    // Validar cantidad según el tipo
    this.validateQuantityByType(command.tipo, command.cantidadInicial);

    // Validar raza según el tipo
    this.validateBreedByType(command.tipo, command.raza);
  }

  private validateQuantityByType(tipo: TipoLote, cantidad: number): void {
    const limits = {
      [TipoLote.PONEDORAS]: { min: 50, max: 50000 },
      [TipoLote.LEVANTE]: { min: 25, max: 25000 },
      [TipoLote.ENGORDE]: { min: 100, max: 100000 }
    };

    const limit = limits[tipo];
    if (cantidad < limit.min || cantidad > limit.max) {
      throw new Error(
        `La cantidad para ${tipo} debe estar entre ${limit.min} y ${limit.max} unidades`
      );
    }
  }

  private validateBreedByType(tipo: TipoLote, raza: string): void {
    const validBreeds = {
      [TipoLote.PONEDORAS]: ['Hy-Line Brown', 'Lohmann Brown', 'ISA Brown', 'Rhode Island Red'],
      [TipoLote.LEVANTE]: ['Broiler', 'Cobb 500', 'Ross 308', 'Hubbard'],
      [TipoLote.ENGORDE]: ['Cobb 500', 'Ross 308', 'Hubbard', 'Arbor Acres']
    };

    const validBreedsForType = validBreeds[tipo];
    if (!validBreedsForType.includes(raza)) {
      console.warn(`Raza "${raza}" no está en la lista recomendada para ${tipo}`);
      // No lanzar error, solo advertencia
    }
  }

  private generateLoteId(): string {
    // Generar ID único basado en timestamp y random
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `lote_${timestamp}_${random}`;
  }
}


