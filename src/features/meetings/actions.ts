"use server";

import { revalidatePath } from "next/cache";
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
  type MeetingFormSettings,
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
