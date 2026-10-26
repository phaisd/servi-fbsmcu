/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import * as React from "react";
import {
  Users,
  Search,
  Plus,
  Trash2,
  Edit2,
  GraduationCap,
  BookOpen,
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
  Check,
  X,
  BarChart3,
  Table2,
  Activity,
  Calendar,
  Award,
  Printer,
  Clock,
} from "lucide-react";
import {
  LiyonCard,
  LiyonDialog,
  LiyonDialogBody,
  LiyonDialogFooter,
} from "@/shared/components/liyon";
import { toast } from "sonner";
import {
  createOrUpdateStudentAction,
  deleteStudentAction,
  batchImportStudentsAction,
  updateStudentStudyStatusAction,
} from "@/features/attendance/actions";
import { getStudentActivityTranscriptAction } from "@/features/events/actions";
import {
  StudentActivityTranscriptDocument,
  type StudentActivityTranscriptData,
} from "@/components/documents/student-activity-transcript-document";
import {
  StudentSemesterAttendanceDocument,
  type StudentSemesterAttendanceData,
  type StudentSemesterAttendanceCourseItem,
} from "@/components/documents/student-semester-attendance-document";


export const STUDENT_STUDY_STATUS_OPTIONS = [
  { value: "ปกติ", label: "ปกติ (Active)", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800" },
  { value: "เทียบโอน", label: "เทียบโอน (Credit Transfer)", color: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-300 dark:border-indigo-800" },
  { value: "ย้ายเข้า", label: "ย้ายเข้า (Transferred In)", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800" },
  { value: "ย้ายออก", label: "ย้ายออก (Transferred Out)", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-800" },
  { value: "ลาออก", label: "ลาออก (Resigned)", color: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800" },
  { value: "ลาพักการศึกษา", label: "ลาพักการศึกษา (Leave of Absence)", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800" },
  { value: "รักษาสถานภาพ", label: "รักษาสถานภาพ (Retaining Status)", color: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-800" },
  { value: "พ้นสภาพ", label: "พ้นสภาพ (Dismissed)", color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800" },
  { value: "สำเร็จการศึกษา", label: "สำเร็จการศึกษา (Graduated)", color: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-300 dark:border-teal-800" },
  { value: "นิสิตใหม่ (รอออกรหัส)", label: "นิสิตใหม่ (รอออกรหัส)", color: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-300 dark:border-cyan-800" },
];

export function getStudyStatusStyle(status?: string | null) {
  const match = STUDENT_STUDY_STATUS_OPTIONS.find((s) => s.value === status);
  return match ? match.color : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800";
}

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
  nationality?: string | null;
  country?: string | null;
  address?: string | null;
  studyStatus?: string | null;
  faculty?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  isActive: boolean;
  createdAt: string | Date;
  enrollments: {
    course: {
      id: string;
      courseCode: string;
      courseName: string;
      courseNameEn?: string | null;
      academicYear: string;
      semester: number;
      credits?: number | null;
      targetSessions?: number | null;
    };
    stats?: {
      present: number;
      late: number;
      excused: number;
      absent: number;
      totalConducted: number;
      percentage: number;
    };
  }[];
  eventRegistrations?: {
    studentCode: string;
    status: string;
    event: {
      id: string;
      title: string;
      startDate: string | Date;
    };
  }[];
  activityStats?: {
    total: number;
    attended: number;
    percentage: number;
  };
  attendanceStats?: {
    totalSessions: number;
    attendedSessions: number;
    percentage: number;
  };
}

interface StudentsDirectoryClientProps {
  initialStudents: StudentItem[];
  isSuperAdmin?: boolean;
  currentUserId?: string;
  scopedNotice?: string | null;
}

export function StudentsDirectoryClient({
  initialStudents,
  isSuperAdmin: _isSuperAdmin,
  scopedNotice,
}: StudentsDirectoryClientProps) {
  const [students, setStudents] = React.useState<StudentItem[]>(initialStudents);

  // View Mode: DIRECTORY vs COHORT_MATRIX
  const [viewMode, setViewMode] = React.useState<"DIRECTORY" | "COHORT_MATRIX">("DIRECTORY");

  // Cohort Matrix Filters & Drill-down Modal
  const [cohortAdmissionYear, setCohortAdmissionYear] = React.useState<string>("ALL");
  const [cohortDegreeFilter, setCohortDegreeFilter] = React.useState<string>("ALL");
  const [cohortProgramFilter, setCohortProgramFilter] = React.useState<string>("ALL");
  const [drillDownGroup, setDrillDownGroup] = React.useState<{
    title: string;
    curriculum: string;
    yearLevel?: number | string;
    students: StudentItem[];
  } | null>(null);
  const [drillDownSearch, setDrillDownSearch] = React.useState("");

  const [search, setSearch] = React.useState("");
  const [degreeFilter, setDegreeFilter] = React.useState<string>("ALL");
  const [languageFilter, setLanguageFilter] = React.useState<string>("ALL");
  const [yearFilter, setYearFilter] = React.useState<number | "ALL">("ALL");
  const [deptFilter, setDeptFilter] = React.useState<string>("ALL");
  const [countryFilter, setCountryFilter] = React.useState<string>("ALL");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");

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
    gender: "",
    nationality: "",
    country: "",
    address: "",
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

  // Activity Transcript Modal State
  const [transcriptData, setTranscriptData] = React.useState<StudentActivityTranscriptData | null>(null);
  const [_isLoadingTranscript, setIsLoadingTranscript] = React.useState(false);

  const handleOpenStudentTranscript = async (studentCode: string) => {
    setIsLoadingTranscript(true);
    try {
      const res = await getStudentActivityTranscriptAction(studentCode);
      setTranscriptData(res as StudentActivityTranscriptData);
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || "ไม่สามารถโหลดระเบียนกิจกรรมได้");
    } finally {
      setIsLoadingTranscript(false);
    }
  };

  // Semester Attendance Transcript Document Modal State
  const [semesterAttendanceDoc, setSemesterAttendanceDoc] = React.useState<StudentSemesterAttendanceData | null>(null);

  const handleOpenStudentSemesterAttendance = (
    student: StudentItem,
    targetTerm?: {
      termKey: string;
      semester: number;
      academicYear: string;
      courses: StudentItem["enrollments"];
      totalConducted: number;
      totalAttended: number;
      percentage: number;
    }
  ) => {
    let termData = targetTerm;
    if (!termData) {
      interface TermSummaryBucket {
        termKey: string;
        semester: number;
        academicYear: string;
        courses: StudentItem["enrollments"];
        totalConducted: number;
        totalAttended: number;
        percentage: number;
      }
      const termMap = new Map<string, TermSummaryBucket>();
      student.enrollments.forEach((en) => {
        const sem = en.course.semester || 1;
        const yr = en.course.academicYear || "2568";
        const termKey = `ภาค ${sem}/${yr}`;
        if (!termMap.has(termKey)) {
          termMap.set(termKey, {
            termKey,
            semester: sem,
            academicYear: yr,
            courses: [],
            totalConducted: 0,
            totalAttended: 0,
            percentage: 100,
          });
        }
        const td = termMap.get(termKey)!;
        td.courses.push(en);
        const conducted = en.stats?.totalConducted || 0;
        const attended =
          (en.stats?.present || 0) + (en.stats?.late || 0) + (en.stats?.excused || 0);
        td.totalConducted += conducted;
        td.totalAttended += attended;
      });

      const terms = Array.from(termMap.values())
        .map((t) => ({
          ...t,
          percentage:
            t.totalConducted > 0 ? Math.round((t.totalAttended / t.totalConducted) * 100) : 100,
        }))
        .sort((a, b) => {
          if (a.academicYear !== b.academicYear) return b.academicYear.localeCompare(a.academicYear);
          return b.semester - a.semester;
        });

      if (terms.length === 0) {
        toast.info(`นิสิต ${student.studentCode} ยังไม่มีประวัติการลงทะเบียนในระบบ`);
        return;
      }
      termData = terms[0];
    }

    if (!termData) return;

    const courses: StudentSemesterAttendanceCourseItem[] = termData.courses.map((en) => {
      const stats = en.stats;
      const conducted = stats?.totalConducted || 0;
      const present = stats?.present || 0;
      const late = stats?.late || 0;
      const excused = stats?.excused || 0;
      const absent = stats?.absent || 0;
      const percentage = conducted > 0 ? stats?.percentage || 100 : 100;
      return {
        id: en.course.id,
        courseCode: en.course.courseCode,
        courseName: en.course.courseName,
        courseNameEn: en.course.courseNameEn,
        credits: en.course.credits || 3,
        totalConducted: conducted,
        present,
        late,
        excused,
        absent,
        percentage,
        isEligible: percentage >= 80,
      };
    });

    const totalCourses = courses.length;
    const totalCredits = courses.reduce((acc, c) => acc + c.credits, 0);
    const totalConducted = courses.reduce((acc, c) => acc + c.totalConducted, 0);
    const totalPresent = courses.reduce((acc, c) => acc + c.present, 0);
    const totalLate = courses.reduce((acc, c) => acc + c.late, 0);
    const totalExcused = courses.reduce((acc, c) => acc + c.excused, 0);
    const totalAbsent = courses.reduce((acc, c) => acc + c.absent, 0);
    const totalAttended = totalPresent + totalLate + totalExcused;
    const overallPercentage =
      totalConducted > 0 ? Math.round((totalAttended / totalConducted) * 100) : 100;
    const eligibleCount = courses.filter((c) => c.percentage >= 80).length;
    const atRiskCount = courses.filter((c) => c.percentage >= 75 && c.percentage < 80).length;
    const ineligibleCount = courses.filter((c) => c.percentage < 75).length;

    const docData: StudentSemesterAttendanceData = {
      student: {
        studentCode: student.studentCode,
        fullName: `${student.title || ""}${student.firstName} ${student.lastName}`.trim(),
        title: student.title,
        degree: student.degree,
        faculty: student.faculty,
        department: student.department,
        major: student.major,
        yearLevel: student.yearLevel,
        studyStatus: student.studyStatus,
      },
      term: {
        termKey: termData.termKey,
        semester: termData.semester,
        academicYear: termData.academicYear,
      },
      courses,
      summary: {
        totalCourses,
        totalCredits,
        totalConducted,
        totalAttended,
        totalPresent,
        totalLate,
        totalExcused,
        totalAbsent,
        overallPercentage,
        isOverallEligible: ineligibleCount === 0 && atRiskCount === 0,
        eligibleCount,
        atRiskCount,
        ineligibleCount,
        referenceNo: `MCU-ATT-${student.studentCode}-${termData.academicYear}${termData.semester}`,
        issuedDate: new Date().toISOString(),
      },
    };

    setSemesterAttendanceDoc(docData);
  };

  // Dynamic Departments based on students and active languageFilter
  const availableDepartments = React.useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (languageFilter === "THAI" && getStudentProgramType(s) !== "THAI") return;
      if (languageFilter === "ENGLISH" && getStudentProgramType(s) !== "ENGLISH") return;
      if (languageFilter === "GRADUATE" && getStudentProgramType(s) !== "GRADUATE") return;

      const display = getStudentMajorDisplay(s);
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

  // Dynamic Countries list based on students
  const availableCountries = React.useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.country && s.country.trim()) {
        set.add(s.country.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "th"));
  }, [students]);

  // Statistics
  const stats = React.useMemo(() => {
    const total = students.length;
    const thaiProgram = students.filter((s) => getStudentProgramType(s) === "THAI").length;
    const englishProgram = students.filter((s) => getStudentProgramType(s) === "ENGLISH").length;
    const graduate = students.filter((s) => getStudentProgramType(s) === "GRADUATE").length;
    const totalEnrollments = students.reduce((acc, s) => acc + (s.enrollments?.length || 0), 0);
    return { total, thaiProgram, englishProgram, graduate, totalEnrollments };
  }, [students]);

  // Helper: extract BE admission year from student code (e.g. 6801001 -> 2568, 2568001 -> 2568, TEMP-68... -> 2568)
  const getStudentAdmissionYear = React.useCallback((code?: string | null): string | null => {
    if (!code) return null;
    const clean = code.trim();
    const m4 = clean.match(/^25(\d{2})/);
    if (m4) return `25${m4[1]}`;
    const m2 = clean.match(/(?:^|TEMP-?)(\d{2})/i);
    if (m2 && parseInt(m2[1], 10) >= 40 && parseInt(m2[1], 10) <= 99) {
      return `25${m2[1]}`;
    }
    return null;
  }, []);

  // Unique cohort admission years
  const cohortAdmissionYearsList = React.useMemo(() => {
    const yearsMap = new Map<string, number>();
    students.forEach((s) => {
      const yr = getStudentAdmissionYear(s.studentCode);
      if (yr) {
        yearsMap.set(yr, (yearsMap.get(yr) || 0) + 1);
      } else {
        yearsMap.set("OTHER", (yearsMap.get("OTHER") || 0) + 1);
      }
    });

    return Array.from(yearsMap.entries())
      .filter(([yr]) => yr !== "OTHER")
      .sort((a, b) => b[0].localeCompare(a[0]));
  }, [students, getStudentAdmissionYear]);

  // Filtered students for Cohort Matrix
  const cohortFilteredStudents = React.useMemo(() => {
    return students.filter((s) => {
      // Filter by Admission Year
      if (cohortAdmissionYear !== "ALL") {
        const studentYr = getStudentAdmissionYear(s.studentCode);
        if (cohortAdmissionYear === "OLDER") {
          if (studentYr && ["2569", "2568", "2567", "2566"].includes(studentYr)) return false;
        } else if (studentYr !== cohortAdmissionYear) {
          return false;
        }
      }

      // Filter by Degree
      if (cohortDegreeFilter !== "ALL") {
        const d = (s.degree || "").toLowerCase();
        if (cohortDegreeFilter === "BACHELOR" && !d.includes("ตรี")) return false;
        if (cohortDegreeFilter === "MASTER" && !d.includes("โท")) return false;
        if (cohortDegreeFilter === "DOCTORATE" && !d.includes("เอก")) return false;
      }

      // Filter by Program
      if (cohortProgramFilter !== "ALL") {
        const p = getStudentProgramType(s);
        if (cohortProgramFilter !== p) return false;
      }

      return true;
    });
  }, [students, cohortAdmissionYear, cohortDegreeFilter, cohortProgramFilter, getStudentAdmissionYear]);

  // Cohort Matrix Rows (Grouped by Curriculum)
  const cohortMatrixRows = React.useMemo(() => {
    interface MatrixRow {
      curriculumName: string;
      department: string;
      programType: "ENGLISH" | "THAI" | "GRADUATE";
      year1: StudentItem[];
      year2: StudentItem[];
      year3: StudentItem[];
      year4: StudentItem[];
      otherYears: StudentItem[];
      total: StudentItem[];
    }

    const rowMap = new Map<string, MatrixRow>();

    const canonicalOrder = [
      "พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา (หลักสูตรภาษาอังกฤษ)",
      "พุทธศาสตรบัณฑิต สาขาวิชาศาสนาและปรัชญา (หลักสูตรภาษาอังกฤษ)",
      "พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา",
      "พุทธศาสตรบัณฑิต สาขาวิชาศาสนาและปรัชญา",
      "พุทธศาสตรบัณฑิต สาขาวิชาวิปัสสนาภาวนา",
      "พุทธศาสตรบัณฑิต สาขาวิชาบาลีสันสกฤต",
    ];

    canonicalOrder.forEach((cName) => {
      let dept = "ภาควิชาพระพุทธศาสนา";
      if (cName.includes("ปรัชญา")) dept = "ภาควิชาศาสนาและปรัชญา";
      else if (cName.includes("บาลี")) dept = "ภาควิชาบาลีสันสกฤต";

      rowMap.set(cName, {
        curriculumName: cName,
        department: dept,
        programType: cName.includes("ภาษาอังกฤษ") ? "ENGLISH" : "THAI",
        year1: [],
        year2: [],
        year3: [],
        year4: [],
        otherYears: [],
        total: [],
      });
    });

    cohortFilteredStudents.forEach((s) => {
      const rawCName = s.curriculumName?.trim() || "ไม่ระบุหลักสูตร";
      let key = rawCName;

      for (const c of canonicalOrder) {
        if (rawCName.toLowerCase().includes(c.toLowerCase()) || rawCName === c) {
          key = c;
          break;
        }
      }

      if (!rowMap.has(key)) {
        rowMap.set(key, {
          curriculumName: key,
          department: s.department || "คณะพุทธศาสตร์",
          programType: getStudentProgramType(s),
          year1: [],
          year2: [],
          year3: [],
          year4: [],
          otherYears: [],
          total: [],
        });
      }

      const row = rowMap.get(key)!;
      row.total.push(s);

      if (s.yearLevel === 1) row.year1.push(s);
      else if (s.yearLevel === 2) row.year2.push(s);
      else if (s.yearLevel === 3) row.year3.push(s);
      else if (s.yearLevel === 4) row.year4.push(s);
      else row.otherYears.push(s);
    });

    return Array.from(rowMap.values()).sort((a, b) => {
      const idxA = canonicalOrder.indexOf(a.curriculumName);
      const idxB = canonicalOrder.indexOf(b.curriculumName);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return b.total.length - a.total.length;
    });
  }, [cohortFilteredStudents]);

  // Totals for Cohort Matrix
  const cohortMatrixTotals = React.useMemo(() => {
    let year1 = 0;
    let year2 = 0;
    let year3 = 0;
    let year4 = 0;
    let otherYears = 0;
    let grandTotal = 0;

    cohortMatrixRows.forEach((r) => {
      year1 += r.year1.length;
      year2 += r.year2.length;
      year3 += r.year3.length;
      year4 += r.year4.length;
      otherYears += r.otherYears.length;
      grandTotal += r.total.length;
    });

    return { year1, year2, year3, year4, otherYears, grandTotal };
  }, [cohortMatrixRows]);


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
        (s.country && s.country.toLowerCase().includes(q)) ||
        (s.nationality && s.nationality.toLowerCase().includes(q)) ||
        (s.address && s.address.toLowerCase().includes(q)) ||
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

      const matchCountry = countryFilter === "ALL" || (s.country || "").trim() === countryFilter;

      const matchStatus = statusFilter === "ALL" || (s.studyStatus || "ปกติ") === statusFilter;

      return matchSearch && matchDegree && matchLanguage && matchYear && matchDept && matchCountry && matchStatus;
    });
  }, [students, search, degreeFilter, languageFilter, yearFilter, deptFilter, countryFilter, statusFilter]);

  // Pagination slice
  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedStudents = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage]);

  // Group student enrollments by term (semester/academicYear) for Student Profile Card
  const studentTermBreakdown = React.useMemo(() => {
    if (!viewingCoursesStudent) return [];
    const termMap = new Map<
      string,
      {
        termKey: string;
        semester: number;
        academicYear: string;
        courses: typeof viewingCoursesStudent.enrollments;
        totalConducted: number;
        totalAttended: number;
        percentage: number;
      }
    >();

    viewingCoursesStudent.enrollments.forEach((en) => {
      const sem = en.course.semester || 1;
      const yr = en.course.academicYear || "2568";
      const termKey = `ภาค ${sem}/${yr}`;
      if (!termMap.has(termKey)) {
        termMap.set(termKey, {
          termKey,
          semester: sem,
          academicYear: yr,
          courses: [],
          totalConducted: 0,
          totalAttended: 0,
          percentage: 100,
        });
      }
      const termData = termMap.get(termKey)!;
      termData.courses.push(en);
      const conducted = en.stats?.totalConducted || 0;
      const attended =
        (en.stats?.present || 0) + (en.stats?.late || 0) + (en.stats?.excused || 0);
      termData.totalConducted += conducted;
      termData.totalAttended += attended;
    });

    return Array.from(termMap.values())
      .map((t) => ({
        ...t,
        percentage:
          t.totalConducted > 0 ? Math.round((t.totalAttended / t.totalConducted) * 100) : 100,
      }))
      .sort((a, b) => {
        if (a.academicYear !== b.academicYear) return b.academicYear.localeCompare(a.academicYear);
        return b.semester - a.semester;
      });
  }, [viewingCoursesStudent]);

  // Reset page when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, degreeFilter, languageFilter, yearFilter, deptFilter, countryFilter, statusFilter]);

  // Reset deptFilter if no longer available in the current language filter
  React.useEffect(() => {
    if (deptFilter !== "ALL" && !availableDepartments.includes(deptFilter)) {
      setDeptFilter("ALL");
    }
  }, [availableDepartments, deptFilter]);

  const generateNextTempStudentCode = React.useCallback(
    (yearShort = "68") => {
      const regex = new RegExp(`^TEMP-${yearShort}(\\d+)$`, "i");
      let maxNum = 0;
      students.forEach((s) => {
        const m = (s.studentCode || "").trim().match(regex);
        if (m) {
          const n = parseInt(m[1], 10);
          if (!isNaN(n) && n > maxNum) maxNum = n;
        }
      });
      return `TEMP-${yearShort}${String(maxNum + 1).padStart(3, "0")}`;
    },
    [students]
  );

  const handleGenerateTempStudentId = (yearShort = "68", applyInterDefaults = true) => {
    const nextCode = generateNextTempStudentCode(yearShort);
    setFormData((prev) => ({
      ...prev,
      studentCode: nextCode,
      yearLevel: 1,
      studyStatus: "นิสิตใหม่ (รอออกรหัส)",
      email: `${nextCode.toLowerCase()}@mcu.ac.th`,
      ...(applyInterDefaults
        ? {
            degree: prev.degree || "ปริญญาตรี",
            major: prev.major || "Buddhist Studies",
            department: prev.department || "ภาควิชาพระพุทธศาสนา",
            curriculumName:
              prev.curriculumName && prev.curriculumName.includes("ภาษาอังกฤษ")
                ? prev.curriculumName
                : "พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา (หลักสูตรภาษาอังกฤษ)",
            faculty: "คณะพุทธศาสตร์",
          }
        : {}),
    }));
    toast.success(`สร้างรหัสนิสิตชั่วคราว ${nextCode} สำหรับนิสิตใหม่ต่างประเทศเรียบร้อยแล้ว`);
  };

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
      gender: "",
      nationality: "",
      country: "",
      address: "",
    });
    setIsModalOpen(true);
  };


  const handleQuickStatusChange = async (studentId: string, newStatus: string) => {
    // Optimistic update
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, studyStatus: newStatus } : s))
    );

    try {
      const res = await updateStudentStudyStatusAction(studentId, newStatus);
      if (res && res.success) {
        toast.success(`เปลี่ยนสถานภาพเป็น "${newStatus}" เรียบร้อยแล้ว`);
      } else {
        throw new Error("Failed");
      }
    } catch {
      toast.error("ไม่สามารถเปลี่ยนสถานภาพได้ โปรดลองอีกครั้ง");
    }
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
      gender: student.gender || "",
      nationality: student.nationality || "",
      country: student.country || "",
      address: student.address || "",
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
        gender: formData.gender.trim() || null,
        nationality: formData.nationality.trim() || null,
        country: formData.country.trim() || null,
        address: formData.address.trim() || null,
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
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || "เกิดข้อผิดพลาด");
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
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || "เกิดข้อผิดพลาดในการลบ");
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
        const lastName = tokens[headerMap["lastName"]] || "";
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
        const studyStatus = "ปกติ";
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
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || "เกิดข้อผิดพลาดในการนำเข้าข้อมูล");
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

      {/* ── SCOPED OFFICER BANNER ── */}
      {scopedNotice && (
        <div className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl text-xs">
          <span className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 shrink-0 text-base">
            🔒
          </span>
          <div className="space-y-0.5">
            <span className="font-bold text-amber-900 dark:text-amber-200 block text-xs">
              มุมมองเจ้าหน้าที่หลักสูตร: {scopedNotice}
            </span>
            <p className="text-2xs text-amber-700 dark:text-amber-400">
              ระบบจำกัดการแสดงผลและจัดการข้อมูลเฉพาะนิสิตในสาขาวิชาและระดับการศึกษาที่ท่านได้รับมอบหมาย เพื่อความถูกต้องและปลอดภัยของข้อมูลหลักสูตร
            </p>
          </div>
        </div>
      )}

      {/* ── VIEW MODE SWITCHER TABS ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="inline-flex p-1 rounded-2xl bg-muted/80 border border-border shadow-inner">
          <button
            type="button"
            onClick={() => setViewMode("DIRECTORY")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              viewMode === "DIRECTORY"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            <Table2 className="w-4 h-4" />
            <span>ทะเบียนประวัตินิสิต (Directory)</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                viewMode === "DIRECTORY"
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-background text-muted-foreground"
              }`}
            >
              {students.length} คน
            </span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("COHORT_MATRIX")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              viewMode === "COHORT_MATRIX"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>สรุปสถิตินิสิตแยกชั้นปีและหลักสูตร (Cohort Matrix)</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                viewMode === "COHORT_MATRIX"
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-background text-muted-foreground"
              }`}
            >
              ปี 1 - 4
            </span>
          </button>
        </div>

        <div className="text-xs text-muted-foreground hidden lg:flex items-center gap-2 bg-muted/40 px-3 py-1.5 rounded-xl border border-border/50">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>คลิกตัวเลขในตารางเพื่อดูรายชื่อนิสิต • คลิกชื่อนิสิตเพื่อดูบัตรประวัติและสถิติรายเทอม</span>
        </div>
      </div>

      {viewMode === "COHORT_MATRIX" ? (
        <div className="space-y-5">
          {/* ── COHORT FILTERS BAR ── */}
          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  เมทริกซ์สถิติจำนวนนิสิตแยกตามชั้นปีและหลักสูตร
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  วิเคราะห์จำนวนนิสิตแยกชั้นปี (ปี 1, 2, 3, 4) ตามหลักสูตรและปีการศึกษาที่เข้าศึกษา (คลิกตัวเลขเพื่อดูรายชื่อ)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Cohort Year Filter */}
                <div className="flex items-center gap-1.5 bg-muted/50 border border-border px-3 py-1.5 rounded-xl text-xs">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span className="font-semibold text-muted-foreground">ปีที่เข้าศึกษา:</span>
                  <select
                    value={cohortAdmissionYear}
                    onChange={(e) => setCohortAdmissionYear(e.target.value)}
                    className="bg-transparent font-bold text-primary focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">ทุกปีการศึกษาที่เข้าศึกษา (รวมทุกรุ่น)</option>
                    {cohortAdmissionYearsList.map(([yr, count]) => (
                      <option key={yr} value={yr}>
                        ปี {yr} (รหัส {yr.slice(2)}xxxx) - {count} รูป/คน
                      </option>
                    ))}
                    <option value="OLDER">ก่อนปี 2566 (รหัสตกค้าง/เทียบโอน)</option>
                  </select>
                </div>

                {/* Degree Filter */}
                <select
                  value={cohortDegreeFilter}
                  onChange={(e) => setCohortDegreeFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-muted/50 border border-border text-xs font-medium focus:outline-none cursor-pointer"
                >
                  <option value="ALL">🎓 ทุกระดับการศึกษา</option>
                  <option value="BACHELOR">ปริญญาตรี (ทั้งหมด)</option>
                  <option value="MASTER">ปริญญาโท</option>
                  <option value="DOCTORATE">ปริญญาเอก</option>
                </select>

                {/* Program / Language Filter */}
                <select
                  value={cohortProgramFilter}
                  onChange={(e) => setCohortProgramFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-muted/50 border border-border text-xs font-medium focus:outline-none cursor-pointer"
                >
                  <option value="ALL">🌐 ทุกหลักสูตรภาษา</option>
                  <option value="ENGLISH">🇬🇧 ภาคภาษาอังกฤษ (Inter)</option>
                  <option value="THAI">🇹🇭 ภาคภาษาไทย</option>
                  <option value="GRADUATE">🎓 บัณฑิตศึกษา</option>
                </select>
              </div>
            </div>

            {/* Quick Cohort Admission Year Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/60">
              <span className="text-2xs font-bold text-muted-foreground mr-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-primary" />
                ปีการศึกษาที่เข้าศึกษา (รุ่น พ.ศ.):
              </span>
              <button
                type="button"
                onClick={() => setCohortAdmissionYear("ALL")}
                className={`px-2.5 py-1 rounded-lg text-2xs font-bold transition cursor-pointer ${
                  cohortAdmissionYear === "ALL"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                รวมทุกรุ่น (ทุกปี พ.ศ.)
              </button>
              {cohortAdmissionYearsList.map(([yr, count]) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => setCohortAdmissionYear(yr)}
                  className={`px-2.5 py-1 rounded-lg text-2xs font-bold transition cursor-pointer ${
                    cohortAdmissionYear === yr
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  รุ่นปี {yr} ({count} คน)
                </button>
              ))}
              {cohortAdmissionYear !== "ALL" && (
                <button
                  type="button"
                  onClick={() => setCohortAdmissionYear("ALL")}
                  className="text-2xs text-primary font-semibold hover:underline ml-auto"
                >
                  ล้างตัวกรองปี
                </button>
              )}
            </div>
          </div>

          {/* ── COHORT KPI CARDS ── */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <LiyonCard className="p-3.5 border-l-4 border-l-primary bg-card/90">
              <p className="text-2xs text-muted-foreground font-semibold">รวมนิสิตในกลุ่มนี้</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">
                {cohortMatrixTotals.grandTotal} <span className="text-xs font-normal text-muted-foreground">รูป/คน</span>
              </p>
            </LiyonCard>
            <LiyonCard className="p-3.5 border-l-4 border-l-emerald-500 bg-card/90">
              <p className="text-2xs text-muted-foreground font-semibold">ชั้นปี 1 (First Year)</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">
                {cohortMatrixTotals.year1} <span className="text-xs font-normal text-muted-foreground">รูป/คน</span>
              </p>
            </LiyonCard>
            <LiyonCard className="p-3.5 border-l-4 border-l-blue-500 bg-card/90">
              <p className="text-2xs text-muted-foreground font-semibold">ชั้นปี 2 (Second Year)</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">
                {cohortMatrixTotals.year2} <span className="text-xs font-normal text-muted-foreground">รูป/คน</span>
              </p>
            </LiyonCard>
            <LiyonCard className="p-3.5 border-l-4 border-l-amber-500 bg-card/90">
              <p className="text-2xs text-muted-foreground font-semibold">ชั้นปี 3 (Third Year)</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">
                {cohortMatrixTotals.year3} <span className="text-xs font-normal text-muted-foreground">รูป/คน</span>
              </p>
            </LiyonCard>
            <LiyonCard className="p-3.5 border-l-4 border-l-purple-500 bg-card/90">
              <p className="text-2xs text-muted-foreground font-semibold">ชั้นปี 4 (Fourth Year)</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">
                {cohortMatrixTotals.year4} <span className="text-xs font-normal text-muted-foreground">รูป/คน</span>
              </p>
            </LiyonCard>
          </div>

          {/* ── COHORT MATRIX TABLE ── */}
          <div className="rounded-2xl bg-card border border-border shadow-xs overflow-hidden">
            <div className="p-3.5 bg-muted/40 border-b border-border flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Table2 className="w-4 h-4 text-primary" />
                ตารางสรุปจำนวนนิสิตแยกตามหลักสูตรและชั้นปี (คลิกที่ตัวเลขเพื่อดูรายชื่อนิสิต)
              </span>
              <span className="text-2xs text-muted-foreground">
                แสดงผล {cohortMatrixRows.length} หลักสูตร
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/70 text-2xs font-bold text-muted-foreground uppercase border-b border-border">
                  <tr>
                    <th className="py-3 px-3.5 w-10 text-center">#</th>
                    <th className="py-3 px-4 min-w-[260px]">หลักสูตร / สาขาวิชา</th>
                    <th className="py-3 px-3 min-w-[140px]">ภาควิชา</th>
                    <th className="py-3 px-3 text-center">ภาคภาษา</th>
                    <th className="py-3 px-3 text-center bg-emerald-500/5 text-emerald-800 dark:text-emerald-300">
                      ปี 1
                    </th>
                    <th className="py-3 px-3 text-center bg-blue-500/5 text-blue-800 dark:text-blue-300">
                      ปี 2
                    </th>
                    <th className="py-3 px-3 text-center bg-amber-500/5 text-amber-800 dark:text-amber-300">
                      ปี 3
                    </th>
                    <th className="py-3 px-3 text-center bg-purple-500/5 text-purple-800 dark:text-purple-300">
                      ปี 4
                    </th>
                    {cohortMatrixTotals.otherYears > 0 && (
                      <th className="py-3 px-3 text-center">อื่นๆ/บัณฑิต</th>
                    )}
                    <th className="py-3 px-4 text-center font-bold bg-muted/90 text-foreground">
                      รวมทั้งหมด
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {cohortMatrixRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 px-3.5 text-center text-muted-foreground font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-semibold text-foreground">
                        {row.curriculumName}
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">
                        {row.department}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {row.programType === "ENGLISH" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                            🇬🇧 English
                          </span>
                        ) : row.programType === "GRADUATE" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                            🎓 บัณฑิต
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                            🇹🇭 ไทย
                          </span>
                        )}
                      </td>

                      {/* Year 1 */}
                      <td className="py-3 px-3 text-center bg-emerald-500/5">
                        {row.year1.length > 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              setDrillDownGroup({
                                title: `${row.curriculumName} - ชั้นปี 1`,
                                curriculum: row.curriculumName,
                                yearLevel: 1,
                                students: row.year1,
                              })
                            }
                            className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-200 font-bold font-mono transition cursor-pointer shadow-2xs"
                            title="คลิกเพื่อดูรายชื่อนิสิตชั้นปี 1"
                          >
                            {row.year1.length}
                          </button>
                        ) : (
                          <span className="text-muted-foreground/40 font-mono">-</span>
                        )}
                      </td>

                      {/* Year 2 */}
                      <td className="py-3 px-3 text-center bg-blue-500/5">
                        {row.year2.length > 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              setDrillDownGroup({
                                title: `${row.curriculumName} - ชั้นปี 2`,
                                curriculum: row.curriculumName,
                                yearLevel: 2,
                                students: row.year2,
                              })
                            }
                            className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-800 dark:text-blue-200 font-bold font-mono transition cursor-pointer shadow-2xs"
                            title="คลิกเพื่อดูรายชื่อนิสิตชั้นปี 2"
                          >
                            {row.year2.length}
                          </button>
                        ) : (
                          <span className="text-muted-foreground/40 font-mono">-</span>
                        )}
                      </td>

                      {/* Year 3 */}
                      <td className="py-3 px-3 text-center bg-amber-500/5">
                        {row.year3.length > 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              setDrillDownGroup({
                                title: `${row.curriculumName} - ชั้นปี 3`,
                                curriculum: row.curriculumName,
                                yearLevel: 3,
                                students: row.year3,
                              })
                            }
                            className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-200 font-bold font-mono transition cursor-pointer shadow-2xs"
                            title="คลิกเพื่อดูรายชื่อนิสิตชั้นปี 3"
                          >
                            {row.year3.length}
                          </button>
                        ) : (
                          <span className="text-muted-foreground/40 font-mono">-</span>
                        )}
                      </td>

                      {/* Year 4 */}
                      <td className="py-3 px-3 text-center bg-purple-500/5">
                        {row.year4.length > 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              setDrillDownGroup({
                                title: `${row.curriculumName} - ชั้นปี 4`,
                                curriculum: row.curriculumName,
                                yearLevel: 4,
                                students: row.year4,
                              })
                            }
                            className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-800 dark:text-purple-200 font-bold font-mono transition cursor-pointer shadow-2xs"
                            title="คลิกเพื่อดูรายชื่อนิสิตชั้นปี 4"
                          >
                            {row.year4.length}
                          </button>
                        ) : (
                          <span className="text-muted-foreground/40 font-mono">-</span>
                        )}
                      </td>

                      {cohortMatrixTotals.otherYears > 0 && (
                        <td className="py-3 px-3 text-center">
                          {row.otherYears.length > 0 ? (
                            <button
                              type="button"
                              onClick={() =>
                                setDrillDownGroup({
                                  title: `${row.curriculumName} - ชั้นปีอื่นๆ/บัณฑิต`,
                                  curriculum: row.curriculumName,
                                  yearLevel: "อื่นๆ",
                                  students: row.otherYears,
                                })
                              }
                              className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-lg bg-muted hover:bg-muted/80 text-foreground font-bold font-mono transition cursor-pointer"
                            >
                              {row.otherYears.length}
                            </button>
                          ) : (
                            <span className="text-muted-foreground/40 font-mono">-</span>
                          )}
                        </td>
                      )}

                      {/* Row Total */}
                      <td className="py-3 px-4 text-center bg-muted/30">
                        {row.total.length > 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              setDrillDownGroup({
                                title: `${row.curriculumName} (รวมทุกชั้นปี)`,
                                curriculum: row.curriculumName,
                                students: row.total,
                              })
                            }
                            className="inline-flex items-center justify-center min-w-[36px] px-2.5 py-1 rounded-xl bg-primary text-primary-foreground font-bold font-mono text-xs transition cursor-pointer hover:bg-primary/90 shadow-xs"
                            title="คลิกเพื่อดูรายชื่อนิสิตทั้งหมดในหลักสูตรนี้"
                          >
                            {row.total.length}
                          </button>
                        ) : (
                          <span className="text-muted-foreground/40 font-mono">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>

                {/* Grand Total Footer */}
                <tfoot className="bg-muted/90 font-bold border-t-2 border-border text-foreground">
                  <tr>
                    <td colSpan={4} className="py-3.5 px-4 text-right">
                      รวมทั้งสิ้น (Grand Total):
                    </td>
                    <td className="py-3.5 px-3 text-center bg-emerald-500/10 text-emerald-800 dark:text-emerald-200">
                      {cohortMatrixTotals.year1 > 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            const allY1 = cohortFilteredStudents.filter((s) => s.yearLevel === 1);
                            setDrillDownGroup({
                              title: "นิสิตชั้นปี 1 (รวมทุกหลักสูตร)",
                              curriculum: "ทุกหลักสูตร",
                              yearLevel: 1,
                              students: allY1,
                            });
                          }}
                          className="font-mono text-sm underline cursor-pointer"
                        >
                          {cohortMatrixTotals.year1}
                        </button>
                      ) : (
                        "0"
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center bg-blue-500/10 text-blue-800 dark:text-blue-200">
                      {cohortMatrixTotals.year2 > 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            const allY2 = cohortFilteredStudents.filter((s) => s.yearLevel === 2);
                            setDrillDownGroup({
                              title: "นิสิตชั้นปี 2 (รวมทุกหลักสูตร)",
                              curriculum: "ทุกหลักสูตร",
                              yearLevel: 2,
                              students: allY2,
                            });
                          }}
                          className="font-mono text-sm underline cursor-pointer"
                        >
                          {cohortMatrixTotals.year2}
                        </button>
                      ) : (
                        "0"
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center bg-amber-500/10 text-amber-800 dark:text-amber-200">
                      {cohortMatrixTotals.year3 > 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            const allY3 = cohortFilteredStudents.filter((s) => s.yearLevel === 3);
                            setDrillDownGroup({
                              title: "นิสิตชั้นปี 3 (รวมทุกหลักสูตร)",
                              curriculum: "ทุกหลักสูตร",
                              yearLevel: 3,
                              students: allY3,
                            });
                          }}
                          className="font-mono text-sm underline cursor-pointer"
                        >
                          {cohortMatrixTotals.year3}
                        </button>
                      ) : (
                        "0"
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center bg-purple-500/10 text-purple-800 dark:text-purple-200">
                      {cohortMatrixTotals.year4 > 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            const allY4 = cohortFilteredStudents.filter((s) => s.yearLevel === 4);
                            setDrillDownGroup({
                              title: "นิสิตชั้นปี 4 (รวมทุกหลักสูตร)",
                              curriculum: "ทุกหลักสูตร",
                              yearLevel: 4,
                              students: allY4,
                            });
                          }}
                          className="font-mono text-sm underline cursor-pointer"
                        >
                          {cohortMatrixTotals.year4}
                        </button>
                      ) : (
                        "0"
                      )}
                    </td>
                    {cohortMatrixTotals.otherYears > 0 && (
                      <td className="py-3.5 px-3 text-center font-mono">
                        {cohortMatrixTotals.otherYears}
                      </td>
                    )}
                    <td className="py-3.5 px-4 text-center font-mono text-sm bg-primary/15 text-primary">
                      {cohortMatrixTotals.grandTotal} รูป/คน
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ── DIRECTORY CONTENT ── */
        <div className="space-y-6">
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


            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-muted/50 border border-border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="ALL">🌟 ทุกสถานภาพ</option>
              {STUDENT_STUDY_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Country / Nationality Filter */}
            {availableCountries.length > 0 && (
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-muted/50 border border-border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 max-w-[180px]"
              >
                <option value="ALL">🌍 ทุกประเทศ/สัญชาติ</option>
                {availableCountries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
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
            deptFilter !== "ALL" ||
            countryFilter !== "ALL" ||
            statusFilter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setDegreeFilter("ALL");
                setLanguageFilter("ALL");
                setYearFilter("ALL");
                setDeptFilter("ALL");
                setCountryFilter("ALL");
                setStatusFilter("ALL");
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
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`font-mono font-semibold px-2 py-0.5 rounded-md text-xs ${
                              student.studentCode.toUpperCase().startsWith("TEMP-")
                                ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30"
                                : "bg-muted text-foreground"
                            }`}
                          >
                            {student.studentCode}
                          </span>
                          {student.studentCode.toUpperCase().startsWith("TEMP-") && (
                            <span
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400"
                              title="รหัสนิสิตชั่วคราวสำหรับนิสิตใหม่ที่สอบผ่านและรอออกรหัสนิสิต 10 หลัก"
                            >
                              รหัสชั่วคราว
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setViewingCoursesStudent(student)}
                            className="font-semibold text-foreground hover:text-primary hover:underline text-left cursor-pointer transition flex items-center gap-1 group/sname"
                            title="คลิกเพื่อดูบัตรประวัตินิสิตและผลการเรียน"
                          >
                            <span>
                              {student.title ? `${student.title} ` : ""}
                              {student.firstName} {student.lastName}
                            </span>
                            <span className="text-2xs text-muted-foreground group-hover/sname:text-primary opacity-0 group-hover/sname:opacity-100 transition">
                              ↗
                            </span>
                          </button>
                          {student.country && (
                            <span
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-2xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                              title={`สัญชาติ: ${student.nationality || student.country}`}
                            >
                              🌍 {student.country}
                            </span>
                          )}
                          {student.gender && (
                            <span className="text-2xs text-muted-foreground/80 font-normal">
                              ({student.gender === "MALE" || student.gender === "ชาย" ? "ชาย" : student.gender === "FEMALE" || student.gender === "หญิง" ? "หญิง" : student.gender})
                            </span>
                          )}
                        </div>
                        {(student.email || student.phoneNumber || student.address) && (
                          <div className="flex flex-col gap-0.5 text-2xs text-muted-foreground mt-0.5">
                            {(student.email || student.phoneNumber) && (
                              <div className="flex items-center gap-2">
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
                            {student.address && (
                              <div
                                className="truncate max-w-[260px] text-muted-foreground/75"
                                title={student.address}
                              >
                                📍 {student.address}
                              </div>
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
                          <div className="flex flex-col items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setViewingCoursesStudent(student)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition cursor-pointer"
                              title="คลิกเพื่อดูรายละเอียดรายวิชาและสถิติเวลาเรียน"
                            >
                              <BookOpen className="w-3 h-3" />
                              {enrolledCount} วิชา
                            </button>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <span
                                className="font-semibold text-emerald-700 dark:text-emerald-400"
                                title="เปอร์เซ็นต์การเข้าเรียนรวม"
                              >
                                {student.attendanceStats?.percentage ?? 100}% เรียน
                              </span>
                              <span>•</span>
                              <span
                                className="font-semibold text-blue-700 dark:text-blue-400"
                                title="การเข้าร่วมกิจกรรม"
                              >
                                {student.activityStats?.percentage ?? 100}% กิจกรรม
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-2xs text-muted-foreground/60 italic">
                            ยังไม่มีรายวิชา
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <select
                          value={student.studyStatus || "ปกติ"}
                          onChange={(e) => handleQuickStatusChange(student.id, e.target.value)}
                          className={`text-2xs font-semibold rounded-lg px-2 py-1 border transition-all cursor-pointer shadow-2xs hover:shadow-xs focus:ring-1 focus:ring-primary ${getStudyStatusStyle(
                            student.studyStatus
                          )}`}
                          title="คลิกเพื่อเปลี่ยนสถานภาพนิสิตได้ทันที"
                        >
                          {STUDENT_STUDY_STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value} className="bg-background text-foreground">
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenStudentSemesterAttendance(student)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition cursor-pointer"
                            title="พิมพ์ใบรายงานสรุปเวลาเรียน A4 ประจำภาคการศึกษาล่าสุด"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenStudentTranscript(student.studentCode)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition cursor-pointer"
                            title="พิมพ์ระเบียนกิจกรรมสะสม (Activity Transcript A4)"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

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
    </div>
  )}

  {/* ── COHORT DRILL-DOWN STUDENT NAMES MODAL ── */}
  {drillDownGroup && (
    <LiyonDialog
      open={Boolean(drillDownGroup)}
      onOpenChange={() => {
        setDrillDownGroup(null);
        setDrillDownSearch("");
      }}
    >
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5">
        <div className="bg-card w-full max-w-4xl rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between shrink-0 bg-muted/20">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-sm sm:text-base">
                  {drillDownGroup.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  พบทั้งหมด {drillDownGroup.students.length} รูป/คน
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const csvHeader = [
                    "ลำดับ",
                    "รหัสนิสิต",
                    "คำนำหน้า",
                    "ชื่อ",
                    "นามสกุล/ฉายา",
                    "ระดับ",
                    "ชั้นปี",
                    "หลักสูตร",
                    "สัญชาติ",
                    "ประเทศ",
                    "วิชาที่ลงทะเบียน",
                    "% เข้าเรียน",
                    "% กิจกรรม",
                  ];
                  const csvRows = drillDownGroup.students.map((s, i) => [
                    i + 1,
                    `="${s.studentCode}"`,
                    `"${s.title || ""}"`,
                    `"${s.firstName}"`,
                    `"${s.lastName}"`,
                    `"${s.degree || "ปริญญาตรี"}"`,
                    s.yearLevel,
                    `"${s.curriculumName || ""}"`,
                    `"${s.nationality || ""}"`,
                    `"${s.country || ""}"`,
                    s.enrollments?.length || 0,
                    `${s.attendanceStats?.percentage ?? 100}%`,
                    `${s.activityStats?.percentage ?? 100}%`,
                  ]);
                  const csv =
                    "\uFEFF" +
                    [csvHeader.join(","), ...csvRows.map((r) => r.join(","))].join("\n");
                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `cohort_students_${drillDownGroup.yearLevel || "all"}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success("ส่งออกรายชื่อนิสิตกลุ่มนี้เป็น CSV เรียบร้อยแล้ว");
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                ส่งออก CSV
              </button>

              <button
                type="button"
                onClick={() => {
                  setDrillDownGroup(null);
                  setDrillDownSearch("");
                }}
                className="w-8 h-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search in drill-down */}
          <div className="p-3 border-b border-border bg-muted/10 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={drillDownSearch}
                onChange={(e) => setDrillDownSearch(e.target.value)}
                placeholder="ค้นหาชื่อ, รหัสนิสิต, หรือสัญชาติในกลุ่มนี้..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-background border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Table Body */}
          <div className="overflow-y-auto flex-1 p-0">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted text-2xs font-bold text-muted-foreground sticky top-0 border-b border-border">
                <tr>
                  <th className="py-2.5 px-3 text-center w-10">ลำดับ</th>
                  <th className="py-2.5 px-3">รหัสนิสิต</th>
                  <th className="py-2.5 px-3">ชื่อ - นามสกุล</th>
                  <th className="py-2.5 px-3">สัญชาติ / ประเทศ</th>
                  <th className="py-2.5 px-3 text-center">วิชาที่ลง</th>
                  <th className="py-2.5 px-3 text-center">% เข้าเรียน</th>
                  <th className="py-2.5 px-3 text-center">% กิจกรรม</th>
                  <th className="py-2.5 px-3 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {drillDownGroup.students
                  .filter((s) => {
                    const q = drillDownSearch.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      s.studentCode.toLowerCase().includes(q) ||
                      s.firstName.toLowerCase().includes(q) ||
                      s.lastName.toLowerCase().includes(q) ||
                      (s.country && s.country.toLowerCase().includes(q)) ||
                      (s.nationality && s.nationality.toLowerCase().includes(q))
                    );
                  })
                  .map((st, i) => (
                    <tr key={st.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-2 px-3 text-center text-muted-foreground font-mono">
                        {i + 1}
                      </td>
                      <td className="py-2 px-3">
                        <span className="font-mono font-semibold px-2 py-0.5 rounded bg-muted text-foreground">
                          {st.studentCode}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-medium text-foreground">
                        <button
                          type="button"
                          onClick={() => setViewingCoursesStudent(st)}
                          className="font-semibold text-foreground hover:text-primary hover:underline text-left cursor-pointer transition flex items-center gap-1 group/dname"
                          title="คลิกเพื่อดูบัตรประวัตินิสิตและผลการเรียน"
                        >
                          <span>
                            {st.title ? `${st.title} ` : ""}
                            {st.firstName} {st.lastName}
                          </span>
                          <span className="text-2xs text-muted-foreground group-hover/dname:text-primary opacity-0 group-hover/dname:opacity-100 transition">
                            ↗
                          </span>
                        </button>
                      </td>
                      <td className="py-2 px-3 text-muted-foreground">
                        {st.country ? `🌍 ${st.country}` : "-"}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setViewingCoursesStudent(st);
                          }}
                          className="font-bold text-primary hover:underline cursor-pointer"
                        >
                          {st.enrollments?.length || 0} วิชา
                        </button>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="font-bold text-emerald-600">
                          {st.attendanceStats?.percentage ?? 100}%
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="font-bold text-blue-600">
                          {st.activityStats?.percentage ?? 100}%
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            handleOpenEdit(st);
                          }}
                          className="px-2 py-1 rounded-lg hover:bg-muted text-primary text-xs font-semibold cursor-pointer"
                        >
                          แก้ไข
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-border flex justify-end shrink-0 bg-muted/20">
            <button
              type="button"
              onClick={() => {
                setDrillDownGroup(null);
                setDrillDownSearch("");
              }}
              className="px-4 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold cursor-pointer"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </LiyonDialog>
  )}

  {/* ── ADD / EDIT MODAL ── */}
  {/* ── ADD / EDIT STUDENT MODAL ── */}
  {isModalOpen && (
        <LiyonDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5">
            <div className="bg-card w-full max-w-2xl rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh]">
              {/* Modal Header */}
              <div className="p-5 border-b border-border flex items-center justify-between bg-muted/20 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-2xs">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-foreground text-base">
                        {editingStudent ? "แก้ไขข้อมูลนิสิต" : "เพิ่มนิสิตใหม่เข้าระบบ"}
                      </h3>
                      {editingStudent && (
                        <span className="px-2 py-0.5 rounded-full text-2xs font-mono font-bold bg-primary/10 text-primary">
                          {editingStudent.studentCode}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {editingStudent
                        ? `ปรับปรุงข้อมูลของ ${editingStudent.title || ""} ${editingStudent.firstName} ${editingStudent.lastName}`
                        : "บันทึกข้อมูลเข้าสู่ฐานข้อมูลกลางของมหาวิทยาลัย"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSaveStudent} className="flex flex-col flex-1 overflow-hidden">
                <LiyonDialogBody className="p-5 space-y-4 overflow-y-auto flex-1">
                  {/* ── SECTION 1: ข้อมูลประจำตัวนิสิต ── */}
                  <div className="bg-muted/30 dark:bg-muted/10 border border-border/70 rounded-2xl p-4 space-y-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                        <div className="w-5 h-5 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                          <Users className="w-3.5 h-3.5" />
                        </div>
                        <span>ข้อมูลประจำตัวและสถานภาพนิสิต</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleGenerateTempStudentId("68", true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-2xs font-bold transition cursor-pointer shadow-2xs"
                          title="สร้างรหัสชั่วคราวอัตโนมัติ (เช่น TEMP-68001) และตั้งค่าเริ่มต้นสำหรับนิสิตใหม่ต่างประเทศที่เพิ่งสอบผ่าน"
                        >
                          <span>🌍 นิสิตใหม่ต่างประเทศ / สร้างรหัสชั่วคราว (Auto TEMP ID)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleGenerateTempStudentId("69", true)}
                          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border text-[10px] font-semibold transition cursor-pointer"
                          title="สร้างรหัสชั่วคราวรุ่นปี 2569 (เช่น TEMP-69001)"
                        >
                          <span>TEMP-69xxx</span>
                        </button>
                      </div>
                    </div>

                    {formData.studentCode.toUpperCase().startsWith("TEMP-") && (
                      <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-2xs text-amber-800 dark:text-amber-300">
                        <span>
                          ✨ <strong>โหมดลงทะเบียนนิสิตใหม่รหัสชั่วคราว ({formData.studentCode}):</strong>{" "}
                          สามารถบันทึกเข้าระบบและออกหนังสือรับรองผู้ผ่านการคัดเลือก (Non-ED Visa) ได้ทันที เมื่อได้รับรหัส 10 หลักจริงแล้วสามารถกลับมาแก้ไขรหัสนิสิตได้ภายหลัง
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-2xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          คำนำหน้า
                        </label>
                        <select
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
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

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-2xs font-semibold text-muted-foreground uppercase tracking-wider">
                            รหัสนิสิต <span className="text-destructive">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => handleGenerateTempStudentId("68", false)}
                            className="text-[10px] font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                            title="คลิกเพื่อสุ่ม/รันรหัสชั่วคราว TEMP-68xxx"
                          >
                            + Auto TEMP-68xxx
                          </button>
                        </div>
                        <input
                          type="text"
                          required
                          value={formData.studentCode}
                          onChange={(e) => {
                            const newCode = e.target.value.trim();
                            setFormData((prev) => {
                              const oldDefaultEmail = prev.studentCode ? `${prev.studentCode}@mcu.ac.th` : "";
                              const oldLowerDefaultEmail = prev.studentCode
                                ? `${prev.studentCode.toLowerCase()}@mcu.ac.th`
                                : "";
                              const shouldAutoUpdate =
                                !prev.email ||
                                prev.email === oldDefaultEmail ||
                                prev.email === oldLowerDefaultEmail ||
                                prev.email === "student@mcu.ac.th";
                              return {
                                ...prev,
                                studentCode: newCode,
                                email:
                                  shouldAutoUpdate && newCode
                                    ? `${newCode.toLowerCase()}@mcu.ac.th`
                                    : prev.email,
                              };
                            });
                          }}
                          placeholder="เช่น 6601201001 หรือ TEMP-68001"
                          className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-2xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          สถานภาพการศึกษา
                        </label>
                        <select
                          value={formData.studyStatus}
                          onChange={(e) => setFormData({ ...formData, studyStatus: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                        >
                          {STUDENT_STUDY_STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-2xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          ชื่อนิสิต <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          placeholder="ระบุชื่อจริง เช่น กิติศักดิ์"
                          className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>

                      <div>
                        <label className="block text-2xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          นามสกุล / ฉายา <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          placeholder="ระบุนามสกุลหรือฉายา เช่น กิตฺติสกฺโก"
                          className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ── SECTION 2: ข้อมูลการศึกษาและหลักสูตร ── */}
                  <div className="bg-muted/30 dark:bg-muted/10 border border-border/70 rounded-2xl p-4 space-y-3.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <div className="w-5 h-5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <GraduationCap className="w-3.5 h-3.5" />
                      </div>
                      <span>ข้อมูลการศึกษาและหลักสูตร</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-2xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          ระดับการศึกษา
                        </label>
                        <select
                          value={formData.degree}
                          onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                        >
                          <option value="ปริญญาตรี">ปริญญาตรี</option>
                          <option value="ปริญญาโท">ปริญญาโท</option>
                          <option value="ปริญญาเอก">ปริญญาเอก</option>
                          <option value="ประกาศนียบัตร">ประกาศนียบัตร</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-2xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          ชั้นปี
                        </label>
                        <select
                          value={formData.yearLevel}
                          onChange={(e) =>
                            setFormData({ ...formData, yearLevel: Number(e.target.value) })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                        >
                          <option value={1}>ชั้นปีที่ 1</option>
                          <option value={2}>ชั้นปีที่ 2</option>
                          <option value={3}>ชั้นปีที่ 3</option>
                          <option value={4}>ชั้นปีที่ 4</option>
                        </select>
                      </div>
                    </div>

                    {/* Quick Preset Buttons for Major */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-2xs font-semibold text-muted-foreground uppercase tracking-wider">
                          เลือกสาขาวิชามาตรฐาน (คลิกเพื่อเติมข้อมูลอัตโนมัติ)
                        </label>
                        <span className="text-[11px] text-muted-foreground">6 สาขาวิชา</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {[
                          {
                            label: "พระพุทธศาสนา",
                            major: "พระพุทธศาสนา",
                            department: "ภาควิชาพระพุทธศาสนา",
                            curriculum: "พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา",
                            tag: "ภาคไทย",
                          },
                          {
                            label: "ศาสนาและปรัชญา",
                            major: "ศาสนาและปรัชญา",
                            department: "ภาควิชาศาสนาและปรัชญา",
                            curriculum: "พุทธศาสตรบัณฑิต สาขาวิชาศาสนาและปรัชญา",
                            tag: "ภาคไทย",
                          },
                          {
                            label: "วิปัสสนาภาวนา",
                            major: "วิปัสสนาภาวนา",
                            department: "ภาควิชาพระพุทธศาสนา",
                            curriculum: "พุทธศาสตรบัณฑิต สาขาวิชาวิปัสสนาภาวนา",
                            tag: "ภาคไทย",
                          },
                          {
                            label: "บาลีสันสกฤต",
                            major: "บาลีสันสกฤต",
                            department: "ภาควิชาพระพุทธศาสนา",
                            curriculum: "พุทธศาสตรบัณฑิต สาขาวิชาบาลีสันสกฤต",
                            tag: "ภาคไทย",
                          },
                          {
                            label: "Buddhist Studies",
                            major: "Buddhist Studies",
                            department: "ภาควิชาพระพุทธศาสนา",
                            curriculum: "พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา (หลักสูตรภาษาอังกฤษ)",
                            tag: "Inter",
                          },
                          {
                            label: "Religion & Philosophy",
                            major: "Religion and Philosophy",
                            department: "ภาควิชาศาสนาและปรัชญา",
                            curriculum: "พุทธศาสตรบัณฑิต สาขาวิชาศาสนาและปรัชญา (หลักสูตรภาษาอังกฤษ)",
                            tag: "Inter",
                          },
                        ].map((item) => {
                          const isSelected =
                            formData.major === item.major ||
                            formData.department === item.major;
                          return (
                            <button
                              key={item.major}
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  major: item.major,
                                  department: item.department,
                                  curriculumName: item.curriculum,
                                  faculty: "คณะพุทธศาสตร์",
                                }))
                              }
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border text-left flex items-center justify-between transition cursor-pointer ${
                                isSelected
                                  ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
                                  : "bg-background border-border hover:bg-muted text-foreground"
                              }`}
                            >
                              <span className="truncate">{item.label}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                                  isSelected
                                    ? "bg-white/20 text-white"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {item.tag}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-2xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          สาขาวิชา (Major)
                        </label>
                        <input
                          type="text"
                          value={formData.major}
                          onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                          placeholder="เช่น พระพุทธศาสนา หรือ Buddhist Studies"
                          className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>

                      <div>
                        <label className="block text-2xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          ภาควิชา / คณะ (Department / Faculty)
                        </label>
                        <input
                          type="text"
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          placeholder="เช่น ภาควิชาพระพุทธศาสนา"
                          className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-2xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        ชื่อหลักสูตรเต็ม (Curriculum Name)
                      </label>
                      <input
                        type="text"
                        value={formData.curriculumName}
                        onChange={(e) => setFormData({ ...formData, curriculumName: e.target.value })}
                        placeholder="เช่น พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา หรือระบุ (หลักสูตรภาษาอังกฤษ)"
                        className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <p className="text-[11px] text-muted-foreground mt-1">
                        💡 หากเป็น <strong>ภาคภาษาอังกฤษ</strong> ให้มีคำว่า &ldquo;(หลักสูตรภาษาอังกฤษ)&rdquo; หรือ &ldquo;English&rdquo; ในชื่อหลักสูตร
                      </p>
                    </div>
                  </div>

                  {/* ── SECTION 3: ช่องทางการติดต่อ ── */}
                  <div className="bg-muted/30 dark:bg-muted/10 border border-border/70 rounded-2xl p-4 space-y-3.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <div className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <Mail className="w-3.5 h-3.5" />
                      </div>
                      <span>ช่องทางการติดต่อและบัญชีนิสิต</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-2xs font-semibold text-muted-foreground uppercase tracking-wider">
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
                              className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
                              title="คลิกเพื่อใช้อีเมลรหัสนิสิต@mcu.ac.th"
                            >
                              ใช้ {formData.studentCode}@mcu.ac.th
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder={
                              formData.studentCode
                                ? `${formData.studentCode}@mcu.ac.th`
                                : "รหัสนิสิต@mcu.ac.th"
                            }
                            className="w-full pl-9 pr-3 py-2 rounded-xl bg-background border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-2xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          เบอร์โทรศัพท์ติดต่อ
                        </label>
                        <div className="relative">
                          <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <input
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            placeholder="เว้นว่างได้ เช่น 0812345678"
                            className="w-full pl-9 pr-3 py-2 rounded-xl bg-background border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── SECTION 4: ข้อมูลสัญชาติและที่อยู่ (ตาม PDPA) ── */}
                  <div className="bg-muted/30 dark:bg-muted/10 border border-border/70 rounded-2xl p-4 space-y-3.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <div className="w-5 h-5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      <span>ข้อมูลสัญชาติ ประเทศ และที่อยู่ (ซิงค์จากคำร้องขอหนังสือรับรอง)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-2xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          เพศ (Gender)
                        </label>
                        <select
                          value={formData.gender}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="">-- ไม่ระบุ --</option>
                          <option value="MALE">ชาย (Male)</option>
                          <option value="FEMALE">หญิง (Female)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-2xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          สัญชาติ (Nationality)
                        </label>
                        <input
                          type="text"
                          value={formData.nationality}
                          onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                          placeholder="เช่น พม่า, เวียดนาม, ไทย"
                          className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                        </input>
                      </div>

                      <div>
                        <label className="block text-2xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          ประเทศ (Country of Origin)
                        </label>
                        <input
                          type="text"
                          value={formData.country}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                          placeholder="เช่น Myanmar, Vietnam, Thailand"
                          className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                        </input>
                      </div>
                    </div>

                    <div>
                      <label className="block text-2xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        ที่อยู่ในประเทศไทย (Address in Thailand)
                      </label>
                      <textarea
                        rows={2}
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="ระบุที่พักหรือวัดที่จำพรรษาในประเทศไทย..."
                        className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                      />
                    </div>
                  </div>
                </LiyonDialogBody>

                {/* Modal Footer */}
                <LiyonDialogFooter className="p-4 border-t border-border flex items-center justify-between gap-2 bg-muted/20 shrink-0">
                  <div className="text-2xs text-muted-foreground hidden sm:block">
                    <span className="text-destructive font-bold">*</span> จำเป็นต้องระบุรหัสนิสิต ชื่อ และนามสกุล/ฉายา
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
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
                      className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 disabled:opacity-50 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {isSubmitting ? "กำลังบันทึก..." : editingStudent ? "บันทึกการแก้ไข" : "บันทึกนิสิตใหม่"}
                    </button>
                  </div>
                </LiyonDialogFooter>
              </form>
            </div>
          </div>
        </LiyonDialog>
      )}

      {/* ── VIEW ENROLLED COURSES / STUDENT PROFILE MODAL ── */}
      {viewingCoursesStudent && (
        <LiyonDialog
          open={Boolean(viewingCoursesStudent)}
          onOpenChange={() => setViewingCoursesStudent(null)}
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5">
            <div className="bg-card w-full max-w-3xl rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-border flex items-start justify-between shrink-0 bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md font-mono text-xs font-bold bg-primary text-primary-foreground shadow-2xs">
                        {viewingCoursesStudent.studentCode}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-primary/10 text-primary">
                        {viewingCoursesStudent.degree || "ปริญญาตรี"} ชั้นปี {viewingCoursesStudent.yearLevel}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-2xs font-semibold ${
                          viewingCoursesStudent.studyStatus === "ปกติ" || !viewingCoursesStudent.studyStatus
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                        }`}
                      >
                        สถานะ: {viewingCoursesStudent.studyStatus || "ปกติ"}
                      </span>
                    </div>
                    <h3 className="font-bold text-foreground text-base sm:text-lg mt-1">
                      {viewingCoursesStudent.title ? `${viewingCoursesStudent.title} ` : ""}
                      {viewingCoursesStudent.firstName} {viewingCoursesStudent.lastName}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {viewingCoursesStudent.curriculumName || "คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setViewingCoursesStudent(null)}
                  className="w-8 h-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <LiyonDialogBody className="p-4 sm:p-5 space-y-5 overflow-y-auto flex-1">
                {/* ── SECTION 1: ข้อมูลประวัตินิสิตและสังกัด ── */}
                <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-primary" />
                      ข้อมูลประวัตินิสิตและสังกัด (Student Information)
                    </span>
                    <span className="text-2xs text-muted-foreground">
                      {getStudentProgramType(viewingCoursesStudent) === "ENGLISH"
                        ? "🇬🇧 ภาคภาษาอังกฤษ (International Program)"
                        : getStudentProgramType(viewingCoursesStudent) === "GRADUATE"
                        ? "🎓 บัณฑิตศึกษา (Graduate Studies)"
                        : "🇹🇭 ภาคภาษาไทย (Thai Program)"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-2xs text-muted-foreground font-semibold block">สาขาวิชา/ภาควิชา</span>
                      <span className="font-medium text-foreground">{getStudentMajorDisplay(viewingCoursesStudent)}</span>
                    </div>
                    <div>
                      <span className="text-2xs text-muted-foreground font-semibold block">คณะวิชา</span>
                      <span className="font-medium text-foreground">{viewingCoursesStudent.faculty || "คณะพุทธศาสตร์"}</span>
                    </div>
                    <div>
                      <span className="text-2xs text-muted-foreground font-semibold block">เพศ (Gender)</span>
                      <span className="font-medium text-foreground">
                        {viewingCoursesStudent.gender === "MALE" || viewingCoursesStudent.gender === "ชาย"
                          ? "ชาย (Male)"
                          : viewingCoursesStudent.gender === "FEMALE" || viewingCoursesStudent.gender === "หญิง"
                          ? "หญิง (Female)"
                          : viewingCoursesStudent.gender || "ไม่ระบุ"}
                      </span>
                    </div>
                    <div>
                      <span className="text-2xs text-muted-foreground font-semibold block">สัญชาติ / ประเทศ</span>
                      <span className="font-medium text-foreground">
                        {viewingCoursesStudent.country ? `🌍 ${viewingCoursesStudent.country}` : "-"}{" "}
                        {viewingCoursesStudent.nationality && `(${viewingCoursesStudent.nationality})`}
                      </span>
                    </div>
                    <div>
                      <span className="text-2xs text-muted-foreground font-semibold block">อีเมลมหาวิทยาลัย</span>
                      <span className="font-medium text-foreground font-mono truncate block" title={viewingCoursesStudent.email || ""}>
                        {viewingCoursesStudent.email || (viewingCoursesStudent.studentCode ? `${viewingCoursesStudent.studentCode}@mcu.ac.th` : "-")}
                      </span>
                    </div>
                    <div>
                      <span className="text-2xs text-muted-foreground font-semibold block">เบอร์โทรศัพท์</span>
                      <span className="font-medium text-foreground">{viewingCoursesStudent.phoneNumber || "-"}</span>
                    </div>
                  </div>

                  {viewingCoursesStudent.address && (
                    <div className="text-xs pt-1 border-t border-border/40">
                      <span className="text-2xs text-muted-foreground font-semibold block">ที่อยู่หรือวัดที่จำพรรษาในประเทศไทย:</span>
                      <span className="text-foreground">{viewingCoursesStudent.address}</span>
                    </div>
                  )}
                </div>

                {/* ── SECTION 2: สถิติภาพรวม (KPI CARDS) ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Attendance Card */}
                  <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-2xs font-semibold text-emerald-900 dark:text-emerald-300 flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5 text-emerald-600" />
                        % เวลาเรียนรวมทุกวิชา
                      </span>
                      <span className="text-base font-bold font-mono text-emerald-700 dark:text-emerald-300">
                        {viewingCoursesStudent.attendanceStats?.percentage ?? 100}%
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {viewingCoursesStudent.attendanceStats && viewingCoursesStudent.attendanceStats.totalSessions > 0
                        ? `เข้าเรียน ${viewingCoursesStudent.attendanceStats.attendedSessions} จาก ${viewingCoursesStudent.attendanceStats.totalSessions} คาบที่เช็กชื่อ`
                        : "เวลาเรียนเต็ม 100%"}
                    </p>
                    <div className="w-full bg-emerald-200/50 dark:bg-emerald-950 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, viewingCoursesStudent.attendanceStats?.percentage ?? 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Activity Card */}
                  <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-2xs font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-blue-600" />
                        % เข้าร่วมกิจกรรม
                      </span>
                      <span className="text-base font-bold font-mono text-blue-700 dark:text-blue-300">
                        {viewingCoursesStudent.activityStats?.percentage ?? 100}%
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {viewingCoursesStudent.activityStats && viewingCoursesStudent.activityStats.total > 0
                        ? `เข้าร่วม ${viewingCoursesStudent.activityStats.attended} / ${viewingCoursesStudent.activityStats.total} กิจกรรม`
                        : "ยังไม่มีกิจกรรม"}
                    </p>
                    <div className="w-full bg-blue-200/50 dark:bg-blue-950 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, viewingCoursesStudent.activityStats?.percentage ?? 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Enrolled Courses Count Card */}
                  <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-2xs font-semibold text-primary flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        วิชาที่ลงทะเบียน
                      </span>
                      <span className="text-base font-bold font-mono text-primary">
                        {viewingCoursesStudent.enrollments.length} วิชา
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {studentTermBreakdown.length > 0
                        ? `กระจายอยู่ใน ${studentTermBreakdown.length} ภาคการศึกษา`
                        : "ยังไม่มีรายวิชา"}
                    </p>
                    <div className="w-full bg-primary/20 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-primary h-full rounded-full w-full" />
                    </div>
                  </div>
                </div>

                {/* ── SECTION 3: สรุป % การเข้าเรียนรายภาคการศึกษา (TERM BREAKDOWN) ── */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-primary" />
                      สรุปเวลาเรียนแยกรายภาคการศึกษา (Attendance Rate per Term)
                    </span>
                    <span className="text-2xs text-muted-foreground">
                      เกณฑ์มีสิทธิ์สอบ &ge; 80% ของเวลาเรียนทั้งหมด
                    </span>
                  </div>

                  {studentTermBreakdown.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
                      ยังไม่มีประวัติการลงทะเบียนรายภาคการศึกษา
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {studentTermBreakdown.map((term) => {
                        const isEligible = term.percentage >= 80;
                        return (
                          <div
                            key={term.termKey}
                            className={`p-3.5 rounded-xl border transition-all ${
                              isEligible
                                ? "border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40"
                                : "border-rose-500/20 bg-rose-500/5 hover:border-rose-500/40"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-primary" />
                                {term.termKey}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-2xs font-bold ${
                                  isEligible
                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                                    : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20"
                                }`}
                              >
                                {isEligible ? "✓ มีสิทธิ์สอบ" : "⚠️ เสี่ยงหมดสิทธิ์"} ({term.percentage}%)
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-2xs text-muted-foreground mt-2">
                              <span>ลงทะเบียน {term.courses.length} วิชา</span>
                              <span>
                                เข้าเรียน {term.totalAttended} / {term.totalConducted} คาบ
                              </span>
                            </div>

                            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden mt-1.5">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isEligible ? "bg-emerald-500" : "bg-rose-500"
                                }`}
                                style={{ width: `${Math.min(100, term.percentage)}%` }}
                              />
                            </div>

                            <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-border/60">
                              <button
                                type="button"
                                onClick={() =>
                                  viewingCoursesStudent &&
                                  handleOpenStudentSemesterAttendance(viewingCoursesStudent, term)
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-2xs cursor-pointer transition shadow-2xs"
                                title={`พิมพ์ใบรายงานสรุปเวลาเรียน A4 ประจำ${term.termKey}`}
                              >
                                <Printer className="w-3 h-3" />
                                <span>พิมพ์สรุป A4</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  viewingCoursesStudent &&
                                  handleOpenStudentSemesterAttendance(viewingCoursesStudent, term)
                                }
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-2xs font-semibold cursor-pointer transition"
                                title="ดูรายงานและส่งออก Excel"
                              >
                                <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                                <span>Excel (CSV)</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── SECTION 4: รายละเอียดรายวิชาที่ลงทะเบียนเรียน ── */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-foreground">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-primary" />
                      รายวิชาที่ลงทะเบียนและสถิติเวลาเรียนรายวิชา ({viewingCoursesStudent.enrollments.length} วิชา)
                    </span>
                  </div>

                  {viewingCoursesStudent.enrollments.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                      ยังไม่มีข้อมูลการลงทะเบียนเรียนในระบบ
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {viewingCoursesStudent.enrollments.map((en) => {
                        const stats = en.stats;
                        const hasRecords = stats && stats.totalConducted > 0;
                        const attended = stats ? stats.present + stats.late + stats.excused : 0;
                        const percent = hasRecords ? stats.percentage : 100;
                        const isEligible = percent >= 80;

                        return (
                          <div
                            key={en.course.id}
                            className="p-3.5 rounded-xl border border-border/80 bg-card hover:border-primary/40 transition-colors space-y-2 text-xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-primary">
                                    {en.course.courseCode}
                                  </span>
                                  <span className="text-2xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                                    ภาค {en.course.semester}/{en.course.academicYear}
                                  </span>
                                  {en.course.credits && (
                                    <span className="text-2xs text-muted-foreground">
                                      ({en.course.credits} หน่วยกิต)
                                    </span>
                                  )}
                                </div>
                                <div className="font-semibold text-foreground mt-0.5">
                                  {en.course.courseName}
                                </div>
                                {en.course.courseNameEn && (
                                  <div className="text-2xs text-muted-foreground">
                                    {en.course.courseNameEn}
                                  </div>
                                )}
                              </div>

                              {/* Attendance Pill */}
                              <div className="text-right shrink-0">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-bold ${
                                    isEligible
                                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                                      : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20"
                                  }`}
                                >
                                  {isEligible ? "✓ มีสิทธิ์สอบ" : "⚠️ เสี่ยงหมดสิทธิ์"} ({percent}%)
                                </span>
                              </div>
                            </div>

                            {/* Sessions breakdown */}
                            <div className="flex items-center justify-between text-2xs text-muted-foreground border-t border-border/50 pt-2">
                              <span>
                                {hasRecords
                                  ? `เข้าเรียน: ${attended} / ${stats.totalConducted} คาบ (ขาด ${stats.absent}, ลา ${stats.excused}, สาย ${stats.late})`
                                  : "ยังไม่มีการบันทึกการเช็กชื่อในรายวิชานี้"}
                              </span>
                              <span className="font-mono font-medium">
                                เป้าหมาย {en.course.targetSessions || 16} คาบ
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── SECTION 5: กิจกรรมและโครงการที่ลงทะเบียน ── */}
                {viewingCoursesStudent.eventRegistrations && viewingCoursesStudent.eventRegistrations.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-blue-600" />
                        กิจกรรมและโครงการที่ลงทะเบียน ({viewingCoursesStudent.eventRegistrations.length} รายการ)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenStudentTranscript(viewingCoursesStudent.studentCode)}
                        className="inline-flex items-center gap-1 text-2xs font-bold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
                      >
                        <Printer className="w-3 h-3" />
                        <span>พิมพ์ระเบียนกิจกรรม (A4)</span>
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {viewingCoursesStudent.eventRegistrations.map((reg, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-muted/20 text-xs"
                        >
                          <div>
                            <span className="font-medium text-foreground">{reg.event.title}</span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-2xs font-semibold ${
                              reg.status === "ATTENDED"
                                ? "bg-emerald-500/10 text-emerald-700"
                                : "bg-amber-500/10 text-amber-700"
                            }`}
                          >
                            {reg.status === "ATTENDED" ? "✓ เข้าร่วมแล้ว" : "ลงทะเบียนแล้ว"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </LiyonDialogBody>

              <LiyonDialogFooter className="p-4 border-t border-border flex flex-wrap items-center justify-between gap-2 bg-muted/20">
                <div className="flex flex-wrap items-center gap-2">
                  {studentTermBreakdown.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (viewingCoursesStudent) {
                          handleOpenStudentSemesterAttendance(
                            viewingCoursesStudent,
                            studentTermBreakdown[0]
                          );
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-xs font-bold text-indigo-800 cursor-pointer transition shadow-2xs"
                      title={`พิมพ์ใบรายงานสรุปเวลาเรียน A4 ประจำ${studentTermBreakdown[0].termKey}`}
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>พิมพ์สรุปเวลาเรียน ({studentTermBreakdown[0].termKey})</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const code = viewingCoursesStudent.studentCode;
                      handleOpenStudentTranscript(code);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-xs font-bold text-amber-800 cursor-pointer transition shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>พิมพ์ Activity Transcript</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const target = viewingCoursesStudent;
                      setViewingCoursesStudent(null);
                      handleOpenEdit(target);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-primary cursor-pointer transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    แก้ไขข้อมูลนิสิต
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setViewingCoursesStudent(null)}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition cursor-pointer"
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

      {/* ── ACTIVITY TRANSCRIPT MODAL ── */}
      {transcriptData && (
        <StudentActivityTranscriptDocument
          data={transcriptData}
          onClose={() => setTranscriptData(null)}
        />
      )}

      {/* ── SEMESTER ATTENDANCE TRANSCRIPT MODAL ── */}
      {semesterAttendanceDoc && (
        <StudentSemesterAttendanceDocument
          data={semesterAttendanceDoc}
          onClose={() => setSemesterAttendanceDoc(null)}
        />
      )}
    </div>
  );
}
