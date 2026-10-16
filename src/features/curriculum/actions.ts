"use server";

import { requireSession, requirePermission } from "@/features/identity/server";
import { revalidatePath } from "next/cache";
import { CURRICULUM_P } from "./permissions";
import {
  createCurriculum,
  updateCurriculum,
  deleteCurriculum,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  createTimetable,
  updateTimetable,
  deleteTimetable,
  batchImportTimetables,
  type BatchImportTimetableItem,
  createAcademicCalendar,
  updateAcademicCalendar,
  deleteAcademicCalendar,
  createAcademicCalendarEvent,
  updateAcademicCalendarEvent,
  deleteAcademicCalendarEvent,
} from "./_internal/services";
import {
  curriculumSchema,
  updateCurriculumSchema,
  departmentSchema,
  updateDepartmentSchema,
  timetableSchema,
  updateTimetableSchema,
} from "./_internal/validations";

// ── Curriculum Actions ──

export async function createCurriculumAction(data: unknown) {
  const session = await requireSession();
  await requirePermission(CURRICULUM_P.manage);
  const parsed = curriculumSchema.parse(data);
  const res = await createCurriculum(session.tenantId, session.userId, parsed);
  revalidatePath("/curriculum");
  revalidatePath("/curriculum/departments");
  revalidatePath("/curriculum/timetables");
  revalidatePath("/curriculum/timetables/batch");
  revalidatePath("/portal/programs");
  revalidatePath("/portal/timetables");
  revalidatePath("/timetables");
  return res;
}

export async function updateCurriculumAction(id: string, data: unknown) {
  const session = await requireSession();
  await requirePermission(CURRICULUM_P.manage);
  const parsed = updateCurriculumSchema.parse(data);
  const res = await updateCurriculum(session.tenantId, session.userId, id, parsed);
  revalidatePath("/curriculum");
  revalidatePath("/curriculum/departments");
  revalidatePath("/curriculum/timetables");
  revalidatePath("/curriculum/timetables/batch");
  revalidatePath("/portal/programs");
  revalidatePath("/portal/timetables");
  revalidatePath("/timetables");
  return res;
}

export async function deleteCurriculumAction(id: string) {
  const session = await requireSession();
  await requirePermission(CURRICULUM_P.manage);
  const res = await deleteCurriculum(session.tenantId, session.userId, id);
  revalidatePath("/curriculum");
  revalidatePath("/curriculum/departments");
  revalidatePath("/curriculum/timetables");
  revalidatePath("/curriculum/timetables/batch");
  revalidatePath("/portal/programs");
  revalidatePath("/portal/timetables");
  revalidatePath("/timetables");
  return res;
}

export async function toggleCurriculumActiveAction(id: string, isActive: boolean) {
  const session = await requireSession();
  await requirePermission(CURRICULUM_P.manage);
  const res = await updateCurriculum(session.tenantId, session.userId, id, { isActive });
  revalidatePath("/curriculum");
  revalidatePath("/curriculum/departments");
  revalidatePath("/curriculum/timetables");
  revalidatePath("/curriculum/timetables/batch");
  revalidatePath("/portal/programs");
  revalidatePath("/portal/timetables");
  revalidatePath("/timetables");
  return res;
}

// ── Department / Program / Division Actions ──

export async function createDepartmentAction(data: unknown) {
  const session = await requireSession();
  await requirePermission(CURRICULUM_P.manage);
  const parsed = departmentSchema.parse(data);
  const res = await createDepartment(session.tenantId, session.userId, parsed);
  revalidatePath("/curriculum");
  revalidatePath("/curriculum/departments");
  revalidatePath("/curriculum/timetables");
  revalidatePath("/curriculum/timetables/batch");
  revalidatePath("/portal/programs");
  revalidatePath("/portal/timetables");
  revalidatePath("/timetables");
  return res;
}

export async function updateDepartmentAction(id: string, data: unknown) {
  const session = await requireSession();
  await requirePermission(CURRICULUM_P.manage);
  const parsed = updateDepartmentSchema.parse(data);
  const res = await updateDepartment(session.tenantId, session.userId, id, parsed);
  revalidatePath("/curriculum");
  revalidatePath("/curriculum/departments");
  revalidatePath("/curriculum/timetables");
  revalidatePath("/curriculum/timetables/batch");
  revalidatePath("/portal/programs");
  revalidatePath("/portal/timetables");
  revalidatePath("/timetables");
  return res;
}

export async function deleteDepartmentAction(id: string) {
  const session = await requireSession();
  await requirePermission(CURRICULUM_P.manage);
  const res = await deleteDepartment(session.tenantId, session.userId, id);
  revalidatePath("/curriculum");
  revalidatePath("/curriculum/departments");
  revalidatePath("/curriculum/timetables");
  revalidatePath("/curriculum/timetables/batch");
  revalidatePath("/portal/programs");
  revalidatePath("/portal/timetables");
  revalidatePath("/timetables");
  return res;
}

// ── Timetable Actions ──

export async function createTimetableAction(data: unknown) {
  const session = await requireSession();
  await requirePermission(CURRICULUM_P.manage);
  const parsed = timetableSchema.parse(data);
  const res = await createTimetable(session.tenantId, session.userId, parsed);
  revalidatePath("/curriculum");
  revalidatePath("/curriculum/timetables");
  revalidatePath("/portal/programs");
  revalidatePath("/portal/timetables");
  return res;
}

export async function updateTimetableAction(id: string, data: unknown) {
  const session = await requireSession();
  await requirePermission(CURRICULUM_P.manage);
  const parsed = updateTimetableSchema.parse(data);
  const res = await updateTimetable(session.tenantId, session.userId, id, parsed);
  revalidatePath("/curriculum");
  revalidatePath("/curriculum/timetables");
  revalidatePath("/portal/programs");
  revalidatePath("/portal/timetables");
  return res;
}

export async function deleteTimetableAction(id: string) {
  const session = await requireSession();
  await requirePermission(CURRICULUM_P.manage);
  const res = await deleteTimetable(session.tenantId, session.userId, id);
  revalidatePath("/curriculum");
  revalidatePath("/curriculum/timetables");
  revalidatePath("/portal/programs");
  revalidatePath("/portal/timetables");
  return res;
}

export async function toggleTimetableActiveAction(id: string, isActive: boolean) {
  const session = await requireSession();
  await requirePermission(CURRICULUM_P.manage);
  const res = await updateTimetable(session.tenantId, session.userId, id, { isActive });
  revalidatePath("/curriculum");
  revalidatePath("/curriculum/timetables");
  revalidatePath("/portal/programs");
  revalidatePath("/portal/timetables");
  return res;
}

export async function batchImportTimetablesAction(items: BatchImportTimetableItem[]) {
  const session = await requireSession();
  await requirePermission(CURRICULUM_P.manage);
  const res = await batchImportTimetables(session.tenantId, session.userId, items);
  revalidatePath("/curriculum");
  revalidatePath("/curriculum/timetables");
  revalidatePath("/portal/programs");
  revalidatePath("/portal/timetables");
  return res;
}

// ── Academic Calendar Actions ──

export async function createAcademicCalendarAction(data: {
  academicYear: string;
  title: string;
  titleTh?: string;
  degreeLevel?: string;
  authority?: string;
  announcedDate?: string;
  signatory?: string;
  description?: string;
}) {
  const session = await requireSession();
  await requirePermission(CURRICULUM_P.manage);
  const res = await createAcademicCalendar(session.tenantId, session.userId, data);
  revalidatePath("/curriculum/calendar");
  revalidatePath("/attendance/classes");
  return { success: true, calendar: res };
}

export async function updateAcademicCalendarAction(id: string, data: any) {
  const session = await requireSession();
  await requirePermission(CURRICULUM_P.manage);
  const res = await updateAcademicCalendar(session.tenantId, session.userId, id, data);
  revalidatePath("/curriculum/calendar");
  revalidatePath("/attendance/classes");
  return { success: true, calendar: res };
}

export async function deleteAcademicCalendarAction(id: string) {
  const session = await requireSession();
  await requirePermission(CURRICULUM_P.manage);
  const res = await deleteAcademicCalendar(session.tenantId, session.userId, id);
  revalidatePath("/curriculum/calendar");
  revalidatePath("/attendance/classes");
  return { success: true, ...res };
}

export async function createAcademicCalendarEventAction(data: {
  calendarId: string;
  semester: number;
  semesterLabel: string;
  titleEn: string;
  titleTh?: string;
  startDate: string;
  endDate: string;
  dateDisplayEn: string;
  dateDisplayTh?: string;
  eventType?: string;
  description?: string;
  orderIndex?: number;
}) {
  const session = await requireSession();
  await requirePermission(CURRICULUM_P.manage);
  const res = await createAcademicCalendarEvent(session.tenantId, session.userId, data);
  revalidatePath("/curriculum/calendar");
  revalidatePath("/attendance/classes");
  return { success: true, event: res };
}

export async function updateAcademicCalendarEventAction(id: string, data: any) {
  const session = await requireSession();
  await requirePermission(CURRICULUM_P.manage);
  const res = await updateAcademicCalendarEvent(session.tenantId, session.userId, id, data);
  revalidatePath("/curriculum/calendar");
  revalidatePath("/attendance/classes");
  return { success: true, event: res };
}

export async function deleteAcademicCalendarEventAction(id: string) {
  const session = await requireSession();
  await requirePermission(CURRICULUM_P.manage);
  const res = await deleteAcademicCalendarEvent(session.tenantId, session.userId, id);
  revalidatePath("/curriculum/calendar");
  revalidatePath("/attendance/classes");
  return { success: true, ...res };
}



