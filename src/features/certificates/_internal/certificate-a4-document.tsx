"use client";

import * as React from "react";
import type { CertificateRequestMetadata } from "./validations";
import { buildCertificateDocumentText } from "./templates";

interface CertificateA4DocumentProps {
  metadata: CertificateRequestMetadata;
  requestId?: string;
  verificationUrl?: string;
  qrDataUrl?: string;
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

function FooterLeftTextBlock({
  customText,
  defaultLines,
  verifyUrlDisplay,
  footerFontSizePt,
  isEnglish,
}: {
  customText?: string;
  defaultLines: string[];
  verifyUrlDisplay: string;
  footerFontSizePt: number;
  isEnglish?: boolean;
}) {
  const lines = customText?.trim()
    ? customText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
    : defaultLines;

  return (
    <div className="leading-snug space-y-0.5">
      {lines.map((line, idx) => (
        <div
          key={idx}
          className={
            idx === 0
              ? "font-semibold text-slate-900"
              : line.startsWith("https://") || line.startsWith("http://")
              ? "text-black/80 font-mono text-[8pt]"
              : "text-black/85"
          }
        >
          {line}
        </div>
      ))}
      {verifyUrlDisplay && !lines.some((l) => l.includes(verifyUrlDisplay)) ? (
        <div
          className="text-black/60 font-mono text-[7.5pt] truncate pt-0.5"
          style={{ fontSize: `${Math.max(7, footerFontSizePt - 2)}pt` }}
        >
          {isEnglish ? "Verify: " : "ตรวจเอกสาร: "}
          {verifyUrlDisplay}
        </div>
      ) : null}
    </div>
  );
}

function CertificateFooterBlock({
  leftContent,
  qrDataUrl,
  docNo,
  requestId,
  isEnglish,
  footerFontSizePt,
  footerLayout,
}: {
  leftContent: React.ReactNode;
  qrDataUrl: string | null;
  docNo: string;
  requestId?: string;
  isEnglish?: boolean;
  footerFontSizePt: number;
  footerLayout: "TWO_COLUMNS" | "STACKED";
}) {
  if (footerLayout === "TWO_COLUMNS") {
    return (
      <div className="mt-4 pt-2.5 border-t border-black/25 flex items-end justify-between gap-4 text-black">
        {/* คอลัมน์ซ้าย: สำนักงานคณบดี / ติดต่อผู้ประสานงาน ถึง URL */}
        <div
          className="text-left leading-tight min-w-0 max-w-[54%]"
          style={{ fontSize: `${footerFontSizePt}pt` }}
        >
          {leftContent}
        </div>

        {/* คอลัมน์ขวา: ชุด QR Code พร้อมข้อมูลตรวจสอบความถูกต้อง */}
        <div className="flex items-center justify-end gap-2.5 shrink-0 max-w-[46%]">
          <div className="leading-tight text-right">
            <div className="font-bold text-[8.5pt]">
              {isEnglish
                ? "Official Verification • Faculty of Buddhism, MCU"
                : "ตรวจสอบความถูกต้องของเอกสาร • คณะพุทธศาสตร์ มจร"}
            </div>
            <div className="text-[7pt] text-black/70 mt-0.5">
              {isEnglish
                ? "Scan QR code to verify student status & authenticity"
                : "สแกน QR Code เพื่อตรวจสอบสถานภาพนิสิตและข้อมูลแท้จริง"}
            </div>
            <div className="text-[6.8pt] text-black/60 font-mono mt-0.5">
              Ref: {docNo} {requestId ? `• ID: ${requestId.slice(0, 8)}` : ""}
            </div>
          </div>
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt="Verification QR"
              className="w-13 h-13 border border-black/40 p-0.5 object-contain shrink-0 bg-white"
            />
          ) : (
            <div className="w-13 h-13 border border-dashed border-black/40 flex items-center justify-center text-[7pt] text-black/50 shrink-0 font-mono">
              QR STAMP
            </div>
          )}
        </div>
      </div>
    );
  }

  // แบบแถวเดี่ยวซ้อนแนวตั้ง (STACKED)
  return (
    <div className="mt-4">
      <div
        className="leading-snug text-black text-left"
        style={{ fontSize: `${footerFontSizePt}pt` }}
      >
        {leftContent}
      </div>
      <div className="mt-3 pt-2.5 border-t border-black/20 flex items-center justify-between gap-3 text-black">
        <div className="flex items-center gap-2.5">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt="Verification QR"
              className="w-14 h-14 border border-black/40 p-0.5 object-contain shrink-0 bg-white"
            />
          ) : (
            <div className="w-14 h-14 border border-dashed border-black/40 flex items-center justify-center text-[7pt] text-black/50 shrink-0 font-mono">
              QR STAMP
            </div>
          )}
          <div className="leading-tight">
            <div className="font-bold text-[8.5pt]">
              {isEnglish
                ? "Official Verification • Faculty of Buddhism, MCU"
                : "ตรวจสอบความถูกต้องของเอกสาร • คณะพุทธศาสตร์ มจร"}
            </div>
            <div className="text-[7.5pt] text-black/70 mt-0.5">
              {isEnglish
                ? "Scan QR code to verify student status & authenticity"
                : "สแกน QR Code เพื่อตรวจสอบสถานภาพนิสิตและข้อมูลแท้จริง"}
            </div>
            <div className="text-[7pt] text-black/55 font-mono mt-0.5">
              Ref: {docNo} {requestId ? `• ID: ${requestId.slice(0, 8)}` : ""}
            </div>
          </div>
        </div>
        <div className="text-right text-[7.5pt] text-black/50 font-mono shrink-0">
          MCU AUTHENTIC
        </div>
      </div>
    </div>
  );
}

export interface CertificateFontPreset {
  id: string;
  name: string;
  description: string;
  desc: string;
  isGoogleFont: boolean;
}

export const CERTIFICATE_FONT_PRESETS: CertificateFontPreset[] = [
  { id: "Sarabun", name: "TH Sarabun (สารบรรณ)", description: "มาตรฐานเอกสารราชการไทยและมหาวิทยาลัย (แนะนำ)", desc: "มาตรฐานเอกสารราชการไทยและมหาวิทยาลัย (แนะนำ)", isGoogleFont: true },
  { id: "Noto Serif Thai", name: "Noto Serif Thai (ทางการ/วิชาการ)", description: "แบบมีหัวคลาสสิก เรียบร้อย สง่างาม", desc: "แบบมีหัวคลาสสิก เรียบร้อย สง่างาม", isGoogleFont: true },
  { id: "Krub", name: "Krub (ครับ)", description: "ทางการ ทันสมัย สัดส่วนกะทัดรัด", desc: "ทางการ ทันสมัย สัดส่วนกะทัดรัด", isGoogleFont: true },
  { id: "Bai Jamjuree", name: "Bai Jamjuree (จามจุรี)", description: "ทรงเหลี่ยมมน สวยงาม ชัดเจน", desc: "ทรงเหลี่ยมมน สวยงาม ชัดเจน", isGoogleFont: true },
  { id: "Prompt", name: "Prompt (พร้อมต์)", description: "ทันสมัย ไม่มีหัว ชัดเจน", desc: "ทันสมัย ไม่มีหัว ชัดเจน", isGoogleFont: true },
  { id: "Chakra Petch", name: "Chakra Petch (จักรเพชร)", description: "สไตล์เหลี่ยมทางการ มีเอกลักษณ์", desc: "สไตล์เหลี่ยมทางการ มีเอกลักษณ์", isGoogleFont: true },
  { id: "Times New Roman", name: "Times New Roman", description: "มาตรฐานสากล สำหรับเอกสารภาษาอังกฤษ", desc: "มาตรฐานสากล สำหรับเอกสารภาษาอังกฤษ", isGoogleFont: false },
  { id: "Angsana New", name: "Angsana New (อังศนา)", description: "ฟอนต์ราชการ Windows ดั้งเดิม", desc: "ฟอนต์ราชการ Windows ดั้งเดิม", isGoogleFont: false },
  { id: "Cordia New", name: "Cordia New (คอร์เดีย)", description: "ฟอนต์ราชการ Windows ยอดนิยม", desc: "ฟอนต์ราชการ Windows ยอดนิยม", isGoogleFont: false },
];

export function resolveFontFamilyCss(font?: string, isEng?: boolean): string {
  const chosen = font || (isEng ? "Times New Roman" : "Sarabun");
  switch (chosen) {
    case "Sarabun":
    case "TH Sarabun":
    case "TH SarabunPSK":
      return "'Sarabun', 'TH SarabunPSK', 'TH Sarabun New', sans-serif";
    case "Noto Serif Thai":
      return "'Noto Serif Thai', 'TH SarabunPSK', serif";
    case "Krub":
      return "'Krub', 'Sarabun', 'TH SarabunPSK', sans-serif";
    case "Bai Jamjuree":
      return "'Bai Jamjuree', 'Sarabun', 'TH SarabunPSK', sans-serif";
    case "Prompt":
      return "'Prompt', 'Sarabun', 'TH SarabunPSK', sans-serif";
    case "Chakra Petch":
      return "'Chakra Petch', 'Sarabun', 'TH SarabunPSK', sans-serif";
    case "Angsana New":
      return "'Angsana New', 'AngsanaUPC', 'TH SarabunPSK', sans-serif";
    case "Cordia New":
      return "'Cordia New', 'CordiaUPC', 'TH SarabunPSK', sans-serif";
    case "Times New Roman":
      return '"Times New Roman", Times, Georgia, serif';
    default:
      return `${chosen}, 'Sarabun', 'TH SarabunPSK', sans-serif`;
  }
}

export function CertificateA4Document({
  metadata,
  requestId,
  verificationUrl,
  qrDataUrl,
}: CertificateA4DocumentProps) {
  const doc = buildCertificateDocumentText(metadata);
  const isEng = doc.template === "ENG_CERT";

  // ขนาดตัวอักษรต้นฉบับ: ภาษาไทย 16pt (มาตรฐานหนังสือราชการไทย Sarabun), ภาษาอังกฤษ 12.5pt (Times New Roman)
  const defaultPt = isEng ? 12.5 : 16;
  const fontSizePt = metadata.fontSizePt ?? defaultPt;
  const footerFontSizePt = metadata.footerFontSizePt ?? 10.5;
  const footerLayout = metadata.footerLayout ?? "TWO_COLUMNS";
  const lineHeight = metadata.lineHeight ?? (isEng ? 1.85 : 1.85);
  const marginTopMm = metadata.marginTopMm ?? 24;
  const marginSideMm = metadata.marginSideMm ?? 25;
  const showSignature = metadata.showSignatureGraphic !== false;
  const showPhotoBox = metadata.showPhotoBox !== false;

  const appOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const rawVerifyUrl =
    metadata.portalVerifyUrl?.trim() ||
    (appOrigin ? `${appOrigin}/portal/certificates/verify` : "https://fb.mcu.ac.th/portal/certificates/verify");
  const verifyUrlDisplay = rawVerifyUrl.replace(/^https?:\/\//, "");

  const [activeQr, setActiveQr] = React.useState<string | null>(null);
  const displayQr = qrDataUrl || activeQr;

  React.useEffect(() => {
    if (qrDataUrl) return;

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const baseVerifyUrl =
      metadata.portalVerifyUrl?.trim() ||
      (origin ? `${origin}/portal/certificates/verify` : "https://fb.mcu.ac.th/portal/certificates/verify");

    const targetUrl =
      verificationUrl ||
      (requestId
        ? `${baseVerifyUrl.replace(/\/$/, "")}/${requestId}`
        : baseVerifyUrl);

    if (targetUrl) {
      import("qrcode").then((QRCode) => {
        QRCode.toDataURL(targetUrl, {
          width: 140,
          margin: 1,
          color: { dark: "#000000", light: "#ffffff" },
        })
          .then((url) => setActiveQr(url))
          .catch(() => {});
      });
    }
  }, [requestId, verificationUrl, qrDataUrl, metadata.portalVerifyUrl]);

  const sheetStyle: React.CSSProperties = {
    width: "210mm",
    minHeight: "297mm",
    paddingTop: `${marginTopMm}mm`,
    paddingBottom: "16mm",
    paddingLeft: `${marginSideMm}mm`,
    paddingRight: `${marginSideMm}mm`,
    fontSize: `${fontSizePt}pt`,
    lineHeight,
    fontFamily: resolveFontFamilyCss(metadata.fontFamily, isEng),
    backgroundColor: "#ffffff",
    color: "#000000",
  };

  const googleFontsEmbed = (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          @import url('https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@300;400;500;600;700&family=Chakra+Petch:wght@300;400;600;700&family=Krub:wght@300;400;500;600;700&family=Noto+Serif+Thai:wght@300;400;600;700&family=Prompt:wght@300;400;500;600;700&family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');
        `,
      }}
    />
  );

  // =========================================================================
  // แบบที่ 2: หนังสือรับรองภาษาอังกฤษ (TO WHOM IT MAY CONCERN)
  // =========================================================================
  if (doc.template === "ENG_CERT") {
    return (
      <div
        className="certificate-print-sheet relative mx-auto bg-white text-black shadow-xl border border-slate-200 flex flex-col justify-between box-border"
        style={sheetStyle}
      >
        {googleFontsEmbed}
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

        {/* Bottom Photo Box & Student Signature + 2-Column Footer */}
        <div className="mt-6">
          <div className="space-y-1 mb-3" style={{ fontSize: `${Math.max(10.5, fontSizePt - 0.5)}pt` }}>
            {showPhotoBox && (
              <div
                className="border border-black ml-10 mb-4"
                style={{ width: "28mm", height: "34mm" }}
              />
            )}
            <div>Signature ..................................................</div>
            <div className="pl-16 font-bold">({metadata.fullName || "...................................."})</div>
          </div>

          <CertificateFooterBlock
            leftContent={
              <FooterLeftTextBlock
                customText={metadata.footerLeftText}
                defaultLines={[
                  "Office of Dean, Faculty of Buddhism",
                  "Mahachulalongkornrajavidyalaya University",
                  "Tel. +66 3524 8000 ext. 8323, 8096",
                  "https://fb.mcu.ac.th/",
                ]}
                verifyUrlDisplay={verifyUrlDisplay}
                footerFontSizePt={footerFontSizePt}
                isEnglish
              />
            }
            qrDataUrl={displayQr}
            docNo={doc.docNo}
            requestId={requestId}
            isEnglish
            footerFontSizePt={footerFontSizePt}
            footerLayout={footerLayout}
          />
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
        {googleFontsEmbed}
        <div>
          {/* เลขที่หนังสือ มุมซ้ายบน */}
          <div>ที่ อว {doc.docNo.replace(/^(ที่\s*)?อว\s*/i, "")}</div>

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

        {/* ผู้ประสานงานด้านล่าง (ซ้าย) + QR Verification (ขวา) */}
        <div className="mt-6">
          <CertificateFooterBlock
            leftContent={
              <FooterLeftTextBlock
                customText={metadata.footerLeftText}
                defaultLines={[
                  "ติดต่อผู้ประสานงาน:",
                  doc.coordinatorName || "สำนักงานคณบดีคณะพุทธศาสตร์",
                  `โทร. ${doc.coordinatorPhone || "035-248-096"}`,
                  "https://fb.mcu.ac.th/",
                ]}
                verifyUrlDisplay={verifyUrlDisplay}

                footerFontSizePt={footerFontSizePt}
              />
            }
            qrDataUrl={displayQr}
            docNo={doc.docNo}
            requestId={requestId}
            footerFontSizePt={footerFontSizePt}
            footerLayout={footerLayout}
          />
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
        {googleFontsEmbed}
        <div>
          {/* หัวกระดาษบันทึกข้อความ + ตรามหาวิทยาลัย (ตราสัญลักษณ์วงกลม มจร) */}
          <div className="relative flex items-center justify-center mb-4 min-h-[24mm]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/uploads/mcu-memo-seal.jpg"
              alt="MCU Emblem"
              className="absolute left-0 -top-1 w-[24mm] h-[24mm] object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/uploads/mcu-logo.png";
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
                <span>อว {doc.docNo.replace(/^(ที่\s*)?อว\s*/i, "")}</span>
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
          <div className="mt-8 ml-auto w-[68%] text-center">
            {showSignature ? <BlueInkSignature /> : <div className="h-12" />}
            <div>{doc.signerName}</div>
            <div>{doc.signerTitle}</div>
          </div>
        </div>

        {/* ส่วนท้าย 2 คอลัมน์: สำนักงานคณะพุทธศาสตร์ (ซ้าย) + QR Verification (ขวา) */}
        <div className="mt-6">
          <CertificateFooterBlock
            leftContent={
              <FooterLeftTextBlock
                customText={metadata.footerLeftText}
                defaultLines={[
                  "สำนักงานคณบดีคณะพุทธศาสตร์",
                  "มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
                  "โทรศัพท์ ๐-๓๕๒๔-๘๐๙๖ ภายใน ๘๐๙๖",
                  "https://fb.mcu.ac.th/",
                ]}
                verifyUrlDisplay={verifyUrlDisplay}
                footerFontSizePt={footerFontSizePt}
              />
            }
            qrDataUrl={displayQr}
            docNo={doc.docNo}
            requestId={requestId}
            footerFontSizePt={footerFontSizePt}
            footerLayout={footerLayout}
          />
        </div>
      </div>
    );
  }

  // =========================================================================
  // แบบที่ 1 (ค่าเริ่มต้น): หนังสือรับรองนิสิต (ภาษาไทย - สำหรับ ตม.)
  // =========================================================================
  return (
    <div
      className="certificate-print-sheet relative mx-auto bg-white text-black shadow-xl border border-slate-200 flex flex-col justify-between box-border"
      style={sheetStyle}
    >
      {googleFontsEmbed}
      <div>
        {/* มุมซ้ายบน: ที่ อว 8002 / ... */}
        <div>ที่ อว {doc.docNo.replace(/^(ที่\s*)?อว\s*/i, "")}</div>

        {/* หัวเรื่อง: หนังสือรับรอง */}
        <div
          className="text-center font-bold my-8"
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

      {/* มุมซ้ายล่าง: กรอบติดรูปถ่าย + ลงชื่อนิสิต + ข้อมูลติดต่อสำนักงานคณะพุทธศาสตร์ + QR Verification */}
      <div className="mt-6">
        {showPhotoBox && (
          <div
            className="border border-black ml-12 mb-5"
            style={{ width: "28mm", height: "34mm" }}
          />
        )}
        <div className="space-y-0.5">
          <div>ลงชื่อ ..................................................</div>
          <div className="pl-14" style={{ fontSize: `${Math.max(12, fontSizePt - 1.5)}pt` }}>
            ({metadata.fullName || "............................................"})
          </div>
        </div>

        <div className="mt-3">
          <CertificateFooterBlock
            leftContent={
              <FooterLeftTextBlock
                customText={metadata.footerLeftText}
                defaultLines={[
                  "สำนักงานคณบดีคณะพุทธศาสตร์",
                  "มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
                  "โทรศัพท์ ๐-๓๕๒๔-๘๐๙๖ ภายใน ๘๐๙๖",
                  "https://fb.mcu.ac.th/",
                ]}
                verifyUrlDisplay={verifyUrlDisplay}
                footerFontSizePt={footerFontSizePt}
              />
            }
            qrDataUrl={displayQr}
            docNo={doc.docNo}
            requestId={requestId}
            footerFontSizePt={footerFontSizePt}
            footerLayout={footerLayout}
          />
        </div>
      </div>
    </div>
  );
}
