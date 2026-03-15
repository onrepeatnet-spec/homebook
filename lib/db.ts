import { supabase } from './supabase';
import type { Room, Inspiration, Product, ColourPalette, BudgetItem, MoodboardItem, Floorplan, Todo, CostItem, CalendarEvent } from './types';

// ─── Rooms ────────────────────────────────────────────────────────────────────
export const getRooms = async (): Promise<Room[]> => {
  // Try ordering by 'order' column (requires migration_v3), fall back to created_at
  const { data, error } = await supabase.from('rooms').select('*').order('created_at');
  if (error) throw error;
  // Sort by order field client-side if it exists
  return (data ?? []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};
export const createRoom = async (room: Omit<Room, 'id' | 'created_at'>): Promise<Room> => {
  const { data, error } = await supabase.from('rooms').insert(room).select().single();
  if (error) throw error;
  return data;
};
export const updateRoom = async (id: number, updates: Partial<Room>): Promise<Room> => {
  const { data, error } = await supabase.from('rooms').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
};
export const deleteRoom = async (id: number): Promise<void> => {
  const { error } = await supabase.from('rooms').delete().eq('id', id);
  if (error) throw error;
};
export const reorderRooms = async (orderedIds: number[]): Promise<void> => {
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from('rooms').update({ order: index }).eq('id', id)
    )
  );
};

// ─── Inspiration ──────────────────────────────────────────────────────────────
export const getInspirations = async (roomId?: number): Promise<Inspiration[]> => {
  let query = supabase.from('inspirations').select('*').order('created_at', { ascending: false });
  if (roomId) query = query.eq('room_id', roomId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
};
export const createInspiration = async (item: Omit<Inspiration, 'id' | 'created_at'>): Promise<Inspiration> => {
  const { data, error } = await supabase.from('inspirations').insert(item).select().single();
  if (error) throw error;
  return data;
};
export const updateInspiration = async (id: number, updates: Partial<Inspiration>): Promise<Inspiration> => {
  const { data, error } = await supabase.from('inspirations').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
};
export const deleteInspiration = async (id: number): Promise<void> => {
  const { error } = await supabase.from('inspirations').delete().eq('id', id);
  if (error) throw error;
};

// ─── Products ─────────────────────────────────────────────────────────────────
export const getProducts = async (roomId?: number): Promise<Product[]> => {
  let query = supabase.from('products').select('*').order('created_at', { ascending: false });
  if (roomId) query = query.eq('room_id', roomId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
};
export const createProduct = async (product: Omit<Product, 'id' | 'created_at'>): Promise<Product> => {
  const { data, error } = await supabase.from('products').insert(product).select().single();
  if (error) throw error;
  return data;
};
export const updateProduct = async (id: number, updates: Partial<Product>): Promise<Product> => {
  const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
};
export const deleteProduct = async (id: number): Promise<void> => {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
};

// ─── Colour Palettes ──────────────────────────────────────────────────────────
export const getPalettes = async (roomId?: number): Promise<ColourPalette[]> => {
  let query = supabase.from('colour_palettes').select('*').order('created_at');
  if (roomId) query = query.eq('room_id', roomId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
};
export const createPalette = async (palette: Omit<ColourPalette, 'id' | 'created_at'>): Promise<ColourPalette> => {
  const { data, error } = await supabase.from('colour_palettes').insert(palette).select().single();
  if (error) throw error;
  return data;
};
export const deletePalette = async (id: number): Promise<void> => {
  const { error } = await supabase.from('colour_palettes').delete().eq('id', id);
  if (error) throw error;
};

// ─── Budget Items ─────────────────────────────────────────────────────────────
export const getBudgetItems = async (roomId?: number): Promise<BudgetItem[]> => {
  let query = supabase.from('budget_items').select('*').order('created_at');
  if (roomId) query = query.eq('room_id', roomId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
};
export const createBudgetItem = async (item: Omit<BudgetItem, 'id' | 'created_at'>): Promise<BudgetItem> => {
  const { data, error } = await supabase.from('budget_items').insert(item).select().single();
  if (error) throw error;
  return data;
};
export const updateBudgetItem = async (id: number, updates: Partial<BudgetItem>): Promise<BudgetItem> => {
  const { data, error } = await supabase.from('budget_items').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
};
export const deleteBudgetItem = async (id: number): Promise<void> => {
  const { error } = await supabase.from('budget_items').delete().eq('id', id);
  if (error) throw error;
};

// ─── Moodboard Items ──────────────────────────────────────────────────────────
export const getMoodboardItems = async (roomId: number): Promise<MoodboardItem[]> => {
  const { data, error } = await supabase.from('moodboard_items').select('*').eq('room_id', roomId);
  if (error) throw error;
  return data;
};
export const upsertMoodboardItems = async (roomId: number, items: MoodboardItem[]): Promise<void> => {
  await supabase.from('moodboard_items').delete().eq('room_id', roomId);
  if (items.length > 0) {
    // Strip undefined fields to avoid column errors
    const rows = items.map(i => {
      const row: Record<string, unknown> = {
        id: i.id, type: i.type, x: i.x, y: i.y, w: i.w, h: i.h, room_id: roomId,
      };
      if (i.src   !== undefined) row.src   = i.src;
      if (i.color !== undefined) row.color = i.color;
      if (i.text  !== undefined) row.text  = i.text;
      if (i.label !== undefined) row.label = i.label;
      if (i.href  !== undefined) row.href  = i.href;
      if (i.title !== undefined) row.title = i.title;
      return row;
    });
    const { error } = await supabase.from('moodboard_items').insert(rows);
    if (error) throw error;
  }
};

// ─── Floorplans ───────────────────────────────────────────────────────────────
export const getFloorplans = async (): Promise<Floorplan[]> => {
  const { data, error } = await supabase.from('floorplans').select('*').order('created_at');
  if (error) throw error;
  return data;
};
export const createFloorplan = async (fp: Omit<Floorplan, 'id' | 'created_at'>): Promise<Floorplan> => {
  const { data, error } = await supabase.from('floorplans').insert(fp).select().single();
  if (error) throw error;
  return data;
};
export const updateFloorplan = async (id: number, updates: Partial<Floorplan>): Promise<Floorplan> => {
  const { data, error } = await supabase.from('floorplans').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
};
export const deleteFloorplan = async (id: number): Promise<void> => {
  const { error } = await supabase.from('floorplans').delete().eq('id', id);
  if (error) throw error;
};

// ─── Todos ────────────────────────────────────────────────────────────────────
export const getTodos = async (): Promise<Todo[]> => {
  const { data, error } = await supabase.from('todos').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};
export const createTodo = async (todo: Omit<Todo, 'id' | 'created_at'>): Promise<Todo> => {
  const { data, error } = await supabase.from('todos').insert(todo).select().single();
  if (error) throw error;
  return data;
};
export const updateTodo = async (id: number, updates: Partial<Todo>): Promise<Todo> => {
  const { data, error } = await supabase.from('todos').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
};
export const deleteTodo = async (id: number): Promise<void> => {
  const { error } = await supabase.from('todos').delete().eq('id', id);
  if (error) throw error;
};

// ─── Cost Items ───────────────────────────────────────────────────────────────
export const getCostItems = async (): Promise<CostItem[]> => {
  const { data, error } = await supabase.from('cost_items').select('*').order('created_at');
  if (error) throw error;
  return data;
};
export const createCostItem = async (item: Omit<CostItem, 'id' | 'created_at'>): Promise<CostItem> => {
  const { data, error } = await supabase.from('cost_items').insert(item).select().single();
  if (error) throw error;
  return data;
};
export const updateCostItem = async (id: number, updates: Partial<CostItem>): Promise<CostItem> => {
  const { data, error } = await supabase.from('cost_items').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
};
export const deleteCostItem = async (id: number): Promise<void> => {
  const { error } = await supabase.from('cost_items').delete().eq('id', id);
  if (error) throw error;
};

// ─── Calendar Events ──────────────────────────────────────────────────────────
export const getCalendarEvents = async (): Promise<CalendarEvent[]> => {
  const { data, error } = await supabase.from('calendar_events').select('*').order('date');
  if (error) throw error;
  return data;
};
export const createCalendarEvent = async (event: Omit<CalendarEvent, 'id' | 'created_at'>): Promise<CalendarEvent> => {
  const { data, error } = await supabase.from('calendar_events').insert(event).select().single();
  if (error) throw error;
  return data;
};
export const updateCalendarEvent = async (id: number, updates: Partial<CalendarEvent>): Promise<CalendarEvent> => {
  const { data, error } = await supabase.from('calendar_events').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
};
export const deleteCalendarEvent = async (id: number): Promise<void> => {
  const { error } = await supabase.from('calendar_events').delete().eq('id', id);
  if (error) throw error;
};
