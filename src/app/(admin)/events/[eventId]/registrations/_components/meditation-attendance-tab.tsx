"use client";

import React, { useState, useMemo, useTransition } from "react";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  HeartPulse,
  Printer,
  Plus,
  Edit2,
  Trash2,
  Search,
  Check,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  LiyonDialog,
  LiyonDialogBody,
  LiyonDialogFooter,
  LiyonDialogTitle,
  LiyonDialogDescription,
} from "@/shared/components/liyon";
import {
  updateMeditationAttendanceAction,
  batchUpdateMeditationAttendanceAction,
  updateAttendeeGroupAction,
  addIndividualAttendeeAction,
  removeAttendeeFromEventAction,
} from "@/features/events/actions";
import type {
  MeditationConfig,
  MeditationAttendanceStatus,
  DailyAttendanceMap,
  DayAttendanceRecord,
} from "@/features/events/meditation-types";
import { MeditationRosterDocument } from "./meditation-roster-document";

export interface AttendeeItem {
  id: string;
  studentCode: string;
  studentName: string;
  role: string;
  major?: string | null;
  yearLevel?: number | null;
  department?: string | null;
  status: string;
  groupNumber?: number | null;
  groupName?: string | null;
  program?: string | null;
  dailyAttendance?: DailyAttendanceMap | null;
  remarks?: string | null;
}

interface EventData {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startDate: string | Date;
  endDate: string | Date;
  academicYear?: string | null;
  activityHours?: number;
  meditationConfig?: MeditationConfig | null;
}

interface Props {
  event: EventData;
  attendees: AttendeeItem[];
  onRefresh?: () => void;
}

export function MeditationAttendanceTab({ event, attendees, onRefresh: _onRefresh }: Props) {
  const [_isPending, startTransition] = useTransition();

  // Local state for attendees (for instant UI feedback)
  const [items, setItems] = useState<AttendeeItem[]>(attendees);

  // Filters
  const [selectedDayKey, setSelectedDayKey] = useState<string>("day_1");
  const [selectedProgram, setSelectedProgram] = useState<"ALL" | "THAI" | "ENGLISH">("ALL");
  const [selectedGroup, setSelectedGroup] = useState<number | "ALL">("ALL");
  const [search, setSearch] = useState("");

  // Modals
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [_isGroupModalOpen, _setIsGroupModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<AttendeeItem | null>(null);

  // New Student Form State
  const [studentForm, setStudentForm] = useState({
    studentCode: "",
    studentName: "",
    major: "พุทธศาสน์",
    groupNumber: 1,
    program: "THAI" as "THAI" | "ENGLISH",
    yearLevel: 1,
  });

  const config: MeditationConfig = event.meditationConfig || {
    isMeditationEvent: true,
    daysCount: 12,
    startDate: "2025-12-11",
    endDate: "2025-12-22",
    locationTh: "ณ อาคารปฏิบัติธรรมโพธิญาณมหาวิชชาลัย ต.ศาลายา อ.พุทธมณฑล จ.นครปฐม",
    locationEn: "AT Bodhiyanmahavijjalai, Nakhon Pathom",
    periods: [
      { id: "p1", nameTh: "ภาคเช้ามืด", nameEn: "Dawn Period", time: "04.00-04.30" },
      { id: "p2", nameTh: "ภาคเช้า", nameEn: "Morning Period", time: "08.00-08.30" },
      { id: "p3", nameTh: "ภาคบ่าย", nameEn: "Afternoon Period", time: "12.30-13.00" },
      { id: "p4", nameTh: "ภาคค่ำ", nameEn: "Evening Period", time: "17.30-18.00" },
    ],
    groups: [],
    rulesTh: [
      "นิสิตจะต้องลงชื่อตามช่วงเวลาที่กำหนดให้ข้างต้นนี้ หากไม่ลงชื่อตามช่วงเวลาที่กำหนด ถือว่าขาดในช่วงระยะเวลานั้น ๆ",
      "หากขาด ๔ ช่วงเวลา เท่ากับว่าขาด ๑ วัน และถือว่าไม่ผ่านการปฏิบัติ",
    ],
    rulesEn: [
      "Please sign–in during the scheduled times above. Or you will not get credit for your ATTANDANCE !",
      "In order to get one full-day credit, you must sign in for 4 periods which can be done in different days.",
    ],
  };

  // Distinct groups list
  const availableGroups = useMemo(() => {
    const map = new Map<number, { groupNumber: number; program: string; name: string }>();
    items.forEach((a) => {
      const gNum = a.groupNumber || (a.program === "ENGLISH" ? 12 : 1);
      if (!map.has(gNum)) {
        map.set(gNum, {
          groupNumber: gNum,
          program: a.program || (gNum >= 10 ? "ENGLISH" : "THAI"),
          name: a.groupName || (a.program === "ENGLISH" ? `Group ${gNum}` : `กลุ่มที่ ${gNum}`),
        });
      }
    });
    // Ensure default groups 1, 2, 3, 12 appear
    [1, 2, 3, 12].forEach((gNum) => {
      if (!map.has(gNum)) {
        map.set(gNum, {
          groupNumber: gNum,
          program: gNum === 12 ? "ENGLISH" : "THAI",
          name: gNum === 12 ? "Group : 12" : `กลุ่มที่ : ${gNum}`,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.groupNumber - b.groupNumber);
  }, [items]);

  // Filtered attendees for the grid
  const filteredAttendees = useMemo(() => {
    return items.filter((a) => {
      if (selectedProgram !== "ALL" && (a.program || "THAI") !== selectedProgram) return false;
      const gNum = a.groupNumber || (a.program === "ENGLISH" ? 12 : 1);
      if (selectedGroup !== "ALL" && gNum !== selectedGroup) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const code = (a.studentCode || "").toLowerCase();
        const name = (a.studentName || "").toLowerCase();
        const major = (a.major || "").toLowerCase();
        if (!code.includes(q) && !name.includes(q) && !major.includes(q)) return false;
      }
      return true;
    });
  }, [items, selectedProgram, selectedGroup, search]);

  // Compute daily stats for current dayKey & current filtered list
  const currentDayStats = useMemo(() => {
    let present = 0;
    let late = 0;
    let absent = 0;
    let leave = 0;
    const totalSlots = filteredAttendees.length * 4;

    filteredAttendees.forEach((a) => {
      const dayData = a.dailyAttendance?.[selectedDayKey] || {};
      ["p1", "p2", "p3", "p4"].forEach((pId) => {
        const item = dayData[pId];
        if (item?.status === "PRESENT") present++;
        else if (item?.status === "LATE") late++;
        else if (item?.status === "ABSENT") absent++;
        else if (item?.status === "LEAVE") leave++;
      });
    });

    const recorded = present + late + absent + leave;
    return {
      present,
      late,
      absent,
      leave,
      recorded,
      totalSlots,
      percentage: totalSlots > 0 ? Math.round((present / totalSlots) * 100) : 0,
    };
  }, [filteredAttendees, selectedDayKey]);

  // Toggle or cycle status: PRESENT -> LATE -> ABSENT -> LEAVE -> CLEAR
  const handleToggleStatus = (attendeeId: string, periodId: string) => {
    const attendee = items.find((a) => a.id === attendeeId);
    if (!attendee) return;

    const currentStatus = attendee.dailyAttendance?.[selectedDayKey]?.[periodId]?.status;
    let nextStatus: MeditationAttendanceStatus | "CLEAR";

    if (!currentStatus) nextStatus = "PRESENT";
    else if (currentStatus === "PRESENT") nextStatus = "LATE";
    else if (currentStatus === "LATE") nextStatus = "ABSENT";
    else if (currentStatus === "ABSENT") nextStatus = "LEAVE";
    else nextStatus = "CLEAR";

    // Optimistic UI update
    setItems((prev) =>
      prev.map((a) => {
        if (a.id !== attendeeId) return a;
        const daily = { ...(a.dailyAttendance || {}) };
        const dayRecord = { ...(daily[selectedDayKey] || {}) };
        if (nextStatus === "CLEAR") {
          delete dayRecord[periodId];
        } else {
          dayRecord[periodId] = {
            status: nextStatus,
            updatedAt: new Date().toISOString(),
          };
        }
        return {
          ...a,
          dailyAttendance: {
            ...daily,
            [selectedDayKey]: dayRecord,
          },
        };
      })
    );

    // Call server action
    startTransition(async () => {
      try {
        await updateMeditationAttendanceAction(
          event.id,
          attendeeId,
          selectedDayKey,
          periodId,
          nextStatus
        );
      } catch (err: unknown) {
        toast.error("บันทึกไม่สำเร็จ: " + (err instanceof Error ? err.message : String(err)));
      }
    });
  };

  // Quick action: Mark all filtered students as PRESENT for all 4 periods
  const handleMarkAllPresent = () => {
    if (filteredAttendees.length === 0) return;

    const updates: Array<{
      attendeeId: string;
      dayKey: string;
      periodId: string;
      status: "PRESENT";
    }> = [];

    const updatedMap = new Map<string, DailyAttendanceMap>();

    filteredAttendees.forEach((a) => {
      const daily = { ...(a.dailyAttendance || {}) };
      const dayRecord = { ...(daily[selectedDayKey] || {}) };
      ["p1", "p2", "p3", "p4"].forEach((pId) => {
        dayRecord[pId] = { status: "PRESENT", updatedAt: new Date().toISOString() };
        updates.push({
          attendeeId: a.id,
          dayKey: selectedDayKey,
          periodId: pId,
          status: "PRESENT",
        });
      });
      updatedMap.set(a.id, {
        ...daily,
        [selectedDayKey]: dayRecord,
      });
    });

    // Optimistic UI update
    setItems((prev) =>
      prev.map((a) => {
        if (updatedMap.has(a.id)) {
          return { ...a, dailyAttendance: updatedMap.get(a.id) };
        }
        return a;
      })
    );

    toast.success(`เช็คมาครบทุกช่วงเวลา (${updates.length / 4} รูป/คน) เรียบร้อย`);

    startTransition(async () => {
      try {
        await batchUpdateMeditationAttendanceAction(event.id, updates);
      } catch (err: unknown) {
        toast.error("บันทึกไม่สำเร็จ: " + (err instanceof Error ? err.message : String(err)));
      }
    });
  };

  // Add new student
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.studentCode || !studentForm.studentName) {
      toast.error("กรุณากรอกรหัสนิสิตและชื่อ-ฉายา");
      return;
    }

    try {
      const groupName =
        studentForm.program === "ENGLISH"
          ? `Group : ${studentForm.groupNumber}`
          : `กลุ่มที่ : ${studentForm.groupNumber}`;

      if (editingStudent) {
        await updateAttendeeGroupAction(event.id, editingStudent.id, {
          studentCode: studentForm.studentCode,
          studentName: studentForm.studentName,
          major: studentForm.major,
          groupNumber: Number(studentForm.groupNumber),
          groupName,
          program: studentForm.program,
        });

        setItems((prev) =>
          prev.map((a) =>
            a.id === editingStudent.id
              ? {
                  ...a,
                  studentCode: studentForm.studentCode,
                  studentName: studentForm.studentName,
                  major: studentForm.major,
                  groupNumber: Number(studentForm.groupNumber),
                  groupName,
                  program: studentForm.program,
                }
              : a
          )
        );
        toast.success("แก้ไขข้อมูลนิสิตสำเร็จ");
      } else {
        const res = await addIndividualAttendeeAction(
          event.id,
          studentForm.studentCode,
          "STUDENT",
          { name: studentForm.studentName, department: studentForm.major }
        );

        if (res.registration?.id) {
          await updateAttendeeGroupAction(event.id, res.registration.id, {
            groupNumber: Number(studentForm.groupNumber),
            groupName,
            program: studentForm.program,
          });

          setItems((prev) => [
            ...prev,
            {
              id: res.registration.id,
              studentCode: studentForm.studentCode,
              studentName: studentForm.studentName,
              role: "STUDENT",
              major: studentForm.major,
              yearLevel: studentForm.yearLevel,
              status: "ATTENDED",
              groupNumber: Number(studentForm.groupNumber),
              groupName,
              program: studentForm.program,
              dailyAttendance: {},
            },
          ]);
        }
        toast.success("เพิ่มนิสิตเข้าร่วมโครงการสำเร็จ");
      }

      setIsAddStudentOpen(false);
      setEditingStudent(null);
    } catch (err: unknown) {
      toast.error("บันทึกข้อมูลไม่สำเร็จ: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Delete attendee
  const handleDeleteAttendee = async (attendeeId: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรายชื่อนี้ออกจากโครงการ?")) return;
    try {
      await removeAttendeeFromEventAction(event.id, attendeeId);
      setItems((prev) => prev.filter((a) => a.id !== attendeeId));
      toast.success("ลบรายชื่อสำเร็จ");
    } catch (err: unknown) {
      toast.error("ลบไม่สำเร็จ: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Day number and calendar date string
  const currentDayNum = parseInt(selectedDayKey.replace("day_", ""), 10) || 1;
  const currentCalDate = 10 + currentDayNum; // 11 to 22 Dec 2025

  return (
    <div className="space-y-6">
      {/* ============================================================== */}
      {/* 1. TOP STATS & ACTIONS BANNER                                  */}
      {/* ============================================================== */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 rounded-2xl border border-amber-200 dark:border-amber-900/50 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-600 text-white shadow-xs">
                วิปัสสนากัมมัฏฐานประจำปี
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                ระยะเวลา {config.daysCount || 12} วัน (11 - 22 ธ.ค. 2568)
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                4 ช่วงเวลา/วัน
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              ระบบเช็คชื่อและบันทึกเวลาปฏิบัติธรรม 12 วัน (2 หลักสูตร ไทย-อังกฤษ)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {config.locationTh || "ณ อาคารปฏิบัติธรรมโพธิญาณมหาวิชชาลัย ต.ศาลายา อ.พุทธมณฑล จ.นครปฐม"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setIsPrintModalOpen(true)}
              className="gap-2 bg-amber-600 hover:bg-amber-700 text-white shadow-xs text-xs"
            >
              <Printer className="w-4 h-4" /> พิมพ์ใบเช็คชื่อทางการ (A4)
            </Button>

            <Button
              variant="outline"
              onClick={() => setIsSummaryModalOpen(true)}
              className="gap-2 text-xs border-slate-300 dark:border-slate-700"
            >
              <Award className="w-4 h-4 text-amber-600" /> สรุปผล 12 วัน & ตรวจเกณฑ์ผ่าน
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setEditingStudent(null);
                setStudentForm({
                  studentCode: "",
                  studentName: "",
                  major: "พุทธศาสน์",
                  groupNumber: selectedGroup !== "ALL" ? selectedGroup : 1,
                  program: selectedProgram !== "ALL" ? selectedProgram : "THAI",
                  yearLevel: 1,
                });
                setIsAddStudentOpen(true);
              }}
              className="gap-2 text-xs border-slate-300 dark:border-slate-700"
            >
              <Plus className="w-4 h-4 text-emerald-600" /> เพิ่มรายชื่อนิสิต
            </Button>
          </div>
        </div>

        {/* Daily Stats Counter Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5 pt-4 border-t border-amber-200/60 dark:border-amber-900/40 text-xs">
          <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 block text-2xs">นิสิตในตัวกรองนี้</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              {filteredAttendees.length}{" "}
              <span className="text-xs font-normal text-slate-500">รูป/คน</span>
            </span>
          </div>

          <div className="bg-emerald-50/80 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200/50 dark:border-emerald-800/40">
            <span className="text-emerald-700 dark:text-emerald-300 block text-2xs font-semibold">
              ✔ มา (ช่วงเวลา)
            </span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {currentDayStats.present}
            </span>
          </div>

          <div className="bg-amber-50/80 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200/50 dark:border-amber-800/40">
            <span className="text-amber-700 dark:text-amber-300 block text-2xs font-semibold">
              ⏱ สาย (ช่วงเวลา)
            </span>
            <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
              {currentDayStats.late}
            </span>
          </div>

          <div className="bg-rose-50/80 dark:bg-rose-950/30 p-3 rounded-xl border border-rose-200/50 dark:border-rose-800/40">
            <span className="text-rose-700 dark:text-rose-300 block text-2xs font-semibold">
              ✖ ขาด (ช่วงเวลา)
            </span>
            <span className="text-lg font-bold text-rose-600 dark:text-rose-400">
              {currentDayStats.absent}
            </span>
          </div>

          <div className="bg-purple-50/80 dark:bg-purple-950/30 p-3 rounded-xl border border-purple-200/50 dark:border-purple-800/40">
            <span className="text-purple-700 dark:text-purple-300 block text-2xs font-semibold">
              🏥 ป่วย/ลา (ช่วงเวลา)
            </span>
            <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {currentDayStats.leave}
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. DAY SELECTOR TABS (12 DAYS)                                 */}
      {/* ============================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 shadow-xs">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Calendar className="w-4 h-4 text-amber-600" />
            <span>เลือกวันที่ตรวจเช็ค (12 วันตลอดโครงการ):</span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            กำลังตรวจ: วันที่ {currentDayNum} ({currentCalDate} ธ.ค. 2568)
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1.5">
          {Array.from({ length: config.daysCount || 12 }).map((_, i) => {
            const dayKey = `day_${i + 1}`;
            const isSelected = selectedDayKey === dayKey;
            const dateNum = 11 + i;

            return (
              <button
                key={dayKey}
                type="button"
                onClick={() => setSelectedDayKey(dayKey)}
                className={`py-2 px-1 rounded-xl text-center transition-all cursor-pointer border ${
                  isSelected
                    ? "bg-amber-600 text-white border-amber-600 font-bold shadow-md scale-102"
                    : "bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="text-[10px] opacity-80 leading-tight">วันที่ {i + 1}</div>
                <div className="text-sm font-extrabold leading-none mt-0.5">{dateNum}</div>
                <div className="text-[9px] opacity-75 leading-tight">ธ.ค.</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. TOOLBAR (Program Filter, Group Filter, Search, Quick Mark) */}
      {/* ============================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Program Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setSelectedProgram("ALL")}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                selectedProgram === "ALL"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              ทุกหลักสูตร
            </button>
            <button
              type="button"
              onClick={() => setSelectedProgram("THAI")}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                selectedProgram === "THAI"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              หลักสูตรภาษาไทย (Thai)
            </button>
            <button
              type="button"
              onClick={() => setSelectedProgram("ENGLISH")}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                selectedProgram === "ENGLISH"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              English Program (Inter)
            </button>
          </div>

          {/* Group Filter */}
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
          >
            <option value="ALL">ทุกกลุ่ม ({availableGroups.length} กลุ่ม)</option>
            {availableGroups.map((g) => (
              <option key={g.groupNumber} value={g.groupNumber}>
                {g.program === "ENGLISH"
                  ? `English: Group ${g.groupNumber}`
                  : `ไทย: กลุ่มที่ ${g.groupNumber}`}
              </option>
            ))}
          </select>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, ฉายา, รหัส..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs w-48 sm:w-60 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Quick Batch Button */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handleMarkAllPresent}
            disabled={filteredAttendees.length === 0}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs text-xs font-bold"
          >
            <CheckCircle2 className="w-4 h-4" /> เช็คมาทั้งหมดในกลุ่ม ({filteredAttendees.length} รูป/คน)
          </Button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. MAIN ATTENDANCE TABLE (4 PERIODS PER DAY)                   */}
      {/* ============================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                <th className="py-3 px-3 font-bold text-center w-12">ที่</th>
                <th className="py-3 px-3 font-bold w-28">รหัสนิสิต</th>
                <th className="py-3 px-4 font-bold min-w-[200px]">ชื่อ - ฉายา / นามสกุล</th>
                <th className="py-3 px-3 font-bold text-center w-24">สาขาวิชา</th>
                <th className="py-3 px-3 font-bold text-center w-20">กลุ่ม</th>

                {/* 4 Periods Header */}
                <th className="py-2 px-2 text-center border-l border-slate-200 dark:border-slate-800 min-w-[110px] bg-amber-500/5">
                  <div className="font-bold text-amber-900 dark:text-amber-200">1. เช้ามืด</div>
                  <div className="text-[10px] text-slate-500 font-normal">04.00 - 04.30</div>
                </th>
                <th className="py-2 px-2 text-center border-l border-slate-200 dark:border-slate-800 min-w-[110px] bg-amber-500/5">
                  <div className="font-bold text-amber-900 dark:text-amber-200">2. เช้า</div>
                  <div className="text-[10px] text-slate-500 font-normal">08.00 - 08.30</div>
                </th>
                <th className="py-2 px-2 text-center border-l border-slate-200 dark:border-slate-800 min-w-[110px] bg-amber-500/5">
                  <div className="font-bold text-amber-900 dark:text-amber-200">3. บ่าย</div>
                  <div className="text-[10px] text-slate-500 font-normal">12.30 - 13.00</div>
                </th>
                <th className="py-2 px-2 text-center border-l border-slate-200 dark:border-slate-800 min-w-[110px] bg-amber-500/5">
                  <div className="font-bold text-amber-900 dark:text-amber-200">4. ค่ำ</div>
                  <div className="text-[10px] text-slate-500 font-normal">17.30 - 18.00</div>
                </th>

                <th className="py-3 px-3 text-center w-24">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAttendees.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    ไม่พบรายชื่อนิสิตในตัวกรองนี้
                  </td>
                </tr>
              ) : (
                filteredAttendees.map((att, idx) => {
                  const daily = att.dailyAttendance?.[selectedDayKey] || {};
                  const isEng = att.program === "ENGLISH";

                  // Render single period cell button
                  const renderPeriodCell = (pId: string) => {
                    const record = daily[pId];
                    const status: MeditationAttendanceStatus | undefined = record?.status;

                    let bgClass = "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200";
                    let label = "คลิกเพื่อลงชื่อ";
                    let icon = null;

                    if (status === "PRESENT") {
                      bgClass = "bg-emerald-500 text-white shadow-xs hover:bg-emerald-600 font-bold";
                      label = "มา";
                      icon = <Check className="w-3.5 h-3.5 inline mr-1" />;
                    } else if (status === "LATE") {
                      bgClass = "bg-amber-500 text-white shadow-xs hover:bg-amber-600 font-bold";
                      label = "สาย";
                      icon = <Clock className="w-3.5 h-3.5 inline mr-1" />;
                    } else if (status === "ABSENT") {
                      bgClass = "bg-rose-500 text-white shadow-xs hover:bg-rose-600 font-bold";
                      label = "ขาด";
                      icon = <XCircle className="w-3.5 h-3.5 inline mr-1" />;
                    } else if (status === "LEAVE") {
                      bgClass = "bg-purple-600 text-white shadow-xs hover:bg-purple-700 font-bold";
                      label = "ป่วย/ลา";
                      icon = <HeartPulse className="w-3.5 h-3.5 inline mr-1" />;
                    }

                    return (
                      <td key={pId} className="py-2 px-2 text-center border-l border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(att.id, pId)}
                          title={`${att.studentName} - ${pId}: คลิกเพื่อเปลี่ยนสถานะ (มา -> สาย -> ขาด -> ป่วย/ลา -> ล้างค่า)`}
                          className={`w-full py-1.5 px-2 rounded-lg text-2xs transition cursor-pointer flex items-center justify-center ${bgClass}`}
                        >
                          {icon}
                          <span>{label}</span>
                        </button>
                        {record?.note && (
                          <div className="text-[10px] text-slate-500 truncate max-w-[100px] mt-0.5" title={record.note}>
                            {record.note}
                          </div>
                        )}
                      </td>
                    );
                  };

                  return (
                    <tr
                      key={att.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-3 px-3 text-center text-slate-400 font-mono text-2xs">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {att.studentCode}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{att.studentName}</span>
                          {isEng && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                              EN
                            </span>
                          )}
                        </div>
                        {att.remarks && (
                          <div className="text-2xs text-slate-400 mt-0.5">{att.remarks}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-400">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-2xs">
                          {att.major || "-"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-amber-700 dark:text-amber-400">
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs">
                          {att.groupNumber || (isEng ? 12 : 1)}
                        </span>
                      </td>

                      {/* 4 Periods */}
                      {renderPeriodCell("p1")}
                      {renderPeriodCell("p2")}
                      {renderPeriodCell("p3")}
                      {renderPeriodCell("p4")}

                      {/* Manage Actions */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingStudent(att);
                              setStudentForm({
                                studentCode: att.studentCode,
                                studentName: att.studentName,
                                major: att.major || "พุทธศาสน์",
                                groupNumber: att.groupNumber || 1,
                                program: (att.program as "THAI" | "ENGLISH") || "THAI",
                                yearLevel: att.yearLevel || 1,
                              });
                              setIsAddStudentOpen(true);
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="แก้ไขข้อมูล"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAttendee(att.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="ลบรายชื่อ"
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

        {/* Legend / Tip */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between text-2xs text-slate-500 gap-2">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700 dark:text-slate-300">ความหมายสถานะ (คลิกที่ช่องเพื่อเปลี่ยนวนลูป):</span>
            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> มา (Present)
            </span>
            <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> สาย (Late)
            </span>
            <span className="flex items-center gap-1 text-rose-700 dark:text-rose-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> ขาด (Absent)
            </span>
            <span className="flex items-center gap-1 text-purple-700 dark:text-purple-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span> ป่วย/ลา (Leave)
            </span>
          </div>
          <div>
            * ขาด ๔ ช่วงเวลา เท่ากับว่าขาด ๑ วัน และถือว่าไม่ผ่านการปฏิบัติธรรม
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5. MODAL: ADD / EDIT STUDENT                                  */}
      {/* ============================================================== */}
      <LiyonDialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800">
              <LiyonDialogTitle asChild>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingStudent ? "แก้ไขข้อมูลนิสิต" : "เพิ่มรายชื่อนิสิตเข้าร่วมปฏิบัติธรรม"}
                </h3>
              </LiyonDialogTitle>
              <LiyonDialogDescription asChild>
                <p className="text-xs text-slate-500 mt-0.5">
                  กำหนดกลุ่ม, หลักสูตรภาษาไทยหรือภาษาอังกฤษ, และสาขาวิชา
                </p>
              </LiyonDialogDescription>
            </div>

            <form onSubmit={handleSaveStudent}>
              <LiyonDialogBody className="p-5 space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    รหัสนิสิต (Student Code) *
                  </label>
                  <input
                    type="text"
                    required
                    value={studentForm.studentCode}
                    onChange={(e) => setStudentForm({ ...studentForm, studentCode: e.target.value })}
                    placeholder="เช่น T101, T301 หรือ E1201"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ชื่อ - ฉายา / นามสกุล (Full Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={studentForm.studentName}
                    onChange={(e) => setStudentForm({ ...studentForm, studentName: e.target.value })}
                    placeholder="เช่น พระสมุห์วิชัย วิชโย หรือ Vo Le Anh Tuan"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      หลักสูตร (Program)
                    </label>
                    <select
                      value={studentForm.program}
                      onChange={(e) => {
                        const prog = e.target.value as "THAI" | "ENGLISH";
                        setStudentForm({
                          ...studentForm,
                          program: prog,
                          groupNumber: prog === "ENGLISH" ? 12 : 1,
                          major: prog === "ENGLISH" ? "Bud." : "พุทธศาสน์",
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                    >
                      <option value="THAI">หลักสูตรภาษาไทย (บรรพชิต)</option>
                      <option value="ENGLISH">English Program (Inter)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      หมายเลขกลุ่ม (Group No.)
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={99}
                      value={studentForm.groupNumber}
                      onChange={(e) =>
                        setStudentForm({ ...studentForm, groupNumber: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      สาขาวิชา / Vasa
                    </label>
                    <input
                      type="text"
                      value={studentForm.major}
                      onChange={(e) => setStudentForm({ ...studentForm, major: e.target.value })}
                      placeholder="เช่น พุทธศาสน์, RePhi, Bud."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ชั้นปี (Year Level)
                    </label>
                    <select
                      value={studentForm.yearLevel}
                      onChange={(e) => setStudentForm({ ...studentForm, yearLevel: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                    >
                      <option value={1}>ปี 1</option>
                      <option value={2}>ปี 2</option>
                      <option value={3}>ปี 3</option>
                      <option value={4}>ปี 4</option>
                    </select>
                  </div>
                </div>
              </LiyonDialogBody>

              <LiyonDialogFooter className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddStudentOpen(false)}
                  className="text-xs"
                >
                  ยกเลิก
                </Button>
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white text-xs">
                  {editingStudent ? "บันทึกการแก้ไข" : "เพิ่มนิสิต"}
                </Button>
              </LiyonDialogFooter>
            </form>
          </div>
        </div>
      </LiyonDialog>

      {/* ============================================================== */}
      {/* 6. MODAL: 12-DAY SUMMARY & EVALUATION (เกณฑ์ผ่าน ๔ ช่วงเวลา)  */}
      {/* ============================================================== */}
      <LiyonDialog open={isSummaryModalOpen} onOpenChange={setIsSummaryModalOpen}>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <LiyonDialogTitle asChild>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-600" />
                    สรุปผลการเข้าร่วมปฏิบัติวิปัสสนากัมมัฏฐานตลอด 12 วัน
                  </h3>
                </LiyonDialogTitle>
                <LiyonDialogDescription asChild>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ตามเกณฑ์: ขาดครบ ๔ ช่วงเวลา เท่ากับว่าขาด ๑ วัน และถือว่าไม่ผ่านการปฏิบัติ
                  </p>
                </LiyonDialogDescription>
              </div>
              <button
                type="button"
                onClick={() => setIsSummaryModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 text-xs">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    <th className="p-2 text-center w-10">ที่</th>
                    <th className="p-2 text-left w-24">รหัส</th>
                    <th className="p-2 text-left">ชื่อ - ฉายา / นามสกุล</th>
                    <th className="p-2 text-center w-16">กลุ่ม</th>
                    <th className="p-2 text-center w-16">มา</th>
                    <th className="p-2 text-center w-16">สาย</th>
                    <th className="p-2 text-center w-16">ลา</th>
                    <th className="p-2 text-center w-20 text-rose-600">ขาด (ช่วง)</th>
                    <th className="p-2 text-center w-24">ขาดเทียบวัน</th>
                    <th className="p-2 text-center w-28">ผลการประเมิน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((att, idx) => {
                    let totalPresent = 0;
                    let totalLate = 0;
                    let totalAbsent = 0;
                    let totalLeave = 0;

                    const daily = att.dailyAttendance || {};
                    Object.values(daily).forEach((dayRecord) => {
                      const rec = dayRecord as DayAttendanceRecord | undefined;
                      if (rec) {
                        ["p1", "p2", "p3", "p4"].forEach((pId) => {
                          const item = rec[pId];
                          if (item?.status === "PRESENT") totalPresent++;
                          else if (item?.status === "LATE") totalLate++;
                          else if (item?.status === "ABSENT") totalAbsent++;
                          else if (item?.status === "LEAVE") totalLeave++;
                        });
                      }
                    });

                    const absentDaysEquivalent = Math.floor(totalAbsent / 4);
                    // Rule: If absent >= 4 periods (1 full day), considered NOT PASSED
                    const isPassed = totalAbsent < 4;

                    return (
                      <tr key={att.id} className="hover:bg-slate-50/50">
                        <td className="p-2 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-2 font-mono font-semibold">{att.studentCode}</td>
                        <td className="p-2 font-medium">{att.studentName}</td>
                        <td className="p-2 text-center font-bold text-amber-700">{att.groupNumber}</td>
                        <td className="p-2 text-center text-emerald-600 font-bold">{totalPresent}</td>
                        <td className="p-2 text-center text-amber-600 font-bold">{totalLate}</td>
                        <td className="p-2 text-center text-purple-600 font-bold">{totalLeave}</td>
                        <td className="p-2 text-center text-rose-600 font-bold">{totalAbsent}</td>
                        <td className="p-2 text-center text-slate-600">
                          {absentDaysEquivalent > 0 ? (
                            <span className="text-rose-600 font-semibold">{absentDaysEquivalent} วัน</span>
                          ) : (
                            <span className="text-slate-400">0 วัน</span>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          {isPassed ? (
                            <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              ผ่านการปฏิบัติ
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                              ไม่ผ่าน (ขาดเกิน ๔ ช่วง)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
              <span className="text-xs text-slate-500">
                รวมทั้งหมด {items.length} รูป/คน
              </span>
              <Button
                type="button"
                onClick={() => setIsSummaryModalOpen(false)}
                className="bg-slate-800 hover:bg-slate-900 text-white text-xs"
              >
                ปิดหน้าต่าง
              </Button>
            </div>
          </div>
        </div>
      </LiyonDialog>

      {/* ============================================================== */}
      {/* 7. OFFICIAL PRINT ROSTER DOCUMENT MODAL (A4 PRINT VIEW)        */}
      {/* ============================================================== */}
      {isPrintModalOpen && (
        <MeditationRosterDocument
          event={event}
          attendees={items}
          onClose={() => setIsPrintModalOpen(false)}
          defaultDayKey={selectedDayKey}
          defaultGroup={selectedGroup !== "ALL" ? selectedGroup : null}
        />
      )}
    </div>
  );
}
