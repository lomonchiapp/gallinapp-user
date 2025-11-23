/**
 * ClienteSelector - Selector de clientes con creación rápida
 * 
 * Características:
 * - Lista de clientes existentes
 * - Búsqueda en tiempo real
 * - Creación rápida de nuevos clientes
 * - Validación automática
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { colors } from '../../constants/colors';
import { Cliente } from '../../types/facturacion';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

interface ClienteSelectorProps {
  clientes: Cliente[];
  visible: boolean;
  onClose: () => void;
  onSelectCliente: (cliente: Cliente) => void;
  onCreateCliente: (datos: { nombre: string; telefono?: string; email?: string }) => Promise<Cliente | null>;
  isLoading?: boolean;
}

export const ClienteSelector: React.FC<ClienteSelectorProps> = ({
  clientes,
  visible,
  onClose,
  onSelectCliente,
  onCreateCliente,
  isLoading = false,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '',
    telefono: '',
    email: '',
  });

  // Filtrar clientes por búsqueda
  const clientesFiltrados = busqueda 
    ? clientes.filter(cliente => 
        cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        cliente.documento?.toLowerCase().includes(busqueda.toLowerCase()) ||
        cliente.telefono?.includes(busqueda)
      )
    : clientes;

  const handleSelectCliente = (cliente: Cliente) => {
    onSelectCliente(cliente);
    handleClose();
  };

  const handleCreateCliente = async () => {
    if (!nuevoCliente.nombre.trim()) {
      Alert.alert('Error', 'El nombre del cliente es requerido');
      return;
    }

    try {
      const cliente = await onCreateCliente(nuevoCliente);
      if (cliente) {
        setNuevoCliente({ nombre: '', telefono: '', email: '' });
        setShowCreateForm(false);
        onSelectCliente(cliente);
        handleClose();
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear el cliente');
    }
  };

  const handleClose = () => {
    setBusqueda('');
    setShowCreateForm(false);
    setNuevoCliente({ nombre: '', telefono: '', email: '' });
    onClose();
  };

  const renderClienteCard = (cliente: Cliente) => (
    <TouchableOpacity
      key={cliente.id}
      style={styles.clienteCard}
      onPress={() => handleSelectCliente(cliente)}
    >
      <View style={styles.clienteHeader}>
        <View style={styles.clienteInfo}>
          <Text style={styles.clienteNombre}>{cliente.nombre}</Text>
          {cliente.documento && (
            <Text style={styles.clienteDocumento}>{cliente.documento}</Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMedium} />
      </View>
      
      {(cliente.telefono || cliente.email) && (
        <View style={styles.clienteContacto}>
          {cliente.telefono && (
            <View style={styles.contactoItem}>
              <Ionicons name="call-outline" size={14} color={colors.textMedium} />
              <Text style={styles.contactoText}>{cliente.telefono}</Text>
            </View>
          )}
          {cliente.email && (
            <View style={styles.contactoItem}>
              <Ionicons name="mail-outline" size={14} color={colors.textMedium} />
              <Text style={styles.contactoText}>{cliente.email}</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Seleccionar Cliente</Text>
          <TouchableOpacity onPress={() => setShowCreateForm(true)}>
            <Ionicons name="add" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {!showCreateForm ? (
          <>
            {/* Búsqueda */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={colors.textMedium} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar clientes..."
                value={busqueda}
                onChangeText={setBusqueda}
                placeholderTextColor={colors.textMedium}
              />
            </View>

            {/* Lista de clientes */}
            <ScrollView style={styles.clientesList} showsVerticalScrollIndicator={false}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Cargando clientes...</Text>
                </View>
              ) : clientesFiltrados.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="people-outline" size={48} color={colors.textMedium} />
                  <Text style={styles.emptyText}>
                    {busqueda ? 'No se encontraron clientes' : 'No hay clientes registrados'}
                  </Text>
                  <TouchableOpacity 
                    style={styles.createFirstButton}
                    onPress={() => setShowCreateForm(true)}
                  >
                    <Text style={styles.createFirstText}>Crear primer cliente</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                clientesFiltrados.map(renderClienteCard)
              )}
            </ScrollView>
          </>
        ) : (
          /* Formulario de creación */
          <View style={styles.createForm}>
            <Text style={styles.createTitle}>Nuevo Cliente</Text>
            
            <Input
              label="Nombre *"
              value={nuevoCliente.nombre}
              onChangeText={(text) => setNuevoCliente(prev => ({ ...prev, nombre: text }))}
              placeholder="Nombre del cliente"
              style={styles.input}
            />
            
            <Input
              label="Teléfono"
              value={nuevoCliente.telefono}
              onChangeText={(text) => setNuevoCliente(prev => ({ ...prev, telefono: text }))}
              placeholder="Teléfono (opcional)"
              keyboardType="phone-pad"
              style={styles.input}
            />
            
            <Input
              label="Email"
              value={nuevoCliente.email}
              onChangeText={(text) => setNuevoCliente(prev => ({ ...prev, email: text }))}
              placeholder="Email (opcional)"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
            
            <View style={styles.createButtons}>
              <Button
                title="Cancelar"
                onPress={() => setShowCreateForm(false)}
                style={[styles.button, styles.cancelButton]}
                titleStyle={styles.cancelButtonText}
              />
              <Button
                title="Crear Cliente"
                onPress={handleCreateCliente}
                style={[styles.button, styles.createButton]}
                disabled={!nuevoCliente.nombre.trim()}
              />
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: colors.text,
  },
  clientesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  clienteCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clienteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clienteInfo: {
    flex: 1,
  },
  clienteNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  clienteDocumento: {
    fontSize: 14,
    color: colors.textMedium,
    marginTop: 2,
  },
  clienteContacto: {
    marginTop: 8,
    gap: 4,
  },
  contactoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactoText: {
    fontSize: 14,
    color: colors.textMedium,
    marginLeft: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textMedium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textMedium,
    textAlign: 'center',
    marginTop: 12,
  },
  createFirstButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  createFirstText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  createForm: {
    flex: 1,
    padding: 16,
  },
  createTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 20,
  },
  input: {
    marginBottom: 16,
  },
  createButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    color: colors.text,
  },
  createButton: {
    backgroundColor: colors.primary,
  },
});




