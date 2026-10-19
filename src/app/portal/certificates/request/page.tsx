import { resolvePublicTenantId } from "@/features/news/server";
import { getActiveCertificateTypes, getCertificateNotice } from "@/features/certificates/server";
import { getLocale } from "@/shared/lib/i18n/server";
import { getSessionContext, hasPermission } from "@/features/identity/server";
import { CERTIFICATES_P } from "@/features/certificates";
import { RequestFormClient } from "./_components/request-form-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "ยื่นคำร้องขอหนังสือรับรองนิสิต (Submit Certificate Request)",
};

export default async function CertificateRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const ctx = await getSessionContext().catch(() => null);
  const tenantId = ctx?.tenantId || (await resolvePublicTenantId());
  const canManageNotice = ctx ? hasPermission(ctx, CERTIFICATES_P.requestManage) : false;

  const [locale, types, resolvedParams, notice] = await Promise.all([
    getLocale(),
    getActiveCertificateTypes(tenantId),
    searchParams,
    getCertificateNotice(tenantId),
  ]);

  const serializedTypes = types.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
  }));

  return (
    <RequestFormClient
      types={serializedTypes}
      locale={locale}
      initialTemplate={resolvedParams.template}
      initialNotice={notice}
      canManageNotice={canManageNotice}
    />
  );
}

