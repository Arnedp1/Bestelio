/**
 * Snelle E2E-check: winkelmand → checkout (simulate) → betaling bevestigen
 * Run: node scripts/test-payment-flow.mjs
 */
const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Host: "localhost",
      ...(options.headers ?? {}),
    },
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { ok: res.ok, status: res.status, json, cookies: res.headers.getSetCookie?.() ?? [] };
}

async function main() {
  console.log("1. Payment status …");
  const status = await req("/api/payments/status");
  console.log(status.ok ? "   OK" : "   FAIL", status.json);

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  const tenant = await prisma.tenant.findFirst({ where: { slug: "demo-frituur" } });
  const product = await prisma.product.findFirst({
    where: { tenantId: tenant.id, isAvailable: true, isActive: true },
  });
  const settings = await prisma.businessSettings.findUnique({
    where: { tenantId: tenant.id },
  });
  await prisma.$disconnect();

  if (!product) throw new Error("Geen product in DB");
  console.log("2. Settings:", {
    onlinePaymentsEnabled: settings?.onlinePaymentsEnabled,
    paymentProvider: settings?.paymentProvider,
  });

  let cookie = "";

  console.log("3. Product in mand …");
  const cartRes = await fetch(`${BASE}/api/cart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Host: "localhost",
      Cookie: cookie,
    },
    body: JSON.stringify({ productId: product.id, quantity: 1, modifierOptionIds: [] }),
  });
  const setCookie = cartRes.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";")[0];
  if (!cartRes.ok) throw new Error(`Cart failed: ${cartRes.status}`);

  console.log("4. Tijdslot …");
  const today = new Date().toISOString().slice(0, 10);
  const slotsRes = await fetch(
    `${BASE}/api/slots/available?fulfillment=PICKUP&date=${today}`,
    { headers: { Host: "localhost", Cookie: cookie } }
  );
  const slotsData = await slotsRes.json();
  const slotId = slotsData.slots?.[0]?.id;
  if (!slotId) throw new Error("Geen tijdslot beschikbaar");

  console.log("5. Checkout (online betalen) …");
  const checkoutRes = await fetch(`${BASE}/api/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Host: "localhost",
      Cookie: cookie,
    },
    body: JSON.stringify({
      customerName: "Test Klant",
      customerPhone: "0470123456",
      fulfillment: "PICKUP",
      timeSlotInstanceId: slotId,
      payOnline: true,
    }),
  });
  const checkout = await checkoutRes.json();
  if (!checkoutRes.ok) {
    console.error("   Checkout mislukt:", checkout);
    process.exit(1);
  }
  console.log("   orderId:", checkout.orderId);
  console.log("   checkoutUrl:", checkout.checkoutUrl);

  if (!checkout.checkoutUrl?.includes("payment=simulated")) {
    console.warn("   Waarschuwing: geen simulate-URL (Mollie-modus?)");
  }

  console.log("6. Betaling bevestigen …");
  const confirmRes = await fetch(`${BASE}/api/payments/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Host: "localhost" },
    body: JSON.stringify({ orderId: checkout.orderId }),
  });
  const confirm = await confirmRes.json();
  console.log("   status:", confirm.status);

  if (confirm.status !== "PAID") {
    console.error("   FAIL: verwacht PAID");
    process.exit(1);
  }

  console.log("\n✓ Betalingsflow OK (simulate)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
