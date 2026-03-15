'use client';
import { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/Icon';
import Modal from '@/components/Modal';
import ImageUpload from '@/components/ImageUpload';
import ImagePicker from '@/components/ImagePicker';
import ContextMenu from '@/components/ContextMenu';
import { fetchMetadata } from '@/lib/metadata';
import type { Inspiration } from '@/lib/types';

export default function InspirationTab({ items, roomId, allRooms, onAdd, onUpdate, onDelete }: {
  items: Inspiration[];
  roomId: number | null;
  allRooms?: { id: number; name: string; emoji: string }[];
  onAdd: (item: Omit<Inspiration, 'id' | 'created_at'>) => Promise<void>;
  onUpdate?: (id: number, updates: Partial<Inspiration>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [selected, setSelected] = useState<Inspiration | null>(null);
  const [showAdd, setShowAdd]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchStatus, setFetchStatus] = useState<'idle' | 'loading' | 'done' | 'failed'>('idle');
  const [fetchedImages, setFetchedImages] = useState<string[]>([]);
  const [addTab, setAddTab]     = useState<'upload' | 'url' | 'link'>('upload');
  const [ctxMenu, setCtxMenu]   = useState<{ x: number; y: number; item: Inspiration } | null>(null);
  const [form, setForm]         = useState({
    image_url: '', source_url: '', source_name: '',
    tags: '', notes: '', room_id: roomId ?? 0,
  });

  const filtered = roomId ? items.filter(i => i.room_id === roomId) : items;

  // Paste image anywhere on the page
  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    if (!showAdd) return;
    // Image file pasted
    const file = Array.from(e.clipboardData?.items ?? []).find(i => i.type.startsWith('image/'))?.getAsFile();
    if (file) {
      const { uploadImage } = await import('@/lib/storage');
      const url = await uploadImage(file, 'inspiration');
      setForm(f => ({ ...f, image_url: url }));
      return;
    }
    // Text (URL) pasted
    const text = e.clipboardData?.getData('text') ?? '';
    if (text.startsWith('http')) {
      setForm(f => ({ ...f, image_url: text }));
    }
  }, [showAdd]);

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const fetchLink = async () => {
    if (!form.source_url) return;
    setFetching(true);
    setFetchStatus('loading');
    setFetchedImages([]);
    const meta = await fetchMetadata(form.source_url);
    const gotSomething = meta.image || meta.title || meta.publisher || (meta.images && meta.images.length > 0);
    const allImages = meta.images ?? (meta.image ? [meta.image] : []);
    setFetchedImages(allImages);
    setForm(f => ({
      ...f,
      image_url:   allImages[0] || f.image_url,
      source_name: meta.title   || meta.publisher || f.source_name,
      notes:       meta.description ? f.notes || meta.description : f.notes,
    }));
    setFetchStatus(gotSomething ? 'done' : 'failed');
    setFetching(false);
  };

  const handleAdd = async () => {
    if (!form.image_url) return;
    setSaving(true);
    try {
      await onAdd({
        image_url:   form.image_url,
        source_url:  form.source_url,
        source_name: form.source_name,
        room_id:     form.room_id || roomId || (allRooms?.[0]?.id ?? 1),
        tags:        form.tags.split(',').map(t => t.trim()).filter(Boolean),
        notes:       form.notes,
      });
      setForm({ image_url: '', source_url: '', source_name: '', tags: '', notes: '', room_id: roomId ?? 0 });
      setShowAdd(false);
    } finally { setSaving(false); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: 'var(--text-3)' }}>{filtered.length} image{filtered.length !== 1 ? 's' : ''}</p>
        <button className="btn btn-primary" onClick={() => { setSelected(null); setShowAdd(true); }}>
          <Icon name="plus" size={14} /> Add Inspiration
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="upload-zone" onClick={() => { setSelected(null); setShowAdd(true); }}>
          <Icon name="image" size={32} />
          <p style={{ marginTop: 12, fontSize: 14 }}>Add your first inspiration image</p>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>Upload, paste, or link</p>
        </div>
      ) : (
        <div className="masonry-grid">
          {filtered.map((item, idx) => (
            <div key={item.id} className="masonry-item animate-in" style={{ animationDelay: `${idx * 0.03}s` }}>
              <div className="card" style={{ cursor: 'pointer', overflow: 'hidden' }}
                onClick={() => setSelected(item)}
                onContextMenu={(e) => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, item }); }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image_url} alt="" style={{ width: '100%', display: 'block', transition: 'transform 0.3s' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
                <div style={{ padding: '10px 12px' }}>
                  {item.source_name && (
                    <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5 }}>
                      {item.source_url ? <a href={item.source_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ color: 'var(--accent)', textDecoration: 'none' }}>🔗 {item.source_name}</a> : item.source_name}
                    </p>
                  )}
                  {item.tags?.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: item.notes ? 5 : 0 }}>
                      {item.tags.map(t => (
                        <span key={t} style={{ fontSize: 10, background: 'var(--accent-light)', color: 'var(--accent)', padding: '2px 7px', borderRadius: 10 }}>{t}</span>
                      ))}
                    </div>
                  )}
                  {item.notes && <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>{item.notes}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail panel — fullscreen on mobile, side panel on desktop */}
      {selected && (
        <>
          {/* Mobile: fullscreen overlay */}
          <div className="inspiration-mobile-overlay" onClick={() => setSelected(null)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selected.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
            <div className="inspiration-mobile-info" onClick={e => e.stopPropagation()}>
              {selected.source_name && (
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
                  {selected.source_url
                    ? <a href={selected.source_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-light)', textDecoration: 'none' }}>🔗 {selected.source_name}</a>
                    : selected.source_name}
                </p>
              )}
              {selected.tags?.length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                  {selected.tags.map(t => (
                    <span key={t} style={{ fontSize: 11, background: 'rgba(255,255,255,0.15)', color: 'white', padding: '2px 8px', borderRadius: 10 }}>#{t}</span>
                  ))}
                </div>
              )}
              {selected.notes && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 1.5, marginBottom: 10 }}>{selected.notes}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <a href={selected.image_url} target="_blank" rel="noreferrer"
                  style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.15)', borderRadius: 8, textAlign: 'center', color: 'white', fontSize: 13, textDecoration: 'none', backdropFilter: 'blur(8px)' }}>
                  Open image ↗
                </a>
                <button style={{ padding: '10px 16px', background: 'rgba(220,50,50,0.8)', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, cursor: 'pointer', backdropFilter: 'blur(8px)' }}
                  onClick={async () => { await onDelete(selected.id); setSelected(null); }}>
                  Remove
                </button>
              </div>
            </div>
            <button style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
              onClick={() => setSelected(null)}>
              <Icon name="x" size={16} color="white" />
            </button>
          </div>

          {/* Desktop: side panel */}
          <div className="detail-panel inspiration-desktop-panel">
            <div style={{ position: 'relative' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selected.image_url} alt="" style={{ width: '100%', maxHeight: 300, objectFit: 'cover', display: 'block' }} />
              <button className="btn btn-ghost" style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.9)' }} onClick={() => setSelected(null)}>
                <Icon name="x" size={14} />
              </button>
            </div>
            <div style={{ padding: 24 }}>
              {selected.source_name && (
                <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10 }}>
                  {selected.source_url
                    ? <a href={selected.source_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>🔗 {selected.source_name}</a>
                    : selected.source_name}
                </p>
              )}
              {selected.tags?.length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                  {selected.tags.map(t => (
                    <span key={t} style={{ fontSize: 11, background: 'var(--accent-light)', color: 'var(--accent)', padding: '3px 8px', borderRadius: 10 }}>#{t}</span>
                  ))}
                </div>
              )}
              {selected.notes && <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 16 }}>{selected.notes}</p>}
              {allRooms && allRooms.length > 1 && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 6 }}>Move to room</label>
                  <select className="input" value={selected.room_id}
                    onChange={async e => {
                      const room_id = Number(e.target.value);
                      if (onUpdate) {
                        await onUpdate(selected.id, { room_id });
                        setSelected(s => s ? { ...s, room_id } : null);
                      }
                    }}>
                    {allRooms.map(r => <option key={r.id} value={r.id}>{r.emoji} {r.name}</option>)}
                  </select>
                </div>
              )}
              <a href={selected.image_url} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ display: 'flex', marginBottom: 10, textDecoration: 'none' }}>
                <Icon name="eye" size={14} /> View full image
              </a>
              <button className="btn btn-ghost" style={{ color: 'var(--red)', borderColor: 'var(--red)', width: '100%', justifyContent: 'center' }}
                onClick={async () => { await onDelete(selected.id); setSelected(null); }}>
                <Icon name="trash" size={14} /> Remove
              </button>
            </div>
          </div>
        </>
      )}

      {/* Add modal */}
      {showAdd && (
        <Modal title="Add Inspiration" onClose={() => setShowAdd(false)}>
          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
            {([['upload','📁 Upload'], ['url','🖼 Image URL'], ['link','🔗 From Link']] as const).map(([t, label]) => (
              <button key={t} className={`tab-btn ${addTab === t ? 'active' : ''}`} onClick={() => setAddTab(t)}>{label}</button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {addTab === 'upload' && (
              <>
                <p style={{ fontSize: 12, color: 'var(--text-3)' }}>You can also paste an image directly with <kbd style={{ background: 'var(--bg)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 11 }}>⌘V</kbd></p>
                <ImageUpload folder="inspiration" onUpload={url => setForm(f => ({ ...f, image_url: url }))} />
              </>
            )}
            {addTab === 'url' && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Image URL</label>
                <input className="input" placeholder="https://..." value={form.image_url}
                  onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} />
              </div>
            )}
            {addTab === 'link' && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Page URL</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="input" placeholder="https://..." value={form.source_url}
                    onChange={e => { setForm(f => ({ ...f, source_url: e.target.value })); setFetchStatus('idle'); setFetchedImages([]); }} />
                  <button className="btn btn-primary" disabled={fetching || !form.source_url} onClick={fetchLink} style={{ flexShrink: 0, minWidth: 80 }}>
                    {fetching ? '…' : '✨ Fetch'}
                  </button>
                </div>
                {fetchStatus === 'done' && <p style={{ fontSize: 11, color: 'var(--green)', marginTop: 5 }}>✓ Info fetched — pick an image below</p>}
                {fetchStatus === 'failed' && <p style={{ fontSize: 11, color: 'var(--red)', marginTop: 5 }}>Could not fetch from this URL — fill in manually below</p>}
                {fetchStatus === 'idle' && <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 5 }}>Paste a URL and click Fetch to auto-fill details</p>}
              </div>
            )}

            {/* Image picker — shown after fetch */}
            {fetchedImages.length > 0 && (
              <ImagePicker
                images={fetchedImages}
                selected={form.image_url}
                onSelect={url => setForm(f => ({ ...f, image_url: url }))}
              />
            )}

            {form.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.image_url} alt="preview" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 8 }} />
            )}

            {allRooms && !roomId && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Room</label>
                <select className="input" value={form.room_id} onChange={e => setForm(f => ({ ...f, room_id: Number(e.target.value) }))}>
                  {allRooms.map(r => <option key={r.id} value={r.id}>{r.emoji} {r.name}</option>)}
                </select>
              </div>
            )}

            {(addTab === 'link' || form.source_url) && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Source name</label>
                <input className="input" placeholder="e.g. IKEA, Pinterest…" value={form.source_name}
                  onChange={e => setForm(f => ({ ...f, source_name: e.target.value }))} />
              </div>
            )}

            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Tags <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(comma separated)</span></label>
              <input className="input" placeholder="minimal, neutral, sofa" value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Notes</label>
              <textarea className="input" placeholder="What do you love about this?" value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={!form.image_url || saving} onClick={handleAdd}>
                {saving ? 'Saving…' : 'Add Image'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x} y={ctxMenu.y}
          onClose={() => setCtxMenu(null)}
          items={[
            { label: 'View details', icon: '👁', onClick: () => setSelected(ctxMenu.item) },
            { label: 'Open image', icon: '🔗', onClick: () => window.open(ctxMenu.item.image_url, '_blank') },
            { label: 'Remove', icon: '🗑', danger: true, onClick: () => onDelete(ctxMenu.item.id) },
          ]}
        />
      )}
    </div>
  );
}
