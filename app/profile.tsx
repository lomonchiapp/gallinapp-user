/**
 * Pantalla de perfil del usuario - Redirige a la versión unificada en settings
 */

import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../components/theme-provider';

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  useEffect(() => {
    // Redirigir a la versión unificada en settings
    router.replace('/(tabs)/settings/profile');
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <ActivityIndicator size="large" color={colors.primary[500]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

































