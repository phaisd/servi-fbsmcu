"use client";

import { useState, useMemo } from "react";
import {
  ArrowLeft,
  Award,
  Calendar,
  GraduationCap,
  FileSpreadsheet,
  Users,
  Search,
  Save,
  Download,
  Upload,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Calculator,
  RefreshCw,
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
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  batchUpdateCourseGradesAction,
  updateCourseGradingConfigAction,
} from "@/features/attendance/actions";

interface StudentGradeItem {
  enrollmentId: string;
  studentId: string;
  studentCode: string;
  title: string;
  firstName: string;
  lastName: string;
  fullName: string;
  yearLevel: number;
  department: string;
  major: string;
  gender: string;
  studyStatus: string;
  attendancePercentage: number;
  isEligible: boolean;
  eligibilityStatusTh: string;
  assignmentScore: number | null;
  midtermScore: number | null;
  affectiveScore: number | null;
  finalScore: number | null;
  totalScore: number | null;
  grade: string | null;
  gradeRemarks: string;
}

interface GradingConfig {
  assignmentMax: number;
  midtermMax: number;
  affectiveMax: number;
  finalMax: number;
}

interface GradesClientProps {
  course: {
    id: string;
    courseCode: string;
    courseName: string;
    credits: number;
    term: string;
    academicYear: string;
    semester: number;
    room: string;
    primaryTeacher: string;
  };
  initialGradingConfig: GradingConfig;
  initialStudents: StudentGradeItem[];
  isSuperAdmin?: boolean;
}

function calculateGrade(score: number): string {
  if (score >= 80) return "A";
  if (score >= 75) return "B+";
  if (score >= 70) return "B";
  if (score >= 65) return "C+";
  if (score >= 60) return "C";
  if (score >= 55) return "D+";
  if (score >= 50) return "D";
  return "F";
}

export function GradesClient({
  course,
  initialGradingConfig,
  initialStudents,
}: GradesClientProps) {
  const router = useRouter();
  const [config, setConfig] = useState<GradingConfig>(initialGradingConfig);
  const [students, setStudents] = useState<StudentGradeItem[]>(initialStudents);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEligible, setFilterEligible] = useState<"ALL" | "ELIGIBLE" | "INELIGIBLE">("ALL");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Modal สัดส่วนคะแนน
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configForm, setConfigForm] = useState<GradingConfig>(initialGradingConfig);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Modal นำเข้า CSV
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  // คำนวณสรุปสถิติคะแนน
  const stats = useMemo(() => {
    const total = students.length;
    const scoredStudents = students.filter((s) => s.totalScore !== null && s.totalScore !== undefined);
    const sum = scoredStudents.reduce((acc, s) => acc + (s.totalScore || 0), 0);
    const average = scoredStudents.length > 0 ? Math.round((sum / scoredStudents.length) * 10) / 10 : 0;
    const passed = scoredStudents.filter((s) => (s.totalScore || 0) >= 50).length;
    const failed = scoredStudents.filter((s) => (s.totalScore || 0) < 50).length;
    const gradeA = scoredStudents.filter((s) => s.grade === "A").length;

    return { total, scoredCount: scoredStudents.length, average, passed, failed, gradeA };
  }, [students]);

  // ฟิลเตอร์นิสิตในตาราง
  const filteredStudents = useMemo(() => {
    return students.filter((st) => {
      const matchSearch =
        st.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        st.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        st.major.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;
      if (filterEligible === "ELIGIBLE" && !st.isEligible) return false;
      if (filterEligible === "INELIGIBLE" && st.isEligible) return false;
      return true;
    });
  }, [students, searchTerm, filterEligible]);

  // อัปเดตคะแนนของนิสิตแต่ละคนแบบเรียลไทม์
  const handleScoreChange = (
    enrollmentId: string,
    field: "assignmentScore" | "midtermScore" | "affectiveScore" | "finalScore" | "grade" | "gradeRemarks",
    value: string
  ) => {
    setStudents((prev) =>
      prev.map((item) => {
        if (item.enrollmentId !== enrollmentId) return item;

        const updated = { ...item };

        if (field === "grade") {
          updated.grade = value.trim() ? value.trim().toUpperCase() : null;
        } else if (field === "gradeRemarks") {
          updated.gradeRemarks = value;
        } else {
          const numVal = value.trim() === "" ? null : Number(value);
          const safeNum = numVal !== null && !isNaN(numVal) ? Math.max(0, numVal) : null;
          updated[field] = safeNum;

          // คำนวณคะแนนรวมใหม่ทันที
          const hasAny =
            updated.assignmentScore !== null ||
            updated.midtermScore !== null ||
            updated.affectiveScore !== null ||
            updated.finalScore !== null;

          if (hasAny) {
            const sum =
              (updated.assignmentScore || 0) +
              (updated.midtermScore || 0) +
              (updated.affectiveScore || 0) +
              (updated.finalScore || 0);
            updated.totalScore = Math.round(sum * 100) / 100;
            updated.grade = calculateGrade(updated.totalScore);
          } else {
            updated.totalScore = null;
            updated.grade = null;
          }
        }

        return updated;
      })
    );
    setHasChanges(true);
  };

  // บันทึกคะแนนทั้งหมด
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const itemsToUpdate = students.map((s) => ({
        enrollmentId: s.enrollmentId,
        assignmentScore: s.assignmentScore,
        midtermScore: s.midtermScore,
        affectiveScore: s.affectiveScore,
        finalScore: s.finalScore,
        totalScore: s.totalScore,
        grade: s.grade,
        gradeRemarks: s.gradeRemarks,
      }));

      const res = await batchUpdateCourseGradesAction(course.id, itemsToUpdate);
      if (res.success) {
        toast.success(`บันทึกคะแนนเรียบร้อยแล้ว (${res.updatedCount} คน)`);
        setHasChanges(false);
        router.refresh();
      } else {
        toast.error("ไม่สามารถบันทึกคะแนนได้");
      }
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการบันทึกคะแนน");
    } finally {
      setIsSaving(false);
    }
  };

  // บันทึกสัดส่วนคะแนน
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const sum =
      Number(configForm.assignmentMax) +
      Number(configForm.midtermMax) +
      Number(configForm.affectiveMax) +
      Number(configForm.finalMax);

    if (sum !== 100) {
      toast.error(`ผลรวมสัดส่วนคะแนนต้องเท่ากับ 100 คะแนน (ปัจจุบันรวมได้ ${sum} คะแนน)`);
      return;
    }

    setIsSavingConfig(true);
    try {
      const res = await updateCourseGradingConfigAction(course.id, configForm);
      if (res.success) {
        setConfig(configForm);
        setIsConfigOpen(false);
        toast.success("บันทึกสัดส่วนคะแนนสำเร็จ");
        router.refresh();
      } else {
        toast.error("ไม่สามารถบันทึกสัดส่วนคะแนนได้");
      }
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการตั้งค่า");
    } finally {
      setIsSavingConfig(false);
    }
  };

  // ส่งออกคะแนนเป็น CSV
  const handleExportCsv = () => {
    const headers = [
      "ลำดับ",
      "รหัสนิสิต",
      "คำนำหน้า",
      "ชื่อ",
      "นามสกุล/ฉายา",
      "ชั้นปี",
      "สาขาวิชา",
      "การเข้าเรียน(%)",
      "สิทธิ์สอบ",
      `คะแนนเก็บ (เต็ม ${config.assignmentMax})`,
      `สอบระหว่างภาค (เต็ม ${config.midtermMax})`,
      `จิตวิสัย (เต็ม ${config.affectiveMax})`,
      `สอบปลายภาค (เต็ม ${config.finalMax})`,
      "คะแนนรวม (เต็ม 100)",
      "เกรด",
      "หมายเหตุ",
    ];

    const rows = students.map((s, idx) => [
      idx + 1,
      `"${s.studentCode}"`,
      `"${s.title}"`,
      `"${s.firstName}"`,
      `"${s.lastName}"`,
      s.yearLevel,
      `"${s.major}"`,
      s.attendancePercentage,
      `"${s.isEligible ? "มีสิทธิ์สอบ" : "หมดสิทธิ์สอบ"}"`,
      s.assignmentScore ?? "",
      s.midtermScore ?? "",
      s.affectiveScore ?? "",
      s.finalScore ?? "",
      s.totalScore ?? "",
      `"${s.grade ?? ""}"`,
      `"${s.gradeRemarks ?? ""}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `grades_${course.courseCode}_${course.term.replace("/", "-")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // นำเข้าคะแนนจาก CSV
  const handleImportCsv = () => {
    if (!csvText.trim()) {
      toast.error("กรุณาวางข้อมูล CSV หรือข้อความตารางคะแนน");
      return;
    }

    setIsImporting(true);
    try {
      const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      let matchedCount = 0;

      const codeMap = new Map<string, StudentGradeItem>();
      students.forEach((s) => codeMap.set(s.studentCode.trim().toLowerCase(), s));

      const updatedStudents = [...students];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (i === 0 && (line.includes("รหัส") || line.includes("studentCode") || line.includes("ลำดับ"))) {
          continue;
        }

        const parts = line.split(",").map((p) => p.replace(/^"|"$/g, "").trim());
        if (parts.length < 2) continue;

        let code = "";
        let assign: number | null = null;
        let midterm: number | null = null;
        let affective: number | null = null;
        let final: number | null = null;
        let gradeStr: string | null = null;

        // รูปแบบ 1: รหัสนิสิต, คะแนนเก็บ, กลางภาค, จิตพิสัย, ปลายภาค
        if (parts[0].match(/^[0-9A-Za-z]+$/)) {
          code = parts[0].toLowerCase();
          assign = parts[1] !== undefined && parts[1] !== "" ? Number(parts[1]) : null;
          midterm = parts[2] !== undefined && parts[2] !== "" ? Number(parts[2]) : null;
          affective = parts[3] !== undefined && parts[3] !== "" ? Number(parts[3]) : null;
          final = parts[4] !== undefined && parts[4] !== "" ? Number(parts[4]) : null;
          if (parts[6]) gradeStr = parts[6];
        } else if (parts[1]?.match(/^[0-9A-Za-z]+$/)) {
          // มีคอลัมน์ลำดับอยู่หน้า
          code = parts[1].toLowerCase();
          assign = parts[9] !== undefined && parts[9] !== "" ? Number(parts[9]) : null;
          midterm = parts[10] !== undefined && parts[10] !== "" ? Number(parts[10]) : null;
          affective = parts[11] !== undefined && parts[11] !== "" ? Number(parts[11]) : null;
          final = parts[12] !== undefined && parts[12] !== "" ? Number(parts[12]) : null;
          if (parts[14]) gradeStr = parts[14];
        }

        const target = codeMap.get(code);
        if (target) {
          const idx = updatedStudents.findIndex((s) => s.enrollmentId === target.enrollmentId);
          if (idx !== -1) {
            const st = { ...updatedStudents[idx] };
            if (assign !== null && !isNaN(assign)) st.assignmentScore = assign;
            if (midterm !== null && !isNaN(midterm)) st.midtermScore = midterm;
            if (affective !== null && !isNaN(affective)) st.affectiveScore = affective;
            if (final !== null && !isNaN(final)) st.finalScore = final;

            const sum =
              (st.assignmentScore || 0) +
              (st.midtermScore || 0) +
              (st.affectiveScore || 0) +
              (st.finalScore || 0);
            st.totalScore = Math.round(sum * 100) / 100;
            st.grade = gradeStr || calculateGrade(st.totalScore);

            updatedStudents[idx] = st;
            matchedCount++;
          }
        }
      }

      setStudents(updatedStudents);
      setHasChanges(true);
      setIsImportOpen(false);
      setCsvText("");
      toast.success(`อัปเดตคะแนนจากไฟล์สำเร็จ (${matchedCount} คน) อย่าลืมกด 'บันทึกคะแนน'`);
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการประมวลผลไฟล์ CSV");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-slate-500 hover:text-primary text-xs font-semibold mb-2 transition">
            <Link href="/attendance/classes" className="inline-flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> ย้อนกลับไปหน้ารายวิชา
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary font-bold text-xs">
              {course.courseCode}
            </span>
            <span className="text-xs text-slate-400">ภาคการศึกษา {course.term}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            สมุดบันทึกคะแนนและเกรด (Gradebook)
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {course.courseName} • อาจารย์ผู้สอน: {course.primaryTeacher}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/attendance/classes/${course.id}/sessions`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition"
          >
            <Calendar className="w-3.5 h-3.5" />
            ตารางคาบเรียน
          </Link>

          <Link
            href={`/attendance/classes/${course.id}/students`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition"
          >
            <Users className="w-3.5 h-3.5" />
            รายชื่อนิสิต
          </Link>

          <Link
            href={`/attendance/classes/${course.id}/teachers`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-xs font-semibold shadow-2xs transition"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            อาจารย์ผู้สอน
          </Link>

          <Link
            href={`/attendance/classes/${course.id}/eligibility`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-semibold shadow-2xs transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            สรุปสิทธิ์สอบ
          </Link>

          <button
            type="button"
            onClick={() => {
              setConfigForm(config);
              setIsConfigOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 text-xs font-semibold shadow-2xs transition"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            สัดส่วนคะแนน
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            ส่งออก CSV
          </button>

          <button
            type="button"
            onClick={() => setIsImportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition"
          >
            <Upload className="w-3.5 h-3.5" />
            นำเข้า CSV
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition ${
              hasChanges
                ? "bg-primary text-white hover:bg-primary/90 animate-pulse"
                : "bg-primary text-white hover:bg-primary/90"
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? "กำลังบันทึก..." : hasChanges ? "บันทึกคะแนน *" : "บันทึกคะแนน"}
          </button>
        </div>
      </div>

      {/* สถิติภาพรวมและการตั้งค่าสัดส่วน */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <LiyonCard className="p-4 border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">จำนวนนิสิตทั้งหมด</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {stats.total} <span className="text-xs font-normal text-slate-400">รูป/คน</span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xs text-slate-400 mt-2">กรอกคะแนนแล้ว {stats.scoredCount} รูป/คน</p>
        </LiyonCard>

        <LiyonCard className="p-4 border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">คะแนนเฉลี่ยรวม</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {stats.average} <span className="text-xs font-normal text-slate-400">/ 100</span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Calculator className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xs text-slate-400 mt-2">คำนวณจากนิสิตที่ได้คะแนนแล้ว</p>
        </LiyonCard>

        <LiyonCard className="p-4 border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">ผ่านเกณฑ์ (≥ 50 คะแนน)</p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {stats.passed}{" "}
                <span className="text-xs font-normal text-slate-400">
                  ({stats.scoredCount > 0 ? Math.round((stats.passed / stats.scoredCount) * 100) : 0}%)
                </span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xs text-slate-400 mt-2">เกรด A ({stats.gradeA} คน)</p>
        </LiyonCard>

        <LiyonCard className="p-4 border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">สัดส่วนคะแนนเต็ม (100 คะแนน)</p>
              <div className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">
                <span title="คะแนนเก็บ">{config.assignmentMax}</span> +{" "}
                <span title="สอบกลางภาค">{config.midtermMax}</span> +{" "}
                <span title="จิตวิสัย">{config.affectiveMax}</span> +{" "}
                <span title="สอบปลายภาค">{config.finalMax}</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xs text-amber-600 dark:text-amber-400 mt-2">
            เก็บ {config.assignmentMax} | กลาง {config.midtermMax} | จิตวิสัย {config.affectiveMax} | ปลาย {config.finalMax}
          </p>
        </LiyonCard>
      </div>

      {/* Gradebook Table Card */}
      <LiyonCard className="p-0 overflow-hidden border-slate-200/80 dark:border-slate-800">
        {/* Table Filters and Search */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหารหัสนิสิต หรือชื่อ-นามสกุล..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <select
              value={filterEligible}
              onChange={(e) => setFilterEligible(e.target.value as any)}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">สถานะสิทธิ์สอบทั้งหมด</option>
              <option value="ELIGIBLE">เฉพาะผู้มีสิทธิ์สอบ (≥ 80%)</option>
              <option value="INELIGIBLE">เฉพาะผู้หมดสิทธิ์สอบ (&lt; 80%)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>แสดง {filteredStudents.length} จากทั้งหมด {students.length} รูป/คน</span>
            {hasChanges && (
              <span className="inline-flex items-center gap-1 text-amber-600 font-semibold text-2xs px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200">
                <AlertCircle className="w-3 h-3" /> มีการแก้ไขที่ยังไม่ได้บันทึก
              </span>
            )}
          </div>
        </div>

        {/* The Gradebook Spreadsheet Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 divide-y divide-slate-200/80 dark:divide-slate-800">
            <thead className="bg-slate-100/70 dark:bg-slate-800/60 font-semibold text-slate-600 dark:text-slate-300 select-none">
              <tr>
                <th className="py-3 px-3 text-center w-12">ที่</th>
                <th className="py-3 px-3 min-w-[110px]">รหัสนิสิต</th>
                <th className="py-3 px-3 min-w-[180px]">ชื่อ - นามสกุล / ฉายา</th>
                <th className="py-3 px-2 text-center min-w-[100px]" title="เวลาเรียนสะสมและสิทธิ์สอบ">
                  สิทธิ์สอบ
                </th>
                <th className="py-3 px-2 text-center min-w-[110px] bg-blue-50/50 dark:bg-blue-950/20">
                  คะแนนเก็บ
                  <span className="block text-2xs font-normal text-blue-600 dark:text-blue-400">
                    (เต็ม {config.assignmentMax})
                  </span>
                </th>
                <th className="py-3 px-2 text-center min-w-[110px] bg-purple-50/50 dark:bg-purple-950/20">
                  สอบระหว่างภาค
                  <span className="block text-2xs font-normal text-purple-600 dark:text-purple-400">
                    (เต็ม {config.midtermMax})
                  </span>
                </th>
                <th className="py-3 px-2 text-center min-w-[110px] bg-amber-50/50 dark:bg-amber-950/20">
                  จิตวิสัย / จิตพิสัย
                  <span className="block text-2xs font-normal text-amber-600 dark:text-amber-400">
                    (เต็ม {config.affectiveMax})
                  </span>
                </th>
                <th className="py-3 px-2 text-center min-w-[110px] bg-emerald-50/50 dark:bg-emerald-950/20">
                  สอบปลายภาค
                  <span className="block text-2xs font-normal text-emerald-600 dark:text-emerald-400">
                    (เต็ม {config.finalMax})
                  </span>
                </th>
                <th className="py-3 px-2 text-center min-w-[90px] bg-slate-200/40 dark:bg-slate-700/40 font-bold">
                  รวม
                  <span className="block text-2xs font-normal text-slate-500">(เต็ม 100)</span>
                </th>
                <th className="py-3 px-2 text-center min-w-[80px] bg-slate-200/60 dark:bg-slate-700/60 font-bold">
                  เกรด
                </th>
                <th className="py-3 px-3 min-w-[140px]">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-normal">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-12 text-slate-400">
                    ไม่พบข้อมูลนิสิตที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st, index) => {
                  const isEligible = st.isEligible;
                  const total = st.totalScore;
                  const grade = st.grade;

                  return (
                    <tr
                      key={st.enrollmentId}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-2.5 px-3 text-center text-slate-400">{index + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-800 dark:text-slate-200">
                        {st.studentCode}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {st.title} {st.firstName} {st.lastName}
                        </div>
                        <div className="text-2xs text-slate-400">
                          ปี {st.yearLevel} • {st.major}
                        </div>
                      </td>

                      {/* สิทธิ์สอบ */}
                      <td className="py-2.5 px-2 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-bold ${
                            isEligible
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                              : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                          }`}
                          title={`เข้าเรียน ${st.attendancePercentage}%`}
                        >
                          {st.attendancePercentage}%
                        </span>
                      </td>

                      {/* ช่องกรอก: คะแนนเก็บ */}
                      <td className="py-2 px-2 text-center bg-blue-50/20 dark:bg-blue-950/10">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          max={config.assignmentMax}
                          value={st.assignmentScore ?? ""}
                          onChange={(e) =>
                            handleScoreChange(st.enrollmentId, "assignmentScore", e.target.value)
                          }
                          placeholder="-"
                          className="w-16 py-1 px-1.5 text-center text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
                        />
                      </td>

                      {/* ช่องกรอก: สอบระหว่างภาค */}
                      <td className="py-2 px-2 text-center bg-purple-50/20 dark:bg-purple-950/10">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          max={config.midtermMax}
                          value={st.midtermScore ?? ""}
                          onChange={(e) =>
                            handleScoreChange(st.enrollmentId, "midtermScore", e.target.value)
                          }
                          placeholder="-"
                          className="w-16 py-1 px-1.5 text-center text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/30"
                        />
                      </td>

                      {/* ช่องกรอก: จิตวิสัย / จิตพิสัย */}
                      <td className="py-2 px-2 text-center bg-amber-50/20 dark:bg-amber-950/10">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          max={config.affectiveMax}
                          value={st.affectiveScore ?? ""}
                          onChange={(e) =>
                            handleScoreChange(st.enrollmentId, "affectiveScore", e.target.value)
                          }
                          placeholder="-"
                          className="w-16 py-1 px-1.5 text-center text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                        />
                      </td>

                      {/* ช่องกรอก: สอบปลายภาค */}
                      <td className="py-2 px-2 text-center bg-emerald-50/20 dark:bg-emerald-950/10">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          max={config.finalMax}
                          value={st.finalScore ?? ""}
                          onChange={(e) =>
                            handleScoreChange(st.enrollmentId, "finalScore", e.target.value)
                          }
                          placeholder="-"
                          className="w-16 py-1 px-1.5 text-center text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
                        />
                      </td>

                      {/* รวมคะแนน (Auto Sum) */}
                      <td className="py-2.5 px-2 text-center bg-slate-100/50 dark:bg-slate-800/40 font-mono font-bold text-sm">
                        {total !== null && total !== undefined ? (
                          <span
                            className={
                              total >= 80
                                ? "text-emerald-600 dark:text-emerald-400"
                                : total >= 50
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-rose-600 dark:text-rose-400"
                            }
                          >
                            {total}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* เกรดที่ได้ */}
                      <td className="py-2.5 px-2 text-center bg-slate-100/80 dark:bg-slate-800/60 font-bold">
                        {grade ? (
                          <span
                            className={`px-2 py-0.5 rounded-lg text-xs font-black ${
                              grade === "A"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : grade.startsWith("B")
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                : grade.startsWith("C")
                                ? "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300"
                                : grade.startsWith("D")
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                            }`}
                          >
                            {grade}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* หมายเหตุ */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={st.gradeRemarks}
                          onChange={(e) =>
                            handleScoreChange(st.enrollmentId, "gradeRemarks", e.target.value)
                          }
                          placeholder="หมายเหตุเพิ่มเติม..."
                          className="w-full py-1 px-2 text-2xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-primary"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>
              เกณฑ์ตัดเกรด มจร. อัตโนมัติ: A (≥ 80), B+ (75-79), B (70-74), C+ (65-69), C (60-64), D+
              (55-59), D (50-54), F (&lt; 50)
            </span>
          </div>
          {hasChanges && (
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 shadow-sm transition"
            >
              {isSaving ? "กำลังบันทึก..." : "บันทึกคะแนนทั้งหมด"}
            </button>
          )}
        </div>
      </LiyonCard>

      {/* Modal ปรับสัดส่วนคะแนนเต็ม */}
      <LiyonDialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <LiyonDialogHeader className="p-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    ตั้งค่าสัดส่วนคะแนนรายวิชา
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    กำหนดคะแนนเต็มของแต่ละส่วน (ผลรวมต้องได้ 100 คะแนน)
                  </p>
                </div>
                <LiyonDialogCloseButton onClick={() => setIsConfigOpen(false)} />
              </div>
            </LiyonDialogHeader>

            <form onSubmit={handleSaveConfig}>
              <LiyonDialogBody className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    คะแนนเก็บ / การบ้าน / ชิ้นงาน (Assignment)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={configForm.assignmentMax}
                    onChange={(e) =>
                      setConfigForm({ ...configForm, assignmentMax: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    การสอบระหว่างภาค / สอบกลางภาค (Midterm Exam)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={configForm.midtermMax}
                    onChange={(e) =>
                      setConfigForm({ ...configForm, midtermMax: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    จิตวิสัย / จิตพิสัย / คุณธรรมจริยธรรม (Affective Domain)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={configForm.affectiveMax}
                    onChange={(e) =>
                      setConfigForm({ ...configForm, affectiveMax: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    การสอบปลายภาค (Final Exam)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={configForm.finalMax}
                    onChange={(e) =>
                      setConfigForm({ ...configForm, finalMax: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-sm font-bold">
                  <span>คะแนนรวมทั้งหมด:</span>
                  <span
                    className={
                      Number(configForm.assignmentMax) +
                        Number(configForm.midtermMax) +
                        Number(configForm.affectiveMax) +
                        Number(configForm.finalMax) ===
                      100
                        ? "text-emerald-600 font-extrabold text-base"
                        : "text-rose-600 font-extrabold text-base"
                    }
                  >
                    {Number(configForm.assignmentMax) +
                      Number(configForm.midtermMax) +
                      Number(configForm.affectiveMax) +
                      Number(configForm.finalMax)}{" "}
                    / 100
                  </span>
                </div>
              </LiyonDialogBody>

              <LiyonDialogFooter className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSavingConfig}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary/90 shadow-sm"
                >
                  {isSavingConfig ? "กำลังบันทึก..." : "บันทึกสัดส่วน"}
                </button>
              </LiyonDialogFooter>
            </form>
          </div>
        </div>
      </LiyonDialog>

      {/* Modal นำเข้า CSV */}
      <LiyonDialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <LiyonDialogHeader className="p-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    นำเข้าคะแนนจากไฟล์ CSV / ข้อความ
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    วางข้อมูล CSV ที่คัดลอกมาจาก Excel หรือไฟล์ตารางคะแนน
                  </p>
                </div>
                <LiyonDialogCloseButton onClick={() => setIsImportOpen(false)} />
              </div>
            </LiyonDialogHeader>

            <LiyonDialogBody className="p-6 space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300">
                <p className="font-bold mb-1">รูปแบบคอลัมน์ที่รองรับ:</p>
                <code>รหัสนิสิต, คะแนนเก็บ, สอบกลางภาค, จิตวิสัย, สอบปลายภาค</code>
                <p className="mt-1 text-2xs text-blue-600/80 dark:text-blue-400">
                  หรือใช้ไฟล์ CSV ที่ส่งออกจากระบบนี้แล้วนำกลับมาวางได้เลยครับ
                </p>
              </div>

              <div>
                <textarea
                  rows={8}
                  placeholder={`690101001, 25, 26, 9, 28\n690101002, 28, 27, 10, 29`}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </LiyonDialogBody>

            <LiyonDialogFooter className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsImportOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleImportCsv}
                disabled={isImporting}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary/90 shadow-sm"
              >
                {isImporting ? "กำลังนำเข้า..." : "ประมวลผลคะแนน"}
              </button>
            </LiyonDialogFooter>
          </div>
        </div>
      </LiyonDialog>
    </div>
  );
}
