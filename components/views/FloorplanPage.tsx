'use client';
import { useState, useRef } from 'react';
import Icon from '@/components/Icon';
import Modal from '@/components/Modal';
import ImageUpload from '@/components/ImageUpload';
import type { Floorplan, FloorplanRoom, Room } from '@/lib/types';
import { createFloorplan, updateFloorplan, deleteFloorplan, createRoom } from '@/lib/db';

const COLORS = ['#C17B4E','#6B7FA8','#4A7C6F','#8B6BAE','#5A8FA0','#B87065','#D4A843','#5C7A45'];

type Point = { x: number; y: number };
type Mode = 'view' | 'draw' | 'edit';

export default function FloorplanPage({ floorplans: initial = [], rooms = [], onFloorplanChange, onRoomCreated }: {
  floorplans: Floorplan[];
  rooms: Room[];
  onFloorplanChange: (fp: Floorplan) => void;
  onRoomCreated: (room: Room) => void;
}) {
  const [floorplans, setFloorplans] = useState<Floorplan[]>(initial);
  const [active, setActive]         = useState<Floorplan | null>(initial[0] ?? null);
  const [showAdd, setShowAdd]       = useState(false);
  const [newName, setNewName]       = useState('');
  const [newImage, setNewImage]     = useState('');
  const [saving, setSaving]         = useState(false);
  const [mode, setMode]             = useState<Mode>('view');

  // Draw state
  const [currentPts, setCurrentPts]   = useState<Point[]>([]);
  const [hoverPt, setHoverPt]         = useState<Point | null>(null);

  // Edit state — dragging a vertex
  const [editingRoom, setEditingRoom]   = useState<string | null>(null); // room id
  const [editingVertex, setEditingVertex] = useState<number | null>(null); // vertex index
  const [selectedRoom, setSelectedRoom] = useState<FloorplanRoom | null>(null);

  // Label modal
  const [labelModal, setLabelModal] = useState(false);
  const [pendingPoly, setPendingPoly] = useState<Point[] | null>(null);
  const [labelForm, setLabelForm]   = useState({ room_name: '', room_id: '' as string | number, color: COLORS[0] });

  // Delete confirmation
  const [confirmDelete, setConfirmDelete] = useState(false);

  const imgRef = useRef<HTMLDivElement>(null);

  // ─── Coordinate helpers ───────────────────────────────────────────────────
  const getRelPos = (e: React.MouseEvent): Point => {
    const rect = imgRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width)  * 100,
      y: ((e.clientY - rect.top)  / rect.height) * 100,
    };
  };

  // ─── Persist helper ───────────────────────────────────────────────────────
  const persistRooms = async (newRooms: FloorplanRoom[]) => {
    if (!active) return;
    setSaving(true);
    try {
      const saved = await updateFloorplan(active.id, { rooms: newRooms });
      setActive(saved);
      setFloorplans(prev => prev.map(f => f.id === saved.id ? saved : f));
      onFloorplanChange(saved);
    } finally { setSaving(false); }
  };

  // ─── Draw mode handlers ───────────────────────────────────────────────────
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (mode !== 'draw') return;
    const pt = getRelPos(e);

    if (currentPts.length >= 3) {
      const first = currentPts[0];
      if (Math.hypot(pt.x - first.x, pt.y - first.y) < 2.5) {
        setPendingPoly(currentPts);
        setCurrentPts([]);
        setMode('view');
        setLabelModal(true);
        return;
      }
    }
    setCurrentPts(prev => [...prev, pt]);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (mode === 'draw') setHoverPt(getRelPos(e));

    // Drag vertex in edit mode
    if (mode === 'edit' && editingRoom && editingVertex !== null) {
      const pt = getRelPos(e);
      if (!active) return;
      const newRooms = active.rooms.map(r => {
        if (r.id !== editingRoom) return r;
        const pts = [...r.points];
        pts[editingVertex] = pt;
        return { ...r, points: pts };
      });
      // Optimistic local update (no save yet — save on mouseup)
      setActive(prev => prev ? { ...prev, rooms: newRooms } : prev);
    }
  };

  const handleMouseUp = async (e: React.MouseEvent) => {
    if (mode === 'edit' && editingRoom && editingVertex !== null && active) {
      setEditingVertex(null);
      setEditingRoom(null);
      await persistRooms(active.rooms);
    }
  };

  // ─── Save new polygon ─────────────────────────────────────────────────────
  const saveLabel = async () => {
    if (!pendingPoly || !active) return;
    setSaving(true);

    let linkedRoomId: number | null = labelForm.room_id === '' ? null : Number(labelForm.room_id);
    const roomName = labelForm.room_name || rooms.find(r => r.id === linkedRoomId)?.name || 'New Room';

    let createdRoom = null;
    if (!linkedRoomId && roomName) {
      try {
        createdRoom = await createRoom({
          name: roomName,
          description: '',
          emoji: '🏠',
          color: labelForm.color,
          order: 0,
        });
        linkedRoomId = createdRoom.id;
      } catch { /* fall through with null room_id */ }
    }

    const newFpRoom: FloorplanRoom = {
      id: `fr_${Date.now()}`,
      room_id: linkedRoomId,
      room_name: roomName,
      points: pendingPoly,
      color: labelForm.color,
    };

    try {
      await persistRooms([...active.rooms, newFpRoom]);
      // Notify parent after floorplan is persisted so both state updates land together
      if (createdRoom) onRoomCreated(createdRoom);
    } finally {
      setPendingPoly(null);
      setLabelModal(false);
      setLabelForm({ room_name: '', room_id: '', color: COLORS[0] });
      setSaving(false);
    }
  };

  const deleteRoomPoly = async (roomId: string) => {
    if (!active) return;
    await persistRooms(active.rooms.filter(r => r.id !== roomId));
    setSelectedRoom(null);
  };

  // ─── Add floorplan ────────────────────────────────────────────────────────
  const addFloorplan = async () => {
    if (!newImage) return;
    setSaving(true);
    const fp = await createFloorplan({ name: newName || 'Floorplan', image_url: newImage, rooms: [] });
    setFloorplans(prev => [...prev, fp]);
    setActive(fp);
    setNewName(''); setNewImage('');
    setShowAdd(false);
    setSaving(false);
  };

  const removeFloorplan = async (id: number) => {
    await deleteFloorplan(id);
    const remaining = floorplans.filter(f => f.id !== id);
    setFloorplans(remaining);
    setActive(remaining[0] ?? null);
  };

  const previewPoints = hoverPt && mode === 'draw' ? [...currentPts, hoverPt] : currentPts;
  const toSvgPts = (pts: Point[]) => pts.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div style={{ padding: '28px 36px' }} className="animate-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 38, fontWeight: 300 }}>Floorplans</h1>
          <p style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 4 }}>Upload a plan and trace your rooms</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {active && mode === 'view' && (
            <>
              <button className="btn btn-ghost" onClick={() => { setMode('draw'); setCurrentPts([]); }}>
                ✏️ Draw Room
              </button>
              <button className="btn btn-ghost" onClick={() => setMode('edit')}>
                🔧 Edit Shapes
              </button>
            </>
          )}
          {mode === 'draw' && (
            <button className="btn btn-ghost" style={{ color: 'var(--red)', borderColor: 'var(--red)' }}
              onClick={() => { setMode('view'); setCurrentPts([]); setHoverPt(null); }}>
              Cancel Drawing
            </button>
          )}
          {mode === 'edit' && (
            <button className="btn btn-ghost" style={{ color: 'var(--green)', borderColor: 'var(--green)' }}
              onClick={() => { setMode('view'); setEditingRoom(null); setEditingVertex(null); }}>
              ✓ Done Editing
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Icon name="plus" size={14} /> Add Floorplan
          </button>
        </div>
      </div>

      {/* Mode hint */}
      {active && (
        <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-3)', minHeight: 20 }}>
          {mode === 'draw' && currentPts.length === 0 && '🖱 Click to place the first point of the room polygon'}
          {mode === 'draw' && currentPts.length > 0 && currentPts.length < 3 && `${currentPts.length} point${currentPts.length > 1 ? 's' : ''} — keep clicking to trace the shape`}
          {mode === 'draw' && currentPts.length >= 3 && '🖱 Click near the first point ● to close the polygon'}
          {mode === 'edit' && '🔧 Drag the corner points ● to reshape any room'}
          {mode === 'view' && saving && '💾 Saving…'}
        </div>
      )}

      {/* Floorplan tabs */}
      {floorplans.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {floorplans.map(fp => (
            <button key={fp.id} onClick={() => { setActive(fp); setMode('view'); }}
              style={{ fontSize: 12, padding: '5px 14px', borderRadius: 20, border: '1px solid var(--border)', background: active?.id === fp.id ? 'var(--accent)' : 'var(--surface)', color: active?.id === fp.id ? 'white' : 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit' }}>
              {fp.name}
            </button>
          ))}
        </div>
      )}

      {!active ? (
        <div className="card" style={{ padding: '60px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏠</div>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 20, marginBottom: 8 }}>No floorplans yet</p>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>Upload Floorplan</button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 20 }}>
          {/* Canvas */}
          <div style={{ flex: 1 }}>
            <div
              ref={imgRef}
              style={{
                position: 'relative',
                cursor: mode === 'draw' ? 'crosshair' : mode === 'edit' ? 'default' : 'default',
                borderRadius: 12, overflow: 'hidden',
                boxShadow: 'var(--shadow-lg)', userSelect: 'none',
              }}
              onClick={handleCanvasClick}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={active.image_url} alt="Floorplan" style={{ width: '100%', display: 'block' }} draggable={false} />

              <svg
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
                viewBox="0 0 100 100" preserveAspectRatio="none"
              >
                {/* Saved rooms */}
                {active.rooms.map(room => {
                  const cx = room.points.reduce((s, p) => s + p.x, 0) / room.points.length;
                  const cy = room.points.reduce((s, p) => s + p.y, 0) / room.points.length;
                  return (
                    <g key={room.id}>
                      <polygon
                        points={toSvgPts(room.points)}
                        fill={room.color + '40'}
                        stroke={room.color}
                        strokeWidth="0.4"
                        style={{ cursor: mode === 'view' ? 'pointer' : 'default' }}
                        onClick={(e) => { if (mode === 'view') { e.stopPropagation(); setSelectedRoom(s => s?.id === room.id ? null : room); } }}
                        onMouseEnter={e => { if (mode === 'view') (e.target as SVGElement).setAttribute('fill', room.color + '70'); }}
                        onMouseLeave={e => { if (mode === 'view') (e.target as SVGElement).setAttribute('fill', room.color + '40'); }}
                      />
                      {/* Label */}
                      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
                        fill={room.color} fontSize="2.2" fontWeight="600" fontFamily="DM Sans, sans-serif"
                        style={{ pointerEvents: 'none' }}>
                        {room.room_name}
                      </text>
                      {/* Vertices — shown in edit mode */}
                      {mode === 'edit' && room.points.map((pt, vi) => (
                        <circle
                          key={vi}
                          cx={pt.x} cy={pt.y} r="1.4"
                          fill="white" stroke={room.color} strokeWidth="0.4"
                          style={{ cursor: 'grab' }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setEditingRoom(room.id);
                            setEditingVertex(vi);
                          }}
                        />
                      ))}
                    </g>
                  );
                })}

                {/* Draw preview */}
                {mode === 'draw' && currentPts.length > 0 && (
                  <>
                    <polyline points={toSvgPts(previewPoints)} fill="none" stroke="var(--accent)" strokeWidth="0.5" strokeDasharray="1,0.5" />
                    {currentPts.map((pt, i) => (
                      <circle key={i} cx={pt.x} cy={pt.y} r={i === 0 ? '1.5' : '0.8'}
                        fill={i === 0 ? 'var(--accent)' : 'white'} stroke="var(--accent)" strokeWidth="0.3" />
                    ))}
                  </>
                )}
              </svg>
            </div>
          </div>

          {/* Room list sidebar */}
          <div style={{ width: 220, flexShrink: 0 }}>
            {/* Mapped rooms */}
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 12 }}>
              Mapped Rooms
            </p>
            {active.rooms.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5 }}>
                No rooms drawn yet. Click "Draw Room" and trace a polygon on the floorplan.
              </p>
            ) : (
              active.rooms.map(room => (
                <div key={room.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, marginBottom: 6, background: selectedRoom?.id === room.id ? 'var(--accent-light)' : 'var(--surface)', border: `1px solid ${selectedRoom?.id === room.id ? 'var(--accent)' : 'var(--border)'}`, cursor: 'pointer', transition: 'var(--transition)' }}
                  onClick={() => setSelectedRoom(s => s?.id === room.id ? null : room)}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: room.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, flex: 1 }}>{room.room_name}</span>
                  {selectedRoom?.id === room.id && (
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', padding: 0, display: 'flex' }}
                      onClick={(e) => { e.stopPropagation(); deleteRoomPoly(room.id); }}>
                      <Icon name="trash" size={13} />
                    </button>
                  )}
                </div>
              ))
            )}

            {/* Unmapped rooms */}
            {(() => {
              const mappedIds = new Set(active.rooms.map(r => r.room_id).filter((id): id is number => id !== null));
              const unmapped = rooms.filter(r => !mappedIds.has(r.id));
              if (unmapped.length === 0) return null;
              return (
                <div style={{ marginTop: 20 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 12 }}>
                    Unmapped Rooms
                  </p>
                  {unmapped.map(room => (
                    <div key={room.id}
                      title="Click to draw this room on the floorplan"
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, marginBottom: 6, background: 'var(--surface)', border: '1px dashed var(--border)', cursor: 'pointer', opacity: 0.75, transition: 'var(--transition)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.opacity = '1'; (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.opacity = '0.75'; (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; }}
                      onClick={() => {
                        setLabelForm({ room_name: room.name, room_id: String(room.id), color: room.color ?? COLORS[0] });
                        setMode('draw');
                        setCurrentPts([]);
                      }}>
                      <span style={{ fontSize: 14, flexShrink: 0 }}>{room.emoji}</span>
                      <span style={{ fontSize: 13, flex: 1 }}>{room.name}</span>
                      <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600 }}>DRAW</span>
                    </div>
                  ))}
                </div>
              );
            })()}

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 10 }}>
                {saving ? '💾 Saving…' : active.rooms.length > 0 ? '✓ All rooms saved' : ''}
              </p>
              <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', color: 'var(--red)', borderColor: 'var(--red)', fontSize: 12 }}
                onClick={() => setConfirmDelete(true)}>
                <Icon name="trash" size={13} /> Delete floorplan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Label modal */}
      {labelModal && (
        <Modal title="Label this room" onClose={() => { setLabelModal(false); setPendingPoly(null); }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Option A: link to existing */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>
                Link to an existing room <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span>
              </label>
              <select className="input" value={labelForm.room_id}
                onChange={e => {
                  const id = e.target.value;
                  const rm = rooms.find(r => r.id === Number(id));
                  setLabelForm(f => ({ ...f, room_id: id, room_name: id ? (rm?.name ?? f.room_name) : f.room_name }));
                }}>
                <option value="">— Create as a new room —</option>
                {rooms.map(r => <option key={r.id} value={r.id}>{r.emoji} {r.name}</option>)}
              </select>
            </div>

            {/* Label name */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>
                Room name {!labelForm.room_id && <span style={{ color: 'var(--red)' }}>*</span>}
              </label>
              <input className="input" placeholder="e.g. Living Room"
                value={labelForm.room_name}
                onChange={e => setLabelForm(f => ({ ...f, room_name: e.target.value }))} />
              {!labelForm.room_id && (
                <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 5 }}>
                  This will also create a new room in your Rooms list
                </p>
              )}
            </div>

            {/* Colour */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 8 }}>Colour</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {COLORS.map(c => (
                  <button key={c} onClick={() => setLabelForm(f => ({ ...f, color: c }))}
                    style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: `3px solid ${labelForm.color === c ? 'var(--text)' : 'transparent'}`, cursor: 'pointer' }} />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => { setLabelModal(false); setPendingPoly(null); }}>Cancel</button>
              <button
                className="btn btn-primary"
                disabled={saving || (!labelForm.room_name && !labelForm.room_id)}
                onClick={saveLabel}>
                {saving ? 'Saving…' : 'Save Room'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm delete floorplan modal */}
      {confirmDelete && active && (
        <Modal title="Delete floorplan?" onClose={() => setConfirmDelete(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>
              Are you sure you want to delete <strong>{active.name}</strong>? The floorplan image and all drawn room polygons will be removed. Your rooms will not be deleted.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: 'var(--red)', borderColor: 'var(--red)' }}
                onClick={async () => { setConfirmDelete(false); await removeFloorplan(active.id); }}>
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add floorplan modal */}
      {showAdd && (
        <Modal title="Add Floorplan" onClose={() => setShowAdd(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Name</label>
              <input className="input" placeholder="e.g. Ground Floor" value={newName}
                onChange={e => setNewName(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Floorplan Image</label>
              {newImage ? (
                <div style={{ position: 'relative' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={newImage} alt="" style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 8, background: 'var(--bg)' }} />
                  <button className="btn btn-ghost" style={{ position: 'absolute', top: 8, right: 8 }}
                    onClick={() => setNewImage('')}><Icon name="x" size={13} /></button>
                </div>
              ) : (
                <ImageUpload folder="inspiration" onUpload={setNewImage} label="Upload floorplan image" />
              )}
              <input className="input" placeholder="…or paste image URL" value={newImage}
                onChange={e => setNewImage(e.target.value)} style={{ marginTop: 8 }} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={!newImage || saving} onClick={addFloorplan}>
                {saving ? 'Saving…' : 'Add Floorplan'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
