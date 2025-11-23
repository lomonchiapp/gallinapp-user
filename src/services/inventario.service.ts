/**
 * InventarioService - Productos dinámicos optimizados
 * 
 * Características:
 * - Generación dinámica optimizada con cache por tipo de lote
 * - Consultas paralelas a Firebase
 * - Invalidación selectiva de cache
 * - Pre-carga de productos más usados
 */

import { EstadoLote, TipoAve } from '../types/enums';
import { Producto, ProductoLoteCompleto, ProductoUnidades, ProductoHuevos, TipoProducto, UnidadVentaHuevos } from '../types/facturacion';
import { configService } from './config.service';
import { obtenerLotesEngorde } from './engorde.service';
import { obtenerLotesLevantes } from './levantes.service';
import { obtenerLotesPonedoras, obtenerRegistrosProduccionPorLote } from './ponedoras.service';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  isValid: boolean;
}

interface ProductCache {
  ponedoras: CacheEntry<Producto[]> | null;
  levantes: CacheEntry<Producto[]> | null;
  engorde: CacheEntry<Producto[]> | null;
  huevos: CacheEntry<Producto[]> | null;
  combined: CacheEntry<Producto[]> | null;
}

class InventarioService {
  private cache: ProductCache = {
    ponedoras: null,
    levantes: null,
    engorde: null,
    huevos: null,
    combined: null,
  };

  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos
  private readonly HUEVOS_CACHE_TTL = 2 * 60 * 1000; // 2 minutos (más dinámico)

  /**
   * Obtiene todos los productos disponibles
   */
  async getProductos(forceRefresh = false): Promise<Producto[]> {
    // Verificar cache combinado
    if (!forceRefresh && this.cache.combined && this.isCacheValid(this.cache.combined)) {
      const remainingTTL = this.getRemainingTTL(this.cache.combined);
      console.log(`🚀 [InventarioService] Usando cache combinado (válido por ${remainingTTL}s más)`);
      return this.cache.combined.data;
    }

    console.log('🔄 [InventarioService] Generando productos desde inventario...');
    const startTime = Date.now();

    try {
      // Obtener productos por tipo en paralelo
      const [productosLotes, productosHuevos] = await Promise.all([
        this.getProductosLotes(forceRefresh),
        this.getProductosHuevos(forceRefresh),
      ]);

      const allProducts = [...productosLotes, ...productosHuevos];

      // Actualizar cache combinado
      this.cache.combined = {
        data: allProducts,
        timestamp: Date.now(),
        isValid: true,
      };

      const duration = Date.now() - startTime;
      console.log(`✅ [InventarioService] ${allProducts.length} productos generados en ${duration}ms`);
      console.log(`📊 [InventarioService] Desglose:`, {
        lotes: productosLotes.filter(p => p.tipo === TipoProducto.LOTE_COMPLETO).length,
        unidades: productosLotes.filter(p => p.tipo !== TipoProducto.LOTE_COMPLETO).length,
        huevos: productosHuevos.length,
      });

      return allProducts;
    } catch (error) {
      console.error('❌ [InventarioService] Error al generar productos:', error);
      throw error;
    }
  }

  /**
   * Obtiene productos de lotes (ponedoras, levantes, engorde)
   */
  async getProductosLotes(forceRefresh = false): Promise<Producto[]> {
    // Verificar si todos los caches de lotes son válidos
    const cacheEntries = [this.cache.ponedoras, this.cache.levantes, this.cache.engorde];
    const allCacheValid = !forceRefresh && cacheEntries.every(entry => entry && this.isCacheValid(entry));

    if (allCacheValid) {
      const productos = cacheEntries.flatMap(entry => entry!.data);
      console.log(`🚀 [InventarioService] Usando cache de lotes (${productos.length} productos)`);
      return productos;
    }

    console.log('🔄 [InventarioService] Cargando productos de lotes...');

    // Cargar lotes en paralelo
    const [lotesPonedoras, lotesLevante, lotesEngorde] = await Promise.all([
      this.loadLotesPonedoras(forceRefresh),
      this.loadLotesLevante(forceRefresh),
      this.loadLotesEngorde(forceRefresh),
    ]);

    return [...lotesPonedoras, ...lotesLevante, ...lotesEngorde];
  }

  /**
   * Obtiene productos de huevos
   */
  async getProductosHuevos(forceRefresh = false): Promise<ProductoHuevos[]> {
    if (!forceRefresh && this.cache.huevos && this.isCacheValid(this.cache.huevos, this.HUEVOS_CACHE_TTL)) {
      const remainingTTL = this.getRemainingTTL(this.cache.huevos, this.HUEVOS_CACHE_TTL);
      console.log(`🥚 [InventarioService] Usando cache de huevos (válido por ${remainingTTL}s más)`);
      return this.cache.huevos.data as ProductoHuevos[];
    }

    console.log('🥚 [InventarioService] Generando productos de huevos...');
    const startTime = Date.now();

    try {
      const productosHuevos = await this.generateProductosHuevos();

      // Actualizar cache
      this.cache.huevos = {
        data: productosHuevos,
        timestamp: Date.now(),
        isValid: true,
      };

      const duration = Date.now() - startTime;
      console.log(`✅ [InventarioService] ${productosHuevos.length} productos de huevos generados en ${duration}ms`);

      return productosHuevos;
    } catch (error) {
      console.error('❌ [InventarioService] Error al generar productos de huevos:', error);
      return [];
    }
  }

  /**
   * Invalida cache selectivamente
   */
  invalidateCache(tipo?: 'ponedoras' | 'levantes' | 'engorde' | 'huevos' | 'all'): void {
    if (!tipo || tipo === 'all') {
      // Invalidar todo
      Object.keys(this.cache).forEach(key => {
        const entry = this.cache[key as keyof ProductCache];
        if (entry) entry.isValid = false;
      });
      console.log('🗑️ [InventarioService] Cache completo invalidado');
    } else {
      // Invalidar tipo específico
      const entry = this.cache[tipo];
      if (entry) entry.isValid = false;
      
      // También invalidar cache combinado
      if (this.cache.combined) this.cache.combined.isValid = false;
      
      console.log(`🗑️ [InventarioService] Cache de ${tipo} invalidado`);
    }
  }

  /**
   * Pre-carga productos más usados
   */
  async preloadCommonProducts(): Promise<void> {
    console.log('⚡ [InventarioService] Pre-cargando productos comunes...');
    
    try {
      // Pre-cargar en paralelo sin esperar
      Promise.all([
        this.loadLotesPonedoras(),
        this.generateProductosHuevos(),
      ]).catch(error => {
        console.warn('⚠️ [InventarioService] Error en pre-carga:', error);
      });
      
      console.log('✅ [InventarioService] Pre-carga iniciada');
    } catch (error) {
      console.warn('⚠️ [InventarioService] Error al iniciar pre-carga:', error);
    }
  }

  // Métodos privados

  private async loadLotesPonedoras(forceRefresh = false): Promise<Producto[]> {
    if (!forceRefresh && this.cache.ponedoras && this.isCacheValid(this.cache.ponedoras)) {
      return this.cache.ponedoras.data;
    }

    try {
      const lotes = await obtenerLotesPonedoras({ status: EstadoLote.ACTIVO });
      const productos = await Promise.all(
        lotes.map(lote => this.convertirLoteAProductos(lote, TipoAve.PONEDORA))
      );

      const productosFlat = productos.flat();
      
      this.cache.ponedoras = {
        data: productosFlat,
        timestamp: Date.now(),
        isValid: true,
      };

      console.log(`✅ [InventarioService] ${productosFlat.length} productos de ponedoras cargados`);
      return productosFlat;
    } catch (error) {
      console.error('❌ [InventarioService] Error al cargar ponedoras:', error);
      return [];
    }
  }

  private async loadLotesLevante(forceRefresh = false): Promise<Producto[]> {
    if (!forceRefresh && this.cache.levantes && this.isCacheValid(this.cache.levantes)) {
      return this.cache.levantes.data;
    }

    try {
      const lotes = await obtenerLotesLevantes({ status: EstadoLote.ACTIVO });
      const productos = await Promise.all(
        lotes.map(lote => this.convertirLoteAProductos(lote, TipoAve.POLLO_LEVANTE))
      );

      const productosFlat = productos.flat();
      
      this.cache.levantes = {
        data: productosFlat,
        timestamp: Date.now(),
        isValid: true,
      };

      console.log(`✅ [InventarioService] ${productosFlat.length} productos de levante cargados`);
      return productosFlat;
    } catch (error) {
      console.error('❌ [InventarioService] Error al cargar levantes:', error);
      return [];
    }
  }

  private async loadLotesEngorde(forceRefresh = false): Promise<Producto[]> {
    if (!forceRefresh && this.cache.engorde && this.isCacheValid(this.cache.engorde)) {
      return this.cache.engorde.data;
    }

    try {
      const lotes = await obtenerLotesEngorde({ status: EstadoLote.ACTIVO });
      const productos = await Promise.all(
        lotes.map(lote => this.convertirLoteAProductos(lote, TipoAve.POLLO_ENGORDE))
      );

      const productosFlat = productos.flat();
      
      this.cache.engorde = {
        data: productosFlat,
        timestamp: Date.now(),
        isValid: true,
      };

      console.log(`✅ [InventarioService] ${productosFlat.length} productos de engorde cargados`);
      return productosFlat;
    } catch (error) {
      console.error('❌ [InventarioService] Error al cargar engorde:', error);
      return [];
    }
  }

  private async generateProductosHuevos(): Promise<ProductoHuevos[]> {
    try {
      const config = configService.getConfig();
      const lotesPonedoras = await obtenerLotesPonedoras({ status: EstadoLote.ACTIVO });
      const productos: ProductoHuevos[] = [];

      for (const lote of lotesPonedoras) {
        try {
          const registros = await obtenerRegistrosProduccionPorLote(lote.id);
          
          // Agrupar registros por fecha
          const registrosPorFecha = this.agruparRegistrosPorFecha(registros);
          
          for (const [fechaKey, grupo] of Object.entries(registrosPorFecha)) {
            const totalDisponible = grupo.cantidadTotal;
            if (totalDisponible <= 0) continue;

            const fecha = new Date(fechaKey);
            const registrosIds = grupo.registros.map(r => r.id);

            // Producto por unidades
            productos.push({
              id: `huevos-unidades-${lote.id}-${fecha.getTime()}`,
              nombre: `Huevos - ${lote.nombre}`,
              descripcion: `${totalDisponible} huevos del ${fecha.toLocaleDateString('es-DO')}`,
              tipo: TipoProducto.HUEVOS,
              tipoAve: TipoAve.PONEDORA,
              precioUnitario: config.precioHuevo,
              unidadMedida: 'unidad',
              disponible: totalDisponible,
              tamano: 'MIXTO',
              calidad: 'FRESCO',
              fechaRecoleccion: fecha,
              loteId: lote.id,
              unidadVenta: UnidadVentaHuevos.UNIDADES,
              registrosIds,
            });

            // Producto por cajas
            const cantidadCajas = Math.floor(totalDisponible / config.cantidadHuevosPorCaja);
            if (cantidadCajas > 0) {
              productos.push({
                id: `huevos-cajas-${lote.id}-${fecha.getTime()}`,
                nombre: `Cajas de Huevos - ${lote.nombre}`,
                descripcion: `${cantidadCajas} cajas (${config.cantidadHuevosPorCaja} huevos/caja) del ${fecha.toLocaleDateString('es-DO')}`,
                tipo: TipoProducto.HUEVOS,
                tipoAve: TipoAve.PONEDORA,
                precioUnitario: config.precioHuevo * config.cantidadHuevosPorCaja,
                unidadMedida: 'caja',
                disponible: cantidadCajas,
                tamano: 'MIXTO',
                calidad: 'FRESCO',
                fechaRecoleccion: fecha,
                loteId: lote.id,
                unidadVenta: UnidadVentaHuevos.CAJAS,
                cantidadPorCaja: config.cantidadHuevosPorCaja,
                registrosIds,
              });
            }
          }
        } catch (error) {
          console.warn(`⚠️ [InventarioService] Error al procesar lote ${lote.id}:`, error);
          continue;
        }
      }

      return productos;
    } catch (error) {
      console.error('❌ [InventarioService] Error al generar productos de huevos:', error);
      return [];
    }
  }

  private agruparRegistrosPorFecha(registros: any[]): Record<string, { cantidadTotal: number; registros: any[] }> {
    return registros.reduce((acc, registro) => {
      const fechaKey = registro.fecha.toISOString().split('T')[0];
      if (!acc[fechaKey]) {
        acc[fechaKey] = { cantidadTotal: 0, registros: [] };
      }
      
      const cantidadRegistro = 
        (registro.cantidadHuevosPequenos || 0) +
        (registro.cantidadHuevosMedianos || 0) +
        (registro.cantidadHuevosGrandes || 0) +
        (registro.cantidadHuevosExtraGrandes || 0);
      
      acc[fechaKey].cantidadTotal += cantidadRegistro;
      acc[fechaKey].registros.push(registro);
      
      return acc;
    }, {} as Record<string, { cantidadTotal: number; registros: any[] }>);
  }

  private async convertirLoteAProductos(lote: any, tipoAve: TipoAve): Promise<Producto[]> {
    if (!lote || lote.estado !== EstadoLote.ACTIVO || lote.cantidadActual <= 0) {
      return [];
    }

    const config = configService.getConfig();
    const productos: Producto[] = [];

    try {
      // Calcular precios según tipo de ave
      const precios = this.calcularPrecios(lote, tipoAve, config);

      // Producto: Lote completo
      const productoLoteCompleto: ProductoLoteCompleto = {
        id: `lote-${lote.id}`,
        nombre: `${lote.nombre} (Lote Completo)`,
        descripcion: `Lote completo de ${lote.cantidadActual} ${this.getTipoAveLabel(tipoAve)}`,
        tipo: TipoProducto.LOTE_COMPLETO,
        tipoAve,
        precioUnitario: precios.loteCompleto,
        unidadMedida: 'lote',
        disponible: 1,
        loteId: lote.id,
        edadActual: this.calcularEdadEnDias(lote.fechaNacimiento),
        cantidadTotal: lote.cantidadActual,
        raza: lote.raza || 'No especificada',
        fechaInicio: lote.fechaInicio || lote.createdAt,
        pesoPromedio: lote.pesoPromedio,
      };

      productos.push(productoLoteCompleto);

      // Producto: Unidades individuales
      const tipoUnidades = this.getTipoProductoUnidades(tipoAve);
      const productoUnidades: ProductoUnidades = {
        id: `unidades-${lote.id}`,
        nombre: `${lote.nombre} (Unidades)`,
        descripcion: `Venta por unidades de ${this.getTipoAveLabel(tipoAve)}`,
        tipo: tipoUnidades,
        tipoAve,
        precioUnitario: precios.unidad,
        unidadMedida: 'unidad',
        disponible: lote.cantidadActual,
        loteId: lote.id,
        edadActual: this.calcularEdadEnDias(lote.fechaNacimiento),
        cantidadTotal: lote.cantidadActual,
        raza: lote.raza || 'No especificada',
        fechaInicio: lote.fechaInicio || lote.createdAt,
        pesoPromedio: lote.pesoPromedio,
      };

      productos.push(productoUnidades);

      return productos;
    } catch (error) {
      console.error(`❌ [InventarioService] Error al convertir lote ${lote.id}:`, error);
      return [];
    }
  }

  private calcularPrecios(lote: any, tipoAve: TipoAve, config: any): { loteCompleto: number; unidad: number } {
    let precioUnidad = 0;

    switch (tipoAve) {
      case TipoAve.PONEDORA:
        precioUnidad = config.precioUnidadIsraeli;
        break;
      case TipoAve.POLLO_LEVANTE:
        precioUnidad = config.precioUnidadIsraeli * 0.8; // 20% menos que ponedoras
        break;
      case TipoAve.POLLO_ENGORDE:
        const pesoPromedio = lote.pesoPromedio || config.pesoObjetivoEngorde;
        precioUnidad = pesoPromedio * config.precioLibraEngorde;
        break;
    }

    // Descuento por volumen en lote completo (5-10% según cantidad)
    const descuentoVolumen = lote.cantidadActual > 100 ? 0.1 : 0.05;
    const precioLoteCompleto = precioUnidad * lote.cantidadActual * (1 - descuentoVolumen);

    return {
      unidad: precioUnidad,
      loteCompleto: precioLoteCompleto,
    };
  }

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

  private getTipoAveLabel(tipoAve: TipoAve): string {
    switch (tipoAve) {
      case TipoAve.PONEDORA:
        return 'gallinas ponedoras';
      case TipoAve.POLLO_LEVANTE:
        return 'pollos de levante';
      case TipoAve.POLLO_ENGORDE:
        return 'pollos de engorde';
      default:
        return 'aves';
    }
  }

  private calcularEdadEnDias(fechaNacimiento: Date): number {
    // Los días se calculan basándose en medianoche (00:00), no en 24 horas exactas
    const fechaMidnight = new Date(fechaNacimiento);
    fechaMidnight.setHours(0, 0, 0, 0);
    
    const ahora = new Date();
    const ahoraMidnight = new Date(ahora);
    ahoraMidnight.setHours(0, 0, 0, 0);
    
    const diferencia = ahoraMidnight.getTime() - fechaMidnight.getTime();
    return Math.floor(diferencia / (1000 * 60 * 60 * 24));
  }

  private isCacheValid(entry: CacheEntry<any>, ttl = this.CACHE_TTL): boolean {
    if (!entry.isValid) return false;
    const age = Date.now() - entry.timestamp;
    return age < ttl;
  }

  private getRemainingTTL(entry: CacheEntry<any>, ttl = this.CACHE_TTL): number {
    const age = Date.now() - entry.timestamp;
    const remaining = ttl - age;
    return Math.max(0, Math.round(remaining / 1000));
  }
}

// Instancia singleton
export const inventarioService = new InventarioService();

// Funciones de conveniencia
export const getProductos = (forceRefresh?: boolean) => inventarioService.getProductos(forceRefresh);
export const getProductosLotes = (forceRefresh?: boolean) => inventarioService.getProductosLotes(forceRefresh);
export const getProductosHuevos = (forceRefresh?: boolean) => inventarioService.getProductosHuevos(forceRefresh);
export const invalidateInventarioCache = (tipo?: 'ponedoras' | 'levantes' | 'engorde' | 'huevos' | 'all') => 
  inventarioService.invalidateCache(tipo);
export const preloadCommonProducts = () => inventarioService.preloadCommonProducts();
