import { requirePermission } from "@/features/identity/server";
import { ATTENDANCE_P } from "@/features/attendance";
import { getAllStudentsDirectory } from "@/features/attendance/server";
import { StudentsDirectoryClient } from "./_components/students-directory-client";

export const metadata = {
  title: "ทะเบียนนิสิต (Student Directory)",
};

export default async function AttendanceStudentsPage() {
  const ctx = await requirePermission(ATTENDANCE_P.manage);
  const students = await getAllStudentsDirectory(ctx.tenantId);

  return (
    <StudentsDirectoryClient
      initialStudents={students}
      isSuperAdmin={ctx.isSuperAdmin}
      currentUserId={ctx.userId}
    />
  );
}
