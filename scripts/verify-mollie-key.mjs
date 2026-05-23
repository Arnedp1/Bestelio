/**
 * Test of MOLLIE_API_KEY of admin-key geldig is.
 * Usage: node scripts/verify-mollie-key.mjs [test_xxx]
 */
const key = process.argv[2]?.trim() || process.env.MOLLIE_API_KEY?.trim();

if (!key) {
  console.error("Geen key. Gebruik: node scripts/verify-mollie-key.mjs test_…");
  process.exit(1);
}

const res = await fetch("https://api.mollie.com/v2/methods?amount[currency]=EUR&amount[value]=10.00", {
  headers: { Authorization: `Bearer ${key}` },
});

const data = await res.json().catch(() => ({}));

if (!res.ok) {
  console.error("Mollie API fout:", res.status, data.detail ?? data.title ?? data);
  process.exit(1);
}

const count = data._embedded?.methods?.length ?? 0;
console.log("OK — Mollie API-key werkt.");
console.log(`Beschikbare betaalmethoden (voorbeeld €10): ${count}`);
if (count === 0) {
  console.warn(
    "Geen methoden — activeer iDEAL/creditcard in Mollie Dashboard → Instellingen → Websiteprofielen."
  );
}
