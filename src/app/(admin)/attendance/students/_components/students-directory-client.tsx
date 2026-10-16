"use client";

import * as React from "react";
import {
  Users,
  Search,
  Plus,
  Trash2,
  Edit2,
  GraduationCap,
  Building2,
  BookOpen,
  Filter,
  CheckCircle2,
  Download,
  Phone,
  Mail,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Layers,
  ArrowUpDown,
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
import { toast } from "sonner";
import { createOrUpdateStudentAction, deleteStudentAction } from "@/features/attendance/actions";

interface StudentItem {
  id: string;
  studentCode: string;
  firstName: string;
  lastName: string;
  title?: string | null;
  yearLevel: number;
  degree?: string | null;
  curriculumName?: string | null;
  department?: string | null;
  major?: string | null;
  gender?: string | null;
  studyStatus?: string | null;
  faculty?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  isActive: boolean;
  createdAt: any;
  enrollments: {
    course: {
      id: string;
      courseCode: string;
      courseName: string;
      courseNameEn?: string | null;
      academicYear: string;
      semester: number;
    };
  }[];
}

interface StudentsDirectoryClientProps {
  initialStudents: any[];
  isSuperAdmin?: boolean;
  currentUserId?: string;
}

export function StudentsDirectoryClient({
  initialStudents,
  isSuperAdmin,
}: StudentsDirectoryClientProps) {
  const [students, setStudents] = React.useState<StudentItem[]>(initialStudents);
  const [search, setSearch] = React.useState("");
  const [degreeFilter, setDegreeFilter] = React.useState<string>("ALL");
  const [yearFilter, setYearFilter] = React.useState<number | "ALL">("ALL");
  const [deptFilter, setDeptFilter] = React.useState<string>("ALL");

  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 20;

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingStudent, setEditingStudent] = React.useState<StudentItem | null>(null);
  const [formData, setFormData] = React.useState({
    studentCode: "",
    title: "พระ",
    firstName: "",
    lastName: "",
    yearLevel: 1,
    degree: "ปริญญาตรี",
    department: "สาขาวิชาพระพุทธศาสนา",
    major: "",
    faculty: "คณะพุทธศาสตร์",
    studyStatus: "ปกติ",
    email: "",
    phoneNumber: "",
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = React.useState<StudentItem | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Expanded courses list popover/modal
  const [viewingCoursesStudent, setViewingCoursesStudent] = React.useState<StudentItem | null>(null);

  // Dynamic Departments
  const availableDepartments = React.useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.department) set.add(s.department);
    });
    return Array.from(set).sort();
  }, [students]);

  // Statistics
  const stats = React.useMemo(() => {
    const total = students.length;
    const bachelors = students.filter((s) => (s.degree || "").includes("ตรี")).length;
    const mastersAndDocs = students.filter(
      (s) => (s.degree || "").includes("โท") || (s.degree || "").includes("เอก")
    ).length;
    const totalEnrollments = students.reduce((acc, s) => acc + (s.enrollments?.length || 0), 0);
    return { total, bachelors, mastersAndDocs, totalEnrollments };
  }, [students]);

  // Filtered List
  const filteredStudents = React.useMemo(() => {
    return students.filter((s) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        s.studentCode.toLowerCase().includes(q) ||
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        (s.department && s.department.toLowerCase().includes(q));

      const matchDegree =
        degreeFilter === "ALL" ||
        (degreeFilter === "BACHELOR" && (s.degree || "").includes("ตรี")) ||
        (degreeFilter === "MASTER" && (s.degree || "").includes("โท")) ||
        (degreeFilter === "DOCTORATE" && (s.degree || "").includes("เอก")) ||
        (degreeFilter === "CERTIFICATE" && (s.degree || "").includes("ประกาศนียบัตร"));

      const matchYear = yearFilter === "ALL" || s.yearLevel === yearFilter;
      const matchDept = deptFilter === "ALL" || s.department === deptFilter;

      return matchSearch && matchDegree && matchYear && matchDept;
    });
  }, [students, search, degreeFilter, yearFilter, deptFilter]);

  // Pagination slice
  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedStudents = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage]);

  // Reset page when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, degreeFilter, yearFilter, deptFilter]);

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormData({
      studentCode: "",
      title: "พระ",
      firstName: "",
      lastName: "",
      yearLevel: 1,
      degree: "ปริญญาตรี",
      department: "สาขาวิชาพระพุทธศาสนา",
      major: "",
      faculty: "คณะพุทธศาสตร์",
      studyStatus: "ปกติ",
      email: "",
      phoneNumber: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student: StudentItem) => {
    setEditingStudent(student);
    setFormData({
      studentCode: student.studentCode,
      title: student.title || "พระ",
      firstName: student.firstName,
      lastName: student.lastName,
      yearLevel: student.yearLevel,
      degree: student.degree || "ปริญญาตรี",
      department: student.department || "",
      major: student.major || "",
      faculty: student.faculty || "คณะพุทธศาสตร์",
      studyStatus: student.studyStatus || "ปกติ",
      email: student.email || "",
      phoneNumber: student.phoneNumber || "",
    });
    setIsModalOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentCode.trim() || !formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error("กรุณากรอกรหัสนิสิต ชื่อ และนามสกุล");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createOrUpdateStudentAction({
        id: editingStudent ? editingStudent.id : undefined,
        studentCode: formData.studentCode.trim(),
        title: formData.title,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        yearLevel: Number(formData.yearLevel),
        degree: formData.degree,
        department: formData.department,
        major: formData.major,
        faculty: formData.faculty,
        studyStatus: formData.studyStatus,
        email: formData.email.trim() || null,
        phoneNumber: formData.phoneNumber.trim() || null,
      });

      if (res.success && res.student) {
        toast.success(editingStudent ? "อัปเดตข้อมูลนิสิตสำเร็จ" : "เพิ่มนิสิตใหม่สำเร็จ");
        if (editingStudent) {
          setStudents((prev) =>
            prev.map((s) => (s.id === editingStudent.id ? { ...s, ...res.student } : s))
          );
        } else {
          setStudents((prev) => [{ ...res.student, enrollments: [] }, ...prev]);
        }
        setIsModalOpen(false);
      } else {
        toast.error("เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await deleteStudentAction(deleteTarget.id);
      if (res.success) {
        toast.success(`ลบนิสิต ${deleteTarget.studentCode} เรียบร้อยแล้ว`);
        setStudents((prev) => prev.filter((s) => s.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        toast.error("ไม่สามารถลบนิสิตได้");
      }
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการลบ");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "รหัสนิสิต",
      "คำนำหน้า",
      "ชื่อ",
      "นามสกุล",
      "ระดับการศึกษา",
      "ชั้นปี",
      "สาขาวิชา",
      "คณะ",
      "สถานะ",
      "จำนวนวิชาที่ลง",
      "อีเมล",
      "เบอร์โทร",
    ];
    const rows = filteredStudents.map((s) => [
      `="${s.studentCode}"`,
      s.title || "",
      s.firstName,
      s.lastName,
      s.degree || "",
      s.yearLevel,
      s.department || "",
      s.faculty || "",
      s.studyStatus || "",
      s.enrollments?.length || 0,
      s.email || "",
      s.phoneNumber || "",
    ]);

    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students_directory_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("ดาวน์โหลดไฟล์ CSV เรียบร้อยแล้ว");
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-medium text-xs">
            <Users className="w-4 h-4" />
            <span>ฐานข้อมูลกลาง / ทะเบียนนิสิต</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1">
            ทะเบียนนิสิต (Student Directory)
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            จัดการฐานข้อมูลนิสิตทั้งหมดในระบบ ตรวจสอบประวัติ และรายวิชาที่ลงทะเบียน
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground" />
            ส่งออก CSV
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            เพิ่มนิสิตใหม่
          </button>
        </div>
      </div>

      {/* ── STATS CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <LiyonCard className="p-4 border-l-4 border-l-primary bg-card/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">นิสิตทั้งหมดในระบบ</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stats.total} รูป/คน</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </LiyonCard>

        <LiyonCard className="p-4 border-l-4 border-l-blue-500 bg-card/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">ระดับปริญญาตรี</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stats.bachelors} คน</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
        </LiyonCard>

        <LiyonCard className="p-4 border-l-4 border-l-purple-500 bg-card/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">ปริญญาโท-เอก / ป.บัณฑิต</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stats.mastersAndDocs} คน</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
        </LiyonCard>

        <LiyonCard className="p-4 border-l-4 border-l-emerald-500 bg-card/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">การลงทะเบียนเรียนรวม</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stats.totalEnrollments} ครั้ง</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <Layers className="w-5 h-5" />
            </div>
          </div>
        </LiyonCard>
      </div>

      {/* ── FILTER & SEARCH BAR ── */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหารหัสนิสิต, ชื่อ-นามสกุล, หรือสาขาวิชา..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Degree Filter */}
            <select
              value={degreeFilter}
              onChange={(e) => setDegreeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-muted/50 border border-border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="ALL">🎓 ทุกระดับการศึกษา</option>
              <option value="BACHELOR">ปริญญาตรี</option>
              <option value="MASTER">ปริญญาโท</option>
              <option value="DOCTORATE">ปริญญาเอก</option>
              <option value="CERTIFICATE">ประกาศนียบัตร</option>
            </select>

            {/* Year Filter */}
            <select
              value={yearFilter}
              onChange={(e) =>
                setYearFilter(e.target.value === "ALL" ? "ALL" : Number(e.target.value))
              }
              className="px-3 py-2 rounded-xl bg-muted/50 border border-border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="ALL">📚 ทุกชั้นปี</option>
              <option value="1">ชั้นปีที่ 1</option>
              <option value="2">ชั้นปีที่ 2</option>
              <option value="3">ชั้นปีที่ 3</option>
              <option value="4">ชั้นปีที่ 4</option>
            </select>

            {/* Department Filter */}
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-muted/50 border border-border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 max-w-[200px]"
            >
              <option value="ALL">🏛️ ทุกสาขาวิชา</option>
              {availableDepartments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <span>
            พบข้อมูลทั้งหมด <strong>{filteredStudents.length}</strong> คน
            {filteredStudents.length !== students.length && ` (จากทั้งหมด ${students.length} คน)`}
          </span>
          {(search || degreeFilter !== "ALL" || yearFilter !== "ALL" || deptFilter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setDegreeFilter("ALL");
                setYearFilter("ALL");
                setDeptFilter("ALL");
              }}
              className="text-primary hover:underline cursor-pointer"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          )}
        </div>
      </div>

      {/* ── STUDENTS TABLE ── */}
      <div className="rounded-2xl bg-card border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/60 text-xs font-semibold text-muted-foreground border-b border-border">
              <tr>
                <th className="py-3 px-4 w-12 text-center">ลำดับ</th>
                <th className="py-3 px-4">รหัสนิสิต</th>
                <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                <th className="py-3 px-4">ระดับการศึกษา / ชั้นปี</th>
                <th className="py-3 px-4">สาขาวิชา / ภาควิชา</th>
                <th className="py-3 px-4 text-center">วิชาที่ลงเรียน</th>
                <th className="py-3 px-4 text-center">สถานะ</th>
                <th className="py-3 px-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <Users className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
                    <p className="font-semibold">ไม่พบข้อมูลนิสิตที่ตรงกับเงื่อนไข</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ลองเปลี่ยนคำค้นหาหรือตัวกรอง
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student, idx) => {
                  const seq = (currentPage - 1) * pageSize + idx + 1;
                  const enrolledCount = student.enrollments?.length || 0;

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-muted/40 transition-colors group text-xs sm:text-sm"
                    >
                      <td className="py-3 px-4 text-center text-muted-foreground text-xs font-medium">
                        {seq}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono font-semibold px-2 py-0.5 rounded-md bg-muted text-foreground text-xs">
                          {student.studentCode}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-foreground">
                          {student.title ? `${student.title} ` : ""}
                          {student.firstName} {student.lastName}
                        </div>
                        {(student.email || student.phoneNumber) && (
                          <div className="flex items-center gap-2 text-2xs text-muted-foreground mt-0.5">
                            {student.phoneNumber && (
                              <span className="flex items-center gap-0.5">
                                <Phone className="w-2.5 h-2.5" />
                                {student.phoneNumber}
                              </span>
                            )}
                            {student.email && (
                              <span className="flex items-center gap-0.5">
                                <Mail className="w-2.5 h-2.5" />
                                {student.email}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-300">
                            {student.degree || "ปริญญาตรี"}
                          </span>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-2xs font-medium bg-muted text-muted-foreground">
                            ปี {student.yearLevel}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-foreground text-xs">
                          {student.department || "-"}
                        </div>
                        {student.faculty && (
                          <div className="text-2xs text-muted-foreground mt-0.5">
                            {student.faculty}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {enrolledCount > 0 ? (
                          <button
                            type="button"
                            onClick={() => setViewingCoursesStudent(student)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition cursor-pointer"
                            title="คลิกเพื่อดูรายชื่อวิชาที่ลงทะเบียน"
                          >
                            <BookOpen className="w-3 h-3" />
                            {enrolledCount} วิชา
                          </button>
                        ) : (
                          <span className="text-2xs text-muted-foreground/60 italic">
                            ยังไม่มีรายวิชา
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold ${
                            student.studyStatus === "ปกติ" || !student.studyStatus
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                          }`}
                        >
                          {student.studyStatus || "ปกติ"}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(student)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition cursor-pointer"
                            title="แก้ไขข้อมูลนิสิต"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteTarget(student)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition cursor-pointer"
                            title="ลบนิสิตออกจากระบบ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION BAR ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-border bg-muted/20 text-xs text-muted-foreground">
          <div>
            แสดงหน้า <strong>{currentPage}</strong> จากทั้งหมด <strong>{totalPages}</strong> หน้า (
            {filteredStudents.length} รายการ)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition font-medium"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              ก่อนหน้า
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = i + 1;
              if (totalPages > 5 && currentPage > 3) {
                pageNum = currentPage - 3 + i + 1;
                if (pageNum > totalPages) pageNum = totalPages - (4 - i);
              }
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${
                    currentPage === pageNum
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "border border-border bg-card hover:bg-muted text-foreground"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition font-medium"
            >
              ถัดไป
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── ADD / EDIT MODAL ── */}
      {isModalOpen && (
        <LiyonDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
              <LiyonDialogHeader className="p-5 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-base">
                      {editingStudent ? "แก้ไขข้อมูลนิสิต" : "เพิ่มนิสิตใหม่เข้าระบบ"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      บันทึกข้อมูลเข้าสู่ฐานข้อมูลกลางของมหาวิทยาลัย
                    </p>
                  </div>
                </div>
                <LiyonDialogCloseButton onClick={() => setIsModalOpen(false)} />
              </LiyonDialogHeader>

              <form onSubmit={handleSaveStudent}>
                <LiyonDialogBody className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">
                        คำนำหน้า
                      </label>
                      <select
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="พระ">พระ</option>
                        <option value="พระมหา">พระมหา</option>
                        <option value="สามเณร">สามเณร</option>
                        <option value="นาย">นาย</option>
                        <option value="นางสาว">นางสาว</option>
                        <option value="นาง">นาง</option>
                        <option value="แม่ชี">แม่ชี</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-foreground mb-1">
                        รหัสนิสิต <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.studentCode}
                        onChange={(e) =>
                          setFormData({ ...formData, studentCode: e.target.value.trim() })
                        }
                        placeholder="เช่น 6601201001"
                        className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">
                        ชื่อ <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="ชื่อนิสิต"
                        className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">
                        นามสกุล / ฉายา <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="นามสกุลหรือฉายา"
                        className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">
                        ระดับการศึกษา
                      </label>
                      <select
                        value={formData.degree}
                        onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="ปริญญาตรี">ปริญญาตรี</option>
                        <option value="ปริญญาโท">ปริญญาโท</option>
                        <option value="ปริญญาเอก">ปริญญาเอก</option>
                        <option value="ประกาศนียบัตร">ประกาศนียบัตร</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">
                        ชั้นปี
                      </label>
                      <select
                        value={formData.yearLevel}
                        onChange={(e) =>
                          setFormData({ ...formData, yearLevel: Number(e.target.value) })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value={1}>ชั้นปีที่ 1</option>
                        <option value={2}>ชั้นปีที่ 2</option>
                        <option value={3}>ชั้นปีที่ 3</option>
                        <option value={4}>ชั้นปีที่ 4</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      สาขาวิชา / ภาควิชา
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="เช่น สาขาวิชาพระพุทธศาสนา, ปรัชญา, ภาษาบาลี"
                      className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">
                        อีเมล (ถ้ามี)
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="student@mcu.ac.th"
                        className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">
                        เบอร์โทรศัพท์ (ถ้ามี)
                      </label>
                      <input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        placeholder="08X-XXX-XXXX"
                        className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                </LiyonDialogBody>

                <LiyonDialogFooter className="p-4 border-t border-border flex items-center justify-end gap-2 bg-muted/20">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-medium text-foreground transition cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition cursor-pointer"
                  >
                    {isSubmitting ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                  </button>
                </LiyonDialogFooter>
              </form>
            </div>
          </div>
        </LiyonDialog>
      )}

      {/* ── VIEW ENROLLED COURSES MODAL ── */}
      {viewingCoursesStudent && (
        <LiyonDialog
          open={Boolean(viewingCoursesStudent)}
          onOpenChange={() => setViewingCoursesStudent(null)}
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
              <LiyonDialogHeader className="p-4 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-foreground text-sm">
                    รายวิชาที่ลงทะเบียน: {viewingCoursesStudent.firstName}{" "}
                    {viewingCoursesStudent.lastName}
                  </h3>
                  <p className="text-2xs text-muted-foreground font-mono">
                    รหัสนิสิต: {viewingCoursesStudent.studentCode}
                  </p>
                </div>
                <LiyonDialogCloseButton onClick={() => setViewingCoursesStudent(null)} />
              </LiyonDialogHeader>

              <LiyonDialogBody className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
                {viewingCoursesStudent.enrollments.map((en, i) => (
                  <div
                    key={en.course.id}
                    className="p-3 rounded-xl border border-border/70 bg-muted/30 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-primary">
                        {en.course.courseCode}
                      </span>
                      <span className="text-2xs text-muted-foreground">
                        {en.course.semester}/{en.course.academicYear}
                      </span>
                    </div>
                    <div className="font-medium text-foreground">{en.course.courseName}</div>
                    {en.course.courseNameEn && (
                      <div className="text-2xs text-muted-foreground">
                        {en.course.courseNameEn}
                      </div>
                    )}
                  </div>
                ))}
              </LiyonDialogBody>

              <LiyonDialogFooter className="p-3 border-t border-border flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewingCoursesStudent(null)}
                  className="px-4 py-1.5 rounded-lg border border-border bg-muted hover:bg-muted/80 text-xs font-medium cursor-pointer"
                >
                  ปิด
                </button>
              </LiyonDialogFooter>
            </div>
          </div>
        </LiyonDialog>
      )}

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {deleteTarget && (
        <LiyonDialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-card w-full max-w-sm rounded-2xl border border-border shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm">ยืนยันการลบนิสิต</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    คุณต้องการลบ {deleteTarget.firstName} {deleteTarget.lastName} (
                    {deleteTarget.studentCode}) ออกจากฐานข้อมูลหรือไม่?
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/20 text-xs text-destructive">
                ⚠️ การลบจะทำให้นิสิตหลุดจากการลงทะเบียนและประวัติการเช็กชื่อทุกวิชา
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-medium cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteStudent}
                  className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/90 disabled:opacity-50 cursor-pointer"
                >
                  {isDeleting ? "กำลังลบ..." : "ยืนยันการลบ"}
                </button>
              </div>
            </div>
          </div>
        </LiyonDialog>
      )}
    </div>
  );
}
