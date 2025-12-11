/**
 * Pantalla de bienvenida cuando no hay granja configurada
 * Permite crear una nueva granja o unirse a una existente
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../../components/theme-provider';
import { borderRadius, shadows, spacing, typography } from '../../constants/designSystem';
import { useMultiTenantAuthStore } from '../../stores/multiTenantAuthStore';
import { CreateFarmModal } from '../onboarding/CreateFarmModal';
import { JoinFarmModal } from '../onboarding/JoinFarmModal';

interface FarmOnboardingScreenProps {
  onFarmCreated?: () => void;
}

export const FarmOnboardingScreen: React.FC<FarmOnboardingScreenProps> = ({
  onFarmCreated,
}) => {
  const { colors, isDark } = useTheme();
  const { user } = useMultiTenantAuthStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  
  // Obtener nombre del usuario
  const userName = user?.displayName || user?.email?.split('@')[0] || 'Usuario';
  
  // Animaciones para el fondo
  const gradientAnim1 = useRef(new Animated.Value(0)).current;
  const gradientAnim2 = useRef(new Animated.Value(0)).current;
  const gradientAnim3 = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Animaciones para los botones
  const createButtonScale = useRef(new Animated.Value(1)).current;
  const joinButtonScale = useRef(new Animated.Value(1)).current;
  const createButtonOpacity = useRef(new Animated.Value(0)).current;
  const joinButtonOpacity = useRef(new Animated.Value(0)).current;
  
  // Animar fondo continuamente
  useEffect(() => {
    // Animaciones de gradientes circulares
    Animated.loop(
      Animated.parallel([
        Animated.timing(gradientAnim1, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: false,
        }),
        Animated.timing(gradientAnim2, {
          toValue: 1,
          duration: 10000,
          useNativeDriver: false,
        }),
        Animated.timing(gradientAnim3, {
          toValue: 1,
          duration: 12000,
          useNativeDriver: false,
        }),
      ])
    ).start();
    
    // Animación de pulso
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 3000,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);
  
  // Animar entrada de botones
  useEffect(() => {
    Animated.parallel([
      Animated.spring(createButtonScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(createButtonOpacity, {
        toValue: 1,
        duration: 400,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.spring(joinButtonScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay: 400,
        useNativeDriver: true,
      }),
      Animated.timing(joinButtonOpacity, {
        toValue: 1,
        duration: 400,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  const handleCreatePress = () => {
    // Animación de presión
    Animated.sequence([
      Animated.timing(createButtonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(createButtonScale, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
    setShowCreateModal(true);
  };
  
  const handleJoinPress = () => {
    // Animación de presión
    Animated.sequence([
      Animated.timing(joinButtonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(joinButtonScale, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
    setShowJoinModal(true);
  };

  const handleFarmCreated = () => {
    setShowCreateModal(false);
    if (onFarmCreated) {
      onFarmCreated();
    }
  };

  const handleJoinRequestSent = () => {
    setShowJoinModal(false);
    // El usuario será notificado cuando su solicitud sea aprobada
  };

  const features = [
    {
      icon: 'egg',
      title: 'Gestión de Lotes',
      description: 'Controla ponedoras, levantes y engorde',
      color: colors.primary[500],
    },
    {
      icon: 'analytics',
      title: 'Análisis en Tiempo Real',
      description: 'Seguimiento de producción y costos',
      color: colors.secondary[500] || colors.primary[600],
    },
    {
      icon: 'people',
      title: 'Colaboración',
      description: 'Trabaja en equipo con códigos de acceso',
      color: colors.primary[400],
    },
    {
      icon: 'trending-up',
      title: 'Reportes Avanzados',
      description: 'Análisis financiero y proyecciones',
      color: colors.primary[300],
    },
  ];

  // Colores para el fondo animado
  const primaryColor = colors.primary[500];
  const secondaryColor = colors.primary[400] || colors.primary[500];
  const tertiaryColor = colors.primary[300] || colors.primary[400];
  
  // Interpolaciones para los gradientes animados
  const gradient1X = gradientAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  const gradient1Y = gradientAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  
  const gradient2X = gradientAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: ['100%', '0%'],
  });
  const gradient2Y = gradientAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: ['100%', '0%'],
  });
  
  const gradient3X = gradientAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: ['50%', '150%'],
  });
  const gradient3Y = gradientAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: ['50%', '-50%'],
  });

  return (
    <>
      <View style={styles.backgroundContainer}>
        {/* Fondo animado con gradientes */}
        <Animated.View
          style={[
            styles.animatedGradient1,
            {
              backgroundColor: `${primaryColor}15`,
              transform: [
                { translateX: gradient1X },
                { translateY: gradient1Y },
                { scale: pulseAnim },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.animatedGradient2,
            {
              backgroundColor: `${secondaryColor}10`,
              transform: [
                { translateX: gradient2X },
                { translateY: gradient2Y },
                { scale: pulseAnim },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.animatedGradient3,
            {
              backgroundColor: `${tertiaryColor}08`,
              transform: [
                { translateX: gradient3X },
                { translateY: gradient3Y },
                { scale: pulseAnim },
              ],
            },
          ]}
        />
        
        {/* Gradiente base */}
        <LinearGradient
          colors={
            isDark
              ? [
                  colors.background.primary,
                  `${colors.primary[900]}20`,
                  colors.background.primary,
                ]
              : [
                  colors.background.primary,
                  `${colors.primary[50]}40`,
                  colors.background.primary,
                ]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../../assets/images/full-logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            
            <Text style={[styles.heroTitle, { color: colors.text.primary }]}>
              Bienvenido{'\n'}
              <Text style={[styles.heroTitleName, { color: colors.primary[500] }]}>
                {userName}
              </Text>
            </Text>
            <Text style={[styles.heroSubtitle, { color: colors.text.secondary }]}>
              Conoce tu producción!
            </Text>
          </View>

          {/* Features Horizontal List */}
          <View style={styles.featuresSection}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              ¿Qué puedes hacer?
            </Text>
            <FlatList
              data={features}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuresList}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item, index }) => (
                <View
                  style={[
                    styles.featureCard,
                    {
                      backgroundColor: colors.background.secondary,
                      borderColor: colors.border.light,
                    },
                  ]}
                >
                  <View style={[styles.featureIcon, { backgroundColor: `${item.color}20` }]}>
                    <Ionicons name={item.icon} size={20} color={item.color} />
                  </View>
                  <Text style={[styles.featureTitle, { color: colors.text.primary }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.featureDescription, { color: colors.text.secondary }]}>
                    {item.description}
                  </Text>
                </View>
              )}
            />
          </View>

          {/* CTA Section */}
          <View style={styles.ctaSection}>
            <Text style={[styles.ctaTitle, { color: colors.text.primary }]}>
              Comienza ahora
            </Text>
            <Text style={[styles.ctaSubtitle, { color: colors.text.secondary }]}>
              Crea tu primera granja o únete a una existente
            </Text>

            <View style={styles.ctaButtons}>
              <Animated.View
                style={{
                  transform: [{ scale: createButtonScale }],
                  opacity: createButtonOpacity,
                }}
              >
                <TouchableOpacity
                  onPress={handleCreatePress}
                  activeOpacity={0.9}
                  style={styles.primaryButtonWrapper}
                >
                  <LinearGradient
                    colors={[colors.primary[500], colors.primary[600] || colors.primary[500]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryButton}
                  >
                    <View style={styles.buttonContent}>
                      <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                        <Ionicons name="add-circle" size={22} color={colors.text.inverse} />
                      </View>
                      <Text style={[styles.buttonText, { color: colors.text.inverse }]}>
                        Crear Mi Granja
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              <Animated.View
                style={{
                  transform: [{ scale: joinButtonScale }],
                  opacity: joinButtonOpacity,
                }}
              >
                <TouchableOpacity
                  onPress={handleJoinPress}
                  activeOpacity={0.9}
                  style={styles.secondaryButtonWrapper}
                >
                  <View
                    style={[
                      styles.secondaryButton,
                      {
                        backgroundColor: colors.background.secondary,
                        borderColor: colors.primary[500],
                      },
                    ]}
                  >
                    <View style={styles.buttonContent}>
                      <View style={[styles.iconContainer, { backgroundColor: `${colors.primary[500]}15` }]}>
                        <Ionicons name="people" size={22} color={colors.primary[500]} />
                      </View>
                      <Text style={[styles.buttonText, { color: colors.primary[500] }]}>
                        Unirse a una Granja
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>

              {/* Botón de ayuda */}
              <TouchableOpacity
                style={styles.helpButton}
                onPress={() => {
                  // TODO: Navegar a tutorial o ayuda
                  console.log('Aprende a usar Gallinapp');
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="help-circle-outline" size={18} color={colors.text.secondary} />
                <Text style={[styles.helpButtonText, { color: colors.text.secondary }]}>
                  Aprende a usar Gallinapp
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modales */}
      <CreateFarmModal
        isVisible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onFarmCreated={handleFarmCreated}
      />

      <JoinFarmModal
        isVisible={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onRequestSent={handleJoinRequestSent}
      />
    </>
  );
};

const styles = StyleSheet.create({
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  animatedGradient1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.6,
    top: -100,
    left: -100,
  },
  animatedGradient2: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.4,
    bottom: -150,
    right: -150,
  },
  animatedGradient3: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    opacity: 0.3,
    top: '50%',
    left: '50%',
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
    justifyContent: 'center',
  },
  
  // Hero Section
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing[5],
  },
  logoContainer: {
    marginBottom: spacing[3],
  },
  logo: {
    width: 280,
    height: 100,
  },
  heroTitle: {
    fontSize: typography.sizes['4xl'],
    fontWeight: typography.weights.bold as '700',
    textAlign: 'center',
    marginBottom: spacing[2],
    lineHeight: typography.sizes['4xl'] * 1.2,
  },
  heroTitleName: {
    fontSize: typography.sizes['4xl'],
    fontWeight: typography.weights.bold as '700',
  },
  heroSubtitle: {
    fontSize: typography.sizes.xl,
    textAlign: 'center',
    lineHeight: typography.sizes.xl * 1.4,
    marginBottom: spacing[3],
  },

  // Features Section
  featuresSection: {
    marginBottom: spacing[5],
  },
  sectionTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as '700',
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  featuresList: {
    paddingHorizontal: spacing[2],
    gap: spacing[3],
  },
  featureCard: {
    width: 140,
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    ...shadows.sm,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  featureTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold as '700',
    textAlign: 'center',
    marginBottom: spacing[1],
  },
  featureDescription: {
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    lineHeight: typography.sizes.xs * 1.3,
  },

  // CTA Section
  ctaSection: {
    marginBottom: spacing[3],
  },
  ctaTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as '700',
    textAlign: 'center',
    marginBottom: spacing[1],
  },
  ctaSubtitle: {
    fontSize: typography.sizes.base,
    textAlign: 'center',
    marginBottom: spacing[3],
    lineHeight: typography.sizes.base * 1.5,
  },
  ctaButtons: {
    gap: spacing[3],
  },
  primaryButtonWrapper: {
    borderRadius: borderRadius.xl,
    ...shadows.xl,
    overflow: 'hidden',
  },
  primaryButton: {
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[5],
    borderRadius: borderRadius.xl,
    minHeight: 56,
    justifyContent: 'center',
  },
  secondaryButtonWrapper: {
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    ...shadows.md,
  },
  secondaryButton: {
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[5],
    borderRadius: borderRadius.xl,
    minHeight: 56,
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as '700',
    letterSpacing: 0.3,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[3],
    gap: spacing[2],
    marginTop: spacing[1],
  },
  helpButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium as '500',
  },
});
