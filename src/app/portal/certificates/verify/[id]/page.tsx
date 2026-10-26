import { getPublicCertificateVerification } from "@/features/certificates/server";
import { VerifyCertificateClient } from "../_components/verify-certificate-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "ตรวจสอบความถูกต้องหนังสือรับรอง (Official Certificate Verification) | คณะพุทธศาสตร์ มจร",
  description: "ระบบสแกน QR Code ตรวจสอบความถูกต้องของหนังสือรับรอง คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย สำหรับ ตม. และหน่วยงานราชการ",
};

export default async function VerifyCertificatePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const decodedId = decodeURIComponent(id || "");
  const verified = await getPublicCertificateVerification(decodedId);

  return (
    <VerifyCertificateClient
      initialData={verified as Parameters<typeof VerifyCertificateClient>[0]["initialData"]}
      searchCode={decodedId}
    />
  );
}
