"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Edit2,
  Trash2,
  FileSpreadsheet,
  Users,
  CalendarCheck,
  Ban,
  GraduationCap,
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
  createSessionAction,
  updateSessionAction,
  deleteSessionAction,
  getCourseAttendanceMatrixAction,
} from "@/features/attendance/actions";
import { toast } from "sonner";

interface SessionItem {
  id: string;
  sessionNumber: number;
  date: Date | string;
  startTime?: string | null;
  endTime?: string | null;
  room?: string | null;
  topic?: string | null;
  description?: string | null;
  sessionType: string;
  status: string;
  isCounted: boolean;
  _count?: {
    records: number;
  };
}

interface SessionsClientProps {
  initialItems: any[];
  classObj: any;
  isSuperAdmin?: boolean;
}

export function SessionsClient({ initialItems, classObj, isSuperAdmin: _isSuperAdmin }: SessionsClientProps) {
  const [sessions, setSessions] = useState<SessionItem[]>(initialItems);

  // Modal: เพิ่มคาบเรียนใหม่
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    sessionNumber: (sessions.length > 0 ? Math.max(...sessions.map((s) => s.sessionNumber)) + 1 : 1),
    date: new Date().toISOString().split("T")[0],
    startTime: classObj.startTime || "09.00",
    endTime: classObj.endTime || "11.30",
    room: classObj.room || "",
    topic: "",
    sessionType: "REGULAR" as "REGULAR" | "SPECIAL",
    isCounted: true,
  });
  const [isAdding, setIsAdding] = useState(false);

  function handleOpenAdd() {
    const nextNum = sessions.length > 0 ? Math.max(...sessions.map((s) => s.sessionNumber)) + 1 : 1;
    setAddFormData({
      sessionNumber: nextNum,
      date: new Date().toISOString().split("T")[0],
      startTime: classObj.startTime || "09.00",
      endTime: classObj.endTime || "11.30",
      room: classObj.room || "",
      topic: "",
      sessionType: nextNum > (classObj.targetSessions || 16) ? "SPECIAL" : "REGULAR",
      isCounted: true,
    });
    setIsAddOpen(true);
  }

  // Modal: แก้ไขคาบเรียน
  const [editingSession, setEditingSession] = useState<SessionItem | null>(null);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Modal: ลบคาบเรียน
  const [deletingSession, setDeletingSession] = useState<SessionItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Matrix Export State
  const [isExportingMatrix, setIsExportingMatrix] = useState(false);

  async function handleExportMatrixCsv() {
    try {
      setIsExportingMatrix(true);
      const res = await getCourseAttendanceMatrixAction(classObj.id);
      if (!res.success) throw new Error("ไม่สามารถดึงข้อมูล Matrix ได้");

      const sessionsList = res.sessions || [];
      const matrix = res.matrix || [];

      const sessionHeaders = sessionsList.map(
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
        const sessionCells = sessionsList.map((s: any) => {
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
        `"ภาคการศึกษา: ${classObj.term} | อาจารย์ผู้สอน: ${classObj.primaryTeacher?.name || classObj.instructor?.name || "-"} | เกณฑ์สิทธิ์สอบ: ${(classObj.calculationRules as any)?.minPercent || 80}%"\n` +
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

  function handleStartEdit(session: SessionItem) {
    setEditingSession(session);
    setEditFormData({
      sessionNumber: session.sessionNumber,
      date: new Date(session.date).toISOString().split("T")[0],
      startTime: session.startTime || "",
      endTime: session.endTime || "",
      room: session.room || "",
      topic: session.topic || "",
      sessionType: session.sessionType,
      status: session.status,
      isCounted: session.isCounted,
    });
  }

  // บันทึกการเพิ่มคาบเรียน
  async function handleAddSession(e: React.FormEvent) {
    e.preventDefault();
    try {
      setIsAdding(true);
      const res = await createSessionAction({
        classId: classObj.id,
        sessionNumber: Number(addFormData.sessionNumber),
        date: new Date(addFormData.date),
        startTime: addFormData.startTime,
        endTime: addFormData.endTime,
        room: addFormData.room,
        topic: addFormData.topic || `คาบเรียนที่ ${addFormData.sessionNumber}`,
        sessionType: addFormData.sessionType,
        isCounted: addFormData.isCounted,
      });

      if (res.success && res.session) {
        toast.success(`เพิ่มคาบที่ ${addFormData.sessionNumber} เรียบร้อยแล้ว`);
        setSessions([...sessions, res.session as any].sort((a, b) => a.sessionNumber - b.sessionNumber));
        setIsAddOpen(false);
      }
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการเพิ่มคาบเรียน");
    } finally {
      setIsAdding(false);
    }
  }

  // ดำเนินการลบคาบเรียน
  async function handleDeleteSession() {
    if (!deletingSession) return;
    try {
      setIsDeleting(true);
      const res = await deleteSessionAction(classObj.id, deletingSession.id);
      if (res.success) {
        toast.success(`ลบคาบเรียนที่ ${deletingSession.sessionNumber} เรียบร้อยแล้ว`);
        setSessions(sessions.filter((s) => s.id !== deletingSession.id));
        setDeletingSession(null);
      }
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการลบคาบเรียน");
    } finally {
      setIsDeleting(false);
    }
  }

  // บันทึกการแก้ไขคาบ
  async function handleUpdateSession(e: React.FormEvent) {
    e.preventDefault();
    if (!editingSession) return;

    try {
      setIsUpdating(true);
      const res = await updateSessionAction(classObj.id, editingSession.id, {
        sessionNumber: Number(editFormData.sessionNumber),
        date: new Date(editFormData.date),
        startTime: editFormData.startTime,
        endTime: editFormData.endTime,
        room: editFormData.room,
        topic: editFormData.topic,
        sessionType: editFormData.sessionType,
        status: editFormData.status,
        isCounted: editFormData.isCounted,
      });

      if (res.success && res.session) {
        toast.success(`อัปเดตข้อมูลคาบที่ ${editFormData.sessionNumber} สำเร็จ`);
        setSessions(
          sessions
            .map((s) => (s.id === editingSession.id ? (res.session as any) : s))
            .sort((a, b) => a.sessionNumber - b.sessionNumber)
        );
        setEditingSession(null);
      }
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการแก้ไขคาบเรียน");
    } finally {
      setIsUpdating(false);
    }
  }

  // คำนวณภาพรวมคาบเรียน
  const completedCount = sessions.filter((s) => s.status === "COMPLETED").length;
  const scheduledCount = sessions.filter((s) => s.status === "SCHEDULED").length;
  const cancelledCount = sessions.filter((s) => s.status === "CANCELLED").length;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
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
            ตารางคาบเรียนและการเช็กชื่อ (Class Sessions)
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{classObj.courseName}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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

          <Link
            href="/curriculum/calendar"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 text-xs font-semibold shadow-2xs transition"
            title="ดูปฏิทินการศึกษาและกำหนดการสอบ"
          >
            <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            ปฏิทินการศึกษา
          </Link>

          <button
            type="button"
            onClick={handleExportMatrixCsv}
            disabled={isExportingMatrix}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 hover:bg-teal-100 text-xs font-semibold shadow-2xs transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            {isExportingMatrix ? "กำลังส่งออก..." : "สมุดบันทึก Matrix (16 คาบ)"}
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            เพิ่มคาบเรียน
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">คาบทั้งหมด</span>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{sessions.length}</p>
          </div>
          <CalendarCheck className="w-7 h-7 text-primary/70" />
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">สอนและเช็กชื่อแล้ว</span>
            <p className="text-xl font-extrabold text-emerald-600 mt-0.5">{completedCount}</p>
          </div>
          <CheckCircle2 className="w-7 h-7 text-emerald-500/70" />
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">คาบในอนาคต</span>
            <p className="text-xl font-extrabold text-amber-600 mt-0.5">{scheduledCount}</p>
          </div>
          <Clock className="w-7 h-7 text-amber-500/70" />
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">ยกเลิกคาบ</span>
            <p className="text-xl font-extrabold text-slate-400 mt-0.5">{cancelledCount}</p>
          </div>
          <Ban className="w-7 h-7 text-slate-400/70" />
        </div>
      </div>

      {/* Table of Sessions */}
      <LiyonCard className="overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 font-semibold uppercase">
              <tr>
                <th className="py-3 px-4 text-center">คาบที่</th>
                <th className="py-3 px-4">วันที่เรียน</th>
                <th className="py-3 px-4">เวลา / ห้องเรียน</th>
                <th className="py-3 px-4">หัวข้อการบรรยาย</th>
                <th className="py-3 px-4">ประเภทคาบ</th>
                <th className="py-3 px-4">สถานะ</th>
                <th className="py-3 px-4 text-center">การเช็กชื่อ</th>
                <th className="py-3 px-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sessions.map((item) => {
                const dateObj = new Date(item.date);
                const formattedDate = new Intl.DateTimeFormat("th-TH", {
                  dateStyle: "medium",
                }).format(dateObj);

                const isCompleted = item.status === "COMPLETED";
                const isCancelled = item.status === "CANCELLED";
                const recordCount = item._count?.records ?? 0;

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition ${
                      isCancelled ? "opacity-60 bg-slate-50/50" : ""
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs">
                        {item.sessionNumber}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{formattedDate}</div>
                      <div className="text-2xs text-slate-400">
                        {dateObj.toLocaleDateString("th-TH", { weekday: "long" })}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.startTime && item.endTime ? `${item.startTime} - ${item.endTime}` : "-"}</span>
                      </div>
                      {item.room && (
                        <div className="flex items-center gap-1 text-slate-400 text-2xs mt-0.5">
                          <MapPin className="w-3 h-3" />
                          <span>{item.room}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1">
                        {item.topic || `คาบเรียนที่ ${item.sessionNumber}`}
                      </div>
                      {!item.isCounted && (
                        <span className="text-2xs text-amber-600 font-medium">
                          *ไม่นำมาคำนวณสิทธิ์สอบ
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {item.sessionType === "SPECIAL" ? (
                        <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 font-semibold text-2xs">
                          คาบพิเศษ
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 text-2xs">
                          คาบปกติ
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {isCompleted ? (
                        <StatusPill tone="ok" className="text-2xs">
                          เช็กชื่อแล้ว
                        </StatusPill>
                      ) : isCancelled ? (
                        <StatusPill tone="bad" className="text-2xs">
                          ยกเลิกคาบ
                        </StatusPill>
                      ) : (
                        <StatusPill tone="warn" className="text-2xs">
                          รอเช็กชื่อ
                        </StatusPill>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Link
                        href={`/attendance/classes/${classObj.id}/sessions/${item.id}`}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-2xs ${
                          isCompleted
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white"
                            : isCancelled
                            ? "bg-slate-100 text-slate-400 pointer-events-none"
                            : "bg-primary text-white hover:bg-primary/90"
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {isCompleted ? `ดูผล (${recordCount})` : "เปิดเช็กชื่อ"}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 transition"
                          title="แก้ไขคาบเรียน"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingSession(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                          title="ลบคาบเรียน"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </LiyonCard>

      {/* Modal: เพิ่มคาบเรียน */}
      <LiyonDialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <LiyonDialogHeader
          title="เพิ่มคาบเรียน (Add Class Session)"
          description="กำหนดเลขคาบ วัน เวลา ห้องเรียน หัวข้อ และประเภทคาบเรียน"
        />
        <LiyonDialogCloseButton label="ปิด" />
        <form onSubmit={handleAddSession}>
          <LiyonDialogBody className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  เลขคาบที่ *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={addFormData.sessionNumber}
                  onChange={(e) => setAddFormData({ ...addFormData, sessionNumber: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ประเภทคาบเรียน
                </label>
                <select
                  value={addFormData.sessionType}
                  onChange={(e) => setAddFormData({ ...addFormData, sessionType: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                >
                  <option value="REGULAR">คาบปกติ (Regular Session)</option>
                  <option value="SPECIAL">คาบพิเศษ / สอนชดเชย (Special Session)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                วันที่เรียน *
              </label>
              <input
                type="date"
                required
                value={addFormData.date}
                onChange={(e) => setAddFormData({ ...addFormData, date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                หัวข้อการบรรยาย
              </label>
              <input
                type="text"
                placeholder="เช่น การบรรยายสัปดาห์ที่ 1 หรือ คาบสอนชดเชยวันหยุด"
                value={addFormData.topic}
                onChange={(e) => setAddFormData({ ...addFormData, topic: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  เวลาเริ่ม
                </label>
                <input
                  type="text"
                  value={addFormData.startTime}
                  onChange={(e) => setAddFormData({ ...addFormData, startTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  เวลาสิ้นสุด
                </label>
                <input
                  type="text"
                  value={addFormData.endTime}
                  onChange={(e) => setAddFormData({ ...addFormData, endTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ห้องเรียน
                </label>
                <input
                  type="text"
                  value={addFormData.room}
                  onChange={(e) => setAddFormData({ ...addFormData, room: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addFormData.isCounted}
                  onChange={(e) => setAddFormData({ ...addFormData, isCounted: e.target.checked })}
                  className="w-4 h-4 rounded text-primary focus:ring-primary/20"
                />
                <span>นำคาบนี้ไปคำนวณสิทธิ์สอบด้วย</span>
              </label>
            </div>
          </LiyonDialogBody>

          <LiyonDialogFooter className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isAdding}
              className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-50"
            >
              {isAdding ? "กำลังบันทึก..." : "บันทึกคาบเรียน"}
            </button>
          </LiyonDialogFooter>
        </form>
      </LiyonDialog>

      {/* Modal: แก้ไขคาบเรียน */}
      <LiyonDialog open={!!editingSession} onOpenChange={(open) => !open && setEditingSession(null)}>
        <LiyonDialogHeader
          title={`แก้ไขคาบเรียนที่ ${editingSession?.sessionNumber}`}
          description="สามารถปรับเปลี่ยน วัน เวลา ห้องเรียน หรือยกเลิกคาบเรียนได้"
        />
        <LiyonDialogCloseButton label="ปิด" />
        {editFormData && (
          <form onSubmit={handleUpdateSession}>
            <LiyonDialogBody className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    วันที่เรียน *
                  </label>
                  <input
                    type="date"
                    required
                    value={editFormData.date}
                    onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    สถานะคาบเรียน
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                  >
                    <option value="SCHEDULED">กำหนดการแล้ว (รอเช็กชื่อ)</option>
                    <option value="COMPLETED">จัดการเรียนการสอนแล้ว (เช็กชื่อแล้ว)</option>
                    <option value="CANCELLED">ยกเลิกคาบ (ไม่คิดเป็นตัวหาร)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  หัวข้อการบรรยาย
                </label>
                <input
                  type="text"
                  value={editFormData.topic}
                  onChange={(e) => setEditFormData({ ...editFormData, topic: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    เวลาเริ่ม
                  </label>
                  <input
                    type="text"
                    value={editFormData.startTime}
                    onChange={(e) => setEditFormData({ ...editFormData, startTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    เวลาสิ้นสุด
                  </label>
                  <input
                    type="text"
                    value={editFormData.endTime}
                    onChange={(e) => setEditFormData({ ...editFormData, endTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ห้องเรียน
                  </label>
                  <input
                    type="text"
                    value={editFormData.room}
                    onChange={(e) => setEditFormData({ ...editFormData, room: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editFormData.isCounted}
                    onChange={(e) => setEditFormData({ ...editFormData, isCounted: e.target.checked })}
                    className="w-4 h-4 rounded text-primary focus:ring-primary/20"
                  />
                  <span>คิดเวลาเรียนและสิทธิ์สอบในคาบนี้</span>
                </label>
              </div>
            </LiyonDialogBody>

            <LiyonDialogFooter className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingSession(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-50"
              >
                {isUpdating ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
              </button>
            </LiyonDialogFooter>
          </form>
        )}
      </LiyonDialog>

      {/* Modal: ยืนยันการลบคาบเรียน */}
      <LiyonDialog open={!!deletingSession} onOpenChange={(open) => !open && setDeletingSession(null)}>
        <LiyonDialogHeader
          title={`ยืนยันการลบคาบเรียนที่ ${deletingSession?.sessionNumber}`}
          description={classObj.courseName}
        />
        <LiyonDialogCloseButton label="ปิด" />
        <LiyonDialogBody className="space-y-3 text-sm">
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-900 dark:text-red-200 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-red-700 dark:text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span>คำเตือน: การลบคาบเรียนเป็นการดำเนินการถาวร</span>
            </div>
            <p>
              หากลบคาบเรียนนี้ ข้อมูลการเช็กชื่อของนิสิตในคาบนี้ (ถ้ามี) จะถูกลบออกจากฐานข้อมูล
              และสิทธิ์สอบจะถูกคำนวณใหม่โดยไม่รวมคาบนี้
            </p>
            {deletingSession && (
              <div className="pt-1 font-semibold text-slate-700 dark:text-slate-300">
                คาบที่ {deletingSession.sessionNumber}: วันที่{" "}
                {new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(deletingSession.date))}
                {deletingSession.topic ? ` (${deletingSession.topic})` : ""}
              </div>
            )}
          </div>
        </LiyonDialogBody>
        <LiyonDialogFooter className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setDeletingSession(null)}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleDeleteSession}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
          >
            {isDeleting ? "กำลังลบ..." : "ยืนยันการลบคาบเรียน"}
          </button>
        </LiyonDialogFooter>
      </LiyonDialog>
    </div>
  );
}
