/**
 * Servicio para manejar las ventas de lotes
 * Integra con el sistema de facturación para rastrear ventas por lote
 */

import { addDoc, collection, getDocs, onSnapshot, orderBy, query, Timestamp, where } from 'firebase/firestore';
import { db } from '../components/config/firebase';
import { TipoAve } from '../types/enums';
import { Factura } from '../types/facturacion';
import { requireAuth } from './auth.service';

const VENTAS_COLLECTION = 'ventas';
const FACTURAS_COLLECTION = 'facturas';

export interface VentaLote {
  id: string;
  loteId: string;
  tipoAve: TipoAve;
  facturaId: string;
  itemFacturaId: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
  fecha: Date;
  cliente: {
    id: string;
    nombre: string;
  };
  producto: {
    id: string;
    nombre: string;
    tipo: string;
  };
  createdBy: string;
  createdAt: Date;
}

export interface EstadisticasVentasLote {
  loteId: string;
  tipoAve: TipoAve;
  totalVentas: number;
  cantidadVendida: number;
  ingresosTotales: number;
  precioPromedio: number;
  primeraVenta?: Date;
  ultimaVenta?: Date;
  ventasPorMes: {
    mes: string;
    cantidad: number;
    ingresos: number;
  }[];
}

/**
 * Obtiene todas las ventas de un lote específico
 */
export const obtenerVentasLote = async (loteId: string, tipoAve: TipoAve): Promise<VentaLote[]> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Usuario no autenticado');

    const q = query(
      collection(db, VENTAS_COLLECTION),
      where('loteId', '==', loteId),
      where('tipoAve', '==', tipoAve),
      where('createdBy', '==', userId),
      orderBy('fecha', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const ventas: VentaLote[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      ventas.push({
        id: doc.id,
        ...data,
        fecha: data.fecha?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
      } as VentaLote);
    });

    return ventas;
  } catch (error) {
    console.error('Error al obtener ventas del lote:', error);
    throw error;
  }
};

/**
 * Registra una nueva venta de lote
 */
export const registrarVentaLote = async (venta: Omit<VentaLote, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Usuario no autenticado');

    const ventaData = {
      ...venta,
      createdBy: userId,
      createdAt: Timestamp.now(),
      fecha: Timestamp.fromDate(venta.fecha),
    };

    const docRef = await addDoc(collection(db, VENTAS_COLLECTION), ventaData);
    return docRef.id;
  } catch (error) {
    console.error('Error al registrar venta del lote:', error);
    throw error;
  }
};

/**
 * Calcula estadísticas de ventas para un lote
 */
export const calcularEstadisticasVentasLote = async (loteId: string, tipoAve: TipoAve): Promise<EstadisticasVentasLote> => {
  try {
    const ventas = await obtenerVentasLote(loteId, tipoAve);
    
    if (ventas.length === 0) {
      return {
        loteId,
        tipoAve,
        totalVentas: 0,
        cantidadVendida: 0,
        ingresosTotales: 0,
        precioPromedio: 0,
        ventasPorMes: [],
      };
    }

    const cantidadVendida = ventas.reduce((sum, venta) => sum + venta.cantidad, 0);
    const ingresosTotales = ventas.reduce((sum, venta) => sum + venta.total, 0);
    const precioPromedio = ingresosTotales / cantidadVendida;

    // Agrupar ventas por mes
    const ventasPorMes = ventas.reduce((acc, venta) => {
      const mes = venta.fecha.toISOString().substring(0, 7); // YYYY-MM
      const existing = acc.find(item => item.mes === mes);
      
      if (existing) {
        existing.cantidad += venta.cantidad;
        existing.ingresos += venta.total;
      } else {
        acc.push({
          mes,
          cantidad: venta.cantidad,
          ingresos: venta.total,
        });
      }
      
      return acc;
    }, [] as { mes: string; cantidad: number; ingresos: number }[]);

    return {
      loteId,
      tipoAve,
      totalVentas: ventas.length,
      cantidadVendida,
      ingresosTotales,
      precioPromedio,
      primeraVenta: ventas[ventas.length - 1]?.fecha,
      ultimaVenta: ventas[0]?.fecha,
      ventasPorMes: ventasPorMes.sort((a, b) => b.mes.localeCompare(a.mes)),
    };
  } catch (error) {
    console.error('Error al calcular estadísticas de ventas:', error);
    throw error;
  }
};

/**
 * Suscripción en tiempo real a las ventas de un lote
 */
export const suscribirseAVentasLote = (
  loteId: string,
  tipoAve: TipoAve,
  callback: (ventas: VentaLote[]) => void
) => {
  const userId = getCurrentUserId();
  if (!userId) {
    console.error('Usuario no autenticado para suscripción de ventas');
    return () => {};
  }

  const q = query(
    collection(db, VENTAS_COLLECTION),
    where('loteId', '==', loteId),
    where('tipoAve', '==', tipoAve),
    where('createdBy', '==', userId),
    orderBy('fecha', 'desc')
  );

  return onSnapshot(q, (querySnapshot) => {
    const ventas: VentaLote[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      ventas.push({
        id: doc.id,
        ...data,
        fecha: data.fecha?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
      } as VentaLote);
    });
    callback(ventas);
  });
};

/**
 * Procesa una factura y registra las ventas correspondientes
 * Se llama desde el servicio de facturación cuando se crea una factura
 */
export const procesarFacturaParaVentas = async (factura: Factura): Promise<void> => {
  try {
    const ventas: Omit<VentaLote, 'id' | 'createdAt'>[] = [];

    for (const item of factura.items) {
      // Solo procesar items que sean de lotes (unidades individuales o lotes completos)
      if (item.producto.tipo.includes('UNIDADES_') || item.producto.tipo === 'LOTE_COMPLETO') {
        let loteId: string | undefined;
        let tipoAve: TipoAve | undefined;

        // Extraer loteId del productoId
        if (item.producto.tipo === 'LOTE_COMPLETO') {
          // Para lotes completos: productoId = "lote-{loteId}"
          const match = item.productoId.match(/^lote-(.+)$/);
          if (match) {
            loteId = match[1];
          }
        } else {
          // Para unidades: productoId = "unidades-{loteId}"
          const match = item.productoId.match(/^unidades-(.+)$/);
          if (match) {
            loteId = match[1];
          }
        }

        // Determinar tipoAve basado en el tipo de producto
        if (item.producto.tipo.includes('PONEDORAS')) {
          tipoAve = TipoAve.PONEDORA;
        } else if (item.producto.tipo.includes('LEVANTE')) {
          tipoAve = TipoAve.POLLO_LEVANTE;
        } else if (item.producto.tipo.includes('ENGORDE')) {
          tipoAve = TipoAve.POLLO_ENGORDE;
        }

        if (loteId && tipoAve) {
          ventas.push({
            loteId,
            tipoAve,
            facturaId: factura.id,
            itemFacturaId: item.id,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            total: item.total,
            fecha: factura.fecha,
            cliente: {
              id: factura.cliente.id,
              nombre: factura.cliente.nombre,
            },
            producto: {
              id: item.producto.id,
              nombre: item.producto.nombre,
              tipo: item.producto.tipo,
            },
            createdBy: factura.createdBy,
          });
        }
      }
    }

    // Registrar todas las ventas
    for (const venta of ventas) {
      await registrarVentaLote(venta);
    }

    console.log(`✅ Procesadas ${ventas.length} ventas para la factura ${factura.numero}`);
  } catch (error) {
    console.error('Error al procesar factura para ventas:', error);
    throw error;
  }
};

/**
 * Obtiene el ID del usuario actual desde el store de autenticación
 */
const getCurrentUserId = (): string | null => {
  try {
    return requireAuth();
  } catch (error) {
    console.error('Error al obtener usuario actual:', error);
    return null;
  }
};

