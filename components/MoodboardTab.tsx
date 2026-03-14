'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import Icon from '@/components/Icon';
import Modal from '@/components/Modal';
import type { MoodboardItem } from '@/lib/types';
import { upsertMoodboardItems } from '@/lib/db';
import { uploadImage } from '@/lib/storage';

export default function MoodboardTab({ roomId, initialItems }: {
  roomId: number;
  initialItems: MoodboardItem[];
}) {
  const [items, setItems]         = useState<MoodboardItem[]>(initialItems);
  const [selected, setSelected]   = useState<string | null>(null);
  const [dragging, setDragging]   = useState<string | null>(null);
  const [offset, setOffset]       = useState({ x: 0, y: 0 });
  const [showImage, setShowImage] = useState(false);
  const [showText, setShowText]   = useState(false);
  const [showLink, setShowLink]   = useState(false);
  const [newText, setNewText]     = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newLink, setNewLink]     = useState({ href: '', title: '' });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [dirty, setDirty]         = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileRef   = useRef<HTMLInputElement>(null);
  const itemsRef  = useRef<MoodboardItem[]>(items);

  // Keep ref in sync for unmount save
  useEffect(() => { itemsRef.current = items; }, [items]);

  const save = useCallback(async (itemsToSave: MoodboardItem[]) => {
    setSaving(true);
    try { await upsertMoodboardItems(roomId, itemsToSave); setDirty(false); }
    catch { /* silent */ }
    finally { setSaving(false); }
  }, [roomId]);

  // Debounced save on change
  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(() => save(items), 1500);
    return () => clearTimeout(t);
  }, [items, dirty, save]);

  // IMMEDIATE save on unmount — fixes the "navigate away loses data" bug
  useEffect(() => {
    return () => {
      if (itemsRef.current.length > 0) {
        upsertMoodboardItems(roomId, itemsRef.current).catch(() => {});
      }
    };
  }, [roomId]);

  const markDirty = (newItems: MoodboardItem[]) => {
    setItems(newItems);
    setDirty(true);
  };

  // Clipboard paste → image on canvas
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const file = Array.from(e.clipboardData?.items ?? [])
        .find(i => i.type.startsWith('image/'))?.getAsFile();
      if (!file) return;
      e.preventDefault();
      setUploading(true);
      try {
        const url = await uploadImage(file, 'inspiration');
        addImageFromUrl(url);
      } catch { /* silent */ }
      finally { setUploading(false); }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  // ─── Drag logic ────────────────────────────────────────────────────────────
  const startDrag = (e: React.MouseEvent | React.TouchEvent, id: string) => {
    e.stopPropagation();
    const el = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragging(id);
    setSelected(id);
    setOffset({ x: clientX - el.left, y: clientY - el.top });
  };

  const onMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dragging || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
    const x = Math.max(0, clientX - rect.left - offset.x);
    const y = Math.max(0, clientY - rect.top - offset.y);
    setItems(prev => prev.map(it => it.id === dragging ? { ...it, x, y } : it));
    setDirty(true);
  }, [dragging, offset]);

  const endDrag = useCallback(() => setDragging(null), []);

  useEffect(() => {
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', endDrag);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', endDrag);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', endDrag);
    };
  }, [onMove, endDrag]);

  // ─── Add items ──────────────────────────────────────────────────────────────
  const addImageFromUrl = (src: string) => {
    // Load image to get natural dimensions and preserve aspect ratio
    const img = new Image();
    img.onload = () => {
      const maxW = 280;
      const ratio = img.naturalHeight / img.naturalWidth;
      const w = Math.min(maxW, img.naturalWidth);
      const h = Math.round(w * ratio);
      markDirty([...itemsRef.current, {
        id: `img_${Date.now()}`, type: 'image',
        x: 60, y: 60, w, h,
        room_id: roomId, src, label: '',
      }]);
    };
    img.onerror = () => {
      // Fallback if image can't be measured
      markDirty([...itemsRef.current, {
        id: `img_${Date.now()}`, type: 'image',
        x: 60, y: 60, w: 260, h: 200,
        room_id: roomId, src, label: '',
      }]);
    };
    img.src = src;
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadImage(file, 'inspiration');
      addImageFromUrl(url);
    } catch { /* silent */ }
    finally { setUploading(false); setShowImage(false); }
  };

  const addImageFromModal = () => {
    if (!newImageUrl.trim()) return;
    addImageFromUrl(newImageUrl.trim());
    setNewImageUrl('');
    setShowImage(false);
  };

  const addText = () => {
    if (!newText.trim()) return;
    markDirty([...items, {
      id: `text_${Date.now()}`, type: 'text',
      x: 60, y: 60, w: 220, h: 80, room_id: roomId, text: newText,
    }]);
    setNewText(''); setShowText(false);
  };

  const addLink = () => {
    if (!newLink.href.trim()) return;
    markDirty([...items, {
      id: `link_${Date.now()}`, type: 'link',
      x: 60, y: 60, w: 220, h: 60, room_id: roomId,
      href: newLink.href.trim(),
      title: newLink.title.trim() || newLink.href.trim(),
    }]);
    setNewLink({ href: '', title: '' }); setShowLink(false);
  };

  const addColour = () => {
    markDirty([...items, {
      id: `col_${Date.now()}`, type: 'color',
      x: 120, y: 120, w: 110, h: 110, room_id: roomId, color: '#C17B4E', label: 'Colour',
    }]);
  };

  const updateColour = (id: string, color: string) => {
    markDirty(items.map(it => it.id === id ? { ...it, color } : it));
  };

  const deleteSelected = () => {
    if (!selected) return;
    markDirty(items.filter(it => it.id !== selected));
    setSelected(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn-ghost" onClick={() => setShowImage(true)}>
          <Icon name="image" size={14} /> Add Image
        </button>
        <button className="btn btn-ghost" onClick={() => setShowText(true)}>
          <Icon name="fileText" size={14} /> Add Text
        </button>
        <button className="btn btn-ghost" onClick={() => setShowLink(true)}>
          <Icon name="link" size={14} /> Add Link
        </button>
        <button className="btn btn-ghost" onClick={addColour}>
          <Icon name="palette" size={14} /> Add Colour
        </button>
        {selected && (
          <button className="btn btn-ghost" style={{ color: 'var(--red)', borderColor: 'var(--red)' }} onClick={deleteSelected}>
            <Icon name="trash" size={14} /> Delete
          </button>
        )}
        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-3)' }}>
          {uploading ? '⬆️ Uploading…' : saving ? '💾 Saving…' : dirty ? '●  Unsaved' : '✓ Saved'}
        </div>
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12 }}>
        💡 Paste an image with <kbd style={{ background: 'var(--bg)', padding: '1px 5px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 11 }}>⌘V</kbd>
      </p>

      <div
        className="moodboard-canvas"
        ref={canvasRef}
        onClick={() => setSelected(null)}
      >
        {items.map(item => (
          <div
            key={item.id}
            className={`canvas-item${selected === item.id ? ' selected' : ''}`}
            style={{ left: item.x, top: item.y, width: item.w, height: item.h }}
            onMouseDown={(e) => startDrag(e, item.id)}
            onTouchStart={(e) => startDrag(e, item.id)}
            onClick={(e) => { e.stopPropagation(); setSelected(item.id); }}
          >
            {item.type === 'image' && (
              <div style={{ width: '100%', height: '100%', overflow: 'hidden', borderRadius: 8, position: 'relative' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', userSelect: 'none', display: 'block' }} />
                {item.label && (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.45)', color: 'white', fontSize: 11, padding: '4px 8px' }}>
                    {item.label}
                  </div>
                )}
              </div>
            )}
            {item.type === 'color' && (
              <div style={{ width: '100%', height: '100%', background: item.color, borderRadius: 8, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '8px 10px', gap: 8 }}>
                <span style={{ fontSize: 11, color: 'white', fontWeight: 500, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{item.label}</span>
                {selected === item.id && (
                  <input type="color" value={item.color ?? '#C17B4E'}
                    onChange={e => { e.stopPropagation(); updateColour(item.id, e.target.value); }}
                    onClick={e => e.stopPropagation()}
                    style={{ width: 24, height: 24, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer', background: 'none' }}
                  />
                )}
              </div>
            )}
            {item.type === 'text' && (
              <div style={{ width: '100%', height: '100%', background: 'var(--surface)', borderRadius: 8, padding: '12px 14px', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, overflow: 'hidden' }}>
                {item.text}
              </div>
            )}
            {item.type === 'link' && (
              <div style={{ width: '100%', height: '100%', background: 'var(--accent-light)', borderRadius: 8, padding: '10px 14px', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                <Icon name="link" size={14} color="var(--accent)" />
                <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {item.title || item.href}
                </span>
                {selected === item.id && (
                  <a href={item.href} target="_blank" rel="noreferrer"
                    style={{ fontSize: 11, color: 'var(--accent-dark)', textDecoration: 'none', flexShrink: 0 }}
                    onClick={e => e.stopPropagation()}>
                    Open ↗
                  </a>
                )}
              </div>
            )}
          </div>
        ))}

        {items.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
            <Icon name="layers" size={40} color="var(--border-dark)" />
            <p style={{ marginTop: 12, fontSize: 14 }}>Your moodboard canvas is empty</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>Add images, text, links and colour swatches above · or paste ⌘V</p>
          </div>
        )}
      </div>

      {/* Add Image modal */}
      {showImage && (
        <Modal title="Add Image" onClose={() => setShowImage(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{ border: '2px dashed var(--border-dark)', borderRadius: 10, padding: 28, textAlign: 'center', cursor: 'pointer', color: 'var(--text-3)', transition: 'var(--transition)' }}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) handleFileUpload(f); }}
            >
              <Icon name="upload" size={24} />
              <p style={{ marginTop: 10, fontSize: 13 }}>{uploading ? 'Uploading…' : 'Click or drag & drop · or paste ⌘V'}</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>or paste a URL</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="input" placeholder="https://…" value={newImageUrl}
                onChange={e => setNewImageUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addImageFromModal()} />
              <button className="btn btn-primary" disabled={!newImageUrl} onClick={addImageFromModal}>Add</button>
            </div>
            {newImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={newImageUrl} alt="preview" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 8 }} />
            )}
          </div>
        </Modal>
      )}

      {/* Add Text modal */}
      {showText && (
        <Modal title="Add Text Block" onClose={() => setShowText(false)}>
          <textarea className="input" rows={3} placeholder="Write a design note or annotation…"
            value={newText} onChange={e => setNewText(e.target.value)} style={{ marginBottom: 16 }} />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setShowText(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={addText}>Add</button>
          </div>
        </Modal>
      )}

      {/* Add Link modal */}
      {showLink && (
        <Modal title="Add Link" onClose={() => setShowLink(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>URL *</label>
              <input className="input" placeholder="https://…" value={newLink.href}
                onChange={e => setNewLink(f => ({ ...f, href: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Label (optional)</label>
              <input className="input" placeholder="e.g. IKEA Sofa" value={newLink.title}
                onChange={e => setNewLink(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowLink(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={!newLink.href} onClick={addLink}>Add Link</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
