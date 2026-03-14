'use client';
import { useState } from 'react';
import Icon from '@/components/Icon';
import Modal from '@/components/Modal';
import ImageUpload from '@/components/ImageUpload';
import ImagePicker from '@/components/ImagePicker';
import { fetchMetadata } from '@/lib/metadata';
import { useCurrency } from '@/components/CurrencyContext';
import type { Product } from '@/lib/types';

const statusColor = (s: string) => ({ Idea: 'badge-idea', Considering: 'badge-considering', Buying: 'badge-buying', Purchased: 'badge-purchased' }[s] ?? 'badge-idea');
const STATUSES = ['Idea', 'Considering', 'Buying', 'Purchased'] as const;
type Status = typeof STATUSES[number];

const EMPTY = { name: '', store: '', url: '', price: '', notes: '', status: 'Idea' as Status, image: '' };

export default function ProductsTab({ products, roomId, allRooms, onAdd, onUpdate, onDelete }: {
  products: Product[];
  roomId: number | null;
  allRooms?: { id: number; name: string; emoji: string }[];
  onAdd: (p: Omit<Product, 'id' | 'created_at'>) => Promise<void>;
  onUpdate: (id: number, updates: Partial<Product>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [showAdd, setShowAdd]   = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [filter, setFilter]     = useState<Status | 'All'>('All');
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [fetching, setFetching] = useState(false);
  const [formRoom, setFormRoom] = useState<number>(roomId ?? allRooms?.[0]?.id ?? 1);
  const [addMode, setAddMode]   = useState<'link' | 'manual'>('link');
  const { fmt } = useCurrency();

  const filtered = products
    .filter(p => !roomId || p.room_id === roomId)
    .filter(p => filter === 'All' || p.status === filter);

  const [fetchStatus, setFetchStatus] = useState<'idle' | 'loading' | 'done' | 'failed'>('idle');
  const [fetchedImages, setFetchedImages] = useState<string[]>([]);

  const fetchFromLink = async () => {
    if (!form.url) return;
    setFetching(true);
    setFetchStatus('loading');
    setFetchedImages([]);
    const meta = await fetchMetadata(form.url);
    const gotSomething = meta.image || meta.title || meta.publisher || (meta.images && meta.images.length > 0);
    const allImages = meta.images ?? (meta.image ? [meta.image] : []);
    setFetchedImages(allImages);
    setForm(f => ({
      ...f,
      name:  meta.title     || f.name,
      store: meta.publisher || f.store,
      image: allImages[0]   || f.image,
      price: meta.price     || f.price,
    }));
    setFetchStatus(gotSomething ? 'done' : 'failed');
    setFetching(false);
  };

  const handleAdd = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      await onAdd({ ...form, price: parseFloat(form.price) || 0, room_id: formRoom, status: form.status });
      setForm(EMPTY);
      setShowAdd(false);
    } finally { setSaving(false); }
  };

  const handleStatusChange = async (id: number, status: Status) => {
    await onUpdate(id, { status });
    if (selected?.id === id) setSelected(s => s ? { ...s, status } : null);
  };

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {(['All', ...STATUSES] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ fontSize: 12, padding: '5px 14px', borderRadius: 20, border: '1px solid var(--border)', background: filter === s ? 'var(--accent)' : 'var(--surface)', color: filter === s ? 'white' : 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit', transition: 'var(--transition)' }}>
            {s}
          </button>
        ))}
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => setShowAdd(true)}>
          <Icon name="plus" size={14} /> Add Product
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ padding: '48px 32px', textAlign: 'center' }}>
          <Icon name="shoppingBag" size={36} color="var(--border-dark)" />
          <p style={{ marginTop: 14, color: 'var(--text-3)', fontSize: 14 }}>No products yet</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {filtered.map((p, idx) => (
            <div key={p.id} className="card animate-in" style={{ animationDelay: `${idx * 0.03}s`, cursor: 'pointer', overflow: 'hidden' }}
              onClick={() => setSelected(p)}>
              {p.image
                ? <img src={p.image} alt={p.name} style={{ width: '100%', height: 160, objectFit: 'cover' }} /> // eslint-disable-line
                : <div style={{ width: '100%', height: 160, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="shoppingBag" size={36} color="var(--border-dark)" /></div>
              }
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <h3 style={{ fontWeight: 500, fontSize: 14, lineHeight: 1.3 }}>{p.name}</h3>
                  <span className={`badge ${statusColor(p.status)}`}>{p.status}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>{p.store}</div>
                <div style={{ fontSize: 18, fontFamily: 'var(--font-serif)', fontWeight: 500 }}>{fmt(p.price)}</div>
                {p.notes && <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6, lineHeight: 1.4 }}>{p.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <div className="detail-panel">
          <div style={{ position: 'relative' }}>
            {selected.image
              ? <img src={selected.image} alt="" style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }} /> // eslint-disable-line
              : <div style={{ width: '100%', height: 160, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="shoppingBag" size={48} color="var(--border-dark)" /></div>
            }
            <button className="btn btn-ghost" style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.9)' }} onClick={() => setSelected(null)}>
              <Icon name="x" size={14} />
            </button>
          </div>
          <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 400, lineHeight: 1.2 }}>{selected.name}</h2>
              <span className={`badge ${statusColor(selected.status)}`}>{selected.status}</span>
            </div>
            {selected.store && <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 6 }}>{selected.store}</p>}
            <p style={{ fontSize: 28, fontFamily: 'var(--font-serif)', fontWeight: 300, marginBottom: 16 }}>{fmt(selected.price)}</p>
            {selected.notes && <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20, lineHeight: 1.6 }}>{selected.notes}</p>}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 6 }}>Update status</label>
              <select className="input" value={selected.status} onChange={e => handleStatusChange(selected.id, e.target.value as Status)}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            {selected.url && selected.url !== '#' && (
              <a href={selected.url} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ display: 'flex', marginBottom: 10, textDecoration: 'none' }}>
                <Icon name="link" size={14} /> View product page
              </a>
            )}
            <button className="btn btn-ghost" style={{ color: 'var(--red)', borderColor: 'var(--red)', width: '100%', justifyContent: 'center' }}
              onClick={async () => { await onDelete(selected.id); setSelected(null); }}>
              <Icon name="trash" size={14} /> Remove
            </button>
          </div>
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <Modal title="Add Product" onClose={() => setShowAdd(false)}>
          {/* Mode switcher */}
          <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
            <button className={`tab-btn ${addMode === 'link' ? 'active' : ''}`} onClick={() => setAddMode('link')}>🔗 Paste a link</button>
            <button className={`tab-btn ${addMode === 'manual' ? 'active' : ''}`} onClick={() => setAddMode('manual')}>✏️ Manual entry</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Link input — shown in both modes */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>
                {addMode === 'link' ? 'Product URL *' : 'Product URL (optional)'}
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input" placeholder="https://…" value={form.url}
                  onChange={e => { setForm(f => ({ ...f, url: e.target.value })); setFetchStatus('idle'); setFetchedImages([]); }} />
                <button className="btn btn-primary" disabled={fetching || !form.url} onClick={fetchFromLink} style={{ flexShrink: 0, minWidth: 90 }}>
                  {fetching ? '…' : '✨ Fetch'}
                </button>
              </div>
              {fetchStatus === 'done' && <p style={{ fontSize: 11, color: 'var(--green)', marginTop: 5 }}>✓ Details fetched — pick an image below</p>}
              {fetchStatus === 'failed' && <p style={{ fontSize: 11, color: 'var(--red)', marginTop: 5 }}>Could not fetch from this URL — fill in manually</p>}
              {fetchStatus === 'idle' && addMode === 'link' && <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 5 }}>Paste any product URL and click Fetch. Works on most furniture & decor stores.</p>}
            </div>

            {/* Image picker — shown after fetch if images found */}
            {fetchedImages.length > 0 && (
              <ImagePicker
                images={fetchedImages}
                selected={form.image}
                onSelect={url => setForm(f => ({ ...f, image: url }))}
              />
            )}

            {/* Product image */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Image</label>
              {form.image ? (
                <div style={{ position: 'relative', marginBottom: 4 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.image} alt="" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8 }} />
                  <button className="btn btn-ghost" style={{ position: 'absolute', top: 8, right: 8, padding: '3px 7px', background: 'rgba(255,255,255,0.9)' }} onClick={() => setForm(f => ({ ...f, image: '' }))}>
                    <Icon name="x" size={12} />
                  </button>
                </div>
              ) : (
                <ImageUpload folder="products" onUpload={url => setForm(f => ({ ...f, image: url }))} label="Upload product image" />
              )}
              <input className="input" placeholder="…or paste image URL" value={form.image}
                onChange={e => setForm(f => ({ ...f, image: e.target.value }))} style={{ marginTop: 8 }} />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Product Name *</label>
              <input className="input" placeholder="e.g. Walnut Nightstand" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Store</label>
                <input className="input" placeholder="e.g. West Elm" value={form.store}
                  onChange={e => setForm(f => ({ ...f, store: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Price ($)</label>
                <input className="input" type="number" placeholder="0.00" value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Status</label>
              <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Status }))}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            {allRooms && !roomId && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Room</label>
                <select className="input" value={formRoom} onChange={e => setFormRoom(Number(e.target.value))}>
                  {allRooms.map(r => <option key={r.id} value={r.id}>{r.emoji} {r.name}</option>)}
                </select>
              </div>
            )}

            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Notes</label>
              <textarea className="input" placeholder="Any notes…" value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={!form.name || saving} onClick={handleAdd}>
                {saving ? 'Saving…' : 'Add Product'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
