'use client';
import { useState, useEffect } from 'react';
import Icon from '@/components/Icon';
import Modal from '@/components/Modal';
import { useCurrency } from '@/components/CurrencyContext';
import { getBudgetScenarios, createBudgetScenario, updateBudgetScenario, deleteBudgetScenario } from '@/lib/db';
import type { BudgetScenario, BudgetScenarioItem, Product } from '@/lib/types';

const SET_COLORS = ['#C17B4E','#6B7FA8','#4A7C6F','#8B6BAE','#B87065','#D4A843','#5A9B8C'];

export default function PlannerTab({ roomId, products }: {
  roomId: number;
  products: Product[];
}) {
  const { fmt } = useCurrency();
  const [sets, setSets]           = useState<BudgetScenario[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [activeSet, setActiveSet] = useState<BudgetScenario | null>(null);
  const [showAdd, setShowAdd]     = useState(false);
  const [newName, setNewName]     = useState('');
  const [confirmDel, setConfirmDel] = useState<BudgetScenario | null>(null);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    getBudgetScenarios(roomId)
      .then(data => { setSets(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [roomId]);

  const createSet = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    const s = await createBudgetScenario({
      name: newName.trim(),
      room_id: roomId,
      items: products.map(p => ({
        product_id: p.id,
        name: p.name,
        price: p.price ?? 0,
        store: p.store,
        image: p.image,
        included: false,
      })),
    });
    setSets(prev => [...prev, s]);
    setActiveSet(s);
    setNewName('');
    setShowAdd(false);
    setSaving(false);
  };

  const toggleItem = async (set: BudgetScenario, productId: number) => {
    const newItems = set.items.map(i =>
      i.product_id === productId ? { ...i, included: !i.included } : i
    );
    // Sync any new products not yet in items list
    const existingIds = new Set(set.items.map(i => i.product_id));
    const fresh = products
      .filter(p => !existingIds.has(p.id))
      .map(p => ({ product_id: p.id, name: p.name, price: p.price ?? 0, store: p.store, image: p.image, included: false }));
    const merged = [...newItems, ...fresh];
    const updated = await updateBudgetScenario(set.id, { items: merged });
    setSets(prev => prev.map(s => s.id === set.id ? updated : s));
    if (activeSet?.id === set.id) setActiveSet(updated);
  };

  const deleteSet = async (set: BudgetScenario) => {
    await deleteBudgetScenario(set.id);
    setSets(prev => prev.filter(s => s.id !== set.id));
    if (activeSet?.id === set.id) setActiveSet(null);
    setConfirmDel(null);
  };

  const renameSet = async (set: BudgetScenario, name: string) => {
    const updated = await updateBudgetScenario(set.id, { name });
    setSets(prev => prev.map(s => s.id === set.id ? updated : s));
    if (activeSet?.id === set.id) setActiveSet(updated);
  };

  // Sync products into a set (adds new products that aren't listed yet)
  const syncedItems = (set: BudgetScenario): BudgetScenarioItem[] => {
    const existingIds = new Set(set.items.map(i => i.product_id));
    const fresh = products
      .filter(p => !existingIds.has(p.id))
      .map(p => ({ product_id: p.id, name: p.name, price: p.price ?? 0, store: p.store, image: p.image, included: false }));
    // Remove items for deleted products
    const validIds = new Set(products.map(p => p.id));
    return [...set.items.filter(i => validIds.has(i.product_id)), ...fresh];
  };

  const setTotal = (set: BudgetScenario) =>
    syncedItems(set).filter(i => i.included).reduce((s, i) => s + (i.price ?? 0), 0);

  const includedProducts = (set: BudgetScenario) =>
    syncedItems(set).filter(i => i.included);

  if (loading) return <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Loading planner…</p>;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
            {sets.length} set{sets.length !== 1 ? 's' : ''} · compare product combinations &amp; budgets
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {sets.length >= 2 && (
            <button className="btn btn-ghost" onClick={() => setComparing(!comparing)}>
              {comparing ? '← Back' : '⚖ Compare All'}
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Icon name="plus" size={14} /> New Set
          </button>
        </div>
      </div>

      {products.length === 0 && (
        <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
          Add products to this room first, then use the Planner to group them into sets.
        </div>
      )}

      {products.length > 0 && sets.length === 0 && (
        <div className="card" style={{ padding: '40px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📐</div>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 18, marginBottom: 6 }}>No sets yet</p>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 16 }}>Create a set to group products and compare combinations</p>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Icon name="plus" size={14} /> Create first set
          </button>
        </div>
      )}

      {/* Compare view */}
      {comparing && sets.length >= 2 && (
        <div style={{ overflowX: 'auto', marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 16, minWidth: sets.length * 280 }}>
            {sets.map((set, si) => {
              const items = includedProducts(set);
              const total = setTotal(set);
              const color = SET_COLORS[si % SET_COLORS.length];
              return (
                <div key={set.id} className="card" style={{ flex: '0 0 260px', overflow: 'hidden', borderTop: `3px solid ${color}` }}>
                  <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid var(--border)' }}>
                    <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{set.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{items.length} product{items.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div style={{ padding: '12px 18px' }}>
                    {items.length === 0 ? (
                      <p style={{ fontSize: 12, color: 'var(--text-3)' }}>No products selected</p>
                    ) : (
                      items.map(item => (
                        <div key={item.product_id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                          {item.image
                            ? <img src={item.image} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} /> // eslint-disable-line
                            : <div style={{ width: 36, height: 36, background: 'var(--bg)', borderRadius: 6, flexShrink: 0, border: '1px solid var(--border)' }} />}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                            {item.store && <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{item.store}</p>}
                          </div>
                          <p style={{ fontSize: 12, fontFamily: 'var(--font-serif)', flexShrink: 0 }}>{fmt(item.price)}</p>
                        </div>
                      ))
                    )}
                    <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</span>
                      <span style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 400, color }}>{fmt(total)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary comparison bar */}
          <div className="card" style={{ marginTop: 16, padding: '16px 20px' }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 14 }}>Budget Comparison</p>
            {(() => {
              const maxTotal = Math.max(...sets.map(setTotal), 1);
              return sets.map((set, si) => {
                const total = setTotal(set);
                const color = SET_COLORS[si % SET_COLORS.length];
                return (
                  <div key={set.id} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>{set.name}</span>
                      <span style={{ fontSize: 13, fontFamily: 'var(--font-serif)', color }}>{fmt(total)}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 3, background: color, width: `${(total / maxTotal) * 100}%`, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* Set tabs + editor */}
      {!comparing && sets.length > 0 && (
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          {/* Set list */}
          <div style={{ width: 200, flexShrink: 0 }}>
            {sets.map((set, si) => {
              const color = SET_COLORS[si % SET_COLORS.length];
              const total = setTotal(set);
              const count = includedProducts(set).length;
              const isActive = activeSet?.id === set.id;
              return (
                <div key={set.id}
                  onClick={() => setActiveSet(set)}
                  style={{ padding: '12px 14px', borderRadius: 10, marginBottom: 8, cursor: 'pointer', border: `1px solid ${isActive ? color : 'var(--border)'}`, background: isActive ? color + '12' : 'var(--surface)', transition: 'var(--transition)', borderLeft: `3px solid ${color}` }}>
                  <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{set.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{count} product{count !== 1 ? 's' : ''}</p>
                  <p style={{ fontSize: 13, fontFamily: 'var(--font-serif)', color, marginTop: 4 }}>{fmt(total)}</p>
                </div>
              );
            })}
          </div>

          {/* Set editor */}
          {activeSet && (() => {
            const items = syncedItems(activeSet);
            const included = items.filter(i => i.included);
            const total = included.reduce((s, i) => s + (i.price ?? 0), 0);
            const si = sets.findIndex(s => s.id === activeSet.id);
            const color = SET_COLORS[si % SET_COLORS.length];

            return (
              <div style={{ flex: 1 }}>
                {/* Set header */}
                <div className="card" style={{ padding: '16px 20px', marginBottom: 16, borderTop: `3px solid ${color}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <EditableSetName name={activeSet.name} onSave={name => renameSet(activeSet, name)} />
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                      <span style={{ fontSize: 13, fontFamily: 'var(--font-serif)', color }}>
                        {fmt(total)}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-3)', alignSelf: 'center' }}>
                        ({included.length}/{items.length} selected)
                      </span>
                      <button className="btn btn-ghost" style={{ color: 'var(--red)', borderColor: 'var(--red)', fontSize: 11, padding: '4px 10px' }}
                        onClick={() => setConfirmDel(activeSet)}>
                        <Icon name="trash" size={12} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Product checkboxes */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                  {items.map(item => {
                    const product = products.find(p => p.id === item.product_id);
                    return (
                      <div key={item.product_id}
                        onClick={() => toggleItem(activeSet, item.product_id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                          border: `2px solid ${item.included ? color : 'var(--border)'}`,
                          background: item.included ? color + '0e' : 'var(--surface)',
                          transition: 'var(--transition)',
                        }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: 5, border: `2px solid ${item.included ? color : 'var(--border-dark)'}`,
                          background: item.included ? color : 'transparent', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'var(--transition)',
                        }}>
                          {item.included && <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        {item.image
                          ? <img src={item.image} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} /> // eslint-disable-line
                          : <div style={{ width: 40, height: 40, background: 'var(--bg)', borderRadius: 6, flexShrink: 0, border: '1px solid var(--border)' }} />}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-3)' }}>
                            {item.store && `${item.store} · `}{fmt(item.price)}
                          </p>
                          {product?.status && (
                            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8, background: 'var(--accent-light)', color: 'var(--accent)' }}>
                              {product.status}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {items.length === 0 && (
                  <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                    No products in this room yet.
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Add set modal */}
      {showAdd && (
        <Modal title="New Product Set" onClose={() => setShowAdd(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Set Name *</label>
              <input className="input" placeholder="e.g. Option A, Minimal Setup, Luxury Version…"
                value={newName} onChange={e => setNewName(e.target.value)}
                autoFocus onKeyDown={e => e.key === 'Enter' && createSet()} />
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
              All {products.length} room product{products.length !== 1 ? 's' : ''} will be added to this set. Tick the ones you want to include.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={!newName.trim() || saving} onClick={createSet}>
                {saving ? 'Creating…' : 'Create Set'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm delete modal */}
      {confirmDel && (
        <Modal title="Delete set?" onClose={() => setConfirmDel(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>
              Delete <strong>{confirmDel.name}</strong>? This can't be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setConfirmDel(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: 'var(--red)', borderColor: 'var(--red)' }}
                onClick={() => deleteSet(confirmDel)}>Delete</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Inline editable set name
function EditableSetName({ name, onSave }: { name: string; onSave: (n: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(name);
  if (editing) return (
    <input
      className="input"
      value={val}
      autoFocus
      style={{ fontSize: 15, fontWeight: 600, padding: '4px 8px', width: 180 }}
      onChange={e => setVal(e.target.value)}
      onBlur={() => { onSave(val); setEditing(false); }}
      onKeyDown={e => { if (e.key === 'Enter') { onSave(val); setEditing(false); } if (e.key === 'Escape') setEditing(false); }}
    />
  );
  return (
    <button onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
      <span style={{ fontSize: 15, fontWeight: 600 }}>{name}</span>
      <Icon name="edit" size={12} color="var(--text-3)" />
    </button>
  );
}
