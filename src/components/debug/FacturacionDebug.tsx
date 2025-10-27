/**
 * Componente de debug para verificar productos de facturación
 */

import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';
import { productosInventarioSimplificadoService } from '../../services/productos-inventario-simplificado.service';
import { TipoAve } from '../../types/enums';
import { Producto } from '../../types/facturacion';
import { Card } from '../ui/Card';

export const FacturacionDebug: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      setLoading(true);
      setError(null);
      const productosData = await productosInventarioSimplificadoService.generarProductosDesdeInventario();
      setProductos(productosData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const productosPorTipo = productos.reduce((acc, producto) => {
    const tipo = producto.tipoAve;
    if (!acc[tipo]) {
      acc[tipo] = [];
    }
    acc[tipo].push(producto);
    return acc;
  }, {} as Record<TipoAve, Producto[]>);

  if (loading) {
    return (
      <Card style={styles.container}>
        <Text style={styles.title}>🔍 Debug Facturación</Text>
        <Text style={styles.loading}>Cargando productos...</Text>
      </Card>
    );
  }

  if (error) {
    return (
      <Card style={styles.container}>
        <Text style={styles.title}>🔍 Debug Facturación</Text>
        <Text style={styles.error}>Error: {error}</Text>
      </Card>
    );
  }

  return (
    <Card style={styles.container}>
      <Text style={styles.title}>🔍 Debug Facturación</Text>
      <Text style={styles.subtitle}>
        Total productos: {productos.length}
      </Text>

      <ScrollView style={styles.scrollView}>
        {Object.entries(productosPorTipo).map(([tipo, productosTipo]) => (
          <View key={tipo} style={styles.tipoSection}>
            <Text style={styles.tipoTitle}>
              {tipo} ({productosTipo.length} productos)
            </Text>
            
            {productosTipo.map((producto) => (
              <View key={producto.id} style={styles.productoItem}>
                <Text style={styles.productoNombre}>{producto.nombre}</Text>
                <Text style={styles.productoDetalle}>
                  {producto.disponible} disponibles • RD${producto.precioUnitario}
                </Text>
                <Text style={styles.productoTipo}>{producto.tipo}</Text>
              </View>
            ))}
          </View>
        ))}

        {productos.length === 0 && (
          <Text style={styles.empty}>
            No hay productos disponibles. Verifica que tengas lotes activos.
          </Text>
        )}
      </ScrollView>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.lightGray,
    marginBottom: 16,
  },
  loading: {
    fontSize: 14,
    color: colors.lightGray,
    textAlign: 'center',
    padding: 20,
  },
  error: {
    fontSize: 14,
    color: colors.danger,
    textAlign: 'center',
    padding: 20,
  },
  scrollView: {
    maxHeight: 400,
  },
  tipoSection: {
    marginBottom: 16,
  },
  tipoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  productoItem: {
    backgroundColor: colors.lightGray + '20',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  productoNombre: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  productoDetalle: {
    fontSize: 12,
    color: colors.lightGray,
    marginBottom: 2,
  },
  productoTipo: {
    fontSize: 10,
    color: colors.lightGray,
    fontStyle: 'italic',
  },
  empty: {
    fontSize: 14,
    color: colors.lightGray,
    textAlign: 'center',
    padding: 20,
    fontStyle: 'italic',
  },
});














