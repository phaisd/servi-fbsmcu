import "server-only";
import { prisma as db } from "@/shared/lib/infra/prisma";
import { writeAudit } from "@/features/identity/server";
import { BookingStatus } from "@/generated/prisma";
import type { Prisma } from "@/generated/prisma";
import {
  parseBookingRemark,
  serializeBookingRemark,
  meetingFormSettingsSchema,
  type CreateOfficialBookingInput,
  type MeetingBookingMetadata,
  type MeetingFormSettings,
} from "./validations";
import { validateAdvanceBookingDate } from "./business-days";

/**
 * รับประกันว่ามีห้องประชุมคณะพุทธศาสตร์ (โซนดี) ความจุ 70 รูป/คน พร้อมอุปกรณ์มาตรฐานในระบบเสมอ
 */
export async function ensureMeetingDefaults(tenantId: string) {
  const roomName = "ห้องประชุมคณะพุทธศาสตร์ (โซนดี)";
  const existing = await db.meetingRoom.findFirst({
    where: {
      tenantId,
      OR: [
        { name: { contains: "คณะพุทธศาสตร์", mode: "insensitive" } },
        { name: { contains: "โซนดี", mode: "insensitive" } },
      ],
    },
  });

  if (!existing) {
    return db.meetingRoom.create({
      data: {
        tenantId,
        name: roomName,
        capacity: 70,
        equipment: "คอมพิวเตอร์, จอ LED, เครื่องขยายเสียง, Zoom Online",
        imageUrl: "/uploads/logo-b8eef236-b993-4bc9-a08c-b02935131b84-1792468122154.png",
        isActive: true,
      },
    });
  }

  // Update capacity to 70 if it was default 10 or 30
  if (existing.capacity !== 70) {
    return db.meetingRoom.update({
      where: { id: existing.id },
      data: { capacity: 70 },
    });
  }

  return existing;
}

export async function getMeetingRooms(tenantId: string) {
  await ensureMeetingDefaults(tenantId);
  return db.meetingRoom.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
  });
}

export async function getPublicMeetingRooms(tenantId: string) {
  await ensureMeetingDefaults(tenantId);
  return db.meetingRoom.findMany({
    where: { tenantId, isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function createMeetingRoom(
  tenantId: string,
  actorId: string,
  data: Omit<Prisma.MeetingRoomCreateInput, "tenant" | "id" | "createdAt" | "updatedAt" | "bookings">
) {
  const result = await db.meetingRoom.create({
    data: {
      tenantId,
      ...data,
    },
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "meetings.room.create",
    entity: "MeetingRoom",
    entityId: result.id,
    after: result,
  });

  return result;
}

export async function updateMeetingRoom(
  tenantId: string,
  actorId: string,
  id: string,
  data: Partial<Omit<Prisma.MeetingRoomCreateInput, "tenant" | "id" | "createdAt" | "updatedAt" | "bookings">>
) {
  const before = await db.meetingRoom.findUnique({ where: { id, tenantId } });
  if (!before) throw new Error("Not found");

  const result = await db.meetingRoom.update({
    where: { id, tenantId },
    data,
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "meetings.room.update",
    entity: "MeetingRoom",
    entityId: result.id,
    before,
    after: result,
  });

  return result;
}

export async function deleteMeetingRoom(tenantId: string, actorId: string, id: string) {
  const before = await db.meetingRoom.findUnique({ where: { id, tenantId } });
  if (!before) throw new Error("Not found");

  await db.meetingRoom.delete({ where: { id, tenantId } });

  await writeAudit({
    tenantId,
    actorId,
    action: "meetings.room.delete",
    entity: "MeetingRoom",
    entityId: id,
    before,
  });
  return true;
}

// -------------------------------------------------------------
// Bookings
// -------------------------------------------------------------

export async function getBookings(tenantId: string, filters?: { roomId?: string; status?: BookingStatus }) {
  await ensureMeetingDefaults(tenantId);
  const where: Prisma.MeetingBookingWhereInput = { tenantId };
  if (filters?.roomId) where.roomId = filters.roomId;
  if (filters?.status) where.status = filters.status;

  return db.meetingBooking.findMany({
    where,
    include: { room: true, requester: true },
    orderBy: { startTime: "desc" },
  });
}

export async function getUpcomingBookings(tenantId: string) {
  await ensureMeetingDefaults(tenantId);
  return db.meetingBooking.findMany({
    where: { 
      tenantId,
      status: "APPROVED",
      startTime: { gte: new Date() }
    },
    include: { room: true, requester: true },
    orderBy: { startTime: "asc" },
  });
}

export async function createBooking(
  tenantId: string,
  requesterId: string,
  data: {
    roomId: string;
    title: string;
    startTime: Date;
    endTime: Date;
    remark?: string | null;
  }
) {
  // Check overlap (approved or pending)
  const overlapping = await db.meetingBooking.findFirst({
    where: {
      tenantId,
      roomId: data.roomId,
      status: { in: ["APPROVED", "PENDING"] },
      OR: [
        { startTime: { lt: data.endTime }, endTime: { gt: data.startTime } }
      ]
    }
  });

  if (overlapping) {
    throw new Error("ห้องประชุมถูกจองในช่วงเวลาดังกล่าวแล้ว กรุณาเลือกช่วงเวลาอื่น");
  }

  const result = await db.meetingBooking.create({
    data: {
      tenantId,
      requesterId,
      roomId: data.roomId,
      title: data.title,
      startTime: data.startTime,
      endTime: data.endTime,
      remark: data.remark,
      status: "PENDING",
    },
  });

  await writeAudit({
    tenantId,
    actorId: requesterId,
    action: "meetings.booking.create",
    entity: "MeetingBooking",
    entityId: result.id,
    after: result,
  });

  return result;
}

async function resolveFallbackUserId(tenantId: string, preferredUserId?: string | null): Promise<string> {
  if (preferredUserId) {
    const exists = await db.user.findUnique({ where: { id: preferredUserId }, select: { id: true } });
    if (exists) return exists.id;
  }
  const ut = await db.userTenant.findFirst({
    where: { tenantId },
    select: { userId: true },
    orderBy: { joinedAt: "asc" },
  });
  if (ut) return ut.userId;

  const anyUser = await db.user.findFirst({ select: { id: true } });
  if (!anyUser) throw new Error("No user found in system");
  return anyUser.id;
}

/**
 * สร้างคำขอใช้ห้องประชุมตามแบบฟอร์มทางการ ใบขอใช้ห้องประชุมประจำคณะพุทธศาสตร์
 */
export async function createOfficialBooking(
  tenantId: string,
  requesterId: string | null | undefined,
  input: CreateOfficialBookingInput
) {
  const resolvedUserId = await resolveFallbackUserId(tenantId, requesterId);

  // Check advance booking rule (เว้น 1 วันทำการ ไม่รวมวันหยุดเสาร์-อาทิตย์ ยกเว้นกรณี Admin Bypass)
  if (!input.isAdminBypass) {
    const advanceCheck = validateAdvanceBookingDate(input.startTime, new Date(), 1);
    if (!advanceCheck.isValid) {
      throw new Error(advanceCheck.message);
    }
  }

  // Check overlap
  const overlapping = await db.meetingBooking.findFirst({
    where: {
      tenantId,
      roomId: input.roomId,
      status: { in: ["APPROVED", "PENDING"] },
      OR: [
        { startTime: { lt: input.endTime }, endTime: { gt: input.startTime } }
      ]
    }
  });

  if (overlapping) {
    throw new Error("ห้องประชุมมีผู้ขอใช้หรือได้รับการอนุมัติในช่วงวันและเวลาดังกล่าวแล้ว");
  }

  const serializedRemark = serializeBookingRemark(input.metadata);

  const result = await db.meetingBooking.create({
    data: {
      tenantId,
      requesterId: resolvedUserId,
      roomId: input.roomId,
      title: input.title,
      startTime: input.startTime,
      endTime: input.endTime,
      remark: serializedRemark,
      status: "PENDING",
    },
    include: {
      room: true,
      requester: true,
    },
  });

  await writeAudit({
    tenantId,
    actorId: resolvedUserId,
    action: "meetings.official_booking.create",
    entity: "MeetingBooking",
    entityId: result.id,
    after: result,
  });

  return result;
}

/**
 * เจ้าหน้าที่บันทึกความเห็นและตรวจสอบความว่างของห้องประชุม
 */
export async function reviewOfficialBooking(
  tenantId: string,
  actorId: string,
  bookingId: string,
  data: {
    officerNote: string;
    isRoomAvailable: boolean;
    officerSignName?: string;
  }
) {
  const before = await db.meetingBooking.findUnique({
    where: { id: bookingId, tenantId },
  });
  if (!before) throw new Error("ไม่พบคำขอจองห้องประชุม");

  const meta = parseBookingRemark(before.remark);
  const updatedMeta: MeetingBookingMetadata = {
    ...meta,
    officerNote: data.officerNote.trim(),
    isRoomAvailable: data.isRoomAvailable,
    officerSignName: data.officerSignName?.trim() || "เจ้าหน้าที่ดูแลห้องประชุม",
    officerReviewDate: new Date().toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  };

  const result = await db.meetingBooking.update({
    where: { id: bookingId, tenantId },
    data: {
      remark: serializeBookingRemark(updatedMeta),
    },
    include: { room: true, requester: true },
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "meetings.booking.officer_review",
    entity: "MeetingBooking",
    entityId: bookingId,
    before,
    after: result,
  });

  return result;
}

/**
 * ผู้อนุมัติ (เลขานุการสำนักงานคณบดีคณะพุทธศาสตร์) อนุมัติหรือไม่อนุมัติคำขอ
 */
export async function approveOrRejectOfficialBooking(
  tenantId: string,
  actorId: string,
  bookingId: string,
  data: {
    decision: "APPROVED" | "REJECTED";
    approverSignName?: string;
    approverPosition?: string;
    note?: string;
  }
) {
  const before = await db.meetingBooking.findUnique({
    where: { id: bookingId, tenantId },
  });
  if (!before) throw new Error("ไม่พบคำขอจองห้องประชุม");

  const meta = parseBookingRemark(before.remark);
  const updatedMeta: MeetingBookingMetadata = {
    ...meta,
    approverDecision: data.decision,
    approverSignName: data.approverSignName?.trim() || "พระครูปลัดสมเกียรติ กิตฺติญาโณ",
    approverPosition: data.approverPosition?.trim() || "เลขานุการสำนักงานคณบดีคณะพุทธศาสตร์",
    approverDate: new Date().toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    notes: data.note ? `${meta.notes ? meta.notes + "\n" : ""}${data.note}` : meta.notes,
  };

  const newStatus: BookingStatus = data.decision === "APPROVED" ? "APPROVED" : "REJECTED";

  const result = await db.meetingBooking.update({
    where: { id: bookingId, tenantId },
    data: {
      status: newStatus,
      remark: serializeBookingRemark(updatedMeta),
    },
    include: { room: true, requester: true },
  });

  await writeAudit({
    tenantId,
    actorId,
    action: `meetings.booking.${data.decision.toLowerCase()}`,
    entity: "MeetingBooking",
    entityId: bookingId,
    before,
    after: result,
  });

  return result;
}

export async function updateBookingStatus(
  tenantId: string,
  actorId: string,
  id: string,
  status: BookingStatus
) {
  const before = await db.meetingBooking.findUnique({ where: { id, tenantId } });
  if (!before) throw new Error("Not found");

  const result = await db.meetingBooking.update({
    where: { id, tenantId },
    data: { status },
  });

  await writeAudit({
    tenantId,
    actorId,
    action: `meetings.booking.status_change`,
    entity: "MeetingBooking",
    entityId: result.id,
    before,
    after: result,
  });

  return result;
}

export async function deleteMeetingBooking(tenantId: string, actorId: string, id: string) {
  const before = await db.meetingBooking.findUnique({ where: { id, tenantId } });
  if (!before) throw new Error("Not found");

  await db.meetingBooking.delete({ where: { id, tenantId } });

  await writeAudit({
    tenantId,
    actorId,
    action: "meetings.booking.delete",
    entity: "MeetingBooking",
    entityId: id,
    before,
  });

  return true;
}

// -------------------------------------------------------------
// Meeting Form Settings (Master Data for Purposes & Equipments)
// -------------------------------------------------------------

export async function getMeetingFormSettings(tenantId: string): Promise<MeetingFormSettings> {
  const t = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  });
  const settingsObj = (t?.settings as Record<string, unknown>) ?? {};
  const rawMeeting = settingsObj.meetingConfig;
  return meetingFormSettingsSchema.parse(rawMeeting || {});
}

export async function updateMeetingFormSettings(
  tenantId: string,
  actorId: string,
  input: MeetingFormSettings
): Promise<MeetingFormSettings> {
  const valid = meetingFormSettingsSchema.parse(input);
  const t = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  });
  const currentSettings = (t?.settings as Record<string, unknown>) ?? {};
  const updatedSettings = {
    ...currentSettings,
    meetingConfig: valid,
  };

  await db.tenant.update({
    where: { id: tenantId },
    data: { settings: updatedSettings as object },
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "meetings.form_settings.update",
    entity: "Tenant",
    entityId: tenantId,
    after: valid,
  });

  return valid;
}
