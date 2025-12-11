/**
 * Pantalla principal de Mi Granja con Landing y sub-tabs
 */

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../../components/theme-provider';
import AppHeader from '../../../src/components/layouts/AppHeader';
import { GranjaLanding } from '../../../src/components/mi-granja/GranjaLanding';
import { ScreenWrapper } from '../../../src/components/navigation/ScreenWrapper';
import { SubTabBar } from '../../../src/components/navigation/SubTabBar';
import { useFarmStore } from '../../../src/stores/farmStore';

// Importar los componentes de cada sección
import EngordeScreen from './engorde';
import LevantesScreen from './levantes';
import PonedorasScreen from './ponedoras';

const subTabs = [
  {
    name: 'ponedoras',
    title: 'Ponedoras',
    icon: 'egg-outline' as keyof typeof Ionicons.glyphMap,
    iconFocused: 'egg' as keyof typeof Ionicons.glyphMap,
    customIcon: 'ponedora' as const,
  },
  {
    name: 'levantes',
    title: 'Levantes',
    icon: 'leaf-outline' as keyof typeof Ionicons.glyphMap,
    iconFocused: 'leaf' as keyof typeof Ionicons.glyphMap,
    customIcon: 'levante' as const,
  },
  {
    name: 'engorde',
    title: 'Engorde',
    icon: 'fitness-outline' as keyof typeof Ionicons.glyphMap,
    iconFocused: 'fitness' as keyof typeof Ionicons.glyphMap,
    customIcon: 'engorde' as const,
  },
];

export default function MiGranjaIndex() {
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const { currentFarm } = useFarmStore();
  
  // Estado para controlar si estamos en el landing o en una sección específica
  const [currentView, setCurrentView] = useState<'landing' | 'section'>('landing');
  const [activeSubTab, setActiveSubTab] = useState<string | null>(null);

  // Manejar navegación desde parámetros de URL
  useEffect(() => {
    if (params.section && typeof params.section === 'string') {
      const validSections = ['ponedoras', 'levantes', 'engorde'];
      if (validSections.includes(params.section)) {
        setActiveSubTab(params.section);
        setCurrentView('section');
      }
    }
  }, [params.section]);

  // Configurar los tabs con las funciones onPress
  const tabsWithHandlers = subTabs.map(tab => ({
    ...tab,
    onPress: () => {
      setActiveSubTab(tab.name);
      setCurrentView('section');
    },
  }));

  const renderActiveScreen = () => {
    switch (activeSubTab) {
      case 'ponedoras':
        return <PonedorasScreen />;
      case 'levantes':
        return <LevantesScreen />;
      case 'engorde':
        return <EngordeScreen />;
      default:
        return <PonedorasScreen />;
    }
  };

  const getScreenTitle = () => {
    if (currentView === 'landing') {
      return '🏡 Mi Granja';
    }
    // Para ponedoras, mostrar "Gallinas" en title1
    if (activeSubTab === 'ponedoras') {
      return 'Gallinas';
    }
    const activeTab = subTabs.find(tab => tab.name === activeSubTab);
    return `${activeTab?.title}`;
  };

  const getScreenTitle2 = () => {
    if (currentView === 'landing') {
      return undefined;
    }
    // Para ponedoras, mostrar "Ponedoras" en title2
    if (activeSubTab === 'ponedoras') {
      return 'Ponedoras';
    }
    return undefined;
  };

  const getScreenSubtitle = () => {
    if (currentView === 'landing') {
      return 'Centro de control de tu operación avícola';
    }
    const subtitles = {
      ponedoras: 'Gestiona tus lotes de producción de huevos',
      levantes: 'Control de crecimiento y desarrollo',
      engorde: 'Optimización de producción de carne',
    };
    return subtitles[activeSubTab as keyof typeof subtitles];
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
    // Limpiar parámetros de URL
    router.replace('/(tabs)/mi-granja');
  };

  const handleSectionSelect = (section: string) => {
    setActiveSubTab(section);
    setCurrentView('section');
  };

  const renderMainContent = () => {
    if (currentView === 'landing') {
      return (
        <>
          <GranjaLanding onSectionSelect={handleSectionSelect} />
          {/* SubTabBar en el landing también - sin tab activo */}
          <SubTabBar
            activeTab={null}
            tabs={tabsWithHandlers}
            isVisible={true}
            animateOnMount={true}
          />
        </>
      );
    }
    
    return (
      <>
        <View style={styles.screenContainer}>
          <View style={styles.screenContent}>
            {renderActiveScreen()}
          </View>
        </View>
        
        {/* SubTabBar fijo en la parte inferior, justo encima de los tabs principales */}
        <SubTabBar
          activeTab={activeSubTab}
          tabs={tabsWithHandlers}
          isVisible={true}
        />
      </>
    );
  };

  return (
    <ScreenWrapper transitionType="slide">
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <AppHeader
          title1={currentView === 'landing' ? 'Mi Granja' : getScreenTitle()}
          title2={currentView === 'landing' && currentFarm ? currentFarm.name : getScreenTitle2()}
          variant="floating"
          showBack={currentView === 'section'}
          onBackPress={currentView === 'section' ? handleBackToLanding : undefined}
          showThemeToggle={true}
          enableBlur={true}
          showFarmSettings={true}
        />

        {renderMainContent()}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
    paddingBottom: 40, // Altura del SubTabBar (45px) + altura del tab principal (45px) + safe area bottom (20px)
  },
  screenContent: {
    flex: 1,
  },
});

