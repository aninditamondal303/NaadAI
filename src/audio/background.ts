/**
 * Keeps the tanpura and tabla sounding when the phone's screen locks or the
 * app goes to the background, and shows play/pause on the lock screen.
 *
 * Phones suspend Web Audio for hidden pages unless a media element is
 * playing. So the sound is also sent into an <audio> element (started by the
 * user's tap, which browsers require). While the page is visible the sound
 * goes straight to the speakers, which keeps timing tight; when it is hidden
 * the same sound goes through the media element instead.
 */
export interface BackgroundMeta {
  title: string;
  artist?: string;
  onPlay?: () => void;
  onPause?: () => void;
}

export class BackgroundAudio {
  private direct: GainNode;
  private viaElement: GainNode | null = null;
  private el: HTMLAudioElement | null = null;
  private active = false;
  private onVis = () => this.route();

  constructor(private ctx: AudioContext, input: AudioNode) {
    this.direct = ctx.createGain();
    input.connect(this.direct);
    this.direct.connect(ctx.destination);
    try {
      if (typeof document === "undefined" || !("createMediaStreamDestination" in ctx)) return;
      const dest = ctx.createMediaStreamDestination();
      this.viaElement = ctx.createGain();
      this.viaElement.gain.value = 0;
      input.connect(this.viaElement);
      this.viaElement.connect(dest);
      const el = document.createElement("audio");
      el.srcObject = dest.stream;
      el.setAttribute("playsinline", "");
      this.el = el;
    } catch {
      this.viaElement = null;
      this.el = null;
    }
  }

  /** Call from a tap handler when sound starts. */
  activate(meta: BackgroundMeta) {
    this.active = true;
    this.el?.play().catch(() => { /* not allowed: sound still plays while visible */ });
    document.addEventListener("visibilitychange", this.onVis);
    this.route();
    const ms = typeof navigator !== "undefined" ? navigator.mediaSession : undefined;
    if (!ms) return;
    try {
      const base = import.meta.env.BASE_URL ?? "/";
      ms.metadata = new MediaMetadata({
        title: meta.title,
        artist: meta.artist ?? "Naad AI",
        artwork: [{ src: `${base}icon-512.png`, sizes: "512x512", type: "image/png" }],
      });
      ms.playbackState = "playing";
      ms.setActionHandler("play", meta.onPlay ? () => meta.onPlay!() : null);
      ms.setActionHandler("pause", meta.onPause ? () => meta.onPause!() : null);
      ms.setActionHandler("stop", meta.onPause ? () => meta.onPause!() : null);
    } catch { /* media session not available */ }
  }

  /** Call when all sound has stopped. */
  deactivate() {
    this.active = false;
    document.removeEventListener("visibilitychange", this.onVis);
    this.el?.pause();
    this.route();
    try { if (navigator.mediaSession) navigator.mediaSession.playbackState = "paused"; } catch { /* ignore */ }
  }

  private route() {
    const hidden = typeof document !== "undefined" && document.visibilityState === "hidden";
    const useElement = this.active && hidden && !!this.viaElement;
    const t = this.ctx.currentTime;
    this.direct.gain.setTargetAtTime(useElement ? 0 : 1, t, 0.02);
    this.viaElement?.gain.setTargetAtTime(useElement ? 1 : 0, t, 0.02);
    if (this.active && this.ctx.state === "suspended") void this.ctx.resume();
  }

  dispose() {
    this.deactivate();
    try { this.direct.disconnect(); this.viaElement?.disconnect(); } catch { /* already */ }
    if (this.el) this.el.srcObject = null;
  }
}
