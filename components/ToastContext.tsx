'use client';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';

type ToastType = 'error' | 'success' | 'info';

type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastContextType = {
  showError: (msg: string) => void;
  showSuccess: (msg: string) => void;
  showInfo: (msg: string) => void;
};

const ToastContext = createContext<ToastContextType>({
  showError: () => {},
  showSuccess: () => {},
  showInfo: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

let counter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = useCallback((message: string, type: ToastType) => {
    const id = ++counter;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const showError   = useCallback((msg: string) => add(msg, 'error'),   [add]);
  const showSuccess = useCallback((msg: string) => add(msg, 'success'), [add]);
  const showInfo    = useCallback((msg: string) => add(msg, 'info'),    [add]);

  const dismiss = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ showError, showSuccess, showInfo }}>
      {children}

      {/* Toast stack */}
      {toasts.length > 0 && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          display: 'flex', flexDirection: 'column', gap: 10,
          maxWidth: 380, pointerEvents: 'none',
        }}>
          {toasts.map(toast => (
            <ToastItem key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const bg: Record<ToastType, string> = {
    error:   '#C0503A',
    success: '#4A7C6F',
    info:    '#6B7FA8',
  };
  const icon: Record<ToastType, string> = {
    error:   '⚠️',
    success: '✓',
    info:    'ℹ',
  };

  return (
    <div
      onClick={onDismiss}
      style={{
        background: bg[toast.type],
        color: 'white',
        padding: '12px 16px',
        borderRadius: 10,
        fontSize: 13,
        fontFamily: 'DM Sans, sans-serif',
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        display: 'flex', alignItems: 'flex-start', gap: 10,
        cursor: 'pointer',
        pointerEvents: 'all',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
        maxWidth: 380,
        lineHeight: 1.5,
      }}>
      <span style={{ flexShrink: 0, fontSize: 15 }}>{icon[toast.type]}</span>
      <span style={{ flex: 1 }}>{toast.message}</span>
      <span style={{ flexShrink: 0, opacity: 0.7, fontSize: 11, marginTop: 2 }}>✕</span>
    </div>
  );
}
