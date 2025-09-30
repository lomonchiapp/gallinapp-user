/**
 * Pantalla de gestión de clientes
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { Input } from '../../../src/components/ui/Input';
import { colors } from '../../../src/constants/colors';
import { useFacturacion } from '../../../src/hooks/useFacturacion';
import { Cliente, CrearCliente } from '../../../src/types/facturacion';

export default function ClientesScreen() {
  const { clientes, loading, crearCliente, actualizarCliente, refrescarDatos } = useFacturacion();

  const [modalNuevoCliente, setModalNuevoCliente] = useState(false);
  const [modalEditarCliente, setModalEditarCliente] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [busqueda, setBusqueda] = useState('');
  const [nuevoCliente, setNuevoCliente] = useState<CrearCliente>({
    nombre: '',
    documento: '',
    telefono: '',
    email: '',
    direccion: '',
    ciudad: '',
    departamento: '',
  });
  const [clienteEdicion, setClienteEdicion] = useState<Partial<Cliente>>({});

  const onRefresh = async () => {
    setRefreshing(true);
    await refrescarDatos();
    setRefreshing(false);
  };

  const limpiarFormularioNuevo = () => {
    setNuevoCliente({
      nombre: '',
      documento: '',
      telefono: '',
      email: '',
      direccion: '',
      ciudad: '',
      departamento: '',
    });
  };

  const clientesFiltrados = useMemo(() => {
    if (!busqueda.trim()) {
      return clientes;
    }
    const termino = busqueda.toLowerCase();
    return clientes.filter((cliente) =>
      [
        cliente.nombre,
        cliente.documento,
        cliente.telefono,
        cliente.email,
        cliente.ciudad,
      ]
        .filter(Boolean)
        .some((valor) => valor!.toLowerCase().includes(termino))
    );
  }, [clientes, busqueda]);

  const estadisticas = useMemo(() => {
    const totalConDocumento = clientes.filter((c) => !!c.documento).length;
    const totalConEmail = clientes.filter((c) => !!c.email).length;
    const totalConTelefono = clientes.filter((c) => !!c.telefono).length;

    const ordenadosPorRecientes = [...clientes]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);

    return {
      total: clientes.length,
      conDocumento: totalConDocumento,
      conEmail: totalConEmail,
      conTelefono: totalConTelefono,
      recientes: ordenadosPorRecientes,
    };
  }, [clientes]);

  const handleCrearCliente = async () => {
    if (!nuevoCliente.nombre.trim()) {
      Alert.alert('Error', 'El nombre del cliente es requerido');
      return;
    }

    const resultado = await crearCliente(nuevoCliente);
    if (resultado) {
      limpiarFormularioNuevo();
      setModalNuevoCliente(false);
      Alert.alert('Éxito', 'Cliente creado correctamente');
    }
  };

  const abrirModalEditar = (cliente: Cliente) => {
    setClienteEditando(cliente);
    setClienteEdicion({
      nombre: cliente.nombre,
      documento: cliente.documento,
      telefono: cliente.telefono,
      email: cliente.email,
      direccion: cliente.direccion,
      ciudad: cliente.ciudad,
      departamento: cliente.departamento,
    });
    setModalEditarCliente(true);
  };

  const handleEditarCliente = async () => {
    if (!clienteEditando) return;

    if (!clienteEdicion.nombre?.trim()) {
      Alert.alert('Error', 'El nombre del cliente es requerido');
      return;
    }

    const resultado = await actualizarCliente(clienteEditando.id, clienteEdicion);
    if (resultado) {
      setModalEditarCliente(false);
      setClienteEditando(null);
      setClienteEdicion({});
      Alert.alert('Éxito', 'Cliente actualizado correctamente');
    }
  };

  const cerrarModalEditar = () => {
    setModalEditarCliente(false);
    setClienteEditando(null);
    setClienteEdicion({});
  };

  if (loading && clientes.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando clientes...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Card style={[styles.sectionCard, styles.heroCard]}>
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.heroLabel}>Directorio de clientes</Text>
            <Text style={styles.heroTitle}>Gestión de relaciones</Text>
          </View>
          <TouchableOpacity
            style={styles.heroAction}
            onPress={() => setModalNuevoCliente(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="person-add" size={16} color={colors.white} />
            <Text style={styles.heroActionText}>Nuevo cliente</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.heroBody}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{estadisticas.total}</Text>
            <Text style={styles.heroStatLabel}>Clientes registrados</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{estadisticas.conDocumento}</Text>
            <Text style={styles.heroStatLabel}>Con documento</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{estadisticas.conEmail}</Text>
            <Text style={styles.heroStatLabel}>Contactables por email</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Búsqueda inteligente</Text>
        </View>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.lightGray} />
          <TextInput
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Busca por nombre, documento, email o ciudad"
            placeholderTextColor={colors.lightGray}
            style={styles.searchInput}
          />
          {busqueda ? (
            <TouchableOpacity onPress={() => setBusqueda('')}>
              <Ionicons name="close-circle" size={18} color={colors.lightGray} />
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.filtersRow}>
          <View style={styles.filterBadge}>
            <Ionicons name="mail" size={14} color={colors.primary} />
            <Text style={styles.filterBadgeText}>{estadisticas.conEmail} con email</Text>
          </View>
          <View style={styles.filterBadge}>
            <Ionicons name="call" size={14} color={colors.secondary} />
            <Text style={styles.filterBadgeText}>{estadisticas.conTelefono} con teléfono</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Clientes recientes</Text>
        </View>
        {estadisticas.recientes.length === 0 ? (
          <Text style={styles.emptySmall}>Aún no hay clientes registrados.</Text>
        ) : (
          <View style={styles.recentList}>
            {estadisticas.recientes.map((cliente) => (
              <View key={cliente.id} style={styles.recentItem}>
                <View style={styles.recentAvatar}>
                  <Text style={styles.recentAvatarText}>{cliente.nombre.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.recentInfo}>
                  <Text style={styles.recentName}>{cliente.nombre}</Text>
                  <Text style={styles.recentMeta}>
                    {cliente.ciudad || 'Sin ciudad'} · {cliente.createdAt ? new Date(cliente.createdAt).toLocaleDateString('es-CO') : 'Sin fecha'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </Card>

      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Todos los clientes</Text>
          <Text style={styles.sectionSubtitle}>{clientesFiltrados.length} resultados</Text>
        </View>

        {clientesFiltrados.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={52} color={colors.lightGray} />
            <Text style={styles.emptyTitle}>No encontramos coincidencias</Text>
            <Text style={styles.emptySubtitle}>
              Ajusta tu búsqueda o registra un nuevo cliente para comenzar a facturar.
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => setModalNuevoCliente(true)}>
              <Text style={styles.emptyButtonText}>Registrar cliente</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.clientList}>
            {clientesFiltrados.map((cliente) => (
              <View key={cliente.id} style={styles.clientItem}>
                <View style={styles.clientIcon}>
                  <Text style={styles.clientLetter}>{cliente.nombre.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.clientInfo}>
                  <View style={styles.clientInfoHeader}>
                    <Text style={styles.clientName}>{cliente.nombre}</Text>
                    {cliente.documento ? (
                      <View style={styles.clientTag}>
                        <Ionicons name="id-card" size={12} color={colors.secondary} />
                        <Text style={styles.clientTagText}>{cliente.documento}</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.clientContacts}>
                    {cliente.telefono ? (
                      <View style={styles.clientContactRow}>
                        <Ionicons name="call" size={14} color={colors.primary} />
                        <Text style={styles.clientContactText}>{cliente.telefono}</Text>
                      </View>
                    ) : null}
                    {cliente.email ? (
                      <View style={styles.clientContactRow}>
                        <Ionicons name="mail" size={14} color={colors.secondary} />
                        <Text style={styles.clientContactText}>{cliente.email}</Text>
                      </View>
                    ) : null}
                  </View>
                  {cliente.direccion ? (
                    <View style={styles.clientLocation}>
                      <Ionicons name="location" size={13} color={colors.lightGray} />
                      <Text style={styles.clientLocationText}>
                        {cliente.direccion}
                        {cliente.ciudad ? `, ${cliente.ciudad}` : ''}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <TouchableOpacity style={styles.editButton} onPress={() => abrirModalEditar(cliente)}>
                  <Ionicons name="pencil" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </Card>

      {/* Modal Nuevo Cliente */}
      <Modal
        visible={modalNuevoCliente}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nuevo Cliente</Text>
            <TouchableOpacity onPress={() => setModalNuevoCliente(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Input
              label="Nombre *"
              value={nuevoCliente.nombre}
              onChangeText={(text) => setNuevoCliente(prev => ({ ...prev, nombre: text }))}
              placeholder="Nombre completo del cliente"
            />
            
            <Input
              label="Documento"
              value={nuevoCliente.documento}
              onChangeText={(text) => setNuevoCliente(prev => ({ ...prev, documento: text }))}
              placeholder="Cédula, NIT o RUT"
            />
            
            <Input
              label="Teléfono"
              value={nuevoCliente.telefono}
              onChangeText={(text) => setNuevoCliente(prev => ({ ...prev, telefono: text }))}
              placeholder="Número de contacto"
              keyboardType="phone-pad"
            />
            
            <Input
              label="Email"
              value={nuevoCliente.email}
              onChangeText={(text) => setNuevoCliente(prev => ({ ...prev, email: text }))}
              placeholder="Correo electrónico"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <Input
              label="Dirección"
              value={nuevoCliente.direccion}
              onChangeText={(text) => setNuevoCliente(prev => ({ ...prev, direccion: text }))}
              placeholder="Dirección completa"
            />
            
            <Input
              label="Ciudad"
              value={nuevoCliente.ciudad}
              onChangeText={(text) => setNuevoCliente(prev => ({ ...prev, ciudad: text }))}
              placeholder="Ciudad"
            />
            
            <Input
              label="Departamento"
              value={nuevoCliente.departamento}
              onChangeText={(text) => setNuevoCliente(prev => ({ ...prev, departamento: text }))}
              placeholder="Departamento o Estado"
            />
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button
              title="Cancelar"
              onPress={() => setModalNuevoCliente(false)}
              style={[styles.modalButton, styles.cancelButton]}
            />
            <Button
              title={loading ? 'Guardando...' : 'Crear Cliente'}
              onPress={handleCrearCliente}
              disabled={loading}
              style={[styles.modalButton, styles.crearButton]}
            />
          </View>
        </View>
      </Modal>

      {/* Modal Editar Cliente */}
      <Modal
        visible={modalEditarCliente}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Editar Cliente</Text>
            <TouchableOpacity onPress={cerrarModalEditar}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Input
              label="Nombre *"
              value={clienteEdicion.nombre || ''}
              onChangeText={(text) => setClienteEdicion(prev => ({ ...prev, nombre: text }))}
              placeholder="Nombre completo del cliente"
            />
            
            <Input
              label="Documento"
              value={clienteEdicion.documento || ''}
              onChangeText={(text) => setClienteEdicion(prev => ({ ...prev, documento: text }))}
              placeholder="Cédula, NIT o RUT"
            />
            
            <Input
              label="Teléfono"
              value={clienteEdicion.telefono || ''}
              onChangeText={(text) => setClienteEdicion(prev => ({ ...prev, telefono: text }))}
              placeholder="Número de contacto"
              keyboardType="phone-pad"
            />
            
            <Input
              label="Email"
              value={clienteEdicion.email || ''}
              onChangeText={(text) => setClienteEdicion(prev => ({ ...prev, email: text }))}
              placeholder="Correo electrónico"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <Input
              label="Dirección"
              value={clienteEdicion.direccion || ''}
              onChangeText={(text) => setClienteEdicion(prev => ({ ...prev, direccion: text }))}
              placeholder="Dirección completa"
            />
            
            <Input
              label="Ciudad"
              value={clienteEdicion.ciudad || ''}
              onChangeText={(text) => setClienteEdicion(prev => ({ ...prev, ciudad: text }))}
              placeholder="Ciudad"
            />
            
            <Input
              label="Departamento"
              value={clienteEdicion.departamento || ''}
              onChangeText={(text) => setClienteEdicion(prev => ({ ...prev, departamento: text }))}
              placeholder="Departamento o Estado"
            />
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button
              title="Cancelar"
              onPress={cerrarModalEditar}
              style={[styles.modalButton, styles.cancelButton]}
            />
            <Button
              title={loading ? 'Guardando...' : 'Actualizar Cliente'}
              onPress={handleEditarCliente}
              disabled={loading}
              style={[styles.modalButton, styles.crearButton]}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textDark,
  },
  sectionCard: {
    marginBottom: 16,
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: 18,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginBottom: 4,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '700',
  },
  heroAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    gap: 6,
  },
  heroActionText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 13,
  },
  heroBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroStat: {
    flex: 1,
  },
  heroStatValue: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 4,
  },
  heroDivider: {
    width: 1,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.lightGray,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textDark,
    paddingVertical: 6,
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  filterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
  },
  filterBadgeText: {
    fontSize: 12,
    color: colors.textDark,
    fontWeight: '500',
  },
  recentList: {
    gap: 12,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  recentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentAvatarText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  recentInfo: {
    flex: 1,
  },
  recentName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textDark,
  },
  recentMeta: {
    fontSize: 12,
    color: colors.lightGray,
    marginTop: 2,
  },
  emptySmall: {
    fontSize: 13,
    color: colors.lightGray,
  },
  clientList: {
    borderTopWidth: 1,
    borderTopColor: colors.veryLightGray,
  },
  clientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
    gap: 12,
  },
  clientIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientLetter: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  clientInfo: {
    flex: 1,
    gap: 6,
  },
  clientInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
  },
  clientTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(50,130,184,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  clientTagText: {
    fontSize: 11,
    color: colors.secondary,
    fontWeight: '500',
  },
  clientContacts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  clientContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clientContactText: {
    fontSize: 13,
    color: colors.textDark,
  },
  clientLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clientLocationText: {
    fontSize: 12,
    color: colors.lightGray,
  },
  editButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 16,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textDark,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.lightGray,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 18,
  },
  emptyButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 13,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.veryLightGray,
  },
  modalButton: {
    flex: 1,
  },
  cancelButton: {
    backgroundColor: colors.lightGray,
  },
  crearButton: {
    backgroundColor: colors.primary,
  },
});








