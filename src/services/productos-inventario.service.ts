/**
 * Servicio para generar productos vendibles desde los lotes existentes
 * Este servicio actúa como puente entre el sistema de lotes y el sistema de facturación
 */

import { EstadoLote, TipoAve } from '../types/enums';
import { Producto, ProductoLoteCompleto, ProductoUnidades, TipoProducto } from '../types/facturacion';
import { obtenerConfiguracion } from './appConfig.service';
import { actualizarLoteEngorde, obtenerLotesEngorde } from './engorde.service';
import { actualizarLoteLevante, obtenerLotesLevantes } from './levantes.service';
import { actualizarLotePonedora, obtenerLotesPonedoras } from './ponedoras.service';

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
      for (const lote of lotesPonedoras) {
        const productosLote = await this.convertirLoteAProductos(lote, TipoAve.PONEDORA);
        productos.push(...productosLote);
      }
      
      // Convertir lotes de levante a productos
      for (const lote of lotesLevante) {
        const productosLote = await this.convertirLoteAProductos(lote, TipoAve.POLLO_LEVANTE);
        productos.push(...productosLote);
      }
      
      // Convertir lotes de engorde a productos
      for (const lote of lotesEngorde) {
        const productosLote = await this.convertirLoteAProductos(lote, TipoAve.POLLO_ENGORDE);
        productos.push(...productosLote);
      }
      
      return productos;
    } catch (error) {
      console.error('Error al generar productos desde inventario:', error);
      throw error;
    }
  }
  
  /**
   * Convierte un lote en productos vendibles (lote completo + unidades individuales)
   */
  private async convertirLoteAProductos(lote: any, tipoAve: TipoAve): Promise<Producto[]> {
    const productos: Producto[] = [];
    
    if (lote.estado !== EstadoLote.ACTIVO || lote.cantidadActual <= 0) {
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
   * Obtiene los lotes de ponedoras activos
   */
  private async obtenerLotesPonedoras(): Promise<any[]> {
    try {
      const lotes = await obtenerLotesPonedoras();
      return lotes.filter(lote => lote.estado === EstadoLote.ACTIVO && lote.cantidadActual > 0);
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
      const lotes = await obtenerLotesLevantes();
      return lotes.filter(lote => lote.estado === EstadoLote.ACTIVO && lote.cantidadActual > 0);
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
      const lotes = await obtenerLotesEngorde();
      return lotes.filter(lote => lote.estado === EstadoLote.ACTIVO && lote.cantidadActual > 0);
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
   * Usa la configuración de precios de la aplicación
   */
  private async calcularPrecioUnitario(lote: any, tipoAve: TipoAve): Promise<number> {
    try {
      const config = await obtenerConfiguracion();
      
      switch (tipoAve) {
        case TipoAve.PONEDORA:
          // Precio por gallina ponedora basado en precio unitario israelí
          // Ajustar según edad y capacidad productiva
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
          const pesoPromedioKg = lote.pesoPromedio || 2.5; // kg (asumiendo que viene en kg)
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
  async actualizarInventarioPorVenta(productoId: string, cantidadVendida: number, tipoAve: TipoAve): Promise<void> {
    try {
      console.log(`🔄 Actualizando inventario por venta: ${productoId}, cantidad: ${cantidadVendida}, tipo: ${tipoAve}`);
      
      // Extraer información del ID del producto
      const [tipo, ...loteIdParts] = productoId.split('-');
      const loteId = loteIdParts.join('-'); // Reconstituir el ID si tiene guiones
      
      console.log(`📦 Procesando venta - Tipo: ${tipo}, LoteId: ${loteId}`);
      
      if (tipo === 'lote') {
        // Venta de lote completo - marcar lote como vendido
        console.log(`🏷️ Marcando lote completo ${loteId} como vendido`);
        await this.marcarLoteComoVendido(loteId, tipoAve);
      } else if (tipo === 'unidades') {
        // Venta de unidades individuales - reducir cantidad del lote
        console.log(`📉 Reduciendo ${cantidadVendida} unidades del lote ${loteId}`);
        await this.reducirCantidadLote(loteId, cantidadVendida, tipoAve);
      } else {
        console.warn(`⚠️ Tipo de producto no reconocido: ${tipo}`);
      }
      
      console.log(`✅ Inventario actualizado exitosamente para ${productoId}`);
    } catch (error) {
      console.error('Error al actualizar inventario por venta:', error);
      throw error;
    }
  }
  
  /**
   * Marca un lote como vendido
   */
  private async marcarLoteComoVendido(loteId: string, tipoAve: TipoAve): Promise<void> {
    try {
      console.log(`🏷️ Marcando lote ${loteId} como vendido (${tipoAve})`);
      
      const actualizacion = {
        estado: EstadoLote.VENDIDO,
        fechaVenta: new Date(),
      };
      
      switch (tipoAve) {
        case TipoAve.PONEDORA:
          await actualizarLotePonedora(loteId, actualizacion);
          break;
        case TipoAve.POLLO_LEVANTE:
          await actualizarLoteLevante(loteId, actualizacion);
          break;
        case TipoAve.POLLO_ENGORDE:
          await actualizarLoteEngorde(loteId, actualizacion);
          break;
      }
      
      console.log(`✅ Lote ${loteId} marcado como vendido`);
    } catch (error) {
      console.error(`❌ Error al marcar lote ${loteId} como vendido:`, error);
      throw error;
    }
  }
  
  /**
   * Reduce la cantidad disponible en un lote
   */
  private async reducirCantidadLote(loteId: string, cantidad: number, tipoAve: TipoAve): Promise<void> {
    try {
      console.log(`📉 Reduciendo ${cantidad} unidades del lote ${loteId} (${tipoAve})`);
      
      // Obtener lote actual
      let lote: any;
      switch (tipoAve) {
        case TipoAve.PONEDORA:
          const ponedoras = await obtenerLotesPonedoras();
          lote = ponedoras.find(l => l.id === loteId);
          break;
        case TipoAve.POLLO_LEVANTE:
          const levantes = await obtenerLotesLevantes();
          lote = levantes.find(l => l.id === loteId);
          break;
        case TipoAve.POLLO_ENGORDE:
          const engordes = await getLotesEngorde();
          lote = engordes.find(l => l.id === loteId);
          break;
      }
      
      if (!lote) {
        throw new Error(`Lote ${loteId} no encontrado`);
      }
      
      const nuevaCantidad = Math.max(0, lote.cantidadActual - cantidad);
      const actualizacion: any = {
        cantidadActual: nuevaCantidad,
      };
      
      // Si se vendió todo, marcar como vendido
      if (nuevaCantidad === 0) {
        actualizacion.estado = EstadoLote.VENDIDO;
        actualizacion.fechaVenta = new Date();
      }
      
      switch (tipoAve) {
        case TipoAve.PONEDORA:
          await actualizarLotePonedora(loteId, actualizacion);
          break;
        case TipoAve.POLLO_LEVANTE:
          await actualizarLoteLevante(loteId, actualizacion);
          break;
        case TipoAve.POLLO_ENGORDE:
          await actualizarLoteEngorde(loteId, actualizacion);
          break;
      }
      
      console.log(`✅ Lote ${loteId} actualizado. Nueva cantidad: ${nuevaCantidad}`);
    } catch (error) {
      console.error(`❌ Error al reducir cantidad del lote ${loteId}:`, error);
      throw error;
    }
  }
}

export const productosInventarioService = new ProductosInventarioService();





















