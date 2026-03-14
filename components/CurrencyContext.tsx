'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CURRENCIES, getCurrency, getSavedCurrencyCode, setCurrencyCode, fmtWithCurrency } from '@/lib/currency';
import type { Currency } from '@/lib/currency';

type CurrencyContextType = {
  currency: Currency;
  setCurrency: (code: string) => void;
  fmt: (n: number | null | undefined) => string;
};

const CurrencyContext = createContext<CurrencyContextType>({
  currency: CURRENCIES[0],
  setCurrency: () => {},
  fmt: (n) => n == null ? '—' : `€${n}`,
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(CURRENCIES[0]);

  useEffect(() => {
    // Read saved currency on mount (client only)
    setCurrencyState(getCurrency(getSavedCurrencyCode()));
  }, []);

  const setCurrency = useCallback((code: string) => {
    setCurrencyCode(code);
    setCurrencyState(getCurrency(code));
  }, []);

  const fmt = useCallback((n: number | null | undefined) => {
    return fmtWithCurrency(n, currency);
  }, [currency]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, fmt }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
