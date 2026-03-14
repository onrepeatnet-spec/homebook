'use client';
import ProductsTab from '@/components/ProductsTab';
import type { Product, Room } from '@/lib/types';

export default function AllProductsPage({ products, rooms, onAdd, onUpdate, onDelete }: {
  products: Product[];
  rooms?: Room[];
  onAdd: (p: Omit<Product, 'id' | 'created_at'>) => Promise<void>;
  onUpdate: (id: number, updates: Partial<Product>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  return (
    <div style={{ padding: '32px 36px' }} className="animate-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 38, fontWeight: 300 }}>Products</h1>
        <p style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 4 }}>All furniture, lighting & decor</p>
      </div>
      <ProductsTab
        products={products}
        roomId={null}
        allRooms={rooms}
        onAdd={onAdd}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    </div>
  );
}
