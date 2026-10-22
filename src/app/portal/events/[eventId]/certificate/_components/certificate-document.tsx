"use client";

import { Printer, ArrowLeft, Download, Award, Sparkles, CheckCircle } from "lucide-react";
import Link from "next/link";

interface CertificateDocumentProps {
  event: {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    activityHours?: number | null;
    eventType?: string | null;
    location?: string | null;
  };
  recipient: {
    name: string;
    code: string;
    role: string;
    department?: string | null;
    major?: string | null;
    attendedAt?: string | null;
  };
}

export function CertificateDocument({ event, recipient }: CertificateDocumentProps) {
  const handlePrint = () => {
    window.print();
  };

  const certificateNo = `MCU-BUD-${new Date(event.startDate).getFullYear() + 543}-${recipient.code.slice(-4)}-${event.id.slice(0, 4).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 print:p-0 print:bg-white flex flex-col items-center">
      
      {/* Action Bar (ซ่อนเวลาพิมพ์) */}
      <div className="w-full max-w-[297mm] mb-4 flex items-center justify-between gap-4 print:hidden">
        <Link
          href={`/portal/events/${event.id}/evaluate?code=${encodeURIComponent(recipient.code)}`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับ</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-md shadow-amber-600/20 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>🖨️ พิมพ์หรือบันทึกเป็น PDF (Print Certificate)</span>
          </button>
        </div>
      </div>

      {/* ══════════ CERTIFICATE CANVAS (A4 Landscape: 297mm x 210mm) ══════════ */}
      <div
        id="certificate-container"
        className="w-full max-w-[297mm] bg-white border-[10px] border-amber-600/30 p-6 sm:p-12 shadow-2xl relative select-none print:shadow-none print:border-[8px] print:m-0 print:w-full print:h-screen print:max-w-none text-slate-900 flex flex-col justify-between"
        style={{
          minHeight: "205mm",
          backgroundImage: "radial-gradient(#fef3c7 0.75px, transparent 0.75px)",
          backgroundSize: "20px 20px",
        }}
      >
        {/* กรอบเส้นทองด้านใน */}
        <div className="absolute inset-2 sm:inset-4 border-2 border-amber-500/60 pointer-events-none rounded-lg" />
        <div className="absolute inset-3 sm:inset-5 border border-amber-300 pointer-events-none rounded-md" />

        {/* ─── Header: ตราสัญลักษณ์ มจร + สถาบัน ─── */}
        <div className="text-center relative z-10 space-y-2 pt-2">
          {/* ตราสัญลักษณ์ทางการ มจร */}
          <div className="inline-flex items-center justify-center mx-auto">
            <img
              src="/uploads/mcu-official-seal.png"
              alt="ตราสัญลักษณ์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย"
              className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-md mx-auto"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/uploads/mcu-logo.png";
              }}
            />
          </div>

          <div>
            <h1 className="text-base sm:text-xl md:text-2xl font-bold text-amber-950 tracking-wider">
              มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
            </h1>
            <h2 className="text-sm sm:text-lg md:text-xl font-bold text-amber-800 tracking-wide mt-0.5">
              คณะพุทธศาสตร์
            </h2>
            <div className="text-[10px] sm:text-xs text-slate-500 font-serif tracking-widest uppercase mt-0.5">
              Faculty of Buddhism • Mahachulalongkornrajavidyalaya University
            </div>
          </div>
        </div>

        {/* ─── Body: มอบให้แก่ + ชื่อกิจกรรม + ชั่วโมง ─── */}
        <div className="text-center relative z-10 space-y-4 sm:space-y-6 my-4 sm:my-6">
          <p className="text-xs sm:text-sm text-slate-600 font-medium tracking-wide">
            ขอมอบเกียรติบัตรฉบับนี้เพื่อแสดงว่า
          </p>

          {/* ชื่อผู้ได้รับเกียรติบัตร */}
          <div className="relative inline-block px-8 py-1">
            <h3 className="text-xl sm:text-3xl md:text-4xl font-black text-amber-950 font-serif border-b-2 border-amber-400/80 pb-2 drop-shadow-xs">
              {recipient.name}
            </h3>
            <p className="text-2xs sm:text-xs text-slate-500 font-mono mt-1">
              รหัสประจำตัว: {recipient.code} {recipient.major ? `• ${recipient.major}` : ""}
            </p>
          </div>

          <p className="text-xs sm:text-sm text-slate-700 max-w-2xl mx-auto leading-relaxed">
            ได้เข้าร่วมและผ่านการประเมินโครงการ/กิจกรรม
          </p>

          {/* ชื่อกิจกรรม */}
          <div className="max-w-2xl mx-auto bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 sm:p-4">
            <h4 className="text-sm sm:text-lg md:text-xl font-black text-slate-900 leading-snug">
              &ldquo;{event.title}&rdquo;
            </h4>
            <div className="text-2xs sm:text-xs text-amber-800 font-semibold mt-1 flex items-center justify-center gap-3">
              <span>นับเป็นชั่วโมงกิจกรรมการเรียนรู้: {event.activityHours || 3} ชั่วโมง</span>
              <span>•</span>
              <span>
                จัด ณ วันที่ {new Date(event.startDate).toLocaleDateString("th-TH", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          <p className="text-2xs sm:text-xs text-slate-500 italic max-w-md mx-auto">
            ขอให้มีความเจริญงอกงามในธรรม มีความสุข ความสำเร็จ ในหน้าที่การงานและการศึกษาสืบไป
          </p>
        </div>

        {/* ─── Footer: ลายมือชื่อคณบดี + รหัสอ้างอิง ─── */}
        <div className="relative z-10 pt-4 flex items-end justify-between text-2xs sm:text-xs border-t border-amber-200/60">
          {/* ซ้าย: หมายเลขอ้างอิงและ QR Verification */}
          <div className="text-left space-y-0.5 text-slate-500 font-mono text-[10px] sm:text-2xs">
            <div>เลขที่เกียรติบัตร: <span className="font-bold text-slate-800">{certificateNo}</span></div>
            <div>ออกให้ ณ วันที่: {new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}</div>
            <div className="text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> เอกสารผ่านการรับรองทางระบบอิเล็กทรอนิกส์
            </div>
          </div>

          {/* ขวา: ช่องลงนามคณบดี */}
          <div className="text-center space-y-1 w-64">
            <div className="h-10 sm:h-12 flex items-center justify-center text-amber-700 font-serif italic text-lg sm:text-xl">
              พระมหาบุญชู ญาณวิโรจน์
            </div>
            <div className="border-t border-slate-400 pt-1">
              <div className="font-bold text-slate-800">(พระมหาบุญชู ญาณวิโรจน์, ผศ.ดร.)</div>
              <div className="text-slate-600 text-2xs">คณบดีคณะพุทธศาสตร์</div>
              <div className="text-slate-500 text-[10px]">มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย</div>
            </div>
          </div>
        </div>

      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 0;
          }
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          header, footer, nav {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
