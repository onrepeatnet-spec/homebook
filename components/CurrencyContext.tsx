'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CURRENCIES, getCurrency, getSavedCurrencyCode, getSavedExchangeRate, setCurrencyCode, setExchangeRate, fmtWithCurrency } from '@/lib/currency';
import type { Currency } from '@/lib/currency';

type CurrencyContextType = {
  currency: Currency;
  exchangeRate: number;
  setCurrency: (code: string, rate: number) => void;
  fmt: (n: number | null | undefined) => string;
  symbol: string;
};

const CurrencyContext = createContext<CurrencyContextType>({
  currency: CURRENCIES[0],
  exchangeRate: 1,
  setCurrency: () => {},
  fmt: (n) => n == null ? '—' : `€${n}`,
  symbol: '€',
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState]     = useState<Currency>(CURRENCIES[0]);
  const [exchangeRate, setExchangeRateState] = useState<number>(1);

  useEffect(() => {
    setCurrencyState(getCurrency(getSavedCurrencyCode()));
    setExchangeRateState(getSavedExchangeRate());
  }, []);

  const setCurrency = useCallback((code: string, rate: number) => {
    setCurrencyCode(code);
    setExchangeRate(rate);
    setCurrencyState(getCurrency(code));
    setExchangeRateState(rate);
  }, []);

  const fmt = useCallback((n: number | null | undefined) => {
    return fmtWithCurrency(n, currency, exchangeRate);
  }, [currency, exchangeRate]);

  return (
    <CurrencyContext.Provider value={{ currency, exchangeRate, setCurrency, fmt, symbol: currency.symbol }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
