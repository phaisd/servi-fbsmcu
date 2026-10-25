import { resolvePublicTenantId } from "@/features/news/server";
import { getPublicPersonnelList } from "@/features/personnel/server";
import { getPublicCurriculums, getDepartments } from "@/features/curriculum/server";
import { getLocale } from "@/shared/lib/i18n/server";
import { BuddhismDepartmentClient } from "./_components/buddhism-department-client";

export const metadata = {
  title: "ภาควิชาพระพุทธศาสนา | คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
  description: "ภาควิชาพระพุทธศาสนา คณะพุทธศาสตร์ มจร - ทำเนียบคณาจารย์ประจำภาควิชา หลักสูตรที่เปิดสอน และผลงานวิจัยวิชาการ",
};

export default async function BuddhismDepartmentPage() {
  const locale = await getLocale();
  const tenantId = await resolvePublicTenantId();

  const [personnelList, allCurriculums, departments] = await Promise.all([
    getPublicPersonnelList(tenantId),
    getPublicCurriculums(tenantId),
    getDepartments(tenantId),
  ]);

  const buddhismDept = departments.find((d) => d.nameTh.includes("พระพุทธศาสนา"));
  const buddhismDeptId = buddhismDept?.id;

  // กรองเฉพาะคณาจารย์ประจำภาควิชาพระพุทธศาสนา
  const teachers = personnelList.filter((p) => {
    const isDeptMatch = p.departmentId === buddhismDeptId || p.department?.nameTh.includes("พระพุทธศาสนา");
    const isPosMatch = p.positionTh.includes("พระพุทธศาสนา");
    return isDeptMatch || isPosMatch;
  });

  // กรองเฉพาะหลักสูตรของภาควิชาพระพุทธศาสนา
  const curriculums = allCurriculums.filter((c) => {
    return (
      c.departmentId === buddhismDeptId ||
      c.nameTh.includes("พระพุทธศาสนา") ||
      (c.department && c.department.nameTh.includes("พระพุทธศาสนา"))
    );
  });

  return (
    <BuddhismDepartmentClient
      teachers={teachers}
      curriculums={curriculums}
      locale={locale}
    />
  );
}
