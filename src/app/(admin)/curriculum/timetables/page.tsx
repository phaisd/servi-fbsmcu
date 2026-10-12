import { requirePermission } from "@/features/identity/server";
import { CURRICULUM_P } from "@/features/curriculum";
import { getTimetables, getCurriculums, getDepartments } from "@/features/curriculum/server";
import { TimetablesAdminClient } from "./_components/timetables-admin-client";

export const dynamic = "force-dynamic";

export default async function TimetablesAdminPage() {
  const ctx = await requirePermission(CURRICULUM_P.read);
  const [timetables, curriculums, departments] = await Promise.all([
    getTimetables(ctx.tenantId),
    getCurriculums(ctx.tenantId),
    getDepartments(ctx.tenantId),
  ]);

  return (
    <TimetablesAdminClient
      initialItems={timetables}
      curriculums={curriculums}
      departments={departments}
    />
  );
}
