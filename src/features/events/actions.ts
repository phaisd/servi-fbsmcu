"use server";


import {
  getEventEvaluationConfig,
  updateEventEvaluationConfig,
  submitEventEvaluation,
  getEventEvaluationStats,
  type EvaluationCriterion,
} from "./_internal/evaluation-service";

import { requireSession, requirePermission } from "@/features/identity/server";
import { EVENTS_P } from "./permissions";
import { resolvePublicTenantId } from "@/features/news/server";
import {
  createEvent,
  updateEvent,
  deleteEvent,
  updateRegistrationStatus,
  updateRegistrationRemarks,
  quickCheckInByCode,
  getUserActivities,
  seedOpeningCeremonyEvent,
  addIndividualAttendee,
  batchAddStudentsToEvent,
  removeAttendeeFromEvent,
  importPersonnelToEvent,
  batchImportAttendees,
  getEventProjectorData,
  publicSelfCheckInEvent,
  getStudentActivityTranscript,
} from "./_internal/services";
import type { RegistrationStatus } from "@/generated/prisma";
import { revalidatePath } from "next/cache";

export async function createEventAction(data: {
  title: string;
  description?: string | null;
  location?: string | null;
  startDate: string;
  endDate: string;
  capacity?: number;
  academicYear?: string | null;
  activityHours?: number;
  eventType?: string;
  targetGroup?: string;
}) {
  const session = await requireSession();
  await requirePermission(EVENTS_P.manage);
  const result = await createEvent(session.tenantId, session.userId, data);
  revalidatePath("/events");
  return { success: true, event: result };
}

export async function updateEventAction(
  id: string,
  data: Partial<{
    title: string;
    description: string | null;
    location: string | null;
    startDate: string;
    endDate: string;
    capacity: number;
    academicYear: string | null;
    activityHours: number;
    eventType: string;
    targetGroup: string;
    isActive: boolean;
  }>
) {
  const session = await requireSession();
  await requirePermission(EVENTS_P.manage);
  const result = await updateEvent(session.tenantId, session.userId, id, data);
  revalidatePath("/events");
  revalidatePath(`/events/${id}/registrations`);
  return { success: true, event: result };
}

export async function deleteEventAction(id: string) {
  const session = await requireSession();
  await requirePermission(EVENTS_P.manage);
  await deleteEvent(session.tenantId, session.userId, id);
  revalidatePath("/events");
  return { success: true };
}

export async function updateRegistrationStatusAction(
  id: string,
  status: RegistrationStatus,
  remarks?: string
) {
  const session = await requireSession();
  await requirePermission(EVENTS_P.manage);
  const result = await updateRegistrationStatus(session.tenantId, session.userId, id, status, remarks);
  return { success: true, registration: result };
}

export async function updateRegistrationRemarksAction(id: string, remarks: string) {
  const session = await requireSession();
  await requirePermission(EVENTS_P.manage);
  const result = await updateRegistrationRemarks(session.tenantId, session.userId, id, remarks);
  return { success: true, registration: result };
}

export async function quickCheckInAction(eventId: string, code: string) {
  const session = await requireSession();
  await requirePermission(EVENTS_P.manage);
  return quickCheckInByCode(session.tenantId, session.userId, eventId, code);
}

export async function seedOpeningCeremonyAction() {
  const session = await requireSession();
  await requirePermission(EVENTS_P.manage);
  const result = await seedOpeningCeremonyEvent(session.tenantId, session.userId);
  revalidatePath("/events");
  revalidatePath(`/events/${result.eventId}/registrations`);
  return { success: true, ...result };
}

export async function getMyActivitiesAction(userIdentifier: { email?: string; studentCode?: string }) {
  const session = await requireSession();
  return getUserActivities(session.tenantId, userIdentifier);
}

export async function addIndividualAttendeeAction(
  eventId: string,
  codeOrId: string,
  role: "STUDENT" | "TEACHER" | "EXECUTIVE" = "STUDENT",
  customData?: {
    name?: string;
    position?: string;
    department?: string;
  }
) {
  const session = await requireSession();
  await requirePermission(EVENTS_P.manage);
  const result = await addIndividualAttendee(
    session.tenantId,
    session.userId,
    eventId,
    codeOrId,
    role,
    customData
  );
  revalidatePath(`/events/${eventId}/registrations`);
  return { success: true, registration: result };
}

export async function importPersonnelToEventAction(eventId: string) {
  const session = await requireSession();
  await requirePermission(EVENTS_P.manage);
  const result = await importPersonnelToEvent(session.tenantId, session.userId, eventId);
  revalidatePath(`/events/${eventId}/registrations`);
  return { success: true, ...result };
}

export async function batchAddStudentsToEventAction(
  eventId: string,
  filters: {
    yearLevel?: number;
    major?: string;
    degree?: string;
    department?: string;
    programLanguage?: "ALL" | "THAI" | "ENGLISH";
  }
) {
  const session = await requireSession();
  await requirePermission(EVENTS_P.manage);
  const result = await batchAddStudentsToEvent(session.tenantId, session.userId, eventId, filters);
  revalidatePath(`/events/${eventId}/registrations`);
  return { success: true, ...result };
}

export async function removeAttendeeFromEventAction(eventId: string, registrationId: string) {
  const session = await requireSession();
  await requirePermission(EVENTS_P.manage);
  await removeAttendeeFromEvent(session.tenantId, session.userId, registrationId);
  revalidatePath(`/events/${eventId}/registrations`);
  return { success: true };
}


export async function getEventProjectorDataAction(eventId: string) {
  const tenantId = await resolvePublicTenantId();
  return getEventProjectorData(tenantId, eventId);
}

export async function publicSelfCheckInEventAction(eventId: string, code: string) {
  const tenantId = await resolvePublicTenantId();
  const result = await publicSelfCheckInEvent(tenantId, eventId, code);
  revalidatePath(`/events/${eventId}/registrations`);
  return result;
}


export async function batchImportAttendeesAction(
  eventId: string,
  items: Array<{
    studentCode: string;
    studentName?: string;
    role?: string;
    major?: string;
    department?: string;
    yearLevel?: number;
    remarks?: string;
  }>
) {
  const session = await requireSession();
  await requirePermission(EVENTS_P.manage);
  const result = await batchImportAttendees(session.tenantId, session.userId, eventId, items);
  revalidatePath(`/events/${eventId}/registrations`);
  return { success: true, ...result };
}


export async function getEventEvaluationConfigAction(eventId: string) {
  const tenantId = await resolvePublicTenantId();
  return getEventEvaluationConfig(tenantId, eventId);
}

export async function updateEventEvaluationConfigAction(
  eventId: string,
  data: {
    title: string;
    description?: string;
    isActive?: boolean;
    questions: EvaluationCriterion[];
  }
) {
  const session = await requireSession();
  await requirePermission(EVENTS_P.manage);
  const result = await updateEventEvaluationConfig(session.tenantId, eventId, data);
  revalidatePath(`/events/${eventId}/registrations`);
  return result;
}

export async function submitEventEvaluationAction(
  eventId: string,
  submission: {
    studentCode?: string;
    studentName?: string;
    role?: string;
    ratingLecturer: number;
    ratingContent: number;
    ratingFacility: number;
    ratingTime: number;
    ratingOverall: number;
    customAnswers?: Record<string, unknown>;
    feedback?: string;
  }
) {
  const tenantId = await resolvePublicTenantId();
  const result = await submitEventEvaluation(tenantId, eventId, submission);
  revalidatePath(`/events/${eventId}/registrations`);
  return result;
}

export async function getEventEvaluationStatsAction(eventId: string) {
  const tenantId = await resolvePublicTenantId();
  return getEventEvaluationStats(tenantId, eventId);
}

export async function getStudentActivityTranscriptAction(studentCode: string) {
  const tenantId = await resolvePublicTenantId();
  return getStudentActivityTranscript(tenantId, studentCode);
}
