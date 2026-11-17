/** A small (i) button that shows a short explanation in a popover. */
import React, { useEffect, useId, useRef, useState } from "react";
import { Info } from "lucide-react";

export const InfoTip: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const off = (e: Event) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", off);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", off); document.removeEventListener("keydown", key); };
  }, [open]);
  return (
    <span className="it" ref={ref}>
      <button type="button" className="it-btn" aria-label={label} aria-expanded={open} aria-controls={id} onClick={() => setOpen(o => !o)}>
        <Info size={16} strokeWidth={1.9} aria-hidden />
      </button>
      {open && <span id={id} role="note" className="it-pop">{children}</span>}
    </span>
  );
};
