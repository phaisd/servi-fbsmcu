import "server-only";
import { prisma as db } from "@/shared/lib/infra/prisma";
import { writeAudit } from "@/features/identity/server";
import { DegreeLevel } from "@/generated/prisma";
import type { Prisma } from "@/generated/prisma";

// ==========================================
// CURRICULUM SERVICES
// ==========================================

export async function getCurriculums(
  tenantId: string,
  filters?: { degree?: DegreeLevel; departmentId?: string; search?: string }
) {
  const where: Prisma.CurriculumWhereInput = { tenantId };
  if (filters?.degree) where.degree = filters.degree;
  if (filters?.departmentId) {
    if (filters.departmentId === "none") {
      where.departmentId = null;
    } else {
      where.departmentId = filters.departmentId;
    }
  }
  if (filters?.search) {
    where.OR = [
      { nameTh: { contains: filters.search, mode: "insensitive" } },
      { nameEn: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return db.curriculum.findMany({
    where,
    include: {
      department: true,
    },
    orderBy: [{ orderIndex: "asc" }, { createdAt: "desc" }],
  });
}

export async function getPublicCurriculums(
  tenantId: string,
  filters?: { degree?: DegreeLevel; departmentId?: string; search?: string }
) {
  const where: Prisma.CurriculumWhereInput = { tenantId, isActive: true };
  if (filters?.degree) where.degree = filters.degree;
  if (filters?.departmentId) {
    if (filters.departmentId === "none") {
      where.departmentId = null;
    } else {
      where.departmentId = filters.departmentId;
    }
  }
  if (filters?.search) {
    where.OR = [
      { nameTh: { contains: filters.search, mode: "insensitive" } },
      { nameEn: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return db.curriculum.findMany({
    where,
    include: {
      department: true,
    },
    orderBy: [{ degree: "asc" }, { orderIndex: "asc" }],
  });
}

export async function createCurriculum(
  tenantId: string,
  actorId: string,
  data: {
    nameTh: string;
    nameEn?: string | null;
    degree: DegreeLevel;
    durationYears?: number;
    departmentId?: string | null;
    descriptionTh?: string | null;
    descriptionEn?: string | null;
    imageUrl?: string | null;
    isActive?: boolean;
    orderIndex?: number;
  }
) {
  const result = await db.curriculum.create({
    data: {
      tenantId,
      nameTh: data.nameTh,
      nameEn: data.nameEn,
      degree: data.degree,
      durationYears: data.durationYears ?? 4,
      departmentId: data.departmentId || null,
      descriptionTh: data.descriptionTh,
      descriptionEn: data.descriptionEn,
      imageUrl: data.imageUrl,
      isActive: data.isActive ?? true,
      orderIndex: data.orderIndex ?? 0,
    },
    include: {
      department: true,
    },
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "curriculum.create",
    entity: "Curriculum",
    entityId: result.id,
    after: result,
  });

  return result;
}

export async function updateCurriculum(
  tenantId: string,
  actorId: string,
  id: string,
  data: Partial<{
    nameTh: string;
    nameEn?: string | null;
    degree: DegreeLevel;
    durationYears?: number;
    departmentId?: string | null;
    descriptionTh?: string | null;
    descriptionEn?: string | null;
    imageUrl?: string | null;
    isActive?: boolean;
    orderIndex?: number;
  }>
) {
  const before = await db.curriculum.findUnique({ where: { id, tenantId } });
  if (!before) throw new Error("Curriculum not found");

  const result = await db.curriculum.update({
    where: { id, tenantId },
    data: {
      ...data,
      departmentId: data.departmentId !== undefined ? (data.departmentId || null) : undefined,
    },
    include: {
      department: true,
    },
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "curriculum.update",
    entity: "Curriculum",
    entityId: result.id,
    before,
    after: result,
  });

  return result;
}

export async function deleteCurriculum(tenantId: string, actorId: string, id: string) {
  const before = await db.curriculum.findUnique({ where: { id, tenantId } });
  if (!before) throw new Error("Curriculum not found");

  await db.curriculum.delete({ where: { id, tenantId } });

  await writeAudit({
    tenantId,
    actorId,
    action: "curriculum.delete",
    entity: "Curriculum",
    entityId: id,
    before,
  });
  return true;
}

// ==========================================
// DEPARTMENT / PROGRAM / DIVISION SERVICES
// ==========================================

export async function getDepartments(tenantId: string) {
  return db.department.findMany({
    where: { tenantId },
    include: {
      curriculums: {
        select: {
          id: true,
          nameTh: true,
          nameEn: true,
          degree: true,
          durationYears: true,
          isActive: true,
          orderIndex: true,
        },
        orderBy: [{ orderIndex: "asc" }, { nameTh: "asc" }],
      },
      _count: {
        select: {
          curriculums: true,
          personnel: true,
        },
      },
    },
    orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
  });
}

export async function createDepartment(
  tenantId: string,
  actorId: string,
  data: {
    nameTh: string;
    nameEn?: string | null;
    code?: string | null;
    type?: string | null;
    descriptionTh?: string | null;
    descriptionEn?: string | null;
    orderIndex?: number;
  }
) {
  const result = await db.department.create({
    data: {
      tenantId,
      nameTh: data.nameTh,
      nameEn: data.nameEn,
      code: data.code,
      type: data.type ?? "DEPARTMENT",
      descriptionTh: data.descriptionTh,
      descriptionEn: data.descriptionEn,
      orderIndex: data.orderIndex ?? 0,
    },
    include: {
      curriculums: true,
      _count: {
        select: { curriculums: true, personnel: true },
      },
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

export async function updateDepartment(
  tenantId: string,
  actorId: string,
  id: string,
  data: Partial<{
    nameTh: string;
    nameEn?: string | null;
    code?: string | null;
    type?: string | null;
    descriptionTh?: string | null;
    descriptionEn?: string | null;
    orderIndex?: number;
  }>
) {
  const before = await db.department.findUnique({ where: { id, tenantId } });
  if (!before) throw new Error("Department not found");

  const result = await db.department.update({
    where: { id, tenantId },
    data,
    include: {
      curriculums: true,
      _count: {
        select: { curriculums: true, personnel: true },
      },
    },
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
  if (!before) throw new Error("Department not found");

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
// TIMETABLE SERVICES
// ==========================================

export async function getTimetables(
  tenantId: string,
  filters?: {
    curriculumId?: string;
    departmentId?: string;
    academicYear?: string;
    semester?: number;
    yearLevel?: number;
    search?: string;
  }
) {
  const where: Prisma.CurriculumTimetableWhereInput = { tenantId };
  if (filters?.curriculumId) {
    if (filters.curriculumId === "none") where.curriculumId = null;
    else where.curriculumId = filters.curriculumId;
  }
  if (filters?.departmentId) {
    if (filters.departmentId === "none") where.departmentId = null;
    else where.departmentId = filters.departmentId;
  }
  if (filters?.academicYear) where.academicYear = filters.academicYear;
  if (filters?.semester) where.semester = filters.semester;
  if (filters?.yearLevel) where.yearLevel = filters.yearLevel;
  if (filters?.search) {
    where.OR = [
      { titleTh: { contains: filters.search, mode: "insensitive" } },
      { titleEn: { contains: filters.search, mode: "insensitive" } },
      { room: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return db.curriculumTimetable.findMany({
    where,
    include: {
      curriculum: true,
      department: true,
    },
    orderBy: [
      { academicYear: "desc" },
      { semester: "asc" },
      { yearLevel: "asc" },
      { orderIndex: "asc" },
      { createdAt: "desc" },
    ],
  });
}

export async function getPublicTimetables(
  tenantId: string,
  filters?: {
    curriculumId?: string;
    departmentId?: string;
    academicYear?: string;
    semester?: number;
    yearLevel?: number;
    search?: string;
  }
) {
  const where: Prisma.CurriculumTimetableWhereInput = { tenantId, isActive: true };
  if (filters?.curriculumId) {
    if (filters.curriculumId === "none") where.curriculumId = null;
    else where.curriculumId = filters.curriculumId;
  }
  if (filters?.departmentId) {
    if (filters.departmentId === "none") where.departmentId = null;
    else where.departmentId = filters.departmentId;
  }
  if (filters?.academicYear) where.academicYear = filters.academicYear;
  if (filters?.semester) where.semester = filters.semester;
  if (filters?.yearLevel) where.yearLevel = filters.yearLevel;
  if (filters?.search) {
    where.OR = [
      { titleTh: { contains: filters.search, mode: "insensitive" } },
      { titleEn: { contains: filters.search, mode: "insensitive" } },
      { room: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return db.curriculumTimetable.findMany({
    where,
    include: {
      curriculum: true,
      department: true,
    },
    orderBy: [
      { academicYear: "desc" },
      { semester: "asc" },
      { yearLevel: "asc" },
      { orderIndex: "asc" },
    ],
  });
}

export async function getTimetableById(tenantId: string, id: string) {
  return db.curriculumTimetable.findUnique({
    where: { id, tenantId },
    include: {
      curriculum: true,
      department: true,
    },
  });
}

export async function createTimetable(
  tenantId: string,
  actorId: string,
  data: {
    titleTh: string;
    titleEn?: string | null;
    curriculumId?: string | null;
    departmentId?: string | null;
    academicYear?: string;
    semester?: number;
    yearLevel?: number;
    room?: string | null;
    termDates?: string | null;
    description?: string | null;
    notes?: string | null;
    scheduleData?: any;
    isActive?: boolean;
    orderIndex?: number;
  }
) {
  const result = await db.curriculumTimetable.create({
    data: {
      tenantId,
      titleTh: data.titleTh,
      titleEn: data.titleEn,
      curriculumId: data.curriculumId || null,
      departmentId: data.departmentId || null,
      academicYear: data.academicYear || "2569",
      semester: data.semester ?? 1,
      yearLevel: data.yearLevel ?? 1,
      room: data.room,
      termDates: data.termDates,
      description: data.description,
      notes: data.notes,
      scheduleData: (data.scheduleData as Prisma.InputJsonValue) ?? [],
      isActive: data.isActive ?? true,
      orderIndex: data.orderIndex ?? 0,
    },
    include: {
      curriculum: true,
      department: true,
    },
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "curriculumTimetable.create",
    entity: "CurriculumTimetable",
    entityId: result.id,
    after: result,
  });

  return result;
}

export async function updateTimetable(
  tenantId: string,
  actorId: string,
  id: string,
  data: Partial<{
    titleTh: string;
    titleEn?: string | null;
    curriculumId?: string | null;
    departmentId?: string | null;
    academicYear?: string;
    semester?: number;
    yearLevel?: number;
    room?: string | null;
    termDates?: string | null;
    description?: string | null;
    notes?: string | null;
    scheduleData?: any;
    isActive?: boolean;
    orderIndex?: number;
  }>
) {
  const before = await db.curriculumTimetable.findUnique({ where: { id, tenantId } });
  if (!before) throw new Error("Timetable not found");

  const result = await db.curriculumTimetable.update({
    where: { id, tenantId },
    data: {
      ...data,
      curriculumId: data.curriculumId !== undefined ? (data.curriculumId || null) : undefined,
      departmentId: data.departmentId !== undefined ? (data.departmentId || null) : undefined,
      scheduleData: data.scheduleData !== undefined ? (data.scheduleData as Prisma.InputJsonValue) : undefined,
    },
    include: {
      curriculum: true,
      department: true,
    },
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "curriculumTimetable.update",
    entity: "CurriculumTimetable",
    entityId: result.id,
    before,
    after: result,
  });

  return result;
}

export async function deleteTimetable(tenantId: string, actorId: string, id: string) {
  const before = await db.curriculumTimetable.findUnique({ where: { id, tenantId } });
  if (!before) throw new Error("Timetable not found");

  await db.curriculumTimetable.delete({ where: { id, tenantId } });

  await writeAudit({
    tenantId,
    actorId,
    action: "curriculumTimetable.delete",
    entity: "CurriculumTimetable",
    entityId: id,
    before,
  });
  return true;
}

export interface BatchImportTimetableItem {
  titleTh: string;
  titleEn?: string | null;
  curriculumId?: string | null;
  curriculumName?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  academicYear: string;
  semester: number;
  yearLevel: number;
  room?: string | null;
  termDates?: string | null;
  description?: string | null;
  notes?: string | null;
  scheduleData: any[];
  isActive?: boolean;
}

// Helper to deduce DegreeLevel from curriculum text
function detectDegree(text: string): "BACHELOR" | "MASTER" | "DOCTORATE" | "CERTIFICATE" {
  const t = text.toLowerCase();
  if (t.includes("ดุษฎี") || t.includes("เอก") || t.includes("doctor") || t.includes("ph.d")) {
    return "DOCTORATE";
  }
  if (t.includes("มหาบัณฑิต") || t.includes("โท") || t.includes("master") || t.includes("m.a.") || t.includes("m.sc")) {
    return "MASTER";
  }
  if (t.includes("ประกาศนียบัตร") || t.includes("certificate") || t.includes("cert.")) {
    return "CERTIFICATE";
  }
  return "BACHELOR";
}

export async function batchImportTimetables(
  tenantId: string,
  actorId: string,
  items: BatchImportTimetableItem[]
) {
  let createdCount = 0;
  let updatedCount = 0;
  let totalSlots = 0;
  let autoCreatedCurriculums = 0;
  let autoCreatedDepartments = 0;

  // Cache lookup to avoid duplicate creates within the same batch
  const deptMap = new Map<string, string>();
  const currMap = new Map<string, string>();

  // Pre-load existing
  const existingDepts = await db.department.findMany({ where: { tenantId } });
  for (const d of existingDepts) {
    deptMap.set(d.nameTh.trim(), d.id);
    if (d.nameEn) deptMap.set(d.nameEn.trim().toLowerCase(), d.id);
  }

  const existingCurrs = await db.curriculum.findMany({ where: { tenantId } });
  for (const c of existingCurrs) {
    currMap.set(c.nameTh.trim(), c.id);
    if (c.nameEn) currMap.set(c.nameEn.trim().toLowerCase(), c.id);
  }

  for (const item of items) {
    const slots = Array.isArray(item.scheduleData) ? item.scheduleData : [];
    totalSlots += slots.length;

    let targetDeptId = item.departmentId || null;
    let targetCurrId = item.curriculumId || null;

    // 1. Auto-create or resolve Department if departmentName is present and departmentId not found
    const rawDeptName = item.departmentName?.trim();
    if (!targetDeptId && rawDeptName) {
      const foundDeptId =
        deptMap.get(rawDeptName) || deptMap.get(rawDeptName.toLowerCase());
      if (foundDeptId) {
        targetDeptId = foundDeptId;
      } else {
        // Auto-create new Department
        const newDept = await db.department.create({
          data: {
            tenantId,
            nameTh: rawDeptName,
            nameEn: rawDeptName,
            type: rawDeptName.includes("สาขา") ? "PROGRAM" : "DEPARTMENT",
            orderIndex: existingDepts.length + autoCreatedDepartments + 1,
          },
        });
        targetDeptId = newDept.id;
        deptMap.set(rawDeptName, newDept.id);
        deptMap.set(rawDeptName.toLowerCase(), newDept.id);
        autoCreatedDepartments++;
      }
    }

    // 2. Auto-create or resolve Curriculum if curriculumName is present and curriculumId not found
    const rawCurrName = item.curriculumName?.trim();
    if (!targetCurrId && rawCurrName) {
      const foundCurrId =
        currMap.get(rawCurrName) || currMap.get(rawCurrName.toLowerCase());
      if (foundCurrId) {
        targetCurrId = foundCurrId;
      } else {
        // Auto-create new Curriculum
        const detectedDeg = detectDegree(rawCurrName);
        const newCurr = await db.curriculum.create({
          data: {
            tenantId,
            departmentId: targetDeptId,
            nameTh: rawCurrName,
            nameEn: rawCurrName,
            degree: detectedDeg,
            durationYears: detectedDeg === "DOCTORATE" ? 3 : detectedDeg === "MASTER" ? 2 : 4,
            isActive: true,
            orderIndex: existingCurrs.length + autoCreatedCurriculums + 1,
          },
        });
        targetCurrId = newCurr.id;
        currMap.set(rawCurrName, newCurr.id);
        currMap.set(rawCurrName.toLowerCase(), newCurr.id);
        autoCreatedCurriculums++;
      }
    }

    const existing = await db.curriculumTimetable.findFirst({
      where: {
        tenantId,
        curriculumId: targetCurrId || undefined,
        academicYear: item.academicYear,
        semester: item.semester,
        yearLevel: item.yearLevel,
      },
    });

    if (existing) {
      await db.curriculumTimetable.update({
        where: { id: existing.id },
        data: {
          titleTh: item.titleTh || existing.titleTh,
          titleEn: item.titleEn !== undefined ? item.titleEn : existing.titleEn,
          curriculumId: targetCurrId || existing.curriculumId,
          departmentId: targetDeptId || existing.departmentId,
          room: item.room || existing.room,
          termDates: item.termDates || existing.termDates,
          notes: item.notes || existing.notes,
          scheduleData: (slots as Prisma.InputJsonValue) ?? existing.scheduleData,
          isActive: item.isActive ?? existing.isActive,
        },
      });
      updatedCount++;
    } else {
      await db.curriculumTimetable.create({
        data: {
          tenantId,
          titleTh: item.titleTh,
          titleEn: item.titleEn || null,
          curriculumId: targetCurrId || null,
          departmentId: targetDeptId || null,
          academicYear: item.academicYear || "2569",
          semester: item.semester || 1,
          yearLevel: item.yearLevel || 1,
          room: item.room || null,
          termDates: item.termDates || null,
          notes: item.notes || null,
          scheduleData: (slots as Prisma.InputJsonValue) ?? [],
          isActive: item.isActive ?? true,
        },
      });
      createdCount++;
    }
  }

  await writeAudit({
    tenantId,
    actorId,
    action: "curriculumTimetable.batchImport",
    entity: "CurriculumTimetable",
    entityId: "batch",
    after: {
      createdCount,
      updatedCount,
      totalSlots,
      autoCreatedCurriculums,
      autoCreatedDepartments,
    },
  });

  return {
    createdCount,
    updatedCount,
    totalSlots,
    autoCreatedCurriculums,
    autoCreatedDepartments,
  };
}

// =========================================================================
// ACADEMIC CALENDAR SERVICES
// =========================================================================

export async function getAcademicCalendars(tenantId: string) {
  return db.academicCalendar.findMany({
    where: { tenantId },
    orderBy: { academicYear: "desc" },
    include: {
      _count: { select: { events: true } },
    },
  });
}

export async function getAcademicCalendarWithEvents(
  tenantId: string,
  academicYear?: string
) {
  const where: any = { tenantId, degreeLevel: "BACHELOR" };
  if (academicYear) {
    where.academicYear = academicYear;
  } else {
    where.isActive = true;
  }

  let calendar = await db.academicCalendar.findFirst({
    where,
    orderBy: { academicYear: "desc" },
    include: {
      events: {
        orderBy: [
          { semester: "asc" },
          { orderIndex: "asc" },
          { startDate: "asc" },
        ],
      },
    },
  });

  if (!calendar && academicYear) {
    calendar = await db.academicCalendar.findFirst({
      where: { tenantId },
      orderBy: { academicYear: "desc" },
      include: {
        events: {
          orderBy: [
            { semester: "asc" },
            { orderIndex: "asc" },
            { startDate: "asc" },
          ],
        },
      },
    });
  }

  return calendar;
}

export async function createAcademicCalendar(
  tenantId: string,
  actorId: string,
  data: {
    academicYear: string;
    title: string;
    titleTh?: string | null;
    degreeLevel?: string;
    authority?: string | null;
    announcedDate?: string | null;
    signatory?: string | null;
    description?: string | null;
    isActive?: boolean;
  }
) {
  const result = await db.academicCalendar.create({
    data: {
      tenantId,
      academicYear: data.academicYear,
      title: data.title,
      titleTh: data.titleTh,
      degreeLevel: data.degreeLevel || "BACHELOR",
      authority: data.authority,
      announcedDate: data.announcedDate,
      signatory: data.signatory,
      description: data.description,
      isActive: data.isActive ?? true,
    },
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "academicCalendar.create",
    entity: "AcademicCalendar",
    entityId: result.id,
    after: result,
  });

  return result;
}

export async function updateAcademicCalendar(
  tenantId: string,
  actorId: string,
  id: string,
  data: Partial<{
    title: string;
    titleTh?: string | null;
    authority?: string | null;
    announcedDate?: string | null;
    signatory?: string | null;
    description?: string | null;
    isActive?: boolean;
  }>
) {
  const result = await db.academicCalendar.update({
    where: { id },
    data,
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "academicCalendar.update",
    entity: "AcademicCalendar",
    entityId: id,
    after: result,
  });

  return result;
}

export async function createAcademicCalendarEvent(
  tenantId: string,
  actorId: string,
  data: {
    calendarId: string;
    semester: number;
    semesterLabel: string;
    titleEn: string;
    titleTh?: string | null;
    startDate: string;
    endDate: string;
    dateDisplayEn: string;
    dateDisplayTh?: string | null;
    eventType?: string;
    description?: string | null;
    orderIndex?: number;
  }
) {
  const result = await db.academicCalendarEvent.create({
    data: {
      tenantId,
      calendarId: data.calendarId,
      semester: data.semester,
      semesterLabel: data.semesterLabel,
      titleEn: data.titleEn,
      titleTh: data.titleTh,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      dateDisplayEn: data.dateDisplayEn,
      dateDisplayTh: data.dateDisplayTh,
      eventType: data.eventType || "OTHER",
      description: data.description,
      orderIndex: data.orderIndex ?? 0,
    },
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "academicCalendarEvent.create",
    entity: "AcademicCalendarEvent",
    entityId: result.id,
    after: result,
  });

  return result;
}

export async function updateAcademicCalendarEvent(
  tenantId: string,
  actorId: string,
  id: string,
  data: Partial<{
    semester: number;
    semesterLabel: string;
    titleEn: string;
    titleTh?: string | null;
    startDate: string;
    endDate: string;
    dateDisplayEn: string;
    dateDisplayTh?: string | null;
    eventType?: string;
    description?: string | null;
    orderIndex?: number;
  }>
) {
  const updateData: any = { ...data };
  if (data.startDate) updateData.startDate = new Date(data.startDate);
  if (data.endDate) updateData.endDate = new Date(data.endDate);

  const result = await db.academicCalendarEvent.update({
    where: { id },
    data: updateData,
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "academicCalendarEvent.update",
    entity: "AcademicCalendarEvent",
    entityId: id,
    after: result,
  });

  return result;
}

export async function deleteAcademicCalendarEvent(
  tenantId: string,
  actorId: string,
  id: string
) {
  const result = await db.academicCalendarEvent.delete({
    where: { id },
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "academicCalendarEvent.delete",
    entity: "AcademicCalendarEvent",
    entityId: id,
    before: result,
  });

  return result;
}

export async function deleteAcademicCalendar(
  tenantId: string,
  actorId: string,
  id: string
) {
  const result = await db.academicCalendar.delete({
    where: { id },
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "academicCalendar.delete",
    entity: "AcademicCalendar",
    entityId: id,
    before: result,
  });

  return result;
}



