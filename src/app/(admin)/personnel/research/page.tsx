import { requirePermission, hasPermission } from "@/features/identity/server";
import { PERSONNEL_P } from "@/features/personnel";
import { getResearchPublications, getPersonnelList } from "@/features/personnel/server";
import { ResearchAdminClient } from "./_components/research-admin-client";

interface PageProps {
  searchParams: Promise<{ author?: string }>;
}

export default async function ResearchAdminPage({ searchParams }: PageProps) {
  const { author } = await searchParams;
  const ctx = await requirePermission(PERSONNEL_P.read);
  const publications = await getResearchPublications(ctx.tenantId);
  const personnel = await getPersonnelList(ctx.tenantId);

  return (
    <ResearchAdminClient
      initialPublications={publications}
      personnelList={personnel}
      canManage={hasPermission(ctx, PERSONNEL_P.manage)}
      initialAuthor={author || "ALL"}
    />
  );
}
