/**
 * Tests unitarios para lógica crítica de facturación
 */

import {
    DomainError,
    InsufficientQuantityError,
    InvalidQuantityError,
    LoteNotFoundError
} from '../types/errors';

// Mock de Firebase
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  runTransaction: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
  Timestamp: {
    fromDate: jest.fn((date) => date),
    now: jest.fn(() => new Date()),
  },
}));

// Mock de servicios
jest.mock('../services/auth.service', () => ({
  requireAuth: jest.fn(() => 'test-user-id'),
}));

jest.mock('../services/audit.service', () => ({
  auditService: {
    logCreate: jest.fn(),
    logUpdate: jest.fn(),
    logDelete: jest.fn(),
    logSell: jest.fn(),
  },
}));

describe('FacturacionTransaccionalService', () => {
  let facturacionService: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Importar el servicio después de los mocks
    facturacionService = require('../services/facturacion-transaccional.service').facturacionTransaccionalService;
  });

  describe('Validaciones de Items', () => {
    it('debe lanzar error si cantidad es inválida', async () => {
      const items = [
        {
          productoId: 'test-product',
          producto: { id: 'test-product', tipo: 'UNIDADES_POLLOS_ENGORDE', tipoAve: 'POLLO_ENGORDE' },
          cantidad: 0,
          precioUnitario: 100,
          total: 0,
        }
      ];

      await expect(facturacionService.validarItemsFactura(items))
        .rejects
        .toThrow(InvalidQuantityError);
    });

    it('debe lanzar error si cantidad es negativa', async () => {
      const items = [
        {
          productoId: 'test-product',
          producto: { id: 'test-product', tipo: 'UNIDADES_POLLOS_ENGORDE', tipoAve: 'POLLO_ENGORDE' },
          cantidad: -5,
          precioUnitario: 100,
          total: -500,
        }
      ];

      await expect(facturacionService.validarItemsFactura(items))
        .rejects
        .toThrow(InvalidQuantityError);
    });

    it('debe lanzar error si producto no existe', async () => {
      const items = [
        {
          productoId: 'producto-inexistente',
          producto: { id: 'producto-inexistente', tipo: 'UNIDADES_POLLOS_ENGORDE', tipoAve: 'POLLO_ENGORDE' },
          cantidad: 10,
          precioUnitario: 100,
          total: 1000,
        }
      ];

      // Mock de productos disponibles vacío
      jest.spyOn(facturacionService, 'getProductosDisponibles').mockResolvedValue([]);

      await expect(facturacionService.validarItemsFactura(items))
        .rejects
        .toThrow('PRODUCTO_NOT_FOUND');
    });

    it('debe lanzar error si stock insuficiente', async () => {
      const items = [
        {
          productoId: 'test-product',
          producto: { id: 'test-product', tipo: 'UNIDADES_POLLOS_ENGORDE', tipoAve: 'POLLO_ENGORDE' },
          cantidad: 100,
          precioUnitario: 100,
          total: 10000,
        }
      ];

      // Mock de productos con stock limitado
      jest.spyOn(facturacionService, 'getProductosDisponibles').mockResolvedValue([
        {
          id: 'test-product',
          disponible: 50,
          loteId: 'test-lote',
          tipoAve: 'POLLO_ENGORDE',
        }
      ]);

      await expect(facturacionService.validarItemsFactura(items))
        .rejects
        .toThrow(InsufficientQuantityError);
    });
  });

  describe('Cálculos de Factura', () => {
    it('debe calcular subtotal correctamente', () => {
      const items = [
        { subtotal: 1000 },
        { subtotal: 500 },
        { subtotal: 250 },
      ];

      const subtotal = facturacionService.calcularSubtotal(items);
      expect(subtotal).toBe(1750);
    });

    it('debe calcular descuentos correctamente', () => {
      const items = [
        { descuento: 100 },
        { descuento: 50 },
        { descuento: 25 },
      ];

      const descuentoTotal = facturacionService.calcularDescuentoTotal(items);
      expect(descuentoTotal).toBe(175);
    });

    it('debe calcular impuestos correctamente', () => {
      const items = [
        { impuestos: 190 },
        { impuestos: 95 },
        { impuestos: 47.5 },
      ];

      const impuestosTotal = facturacionService.calcularImpuestosTotal(items);
      expect(impuestosTotal).toBe(332.5);
    });

    it('debe calcular total correctamente', () => {
      const items = [
        { total: 1190 },
        { total: 595 },
        { total: 297.5 },
      ];

      const total = facturacionService.calcularTotal(items);
      expect(total).toBe(2082.5);
    });
  });

  describe('Item de Factura', () => {
    it('debe calcular item de factura sin descuento', () => {
      const producto = {
        id: 'test-product',
        precioUnitario: 100,
        tipo: 'UNIDADES_POLLOS_ENGORDE',
        tipoAve: 'POLLO_ENGORDE',
        unidadMedida: 'unidad',
      };

      const item = facturacionService.calcularItemFactura(producto, 10);

      expect(item.productoId).toBe('test-product');
      expect(item.cantidad).toBe(10);
      expect(item.precioUnitario).toBe(100);
      expect(item.subtotal).toBe(1000);
      expect(item.descuento).toBe(0);
      expect(item.impuestos).toBe(190); // 19% IVA
      expect(item.total).toBe(1190);
    });

    it('debe calcular item de factura con descuento', () => {
      const producto = {
        id: 'test-product',
        precioUnitario: 100,
        tipo: 'UNIDADES_POLLOS_ENGORDE',
        tipoAve: 'POLLO_ENGORDE',
        unidadMedida: 'unidad',
      };

      const item = facturacionService.calcularItemFactura(producto, 10, 10); // 10% descuento

      expect(item.productoId).toBe('test-product');
      expect(item.cantidad).toBe(10);
      expect(item.precioUnitario).toBe(100);
      expect(item.subtotal).toBe(1000);
      expect(item.descuento).toBe(100); // 10% de 1000
      expect(item.impuestos).toBe(171); // 19% IVA sobre 900
      expect(item.total).toBe(1071);
    });
  });

  describe('Manejo de Errores', () => {
    it('debe manejar errores de dominio correctamente', () => {
      const error = new InsufficientQuantityError('test-lote', 100, 50, 'POLLO_ENGORDE');
      
      expect(error.code).toBe('INSUFFICIENT_QUANTITY');
      expect(error.message).toContain('test-lote');
      expect(error.message).toContain('100');
      expect(error.message).toContain('50');
      expect(error.metadata).toEqual({
        loteId: 'test-lote',
        requested: 100,
        available: 50,
        tipoAve: 'POLLO_ENGORDE',
      });
    });

    it('debe manejar errores de validación correctamente', () => {
      const error = new InvalidQuantityError(-5);
      
      expect(error.code).toBe('INVALID_QUANTITY');
      expect(error.message).toContain('-5');
      expect(error.metadata).toEqual({ quantity: -5 });
    });

    it('debe manejar errores de lote no encontrado correctamente', () => {
      const error = new LoteNotFoundError('lote-inexistente');
      
      expect(error.code).toBe('LOTE_NOT_FOUND');
      expect(error.message).toContain('lote-inexistente');
      expect(error.metadata).toEqual({ loteId: 'lote-inexistente' });
    });
  });

  describe('Transacciones', () => {
    it('debe manejar errores de transacción correctamente', () => {
      const error = new DomainError('TRANSACTION_ERROR', 'Error en transacción crearFactura: Stock insuficiente', {
        operation: 'crearFactura',
        reason: 'Stock insuficiente',
      });
      
      expect(error.code).toBe('TRANSACTION_ERROR');
      expect(error.message).toContain('crearFactura');
      expect(error.message).toContain('Stock insuficiente');
      expect(error.metadata).toEqual({
        operation: 'crearFactura',
        reason: 'Stock insuficiente',
      });
    });
  });
});

describe('ProductosInventarioSimplificadoService', () => {
  let productosService: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    productosService = require('../services/productos-inventario-simplificado.service').productosInventarioSimplificadoService;
  });

  describe('Cálculo de Precios', () => {
    it('debe calcular precio unitario para ponedoras según edad', async () => {
      // Mock de configuración
      jest.spyOn(productosService, 'obtenerConfiguracion').mockResolvedValue({
        precioUnidadIsraeli: 150,
      });

      const lotePollita = {
        fechaNacimiento: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 días
      };

      const loteProduccion = {
        fechaNacimiento: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000), // 200 días
      };

      const loteMadura = {
        fechaNacimiento: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000), // 400 días
      };

      const precioPollita = await productosService.calcularPrecioUnitario(lotePollita, 'PONEDORA');
      const precioProduccion = await productosService.calcularPrecioUnitario(loteProduccion, 'PONEDORA');
      const precioMadura = await productosService.calcularPrecioUnitario(loteMadura, 'PONEDORA');

      expect(precioPollita).toBe(105); // 70% de 150
      expect(precioProduccion).toBe(180); // 120% de 150
      expect(precioMadura).toBe(150); // 100% de 150
    });

    it('debe calcular precio unitario para levante', async () => {
      jest.spyOn(productosService, 'obtenerConfiguracion').mockResolvedValue({
        precioUnidadIsraeli: 150,
      });

      const lote = { fechaNacimiento: new Date() };
      const precio = await productosService.calcularPrecioUnitario(lote, 'POLLO_LEVANTE');

      expect(precio).toBe(150);
    });

    it('debe calcular precio unitario para engorde basado en peso', async () => {
      jest.spyOn(productosService, 'obtenerConfiguracion').mockResolvedValue({
        precioLibraEngorde: 65,
      });

      const lote = { 
        fechaNacimiento: new Date(),
        pesoPromedio: 2.5 // kg
      };

      const precio = await productosService.calcularPrecioUnitario(lote, 'POLLO_ENGORDE');
      const pesoEnLibras = 2.5 * 2.20462; // 5.51155 libras
      const precioEsperado = Math.round(pesoEnLibras * 65); // 358

      expect(precio).toBe(precioEsperado);
    });
  });

  describe('Cálculo de Descuentos por Volumen', () => {
    it('debe aplicar descuento correcto según cantidad', async () => {
      const loteGrande = { cantidadActual: 250 };
      const loteMediano = { cantidadActual: 150 };
      const lotePequeño = { cantidadActual: 75 };
      const loteMuyPequeño = { cantidadActual: 25 };

      const precioGrande = await productosService.calcularPrecioLoteCompleto(loteGrande, 'POLLO_ENGORDE');
      const precioMediano = await productosService.calcularPrecioLoteCompleto(loteMediano, 'POLLO_ENGORDE');
      const precioPequeño = await productosService.calcularPrecioLoteCompleto(lotePequeño, 'POLLO_ENGORDE');
      const precioMuyPequeño = await productosService.calcularPrecioLoteCompleto(loteMuyPequeño, 'POLLO_ENGORDE');

      // Verificar que los descuentos se aplican correctamente
      expect(precioGrande).toBeLessThan(250 * 100); // 12% descuento
      expect(precioMediano).toBeLessThan(150 * 100); // 8% descuento
      expect(precioPequeño).toBeLessThan(75 * 100); // 5% descuento
      expect(precioMuyPequeño).toBe(25 * 100); // Sin descuento
    });
  });
});

describe('Manejo de Errores en Hook', () => {
  it('debe manejar errores de dominio en el hook', () => {
    const { getErrorCode, getErrorMessage } = require('../types/errors');
    
    const domainError = new InsufficientQuantityError('test-lote', 100, 50, 'POLLO_ENGORDE');
    const regularError = new Error('Error regular');
    
    expect(getErrorCode(domainError)).toBe('INSUFFICIENT_QUANTITY');
    expect(getErrorMessage(domainError)).toContain('test-lote');
    
    expect(getErrorCode(regularError)).toBe('UNKNOWN_ERROR');
    expect(getErrorMessage(regularError)).toBe('Error regular');
  });
});














