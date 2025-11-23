/**
 * Menú de Acciones para Lotes
 * Menú profesional tipo bottom sheet con todas las acciones disponibles
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../../constants/colors';

export interface AccionLote {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: 'primary' | 'danger' | 'warning' | 'default';
  disabled?: boolean;
}

interface AccionesLoteMenuProps {
  visible: boolean;
  onClose: () => void;
  acciones: AccionLote[];
  titulo?: string;
}

export default function AccionesLoteMenu({
  visible,
  onClose,
  acciones,
  titulo = 'Acciones',
}: AccionesLoteMenuProps) {
  const getAccionStyle = (variant?: string) => {
    switch (variant) {
      case 'primary':
        return styles.accionPrimary;
      case 'danger':
        return styles.accionDanger;
      case 'warning':
        return styles.accionWarning;
      default:
        return styles.accionDefault;
    }
  };

  const getAccionIconColor = (variant?: string) => {
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'danger':
        return colors.danger;
      case 'warning':
        return colors.warning;
      default:
        return colors.textDark;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Ionicons name="ellipsis-horizontal" size={24} color={colors.primary} />
              <Text style={styles.title}>{titulo}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textMedium} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {acciones.map((accion) => (
              <TouchableOpacity
                key={accion.id}
                style={[
                  styles.accionItem,
                  getAccionStyle(accion.variant),
                  accion.disabled && styles.accionDisabled,
                ]}
                onPress={() => {
                  if (!accion.disabled) {
                    accion.onPress();
                    onClose();
                  }
                }}
                disabled={accion.disabled}
                activeOpacity={0.7}
              >
                <View style={styles.accionContent}>
                  <View
                    style={[
                      styles.accionIconContainer,
                      {
                        backgroundColor:
                          accion.variant === 'primary'
                            ? colors.primary + '15'
                            : accion.variant === 'danger'
                            ? colors.danger + '15'
                            : accion.variant === 'warning'
                            ? colors.warning + '15'
                            : colors.veryLightGray,
                      },
                    ]}
                  >
                    <Ionicons
                      name={accion.icon}
                      size={22}
                      color={
                        accion.disabled
                          ? colors.textLight
                          : getAccionIconColor(accion.variant)
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.accionLabel,
                      accion.disabled && styles.accionLabelDisabled,
                    ]}
                  >
                    {accion.label}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={accion.disabled ? colors.textLight : colors.textMedium}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textDark,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 16,
  },
  accionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
  },
  accionDefault: {
    backgroundColor: colors.background,
  },
  accionPrimary: {
    backgroundColor: colors.primary + '08',
    borderColor: colors.primary + '30',
  },
  accionDanger: {
    backgroundColor: colors.danger + '08',
    borderColor: colors.danger + '30',
  },
  accionWarning: {
    backgroundColor: colors.warning + '08',
    borderColor: colors.warning + '30',
  },
  accionDisabled: {
    opacity: 0.5,
  },
  accionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  accionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    flex: 1,
  },
  accionLabelDisabled: {
    color: colors.textLight,
  },
});





