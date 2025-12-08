/**
 * VentasService - Lógica de ventas atómica separada de facturas
 * 
 * Características:
 * - Lógica de ventas independiente de facturas
 * - Validaciones atómicas dentro de transacciones
 * - Manejo específico por tipo de producto (lotes, unidades, huevos)
 * - Trazabilidad completa de operaciones
 */

import { doc, collection, serverTimestamp, DocumentReference, Transaction, getDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../components/config/firebase';
import { EstadoLote, TipoAve } from '../types/enums';
import { 
  Cliente, 
  Producto, 
  ProductoHuevos, 
  ProductoLibrasEngorde,
  TipoProducto, 
  UnidadVentaHuevos, 
  TipoVenta,
} from '../types/facturacion';
import { 
  executeTransaction, 
  PreValidationResult, 
  TransactionPhases,
  transaccionesService 
} from './transacciones.service';
import { configService } from './config.service';
import { inventarioService } from './inventario.service';
import { requireAuth } from './auth.service';

// Nuevos tipos específicos para ventas
export interface ItemVenta {
  id: string;
  productoId: string;
  producto: Producto;
  cantidad: number;
  precioUnitario: number;
  descuento?: number;
  subtotal: number;
  total: number;
  // Para ventas por libras: cantidad de pollos que representa esta venta
  cantidadPollos?: number;
}

export interface CrearVenta {
  cliente: Cliente;
  items: ItemVenta[];
  metodoPago: string;
  observaciones?: string;
}

export interface Venta {
  id: string;
  numero: string; // Número único de venta
  fecha: Date;
  cliente: Cliente;
  items: ItemVenta[];
  subtotal: number;
  descuentoTotal: number;
  total: number;
  metodoPago: string;
  observaciones?: string;
  estado: EstadoVenta;
  
  // Metadatos
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum EstadoVenta {
  PENDIENTE = 'PENDIENTE',
  CONFIRMADA = 'CONFIRMADA',
  CANCELADA = 'CANCELADA',
}

interface VentaValidationData {
  lotesData: Map<string, {
    loteRef: DocumentReference;
    lote: any;
    tipo: string;
    item: ItemVenta;
  }>;
  config: any;
}

class VentasService {
  private readonly COLLECTIONS = {
    VENTAS: 'ventas',
    VENTAS_HUEVOS: 'ventasHuevos',
    CONTADOR_VENTAS: 'contador_ventas',
  };

  /**
   * Crea una nueva venta usando el patrón de transacción en 3 fases
   */
  async crearVenta(datosVenta: CrearVenta): Promise<Venta> {
    const userId = requireAuth();
    
    console.log('🛒 [VentasService] Iniciando creación de venta...');
    console.log('📋 [VentasService] Datos:', {
      cliente: datosVenta.cliente.nombre,
      items: datosVenta.items.length,
      total: datosVenta.items.reduce((sum, item) => sum + item.total, 0),
    });

    const phases: TransactionPhases<CrearVenta, Venta> = {
      preValidation: (input) => this.preValidarVenta(input, userId),
      transaction: (transaction, input, preValidationData) => 
        this.ejecutarTransaccionVenta(transaction, input, userId, preValidationData),
      postProcessing: (result, input) => this.postProcesarVenta(result, input),
    };

    // Calcular timeout dinámico basado en la complejidad de la venta
    // Base: 30 segundos + 5 segundos por cada item adicional después del primero
    const baseTimeout = 30000; // 30 segundos base
    const timeoutPorItem = 5000; // 5 segundos adicionales por item
    const timeoutCalculado = baseTimeout + (datosVenta.items.length - 1) * timeoutPorItem;
    const timeoutFinal = Math.min(timeoutCalculado, 60000); // Máximo 60 segundos
    
    console.log(`⏱️ [VentasService] Timeout calculado: ${timeoutFinal}ms para ${datosVenta.items.length} items`);
    
    const transactionResult = await executeTransaction(datosVenta, phases, {
      operationName: 'Crear Venta',
      timeout: timeoutFinal,
      retries: 2,
    });

    if (!transactionResult.success) {
      throw transactionResult.error || new Error('Error desconocido al crear venta');
    }

    console.log(`✅ [VentasService] Venta ${transactionResult.data!.numero} creada exitosamente`);
    return transactionResult.data!;
  }

  /**
   * FASE 1: Pre-validación fuera de transacción
   */
  private async preValidarVenta(datosVenta: CrearVenta, userId: string): Promise<PreValidationResult> {
    const errors: string[] = [];
    
    try {
      console.log('🔍 [VentasService] Pre-validando venta...');

      // Validar estructura básica
      if (!datosVenta.cliente?.id) {
        errors.push('Cliente es requerido');
      }

      if (!datosVenta.items || datosVenta.items.length === 0) {
        errors.push('La venta debe tener al menos un item');
      }

      // Validar items básicos
      for (const item of datosVenta.items) {
        if (item.cantidad <= 0) {
          errors.push(`Cantidad inválida para producto ${item.producto.nombre}`);
        }
        if (item.precioUnitario <= 0) {
          errors.push(`Precio inválido para producto ${item.producto.nombre}`);
        }
      }

      if (errors.length > 0) {
        return { isValid: false, errors };
      }

      // Obtener configuración
      const config = configService.getConfig();

      // Pre-validar disponibilidad de productos
      const lotesData = new Map();
      
      for (const item of datosVenta.items) {
        if (item.producto.tipo === TipoProducto.HUEVOS) {
          // Para huevos, validar desde el producto mismo
          const productoHuevos = item.producto as ProductoHuevos;
          if (!productoHuevos.registrosIds || productoHuevos.registrosIds.length === 0) {
            errors.push(`Producto de huevos ${item.producto.nombre} no tiene registros asociados`);
          }
          if (item.cantidad > productoHuevos.disponible) {
            errors.push(`Stock insuficiente para ${item.producto.nombre}. Disponible: ${productoHuevos.disponible}, Solicitado: ${item.cantidad}`);
          }
        } else {
          // Para lotes, extraer información y preparar referencias
          console.log(`🔍 [VentasService] Procesando producto: ${item.productoId}, tipo: ${item.producto.tipo}`);
          
          const { tipo, loteId } = this.extractLoteIdFromProductoId(item.productoId);
          console.log(`📋 [VentasService] Extraído - tipo: ${tipo}, loteId: ${loteId}`);
          
          // Verificar si es producto de libras
          if (item.producto.tipo === TipoProducto.LIBRAS_POLLOS_ENGORDE && tipo !== 'libras') {
            console.error(`❌ [VentasService] INCONSISTENCIA: producto.tipo es LIBRAS_POLLOS_ENGORDE pero tipo extraído es ${tipo}`);
            console.error(`❌ [VentasService] productoId: ${item.productoId}`);
          }
          
          // Validar que el producto tenga tipoAve
          if (!item.producto.tipoAve) {
            errors.push(`Producto ${item.producto.nombre} no tiene tipo de ave definido`);
            continue;
          }
          
          console.log(`🐔 [VentasService] TipoAve del producto: ${item.producto.tipoAve}`);
          
          let loteRef: DocumentReference | null = null;
          try {
            loteRef = this.getLoteRef(item.producto.tipoAve, loteId);
            
            // Validar que la referencia fue creada correctamente
            if (!loteRef) {
              errors.push(`No se pudo crear referencia para lote ${loteId}`);
              console.error(`❌ [VentasService] loteRef es null después de getLoteRef`);
              continue;
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            errors.push(`Error al obtener referencia del lote ${loteId}: ${errorMsg}`);
            console.error(`❌ [VentasService] Error al obtener referencia del lote ${loteId}:`, error);
            continue;
          }
          
          // Validación final antes de usar loteRef
          if (!loteRef) {
            errors.push(`Referencia de lote es null para ${loteId}`);
            console.error(`❌ [VentasService] loteRef es null antes de leer lote`);
            continue;
          }
          
          // Leer lote para pre-validación
          try {
            console.log(`📖 [VentasService] Leyendo lote ${loteId}...`);
            // Usar getDoc() en lugar de loteRef.get() para compatibilidad con React Native
            const loteSnap = await getDoc(loteRef);
            if (!loteSnap.exists()) {
              errors.push(`Lote ${loteId} no encontrado`);
              continue;
            }
            
            const lote = loteSnap.data();
            if (lote.estado === 'VENDIDO') {
              errors.push(`Lote ${loteId} ya está vendido`);
              continue;
            }
            
            // Validar disponibilidad según tipo
            if (tipo === 'unidades' && item.cantidad > lote.cantidadActual) {
              errors.push(`Stock insuficiente en lote ${loteId}. Disponible: ${lote.cantidadActual}, Solicitado: ${item.cantidad}`);
              continue;
            }
            
            if (tipo === 'libras') {
              const productoLibras = item.producto as ProductoLibrasEngorde;
              
              // Validar que el producto tenga peso promedio
              if (!productoLibras.pesoPromedio || productoLibras.pesoPromedio <= 0) {
                errors.push(`El lote ${lote.nombre || loteId} no tiene registros de peso. Debe registrar un pesaje antes de vender por libras.`);
                continue;
              }
              
              const pesoPromedio = productoLibras.pesoPromedio;
              const pollosNecesarios = Math.ceil(item.cantidad / pesoPromedio);
              
              if (pollosNecesarios > lote.cantidadActual) {
                errors.push(`Stock insuficiente en lote ${loteId}. Se necesitan ${pollosNecesarios} pollos (${item.cantidad} libras / ${pesoPromedio.toFixed(2)} libras/pollo) pero solo hay ${lote.cantidadActual} disponibles`);
                continue;
              }
            }
            
            lotesData.set(`${item.producto.tipoAve}-${loteId}`, {
              loteRef,
              lote,
              tipo,
              item,
            });
          } catch (error) {
            errors.push(`Error al validar lote ${loteId}: ${error}`);
          }
        }
      }

      if (errors.length > 0) {
        return { isValid: false, errors };
      }

      console.log('✅ [VentasService] Pre-validación exitosa');
      return {
        isValid: true,
        errors: [],
        data: { lotesData, config } as VentaValidationData,
      };

    } catch (error) {
      console.error('❌ [VentasService] Error en pre-validación:', error);
      return {
        isValid: false,
        errors: [`Error en pre-validación: ${error}`],
      };
    }
  }

  /**
   * FASE 2: Transacción atómica
   */
  private async ejecutarTransaccionVenta(
    transaction: Transaction,
    datosVenta: CrearVenta,
    userId: string,
    validationData: VentaValidationData
  ): Promise<Venta> {
    const { lotesData, config } = validationData;

    console.log('⚡ [VentasService] Ejecutando transacción atómica...');
    const inicioTransaccion = Date.now();

    // ========== FASE 1: TODAS LAS LECTURAS ==========
    
    // LECTURA 1: Generar número de venta
    console.log('📖 [VentasService] LECTURA 1: Obteniendo contador de ventas...');
    const contadorRef = doc(db, this.COLLECTIONS.CONTADOR_VENTAS, userId);
    const contadorSnap = await transaction.get(contadorRef);
    console.log(`✅ [VentasService] Contador obtenido en ${Date.now() - inicioTransaccion}ms`);
    
    const contador = contadorSnap.exists() 
      ? (contadorSnap.data().siguienteNumero || 1)
      : 1;

    // LECTURA 2: Re-leer lotes dentro de transacción (race condition check)
    console.log(`📖 [VentasService] LECTURA 2: Re-leyendo ${lotesData.size} lotes...`);
    const inicioLecturaLotes = Date.now();
    const lotesEnTransaccion = new Map();
    for (const [key, data] of lotesData.entries()) {
      console.log(`📖 [VentasService] Leyendo lote ${data.lote.id} (tipo: ${data.tipo})...`);
      const loteSnap = await transaction.get(data.loteRef);
      if (!loteSnap.exists()) {
        throw new Error(`Lote ${data.lote.id} no encontrado en transacción`);
      }
      
      const lote = loteSnap.data();
      if (lote.estado === 'VENDIDO') {
        throw new Error(`Lote ${data.lote.id} fue vendido mientras se procesaba`);
      }
      
      // Re-validar cantidad
      if (data.tipo === 'unidades' && data.item.cantidad > lote.cantidadActual) {
        throw new Error(`Stock insuficiente en lote ${data.lote.id}. Disponible: ${lote.cantidadActual}, Solicitado: ${data.item.cantidad}`);
      }
      
      if (data.tipo === 'libras') {
        const productoLibras = data.item.producto as ProductoLibrasEngorde;
        
        // Validar que el producto tenga peso promedio
        if (!productoLibras.pesoPromedio || productoLibras.pesoPromedio <= 0) {
          throw new Error(`El lote ${data.lote.nombre || data.lote.id} no tiene registros de peso. Debe registrar un pesaje antes de vender por libras.`);
        }
        
        const pesoPromedio = productoLibras.pesoPromedio;
        const pollosNecesarios = Math.ceil(data.item.cantidad / pesoPromedio);
        
        if (pollosNecesarios > lote.cantidadActual) {
          throw new Error(`Stock insuficiente en lote ${data.lote.id}. Se necesitan ${pollosNecesarios} pollos (${data.item.cantidad} libras / ${pesoPromedio.toFixed(2)} libras/pollo) pero solo hay ${lote.cantidadActual} disponibles`);
        }
      }
      
      lotesEnTransaccion.set(key, { ...data, lote });
    }
    console.log(`✅ [VentasService] Lotes re-leídos en ${Date.now() - inicioLecturaLotes}ms`);

    // LECTURA 3: Leer todos los registros de huevos necesarios ANTES de cualquier escritura
    console.log('📖 [VentasService] LECTURA 3: Leyendo registros de huevos...');
    const inicioLecturaHuevos = Date.now();
    const registrosHuevosInfo = new Map<string, Array<{ id: string; fecha: Date; cantidadTotal: number; cantidadVendida: number; cantidadDisponible: number; ref: DocumentReference }>>();
    
    for (const item of datosVenta.items) {
      if (item.producto.tipo === TipoProducto.HUEVOS) {
        const productoHuevos = item.producto as ProductoHuevos;
        
        if (!productoHuevos.registrosIds || productoHuevos.registrosIds.length === 0) {
          throw new Error(`Producto de huevos ${productoHuevos.nombre} no tiene registros asociados`);
        }

        const registrosConInfo: Array<{ id: string; fecha: Date; cantidadTotal: number; cantidadVendida: number; cantidadDisponible: number; ref: DocumentReference }> = [];
        
        // Leer todos los registros de este producto
        for (const registroId of productoHuevos.registrosIds) {
          const registroRef = doc(db, 'registrosPonedoras', registroId);
          const registroSnap = await transaction.get(registroRef);
          
          if (!registroSnap.exists()) {
            console.warn(`⚠️ [VentasService] Registro ${registroId} no encontrado, saltando...`);
            continue;
          }

          const registroData = registroSnap.data();
          const cantidadTotal = registroData?.cantidadHuevos || registroData?.cantidad || 0;
          const cantidadVendidaActual = registroData?.cantidadVendida || 0;
          const cantidadDisponible = cantidadTotal - cantidadVendidaActual;
          
          // Obtener fecha del registro
          let fecha: Date;
          if (registroData.fecha?.toDate) {
            fecha = registroData.fecha.toDate();
          } else if (registroData.fecha instanceof Date) {
            fecha = registroData.fecha;
          } else {
            fecha = new Date(registroData.fecha || registroData.createdAt?.toDate() || Date.now());
          }

          if (cantidadDisponible > 0) {
            registrosConInfo.push({
              id: registroId,
              fecha,
              cantidadTotal,
              cantidadVendida: cantidadVendidaActual,
              cantidadDisponible,
              ref: registroRef,
            });
          }
        }

        // Ordenar por fecha (más antiguos primero - FIFO)
        registrosConInfo.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
        
        // Validar disponibilidad total antes de continuar
        const disponibilidadTotal = registrosConInfo.reduce((sum, r) => sum + r.cantidadDisponible, 0);
        let cantidadHuevosNecesaria: number;
        if (productoHuevos.unidadVenta === UnidadVentaHuevos.CAJAS) {
          cantidadHuevosNecesaria = item.cantidad * (productoHuevos.cantidadPorCaja || config.cantidadHuevosPorCaja);
        } else {
          cantidadHuevosNecesaria = item.cantidad;
        }
        
        if (disponibilidadTotal < cantidadHuevosNecesaria) {
          throw new Error(`Stock insuficiente para ${productoHuevos.nombre}. Disponible: ${disponibilidadTotal}, Solicitado: ${cantidadHuevosNecesaria}`);
        }
        
        registrosHuevosInfo.set(item.productoId, registrosConInfo);
      }
    }
    console.log(`✅ [VentasService] Registros de huevos leídos en ${Date.now() - inicioLecturaHuevos}ms`);

    // ========== FASE 2: TODAS LAS ESCRITURAS ==========
    console.log('✍️ [VentasService] FASE 2: Iniciando escrituras...');
    const inicioEscrituras = Date.now();
    const numero = `VEN-${contador.toString().padStart(4, '0')}`;
    const ahora = new Date();
    
    // Calcular totales
    const subtotal = datosVenta.items.reduce((sum, item) => sum + item.subtotal, 0);
    const descuentoTotal = datosVenta.items.reduce((sum, item) => sum + (item.descuento || 0), 0);
    const total = subtotal - descuentoTotal;

    // Crear venta
    const ventaRef = doc(collection(db, this.COLLECTIONS.VENTAS));
    const nuevaVenta: Venta = {
      id: ventaRef.id,
      numero,
      fecha: ahora,
      cliente: datosVenta.cliente,
      items: datosVenta.items,
      subtotal,
      descuentoTotal,
      total,
      metodoPago: datosVenta.metodoPago,
      observaciones: datosVenta.observaciones,
      estado: EstadoVenta.CONFIRMADA,
      createdBy: userId,
      createdAt: ahora,
      updatedAt: ahora,
    };

    // Limpiar undefined values antes de guardar
    // Incluir el ID en el documento para facilitar las consultas
    const ventaLimpia = transaccionesService.cleanUndefinedValues({
      ...nuevaVenta,
      id: nuevaVenta.id, // Guardar el ID en el documento
      fecha: serverTimestamp(), // Guardar fecha como timestamp de Firestore
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    transaction.set(ventaRef, ventaLimpia);
    
    console.log('✅ [VentasService] Venta creada con ID:', nuevaVenta.id);

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

    // Actualizar inventario de lotes
    for (const [key, data] of lotesEnTransaccion.entries()) {
      const { loteRef, lote, tipo, item } = data;
      
      console.log(`🔄 [VentasService] Actualizando lote ${lote.id}, tipo: ${tipo}, cantidadActual actual: ${lote.cantidadActual}`);
      
      if (tipo === 'lote') {
        // Marcar lote como vendido
        console.log(`✅ [VentasService] Marcando lote ${lote.id} como VENDIDO`);
        transaction.update(loteRef, {
          estado: EstadoLote.VENDIDO,
          fechaVenta: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else if (tipo === 'unidades') {
        // Reducir cantidad
        const nuevaCantidad = lote.cantidadActual - item.cantidad;
        console.log(`✅ [VentasService] Debitando ${item.cantidad} unidades del lote ${lote.id}: ${lote.cantidadActual} - ${item.cantidad} = ${nuevaCantidad}`);
        const actualizacion: any = {
          cantidadActual: nuevaCantidad,
          updatedAt: serverTimestamp(),
        };
        
        if (nuevaCantidad === 0) {
          actualizacion.estado = EstadoLote.VENDIDO;
          actualizacion.fechaVenta = serverTimestamp();
        }
        
        transaction.update(loteRef, actualizacion);
      } else if (tipo === 'libras') {
        // Calcular cuántos pollos debitar basándose en las libras vendidas
        const productoLibras = item.producto as ProductoLibrasEngorde;
        
        // Validar que el producto tenga peso promedio
        if (!productoLibras.pesoPromedio || productoLibras.pesoPromedio <= 0) {
          throw new Error(`El lote ${lote.nombre || lote.id} no tiene registros de peso. Debe registrar un pesaje antes de vender por libras.`);
        }
        
        const pesoPromedio = productoLibras.pesoPromedio;
        const librasVendidas = item.cantidad;
        
        // Calcular pollos a debitar: libras vendidas / peso promedio (redondeado hacia arriba)
        const pollosADebitar = Math.ceil(librasVendidas / pesoPromedio);
        
        console.log(`📊 [VentasService] Venta de libras: ${librasVendidas} libras, peso promedio: ${pesoPromedio.toFixed(2)} libras/pollo, pollos a debitar: ${pollosADebitar}`);
        console.log(`📊 [VentasService] Lote ${lote.id} - Cantidad actual ANTES del debito: ${lote.cantidadActual}`);
        
        // Validar que hay suficientes pollos disponibles
        if (pollosADebitar > lote.cantidadActual) {
          throw new Error(`Stock insuficiente. Se necesitan ${pollosADebitar} pollos pero solo hay ${lote.cantidadActual} disponibles`);
        }
        
        // Reducir cantidad de pollos
        const nuevaCantidad = lote.cantidadActual - pollosADebitar;
        console.log(`✅ [VentasService] Debitando ${pollosADebitar} pollos del lote ${lote.id}: ${lote.cantidadActual} - ${pollosADebitar} = ${nuevaCantidad}`);
        
        const actualizacion: any = {
          cantidadActual: nuevaCantidad,
          updatedAt: serverTimestamp(),
        };
        
        if (nuevaCantidad === 0) {
          actualizacion.estado = EstadoLote.VENDIDO;
          actualizacion.fechaVenta = serverTimestamp();
          console.log(`✅ [VentasService] Lote ${lote.id} marcado como VENDIDO (cantidad llegó a 0)`);
        }
        
        console.log(`🔄 [VentasService] Ejecutando transaction.update para lote ${lote.id} con cantidadActual: ${nuevaCantidad}`);
        transaction.update(loteRef, actualizacion);
        console.log(`✅ [VentasService] transaction.update ejecutado para lote ${lote.id}`);
      } else {
        console.warn(`⚠️ [VentasService] Tipo desconocido: ${tipo} para lote ${lote.id}`);
      }
    }

    // ESCRITURA: Registrar ventas de huevos y debitar de registros de producción
    for (const item of datosVenta.items) {
      if (item.producto.tipo === TipoProducto.HUEVOS) {
        const productoHuevos = item.producto as ProductoHuevos;
        
        // Calcular cantidad real de huevos
        let cantidadHuevos: number;
        if (productoHuevos.unidadVenta === UnidadVentaHuevos.CAJAS) {
          cantidadHuevos = item.cantidad * (productoHuevos.cantidadPorCaja || config.cantidadHuevosPorCaja);
        } else {
          cantidadHuevos = item.cantidad;
        }

        // Obtener registros ya leídos en la fase de lecturas
        const registrosConInfo = registrosHuevosInfo.get(item.productoId);
        if (!registrosConInfo || registrosConInfo.length === 0) {
          throw new Error(`No se encontraron registros disponibles para ${productoHuevos.nombre}`);
        }

        // Distribuir la venta entre los registros ordenados (FIFO)
        let cantidadRestante = cantidadHuevos;
        const registrosAfectados: Array<{ registroId: string; cantidadVendida: number }> = [];

        for (const registroInfo of registrosConInfo) {
          if (cantidadRestante <= 0) break;

          const cantidadAVenderDeEsteRegistro = Math.min(registroInfo.cantidadDisponible, cantidadRestante);
          const nuevaCantidadVendida = registroInfo.cantidadVendida + cantidadAVenderDeEsteRegistro;

          // Actualizar registro con cantidad vendida (usar la referencia ya obtenida)
          transaction.update(registroInfo.ref, {
            cantidadVendida: nuevaCantidadVendida,
            updatedAt: serverTimestamp(),
          });

          registrosAfectados.push({
            registroId: registroInfo.id,
            cantidadVendida: cantidadAVenderDeEsteRegistro,
          });

          cantidadRestante -= cantidadAVenderDeEsteRegistro;
        }

        if (cantidadRestante > 0) {
          throw new Error(`No hay suficientes huevos disponibles. Faltan ${cantidadRestante} huevos de los ${cantidadHuevos} solicitados.`);
        }

        // Crear registro de venta de huevos
        const ventaHuevosRef = doc(collection(db, this.COLLECTIONS.VENTAS_HUEVOS));
        const ventaHuevosData = {
          ventaId: nuevaVenta.id,
          loteId: productoHuevos.loteId,
          productoId: item.productoId,
          productoNombre: item.producto.nombre,
          cantidad: cantidadHuevos,
          cantidadCajas: productoHuevos.unidadVenta === UnidadVentaHuevos.CAJAS ? item.cantidad : undefined,
          unidadVenta: productoHuevos.unidadVenta,
          registrosIds: registrosAfectados.map(r => r.registroId),
          registrosDetalle: registrosAfectados, // Detalle de cuánto se vendió de cada registro
          createdBy: userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        transaction.set(ventaHuevosRef, transaccionesService.cleanUndefinedValues(ventaHuevosData));
        
        console.log(`🥚 [VentasService] ${cantidadHuevos} huevos debitados de ${registrosAfectados.length} registros`);
      }
    }

    console.log('✅ [VentasService] Transacción atómica completada');
    console.log('📋 [VentasService] Venta retornada con ID:', nuevaVenta.id);
    
    // Asegurar que el ID esté presente
    if (!nuevaVenta.id) {
      console.error('❌ [VentasService] ERROR: Venta creada sin ID!');
      throw new Error('La venta se creó sin ID');
    }
    
    return nuevaVenta;
  }

  /**
   * FASE 3: Post-procesamiento fuera de transacción
   */
  private async postProcesarVenta(venta: Venta, datosVenta: CrearVenta): Promise<void> {
    console.log('🔧 [VentasService] Post-procesando venta...');
    
    try {
      // Invalidar cache de inventario
      inventarioService.invalidateCache('all');
      console.log('🗑️ [VentasService] Cache de inventario invalidado');
      
      // Generar factura automáticamente
      try {
        const { facturasService } = await import('./facturas.service');
        const factura = await facturasService.generarFactura({
          ventaId: venta.id,
          formato: {
            empresa: 'ASOAVES',
            footer: 'Gracias por su preferencia',
          },
        });
        console.log(`✅ [VentasService] Factura ${factura.numero} generada automáticamente para venta ${venta.numero}`);
      } catch (facturaError) {
        console.warn('⚠️ [VentasService] Error al generar factura automáticamente (no crítico):', facturaError);
        // No lanzamos el error para que la venta se complete exitosamente
        // La factura se puede generar manualmente después
      }
      
      // Aquí se pueden agregar más operaciones de post-procesamiento:
      // - Enviar notificaciones
      // - Actualizar estadísticas
      // - Generar reportes
      // - Etc.
      
      console.log('✅ [VentasService] Post-procesamiento completado');
    } catch (error) {
      console.warn('⚠️ [VentasService] Error en post-procesamiento (no crítico):', error);
    }
  }

  // Métodos utilitarios

  private extractLoteIdFromProductoId(productoId: string): { tipo: string; loteId: string } {
    if (!productoId || productoId.length === 0) {
      throw new Error('ProductoId vacío o inválido');
    }
    
    const parts = productoId.split('-');
    if (parts.length < 2) {
      throw new Error(`Formato de productoId inválido: ${productoId}`);
    }
    
    // Formato: "lote-{loteId}"
    if (parts[0] === 'lote' && parts.length >= 2) {
      return { tipo: 'lote', loteId: parts.slice(1).join('-') };
    }
    
    // Formato: "unidades-{loteId}"
    if (parts[0] === 'unidades' && parts.length >= 2) {
      return { tipo: 'unidades', loteId: parts.slice(1).join('-') };
    }
    
    // Formato: "libras-{loteId}"
    if (parts[0] === 'libras' && parts.length >= 2) {
      return { tipo: 'libras', loteId: parts.slice(1).join('-') };
    }
    
    // Formato: "huevos-unidades-{loteId}-{timestamp}" o "huevos-cajas-{loteId}-{timestamp}"
    if (parts[0] === 'huevos' && parts.length >= 4) {
      // El loteId está en la posición 2 (índice 2)
      // parts = ["huevos", "unidades", "{loteId}", "{timestamp}", ...]
      const loteId = parts[2];
      if (!loteId || loteId.length === 0) {
        throw new Error(`LoteId vacío en productoId de huevos: ${productoId}`);
      }
      return { tipo: parts[1], loteId }; // tipo será "unidades" o "cajas"
    }
    
    // Formato desconocido, intentar extraer como antes
    const tipo = parts[0];
    const loteId = parts.slice(1).join('-');
    
    if (!loteId || loteId.length === 0) {
      throw new Error(`LoteId vacío después de parsing: ${productoId}`);
    }
    
    console.warn(`⚠️ [VentasService] Formato de productoId no reconocido, usando parsing genérico: ${productoId}`);
    return { tipo, loteId };
  }

  private getLoteRef(tipoAve: TipoAve, loteId: string): DocumentReference {
    // Validar que loteId no esté vacío
    if (!loteId || typeof loteId !== 'string' || loteId.trim().length === 0) {
      throw new Error(`LoteId vacío o inválido para tipoAve: ${tipoAve}. LoteId recibido: "${loteId}"`);
    }
    
    let collectionName: string;
    
    switch (tipoAve) {
      case TipoAve.PONEDORA:
        collectionName = 'lotesPonedoras';
        break;
      case TipoAve.POLLO_LEVANTE:
        collectionName = 'lotesLevantes';
        break;
      case TipoAve.POLLO_ENGORDE:
        collectionName = 'lotesEngorde';
        break;
      default:
        throw new Error(`Tipo de ave no válido: ${tipoAve}`);
    }
    
    console.log(`📂 [VentasService] Creando referencia: ${collectionName}/${loteId}`);
    
    // Validar que db está inicializado
    if (!db) {
      throw new Error('Firestore no está inicializado. db es undefined');
    }
    
    // doc() siempre retorna una referencia válida, no necesitamos validar más
    const ref = doc(db, collectionName, loteId.trim());
    
    console.log(`✅ [VentasService] Referencia creada exitosamente`);
    return ref;
  }

  /**
   * Obtiene todas las ventas del usuario
   */
  async getVentas(): Promise<Venta[]> {
    try {
      const userId = requireAuth();
      
      console.log('📋 [VentasService] Obteniendo ventas del usuario:', userId);
      console.log('📋 [VentasService] Colección:', this.COLLECTIONS.VENTAS);
      
      // Intentar con orderBy primero, si falla intentar sin orderBy
      let querySnapshot;
      try {
        const q = query(
          collection(db, this.COLLECTIONS.VENTAS),
          where('createdBy', '==', userId),
          orderBy('fecha', 'desc')
        );
        querySnapshot = await getDocs(q);
      } catch (orderByError: any) {
        console.warn('⚠️ [VentasService] Error con orderBy, intentando sin ordenamiento:', orderByError);
        
        // Si el error es por índice faltante, intentar sin orderBy
        if (orderByError?.code === 'failed-precondition' || orderByError?.message?.includes('index')) {
          console.log('📝 [VentasService] Índice faltante, consultando sin orderBy...');
          const q = query(
            collection(db, this.COLLECTIONS.VENTAS),
            where('createdBy', '==', userId)
          );
          querySnapshot = await getDocs(q);
        } else {
          // Si es otro error, lanzarlo
          throw orderByError;
        }
      }
      const ventas: Venta[] = [];
      
      console.log(`📊 [VentasService] ${querySnapshot.size} documentos encontrados`);
      
      querySnapshot.forEach((doc) => {
        try {
          const data = doc.data();
          console.log(`📄 [VentasService] Procesando venta ${doc.id}:`, {
            numero: data.numero,
            fecha: data.fecha,
            estado: data.estado,
          });
          
          // Convertir fecha de manera más robusta
          let fecha: Date;
          if (data.fecha?.toDate) {
            fecha = data.fecha.toDate();
          } else if (data.fecha instanceof Date) {
            fecha = data.fecha;
          } else if (data.fecha?.seconds) {
            fecha = new Date(data.fecha.seconds * 1000);
          } else if (data.fecha) {
            fecha = new Date(data.fecha);
          } else {
            fecha = new Date();
          }
          
          // Convertir createdAt
          let createdAt: Date;
          if (data.createdAt?.toDate) {
            createdAt = data.createdAt.toDate();
          } else if (data.createdAt instanceof Date) {
            createdAt = data.createdAt;
          } else if (data.createdAt?.seconds) {
            createdAt = new Date(data.createdAt.seconds * 1000);
          } else {
            createdAt = fecha; // Fallback a fecha de venta
          }
          
          // Convertir updatedAt
          let updatedAt: Date;
          if (data.updatedAt?.toDate) {
            updatedAt = data.updatedAt.toDate();
          } else if (data.updatedAt instanceof Date) {
            updatedAt = data.updatedAt;
          } else if (data.updatedAt?.seconds) {
            updatedAt = new Date(data.updatedAt.seconds * 1000);
          } else {
            updatedAt = createdAt; // Fallback a createdAt
          }
          
          // Usar el ID del documento o el ID guardado en el documento
          const ventaId = data.id || doc.id;
          
          ventas.push({
            id: ventaId,
            numero: data.numero || `VEN-${ventaId.substring(0, 8)}`,
            fecha,
            cliente: data.cliente || { id: '', nombre: 'Cliente desconocido' },
            items: data.items || [],
            metodoPago: data.metodoPago || 'EFECTIVO',
            observaciones: data.observaciones,
            subtotal: data.subtotal || 0,
            descuentoTotal: data.descuentoTotal || 0,
            total: data.total || 0,
            estado: data.estado || EstadoVenta.PENDIENTE,
            createdAt,
            updatedAt,
          } as Venta);
        } catch (itemError) {
          console.error(`❌ [VentasService] Error al procesar venta ${doc.id}:`, itemError);
        }
      });
      
      // Ordenar manualmente si no se pudo hacer con orderBy
      ventas.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
      
      console.log(`✅ [VentasService] ${ventas.length} ventas procesadas exitosamente`);
      return ventas;
    } catch (error) {
      console.error('❌ [VentasService] Error al obtener ventas:', error);
      // Retornar array vacío en lugar de lanzar error para que la UI no se rompa
      return [];
    }
  }

  /**
   * Obtiene ventas filtradas por loteId
   * Busca en los items de las ventas productos que pertenezcan al lote especificado
   */
  async getVentasPorLote(loteId: string, tipoAve?: TipoAve): Promise<Venta[]> {
    try {
      const userId = requireAuth();
      const todasLasVentas = await this.getVentas();
      
      // Filtrar ventas que contengan items relacionados con el lote
      const ventasFiltradas = todasLasVentas.filter(venta => {
        return venta.items.some(item => {
          const producto = item.producto;
          
          // Verificar si el producto tiene loteId
          if ('loteId' in producto && producto.loteId === loteId) {
            return true;
          }
          
          // Verificar si el productoId contiene el loteId
          if (item.productoId.includes(loteId)) {
            return true;
          }
          
          // Para productos de huevos, verificar registrosIds
          if (producto.tipo === TipoProducto.HUEVOS) {
            const productoHuevos = producto as ProductoHuevos;
            if (productoHuevos.loteId === loteId) {
              return true;
            }
          }
          
          return false;
        });
      });
      
      console.log(`✅ [VentasService] ${ventasFiltradas.length} ventas encontradas para lote ${loteId}`);
      return ventasFiltradas;
    } catch (error) {
      console.error('❌ [VentasService] Error al obtener ventas por lote:', error);
      return [];
    }
  }

  /**
   * Obtiene una venta por ID
   */
  async getVenta(id: string): Promise<Venta | null> {
    // TODO: Implementar obtención de venta individual
    return null;
  }

  /**
   * Cancela una venta
   */
  async cancelarVenta(id: string): Promise<void> {
    // TODO: Implementar cancelación de venta con rollback de inventario
  }
}

// Instancia singleton
export const ventasService = new VentasService();

// Funciones de conveniencia
export const crearVenta = (datos: CrearVenta) => ventasService.crearVenta(datos);
export const getVentas = () => ventasService.getVentas();
export const getVentasPorLote = (loteId: string, tipoAve?: TipoAve) => ventasService.getVentasPorLote(loteId, tipoAve);
export const getVenta = (id: string) => ventasService.getVenta(id);
export const cancelarVenta = (id: string) => ventasService.cancelarVenta(id);