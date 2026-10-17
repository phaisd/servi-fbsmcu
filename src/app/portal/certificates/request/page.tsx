import { resolvePublicTenantId } from "@/features/news/server";
import { getActiveCertificateTypes } from "@/features/certificates/server";
import { getLocale } from "@/shared/lib/i18n/server";
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
  const tenantId = await resolvePublicTenantId();
  const [locale, types, resolvedParams] = await Promise.all([
    getLocale(),
    getActiveCertificateTypes(tenantId),
    searchParams,
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
    />
  );
}
