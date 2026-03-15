'use client';
import Icon from './Icon';

export default function Modal({ title, onClose, children }: {
  title: string;
  onClose: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* wrapper centres the modal and handles scroll */}
      <div
        className="modal-wrapper"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="modal">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 500 }}>{title}</h2>
            <button className="btn btn-ghost" style={{ padding: '4px 8px', flexShrink: 0 }} onClick={onClose}>
              <Icon name="x" size={16} />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
