/**
 * Pantalla de perfil del usuario
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../src/constants/colors';
import { getExpoPushToken, getUserPushToken, sendLocalPushNotification } from '../src/services/push-notifications.service';
import { useAuthStore } from '../src/stores/authStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isTestingPush, setIsTestingPush] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  // 🧪 FUNCIÓN PARA TESTEAR PUSH NOTIFICATIONS
  const handleTestPushNotification = async () => {
    try {
      setIsTestingPush(true);
      console.log('🧪 Iniciando test de push notification...');
      
      await sendLocalPushNotification(
        '🐔 Test de Bienestar Animal',
        'Si ves esta notificación, ¡el sistema funciona correctamente!',
        { 
          test: true,
          timestamp: new Date().toISOString()
        }
      );
      
      Alert.alert(
        '✅ Notificación Enviada',
        'Deberías ver una notificación en unos segundos. Si la app está en primer plano, aparecerá como banner. Si está en background, aparecerá en el área de notificaciones.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('❌ Error al enviar notificación de prueba:', error);
      Alert.alert(
        '❌ Error',
        'No se pudo enviar la notificación. Verifica los logs de consola.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsTestingPush(false);
    }
  };

  // 🔑 FUNCIÓN PARA VER TU TOKEN
  const handleShowToken = async () => {
    try {
      console.log('🔍 Buscando token...');
      
      // Intentar obtener token del dispositivo
      const deviceToken = await getExpoPushToken();
      
      // Intentar obtener token guardado en Firebase
      const firebaseToken = await getUserPushToken();
      
      if (deviceToken || firebaseToken) {
        Alert.alert(
          '🔑 Token de Push Notifications',
          `Token en dispositivo:\n${deviceToken || 'No disponible'}\n\nToken en Firebase:\n${firebaseToken || 'No guardado'}`,
          [
            { text: 'Copiar', onPress: () => console.log('Token:', deviceToken || firebaseToken) },
            { text: 'Cerrar' }
          ]
        );
      } else {
        Alert.alert(
          '⚠️ Sin Token',
          'No se pudo obtener el token. Asegúrate de:\n\n1. Estar en un dispositivo físico (no emulador)\n2. Haber aceptado los permisos de notificaciones\n3. Tener conexión a internet',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ Error al obtener token:', error);
      Alert.alert('❌ Error', 'No se pudo obtener el token', [{ text: 'OK' }]);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={100} color={colors.primary} />
          </View>
          <Text style={styles.userName}>{user?.displayName || 'Usuario'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Personal</Text>
          
          <View style={styles.infoItem}>
            <Ionicons name="person-outline" size={24} color={colors.primary} style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>Nombre</Text>
              <Text style={styles.infoValue}>{user?.displayName || 'No especificado'}</Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="mail-outline" size={24} color={colors.primary} style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="call-outline" size={24} color={colors.primary} style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>Teléfono</Text>
              <Text style={styles.infoValue}>{user?.phoneNumber || 'No especificado'}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.editButton}>
          <Text style={styles.editButtonText}>Editar Perfil</Text>
        </TouchableOpacity>

        {/* 🧪 SECCIÓN DE TESTING DE PUSH NOTIFICATIONS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧪 Testing - Push Notifications</Text>
          <Text style={styles.sectionDescription}>
            Prueba el sistema de notificaciones push del monitoreo de bienestar animal
          </Text>
          
          <TouchableOpacity 
            style={[styles.testButton, isTestingPush && styles.testButtonDisabled]} 
            onPress={handleTestPushNotification}
            disabled={isTestingPush}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.white} style={styles.testButtonIcon} />
            <Text style={styles.testButtonText}>
              {isTestingPush ? 'Enviando...' : '📱 Enviar Notificación de Prueba'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.testButtonSecondary} 
            onPress={handleShowToken}
          >
            <Ionicons name="key-outline" size={24} color={colors.primary} style={styles.testButtonIcon} />
            <Text style={styles.testButtonSecondaryText}>
              🔑 Ver Token de Push
            </Text>
          </TouchableOpacity>

          <View style={styles.testInfo}>
            <Ionicons name="information-circle-outline" size={20} color={colors.mediumGray} />
            <Text style={styles.testInfoText}>
              Estas notificaciones son locales (para testing). Las alertas reales de bienestar animal se envían automáticamente cuando se detectan problemas.
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={colors.white} style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
    backgroundColor: colors.white,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 16,
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: colors.white,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  userEmail: {
    fontSize: 16,
    color: colors.textMedium,
    marginTop: 4,
  },
  section: {
    backgroundColor: colors.white,
    marginTop: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  infoIcon: {
    marginRight: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textMedium,
  },
  infoValue: {
    fontSize: 16,
    color: colors.textDark,
    marginTop: 2,
  },
  editButton: {
    backgroundColor: colors.white,
    marginTop: 16,
    padding: 16,
    alignItems: 'center',
    borderRadius: 8,
  },
  editButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  // 🧪 Estilos para sección de testing de push notifications
  sectionDescription: {
    fontSize: 14,
    color: colors.mediumGray,
    marginTop: 8,
    marginBottom: 16,
    lineHeight: 20,
  },
  testButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  testButtonDisabled: {
    backgroundColor: colors.mediumGray,
    opacity: 0.6,
  },
  testButtonSecondary: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    marginBottom: 16,
  },
  testButtonIcon: {
    marginRight: 8,
  },
  testButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  testButtonSecondaryText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  testInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.lightGray,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  testInfoText: {
    flex: 1,
    fontSize: 13,
    color: colors.mediumGray,
    marginLeft: 8,
    lineHeight: 18,
  },
  logoutButton: {
    backgroundColor: colors.error,
    marginTop: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

































