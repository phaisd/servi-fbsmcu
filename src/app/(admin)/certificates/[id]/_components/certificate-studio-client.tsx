"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  Save,
  CheckCircle2,
  RotateCcw,
  Type,
  FileText,
  UserCheck,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Edit3,
  Globe,
  Building2,
  FileSpreadsheet,
} from "lucide-react";
import {
  CertificateA4Document,
  CERTIFICATE_PURPOSES,
  buildCertificateDocumentText,
  type CertificateRequestMetadata,
  type CertificateTemplateType,
} from "@/features/certificates";
import {
  updateCertificateRequestAction,
  reviewRequestAction,
  lookupStudentByCodeAction,
} from "@/features/certificates/actions";

interface SerializedCertificateRequest {
  id: string;
  certificateTypeId: string;
  typeName: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: string;
  reason: string | null;
  issuedDocumentUrl: string | null;
  note: string | null;
  createdAt: string;
  metadata: CertificateRequestMetadata;
}

interface Props {
  request: SerializedCertificateRequest;
  certificateTypes: { id: string; name: string }[];
}

const TEMPLATE_CARDS: {
  id: CertificateTemplateType;
  title: string;
  subtitle: string;
  defaultFontPt: number;
  defaultLineHeight: number;
  badge: string;
}[] = [
  {
    id: "THAI_CERT",
    title: "หนังสือรับรองนิสิต (ภาษาไทย)",
    subtitle: "ที่ อว 8002/... สำหรับต่อวีซ่า (ตม.) หรือรับรองสถานภาพ",
    defaultFontPt: 16,
    defaultLineHeight: 1.85,
    badge: "TH • 16pt",
  },
  {
    id: "ENG_CERT",
    title: "English Certificate (ใช้นอกประเทศ)",
    subtitle: "TO WHOM IT MAY CONCERN • Office of Dean",
    defaultFontPt: 12.5,
    defaultLineHeight: 1.85,
    badge: "EN • 12.5pt",
  },
  {
    id: "BANK_LETTER",
    title: "หนังสือขอความอนุเคราะห์ธนาคาร",
    subtitle: "เจริญพร ผู้จัดการธนาคาร (เปิดบัญชี / Mobile Banking)",
    defaultFontPt: 16,
    defaultLineHeight: 1.85,
    badge: "BANK • 16pt",
  },
  {
    id: "RESIDENCE_MEMO",
    title: "บันทึกข้อความ รับรองที่อยู่นิสิต",
    subtitle: "เรียน ผอ.กองกิจการนิสิต (ส่วนงานคณะพุทธศาสตร์)",
    defaultFontPt: 16,
    defaultLineHeight: 1.75,
    badge: "MEMO • 16pt",
  },
];

export function CertificateStudioClient({ request }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [meta, setMeta] = useState<CertificateRequestMetadata>(() => {
    const initial = request.metadata;
    const tpl = initial.docTemplate || "THAI_CERT";
    return {
      ...initial,
      docTemplate: tpl,
      fontSizePt: initial.fontSizePt ?? (tpl === "ENG_CERT" ? 12.5 : 16),
      lineHeight: initial.lineHeight ?? 1.85,
      marginTopMm: initial.marginTopMm ?? 24,
      marginSideMm: initial.marginSideMm ?? 25,
      showSignatureGraphic: initial.showSignatureGraphic ?? true,
      showPhotoBox: initial.showPhotoBox ?? true,
    };
  });

  const [status, setStatus] = useState<"PENDING" | "APPROVED" | "REJECTED" | "CANCELLED">(
    (request.status as "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED") || "PENDING"
  );
  const [activeTab, setActiveTab] = useState<"layout" | "doc" | "student" | "customText">("layout");
  const [zoomPercent, setZoomPercent] = useState<number>(90);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const updateField = <K extends keyof CertificateRequestMetadata>(
    key: K,
    value: CertificateRequestMetadata[K]
  ) => {
    setMeta((prev) => ({ ...prev, [key]: value }));
  };

  const handleSelectTemplate = (tpl: CertificateTemplateType) => {
    const card = TEMPLATE_CARDS.find((c) => c.id === tpl);
    setMeta((prev) => ({
      ...prev,
      docTemplate: tpl,
      fontSizePt: card ? card.defaultFontPt : 16,
      lineHeight: card ? card.defaultLineHeight : 1.85,
      language: tpl === "ENG_CERT" ? "In English language" : "In Thai language",
    }));
  };

  const handleResetOriginalFont = () => {
    const isEng = meta.docTemplate === "ENG_CERT";
    setMeta((prev) => ({
      ...prev,
      fontSizePt: isEng ? 12.5 : 16,
      lineHeight: 1.85,
      marginTopMm: 24,
      marginSideMm: 25,
    }));
    showToast(
      isEng
        ? "ตั้งค่าขนาดตัวอักษรเท่าต้นฉบับภาษาอังกฤษ (12.5pt) เรียบร้อย"
        : "ตั้งค่าขนาดตัวอักษรเท่าต้นฉบับหนังสือราชการไทย (16pt) เรียบร้อย"
    );
  };

  const handleSave = (approveAlso = false) => {
    startTransition(async () => {
      try {
        const nextStatus = approveAlso ? "APPROVED" : status;
        await updateCertificateRequestAction(request.id, {
          status: nextStatus,
          metadata: meta,
        });

        if (approveAlso) {
          await reviewRequestAction(request.id, {
            status: "APPROVED",
            metadata: meta,
          });
          setStatus("APPROVED");
        }
        showToast(
          approveAlso
            ? "อนุมัติคำขอและบันทึกการตั้งค่าหนังสือรับรองเรียบร้อยแล้ว"
            : "บันทึกข้อมูลและการตั้งค่าขนาดตัวอักษรเรียบร้อยแล้ว"
        );
        router.refresh();
      } catch {
        showToast("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    });
  };

  const handleAutoLookupStudent = () => {
    if (!meta.studentCode?.trim()) {
      showToast("กรุณาระบุรหัสนิสิตก่อนค้นหา");
      return;
    }
    startTransition(async () => {
      const found = await lookupStudentByCodeAction(meta.studentCode.trim());
      if (!found) {
        showToast("ไม่พบรหัสนิสิตนี้ในฐานข้อมูลนิสิต");
        return;
      }
      setMeta((prev) => ({
        ...prev,
        fullName: found.fullName || prev.fullName,
        degreeLevel: found.degreeLevel || prev.degreeLevel,
        major: found.major || prev.major,
        classYear: found.classYear || prev.classYear,
        sex: found.sex || prev.sex,
        email: found.email || prev.email,
        phone: found.phone || prev.phone,
      }));
      showToast(`ดึงข้อมูลนิสิต ${found.fullName} เรียบร้อยแล้ว`);
    });
  };

  const handleLoadGeneratedBodyIntoCustom = () => {
    const built = buildCertificateDocumentText({ ...meta, customBodyText: "" });
    const combined = [built.paragraph1, built.paragraph2, built.paragraph3]
      .filter(Boolean)
      .join("\n\n");
    updateField("customBodyText", combined);
    showToast("ดึงข้อความต้นฉบับเข้าสู่โหมดแก้ไขข้อความอิสระแล้ว");
  };

  const handlePrint = () => {
    window.print();
  };

  const isEng = meta.docTemplate === "ENG_CERT";

  const fontPresets = isEng
    ? [
        { label: "ขนาดเล็ก (11.5pt)", pt: 11.5, lh: 1.65 },
        { label: "เท่าต้นฉบับ (12.5pt)", pt: 12.5, lh: 1.85 },
        { label: "ขนาดกลาง (13.5pt)", pt: 13.5, lh: 1.85 },
        { label: "ขนาดใหญ่ (15pt)", pt: 15, lh: 1.9 },
      ]
    : [
        { label: "ขนาดค่อนข้างเล็ก (14.5pt)", pt: 14.5, lh: 1.7 },
        { label: "เท่าต้นฉบับ (16pt)", pt: 16, lh: 1.85 },
        { label: "ขนาดกลางใหญ่ (17pt)", pt: 17, lh: 1.85 },
        { label: "ขนาดใหญ่พิเศษ (18.5pt)", pt: 18.5, lh: 1.9 },
      ];

  return (
    <div className="min-h-screen bg-slate-100/80 pb-16 print:min-h-0 print:bg-white print:pb-0">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl print:hidden">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Sticky Action Header (Hidden in Print) */}
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-6 py-3.5">
          <div className="flex items-center gap-3">
            <Link
              href="/certificates"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              กลับหน้ารายการคำขอ
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900">
                  สตูดิโอออกหนังสือรับรองและปรับขนาดตัวอักษร (PDF / A4 Print Studio)
                </h1>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    status === "APPROVED"
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                      : status === "REJECTED"
                        ? "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20"
                        : "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
                  }`}
                >
                  {status === "APPROVED"
                    ? "อนุมัติแล้ว"
                    : status === "REJECTED"
                      ? "ไม่อนุมัติ"
                      : "รอดำเนินการ"}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                รหัสนิสิต:{" "}
                <span className="font-mono font-semibold text-slate-700">
                  {meta.studentCode || "-"}
                </span>{" "}
                • ชื่อ-ฉายา:{" "}
                <span className="font-semibold text-slate-700">
                  {meta.fullName || request.userName}
                </span>{" "}
                • สัญชาติ: {meta.nationality || "-"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleResetOriginalFont}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
              title="รีเซ็ตขนาดตัวอักษรให้เท่ากับไฟล์ PDF ต้นฉบับ"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              ขนาดเท่าต้นฉบับ ({isEng ? "12.5pt" : "16pt"})
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={() => handleSave(false)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              บันทึกการแก้ไข
            </button>

            {status !== "APPROVED" && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleSave(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-500 disabled:opacity-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                อนุมัติและบันทึก
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              <Printer className="h-4 w-4 text-amber-400" />
              พิมพ์หนังสือ / บันทึกเป็น PDF (A4)
            </button>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-6 px-6 pt-6 lg:grid-cols-12 print:block print:max-w-none print:p-0">
        {/* LEFT CONTROL PANEL (Hidden in Print) */}
        <div className="space-y-5 lg:col-span-5 xl:col-span-4 print:hidden">
          {/* Step 1: Select Official PDF Template */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <FileText className="h-4 w-4 text-indigo-600" />
                1. เลือกแบบฟอร์มหนังสือรับรอง (4 แบบมาตรฐาน)
              </h2>
              <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                A4 Standard
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {TEMPLATE_CARDS.map((card) => {
                const active = meta.docTemplate === card.id;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => handleSelectTemplate(card.id)}
                    className={`flex items-start justify-between rounded-xl border p-3 text-left transition ${
                      active
                        ? "border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600/15"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{card.title}</span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500">{card.subtitle}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-bold ${
                        active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {card.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Tabs for Font Size, Document Header, Student Data, Custom Text */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="grid grid-cols-4 border-b border-slate-200 bg-slate-50/70 p-1.5 rounded-t-2xl gap-1">
              <button
                type="button"
                onClick={() => setActiveTab("layout")}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition ${
                  activeTab === "layout"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Type className="h-3.5 w-3.5" />
                ขนาดอักษร
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("doc")}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition ${
                  activeTab === "doc"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Building2 className="h-3.5 w-3.5" />
                เลขที่/ผู้ลงนาม
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("student")}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition ${
                  activeTab === "student"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <UserCheck className="h-3.5 w-3.5" />
                ข้อมูลนิสิต
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("customText")}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition ${
                  activeTab === "customText"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Edit3 className="h-3.5 w-3.5" />
                แก้ไขเนื้อหา
              </button>
            </div>

            <div className="p-5">
              {/* TAB 1: FONT SIZE & LAYOUT */}
              {activeTab === "layout" && (
                <div className="space-y-5">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        ปุ่มลัดขนาดตัวอักษร (Font Size Presets)
                      </label>
                      <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800 ring-1 ring-amber-500/20">
                        ปัจจุบัน: {meta.fontSizePt} pt
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {fontPresets.map((preset) => {
                        const isCurrent = Math.abs((meta.fontSizePt || 16) - preset.pt) < 0.1;
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              updateField("fontSizePt", preset.pt);
                              updateField("lineHeight", preset.lh);
                            }}
                            className={`rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${
                              isCurrent
                                ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Fine Slider for Font Size */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">
                        ปรับขนาดตัวอักษรละเอียด (10pt – 26pt)
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            updateField(
                              "fontSizePt",
                              Math.max(10, Number(((meta.fontSizePt || 16) - 0.5).toFixed(1)))
                            )
                          }
                          className="h-7 w-7 rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100"
                        >
                          -
                        </button>
                        <span className="w-16 text-center font-mono text-xs font-bold text-indigo-700">
                          {meta.fontSizePt} pt
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateField(
                              "fontSizePt",
                              Math.min(26, Number(((meta.fontSizePt || 16) + 0.5).toFixed(1)))
                            )
                          }
                          className="h-7 w-7 rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={26}
                      step={0.5}
                      value={meta.fontSizePt || 16}
                      onChange={(e) => updateField("fontSizePt", parseFloat(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                    <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                      <span>10pt (เล็ก)</span>
                      <span>{isEng ? "12.5pt (ต้นฉบับ EN)" : "16pt (ต้นฉบับ TH)"}</span>
                      <span>26pt (ใหญ่พิเศษ)</span>
                    </div>
                  </div>

                  {/* Line Height Slider */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">
                        ระยะห่างระหว่างบรรทัด (Line Height)
                      </span>
                      <span className="font-mono text-xs font-bold text-indigo-700">
                        {(meta.lineHeight || 1.85).toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1.2}
                      max={2.4}
                      step={0.05}
                      value={meta.lineHeight || 1.85}
                      onChange={(e) => updateField("lineHeight", parseFloat(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  {/* Margins (Top & Side) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-700">
                          ขอบกระดาษด้านบน
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-800">
                          {meta.marginTopMm ?? 24} มม.
                        </span>
                      </div>
                      <input
                        type="range"
                        min={12}
                        max={40}
                        step={1}
                        value={meta.marginTopMm ?? 24}
                        onChange={(e) => updateField("marginTopMm", parseInt(e.target.value, 10))}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-700">
                          ขอบซ้าย-ขวา
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-800">
                          {meta.marginSideMm ?? 25} มม.
                        </span>
                      </div>
                      <input
                        type="range"
                        min={12}
                        max={40}
                        step={1}
                        value={meta.marginSideMm ?? 25}
                        onChange={(e) => updateField("marginSideMm", parseInt(e.target.value, 10))}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                  </div>

                  {/* Checkboxes for Photo Box & Signature */}
                  <div className="space-y-2 border-t border-slate-200 pt-3">
                    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 px-3.5 py-2.5 hover:bg-slate-50">
                      <span className="text-xs font-semibold text-slate-700">
                        แสดงลายเซ็นผู้ลงนามจำลองในใบรับรอง
                      </span>
                      <input
                        type="checkbox"
                        checked={meta.showSignatureGraphic ?? true}
                        onChange={(e) => updateField("showSignatureGraphic", e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                      />
                    </label>

                    {(meta.docTemplate === "THAI_CERT" || meta.docTemplate === "ENG_CERT") && (
                      <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 px-3.5 py-2.5 hover:bg-slate-50">
                        <span className="text-xs font-semibold text-slate-700">
                          แสดงกรอบติดรูปถ่ายนิสิตในเอกสาร
                        </span>
                        <input
                          type="checkbox"
                          checked={meta.showPhotoBox ?? true}
                          onChange={(e) => updateField("showPhotoBox", e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: DOCUMENT NUMBER & SIGNER */}
              {activeTab === "doc" && (
                <div className="space-y-3.5">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      เลขที่หนังสือ (ที่ อว ... หรือ MCU No.)
                    </label>
                    <input
                      type="text"
                      value={meta.docNo || ""}
                      onChange={(e) => updateField("docNo", e.target.value)}
                      placeholder="เช่น 8002 / 710"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  {isEng ? (
                    <>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">
                          วันที่ออกหนังสือภาษาอังกฤษ (Issued on ...)
                        </label>
                        <input
                          type="text"
                          value={meta.issueDateEn || ""}
                          onChange={(e) => updateField("issueDateEn", e.target.value)}
                          placeholder="เช่น March 19, 2026"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">
                          ชื่อผู้ลงนาม (ภาษาอังกฤษ)
                        </label>
                        <input
                          type="text"
                          value={meta.signerNameEn || ""}
                          onChange={(e) => updateField("signerNameEn", e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">
                          ตำแหน่งผู้ลงนาม (ภาษาอังกฤษ)
                        </label>
                        <input
                          type="text"
                          value={meta.signerTitleEn || ""}
                          onChange={(e) => updateField("signerTitleEn", e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">
                          วันที่ออกหนังสือ (ภาษาไทย)
                        </label>
                        <input
                          type="text"
                          value={meta.issueDateTh || ""}
                          onChange={(e) => updateField("issueDateTh", e.target.value)}
                          placeholder="เช่น 19 มีนาคม พ.ศ. 2569"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">
                          ชื่อผู้ลงนาม (ภาษาไทย)
                        </label>
                        <input
                          type="text"
                          value={meta.signerNameTh || ""}
                          onChange={(e) => updateField("signerNameTh", e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">
                          ตำแหน่งผู้ลงนาม (ภาษาไทย)
                        </label>
                        <input
                          type="text"
                          value={meta.signerTitleTh || ""}
                          onChange={(e) => updateField("signerTitleTh", e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900"
                        />
                      </div>
                    </>
                  )}

                  {meta.docTemplate === "BANK_LETTER" && (
                    <>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">
                          เรียน / เจริญพร (ชื่อธนาคารและสาขา)
                        </label>
                        <input
                          type="text"
                          value={meta.bankTargetTh || ""}
                          onChange={(e) => updateField("bankTargetTh", e.target.value)}
                          placeholder="เช่น ผู้จัดการธนาคารกรุงไทย สาขาโลตัส นวนคร"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-700">
                            ชื่อผู้ประสานงาน
                          </label>
                          <input
                            type="text"
                            value={meta.coordinatorNameTh || ""}
                            onChange={(e) => updateField("coordinatorNameTh", e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-700">
                            เบอร์โทรผู้ประสานงาน
                          </label>
                          <input
                            type="text"
                            value={meta.coordinatorPhoneTh || ""}
                            onChange={(e) => updateField("coordinatorPhoneTh", e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="pt-2">
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      สถานะคำขอ
                    </label>
                    <select
                      value={status}
                      onChange={(e) =>
                        setStatus(
                          e.target.value as "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED"
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800"
                    >
                      <option value="PENDING">PENDING (รออนุมัติ)</option>
                      <option value="APPROVED">APPROVED (อนุมัติแล้ว)</option>
                      <option value="REJECTED">REJECTED (ไม่อนุมัติ)</option>
                      <option value="CANCELLED">CANCELLED (ยกเลิก)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* TAB 3: STUDENT & EXCEL FIELDS */}
              {activeTab === "student" && (
                <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                        รหัสนิสิต (Student ID)
                      </label>
                      <input
                        type="text"
                        value={meta.studentCode || ""}
                        onChange={(e) => updateField("studentCode", e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-mono"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleAutoLookupStudent}
                        className="rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                      >
                        ดึงข้อมูลนิสิต
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                      ชื่อ - ฉายา / นามสกุล (Full Name)
                    </label>
                    <input
                      type="text"
                      value={meta.fullName || ""}
                      onChange={(e) => updateField("fullName", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                        อายุ (Age)
                      </label>
                      <input
                        type="text"
                        value={meta.age || ""}
                        onChange={(e) => updateField("age", e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                        เพศ / สถานะ
                      </label>
                      <input
                        type="text"
                        value={meta.sex || ""}
                        onChange={(e) => updateField("sex", e.target.value)}
                        placeholder="M / F"
                        className="w-full rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                        เกรดเฉลี่ย (GPA)
                      </label>
                      <input
                        type="text"
                        value={meta.gpa || ""}
                        onChange={(e) => updateField("gpa", e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                        สัญชาติ (Nationality)
                      </label>
                      <input
                        type="text"
                        value={meta.nationality || ""}
                        onChange={(e) => updateField("nationality", e.target.value)}
                        placeholder="เช่น เมียนมา / ไทย / จีน"
                        className="w-full rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                        ประเทศ (Country)
                      </label>
                      <input
                        type="text"
                        value={meta.country || ""}
                        onChange={(e) => updateField("country", e.target.value)}
                        placeholder="Myanmar / China / Vietnam"
                        className="w-full rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                        เลขหนังสือเดินทาง (Passport No.)
                      </label>
                      <input
                        type="text"
                        value={meta.passportNo || ""}
                        onChange={(e) => updateField("passportNo", e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                        วันหมดอายุ Passport
                      </label>
                      <input
                        type="text"
                        value={meta.passportExpireDate || ""}
                        onChange={(e) => updateField("passportExpireDate", e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                        ประเภทวีซ่า (Visa Type)
                      </label>
                      <input
                        type="text"
                        value={meta.visaType || ""}
                        onChange={(e) => updateField("visaType", e.target.value)}
                        placeholder="Non-Immigrant Visa"
                        className="w-full rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                        วันหมดอายุวีซ่า (Visa Expire)
                      </label>
                      <input
                        type="text"
                        value={meta.visaExpireDate || ""}
                        onChange={(e) => updateField("visaExpireDate", e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                        ชั้นปี (Class)
                      </label>
                      <input
                        type="text"
                        value={meta.classYear || ""}
                        onChange={(e) => updateField("classYear", e.target.value)}
                        placeholder="ปีที่ 1 (First year)"
                        className="w-full rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                        ระดับการศึกษา (Degree)
                      </label>
                      <input
                        type="text"
                        value={meta.degreeLevel || ""}
                        onChange={(e) => updateField("degreeLevel", e.target.value)}
                        placeholder="ป.ตรี (B.A. English Program)"
                        className="w-full rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                      สาขาวิชา (Major / Department)
                    </label>
                    <input
                      type="text"
                      value={meta.major || ""}
                      onChange={(e) => updateField("major", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                      วัตถุประสงค์การขอหนังสือ (Purpose)
                    </label>
                    <select
                      value={meta.requestPurpose || ""}
                      onChange={(e) => updateField("requestPurpose", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs"
                    >
                      {CERTIFICATE_PURPOSES.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.labelTh}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                      ที่อยู่ปัจจุบันในไทย (Address)
                    </label>
                    <textarea
                      rows={2}
                      value={meta.fullAddress || ""}
                      onChange={(e) => updateField("fullAddress", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: CUSTOM BODY TEXT OVERRIDE */}
              {activeTab === "customText" && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    โดยปกติระบบจะผสานชื่อนิสิต รหัสนิสิต หนังสือเดินทาง และสาขาวิชาเข้ากับแม่แบบราชการให้อัตโนมัติ
                    หากต้องการแก้ไขถ้อยคำเฉพาะราย สามารถกดดึงข้อความต้นฉบับมาแก้ไขได้อิสระด้านล่าง:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleLoadGeneratedBodyIntoCustom}
                      className="rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                    >
                      ดึงข้อความต้นฉบับมาแก้ไข
                    </button>
                    {meta.customBodyText && (
                      <button
                        type="button"
                        onClick={() => updateField("customBodyText", "")}
                        className="rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                      >
                        รีเซ็ตกลับเป็นข้อความผสานอัตโนมัติ
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={10}
                    value={meta.customBodyText || ""}
                    onChange={(e) => updateField("customBodyText", e.target.value)}
                    placeholder="ปล่อยว่างเพื่อใช้ข้อความมาตรฐานตามข้อมูลนิสิต หรือพิมพ์ข้อความแต่ละย่อหน้าโดยเว้นบรรทัดว่าง 1 บรรทัด..."
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs leading-relaxed text-slate-900 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Attached Links from Excel if available */}
          {(meta.passportCopyUrl || meta.registrationPdfUrl || meta.paymentPdfUrl) && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                ไฟล์แนบประกอบคำขอของนิสิต (จากฐานข้อมูล / Excel)
              </h3>
              <div className="flex flex-wrap gap-2">
                {meta.passportCopyUrl && (
                  <a
                    href={meta.passportCopyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    สำเนา Passport
                  </a>
                )}
                {meta.registrationPdfUrl && (
                  <a
                    href={meta.registrationPdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                  >
                    ใบลงทะเบียนเรียน (PDF)
                  </a>
                )}
                {meta.paymentPdfUrl && (
                  <a
                    href={meta.paymentPdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                  >
                    ใบเสร็จชำระเงิน (PDF)
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT LIVE A4 PREVIEW */}
        <div className="lg:col-span-7 xl:col-span-8 print:w-full">
          {/* Preview Toolbar (Hidden in Print) */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-xs print:hidden">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <span>ตัวอย่างกระดาษ A4 เสมือนจริง (210 × 297 มม.)</span>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-600">
                Font: {meta.fontSizePt}pt • Line: {meta.lineHeight}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setZoomPercent((z) => Math.max(65, z - 10))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="w-12 text-center font-mono text-xs font-semibold text-slate-700">
                {zoomPercent}%
              </span>
              <button
                type="button"
                onClick={() => setZoomPercent((z) => Math.min(115, z + 10))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomPercent(100)}
                className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
              >
                100%
              </button>
            </div>
          </div>

          {/* A4 Sheet Wrapper */}
          <div className="overflow-x-auto pb-8 print:overflow-visible print:pb-0">
            <div
              className="origin-top transition-transform duration-150 print:!scale-100"
              style={{
                transform: `scale(${zoomPercent / 100})`,
              }}
            >
              <CertificateA4Document metadata={meta} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
