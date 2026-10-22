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
  X,
  Printer,
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
import { formatDate } from "@/shared/lib/format";
import { OfficialGradeDocument } from "./official-grade-document";

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
  isEligible: boolean | null;
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
    courseNameEn?: string;
    credits: number;
    section?: string;
    term: string;
    academicYear: string;
    semester: number;
    room: string;
    primaryTeacher: string;
    degree?: string;
    programLanguage?: string;
    faculty?: string;
    yearLevel?: string;
    major?: string;
    startDate?: string | null;
    endDate?: string | null;
    logoUrl?: string;
  };
  initialGradingConfig: GradingConfig;
  initialStudents: StudentGradeItem[];
  isSuperAdmin?: boolean;
}

// เกณฑ์คะแนนตามแบบฟอร์มทางการ คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
function calculateGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 85) return "B+";
  if (score >= 80) return "B";
  if (score >= 75) return "C+";
  if (score >= 70) return "C";
  if (score >= 65) return "D+";
  if (score >= 60) return "D";
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
  const [documentPrintMode, setDocumentPrintMode] = useState<"final" | "midterm" | null>(null);

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

  // ส่งออกคะแนนเป็น CSV พร้อมหัวกระดาษรายงานครบถ้วน
  const handleExportCsv = () => {
    const startStr = course.startDate ? formatDate(course.startDate, "th") : "-";
    const endStr = course.endDate ? formatDate(course.endDate, "th") : "-";

    const headerLines = [
      `"ใบรายการบันทึกคะแนนและเกรด (Grade Record Report)"`,
      `"ระดับหลักสูตร:","${course.degree || "ระดับปริญญาตรี"}","หลักสูตรภาคภาษา:","${course.programLanguage || "หลักสูตรภาคภาษาไทย"}"`,
      `"คณะ:","${course.faculty || "นิสิตคณะพุทธศาสตร์"}","ชั้นปีที่:","${course.yearLevel || "ชั้นปีที่ 1"}","สาขาวิชา:","${course.major || "สาขาวิชาพระพุทธศาสนา"}"`,
      `"ภาคการศึกษา:","${course.semester}","ปีการศึกษา:","${course.academicYear}","ภาคเรียน:","${course.term}"`,
      `"รหัสวิชา:","${course.courseCode}","ชื่อรายวิชา:","${course.courseName}${course.courseNameEn ? ` (${course.courseNameEn})` : ""}","หน่วยกิต:","${course.credits} หน่วยกิต"`,
      `"ชื่ออาจารย์ผู้สอน:","${course.primaryTeacher}","กลุ่ม/ห้องเรียน:","กลุ่ม ${course.section || "1"} / ห้อง ${course.room || "-"}"`,
      `"วันเปิดเรียน:","${startStr}","วันสิ้นสุด:","${endStr}"`,
      `"วันที่ออกรายงาน:","${formatDate(new Date(), "th", { time: true })}","จำนวนนิสิตทั้งหมด:","${students.length} รูป/คน"`,
      `""`,
    ];

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

    const csvContent = "\uFEFF" + [...headerLines, headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `เกรด_${course.courseCode}_${course.courseName.replace(/[\/\\:*?"<>|]/g, "_")}_${course.term.replace("/", "-")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("ส่งออกไฟล์ CSV พร้อมหัวกระดาษสำเร็จ");
  };

  // ส่งออกเป็น Excel (.xls) พร้อมตารางหัวกระดาษและการจัดรูปแบบ
  const handleExportExcel = () => {
    const startStr = course.startDate ? formatDate(course.startDate, "th") : "-";
    const endStr = course.endDate ? formatDate(course.endDate, "th") : "-";
    const reportDate = formatDate(new Date(), "th", { time: true });

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"/>
        <style>
          body { font-family: 'Sarabun', 'TH Sarabun New', Tahoma, sans-serif; font-size: 13px; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
          .header-table td { padding: 4px 8px; font-size: 13px; }
          .title { font-size: 17px; font-weight: bold; text-align: center; color: #1e293b; }
          .subtitle { font-size: 14px; font-weight: bold; text-align: center; color: #334155; }
          .meta-label { font-weight: bold; color: #334155; background-color: #f1f5f9; border: 1px solid #cbd5e1; width: 160px; }
          .meta-value { border: 1px solid #cbd5e1; padding-left: 6px; }
          .data-table th { background-color: #e2e8f0; color: #0f172a; font-weight: bold; border: 1px solid #94a3b8; padding: 6px 8px; text-align: center; font-size: 12px; }
          .data-table td { border: 1px solid #cbd5e1; padding: 5px 6px; font-size: 12px; vertical-align: middle; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .grade-pass { font-weight: bold; color: #15803d; }
          .grade-fail { font-weight: bold; color: #b91c1c; }
        </style>
      </head>
      <body>
        <!-- หัวกระดาษรายงาน -->
        <table class="header-table">
          <tr>
            <td colspan="16" class="title">มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย</td>
          </tr>
          <tr>
            <td colspan="16" class="subtitle">ใบรายการบันทึกคะแนนและเกรด (Grade Record Report)</td>
          </tr>
          <tr>
            <td colspan="16" class="subtitle" style="font-size: 12px; font-weight: normal; color: #64748b;">ออกรายงานเมื่อ: ${reportDate}</td>
          </tr>
          <tr><td colspan="16"></td></tr>
          <tr>
            <td class="meta-label">ระดับหลักสูตร:</td>
            <td class="meta-value" colspan="5">${course.degree || "ระดับปริญญาตรี"}</td>
            <td class="meta-label">หลักสูตรภาคภาษา:</td>
            <td class="meta-value" colspan="9">${course.programLanguage || "หลักสูตรภาคภาษาไทย"}</td>
          </tr>
          <tr>
            <td class="meta-label">คณะ:</td>
            <td class="meta-value" colspan="5">${course.faculty || "นิสิตคณะพุทธศาสตร์"}</td>
            <td class="meta-label">ชั้นปีที่:</td>
            <td class="meta-value" colspan="3">${course.yearLevel || "ชั้นปีที่ 1"}</td>
            <td class="meta-label">สาขาวิชา:</td>
            <td class="meta-value" colspan="5">${course.major || "สาขาวิชาพระพุทธศาสนา"}</td>
          </tr>
          <tr>
            <td class="meta-label">ภาคการศึกษา:</td>
            <td class="meta-value" colspan="2">ภาคการศึกษาที่ ${course.semester}</td>
            <td class="meta-label">ปีการศึกษา:</td>
            <td class="meta-value" colspan="2">${course.academicYear}</td>
            <td class="meta-label">ภาคเรียน:</td>
            <td class="meta-value" colspan="9">${course.term}</td>
          </tr>
          <tr>
            <td class="meta-label">รหัสวิชา:</td>
            <td class="meta-value" colspan="2" style="font-weight: bold;">${course.courseCode}</td>
            <td class="meta-label">ชื่อรายวิชา:</td>
            <td class="meta-value" colspan="6" style="font-weight: bold;">${course.courseName}${course.courseNameEn ? ` (${course.courseNameEn})` : ""}</td>
            <td class="meta-label">หน่วยกิต:</td>
            <td class="meta-value" colspan="5">${course.credits} หน่วยกิต</td>
          </tr>
          <tr>
            <td class="meta-label">อาจารย์ผู้สอน:</td>
            <td class="meta-value" colspan="5">${course.primaryTeacher}</td>
            <td class="meta-label">ห้องเรียน/กลุ่ม:</td>
            <td class="meta-value" colspan="9">กลุ่ม ${course.section || "1"} / ห้อง ${course.room || "-"}</td>
          </tr>
          <tr>
            <td class="meta-label">วันเปิดเรียน:</td>
            <td class="meta-value" colspan="5">${startStr}</td>
            <td class="meta-label">วันสิ้นสุด:</td>
            <td class="meta-value" colspan="9">${endStr}</td>
          </tr>
          <tr><td colspan="16"></td></tr>
        </table>

        <!-- ตารางคะแนนและเกรด -->
        <table class="data-table">
          <thead>
            <tr>
              <th>ลำดับ</th>
              <th>รหัสนิสิต</th>
              <th>คำนำหน้า</th>
              <th>ชื่อ</th>
              <th>นามสกุล / ฉายา</th>
              <th>ชั้นปี</th>
              <th>สาขาวิชา</th>
              <th>การเข้าเรียน (%)</th>
              <th>สิทธิ์สอบ</th>
              <th>คะแนนเก็บ (${config.assignmentMax})</th>
              <th>กลางภาค (${config.midtermMax})</th>
              <th>จิตวิสัย (${config.affectiveMax})</th>
              <th>ปลายภาค (${config.finalMax})</th>
              <th>รวม (100)</th>
              <th>เกรด</th>
              <th>หมายเหตุ</th>
            </tr>
          </thead>
          <tbody>
            ${students
              .map(
                (s, idx) => `
              <tr>
                <td class="text-center">${idx + 1}</td>
                <td class="text-center" style="mso-number-format:'\\@';">${s.studentCode}</td>
                <td class="text-center">${s.title || ""}</td>
                <td>${s.firstName}</td>
                <td>${s.lastName}</td>
                <td class="text-center">${s.yearLevel}</td>
                <td>${s.major || "-"}</td>
                <td class="text-center">${s.attendancePercentage}%</td>
                <td class="text-center">${s.isEligible ? "มีสิทธิ์สอบ" : "หมดสิทธิ์สอบ"}</td>
                <td class="text-right">${s.assignmentScore ?? "-"}</td>
                <td class="text-right">${s.midtermScore ?? "-"}</td>
                <td class="text-right">${s.affectiveScore ?? "-"}</td>
                <td class="text-right">${s.finalScore ?? "-"}</td>
                <td class="text-right" style="font-weight: bold;">${s.totalScore ?? "-"}</td>
                <td class="text-center ${s.grade === "F" ? "grade-fail" : "grade-pass"}">${s.grade ?? "-"}</td>
                <td>${s.gradeRemarks || ""}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(["\uFEFF" + html], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `เกรด_${course.courseCode}_${course.courseName.replace(/[\/\\:*?"<>|]/g, "_")}_${course.term.replace("/", "-")}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("ส่งออกไฟล์ Excel พร้อมหัวกระดาษสำเร็จ");
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
        // ข้ามบรรทัดหัวรายงาน บรรทัดคอมเมนต์ หรือหัวตาราง
        if (
          !line ||
          line.startsWith("#") ||
          line.includes("ใบรายการบันทึกคะแนน") ||
          line.includes("ระดับหลักสูตร") ||
          line.includes("รหัสวิชา:") ||
          line.includes("ชื่ออาจารย์ผู้สอน:") ||
          line.includes("วันเปิดเรียน:") ||
          line.includes("ภาคการศึกษา:") ||
          line.includes("นิสิตคณะพุทธศาสตร์") ||
          line.includes("วันที่ออกรายงาน:") ||
          line.includes("studentCode") ||
          (line.includes("รหัส") && line.includes("ลำดับ"))
        ) {
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

          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary font-bold text-xs">
              {course.courseCode}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold text-xs border border-blue-200 dark:border-blue-800">
              {course.degree || "ระดับปริญญาตรี"}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold text-xs border border-emerald-200 dark:border-emerald-800">
              {course.programLanguage || "หลักสูตรภาคภาษาไทย"}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-semibold text-xs border border-amber-200 dark:border-amber-800">
              {course.faculty || "คณะพุทธศาสตร์"}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              • {course.yearLevel || "ชั้นปีที่ 1"} • ภาคเรียน {course.term} (ภาค {course.semester}/{course.academicYear})
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            สมุดบันทึกคะแนนและเกรด (Gradebook)
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">
            <span className="font-semibold text-slate-900 dark:text-white">{course.courseName}</span>
            {course.courseNameEn && <span className="text-slate-500"> ({course.courseNameEn})</span>}
            {" • "}
            <span>สาขาวิชา: <b className="text-slate-800 dark:text-slate-200">{course.major || "-"}</b></span>
            {" • "}
            <span>อาจารย์ผู้สอน: <b className="text-slate-800 dark:text-slate-200">{course.primaryTeacher}</b></span>
            {course.startDate && (
              <>
                {" • "}
                <span className="text-slate-500">
                  วันเปิดเรียน-สิ้นสุด: {formatDate(course.startDate, "th")} - {formatDate(course.endDate, "th")}
                </span>
              </>
            )}
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
            onClick={() => setDocumentPrintMode("final")}
            title="พิมพ์ใบกรอกคะแนนผลการสอบปลายภาค ตามแบบฟอร์มทางการคณะพุทธศาสตร์ มจร."
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold shadow-2xs transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            ใบกรอกคะแนนปลายภาค (ทางการ)
          </button>

          <button
            type="button"
            onClick={() => setDocumentPrintMode("midterm")}
            title="พิมพ์ใบเก็บคะแนนและวัดผลระหว่างภาค สำหรับอาจารย์ใช้ติดตามคะแนนสะสม"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            ใบเก็บคะแนนระหว่างภาค
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            title="ส่งออกเป็นไฟล์ CSV พร้อมหัวกระดาษข้อมูลรายวิชาครบถ้วน"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            ส่งออก CSV
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            title="ส่งออกเป็นไฟล์ Excel (.xls) พร้อมตารางหัวกระดาษและการจัดรูปแบบสวยงาม"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ส่งออก Excel
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
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    ตั้งค่าสัดส่วนคะแนนรายวิชา
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    กำหนดคะแนนเต็มของแต่ละส่วน (ผลรวมต้องได้ 100 คะแนน)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(false)}
                  className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

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
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    นำเข้าคะแนนจากไฟล์ CSV / ข้อความ
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    วางข้อมูล CSV ที่คัดลอกมาจาก Excel หรือไฟล์ตารางคะแนน
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsImportOpen(false)}
                  className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

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
      {/* โมดอลแสดงและพิมพ์เอกสารทางการ (ปลายภาค / ระหว่างภาค) */}
      {documentPrintMode && (
        <OfficialGradeDocument
          course={course}
          config={config}
          students={students}
          defaultMode={documentPrintMode}
          onClose={() => setDocumentPrintMode(null)}
        />
      )}

    </div>
  );
}
