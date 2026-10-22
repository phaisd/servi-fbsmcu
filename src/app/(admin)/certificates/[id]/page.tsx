import { notFound } from "next/navigation";
import { requirePermission } from "@/features/identity/server";
import { CERTIFICATES_P, parseCertificateNote, inferDefaultTemplate } from "@/features/certificates";
import {
  getCertificateRequestById,
  getCertificateTypes,
  getNextCertificateDocNo,
  getPersonnelListForCertificate,
} from "@/features/certificates/server";
import { CertificateStudioClient } from "./_components/certificate-studio-client";

export const dynamic = "force-dynamic";

export default async function CertificateStudioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requirePermission(CERTIFICATES_P.requestView);

  const [request, types, personnelList] = await Promise.all([
    getCertificateRequestById(ctx.tenantId, id),
    getCertificateTypes(ctx.tenantId),
    getPersonnelListForCertificate(ctx.tenantId).catch(() => []),
  ]);

  if (!request) {
    notFound();
  }

  const parsedMeta = parseCertificateNote(request.note);
  const template = parsedMeta.docTemplate ?? inferDefaultTemplate(parsedMeta);
  const nextDocNo = await getNextCertificateDocNo(ctx.tenantId, template);

  const metadata = {
    ...parsedMeta,
    docTemplate: template,
    docNo:
      template === "RESIDENCE_MEMO"
        ? parsedMeta.docNo?.trim() || ""
        : parsedMeta.docNo?.trim() || nextDocNo,
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
      suggestedNextDocNo={nextDocNo}
      currentUser={{
        id: ctx.userId,
        name: ctx.userName,
        email: ctx.email,
      }}
      personnelList={personnelList}
    />
  );
}
