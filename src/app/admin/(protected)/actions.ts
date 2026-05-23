"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/session";
import { slugify } from "@/lib/utils/slug";
import {
  brandSettingsSchema,
  businessSettingsSchema,
  categorySchema,
  closingExceptionSchema,
  openingHourSchema,
  productSchema,
  timeSlotRuleSchema,
} from "@/lib/validations/admin";
import { MULTIPLE_MODIFIER_MAX } from "@/lib/modifiers/selection";
import { FulfillmentType } from "@prisma/client";
import { ensureSlotInstancesForDate } from "@/lib/slots/availability";

function redirectToProductsList(categoryId: string | null) {
  if (categoryId) {
    redirect(`/admin/products?categoryId=${encodeURIComponent(categoryId)}`);
  }
  redirect("/admin/products");
}

function redirectToCategoriesList(openCategoryId?: string) {
  if (openCategoryId) {
    redirect(`/admin/categories?open=${encodeURIComponent(openCategoryId)}`);
  }
  redirect("/admin/categories");
}

async function refreshTodaySlotInstances(tenantId: string) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  await Promise.all(
    [FulfillmentType.PICKUP, FulfillmentType.DELIVERY].map((fulfillment) =>
      ensureSlotInstancesForDate({ tenantId, date: today, fulfillment })
    )
  );
}

async function tenantScope() {
  const admin = await requireAdmin();
  return admin.tenantId;
}

async function nextCategorySortOrder(tenantId: string) {
  const { _max } = await prisma.category.aggregate({
    where: { tenantId },
    _max: { sortOrder: true },
  });
  return (_max.sortOrder ?? -1) + 1;
}

async function nextProductSortOrder(tenantId: string, categoryId: string | null) {
  const { _max } = await prisma.product.aggregate({
    where: { tenantId, categoryId },
    _max: { sortOrder: true },
  });
  return (_max.sortOrder ?? -1) + 1;
}

async function uniqueSlugForModel(
  tenantId: string,
  name: string,
  findClash: (slug: string) => Promise<{ id: string } | null>,
  fallback: string
): Promise<string> {
  const base = slugify(name) || fallback;
  let slug = base;
  let n = 2;
  while (true) {
    const clash = await findClash(slug);
    if (!clash) return slug;
    slug = `${base}-${n}`;
    n += 1;
  }
}

async function uniqueCategorySlug(
  tenantId: string,
  name: string,
  excludeId?: string
): Promise<string> {
  return uniqueSlugForModel(
    tenantId,
    name,
    (slug) =>
      prisma.category.findFirst({
        where: {
          tenantId,
          slug,
          ...(excludeId ? { NOT: { id: excludeId } } : {}),
        },
        select: { id: true },
      }),
    "categorie"
  );
}

async function uniqueProductSlug(
  tenantId: string,
  name: string,
  excludeId?: string
): Promise<string> {
  return uniqueSlugForModel(
    tenantId,
    name,
    (slug) =>
      prisma.product.findFirst({
        where: {
          tenantId,
          slug,
          ...(excludeId ? { NOT: { id: excludeId } } : {}),
        },
        select: { id: true },
      }),
    "product"
  );
}

export async function upsertCategory(formData: FormData) {
  const tenantId = await tenantScope();
  const id = formData.get("id") as string | null;
  const parsed = categorySchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    isActive: formData.get("isActive") === "on",
  });
  const slug = await uniqueCategorySlug(tenantId, parsed.name, id ?? undefined);
  const data = {
    name: parsed.name,
    description: parsed.description ?? null,
    isActive: parsed.isActive,
    slug,
  };

  if (id) {
    await prisma.category.updateMany({
      where: { id, tenantId },
      data,
    });
  } else {
    const created = await prisma.category.create({
      data: {
        tenantId,
        ...data,
        sortOrder: await nextCategorySortOrder(tenantId),
      },
    });
    revalidatePath("/admin/categories");
    revalidatePath("/");
    redirectToCategoriesList(created.id);
  }
  revalidatePath("/admin/categories");
  revalidatePath("/");
  redirectToCategoriesList(id ?? undefined);
}

export async function deleteCategory(formData: FormData) {
  const tenantId = await tenantScope();
  const id = formData.get("id") as string;
  await prisma.category.deleteMany({ where: { id, tenantId } });
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function reorderCategories(orderedIds: string[]) {
  const tenantId = await tenantScope();
  if (orderedIds.length === 0) return;

  const existing = await prisma.category.findMany({
    where: { tenantId, id: { in: orderedIds } },
    select: { id: true },
  });
  if (existing.length !== orderedIds.length) {
    throw new Error("Ongeldige categorieën");
  }

  await prisma.$transaction(
    orderedIds.map((id, sortOrder) =>
      prisma.category.update({ where: { id }, data: { sortOrder } })
    )
  );

  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function reorderProducts(categoryId: string | null, orderedIds: string[]) {
  const tenantId = await tenantScope();
  if (orderedIds.length === 0) return;

  const existing = await prisma.product.findMany({
    where: {
      tenantId,
      id: { in: orderedIds },
      categoryId: categoryId ?? null,
    },
    select: { id: true },
  });
  if (existing.length !== orderedIds.length) {
    throw new Error("Ongeldige producten");
  }

  await prisma.$transaction(
    orderedIds.map((id, sortOrder) =>
      prisma.product.update({ where: { id }, data: { sortOrder } })
    )
  );

  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function upsertProduct(formData: FormData) {
  const tenantId = await tenantScope();
  const id = formData.get("id") as string | null;
  const parsed = productSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    imageUrl: formData.get("imageUrl") || "",
    categoryId: formData.get("categoryId"),
    priceCents: Math.round(Number(formData.get("priceEuro")) * 100),
  });
  const slug = await uniqueProductSlug(tenantId, parsed.name, id ?? undefined);
  const categoryId = parsed.categoryId || null;

  let isAvailable = true;
  if (id) {
    const existing = await prisma.product.findFirst({
      where: { id, tenantId },
      select: { isAvailable: true },
    });
    isAvailable = existing?.isAvailable ?? true;
  }

  const data = {
    name: parsed.name,
    slug,
    description: parsed.description,
    imageUrl: parsed.imageUrl || null,
    categoryId,
    priceCents: parsed.priceCents,
    isActive: true,
    isAvailable,
  };

  if (id) {
    await prisma.product.updateMany({ where: { id, tenantId }, data });
  } else {
    await prisma.product.create({
      data: {
        tenantId,
        ...data,
        sortOrder: await nextProductSortOrder(tenantId, categoryId),
      },
    });
  }
  revalidatePath("/admin/products");
  revalidatePath("/");
  redirectToProductsList(categoryId);
}

export async function toggleProductAvailable(formData: FormData) {
  const tenantId = await tenantScope();
  const id = formData.get("id") as string;
  const available = formData.get("available") === "true";

  await prisma.product.updateMany({
    where: { id, tenantId },
    data: { isAvailable: available, isActive: true },
  });
  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function deleteProduct(formData: FormData) {
  const tenantId = await tenantScope();
  const id = formData.get("id") as string;
  await prisma.product.deleteMany({ where: { id, tenantId } });
  revalidatePath("/admin/products");
  revalidatePath("/");
}

function parseModifierMaxSelections(formData: FormData): number {
  const allowMultiple = formData.get("allowMultiple") === "on";
  return allowMultiple ? MULTIPLE_MODIFIER_MAX : 1;
}

export async function addCategoryModifierGroup(formData: FormData) {
  const tenantId = await tenantScope();
  const categoryId = formData.get("categoryId") as string;
  const name = (formData.get("name") as string)?.trim();
  if (!name) return;

  const category = await prisma.category.findFirst({ where: { id: categoryId, tenantId } });
  if (!category) return;

  const maxSelections = parseModifierMaxSelections(formData);
  const isRequired = formData.get("isRequired") === "on";

  await prisma.categoryModifierGroup.create({
    data: {
      categoryId,
      name,
      maxSelections,
      isRequired,
      minSelections: isRequired ? 1 : 0,
    },
  });
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/");
  redirectToCategoriesList(categoryId);
}

export async function updateCategoryModifierGroup(formData: FormData) {
  const tenantId = await tenantScope();
  const id = formData.get("id") as string;
  const categoryId = formData.get("categoryId") as string;
  const name = (formData.get("name") as string)?.trim();
  if (!id || !name) return;

  const group = await prisma.categoryModifierGroup.findFirst({
    where: { id, categoryId, category: { tenantId } },
  });
  if (!group) return;

  const maxSelections = parseModifierMaxSelections(formData);
  const isRequired = formData.get("isRequired") === "on";

  await prisma.categoryModifierGroup.update({
    where: { id },
    data: {
      name,
      maxSelections,
      isRequired,
      minSelections: isRequired ? 1 : 0,
    },
  });
  revalidatePath("/admin/categories");
  revalidatePath("/");
  redirectToCategoriesList(categoryId);
}

export async function addCategoryModifierOption(formData: FormData) {
  const tenantId = await tenantScope();
  const groupId = formData.get("groupId") as string;
  const name = (formData.get("name") as string)?.trim();
  const priceCents = Math.round(Number(formData.get("priceEuro")) * 100);

  const group = await prisma.categoryModifierGroup.findFirst({
    where: { id: groupId, category: { tenantId } },
  });
  if (!group || !name) return;

  await prisma.categoryModifierOption.create({
    data: { groupId, name, priceCents },
  });
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function deleteCategoryModifierGroup(formData: FormData) {
  const tenantId = await tenantScope();
  const id = formData.get("id") as string;
  await prisma.categoryModifierGroup.deleteMany({
    where: { id, category: { tenantId } },
  });
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function deleteCategoryModifierOption(formData: FormData) {
  const tenantId = await tenantScope();
  const id = formData.get("id") as string;
  await prisma.categoryModifierOption.deleteMany({
    where: { id, group: { category: { tenantId } } },
  });
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function saveOpeningHour(formData: FormData) {
  const tenantId = await tenantScope();
  const dayOfWeek = Number(formData.get("dayOfWeek"));
  const isClosed = formData.get("isClosed") === "on";
  let openTime = formData.get("openTime");
  let closeTime = formData.get("closeTime");

  if (openTime == null || closeTime == null) {
    const existing = await prisma.openingHour.findUnique({
      where: { tenantId_dayOfWeek: { tenantId, dayOfWeek } },
    });
    openTime = openTime ?? existing?.openTime ?? "11:00";
    closeTime = closeTime ?? existing?.closeTime ?? "22:00";
  }

  const parsed = openingHourSchema.parse({
    dayOfWeek,
    openTime,
    closeTime,
    isClosed,
  });

  await prisma.openingHour.upsert({
    where: {
      tenantId_dayOfWeek: { tenantId, dayOfWeek: parsed.dayOfWeek },
    },
    create: { tenantId, ...parsed },
    update: parsed,
  });
  revalidatePath("/admin/hours");
}

export async function addClosingException(formData: FormData) {
  const tenantId = await tenantScope();
  const parsed = closingExceptionSchema.parse({
    date: formData.get("date"),
    reason: formData.get("reason") || undefined,
    isClosed: formData.get("isClosed") === "on",
  });

  await prisma.closingException.upsert({
    where: {
      tenantId_date: {
        tenantId,
        date: new Date(parsed.date),
      },
    },
    create: {
      tenantId,
      date: new Date(parsed.date),
      reason: parsed.reason,
      isClosed: parsed.isClosed,
    },
    update: {
      reason: parsed.reason,
      isClosed: parsed.isClosed,
    },
  });
  revalidatePath("/admin/hours");
}

export async function deleteClosingException(formData: FormData) {
  const tenantId = await tenantScope();
  const id = formData.get("id") as string;
  await prisma.closingException.deleteMany({ where: { id, tenantId } });
  revalidatePath("/admin/hours");
}

export async function upsertTimeSlotRule(formData: FormData) {
  const tenantId = await tenantScope();
  const parsed = timeSlotRuleSchema.parse({
    fulfillment: formData.get("fulfillment"),
    dayOfWeek: null,
    startTime: formData.get("startTime") || "11:00",
    endTime: formData.get("endTime") || "22:00",
    intervalMinutes: formData.get("intervalMinutes"),
    maxOrders: formData.get("maxOrders"),
    isActive: formData.get("isActive") === "on",
  });

  const data = {
    fulfillment: parsed.fulfillment,
    dayOfWeek: null,
    startTime: parsed.startTime,
    endTime: parsed.endTime,
    intervalMinutes: parsed.intervalMinutes,
    maxOrders: parsed.maxOrders,
    isActive: parsed.isActive,
  };

  const existing = await prisma.timeSlotRule.findFirst({
    where: { tenantId, fulfillment: parsed.fulfillment },
    orderBy: { id: "asc" },
  });

  if (existing) {
    await prisma.timeSlotRule.update({ where: { id: existing.id }, data });
    await prisma.timeSlotRule.deleteMany({
      where: { tenantId, fulfillment: parsed.fulfillment, id: { not: existing.id } },
    });
  } else {
    await prisma.timeSlotRule.create({ data: { tenantId, ...data } });
  }

  await refreshTodaySlotInstances(tenantId);
  revalidatePath("/admin/slots");
  revalidatePath("/");
}

export async function toggleSlotBlocked(formData: FormData) {
  const tenantId = await tenantScope();
  const id = formData.get("id") as string;
  const blocked = formData.get("blocked") === "true";
  await prisma.timeSlotInstance.updateMany({
    where: { id, tenantId },
    data: { isBlocked: blocked },
  });
  revalidatePath("/admin/slots");
}

export async function saveBrandSettings(formData: FormData) {
  const tenantId = await tenantScope();
  const parsed = brandSettingsSchema.parse({
    displayName: formData.get("displayName"),
    primaryColor: formData.get("primaryColor"),
    logoUrl: formData.get("logoUrl") || "",
  });

  await prisma.brandSettings.upsert({
    where: { tenantId },
    create: {
      tenantId,
      displayName: parsed.displayName,
      primaryColor: parsed.primaryColor,
      logoUrl: parsed.logoUrl || null,
    },
    update: {
      displayName: parsed.displayName,
      primaryColor: parsed.primaryColor,
      logoUrl: parsed.logoUrl || null,
    },
  });
  revalidatePath("/admin/settings");
  revalidatePath("/");
}

export async function saveBusinessSettings(formData: FormData) {
  const tenantId = await tenantScope();
  const rawKey = String(formData.get("mollieApiKey") ?? "").trim();
  const clearKey = formData.get("clearMollieApiKey") === "on";

  const requireOnlinePayment = formData.get("requireOnlinePayment") === "on";
  const providerRaw = formData.get("paymentProvider");
  const paymentProvider =
    providerRaw === "MOLLIE" || providerRaw === "MANUAL"
      ? providerRaw
      : requireOnlinePayment
        ? "MOLLIE"
        : "MANUAL";

  const parsed = businessSettingsSchema.parse({
    pickupEnabled: formData.get("pickupEnabled") === "on",
    deliveryEnabled: formData.get("deliveryEnabled") === "on",
    minOrderCents: Math.round(Number(formData.get("minOrderEuro")) * 100),
    orderLeadMinutes: formData.get("orderLeadMinutes"),
    slotIntervalMinutes: formData.get("slotIntervalMinutes"),
    onlinePaymentsEnabled: formData.get("onlinePaymentsEnabled") === "on",
    requireOnlinePayment,
    paymentProvider,
    mollieApiKey: rawKey || undefined,
  });

  const existing = await prisma.businessSettings.findUnique({
    where: { tenantId },
    select: { mollieApiKey: true },
  });

  let mollieApiKey: string | null = existing?.mollieApiKey ?? null;
  if (clearKey) mollieApiKey = null;
  else if (rawKey) mollieApiKey = rawKey;

  const { mollieApiKey: _mollieFromForm, ...rest } = parsed;
  void _mollieFromForm;

  await prisma.businessSettings.upsert({
    where: { tenantId },
    create: { tenantId, ...rest, mollieApiKey },
    update: { ...rest, mollieApiKey },
  });
  revalidatePath("/admin/settings");
  revalidatePath("/checkout");
}
