"use client";

import { useState, useMemo } from "react";
import {
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  Search,
  Plus,
  Users,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
  ExternalLink,
  GraduationCap,
  Archive,
  RotateCcw,
  Pencil,
  Trash2,
  AlertTriangle,
  DownloadCloud,
  Copy,
  Printer,
  ShieldCheck,
  Check,
  Award,
  Scissors,
  FileDown,
  Building2,
} from "lucide-react";
import { printHandoverDocument, type HandoverViewMode } from "./print-handover";
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
import {
  createClassAction,
  updateClassAction,
  deleteClassAction,
  archiveCourseAction,
  restoreCourseAction,
  getAvailableTimetablesForSyncAction,
  syncCoursesFromTimetableAction,
} from "@/features/attendance/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";


interface ClassItem {
  id: string;
  courseCode: string;
  courseName: string;
  courseNameEn?: string | null;
  credits: number;
  term: string;
  academicYear: string;
  semester: number;
  room?: string | null;
  dayOfWeek?: number | null;
  startTime?: string | null;
  endTime?: string | null;
  section?: string | null;
  targetSessions?: number;
  description?: string | null;
  status: string;
  primaryTeacher?: { id: string; name: string; email: string } | null;
  instructor?: { name: string; email: string } | null;
  teachers?: Array<{ userId?: string; role?: string; user: { name: string; email: string }; isPrimary: boolean }>;
  _count?: {
    enrollments: number;
    sessions: number;
  };
}

interface ClassesClientProps {
  initialItems: ClassItem[];
  availableTeachers?: Array<{ id: string; name: string; email: string }>;
  isSuperAdmin?: boolean;
  currentUserId?: string;
}

const DAY_NAMES = ["", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์", "วันอาทิตย์"];

export function ClassesClient({
  initialItems,
  availableTeachers = [],
  isSuperAdmin,
  currentUserId,
}: ClassesClientProps) {
  const router = useRouter();
  const [items, setItems] = useState<ClassItem[]>(initialItems);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState<"ACTIVE" | "ARCHIVED" | "ALL">("ACTIVE");
  const [archiveTarget, setArchiveTarget] = useState<ClassItem | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<ClassItem | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit & Delete States
  const [editTarget, setEditTarget] = useState<ClassItem | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ClassItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [editFormData, setEditFormData] = useState({
    courseCode: "",
    courseName: "",
    courseNameEn: "",
    credits: 3,
    term: "2/2569",
    academicYear: "2569",
    semester: 2,
    department: "สาขาวิชาพระพุทธศาสนา",
    curriculumLanguage: "ปริญญาตรี (ภาคภาษาไทย)",
    primaryTeacherId: "",
    room: "",
    dayOfWeek: 1,
    startTime: "09.00",
    endTime: "11.30",
    description: "",
  });

  // Form State สำหรับสร้างวิชาใหม่
  const [formData, setFormData] = useState({
    courseCode: "",
    courseName: "",
    courseNameEn: "",
    credits: 3,
    term: "2/2569",
    academicYear: "2569",
    semester: 2,
    targetSessions: 16,
    department: "สาขาวิชาพระพุทธศาสนา",
    curriculumLanguage: "ปริญญาตรี (ภาคภาษาไทย)",
    primaryTeacherId: "",
    room: "",
    dayOfWeek: 1,
    startTime: "09.00",
    endTime: "11.30",
    description: "",
  });

  // รายชื่ออาจารย์สำหรับเลือกเป็นผู้รับผิดชอบรายวิชา
  const teacherOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; email: string }>();
    if (availableTeachers && availableTeachers.length > 0) {
      availableTeachers.forEach((t) => map.set(t.id, t));
    }
    items.forEach((item) => {
      const teacher = item.primaryTeacher;
      if (teacher?.id && !map.has(teacher.id)) {
        map.set(teacher.id, { id: teacher.id, name: teacher.name, email: teacher.email });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "th"));
  }, [availableTeachers, items]);

  const uniqueTerms = Array.from(new Set(items.map((i) => i.term).filter(Boolean)));

  const filteredItems = items.filter((item) => {
    const q = searchTerm.toLowerCase();
    const teacherName =
      item.primaryTeacher?.name ||
      item.instructor?.name ||
      item.teachers?.find((t) => t.isPrimary)?.user?.name ||
      item.teachers?.[0]?.user?.name ||
      "";

    const matchSearch =
      item.courseCode.toLowerCase().includes(q) ||
      item.courseName.toLowerCase().includes(q) ||
      (item.courseNameEn && item.courseNameEn.toLowerCase().includes(q)) ||
      item.term.toLowerCase().includes(q) ||
      (teacherName && teacherName.toLowerCase().includes(q));

    const matchTerm = selectedTerm === "ALL" || item.term === selectedTerm;
    const matchStatus =
      selectedStatus === "ALL" ||
      (selectedStatus === "ACTIVE" ? item.status !== "ARCHIVED" : item.status === "ARCHIVED");

    return matchSearch && matchTerm && matchStatus;
  });

  async function handleCreateClass(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.courseCode.trim() || !formData.courseName.trim()) {
      toast.error("กรุณาระบุรหัสวิชาและชื่อวิชา");
      return;
    }

    try {
      setIsSubmitting(true);
      const termParts = (formData.term || "").split("/");
      const sem = parseInt(termParts[0], 10) || 2;
      const yr = termParts[1]?.trim() || "2569";
      const deptLangMeta = `สาขาวิชา: ${formData.department} | หลักสูตร: ${formData.curriculumLanguage}`;

      const payload = {
        courseCode: formData.courseCode.trim(),
        courseName: formData.courseName.trim(),
        courseNameEn: formData.courseNameEn?.trim() || null,
        credits: formData.credits,
        term: formData.term.trim(),
        academicYear: yr,
        semester: sem,
        targetSessions: 16,
        room: formData.room?.trim() || null,
        dayOfWeek: formData.dayOfWeek,
        startTime: formData.startTime?.trim() || "09.00",
        endTime: formData.endTime?.trim() || "11.30",
        primaryTeacherId: formData.primaryTeacherId ? formData.primaryTeacherId : currentUserId,
        description: formData.description?.trim()
          ? `${deptLangMeta} • ${formData.description.trim()}`
          : deptLangMeta,
      };

      const res = await createClassAction(payload);
      if (res.success && res.class) {
        toast.success("สร้างรายวิชาและกำหนด 16 คาบเรียนเรียบร้อยแล้ว");
        setItems([res.class as unknown as ClassItem, ...items]);
        setIsCreateOpen(false);
        router.refresh();
      }
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || "เกิดข้อผิดพลาดในการสร้างรายวิชา");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleArchiveCourse() {
    if (!archiveTarget) return;
    try {
      setIsProcessingAction(true);
      const res = await archiveCourseAction(archiveTarget.id);
      if (res.success) {
        toast.success(`ปิดภาคการศึกษาของวิชา ${archiveTarget.courseCode} เรียบร้อยแล้ว`);
        setItems((prev) =>
          prev.map((i) => (i.id === archiveTarget.id ? { ...i, status: "ARCHIVED" } : i))
        );
        setArchiveTarget(null);
        router.refresh();
      }
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || "เกิดข้อผิดพลาดในการปิดภาคการศึกษา");
    } finally {
      setIsProcessingAction(false);
    }
  }

  async function handleRestoreCourse() {
    if (!restoreTarget) return;
    try {
      setIsProcessingAction(true);
      const res = await restoreCourseAction(restoreTarget.id);
      if (res.success) {
        toast.success(`เปิดใช้งานวิชา ${restoreTarget.courseCode} อีกครั้งเรียบร้อยแล้ว`);
        setItems((prev) =>
          prev.map((i) => (i.id === restoreTarget.id ? { ...i, status: "ACTIVE" } : i))
        );
        setRestoreTarget(null);
        router.refresh();
      }
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || "เกิดข้อผิดพลาดในการเปิดใช้งาน");
    } finally {
      setIsProcessingAction(false);
    }
  }

  function handleOpenEdit(item: ClassItem) {
    setEditTarget(item);

    const desc = item.description || "";
    let dept = "สาขาวิชาพระพุทธศาสนา";
    let curr = "ปริญญาตรี (ภาคภาษาไทย)";
    let customDesc = desc;

    if (desc.includes("สาขาวิชา:") || desc.includes("หลักสูตร:")) {
      const parts = desc.split("•");
      const meta = parts[0] || "";
      customDesc = parts.slice(1).join("•").trim();

      if (meta.includes("สาขาวิชาศาสนาและปรัชญา")) dept = "สาขาวิชาศาสนาและปรัชญา";
      else if (meta.includes("สาขาวิชาบาลีสันสกฤต")) dept = "สาขาวิชาบาลีสันสกฤต";
      else if (meta.includes("สาขาวิชาวิปัสสนาภาวนา")) dept = "สาขาวิชาวิปัสสนาภาวนา";
      else if (meta.includes("หมวดวิชาศึกษาทั่วไป")) dept = "หมวดวิชาศึกษาทั่วไป";
      else if (meta.includes("สาขาวิชาพระพุทธศาสนา")) dept = "สาขาวิชาพระพุทธศาสนา";

      if (meta.includes("English Program") || meta.includes("ภาคภาษาอังกฤษ")) curr = "ปริญญาตรี (ภาคภาษาอังกฤษ / English Program)";
      else if (meta.includes("ปริญญาโท")) curr = "ปริญญาโท";
      else if (meta.includes("ปริญญาเอก")) curr = "ปริญญาเอก";
      else if (meta.includes("ประกาศนียบัตร")) curr = "ประกาศนียบัตร";
      else curr = "ปริญญาตรี (ภาคภาษาไทย)";
    }

    setEditFormData({
      courseCode: item.courseCode,
      courseName: item.courseName,
      courseNameEn: item.courseNameEn || "",
      credits: item.credits || 3,
      term: item.term || "2/2569",
      academicYear: item.academicYear || "2569",
      semester: item.semester || 2,
      department: dept,
      curriculumLanguage: curr,
      primaryTeacherId: item.primaryTeacher?.id || "",
      room: item.room || "",
      dayOfWeek: item.dayOfWeek || 1,
      startTime: item.startTime || "09.00",
      endTime: item.endTime || "11.30",
      description: customDesc,
    });
    setIsEditOpen(true);
  }

  async function handleUpdateClass(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    if (!editFormData.courseCode.trim() || !editFormData.courseName.trim()) {
      toast.error("กรุณาระบุรหัสวิชาและชื่อวิชา");
      return;
    }

    try {
      setIsUpdating(true);
      const termParts = (editFormData.term || "").split("/");
      const sem = parseInt(termParts[0], 10) || editFormData.semester || 2;
      const yr = termParts[1]?.trim() || editFormData.academicYear || "2569";
      const deptLangMeta = `สาขาวิชา: ${editFormData.department} | หลักสูตร: ${editFormData.curriculumLanguage}`;

      const payload = {
        courseCode: editFormData.courseCode.trim(),
        courseName: editFormData.courseName.trim(),
        courseNameEn: editFormData.courseNameEn?.trim() || null,
        credits: editFormData.credits,
        term: editFormData.term.trim(),
        academicYear: yr,
        semester: sem,
        room: editFormData.room?.trim() || null,
        dayOfWeek: editFormData.dayOfWeek,
        startTime: editFormData.startTime?.trim() || "09.00",
        endTime: editFormData.endTime?.trim() || "11.30",
        primaryTeacherId: editFormData.primaryTeacherId || undefined,
        description: editFormData.description?.trim()
          ? `${deptLangMeta} • ${editFormData.description.trim()}`
          : deptLangMeta,
      };

      const res = await updateClassAction(editTarget.id, payload);
      if (res.success && res.class) {
        toast.success(`แก้ไขข้อมูลวิชา ${payload.courseCode} เรียบร้อยแล้ว`);
        setItems((prev) =>
          prev.map((i) => (i.id === editTarget.id ? { ...i, ...res.class } : i))
        );
        setIsEditOpen(false);
        setEditTarget(null);
        router.refresh();
      }
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || "เกิดข้อผิดพลาดในการแก้ไขรายวิชา");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const res = await deleteClassAction(deleteTarget.id);
      if (res.success) {
        toast.success(`ลบรายวิชา ${deleteTarget.courseCode} ${deleteTarget.courseName} เรียบร้อยแล้ว`);
        setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
        setDeleteTarget(null);
        router.refresh();
      }
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || "เกิดข้อผิดพลาดในการลบรายวิชา");
    } finally {
      setIsDeleting(false);
    }
  }

  interface SyncTimetableCourseItem {
    id?: string;
    courseCode: string;
    courseName: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    room?: string | null;
    instructor?: string | null;
  }

  interface SyncTimetableItem {
    id: string;
    titleTh: string;
    academicYear: string;
    semester: number;
    yearLevel: number;
    curriculumName?: string | null;
    departmentName?: string | null;
    room?: string | null;
    termDates?: string | null;
    courseCount?: number;
    courses: SyncTimetableCourseItem[];
  }

  interface TeacherCredentialItem {
    teacherName: string;
    email: string;
    initialPassword?: string;
    courses: string[];
    isNew?: boolean;
  }

  interface SyncExecutionResult {
    success?: boolean;
    importedCount?: number;
    skippedCount?: number;
    teacherCredentials: TeacherCredentialItem[];
  }

  // Timetable Sync & Teacher Auto-Provisioning States
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isLoadingTimetables, setIsLoadingTimetables] = useState(false);
  const [timetables, setTimetables] = useState<SyncTimetableItem[]>([]);
  const [selectedTimetableId, setSelectedTimetableId] = useState("");
  const [selectedCourseCodes, setSelectedCourseCodes] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Handover Dialog States
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncExecutionResult | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [handoverViewMode, setHandoverViewMode] = useState<HandoverViewMode>("slips4");
  const [handoverSearch, setHandoverSearch] = useState("");
  const [singlePrintEmail, setSinglePrintEmail] = useState<string | null>(null);
  const [handoverIssuerText, setHandoverIssuerText] = useState("ฝ่ายวิชาการ คณะพุทธศาสตร์ มจร.");

  const filteredTeacherCredentials = useMemo(() => {
    let list = syncResult?.teacherCredentials || [];
    if (singlePrintEmail) {
      return list.filter((t) => t.email === singlePrintEmail);
    }
    if (handoverSearch.trim()) {
      const q = handoverSearch.toLowerCase();
      list = list.filter(
        (t) =>
          t.teacherName?.toLowerCase().includes(q) ||
          t.email?.toLowerCase().includes(q) ||
          t.courses?.some((c: string) => c.toLowerCase().includes(q))
      );
    }
    return list;
  }, [syncResult, handoverSearch, singlePrintEmail]);

  async function handleOpenSyncModal() {
    setIsSyncModalOpen(true);
    setIsLoadingTimetables(true);
    try {
      const res = await getAvailableTimetablesForSyncAction();
      if (res.success && res.timetables) {
        const ttList = res.timetables as SyncTimetableItem[];
        setTimetables(ttList);
        if (ttList.length > 0) {
          const first = ttList[0];
          setSelectedTimetableId(first.id);
          setSelectedCourseCodes(first.courses.map((c) => c.courseCode));
        }
      }
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || "ไม่สามารถดึงข้อมูลตารางเรียนได้");
    } finally {
      setIsLoadingTimetables(false);
    }
  }

  function handleSelectTimetable(timetableId: string) {
    setSelectedTimetableId(timetableId);
    const found = timetables.find((t) => t.id === timetableId);
    if (found) {
      setSelectedCourseCodes(found.courses.map((c) => c.courseCode));
    } else {
      setSelectedCourseCodes([]);
    }
  }

  function handleToggleCourse(courseCode: string) {
    setSelectedCourseCodes((prev) =>
      prev.includes(courseCode)
        ? prev.filter((c) => c !== courseCode)
        : [...prev, courseCode]
    );
  }

  function handleToggleAllCourses(courses: SyncTimetableCourseItem[]) {
    if (selectedCourseCodes.length === courses.length) {
      setSelectedCourseCodes([]);
    } else {
      setSelectedCourseCodes(courses.map((c) => c.courseCode));
    }
  }

  async function handleExecuteSync() {
    if (!selectedTimetableId) {
      toast.error("กรุณาเลือกตารางเรียน");
      return;
    }
    if (selectedCourseCodes.length === 0) {
      toast.error("กรุณาเลือกรายวิชาอย่างน้อย 1 วิชา");
      return;
    }

    try {
      setIsSyncing(true);
      const res = await syncCoursesFromTimetableAction({
        timetableId: selectedTimetableId,
        selectedCourseCodes,
      });

      if (res.success) {
        toast.success(`นำเข้ารายวิชาสำเร็จ ${res.importedCount} วิชา!`);
        setSyncResult(res as SyncExecutionResult);
        setIsSyncModalOpen(false);
        setIsHandoverModalOpen(true);
        router.refresh();
      }
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || "เกิดข้อผิดพลาดในการนำเข้าตารางเรียน");
    } finally {
      setIsSyncing(false);
    }
  }

  function handleCopyAllCredentials() {
    if (!syncResult?.teacherCredentials) return;
    const textLines = [
      "==================================================",
      "ใบส่งมอบบัญชีอาจารย์ผู้สอน (Faculty of Buddhism)",
      `มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย คณะพุทธศาสตร์ (ภาคการศึกษาที่ 2/2569)`,
      `วันที่ส่งออก: ${new Date().toLocaleDateString("th-TH")}`,
      "==================================================",
      "",
    ];

    syncResult.teacherCredentials.forEach((t, idx: number) => {
      textLines.push(`${idx + 1}. อาจารย์: ${t.teacherName}`);
      textLines.push(`   อีเมลเข้าสู่ระบบ (Username): ${t.email}`);
      textLines.push(`   รหัสผ่านเริ่มต้น: ${t.initialPassword || "(มีบัญชีเดิมในระบบแล้ว)"}`);
      textLines.push(`   รายวิชาที่สอน: ${t.courses?.join(", ") || "-"}`);
      textLines.push(`   เว็บไซต์: http://localhost:3010/login`);
      textLines.push(`   สถานะ: ${t.isNew ? "สร้างบัญชีใหม่ (บังคับเปลี่ยนรหัสผ่าน)" : "บัญชีเดิม"}`);
      textLines.push("--------------------------------------------------");
    });

    navigator.clipboard.writeText(textLines.join("\n"));
    setCopiedAll(true);
    toast.success("คัดลอกข้อมูลบัญชีอาจารย์ทั้งหมดแล้ว");
    setTimeout(() => setCopiedAll(false), 3000);
  }

  function handleCopySingleCredential(t: TeacherCredentialItem) {
    const lines = [
      "==================================================",
      "ใบส่งมอบบัญชีผู้ใช้งานระบบสารสนเทศอาจารย์ผู้สอน",
      "มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย คณะพุทธศาสตร์ (ภาคการศึกษาที่ 2/2569)",
      "==================================================",
      `อาจารย์ผู้สอน: ${t.teacherName}`,
      `อีเมลเข้าสู่ระบบ (Username): ${t.email}`,
      `รหัสผ่านเริ่มต้น: ${t.initialPassword || "(มีบัญชีเดิมในระบบแล้ว)"}`,
      `เว็บไซต์เข้าใช้งาน: http://localhost:3010/login`,
      `รายวิชาที่รับผิดชอบสอน: ${t.courses?.join(", ") || "-"}`,
      `สถานะบัญชี: ${t.isNew ? "สร้างใหม่ (บังคับเปลี่ยนรหัสผ่าน)" : "บัญชีเดิม"}`,
      "--------------------------------------------------",
      "* คำแนะนำ: กรุณาเปลี่ยนรหัสผ่านทันทีหลังเข้าสู่ระบบครั้งแรก เพื่อความปลอดภัยของข้อมูลเกรดและเวลาเรียน",
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    toast.success(`คัดลอกข้อมูลบัญชีของ ${t.teacherName} เรียบร้อยแล้ว`);
  }

  function handleExportCredentialsCsv() {
    if (!syncResult?.teacherCredentials?.length) {
      toast.error("ไม่มีข้อมูลบัญชีอาจารย์สำหรับส่งออก");
      return;
    }
    const headers = [
      "ลำดับ",
      "ชื่ออาจารย์ผู้สอน",
      "อีเมลเข้าสู่ระบบ (Username)",
      "รหัสผ่านเริ่มต้น",
      "รายวิชาที่รับผิดชอบสอน",
      "สถานะบัญชี",
      "เว็บไซต์เข้าสู่ระบบ",
    ];
    const rows = syncResult.teacherCredentials.map((t, idx: number) => [
      idx + 1,
      `"${(t.teacherName || "").replace(/"/g, '""')}"`,
      `"${(t.email || "").replace(/"/g, '""')}"`,
      `"${(t.initialPassword || "มีบัญชีเดิม").replace(/"/g, '""')}"`,
      `"${(t.courses?.join("; ") || "").replace(/"/g, '""')}"`,
      `"${t.isNew ? "สร้างใหม่ (บังคับเปลี่ยนรหัส)" : "บัญชีเดิม"}"`,
      `"http://localhost:3010/login"`,
    ]);
    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `MCU_Teacher_Handover_Credentials_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("ดาวน์โหลดไฟล์ CSV เรียบร้อยแล้ว");
  }

  function handlePrintHandover(teacherEmail?: string) {
    printHandoverDocument({
      viewMode: handoverViewMode,
      credentials: filteredTeacherCredentials,
      issuerText: handoverIssuerText,
      semesterText: "ภาคการศึกษาที่ 2/2569 (Semester 2/2026)",
      loginUrl: "http://localhost:3010/login",
      singleEmail: teacherEmail || null,
    });
  }

  function handleOpenAllTeacherHandover() {
    const credsMap = new Map<
      string,
      {
        teacherName: string;
        email: string;
        initialPassword?: string;
        courses: string[];
        isNew: boolean;
      }
    >();

    for (const item of items) {
      const teacher =
        item.primaryTeacher ||
        item.instructor ||
        item.teachers?.find((t) => t.isPrimary)?.user ||
        item.teachers?.[0]?.user;

      if (teacher?.email) {
        const email = teacher.email;
        const existing = credsMap.get(email);
        const courseLabel = `${item.courseCode} ${item.courseName || ""}${item.section ? ` (กลุ่ม ${item.section})` : ""}`.trim();
        if (existing) {
          if (!existing.courses.includes(courseLabel)) {
            existing.courses.push(courseLabel);
          }
        } else {
          credsMap.set(email, {
            teacherName: teacher.name,
            email,
            initialPassword: "Teacher1234!",
            courses: [courseLabel],
            isNew: true,
          });
        }
      }
    }

    setSyncResult({
      importedCount: items.length,
      skippedCount: 0,
      teacherCredentials: Array.from(credsMap.values()).sort((a, b) =>
        a.teacherName.localeCompare(b.teacherName, "th")
      ),
    });
    setHandoverSearch("");
    setSinglePrintEmail(null);
    setIsHandoverModalOpen(true);
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* ส่วนหัวหน้าจอ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-1">
            <BookOpen className="w-4 h-4" />
            <span>ระบบตรวจสอบเวลาเข้าเรียนและสิทธิ์สอบ (Student Attendance & Eligibility)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            รายวิชาที่รับผิดชอบ
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {isSuperAdmin
              ? "มุมมองผู้ดูแลระบบ: แสดงรายวิชาทั้งหมดในคณะพุทธศาสตร์ สามารถจัดการรายวิชา อาจารย์ และนิสิตได้"
              : "มุมมองอาจารย์ผู้สอน: แสดงเฉพาะรายวิชาที่คุณได้รับมอบหมายในการสอนและเช็กชื่อนิสิต"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/curriculum/calendar"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60 font-medium text-sm shadow-xs transition"
          >
            <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>ปฏิทินการศึกษา (Academic Calendar)</span>
          </Link>

          <button
            type="button"
            onClick={handleOpenAllTeacherHandover}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-medium text-sm shadow-xs transition"
            title="พิมพ์ใบส่งมอบบัญชีผู้ใช้และรหัสผ่านสำหรับอาจารย์ผู้สอนทั้งหมด"
          >
            <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>พิมพ์ใบส่งมอบบัญชีอาจารย์</span>
          </button>

          <button
            type="button"
            onClick={handleOpenSyncModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-medium text-sm shadow-xs transition"
          >
            <DownloadCloud className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>นำเข้าจากตารางเรียนหลักสูตร</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium text-sm shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>เปิดรายวิชาใหม่</span>
          </button>
        </div>
      </div>

      {/* แถบแจ้งเตือนกำหนดการสำคัญสำหรับอาจารย์ผู้สอน */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase px-2 py-0.5 rounded-md bg-amber-500 text-white">
                ภาคการศึกษาที่ 2/2569
              </span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                กำหนดการสำคัญสำหรับอาจารย์ผู้บรรยาย
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              เปิดภาคเรียน: <strong className="text-slate-800 dark:text-slate-200">2 พ.ย. 2569</strong> • ประเมินการสอน: <strong className="text-slate-800 dark:text-slate-200">1 - 26 ก.พ. 2570</strong> • ปิดภาคเรียน: <strong className="text-slate-800 dark:text-slate-200">26 ก.พ. 2570</strong> • สอบปลายภาค: <strong className="text-rose-600 dark:text-rose-400">8 - 17 มี.ค. 2570</strong>
            </p>
          </div>
        </div>
        <Link
          href="/curriculum/calendar"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-50 text-xs font-semibold shrink-0 transition"
        >
          <span>ดูปฏิทินฉบับเต็ม</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* ══════════ Quick Teaching History & Year Filters ══════════ */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-primary" /> มุมมองการสอน:
          </span>

          <button
            type="button"
            onClick={() => {
              setSelectedStatus("ACTIVE");
              setSelectedTerm("ALL");
            }}
            className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              selectedStatus === "ACTIVE"
                ? "bg-primary text-white shadow-xs font-bold"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900"
            }`}
          >
            <span>📌 ภาคเรียนปัจจุบัน</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedStatus("ALL");
              setSelectedTerm("ALL");
            }}
            className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              selectedStatus === "ALL" && selectedTerm === "ALL"
                ? "bg-purple-700 text-white shadow-xs font-bold"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900"
            }`}
          >
            <span>📜 แฟ้มผลงานสอนย้อนหลังทั้งหมด (Teaching Portfolio)</span>
          </button>
        </div>

        {/* Quick Academic Year Pills */}
        <div className="flex items-center gap-1">
          <span className="text-2xs text-slate-400 font-semibold mr-1">เลือกปีการศึกษา:</span>
          {["2569", "2568", "2567", "2566"].map((yr) => {
            const isMatch = selectedTerm.includes(yr);
            return (
              <button
                key={yr}
                type="button"
                onClick={() => {
                  setSelectedStatus("ALL");
                  const matchedTerm = uniqueTerms.find((t) => t.includes(yr));
                  if (matchedTerm) {
                    setSelectedTerm(matchedTerm);
                  } else {
                    setSearchTerm(yr);
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-2xs font-mono font-bold transition cursor-pointer ${
                  isMatch || (searchTerm === yr && selectedStatus === "ALL")
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {yr}
              </button>
            );
          })}
        </div>
      </div>

      {/* แถบค้นหา ตัวกรองภาคการศึกษา และสถานะวิชา */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="lg:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาด้วยรหัสวิชา, ชื่อวิชา..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs shadow-2xs"
          />
        </div>

        <div>
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-200 shadow-2xs"
          >
            <option value="ALL">ภาคการศึกษา: ทั้งหมด</option>
            {uniqueTerms.map((t) => (
              <option key={t} value={t}>
                ภาค {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as "ACTIVE" | "ARCHIVED" | "ALL")}
            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-200 shadow-2xs"
          >
            <option value="ACTIVE">สถานะ: เปิดสอนอยู่ (Active)</option>
            <option value="ARCHIVED">สถานะ: ปิดภาคเรียนแล้ว (Archived)</option>
            <option value="ALL">สถานะ: ทั้งหมด (All)</option>
          </select>
        </div>

        <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-2xs">
          <span className="text-xs text-slate-500">ผลการกรอง:</span>
          <span className="font-bold text-sm text-primary">{filteredItems.length} วิชา</span>
        </div>
      </div>

      {/* รายการวิชา (Card Grid) */}
      {filteredItems.length === 0 ? (
        <LiyonCard className="p-12 text-center text-slate-500 flex flex-col items-center justify-center">
          <AlertCircle className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-base font-semibold text-slate-700 dark:text-slate-300">ไม่พบรายวิชาที่ค้นหา</p>
          <p className="text-sm text-slate-400 mt-1">
            ลองปรับเปลี่ยนคำค้นหา หรือกดปุ่ม "เปิดรายวิชาใหม่" เพื่อเพิ่มรายวิชาในระบบ
          </p>
        </LiyonCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const enrollCount = item._count?.enrollments ?? 0;
            const sessionCount = item._count?.sessions ?? item.targetSessions;
            const primaryTeacherName =
              item.primaryTeacher?.name ||
              item.instructor?.name ||
              item.teachers?.find((t) => t.isPrimary)?.user?.name ||
              item.teachers?.[0]?.user?.name ||
              "ไม่ระบุผู้สอน";

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-primary/50 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-xs tracking-wider">
                      {item.courseCode}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {item.status === "ARCHIVED" ? (
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-2xs border border-slate-200 dark:border-slate-700">
                          ปิดภาคเรียนแล้ว
                        </span>
                      ) : (
                        <StatusPill tone="info" className="text-2xs">
                          เทอม {item.term}
                        </StatusPill>
                      )}
                      {item.teachers?.some((t: { userId?: string; role?: string }) => t.userId === currentUserId && t.role === "GUEST_LECTURER") && (
                        <span className="px-2 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-bold text-2xs border border-purple-300">
                          ⭐ อาจารย์พิเศษ
                        </span>
                      )}

                      {/* ปุ่มปิดภาคเรียน / เปิดใช้งานใหม่ */}
                      {item.status === "ARCHIVED" ? (
                        <button
                          type="button"
                          onClick={() => setRestoreTarget(item)}
                          className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                          title="เปิดใช้งานวิชานี้อีกครั้ง"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setArchiveTarget(item)}
                          className="p-1 rounded-md text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition"
                          title="ปิดภาคการศึกษา (Archive)"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* ปุ่มแก้ไขรายวิชา */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="p-1 rounded-md text-slate-400 hover:text-primary hover:bg-primary/10 transition"
                        title="แก้ไขข้อมูลรายวิชา"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {/* ปุ่มลบรายวิชา */}
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                        title="ลบรายวิชานี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary transition line-clamp-2">
                    {item.courseName}
                  </h3>
                  {item.courseNameEn && (
                    <p className="text-xs text-slate-400 italic line-clamp-1 mt-0.5">{item.courseNameEn}</p>
                  )}
                  {item.description && item.description.includes("สาขาวิชา:") && (
                    <div className="mt-1.5 flex flex-wrap gap-1 text-[10.5px]">
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800/60 font-semibold">
                        {item.description.split("•")[0]?.trim()}
                      </span>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="line-clamp-1">
                        อาจารย์: <span className="font-medium text-slate-800 dark:text-slate-200">{primaryTeacherName}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>
                        {item.dayOfWeek ? DAY_NAMES[item.dayOfWeek] : "ทุกสัปดาห์"}
                        {item.startTime && item.endTime ? ` (${item.startTime} - ${item.endTime} น.)` : ""}
                      </span>
                    </div>

                    {item.room && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="line-clamp-1">ห้อง {item.room}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* สถิติตัวเลขและปุ่มปฏิบัติการ */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-primary" /> {enrollCount} นิสิตลงทะเบียน
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" /> {sessionCount} คาบเรียน
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5 pt-1">
                    <Link
                      href={`/attendance/classes/${item.id}/sessions`}
                      className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-2xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-primary hover:text-white hover:border-primary transition shadow-2xs"
                      title="ตารางคาบเรียนและการเช็กชื่อ"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      เช็กชื่อ
                    </Link>

                    <Link
                      href={`/attendance/classes/${item.id}/students`}
                      className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-2xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-2xs"
                      title="รายชื่อนิสิตที่ลงทะเบียน"
                    >
                      <Users className="w-3 h-3" />
                      นิสิต
                    </Link>

                    <Link
                      href={`/attendance/classes/${item.id}/teachers`}
                      className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-2xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white transition shadow-2xs"
                      title="อาจารย์ผู้สอนร่วมและผู้ช่วยสอน"
                    >
                      <GraduationCap className="w-3 h-3" />
                      ผู้สอน
                    </Link>

                    <Link
                      href={`/attendance/classes/${item.id}/eligibility`}
                      className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-2xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white transition shadow-2xs"
                      title="สรุปผลเวลาเรียนและสิทธิ์สอบ"
                    >
                      <FileSpreadsheet className="w-3 h-3" />
                      สิทธิ์สอบ
                    </Link>

                    <Link
                      href={`/attendance/classes/${item.id}/grades`}
                      className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-2xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-600 hover:text-white transition shadow-2xs"
                      title="สมุดบันทึกคะแนนและเกรด (คะแนนเก็บ, กลางภาค, จิตวิสัย, ปลายภาค)"
                    >
                      <Award className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      คะแนน
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal สำหรับสร้างรายวิชาใหม่ */}
      <LiyonDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} wide>
        <LiyonDialogHeader
          title="เปิดรายวิชาใหม่ (พร้อมสร้าง 16 คาบเรียนอัตโนมัติ)"
          description="กรอกข้อมูลรายวิชา ระบบจะทำการสร้างคาบเรียนสัปดาห์ละ 1 ครั้งจำนวน 16 คาบให้อัตโนมัติ"
        />
        <LiyonDialogCloseButton label="ปิดหน้าต่าง" />
        <form onSubmit={handleCreateClass}>
          <LiyonDialogBody className="space-y-4 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  รหัสวิชา *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น BUD101, 101 102"
                  value={formData.courseCode}
                  onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  หน่วยกิต
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={formData.credits}
                  onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ชื่อรายวิชา (ภาษาไทย) *
              </label>
              <input
                type="text"
                required
                placeholder="เช่น พระไตรปิฎกศึกษา, พุทธประวัติ"
                value={formData.courseName}
                onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ชื่อรายวิชา (ภาษาอังกฤษ) <span className="text-slate-400 font-normal text-[11px]">(ช่วยจำแนกภาคภาษาไทย หรือ ภาคภาษาอังกฤษ / English Program)</span>
              </label>
              <input
                type="text"
                placeholder="เช่น Tipitaka Studies"
                value={formData.courseNameEn}
                onChange={(e) => setFormData({ ...formData, courseNameEn: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ภาคการศึกษา (เทอม) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น 2/2569"
                  value={formData.term}
                  onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  สาขาวิชา *
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="สาขาวิชาพระพุทธศาสนา">สาขาวิชาพระพุทธศาสนา</option>
                  <option value="สาขาวิชาศาสนาและปรัชญา">สาขาวิชาศาสนาและปรัชญา</option>
                  <option value="สาขาวิชาบาลีสันสกฤต">สาขาวิชาบาลีสันสกฤต</option>
                  <option value="สาขาวิชาวิปัสสนาภาวนา">สาขาวิชาวิปัสสนาภาวนา</option>
                  <option value="หมวดวิชาศึกษาทั่วไป">หมวดวิชาศึกษาทั่วไป (วิชากลาง)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  หลักสูตรภาษา *
                </label>
                <select
                  value={formData.curriculumLanguage}
                  onChange={(e) => setFormData({ ...formData, curriculumLanguage: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="ปริญญาตรี (ภาคภาษาไทย)">ปริญญาตรี (ภาคภาษาไทย)</option>
                  <option value="ปริญญาตรี (ภาคภาษาอังกฤษ / English Program)">ปริญญาตรี (ภาคภาษาอังกฤษ / English Program)</option>
                  <option value="ปริญญาโท">ปริญญาโท</option>
                  <option value="ปริญญาเอก">ปริญญาเอก</option>
                  <option value="ประกาศนียบัตร">ประกาศนียบัตร</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                อาจารย์ผู้สอน (ผู้รับผิดชอบรายวิชา)
              </label>
              <select
                value={formData.primaryTeacherId}
                onChange={(e) => setFormData({ ...formData, primaryTeacherId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">-- กำหนดตัวเองเป็นผู้สอน หรือเลือกอาจารย์ --</option>
                {teacherOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ห้องเรียน
                </label>
                <input
                  type="text"
                  placeholder="เช่น B302, ห้องเรียน 1"
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  วันเรียน
                </label>
                <select
                  value={formData.dayOfWeek}
                  onChange={(e) => setFormData({ ...formData, dayOfWeek: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value={1}>วันจันทร์</option>
                  <option value={2}>วันอังคาร</option>
                  <option value={3}>วันพุธ</option>
                  <option value={4}>วันพฤหัสบดี</option>
                  <option value={5}>วันศุกร์</option>
                  <option value={6}>วันเสาร์</option>
                  <option value={7}>วันอาทิตย์</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  เวลาเริ่ม
                </label>
                <input
                  type="text"
                  placeholder="09.00"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  เวลาสิ้นสุด
                </label>
                <input
                  type="text"
                  placeholder="11.30"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
          </LiyonDialogBody>

          <LiyonDialogFooter className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-xs font-medium transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 text-xs font-medium transition disabled:opacity-50"
            >
              {isSubmitting ? "กำลังบันทึกและสร้างคาบ..." : "บันทึกและเปิดรายวิชา"}
            </button>
          </LiyonDialogFooter>
        </form>
      </LiyonDialog>

      {/* Modal สำหรับแก้ไขรายวิชา */}
      <LiyonDialog open={isEditOpen} onOpenChange={setIsEditOpen} wide>
        <LiyonDialogHeader
          title={`แก้ไขข้อมูลรายวิชา: ${editTarget?.courseCode || ""}`}
          description="ปรับปรุงข้อมูลรายวิชา เช่น ชื่อวิชา, ภาคการศึกษา, สาขาวิชา, หลักสูตรภาษา หรืออาจารย์ผู้สอน"
        />
        <LiyonDialogCloseButton label="ปิด" />
        <form onSubmit={handleUpdateClass} className="space-y-4">
          <LiyonDialogBody className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  รหัสวิชา *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น 101 101"
                  value={editFormData.courseCode}
                  onChange={(e) => setEditFormData({ ...editFormData, courseCode: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ชื่อรายวิชา (ภาษาไทย) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น พระไตรปิฎกศึกษา"
                  value={editFormData.courseName}
                  onChange={(e) => setEditFormData({ ...editFormData, courseName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ชื่อรายวิชา (ภาษาอังกฤษ) <span className="text-slate-400 font-normal text-[11px]">(ช่วยจำแนกภาคภาษาไทย หรือ ภาคภาษาอังกฤษ / English Program)</span>
              </label>
              <input
                type="text"
                placeholder="เช่น Tipitaka Studies"
                value={editFormData.courseNameEn}
                onChange={(e) => setEditFormData({ ...editFormData, courseNameEn: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ภาคการศึกษา (เทอม) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น 2/2569"
                  value={editFormData.term}
                  onChange={(e) => setEditFormData({ ...editFormData, term: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  สาขาวิชา *
                </label>
                <select
                  value={editFormData.department}
                  onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="สาขาวิชาพระพุทธศาสนา">สาขาวิชาพระพุทธศาสนา</option>
                  <option value="สาขาวิชาศาสนาและปรัชญา">สาขาวิชาศาสนาและปรัชญา</option>
                  <option value="สาขาวิชาบาลีสันสกฤต">สาขาวิชาบาลีสันสกฤต</option>
                  <option value="สาขาวิชาวิปัสสนาภาวนา">สาขาวิชาวิปัสสนาภาวนา</option>
                  <option value="หมวดวิชาศึกษาทั่วไป">หมวดวิชาศึกษาทั่วไป (วิชากลาง)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  หลักสูตรภาษา *
                </label>
                <select
                  value={editFormData.curriculumLanguage}
                  onChange={(e) => setEditFormData({ ...editFormData, curriculumLanguage: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="ปริญญาตรี (ภาคภาษาไทย)">ปริญญาตรี (ภาคภาษาไทย)</option>
                  <option value="ปริญญาตรี (ภาคภาษาอังกฤษ / English Program)">ปริญญาตรี (ภาคภาษาอังกฤษ / English Program)</option>
                  <option value="ปริญญาโท">ปริญญาโท</option>
                  <option value="ปริญญาเอก">ปริญญาเอก</option>
                  <option value="ประกาศนียบัตร">ประกาศนียบัตร</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                อาจารย์ผู้สอน (ผู้รับผิดชอบรายวิชา)
              </label>
              <select
                value={editFormData.primaryTeacherId}
                onChange={(e) => setEditFormData({ ...editFormData, primaryTeacherId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">-- ไม่ระบุ / กำหนดภายหลัง --</option>
                {teacherOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ห้องเรียน
                </label>
                <input
                  type="text"
                  placeholder="เช่น B302, ห้องเรียน 1"
                  value={editFormData.room}
                  onChange={(e) => setEditFormData({ ...editFormData, room: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  วันเรียน
                </label>
                <select
                  value={editFormData.dayOfWeek}
                  onChange={(e) => setEditFormData({ ...editFormData, dayOfWeek: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value={1}>วันจันทร์</option>
                  <option value={2}>วันอังคาร</option>
                  <option value={3}>วันพุธ</option>
                  <option value={4}>วันพฤหัสบดี</option>
                  <option value={5}>วันศุกร์</option>
                  <option value={6}>วันเสาร์</option>
                  <option value={7}>วันอาทิตย์</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  เวลาเริ่ม
                </label>
                <input
                  type="text"
                  placeholder="09.00"
                  value={editFormData.startTime}
                  onChange={(e) => setEditFormData({ ...editFormData, startTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  เวลาสิ้นสุด
                </label>
                <input
                  type="text"
                  placeholder="11.30"
                  value={editFormData.endTime}
                  onChange={(e) => setEditFormData({ ...editFormData, endTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                รายละเอียดเพิ่มเติม
              </label>
              <textarea
                rows={2}
                placeholder="คำอธิบายรายวิชา (ถ้ามี)"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </LiyonDialogBody>

          <LiyonDialogFooter className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-xs font-medium transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 text-xs font-medium transition disabled:opacity-50"
            >
              {isUpdating ? "กำลังบันทึกข้อมูล..." : "บันทึกการแก้ไข"}
            </button>
          </LiyonDialogFooter>
        </form>
      </LiyonDialog>

      {/* Modal ยืนยันการลบรายวิชา (Delete Course Modal) */}
      <LiyonDialog open={!!deleteTarget} onOpenChange={(open) => !open && !isDeleting && setDeleteTarget(null)} danger>
        <LiyonDialogHeader
          title="ยืนยันการลบรายวิชา"
          description={`วิชา ${deleteTarget?.courseCode} — ${deleteTarget?.courseName} (ภาค ${deleteTarget?.term})`}
        />
        <LiyonDialogCloseButton label="ปิด" />
        <LiyonDialogBody className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">คำเตือนการลบรายวิชา:</p>
              <p>
                การลบรายวิชานี้จะนำข้อมูลคาบเรียน การลงทะเบียนของนิสิต และประวัติการเข้าเรียนทั้งหมดของวิชานี้ออกจากระบบอย่างถาวร
                หากท่านสร้างวิชาผิด เช่น สะกดชื่อวิชาหรือรหัสวิชาผิด ท่านสามารถใช้ปุ่ม <strong>"แก้ไข"</strong> แทนการลบได้
              </p>
            </div>
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
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold disabled:opacity-50 transition"
          >
            {isDeleting ? "กำลังลบรายวิชา..." : "ยืนยันการลบรายวิชา"}
          </button>
        </LiyonDialogFooter>
      </LiyonDialog>

      {/* Modal ยืนยันการปิดภาคการศึกษา (Archive Course) */}
      <LiyonDialog open={!!archiveTarget} onOpenChange={(open) => !open && setArchiveTarget(null)}>
        <LiyonDialogHeader
          title="ยืนยันการปิดภาคการศึกษาของรายวิชา"
          description={`วิชา ${archiveTarget?.courseCode} — ${archiveTarget?.courseName} (ภาค ${archiveTarget?.term})`}
        />
        <LiyonDialogCloseButton label="ปิด" />
        <LiyonDialogBody className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 space-y-1">
            <p className="font-bold">คำแนะนำก่อนปิดภาคการศึกษา:</p>
            <p>
              เมื่อปิดภาคการศึกษาแล้ว รายวิชานี้จะถูกจัดเก็บเข้าคลังประวัติ (Archived) ข้อมูลคาบเรียนและการเช็กชื่อทั้งหมดจะถูกป้องกันการแก้ไข แต่ยังสามารถเปิดดูและพิมพ์รายงานย้อนหลังได้ตลอดเวลา
            </p>
          </div>
        </LiyonDialogBody>
        <LiyonDialogFooter className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setArchiveTarget(null)}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={isProcessingAction}
            onClick={handleArchiveCourse}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold disabled:opacity-50"
          >
            {isProcessingAction ? "กำลังดำเนินการ..." : "ยืนยันการปิดภาคการศึกษา"}
          </button>
        </LiyonDialogFooter>
      </LiyonDialog>

      {/* Modal ยืนยันการเปิดใช้งานรายวิชาอีกครั้ง (Restore Course) */}
      <LiyonDialog open={!!restoreTarget} onOpenChange={(open) => !open && setRestoreTarget(null)}>
        <LiyonDialogHeader
          title="ยืนยันการเปิดใช้งานรายวิชาอีกครั้ง"
          description={`วิชา ${restoreTarget?.courseCode} — ${restoreTarget?.courseName}`}
        />
        <LiyonDialogCloseButton label="ปิด" />
        <LiyonDialogBody className="text-xs text-slate-600 dark:text-slate-400">
          รายวิชานี้จะกลับมามีสถานะ "เปิดสอนอยู่ (Active)" เพื่อให้อาจารย์สามารถจัดการและเช็กชื่อต่อได้
        </LiyonDialogBody>
        <LiyonDialogFooter className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setRestoreTarget(null)}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={isProcessingAction}
            onClick={handleRestoreCourse}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold disabled:opacity-50"
          >
            {isProcessingAction ? "กำลังดำเนินการ..." : "ยืนยันการเปิดใช้งาน"}
          </button>
        </LiyonDialogFooter>
      </LiyonDialog>

      {/* Modal 1: นำเข้าจากตารางเรียนหลักสูตร (Timetable Sync Modal) */}
      <LiyonDialog open={isSyncModalOpen} onOpenChange={(open) => !isSyncing && setIsSyncModalOpen(open)}>
        <LiyonDialogHeader
          title="นำเข้ารายวิชาจากตารางเรียนหลักสูตร"
          description="เลือกตารางเรียนเพื่อดึงรายวิชา สร้าง 16 คาบเรียน และสร้างบัญชีอาจารย์ผู้สอนอัตโนมัติ"
        />
        <LiyonDialogCloseButton label="ปิด" />
        <LiyonDialogBody className="space-y-4 max-h-[70vh] overflow-y-auto">
          {isLoadingTimetables ? (
            <div className="py-12 text-center text-slate-500">
              <div className="animate-spin w-8 h-8 border-3 border-primary border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm font-medium">กำลังโหลดข้อมูลตารางเรียนหลักสูตร...</p>
            </div>
          ) : timetables.length === 0 ? (
            <div className="py-12 text-center text-slate-500 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">ไม่พบข้อมูลตารางเรียนในระบบ</p>
              <p className="text-xs text-slate-400 mt-1">กรุณาตรวจสอบการตั้งค่าตารางเรียนหลักสูตรในระบบจัดการหลักสูตร</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* เลือกตารางเรียน */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  เลือกตารางเรียนหลักสูตร <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedTimetableId}
                  onChange={(e) => handleSelectTimetable(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {timetables.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.titleTh} (ปี {t.yearLevel} เทอม {t.semester}/{t.academicYear}) — {t.courseCount} วิชา
                    </option>
                  ))}
                </select>
              </div>

              {/* ข้อมูลสรุปของตารางเรียนที่เลือก */}
              {(() => {
                const cur = timetables.find((t) => t.id === selectedTimetableId);
                if (!cur) return null;
                return (
                  <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/50 text-xs space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-indigo-900 dark:text-indigo-200">{cur.curriculumName}</span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 font-bold text-[11px]">
                        ภาคเรียนที่ {cur.semester}/{cur.academicYear} (ชั้นปีที่ {cur.yearLevel})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
                      <span>ภาควิชา: {cur.departmentName}</span>
                      {cur.room && <span>ห้องเรียน: {cur.room}</span>}
                      {cur.termDates && <span>ช่วงเวลา: {cur.termDates}</span>}
                    </div>
                  </div>
                );
              })()}

              {/* รายการวิชาในตารางเรียน */}
              {(() => {
                const cur = timetables.find((t) => t.id === selectedTimetableId);
                if (!cur || !cur.courses || cur.courses.length === 0) return null;

                const allSelected = selectedCourseCodes.length === cur.courses.length;

                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        เลือกรายวิชาที่ต้องการนำเข้า ({selectedCourseCodes.length}/{cur.courses.length} วิชา)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleAllCourses(cur.courses)}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        {allSelected ? "ยกเลิกเลือกทั้งหมด" : "เลือกทั้งหมด"}
                      </button>
                    </div>

                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60 max-h-80 overflow-y-auto">
                      {cur.courses.map((c: SyncTimetableCourseItem) => {
                        const isChecked = selectedCourseCodes.includes(c.courseCode);
                        return (
                          <div
                            key={c.id || c.courseCode}
                            onClick={() => handleToggleCourse(c.courseCode)}
                            className={`p-3 flex items-start gap-3 cursor-pointer transition ${
                              isChecked
                                ? "bg-primary/5 dark:bg-primary/10"
                                : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}} // handled by parent onClick
                              className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-900 dark:text-white">
                                  {c.courseCode}
                                </span>
                                <span className="font-medium text-xs text-slate-700 dark:text-slate-300 truncate">
                                  {c.courseName}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  {DAY_NAMES[c.dayOfWeek] || "ตามตาราง"} {c.startTime} - {c.endTime} น.
                                </span>
                                {c.room && (
                                  <span className="inline-flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-slate-400" />
                                    {c.room}
                                  </span>
                                )}
                              </div>
                              <div className="mt-1.5 flex items-center gap-2 text-[11px]">
                                <span className="text-slate-500">ผู้สอน:</span>
                                <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-medium">
                                  {c.instructor || "ไม่ระบุอาจารย์"}
                                </span>
                                <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-medium">
                                  • สร้าง 16 คาบเรียนอัตโนมัติ
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </LiyonDialogBody>
        <LiyonDialogFooter className="flex justify-between items-center gap-2">
          <button
            type="button"
            disabled={isSyncing}
            onClick={() => setIsSyncModalOpen(false)}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={isSyncing || selectedCourseCodes.length === 0}
            onClick={handleExecuteSync}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
          >
            {isSyncing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>กำลังนำเข้าและสร้างบัญชีอาจารย์...</span>
              </>
            ) : (
              <>
                <DownloadCloud className="w-4 h-4" />
                <span>ยืนยันการนำเข้า ({selectedCourseCodes.length} วิชา)</span>
              </>
            )}
          </button>
        </LiyonDialogFooter>
      </LiyonDialog>

      {/* Modal 2: ใบส่งมอบบัญชีอาจารย์ผู้สอน (Teacher Account Handover Modal) */}
      <LiyonDialog open={isHandoverModalOpen} onOpenChange={(open) => setIsHandoverModalOpen(open)} wide>
        <div className="print:hidden">
          <LiyonDialogHeader
            title="ใบส่งมอบบัญชีอาจารย์ผู้สอน (Teacher Account Handover)"
            description="พิมพ์ใบส่งมอบรหัสผ่านรายบุคคลสำหรับแจกอาจารย์ (พิมพ์กระดาษ/PDF 4 ใบต่อหน้า A4) หรือดูตารางสรุปภาพรวม"
          />
          <LiyonDialogCloseButton label="ปิด" />
        </div>

        <LiyonDialogBody className="space-y-4 max-h-[75vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0">
          {/* แถบควบคุมและเครื่องมือ (ซ่อนตอนพิมพ์) */}
          <div className="space-y-3 print:hidden">
            {/* แถวบน: สรุปผลภาพรวมจำนวนบัญชีอาจารย์และรายวิชา */}
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2.5 text-xs shadow-2xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-bold text-emerald-950 dark:text-emerald-100 text-sm">
                  พร้อมส่งมอบ {syncResult?.teacherCredentials?.length || 0} บัญชีอาจารย์
                </span>
                <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                  (ครอบคลุม {syncResult?.importedCount || items.length} รายวิชา 16 คาบเรียน)
                </span>
              </div>
            </div>

            {/* แถวต่อมา: สลับมุมมองการพิมพ์ (ใบตัดแจก 4 ใบ, 6 ใบ, 8 ใบ, ตารางสรุปภาพรวม) */}
            <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80 overflow-x-auto scrollbar-thin">
              <button
                type="button"
                onClick={() => setHandoverViewMode("slips4")}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  handoverViewMode === "slips4" || handoverViewMode === "slips"
                    ? "bg-primary text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/60 dark:hover:bg-slate-700"
                }`}
                title="พิมพ์ 4 ใบต่อหน้า A4 ขนาดใหญ่ อ่านง่าย สบายตา ช่องเซ็นชื่อกว้าง"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>ใบตัดแจก (4 ใบ/หน้า)</span>
              </button>
              <button
                type="button"
                onClick={() => setHandoverViewMode("slips6")}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  handoverViewMode === "slips6"
                    ? "bg-primary text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/60 dark:hover:bg-slate-700"
                }`}
                title="พิมพ์ 6 ใบต่อหน้า A4 ขนาด 2 คอลัมน์ x 3 แถว ประหยัดกระดาษ 33%"
              >
                <Scissors className="w-3.5 h-3.5 text-amber-500" />
                <span>ใบตัดแจก (6 ใบ/หน้า)</span>
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                  ประหยัด 33%
                </span>
              </button>
              <button
                type="button"
                onClick={() => setHandoverViewMode("slips8")}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  handoverViewMode === "slips8"
                    ? "bg-primary text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/60 dark:hover:bg-slate-700"
                }`}
                title="พิมพ์ 8 ใบต่อหน้า A4 ขนาด 2 คอลัมน์ x 4 แถว ประหยัดกระดาษ 50%"
              >
                <Scissors className="w-3.5 h-3.5 text-emerald-500" />
                <span>ใบตัดแจก (8 ใบ/หน้า)</span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                  ประหยัด 50%
                </span>
              </button>
              <button
                type="button"
                onClick={() => setHandoverViewMode("table")}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  handoverViewMode === "table"
                    ? "bg-primary text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/60 dark:hover:bg-slate-700"
                }`}
                title="ตารางสรุปภาพรวม สำหรับฝ่ายวิชาการเก็บเข้าแฟ้มควบคุมภายใน"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>ตารางสรุปภาพรวม</span>
              </button>
            </div>

            {/* ปรับแต่งข้อความหน่วยงานออกเอกสาร & ช่องค้นหาอาจารย์ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              {/* ช่องแก้ไขข้อความผู้ส่งมอบ / หน่วยงานออกเอกสาร */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                    <span>ข้อความหน่วยงานออกเอกสาร (มุมขวาล่างของใบส่งมอบ):</span>
                  </span>
                  {handoverIssuerText !== "ฝ่ายวิชาการ คณะพุทธศาสตร์ มจร." && (
                    <button
                      type="button"
                      onClick={() => setHandoverIssuerText("ฝ่ายวิชาการ คณะพุทธศาสตร์ มจร.")}
                      className="text-[10px] text-primary hover:underline font-semibold cursor-pointer"
                    >
                      คืนค่าเดิม
                    </button>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={handoverIssuerText}
                    onChange={(e) => setHandoverIssuerText(e.target.value)}
                    placeholder="เช่น ฝ่ายวิชาการ คณะพุทธศาสตร์ มจร."
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-primary focus:outline-none font-medium text-slate-900 dark:text-slate-100 shadow-2xs"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  * ข้อความนี้จะปรากฏใต้ช่องลงชื่อวันที่ในทุกใบตัดแจกและตารางสรุปโดยอัตโนมัติ
                </p>
              </div>

              {/* ช่องค้นหาอาจารย์ */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-primary" />
                  <span>ค้นหาอาจารย์ในรายการ:</span>
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={handoverSearch}
                    onChange={(e) => setHandoverSearch(e.target.value)}
                    placeholder="ค้นหาชื่ออาจารย์, อีเมล, หรือรหัสวิชา..."
                    className="w-full pl-8 pr-16 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-primary focus:outline-none text-slate-900 dark:text-slate-100 shadow-2xs"
                  />
                  {handoverSearch && (
                    <button
                      type="button"
                      onClick={() => setHandoverSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
                    >
                      ล้างคำค้น
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  แสดง {filteredTeacherCredentials.length} จาก {syncResult?.teacherCredentials?.length || 0} ท่าน
                </p>
              </div>
            </div>
          </div>

          {/* พื้นที่พิมพ์เอกสาร (Handover Printable Area) */}
          <div className="handover-printable-area space-y-4">
            {/* โหมดที่ 1: สลิปใบส่งมอบรายบุคคล (Slips View - 4 ใบต่อหน้า A4 มีเส้นประตัด) */}
            {handoverViewMode === "slips4" || handoverViewMode === "slips" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-4 print:gap-4">
                  {filteredTeacherCredentials.map((cred: TeacherCredentialItem, _idx: number) => (
                    <div
                      key={cred.email}
                      className="handover-slip-card border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs flex flex-col justify-between relative overflow-hidden"
                    >
                      <div>
                        {/* แถบรอยปรุตัดแยกส่วนบน ชัดเจนไม่ทับตัวหนังสือ */}
                        <div className="flex items-center justify-between pb-1.5 border-b border-dashed border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 font-mono">
                          <span className="font-semibold text-slate-500 dark:text-slate-400">ใบส่งมอบบัญชีอาจารย์ผู้สอน (4 ใบ/หน้า)</span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <Scissors className="w-3 h-3" />
                            <span>ตัดตามรอยปรุ</span>
                          </span>
                        </div>

                        {/* หัวแบบฟอร์มทางการ มจร. */}
                        <div className="flex items-center gap-2.5 py-2">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 font-bold text-xs border border-amber-500/20">
                            มจร
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-[11px] leading-tight text-slate-800 dark:text-slate-200 truncate">
                              มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย • คณะพุทธศาสตร์
                            </div>
                            <div className="text-xs font-bold text-primary dark:text-indigo-400 leading-tight">
                              ใบส่งมอบบัญชีผู้ใช้ระบบสารสนเทศอาจารย์ผู้สอน
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">
                              ภาคการศึกษาที่ 2/2569 (Semester 2/2026)
                            </div>
                          </div>
                        </div>

                        {/* ข้อมูลประจำตัวอาจารย์และรหัสผ่าน */}
                        <div className="mt-1 pt-1.5 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              อาจารย์ผู้สอน:
                            </span>
                            <div className="font-bold text-sm text-slate-900 dark:text-white">
                              {cred.teacherName}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80">
                            <div className="min-w-0">
                              <span className="text-[9.5px] uppercase font-bold text-slate-500 dark:text-slate-400 block truncate">
                                อีเมลเข้าสู่ระบบ (Username)
                              </span>
                              <div className="font-mono text-[11.5px] font-semibold text-indigo-600 dark:text-indigo-400 truncate" title={cred.email}>
                                {cred.email}
                              </div>
                            </div>
                            <div className="min-w-0">
                              <span className="text-[9.5px] uppercase font-bold text-slate-500 dark:text-slate-400 block truncate">
                                รหัสผ่านเริ่มต้น (Initial Password)
                              </span>
                              <div className="font-mono text-xs font-black text-amber-700 dark:text-amber-300">
                                {cred.initialPassword || "(บัญชีเดิมในระบบ)"}
                              </div>
                            </div>
                          </div>

                          <div className="text-[10.5px] text-slate-600 dark:text-slate-400">
                            <span className="font-semibold">เว็บไซต์เข้าสู่ระบบ:</span>{" "}
                            <span className="font-mono text-primary font-bold">http://localhost:3010/login</span>
                          </div>

                          {/* รายวิชาที่สอน */}
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                              รายวิชาที่สอน ({cred.courses?.length || 0} วิชา):
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {cred.courses?.map((c: string, ci: number) => (
                                <span
                                  key={ci}
                                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-700 dark:text-slate-300"
                                >
                                  {c}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* คำแนะนำความปลอดภัย */}
                          <div className="text-[9px] text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-1.5">
                            * ระบบใช้สำหรับบันทึกเวลาเรียน 16 คาบ ประเมินสิทธิ์สอบ และส่งเกรด กรุณาเปลี่ยนรหัสผ่านทันทีในการเข้าสู่ระบบครั้งแรก
                          </div>
                        </div>
                      </div>

                      {/* ส่วนลงนามรับมอบ */}
                      <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800">
                        <div className="flex items-end justify-between text-[10px] text-slate-600 dark:text-slate-400">
                          <div>
                            <div>ลงชื่อ .................................................... ผู้รับมอบ</div>
                            <div className="mt-0.5 pl-6 font-medium">({cred.teacherName})</div>
                          </div>
                          <div className="text-right">
                            <div>วันที่ ..... / ..... / 2569</div>
                            <div className="text-[9.5px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                              {handoverIssuerText}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ปุ่มลัดสำหรับการทำงานหน้าจอ (ซ่อนตอนพิมพ์) */}
                      <div className="mt-2.5 pt-2 flex items-center justify-end gap-1.5 border-t border-slate-100 dark:border-slate-800 print:hidden">
                        <button
                          type="button"
                          onClick={() => handleCopySingleCredential(cred)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300 transition"
                          title="คัดลอกข้อความสำหรับส่งให้อาจารย์ท่านนี้ทาง LINE หรือ Email"
                        >
                          <Copy className="w-3 h-3 text-slate-400" />
                          <span>คัดลอก</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePrintHandover(cred.email)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition"
                          title="พิมพ์เฉพาะใบส่งมอบของอาจารย์ท่านนี้"
                        >
                          <Printer className="w-3 h-3 text-emerald-600" />
                          <span>พิมพ์เฉพาะใบนี้</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredTeacherCredentials.length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-xs border border-dashed rounded-xl">
                    ไม่พบข้อมูลอาจารย์ที่ตรงกับคำค้นหา
                  </div>
                )}
              </div>
            ) : handoverViewMode === "slips6" ? (
              /* โหมดที่ 2: สลิปใบตัดแจก 6 ใบต่อหน้า A4 (ประหยัดกระดาษ 33%) */
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {filteredTeacherCredentials.map((cred: TeacherCredentialItem, _idx: number) => (
                    <div
                      key={cred.email}
                      className="handover-slip-card border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs flex flex-col justify-between relative overflow-hidden"
                    >
                      <div>
                        {/* แถบรอยปรุตัดแยกส่วนบน */}
                        <div className="flex items-center justify-between pb-1 border-b border-dashed border-slate-200 dark:border-slate-800 text-[9px] text-slate-400 font-mono">
                          <span className="font-semibold text-slate-500 dark:text-slate-400">ใบส่งมอบบัญชีอาจารย์ (6/หน้า)</span>
                          <span className="flex items-center gap-0.5 text-slate-400">
                            <Scissors className="w-2.5 h-2.5 text-amber-500" />
                            <span>ตัดตามรอยปรุ</span>
                          </span>
                        </div>

                        {/* หัวเอกสาร */}
                        <div className="flex items-center gap-2 pt-2 pb-1.5">
                          <div className="w-6 h-6 rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center font-bold text-[9px] text-amber-700 dark:text-amber-400 shrink-0">
                            มจร
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[9px] font-bold text-slate-700 dark:text-slate-300 truncate">
                              มหาจุฬาลงกรณราชวิทยาลัย • คณะพุทธศาสตร์
                            </div>
                            <div className="text-[10.5px] font-extrabold text-blue-900 dark:text-blue-300 leading-tight truncate">
                              ใบส่งมอบบัญชีผู้ใช้ระบบสารสนเทศ
                            </div>
                            <div className="text-[8.5px] text-slate-400">
                              ภาคการศึกษาที่ 2/2569
                            </div>
                          </div>
                        </div>

                        {/* ชื่ออาจารย์ผู้สอน */}
                        <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-[8.5px] text-slate-400 block">อาจารย์ผู้สอน:</span>
                          <span className="text-[11.5px] font-bold text-slate-900 dark:text-white block truncate">
                            {cred.teacherName}
                          </span>
                        </div>

                        {/* กล่อง Username & Password */}
                        <div className="mt-1.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 grid grid-cols-2 gap-2 text-xs">
                          <div className="min-w-0">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">อีเมลเข้าสู่ระบบ</span>
                            <span className="font-mono text-[9.5px] font-semibold text-indigo-700 dark:text-indigo-300 truncate block">
                              {cred.email}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">รหัสผ่านเริ่มต้น</span>
                            <span className="font-mono text-[10.5px] font-extrabold text-amber-700 dark:text-amber-400 block truncate">
                              {cred.initialPassword || "(ใช้รหัสผ่านเดิม)"}
                            </span>
                          </div>
                        </div>

                        {/* ลิงก์เข้าสู่ระบบ */}
                        <div className="mt-1 text-[8.5px] text-slate-500 dark:text-slate-400">
                          <span>เว็บไซต์: </span>
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                            http://localhost:3010/login
                          </span>
                        </div>

                        {/* รายวิชาที่สอน */}
                        <div className="mt-1.5">
                          <span className="text-[8.5px] font-bold text-slate-500">
                            วิชาที่รับผิดชอบ ({cred.courses?.length || 0}):
                          </span>
                          <div className="flex flex-wrap gap-1 mt-0.5 max-h-12 overflow-hidden">
                            {(cred.courses || []).map((c: string, cIdx: number) => (
                              <span
                                key={cIdx}
                                className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[8px] font-medium border border-slate-200 dark:border-slate-700"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* คำแนะนำสิทธิ์และหน้าที่ */}
                        <div className="mt-1.5 pt-1 border-t border-slate-100 dark:border-slate-800 text-[7.5px] text-slate-400 leading-tight">
                          * บันทึกเวลาเรียน 16 คาบ ประเมินสิทธิ์สอบ และส่งเกรด • เปลี่ยนรหัสผ่านทันทีเมื่อเข้าใช้งานครั้งแรก
                        </div>

                        {/* ส่วนลงนามรับมอบ */}
                        <div className="mt-2 pt-1.5 border-t border-slate-200 dark:border-slate-700 flex items-end justify-between text-[8px] text-slate-600 dark:text-slate-400">
                          <div>
                            <div>ลงชื่อ ......................................... ผู้รับมอบ</div>
                            <div className="text-[8px] font-semibold text-slate-700 dark:text-slate-300 mt-0.5 pl-3">
                              ({cred.teacherName})
                            </div>
                          </div>
                          <div className="text-right">
                            <div>วันที่ ..... / ..... / 2569</div>
                            <div className="text-[8px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                              {handoverIssuerText}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ปุ่มลัดสำหรับการทำงานหน้าจอ (ซ่อนตอนพิมพ์) */}
                      <div className="mt-2 pt-1.5 flex items-center justify-end gap-1 border-t border-slate-100 dark:border-slate-800 print:hidden">
                        <button
                          type="button"
                          onClick={() => handleCopySingleCredential(cred)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-medium text-slate-700 dark:text-slate-300 transition cursor-pointer"
                          title="คัดลอกข้อความสำหรับส่งให้อาจารย์ท่านนี้ทาง LINE หรือ Email"
                        >
                          <Copy className="w-2.5 h-2.5 text-slate-400" />
                          <span>คัดลอก</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePrintHandover(cred.email)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition cursor-pointer"
                          title="พิมพ์เฉพาะใบส่งมอบของอาจารย์ท่านนี้"
                        >
                          <Printer className="w-2.5 h-2.5 text-emerald-600" />
                          <span>พิมพ์เฉพาะใบนี้</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredTeacherCredentials.length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-xs border border-dashed rounded-xl">
                    ไม่พบข้อมูลอาจารย์ที่ตรงกับคำค้นหา
                  </div>
                )}
              </div>
            ) : handoverViewMode === "slips8" ? (
              /* โหมดที่ 3: สลิปใบตัดแจก 8 ใบต่อหน้า A4 (ประหยัดกระดาษ 50%) */
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {filteredTeacherCredentials.map((cred: TeacherCredentialItem, _idx: number) => (
                    <div
                      key={cred.email}
                      className="handover-slip-card border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs flex flex-col justify-between relative overflow-hidden"
                    >
                      <div>
                        {/* แถบรอยปรุตัดแยกส่วนบน */}
                        <div className="flex items-center justify-between pb-1 border-b border-dashed border-slate-200 dark:border-slate-800 text-[8.5px] text-slate-400 font-mono">
                          <span className="font-semibold text-slate-500 dark:text-slate-400 truncate">ใบส่งมอบ (8/หน้า)</span>
                          <span className="flex items-center gap-0.5 text-slate-400 shrink-0">
                            <Scissors className="w-2.5 h-2.5 text-emerald-500" />
                            <span>ตัดตามรอยปรุ</span>
                          </span>
                        </div>

                        {/* หัวเอกสาร */}
                        <div className="flex items-center gap-1.5 pt-1.5 pb-1">
                          <div className="w-5 h-5 rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center font-bold text-[8px] text-amber-700 dark:text-amber-400 shrink-0">
                            มจร
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[8.5px] font-bold text-slate-700 dark:text-slate-300 truncate leading-tight">
                              คณะพุทธศาสตร์ มจร.
                            </div>
                            <div className="text-[9.5px] font-extrabold text-blue-900 dark:text-blue-300 leading-tight truncate">
                              ใบส่งมอบบัญชีผู้ใช้ระบบ
                            </div>
                          </div>
                        </div>

                        {/* ชื่ออาจารย์ผู้สอน */}
                        <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-[8px] text-slate-400 block">อาจารย์ผู้สอน:</span>
                          <span className="text-[10.5px] font-bold text-slate-900 dark:text-white block truncate">
                            {cred.teacherName}
                          </span>
                        </div>

                        {/* กล่อง Username & Password */}
                        <div className="mt-1 p-1.5 rounded-md bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 grid grid-cols-2 gap-1.5 text-xs">
                          <div className="min-w-0">
                            <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider block">อีเมล</span>
                            <span className="font-mono text-[8.5px] font-semibold text-indigo-700 dark:text-indigo-300 truncate block">
                              {cred.email}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider block">รหัสผ่านเริ่มต้น</span>
                            <span className="font-mono text-[9.5px] font-extrabold text-amber-700 dark:text-amber-400 block truncate">
                              {cred.initialPassword || "(ใช้รหัสเดิม)"}
                            </span>
                          </div>
                        </div>

                        {/* ลิงก์เข้าสู่ระบบ */}
                        <div className="mt-1 text-[8px] text-slate-500 dark:text-slate-400 truncate">
                          <span>เว็บ: </span>
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                            http://localhost:3010/login
                          </span>
                        </div>

                        {/* รายวิชาที่สอน */}
                        <div className="mt-1">
                          <span className="text-[8px] font-bold text-slate-500">
                            วิชาที่สอน ({cred.courses?.length || 0}):
                          </span>
                          <div className="flex flex-wrap gap-0.5 mt-0.5 max-h-9 overflow-hidden">
                            {(cred.courses || []).map((c: string, cIdx: number) => (
                              <span
                                key={cIdx}
                                className="px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[7.5px] font-medium border border-slate-200 dark:border-slate-700 truncate"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* คำแนะนำ */}
                        <div className="mt-1 pt-0.5 border-t border-slate-100 dark:border-slate-800 text-[7px] text-slate-400 leading-tight">
                          * บันทึกเวลาเรียน 16 คาบ ประเมินสิทธิ์สอบ ส่งเกรด
                        </div>

                        {/* ส่วนลงนามรับมอบ */}
                        <div className="mt-1.5 pt-1 border-t border-slate-200 dark:border-slate-700 flex items-end justify-between text-[7.5px] text-slate-600 dark:text-slate-400">
                          <div className="min-w-0 flex-1">
                            <div>ลงชื่อ ......................... ผู้รับมอบ</div>
                            <div className="text-[7.5px] font-semibold text-slate-700 dark:text-slate-300 mt-0.5 truncate">
                              ({cred.teacherName})
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div>../../2569</div>
                            <div className="text-[7.5px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[90px]">
                              {handoverIssuerText}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ปุ่มลัดสำหรับการทำงานหน้าจอ (ซ่อนตอนพิมพ์) */}
                      <div className="mt-1.5 pt-1 flex items-center justify-end gap-1 border-t border-slate-100 dark:border-slate-800 print:hidden">
                        <button
                          type="button"
                          onClick={() => handleCopySingleCredential(cred)}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[9px] font-medium text-slate-700 dark:text-slate-300 transition cursor-pointer"
                          title="คัดลอกข้อความสำหรับส่งให้อาจารย์ท่านนี้ทาง LINE หรือ Email"
                        >
                          <Copy className="w-2.5 h-2.5 text-slate-400" />
                          <span>คัดลอก</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePrintHandover(cred.email)}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-[9px] font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition cursor-pointer"
                          title="พิมพ์เฉพาะใบส่งมอบของอาจารย์ท่านนี้"
                        >
                          <Printer className="w-2.5 h-2.5 text-emerald-600" />
                          <span>พิมพ์ใบนี้</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredTeacherCredentials.length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-xs border border-dashed rounded-xl">
                    ไม่พบข้อมูลอาจารย์ที่ตรงกับคำค้นหา
                  </div>
                )}
              </div>
            ) : (
              /* โหมดที่ 2: ตารางสรุปภาพรวมทั้งหมด (Summary Table View) */
              <div>
                {/* หัวเอกสารทางการกรณีพิมพ์ในโหมดตาราง */}
                <div className="hidden print:block pb-3 mb-3 border-b-2 border-black text-center space-y-1">
                  <div className="font-bold text-base">มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย คณะพุทธศาสตร์</div>
                  <div className="text-sm font-semibold">บัญชีรายชื่ออาจารย์ผู้สอนและรหัสผ่านเริ่มต้น สำหรับเข้าสู่ระบบสารสนเทศ</div>
                  <div className="text-xs text-slate-600">ภาคการศึกษาที่ 2/2569 • เอกสารควบคุมภายใน • {handoverIssuerText}</div>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 print:border-black rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 print:bg-slate-100 border-b border-slate-200 dark:border-slate-800 print:border-black text-[11px] font-bold text-slate-600 dark:text-slate-400 print:text-black">
                        <th className="py-2.5 px-3 w-8 text-center">#</th>
                        <th className="py-2.5 px-3">อาจารย์ผู้สอน</th>
                        <th className="py-2.5 px-3">อีเมลเข้าสู่ระบบ (Username)</th>
                        <th className="py-2.5 px-3">รหัสผ่านเริ่มต้น</th>
                        <th className="py-2.5 px-3">วิชาที่สอน</th>
                        <th className="py-2.5 px-3">สถานะ</th>
                        <th className="py-2.5 px-3 text-right print:hidden">การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 print:divide-slate-300">
                      {filteredTeacherCredentials.map((cred: TeacherCredentialItem, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white print:text-black">
                            {cred.teacherName}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-indigo-600 dark:text-indigo-400 print:text-black font-medium">
                            {cred.email}
                          </td>
                          <td className="py-2.5 px-3">
                            {cred.initialPassword ? (
                              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 print:bg-transparent border border-amber-200 dark:border-amber-800/60 print:border-none font-mono font-bold text-amber-800 dark:text-amber-200 print:text-black text-xs">
                                <span>{cred.initialPassword}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(cred.initialPassword || "");
                                    toast.success(`คัดลอกรหัสผ่านของ ${cred.teacherName} แล้ว`);
                                  }}
                                  className="text-amber-600 dark:text-amber-400 hover:text-amber-800 ml-1 print:hidden"
                                  title="คัดลอกรหัสผ่าน"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">
                                มีบัญชีเดิมในระบบ
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 print:text-black font-mono text-[11px]">
                            {cred.courses?.join(", ") || "-"}
                          </td>
                          <td className="py-2.5 px-3">
                            {cred.isNew ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 print:bg-transparent text-emerald-700 dark:text-emerald-300 print:text-black font-medium text-[10px] border border-emerald-200 dark:border-emerald-800 print:border-none">
                                <ShieldCheck className="w-3 h-3 text-emerald-500 print:hidden" />
                                สร้างใหม่
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium text-[10px] print:bg-transparent print:text-black">
                                บัญชีเดิม
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right print:hidden">
                            <button
                              type="button"
                              onClick={() => handleCopySingleCredential(cred)}
                              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                              title="คัดลอกข้อมูลบัญชีอาจารย์ท่านนี้"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ส่วนท้ายลงชื่อกรณีพิมพ์ในโหมดตาราง */}
                <div className="hidden print:grid grid-cols-2 gap-8 pt-8 text-center text-xs">
                  <div>
                    <div>เจ้าหน้าที่ผู้ส่งมอบ: ....................................................</div>
                    <div className="mt-1">({handoverIssuerText})</div>
                    <div className="mt-1">วันที่ ...../...../2569</div>
                  </div>
                  <div>
                    <div>หัวหน้าฝ่ายบริการการศึกษา: ....................................................</div>
                    <div className="mt-1">(....................................................)</div>
                    <div className="mt-1">วันที่ ...../...../2569</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ข้อความแจ้งเตือนความปลอดภัย (ซ่อนตอนพิมพ์) */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1 print:hidden">
            <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>แนวปฏิบัติความปลอดภัยในการส่งมอบบัญชี:</span>
            </div>
            <ul className="list-disc pl-5 space-y-0.5 text-slate-500 dark:text-slate-400">
              <li>ท่านสามารถเลือก <b>"พิมพ์ใบตัดแจกรายบุคคล (4 ใบ/หน้า A4)"</b> แล้วตัดตามรอยปรุแจกอาจารย์แต่ละท่าน เพื่อรักษาความลับของรหัสผ่าน</li>
              <li>ระบบตั้งค่าให้อาจารย์ต้องเปลี่ยนรหัสผ่านทันทีในการเข้าสู่ระบบครั้งแรก (Must Change Password)</li>
              <li>ท่านสามารถคลิกปุ่ม <b>"ดาวน์โหลด CSV"</b> เพื่อนำข้อมูลไปส่งข้อความ SMS/LINE อัตโนมัติได้</li>
            </ul>
          </div>
        </LiyonDialogBody>

        <LiyonDialogFooter className="flex flex-wrap justify-between items-center gap-2 print:hidden">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportCredentialsCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
              title="ดาวน์โหลดข้อมูลบัญชีเป็นไฟล์ Excel / CSV"
            >
              <FileDown className="w-3.5 h-3.5 text-slate-500" />
              <span>ดาวน์โหลด CSV</span>
            </button>
            <button
              type="button"
              onClick={handleCopyAllCredentials}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
              title="คัดลอกข้อความสรุปทั้งหมดเพื่อส่งทางอีเมล"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedAll ? "คัดลอกแล้ว" : "คัดลอกข้อความทั้งหมด"}</span>
            </button>
            <button
              type="button"
              onClick={() => handlePrintHandover()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
              title="พิมพ์เอกสารออกทางเครื่องพิมพ์ หรือบันทึกเป็น PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์ใบส่งมอบ (Print / PDF)</span>
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsHandoverModalOpen(false);
              router.refresh();
            }}
            className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition shadow-sm"
          >
            เสร็จสิ้น / ปิดหน้าต่าง
          </button>
        </LiyonDialogFooter>
      </LiyonDialog>
    </div>
  );
}

