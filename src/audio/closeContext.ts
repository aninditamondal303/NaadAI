/** Close an AudioContext once; closing an already-closed one is ignored. */
export function closeContext(ctx: BaseAudioContext | null | undefined): void {
  const c = ctx as AudioContext | null | undefined;
  if (!c || c.state === "closed") return;
  c.close().catch(() => { /* already closing */ });
}
