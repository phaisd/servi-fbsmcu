import { resolvePublicTenantId } from "@/features/news/server";
import { getEventById } from "@/features/events/server";
import { getEventEvaluationConfig } from "@/features/events/_internal/evaluation-service";
import { EventEvaluateClient } from "./_components/event-evaluate-client";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export default async function EventEvaluatePage({ params }: PageProps) {
  const { eventId } = await params;
  const tenantId = await resolvePublicTenantId();

  const event = await getEventById(tenantId, eventId);
  if (!event) notFound();

  const config = await getEventEvaluationConfig(tenantId, eventId);

  return (
    <EventEvaluateClient
      event={{
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate.toISOString(),
        activityHours: event.activityHours,
        eventType: event.eventType,
      }}
      config={config}
    />
  );
}
