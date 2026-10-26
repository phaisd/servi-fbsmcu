import { requirePermission } from "@/features/identity/server";
import { CURRICULUM_P } from "@/features/curriculum";
import {
  getMasterCourses,
  getCurriculums,
  getDepartments,
} from "@/features/curriculum/server";
import { CoursesAdminClient } from "./_components/courses-admin-client";

export const dynamic = "force-dynamic";

export default async function CoursesAdminPage() {
  const ctx = await requirePermission(CURRICULUM_P.read);
  const [courses, curriculums, departments] = await Promise.all([
    getMasterCourses(ctx.tenantId),
    getCurriculums(ctx.tenantId),
    getDepartments(ctx.tenantId),
  ]);

  return (
    <CoursesAdminClient
      initialItems={courses}
      curriculums={curriculums}
      departments={departments}
    />
  );
}
