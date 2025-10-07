/**
 * Componente de header unificado para la aplicación
 */

import { Ionicons } from '@expo/vector-icons';
import { DrawerToggleButton } from '@react-navigation/drawer';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../constants/colors';
import { useNotifications } from '../../hooks/useNotifications';
import { AlertSummary, getAlertSummaryFromStore } from '../../services/tracking-optimized.service';
import { useAuthStore } from '../../stores/authStore';
import { useEngordeStore } from '../../stores/engordeStore';
import { useHuevosStore } from '../../stores/huevosStore';
import { useLevantesStore } from '../../stores/levantesStore';
import { usePesoStore } from '../../stores/pesoStore';
import { usePonedorasStore } from '../../stores/ponedorasStore';
import { NotificationIconBadge } from '../ui/NotificationBadge';

interface AppHeaderProps {
  title?: string;
  showDrawer?: boolean;
  showBack?: boolean;
  showProfile?: boolean;
  showLogo?: boolean;
  showNotifications?: boolean;
  tintColor?: string;
  onBackPress?: () => void;
  rightContent?: React.ReactNode;
  primaryAction?: HeaderAction;
  secondaryAction?: HeaderAction;
}

interface HeaderAction {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  tintColor?: string;
}

export default function AppHeader({
  title,
  showDrawer = false,
  showBack = false,
  showProfile = true,
  showLogo = false,
  showNotifications = true,
  tintColor = colors.primary,
  onBackPress,
  rightContent,
  primaryAction,
  secondaryAction
}: AppHeaderProps) {
  // Verificar autenticación
  const { isAuthenticated, isLoading } = useAuthStore();
  
  // Solo usar hooks de notificaciones y stores si está autenticado
  const notificationsHook = useNotifications();
  const ponedorasStore = usePonedorasStore();
  const levantesStore = useLevantesStore();
  const engordeStore = useEngordeStore();
  const pesoStore = usePesoStore();
  const huevosStore = useHuevosStore();
  
  // Solo usar los datos si está autenticado
  const unreadCount = isAuthenticated ? notificationsHook.unreadCount : 0;
  const ponedorasLotes = isAuthenticated ? ponedorasStore.lotes : [];
  const levantesLotes = isAuthenticated ? levantesStore.lotes : [];
  const engordeLotes = isAuthenticated ? engordeStore.lotes : [];
  const registrosPeso = isAuthenticated ? pesoStore.registrosPeso : [];
  const registrosHuevos = isAuthenticated ? huevosStore.registrosHuevos : [];
  
  const [alertSummary, setAlertSummary] = useState<AlertSummary>({
    totalAlertas: 0,
    emergencias: 0,
    advertencias: 0,
    pesajeEmergencias: 0,
    pesajeAdvertencias: 0,
    recoleccionEmergencias: 0,
    recoleccionAdvertencias: 0,
  });

  // Cargar resumen de alertas solo si está autenticado
  useEffect(() => {
    if (!isAuthenticated || isLoading) {
      return;
    }

    const loadAlertSummary = () => {
      try {
        console.log('🔔 AppHeader: Calculando resumen de alertas desde stores');
        console.log('🔔 Lotes:', { ponedoras: ponedorasLotes.length, levantes: levantesLotes.length, engorde: engordeLotes.length });
        console.log('🔔 Registros:', { peso: registrosPeso.length, huevos: registrosHuevos.length });
        
        const summary = getAlertSummaryFromStore(
          ponedorasLotes, 
          levantesLotes, 
          engordeLotes, 
          registrosPeso, 
          registrosHuevos
        );
        setAlertSummary(summary);
        console.log('🔔 AppHeader: Resumen calculado:', summary);
      } catch (error) {
        console.error('Error al cargar resumen de alertas:', error);
        // En caso de error, mantener valores por defecto
        setAlertSummary({
          totalAlertas: 0,
          emergencias: 0,
          advertencias: 0,
          pesajeEmergencias: 0,
          pesajeAdvertencias: 0,
          recoleccionEmergencias: 0,
          recoleccionAdvertencias: 0,
        });
      }
    };

    // Solo calcular si hay datos disponibles
    if (ponedorasLotes.length > 0 || levantesLotes.length > 0 || engordeLotes.length > 0 || 
        registrosPeso.length > 0 || registrosHuevos.length > 0) {
      loadAlertSummary();
    }
  }, [isAuthenticated, isLoading, ponedorasLotes, levantesLotes, engordeLotes, registrosPeso, registrosHuevos]);

  // Solo mostrar notificaciones reales de Firebase, no las alertas de tracking
  const totalNotifications = isAuthenticated ? unreadCount : 0;
  return (
    <View style={styles.header}>
      {/* Botón izquierdo (drawer o back) */}
      {showDrawer && (
        <DrawerToggleButton tintColor={tintColor} />
      )}
      
      {showBack && (
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={onBackPress || (() => router.back())}
        >
          <Ionicons name="arrow-back" size={24} color={tintColor} />
        </TouchableOpacity>
      )}
      
      {/* Título o logo */}
      <View style={styles.titleContainer}>
        {showLogo ? (
          <Image
            source={require('../../../assets/images/full-logo.png')}
            style={styles.logo}
          />
        ) : (
          <Text style={[styles.title, { color: tintColor }]}>{title}</Text>
        )}
      </View>
      
      {/* Botón derecho (notificaciones, perfil o contenido personalizado) */}
      <View style={styles.rightContainer}>
        {rightContent ? (
          rightContent
        ) : (
          <View style={styles.rightButtons}>
            {secondaryAction && renderActionButton(secondaryAction, tintColor, 'secondary')}
            {primaryAction && renderActionButton(primaryAction, tintColor, 'primary')}
            {showNotifications && (
              <TouchableOpacity 
                style={styles.notificationButton}
                onPress={() => router.push('/notifications')}
              >
                <NotificationIconBadge 
                  count={totalNotifications}
                  color={colors.danger}
                >
                  <Ionicons 
                    name={totalNotifications > 0 ? "notifications" : "notifications-outline"} 
                    size={24} 
                    color={tintColor} 
                  />
                </NotificationIconBadge>
              </TouchableOpacity>
            )}
            
            {showProfile && (
              <TouchableOpacity 
                style={styles.profileButton}
                onPress={() => router.push('/profile')}
              >
                <Ionicons name="person-circle" size={28} color={tintColor} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const renderActionButton = (
  action: HeaderAction,
  fallbackTint: string,
  variant: 'primary' | 'secondary'
) => {
  const backgroundColor = variant === 'primary'
    ? action.tintColor || fallbackTint
    : 'transparent';
  const borderColor = variant === 'secondary' ? action.tintColor || fallbackTint : 'transparent';
  const textColor = variant === 'primary' ? colors.white : action.tintColor || fallbackTint;

  return (
    <TouchableOpacity
      key={action.label}
      style={[
        styles.actionButton,
        {
          backgroundColor,
          borderColor,
          borderWidth: variant === 'secondary' ? 1 : 0,
        },
        action.disabled ? styles.actionButtonDisabled : null,
      ]}
      onPress={action.onPress}
      disabled={action.loading || action.disabled}
      activeOpacity={0.85}
    >
      {action.loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <>
          {action.icon && (
            <Ionicons
              name={action.icon}
              size={16}
              color={textColor}
              style={styles.actionIcon}
            />
          )}
          <Text style={[styles.actionButtonText, { color: textColor }]}>{action.label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 96,
    paddingTop: Platform.OS === 'ios' ? 40 : 0,
    paddingHorizontal: 8,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  backButton: {
    padding: 8,
    marginLeft: 8,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  logo: {
    width: 120,
    height: 40,
    resizeMode: 'contain',
  },
  rightContainer: {
    minWidth: 44,
    alignItems: 'flex-end',
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionIcon: {
    marginRight: 2,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  notificationButton: {
    padding: 8,
  },
  profileButton: {
    padding: 8,
  },
});
