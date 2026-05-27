"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type PrintJob = {
  id: string;
  orderId: string;
  orderNumber: string;
  escposBase64: string;
};

type QzLike = {
  websocket: {
    connect: (options?: Record<string, unknown>) => Promise<void>;
    isActive: () => boolean;
  };
  security: {
    setCertificatePromise: (fn: () => Promise<string>) => void;
    setSignaturePromise: (fn: (toSign: string) => Promise<string>) => void;
    setSignatureAlgorithm?: (algorithm: string) => void;
  };
  printers: { find: () => Promise<string[] | string> };
  configs: { create: (printer: string, options?: Record<string, unknown>) => unknown };
  print: (config: unknown, data: unknown[]) => Promise<void>;
};

declare global {
  interface Window {
    qz?: QzLike;
  }
}

const STORAGE_KEY = "kitchen-printer-name";
const TRIGGER_PRINT_EVENT = "kitchen-print-now";
const PRINTER_CHANGED_EVENT = "kitchen-printer-changed";

function base64ToHex(base64: string): string {
  const binary = atob(base64);
  let hex = "";
  for (let i = 0; i < binary.length; i += 1) {
    hex += binary.charCodeAt(i).toString(16).padStart(2, "0");
  }
  return hex;
}

export function QzAutoPrint({
  showControls = true,
  showStatus = true,
}: {
  showControls?: boolean;
  showStatus?: boolean;
}) {
  const connectSocket = useCallback(async (qz: QzLike) => {
    if (qz.websocket.isActive()) return;
    try {
      await qz.websocket.connect({ usingSecure: true });
      return;
    } catch {
      await qz.websocket.connect({ usingSecure: false });
    }
  }, []);

  const [ready, setReady] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [autoPrinting, setAutoPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [printers, setPrinters] = useState<string[]>([]);
  const [printerName, setPrinterName] = useState<string>("");
  const [storageLoaded, setStorageLoaded] = useState(false);
  const lock = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setPrinterName(saved);
    setStorageLoaded(true);
  }, []);

  useEffect(() => {
    if (!printerName) return;
    localStorage.setItem(STORAGE_KEY, printerName);
    window.dispatchEvent(
      new CustomEvent<string>(PRINTER_CHANGED_EVENT, {
        detail: printerName,
      })
    );
  }, [printerName]);

  useEffect(() => {
    const onPrinterChanged = (event: Event) => {
      const next = (event as CustomEvent<string>).detail;
      if (!next || next === printerName) return;
      setPrinterName(next);
    };
    window.addEventListener(PRINTER_CHANGED_EVENT, onPrinterChanged);
    return () => window.removeEventListener(PRINTER_CHANGED_EVENT, onPrinterChanged);
  }, [printerName]);

  const ensureQzLoaded = useCallback(async (): Promise<QzLike> => {
    if (window.qz) return window.qz;
    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>('script[data-qz="tray"]');
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("QZ Tray script laden mislukt")), {
          once: true,
        });
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/qz-tray@2.2.4/qz-tray.js";
      script.async = true;
      script.dataset.qz = "tray";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("QZ Tray script laden mislukt"));
      document.head.appendChild(script);
    });
    if (!window.qz) throw new Error("QZ Tray niet gevonden");
    return window.qz;
  }, []);

  const connectAndLoadPrinters = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const qz = await ensureQzLoaded();
      qz.security.setSignatureAlgorithm?.("SHA512");
      qz.security.setCertificatePromise(async () => {
        const res = await fetch("/api/admin/print/qz/certificate");
        const data = (await res.json()) as { ok?: boolean; certificate?: string; error?: string };
        if (!res.ok || !data.certificate) {
          throw new Error(data.error ?? "QZ certificaat niet ingesteld.");
        }
        return data.certificate;
      });
      qz.security.setSignaturePromise(async (toSign: string) => {
        const res = await fetch("/api/admin/print/qz/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: toSign }),
        });
        const data = (await res.json()) as { ok?: boolean; signature?: string; error?: string };
        if (!res.ok || !data.signature) {
          throw new Error(data.error ?? "QZ signature mislukt.");
        }
        return data.signature;
      });
      await connectSocket(qz);
      const found = await qz.printers.find();
      const list = Array.isArray(found) ? found : [found];
      setPrinters(list);
      if (!printerName && list[0]) setPrinterName(list[0]);
      setReady(true);
    } catch (e) {
      setReady(false);
      setError(
        e instanceof Error
          ? `QZ verbinden mislukt: ${e.message}`
          : "QZ Tray verbinden mislukt"
      );
    } finally {
      setConnecting(false);
    }
  }, [connectSocket, ensureQzLoaded, printerName]);

  const claimNextJob = useCallback(async (): Promise<PrintJob | null> => {
    const res = await fetch("/api/admin/print-jobs/browser/next", { method: "POST" });
    if (!res.ok) return null;
    const data = (await res.json()) as { job: PrintJob | null };
    return data.job;
  }, []);

  const completeJob = useCallback(async (jobId: string, success: boolean, err?: string) => {
    await fetch("/api/admin/print-jobs/browser/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, success, error: err }),
    });
  }, []);

  const printEscposBase64 = useCallback(
    async (qz: QzLike, escposBase64: string) => {
      const cfg = qz.configs.create(printerName);
      const payload = [{ type: "raw", format: "hex", data: base64ToHex(escposBase64) }];
      await qz.print(cfg, payload);
    },
    [printerName]
  );

  const printPendingQueue = useCallback(async () => {
    if (!ready || !printerName || lock.current) return;
    lock.current = true;
    let processedAnyJob = false;
    try {
      const qz = await ensureQzLoaded();
      await connectSocket(qz);

      while (true) {
        const job = await claimNextJob();
        if (!job) break;
        if (!processedAnyJob) {
          processedAnyJob = true;
          setAutoPrinting(true);
        }
        try {
          await printEscposBase64(qz, job.escposBase64);
          await completeJob(job.id, true);
        } catch (e) {
          await completeJob(job.id, false, e instanceof Error ? e.message : "QZ print error");
        }
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? `Automatisch printen mislukt: ${e.message}`
          : "Automatisch printen mislukt"
      );
    } finally {
      if (processedAnyJob) {
        setAutoPrinting(false);
      }
      lock.current = false;
    }
  }, [claimNextJob, completeJob, connectSocket, ensureQzLoaded, printEscposBase64, printerName, ready]);

  const testPrint = useCallback(async () => {
    if (!printerName) {
      setError("Kies eerst een printer.");
      return;
    }
    try {
      const res = await fetch("/api/admin/print/test-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ printerName }),
      });
      const data = (await res.json()) as { ok?: boolean; escposBase64?: string; error?: string };
      if (!res.ok || !data.escposBase64) {
        throw new Error(data.error ?? "Testbon kon niet worden gemaakt.");
      }
      const qz = await ensureQzLoaded();
      await connectSocket(qz);
      await printEscposBase64(qz, data.escposBase64);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? `Testprint mislukt: ${e.message}` : "Testprint mislukt");
    }
  }, [connectSocket, ensureQzLoaded, printEscposBase64, printerName]);

  useEffect(() => {
    if (!storageLoaded) return;
    void connectAndLoadPrinters();
  }, [connectAndLoadPrinters, storageLoaded]);

  useEffect(() => {
    if (!ready || !printerName) return;
    void printPendingQueue();
    const id = window.setInterval(() => {
      void printPendingQueue();
    }, 3000);
    return () => window.clearInterval(id);
  }, [printPendingQueue, printerName, ready]);

  useEffect(() => {
    const onManualTrigger = () => {
      void printPendingQueue();
    };
    window.addEventListener(TRIGGER_PRINT_EVENT, onManualTrigger);
    return () => window.removeEventListener(TRIGGER_PRINT_EVENT, onManualTrigger);
  }, [printPendingQueue]);

  const status = useMemo(() => {
    if (connecting) return "QZ verbinden…";
    if (!ready) return "QZ offline";
    if (autoPrinting) return "Auto-print actief";
    return "QZ verbonden";
  }, [autoPrinting, connecting, ready]);

  if (!showControls && !showStatus && !error) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs text-stone-600">
      {showStatus ? <span>{status}</span> : null}
      {showControls ? (
        <>
          <select
            value={printerName}
            onChange={(e) => setPrinterName(e.target.value)}
            className="rounded border border-stone-300 bg-white px-2 py-1 text-xs"
          >
            <option value="">Kies printer…</option>
            {printers.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void connectAndLoadPrinters()}
            className="rounded border border-stone-300 bg-white px-2 py-1 font-semibold text-stone-700"
          >
            Herverbinden
          </button>
          <button
            type="button"
            onClick={() => void testPrint()}
            className="rounded border border-orange-300 bg-orange-50 px-2 py-1 font-semibold text-orange-700"
          >
            Testprint
          </button>
        </>
      ) : null}
      {error && <span className="text-red-600">{error}</span>}
    </div>
  );
}

