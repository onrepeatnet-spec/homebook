'use client';
import { useState } from 'react';
import BudgetTab from '@/components/BudgetTab';
import type { BudgetItem, Room, Product } from '@/lib/types';

export default function BudgetOverviewPage({ budgetItems = [], rooms = [], products = [], onAdd, onUpdate, onDelete }: {
  budgetItems: BudgetItem[];
  rooms: Room[];
  products: Product[];
  onAdd: (b: Omit<BudgetItem, 'id' | 'created_at'>) => Promise<void>;
  onUpdate: (id: number, updates: Partial<BudgetItem>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [roomFilter, setRoomFilter] = useState<number | null>(null);

  return (
    <div style={{ padding: '32px 36px' }} className="animate-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 38, fontWeight: 300 }}>Budget</h1>
        <p style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 4 }}>Track your spending across all rooms</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        <button onClick={() => setRoomFilter(null)}
          style={{ fontSize: 12, padding: '5px 14px', borderRadius: 20, border: '1px solid var(--border)', background: roomFilter === null ? 'var(--accent)' : 'var(--surface)', color: roomFilter === null ? 'white' : 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit', transition: 'var(--transition)' }}>
          All Rooms
        </button>
        {rooms.map(r => (
          <button key={r.id} onClick={() => setRoomFilter(r.id)}
            style={{ fontSize: 12, padding: '5px 14px', borderRadius: 20, border: '1px solid var(--border)', background: roomFilter === r.id ? 'var(--accent)' : 'var(--surface)', color: roomFilter === r.id ? 'white' : 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit', transition: 'var(--transition)' }}>
            {r.emoji} {r.name}
          </button>
        ))}
      </div>

      <BudgetTab
        items={budgetItems}
        roomId={roomFilter}
        allRooms={rooms}
        products={products}
        onAdd={onAdd}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    </div>
  );
}
