"use server";

import { requireSession, requirePermission, getSessionContext } from "@/features/identity/server";
import { resolvePublicTenantId } from "@/features/news/server";
import { ATTENDANCE_P } from "./permissions";
import {
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseDetail,
  enrollStudentInCourse,
  removeStudentFromCourse,
  batchRemoveStudentsFromCourse,
  batchEnrollStudents,
  createClassSession,
  updateClassSession,
  deleteClassSession,
  generateRollingQrToken,
  getSessionScannedStudents,
  verifyAndCheckInWithQr,
  getPublicSessionForCheckIn,
  batchSaveAttendance,
  lockSession,
  unlockSession,
  getSessionAuditLogs,
  getCourseEligibilityReport,
  assertCourseAccess,
  assignCourseTeacher,
  removeCourseTeacher,
  getAvailableTeachers,
  archiveCourse,
  restoreCourse,
  getAvailableTimetablesForSync,
  syncCoursesFromTimetable,
  getAvailableStudentsForCohort,
  enrollCohortStudents,
  sendAtRiskWarningNotifications,
  getStudentPersonalAttendance,
  getCourseAttendanceMatrix,
  updateCourseCalculationRules,
  getCourseGrades,
  batchUpdateCourseGrades,
  updateCourseGradingConfig,
  createOrUpdateStudent,
  deleteStudent,
  batchImportStudents,
  updateStudentStudyStatus,
  getAvailableCoursesForStudent,
  studentSelfEnrollCourses,
} from "./_internal/services";

import {
  courseSchema,
  updateCourseSchema,
  enrollStudentSchema,
  classSessionSchema,
  updateSessionSchema,
  batchAttendanceRecordSchema,
  lockSessionSchema,
  unlockSessionSchema,
  assignTeacherSchema,
  syncTimetableSchema,
} from "./_internal/validations";
import { revalidatePath } from "next/cache";


export async function createCourseAction(data: unknown) {
  const session = await requireSession();
  await requirePermission(ATTENDANCE_P.manage);
  const parsed = courseSchema.parse(data);
  const result = await createCourse(session.tenantId, session.userId, parsed);
  revalidatePath("/attendance/classes");
  return { success: true, course: result, class: result };
}

export const createClassAction = createCourseAction;

export async function updateCourseAction(courseId: string, data: unknown) {
  const session = await requireSession();
  await requirePermission(ATTENDANCE_P.manage);
  await assertCourseAccess(session.tenantId, courseId, session.userId, session.isSuperAdmin);
  const parsed = updateCourseSchema.parse(data);
  const result = await updateCourse(session.tenantId, session.userId, courseId, parsed);
  revalidatePath(`/attendance/classes/${courseId}`);
  revalidatePath("/attendance/classes");
  return { success: true, course: result, class: result };
}

export const updateClassAction = updateCourseAction;

export async function deleteCourseAction(courseId: string) {
  const session = await requireSession();
  await requirePermission(ATTENDANCE_P.manage);
  await assertCourseAccess(session.tenantId, courseId, session.userId, session.isSuperAdmin);
  const result = await deleteCourse(session.tenantId, session.userId, courseId);
  revalidatePath("/attendance/classes");
  return result;
}

export const deleteClassAction = deleteCourseAction;

export async function enrollStudentAction(data: unknown) {
  const session = await requireSession();
  await requirePermission(ATTENDANCE_P.manage);
  const raw: any = data;
  const courseId = raw.courseId || raw.classId;
  const parsed = enrollStudentSchema.parse({ ...raw, courseId });
  await assertCourseAccess(session.tenantId, parsed.courseId, session.userId, session.isSuperAdmin);
  const result = await enrollStudentInCourse(session.tenantId, session.userId, parsed.courseId, parsed);
  revalidatePath(`/attendance/classes/${parsed.courseId}/students`);
  return { success: true, enrollment: result };
}

export async function removeStudentAction(courseId: string, enrollmentId: string) {
  const session = await requireSession();
  await requirePermission(ATTENDANCE_P.manage);
  await assertCourseAccess(session.tenantId, courseId, session.userId, session.isSuperAdmin);
  const result = await removeStudentFromCourse(session.tenantId, session.userId, courseId, enrollmentId);
  revalidatePath(`/attendance/classes/${courseId}/students`);
  return { success: true, result };
}

export async function batchRemoveStudentsAction(courseId: string, enrollmentIds?: string[]) {
  const session = await requireSession();
  await requirePermission(ATTENDANCE_P.manage);
  await assertCourseAccess(session.tenantId, courseId, session.userId, session.isSuperAdmin);
  const result = await batchRemoveStudentsFromCourse(session.tenantId, session.userId, courseId, enrollmentIds);
  revalidatePath(`/attendance/classes/${courseId}/students`);
  return result;
}

export async function batchEnrollStudentsAction(courseId: string, students: any[]) {
  const session = await requireSession();
  await requirePermission(ATTENDANCE_P.manage);
  await assertCourseAccess(session.tenantId, courseId, session.userId, session.isSuperAdmin);
  const result = await batchEnrollStudents(session.tenantId, session.userId, courseId, students);
  revalidatePath(`/attendance/classes/${courseId}/students`);
  return { success: true, ...result };
}

export async function createSessionAction(data: unknown) {
  const session = await requireSession();
  await requirePermission(ATTENDANCE_P.manage);
  const raw: any = data;
  const courseId = raw.courseId || raw.classId;
  const parsed = classSessionSchema.parse({ ...raw, courseId });
  await assertCourseAccess(session.tenantId, parsed.courseId, session.userId, session.isSuperAdmin);
  const result = await createClassSession(session.tenantId, session.userId, parsed);
  revalidatePath(`/attendance/classes/${parsed.courseId}/sessions`);
  return { success: true, session: result };
}

export async function updateSessionAction(courseId: string, sessionId: string, data: unknown) {
  const session = await requireSession();
  await requirePermission(ATTENDANCE_P.manage);
  await assertCourseAccess(session.tenantId, courseId, session.userId, session.isSuperAdmin);
  const parsed = updateSessionSchema.parse(data);
  const result = await updateClassSession(session.tenantId, session.userId, sessionId, parsed);
  revalidatePath(`/attendance/classes/${courseId}/sessions`);
  revalidatePath(`/attendance/classes/${courseId}/sessions/${sessionId}`);
  return { success: true, session: result };
}

export async function deleteClassSessionAction(courseId: string, sessionId: string) {
  const session = await requireSession();
  await requirePermission(ATTENDANCE_P.manage);
  await assertCourseAccess(session.tenantId, courseId, session.userId, session.isSuperAdmin);
  const result = await deleteClassSession(session.tenantId, session.userId, sessionId);
  revalidatePath(`/attendance/classes/${courseId}/sessions`);
  revalidatePath(`/attendance/classes/${courseId}/eligibility`);
  return result;
}

export const deleteSessionAction = deleteClassSessionAction;

export async function generateRollingQrTokenAction(courseId: string, sessionId: string) {
  const session = await requireSession();
  await requirePermission(ATTENDANCE_P.manage);
  await assertCourseAccess(session.tenantId, courseId, session.userId, session.isSuperAdmin);
  const tokenData = await generateRollingQrToken(session.tenantId, sessionId);
  return { success: true, ...tokenData };
}

export async function getSessionScannedStudentsAction(courseId: string, sessionId: string) {
  const session = await requireSession();
  await requirePermission(ATTENDANCE_P.manage);
  await assertCourseAccess(session.tenantId, courseId, session.userId, session.isSuperAdmin);
  const data = await getSessionScannedStudents(session.tenantId, sessionId);
  return { success: true, ...data };
}

export async function studentCheckInWithQrAction(data: {
  sessionId: string;
  studentCode: string;
  token: string;
  step?: number;
}) {
  const result = await verifyAndCheckInWithQr(data);
  return result;
}

export async function getPublicSessionForCheckInAction(sessionId: string) {
  const session = await getPublicSessionForCheckIn(sessionId);
  if (!session) return { success: false, session: null };
  return { success: true, session };
}

export async function batchSaveAttendanceAction(courseId: string, data: unknown) {
  const session = await requireSession();
  await requirePermission(ATTENDANCE_P.manage);
  await assertCourseAccess(session.tenantId, courseId, session.userId, session.isSuperAdmin);
  const parsed = batchAttendanceRecordSchema.parse(data);
  const result = await batchSaveAttendance(
    session.tenantId,
    session.userId,
    session.userName || "อาจารย์ผู้สอน",
    parsed.sessionId,
    parsed.records,
    parsed.reason
  );
  revalidatePath(`/attendance/classes/${courseId}/sessions/${parsed.sessionId}`);
  revalidatePath(`/attendance/classes/${courseId}/eligibility`);
  return { success: true, records: result };
}

export async function lockSessionAction(courseId: string, sessionId: string) {
  const session = await requireSession();
  await requirePermission(ATTENDANCE_P.manage);
  await assertCourseAccess(session.tenantId, courseId, session.userId, session.isSuperAdmin);
  const result = await lockSession(
    session.tenantId,
    session.userId,
    session.userName || "อาจารย์ผู้สอน",
    sessionId
  );
  revalidatePath(`/attendance/classes/${courseId}/sessions`);
  revalidatePath(`/attendance/classes/${courseId}/sessions/${sessionId}`);
  return { success: true, session: result };
}

export async function unlockSessionAction(courseId: string, sessionId: string, reason: string) {
  const session = await requireSession();
  await requirePermission(ATTENDANCE_P.manage);
  await assertCourseAccess(session.tenantId, courseId, session.userId, session.isSuperAdmin);
  const parsed = unlockSessionSchema.parse({ sessionId, reason });
  const result = await unlockSession(
    session.tenantId,
    session.userId,
    session.userName || "อาจารย์ผู้สอน",
    parsed.sessionId,
    parsed.reason
  );
  revalidatePath(`/attendance/classes/${courseId}/sessions`);
  revalidatePath(`/attendance/classes/${courseId}/sessions/${sessionId}`);
  return { success: true, session: result };
}

export async function getSessionAuditLogsAction(courseId: string, sessionId: string) {
  const session = await requireSession();
  await requirePermission(ATTENDANCE_P.manage);
  await assertCourseAccess(session.tenantId, courseId, session.userId, session.isSuperAdmin);
  const logs = await getSessionAuditLogs(session.tenantId, sessionId);
  return { success: true, logs };
}

export async function assignCourseTeacherAction(data: unknown) {
  const session = await requireSession();
  await requirePermission(ATTENDANCE_P.manage);
  const parsed = assignTeacherSchema.parse(data);
  const { isPrimary } = await assertCourseAccess(
    session.tenantId,
    parsed.courseId,
    session.userId,
    session.isSuperAdmin
  );
  if (!isPrimary && !session.isSuperAdmin) {
    throw new Error("FORBIDDEN: เฉพาะอาจารย์ผู้รับผิดชอบหลักหรือผู้ดูแลระบบเท่านั้นที่สามารถมอบหมายผู้สอนได้");
  }
  const result = await assignCourseTeacher(session.tenantId, session.userId, parsed.courseId, parsed);
  revalidatePath(`/attendance/classes/${parsed.courseId}`);
  revalidatePath(`/attendance/classes/${parsed.courseId}/teachers`);
  return { success: true, teacher: result };
}

export async function removeCourseTeacherAction(courseId: string, teacherUserId: string) {
  const session = await requireSession();
  await requirePermission(ATTENDANCE_P.manage);
  const { isPrimary } = await assertCourseAccess(
    session.tenantId,
    courseId,
    session.userId,
    session.isSuperAdmin
  );
  if (!isPrimary && !session.isSuperAdmin) {
    throw new Error("FORBIDDEN: เฉพาะอาจารย์ผู้รับผิดชอบหลักหรือผู้ดูแลระบบเท่านั้นที่สามารถถอดถอนผู้สอนได้");
  }
  const result = await removeCourseTeacher(session.tenantId, session.userId, courseId, teacherUserId);
  revalidatePath(`/attendance/classes/${courseId}`);
  revalidatePath(`/attendance/classes/${courseId}/teachers`);
  return result;
}

export async function getAvailableTeachersAction() {
  const session = await requireSession();
  await requirePermission(ATTENDANCE_P.manage);
  const teachers = await getAvailableTeachers(session.tenantId);
  return { success: true, teachers };
}

export async function archiveCourseAction(courseId: string) {
  const session = await requireSession();
  await requirePermission(ATTENDANCE_P.manage);
  const { isPrimary } = await assertCourseAccess(
    session.tenantId,
    courseId,
    session.userId,
    session.isSuperAdmin
  );
  if (!isPrimary && !session.isSuperAdmin) {
    throw new Error("FORBIDDEN: เฉพาะอาจารย์ผู้รับผิดชอบหลักหรือผู้ดูแลระบบเท่านั้นที่สามารถปิดภาคเรียนได้");
  }
  const result = await archiveCourse(session.tenantId, session.userId, courseId);
  revalidatePath("/attendance/classes");
  revalidatePath("/attendance");
  return { success: true, course: result };
}

export async function restoreCourseAction(courseId: string) {
  const session = await requireSession();
  await requirePermission(ATTENDANCE_P.manage);
  const { isPrimary } = await assertCourseAccess(
    session.tenantId,
    courseId,
    session.userId,
    session.isSuperAdmin
  );
  if (!isPrimary && !session.isSuperAdmin) {
    throw new Error("FORBIDDEN: เฉพาะอาจารย์ผู้รับผิดชอบหลักหรือผู้ดูแลระบบเท่านั้นที่สามารถเปิดใช้งานวิชาใหม่ได้");
  }
  const result = await restoreCourse(session.tenantId, session.userId, courseId);
  revalidatePath("/attendance/classes");
  revalidatePath("/attendance");
  return { success: true, course: result };
}

export async function getAvailableTimetablesForSyncAction(filters?: {
  academicYear?: string;
  semester?: number;
}) {
  const session = await requireSession();
  await requirePermission(ATTENDANCE_P.manage);
  const timetables = await getAvailableTimetablesForSync(session.tenantId, filters);
  return { success: true, timetables };
}

export async function syncCoursesFromTimetableAction(data: unknown) {
  const session = await requireSession();
  await requirePermission(ATTENDANCE_P.manage);
  const parsed = syncTimetableSchema.parse(data);
  const result = await syncCoursesFromTimetable(session.tenantId, session.userId, parsed);
  revalidatePath("/attendance/classes");
  revalidatePath("/attendance");
  return result;
}

export async function getAvailableStudentsForCohortAction(
  courseId: string,
  filters?: { yearLevel?: number; department?: string; search?: string }
) {
  const session = await requireSession();
  await requirePermission(ATTENDANCE_P.manage);
  await assertCourseAccess(session.tenantId, courseId, session.userId, session.isSuperAdmin);
  const result = await getAvailableStudentsForCohort(session.tenantId, courseId, filters);
  return { success: true, ...result };
}

export async function enrollCohortStudentsAction(courseId: string, studentIds: string[]) {
  const session = await requireSession();
  await requirePermission(ATTENDANCE_P.manage);
  await assertCourseAccess(session.tenantId, courseId, session.userId, session.isSuperAdmin);
  const result = await enrollCohortStudents(session.tenantId, session.userId, courseId, studentIds);
  revalidatePath(`/attendance/classes/${courseId}/students`);
  revalidatePath(`/attendance/classes/${courseId}`);
  return result;
}

export async function sendAtRiskWarningAction(courseId: string, studentIds?: string[]) {
  const session = await requireSession();
  await requirePermission(ATTENDANCE_P.manage);
  await assertCourseAccess(session.tenantId, courseId, session.userId, session.isSuperAdmin);
  const result = await sendAtRiskWarningNotifications(session.tenantId, session.userId, courseId, studentIds);
  revalidatePath(`/attendance/classes/${courseId}/eligibility`);
  return result;
}

export async function getStudentPersonalAttendanceAction(studentCode: string) {
  const session = await getSessionContext();
  const tenantId = session?.tenantId || (await resolvePublicTenantId());
  const result = await getStudentPersonalAttendance(tenantId, studentCode);
  return result;
}

export async function getCourseAttendanceMatrixAction(courseId: string) {
  const session = await requireSession();
  await requirePermission(ATTENDANCE_P.manage);
  await assertCourseAccess(session.tenantId, courseId, session.userId, session.isSuperAdmin);
  const result = await getCourseAttendanceMatrix(
    session.tenantId,
    courseId,
    session.userId,
    session.isSuperAdmin
  );
  return { success: true, ...result };
}

export async function updateCourseCalculationRulesAction(
  courseId: string,
  rules: { minPercent: number; lateCountsAsFull: boolean; excuseDeductsDenominator: boolean }
) {
  const session = await requireSession();
  await requirePermission(ATTENDANCE_P.manage);
  await assertCourseAccess(session.tenantId, courseId, session.userId, session.isSuperAdmin);
  const result = await updateCourseCalculationRules(
    session.tenantId,
    session.userId,
    courseId,
    rules
  );
  revalidatePath(`/attendance/classes/${courseId}/eligibility`);
  revalidatePath(`/attendance/classes/${courseId}`);
  revalidatePath("/attendance/classes");
  return { success: true, course: result };
}

export async function batchUpdateCourseGradesAction(
  courseId: string,
  items: Array<{
    enrollmentId: string;
    assignmentScore?: number | null;
    midtermScore?: number | null;
    affectiveScore?: number | null;
    finalScore?: number | null;
    totalScore?: number | null;
    grade?: string | null;
    gradeRemarks?: string | null;
  }>
) {
  const session = await requireSession();
  await requirePermission(ATTENDANCE_P.manage);
  await assertCourseAccess(session.tenantId, courseId, session.userId, session.isSuperAdmin);

  const result = await batchUpdateCourseGrades(
    session.tenantId,
    session.userId,
    courseId,
    items
  );

  revalidatePath(`/attendance/classes/${courseId}/grades`);
  revalidatePath(`/attendance/classes/${courseId}`);
  return result;
}

export async function updateCourseGradingConfigAction(
  courseId: string,
  config: {
    assignmentMax: number;
    midtermMax: number;
    affectiveMax: number;
    finalMax: number;
  }
) {
  const session = await requireSession();
  await requirePermission(ATTENDANCE_P.manage);
  await assertCourseAccess(session.tenantId, courseId, session.userId, session.isSuperAdmin);

  const result = await updateCourseGradingConfig(
    session.tenantId,
    session.userId,
    courseId,
    config
  );

  revalidatePath(`/attendance/classes/${courseId}/grades`);
  return { success: true, course: result };
}

export async function createOrUpdateStudentAction(data: {
  id?: string;
  studentCode: string;
  title?: string | null;
  firstName: string;
  lastName: string;
  yearLevel: number;
  department?: string | null;
  degree?: string | null;
  curriculumName?: string | null;
  major?: string | null;
  faculty?: string | null;
  studyStatus?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  gender?: string | null;
  nationality?: string | null;
  country?: string | null;
  address?: string | null;
}) {
  const session = await requireSession();
  await requirePermission(ATTENDANCE_P.manage);

  const result = await createOrUpdateStudent(session.tenantId, session.userId, data);
  revalidatePath("/attendance/students");
  revalidatePath("/attendance/classes");
  return { success: true, student: result };
}

export async function deleteStudentAction(studentId: string) {
  const session = await requireSession();
  await requirePermission(ATTENDANCE_P.manage);

  const result = await deleteStudent(session.tenantId, session.userId, studentId);
  revalidatePath("/attendance/students");
  revalidatePath("/attendance/classes");
  return result;
}

export async function batchImportStudentsAction(items: any[]) {
  const session = await requireSession();
  await requirePermission(ATTENDANCE_P.manage);

  const result = await batchImportStudents(session.tenantId, session.userId, items);
  revalidatePath("/attendance/students");
  revalidatePath("/attendance/classes");
  return result;
}




export async function updateStudentStudyStatusAction(studentId: string, studyStatus: string) {
  const session = await requireSession();
  await requirePermission(ATTENDANCE_P.manage);

  const result = await updateStudentStudyStatus(session.tenantId, session.userId, studentId, studyStatus);
  revalidatePath("/attendance/students");
  revalidatePath("/attendance/classes");
  return { success: true, student: result };
}

/**
 * ดึงรายวิชาที่เปิดสอนสำหรับให้นิสิตค้นหาและเลือกเข้าเรียนใน Student Portal
 */
export async function getAvailableCoursesForStudentAction(studentCode?: string, term?: string) {
  const session = await getSessionContext();
  const tenantId = session?.tenantId || (await resolvePublicTenantId());
  const result = await getAvailableCoursesForStudent(tenantId, studentCode, term);
  return result;
}

/**
 * นิสิตลงทะเบียนรายวิชาเข้าชั้นเรียนด้วยตนเอง (หรือผ่านการสแกนสลิป/ใบลงทะเบียน)
 */
export async function studentSelfEnrollCoursesAction(data: {
  studentCode: string;
  courseIds: string[];
  notes?: string;
  studentProfile?: {
    firstName?: string;
    lastName?: string;
    title?: string;
    degree?: string;
    department?: string;
    major?: string;
    yearLevel?: number;
  };
}) {
  const session = await getSessionContext();
  const tenantId = session?.tenantId || (await resolvePublicTenantId());
  const result = await studentSelfEnrollCourses(
    tenantId,
    data.studentCode,
    data.courseIds,
    data.notes,
    data.studentProfile,
    session?.userId
  );
  revalidatePath("/portal/attendance");
  revalidatePath("/attendance/classes");
  return result;
}
