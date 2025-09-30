/**
 * Pantalla de registro
 */

import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import RegisterForm from '../../src/components/forms/RegisterForm';

export default function RegisterScreen() {
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <RegisterForm />
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

