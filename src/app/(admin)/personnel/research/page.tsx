import { requirePermission, hasPermission } from "@/features/identity/server";
import { PERSONNEL_P } from "@/features/personnel";
import { getResearchPublications, getPersonnelList, getPersonnelPortalConfig } from "@/features/personnel/server";
import { ResearchAdminClient } from "./_components/research-admin-client";

interface PageProps {
  searchParams: Promise<{ author?: string }>;
}

export default async function ResearchAdminPage({ searchParams }: PageProps) {
  const { author } = await searchParams;
  const ctx = await requirePermission(PERSONNEL_P.read);
  const [publications, personnel, portalConfig] = await Promise.all([
    getResearchPublications(ctx.tenantId),
    getPersonnelList(ctx.tenantId),
    getPersonnelPortalConfig(ctx.tenantId),
  ]);

  return (
    <ResearchAdminClient
      initialPublications={publications}
      personnelList={personnel}
      canManage={hasPermission(ctx, PERSONNEL_P.manage)}
      initialAuthor={author || "ALL"}
      initialPublicationYearsLimit={portalConfig.publicationYearsLimit}
    />
  );
}
