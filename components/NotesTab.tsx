'use client';
import { useState, useEffect } from 'react';
import Icon from '@/components/Icon';
import { supabase } from '@/lib/supabase';

export default function NotesTab({ roomId }: { roomId: number }) {
  const [content, setContent] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [loaded, setLoaded]   = useState(false);

  // Load note from Supabase
  useEffect(() => {
    supabase.from('notes').select('content').eq('room_id', roomId).single()
      .then(({ data }) => {
        if (data) setContent(data.content);
        else setContent(`## Notes\n\nStart writing your design notes for this room…\n\n- Add furniture ideas\n- Colour thoughts\n- Measurements to take`);
        setLoaded(true);
      });
  }, [roomId]);

  // Debounced auto-save
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(async () => {
      setSaving(true);
      await supabase.from('notes').upsert({ room_id: roomId, content }, { onConflict: 'room_id' });
      setSaving(false);
    }, 1500);
    return () => clearTimeout(t);
  }, [content, roomId, loaded]);

  const renderPreview = (text: string) =>
    text.split('\n').map((line, i) => {
      if (line.startsWith('## '))  return <h2 key={i} style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 400, marginBottom: 10, marginTop: i > 0 ? 24 : 0 }}>{line.slice(3)}</h2>;
      if (line.startsWith('### ')) return <h3 key={i} style={{ fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 400, marginBottom: 8, marginTop: 16, color: 'var(--text-2)' }}>{line.slice(4)}</h3>;
      if (line.startsWith('- '))  return (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6, fontSize: 13, paddingLeft: 4 }}>
          <span style={{ color: 'var(--accent)', marginTop: 2, flexShrink: 0 }}>◆</span>
          <span>{line.slice(2)}</span>
        </div>
      );
      if (line.trim() === '') return <div key={i} style={{ height: 8 }} />;
      return <p key={i} style={{ fontSize: 13, lineHeight: 1.7, marginBottom: 4 }}>{line}</p>;
    });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{saving ? '💾 Saving…' : loaded ? '✓ Saved' : ''}</span>
        <button className="btn btn-ghost" onClick={() => setEditing(e => !e)}>
          <Icon name={editing ? 'eye' : 'edit'} size={14} />
          {editing ? 'Preview' : 'Edit'}
        </button>
      </div>

      <div className="card" style={{ padding: 28, minHeight: 400 }}>
        {editing ? (
          <textarea
            className="input"
            style={{ minHeight: 360, fontSize: 13, fontFamily: 'monospace', lineHeight: 1.7, border: 'none', boxShadow: 'none', padding: 0 }}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write your design notes here… Use ## for headings, - for bullet points"
          />
        ) : (
          <div style={{ lineHeight: 1.7 }}>
            {renderPreview(content)}
          </div>
        )}
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 10 }}>
        Markdown supported: ## Heading, ### Subheading, - Bullet point
      </p>
    </div>
  );
}
