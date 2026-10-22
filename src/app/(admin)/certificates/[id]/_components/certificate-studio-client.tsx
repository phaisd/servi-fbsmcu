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
  FileDown,
  GraduationCap,
} from "lucide-react";
import {
  CertificateA4Document,
  CERTIFICATE_PURPOSES,
  buildCertificateDocumentText,
  isNewStudentAdmission,
  downloadCertificateAsWordDoc,
  type CertificateRequestMetadata,
  type CertificateTemplateType,
  SIGNER_PRESETS,
  SIGNER_NAME_PRESETS_TH,
  SIGNER_NAME_PRESETS_EN,
  SIGNER_TITLE_PRESETS_TH,
  SIGNER_TITLE_PRESETS_EN,
  CERTIFICATE_FONT_PRESETS,
  type CertificateFontPreset,
} from "@/features/certificates";
import {
  updateCertificateRequestAction,
  reviewRequestAction,
  lookupStudentByCodeAction,
  getNextDocNoAction,
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
  suggestedNextDocNo?: string;
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

export function CertificateStudioClient({ request, suggestedNextDocNo = "8002 / 716" }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [suggestedDocNo, setSuggestedDocNo] = useState<string>(suggestedNextDocNo);
  const [meta, setMeta] = useState<CertificateRequestMetadata>(() => {
    const initial = request.metadata;
    const tpl = initial.docTemplate || "THAI_CERT";
    return {
      ...initial,
      docTemplate: tpl,
      docNo: initial.docNo?.trim() || suggestedNextDocNo,
      fontFamily: initial.fontFamily ?? (tpl === "ENG_CERT" ? "Times New Roman" : "Sarabun"),
      fontSizePt: initial.fontSizePt ?? (tpl === "ENG_CERT" ? 12.5 : 16),
      footerFontSizePt: initial.footerFontSizePt ?? 13.5,
      footerLayout: initial.footerLayout ?? "TWO_COLUMNS",
      portalVerifyUrl: initial.portalVerifyUrl ?? "",
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
    startTransition(async () => {
      try {
        const nextNoForTpl = await getNextDocNoAction(tpl);
        setSuggestedDocNo(nextNoForTpl);
        setMeta((prev) => {
          if (tpl === "RESIDENCE_MEMO") {
            return {
              ...prev,
              docTemplate: tpl,
              docNo: prev.docTemplate === "RESIDENCE_MEMO" ? prev.docNo : "",
              fontFamily: prev.fontFamily || "Sarabun",
              fontSizePt: card ? card.defaultFontPt : 16,
              lineHeight: card ? card.defaultLineHeight : 1.85,
              language: "In Thai language",
            };
          }
          const isAutoLike =
            !prev.docNo ||
            prev.docNo.startsWith("8002") ||
            prev.docNo.startsWith("๘๐๐๒");
          return {
            ...prev,
            docTemplate: tpl,
            docNo: isAutoLike ? nextNoForTpl : prev.docNo,
            fontFamily: prev.fontFamily || (tpl === "ENG_CERT" ? "Times New Roman" : "Sarabun"),
            fontSizePt: card ? card.defaultFontPt : 16,
            lineHeight: card ? card.defaultLineHeight : 1.85,
            language: tpl === "ENG_CERT" ? "In English language" : "In Thai language",
          };
        });
        showToast(
          tpl === "RESIDENCE_MEMO"
            ? `สลับเป็นบันทึกข้อความ (ให้กรอกเลขที่หนังสือเอง)`
            : `สลับเป็น ${card?.title || tpl} (เลขหนังสือต่อเนื่อง: ${nextNoForTpl})`
        );
      } catch {
        setMeta((prev) => ({
          ...prev,
          docTemplate: tpl,
          fontFamily: prev.fontFamily || (tpl === "ENG_CERT" ? "Times New Roman" : "Sarabun"),
          fontSizePt: card ? card.defaultFontPt : 16,
          lineHeight: card ? card.defaultLineHeight : 1.85,
          language: tpl === "ENG_CERT" ? "In English language" : "In Thai language",
        }));
      }
    });
  };

  const handleAutoAssignDocNo = () => {
    if (meta.docTemplate === "RESIDENCE_MEMO") {
      showToast("หนังสือบันทึกข้อความ ให้กรอกเลขที่หนังสือเองตามสมุดทะเบียนสารบรรณ");
      return;
    }
    startTransition(async () => {
      try {
        const next = await getNextDocNoAction(meta.docTemplate || "THAI_CERT");
        setSuggestedDocNo(next);
        updateField("docNo", next);
        showToast(`อัพเดตเลขที่หนังสือรับรองต่อเนื่องอัตโนมัติ: ${next}`);
      } catch {
        showToast("ไม่สามารถดึงเลขที่หนังสืออัตโนมัติได้");
      }
    });
  };

  const handleResetOriginalFont = () => {
    const isEng = meta.docTemplate === "ENG_CERT";
    setMeta((prev) => ({
      ...prev,
      fontFamily: isEng ? "Times New Roman" : "Sarabun",
      fontSizePt: isEng ? 12.5 : 16,
      lineHeight: 1.85,
      marginTopMm: 24,
      marginSideMm: 25,
    }));
    showToast(
      isEng
        ? "ตั้งค่าขนาดตัวอักษรเท่าต้นฉบับภาษาอังกฤษ (12.5pt, Times New Roman) เรียบร้อย"
        : "ตั้งค่าขนาดตัวอักษรเท่าต้นฉบับหนังสือราชการไทย (16pt, Sarabun) เรียบร้อย"
    );
  };

  const handleExportWord = () => {
    downloadCertificateAsWordDoc(meta, meta.docNo, meta.fullName || request.userName, request.id);
    showToast("ส่งออกไฟล์ Microsoft Word (.doc) สำเร็จ");
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
    const q = (meta.studentCode || meta.fullName || "").trim();
    if (!q) {
      showToast("กรุณาระบุรหัสนิสิต / รหัสอาจารย์ (T69xxx) หรือชื่อก่อนค้นหา");
      return;
    }
    startTransition(async () => {
      const found = await lookupStudentByCodeAction(q);
      if (!found) {
        showToast("ไม่พบข้อมูลในฐานข้อมูลนิสิต/บุคลากร");
        return;
      }
      const detectedType = found.applicantType;

      setMeta((prev) => ({
        ...prev,
        applicantType: detectedType,
        studentCode: found.studentCode || prev.studentCode,
        staffPosition: found.staffPosition || prev.staffPosition,
        staffDepartment: found.staffDepartment || prev.staffDepartment,
        taughtCourses: found.taughtCourses || prev.taughtCourses,
        requestPurpose:
          detectedType === "NEW_STUDENT"
            ? "Letter of Acceptance (หนังสือตอบรับเข้าศึกษา/ขอวีซ่า)"
            : detectedType === "FACULTY_LECTURER"
            ? "Teaching & Lecturer Certificate (รับรองการเป็นอาจารย์ประจำ/อาจารย์พิเศษ)"
            : detectedType === "STAFF_MEMBER"
            ? "Faculty & Staff Employment Certificate (รับรองการปฏิบัติงานอาจารย์/เจ้าหน้าที่)"
            : prev.requestPurpose,
        customBodyText: "",
        fullName: found.fullName || prev.fullName,
        degreeLevel: found.degreeLevel || prev.degreeLevel,
        major: found.major || prev.major,
        classYear: found.classYear || prev.classYear,
        sex: found.sex || prev.sex,
        email: found.email || prev.email,
        phone: found.phone || prev.phone,
        nationality: found.nationality || prev.nationality,
        country: found.country || prev.country,
        fullAddress: found.address || prev.fullAddress,
      }));
      showToast(
        detectedType === "NEW_STUDENT"
          ? `ตรวจพบนิสิตใหม่ (${found.fullName}) • ปรับเป็นหนังสือรับรองการเป็นผู้ผ่านการคัดเลือกเข้าศึกษา (Certificate of Admission) อัตโนมัติ`
          : detectedType === "FACULTY_LECTURER"
          ? `ดึงข้อมูลอาจารย์ ${found.fullName} และรายวิชาที่สอนเรียบร้อยแล้ว`
          : detectedType === "STAFF_MEMBER"
          ? `ดึงข้อมูลบุคลากร ${found.fullName} เรียบร้อยแล้ว`
          : `ดึงข้อมูลนิสิต ${found.fullName} เรียบร้อยแล้ว`
      );
    });
  };

  const handleToggleApplicantType = (
    nextType: "CURRENT_STUDENT" | "NEW_STUDENT" | "FACULTY_LECTURER" | "STAFF_MEMBER"
  ) => {
    setMeta((prev) => ({
      ...prev,
      applicantType: nextType,
      staffPosition:
        nextType === "FACULTY_LECTURER"
          ? prev.staffPosition || "อาจารย์ประจำ / อาจารย์พิเศษผู้สอน"
          : nextType === "STAFF_MEMBER"
          ? prev.staffPosition || "นักวิชาการศึกษา / เจ้าหน้าที่บริหารงานทั่วไป"
          : prev.staffPosition,
      staffDepartment:
        nextType === "FACULTY_LECTURER"
          ? prev.staffDepartment || "ภาควิชาพระพุทธศาสนา คณะพุทธศาสตร์"
          : nextType === "STAFF_MEMBER"
          ? prev.staffDepartment || "สำนักงานคณบดี คณะพุทธศาสตร์"
          : prev.staffDepartment,
      requestPurpose:
        nextType === "NEW_STUDENT"
          ? "Letter of Acceptance (หนังสือตอบรับเข้าศึกษา/ขอวีซ่า)"
          : nextType === "FACULTY_LECTURER"
          ? "Teaching & Lecturer Certificate (รับรองการเป็นอาจารย์ประจำ/อาจารย์พิเศษ)"
          : nextType === "STAFF_MEMBER"
          ? "Faculty & Staff Employment Certificate (รับรองการปฏิบัติงานอาจารย์/เจ้าหน้าที่)"
          : prev.requestPurpose === "Letter of Acceptance (หนังสือตอบรับเข้าศึกษา/ขอวีซ่า)"
          ? "Bonafide Certificate (ความเป็นนิสิต)"
          : prev.requestPurpose,
      customBodyText: "",
    }));
    showToast(
      nextType === "NEW_STUDENT"
        ? 'ปรับเป็นโหมดนิสิตใหม่: "หนังสือรับรองการเป็นผู้ผ่านการคัดเลือกเข้าศึกษา (Certificate of Admission)" สำหรับขอ Non-ED Visa'
        : nextType === "FACULTY_LECTURER"
        ? "ปรับเป็นโหมดอาจารย์ประจำ / อาจารย์พิเศษผู้สอน"
        : nextType === "STAFF_MEMBER"
        ? "ปรับเป็นโหมดเจ้าหน้าที่สายสนับสนุน คณะพุทธศาสตร์"
        : "ปรับเป็นโหมดนิสิตปัจจุบัน: หนังสือรับรองสถานภาพความเป็นนิสิต"
    );
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
  const isNewStudent = isNewStudentAdmission(meta);

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

            <Link
              href={`/portal/certificates/verify/${request.id}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 shadow-xs transition hover:bg-emerald-100"
              title="เปิดหน้าตรวจสอบสถานะดิจิทัลสำหรับ ตม. หรือสั่งพิมพ์ใบสรุปการตรวจสอบแนบเอกสาร"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              เปิด/พิมพ์ใบตรวจสอบ ตม. ↗
            </Link>

            <button
              type="button"
              onClick={handleExportWord}
              className="inline-flex items-center gap-1.5 rounded-xl border border-sky-300 bg-sky-50 px-3.5 py-2 text-xs font-semibold text-sky-800 shadow-xs transition hover:bg-sky-100"
              title="ดาวน์โหลดเป็นไฟล์ Microsoft Word (.doc) เพื่อนำไปแก้ไขต่อใน Word ได้ทันที"
            >
              <FileDown className="h-4 w-4 text-sky-600" />
              ส่งออกเป็น Word (.doc)
            </button>

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

            {/* NEW_STUDENT / LECTURER / STAFF Auto-Detection & Mode Switcher */}
            {(meta.docTemplate === "THAI_CERT" ||
              meta.docTemplate === "ENG_CERT" ||
              meta.docTemplate === "BANK_LETTER") && (
              <div
                className={`mt-3.5 rounded-xl border p-3 transition ${
                  isNewStudent
                    ? "border-emerald-300 bg-emerald-50/80"
                    : meta.applicantType === "FACULTY_LECTURER" ||
                      meta.applicantType === "STAFF_MEMBER"
                    ? "border-amber-300 bg-amber-50/70"
                    : "border-slate-200 bg-slate-50/70"
                }`}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <GraduationCap
                      className={`h-4 w-4 ${
                        isNewStudent ? "text-emerald-700" : "text-slate-600"
                      }`}
                    />
                    <span className="text-xs font-bold text-slate-900">
                      ประเภทผู้ขอใบรับรอง (Applicant Status)
                    </span>
                  </div>
                  {isNewStudent && (
                    <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                      NEW_STUDENT • Non-ED Visa
                    </span>
                  )}
                  {(meta.applicantType === "FACULTY_LECTURER" ||
                    meta.applicantType === "STAFF_MEMBER") && (
                    <span className="rounded-full bg-amber-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                      {meta.applicantType === "FACULTY_LECTURER"
                        ? "อาจารย์ประจำ/พิเศษ"
                        : "เจ้าหน้าที่คณะ"}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggleApplicantType("CURRENT_STUDENT")}
                    className={`rounded-lg border px-2.5 py-2 text-left text-[11px] font-semibold transition ${
                      !isNewStudent &&
                      meta.applicantType !== "FACULTY_LECTURER" &&
                      meta.applicantType !== "STAFF_MEMBER"
                        ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="font-bold">1. นิสิตปัจจุบัน</div>
                    <div
                      className={`text-[10px] ${
                        !isNewStudent &&
                        meta.applicantType !== "FACULTY_LECTURER" &&
                        meta.applicantType !== "STAFF_MEMBER"
                          ? "text-indigo-100"
                          : "text-slate-400"
                      }`}
                    >
                      รับรองสถานภาพนิสิต (Bonafide)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleApplicantType("NEW_STUDENT")}
                    className={`rounded-lg border px-2.5 py-2 text-left text-[11px] font-semibold transition ${
                      isNewStudent
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
                        : "border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50"
                    }`}
                  >
                    <div className="font-bold">2. 🌍 นิสิตใหม่ (NEW_STUDENT)</div>
                    <div
                      className={`text-[10px] ${
                        isNewStudent ? "text-emerald-100" : "text-emerald-600"
                      }`}
                    >
                      ผู้ผ่านการคัดเลือก (ขอ Non-ED Visa)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleApplicantType("FACULTY_LECTURER")}
                    className={`rounded-lg border px-2.5 py-2 text-left text-[11px] font-semibold transition ${
                      meta.applicantType === "FACULTY_LECTURER"
                        ? "border-amber-600 bg-amber-600 text-white shadow-xs"
                        : "border-amber-200 bg-white text-amber-900 hover:bg-amber-50"
                    }`}
                  >
                    <div className="font-bold">3. 👨‍🏫 อาจารย์ประจำ/พิเศษ</div>
                    <div
                      className={`text-[10px] ${
                        meta.applicantType === "FACULTY_LECTURER"
                          ? "text-amber-100"
                          : "text-amber-700"
                      }`}
                    >
                      รับรองการสอน / สังกัดคณะ
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleApplicantType("STAFF_MEMBER")}
                    className={`rounded-lg border px-2.5 py-2 text-left text-[11px] font-semibold transition ${
                      meta.applicantType === "STAFF_MEMBER"
                        ? "border-amber-600 bg-amber-600 text-white shadow-xs"
                        : "border-amber-200 bg-white text-amber-900 hover:bg-amber-50"
                    }`}
                  >
                    <div className="font-bold">4. 🏛️ เจ้าหน้าที่คณะ</div>
                    <div
                      className={`text-[10px] ${
                        meta.applicantType === "STAFF_MEMBER"
                          ? "text-amber-100"
                          : "text-amber-700"
                      }`}
                    >
                      รับรองการปฏิบัติงานบุคลากร
                    </div>
                  </button>
                </div>

                {isNewStudent && (
                  <p className="mt-2 rounded-lg bg-white/90 px-2.5 py-1.5 text-[11px] leading-relaxed font-medium text-emerald-900 border border-emerald-200">
                    ✓ ปรับหัวข้อและเนื้อหาอัตโนมัติเป็น{" "}
                    <span className="font-bold underline">
                      &ldquo;หนังสือรับรองการเป็นผู้ผ่านการคัดเลือกเข้าศึกษา (Certificate of Admission)&rdquo;
                    </span>{" "}
                    สำหรับใช้ยื่นขอวีซ่าประเภทการศึกษา (Non-Immigrant ED Visa)
                  </p>
                )}
                {(meta.applicantType === "FACULTY_LECTURER" ||
                  meta.applicantType === "STAFF_MEMBER") && (
                  <p className="mt-2 rounded-lg bg-white/90 px-2.5 py-1.5 text-[11px] leading-relaxed font-medium text-amber-950 border border-amber-200">
                    ✓ โหมดบุคลากรคณะ: สามารถใส่รหัสอาจารย์ (เช่น{" "}
                    <span className="font-mono font-bold">T69001</span>–
                    <span className="font-mono font-bold">T69041</span>) ในแท็บ{" "}
                    <span className="font-bold">&ldquo;3. ข้อมูลนิสิต&rdquo;</span>{" "}
                    เพื่อดึงชื่อและรายวิชาที่สอนอัตโนมัติได้ทันที
                  </p>
                )}
              </div>
            )}
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
                  {/* Google Fonts & Typography Selector */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                    <div className="mb-2.5 flex items-center justify-between">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <Type className="h-3.5 w-3.5 text-indigo-600" />
                        แบบฟอนต์หนังสือ (Google Fonts / Thai Official)
                      </label>
                      <span className="rounded-md bg-indigo-100/70 px-2 py-0.5 text-[11px] font-bold text-indigo-800">
                        {CERTIFICATE_FONT_PRESETS.find(
                          (f: CertificateFontPreset) => f.id === (meta.fontFamily || (isEng ? "Times New Roman" : "Sarabun"))
                        )?.name || meta.fontFamily || "Sarabun"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {CERTIFICATE_FONT_PRESETS.map((font: CertificateFontPreset) => {
                        const activeFontId = meta.fontFamily || (isEng ? "Times New Roman" : "Sarabun");
                        const isCurrent = activeFontId === font.id;
                        return (
                          <button
                            key={font.id}
                            type="button"
                            onClick={() => updateField("fontFamily", font.id)}
                            className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition ${
                              isCurrent
                                ? "border-indigo-600 bg-white ring-2 ring-indigo-600/20 shadow-xs"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <span className="text-xs font-bold text-slate-900">{font.name}</span>
                            <span className="text-[10px] text-slate-500 line-clamp-1">{font.description}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

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

                    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/40 px-3.5 py-2.5 hover:bg-emerald-50">
                      <div>
                        <span className="block text-xs font-bold text-emerald-950">
                          แสดง QR Code ตรวจสอบสถานะสำหรับ ตม. ท้ายกระดาษ
                        </span>
                        <span className="text-[10px] text-emerald-700">
                          ติ๊กออกหากไม่ต้องการแสดงกล่องสแกน QR Code สำหรับ ตม. บนใบรับรองฉบับนี้
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={meta.showVerificationQr ?? true}
                        onChange={(e) => updateField("showVerificationQr", e.target.checked)}
                        className="h-4 w-4 rounded border-emerald-300 text-emerald-600"
                      />
                    </label>
                  </div>

                  {/* ปรับแต่งส่วนท้ายเอกสารและ URL ตรวจสอบ (Footer Settings) */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-3">
                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700">
                          ขนาดตัวอักษรส่วนท้าย (Footer Font Size)
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              updateField(
                                "footerFontSizePt",
                                Math.max(7, Number(((meta.footerFontSizePt ?? 10.5) - 0.5).toFixed(1)))
                              )
                            }
                            className="h-6 w-6 rounded border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100"
                          >
                            -
                          </button>
                          <span className="w-14 text-center font-mono text-xs font-bold text-indigo-700">
                            {meta.footerFontSizePt ?? 10.5} pt
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateField(
                                "footerFontSizePt",
                                Math.min(13, Number(((meta.footerFontSizePt ?? 10.5) + 0.5).toFixed(1)))
                              )
                            }
                            className="h-6 w-6 rounded border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={7}
                        max={13}
                        step={0.5}
                        value={meta.footerFontSizePt ?? 10.5}
                        onChange={(e) => updateField("footerFontSizePt", parseFloat(e.target.value))}
                        className="w-full accent-indigo-600"
                      />
                      <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                        <span>7pt (กะทัดรัดพิเศษ)</span>
                        <span className="font-semibold text-indigo-600">10-11pt (แนะนำ ไม่ตัดคำ)</span>
                        <span>13pt (มาตรฐานเอกสาร)</span>
                      </div>
                    </div>

                    {/* แก้ไขข้อความส่วนท้ายฝั่งซ้าย */}
                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700">
                          ข้อความส่วนท้ายฝั่งซ้าย (สำนักงานคณบดี/ผู้ประสานงาน)
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const defaultText =
                              meta.docTemplate === "BANK_LETTER"
                                ? `ติดต่อผู้ประสานงาน:\n${meta.coordinatorNameTh || "นายดวงดี โอฐสู"}\nโทร. ${meta.coordinatorPhoneTh || "089-516-7544 / 095-470-7849"}\nhttps://fb.mcu.ac.th/`
                                : meta.docTemplate === "ENG_CERT"
                                ? `Office of Dean, Faculty of Buddhism\nMahachulalongkornrajavidyalaya University\nTel. +66 3524 8000 ext. 8323, 8096\nhttps://fb.mcu.ac.th/`
                                : `สำนักงานคณบดีคณะพุทธศาสตร์\nมหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย\nโทรศัพท์ ๐-๓๕๒๔-๘๐๙๖ ภายใน ๘๐๙๖\nhttps://fb.mcu.ac.th/`;
                            updateField("footerLeftText", defaultText);
                            showToast("รีเซ็ตข้อความส่วนท้ายเป็นค่ามาตรฐานเรียบร้อย");
                          }}
                          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition"
                        >
                          🔄 ค่ามาตรฐาน (4 บรรทัด)
                        </button>
                      </div>
                      <textarea
                        rows={4}
                        value={
                          meta.footerLeftText !== undefined && meta.footerLeftText !== ""
                            ? meta.footerLeftText
                            : meta.docTemplate === "BANK_LETTER"
                            ? `ติดต่อผู้ประสานงาน:\n${meta.coordinatorNameTh || "นายดวงดี โอฐสู"}\nโทร. ${meta.coordinatorPhoneTh || "089-516-7544 / 095-470-7849"}\nhttps://fb.mcu.ac.th/`
                            : meta.docTemplate === "ENG_CERT"
                            ? `Office of Dean, Faculty of Buddhism\nMahachulalongkornrajavidyalaya University\nTel. +66 3524 8000 ext. 8323, 8096\nhttps://fb.mcu.ac.th/`
                            : `สำนักงานคณบดีคณะพุทธศาสตร์\nมหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย\nโทรศัพท์ ๐-๓๕๒๔-๘๐๙๖ ภายใน ๘๐๙๖\nhttps://fb.mcu.ac.th/`
                        }
                        onChange={(e) => updateField("footerLeftText", e.target.value)}
                        placeholder="พิมพ์ข้อความส่วนท้ายฝั่งซ้าย แต่ละบรรทัดจะขึ้นแถวใหม่บนเอกสาร"
                        className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 font-mono leading-relaxed focus:border-indigo-500 focus:outline-none"
                      />
                      <p className="mt-1 text-[10px] text-slate-500">
                        ✍️ สามารถพิมพ์แก้ไขชื่อหน่วยงาน เบอร์โทรศัพท์ หรือเว็บไซต์ได้โดยตรง แต่ละบรรทัดจะแสดงแยกกันบนเอกสาร
                      </p>
                    </div>

                    {/* การจัดวางท้ายกระดาษ (2 คอลัมน์ vs แถวเดี่ยว) */}
                    <div>
                      <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                        รูปแบบการจัดวางส่วนท้าย (Footer Layout)
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => updateField("footerLayout", "TWO_COLUMNS")}
                          className={`rounded-lg border p-2 text-left transition ${
                            (meta.footerLayout ?? "TWO_COLUMNS") === "TWO_COLUMNS"
                              ? "border-indigo-600 bg-indigo-50/70 font-bold text-indigo-900"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <div>✨ 2 คอลัมน์ (แนะนำ)</div>
                          <div className="text-[10px] font-normal text-slate-500 mt-0.5">
                            ซ้าย สนง.คณะฯ/ผู้ประสานงาน / ขวา QR พอดี 1 หน้า A4
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => updateField("footerLayout", "STACKED")}
                          className={`rounded-lg border p-2 text-left transition ${
                            meta.footerLayout === "STACKED"
                              ? "border-indigo-600 bg-indigo-50/70 font-bold text-indigo-900"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <div>แถวเดี่ยวเต็มความกว้าง</div>
                          <div className="text-[10px] font-normal text-slate-500 mt-0.5">
                            ซ้อนแนวตั้งตามลำดับเดิม
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* URL ตรวจสอบเอกสาร */}
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        URL เว็บไซต์ระบบตรวจสอบ (Verification Portal URL)
                      </label>
                      <input
                        type="text"
                        value={meta.portalVerifyUrl || ""}
                        onChange={(e) => updateField("portalVerifyUrl", e.target.value)}
                        placeholder="ปล่อยว่างเพื่อใช้อัตโนมัติ หรือระบุ เช่น https://fb.mcu.ac.th/portal/certificates/verify"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                      />
                      <p className="mt-1 text-[10px] text-slate-500">
                        🌐 ใช้แสดงต่อท้าย https://fb.mcu.ac.th/ และเข้ารหัสใน QR Code เมื่อขึ้นโฮสติ้งจริง
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DOCUMENT NUMBER & SIGNER */}
              {activeTab === "doc" && (
                <div className="space-y-3.5">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                    <div className="mb-2 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-slate-700">
                          {meta.docTemplate === "RESIDENCE_MEMO"
                            ? "เลขที่หนังสือบันทึกข้อความ (กรอกเลขเอง)"
                            : "เลขที่หนังสือรับรอง (รันเลขอัตโนมัติต่อเนื่องทุกฉบับ)"}
                        </label>
                        {meta.docTemplate === "RESIDENCE_MEMO" ? (
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                            ✍️ กรอกเลขเอง (ทะเบียนสารบรรณภายใน)
                          </span>
                        ) : (
                          <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                            🔢 รันเลขอัตโนมัติต่อเนื่องทุกฉบับ (Continuous Auto No.)
                          </span>
                        )}
                      </div>
                      {meta.docTemplate !== "RESIDENCE_MEMO" && (
                        <button
                          type="button"
                          onClick={handleAutoAssignDocNo}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-2.5 py-1 text-[11px] font-bold text-indigo-600 shadow-2xs transition hover:bg-indigo-50 hover:text-indigo-800"
                          title="ดึงเลขที่หนังสือรับรองฉบับถัดไปอัตโนมัติ (ต่อเนื่องทุกฉบับ)"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                          <span>เลขถัดไปอัตโนมัติ: {suggestedDocNo}</span>
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={meta.docNo || ""}
                      onChange={(e) => updateField("docNo", e.target.value)}
                      placeholder={
                        meta.docTemplate === "RESIDENCE_MEMO"
                          ? "กรอกเลขที่บันทึกข้อความ เช่น ๘๐๐๒/ ว ๐๗๓ หรือตามที่ออกเลข"
                          : `เช่น ${suggestedDocNo}`
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none"
                    />
                    <p className="mt-1.5 text-[11px] text-slate-500">
                      💡 {meta.docTemplate === "RESIDENCE_MEMO"
                        ? "หนังสือบันทึกข้อความ กำหนดให้กรอกเลขเองตามสมุดทะเบียนสารบรรณของคณะ ไม่ใช้เลขรวมกับหนังสือรับรอง"
                        : "หนังสือรับรองทุกฉบับ (ภาษาไทย, ภาษาอังกฤษ, ธนาคาร) ใช้เลขต่อเนื่องกันอัตโนมัติ และสามารถแก้ไขเลขเองได้"}
                    </p>
                  </div>


                  {/* กล่องเลือกชุดข้อมูลผู้ลงนามมาตรฐาน (Signer Presets) */}
                  <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/60 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                        <UserCheck className="h-4 w-4 text-indigo-600" />
                        <span>เลือกผู้ลงนามมาตรฐาน (Signer Presets)</span>
                      </label>
                      <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-100/70 px-2 py-0.5 rounded-full">
                        ✨ ป้องกันพิมพ์ผิด
                      </span>
                    </div>
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) return;
                        const preset = SIGNER_PRESETS.find((p) => p.id === val);
                        if (preset) {
                          setMeta((prev) => ({
                            ...prev,
                            signerNameTh: preset.nameTh,
                            signerTitleTh: preset.titleTh,
                            signerNameEn: preset.nameEn,
                            signerTitleEn: preset.titleEn,
                          }));
                          showToast(`เลือกผู้ลงนาม: ${preset.label}`);
                        }
                      }}
                      defaultValue=""
                      className="w-full rounded-lg border border-indigo-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="">-- เลือกจากรายชื่อผู้บริหาร / ผู้มีอำนาจลงนาม --</option>
                      {SIGNER_PRESETS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-500">
                      💡 เมื่อเลือก ระบบจะใส่ชื่อและตำแหน่งมาตรฐานให้ครบทั้งภาษาไทยและอังกฤษโดยอัตโนมัติ (และยังสามารถพิมพ์แก้ไขเพิ่มเองได้)
                    </p>
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

                      {/* ชื่อผู้ลงนาม อังกฤษ */}
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-700">
                            ชื่อผู้ลงนาม (ภาษาอังกฤษ)
                          </label>
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                updateField("signerNameEn", e.target.value);
                              }
                            }}
                            defaultValue=""
                            className="text-[11px] rounded border border-slate-200 bg-white px-1.5 py-0.5 text-slate-600 focus:outline-none"
                          >
                            <option value="">เลือกชื่อด่วน...</option>
                            {SIGNER_NAME_PRESETS_EN.map((name) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <input
                          type="text"
                          list="signer-names-en"
                          value={meta.signerNameEn || ""}
                          onChange={(e) => updateField("signerNameEn", e.target.value)}
                          placeholder="เช่น (Asst. Prof. Phrakhru Sirirattanabundit, Ph.D.)"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none"
                        />
                        <datalist id="signer-names-en">
                          {SIGNER_NAME_PRESETS_EN.map((name) => (
                            <option key={name} value={name} />
                          ))}
                        </datalist>
                      </div>

                      {/* ตำแหน่งผู้ลงนาม อังกฤษ */}
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-700">
                            ตำแหน่งผู้ลงนาม (ภาษาอังกฤษ)
                          </label>
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                updateField("signerTitleEn", e.target.value);
                              }
                            }}
                            defaultValue=""
                            className="text-[11px] rounded border border-slate-200 bg-white px-1.5 py-0.5 text-slate-600 focus:outline-none"
                          >
                            <option value="">เลือกตำแหน่งด่วน...</option>
                            {SIGNER_TITLE_PRESETS_EN.map((title) => (
                              <option key={title} value={title}>
                                {title}
                              </option>
                            ))}
                          </select>
                        </div>
                        <input
                          type="text"
                          list="signer-titles-en"
                          value={meta.signerTitleEn || ""}
                          onChange={(e) => updateField("signerTitleEn", e.target.value)}
                          placeholder="เช่น Vice Dean, Faculty of Buddhism"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                        />
                        <datalist id="signer-titles-en">
                          {SIGNER_TITLE_PRESETS_EN.map((title) => (
                            <option key={title} value={title} />
                          ))}
                        </datalist>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {SIGNER_TITLE_PRESETS_EN.slice(0, 4).map((title) => (
                            <button
                              key={title}
                              type="button"
                              onClick={() => updateField("signerTitleEn", title)}
                              className="rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 px-2 py-0.5 text-[10px] text-slate-600 transition"
                            >
                              {title.replace(", Faculty of Buddhism", "")}
                            </button>
                          ))}
                        </div>
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

                      {/* ชื่อผู้ลงนาม ไทย */}
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-700">
                            ชื่อผู้ลงนาม (ภาษาไทย)
                          </label>
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                updateField("signerNameTh", e.target.value);
                              }
                            }}
                            defaultValue=""
                            className="text-[11px] rounded border border-slate-200 bg-white px-1.5 py-0.5 text-slate-600 focus:outline-none"
                          >
                            <option value="">เลือกชื่อด่วน...</option>
                            {SIGNER_NAME_PRESETS_TH.map((name) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <input
                          type="text"
                          list="signer-names-th"
                          value={meta.signerNameTh || ""}
                          onChange={(e) => updateField("signerNameTh", e.target.value)}
                          placeholder="เช่น (พระครูสิริรัตนบัณฑิต, ผศ.ดร.)"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none"
                        />
                        <datalist id="signer-names-th">
                          {SIGNER_NAME_PRESETS_TH.map((name) => (
                            <option key={name} value={name} />
                          ))}
                        </datalist>
                      </div>

                      {/* ตำแหน่งผู้ลงนาม ไทย */}
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-700">
                            ตำแหน่งผู้ลงนาม (ภาษาไทย)
                          </label>
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                updateField("signerTitleTh", e.target.value);
                              }
                            }}
                            defaultValue=""
                            className="text-[11px] rounded border border-slate-200 bg-white px-1.5 py-0.5 text-slate-600 focus:outline-none"
                          >
                            <option value="">เลือกตำแหน่งด่วน...</option>
                            {SIGNER_TITLE_PRESETS_TH.map((title) => (
                              <option key={title} value={title}>
                                {title}
                              </option>
                            ))}
                          </select>
                        </div>
                        <input
                          type="text"
                          list="signer-titles-th"
                          value={meta.signerTitleTh || ""}
                          onChange={(e) => updateField("signerTitleTh", e.target.value)}
                          placeholder="เช่น รักษาการแทนรองคณบดีฝ่ายวิชาการ คณะพุทธศาสตร์"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                        />
                        <datalist id="signer-titles-th">
                          {SIGNER_TITLE_PRESETS_TH.map((title) => (
                            <option key={title} value={title} />
                          ))}
                        </datalist>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {SIGNER_TITLE_PRESETS_TH.slice(0, 4).map((title) => (
                            <button
                              key={title}
                              type="button"
                              onClick={() => updateField("signerTitleTh", title)}
                              className="rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 px-2 py-0.5 text-[10px] text-slate-600 transition"
                            >
                              {title.replace(" คณะพุทธศาสตร์", "")}
                            </button>
                          ))}
                        </div>
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
                  {/* Quick Applicant Type Switcher inside Student Tab */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                    <label className="mb-1.5 block text-[11px] font-bold text-slate-700">
                      สถานะผู้ขอหนังสือรับรอง (Applicant Type)
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleApplicantType("CURRENT_STUDENT")}
                        className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition ${
                          !isNewStudent &&
                          meta.applicantType !== "FACULTY_LECTURER" &&
                          meta.applicantType !== "STAFF_MEMBER"
                            ? "border-indigo-600 bg-indigo-600 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        1. นิสิตปัจจุบัน
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleApplicantType("NEW_STUDENT")}
                        className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition ${
                          isNewStudent
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : "border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50"
                        }`}
                      >
                        2. 🌍 นิสิตใหม่
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleApplicantType("FACULTY_LECTURER")}
                        className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition ${
                          meta.applicantType === "FACULTY_LECTURER"
                            ? "border-amber-600 bg-amber-600 text-white"
                            : "border-amber-200 bg-white text-amber-900 hover:bg-amber-50"
                        }`}
                      >
                        3. 👨‍🏫 อาจารย์ประจำ/พิเศษ
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleApplicantType("STAFF_MEMBER")}
                        className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition ${
                          meta.applicantType === "STAFF_MEMBER"
                            ? "border-amber-600 bg-amber-600 text-white"
                            : "border-amber-200 bg-white text-amber-900 hover:bg-amber-50"
                        }`}
                      >
                        4. 🏛️ เจ้าหน้าที่คณะ
                      </button>
                    </div>
                  </div>

                  {(meta.applicantType === "FACULTY_LECTURER" ||
                    meta.applicantType === "STAFF_MEMBER") && (
                    <div className="space-y-2.5 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-amber-950">
                          ตำแหน่งอาจารย์ / เจ้าหน้าที่ (Position)
                        </label>
                        <input
                          type="text"
                          value={meta.staffPosition || ""}
                          onChange={(e) => updateField("staffPosition", e.target.value)}
                          placeholder="เช่น อาจารย์ประจำ, อาจารย์พิเศษผู้สอน, นักวิชาการศึกษา"
                          className="w-full rounded-xl border border-amber-200 bg-white px-3 py-1.5 text-xs"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-amber-950">
                          สังกัดภาควิชา / ส่วนงาน (Department)
                        </label>
                        <input
                          type="text"
                          value={meta.staffDepartment || ""}
                          onChange={(e) => updateField("staffDepartment", e.target.value)}
                          placeholder="เช่น ภาควิชาพระพุทธศาสนา คณะพุทธศาสตร์"
                          className="w-full rounded-xl border border-amber-200 bg-white px-3 py-1.5 text-xs"
                        />
                      </div>
                      {meta.applicantType === "FACULTY_LECTURER" && (
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-amber-950">
                            รายวิชาที่รับผิดชอบสอน (Taught Courses)
                          </label>
                          <input
                            type="text"
                            value={meta.taughtCourses || ""}
                            onChange={(e) => updateField("taughtCourses", e.target.value)}
                            placeholder="ดึงอัตโนมัติเมื่อค้นหารหัส T69001-T69041 หรือระบุเอง"
                            className="w-full rounded-xl border border-amber-200 bg-white px-3 py-1.5 text-xs"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                        รหัสนิสิต / รหัสชั่วคราว / รหัสอาจารย์ (Student ID / TEMP / T69xxx)
                      </label>
                      <input
                        type="text"
                        value={meta.studentCode || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateField("studentCode", val);
                          if (val.trim().toUpperCase().startsWith("TEMP-") && meta.applicantType !== "NEW_STUDENT") {
                            updateField("applicantType", "NEW_STUDENT");
                          } else if (/^T\d{4,6}$/i.test(val.trim()) && meta.applicantType !== "FACULTY_LECTURER") {
                            updateField("applicantType", "FACULTY_LECTURER");
                          }
                        }}
                        placeholder="เช่น 6801203001, TEMP-68001 หรือ T69001"
                        className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-mono"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleAutoLookupStudent}
                        className="rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                      >
                        ดึงข้อมูลอัตโนมัติ
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
              <CertificateA4Document metadata={meta} requestId={request.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
