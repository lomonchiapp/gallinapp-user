/**
 * FacturasService - Generación de comprobantes simplificada
 * 
 * Características:
 * - Solo genera comprobantes de ventas existentes
 * - Numeración automática sin bloqueos
 * - Formatos predefinidos optimizados
 */

import { doc, collection, getDoc, getDocs, query, where, orderBy, serverTimestamp, Transaction } from 'firebase/firestore';
import { db } from '../components/config/firebase';
import { Venta, EstadoVenta } from './ventas.service';
import { configService } from './config.service';
import { executeTransaction, PreValidationResult, TransactionPhases } from './transacciones.service';
import { requireAuth } from './auth.service';

export interface Factura {
  id: string;
  numero: string;
  fecha: Date;
  ventaId: string; // Referencia a la venta
  venta: Venta; // Datos de la venta
  
  // Información consolidada para el comprobante
  cliente: {
    id: string;
    nombre: string;
    documento?: string;
    telefono?: string;
    email?: string;
  };
  
  resumen: {
    totalItems: number;
    subtotal: number;
    descuentoTotal: number;
    total: number;
  };
  
  // Configuración del comprobante
  formato: {
    empresa: string;
    logoUrl?: string;
    footer?: string;
  };
  
  // Metadatos
  estado: EstadoFactura;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum EstadoFactura {
  EMITIDA = 'EMITIDA',
  ANULADA = 'ANULADA',
}

export interface CrearFactura {
  ventaId: string;
  formato?: {
    incluirLogo?: boolean;
    incluirFooter?: boolean;
    template?: string;
  };
}

class FacturasService {
  private readonly COLLECTIONS = {
    FACTURAS: 'facturas',
    CONTADOR_FACTURAS: 'contador_facturas',
  };

  /**
   * Genera una factura a partir de una venta existente
   */
  async generarFactura(datos: CrearFactura): Promise<Factura> {
    const userId = requireAuth();
    
    console.log('📄 [FacturasService] Iniciando generación de factura...');
    console.log('📋 [FacturasService] Datos:', { ventaId: datos.ventaId });

    const phases: TransactionPhases<CrearFactura, Factura> = {
      preValidation: (input) => this.preValidarFactura(input, userId),
      transaction: (transaction, input, preValidationData) => 
        this.ejecutarTransaccionFactura(transaction, input, userId, preValidationData),
      postProcessing: (result, input) => this.postProcesarFactura(result, input),
    };

    const transactionResult = await executeTransaction(datos, phases, {
      operationName: 'Generar Factura',
      timeout: 15000, // 15 segundos (más rápido que ventas)
      retries: 2,
    });

    if (!transactionResult.success) {
      throw transactionResult.error || new Error('Error desconocido al generar factura');
    }

    console.log(`✅ [FacturasService] Factura ${transactionResult.data!.numero} generada exitosamente`);
    return transactionResult.data!;
  }

  /**
   * FASE 1: Pre-validación
   */
  private async preValidarFactura(datos: CrearFactura, userId: string): Promise<PreValidationResult> {
    const errors: string[] = [];
    
    try {
      console.log('🔍 [FacturasService] Pre-validando factura...');

      // Validar que la venta existe
      if (!datos.ventaId) {
        errors.push('ID de venta es requerido');
        return { isValid: false, errors };
      }

      const ventaRef = doc(db, 'ventas', datos.ventaId);
      const ventaSnap = await getDoc(ventaRef);
      
      if (!ventaSnap.exists()) {
        errors.push(`Venta ${datos.ventaId} no encontrada`);
        return { isValid: false, errors };
      }

      const venta = ventaSnap.data() as Venta;
      
      // Validar que la venta pertenece al usuario
      if (venta.createdBy !== userId) {
        errors.push('No tienes permisos para generar factura de esta venta');
        return { isValid: false, errors };
      }

      // Validar que la venta está confirmada
      if (venta.estado !== EstadoVenta.CONFIRMADA) {
        errors.push(`La venta debe estar confirmada para generar factura. Estado actual: ${venta.estado}`);
        return { isValid: false, errors };
      }

      // Verificar si ya existe una factura para esta venta
      const facturaExistenteQuery = query(
        collection(db, this.COLLECTIONS.FACTURAS),
        where('ventaId', '==', datos.ventaId),
        where('createdBy', '==', userId)
      );
      
      const facturaExistenteSnap = await getDocs(facturaExistenteQuery);
      if (!facturaExistenteSnap.empty) {
        errors.push('Ya existe una factura para esta venta');
        return { isValid: false, errors };
      }

      console.log('✅ [FacturasService] Pre-validación exitosa');
      return {
        isValid: true,
        errors: [],
        data: { venta },
      };

    } catch (error) {
      console.error('❌ [FacturasService] Error en pre-validación:', error);
      return {
        isValid: false,
        errors: [`Error en pre-validación: ${error}`],
      };
    }
  }

  /**
   * FASE 2: Transacción atómica
   */
  private async ejecutarTransaccionFactura(
    transaction: Transaction,
    datos: CrearFactura,
    userId: string,
    preValidationData: { venta: Venta }
  ): Promise<Factura> {
    const { venta } = preValidationData;
    
    console.log('⚡ [FacturasService] Ejecutando transacción atómica...');

    // LECTURAS: Generar número de factura
    const contadorRef = doc(db, this.COLLECTIONS.CONTADOR_FACTURAS, userId);
    const contadorSnap = await transaction.get(contadorRef);
    
    const contador = contadorSnap.exists() 
      ? (contadorSnap.data().siguienteNumero || 1)
      : 1;

    // ESCRITURAS: Crear factura
    const config = configService.getConfig();
    const numero = `${config.numeracion.prefijo}-${contador.toString().padStart(4, '0')}`;
    const ahora = new Date();
    
    const facturaRef = doc(collection(db, this.COLLECTIONS.FACTURAS));
    const nuevaFactura: Factura = {
      id: facturaRef.id,
      numero,
      fecha: ahora,
      ventaId: venta.id,
      venta,
      cliente: {
        id: venta.cliente.id,
        nombre: venta.cliente.nombre,
        documento: venta.cliente.documento,
        telefono: venta.cliente.telefono,
        email: venta.cliente.email,
      },
      resumen: {
        totalItems: venta.items.length,
        subtotal: venta.subtotal,
        descuentoTotal: venta.descuentoTotal,
        total: venta.total,
      },
      formato: {
        empresa: config.empresa.nombre,
        logoUrl: undefined, // TODO: Implementar manejo de logo
        footer: `Factura generada automáticamente - ${ahora.toLocaleDateString('es-DO')}`,
      },
      estado: EstadoFactura.EMITIDA,
      createdBy: userId,
      createdAt: ahora,
      updatedAt: ahora,
    };

    // Limpiar undefined values
    const facturaLimpia = this.cleanUndefinedValues({
      ...nuevaFactura,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    transaction.set(facturaRef, facturaLimpia);

    // Actualizar contador
    if (contadorSnap.exists()) {
      transaction.update(contadorRef, {
        siguienteNumero: contador + 1,
        updatedAt: serverTimestamp(),
      });
    } else {
      transaction.set(contadorRef, {
        siguienteNumero: contador + 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    console.log('✅ [FacturasService] Transacción atómica completada');
    return nuevaFactura;
  }

  /**
   * FASE 3: Post-procesamiento
   */
  private async postProcesarFactura(factura: Factura, datos: CrearFactura): Promise<void> {
    console.log('🔧 [FacturasService] Post-procesando factura...');
    
    try {
      // Aquí se pueden agregar operaciones como:
      // - Enviar factura por email
      // - Generar PDF
      // - Actualizar estadísticas
      // - Notificar al cliente
      
      console.log('✅ [FacturasService] Post-procesamiento completado');
    } catch (error) {
      console.warn('⚠️ [FacturasService] Error en post-procesamiento (no crítico):', error);
    }
  }

  /**
   * Obtiene todas las facturas
   */
  async getFacturas(): Promise<Factura[]> {
    try {
      const userId = requireAuth();
      const q = query(
        collection(db, this.COLLECTIONS.FACTURAS),
        where('createdBy', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const facturas: Factura[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        facturas.push({
          id: doc.id,
          ...data,
          fecha: data.fecha?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Factura);
      });
      
      console.log(`✅ [FacturasService] ${facturas.length} facturas obtenidas`);
      return facturas;
    } catch (error) {
      console.error('❌ [FacturasService] Error al obtener facturas:', error);
      return [];
    }
  }

  /**
   * Obtiene una factura por ID
   */
  async getFactura(id: string): Promise<Factura | null> {
    try {
      const facturaRef = doc(db, this.COLLECTIONS.FACTURAS, id);
      const facturaSnap = await getDoc(facturaRef);
      
      if (!facturaSnap.exists()) {
        return null;
      }
      
      const data = facturaSnap.data();
      return {
        id: facturaSnap.id,
        ...data,
        fecha: data.fecha?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Factura;
    } catch (error) {
      console.error('❌ [FacturasService] Error al obtener factura:', error);
      return null;
    }
  }

  /**
   * Anula una factura
   */
  async anularFactura(id: string): Promise<void> {
    try {
      const userId = requireAuth();
      const facturaRef = doc(db, this.COLLECTIONS.FACTURAS, id);
      
      // Verificar que la factura existe y pertenece al usuario
      const facturaSnap = await getDoc(facturaRef);
      if (!facturaSnap.exists()) {
        throw new Error('Factura no encontrada');
      }
      
      const factura = facturaSnap.data() as Factura;
      if (factura.createdBy !== userId) {
        throw new Error('No tienes permisos para anular esta factura');
      }
      
      if (factura.estado === EstadoFactura.ANULADA) {
        throw new Error('La factura ya está anulada');
      }

      // Actualizar estado
      await facturaRef.update({
        estado: EstadoFactura.ANULADA,
        updatedAt: serverTimestamp(),
      });

      console.log(`✅ [FacturasService] Factura ${factura.numero} anulada`);
    } catch (error) {
      console.error('❌ [FacturasService] Error al anular factura:', error);
      throw error;
    }
  }

  // Métodos utilitarios privados

  private cleanUndefinedValues(obj: any): any {
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
}

// Instancia singleton
export const facturasService = new FacturasService();

// Funciones de conveniencia
export const generarFactura = (datos: CrearFactura) => facturasService.generarFactura(datos);
export const getFacturas = () => facturasService.getFacturas();
export const getFactura = (id: string) => facturasService.getFactura(id);
export const anularFactura = (id: string) => facturasService.anularFactura(id);




