/* =====================================
   CareCompass — Toast notifications
=====================================
   Lightweight replacement for the shadcn/radix toast used in the
   workspace. Same API surface:

     import { toast } from "@/hooks/use-toast";
     toast({ title: "Saved", description: "Draft updated." });

   Mount <Toaster /> once (already done in App.jsx) to render them.
   Desktop: stacked bottom-right, slide-in from the bottom.
   Mobile:  stacked top, slide-in from the top.
===================================== */

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";
import "./Toaster.css";

let toastId = 0;
let memoryToasts = [];
const listeners = new Set();

const TOAST_LIMIT = 3;
const TOAST_DURATION = 5000;

function emitChange() {
  listeners.forEach((l) => l(memoryToasts));
}

export function toast({ title, description, variant, duration }) {
  toastId += 1;
  const id = toastId;
  memoryToasts = [...memoryToasts, { id, title, description, variant, open: true }];
  /* Keep the newest N toasts, drop the oldest. */
  if (memoryToasts.length > TOAST_LIMIT) {
    memoryToasts = memoryToasts.slice(memoryToasts.length - TOAST_LIMIT);
  }
  emitChange();

  window.setTimeout(() => dismissToast(id), duration || TOAST_DURATION);
  return { id, dismiss: () => dismissToast(id) };
}

export function dismissToast(id) {
  memoryToasts = memoryToasts.map((t) => (t.id === id ? { ...t, open: false } : t));
  emitChange();
  /* Give the exit animation time to play, then remove. */
  window.setTimeout(() => {
    memoryToasts = memoryToasts.filter((t) => t.id !== id);
    emitChange();
  }, 260);
}

export function useToastState() {
  const [toasts, setToasts] = useState(memoryToasts);
  useEffect(() => {
    listeners.add(setToasts);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);
  return toasts;
}

export function Toaster() {
  const toasts = useToastState();

  return (
    <div className="ui-toast-viewport" role="region" aria-label="Notifications">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "ui-toast",
            t.open ? "ui-toast-open" : "ui-toast-closed",
            t.variant === "destructive" && "ui-toast-destructive"
          )}
        >
          <div className="ui-toast-body">
            {t.title && <p className="ui-toast-title">{t.title}</p>}
            {t.description && (
              <p className="ui-toast-description">{t.description}</p>
            )}
          </div>
          <button
            className="ui-toast-close"
            aria-label="Dismiss notification"
            onClick={() => dismissToast(t.id)}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

export default Toaster;
