import { describe, expect, it } from "vitest";
import { buildKitchenTicketEscpos, buildTestReceiptEscpos, buildVatTicketEscpos } from "./escpos";
import type { KitchenTicketPayload, VatTicketPayload } from "./types";

const sample: KitchenTicketPayload = {
  storeName: "The Food Stop",
  orderNumber: "H-TEST1234",
  createdAt: "27/05 21:30",
  pickupLabel: "Afhaaltijd: wo 21:30",
  fulfillment: "PICKUP",
  customerName: "Jan",
  customerPhone: "0477123456",
  notes: "Geen ui",
  lines: [
    { quantity: 2, name: "Friet Groot", modifiers: ["Mayo"] },
    { quantity: 1, name: "Bicky", modifiers: [] },
  ],
  totalCents: 1250,
};

describe("buildKitchenTicketEscpos", () => {
  it("bevat ordernummer en cut-commando", () => {
    const buf = buildKitchenTicketEscpos(sample);
    const text = buf.toString("latin1");
    expect(text).toContain("H-TEST1234");
    expect(text).toContain("2x Friet Groot");
    expect(text).toContain("EUR 12,50");
    expect(buf.includes(0x1b)).toBe(true); // ESC init
    expect(buf[buf.length - 3]).toBe(0x1d);
    expect(buf[buf.length - 2]).toBe(0x56);
    expect(buf[buf.length - 1]).toBe(0x00);
  });
});

const vatSample: VatTicketPayload = {
  storeName: "The Food Stop",
  orderNumber: "H-VAT1234",
  createdAt: "27/05/2026 12:00",
  customerName: "Jan",
  vatRatePercent: 6,
  lines: [
    {
      quantity: 2,
      name: "Friet Groot",
      lineTotalInclCents: 1060,
      exclCents: 1000,
      vatCents: 60,
    },
  ],
  totalExclCents: 1000,
  totalVatCents: 60,
  totalInclCents: 1060,
};

describe("buildVatTicketEscpos", () => {
  it("bevat BTW-specificatie", () => {
    const buf = buildVatTicketEscpos(vatSample);
    const text = buf.toString("latin1");
    expect(text).toContain("BTW-BON");
    expect(text).toContain("BTW 6%");
    expect(text).toContain("Subtotaal excl. BTW");
  });
});

describe("buildTestReceiptEscpos", () => {
  it("bevat testbon zonder letterlijke escape-tekens", () => {
    const buf = buildTestReceiptEscpos({
      storeName: "The Food Stop",
      printerName: "EPSON TM-T20",
      printedAt: "27/05/2026 12:00",
    });
    const text = buf.toString("latin1");
    expect(text).toContain("TESTBON");
    expect(text).toContain("EPSON TM-T20");
    expect(text).not.toContain("\\x1B");
    expect(buf[0]).toBe(0x1b);
    expect(buf[1]).toBe(0x40);
    expect(buf[2]).toBe(0x1b);
    expect(buf[3]).toBe(0x64);
    expect(buf[4]).toBe(0x02);
  });
});
