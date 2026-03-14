'use client';
import Icon from '@/components/Icon';
import type { Room, Inspiration, Product, BudgetItem, Todo, CostItem, CalendarEvent } from '@/lib/types';
import type { Page } from '@/app/page';

const fmt  = (n: number | null | undefined) => n == null ? '—' : `$${Number(n).toLocaleString()}`;
const fmtE = (n: number) => `€${Number(n).toLocaleString('pt-PT', { minimumFractionDigits: 0 })}`;

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

const EVENT_COLORS: Record<string, string> = {
  'Delivery': '#4A7C6F', 'Appointment': '#6B7FA8',
  'Tax Deadline': '#C0503A', 'Task': '#C17B4E', 'Other': '#8B6BAE',
};
const PRIORITY_COLORS: Record<string, string> = {
  High: '#C0503A', Medium: '#D4A843', Low: '#4A7C6F',
};

export default function Dashboard({ rooms, inspirations, products, budgetItems, todos, costItems, calEvents, onNavigate }: {
  rooms: Room[];
  inspirations: Inspiration[];
  products: Product[];
  budgetItems: BudgetItem[];
  todos?: Todo[];
  costItems?: CostItem[];
  calEvents?: CalendarEvent[];
  onNavigate: (p: Page, roomId?: number) => void;
}) {
  const totalEst   = budgetItems.reduce((s, b) => s + (b.estimated_price || 0), 0);
  const totalSpent = budgetItems.filter(b => b.purchased).reduce((s, b) => s + (b.actual_price ?? b.estimated_price ?? 0), 0);
  const progress   = totalEst ? (totalSpent / totalEst) * 100 : 0;

  const pendingTodos = (todos ?? []).filter(t => !t.done);
  const overdueTodos = pendingTodos.filter(t => t.due_date && new Date(t.due_date) < new Date());

  const today = new Date();
  const upcomingEvents = (calEvents ?? [])
    .filter(e => {
      const d = new Date(e.date);
      const diff = (d.getTime() - today.getTime()) / 86400000;
      return diff >= 0 && diff <= 14;
    })
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);

  const totalCosts = (costItems ?? []).reduce((s, c) => s + c.amount, 0);

  const stats = [
    { label: 'Rooms',        value: rooms.length,        icon: 'room'        as const, color: 'var(--accent)',  page: 'rooms'       as Page },
    { label: 'Inspirations', value: inspirations.length, icon: 'image'       as const, color: '#6B7FA8',        page: 'inspiration' as Page },
    { label: 'Products',     value: products.length,     icon: 'shoppingBag' as const, color: 'var(--green)',   page: 'products'    as Page },
    { label: 'To-Do',        value: pendingTodos.length, icon: 'check'       as const, color: '#8B6BAE',        page: 'todos'       as Page },
  ];

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1200 }} className="animate-in">
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <p style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>
          {greeting()} ✦
        </p>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 42, fontWeight: 300, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          Your Home,<br /><em>Beautifully Planned</em>
        </h1>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 14, marginBottom: 28 }}>
        {stats.map((s, i) => (
          <div key={i} className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
            onClick={() => onNavigate(s.page)}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={s.icon} size={18} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'var(--font-serif)', letterSpacing: '-0.02em' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Overdue alert */}
      {overdueTodos.length > 0 && (
        <div style={{ background: '#FEF2F0', border: '1px solid #FBCDC7', borderRadius: 10, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
          onClick={() => onNavigate('todos')}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#C0503A' }}>
              {overdueTodos.length} overdue task{overdueTodos.length > 1 ? 's' : ''}
            </p>
            <p style={{ fontSize: 12, color: '#C0503A', opacity: 0.8 }}>
              {overdueTodos.slice(0, 2).map(t => t.title).join(', ')}{overdueTodos.length > 2 ? ` +${overdueTodos.length - 2} more` : ''}
            </p>
          </div>
          <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
            <Icon name="chevronRight" size={16} color="#C0503A" />
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
        {/* Budget progress */}
        <div className="card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>Room Budget</p>
              <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{fmt(totalSpent)} of {fmt(totalEst)}</p>
            </div>
            <button onClick={() => onNavigate('budget')} style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              View →
            </button>
          </div>
          {totalEst > 0 ? (
            <>
              <div className="progress-bar" style={{ marginBottom: 8 }}>
                <div className="progress-fill" style={{ width: `${Math.min(100, progress)}%` }} />
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-2)', fontFamily: 'var(--font-serif)' }}>
                {fmt(totalEst - totalSpent)} remaining
              </p>
            </>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>No budget items yet</p>
          )}

          {/* Cost tracker summary */}
          {totalCosts > 0 && (
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: 12, color: 'var(--text-2)' }}>Total home cost</p>
                <button onClick={() => onNavigate('costs')} style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  View →
                </button>
              </div>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 300, marginTop: 4 }}>{fmtE(totalCosts)}</p>
            </div>
          )}
        </div>

        {/* Upcoming events */}
        <div className="card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <p style={{ fontSize: 13, fontWeight: 500 }}>Upcoming</p>
            <button onClick={() => onNavigate('calendar')} style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              Calendar →
            </button>
          </div>
          {upcomingEvents.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Nothing in the next 14 days</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {upcomingEvents.map(e => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: EVENT_COLORS[e.type] ?? 'var(--accent)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-3)' }}>
                      {new Date(e.date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                      {e.time ? ` · ${e.time}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pending todos */}
      {pendingTodos.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 400 }}>To-Do</h2>
            <button onClick={() => onNavigate('todos')} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              View all {pendingTodos.length} →
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pendingTodos
              .sort((a, b) => {
                // Overdue first, then high priority
                const aOver = a.due_date && new Date(a.due_date) < new Date();
                const bOver = b.due_date && new Date(b.due_date) < new Date();
                if (aOver !== bOver) return aOver ? -1 : 1;
                const p = { High: 0, Medium: 1, Low: 2 };
                return (p[a.priority] ?? 1) - (p[b.priority] ?? 1);
              })
              .slice(0, 5)
              .map(todo => {
                const overdue = todo.due_date && new Date(todo.due_date) < new Date();
                return (
                  <div key={todo.id} className="card" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                    onClick={() => onNavigate('todos')}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_COLORS[todo.priority] ?? 'var(--text-3)', flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{todo.title}</span>
                    {todo.due_date && (
                      <span style={{ fontSize: 11, color: overdue ? 'var(--red)' : 'var(--text-3)', whiteSpace: 'nowrap', fontWeight: overdue ? 600 : 400 }}>
                        {overdue ? '⚠️ ' : ''}{new Date(todo.due_date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: 'var(--text-3)', background: 'var(--bg)', padding: '2px 8px', borderRadius: 10, border: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                      {todo.category}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Rooms */}
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 400, marginBottom: 14 }}>Rooms</h2>
      {rooms.length === 0 ? (
        <div className="card" style={{ padding: '40px 32px', textAlign: 'center', marginBottom: 28 }}>
          <p style={{ color: 'var(--text-3)', fontSize: 14 }}>No rooms yet.</p>
          <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => onNavigate('rooms')}>
            <Icon name="plus" size={14} /> Add your first room
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 28 }}>
          {rooms.map(room => {
            const ri = inspirations.filter(i => i.room_id === room.id).length;
            const rp = products.filter(p => p.room_id === room.id).length;
            return (
              <div key={room.id} className="card" style={{ padding: 18, cursor: 'pointer', borderLeft: `3px solid ${room.color}` }}
                onClick={() => onNavigate('room', room.id)}>
                <div style={{ fontSize: 26, marginBottom: 8 }}>{room.emoji}</div>
                <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 3 }}>{room.name}</div>
                <div style={{ display: 'flex', gap: 10, marginTop: 10, fontSize: 11, color: 'var(--text-2)' }}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 400 }}>Recent Inspiration</h2>
            <button onClick={() => onNavigate('inspiration')} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              View all →
            </button>
          </div>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
            {inspirations.slice(0, 8).map(insp => (
              <div key={insp.id} className="card" style={{ flexShrink: 0, width: 160, overflow: 'hidden', cursor: 'pointer' }}
                onClick={() => onNavigate('inspiration')}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={insp.image_url} alt="" style={{ width: '100%', height: 110, objectFit: 'cover' }} />
                {insp.source_name && (
                  <div style={{ padding: '6px 8px', fontSize: 10, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {insp.source_name}
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
