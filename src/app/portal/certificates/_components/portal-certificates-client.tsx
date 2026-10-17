"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileBadge,
  Plus,
  Search,
  Printer,
  CheckCircle2,
  Clock,
  XCircle,
  Globe,
  FileText,
  Type,
  RotateCcw,
  X,
} from "lucide-react";
import {
  CertificateA4Document,
  type CertificateRequestMetadata,
  type CertificateTemplateType,
} from "@/features/certificates";

interface PortalRequestItem {
  id: string;
  certificateTypeId: string;
  typeName: string;
  status: string;
  createdAt: string;
  metadata: CertificateRequestMetadata;
}

interface Props {
  initialItems: PortalRequestItem[];
}

const TEMPLATE_INFO: Record<
  CertificateTemplateType,
  { title: string; subtitle: string; badge: string; defaultPt: number }
> = {
  THAI_CERT: {
    title: "หนังสือรับรองการเป็นนิสิต (ภาษาไทย)",
    subtitle: "สำหรับขอต่อวีซ่า (ตม.) หรือรับรองสถานภาพนิสิตภายในประเทศ",
    badge: "ภาษาไทย • ต้นฉบับ 16pt",
    defaultPt: 16,
  },
  ENG_CERT: {
    title: "English Student Status Certificate (ใช้นอกประเทศ)",
    subtitle: "TO WHOM IT MAY CONCERN • สำหรับศึกษาต่อ ขอวีซ่าต่างประเทศ หรือใช้นอกประเทศ",
    badge: "English • Original 12.5pt",
    defaultPt: 12.5,
  },
  BANK_LETTER: {
    title: "หนังสือขอความอนุเคราะห์ธนาคาร (เปิดบัญชี / Mobile Banking)",
    subtitle: "หนังสือถึงผู้จัดการธนาคารเพื่อขอเปิดบัญชีเงินฝากหรือสมัครแอปพลิเคชันธนาคาร",
    badge: "หนังสือธนาคาร • 16pt",
    defaultPt: 16,
  },
  RESIDENCE_MEMO: {
    title: "บันทึกข้อความ ขอออกหนังสือรับรองที่อยู่นิสิต",
    subtitle: "บันทึกข้อความส่วนงานคณะพุทธศาสตร์ เรียน ผู้อำนวยการกองกิจการนิสิต",
    badge: "บันทึกข้อความ • 16pt",
    defaultPt: 16,
  },
};

export function PortalCertificatesClient({ initialItems }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [templateFilter, setTemplateFilter] = useState<string>("ALL");
  const [previewItem, setPreviewItem] = useState<PortalRequestItem | null>(null);
  const [previewFontSizePt, setPreviewFontSizePt] = useState<number>(16);
  const [previewLineHeight, setPreviewLineHeight] = useState<number>(1.85);

  const filteredItems = useMemo(() => {
    return initialItems.filter((item) => {
      const m = item.metadata;
      const tpl = m.docTemplate || "THAI_CERT";
      if (templateFilter !== "ALL" && tpl !== templateFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const hay = [
          m.studentCode,
          m.fullName,
          m.passportNo,
          m.nationality,
          m.country,
          m.major,
          m.requestPurpose,
          item.typeName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [initialItems, searchQuery, templateFilter]);

  const openPreview = (item: PortalRequestItem) => {
    const tpl = item.metadata.docTemplate || "THAI_CERT";
    const defaultPt = item.metadata.fontSizePt || (tpl === "ENG_CERT" ? 12.5 : 16);
    const defaultLh = item.metadata.lineHeight || 1.85;
    setPreviewItem(item);
    setPreviewFontSizePt(defaultPt);
    setPreviewLineHeight(defaultLh);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 print:max-w-none print:p-0">
      {/* Main Portal Content (Hidden when printing preview modal) */}
      <div className={previewItem ? "print:hidden" : ""}>
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-lg sm:p-8">
          <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-300 ring-1 ring-amber-400/30">
                <FileBadge className="h-3.5 w-3.5" />
                ระบบบริการหนังสือรับรองนิสิต คณะพุทธศาสตร์ มจร (Student Certificate Service)
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                ยื่นคำร้องและตรวจสอบหนังสือรับรองนิสิต (ไทย / อังกฤษ)
              </h1>
              <p className="max-w-2xl text-xs leading-relaxed text-slate-300 sm:text-sm">
                บริการออกหนังสือรับรองสถานภาพนิสิต (ภาษาไทย), หนังสือรับรองภาษาอังกฤษสำหรับใช้นอกประเทศ
                (TO WHOM IT MAY CONCERN), หนังสือขอความอนุเคราะห์ธนาคาร และบันทึกข้อความรับรองที่อยู่
                พร้อมระบบปรับขนาดตัวอักษรเท่าต้นฉบับเพื่อสั่งพิมพ์ A4
              </p>
            </div>

            <div className="shrink-0">
              <Link
                href="/portal/certificates/request"
                className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-md transition hover:bg-amber-300"
              >
                <Plus className="h-4 w-4" />
                ยื่นคำร้องขอหนังสือรับรองใหม่ (New Request)
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Official Certificate Templates Overview */}
        <div className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(TEMPLATE_INFO) as CertificateTemplateType[]).map((key) => {
            const info = TEMPLATE_INFO[key];
            return (
              <div
                key={key}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-indigo-300 hover:shadow-sm"
              >
                <div>
                  <span className="inline-block rounded-lg bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700">
                    {info.badge}
                  </span>
                  <h3 className="mt-2.5 text-sm font-bold text-slate-900">{info.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{info.subtitle}</p>
                </div>
                <div className="mt-4 pt-2 border-t border-slate-100">
                  <Link
                    href={`/portal/certificates/request?template=${key}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-500"
                  >
                    ยื่นคำขอประเภทนี้ →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาด้วยรหัสนิสิต (Student ID), ชื่อ-ฉายา, เลขที่ Passport หรือสาขาวิชา..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>

          <select
            value={templateFilter}
            onChange={(e) => setTemplateFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700"
          >
            <option value="ALL">ทุกประเภทหนังสือรับรอง</option>
            <option value="THAI_CERT">หนังสือรับรองนิสิต (ภาษาไทย)</option>
            <option value="ENG_CERT">หนังสือรับรองภาษาอังกฤษ (ใช้นอกประเทศ)</option>
            <option value="BANK_LETTER">หนังสือขอความอนุเคราะห์ธนาคาร</option>
            <option value="RESIDENCE_MEMO">บันทึกข้อความ รับรองที่อยู่</option>
          </select>
        </div>

        {/* List of Certificate Requests */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredItems.map((item) => {
            const m = item.metadata;
            const tpl = (m.docTemplate || "THAI_CERT") as CertificateTemplateType;
            const info = TEMPLATE_INFO[tpl] || TEMPLATE_INFO.THAI_CERT;

            return (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-slate-300"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-800">
                          {m.studentCode || "ไม่ระบุรหัส"}
                        </span>
                        <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                          {info.badge}
                        </span>
                      </div>
                      <h3 className="mt-1.5 text-base font-bold text-slate-900">
                        {m.fullName || "นิสิตคณะพุทธศาสตร์"}
                      </h3>
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                        item.status === "APPROVED"
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                          : item.status === "REJECTED"
                            ? "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20"
                            : "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
                      }`}
                    >
                      {item.status === "APPROVED" ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" /> อนุมัติแล้ว
                        </>
                      ) : item.status === "REJECTED" ? (
                        <>
                          <XCircle className="h-3.5 w-3.5" /> ไม่อนุมัติ
                        </>
                      ) : (
                        <>
                          <Clock className="h-3.5 w-3.5" /> รอดำเนินการ
                        </>
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                    <div>
                      <span className="text-[11px] text-slate-400">ประเภทหนังสือ:</span>
                      <div className="font-semibold text-slate-800">{info.title}</div>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400">วัตถุประสงค์:</span>
                      <div className="font-semibold text-slate-800">
                        {m.requestPurpose || "-"}
                      </div>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400">สาขาวิชา / ชั้นปี:</span>
                      <div className="font-medium text-slate-700">
                        {m.major || "-"} ({m.classYear || "-"})
                      </div>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400">สัญชาติ / Passport:</span>
                      <div className="font-medium text-slate-700">
                        {m.nationality || "-"} {m.passportNo ? `• ${m.passportNo}` : ""}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <Globe className="h-3.5 w-3.5 text-indigo-500" />
                    {m.language || "In Thai language"}
                  </span>

                  <button
                    type="button"
                    onClick={() => openPreview(item)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800"
                  >
                    <FileText className="h-3.5 w-3.5 text-amber-400" />
                    ดูตัวอย่างหนังสือ / ปรับฟอนต์ / พิมพ์ PDF
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive A4 Certificate Preview & Font Size Adjuster Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 p-4 backdrop-blur-xs print:static print:bg-white print:p-0">
          <div className="mx-auto max-w-5xl space-y-4">
            {/* Control Bar (Hidden in Print) */}
            <div className="sticky top-2 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 shadow-xl print:hidden">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  ตัวอย่างหนังสือรับรอง A4: {previewItem.metadata.fullName} (
                  {previewItem.metadata.studentCode})
                </h3>
                <p className="text-xs text-slate-500">
                  สามารถปรับขนาดตัวอักษรให้เท่ากับต้นฉบับหรือปรับเพิ่ม-ลดได้ก่อนสั่งพิมพ์ PDF
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
                  <Type className="h-3.5 w-3.5 text-indigo-600" />
                  <span className="text-xs font-semibold text-slate-700">ขนาดอักษร:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewFontSizePt((p) => Math.max(10, Number((p - 0.5).toFixed(1))))
                    }
                    className="h-6 w-6 rounded bg-white text-xs font-bold shadow-2xs hover:bg-slate-100"
                  >
                    -
                  </button>
                  <span className="w-14 text-center font-mono text-xs font-bold text-indigo-700">
                    {previewFontSizePt} pt
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewFontSizePt((p) => Math.min(26, Number((p + 0.5).toFixed(1))))
                    }
                    className="h-6 w-6 rounded bg-white text-xs font-bold shadow-2xs hover:bg-slate-100"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const isEng = previewItem.metadata.docTemplate === "ENG_CERT";
                    setPreviewFontSizePt(isEng ? 12.5 : 16);
                    setPreviewLineHeight(1.85);
                  }}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  เท่าต้นฉบับ (
                  {previewItem.metadata.docTemplate === "ENG_CERT" ? "12.5pt" : "16pt"})
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500"
                >
                  <Printer className="h-4 w-4" />
                  พิมพ์หนังสือ / บันทึก PDF
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* A4 Sheet */}
            <div className="overflow-x-auto pb-10 print:overflow-visible print:pb-0">
              <CertificateA4Document
                metadata={{
                  ...previewItem.metadata,
                  fontSizePt: previewFontSizePt,
                  lineHeight: previewLineHeight,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
