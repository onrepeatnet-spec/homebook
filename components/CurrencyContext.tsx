'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CURRENCIES, getCurrency, getSavedCurrencyCode, getSavedExchangeRate, setCurrencyCode, setExchangeRate, fmtWithCurrency } from '@/lib/currency';
import type { Currency } from '@/lib/currency';

function getTimeClass(): string {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return 'time-morning';
  if (h >= 12 && h < 17) return 'time-afternoon';
  if (h >= 17 && h < 21) return 'time-evening';
  return 'time-night';
}

type CurrencyContextType = {
  currency: Currency;
  exchangeRate: number;
  setCurrency: (code: string, rate: number) => void;
  fmt: (n: number | null | undefined) => string;
  symbol: string;
  darkMode: boolean;
  toggleDark: () => void;
};

const CurrencyContext = createContext<CurrencyContextType>({
  currency: CURRENCIES[0],
  exchangeRate: 1,
  setCurrency: () => {},
  fmt: (n) => n == null ? '—' : `€${n}`,
  symbol: '€',
  darkMode: false,
  toggleDark: () => {},
});

export function CurrencyProvider({ children }: { children?: React.ReactNode }) {
  const [currency, setCurrencyState]     = useState<Currency>(CURRENCIES[0]);
  const [exchangeRate, setExchangeRateState] = useState<number>(1);
  const [darkMode, setDarkMode]          = useState(false);

  useEffect(() => {
    setCurrencyState(getCurrency(getSavedCurrencyCode()));
    setExchangeRateState(getSavedExchangeRate());

    // Load dark mode preference
    const saved = localStorage.getItem('homebook_dark');
    const prefersDark = saved ? saved === 'true' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);

    // Apply time-of-day class
    document.body.classList.add(getTimeClass());

    // Update time class every minute
    const interval = setInterval(() => {
      document.body.classList.remove('time-morning','time-afternoon','time-evening','time-night');
      document.body.classList.add(getTimeClass());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDark = useCallback(() => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('homebook_dark', String(next));
      return next;
    });
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
    <CurrencyContext.Provider value={{ currency, exchangeRate, setCurrency, fmt, symbol: currency.symbol, darkMode, toggleDark }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
