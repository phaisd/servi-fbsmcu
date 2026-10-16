"use client";

import { useState } from "react";
import {
  FileSpreadsheet,
  Download,
  Search,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Printer,
  Users,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Calendar,
  GraduationCap,
  Bell,
  FileText,
  Send,
  Check,
  Copy,
  ShieldAlert,
  Sliders,
  Settings,
  Award,
} from "lucide-react";
import {
  LiyonCard,
  StatusPill,
  LiyonDialog,
  LiyonDialogHeader,
  LiyonDialogBody,
  LiyonDialogFooter,
  LiyonDialogCloseButton,
} from "@/shared/components/liyon";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  sendAtRiskWarningAction,
  getCourseAttendanceMatrixAction,
  updateCourseCalculationRulesAction,
} from "@/features/attendance/actions";
import type { StudentAttendanceSummary } from "@/features/attendance/server";


interface EligibilityReportClientProps {
  classObj: any;
  summaries: StudentAttendanceSummary[];
  stats: {
    totalStudents: number;
    eligibleCount: number;
    ineligibleCount: number;
    undeterminedCount: number;
    conductedSessions: number;
    totalSessions: number;
    averageAttendanceRate: number;
  };
}

export function EligibilityReportClient({
  classObj,
  summaries,
  stats,
}: EligibilityReportClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEligibility, setFilterEligibility] = useState<"ALL" | "ELIGIBLE" | "INELIGIBLE" | "UNDETERMINED">("ALL");

  // At-Risk Warning States
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [isSendingWarning, setIsSendingWarning] = useState(false);
  const [warningSentSuccess, setWarningSentSuccess] = useState(false);

  // MCU Official Form States
  const [isMcuFormOpen, setIsMcuFormOpen] = useState(false);

  // Matrix Export State
  const [isExportingMatrix, setIsExportingMatrix] = useState(false);

  // Calculation Rules States
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isSavingRules, setIsSavingRules] = useState(false);
  const initialRules = (classObj.calculationRules as any) || {
    minPercent: 80,
    lateCountsAsFull: true,
    excuseDeductsDenominator: false,
  };
  const [rulesForm, setRulesForm] = useState({
    minPercent: Number(initialRules.minPercent) || 80,
    lateCountsAsFull: initialRules.lateCountsAsFull ?? true,
    excuseDeductsDenominator: initialRules.excuseDeductsDenominator ?? false,
  });

  // หานิสิตที่เข้าข่ายกลุ่มเสี่ยง (< 80% หรือขาด >= 3 คาบ หรือหมดสิทธิ์สอบแล้ว)
  const atRiskStudents = summaries.filter(
    (s) => s.hasEnoughData && (s.percentage < 80.0 || s.absentCount >= 3 || s.isEligible === false)
  );

  const [selectedAtRiskIds, setSelectedAtRiskIds] = useState<string[]>([]);

  function handleOpenWarningModal() {
    setSelectedAtRiskIds(atRiskStudents.map((s) => s.studentId));
    setIsWarningModalOpen(true);
    setWarningSentSuccess(false);
  }

  function handleToggleAtRiskStudent(id: string) {
    setSelectedAtRiskIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function handleToggleAllAtRisk() {
    if (selectedAtRiskIds.length === atRiskStudents.length) {
      setSelectedAtRiskIds([]);
    } else {
      setSelectedAtRiskIds(atRiskStudents.map((s) => s.studentId));
    }
  }

  async function handleSendWarning() {
    if (selectedAtRiskIds.length === 0) {
      toast.error("กรุณาเลือกนิสิตอย่างน้อย 1 คน");
      return;
    }

    try {
      setIsSendingWarning(true);
      const res = await sendAtRiskWarningAction(classObj.id, selectedAtRiskIds);
      if (res.success) {
        toast.success(`ส่งหนังสือแจ้งเตือนสิทธิ์สอบแก่นิสิต ${res.warnedCount} รูป/คน เรียบร้อยแล้ว`);
        setWarningSentSuccess(true);
      }
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการส่งการแจ้งเตือน");
    } finally {
      setIsSendingWarning(false);
    }
  }

  const filteredSummaries = summaries.filter((item) => {

    const q = searchTerm.toLowerCase();
    const matchSearch =
      item.studentCode.toLowerCase().includes(q) ||
      item.studentName.toLowerCase().includes(q) ||
      (item.department && item.department.toLowerCase().includes(q));

    if (!matchSearch) return false;

    if (filterEligibility === "ELIGIBLE") return item.isEligible === true;
    if (filterEligibility === "INELIGIBLE") return item.isEligible === false;
    if (filterEligibility === "UNDETERMINED") return item.isEligible === null;
    return true;
  });

  // ส่งออกรายงานสิทธิ์สอบเป็นไฟล์ CSV รองรับภาษาไทยสมบูรณ์
  function handleExportCsv() {
    const headers = [
      "รหัสนิสิต",
      "ชื่อ-นามสกุล",
      "ชั้นปี",
      "สาขาวิชา",
      "จำนวนคาบที่เรียนแล้ว",
      "มาเรียน (คาบ)",
      "มาสาย (คาบ)",
      "ขาดเรียน (คาบ)",
      "ลาที่อนุมัติ (คาบ)",
      "ร้อยละการเข้าเรียน (%)",
      "สถานะสิทธิ์สอบ",
      "คาบที่ต้องเข้าเพิ่มเป็นอย่างน้อย",
    ];

    const rows = filteredSummaries.map((s) => [
      `"${s.studentCode}"`,
      `"${s.studentName}"`,
      s.yearLevel || 1,
      `"${s.department || ""}"`,
      s.evaluatedCount,
      s.presentCount,
      s.lateCount,
      s.absentCount,
      s.excusedCount,
      s.percentageDisplay,
      `"${s.statusText}"`,
      s.requiredRemainingToPass === -1 ? '"หมดสิทธิ์แน่นอน"' : s.requiredRemainingToPass,
    ]);

    const csvContent =
      "\uFEFF" +
      `"รายงานสรุปเวลาเรียนและสิทธิ์สอบ รายวิชา: ${classObj.courseCode} ${classObj.courseName} (เกณฑ์ไม่น้อยกว่า 80%)"\n` +
      `"พิมพ์เมื่อ: ${new Date().toLocaleString("th-TH")}"\n\n` +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `eligibility_report_${classObj.courseCode}_${classObj.term.replace("/", "-")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handlePrint() {
    window.print();
  }

  // ส่งออกสมุดบันทึกเวลาเรียนแบบ Matrix ครบ 16 คาบ
  async function handleExportMatrixCsv() {
    try {
      setIsExportingMatrix(true);
      const res = await getCourseAttendanceMatrixAction(classObj.id);
      if (!res.success) throw new Error("ไม่สามารถดึงข้อมูล Matrix ได้");

      const sessions = res.sessions || [];
      const matrix = res.matrix || [];

      const sessionHeaders = sessions.map(
        (s: any) =>
          `"คาบที่ ${s.sessionNumber} (${new Date(s.date).toLocaleDateString("th-TH", {
            day: "numeric",
            month: "short",
          })})"`
      );

      const headers = [
        "ลำดับ",
        "รหัสนิสิต",
        "ชื่อ-นามสกุล",
        "ชั้นปี",
        "สาขาวิชา",
        ...sessionHeaders,
        "มาเรียน (คาบ)",
        "มาสาย (คาบ)",
        "ลาที่อนุมัติ (คาบ)",
        "ขาดเรียน (คาบ)",
        "รอเช็ก (คาบ)",
        "ร้อยละการเข้าเรียน (%)",
        "สถานะสิทธิ์สอบ",
      ];

      const statusThaiMap: Record<string, string> = {
        PRESENT: "มา",
        LATE: "สาย",
        EXCUSED: "ลา",
        ABSENT: "ขาด",
        PENDING: "รอ",
      };

      const rows = matrix.map((row: any, idx: number) => {
        const sessionCells = sessions.map((s: any) => {
          const st = row.sessionRecords[s.sessionNumber];
          return `"${statusThaiMap[st] || "-"}"`;
        });

        return [
          idx + 1,
          `"${row.studentCode}"`,
          `"${row.studentName}"`,
          row.yearLevel || 1,
          `"${row.department || ""}"`,
          ...sessionCells,
          row.totals.present,
          row.totals.late,
          row.totals.excused,
          row.totals.absent,
          row.totals.pending,
          `"${row.totals.percentage.toFixed(2)}%"`,
          `"${row.totals.statusText}"`,
        ].join(",");
      });

      const csvContent =
        "\uFEFF" +
        `"สมุดบันทึกเวลาเรียนรายคาบ (Matrix 16 คาบ) รายวิชา: ${classObj.courseCode} ${classObj.courseName}"\n` +
        `"ภาคการศึกษา: ${classObj.term} | อาจารย์ผู้สอน: ${classObj.primaryTeacher?.name || classObj.instructor?.name || "-"} | เกณฑ์สิทธิ์สอบ: ${rulesForm.minPercent}%"\n` +
        `"พิมพ์เมื่อ: ${new Date().toLocaleString("th-TH")}"\n\n` +
        [headers.join(","), ...rows].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `attendance_matrix_${classObj.courseCode}_${classObj.term.replace("/", "-")}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("ส่งออกสมุดบันทึกเวลาเรียน Matrix (16 คาบ) เรียบร้อยแล้ว");
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการส่งออก Matrix");
    } finally {
      setIsExportingMatrix(false);
    }
  }

  // บันทึกการตั้งค่าเกณฑ์การคำนวณสิทธิ์สอบ
  async function handleSaveRules(e: React.FormEvent) {
    e.preventDefault();
    try {
      setIsSavingRules(true);
      const res = await updateCourseCalculationRulesAction(classObj.id, rulesForm);
      if (res.success) {
        toast.success("บันทึกเกณฑ์การคำนวณสิทธิ์สอบเรียบร้อยแล้ว ระบบกำลังคำนวณผลใหม่...");
        setIsRulesModalOpen(false);
        window.location.reload();
      }
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการบันทึกเกณฑ์");
    } finally {
      setIsSavingRules(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner (Print Hidden Controls) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-2 text-slate-500 hover:text-primary text-xs font-semibold mb-2 transition">
            <Link
              href={`/attendance/classes/${classObj.id}/sessions`}
              className="inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> ย้อนกลับไปตารางคาบเรียน
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary font-bold text-xs">
              {classObj.courseCode}
            </span>
            <span className="text-xs text-slate-400">ภาคการศึกษา {classObj.term}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            รายงานเวลาเรียนและสิทธิ์สอบ (Exam Eligibility Report)
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {classObj.courseName} (เกณฑ์การเข้าเรียนไม่น้อยกว่า 80.00%)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/attendance/classes/${classObj.id}/sessions`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition"
          >
            <Calendar className="w-3.5 h-3.5" />
            ตารางคาบเรียน
          </Link>

          <Link
            href={`/attendance/classes/${classObj.id}/students`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition"
          >
            <Users className="w-3.5 h-3.5" />
            รายชื่อนิสิต
          </Link>

          <Link
            href={`/attendance/classes/${classObj.id}/teachers`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-xs font-semibold shadow-2xs transition"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            อาจารย์ผู้สอน
          </Link>

          <Link
            href={`/attendance/classes/${classObj.id}/grades`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 text-xs font-semibold shadow-2xs transition"
          >
            <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            บันทึกคะแนน/เกรด
          </Link>

          <button
            type="button"
            onClick={() => setIsRulesModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 text-xs font-semibold shadow-2xs transition"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            เกณฑ์สิทธิ์สอบ ({rulesForm.minPercent}%)
          </button>

          <button
            type="button"
            onClick={() => setIsMcuFormOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-semibold shadow-2xs transition"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            แบบฟอร์มทางการ มจร.
          </button>

          <button
            type="button"
            onClick={handleExportMatrixCsv}
            disabled={isExportingMatrix}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-semibold shadow-2xs transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            {isExportingMatrix ? "กำลังส่งออก..." : "ส่งออก Matrix (16 คาบ)"}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition"
          >
            <Printer className="w-3.5 h-3.5" />
            พิมพ์รายงาน
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            สรุปผลสิทธิ์สอบ (CSV)
          </button>
        </div>
      </div>

      {/* ⚠️ การแจ้งเตือนกลุ่มเสี่ยงหมดสิทธิ์สอบ (At-Risk Early Warning) */}
      {atRiskStudents.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-950 dark:text-amber-200 text-sm">
                  แจ้งเตือนกลุ่มเสี่ยงหมดสิทธิ์สอบ (At-Risk Early Warning)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold text-[11px]">
                  {atRiskStudents.length} รูป/คน
                </span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                พบนิสิตที่มีสถิติเวลาเรียนต่ำกว่า 80% หรือขาดเรียนตั้งแต่ 3 ครั้งขึ้นไป ซึ่งมีความเสี่ยงสูงที่จะหมดสิทธิ์สอบปลายภาค
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenWarningModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition shrink-0"
          >
            <Bell className="w-4 h-4" />
            <span>ส่งหนังสือแจ้งเตือนนิสิต ({atRiskStudents.length} คน)</span>
          </button>
        </div>
      )}


      {/* Print Document Title Header (Visible only when printed) */}
      <div className="hidden print:block text-center border-b border-black pb-4 mb-4">
        <h2 className="text-xl font-bold">คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย</h2>
        <h3 className="text-base font-semibold mt-1">
          รายงานผลการตรวจสอบเวลาเข้าเรียนและสิทธิ์สอบปลายภาค (เกณฑ์ไม่น้อยกว่า 80%)
        </h3>
        <p className="text-xs mt-1">
          รายวิชา: {classObj.courseCode} {classObj.courseName} | ภาคการศึกษา: {classObj.term} | อาจารย์ผู้สอน: {classObj.primaryTeacher?.name || classObj.instructor?.name || "-"}
        </p>
        <p className="text-2xs text-gray-500 mt-1">
          ออกรายงานเมื่อ: {new Intl.DateTimeFormat("th-TH", { dateStyle: "long", timeStyle: "medium" }).format(new Date())}
        </p>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 print:grid-cols-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>นิสิตทั้งหมด</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {stats.totalStudents} <span className="text-xs font-normal text-slate-500">คน</span>
          </p>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
            <span>มีสิทธิ์สอบ (≥80%)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-200 mt-1">
            {stats.eligibleCount} <span className="text-xs font-normal text-emerald-700">คน</span>
          </p>
        </div>

        <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-xl border border-red-200 dark:border-red-900/60 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-red-800 dark:text-red-300">
            <span>หมดสิทธิ์สอบ (&lt;80%)</span>
            <XCircle className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-black text-red-700 dark:text-red-200 mt-1">
            {stats.ineligibleCount} <span className="text-xs font-normal text-red-700">คน</span>
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-blue-800 dark:text-blue-300">
            <span>อัตราเข้าเรียนเฉลี่ย</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-700 dark:text-blue-200 mt-1">
            {stats.averageAttendanceRate}%
          </p>
        </div>
      </div>

      {/* Filter and Search Bar (Print Hidden) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาด้วยรหัสนิสิต หรือชื่อ-นามสกุล..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium w-full sm:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilterEligibility("ALL")}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterEligibility === "ALL" ? "bg-white dark:bg-slate-900 font-bold shadow-2xs" : "text-slate-600 dark:text-slate-400"
            }`}
          >
            ทั้งหมด ({summaries.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterEligibility("ELIGIBLE")}
            className={`px-3 py-1.5 rounded-lg transition text-emerald-700 ${
              filterEligibility === "ELIGIBLE" ? "bg-emerald-600 text-white font-bold shadow-2xs" : "hover:bg-white/50"
            }`}
          >
            มีสิทธิ์ ({stats.eligibleCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterEligibility("INELIGIBLE")}
            className={`px-3 py-1.5 rounded-lg transition text-red-700 ${
              filterEligibility === "INELIGIBLE" ? "bg-red-600 text-white font-bold shadow-2xs" : "hover:bg-white/50"
            }`}
          >
            หมดสิทธิ์ ({stats.ineligibleCount})
          </button>
        </div>
      </div>

      {/* Eligibility Table */}
      <LiyonCard className="overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 font-semibold uppercase">
              <tr>
                <th className="py-3 px-4 text-center">ลำดับ</th>
                <th className="py-3 px-4">รหัสนิสิต</th>
                <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                <th className="py-3 px-4 text-center">จัดแล้ว / ตัวหาร</th>
                <th className="py-3 px-4 text-center">มา / สาย / ขาด / ลา</th>
                <th className="py-3 px-4 text-center">ร้อยละเวลาเรียน</th>
                <th className="py-3 px-4 text-center">สิทธิ์สอบ</th>
                <th className="py-3 px-4 text-center">การคาดการณ์</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSummaries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <AlertTriangle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">ไม่พบข้อมูลตามเงื่อนไขที่เลือก</p>
                  </td>
                </tr>
              ) : (
                filteredSummaries.map((s, idx) => {
                  const isPass = s.isEligible === true;
                  const isFail = s.isEligible === false;

                  return (
                    <tr key={s.studentCode} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 text-center text-xs text-slate-400 font-medium">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {s.studentCode}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 dark:text-white">{s.studentName}</div>
                        <div className="text-2xs text-slate-400">
                          ปี {s.yearLevel || 1} {s.department ? `• ${s.department}` : ""}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center text-xs text-slate-600 dark:text-slate-300 font-medium">
                        {s.evaluatedCount} คาบ
                      </td>

                      <td className="py-3 px-4 text-center text-xs">
                        <div className="inline-flex items-center gap-1.5 font-mono text-2xs">
                          <span className="text-emerald-700 font-bold" title="มาเรียน">{s.presentCount}</span>/
                          <span className="text-amber-600 font-bold" title="มาสาย">{s.lateCount}</span>/
                          <span className="text-red-600 font-bold" title="ขาดเรียน">{s.absentCount}</span>/
                          <span className="text-blue-600 font-bold" title="ลาที่อนุมัติ">{s.excusedCount}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {s.hasEnoughData ? (
                          <div className="inline-flex flex-col items-center">
                            <span
                              className={`text-sm font-black ${
                                isPass ? "text-emerald-600" : isFail ? "text-red-600" : "text-slate-700"
                              }`}
                            >
                              {s.percentageDisplay}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">ยังไม่มีข้อมูล</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {isPass ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" /> มีสิทธิ์สอบ
                          </span>
                        ) : isFail ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-bold text-xs border border-red-200 dark:border-red-800">
                            <XCircle className="w-3.5 h-3.5" /> หมดสิทธิ์สอบ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 font-medium text-xs">
                            <HelpCircle className="w-3.5 h-3.5" /> ยังไม่สรุป
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center text-xs">
                        {s.remainingSessions > 0 ? (
                          s.requiredRemainingToPass === 0 ? (
                            <span className="text-emerald-600 text-2xs font-semibold">เวลาเรียนปลอดภัยแล้ว</span>
                          ) : s.requiredRemainingToPass === -1 ? (
                            <span className="text-red-600 text-2xs font-bold">ขาดเกินเกณฑ์กำหนด</span>
                          ) : (
                            <span className="text-amber-700 text-2xs font-medium">
                              ต้องเข้าอีกอย่างน้อย <b className="font-bold text-amber-800">{s.requiredRemainingToPass}</b> คาบ
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400 text-2xs">สิ้นสุดภาคการศึกษา</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </LiyonCard>

      {/* Remarks Section */}
      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-1">
        <p className="font-bold text-slate-700 dark:text-slate-300">หมายเหตุและระเบียบการคิดสิทธิ์สอบ:</p>
        <p>1. นิสิตต้องมีเวลาเรียนไม่น้อยกว่าร้อยละ 80.00 ของจำนวนคาบเรียนที่จัดการเรียนการสอนจริง จึงจะมีสิทธิ์สอบปลายภาค</p>
        <p>2. การตัดสินสิทธิ์ใช้ค่าจริงของอัตราส่วน (ไม่มีการปัดเศษขึ้น เช่น 79.99% จะถือว่าไม่ผ่านเกณฑ์ 80.00%)</p>
        <p>3. คาบที่ยังไม่ถึงกำหนดการหรือคาบที่ถูกยกเลิก จะไม่ถูกนำมาคิดเป็นคาบขาดเรียน</p>
      </div>

      {/* Official Signatures Section for MCU (Visible only in Print / PDF mode) */}
      <div className="hidden print:grid grid-cols-2 gap-12 mt-12 pt-8 text-xs text-black border-t border-slate-300">
        <div className="text-center space-y-8">
          <p>ขอรับรองว่าข้อมูลการเข้าเรียนข้างต้นถูกต้องตามความเป็นจริง</p>
          <div className="pt-10">
            <p>...........................................................................</p>
            <p className="mt-1 font-bold">
              ({classObj.primaryTeacher?.name || classObj.instructor?.name || "......................................................."})
            </p>
            <p className="text-2xs text-gray-600 mt-0.5">อาจารย์ผู้รับผิดชอบรายวิชา</p>
            <p className="mt-2">วันที่ .......... เดือน ........................ พ.ศ. ...............</p>
          </div>
        </div>

        <div className="text-center space-y-8">
          <p>ได้ตรวจสอบและเห็นชอบผลการประเมินสิทธิ์สอบ</p>
          <div className="pt-10">
            <p>...........................................................................</p>
            <p className="mt-1 font-bold">(...........................................................................)</p>
            <p className="text-2xs text-gray-600 mt-0.5">หัวหน้าภาควิชา / คณบดี คณะพุทธศาสตร์</p>
            <p className="mt-2">วันที่ .......... เดือน ........................ พ.ศ. ...............</p>
          </div>
        </div>
      </div>

      {/* Modal 1: ส่งหนังสือแจ้งเตือนกลุ่มเสี่ยงหมดสิทธิ์สอบ */}
      <LiyonDialog open={isWarningModalOpen} onOpenChange={(open) => !isSendingWarning && setIsWarningModalOpen(open)}>
        <LiyonDialogHeader
          title="ส่งหนังสือ / ข้อความแจ้งเตือนเวลาเรียนแก่นิสิตกลุ่มเสี่ยง"
          description={`วิชา ${classObj.courseCode} ${classObj.courseName} (เกณฑ์สิทธิ์สอบไม่น้อยกว่า 80%)`}
        />
        <LiyonDialogCloseButton label="ปิด" />
        <LiyonDialogBody className="space-y-4 max-h-[70vh] overflow-y-auto">
          {/* ข้อความร่างหนังสือแจ้งเตือน */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
              <Bell className="w-3.5 h-3.5 text-amber-600" />
              <span>ข้อความแจ้งเตือนที่จะส่งถึงนิสิต:</span>
            </div>
            <div className="p-3 bg-white dark:bg-slate-950 rounded-lg border border-slate-200/80 dark:border-slate-800 font-sans text-slate-700 dark:text-slate-300 leading-relaxed text-[11px] space-y-1.5">
              <p className="font-bold text-primary">
                หัวข้อ: [แจ้งเตือนเวลาเรียน] สถิติการเข้าเรียนเสี่ยงหมดสิทธิ์สอบปลายภาค ({classObj.courseCode})
              </p>
              <p>
                ขอเจริญพร / เรียน นิสิตผู้มีรายนาม เนื่องจากระบบตรวจสอบเวลาเรียนพบว่า ท่านมีสถิติเวลาเรียนต่ำกว่าเกณฑ์ ๘๐% หรือขาดเรียนเกินกำหนด ซึ่งอาจส่งผลให้นิสิต <b>"หมดสิทธิ์เข้าสอบปลายภาคการศึกษา"</b>
              </p>
              <p>
                ขอให้นิสิตเข้าเรียนในคาบที่เหลืออย่างสม่ำเสมอ หรือรีบติดต่ออาจารย์ผู้รับผิดชอบรายวิชา พร้อมยื่นเอกสารการลาที่ถูกต้องตามระเบียบของมหาวิทยาลัยโดยด่วน
              </p>
            </div>
          </div>

          {/* รายชื่อนิสิตที่จะส่งแจ้งเตือน */}
          <div>
            <div className="flex items-center justify-between mb-2 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                เลือกนิสิตที่จะส่งการแจ้งเตือน ({selectedAtRiskIds.length}/{atRiskStudents.length} คน)
              </span>
              <button
                type="button"
                onClick={handleToggleAllAtRisk}
                className="text-primary hover:underline font-medium text-xs"
              >
                {selectedAtRiskIds.length === atRiskStudents.length ? "ยกเลิกการเลือก" : "เลือกทั้งหมด"}
              </button>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60 max-h-60 overflow-y-auto">
              {atRiskStudents.map((st) => {
                const isChecked = selectedAtRiskIds.includes(st.studentId);
                return (
                  <div
                    key={st.studentId}
                    onClick={() => handleToggleAtRiskStudent(st.studentId)}
                    className={`p-2.5 flex items-center justify-between gap-3 cursor-pointer transition ${
                      isChecked ? "bg-amber-50/50 dark:bg-amber-950/20" : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by parent onClick
                        className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500/20"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                            {st.studentCode}
                          </span>
                          <span className="font-medium text-xs text-slate-800 dark:text-slate-200">
                            {st.studentName}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          ปี {st.yearLevel || 1} • ขาดเรียน {st.absentCount} คาบ • มาสาย {st.lateCount} คาบ
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-xs text-rose-600 dark:text-rose-400 font-mono">
                        {st.percentageDisplay}%
                      </span>
                      <div className="text-[10px] text-slate-400">
                        {st.requiredRemainingToPass === -1 ? "หมดสิทธิ์แล้ว" : `ต้องเข้าอีก ${st.requiredRemainingToPass} คาบ`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </LiyonDialogBody>
        <LiyonDialogFooter className="flex justify-between items-center gap-2">
          <button
            type="button"
            disabled={isSendingWarning}
            onClick={() => setIsWarningModalOpen(false)}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={isSendingWarning || selectedAtRiskIds.length === 0}
            onClick={handleSendWarning}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
          >
            {isSendingWarning ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>กำลังส่งการแจ้งเตือน...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>ยืนยันส่งหนังสือแจ้งเตือน ({selectedAtRiskIds.length} คน)</span>
              </>
            )}
          </button>
        </LiyonDialogFooter>
      </LiyonDialog>

      {/* Modal 2: แบบฟอร์มทางการ มจร. (Official MCU Exam Eligibility Form) */}
      <LiyonDialog open={isMcuFormOpen} onOpenChange={(open) => setIsMcuFormOpen(open)}>
        <LiyonDialogHeader
          title="แบบฟอร์มทางการ มจร. — ใบรายงานเวลาเรียนและผู้มีสิทธิ์สอบ"
          description="เอกสารมาตรฐานสำหรับเสนอหัวหน้าภาควิชาและคณบดี คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย"
        />
        <LiyonDialogCloseButton label="ปิด" />
        <LiyonDialogBody className="space-y-4 max-h-[75vh] overflow-y-auto">
          {/* กรอบเอกสารทางการ มจร. */}
          <div className="p-6 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm space-y-4 font-serif">
            {/* หัวเอกสารทางการ */}
            <div className="text-center border-b-2 border-slate-800 pb-3 space-y-1">
              <div className="font-bold text-base sm:text-lg tracking-wide">
                มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                คณะพุทธศาสตร์ • Faculty of Buddhism
              </div>
              <div className="text-sm sm:text-base font-bold text-primary dark:text-indigo-400 pt-1">
                แบบรายงานผลเวลาเรียนและรายชื่อผู้มีสิทธิ์เข้าสอบวัดผลปลายภาคการศึกษา
              </div>
            </div>

            {/* ข้อมูลรายวิชา */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs border-b border-slate-200 dark:border-slate-800 pb-3">
              <div><b>รหัสวิชา:</b> {classObj.courseCode}</div>
              <div><b>ชื่อวิชา:</b> {classObj.courseName}</div>
              <div><b>ภาคการศึกษา:</b> {classObj.term} (ปีการศึกษา {classObj.academicYear || "2569"})</div>
              <div><b>กลุ่มเรียน (Section):</b> {classObj.section || "1"} • <b>หน่วยกิต:</b> {classObj.credits || 3} หน่วยกิต</div>
              <div><b>จำนวนคาบเรียนทั้งหมด:</b> {stats.totalSessions} คาบ (จัดการเรียนการสอนแล้ว {stats.conductedSessions} คาบ)</div>
              <div><b>อาจารย์ผู้รับผิดชอบรายวิชา:</b> {classObj.primaryTeacher?.name || classObj.instructor?.name || "-"}</div>
              <div className="col-span-1 sm:col-span-2 text-rose-600 dark:text-rose-400 font-bold pt-1">
                * เกณฑ์การมีสิทธิ์สอบ: นิสิตต้องมีเวลาเรียนไม่น้อยกว่าร้อยละ ๘๐ ของเวลาเรียนทั้งหมด (ไม่น้อยกว่า {Math.ceil(stats.totalSessions * 0.8)} คาบ จาก {stats.totalSessions} คาบ)
              </div>
            </div>

            {/* ตารางรายชื่อทางการ */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-900 border-y border-slate-300 dark:border-slate-700 text-[11px] font-bold">
                    <th className="py-2 px-2 text-center w-8">ที่</th>
                    <th className="py-2 px-2">รหัสนิสิต</th>
                    <th className="py-2 px-2">ชื่อ - ฉายา / นามสกุล</th>
                    <th className="py-2 px-2">สาขาวิชา</th>
                    <th className="py-2 px-1 text-center">ปี</th>
                    <th className="py-2 px-1 text-center">มา</th>
                    <th className="py-2 px-1 text-center">ขาด</th>
                    <th className="py-2 px-1 text-center">ลา</th>
                    <th className="py-2 px-2 text-center">ร้อยละ (%)</th>
                    <th className="py-2 px-2 text-center">ผลการประเมิน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {summaries.map((s, idx) => (
                    <tr key={s.studentCode} className="hover:bg-slate-50/50">
                      <td className="py-2 px-2 text-center font-mono text-[11px] text-slate-500">{idx + 1}</td>
                      <td className="py-2 px-2 font-mono font-bold text-[11px]">{s.studentCode}</td>
                      <td className="py-2 px-2 font-medium">{s.studentName}</td>
                      <td className="py-2 px-2 text-slate-600 dark:text-slate-400 text-[11px]">{s.department || "-"}</td>
                      <td className="py-2 px-1 text-center">{s.yearLevel || 1}</td>
                      <td className="py-2 px-1 text-center text-emerald-700 font-bold">{s.presentCount}</td>
                      <td className="py-2 px-1 text-center text-rose-600 font-bold">{s.absentCount}</td>
                      <td className="py-2 px-1 text-center text-blue-600 font-bold">{s.excusedCount}</td>
                      <td className="py-2 px-2 text-center font-mono font-bold">{s.percentageDisplay}%</td>
                      <td className="py-2 px-2 text-center font-bold">
                        {s.isEligible === true ? (
                          <span className="text-emerald-700 dark:text-emerald-400">มีสิทธิ์สอบ</span>
                        ) : s.isEligible === false ? (
                          <span className="text-rose-600 dark:text-rose-400">หมดสิทธิ์สอบ</span>
                        ) : (
                          <span className="text-slate-400">รอประเมิน</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* สรุปสถิติ */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs flex flex-wrap justify-between gap-2">
              <div>นิสิตทั้งหมด: <b>{stats.totalStudents}</b> รูป/คน</div>
              <div>มีสิทธิ์สอบ: <b className="text-emerald-700 dark:text-emerald-400">{stats.eligibleCount}</b> รูป/คน</div>
              <div>หมดสิทธิ์สอบ: <b className="text-rose-600 dark:text-rose-400">{stats.ineligibleCount}</b> รูป/คน</div>
              <div>อัตราเวลาเรียนเฉลี่ย: <b>{stats.averageAttendanceRate}%</b></div>
            </div>

            {/* ลายมือชื่อทางการ 3 ระดับ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 text-center text-xs">
              <div className="space-y-6">
                <p>ขอรับรองว่าข้อมูลถูกต้อง</p>
                <div className="pt-6">
                  <p>...........................................................</p>
                  <p className="mt-1 font-bold">({classObj.primaryTeacher?.name || classObj.instructor?.name || "................................................"})</p>
                  <p className="text-[10px] text-slate-500">อาจารย์ผู้รับผิดชอบรายวิชา</p>
                  <p className="mt-1 text-[11px]">วันที่ ...../...../.........</p>
                </div>
              </div>

              <div className="space-y-6">
                <p>ได้ตรวจสอบแล้วเห็นชอบ</p>
                <div className="pt-6">
                  <p>...........................................................</p>
                  <p className="mt-1 font-bold">(...........................................................)</p>
                  <p className="text-[10px] text-slate-500">หัวหน้าภาควิชา / ประธานหลักสูตร</p>
                  <p className="mt-1 text-[11px]">วันที่ ...../...../.........</p>
                </div>
              </div>

              <div className="space-y-6">
                <p>ความเห็นคณบดีคณะพุทธศาสตร์</p>
                <div className="pt-6">
                  <p>...........................................................</p>
                  <p className="mt-1 font-bold">(...........................................................)</p>
                  <p className="text-[10px] text-slate-500">คณบดีคณะพุทธศาสตร์</p>
                  <p className="mt-1 text-[11px]">วันที่ ...../...../.........</p>
                </div>
              </div>
            </div>
          </div>
        </LiyonDialogBody>
        <LiyonDialogFooter className="flex justify-between items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>พิมพ์แบบฟอร์ม มจร. (Print / PDF)</span>
          </button>
          <button
            type="button"
            onClick={() => setIsMcuFormOpen(false)}
            className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition shadow-sm"
          >
            ปิดหน้าต่าง
          </button>
        </LiyonDialogFooter>
      </LiyonDialog>

      {/* ⚙️ Modal: ตั้งค่าเกณฑ์การคำนวณสิทธิ์สอบเฉพาะรายวิชา (Calculation Rules) */}
      <LiyonDialog open={isRulesModalOpen} onOpenChange={setIsRulesModalOpen}>
        <LiyonDialogHeader
          title={
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Sliders className="w-5 h-5" />
              </div>
              <span>ตั้งค่าเกณฑ์การคำนวณสิทธิ์สอบ (Calculation Rules)</span>
            </div>
          }
          description="ปรับแต่งเกณฑ์เปอร์เซ็นต์ขั้นต่ำและเงื่อนไขการคิดคาบเรียนสำหรับรายวิชานี้โดยเฉพาะ"
        />
        <LiyonDialogCloseButton label="ปิด" />

        <form onSubmit={handleSaveRules}>
          <LiyonDialogBody className="space-y-6 max-h-[75vh] overflow-y-auto p-6">
            {/* 1. เกณฑ์เปอร์เซ็นต์ขั้นต่ำ */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                1. เกณฑ์เวลาเรียนขั้นต่ำ (Minimum Attendance Required %)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="50"
                  max="100"
                  step="1"
                  required
                  value={rulesForm.minPercent}
                  onChange={(e) =>
                    setRulesForm({ ...rulesForm, minPercent: Number(e.target.value) })
                  }
                  className="w-28 px-3.5 py-2.5 rounded-xl border border-input bg-background font-mono text-lg font-bold text-center focus:ring-2 focus:ring-primary focus:outline-none"
                />
                <span className="text-sm font-bold text-muted-foreground">%</span>

                {/* Preset Chips */}
                <div className="flex flex-wrap items-center gap-1.5 ml-2">
                  {[
                    { label: "80% (มาตรฐาน มจร.)", val: 80 },
                    { label: "75% (ปฏิบัติการ/วิปัสสนา)", val: 75 },
                    { label: "70% (หลักสูตรพิเศษ)", val: 70 },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => setRulesForm({ ...rulesForm, minPercent: preset.val })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                        rulesForm.minPercent === preset.val
                          ? "bg-primary text-primary-foreground font-bold shadow-xs"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                * ระเบียบมหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัยกำหนดเกณฑ์มาตรฐานที่ 80% (ขาดได้ไม่เกิน 3 ครั้ง จาก 16 คาบ)
              </p>
            </div>

            {/* 2. การนับคาบมาสาย */}
            <div className="space-y-3 pt-4 border-t border-border">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                2. นโยบายการนับเวลา "มาสาย" (Late Attendance Policy)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  onClick={() => setRulesForm({ ...rulesForm, lateCountsAsFull: true })}
                  className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                    rulesForm.lateCountsAsFull
                      ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                      : "border-border bg-card hover:bg-muted/30 text-muted-foreground"
                  }`}
                >
                  <input
                    type="radio"
                    name="latePolicy"
                    checked={rulesForm.lateCountsAsFull}
                    onChange={() => {}}
                    className="mt-0.5 text-primary focus:ring-primary"
                  />
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-foreground">นับเป็นมาเรียนเต็มคาบ (100%)</p>
                    <p className="text-muted-foreground">
                      ถือว่านิสิตมาเข้าเรียนตามปกติ (ค่าเริ่มต้นของระบบ)
                    </p>
                  </div>
                </label>

                <label
                  onClick={() => setRulesForm({ ...rulesForm, lateCountsAsFull: false })}
                  className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                    !rulesForm.lateCountsAsFull
                      ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                      : "border-border bg-card hover:bg-muted/30 text-muted-foreground"
                  }`}
                >
                  <input
                    type="radio"
                    name="latePolicy"
                    checked={!rulesForm.lateCountsAsFull}
                    onChange={() => {}}
                    className="mt-0.5 text-primary focus:ring-primary"
                  />
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-foreground">นับเป็นครึ่งคาบ (50%)</p>
                    <p className="text-muted-foreground">
                      มาสาย 2 ครั้ง คิดเป็นมาเรียน 1 ครั้ง (หรือคิดครั้งละ 0.5 คาบ)
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* 3. การคิดกรณีการลาที่ได้รับอนุมัติ */}
            <div className="space-y-3 pt-4 border-t border-border">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                3. นโยบายกรณี "การลาที่ได้รับอนุมัติ" (Approved Leave Policy)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  onClick={() => setRulesForm({ ...rulesForm, excuseDeductsDenominator: false })}
                  className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                    !rulesForm.excuseDeductsDenominator
                      ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                      : "border-border bg-card hover:bg-muted/30 text-muted-foreground"
                  }`}
                >
                  <input
                    type="radio"
                    name="excusePolicy"
                    checked={!rulesForm.excuseDeductsDenominator}
                    onChange={() => {}}
                    className="mt-0.5 text-primary focus:ring-primary"
                  />
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-foreground">ไม่หักตัวหาร (เกณฑ์ทั่วไป)</p>
                    <p className="text-muted-foreground">
                      คำนวณจากจำนวนคาบที่จัดสอนทั้งหมดตามปกติ (ค่าเริ่มต้น)
                    </p>
                  </div>
                </label>

                <label
                  onClick={() => setRulesForm({ ...rulesForm, excuseDeductsDenominator: true })}
                  className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                    rulesForm.excuseDeductsDenominator
                      ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                      : "border-border bg-card hover:bg-muted/30 text-muted-foreground"
                  }`}
                >
                  <input
                    type="radio"
                    name="excusePolicy"
                    checked={rulesForm.excuseDeductsDenominator}
                    onChange={() => {}}
                    className="mt-0.5 text-primary focus:ring-primary"
                  />
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-foreground">หักคาบลาออกจากตัวหาร</p>
                    <p className="text-muted-foreground">
                      นำคาบลาที่อนุมัติไปลดตัวหาร ทำให้ร้อยละคำนวณจากคาบที่นิสิตสามารถมาเรียนได้จริง
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* สรุปผลสูตรการคำนวณ */}
            <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs space-y-1.5">
              <p className="font-bold text-foreground flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-primary" />
                สูตรคำนวณสิทธิ์สอบปัจจุบัน:
              </p>
              <p className="font-mono text-muted-foreground">
                ร้อยละ = (มาเรียน {rulesForm.lateCountsAsFull ? "+ มาสาย" : "+ (มาสาย × 0.5)"}) ÷{" "}
                (คาบที่สอนแล้ว {rulesForm.excuseDeductsDenominator ? "- คาบลาอนุมัติ" : ""}) × 100
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                • นิสิตจะได้รับสิทธิ์สอบเมื่อมีผลลัพธ์ตั้งแต่ {rulesForm.minPercent}.00% ขึ้นไป
              </p>
            </div>
          </LiyonDialogBody>

          <LiyonDialogFooter className="flex justify-end gap-2">
            <button
              type="button"
              disabled={isSavingRules}
              onClick={() => setIsRulesModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-semibold text-muted-foreground transition"
            >
              ยกเลิก
            </button>
            <Button
              type="submit"
              disabled={isSavingRules}
              className="px-5 py-2 rounded-xl text-xs font-bold shadow-sm"
            >
              {isSavingRules ? "กำลังบันทึกและคำนวณ..." : "บันทึกเกณฑ์สิทธิ์สอบ"}
            </Button>
          </LiyonDialogFooter>
        </form>
      </LiyonDialog>
    </div>
  );
}

