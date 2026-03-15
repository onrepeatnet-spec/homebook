'use client';
import { useState, useEffect } from 'react';
import Icon from '@/components/Icon';
import Modal from '@/components/Modal';
import BudgetScenarios from '@/components/BudgetScenarios';
import { useCurrency } from '@/components/CurrencyContext';
import { getSetting, setSetting } from '@/lib/db';
import type { BudgetItem, Product } from '@/lib/types';

const CATEGORIES = ['Seating','Tables','Storage','Lighting','Textiles','Decor','Art','Plants','Other'];

export default function BudgetTab({ items, roomId, allRooms, products, onAdd, onUpdate, onDelete }: {
  items: BudgetItem[];
  roomId: number | null;
  allRooms?: { id: number; name: string; emoji: string }[];
  products?: Product[];
  onAdd: (item: Omit<BudgetItem, 'id' | 'created_at'>) => Promise<void>;
  onUpdate: (id: number, updates: Partial<BudgetItem>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [showAdd, setShowAdd]         = useState(false);
  const [saving, setSaving]           = useState(false);
  const [view, setView]               = useState<'budget' | 'scenarios'>('budget');
  const [formRoom, setFormRoom]       = useState<number>(roomId ?? allRooms?.[0]?.id ?? 1);
  const [form, setForm]               = useState({ name: '', category: '', estimated_price: '', actual_price: '' });
  const goalKey = `budget_goal_${roomId ?? 'all'}`;
  const [budgetGoal, setBudgetGoalState] = useState('');
  const [addMode, setAddMode]         = useState<'manual' | 'product'>('manual');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingGoal, setEditingGoal] = useState(false);

  // Load goal from Supabase on mount
  useEffect(() => {
    getSetting(goalKey).then(val => { if (val) setBudgetGoalState(val); }).catch(() => {});
  }, [goalKey]);

  const setBudgetGoal = (val: string) => {
    setBudgetGoalState(val);
    setSetting(goalKey, val).catch(() => {});
  };
  const { fmt, currency } = useCurrency();

  const filtered = roomId ? items.filter(b => b.room_id === roomId) : items;
  const goal        = parseFloat(budgetGoal) || 0;
  const totalEst    = filtered.reduce((s, b) => s + (b.estimated_price || 0), 0);
  const totalAct    = filtered.filter(b => b.purchased).reduce((s, b) => s + (b.actual_price ?? b.estimated_price ?? 0), 0);
  const remaining   = (goal || totalEst) - totalAct;
  const progressBase = goal || totalEst;
  const progress    = progressBase ? Math.min(100, (totalAct / progressBase) * 100) : 0;

  // Products not yet in budget (for this room if applicable)
  const roomProducts = products?.filter(p => !roomId || p.room_id === roomId) ?? [];
  const addedNames   = new Set(filtered.map(b => b.name.toLowerCase()));
  const availableProducts = roomProducts.filter(p => !addedNames.has(p.name.toLowerCase()));

  const handleAdd = async () => {
    if (addMode === 'product' && selectedProduct) {
      if (!saving) {
        setSaving(true);
        try {
          await onAdd({
            name: selectedProduct.name,
            category: selectedProduct.notes ?? 'Other',
            estimated_price: selectedProduct.price ?? 0,
            actual_price: selectedProduct.status === 'Purchased' ? (selectedProduct.price ?? 0) : null,
            room_id: selectedProduct.room_id ?? formRoom,
            purchased: selectedProduct.status === 'Purchased',
          });
          setSelectedProduct(null); setShowAdd(false);
        } finally { setSaving(false); }
      }
      return;
    }
    if (!form.name) return;
    setSaving(true);
    try {
      await onAdd({
        name: form.name, category: form.category,
        estimated_price: parseFloat(form.estimated_price) || 0,
        actual_price: form.actual_price ? parseFloat(form.actual_price) : null,
        room_id: formRoom,
        purchased: !!form.actual_price,
      });
      setForm({ name: '', category: '', estimated_price: '', actual_price: '' });
      setShowAdd(false);
    } finally { setSaving(false); }
  };

  return (
    <div>
      {/* View switcher */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
        <button className={`tab-btn ${view === 'budget' ? 'active' : ''}`} onClick={() => setView('budget')}>
          💰 Budget Tracker
        </button>
        <button className={`tab-btn ${view === 'scenarios' ? 'active' : ''}`} onClick={() => setView('scenarios')}>
          📋 Scenarios
        </button>
      </div>

      {view === 'scenarios' && products && (
        <BudgetScenarios roomId={roomId} products={products} />
      )}

      {view === 'budget' && (
      <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
        {/* Editable goal card */}
        <div className="card" style={{ padding: '18px 20px', borderLeft: '3px solid var(--accent)' }}>
          <p style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Total Budget Goal</p>
          {editingGoal ? (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input className="input" type="number" placeholder="0" value={budgetGoal} autoFocus
                style={{ fontSize: 16, padding: '4px 8px', fontFamily: 'var(--font-serif)' }}
                onChange={e => setBudgetGoal(e.target.value)}
                onBlur={() => setEditingGoal(false)}
                onKeyDown={e => e.key === 'Enter' && setEditingGoal(false)} />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => setEditingGoal(true)}>
              <p style={{ fontSize: 22, fontFamily: 'var(--font-serif)', fontWeight: 400 }}>
                {goal ? fmt(goal) : <span style={{ color: 'var(--text-3)', fontSize: 14 }}>Set goal…</span>}
              </p>
              <Icon name="edit" size={12} color="var(--text-3)" />
            </div>
          )}
          {goal > 0 && <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>click to edit</p>}
        </div>

        {[
          { label: 'Items Estimated',  value: fmt(totalEst), sub: `${filtered.length} items`,  color: 'var(--text)' },
          { label: 'Actual Spent',     value: fmt(totalAct), sub: `${filtered.filter(b => b.purchased).length} purchased`, color: 'var(--green)' },
          { label: goal ? 'Remaining (vs goal)' : 'Remaining',
            value: fmt(remaining),
            sub: `${Math.round(progress)}% used`,
            color: remaining < 0 ? 'var(--red)' : 'var(--accent)' },
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

      {/* Per-room breakdown — only shown when viewing all rooms, only rooms with non-zero values */}
      {!roomId && allRooms && allRooms.length > 0 && (() => {
        const roomRows = allRooms.map(room => {
          const roomItems = items.filter(b => b.room_id === room.id);
          const est  = roomItems.reduce((s, b) => s + (b.estimated_price || 0), 0);
          const spent = roomItems.filter(b => b.purchased).reduce((s, b) => s + (b.actual_price ?? b.estimated_price ?? 0), 0);
          const count = roomItems.length;
          if (est === 0 && spent === 0) return null;
          return { room, est, spent, count };
        }).filter(Boolean) as { room: { id: number; name: string; emoji: string }; est: number; spent: number; count: number }[];

        if (roomRows.length === 0) return null;
        return (
          <div className="card" style={{ overflow: 'hidden', marginBottom: 24 }}>
            <div style={{ padding: '14px 20px 10px', borderBottom: '1px solid var(--border)' }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-3)' }}>By Room</p>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="budget-table">
                <thead>
                  <tr>
                    <th>Room</th>
                    <th style={{ textAlign: 'right' }}>Estimated</th>
                    <th style={{ textAlign: 'right' }}>Spent</th>
                    <th style={{ textAlign: 'right' }}>Items</th>
                  </tr>
                </thead>
                <tbody>
                  {roomRows.map(({ room, est, spent, count }) => (
                    <tr key={room.id}>
                      <td><span style={{ marginRight: 6 }}>{room.emoji}</span>{room.name}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-serif)' }}>{est > 0 ? fmt(est) : '—'}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-serif)', color: spent > 0 ? 'var(--green)' : 'var(--text-3)' }}>{spent > 0 ? fmt(spent) : '—'}</td>
                      <td style={{ textAlign: 'right', color: 'var(--text-3)' }}>{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

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
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)' }}>No budget items yet — add items or import from Products</td></tr>
              ) : (
                <>
                  {filtered.map(item => (
                    <tr key={item.id} style={{ opacity: item.purchased ? 0.72 : 1 }}>
                      <td style={{ fontWeight: item.purchased ? 400 : 500, textDecoration: item.purchased ? 'line-through' : 'none' }}>{item.name}</td>
                      <td style={{ color: 'var(--text-3)' }}>{item.category}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-serif)' }}>{fmt(item.estimated_price)}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-serif)', color: item.actual_price ? 'var(--green)' : 'var(--text-3)' }}>
                        {item.actual_price ? fmt(item.actual_price) : '—'}
                      </td>
                      <td>
                        <button onClick={() => onUpdate(item.id, { purchased: !item.purchased })}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '3px 10px', borderRadius: 20, border: `1px solid ${item.purchased ? 'var(--green)' : 'var(--border)'}`, background: item.purchased ? '#ECFBEC' : 'transparent', color: item.purchased ? '#2E7D32' : 'var(--text-3)', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                          {item.purchased && <Icon name="check" size={11} color="#2E7D32" />}
                          {item.purchased ? 'Purchased' : 'Pending'}
                        </button>
                      </td>
                      <td>
                        <button className="btn btn-ghost" style={{ padding: '3px 7px', color: 'var(--text-3)' }} onClick={() => onDelete(item.id)}>
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
        <Modal title="Add Budget Item" onClose={() => { setShowAdd(false); setSelectedProduct(null); }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Mode switcher */}
            {roomProducts.length > 0 && (
              <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                <button className={`tab-btn ${addMode === 'product' ? 'active' : ''}`} onClick={() => setAddMode('product')}>
                  🛍 From Products
                </button>
                <button className={`tab-btn ${addMode === 'manual' ? 'active' : ''}`} onClick={() => setAddMode('manual')}>
                  ✏️ Manual
                </button>
              </div>
            )}

            {addMode === 'product' ? (
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 8 }}>
                  Select a product to add to budget
                </label>
                {availableProducts.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--text-3)', padding: '16px 0' }}>All products are already in the budget, or no products exist yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                    {availableProducts.map(p => (
                      <div key={p.id}
                        onClick={() => setSelectedProduct(selectedProduct?.id === p.id ? null : p)}
                        style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 12px', borderRadius: 8, cursor: 'pointer', border: `2px solid ${selectedProduct?.id === p.id ? 'var(--accent)' : 'var(--border)'}`, background: selectedProduct?.id === p.id ? 'var(--accent-light)' : 'var(--surface)', transition: 'var(--transition)' }}>
                        {p.image
                          ? <img src={p.image} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} /> // eslint-disable-line
                          : <div style={{ width: 40, height: 40, background: 'var(--bg)', borderRadius: 6, flexShrink: 0 }} />}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{p.name}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.store} · {p.status}</p>
                        </div>
                        <p style={{ fontSize: 15, fontFamily: 'var(--font-serif)', flexShrink: 0 }}>{fmt(p.price)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
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
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Estimated Price ({currency.symbol})</label>
                  <input className="input" type="number" placeholder="0.00" value={form.estimated_price}
                    onChange={e => setForm(f => ({ ...f, estimated_price: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Actual Price ({currency.symbol}) <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(leave blank if not yet purchased)</span></label>
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
              </>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button className="btn btn-ghost" onClick={() => { setShowAdd(false); setSelectedProduct(null); }}>Cancel</button>
              <button className="btn btn-primary"
                disabled={(addMode === 'product' ? !selectedProduct : !form.name) || saving}
                onClick={handleAdd}>
                {saving ? 'Saving…' : 'Add Item'}
              </button>
            </div>
          </div>
        </Modal>
      )}
      </> /* end view === 'budget' */
      )}
    </div>
  );
}
