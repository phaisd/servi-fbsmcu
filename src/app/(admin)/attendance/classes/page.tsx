import { requirePermission } from "@/features/identity/server";
import { ATTENDANCE_P } from "@/features/attendance";
import { getClasses, getAvailableTeachers } from "@/features/attendance/server";
import { ClassesClient } from "./_components/classes-client";

export default async function AttendanceClassesPage() {
  const ctx = await requirePermission(ATTENDANCE_P.manage);
  const [items, availableTeachers] = await Promise.all([
    getClasses(ctx.tenantId, {
      userId: ctx.userId,
      isSuperAdmin: ctx.isSuperAdmin,
    }),
    getAvailableTeachers(ctx.tenantId),
  ]);

  return (
    <ClassesClient
      initialItems={items}
      availableTeachers={availableTeachers}
      isSuperAdmin={ctx.isSuperAdmin}
      currentUserId={ctx.userId}
    />
  );
}
