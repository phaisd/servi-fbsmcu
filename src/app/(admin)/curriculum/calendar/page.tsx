import { requirePermission } from "@/features/identity/server";
import { CURRICULUM_P } from "@/features/curriculum/permissions";
import {
  getAcademicCalendars,
  getAcademicCalendarWithEvents,
} from "@/features/curriculum/server";
import { CalendarAdminClient } from "./_components/calendar-admin-client";

interface PageProps {
  searchParams: Promise<{ year?: string }>;
}

export default async function AcademicCalendarPage({ searchParams }: PageProps) {
  const ctx = await requirePermission(CURRICULUM_P.read);
  const { year } = await searchParams;

  const calendars = await getAcademicCalendars(ctx.tenantId);
  const currentCalendar = await getAcademicCalendarWithEvents(ctx.tenantId, year);

  return (
    <CalendarAdminClient
      calendars={calendars}
      currentCalendar={currentCalendar}
      isSuperAdmin={ctx.isSuperAdmin}
    />
  );
}
