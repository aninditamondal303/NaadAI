/** Shared microphone hook and level meter for the Analyzer modes. */
import React, { useEffect, useRef, useState } from 'react';
import { MicSession } from '../../audio/mic';

/** One microphone session per component; closed automatically on unmount. */
export function useMic() {
  const ref = useRef<MicSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const open = async () => {
    setError(null);
    if (ref.current) return ref.current;
    try {
      ref.current = await MicSession.open();
      return ref.current;
    } catch (e: any) {
      setError(e?.name === "NotAllowedError"
        ? "Microphone permission was denied. Please allow microphone access in your browser and try again."
        : `Couldn't open the microphone: ${e?.message || e}`);
      return null;
    }
  };
  const close = async () => {
    const m = ref.current;
    ref.current = null;
    if (m) await m.close();
  };
  useEffect(() => () => { void close(); }, []);
  return { open, close, error, session: ref };
}

export const LevelMeter: React.FC<{ level: number }> = ({ level }) => {
  // dBFS from -60 to 0 mapped to 0..100%
  const db = level > 0 ? 20 * Math.log10(level) : -100;
  const pct = Math.max(0, Math.min(100, ((db + 60) / 60) * 100));
  return (
    <div className="w-full max-w-md h-2 rounded-full bg-slate-900 overflow-hidden" title={`${db.toFixed(0)} dB`}>
      <div className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 transition-[width] duration-75" style={{ width: `${pct}%` }} />
    </div>
  );
};

