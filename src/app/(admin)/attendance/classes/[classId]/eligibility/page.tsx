import { requirePermission } from "@/features/identity/server";
import { ATTENDANCE_P } from "@/features/attendance";
import { getClassEligibilityReport, assertCourseAccess } from "@/features/attendance/server";
import { notFound } from "next/navigation";
import { EligibilityReportClient } from "./_components/eligibility-client";

interface PageProps {
  params: Promise<{ classId: string }>;
}

export default async function ClassEligibilityPage({ params }: PageProps) {
  const { classId } = await params;
  const ctx = await requirePermission(ATTENDANCE_P.read);

  try {
    await assertCourseAccess(ctx.tenantId, classId, ctx.userId, ctx.isSuperAdmin);
  } catch (err: any) {
    if (err.message?.includes("NOT_FOUND")) notFound();
    throw err;
  }

  const report = await getClassEligibilityReport(ctx.tenantId, classId);
  if (!report || !report.classObj) notFound();

  return (
    <EligibilityReportClient
      classObj={report.classObj}
      summaries={report.summaries}
      stats={report.stats}
    />
  );
}
