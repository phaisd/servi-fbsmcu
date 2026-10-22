import { requirePermission } from "@/features/identity/server";
import { ATTENDANCE_P } from "@/features/attendance";
import { getAllStudentsDirectory } from "@/features/attendance/server";
import { StudentsDirectoryClient } from "../attendance/students/_components/students-directory-client";

export const metadata = {
  title: "ระบบทะเบียนประวัตินิสิตส่วนกลาง (Central Student Directory)",
};

export default async function CentralStudentsDirectoryPage() {
  const ctx = await requirePermission(ATTENDANCE_P.manage);
  const students = await getAllStudentsDirectory(ctx.tenantId, ctx.userId);

  // Check if scoped curriculum officer
  let scopedNotice: string | null = null;
  if (!ctx.isSuperAdmin) {
    const email = ctx.email.toLowerCase();
    if (email.includes("tipitaka")) {
      scopedNotice =
        "สาขาวิชาพระไตรปิฎกศึกษา" +
        (email.includes("master")
          ? " (ระดับปริญญาโท)"
          : email.includes("doc")
          ? " (ระดับปริญญาเอก)"
          : "");
      if (email.includes("wknd")) scopedNotice += " • ภาคพิเศษ/เสาร์-อาทิตย์";
      else if (email.includes("reg")) scopedNotice += " • ภาคปกติ";
    } else if (email.includes("religion")) {
      scopedNotice =
        "สาขาวิชาศาสนาเปรียบเทียบ" +
        (email.includes("master")
          ? " (ระดับปริญญาโท)"
          : email.includes("doc")
          ? " (ระดับปริญญาเอก)"
          : "");
      if (email.includes("wknd")) scopedNotice += " • ภาคพิเศษ/เสาร์-อาทิตย์";
      else if (email.includes("reg")) scopedNotice += " • ภาคปกติ";
    } else if (email.includes("vipassana")) {
      scopedNotice =
        "สาขาวิชาวิปัสสนาภาวนาศึกษา" +
        (email.includes("master") ? " (ระดับปริญญาโท)" : "");
      if (email.includes("wknd")) scopedNotice += " • ภาคพิเศษ/เสาร์-อาทิตย์";
      else if (email.includes("reg")) scopedNotice += " • ภาคปกติ";
    }
  }

  return (
    <StudentsDirectoryClient
      initialStudents={students}
      isSuperAdmin={ctx.isSuperAdmin}
      currentUserId={ctx.userId}
      scopedNotice={scopedNotice}
    />
  );
}
