/**
 * Pantalla de historial de mortalidad
 */

import AppHeader from '@/src/components/layouts/AppHeader';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Card from '../src/components/ui/Card';
import { colors } from '../src/constants/colors';
import { useEngordeStore } from '../src/stores/engordeStore';
import { useIsraeliesStore } from '../src/stores/levantesStore';
import { useMortalityStore } from '../src/stores/mortalityStore';
import { usePonedorasStore } from '../src/stores/ponedorasStore';

export default function HistorialMortalidadScreen() {
  const [filtroTipo, setFiltroTipo] = useState<string | null>(null);
  const [lotesMap, setLotesMap] = useState<Record<string, any>>({});
  
  const { registros, loadRegistrosMortalidad, isLoading } = useMortalityStore();
  const ponedorasStore = usePonedorasStore();
  const engordeStore = useEngordeStore();
  const israeliesStore = useIsraeliesStore();
  
  // Cargar todos los registros de mortalidad
  useEffect(() => {
    const cargarRegistros = async () => {
      try {
        // Aquí deberíamos cargar todos los registros, pero por ahora
        // vamos a cargar solo los de ponedoras como ejemplo
        await loadRegistrosMortalidad('', 'todos');
      } catch (error) {
        console.error('Error al cargar registros de mortalidad:', error);
      }
    };
    
    cargarRegistros();
  }, []);
  
  // Cargar información de lotes para mostrar nombres
  useEffect(() => {
    const cargarLotes = async () => {
      try {
        // Cargar lotes de ponedoras
        await ponedorasStore.cargarLotes();
        // Cargar lotes de engorde
        await engordeStore.cargarLotes();
        // Cargar lotes de israelíes
        await israeliesStore.cargarLotes();
        
        // Crear un mapa de todos los lotes para acceso rápido
        const todosLotes = {
          ...ponedorasStore.lotes.reduce((acc, lote) => ({ ...acc, [lote.id]: lote }), {}),
          ...engordeStore.lotes.reduce((acc, lote) => ({ ...acc, [lote.id]: lote }), {}),
          ...israeliesStore.lotes.reduce((acc, lote) => ({ ...acc, [lote.id]: lote }), {})
        };
        
        setLotesMap(todosLotes);
      } catch (error) {
        console.error('Error al cargar lotes:', error);
      }
    };
    
    cargarLotes();
  }, []);
  
  // Obtener el nombre del lote a partir del ID
  const obtenerNombreLote = (loteId: string): string => {
    return lotesMap[loteId]?.nombre || loteId;
  };
  
  // Obtener el icono según el tipo de lote
  const obtenerIconoTipoLote = (tipoLote: string) => {
    switch (tipoLote) {
      case 'ponedoras':
        return <Ionicons name="egg" size={20} color={colors.ponedoras} />;
      case 'israelies':
        return <Ionicons name="nutrition" size={20} color={colors.success} />;
      case 'engorde':
        return <Ionicons name="fast-food" size={20} color={colors.warning} />;
      default:
        return <Ionicons name="help-circle" size={20} color={colors.textMedium} />;
    }
  };
  
  // Filtrar registros por tipo
  const registrosFiltrados = filtroTipo
    ? registros.filter(registro => registro.tipoLote === filtroTipo)
    : registros;
  
  // Renderizar un registro de mortalidad
  const renderRegistro = ({ item }: { item: any }) => (
    <Card style={styles.registroCard}>
      <View style={styles.registroHeader}>
        <View style={styles.tipoIcono}>
          {obtenerIconoTipoLote(item.tipoLote)}
        </View>
        <View style={styles.registroInfo}>
          <Text style={styles.registroLote}>{obtenerNombreLote(item.loteId)}</Text>
          <Text style={styles.registroFecha}>
            {new Date(item.fecha).toLocaleDateString('es-ES', { 
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
        <View style={styles.registroCantidad}>
          <Text style={styles.cantidadValor}>{item.cantidad}</Text>
          <Text style={styles.cantidadLabel}>aves</Text>
        </View>
      </View>
      
      {item.causa && (
        <View style={styles.causaContainer}>
          <Text style={styles.causaLabel}>Causa:</Text>
          <Text style={styles.causaTexto}>{item.causa}</Text>
        </View>
      )}
    </Card>
  );
  
  return (
    <>
      <AppHeader
        title="Historial de Mortalidad"
        showDrawer={true}
        tintColor={colors.primary}
      />
      <View style={styles.container}>
        <View style={styles.filtrosContainer}>
          <Text style={styles.filtrosLabel}>Filtrar por tipo:</Text>
          <View style={styles.filtrosBotones}>
            <TouchableOpacity
              style={[
                styles.filtroBoton,
                filtroTipo === null && styles.filtroBotonActivo
              ]}
              onPress={() => setFiltroTipo(null)}
            >
              <Text style={[
                styles.filtroTexto,
                filtroTipo === null && styles.filtroTextoActivo
              ]}>Todos</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filtroBoton,
                filtroTipo === 'ponedoras' && styles.filtroBotonActivo
              ]}
              onPress={() => setFiltroTipo('ponedoras')}
            >
              <Ionicons name="egg" size={16} color={filtroTipo === 'ponedoras' ? colors.white : colors.ponedoras} />
              <Text style={[
                styles.filtroTexto,
                filtroTipo === 'ponedoras' && styles.filtroTextoActivo
              ]}>Ponedoras</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filtroBoton,
                filtroTipo === 'israelies' && styles.filtroBotonActivo
              ]}
              onPress={() => setFiltroTipo('israelies')}
            >
              <Ionicons name="nutrition" size={16} color={filtroTipo === 'israelies' ? colors.white : colors.success} />
              <Text style={[
                styles.filtroTexto,
                filtroTipo === 'israelies' && styles.filtroTextoActivo
              ]}>Israelíes</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filtroBoton,
                filtroTipo === 'engorde' && styles.filtroBotonActivo
              ]}
              onPress={() => setFiltroTipo('engorde')}
            >
              <Ionicons name="fast-food" size={16} color={filtroTipo === 'engorde' ? colors.white : colors.warning} />
              <Text style={[
                styles.filtroTexto,
                filtroTipo === 'engorde' && styles.filtroTextoActivo
              ]}>Engorde</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Cargando registros...</Text>
          </View>
        ) : registrosFiltrados.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={64} color={colors.textLight} />
            <Text style={styles.emptyTitle}>No hay registros</Text>
            <Text style={styles.emptyText}>
              {filtroTipo 
                ? `No se encontraron registros de mortalidad para ${filtroTipo}`
                : 'No se encontraron registros de mortalidad'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={registrosFiltrados}
            keyExtractor={item => item.id}
            renderItem={renderRegistro}
            contentContainerStyle={styles.listaContainer}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filtrosContainer: {
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  filtrosLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textDark,
    marginBottom: 8,
  },
  filtrosBotones: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filtroBoton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
  },
  filtroBotonActivo: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filtroTexto: {
    fontSize: 14,
    color: colors.textMedium,
    marginLeft: 4,
  },
  filtroTextoActivo: {
    color: colors.white,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textMedium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textMedium,
    textAlign: 'center',
  },
  listaContainer: {
    padding: 16,
  },
  registroCard: {
    marginBottom: 12,
    padding: 16,
  },
  registroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipoIcono: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.veryLightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  registroInfo: {
    flex: 1,
  },
  registroLote: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  registroFecha: {
    fontSize: 14,
    color: colors.textMedium,
  },
  registroCantidad: {
    alignItems: 'center',
  },
  cantidadValor: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.danger,
  },
  cantidadLabel: {
    fontSize: 12,
    color: colors.textMedium,
  },
  causaContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.veryLightGray,
  },
  causaLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textDark,
    marginBottom: 4,
  },
  causaTexto: {
    fontSize: 14,
    color: colors.textMedium,
  },
});
