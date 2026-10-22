import { resolvePublicTenantId } from "@/features/news/server";
import {
  getActiveCertificateTypes,
  getCertificateNotice,
  lookupStudentForCertificate,
  getPersonnelListForCertificate,
  lookupPersonnelDetailForCertificate,
} from "@/features/certificates/server";
import { getLocale } from "@/shared/lib/i18n/server";
import { getSessionContext, hasPermission } from "@/features/identity/server";
import { CERTIFICATES_P } from "@/features/certificates";
import { RequestFormClient } from "./_components/request-form-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "ยื่นคำร้องขอหนังสือรับรอง (นิสิต / คณาจารย์ / เจ้าหน้าที่)",
};

export default async function CertificateRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string; mode?: string; personnelId?: string }>;
}) {
  const ctx = await getSessionContext().catch(() => null);
  const tenantId = ctx?.tenantId || (await resolvePublicTenantId());
  const canManageNotice = ctx ? hasPermission(ctx, CERTIFICATES_P.requestManage) : false;

  const resolvedParams = await searchParams;
  const emailPrefix = (ctx?.email || "").split("@")[0]?.trim() || "";
  const shouldAutoLookupLoggedInUser =
    Boolean(emailPrefix) &&
    (emailPrefix.toLowerCase() !== "admin" &&
      ((ctx?.email || "").toLowerCase().endsWith("@mcu.ac.th") ||
        (ctx?.email || "").toLowerCase().endsWith("@buddhist.mcu.ac.th")));

  const [locale, types, notice, loggedInProfile, personnelList, directPersonnelProfile] = await Promise.all([
    getLocale(),
    getActiveCertificateTypes(tenantId),
    getCertificateNotice(tenantId),
    shouldAutoLookupLoggedInUser
      ? lookupStudentForCertificate(tenantId, emailPrefix).catch(() => null)
      : Promise.resolve(null),
    getPersonnelListForCertificate(tenantId),
    resolvedParams.personnelId
      ? lookupPersonnelDetailForCertificate(tenantId, resolvedParams.personnelId).catch(() => null)
      : Promise.resolve(null),
  ]);

  const serializedTypes = types.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
  }));

  const initialProfile = directPersonnelProfile || loggedInProfile;
  const isPersonnelMode = Boolean(
    resolvedParams.mode === "personnel" ||
      resolvedParams.personnelId ||
      initialProfile?.applicantType === "FACULTY_LECTURER" ||
      initialProfile?.applicantType === "STAFF_MEMBER"
  );

  return (
    <RequestFormClient
      types={serializedTypes}
      locale={locale}
      initialTemplate={resolvedParams.template}
      initialNotice={notice}
      canManageNotice={canManageNotice}
      initialProfile={initialProfile}
      personnelList={personnelList}
      initialMode={isPersonnelMode ? "personnel" : "student"}
      initialPersonnelId={resolvedParams.personnelId}
    />
  );
}

