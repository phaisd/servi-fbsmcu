import { resolvePublicTenantId } from "@/features/news/server";
import { getPublicPersonnelList } from "@/features/personnel/server";
import { getPublicCurriculums, getDepartments } from "@/features/curriculum/server";
import { getLocale } from "@/shared/lib/i18n/server";
import { PaliDepartmentClient } from "./_components/pali-department-client";

export const metadata = {
  title: "ภาควิชาบาลีและสันสกฤต | คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
  description: "ภาควิชาบาลีและสันสกฤต คณะพุทธศาสตร์ มจร - ทำเนียบคณาจารย์ประจำภาควิชา หลักสูตรที่เปิดสอน และผลงานวิจัยวิชาการ",
};

export default async function PaliDepartmentPage() {
  const locale = await getLocale();
  const tenantId = await resolvePublicTenantId();

  const [personnelList, allCurriculums, departments] = await Promise.all([
    getPublicPersonnelList(tenantId),
    getPublicCurriculums(tenantId),
    getDepartments(tenantId),
  ]);

  const paliDept = departments.find(
    (d) => d.code === "PALI_SANSKRIT" || d.nameTh.includes("บาลี")
  );
  const paliDeptId = paliDept?.id;

  // Filter teachers of Department of Pali and Sanskrit
  const teachers = personnelList.filter((p) => {
    const isDeptMatch =
      p.departmentId === paliDeptId ||
      (p.department && (p.department.code === "PALI_SANSKRIT" || p.department.nameTh.includes("บาลี")));
    const isPosMatch = p.positionTh.includes("บาลี") || p.positionTh.includes("สันสกฤต");
    return isDeptMatch || isPosMatch;
  });

  // Filter curriculums of Department of Pali and Sanskrit
  const curriculums = allCurriculums.filter((c) => {
    return (
      c.departmentId === paliDeptId ||
      c.nameTh.includes("บาลี") ||
      c.nameTh.includes("สันสกฤต") ||
      (c.department && (c.department.code === "PALI_SANSKRIT" || c.department.nameTh.includes("บาลี")))
    );
  });

  return (
    <PaliDepartmentClient
      teachers={teachers}
      curriculums={curriculums}
      locale={locale}
    />
  );
}
