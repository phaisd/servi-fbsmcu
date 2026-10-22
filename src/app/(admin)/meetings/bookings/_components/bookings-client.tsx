"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Printer,
  Edit3,
  Trash2,
  X,
  Loader2,
  Sparkles,
  FileText,
  MapPin,
  Check,
  Building2,
  ChevronRight,
  PenTool,
  RotateCcw,
  Save,
  UserCheck,
  UserPlus,
  FileSpreadsheet,
  Download,
  ZoomIn,
  ZoomOut,
  CalendarDays,
} from "lucide-react";
import type { MeetingBooking, MeetingRoom, User, BookingStatus } from "@/generated/prisma";
import {
  MeetingBookingA4Document,
  parseBookingRemark,
  type MeetingBookingMetadata,
  type MeetingFormSettings,
} from "@/features/meetings";
import {
  reviewOfficialBookingAction,
  approveOrRejectOfficialBookingAction,
  updateOfficialBookingApproverAction,
  saveExecutivePersonnelAction,
  deleteMeetingBookingAction,
} from "@/features/meetings/actions";

type BookingWithRelations = MeetingBooking & { room: MeetingRoom; requester: User };

export interface PersonnelItem {
  id: string;
  fullNameTh: string;
  positionTh: string;
  type?: string;
  departmentNameTh: string;
  email: string;
  phoneNumber: string;
}

interface Props {
  initialItems: BookingWithRelations[];
  personnelList?: PersonnelItem[];
  formSettings?: MeetingFormSettings | null;
}

const APPROVER_POSITION_PRESETS = [
  {
    label: "เลขานุการสำนักงานคณบดี",
    name: "พระครูปลัดสมเกียรติ กิตฺติญาโณ",
    position: "เลขานุการสำนักงานคณบดีคณะพุทธศาสตร์",
  },
  {
    label: "ปฏิบัติหน้าที่แทนเลขานุการฯ",
    name: "",
    position: "ปฏิบัติหน้าที่แทนเลขานุการสำนักงานคณบดีคณะพุทธศาสตร์",
  },
  {
    label: "รักษาการแทนเลขานุการฯ",
    name: "",
    position: "รักษาการแทนเลขานุการสำนักงานคณบดีคณะพุทธศาสตร์",
  },
  {
    label: "รองคณบดี ปฏิบัติหน้าที่แทน",
    name: "",
    position: "รองคณบดีฝ่ายบริหาร ปฏิบัติหน้าที่แทนคณบดีคณะพุทธศาสตร์",
  },
  {
    label: "คณบดีคณะพุทธศาสตร์",
    name: "",
    position: "คณบดีคณะพุทธศาสตร์",
  },
];

export function BookingsClient({ initialItems, personnelList = [], formSettings }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<BookingWithRelations[]>(initialItems);
  const [personnel, setPersonnel] = useState<PersonnelItem[]>(personnelList);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modals state
  const [previewBooking, setPreviewBooking] = useState<BookingWithRelations | null>(null);
  const [previewApproverName, setPreviewApproverName] = useState("พระครูปลัดสมเกียรติ กิตฺติญาโณ");
  const [previewApproverPosition, setPreviewApproverPosition] = useState("เลขานุการสำนักงานคณบดีคณะพุทธศาสตร์");
  const [showPreviewCustomizer, setShowPreviewCustomizer] = useState(false);
  const [previewZoom, setPreviewZoom] = useState<number>(0.85); // Default 85% so full A4 fits nicely
  const [isSavingApprover, setIsSavingApprover] = useState(false);

  const [reviewBooking, setReviewBooking] = useState<BookingWithRelations | null>(null);
  const [approvalBooking, setApprovalBooking] = useState<BookingWithRelations | null>(null);

  // Buddhist Year calculation & state
  const getBuddhistYear = (d: Date | string) => {
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return new Date().getFullYear() + 543;
      return dt.getFullYear() + 543;
    } catch {
      return new Date().getFullYear() + 543;
    }
  };

  const currentBYear = new Date().getFullYear() + 543;

  const availableYears = useMemo(() => {
    const set = new Set<number>();
    set.add(currentBYear);
    for (const item of items) {
      set.add(getBuddhistYear(item.startTime));
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [items, currentBYear]);

  const [selectedYear, setSelectedYear] = useState<number | "ALL">("ALL");

  // Review form state (Officer)
  const [officerNote, setOfficerNote] = useState("");
  const [isRoomAvailable, setIsRoomAvailable] = useState<boolean>(true);
  const [officerSignName, setOfficerSignName] = useState("เจ้าหน้าที่ดูแลห้องประชุม");

  // Approval form state (Secretary to Dean Office)
  const [approvalDecision, setApprovalDecision] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [approverSignName, setApproverSignName] = useState("พระครูปลัดสมเกียรติ กิตฺติญาโณ");
  const [approverPosition, setApproverPosition] = useState("เลขานุการสำนักงานคณบดีคณะพุทธศาสตร์");
  const [approvalNote, setApprovalNote] = useState("");
  const [saveAsExecutive, setSaveAsExecutive] = useState(false);
  const [isSavingNewExecutive, setIsSavingNewExecutive] = useState(false);

  // Group personnel into Executives vs Faculty & Staff
  const executives = personnel.filter(
    (p) => p.type === "EXECUTIVE" || p.positionTh?.includes("คณบดี") || p.positionTh?.includes("เลขา")
  );
  const academicsAndStaff = personnel.filter((p) => !executives.some((e) => e.id === p.id));

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Quick save new executive into Personnel directory
  const handleQuickSaveExecutive = async (name: string, position: string) => {
    if (!name.trim()) {
      notify("กรุณาระบุชื่อผู้อนุมัติก่อนบันทึกเข้าทำเนียบ");
      return;
    }
    setIsSavingNewExecutive(true);
    try {
      const res = await saveExecutivePersonnelAction({
        fullNameTh: name.trim(),
        positionTh: position.trim() || "ผู้บริหาร คณะพุทธศาสตร์",
      });
      setPersonnel((prev) => {
        const idx = prev.findIndex((p) => p.id === res.id || p.fullNameTh === res.fullNameTh);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = res;
          return updated;
        }
        return [res, ...prev];
      });
      notify(`บันทึก "${res.fullNameTh}" เข้าสู่ทำเนียบคณะผู้บริหารเรียบร้อยแล้ว`);
    } catch (err: unknown) {
      notify((err instanceof Error ? err.message : String(err)) || "เกิดข้อผิดพลาดในการบันทึกข้อมูลผู้บริหาร");
    } finally {
      setIsSavingNewExecutive(false);
    }
  };

  // Open Preview Modal with live customizer
  const handleOpenPreview = (b: BookingWithRelations) => {
    const meta = parseBookingRemark(b.remark);
    setPreviewBooking(b);
    setPreviewApproverName(meta.approverSignName || "พระครูปลัดสมเกียรติ กิตฺติญาโณ");
    setPreviewApproverPosition(meta.approverPosition || "เลขานุการสำนักงานคณบดีคณะพุทธศาสตร์");
    setShowPreviewCustomizer(false);
    setPreviewZoom(0.85); // Reset to 85% fit
  };

  // Save Approver Info from Preview Modal
  const handleSavePreviewApprover = () => {
    if (!previewBooking) return;
    setIsSavingApprover(true);
    startTransition(async () => {
      try {
        const res = await updateOfficialBookingApproverAction(previewBooking.id, {
          approverSignName: previewApproverName,
          approverPosition: previewApproverPosition,
        });
        setItems((prev) => prev.map((item) => (item.id === res.id ? (res as BookingWithRelations) : item)));
        setPreviewBooking(res as BookingWithRelations);
        notify("บันทึกชื่อและตำแหน่งผู้อนุมัติ/ผู้ปฏิบัติหน้าที่แทนเรียบร้อยแล้ว");
        router.refresh();
      } catch (err: unknown) {
        notify((err instanceof Error ? err.message : String(err)) || "เกิดข้อผิดพลาดในการบันทึกข้อมูลผู้อนุมัติ");
      } finally {
        setIsSavingApprover(false);
      }
    });
  };

  // Open Officer Review modal
  const handleOpenReview = (b: BookingWithRelations) => {
    const meta = parseBookingRemark(b.remark);
    setOfficerNote(meta.officerNote || "");
    setIsRoomAvailable(meta.isRoomAvailable !== false);
    setOfficerSignName(meta.officerSignName || "เจ้าหน้าที่ดูแลห้องประชุม");
    setReviewBooking(b);
  };

  // Submit Officer Review
  const handleSaveReview = () => {
    if (!reviewBooking) return;
    startTransition(async () => {
      try {
        const res = await reviewOfficialBookingAction(reviewBooking.id, {
          officerNote,
          isRoomAvailable,
          officerSignName,
        });
        setItems((prev) => prev.map((item) => (item.id === res.id ? (res as BookingWithRelations) : item)));
        setReviewBooking(null);
        notify("บันทึกความเห็นของเจ้าหน้าที่เรียบร้อยแล้ว");
        router.refresh();
      } catch (err: unknown) {
        notify((err instanceof Error ? err.message : String(err)) || "เกิดข้อผิดพลาดในการบันทึก");
      }
    });
  };

  // Open Approval modal
  const handleOpenApproval = (b: BookingWithRelations) => {
    const meta = parseBookingRemark(b.remark);
    setApprovalDecision(b.status === "APPROVED" ? "APPROVED" : b.status === "REJECTED" ? "REJECTED" : "APPROVED");
    setApproverSignName(meta.approverSignName || "พระครูปลัดสมเกียรติ กิตฺติญาโณ");
    setApproverPosition(meta.approverPosition || "เลขานุการสำนักงานคณบดีคณะพุทธศาสตร์");
    setApprovalNote(meta.notes || "");
    setApprovalBooking(b);
  };

  // Submit Approval
  const handleSaveApproval = () => {
    if (!approvalBooking) return;
    startTransition(async () => {
      try {
        const res = await approveOrRejectOfficialBookingAction(approvalBooking.id, {
          decision: approvalDecision,
          approverSignName,
          approverPosition,
          note: approvalNote,
          saveAsExecutive,
        });
        setItems((prev) => prev.map((item) => (item.id === res.id ? (res as BookingWithRelations) : item)));
        if (saveAsExecutive && approverSignName.trim()) {
          const nameTrimmed = approverSignName.trim();
          if (!personnel.some((p) => p.fullNameTh === nameTrimmed)) {
            setPersonnel((prev) => [
              {
                id: `exec_${Date.now()}`,
                fullNameTh: nameTrimmed,
                positionTh: approverPosition.trim() || "ผู้บริหาร คณะพุทธศาสตร์",
                type: "EXECUTIVE",
                departmentNameTh: "สำนักงานคณบดี คณะพุทธศาสตร์",
                email: "",
                phoneNumber: "",
              },
              ...prev,
            ]);
          }
        }
        setApprovalBooking(null);
        notify(
          approvalDecision === "APPROVED"
            ? "อนุมัติคำขอใช้ห้องประชุมเรียบร้อยแล้ว"
            : "บันทึกไม่อนุมัติคำขอเรียบร้อยแล้ว"
        );
        router.refresh();
      } catch (err: unknown) {
        notify((err instanceof Error ? err.message : String(err)) || "เกิดข้อผิดพลาดในการอนุมัติ");
      }
    });
  };

  // Delete booking
  const handleDeleteBooking = (id: string, title: string) => {
    if (!window.confirm(`ยืนยันการลบคำขอ "${title}" หรือไม่?`)) return;
    startTransition(async () => {
      try {
        await deleteMeetingBookingAction(id);
        setItems((prev) => prev.filter((item) => item.id !== id));
        notify("ลบคำขอใช้ห้องประชุมเรียบร้อยแล้ว");
        router.refresh();
      } catch (err: unknown) {
        notify((err instanceof Error ? err.message : String(err)) || "เกิดข้อผิดพลาดในการลบคำขอ");
      }
    });
  };

  // Filtered items by Buddhist Year, Status, and Search Query
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const meta = parseBookingRemark(item.remark);

      if (selectedYear !== "ALL") {
        const itemYear = getBuddhistYear(item.startTime);
        if (itemYear !== selectedYear) return false;
      }

      const matchesStatus =
        statusFilter === "ALL" ? true : item.status === statusFilter;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesStatus;

      const matchesSearch =
        item.title.toLowerCase().includes(q) ||
        item.room.name.toLowerCase().includes(q) ||
        (meta.requesterName || "").toLowerCase().includes(q) ||
        (meta.requesterDepartment || "").toLowerCase().includes(q) ||
        (meta.approverSignName || "").toLowerCase().includes(q) ||
        (item.requester.name || "").toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [items, selectedYear, statusFilter, searchQuery]);

  // Year items for statistics
  const yearItems = useMemo(() => {
    if (selectedYear === "ALL") return items;
    return items.filter((item) => getBuddhistYear(item.startTime) === selectedYear);
  }, [items, selectedYear]);

  const yearTotalCount = yearItems.length;
  const yearPendingCount = yearItems.filter((i) => i.status === "PENDING").length;
  const yearApprovedCount = yearItems.filter((i) => i.status === "APPROVED").length;
  const yearRejectedCount = yearItems.filter((i) => i.status === "REJECTED").length;

  const yearTotalAttendees = yearItems.reduce((acc, item) => {
    const meta = parseBookingRemark(item.remark);
    return acc + (Number(meta.attendeeCount) || 1);
  }, 0);

  // Overall counts
  const pendingCount = items.filter((i) => i.status === "PENDING").length;
  const approvedCount = items.filter((i) => i.status === "APPROVED").length;
  const rejectedCount = items.filter((i) => i.status === "REJECTED").length;

  // Generate dataset for Export
  const generateExportData = () => {
    const exportItems = selectedYear === "ALL"
      ? items
      : items.filter((item) => getBuddhistYear(item.startTime) === selectedYear);

    const headers = [
      "ลำดับ",
      "ปี พ.ศ.",
      "รหัสคำขอ",
      "สถานะคำขอ",
      "วันที่ยื่นคำขอ",
      "วันที่เริ่มต้น",
      "เวลาเริ่มต้น",
      "วันที่สิ้นสุด",
      "เวลาสิ้นสุด",
      "ห้องประชุม",
      "เรื่อง / วาระการประชุม",
      "วัตถุประสงค์",
      "จำนวนผู้เข้าใช้ (รูป/คน)",
      "อุปกรณ์ที่ขอใช้",
      "ผู้ขอใช้ห้อง",
      "ตำแหน่ง",
      "หน่วยงาน / สังกัด",
      "อีเมล",
      "เบอร์โทรศัพท์",
      "ผู้ประสานงาน",
      "อีเมลผู้ประสานงาน",
      "ความเห็นเจ้าหน้าที่",
      "ผลตรวจห้องว่าง",
      "เจ้าหน้าที่ผู้ตรวจ",
      "ผู้อนุมัติ / ผู้ปฏิบัติหน้าที่แทน",
      "ตำแหน่งผู้อนุมัติ",
      "วันที่อนุมัติ",
      "หมายเหตุ / คำสั่งการ",
    ];

    const rows = exportItems.map((item, idx) => {
      const meta = parseBookingRemark(item.remark);
      const start = new Date(item.startTime);
      const end = new Date(item.endTime);
      const bYear = getBuddhistYear(item.startTime);

      const statusTh =
        item.status === "APPROVED"
          ? "อนุมัติแล้ว"
          : item.status === "PENDING"
          ? "รอพิจารณา"
          : "ไม่อนุมัติ";

      const purposeTh =
        meta.purposeType === "MEETING"
          ? "ประชุม (Meeting)"
          : meta.purposeType === "TRAINING"
          ? "อบรม (Training)"
          : meta.purposeType === "SEMINAR"
          ? "สัมมนา (Seminar)"
          : meta.purposeOther || "อื่นๆ";

      const eqList = Object.entries(meta.equipments || {})
        .filter(([, v]) => Boolean(v))
        .map(([k, v]) => {
          if (k === "computer") return "คอมพิวเตอร์";
          if (k === "ledDisplay") return "จอ LED";
          if (k === "soundSystem") return "เครื่องขยายเสียง";
          if (k === "zoomOnline") return "Zoom Online";
          if (k === "other" && typeof v === "string" && v) return `อื่นๆ (${v})`;
          return k;
        })
        .join(", ") || "-";

      const availTh =
        meta.isRoomAvailable === true
          ? "ห้องว่าง"
          : meta.isRoomAvailable === false
          ? "ห้องไม่ว่าง"
          : "ยังไม่ระบุ";

      return [
        idx + 1,
        bYear,
        item.id,
        statusTh,
        meta.requestDate || new Intl.DateTimeFormat("th-TH", { dateStyle: "short" }).format(start),
        new Intl.DateTimeFormat("th-TH", { dateStyle: "short" }).format(start),
        meta.startTimeStr || new Intl.DateTimeFormat("th-TH", { timeStyle: "short" }).format(start),
        new Intl.DateTimeFormat("th-TH", { dateStyle: "short" }).format(end),
        meta.endTimeStr || new Intl.DateTimeFormat("th-TH", { timeStyle: "short" }).format(end),
        item.room.name,
        item.title,
        purposeTh,
        meta.attendeeCount || 1,
        eqList,
        meta.requesterName || item.requester.name,
        meta.requesterPosition || "-",
        meta.requesterDepartment || "-",
        meta.requesterEmail || item.requester.email || "-",
        meta.requesterPhone || "-",
        meta.coordinatorName || "-",
        meta.coordinatorEmail || "-",
        meta.officerNote || "-",
        availTh,
        meta.officerSignName || "-",
        meta.approverSignName || "-",
        meta.approverPosition || "-",
        meta.approverDate || "-",
        meta.notes || "-",
      ];
    });

    return { headers, rows, count: exportItems.length };
  };

  // Export CSV Handler
  const handleExportCsv = () => {
    const { headers, rows, count } = generateExportData();
    if (count === 0) {
      notify("ไม่พบข้อมูลคำขอใช้ห้องประชุมสำหรับการส่งออก");
      return;
    }

    const escapeCsv = (val: unknown) => {
      const s = String(val ?? "").replace(/"/g, '""');
      return `"${s}"`;
    };

    const csvContent =
      "\uFEFF" +
      [headers.map(escapeCsv).join(","), ...rows.map((row) => row.map(escapeCsv).join(","))].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const yearLabel = selectedYear === "ALL" ? "ทุกปี" : `ปี_พศ_${selectedYear}`;
    link.href = url;
    link.setAttribute("download", `รายงานสรุปการใช้ห้องประชุม_${yearLabel}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notify(`ส่งออกไฟล์ CSV (${yearLabel}) จำนวน ${count} รายการ สำเร็จ`);
  };

  // Export Excel Handler
  const handleExportExcel = () => {
    const { headers, rows, count } = generateExportData();
    if (count === 0) {
      notify("ไม่พบข้อมูลคำขอใช้ห้องประชุมสำหรับการส่งออก");
      return;
    }

    const yearLabel = selectedYear === "ALL" ? "ทุกปี พ.ศ." : `ประจำปี พ.ศ. ${selectedYear}`;
    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"/>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>สรุปการใช้ห้องประชุม</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          th { background-color: #0f172a; color: #ffffff; font-weight: bold; font-family: Tahoma, sans-serif; font-size: 11pt; padding: 7px; border: 1px solid #334155; }
          td { font-family: Tahoma, sans-serif; font-size: 10pt; padding: 6px; border: 1px solid #cbd5e1; }
          .title { font-size: 14pt; font-weight: bold; color: #c2410c; }
          .meta { font-size: 10pt; color: #475569; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="${headers.length}" class="title">รายงานสรุปคำขอใช้ห้องประชุม คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย (${yearLabel})</td></tr>
          <tr><td colspan="${headers.length}" class="meta">ข้อมูล ณ วันที่: ${new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })} | จำนวนคำขอทั้งหมด: ${count} รายการ</td></tr>
          <tr></tr>
          <thead>
            <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (r) =>
                  `<tr>${r
                    .map((cell) => `<td>${cell !== null && cell !== undefined ? String(cell) : ""}</td>`)
                    .join("")}</tr>`
              )
              .join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(["\uFEFF" + html], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const fileYear = selectedYear === "ALL" ? "ทุกปี" : `ปี_พศ_${selectedYear}`;
    link.href = url;
    link.setAttribute("download", `รายงานสรุปการใช้ห้องประชุม_${fileYear}_${new Date().toISOString().slice(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notify(`ส่งออกไฟล์ Excel (.xls) (${yearLabel}) จำนวน ${count} รายการ สำเร็จ`);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl animate-in fade-in">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 text-orange-800 px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-2">
            <Calendar className="h-3.5 w-3.5" />
            <span>ระบบบริหารจัดการห้องประชุม</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            รายการคำขอใช้ห้องประชุม (ใบขอใช้ห้องประชุมประจำคณะพุทธศาสตร์)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ตรวจสอบความว่าง บันทึกความเห็นเจ้าหน้าที่ และพิจารณาอนุมัติคำขอตามแบบฟอร์มทางการ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/portal/meetings/book")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-orange-500 transition"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>+ สร้างใบขอใช้ห้องประชุมใหม่</span>
          </button>
        </div>
      </div>

      {/* Buddhist Year Filter & Export Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
        {/* Year Selector Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 mr-1.5">
            <CalendarDays className="h-4 w-4 text-orange-600" />
            <span>สรุปในรอบปี พ.ศ.:</span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedYear("ALL")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              selectedYear === "ALL"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <span>ทุกปี พ.ศ.</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedYear === "ALL" ? "bg-slate-800 text-slate-200" : "bg-slate-200 text-slate-700 font-semibold"}`}>
              {items.length}
            </span>
          </button>
          {availableYears.map((yr) => {
            const count = items.filter((i) => getBuddhistYear(i.startTime) === yr).length;
            return (
              <button
                key={yr}
                type="button"
                onClick={() => setSelectedYear(yr)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  selectedYear === yr
                    ? "bg-orange-600 text-white shadow-xs ring-2 ring-orange-500/20"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <span>พ.ศ. {yr}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedYear === yr ? "bg-orange-700 text-white" : "bg-slate-200 text-slate-700 font-semibold"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white px-3.5 py-2 text-xs font-bold shadow-xs hover:shadow-md transition active:scale-95"
            title="ส่งออกรายงานสรุปสำหรับเปิดในโปรแกรม Microsoft Excel (.xls)"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-200" />
            <span>ส่งออก Excel</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 text-xs font-bold shadow-2xs hover:shadow-xs transition active:scale-95"
            title="ส่งออกไฟล์ข้อมูลสรุปเป็นรูปแบบ CSV (.csv) UTF-8 รองรับภาษาไทย"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>ส่งออก CSV</span>
          </button>
        </div>
      </div>

      {/* Stats Counter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setStatusFilter("ALL")}
          className={`p-4 rounded-2xl border text-left transition ${
            statusFilter === "ALL" ? "border-slate-800 bg-slate-900 text-white shadow-md" : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          <div className="text-xs font-semibold opacity-75">
            คำขอทั้งหมด {selectedYear !== "ALL" && `(พ.ศ. ${selectedYear})`}
          </div>
          <div className="text-2xl font-black mt-1">{yearTotalCount}</div>
          <div className="text-[11px] opacity-70 mt-1">ผู้เข้าใช้ {yearTotalAttendees.toLocaleString()} รูป/คน</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("PENDING")}
          className={`p-4 rounded-2xl border text-left transition ${
            statusFilter === "PENDING" ? "border-amber-500 bg-amber-500 text-white shadow-md" : "border-amber-200 bg-amber-50/70 hover:bg-amber-100/70 text-amber-950"
          }`}
        >
          <div className="text-xs font-semibold opacity-85">รอตรวจสอบ/อนุมัติ</div>
          <div className="text-2xl font-black mt-1">{yearPendingCount}</div>
          <div className="text-[11px] opacity-75 mt-1">
            {yearTotalCount > 0 ? `${Math.round((yearPendingCount / yearTotalCount) * 100)}% ของคำขอ` : "-"}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("APPROVED")}
          className={`p-4 rounded-2xl border text-left transition ${
            statusFilter === "APPROVED" ? "border-emerald-600 bg-emerald-600 text-white shadow-md" : "border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-950"
          }`}
        >
          <div className="text-xs font-semibold opacity-85">อนุมัติแล้ว</div>
          <div className="text-2xl font-black mt-1">{yearApprovedCount}</div>
          <div className="text-[11px] opacity-75 mt-1">
            {yearTotalCount > 0 ? `${Math.round((yearApprovedCount / yearTotalCount) * 100)}% ของคำขอ` : "-"}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("REJECTED")}
          className={`p-4 rounded-2xl border text-left transition ${
            statusFilter === "REJECTED" ? "border-rose-600 bg-rose-600 text-white shadow-md" : "border-rose-200 bg-rose-50/70 hover:bg-rose-100/70 text-rose-950"
          }`}
        >
          <div className="text-xs font-semibold opacity-85">ไม่อนุมัติ / ยกเลิก</div>
          <div className="text-2xl font-black mt-1">{yearRejectedCount}</div>
          <div className="text-[11px] opacity-75 mt-1">
            {yearTotalCount > 0 ? `${Math.round((yearRejectedCount / yearTotalCount) * 100)}% ของคำขอ` : "-"}
          </div>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อเรื่อง, ผู้ขอใช้, สังกัด หรือห้องประชุม..."
            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-xs focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 w-full sm:w-auto"
          >
            <option value="ALL">สถานะทั้งหมด ({yearItems.length})</option>
            <option value="PENDING">รอพิจารณา ({yearPendingCount})</option>
            <option value="APPROVED">อนุมัติแล้ว ({yearApprovedCount})</option>
            <option value="REJECTED">ไม่อนุมัติ ({yearRejectedCount})</option>
          </select>
        </div>
      </div>

      {/* Bookings Table Card */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4">วันและเวลาที่ขอใช้</th>
                <th className="p-4">ห้องประชุม</th>
                <th className="p-4">เรื่อง / วาระการประชุม</th>
                <th className="p-4">ผู้ยื่นคำร้อง & สังกัด</th>
                <th className="p-4">สถานะคำขอ</th>
                <th className="p-4 text-right">การจัดการ & ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((b) => {
                const meta = parseBookingRemark(b.remark);
                return (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition">
                    {/* Time */}
                    <td className="p-4 font-mono whitespace-nowrap">
                      <div className="font-bold text-slate-900">
                        {new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(b.startTime))}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Intl.DateTimeFormat("th-TH", { timeStyle: "short" }).format(new Date(b.startTime))} - {new Intl.DateTimeFormat("th-TH", { timeStyle: "short" }).format(new Date(b.endTime))} น.
                        </span>
                      </div>
                    </td>

                    {/* Room */}
                    <td className="p-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{b.room.name}</div>
                      <div className="text-[11px] text-slate-500">
                        รองรับ {b.room.capacity} รูป/คน
                      </div>
                    </td>

                    {/* Topic & Purpose */}
                    <td className="p-4 min-w-[220px]">
                      <div className="font-bold text-slate-900 line-clamp-2">{b.title}</div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="rounded-md bg-orange-100 text-orange-800 px-2 py-0.5 text-[10px] font-bold">
                          เพื่อ: {meta.purposeType === "MEETING" ? "ประชุม" : meta.purposeType === "TRAINING" ? "อบรม" : meta.purposeType === "SEMINAR" ? "สัมมนา" : meta.purposeOther || "อื่นๆ"}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {meta.attendeeCount || 1} รูป/คน
                        </span>
                      </div>
                    </td>

                    {/* Requester & Department */}
                    <td className="p-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">
                        {meta.requesterName || b.requester.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {meta.requesterPosition || meta.requesterDepartment || "-"}
                      </div>
                      {meta.requesterPhone && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          โทร: {meta.requesterPhone}
                        </div>
                      )}
                    </td>

                    {/* Status Pill */}
                    <td className="p-4 whitespace-nowrap">
                      {b.status === "APPROVED" ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-800">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span>อนุมัติแล้ว</span>
                          </span>
                          <div className="text-[10.5px] text-slate-700 font-semibold truncate max-w-[190px]" title={meta.approverSignName}>
                            ลงนาม: {meta.approverSignName || "พระครูปลัดสมเกียรติ กิตฺติญาโณ"}
                          </div>
                          {meta.approverPosition && (
                            <div className="text-[9.5px] text-slate-400 truncate max-w-[190px]" title={meta.approverPosition}>
                              {meta.approverPosition}
                            </div>
                          )}
                        </div>
                      ) : b.status === "PENDING" ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-800">
                            <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                            <span>รอพิจารณา</span>
                          </span>
                          {meta.isRoomAvailable === true && (
                            <div className="text-[10px] text-emerald-600 font-semibold">
                              ✓ เจ้าหน้าที่ตรวจแล้ว: ห้องว่าง
                            </div>
                          )}
                          {meta.isRoomAvailable === false && (
                            <div className="text-[10px] text-rose-600 font-semibold">
                              ✕ เจ้าหน้าที่ตรวจแล้ว: ห้องไม่ว่าง
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-[11px] font-bold text-rose-800">
                          <XCircle className="h-3.5 w-3.5 text-rose-600" />
                          <span>ไม่อนุมัติ</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {/* A4 Preview & Print */}
                        <button
                          type="button"
                          onClick={() => handleOpenPreview(b)}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                          title="พรีวิว / พิมพ์ใบขอใช้ห้องประชุม A4 (ปรับแก้ชื่อและตำแหน่งผู้อนุมัติได้)"
                        >
                          <Printer className="h-3.5 w-3.5 text-indigo-600" />
                          <span className="hidden sm:inline">พิมพ์ A4</span>
                        </button>

                        {/* Officer Review button */}
                        <button
                          type="button"
                          onClick={() => handleOpenReview(b)}
                          className="inline-flex items-center gap-1 rounded-xl border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition shadow-2xs"
                          title="บันทึกความเห็นเจ้าหน้าที่ / ตรวจห้องว่าง"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-amber-700" />
                          <span className="hidden sm:inline">ตรวจห้อง</span>
                        </button>

                        {/* Approver Decision / Edit button */}
                        <button
                          type="button"
                          onClick={() => handleOpenApproval(b)}
                          className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-2xs ${
                            b.status === "APPROVED"
                              ? "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300"
                              : "bg-slate-900 text-white hover:bg-slate-800"
                          }`}
                          title="พิจารณาอนุมัติ / แก้ไขข้อมูลผู้อนุมัติและผู้ปฏิบัติหน้าที่แทน"
                        >
                          <Check className="h-3.5 w-3.5 text-amber-400" />
                          <span>{b.status === "APPROVED" ? "แก้ผู้อนุมัติ" : "อนุมัติ"}</span>
                        </button>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteBooking(b.id, b.title)}
                          className="rounded-xl p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                          title="ลบคำขอ"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredItems.length === 0 && (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <Calendar className="h-10 w-10 mx-auto opacity-40" />
              <div className="text-sm font-semibold">ไม่พบรายการคำขอใช้ห้องประชุม</div>
              <div className="text-xs">สามารถสร้างคำขอใหม่ได้จากปุ่มด้านบน</div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: A4 DOCUMENT PREVIEW & PRINT */}
      {previewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-5xl h-[96vh] flex flex-col bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-700">
            {/* STICKY HEADER - ALWAYS VISIBLE */}
            <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-900 border-b border-slate-800 text-white z-30">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-400 shrink-0" />
                <span className="text-sm font-bold truncate max-w-xs sm:max-w-md">
                  ใบขอใช้ห้องประชุมประจำคณะพุทธศาสตร์ — {previewBooking.title}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* Zoom controls */}
                <div className="hidden sm:flex items-center gap-1 bg-slate-800 rounded-xl px-2 py-1 text-xs border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setPreviewZoom((z) => Math.max(0.5, Number((z - 0.1).toFixed(2))))}
                    className="p-1 hover:bg-slate-700 rounded text-slate-300"
                    title="ย่อขนาด"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-[11px] font-mono w-10 text-center font-bold text-amber-300">
                    {Math.round(previewZoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewZoom((z) => Math.min(1.4, Number((z + 0.1).toFixed(2))))}
                    className="p-1 hover:bg-slate-700 rounded text-slate-300"
                    title="ขยายขนาด"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewZoom(0.85)}
                    className="px-1.5 py-0.5 hover:bg-slate-700 rounded text-[10px] text-slate-300"
                  >
                    พอดีจอ
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewZoom(1.0)}
                    className="px-1.5 py-0.5 hover:bg-slate-700 rounded text-[10px] text-slate-300"
                  >
                    100%
                  </button>
                </div>
                {/* Customize approver button */}
                <button
                  type="button"
                  onClick={() => setShowPreviewCustomizer((v) => !v)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition border ${
                    showPreviewCustomizer
                      ? "bg-amber-400 text-slate-900 border-amber-300 font-bold shadow-xs"
                      : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
                  }`}
                  title="แก้ไข/เพิ่มเติม ชื่อและตำแหน่งผู้อนุมัติหรือผู้ปฏิบัติหน้าที่แทน"
                >
                  <PenTool className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{showPreviewCustomizer ? "ซ่อนแถบตั้งค่า" : "✏️ ปรับแต่งผู้อนุมัติ"}</span>
                </button>
                {/* Print button */}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-orange-500 transition shadow-sm"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>สั่งพิมพ์ (Print A4)</span>
                </button>
                {/* Close button */}
                <button
                  type="button"
                  onClick={() => setPreviewBooking(null)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Live Customizer Toolbar */}
            {showPreviewCustomizer && (
              <div className="bg-amber-50/95 border-b border-amber-200 p-4 space-y-3 print:hidden animate-in fade-in shrink-0 max-h-[35vh] overflow-y-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                    <UserCheck className="h-4 w-4 text-amber-700 shrink-0" />
                    <span>ปรับแต่งชื่อและตำแหน่งผู้อนุมัติ / ผู้ปฏิบัติหน้าที่แทน (แก้ไขแบบ Real-time ก่อนสั่งพิมพ์)</span>
                  </div>
                  <button
                    type="button"
                    disabled={isSavingApprover}
                    onClick={handleSavePreviewApprover}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition disabled:opacity-50 self-start sm:self-auto shadow-xs"
                    title="บันทึกชื่อและตำแหน่งนี้ลงในฐานข้อมูลสำหรับคำขอนี้"
                  >
                    {isSavingApprover ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5 text-amber-400" />}
                    <span>💾 บันทึกลงคำขอนี้</span>
                  </button>
                </div>

                {/* Presets Chips */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 font-semibold">เลือกตำแหน่งด่วน:</span>
                  {APPROVER_POSITION_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        if (p.name) setPreviewApproverName(p.name);
                        setPreviewApproverPosition(p.position);
                      }}
                      className={`text-[10.5px] px-2.5 py-1 rounded-lg border font-medium transition ${
                        previewApproverPosition === p.position
                          ? "bg-amber-200 border-amber-400 text-amber-950 font-bold ring-1 ring-amber-400/50"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewApproverName("พระครูปลัดสมเกียรติ กิตฺติญาโณ");
                      setPreviewApproverPosition("เลขานุการสำนักงานคณบดีคณะพุทธศาสตร์");
                    }}
                    className="inline-flex items-center gap-1 text-[10.5px] px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800"
                    title="รีเซ็ตเป็นค่าเริ่มต้น"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>รีเซ็ต</span>
                  </button>
                </div>

                {/* Personnel directory picker with optgroups */}
                {personnel.length > 0 && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className="text-[11px] text-slate-600 shrink-0 font-medium">
                      เลือกจากทำเนียบบุคลากร:
                    </label>
                    <select
                      onChange={(e) => {
                        const person = personnel.find((pl) => pl.id === e.target.value);
                        if (person) {
                          setPreviewApproverName(person.fullNameTh);
                          if (person.type === "EXECUTIVE" || person.positionTh.includes("คณบดี") || person.positionTh.includes("เลขา")) {
                            setPreviewApproverPosition(person.positionTh);
                          } else {
                            if (!previewApproverPosition.includes("ปฏิบัติหน้าที่แทน") && !previewApproverPosition.includes("รักษาการ")) {
                              setPreviewApproverPosition(`${person.positionTh} ปฏิบัติหน้าที่แทนเลขานุการสำนักงานคณบดีคณะพุทธศาสตร์`);
                            }
                          }
                        }
                      }}
                      defaultValue=""
                      className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-700 bg-white flex-1 max-w-lg"
                    >
                      <option value="">-- เลือกผู้บริหาร / คณาจารย์ / เจ้าหน้าที่ เพื่อดึงชื่อและตำแหน่ง --</option>
                      {executives.length > 0 && (
                        <optgroup label="👑 คณะผู้บริหาร (Executives)">
                          {executives.map((pl) => (
                            <option key={pl.id} value={pl.id}>
                              {pl.fullNameTh} — {pl.positionTh}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {academicsAndStaff.length > 0 && (
                        <optgroup label="👨‍🏫 คณาจารย์และเจ้าหน้าที่ (Faculty & Staff)">
                          {academicsAndStaff.map((pl) => (
                            <option key={pl.id} value={pl.id}>
                              {pl.fullNameTh} — {pl.positionTh}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                )}

                {/* Direct Text Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      ชื่อ-ฉายา / นามสกุล ผู้อนุมัติ *
                    </label>
                    <input
                      type="text"
                      value={previewApproverName}
                      onChange={(e) => setPreviewApproverName(e.target.value)}
                      placeholder="เช่น พระครูปลัดสมเกียรติ กิตฺติญาโณ"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-1.5 text-xs font-semibold bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      ตำแหน่งผู้อนุมัติ *
                    </label>
                    <input
                      type="text"
                      value={previewApproverPosition}
                      onChange={(e) => setPreviewApproverPosition(e.target.value)}
                      placeholder="เช่น เลขานุการสำนักงานคณบดีคณะพุทธศาสตร์ หรือ ปฏิบัติหน้าที่แทน..."
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-1.5 text-xs bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end pt-1">
                  <button
                    type="button"
                    disabled={isSavingNewExecutive || !previewApproverName.trim()}
                    onClick={() => handleQuickSaveExecutive(previewApproverName, previewApproverPosition)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg px-2.5 py-1 transition disabled:opacity-50"
                    title="บันทึกชื่อและตำแหน่งที่ระบุนี้ลงในทำเนียบคณะผู้บริหาร เพื่อใช้ในครั้งต่อไป"
                  >
                    {isSavingNewExecutive ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus className="h-3 w-3" />}
                    <span>+ บันทึกเข้าทำเนียบผู้บริหารเพื่อใช้ครั้งต่อไป</span>
                  </button>
                </div>
              </div>
            )}

            {/* A4 Preview Body */}
            <div className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center bg-slate-300/80 print:p-0 print:m-0 print:bg-white print:overflow-visible">
              <div
                style={{
                  transform: `scale(${previewZoom})`,
                  transformOrigin: "top center",
                  transition: "transform 0.15s ease",
                }}
                className="print:transform-none"
              >
                <MeetingBookingA4Document
                  metadata={{
                    ...parseBookingRemark(previewBooking.remark),
                    approverSignName: previewApproverName,
                    approverPosition: previewApproverPosition,
                  }}
                  roomName={previewBooking.room.name}
                  roomCapacity={previewBooking.room.capacity}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: OFFICER REVIEW (ความเห็นของเจ้าหน้าที่ & ตรวจสอบห้องว่าง) */}
      {reviewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">
                  บันทึกความเห็นของเจ้าหน้าที่ดูแลห้องประชุม
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReviewBooking(null)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 text-xs space-y-1">
              <div className="font-semibold text-slate-800">เรื่อง: {reviewBooking.title}</div>
              <div className="text-slate-500">
                ห้อง: {reviewBooking.room.name} | เวลา: {new Date(reviewBooking.startTime).toLocaleString("th-TH")} - {new Date(reviewBooking.endTime).toLocaleString("th-TH")}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  ความเห็นของเจ้าหน้าที่ (ระบุ)
                </label>
                <input
                  type="text"
                  value={officerNote}
                  onChange={(e) => setOfficerNote(e.target.value)}
                  placeholder="เช่น ตรวจสอบตารางการใช้แล้ว ห้องมีความพร้อมและว่างตามเวลาที่ขอ"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  ในวัน/เวลาที่ขอใช้ห้องประชุม *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                      isRoomAvailable
                        ? "border-emerald-500 bg-emerald-50 text-emerald-950 font-bold"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="avail"
                      checked={isRoomAvailable === true}
                      onChange={() => setIsRoomAvailable(true)}
                    />
                    <span className="text-xs">🔘 ว่าง (พร้อมใช้งาน)</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                      !isRoomAvailable
                        ? "border-rose-500 bg-rose-50 text-rose-950 font-bold"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="avail"
                      checked={isRoomAvailable === false}
                      onChange={() => setIsRoomAvailable(false)}
                    />
                    <span className="text-xs">🔘 ไม่ว่าง (ติดภารกิจอื่น)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  ลงชื่อเจ้าหน้าที่ผู้ตรวจสอบ
                </label>
                <input
                  type="text"
                  value={officerSignName}
                  onChange={(e) => setOfficerSignName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setReviewBooking(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleSaveReview}
                className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-5 py-2 text-xs font-bold text-white hover:bg-orange-500 disabled:opacity-50"
              >
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                <span>บันทึกความเห็นเจ้าหน้าที่</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: APPROVER DECISION (ความเห็นผู้อนุมัติ: เลขานุการสำนักงานคณบดีคณะพุทธศาสตร์) */}
      {approvalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  พิจารณาอนุมัติคำขอใช้ห้องประชุม
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setApprovalBooking(null)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 text-xs space-y-1">
              <div className="font-semibold text-slate-800">เรื่อง: {approvalBooking.title}</div>
              <div className="text-slate-500">
                ห้อง: {approvalBooking.room.name} | ผู้ยื่น: {parseBookingRemark(approvalBooking.remark).requesterName || approvalBooking.requester.name}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  ผลการพิจารณา (ความเห็น) *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition ${
                      approvalDecision === "APPROVED"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/10"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="decision"
                      checked={approvalDecision === "APPROVED"}
                      onChange={() => setApprovalDecision("APPROVED")}
                    />
                    <span className="text-xs">🔘 อนุมัติการใช้ห้อง</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition ${
                      approvalDecision === "REJECTED"
                        ? "border-rose-600 bg-rose-50 text-rose-950 font-bold ring-2 ring-rose-500/10"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="decision"
                      checked={approvalDecision === "REJECTED"}
                      onChange={() => setApprovalDecision("REJECTED")}
                    />
                    <span className="text-xs">🔘 ไม่อนุมัติ</span>
                  </label>
                </div>
              </div>

              {/* Approver Signatory & Acting Role */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <UserCheck className="h-4 w-4 text-indigo-600" />
                    <span>ผู้มีอำนาจอนุมัติ / ผู้ปฏิบัติหน้าที่แทน *</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">เลือกตำแหน่งสำเร็จรูป:</span>
                </div>

                {/* Presets Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {APPROVER_POSITION_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        if (p.name) setApproverSignName(p.name);
                        setApproverPosition(p.position);
                      }}
                      className={`text-[10.5px] px-2.5 py-1 rounded-lg border font-medium transition ${
                        approverPosition === p.position
                          ? "bg-indigo-50 border-indigo-400 text-indigo-950 font-bold"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setApproverSignName("พระครูปลัดสมเกียรติ กิตฺติญาโณ");
                      setApproverPosition("เลขานุการสำนักงานคณบดีคณะพุทธศาสตร์");
                    }}
                    className="inline-flex items-center gap-1 text-[10.5px] px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800"
                    title="รีเซ็ตเป็นค่าเริ่มต้น"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>รีเซ็ต</span>
                  </button>
                </div>

                {/* Personnel directory picker with optgroups */}
                {personnel.length > 0 && (
                  <div>
                    <label className="block text-[11px] text-slate-600 font-medium mb-1">
                      เลือกจากทำเนียบบุคลากร (ผู้บริหาร / อาจารย์ / เจ้าหน้าที่):
                    </label>
                    <select
                      onChange={(e) => {
                        const person = personnel.find((pl) => pl.id === e.target.value);
                        if (person) {
                          setApproverSignName(person.fullNameTh);
                          if (person.type === "EXECUTIVE" || person.positionTh.includes("คณบดี") || person.positionTh.includes("เลขา")) {
                            setApproverPosition(person.positionTh);
                          } else {
                            if (!approverPosition.includes("ปฏิบัติหน้าที่แทน") && !approverPosition.includes("รักษาการ")) {
                              setApproverPosition(`${person.positionTh} ปฏิบัติหน้าที่แทนเลขานุการสำนักงานคณบดีคณะพุทธศาสตร์`);
                            }
                          }
                        }
                      }}
                      defaultValue=""
                      className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-700 bg-white"
                    >
                      <option value="">-- เลือกเพื่อกรอกชื่อและตำแหน่งอัตโนมัติ --</option>
                      {executives.length > 0 && (
                        <optgroup label="👑 คณะผู้บริหาร (Executives)">
                          {executives.map((pl) => (
                            <option key={pl.id} value={pl.id}>
                              {pl.fullNameTh} — {pl.positionTh}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {academicsAndStaff.length > 0 && (
                        <optgroup label="👨‍🏫 คณาจารย์และเจ้าหน้าที่ (Faculty & Staff)">
                          {academicsAndStaff.map((pl) => (
                            <option key={pl.id} value={pl.id}>
                              {pl.fullNameTh} — {pl.positionTh}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      ลงชื่อผู้อนุมัติ (Authorized Signatory) *
                    </label>
                    <input
                      type="text"
                      required
                      value={approverSignName}
                      onChange={(e) => setApproverSignName(e.target.value)}
                      placeholder="เช่น พระครูปลัดสมเกียรติ กิตฺติญาโณ"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      ตำแหน่งผู้อนุมัติ *
                    </label>
                    <input
                      type="text"
                      required
                      value={approverPosition}
                      onChange={(e) => setApproverPosition(e.target.value)}
                      placeholder="เช่น เลขานุการสำนักงานคณบดีคณะพุทธศาสตร์ หรือ ปฏิบัติหน้าที่แทน..."
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200/80 mt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-700 font-medium select-none">
                    <input
                      type="checkbox"
                      checked={saveAsExecutive}
                      onChange={(e) => setSaveAsExecutive(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>บันทึกชื่อนี้เข้าทำเนียบผู้บริหาร เพื่อใช้ในครั้งต่อไปอัตโนมัติ</span>
                  </label>
                  <button
                    type="button"
                    disabled={isSavingNewExecutive || !approverSignName.trim()}
                    onClick={() => handleQuickSaveExecutive(approverSignName, approverPosition)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg px-2.5 py-1 transition disabled:opacity-50"
                    title="เพิ่มชื่อและตำแหน่งที่ระบุนี้ลงในทำเนียบผู้บริหารทันที"
                  >
                    {isSavingNewExecutive ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus className="h-3 w-3" />}
                    <span>+ บันทึกเข้าทำเนียบทันที</span>
                  </button>
                </div>

                <p className="text-[10.5px] text-slate-500">
                  💡 สามารถพิมพ์แก้ไขหรือระบุชื่อและตำแหน่งได้อิสระ กรณีมีผู้ปฏิบัติหน้าที่แทน รักษาการแทน หรือผู้มีอำนาจท่านอื่น
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  หมายเหตุ / ข้อความสั่งการเพิ่มเติม (ถ้ามี)
                </label>
                <input
                  type="text"
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  placeholder="เช่น มอบเจ้าหน้าที่ดูแลเครื่องขยายเสียงและโสตทัศนูปกรณ์ให้พร้อม"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setApprovalBooking(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleSaveApproval}
                className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-xs transition disabled:opacity-50 ${
                  approvalDecision === "APPROVED"
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : "bg-rose-600 hover:bg-rose-500"
                }`}
              >
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                <span>
                  {approvalDecision === "APPROVED"
                    ? "ยืนยันการอนุมัติคำขอ"
                    : "ยืนยันไม่อนุมัติคำขอ"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
