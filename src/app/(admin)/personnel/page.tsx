import { requirePermission, hasPermission } from "@/features/identity/server";
import { PERSONNEL_P } from "@/features/personnel";
import { getPersonnelList, getDepartments } from "@/features/personnel/server";
import { PersonnelAdminClient } from "./_components/personnel-admin-client";

export default async function PersonnelAdminPage() {
  const ctx = await requirePermission(PERSONNEL_P.read);
  const items = await getPersonnelList(ctx.tenantId);
  const departments = await getDepartments(ctx.tenantId);
  const canManage = hasPermission(ctx, PERSONNEL_P.manage);

  return (
    <PersonnelAdminClient
      initialItems={items}
      departmentList={departments}
      canManage={canManage}
    />
  );
}
