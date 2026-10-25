"use client";

import { useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Printer,
  Award,
  X,
} from "lucide-react";
import {
  LiyonDialog,
  LiyonDialogBody,
  LiyonDialogFooter,
} from "@/shared/components/liyon";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createAcademicCalendarAction,
  createAcademicCalendarEventAction,
  updateAcademicCalendarEventAction,
  deleteAcademicCalendarEventAction,
} from "@/features/curriculum/actions";

interface CalendarEventItem {
  id: string;
  semester: number;
  semesterLabel: string;
  titleEn: string;
  titleTh?: string | null;
  startDate: string | Date;
  endDate: string | Date;
  dateDisplayEn: string;
  dateDisplayTh?: string | null;
  eventType: string;
  description?: string | null;
  orderIndex: number;
}

interface CalendarItem {
  id: string;
  academicYear: string;
  title: string;
  titleTh?: string | null;
  degreeLevel: string;
  authority?: string | null;
  announcedDate?: string | null;
  signatory?: string | null;
  description?: string | null;
  isActive: boolean;
  events?: CalendarEventItem[];
}

interface CalendarAdminClientProps {
  calendars: any[];
  currentCalendar: CalendarItem | null;
  isSuperAdmin?: boolean;
}

export function CalendarAdminClient({
  calendars,
  currentCalendar,
  isSuperAdmin: _isSuperAdmin,
}: CalendarAdminClientProps) {
  const router = useRouter();
  const [selectedSemester, setSelectedSemester] = useState<number | "ALL">("ALL");
  const [displayLanguage, setDisplayLanguage] = useState<"BOTH" | "TH" | "EN">("BOTH");

  // Modal สร้างปีการศึกษาใหม่
  const [isNewYearOpen, setIsNewYearOpen] = useState(false);
  const [newYearForm, setNewYearForm] = useState({
    academicYear: "2027",
    title: "Academic Calendar for Bachelor's Degree Programs, Academic year 2027",
    titleTh: "ปฏิทินการศึกษา ระดับปริญญาตรี ปีการศึกษา 2570 (Academic Year 2027)",
    authority: "Mahachulalongkornrajavidyalaya University Notification",
    announcedDate: "",
    signatory: "Prof. Dr. Phra Brahmawatcharatheeracharn, Rector",
  });
  const [isCreatingYear, setIsCreatingYear] = useState(false);

  // Modal เพิ่ม/แก้ไข Event
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState({
    semester: 2,
    semesterLabel: "2nd Semester",
    titleEn: "",
    titleTh: "",
    startDate: "2026-11-02",
    endDate: "2026-11-02",
    dateDisplayEn: "",
    dateDisplayTh: "",
    eventType: "OTHER",
    orderIndex: 1,
  });
  const [isSavingEvent, setIsSavingEvent] = useState(false);

  // Filter events by semester
  const events = currentCalendar?.events || [];
  const filteredEvents = events.filter((ev) => {
    if (selectedSemester === "ALL") return true;
    return ev.semester === selectedSemester;
  });

  const handleOpenAddEvent = (semester: number = 2) => {
    setEditingEventId(null);
    setEventForm({
      semester,
      semesterLabel: semester === 1 ? "1st Semester" : semester === 2 ? "2nd Semester" : "Summer semester",
      titleEn: "",
      titleTh: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      dateDisplayEn: "",
      dateDisplayTh: "",
      eventType: "OTHER",
      orderIndex: events.length + 1,
    });
    setIsEventModalOpen(true);
  };

  const handleOpenEditEvent = (ev: CalendarEventItem) => {
    setEditingEventId(ev.id);
    const startStr = new Date(ev.startDate).toISOString().split("T")[0];
    const endStr = new Date(ev.endDate).toISOString().split("T")[0];
    setEventForm({
      semester: ev.semester,
      semesterLabel: ev.semesterLabel,
      titleEn: ev.titleEn,
      titleTh: ev.titleTh || "",
      startDate: startStr,
      endDate: endStr,
      dateDisplayEn: ev.dateDisplayEn,
      dateDisplayTh: ev.dateDisplayTh || "",
      eventType: ev.eventType,
      orderIndex: ev.orderIndex,
    });
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCalendar) return;
    setIsSavingEvent(true);
    try {
      if (editingEventId) {
        await updateAcademicCalendarEventAction(editingEventId, eventForm);
        toast.success("อัปเดตกำหนดการสำเร็จ");
      } else {
        await createAcademicCalendarEventAction({
          calendarId: currentCalendar.id,
          ...eventForm,
        });
        toast.success("เพิ่มกำหนดการใหม่สำเร็จ");
      }
      setIsEventModalOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setIsSavingEvent(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("คุณต้องการลบกำหนดการนี้ใช่หรือไม่?")) return;
    try {
      await deleteAcademicCalendarEventAction(id);
      toast.success("ลบกำหนดการสำเร็จ");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "ไม่สามารถลบกำหนดการได้");
    }
  };

  const handleCreateNewYear = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingYear(true);
    try {
      const res = await createAcademicCalendarAction(newYearForm);
      if (res.success) {
        toast.success(`สร้างปฏิทินปีการศึกษา ${newYearForm.academicYear} สำเร็จ`);
        setIsNewYearOpen(false);
        router.push(`/curriculum/calendar?year=${newYearForm.academicYear}`);
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการสร้างปฏิทิน");
    } finally {
      setIsCreatingYear(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1.5">
            <Link href="/attendance/classes" className="hover:text-primary transition">
              รายวิชาทั้งหมด
            </Link>
            <span>/</span>
            <span className="text-primary">ปฏิทินการศึกษา</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary font-bold text-xs">
              MCU Bachelor&apos;s Degree
            </span>
            <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-bold text-xs border border-amber-200 dark:border-amber-900/40">
              ปีการศึกษา {currentCalendar?.academicYear || "2026"} (2569)
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {displayLanguage === "TH"
              ? "ปฏิทินการศึกษา ระดับปริญญาตรี"
              : displayLanguage === "EN"
              ? "Academic Calendar (Bachelor's Degree)"
              : "ปฏิทินการศึกษา (Academic Calendar)"}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-2xl">
            {displayLanguage === "TH"
              ? currentCalendar?.titleTh || currentCalendar?.title
              : displayLanguage === "EN"
              ? currentCalendar?.title || currentCalendar?.titleTh
              : `${currentCalendar?.titleTh || "ปฏิทินการศึกษา ระดับปริญญาตรี"} • ${currentCalendar?.title || "Academic Calendar for Bachelor's Degree Programs"}`}
          </p>
        </div>

        {/* Year Switcher, Language Switcher and Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Language Toggle Pills */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold shadow-2xs">
            <button
              type="button"
              onClick={() => setDisplayLanguage("BOTH")}
              className={`px-2.5 py-1.5 rounded-lg transition ${
                displayLanguage === "BOTH"
                  ? "bg-white dark:bg-slate-900 text-primary shadow-2xs font-bold"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
              title="แสดงสองภาษาคู่กัน"
            >
              🌐 สองภาษา
            </button>
            <button
              type="button"
              onClick={() => setDisplayLanguage("TH")}
              className={`px-2.5 py-1.5 rounded-lg transition ${
                displayLanguage === "TH"
                  ? "bg-white dark:bg-slate-900 text-primary shadow-2xs font-bold"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
              title="แสดงภาษาไทย"
            >
              🇹🇭 ไทย
            </button>
            <button
              type="button"
              onClick={() => setDisplayLanguage("EN")}
              className={`px-2.5 py-1.5 rounded-lg transition ${
                displayLanguage === "EN"
                  ? "bg-white dark:bg-slate-900 text-primary shadow-2xs font-bold"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
              title="View in English"
            >
              🇬🇧 English
            </button>
          </div>

          {/* Year Selector */}
          <select
            value={currentCalendar?.academicYear || "2026"}
            onChange={(e) => {
              router.push(`/curriculum/calendar?year=${e.target.value}`);
            }}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold shadow-2xs"
          >
            {calendars.map((c) => (
              <option key={c.id} value={c.academicYear}>
                ปีการศึกษา {c.academicYear} (พ.ศ. {Number(c.academicYear) + 543})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setIsNewYearOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition"
          >
            <Plus className="w-3.5 h-3.5 text-primary" />
            เพิ่มปีการศึกษาใหม่
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition"
          >
            <Printer className="w-3.5 h-3.5" />
            พิมพ์ปฏิทิน
          </button>
        </div>
      </div>

      {/* Teacher Milestones Card for Semester 2 (Highlight for Instructors) */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>กำหนดการสำคัญสำหรับอาจารย์ผู้สอน • ภาคการศึกษาที่ 2/2569</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-2xs font-extrabold uppercase">
                  Current Term
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              อาจารย์ผู้สอนทุกท่านสามารถใช้วันที่เหล่านี้ในการวางแผนจัดการเรียนการสอน 16 คาบ การเช็กชื่อ และการบันทึกคะแนน
            </p>

            {/* Timeline Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                <span className="text-2xs font-bold text-slate-400 block">เปิดภาคการศึกษา</span>
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block mt-0.5">
                  2 พฤศจิกายน 2569
                </span>
                <span className="text-2xs text-slate-500">November 2, 2026</span>
              </div>

              <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                <span className="text-2xs font-bold text-slate-400 block">ประเมินการสอนออนไลน์</span>
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block mt-0.5">
                  1 - 26 กุมภาพันธ์ 2570
                </span>
                <span className="text-2xs text-slate-500">February 1 - 26, 2027</span>
              </div>

              <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/20 shadow-2xs">
                <span className="text-2xs font-bold text-rose-600 block">วันสุดท้ายของการสอน (ปิดเรียน)</span>
                <span className="text-xs font-extrabold text-rose-700 dark:text-rose-400 block mt-0.5">
                  26 กุมภาพันธ์ 2570
                </span>
                <span className="text-2xs text-rose-500">February 26, 2027</span>
              </div>

              <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/20 shadow-2xs">
                <span className="text-2xs font-bold text-indigo-600 block">สอบไล่ประจำภาคที่ 2</span>
                <span className="text-xs font-extrabold text-indigo-700 dark:text-indigo-400 block mt-0.5">
                  8 - 17 มีนาคม 2570
                </span>
                <span className="text-2xs text-indigo-500">March 8 - 17, 2027</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Semester Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setSelectedSemester("ALL")}
            className={`px-3 py-1.5 rounded-lg transition ${
              selectedSemester === "ALL"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            ทุกภาคการศึกษา ({events.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedSemester(1)}
            className={`px-3 py-1.5 rounded-lg transition ${
              selectedSemester === 1
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            ภาคการศึกษาที่ 1 (1st Sem)
          </button>
          <button
            type="button"
            onClick={() => setSelectedSemester(2)}
            className={`px-3 py-1.5 rounded-lg transition ${
              selectedSemester === 2
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            ภาคการศึกษาที่ 2 (2nd Sem)
          </button>
          <button
            type="button"
            onClick={() => setSelectedSemester(3)}
            className={`px-3 py-1.5 rounded-lg transition ${
              selectedSemester === 3
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            ภาคฤดูร้อน (Summer)
          </button>
        </div>

        <button
          type="button"
          onClick={() => handleOpenAddEvent(typeof selectedSemester === "number" ? selectedSemester : 2)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" />
          เพิ่มกำหนดการ
        </button>
      </div>

      {/* Events Table / Timeline Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 divide-y divide-slate-200/80 dark:divide-slate-800">
            <thead className="bg-slate-50/80 dark:bg-slate-800/60 font-semibold text-slate-500 select-none">
              <tr>
                <th className="py-3 px-4 w-12 text-center">ลำดับ</th>
                <th className="py-3 px-4 min-w-[130px]">
                  {displayLanguage === "TH" ? "ภาคการศึกษา" : displayLanguage === "EN" ? "Semester" : "ภาคการศึกษา / Sem"}
                </th>
                <th className="py-3 px-4 min-w-[220px]">
                  {displayLanguage === "TH" ? "ช่วงวัน-เดือน-ปี" : displayLanguage === "EN" ? "Date Duration" : "ช่วงวัน-เดือน-ปี (Date)"}
                </th>
                <th className="py-3 px-4 min-w-[300px]">
                  {displayLanguage === "TH" ? "กิจกรรม / กำหนดการ" : displayLanguage === "EN" ? "Academic Event / Activity" : "กิจกรรม / กำหนดการ (Event Title)"}
                </th>
                <th className="py-3 px-3 text-center min-w-[110px]">
                  {displayLanguage === "TH" ? "ประเภท" : displayLanguage === "EN" ? "Type" : "ประเภท (Type)"}
                </th>
                <th className="py-3 px-4 text-center w-24">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-normal">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    ไม่พบกำหนดการในภาคการศึกษานี้
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev, idx) => {
                  const isExam = ev.eventType === "EXAM";
                  const isEnd = ev.eventType === "LAST_DAY_CLASS";
                  const isStart = ev.eventType === "SEMESTER_START";

                  return (
                    <tr
                      key={ev.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition ${
                        isExam ? "bg-indigo-50/20 dark:bg-indigo-950/10" : isEnd ? "bg-rose-50/20 dark:bg-rose-950/10" : ""
                      }`}
                    >
                      <td className="py-3 px-4 text-center text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-md font-bold text-2xs ${
                            ev.semester === 1
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                              : ev.semester === 2
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                          }`}
                        >
                          {displayLanguage === "TH"
                            ? ev.semester === 1 ? "ภาคที่ 1" : ev.semester === 2 ? "ภาคที่ 2" : "ภาคฤดูร้อน"
                            : ev.semesterLabel}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {displayLanguage === "TH" ? (
                          <>
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {ev.dateDisplayTh || ev.dateDisplayEn}
                            </div>
                            {ev.dateDisplayEn && ev.dateDisplayTh && (
                              <div className="text-2xs text-slate-400 mt-0.5">{ev.dateDisplayEn}</div>
                            )}
                          </>
                        ) : displayLanguage === "EN" ? (
                          <>
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {ev.dateDisplayEn || ev.dateDisplayTh}
                            </div>
                            {ev.dateDisplayTh && ev.dateDisplayEn && (
                              <div className="text-2xs text-slate-400 mt-0.5">{ev.dateDisplayTh}</div>
                            )}
                          </>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-2xs px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold shrink-0">
                                🇹🇭 TH
                              </span>
                              <span className="font-semibold text-xs text-slate-900 dark:text-white">
                                {ev.dateDisplayTh || "-"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-2xs px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-bold shrink-0">
                                🇬🇧 EN
                              </span>
                              <span className="text-xs text-slate-600 dark:text-slate-300">
                                {ev.dateDisplayEn || "-"}
                              </span>
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {displayLanguage === "TH" ? (
                          <>
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {ev.titleTh || ev.titleEn}
                            </div>
                            {ev.titleEn && ev.titleTh && (
                              <div className="text-2xs text-slate-400 mt-0.5">{ev.titleEn}</div>
                            )}
                          </>
                        ) : displayLanguage === "EN" ? (
                          <>
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {ev.titleEn || ev.titleTh}
                            </div>
                            {ev.titleTh && ev.titleEn && (
                              <div className="text-2xs text-slate-400 mt-0.5">{ev.titleTh}</div>
                            )}
                          </>
                        ) : (
                          <div className="space-y-1">
                            <div className="font-semibold text-xs text-slate-900 dark:text-white flex items-start gap-1.5">
                              <span className="text-2xs px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold shrink-0 mt-0.5">
                                🇹🇭 TH
                              </span>
                              <span>{ev.titleTh || "-"}</span>
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                              <span className="text-2xs px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-bold shrink-0 mt-0.5">
                                🇬🇧 EN
                              </span>
                              <span>{ev.titleEn || "-"}</span>
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-2xs font-bold ${
                            isExam
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                              : isEnd
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                              : isStart
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {ev.eventType}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditEvent(ev)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
                            title="แก้ไขกำหนดการ"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEvent(ev.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition"
                            title="ลบกำหนดการ"
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

        {/* Official Authority Footer */}
        <div className="p-5 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs text-slate-500">
          <div>
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              {currentCalendar?.authority || "Mahachulalongkornrajavidyalaya University Notification"}
            </p>
            <p className="text-2xs text-slate-400 mt-0.5">
              Announced on {currentCalendar?.announcedDate || "20 December 2025"} by {currentCalendar?.signatory}
            </p>
          </div>
          <div className="text-2xs text-slate-400 max-w-md">
            Any department that provides a bachelor&apos;s degree program at the university may issue a separate academic schedule that aligns with this announcement.
          </div>
        </div>
      </div>

      {/* Modal: เพิ่มปีการศึกษาใหม่ (Future Academic Years) */}
      <LiyonDialog open={isNewYearOpen} onOpenChange={setIsNewYearOpen}>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    สร้างปฏิทินปีการศึกษาใหม่
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    สำหรับรองรับการเปลี่ยนแปลงในปีการศึกษาถัดไป (เช่น 2027 / 2570)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewYearOpen(false)}
                  className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateNewYear}>
              <LiyonDialogBody className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ปีการศึกษา (Academic Year - ค.ศ.)
                  </label>
                  <input
                    type="text"
                    required
                    value={newYearForm.academicYear}
                    onChange={(e) => {
                      const yr = e.target.value;
                      const thYr = Number(yr) ? Number(yr) + 543 : "";
                      setNewYearForm({
                        ...newYearForm,
                        academicYear: yr,
                        title: `Academic Calendar for Bachelor's Degree Programs, Academic year ${yr}`,
                        titleTh: `ปฏิทินการศึกษา ระดับปริญญาตรี ปีการศึกษา ${thYr} (Academic Year ${yr})`,
                      });
                    }}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ชื่อประกาศภาษาอังกฤษ (Title EN)
                  </label>
                  <input
                    type="text"
                    required
                    value={newYearForm.title}
                    onChange={(e) => setNewYearForm({ ...newYearForm, title: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ชื่อประกาศภาษาไทย (Title TH)
                  </label>
                  <input
                    type="text"
                    value={newYearForm.titleTh}
                    onChange={(e) => setNewYearForm({ ...newYearForm, titleTh: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ผู้ลงนาม (Signatory)
                  </label>
                  <input
                    type="text"
                    value={newYearForm.signatory}
                    onChange={(e) => setNewYearForm({ ...newYearForm, signatory: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </LiyonDialogBody>

              <LiyonDialogFooter className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewYearOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isCreatingYear}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary/90 shadow-sm"
                >
                  {isCreatingYear ? "กำลังสร้าง..." : "สร้างปฏิทิน"}
                </button>
              </LiyonDialogFooter>
            </form>
          </div>
        </div>
      </LiyonDialog>

      {/* Modal: เพิ่ม/แก้ไข Event */}
      <LiyonDialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {editingEventId ? "แก้ไขกำหนดการ" : "เพิ่มกำหนดการใหม่"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ระบุรายละเอียดกิจกรรมและช่วงเวลาตามประกาศมหาวิทยาลัย
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveEvent}>
              <LiyonDialogBody className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ภาคการศึกษา (Semester)
                    </label>
                    <select
                      value={eventForm.semester}
                      onChange={(e) => {
                        const sem = Number(e.target.value);
                        setEventForm({
                          ...eventForm,
                          semester: sem,
                          semesterLabel: sem === 1 ? "1st Semester" : sem === 2 ? "2nd Semester" : "Summer semester",
                        });
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value={1}>1st Semester</option>
                      <option value={2}>2nd Semester</option>
                      <option value={3}>Summer semester</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ประเภทกิจกรรม (Event Type)
                    </label>
                    <select
                      value={eventForm.eventType}
                      onChange={(e) => setEventForm({ ...eventForm, eventType: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="SEMESTER_START">SEMESTER_START (เปิดภาคการศึกษา)</option>
                      <option value="ENROLLMENT">ENROLLMENT (ลงทะเบียนเรียน)</option>
                      <option value="ADD_DROP">ADD_DROP (เพิ่ม-ถอนรายวิชา)</option>
                      <option value="LATE_REGISTRATION">LATE_REGISTRATION (ลงทะเบียนล่าช้า)</option>
                      <option value="EVALUATION">EVALUATION (ประเมินการสอน)</option>
                      <option value="LAST_DAY_CLASS">LAST_DAY_CLASS (วันสุดท้ายของการสอน)</option>
                      <option value="EXAM">EXAM (สอบไล่ประจำภาค)</option>
                      <option value="ORIENTATION">ORIENTATION (ปฐมนิเทศ)</option>
                      <option value="OTHER">OTHER (อื่นๆ)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ชื่อกิจกรรมภาษาอังกฤษ (Title EN)
                  </label>
                  <input
                    type="text"
                    required
                    value={eventForm.titleEn}
                    onChange={(e) => setEventForm({ ...eventForm, titleEn: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ชื่อกิจกรรมภาษาไทย (Title TH - ถ้ามี)
                  </label>
                  <input
                    type="text"
                    value={eventForm.titleTh}
                    onChange={(e) => setEventForm({ ...eventForm, titleTh: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      วันเริ่มต้น (Start Date)
                    </label>
                    <input
                      type="date"
                      required
                      value={eventForm.startDate}
                      onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      วันสิ้นสุด (End Date)
                    </label>
                    <input
                      type="date"
                      required
                      value={eventForm.endDate}
                      onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ข้อความแสดงวันที่ (EN)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. November 2 - 15, 2026"
                      value={eventForm.dateDisplayEn}
                      onChange={(e) => setEventForm({ ...eventForm, dateDisplayEn: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ข้อความแสดงวันที่ (TH)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 2 - 15 พฤศจิกายน 2569"
                      value={eventForm.dateDisplayTh}
                      onChange={(e) => setEventForm({ ...eventForm, dateDisplayTh: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </LiyonDialogBody>

              <LiyonDialogFooter className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSavingEvent}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary/90 shadow-sm"
                >
                  {isSavingEvent ? "กำลังบันทึก..." : "บันทึกกำหนดการ"}
                </button>
              </LiyonDialogFooter>
            </form>
          </div>
        </div>
      </LiyonDialog>
    </div>
  );
}
