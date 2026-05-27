import { z } from "zod";
import { hhMmSchema } from "./time";

export const categorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isActive: z.coerce.boolean(),
});

export const productSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  categoryId: z.string().cuid().optional().or(z.literal("")),
  priceCents: z.coerce.number().int().min(0),
});

export const openingHourSchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  openTime: hhMmSchema,
  closeTime: hhMmSchema,
  isClosed: z.coerce.boolean(),
});

export const closingExceptionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().max(200).optional(),
  isClosed: z.coerce.boolean(),
});

export const timeSlotRuleSchema = z.object({
  fulfillment: z.enum(["PICKUP", "DELIVERY"]),
  dayOfWeek: z.coerce.number().int().min(0).max(6).optional().nullable(),
  startTime: hhMmSchema,
  endTime: hhMmSchema,
  intervalMinutes: z.coerce.number().int().min(5).max(120),
  maxRevenueCents: z.coerce.number().int().min(100).max(2_000_000),
  isActive: z.coerce.boolean(),
});

export const brandSettingsSchema = z.object({
  displayName: z.string().min(1).max(100),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  logoUrl: z.string().url().optional().or(z.literal("")),
});

export const businessSettingsSchema = z
  .object({
    pickupEnabled: z.coerce.boolean(),
    deliveryEnabled: z.coerce.boolean(),
    minOrderCents: z.coerce.number().int().min(0),
    orderLeadMinutes: z.coerce.number().int().min(0).max(240),
    slotIntervalMinutes: z.coerce.number().int().min(5).max(120),
    onlinePaymentsEnabled: z.coerce.boolean(),
    requireOnlinePayment: z.coerce.boolean(),
    paymentProvider: z.enum(["MANUAL", "MOLLIE"]),
  mollieApiKey: z
    .string()
    .max(200)
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined))
    .refine(
      (val) => !val || val.startsWith("test_") || val.startsWith("live_"),
      "API-key moet beginnen met test_ of live_"
    ),
  })
  .transform((data) => {
    if (!data.requireOnlinePayment) return data;
    return {
      ...data,
      onlinePaymentsEnabled: true,
      paymentProvider: "MOLLIE" as const,
    };
  });
