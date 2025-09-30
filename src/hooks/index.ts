/**
 * Exportación centralizada de todos los hooks personalizados
 */

// Hooks específicos por tipo de lote
export * from './useEngorde';
export * from './useLevantes';
export * from './usePonedoras';

// Hook unificado
export * from './useLotesUnificado';

// Otros hooks
export * from './useAnalytics';
export * from './useFacturacion';
export * from './useGastos';
export * from './useMortalidad';

// Re-exportar hooks de stores para conveniencia
export { useArticulosStore } from '../stores/articulosStore';
export { useAuthStore } from '../stores/authStore';
export { useEngordeStore } from '../stores/engordeStore';
export { useIsraeliesStore } from '../stores/levantesStore';
export { useMortalityStore } from '../stores/mortalityStore';
export { usePonedorasStore } from '../stores/ponedorasStore';
export { useSettingsStore } from '../stores/settingsStore';

