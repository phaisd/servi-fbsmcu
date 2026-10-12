import { requirePermission } from "@/features/identity/server";
import { CURRICULUM_P } from "@/features/curriculum";
import { getTimetables, getCurriculums, getDepartments } from "@/features/curriculum/server";
import { BatchImportExportClient } from "./_components/batch-import-export-client";

export const dynamic = "force-dynamic";

export default async function BatchTimetablesPage() {
  const ctx = await requirePermission(CURRICULUM_P.manage);
  const [timetables, curriculums, departments] = await Promise.all([
    getTimetables(ctx.tenantId),
    getCurriculums(ctx.tenantId),
    getDepartments(ctx.tenantId),
  ]);

  return (
    <BatchImportExportClient
      timetables={timetables}
      curriculums={curriculums}
      departments={departments}
    />
  );
}
