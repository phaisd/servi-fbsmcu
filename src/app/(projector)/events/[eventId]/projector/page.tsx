import { resolvePublicTenantId } from "@/features/news/server";
import { getEventProjectorData } from "@/features/events/server";
import { ProjectorClient } from "./_components/projector-client";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export default async function EventProjectorPage({ params }: PageProps) {
  const { eventId } = await params;
  const tenantId = await resolvePublicTenantId();

  try {
    const data = await getEventProjectorData(tenantId, eventId);
    return <ProjectorClient initialData={data} />;
  } catch {
    notFound();
  }
}
