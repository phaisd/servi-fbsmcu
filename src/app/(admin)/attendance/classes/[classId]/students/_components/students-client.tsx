"use client";

import { useState } from "react";
import {
  Users,
  Search,
  Plus,
  Trash2,
  FileSpreadsheet,
  ArrowLeft,
  GraduationCap,
  Download,
  Upload,
  AlertTriangle,
  UserCheck,
  Calendar,
  CheckCircle2,
  Filter,
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
import { useRouter } from "next/navigation";
import {
  enrollStudentAction,
  removeStudentAction,
  batchEnrollStudentsAction,
  getAvailableStudentsForCohortAction,
  enrollCohortStudentsAction,
} from "@/features/attendance/actions";
import { toast } from "sonner";


interface StudentItem {
  id: string;
  status: string;
  student: {
    id: string;
    studentCode: string;
    firstName: string;
    lastName: string;
    title?: string | null;
    yearLevel: number;
    department?: string | null;
    faculty?: string | null;
  };
}

interface StudentsClientProps {
  classObj: any;
  initialEnrollments: any[];
  isSuperAdmin?: boolean;
}

export function StudentsClient({ classObj, initialEnrollments, isSuperAdmin: _isSuperAdmin }: StudentsClientProps) {
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<StudentItem[]>(initialEnrollments);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal State สำหรับเพิ่มนิสิตเดี่ยว
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    studentCode: "",
    title: "นาย",
    firstName: "",
    lastName: "",
    yearLevel: 3,
    department: "สาขาวิชาพระพุทธศาสนา",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State สำหรับนำเข้า CSV/Excel
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  // Modal สำหรับลบนิสิต
  const [deleteTarget, setDeleteTarget] = useState<StudentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal State สำหรับดึงนิสิตตามชั้นปี / สาขาวิชา (Cohort Enrollment)
  const [isCohortOpen, setIsCohortOpen] = useState(false);
  const [isLoadingCohort, setIsLoadingCohort] = useState(false);
  const [cohortStudents, setCohortStudents] = useState<any[]>([]);
  const [cohortYearFilter, setCohortYearFilter] = useState<number>(0);
  const [cohortDeptFilter, setCohortDeptFilter] = useState<string>("ALL");
  const [cohortSearch, setCohortSearch] = useState<string>("");
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);
  const [selectedCohortIds, setSelectedCohortIds] = useState<string[]>([]);
  const [isEnrollingCohort, setIsEnrollingCohort] = useState(false);

  async function handleOpenCohortModal() {
    setIsCohortOpen(true);
    setIsLoadingCohort(true);
    try {
      const res = await getAvailableStudentsForCohortAction(classObj.id);
      if (res.success && res.students) {
        setCohortStudents(res.students);
        setDepartmentOptions(res.departmentOptions || []);
        setSelectedCohortIds(res.students.map((s: any) => s.id));
      }
    } catch (err: any) {
      toast.error(err.message || "ไม่สามารถดึงข้อมูลนิสิตได้");
    } finally {
      setIsLoadingCohort(false);
    }
  }

  const filteredCohortStudents = cohortStudents.filter((s) => {
    const matchYear = cohortYearFilter === 0 || s.yearLevel === cohortYearFilter;
    const matchDept = cohortDeptFilter === "ALL" || s.department === cohortDeptFilter;
    const q = cohortSearch.toLowerCase().trim();
    const matchSearch =
      !q ||
      s.studentCode.toLowerCase().includes(q) ||
      s.firstName.toLowerCase().includes(q) ||
      s.lastName.toLowerCase().includes(q);
    return matchYear && matchDept && matchSearch;
  });

  function handleToggleCohortStudent(id: string) {
    setSelectedCohortIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function handleToggleAllCohort() {
    const visibleIds = filteredCohortStudents.map((s) => s.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedCohortIds.includes(id));
    if (allSelected) {
      setSelectedCohortIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedCohortIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  }

  async function handleConfirmCohortEnrollment() {
    if (selectedCohortIds.length === 0) {
      toast.error("กรุณาเลือกนิสิตอย่างน้อย 1 คน");
      return;
    }

    try {
      setIsEnrollingCohort(true);
      const res = await enrollCohortStudentsAction(classObj.id, selectedCohortIds);
      if (res.success) {
        toast.success(`ลงทะเบียนนิสิตเรียบร้อยแล้ว ${res.enrolledCount} รูป/คน!`);
        setIsCohortOpen(false);
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการลงทะเบียนนิสิต");
    } finally {
      setIsEnrollingCohort(false);
    }
  }


  const filteredEnrollments = enrollments.filter((item) => {
    const q = searchTerm.toLowerCase();
    const st = item.student;
    return (
      st.studentCode.toLowerCase().includes(q) ||
      st.firstName.toLowerCase().includes(q) ||
      st.lastName.toLowerCase().includes(q) ||
      (st.department && st.department.toLowerCase().includes(q))
    );
  });

  // ฟังก์ชันเพิ่มนิสิตเดี่ยว
  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.studentCode.trim() || !formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error("กรุณาระบุรหัสนิสิต ชื่อ และนามสกุล");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await enrollStudentAction({
        classId: classObj.id,
        ...formData,
      });

      if (res.success && res.enrollment) {
        toast.success(`เพิ่มนิสิต ${formData.firstName} ${formData.lastName} เรียบร้อยแล้ว`);
        setEnrollments([...enrollments, res.enrollment as any]);
        setIsAddOpen(false);
        setFormData({
          studentCode: "",
          title: "นาย",
          firstName: "",
          lastName: "",
          yearLevel: 3,
          department: "สาขาวิชาพระพุทธศาสนา",
        });
      }
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการเพิ่มนิสิต");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ฟังก์ชันลบนิสิตออกจากรายวิชา
  async function handleConfirmDelete() {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      const res = await removeStudentAction(classObj.id, deleteTarget.id);
      if (res.success) {
        toast.success(`ลบนิสิต ${deleteTarget.student.firstName} ออกจากรายวิชาแล้ว`);
        setEnrollments(enrollments.filter((e) => e.id !== deleteTarget.id));
        setDeleteTarget(null);
      }
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการลบนิสิต");
    } finally {
      setIsDeleting(false);
    }
  }

  // ฟังก์ชันนำเข้า CSV
  async function handleImportCsv() {
    if (!csvText.trim()) {
      toast.error("กรุณาวางข้อมูล CSV หรือพิมพ์ข้อมูล");
      return;
    }

    const lines = csvText.trim().split("\n");
    const parsedStudents: any[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      // รองรับการคั่นด้วย comma หรือ tab
      const parts = line.includes("\t") ? line.split("\t") : line.split(",");
      if (parts.length >= 3) {
        // รูปแบบ: รหัสนิสิต, ชื่อ, นามสกุล, [คำนำหน้า], [ชั้นปี], [สาขา]
        const studentCode = parts[0].trim();
        const firstName = parts[1].trim();
        const lastName = parts[2].trim();
        const title = parts[3]?.trim() || "";
        const yearLevel = parts[4] ? parseInt(parts[4].trim(), 10) || 1 : 1;
        const department = parts[5]?.trim() || "สาขาวิชาพระพุทธศาสนา";

        if (studentCode && firstName && lastName) {
          parsedStudents.push({
            studentCode,
            firstName,
            lastName,
            title,
            yearLevel,
            department,
          });
        }
      }
    }

    if (parsedStudents.length === 0) {
      toast.error("ไม่พบคอลัมน์ข้อมูลที่ถูกต้อง กรุณาตรวจสอบรูปแบบ (รหัสนิสิต, ชื่อ, นามสกุล)");
      return;
    }

    try {
      setIsImporting(true);
      const res = await batchEnrollStudentsAction(classObj.id, parsedStudents);
      if (res.success) {
        toast.success(`นำเข้านิสิตสำเร็จ ${res.successCount} คน` + (res.errors?.length ? ` (พบข้อผิดพลาด ${res.errors.length} รายการ)` : ""));
        window.location.reload();
      }
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการนำเข้าข้อมูล");
    } finally {
      setIsImporting(false);
    }
  }

  // ส่งออกรายชื่อ CSV
  function handleExportCsv() {
    const headers = ["รหัสนิสิต", "คำนำหน้า", "ชื่อ", "นามสกุล", "ชั้นปี", "สาขาวิชา", "สถานะ"];
    const rows = enrollments.map((e) => [
      `"${e.student.studentCode}"`,
      `"${e.student.title || ""}"`,
      `"${e.student.firstName}"`,
      `"${e.student.lastName}"`,
      e.student.yearLevel,
      `"${e.student.department || ""}"`,
      `"${e.status}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `students_${classObj.courseCode}_${classObj.term.replace("/", "-")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

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
              {classObj.courseCode}
            </span>
            <span className="text-xs text-slate-400">ภาคการศึกษา {classObj.term}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            จัดการรายชื่อนิสิต (Class Roster)
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{classObj.courseName}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/attendance/classes/${classObj.id}/sessions`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition"
          >
            <Calendar className="w-3.5 h-3.5" />
            ตารางคาบเรียน
          </Link>

          <Link
            href={`/attendance/classes/${classObj.id}/teachers`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-xs font-semibold shadow-2xs transition"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            อาจารย์ผู้สอน
          </Link>

          <Link
            href={`/attendance/classes/${classObj.id}/eligibility`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-semibold shadow-2xs transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            สรุปสิทธิ์สอบ
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
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            ส่งออก CSV
          </button>

          <button
            type="button"
            onClick={handleOpenCohortModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-xs font-semibold shadow-2xs transition"
          >
            <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            ดึงนิสิตตามชั้นปี/สาขา
          </button>

          <button
            type="button"
            onClick={() => setIsImportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 text-xs font-semibold shadow-2xs transition"
          >
            <Upload className="w-3.5 h-3.5" />
            นำเข้า CSV
          </button>


          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            เพิ่มนิสิต
          </button>
        </div>
      </div>

      {/* Roster Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาด้วยรหัสนิสิต, ชื่อ, นามสกุล, หรือสาขาวิชา..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm shadow-sm"
          />
        </div>

        <div className="bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
          <span className="text-xs text-slate-500">จำนวนนิสิตลงทะเบียน:</span>
          <span className="font-bold text-base text-primary">{filteredEnrollments.length} รูป/คน</span>
        </div>
      </div>

      {/* Roster Table */}
      <LiyonCard className="overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 font-semibold uppercase">
              <tr>
                <th className="py-3 px-4">ลำดับ</th>
                <th className="py-3 px-4">รหัสนิสิต</th>
                <th className="py-3 px-4">ชื่อ - ฉายา / นามสกุล</th>
                <th className="py-3 px-4">ชั้นปี</th>
                <th className="py-3 px-4">สาขาวิชา</th>
                <th className="py-3 px-4">สถานะ</th>
                <th className="py-3 px-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredEnrollments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">ยังไม่มีรายชื่อนิสิตในวิชานี้</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      กดปุ่ม "เพิ่มนิสิต" หรือ "นำเข้า CSV" เพื่อเพิ่มรายชื่อนิสิต
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEnrollments.map((item, idx) => {
                  const st = item.student;
                  const fullName = `${st.title || ""} ${st.firstName} ${st.lastName}`.trim();

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 text-xs text-slate-400 font-medium">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {st.studentCode}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                        {fullName}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">
                        ปี {st.yearLevel}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">
                        {st.department || "-"}
                      </td>
                      <td className="py-3 px-4">
                        <StatusPill tone="ok" className="text-2xs">
                          {item.status}
                        </StatusPill>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          title="ลบนิสิตออกจากรายวิชา"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </LiyonCard>

      {/* Modal: เพิ่มนิสิตรายบุคคล */}
      <LiyonDialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <LiyonDialogHeader
          title="เพิ่มนิสิตเข้าสู่รายวิชา"
          description="กรอกรหัสนิสิตและชื่อ-นามสกุล ระบบจะทำการตรวจสอบและลงทะเบียนเข้าสู่รายวิชาทันที"
        />
        <LiyonDialogCloseButton label="ปิด" />
        <form onSubmit={handleAddStudent}>
          <LiyonDialogBody className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                รหัสนิสิต *
              </label>
              <input
                type="text"
                required
                placeholder="เช่น 660101001"
                value={formData.studentCode}
                onChange={(e) => setFormData({ ...formData, studentCode: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-sm"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  คำนำหน้า
                </label>
                <input
                  type="text"
                  placeholder="เช่น พระ, พระมหา, นาย"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ชื่อ *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ธีรภัทร"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  นามสกุล / ฉายา *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ญาณเมธี"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ชั้นปี
                </label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={formData.yearLevel}
                  onChange={(e) => setFormData({ ...formData, yearLevel: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  สาขาวิชา
                </label>
                <input
                  type="text"
                  placeholder="เช่น สาขาวิชาพระพุทธศาสนา"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                />
              </div>
            </div>
          </LiyonDialogBody>

          <LiyonDialogFooter className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? "กำลังบันทึก..." : "บันทึกและลงทะเบียน"}
            </button>
          </LiyonDialogFooter>
        </form>
      </LiyonDialog>

      {/* Modal: นำเข้า CSV */}
      <LiyonDialog open={isImportOpen} onOpenChange={setIsImportOpen} wide>
        <LiyonDialogHeader
          title="นำเข้ารายชื่อนิสิตด้วย CSV หรือคัดลอกข้อความ"
          description="จัดรูปแบบคอลัมน์: รหัสนิสิต, ชื่อ, นามสกุล, คำนำหน้า, ชั้นปี, สาขาวิชา (บรรทัดละ 1 คน)"
        />
        <LiyonDialogCloseButton label="ปิด" />
        <LiyonDialogBody className="space-y-4 text-sm">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
            <p className="font-semibold text-primary mb-1">ตัวอย่างข้อมูล (สามารถ Copy จาก Excel มาวางได้โดยตรง):</p>
            <code className="block bg-white dark:bg-slate-900 p-2 rounded-lg font-mono text-2xs border border-slate-200 dark:border-slate-800">
              660101001, ธีรภัทร, ญาณเมธี, พระมหา, 3, สาขาวิชาพระพุทธศาสนา<br />
              660101002, ชยานันท์, วชิรญาโณ, พระ, 3, สาขาวิชาพระพุทธศาสนา<br />
              660101003, สมพร, ใจบุญ, สามเณร, 3, สาขาวิชาปรัชญา
            </code>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              วางข้อมูลข้อความ CSV / Tab-separated:
            </label>
            <textarea
              rows={8}
              placeholder="วางข้อมูลที่นี่..."
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </LiyonDialogBody>

        <LiyonDialogFooter className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setIsImportOpen(false)}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={isImporting}
            onClick={handleImportCsv}
            className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-50"
          >
            {isImporting ? "กำลังนำเข้าข้อมูล..." : "เริ่มนำเข้าข้อมูล"}
          </button>
        </LiyonDialogFooter>
      </LiyonDialog>

      {/* Modal: ยืนยันการลบนิสิต */}
      <LiyonDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)} danger>
        <LiyonDialogHeader
          title="ยืนยันการลบนิสิตออกจากรายวิชา"
          description={`คุณแน่ใจหรือไม่ว่าต้องการนำนิสิต "${deleteTarget?.student.studentCode} ${deleteTarget?.student.firstName} ${deleteTarget?.student.lastName}" ออกจากรายวิชานี้?`}
        />
        <LiyonDialogCloseButton label="ปิด" />
        <LiyonDialogBody className="text-xs text-slate-500 space-y-2">
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>
              หากนิสิตมีประวัติการเข้าเรียนแล้ว ระบบจะคงประวัติไว้เพื่อการตรวจสอบย้อนหลัง (Audit Log) แต่จะถูกถอนชื่อออกจากรายวิชานี้
            </span>
          </div>
        </LiyonDialogBody>
        <LiyonDialogFooter className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setDeleteTarget(null)}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleConfirmDelete}
            className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? "กำลังลบ..." : "ยืนยันการลบ"}
          </button>
        </LiyonDialogFooter>
      </LiyonDialog>

      {/* Modal: ดึงนิสิตตามชั้นปี / สาขาวิชา (Cohort Student Enrollment) */}
      <LiyonDialog open={isCohortOpen} onOpenChange={(open) => !isEnrollingCohort && setIsCohortOpen(open)}>
        <LiyonDialogHeader
          title="ดึงนิสิตตามชั้นปี / สาขาวิชา เข้าห้องเรียน"
          description={`เลือกนิสิตจากฐานข้อมูลคณะเพื่อลงทะเบียนในรายวิชา ${classObj.courseCode} ${classObj.courseName}`}
        />
        <LiyonDialogCloseButton label="ปิด" />
        <LiyonDialogBody className="space-y-4 max-h-[70vh] overflow-y-auto">
          {isLoadingCohort ? (
            <div className="py-12 text-center text-slate-500">
              <div className="animate-spin w-8 h-8 border-3 border-primary border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm font-medium">กำลังโหลดข้อมูลนิสิตจากฐานข้อมูล...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* ตัวกรองชั้นปีและสาขาวิชา */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    ชั้นปี
                  </label>
                  <select
                    value={cohortYearFilter}
                    onChange={(e) => setCohortYearFilter(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  >
                    <option value={0}>ทั้งหมดทุกชั้นปี</option>
                    <option value={1}>ชั้นปีที่ 1</option>
                    <option value={2}>ชั้นปีที่ 2</option>
                    <option value={3}>ชั้นปีที่ 3</option>
                    <option value={4}>ชั้นปีที่ 4</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    สาขาวิชา
                  </label>
                  <select
                    value={cohortDeptFilter}
                    onChange={(e) => setCohortDeptFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs truncate"
                  >
                    <option value="ALL">ทั้งหมดทุกสาขาวิชา</option>
                    {departmentOptions.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    ค้นหาชื่อ / รหัส
                  </label>
                  <input
                    type="text"
                    placeholder="พิมพ์ค้นหา..."
                    value={cohortSearch}
                    onChange={(e) => setCohortSearch(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
              </div>

              {/* สรุปและปุ่มเลือกทั้งหมด */}
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                  พบนิสิตที่ยังไม่ได้ลงทะเบียน {filteredCohortStudents.length} รูป/คน (เลือกไว้แล้ว {selectedCohortIds.filter((id) => filteredCohortStudents.some((s) => s.id === id)).length} คน)
                </span>
                {filteredCohortStudents.length > 0 && (
                  <button
                    type="button"
                    onClick={handleToggleAllCohort}
                    className="text-primary hover:underline font-semibold"
                  >
                    {filteredCohortStudents.every((s) => selectedCohortIds.includes(s.id))
                      ? "ยกเลิกการเลือก"
                      : "เลือกทั้งหมดตามตัวกรอง"}
                  </button>
                )}
              </div>

              {/* รายการนิสิต */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60 max-h-72 overflow-y-auto">
                {filteredCohortStudents.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 text-xs">
                    ไม่พบนิสิตที่ตรงตามเงื่อนไข หรือนิสิตทั้งหมดในกลุ่มนี้ได้ลงทะเบียนในรายวิชานี้แล้ว
                  </div>
                ) : (
                  filteredCohortStudents.map((s) => {
                    const isSelected = selectedCohortIds.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        onClick={() => handleToggleCohortStudent(s.id)}
                        className={`p-2.5 flex items-center justify-between gap-3 cursor-pointer transition ${
                          isSelected
                            ? "bg-primary/5 dark:bg-primary/10"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // handled by parent onClick
                            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                                {s.studentCode}
                              </span>
                              <span className="font-medium text-xs text-slate-800 dark:text-slate-200">
                                {s.fullName}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              ชั้นปีที่ {s.yearLevel} • {s.department || "คณะพุทธศาสตร์"}
                            </div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-300 shrink-0">
                          ปี {s.yearLevel}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </LiyonDialogBody>
        <LiyonDialogFooter className="flex justify-between items-center gap-2">
          <button
            type="button"
            disabled={isEnrollingCohort}
            onClick={() => setIsCohortOpen(false)}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={isEnrollingCohort || selectedCohortIds.length === 0}
            onClick={handleConfirmCohortEnrollment}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
          >
            {isEnrollingCohort ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>กำลังบันทึกการลงทะเบียน...</span>
              </>
            ) : (
              <>
                <Users className="w-4 h-4" />
                <span>ลงทะเบียนนิสิต ({selectedCohortIds.length} คน)</span>
              </>
            )}
          </button>
        </LiyonDialogFooter>
      </LiyonDialog>
    </div>
  );
}

