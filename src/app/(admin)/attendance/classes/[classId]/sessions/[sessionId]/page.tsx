import { requirePermission } from "@/features/identity/server";
import { ATTENDANCE_P } from "@/features/attendance";
import { getSessionDetail, getClassStudents, assertCourseAccess } from "@/features/attendance/server";
import { notFound } from "next/navigation";
import { TakeAttendanceClient } from "./_components/take-attendance-client";

interface PageProps {
  params: Promise<{ classId: string; sessionId: string }>;
}

export default async function TakeAttendancePage({ params }: PageProps) {
  const { classId, sessionId } = await params;
  const ctx = await requirePermission(ATTENDANCE_P.manage);

  try {
    await assertCourseAccess(ctx.tenantId, classId, ctx.userId, ctx.isSuperAdmin);
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("NOT_FOUND")) notFound();
    throw err;
  }

  const sessionDetail = await getSessionDetail(ctx.tenantId, sessionId);
  if (!sessionDetail || sessionDetail.courseId !== classId) notFound();

  const enrollments = await getClassStudents(ctx.tenantId, classId);

  return (
    <TakeAttendanceClient
      sessionDetail={sessionDetail}
      enrollments={enrollments}
      currentUserName={ctx.userName}
    />
  );
}
