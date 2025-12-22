/**
 * Hook para gestión de migración Organization → Farm
 * 
 * Proporciona una interfaz simple para:
 * - Verificar si hay Organizations sin migrar
 * - Ejecutar migración
 * - Monitorear progreso
 */

import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { farmUnifiedService } from '../services/farm-unified.service';
import { MigrationResult, organizationToFarmMigration } from '../services/migration/organization-to-farm.migration';
import { useFarmStore } from '../stores/farmStore';

interface UseFarmMigrationReturn {
  // Estado
  hasUnmigratedOrganizations: boolean;
  isChecking: boolean;
  isMigrating: boolean;
  migrationResult: MigrationResult | null;
  
  // Acciones
  checkUnmigratedOrganizations: () => Promise<void>;
  migrateAllOrganizations: () => Promise<void>;
  migrateSingleOrganization: (organizationId: string) => Promise<void>;
  
  // Utilidades
  needsMigration: boolean;
}

export const useFarmMigration = (): UseFarmMigrationReturn => {
  const [hasUnmigratedOrganizations, setHasUnmigratedOrganizations] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  
  const { loadFarms } = useFarmStore();

  // Verificar al montar
  useEffect(() => {
    checkUnmigratedOrganizations();
  }, []);

  const checkUnmigratedOrganizations = useCallback(async () => {
    setIsChecking(true);
    try {
      const hasUnmigrated = await farmUnifiedService.hasUnmigratedOrganizations();
      setHasUnmigratedOrganizations(hasUnmigrated);
    } catch (error: any) {
      console.error('Error verificando organizaciones sin migrar:', error);
    } finally {
      setIsChecking(false);
    }
  }, []);

  const migrateAllOrganizations = useCallback(async () => {
    setIsMigrating(true);
    setMigrationResult(null);
    
    try {
      Alert.alert(
        'Migrar Organizaciones',
        '¿Estás seguro de que quieres migrar todas las organizaciones a farms? Esta acción no se puede deshacer.',
        [
          { text: 'Cancelar', style: 'cancel', onPress: () => setIsMigrating(false) },
          {
            text: 'Migrar',
            style: 'destructive',
            onPress: async () => {
              try {
                const result = await organizationToFarmMigration.migrateAll();
                setMigrationResult(result);
                
                if (result.success) {
                  Alert.alert(
                    'Migración Exitosa',
                    `Se migraron ${result.migratedCount} organizaciones exitosamente.`,
                    [
                      {
                        text: 'OK',
                        onPress: async () => {
                          // Recargar farms después de la migración
                          await loadFarms();
                          await checkUnmigratedOrganizations();
                        }
                      }
                    ]
                  );
                } else {
                  Alert.alert(
                    'Migración con Errores',
                    `Se migraron ${result.migratedCount} organizaciones, pero hubo ${result.errors.length} errores.`,
                    [{ text: 'OK' }]
                  );
                }
              } catch (error: any) {
                Alert.alert('Error', `Error durante la migración: ${error.message}`);
              } finally {
                setIsMigrating(false);
              }
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', `Error iniciando migración: ${error.message}`);
      setIsMigrating(false);
    }
  }, [loadFarms, checkUnmigratedOrganizations]);

  const migrateSingleOrganization = useCallback(async (organizationId: string) => {
    setIsMigrating(true);
    
    try {
      // Obtener la organización
      const { organizationService } = await import('../services/organization.service');
      const organizations = await organizationService.getUserOrganizations();
      const organization = organizations.find(org => org.id === organizationId);
      
      if (!organization) {
        throw new Error('Organización no encontrada');
      }

      // Migrar
      await organizationToFarmMigration.migrateOrganization(organization);
      
      Alert.alert(
        'Migración Exitosa',
        `La organización "${organization.name}" ha sido migrada exitosamente.`,
        [
          {
            text: 'OK',
            onPress: async () => {
              await loadFarms();
              await checkUnmigratedOrganizations();
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', `Error migrando organización: ${error.message}`);
    } finally {
      setIsMigrating(false);
    }
  }, [loadFarms, checkUnmigratedOrganizations]);

  return {
    hasUnmigratedOrganizations,
    isChecking,
    isMigrating,
    migrationResult,
    checkUnmigratedOrganizations,
    migrateAllOrganizations,
    migrateSingleOrganization,
    needsMigration: hasUnmigratedOrganizations,
  };
};



