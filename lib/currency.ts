export type Currency = {
  code: string;
  symbol: string;
  locale: string;
};

export const CURRENCIES: Currency[] = [
  { code: 'EUR', symbol: '€',   locale: 'pt-PT' },
  { code: 'USD', symbol: '$',   locale: 'en-US' },
  { code: 'GBP', symbol: '£',   locale: 'en-GB' },
  { code: 'CHF', symbol: 'CHF', locale: 'de-CH' },
  { code: 'BRL', symbol: 'R$',  locale: 'pt-BR' },
  { code: 'DKK', symbol: 'kr',  locale: 'da-DK' },
  { code: 'SEK', symbol: 'kr',  locale: 'sv-SE' },
  { code: 'NOK', symbol: 'kr',  locale: 'nb-NO' },
];

export function getSavedCurrencyCode(): string {
  if (typeof window === 'undefined') return 'EUR';
  return localStorage.getItem('hb_currency') ?? 'EUR';
}

export function getSavedExchangeRate(): number {
  if (typeof window === 'undefined') return 1;
  return parseFloat(localStorage.getItem('hb_exchange_rate') ?? '1') || 1;
}

export function getCurrency(code?: string): Currency {
  const c = code ?? getSavedCurrencyCode();
  return CURRENCIES.find(cur => cur.code === c) ?? CURRENCIES[0];
}

export function setCurrencyCode(code: string) {
  if (typeof window !== 'undefined') localStorage.setItem('hb_currency', code);
}

export function setExchangeRate(rate: number) {
  if (typeof window !== 'undefined') localStorage.setItem('hb_exchange_rate', String(rate));
}

export function fmtWithCurrency(n: number | null | undefined, cur: Currency, rate = 1): string {
  if (n == null) return '—';
  const converted = Number(n) * rate;
  return `${cur.symbol}${converted.toLocaleString(cur.locale, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function fmt(n: number | null | undefined): string {
  return fmtWithCurrency(n, getCurrency(), getSavedExchangeRate());
}
