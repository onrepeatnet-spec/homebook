'use client';
import { useState, useRef } from 'react';
import Icon from '@/components/Icon';
import Modal from '@/components/Modal';
import ImageUpload from '@/components/ImageUpload';
import type { Floorplan, FloorplanRoom, Room } from '@/lib/types';
import { createFloorplan, updateFloorplan, deleteFloorplan } from '@/lib/db';

const COLORS = ['#C17B4E','#6B7FA8','#4A7C6F','#8B6BAE','#5A8FA0','#B87065','#D4A843','#5C7A45'];

type Point = { x: number; y: number };

export default function FloorplanPage({ floorplans: initial, rooms, onRoomsChange }: {
  floorplans: Floorplan[];
  rooms: Room[];
  onRoomsChange: () => void;
}) {
  const [floorplans, setFloorplans] = useState<Floorplan[]>(initial);
  const [active, setActive]         = useState<Floorplan | null>(initial[0] ?? null);
  const [showAdd, setShowAdd]       = useState(false);
  const [newName, setNewName]       = useState('');
  const [newImage, setNewImage]     = useState('');
  const [saving, setSaving]         = useState(false);

  // Drawing state
  const [drawing, setDrawing]       = useState(false);
  const [currentPts, setCurrentPts] = useState<Point[]>([]);
  const [hoverPt, setHoverPt]       = useState<Point | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<FloorplanRoom | null>(null);
  const [labelModal, setLabelModal] = useState(false);
  const [pendingPoly, setPendingPoly] = useState<Point[] | null>(null);
  const [labelForm, setLabelForm]   = useState({ room_name: '', room_id: '' as string | number, color: COLORS[0] });

  const imgRef = useRef<HTMLDivElement>(null);

  const getRelPos = (e: React.MouseEvent): Point => {
    const rect = imgRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width)  * 100,
      y: ((e.clientY - rect.top)  / rect.height) * 100,
    };
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!drawing) return;
    const pt = getRelPos(e);

    // Close polygon if clicking near first point (within 2%)
    if (currentPts.length >= 3) {
      const first = currentPts[0];
      const dist = Math.hypot(pt.x - first.x, pt.y - first.y);
      if (dist < 2.5) {
        setPendingPoly(currentPts);
        setCurrentPts([]);
        setDrawing(false);
        setLabelModal(true);
        return;
      }
    }
    setCurrentPts(prev => [...prev, pt]);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drawing) return;
    setHoverPt(getRelPos(e));
  };

  const saveLabel = async () => {
    if (!pendingPoly || !active) return;
    const newRoom: FloorplanRoom = {
      id: `fr_${Date.now()}`,
      room_id: labelForm.room_id === '' ? null : Number(labelForm.room_id),
      room_name: labelForm.room_name || rooms.find(r => r.id === Number(labelForm.room_id))?.name || 'Room',
      points: pendingPoly,
      color: labelForm.color,
    };
    const updated = { ...active, rooms: [...active.rooms, newRoom] };
    setSaving(true);
    const saved = await updateFloorplan(active.id, { rooms: updated.rooms });
    setActive(saved);
    setFloorplans(prev => prev.map(f => f.id === saved.id ? saved : f));
    setPendingPoly(null);
    setLabelModal(false);
    setLabelForm({ room_name: '', room_id: '', color: COLORS[0] });
    setSaving(false);
  };

  const deleteRoomPoly = async (roomId: string) => {
    if (!active) return;
    const updated = { ...active, rooms: active.rooms.filter(r => r.id !== roomId) };
    const saved = await updateFloorplan(active.id, { rooms: updated.rooms });
    setActive(saved);
    setFloorplans(prev => prev.map(f => f.id === saved.id ? saved : f));
    setSelectedRoom(null);
  };

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

  // Build SVG polyline from current points + hover
  const previewPoints = hoverPt ? [...currentPts, hoverPt] : currentPts;
  const toSvgPts = (pts: Point[]) => pts.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div style={{ padding: '28px 36px' }} className="animate-in">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 38, fontWeight: 300 }}>Floorplans</h1>
          <p style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 4 }}>Upload a plan and trace your rooms</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {active && !drawing && (
            <button className="btn btn-ghost" onClick={() => { setDrawing(true); setCurrentPts([]); }}>
              ✏️ Draw Room
            </button>
          )}
          {drawing && (
            <button className="btn btn-ghost" style={{ color: 'var(--red)', borderColor: 'var(--red)' }}
              onClick={() => { setDrawing(false); setCurrentPts([]); }}>
              Cancel Drawing
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Icon name="plus" size={14} /> Add Floorplan
          </button>
        </div>
      </div>

      {/* Floorplan tabs */}
      {floorplans.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {floorplans.map(fp => (
            <button key={fp.id} onClick={() => setActive(fp)}
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
          <p style={{ color: 'var(--text-3)', fontSize: 13, marginBottom: 20 }}>Upload a floorplan image to get started</p>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>Upload Floorplan</button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 20 }}>
          {/* Canvas */}
          <div style={{ flex: 1, position: 'relative' }}>
            {drawing && (
              <div style={{ background: 'var(--accent-light)', border: '1px solid var(--accent)', borderRadius: 8, padding: '10px 16px', marginBottom: 12, fontSize: 13, color: 'var(--accent-dark)' }}>
                {currentPts.length === 0
                  ? '🖱 Click to place the first point of the room polygon'
                  : currentPts.length < 3
                  ? `🖱 ${currentPts.length} point${currentPts.length > 1 ? 's' : ''} placed — keep clicking to trace the room shape`
                  : '🖱 Click near the first point (●) to close the polygon'}
              </div>
            )}

            <div
              ref={imgRef}
              style={{ position: 'relative', cursor: drawing ? 'crosshair' : 'default', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-lg)', userSelect: 'none' }}
              onClick={handleCanvasClick}
              onMouseMove={handleMouseMove}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={active.image_url} alt="Floorplan" style={{ width: '100%', display: 'block' }} draggable={false} />

              {/* SVG overlay */}
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }} viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Saved rooms */}
                {active.rooms.map(room => (
                  <g key={room.id} onClick={(e) => { e.stopPropagation(); if (!drawing) setSelectedRoom(room); }}>
                    <polygon
                      points={toSvgPts(room.points)}
                      fill={room.color + '40'}
                      stroke={room.color}
                      strokeWidth="0.4"
                      style={{ cursor: drawing ? 'crosshair' : 'pointer', transition: 'fill 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.fill = room.color + '70')}
                      onMouseLeave={e => (e.currentTarget.style.fill = room.color + '40')}
                    />
                    {/* Label at centroid */}
                    {(() => {
                      const cx = room.points.reduce((s, p) => s + p.x, 0) / room.points.length;
                      const cy = room.points.reduce((s, p) => s + p.y, 0) / room.points.length;
                      return (
                        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
                          fill={room.color} fontSize="2.2" fontWeight="600" fontFamily="DM Sans, sans-serif"
                          style={{ pointerEvents: 'none' }}>
                          {room.room_name}
                        </text>
                      );
                    })()}
                    {/* First point indicator */}
                    <circle cx={room.points[0].x} cy={room.points[0].y} r="0.8" fill={room.color} />
                  </g>
                ))}

                {/* Drawing preview */}
                {currentPts.length > 0 && (
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
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 12 }}>Mapped Rooms</p>
            {active.rooms.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5 }}>No rooms drawn yet. Click "Draw Room" and trace a polygon.</p>
            ) : (
              active.rooms.map(room => (
                <div key={room.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, marginBottom: 6, background: selectedRoom?.id === room.id ? 'var(--accent-light)' : 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer' }}
                  onClick={() => setSelectedRoom(selectedRoom?.id === room.id ? null : room)}>
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
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', color: 'var(--red)', borderColor: 'var(--red)', fontSize: 12 }}
                onClick={() => removeFloorplan(active.id)}>
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
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Link to existing room</label>
              <select className="input" value={labelForm.room_id}
                onChange={e => {
                  const id = e.target.value;
                  const rm = rooms.find(r => r.id === Number(id));
                  setLabelForm(f => ({ ...f, room_id: id, room_name: rm?.name ?? f.room_name }));
                }}>
                <option value="">— New room —</option>
                {rooms.map(r => <option key={r.id} value={r.id}>{r.emoji} {r.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Room label</label>
              <input className="input" placeholder="e.g. Living Room" value={labelForm.room_name}
                onChange={e => setLabelForm(f => ({ ...f, room_name: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 8 }}>Colour</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {COLORS.map(c => (
                  <button key={c} onClick={() => setLabelForm(f => ({ ...f, color: c }))}
                    style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: `3px solid ${labelForm.color === c ? 'var(--text)' : 'transparent'}`, cursor: 'pointer' }} />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => { setLabelModal(false); setPendingPoly(null); }}>Cancel</button>
              <button className="btn btn-primary" disabled={saving} onClick={saveLabel}>Save Room</button>
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
