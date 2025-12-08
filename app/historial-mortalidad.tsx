/**
 * Pantalla de historial de mortalidad
 */

import AppHeader from '../src/components/layouts/AppHeader';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Card from '../src/components/ui/Card';
import { colors } from '../src/constants/colors';
import { TipoAve } from '../src/types/enums';
import { useEngordeStore } from '../src/stores/engordeStore';
import { useLevantesStore } from '../src/stores/levantesStore';
import { useMortalityStore } from '../src/stores/mortalityStore';
import { usePonedorasStore } from '../src/stores/ponedorasStore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../src/components/config/firebase';

export default function HistorialMortalidadScreen() {
  const [filtroTipo, setFiltroTipo] = useState<TipoAve | null>(null);
  const [lotesMap, setLotesMap] = useState<Record<string, any>>({});
  const [usuariosMap, setUsuariosMap] = useState<Record<string, string>>({});
  
  const { 
    registros,
    registrosPorTipo, 
    loadRegistrosMortalidad, 
    getRegistrosPorTipo,
    isLoadingPorTipo,
    isLoading
  } = useMortalityStore();
  const ponedorasStore = usePonedorasStore();
  const engordeStore = useEngordeStore();
  const levantesStore = useLevantesStore();
  
  // Cargar y suscribirse a cambios en tiempo real para cada tipo
  useEffect(() => {
    console.log('🔄 Cargando y suscribiéndose a registros de mortalidad...');
    
    // Cargar datos iniciales
    const cargarDatosIniciales = async () => {
      try {
        console.log('📥 Cargando registros iniciales para todos los tipos...');
        await Promise.all([
          loadRegistrosMortalidad(undefined, TipoAve.PONEDORA),
          loadRegistrosMortalidad(undefined, TipoAve.POLLO_LEVANTE),
          loadRegistrosMortalidad(undefined, TipoAve.POLLO_ENGORDE)
        ]);
        console.log('✅ Registros iniciales cargados');
      } catch (error) {
        console.error('❌ Error al cargar registros iniciales:', error);
      }
    };
    
    cargarDatosIniciales();
    
    // Suscribirse a cambios en tiempo real
    console.log('🔔 Suscribiéndose a cambios en tiempo real...');
    const unsubscribePonedoras = useMortalityStore.getState().suscribirseAMortalidadPorTipo(TipoAve.PONEDORA);
    const unsubscribeLevantes = useMortalityStore.getState().suscribirseAMortalidadPorTipo(TipoAve.POLLO_LEVANTE);
    const unsubscribeEngorde = useMortalityStore.getState().suscribirseAMortalidadPorTipo(TipoAve.POLLO_ENGORDE);
    
    return () => {
      console.log('🔕 Desuscribiéndose de cambios en tiempo real...');
      unsubscribePonedoras();
      unsubscribeLevantes();
      unsubscribeEngorde();
    };
  }, []);
  
  // Combinar todos los registros de todos los tipos usando el estado reactivo
  const todosLosRegistros = useMemo(() => {
    const registrosPonedoras = registrosPorTipo[TipoAve.PONEDORA] || [];
    const registrosLevantes = registrosPorTipo[TipoAve.POLLO_LEVANTE] || [];
    const registrosEngorde = registrosPorTipo[TipoAve.POLLO_ENGORDE] || [];
    
    console.log('📊 Registros por tipo:', {
      ponedoras: registrosPonedoras.length,
      levantes: registrosLevantes.length,
      engorde: registrosEngorde.length,
      registrosPorTipo
    });
    
    const registrosCombinados = [
      ...registrosPonedoras,
      ...registrosLevantes,
      ...registrosEngorde
    ];
    
    console.log(`📊 Total de registros combinados: ${registrosCombinados.length}`);
    
    // Ordenar por fecha descendente
    const registrosOrdenados = registrosCombinados.sort((a, b) => {
      const fechaA = a.fecha instanceof Date ? a.fecha.getTime() : new Date(a.fecha).getTime();
      const fechaB = b.fecha instanceof Date ? b.fecha.getTime() : new Date(b.fecha).getTime();
      return fechaB - fechaA;
    });
    
    return registrosOrdenados;
  }, [registrosPorTipo]);
  
  // Estado de carga combinado
  const estaCargando = isLoadingPorTipo[TipoAve.PONEDORA] || 
                       isLoadingPorTipo[TipoAve.POLLO_LEVANTE] || 
                       isLoadingPorTipo[TipoAve.POLLO_ENGORDE] ||
                       isLoading;
  
  // Cargar información de lotes para mostrar nombres
  useEffect(() => {
    const cargarLotes = async () => {
      try {
        // Cargar lotes de ponedoras
        await ponedorasStore.cargarLotes();
        // Cargar lotes de engorde
        await engordeStore.cargarLotes();
        // Cargar lotes de levantes
        await levantesStore.cargarLotes();
        
        // Crear un mapa de todos los lotes para acceso rápido
        const todosLotes = {
          ...ponedorasStore.lotes.reduce((acc, lote) => ({ ...acc, [lote.id]: lote }), {}),
          ...engordeStore.lotes.reduce((acc, lote) => ({ ...acc, [lote.id]: lote }), {}),
          ...levantesStore.lotes.reduce((acc, lote) => ({ ...acc, [lote.id]: lote }), {})
        };
        
        setLotesMap(todosLotes);
      } catch (error) {
        console.error('Error al cargar lotes:', error);
      }
    };
    
    cargarLotes();
  }, []);
  
  // Cargar usuarios únicos de los registros de mortalidad
  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        // Obtener todos los UIDs únicos de los registros
        const userIds = new Set<string>();
        todosLosRegistros.forEach(registro => {
          if (registro.createdBy) {
            userIds.add(registro.createdBy);
          }
        });
        
        if (userIds.size === 0) {
          return;
        }
        
        console.log(`📥 Cargando información de ${userIds.size} usuarios únicos...`);
        
        // Cargar información de cada usuario
        const usuariosMapa: Record<string, string> = {};
        const promesas = Array.from(userIds).map(async (uid) => {
          try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              usuariosMapa[uid] = userData.displayName || userData.email || 'Usuario desconocido';
            } else {
              usuariosMapa[uid] = 'Usuario desconocido';
            }
          } catch (error) {
            console.error(`Error al cargar usuario ${uid}:`, error);
            usuariosMapa[uid] = 'Usuario desconocido';
          }
        });
        
        await Promise.all(promesas);
        setUsuariosMap(usuariosMapa);
        console.log(`✅ Información de usuarios cargada`);
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
      }
    };
    
    if (todosLosRegistros.length > 0) {
      cargarUsuarios();
    }
  }, [todosLosRegistros]);
  
  // Obtener el nombre del lote a partir del ID
  const obtenerNombreLote = (loteId: string): string => {
    return lotesMap[loteId]?.nombre || loteId;
  };
  
  // Obtener el nombre del usuario a partir del UID
  const obtenerNombreUsuario = (userId: string): string => {
    return usuariosMap[userId] || userId || 'Usuario desconocido';
  };
  
  // Obtener el icono según el tipo de lote
  const obtenerIconoTipoLote = (tipoLote: TipoAve | string) => {
    // Manejar tanto enum como strings antiguos
    const tipo = tipoLote as TipoAve;
    
    switch (tipo) {
      case TipoAve.PONEDORA:
        return <Ionicons name="egg" size={20} color={colors.ponedoras} />;
      case TipoAve.POLLO_LEVANTE:
        return <Ionicons name="nutrition" size={20} color={colors.secondary} />;
      case TipoAve.POLLO_ENGORDE:
        return <Ionicons name="fast-food" size={20} color={colors.engorde} />;
      default:
        // Compatibilidad con datos antiguos
        if (tipoLote === 'ponedoras' || tipoLote === 'PONEDORA') {
          return <Ionicons name="egg" size={20} color={colors.ponedoras} />;
        }
        if (tipoLote === 'levantes' || tipoLote === 'israelies' || tipoLote === 'POLLO_LEVANTE') {
          return <Ionicons name="nutrition" size={20} color={colors.secondary} />;
        }
        if (tipoLote === 'engorde' || tipoLote === 'POLLO_ENGORDE') {
          return <Ionicons name="fast-food" size={20} color={colors.engorde} />;
        }
        return <Ionicons name="help-circle" size={20} color={colors.textMedium} />;
    }
  };
  
  // Filtrar registros por tipo
  const registrosFiltrados = filtroTipo
    ? todosLosRegistros.filter(registro => {
        // Comparar usando el enum TipoAve
        return registro.tipoLote === filtroTipo;
      })
    : todosLosRegistros;
  
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
          {item.createdBy && (
            <View style={styles.usuarioContainer}>
              <Ionicons name="person-outline" size={14} color={colors.textMedium} />
              <Text style={styles.registroUsuario}>
                Registrado por: {obtenerNombreUsuario(item.createdBy)}
              </Text>
            </View>
          )}
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
                filtroTipo === TipoAve.PONEDORA && styles.filtroBotonActivo
              ]}
              onPress={() => setFiltroTipo(TipoAve.PONEDORA)}
            >
              <Ionicons name="egg" size={16} color={filtroTipo === TipoAve.PONEDORA ? colors.white : colors.ponedoras} />
              <Text style={[
                styles.filtroTexto,
                filtroTipo === TipoAve.PONEDORA && styles.filtroTextoActivo
              ]}>Ponedoras</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filtroBoton,
                filtroTipo === TipoAve.POLLO_LEVANTE && styles.filtroBotonActivo
              ]}
              onPress={() => setFiltroTipo(TipoAve.POLLO_LEVANTE)}
            >
              <Ionicons name="nutrition" size={16} color={filtroTipo === TipoAve.POLLO_LEVANTE ? colors.white : colors.secondary} />
              <Text style={[
                styles.filtroTexto,
                filtroTipo === TipoAve.POLLO_LEVANTE && styles.filtroTextoActivo
              ]}>Levantes</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filtroBoton,
                filtroTipo === TipoAve.POLLO_ENGORDE && styles.filtroBotonActivo
              ]}
              onPress={() => setFiltroTipo(TipoAve.POLLO_ENGORDE)}
            >
              <Ionicons name="fast-food" size={16} color={filtroTipo === TipoAve.POLLO_ENGORDE ? colors.white : colors.engorde} />
              <Text style={[
                styles.filtroTexto,
                filtroTipo === TipoAve.POLLO_ENGORDE && styles.filtroTextoActivo
              ]}>Engorde</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {estaCargando ? (
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
                ? `No se encontraron registros de mortalidad para ${filtroTipo === TipoAve.PONEDORA ? 'ponedoras' : filtroTipo === TipoAve.POLLO_LEVANTE ? 'levantes' : 'engorde'}`
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
  usuarioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  registroUsuario: {
    fontSize: 12,
    color: colors.textMedium,
    marginLeft: 4,
    fontStyle: 'italic',
  },
});
