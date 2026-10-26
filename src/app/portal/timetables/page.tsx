import { resolvePublicTenantId } from "@/features/news/server";
import {
  getPublicTimetables,
  getPublicCurriculums,
  getDepartments,
  getTimetablePeriods,
} from "@/features/curriculum/server";
import { getLocale } from "@/shared/lib/i18n/server";
import { TimetablesPortalClient } from "./_components/timetables-portal-client";

export const dynamic = "force-dynamic";

export default async function PublicTimetablesPage() {
  const locale = await getLocale();
  const tenantId = await resolvePublicTenantId();

  const [timetables, curriculums, departments, periods] = await Promise.all([
    getPublicTimetables(tenantId),
    getPublicCurriculums(tenantId),
    getDepartments(tenantId),
    getTimetablePeriods(tenantId),
  ]);

  return (
    <TimetablesPortalClient
      initialItems={timetables}
      curriculums={curriculums}
      departments={departments}
      periods={periods}
      locale={locale}
    />
  );
}
