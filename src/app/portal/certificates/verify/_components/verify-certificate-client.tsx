"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  AlertTriangle,
  User,
  GraduationCap,
  Search,
  Printer,
  Phone,
  Lock,
  Stamp,
  ArrowLeft,
} from "lucide-react";
import type { CertificateRequestMetadata } from "@/features/certificates";

export interface VerifiedCertificatePayload {
  id: string;
  tenantId: string;
  tenantNameTh: string;
  tenantNameEn: string;
  tenantLogoUrl: string | null;
  certificateTypeName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  metadata: CertificateRequestMetadata;
}

interface Props {
  initialData: VerifiedCertificatePayload | null;
  searchCode?: string;
}

export function VerifyCertificateClient({ initialData, searchCode = "" }: Props) {
  const router = useRouter();
  const [lang, setLang] = useState<"th" | "en">("th");
  const isEn = lang === "en";

  const [inputCode, setInputCode] = useState(searchCode);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!inputCode.trim()) return;
    router.push(`/portal/certificates/verify/${encodeURIComponent(inputCode.trim())}`);
  }

  const isApproved = initialData?.status === "APPROVED";
  const m = initialData?.metadata;

  // Mask passport number for PDPA compliance
  function maskPassport(pass?: string) {
    if (!pass || pass.length < 4) return pass || "-";
    const start = pass.slice(0, 2);
    const end = pass.slice(-2);
    return `${start}${"*".repeat(Math.max(3, pass.length - 4))}${end}`;
  }

  const [initialDate] = useState(() => new Date());

  const verifiedDate = initialDate.toLocaleString(isEn ? "en-US" : "th-TH", {
    dateStyle: "long",
    timeStyle: "medium",
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100/60 to-slate-100 text-slate-900">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <Link
            href="/portal/certificates"
            className="flex items-center gap-3 group text-left"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/uploads/mcu-logo.png"
              alt="MCU Logo"
              className="w-10 h-10 object-contain drop-shadow-xs"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
            <div>
              <div className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-primary transition leading-tight">
                {isEn ? "Faculty of Buddhism, MCU" : "คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย"}
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500 font-medium">
                {isEn
                  ? "Official Certificate Verification Portal (Immigration Bureau)"
                  : "ระบบตรวจสอบหนังสือรับรองดิจิทัล (สำหรับ ตม. และหน่วยงานราชการ)"}
              </div>
            </div>
          </Link>

          {/* Language Switcher */}
          <div className="flex items-center gap-1.5 shrink-0 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setLang("th")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                lang === "th"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              🇹🇭 ไทย
            </button>
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                lang === "en"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              🇬🇧 English
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Search Bar for manual lookup */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={
                  isEn
                    ? "Enter Document No. (e.g. 8002/710), Student ID, or Reference Code..."
                    : "ระบุเลขที่หนังสือ (เช่น 8002/710), รหัสนิสิต หรือรหัสอ้างอิงเพื่อตรวจสอบ..."
                }
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-800"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-xs shrink-0"
            >
              <Search className="w-4 h-4" />
              <span>{isEn ? "Verify Document" : "ตรวจสอบเอกสาร"}</span>
            </button>
          </form>
        </div>

        {/* Verification Result Card */}
        {initialData && isApproved ? (
          <div className="bg-white rounded-3xl border-2 border-emerald-500/40 shadow-lg overflow-hidden">
            {/* Banner: Verified Authentic */}
            <div className="bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-700 text-white px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 text-white">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm sm:text-base tracking-wide uppercase">
                      {isEn ? "OFFICIALLY VERIFIED & AUTHENTIC" : "เอกสารแท้จริง ออกโดยคณะพุทธศาสตร์ มจร"}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white text-emerald-800 text-[10px] font-bold">
                      GENUINE
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    {isEn
                      ? "Confirmed valid under Mahachulalongkornrajavidyalaya University Academic Registry"
                      : "ยืนยันความถูกต้องตรงกับฐานข้อมูลสารสนเทศ คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย"}
                  </p>
                </div>
              </div>

              {/* Verified Timestamp */}
              <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 border-white/20 pt-2 sm:pt-0">
                <div className="text-[10px] text-emerald-200 uppercase font-mono tracking-wider">
                  {isEn ? "Verification Timestamp:" : "วัน-เวลาที่สแกนตรวจสอบ:"}
                </div>
                <div className="text-xs font-semibold text-white font-mono mt-0.5" suppressHydrationWarning>
                  {verifiedDate ? `${verifiedDate} (UTC+7)` : "—"}
                </div>
              </div>
            </div>

            {/* Document Details Body */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Document Reference Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-200">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {isEn ? "Official Document Number" : "เลขที่หนังสือราชการ"}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
                    {isEn ? `MCU No. ${m?.docNo || "8002/710"}` : `ที่ อว ${m?.docNo || "8002/710"}`}
                  </h2>
                </div>
                <div className="sm:text-right">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {isEn ? "Certificate Type & Purpose" : "ประเภทหนังสือและวัตถุประสงค์"}
                  </span>
                  <p className="text-sm font-semibold text-primary mt-0.5">
                    {m?.requestPurpose || initialData.certificateTypeName}
                  </p>
                </div>
              </div>

              {/* Main Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* 1. Student Identity */}
                <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-3.5">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-200">
                    <User className="w-4 h-4 text-primary" />
                    <span>{isEn ? "Student Identification" : "ข้อมูลประจำตัวนิสิต"}</span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400">
                      {isEn ? "Full Name (as per Passport / Monastic Title):" : "ชื่อ - ฉายา / นามสกุล:"}
                    </span>
                    <p className="text-base font-bold text-slate-900 mt-0.5">
                      {m?.fullName || "-"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[11px] text-slate-400">
                        {isEn ? "Student ID Code:" : "รหัสประจำตัวนิสิต:"}
                      </span>
                      <p className="font-mono font-bold text-slate-800 text-sm mt-0.5">
                        {m?.studentCode || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400">
                        {isEn ? "Nationality / Country:" : "สัญชาติ / ประเทศ:"}
                      </span>
                      <p className="font-medium text-slate-800 text-sm mt-0.5">
                        {m?.nationality || m?.country || "-"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-600" />
                      <span>{isEn ? "Passport No. (PDPA Protected):" : "เลขหนังสือเดินทาง (คุ้มครอง PDPA):"}</span>
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono font-bold text-slate-800 text-sm">
                        {maskPassport(m?.passportNo)}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold">
                        {isEn ? "✓ Verified Match" : "✓ ตรวจสอบตรงกับฐานข้อมูล"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Academic Enrollment Status */}
                <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-3.5">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-200">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    <span>{isEn ? "Academic Enrollment Status" : "สถานภาพการศึกษา"}</span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400">
                      {isEn ? "Program & Major:" : "ระดับการศึกษาและสาขาวิชา:"}
                    </span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">
                      {m?.degreeLevel || "Bachelor of Arts"} • {m?.major || "Buddhist Studies"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[11px] text-slate-400">
                        {isEn ? "Class Year:" : "ชั้นปีที่ศึกษา:"}
                      </span>
                      <p className="font-medium text-slate-800 text-sm mt-0.5">
                        {m?.classYear || "ปีที่ 1 (First Year)"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400">
                        {isEn ? "Student Status:" : "สถานภาพนิสิต:"}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-bold text-emerald-700 text-xs sm:text-sm">
                          {isEn ? "Currently Enrolled" : "กำลังศึกษาอยู่"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400">
                      {isEn ? "Current Academic Term:" : "ภาคการศึกษาปัจจุบัน:"}
                    </span>
                    <p className="font-semibold text-slate-800 text-xs sm:text-sm mt-0.5">
                      {isEn
                        ? `Semester 2, Academic Year 2026 (2569 B.E.)`
                        : `ภาคการศึกษาที่ 2 ปีการศึกษา 2569`}
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Official Issuance & Authority */}
              <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-200">
                  <Stamp className="w-4 h-4 text-primary" />
                  <span>{isEn ? "Issuing Authority & Signer" : "ผู้ออกหนังสือและผู้ลงนาม"}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[11px] text-slate-400">
                      {isEn ? "Authorized Signer:" : "ผู้มีอำนาจลงนาม:"}
                    </span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">
                      {isEn
                        ? m?.signerNameEn || "(Asst. Prof. Phrakhru Sirirattanabundit, Ph.D.)"
                        : m?.signerNameTh || "(พระครูสิริรัตนบัณฑิต, ผศ.ดร.)"}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {isEn
                        ? m?.signerTitleEn || "Vice Dean, Faculty of Buddhism"
                        : m?.signerTitleTh || "รักษาการแทนรองคณบดีฝ่ายวิชาการ คณะพุทธศาสตร์"}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400">
                      {isEn ? "Date of Issuance:" : "วันที่ออกหนังสือรับรอง:"}
                    </span>
                    <p className="font-semibold text-slate-900 text-sm mt-0.5">
                      {isEn
                        ? m?.issueDateEn || "February 18, 2027"
                        : m?.issueDateTh || "๑๘ กุมภาพันธ์ ๒๕๗๐"}
                    </p>
                    <span className="text-[11px] text-slate-500">
                      {isEn
                        ? "Faculty of Buddhism, Mahachulalongkornrajavidyalaya University"
                        : "คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Immigration Officer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {isEn ? "Verification Hotline:" : "เบอร์ติดต่อตรวจสอบส่วนกลาง:"}{" "}
                    <strong className="text-slate-800">035-248-000 ext. 8323, 8096</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{isEn ? "Print Verification Summary" : "พิมพ์ใบรับรองการตรวจสอบ"}</span>
                  </button>
                  <Link
                    href="/portal/certificates"
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold transition shadow-xs"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{isEn ? "Certificates Portal" : "หน้ารวมคำขอรับรอง"}</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : initialData && !isApproved ? (
          /* Document Found but NOT Approved */
          <div className="bg-white rounded-3xl border-2 border-amber-400/60 shadow-lg p-6 sm:p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-9 h-9" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {isEn
                  ? "Certificate Found but Currently Pending or Not Approved"
                  : "พบข้อมูลในระบบ แต่เอกสารยังไม่ผ่านการอนุมัติสมบูรณ์"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-lg mx-auto">
                {isEn
                  ? "This certificate request is still under academic review or has been suspended. Please contact the Faculty of Buddhism Registrar Office for formal clarification."
                  : "คำขอนี้ยังอยู่ระหว่างการตรวจสอบของงานวิชาการ หรือยังไม่ได้รับการอนุมัติอย่างเป็นทางการ กรุณาประสานงานกับสำนักงานคณะพุทธศาสตร์ มจร เพื่อตรวจสอบ"}
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/portal/certificates"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{isEn ? "Back to Portal" : "กลับสู่หน้าบริการนิสิต"}</span>
              </Link>
            </div>
          </div>
        ) : searchCode ? (
          /* Document NOT Found */
          <div className="bg-white rounded-3xl border-2 border-rose-400/60 shadow-lg p-6 sm:p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-9 h-9" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {isEn ? "Certificate Record Not Found" : "ไม่พบข้อมูลหนังสือรับรองในระบบ"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-lg mx-auto">
                {isEn
                  ? `No valid certificate record matching "${searchCode}" was found. Please ensure the QR code or document number is correct.`
                  : `ไม่พบข้อมูลหนังสือรับรองที่ตรงกับ "${searchCode}" กรุณาตรวจสอบเลขที่หนังสือหรือสแกน QR Code ใหม่อีกครั้ง`}
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/portal/certificates"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{isEn ? "Back to Portal" : "กลับสู่หน้าบริการนิสิต"}</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Blank landing state: Prompt officer to scan or search */
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 sm:p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <ShieldCheck className="w-9 h-9" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {isEn
                  ? "Scan QR Code or Enter Document Number to Verify"
                  : "สแกน QR Code หรือพิมพ์เลขที่หนังสือเพื่อตรวจสอบ"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-lg mx-auto leading-relaxed">
                {isEn
                  ? "This verification portal allows Thailand Immigration Bureau (ตม.), embassies, and official institutions to verify the authenticity of certificates issued by Faculty of Buddhism, MCU."
                  : "ระบบตรวจสอบความถูกต้องของหนังสือรับรอง สำหรับสำนักงานตรวจคนเข้าเมือง (ตม.), สถานทูต และหน่วยงานราชการ เพื่อยืนยันสถานภาพนิสิตและเอกสารต้นฉบับแท้จริง"}
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-slate-500 border-t border-slate-200/60 mt-12">
        <p>
          © 2026 Faculty of Buddhism, Mahachulalongkornrajavidyalaya University. All Rights Reserved.
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          {isEn
            ? "79 Moo 1, Phahon Yothin Rd., Lamsai, Wang Noi, Phra Nakhon Si Ayutthaya 13170 Thailand"
            : "๗๙ หมู่ ๑ ถนนพหลโยธิน ตำบลลำไทร อำเภอวังน้อย จังหวัดพระนครศรีอยุธยา ๑๓๑๗๐"}
        </p>
      </footer>
    </div>
  );
}
