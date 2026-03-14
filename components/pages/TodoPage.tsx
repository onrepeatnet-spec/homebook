'use client';
import { useState } from 'react';
import Icon from '@/components/Icon';
import Modal from '@/components/Modal';
import type { Todo, TodoCategory, TodoPriority } from '@/lib/types';

const CATEGORIES: TodoCategory[] = ['Tax & Legal','Installation','Interior Design','Admin','Delivery','Appointment','Other'];
const PRIORITIES: TodoPriority[] = ['High','Medium','Low'];

const CATEGORY_ICONS: Record<TodoCategory, string> = {
  'Tax & Legal': '⚖️', 'Installation': '🔧', 'Interior Design': '🎨',
  'Admin': '📋', 'Delivery': '📦', 'Appointment': '📅', 'Other': '📌',
};
const PRIORITY_COLORS: Record<TodoPriority, string> = {
  High: 'var(--red)', Medium: 'var(--yellow)', Low: 'var(--green)',
};

const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const isOverdue = (due: string | null) => due && new Date(due) < new Date() ? true : false;

export default function TodoPage({ todos, onAdd, onUpdate, onDelete }: {
  todos: Todo[];
  onAdd: (t: Omit<Todo, 'id' | 'created_at'>) => Promise<void>;
  onUpdate: (id: number, updates: Partial<Todo>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [showAdd, setShowAdd]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [filterCat, setFilterCat] = useState<TodoCategory | 'All'>('All');
  const [showDone, setShowDone]   = useState(false);
  const [form, setForm]           = useState<Omit<Todo, 'id' | 'created_at'>>({
    title: '', description: '', category: 'Other', priority: 'Medium', due_date: null, done: false,
  });

  const filtered = todos
    .filter(t => filterCat === 'All' || t.category === filterCat)
    .filter(t => showDone ? true : !t.done);

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const items = filtered.filter(t => t.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {} as Record<TodoCategory, Todo[]>);

  const handleAdd = async () => {
    if (!form.title) return;
    setSaving(true);
    try { await onAdd(form); setForm({ title: '', description: '', category: 'Other', priority: 'Medium', due_date: null, done: false }); setShowAdd(false); }
    finally { setSaving(false); }
  };

  const pending = todos.filter(t => !t.done).length;
  const done    = todos.filter(t => t.done).length;

  return (
    <div style={{ padding: '32px 36px' }} className="animate-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 38, fontWeight: 300 }}>To-Do</h1>
          <p style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 4 }}>
            {pending} pending · {done} done
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Icon name="plus" size={14} /> Add Task
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => setFilterCat('All')}
          style={{ fontSize: 12, padding: '5px 14px', borderRadius: 20, border: '1px solid var(--border)', background: filterCat === 'All' ? 'var(--accent)' : 'var(--surface)', color: filterCat === 'All' ? 'white' : 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit' }}>
          All
        </button>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setFilterCat(c)}
            style={{ fontSize: 12, padding: '5px 14px', borderRadius: 20, border: '1px solid var(--border)', background: filterCat === c ? 'var(--accent)' : 'var(--surface)', color: filterCat === c ? 'white' : 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit' }}>
            {CATEGORY_ICONS[c]} {c}
          </button>
        ))}
        <button onClick={() => setShowDone(s => !s)} style={{ marginLeft: 'auto', fontSize: 12, padding: '5px 14px', borderRadius: 20, border: '1px solid var(--border)', background: showDone ? 'var(--surface)' : 'var(--bg)', color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit' }}>
          {showDone ? 'Hide completed' : 'Show completed'}
        </button>
      </div>

      {/* Grouped tasks */}
      {Object.keys(grouped).length === 0 ? (
        <div className="card" style={{ padding: '48px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <p style={{ color: 'var(--text-3)', fontSize: 14 }}>{todos.length === 0 ? 'No tasks yet' : 'All done!'}</p>
          {todos.length === 0 && <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowAdd(true)}>Add your first task</button>}
        </div>
      ) : (
        Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 16 }}>{CATEGORY_ICONS[cat as TodoCategory]}</span>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 400 }}>{cat}</h2>
              <span style={{ fontSize: 11, color: 'var(--text-3)', background: 'var(--bg)', padding: '2px 8px', borderRadius: 20, border: '1px solid var(--border)' }}>
                {items.filter(i => !i.done).length} left
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.sort((a, b) => {
                // Sort: overdue first, then by priority, then by date
                const po = { High: 0, Medium: 1, Low: 2 };
                if (isOverdue(a.due_date) !== isOverdue(b.due_date)) return isOverdue(a.due_date) ? -1 : 1;
                return (po[a.priority] ?? 1) - (po[b.priority] ?? 1);
              }).map((todo) => (
                <div key={todo.id}>
                  <TodoItem todo={todo} onUpdate={onUpdate} onDelete={onDelete} />
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {showAdd && (
        <Modal title="Add Task" onClose={() => setShowAdd(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Title *</label>
              <input className="input" placeholder="e.g. Pay IMT tax" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Description</label>
              <textarea className="input" placeholder="Details…" value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Category</label>
                <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as TodoCategory }))}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Priority</label>
                <select className="input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as TodoPriority }))}>
                  {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Due Date</label>
              <input className="input" type="date" value={form.due_date ?? ''}
                onChange={e => setForm(f => ({ ...f, due_date: e.target.value || null }))} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={!form.title || saving} onClick={handleAdd}>
                {saving ? 'Saving…' : 'Add Task'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

type TodoItemProps = {
  todo: Todo;
  onUpdate: (id: number, updates: Partial<Todo>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
};

function TodoItem({ todo, onUpdate, onDelete }: TodoItemProps) {
  const [expanded, setExpanded] = useState(false);
  const overdue = isOverdue(todo.due_date) && !todo.done;

  return (
    <div className="card" style={{ padding: '12px 16px', opacity: todo.done ? 0.6 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Checkbox */}
        <button
          onClick={() => onUpdate(todo.id, { done: !todo.done })}
          style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${todo.done ? 'var(--green)' : 'var(--border-dark)'}`, background: todo.done ? 'var(--green)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'var(--transition)' }}>
          {todo.done && <Icon name="check" size={11} color="white" />}
        </button>

        {/* Priority dot */}
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_COLORS[todo.priority], flexShrink: 0 }} />

        {/* Title */}
        <span style={{ flex: 1, fontSize: 14, fontWeight: 500, textDecoration: todo.done ? 'line-through' : 'none', color: todo.done ? 'var(--text-3)' : 'var(--text)' }}>
          {todo.title}
        </span>

        {/* Due date */}
        {todo.due_date && (
          <span style={{ fontSize: 11, color: overdue ? 'var(--red)' : 'var(--text-3)', fontWeight: overdue ? 600 : 400, whiteSpace: 'nowrap' }}>
            {overdue ? '⚠️ ' : ''}{fmt(todo.due_date)}
          </span>
        )}

        {/* Expand / delete */}
        <button onClick={() => setExpanded(e => !e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', padding: 2 }}>
          <Icon name={expanded ? 'chevronDown' : 'chevronRight'} size={14} />
        </button>
      </div>

      {expanded && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          {todo.description && <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12, lineHeight: 1.6 }}>{todo.description}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" style={{ color: 'var(--red)', borderColor: 'var(--red)', fontSize: 12 }}
              onClick={() => onDelete(todo.id)}>
              <Icon name="trash" size={13} /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
