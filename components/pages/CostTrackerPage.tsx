'use client';
import { useState } from 'react';
import Icon from '@/components/Icon';
import Modal from '@/components/Modal';
import { useCurrency } from '@/components/CurrencyContext';
import type { CostItem, CostCategory } from '@/lib/types';

const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const CATEGORIES: CostCategory[] = [
  'Purchase Price','IMT','Imposto de Selo','IMI','Notary & Registry',
  'Legal Fees','Mortgage','Condominium','Insurance','Renovation','Other',
];

const CAT_GROUPS: { label: string; cats: CostCategory[]; color: string }[] = [
  { label: 'Acquisition', color: '#C17B4E', cats: ['Purchase Price','IMT','Imposto de Selo','Notary & Registry','Legal Fees'] },
  { label: 'Ongoing Taxes', color: '#8B6BAE', cats: ['IMI','Condominium','Insurance','Mortgage'] },
  { label: 'Works & Other', color: '#4A7C6F', cats: ['Renovation','Other'] },
];

const CAT_INFO: Partial<Record<CostCategory, string>> = {
  'IMT': 'Imposto Municipal sobre Transmissões — property transfer tax paid once on purchase',
  'Imposto de Selo': 'Stamp duty — 0.8% of purchase price, paid at completion',
  'IMI': 'Imposto Municipal sobre Imóveis — annual property tax (0.3–0.45% of taxable value)',
};

export default function CostTrackerPage({ items, onAdd, onUpdate, onDelete }: {
  items: CostItem[];
  onAdd: (item: Omit<CostItem, 'id' | 'created_at'>) => Promise<void>;
  onUpdate: (id: number, updates: Partial<CostItem>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState<Omit<CostItem, 'id' | 'created_at'>>({
    name: '', category: 'Purchase Price', amount: 0, date: null,
    notes: '', recurring: false, recurring_period: null,
  });
  const { fmt } = useCurrency();

  const totalOneOff   = items.filter(i => !i.recurring).reduce((s, i) => s + i.amount, 0);
  const totalMonthly  = items.filter(i => i.recurring && i.recurring_period === 'monthly').reduce((s, i) => s + i.amount, 0);
  const totalYearly   = items.filter(i => i.recurring && i.recurring_period === 'yearly').reduce((s, i) => s + i.amount, 0);
  const grandTotal    = totalOneOff + totalYearly;

  const handleAdd = async () => {
    if (!form.name || !form.amount) return;
    setSaving(true);
    try { await onAdd(form); setForm({ name: '', category: 'Purchase Price', amount: 0, date: null, notes: '', recurring: false, recurring_period: null }); setShowAdd(false); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ padding: '32px 36px' }} className="animate-in">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 38, fontWeight: 300 }}>Cost Tracker</h1>
          <p style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 4 }}>Total cost of ownership</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Icon name="plus" size={14} /> Add Cost
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 32 }}>
        {[
          { label: 'Total Acquisition', value: fmt(items.filter(i => CAT_GROUPS[0].cats.includes(i.category as CostCategory)).reduce((s, i) => s + i.amount, 0)), color: '#C17B4E' },
          { label: 'Annual Taxes & Fees', value: fmt(totalYearly + items.filter(i => i.recurring && i.recurring_period === 'yearly').reduce((s, i) => s + i.amount, 0)), color: '#8B6BAE' },
          { label: 'Monthly Costs', value: `${fmt(totalMonthly)}/mo`, color: '#4A7C6F' },
          { label: 'Grand Total (one-off)', value: fmt(grandTotal), color: 'var(--text)' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '18px 20px' }}>
            <p style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{s.label}</p>
            <p style={{ fontSize: 20, fontFamily: 'var(--font-serif)', fontWeight: 400, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Grouped tables */}
      {CAT_GROUPS.map(group => {
        const groupItems = items.filter(i => group.cats.includes(i.category as CostCategory));
        if (groupItems.length === 0 && items.length > 0) return null;
        const total = groupItems.reduce((s, i) => s + i.amount, 0);
        return (
          <div key={group.label} style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: group.color }} />
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 400 }}>{group.label}</h2>
              {total > 0 && <span style={{ fontSize: 13, color: 'var(--text-2)', marginLeft: 'auto', fontFamily: 'var(--font-serif)' }}>{fmt(total)}</span>}
            </div>
            <div className="card" style={{ overflow: 'hidden' }}>
              <table className="budget-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {groupItems.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-3)' }}>No items yet</td></tr>
                  ) : groupItems.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{item.name}</div>
                        {item.notes && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{item.notes}</div>}
                        {CAT_INFO[item.category as CostCategory] && (
                          <div style={{ fontSize: 11, color: 'var(--text-3)', fontStyle: 'italic', marginTop: 2 }}>ℹ️ {CAT_INFO[item.category as CostCategory]}</div>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{item.category}</td>
                      <td style={{ color: 'var(--text-3)', fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(item.date)}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-serif)', fontWeight: 500 }}>
                        {fmt(item.amount)}
                        {item.recurring && <span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 4 }}>/{item.recurring_period === 'monthly' ? 'mo' : 'yr'}</span>}
                      </td>
                      <td>
                        <button className="btn btn-ghost" style={{ padding: '3px 7px', color: 'var(--text-3)' }} onClick={() => onDelete(item.id)}>
                          <Icon name="trash" size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {items.length === 0 && (
        <div className="card" style={{ padding: '48px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏡</div>
          <p style={{ color: 'var(--text-3)', fontSize: 14 }}>Start tracking your home purchase costs</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowAdd(true)}>Add your first cost</button>
        </div>
      )}

      {showAdd && (
        <Modal title="Add Cost Item" onClose={() => setShowAdd(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Name *</label>
              <input className="input" placeholder="e.g. IMT Payment" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Category</label>
              <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as CostCategory }))}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              {CAT_INFO[form.category] && (
                <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6, fontStyle: 'italic' }}>ℹ️ {CAT_INFO[form.category]}</p>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Amount (€) *</label>
                <input className="input" type="number" placeholder="0.00" value={form.amount || ''}
                  onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Date</label>
                <input className="input" type="date" value={form.date ?? ''}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value || null }))} />
              </div>
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input type="checkbox" checked={form.recurring} onChange={e => setForm(f => ({ ...f, recurring: e.target.checked, recurring_period: e.target.checked ? 'yearly' : null }))} />
                Recurring cost
              </label>
              {form.recurring && (
                <div style={{ marginTop: 10 }}>
                  <select className="input" value={form.recurring_period ?? 'yearly'} onChange={e => setForm(f => ({ ...f, recurring_period: e.target.value as 'monthly' | 'yearly' }))}>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              )}
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Notes</label>
              <textarea className="input" placeholder="Any notes…" value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={!form.name || !form.amount || saving} onClick={handleAdd}>
                {saving ? 'Saving…' : 'Add Cost'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
