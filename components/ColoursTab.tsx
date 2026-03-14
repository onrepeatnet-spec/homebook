'use client';
import { useState } from 'react';
import Icon from '@/components/Icon';
import Modal from '@/components/Modal';
import type { ColourPalette } from '@/lib/types';

export default function ColoursTab({ palettes, roomId, onAdd, onDelete }: {
  palettes: ColourPalette[];
  roomId: number | null;
  onAdd: (p: Omit<ColourPalette, 'id' | 'created_at'>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({
    name: '', notes: '',
    colours: ['#C17B4E', '#D4A878', '#F5E6D3', '#4A7C6F', '#1C1814'],
  });

  const filtered = roomId ? palettes.filter(p => p.room_id === roomId) : palettes;

  const updateColor = (i: number, val: string) => {
    const c = [...form.colours]; c[i] = val; setForm(f => ({ ...f, colours: c }));
  };
  const addSwatch   = () => setForm(f => ({ ...f, colours: [...f.colours, '#CCCCCC'] }));
  const removeSwatch = (i: number) => setForm(f => ({ ...f, colours: f.colours.filter((_, idx) => idx !== i) }));

  const handleAdd = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      await onAdd({ name: form.name, notes: form.notes, colours: form.colours, room_id: roomId ?? 1 });
      setForm({ name: '', notes: '', colours: ['#C17B4E', '#D4A878', '#F5E6D3', '#4A7C6F', '#1C1814'] });
      setShowAdd(false);
    } finally {
      setSaving(false);
    }
  };

  // Determine if a colour is dark (for text contrast)
  const isDark = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Icon name="plus" size={14} /> New Palette
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ padding: '48px 32px', textAlign: 'center' }}>
          <Icon name="palette" size={40} color="var(--border-dark)" />
          <p style={{ marginTop: 14, color: 'var(--text-3)', fontSize: 14 }}>No colour palettes yet</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowAdd(true)}>
            Create your first palette
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {filtered.map((pal, idx) => (
            <div key={pal.id} className="card animate-in" style={{ padding: 20, animationDelay: `${idx * 0.06}s` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 400 }}>{pal.name}</h3>
                <button className="btn btn-ghost" style={{ padding: '3px 7px', color: 'var(--text-3)' }}
                  onClick={() => onDelete(pal.id)}>
                  <Icon name="trash" size={13} />
                </button>
              </div>

              {/* Gradient stripe */}
              <div style={{ display: 'flex', height: 56, borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
                {pal.colours.map((c, i) => <div key={i} style={{ flex: 1, background: c }} />)}
              </div>

              {/* Individual swatches */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                {pal.colours.map((c, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 8,
                      background: c,
                      border: '2px solid rgba(255,255,255,0.5)',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                    }} />
                    <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--text-3)', letterSpacing: '0.04em' }}>{c.toUpperCase()}</span>
                  </div>
                ))}
              </div>

              {pal.notes && (
                <p style={{ fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  {pal.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <Modal title="Create Colour Palette" onClose={() => setShowAdd(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Palette Name *</label>
              <input className="input" placeholder="e.g. Warm Neutrals" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 10 }}>Colours</label>
              {/* Preview stripe */}
              <div style={{ display: 'flex', height: 36, borderRadius: 8, overflow: 'hidden', marginBottom: 14 }}>
                {form.colours.map((c, i) => <div key={i} style={{ flex: 1, background: c }} />)}
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                {form.colours.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input type="color" value={c} onChange={e => updateColor(i, e.target.value)}
                      style={{ width: 40, height: 40, padding: 3, border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', background: 'none' }} />
                    <button onClick={() => removeSwatch(i)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 2px' }}>×</button>
                  </div>
                ))}
                <button className="btn btn-ghost" style={{ padding: '6px 12px' }} onClick={addSwatch}>
                  <Icon name="plus" size={13} /> Add
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Notes</label>
              <textarea className="input" placeholder="Where will this palette be used?" value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={!form.name || saving} onClick={handleAdd}>
                {saving ? 'Saving…' : 'Save Palette'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
