/// <reference lib="webworker" />
/** Runs analyseRecording off the main thread. */
import { analyseRecording, type AnalyseRequest } from "./analyseRecording";

self.onmessage = (e: MessageEvent<AnalyseRequest>) => {
  try {
    (self as unknown as Worker).postMessage({ ok: true, result: analyseRecording(e.data) });
  } catch (err: any) {
    (self as unknown as Worker).postMessage({ ok: false, error: String(err?.message || err) });
  }
};
