import { requirePermission, hasPermission } from "@/features/identity/server";
import { PERSONNEL_P } from "@/features/personnel";
import { getPersonnelList, getDepartments, getPersonnelPortalConfig } from "@/features/personnel/server";
import { PersonnelAdminClient } from "./_components/personnel-admin-client";

export default async function PersonnelAdminPage() {
  const ctx = await requirePermission(PERSONNEL_P.read);
  const [items, departments, portalConfig] = await Promise.all([
    getPersonnelList(ctx.tenantId),
    getDepartments(ctx.tenantId),
    getPersonnelPortalConfig(ctx.tenantId),
  ]);
  const canManage = hasPermission(ctx, PERSONNEL_P.manage);

  return (
    <PersonnelAdminClient
      initialItems={items}
      departmentList={departments}
      canManage={canManage}
      initialPublicationYearsLimit={portalConfig.publicationYearsLimit}
    />
  );
}
