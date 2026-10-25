"use server";

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { validateUploadFile } from "@/shared/lib/security/file-validation";
import { prisma } from "@/shared/lib/infra/prisma";

import { revalidatePath } from "next/cache";
import { requireSession, requirePermission, hasPermission } from "@/features/identity/server";
import { PERSONNEL_P } from "./permissions";
import {
  createDepartment,
  updateDepartment,
  deleteDepartment,
  createPersonnel,
  updatePersonnel,
  updatePersonnelOrder,
  reorderPersonnelBatch,
  deletePersonnel,
  createResearchPublication,
  updateResearchPublication,
  deleteResearchPublication,
  importPersonnelBatch,
  type ImportPersonnelItem,
} from "./_internal/services";

export type { ImportPersonnelItem };
import { findTeacherCoursesFromTimetables } from "./_internal/timetable-sync";
import {
  departmentSchema,
  updateDepartmentSchema,
  personnelSchema,
  updatePersonnelSchema,
  researchPublicationSchema,
  updateResearchPublicationSchema,
} from "./_internal/validations";

export async function createDepartmentAction(data: unknown) {
  const session = await requireSession();
  await requirePermission(PERSONNEL_P.manage);
  const parsed = departmentSchema.parse(data);
  return createDepartment(session.tenantId, session.userId, parsed);
}

export async function updateDepartmentAction(id: string, data: unknown) {
  const session = await requireSession();
  await requirePermission(PERSONNEL_P.manage);
  const parsed = updateDepartmentSchema.parse(data);
  return updateDepartment(session.tenantId, session.userId, id, parsed);
}

export async function deleteDepartmentAction(id: string) {
  const session = await requireSession();
  await requirePermission(PERSONNEL_P.manage);
  return deleteDepartment(session.tenantId, session.userId, id);
}

export async function createPersonnelAction(data: unknown) {
  const session = await requireSession();
  await requirePermission(PERSONNEL_P.manage);
  const parsed = personnelSchema.parse(data);
  return createPersonnel(session.tenantId, session.userId, parsed);
}

export async function updatePersonnelAction(id: string, data: unknown) {
  const session = await requireSession();
  await requirePermission(PERSONNEL_P.manage);
  const parsed = updatePersonnelSchema.parse(data);
  return updatePersonnel(session.tenantId, session.userId, id, parsed);
}

export async function deletePersonnelAction(id: string) {
  const session = await requireSession();
  await requirePermission(PERSONNEL_P.manage);
  return deletePersonnel(session.tenantId, session.userId, id);
}

export async function createResearchPublicationAction(data: unknown) {
  const session = await requireSession();
  await requirePermission(PERSONNEL_P.manage);
  const parsed = researchPublicationSchema.parse(data);
  return createResearchPublication(session.tenantId, session.userId, parsed);
}

export async function updateResearchPublicationAction(id: string, data: unknown) {
  const session = await requireSession();
  await requirePermission(PERSONNEL_P.manage);
  const parsed = updateResearchPublicationSchema.parse(data);
  return updateResearchPublication(session.tenantId, session.userId, id, parsed);
}

export async function deleteResearchPublicationAction(id: string) {
  const session = await requireSession();
  await requirePermission(PERSONNEL_P.manage);
  return deleteResearchPublication(session.tenantId, session.userId, id);
}

export async function importPersonnelBatchAction(items: ImportPersonnelItem[]) {
  const session = await requireSession();
  await requirePermission(PERSONNEL_P.manage);
  return importPersonnelBatch(session.tenantId, session.userId, items);
}

export async function updatePersonnelOrderAction(id: string, newOrder: number) {
  const session = await requireSession();
  await requirePermission(PERSONNEL_P.manage);
  const result = await updatePersonnelOrder(session.tenantId, session.userId, id, newOrder);
  revalidatePath("/personnel");
  revalidatePath("/portal/personnel");
  revalidatePath("/portal/departments/buddhism");
  return result;
}

export async function reorderPersonnelBatchAction(items: { id: string; orderIndex: number }[]) {
  const session = await requireSession();
  await requirePermission(PERSONNEL_P.manage);
  const result = await reorderPersonnelBatch(session.tenantId, session.userId, items);
  revalidatePath("/personnel");
  revalidatePath("/portal/personnel");
  revalidatePath("/portal/departments/buddhism");
  return result;
}

export async function uploadPersonnelImageAction(formData: FormData) {
  await requireSession();
  await requirePermission(PERSONNEL_P.manage);

  const file = formData.get("file");
  if (!file || !(file instanceof File) || file.size === 0) {
    throw new Error("กรุณาเลือกไฟล์รูปภาพ");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const validation = validateUploadFile(file.name, buffer, {
    allowedExtensions: ["png", "jpg", "jpeg", "webp"],
    maxSizeBytes: 10 * 1024 * 1024,
  });

  if (!validation.valid) {
    throw new Error(validation.error || "ไฟล์รูปภาพไม่ถูกต้อง (รองรับเฉพาะ JPG, PNG, WEBP ขนาดไม่เกิน 10MB)");
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads", "personnel");
  await fs.mkdir(uploadsDir, { recursive: true });

  const safeBaseName = path
    .basename(file.name, `.${validation.ext}`)
    .replace(/[^a-zA-Z0-9_\u0E00-\u0E7F-]/g, "_")
    .slice(0, 30);

  const uniqueId = crypto.randomUUID().slice(0, 8);
  const filename = `personnel-${Date.now()}-${uniqueId}-${safeBaseName || "photo"}.${validation.ext}`;
  const filePath = path.join(uploadsDir, filename);

  await fs.writeFile(filePath, buffer);

  const url = `/uploads/personnel/${filename}`;
  return { url, fileName: file.name, fileSize: file.size };
}

export async function syncTeacherCoursesFromTimetablesAction(teacherName: string, personnelId?: string) {
  const session = await requireSession();
  await requirePermission(PERSONNEL_P.manage);

  const tenantId = session.tenantId;

  let firstNameTh = teacherName.trim();
  let lastNameTh: string | null = null;
  let academicPosition: string | null = null;
  let email: string | null = null;

  if (personnelId) {
    const person = await prisma.personnel.findUnique({
      where: { id: personnelId },
      select: { firstNameTh: true, lastNameTh: true, academicPosition: true, email: true },
    });
    if (person) {
      firstNameTh = person.firstNameTh;
      lastNameTh = person.lastNameTh;
      academicPosition = person.academicPosition;
      email = person.email;
    }
  } else {
    const parts = teacherName.trim().split(/\s+/);
    if (parts.length > 1) {
      firstNameTh = parts[0];
      lastNameTh = parts.slice(1).join(" ");
    }
  }

  return findTeacherCoursesFromTimetables(tenantId, {
    firstNameTh,
    lastNameTh,
    academicPosition,
    email,
  });
}

export async function updateMyTitlePlacementAction(personnelId: string, titlePlacement: "PREFIX" | "SUFFIX") {
  const session = await requireSession();

  const person = await prisma.personnel.findUnique({
    where: { id: personnelId },
  });

  if (!person) {
    throw new Error("ไม่พบข้อมูลบุคลากรในระบบ");
  }

  const isOwner =
    (person.email && session.email && person.email.toLowerCase() === session.email.toLowerCase()) ||
    (session.userName && person.firstNameTh.includes(session.userName.replace(/^พระ[^\s]+/, "").trim()));

  const canManage = await hasPermission(session, PERSONNEL_P.manage);

  if (!isOwner && !canManage) {
    throw new Error("ท่านไม่มีสิทธิ์แก้ไขการตั้งค่าของบุคลากรท่านนี้");
  }

  await prisma.personnel.update({
    where: { id: personnelId },
    data: { titlePlacement },
  });

  revalidatePath("/me");
  revalidatePath("/personnel");
  revalidatePath("/portal/personnel");
  revalidatePath(`/portal/personnel/${personnelId}`);

  return { success: true, titlePlacement };
}
