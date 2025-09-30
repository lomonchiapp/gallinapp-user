/**
 * Componente DatePicker usando @react-native-community/datetimepicker
 */

import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../constants/colors';

interface DatePickerProps {
  label: string;
  value: string; // Formato YYYY-MM-DD
  onDateChange: (date: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  maximumDate?: Date;
  minimumDate?: Date;
}

export default function DatePicker({
  label,
  value,
  onDateChange,
  placeholder = 'Seleccionar fecha',
  required = false,
  error,
  disabled = false,
  maximumDate,
  minimumDate
}: DatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };
  
  const parseDate = (dateString: string): Date => {
    if (!dateString) return new Date();
    return new Date(dateString);
  };
  
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    
    if (selectedDate) {
      onDateChange(formatDate(selectedDate));
    }
  };
  
  const displayValue = value ? parseDate(value).toLocaleDateString('es-ES') : '';
  
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      
      <TouchableOpacity
        style={[
          styles.input,
          error && styles.inputError,
          disabled && styles.inputDisabled
        ]}
        onPress={() => !disabled && setShowPicker(true)}
        disabled={disabled}
      >
        <Text style={[
          styles.inputText,
          !value && styles.placeholderText
        ]}>
          {value ? displayValue : placeholder}
        </Text>
        <Ionicons 
          name="calendar-outline" 
          size={20} 
          color={disabled ? colors.textLight : colors.primary} 
        />
      </TouchableOpacity>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      {showPicker && (
        <DateTimePicker
          value={parseDate(value)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textDark,
    marginBottom: 8,
  },
  required: {
    color: colors.danger,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.background,
    minHeight: 48,
  },
  inputError: {
    borderColor: colors.danger,
  },
  inputDisabled: {
    backgroundColor: colors.backgroundLight,
    borderColor: colors.borderLight,
  },
  inputText: {
    fontSize: 16,
    color: colors.textDark,
    flex: 1,
  },
  placeholderText: {
    color: colors.textLight,
  },
  errorText: {
    fontSize: 14,
    color: colors.danger,
    marginTop: 4,
  },
});