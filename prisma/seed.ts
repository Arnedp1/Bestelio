import { PrismaClient, FulfillmentType, PaymentProvider } from "@prisma/client";
import bcrypt from "bcryptjs";
import { importCategoryModifiersForTenant } from "./import-category-modifiers";
import { SEED_BRAND, SEED_CATEGORIES } from "./seed-data";
import { imageUrlForProduct } from "./product-images";

const prisma = new PrismaClient();

async function resetCatalog(tenantId: string) {
  await prisma.categoryModifierOption.deleteMany({
    where: { group: { category: { tenantId } } },
  });
  await prisma.categoryModifierGroup.deleteMany({
    where: { category: { tenantId } },
  });
  await prisma.product.deleteMany({ where: { tenantId } });
  await prisma.category.deleteMany({ where: { tenantId } });
}

async function main() {
  const host = process.env.DEFAULT_TENANT_HOST ?? "localhost";
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@demo.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "demo-admin-change-me";
  const simulate = process.env.PAYMENT_SIMULATE === "true";
  const hasMollieKey = Boolean(process.env.MOLLIE_API_KEY?.trim());
  const enableOnlinePayments = simulate || hasMollieKey;

  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo-frituur" },
    update: { name: "The Food Stop" },
    create: {
      slug: "demo-frituur",
      name: "The Food Stop",
      domains: { create: [{ hostname: host, isPrimary: true }] },
      brandSettings: {
        create: {
          displayName: SEED_BRAND.displayName,
          primaryColor: SEED_BRAND.primaryColor,
        },
      },
      businessSettings: {
        create: {
          pickupEnabled: true,
          deliveryEnabled: true,
          minOrderCents: 500,
          slotIntervalMinutes: 15,
          orderLeadMinutes: 25,
          onlinePaymentsEnabled: false,
          paymentProvider: PaymentProvider.MANUAL,
        },
      },
    },
  });

  await prisma.brandSettings.upsert({
    where: { tenantId: tenant.id },
    update: {
      displayName: SEED_BRAND.displayName,
      primaryColor: SEED_BRAND.primaryColor,
    },
    create: {
      tenantId: tenant.id,
      displayName: SEED_BRAND.displayName,
      primaryColor: SEED_BRAND.primaryColor,
    },
  });

  await prisma.businessSettings.upsert({
    where: { tenantId: tenant.id },
    update: enableOnlinePayments
      ? {
          onlinePaymentsEnabled: true,
          paymentProvider: PaymentProvider.MOLLIE,
        }
      : {},
    create: {
      tenantId: tenant.id,
      pickupEnabled: true,
      deliveryEnabled: true,
      minOrderCents: 500,
      slotIntervalMinutes: 15,
      orderLeadMinutes: 25,
      onlinePaymentsEnabled: enableOnlinePayments,
      paymentProvider: enableOnlinePayments
        ? PaymentProvider.MOLLIE
        : PaymentProvider.MANUAL,
    },
  });

  const localHosts = Array.from(
    new Set([host, "localhost", "127.0.0.1"].map((h) => h.toLowerCase()))
  );
  for (const hostname of localHosts) {
    await prisma.tenantDomain.upsert({
      where: { hostname },
      update: { tenantId: tenant.id },
      create: {
        hostname,
        tenantId: tenant.id,
        isPrimary: hostname === host.toLowerCase(),
      },
    });
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.tenantUser.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: adminEmail } },
    update: { passwordHash },
    create: {
      tenantId: tenant.id,
      email: adminEmail,
      passwordHash,
      name: "Beheerder",
      role: "OWNER",
    },
  });

  for (let day = 0; day <= 6; day++) {
    const isSunday = day === 0;
    await prisma.openingHour.upsert({
      where: { tenantId_dayOfWeek: { tenantId: tenant.id, dayOfWeek: day } },
      update: {
        openTime: isSunday ? "12:00" : "11:00",
        closeTime: isSunday ? "21:00" : "22:30",
        isClosed: false,
      },
      create: {
        tenantId: tenant.id,
        dayOfWeek: day,
        openTime: isSunday ? "12:00" : "11:00",
        closeTime: isSunday ? "21:00" : "22:30",
        isClosed: false,
      },
    });
  }

  await prisma.timeSlotRule.deleteMany({ where: { tenantId: tenant.id } });
  for (const fulfillment of [FulfillmentType.PICKUP, FulfillmentType.DELIVERY]) {
    await prisma.timeSlotRule.create({
      data: {
        tenantId: tenant.id,
        fulfillment,
        dayOfWeek: null,
        startTime: "11:00",
        endTime: "22:00",
        intervalMinutes: 15,
        // Slotbudget in centen (omzet), niet aantal bestellingen.
        maxOrders: fulfillment === FulfillmentType.PICKUP ? 20000 : 12000,
      },
    });
  }

  await resetCatalog(tenant.id);

  let productCount = 0;
  for (const cat of SEED_CATEGORIES) {
    const category = await prisma.category.create({
      data: {
        tenantId: tenant.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        sortOrder: cat.sortOrder,
      },
    });

    for (const p of cat.products) {
      await prisma.product.create({
        data: {
          tenantId: tenant.id,
          categoryId: category.id,
          name: p.name,
          slug: p.slug,
          description: p.description || null,
          imageUrl: imageUrlForProduct(),
          priceCents: p.priceCents,
          sortOrder: p.sortOrder,
        },
      });
      productCount++;
    }
  }

  const { applied: modifierCategories, skipped: modifierSkipped } =
    await importCategoryModifiersForTenant(tenant.id);

  console.log("Seed OK:", {
    tenant: tenant.slug,
    host,
    categories: SEED_CATEGORIES.length,
    products: productCount,
    modifierCategories,
    modifierSkipped: modifierSkipped.length > 0 ? modifierSkipped : undefined,
    adminEmail,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
