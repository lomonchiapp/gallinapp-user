// Interfaz para configuración de la aplicación
export interface AppConfig {
    id: string;
    precioHuevo: number; // Precio por unidad de huevo
    precioLibraEngorde: number; // Precio por libra de pollo de engorde
    precioUnidadIsraeli: number; // Precio por unidad de pollo israelí
    diasCrecimientoIsraeli: number; // Días promedio de crecimiento para israelíes
    diasCrecimientoEngorde: number; // Días promedio de crecimiento para engorde
    pesoObjetivoEngorde: number; // Peso objetivo en libras para pollos de engorde
    tasaMortalidadAceptable: number; // Porcentaje de mortalidad aceptable
    cantidadHuevosPorCaja: number; // Cantidad estándar de huevos por caja para ventas
    notificaciones?: {
      alertasHabilitadas: boolean;
      mostrarAlertasExito: boolean;
      mostrarAlertasError: boolean;
      mostrarAlertasConfirmacion: boolean;
      sonidoAlertas: boolean;
      vibrarEnAlertas: boolean;
    };
    updatedAt: Date;
    updatedBy: string;
  }