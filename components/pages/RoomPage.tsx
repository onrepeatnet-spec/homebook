'use client';
import { useState, useEffect } from 'react';
import InspirationTab from '@/components/InspirationTab';
import MoodboardTab from '@/components/MoodboardTab';
import ProductsTab from '@/components/ProductsTab';
import ColoursTab from '@/components/ColoursTab';
import NotesTab from '@/components/NotesTab';
import BudgetTab from '@/components/BudgetTab';
import type { Room, Inspiration, Product, ColourPalette, BudgetItem, MoodboardItem } from '@/lib/types';
import { getMoodboardItems } from '@/lib/db';

const TABS = ['inspiration', 'moodboard', 'products', 'colours', 'notes', 'budget'] as const;
type Tab = typeof TABS[number];

export default function RoomPage({ room, rooms, inspirations, products, palettes, budgetItems, onAdd, onUpdate, onDelete }: {
  room: Room;
  rooms: Room[];
  inspirations: Inspiration[];
  products: Product[];
  palettes: ColourPalette[];
  budgetItems: BudgetItem[];
  onAdd: {
    inspiration: (i: Omit<Inspiration, 'id' | 'created_at'>) => Promise<void>;
    product: (p: Omit<Product, 'id' | 'created_at'>) => Promise<void>;
    palette: (p: Omit<ColourPalette, 'id' | 'created_at'>) => Promise<void>;
    budget: (b: Omit<BudgetItem, 'id' | 'created_at'>) => Promise<void>;
  };
  onUpdate: {
    inspiration: (id: number, updates: Partial<Inspiration>) => Promise<void>;
    product: (id: number, updates: Partial<Product>) => Promise<void>;
    budget: (id: number, updates: Partial<BudgetItem>) => Promise<void>;
  };
  onDelete: {
    inspiration: (id: number) => Promise<void>;
    product: (id: number) => Promise<void>;
    palette: (id: number) => Promise<void>;
    budget: (id: number) => Promise<void>;
  };
}) {
  const [tab, setTab] = useState<Tab>('inspiration');
  const [moodboardItems, setMoodboardItems] = useState<MoodboardItem[]>([]);
  const [moodboardLoaded, setMoodboardLoaded] = useState(false);

  // Load moodboard items when that tab is first opened
  useEffect(() => {
    if (tab === 'moodboard' && !moodboardLoaded) {
      getMoodboardItems(room.id)
        .then(items => { setMoodboardItems(items); setMoodboardLoaded(true); })
        .catch(() => setMoodboardLoaded(true));
    }
  }, [tab, room.id, moodboardLoaded]);

  const roomInspirations = inspirations.filter(i => i.room_id === room.id);
  const roomProducts     = products.filter(p => p.room_id === room.id);
  const roomPalettes     = palettes.filter(p => p.room_id === room.id);
  const roomBudget       = budgetItems.filter(b => b.room_id === room.id);

  return (
    <div style={{ padding: '28px 36px' }} className="animate-in">
      {/* Room header */}
      <div style={{ marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 44 }}>{room.emoji}</div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 36, fontWeight: 300, letterSpacing: '-0.02em' }}>{room.name}</h1>
            {room.description && <p style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 2 }}>{room.description}</p>}
          </div>
          <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--text-2)', flexWrap: 'wrap' }}>
            <span style={{ background: 'var(--bg)', padding: '5px 12px', borderRadius: 20, border: '1px solid var(--border)' }}>
              📸 {roomInspirations.length}
            </span>
            <span style={{ background: 'var(--bg)', padding: '5px 12px', borderRadius: 20, border: '1px solid var(--border)' }}>
              🛋 {roomProducts.length}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid var(--border)', marginBottom: 28, display: 'flex', gap: 2, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'inspiration' && (
        <InspirationTab
          items={roomInspirations}
          roomId={room.id}
          allRooms={rooms}
          onAdd={onAdd.inspiration}
          onUpdate={onUpdate.inspiration}
          onDelete={onDelete.inspiration}
        />
      )}
      {tab === 'moodboard' && (
        moodboardLoaded
          ? <MoodboardTab roomId={room.id} initialItems={moodboardItems} />
          : <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>Loading moodboard…</div>
      )}
      {tab === 'products' && (
        <ProductsTab
          products={roomProducts}
          roomId={room.id}
          onAdd={onAdd.product}
          onUpdate={onUpdate.product}
          onDelete={onDelete.product}
        />
      )}
      {tab === 'colours' && (
        <ColoursTab
          palettes={roomPalettes}
          roomId={room.id}
          onAdd={onAdd.palette}
          onDelete={onDelete.palette}
        />
      )}
      {tab === 'notes' && <NotesTab roomId={room.id} />}
      {tab === 'budget' && (
        <BudgetTab
          items={roomBudget}
          roomId={room.id}
          onAdd={onAdd.budget}
          onUpdate={onUpdate.budget}
          onDelete={onDelete.budget}
        />
      )}
    </div>
  );
}
