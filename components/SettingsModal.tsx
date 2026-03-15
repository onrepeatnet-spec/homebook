'use client';
import { useState } from 'react';
import Modal from './Modal';
import { CURRENCIES } from '@/lib/currency';
import { useCurrency } from './CurrencyContext';

// Approximate exchange rates from EUR (base currency)
// These are reasonable fixed rates - not live, but accurate enough for a home planning tool
const RATES_FROM_EUR: Record<string, number> = {
  EUR: 1,
  USD: 1.09,
  GBP: 0.86,
  CHF: 0.97,
  BRL: 5.45,
  DKK: 7.46,
  SEK: 11.25,
  NOK: 11.60,
};

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const { currency, exchangeRate, setCurrency, darkMode, toggleDark } = useCurrency();
  const [selected, setSelected] = useState(currency.code);

  // Work out current base-EUR rate to convert correctly
  // If currently in USD with rate 1.09, the "base EUR value" = value / 1.09
  // Then new value = base * newRate

  const handleSave = () => {
    // Rate is always stored relative to EUR (the base currency).
    // We pass the absolute EUR-based rate so fmt() multiplies stored EUR values correctly.
    const newRate = RATES_FROM_EUR[selected] ?? 1;
    setCurrency(selected, newRate);
    onClose();
  };

  return (
    <Modal title="Settings" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Dark mode */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)' }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500 }}>{darkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}</p>
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Toggle the app appearance</p>
          </div>
          <button
            onClick={toggleDark}
            style={{
              width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
              background: darkMode ? 'var(--accent)' : 'var(--border-dark)',
              position: 'relative', transition: 'background 0.2s ease', flexShrink: 0,
            }}>
            <span style={{
              position: 'absolute', top: 3, left: darkMode ? 23 : 3,
              width: 18, height: 18, borderRadius: '50%', background: 'white',
              transition: 'left 0.2s ease', display: 'block',
            }} />
          </button>
        </div>

        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Currency
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 12, lineHeight: 1.5 }}>
            Values will be converted using approximate exchange rates from EUR.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {CURRENCIES.map(cur => (
              <button key={cur.code} onClick={() => setSelected(cur.code)}
                style={{
                  padding: '10px 6px', borderRadius: 8, textAlign: 'center',
                  border: `2px solid ${selected === cur.code ? 'var(--accent)' : 'var(--border)'}`,
                  background: selected === cur.code ? 'var(--accent-light)' : 'var(--surface)',
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'var(--transition)',
                }}>
                <div style={{ fontSize: 18, fontFamily: 'var(--font-serif)', fontWeight: 500, color: selected === cur.code ? 'var(--accent)' : 'var(--text)' }}>
                  {cur.symbol}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{cur.code}</div>
                {selected === cur.code && cur.code !== 'EUR' && (
                  <div style={{ fontSize: 10, color: 'var(--accent)', marginTop: 2 }}>
                    1€ = {RATES_FROM_EUR[cur.code]}{cur.symbol}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Apply & Convert</button>
        </div>
      </div>
    </Modal>
  );
}
