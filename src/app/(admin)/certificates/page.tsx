import { requirePermission } from "@/features/identity/server";
import { CERTIFICATES_P, parseCertificateNote, inferDefaultTemplate } from "@/features/certificates";
import {
  getAllCertificateRequests,
  getCertificateTypes,
  getCertificateNotice,
} from "@/features/certificates/server";
import { RequestsAdminClient } from "./_components/requests-admin-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "ระบบหนังสือรับรองนิสิต (Certificates Management)",
};

export default async function CertificateRequestsAdminPage() {
  const ctx = await requirePermission(CERTIFICATES_P.requestView);
  const [items, types, notice] = await Promise.all([
    getAllCertificateRequests(ctx.tenantId),
    getCertificateTypes(ctx.tenantId),
    getCertificateNotice(ctx.tenantId),
  ]);

  const serializedItems = items.map((item) => {
    const parsedMeta = parseCertificateNote(item.note);
    return {
      id: item.id,
      certificateTypeId: item.certificateTypeId,
      typeName: item.certificateType.name,
      userId: item.userId,
      userName: item.user.name ?? "",
      userEmail: item.user.email,
      status: item.status,
      reason: item.reason,
      issuedDocumentUrl: item.issuedDocumentUrl,
      note: item.note,
      createdAt: item.createdAt.toISOString(),
      metadata: {
        ...parsedMeta,
        docTemplate: parsedMeta.docTemplate ?? inferDefaultTemplate(parsedMeta),
      },
    };
  });

  const serializedTypes = types.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    isActive: t.isActive,
  }));

  return (
    <RequestsAdminClient
      initialItems={serializedItems}
      certificateTypes={serializedTypes}
      initialNotice={notice}
    />
  );
}

