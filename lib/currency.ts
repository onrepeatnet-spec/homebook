/**
 * Currency formatting utility.
 * Reads the user's preferred currency from localStorage (key: 'hb_currency').
 * Falls back to EUR on first load.
 */

export type Currency = {
  code: string;
  symbol: string;
  locale: string;
};

export const CURRENCIES: Currency[] = [
  { code: 'EUR', symbol: '€', locale: 'pt-PT' },
  { code: 'USD', symbol: '$', locale: 'en-US' },
  { code: 'GBP', symbol: '£', locale: 'en-GB' },
  { code: 'CHF', symbol: 'CHF', locale: 'de-CH' },
  { code: 'BRL', symbol: 'R$', locale: 'pt-BR' },
  { code: 'DKK', symbol: 'kr', locale: 'da-DK' },
  { code: 'SEK', symbol: 'kr', locale: 'sv-SE' },
  { code: 'NOK', symbol: 'kr', locale: 'nb-NO' },
];

export function getCurrency(): Currency {
  if (typeof window === 'undefined') return CURRENCIES[0];
  const code = localStorage.getItem('hb_currency') ?? 'EUR';
  return CURRENCIES.find(c => c.code === code) ?? CURRENCIES[0];
}

export function setCurrencyCode(code: string) {
  if (typeof window !== 'undefined') localStorage.setItem('hb_currency', code);
}

export function fmt(n: number | null | undefined): string {
  if (n == null) return '—';
  const cur = getCurrency();
  return `${cur.symbol}${Number(n).toLocaleString(cur.locale, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
