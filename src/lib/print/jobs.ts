import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { KitchenTicketPayload, VatTicketPayload } from "./types";

export type PrintJobType = "KITCHEN" | "VAT_TICKET";

type PrintJobRow = {
  id: string;
  tenantId: string;
  orderId: string;
  type: PrintJobType;
  status: "PENDING" | "PRINTING" | "DONE" | "FAILED";
  payload: unknown;
  createdAt: Date;
};

export async function insertPrintJob(
  tenantId: string,
  orderId: string,
  type: PrintJobType,
  payload: KitchenTicketPayload | VatTicketPayload
): Promise<string> {
  const id = randomUUID();
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    INSERT INTO "PrintJob" ("id", "tenantId", "orderId", "type", "status", "payload", "attempts", "createdAt")
    VALUES (${id}, ${tenantId}, ${orderId}, ${type}::"PrintJobType", 'PENDING', ${JSON.stringify(payload)}::jsonb, 0, NOW())
    RETURNING "id"
  `;
  return rows[0]?.id ?? "";
}

export async function insertKitchenPrintJob(
  tenantId: string,
  orderId: string,
  payload: KitchenTicketPayload
): Promise<string> {
  return insertPrintJob(tenantId, orderId, "KITCHEN", payload);
}

export async function insertVatPrintJob(
  tenantId: string,
  orderId: string,
  payload: VatTicketPayload
): Promise<string> {
  return insertPrintJob(tenantId, orderId, "VAT_TICKET", payload);
}

export async function listPendingPrintJobs(limit: number, tenantId?: string): Promise<PrintJobRow[]> {
  if (tenantId) {
    return prisma.$queryRaw<PrintJobRow[]>`
      SELECT "id", "tenantId", "orderId", "type", "status", "payload", "createdAt"
      FROM "PrintJob"
      WHERE "status" = 'PENDING' AND "tenantId" = ${tenantId}
      ORDER BY "createdAt" ASC
      LIMIT ${limit}
    `;
  }
  return prisma.$queryRaw<PrintJobRow[]>`
    SELECT "id", "tenantId", "orderId", "type", "status", "payload", "createdAt"
    FROM "PrintJob"
    WHERE "status" = 'PENDING'
    ORDER BY "createdAt" ASC
    LIMIT ${limit}
  `;
}

export async function claimNextPendingPrintJob(tenantId: string): Promise<PrintJobRow | null> {
  const rows = await prisma.$queryRaw<PrintJobRow[]>`
    WITH candidate AS (
      SELECT "id"
      FROM "PrintJob"
      WHERE "tenantId" = ${tenantId} AND "status" = 'PENDING' AND "type" IN ('KITCHEN', 'VAT_TICKET')
      ORDER BY "createdAt" ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    UPDATE "PrintJob" p
    SET "status" = 'PRINTING',
        "attempts" = p."attempts" + 1,
        "lastError" = NULL
    FROM candidate
    WHERE p."id" = candidate."id"
    RETURNING p."id", p."tenantId", p."orderId", p."type", p."status", p."payload", p."createdAt"
  `;
  return rows[0] ?? null;
}

export async function markPrintJobDone(jobId: string) {
  await prisma.$executeRaw`
    UPDATE "PrintJob"
    SET "status" = 'DONE', "printedAt" = NOW(), "lastError" = NULL
    WHERE "id" = ${jobId}
  `;
}

export async function markPrintJobFailed(jobId: string, error: string) {
  await prisma.$executeRaw`
    UPDATE "PrintJob"
    SET "status" = 'FAILED', "lastError" = ${error}
    WHERE "id" = ${jobId}
  `;
}

export async function markPrintJobPrinting(jobId: string) {
  await prisma.$executeRaw`
    UPDATE "PrintJob"
    SET "status" = 'PRINTING', "attempts" = "attempts" + 1, "lastError" = NULL
    WHERE "id" = ${jobId}
  `;
}

export async function getPrintJobByTenant(jobId: string, tenantId: string): Promise<{ id: string } | null> {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT "id"
    FROM "PrintJob"
    WHERE "id" = ${jobId} AND "tenantId" = ${tenantId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}
