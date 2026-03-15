'use client';
import { useState } from 'react';
import ProductsTab from '@/components/ProductsTab';
import type { Product, Room } from '@/lib/types';

export default function AllProductsPage({ products, rooms, onAdd, onUpdate, onDelete }: {
  products: Product[];
  rooms?: Room[];
  onAdd: (p: Omit<Product, 'id' | 'created_at'>) => Promise<void>;
  onUpdate: (id: number, updates: Partial<Product>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [roomFilter, setRoomFilter] = useState<number | null>(null);
  const filtered = roomFilter ? products.filter(p => p.room_id === roomFilter) : products;

  return (
    <div style={{ padding: '32px 36px' }} className="animate-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 38, fontWeight: 300 }}>Products</h1>
        <p style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 4 }}>
          {filtered.length} item{filtered.length !== 1 ? 's' : ''}{roomFilter ? '' : ' across all rooms'}
        </p>
      </div>

      {/* Room filter pills */}
      {rooms && rooms.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          <button
            onClick={() => setRoomFilter(null)}
            style={{ fontSize: 12, padding: '5px 14px', borderRadius: 20, border: '1px solid var(--border)', background: roomFilter === null ? 'var(--accent)' : 'var(--surface)', color: roomFilter === null ? 'white' : 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit', transition: 'var(--transition)' }}>
            All rooms
          </button>
          {rooms.map(r => (
            <button key={r.id}
              onClick={() => setRoomFilter(r.id)}
              style={{ fontSize: 12, padding: '5px 14px', borderRadius: 20, border: '1px solid var(--border)', background: roomFilter === r.id ? 'var(--accent)' : 'var(--surface)', color: roomFilter === r.id ? 'white' : 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit', transition: 'var(--transition)' }}>
              {r.emoji} {r.name}
              <span style={{ marginLeft: 6, opacity: 0.6, fontSize: 11 }}>
                {products.filter(p => p.room_id === r.id).length}
              </span>
            </button>
          ))}
        </div>
      )}

      <ProductsTab
        products={filtered}
        roomId={roomFilter}
        allRooms={rooms}
        onAdd={onAdd}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    </div>
  );
}
