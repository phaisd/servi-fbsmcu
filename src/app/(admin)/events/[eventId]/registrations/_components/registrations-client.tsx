"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Printer,
  Plus,
  Trash2,
  Search,
  Filter,
  ArrowLeft,
  QrCode,
  Sparkles,
  RefreshCw,
  Tv,
  FileSpreadsheet,
  Upload,
  Download,
  ClipboardPaste,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  updateRegistrationStatusAction,
  updateRegistrationRemarksAction,
  quickCheckInAction,
  seedOpeningCeremonyAction,
  addIndividualAttendeeAction,
  batchAddStudentsToEventAction,
  batchImportAttendeesAction,
  getEventEvaluationConfigAction,
  updateEventEvaluationConfigAction,
  getEventEvaluationStatsAction,
  removeAttendeeFromEventAction,
  importPersonnelToEventAction,
} from "@/features/events/actions";
import { ActivityRosterDocument } from "./activity-roster-document";
import { EventQrStandeeModal } from "./event-qr-standee-modal";
import { EventEvaluationReportDocument } from "./event-evaluation-report-document";
import { EVALUATION_TEMPLATES } from "@/features/events/templates";

interface AttendeeItem {
  id: string;
  studentCode: string;
  studentName: string;
  role: string;
  major?: string | null;
  yearLevel?: number | null;
  department?: string | null;
  status: "REGISTERED" | "ATTENDED" | "CANCELLED";
  remarks?: string | null;
  attendedAt?: Date | string | null;
}

interface EventData {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startDate: Date | string;
  endDate: Date | string;
  capacity: number;
  academicYear?: string | null;
  activityHours?: number;
  eventType?: string;
  targetGroup?: string;
  tenant?: { logoUrl?: string | null; nameTh?: string; nameEn?: string };
  stats?: {
    total: number;
    attended: number;
    pending: number;
    studentCount: number;
    teacherCount: number;
    percentage: number;
  };
}

interface Props {
  event: EventData;
  initialItems: AttendeeItem[];
}

export function RegistrationsClient({ event, initialItems }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<AttendeeItem[]>(initialItems);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isQrStandeeOpen, setIsQrStandeeOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [isEvalReportOpen, setIsEvalReportOpen] = useState(false);
  const [evalTab, setEvalTab] = useState<"SUMMARY" | "SETTINGS">("SUMMARY");
  const [evalStats, setEvalStats] = useState<any>(null);
  const [evalConfig, setEvalConfig] = useState<any>(null);
  const [isLoadingEval, setIsLoadingEval] = useState(false);
  const [isSavingEval, setIsSavingEval] = useState(false);
  const [addMode, setAddMode] = useState<"BATCH" | "INDIVIDUAL" | "EXECUTIVE" | "EXCEL_IMPORT">("EXCEL_IMPORT");
  const [execName, setExecName] = useState("");
  const [execPosition, setExecPosition] = useState("");
  const [execDepartment, setExecDepartment] = useState("");
  const [execCode, setExecCode] = useState("");
  const [importRawText, setImportRawText] = useState("");
  const [parsedItems, setParsedItems] = useState<Array<{
    studentCode: string;
    studentName?: string;
    role?: string;
    major?: string;
    department?: string;
  }>>([]);
  const [batchYear, setBatchYear] = useState<number>(0);
  const [batchMajor, setBatchMajor] = useState<string>("ALL");
  const [batchDegree, setBatchDegree] = useState<string>("ALL");
  const [batchDepartment, setBatchDepartment] = useState<string>("ALL");
  const [batchLanguage, setBatchLanguage] = useState<"ALL" | "THAI" | "ENGLISH">("ALL");
  const [individualCode, setIndividualCode] = useState("");
  const [individualRole, setIndividualRole] = useState<"STUDENT" | "TEACHER">("STUDENT");
  const [isAdding, setIsAdding] = useState(false);

  const [quickCode, setQuickCode] = useState("");
  const [isQuickChecking, setIsQuickChecking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Filters
  const [roleFilter, setRoleFilter] = useState<"ALL" | "STUDENT" | "TEACHER" | "EXECUTIVE">("ALL");
  const [langFilter, setLangFilter] = useState<"ALL" | "THAI" | "ENGLISH">("ALL");
  const [majorFilter, setMajorFilter] = useState<string>("ALL");
  const [yearFilter, setYearFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ATTENDED" | "REGISTERED">("ALL");
  const [search, setSearch] = useState("");

  // Statistics
  const total = items.length;
  const attended = items.filter((i) => i.status === "ATTENDED").length;
  const pending = total - attended;
  const studentCount = items.filter((i) => i.role === "STUDENT").length;
  const teacherCount = items.filter((i) => i.role === "TEACHER").length;
  const executiveCount = items.filter((i) => i.role === "EXECUTIVE").length;
  const percent = total > 0 ? Math.round((attended / total) * 100) : 0;

  // Filtered Items
  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (roleFilter !== "ALL" && item.role !== roleFilter) return false;
      if (langFilter === "THAI") {
        const isEng = /english|buddhist studies|religion and philosophy/i.test(item.major || "") || /english/i.test(item.department || "");
        if (isEng) return false;
      } else if (langFilter === "ENGLISH") {
        const isEng = /english|buddhist studies|religion and philosophy/i.test(item.major || "") || /english/i.test(item.department || "");
        if (!isEng) return false;
      }
      if (majorFilter !== "ALL") {
        const itemM = (item.major || "").toLowerCase();
        const targetM = majorFilter.toLowerCase();
        if (!itemM.includes(targetM)) return false;
      }
      if (yearFilter !== "ALL" && String(item.yearLevel) !== yearFilter) return false;
      if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesCode = item.studentCode.toLowerCase().includes(q);
        const matchesName = item.studentName.toLowerCase().includes(q);
        const matchesMajor = (item.major || "").toLowerCase().includes(q);
        const matchesDept = (item.department || "").toLowerCase().includes(q);
        if (!matchesCode && !matchesName && !matchesMajor && !matchesDept) return false;
      }
      return true;
    });
  }, [items, roleFilter, langFilter, majorFilter, yearFilter, statusFilter, search]);

  // Toggle single attendance
  const handleToggleStatus = async (item: AttendeeItem) => {
    const nextStatus = item.status === "ATTENDED" ? "REGISTERED" : "ATTENDED";
    try {
      const res = await updateRegistrationStatusAction(item.id, nextStatus);
      if (res.success) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: nextStatus,
                  attendedAt: nextStatus === "ATTENDED" ? new Date().toISOString() : null,
                }
              : i
          )
        );
        toast.success(
          nextStatus === "ATTENDED"
            ? `เช็คชื่อเรียบร้อย: ${item.studentName}`
            : `ยกเลิกการเช็คชื่อ: ${item.studentName}`
        );
      }
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการปรับปรุงสถานะ");
    }
  };

  // Inline remarks change
  const handleRemarksBlur = async (id: string, newRemarks: string) => {
    try {
      await updateRegistrationRemarksAction(id, newRemarks);
    } catch {
      toast.error("ไม่สามารถบันทึกหมายเหตุได้");
    }
  };

  // Quick check-in by code
  const handleQuickCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCode.trim()) return;
    setIsQuickChecking(true);
    try {
      const res = await quickCheckInAction(event.id, quickCode.trim());
      if (res.success) {
        toast.success(res.message);
        setItems((prev) =>
          prev.map((i) =>
            i.studentCode === quickCode.trim()
              ? { ...i, status: "ATTENDED", attendedAt: new Date().toISOString() }
              : i
          )
        );
        setQuickCode("");
      }
    } catch (err: any) {
      toast.error(err.message || "เช็คชื่อไม่สำเร็จ");
    } finally {
      setIsQuickChecking(false);
    }
  };

  // Add executive / personnel
  const handleExecutiveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!execName.trim()) {
      toast.error("กรุณาระบุชื่อ-ฉายา-นามสกุล ของผู้บริหาร");
      return;
    }
    setIsAdding(true);
    try {
      const res = await addIndividualAttendeeAction(
        event.id,
        execCode.trim(),
        "EXECUTIVE",
        {
          name: execName.trim(),
          position: execPosition.trim() || "ผู้บริหาร",
          department: execDepartment.trim() || "มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
        }
      );
      if (res.success) {
        toast.success(`เพิ่มผู้บริหาร "${res.registration.studentName}" เข้ากิจกรรมเรียบร้อยแล้ว`);
        setIsAddModalOpen(false);
        setExecName("");
        setExecPosition("");
        setExecDepartment("");
        setExecCode("");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "ไม่สามารถเพิ่มข้อมูลได้");
    } finally {
      setIsAdding(false);
    }
  };

  // Import from personnel directory
  const handleImportPersonnel = async () => {
    setIsAdding(true);
    try {
      const res = await importPersonnelToEventAction(event.id);
      if (res.success) {
        toast.success(`ดึงรายชื่อผู้บริหารและบุคลากรสำเร็จ! (เพิ่มใหม่ ${res.added} ท่าน)`);
        setIsAddModalOpen(false);
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "ไม่สามารถดึงข้อมูลได้");
    } finally {
      setIsAdding(false);
    }
  };

  // Batch add students
    // โหลดและเปิดหน้าต่างสรุปผลและตั้งค่าแบบประเมิน
  const handleOpenEvalModal = async () => {
    setIsEvalModalOpen(true);
    setIsLoadingEval(true);
    try {
      const [stats, config] = await Promise.all([
        getEventEvaluationStatsAction(event.id),
        getEventEvaluationConfigAction(event.id),
      ]);
      setEvalStats(stats);
      setEvalConfig(config);
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูลแบบประเมิน");
    } finally {
      setIsLoadingEval(false);
    }
  };

  const handleOpenEvalReport = async () => {
    if (!evalStats || !evalConfig) {
      setIsLoadingEval(true);
      try {
        const [stats, config] = await Promise.all([
          getEventEvaluationStatsAction(event.id),
          getEventEvaluationConfigAction(event.id),
        ]);
        setEvalStats(stats);
        setEvalConfig(config);
        setIsEvalReportOpen(true);
      } catch (err: any) {
        toast.error(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูลแบบประเมิน");
      } finally {
        setIsLoadingEval(false);
      }
    } else {
      setIsEvalReportOpen(true);
    }
  };

  const handleSaveEvalConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalConfig) return;

    setIsSavingEval(true);
    try {
      await updateEventEvaluationConfigAction(event.id, {
        title: evalConfig.title,
        description: evalConfig.description,
        questions: evalConfig.questions,
      });
      toast.success("บันทึกการแก้ไขแบบประเมินเรียบร้อยแล้ว");
    } catch (err: any) {
      toast.error(err.message || "ไม่สามารถบันทึกการตั้งค่าได้");
    } finally {
      setIsSavingEval(false);
    }
  };

  const handleAddSubQuestion = (categoryIdx: number) => {
    if (!evalConfig || !evalConfig.questions) return;
    const updated = [...evalConfig.questions];
    const targetQ = updated[categoryIdx];
    const subList = targetQ.subQuestions ? [...targetQ.subQuestions] : [];
    const newNum = subList.length + 1;
    subList.push({
      id: `${targetQ.category}_${Date.now()}`,
      label: `ข้อ ${categoryIdx + 1}.${newNum} `,
    });
    updated[categoryIdx] = { ...targetQ, subQuestions: subList };
    setEvalConfig({ ...evalConfig, questions: updated });
  };

  const handleEditSubQuestion = (categoryIdx: number, subIdx: number, newLabel: string) => {
    if (!evalConfig || !evalConfig.questions) return;
    const updated = [...evalConfig.questions];
    const targetQ = updated[categoryIdx];
    const subList = [...(targetQ.subQuestions || [])];
    subList[subIdx] = { ...subList[subIdx], label: newLabel };
    updated[categoryIdx] = { ...targetQ, subQuestions: subList };
    setEvalConfig({ ...evalConfig, questions: updated });
  };

  const handleDeleteSubQuestion = (categoryIdx: number, subIdx: number) => {
    if (!evalConfig || !evalConfig.questions) return;
    const updated = [...evalConfig.questions];
    const targetQ = updated[categoryIdx];
    const subList = (targetQ.subQuestions || []).filter((_: any, i: number) => i !== subIdx);
    updated[categoryIdx] = { ...targetQ, subQuestions: subList };
    setEvalConfig({ ...evalConfig, questions: updated });
  };

  const handleLoadTemplate = (templateKey: string) => {
    const template = (EVALUATION_TEMPLATES as any)[templateKey];
    if (!template || !evalConfig) return;
    setEvalConfig({
      ...evalConfig,
      questions: template.questions,
    });
    toast.success(`โหลดแม่แบบ "${template.name}" เรียบร้อยแล้ว (อย่าลืมกด "บันทึกการตั้งค่า" ด้านล่าง)`);
  };

  // ตัวช่วยแปลงข้อความจาก Excel / Clipboard / CSV
  const parseImportText = (text: string) => {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const result: Array<{
      studentCode: string;
      studentName?: string;
      role?: string;
      major?: string;
      department?: string;
    }> = [];

    for (const line of lines) {
      if (
        line.toLowerCase().includes("รหัสนิสิต") ||
        line.toLowerCase().includes("student_code") ||
        line.toLowerCase().includes("student code") ||
        line.toLowerCase().includes("ลำดับ")
      ) {
        continue;
      }

      let parts: string[] = [];
      if (line.includes("\t")) {
        parts = line.split("\t").map((p) => p.trim());
      } else if (line.includes(",")) {
        parts = line.split(",").map((p) => p.trim().replace(/^"|"$/g, ""));
      } else if (line.includes(";")) {
        parts = line.split(";").map((p) => p.trim().replace(/^"|"$/g, ""));
      } else {
        parts = line.split(/\s{2,}/).map((p) => p.trim());
        if (parts.length <= 1) {
          parts = [line.trim()];
        }
      }

      if (!parts[0]) continue;

      const studentCode = parts[0];
      const studentName = parts[1] || "";
      const roleOrMajor = parts[2] || "";
      const department = parts[3] || "";

      result.push({
        studentCode,
        studentName,
        role: roleOrMajor.includes("อาจารย์") ? "TEACHER" : roleOrMajor.includes("ผู้บริหาร") ? "EXECUTIVE" : "STUDENT",
        major: roleOrMajor && !roleOrMajor.includes("อาจารย์") && !roleOrMajor.includes("ผู้บริหาร") && !roleOrMajor.includes("นิสิต") ? roleOrMajor : undefined,
        department: department || undefined,
      });
    }

    return result;
  };

  const handleTextChange = (text: string) => {
    setImportRawText(text);
    setParsedItems(parseImportText(text));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        handleTextChange(content);
        toast.success(`อ่านไฟล์ ${file.name} เรียบร้อยแล้ว พบ ${parseImportText(content).length} รายการ`);
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleDownloadTemplate = () => {
    const sample = "\uFEFF" + [
      "รหัสนิสิต,ชื่อ-นามสกุล,สาขาวิชา,บทบาท",
      "6401201001,พระมหามานพ ญาณโสภโณ,สาขาวิชาพระพุทธศาสนา,นิสิต",
      "6401201002,นายกฤษณะ บุญมี,สาขาวิชาปรัชญา,นิสิต",
      "6401201003,พระสมชาย เขมกาโม,สาขาวิชาพุทธจิตวิทยา,นิสิต",
    ].join("\r\n");

    const blob = new Blob([sample], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "ตัวอย่างไฟล์นำเข้ารายชื่อกิจกรรม_มจร.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("ดาวน์โหลดไฟล์ตัวอย่างเรียบร้อยแล้ว");
  };

  const handleBatchImportSubmit = async () => {
    if (parsedItems.length === 0) {
      toast.error("ไม่พบข้อมูลที่จะนำเข้า กรุณาวางข้อความหรือเลือกไฟล์ก่อน");
      return;
    }

    setIsAdding(true);
    try {
      const res = await batchImportAttendeesAction(event.id, parsedItems);
      if (res.success) {
        toast.success(`นำเข้ารายชื่อสำเร็จ ${res.importedCount} ท่าน! (ข้ามรายการซ้ำ ${res.skippedCount} ท่าน)`);
        setIsAddModalOpen(false);
        setImportRawText("");
        setParsedItems([]);
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการนำเข้า");
    } finally {
      setIsAdding(false);
    }
  };

  const handleExportExcel = () => {
    if (filtered.length === 0) {
      toast.error("ไม่มีข้อมูลที่จะส่งออก");
      return;
    }

    const headers = [
      "ลำดับ",
      "รหัสประจำตัว",
      "ชื่อ-ฉายา-นามสกุล",
      "บทบาท",
      "ชั้นปี",
      "สาขาวิชา/ตำแหน่ง",
      "คณะ/สังกัด",
      "สถานะการเช็คชื่อ",
      "เวลาที่เช็คชื่อ",
      "หมายเหตุ",
    ];

    const rows = filtered.map((item: AttendeeItem, idx: number) => [
      idx + 1,
      `"${item.studentCode}"`,
      `"${item.studentName.replace(/"/g, '""')}"`,
      item.role === "EXECUTIVE" ? "ผู้บริหาร" : item.role === "TEACHER" ? "อาจารย์" : "นิสิต",
      item.yearLevel ? `ปี ${item.yearLevel}` : "-",
      `"${(item.major || "").replace(/"/g, '""')}"`,
      `"${(item.department || "").replace(/"/g, '""')}"`,
      item.status === "ATTENDED" ? "เช็คชื่อแล้ว" : "ยังไม่ได้เช็คชื่อ",
      item.attendedAt ? new Date(item.attendedAt).toLocaleString("th-TH") : "-",
      `"${(item.remarks || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r: (string | number)[]) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `รายชื่อผู้เข้าร่วม_${event.title.replace(/[\s/\\:*?"<>|]/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`ส่งออกรายชื่อ ${filtered.length} ท่าน เป็นไฟล์ Excel (.csv) สำเร็จ`);
  };

  const handleBatchAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const res = await batchAddStudentsToEventAction(event.id, {
        yearLevel: batchYear,
        major: batchMajor,
        degree: batchDegree,
        department: batchDepartment,
        programLanguage: batchLanguage,
      });
      if (res.success) {
        toast.success(`เพิ่มรายชื่อสำเร็จ! เพิ่มใหม่ ${res.addedCount} คน (จากที่พบทั้งหมด ${res.totalFound} คน)`);
        setIsAddModalOpen(false);
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "ไม่สามารถเพิ่มรายชื่อได้");
    } finally {
      setIsAdding(false);
    }
  };

  // Add individual student or lecturer
  const handleIndividualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!individualCode.trim()) return;
    setIsAdding(true);
    try {
      const res = await addIndividualAttendeeAction(event.id, individualCode.trim(), individualRole);
      if (res.success) {
        toast.success(`เพิ่ม "${res.registration.studentName}" เข้ากิจกรรมเรียบร้อยแล้ว`);
        setIsAddModalOpen(false);
        setIndividualCode("");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "ไม่สามารถเพิ่มได้");
    } finally {
      setIsAdding(false);
    }
  };

  // Remove attendee
  const handleRemoveAttendee = async (regId: string, name: string) => {
    if (!confirm(`คุณต้องการลบ "${name}" ออกจากกิจกรรมนี้ใช่หรือไม่?`)) return;
    try {
      await removeAttendeeFromEventAction(event.id, regId);
      setItems((prev) => prev.filter((i) => i.id !== regId));
      toast.success(`ลบ "${name}" ออกจากกิจกรรมเรียบร้อยแล้ว`);
    } catch (err: any) {
      toast.error(err.message || "ไม่สามารถลบได้");
    }
  };

  // Sync roster from DB
  const handleSyncRoster = async () => {
    setIsSyncing(true);
    try {
      const res = await seedOpeningCeremonyAction();
      if (res.success) {
        toast.success(
          `ซิงค์รายชื่อสำเร็จ! นิสิต ${res.studentRegisteredCount} คน, อาจารย์ ${res.teacherRegisteredCount} ท่าน`
        );
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "ไม่สามารถซิงค์รายชื่อได้");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* ══════════ Top Header Bar ══════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/events" className="hover:text-primary transition flex items-center gap-1 font-medium">
              <ArrowLeft className="w-3.5 h-3.5" /> รายการกิจกรรมทั้งหมด
            </Link>
            <span>/</span>
            <span className="text-slate-700 font-semibold">การเข้าร่วมกิจกรรม</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {event.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              {new Date(event.startDate).toLocaleDateString("th-TH", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-primary" />
              {new Date(event.startDate).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              {event.location || "มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย"}
            </span>
            <span className="flex items-center gap-1 font-semibold text-amber-600">
              <Sparkles className="w-3.5 h-3.5" /> {event.activityHours || 3} ชั่วโมงกิจกรรม
            </span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleOpenEvalModal}
            className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs text-xs sm:text-sm"
          >
            <FileText className="w-4 h-4" />
            <span>📝 แบบประเมิน & สรุปผล (Evaluation)</span>
          </Button>

          <Button
            onClick={handleOpenEvalReport}
            className="gap-1.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-semibold shadow-xs text-xs sm:text-sm"
          >
            <Printer className="w-4 h-4" />
            <span>📄 รายงานสรุปผล QA/SAR (A4/Excel)</span>
          </Button>

          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มผู้เข้าร่วมกิจกรรม</span>
          </Button>

          <Button
            onClick={() => window.open(`/events/${event.id}/projector`, "_blank")}
            className="gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold shadow-xs text-xs sm:text-sm"
          >
            <Tv className="w-4 h-4" />
            <span>🖥️ เปิด QR Code กิจกรรมขึ้นจอโปรเจกเตอร์ (Projector Display)</span>
          </Button>

          <Button
            onClick={() => setIsQrStandeeOpen(true)}
            className="gap-2 bg-purple-700 hover:bg-purple-800 text-white font-semibold shadow-xs text-xs sm:text-sm"
          >
            <QrCode className="w-4 h-4" />
            <span>🖨️ พิมพ์ป้าย QR Code ตั้งโต๊ะ (Print Standee A4)</span>
          </Button>

          <Button
            onClick={() => setIsPrintModalOpen(true)}
            className="gap-2 bg-primary text-white hover:bg-primary/90 font-semibold shadow-xs text-xs sm:text-sm"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์ใบลงทะเบียน (Print Roster A4)</span>
          </Button>

          <Button
            onClick={handleSyncRoster}
            disabled={isSyncing}
            variant="outline"
            className="gap-1.5 text-xs sm:text-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            <span>ซิงค์รายชื่อ</span>
          </Button>
        </div>
      </div>

      {/* ══════════ Stats Cards ══════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ผู้ลงทะเบียนทั้งหมด</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{total} <span className="text-xs font-normal text-slate-500">คน</span></div>
          <div className="text-2xs text-slate-400 mt-1">นิสิต {studentCount} • คณาจารย์ {teacherCount} • ผู้บริหาร {executiveCount}</div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">เช็คชื่อแล้ว (เข้าร่วม)</div>
          <div className="text-2xl font-black text-emerald-800 mt-1">{attended} <span className="text-xs font-normal text-emerald-600">คน</span></div>
          <div className="text-2xs text-emerald-700 mt-1 font-medium">คิดเป็น {percent}% ของผู้ลงทะเบียน</div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider">ยังไม่ได้เช็คชื่อ</div>
          <div className="text-2xl font-black text-amber-800 mt-1">{pending} <span className="text-xs font-normal text-amber-600">คน</span></div>
          <div className="text-2xs text-amber-700 mt-1">รอการยืนยันหน้างาน</div>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">ความคืบหน้าการเช็คชื่อ</div>
          <div className="text-2xl font-black text-indigo-800 mt-1">{percent}%</div>
          <div className="w-full bg-indigo-200 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>

      {/* ══════════ Quick Check-in & Search Controls ══════════ */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-4">
        {/* Quick Check-in input */}
        <form onSubmit={handleQuickCheckIn} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pb-3 border-b border-slate-100">
          <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary focus-within:bg-white transition">
            <QrCode className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={quickCode}
              onChange={(e) => setQuickCode(e.target.value)}
              placeholder="ยิงบาร์โค้ด หรือพิมพ์รหัสนิสิต / อีเมลอาจารย์ เพื่อเช็คชื่อทันที..."
              className="w-full bg-transparent border-none text-xs sm:text-sm focus:outline-hidden font-mono"
            />
          </div>
          <Button
            type="submit"
            disabled={isQuickChecking || !quickCode.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shrink-0"
          >
            <CheckCircle2 className="w-4 h-4 mr-1" />
            {isQuickChecking ? "กำลังตรวจสอบ..." : "เช็คชื่อ (Check-in)"}
          </Button>
        </form>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-600 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> ตัวกรอง:
            </span>

            {/* Role Filter */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              <button
                type="button"
                onClick={() => setRoleFilter("ALL")}
                className={`px-2.5 py-1 rounded-md text-2xs font-semibold transition ${
                  roleFilter === "ALL" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                ทั้งหมด ({total})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter("STUDENT")}
                className={`px-2.5 py-1 rounded-md text-2xs font-semibold transition ${
                  roleFilter === "STUDENT" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                นิสิต ({studentCount})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter("TEACHER")}
                className={`px-2.5 py-1 rounded-md text-2xs font-semibold transition ${
                  roleFilter === "TEACHER" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                คณาจารย์ ({teacherCount})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter("EXECUTIVE")}
                className={`px-2.5 py-1 rounded-md text-2xs font-semibold transition ${
                  roleFilter === "EXECUTIVE" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                ผู้บริหาร ({executiveCount})
              </button>
            </div>

            {/* Language Filter */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              <button
                type="button"
                onClick={() => setLangFilter("ALL")}
                className={`px-2 py-1 rounded-md text-2xs font-semibold transition ${
                  langFilter === "ALL" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                ทุกหลักสูตรภาษา
              </button>
              <button
                type="button"
                onClick={() => setLangFilter("THAI")}
                className={`px-2 py-1 rounded-md text-2xs font-semibold transition ${
                  langFilter === "THAI" ? "bg-white text-emerald-800 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🇹🇭 ภาคไทย
              </button>
              <button
                type="button"
                onClick={() => setLangFilter("ENGLISH")}
                className={`px-2 py-1 rounded-md text-2xs font-semibold transition ${
                  langFilter === "ENGLISH" ? "bg-white text-indigo-800 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🇬🇧 ภาษาอังกฤษ
              </button>
            </div>

            {/* Major Filter */}
            <select
              value={majorFilter}
              onChange={(e) => setMajorFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-2xs"
            >
              <option value="ALL">สาขา: ทั้งหมด</option>
              <optgroup label="🇹🇭 ภาคภาษาไทย">
                <option value="พระพุทธศาสนา">สาขาวิชาพระพุทธศาสนา</option>
                <option value="ศาสนาและปรัชญา">สาขาวิชาศาสนาและปรัชญา</option>
                <option value="บาลี">สาขาวิชาบาลีและสันสกฤต</option>
                <option value="วิปัสสนา">สาขาวิชาวิปัสสนาภาวนา</option>
                <option value="ปรัชญา">สาขาวิชาปรัชญา</option>
              </optgroup>
              <optgroup label="🇬🇧 ภาษาอังกฤษ">
                <option value="Buddhist Studies">Buddhist Studies</option>
                <option value="Religion and Philosophy">Religion and Philosophy</option>
              </optgroup>
            </select>

            {/* Year Filter */}
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-2xs"
            >
              <option value="ALL">ชั้นปี: ทั้งหมด</option>
              <option value="1">ปี 1</option>
              <option value="2">ปี 2</option>
              <option value="3">ปี 3</option>
              <option value="4">ปี 4</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-2xs"
            >
              <option value="ALL">สถานะ: ทั้งหมด</option>
              <option value="ATTENDED">✓ เช็คชื่อแล้ว</option>
              <option value="REGISTERED">⏳ ยังไม่เช็คชื่อ</option>
            </select>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหารหัส / ชื่อ..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1 text-xs focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* ══════════ Attendee Table ══════════ */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-3 w-12 text-center">ที่</th>
                <th className="py-3 px-3 w-16 text-center">กลุ่ม</th>
                <th className="py-3 px-3 w-32 font-mono">รหัส ID / อีเมล</th>
                <th className="py-3 px-4">ชื่อ - ฉายา - นามสกุล</th>
                <th className="py-3 px-3">สาขาวิชา / ภาควิชา</th>
                <th className="py-3 px-2 w-16 text-center">ชั้นปี</th>
                <th className="py-3 px-3 w-32 text-center">สถานะการเข้าร่วม</th>
                <th className="py-3 px-3 w-44">หมายเหตุ (Remarks)</th>
                <th className="py-3 px-2 w-12 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item, idx) => {
                const isAttended = item.status === "ATTENDED";
                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      isAttended ? "bg-emerald-50/30 hover:bg-emerald-50/50" : "hover:bg-slate-50/80"
                    }`}
                  >
                    <td className="py-2.5 px-3 text-center text-slate-500 font-mono">
                      {idx + 1}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      {item.role === "EXECUTIVE" ? (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                          ผู้บริหาร
                        </span>
                      ) : item.role === "TEACHER" ? (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          อาจารย์
                        </span>
                      ) : (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                          นิสิต
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 text-xs">
                      {item.studentCode}
                    </td>

                    <td className="py-2.5 px-4 font-medium text-slate-950">
                      <div>{item.studentName}</div>
                      {item.attendedAt && (
                        <div className="text-[10px] text-emerald-600 font-sans">
                          เช็คชื่อเมื่อ {new Date(item.attendedAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.
                        </div>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-slate-600">
                      {item.major || item.department || "-"}
                    </td>

                    <td className="py-2.5 px-2 text-center font-mono text-slate-700">
                      {item.role === "TEACHER" ? "-" : item.yearLevel ? `ปี ${item.yearLevel}` : "-"}
                    </td>

                    {/* Quick 1-Click Toggle Check-in */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                          isAttended
                            ? "bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {isAttended ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>มาแล้ว</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>ยังไม่มา</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Inline Remarks Input */}
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        defaultValue={item.remarks || ""}
                        onBlur={(e) => handleRemarksBlur(item.id, e.target.value)}
                        placeholder="หมายเหตุ..."
                        className="w-full bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-200 focus:border-primary rounded-md px-2 py-1 text-2xs focus:outline-hidden transition"
                      />
                    </td>

                    {/* Delete Action */}
                    <td className="py-2.5 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveAttendee(item.id, item.studentName)}
                        className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="ลบออกจากกิจกรรมนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    ไม่พบข้อมูลผู้ลงทะเบียนตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* ══════════ Add Attendees Modal ══════════ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white text-slate-900 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  เพิ่มผู้เข้าร่วมกิจกรรม
                </h3>
                <p className="text-2xs text-slate-500">
                  {event.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-sm"
              >
                ✕
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="grid grid-cols-4 p-1 bg-slate-100 rounded-xl text-2xs sm:text-xs font-semibold text-slate-600 gap-0.5">
              <button
                type="button"
                onClick={() => setAddMode("EXCEL_IMPORT")}
                className={`py-1.5 rounded-lg transition text-center ${
                  addMode === "EXCEL_IMPORT" ? "bg-white text-emerald-800 shadow-2xs font-bold" : "hover:text-slate-900"
                }`}
              >
                📊 นำเข้าไฟล์/วาง
              </button>
              <button
                type="button"
                onClick={() => setAddMode("BATCH")}
                className={`py-1.5 rounded-lg transition text-center ${
                  addMode === "BATCH" ? "bg-white text-slate-900 shadow-2xs font-bold" : "hover:text-slate-900"
                }`}
              >
                👥 ดึงกลุ่มนิสิต
              </button>
              <button
                type="button"
                onClick={() => setAddMode("INDIVIDUAL")}
                className={`py-1.5 rounded-lg transition text-center ${
                  addMode === "INDIVIDUAL" ? "bg-white text-slate-900 shadow-2xs font-bold" : "hover:text-slate-900"
                }`}
              >
                👤 รายบุคคล
              </button>
              <button
                type="button"
                onClick={() => setAddMode("EXECUTIVE")}
                className={`py-1.5 rounded-lg transition text-center ${
                  addMode === "EXECUTIVE" ? "bg-white text-purple-900 shadow-2xs font-bold" : "hover:text-slate-900"
                }`}
              >
                👑 ผู้บริหาร
              </button>
            </div>

            
            {/* Tab: Excel & Clipboard Paste Import */}
            {addMode === "EXCEL_IMPORT" && (
              <div className="space-y-3 text-xs">
                {/* Description banner with template download */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="font-bold flex items-center gap-1.5 text-xs">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> นำเข้ารายชื่อเป็นชุดจาก Excel หรือคัดลอกวาง
                    </span>
                    <p className="text-2xs text-emerald-700">
                      ก๊อปปี้คอลัมน์จาก Excel หรือตารางใน PDF แล้วนำมาวาง (Ctrl+V) ได้ทันที
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-2xs font-semibold shadow-2xs shrink-0 cursor-pointer"
                  >
                    <Download className="w-3 h-3" /> ตัวอย่างไฟล์ (.csv)
                  </button>
                </div>

                {/* File upload input */}
                <div>
                  <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/50 p-2.5 rounded-xl cursor-pointer transition text-center">
                    <Upload className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-600 font-medium">คลิกเพื่อเลือกไฟล์ .csv จากเครื่อง</span>
                    <input
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Textarea for pasting */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700 flex items-center gap-1">
                      <ClipboardPaste className="w-3.5 h-3.5 text-emerald-600" /> หรือวางข้อความที่คัดลอกมา (Ctrl+V):
                    </label>
                    <span className="text-2xs text-slate-400">
                      (ใส่แค่รหัสนิสิต หรือ รหัส + ชื่อ + สาขา)
                    </span>
                  </div>
                  <textarea
                    rows={5}
                    value={importRawText}
                    onChange={(e) => handleTextChange(e.target.value)}
                    placeholder={`ตัวอย่างที่ 1 (ใส่เฉพาะรหัส - ระบบจะค้นชื่อนิสิตให้อัตโนมัติ):
6401201001
6401201002
6401201003

ตัวอย่างที่ 2 (ก๊อปปี้จาก Excel ข้ามคอลัมน์):
6401201001\tพระมหามานพ ญาณโสภโณ\tสาขาวิชาพระพุทธศาสนา
6401201002\tนายกฤษณะ บุญมี\tสาขาวิชาปรัชญา`}
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-mono text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* Live Parsed Preview Table */}
                {parsedItems.length > 0 && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between text-2xs font-semibold text-slate-600">
                      <span>ตรวจพบรายชื่อ: <strong className="text-emerald-600 font-mono text-xs">{parsedItems.length}</strong> ท่าน</span>
                      <span className="text-slate-400">แสดงตัวอย่างแถวแรก</span>
                    </div>
                    <div className="max-h-32 overflow-y-auto divide-y divide-slate-100 text-2xs">
                      {parsedItems.slice(0, 8).map((row, idx) => (
                        <div key={idx} className="px-3 py-1.5 flex items-center justify-between gap-2">
                          <span className="font-mono text-slate-400 w-5">{idx + 1}.</span>
                          <span className="font-mono font-bold text-slate-900 w-24 truncate">{row.studentCode}</span>
                          <span className="flex-1 truncate text-slate-700">
                            {row.studentName || <span className="text-slate-400 italic">(ระบบจะดึงชื่ออัตโนมัติ)</span>}
                          </span>
                          <span className="text-slate-500 text-2xs truncate max-w-[120px]">{row.major || "-"}</span>
                        </div>
                      ))}
                      {parsedItems.length > 8 && (
                        <div className="px-3 py-1 text-center text-slate-400 bg-slate-50 text-2xs">
                          ... และอีก {parsedItems.length - 8} ท่าน
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Submit buttons */}
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddModalOpen(false)}
                    size="sm"
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    type="button"
                    onClick={handleBatchImportSubmit}
                    disabled={isAdding || parsedItems.length === 0}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  >
                    {isAdding ? "กำลังนำเข้าข้อมูล..." : `✓ ยืนยันนำเข้า ${parsedItems.length} ท่าน`}
                  </Button>
                </div>
              </div>
            )}

            {/* Tab: Executive & Personnel */}
            {addMode === "EXECUTIVE" && (
              <form onSubmit={handleExecutiveAdd} className="space-y-3 text-xs">
                <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-200 text-purple-900 flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="font-bold">ทำเนียบบุคลากรและผู้บริหาร</span>
                    <p className="text-2xs text-purple-700">ดึงรายชื่อคณบดีและผู้บริหารจากทำเนียบอัตโนมัติ</p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleImportPersonnel}
                    disabled={isAdding}
                    size="sm"
                    className="bg-purple-700 hover:bg-purple-800 text-white text-2xs shrink-0"
                  >
                    🏢 ดึงจากทำเนียบ
                  </Button>
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-2 text-2xs text-slate-400 font-medium">หรือระบุข้อมูลผู้บริหารท่านใหม่</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ชื่อ - ฉายา - นามสกุล (Full Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={execName}
                    onChange={(e) => setExecName(e.target.value)}
                    placeholder="เช่น พระพรหมวัชรธีราจารย์, ศ.ดร. หรือ พระมหาบุญชู ญาณวิโรจน์"
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-primary focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      ตำแหน่ง (Position) *
                    </label>
                    <input
                      type="text"
                      required
                      value={execPosition}
                      onChange={(e) => setExecPosition(e.target.value)}
                      placeholder="เช่น อธิการบดี, คณบดี, รองอธิการบดี"
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-primary focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      ส่วนงาน / สังกัด (Department)
                    </label>
                    <input
                      type="text"
                      value={execDepartment}
                      onChange={(e) => setExecDepartment(e.target.value)}
                      placeholder="เช่น สำนักงานอธิการบดี, คณะพุทธศาสตร์"
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-primary focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    รหัสอ้างอิง หรือ อีเมล (Reference Code / Email)
                  </label>
                  <input
                    type="text"
                    value={execCode}
                    onChange={(e) => setExecCode(e.target.value)}
                    placeholder="เว้นว่างได้ (ระบบจะสร้างรหัส EXEC-XXXXXX ให้อัตโนมัติ)"
                    className="w-full border border-slate-200 rounded-lg p-2 font-mono text-xs focus:ring-1 focus:ring-primary focus:outline-hidden"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddModalOpen(false)}
                    size="sm"
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    type="submit"
                    disabled={isAdding || !execName.trim()}
                    size="sm"
                    className="bg-purple-700 hover:bg-purple-800 text-white"
                  >
                    {isAdding ? "กำลังบันทึก..." : "เพิ่มผู้บริหารเข้ากิจกรรม"}
                  </Button>
                </div>
              </form>
            )}

            {/* Tab: Batch Add */}
            {addMode === "BATCH" && (
              <form onSubmit={handleBatchAdd} className="space-y-3.5 text-xs">
                <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3 text-blue-900 space-y-1">
                  <span className="font-bold flex items-center gap-1.5 text-xs text-blue-950">
                    👥 ดึงรายชื่อนิสิตตามกลุ่ม / ภาควิชา / ชั้นปี
                  </span>
                  <p className="text-2xs text-blue-800 leading-relaxed">
                    เลือกเงื่อนไขเพื่อดึงรายชื่อนิสิตจากฐานข้อมูลทะเบียนคณะเข้าสู่กิจกรรมโดยอัตโนมัติ (ไม่ดึงชื่อที่ซ้ำ)
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* 1. หลักสูตรภาษา */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      🌐 หลักสูตรภาษา:
                    </label>
                    <select
                      value={batchLanguage}
                      onChange={(e) => setBatchLanguage(e.target.value as any)}
                      className="w-full border border-slate-200 rounded-lg p-2 bg-white text-xs font-medium"
                    >
                      <option value="ALL">ทั้งหมด (ทุกหลักสูตรภาษา)</option>
                      <option value="THAI">🇹🇭 ภาคภาษาไทย (Thai Program)</option>
                      <option value="ENGLISH">🇬🇧 หลักสูตรภาษาอังกฤษ (English Program)</option>
                    </select>
                  </div>

                  {/* 2. ระดับหลักสูตร */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      🎓 ระดับหลักสูตร (Degree):
                    </label>
                    <select
                      value={batchDegree}
                      onChange={(e) => setBatchDegree(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 bg-white text-xs font-medium"
                    >
                      <option value="ALL">ทุกระดับการศึกษา (ตรี / โท / เอก)</option>
                      <option value="BACHELOR">ระดับปริญญาตรี (พุทธศาสตรบัณฑิต)</option>
                      <option value="MASTER">ระดับปริญญาโท (พุทธศาสตรมหาบัณฑิต)</option>
                      <option value="DOCTORATE">ระดับปริญญาเอก (พุทธศาสตรดุษฎีบัณฑิต)</option>
                    </select>
                  </div>

                  {/* 3. ภาควิชา */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      🏛️ ภาควิชา (Department):
                    </label>
                    <select
                      value={batchDepartment}
                      onChange={(e) => setBatchDepartment(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 bg-white text-xs font-medium"
                    >
                      <option value="ALL">ทุกภาควิชาในคณะ</option>
                      <option value="ภาควิชาพระพุทธศาสนา">ภาควิชาพระพุทธศาสนา</option>
                      <option value="ภาควิชาศาสนาและปรัชญา">ภาควิชาศาสนาและปรัชญา</option>
                      <option value="ภาควิชาบาลีและสันสกฤต">ภาควิชาบาลีและสันสกฤต</option>
                    </select>
                  </div>

                  {/* 4. สาขาวิชา */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      📚 สาขาวิชา (Major):
                    </label>
                    <select
                      value={batchMajor}
                      onChange={(e) => setBatchMajor(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 bg-white text-xs font-medium"
                    >
                      <option value="ALL">ทุกสาขาวิชา</option>
                      <optgroup label="🇹🇭 ภาคภาษาไทย">
                        <option value="พระพุทธศาสนา">สาขาวิชาพระพุทธศาสนา</option>
                        <option value="ศาสนาและปรัชญา">สาขาวิชาศาสนาและปรัชญา</option>
                        <option value="บาลีสันสกฤต">สาขาวิชาบาลีและสันสกฤต</option>
                        <option value="วิปัสสนาภาวนา">สาขาวิชาวิปัสสนาภาวนา</option>
                        <option value="ปรัชญา">สาขาวิชาปรัชญา</option>
                      </optgroup>
                      <optgroup label="🇬🇧 หลักสูตรภาษาอังกฤษ (English Program)">
                        <option value="Buddhist Studies">Buddhist Studies</option>
                        <option value="Religion and Philosophy">Religion and Philosophy</option>
                      </optgroup>
                    </select>
                  </div>
                </div>

                {/* 5. ระดับชั้นปี */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    👥 ระดับชั้นปี (Year Level):
                  </label>
                  <select
                    value={batchYear}
                    onChange={(e) => setBatchYear(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white text-xs font-medium"
                  >
                    <option value={0}>นิสิตทุกชั้นปี (ปี 1 ถึง 4)</option>
                    <option value={1}>เฉพาะนิสิตชั้นปีที่ 1</option>
                    <option value={2}>เฉพาะนิสิตชั้นปีที่ 2</option>
                    <option value={3}>เฉพาะนิสิตชั้นปีที่ 3</option>
                    <option value={4}>เฉพาะนิสิตชั้นปีที่ 4</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddModalOpen(false)}
                    size="sm"
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    type="submit"
                    disabled={isAdding}
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-white font-semibold"
                  >
                    {isAdding ? "กำลังดึงข้อมูล..." : "✓ ดึงรายชื่อนิสิตเข้ากิจกรรม"}
                  </Button>
                </div>
              </form>
            )}

            {/* Tab 2: Individual Add */}
            {addMode === "INDIVIDUAL" && (
              <form onSubmit={handleIndividualAdd} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    กลุ่มผู้เข้าร่วม:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-1.5 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="radio"
                        name="indRole"
                        value="STUDENT"
                        checked={individualRole === "STUDENT"}
                        onChange={() => setIndividualRole("STUDENT")}
                      />
                      <span>นิสิต (Student)</span>
                    </label>
                    <label className="flex items-center gap-1.5 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="radio"
                        name="indRole"
                        value="TEACHER"
                        checked={individualRole === "TEACHER"}
                        onChange={() => setIndividualRole("TEACHER")}
                      />
                      <span>อาจารย์ (Lecturer)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {individualRole === "STUDENT" ? "รหัสนิสิต (Student Code) *" : "อีเมลอาจารย์ (Email) *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={individualCode}
                    onChange={(e) => setIndividualCode(e.target.value)}
                    placeholder={individualRole === "STUDENT" ? "เช่น 6901501008" : "เช่น teacher@mcu.ac.th"}
                    className="w-full border border-slate-200 rounded-lg p-2 font-mono text-xs focus:ring-1 focus:ring-primary focus:outline-hidden"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddModalOpen(false)}
                    size="sm"
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    type="submit"
                    disabled={isAdding || !individualCode.trim()}
                    size="sm"
                    className="bg-primary text-white"
                  >
                    {isAdding ? "กำลังค้นหาและเพิ่ม..." : "เพิ่มเข้าร่วมกิจกรรม"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ══════════ Printable A4 Document Modal ══════════ */}
      {isPrintModalOpen && (
        <ActivityRosterDocument
          event={event}
          attendees={items}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}

      {/* ══════════ Printable A4 QR Standee Modal ══════════ */}
      {isQrStandeeOpen && (
        <EventQrStandeeModal
          event={event}
          initialMode="EVALUATION"
          onClose={() => setIsQrStandeeOpen(false)}
        />
      )}

      {/* ══════════ Evaluation Modal (สรุปผลและตั้งค่าแบบประเมิน) ══════════ */}
      {isEvalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  📝
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    ระบบแบบประเมินความพึงพอใจการจัดกิจกรรม (Evaluation)
                  </h3>
                  <p className="text-xs text-slate-500">
                    {event.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEvalModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-sm"
              >
                ✕
              </button>
            </div>

            {/* Direct Evaluation Link Bar */}
            <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-indigo-950 flex items-center gap-1">
                  🔗 ลิงก์สำหรับส่งให้นิสิตทำแบบประเมิน (Evaluation URL):
                </span>
                <span className="font-mono text-indigo-700 text-2xs break-all">
                  {typeof window !== "undefined" ? window.location.origin : ""}/portal/events/{event.id}/evaluate
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const url = `${window.location.origin}/portal/events/${event.id}/evaluate`;
                    navigator.clipboard.writeText(url);
                    toast.success("คัดลอกลิงก์แบบประเมินเรียบร้อยแล้ว");
                  }}
                  className="h-7 text-xs bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-100/50"
                >
                  คัดลอกลิงก์
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => window.open(`/portal/events/${event.id}/evaluate`, "_blank")}
                  className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  เปิดหน้าแบบประเมิน ↗
                </Button>
              </div>
            </div>

            {/* Tabs Selector: สรุปผล vs ตั้งค่าคำถาม */}
            <div className="flex border-b border-slate-200 gap-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setEvalTab("SUMMARY")}
                className={`pb-2 border-b-2 transition ${
                  evalTab === "SUMMARY"
                    ? "border-indigo-600 text-indigo-600 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                📊 สรุปผลการประเมิน ({evalStats?.stats?.totalResponses || 0} ผู้ตอบ)
              </button>
              <button
                type="button"
                onClick={() => setEvalTab("SETTINGS")}
                className={`pb-2 border-b-2 transition ${
                  evalTab === "SETTINGS"
                    ? "border-indigo-600 text-indigo-600 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                ⚙️ ข้อคำถามและเกณฑ์ประเมิน
              </button>
            </div>

            {isLoadingEval ? (
              <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                <span>กำลังโหลดข้อมูลแบบประเมิน...</span>
              </div>
            ) : evalTab === "SUMMARY" ? (
              <div className="space-y-4">
                {/* QA/SAR Export & Print Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-purple-700" />
                      รายงานสรุปผลการประเมินโครงการ (สำหรับรายงาน QA / SAR)
                    </span>
                    <p className="text-2xs text-purple-700">
                      แสดงตัวอย่างเอกสารมาตรฐาน A4 ครบถ้วนทั้งค่าเฉลี่ย (&mu; / X̄), ส่วนเบี่ยงเบนมาตรฐาน (S.D.), แปลผลระดับความพึงพอใจ และข้อเสนอแนะ พร้อมพิมพ์หรือดาวน์โหลด Excel
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setIsEvalReportOpen(true)}
                    className="shrink-0 gap-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs"
                  >
                    <Printer className="w-4 h-4" />
                    <span>ดูเอกสารรายงาน QA/SAR (A4 / Excel)</span>
                  </Button>
                </div>

                {/* Score Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-200 rounded-xl p-3.5 text-center">
                    <span className="text-2xs font-bold text-indigo-700 uppercase">คะแนนเฉลี่ยรวมทุกด้าน</span>
                    <div className="text-3xl font-black text-indigo-900 mt-1">
                      {evalStats?.stats?.grandMean ? Number(evalStats.stats.grandMean).toFixed(2) : "0.00"}{" "}
                      <span className="text-xs font-normal text-slate-500">/ 5.00</span>
                    </div>
                    <div className="text-2xs text-indigo-600 font-semibold mt-0.5">
                      {evalStats?.stats?.qualitativeLevel || "-"}
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-center">
                    <span className="text-2xs font-bold text-slate-600 uppercase">จำนวนผู้ตอบแบบประเมิน</span>
                    <div className="text-3xl font-black text-slate-800 mt-1">
                      {evalStats?.stats?.totalResponses || 0}{" "}
                      <span className="text-xs font-normal text-slate-500">คน</span>
                    </div>
                    <div className="text-2xs text-slate-500 mt-0.5">
                      จากผู้เข้าร่วม {items.length} ท่าน
                    </div>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-center">
                    <span className="text-2xs font-bold text-emerald-700 uppercase">ออกเกียรติบัตรอัตโนมัติ</span>
                    <div className="text-3xl font-black text-emerald-800 mt-1">
                      100%
                    </div>
                    <div className="text-2xs text-emerald-600 mt-0.5">
                      เมื่อประเมินเสร็จสามารถพิมพ์ได้ทันที
                    </div>
                  </div>
                </div>

                {/* Score Breakdown (5 aspects) */}
                <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
                  <span className="text-xs font-bold text-slate-800">
                    คะแนนประเมินรายด้าน (มาตรฐานประกันคุณภาพ มจร. 5 ระดับ)
                  </span>
                  
                  <div className="space-y-2 text-xs">
                    {[
                      { label: "1. ด้านวิทยากรและการบรรยาย (Lecturer)", score: evalStats?.stats?.avgLecturer || 0 },
                      { label: "2. ด้านเนื้อหาและสาระของกิจกรรม (Content)", score: evalStats?.stats?.avgContent || 0 },
                      { label: "3. ด้านสถานที่และการอำนวยความสะดวก (Facility)", score: evalStats?.stats?.avgFacility || 0 },
                      { label: "4. ด้านระยะเวลาและการดำเนินกิจกรรม (Time)", score: evalStats?.stats?.avgTime || 0 },
                      { label: "5. ด้านประโยชน์และความพึงพอใจภาพรวม (Overall)", score: evalStats?.stats?.avgOverall || 0 },
                    ].map((row, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-2xs">
                          <span className="text-slate-700">{row.label}</span>
                          <span className="font-bold text-slate-900">{Number(row.score).toFixed(2)} / 5.00</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${(Number(row.score) / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Feedbacks */}
                {evalStats?.feedbacks && evalStats.feedbacks.length > 0 && (
                  <div className="border border-slate-200 rounded-xl p-4 space-y-2 bg-slate-50/50">
                    <span className="text-xs font-bold text-slate-800">
                      ข้อเสนอแนะและความคิดเห็น ({evalStats.feedbacks.length} รายการ)
                    </span>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {evalStats.feedbacks.map((f: any, i: number) => (
                        <div key={i} className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs space-y-1">
                          <div className="flex items-center justify-between text-2xs text-slate-400">
                            <span className="font-bold text-slate-700">{f.student_name}</span>
                            <span>{new Date(f.created_at).toLocaleDateString("th-TH")}</span>
                          </div>
                          <p className="text-slate-600 text-2xs italic">&quot;{f.feedback}&quot;</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Settings Tab */
              <form onSubmit={handleSaveEvalConfig} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ชื่อแบบประเมิน (Survey Title)
                  </label>
                  <input
                    type="text"
                    required
                    value={evalConfig?.title || ""}
                    onChange={(e) => setEvalConfig({ ...evalConfig, title: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    คำชี้แจง (Description)
                  </label>
                  <textarea
                    rows={2}
                    value={evalConfig?.description || ""}
                    onChange={(e) => setEvalConfig({ ...evalConfig, description: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2"
                  />
                </div>

                {/* แม่แบบข้อคำถามแนะนำตามประเภทกิจกรรม */}
                <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                      แม่แบบข้อคำถามตามประเภทกิจกรรม (QA Recommended Templates)
                    </span>
                    <span className="text-2xs text-indigo-600 font-medium">
                      คลิกเพื่อโหลดชุดข้อคำถามมาตรฐานทันที
                    </span>
                  </div>
                  <p className="text-2xs text-indigo-700 leading-relaxed">
                    ระบบออกแบบข้อคำถามย่อยทั้ง 5 ด้านให้สอดคล้องกับเกณฑ์ประกันคุณภาพการศึกษาและลักษณะของกิจกรรมแต่ละประเภท ท่านสามารถคลิกเลือกเพื่อเปลี่ยนคำถามทั้งหมดได้ในคลิกเดียว และยังสามารถปรับแต่งแก้ไขเพิ่มเติมได้ตามต้องการ:
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {Object.entries(EVALUATION_TEMPLATES).map(([key, tpl]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleLoadTemplate(key)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-white border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-100/50 font-semibold text-indigo-900 shadow-2xs transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                      >
                        {tpl.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-1 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="font-bold text-slate-800 text-xs sm:text-sm">
                      📋 ข้อคำถามการประเมิน 5 ด้าน และประเด็นคำถามย่อย:
                    </span>
                    <span className="text-2xs text-slate-500">
                      (สามารถแก้ไขหัวข้อหลัก เพิ่ม และแก้ไขข้อคำถามย่อยได้ตามต้องการ)
                    </span>
                  </div>

                  {evalConfig?.questions?.map((q: any, idx: number) => {
                    const subQuestions: any[] = q.subQuestions || [];
                    return (
                      <div
                        key={q.id || idx}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 space-y-3"
                      >
                        {/* Aspect Main Header */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-700 flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-2xs font-mono font-bold">
                                {idx + 1}
                              </span>
                              ด้านที่ {idx + 1}
                            </span>
                            <span className="text-2xs bg-white text-indigo-700 font-semibold px-2 py-0.5 rounded-full border border-indigo-200">
                              {subQuestions.length} คำถามย่อย
                            </span>
                          </div>
                          <input
                            type="text"
                            value={q.label}
                            onChange={(e) => {
                              const updated = [...evalConfig.questions];
                              updated[idx] = { ...updated[idx], label: e.target.value };
                              setEvalConfig({ ...evalConfig, questions: updated });
                            }}
                            placeholder="ชื่อด้านการประเมิน..."
                            className="w-full border border-slate-300 rounded-lg p-2 bg-white text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                          />
                        </div>

                        {/* Sub-questions List */}
                        <div className="space-y-2 pl-2 sm:pl-3 border-l-2 border-indigo-200 pt-1">
                          <span className="text-2xs font-bold text-slate-600 block">
                            ข้อคำถามย่อย (ระดับความพึงพอใจ 5 ระดับ):
                          </span>

                          {subQuestions.map((subQ: any, sIdx: number) => (
                            <div key={subQ.id || sIdx} className="flex items-center gap-2">
                              <span className="text-2xs font-mono font-bold text-slate-500 w-8 shrink-0 text-right">
                                {idx + 1}.{sIdx + 1}
                              </span>
                              <input
                                type="text"
                                value={subQ.label}
                                onChange={(e) => handleEditSubQuestion(idx, sIdx, e.target.value)}
                                placeholder="ระบุข้อความคำถามย่อย..."
                                className="flex-1 border border-slate-300 rounded-lg p-1.5 bg-white text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                              />
                              <button
                                type="button"
                                onClick={() => handleDeleteSubQuestion(idx, sIdx)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition shrink-0 cursor-pointer"
                                title="ลบคำถามย่อยข้อนี้"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}

                          {subQuestions.length === 0 && (
                            <div className="text-2xs text-slate-400 italic py-1">
                              ยังไม่มีข้อคำถามย่อยในด้านนี้ (ระบบจะใช้การประเมินแบบข้อเดียว)
                            </div>
                          )}

                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => handleAddSubQuestion(idx)}
                              className="inline-flex items-center gap-1 text-2xs text-indigo-600 hover:text-indigo-800 font-semibold bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-200 px-2.5 py-1 rounded-lg transition cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>+ เพิ่มคำถามย่อยในด้านที่ {idx + 1}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEvalModalOpen(false)}
                    size="sm"
                  >
                    ปิด
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSavingEval}
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {isSavingEval ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {/* ══════════ QA Evaluation Report Document Modal ══════════ */}
      {isEvalReportOpen && evalStats && evalConfig && (
        <EventEvaluationReportDocument
          event={event}
          stats={evalStats}
          config={evalConfig}
          onClose={() => setIsEvalReportOpen(false)}
        />
      )}
    </div>
  );
}
