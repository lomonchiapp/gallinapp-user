/**
 * useClientes - Hook para gestión de clientes
 * 
 * Maneja:
 * - Estado de clientes
 * - Creación y actualización de clientes
 * - Búsqueda y filtrado
 * - Validación de datos
 */

import { useCallback, useEffect, useState } from 'react';
import { doc, collection, getDocs, query, where, orderBy, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../components/config/firebase';
import { Cliente } from '../types/facturacion';
import { requireAuth } from '../services/auth.service';

export interface CrearCliente {
  nombre: string;
  documento?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  departamento?: string;
}

interface UseClientesReturn {
  // Estado
  clientes: Cliente[];
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  crearCliente: (datos: CrearCliente) => Promise<Cliente | null>;
  actualizarCliente: (id: string, datos: Partial<Cliente>) => Promise<void>;
  getClientes: () => Promise<void>;
  
  // Utilidades
  buscarClientes: (termino: string) => Cliente[];
  getClientePorId: (id: string) => Cliente | null;
  clearError: () => void;
}

export const useClientes = (): UseClientesReturn => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carga todos los clientes del usuario
   */
  const getClientes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const userId = requireAuth();
      const q = query(
        collection(db, 'clientes'),
        where('createdBy', '==', userId),
        orderBy('nombre')
      );
      
      const querySnapshot = await getDocs(q);
      const clientesData: Cliente[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        clientesData.push({
          id: doc.id,
          ...data,
        } as Cliente);
      });
      
      setClientes(clientesData);
      console.log(`✅ [useClientes] ${clientesData.length} clientes cargados`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar clientes';
      setError(errorMessage);
      console.error('❌ [useClientes] Error al cargar clientes:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Crea un nuevo cliente
   */
  const crearCliente = useCallback(async (datos: CrearCliente): Promise<Cliente | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('👤 [useClientes] Creando cliente:', datos.nombre);
      
      // Validaciones básicas
      if (!datos.nombre?.trim()) {
        throw new Error('El nombre del cliente es requerido');
      }
      
      const userId = requireAuth();
      
      // Verificar si ya existe un cliente con el mismo nombre
      const clienteExistente = clientes.find(c => 
        c.nombre.toLowerCase() === datos.nombre.toLowerCase()
      );
      
      if (clienteExistente) {
        console.log('ℹ️ [useClientes] Cliente ya existe, retornando existente');
        return clienteExistente;
      }
      
      // Crear cliente en Firebase
      const clienteRef = await addDoc(collection(db, 'clientes'), {
        ...datos,
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      const nuevoCliente: Cliente = {
        id: clienteRef.id,
        ...datos,
      };
      
      // Actualizar estado local
      setClientes(prev => [nuevoCliente, ...prev]);
      
      console.log(`✅ [useClientes] Cliente ${nuevoCliente.nombre} creado`);
      return nuevoCliente;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear cliente';
      setError(errorMessage);
      console.error('❌ [useClientes] Error al crear cliente:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [clientes]);

  /**
   * Actualiza un cliente existente
   */
  const actualizarCliente = useCallback(async (id: string, datos: Partial<Cliente>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('✏️ [useClientes] Actualizando cliente:', id);
      
      const clienteRef = doc(db, 'clientes', id);
      await updateDoc(clienteRef, {
        ...datos,
        updatedAt: serverTimestamp(),
      });
      
      // Actualizar estado local
      setClientes(prev => prev.map(cliente => 
        cliente.id === id ? { ...cliente, ...datos } : cliente
      ));
      
      console.log(`✅ [useClientes] Cliente ${id} actualizado`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar cliente';
      setError(errorMessage);
      console.error('❌ [useClientes] Error al actualizar cliente:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Busca clientes por término
   */
  const buscarClientes = useCallback((termino: string): Cliente[] => {
    if (!termino.trim()) return clientes;
    
    const terminoLower = termino.toLowerCase();
    return clientes.filter(cliente => 
      cliente.nombre.toLowerCase().includes(terminoLower) ||
      cliente.documento?.toLowerCase().includes(terminoLower) ||
      cliente.telefono?.includes(termino)
    );
  }, [clientes]);

  /**
   * Obtiene un cliente por ID
   */
  const getClientePorId = useCallback((id: string): Cliente | null => {
    return clientes.find(cliente => cliente.id === id) || null;
  }, [clientes]);

  /**
   * Limpia el error actual
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cargar clientes al montar el hook
  useEffect(() => {
    getClientes();
  }, [getClientes]);

  return {
    // Estado
    clientes,
    isLoading,
    error,
    
    // Acciones
    crearCliente,
    actualizarCliente,
    getClientes,
    
    // Utilidades
    buscarClientes,
    getClientePorId,
    clearError,
  };
};




