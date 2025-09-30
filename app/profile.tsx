/**
 * Pantalla de perfil del usuario
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../src/constants/colors';
import { useAuthStore } from '../src/stores/authStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
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





















