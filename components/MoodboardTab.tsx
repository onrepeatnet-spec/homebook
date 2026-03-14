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
  const [showText, setShowText]   = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [newText, setNewText]     = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileRef   = useRef<HTMLInputElement>(null);

  // Auto-save after 2s of inactivity
  useEffect(() => {
    const t = setTimeout(async () => {
      setSaving(true);
      try { await upsertMoodboardItems(roomId, items); }
      catch { /* silent */ }
      finally { setSaving(false); }
    }, 2000);
    return () => clearTimeout(t);
  }, [items, roomId]);

  // Paste image from clipboard directly onto canvas
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      // Don't intercept paste when user is typing in a text field
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const file = Array.from(e.clipboardData?.items ?? [])
        .find(i => i.type.startsWith('image/'))?.getAsFile();
      if (!file) return;
      e.preventDefault();
      setUploading(true);
      try {
        const url = await uploadImage(file, 'inspiration');
        addImageItem(url);
      } catch { /* silent */ }
      finally { setUploading(false); }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  const addImageItem = (src: string) => {
    setItems(prev => [...prev, {
      id: `img_${Date.now()}`, type: 'image',
      x: 60, y: 60, w: 260, h: 200,
      room_id: roomId, src, label: '',
    }]);
  };

  // Drag logic
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

  const addText = () => {
    if (!newText.trim()) return;
    setItems(prev => [...prev, {
      id: `text_${Date.now()}`, type: 'text',
      x: 60, y: 60, w: 220, h: 80, room_id: roomId, text: newText,
    }]);
    setNewText(''); setShowText(false);
  };

  const addColour = () => {
    setItems(prev => [...prev, {
      id: `col_${Date.now()}`, type: 'color',
      x: 120, y: 120, w: 110, h: 110, room_id: roomId, color: '#C17B4E', label: 'Colour',
    }]);
  };

  const addImageFromUrl = () => {
    if (!newImageUrl.trim()) return;
    addImageItem(newImageUrl.trim());
    setNewImageUrl(''); setShowImage(false);
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadImage(file, 'inspiration');
      addImageItem(url);
    } catch { /* silent */ }
    finally { setUploading(false); setShowImage(false); }
  };

  const updateColour = (id: string, color: string) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, color } : it));
  };

  const deleteSelected = () => {
    if (!selected) return;
    setItems(prev => prev.filter(it => it.id !== selected));
    setSelected(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn-ghost" onClick={() => setShowImage(true)}>
          <Icon name="image" size={14} /> Add Image
        </button>
        <button className="btn btn-ghost" onClick={() => setShowText(true)}>
          <Icon name="fileText" size={14} /> Add Text
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
          {uploading ? '⬆️ Uploading…' : saving ? '💾 Saving…' : '✓ Saved'}
        </div>
      </div>

      {/* Paste hint */}
      <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12 }}>
        💡 You can paste an image directly with <kbd style={{ background: 'var(--bg)', padding: '1px 5px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 11 }}>⌘V</kbd> to add it to the canvas
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
          </div>
        ))}

        {items.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
            <Icon name="layers" size={40} color="var(--border-dark)" />
            <p style={{ marginTop: 12, fontSize: 14 }}>Your moodboard canvas is empty</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>Add images, text blocks and colour swatches above · or paste an image with ⌘V</p>
          </div>
        )}
      </div>

      {/* Add Image modal */}
      {showImage && (
        <Modal title="Add Image to Moodboard" onClose={() => setShowImage(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Upload */}
            <div
              style={{ border: '2px dashed var(--border-dark)', borderRadius: 10, padding: 28, textAlign: 'center', cursor: 'pointer', color: 'var(--text-3)', transition: 'var(--transition)' }}
              onClick={() => fileRef.current?.click()}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-dark)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; }}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) handleFileUpload(f); }}
            >
              <Icon name="upload" size={24} />
              <p style={{ marginTop: 10, fontSize: 13 }}>{uploading ? 'Uploading…' : 'Click to upload or drag & drop'}</p>
              <p style={{ fontSize: 11, marginTop: 4 }}>Or paste with ⌘V anywhere</p>
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
                onKeyDown={e => e.key === 'Enter' && addImageFromUrl()} />
              <button className="btn btn-primary" disabled={!newImageUrl} onClick={addImageFromUrl}>Add</button>
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
    </div>
  );
}
