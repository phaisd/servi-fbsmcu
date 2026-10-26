/* eslint-disable react-hooks/set-state-in-effect, @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useRef, useMemo, Fragment } from "react";
import QRCode from "qrcode";
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Save,
  ArrowLeft,
  Users,
  Search,
  Check,
  Calendar,
  MapPin,
  History,
  Lock,
  Unlock,
  ShieldCheck,
  AlertTriangle,
  QrCode,
  Hourglass,
  RefreshCw,
  Radio,
} from "lucide-react";
import {
  LiyonCard,
  LiyonDialog,
  LiyonDialogHeader,
  LiyonDialogBody,
  LiyonDialogFooter,
  LiyonDialogCloseButton,
} from "@/shared/components/liyon";
import Link from "next/link";
import {
  batchSaveAttendanceAction,
  lockSessionAction,
  unlockSessionAction,
} from "@/features/attendance/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type AttendanceStatusType = "PENDING" | "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

interface StudentRecordState {
  enrollmentId: string;
  studentCode: string;
  studentName: string;
  yearLevel: number;
  department?: string | null;
  major?: string | null;
  status: AttendanceStatusType;
  note: string;
}

function formatMajor(major?: string | null, department?: string | null) {
  let raw = (major || department || "-").trim();
  raw = raw
    .replace(/^สาขาวิชา\s*/, "")
    .replace(/^ภาควิชา\s*/, "")
    .trim();

  // แปลงชื่อสาขาภาษาอังกฤษให้มีภาษาไทยกำกับชัดเจน เพื่อให้อาจารย์และผู้ใช้งานเข้าใจตรงกัน
  if (raw.toLowerCase() === "buddhist studies" || raw.toLowerCase().includes("buddhist")) {
    return "พระพุทธศาสนา (Buddhist Studies)";
  }
  if (raw.toLowerCase() === "religion and philosophy" || raw.toLowerCase().includes("religion")) {
    return "ศาสนาและปรัชญา (Religion and Philosophy)";
  }
  return raw || "-";
}

interface SessionAuditLogItem {
  id: string;
  studentCode: string;
  studentName: string;
  oldStatus: string;
  newStatus: string;
  reason: string;
  actorName: string;
  createdAt: string | Date;
}

interface SessionDetailObj {
  id: string;
  courseId?: string;
  sessionNumber: number;
  date: string | Date;
  startTime?: string | null;
  endTime?: string | null;
  room?: string | null;
  topic?: string | null;
  sessionType: string;
  status: string;
  isCounted: boolean;
  isLocked?: boolean;
  lockedAt?: string | Date | null;
  lockedBy?: string | null;
  records?: Array<{
    studentCode: string;
    status: AttendanceStatusType;
    note?: string | null;
  }>;
  auditLogs?: SessionAuditLogItem[];
  classObj?: {
    id: string;
    courseCode: string;
    courseName: string;
    courseNameEn?: string | null;
    section?: string | null;
    term: string;
    room?: string | null;
    primaryTeacher?: { name?: string | null } | null;
    instructor?: { name?: string | null } | null;
  };
  course?: {
    id: string;
    courseCode: string;
    courseName: string;
    courseNameEn?: string | null;
    section?: string | null;
    term: string;
    room?: string | null;
    primaryTeacher?: { name?: string | null } | null;
    instructor?: { name?: string | null } | null;
  };
}

interface EnrollmentRowItem {
  id: string;
  student: {
    studentCode: string;
    firstName: string;
    lastName: string;
    title?: string | null;
    yearLevel: number;
    department?: string | null;
    major?: string | null;
  };
}

interface ScannedStudentRecord {
  studentCode: string;
  studentName?: string;
  status: AttendanceStatusType;
  note?: string | null;
  checkedInAt?: string | Date;
}

interface TakeAttendanceClientProps {
  sessionDetail: SessionDetailObj;
  enrollments: EnrollmentRowItem[];
  currentUserName: string;
}

export function TakeAttendanceClient({
  sessionDetail,
  enrollments,
  currentUserName,
}: TakeAttendanceClientProps) {
  const router = useRouter();
  const classObj = (sessionDetail.classObj || sessionDetail.course)!;

  // สร้าง Initial State โดยจับคู่กับ existing records
  const initialMap = new Map<string, { status: AttendanceStatusType; note: string }>();
  for (const r of sessionDetail.records || []) {
    initialMap.set(r.studentCode, { status: r.status, note: r.note || "" });
  }

  const initialRows: StudentRecordState[] = enrollments.map((enr) => {
    const st = enr.student;
    const existing = initialMap.get(st.studentCode);
    return {
      enrollmentId: enr.id,
      studentCode: st.studentCode,
      studentName: `${st.title || ""} ${st.firstName} ${st.lastName}`.trim(),
      yearLevel: st.yearLevel,
      department: st.department,
      major: st.major,
      status: existing ? existing.status : "PENDING", // Default เป็น "รอ" (PENDING) ค่าคงที่เริ่มต้นตามความต้องการของผู้ใช้
      note: existing ? existing.note : "",
    };
  });

  const [rows, setRows] = useState<StudentRecordState[]>(initialRows);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>("ALL");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // สถานะ Dynamic Rolling QR Code เช็กชื่อ
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [_qrToken, setQrToken] = useState("");
  const [_qrStep, setQrStep] = useState(0);
  const [qrExpiresIn, setQrExpiresIn] = useState(20);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [_scannedStudents, setScannedStudents] = useState<ScannedStudentRecord[]>([]);
  const [isLoadingQr, setIsLoadingQr] = useState(false);

  const isFetchingQrRef = useRef(false);
  const targetExpiryRef = useRef<number>(0);

  const fetchQrData = React.useCallback(async (isInitial = false) => {
    if (isFetchingQrRef.current) return;
    try {
      isFetchingQrRef.current = true;
      if (isInitial) setIsLoadingQr(true);

      const response = await fetch(`/api/attendance/sessions/${sessionDetail.id}/qr`, {
        cache: "no-store",
      });
      const data = await response.json();

      if (data.success && data.token) {
        setQrToken(data.token);
        setQrStep(data.step);
        const remaining = data.remainingSeconds || 20;
        setQrExpiresIn(remaining);
        targetExpiryRef.current = Date.now() + remaining * 1000;

        const checkInUrl = `${window.location.origin}/portal/attendance/scan?sessionId=${sessionDetail.id}&token=${data.token}&step=${data.step}`;

        const dataUrl = await QRCode.toDataURL(checkInUrl, {
          width: 380,
          margin: 2,
          color: {
            dark: "#0f172a",
            light: "#ffffff",
          },
        });
        setQrDataUrl(dataUrl);

        if (data.scanned?.records) {
          const scannedList = data.scanned.records as ScannedStudentRecord[];
          setScannedStudents(scannedList);

          // ซิงค์สถานะนิสิตที่เช็กชื่อเข้ามาในตารางทันที
          setRows((prev) =>
            prev.map((r) => {
              const match = scannedList.find((rec) => rec.studentCode === r.studentCode);
              if (match && match.status !== r.status) {
                return { ...r, status: match.status, note: match.note || r.note };
              }
              return r;
            })
          );
        }
      }
    } catch {
      // ละเว้นข้อผิดพลาดชั่วคราว
    } finally {
      isFetchingQrRef.current = false;
      if (isInitial) setIsLoadingQr(false);
    }
  }, [sessionDetail.id]);

  // Effect เมื่อเปิด QR Modal: สร้าง QR Code ครั้งแรกและตั้งเวลานับถอยหลัง
  useEffect(() => {
    let countdownTimer: NodeJS.Timeout;
    let pollTimer: NodeJS.Timeout;

    if (isQrModalOpen) {
      // โหลดครั้งแรก
      void fetchQrData(true);

      // นับถอยหลังทุก 1 วินาที (ทำงานนอก setState อย่างปลอดภัย)
      countdownTimer = setInterval(() => {
        const secLeft = Math.max(0, Math.ceil((targetExpiryRef.current - Date.now()) / 1000));
        setQrExpiresIn(secLeft);
        if (secLeft <= 0 && !isFetchingQrRef.current) {
          void fetchQrData(false);
        }
      }, 1000);

      // Realtime polling ดึงรายชื่อนิสิตที่เพิ่งสแกนทุก 3 วินาที
      pollTimer = setInterval(() => {
        if (!isFetchingQrRef.current) {
          void fetchQrData(false);
        }
      }, 3000);
    }

    return () => {
      clearInterval(countdownTimer);
      clearInterval(pollTimer);
    };
  }, [isQrModalOpen, fetchQrData]);

  // สถานะเกี่ยวกับการล็อคและ Audit Log
  const isLocked = sessionDetail.isLocked || false;
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [isAuditTrailOpen, setIsAuditTrailOpen] = useState(false);
  const [auditReason, setAuditReason] = useState("");
  const [unlockReason, setUnlockReason] = useState("");
  const [isProcessingLock, setIsProcessingLock] = useState(false);

  const auditLogs = sessionDetail.auditLogs || [];

  // เปลี่ยนสถานะรายบุคคล
  function handleStatusChange(studentCode: string, newStatus: AttendanceStatusType) {
    setRows((prev) =>
      prev.map((r) => (r.studentCode === studentCode ? { ...r, status: newStatus } : r))
    );
  }

  // เปลี่ยนหมายเหตุรายบุคคล
  function handleNoteChange(studentCode: string, newNote: string) {
    setRows((prev) =>
      prev.map((r) => (r.studentCode === studentCode ? { ...r, note: newNote } : r))
    );
  }

  // ตัวช่วย: ทำเครื่องหมายทุกคนเป็นสถานะเดียว
  function handleMarkAll(status: AttendanceStatusType) {
    setRows((prev) => prev.map((r) => ({ ...r, status })));
    const labelMap: Record<AttendanceStatusType, string> = {
      PENDING: "รอการเช็กชื่อ",
      PRESENT: "มาเรียน",
      LATE: "มาสาย",
      ABSENT: "ขาดเรียน",
      EXCUSED: "ลาที่อนุมัติ",
    };
    toast.success(`เปลี่ยนสถานะนิสิตทุกคนเป็น "${labelMap[status]}"`);
  }

  // สาขาวิชาทั้งหมดที่มีในรายวิชานี้ (สำหรับ Filter Tabs)
  const availableDepartments = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      set.add(formatMajor(r.major, r.department));
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "th"));
  }, [rows]);

  // ตัวช่วย: ทำเครื่องหมายเฉพาะกลุ่มสาขาวิชา
  function handleMarkGroup(majorName: string, status: AttendanceStatusType) {
    setRows((prev) =>
      prev.map((r) => {
        if (formatMajor(r.major, r.department) === majorName) {
          return { ...r, status };
        }
        return r;
      })
    );
    const labelMap: Record<AttendanceStatusType, string> = {
      PENDING: "รอการเช็กชื่อ",
      PRESENT: "มาเรียน",
      LATE: "มาสาย",
      ABSENT: "ขาดเรียน",
      EXCUSED: "ลาที่อนุมัติ",
    };
    toast.success(`เปลี่ยนสถานะกลุ่ม "${majorName}" เป็น "${labelMap[status]}"`);
  }

  // คำนวณยอดสรุป
  const pendingCount = rows.filter((r) => r.status === "PENDING").length;
  const presentCount = rows.filter((r) => r.status === "PRESENT").length;
  const lateCount = rows.filter((r) => r.status === "LATE").length;
  const absentCount = rows.filter((r) => r.status === "ABSENT").length;
  const excusedCount = rows.filter((r) => r.status === "EXCUSED").length;

  const filteredRows = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    const matched = rows.filter((r) => {
      const currentM = formatMajor(r.major, r.department);
      if (selectedDeptFilter !== "ALL" && currentM !== selectedDeptFilter) {
        return false;
      }
      if (!q) return true;
      return (
        r.studentCode.toLowerCase().includes(q) ||
        r.studentName.toLowerCase().includes(q) ||
        (r.department && r.department.toLowerCase().includes(q)) ||
        (r.major && r.major.toLowerCase().includes(q)) ||
        currentM.toLowerCase().includes(q)
      );
    });

    // จัดกลุ่มตามสาขาวิชา แล้วเรียงตามรหัสนิสิตภายในกลุ่ม
    return matched.sort((a, b) => {
      const majorA = formatMajor(a.major, a.department);
      const majorB = formatMajor(b.major, b.department);
      if (majorA !== majorB) {
        return majorA.localeCompare(majorB, "th");
      }
      return a.studentCode.localeCompare(b.studentCode);
    });
  }, [rows, searchTerm, selectedDeptFilter]);

  // บันทึกผลการเช็กชื่อทั้งชุด (Batch Save พร้อม Audit Log หากล็อคอยู่)
  async function handleSaveAttendance() {
    try {
      setIsSaving(true);
      if (isLocked && auditReason.trim().length < 3) {
        toast.error("กรุณาระบุเหตุผลความจำเป็นในการแก้ไขอย่างน้อย 3 ตัวอักษร");
        return;
      }

      const payload = {
        sessionId: sessionDetail.id,
        records: rows.map((r) => ({
          studentCode: r.studentCode,
          studentName: r.studentName,
          enrollmentId: r.enrollmentId,
          status: r.status,
          note: r.note.trim() || null,
        })),
        reason: isLocked ? auditReason.trim() : null,
      };

      const res = await batchSaveAttendanceAction(classObj.id, payload);
      if (res.success) {
        toast.success(
          isLocked
            ? "บันทึกการแก้ไขและบันทึกประวัติ Audit Log เรียบร้อยแล้ว"
            : "บันทึกการเช็กชื่อและอัปเดตสิทธิ์สอบเรียบร้อยแล้ว"
        );
        setIsConfirmOpen(false);
        setAuditReason("");
        router.refresh();
      }
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setIsSaving(false);
    }
  }

  // ยืนยันและปิดคาบเรียน (Lock Session)
  async function handleLockSession() {
    try {
      setIsProcessingLock(true);
      const res = await lockSessionAction(classObj.id, sessionDetail.id);
      if (res.success) {
        toast.success("ยืนยันและปิดคาบเรียนเรียบร้อยแล้ว");
        setIsLockModalOpen(false);
        router.refresh();
      }
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || "ไม่สามารถปิดคาบเรียนได้");
    } finally {
      setIsProcessingLock(false);
    }
  }

  // ปลดล็อคคาบเรียน (Unlock Session)
  async function handleUnlockSession() {
    if (unlockReason.trim().length < 3) {
      toast.error("กรุณาระบุเหตุผลในการปลดล็อคอย่างน้อย 3 ตัวอักษร");
      return;
    }
    try {
      setIsProcessingLock(true);
      const res = await unlockSessionAction(classObj.id, sessionDetail.id, unlockReason.trim());
      if (res.success) {
        toast.success("ปลดล็อคคาบเรียนเรียบร้อยแล้ว สามารถแก้ไขข้อมูลได้ตามปกติ");
        setIsUnlockModalOpen(false);
        setUnlockReason("");
        router.refresh();
      }
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || "ไม่สามารถปลดล็อคได้");
    } finally {
      setIsProcessingLock(false);
    }
  }

  const dateObj = new Date(sessionDetail.date);
  const formattedDate = new Intl.DateTimeFormat("th-TH", {
    dateStyle: "full",
  }).format(dateObj);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Breadcrumb & Session Info Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
              <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
                คาบที่ {sessionDetail.sessionNumber}
              </span>
              <span className="text-xs text-slate-400">ภาคการศึกษา {classObj.term}</span>
              {isLocked && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-xs border border-amber-300 dark:border-amber-800">
                  <Lock className="w-3 h-3" /> ปิดคาบเรียนแล้ว (Locked)
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              บันทึกเวลาเข้าเรียน (Take Attendance)
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {classObj.courseName} — {sessionDetail.topic || `หัวข้อคาบที่ ${sessionDetail.sessionNumber}`}
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1 font-medium">
                <Calendar className="w-3.5 h-3.5 text-primary" /> {formattedDate}
              </span>
              {sessionDetail.startTime && sessionDetail.endTime && (
                <span className="flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-amber-500" /> {sessionDetail.startTime} - {sessionDetail.endTime} น.
                </span>
              )}
              {sessionDetail.room && (
                <span className="flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> {sessionDetail.room}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {auditLogs.length > 0 && (
              <button
                type="button"
                onClick={() => setIsAuditTrailOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-2xs transition"
              >
                <History className="w-4 h-4 text-slate-500" />
                <span>ประวัติแก้ไข ({auditLogs.length})</span>
              </button>
            )}

            {!isLocked && (
              <button
                type="button"
                onClick={() => setIsQrModalOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100 transition shadow-2xs"
              >
                <QrCode className="w-4 h-4 text-indigo-600" />
                <span>📱 รหัส QR สแกนเข้าเรียน</span>
              </button>
            )}

            {!isLocked ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsLockModalOpen(true)}
                  disabled={rows.length === 0}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-bold hover:bg-amber-100 transition shadow-2xs"
                >
                  <Lock className="w-4 h-4" />
                  <span>ยืนยันและปิดคาบ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmOpen(true)}
                  disabled={rows.length === 0}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm shadow-md hover:shadow-lg transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>บันทึกผลการเช็กชื่อ</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmOpen(true)}
                disabled={rows.length === 0}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>ขอแก้ไขผลหลังปิดคาบ</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Locked Status Banner */}
      {isLocked && (
        <div className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  คาบเรียนนี้ได้รับการยืนยันและปิดผลเรียบร้อยแล้ว
                </h3>
                <span className="px-2 py-0.5 rounded-full text-2xs font-extrabold bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-100">
                  LOCKED
                </span>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                ปิดคาบเมื่อ:{" "}
                <span className="font-semibold">
                  {sessionDetail.lockedAt
                    ? new Intl.DateTimeFormat("th-TH", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(sessionDetail.lockedAt))
                    : "-"}
                </span>{" "}
                {sessionDetail.lockedBy && (
                  <span>
                    โดย <span className="font-semibold">{sessionDetail.lockedBy}</span>
                  </span>
                )}{" "}
                • การแก้ไขหลังจากนี้จะถูกบันทึกประวัติการเปลี่ยนแปลงพร้อมเหตุผลลงในระบบ Audit Trail
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={() => setIsUnlockModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-amber-800 dark:text-amber-300 text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 flex items-center gap-1.5 transition shadow-2xs"
            >
              <Unlock className="w-3.5 h-3.5" /> ปลดล็อคคาบเรียน
            </button>
          </div>
        </div>
      )}

      {/* KPI Counters & Batch Action Toolbar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-slate-100/80 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">รอเช็กชื่อ (Pending)</span>
            <Hourglass className="w-4 h-4 text-slate-500" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-2xl font-black text-slate-800 dark:text-slate-200">{pendingCount}</p>
            <button
              type="button"
              onClick={() => handleMarkAll("PENDING")}
              className="text-2xs text-slate-600 dark:text-slate-400 underline font-semibold hover:text-slate-900"
            >
              ตั้งทุกคนเป็นรอ
            </button>
          </div>
        </div>

        <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">มาเรียน (Present)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-200">{presentCount}</p>
            <button
              type="button"
              onClick={() => handleMarkAll("PRESENT")}
              className="text-2xs text-emerald-700 underline font-semibold hover:text-emerald-800"
            >
              ตั้งทุกคนเป็นมา
            </button>
          </div>
        </div>

        <div className="bg-amber-50/70 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300">มาสาย (Late)</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-200 mt-2">{lateCount}</p>
        </div>

        <div className="bg-red-50/70 dark:bg-red-950/30 p-4 rounded-xl border border-red-200 dark:border-red-900/60 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-800 dark:text-red-300">ขาดเรียน (Absent)</span>
            <XCircle className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-black text-red-700 dark:text-red-200 mt-2">{absentCount}</p>
        </div>

        <div className="bg-blue-50/70 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-800 dark:text-blue-300">ลาที่อนุมัติ (Excused)</span>
            <AlertCircle className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-700 dark:text-blue-200 mt-2">{excusedCount}</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาด้วยรหัสนิสิต ชื่อ-นามสกุล หรือสาขาวิชา..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium self-end sm:self-center">
            ผู้บันทึก: <span className="font-bold text-slate-800 dark:text-slate-200">{currentUserName}</span>
          </div>
        </div>

        {/* Tab แยกสาขาวิชา (กรณีวิชานี้มีมากกว่า 1 สาขาวิชา) */}
        {availableDepartments.length > 1 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-semibold text-slate-500">แสดงผล:</span>
            <button
              type="button"
              onClick={() => setSelectedDeptFilter("ALL")}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                selectedDeptFilter === "ALL"
                  ? "bg-primary text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              ทั้งหมด ({rows.length})
            </button>
            {availableDepartments.map((dept) => {
              const count = rows.filter((r) => formatMajor(r.major, r.department) === dept).length;
              const isSelected = selectedDeptFilter === dept;
              return (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setSelectedDeptFilter(dept)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                    isSelected
                      ? "bg-primary text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                >
                  {dept} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Roster Attendance Table */}
      <LiyonCard className="overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 font-semibold uppercase">
              <tr>
                <th className="py-3 px-4 text-center">ลำดับ</th>
                <th className="py-3 px-4">รหัสนิสิต</th>
                <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                <th className="py-3 px-4 text-center">สถานะการเข้าเรียน</th>
                <th className="py-3 px-4">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">
                      ไม่พบรายชื่อนิสิตในวิชานี้
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      กรุณาเพิ่มรายชื่อนิสิตในเมนู "จัดการรายชื่อนิสิต" ก่อนทำการเช็กชื่อ
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => {
                  const currentMajor = formatMajor(row.major, row.department);
                  const prevMajor =
                    idx > 0 ? formatMajor(filteredRows[idx - 1].major, filteredRows[idx - 1].department) : null;
                  const isNewGroup = idx === 0 || currentMajor !== prevMajor;
                  const groupCount = rows.filter(
                    (r) => formatMajor(r.major, r.department) === currentMajor
                  ).length;

                  return (
                    <React.Fragment key={row.studentCode}>
                      {isNewGroup && (
                        <tr className="bg-slate-100/90 dark:bg-slate-800/80 font-semibold text-xs text-slate-700 dark:text-slate-300">
                          <td colSpan={5} className="py-2.5 px-4 border-y border-slate-200 dark:border-slate-700">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 font-bold text-primary">
                                  <span>🏛️ สาขาวิชา: {currentMajor}</span>
                                </span>
                                <span className="text-[11px] text-slate-500 font-normal">
                                  ({groupCount} รูป/คน)
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleMarkGroup(currentMajor, "PRESENT")}
                                  className="px-2.5 py-1 rounded-lg text-2xs font-bold bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 transition shadow-2xs"
                                  title="ตั้งเฉพาะนิสิตกลุ่มนี้เป็นมาเรียน"
                                >
                                  ✓ ตั้งกลุ่มนี้เป็นมาเรียน
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMarkGroup(currentMajor, "PENDING")}
                                  className="px-2.5 py-1 rounded-lg text-2xs font-bold bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition shadow-2xs"
                                  title="ตั้งเฉพาะนิสิตกลุ่มนี้เป็นรอ"
                                >
                                  ⏱️ ตั้งกลุ่มนี้เป็นรอ
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      <tr
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                      >
                        <td className="py-3 px-4 text-center text-xs text-slate-400 font-medium">
                          {idx + 1}
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {row.studentCode}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900 dark:text-white">
                            {row.studentName}
                          </div>
                          <div className="text-2xs text-slate-400">
                            ชั้นปีที่ {row.yearLevel} • {currentMajor}
                          </div>
                        </td>

                        {/* Status Segmented Buttons */}
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-2xs gap-1">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(row.studentCode, "PENDING")}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                row.status === "PENDING"
                                  ? "bg-slate-700 text-white shadow-xs"
                                  : "text-slate-600 dark:text-slate-400 hover:text-slate-800"
                              }`}
                            >
                              <Hourglass className="w-3 h-3" /> รอ
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStatusChange(row.studentCode, "PRESENT")}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                row.status === "PRESENT"
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : "text-slate-600 dark:text-slate-400 hover:text-emerald-700"
                              }`}
                            >
                              <Check className="w-3 h-3" /> มา
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStatusChange(row.studentCode, "LATE")}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                row.status === "LATE"
                                  ? "bg-amber-500 text-white shadow-xs"
                                  : "text-slate-600 dark:text-slate-400 hover:text-amber-700"
                              }`}
                            >
                              <Clock className="w-3 h-3" /> สาย
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStatusChange(row.studentCode, "ABSENT")}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                row.status === "ABSENT"
                                  ? "bg-red-600 text-white shadow-xs"
                                  : "text-slate-600 dark:text-slate-400 hover:text-red-700"
                              }`}
                            >
                              <XCircle className="w-3 h-3" /> ขาด
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStatusChange(row.studentCode, "EXCUSED")}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                row.status === "EXCUSED"
                                  ? "bg-blue-600 text-white shadow-xs"
                                  : "text-slate-600 dark:text-slate-400 hover:text-blue-700"
                              }`}
                            >
                              <AlertCircle className="w-3 h-3" /> ลา
                            </button>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <input
                            type="text"
                            placeholder="หมายเหตุ เช่น ลาป่วย, มาสาย 20 นาที"
                            value={row.note}
                            onChange={(e) => handleNoteChange(row.studentCode, e.target.value)}
                            className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </LiyonCard>

      {/* Confirmation Dialog Before Batch Save */}
      <LiyonDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <LiyonDialogHeader
          title={isLocked ? "ขอแก้ไขผลการเข้าเรียน (Session Locked)" : "ยืนยันการบันทึกผลการเข้าเรียน"}
          description={`คาบที่ ${sessionDetail.sessionNumber}: วันที่ ${formattedDate}`}
        />
        <LiyonDialogCloseButton label="ปิด" />
        <LiyonDialogBody className="space-y-3 text-sm">
          {isLocked && (
            <div className="bg-amber-50 dark:bg-amber-950/40 p-3.5 rounded-xl border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>บันทึกความโปร่งใส (Audit Requirement)</span>
              </div>
              <p>
                คาบเรียนนี้ถูกปิดและล็อคแล้ว การเปลี่ยนแปลงสถานะนิสิตจะถูกบันทึกลงในตารางประวัติการตรวจสอบ (Audit Trail)
                พร้อมชื่อผู้แก้ไขและเวลาทันที
              </p>
              <div className="pt-2">
                <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                  เหตุผลความจำเป็นในการแก้ไข: <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={auditReason}
                  onChange={(e) => setAuditReason(e.target.value)}
                  placeholder="เช่น นิสิตนำใบรับรองแพทย์มายื่นย้อนหลัง, ปรับปรุงข้อมูลตามใบขอลาที่ได้รับอนุมัติ"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          )}

          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">จำนวนนิสิตทั้งหมด:</span>
              <span className="font-bold text-slate-900 dark:text-white">{rows.length} คน</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-semibold">รอการเช็กชื่อ:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{pendingCount} คน</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-emerald-600 font-semibold">มาเรียน:</span>
              <span className="font-bold text-emerald-700">{presentCount} คน</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-amber-600 font-semibold">มาสาย:</span>
              <span className="font-bold text-amber-700">{lateCount} คน</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-red-600 font-semibold">ขาดเรียน:</span>
              <span className="font-bold text-red-700">{absentCount} คน</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-blue-600 font-semibold">ลาที่อนุมัติ:</span>
              <span className="font-bold text-blue-700">{excusedCount} คน</span>
            </div>
          </div>

          <p className="text-2xs text-slate-400">
            *เมื่อบันทึกแล้ว ระบบจะคำนวณร้อยละการเข้าเรียนและปรับปรุงสิทธิ์สอบของนิสิตแต่ละคนโดยอัตโนมัติ
          </p>
        </LiyonDialogBody>
        <LiyonDialogFooter className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setIsConfirmOpen(false)}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={isSaving || (isLocked && auditReason.trim().length < 3)}
            onClick={handleSaveAttendance}
            className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 disabled:opacity-50"
          >
            {isSaving ? "กำลังบันทึก..." : isLocked ? "ยืนยันและบันทึกประวัติแก้ไข" : "ยืนยันการบันทึก"}
          </button>
        </LiyonDialogFooter>
      </LiyonDialog>

      {/* Lock Session Confirmation Dialog */}
      <LiyonDialog open={isLockModalOpen} onOpenChange={setIsLockModalOpen}>
        <LiyonDialogHeader
          title="ยืนยันการปิดคาบเรียน (Lock Session)"
          description={`คาบที่ ${sessionDetail.sessionNumber}: วันที่ ${formattedDate}`}
        />
        <LiyonDialogCloseButton label="ปิด" />
        <LiyonDialogBody className="space-y-3 text-sm">
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs space-y-2 text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2 font-bold">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>การปิดคาบเรียนเพื่อล็อคผลเวลาเรียนอย่างเป็นทางการ</span>
            </div>
            <p>
              เมื่อทำการปิดคาบเรียนแล้ว ข้อมูลการเช็กชื่อของคาบนี้จะถือเป็นผลทางการ หากมีความจำเป็นต้องแก้ไขในภายหลัง
              อาจารย์จะต้องระบุเหตุผลความจำเป็น และระบบจะบันทึกประวัติการแก้ไขลงใน Audit Trail เพื่อการตรวจสอบย้อนหลัง
            </p>
          </div>
          <div className="text-xs text-slate-500">
            ผู้ดำเนินการยืนยันปิดคาบ: <span className="font-bold text-slate-800 dark:text-slate-200">{currentUserName}</span>
          </div>
        </LiyonDialogBody>
        <LiyonDialogFooter className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setIsLockModalOpen(false)}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={isProcessingLock}
            onClick={handleLockSession}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold disabled:opacity-50"
          >
            {isProcessingLock ? "กำลังดำเนินการ..." : "ยืนยันและปิดคาบเรียน"}
          </button>
        </LiyonDialogFooter>
      </LiyonDialog>

      {/* Unlock Session Dialog */}
      <LiyonDialog open={isUnlockModalOpen} onOpenChange={setIsUnlockModalOpen}>
        <LiyonDialogHeader
          title="ปลดล็อคคาบเรียน (Unlock Session)"
          description={`คาบที่ ${sessionDetail.sessionNumber}: วันที่ ${formattedDate}`}
        />
        <LiyonDialogCloseButton label="ปิด" />
        <LiyonDialogBody className="space-y-3 text-sm">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            การปลดล็อคจะเปิดให้แก้ไขผลการเช็กชื่อได้สะดวกขึ้น กรุณาระบุเหตุผลในการปลดล็อค:
          </p>
          <textarea
            rows={3}
            value={unlockReason}
            onChange={(e) => setUnlockReason(e.target.value)}
            placeholder="ระบุเหตุผลในการปลดล็อค เช่น ต้องการตรวจทานข้อมูลใหม่เนื่องจากเอกสารตกหล่น"
            className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </LiyonDialogBody>
        <LiyonDialogFooter className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setIsUnlockModalOpen(false)}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={isProcessingLock || unlockReason.trim().length < 3}
            onClick={handleUnlockSession}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold disabled:opacity-50"
          >
            {isProcessingLock ? "กำลังปลดล็อค..." : "ยืนยันการปลดล็อค"}
          </button>
        </LiyonDialogFooter>
      </LiyonDialog>

      {/* Audit Trail History Dialog */}
      <LiyonDialog open={isAuditTrailOpen} onOpenChange={setIsAuditTrailOpen}>
        <LiyonDialogHeader
          title="ประวัติการแก้ไขผลการเข้าเรียน (Audit Trail Logs)"
          description={`ประวัติบันทึกการเปลี่ยนแปลงทั้งหมดในคาบที่ ${sessionDetail.sessionNumber}`}
        />
        <LiyonDialogCloseButton label="ปิด" />
        <LiyonDialogBody className="space-y-3 text-sm">
          {auditLogs.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <History className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              ยังไม่มีประวัติการแก้ไขผลการเข้าเรียนในคาบนี้
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto pr-1">
              {auditLogs.map((log: SessionAuditLogItem) => {
                const logDate = new Date(log.createdAt);
                const formattedLogDate = new Intl.DateTimeFormat("th-TH", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(logDate);

                const statusLabel: Record<string, { label: string; color: string }> = {
                  PRESENT: { label: "มาเรียน", color: "text-emerald-700 bg-emerald-100 dark:bg-emerald-950" },
                  LATE: { label: "มาสาย", color: "text-amber-700 bg-amber-100 dark:bg-amber-950" },
                  ABSENT: { label: "ขาดเรียน", color: "text-red-700 bg-red-100 dark:bg-red-950" },
                  EXCUSED: { label: "ลาที่อนุมัติ", color: "text-blue-700 bg-blue-100 dark:bg-blue-950" },
                };

                const oldSt = statusLabel[log.oldStatus] || { label: log.oldStatus, color: "text-slate-700 bg-slate-100" };
                const newSt = statusLabel[log.newStatus] || { label: log.newStatus, color: "text-slate-700 bg-slate-100" };

                return (
                  <div key={log.id} className="py-3 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {log.studentName} ({log.studentCode})
                      </span>
                      <span className="text-2xs text-slate-400">{formattedLogDate}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-md font-semibold text-2xs ${oldSt.color}`}>
                        {oldSt.label}
                      </span>
                      <span className="text-slate-400">→</span>
                      <span className={`px-2 py-0.5 rounded-md font-semibold text-2xs ${newSt.color}`}>
                        {newSt.label}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg text-slate-600 dark:text-slate-300 text-2xs mt-1 border border-slate-200 dark:border-slate-700">
                      <span className="font-semibold text-slate-500">เหตุผล: </span>
                      {log.reason}
                    </div>

                    <div className="text-2xs text-slate-400 flex justify-end">
                      ผู้แก้ไข: <span className="font-medium text-slate-600 dark:text-slate-300 ml-1">{log.actorName}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </LiyonDialogBody>
        <LiyonDialogFooter className="flex justify-end">
          <button
            type="button"
            onClick={() => setIsAuditTrailOpen(false)}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            ปิด
          </button>
        </LiyonDialogFooter>
      </LiyonDialog>

      {/* Dynamic Rolling QR Code Modal for Classroom Projection */}
      <LiyonDialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
        <LiyonDialogHeader
          title="📱 QR Code เช็กชื่อเข้าเรียนในชั้นเรียน (Dynamic Rolling QR)"
          description={`คาบที่ ${sessionDetail.sessionNumber}: ${classObj.courseCode} ${classObj.courseName}`}
        />
        <LiyonDialogCloseButton label="ปิดหน้าจอ" />
        <LiyonDialogBody className="space-y-4">
          <div className="bg-slate-900 text-white p-5 rounded-3xl flex flex-col items-center justify-center text-center relative overflow-hidden shadow-2xl border border-slate-800">
            {/* Header in QR Card */}
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-2xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse text-emerald-400" /> สตรีมมิ่งรหัสสด
              </span>
              <span className="text-2xs text-slate-400">
                สแกนด้วยกล้องมือถือ
              </span>
            </div>

            {/* QR Code Canvas/Image */}
            <div className="p-4 bg-white rounded-2xl shadow-2xl relative my-1">
              {isLoadingQr && !qrDataUrl ? (
                <div className="w-64 h-64 flex flex-col items-center justify-center text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary mb-2" />
                  <span className="text-xs font-semibold">กำลังสร้างรหัส QR...</span>
                </div>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Dynamic Attendance QR Code"
                  className="w-64 h-64 sm:w-72 sm:h-72 object-contain"
                />
              ) : null}
            </div>

            {/* Rolling Countdown Progress */}
            <div className="w-full max-w-xs mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-2xs font-bold text-slate-300">
                <span className="flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" /> รหัสจะเปลี่ยนในอีก
                </span>
                <span className="font-mono text-amber-400 text-xs font-black">
                  {qrExpiresIn} วินาที
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${(qrExpiresIn / 20) * 100}%` }}
                />
              </div>
              <p className="text-3xs text-slate-400 pt-1">
                *รหัสเปลี่ยนอัตโนมัติทุก 20 วินาที เพื่อป้องกันการแคปหน้าจอส่งต่อให้เพื่อนนอกห้อง
              </p>
            </div>
          </div>

          {/* Live Scanned Students Ticker */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary" />
                นิสิตที่เช็กชื่อแล้วในขณะนี้
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {rows.filter((r) => r.status === "PRESENT").length} / {rows.length} คน
              </span>
            </div>

            {/* List of checked in */}
            <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
              {rows.filter((r) => r.status === "PRESENT").length === 0 ? (
                <div className="py-4 text-center text-slate-400 text-xs">
                  ยังไม่มีนิสิตสแกนเช็กชื่อในคาบนี้ (เปิดหน้าจอนี้ไว้ให้นิสิตในห้องสแกน)
                </div>
              ) : (
                rows
                  .filter((r) => r.status === "PRESENT")
                  .map((st) => (
                    <div
                      key={st.studentCode}
                      className="py-1.5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {st.studentName}
                        </span>
                        <span className="text-2xs font-mono text-slate-400">
                          ({st.studentCode})
                        </span>
                      </div>
                      <span className="text-2xs text-slate-400">
                        {st.note || "มาเรียน"}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </LiyonDialogBody>
        <LiyonDialogFooter className="flex justify-between items-center">
          <div className="text-2xs text-slate-400">
            เมื่อนิสิตสแกนครบแล้ว สามารถปิดหน้าจอนี้เพื่อตรวจสอบหรือบันทึกได้ทันที
          </div>
          <button
            type="button"
            onClick={() => setIsQrModalOpen(false)}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-bold hover:opacity-90 transition shadow-xs"
          >
            ปิดหน้าจอ QR Code
          </button>
        </LiyonDialogFooter>
      </LiyonDialog>
    </div>
  );
}
