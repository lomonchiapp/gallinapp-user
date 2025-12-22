/**
 * Modal para unirse a una granja usando farmCode
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useTheme } from '../../../components/theme-provider';
import { borderRadius, shadows, spacing, typography } from '../../constants/designSystem';
import { createAccessRequest, validateFarmCode } from '../../services/farm.service';
import { useAccountStore } from '../../stores/accountStore';
import { useFarmStore } from '../../stores/farmStore';
import { FarmRole } from '../../types/account';
import { Farm } from '../../types/farm';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface JoinFarmModalProps {
  isVisible: boolean;
  onClose: () => void;
  onRequestSent: () => void;
}

export const JoinFarmModal: React.FC<JoinFarmModalProps> = ({
  isVisible,
  onClose,
  onRequestSent,
}) => {
  const { isDark, colors } = useTheme();
  const { account } = useAccountStore();
  const { isProcessingRequest } = useFarmStore();
  
  const [farmCode, setFarmCode] = useState('');
  const [selectedRole, setSelectedRole] = useState<FarmRole>(FarmRole.VIEWER);
  const [message, setMessage] = useState('');
  const [step, setStep] = useState<'code' | 'confirm' | 'success'>('code');
  const [validatedFarm, setValidatedFarm] = useState<Partial<Farm> | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Configuración de roles disponibles para solicitar
  const availableRoles = [
    {
      key: FarmRole.VIEWER,
      label: 'Visualizador',
      description: 'Solo ver datos, sin editar',
      icon: 'eye-outline',
    },
    {
      key: FarmRole.MANAGER,
      label: 'Gerente',
      description: 'Gestionar lotes y operaciones',
      icon: 'people-outline',
    },
    {
      key: FarmRole.ADMIN,
      label: 'Administrador',
      description: 'Gestión completa (requiere aprobación especial)',
      icon: 'shield-checkmark-outline',
    },
  ];

  const handleValidateCode = async () => {
    if (!farmCode.trim()) {
      Alert.alert('Error', 'Por favor ingresa un código de granja');
      return;
    }

    setIsValidating(true);
    try {
      const validation = await validateFarmCode(farmCode.trim().toUpperCase());
      
      if (validation.valid && validation.farm) {
        setValidatedFarm(validation.farm);
        setStep('confirm');
      } else {
        Alert.alert(
          'Código no válido', 
          'El código de granja ingresado no existe o no es válido. Verifica con el propietario de la granja.'
        );
      }
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo validar el código de granja');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSendRequest = async () => {
    if (!account || !validatedFarm?.id) {
      Alert.alert('Error', 'Información incompleta');
      return;
    }

    try {
      await createAccessRequest(
        farmCode.trim().toUpperCase(),
        account.uid,
        account.email,
        account.displayName,
        selectedRole,
        message.trim() || undefined
      );

      setStep('success');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleComplete = () => {
    onRequestSent();
    onClose();
    // Reset state
    setStep('code');
    setFarmCode('');
    setSelectedRole(FarmRole.VIEWER);
    setMessage('');
    setValidatedFarm(null);
  };

  const renderCodeStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Unirse a una Granja
        </Text>
        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
          Ingresa el código de la granja a la que quieres unirte
        </Text>
      </View>

      <View style={styles.codeInput}>
        <Input
          label="Código de Granja"
          value={farmCode}
          onChangeText={(text) => setFarmCode(text.toUpperCase())}
          placeholder="Ej: ABC12345"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={8}
          required
          variant={isDark ? 'dark' : undefined}
          containerStyle={styles.inputContainer}
        />
        
        <Text style={[styles.codeHint, { color: colors.text.tertiary }]}>
          El código debe tener 8 caracteres (letras y números)
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          title="Cancelar"
          onPress={onClose}
          variant="outline"
          style={styles.cancelButton}
        />
        <Button
          title={isValidating ? 'Validando...' : 'Continuar'}
          onPress={handleValidateCode}
          variant="primary"
          loading={isValidating}
          disabled={farmCode.length !== 8 || isValidating}
          style={styles.continueButton}
        />
      </View>
    </View>
  );

  const renderConfirmStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep('code')}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Solicitar Acceso
        </Text>
      </View>

      {/* Información de la granja encontrada */}
      <View style={[styles.farmInfo, { backgroundColor: colors.background.secondary }]}>
        <View style={styles.farmHeader}>
          <Ionicons name="business" size={24} color={colors.primary[500]} />
          <View style={styles.farmDetails}>
            <Text style={[styles.farmName, { color: colors.text.primary }]}>
              {validatedFarm?.name}
            </Text>
            {validatedFarm?.description && (
              <Text style={[styles.farmDescription, { color: colors.text.secondary }]}>
                {validatedFarm.description}
              </Text>
            )}
            {validatedFarm?.location && (
              <View style={styles.farmLocation}>
                <Ionicons name="location" size={14} color={colors.text.tertiary} />
                <Text style={[styles.farmLocationText, { color: colors.text.tertiary }]}>
                  {validatedFarm.location}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Selector de rol */}
      <View style={styles.roleSelector}>
        <Text style={[styles.roleSelectorLabel, { color: colors.text.primary }]}>
          Rol solicitado:
        </Text>
        <View style={styles.roleOptions}>
          {availableRoles.map(role => (
            <TouchableOpacity
              key={role.key}
              style={[
                styles.roleOption,
                {
                  backgroundColor: selectedRole === role.key ? colors.primary[100] : colors.background.tertiary,
                  borderColor: selectedRole === role.key ? colors.primary[500] : colors.border.light,
                },
              ]}
              onPress={() => setSelectedRole(role.key)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={role.icon}
                size={20}
                color={selectedRole === role.key ? colors.primary[500] : colors.text.secondary}
              />
              <View style={styles.roleInfo}>
                <Text
                  style={[
                    styles.roleLabel,
                    {
                      color: selectedRole === role.key ? colors.primary[500] : colors.text.primary,
                    },
                  ]}
                >
                  {role.label}
                </Text>
                <Text
                  style={[
                    styles.roleDescription,
                    {
                      color: selectedRole === role.key ? colors.primary[400] : colors.text.secondary,
                    },
                  ]}
                >
                  {role.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Mensaje opcional */}
      <View style={styles.messageInput}>
        <Input
          label="Mensaje (opcional)"
          value={message}
          onChangeText={setMessage}
          placeholder="Explica por qué quieres unirte a esta granja..."
          multiline
          numberOfLines={3}
          variant={isDark ? 'dark' : undefined}
        />
      </View>

      <View style={styles.actions}>
        <Button
          title="Atrás"
          onPress={() => setStep('code')}
          variant="outline"
          style={styles.cancelButton}
        />
        <Button
          title={isProcessingRequest ? 'Enviando...' : 'Enviar Solicitud'}
          onPress={handleSendRequest}
          variant="primary"
          loading={isProcessingRequest}
          disabled={isProcessingRequest}
          style={styles.continueButton}
        />
      </View>
    </View>
  );

  const renderSuccessStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.successHeader}>
        <View style={[styles.successIcon, { backgroundColor: colors.primary[100] }]}>
          <Ionicons name="checkmark" size={40} color={colors.primary[500]} />
        </View>
        <Text style={[styles.successTitle, { color: colors.text.primary }]}>
          ¡Solicitud Enviada!
        </Text>
        <Text style={[styles.successSubtitle, { color: colors.text.secondary }]}>
          Tu solicitud ha sido enviada al propietario de "{validatedFarm?.name}"
        </Text>
      </View>

      <View style={[styles.statusInfo, { backgroundColor: colors.background.secondary }]}>
        <View style={styles.statusHeader}>
          <Ionicons name="time" size={20} color={colors.primary[500]} />
          <Text style={[styles.statusTitle, { color: colors.text.primary }]}>
            Estado: Pendiente de Aprobación
          </Text>
        </View>
        <Text style={[styles.statusDescription, { color: colors.text.secondary }]}>
          El propietario o administrador revisará tu solicitud. Recibirás una notificación cuando sea aprobada o rechazada.
        </Text>
      </View>

      <View style={styles.nextInfo}>
        <Text style={[styles.nextTitle, { color: colors.text.primary }]}>
          ¿Qué sigue?
        </Text>
        <View style={styles.nextSteps}>
          <View style={styles.nextStep}>
            <Ionicons name="notifications" size={16} color={colors.primary[500]} />
            <Text style={[styles.nextStepText, { color: colors.text.secondary }]}>
              Recibirás una notificación cuando la solicitud sea revisada
            </Text>
          </View>
          <View style={styles.nextStep}>
            <Ionicons name="mail" size={16} color={colors.primary[500]} />
            <Text style={[styles.nextStepText, { color: colors.text.secondary }]}>
              También te enviaremos un email con el resultado
            </Text>
          </View>
          <View style={styles.nextStep}>
            <Ionicons name="time" size={16} color={colors.primary[500]} />
            <Text style={[styles.nextStepText, { color: colors.text.secondary }]}>
              Las solicitudes expiran en 7 días si no son revisadas
            </Text>
          </View>
        </View>
      </View>

      <Button
        title="Entendido"
        onPress={handleComplete}
        variant="primary"
        style={styles.completeButton}
        fullWidth
      />
    </View>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 'code':
        return renderCodeStep();
      case 'confirm':
        return renderConfirmStep();
      case 'success':
        return renderSuccessStep();
      default:
        return renderCodeStep();
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={step === 'success' ? handleComplete : onClose}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {renderCurrentStep()}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '95%',
    maxWidth: 400,
    maxHeight: '90%',
  },
  modalContent: {
    borderRadius: borderRadius.xl,
    ...shadows.xl,
  },
  scrollContent: {
    padding: spacing[6],
  },

  // Common
  stepContainer: {
    gap: spacing[5],
  },
  header: {
    alignItems: 'center',
    gap: spacing[2],
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.base,
    textAlign: 'center',
    lineHeight: typography.sizes.base * 1.5,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Code Step
  codeInput: {
    gap: spacing[2],
  },
  inputContainer: {
    marginBottom: spacing[1],
  },
  codeHint: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },

  // Confirm Step
  farmInfo: {
    padding: spacing[4],
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  farmHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  farmDetails: {
    flex: 1,
  },
  farmName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as '700',
    marginBottom: spacing[1],
  },
  farmDescription: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.4,
    marginBottom: spacing[1],
  },
  farmLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  farmLocationText: {
    fontSize: typography.sizes.sm,
  },
  
  // Role Selector
  roleSelector: {
    gap: spacing[3],
  },
  roleSelectorLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold as '600',
  },
  roleOptions: {
    gap: spacing[2],
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing[3],
  },
  roleInfo: {
    flex: 1,
  },
  roleLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold as '600',
    marginBottom: spacing[1],
  },
  roleDescription: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.3,
  },

  // Message Input
  messageInput: {
    gap: spacing[2],
  },

  // Success Step
  successHeader: {
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  successIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  successTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as '700',
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  successSubtitle: {
    fontSize: typography.sizes.base,
    textAlign: 'center',
    lineHeight: typography.sizes.base * 1.5,
  },
  statusInfo: {
    padding: spacing[4],
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  statusTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold as '600',
  },
  statusDescription: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.4,
  },
  nextInfo: {
    gap: spacing[3],
  },
  nextTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold as '600',
  },
  nextSteps: {
    gap: spacing[2],
  },
  nextStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  nextStepText: {
    fontSize: typography.sizes.sm,
    flex: 1,
    lineHeight: typography.sizes.sm * 1.4,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  cancelButton: {
    flex: 1,
  },
  continueButton: {
    flex: 2,
  },
  completeButton: {
    marginTop: spacing[2],
  },
});



