/**
 * Componente wrapper para widgets arrastrables estilo iOS
 * Long press para activar modo edición y arrastrar para reordenar
 */

import React, { useState } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../../../../components/theme-provider';
import { spacing, borderRadius, shadows } from '../../../constants/designSystem';
import { DashboardWidget } from '../../../stores/dashboardStore';

interface DraggableWidgetProps {
  widget: DashboardWidget;
  index: number;
  isEditMode: boolean;
  onLongPress: () => void;
  onDragStart: () => void;
  onDragEnd: (fromIndex: number, toIndex: number) => void;
  onToggle?: () => void;
  children: React.ReactNode;
}

export const DraggableWidget: React.FC<DraggableWidgetProps> = ({
  widget,
  index,
  isEditMode,
  onLongPress,
  onDragStart,
  onDragEnd,
  onToggle,
  children,
}) => {
  const { colors: themeColors } = useTheme();
  const [isDragging, setIsDragging] = useState(false);
  
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const zIndex = useSharedValue(0);

  // Long press gesture - activa modo edición
  const longPressGesture = Gesture.LongPress()
    .minDuration(400)
    .onStart(() => {
      runOnJS(onLongPress)();
      runOnJS(setIsDragging)(true);
      runOnJS(onDragStart)();
      
      // Animación de inicio de arrastre
      scale.value = withSpring(1.05, { damping: 15 });
      opacity.value = withTiming(0.9);
      zIndex.value = 1000;
    });

  // Pan gesture - arrastra el widget (solo funciona después de long press)
  const panGesture = Gesture.Pan()
    .enabled(isEditMode && isDragging)
    .onUpdate((event) => {
      if (!isEditMode || !isDragging) return;
      
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd(() => {
      if (!isEditMode) return;
      
      // Calcular nueva posición basada en translateY
      // Cada widget tiene aproximadamente 200px de altura
      const widgetHeight = 200;
      const deltaIndex = Math.round(translateY.value / widgetHeight);
      const finalIndex = Math.max(0, Math.min(index + deltaIndex, 20));
      
      runOnJS(onDragEnd)(index, finalIndex);
      
      // Reset animaciones
      translateX.value = withSpring(0, { damping: 20 });
      translateY.value = withSpring(0, { damping: 20 });
      scale.value = withSpring(1, { damping: 15 });
      opacity.value = withTiming(1);
      zIndex.value = withTiming(0);
      
      runOnJS(setIsDragging)(false);
    });

  // Combinar gestos: primero long press, luego pan
  const composedGesture = Gesture.Simultaneous(longPressGesture, panGesture);

  // Estilos animados
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
    zIndex: zIndex.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    backgroundColor: themeColors.background.primary,
    borderRadius: borderRadius.lg,
    marginBottom: spacing[3],
    ...(isEditMode && {
      borderWidth: 2,
      borderColor: themeColors.primary[300],
      borderStyle: 'dashed',
    }),
    ...(isDragging && shadows.lg),
  }));

  // Si no está en modo edición, renderizar normalmente
  if (!isEditMode) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background.primary }]}>
        {children}
      </View>
    );
  }

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[containerStyle, animatedStyle]}>
        {/* Indicador de arrastre */}
        <View style={[styles.dragIndicator, { backgroundColor: themeColors.primary[100] }]}>
          <Ionicons 
            name="reorder-three" 
            size={20} 
            color={themeColors.primary[500]} 
          />
          <View style={styles.dragHint}>
            <Ionicons 
              name="hand-left-outline" 
              size={16} 
              color={themeColors.text.secondary} 
            />
          </View>
        </View>
        
        {/* Contenido del widget */}
        <View style={styles.content}>
          {children}
        </View>

        {/* Botón de toggle (solo en modo edición) */}
        {onToggle && (
          <View style={[styles.toggleButton, { backgroundColor: themeColors.background.secondary }]}>
            <Ionicons
              name={widget.enabled ? 'eye' : 'eye-off'}
              size={18}
              color={widget.enabled ? themeColors.success[500] : themeColors.text.tertiary}
            />
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    marginBottom: spacing[3],
    overflow: 'hidden',
  },
  dragIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  dragHint: {
    opacity: 0.6,
  },
  content: {
    flex: 1,
  },
  toggleButton: {
    position: 'absolute',
    right: spacing[2],
    top: spacing[2],
    zIndex: 10,
    padding: spacing[2],
    borderRadius: borderRadius.base,
    ...shadows.sm,
  },
});
