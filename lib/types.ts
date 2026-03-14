export type Room = {
  id: number;
  name: string;
  description: string;
  emoji: string;
  color: string;
  created_at: string;
};

export type Inspiration = {
  id: number;
  image_url: string;
  source_url: string;
  source_name: string;
  room_id: number;
  tags: string[];
  notes: string;
  created_at: string;
};

export type Product = {
  id: number;
  name: string;
  store: string;
  url: string;
  image: string;
  price: number;
  room_id: number;
  status: 'Idea' | 'Considering' | 'Buying' | 'Purchased';
  notes: string;
  created_at: string;
};

export type ColourPalette = {
  id: number;
  name: string;
  colours: string[];
  notes: string;
  room_id: number;
  created_at: string;
};

export type BudgetItem = {
  id: number;
  name: string;
  category: string;
  estimated_price: number;
  actual_price: number | null;
  room_id: number;
  purchased: boolean;
  created_at: string;
};

export type MoodboardItem = {
  id: string;
  type: 'image' | 'color' | 'text';
  x: number;
  y: number;
  w: number;
  h: number;
  room_id: number;
  src?: string;
  color?: string;
  text?: string;
  label?: string;
};

export type FloorplanRoom = {
  id: string;
  room_id: number | null;
  room_name: string;
  points: { x: number; y: number }[];
  color: string;
};

export type Floorplan = {
  id: number;
  name: string;
  image_url: string;
  rooms: FloorplanRoom[];
  created_at: string;
};

export type TodoCategory =
  | 'Tax & Legal'
  | 'Installation'
  | 'Interior Design'
  | 'Admin'
  | 'Delivery'
  | 'Appointment'
  | 'Other';

export type TodoPriority = 'Low' | 'Medium' | 'High';

export type Todo = {
  id: number;
  title: string;
  description: string;
  category: TodoCategory;
  priority: TodoPriority;
  due_date: string | null;
  done: boolean;
  created_at: string;
};

export type CostCategory =
  | 'Purchase Price'
  | 'IMT'
  | 'Imposto de Selo'
  | 'IMI'
  | 'Notary & Registry'
  | 'Legal Fees'
  | 'Mortgage'
  | 'Condominium'
  | 'Insurance'
  | 'Renovation'
  | 'Other';

export type CostItem = {
  id: number;
  name: string;
  category: CostCategory;
  amount: number;
  date: string | null;
  notes: string;
  recurring: boolean;
  recurring_period: 'monthly' | 'yearly' | null;
  created_at: string;
};

export type EventType =
  | 'Delivery'
  | 'Appointment'
  | 'Tax Deadline'
  | 'Task'
  | 'Other';

export type CalendarEvent = {
  id: number;
  title: string;
  date: string;
  time: string | null;
  type: EventType;
  notes: string;
  linked_todo_id: number | null;
  created_at: string;
};
