/**
 * Servicio para generar PDFs de facturas
 * Diseño moderno tipo recibo digital
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Asset } from 'expo-asset';
import { Factura } from './facturas.service';
import { colors } from '../constants/colors';

/**
 * Convertir imagen a base64
 */
async function getImageBase64(assetPath: string): Promise<string> {
  try {
    const asset = Asset.fromModule(require('../../assets/images/full-logo.png'));
    await asset.downloadAsync();
    
    if (asset.localUri) {
      const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return `data:image/png;base64,${base64}`;
    }
    return '';
  } catch (error) {
    console.error('Error al cargar logo:', error);
    return '';
  }
}

/**
 * Generar HTML para el PDF de factura
 */
async function generarHTMLFactura(factura: Factura): Promise<string> {
  const logoBase64 = await getImageBase64('../../assets/images/full-logo.png');
  
  const fechaFormateada = factura.fecha.toLocaleDateString('es-DO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Factura ${factura.numero}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                color: #1f2937;
                line-height: 1.6;
                padding: 40px 20px;
                background: #ffffff;
            }
            
            .container {
                max-width: 800px;
                margin: 0 auto;
            }
            
            /* Header con logo */
            .header {
                text-align: center;
                margin-bottom: 40px;
                padding-bottom: 30px;
                border-bottom: 2px solid ${colors.primary};
            }
            
            .logo {
                width: 180px;
                height: auto;
                margin-bottom: 20px;
            }
            
            .company-name {
                font-size: 24px;
                font-weight: 700;
                color: ${colors.primary};
                margin-bottom: 8px;
            }
            
            .company-info {
                font-size: 14px;
                color: #6b7280;
            }
            
            /* Número de factura destacado */
            .invoice-number {
                text-align: center;
                margin: 30px 0;
            }
            
            .invoice-label {
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #9ca3af;
                margin-bottom: 8px;
            }
            
            .invoice-value {
                font-size: 36px;
                font-weight: 800;
                color: ${colors.primary};
                letter-spacing: -1px;
            }
            
            /* Información del cliente */
            .client-section {
                background: #f9fafb;
                border-radius: 12px;
                padding: 24px;
                margin: 30px 0;
            }
            
            .section-title {
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: #6b7280;
                margin-bottom: 16px;
                font-weight: 600;
            }
            
            .client-info {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
            }
            
            .info-row {
                display: flex;
                flex-direction: column;
            }
            
            .info-label {
                font-size: 12px;
                color: #9ca3af;
                margin-bottom: 4px;
            }
            
            .info-value {
                font-size: 15px;
                color: #1f2937;
                font-weight: 500;
            }
            
            /* Tabla de items */
            .items-section {
                margin: 30px 0;
            }
            
            .items-table {
                width: 100%;
                border-collapse: separate;
                border-spacing: 0;
            }
            
            .items-table thead {
                background: ${colors.primary};
                color: white;
            }
            
            .items-table th {
                padding: 14px 16px;
                text-align: left;
                font-size: 13px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .items-table th:first-child {
                border-radius: 8px 0 0 0;
            }
            
            .items-table th:last-child {
                border-radius: 0 8px 0 0;
                text-align: right;
            }
            
            .items-table td {
                padding: 16px;
                border-bottom: 1px solid #e5e7eb;
                font-size: 14px;
            }
            
            .items-table tbody tr:last-child td {
                border-bottom: none;
            }
            
            .items-table tbody tr:hover {
                background: #f9fafb;
            }
            
            .item-name {
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 4px;
            }
            
            .item-description {
                font-size: 12px;
                color: #6b7280;
            }
            
            .text-right {
                text-align: right;
            }
            
            .text-center {
                text-align: center;
            }
            
            /* Totales */
            .totals-section {
                margin: 30px 0;
                display: flex;
                justify-content: flex-end;
            }
            
            .totals-box {
                width: 350px;
                background: #f9fafb;
                border-radius: 12px;
                padding: 24px;
            }
            
            .total-row {
                display: flex;
                justify-content: space-between;
                padding: 12px 0;
                border-bottom: 1px solid #e5e7eb;
            }
            
            .total-row:last-child {
                border-bottom: none;
                padding-top: 16px;
                margin-top: 8px;
                border-top: 2px solid ${colors.primary};
            }
            
            .total-label {
                font-size: 14px;
                color: #6b7280;
            }
            
            .total-value {
                font-size: 16px;
                font-weight: 600;
                color: #1f2937;
            }
            
            .total-row:last-child .total-label {
                font-size: 18px;
                font-weight: 700;
                color: ${colors.primary};
            }
            
            .total-row:last-child .total-value {
                font-size: 28px;
                font-weight: 800;
                color: ${colors.primary};
            }
            
            /* Información adicional */
            .additional-info {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
                margin: 30px 0;
            }
            
            .info-card {
                background: #f9fafb;
                border-radius: 8px;
                padding: 16px;
            }
            
            .info-card-title {
                font-size: 12px;
                text-transform: uppercase;
                color: #9ca3af;
                margin-bottom: 8px;
                font-weight: 600;
            }
            
            .info-card-value {
                font-size: 15px;
                color: #1f2937;
                font-weight: 600;
            }
            
            /* Estado */
            .status-badge {
                display: inline-block;
                padding: 6px 16px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .status-emitida {
                background: #d1fae5;
                color: #065f46;
            }
            
            .status-pagada {
                background: #dbeafe;
                color: #1e40af;
            }
            
            .status-cancelada {
                background: #fee2e2;
                color: #991b1b;
            }
            
            /* Footer */
            .footer {
                margin-top: 50px;
                padding-top: 30px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                color: #9ca3af;
                font-size: 12px;
            }
            
            .footer-note {
                margin-top: 12px;
                font-style: italic;
            }
            
            /* Observaciones */
            .observations {
                background: #fef3c7;
                border-left: 4px solid #f59e0b;
                border-radius: 4px;
                padding: 16px;
                margin: 20px 0;
            }
            
            .observations-title {
                font-size: 13px;
                font-weight: 700;
                color: #92400e;
                margin-bottom: 8px;
            }
            
            .observations-text {
                font-size: 14px;
                color: #78350f;
                line-height: 1.6;
            }
            
            @media print {
                body {
                    padding: 20px;
                }
                
                .no-print {
                    display: none;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header -->
            <div class="header">
                ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" class="logo" />` : ''}
                <div class="company-name">ASOAVES</div>
                <div class="company-info">Sistema de Gestión Avícola</div>
            </div>
            
            <!-- Número de factura -->
            <div class="invoice-number">
                <div class="invoice-label">Factura</div>
                <div class="invoice-value">${factura.numero}</div>
            </div>
            
            <!-- Información del cliente -->
            <div class="client-section">
                <div class="section-title">Cliente</div>
                <div class="client-info">
                    <div class="info-row">
                        <div class="info-label">Nombre</div>
                        <div class="info-value">${factura.cliente.nombre}</div>
                    </div>
                    ${factura.cliente.documento ? `
                    <div class="info-row">
                        <div class="info-label">Documento</div>
                        <div class="info-value">${factura.cliente.documento}</div>
                    </div>
                    ` : ''}
                    ${factura.cliente.telefono ? `
                    <div class="info-row">
                        <div class="info-label">Teléfono</div>
                        <div class="info-value">${factura.cliente.telefono}</div>
                    </div>
                    ` : ''}
                    ${factura.cliente.email ? `
                    <div class="info-row">
                        <div class="info-label">Email</div>
                        <div class="info-value">${factura.cliente.email}</div>
                    </div>
                    ` : ''}
                    <div class="info-row">
                        <div class="info-label">Fecha</div>
                        <div class="info-value">${fechaFormateada}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Estado</div>
                        <div class="info-value">
                            <span class="status-badge status-${factura.estado.toLowerCase()}">${factura.estado}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Items -->
            <div class="items-section">
                <div class="section-title">Productos / Servicios</div>
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th class="text-center">Cantidad</th>
                            <th class="text-right">Precio Unit.</th>
                            <th class="text-right">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${factura.venta.items.map(item => `
                        <tr>
                            <td>
                                <div class="item-name">${item.producto.nombre}</div>
                                ${item.producto.descripcion ? `<div class="item-description">${item.producto.descripcion}</div>` : ''}
                            </td>
                            <td class="text-center">${item.cantidad}</td>
                            <td class="text-right">RD$${item.precioUnitario.toFixed(2)}</td>
                            <td class="text-right">RD$${item.subtotal.toFixed(2)}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <!-- Totales -->
            <div class="totals-section">
                <div class="totals-box">
                    <div class="total-row">
                        <div class="total-label">Subtotal</div>
                        <div class="total-value">RD$${factura.resumen.subtotal.toFixed(2)}</div>
                    </div>
                    ${factura.resumen.descuentoTotal > 0 ? `
                    <div class="total-row">
                        <div class="total-label">Descuento</div>
                        <div class="total-value">-RD$${factura.resumen.descuentoTotal.toFixed(2)}</div>
                    </div>
                    ` : ''}
                    <div class="total-row">
                        <div class="total-label">Total</div>
                        <div class="total-value">RD$${factura.resumen.total.toFixed(2)}</div>
                    </div>
                </div>
            </div>
            
            <!-- Información adicional -->
            <div class="additional-info">
                <div class="info-card">
                    <div class="info-card-title">Método de Pago</div>
                    <div class="info-card-value">${factura.venta.metodoPago}</div>
                </div>
                <div class="info-card">
                    <div class="info-card-title">Total de Items</div>
                    <div class="info-card-value">${factura.resumen.totalItems} producto${factura.resumen.totalItems !== 1 ? 's' : ''}</div>
                </div>
            </div>
            
            <!-- Observaciones -->
            ${factura.venta.observaciones ? `
            <div class="observations">
                <div class="observations-title">Observaciones</div>
                <div class="observations-text">${factura.venta.observaciones}</div>
            </div>
            ` : ''}
            
            <!-- Footer -->
            <div class="footer">
                <div>Generado el ${new Date().toLocaleString('es-DO', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                <div class="footer-note">Gracias por su preferencia</div>
            </div>
        </div>
    </body>
    </html>
  `;
}

/**
 * Generar PDF de factura
 */
export async function generarFacturaPDF(factura: Factura): Promise<string> {
  try {
    console.log('📄 Generando PDF para factura:', factura.numero);
    
    const html = await generarHTMLFactura(factura);
    
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    console.log('✅ PDF generado en:', uri);
    
    // El URI que devuelve printToFileAsync ya es válido para compartir
    // No necesitamos moverlo a menos que queramos un nombre específico
    // Por ahora, usamos el URI directamente
    return uri;
  } catch (error) {
    console.error('❌ Error generando PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    throw new Error(`Error al generar el PDF de la factura: ${errorMessage}`);
  }
}

/**
 * Compartir PDF de factura
 */
export async function compartirFacturaPDF(uri: string): Promise<void> {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    
    if (!isAvailable) {
      throw new Error('La función de compartir no está disponible en este dispositivo');
    }

    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Compartir Factura',
    });

    console.log('✅ Factura compartida exitosamente');
  } catch (error) {
    console.error('❌ Error compartiendo PDF:', error);
    throw new Error('Error al compartir el PDF');
  }
}

/**
 * Imprimir factura directamente
 */
export async function imprimirFactura(factura: Factura): Promise<void> {
  try {
    const html = await generarHTMLFactura(factura);
    
    await Print.printAsync({
      html,
    });

    console.log('✅ Factura enviada a imprimir');
  } catch (error) {
    console.error('❌ Error imprimiendo factura:', error);
    throw new Error('Error al imprimir la factura');
  }
}

