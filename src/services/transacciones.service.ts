/**
 * TransaccionesService - Utilitarios para transacciones atómicas
 * 
 * Implementa el patrón de transacción en 3 fases:
 * 1. Pre-validación (Fuera de transacción)
 * 2. Transacción Atómica (Solo lecturas → Solo escrituras)
 * 3. Post-procesamiento (Fuera de transacción)
 */

import { runTransaction, DocumentReference, Transaction } from 'firebase/firestore';
import { db } from '../components/config/firebase';

export interface TransactionResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  duration: number;
}

export interface PreValidationResult {
  isValid: boolean;
  errors: string[];
  data?: any;
}

export interface TransactionPhases<TInput, TOutput> {
  // Fase 1: Pre-validación fuera de transacción
  preValidation: (input: TInput) => Promise<PreValidationResult>;
  
  // Fase 2: Transacción atómica (lecturas → escrituras)
  transaction: (transaction: Transaction, input: TInput, preValidationData?: any) => Promise<TOutput>;
  
  // Fase 3: Post-procesamiento fuera de transacción
  postProcessing?: (result: TOutput, input: TInput) => Promise<void>;
}

export interface TransactionOptions {
  timeout?: number; // Timeout en milisegundos
  retries?: number; // Número de reintentos
  operationName?: string; // Nombre para logging
}

class TransaccionesService {
  private readonly DEFAULT_TIMEOUT = 30000; // 30 segundos
  private readonly DEFAULT_RETRIES = 3;

  /**
   * Ejecuta una transacción con el patrón de 3 fases
   */
  async executeTransaction<TInput, TOutput>(
    input: TInput,
    phases: TransactionPhases<TInput, TOutput>,
    options: TransactionOptions = {}
  ): Promise<TransactionResult<TOutput>> {
    const startTime = Date.now();
    const {
      timeout = this.DEFAULT_TIMEOUT,
      retries = this.DEFAULT_RETRIES,
      operationName = 'Transacción'
    } = options;

    console.log(`🔄 [${operationName}] Iniciando transacción con 3 fases...`);

    try {
      // FASE 1: Pre-validación (fuera de transacción)
      console.log(`🔍 [${operationName}] FASE 1: Pre-validación...`);
      const preValidationResult = await phases.preValidation(input);
      
      if (!preValidationResult.isValid) {
        const errorMessage = preValidationResult.errors.join(', ');
        throw new Error(`Pre-validación falló: ${errorMessage}`);
      }
      
      console.log(`✅ [${operationName}] Pre-validación exitosa`);

      // FASE 2: Transacción atómica con timeout y reintentos
      console.log(`⚡ [${operationName}] FASE 2: Ejecutando transacción atómica...`);
      const transactionResult = await this.executeWithRetries(
        () => this.executeAtomicTransaction(phases.transaction, input, preValidationResult.data),
        retries,
        timeout,
        operationName
      );

      console.log(`✅ [${operationName}] Transacción atómica completada`);

      // FASE 3: Post-procesamiento (fuera de transacción)
      if (phases.postProcessing) {
        console.log(`🔧 [${operationName}] FASE 3: Post-procesamiento...`);
        await phases.postProcessing(transactionResult, input);
        console.log(`✅ [${operationName}] Post-procesamiento completado`);
      }

      const duration = Date.now() - startTime;
      console.log(`🎉 [${operationName}] Transacción completada exitosamente en ${duration}ms`);

      return {
        success: true,
        data: transactionResult,
        duration
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ [${operationName}] Transacción falló después de ${duration}ms:`, error);

      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        duration
      };
    }
  }

  /**
   * Ejecuta la transacción atómica con separación de lecturas y escrituras
   */
  private async executeAtomicTransaction<TInput, TOutput>(
    transactionFn: (transaction: Transaction, input: TInput, preValidationData?: any) => Promise<TOutput>,
    input: TInput,
    preValidationData?: any
  ): Promise<TOutput> {
    return await runTransaction(db, async (transaction) => {
      return await transactionFn(transaction, input, preValidationData);
    });
  }

  /**
   * Ejecuta una operación con reintentos y timeout
   */
  private async executeWithRetries<T>(
    operation: () => Promise<T>,
    retries: number,
    timeout: number,
    operationName: string
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔄 [${operationName}] Intento ${attempt}/${retries}...`);
        
        const result = await this.withTimeout(operation(), timeout, operationName);
        
        if (attempt > 1) {
          console.log(`✅ [${operationName}] Éxito en intento ${attempt}/${retries}`);
        }
        
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === retries) {
          console.error(`❌ [${operationName}] Falló después de ${retries} intentos`);
          throw lastError;
        }
        
        // Backoff exponencial
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.warn(`⚠️ [${operationName}] Intento ${attempt} falló, reintentando en ${delay}ms...`);
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Aplica timeout a una promesa
   */
  private withTimeout<T>(promise: Promise<T>, timeoutMs: number, operationName: string): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        setTimeout(() => {
          const error = new Error(`Timeout: ${operationName} excedió ${timeoutMs / 1000} segundos`);
          console.error(`⏱️ [${operationName}] Timeout después de ${timeoutMs}ms`);
          reject(error);
        }, timeoutMs);
      })
    ]);
  }

  /**
   * Utilidad para dormir/esperar
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Valida que todas las referencias de documentos existan
   */
  async validateDocumentReferences(
    transaction: Transaction,
    references: { ref: DocumentReference; name: string }[]
  ): Promise<void> {
    console.log(`🔍 [TransaccionesService] Validando ${references.length} referencias de documentos...`);
    
    const snapshots = await Promise.all(
      references.map(({ ref }) => transaction.get(ref))
    );

    const missingDocs = references.filter((_, index) => !snapshots[index].exists());
    
    if (missingDocs.length > 0) {
      const missingNames = missingDocs.map(({ name }) => name).join(', ');
      throw new Error(`Documentos no encontrados: ${missingNames}`);
    }
    
    console.log(`✅ [TransaccionesService] Todas las referencias validadas`);
  }

  /**
   * Limpia valores undefined de un objeto para Firestore
   */
  cleanUndefinedValues(obj: any): any {
    if (obj === null || obj === undefined) {
      return null;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanUndefinedValues(item));
    }
    
    if (typeof obj === 'object' && obj.constructor === Object) {
      const cleaned: any = {};
      for (const key in obj) {
        if (obj[key] !== undefined) {
          cleaned[key] = this.cleanUndefinedValues(obj[key]);
        }
      }
      return cleaned;
    }
    
    return obj;
  }

  /**
   * Crea un helper para construir transacciones complejas
   */
  createTransactionBuilder<TInput>() {
    return new TransactionBuilder<TInput>();
  }
}

/**
 * Builder para construir transacciones complejas paso a paso
 */
class TransactionBuilder<TInput> {
  private preValidationFn?: (input: TInput) => Promise<PreValidationResult>;
  private transactionFn?: (transaction: Transaction, input: TInput, preValidationData?: any) => Promise<any>;
  private postProcessingFn?: (result: any, input: TInput) => Promise<void>;

  preValidation(fn: (input: TInput) => Promise<PreValidationResult>): this {
    this.preValidationFn = fn;
    return this;
  }

  transaction(fn: (transaction: Transaction, input: TInput, preValidationData?: any) => Promise<any>): this {
    this.transactionFn = fn;
    return this;
  }

  postProcessing(fn: (result: any, input: TInput) => Promise<void>): this {
    this.postProcessingFn = fn;
    return this;
  }

  build(): TransactionPhases<TInput, any> {
    if (!this.preValidationFn) {
      throw new Error('Pre-validación es requerida');
    }
    if (!this.transactionFn) {
      throw new Error('Función de transacción es requerida');
    }

    return {
      preValidation: this.preValidationFn,
      transaction: this.transactionFn,
      postProcessing: this.postProcessingFn,
    };
  }
}

// Instancia singleton
export const transaccionesService = new TransaccionesService();

// Funciones de conveniencia
export const executeTransaction = <TInput, TOutput>(
  input: TInput,
  phases: TransactionPhases<TInput, TOutput>,
  options?: TransactionOptions
) => transaccionesService.executeTransaction(input, phases, options);

export const createTransactionBuilder = <TInput>() => 
  transaccionesService.createTransactionBuilder<TInput>();




