/**
 * Pantalla de Perfil de Usuario
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../src/components/ui/Button';
import Card from '../../src/components/ui/Card';
import colors from '../../src/constants/colors';
import { useAuthStore } from '../../src/stores/authStore';

export default function PerfilScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Está seguro que desea cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          onPress: () => logout(),
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView 
        contentContainerStyle={styles.contentContainer}
        contentInsetAdjustmentBehavior="automatic"
      >
      <Card style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.displayName?.charAt(0) || 'U'}
              </Text>
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.displayName || 'Usuario'}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user?.role || 'OPERADOR'}</Text>
            </View>
          </View>
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Información de Cuenta</Text>
        
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={24} color={colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Correo Electrónico</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={24} color={colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Nombre</Text>
            <Text style={styles.infoValue}>{user?.displayName || 'No especificado'}</Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="shield-outline" size={24} color={colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Rol</Text>
            <Text style={styles.infoValue}>{user?.role || 'OPERADOR'}</Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={24} color={colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Fecha de Registro</Text>
            <Text style={styles.infoValue}>
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'No disponible'}
            </Text>
          </View>
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Acciones</Text>
        
        <Button
          title="Cambiar Contraseña"
          onPress={() => {}}
          variant="outline"
          style={styles.actionButton}
        />
        
        <Button
          title="Cerrar Sesión"
          onPress={handleLogout}
          variant="danger"
          style={styles.actionButton}
        />
      </Card>

      <View style={styles.appInfo}>
        <Image
          source={require('../../assets/images/icon.png')}
          style={styles.appLogo}
          resizeMode="contain"
        />
        <Text style={styles.appVersion}>Asoaves v1.0.0</Text>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 16,
  },
  profileCard: {
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: colors.textMedium,
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: colors.primary + '20',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  roleText: {
    color: colors.primary,
    fontWeight: '500',
    fontSize: 14,
  },
  sectionCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textMedium,
  },
  infoValue: {
    fontSize: 16,
    color: colors.textDark,
  },
  actionButton: {
    marginBottom: 12,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  appLogo: {
    width: 40,
    height: 40,
    marginBottom: 8,
  },
  appVersion: {
    fontSize: 14,
    color: colors.textLight,
  },
});


