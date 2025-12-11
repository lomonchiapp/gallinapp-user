/**
 * Pantalla de Perfil de Usuario
 */

import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../components/theme-provider';
import AppHeader from '../../src/components/layouts/AppHeader';
import { ScreenWrapper } from '../../src/components/navigation/ScreenWrapper';
import Button from '../../src/components/ui/Button';
import Card from '../../src/components/ui/Card';
import { useAuthStore } from '../../src/stores/authStore';
import { useMultiTenantAuthStore } from '../../src/stores/multiTenantAuthStore';

export default function PerfilScreen() {
  const { user, logout } = useAuthStore();
  const { user: multiTenantUser } = useMultiTenantAuthStore();
  const theme = useTheme();
  const { colors, isDark } = theme || { colors: undefined, isDark: false };
  
  // Si no hay colors, no renderizar
  if (!colors) {
    return null;
  }
  
  const displayUser = multiTenantUser || user;

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
    <ScreenWrapper transitionType="fade">
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <AppHeader
          variant="fixed"
          enableBlur={false}
          showFarmSwitcher={false}
          showThemeToggle={true}
          title1="Mi Perfil"
          title2={displayUser?.displayName || 'Usuario'}
        />
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          contentInsetAdjustmentBehavior="automatic"
        >
      <Card style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: colors.primary[500] }]}>
              <Text style={[styles.avatarText, { color: colors.text.inverse }]}>
                {displayUser?.displayName?.charAt(0) || 'U'}
              </Text>
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text.primary }]}>
              {displayUser?.displayName || 'Usuario'}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.text.secondary }]}>
              {displayUser?.email}
            </Text>
            <View style={[styles.roleBadge, { backgroundColor: colors.primary[100] }]}>
              <Text style={[styles.roleText, { color: colors.primary[500] }]}>
                {user?.role || 'OPERADOR'}
              </Text>
            </View>
          </View>
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Información de Cuenta
        </Text>
        
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={24} color={colors.primary[500]} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: colors.text.secondary }]}>
              Correo Electrónico
            </Text>
            <Text style={[styles.infoValue, { color: colors.text.primary }]}>
              {displayUser?.email}
            </Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={24} color={colors.primary[500]} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: colors.text.secondary }]}>
              Nombre
            </Text>
            <Text style={[styles.infoValue, { color: colors.text.primary }]}>
              {displayUser?.displayName || 'No especificado'}
            </Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="shield-outline" size={24} color={colors.primary[500]} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: colors.text.secondary }]}>
              Rol
            </Text>
            <Text style={[styles.infoValue, { color: colors.text.primary }]}>
              {user?.role || 'OPERADOR'}
            </Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={24} color={colors.primary[500]} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: colors.text.secondary }]}>
              Fecha de Registro
            </Text>
            <Text style={[styles.infoValue, { color: colors.text.primary }]}>
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'No disponible'}
            </Text>
          </View>
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Acciones
        </Text>
        
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
        <Text style={[styles.appVersion, { color: colors.text.secondary }]}>
          Asoaves v1.0.0
        </Text>
      </View>
      </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 16,
    paddingBottom: 32,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    marginBottom: 8,
  },
  roleBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontWeight: '500',
    fontSize: 14,
  },
  sectionCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
  },
  infoValue: {
    fontSize: 16,
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
  },
});


