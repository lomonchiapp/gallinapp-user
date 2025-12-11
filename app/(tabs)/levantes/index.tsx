/**
 * Redirección desde tab antiguo de Levantes a Mi Granja
 */

import { Redirect } from 'expo-router';
import React from 'react';

export default function LevantesRedirect() {
  return <Redirect href="/(tabs)/mi-granja/levantes" />;
}
