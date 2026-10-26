import { requirePermission } from "@/features/identity/server";
import { ATTENDANCE_P } from "@/features/attendance";
import { getSessions, getClassDetail, assertCourseAccess } from "@/features/attendance/server";
import { notFound } from "next/navigation";
import { SessionsClient } from "./_components/sessions-client";

interface PageProps {
  params: Promise<{ classId: string }>;
}

export default async function AttendanceSessionsPage({ params }: PageProps) {
  const { classId } = await params;
  const ctx = await requirePermission(ATTENDANCE_P.manage);

  try {
    await assertCourseAccess(ctx.tenantId, classId, ctx.userId, ctx.isSuperAdmin);
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("NOT_FOUND")) notFound();
    throw err;
  }

  const classObj = await getClassDetail(ctx.tenantId, classId);
  if (!classObj) notFound();

  const items = await getSessions(ctx.tenantId, classId);

  return <SessionsClient initialItems={items} classObj={classObj} isSuperAdmin={ctx.isSuperAdmin} />;
}
