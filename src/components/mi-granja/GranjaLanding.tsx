/**
 * Landing page para Mi Granja - Overview del SaaS Avícola
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useTheme } from '../../../components/theme-provider';
import { borderRadius, shadows, spacing, typography } from '../../constants/designSystem';
import { calcularCostoProduccionUnitario } from '../../services/gastos.service';
import { useEngordeStore } from '../../stores/engordeStore';
import { useLevantesStore } from '../../stores/levantesStore';
import { usePonedorasStore } from '../../stores/ponedorasStore';
import { EstadoLote, TipoAve } from '../../types';
import { EngordeIcon } from '../ui/icons/EngordeIcon';
import { LevanteIcon } from '../ui/icons/LevanteIcon';
import { PonedoraIcon } from '../ui/icons/PonedoraIcon';

const { width } = Dimensions.get('window');

interface FarmSection {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  darkColor: string;
  route: string;
  stats: {
    lotesActivos: number;
    costoUnitario: number;
  };
}

interface GranjaLandingProps {
  onSectionSelect?: (section: string) => void;
}

export const GranjaLanding: React.FC<GranjaLandingProps> = ({ 
  onSectionSelect 
}) => {
  const { isDark, colors } = useTheme();
  
  // Stores para obtener estadísticas
  const ponedorasStore = usePonedorasStore();
  const levantesStore = useLevantesStore();
  const engordeStore = useEngordeStore();
  
  // Estado para costos unitarios
  const [costosUnitarios, setCostosUnitarios] = useState<{
    ponedoras: number;
    levantes: number;
    engorde: number;
  }>({ ponedoras: 0, levantes: 0, engorde: 0 });
  
  // Calcular costos unitarios
  useEffect(() => {
    const calcularCostos = async () => {
      const costos: { ponedoras: number; levantes: number; engorde: number } = {
        ponedoras: 0,
        levantes: 0,
        engorde: 0,
      };
      
      // Ponedoras
      const lotesPonedorasActivos = ponedorasStore.lotes.filter(l => l.estado === EstadoLote.ACTIVO);
      if (lotesPonedorasActivos.length > 0) {
        const costosPromedio = await Promise.all(
          lotesPonedorasActivos.map(lote => 
            calcularCostoProduccionUnitario(lote.id!, TipoAve.PONEDORA)
          )
        );
        costos.ponedoras = costosPromedio.reduce((sum, c) => sum + c, 0) / lotesPonedorasActivos.length;
      }
      
      // Levantes
      const lotesLevantesActivos = levantesStore.lotes.filter(l => l.estado === EstadoLote.ACTIVO);
      if (lotesLevantesActivos.length > 0) {
        const costosPromedio = await Promise.all(
          lotesLevantesActivos.map(lote => 
            calcularCostoProduccionUnitario(lote.id!, TipoAve.POLLO_LEVANTE)
          )
        );
        costos.levantes = costosPromedio.reduce((sum, c) => sum + c, 0) / lotesLevantesActivos.length;
      }
      
      // Engorde
      const lotesEngordeActivos = engordeStore.lotes.filter(l => l.estado === EstadoLote.ACTIVO);
      if (lotesEngordeActivos.length > 0) {
        const costosPromedio = await Promise.all(
          lotesEngordeActivos.map(lote => 
            calcularCostoProduccionUnitario(lote.id!, TipoAve.POLLO_ENGORDE)
          )
        );
        costos.engorde = costosPromedio.reduce((sum, c) => sum + c, 0) / lotesEngordeActivos.length;
      }
      
      setCostosUnitarios(costos);
    };
    
    calcularCostos();
  }, [ponedorasStore.lotes, levantesStore.lotes, engordeStore.lotes]);
  
  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const cardAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  // Configuración de secciones
  const farmSections: FarmSection[] = [
    {
      id: 'ponedoras',
      title: 'Gallinas Ponedoras',
      description: 'Gestión completa de lotes de producción de huevos, control de postura y rentabilidad',
      icon: 'egg',
      color: '#F59E0B',
      darkColor: '#FCD34D',
      route: 'ponedoras',
      stats: {
        lotesActivos: ponedorasStore.lotes.filter(l => l.estado === EstadoLote.ACTIVO).length,
        costoUnitario: costosUnitarios.ponedoras
      }
    },
    {
      id: 'levantes',
      title: 'Pollas de Levante',
      description: 'Seguimiento del crecimiento, alimentación y desarrollo de aves jóvenes',
      icon: 'leaf',
      color: '#10B981',
      darkColor: '#6EE7B7',
      route: 'levantes',
      stats: {
        lotesActivos: levantesStore.lotes.filter(l => l.estado === EstadoLote.ACTIVO).length,
        costoUnitario: costosUnitarios.levantes
      }
    },
    {
      id: 'engorde',
      title: 'Pollos de Engorde',
      description: 'Control de peso, alimentación y optimización para producción de carne',
      icon: 'fitness',
      color: '#EF4444',
      darkColor: '#FCA5A5',
      route: 'engorde',
      stats: {
        lotesActivos: engordeStore.lotes.filter(l => l.estado === EstadoLote.ACTIVO).length,
        costoUnitario: costosUnitarios.engorde
      }
    }
  ];


  useEffect(() => {
    // Animación inicial
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Animación escalonada de cards
    const cardAnimations = cardAnims.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        delay: index * 150,
        useNativeDriver: true,
      })
    );

    Animated.stagger(100, cardAnimations).start();
  }, []);

  const handleSectionPress = (route: string) => {
    if (onSectionSelect) {
      onSectionSelect(route);
    } else {
      // Fallback: navegar directamente si no hay callback
      router.push(`/(tabs)/mi-granja?section=${route}` as any);
    }
  };


  const renderSectionCard = (section: FarmSection, index: number) => {
    const cardColor = isDark ? section.darkColor : section.color;
    
    return (
      <Animated.View
        key={section.id}
        style={[
          styles.sectionCard,
          {
            backgroundColor: colors.background.secondary,
            borderColor: colors.border.light,
            opacity: cardAnims[index],
            transform: [{
              scale: cardAnims[index].interpolate({
                inputRange: [0, 1],
                outputRange: [0.9, 1],
              })
            }],
          }
        ]}
      >
        <TouchableOpacity
          style={styles.cardContent}
          onPress={() => handleSectionPress(section.route)}
          activeOpacity={0.9}
        >
          {/* Header compacto */}
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: `${cardColor}20` }]}>
              {section.id === 'ponedoras' && <PonedoraIcon width={24} height={24} fill={cardColor} />}
              {section.id === 'levantes' && <LevanteIcon width={24} height={24} fill={cardColor} />}
              {section.id === 'engorde' && <EngordeIcon width={24} height={24} fill={cardColor} />}
            </View>
            <View style={styles.cardTitleContainer}>
              <Text style={[styles.cardTitle, { color: colors.text.primary }]}>
                {section.title}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
          </View>

          {/* Dos columnas de estadísticas */}
          <View style={styles.cardStatsRow}>
            <View style={styles.statColumn}>
              <Text style={[styles.statValue, { color: cardColor }]}>
                {section.stats.lotesActivos}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                Lotes Activos
              </Text>
            </View>
            <View style={styles.statColumn}>
              <Text style={[styles.statValue, { color: cardColor }]}>
                ${section.stats.costoUnitario.toFixed(2)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                Costo Unitario
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderQuickActions = () => (
    <Animated.View
      style={[
        styles.quickActionsContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }
      ]}
    >
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
        Acciones Rápidas
      </Text>
      
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity
          style={[styles.quickActionItem, { backgroundColor: colors.background.secondary }]}
          onPress={() => router.push('/(tabs)/gastos')}
        >
          <Ionicons name="cash" size={24} color={colors.primary[500]} />
          <Text style={[styles.quickActionText, { color: colors.text.primary }]}>Gastos</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.quickActionItem, { backgroundColor: colors.background.secondary }]}
          onPress={() => router.push('/(tabs)/ventas')}
        >
          <Ionicons name="storefront" size={24} color={colors.primary[500]} />
          <Text style={[styles.quickActionText, { color: colors.text.primary }]}>Ventas</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.quickActionItem, { backgroundColor: colors.background.secondary }]}
          onPress={() => router.push('/(tabs)/index' as any)}
        >
          <Ionicons name="analytics" size={24} color={colors.primary[500]} />
          <Text style={[styles.quickActionText, { color: colors.text.primary }]}>Dashboard</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >


      {/* Secciones principales */}
      <View style={styles.sectionsContainer}>
en 
        
        <View style={styles.sectionsGrid}>
          {farmSections.map((section, index) => renderSectionCard(section, index))}
        </View>
      </View>

      {/* Acciones rápidas */}
      {renderQuickActions()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing[4],
    paddingBottom: spacing[12], // Espacio para SubTabBar
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing[6],
    paddingVertical: spacing[4],
  },
  heroContent: {
    alignItems: 'center',
  },
  heroIcon: {
    width: 80,
    height: 80,
    marginBottom: spacing[3],
    opacity: 0.9,
  },
  heroTitle: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold as '700',
    textAlign: 'center',
    marginBottom: spacing[2],
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: typography.sizes.lg,
    textAlign: 'center',
    lineHeight: typography.sizes.lg * 1.4,
    maxWidth: width * 0.8,
  },

  // Sections
  sectionsContainer: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as '700',
    marginBottom: spacing[4],
    letterSpacing: -0.3,
  },
  sectionsGrid: {
    gap: spacing[4],
  },
  sectionCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    ...shadows.md,
  },
  cardContent: {
    padding: spacing[3],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold as '700',
  },
  cardStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[4],
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as '700',
    marginBottom: spacing[1],
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    textAlign: 'center',
  },

  // Quick Actions
  quickActionsContainer: {
    marginBottom: spacing[4],
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  quickActionItem: {
    flex: 1,
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  quickActionText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium as '500',
    marginTop: spacing[2],
  },

  // Info Section
  infoSection: {
    marginBottom: spacing[4],
  },
  infoCard: {
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    ...shadows.sm,
  },
  infoGrid: {
    gap: spacing[3],
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  infoText: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.4,
  },
});
