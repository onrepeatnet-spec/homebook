'use client';
import { useState } from 'react';
import Icon from '@/components/Icon';
import Modal from '@/components/Modal';
import ContextMenu from '@/components/ContextMenu';
import type { Room, Floorplan } from '@/lib/types';
import type { Page } from '@/app/page';
import { reorderRooms } from '@/lib/db';

const EMOJIS = ['🛋️','🛏️','🍳','💻','🛁','🌿','🎨','📚','🏠','🌳','🍽️','🎵','🪴','🪞','🧘','🚿','🛒','🏋️'];
const COLORS  = ['#C17B4E','#6B7FA8','#4A7C6F','#8B6BAE','#5A8FA0','#5C7A45','#B87065','#7A6B8A','#C0503A','#D4A843'];
type RFD = { name: string; description: string; emoji: string; color: string; order: number };
const EMPTY: RFD = { name: '', description: '', emoji: '🛋️', color: '#C17B4E', order: 0 };

function RoomForm({ f, onChange }: { f: RFD; onChange: (u: Partial<RFD>) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Room Name *</label>
        <input className="input" placeholder="e.g. Dining Room" value={f.name} onChange={e => onChange({ name: e.target.value })} />
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Description</label>
        <input className="input" placeholder="Brief description" value={f.description} onChange={e => onChange({ description: e.target.value })} />
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 8 }}>Emoji</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {EMOJIS.map(em => (
            <button key={em} type="button" onClick={() => onChange({ emoji: em })}
              style={{ fontSize: 22, width: 42, height: 42, borderRadius: 8, border: `2px solid ${f.emoji === em ? 'var(--accent)' : 'var(--border)'}`, background: f.emoji === em ? 'var(--accent-light)' : 'var(--surface)', cursor: 'pointer' }}>
              {em}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 8 }}>Accent Colour</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {COLORS.map(c => (
            <button key={c} type="button" onClick={() => onChange({ color: c })}
              style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: `3px solid ${f.color === c ? 'var(--text)' : 'transparent'}`, cursor: 'pointer' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AllRoomsPage({ rooms, floorplans, onNavigate, onAdd, onUpdate }: {
  rooms: Room[];
  floorplans: Floorplan[];
  onNavigate: (p: Page, roomId?: number) => void;
  onAdd: (data: Omit<Room, 'id' | 'created_at'>) => Promise<void>;
  onUpdate: (id: number, updates: Partial<Room>) => Promise<void>;
}) {
  const [showAdd, setShowAdd]       = useState(false);
  const [editing, setEditing]       = useState<Room | null>(null);
  const [saving, setSaving]         = useState(false);
  const [form, setForm]             = useState<RFD>(EMPTY);
  const [editForm, setEditForm]     = useState<RFD>(EMPTY);
  const [ctxMenu, setCtxMenu]       = useState<{ x: number; y: number; room: Room } | null>(null);
  const [draggedId, setDraggedId]   = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [localOrder, setLocalOrder] = useState<Room[]>([]);

  const mappedRoomIds = new Set(
    floorplans.flatMap(fp => fp.rooms.map(r => r.room_id)).filter((id): id is number => id !== null)
  );
  const visibleRooms = floorplans.length > 0 && mappedRoomIds.size > 0
    ? rooms.filter(r => mappedRoomIds.has(r.id)) : rooms;
  const orderedRooms = localOrder.length > 0 ? localOrder : visibleRooms;

  const handleDrop = async (targetId: number) => {
    if (!draggedId || draggedId === targetId) { setDraggedId(null); setDragOverId(null); return; }
    const from = orderedRooms.findIndex(r => r.id === draggedId);
    const to   = orderedRooms.findIndex(r => r.id === targetId);
    const reordered = [...orderedRooms];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    setLocalOrder(reordered);
    setDraggedId(null); setDragOverId(null);
    await reorderRooms(reordered.map(r => r.id));
  };

  const handleAdd = async () => {
    if (!form.name) return;
    setSaving(true);
    try { await onAdd(form); setForm(EMPTY); setShowAdd(false); } finally { setSaving(false); }
  };

  const startEdit = (room: Room) => {
    setEditing(room);
    setEditForm({ name: room.name, description: room.description, emoji: room.emoji, color: room.color });
  };

  const handleEdit = async () => {
    if (!editing || !editForm.name) return;
    setSaving(true);
    try { await onUpdate(editing.id, editForm); setEditing(null); } finally { setSaving(false); }
  };

  return (
    <div style={{ padding: '32px 36px' }} className="animate-in">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 38, fontWeight: 300 }}>Rooms</h1>
          <p style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 4 }}>
            {floorplans.length > 0 && mappedRoomIds.size > 0
              ? `${orderedRooms.length} room${orderedRooms.length !== 1 ? 's' : ''} on your floorplan`
              : 'Your home, organised by space'}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Icon name="plus" size={14} /> Add Room
        </button>
      </div>

      {orderedRooms.length === 0 ? (
        <div className="card" style={{ padding: '60px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏠</div>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 20, marginBottom: 8 }}>
            {floorplans.length > 0 ? 'No rooms drawn on your floorplan yet' : 'No rooms yet'}
          </p>
          {floorplans.length > 0
            ? <p style={{ color: 'var(--text-3)', fontSize: 13, marginBottom: 16 }}>Go to Floorplans and draw polygons to create rooms</p>
            : <button className="btn btn-primary" onClick={() => setShowAdd(true)}>Add your first room</button>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 18 }}>
          {orderedRooms.map((room, idx) => (
            <div key={room.id} className="card animate-in" draggable
              onDragStart={() => setDraggedId(room.id)}
              onDragOver={e => e.preventDefault()}
              onDragEnter={() => setDragOverId(room.id)}
              onDrop={() => handleDrop(room.id)}
              onDragEnd={() => { setDraggedId(null); setDragOverId(null); }}
              onContextMenu={e => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, room }); }}
              style={{ padding: 24, borderLeft: `4px solid ${room.color}`, animationDelay: `${idx * 0.05}s`,
                opacity: draggedId === room.id ? 0.4 : 1,
                outline: dragOverId === room.id ? `2px dashed ${room.color}` : 'none',
                transition: 'opacity 0.15s, outline 0.15s', cursor: 'grab' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontSize: 36 }}>{room.emoji}</div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <span style={{ fontSize: 14, color: 'var(--text-3)' }} title="Drag to reorder">⠿</span>
                  <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => startEdit(room)}>
                    <Icon name="edit" size={14} />
                  </button>
                </div>
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 400, marginBottom: 6 }}>{room.name}</h3>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>{room.description}</p>
              <button className="btn btn-ghost"
                style={{ width: '100%', justifyContent: 'center', fontSize: 12, color: 'var(--accent)', borderColor: 'var(--accent)' }}
                onClick={() => onNavigate('room', room.id)}>
                Open workspace <Icon name="chevronRight" size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <Modal title="Add New Room" onClose={() => setShowAdd(false)}>
          <RoomForm f={form} onChange={u => setForm(p => ({ ...p, ...u }))} />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={!form.name || saving} onClick={handleAdd}>
              {saving ? 'Creating…' : 'Create Room'}
            </button>
          </div>
        </Modal>
      )}

      {editing && (
        <Modal title={`Edit: ${editing.name}`} onClose={() => setEditing(null)}>
          <RoomForm f={editForm} onChange={u => setEditForm(p => ({ ...p, ...u }))} />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn btn-primary" disabled={!editForm.name || saving} onClick={handleEdit}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </Modal>
      )}

      {ctxMenu && (
        <ContextMenu x={ctxMenu.x} y={ctxMenu.y} onClose={() => setCtxMenu(null)}
          items={[
            { label: 'Open workspace', icon: '🏠', onClick: () => onNavigate('room', ctxMenu.room.id) },
            { label: 'Edit room', icon: '✏️', onClick: () => startEdit(ctxMenu.room) },
          ]}
        />
      )}
    </div>
  );
}
