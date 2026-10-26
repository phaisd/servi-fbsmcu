"use server";

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { validateUploadFile } from "@/shared/lib/security/file-validation";
import { auth, requireSession, requirePermission } from "@/features/identity/server";
import { resolvePublicTenantId } from "@/features/news/server";
import { prisma as db } from "@/shared/lib/infra/prisma";
import { MEETINGS_P } from "./permissions";
import {
  createMeetingRoom,
  updateMeetingRoom,
  deleteMeetingRoom,
  createBooking,
  createOfficialBooking,
  reviewOfficialBooking,
  approveOrRejectOfficialBooking,
  updateOfficialBookingApprover,
  updateBookingStatus,
  deleteMeetingBooking,
  getMeetingFormSettings,
  updateMeetingFormSettings,
} from "./_internal/services";
import {
  meetingRoomSchema,
  updateMeetingRoomSchema,
  meetingBookingSchema,
  createOfficialBookingSchema,
  meetingFormSettingsSchema,
} from "./_internal/validations";
import type { BookingStatus } from "@/generated/prisma";

// Room Actions
export async function createMeetingRoomAction(data: unknown) {
  const session = await requireSession();
  await requirePermission(MEETINGS_P.manage);
  const parsed = meetingRoomSchema.parse(data);
  const res = await createMeetingRoom(session.tenantId, session.userId, parsed);
  revalidatePath("/meetings/rooms");
  revalidatePath("/portal/meetings");
  return res;
}

export async function updateMeetingRoomAction(id: string, data: unknown) {
  const session = await requireSession();
  await requirePermission(MEETINGS_P.manage);
  const parsed = updateMeetingRoomSchema.parse(data);
  const res = await updateMeetingRoom(session.tenantId, session.userId, id, parsed);
  revalidatePath("/meetings/rooms");
  revalidatePath("/portal/meetings");
  return res;
}

export async function deleteMeetingRoomAction(id: string) {
  const session = await requireSession();
  await requirePermission(MEETINGS_P.manage);
  const res = await deleteMeetingRoom(session.tenantId, session.userId, id);
  revalidatePath("/meetings/rooms");
  revalidatePath("/portal/meetings");
  return res;
}

export async function uploadMeetingRoomImageAction(formData: FormData) {
  await requireSession();
  await requirePermission(MEETINGS_P.manage);

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

  const uploadsDir = path.join(process.cwd(), "public", "uploads", "meetings");
  await fs.mkdir(uploadsDir, { recursive: true });

  const safeBaseName = path
    .basename(file.name, `.${validation.ext}`)
    .replace(/[^a-zA-Z0-9_\u0E00-\u0E7F-]/g, "_")
    .slice(0, 30);

  const uniqueId = crypto.randomUUID().slice(0, 8);
  const filename = `room-${Date.now()}-${uniqueId}-${safeBaseName || "photo"}.${validation.ext}`;
  const filePath = path.join(uploadsDir, filename);

  await fs.writeFile(filePath, buffer);

  const url = `/uploads/meetings/${filename}`;
  return { url, fileName: file.name, fileSize: file.size };
}

// Booking Actions
export async function createBookingAction(data: unknown) {
  const session = await requireSession();
  await requirePermission(MEETINGS_P.book);
  const parsed = meetingBookingSchema.parse(data);
  const res = await createBooking(session.tenantId, session.userId, parsed);
  revalidatePath("/meetings/bookings");
  revalidatePath("/portal/meetings");
  return res;
}

/**
 * ส่งคำขอใช้ห้องประชุมตามแบบฟอร์มทางการ (รองรับทั้งผู้ใช้งานที่ล็อกอินแล้วและหน้าพอร์ทัล)
 */
export async function createOfficialBookingAction(data: unknown) {
  const session = await auth().catch(() => null);
  const tenantId = (session as { tenantId?: string } | null)?.tenantId || (await resolvePublicTenantId());
  const preferredUserId = session?.user?.id;

  const parsed = createOfficialBookingSchema.parse(data);
  const isBypass = session?.user ? Boolean(parsed.isAdminBypass) : false;
  const res = await createOfficialBooking(tenantId, preferredUserId, {
    ...parsed,
    isAdminBypass: isBypass,
  });

  revalidatePath("/meetings/bookings");
  revalidatePath("/portal/meetings");
  revalidatePath("/portal/meetings/book");
  return res;
}

export async function reviewOfficialBookingAction(
  bookingId: string,
  data: {
    officerNote: string;
    isRoomAvailable: boolean;
    officerSignName?: string;
  }
) {
  const session = await requireSession();
  await requirePermission(MEETINGS_P.manage);
  const res = await reviewOfficialBooking(session.tenantId, session.userId, bookingId, data);
  revalidatePath("/meetings/bookings");
  revalidatePath("/portal/meetings");
  return res;
}

export async function approveOrRejectOfficialBookingAction(
  bookingId: string,
  data: {
    decision: "APPROVED" | "REJECTED";
    approverSignName?: string;
    approverPosition?: string;
    note?: string;
    saveAsExecutive?: boolean;
  }
) {
  const session = await requireSession();
  await requirePermission(MEETINGS_P.manage);
  const res = await approveOrRejectOfficialBooking(
    session.tenantId,
    session.userId,
    bookingId,
    data
  );

  if (data.saveAsExecutive && data.approverSignName?.trim()) {
    try {
      const trimmedName = data.approverSignName.trim();
      const parts = trimmedName.split(/\s+/);
      const firstNameTh = parts[0] || "";
      const lastNameTh = parts.slice(1).join(" ") || "";
      const existing = await db.personnel.findFirst({
        where: { tenantId: session.tenantId, firstNameTh, ...(lastNameTh ? { lastNameTh } : {}) },
      });
      if (!existing) {
        await db.personnel.create({
          data: {
            tenantId: session.tenantId,
            firstNameTh,
            lastNameTh,
            positionTh: data.approverPosition?.trim() || "ผู้บริหาร คณะพุทธศาสตร์",
            type: "EXECUTIVE",
            isActive: true,
          },
        });
      }
    } catch {
      // non-critical error
    }
  }

  revalidatePath("/meetings/bookings");
  revalidatePath("/portal/meetings");
  return res;
}

export async function saveExecutivePersonnelAction(data: {
  fullNameTh: string;
  positionTh: string;
}) {
  const session = await requireSession();
  await requirePermission(MEETINGS_P.manage);
  const tenantId = session.tenantId;

  const trimmedName = data.fullNameTh.trim();
  const trimmedPosition = data.positionTh.trim();
  if (!trimmedName) throw new Error("กรุณาระบุชื่อ-นามสกุลผู้อนุมัติ");

  const parts = trimmedName.split(/\s+/);
  const firstNameTh = parts[0] || "";
  const lastNameTh = parts.slice(1).join(" ") || "";

  const existing = await db.personnel.findFirst({
    where: {
      tenantId,
      firstNameTh,
      ...(lastNameTh ? { lastNameTh } : {}),
    },
  });

  let saved;
  if (existing) {
    saved = await db.personnel.update({
      where: { id: existing.id },
      data: {
        positionTh: trimmedPosition || existing.positionTh,
        type: "EXECUTIVE",
        isActive: true,
      },
      include: { department: true },
    });
  } else {
    saved = await db.personnel.create({
      data: {
        tenantId,
        firstNameTh,
        lastNameTh,
        positionTh: trimmedPosition || "ผู้บริหาร คณะพุทธศาสตร์",
        type: "EXECUTIVE",
        isActive: true,
        orderIndex: 0,
      },
      include: { department: true },
    });
  }

  revalidatePath("/meetings/bookings");
  revalidatePath("/portal/personnel");

  return {
    id: saved.id,
    fullNameTh: `${saved.firstNameTh} ${saved.lastNameTh}`.trim(),
    positionTh: saved.positionTh,
    type: saved.type,
    departmentNameTh: saved.department?.nameTh || "สำนักงานคณบดี คณะพุทธศาสตร์",
    email: saved.email || "",
    phoneNumber: saved.phoneNumber || "",
  };
}

export async function updateOfficialBookingApproverAction(
  bookingId: string,
  data: {
    approverSignName: string;
    approverPosition: string;
  }
) {
  const session = await requireSession();
  await requirePermission(MEETINGS_P.manage);
  const res = await updateOfficialBookingApprover(
    session.tenantId,
    session.userId,
    bookingId,
    data
  );
  revalidatePath("/meetings/bookings");
  revalidatePath("/portal/meetings");
  return res;
}

export async function updateBookingStatusAction(id: string, status: BookingStatus) {
  const session = await requireSession();
  await requirePermission(MEETINGS_P.manage);
  const res = await updateBookingStatus(session.tenantId, session.userId, id, status);
  revalidatePath("/meetings/bookings");
  revalidatePath("/portal/meetings");
  return res;
}

export async function deleteMeetingBookingAction(id: string) {
  const session = await requireSession();
  await requirePermission(MEETINGS_P.manage);
  const res = await deleteMeetingBooking(session.tenantId, session.userId, id);
  revalidatePath("/meetings/bookings");
  revalidatePath("/portal/meetings");
  return res;
}

export async function getMeetingFormSettingsAction() {
  const session = await auth().catch(() => null);
  const tenantId = (session as { tenantId?: string } | null)?.tenantId || (await resolvePublicTenantId());
  return getMeetingFormSettings(tenantId);
}

export async function updateMeetingFormSettingsAction(data: unknown) {
  const session = await requireSession();
  await requirePermission(MEETINGS_P.manage);
  const parsed = meetingFormSettingsSchema.parse(data);
  const res = await updateMeetingFormSettings(session.tenantId, session.userId, parsed);
  revalidatePath("/meetings/rooms");
  revalidatePath("/meetings/bookings");
  revalidatePath("/portal/meetings");
  revalidatePath("/portal/meetings/book");
  return res;
}
