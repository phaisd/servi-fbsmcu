import { requirePermission, hasPermission } from "@/features/identity/server";
import { ADMINISTRATION_P } from "@/features/administration";
import { getAdminDocuments } from "@/features/administration/server";
import { AdministrationClient } from "./_components/administration-client";

export default async function AdministrationPage() {
  const ctx = await requirePermission(ADMINISTRATION_P.read);
  const items = await getAdminDocuments(ctx.tenantId);

  return (
    <AdministrationClient
      initialItems={items}
      canManage={hasPermission(ctx, ADMINISTRATION_P.manage)}
    />
  );
}
