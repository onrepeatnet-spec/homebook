'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import Dashboard from '@/components/Dashboard';
import AllRoomsPage from '@/components/pages/AllRoomsPage';
import RoomPage from '@/components/pages/RoomPage';
import AllInspirationPage from '@/components/pages/AllInspirationPage';
import AllProductsPage from '@/components/pages/AllProductsPage';
import BudgetOverviewPage from '@/components/pages/BudgetOverviewPage';
import FloorplanPage from '@/components/pages/FloorplanPage';
import TodoPage from '@/components/pages/TodoPage';
import CostTrackerPage from '@/components/pages/CostTrackerPage';
import CalendarPage from '@/components/pages/CalendarPage';
import * as db from '@/lib/db';
import type { Room, Inspiration, Product, ColourPalette, BudgetItem, Floorplan, Todo, CostItem, CalendarEvent } from '@/lib/types';

export type Page = 'dashboard' | 'rooms' | 'room' | 'floorplans' | 'inspiration' | 'products' | 'budget' | 'todos' | 'costs' | 'calendar';

export default function Home() {
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

  useEffect(() => {
    async function load() {
      try {
        const [r, i, p, pal, b, fp, td, ci, ce] = await Promise.all([
          db.getRooms(), db.getInspirations(), db.getProducts(),
          db.getPalettes(), db.getBudgetItems(), db.getFloorplans(),
          db.getTodos(), db.getCostItems(), db.getCalendarEvents(),
        ]);
        setRooms(r); setInspirations(i); setProducts(p);
        setPalettes(pal); setBudgetItems(b); setFloorplans(fp);
        setTodos(td); setCostItems(ci); setCalEvents(ce);
      } catch (e) { console.error('Failed to load data:', e); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const navigate = (p: Page, roomId?: number) => {
    setPage(p);
    if (roomId) setActiveRoomId(roomId);
  };

  const reloadRooms = async () => setRooms(await db.getRooms());

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
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
      <div className="desktop-sidebar">
        <Sidebar page={page} rooms={rooms} products={products} onNavigate={navigate} />
      </div>

      <div className="main-content" style={{ flex: 1, overflow: 'auto' }}>
        {page === 'dashboard' && (
          <Dashboard rooms={rooms} inspirations={inspirations} products={products} budgetItems={budgetItems} onNavigate={navigate} />
        )}
        {page === 'rooms' && (
          <AllRoomsPage rooms={rooms} onNavigate={navigate} onAdd={actions.add.room} onUpdate={actions.update.room} />
        )}
        {page === 'room' && activeRoom && (
          <RoomPage room={activeRoom} inspirations={inspirations} products={products} palettes={palettes} budgetItems={budgetItems}
            onAdd={actions.add} onUpdate={actions.update} onDelete={actions.delete} />
        )}
        {page === 'floorplans' && (
          <FloorplanPage floorplans={floorplans} rooms={rooms} onRoomsChange={reloadRooms} />
        )}
        {page === 'inspiration' && (
          <AllInspirationPage inspirations={inspirations} rooms={rooms} onAdd={actions.add.inspiration} onDelete={actions.delete.inspiration} />
        )}
        {page === 'products' && (
          <AllProductsPage products={products} rooms={rooms} onAdd={actions.add.product} onUpdate={actions.update.product} onDelete={actions.delete.product} />
        )}
        {page === 'budget' && (
          <BudgetOverviewPage budgetItems={budgetItems} rooms={rooms} onAdd={actions.add.budget} onUpdate={actions.update.budget} onDelete={actions.delete.budget} />
        )}
        {page === 'todos' && (
          <TodoPage todos={todos} onAdd={actions.add.todo} onUpdate={actions.update.todo} onDelete={actions.delete.todo} />
        )}
        {page === 'costs' && (
          <CostTrackerPage items={costItems} onAdd={actions.add.cost} onUpdate={actions.update.cost} onDelete={actions.delete.cost} />
        )}
        {page === 'calendar' && (
          <CalendarPage events={calEvents} todos={todos} onAdd={actions.add.calEvent} onUpdate={actions.update.calEvent} onDelete={actions.delete.calEvent} />
        )}
      </div>

      <MobileNav page={page} onNavigate={navigate} />
    </div>
  );
}
