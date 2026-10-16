"use client";

import { useState } from "react";
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
  Filter,
  DownloadCloud,
  Copy,
  Printer,
  KeyRound,
  ShieldCheck,
  Check,
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
import {
  createClassAction,
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
  status: string;
  primaryTeacher?: { id: string; name: string; email: string } | null;
  instructor?: { name: string; email: string } | null;
  teachers?: Array<{ user: { name: string; email: string }; isPrimary: boolean }>;
  _count?: {
    enrollments: number;
    sessions: number;
  };
}

interface ClassesClientProps {
  initialItems: ClassItem[];
  isSuperAdmin?: boolean;
  currentUserId?: string;
}

const DAY_NAMES = ["", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์", "วันอาทิตย์"];

export function ClassesClient({ initialItems, isSuperAdmin, currentUserId: _currentUserId }: ClassesClientProps) {
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

  // Form State สำหรับสร้างวิชาใหม่
  const [formData, setFormData] = useState({
    courseCode: "",
    courseName: "",
    courseNameEn: "",
    credits: 3,
    term: "1/2569",
    academicYear: "2569",
    semester: 1,
    targetSessions: 16,
    room: "",
    dayOfWeek: 1,
    startTime: "09.00",
    endTime: "11.30",
    description: "",
  });

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
      const res = await createClassAction(formData);
      if (res.success && res.class) {
        toast.success("สร้างรายวิชาและกำหนด 16 คาบเรียนเรียบร้อยแล้ว");
        setItems([res.class as any, ...items]);
        setIsCreateOpen(false);
      }
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการสร้างรายวิชา");
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
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการปิดภาคการศึกษา");
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
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการเปิดใช้งาน");
    } finally {
      setIsProcessingAction(false);
    }
  }

  // Timetable Sync & Teacher Auto-Provisioning States
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isLoadingTimetables, setIsLoadingTimetables] = useState(false);
  const [timetables, setTimetables] = useState<any[]>([]);
  const [selectedTimetableId, setSelectedTimetableId] = useState("");
  const [selectedCourseCodes, setSelectedCourseCodes] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Handover Dialog States
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [syncResult, setSyncResult] = useState<any | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  async function handleOpenSyncModal() {
    setIsSyncModalOpen(true);
    setIsLoadingTimetables(true);
    try {
      const res = await getAvailableTimetablesForSyncAction();
      if (res.success && res.timetables) {
        setTimetables(res.timetables);
        if (res.timetables.length > 0) {
          const first = res.timetables[0];
          setSelectedTimetableId(first.id);
          setSelectedCourseCodes(first.courses.map((c: any) => c.courseCode));
        }
      }
    } catch (err: any) {
      toast.error(err.message || "ไม่สามารถดึงข้อมูลตารางเรียนได้");
    } finally {
      setIsLoadingTimetables(false);
    }
  }

  function handleSelectTimetable(timetableId: string) {
    setSelectedTimetableId(timetableId);
    const found = timetables.find((t) => t.id === timetableId);
    if (found) {
      setSelectedCourseCodes(found.courses.map((c: any) => c.courseCode));
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

  function handleToggleAllCourses(courses: any[]) {
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
        setSyncResult(res);
        setIsSyncModalOpen(false);
        setIsHandoverModalOpen(true);
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการนำเข้าตารางเรียน");
    } finally {
      setIsSyncing(false);
    }
  }

  function handleCopyAllCredentials() {
    if (!syncResult?.teacherCredentials) return;
    const textLines = [
      "==================================================",
      "ใบส่งมอบบัญชีอาจารย์ผู้สอน (Faculty of Buddhism)",
      `วันที่สร้าง: ${new Date().toLocaleDateString("th-TH")}`,
      "==================================================",
      "",
    ];

    syncResult.teacherCredentials.forEach((t: any, idx: number) => {
      textLines.push(`${idx + 1}. อาจารย์: ${t.teacherName}`);
      textLines.push(`   อีเมลเข้าสู่ระบบ: ${t.email}`);
      textLines.push(`   รหัสผ่านเริ่มต้น: ${t.initialPassword || "(มีบัญชีเดิมในระบบแล้ว)"}`);
      textLines.push(`   รายวิชาที่สอน: ${t.courses.join(", ")}`);
      textLines.push(`   สถานะ: ${t.isNew ? "สร้างบัญชีใหม่ (บังคับเปลี่ยนรหัสผ่าน)" : "บัญชีเดิม"}`);
      textLines.push("--------------------------------------------------");
    });

    navigator.clipboard.writeText(textLines.join("\n"));
    setCopiedAll(true);
    toast.success("คัดลอกข้อมูลบัญชีอาจารย์ทั้งหมดแล้ว");
    setTimeout(() => setCopiedAll(false), 3000);
  }

  function handlePrintHandover() {
    window.print();
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
        if (existing) {
          if (!existing.courses.includes(item.courseCode)) {
            existing.courses.push(item.courseCode);
          }
        } else {
          credsMap.set(email, {
            teacherName: teacher.name,
            email,
            initialPassword: "Teacher1234!",
            courses: [item.courseCode],
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

          {isSuperAdmin && (
            <button
              type="button"
              onClick={handleOpenAllTeacherHandover}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-medium text-sm shadow-xs transition"
              title="พิมพ์ใบส่งมอบบัญชีผู้ใช้และรหัสผ่านสำหรับอาจารย์ผู้สอนทั้งหมด"
            >
              <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>พิมพ์ใบส่งมอบบัญชีอาจารย์</span>
            </button>
          )}

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
            onChange={(e) => setSelectedStatus(e.target.value as any)}
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
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary transition line-clamp-2">
                    {item.courseName}
                  </h3>
                  {item.courseNameEn && (
                    <p className="text-xs text-slate-400 italic line-clamp-1 mt-0.5">{item.courseNameEn}</p>
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
                ชื่อรายวิชา (ภาษาอังกฤษ)
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
                  ภาคการศึกษา *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น 1/2569"
                  value={formData.term}
                  onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  วันเรียน
                </label>
                <select
                  value={formData.dayOfWeek}
                  onChange={(e) => setFormData({ ...formData, dayOfWeek: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ห้องเรียน
                </label>
                <input
                  type="text"
                  placeholder="เช่น B302, ห้องเรียน 1"
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                />
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
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
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
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
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
                      {cur.courses.map((c: any) => {
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
      <LiyonDialog open={isHandoverModalOpen} onOpenChange={(open) => setIsHandoverModalOpen(open)}>
        <LiyonDialogHeader
          title="ใบส่งมอบบัญชีอาจารย์ผู้สอน (Teacher Account Handover)"
          description="ระบบได้สร้างรายวิชา กำหนด 16 คาบเรียน และสร้างบัญชีอาจารย์ผู้สอนอัตโนมัติเรียบร้อยแล้ว"
        />
        <LiyonDialogCloseButton label="ปิด" />
        <LiyonDialogBody className="space-y-4 max-h-[75vh] overflow-y-auto print:max-h-none print:overflow-visible">
          {/* สรุปผลการนำเข้า */}
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <div className="text-xs space-y-1">
              <div className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">
                นำเข้ารายวิชาสำเร็จ {syncResult?.importedCount || 0} วิชา
                {syncResult?.skippedCount > 0 && ` (ข้ามวิชาที่ซ้ำ ${syncResult.skippedCount} วิชา)`}
              </div>
              <p className="text-emerald-700 dark:text-emerald-300">
                ระบบได้สร้างคาบเรียน 16 คาบเรียนต่อรายวิชา และสร้างรหัสผ่านเริ่มต้นเฉพาะบุคคลสำหรับอาจารย์ผู้สอนเรียบร้อยแล้ว
              </p>
            </div>
          </div>

          {/* ตารางข้อมูลบัญชีอาจารย์ */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <KeyRound className="w-4 h-4 text-primary" />
                <span>รายการบัญชีผู้ใช้และรหัสผ่านเริ่มต้นของอาจารย์ผู้สอน</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                ทั้งหมด {syncResult?.teacherCredentials?.length || 0} บัญชี
              </span>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    <th className="py-2.5 px-3">อาจารย์ผู้สอน</th>
                    <th className="py-2.5 px-3">อีเมลเข้าสู่ระบบ</th>
                    <th className="py-2.5 px-3">รหัสผ่านเริ่มต้น</th>
                    <th className="py-2.5 px-3">วิชาที่สอน</th>
                    <th className="py-2.5 px-3">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {syncResult?.teacherCredentials?.map((cred: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                        {cred.teacherName}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                        {cred.email}
                      </td>
                      <td className="py-3 px-3">
                        {cred.initialPassword ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 font-mono font-bold text-amber-800 dark:text-amber-200 text-xs">
                            <span>{cred.initialPassword}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(cred.initialPassword);
                                toast.success(`คัดลอกรหัสผ่านของ ${cred.teacherName} แล้ว`);
                              }}
                              className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 ml-1"
                              title="คัดลอกรหัสผ่าน"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">
                            มีบัญชีเดิมในระบบแล้ว
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                        {cred.courses?.join(", ") || "-"}
                      </td>
                      <td className="py-3 px-3">
                        {cred.isNew ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium text-[10px] border border-emerald-200 dark:border-emerald-800">
                            <ShieldCheck className="w-3 h-3 text-emerald-500" />
                            สร้างใหม่ (บังคับเปลี่ยนรหัส)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium text-[10px]">
                            บัญชีเดิม
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ข้อความแจ้งเตือนความปลอดภัย */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
            <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>แนวปฏิบัติความปลอดภัยในการส่งมอบบัญชี:</span>
            </div>
            <ul className="list-disc pl-5 space-y-0.5 text-slate-500 dark:text-slate-400">
              <li>รหัสผ่านเริ่มต้นถูกสร้างแบบสุ่มเฉพาะบุคคล กรุณาส่งมอบข้อมูลให้อาจารย์เฉพาะท่าน</li>
              <li>ระบบตั้งค่าให้อาจารย์ต้องเปลี่ยนรหัสผ่านทันทีในการเข้าสู่ระบบครั้งแรก (Must Change Password)</li>
              <li>ท่านสามารถกดปุ่ม "คัดลอกข้อมูลทั้งหมด" เพื่อนำไปส่งทางอีเมลหรือข้อความ หรือกด "พิมพ์ใบส่งมอบ" เพื่อพิมพ์แจกจ่าย</li>
            </ul>
          </div>
        </LiyonDialogBody>
        <LiyonDialogFooter className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyAllCredentials}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedAll ? "คัดลอกเรียบร้อยแล้ว" : "คัดลอกข้อมูลทั้งหมด"}</span>
            </button>
            <button
              type="button"
              onClick={handlePrintHandover}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>พิมพ์ใบส่งมอบ</span>
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

