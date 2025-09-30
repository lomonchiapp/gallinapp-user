/**
 * Servicio para generar productos vendibles desde los lotes existentes
 * Este servicio actúa como puente entre el sistema de lotes y el sistema de facturación
 */

import { EstadoLote, TipoAve } from '../types/enums';
import { Producto, ProductoLoteCompleto, ProductoUnidades, TipoProducto } from '../types/facturacion';

// Importar los servicios existentes (cuando estén disponibles)
// import { ponedorasService } from './ponedoras.service';
// import { levantesService } from './levantes.service'; 
// import { engordeService } from './engorde.service';

class ProductosInventarioService {
  
  /**
   * Genera productos vendibles desde todos los lotes activos
   */
  async generarProductosDesdeInventario(): Promise<Producto[]> {
    try {
      const productos: Producto[] = [];
      
      // Obtener lotes de todos los tipos
      const [lotesPonedoras, lotesLevante, lotesEngorde] = await Promise.all([
        this.obtenerLotesPonedoras(),
        this.obtenerLotesLevante(),
        this.obtenerLotesEngorde(),
      ]);
      
      // Convertir lotes de ponedoras a productos
      lotesPonedoras.forEach(lote => {
        productos.push(...this.convertirLoteAProductos(lote, TipoAve.PONEDORA));
      });
      
      // Convertir lotes de levante a productos
      lotesLevante.forEach(lote => {
        productos.push(...this.convertirLoteAProductos(lote, TipoAve.POLLO_LEVANTE));
      });
      
      // Convertir lotes de engorde a productos
      lotesEngorde.forEach(lote => {
        productos.push(...this.convertirLoteAProductos(lote, TipoAve.POLLO_ENGORDE));
      });
      
      return productos;
    } catch (error) {
      console.error('Error al generar productos desde inventario:', error);
      throw error;
    }
  }
  
  /**
   * Convierte un lote en productos vendibles (lote completo + unidades individuales)
   */
  private convertirLoteAProductos(lote: any, tipoAve: TipoAve): Producto[] {
    const productos: Producto[] = [];
    
    if (lote.estado !== EstadoLote.ACTIVO || lote.cantidadActual <= 0) {
      return productos;
    }
    
    const edadEnDias = this.calcularEdadEnDias(lote.fechaNacimiento);
    const precioUnitario = this.calcularPrecioUnitario(lote, tipoAve);
    const precioLoteCompleto = this.calcularPrecioLoteCompleto(lote, tipoAve);
    
    // 1. Lote completo como producto
    const productoLoteCompleto: ProductoLoteCompleto = {
      id: `lote-${lote.id}`,
      nombre: `Lote ${lote.nombre} - ${lote.raza || 'Sin especificar'}`,
      descripcion: `Lote completo de ${lote.cantidadActual} ${this.getNombreAve(tipoAve)}`,
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
      nombre: `${this.getNombreAve(tipoAve)} - ${lote.raza || 'Sin especificar'}`,
      descripcion: `Unidades individuales del lote ${lote.nombre}`,
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
   * Obtiene los lotes de ponedoras activos
   */
  private async obtenerLotesPonedoras(): Promise<any[]> {
    try {
      // Integración real con el servicio de ponedoras
      // return await ponedorasService.getLotes();
      
      // Por ahora retornamos datos de ejemplo
      return this.getLotesEjemplo(TipoAve.PONEDORA);
    } catch (error) {
      console.error('Error al obtener lotes de ponedoras:', error);
      return [];
    }
  }
  
  /**
   * Obtiene los lotes de levante activos
   */
  private async obtenerLotesLevante(): Promise<any[]> {
    try {
      // Integración real con el servicio de levantes
      // return await levantesService.getLotes();
      
      // Por ahora retornamos datos de ejemplo
      return this.getLotesEjemplo(TipoAve.POLLO_LEVANTE);
    } catch (error) {
      console.error('Error al obtener lotes de levante:', error);
      return [];
    }
  }
  
  /**
   * Obtiene los lotes de engorde activos
   */
  private async obtenerLotesEngorde(): Promise<any[]> {
    try {
      // Integración real con el servicio de engorde
      // return await engordeService.getLotes();
      
      // Por ahora retornamos datos de ejemplo
      return this.getLotesEjemplo(TipoAve.POLLO_ENGORDE);
    } catch (error) {
      console.error('Error al obtener lotes de engorde:', error);
      return [];
    }
  }
  
  /**
   * Genera lotes de ejemplo para demostración
   */
  private getLotesEjemplo(tipoAve: TipoAve): any[] {
    const fechaBase = new Date();
    fechaBase.setMonth(fechaBase.getMonth() - 2); // Lotes de 2 meses
    
    return [
      {
        id: `${tipoAve}-001`,
        nombre: `Lote ${tipoAve.toUpperCase()} 001`,
        fechaInicio: fechaBase,
        fechaNacimiento: fechaBase,
        cantidadActual: tipoAve === TipoAve.PONEDORA ? 150 : 200,
        cantidadInicial: tipoAve === TipoAve.PONEDORA ? 150 : 200,
        raza: this.getRazaEjemplo(tipoAve),
        estado: EstadoLote.ACTIVO,
        pesoPromedio: this.getPesoPromedioEjemplo(tipoAve),
      },
      {
        id: `${tipoAve}-002`,
        nombre: `Lote ${tipoAve.toUpperCase()} 002`,
        fechaInicio: new Date(fechaBase.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 días después
        fechaNacimiento: new Date(fechaBase.getTime() + 15 * 24 * 60 * 60 * 1000),
        cantidadActual: tipoAve === TipoAve.PONEDORA ? 100 : 180,
        cantidadInicial: tipoAve === TipoAve.PONEDORA ? 100 : 180,
        raza: this.getRazaEjemplo(tipoAve),
        estado: EstadoLote.ACTIVO,
        pesoPromedio: this.getPesoPromedioEjemplo(tipoAve),
      },
    ];
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
  private calcularPrecioUnitario(lote: any, tipoAve: TipoAve): number {
    const edadEnDias = this.calcularEdadEnDias(lote.fechaNacimiento);
    
    switch (tipoAve) {
      case TipoAve.PONEDORA:
        // Precio basado en edad y capacidad productiva
        if (edadEnDias < 120) return 15000; // Pollitas
        if (edadEnDias < 365) return 25000; // En producción
        return 20000; // Maduras
        
      case TipoAve.POLLO_LEVANTE:
        // Precio basado en peso y edad
        const precioBase = 12000;
        const factorPeso = lote.pesoPromedio ? (lote.pesoPromedio * 1000) : 1000;
        return precioBase + factorPeso;
        
      case TipoAve.POLLO_ENGORDE:
        // Precio basado en peso principalmente
        const precioEngorde = 8000;
        const factorPesoEngorde = lote.pesoPromedio ? (lote.pesoPromedio * 2000) : 2000;
        return precioEngorde + factorPesoEngorde;
        
      default:
        return 20000;
    }
  }
  
  /**
   * Calcula el precio del lote completo (con descuento por volumen)
   */
  private calcularPrecioLoteCompleto(lote: any, tipoAve: TipoAve): number {
    const precioUnitario = this.calcularPrecioUnitario(lote, tipoAve);
    const precioTotal = precioUnitario * lote.cantidadActual;
    
    // Aplicar descuento por lote completo (5-10%)
    const descuentoPorcentaje = lote.cantidadActual > 100 ? 0.1 : 0.05;
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
  
  /**
   * Obtiene una raza de ejemplo según el tipo de ave
   */
  private getRazaEjemplo(tipoAve: TipoAve): string {
    switch (tipoAve) {
      case TipoAve.PONEDORA:
        return 'ISA Brown';
      case TipoAve.POLLO_LEVANTE:
        return 'Ross 308';
      case TipoAve.POLLO_ENGORDE:
        return 'Cobb 500';
      default:
        return 'Mixta';
    }
  }
  
  /**
   * Obtiene un peso promedio de ejemplo según el tipo de ave
   */
  private getPesoPromedioEjemplo(tipoAve: TipoAve): number {
    switch (tipoAve) {
      case TipoAve.PONEDORA:
        return 1.8; // kg
      case TipoAve.POLLO_LEVANTE:
        return 1.2; // kg
      case TipoAve.POLLO_ENGORDE:
        return 2.5; // kg
      default:
        return 1.5;
    }
  }
  
  /**
   * Actualiza el inventario después de una venta
   * Reduce la cantidad disponible en el lote original
   */
  async actualizarInventarioPorVenta(productoId: string, cantidadVendida: number): Promise<void> {
    try {
      // Extraer información del ID del producto
      const [tipo, loteId] = productoId.split('-');
      
      if (tipo === 'lote') {
        // Venta de lote completo - marcar lote como vendido
        await this.marcarLoteComoVendido(loteId);
      } else if (tipo === 'unidades') {
        // Venta de unidades individuales - reducir cantidad del lote
        await this.reducirCantidadLote(loteId, cantidadVendida);
      }
    } catch (error) {
      console.error('Error al actualizar inventario por venta:', error);
      throw error;
    }
  }
  
  /**
   * Marca un lote como vendido
   */
  private async marcarLoteComoVendido(loteId: string): Promise<void> {
    // Integración con servicios de lotes para cambiar estado
    console.log(`Marcando lote ${loteId} como vendido`);
    // await loteService.actualizarEstado(loteId, EstadoLote.VENDIDO);
  }
  
  /**
   * Reduce la cantidad disponible en un lote
   */
  private async reducirCantidadLote(loteId: string, cantidad: number): Promise<void> {
    // Integración con servicios de lotes para reducir cantidad
    console.log(`Reduciendo ${cantidad} unidades del lote ${loteId}`);
    // await loteService.reducirCantidad(loteId, cantidad);
  }
}

export const productosInventarioService = new ProductosInventarioService();









