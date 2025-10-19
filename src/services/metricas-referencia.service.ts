/**
 * Servicio para gestionar métricas de referencia y benchmarks
 */

import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../components/config/firebase';
import {
    ConfiguracionMetricas,
    METRICAS_PREDEFINIDAS,
    MetricasEngordeReferencia,
    MetricasLevantesReferencia,
    MetricasPonedorasReferencia
} from '../types/metricas-referencia';
import { getCurrentUserId } from './auth.service';

const METRICAS_COLLECTION = 'metricasReferencia';

/**
 * Obtener la configuración de métricas del usuario
 */
export const obtenerConfiguracionMetricas = async (): Promise<ConfiguracionMetricas | null> => {
    try {
        const userId = getCurrentUserId();
        if (!userId) throw new Error('Usuario no autenticado');

        const docRef = doc(db, METRICAS_COLLECTION, userId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            // Si no existe, crear una configuración inicial con valores predefinidos
            const configInicial = await crearConfiguracionInicial(userId);
            return configInicial;
        }

        const data = docSnap.data();
        return {
            userId: data.userId,
            engorde: data.engorde || [],
            levantes: data.levantes || [],
            ponedoras: data.ponedoras || [],
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
        } as ConfiguracionMetricas;
    } catch (error) {
        console.error('Error al obtener configuración de métricas:', error);
        throw error;
    }
};

/**
 * Crear configuración inicial con valores predefinidos
 */
const crearConfiguracionInicial = async (userId: string): Promise<ConfiguracionMetricas> => {
    const configInicial: ConfiguracionMetricas = {
        userId,
        engorde: [
            {
                id: 'cobb-500',
                ...METRICAS_PREDEFINIDAS.ENGORDE.COBB,
            },
            {
                id: 'ross-308',
                ...METRICAS_PREDEFINIDAS.ENGORDE.ROSS_308,
            },
        ],
        levantes: [
            {
                id: 'cobb-levante',
                ...METRICAS_PREDEFINIDAS.LEVANTES.COBB,
            },
        ],
        ponedoras: [
            {
                id: 'lohmann-brown',
                ...METRICAS_PREDEFINIDAS.PONEDORAS.LOHMANN_BROWN,
            },
            {
                id: 'isa-brown',
                ...METRICAS_PREDEFINIDAS.PONEDORAS.ISA_BROWN,
            },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    await guardarConfiguracionMetricas(configInicial);
    return configInicial;
};

/**
 * Guardar configuración de métricas
 */
export const guardarConfiguracionMetricas = async (
    config: ConfiguracionMetricas
): Promise<void> => {
    try {
        const userId = getCurrentUserId();
        if (!userId) throw new Error('Usuario no autenticado');

        const docRef = doc(db, METRICAS_COLLECTION, userId);
        await setDoc(docRef, {
            ...config,
            userId,
            updatedAt: serverTimestamp(),
        }, { merge: true });
    } catch (error) {
        console.error('Error al guardar configuración de métricas:', error);
        throw error;
    }
};

/**
 * Agregar métrica de engorde
 */
export const agregarMetricaEngorde = async (
    metrica: Omit<MetricasEngordeReferencia, 'id'>
): Promise<void> => {
    try {
        const config = await obtenerConfiguracionMetricas();
        if (!config) throw new Error('No se pudo cargar la configuración');

        const nuevaMetrica: MetricasEngordeReferencia = {
            ...metrica,
            id: `engorde-${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        config.engorde.push(nuevaMetrica);
        await guardarConfiguracionMetricas(config);
    } catch (error) {
        console.error('Error al agregar métrica de engorde:', error);
        throw error;
    }
};

/**
 * Actualizar métrica de engorde
 */
export const actualizarMetricaEngorde = async (
    id: string,
    metrica: Partial<MetricasEngordeReferencia>
): Promise<void> => {
    try {
        const config = await obtenerConfiguracionMetricas();
        if (!config) throw new Error('No se pudo cargar la configuración');

        const index = config.engorde.findIndex(m => m.id === id);
        if (index === -1) throw new Error('Métrica no encontrada');

        config.engorde[index] = {
            ...config.engorde[index],
            ...metrica,
            updatedAt: new Date(),
        };

        await guardarConfiguracionMetricas(config);
    } catch (error) {
        console.error('Error al actualizar métrica de engorde:', error);
        throw error;
    }
};

/**
 * Eliminar métrica de engorde
 */
export const eliminarMetricaEngorde = async (id: string): Promise<void> => {
    try {
        const config = await obtenerConfiguracionMetricas();
        if (!config) throw new Error('No se pudo cargar la configuración');

        config.engorde = config.engorde.filter(m => m.id !== id);
        await guardarConfiguracionMetricas(config);
    } catch (error) {
        console.error('Error al eliminar métrica de engorde:', error);
        throw error;
    }
};

/**
 * Agregar métrica de levantes
 */
export const agregarMetricaLevantes = async (
    metrica: Omit<MetricasLevantesReferencia, 'id'>
): Promise<void> => {
    try {
        const config = await obtenerConfiguracionMetricas();
        if (!config) throw new Error('No se pudo cargar la configuración');

        const nuevaMetrica: MetricasLevantesReferencia = {
            ...metrica,
            id: `levantes-${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        config.levantes.push(nuevaMetrica);
        await guardarConfiguracionMetricas(config);
    } catch (error) {
        console.error('Error al agregar métrica de levantes:', error);
        throw error;
    }
};

/**
 * Actualizar métrica de levantes
 */
export const actualizarMetricaLevantes = async (
    id: string,
    metrica: Partial<MetricasLevantesReferencia>
): Promise<void> => {
    try {
        const config = await obtenerConfiguracionMetricas();
        if (!config) throw new Error('No se pudo cargar la configuración');

        const index = config.levantes.findIndex(m => m.id === id);
        if (index === -1) throw new Error('Métrica no encontrada');

        config.levantes[index] = {
            ...config.levantes[index],
            ...metrica,
            updatedAt: new Date(),
        };

        await guardarConfiguracionMetricas(config);
    } catch (error) {
        console.error('Error al actualizar métrica de levantes:', error);
        throw error;
    }
};

/**
 * Eliminar métrica de levantes
 */
export const eliminarMetricaLevantes = async (id: string): Promise<void> => {
    try {
        const config = await obtenerConfiguracionMetricas();
        if (!config) throw new Error('No se pudo cargar la configuración');

        config.levantes = config.levantes.filter(m => m.id !== id);
        await guardarConfiguracionMetricas(config);
    } catch (error) {
        console.error('Error al eliminar métrica de levantes:', error);
        throw error;
    }
};

/**
 * Agregar métrica de ponedoras
 */
export const agregarMetricaPonedoras = async (
    metrica: Omit<MetricasPonedorasReferencia, 'id'>
): Promise<void> => {
    try {
        const config = await obtenerConfiguracionMetricas();
        if (!config) throw new Error('No se pudo cargar la configuración');

        const nuevaMetrica: MetricasPonedorasReferencia = {
            ...metrica,
            id: `ponedoras-${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        config.ponedoras.push(nuevaMetrica);
        await guardarConfiguracionMetricas(config);
    } catch (error) {
        console.error('Error al agregar métrica de ponedoras:', error);
        throw error;
    }
};

/**
 * Actualizar métrica de ponedoras
 */
export const actualizarMetricaPonedoras = async (
    id: string,
    metrica: Partial<MetricasPonedorasReferencia>
): Promise<void> => {
    try {
        const config = await obtenerConfiguracionMetricas();
        if (!config) throw new Error('No se pudo cargar la configuración');

        const index = config.ponedoras.findIndex(m => m.id === id);
        if (index === -1) throw new Error('Métrica no encontrada');

        config.ponedoras[index] = {
            ...config.ponedoras[index],
            ...metrica,
            updatedAt: new Date(),
        };

        await guardarConfiguracionMetricas(config);
    } catch (error) {
        console.error('Error al actualizar métrica de ponedoras:', error);
        throw error;
    }
};

/**
 * Eliminar métrica de ponedoras
 */
export const eliminarMetricaPonedoras = async (id: string): Promise<void> => {
    try {
        const config = await obtenerConfiguracionMetricas();
        if (!config) throw new Error('No se pudo cargar la configuración');

        config.ponedoras = config.ponedoras.filter(m => m.id !== id);
        await guardarConfiguracionMetricas(config);
    } catch (error) {
        console.error('Error al eliminar métrica de ponedoras:', error);
        throw error;
    }
};

/**
 * Obtener métrica de referencia por raza (engorde)
 */
export const obtenerMetricaEngordePorRaza = async (
    raza: string
): Promise<MetricasEngordeReferencia | null> => {
    try {
        const config = await obtenerConfiguracionMetricas();
        if (!config) return null;

        return config.engorde.find(m => 
            m.raza.toLowerCase() === raza.toLowerCase()
        ) || null;
    } catch (error) {
        console.error('Error al obtener métrica de engorde:', error);
        return null;
    }
};

/**
 * Obtener métrica de referencia por raza (levantes)
 */
export const obtenerMetricaLevantesPorRaza = async (
    raza: string
): Promise<MetricasLevantesReferencia | null> => {
    try {
        const config = await obtenerConfiguracionMetricas();
        if (!config) return null;

        return config.levantes.find(m => 
            m.raza.toLowerCase() === raza.toLowerCase()
        ) || null;
    } catch (error) {
        console.error('Error al obtener métrica de levantes:', error);
        return null;
    }
};

/**
 * Obtener métrica de referencia por raza (ponedoras)
 */
export const obtenerMetricaPonedorasPorRaza = async (
    raza: string
): Promise<MetricasPonedorasReferencia | null> => {
    try {
        const config = await obtenerConfiguracionMetricas();
        if (!config) return null;

        return config.ponedoras.find(m => 
            m.raza.toLowerCase() === raza.toLowerCase()
        ) || null;
    } catch (error) {
        console.error('Error al obtener métrica de ponedoras:', error);
        return null;
    }
};

















