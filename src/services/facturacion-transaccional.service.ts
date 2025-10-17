/**
 * Servicio de facturación mejorado con transacciones atómicas
 * Migrado de AsyncStorage a Firebase con integridad garantizada
 */

import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    runTransaction,
    serverTimestamp,
    setDoc,
    Timestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from '../components/config/firebase';
import { TipoAve } from '../types/enums';
import {
    ClienteNotFoundError,
    DomainError,
    FacturaNotFoundError,
    InsufficientQuantityError,
    InvalidQuantityError,
    LoteNotFoundError,
    ProductoNotFoundError,
    TransactionError
} from '../types/errors';
import {
    Cliente,
    ConfiguracionFacturacion,
    CrearCliente,
    CrearFactura,
    EstadoFactura,
    Factura,
    ItemFactura,
    Producto,
    ResumenVentas,
    TipoProducto
} from '../types/facturacion';
import { auditService } from './audit.service';
import { requireAuth } from './auth.service';
import { productosInventarioSimplificadoService } from './productos-inventario-simplificado.service';

const COLLECTIONS = {
  FACTURAS: 'facturas',
  CLIENTES: 'clientes',
  VENTAS: 'ventas',
  PRODUCTOS: 'productos_disponibles',
  CONFIGURACION: 'configuracion_facturacion',
  CONTADOR_FACTURAS: 'contador_facturas',
};

class FacturacionTransaccionalService {
  // Configuración por defecto
  private configuracionDefault: ConfiguracionFacturacion = {
    empresa: {
      nombre: 'Asoaves',
      nit: '',
      direccion: '',
      telefono: '',
      email: '',
    },
    numeracion: {
      prefijo: 'FAC',
      siguienteNumero: 1,
      formato: '{prefijo}-{numero:4}',
    },
    impuestos: {
      iva: 0,
      retencion: 0,
    },
  };

  /**
   * Obtiene configuración de facturación
   */
  async getConfiguracion(): Promise<ConfiguracionFacturacion> {
    try {
      const userId = requireAuth();
      const configRef = doc(db, COLLECTIONS.CONFIGURACION, userId);
      const configSnap = await getDoc(configRef);
      
      if (configSnap.exists()) {
        return configSnap.data() as ConfiguracionFacturacion;
      }
      
      // Crear configuración por defecto
      await this.actualizarConfiguracion(this.configuracionDefault);
      return this.configuracionDefault;
    } catch (error) {
      console.error('Error al obtener configuración de facturación:', error);
      return this.configuracionDefault;
    }
  }

  /**
   * Actualiza configuración de facturación
   */
  async actualizarConfiguracion(config: Partial<ConfiguracionFacturacion>): Promise<void> {
    try {
      const userId = requireAuth();
      const configActual = await this.getConfiguracion();
      const nuevaConfig = { ...configActual, ...config };
      
      const configRef = doc(db, COLLECTIONS.CONFIGURACION, userId);
      await updateDoc(configRef, nuevaConfig);
      
      await auditService.logUpdate('configuracion', userId, configActual, nuevaConfig, {
        reason: 'actualizacion_configuracion'
      });
    } catch (error) {
      console.error('Error al actualizar configuración de facturación:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los clientes
   */
  async getClientes(): Promise<Cliente[]> {
    try {
      const userId = requireAuth();
      const q = query(
        collection(db, COLLECTIONS.CLIENTES),
        where('createdBy', '==', userId),
        orderBy('nombre', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const clientes: Cliente[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        clientes.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Cliente);
      });
      
      return clientes;
    } catch (error) {
      console.error('Error al obtener clientes:', error);
      return [];
    }
  }

  /**
   * Crea un nuevo cliente
   */
  async crearCliente(cliente: CrearCliente): Promise<Cliente> {
    try {
      const userId = requireAuth();
      
      const clienteData = {
        ...cliente,
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, COLLECTIONS.CLIENTES), clienteData);
      
      const nuevoCliente: Cliente = {
        id: docRef.id,
        ...cliente,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await auditService.logCreate('cliente', docRef.id, nuevoCliente);
      
      return nuevoCliente;
    } catch (error) {
      console.error('Error al crear cliente:', error);
      throw error;
    }
  }

  /**
   * Actualiza un cliente
   */
  async actualizarCliente(id: string, datos: Partial<Cliente>): Promise<Cliente> {
    try {
      const userId = requireAuth();
      
      // Obtener cliente actual
      const clienteRef = doc(db, COLLECTIONS.CLIENTES, id);
      const clienteSnap = await getDoc(clienteRef);
      
      if (!clienteSnap.exists()) {
        throw new ClienteNotFoundError(id);
      }
      
      const clienteActual = clienteSnap.data() as Cliente;
      
      // Verificar permisos
      if (clienteActual.createdBy !== userId) {
        throw new DomainError('UNAUTHORIZED', 'No tienes permisos para modificar este cliente');
      }
      
      const actualizacion = {
        ...datos,
        updatedAt: serverTimestamp(),
      };
      
      await updateDoc(clienteRef, actualizacion);
      
      const clienteActualizado = {
        ...clienteActual,
        ...datos,
        updatedAt: new Date(),
      };
      
      await auditService.logUpdate('cliente', id, clienteActual, clienteActualizado);
      
      return clienteActualizado;
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      throw error;
    }
  }

  /**
   * Obtiene productos disponibles desde inventario
   */
  async getProductosDisponibles(): Promise<Producto[]> {
    try {
      return await productosInventarioSimplificadoService.generarProductosDesdeInventario();
    } catch (error) {
      console.error('Error al obtener productos disponibles:', error);
      return [];
    }
  }

  /**
   * Genera número de factura único
   */
  private async generarNumeroFactura(): Promise<string> {
    try {
      console.log('🔢 [FacturacionService] Iniciando generación de número de factura...');
      const userId = requireAuth();
      console.log('👤 [FacturacionService] Usuario para contador:', userId);
      
      console.log('⚙️ [FacturacionService] Obteniendo configuración...');
      const config = await this.getConfiguracion();
      console.log('📋 [FacturacionService] Configuración obtenida:', config.numeracion);
      
      // Obtener contador actual
      console.log('🔍 [FacturacionService] Buscando contador existente...');
      const contadorRef = doc(db, COLLECTIONS.CONTADOR_FACTURAS, userId);
      const contadorSnap = await getDoc(contadorRef);
      
      let contador = 1;
      if (contadorSnap.exists()) {
        contador = contadorSnap.data().siguienteNumero || 1;
        console.log('📊 [FacturacionService] Contador existente encontrado:', contador);
      } else {
        console.log('🆕 [FacturacionService] No existe contador, creando nuevo con valor 1');
      }
      
      const numero = config.numeracion.formato
        .replace('{prefijo}', config.numeracion.prefijo)
        .replace('{numero:4}', contador.toString().padStart(4, '0'));
      
      console.log('🎯 [FacturacionService] Número generado:', numero);
      
      // Crear o actualizar contador
      console.log('💾 [FacturacionService] Actualizando contador...');
      if (contadorSnap.exists()) {
        await updateDoc(contadorRef, {
          siguienteNumero: contador + 1,
          updatedAt: serverTimestamp(),
        });
        console.log('✅ [FacturacionService] Contador actualizado');
      } else {
        await setDoc(contadorRef, {
          siguienteNumero: contador + 1,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        console.log('✅ [FacturacionService] Contador creado');
      }
      
      console.log('🎉 [FacturacionService] Número de factura generado exitosamente:', numero);
      return numero;
    } catch (error) {
      console.error('❌ [FacturacionService] Error al generar número de factura:', error);
      throw error;
    }
  }

  /**
   * Valida items de factura antes de procesar
   */
  private async validarItemsFactura(items: ItemFactura[]): Promise<void> {
    for (const item of items) {
      // Validar cantidad
      if (item.cantidad <= 0) {
        throw new InvalidQuantityError(item.cantidad);
      }
      
      // Validar producto existe
      const productos = await this.getProductosDisponibles();
      const producto = productos.find(p => p.id === item.productoId);
      
      if (!producto) {
        throw new ProductoNotFoundError(item.productoId);
      }
      
      // Validar stock disponible
      if (item.cantidad > producto.disponible) {
        throw new InsufficientQuantityError(
          producto.loteId || 'unknown',
          item.cantidad,
          producto.disponible,
          producto.tipoAve
        );
      }
    }
  }

  /**
   * Crea una factura con transacción atómica
   */
  async crearFactura(datosFactura: CrearFactura, userId: string): Promise<Factura> {
    try {
      console.log('🏭 [FacturacionService] Iniciando creación de factura...');
      console.log('📋 [FacturacionService] Datos recibidos:', {
        cliente: datosFactura.cliente.nombre,
        items: datosFactura.items.length,
        userId
      });
      
      // Validar items antes de iniciar transacción
      console.log('🔍 [FacturacionService] Validando items de factura...');
      await this.validarItemsFactura(datosFactura.items);
      console.log('✅ [FacturacionService] Items validados correctamente');
      
      console.log('🔄 [FacturacionService] Iniciando transacción de Firestore...');
      return await runTransaction(db, async (transaction) => {
        try {
          console.log('📝 [FacturacionService] Generando número de factura...');
          // 1. Generar número de factura
          const numero = await this.generarNumeroFactura();
          const ahora = new Date();
          console.log('🔢 [FacturacionService] Número de factura generado:', numero);
          
          console.log('🧮 [FacturacionService] Calculando totales...');
          // 2. Calcular totales
          const subtotal = this.calcularSubtotal(datosFactura.items);
          const descuentoTotal = this.calcularDescuentoTotal(datosFactura.items);
          const impuestosTotal = this.calcularImpuestosTotal(datosFactura.items);
          const total = this.calcularTotal(datosFactura.items);
          
          console.log('💰 [FacturacionService] Totales calculados:', {
            subtotal,
            descuentoTotal,
            impuestosTotal,
            total
          });
          
          console.log('📄 [FacturacionService] Creando documento de factura...');
          // 3. Crear factura
          const facturaRef = doc(collection(db, COLLECTIONS.FACTURAS));
          const nuevaFactura: Factura = {
            ...datosFactura,
            id: facturaRef.id,
            numero,
            subtotal,
            descuentoTotal,
            impuestosTotal,
            total,
            estado: EstadoFactura.PENDIENTE,
            createdBy: userId,
            createdAt: ahora,
            updatedAt: ahora,
          };
          
          console.log('💾 [FacturacionService] Guardando factura en Firestore...');
          transaction.set(facturaRef, {
            ...nuevaFactura,
            createdAt: Timestamp.fromDate(ahora),
            updatedAt: Timestamp.fromDate(ahora),
          });
          
          console.log('📦 [FacturacionService] Actualizando inventario para', datosFactura.items.length, 'items...');
          // 4. Actualizar inventario para cada item
          for (const item of datosFactura.items) {
            await this.actualizarInventarioEnTransaccion(transaction, item);
          }
          
          console.log('📊 [FacturacionService] Registrando ventas...');
          // 5. Registrar ventas
          await this.registrarVentasEnTransaccion(transaction, nuevaFactura);
          
          console.log(`✅ [FacturacionService] Factura ${numero} creada exitosamente`);
          return nuevaFactura;
          
        } catch (error) {
          console.error('❌ [FacturacionService] Error en transacción de factura:', error);
          throw new TransactionError('crearFactura', error.message);
        }
      });
      
    } catch (error) {
      console.error('❌ [FacturacionService] Error al crear factura:', error);
      throw error;
    }
  }

  /**
   * Actualiza inventario dentro de una transacción
   */
  private async actualizarInventarioEnTransaccion(
    transaction: any, 
    item: ItemFactura
  ): Promise<void> {
    try {
      // Extraer loteId del productoId
      const [tipo, ...loteIdParts] = item.productoId.split('-');
      const loteId = loteIdParts.join('-');
      
      if (tipo === 'lote') {
        // Venta de lote completo
        await this.marcarLoteComoVendidoEnTransaccion(transaction, loteId, item.producto.tipoAve);
      } else if (tipo === 'unidades') {
        // Venta de unidades individuales
        await this.reducirCantidadLoteEnTransaccion(transaction, loteId, item.cantidad, item.producto.tipoAve);
      }
    } catch (error) {
      console.error('Error al actualizar inventario en transacción:', error);
      throw error;
    }
  }

  /**
   * Marca lote como vendido en transacción
   */
  private async marcarLoteComoVendidoEnTransaccion(
    transaction: any,
    loteId: string,
    tipoAve: TipoAve
  ): Promise<void> {
    const loteRef = this.getLoteRef(tipoAve, loteId);
    const loteSnap = await transaction.get(loteRef);
    
    if (!loteSnap.exists()) {
      throw new LoteNotFoundError(loteId);
    }
    
    const lote = loteSnap.data();
    
    if (lote.estado === 'VENDIDO') {
      throw new DomainError('LOTE_ALREADY_SOLD', `Lote ${loteId} ya está vendido`);
    }
    
    transaction.update(loteRef, {
      estado: 'VENDIDO',
      fechaVenta: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Reduce cantidad de lote en transacción
   */
  private async reducirCantidadLoteEnTransaccion(
    transaction: any,
    loteId: string,
    cantidad: number,
    tipoAve: TipoAve
  ): Promise<void> {
    const loteRef = this.getLoteRef(tipoAve, loteId);
    const loteSnap = await transaction.get(loteRef);
    
    if (!loteSnap.exists()) {
      throw new LoteNotFoundError(loteId);
    }
    
    const lote = loteSnap.data();
    
    if (cantidad > lote.cantidadActual) {
      throw new InsufficientQuantityError(loteId, cantidad, lote.cantidadActual, tipoAve);
    }
    
    const nuevaCantidad = lote.cantidadActual - cantidad;
    const actualizacion: any = {
      cantidadActual: nuevaCantidad,
      updatedAt: serverTimestamp(),
    };
    
    // Si se vendió todo, marcar como vendido
    if (nuevaCantidad === 0) {
      actualizacion.estado = 'VENDIDO';
      actualizacion.fechaVenta = serverTimestamp();
    }
    
    transaction.update(loteRef, actualizacion);
  }

  /**
   * Registra ventas en transacción
   */
  private async registrarVentasEnTransaccion(
    transaction: any,
    factura: Factura
  ): Promise<void> {
    try {
      for (const item of factura.items) {
        // Solo procesar items que sean de lotes
        if (item.producto.tipo === TipoProducto.LOTE_COMPLETO || 
            item.producto.tipo.includes('UNIDADES_')) {
          
          const [tipo, ...loteIdParts] = item.productoId.split('-');
          const loteId = loteIdParts.join('-');
          
          if (!loteId) continue;
          
          const ventaData = {
            loteId,
            tipoAve: item.producto.tipoAve,
            facturaId: factura.id,
            itemFacturaId: item.id,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            total: item.total,
            fecha: Timestamp.fromDate(factura.fecha),
            cliente: {
              id: factura.cliente.id,
              nombre: factura.cliente.nombre,
            },
            producto: {
              id: item.producto.id,
              nombre: item.producto.nombre,
              tipo: item.producto.tipo,
              unidadMedida: item.producto.unidadMedida,
            },
            createdBy: factura.createdBy,
            createdAt: serverTimestamp(),
          };
          
          const ventaRef = doc(collection(db, 'ventas'));
          transaction.set(ventaRef, ventaData);
        }
      }
    } catch (error) {
      console.error('Error al registrar ventas en transacción:', error);
      throw error;
    }
  }

  /**
   * Obtiene referencia de lote según tipo
   */
  private getLoteRef(tipoAve: TipoAve, loteId: string) {
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
    
    return doc(db, collectionName, loteId);
  }

  /**
   * Obtiene todas las facturas
   */
  async getFacturas(): Promise<Factura[]> {
    try {
      const userId = requireAuth();
      const q = query(
        collection(db, COLLECTIONS.FACTURAS),
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
      
      return facturas;
    } catch (error) {
      console.error('Error al obtener facturas:', error);
      return [];
    }
  }

  /**
   * Obtiene factura por ID
   */
  async getFacturaPorId(id: string): Promise<Factura | null> {
    try {
      const userId = requireAuth();
      const facturaRef = doc(db, COLLECTIONS.FACTURAS, id);
      const facturaSnap = await getDoc(facturaRef);
      
      if (!facturaSnap.exists()) {
        return null;
      }
      
      const data = facturaSnap.data();
      
      // Verificar permisos
      if (data.createdBy !== userId) {
        throw new DomainError('UNAUTHORIZED', 'No tienes permisos para ver esta factura');
      }
      
      return {
        id: facturaSnap.id,
        ...data,
        fecha: data.fecha?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Factura;
    } catch (error) {
      console.error('Error al obtener factura por ID:', error);
      return null;
    }
  }

  /**
   * Actualiza estado de factura
   */
  async actualizarEstadoFactura(id: string, nuevoEstado: EstadoFactura): Promise<Factura> {
    try {
      const userId = requireAuth();
      const facturaRef = doc(db, COLLECTIONS.FACTURAS, id);
      const facturaSnap = await getDoc(facturaRef);
      
      if (!facturaSnap.exists()) {
        throw new FacturaNotFoundError(id);
      }
      
      const facturaActual = facturaSnap.data() as Factura;
      
      // Verificar permisos
      if (facturaActual.createdBy !== userId) {
        throw new DomainError('UNAUTHORIZED', 'No tienes permisos para modificar esta factura');
      }
      
      const actualizacion = {
        estado: nuevoEstado,
        updatedAt: serverTimestamp(),
      };
      
      await updateDoc(facturaRef, actualizacion);
      
      const facturaActualizada = {
        ...facturaActual,
        estado: nuevoEstado,
        updatedAt: new Date(),
      };
      
      await auditService.logUpdate('factura', id, facturaActual, facturaActualizada, {
        reason: 'cambio_estado',
        nuevoEstado
      });
      
      return facturaActualizada;
    } catch (error) {
      console.error('Error al actualizar estado de factura:', error);
      throw error;
    }
  }

  // Métodos de cálculo (sin cambios)
  private calcularSubtotal(items: ItemFactura[]): number {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  }

  private calcularDescuentoTotal(items: ItemFactura[]): number {
    return items.reduce((sum, item) => sum + (item.descuento || 0), 0);
  }

  private calcularImpuestosTotal(items: ItemFactura[]): number {
    return items.reduce((sum, item) => sum + (item.impuestos || 0), 0);
  }

  private calcularTotal(items: ItemFactura[]): number {
    return items.reduce((sum, item) => sum + item.total, 0);
  }

  /**
   * Calcula item de factura
   */
  calcularItemFactura(
    producto: Producto, 
    cantidad: number, 
    descuento: number = 0
  ): Omit<ItemFactura, 'id'> {
    const precioUnitario = producto.precioUnitario;
    const subtotal = cantidad * precioUnitario;
    const descuentoAplicado = (subtotal * descuento) / 100;
    const subtotalConDescuento = subtotal - descuentoAplicado;
    
    // Sin IVA - negocio informal
    const impuestos = 0;
    const total = subtotalConDescuento;

    return {
      productoId: producto.id,
      producto,
      cantidad,
      precioUnitario,
      descuento: descuentoAplicado,
      subtotal,
      impuestos,
      total,
    };
  }

  /**
   * Genera resumen de ventas
   */
  async generarResumenVentas(fechaInicio: Date, fechaFin: Date): Promise<ResumenVentas> {
    try {
      const userId = requireAuth();
      
      // Query solo con filtros de rango en un campo (fecha)
      // El filtro de estado se hace en el cliente para evitar índices compuestos
      const q = query(
        collection(db, COLLECTIONS.FACTURAS),
        where('createdBy', '==', userId),
        where('fecha', '>=', fechaInicio),
        where('fecha', '<=', fechaFin),
        orderBy('fecha', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const facturas: Factura[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Filtrar estado cancelada en el cliente
        if (data.estado === EstadoFactura.CANCELADA) {
          return;
        }
        
        facturas.push({
          id: doc.id,
          ...data,
          fecha: data.fecha?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Factura);
      });

      const resumen: ResumenVentas = {
        periodo: { inicio: fechaInicio, fin: fechaFin },
        totalFacturas: facturas.length,
        totalVentas: facturas.reduce((sum, f) => sum + f.total, 0),
        ventasPorTipo: {
          [TipoProducto.LOTE_COMPLETO]: { cantidad: 0, valor: 0 },
          [TipoProducto.UNIDADES_GALLINAS_PONEDORAS]: { cantidad: 0, valor: 0 },
          [TipoProducto.UNIDADES_POLLOS_LEVANTE]: { cantidad: 0, valor: 0 },
          [TipoProducto.UNIDADES_POLLOS_ENGORDE]: { cantidad: 0, valor: 0 },
          [TipoProducto.HUEVOS]: { cantidad: 0, valor: 0 },
        },
        ventasPorAve: {
          [TipoAve.PONEDORA]: { cantidad: 0, valor: 0 },
          [TipoAve.POLLO_LEVANTE]: { cantidad: 0, valor: 0 },
          [TipoAve.POLLO_ENGORDE]: { cantidad: 0, valor: 0 },
        },
        clientesMasCompradores: [],
      };

      // Calcular estadísticas
      for (const factura of facturas) {
        for (const item of factura.items) {
          const tipo = item.producto.tipo;
          const tipoAve = item.producto.tipoAve;
          
          resumen.ventasPorTipo[tipo].cantidad += item.cantidad;
          resumen.ventasPorTipo[tipo].valor += item.total;
          
          resumen.ventasPorAve[tipoAve].cantidad += item.cantidad;
          resumen.ventasPorAve[tipoAve].valor += item.total;
        }
      }

      return resumen;
    } catch (error) {
      console.error('Error al generar resumen de ventas:', error);
      throw error;
    }
  }
}

/**
 * Suscribirse a cambios en facturas en tiempo real
 */
export const suscribirseAFacturas = (callback: (facturas: Factura[]) => void) => {
  const userId = requireAuth();
  const q = query(
    collection(db, COLLECTIONS.FACTURAS),
    where('createdBy', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const facturas = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        fecha: data.fecha?.toDate ? data.fecha.toDate() : new Date(data.fecha),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
      } as Factura;
    });
    callback(facturas);
  });
};

/**
 * Suscribirse a cambios en clientes en tiempo real
 */
export const suscribirseAClientes = (callback: (clientes: Cliente[]) => void) => {
  const userId = requireAuth();
  const q = query(
    collection(db, COLLECTIONS.CLIENTES),
    where('createdBy', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const clientes = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
      } as Cliente;
    });
    callback(clientes);
  });
};

/**
 * Suscribirse a cambios en ventas en tiempo real
 */
export const suscribirseAVentas = (callback: (ventas: any[]) => void) => {
  const userId = requireAuth();
  const q = query(
    collection(db, COLLECTIONS.VENTAS),
    where('createdBy', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const ventas = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        fecha: data.fecha?.toDate ? data.fecha.toDate() : new Date(data.fecha),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      };
    });
    callback(ventas);
  });
};

/**
 * Obtiene todas las ventas del usuario
 */
export const getVentas = async (): Promise<any[]> => {
  try {
    const userId = requireAuth();
    
    const q = query(
      collection(db, COLLECTIONS.VENTAS),
      where('createdBy', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const ventas: any[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      ventas.push({
        id: doc.id,
        ...data,
        fecha: data.fecha?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
      });
    });
    
    return ventas;
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    return [];
  }
};

/**
 * Obtiene ventas por lote específico
 */
export const getVentasPorLote = async (loteId: string, tipoAve: TipoAve): Promise<any[]> => {
  try {
    const userId = requireAuth();
    
    const q = query(
      collection(db, COLLECTIONS.VENTAS),
      where('loteId', '==', loteId),
      where('tipoAve', '==', tipoAve),
      where('createdBy', '==', userId),
      orderBy('fecha', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const ventas: any[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      ventas.push({
        id: doc.id,
        ...data,
        fecha: data.fecha?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
      });
    });
    
    return ventas;
  } catch (error) {
    console.error('Error al obtener ventas por lote:', error);
    return [];
  }
};

export const facturacionTransaccionalService = new FacturacionTransaccionalService();
