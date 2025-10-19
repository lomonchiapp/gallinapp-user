/**
 * Tipos de errores estructurados para manejo consistente
 */

export abstract class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly metadata?: any
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class InsufficientQuantityError extends DomainError {
  constructor(
    loteId: string, 
    requested: number, 
    available: number,
    tipoAve: string
  ) {
    super(
      'INSUFFICIENT_QUANTITY',
      `Lote ${loteId} (${tipoAve}): solicitado ${requested}, disponible ${available}`,
      { loteId, requested, available, tipoAve }
    );
  }
}

export class LoteNotFoundError extends DomainError {
  constructor(loteId: string) {
    super(
      'LOTE_NOT_FOUND',
      `Lote ${loteId} no encontrado`,
      { loteId }
    );
  }
}

export class LoteAlreadySoldError extends DomainError {
  constructor(loteId: string) {
    super(
      'LOTE_ALREADY_SOLD',
      `Lote ${loteId} ya está vendido`,
      { loteId }
    );
  }
}

export class InvalidQuantityError extends DomainError {
  constructor(quantity: number) {
    super(
      'INVALID_QUANTITY',
      `Cantidad inválida: ${quantity}. Debe ser mayor a 0`,
      { quantity }
    );
  }
}

export class FacturaNotFoundError extends DomainError {
  constructor(facturaId: string) {
    super(
      'FACTURA_NOT_FOUND',
      `Factura ${facturaId} no encontrada`,
      { facturaId }
    );
  }
}

export class ClienteNotFoundError extends DomainError {
  constructor(clienteId: string) {
    super(
      'CLIENTE_NOT_FOUND',
      `Cliente ${clienteId} no encontrado`,
      { clienteId }
    );
  }
}

export class ProductoNotFoundError extends DomainError {
  constructor(productoId: string) {
    super(
      'PRODUCTO_NOT_FOUND',
      `Producto ${productoId} no encontrado`,
      { productoId }
    );
  }
}

export class UnauthorizedError extends DomainError {
  constructor(action: string) {
    super(
      'UNAUTHORIZED',
      `No autorizado para realizar: ${action}`,
      { action }
    );
  }
}

export class ValidationError extends DomainError {
  constructor(field: string, value: any, rule: string) {
    super(
      'VALIDATION_ERROR',
      `Campo ${field} con valor ${value} no cumple: ${rule}`,
      { field, value, rule }
    );
  }
}

export class TransactionError extends DomainError {
  constructor(operation: string, reason: string) {
    super(
      'TRANSACTION_ERROR',
      `Error en transacción ${operation}: ${reason}`,
      { operation, reason }
    );
  }
}

export class ConcurrencyError extends DomainError {
  constructor(entityId: string, entityType: string) {
    super(
      'CONCURRENCY_ERROR',
      `Conflicto de concurrencia en ${entityType} ${entityId}`,
      { entityId, entityType }
    );
  }
}

// Tipo para identificar errores de dominio
export type DomainErrorType = 
  | InsufficientQuantityError
  | LoteNotFoundError
  | LoteAlreadySoldError
  | InvalidQuantityError
  | FacturaNotFoundError
  | ClienteNotFoundError
  | ProductoNotFoundError
  | UnauthorizedError
  | ValidationError
  | TransactionError
  | ConcurrencyError;

// Helper para verificar si es un error de dominio
export const isDomainError = (error: any): error is DomainError => {
  return error instanceof DomainError;
};

// Helper para obtener código de error de forma segura
export const getErrorCode = (error: any): string => {
  if (isDomainError(error)) {
    return error.code;
  }
  return 'UNKNOWN_ERROR';
};

// Helper para obtener mensaje de error de forma segura
export const getErrorMessage = (error: any): string => {
  if (isDomainError(error)) {
    return error.message;
  }
  return error?.message || 'Error desconocido';
};












