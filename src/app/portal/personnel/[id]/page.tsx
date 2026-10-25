import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { resolvePublicTenantId } from "@/features/news/server";
import { getPublicPersonnelById } from "@/features/personnel/server";
import { getLocale } from "@/shared/lib/i18n/server";
import { PersonnelProfileClient } from "./_components/personnel-profile-client";

interface PageProps {
  params: Promise<{ id: string }> | { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const tenantId = await resolvePublicTenantId();
  const person = await getPublicPersonnelById(tenantId, resolvedParams.id);

  if (!person) {
    return {
      title: "ไม่พบข้อมูลอาจารย์ | คณะพุทธศาสตร์ มจร",
    };
  }

  const name = `${person.academicPosition ? `${person.academicPosition} ` : ""}${person.firstNameTh} ${person.lastNameTh}`;
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
  const resolvedParams = await Promise.resolve(params);
  const locale = await getLocale();
  const tenantId = await resolvePublicTenantId();
  const person = await getPublicPersonnelById(tenantId, resolvedParams.id);

  if (!person) {
    notFound();
  }

  return <PersonnelProfileClient person={person} locale={locale} />;
}
