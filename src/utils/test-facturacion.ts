/**
 * Script de prueba para verificar que todos los tipos de lotes aparecen en facturación
 */

import { productosInventarioSimplificadoService } from '../services/productos-inventario-simplificado.service';
import { TipoAve } from '../types/enums';

export const testFacturacionTodosTipos = async () => {
  try {
    console.log('🧪 Probando generación de productos para facturación...');
    
    const productos = await productosInventarioSimplificadoService.generarProductosDesdeInventario();
    
    console.log(`📊 Total de productos generados: ${productos.length}`);
    
    // Agrupar por tipo de ave
    const productosPorTipo = productos.reduce((acc, producto) => {
      const tipo = producto.tipoAve;
      if (!acc[tipo]) {
        acc[tipo] = [];
      }
      acc[tipo].push(producto);
      return acc;
    }, {} as Record<TipoAve, any[]>);
    
    // Mostrar estadísticas
    console.log('\n📈 Productos por tipo de ave:');
    Object.entries(productosPorTipo).forEach(([tipo, productos]) => {
      console.log(`  ${tipo}: ${productos.length} productos`);
      
      // Mostrar algunos ejemplos
      productos.slice(0, 2).forEach(producto => {
        console.log(`    - ${producto.nombre} (${producto.disponible} disponibles)`);
      });
    });
    
    // Verificar que hay productos de todos los tipos
    const tiposEsperados = [TipoAve.PONEDORA, TipoAve.POLLO_LEVANTE, TipoAve.POLLO_ENGORDE];
    const tiposEncontrados = Object.keys(productosPorTipo);
    
    console.log('\n✅ Verificación de tipos:');
    tiposEsperados.forEach(tipo => {
      const encontrado = tiposEncontrados.includes(tipo);
      console.log(`  ${tipo}: ${encontrado ? '✅' : '❌'}`);
    });
    
    // Verificar productos de lote completo vs unidades
    const lotesCompletos = productos.filter(p => p.tipo.includes('LOTE_COMPLETO'));
    const unidades = productos.filter(p => p.tipo.includes('UNIDADES_'));
    
    console.log('\n📦 Tipos de productos:');
    console.log(`  Lotes completos: ${lotesCompletos.length}`);
    console.log(`  Unidades individuales: ${unidades.length}`);
    
    if (productos.length === 0) {
      console.log('⚠️  No se encontraron productos. Verifica que tengas lotes activos.');
    } else {
      console.log('✅ ¡Facturación lista para todos los tipos de lotes!');
    }
    
    return productos;
    
  } catch (error) {
    console.error('❌ Error al probar facturación:', error);
    throw error;
  }
};

// Función para ejecutar desde consola
export const ejecutarTestFacturacion = () => {
  testFacturacionTodosTipos()
    .then(productos => {
      console.log(`\n🎉 Test completado. ${productos.length} productos disponibles para facturación.`);
    })
    .catch(error => {
      console.error('💥 Test falló:', error);
    });
};














