import { resolvePublicTenantId } from "@/features/news/server";
import { getPublicDocuments } from "@/features/administration/server";
import { getLocale } from "@/shared/lib/i18n/server";
import { getSessionContext } from "@/features/identity/server";
import { PublicDocumentsClient } from "./_components/public-documents-client";

export default async function PublicDocumentsPage() {
  const locale = await getLocale();
  const tenantId = await resolvePublicTenantId();
  const session = await getSessionContext();

  const isInternalUser = !!session;
  const items = await getPublicDocuments(tenantId, isInternalUser);

  return (
    <PublicDocumentsClient
      initialItems={items}
      isInternalUser={isInternalUser}
      locale={locale}
    />
  );
}

