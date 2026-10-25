import "server-only";
import { prisma as db } from "@/shared/lib/infra/prisma";
import { writeAudit } from "@/features/identity/server";
import { PersonnelType } from "@/generated/prisma";

// ==========================================
// Departments
// ==========================================

export async function getDepartments(tenantId: string) {
  return db.department.findMany({
    where: { tenantId },
    orderBy: { orderIndex: "asc" },
  });
}

export async function createDepartment(tenantId: string, actorId: string, data: { nameTh: string; nameEn?: string | null; orderIndex?: number }) {
  const result = await db.department.create({
    data: {
      tenantId,
      nameTh: data.nameTh,
      nameEn: data.nameEn,
      orderIndex: data.orderIndex ?? 0,
    },
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "department.create",
    entity: "Department",
    entityId: result.id,
    after: result,
  });

  return result;
}

export async function updateDepartment(tenantId: string, actorId: string, id: string, data: { nameTh?: string; nameEn?: string | null; orderIndex?: number }) {
  const before = await db.department.findUnique({ where: { id, tenantId } });
  if (!before) throw new Error("Not found");

  const result = await db.department.update({
    where: { id, tenantId },
    data,
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "department.update",
    entity: "Department",
    entityId: result.id,
    before,
    after: result,
  });

  return result;
}

export async function deleteDepartment(tenantId: string, actorId: string, id: string) {
  const before = await db.department.findUnique({ where: { id, tenantId } });
  if (!before) throw new Error("Not found");

  await db.department.delete({ where: { id, tenantId } });

  await writeAudit({
    tenantId,
    actorId,
    action: "department.delete",
    entity: "Department",
    entityId: id,
    before,
  });
  return true;
}

// ==========================================
// Personnel
// ==========================================

export async function getPersonnelList(tenantId: string, filters?: { departmentId?: string; type?: PersonnelType; search?: string }) {
  const where: import("@/generated/prisma").Prisma.PersonnelWhereInput = { tenantId };
  if (filters?.departmentId) where.departmentId = filters.departmentId;
  if (filters?.type) where.type = filters.type;
  if (filters?.search) {
    where.OR = [
      { firstNameTh: { contains: filters.search } },
      { lastNameTh: { contains: filters.search } },
      { positionTh: { contains: filters.search } },
    ];
  }

  return db.personnel.findMany({
    where,
    include: {
      department: true,
      researchPublications: true,
    },
    orderBy: [{ orderIndex: "asc" }, { createdAt: "desc" }],
  });
}

export async function getPublicPersonnelList(tenantId: string, filters?: { departmentId?: string; type?: PersonnelType; search?: string }) {
  const where: import("@/generated/prisma").Prisma.PersonnelWhereInput = { tenantId, isActive: true };
  if (filters?.departmentId) where.departmentId = filters.departmentId;
  if (filters?.type) where.type = filters.type;
  if (filters?.search) {
    where.OR = [
      { firstNameTh: { contains: filters.search } },
      { lastNameTh: { contains: filters.search } },
      { positionTh: { contains: filters.search } },
    ];
  }

  return db.personnel.findMany({
    where,
    include: {
      department: true,
      researchPublications: {
        orderBy: [{ orderIndex: "asc" }, { publicationYear: "desc" }, { createdAt: "desc" }],
      },
    },
    orderBy: [{ orderIndex: "asc" }, { createdAt: "desc" }],
  });
}

export async function getPublicPersonnelById(tenantId: string, id: string) {
  const item = await db.personnel.findFirst({
    where: { id, tenantId, isActive: true },
    include: {
      department: true,
      researchPublications: {
        orderBy: [{ orderIndex: "asc" }, { publicationYear: "desc" }, { createdAt: "desc" }],
      },
    },
  });
  if (item) return item;

  // Fallback to finding active personnel by id regardless of tenant mismatch
  return db.personnel.findFirst({
    where: { id, isActive: true },
    include: {
      department: true,
      researchPublications: {
        orderBy: [{ orderIndex: "asc" }, { publicationYear: "desc" }, { createdAt: "desc" }],
      },
    },
  });
}

export async function createPersonnel(tenantId: string, actorId: string, data: Omit<import("@/generated/prisma").Prisma.PersonnelCreateInput, "tenant" | "id" | "createdAt" | "updatedAt" | "department"> & { departmentId?: string | null }) {
  const result = await db.personnel.create({
    data: {
      tenantId,
      ...data,
    },
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "personnel.create",
    entity: "Personnel",
    entityId: result.id,
    after: result,
  });

  return result;
}

export async function updatePersonnel(tenantId: string, actorId: string, id: string, data: Partial<Omit<import("@/generated/prisma").Prisma.PersonnelCreateInput, "tenant" | "id" | "createdAt" | "updatedAt" | "department"> & { departmentId?: string | null }>) {
  const before = await db.personnel.findUnique({ where: { id, tenantId } });
  if (!before) throw new Error("Not found");

  const result = await db.personnel.update({
    where: { id, tenantId },
    data,
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "personnel.update",
    entity: "Personnel",
    entityId: result.id,
    before,
    after: result,
  });

  return result;
}

export async function updatePersonnelOrder(
  tenantId: string,
  actorId: string,
  id: string,
  newOrder: number
) {
  const before = await db.personnel.findFirst({ where: { id } });
  if (!before) throw new Error("Personnel not found");

  const result = await db.personnel.update({
    where: { id: before.id },
    data: { orderIndex: Math.max(0, Math.floor(newOrder)) },
  });

  await writeAudit({
    tenantId: before.tenantId,
    actorId,
    action: "personnel.update_order",
    entity: "Personnel",
    entityId: result.id,
    before: { orderIndex: before.orderIndex },
    after: { orderIndex: result.orderIndex },
  });

  return result;
}

export async function reorderPersonnelBatch(
  tenantId: string,
  actorId: string,
  items: { id: string; orderIndex: number }[]
) {
  const updates = items.map((item) =>
    db.personnel.update({
      where: { id: item.id },
      data: { orderIndex: item.orderIndex },
    })
  );

  const results = await db.$transaction(updates);

  await writeAudit({
    tenantId,
    actorId,
    action: "personnel.reorder_batch",
    entity: "Personnel",
    entityId: "batch",
    after: { count: items.length },
  });

  return results;
}

export async function deletePersonnel(tenantId: string, actorId: string, id: string) {
  const before = await db.personnel.findUnique({ where: { id, tenantId } });
  if (!before) throw new Error("Not found");

  await db.personnel.delete({ where: { id, tenantId } });

  await writeAudit({
    tenantId,
    actorId,
    action: "personnel.delete",
    entity: "Personnel",
    entityId: id,
    before,
  });
  return true;
}

// ==========================================
// Research Publications
// ==========================================

export async function getResearchPublications(
  tenantId: string,
  filters?: { personnelId?: string; type?: string; search?: string }
) {
  const where: import("@/generated/prisma").Prisma.ResearchPublicationWhereInput = { tenantId };
  if (filters?.personnelId) where.personnelId = filters.personnelId;
  if (filters?.type && filters.type !== "ALL") where.type = filters.type;
  if (filters?.search && filters.search.trim()) {
    const s = filters.search.trim();
    where.OR = [
      { titleTh: { contains: s, mode: "insensitive" } },
      { titleEn: { contains: s, mode: "insensitive" } },
      { authors: { contains: s, mode: "insensitive" } },
      { journalName: { contains: s, mode: "insensitive" } },
    ];
  }

  return db.researchPublication.findMany({
    where,
    include: {
      personnel: {
        select: {
          id: true,
          firstNameTh: true,
          lastNameTh: true,
          positionTh: true,
          academicPosition: true,
          imageUrl: true,
        },
      },
    },
    orderBy: [{ orderIndex: "asc" }, { publicationYear: "desc" }, { createdAt: "desc" }],
  });
}

export async function createResearchPublication(
  tenantId: string,
  actorId: string,
  data: Omit<import("@/generated/prisma").Prisma.ResearchPublicationCreateInput, "tenant" | "id" | "createdAt" | "updatedAt" | "personnel"> & { personnelId?: string | null }
) {
  const result = await db.researchPublication.create({
    data: {
      tenantId,
      ...data,
    },
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "research_publication.create",
    entity: "ResearchPublication",
    entityId: result.id,
    after: result,
  });

  return result;
}

export async function updateResearchPublication(
  tenantId: string,
  actorId: string,
  id: string,
  data: Partial<Omit<import("@/generated/prisma").Prisma.ResearchPublicationCreateInput, "tenant" | "id" | "createdAt" | "updatedAt" | "personnel"> & { personnelId?: string | null }>
) {
  const before = await db.researchPublication.findUnique({ where: { id, tenantId } });
  if (!before) throw new Error("Not found");

  const result = await db.researchPublication.update({
    where: { id, tenantId },
    data,
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "research_publication.update",
    entity: "ResearchPublication",
    entityId: result.id,
    before,
    after: result,
  });

  return result;
}

export async function deleteResearchPublication(tenantId: string, actorId: string, id: string) {
  const before = await db.researchPublication.findUnique({ where: { id, tenantId } });
  if (!before) throw new Error("Not found");

  await db.researchPublication.delete({ where: { id, tenantId } });

  await writeAudit({
    tenantId,
    actorId,
    action: "research_publication.delete",
    entity: "ResearchPublication",
    entityId: id,
    before,
  });
  return true;
}

export interface ImportPersonnelItem {
  id?: string;
  firstNameTh: string;
  lastNameTh?: string | null;
  firstNameEn?: string | null;
  lastNameEn?: string | null;
  positionTh: string;
  positionEn?: string | null;
  academicPosition?: string | null;
  type?: "EXECUTIVE" | "ACADEMIC" | "SUPPORT";
  departmentId?: string | null;
  departmentName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  contactInfo?: string | null;
  imageUrl?: string | null;
  educationTh?: string | null;
  experiencesTh?: string | null;
  bioTh?: string | null;
  isActive?: boolean;
  orderIndex?: number;
  researchPublications?: Array<{
    id?: string;
    titleTh: string;
    titleEn?: string | null;
    authors?: string | null;
    journalName: string;
    volume?: string | null;
    issue?: string | null;
    publicationYear?: string | null;
    pages?: string | null;
    issn?: string | null;
    tier?: string | null;
    url?: string | null;
    type?: "RESEARCH" | "ACADEMIC" | "DISSERTATION";
    orderIndex?: number;
  }>;
}

export async function importPersonnelBatch(
  tenantId: string,
  actorId: string,
  items: ImportPersonnelItem[]
) {
  let createdCount = 0;
  let updatedCount = 0;
  let totalResearchCount = 0;

  const departments = await db.department.findMany({ where: { tenantId } });

  for (const item of items) {
    if (!item.firstNameTh?.trim() || !item.positionTh?.trim()) continue;

    let departmentId = item.departmentId || null;
    if (!departmentId && item.departmentName?.trim()) {
      const matchDept = departments.find(
        (d) =>
          d.nameTh.toLowerCase() === item.departmentName!.toLowerCase().trim() ||
          (d.nameEn && d.nameEn.toLowerCase() === item.departmentName!.toLowerCase().trim())
      );
      if (matchDept) {
        departmentId = matchDept.id;
      }
    }

    let existing = null;
    if (item.id) {
      existing = await db.personnel.findUnique({ where: { id: item.id, tenantId } });
    }
    if (!existing) {
      existing = await db.personnel.findFirst({
        where: {
          tenantId,
          firstNameTh: item.firstNameTh.trim(),
          lastNameTh: item.lastNameTh?.trim() || "",
        },
      });
    }

    const personnelData = {
      firstNameTh: item.firstNameTh.trim(),
      lastNameTh: item.lastNameTh?.trim() || "",
      firstNameEn: item.firstNameEn?.trim() || null,
      lastNameEn: item.lastNameEn?.trim() || null,
      positionTh: item.positionTh.trim(),
      positionEn: item.positionEn?.trim() || null,
      academicPosition: item.academicPosition?.trim() || null,
      type: item.type || "ACADEMIC",
      departmentId,
      email: item.email?.trim() || null,
      phoneNumber: item.phoneNumber?.trim() || null,
      contactInfo: item.contactInfo?.trim() || null,
      imageUrl: item.imageUrl?.trim() || null,
      educationTh: item.educationTh?.trim() || null,
      experiencesTh: item.experiencesTh?.trim() || null,
      bioTh: item.bioTh?.trim() || null,
      isActive: item.isActive !== undefined ? item.isActive : true,
      orderIndex: typeof item.orderIndex === "number" ? item.orderIndex : 0,
    };

    let personnelId = "";
    if (existing) {
      const updated = await db.personnel.update({
        where: { id: existing.id },
        data: personnelData,
      });
      personnelId = updated.id;
      updatedCount++;
    } else {
      const created = await db.personnel.create({
        data: {
          tenantId,
          ...personnelData,
        },
      });
      personnelId = created.id;
      createdCount++;
    }

    if (item.researchPublications && Array.isArray(item.researchPublications)) {
      for (const pub of item.researchPublications) {
        if (!pub.titleTh?.trim() || !pub.journalName?.trim()) continue;

        let existingPub = null;
        if (pub.id) {
          existingPub = await db.researchPublication.findUnique({
            where: { id: pub.id, tenantId },
          });
        }
        if (!existingPub) {
          existingPub = await db.researchPublication.findFirst({
            where: {
              tenantId,
              personnelId,
              titleTh: pub.titleTh.trim(),
            },
          });
        }

        const pubData = {
          personnelId,
          titleTh: pub.titleTh.trim(),
          titleEn: pub.titleEn?.trim() || null,
          authors: pub.authors?.trim() || `${item.firstNameTh} ${item.lastNameTh || ""}`.trim(),
          journalName: pub.journalName.trim(),
          volume: pub.volume?.trim() || null,
          issue: pub.issue?.trim() || null,
          publicationYear: pub.publicationYear?.trim() || null,
          pages: pub.pages?.trim() || null,
          issn: pub.issn?.trim() || null,
          tier: pub.tier?.trim() || null,
          url: pub.url?.trim() || null,
          type: pub.type || "RESEARCH",
          orderIndex: typeof pub.orderIndex === "number" ? pub.orderIndex : 0,
        };

        if (existingPub) {
          await db.researchPublication.update({
            where: { id: existingPub.id },
            data: pubData,
          });
        } else {
          await db.researchPublication.create({
            data: {
              tenantId,
              ...pubData,
            },
          });
        }
        totalResearchCount++;
      }
    }
  }

  await writeAudit({
    tenantId,
    actorId,
    action: "personnel.import_batch",
    entity: "Personnel",
    entityId: tenantId,
    after: { createdCount, updatedCount, totalResearchCount },
  });

  return { createdCount, updatedCount, totalResearchCount };
}
