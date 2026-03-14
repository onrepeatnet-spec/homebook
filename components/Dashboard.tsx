'use client';
import Icon from '@/components/Icon';
import type { Room, Inspiration, Product, BudgetItem } from '@/lib/types';
import type { Page } from '@/app/page';

const fmt = (n: number | null | undefined) =>
  n == null ? '—' : `$${Number(n).toLocaleString()}`;

export default function Dashboard({ rooms, inspirations, products, budgetItems, onNavigate }: {
  rooms: Room[];
  inspirations: Inspiration[];
  products: Product[];
  budgetItems: BudgetItem[];
  onNavigate: (p: Page, roomId?: number) => void;
}) {
  const totalEst  = budgetItems.reduce((s, b) => s + (b.estimated_price || 0), 0);
  const totalSpent = budgetItems.filter(b => b.purchased).reduce((s, b) => s + (b.actual_price ?? b.estimated_price ?? 0), 0);
  const progress  = totalEst ? (totalSpent / totalEst) * 100 : 0;

  const stats = [
    { label: 'Rooms',        value: rooms.length,        icon: 'room'        as const, color: 'var(--accent)' },
    { label: 'Inspirations', value: inspirations.length, icon: 'image'       as const, color: '#6B7FA8' },
    { label: 'Products',     value: products.length,     icon: 'shoppingBag' as const, color: 'var(--green)' },
    { label: 'Budget Used',  value: `${Math.round(progress)}%`, icon: 'dollarSign' as const, color: '#8B6BAE' },
  ];

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1200 }} className="animate-in">
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <p style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>
          Good morning ✦
        </p>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 42, fontWeight: 300, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          Your Home,<br /><em>Beautifully Planned</em>
        </h1>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        {stats.map((s, i) => (
          <div key={i} className="card" style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={s.icon} size={20} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 600, fontFamily: 'var(--font-serif)', letterSpacing: '-0.02em' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Budget progress */}
      {totalEst > 0 && (
        <div className="card" style={{ padding: '20px 24px', marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>Total Budget</p>
              <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{fmt(totalSpent)} spent of {fmt(totalEst)} estimated</p>
            </div>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 300 }}>
              {fmt(totalEst - totalSpent)} <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-3)' }}>remaining</span>
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${Math.min(100, progress)}%` }} />
          </div>
        </div>
      )}

      {/* Rooms */}
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 400, marginBottom: 18 }}>Rooms</h2>
      {rooms.length === 0 ? (
        <div className="card" style={{ padding: '48px 32px', textAlign: 'center', marginBottom: 36 }}>
          <p style={{ color: 'var(--text-3)', fontSize: 14 }}>No rooms yet.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => onNavigate('rooms')}>
            <Icon name="plus" size={14} /> Add your first room
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 14, marginBottom: 36 }}>
          {rooms.map(room => {
            const ri = inspirations.filter(i => i.room_id === room.id).length;
            const rp = products.filter(p => p.room_id === room.id).length;
            return (
              <div key={room.id} className="card" style={{ padding: 20, cursor: 'pointer', borderLeft: `3px solid ${room.color}` }}
                onClick={() => onNavigate('room', room.id)}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{room.emoji}</div>
                <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>{room.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{room.description}</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 12, fontSize: 11, color: 'var(--text-2)' }}>
                  <span>📸 {ri}</span>
                  <span>🛋 {rp}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent inspiration */}
      {inspirations.length > 0 && (
        <>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 400, marginBottom: 18 }}>Recent Inspiration</h2>
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8 }}>
            {inspirations.slice(0, 8).map(insp => (
              <div key={insp.id} className="card" style={{ flexShrink: 0, width: 180, overflow: 'hidden', cursor: 'pointer' }}
                onClick={() => onNavigate('inspiration')}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={insp.image_url} alt="" style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                {insp.tags?.length > 0 && (
                  <div style={{ padding: '8px 10px', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {insp.tags.slice(0, 2).map(t => (
                      <span key={t} style={{ fontSize: 10, background: 'var(--accent-light)', color: 'var(--accent)', padding: '2px 6px', borderRadius: 10 }}>{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
