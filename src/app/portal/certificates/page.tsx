import { resolvePublicTenantId } from "@/features/news/server";
import { getAllCertificateRequests } from "@/features/certificates/server";
import { parseCertificateNote, inferDefaultTemplate } from "@/features/certificates";
import { PortalCertificatesClient } from "./_components/portal-certificates-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "บริการหนังสือรับรองนิสิต คณะพุทธศาสตร์ มจร (Student Certificates Portal)",
};

export default async function PublicCertificatesPage() {
  const tenantId = await resolvePublicTenantId();
  const items = await getAllCertificateRequests(tenantId);

  const serializedItems = items.map((item) => {
    const parsedMeta = parseCertificateNote(item.note);
    return {
      id: item.id,
      certificateTypeId: item.certificateTypeId,
      typeName: item.certificateType.name,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
      metadata: {
        ...parsedMeta,
        docTemplate: parsedMeta.docTemplate ?? inferDefaultTemplate(parsedMeta),
      },
    };
  });

  return <PortalCertificatesClient initialItems={serializedItems} />;
}
