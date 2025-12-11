/**
 * Componente wrapper para iconos SVG personalizados
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

interface SvgIconProps {
  width?: number;
  height?: number;
  fill?: string;
  viewBox?: string;
  children: React.ReactNode;
}

export const SvgIcon: React.FC<SvgIconProps> = ({
  width = 24,
  height = 24,
  fill = '#000000',
  viewBox = '0 0 24 24',
  children,
}) => {
  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height} viewBox={viewBox} fill={fill}>
        {children}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});



