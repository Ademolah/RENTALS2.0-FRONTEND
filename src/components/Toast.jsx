import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const TONES = {
  success: { icon: CheckCircle2, cls: 'text-status-available' },
  error: { icon: AlertCircle, cls: 'text-brand-primary' },
  info: { icon: Info, cls: 'text-blue-400' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback((message, tone = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((t) => [...t.slice(-3), { id, message, tone }]);
    setTimeout(() => dismiss(id), 4500);
  }, [dismiss]);

  const api = useMemo(() => ({
    show: push,
    success: (m) => push(m, 'success'),
    error: (m) => push(m, 'error'),
    info: (m) => push(m, 'info'),
  }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100001] flex flex-col gap-3 w-[min(92vw,26rem)] pointer-events-none">
        {toasts.map((t) => {
          const { icon: Icon, cls } = TONES[t.tone] || TONES.info;
          return (
            <div key={t.id} role="status" className="pointer-events-auto flex items-start gap-3 bg-brand-dark text-white px-5 py-4 rounded-2xl shadow-elevated animate-fade-up">
              <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${cls}`} />
              <p className="flex-1 text-base font-medium leading-snug">{t.message}</p>
              <button aria-label="Dismiss" onClick={() => dismiss(t.id)} className="text-white/60 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- useToast is imported by many files and tests, so it stays beside the provider
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { show() {}, success() {}, error() {}, info() {} };
  return ctx;
}
