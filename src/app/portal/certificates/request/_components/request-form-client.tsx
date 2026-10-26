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
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Edit3,
  X,
  FileCheck2,
  Paperclip,
  UploadCloud,
  GraduationCap,
  Building2,
  Search,
  ChevronDown,
} from "lucide-react";
import { useLocale } from "@/shared/lib/i18n/client";
import {
  CERTIFICATE_PURPOSES,
  CertificateA4Document,
  certificateMetadataSchema,
  type CertificateTemplateType,
} from "@/features/certificates";
import {
  submitRequestAction,
  lookupStudentByCodeAction,
  updateCertificateNoticeAction,
  uploadCertificateAttachmentAction,
  lookupPersonnelDetailForCertificateAction,
} from "@/features/certificates/actions";

interface CertTypeOption {
  id: string;
  name: string;
  description: string | null;
}

export interface PersonnelOption {
  id: string;
  fullNameTh: string;
  fullNameEn: string;
  type: string;
  positionTh: string;
  positionEn: string;
  departmentNameTh: string;
  departmentNameEn: string;
  email: string;
  phoneNumber: string;
  orderIndex: number | null;
}

interface InitialApplicantProfile {
  applicantType?: "CURRENT_STUDENT" | "NEW_STUDENT" | "FACULTY_LECTURER" | "STAFF_MEMBER";
  studentCode?: string;
  fullName?: string;
  classYear?: string;
  degreeLevel?: string;
  major?: string;
  sex?: string;
  email?: string;
  phone?: string;
  nationality?: string;
  country?: string;
  address?: string;
  staffPosition?: string;
  staffDepartment?: string;
  taughtCourses?: string;
}

interface Props {
  types: CertTypeOption[];
  locale: string;
  initialTemplate?: string;
  initialNotice?: {
    noticeTh: string;
    noticeEn?: string;
  };
  canManageNotice?: boolean;
  initialProfile?: InitialApplicantProfile | null;
  personnelList?: PersonnelOption[];
  initialMode?: "student" | "personnel";
  initialPersonnelId?: string;
}

export function RequestFormClient({
  types,
  locale,
  initialTemplate,
  initialNotice,
  canManageNotice = false,
  initialProfile = null,
  personnelList = [],
  initialMode = "student",
  initialPersonnelId = "",
}: Props) {
  const router = useRouter();
  const currentLocale = useLocale() || locale || "th";
  const isEn = currentLocale === "en";
  const [isPending, startTransition] = useTransition();

  const [showPreview, _setShowPreview] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Portal mode: Student vs Personnel (separated screens linked with Personnel directory)
  const [portalMode, setPortalMode] = useState<"student" | "personnel">(
    initialMode ||
      (initialProfile?.applicantType === "FACULTY_LECTURER" ||
      initialProfile?.applicantType === "STAFF_MEMBER"
        ? "personnel"
        : "student")
  );
  const [selectedPersonnelId, setSelectedPersonnelId] = useState<string>(
    initialPersonnelId || ""
  );
  const [isLookingUpPersonnel, setIsLookingUpPersonnel] = useState(false);

  // Announcement notice state (Admin editable)
  const [notice, setNotice] = useState(
    initialNotice || {
      noticeTh: "*สำหรับการขอต่ออายุวีซ่า ให้ดำเนินการ ก่อนหมดอายุที่ท้ายเล่ม 30 วัน",
      noticeEn:
        "*For visa extension requests, please submit your application at least 30 days before your visa/passport expiration date.",
    }
  );
  const [isNoticeEditOpen, setIsNoticeEditOpen] = useState(false);
  const [editNoticeTh, setEditNoticeTh] = useState(notice.noticeTh);
  const [editNoticeEn, setEditNoticeEn] = useState(notice.noticeEn || "");
  const [isSavingNotice, setIsSavingNotice] = useState(false);

  // Post-submission confirmation popup modal state
  const [submittedResult, setSubmittedResult] = useState<{
    id: string;
    fullName: string;
    studentCode: string;
    docTemplate: CertificateTemplateType;
  } | null>(null);

  const initialTpl: CertificateTemplateType =
    initialTemplate === "ENG_CERT" ||
    initialTemplate === "BANK_LETTER" ||
    initialTemplate === "RESIDENCE_MEMO"
      ? initialTemplate
      : "THAI_CERT";


  const [form, setForm] = useState<{
    docTemplate: CertificateTemplateType;
    fontSizePt: number;
    applicantType: "CURRENT_STUDENT" | "NEW_STUDENT" | "FACULTY_LECTURER" | "STAFF_MEMBER";
    staffPosition: string;
    staffDepartment: string;
    taughtCourses: string;
    admissionProofUrl: string;
    email: string;
    phone: string;
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
    applicantType: initialProfile?.applicantType || "CURRENT_STUDENT",
    staffPosition: initialProfile?.staffPosition || "",
    staffDepartment: initialProfile?.staffDepartment || "",
    taughtCourses: initialProfile?.taughtCourses || "",
    admissionProofUrl: "",
    email: initialProfile?.email || "",
    phone: initialProfile?.phone || "",
    studentCode: initialProfile?.studentCode || "",
    fullName: initialProfile?.fullName || "",
    age: "",
    sex: initialProfile?.sex || "",
    nationality: initialProfile?.nationality || "",
    country: initialProfile?.country || "",
    passportNo: "",
    passportExpireDate: "",
    visaType: "",
    visaExpireDate: "",
    classYear: initialProfile?.classYear || "",
    degreeLevel: initialProfile?.degreeLevel || "",
    major: initialProfile?.major || "",
    requestPurpose:
      initialTpl === "BANK_LETTER"
        ? "Mobile Banking (เปิดใช้งานแอปพลิเคชันธนาคาร)"
        : initialTpl === "RESIDENCE_MEMO"
          ? "Residence Certificate (ขอรับรองที่อยู่)"
          : initialTpl === "ENG_CERT"
            ? "Visa to Thailand"
            : initialProfile?.applicantType === "FACULTY_LECTURER"
              ? "Teaching & Lecturer Certificate (รับรองการเป็นอาจารย์ประจำ/อาจารย์พิเศษ)"
              : initialProfile?.applicantType === "STAFF_MEMBER"
                ? "Faculty & Staff Employment Certificate (รับรองการปฏิบัติงานอาจารย์/เจ้าหน้าที่)"
                : initialProfile?.applicantType === "NEW_STUDENT"
                  ? "Letter of Acceptance (หนังสือตอบรับเข้าศึกษา/ขอวีซ่า)"
                  : "",
    language: initialTpl === "ENG_CERT" ? "In English language" : "In Thai language",
    gpa: "",
    addressLine: initialProfile?.address || "",
    subdistrict: "",
    district: "",
    province: "",
    postalCode: "",
    bankTargetTh: "",
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

  const [uploadingAdmissionProof, setUploadingAdmissionProof] = useState(false);
  const [uploadingPassportCopy, setUploadingPassportCopy] = useState(false);
  const [uploadingPaymentPdf, setUploadingPaymentPdf] = useState(false);

  const handleFileUpload = async (
    file: File,
    target: "admissionProofUrl" | "passportCopyUrl" | "paymentPdfUrl"
  ) => {
    if (target === "admissionProofUrl") setUploadingAdmissionProof(true);
    else if (target === "passportCopyUrl") setUploadingPassportCopy(true);
    else if (target === "paymentPdfUrl") setUploadingPaymentPdf(true);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadCertificateAttachmentAction(fd);
      if (res?.url) {
        setForm((prev) => ({ ...prev, [target]: res.url }));
        notify(`อัปโหลดไฟล์สำเร็จ: ${res.fileName}`);
      }
    } catch (err: unknown) {
      notify((err instanceof Error ? err.message : String(err)) || "ไม่สามารถอัปโหลดไฟล์ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      if (target === "admissionProofUrl") setUploadingAdmissionProof(false);
      else if (target === "passportCopyUrl") setUploadingPassportCopy(false);
      else if (target === "paymentPdfUrl") setUploadingPaymentPdf(false);
    }
  };

  const handleSelectPersonnel = (personnelId: string) => {
    if (!personnelId) {
      setSelectedPersonnelId("");
      return;
    }
    setSelectedPersonnelId(personnelId);
    setIsLookingUpPersonnel(true);
    startTransition(async () => {
      try {
        const detail = await lookupPersonnelDetailForCertificateAction(personnelId);
        if (detail) {
          const isAcademic = detail.applicantType === "FACULTY_LECTURER";
          setForm((prev) => ({
            ...prev,
            applicantType: detail.applicantType,
            studentCode: detail.studentCode || prev.studentCode,
            fullName: detail.fullName || prev.fullName,
            classYear: detail.classYear || (isAcademic ? "คณาจารย์ประจำคณะ" : "เจ้าหน้าที่สายสนับสนุน"),
            degreeLevel: detail.degreeLevel || "บุคลากรคณะพุทธศาสตร์",
            major: detail.major || prev.major,
            sex: detail.sex || "M",
            email: detail.email || prev.email,
            phone: detail.phone || prev.phone,
            nationality: detail.nationality || "ไทย",
            country: detail.country || "ไทย",
            staffPosition: detail.staffPosition || prev.staffPosition,
            staffDepartment: detail.staffDepartment || prev.staffDepartment,
            taughtCourses: detail.taughtCourses || prev.taughtCourses,
            addressLine: detail.address || prev.addressLine,
            requestPurpose: isAcademic
              ? "Teaching & Lecturer Certificate (รับรองการเป็นอาจารย์ประจำ/อาจารย์พิเศษ)"
              : "Faculty & Staff Employment Certificate (รับรองการปฏิบัติงานอาจารย์/เจ้าหน้าที่)",
            docTemplate: prev.docTemplate === "ENG_CERT" ? "ENG_CERT" : "THAI_CERT",
          }));
          notify(`⚡ เชื่อมโยงทำเนียบบุคลากร: ดึงข้อมูล ${detail.fullName} เรียบร้อยแล้ว`);
        }
      } catch (err: unknown) {
        notify((err instanceof Error ? err.message : String(err)) || "ไม่สามารถดึงข้อมูลทำเนียบบุคลากรได้");
      } finally {
        setIsLookingUpPersonnel(false);
      }
    });
  };

  const handleLookupStudent = () => {
    const query = (form.studentCode || form.fullName).trim();
    if (!query) {
      if (form.applicantType === "NEW_STUDENT") {
        notify("สำหรับนิสิตใหม่ที่ยังไม่มีรหัสนิสิต สามารถกรอกรหัสชั่วคราว (TEMP-68xxx) หรือกรอกข้อมูลด้านล่างได้ทันที");
      } else if (form.applicantType === "FACULTY_LECTURER" || form.applicantType === "STAFF_MEMBER") {
        notify("กรุณากรอกรหัสอาจารย์/บุคลากร (เช่น T69001) หรือพิมพ์ชื่ออาจารย์ก่อนกดค้นหา");
      } else {
        notify("กรุณากรอกรหัสนิสิต 10 หลักก่อนกดค้นหา");
      }
      return;
    }
    startTransition(async () => {
      const found = await lookupStudentByCodeAction(query);
      if (!found) {
        notify("ไม่พบข้อมูลในฐานข้อมูล สามารถกรอกข้อมูลด้วยตนเองได้ทันที");
        return;
      }
      const foundRecord = found as unknown as Record<string, string | null | undefined>;
      const detectedType =
        (foundRecord.applicantType as
          | "CURRENT_STUDENT"
          | "NEW_STUDENT"
          | "FACULTY_LECTURER"
          | "STAFF_MEMBER"
          | undefined) || form.applicantType;

      setForm((prev) => ({
        ...prev,
        applicantType: detectedType,
        studentCode: found.studentCode || prev.studentCode,
        fullName: found.fullName || prev.fullName,
        degreeLevel: found.degreeLevel || prev.degreeLevel,
        major: found.major || prev.major,
        classYear: found.classYear || prev.classYear,
        sex: found.sex || prev.sex,
        email: found.email || prev.email,
        nationality: foundRecord.nationality || prev.nationality,
        country: foundRecord.country || prev.country,
        addressLine: foundRecord.address || prev.addressLine,
        staffPosition: foundRecord.staffPosition || prev.staffPosition,
        staffDepartment: foundRecord.staffDepartment || prev.staffDepartment,
        taughtCourses: foundRecord.taughtCourses || prev.taughtCourses,
        requestPurpose:
          detectedType === "FACULTY_LECTURER"
            ? "Teaching & Lecturer Certificate (รับรองการเป็นอาจารย์ประจำ/อาจารย์พิเศษ)"
            : detectedType === "STAFF_MEMBER"
            ? "Faculty & Staff Employment Certificate (รับรองการปฏิบัติงานอาจารย์/เจ้าหน้าที่)"
            : detectedType === "NEW_STUDENT"
            ? "Letter of Acceptance (หนังสือตอบรับเข้าศึกษา/ขอวีซ่า)"
            : prev.requestPurpose,
      }));
      notify(
        detectedType === "FACULTY_LECTURER"
          ? `ดึงข้อมูลอาจารย์ ${found.fullName} และรายวิชาที่สอนเรียบร้อยแล้ว`
          : detectedType === "STAFF_MEMBER"
          ? `ดึงข้อมูลบุคลากร ${found.fullName} เรียบร้อยแล้ว`
          : `ดึงข้อมูล ${found.fullName} เรียบร้อยแล้ว`
      );
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
    applicantType: form.applicantType,
    admissionProofUrl: form.admissionProofUrl,
    phone: form.phone,
    sex: form.sex || "M",
    classYear:
      form.classYear ||
      (form.applicantType === "NEW_STUDENT"
        ? "นิสิตใหม่ / ชั้นปี 1 (New Admitted Student)"
        : form.applicantType === "FACULTY_LECTURER"
        ? "คณาจารย์ประจำคณะ"
        : form.applicantType === "STAFF_MEMBER"
        ? "เจ้าหน้าที่สายสนับสนุน"
        : "ปีที่ 1 (First year)"),
    degreeLevel:
      form.degreeLevel ||
      (form.applicantType === "FACULTY_LECTURER" || form.applicantType === "STAFF_MEMBER"
        ? "บุคลากรคณะพุทธศาสตร์"
        : "ป.ตรี (B.A. English Program)"),
    major: form.major || (form.staffDepartment || "Buddhist Studies"),
    requestPurpose: form.requestPurpose || CERTIFICATE_PURPOSES[0].value,
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
      notify(
        portalMode === "personnel"
          ? "กรุณาเลือกหรือกรอกชื่อ-ฉายา / นามสกุลของอาจารย์หรือบุคลากร"
          : "กรุณากรอกชื่อ-ฉายา / นามสกุลของนิสิต"
      );
      return;
    }
    if (form.applicantType === "NEW_STUDENT" && !form.passportNo.trim()) {
      notify("กรุณากรอกเลขที่ใบสมัคร หรือ เลขที่หนังสือเดินทาง (Passport No.) สำหรับนิสิตใหม่");
      return;
    }

    startTransition(async () => {
      try {
        const purposeVal = form.requestPurpose || CERTIFICATE_PURPOSES[0].value;
        const matchedType =
          types.find((t) =>
            t.name.toLowerCase().includes(purposeVal.slice(0, 10).toLowerCase())
          ) || types[0];

        const res = await submitRequestAction({
          certificateTypeId: matchedType?.id || "",
          metadata: {
            applicantType: form.applicantType,
            staffPosition: form.staffPosition,
            staffDepartment: form.staffDepartment,
            taughtCourses: form.taughtCourses,
            admissionProofUrl: form.admissionProofUrl,
            email: form.email,
            phone: form.phone,
            studentCode: form.studentCode,
            fullName: form.fullName,
            age: form.age,
            sex: form.sex || "M",
            nationality: form.nationality,
            country: form.country,
            passportNo: form.passportNo,
            passportExpireDate: form.passportExpireDate,
            visaType: form.visaType,
            visaExpireDate: form.visaExpireDate,
            classYear: form.classYear || "ปีที่ 1 (First year)",
            degreeLevel: form.degreeLevel || "ป.ตรี (B.A. English Program)",
            major: form.major || "Buddhist Studies",
            requestPurpose: purposeVal,
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

        setSubmittedResult({
          id: (res as { id?: string })?.id || "REQ",
          fullName: form.fullName || "นิสิตผู้ยื่นคำร้อง",
          studentCode: form.studentCode,
          docTemplate: form.docTemplate,
        });


        router.refresh();
      } catch {
        notify("เกิดข้อผิดพลาดในการส่งคำร้อง กรุณาตรวจสอบข้อมูลอีกครั้ง");
      }
    });
  };

  const handleSaveNotice = async () => {
    if (!editNoticeTh.trim()) {
      notify("กรุณากรอกข้อความประกาศภาษาไทย");
      return;
    }
    setIsSavingNotice(true);
    try {
      await updateCertificateNoticeAction({
        noticeTh: editNoticeTh.trim(),
        noticeEn: editNoticeEn.trim(),
      });
      setNotice({
        noticeTh: editNoticeTh.trim(),
        noticeEn: editNoticeEn.trim(),
      });
      setIsNoticeEditOpen(false);
      notify("บันทึกข้อความประกาศหน้าคำร้องเรียบร้อยแล้ว");
    } catch {
      notify("เกิดข้อผิดพลาดในการบันทึกประกาศ");
    } finally {
      setIsSavingNotice(false);
    }
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
          {isEn ? "Back to Certificates" : "กลับไปหน้ารายการหนังสือรับรอง"}
        </Link>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {/* Form Header */}
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-900 to-indigo-950 px-6 py-6 text-white sm:px-8">
          <h1 className="text-xl font-extrabold sm:text-2xl">
            {isEn
              ? "Student Certificate Application Form"
              : "แบบฟอร์มยื่นคำร้องขอหนังสือรับรองนิสิต (Student Certificate Application Form)"}
          </h1>
          <p className="mt-1 text-xs text-slate-300">
            {isEn
              ? "Faculty of Buddhism, Mahachulalongkornrajavidyalaya University • Supports official Thai and English documents"
              : "คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย • รองรับทั้งหนังสือภาษาไทยและภาษาอังกฤษ (สำหรับใช้นอกประเทศ)"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 p-6 sm:p-8">
          {/* PROMINENT RED NOTICE BANNER (Before Step 1 - Admin Editable) */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-rose-500 bg-gradient-to-r from-red-50 via-rose-50 to-orange-50 p-4 sm:p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-md">
                  <AlertTriangle className="h-5 w-5" />
                </span>
                <div className="space-y-1">
                  <div className="text-base sm:text-lg font-black tracking-wide text-red-600 leading-snug">
                    {notice.noticeTh}
                  </div>
                  {notice.noticeEn && (
                    <div className="text-xs sm:text-sm font-semibold text-rose-700 leading-snug">
                      {notice.noticeEn}
                    </div>
                  )}
                </div>
              </div>

              {canManageNotice && (
                <button
                  type="button"
                  onClick={() => {
                    setEditNoticeTh(notice.noticeTh);
                    setEditNoticeEn(notice.noticeEn || "");
                    setIsNoticeEditOpen(true);
                  }}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-red-300 bg-white/95 px-3 py-1.5 text-xs font-bold text-red-700 shadow-2xs hover:bg-red-100 hover:text-red-900 transition-colors"
                  title="แก้ไขข้อความประกาศ (เฉพาะ Admin)"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>แก้ไขประกาศ (Admin)</span>
                </button>
              )}
            </div>
          </div>

          {/* SECTION 1: SELECT CERTIFICATE TYPE & FONT SIZE */}
          <div className="space-y-3">

            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <FileText className="h-4 w-4 text-indigo-600" />
              {isEn
                ? "1. Select Certificate Type"
                : "1. เลือกประเภทหนังสือรับรองและขนาดตัวอักษรที่ต้องการ"}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                {
                  id: "THAI_CERT" as const,
                  title: isEn ? "Student Certificate (Thai)" : "หนังสือรับรองนิสิต (ภาษาไทย)",
                  desc: isEn
                    ? "For Thailand visa extension and domestic verification (16pt)"
                    : "สำหรับขอต่อวีซ่า (ตม.) หรือรับรองสถานภาพนิสิต (ต้นฉบับ 16pt)",
                },
                {
                  id: "ENG_CERT" as const,
                  title: isEn
                    ? "English Certificate (International Use)"
                    : "หนังสือรับรองภาษาอังกฤษ (ใช้นอกประเทศ)",
                  desc: isEn
                    ? "TO WHOM IT MAY CONCERN for foreign embassies and overseas affairs (12.5pt)"
                    : "TO WHOM IT MAY CONCERN สำหรับใช้ในต่างประเทศ (ต้นฉบับ 12.5pt)",
                },
                {
                  id: "BANK_LETTER" as const,
                  title: isEn
                    ? "Bank Recommendation Letter"
                    : "หนังสือขอความอนุเคราะห์ธนาคาร",
                  desc: isEn
                    ? "For opening a bank account or mobile banking registration (16pt)"
                    : "สำหรับเปิดบัญชีธนาคาร หรือทำธุรกรรม Mobile Banking (16pt)",
                },
                {
                  id: "RESIDENCE_MEMO" as const,
                  title: isEn
                    ? "Student Residence Memorandum"
                    : "บันทึกข้อความ ขอหนังสือรับรองที่อยู่",
                  desc: isEn
                    ? "Official memorandum to Director of Student Affairs (16pt)"
                    : "บันทึกข้อความถึงผู้อำนวยการกองกิจการนิสิต มจร (16pt)",
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

          {/* SECTION 2: APPLICANT INFORMATION & MODE SWITCHER */}
          <div className="space-y-4 border-t border-slate-200 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <UserCheck className="h-4 w-4 text-indigo-600" />
                2. ข้อมูลผู้ยื่นคำร้อง (Applicant Information)
              </h2>
              <span className="text-[11px] font-medium text-slate-500">
                {portalMode === "personnel"
                  ? "🏛️ หน้าจอสำหรับคณาจารย์และเจ้าหน้าที่ (เชื่อมโยงทำเนียบบุคลากร)"
                  : "🎓 หน้าจอสำหรับนิสิตระดับปริญญาตรี-โท-เอก"}
              </span>
            </div>

            {/* SEGMENTED TAB SWITCHER: 1. STUDENT VS 2. PERSONNEL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setPortalMode("student");
                  if (form.applicantType === "FACULTY_LECTURER" || form.applicantType === "STAFF_MEMBER") {
                    setForm((p) => ({
                      ...p,
                      applicantType: "CURRENT_STUDENT",
                      classYear: "ปีที่ 1 (First year)",
                      degreeLevel: "ป.ตรี (B.A. English Program)",
                      major: "Buddhist Studies",
                      requestPurpose: "Bonafide Certificate (ความเป็นนิสิต/ขอต่อวีซ่า)",
                      studentCode: "",
                    }));
                  }
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  portalMode === "student"
                    ? "bg-white text-indigo-700 shadow-xs border border-indigo-200/80 ring-2 ring-indigo-500/10"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                <GraduationCap className={`h-4 w-4 ${portalMode === "student" ? "text-indigo-600" : "text-slate-400"}`} />
                <span>1. สำหรับนิสิต (Student Certificate)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPortalMode("personnel");
                  if (form.applicantType === "CURRENT_STUDENT" || form.applicantType === "NEW_STUDENT") {
                    setForm((p) => ({
                      ...p,
                      applicantType: "FACULTY_LECTURER",
                      staffPosition: p.staffPosition || "อาจารย์ประจำ",
                      staffDepartment: p.staffDepartment || "ภาควิชาพระพุทธศาสนา คณะพุทธศาสตร์",
                      requestPurpose: "Teaching & Lecturer Certificate (รับรองการเป็นอาจารย์ประจำ/อาจารย์พิเศษ)",
                    }));
                  }
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  portalMode === "personnel"
                    ? "bg-white text-indigo-700 shadow-xs border border-indigo-200/80 ring-2 ring-indigo-500/10"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                <Building2 className={`h-4 w-4 ${portalMode === "personnel" ? "text-indigo-600" : "text-slate-400"}`} />
                <span>2. สำหรับคณาจารย์และเจ้าหน้าที่ (เชื่อมทำเนียบบุคลากร)</span>
              </button>
            </div>

            {portalMode === "personnel" ? (
              /* ================================================================ */
              /* FACULTY & STAFF DEDICATED VIEW (LINKED WITH PERSONNEL DIRECTORY) */
              /* ================================================================ */
              <div className="space-y-4">
                {/* SUB-TYPE SELECTOR: ACADEMIC VS SUPPORT */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                      form.applicantType === "FACULTY_LECTURER"
                        ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/15 shadow-2xs"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="applicantType"
                      value="FACULTY_LECTURER"
                      checked={form.applicantType === "FACULTY_LECTURER"}
                      onChange={() =>
                        setForm((p) => ({
                          ...p,
                          applicantType: "FACULTY_LECTURER",
                          staffPosition: p.staffPosition || "อาจารย์ประจำ",
                          staffDepartment: p.staffDepartment || "ภาควิชาพระพุทธศาสนา คณะพุทธศาสตร์",
                          classYear: "คณาจารย์ประจำคณะ",
                          degreeLevel: "บุคลากรคณะพุทธศาสตร์",
                          requestPurpose:
                            "Teaching & Lecturer Certificate (รับรองการเป็นอาจารย์ประจำ/อาจารย์พิเศษ)",
                        }))
                      }
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        👨‍🏫 อาจารย์ประจำ / อาจารย์พิเศษ (Faculty & Visiting Lecturer)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        รับรองการเป็นอาจารย์ผู้สอนประจำวิชา / ปฏิบัติศาสนกิจ / เดินทางต่างประเทศ
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                      form.applicantType === "STAFF_MEMBER"
                        ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/15 shadow-2xs"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="applicantType"
                      value="STAFF_MEMBER"
                      checked={form.applicantType === "STAFF_MEMBER"}
                      onChange={() =>
                        setForm((p) => ({
                          ...p,
                          applicantType: "STAFF_MEMBER",
                          staffPosition: p.staffPosition || "นักวิชาการศึกษา / เจ้าหน้าที่บริหารงานทั่วไป",
                          staffDepartment: p.staffDepartment || "สำนักงานคณบดี คณะพุทธศาสตร์",
                          classYear: "เจ้าหน้าที่สายสนับสนุน",
                          degreeLevel: "บุคลากรคณะพุทธศาสตร์",
                          requestPurpose:
                            "Faculty & Staff Employment Certificate (รับรองการปฏิบัติงานอาจารย์/เจ้าหน้าที่)",
                        }))
                      }
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        💼 เจ้าหน้าที่สายสนับสนุน (Faculty Support Staff)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        รับรองการปฏิบัติงานบุคลากร สำนักงานคณบดี / ภาควิชา คณะพุทธศาสตร์
                      </div>
                    </div>
                  </label>
                </div>

                {/* PERSONNEL DIRECTORY PICKER CARD */}
                <div className="overflow-hidden rounded-2xl border border-indigo-200/90 bg-linear-to-br from-indigo-50/80 via-white to-purple-50/50 p-4 sm:p-5 shadow-xs space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 shadow-2xs">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-indigo-950">
                          เลือกอาจารย์/บุคลากรจากทำเนียบ (เชื่อมโยงฐานข้อมูลทำเนียบบุคลากร)
                        </div>
                        <div className="text-[11px] text-slate-500">
                          เลือกลิสต์รายชื่อเพื่อดึงตำแหน่ง สังกัด และข้อมูลส่วนตัวลงในแบบฟอร์มอัตโนมัติ
                        </div>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100/80 px-2.5 py-1 text-[11px] font-semibold text-indigo-800">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
                      {personnelList.length} ท่านในทำเนียบ
                    </span>
                  </div>

                  {/* SELECT BOX + ACTION */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full min-w-0">
                    <div className="relative flex-1 min-w-0 w-full">
                      <select
                        value={selectedPersonnelId}
                        onChange={(e) => handleSelectPersonnel(e.target.value)}
                        className="w-full min-w-0 max-w-full appearance-none rounded-xl border border-indigo-200/90 bg-white pl-3.5 pr-10 py-2.5 text-xs font-semibold text-slate-800 shadow-2xs hover:border-indigo-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-none transition truncate"
                      >
                        <option value="">-- คลิกเลือกชื่ออาจารย์ หรือ เจ้าหน้าที่จากทำเนียบ --</option>
                        <optgroup label="👨‍🏫 คณาจารย์ประจำและอาจารย์พิเศษ (Academic)">
                          {personnelList
                            .filter((p) => p.type === "ACADEMIC")
                            .map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.fullNameTh} — {p.positionTh} ({p.departmentNameTh})
                              </option>
                            ))}
                        </optgroup>
                        <optgroup label="💼 เจ้าหน้าที่สายสนับสนุน (Support Staff)">
                          {personnelList
                            .filter((p) => p.type === "SUPPORT")
                            .map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.fullNameTh} — {p.positionTh} ({p.departmentNameTh})
                              </option>
                            ))}
                        </optgroup>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500" />
                    </div>

                    <button
                      type="button"
                      disabled={!selectedPersonnelId || isLookingUpPersonnel}
                      onClick={() => handleSelectPersonnel(selectedPersonnelId)}
                      className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-40 transition active:scale-[0.99]"
                    >
                      {isLookingUpPersonnel ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      <span>ดึงข้อมูลทำเนียบ</span>
                    </button>
                  </div>

                  {/* CONNECTED SUCCESS BADGE / CARD */}
                  {form.fullName && (form.applicantType === "FACULTY_LECTURER" || form.applicantType === "STAFF_MEMBER") && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl bg-emerald-50/90 border border-emerald-200 p-3 text-xs text-emerald-900 shadow-2xs">
                      <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-bold text-emerald-950 truncate">{form.fullName}</span>
                            <span className="rounded-full bg-emerald-200/70 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                              เชื่อมโยงทำเนียบแล้ว
                            </span>
                          </div>
                          <div className="text-[11px] text-emerald-700 truncate">
                            {form.staffPosition || "-"} · {form.staffDepartment || "-"}
                            {form.studentCode ? ` · รหัสบุคลากร: ${form.studentCode}` : ""}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPersonnelId("");
                          setForm((prev) => ({
                            ...prev,
                            studentCode: "",
                            fullName: "",
                            staffPosition: "",
                            staffDepartment: "",
                            taughtCourses: "",
                          }));
                        }}
                        className="self-end sm:self-center shrink-0 rounded-lg border border-emerald-300 bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100 transition"
                      >
                        ล้าง/เลือกใหม่
                      </button>
                    </div>
                  )}
                </div>

                {/* PERSONNEL DETAILS FIELDS */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4 shadow-2xs">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
                    <div className="sm:col-span-4">
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        รหัสอาจารย์ / รหัสบุคลากร (Staff/Lecturer ID) *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.studentCode}
                        onChange={(e) => setForm((p) => ({ ...p, studentCode: e.target.value }))}
                        placeholder={form.applicantType === "FACULTY_LECTURER" ? "เช่น T69001" : "เช่น STAFF-001"}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2 font-mono text-xs placeholder:text-slate-400"
                      />
                    </div>

                    <div className="sm:col-span-8">
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        ชื่อ-นามสกุล / พระฉายา (Full Name) *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.fullName}
                        onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                        placeholder="เช่น พระครูวินัยธร... หรือ ผศ.ดร...."
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        ตำแหน่งทางวิชาการ / ตำแหน่งงาน (Position) *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.staffPosition}
                        onChange={(e) => setForm((p) => ({ ...p, staffPosition: e.target.value }))}
                        placeholder="เช่น อาจารย์ประจำ, ผู้ช่วยศาสตราจารย์, เจ้าหน้าที่บริหารงานทั่วไป"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                      />
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {[
                          "อาจารย์ประจำ",
                          "อาจารย์พิเศษผู้สอน",
                          "ผู้ช่วยศาสตราจารย์",
                          "รองศาสตราจารย์",
                          "พระวิปัสสนาจารย์",
                          "นักวิชาการศึกษา",
                          "เจ้าหน้าที่บริหารงานทั่วไป",
                        ].map((pos) => (
                          <button
                            key={pos}
                            type="button"
                            onClick={() => setForm((p) => ({ ...p, staffPosition: pos }))}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                          >
                            + {pos}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        สังกัดภาควิชา / ส่วนงาน (Department / Division) *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.staffDepartment}
                        onChange={(e) => setForm((p) => ({ ...p, staffDepartment: e.target.value }))}
                        placeholder="เช่น ภาควิชาพระพุทธศาสนา คณะพุทธศาสตร์"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                      />
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {[
                          "ภาควิชาพระพุทธศาสนา คณะพุทธศาสตร์",
                          "ภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์",
                          "ภาควิชาพระไตรปิฎกศึกษา คณะพุทธศาสตร์",
                          "สำนักงานคณบดี คณะพุทธศาสตร์",
                        ].map((dept) => (
                          <button
                            key={dept}
                            type="button"
                            onClick={() => setForm((p) => ({ ...p, staffDepartment: dept }))}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                          >
                            + {dept.replace(" คณะพุทธศาสตร์", "")}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {form.applicantType === "FACULTY_LECTURER" && (
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        รายวิชาที่รับผิดชอบสอน (Taught Courses — ดึงอัตโนมัติจากฐานข้อมูลตารางเรียน)
                      </label>
                      <input
                        type="text"
                        value={form.taughtCourses}
                        onChange={(e) => setForm((p) => ({ ...p, taughtCourses: e.target.value }))}
                        placeholder="เช่น 000 142 ธรรมะภาคปฏิบัติ 1, 101 201 พระไตรปิฎกวิเคราะห์ (เว้นว่างได้หากรับรองสังกัดทั่วไป)"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        สถานะ / เพศ (Sex)
                      </label>
                      <select
                        value={form.sex}
                        onChange={(e) => setForm((p) => ({ ...p, sex: e.target.value }))}
                        className="w-full min-w-0 max-w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
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
                        placeholder="ไทย หรือ Myanmar"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        อีเมลติดต่อ (Email)
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                        placeholder="lecturer@mcu.ac.th"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        เบอร์โทรศัพท์ (Phone)
                      </label>
                      <input
                        type="text"
                        value={form.phone}
                        onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                        placeholder="081-xxx-xxxx"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ================================================================ */
              /* STUDENT DEDICATED VIEW (LINKED WITH STUDENT DIRECTORY)           */
              /* ================================================================ */
              <div className="space-y-4">
                {/* APPLICANT STATUS SELECTOR (CURRENT STUDENT / NEW STUDENT) */}
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3.5">
                  <div className="mb-2 text-xs font-bold text-slate-800">
                    ประเภทนิสิตผู้ยื่นคำร้อง (Student Status) *
                  </div>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <label
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                        form.applicantType === "CURRENT_STUDENT"
                          ? "border-indigo-600 bg-white ring-2 ring-indigo-600/15 shadow-2xs"
                          : "border-slate-200 bg-white/80 hover:bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="applicantType"
                        value="CURRENT_STUDENT"
                        checked={form.applicantType === "CURRENT_STUDENT"}
                        onChange={() =>
                          setForm((p) => ({
                            ...p,
                            applicantType: "CURRENT_STUDENT",
                            classYear: p.classYear.includes("นิสิตใหม่") ? "" : p.classYear,
                          }))
                        }
                        className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          1. นิสิตปัจจุบัน (Current Enrolled Student)
                        </div>
                        <div className="text-[11px] text-slate-500">
                          มีรหัสนิสิต 10 หลักแล้ว กำลังศึกษาอยู่ในคณะพุทธศาสตร์
                        </div>
                      </div>
                    </label>

                    <label
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                        form.applicantType === "NEW_STUDENT"
                          ? "border-indigo-600 bg-white ring-2 ring-indigo-600/15 shadow-2xs"
                          : "border-slate-200 bg-white/80 hover:bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="applicantType"
                        value="NEW_STUDENT"
                        checked={form.applicantType === "NEW_STUDENT"}
                        onChange={() =>
                          setForm((p) => ({
                            ...p,
                            applicantType: "NEW_STUDENT",
                            classYear: "นิสิตใหม่ / ชั้นปี 1 (New Admitted Student)",
                            requestPurpose: "Letter of Acceptance (หนังสือตอบรับเข้าศึกษา/ขอวีซ่า)",
                            docTemplate: "ENG_CERT",
                            language: "In English language",
                          }))
                        }
                        className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          2. ผู้ผ่านการคัดเลือก / นิสิตใหม่ (New Admitted Student)
                        </div>
                        <div className="text-[11px] text-slate-500">
                          ใช้รหัสชั่วคราว (TEMP-68xxx) / เลขใบสมัคร เพื่อขอวีซ่า Non-ED
                        </div>
                      </div>
                    </label>
                  </div>

                  {form.applicantType === "NEW_STUDENT" && (
                    <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-2.5 text-[11px] text-amber-800 border border-amber-200">
                      <span className="font-bold">💡 คำแนะนำ:</span>
                      <span>
                        สำหรับนิสิตใหม่ต่างประเทศที่ผ่านการคัดเลือกและต้องการหนังสือรับรองการเป็นผู้ผ่านการคัดเลือกเข้าศึกษา (Certificate of Admission)
                        ไปประกอบการยื่นขอวีซ่า Non-Immigrant ED ให้ระบุรหัสชั่วคราว (เช่น TEMP-68001) หรือเลขที่พาสปอร์ตในช่องด้านล่าง
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
                  <div className="sm:col-span-5">
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      {form.applicantType === "NEW_STUDENT"
                        ? "รหัสชั่วคราว / เลขที่ใบสมัคร / พาสปอร์ต (TEMP ID / Passport No.) *"
                        : "รหัสนิสิต 10 หลัก (Student ID) *"}
                    </label>
                    <div className="flex gap-2 w-full min-w-0">
                      <input
                        type="text"
                        required
                        value={form.studentCode}
                        onChange={(e) => setForm((p) => ({ ...p, studentCode: e.target.value }))}
                        placeholder={
                          form.applicantType === "NEW_STUDENT"
                            ? "เช่น TEMP-68001 หรือใส่เลขที่พาสปอร์ต"
                            : "เช่น 6801501121"
                        }
                        className="w-full min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-mono text-xs placeholder:text-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 shadow-2xs"
                      />
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={handleLookupStudent}
                        className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition active:scale-[0.99]"
                      >
                        {isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Search className="h-3.5 w-3.5" />
                        )}
                        <span>ดึงข้อมูลอัตโนมัติ</span>
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
                      placeholder="เช่น SAMKICCA หรือ พระมหา... / Phra..."
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs placeholder:text-slate-400"
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
                      placeholder="เช่น 26"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs placeholder:text-slate-400"
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
                      className="w-full min-w-0 max-w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                    >
                      <option value="">-- เลือกเพศ / สถานะ --</option>
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
                      placeholder="เช่น Myanmar หรือ เมียนมา / ไทย"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs placeholder:text-slate-400"
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
                      placeholder="เช่น Myanmar หรือ Thailand / Vietnam"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs placeholder:text-slate-400"
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
                      placeholder="เช่น student@mcu.ac.th"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: PASSPORT, VISA & ACADEMIC/APPOINTMENT DETAILS */}
          <div className="space-y-4 border-t border-slate-200 pt-6">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Globe className="h-4 w-4 text-indigo-600" />
              {portalMode === "personnel"
                ? "3. วัตถุประสงค์ในการขอหนังสือรับรอง และข้อมูลพาสปอร์ต (Passport & Purpose)"
                : "3. ข้อมูลหนังสือเดินทาง (Passport & Visa) และข้อมูลการศึกษา"}
            </h2>

            {/* Purpose & Certificate Configuration Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  วัตถุประสงค์ในการขอหนังสือ (Purpose) *
                </label>
                <select
                  value={form.requestPurpose}
                  onChange={(e) => setForm((p) => ({ ...p, requestPurpose: e.target.value }))}
                  className="w-full min-w-0 max-w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 truncate"
                >
                  <option value="">-- เลือกวัตถุประสงค์ในการขอหนังสือ --</option>
                  {CERTIFICATE_PURPOSES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {isEn ? p.labelEn : p.labelTh}
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
                  className="w-full min-w-0 max-w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 truncate"
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

            {/* Passport & Visa Row (Optional for Thai, required for visa) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  เลขหนังสือเดินทาง (Passport No.)
                </label>
                <input
                  type="text"
                  value={form.passportNo}
                  onChange={(e) => setForm((p) => ({ ...p, passportNo: e.target.value }))}
                  placeholder="เช่น MJ121085 (คนไทยเว้นว่างได้)"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs placeholder:text-slate-400"
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
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs placeholder:text-slate-400"
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
                  placeholder="เช่น Non-Immigrant Visa"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs placeholder:text-slate-400"
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
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Academic details (Shown only in Student Mode) */}
            {portalMode === "student" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    ชั้นปีที่ศึกษา (Class)
                  </label>
                  <select
                    value={form.classYear}
                    onChange={(e) => setForm((p) => ({ ...p, classYear: e.target.value }))}
                    className="w-full min-w-0 max-w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 truncate"
                  >
                    <option value="">-- เลือกชั้นปีที่ศึกษา --</option>
                    <option value="นิสิตใหม่ / ชั้นปี 1 (New Admitted Student)">
                      นิสิตใหม่ / ชั้นปี 1 (New Admitted Student)
                    </option>
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
                    className="w-full min-w-0 max-w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 truncate"
                  >
                    <option value="">-- เลือกระดับปริญญา --</option>
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
                    placeholder="เช่น ศาสนาและปรัชญา หรือ Buddhist Studies"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs placeholder:text-slate-400"
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
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs placeholder:text-slate-400"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4: ADDRESS IN THAILAND */}
          <div className="space-y-4 border-t border-slate-200 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <MapPin className="h-4 w-4 text-indigo-600" />
                {portalMode === "personnel"
                  ? "4. ที่อยู่สถานที่ปฏิบัติงาน / ที่อยู่ติดต่อ (Official Address)"
                  : "4. ที่อยู่ปัจจุบันในประเทศไทย"}
              </h2>
              {portalMode === "personnel" && (
                <button
                  type="button"
                  onClick={() => {
                    setForm((p) => ({
                      ...p,
                      addressLine: "คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย 79 หมู่ 1",
                      subdistrict: "ลำไทร",
                      district: "วังน้อย",
                      province: "พระนครศรีอยุธยา",
                      postalCode: "13170",
                    }));
                  }}
                  className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 transition"
                >
                  ⚡ ใช้ที่อยู่สำนักงานคณะพุทธศาสตร์ มจร วังน้อย
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  บ้านเลขที่ / วัด / หอพัก (Address)
                </label>
                <input
                  type="text"
                  value={form.addressLine}
                  onChange={(e) => setForm((p) => ({ ...p, addressLine: e.target.value }))}
                  placeholder="เช่น MCU หรือ 79 หมู่ 1 หอพักนิสิต มจร"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs placeholder:text-slate-400"
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
                  placeholder="เช่น lam Sai หรือ ลำไทร"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs placeholder:text-slate-400"
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
                  placeholder="เช่น Wang Noi หรือ วังน้อย"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs placeholder:text-slate-400"
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
                  placeholder="เช่น Wang Noi หรือ พระนครศรีอยุธยา"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs placeholder:text-slate-400"
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
                  placeholder="เช่น 13170"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* SECTION 5: SUPPORTING DOCUMENTS & ATTACHMENTS */}
          <div className="space-y-4 border-t border-slate-200 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Paperclip className="h-4 w-4 text-indigo-600" />
                5. เอกสารหลักฐานประกอบคำร้อง (Supporting Documents)
              </h2>
              <span className="text-[11px] text-slate-500">
                รองรับไฟล์ PDF, JPG, PNG ขนาดไม่เกิน 15MB
              </span>
            </div>

            {form.applicantType === "NEW_STUDENT" && (
              <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/70 p-4">
                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500 text-[10px] font-bold text-white">
                      *
                    </span>
                    สำเนาใบแจ้งผลการคัดเลือก / หนังสือตอบรับเข้าศึกษา (Letter of Admission / Acceptance Proof)
                  </label>
                  <p className="text-[11px] text-amber-800">
                    จำเป็นสำหรับนิสิตใหม่ที่ยังไม่มีรหัสนิสิต เพื่อใช้ตรวจสอบสิทธิ์ในการออกหนังสือรับรองสำหรับขอวีซ่า (Non-ED)
                  </p>
                </div>

                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-amber-500 disabled:opacity-50">
                    {uploadingAdmissionProof ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UploadCloud className="h-4 w-4" />
                    )}
                    <span>{uploadingAdmissionProof ? "กำลังอัปโหลด..." : "อัปโหลดไฟล์หลักฐาน"}</span>
                    <input
                      type="file"
                      accept=".pdf,image/png,image/jpeg,image/webp"
                      className="hidden"
                      disabled={uploadingAdmissionProof}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileUpload(f, "admissionProofUrl");
                      }}
                    />
                  </label>

                  <span className="text-[11px] font-medium text-slate-400">หรือระบุ URL ไฟล์:</span>

                  <input
                    type="text"
                    value={form.admissionProofUrl}
                    onChange={(e) => setForm((p) => ({ ...p, admissionProofUrl: e.target.value }))}
                    placeholder="https://... หรือ /uploads/certificates/..."
                    className="flex-1 rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs placeholder:text-slate-400"
                  />
                </div>

                {form.admissionProofUrl && (
                  <div className="mt-2.5 flex items-center justify-between rounded-xl bg-white px-3 py-2 text-xs border border-amber-200">
                    <span className="truncate font-mono text-[11px] text-amber-900">
                      ไฟล์ที่เลือก: {form.admissionProofUrl}
                    </span>
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, admissionProofUrl: "" }))}
                      className="ml-2 text-xs font-bold text-rose-600 hover:underline"
                    >
                      ลบ
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">
                  สำเนาหนังสือเดินทาง / พาสปอร์ต (Passport Copy)
                </label>
                <p className="text-[11px] text-slate-500">
                  หน้าแรกของหนังสือเดินทางที่มีรูปถ่าย และหน้าวีซ่าปัจจุบัน (ถ้ามี)
                </p>
              </div>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-slate-700 disabled:opacity-50">
                  {uploadingPassportCopy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UploadCloud className="h-4 w-4" />
                  )}
                  <span>{uploadingPassportCopy ? "กำลังอัปโหลด..." : "อัปโหลดสำเนาพาสปอร์ต"}</span>
                  <input
                    type="file"
                    accept=".pdf,image/png,image/jpeg,image/webp"
                    className="hidden"
                    disabled={uploadingPassportCopy}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileUpload(f, "passportCopyUrl");
                    }}
                  />
                </label>

                <span className="text-[11px] font-medium text-slate-400">หรือระบุ URL:</span>

                <input
                  type="text"
                  value={form.passportCopyUrl}
                  onChange={(e) => setForm((p) => ({ ...p, passportCopyUrl: e.target.value }))}
                  placeholder="https://... หรือ /uploads/certificates/..."
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs placeholder:text-slate-400"
                />
              </div>

              {form.passportCopyUrl && (
                <div className="mt-2.5 flex items-center justify-between rounded-xl bg-white px-3 py-2 text-xs border border-slate-200">
                  <span className="truncate font-mono text-[11px] text-slate-700">
                    ไฟล์ที่เลือก: {form.passportCopyUrl}
                  </span>
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, passportCopyUrl: "" }))}
                    className="ml-2 text-xs font-bold text-rose-600 hover:underline"
                  >
                    ลบ
                  </button>
                </div>
              )}
            </div>

            {/* PAYMENT RECEIPT / REGISTRATION PROOF BOX */}
            <div className="rounded-2xl border border-indigo-200/90 bg-linear-to-br from-indigo-50/50 via-white to-slate-50/60 p-4 shadow-2xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <span>สำเนาใบชำระค่าลงทะเบียนเรียน</span>
                    <span className="rounded-md bg-rose-100 text-rose-700 px-2 py-0.5 text-[10px] font-bold">
                      จำเป็น
                    </span>
                  </label>
                  <p className="text-[11px] text-slate-600">
                    ใบลงทะเบียนเรียนในภาคการศึกษาปัจจุบัน เท่านั้น (จำเป็น)
                  </p>
                </div>
                <span className="text-[11px] text-slate-400">
                  แนบไฟล์หลักฐานสลิปโอน / ใบเสร็จรับเงิน
                </span>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label className="inline-flex cursor-pointer shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-700 disabled:opacity-50 active:scale-[0.99]">
                  {uploadingPaymentPdf ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UploadCloud className="h-4 w-4" />
                  )}
                  <span>{uploadingPaymentPdf ? "กำลังอัปโหลด..." : "อัปโหลดสำเนาใบชำระค่าลงทะเบียน"}</span>
                  <input
                    type="file"
                    accept=".pdf,image/png,image/jpeg,image/webp"
                    className="hidden"
                    disabled={uploadingPaymentPdf}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileUpload(f, "paymentPdfUrl");
                    }}
                  />
                </label>

                <span className="text-[11px] font-medium text-slate-400 shrink-0">หรือระบุ URL:</span>

                <input
                  type="text"
                  value={form.paymentPdfUrl}
                  onChange={(e) => setForm((p) => ({ ...p, paymentPdfUrl: e.target.value }))}
                  placeholder="https://... หรือ /uploads/certificates/..."
                  className="w-full min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs placeholder:text-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              {form.paymentPdfUrl && (
                <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="truncate font-mono text-[11px] text-emerald-800">
                      ไฟล์ที่เลือก: {form.paymentPdfUrl}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, paymentPdfUrl: "" }))}
                    className="ml-3 shrink-0 text-xs font-bold text-rose-600 hover:underline"
                  >
                    ลบ
                  </button>
                </div>
              )}
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

          {/* PDPA Compliance & Data Accuracy Notice */}
          <div className="flex items-start gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 text-xs text-slate-600">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
              ✓
            </span>
            <div className="space-y-0.5">
              <span className="font-bold text-slate-800">
                {isEn ? "Personal Data Protection (PDPA):" : "การคุ้มครองข้อมูลส่วนบุคคล (PDPA):"}
              </span>{" "}
              <span>
                {isEn
                  ? "Information regarding gender, nationality, country, and address provided in this request will be securely synchronized to update the Faculty Student Registry for official academic and student affairs purposes."
                  : "ข้อมูลเฉพาะส่วน เพศ สัญชาติ ประเทศ/เชื้อชาติ และที่อยู่ปัจจุบันที่ท่านกรอก จะถูกนำไปปรับปรุงในระบบทะเบียนประวัตินิสิตของคณะพุทธศาสตร์ เพื่อความถูกต้องของระเบียนประวัติและการติดต่อทางการศึกษาตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562"}
              </span>
            </div>
          </div>

          {/* Submit Footer */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6">

            <Link
              href="/portal/certificates"
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {isEn ? "Cancel" : "ยกเลิก"}
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
              {isEn ? "Submit Application" : "ยืนยันการยื่นคำร้องขอหนังสือรับรอง"}
            </button>
          </div>
        </form>
      </div>

      {/* 1. SUBMISSION CONFIRMATION POPUP MODAL (24h PROCESSING NOTICE) */}
      {submittedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-900/10">
            {/* Header */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 px-6 py-8 text-center text-white">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 shadow-inner backdrop-blur-md">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
              <h3 className="mt-4 text-xl font-extrabold sm:text-2xl">
                {isEn ? "Application Submitted Successfully!" : "ยื่นคำร้องขอหนังสือรับรองสำเร็จ!"}
              </h3>
              <p className="mt-1 text-xs text-emerald-100">
                {isEn
                  ? "Your request has been officially recorded in the faculty records system"
                  : "ข้อมูลคำร้องของท่านได้รับการบันทึกเข้าสู่ระบบคณะพุทธศาสตร์เรียบร้อยแล้ว"}
              </p>
            </div>

            {/* Content Body */}
            <div className="space-y-5 p-6 sm:p-7">
              {/* Highlight processing alert box */}
              <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/95 p-4 sm:p-5 text-amber-950 shadow-xs">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
                    <Clock className="h-5 w-5" />
                  </span>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-amber-950 sm:text-base">
                      {isEn ? "Processing Timeline & Progress Tracking" : "การติดตามผลและระยะเวลาดำเนินการ"}
                    </h4>
                    <p className="text-sm font-bold leading-relaxed text-amber-900">
                      {isEn
                        ? "Please monitor the progress of your application through the system. Processing time is at least 24 hours (excluding official public holidays and weekends)."
                        : "ให้ติดตามผลการดำเนินการขอหนังสือรับรองผ่านระบบ หรือระยะเวลาดำเนินการไม่ต่ำกว่า 24 ชั่วโมง (ไม่นับวันหยุดราชการและวันหยุดเสาร์-อาทิตย์)"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Request Summary snippet */}
              <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200/80 py-1.5">
                  <span className="text-slate-500">{isEn ? "Applicant Name:" : "ชื่อ-นามสกุล:"}</span>
                  <span className="font-bold text-slate-900">{submittedResult.fullName}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200/80 py-1.5">
                  <span className="text-slate-500">{isEn ? "Student Code:" : "รหัสนิสิต:"}</span>
                  <span className="font-mono font-bold text-slate-900">{submittedResult.studentCode}</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500">{isEn ? "Document Format:" : "รูปแบบเอกสาร:"}</span>
                  <span className="font-semibold text-indigo-700">
                    {submittedResult.docTemplate === "ENG_CERT"
                      ? "English Certificate (ใช้นอกประเทศ)"
                      : submittedResult.docTemplate === "BANK_LETTER"
                      ? "หนังสือรับรองเปิดบัญชีธนาคาร"
                      : submittedResult.docTemplate === "RESIDENCE_MEMO"
                      ? "บันทึกข้อความรับรองที่อยู่"
                      : "หนังสือรับรองภาษาไทย (ต่อวีซ่า)"}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    router.push("/portal/certificates");
                    router.refresh();
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-md hover:bg-slate-800 transition-colors"
                >
                  <FileCheck2 className="h-4 w-4 text-emerald-400" />
                  <span>{isEn ? "Acknowledge & View My Requests" : "รับทราบ / ไปที่รายการคำร้องของฉัน"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. ADMIN NOTICE EDIT MODAL */}
      {isNoticeEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-900/10">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-100 text-red-700">
                  <Edit3 className="h-4 w-4" />
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  แก้ไขข้อความประกาศสีแดงหน้าคำร้อง (Admin)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNoticeEditOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  ข้อความประกาศภาษาไทย (Thai Notice Banner) *
                </label>
                <textarea
                  rows={3}
                  value={editNoticeTh}
                  onChange={(e) => setEditNoticeTh(e.target.value)}
                  placeholder="*สำหรับการขอต่ออายุวีซ่า ให้ดำเนินการ ก่อนหมดอายุที่ท้ายเล่ม 30 วัน"
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs leading-relaxed focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  ข้อความประกาศภาษาอังกฤษ (English Notice Banner - ถ้ามี)
                </label>
                <textarea
                  rows={2}
                  value={editNoticeEn}
                  onChange={(e) => setEditNoticeEn(e.target.value)}
                  placeholder="*For visa extension requests, please submit your application at least 30 days before your visa/passport expiration date."
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs leading-relaxed focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditNoticeTh("*สำหรับการขอต่ออายุวีซ่า ให้ดำเนินการ ก่อนหมดอายุที่ท้ายเล่ม 30 วัน");
                    setEditNoticeEn(
                      "*For visa extension requests, please submit your application at least 30 days before your visa/passport expiration date."
                    );
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700 underline"
                >
                  คืนค่าเริ่มต้น (Reset Default)
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNoticeEditOpen(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    disabled={isSavingNotice}
                    onClick={handleSaveNotice}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-red-500 disabled:opacity-50"
                  >
                    {isSavingNotice ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    บันทึกประกาศ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

