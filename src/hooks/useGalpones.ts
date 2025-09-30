import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { galponesService, suscribirseAGalpones } from '../services/galpones.service';
import { Galpon } from '../types/galpon';

export interface UseGalponesReturn {
  galpones: Galpon[];
  loading: boolean;
  error: string | null;
  cargarGalpones: () => Promise<void>;
  crearGalpon: (nombre: string) => Promise<Galpon | null>;
  actualizarGalpon: (id: string, nombre: string) => Promise<void>;
  eliminarGalpon: (id: string) => Promise<void>;
}

export const useGalpones = (): UseGalponesReturn => {
  const [galpones, setGalpones] = useState<Galpon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarGalpones = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await galponesService.obtenerGalpones();
      setGalpones(data);
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al obtener galpones';
      setError(mensaje);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarGalpones();
    const unsubscribe = suscribirseAGalpones((lista) => {
      setGalpones(lista);
    }, (err) => {
      const mensaje = err instanceof Error ? err.message : 'Error en la suscripción de galpones';
      setError(mensaje);
    });

    return () => unsubscribe();
  }, [cargarGalpones]);

  const crearGalpon = useCallback(async (nombre: string): Promise<Galpon | null> => {
    try {
      if (!nombre.trim()) {
        Alert.alert('Nombre requerido', 'El galpón debe tener un nombre.');
        return null;
      }
      setLoading(true);
      const nuevo = await galponesService.crearGalpon({ nombre: nombre.trim() });
      setGalpones((prev) => [nuevo, ...prev]);
      return nuevo;
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al crear galpón';
      setError(mensaje);
      Alert.alert('Error', mensaje);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const actualizarGalpon = useCallback(async (id: string, nombre: string) => {
    try {
      if (!nombre.trim()) {
        Alert.alert('Nombre requerido', 'El galpón debe tener un nombre.');
        return;
      }
      setLoading(true);
      await galponesService.actualizarGalpon(id, { nombre: nombre.trim() });
      setGalpones((prev) => prev.map((g) => (g.id === id ? { ...g, nombre: nombre.trim() } : g)));
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al actualizar galpón';
      setError(mensaje);
      Alert.alert('Error', mensaje);
    } finally {
      setLoading(false);
    }
  }, []);

  const eliminarGalpon = useCallback(async (id: string) => {
    try {
      setLoading(true);
      await galponesService.eliminarGalpon(id);
      setGalpones((prev) => prev.filter((g) => g.id !== id));
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al eliminar galpón';
      setError(mensaje);
      Alert.alert('Error', mensaje);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    galpones,
    loading,
    error,
    cargarGalpones,
    crearGalpon,
    actualizarGalpon,
    eliminarGalpon,
  };
};

export default useGalpones;

