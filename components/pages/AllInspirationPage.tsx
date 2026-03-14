'use client';
import { useState } from 'react';
import InspirationTab from '@/components/InspirationTab';
import type { Inspiration, Room } from '@/lib/types';

export default function AllInspirationPage({ inspirations, rooms, onAdd, onDelete }: {
  inspirations: Inspiration[];
  rooms: Room[];
  onAdd: (item: Omit<Inspiration, 'id' | 'created_at'>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [roomFilter, setRoomFilter] = useState<number | null>(null);
  const filtered = roomFilter ? inspirations.filter(i => i.room_id === roomFilter) : inspirations;

  return (
    <div style={{ padding: '32px 36px' }} className="animate-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 38, fontWeight: 300 }}>Inspiration</h1>
        <p style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 4 }}>{filtered.length} image{filtered.length !== 1 ? 's' : ''} collected</p>
      </div>

      {/* Room filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <button onClick={() => setRoomFilter(null)}
          style={{ fontSize: 12, padding: '5px 14px', borderRadius: 20, border: '1px solid var(--border)', background: roomFilter === null ? 'var(--accent)' : 'var(--surface)', color: roomFilter === null ? 'white' : 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit', transition: 'var(--transition)' }}>
          All rooms
        </button>
        {rooms.map(r => (
          <button key={r.id} onClick={() => setRoomFilter(r.id)}
            style={{ fontSize: 12, padding: '5px 14px', borderRadius: 20, border: '1px solid var(--border)', background: roomFilter === r.id ? 'var(--accent)' : 'var(--surface)', color: roomFilter === r.id ? 'white' : 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit', transition: 'var(--transition)' }}>
            {r.emoji} {r.name}
          </button>
        ))}
      </div>

      <InspirationTab
        items={filtered}
        roomId={roomFilter}
        allRooms={rooms}
        onAdd={onAdd}
        onDelete={onDelete}
      />
    </div>
  );
}
