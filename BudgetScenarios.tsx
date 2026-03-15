'use client';
import { useState, useEffect } from 'react';
import Icon from '@/components/Icon';
import Modal from '@/components/Modal';
import { useCurrency } from '@/components/CurrencyContext';
import { getBudgetScenarios, createBudgetScenario, updateBudgetScenario, deleteBudgetScenario } from '@/lib/db';
import type { Product, BudgetScenario, BudgetScenarioItem } from '@/lib/types';

export default function BudgetScenarios({ roomId, products }: {
  roomId: number | null;
  products: Product[];
}) {
  const { fmt } = useCurrency();
  const [scenarios, setScenarios] = useState<BudgetScenario[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showNew, setShowNew]     = useState(false);
  const [newName, setNewName]     = useState('');
  const [saving, setSaving]       = useState(false);
  const [active, setActive]       = useState<BudgetScenario | null>(null);

  useEffect(() => {
    getBudgetScenarios(roomId)
      .then(setScenarios)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [roomId]);

  // Products available for scenarios
  const availableProducts = roomId
    ? products.filter(p => p.room_id === roomId)
    : products;

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      // Pre-populate with all available products, all included by default
      const items: BudgetScenarioItem[] = availableProducts.map(p => ({
        product_id: p.id,
        name: p.name,
        price: p.price ?? 0,
        store: p.store ?? '',
        image: p.image ?? '',
        included: true,
      }));
      const s = await createBudgetScenario({ name: newName.trim(), room_id: roomId, items });
      setScenarios(prev => [...prev, s]);
      setActive(s);
      setNewName('');
      setShowNew(false);
    } finally { setSaving(false); }
  };

  const toggleItem = async (scenario: BudgetScenario, productId: number) => {
    const newItems = scenario.items.map(i =>
      i.product_id === productId ? { ...i, included: !i.included } : i
    );
    const updated = { ...scenario, items: newItems };
    setActive(updated);
    setScenarios(prev => prev.map(s => s.id === scenario.id ? updated : s));
    await updateBudgetScenario(scenario.id, { items: newItems });
  };

  const addProductToScenario = async (scenario: BudgetScenario, product: Product) => {
    if (scenario.items.find(i => i.product_id === product.id)) return;
    const newItem: BudgetScenarioItem = {
      product_id: product.id, name: product.name,
      price: product.price ?? 0, store: product.store ?? '',
      image: product.image ?? '', included: true,
    };
    const newItems = [...scenario.items, newItem];
    const updated = { ...scenario, items: newItems };
    setActive(updated);
    setScenarios(prev => prev.map(s => s.id === scenario.id ? updated : s));
    await updateBudgetScenario(scenario.id, { items: newItems });
  };

  const handleDelete = async (id: number) => {
    await deleteBudgetScenario(id);
    setScenarios(prev => prev.filter(s => s.id !== id));
    if (active?.id === id) setActive(null);
  };

  const handleRename = async (scenario: BudgetScenario, name: string) => {
    const updated = { ...scenario, name };
    setActive(updated);
    setScenarios(prev => prev.map(s => s.id === scenario.id ? updated : s));
    await updateBudgetScenario(scenario.id, { name });
  };

  if (loading) return <div style={{ color: 'var(--text-3)', fontSize: 13, padding: '24px 0' }}>Loading scenarios…</div>;

  return (
    <div>
      {/* Scenario tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {scenarios.map(s => (
          <button key={s.id}
            onClick={() => setActive(active?.id === s.id ? null : s)}
            style={{ padding: '6px 16px', borderRadius: 20, border: `2px solid ${active?.id === s.id ? 'var(--accent)' : 'var(--border)'}`, background: active?.id === s.id ? 'var(--accent-light)' : 'var(--surface)', color: active?.id === s.id ? 'var(--accent)' : 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: active?.id === s.id ? 600 : 400, transition: 'var(--transition)' }}>
            {s.name}
            <span style={{ marginLeft: 8, fontSize: 12, color: active?.id === s.id ? 'var(--accent)' : 'var(--text-3)' }}>
              {fmt(s.items.filter(i => i.included).reduce((sum, i) => sum + i.price, 0))}
            </span>
          </button>
        ))}
        <button className="btn btn-ghost" style={{ borderRadius: 20, fontSize: 13 }} onClick={() => setShowNew(true)}>
          <Icon name="plus" size={13} /> New Scenario
        </button>
      </div>

      {/* Active scenario detail */}
      {active && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
            <input
              className="input"
              style={{ fontSize: 16, fontFamily: 'var(--font-serif)', fontWeight: 400, border: 'none', boxShadow: 'none', padding: '4px 0', background: 'transparent' }}
              value={active.name}
              onChange={e => handleRename(active, e.target.value)}
            />
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2 }}>Selected total</div>
                <div style={{ fontSize: 22, fontFamily: 'var(--font-serif)', fontWeight: 400, color: 'var(--accent)' }}>
                  {fmt(active.items.filter(i => i.included).reduce((s, i) => s + i.price, 0))}
                </div>
              </div>
              <button className="btn btn-ghost" style={{ color: 'var(--red)', padding: '6px 10px' }}
                onClick={() => handleDelete(active.id)}>
                <Icon name="trash" size={14} />
              </button>
            </div>
          </div>

          {/* Items list */}
          <div>
            {active.items.length === 0 ? (
              <p style={{ padding: '24px 20px', color: 'var(--text-3)', fontSize: 13 }}>
                No products in this scenario yet. Add products below.
              </p>
            ) : (
              active.items.map(item => (
                <div key={item.product_id}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border)', opacity: item.included ? 1 : 0.45, transition: 'opacity 0.15s' }}>
                  {/* Toggle checkbox */}
                  <button onClick={() => toggleItem(active, item.product_id)}
                    style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${item.included ? 'var(--accent)' : 'var(--border)'}`, background: item.included ? 'var(--accent)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0 }}>
                    {item.included && <Icon name="check" size={11} color="white" />}
                  </button>
                  {/* Image */}
                  {item.image
                    ? <img src={item.image} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} /> // eslint-disable-line
                    : <div style={{ width: 36, height: 36, background: 'var(--bg)', borderRadius: 6, flexShrink: 0 }} />}
                  {/* Name & store */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, textDecoration: item.included ? 'none' : 'line-through' }}>{item.name}</p>
                    {item.store && <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{item.store}</p>}
                  </div>
                  <p style={{ fontSize: 15, fontFamily: 'var(--font-serif)', flexShrink: 0 }}>{fmt(item.price)}</p>
                </div>
              ))
            )}

            {/* Add products not yet in scenario */}
            {availableProducts.filter(p => !active.items.find(i => i.product_id === p.id)).length > 0 && (
              <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
                <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Add more products</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {availableProducts
                    .filter(p => !active.items.find(i => i.product_id === p.id))
                    .map(p => (
                      <button key={p.id} className="btn btn-ghost"
                        style={{ fontSize: 12, padding: '4px 12px' }}
                        onClick={() => addProductToScenario(active, p)}>
                        + {p.name} ({fmt(p.price)})
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Summary footer */}
          <div style={{ display: 'flex', gap: 24, padding: '14px 20px', background: 'var(--bg)', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Items selected: </span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{active.items.filter(i => i.included).length} of {active.items.length}</span>
            </div>
            <div>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Total: </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', fontFamily: 'var(--font-serif)' }}>
                {fmt(active.items.filter(i => i.included).reduce((s, i) => s + i.price, 0))}
              </span>
            </div>
            {scenarios.length > 1 && (
              <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-3)' }}>
                Compare: {scenarios.map(s => (
                  <span key={s.id} style={{ marginLeft: 8 }}>
                    <strong style={{ color: 'var(--text-2)' }}>{s.name}</strong> {fmt(s.items.filter(i => i.included).reduce((sum, i) => sum + i.price, 0))}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {scenarios.length === 0 && !showNew && (
        <div className="card" style={{ padding: '40px 32px', textAlign: 'center' }}>
          <p style={{ fontSize: 36, marginBottom: 12 }}>📋</p>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 18, marginBottom: 8 }}>No scenarios yet</p>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>
            Create named sets of products to compare different furnishing options and their costs.
          </p>
          <button className="btn btn-primary" onClick={() => setShowNew(true)}>
            <Icon name="plus" size={14} /> Create First Scenario
          </button>
        </div>
      )}

      {/* New scenario modal */}
      {showNew && (
        <Modal title="New Budget Scenario" onClose={() => setShowNew(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Scenario name *</label>
              <input className="input" placeholder="e.g. Minimal Setup, Phase 1, Full Wishlist…"
                value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()} autoFocus />
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
              All {availableProducts.length} products will be added. You can then toggle individual items on/off.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowNew(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={!newName.trim() || saving} onClick={handleCreate}>
                {saving ? 'Creating…' : 'Create Scenario'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
