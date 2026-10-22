import { resolvePublicTenantId } from "@/features/news/server";
import { getEventById } from "@/features/events/server";
import { SelfCheckinClient } from "./_components/self-checkin-client";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export default async function EventCheckinPage({ params }: PageProps) {
  const { eventId } = await params;
  const tenantId = await resolvePublicTenantId();

  const event = await getEventById(tenantId, eventId);
  if (!event) notFound();

  return (
    <SelfCheckinClient
      event={{
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate.toISOString(),
        activityHours: event.activityHours,
        eventType: event.eventType,
        targetGroup: event.targetGroup,
        academicYear: event.academicYear,
      }}
    />
  );
}
