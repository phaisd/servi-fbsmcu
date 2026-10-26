import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { resolvePublicTenantId } from "@/features/news/server";
import { getPublicPersonnelById, getPersonnelPortalConfig } from "@/features/personnel/server";
import { formatPersonnelName } from "@/features/personnel";
import { getLocale } from "@/shared/lib/i18n/server";
import { PersonnelProfileClient } from "./_components/personnel-profile-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const tenantId = await resolvePublicTenantId();
  const person = await getPublicPersonnelById(tenantId, id);

  if (!person) {
    return {
      title: "ไม่พบข้อมูลอาจารย์ | คณะพุทธศาสตร์ มจร",
    };
  }

  const name = formatPersonnelName(person);
  const dept = person.department?.nameTh || "คณะพุทธศาสตร์";

  return {
    title: `${name} | ${dept} มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย`,
    description: `ประวัติการศึกษา ประสบการณ์รายวิชาที่สอน (ระดับ ป.ตรี-โท-เอก) และผลงานวิจัยของ ${name} สังกัด${dept} มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย`,
    openGraph: {
      title: `${name} | ${dept}`,
      description: `ประวัติการศึกษา ประสบการณ์รายวิชาที่สอน และคลังผลงานวิจัย คณะพุทธศาสตร์ มจร`,
      images: person.imageUrl ? [{ url: person.imageUrl }] : undefined,
    },
  };
}

export default async function PersonnelDetailPage({ params }: PageProps) {
  const { id } = await params;
  const locale = await getLocale();
  const tenantId = await resolvePublicTenantId();
  const [person, portalConfig] = await Promise.all([
    getPublicPersonnelById(tenantId, id),
    getPersonnelPortalConfig(tenantId),
  ]);

  if (!person) {
    notFound();
  }

  return (
    <PersonnelProfileClient
      person={person}
      locale={locale}
      publicationYearsLimit={portalConfig.publicationYearsLimit}
    />
  );
}
