/**
 * Hook para análisis y reportes generales de la aplicación
 */

import { useCallback, useMemo } from 'react';
import { useLotes } from './useLotes';
import { useGastos } from './useGastos';
import { useMortalidad } from './useMortalidad';
import {
    TipoAve,
    LotePonedora,
    LoteIsraeli,
    LoteEngorde
} from '../types';

// Interfaces para analytics
export interface DashboardData {
    resumenGeneral: {
        totalLotes: number;
        lotesActivos: number;
        totalAves: number;
        avesActivas: number;
        tasaMortalidadGeneral: number;
        gastoTotalMes: number;
        ingresoTotalMes: number;
        rentabilidadMes: number;
    };
    produccion: {
        huevosDiarios: number;
        promedioProduccion: number;
        tendenciaProduccion: 'subiendo' | 'bajando' | 'estable';
    };
    alertas: Array<{
        id: string;
        tipo: 'mortalidad' | 'produccion' | 'gasto' | 'edad';
        severidad: 'baja' | 'media' | 'alta';
        loteId: string;
        mensaje: string;
        fecha: Date;
    }>;
    graficos: {
        produccionMensual: Array<{ mes: string; cantidad: number }>;
        gastosPorCategoria: Array<{ categoria: string; monto: number }>;
        mortalidadPorTipo: Array<{ tipo: TipoAve; cantidad: number }>;
        rentabilidadMensual: Array<{ mes: string; ingresos: number; gastos: number; ganancia: number }>;
    };
}

export interface ReporteDetallado {
    periodo: {
        fechaInicio: Date;
        fechaFin: Date;
    };
    lotes: {
        total: number;
        porTipo: Record<TipoAve, number>;
        activos: number;
        finalizados: number;
    };
    produccion: {
        totalHuevos: number;
        promedioHuevosPorAve: number;
        tasaPostura: number;
        ventasTotales: number;
        ingresosPorVentas: number;
    };
    financiero: {
        ingresosTotales: number;
        gastosTotales: number;
        gananciaTotal: number;
        margenGanancia: number;
        roi: number;
    };
    mortalidad: {
        totalMuertes: number;
        tasaMortalidad: number;
        causasPrincipales: Array<{ causa: string; cantidad: number }>;
    };
    eficiencia: {
        conversionAlimenticia: number;
        costoProduccionPorHuevo: number;
        costoProduccionPorKg: number;
        productividadPorAve: number;
    };
}

/**
 * Hook principal para analytics y reportes
 */
export const useAnalytics = () => {
    const { 
        todosLosLotes, 
        estadisticasGenerales, 
        ponedorasStore, 
        israeliesStore, 
        engordeStore 
    } = useLotes();
    const { gastosTotales } = useGastos();
    const { registros: mortalidadRegistros, calcularEstadisticas: calcularEstadisticasMortalidad } = useMortalidad();
    
    // Datos del dashboard
    const dashboardData = useMemo((): DashboardData => {
        const fechaActual = new Date();
        const inicioMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
        
        // Resumen general
        const totalAves = todosLosLotes.reduce((total, lote) => total + lote.numeroAves, 0);
        const avesActivas = todosLosLotes
            .filter(lote => lote.tipoLote === TipoAve.POLLO_ISRAELI 
                ? (lote as LoteIsraeli).activo 
                : (lote as any).status === 'ACTIVO'
            )
            .reduce((total, lote) => total + lote.numeroAves, 0);
        
        const mortalidadTotal = mortalidadRegistros.reduce((total, registro) => total + registro.cantidad, 0);
        const tasaMortalidadGeneral = totalAves > 0 ? (mortalidadTotal / totalAves) * 100 : 0;
        
        // Gastos e ingresos del mes actual
        const gastosMes = gastosTotales
            .filter(gasto => new Date(gasto.fecha) >= inicioMes)
            .reduce((total, gasto) => total + gasto.total, 0);
        
        // Aquí deberías calcular ingresos reales
        const ingresosMes = 0; // Placeholder
        const rentabilidadMes = ingresosMes - gastosMes;
        
        // Producción (solo para ponedoras)
        const huevosDiarios = 0; // Placeholder - calcular desde registros diarios
        const promedioProduccion = 0; // Placeholder
        const tendenciaProduccion: 'subiendo' | 'bajando' | 'estable' = 'estable'; // Placeholder
        
        // Alertas
        const alertas: DashboardData['alertas'] = [];
        
        // Alertas de mortalidad
        todosLosLotes.forEach(lote => {
            const mortalidadLote = mortalidadRegistros
                .filter(r => r.loteId === lote.id)
                .reduce((total, r) => total + r.cantidad, 0);
            const tasaMortalidad = (mortalidadLote / lote.numeroAves) * 100;
            
            if (tasaMortalidad > 5) {
                alertas.push({
                    id: `mortalidad-${lote.id}`,
                    tipo: 'mortalidad',
                    severidad: tasaMortalidad > 10 ? 'alta' : 'media',
                    loteId: lote.id,
                    mensaje: `Alta mortalidad en ${lote.nombre}: ${tasaMortalidad.toFixed(1)}%`,
                    fecha: new Date()
                });
            }
        });
        
        // Gráficos
        const produccionMensual: Array<{ mes: string; cantidad: number }> = [];
        const gastosPorCategoria: Array<{ categoria: string; monto: number }> = [];
        const mortalidadPorTipo: Array<{ tipo: TipoAve; cantidad: number }> = [];
        const rentabilidadMensual: Array<{ mes: string; ingresos: number; gastos: number; ganancia: number }> = [];
        
        return {
            resumenGeneral: {
                totalLotes: estadisticasGenerales.totalLotes,
                lotesActivos: estadisticasGenerales.lotesActivos,
                totalAves,
                avesActivas,
                tasaMortalidadGeneral,
                gastoTotalMes: gastosMes,
                ingresoTotalMes: ingresosMes,
                rentabilidadMes
            },
            produccion: {
                huevosDiarios,
                promedioProduccion,
                tendenciaProduccion
            },
            alertas,
            graficos: {
                produccionMensual,
                gastosPorCategoria,
                mortalidadPorTipo,
                rentabilidadMensual
            }
        };
    }, [todosLosLotes, estadisticasGenerales, gastosTotales, mortalidadRegistros]);
    
    // Generar reporte detallado
    const generarReporteDetallado = useCallback((
        fechaInicio: Date,
        fechaFin: Date
    ): ReporteDetallado => {
        // Filtrar datos por período
        const lotesEnPeriodo = todosLosLotes.filter(lote => {
            const fechaLote = new Date(lote.fechaInicio);
            return fechaLote >= fechaInicio && fechaLote <= fechaFin;
        });
        
        const gastosEnPeriodo = gastosTotales.filter(gasto => {
            const fechaGasto = new Date(gasto.fecha);
            return fechaGasto >= fechaInicio && fechaGasto <= fechaFin;
        });
        
        const mortalidadEnPeriodo = mortalidadRegistros.filter(registro => {
            const fechaRegistro = new Date(registro.fecha);
            return fechaRegistro >= fechaInicio && fechaRegistro <= fechaFin;
        });
        
        // Calcular métricas
        const lotesPorTipo = lotesEnPeriodo.reduce((acc, lote) => {
            acc[lote.tipoLote] = (acc[lote.tipoLote] || 0) + 1;
            return acc;
        }, {} as Record<TipoAve, number>);
        
        const gastosTotales = gastosEnPeriodo.reduce((total, gasto) => total + gasto.total, 0);
        const ingresosTotales = 0; // Placeholder - calcular ingresos reales
        const gananciaTotal = ingresosTotales - gastosTotales;
        const margenGanancia = ingresosTotales > 0 ? (gananciaTotal / ingresosTotales) * 100 : 0;
        
        const totalMuertes = mortalidadEnPeriodo.reduce((total, registro) => total + registro.cantidad, 0);
        const totalAves = lotesEnPeriodo.reduce((total, lote) => total + lote.numeroAves, 0);
        const tasaMortalidad = totalAves > 0 ? (totalMuertes / totalAves) * 100 : 0;
        
        return {
            periodo: { fechaInicio, fechaFin },
            lotes: {
                total: lotesEnPeriodo.length,
                porTipo: lotesPorTipo,
                activos: lotesEnPeriodo.filter(lote => 
                    lote.tipoLote === TipoAve.POLLO_ISRAELI 
                        ? (lote as LoteIsraeli).activo 
                        : (lote as any).status === 'ACTIVO'
                ).length,
                finalizados: lotesEnPeriodo.filter(lote => 
                    lote.tipoLote === TipoAve.POLLO_ISRAELI 
                        ? !(lote as LoteIsraeli).activo 
                        : (lote as any).status !== 'ACTIVO'
                ).length
            },
            produccion: {
                totalHuevos: 0, // Placeholder
                promedioHuevosPorAve: 0, // Placeholder
                tasaPostura: 0, // Placeholder
                ventasTotales: 0, // Placeholder
                ingresosPorVentas: 0 // Placeholder
            },
            financiero: {
                ingresosTotales,
                gastosTotales,
                gananciaTotal,
                margenGanancia,
                roi: 0 // Placeholder
            },
            mortalidad: {
                totalMuertes,
                tasaMortalidad,
                causasPrincipales: [] // Placeholder
            },
            eficiencia: {
                conversionAlimenticia: 0, // Placeholder
                costoProduccionPorHuevo: 0, // Placeholder
                costoProduccionPorKg: 0, // Placeholder
                productividadPorAve: 0 // Placeholder
            }
        };
    }, [todosLosLotes, gastosTotales, mortalidadRegistros]);
    
    // Exportar datos
    const exportarDatos = useCallback(async (
        formato: 'csv' | 'excel' | 'pdf',
        tipo: 'lotes' | 'gastos' | 'mortalidad' | 'completo',
        fechaInicio?: Date,
        fechaFin?: Date
    ) => {
        // Implementar exportación según el formato y tipo
        console.log('Exportando datos:', { formato, tipo, fechaInicio, fechaFin });
        
        // Aquí implementarías la lógica de exportación real
        // Por ejemplo, generar CSV, Excel o PDF
    }, []);
    
    // Comparar períodos
    const compararPeriodos = useCallback((
        periodo1: { inicio: Date; fin: Date },
        periodo2: { inicio: Date; fin: Date }
    ) => {
        const reporte1 = generarReporteDetallado(periodo1.inicio, periodo1.fin);
        const reporte2 = generarReporteDetallado(periodo2.inicio, periodo2.fin);
        
        return {
            periodo1: reporte1,
            periodo2: reporte2,
            comparacion: {
                cambioLotes: reporte2.lotes.total - reporte1.lotes.total,
                cambioIngresos: reporte2.financiero.ingresosTotales - reporte1.financiero.ingresosTotales,
                cambioGastos: reporte2.financiero.gastosTotales - reporte1.financiero.gastosTotales,
                cambioGanancia: reporte2.financiero.gananciaTotal - reporte1.financiero.gananciaTotal,
                cambioMortalidad: reporte2.mortalidad.tasaMortalidad - reporte1.mortalidad.tasaMortalidad
            }
        };
    }, [generarReporteDetallado]);
    
    return {
        // Datos principales
        dashboardData,
        
        // Funciones de reportes
        generarReporteDetallado,
        exportarDatos,
        compararPeriodos,
        
        // Utilidades
        obtenerTendencia: (datos: number[]) => {
            if (datos.length < 2) return 'estable';
            const ultimoValor = datos[datos.length - 1];
            const penultimoValor = datos[datos.length - 2];
            
            if (ultimoValor > penultimoValor) return 'subiendo';
            if (ultimoValor < penultimoValor) return 'bajando';
            return 'estable';
        },
        
        calcularPorcentajeCambio: (valorAnterior: number, valorActual: number) => {
            if (valorAnterior === 0) return valorActual > 0 ? 100 : 0;
            return ((valorActual - valorAnterior) / valorAnterior) * 100;
        },
        
        formatearMoneda: (cantidad: number) => {
            return new Intl.NumberFormat('es-DO', {
                style: 'currency',
                currency: 'DOP'
            }).format(cantidad);
        },
        
        formatearPorcentaje: (valor: number) => {
            return `${valor.toFixed(1)}%`;
        }
    };
};
