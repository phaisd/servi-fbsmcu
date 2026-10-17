import { notFound } from "next/navigation";
import { requirePermission } from "@/features/identity/server";
import { CERTIFICATES_P, parseCertificateNote, inferDefaultTemplate } from "@/features/certificates";
import { getCertificateRequestById, getCertificateTypes } from "@/features/certificates/server";
import { CertificateStudioClient } from "./_components/certificate-studio-client";

export const dynamic = "force-dynamic";

export default async function CertificateStudioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requirePermission(CERTIFICATES_P.requestView);

  const [request, types] = await Promise.all([
    getCertificateRequestById(ctx.tenantId, id),
    getCertificateTypes(ctx.tenantId),
  ]);

  if (!request) {
    notFound();
  }

  const parsedMeta = parseCertificateNote(request.note);
  const metadata = {
    ...parsedMeta,
    docTemplate: parsedMeta.docTemplate ?? inferDefaultTemplate(parsedMeta),
  };

  const serializedRequest = {
    id: request.id,
    certificateTypeId: request.certificateTypeId,
    typeName: request.certificateType.name,
    userId: request.userId,
    userName: request.user.name ?? "",
    userEmail: request.user.email,
    status: request.status,
    reason: request.reason,
    issuedDocumentUrl: request.issuedDocumentUrl,
    note: request.note,
    createdAt: request.createdAt.toISOString(),
    metadata,
  };

  return (
    <CertificateStudioClient
      request={serializedRequest}
      certificateTypes={types.map((t) => ({ id: t.id, name: t.name }))}
    />
  );
}
