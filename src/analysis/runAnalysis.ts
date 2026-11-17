/** Run analyseRecording in a Web Worker when available, otherwise on the page. */
import { analyseRecording, type AnalyseRequest, type AnalyseResult } from "./analyseRecording";

export function runAnalysis(req: AnalyseRequest): Promise<AnalyseResult> {
  if (typeof Worker === "undefined") return Promise.resolve(analyseRecording(req));
  return new Promise((resolve, reject) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL("./analysis.worker.ts", import.meta.url), { type: "module" });
    } catch {
      resolve(analyseRecording(req));
      return;
    }
    worker.onmessage = (e: MessageEvent<{ ok: boolean; result?: AnalyseResult; error?: string }>) => {
      worker.terminate();
      if (e.data.ok) resolve(e.data.result!);
      else reject(new Error(e.data.error));
    };
    worker.onerror = ev => {
      worker.terminate();
      // fall back to the page if the worker can't start
      try { resolve(analyseRecording(req)); } catch (err) { reject(err instanceof Error ? err : new Error(String(ev.message))); }
    };
    worker.postMessage(req, [req.samples.buffer]);
  });
}
