/**
 * Servicio para exportar reportes en PDF
 */

import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { PesoRegistro, TipoAve } from '../types';
import { formatDate } from '../utils/dateUtils';
import { PredictionResult } from './ml-predictions.service';

export interface PDFExportData {
  lote: {
    id: string;
    nombre: string;
    tipoAve: TipoAve;
    fechaInicio: Date;
    fechaNacimiento?: Date;
    cantidadInicial: number;
    cantidadActual: number;
    estado: string;
  };
  estadisticas: {
    gastoTotal: number;
    ingresoTotal: number;
    edadActual: number;
    mortalidadTotal: number;
    tasaMortalidad: number;
  };
  registrosPeso: PesoRegistro[];
  predicciones?: PredictionResult;
  comparativa?: {
    posicion: number;
    totalLotes: number;
    mejorEn: string[];
  };
}

/**
 * Generar HTML para el reporte PDF
 */
function generateReportHTML(data: PDFExportData): string {
  const { lote, estadisticas, registrosPeso, predicciones, comparativa } = data;

  const tipoAveLabel = {
    [TipoAve.POLLO_LEVANTE]: 'Pollo Levante',
    [TipoAve.POLLO_ENGORDE]: 'Pollo Engorde',
    [TipoAve.PONEDORA]: 'Ponedora'
  }[lote.tipoAve] || 'Desconocido';

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reporte de Lote - ${lote.nombre}</title>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                margin: 0;
                padding: 20px;
                color: #333;
                line-height: 1.6;
            }
            .header {
                text-align: center;
                border-bottom: 3px solid #2563eb;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .header h1 {
                color: #2563eb;
                font-size: 28px;
                margin: 0;
            }
            .header .subtitle {
                color: #666;
                font-size: 16px;
                margin-top: 5px;
            }
            .info-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
                margin-bottom: 30px;
            }
            .info-card {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 20px;
            }
            .info-card h3 {
                color: #2563eb;
                margin: 0 0 15px 0;
                font-size: 18px;
            }
            .info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
            }
            .info-label {
                font-weight: bold;
                color: #374151;
            }
            .info-value {
                color: #6b7280;
            }
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 15px;
                margin-bottom: 30px;
            }
            .stat-card {
                background: white;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                padding: 15px;
                text-align: center;
            }
            .stat-value {
                font-size: 24px;
                font-weight: bold;
                color: #2563eb;
                margin-bottom: 5px;
            }
            .stat-label {
                font-size: 12px;
                color: #6b7280;
                text-transform: uppercase;
            }
            .section {
                margin-bottom: 30px;
            }
            .section h2 {
                color: #1f2937;
                border-bottom: 2px solid #e5e7eb;
                padding-bottom: 10px;
                margin-bottom: 20px;
            }
            .peso-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }
            .peso-table th,
            .peso-table td {
                border: 1px solid #d1d5db;
                padding: 12px;
                text-align: left;
            }
            .peso-table th {
                background-color: #f3f4f6;
                font-weight: bold;
                color: #374151;
            }
            .peso-table tbody tr:nth-child(even) {
                background-color: #f9fafb;
            }
            .predictions-card {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 12px;
                padding: 25px;
                margin-bottom: 30px;
            }
            .predictions-card h3 {
                color: white;
                margin: 0 0 20px 0;
                font-size: 20px;
            }
            .predictions-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 20px;
            }
            .prediction-item {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                padding: 15px;
                text-align: center;
            }
            .prediction-value {
                font-size: 20px;
                font-weight: bold;
                margin-bottom: 5px;
            }
            .prediction-label {
                font-size: 12px;
                opacity: 0.8;
            }
            .recommendations {
                background: #fef3c7;
                border-left: 4px solid #f59e0b;
                border-radius: 4px;
                padding: 20px;
                margin-bottom: 20px;
            }
            .recommendations h4 {
                color: #92400e;
                margin: 0 0 15px 0;
            }
            .recommendation-item {
                margin-bottom: 10px;
                padding: 10px;
                background: white;
                border-radius: 4px;
                border-left: 3px solid #f59e0b;
            }
            .recommendation-type {
                font-weight: bold;
                text-transform: uppercase;
                font-size: 10px;
                color: #92400e;
            }
            .footer {
                margin-top: 50px;
                text-align: center;
                color: #6b7280;
                font-size: 12px;
                border-top: 1px solid #e5e7eb;
                padding-top: 20px;
            }
            .success { color: #059669; }
            .warning { color: #d97706; }
            .danger { color: #dc2626; }
            .page-break { page-break-before: always; }
        </style>
    </head>
    <body>
        <!-- Header -->
        <div class="header">
            <h1>Reporte de Lote</h1>
            <div class="subtitle">${lote.nombre} - ${tipoAveLabel}</div>
            <div class="subtitle">Generado el ${formatDate(new Date())}</div>
        </div>

        <!-- Información básica -->
        <div class="info-grid">
            <div class="info-card">
                <h3>Información del Lote</h3>
                <div class="info-row">
                    <span class="info-label">Nombre:</span>
                    <span class="info-value">${lote.nombre}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Tipo:</span>
                    <span class="info-value">${tipoAveLabel}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Fecha Inicio:</span>
                    <span class="info-value">${formatDate(lote.fechaInicio)}</span>
                </div>
                ${lote.fechaNacimiento ? `
                <div class="info-row">
                    <span class="info-label">Fecha Nacimiento:</span>
                    <span class="info-value">${formatDate(lote.fechaNacimiento)}</span>
                </div>
                ` : ''}
                <div class="info-row">
                    <span class="info-label">Estado:</span>
                    <span class="info-value">${lote.estado}</span>
                </div>
            </div>

            <div class="info-card">
                <h3>Estadísticas Generales</h3>
                <div class="info-row">
                    <span class="info-label">Cantidad Inicial:</span>
                    <span class="info-value">${lote.cantidadInicial} aves</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Cantidad Actual:</span>
                    <span class="info-value">${lote.cantidadActual} aves</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Edad Actual:</span>
                    <span class="info-value">${estadisticas.edadActual} días</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Mortalidad Total:</span>
                    <span class="info-value ${estadisticas.tasaMortalidad > 10 ? 'danger' : estadisticas.tasaMortalidad > 5 ? 'warning' : 'success'}">
                        ${estadisticas.mortalidadTotal} aves (${estadisticas.tasaMortalidad.toFixed(1)}%)
                    </span>
                </div>
            </div>
        </div>

        <!-- Métricas principales -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">RD$${estadisticas.gastoTotal.toFixed(0)}</div>
                <div class="stat-label">Gastos Totales</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">RD$${estadisticas.ingresoTotal.toFixed(0)}</div>
                <div class="stat-label">Ingresos Totales</div>
            </div>
            <div class="stat-card">
                <div class="stat-value ${(estadisticas.ingresoTotal - estadisticas.gastoTotal) >= 0 ? 'success' : 'danger'}">
                    RD$${(estadisticas.ingresoTotal - estadisticas.gastoTotal).toFixed(0)}
                </div>
                <div class="stat-label">Ganancia Neta</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">
                    ${estadisticas.gastoTotal > 0 ? (((estadisticas.ingresoTotal - estadisticas.gastoTotal) / estadisticas.gastoTotal) * 100).toFixed(1) : '0'}%
                </div>
                <div class="stat-label">ROI</div>
            </div>
        </div>

        ${comparativa ? `
        <!-- Comparativa -->
        <div class="section">
            <h2>Posición Comparativa</h2>
            <div class="info-card">
                <div class="info-row">
                    <span class="info-label">Posición:</span>
                    <span class="info-value">#${comparativa.posicion} de ${comparativa.totalLotes} lotes</span>
                </div>
                ${comparativa.mejorEn.length > 0 ? `
                <div class="info-row">
                    <span class="info-label">Destacado en:</span>
                    <span class="info-value">${comparativa.mejorEn.join(', ')}</span>
                </div>
                ` : ''}
            </div>
        </div>
        ` : ''}

        <!-- Registros de Peso -->
        ${registrosPeso.length > 0 ? `
        <div class="section">
            <h2>Evolución del Peso</h2>
            <table class="peso-table">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Edad (días)</th>
                        <th>Pollos Pesados</th>
                        <th>Peso Promedio (kg)</th>
                        <th>Peso Total (kg)</th>
                    </tr>
                </thead>
                <tbody>
                    ${registrosPeso.slice(0, 10).map(registro => `
                    <tr>
                        <td>${formatDate(registro.fecha)}</td>
                        <td>${(registro as any).edadEnDias || 0}</td>
                        <td>${(registro as any).cantidadPollosPesados || 0}</td>
                        <td>${registro.pesoPromedio.toFixed(2)}</td>
                        <td>${((registro as any).pesoTotal || 0).toFixed(2)}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}

        ${predicciones ? `
        <!-- Predicciones -->
        <div class="page-break"></div>
        <div class="predictions-card">
            <h3>🤖 Predicciones de Inteligencia Artificial</h3>
            <div class="predictions-grid">
                <div class="prediction-item">
                    <div class="prediction-value">${predicciones.pesoFinal.valor.toFixed(2)} kg</div>
                    <div class="prediction-label">Peso Final Proyectado</div>
                    <div class="prediction-label">${(predicciones.pesoFinal.confianza * 100).toFixed(0)}% confianza</div>
                </div>
                <div class="prediction-item">
                    <div class="prediction-value">${Math.round(predicciones.mortalidadEsperada.valor)}</div>
                    <div class="prediction-label">Mortalidad Esperada (aves)</div>
                    <div class="prediction-label">${(predicciones.mortalidadEsperada.confianza * 100).toFixed(0)}% confianza</div>
                </div>
                <div class="prediction-item">
                    <div class="prediction-value">RD$${predicciones.rentabilidad.gananciaNeta.toFixed(0)}</div>
                    <div class="prediction-label">Ganancia Proyectada</div>
                    <div class="prediction-label">${predicciones.rentabilidad.roi.toFixed(1)}% ROI</div>
                </div>
            </div>
        </div>

        ${predicciones.recomendaciones.length > 0 ? `
        <div class="recommendations">
            <h4>📋 Recomendaciones del Sistema</h4>
            ${predicciones.recomendaciones.map(rec => `
            <div class="recommendation-item">
                <div class="recommendation-type">${rec.tipo}</div>
                <div><strong>${rec.mensaje}</strong></div>
                <div>${rec.accion}</div>
            </div>
            `).join('')}
        </div>
        ` : ''}
        ` : ''}

        <!-- Footer -->
        <div class="footer">
            <p>Reporte generado por ASoaves - Sistema de Gestión Avícola</p>
            <p>Fecha de generación: ${new Date().toLocaleString('es-DO')}</p>
        </div>
    </body>
    </html>
  `;
}

/**
 * Exportar reporte completo en PDF
 */
export const exportarReporteCompleto = async (data: PDFExportData): Promise<string> => {
  try {
    const html = generateReportHTML(data);
    
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    // Crear nombre de archivo único
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `Reporte_${data.lote.nombre}_${timestamp}.pdf`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    // Mover archivo a ubicación permanente
    await FileSystem.moveAsync({
      from: uri,
      to: fileUri,
    });

    return fileUri;
  } catch (error) {
    console.error('Error exportando PDF:', error);
    throw new Error('Error al generar el reporte PDF');
  }
};

/**
 * Compartir reporte PDF
 */
export const compartirReporte = async (fileUri: string): Promise<void> => {
  try {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Compartir Reporte de Lote',
      });
    } else {
      throw new Error('La funcionalidad de compartir no está disponible');
    }
  } catch (error) {
    console.error('Error compartiendo PDF:', error);
    throw new Error('Error al compartir el reporte');
  }
};

/**
 * Exportar y compartir reporte
 */
export const exportarYCompartir = async (data: PDFExportData): Promise<void> => {
  try {
    const fileUri = await exportarReporteCompleto(data);
    await compartirReporte(fileUri);
  } catch (error) {
    console.error('Error en exportar y compartir:', error);
    throw error;
  }
};








