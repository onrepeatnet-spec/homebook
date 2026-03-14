'use client';
import { useState, useEffect } from 'react';
import Modal from './Modal';
import { CURRENCIES, getCurrency, setCurrencyCode } from '@/lib/currency';

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState(getCurrency().code);

  const handleSave = () => {
    setCurrencyCode(selected);
    // Force a page reload so all fmt() calls pick up the new currency
    window.location.reload();
  };

  return (
    <Modal title="⚙️ Settings" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Currency
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {CURRENCIES.map(cur => (
              <button
                key={cur.code}
                onClick={() => setSelected(cur.code)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 8,
                  border: `2px solid ${selected === cur.code ? 'var(--accent)' : 'var(--border)'}`,
                  background: selected === cur.code ? 'var(--accent-light)' : 'var(--surface)',
                  cursor: 'pointer', transition: 'var(--transition)', fontFamily: 'inherit',
                }}>
                <span style={{ fontSize: 18, fontFamily: 'var(--font-serif)', fontWeight: 500, color: selected === cur.code ? 'var(--accent)' : 'var(--text)', minWidth: 32 }}>
                  {cur.symbol}
                </span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{cur.code}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>
          Changing currency updates how prices are displayed. It does not convert existing values.
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save & Reload</button>
        </div>
      </div>
    </Modal>
  );
}
