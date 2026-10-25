"use client";

import { useState, useMemo, useTransition, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  FileSpreadsheet,
  Printer,
  Plus,
  Download,
  Upload,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Globe,
  Settings2,
  Trash2,
  Sparkles,
  UserCheck,
  X,
  AlertTriangle,
  Edit3,
  Users,
} from "lucide-react";
import {
  CERTIFICATE_PURPOSES,
  inferDefaultTemplate,
  type CertificateRequestMetadata,
  type CertificateTemplateType,
} from "@/features/certificates";
import {
  createAdminCertificateRequestAction,
  reviewRequestAction,
  deleteCertificateRequestAction,
  lookupStudentByCodeAction,
  importCertificateRequestsAction,
  updateCertificateNoticeAction,
  syncCertificatesToStudentDirectoryAction,
} from "@/features/certificates/actions";


interface SerializedItem {
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

interface CertTypeItem {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

interface Props {
  initialItems: SerializedItem[];
  certificateTypes: CertTypeItem[];
  initialNotice?: {
    noticeTh: string;
    noticeEn?: string;
  };
}

const TEMPLATE_LABELS: Record<
  CertificateTemplateType,
  { label: string; short: string; color: string; fontBadge: string }
> = {
  THAI_CERT: {
    label: "หนังสือรับรองนิสิต (ภาษาไทย)",
    short: "รับรองไทย (ตม./ทั่วไป)",
    color: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
    fontBadge: "16pt TH",
  },
  ENG_CERT: {
    label: "หนังสือรับรองภาษาอังกฤษ (ใช้นอกประเทศ)",
    short: "English (ใช้นอกประเทศ)",
    color: "bg-sky-50 text-sky-700 ring-sky-600/20",
    fontBadge: "12.5pt EN",
  },
  BANK_LETTER: {
    label: "หนังสือขอความอนุเคราะห์ธนาคาร",
    short: "หนังสือธนาคาร",
    color: "bg-amber-50 text-amber-800 ring-amber-600/20",
    fontBadge: "16pt BANK",
  },
  RESIDENCE_MEMO: {
    label: "บันทึกข้อความ รับรองที่อยู่ (กองกิจการนิสิต)",
    short: "บันทึกข้อความที่อยู่",
    color: "bg-purple-50 text-purple-700 ring-purple-600/20",
    fontBadge: "16pt MEMO",
  },
};

export function RequestsAdminClient({
  initialItems,
  certificateTypes,
  initialNotice,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [templateFilter, setTemplateFilter] = useState<string>("ALL");
  const [toast, setToast] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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


  // New Request Modal State
  const [newForm, setNewForm] = useState<{
    certificateTypeId: string;
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
    email: string;
    fullAddress: string;
    docTemplate: CertificateTemplateType;
    fontSizePt: number;
    docNo: string;
    bankTargetTh: string;
  }>({
    certificateTypeId: certificateTypes[0]?.id || "",
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
    requestPurpose: CERTIFICATE_PURPOSES[0].value,
    language: "In Thai language",
    gpa: "",
    email: "",
    fullAddress:
      "79 หมู่ 1 มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย ต.ลำไทร อ.วังน้อย จ.พระนครศรีอยุธยา 13170",
    docTemplate: "THAI_CERT",
    fontSizePt: 16,
    docNo: "8002 / 710",
    bankTargetTh: "ผู้จัดการธนาคารกรุงไทย สาขาโลตัส นวนคร",
  });

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
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


  const filteredItems = useMemo(() => {
    return initialItems.filter((item) => {
      const m = item.metadata;
      const tpl = m.docTemplate || "THAI_CERT";

      if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
      if (templateFilter !== "ALL" && tpl !== templateFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const hay = [
          m.studentCode,
          m.fullName,
          item.userName,
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
  }, [initialItems, statusFilter, templateFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = initialItems.length;
    const pending = initialItems.filter((i) => i.status === "PENDING").length;
    const approved = initialItems.filter((i) => i.status === "APPROVED").length;
    const engCount = initialItems.filter((i) => i.metadata.docTemplate === "ENG_CERT").length;
    return { total, pending, approved, engCount };
  }, [initialItems]);

  const handleQuickApprove = (id: string) => {
    startTransition(async () => {
      try {
        await reviewRequestAction(id, { status: "APPROVED" });
        notify("อนุมัติคำขอหนังสือรับรองเรียบร้อยแล้ว");
        router.refresh();
      } catch {
        notify("เกิดข้อผิดพลาดในการอนุมัติ");
      }
    });
  };

  const handleQuickReject = (id: string) => {
    startTransition(async () => {
      try {
        await reviewRequestAction(id, { status: "REJECTED", reason: "ข้อมูลไม่ครบถ้วน" });
        notify("ปรับสถานะเป็นไม่อนุมัติเรียบร้อยแล้ว");
        router.refresh();
      } catch {
        notify("เกิดข้อผิดพลาดในการปรับสถานะ");
      }
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`ยืนยันการลบคำขอหนังสือรับรองของ "${name}" หรือไม่?`)) return;
    startTransition(async () => {
      try {
        await deleteCertificateRequestAction(id);
        notify("ลบรายการคำขอเรียบร้อยแล้ว");
        router.refresh();
      } catch {
        notify("เกิดข้อผิดพลาดในการลบรายการ");
      }
    });
  };

  const handleLookupInModal = () => {
    if (!newForm.studentCode.trim()) {
      notify("กรุณากรอกรหัสนิสิตก่อนกดค้นหา");
      return;
    }
    startTransition(async () => {
      const student = await lookupStudentByCodeAction(newForm.studentCode.trim());
      if (!student) {
        notify("ไม่พบรหัสนิสิตในทะเบียนนิสิต สามารถกรอกข้อมูลด้วยตนเองได้");
        return;
      }
      setNewForm((prev) => ({
        ...prev,
        fullName: student.fullName || prev.fullName,
        degreeLevel: student.degreeLevel || prev.degreeLevel,
        major: student.major || prev.major,
        classYear: student.classYear || prev.classYear,
        sex: student.sex || prev.sex,
        email: student.email || prev.email,
      }));
      notify(`ดึงข้อมูลนิสิต ${student.fullName} สำเร็จ`);
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.fullName.trim()) {
      notify("กรุณาระบุชื่อ-ฉายา / นามสกุลของนิสิต");
      return;
    }
    startTransition(async () => {
      try {
        await createAdminCertificateRequestAction({
          certificateTypeId: newForm.certificateTypeId || undefined,
          status: "APPROVED",
          metadata: {
            studentCode: newForm.studentCode,
            fullName: newForm.fullName,
            age: newForm.age,
            sex: newForm.sex,
            nationality: newForm.nationality,
            country: newForm.country,
            passportNo: newForm.passportNo,
            passportExpireDate: newForm.passportExpireDate,
            visaType: newForm.visaType,
            visaExpireDate: newForm.visaExpireDate,
            classYear: newForm.classYear,
            degreeLevel: newForm.degreeLevel,
            major: newForm.major,
            requestPurpose: newForm.requestPurpose,
            language: newForm.language,
            gpa: newForm.gpa,
            email: newForm.email,
            fullAddress: newForm.fullAddress,
            docTemplate: newForm.docTemplate,
            fontSizePt: newForm.fontSizePt,
            lineHeight: 1.85,
            marginTopMm: 24,
            marginSideMm: 25,
            docNo: newForm.docNo,
            bankTargetTh: newForm.bankTargetTh,
            showSignatureGraphic: true,
            showPhotoBox: true,
          },
        });
        setIsCreateOpen(false);
        notify("สร้างคำขอหนังสือรับรองรายการใหม่เรียบร้อยแล้ว");
        router.refresh();
      } catch {
        notify("เกิดข้อผิดพลาดในการสร้างคำขอ");
      }
    });
  };

  // Helper to extract signer and officer details
  const getCertificateSignerAndOfficer = (m: CertificateRequestMetadata) => {
    const isEng = m.language === "In English language" || m.docTemplate === "ENG_CERT";
    const signerName = isEng
      ? m.signerNameEn || m.signerNameTh || "(Asst. Prof. Phrakhru Sirirattanabundit, Ph.D.)"
      : m.signerNameTh || m.signerNameEn || "(พระครูสิริรัตนบัณฑิต, ผศ.ดร.)";
    const signerTitle = isEng
      ? m.signerTitleEn || m.signerTitleTh || "Vice Dean, Faculty of Buddhism"
      : m.signerTitleTh || m.signerTitleEn || "รักษาการแทนรองคณบดีฝ่ายวิชาการ คณะพุทธศาสตร์";
    const officerName = m.officerName || m.coordinatorNameTh || "นายดวงดี โอฐสู";
    const officerPosition = m.officerPosition || "นักวิชาการศึกษา / เจ้าหน้าที่บริการการศึกษา";
    return { signerName, signerTitle, officerName, officerPosition };
  };

  // Export CSV matching original Excel structure with Signer & Officer fields
  const handleExportExcelCsv = () => {
    const headers = [
      "Created At",
      "Email Address",
      "Student ID",
      "Full Name",
      "Age",
      "Sex",
      "Passport No.",
      "Date of Passport Expiration",
      "Type of Visa",
      "Date of Visa Expiration",
      "Class",
      "Degree",
      "Major",
      "Purpose of Request",
      "Language",
      "GPA",
      "Nationality",
      "Country",
      "Address",
      "Template Type",
      "Font Size (pt)",
      "Document No.",
      "Status",
      "Signer Name (ชื่อผู้ลงนาม)",
      "Signer Title (ตำแหน่งผู้ลงนาม)",
      "Officer Name (ชื่อเจ้าหน้าที่ผู้ออกเอกสาร/พิมพ์)",
      "Officer Position (ตำแหน่งเจ้าหน้าที่ผู้ออกเอกสาร/พิมพ์)",
    ];

    const escapeCsv = (val: string | number | undefined | null) => {
      const s = String(val ?? "").replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = filteredItems.map((item) => {
      const m = item.metadata;
      const { signerName, signerTitle, officerName, officerPosition } = getCertificateSignerAndOfficer(m);

      return [
        item.createdAt,
        m.email || item.userEmail,
        m.studentCode,
        m.fullName || item.userName,
        m.age,
        m.sex,
        m.passportNo,
        m.passportExpireDate,
        m.visaType,
        m.visaExpireDate,
        m.classYear,
        m.degreeLevel,
        m.major,
        m.requestPurpose,
        m.language,
        m.gpa,
        m.nationality,
        m.country,
        m.fullAddress,
        m.docTemplate,
        m.fontSizePt,
        m.docNo,
        item.status,
        signerName,
        signerTitle,
        officerName,
        officerPosition,
      ]
        .map(escapeCsv)
        .join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mcu_certificates_requests_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify(`ส่งออกไฟล์ CSV จำนวน ${filteredItems.length} รายการเรียบร้อยแล้ว`);
  };

  // Export Excel (.xls HTML table format)
  const handleExportExcelXml = () => {
    const headers = [
      "ลำดับ",
      "วันที่ยื่นคำขอ",
      "รหัสนิสิต",
      "ชื่อ-สกุล",
      "อีเมล",
      "ระดับการศึกษา",
      "สาขาวิชา",
      "ชั้นปี",
      "วัตถุประสงค์",
      "ภาษา",
      "เลขที่เอกสาร",
      "รูปแบบเอกสาร",
      "สถานะคำขอ",
      "ชื่อผู้ลงนาม",
      "ตำแหน่งผู้ลงนาม",
      "ชื่อเจ้าหน้าที่ผู้ออกเอกสาร",
      "ตำแหน่งเจ้าหน้าที่",
    ];

    const escapeXml = (val: string | number | undefined | null) =>
      String(val ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const rowsHtml = filteredItems
      .map((item, idx) => {
        const m = item.metadata;
        const { signerName, signerTitle, officerName, officerPosition } = getCertificateSignerAndOfficer(m);

        const statusTh =
          item.status === "APPROVED"
            ? "อนุมัติแล้ว"
            : item.status === "PENDING"
            ? "รออนุมัติ"
            : item.status === "REJECTED"
            ? "ไม่อนุมัติ"
            : "ยกเลิก";

        return `<tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td style="text-align:center;">${escapeXml(new Date(item.createdAt).toLocaleDateString("th-TH"))}</td>
          <td style="text-align:center; font-family:monospace;">${escapeXml(m.studentCode)}</td>
          <td><b>${escapeXml(m.fullName || item.userName)}</b></td>
          <td>${escapeXml(m.email || item.userEmail)}</td>
          <td>${escapeXml(m.degreeLevel)}</td>
          <td>${escapeXml(m.major)}</td>
          <td>${escapeXml(m.classYear)}</td>
          <td>${escapeXml(m.requestPurpose)}</td>
          <td style="text-align:center;">${escapeXml(m.language)}</td>
          <td style="text-align:center; font-family:monospace;">${escapeXml(m.docNo || "-")}</td>
          <td style="text-align:center;">${escapeXml(m.docTemplate || "-")}</td>
          <td style="text-align:center;">${escapeXml(statusTh)}</td>
          <td><b>${escapeXml(signerName)}</b></td>
          <td>${escapeXml(signerTitle)}</td>
          <td><b>${escapeXml(officerName)}</b></td>
          <td>${escapeXml(officerPosition)}</td>
        </tr>`;
      })
      .join("\n");

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <style>
          table { border-collapse: collapse; width: 100%; font-family: 'Sarabun', 'Segoe UI', Tahoma, sans-serif; font-size: 13px; }
          th { background-color: #047857; color: #ffffff; border: 1px solid #065f46; padding: 10px 8px; font-weight: bold; }
          td { border: 1px solid #cbd5e1; padding: 6px 8px; vertical-align: middle; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .title-banner { font-size: 16px; font-weight: bold; color: #065f46; margin-bottom: 12px; }
        </style>
      </head>
      <body>
        <div class="title-banner">รายงานคำร้องขอหนังสือรับรอง คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย</div>
        <table border="1">
          <thead>
            <tr>${headers.map((h) => `<th>${escapeXml(h)}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelHtml], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mcu_certificates_report_${new Date().toISOString().slice(0, 10)}.xls`;
    a.click();
    URL.revokeObjectURL(url);
    notify(`ส่งออกไฟล์ Excel (.xls) จำนวน ${filteredItems.length} รายการเรียบร้อยแล้ว`);
  };

  // Import CSV from Excel
  const handleImportCsvFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      notify("ไม่พบข้อมูลในไฟล์ CSV");
      return;
    }

    const parseCsvLine = (line: string): string[] => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (ch === "," && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += ch;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
    const findIdx = (keywords: string[]) =>
      headers.findIndex((h) => keywords.some((k) => h.includes(k)));

    const idxCode = findIdx(["student id", "รหัสนิสิต"]);
    const idxName = findIdx(["full name", "name", "ชื่อ"]);
    const idxAge = findIdx(["age", "อายุ"]);
    const idxSex = findIdx(["sex", "เพศ"]);
    const idxPassport = findIdx(["passport no", "เลขหนังสือเดินทาง"]);
    const idxPassExp = findIdx(["passport expiration", "วันหมดอายุพาสปอร์ต"]);
    const idxVisa = findIdx(["type of visa", "ประเภทวีซ่า"]);
    const idxVisaExp = findIdx(["visa expiration", "วันหมดอายุวีซ่า"]);
    const idxClass = findIdx(["class", "ชั้นปี"]);
    const idxDegree = findIdx(["degree", "ระดับ"]);
    const idxMajor = findIdx(["major", "สาขา"]);
    const idxPurpose = findIdx(["purpose", "วัตถุประสงค์"]);
    const idxLang = findIdx(["language", "ภาษา"]);
    const idxGpa = findIdx(["gpa", "เกรด"]);
    const idxNat = findIdx(["nationality", "สัญชาติ"]);
    const idxCountry = findIdx(["country", "ประเทศ"]);
    const idxAddr = findIdx(["address", "ที่อยู่"]);
    const idxEmail = findIdx(["email", "อีเมล"]);
    const idxSignerName = findIdx(["signer name", "ชื่อผู้ลงนาม"]);
    const idxSignerTitle = findIdx(["signer title", "ตำแหน่งผู้ลงนาม"]);
    const idxOfficerName = findIdx(["officer name", "ชื่อเจ้าหน้าที่"]);
    const idxOfficerPos = findIdx(["officer position", "ตำแหน่งเจ้าหน้าที่"]);

    const records: Partial<CertificateRequestMetadata>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      const fullName = idxName >= 0 ? cols[idxName] : cols[3] || "";
      const studentCode = idxCode >= 0 ? cols[idxCode] : cols[2] || "";
      if (!fullName && !studentCode) continue;

      const purpose = idxPurpose >= 0 ? cols[idxPurpose] : CERTIFICATE_PURPOSES[0].value;
      const rawLang = idxLang >= 0 ? cols[idxLang] : "In Thai language";
      const lang: "In Thai language" | "In English language" = rawLang
        .toLowerCase()
        .includes("english")
        ? "In English language"
        : "In Thai language";
      const tpl = inferDefaultTemplate({ requestPurpose: purpose, language: lang });

      records.push({
        studentCode,
        fullName,
        age: idxAge >= 0 ? cols[idxAge] : "",
        sex: idxSex >= 0 ? cols[idxSex] : "M",
        passportNo: idxPassport >= 0 ? cols[idxPassport] : "",
        passportExpireDate: idxPassExp >= 0 ? cols[idxPassExp] : "",
        visaType: idxVisa >= 0 ? cols[idxVisa] : "Non-Immigrant Visa",
        visaExpireDate: idxVisaExp >= 0 ? cols[idxVisaExp] : "",
        classYear: idxClass >= 0 ? cols[idxClass] : "ปีที่ 1 (First year)",
        degreeLevel: idxDegree >= 0 ? cols[idxDegree] : "ป.ตรี (B.A. English Program)",
        major: idxMajor >= 0 ? cols[idxMajor] : "Buddhist Studies",
        requestPurpose: purpose,
        language: lang,
        gpa: idxGpa >= 0 ? cols[idxGpa] : "",
        nationality: idxNat >= 0 ? cols[idxNat] : "เมียนมา",
        country: idxCountry >= 0 ? cols[idxCountry] : "Myanmar",
        fullAddress: idxAddr >= 0 ? cols[idxAddr] : "",
        email: idxEmail >= 0 ? cols[idxEmail] : "",
        docTemplate: tpl,
        fontSizePt: tpl === "ENG_CERT" ? 12.5 : 16,
        signerNameTh: idxSignerName >= 0 && cols[idxSignerName] ? cols[idxSignerName] : undefined,
        signerTitleTh: idxSignerTitle >= 0 && cols[idxSignerTitle] ? cols[idxSignerTitle] : undefined,
        officerName: idxOfficerName >= 0 && cols[idxOfficerName] ? cols[idxOfficerName] : undefined,
        officerPosition: idxOfficerPos >= 0 && cols[idxOfficerPos] ? cols[idxOfficerPos] : undefined,
      });
    }

    if (records.length === 0) {
      notify("ไม่พบแถวข้อมูลที่ถูกต้องในไฟล์ CSV");
      return;
    }

    startTransition(async () => {
      try {
        const res = await importCertificateRequestsAction(records);
        if (fileInputRef.current) fileInputRef.current.value = "";
        notify(
          `นำเข้าข้อมูลสำเร็จ (สร้างใหม่ ${res.createdCount} รายการ, อัปเดต ${res.updatedCount} รายการ)`
        );
        router.refresh();
      } catch {
        notify("เกิดข้อผิดพลาดในการนำเข้าไฟล์ CSV");
      }
    });
  };

  return (
    <div className="space-y-6 p-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <FileText className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                ระบบบริหารและออกหนังสือรับรองนิสิต (Certificates & Official Letters)
              </h1>
              <p className="text-xs text-slate-500">
                รองรับข้อมูลนิสิตจากไฟล์ Excel • หนังสือรับรองภาษาไทย (16pt) • ภาษาอังกฤษใช้นอกประเทศ (12.5pt) • หนังสือธนาคาร และบันทึกข้อความที่อยู่
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setEditNoticeTh(notice.noticeTh);
              setEditNoticeEn(notice.noticeEn || "");
              setIsNoticeEditOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
          >
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            แก้ไขประกาศหน้าคำร้อง
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                try {
                  const res = await syncCertificatesToStudentDirectoryAction();
                  notify(
                    `ซิงค์ข้อมูลนิสิต (เพศ, สัญชาติ, เชื้อชาติ/ประเทศ, ที่อยู่) เข้าสู่ทะเบียนนิสิตเรียบร้อยแล้ว (${res.syncedCount} รายการ)`
                  );
                } catch {
                  notify("เกิดข้อผิดพลาดในการซิงค์ข้อมูลสู่ทะเบียนนิสิต");
                }
              });
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
            title="ดึงข้อมูลเพศ สัญชาติ เชื้อชาติ/ประเทศ และที่อยู่ เข้าสู่ทะเบียนประวัตินิสิต"
          >
            <Users className="h-4 w-4 text-blue-600" />
            ซิงค์ประวัติสู่ทะเบียนนิสิต
          </button>

          <Link
            href="/certificates/types"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Settings2 className="h-4 w-4 text-slate-500" />
            ประเภทหนังสือรับรอง
          </Link>



          <button
            type="button"
            onClick={handleExportExcelXml}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition"
            title="ส่งออกรายงานเป็นไฟล์ Excel (.xls) พร้อมจัดรูปแบบตารางและสีสันสวยงาม"
          >
            <FileSpreadsheet className="h-4 w-4" />
            ส่งออก Excel (.xls)
          </button>

          <button
            type="button"
            onClick={handleExportExcelCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition"
            title="ส่งออกไฟล์ข้อมูล CSV (UTF-8 BOM) รองรับภาษาไทยบน Excel"
          >
            <Download className="h-4 w-4" />
            ส่งออก CSV (.csv)
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleImportCsvFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
          >
            <Upload className="h-4 w-4" />
            นำเข้าไฟล์ CSV (Excel)
          </button>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800"
          >
            <Plus className="h-4 w-4 text-amber-400" />
            สร้างคำขอ / ออกหนังสือรับรองใหม่
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">คำขอหนังสือทั้งหมด</span>
            <span className="rounded-lg bg-slate-100 p-2 text-slate-700">
              <FileText className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{stats.total} รายการ</div>
          <p className="mt-1 text-[11px] text-slate-500">รวมข้อมูลนิสิตจากไฟล์ Excel ต้นฉบับ</p>
        </div>

        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">รอดำเนินการ / รออนุมัติ</span>
            <span className="rounded-lg bg-amber-100 p-2 text-amber-700">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-900">{stats.pending} รายการ</div>
          <p className="mt-1 text-[11px] text-amber-700/80">คลิกปุ่มออกหนังสือเพื่อตรวจสอบและพิมพ์</p>
        </div>

        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">อนุมัติแล้ว / พร้อมพิมพ์</span>
            <span className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-900">{stats.approved} รายการ</div>
          <p className="mt-1 text-[11px] text-emerald-700/80">พร้อมส่งออก PDF ขนาด A4 มาตรฐาน</p>
        </div>

        <div className="rounded-2xl border border-sky-200/80 bg-sky-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-800">หนังสือภาษาอังกฤษ (ใช้นอกประเทศ)</span>
            <span className="rounded-lg bg-sky-100 p-2 text-sky-700">
              <Globe className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-sky-900">{stats.engCount} รายการ</div>
          <p className="mt-1 text-[11px] text-sky-700/80">
            ไทย {stats.total - stats.engCount} รายการ • อังกฤษ {stats.engCount} รายการ
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหารหัสนิสิต, ชื่อ-ฉายา, เลขหนังสือเดินทาง (Passport), สัญชาติ, สาขาวิชา..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 pl-10 pr-4 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={templateFilter}
            onChange={(e) => setTemplateFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
          >
            <option value="ALL">ทุกแบบฟอร์มหนังสือ (4 แบบ)</option>
            <option value="THAI_CERT">1. หนังสือรับรองนิสิต (ภาษาไทย)</option>
            <option value="ENG_CERT">2. หนังสือรับรองภาษาอังกฤษ (ใช้นอกประเทศ)</option>
            <option value="BANK_LETTER">3. หนังสือขอความอนุเคราะห์ธนาคาร</option>
            <option value="RESIDENCE_MEMO">4. บันทึกข้อความ รับรองที่อยู่</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
          >
            <option value="ALL">ทุกสถานะคำขอ</option>
            <option value="PENDING">รออนุมัติ (PENDING)</option>
            <option value="APPROVED">อนุมัติแล้ว (APPROVED)</option>
            <option value="REJECTED">ไม่อนุมัติ (REJECTED)</option>
          </select>
        </div>
      </div>

      {/* Main Requests Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th className="px-4 py-3.5">รหัสนิสิต / ชื่อ-ฉายา</th>
                <th className="px-4 py-3.5">สัญชาติ / Passport & วีซ่า</th>
                <th className="px-4 py-3.5">ระดับ / สาขาวิชา / ชั้นปี</th>
                <th className="px-4 py-3.5">วัตถุประสงค์ / ภาษา</th>
                <th className="px-4 py-3.5">แบบฟอร์ม PDF & ขนาดฟอนต์</th>
                <th className="px-4 py-3.5">สถานะ</th>
                <th className="px-4 py-3.5 text-right">การจัดการ / พิมพ์ PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => {
                const m = item.metadata;
                const tpl = (m.docTemplate || "THAI_CERT") as CertificateTemplateType;
                const tplInfo = TEMPLATE_LABELS[tpl] || TEMPLATE_LABELS.THAI_CERT;
                const fontSize = m.fontSizePt || (tpl === "ENG_CERT" ? 12.5 : 16);

                return (
                  <tr key={item.id} className="transition hover:bg-slate-50/80">
                    {/* Student Code & Name */}
                    <td className="px-4 py-3.5 align-top">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-slate-800">
                          {m.studentCode || "-"}
                        </span>
                        {m.sex && (
                          <span className="text-[10px] font-medium text-slate-500">({m.sex})</span>
                        )}
                      </div>
                      <div className="mt-1 font-bold text-slate-900">
                        {m.fullName || item.userName}
                      </div>
                      {m.docNo && (
                        <div className="mt-0.5 text-[11px] text-slate-500">
                          เลขที่: <span className="font-medium text-slate-700">{m.docNo}</span>
                        </div>
                      )}
                    </td>

                    {/* Nationality & Passport */}
                    <td className="px-4 py-3.5 align-top">
                      <div className="font-semibold text-slate-800">
                        {m.nationality || "-"}{" "}
                        {m.country ? (
                          <span className="font-normal text-slate-500">({m.country})</span>
                        ) : null}
                      </div>
                      {m.passportNo ? (
                        <div className="mt-0.5 font-mono text-[11px] text-slate-700">
                          Passport: <span className="font-semibold">{m.passportNo}</span>
                        </div>
                      ) : (
                        <div className="mt-0.5 text-[11px] text-slate-400">นิสิตไทย (ไม่มี Passport)</div>
                      )}
                      {m.visaType && (
                        <div className="mt-0.5 text-[11px] text-slate-500">
                          Visa: {m.visaType} {m.visaExpireDate ? `(ถึง ${m.visaExpireDate})` : ""}
                        </div>
                      )}
                    </td>

                    {/* Academic Info */}
                    <td className="px-4 py-3.5 align-top">
                      <div className="font-semibold text-slate-800">{m.major || "-"}</div>
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        {m.degreeLevel || "-"} • {m.classYear || "-"}
                      </div>
                      {m.gpa && (
                        <div className="mt-0.5 text-[11px] font-medium text-emerald-700">
                          GPA: {m.gpa}
                        </div>
                      )}
                    </td>

                    {/* Purpose & Language */}
                    <td className="px-4 py-3.5 align-top">
                      <div className="font-semibold text-slate-800">
                        {m.requestPurpose || item.typeName}
                      </div>
                      <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                        <Globe className="h-3 w-3 text-indigo-600" />
                        {m.language || (tpl === "ENG_CERT" ? "In English language" : "In Thai language")}
                      </div>
                    </td>

                    {/* Template & Font Size */}
                    <td className="px-4 py-3.5 align-top">
                      <span
                        className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-bold ring-1 ${tplInfo.color}`}
                      >
                        {tplInfo.short}
                      </span>
                      <div className="mt-1 text-[11px] text-slate-500">
                        ขนาดอักษร:{" "}
                        <span className="font-mono font-bold text-slate-800">{fontSize} pt</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 align-top">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          item.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                            : item.status === "REJECTED"
                              ? "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20"
                              : "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
                        }`}
                      >
                        {item.status === "APPROVED"
                          ? "อนุมัติแล้ว"
                          : item.status === "REJECTED"
                            ? "ไม่อนุมัติ"
                            : "รออนุมัติ"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 align-top text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/certificates/${item.id}`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-500"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          ออกหนังสือ / ปรับฟอนต์ PDF
                        </Link>

                        <Link
                          href={`/portal/certificates/verify/${item.id}`}
                          target="_blank"
                          title="เปิดหน้าตรวจสอบสถานะสำหรับ ตม. หรือสั่งพิมพ์ใบสรุปการตรวจสอบ"
                          className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span>ใบตรวจสอบ ตม. ↗</span>
                        </Link>

                        {item.status === "PENDING" && (
                          <>
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleQuickApprove(item.id)}
                              title="อนุมัติทันที"
                              className="rounded-xl border border-emerald-200 bg-emerald-50 p-1.5 text-emerald-700 hover:bg-emerald-100"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleQuickReject(item.id)}
                              title="ไม่อนุมัติ"
                              className="rounded-xl border border-rose-200 bg-rose-50 p-1.5 text-rose-700 hover:bg-rose-100"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleDelete(item.id, m.fullName || item.userName)}
                          title="ลบคำขอ"
                          className="rounded-xl border border-slate-200 bg-white p-1.5 text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500">
                    ไม่พบรายการคำขอหนังสือรับรองที่ตรงกับเงื่อนไขการค้นหา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE NEW CERTIFICATE REQUEST MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  สร้างคำขอและออกหนังสือรับรองนิสิตใหม่
                </h2>
                <p className="text-xs text-slate-500">
                  สามารถค้นหาข้อมูลอัตโนมัติจากรหัสนิสิต หรือกรอกข้อมูลตามคอลัมน์ Excel
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-5 p-6">
              {/* Template & Font Size Selection */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                <label className="mb-2 block text-xs font-bold text-indigo-950">
                  เลือกแบบฟอร์มหนังสือรับรองและขนาดตัวอักษรเริ่มต้น
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <span className="mb-1 block text-[11px] font-semibold text-slate-700">
                      แบบฟอร์มหนังสือ (PDF Template)
                    </span>
                    <select
                      value={newForm.docTemplate}
                      onChange={(e) => {
                        const tpl = e.target.value as CertificateTemplateType;
                        setNewForm((prev) => ({
                          ...prev,
                          docTemplate: tpl,
                          docNo: tpl === "RESIDENCE_MEMO" ? "" : prev.docNo,
                          fontSizePt: tpl === "ENG_CERT" ? 12.5 : 16,
                          language:
                            tpl === "ENG_CERT" ? "In English language" : "In Thai language",
                        }));
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900"
                    >
                      <option value="THAI_CERT">
                        1. หนังสือรับรองนิสิต (ภาษาไทย - ต้นฉบับ 16pt)
                      </option>
                      <option value="ENG_CERT">
                        2. หนังสือรับรองภาษาอังกฤษ (ใช้นอกประเทศ - ต้นฉบับ 12.5pt)
                      </option>
                      <option value="BANK_LETTER">
                        3. หนังสือขอความอนุเคราะห์ธนาคาร (16pt)
                      </option>
                      <option value="RESIDENCE_MEMO">
                        4. บันทึกข้อความ รับรองที่อยู่ (กองกิจการนิสิต - 16pt)
                      </option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="mb-1 block text-[11px] font-semibold text-slate-700">
                        ขนาดอักษร (pt)
                      </span>
                      <input
                        type="number"
                        step="0.5"
                        min={10}
                        max={26}
                        value={newForm.fontSizePt}
                        onChange={(e) =>
                          setNewForm((prev) => ({
                            ...prev,
                            fontSizePt: parseFloat(e.target.value || "16"),
                          }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-bold text-indigo-700"
                      />
                    </div>
                    <div>
                      <span className="mb-1 block text-[11px] font-semibold text-slate-700">
                        {newForm.docTemplate === "RESIDENCE_MEMO"
                          ? "เลขที่บันทึกข้อความ (กรอกเลขเอง)"
                          : "เลขที่หนังสือรับรอง (รันเลขอัตโนมัติ)"}
                      </span>
                      <input
                        type="text"
                        value={newForm.docNo}
                        onChange={(e) =>
                          setNewForm((prev) => ({ ...prev, docNo: e.target.value }))
                        }
                        placeholder={
                          newForm.docTemplate === "RESIDENCE_MEMO"
                            ? "กรอกเลขเอง เช่น ๘๐๐๒/ ว ๐๗๓"
                            : "เช่น 8002 / 716"
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono"
                      />
                    </div>
                  </div>

                </div>
              </div>

              {/* Student Lookup Row */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                <div className="sm:col-span-4">
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    รหัสนิสิต (Student ID)
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={newForm.studentCode}
                      onChange={(e) =>
                        setNewForm((prev) => ({ ...prev, studentCode: e.target.value }))
                      }
                      placeholder="เช่น 6801203032"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleLookupInModal}
                      className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      ค้นหา
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
                    value={newForm.fullName}
                    onChange={(e) =>
                      setNewForm((prev) => ({ ...prev, fullName: e.target.value }))
                    }
                    placeholder="เช่น PHRA HTET AUNG หรือ พระมหา..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    เพศ / สถานะ (Sex)
                  </label>
                  <select
                    value={newForm.sex}
                    onChange={(e) => setNewForm((prev) => ({ ...prev, sex: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  >
                    <option value="M">M (พระภิกษุ / สามเณร / ชาย)</option>
                    <option value="F">F (แม่ชี / ภิกษุณี / หญิง)</option>
                  </select>
                </div>
              </div>

              {/* Nationality, Passport, Visa */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    สัญชาติ (Nationality)
                  </label>
                  <input
                    type="text"
                    value={newForm.nationality}
                    onChange={(e) =>
                      setNewForm((prev) => ({ ...prev, nationality: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    ประเทศ (Country)
                  </label>
                  <input
                    type="text"
                    value={newForm.country}
                    onChange={(e) =>
                      setNewForm((prev) => ({ ...prev, country: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    เลขที่ Passport
                  </label>
                  <input
                    type="text"
                    value={newForm.passportNo}
                    onChange={(e) =>
                      setNewForm((prev) => ({ ...prev, passportNo: e.target.value }))
                    }
                    placeholder="เช่น ME242855"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    ประเภทวีซ่า
                  </label>
                  <input
                    type="text"
                    value={newForm.visaType}
                    onChange={(e) =>
                      setNewForm((prev) => ({ ...prev, visaType: e.target.value }))
                    }
                    placeholder="Non-Immigrant Visa"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>
              </div>

              {/* Class, Degree, Major, Purpose */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    ระดับการศึกษา (Degree)
                  </label>
                  <input
                    type="text"
                    value={newForm.degreeLevel}
                    onChange={(e) =>
                      setNewForm((prev) => ({ ...prev, degreeLevel: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    สาขาวิชา (Major)
                  </label>
                  <input
                    type="text"
                    value={newForm.major}
                    onChange={(e) => setNewForm((prev) => ({ ...prev, major: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    วัตถุประสงค์การขอหนังสือ
                  </label>
                  <select
                    value={newForm.requestPurpose}
                    onChange={(e) =>
                      setNewForm((prev) => ({ ...prev, requestPurpose: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  >
                    {CERTIFICATE_PURPOSES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.labelTh}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  ที่อยู่ปัจจุบันในไทย (Address)
                </label>
                <input
                  type="text"
                  value={newForm.fullAddress}
                  onChange={(e) =>
                    setNewForm((prev) => ({ ...prev, fullAddress: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 disabled:opacity-50"
                >
                  บันทึกและสร้างรายการคำขอ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN NOTICE EDIT MODAL */}
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
                    {isSavingNotice ? <span className="h-3.5 w-3.5 animate-spin">⏳</span> : null}
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

