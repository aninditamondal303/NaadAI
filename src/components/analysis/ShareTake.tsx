/** Share a take's measurements (no audio) as a link, for a guru to open. */
import React, { useState } from "react";
import type { TakeMeasurements } from "../../analysis/summary";
import type { PitchTrack } from "../../analysis/types";
import { encodeTake, shareUrl, summariseForShare } from "../../lib/shareTake";

export const ShareTake: React.FC<{ m: TakeMeasurements; track: PitchTrack; raagName: string; allowedSwaras: number[] }> = ({ m, track, raagName, allowedSwaras }) => {
  const [link, setLink] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const make = async () => {
    const url = shareUrl(await encodeTake(summariseForShare(m, track, raagName.replace(/^Raag\s+/i, ""), allowedSwaras)));
    setLink(url);
    try {
      if (navigator.share) { await navigator.share({ title: `Riyaz in ${raagName}`, text: "My riyaz, measured by Naad AI", url }); setStatus("Shared."); return; }
    } catch { /* cancelled; fall back to copying */ }
    try { await navigator.clipboard.writeText(url); setStatus("Link copied. Paste it in a message to your guru."); }
    catch { setStatus("Copy the link below and send it to your guru."); }
  };

  return (
    <section className="rg">
      <div className="lb-head">
        <h3 className="rg-h">Share with your guru</h3>
        <button type="button" className="rz-link" onClick={() => void make()}>Make a share link</button>
      </div>
      <p className="rg-muted">The link holds the measurements and your pitch line, not the recording. Nothing is uploaded: everything is inside the link itself.</p>
      {status && <p className="rg-muted" role="status">{status}</p>}
      {link && <input className="sh-link" readOnly value={link} onFocus={e => e.currentTarget.select()} aria-label="Share link" />}
    </section>
  );
};
