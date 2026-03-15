'use client';
import { useEffect, useRef } from 'react';

export type ContextMenuItem = {
  label: string;
  icon?: string;
  danger?: boolean;
  onClick: () => void;
};

export default function ContextMenu({ x, y, items, onClose }: {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, [onClose]);

  // Clamp to viewport on all four sides
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const menuW = 180;
  const menuH = items.length * 38 + 12;
  const left = Math.max(8, Math.min(x, vw - menuW - 8));
  const top  = Math.max(8, Math.min(y, vh - menuH - 8));

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left, top,
        zIndex: 2000,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        boxShadow: 'var(--shadow-lg)',
        padding: '6px',
        minWidth: menuW,
        animation: 'fadeSlideUp 0.12s ease',
      }}
    >
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => { item.onClick(); onClose(); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            width: '100%', padding: '8px 12px',
            border: 'none', borderRadius: 6,
            background: 'none', cursor: 'pointer',
            fontSize: 13, fontFamily: 'inherit', textAlign: 'left',
            color: item.danger ? 'var(--red)' : 'var(--text)',
            transition: 'background 0.1s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = item.danger ? '#FEF2F0' : 'var(--bg)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        >
          {item.icon && <span style={{ fontSize: 14 }}>{item.icon}</span>}
          {item.label}
        </button>
      ))}
    </div>
  );
}
