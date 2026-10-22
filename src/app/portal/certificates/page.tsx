import { auth } from "@/features/identity/server";
import { resolvePublicTenantId } from "@/features/news/server";
import { getAllCertificateRequests } from "@/features/certificates/server";
import { parseCertificateNote, inferDefaultTemplate } from "@/features/certificates";
import { PortalCertificatesClient } from "./_components/portal-certificates-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "บริการหนังสือรับรองนิสิต คณะพุทธศาสตร์ มจร (Student Certificates Portal)",
};

export default async function PublicCertificatesPage() {
  const [tenantId, session] = await Promise.all([
    resolvePublicTenantId(),
    auth(),
  ]);
  const items = await getAllCertificateRequests(tenantId);

  const currentUserId = session?.user?.id || null;
  const currentUserEmail = session?.user?.email?.toLowerCase().trim() || "";
  const currentUserName = session?.user?.name?.trim() || "";
  let currentStudentCode = "";
  if (currentUserEmail.endsWith("@mcu.ac.th")) {
    const prefix = currentUserEmail.split("@")[0]?.trim() || "";
    if (
      /^\d{8,12}$/.test(prefix) ||
      prefix.startsWith("temp-") ||
      /^t69\d{3}$/i.test(prefix)
    ) {
      currentStudentCode = prefix.toUpperCase();
    }
  }

  const isAdminOrStaff = Boolean(
    session?.isSuperAdmin ||
      session?.permissions?.includes("certificates:request:view") ||
      session?.permissions?.includes("certificates:request:manage")
  );

  const serializedItems = items.map((item) => {
    const parsedMeta = parseCertificateNote(item.note);
    return {
      id: item.id,
      userId: item.userId,
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

  return (
    <PortalCertificatesClient
      initialItems={serializedItems}
      currentUser={{
        id: currentUserId,
        email: currentUserEmail,
        name: currentUserName,
        studentCode: currentStudentCode,
        isAdminOrStaff,
      }}
    />
  );
}
