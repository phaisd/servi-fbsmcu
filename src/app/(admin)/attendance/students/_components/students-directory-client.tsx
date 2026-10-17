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
  Upload,
  FileSpreadsheet,
  Phone,
  Mail,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Layers,
  ArrowUpDown,
  Check,
  AlertCircle,
  X,
} from "lucide-react";
import {
  LiyonCard,
  StatusPill,
  LiyonDialog,
  LiyonDialogBody,
  LiyonDialogFooter,
} from "@/shared/components/liyon";
import { toast } from "sonner";
import {
  createOrUpdateStudentAction,
  deleteStudentAction,
  batchImportStudentsAction,
} from "@/features/attendance/actions";

export function getStudentProgramType(s: {
  curriculumName?: string | null;
  degree?: string | null;
  department?: string | null;
  major?: string | null;
}): "THAI" | "ENGLISH" | "GRADUATE" {
  const c = (s.curriculumName || "").toLowerCase();
  const d = (s.department || "").toLowerCase();
  const m = (s.major || "").toLowerCase();
  const deg = (s.degree || "").toLowerCase();

  if (deg.includes("โท") || deg.includes("เอก") || deg.includes("ประกาศนียบัตร")) {
    return "GRADUATE";
  }
  if (
    c.includes("อังกฤษ") ||
    c.includes("english") ||
    c.includes("inter") ||
    d.includes("english") ||
    d.includes("อังกฤษ") ||
    d.includes("buddhist studies") ||
    d.includes("religion and philosophy") ||
    m.includes("english") ||
    m.includes("buddhist") ||
    m.includes("religion") ||
    m.includes("philosophy")
  ) {
    return "ENGLISH";
  }
  return "THAI";
}

export function getStudentMajorDisplay(s: {
  curriculumName?: string | null;
  degree?: string | null;
  department?: string | null;
  major?: string | null;
}): string {
  const isEng = getStudentProgramType(s) === "ENGLISH";
  if (isEng) {
    const m = (s.major || "").trim();
    if (m.toLowerCase().includes("buddhist") || m.includes("พระพุทธศาสนา")) {
      return "Buddhist Studies";
    }
    if (
      m.toLowerCase().includes("religion") ||
      m.toLowerCase().includes("philosoph") ||
      m.includes("ปรัชญา")
    ) {
      return "Religion and Philosophy";
    }
    if (m) return m;

    const d = (s.department || "").trim();
    if (d.includes("พระพุทธศาสนา") || d.toLowerCase().includes("buddhist")) {
      return "Buddhist Studies";
    }
    if (
      d.includes("ปรัชญา") ||
      d.toLowerCase().includes("religion") ||
      d.toLowerCase().includes("philosoph")
    ) {
      return "Religion and Philosophy";
    }
    return d || "-";
  }

  // Thai Program / Graduate
  const rawMajor = (s.major || "").replace(/^สาขาวิชา\s*/, "").replace(/^ภาควิชา\s*/, "").trim();
  const rawDept = (s.department || "").replace(/^สาขาวิชา\s*/, "").replace(/^ภาควิชา\s*/, "").trim();

  // Normalize legacy names if any
  if (rawMajor === "บาลีพุทธศาสตร์" || rawDept === "บาลีพุทธศาสตร์") {
    return "บาลีสันสกฤต";
  }
  if (rawMajor === "ปรัชญา" || rawDept === "ปรัชญา") {
    return "ศาสนาและปรัชญา";
  }

  const raw = rawMajor || rawDept || "-";
  return raw || "-";
}

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
  const [languageFilter, setLanguageFilter] = React.useState<string>("ALL");
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
    curriculumName: "พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา",
    department: "สาขาวิชาพระพุทธศาสนา",
    major: "",
    faculty: "คณะพุทธศาสตร์",
    studyStatus: "ปกติ",
    email: "",
    phoneNumber: "",
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Import Modal State
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [importRawText, setImportRawText] = React.useState("");
  const [isImporting, setIsImporting] = React.useState(false);
  const [importFileName, setImportFileName] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Delete State
  const [deleteTarget, setDeleteTarget] = React.useState<StudentItem | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Expanded courses list popover/modal
  const [viewingCoursesStudent, setViewingCoursesStudent] = React.useState<StudentItem | null>(null);

  // Dynamic Departments based on students and active languageFilter
  const availableDepartments = React.useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (languageFilter === "THAI" && getStudentProgramType(s) !== "THAI") return;
      if (languageFilter === "ENGLISH" && getStudentProgramType(s) !== "ENGLISH") return;
      if (languageFilter === "GRADUATE" && getStudentProgramType(s) !== "GRADUATE") return;

      const display = getStudentMajorDisplay(s);
      // ตัดชื่อเก่าหรือชื่อที่ผู้ใช้ไม่ต้องการออก
      if (display === "บาลีพุทธศาสตร์" || display === "ปรัชญา") return;

      if (display && display !== "-") {
        set.add(display);
      }
    });

    const customOrder = [
      "พระพุทธศาสนา",
      "ศาสนาและปรัชญา",
      "วิปัสสนาภาวนา",
      "บาลีสันสกฤต",
      "Buddhist Studies",
      "Religion and Philosophy",
    ];

    return Array.from(set).sort((a, b) => {
      const idxA = customOrder.indexOf(a);
      const idxB = customOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b, "th");
    });
  }, [students, languageFilter]);

  // Statistics
  const stats = React.useMemo(() => {
    const total = students.length;
    const thaiProgram = students.filter((s) => getStudentProgramType(s) === "THAI").length;
    const englishProgram = students.filter((s) => getStudentProgramType(s) === "ENGLISH").length;
    const graduate = students.filter((s) => getStudentProgramType(s) === "GRADUATE").length;
    const totalEnrollments = students.reduce((acc, s) => acc + (s.enrollments?.length || 0), 0);
    return { total, thaiProgram, englishProgram, graduate, totalEnrollments };
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
        (s.curriculumName && s.curriculumName.toLowerCase().includes(q)) ||
        (s.department && s.department.toLowerCase().includes(q)) ||
        (s.major && s.major.toLowerCase().includes(q)) ||
        getStudentMajorDisplay(s).toLowerCase().includes(q);

      const matchDegree =
        degreeFilter === "ALL" ||
        (degreeFilter === "BACHELOR" && (s.degree || "").includes("ตรี")) ||
        (degreeFilter === "MASTER" && (s.degree || "").includes("โท")) ||
        (degreeFilter === "DOCTORATE" && (s.degree || "").includes("เอก")) ||
        (degreeFilter === "CERTIFICATE" && (s.degree || "").includes("ประกาศนียบัตร"));

      const matchLanguage =
        languageFilter === "ALL" ||
        (languageFilter === "THAI" && getStudentProgramType(s) === "THAI") ||
        (languageFilter === "ENGLISH" && getStudentProgramType(s) === "ENGLISH") ||
        (languageFilter === "GRADUATE" && getStudentProgramType(s) === "GRADUATE");

      const matchYear = yearFilter === "ALL" || s.yearLevel === yearFilter;

      const disp = getStudentMajorDisplay(s);
      const matchDept = deptFilter === "ALL" || disp === deptFilter;

      return matchSearch && matchDegree && matchLanguage && matchYear && matchDept;
    });
  }, [students, search, degreeFilter, languageFilter, yearFilter, deptFilter]);

  // Pagination slice
  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedStudents = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage]);

  // Reset page when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, degreeFilter, languageFilter, yearFilter, deptFilter]);

  // Reset deptFilter if no longer available in the current language filter
  React.useEffect(() => {
    if (deptFilter !== "ALL" && !availableDepartments.includes(deptFilter)) {
      setDeptFilter("ALL");
    }
  }, [availableDepartments, deptFilter]);

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormData({
      studentCode: "",
      title: "พระ",
      firstName: "",
      lastName: "",
      yearLevel: 1,
      degree: "ปริญญาตรี",
      curriculumName: "พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา",
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
      curriculumName: student.curriculumName || "พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา",
      department: student.department || "",
      major: student.major || "",
      faculty: student.faculty || "คณะพุทธศาสตร์",
      studyStatus: student.studyStatus || "ปกติ",
      email: student.email || (student.studentCode ? `${student.studentCode}@mcu.ac.th` : ""),
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

    const code = formData.studentCode.trim();
    const studentEmail = formData.email.trim() || (code ? `${code}@mcu.ac.th` : null);

    setIsSubmitting(true);
    try {
      const res = await createOrUpdateStudentAction({
        id: editingStudent ? editingStudent.id : undefined,
        studentCode: code,
        title: formData.title,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        yearLevel: Number(formData.yearLevel),
        degree: formData.degree,
        curriculumName: formData.curriculumName.trim() || null,
        department: formData.department,
        major: formData.major,
        faculty: formData.faculty,
        studyStatus: formData.studyStatus,
        email: studentEmail,
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
      "หลักสูตรภาษา",
      "ชื่อหลักสูตร",
      "สาขาวิชา",
      "คณะ",
      "สถานะ",
      "จำนวนวิชาที่ลง",
      "อีเมล",
      "เบอร์โทร",
    ];
    const rows = filteredStudents.map((s) => {
      const prog = getStudentProgramType(s);
      const progLabel =
        prog === "ENGLISH"
          ? "ภาคภาษาอังกฤษ (English Program)"
          : prog === "GRADUATE"
          ? "บัณฑิตศึกษา"
          : "ภาคภาษาไทย";

      return [
        `="${s.studentCode}"`,
        s.title || "",
        s.firstName,
        s.lastName,
        s.degree || "",
        s.yearLevel,
        progLabel,
        s.curriculumName || "",
        getStudentMajorDisplay(s),
        s.faculty || "",
        s.studyStatus || "",
        s.enrollments?.length || 0,
        s.email || "",
        s.phoneNumber || "",
      ];
    });

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

  // Parse Raw Import Text
  const parsedImportItems = React.useMemo(() => {
    const raw = importRawText.trim();
    if (!raw) return [];
    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length === 0) return [];

    const splitLine = (line: string) => {
      const delimiter = line.includes("\t") ? "\t" : ",";
      return line.split(delimiter).map((c) => {
        let v = c.trim();
        if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1).trim();
        if (v.startsWith('="') && v.endsWith('"')) v = v.slice(2, -1).trim();
        return v;
      });
    };

    const firstRowTokens = splitLine(lines[0]);
    const isHeader = firstRowTokens.some(
      (t) =>
        t.includes("รหัส") ||
        t.toLowerCase().includes("code") ||
        t.includes("ชื่อ") ||
        t.toLowerCase().includes("name")
    );

    // If headers exist, map column indexes by name
    const headerMap: Record<string, number> = {};
    if (isHeader) {
      firstRowTokens.forEach((header, idx) => {
        const clean = header.toLowerCase().replace(/[^a-z0-9ก-๙]/g, "");
        if (clean.includes("รหัส") || clean.includes("code")) headerMap["code"] = idx;
        else if (clean.includes("คำนำหน้า") || clean === "title") headerMap["title"] = idx;
        else if (clean === "ชื่อ" || clean.includes("firstname") || clean === "name") headerMap["firstName"] = idx;
        else if (clean.includes("นามสกุล") || clean.includes("ฉายา") || clean.includes("lastname")) headerMap["lastName"] = idx;
        else if (clean.includes("ระดับ") || clean.includes("degree")) headerMap["degree"] = idx;
        else if (clean.includes("ชั้นปี") || clean === "ปี" || clean === "year" || clean === "yearlevel") headerMap["yearLevel"] = idx;
        else if (clean.includes("ชื่อหลักสูตร") || clean === "curriculum" || clean === "curriculumname") headerMap["curriculumName"] = idx;
        else if (clean.includes("หลักสูตรภาษา") || clean.includes("program")) headerMap["programType"] = idx;
        else if (clean.includes("สาขา") || clean.includes("ภาควิชา") || clean === "department" || clean === "major") headerMap["department"] = idx;
        else if (clean.includes("คณะ") || clean === "faculty") headerMap["faculty"] = idx;
        else if (clean.includes("สถานะ") || clean === "status") headerMap["studyStatus"] = idx;
        else if (clean.includes("เมล") || clean.includes("email")) headerMap["email"] = idx;
        else if (clean.includes("โทร") || clean.includes("phone") || clean.includes("tel")) headerMap["phone"] = idx;
      });
    }

    const dataLines = isHeader ? lines.slice(1) : lines;
    const items: Array<{
      studentCode: string;
      title?: string;
      firstName: string;
      lastName: string;
      degree?: string;
      yearLevel?: number;
      curriculumName?: string;
      department?: string;
      major?: string;
      faculty?: string;
      studyStatus?: string;
      email?: string;
      phoneNumber?: string;
    }> = [];

    const hasMappedHeader =
      isHeader &&
      headerMap["code"] !== undefined &&
      (headerMap["firstName"] !== undefined || headerMap["lastName"] !== undefined);

    for (const line of dataLines) {
      const tokens = splitLine(line);
      if (tokens.length < 2) continue;

      if (hasMappedHeader) {
        const code = tokens[headerMap["code"]]?.trim();
        if (!code || !code.match(/\d/)) continue;

        let firstName = tokens[headerMap["firstName"]] || "";
        let lastName = tokens[headerMap["lastName"]] || "";
        let title = headerMap["title"] !== undefined ? tokens[headerMap["title"]] : "";

        // If no separate title column, see if firstName has title
        if (!title) {
          const potentialTitles = ["พระมหา", "พระครู", "พระ", "สามเณร", "นาย", "นางสาว", "นาง", "แม่ชี"];
          for (const pt of potentialTitles) {
            if (firstName.startsWith(pt)) {
              title = pt;
              firstName = firstName.slice(pt.length).trim();
              break;
            }
          }
        }
        if (!title) title = "พระ";

        if (!firstName && !lastName) continue;

        const degree = headerMap["degree"] !== undefined ? tokens[headerMap["degree"]] || "ปริญญาตรี" : "ปริญญาตรี";
        const yearParsed = headerMap["yearLevel"] !== undefined ? parseInt(tokens[headerMap["yearLevel"]], 10) : 1;
        const yearLevel = !isNaN(yearParsed) && yearParsed >= 1 && yearParsed <= 8 ? yearParsed : 1;
        const curriculumName = headerMap["curriculumName"] !== undefined ? tokens[headerMap["curriculumName"]] : "";
        const deptOrMajor = headerMap["department"] !== undefined ? tokens[headerMap["department"]] : "";
        const faculty = headerMap["faculty"] !== undefined ? tokens[headerMap["faculty"]] : "คณะพุทธศาสตร์";
        const studyStatus = headerMap["studyStatus"] !== undefined ? tokens[headerMap["studyStatus"]] || "ปกติ" : "ปกติ";

        let email = headerMap["email"] !== undefined ? tokens[headerMap["email"]] : "";
        let phoneNumber = headerMap["phone"] !== undefined ? tokens[headerMap["phone"]] : "";

        if (!email) {
          const foundEmail = tokens.find((t) => t.includes("@"));
          if (foundEmail) email = foundEmail;
        }
        if (!phoneNumber) {
          const foundPhone = tokens.find((t) => t.match(/^0\d{8,9}$/) || t.match(/^0\d{1,2}-\d{3,4}-\d{3,4}$/));
          if (foundPhone) phoneNumber = foundPhone;
        }

        let major = deptOrMajor;
        if (deptOrMajor.toLowerCase().includes("buddhist") || deptOrMajor.includes("พระพุทธศาสนา")) {
          major = "Buddhist Studies";
        } else if (
          deptOrMajor.toLowerCase().includes("religion") ||
          deptOrMajor.toLowerCase().includes("philosoph") ||
          deptOrMajor.includes("ปรัชญา")
        ) {
          major = "Religion and Philosophy";
        }

        items.push({
          studentCode: code,
          title,
          firstName,
          lastName,
          degree,
          yearLevel,
          curriculumName:
            curriculumName ||
            (degree === "ปริญญาตรี" ? "พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา" : degree),
          department: deptOrMajor || "สาขาวิชาพระพุทธศาสนา",
          major,
          faculty,
          studyStatus,
          email: email || undefined,
          phoneNumber: phoneNumber || undefined,
        });
      } else {
        // Fallback: positional parsing
        const code = tokens[0];
        if (!code || !code.match(/\d/)) continue;

        let title = "พระ";
        let firstName = "";
        let lastName = "";
        let degree = "ปริญญาตรี";
        let yearLevel = 1;
        let curriculumName = "";
        let department = "";
        let faculty = "คณะพุทธศาสตร์";
        let studyStatus = "ปกติ";
        let email = "";
        let phoneNumber = "";

        const potentialTitles = ["พระมหา", "พระครู", "พระ", "สามเณร", "นาย", "นางสาว", "นาง", "แม่ชี"];
        let idx = 1;
        if (potentialTitles.includes(tokens[1])) {
          title = tokens[1];
          firstName = tokens[2] || "";
          lastName = tokens[3] || "";
          idx = 4;
        } else {
          firstName = tokens[1] || "";
          lastName = tokens[2] || "";
          idx = 3;
        }

        if (!firstName || !lastName) continue;

        if (tokens[idx]) {
          const d = tokens[idx];
          if (d.includes("ตรี") || d.includes("โท") || d.includes("เอก") || d.includes("ประกาศนียบัตร")) {
            degree = d;
          }
        }
        if (tokens[idx + 1]) {
          const y = parseInt(tokens[idx + 1], 10);
          if (!isNaN(y) && y >= 1 && y <= 8) yearLevel = y;
        }
        if (tokens[idx + 2]) curriculumName = tokens[idx + 2];
        if (tokens[idx + 3]) department = tokens[idx + 3];
        if (tokens[idx + 4]) faculty = tokens[idx + 4];

        for (let i = idx; i < tokens.length; i++) {
          const t = tokens[i];
          if (t.includes("@")) email = t;
          else if (t.match(/^0\d{8,9}$/) || t.match(/^0\d{1,2}-\d{3,4}-\d{3,4}$/)) phoneNumber = t;
        }

        let major = department;
        if (department.toLowerCase().includes("buddhist")) major = "Buddhist Studies";
        else if (department.toLowerCase().includes("religion")) major = "Religion and Philosophy";

        items.push({
          studentCode: code,
          title,
          firstName,
          lastName,
          degree,
          yearLevel,
          curriculumName:
            curriculumName ||
            (degree === "ปริญญาตรี" ? "พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา" : degree),
          department: department || "สาขาวิชาพระพุทธศาสนา",
          major,
          faculty,
          studyStatus,
          email: email || undefined,
          phoneNumber: phoneNumber || undefined,
        });
      }
    }
    return items;
  }, [importRawText]);

  const handleDownloadTemplate = () => {
    const templateHeaders = [
      "รหัสนิสิต",
      "คำนำหน้า",
      "ชื่อ",
      "นามสกุล",
      "ระดับการศึกษา",
      "ชั้นปี",
      "ชื่อหลักสูตร",
      "สาขาวิชา",
      "คณะ",
      "อีเมล",
      "เบอร์โทรศัพท์",
    ];
    const sampleRows = [
      [
        '="6601201001"',
        "พระ",
        "สมชาย",
        "ปญฺญาธโร",
        "ปริญญาตรี",
        "1",
        "พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา",
        "สาขาวิชาพระพุทธศาสนา",
        "คณะพุทธศาสตร์",
        "somchai@mcu.ac.th",
        "0812345678",
      ],
      [
        '="6601202002"',
        "พระ",
        "John",
        "Dhammiko",
        "ปริญญาตรี",
        "1",
        "พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา (หลักสูตรภาษาอังกฤษ)",
        "สาขาวิชาพระพุทธศาสนา",
        "คณะพุทธศาสตร์",
        "john@mcu.ac.th",
        "0898765432",
      ],
    ];

    const csvContent =
      "\uFEFF" +
      [templateHeaders.join(","), ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(","))].join(
        "\n"
      );
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setImportRawText(text);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (parsedImportItems.length === 0) {
      toast.error("ไม่พบข้อมูลนิสิตที่สามารถนำเข้าได้ กรุณาตรวจสอบรูปแบบข้อมูล");
      return;
    }

    setIsImporting(true);
    try {
      const res = await batchImportStudentsAction(parsedImportItems);
      if (res && res.success) {
        toast.success(
          `นำเข้า/อัปเดตข้อมูลสำเร็จ! เพิ่มใหม่ ${res.createdCount} คน, ปรับปรุง ${res.updatedCount} คน`
        );
        setIsImportOpen(false);
        setImportRawText("");
        setImportFileName("");
        window.location.reload();
      } else {
        toast.error("เกิดข้อผิดพลาดในการนำเข้าข้อมูล");
      }
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการนำเข้าข้อมูล");
    } finally {
      setIsImporting(false);
    }
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
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv,.txt"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => setIsImportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition shadow-2xs cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-primary" />
            นำเข้า / อัปเดตนิสิต
          </button>

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

        <LiyonCard className="p-4 border-l-4 border-l-sky-500 bg-card/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">ปริญญาตรี (ภาคภาษาไทย)</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stats.thaiProgram} รูป/คน</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-600">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
        </LiyonCard>

        <LiyonCard className="p-4 border-l-4 border-l-amber-500 bg-card/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">ภาคภาษาอังกฤษ (Inter)</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stats.englishProgram} รูป/คน</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
        </LiyonCard>

        <LiyonCard className="p-4 border-l-4 border-l-purple-500 bg-card/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">บัณฑิตศึกษา (ป.โท-ป.เอก)</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stats.graduate} รูป/คน</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
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

            {/* Language / Program Filter */}
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-muted/50 border border-border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="ALL">🌐 ทุกหลักสูตรภาษา</option>
              <option value="THAI">🇹🇭 ปริญญาตรี (ภาคภาษาไทย)</option>
              <option value="ENGLISH">🇬🇧 ปริญญาตรี (ภาคภาษาอังกฤษ)</option>
              <option value="GRADUATE">🎓 บัณฑิตศึกษา</option>
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
          {(search ||
            degreeFilter !== "ALL" ||
            languageFilter !== "ALL" ||
            yearFilter !== "ALL" ||
            deptFilter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setDegreeFilter("ALL");
                setLanguageFilter("ALL");
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
                <th className="py-3 px-4">ระดับ / ชั้นปี</th>
                <th className="py-3 px-4">หลักสูตร</th>
                <th className="py-3 px-4">สาขาวิชา / ภาควิชา</th>
                <th className="py-3 px-4 text-center">วิชาที่ลงเรียน</th>
                <th className="py-3 px-4 text-center">สถานะ</th>
                <th className="py-3 px-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
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
                        {(() => {
                          const prog = getStudentProgramType(student);
                          if (prog === "ENGLISH") {
                            return (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                  🇬🇧 (ภาษาอังกฤษ)
                                </span>
                                {student.curriculumName && (
                                  <div
                                    className="text-2xs text-muted-foreground truncate max-w-[180px]"
                                    title={student.curriculumName}
                                  >
                                    {student.curriculumName}
                                  </div>
                                )}
                              </div>
                            );
                          }
                          if (prog === "GRADUATE") {
                            return (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                                  🎓 บัณฑิตศึกษา
                                </span>
                                {student.curriculumName && (
                                  <div
                                    className="text-2xs text-muted-foreground truncate max-w-[180px]"
                                    title={student.curriculumName}
                                  >
                                    {student.curriculumName}
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                                🇹🇭 (ภาษาไทย)
                              </span>
                              {student.curriculumName && (
                                <div
                                  className="text-2xs text-muted-foreground truncate max-w-[180px]"
                                  title={student.curriculumName}
                                >
                                  {student.curriculumName}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-foreground text-xs">
                          {getStudentMajorDisplay(student)}
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
              <div className="p-5 border-b border-border flex items-center justify-between">
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
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

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
                        onChange={(e) => {
                          const newCode = e.target.value.trim();
                          setFormData((prev) => {
                            const oldDefaultEmail = prev.studentCode ? `${prev.studentCode}@mcu.ac.th` : "";
                            const shouldAutoUpdate =
                              !prev.email ||
                              prev.email === oldDefaultEmail ||
                              prev.email === "student@mcu.ac.th";
                            return {
                              ...prev,
                              studentCode: newCode,
                              email: shouldAutoUpdate && newCode ? `${newCode}@mcu.ac.th` : prev.email,
                            };
                          });
                        }}
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
                      ชื่อหลักสูตร / หลักสูตรภาษา
                    </label>
                    <input
                      type="text"
                      value={formData.curriculumName}
                      onChange={(e) => setFormData({ ...formData, curriculumName: e.target.value })}
                      placeholder="เช่น พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา หรือระบุ (หลักสูตรภาษาอังกฤษ)"
                      className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <p className="text-2xs text-muted-foreground mt-1">
                      💡 หากเป็นภาคภาษาอังกฤษ ให้มีคำว่า &ldquo;(หลักสูตรภาษาอังกฤษ)&rdquo; หรือ &ldquo;English Program&rdquo; ในชื่อหลักสูตร
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-foreground">
                        สาขาวิชา / ภาควิชา
                      </label>
                      <div className="flex items-center gap-1.5 text-2xs">
                        <span className="text-muted-foreground">แนะนำ:</span>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              department: "Buddhist Studies",
                              major: "Buddhist Studies",
                            }))
                          }
                          className="px-2 py-0.5 rounded bg-muted hover:bg-primary/10 hover:text-primary transition font-medium"
                          title="คลิกเพื่อเลือก Buddhist Studies (ภาคภาษาอังกฤษ)"
                        >
                          Buddhist Studies
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              department: "Religion and Philosophy",
                              major: "Religion and Philosophy",
                            }))
                          }
                          className="px-2 py-0.5 rounded bg-muted hover:bg-primary/10 hover:text-primary transition font-medium"
                          title="คลิกเพื่อเลือก Religion and Philosophy (ภาคภาษาอังกฤษ)"
                        >
                          Religion and Philosophy
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          department: e.target.value,
                          major: e.target.value,
                        })
                      }
                      placeholder="เช่น Buddhist Studies, Religion and Philosophy, สาขาวิชาพระพุทธศาสนา"
                      className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-medium text-foreground">
                          อีเมล (MCU Email)
                        </label>
                        {formData.studentCode && (
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                email: `${prev.studentCode}@mcu.ac.th`,
                              }))
                            }
                            className="text-2xs text-primary hover:underline cursor-pointer"
                            title="คลิกเพื่อใส่อีเมลรหัสนิสิต@mcu.ac.th"
                          >
                            ใช้ {formData.studentCode}@mcu.ac.th
                          </button>
                        )}
                      </div>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder={
                          formData.studentCode
                            ? `${formData.studentCode}@mcu.ac.th`
                            : "รหัสนิสิต@mcu.ac.th"
                        }
                        className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">
                        เบอร์โทรศัพท์ (ไม่จำเป็นต้องกรอก)
                      </label>
                      <input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        placeholder="ไม่จำเป็นต้องกรอก (เว้นว่างได้)"
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
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-foreground text-sm">
                    รายวิชาที่ลงทะเบียน: {viewingCoursesStudent.firstName}{" "}
                    {viewingCoursesStudent.lastName}
                  </h3>
                  <p className="text-2xs text-muted-foreground font-mono">
                    รหัสนิสิต: {viewingCoursesStudent.studentCode}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingCoursesStudent(null)}
                  className="w-8 h-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

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

      {/* ── IMPORT MODAL ── */}
      {isImportOpen && (
        <LiyonDialog open={isImportOpen} onOpenChange={setIsImportOpen}>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-card w-full max-w-2xl rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
              <div className="p-5 border-b border-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-base">
                      นำเข้า / อัปเดตข้อมูลนิสิต (Batch Import & Update)
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      อัปโหลดไฟล์ CSV หรือวางข้อมูลเพื่อสร้างใหม่และอัปเดตนิสิตตามรหัสนิสิต
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsImportOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <LiyonDialogBody className="p-5 space-y-4 overflow-y-auto flex-1">
                {/* Actions & Template Download */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-muted/40 border border-border">
                  <div className="text-xs">
                    <span className="font-semibold text-foreground">มีไฟล์ต้นแบบแล้วหรือยัง?</span>
                    <p className="text-2xs text-muted-foreground mt-0.5">
                      ดาวน์โหลดไฟล์แม่แบบ CSV เพื่อนำไปกรอกในโปรแกรม Excel ได้อย่างถูกต้อง
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition shadow-2xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-primary" />
                    ดาวน์โหลดแม่แบบ CSV
                  </button>
                </div>

                {/* Upload Section */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-foreground">
                    1. เลือกไฟล์ CSV หรือลากไฟล์มาวาง
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border hover:border-primary/50 bg-muted/20 hover:bg-muted/40 rounded-xl p-5 text-center cursor-pointer transition"
                  >
                    <FileSpreadsheet className="w-8 h-8 mx-auto text-primary mb-2" />
                    <p className="text-xs font-medium text-foreground">
                      {importFileName ? (
                        <span className="text-primary font-bold">📄 {importFileName}</span>
                      ) : (
                        "คลิกเพื่อเลือกไฟล์ .csv จากคอมพิวเตอร์"
                      )}
                    </p>
                    <p className="text-2xs text-muted-foreground mt-1">
                      รองรับไฟล์ UTF-8 CSV ที่ส่งออกจาก Excel หรือ Google Sheets
                    </p>
                  </div>
                </div>

                {/* Or Paste Raw Text */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-foreground">
                    2. หรือ วางข้อมูลจาก Excel โดยตรง (Copy & Paste)
                  </label>
                  <textarea
                    rows={4}
                    value={importRawText}
                    onChange={(e) => {
                      setImportRawText(e.target.value);
                      if (importFileName) setImportFileName("");
                    }}
                    placeholder={`รหัสนิสิต,คำนำหน้า,ชื่อ,นามสกุล,ระดับการศึกษา,ชั้นปี,ชื่อหลักสูตร,สาขาวิชา,คณะ,อีเมล,เบอร์โทร\n6601201001,พระ,สมชาย,ปญฺญาธโร,ปริญญาตรี,1,พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา,ภาควิชาพระพุทธศาสนา,คณะพุทธศาสตร์,somchai@mcu.ac.th,0812345678\n6601202002,พระ,John,Dhammiko,ปริญญาตรี,1,พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา (หลักสูตรภาษาอังกฤษ),ภาควิชาพระพุทธศาสนา,คณะพุทธศาสตร์,john@mcu.ac.th,0898765432`}
                    className="w-full p-3 rounded-xl bg-muted/30 border border-border text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Preview parsed data */}
                {parsedImportItems.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-500" />
                        ตรวจสอบข้อมูลพร้อมนำเข้า:{" "}
                        <strong className="text-primary">{parsedImportItems.length} คน</strong>
                      </span>
                      <span className="text-2xs text-muted-foreground">
                        (แสดงตัวอย่าง 5 คนแรก)
                      </span>
                    </div>

                    <div className="rounded-xl border border-border overflow-hidden bg-card text-xs">
                      <div className="overflow-x-auto max-h-48">
                        <table className="w-full text-left">
                          <thead className="bg-muted text-2xs text-muted-foreground sticky top-0">
                            <tr>
                              <th className="py-2 px-3">รหัสนิสิต</th>
                              <th className="py-2 px-3">ชื่อ - นามสกุล</th>
                              <th className="py-2 px-3">ระดับ / ชั้นปี</th>
                              <th className="py-2 px-3">หลักสูตร</th>
                              <th className="py-2 px-3">สาขาวิชา</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border text-2xs">
                            {parsedImportItems.slice(0, 5).map((item, idx) => (
                              <tr key={idx} className="hover:bg-muted/30">
                                <td className="py-2 px-3 font-mono font-semibold">
                                  {item.studentCode}
                                </td>
                                <td className="py-2 px-3 font-medium">
                                  {item.title} {item.firstName} {item.lastName}
                                </td>
                                <td className="py-2 px-3">
                                  {item.degree} ปี {item.yearLevel}
                                </td>
                                <td className="py-2 px-3 text-muted-foreground truncate max-w-[150px]">
                                  {item.curriculumName}
                                </td>
                                <td className="py-2 px-3 text-muted-foreground truncate max-w-[150px]">
                                  {item.department}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </LiyonDialogBody>

              <LiyonDialogFooter className="p-4 border-t border-border flex items-center justify-between bg-muted/20 shrink-0">
                <p className="text-2xs text-muted-foreground">
                  * หากรหัสนิสิตมีอยู่แล้ว ระบบจะอัปเดตข้อมูลเดิมให้อัตโนมัติ
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsImportOpen(false);
                      setImportRawText("");
                      setImportFileName("");
                    }}
                    className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-medium cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    disabled={isImporting || parsedImportItems.length === 0}
                    onClick={handleExecuteImport}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition cursor-pointer"
                  >
                    {isImporting
                      ? "กำลังนำเข้าข้อมูล..."
                      : `ยืนยันนำเข้า (${parsedImportItems.length} คน)`}
                  </button>
                </div>
              </LiyonDialogFooter>
            </div>
          </div>
        </LiyonDialog>
      )}
    </div>
  );
}
