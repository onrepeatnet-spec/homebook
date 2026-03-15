'use client';
import { useState } from 'react';
import Icon from '@/components/Icon';
import Modal from '@/components/Modal';
import type { CalendarEvent, EventType, Todo } from '@/lib/types';

const EVENT_COLORS: Record<EventType, string> = {
  'Delivery':     '#4A7C6F',
  'Appointment':  '#6B7FA8',
  'Tax Deadline': '#C0503A',
  'Task':         '#C17B4E',
  'Other':        '#8B6BAE',
};
const EVENT_ICONS: Record<EventType, string> = {
  'Delivery': '📦', 'Appointment': '📅', 'Tax Deadline': '⚖️', 'Task': '✅', 'Other': '📌',
};
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const EVENT_TYPES: EventType[] = ['Delivery','Appointment','Tax Deadline','Task','Other'];

export default function CalendarPage({ events, todos, onAdd, onUpdate, onDelete }: {
  events: CalendarEvent[];
  todos: Todo[];
  onAdd: (e: Omit<CalendarEvent, 'id' | 'created_at'>) => Promise<void>;
  onUpdate: (id: number, u: Partial<CalendarEvent>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const today = new Date();
  const [year, setYear]     = useState(today.getFullYear());
  const [month, setMonth]   = useState(today.getMonth());
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<string | null>(null); // YYYY-MM-DD
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState<Omit<CalendarEvent, 'id' | 'created_at'>>({
    title: '', date: today.toISOString().slice(0, 10), time: null,
    type: 'Task', notes: '', linked_todo_id: null,
  });

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  // Build calendar grid
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  // Shift so week starts Monday (0=Mon … 6=Sun)
  const startDow = (firstDay.getDay() + 6) % 7;
  const totalCells = Math.ceil((startDow + lastDay.getDate()) / 7) * 7;
  const cells: (number | null)[] = Array.from({ length: totalCells }, (_, i) => {
    const d = i - startDow + 1;
    return d >= 1 && d <= lastDay.getDate() ? d : null;
  });

  const eventsOnDay = (day: number) => {
    const key = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return events.filter(e => e.date === key);
  };

  // Also surface todo due dates as "virtual" events
  const todosDueOnDay = (day: number) => {
    const key = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return todos.filter(t => t.due_date === key && !t.done);
  };

  const selectedDateStr = selected;
  const selectedEvents  = selectedDateStr ? events.filter(e => e.date === selectedDateStr) : [];
  const selectedTodos   = selectedDateStr ? todos.filter(t => t.due_date === selectedDateStr && !t.done) : [];

  const handleAdd = async () => {
    if (!form.title || !form.date) return;
    setSaving(true);
    try { await onAdd(form); setForm({ title: '', date: today.toISOString().slice(0,10), time: null, type: 'Task', notes: '', linked_todo_id: null }); setShowAdd(false); }
    finally { setSaving(false); }
  };

  // Upcoming events (next 30 days)
  const upcoming = events
    .filter(e => {
      const d = new Date(e.date);
      const diff = (d.getTime() - today.getTime()) / 86400000;
      return diff >= 0 && diff <= 30;
    })
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);

  return (
    <div style={{ padding: '28px 36px' }} className="animate-in">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 38, fontWeight: 300 }}>Calendar</h1>
          <p style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 4 }}>{events.length} events</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Icon name="plus" size={14} /> Add Event
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24 }}>
        {/* Calendar */}
        <div>
          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <button className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={prevMonth}><Icon name="chevronRight" size={16} color="var(--text-2)" /></button>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 400, flex: 1, textAlign: 'center' }}>
              {MONTHS[month]} {year}
            </h2>
            <button className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={nextMonth}><Icon name="chevronRight" size={16} /></button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--text-3)', padding: '6px 0', textTransform: 'uppercase' }}>{d}</div>
            ))}
          </div>

          {/* Cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
            {cells.map((day, idx) => {
              if (!day) return <div key={idx} />;
              const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const dayEvents = eventsOnDay(day);
              const dayTodos  = todosDueOnDay(day);
              const isToday   = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
              const isSelected = selected === dateStr;
              return (
                <div key={idx}
                  onClick={() => setSelected(isSelected ? null : dateStr)}
                  style={{
                    minHeight: 72, padding: '6px 8px', borderRadius: 8,
                    background: isSelected ? 'var(--accent-light)' : isToday ? 'var(--bg)' : 'var(--surface)',
                    border: `1px solid ${isSelected ? 'var(--accent)' : isToday ? 'var(--accent)' : 'var(--border)'}`,
                    cursor: 'pointer', transition: 'var(--transition)',
                  }}>
                  <div style={{ fontSize: 12, fontWeight: isToday ? 700 : 400, color: isToday ? 'var(--accent)' : 'var(--text)', marginBottom: 4 }}>{day}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {dayEvents.slice(0, 2).map(e => (
                      <div key={e.id} style={{ fontSize: 10, background: EVENT_COLORS[e.type] + '22', color: EVENT_COLORS[e.type], padding: '1px 5px', borderRadius: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {EVENT_ICONS[e.type]} {e.title}
                      </div>
                    ))}
                    {dayTodos.slice(0, 1).map(t => (
                      <div key={t.id} style={{ fontSize: 10, background: '#C17B4E22', color: 'var(--accent)', padding: '1px 5px', borderRadius: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        ✅ {t.title}
                      </div>
                    ))}
                    {(dayEvents.length + dayTodos.length) > 3 && (
                      <div style={{ fontSize: 10, color: 'var(--text-3)' }}>+{dayEvents.length + dayTodos.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected day panel */}
          {selected && (selectedEvents.length > 0 || selectedTodos.length > 0) && (
            <div className="card" style={{ marginTop: 16, padding: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 400, marginBottom: 14 }}>
                {new Date(selected + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              {selectedEvents.map(e => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: EVENT_COLORS[e.type], marginTop: 4, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{e.title}</div>
                    {e.time && <div style={{ fontSize: 12, color: 'var(--text-3)' }}>🕐 {e.time}</div>}
                    {e.notes && <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{e.notes}</div>}
                  </div>
                  <button className="btn btn-ghost" style={{ padding: '3px 7px', color: 'var(--text-3)' }} onClick={() => onDelete(e.id)}>
                    <Icon name="trash" size={13} />
                  </button>
                </div>
              ))}
              {selectedTodos.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>✅ {t.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Due today</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming sidebar */}
        <div>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 400, marginBottom: 14 }}>Upcoming (30 days)</h3>
          {upcoming.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Nothing scheduled in the next 30 days.</p>
          ) : upcoming.map(e => (
            <div key={e.id} className="card" style={{ padding: '12px 14px', marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{EVENT_ICONS[e.type]}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{e.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                    {new Date(e.date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    {e.time ? ` · ${e.time}` : ''}
                  </div>
                </div>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: EVENT_COLORS[e.type], marginTop: 4, flexShrink: 0 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {showAdd && (
        <Modal title="Add Event" onClose={() => setShowAdd(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Title *</label>
              <input className="input" placeholder="e.g. IMT Payment Deadline" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Date *</label>
                <input className="input" type="date" value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Time</label>
                <input className="input" type="time" value={form.time ?? ''}
                  onChange={e => setForm(f => ({ ...f, time: e.target.value || null }))} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Type</label>
              <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as EventType }))}>
                {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Notes</label>
              <textarea className="input" placeholder="Any details…" value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            {todos.length > 0 && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Link to To-Do (optional)</label>
                <select className="input" value={form.linked_todo_id ?? ''} onChange={e => setForm(f => ({ ...f, linked_todo_id: e.target.value ? Number(e.target.value) : null }))}>
                  <option value="">None</option>
                  {todos.filter(t => !t.done).map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={!form.title || !form.date || saving} onClick={handleAdd}>
                {saving ? 'Saving…' : 'Add Event'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
