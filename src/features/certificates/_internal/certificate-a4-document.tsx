"use client";

import * as React from "react";
import type { CertificateRequestMetadata } from "./validations";
import { buildCertificateDocumentText } from "./templates";

interface CertificateA4DocumentProps {
  metadata: CertificateRequestMetadata;
}

function BlueInkSignature({ isEnglish }: { isEnglish?: boolean }) {
  if (isEnglish) {
    return (
      <svg
        viewBox="0 0 280 56"
        className="w-48 h-12 mx-auto my-1 select-none pointer-events-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M18 42 C24 18, 32 14, 34 38 C35 26, 44 22, 48 36 C54 14, 60 12, 58 38 C64 28, 72 28, 76 38 M92 22 C82 20, 78 30, 90 33 C102 36, 98 44, 84 42 M106 30 L106 40 M106 22 L107 24 M114 38 C118 28, 124 28, 128 38 C132 28, 138 28, 142 38 C148 26, 158 24, 162 38 C168 18, 174 18, 172 38 C180 28, 192 26, 198 38 C206 16, 216 16, 212 38 C222 36, 248 40, 265 32"
          stroke="#1d4ed8"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 240 60"
      className="w-40 h-12 mx-auto my-1 select-none pointer-events-none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M35 38 C30 24, 46 22, 44 38 C48 28, 60 28, 64 38 C70 26, 84 26, 86 38 C94 22, 112 18, 102 44 C96 54, 114 52, 126 38 C136 26, 152 20, 146 36 C158 28, 185 38, 210 22"
        stroke="#1d4ed8"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CertificateA4Document({ metadata }: CertificateA4DocumentProps) {
  const doc = buildCertificateDocumentText(metadata);
  const isEng = doc.template === "ENG_CERT";

  // ขนาดตัวอักษรต้นฉบับ: ภาษาไทย 16pt (มาตรฐานหนังสือราชการไทย Sarabun), ภาษาอังกฤษ 12.5pt (Times New Roman)
  const defaultPt = isEng ? 12.5 : 16;
  const fontSizePt = metadata.fontSizePt ?? defaultPt;
  const lineHeight = metadata.lineHeight ?? (isEng ? 1.85 : 1.85);
  const marginTopMm = metadata.marginTopMm ?? 24;
  const marginSideMm = metadata.marginSideMm ?? 25;
  const showSignature = metadata.showSignatureGraphic !== false;
  const showPhotoBox = metadata.showPhotoBox !== false;

  const sheetStyle: React.CSSProperties = {
    width: "210mm",
    minHeight: "297mm",
    paddingTop: `${marginTopMm}mm`,
    paddingBottom: "20mm",
    paddingLeft: `${marginSideMm}mm`,
    paddingRight: `${marginSideMm}mm`,
    fontSize: `${fontSizePt}pt`,
    lineHeight,
    fontFamily: isEng
      ? '"Times New Roman", Times, Georgia, serif'
      : 'var(--font-sarabun), "TH SarabunPSK", "Sarabun", sans-serif',
    backgroundColor: "#ffffff",
    color: "#000000",
  };

  // =========================================================================
  // แบบที่ 2: หนังสือรับรองภาษาอังกฤษ (TO WHOM IT MAY CONCERN)
  // =========================================================================
  if (doc.template === "ENG_CERT") {
    return (
      <div
        className="certificate-print-sheet relative mx-auto bg-white text-black shadow-xl border border-slate-200 flex flex-col justify-between box-border"
        style={sheetStyle}
      >
        <div>
          {/* Top-Left Office of Dean Header */}
          <div style={{ fontSize: `${Math.max(10, fontSizePt - 1.5)}pt`, lineHeight: 1.35 }}>
            <div className="font-bold">Office of Dean</div>
            <div>Tel. 0-3524-8000 ext. 8323</div>
            <div>Fax. 0-3524-8096</div>
            <div>https://fb.mcu.ac.th/</div>
          </div>

          {/* MCU No. */}
          <div className="mt-5 font-bold" style={{ fontSize: `${fontSizePt + 0.5}pt` }}>
            MCU No. {doc.docNo}
          </div>

          {/* Title */}
          <div
            className="text-center font-bold uppercase tracking-wide my-8"
            style={{ fontSize: `${fontSizePt + 1}pt` }}
          >
            TO WHOM IT MAY CONCERN
          </div>

          {/* Body Paragraph 1 */}
          <p className="text-justify" style={{ textIndent: "1.6cm" }}>
            {doc.paragraph1}
          </p>

          {/* Body Paragraph 2 */}
          {doc.paragraph2 && (
            <p className="mt-4" style={{ textIndent: "1.6cm" }}>
              {doc.paragraph2}
            </p>
          )}

          {/* Issued Date */}
          <div className="mt-6" style={{ paddingLeft: "3.2cm" }}>
            Issued on {doc.issueDateEn}
          </div>

          {/* Signer Block */}
          <div className="mt-8 ml-auto w-[72%] text-center">
            {showSignature ? <BlueInkSignature isEnglish /> : <div className="h-12" />}
            <div>{doc.signerName}</div>
            <div>{doc.signerTitle}</div>
            <div>{doc.signerOrg}</div>
          </div>
        </div>

        {/* Bottom-Left Photo Box & Student Signature */}
        <div className="mt-10">
          {showPhotoBox && (
            <div
              className="border border-black ml-14 mb-8"
              style={{ width: "30mm", height: "36mm" }}
            />
          )}
          <div className="space-y-1" style={{ fontSize: `${Math.max(10.5, fontSizePt - 0.5)}pt` }}>
            <div>Signature ..................................................</div>
            <div className="pl-20 font-bold">({metadata.fullName || "...................................."})</div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // แบบที่ 3: หนังสือขอความอนุเคราะห์ธนาคาร (Mobile Banking / เปิดบัญชีธนาคาร)
  // =========================================================================
  if (doc.template === "BANK_LETTER") {
    return (
      <div
        className="certificate-print-sheet relative mx-auto bg-white text-black shadow-xl border border-slate-200 flex flex-col justify-between box-border"
        style={sheetStyle}
      >
        <div>
          {/* เลขที่หนังสือ มุมซ้ายบน */}
          <div>ที่ อว {doc.docNo}</div>

          {/* วันที่ กึ่งกลางค่อนขวา */}
          <div className="mt-14 mb-6 text-center pl-12">{doc.issueDateTh}</div>

          {/* เรื่อง / เจริญพร / สิ่งที่ส่งมาด้วย */}
          <div className="space-y-1.5 mb-6">
            <div className="flex gap-3">
              <span className="font-bold shrink-0">เรื่อง</span>
              <span>{doc.subjectTh}</span>
            </div>
            <div className="flex gap-3">
              <span className="font-bold shrink-0">เจริญพร</span>
              <span>{doc.recipientTh}</span>
            </div>
            <div className="flex gap-3">
              <span className="font-bold shrink-0">สิ่งที่ส่งมาด้วย</span>
              <span className="whitespace-pre-wrap">{doc.attachmentTh}</span>
            </div>
          </div>

          {/* ย่อหน้าที่ 1 */}
          <p className="text-justify" style={{ textIndent: "2.5cm" }}>
            {doc.paragraph1}
          </p>

          {/* ย่อหน้าที่ 2 */}
          {doc.paragraph2 && (
            <p className="mt-4 text-justify" style={{ textIndent: "2.5cm" }}>
              {doc.paragraph2}
            </p>
          )}

          {/* ลงนาม */}
          <div className="mt-10 text-center">
            <div className="mb-2">ขอเจริญพร</div>
            {showSignature ? <BlueInkSignature /> : <div className="h-12" />}
            <div>{doc.signerName}</div>
            <div>{doc.signerTitle}</div>
            <div>{doc.signerOrg}</div>
          </div>
        </div>

        {/* ผู้ประสานงานด้านล่าง */}
        <div className="mt-12 pt-4" style={{ fontSize: `${Math.max(12, fontSizePt - 1.5)}pt`, lineHeight: 1.4 }}>
          <div className="font-bold">ติดต่อผู้ประสานงาน:</div>
          <div className="flex flex-wrap gap-x-16">
            <span>{doc.coordinatorName}</span>
            <span>โทร. {doc.coordinatorPhone}</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // แบบที่ 4: บันทึกข้อความ (ขอความอนุเคราะห์ออกหนังสือรับรองที่อยู่)
  // =========================================================================
  if (doc.template === "RESIDENCE_MEMO") {
    return (
      <div
        className="certificate-print-sheet relative mx-auto bg-white text-black shadow-xl border border-slate-200 flex flex-col justify-between box-border"
        style={sheetStyle}
      >
        <div>
          {/* หัวกระดาษบันทึกข้อความ + ตรามหาวิทยาลัย */}
          <div className="relative flex items-center justify-center mb-4 min-h-[22mm]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/uploads/mcu-logo.png"
              alt="MCU Logo"
              className="absolute left-0 top-0 w-20 h-20 object-contain grayscale contrast-125"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
            <h1 className="font-bold tracking-wide" style={{ fontSize: `${fontSizePt + 10}pt` }}>
              บันทึกข้อความ
            </h1>
          </div>

          {/* ตารางหัวบันทึกข้อความ */}
          <div className="space-y-1 mb-3">
            <div className="flex items-baseline justify-between border-b border-black/70 pb-0.5">
              <div>
                <span className="font-bold mr-3">ส่วนงาน</span>
                <span>คณะพุทธศาสตร์</span>
              </div>
              <div>
                <span className="font-bold mr-2">โทรศัพท์</span>
                <span>๐-๓๕๒๔-๘๐๙๖ ภายใน ๘๐๙๖</span>
              </div>
            </div>

            <div className="flex items-baseline justify-between border-b border-black/70 pb-0.5">
              <div className="w-1/2">
                <span className="font-bold mr-3">ที่</span>
                <span>อว {doc.docNo}</span>
              </div>
              <div className="w-1/2">
                <span className="font-bold mr-3">วันที่</span>
                <span>{doc.issueDateTh}</span>
              </div>
            </div>

            <div className="flex items-baseline border-b border-black/70 pb-0.5">
              <span className="font-bold mr-3 shrink-0">เรื่อง</span>
              <span>{doc.subjectTh}</span>
            </div>
          </div>

          {/* เรียน */}
          <div className="mt-3 mb-5">
            <span className="font-bold mr-3">เรียน</span>
            <span>{doc.recipientTh}</span>
          </div>

          {/* เนื้อหา 3 ย่อหน้า */}
          <p className="text-justify" style={{ textIndent: "2.5cm" }}>
            {doc.paragraph1}
          </p>

          {doc.paragraph2 && (
            <p className="mt-4 text-justify" style={{ textIndent: "2.5cm" }}>
              {doc.paragraph2}
            </p>
          )}

          {doc.paragraph3 && (
            <p className="mt-4" style={{ textIndent: "2.5cm" }}>
              {doc.paragraph3}
            </p>
          )}

          {/* ลงนาม */}
          <div className="mt-10 ml-auto w-[68%] text-center">
            {showSignature ? <BlueInkSignature /> : <div className="h-12" />}
            <div>{doc.signerName}</div>
            <div>{doc.signerTitle}</div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // แบบที่ 1 (ค่าเริ่มต้น): หนังสือรับรองนิสิต (ภาษาไทย)
  // =========================================================================
  return (
    <div
      className="certificate-print-sheet relative mx-auto bg-white text-black shadow-xl border border-slate-200 flex flex-col justify-between box-border"
      style={sheetStyle}
    >
      <div>
        {/* มุมซ้ายบน: ที่ อว 8002 / ... */}
        <div>ที่ อว {doc.docNo}</div>

        {/* หัวเรื่อง: หนังสือรับรอง */}
        <div
          className="text-center font-bold my-9"
          style={{ fontSize: `${fontSizePt + 2}pt` }}
        >
          หนังสือรับรอง
        </div>

        {/* เนื้อความรับรอง */}
        <p className="text-justify" style={{ textIndent: "2.5cm" }}>
          {doc.paragraph1}
        </p>

        {/* ให้ไว้ ณ วันที่ */}
        <div className="mt-4" style={{ paddingLeft: "2.5cm" }}>
          ให้ไว้ ณ วันที่ {doc.issueDateTh}
        </div>

        {/* ลายเซ็นผู้ลงนาม */}
        <div className="mt-6 ml-auto w-[72%] text-center">
          {showSignature ? <BlueInkSignature /> : <div className="h-12" />}
          <div>{doc.signerName}</div>
          <div>{doc.signerTitle}</div>
        </div>
      </div>

      {/* มุมซ้ายล่าง: กรอบติดรูปถ่าย + ลงชื่อนิสิต + ข้อมูลติดต่อสำนักงานคณะพุทธศาสตร์ */}
      <div className="mt-8">
        {showPhotoBox && (
          <div
            className="border border-black ml-14 mb-7"
            style={{ width: "28mm", height: "34mm" }}
          />
        )}
        <div className="space-y-0.5">
          <div>ลงชื่อ ..................................................</div>
          <div className="pl-16" style={{ fontSize: `${Math.max(12, fontSizePt - 1.5)}pt` }}>
            ({metadata.fullName || "............................................"})
          </div>
        </div>

        <div className="mt-4 leading-snug" style={{ fontSize: `${Math.max(13, fontSizePt - 0.5)}pt` }}>
          <div>สำนักงานคณะพุทธศาสตร์</div>
          <div>โทรศัพท์ 035-247-8000 ต่อ 8323</div>
          <div>https://fb.mcu.ac.th/</div>
        </div>
      </div>
    </div>
  );
}
