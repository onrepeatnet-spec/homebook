'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import Icon from '@/components/Icon';
import Modal from '@/components/Modal';
import type { MoodboardItem } from '@/lib/types';
import { upsertMoodboardItems } from '@/lib/db';

export default function MoodboardTab({ roomId, initialItems }: {
  roomId: number;
  initialItems: MoodboardItem[];
}) {
  const [items, setItems]       = useState<MoodboardItem[]>(initialItems);
  const [selected, setSelected] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [offset, setOffset]     = useState({ x: 0, y: 0 });
  const [showText, setShowText] = useState(false);
  const [newText, setNewText]   = useState('');
  const [saving, setSaving]     = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

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
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
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
    setItems(prev => [...prev, { id: `text_${Date.now()}`, type: 'text', x: 60, y: 60, w: 220, h: 80, room_id: roomId, text: newText }]);
    setNewText(''); setShowText(false);
  };

  const addColour = () => {
    setItems(prev => [...prev, { id: `col_${Date.now()}`, type: 'color', x: 120, y: 120, w: 110, h: 110, room_id: roomId, color: '#C17B4E', label: 'Colour' }]);
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
          {saving ? '💾 Saving…' : '✓ Saved'}
        </div>
      </div>

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
              <div style={{ width: '100%', height: '100%', overflow: 'hidden', borderRadius: 8 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', userSelect: 'none' }} />
                {item.label && (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.45)', color: 'white', fontSize: 11, padding: '4px 8px', borderRadius: '0 0 8px 8px' }}>
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
            <p style={{ fontSize: 12, marginTop: 4 }}>Add text blocks and colour swatches above</p>
          </div>
        )}
      </div>

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
