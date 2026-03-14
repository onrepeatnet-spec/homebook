'use client';
import { useState } from 'react';
import Icon from './Icon';
import type { Room, Product } from '@/lib/types';
import type { Page } from '@/app/page';

const NAV = [
  { id: 'dashboard',   label: 'Dashboard',    icon: 'sparkles'     as const },
  { id: 'rooms',       label: 'Rooms',        icon: 'room'         as const },
  { id: 'floorplans',  label: 'Floorplans',   icon: 'layers'       as const },
  { id: 'inspiration', label: 'Inspiration',  icon: 'image'        as const },
  { id: 'products',    label: 'Products',     icon: 'shoppingBag'  as const },
  { id: 'budget',      label: 'Budget',       icon: 'dollarSign'   as const },
  { id: 'todos',       label: 'To-Do',        icon: 'check'        as const },
  { id: 'costs',       label: 'Cost Tracker', icon: 'tag'          as const },
  { id: 'calendar',    label: 'Calendar',     icon: 'fileText'     as const },
];

export default function Sidebar({ page, rooms, products, onNavigate }: {
  page: Page;
  rooms: Room[];
  products: Product[];
  onNavigate: (p: Page, roomId?: number) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div style={{ width: open ? 220 : 60, flexShrink: 0, borderRight: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', transition: 'width 0.2s ease', overflow: 'hidden', height: '100vh' }}>
      {/* Logo */}
      <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        {open && (
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 400, letterSpacing: '-0.02em' }}>homebook</div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.1em', marginTop: 1 }}>YOUR HOME LIBRARY</div>
          </div>
        )}
        <button onClick={() => setOpen(!open)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-3)', borderRadius: 6, display: 'flex', marginLeft: open ? 0 : 'auto' }}>
          <Icon name="chevronRight" size={15} />
        </button>
      </div>

      {/* Nav */}
      <div style={{ padding: '10px 10px', flex: 1, overflowY: 'auto' }}>
        {NAV.map(item => (
          <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id as Page)}
            style={{ fontSize: 13 }}>
            <Icon name={item.icon} size={15} />
            {open && item.label}
          </button>
        ))}

        {open && rooms.length > 0 && (
          <>
            <div style={{ padding: '14px 14px 5px', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Rooms</div>
            {rooms.map(room => (
              <button key={room.id}
                className={`nav-item ${page === 'room' ? 'active' : ''}`}
                onClick={() => onNavigate('room', room.id)}
                style={{ paddingLeft: 14, fontSize: 13 }}>
                <span style={{ fontSize: 13 }}>{room.emoji}</span>
                {room.name}
              </button>
            ))}
          </>
        )}
      </div>

      {open && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center' }}>
            {rooms.length} rooms · {products.length} products
          </div>
        </div>
      )}
    </div>
  );
}
