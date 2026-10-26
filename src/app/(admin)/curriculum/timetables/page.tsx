import { requirePermission } from "@/features/identity/server";
import { CURRICULUM_P } from "@/features/curriculum";
import {
  getTimetables,
  getCurriculums,
  getDepartments,
  getTimetablePeriods,
  getMasterCourses,
} from "@/features/curriculum/server";
import { TimetablesAdminClient } from "./_components/timetables-admin-client";

export const dynamic = "force-dynamic";

export default async function TimetablesAdminPage() {
  const ctx = await requirePermission(CURRICULUM_P.read);
  const [timetables, curriculums, departments, periods, masterCourses] = await Promise.all([
    getTimetables(ctx.tenantId),
    getCurriculums(ctx.tenantId),
    getDepartments(ctx.tenantId),
    getTimetablePeriods(ctx.tenantId),
    getMasterCourses(ctx.tenantId),
  ]);

  return (
    <TimetablesAdminClient
      initialItems={timetables}
      curriculums={curriculums}
      departments={departments}
      initialPeriods={periods}
      masterCourses={masterCourses}
    />
  );
}
