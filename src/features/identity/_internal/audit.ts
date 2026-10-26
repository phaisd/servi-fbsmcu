import type { Prisma } from "@/generated/prisma";
import { prisma, type Db } from "@/shared/lib/infra/prisma";

export interface AuditEntry {
  tenantId: string;
  actorId: string | null;
  action: string;
  entity: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
}

export async function writeAudit(entry: AuditEntry, db: Db = prisma): Promise<void> {
  await db.auditLog.create({
    data: {
      tenantId: entry.tenantId, actorId: entry.actorId, action: entry.action, entity: entry.entity, entityId: entry.entityId,
      before: entry.before === undefined ? undefined : (entry.before as object), after: entry.after === undefined ? undefined : (entry.after as object), ip: entry.ip ?? null,
    },
  });
}

export interface GetAuditLogsOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  entity?: string;
  action?: string;
  fromDate?: string;
  toDate?: string;
}

export async function getAuditLogs(
  tenantId: string,
  options: GetAuditLogsOptions = {},
  db: Db = prisma
) {
  const page = Math.max(1, options.page || 1);
  const pageSize = Math.min(100, Math.max(10, options.pageSize || 25));
  const skip = (page - 1) * pageSize;

  const where: Prisma.AuditLogWhereInput = { tenantId };

  if (options.entity && options.entity !== "ALL") {
    where.entity = options.entity;
  }

  if (options.action && options.action !== "ALL") {
    where.action = { contains: options.action, mode: "insensitive" };
  }

  if (options.fromDate || options.toDate) {
    where.createdAt = {};
    if (options.fromDate) {
      where.createdAt.gte = new Date(options.fromDate);
    }
    if (options.toDate) {
      const end = new Date(options.toDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  if (options.search && options.search.trim()) {
    const q = options.search.trim();
    where.OR = [
      { action: { contains: q, mode: "insensitive" } },
      { entity: { contains: q, mode: "insensitive" } },
      { entityId: { contains: q, mode: "insensitive" } },
      { actor: { name: { contains: q, mode: "insensitive" } } },
      { actor: { email: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [total, items, distinctEntities] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.findMany({
      where,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    db.auditLog.findMany({
      where: { tenantId },
      select: { entity: true },
      distinct: ["entity"],
    }),
  ]);

  // สถิติภาพรวม
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [todayCount, createCount, updateCount, deleteCount, totalAll] = await Promise.all([
    db.auditLog.count({
      where: { tenantId, createdAt: { gte: todayStart } },
    }),
    db.auditLog.count({
      where: { tenantId, action: { contains: "create", mode: "insensitive" } },
    }),
    db.auditLog.count({
      where: { tenantId, action: { contains: "update", mode: "insensitive" } },
    }),
    db.auditLog.count({
      where: { tenantId, action: { contains: "delete", mode: "insensitive" } },
    }),
    db.auditLog.count({ where: { tenantId } }),
  ]);

  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
    entities: distinctEntities.map((e) => e.entity).filter(Boolean),
    stats: {
      totalAll,
      todayCount,
      createCount,
      updateCount,
      deleteCount,
    },
  };
}

export type AuditLogQueryResult = Awaited<ReturnType<typeof getAuditLogs>>;
