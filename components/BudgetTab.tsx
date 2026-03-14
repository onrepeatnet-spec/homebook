'use client';
import { useState } from 'react';
import Icon from '@/components/Icon';
import Modal from '@/components/Modal';
import { useCurrency } from '@/components/CurrencyContext';
import type { BudgetItem } from '@/lib/types';

export default function BudgetTab({ items, roomId, allRooms, onAdd, onUpdate, onDelete }: {
  items: BudgetItem[];
  roomId: number | null;
  allRooms?: { id: number; name: string; emoji: string }[];
  onAdd: (item: Omit<BudgetItem, 'id' | 'created_at'>) => Promise<void>;
  onUpdate: (id: number, updates: Partial<BudgetItem>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [formRoom, setFormRoom] = useState<number>(roomId ?? allRooms?.[0]?.id ?? 1);
  const [form, setForm] = useState({ name: '', category: '', estimated_price: '', actual_price: '' });
  const { fmt } = useCurrency();

  const filtered = roomId ? items.filter(b => b.room_id === roomId) : items;

  const totalEst   = filtered.reduce((s, b) => s + (b.estimated_price || 0), 0);
  const totalAct   = filtered.filter(b => b.purchased).reduce((s, b) => s + (b.actual_price ?? b.estimated_price ?? 0), 0);
  const remaining  = totalEst - totalAct;
  const progress   = totalEst ? Math.min(100, (totalAct / totalEst) * 100) : 0;

  const handleAdd = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      await onAdd({
        name: form.name,
        category: form.category,
        estimated_price: parseFloat(form.estimated_price) || 0,
        actual_price: form.actual_price ? parseFloat(form.actual_price) : null,
        room_id: formRoom,
        purchased: !!form.actual_price,
      });
      setForm({ name: '', category: '', estimated_price: '', actual_price: '' });
      setShowAdd(false);
    } finally {
      setSaving(false);
    }
  };

  const CATEGORIES = ['Seating', 'Tables', 'Storage', 'Lighting', 'Textiles', 'Decor', 'Art', 'Plants', 'Other'];

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Estimated Total', value: fmt(totalEst),  sub: `${filtered.length} items`, color: 'var(--text)' },
          { label: 'Actual Spent',    value: fmt(totalAct),  sub: `${filtered.filter(b => b.purchased).length} purchased`, color: 'var(--green)' },
          { label: 'Remaining',       value: fmt(remaining), sub: `${Math.round(progress)}% used`, color: remaining < 0 ? 'var(--red)' : 'var(--accent)' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '18px 20px' }}>
            <p style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{s.label}</p>
            <p style={{ fontSize: 22, fontFamily: 'var(--font-serif)', fontWeight: 400, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="progress-bar" style={{ marginBottom: 24 }}>
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Icon name="plus" size={14} /> Add Item
        </button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="budget-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Estimated</th>
                <th style={{ textAlign: 'right' }}>Actual</th>
                <th>Status</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)' }}>No budget items yet</td></tr>
              ) : (
                <>
                  {filtered.map(item => (
                    <tr key={item.id} style={{ opacity: item.purchased ? 0.72 : 1 }}>
                      <td style={{ fontWeight: item.purchased ? 400 : 500, textDecoration: item.purchased ? 'line-through' : 'none' }}>
                        {item.name}
                      </td>
                      <td style={{ color: 'var(--text-3)' }}>{item.category}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-serif)' }}>{fmt(item.estimated_price)}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-serif)', color: item.actual_price ? 'var(--green)' : 'var(--text-3)' }}>
                        {item.actual_price ? fmt(item.actual_price) : '—'}
                      </td>
                      <td>
                        <button
                          onClick={() => onUpdate(item.id, { purchased: !item.purchased })}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '3px 10px', borderRadius: 20, border: `1px solid ${item.purchased ? 'var(--green)' : 'var(--border)'}`, background: item.purchased ? '#ECFBEC' : 'transparent', color: item.purchased ? '#2E7D32' : 'var(--text-3)', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                          {item.purchased && <Icon name="check" size={11} color="#2E7D32" />}
                          {item.purchased ? 'Purchased' : 'Pending'}
                        </button>
                      </td>
                      <td>
                        <button className="btn btn-ghost" style={{ padding: '3px 7px', color: 'var(--text-3)' }}
                          onClick={() => onDelete(item.id)}>
                          <Icon name="trash" size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: 'var(--bg)' }}>
                    <td colSpan={2} style={{ fontWeight: 600, fontSize: 13 }}>Total</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'var(--font-serif)' }}>{fmt(totalEst)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'var(--font-serif)', color: 'var(--green)' }}>{fmt(totalAct)}</td>
                    <td colSpan={2} />
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <Modal title="Add Budget Item" onClose={() => setShowAdd(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Item Name *</label>
              <input className="input" placeholder="e.g. Floor Lamp" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Category</label>
              <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                <option value="">Select a category…</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Estimated Price ($)</label>
              <input className="input" type="number" placeholder="0.00" value={form.estimated_price}
                onChange={e => setForm(f => ({ ...f, estimated_price: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Actual Price ($) <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(leave blank if not yet purchased)</span></label>
              <input className="input" type="number" placeholder="0.00" value={form.actual_price}
                onChange={e => setForm(f => ({ ...f, actual_price: e.target.value }))} />
            </div>

            {allRooms && !roomId && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Room</label>
                <select className="input" value={formRoom} onChange={e => setFormRoom(Number(e.target.value))}>
                  {allRooms.map(r => <option key={r.id} value={r.id}>{r.emoji} {r.name}</option>)}
                </select>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={!form.name || saving} onClick={handleAdd}>
                {saving ? 'Saving…' : 'Add Item'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
