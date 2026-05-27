export type KitchenTicketLine = {
  quantity: number;
  name: string;
  modifiers: string[];
};

export type KitchenTicketPayload = {
  storeName: string;
  orderNumber: string;
  createdAt: string;
  pickupLabel: string;
  fulfillment: "PICKUP" | "DELIVERY";
  customerName: string;
  customerPhone: string;
  customerAddress?: string | null;
  notes?: string | null;
  lines: KitchenTicketLine[];
  totalCents: number;
};

export type VatTicketLine = {
  quantity: number;
  name: string;
  lineTotalInclCents: number;
  exclCents: number;
  vatCents: number;
};

export type VatTicketPayload = {
  storeName: string;
  orderNumber: string;
  createdAt: string;
  customerName: string;
  vatRatePercent: number;
  lines: VatTicketLine[];
  totalExclCents: number;
  totalVatCents: number;
  totalInclCents: number;
};
