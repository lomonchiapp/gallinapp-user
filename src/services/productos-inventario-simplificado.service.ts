/**
 * Servicio simplificado para generar productos vendibles desde lotes
 * Solo se encarga de convertir lotes a productos, sin manejar ventas
 */

import { EstadoLote, TipoAve } from '../types/enums';
import { Producto, ProductoLoteCompleto, ProductoUnidades, TipoProducto } from '../types/facturacion';
import { obtenerConfiguracion } from './appConfig.service';
import { obtenerLotesEngorde } from './engorde.service';
import { obtenerLotesLevantes } from './levantes.service';
import { obtenerLotesPonedoras } from './ponedoras.service';

class ProductosInventarioSimplificadoService {
  
  /**
   * Genera productos vendibles desde todos los lotes activos
   */
  async generarProductosDesdeInventario(): Promise<Producto[]> {
    try {
      console.log('🔄 [INVENTARIO] Generando productos desde inventario...');
      const productos: Producto[] = [];
      
      // Obtener lotes de todos los tipos
      const [lotesPonedoras, lotesLevante, lotesEngorde] = await Promise.all([
        this.cargarLotesPonedoras(),
        this.cargarLotesLevante(),
        this.cargarLotesEngorde(),
      ]);
      
      console.log('📊 [INVENTARIO] Lotes encontrados:', {
        ponedoras: lotesPonedoras.length,
        levante: lotesLevante.length,
        engorde: lotesEngorde.length,
        total: lotesPonedoras.length + lotesLevante.length + lotesEngorde.length
      });

      // Convertir lotes a productos
      for (const lote of lotesPonedoras) {
        const productosLote = await this.convertirLoteAProductos(lote, TipoAve.PONEDORA);
        if (productosLote.length > 0) {
          console.log('✅ [PONEDORA] Lote convertido:', lote.nombre, '→', productosLote.length, 'productos');
          productos.push(...productosLote);
        }
      }
      
      for (const lote of lotesLevante) {
        const productosLote = await this.convertirLoteAProductos(lote, TipoAve.POLLO_LEVANTE);
        if (productosLote.length > 0) {
          console.log('✅ [LEVANTE] Lote convertido:', lote.nombre, '→', productosLote.length, 'productos');
          productos.push(...productosLote);
        }
      }
      
      for (const lote of lotesEngorde) {
        const productosLote = await this.convertirLoteAProductos(lote, TipoAve.POLLO_ENGORDE);
        if (productosLote.length > 0) {
          console.log('✅ [ENGORDE] Lote convertido:', lote.nombre, '→', productosLote.length, 'productos');
          productos.push(...productosLote);
        }
      }
      
      console.log('✅ [INVENTARIO] Total de productos generados:', productos.length);
      console.log('📦 [INVENTARIO] Desglose:', {
        lotesCompletos: productos.filter(p => p.tipo === TipoProducto.LOTE_COMPLETO).length,
        unidades: productos.filter(p => p.tipo !== TipoProducto.LOTE_COMPLETO).length
      });
      
      return productos;
    } catch (error) {
      console.error('❌ [INVENTARIO] Error al generar productos desde inventario:', error);
      throw error;
    }
  }
  
  /**
   * Convierte un lote en productos vendibles
   */
  private async convertirLoteAProductos(lote: any, tipoAve: TipoAve): Promise<Producto[]> {
    const productos: Producto[] = [];
    
    // Validación estricta con logging detallado
    const esActivo = lote.estado === EstadoLote.ACTIVO;
    const tieneCantidad = lote.cantidadActual > 0;
    
    if (!esActivo || !tieneCantidad) {
      console.log(`⚠️ [${tipoAve}] Lote "${lote.nombre}" excluido:`, {
        estado: lote.estado,
        esActivo,
        cantidadActual: lote.cantidadActual,
        tieneCantidad,
        razon: !esActivo ? 'Estado no es ACTIVO' : 'Cantidad es 0 o menor'
      });
      return productos;
    }
    
    const edadEnDias = this.calcularEdadEnDias(lote.fechaNacimiento);
    const precioUnitario = await this.calcularPrecioUnitario(lote, tipoAve);
    const precioLoteCompleto = await this.calcularPrecioLoteCompleto(lote, tipoAve);
    
    // 1. Lote completo como producto
    const productoLoteCompleto: ProductoLoteCompleto = {
      id: `lote-${lote.id}`,
      nombre: `Lote completo: ${lote.nombre}`,
      descripcion: `${lote.cantidadActual} ${this.getNombreAve(tipoAve)} - ${lote.raza || 'Sin especificar'} (${edadEnDias} días)`,
      tipo: TipoProducto.LOTE_COMPLETO,
      tipoAve,
      precioUnitario: precioLoteCompleto,
      unidadMedida: 'lote',
      disponible: 1,
      loteId: lote.id,
      edadActual: edadEnDias,
      cantidadTotal: lote.cantidadActual,
      raza: lote.raza || 'Sin especificar',
      fechaInicio: lote.fechaInicio,
      pesoPromedio: lote.pesoPromedio || undefined,
    };
    
    productos.push(productoLoteCompleto);
    
    // 2. Unidades individuales como producto
    const tipoUnidades = this.getTipoProductoUnidades(tipoAve);
    const productoUnidades: ProductoUnidades = {
      id: `unidades-${lote.id}`,
      nombre: `${this.getNombreAve(tipoAve)} - ${lote.nombre}`,
      descripcion: `Unidades individuales de ${lote.raza || 'Sin especificar'} (${edadEnDias} días)`,
      tipo: tipoUnidades,
      tipoAve,
      precioUnitario,
      unidadMedida: 'unidad',
      disponible: lote.cantidadActual,
      raza: lote.raza || 'Sin especificar',
      edadPromedio: edadEnDias,
      pesoPromedio: lote.pesoPromedio || undefined,
      origen: lote.nombre,
    };
    
    productos.push(productoUnidades);
    
    return productos;
  }
  
  /**
   * Obtiene lotes de ponedoras activos
   */
  private async cargarLotesPonedoras(): Promise<any[]> {
    try {
      const lotes = await obtenerLotesPonedoras();
      return lotes.filter(lote => lote.estado === EstadoLote.ACTIVO && lote.cantidadActual > 0);
    } catch (error) {
      console.error('Error al obtener lotes de ponedoras:', error);
      return [];
    }
  }
  
  /**
   * Obtiene lotes de levante activos
   */
  private async cargarLotesLevante(): Promise<any[]> {
    try {
      const lotes = await obtenerLotesLevantes();
      return lotes.filter(lote => lote.estado === EstadoLote.ACTIVO && lote.cantidadActual > 0);
    } catch (error) {
      console.error('Error al obtener lotes de levante:', error);
      return [];
    }
  }
  
  /**
   * Obtiene lotes de engorde activos
   */
  private async cargarLotesEngorde(): Promise<any[]> {
    try {
      const lotes = await obtenerLotesEngorde();
      return lotes.filter(lote => lote.estado === EstadoLote.ACTIVO && lote.cantidadActual > 0);
    } catch (error) {
      console.error('Error al obtener lotes de engorde:', error);
      return [];
    }
  }
  
  /**
   * Calcula la edad en días desde la fecha de nacimiento
   */
  private calcularEdadEnDias(fechaNacimiento: Date): number {
    const hoy = new Date();
    const diferencia = hoy.getTime() - new Date(fechaNacimiento).getTime();
    return Math.floor(diferencia / (1000 * 60 * 60 * 24));
  }
  
  /**
   * Calcula el precio unitario basado en el tipo de ave y características del lote
   */
  private async calcularPrecioUnitario(lote: any, tipoAve: TipoAve): Promise<number> {
    try {
      const config = await obtenerConfiguracion();
      
      switch (tipoAve) {
        case TipoAve.PONEDORA:
          // Precio por gallina ponedora basado en precio unitario israelí
          const edadEnDias = this.calcularEdadEnDias(lote.fechaNacimiento);
          const precioBasePonedora = config.precioUnidadIsraeli || 150; // RD$
          
          // Lógica de precios por edad
          if (edadEnDias < 120) return Math.round(precioBasePonedora * 0.7); // Pollitas (70%)
          if (edadEnDias < 365) return Math.round(precioBasePonedora * 1.2); // En producción (120%)
          return Math.round(precioBasePonedora); // Maduras (100%)
          
        case TipoAve.POLLO_LEVANTE:
          // Precio por pollo levante (israelí) - precio fijo
          return Math.round(config.precioUnidadIsraeli || 150); // RD$ por unidad
          
        case TipoAve.POLLO_ENGORDE:
          // Precio basado en peso promedio del lote y precio por libra
          const precioLibra = config.precioLibraEngorde || 65; // RD$ por libra
          const pesoPromedioKg = lote.pesoPromedio || 2.5; // kg
          const pesoPromedioLibras = pesoPromedioKg * 2.20462; // Convertir a libras
          return Math.round(pesoPromedioLibras * precioLibra);
          
        default:
          return 100;
      }
    } catch (error) {
      console.error('Error al calcular precio unitario:', error);
      // Precios de respaldo si falla la configuración
      switch (tipoAve) {
        case TipoAve.PONEDORA:
          return 120;
        case TipoAve.POLLO_LEVANTE:
          return 150;
        case TipoAve.POLLO_ENGORDE:
          return 150;
        default:
          return 100;
      }
    }
  }
  
  /**
   * Calcula el precio del lote completo (con descuento por volumen)
   */
  private async calcularPrecioLoteCompleto(lote: any, tipoAve: TipoAve): Promise<number> {
    const precioUnitario = await this.calcularPrecioUnitario(lote, tipoAve);
    const precioTotal = precioUnitario * lote.cantidadActual;
    
    // Aplicar descuento por lote completo basado en cantidad
    let descuentoPorcentaje = 0;
    if (lote.cantidadActual >= 200) {
      descuentoPorcentaje = 0.12; // 12% para lotes grandes
    } else if (lote.cantidadActual >= 100) {
      descuentoPorcentaje = 0.08; // 8% para lotes medianos
    } else if (lote.cantidadActual >= 50) {
      descuentoPorcentaje = 0.05; // 5% para lotes pequeños
    }
    
    return Math.round(precioTotal * (1 - descuentoPorcentaje));
  }
  
  /**
   * Obtiene el nombre descriptivo del tipo de ave
   */
  private getNombreAve(tipoAve: TipoAve): string {
    switch (tipoAve) {
      case TipoAve.PONEDORA:
        return 'Gallinas Ponedoras';
      case TipoAve.POLLO_LEVANTE:
        return 'Pollos de Levante';
      case TipoAve.POLLO_ENGORDE:
        return 'Pollos de Engorde';
      default:
        return 'Aves';
    }
  }
  
  /**
   * Obtiene el tipo de producto de unidades según el tipo de ave
   */
  private getTipoProductoUnidades(tipoAve: TipoAve): TipoProducto {
    switch (tipoAve) {
      case TipoAve.PONEDORA:
        return TipoProducto.UNIDADES_GALLINAS_PONEDORAS;
      case TipoAve.POLLO_LEVANTE:
        return TipoProducto.UNIDADES_POLLOS_LEVANTE;
      case TipoAve.POLLO_ENGORDE:
        return TipoProducto.UNIDADES_POLLOS_ENGORDE;
      default:
        return TipoProducto.UNIDADES_GALLINAS_PONEDORAS;
    }
  }
}

export const productosInventarioSimplificadoService = new ProductosInventarioSimplificadoService();
