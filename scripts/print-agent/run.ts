/**
 * Lokale print-agent voor ESC/POS bonprinters (Windows).
 *
 * Vereist in .env (project root of hier):
 *   PRINT_AGENT_SECRET=... (zelfde als in Next.js .env)
 *   PRINT_AGENT_API_URL=http://localhost:3000
 *   PRINTER_NAME=exacte Windows-printernaam
 *
 * Start: npm run print:agent
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ThermalPrinter, PrinterTypes } from "node-thermal-printer";

function loadRootEnv() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
  const envPath = resolve(root, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (process.env[key]) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadRootEnv();

const API_URL = (process.env.PRINT_AGENT_API_URL ?? "http://localhost:3000").replace(
  /\/$/,
  ""
);
const SECRET = process.env.PRINT_AGENT_SECRET ?? "";
const PRINTER_NAME = process.env.PRINTER_NAME ?? "";
const POLL_MS = Number(process.env.PRINT_AGENT_POLL_MS ?? "3000");
const TENANT_ID = process.env.PRINT_AGENT_TENANT_ID?.trim();

if (!SECRET || SECRET.length < 16) {
  console.error("PRINT_AGENT_SECRET ontbreekt of is te kort (min. 16 tekens).");
  process.exit(1);
}

if (!PRINTER_NAME) {
  console.error("PRINTER_NAME ontbreekt. Zet de exacte Windows-printernaam in .env.");
  process.exit(1);
}

const headers = {
  "x-print-agent-key": SECRET,
  "Content-Type": "application/json",
};

async function patchJob(id: string, status: "PRINTING" | "DONE" | "FAILED", error?: string) {
  await fetch(`${API_URL}/api/admin/print-jobs/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ status, error }),
  });
}

async function printBuffer(base64: string) {
  const buffer = Buffer.from(base64, "base64");
  const printer = new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: `printer:${PRINTER_NAME}`,
    width: 48,
    characterSet: "PC858_EURO",
    removeSpecialCharacters: false,
    lineCharacter: "-",
  });

  await printer.raw(buffer);
}

async function poll() {
  const qs = new URLSearchParams({ limit: "5" });
  if (TENANT_ID) qs.set("tenantId", TENANT_ID);

  const res = await fetch(`${API_URL}/api/admin/print-jobs/pending?${qs}`, { headers });
  if (!res.ok) {
    console.error(`Poll mislukt (${res.status})`);
    return;
  }

  const data = (await res.json()) as {
    jobs: { id: string; escposBase64: string | null; payload?: { orderNumber?: string } }[];
  };

  for (const job of data.jobs) {
    const label = job.payload?.orderNumber ?? job.id;
    try {
      await patchJob(job.id, "PRINTING");
      if (!job.escposBase64) {
        throw new Error("Geen printdata");
      }
      await printBuffer(job.escposBase64);
      await patchJob(job.id, "DONE");
      console.log(`[ok] ${label}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Onbekende fout";
      await patchJob(job.id, "FAILED", msg);
      console.error(`[fail] ${label}: ${msg}`);
    }
  }
}

console.log(`Print-agent actief → ${API_URL} | printer: ${PRINTER_NAME}`);
void poll();
setInterval(() => {
  void poll();
}, POLL_MS);
