import "server-only";
import { prisma as db } from "@/shared/lib/infra/prisma";
import { writeAudit } from "@/features/identity/server";
import { DocumentCategory } from "@/generated/prisma";
import type { Prisma } from "@/generated/prisma";

export interface DocumentFilterOptions {
  category?: DocumentCategory;
  search?: string;
  year?: string;
  issuerLevel?: string;
  docType?: string;
}

export async function getAdminDocuments(tenantId: string, filters?: DocumentFilterOptions) {
  const where: Prisma.AdminDocumentWhereInput = { tenantId };
  if (filters?.category) where.category = filters.category;
  if (filters?.year && filters.year !== "ALL") where.year = filters.year;
  if (filters?.issuerLevel && filters.issuerLevel !== "ALL") where.issuerLevel = filters.issuerLevel;
  if (filters?.docType && filters.docType !== "ALL") where.docType = filters.docType;
  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
      { docNumber: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return db.adminDocument.findMany({
    where,
    orderBy: [
      { year: "desc" },
      { createdAt: "desc" },
    ],
  });
}

export async function getPublicDocuments(tenantId: string, isInternalUser: boolean, filters?: DocumentFilterOptions) {
  const where: Prisma.AdminDocumentWhereInput = { 
    tenantId, 
    isPublished: true,
  };
  
  if (!isInternalUser) {
    where.visibility = "PUBLIC";
  }

  if (filters?.category) where.category = filters.category;
  if (filters?.year && filters.year !== "ALL") where.year = filters.year;
  if (filters?.issuerLevel && filters.issuerLevel !== "ALL") where.issuerLevel = filters.issuerLevel;
  if (filters?.docType && filters.docType !== "ALL") where.docType = filters.docType;
  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
      { docNumber: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return db.adminDocument.findMany({
    where,
    orderBy: [
      { year: "desc" },
      { createdAt: "desc" },
    ],
  });
}

export async function createAdminDocument(
  tenantId: string,
  actorId: string,
  data: Omit<Prisma.AdminDocumentCreateInput, "tenant" | "id" | "createdAt" | "updatedAt">
) {
  const result = await db.adminDocument.create({
    data: {
      tenantId,
      ...data,
    },
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "administration.create",
    entity: "AdminDocument",
    entityId: result.id,
    after: result,
  });

  return result;
}

export async function updateAdminDocument(
  tenantId: string,
  actorId: string,
  id: string,
  data: Partial<Omit<Prisma.AdminDocumentCreateInput, "tenant" | "id" | "createdAt" | "updatedAt">>
) {
  const before = await db.adminDocument.findUnique({ where: { id, tenantId } });
  if (!before) throw new Error("Not found");

  const result = await db.adminDocument.update({
    where: { id, tenantId },
    data,
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "administration.update",
    entity: "AdminDocument",
    entityId: result.id,
    before,
    after: result,
  });

  return result;
}

export async function deleteAdminDocument(tenantId: string, actorId: string, id: string) {
  const before = await db.adminDocument.findUnique({ where: { id, tenantId } });
  if (!before) throw new Error("Not found");

  await db.adminDocument.delete({ where: { id, tenantId } });

  await writeAudit({
    tenantId,
    actorId,
    action: "administration.delete",
    entity: "AdminDocument",
    entityId: id,
    before,
  });
  return true;
}
