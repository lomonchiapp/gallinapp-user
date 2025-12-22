/**
 * Componente principal de onboarding para granjas
 */

import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useAccountStore } from '../../stores/accountStore';
import { useFarmStore } from '../../stores/farmStore';
import { Farm } from '../../types/farm';
import { CreateFarmModal } from './CreateFarmModal';
import { JoinFarmModal } from './JoinFarmModal';
import { OnboardingWelcome } from './OnboardingWelcome';

interface FarmOnboardingProps {
  accountId: string;
  onComplete: (farm?: Farm) => void;
}

export const FarmOnboarding: React.FC<FarmOnboardingProps> = ({
  accountId,
  onComplete,
}) => {
  const { account, loadAccount } = useAccountStore();
  const { needsOnboarding, loadUserFarms } = useFarmStore();
  
  const [currentModal, setCurrentModal] = useState<'welcome' | 'create' | 'join' | null>(null);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, [accountId]);

  const checkOnboardingStatus = async () => {
    try {
      setIsCheckingOnboarding(true);
      
      // Cargar account si no existe
      if (!account) {
        await loadAccount(accountId);
      }
      
      // Verificar si necesita onboarding
      const needsSetup = await needsOnboarding(accountId);
      
      if (needsSetup) {
        setCurrentModal('welcome');
      } else {
        // Usuario ya tiene acceso a granjas, cargar y completar
        await loadUserFarms(accountId);
        onComplete();
      }
    } catch (error: any) {
      console.error('Error checking onboarding status:', error);
      // En caso de error, mostrar onboarding por seguridad
      setCurrentModal('welcome');
    } finally {
      setIsCheckingOnboarding(false);
    }
  };

  const handleWelcomeChoice = (choice: 'create' | 'join') => {
    setCurrentModal(choice);
  };

  const handleFarmCreated = async (farm: Farm) => {
    try {
      console.log('🎉 Granja creada en onboarding:', farm.name);
      
      // Recargar granjas del usuario
      await loadUserFarms(accountId);
      
      Alert.alert(
        '¡Granja Creada!',
        `Tu granja "${farm.name}" ha sido creada exitosamente. Código de granja: ${farm.farmCode}`,
        [
          {
            text: 'Continuar',
            onPress: () => {
              setCurrentModal(null);
              onComplete(farm);
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Error after farm creation:', error);
      Alert.alert('Error', 'Granja creada pero hubo un problema al cargar los datos');
    }
  };

  const handleJoinRequestSent = () => {
    Alert.alert(
      'Solicitud Enviada',
      'Tu solicitud de acceso ha sido enviada. Te notificaremos cuando sea revisada.',
      [
        {
          text: 'Ir al Dashboard',
          onPress: () => {
            setCurrentModal(null);
            router.replace('/(tabs)/');
          }
        }
      ]
    );
  };

  const handleCloseModals = () => {
    setCurrentModal(null);
    // Si cierra sin completar, ir al dashboard de todos modos
    router.replace('/(tabs)/');
  };

  // Mostrar loading si está verificando
  if (isCheckingOnboarding) {
    return <View style={styles.container} />; // Loading se maneja en nivel superior
  }

  return (
    <>
      {/* Modal de bienvenida y selección */}
      <OnboardingWelcome
        isVisible={currentModal === 'welcome'}
        onChoice={handleWelcomeChoice}
        onClose={handleCloseModals}
      />

      {/* Modal para crear granja */}
      <CreateFarmModal
        isVisible={currentModal === 'create'}
        onClose={() => setCurrentModal('welcome')}
        onFarmCreated={handleFarmCreated}
      />

      {/* Modal para unirse a granja */}
      <JoinFarmModal
        isVisible={currentModal === 'join'}
        onClose={() => setCurrentModal('welcome')}
        onRequestSent={handleJoinRequestSent}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});



