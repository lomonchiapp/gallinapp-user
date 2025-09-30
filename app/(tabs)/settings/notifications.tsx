/**
 * Pantalla de gestión de notificaciones
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Button from '../../../src/components/ui/Button';
import Card from '../../../src/components/ui/Card';
import { colors } from '../../../src/constants/colors';
import { useNotificationsStore } from '../../../src/stores/notificationsStore';
import {
    Notification,
    NotificationCategory,
    NotificationPriority,
    NotificationStatus,
} from '../../../src/types/notification';

// Componente para una notificación individual
const NotificationItem = ({ 
  notification, 
  onPress, 
  onMarkAsRead, 
  onArchive, 
  onDelete 
}: {
  notification: Notification;
  onPress: () => void;
  onMarkAsRead: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) => {
  const isUnread = notification.status === NotificationStatus.UNREAD;
  const isArchived = notification.status === NotificationStatus.ARCHIVED;
  
  const getPriorityColor = () => {
    switch (notification.priority) {
      case NotificationPriority.CRITICAL:
        return colors.danger;
      case NotificationPriority.HIGH:
        return colors.warning;
      case NotificationPriority.MEDIUM:
        return colors.primary;
      case NotificationPriority.LOW:
        return colors.textMedium;
      default:
        return colors.textMedium;
    }
  };
  
  const getCategoryIcon = () => {
    switch (notification.category) {
      case NotificationCategory.PRODUCTION:
        return 'analytics';
      case NotificationCategory.FINANCIAL:
        return 'cash';
      case NotificationCategory.SYSTEM:
        return 'settings';
      case NotificationCategory.REMINDER:
        return 'time';
      case NotificationCategory.EVENT:
        return 'calendar';
      default:
        return 'notifications';
    }
  };
  
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `hace ${diffInMinutes} min`;
    } else if (diffInHours < 24) {
      return `hace ${Math.floor(diffInHours)} h`;
    } else {
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      });
    }
  };
  
  return (
    <TouchableOpacity 
      style={[
        styles.notificationItem,
        isUnread && styles.unreadNotification,
        isArchived && styles.archivedNotification,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <View style={styles.notificationIconContainer}>
            <Ionicons 
              name={notification.icon as any || getCategoryIcon() as any} 
              size={20} 
              color={getPriorityColor()} 
            />
            {isUnread && <View style={styles.unreadDot} />}
          </View>
          
          <View style={styles.notificationInfo}>
            <Text style={[styles.notificationTitle, isUnread && styles.unreadText]}>
              {notification.title}
            </Text>
            <Text style={styles.notificationTime}>
              {formatDate(notification.createdAt)}
            </Text>
          </View>
          
          <View style={styles.notificationActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                onMarkAsRead();
              }}
            >
              <Ionicons 
                name={isUnread ? "mail-open" : "checkmark-circle"} 
                size={18} 
                color={colors.primary} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                onArchive();
              }}
            >
              <Ionicons 
                name="archive" 
                size={18} 
                color={colors.textMedium} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Ionicons 
                name="trash" 
                size={18} 
                color={colors.danger} 
              />
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={[styles.notificationMessage, isArchived && styles.archivedText]}>
          {notification.message}
        </Text>
        
        {notification.data?.loteId && (
          <View style={styles.notificationMeta}>
            <Ionicons name="layers" size={14} color={colors.textLight} />
            <Text style={styles.notificationMetaText}>
              Lote: {notification.data.loteName || notification.data.loteId}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Componente principal
export default function NotificationsScreen() {
  const {
    notifications,
    stats,
    isLoading,
    error,
    loadNotifications,
    loadStats,
    markNotificationAsRead,
    markAllAsRead,
    archiveNotificationById,
    deleteNotificationById,
    startRealtimeUpdates,
    stopRealtimeUpdates,
    getUnreadCount,
    clearError,
  } = useNotificationsStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'archived'>('all');
  
  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
    startRealtimeUpdates();
    
    return () => {
      stopRealtimeUpdates();
    };
  }, []);
  
  const loadInitialData = async () => {
    try {
      await Promise.all([
        loadNotifications(),
        loadStats(),
      ]);
    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
    }
  };
  
  // Refrescar datos
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadInitialData();
    } finally {
      setRefreshing(false);
    }
  }, []);
  
  // Filtrar notificaciones
  const filteredNotifications = notifications.filter(notification => {
    switch (selectedFilter) {
      case 'unread':
        return notification.status === NotificationStatus.UNREAD;
      case 'archived':
        return notification.status === NotificationStatus.ARCHIVED;
      default:
        return true;
    }
  });
  
  // Manejar clic en notificación
  const handleNotificationPress = async (notification: Notification) => {
    // Marcar como leída si no está leída
    if (notification.status === NotificationStatus.UNREAD) {
      await markNotificationAsRead(notification.id);
    }
    
    // Manejar acciones específicas basadas en el tipo
    if (notification.data?.loteId) {
      // TODO: Navegar a la página del lote
      Alert.alert(
        'Navegar al Lote',
        `¿Deseas ir al lote ${notification.data.loteName || notification.data.loteId}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Ir al Lote', 
            onPress: () => {
              // TODO: Implementar navegación
              console.log('Navegar al lote:', notification.data?.loteId);
            }
          }
        ]
      );
    }
  };
  
  // Manejar eliminación con confirmación
  const handleDelete = (notification: Notification) => {
    Alert.alert(
      'Eliminar Notificación',
      '¿Estás seguro de que deseas eliminar esta notificación?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => deleteNotificationById(notification.id)
        }
      ]
    );
  };
  
  // Renderizar filtros
  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <TouchableOpacity
        style={[styles.filterButton, selectedFilter === 'all' && styles.activeFilter]}
        onPress={() => setSelectedFilter('all')}
      >
        <Text style={[styles.filterText, selectedFilter === 'all' && styles.activeFilterText]}>
          Todas ({notifications.length})
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.filterButton, selectedFilter === 'unread' && styles.activeFilter]}
        onPress={() => setSelectedFilter('unread')}
      >
        <Text style={[styles.filterText, selectedFilter === 'unread' && styles.activeFilterText]}>
          No leídas ({getUnreadCount()})
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.filterButton, selectedFilter === 'archived' && styles.activeFilter]}
        onPress={() => setSelectedFilter('archived')}
      >
        <Text style={[styles.filterText, selectedFilter === 'archived' && styles.activeFilterText]}>
          Archivadas ({stats?.byStatus.ARCHIVED || 0})
        </Text>
      </TouchableOpacity>
    </View>
  );
  
  // Renderizar estadísticas
  const renderStats = () => (
    <Card style={styles.statsCard}>
      <View style={styles.statsHeader}>
        <Ionicons name="analytics" size={24} color={colors.primary} />
        <Text style={styles.statsTitle}>Resumen de Notificaciones</Text>
      </View>
      
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats?.total || 0}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.warning }]}>
            {stats?.unread || 0}
          </Text>
          <Text style={styles.statLabel}>No leídas</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.danger }]}>
            {stats?.byPriority.HIGH || 0}
          </Text>
          <Text style={styles.statLabel}>Alta prioridad</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.success }]}>
            {stats?.byCategory.PRODUCTION || 0}
          </Text>
          <Text style={styles.statLabel}>Producción</Text>
        </View>
      </View>
    </Card>
  );
  
  // Renderizar notificación vacía
  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-off" size={64} color={colors.lightGray} />
      <Text style={styles.emptyStateTitle}>
        {selectedFilter === 'unread' ? 'No hay notificaciones sin leer' :
         selectedFilter === 'archived' ? 'No hay notificaciones archivadas' :
         'No hay notificaciones'}
      </Text>
      <Text style={styles.emptyStateText}>
        {selectedFilter === 'all' ? 
         'Las notificaciones aparecerán aquí cuando ocurran eventos importantes.' :
         'Cambia el filtro para ver otras notificaciones.'}
      </Text>
    </View>
  );
  
  return (
    <View style={styles.container}>
      {/* Header con acciones */}
      <View style={styles.header}>
        <Text style={styles.title}>Notificaciones</Text>
        <View style={styles.headerActions}>
          {getUnreadCount() > 0 && (
            <Button
              title="Marcar todas como leídas"
              variant="outline"
              size="small"
              onPress={markAllAsRead}
              style={styles.markAllButton}
            />
          )}
        </View>
      </View>
      
      {/* Error */}
      {error && (
        <Card style={styles.errorCard}>
          <View style={styles.errorContent}>
            <Ionicons name="alert-circle" size={24} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={clearError} style={styles.closeErrorButton}>
              <Ionicons name="close" size={20} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </Card>
      )}
      
      {/* Estadísticas */}
      {stats && renderStats()}
      
      {/* Filtros */}
      {renderFilters()}
      
      {/* Lista de notificaciones */}
      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            onPress={() => handleNotificationPress(item)}
            onMarkAsRead={() => markNotificationAsRead(item.id)}
            onArchive={() => archiveNotificationById(item.id)}
            onDelete={() => handleDelete(item)}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markAllButton: {
    minWidth: 100,
  },
  
  // Error
  errorCard: {
    backgroundColor: colors.danger + '10',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  errorText: {
    flex: 1,
    marginLeft: 12,
    color: colors.danger,
    fontSize: 14,
  },
  closeErrorButton: {
    padding: 4,
  },
  
  // Stats
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsTitle: {
    marginLeft: 12,
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMedium,
  },
  
  // Filters
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
    alignItems: 'center',
  },
  activeFilter: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: colors.textDark,
    fontWeight: '500',
  },
  activeFilterText: {
    color: colors.white,
  },
  
  // List
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  
  // Notification Item
  notificationItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  archivedNotification: {
    opacity: 0.6,
  },
  notificationContent: {
    padding: 16,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationIconContainer: {
    position: 'relative',
    marginRight: 12,
    marginTop: 2,
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 2,
  },
  unreadText: {
    fontWeight: 'bold',
  },
  notificationTime: {
    fontSize: 12,
    color: colors.textLight,
  },
  notificationActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: colors.textMedium,
    lineHeight: 20,
    marginBottom: 8,
  },
  archivedText: {
    fontStyle: 'italic',
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationMetaText: {
    marginLeft: 4,
    fontSize: 12,
    color: colors.textLight,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textMedium,
    textAlign: 'center',
    lineHeight: 20,
  },
});










