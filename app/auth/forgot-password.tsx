/**
 * Pantalla de recuperación de contraseña
 */

import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import ForgotPasswordForm from '../../src/components/forms/ForgotPasswordForm';

export default function ForgotPasswordScreen() {
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <ForgotPasswordForm />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

