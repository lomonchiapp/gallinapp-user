/**
 * Servicio para gestionar ventas de huevos desde registros de producción
 * 
 * Este servicio maneja:
 * - Generación de productos vendibles desde registros de producción
 * - Actualización de registros cuando se venden huevos
 * - Cálculo de disponibilidad por unidades y cajas
 */

import { addDoc, collection, doc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { db } from '../components/config/firebase';
import { AppConfig } from '../types/appConfig';
import { ProductoHuevos, TipoProducto, UnidadVentaHuevos } from '../types/facturacion';
import { TipoAve } from '../types/enums';
import { getCurrentUserId } from './auth.service';
import { obtenerLotesPonedoras } from './ponedoras.service';
import { obtenerRegistrosProduccionPorLote } from './ponedoras.service';

const REGISTROS_COLLECTION = 'registrosPonedoras';
const VENTAS_HUEVOS_COLLECTION = 'ventasHuevos';

/**
 * Interfaz para registro de producción con información de venta
 */
interface RegistroProduccionConVenta {
  id: string;
  loteId: string;
  fecha: Date;
  cantidadTotal: number; // Total de huevos en el registro
  cantidadVendida: number; // Cantidad ya vendida
  cantidadDisponible: number; // cantidadTotal - cantidadVendida
}

/**
 * Obtener registros de producción no vendidos (o parcialmente vendidos) para un lote
 */
export const obtenerRegistrosDisponiblesPorLote = async (
  loteId: string
): Promise<RegistroProduccionConVenta[]> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) return [];

    // Obtener todos los registros de producción del lote
    const registros = await obtenerRegistrosProduccionPorLote(loteId);
    
    // Obtener ventas de huevos para estos registros
    const ventasQuery = query(
      collection(db, VENTAS_HUEVOS_COLLECTION),
      where('loteId', '==', loteId),
      where('createdBy', '==', userId)
    );
    
    const ventasSnapshot = await getDocs(ventasQuery);
    const ventas = ventasSnapshot.docs.map(doc => doc.data());
    
    // Calcular cantidad vendida por registro
    const cantidadVendidaPorRegistro: Record<string, number> = {};
    ventas.forEach(venta => {
      if (venta.registrosIds && Array.isArray(venta.registrosIds)) {
        venta.registrosIds.forEach((registroId: string) => {
          cantidadVendidaPorRegistro[registroId] = 
            (cantidadVendidaPorRegistro[registroId] || 0) + (venta.cantidad || 0);
        });
      }
    });
    
    // Convertir registros a formato con información de venta
    const registrosConVenta: RegistroProduccionConVenta[] = registros.map(registro => {
      const cantidadTotal = registro.cantidadHuevosPequenos + 
                          registro.cantidadHuevosMedianos + 
                          registro.cantidadHuevosGrandes + 
                          registro.cantidadHuevosExtraGrandes;
      const cantidadVendida = cantidadVendidaPorRegistro[registro.id] || 0;
      const cantidadDisponible = Math.max(0, cantidadTotal - cantidadVendida);
      
      return {
        id: registro.id,
        loteId: registro.loteId,
        fecha: registro.fecha,
        cantidadTotal,
        cantidadVendida,
        cantidadDisponible,
      };
    });
    
    // Filtrar solo los que tienen disponibilidad
    return registrosConVenta.filter(r => r.cantidadDisponible > 0);
  } catch (error) {
    console.error('Error al obtener registros disponibles:', error);
    return [];
  }
};

/**
 * Generar productos de huevos desde registros de producción
 * Retorna productos tanto por unidades como por cajas
 */
export const generarProductosHuevosDesdeRegistros = async (
  config: AppConfig
): Promise<ProductoHuevos[]> => {
  try {
    const productos: ProductoHuevos[] = [];
    
    // Obtener lotes activos de ponedoras
    const lotes = await obtenerLotesPonedoras();
    const lotesActivos = lotes.filter(lote => lote.estado === 'ACTIVO' && lote.tipo === TipoAve.PONEDORA);
    
    for (const lote of lotesActivos) {
      // Obtener registros disponibles para este lote
      const registrosDisponibles = await obtenerRegistrosDisponiblesPorLote(lote.id);
      
      if (registrosDisponibles.length === 0) continue;
      
      // Agrupar registros por fecha (se pueden agrupar registros del mismo día)
      const registrosAgrupados = agruparRegistrosPorFecha(registrosDisponibles);
      
      for (const grupo of registrosAgrupados) {
        const totalDisponible = grupo.registros.reduce((sum, r) => sum + r.cantidadDisponible, 0);
        const registrosIds = grupo.registros.map(r => r.id);
        const fechaRecoleccion = grupo.fecha;
        
        if (totalDisponible <= 0) continue;
        
        // Producto por unidades
        const productoUnidades: ProductoHuevos = {
          id: `huevos-unidades-${lote.id}-${fechaRecoleccion.getTime()}`,
          nombre: `Huevos - ${lote.nombre}`,
          descripcion: `${totalDisponible} huevos disponibles del ${fechaRecoleccion.toLocaleDateString('es-DO')}`,
          tipo: TipoProducto.HUEVOS,
          tipoAve: TipoAve.PONEDORA,
          precioUnitario: config.precioHuevo,
          unidadMedida: 'unidad',
          disponible: totalDisponible,
          tamano: 'MIXTO', // Puede variar según el registro
          calidad: 'FRESCO',
          fechaRecoleccion,
          loteId: lote.id,
          unidadVenta: UnidadVentaHuevos.UNIDADES,
          registrosIds,
        };
        
        productos.push(productoUnidades);
        
        // Producto por cajas
        const cantidadCajas = Math.floor(totalDisponible / config.cantidadHuevosPorCaja);
        if (cantidadCajas > 0) {
          const productoCajas: ProductoHuevos = {
            id: `huevos-cajas-${lote.id}-${fechaRecoleccion.getTime()}`,
            nombre: `Cajas de Huevos - ${lote.nombre}`,
            descripcion: `${cantidadCajas} cajas disponibles (${config.cantidadHuevosPorCaja} huevos/caja) del ${fechaRecoleccion.toLocaleDateString('es-DO')}`,
            tipo: TipoProducto.HUEVOS,
            tipoAve: TipoAve.PONEDORA,
            precioUnitario: config.precioHuevo * config.cantidadHuevosPorCaja,
            unidadMedida: 'caja',
            disponible: cantidadCajas,
            tamano: 'MIXTO',
            calidad: 'FRESCO',
            fechaRecoleccion,
            loteId: lote.id,
            unidadVenta: UnidadVentaHuevos.CAJAS,
            cantidadPorCaja: config.cantidadHuevosPorCaja,
            registrosIds,
          };
          
          productos.push(productoCajas);
        }
      }
    }
    
    return productos;
  } catch (error) {
    console.error('Error al generar productos de huevos desde registros:', error);
    return [];
  }
};

/**
 * Agrupar registros por fecha
 */
function agruparRegistrosPorFecha(registros: RegistroProduccionConVenta[]): Array<{
  fecha: Date;
  registros: RegistroProduccionConVenta[];
}> {
  const agrupados: Record<string, RegistroProduccionConVenta[]> = {};
  
  registros.forEach(registro => {
    const fechaKey = registro.fecha.toISOString().split('T')[0]; // YYYY-MM-DD
    if (!agrupados[fechaKey]) {
      agrupados[fechaKey] = [];
    }
    agrupados[fechaKey].push(registro);
  });
  
  return Object.entries(agrupados).map(([fechaKey, registros]) => ({
    fecha: registros[0].fecha,
    registros,
  }));
}

/**
 * Registrar venta de huevos y actualizar registros de producción
 * Retorna los IDs de los registros que fueron afectados
 */
export const registrarVentaHuevos = async (
  producto: ProductoHuevos,
  cantidad: number,
  facturaId: string
): Promise<string[]> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Usuario no autenticado');
    
    if (!producto.registrosIds || producto.registrosIds.length === 0) {
      throw new Error('Producto de huevos no tiene registros asociados');
    }
    
    // Calcular cantidad de huevos a vender
    let cantidadHuevosAVender: number;
    if (producto.unidadVenta === UnidadVentaHuevos.CAJAS) {
      cantidadHuevosAVender = cantidad * (producto.cantidadPorCaja || 30);
    } else {
      cantidadHuevosAVender = cantidad;
    }
    
    // Obtener registros disponibles
    const registrosDisponibles = await obtenerRegistrosDisponiblesPorLote(producto.loteId);
    const registrosOrdenados = registrosDisponibles.sort((a, b) => 
      a.fecha.getTime() - b.fecha.getTime() // Más antiguos primero
    );
    
    // Distribuir la venta entre los registros (FIFO - primero en entrar, primero en salir)
    let cantidadRestante = cantidadHuevosAVender;
    const registrosAfectados: Array<{ registroId: string; cantidad: number }> = [];
    
    for (const registro of registrosOrdenados) {
      if (cantidadRestante <= 0) break;
      
      if (!producto.registrosIds.includes(registro.id)) continue;
      
      const cantidadAVenderDeEsteRegistro = Math.min(registro.cantidadDisponible, cantidadRestante);
      
      registrosAfectados.push({
        registroId: registro.id,
        cantidad: cantidadAVenderDeEsteRegistro,
      });
      
      cantidadRestante -= cantidadAVenderDeEsteRegistro;
    }
    
    if (cantidadRestante > 0) {
      throw new Error(`No hay suficientes huevos disponibles. Faltan ${cantidadRestante} huevos.`);
    }
    
    // Crear registro de venta de huevos
    const ventaData = {
      facturaId,
      loteId: producto.loteId,
      productoId: producto.id,
      productoNombre: producto.nombre,
      cantidad: cantidadHuevosAVender,
      cantidadCajas: producto.unidadVenta === UnidadVentaHuevos.CAJAS ? cantidad : undefined,
      unidadVenta: producto.unidadVenta,
      registrosIds: registrosAfectados.map(r => r.registroId),
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const ventaRef = await addDoc(collection(db, VENTAS_HUEVOS_COLLECTION), ventaData);
    
    // Retornar IDs de registros afectados (el servicio de facturación los actualizará en transacción)
    return registrosAfectados.map(r => r.registroId);
  } catch (error) {
    console.error('Error al registrar venta de huevos:', error);
    throw error;
  }
};

