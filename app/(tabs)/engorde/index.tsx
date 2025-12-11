/**
 * Redirección desde tab antiguo de Engorde a Mi Granja
 */

import { Redirect } from 'expo-router';
import React from 'react';

export default function EngordeRedirect() {
  return <Redirect href="/(tabs)/mi-granja/engorde" />;
}
