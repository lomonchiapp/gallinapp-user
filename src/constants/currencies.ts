/**
 * Constantes de monedas disponibles en el sistema
 */

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  isDefault?: boolean;
}

export const CURRENCIES: Currency[] = [
  { code: 'DOP', name: 'Peso Dominicano', symbol: 'RD$', isDefault: true },
  { code: 'MXN', name: 'Peso Mexicano', symbol: '$' },
  { code: 'COP', name: 'Peso Colombiano', symbol: '$' },
  { code: 'ARS', name: 'Peso Argentino', symbol: '$' },
  { code: 'BRL', name: 'Real Brasileño', symbol: 'R$' },
  { code: 'USD', name: 'Dólar Estadounidense', symbol: 'US$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
];

export const DEFAULT_CURRENCY = 'DOP';

export const getCurrencyByCode = (code: string): Currency | undefined => {
  return CURRENCIES.find(c => c.code === code);
};

export const getCurrencySymbol = (code: string): string => {
  const currency = getCurrencyByCode(code);
  return currency?.symbol || code;
};



