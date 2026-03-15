'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import Dashboard from '@/components/Dashboard';
import AllRoomsPage from '@/components/views/AllRoomsPage';
import RoomPage from '@/components/views/RoomPage';
import AllInspirationPage from '@/components/views/AllInspirationPage';
import AllProductsPage from '@/components/views/AllProductsPage';
import BudgetOverviewPage from '@/components/views/BudgetOverviewPage';
import FloorplanPage from '@/components/views/FloorplanPage';
import TodoPage from '@/components/views/TodoPage';
import CostTrackerPage from '@/components/views/CostTrackerPage';
import CalendarPage from '@/components/views/CalendarPage';
import DiscoverPage from '@/components/views/DiscoverPage';
import { CurrencyProvider } from '@/components/CurrencyContext';
import { ToastProvider, useToast } from '@/components/ToastContext';
import * as db from '@/lib/db';
import type { Room, Inspiration, Product, ColourPalette, BudgetItem, Floorplan, Todo, CostItem, CalendarEvent } from '@/lib/types';

export type Page = 'dashboard' | 'rooms' | 'room' | 'floorplans' | 'inspiration' | 'products' | 'budget' | 'todos' | 'costs' | 'calendar' | 'discover';

export default function Home() {
  const { showError } = useToast();
  const [page, setPage]               = useState<Page>('dashboard');
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);

  const [rooms, setRooms]             = useState<Room[]>([]);
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);
  const [products, setProducts]       = useState<Product[]>([]);
  const [palettes, setPalettes]       = useState<ColourPalette[]>([]);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [floorplans, setFloorplans]   = useState<Floorplan[]>([]);
  const [todos, setTodos]             = useState<Todo[]>([]);
  const [costItems, setCostItems]     = useState<CostItem[]>([]);
  const [calEvents, setCalEvents]     = useState<CalendarEvent[]>([]);
  const [loading, setLoading]         = useState(true);
  const [loadErrors, setLoadErrors]   = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      const errors: string[] = [];

      const [r, i, p, pal, b, fp, td, ci, ce] = await Promise.all([
        db.getRooms().catch(e => { errors.push(`rooms: ${e?.message ?? e}`); return []; }),
        db.getInspirations().catch(e => { errors.push(`inspirations: ${e?.message ?? e}`); return []; }),
        db.getProducts().catch(e => { errors.push(`products: ${e?.message ?? e}`); return []; }),
        db.getPalettes().catch(e => { errors.push(`palettes: ${e?.message ?? e}`); return []; }),
        db.getBudgetItems().catch(e => { errors.push(`budget: ${e?.message ?? e}`); return []; }),
        db.getFloorplans().catch(e => { errors.push(`floorplans: ${e?.message ?? e}`); return []; }),
        db.getTodos().catch(e => { errors.push(`todos: ${e?.message ?? e}`); return []; }),
        db.getCostItems().catch(e => { errors.push(`costs: ${e?.message ?? e}`); return []; }),
        db.getCalendarEvents().catch(e => { errors.push(`calendar: ${e?.message ?? e}`); return []; }),
      ]);

      let rooms = r as Room[];
      // Auto-create a "General" room if none exist
      if (rooms.length === 0) {
        try {
          const general = await db.createRoom({ name: 'General', description: 'Unassigned items', emoji: '📦', color: '#888888', order: 0 });
          rooms = [general];
        } catch { /* ignore */ }
      }
      setRooms(rooms); setInspirations(i as any); setProducts(p as any);
      setPalettes(pal as any); setBudgetItems(b as any); setFloorplans(fp as any);
      setTodos(td as any); setCostItems(ci as any); setCalEvents(ce as any);
      if (errors.length) { setLoadErrors(errors); errors.forEach(e => showError(e)); }
      setLoading(false);
    }
    load();
  }, []);

  const navigate = (p: Page, roomId?: number) => {
    setPage(p);
    if (roomId) setActiveRoomId(roomId);
  };

  const actions = {
    add: {
      room: async (data: Omit<Room, 'id' | 'created_at'>) => {
        const room = await db.createRoom(data); setRooms(prev => [...prev, room]);
      },
      inspiration: async (data: Omit<Inspiration, 'id' | 'created_at'>) => {
        const item = await db.createInspiration(data); setInspirations(prev => [item, ...prev]);
      },
      product: async (data: Omit<Product, 'id' | 'created_at'>) => {
        const item = await db.createProduct(data); setProducts(prev => [item, ...prev]);
      },
      palette: async (data: Omit<ColourPalette, 'id' | 'created_at'>) => {
        const item = await db.createPalette(data); setPalettes(prev => [...prev, item]);
      },
      budget: async (data: Omit<BudgetItem, 'id' | 'created_at'>) => {
        const item = await db.createBudgetItem(data); setBudgetItems(prev => [...prev, item]);
      },
      todo: async (data: Omit<Todo, 'id' | 'created_at'>) => {
        const item = await db.createTodo(data); setTodos(prev => [item, ...prev]);
      },
      cost: async (data: Omit<CostItem, 'id' | 'created_at'>) => {
        const item = await db.createCostItem(data); setCostItems(prev => [...prev, item]);
      },
      calEvent: async (data: Omit<CalendarEvent, 'id' | 'created_at'>) => {
        const item = await db.createCalendarEvent(data); setCalEvents(prev => [...prev, item]);
      },
    },
    update: {
      room: async (id: number, updates: Partial<Room>) => {
        const item = await db.updateRoom(id, updates); setRooms(prev => prev.map(r => r.id === id ? item : r));
      },
      product: async (id: number, updates: Partial<Product>) => {
        const item = await db.updateProduct(id, updates); setProducts(prev => prev.map(p => p.id === id ? item : p));
      },
      inspiration: async (id: number, updates: Partial<Inspiration>) => {
        const item = await db.updateInspiration(id, updates); setInspirations(prev => prev.map(i => i.id === id ? item : i));
      },
      budget: async (id: number, updates: Partial<BudgetItem>) => {
        const item = await db.updateBudgetItem(id, updates); setBudgetItems(prev => prev.map(b => b.id === id ? item : b));
      },
      todo: async (id: number, updates: Partial<Todo>) => {
        const item = await db.updateTodo(id, updates); setTodos(prev => prev.map(t => t.id === id ? item : t));
      },
      cost: async (id: number, updates: Partial<CostItem>) => {
        const item = await db.updateCostItem(id, updates); setCostItems(prev => prev.map(c => c.id === id ? item : c));
      },
      calEvent: async (id: number, updates: Partial<CalendarEvent>) => {
        const item = await db.updateCalendarEvent(id, updates); setCalEvents(prev => prev.map(e => e.id === id ? item : e));
      },
    },
    delete: {
      room:        async (id: number) => { await db.deleteRoom(id);         setRooms(prev => prev.filter(r => r.id !== id)); },
      inspiration: async (id: number) => { await db.deleteInspiration(id); setInspirations(prev => prev.filter(i => i.id !== id)); },
      product:     async (id: number) => { await db.deleteProduct(id);     setProducts(prev => prev.filter(p => p.id !== id)); },
      palette:     async (id: number) => { await db.deletePalette(id);     setPalettes(prev => prev.filter(p => p.id !== id)); },
      budget:      async (id: number) => { await db.deleteBudgetItem(id);  setBudgetItems(prev => prev.filter(b => b.id !== id)); },
      todo:        async (id: number) => { await db.deleteTodo(id);        setTodos(prev => prev.filter(t => t.id !== id)); },
      cost:        async (id: number) => { await db.deleteCostItem(id);    setCostItems(prev => prev.filter(c => c.id !== id)); },
      calEvent:    async (id: number) => { await db.deleteCalendarEvent(id); setCalEvents(prev => prev.filter(e => e.id !== id)); },
    },
  };

  const activeRoom = rooms.find(r => r.id === activeRoomId);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 300, marginBottom: 8 }}>homebook</div>
          <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Loading your workspace…</div>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
    <CurrencyProvider>
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
      <div className="desktop-sidebar">
        <Sidebar page={page} rooms={rooms} products={products} floorplans={floorplans} onNavigate={navigate} />
      </div>

      <div className="main-content" style={{ flex: 1, overflow: 'auto' }}>
        {loadErrors.length > 0 && (
          <div style={{ background: '#FEF2F0', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 16px', margin: '16px 36px 0', fontSize: 12, color: '#B91C1C' }}>
            <strong>⚠️ Some data failed to load:</strong>
            <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
              {loadErrors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}
        {page === 'dashboard' && (
          <Dashboard rooms={rooms} inspirations={inspirations} products={products} budgetItems={budgetItems} todos={todos} costItems={costItems} calEvents={calEvents} onNavigate={navigate} />
        )}
        {page === 'rooms' && (
          <AllRoomsPage rooms={rooms} floorplans={floorplans} onNavigate={navigate} onAdd={actions.add.room} onUpdate={actions.update.room} onDelete={actions.delete.room} />
        )}
        {page === 'room' && activeRoom && (
          <div key={activeRoom.id}>
          <RoomPage room={activeRoom} rooms={rooms} inspirations={inspirations} products={products} palettes={palettes} budgetItems={budgetItems}
            onAdd={{ inspiration: actions.add.inspiration, product: actions.add.product, palette: actions.add.palette, budget: actions.add.budget }}
            onUpdate={{ inspiration: actions.update.inspiration, product: actions.update.product, budget: actions.update.budget }}
            onDelete={{ inspiration: actions.delete.inspiration, product: actions.delete.product, palette: actions.delete.palette, budget: actions.delete.budget }} />
          </div>
        )}
        {page === 'floorplans' && (
          <FloorplanPage
            floorplans={floorplans}
            rooms={rooms}
            onFloorplanChange={(fp) => setFloorplans(prev => prev.map(f => f.id === fp.id ? fp : f))}
            onRoomCreated={(room) => setRooms(prev => [...prev, room])}
          />
        )}
        {page === 'inspiration' && (
          <AllInspirationPage inspirations={inspirations} rooms={rooms} onAdd={actions.add.inspiration} onUpdate={actions.update.inspiration} onDelete={actions.delete.inspiration} />
        )}
        {page === 'products' && (
          <AllProductsPage products={products} rooms={rooms} onAdd={actions.add.product} onUpdate={actions.update.product} onDelete={actions.delete.product} />
        )}
        {page === 'budget' && (
          <BudgetOverviewPage budgetItems={budgetItems} rooms={rooms} products={products} onAdd={actions.add.budget} onUpdate={actions.update.budget} onDelete={actions.delete.budget} />
        )}
        {page === 'todos' && (
          <TodoPage todos={todos} onAdd={actions.add.todo} onUpdate={actions.update.todo} onDelete={actions.delete.todo} />
        )}
        {page === 'costs' && (
          <CostTrackerPage items={costItems} budgetItems={budgetItems} onAdd={actions.add.cost} onUpdate={actions.update.cost} onDelete={actions.delete.cost} />
        )}
        {page === 'calendar' && (
          <CalendarPage events={calEvents} todos={todos} onAdd={actions.add.calEvent} onUpdate={actions.update.calEvent} onDelete={actions.delete.calEvent} />
        )}
        {page === 'discover' && (
          <DiscoverPage onAddEvent={actions.add.calEvent} />
        )}
      </div>

      <MobileNav page={page} onNavigate={navigate} />
    </div>
    </CurrencyProvider>
    </ToastProvider>
  );
}
