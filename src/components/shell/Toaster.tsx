/** Short confirmations ("Saved", "Added to calendar") shown at the bottom of the screen. */
import React, { useEffect, useState } from "react";
import { Check } from "lucide-react";

const EVT = "naad:toast";
export function toast(message: string) {
  window.dispatchEvent(new CustomEvent(EVT, { detail: message }));
  try { navigator.vibrate?.(12); } catch { /* not supported */ }
}

export const Toaster: React.FC = () => {
  const [items, setItems] = useState<{ id: number; text: string }[]>([]);
  useEffect(() => {
    const on = (e: Event) => {
      const id = Date.now() + Math.random();
      setItems(list => [...list.slice(-2), { id, text: (e as CustomEvent<string>).detail }]);
      window.setTimeout(() => setItems(list => list.filter(i => i.id !== id)), 2800);
    };
    window.addEventListener(EVT, on);
    return () => window.removeEventListener(EVT, on);
  }, []);
  return (
    <div className="ts-wrap" role="status" aria-live="polite">
      {items.map(i => <div key={i.id} className="ts"><Check size={16} aria-hidden />{i.text}</div>)}
    </div>
  );
};
