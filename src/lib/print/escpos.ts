import type { KitchenTicketPayload, VatTicketPayload } from "./types";

/** Strip chars that often break ESC/POS on cheap printers. */
function escposSafe(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E\n\r]/g, "?");
}

function cmd(...bytes: number[]): Buffer {
  return Buffer.from(bytes);
}

function textLine(text: string): Buffer {
  return Buffer.from(`${escposSafe(text)}\n`, "latin1");
}

function separator(char = "-", width = 42): Buffer {
  return textLine(char.repeat(width));
}

function formatMoneyEscpos(cents: number): string {
  return `EUR ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

/** Init printer and a small top feed so the first line is not clipped. */
function beginReceipt(parts: Buffer[]): void {
  parts.push(cmd(0x1b, 0x40)); // ESC @ — init
  parts.push(cmd(0x1b, 0x64, 0x02)); // ESC d — feed 2 lines
}

/** Feed blank lines and cut so the last lines are not clipped by the cutter. */
function appendReceiptFooter(parts: Buffer[]): void {
  parts.push(textLine(""));
  parts.push(cmd(0x1b, 0x64, 0x06)); // ESC d — feed 6 lines
  parts.push(cmd(0x1d, 0x56, 0x00)); // GS V — full cut
}

export type TestReceiptOptions = {
  storeName: string;
  printerName: string;
  printedAt?: string;
};

export function buildTestReceiptEscpos(options: TestReceiptOptions): Buffer {
  const parts: Buffer[] = [];
  const printedAt =
    options.printedAt ??
    new Date().toLocaleString("nl-BE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  beginReceipt(parts);
  parts.push(cmd(0x1b, 0x61, 0x01)); // center
  parts.push(cmd(0x1b, 0x45, 0x01)); // bold on
  parts.push(textLine(options.storeName.toUpperCase()));
  parts.push(textLine("TESTBON"));
  parts.push(cmd(0x1b, 0x45, 0x00)); // bold off
  parts.push(cmd(0x1b, 0x61, 0x00)); // left
  parts.push(separator());
  parts.push(textLine("Printerverbinding OK"));
  parts.push(textLine(`Datum: ${printedAt}`));
  parts.push(textLine(`Printer: ${options.printerName}`));
  parts.push(separator());
  parts.push(textLine("Ziet u deze tekst leesbaar"));
  parts.push(textLine("zonder vreemde tekens erboven,"));
  parts.push(textLine("dan is de bon correct."));
  parts.push(separator());
  appendReceiptFooter(parts);

  return Buffer.concat(parts);
}

export function buildKitchenTicketEscpos(payload: KitchenTicketPayload): Buffer {
  const parts: Buffer[] = [];

  beginReceipt(parts);
  parts.push(cmd(0x1b, 0x61, 0x01)); // center
  parts.push(cmd(0x1b, 0x45, 0x01)); // bold on
  parts.push(textLine(payload.storeName.toUpperCase()));
  parts.push(cmd(0x1b, 0x45, 0x00)); // bold off
  parts.push(textLine("KEUKENBON"));
  parts.push(cmd(0x1b, 0x61, 0x00)); // left
  parts.push(separator());

  parts.push(cmd(0x1b, 0x45, 0x01));
  parts.push(textLine(payload.orderNumber));
  parts.push(cmd(0x1b, 0x45, 0x00));

  parts.push(textLine(payload.pickupLabel));
  parts.push(
    textLine(
      payload.fulfillment === "PICKUP" ? "Afhalen" : `Leveren: ${payload.customerAddress ?? ""}`
    )
  );
  parts.push(textLine(`Klant: ${payload.customerName}`));
  parts.push(textLine(`Tel: ${payload.customerPhone}`));
  parts.push(textLine(`Besteld: ${payload.createdAt}`));
  parts.push(separator());

  for (const line of payload.lines) {
    parts.push(textLine(`${line.quantity}x ${line.name}`));
    for (const mod of line.modifiers) {
      parts.push(textLine(`   + ${mod}`));
    }
  }

  if (payload.notes?.trim()) {
    parts.push(separator());
    parts.push(cmd(0x1b, 0x45, 0x01));
    parts.push(textLine("OPMERKING"));
    parts.push(cmd(0x1b, 0x45, 0x00));
    parts.push(textLine(payload.notes.trim()));
  }

  parts.push(separator());
  parts.push(cmd(0x1b, 0x61, 0x02)); // right
  parts.push(cmd(0x1b, 0x45, 0x01));
  parts.push(textLine(`TOTAAL ${formatMoneyEscpos(payload.totalCents)}`));
  parts.push(cmd(0x1b, 0x45, 0x00));
  parts.push(cmd(0x1b, 0x61, 0x00));

  appendReceiptFooter(parts);

  return Buffer.concat(parts);
}

function padLine(left: string, right: string, width = 42): string {
  const maxLeft = Math.max(1, width - right.length - 1);
  const trimmedLeft = left.length > maxLeft ? `${left.slice(0, maxLeft - 1)}.` : left;
  return `${trimmedLeft}${" ".repeat(Math.max(1, width - trimmedLeft.length - right.length))}${right}`;
}

export function buildVatTicketEscpos(payload: VatTicketPayload): Buffer {
  const parts: Buffer[] = [];

  beginReceipt(parts);
  parts.push(cmd(0x1b, 0x61, 0x01));
  parts.push(cmd(0x1b, 0x45, 0x01));
  parts.push(textLine(payload.storeName.toUpperCase()));
  parts.push(textLine("BTW-BON"));
  parts.push(cmd(0x1b, 0x45, 0x00));
  parts.push(cmd(0x1b, 0x61, 0x00));
  parts.push(separator());

  parts.push(textLine(`Bonnr: ${payload.orderNumber}`));
  parts.push(textLine(`Datum: ${payload.createdAt}`));
  parts.push(textLine(`Klant: ${payload.customerName}`));
  parts.push(separator());

  for (const line of payload.lines) {
    const label = `${line.quantity}x ${line.name}`;
    const right = formatMoneyEscpos(line.lineTotalInclCents).replace("EUR ", "");
    parts.push(textLine(padLine(label, right)));
  }

  parts.push(separator());
  parts.push(
    textLine(padLine("Subtotaal excl. BTW", formatMoneyEscpos(payload.totalExclCents).replace("EUR ", "")))
  );
  parts.push(
    textLine(
      padLine(`BTW ${payload.vatRatePercent}%`, formatMoneyEscpos(payload.totalVatCents).replace("EUR ", ""))
    )
  );
  parts.push(separator());
  parts.push(cmd(0x1b, 0x45, 0x01));
  parts.push(
    textLine(padLine("TOTAAL incl. BTW", formatMoneyEscpos(payload.totalInclCents).replace("EUR ", "")))
  );
  parts.push(cmd(0x1b, 0x45, 0x00));
  parts.push(textLine(""));
  parts.push(textLine(`Alle bedragen in EUR, BTW-tarief ${payload.vatRatePercent}% (BE).`));

  appendReceiptFooter(parts);

  return Buffer.concat(parts);
}
