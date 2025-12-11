/**
 * Contenido del Dashboard con widgets personalizables y drag and drop
 */

import React, { useCallback, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../../../components/theme-provider';
import { spacing } from '../../constants/designSystem';
import { useDashboardStore, WidgetType } from '../../stores/dashboardStore';
import { Farm } from '../../types/farm';
import Card from '../ui/Card';
import CostProductionStats from './CostProductionStats';
import { CurrentFarmWidget } from './CurrentFarmWidget';
import { InviteCollaboratorWidget } from './InviteCollaboratorWidget';
import { DraggableWidget } from './widgets/DraggableWidget';
import { WelcomeWidget } from './widgets/WelcomeWidget';

interface DashboardContentProps {
  ponedorasActivas: number;
  engordeActivos: number;
  israeliesActivos: number;
  topLotesRentables: any[];
  isLoading: boolean;
  onRefresh: () => void;
  refreshing: boolean;
  currentFarm: Farm | null;
}

export const DashboardContent: React.FC<DashboardContentProps> = ({
  ponedorasActivas,
  engordeActivos,
  israeliesActivos,
  topLotesRentables,
  isLoading,
  onRefresh,
  refreshing,
  currentFarm,
}) => {
  const { colors: themeColors } = useTheme();
  const { 
    isEditMode, 
    toggleWidget, 
    getEnabledWidgets,
    toggleEditMode,
    updateWidgetOrder,
  } = useDashboardStore();
  
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const enabledWidgets = getEnabledWidgets();

  // Activar modo edición con long press
  const handleLongPress = useCallback(() => {
    if (!isEditMode) {
      toggleEditMode();
    }
  }, [isEditMode, toggleEditMode]);

  // Iniciar arrastre
  const handleDragStart = useCallback(() => {
    // El índice se maneja en el componente
  }, []);

  // Finalizar arrastre y reordenar
  const handleDragEnd = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) {
      setDraggingIndex(null);
      return;
    }

    const newWidgets = [...enabledWidgets];
    const [removed] = newWidgets.splice(fromIndex, 1);
    newWidgets.splice(toIndex, 0, removed);
    
    updateWidgetOrder(newWidgets);
    setDraggingIndex(null);
  }, [enabledWidgets, updateWidgetOrder]);

  // Renderizar widget según su tipo
  const renderWidget = (widget: any) => {
    switch (widget.type) {
      case WidgetType.WELCOME:
        return <WelcomeWidget />;

      case WidgetType.COST_STATS:
        return <CostProductionStats isLoading={isLoading} />;

      case WidgetType.TOP_LOTES:
        if (topLotesRentables.length === 0) return null;
        return (
          <Card style={styles.topLotesCard}>
            <Text style={[styles.cardTitle, { color: themeColors.text.primary }]}>
              Lotes Más Rentables
            </Text>
            {topLotesRentables.slice(0, 3).map((lote, index) => (
              <View 
                key={lote.loteId} 
                style={[
                  styles.topLoteItem, 
                  { backgroundColor: themeColors.background.tertiary }
                ]}
              >
                <View style={[styles.topLoteRank, { backgroundColor: themeColors.warning[500] }]}>
                  <Text style={[styles.topLoteRankText, { color: themeColors.text.inverse }]}>
                    {index + 1}
                  </Text>
                </View>
                <View style={styles.topLoteInfo}>
                  <Text style={[styles.topLoteName, { color: themeColors.text.primary }]}>
                    {lote.nombre}
                  </Text>
                  <Text style={[styles.topLoteType, { color: themeColors.text.secondary }]}>
                    {lote.tipoLote}
                  </Text>
                </View>
                <Text style={[styles.topLoteGanancia, { color: themeColors.success[500] }]}>
                  {new Intl.NumberFormat('es-DO', {
                    style: 'currency',
                    currency: 'DOP',
                  }).format(lote.ganancias)}
                </Text>
              </View>
            ))}
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themeColors.background.secondary }]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      scrollEnabled={!isEditMode || draggingIndex === null}
    >
      {/* Banners de Granja y Colaboradores - Solo mostrar si hay granja */}
      {currentFarm && (
        <View style={styles.bannersContainer}>
          <CurrentFarmWidget 
            style={styles.banner}
            ponedorasActivas={ponedorasActivas}
            engordeActivos={engordeActivos}
            levantesActivos={israeliesActivos}
          />
          <InviteCollaboratorWidget style={styles.banner} />
        </View>
      )}

      {enabledWidgets.map((widget, index) => (
        <DraggableWidget
          key={widget.id}
          widget={widget}
          index={index}
          isEditMode={isEditMode}
          onLongPress={handleLongPress}
          onDragStart={() => {
            setDraggingIndex(index);
          }}
          onDragEnd={(fromIndex, toIndex) => handleDragEnd(fromIndex, toIndex)}
          onToggle={() => toggleWidget(widget.id)}
        >
          {renderWidget(widget)}
        </DraggableWidget>
      ))}

      {/* Mensaje cuando no hay widgets */}
      {enabledWidgets.length === 0 && (
        <View style={[styles.emptyState, { backgroundColor: themeColors.background.primary }]}>
          <Text style={[styles.emptyStateText, { color: themeColors.text.secondary }]}>
            {isEditMode 
              ? 'Mantén presionado cualquier widget para reordenarlos'
              : 'Mantén presionado un widget para personalizar el dashboard'}
          </Text>
        </View>
      )}

      {/* Indicador de modo edición */}
      {isEditMode && (
        <View style={[styles.editModeHint, { backgroundColor: themeColors.info[50] }]}>
          <Text style={[styles.editModeHintText, { color: themeColors.info[500] }]}>
            Mantén presionado y arrastra para reordenar • Toca el ícono del ojo para ocultar/mostrar
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  bannersContainer: {
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  banner: {
    width: '100%',
  },
  editModeHint: {
    padding: spacing[3],
    borderRadius: 12,
    marginTop: spacing[2],
    marginHorizontal: spacing[4],
  },
  editModeHintText: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  topLotesCard: {
    marginBottom: spacing[4],
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing[4],
  },
  topLoteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: 8,
    marginBottom: spacing[2],
  },
  topLoteRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  topLoteRankText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  topLoteInfo: {
    flex: 1,
  },
  topLoteName: {
    fontSize: 14,
    fontWeight: '600',
  },
  topLoteType: {
    fontSize: 12,
    marginTop: 2,
  },
  topLoteGanancia: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    borderRadius: 12,
    margin: 16,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

