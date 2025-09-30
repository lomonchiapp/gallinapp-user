/**
 * Pantalla del Dashboard Comparativo para Ponedoras
 */

import { Ionicons } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import React, { useLayoutEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ComparativeDashboard from '../../../src/components/ui/ComparativeDashboard';
import { colors } from '../../../src/constants/colors';
import { TipoAve } from '../../../src/types';

export default function DashboardComparativoPonedoras() {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Dashboard Comparativo',
      headerStyle: {
        backgroundColor: colors.primary,
      },
      headerTintColor: colors.white,
      headerTitleStyle: {
        fontWeight: 'bold',
      },
      headerLeft: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            // TODO: Implementar exportación de dashboard
            console.log('Exportar dashboard');
          }}
        >
          <Ionicons name="download" size={24} color={colors.white} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const handleLotePress = (loteId: string) => {
    router.push({
      pathname: '/(tabs)/ponedoras/detalles/[id]',
      params: { id: loteId }
    });
  };

  return (
    <View style={styles.container}>
      {/* Botón de atrás visible */}
      <View style={styles.backButtonContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
          <Text style={styles.backButtonText}>Volver a Lotes</Text>
        </TouchableOpacity>
      </View>
      
      <ComparativeDashboard
        tipoAve={TipoAve.PONEDORA}
        onLotePress={handleLotePress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerButton: {
    padding: 8,
    marginHorizontal: 8,
  },
  backButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.primary + '10',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
});
