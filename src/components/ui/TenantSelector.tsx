/**
 * TenantSelector - Selector de organización para multi-tenant
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useOrganization } from '../../hooks/useOrganization';
import { Organization } from '../../types/organization';
import { Button } from './Button';
import { Card } from './Card';

interface TenantSelectorProps {
  showCreateButton?: boolean;
  onCreateOrganization?: () => void;
}

export const TenantSelector: React.FC<TenantSelectorProps> = ({
  showCreateButton = true,
  onCreateOrganization,
}) => {
  const {
    organizations,
    currentOrganization,
    isLoading,
    switchOrganization,
  } = useOrganization();
  
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleSwitchOrganization = async (org: Organization) => {
    try {
      await switchOrganization(org.id);
      setIsModalVisible(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo cambiar de organización');
    }
  };

  const renderOrganizationItem = ({ item }: { item: Organization }) => (
    <TouchableOpacity
      style={[
        styles.organizationItem,
        currentOrganization?.id === item.id && styles.selectedItem
      ]}
      onPress={() => handleSwitchOrganization(item)}
    >
      <View style={styles.itemContent}>
        <View style={styles.itemInfo}>
          <Text style={styles.organizationName}>{item.displayName}</Text>
          <Text style={styles.organizationDescription}>
            {item.description || item.name}
          </Text>
          <Text style={styles.planBadge}>
            Plan {item.subscription.plan.toUpperCase()}
          </Text>
        </View>
        {currentOrganization?.id === item.id && (
          <Ionicons name="checkmark-circle" size={24} color={colors.success} />
        )}
      </View>
    </TouchableOpacity>
  );

  if (!currentOrganization && organizations.length === 0) {
    return (
      <Card style={styles.emptyCard}>
        <View style={styles.emptyContent}>
          <Ionicons name="business-outline" size={48} color={colors.lightGray} />
          <Text style={styles.emptyTitle}>Sin organizaciones</Text>
          <Text style={styles.emptyDescription}>
            Crea tu primera organización para comenzar
          </Text>
          {showCreateButton && (
            <Button
              title="Crear Organización"
              onPress={onCreateOrganization || (() => {})}
              style={styles.createButton}
            />
          )}
        </View>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.selectorButton}
        onPress={() => setIsModalVisible(true)}
        disabled={isLoading}
      >
        <View style={styles.currentOrgInfo}>
          <View style={styles.orgIconContainer}>
            <Ionicons name="business" size={20} color={colors.primary} />
          </View>
          <View style={styles.orgDetails}>
            <Text style={styles.orgName}>
              {currentOrganization?.displayName || 'Seleccionar organización'}
            </Text>
            <Text style={styles.orgPlan}>
              {currentOrganization?.subscription.plan.toUpperCase() || 'Sin plan'}
            </Text>
          </View>
        </View>
        <Ionicons 
          name="chevron-down" 
          size={20} 
          color={colors.gray}
        />
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Organización</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={colors.gray} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={organizations}
              keyExtractor={(item) => item.id}
              renderItem={renderOrganizationItem}
              style={styles.organizationList}
              showsVerticalScrollIndicator={false}
            />

            {showCreateButton && (
              <View style={styles.modalFooter}>
                <Button
                  title="Nueva Organización"
                  variant="outline"
                  onPress={() => {
                    setIsModalVisible(false);
                    onCreateOrganization?.();
                  }}
                  fullWidth
                />
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  currentOrgInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orgIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.lightBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  orgDetails: {
    flex: 1,
  },
  orgName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: 2,
  },
  orgPlan: {
    fontSize: 12,
    color: colors.gray,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  emptyCard: {
    margin: 16,
  },
  emptyContent: {
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.dark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    minWidth: 200,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.dark,
  },
  closeButton: {
    padding: 4,
  },
  organizationList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  organizationItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  selectedItem: {
    backgroundColor: colors.lightBlue,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderBottomColor: 'transparent',
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  organizationName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: 4,
  },
  organizationDescription: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 4,
  },
  planBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
});



