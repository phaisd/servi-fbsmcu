import { resolvePublicTenantId } from "@/features/news/server";
import { getPublicPersonnelList } from "@/features/personnel/server";
import { getPublicCurriculums, getDepartments } from "@/features/curriculum/server";
import { getLocale } from "@/shared/lib/i18n/server";
import { PhilosophyDepartmentClient } from "./_components/philosophy-department-client";

export const metadata = {
  title: "ภาควิชาศาสนาและปรัชญา | คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
  description: "ภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์ มจร - ทำเนียบคณาจารย์ประจำภาควิชา หลักสูตรที่เปิดสอน และผลงานวิจัยวิชาการ",
};

export default async function PhilosophyDepartmentPage() {
  const locale = await getLocale();
  const tenantId = await resolvePublicTenantId();

  const [personnelList, allCurriculums, departments] = await Promise.all([
    getPublicPersonnelList(tenantId),
    getPublicCurriculums(tenantId),
    getDepartments(tenantId),
  ]);

  const philDept = departments.find(
    (d) => d.code === "PHILOSOPHY" || d.nameTh.includes("ปรัชญา")
  );
  const philDeptId = philDept?.id;

  // Filter teachers of Department of Religion and Philosophy
  const teachers = personnelList.filter((p) => {
    const isDeptMatch =
      p.departmentId === philDeptId ||
      (p.department && (p.department.code === "PHILOSOPHY" || p.department.nameTh.includes("ปรัชญา")));
    const isPosMatch = p.positionTh.includes("ปรัชญา") || p.positionTh.includes("ศาสนาและปรัชญา");
    return isDeptMatch || isPosMatch;
  });

  // Filter curriculums of Department of Religion and Philosophy
  const curriculums = allCurriculums.filter((c) => {
    return (
      c.departmentId === philDeptId ||
      c.nameTh.includes("ปรัชญา") ||
      (c.department && (c.department.code === "PHILOSOPHY" || c.department.nameTh.includes("ปรัชญา")))
    );
  });

  return (
    <PhilosophyDepartmentClient
      teachers={teachers}
      curriculums={curriculums}
      locale={locale}
    />
  );
}
