"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  UserCheck,
  FileText,
  Globe,
  MapPin,
  Sparkles,
  Eye,
  Send,
} from "lucide-react";
import {
  CERTIFICATE_PURPOSES,
  CertificateA4Document,
  certificateMetadataSchema,
  type CertificateTemplateType,
} from "@/features/certificates";
import {
  submitRequestAction,
  lookupStudentByCodeAction,
} from "@/features/certificates/actions";

interface CertTypeOption {
  id: string;
  name: string;
  description: string | null;
}

interface Props {
  types: CertTypeOption[];
  locale: string;
  initialTemplate?: string;
}

export function RequestFormClient({ types, initialTemplate }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPreview, setShowPreview] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const initialTpl: CertificateTemplateType =
    initialTemplate === "ENG_CERT" ||
    initialTemplate === "BANK_LETTER" ||
    initialTemplate === "RESIDENCE_MEMO"
      ? initialTemplate
      : "THAI_CERT";

  const [form, setForm] = useState<{
    docTemplate: CertificateTemplateType;
    fontSizePt: number;
    email: string;
    studentCode: string;
    fullName: string;
    age: string;
    sex: string;
    nationality: string;
    country: string;
    passportNo: string;
    passportExpireDate: string;
    visaType: string;
    visaExpireDate: string;
    classYear: string;
    degreeLevel: string;
    major: string;
    requestPurpose: string;
    language: "In Thai language" | "In English language";
    gpa: string;
    addressLine: string;
    subdistrict: string;
    district: string;
    province: string;
    postalCode: string;
    bankTargetTh: string;
    passportCopyUrl: string;
    registrationPdfUrl: string;
    paymentPdfUrl: string;
  }>({
    docTemplate: initialTpl,
    fontSizePt: initialTpl === "ENG_CERT" ? 12.5 : 16,
    email: "",
    studentCode: "",
    fullName: "",
    age: "",
    sex: "M",
    nationality: "เมียนมา",
    country: "Myanmar",
    passportNo: "",
    passportExpireDate: "",
    visaType: "Non-Immigrant Visa",
    visaExpireDate: "",
    classYear: "ปีที่ 1 (First year)",
    degreeLevel: "ป.ตรี (B.A. English Program)",
    major: "Buddhist Studies",
    requestPurpose:
      initialTpl === "BANK_LETTER"
        ? "Mobile Banking (เปิดใช้งานแอปพลิเคชันธนาคาร)"
        : initialTpl === "RESIDENCE_MEMO"
          ? "Residence Certificate (ขอรับรองที่อยู่)"
          : initialTpl === "ENG_CERT"
            ? "Visa to Thailand"
            : CERTIFICATE_PURPOSES[0].value,
    language: initialTpl === "ENG_CERT" ? "In English language" : "In Thai language",
    gpa: "",
    addressLine: "79 หมู่ 1 มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
    subdistrict: "ลำไทร",
    district: "วังน้อย",
    province: "พระนครศรีอยุธยา",
    postalCode: "13170",
    bankTargetTh: "ผู้จัดการธนาคารกรุงไทย สาขาโลตัส นวนคร",
    passportCopyUrl: "",
    registrationPdfUrl: "",
    paymentPdfUrl: "",
  });

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleTemplateChange = (tpl: CertificateTemplateType) => {
    setForm((prev) => ({
      ...prev,
      docTemplate: tpl,
      fontSizePt: tpl === "ENG_CERT" ? 12.5 : 16,
      language: tpl === "ENG_CERT" ? "In English language" : "In Thai language",
      requestPurpose:
        tpl === "BANK_LETTER"
          ? "Mobile Banking (เปิดใช้งานแอปพลิเคชันธนาคาร)"
          : tpl === "RESIDENCE_MEMO"
            ? "Residence Certificate (ขอรับรองที่อยู่)"
            : tpl === "ENG_CERT"
              ? "Visa to Thailand"
              : prev.requestPurpose,
    }));
  };

  const handleLookupStudent = () => {
    if (!form.studentCode.trim()) {
      notify("กรุณากรอกรหัสนิสิต 10 หลักก่อนกดค้นหา");
      return;
    }
    startTransition(async () => {
      const found = await lookupStudentByCodeAction(form.studentCode.trim());
      if (!found) {
        notify("ไม่พบรหัสนิสิตในฐานข้อมูล สามารถกรอกข้อมูลด้วยตนเองได้ทันที");
        return;
      }
      setForm((prev) => ({
        ...prev,
        fullName: found.fullName || prev.fullName,
        degreeLevel: found.degreeLevel || prev.degreeLevel,
        major: found.major || prev.major,
        classYear: found.classYear || prev.classYear,
        sex: found.sex || prev.sex,
        email: found.email || prev.email,
      }));
      notify(`ดึงข้อมูลนิสิต ${found.fullName} เรียบร้อยแล้ว`);
    });
  };

  const fullAddressCombined = [
    form.addressLine,
    form.subdistrict,
    form.district,
    form.province,
    form.postalCode,
  ]
    .filter(Boolean)
    .join(" ");

  const previewMetadata = certificateMetadataSchema.parse({
    ...form,
    fullAddress: fullAddressCombined,
    lineHeight: 1.85,
    marginTopMm: 24,
    marginSideMm: 25,
    showSignatureGraphic: true,
    showPhotoBox: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      notify("กรุณากรอกชื่อ-ฉายา / นามสกุลของนิสิต");
      return;
    }

    startTransition(async () => {
      try {
        const matchedType =
          types.find((t) =>
            t.name.toLowerCase().includes(form.requestPurpose.slice(0, 10).toLowerCase())
          ) || types[0];

        await submitRequestAction({
          certificateTypeId: matchedType?.id || "",
          metadata: {
            email: form.email,
            studentCode: form.studentCode,
            fullName: form.fullName,
            age: form.age,
            sex: form.sex,
            nationality: form.nationality,
            country: form.country,
            passportNo: form.passportNo,
            passportExpireDate: form.passportExpireDate,
            visaType: form.visaType,
            visaExpireDate: form.visaExpireDate,
            classYear: form.classYear,
            degreeLevel: form.degreeLevel,
            major: form.major,
            requestPurpose: form.requestPurpose,
            language: form.language,
            gpa: form.gpa,
            addressLine: form.addressLine,
            subdistrict: form.subdistrict,
            district: form.district,
            province: form.province,
            postalCode: form.postalCode,
            fullAddress: fullAddressCombined,
            passportCopyUrl: form.passportCopyUrl,
            registrationPdfUrl: form.registrationPdfUrl,
            paymentPdfUrl: form.paymentPdfUrl,
            docTemplate: form.docTemplate,
            fontSizePt: form.fontSizePt,
            lineHeight: 1.85,
            marginTopMm: 24,
            marginSideMm: 25,
            bankTargetTh: form.bankTargetTh,
            showSignatureGraphic: true,
            showPhotoBox: true,
          },
        });

        router.push("/portal/certificates");
        router.refresh();
      } catch {
        notify("เกิดข้อผิดพลาดในการส่งคำร้อง กรุณาตรวจสอบข้อมูลอีกครั้ง");
      }
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>{toast}</span>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/portal/certificates"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับไปหน้ารายการหนังสือรับรอง
        </Link>

        <button
          type="button"
          onClick={() => setShowPreview((p) => !p)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
        >
          <Eye className="h-4 w-4" />
          {showPreview ? "ซ่อนตัวอย่างใบรับรอง A4" : "ดูตัวอย่างหนังสือรับรอง A4 แบบสด"}
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {/* Form Header */}
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-900 to-indigo-950 px-6 py-6 text-white sm:px-8">
          <h1 className="text-xl font-extrabold sm:text-2xl">
            แบบฟอร์มยื่นคำร้องขอหนังสือรับรองนิสิต (Student Certificate Application Form)
          </h1>
          <p className="mt-1 text-xs text-slate-300">
            คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย • รองรับทั้งหนังสือภาษาไทยและภาษาอังกฤษ (สำหรับใช้นอกประเทศ)
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 p-6 sm:p-8">
          {/* SECTION 1: SELECT CERTIFICATE TYPE & FONT SIZE */}
          <div className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <FileText className="h-4 w-4 text-indigo-600" />
              1. เลือกประเภทหนังสือรับรองและขนาดตัวอักษรที่ต้องการ
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                {
                  id: "THAI_CERT" as const,
                  title: "หนังสือรับรองนิสิต (ภาษาไทย)",
                  desc: "สำหรับขอต่อวีซ่า (ตม.) หรือรับรองสถานภาพนิสิต (ต้นฉบับ 16pt)",
                },
                {
                  id: "ENG_CERT" as const,
                  title: "หนังสือรับรองภาษาอังกฤษ (ใช้นอกประเทศ)",
                  desc: "TO WHOM IT MAY CONCERN สำหรับใช้ในต่างประเทศ (ต้นฉบับ 12.5pt)",
                },
                {
                  id: "BANK_LETTER" as const,
                  title: "หนังสือขอความอนุเคราะห์ธนาคาร",
                  desc: "สำหรับเปิดบัญชีธนาคาร หรือทำธุรกรรม Mobile Banking (16pt)",
                },
                {
                  id: "RESIDENCE_MEMO" as const,
                  title: "บันทึกข้อความ ขอหนังสือรับรองที่อยู่",
                  desc: "บันทึกข้อความถึงผู้อำนวยการกองกิจการนิสิต มจร (16pt)",
                },
              ].map((card) => {
                const active = form.docTemplate === card.id;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => handleTemplateChange(card.id)}
                    className={`flex flex-col items-start rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600/20"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-900">{card.title}</span>
                    <span className="mt-1 text-[11px] text-slate-500">{card.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: STUDENT INFORMATION & AUTO-FILL */}
          <div className="space-y-4 border-t border-slate-200 pt-6">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <UserCheck className="h-4 w-4 text-indigo-600" />
              2. ข้อมูลนิสิตและผู้ยื่นคำร้อง (Student & Applicant Information)
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
              <div className="sm:col-span-5">
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  รหัสนิสิต 10 หลัก (Student ID) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={form.studentCode}
                    onChange={(e) => setForm((p) => ({ ...p, studentCode: e.target.value }))}
                    placeholder="เช่น 6801203032"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 font-mono text-xs"
                  />
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleLookupStudent}
                    className="shrink-0 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                  >
                    ดึงข้อมูลอัตโนมัติ
                  </button>
                </div>
              </div>

              <div className="sm:col-span-5">
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  ชื่อ - ฉายา / นามสกุล (Full Name) *
                </label>
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                  placeholder="ระบุชื่อภาษาไทย หรือ ภาษาอังกฤษ (เช่น PHRA HTET AUNG)"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  อายุ (Age)
                </label>
                <input
                  type="text"
                  value={form.age}
                  onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))}
                  placeholder="เช่น 28"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  สถานะ / เพศ (Sex)
                </label>
                <select
                  value={form.sex}
                  onChange={(e) => setForm((p) => ({ ...p, sex: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                >
                  <option value="M">M (พระภิกษุ / สามเณร / ชาย)</option>
                  <option value="F">F (แม่ชี / ภิกษุณี / หญิง)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  สัญชาติ (Nationality)
                </label>
                <input
                  type="text"
                  value={form.nationality}
                  onChange={(e) => setForm((p) => ({ ...p, nationality: e.target.value }))}
                  placeholder="เช่น เมียนมา / ไทย / จีน"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  ประเทศ (Country)
                </label>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
                  placeholder="Myanmar / Thailand / Vietnam"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  อีเมลติดต่อ (Email Address)
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="student@mcu.ac.th"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: PASSPORT, VISA & ACADEMIC DETAILS */}
          <div className="space-y-4 border-t border-slate-200 pt-6">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Globe className="h-4 w-4 text-indigo-600" />
              3. ข้อมูลหนังสือเดินทาง (Passport & Visa) และข้อมูลการศึกษา
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  เลขหนังสือเดินทาง (Passport No.)
                </label>
                <input
                  type="text"
                  value={form.passportNo}
                  onChange={(e) => setForm((p) => ({ ...p, passportNo: e.target.value }))}
                  placeholder="เช่น ME242855 (นิสิตไทยเว้นว่างได้)"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  วันหมดอายุ Passport
                </label>
                <input
                  type="text"
                  value={form.passportExpireDate}
                  onChange={(e) => setForm((p) => ({ ...p, passportExpireDate: e.target.value }))}
                  placeholder="เช่น 19 Feb 2029"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  ประเภทวีซ่า (Type of Visa)
                </label>
                <input
                  type="text"
                  value={form.visaType}
                  onChange={(e) => setForm((p) => ({ ...p, visaType: e.target.value }))}
                  placeholder="Non-Immigrant Visa"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  วันหมดอายุวีซ่า (Visa Expiration)
                </label>
                <input
                  type="text"
                  value={form.visaExpireDate}
                  onChange={(e) => setForm((p) => ({ ...p, visaExpireDate: e.target.value }))}
                  placeholder="เช่น 13 May 2026"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  ชั้นปีที่ศึกษา (Class)
                </label>
                <select
                  value={form.classYear}
                  onChange={(e) => setForm((p) => ({ ...p, classYear: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                >
                  <option value="ปีที่ 1 (First year)">ปีที่ 1 (First year)</option>
                  <option value="ปีที่ 2 (Second year)">ปีที่ 2 (Second year)</option>
                  <option value="ปีที่ 3 (Third year)">ปีที่ 3 (Third year)</option>
                  <option value="ปีที่ 4 (Fourth year)">ปีที่ 4 (Fourth year)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  ระดับปริญญา (Degree)
                </label>
                <select
                  value={form.degreeLevel}
                  onChange={(e) => setForm((p) => ({ ...p, degreeLevel: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                >
                  <option value="ป.ตรี (B.A. English Program)">
                    ป.ตรี (B.A. English Program)
                  </option>
                  <option value="ป.ตรี (B.A. Thai Program)">
                    ป.ตรี (B.A. Thai Program)
                  </option>
                  <option value="ป.โท (M.A.)">ป.โท (M.A.)</option>
                  <option value="ป.เอก (Ph.D.)">ป.เอก (Ph.D.)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  สาขาวิชา (Major)
                </label>
                <input
                  type="text"
                  value={form.major}
                  onChange={(e) => setForm((p) => ({ ...p, major: e.target.value }))}
                  placeholder="เช่น Buddhist Studies หรือ Religion and Philosophy"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  เกรดเฉลี่ยสะสม (GPA)
                </label>
                <input
                  type="text"
                  value={form.gpa}
                  onChange={(e) => setForm((p) => ({ ...p, gpa: e.target.value }))}
                  placeholder="เช่น 3.55"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  วัตถุประสงค์ในการขอหนังสือ (Purpose)
                </label>
                <select
                  value={form.requestPurpose}
                  onChange={(e) => setForm((p) => ({ ...p, requestPurpose: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                >
                  {CERTIFICATE_PURPOSES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.labelTh}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  ภาษาของหนังสือรับรอง (Language)
                </label>
                <select
                  value={form.language}
                  onChange={(e) => {
                    const lang = e.target.value as "In Thai language" | "In English language";
                    setForm((p) => ({
                      ...p,
                      language: lang,
                      docTemplate:
                        lang === "In English language"
                          ? "ENG_CERT"
                          : p.docTemplate === "ENG_CERT"
                            ? "THAI_CERT"
                            : p.docTemplate,
                      fontSizePt: lang === "In English language" ? 12.5 : 16,
                    }));
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold"
                >
                  <option value="In Thai language">In Thai language (ฉบับภาษาไทย)</option>
                  <option value="In English language">
                    In English language (ฉบับภาษาอังกฤษ ใช้นอกประเทศ)
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  ขนาดตัวอักษรใน PDF (ปรับได้ 10-26pt)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min={10}
                    max={26}
                    value={form.fontSizePt}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        fontSizePt: parseFloat(e.target.value || "16"),
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs font-bold text-indigo-700"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm((p) => ({
                        ...p,
                        fontSizePt: p.docTemplate === "ENG_CERT" ? 12.5 : 16,
                      }))
                    }
                    className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    เท่าต้นฉบับ
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: ADDRESS IN THAILAND */}
          <div className="space-y-4 border-t border-slate-200 pt-6">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <MapPin className="h-4 w-4 text-indigo-600" />
              4. ที่อยู่ปัจจุบันในประเทศไทย
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  บ้านเลขที่ / วัด / หอพัก (Address)
                </label>
                <input
                  type="text"
                  value={form.addressLine}
                  onChange={(e) => setForm((p) => ({ ...p, addressLine: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  ตำบล/แขวง
                </label>
                <input
                  type="text"
                  value={form.subdistrict}
                  onChange={(e) => setForm((p) => ({ ...p, subdistrict: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  อำเภอ/เขต
                </label>
                <input
                  type="text"
                  value={form.district}
                  onChange={(e) => setForm((p) => ({ ...p, district: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  จังหวัด
                </label>
                <input
                  type="text"
                  value={form.province}
                  onChange={(e) => setForm((p) => ({ ...p, province: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  รหัสไปรษณีย์
                </label>
                <input
                  type="text"
                  value={form.postalCode}
                  onChange={(e) => setForm((p) => ({ ...p, postalCode: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
              </div>
            </div>
          </div>

          {/* LIVE A4 PREVIEW SECTION (Optional Toggle) */}
          {showPreview && (
            <div className="space-y-3 rounded-2xl border border-indigo-200 bg-slate-100 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-950">
                  ตัวอย่างเอกสาร A4 ตามข้อมูลที่กรอก (ขนาดอักษร {form.fontSizePt}pt)
                </span>
              </div>
              <div className="overflow-x-auto py-2">
                <CertificateA4Document metadata={previewMetadata} />
              </div>
            </div>
          )}

          {/* Submit Footer */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6">
            <Link
              href="/portal/certificates"
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              ยกเลิก
            </Link>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              ยืนยันการยื่นคำร้องขอหนังสือรับรอง
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
