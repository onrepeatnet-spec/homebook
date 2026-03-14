'use client';
import { useState, useEffect } from 'react';
import Modal from './Modal';
import { CURRENCIES, setCurrencyCode } from '@/lib/currency';

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState('EUR');

  // Read from localStorage only on client
  useEffect(() => {
    const saved = localStorage.getItem('hb_currency') ?? 'EUR';
    setSelected(saved);
  }, []);

  const handleSave = () => {
    setCurrencyCode(selected);
    window.location.reload();
  };

  return (
    <Modal title="Settings" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Currency
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
              </button>
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 10, lineHeight: 1.5 }}>
            Changes how prices are displayed. Does not convert existing values.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save & Apply</button>
        </div>
      </div>
    </Modal>
  );
}
