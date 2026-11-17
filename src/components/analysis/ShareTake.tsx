/** Share a take's measurements (no audio) as a link, for a guru to open. */
import React, { useState } from "react";
import type { TakeMeasurements } from "../../analysis/summary";
import type { PitchTrack } from "../../analysis/types";
import { Share2 } from "lucide-react";
import { toast } from "../shell/Toaster";
import { useUi } from "../../i18n/ui";
import { encodeTake, shareUrl, summariseForShare } from "../../lib/shareTake";

export const ShareTake: React.FC<{ m: TakeMeasurements; track: PitchTrack; raagName: string; allowedSwaras: number[] }> = ({ m, track, raagName, allowedSwaras }) => {
  const u = useUi();
  const [link, setLink] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const make = async () => {
    const url = shareUrl(await encodeTake(summariseForShare(m, track, raagName.replace(/^Raag\s+/i, ""), allowedSwaras)));
    setLink(url);
    try {
      if (navigator.share) { await navigator.share({ title: `Riyaz in ${raagName}`, text: "My riyaz, measured by Naad AI", url }); setStatus("Shared."); return; }
    } catch { /* cancelled; fall back to copying */ }
    try { await navigator.clipboard.writeText(url); setStatus("Paste it in a message to your guru."); toast(u("linkCopied")); }
    catch { setStatus("Copy the link below and send it to your guru."); }
  };

  return (
    <section className="rg">
      <div className="tr-share">
        <div>
          <h3 className="rg-h">{u("shareH")}</h3>
          <p className="rg-muted">{u("shareP")}</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => void make()}><Share2 size={16} aria-hidden /> {u("shareBtn")}</button>
      </div>
      {status && <p className="rg-muted" role="status">{status}</p>}
      {link && <input className="sh-link" readOnly value={link} onFocus={e => e.currentTarget.select()} aria-label="Share link" />}
    </section>
  );
};
