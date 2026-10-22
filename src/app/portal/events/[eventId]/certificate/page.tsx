import { resolvePublicTenantId } from "@/features/news/server";
import { getEventById } from "@/features/events/server";
import { prisma as db } from "@/shared/lib/infra/prisma";
import { CertificateDocument } from "./_components/certificate-document";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ code?: string }>;
}

export default async function EventCertificatePage({ params, searchParams }: PageProps) {
  const { eventId } = await params;
  const { code } = await searchParams;
  const tenantId = await resolvePublicTenantId();

  const event = await getEventById(tenantId, eventId);
  if (!event) notFound();

  const cleanCode = code ? decodeURIComponent(code).trim() : "";
  let recipient = {
    name: "ผู้เข้าร่วมกิจกรรม",
    code: cleanCode || "-",
    role: "STUDENT",
    department: null as string | null,
    major: null as string | null,
    attendedAt: null as string | null,
  };

  if (cleanCode) {
    // 1. ค้นหาใน event_registrations
    const reg = await db.eventRegistration.findFirst({
      where: {
        tenantId,
        eventId,
        OR: [
          { studentCode: cleanCode },
          { studentCode: { equals: cleanCode, mode: "insensitive" } },
        ],
      },
    });

    if (reg) {
      recipient = {
        name: reg.studentName,
        code: reg.studentCode,
        role: reg.role,
        department: reg.department,
        major: reg.major,
        attendedAt: reg.attendedAt ? reg.attendedAt.toISOString() : null,
      };
    } else {
      // 2. ค้นหาใน students
      const student = await db.student.findFirst({
        where: { tenantId, studentCode: cleanCode },
      });
      if (student) {
        recipient = {
          name: `${student.title ? student.title + " " : ""}${student.firstName} ${student.lastName}`.trim(),
          code: student.studentCode,
          role: "STUDENT",
          department: student.faculty || student.department,
          major: student.major || student.curriculumName,
          attendedAt: new Date().toISOString(),
        };
      }
    }
  }

  return (
    <CertificateDocument
      event={{
        id: event.id,
        title: event.title,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate.toISOString(),
        activityHours: event.activityHours,
        eventType: event.eventType,
        location: event.location,
      }}
      recipient={recipient}
    />
  );
}
