import { requirePermission } from "@/features/identity/server";
import { ATTENDANCE_P } from "@/features/attendance";
import { getCourseGrades, assertCourseAccess } from "@/features/attendance/server";
import { notFound } from "next/navigation";
import { GradesClient } from "./_components/grades-client";

interface PageProps {
  params: Promise<{ classId: string }>;
}

export default async function ClassGradesPage({ params }: PageProps) {
  const { classId } = await params;
  const ctx = await requirePermission(ATTENDANCE_P.read);

  try {
    await assertCourseAccess(ctx.tenantId, classId, ctx.userId, ctx.isSuperAdmin);
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("NOT_FOUND")) notFound();
    throw err;
  }

  const gradesData = await getCourseGrades(ctx.tenantId, classId, ctx.userId, ctx.isSuperAdmin);
  if (!gradesData || !gradesData.course) notFound();

  return (
    <GradesClient
      course={gradesData.course}
      initialGradingConfig={gradesData.gradingConfig}
      initialStudents={gradesData.students}
      isSuperAdmin={ctx.isSuperAdmin}
    />
  );
}
