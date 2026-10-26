import { requirePermission } from "@/features/identity/server";
import { CURRICULUM_P } from "@/features/curriculum";
import { getTimetablePeriods } from "@/features/curriculum/server";
import { TimetablePeriodsPageClient } from "./_components/timetable-periods-page-client";

export const dynamic = "force-dynamic";

export default async function TimetablePeriodsAdminPage() {
  const ctx = await requirePermission(CURRICULUM_P.read);
  const periods = await getTimetablePeriods(ctx.tenantId);

  return <TimetablePeriodsPageClient initialPeriods={periods} />;
}
