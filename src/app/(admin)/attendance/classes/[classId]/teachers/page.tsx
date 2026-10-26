import { requirePermission } from "@/features/identity/server";
import { ATTENDANCE_P } from "@/features/attendance";
import {
  getClassDetail,
  getCourseTeachers,
  getAvailableTeachers,
  assertCourseAccess,
} from "@/features/attendance/server";
import { notFound } from "next/navigation";
import { TeachersClient } from "./_components/teachers-client";

interface PageProps {
  params: Promise<{ classId: string }>;
}

export default async function CourseTeachersPage({ params }: PageProps) {
  const { classId } = await params;
  const ctx = await requirePermission(ATTENDANCE_P.manage);

  let access;
  try {
    access = await assertCourseAccess(ctx.tenantId, classId, ctx.userId, ctx.isSuperAdmin);
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("NOT_FOUND")) notFound();
    throw err;
  }

  const course = await getClassDetail(ctx.tenantId, classId);
  if (!course) notFound();

  const [assignedTeachers, availableTeachers] = await Promise.all([
    getCourseTeachers(ctx.tenantId, classId),
    getAvailableTeachers(ctx.tenantId),
  ]);

  return (
    <TeachersClient
      course={course}
      assignedTeachers={assignedTeachers}
      availableTeachers={availableTeachers}
      isPrimary={access.isPrimary}
      currentUserId={ctx.userId}
    />
  );
}
