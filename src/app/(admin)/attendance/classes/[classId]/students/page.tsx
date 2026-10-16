import { requirePermission } from "@/features/identity/server";
import { ATTENDANCE_P } from "@/features/attendance";
import { getClassDetail, getClassStudents, assertCourseAccess } from "@/features/attendance/server";
import { notFound } from "next/navigation";
import { StudentsClient } from "./_components/students-client";

interface PageProps {
  params: Promise<{ classId: string }>;
}

export default async function ClassStudentsPage({ params }: PageProps) {
  const { classId } = await params;
  const ctx = await requirePermission(ATTENDANCE_P.manage);

  try {
    await assertCourseAccess(ctx.tenantId, classId, ctx.userId, ctx.isSuperAdmin);
  } catch (err: any) {
    if (err.message?.includes("NOT_FOUND")) notFound();
    throw err;
  }

  const classObj = await getClassDetail(ctx.tenantId, classId);
  if (!classObj) notFound();

  const enrollments = await getClassStudents(ctx.tenantId, classId);

  return (
    <StudentsClient
      classObj={classObj}
      initialEnrollments={enrollments}
      isSuperAdmin={ctx.isSuperAdmin}
    />
  );
}
