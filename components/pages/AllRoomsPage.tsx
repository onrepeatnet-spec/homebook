'use client';
import { useState } from 'react';
import Icon from '@/components/Icon';
import Modal from '@/components/Modal';
import type { Room } from '@/lib/types';
import type { Page } from '@/app/page';
import { updateRoom } from '@/lib/db';

const EMOJIS = ['🛋️','🛏️','🍳','💻','🛁','🌿','🎨','📚','🏠','🌳','🍽️','🎵','🪴','🪞','🧘','🚿','🛒','🏋️'];
const COLORS  = ['#C17B4E','#6B7FA8','#4A7C6F','#8B6BAE','#5A8FA0','#5C7A45','#B87065','#7A6B8A','#C0503A','#D4A843'];

export default function AllRoomsPage({ rooms, onNavigate, onAdd, onUpdate }: {
  rooms: Room[];
  onNavigate: (p: Page, roomId?: number) => void;
  onAdd: (data: Omit<Room, 'id' | 'created_at'>) => Promise<void>;
  onUpdate: (id: number, updates: Partial<Room>) => Promise<void>;
}) {
  const [showAdd, setShowAdd]   = useState(false);
  const [editing, setEditing]   = useState<Room | null>(null);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({ name: '', description: '', emoji: '🛋️', color: '#C17B4E' });
  const [editForm, setEditForm] = useState({ name: '', description: '', emoji: '🛋️', color: '#C17B4E' });

  const handleAdd = async () => {
    if (!form.name) return;
    setSaving(true);
    try { await onAdd(form); setForm({ name: '', description: '', emoji: '🛋️', color: '#C17B4E' }); setShowAdd(false); }
    finally { setSaving(false); }
  };

  const startEdit = (room: Room) => {
    setEditing(room);
    setEditForm({ name: room.name, description: room.description, emoji: room.emoji, color: room.color });
  };

  const handleEdit = async () => {
    if (!editing || !editForm.name) return;
    setSaving(true);
    try { await onUpdate(editing.id, editForm); setEditing(null); }
    finally { setSaving(false); }
  };

  const RoomForm = ({ f, setF }: { f: typeof form; setF: (fn: (prev: typeof form) => typeof form) => void }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Room Name *</label>
        <input className="input" placeholder="e.g. Dining Room" value={f.name}
          onChange={e => setF(prev => ({ ...prev, name: e.target.value }))} />
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Description</label>
        <input className="input" placeholder="Brief description" value={f.description}
          onChange={e => setF(prev => ({ ...prev, description: e.target.value }))} />
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 8 }}>Emoji</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {EMOJIS.map(e => (
            <button key={e} onClick={() => setF(prev => ({ ...prev, emoji: e }))}
              style={{ fontSize: 22, width: 42, height: 42, borderRadius: 8, border: `2px solid ${f.emoji === e ? 'var(--accent)' : 'var(--border)'}`, background: f.emoji === e ? 'var(--accent-light)' : 'var(--surface)', cursor: 'pointer', transition: 'var(--transition)' }}>
              {e}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 8 }}>Accent Colour</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {COLORS.map(c => (
            <button key={c} onClick={() => setF(prev => ({ ...prev, color: c }))}
              style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: `3px solid ${f.color === c ? 'var(--text)' : 'transparent'}`, cursor: 'pointer', transition: 'var(--transition)' }} />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '32px 36px' }} className="animate-in">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 38, fontWeight: 300 }}>Rooms</h1>
          <p style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 4 }}>Your home, organised by space</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Icon name="plus" size={14} /> Add Room
        </button>
      </div>

      {rooms.length === 0 ? (
        <div className="card" style={{ padding: '60px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏠</div>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 20, marginBottom: 8 }}>No rooms yet</p>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>Add your first room</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 18 }}>
          {rooms.map((room, idx) => (
            <div key={room.id} className="card animate-in" style={{ padding: 24, borderLeft: `4px solid ${room.color}`, animationDelay: `${idx * 0.05}s` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontSize: 36 }}>{room.emoji}</div>
                <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => startEdit(room)}>
                  <Icon name="edit" size={14} />
                </button>
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 400, marginBottom: 6 }}>{room.name}</h3>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>{room.description}</p>
              <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: 12, color: 'var(--accent)', borderColor: 'var(--accent)' }}
                onClick={() => onNavigate('room', room.id)}>
                Open workspace <Icon name="chevronRight" size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <Modal title="Add New Room" onClose={() => setShowAdd(false)}>
          <RoomForm f={form} setF={setForm as any} />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={!form.name || saving} onClick={handleAdd}>
              {saving ? 'Creating…' : 'Create Room'}
            </button>
          </div>
        </Modal>
      )}

      {/* Edit modal */}
      {editing && (
        <Modal title={`Edit: ${editing.name}`} onClose={() => setEditing(null)}>
          <RoomForm f={editForm} setF={setEditForm as any} />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn btn-primary" disabled={!editForm.name || saving} onClick={handleEdit}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
