import { VerifyCertificateClient } from "./_components/verify-certificate-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "ระบบตรวจสอบหนังสือรับรองดิจิทัล (Certificate Verification Portal) | คณะพุทธศาสตร์ มจร",
  description: "ระบบตรวจสอบความถูกต้องของหนังสือรับรอง คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย สำหรับ ตม. และหน่วยงานราชการ",
};

export default function VerifyCertificateIndexPage() {
  return <VerifyCertificateClient initialData={null} searchCode="" />;
}
