/**
 * Modal para crear la primera granja durante onboarding
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Image,
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
import { createFarm } from '../../services/farm.service';
import { useAuthStore } from '../../stores/authStore';
import { useFarmStore } from '../../stores/farmStore';
import { useMultiTenantAuthStore } from '../../stores/multiTenantAuthStore';
import { Farm } from '../../types/farm';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface CreateFarmModalProps {
  isVisible: boolean;
  onClose: () => void;
  onFarmCreated: (farm: Farm) => void;
}

export const CreateFarmModal: React.FC<CreateFarmModalProps> = ({
  isVisible,
  onClose,
  onFarmCreated,
}) => {
  const { isDark, colors } = useTheme();
  const { user: authUser } = useAuthStore();
  const { user: multiTenantUser } = useMultiTenantAuthStore();
  const { isCreatingFarm } = useFarmStore();
  
  const [farmName, setFarmName] = useState('');
  const [step, setStep] = useState<'welcome' | 'create' | 'success'>('welcome');
  const [createdFarm, setCreatedFarm] = useState<Farm | null>(null);

  // Obtener el UID del usuario autenticado
  const userId = multiTenantUser?.uid || authUser?.uid;

  const handleCreateFarm = async () => {
    if (!farmName.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para tu granja');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'No se pudo obtener información del usuario. Por favor inicia sesión nuevamente.');
      return;
    }

    try {
      console.log('🏢 Creando granja:', farmName, 'para usuario:', userId);
      const newFarm = await createFarm(farmName.trim(), userId);
      
      setCreatedFarm(newFarm);
      setStep('success');
      
      // Recargar las granjas del usuario
      const { loadFarms } = useFarmStore.getState();
      await loadFarms();
      
    } catch (error: any) {
      console.error('❌ Error creando granja:', error);
      Alert.alert('Error', error.message || 'No se pudo crear la granja. Por favor intenta nuevamente.');
    }
  };

  const handleComplete = () => {
    if (createdFarm) {
      onFarmCreated(createdFarm);
    }
    onClose();
    // Reset state
    setStep('welcome');
    setFarmName('');
    setCreatedFarm(null);
  };

  const renderWelcomeStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.welcomeHeader}>
        <Image
          source={require('../../../assets/shed.png')}
          style={styles.welcomeIcon}
          resizeMode="contain"
        />
        <Text style={[styles.welcomeTitle, { color: colors.text.primary }]}>
          ¡Bienvenido a Gallinapp!
        </Text>
        <Text style={[styles.welcomeSubtitle, { color: colors.text.secondary }]}>
          Vamos a crear tu primera granja para comenzar
        </Text>
      </View>

      <View style={styles.featuresList}>
        <View style={styles.featureItem}>
          <Ionicons name="checkmark-circle" size={20} color={colors.primary[500]} />
          <Text style={[styles.featureText, { color: colors.text.secondary }]}>
            Gestión completa de lotes de aves
          </Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="checkmark-circle" size={20} color={colors.primary[500]} />
          <Text style={[styles.featureText, { color: colors.text.secondary }]}>
            Seguimiento de producción en tiempo real
          </Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="checkmark-circle" size={20} color={colors.primary[500]} />
          <Text style={[styles.featureText, { color: colors.text.secondary }]}>
            Análisis financiero y reportes detallados
          </Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="checkmark-circle" size={20} color={colors.primary[500]} />
          <Text style={[styles.featureText, { color: colors.text.secondary }]}>
            Colaboración en equipo con códigos de acceso
          </Text>
        </View>
      </View>

      <Button
        title="Crear Mi Primera Granja"
        onPress={() => setStep('create')}
        variant="primary"
        style={styles.primaryButton}
        fullWidth
      />

      <TouchableOpacity
        style={styles.secondaryAction}
        onPress={() => {/* TODO: Implementar flujo de unirse a granja */}}
      >
        <Text style={[styles.secondaryActionText, { color: colors.primary[500] }]}>
          ¿Ya tienes un código de granja? Únete aquí
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderCreateStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.createHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep('welcome')}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.createTitle, { color: colors.text.primary }]}>
          Crear Granja
        </Text>
      </View>

      <View style={styles.createContent}>
        <Text style={[styles.createSubtitle, { color: colors.text.secondary }]}>
          Solo necesitamos un nombre para comenzar. Podrás agregar más detalles después.
        </Text>

        <View style={styles.inputContainer}>
          <Input
            label="Nombre de la granja"
            value={farmName}
            onChangeText={setFarmName}
            placeholder="Ej: Finca Cumayasa"
            autoFocus
            required
            variant={isDark ? 'dark' : undefined}
            containerStyle={styles.nameInput}
            inputStyle={styles.nameInputField}
          />
        </View>
      </View>

      <View style={styles.createActions}>
        <Button
          title="Cancelar"
          onPress={() => setStep('welcome')}
          variant="outline"
          style={styles.cancelButton}
        />
        <Button
          title={isCreatingFarm ? 'Creando...' : 'Crear Granja'}
          onPress={handleCreateFarm}
          variant="primary"
          loading={isCreatingFarm}
          disabled={!farmName.trim() || isCreatingFarm}
          style={styles.createButton}
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
          ¡Granja Creada Exitosamente!
        </Text>
        <Text style={[styles.successSubtitle, { color: colors.text.secondary }]}>
          Tu granja "{createdFarm?.name}" está lista para usar
        </Text>
      </View>

      <View style={[styles.codeContainer, { backgroundColor: colors.background.secondary }]}>
        <Text style={[styles.codeLabel, { color: colors.text.secondary }]}>
          Código de tu granja:
        </Text>
        <View style={[styles.codeDisplay, { backgroundColor: colors.primary[100] }]}>
          <Text style={[styles.codeText, { color: colors.primary[700] }]}>
            {createdFarm?.farmCode}
          </Text>
        </View>
        <Text style={[styles.codeDescription, { color: colors.text.secondary }]}>
          Comparte este código con colaboradores para que puedan unirse a tu granja
        </Text>
      </View>

      <View style={styles.nextSteps}>
        <Text style={[styles.nextStepsTitle, { color: colors.text.primary }]}>
          Próximos pasos:
        </Text>
        <View style={styles.stepsList}>
          <View style={styles.stepItem}>
            <Ionicons name="add-circle" size={16} color={colors.primary[500]} />
            <Text style={[styles.stepText, { color: colors.text.secondary }]}>
              Crear tu primer lote de aves
            </Text>
          </View>
          <View style={styles.stepItem}>
            <Ionicons name="people" size={16} color={colors.primary[500]} />
            <Text style={[styles.stepText, { color: colors.text.secondary }]}>
              Invitar colaboradores con el código de granja
            </Text>
          </View>
          <View style={styles.stepItem}>
            <Ionicons name="settings" size={16} color={colors.primary[500]} />
            <Text style={[styles.stepText, { color: colors.text.secondary }]}>
              Configurar detalles de la granja
            </Text>
          </View>
        </View>
      </View>

      <Button
        title="Comenzar a Usar Gallinapp"
        onPress={handleComplete}
        variant="primary"
        style={styles.completeButton}
        fullWidth
      />
    </View>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 'welcome':
        return renderWelcomeStep();
      case 'create':
        return renderCreateStep();
      case 'success':
        return renderSuccessStep();
      default:
        return renderWelcomeStep();
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

  // Welcome Step
  welcomeHeader: {
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  welcomeIcon: {
    width: 80,
    height: 80,
    marginBottom: spacing[3],
    opacity: 0.9,
  },
  welcomeTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold as '700',
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  welcomeSubtitle: {
    fontSize: typography.sizes.base,
    textAlign: 'center',
    lineHeight: typography.sizes.base * 1.5,
  },
  featuresList: {
    gap: spacing[3],
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  featureText: {
    fontSize: typography.sizes.base,
    flex: 1,
  },
  primaryButton: {
    marginTop: spacing[2],
  },
  secondaryAction: {
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  secondaryActionText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium as '500',
  },

  // Create Step
  createHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  createTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as '700',
    flex: 1,
  },
  createContent: {
    gap: spacing[3],
    alignItems: 'center',
  },
  createSubtitle: {
    fontSize: typography.sizes.base,
    lineHeight: typography.sizes.base * 1.4,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: spacing[2],
  },
  nameInput: {
    width: '100%',
    maxWidth: 350,
  },
  nameInputField: {
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[5],
    fontSize: typography.sizes.lg,
    minHeight: 56,
  },
  createActions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  cancelButton: {
    flex: 1,
  },
  createButton: {
    flex: 2,
  },

  // Success Step
  successHeader: {
    alignItems: 'center',
    marginBottom: spacing[5],
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
  codeContainer: {
    padding: spacing[4],
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  codeLabel: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing[2],
  },
  codeDisplay: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
    marginBottom: spacing[2],
  },
  codeText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as '700',
    letterSpacing: 2,
  },
  codeDescription: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    lineHeight: typography.sizes.sm * 1.4,
  },
  nextSteps: {
    gap: spacing[3],
  },
  nextStepsTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold as '700',
  },
  stepsList: {
    gap: spacing[2],
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  stepText: {
    fontSize: typography.sizes.sm,
    flex: 1,
  },
  completeButton: {
    marginTop: spacing[2],
  },
});
