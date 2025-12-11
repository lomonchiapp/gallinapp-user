/**
 * Domain Entity: Lote
 * Entidad principal del dominio avícola
 */

export enum TipoLote {
  PONEDORAS = 'PONEDORAS',
  LEVANTE = 'LEVANTE', 
  ENGORDE = 'ENGORDE'
}

export enum EstadoLote {
  ACTIVO = 'ACTIVO',
  VENDIDO = 'VENDIDO',
  TERMINADO = 'TERMINADO',
  MUERTO = 'MUERTO'
}

export class Lote {
  constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly tipo: TipoLote,
    public readonly nombre: string,
    public readonly raza: string,
    public readonly fechaInicio: Date,
    public readonly fechaNacimiento: Date,
    public readonly cantidadInicial: number,
    public cantidadActual: number,
    public estado: EstadoLote,
    public readonly createdBy: string,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public galponId?: string,
    public pesoPromedio?: number,
    public observaciones?: string
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id || this.id.trim() === '') {
      throw new Error('El ID del lote es requerido');
    }

    if (!this.organizationId || this.organizationId.trim() === '') {
      throw new Error('El ID de la organización es requerido');
    }

    if (!this.nombre || this.nombre.trim() === '') {
      throw new Error('El nombre del lote es requerido');
    }

    if (!this.raza || this.raza.trim() === '') {
      throw new Error('La raza es requerida');
    }

    if (this.cantidadInicial <= 0) {
      throw new Error('La cantidad inicial debe ser mayor a 0');
    }

    if (this.cantidadActual < 0) {
      throw new Error('La cantidad actual no puede ser negativa');
    }

    if (this.cantidadActual > this.cantidadInicial) {
      throw new Error('La cantidad actual no puede ser mayor a la inicial');
    }

    if (this.fechaNacimiento > this.fechaInicio) {
      throw new Error('La fecha de nacimiento no puede ser posterior al inicio');
    }

    if (this.fechaInicio > new Date()) {
      throw new Error('La fecha de inicio no puede ser futura');
    }
  }

  // Métodos de negocio

  /**
   * Calcula la edad actual del lote en días
   */
  getEdadEnDias(): number {
    return Math.floor((Date.now() - this.fechaNacimiento.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Calcula el porcentaje de mortalidad
   */
  getPorcentajeMortalidad(): number {
    const muertos = this.cantidadInicial - this.cantidadActual;
    return this.cantidadInicial > 0 ? (muertos / this.cantidadInicial) * 100 : 0;
  }

  /**
   * Calcula el porcentaje de supervivencia
   */
  getPorcentajeSupervivencia(): number {
    return 100 - this.getPorcentajeMortalidad();
  }

  /**
   * Verifica si el lote está activo y disponible para operaciones
   */
  isDisponibleParaOperaciones(): boolean {
    return this.estado === EstadoLote.ACTIVO && this.cantidadActual > 0;
  }

  /**
   * Verifica si el lote puede ser vendido
   */
  puedeSerVendido(): boolean {
    return this.isDisponibleParaOperaciones() && this.cumpleEdadMinima();
  }

  /**
   * Verifica si cumple la edad mínima para venta según el tipo
   */
  private cumpleEdadMinima(): boolean {
    const edadDias = this.getEdadEnDias();
    
    switch (this.tipo) {
      case TipoLote.PONEDORAS:
        return edadDias >= 120; // 4 meses
      case TipoLote.LEVANTE:
        return edadDias >= 21;  // 3 semanas
      case TipoLote.ENGORDE:
        return edadDias >= 35;  // 5 semanas
      default:
        return true;
    }
  }

  /**
   * Reduce la cantidad del lote (por venta o mortalidad)
   */
  reducirCantidad(cantidad: number, motivo: 'venta' | 'mortalidad'): void {
    if (cantidad <= 0) {
      throw new Error('La cantidad a reducir debe ser mayor a 0');
    }

    if (cantidad > this.cantidadActual) {
      throw new Error(`No se puede reducir ${cantidad} unidades. Solo quedan ${this.cantidadActual}`);
    }

    if (!this.isDisponibleParaOperaciones() && motivo === 'venta') {
      throw new Error('No se puede vender de un lote que no está activo');
    }

    this.cantidadActual -= cantidad;
    this.updatedAt = new Date();

    // Si se vendió todo el lote, cambiar estado
    if (motivo === 'venta' && this.cantidadActual === 0) {
      this.estado = EstadoLote.VENDIDO;
    }
  }

  /**
   * Actualiza el peso promedio del lote
   */
  actualizarPeso(nuevoPeso: number): void {
    if (nuevoPeso <= 0) {
      throw new Error('El peso debe ser mayor a 0');
    }

    if (this.tipo === TipoLote.PONEDORAS && nuevoPeso > 5) {
      throw new Error('Peso muy alto para ponedoras (máximo 5 kg)');
    }

    if (this.tipo === TipoLote.ENGORDE && nuevoPeso > 10) {
      throw new Error('Peso muy alto para engorde (máximo 10 kg)');
    }

    this.pesoPromedio = nuevoPeso;
    this.updatedAt = new Date();
  }

  /**
   * Marca el lote como terminado
   */
  terminar(observaciones?: string): void {
    if (this.estado === EstadoLote.VENDIDO) {
      throw new Error('No se puede terminar un lote ya vendido');
    }

    this.estado = EstadoLote.TERMINADO;
    this.observaciones = observaciones;
    this.updatedAt = new Date();
  }

  /**
   * Clona el lote para crear una nueva instancia
   */
  clone(): Lote {
    return new Lote(
      this.id,
      this.organizationId,
      this.tipo,
      this.nombre,
      this.raza,
      new Date(this.fechaInicio.getTime()),
      new Date(this.fechaNacimiento.getTime()),
      this.cantidadInicial,
      this.cantidadActual,
      this.estado,
      this.createdBy,
      new Date(this.createdAt.getTime()),
      new Date(this.updatedAt.getTime()),
      this.galponId,
      this.pesoPromedio,
      this.observaciones
    );
  }

  /**
   * Convierte la entidad a un objeto plano para persistencia
   */
  toPlainObject(): Record<string, any> {
    return {
      id: this.id,
      organizationId: this.organizationId,
      tipo: this.tipo,
      nombre: this.nombre,
      raza: this.raza,
      fechaInicio: this.fechaInicio,
      fechaNacimiento: this.fechaNacimiento,
      cantidadInicial: this.cantidadInicial,
      cantidadActual: this.cantidadActual,
      estado: this.estado,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      galponId: this.galponId,
      pesoPromedio: this.pesoPromedio,
      observaciones: this.observaciones,
    };
  }

  /**
   * Crea una instancia desde un objeto plano
   */
  static fromPlainObject(data: any): Lote {
    return new Lote(
      data.id,
      data.organizationId,
      data.tipo,
      data.nombre,
      data.raza,
      data.fechaInicio instanceof Date ? data.fechaInicio : new Date(data.fechaInicio),
      data.fechaNacimiento instanceof Date ? data.fechaNacimiento : new Date(data.fechaNacimiento),
      data.cantidadInicial,
      data.cantidadActual,
      data.estado,
      data.createdBy,
      data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt),
      data.updatedAt instanceof Date ? data.updatedAt : new Date(data.updatedAt),
      data.galponId,
      data.pesoPromedio,
      data.observaciones
    );
  }
}


