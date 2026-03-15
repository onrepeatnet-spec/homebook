'use client';
import Icon from './Icon';
import type { Page } from '@/app/page';

const NAV = [
  { id: 'dashboard',   label: 'Home',     icon: 'sparkles'    as const },
  { id: 'rooms',       label: 'Rooms',    icon: 'room'        as const },
  { id: 'inspiration', label: 'Inspo',    icon: 'image'       as const },
  { id: 'todos',       label: 'To-Do',    icon: 'check'       as const },
  { id: 'calendar',    label: 'Calendar', icon: 'fileText'    as const },
];

export default function MobileNav({ page, onNavigate }: { page: Page; onNavigate: (p: Page) => void }) {
  return (
    <nav className="mobile-nav">
      {NAV.map(item => (
        <button key={item.id} className={`mobile-nav-item ${page === item.id ? 'active' : ''}`}
          onClick={() => onNavigate(item.id as Page)}>
          <Icon name={item.icon} size={20} />
          {item.label}
        </button>
      ))}
    </nav>
  );
}
