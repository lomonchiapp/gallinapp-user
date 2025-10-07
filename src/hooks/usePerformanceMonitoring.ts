/**
 * Hook para monitorear el desempeño de los lotes contra métricas de referencia
 * y generar notificaciones automáticas
 */

import { useEffect, useState } from 'react';
import {
    ComparacionDesempeno,
    compararMortalidad,
    compararPesoEngorde,
    compararPesoLevantes,
    compararProduccionPonedoras,
    generarAlertasDesempeno
} from '../services/metricas-comparacion.service';
import { createNotification } from '../services/notifications.service';
import { NotificationCategory, NotificationPriority, NotificationType } from '../types/notification';

export interface MonitoreoDesempeno {
    comparaciones: {
        peso?: ComparacionDesempeno;
        produccion?: ComparacionDesempeno;
        mortalidad?: ComparacionDesempeno;
    };
    isLoading: boolean;
    error: string | null;
}

/**
 * Hook principal para monitorear desempeño de un lote
 */
export const usePerformanceMonitoring = (lote: any, tasaPosturaActual?: number) => {
    const [monitoreo, setMonitoreo] = useState<MonitoreoDesempeno>({
        comparaciones: {},
        isLoading: true,
        error: null
    });

    useEffect(() => {
        if (!lote || !lote.id) return;

        const cargarComparaciones = async () => {
            try {
                setMonitoreo(prev => ({ ...prev, isLoading: true, error: null }));

                const comparaciones: any = {};

                // Comparar peso según el tipo de lote
                if (lote.tipo === 'pollo_engorde' && lote.pesoPromedio) {
                    comparaciones.peso = await compararPesoEngorde(lote, lote.raza);
                } else if (lote.tipo === 'pollo_levante' && lote.pesoPromedio) {
                    comparaciones.peso = await compararPesoLevantes(lote, lote.raza);
                }

                // Comparar producción para ponedoras
                if (lote.tipo === 'gallina_ponedora' && tasaPosturaActual !== undefined) {
                    comparaciones.produccion = await compararProduccionPonedoras(
                        lote, 
                        tasaPosturaActual,
                        lote.raza
                    );
                }

                // Comparar mortalidad
                const cantidadInicial = lote.cantidadInicial || lote.numeroAves || 0;
                const cantidadActual = lote.cantidadActual || lote.numeroAves || 0;
                if (cantidadInicial > 0) {
                    const muertes = cantidadInicial - cantidadActual;
                    const tasaMortalidad = (muertes / cantidadInicial) * 100;
                    comparaciones.mortalidad = await compararMortalidad(
                        lote,
                        tasaMortalidad,
                        lote.raza
                    );
                }

                setMonitoreo({
                    comparaciones,
                    isLoading: false,
                    error: null
                });

                // Generar notificaciones si hay problemas
                await generarNotificacionesDesempeno(lote, comparaciones);

            } catch (error) {
                console.error('Error al cargar comparaciones de desempeño:', error);
                setMonitoreo({
                    comparaciones: {},
                    isLoading: false,
                    error: 'No se pudieron cargar las métricas de comparación'
                });
            }
        };

        cargarComparaciones();
    }, [lote?.id, lote?.pesoPromedio, tasaPosturaActual, lote?.cantidadActual]);

    return monitoreo;
};

/**
 * Generar notificaciones automáticas basadas en comparaciones de desempeño
 */
async function generarNotificacionesDesempeno(
    lote: any,
    comparaciones: {
        peso?: ComparacionDesempeno;
        produccion?: ComparacionDesempeno;
        mortalidad?: ComparacionDesempeno;
    }
) {
    try {
        const alertas = await generarAlertasDesempeno(lote, comparaciones);

        for (const alerta of alertas) {
            // Solo generar notificación si requiere atención
            if (!comparaciones[alerta.tipo.toLowerCase() as keyof typeof comparaciones]?.requiereAtencion) {
                continue;
            }

            // Determinar el tipo de notificación
            let tipoNotificacion: NotificationType;
            switch (alerta.tipo) {
                case 'PESO':
                    tipoNotificacion = NotificationType.PESO_OBJETIVO;
                    break;
                case 'PRODUCCION':
                    tipoNotificacion = NotificationType.PRODUCCION_BAJA;
                    break;
                case 'MORTALIDAD':
                    tipoNotificacion = NotificationType.MORTALIDAD_ALTA;
                    break;
                default:
                    tipoNotificacion = NotificationType.CUSTOM;
            }

            // Determinar prioridad
            const prioridad = alerta.nivel === 'DANGER' 
                ? NotificationPriority.CRITICAL 
                : alerta.nivel === 'WARNING'
                ? NotificationPriority.HIGH
                : NotificationPriority.MEDIUM;

            // Crear la notificación
            await createNotification({
                type: tipoNotificacion,
                category: NotificationCategory.PRODUCTION,
                priority: prioridad,
                title: alerta.titulo,
                message: alerta.mensaje,
                sendPush: prioridad === NotificationPriority.CRITICAL,
                data: {
                    loteId: lote.id,
                    loteNombre: lote.nombre,
                    tipoAve: lote.tipo,
                    valorActual: alerta.valorActual,
                    valorEsperado: alerta.valorEsperado,
                    recomendaciones: alerta.recomendaciones
                }
            });
        }
    } catch (error) {
        console.error('Error al generar notificaciones de desempeño:', error);
    }
}
