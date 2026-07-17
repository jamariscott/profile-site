import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

type ToastVariant = "success" | "error" | "info";
interface ToastItem { id: number; message: string; variant: ToastVariant; }

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_STYLES: Record<ToastVariant, { border: string; icon: ReactNode }> = {
  success: { border: "border-success/40", icon: <CheckCircle2 size={18} className="text-success shrink-0" /> },
  error: { border: "border-danger/40", icon: <XCircle size={18} className="text-danger shrink-0" /> },
  info: { border: "border-line", icon: <Info size={18} className="text-muted shrink-0" /> },
};

/** Global toast notifications, replacing scattered alert() calls. Auto-dismiss after 4s, or click to close early. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message: string, variant: ToastVariant) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  const value: ToastContextValue = {
    success: useCallback((message: string) => show(message, "success"), [show]),
    error: useCallback((message: string) => show(message, "error"), [show]),
    info: useCallback((message: string) => show(message, "info"), [show]),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map((t) => {
          const style = VARIANT_STYLES[t.variant];
          return (
            <div
              key={t.id}
              onClick={() => dismiss(t.id)}
              style={{ animation: "toast-in 0.2s ease-out" }}
              className={`pointer-events-auto flex items-start gap-2.5 max-w-sm w-full sm:w-auto px-4 py-3 rounded-btn border ${style.border} bg-surface text-text shadow-card text-sm cursor-pointer`}
            >
              {style.icon}
              <span className="flex-1 whitespace-pre-wrap">{t.message}</span>
              <X size={16} className="text-subtle shrink-0 mt-0.5" />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}
