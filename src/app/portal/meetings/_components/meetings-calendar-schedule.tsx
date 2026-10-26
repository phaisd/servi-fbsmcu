"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Filter,
  List,
  MapPin,
  Plus,
  Sparkles,
  FileText,
  Info,
  Building2,
  Tv,
} from "lucide-react";
import {
  LiyonDialog,
  LiyonDialogHeader,
  LiyonDialogBody,
  LiyonDialogFooter,
  LiyonDialogCloseButton,
} from "@/shared/components/liyon";
import {
  parseBookingRemark,
  getThaiLunarDate,
  getThaiHolidaysForDate,
  formatDateToIsoDate,
  getEarliestBookingDate,
  type ThaiLunarDateInfo,
  type ThaiHolidayInfo,
} from "@/features/meetings";

export interface SerializedRoom {
  id: string;
  name: string;
  capacity: number;
  equipment: string | null;
  imageUrl: string | null;
}

export interface SerializedBooking {
  id: string;
  roomId: string;
  roomName: string;
  roomCapacity: number;
  title: string;
  startTimeIso: string;
  endTimeIso: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  remark: string | null;
  requesterNameFallback: string;
}

interface Props {
  locale: string;
  rooms: SerializedRoom[];
  bookings: SerializedBooking[];
}

const THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const EN_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS_TH = [
  { short: "อา.", full: "อาทิตย์", isWeekend: true },
  { short: "จ.", full: "จันทร์", isWeekend: false },
  { short: "อ.", full: "อังคาร", isWeekend: false },
  { short: "พ.", full: "พุธ", isWeekend: false },
  { short: "พฤ.", full: "พฤหัสบดี", isWeekend: false },
  { short: "ศ.", full: "ศุกร์", isWeekend: false },
  { short: "ส.", full: "เสาร์", isWeekend: true },
];

const WEEKDAYS_EN = [
  { short: "Sun", full: "Sunday", isWeekend: true },
  { short: "Mon", full: "Monday", isWeekend: false },
  { short: "Tue", full: "Tuesday", isWeekend: false },
  { short: "Wed", full: "Wednesday", isWeekend: false },
  { short: "Thu", full: "Thursday", isWeekend: false },
  { short: "Fri", full: "Friday", isWeekend: false },
  { short: "Sat", full: "Saturday", isWeekend: true },
];

const ROOM_COLOR_PALETTES = [
  {
    bg: "bg-orange-100/90 hover:bg-orange-200/90",
    border: "border-orange-300",
    text: "text-orange-950",
    dot: "bg-orange-600",
    badge: "bg-orange-600 text-white",
  },
  {
    bg: "bg-indigo-100/90 hover:bg-indigo-200/90",
    border: "border-indigo-300",
    text: "text-indigo-950",
    dot: "bg-indigo-600",
    badge: "bg-indigo-600 text-white",
  },
  {
    bg: "bg-emerald-100/90 hover:bg-emerald-200/90",
    border: "border-emerald-300",
    text: "text-emerald-950",
    dot: "bg-emerald-600",
    badge: "bg-emerald-600 text-white",
  },
  {
    bg: "bg-purple-100/90 hover:bg-purple-200/90",
    border: "border-purple-300",
    text: "text-purple-950",
    dot: "bg-purple-600",
    badge: "bg-purple-600 text-white",
  },
  {
    bg: "bg-sky-100/90 hover:bg-sky-200/90",
    border: "border-sky-300",
    text: "text-sky-950",
    dot: "bg-sky-600",
    badge: "bg-sky-600 text-white",
  },
];

function formatTimeShort(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function getPurposeLabel(purposeType?: string, purposeOther?: string): string {
  if (!purposeType) return "ประชุม / กิจกรรมคณะ";
  if (purposeType === "MEETING") return "ประชุม (Meeting)";
  if (purposeType === "TRAINING") return "อบรม (Training)";
  if (purposeType === "SEMINAR") return "สัมมนา (Seminar)";
  return purposeOther || "อื่นๆ";
}

interface CalendarCellData {
  date: Date;
  isoDate: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isBookable: boolean;
  lunar: ThaiLunarDateInfo;
  holidays: ThaiHolidayInfo[];
  bookings: SerializedBooking[];
}

export function MeetingsCalendarSchedule({ locale, rooms, bookings }: Props) {
  const isTh = locale === "th";
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const todayIso = useMemo(() => formatDateToIsoDate(today), [today]);
  const earliestBookableIso = useMemo(
    () => formatDateToIsoDate(getEarliestBookingDate(today, 1)),
    [today]
  );

  // Dual View State: "calendar" (default) | "list"
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("ALL");
  const [showLunarSubtext, setShowLunarSubtext] = useState<boolean>(true);

  // Current viewed month/year
  const [currentYear, setCurrentYear] = useState<number>(() => today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(() => today.getMonth()); // 0..11

  // Selected booking for Quick Preview Modal
  const [activeBooking, setActiveBooking] = useState<SerializedBooking | null>(null);

  // Map roomId -> color palette
  const roomColorMap = useMemo(() => {
    const map = new Map<string, (typeof ROOM_COLOR_PALETTES)[number]>();
    rooms.forEach((r, idx) => {
      map.set(r.id, ROOM_COLOR_PALETTES[idx % ROOM_COLOR_PALETTES.length]);
    });
    return map;
  }, [rooms]);

  // Filtered bookings by room
  const filteredBookings = useMemo(() => {
    if (selectedRoomId === "ALL") return bookings;
    return bookings.filter((b) => b.roomId === selectedRoomId);
  }, [bookings, selectedRoomId]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleGoToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  // Build 42-day (6 weeks) or 35-day grid for the selected month
  const calendarCells = useMemo<CalendarCellData[]>(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) .. 6 (Sat)
    const daysInMonth = lastDayOfMonth.getDate();

    const totalSlots = Math.ceil((startDayOfWeek + daysInMonth) / 7) * 7;
    const gridStartDate = new Date(currentYear, currentMonth, 1 - startDayOfWeek);

    const cells: CalendarCellData[] = [];

    for (let i = 0; i < totalSlots; i++) {
      const cellDate = new Date(
        gridStartDate.getFullYear(),
        gridStartDate.getMonth(),
        gridStartDate.getDate() + i
      );
      const isoDate = formatDateToIsoDate(cellDate);
      const isCurrentMonth = cellDate.getMonth() === currentMonth;
      const isToday = isoDate === todayIso;
      const isBookable = isoDate >= earliestBookableIso;

      const lunar = getThaiLunarDate(isoDate);
      const holidays = getThaiHolidaysForDate(isoDate);

      // Find bookings occurring on this date
      const dayBookings = filteredBookings.filter((b) => {
        const startIso = formatDateToIsoDate(new Date(b.startTimeIso));
        const endIso = formatDateToIsoDate(new Date(b.endTimeIso));
        return isoDate >= startIso && isoDate <= endIso;
      });

      cells.push({
        date: cellDate,
        isoDate,
        dayNumber: cellDate.getDate(),
        isCurrentMonth,
        isToday,
        isBookable,
        lunar,
        holidays,
        bookings: dayBookings,
      });
    }

    return cells;
  }, [currentYear, currentMonth, todayIso, earliestBookableIso, filteredBookings]);

  // Summary of Wan Phra and Holidays in current month
  const currentMonthHighlights = useMemo(() => {
    const inMonthCells = calendarCells.filter((c) => c.isCurrentMonth);
    const wanPhraDays = inMonthCells.filter((c) => c.lunar.isWanPhra);
    const holidayDays = inMonthCells.filter((c) => c.holidays.length > 0);
    const monthBookingsCount = filteredBookings.filter((b) => {
      const d = new Date(b.startTimeIso);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    }).length;
    return { wanPhraDays, holidayDays, monthBookingsCount };
  }, [calendarCells, filteredBookings, currentYear, currentMonth]);

  // List view bookings (show bookings for selected month or upcoming)
  const [listFilterScope, setListFilterScope] = useState<"MONTH" | "UPCOMING">("MONTH");
  const listBookings = useMemo(() => {
    if (listFilterScope === "UPCOMING") {
      return filteredBookings.filter((b) => new Date(b.endTimeIso) >= today);
    }
    return filteredBookings.filter((b) => {
      const d = new Date(b.startTimeIso);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });
  }, [filteredBookings, listFilterScope, today, currentYear, currentMonth]);

  const activeBookingMeta = useMemo(
    () => (activeBooking ? parseBookingRemark(activeBooking.remark) : null),
    [activeBooking]
  );

  const yearOptions = [2025, 2026, 2027, 2028];
  const weekdays = isTh ? WEEKDAYS_TH : WEEKDAYS_EN;
  const headerMonthTitle = isTh
    ? `${THAI_MONTHS[currentMonth]} พ.ศ. ${currentYear + 543}`
    : `${EN_MONTHS[currentMonth]} ${currentYear} (B.E. ${currentYear + 543})`;

  return (
    <div className="space-y-5 pt-4">
      {/* Section Header & Dual View Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-orange-200/70 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-linear-to-br from-orange-500 to-amber-600 text-white shadow-xs">
              <CalendarIcon className="h-5 w-5" />
            </span>
            <span>
              {isTh
                ? "ปฏิทินและตารางการใช้ห้องประชุมคณะพุทธศาสตร์"
                : "Buddhist Calendar & Meeting Room Schedule"}
            </span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {isTh
              ? "แสดงรายการจองห้องประชุม พร้อมวันพระ (วันธรรมสวนะ) วันสำคัญทางพระพุทธศาสนา และวันหยุดราชการ"
              : "Interactive room reservation calendar with Thai Buddhist holy days (Wan Phra) and public holidays"}
          </p>
        </div>

        {/* Controls: Room Filter + View Mode Tabs */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Room Filter Dropdown */}
          <div className="relative flex items-center">
            <Filter className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-orange-600" />
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              aria-label="กรองตามห้องประชุม"
              className="rounded-xl border border-orange-200 bg-white pl-8 pr-8 py-2 text-xs font-bold text-slate-800 shadow-2xs hover:border-orange-400 focus:border-orange-600 focus:outline-none transition"
            >
              <option value="ALL">
                {isTh ? `ทุกห้องประชุม (${rooms.length} ห้อง)` : `All Meeting Rooms (${rooms.length})`}
              </option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} (รองรับ {r.capacity} ที่นั่ง)
                </option>
              ))}
            </select>
          </div>

          {/* Dual View Tabs */}
          <div className="inline-flex items-center rounded-2xl bg-orange-100/70 p-1 border border-orange-200/80">
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                viewMode === "calendar"
                  ? "bg-orange-600 text-white shadow-xs"
                  : "text-orange-950 hover:bg-orange-200/60"
              }`}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>{isTh ? "มุมมองปฏิทิน" : "Calendar View"}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                viewMode === "list"
                  ? "bg-orange-600 text-white shadow-xs"
                  : "text-orange-950 hover:bg-orange-200/60"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>{isTh ? "มุมมองตารางรายการ" : "List View"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Navigation & Legend Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl border border-orange-200/80 bg-linear-to-r from-amber-50/70 via-white to-orange-50/60 p-4 shadow-2xs">
        {/* Month / Year Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              title={isTh ? "เดือนก่อนหน้า" : "Previous Month"}
              className="rounded-lg p-1.5 text-slate-700 hover:bg-orange-50 hover:text-orange-700 transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleGoToday}
              className="px-3 py-1 text-xs font-bold text-orange-700 hover:bg-orange-50 rounded-lg transition"
            >
              {isTh ? "วันนี้" : "Today"}
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              title={isTh ? "เดือนถัดไป" : "Next Month"}
              className="rounded-lg p-1.5 text-slate-700 hover:bg-orange-50 hover:text-orange-700 transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Month & Buddhist Year Title + Quick Selectors */}
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight px-1">
              {headerMonthTitle}
            </h3>

            <select
              value={currentMonth}
              onChange={(e) => setCurrentMonth(Number(e.target.value))}
              aria-label="เลือกเดือน"
              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-orange-300"
            >
              {(isTh ? THAI_MONTHS : EN_MONTHS).map((mName, idx) => (
                <option key={mName} value={idx}>
                  {mName}
                </option>
              ))}
            </select>

            <select
              value={currentYear}
              onChange={(e) => setCurrentYear(Number(e.target.value))}
              aria-label="เลือกปี พ.ศ."
              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-orange-300"
            >
              {yearOptions.map((yr) => (
                <option key={yr} value={yr}>
                  {isTh ? `พ.ศ. ${yr + 543}` : `${yr} (B.E. ${yr + 543})`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Legend & Lunar Subtext Toggle */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/90 border border-amber-300 px-2.5 py-1 text-amber-950">
            <span>🪷</span>
            <span>วันพระ ({currentMonthHighlights.wanPhraDays.length} วัน)</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100/90 border border-rose-300 px-2.5 py-1 text-rose-900">
            <span className="h-2 w-2 rounded-full bg-rose-600" />
            <span>วันหยุด/วันสำคัญ ({currentMonthHighlights.holidayDays.length} วัน)</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/90 border border-emerald-300 px-2.5 py-1 text-emerald-900">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
            <span>จองใช้ห้องเดือนนี้ ({currentMonthHighlights.monthBookingsCount} รายการ)</span>
          </span>

          {viewMode === "calendar" && (
            <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900 ml-1">
              <input
                type="checkbox"
                checked={showLunarSubtext}
                onChange={(e) => setShowLunarSubtext(e.target.checked)}
                className="rounded text-orange-600 focus:ring-orange-500"
              />
              <span>แสดงข้างขึ้น-ข้างแรมทุกวัน</span>
            </label>
          )}
        </div>
      </div>

      {/* Room Color Legend Bar */}
      {rooms.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-1 text-xs">
          <span className="font-bold text-muted-foreground mr-1">สัญลักษณ์สีห้องประชุม:</span>
          {rooms.map((r) => {
            const palette = roomColorMap.get(r.id) ?? ROOM_COLOR_PALETTES[0];
            const isSelected = selectedRoomId === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedRoomId(isSelected ? "ALL" : r.id)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold transition ${
                  isSelected
                    ? "ring-2 ring-orange-500 border-orange-500 bg-orange-50 text-orange-950"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${palette.dot}`} />
                <span>{r.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* VIEW 1: MONTHLY CALENDAR VIEW */}
      {viewMode === "calendar" ? (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm">
            {/* Weekday Header Row */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/90">
              {weekdays.map((wd, idx) => (
                <div
                  key={wd.short}
                  className={`py-3 px-2 text-center text-xs font-extrabold tracking-wide ${
                    idx === 0
                      ? "text-rose-600 bg-rose-50/40"
                      : idx === 6
                      ? "text-indigo-600 bg-indigo-50/30"
                      : "text-slate-700"
                  }`}
                >
                  <span className="hidden sm:inline">{wd.full}</span>
                  <span className="sm:hidden">{wd.short}</span>
                </div>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-200/80">
              {calendarCells.map((cell) => {
                const isSunday = cell.date.getDay() === 0;
                const isSaturday = cell.date.getDay() === 6;
                const hasPublicHoliday = cell.holidays.some((h) => h.isPublicHoliday);
                const bookHref = `/portal/meetings/book?date=${cell.isoDate}${
                  selectedRoomId !== "ALL" ? `&roomId=${selectedRoomId}` : ""
                }`;

                // Cell background styling
                let cellBg = "bg-white hover:bg-slate-50/60";
                if (!cell.isCurrentMonth) {
                  cellBg = "bg-slate-50/50 text-slate-400";
                } else if (cell.isToday) {
                  cellBg = "bg-orange-50/60 ring-2 ring-inset ring-orange-500";
                } else if (cell.lunar.isWanPhra) {
                  cellBg = "bg-amber-50/35 hover:bg-amber-50/60";
                } else if (hasPublicHoliday) {
                  cellBg = "bg-rose-50/25 hover:bg-rose-50/50";
                }

                return (
                  <div
                    key={cell.isoDate}
                    className={`group relative min-h-[125px] sm:min-h-[148px] p-1.5 sm:p-2.5 flex flex-col justify-between transition ${cellBg}`}
                  >
                    {/* Top section: Date number + Wan Phra badge + Quick Book on hover */}
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-1">
                        {/* Day Number & Today pill */}
                        <div className="flex items-center gap-1">
                          <span
                            className={`inline-flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full text-xs sm:text-sm font-black ${
                              cell.isToday
                                ? "bg-orange-600 text-white shadow-xs"
                                : !cell.isCurrentMonth
                                ? "text-slate-400"
                                : hasPublicHoliday || isSunday
                                ? "text-rose-600"
                                : isSaturday
                                ? "text-indigo-600"
                                : "text-slate-800"
                            }`}
                          >
                            {cell.dayNumber}
                          </span>
                          {cell.isToday && (
                            <span className="hidden md:inline-block rounded-full bg-orange-600 px-1.5 py-0.5 text-[9px] font-extrabold text-white">
                              วันนี้
                            </span>
                          )}
                        </div>

                        {/* Wan Phra Badge (🪷 วันพระ) */}
                        {cell.lunar.isWanPhra && (
                          <span
                            title={`วันพระ (${cell.lunar.fullLunarLabel})`}
                            className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold shadow-2xs ${
                              cell.lunar.isMajorWanPhra
                                ? "bg-linear-to-r from-amber-500 to-orange-500 text-white"
                                : "bg-amber-100 text-amber-900 border border-amber-300"
                            }`}
                          >
                            <span>🪷</span>
                            <span className="hidden xl:inline">วันพระ</span>
                            <span className="text-[9px] opacity-95 hidden sm:inline">
                              ({cell.lunar.wanPhraShortLabel})
                            </span>
                          </span>
                        )}
                      </div>

                      {/* Lunar subtext on non-Wan Phra days if enabled */}
                      {showLunarSubtext && !cell.lunar.isWanPhra && cell.isCurrentMonth && (
                        <div className="text-[10px] text-slate-400 font-medium leading-none px-0.5 truncate">
                          {cell.lunar.fullLunarLabel}
                        </div>
                      )}
                      {showLunarSubtext && cell.lunar.isWanPhra && cell.isCurrentMonth && (
                        <div className="text-[10px] text-amber-800 font-semibold leading-none px-0.5 truncate">
                          {cell.lunar.fullLunarLabel}
                        </div>
                      )}

                      {/* Thai Public / Buddhist Holidays Badges */}
                      {cell.holidays.length > 0 && (
                        <div className="space-y-1">
                          {cell.holidays.map((h) => (
                            <div
                              key={`${h.date}-${h.nameTh}`}
                              title={`${h.nameTh} (${h.nameEn})`}
                              className={`flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-[10px] font-bold truncate border ${
                                h.kind === "BUDDHIST"
                                  ? "bg-amber-100/90 border-amber-300 text-amber-950"
                                  : h.isPublicHoliday
                                  ? "bg-rose-100/90 border-rose-200 text-rose-900"
                                  : "bg-sky-50 border-sky-200 text-sky-800"
                              }`}
                            >
                              <span>{h.kind === "BUDDHIST" ? "☸️" : "🔴"}</span>
                              <span className="truncate">{isTh ? h.nameTh : h.nameEn}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Room Bookings Chips */}
                      {cell.bookings.length > 0 && (
                        <div className="space-y-1 pt-0.5">
                          {cell.bookings.map((b) => {
                            const palette =
                              roomColorMap.get(b.roomId) ?? ROOM_COLOR_PALETTES[0];
                            const isPending = b.status === "PENDING";
                            return (
                              <button
                                key={b.id}
                                type="button"
                                onClick={() => setActiveBooking(b)}
                                className={`w-full text-left rounded-lg border px-1.5 py-1 text-[10px] leading-tight transition shadow-2xs ${palette.bg} ${palette.border} ${palette.text}`}
                              >
                                <div className="flex items-center justify-between gap-1 font-extrabold">
                                  <span className="inline-flex items-center gap-1 truncate">
                                    <span
                                      className={`h-1.5 w-1.5 rounded-full shrink-0 ${palette.dot}`}
                                    />
                                    <span>
                                      {formatTimeShort(b.startTimeIso)}-
                                      {formatTimeShort(b.endTimeIso)}
                                    </span>
                                  </span>
                                  {isPending && (
                                    <span className="rounded bg-amber-500/20 px-1 text-[9px] text-amber-900 shrink-0">
                                      รออนุมัติ
                                    </span>
                                  )}
                                </div>
                                <div className="font-semibold truncate mt-0.5">{b.title}</div>
                                <div className="text-[9px] opacity-75 truncate">{b.roomName}</div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Bottom Quick Book Action */}
                    {cell.isCurrentMonth && cell.isBookable && (
                      <div className="pt-1.5 mt-1 flex justify-end opacity-85 group-hover:opacity-100 transition">
                        <Link
                          href={bookHref}
                          className="inline-flex items-center gap-0.5 rounded-lg border border-orange-200/90 bg-white/90 px-2 py-0.5 text-[10px] font-bold text-orange-700 hover:bg-orange-600 hover:text-white hover:border-orange-600 shadow-2xs transition"
                        >
                          <Plus className="h-2.5 w-2.5" />
                          <span>{isTh ? "ขอใช้ห้องวันนี้" : "Book"}</span>
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly Summary Card: Wan Phra & Holidays in Selected Month */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Wan Phra Summary */}
            <div className="rounded-2xl border border-amber-200/90 bg-amber-50/40 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                  <span>🪷</span>
                  <span>
                    วันพระประจำเดือน{THAI_MONTHS[currentMonth]} พ.ศ. {currentYear + 543}
                  </span>
                </h4>
                <span className="rounded-full bg-amber-200/70 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                  {currentMonthHighlights.wanPhraDays.length} วัน
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentMonthHighlights.wanPhraDays.map((c) => (
                  <div
                    key={c.isoDate}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs ${
                      c.lunar.isMajorWanPhra
                        ? "border-amber-400 bg-amber-100/90 text-amber-950 font-bold"
                        : "border-amber-200 bg-white text-slate-800 font-medium"
                    }`}
                  >
                    <span className="font-extrabold text-orange-700">
                      วันที่ {c.dayNumber}
                    </span>
                    <span className="text-[11px] text-amber-900">
                      ({c.lunar.fullLunarLabel})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Public & Buddhist Holidays Summary */}
            <div className="rounded-2xl border border-rose-200/80 bg-rose-50/30 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-rose-950 flex items-center gap-1.5">
                  <span>🔴</span>
                  <span>
                    วันสำคัญและวันหยุดราชการประจำเดือน{THAI_MONTHS[currentMonth]} พ.ศ.{" "}
                    {currentYear + 543}
                  </span>
                </h4>
                <span className="rounded-full bg-rose-200/70 px-2 py-0.5 text-[10px] font-bold text-rose-900">
                  {currentMonthHighlights.holidayDays.length} วัน
                </span>
              </div>
              {currentMonthHighlights.holidayDays.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {currentMonthHighlights.holidayDays.map((c) =>
                    c.holidays.map((h) => (
                      <div
                        key={`${c.isoDate}-${h.nameTh}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-800"
                      >
                        <span className="font-extrabold text-rose-700">
                          วันที่ {c.dayNumber}:
                        </span>
                        <span>{isTh ? h.nameTh : h.nameEn}</span>
                        {h.isPublicHoliday && (
                          <span className="rounded bg-rose-100 px-1.5 py-0.2 text-[10px] font-bold text-rose-800">
                            วันหยุดราชการ
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  ไม่มีวันหยุดนักขัตฤกษ์ในเดือนนี้
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* VIEW 2: LIST TABLE VIEW */
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 p-1 text-xs">
              <button
                type="button"
                onClick={() => setListFilterScope("MONTH")}
                className={`rounded-lg px-3 py-1 font-bold transition ${
                  listFilterScope === "MONTH"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                ประจำเดือน{THAI_MONTHS[currentMonth]} {currentYear + 543}
              </button>
              <button
                type="button"
                onClick={() => setListFilterScope("UPCOMING")}
                className={`rounded-lg px-3 py-1 font-bold transition ${
                  listFilterScope === "UPCOMING"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                รายการที่กำลังจะมาถึงทั้งหมด
              </button>
            </div>
            <span className="text-xs text-muted-foreground font-semibold">
              พบ {listBookings.length} รายการ
            </span>
          </div>

          {listBookings.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border bg-card shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/60 border-b text-muted-foreground font-semibold">
                    <tr>
                      <th className="p-4">{isTh ? "วันและเวลา" : "Date & Time"}</th>
                      <th className="p-4">{isTh ? "ห้องประชุม" : "Room"}</th>
                      <th className="p-4">{isTh ? "หัวข้อการประชุม / กิจกรรม" : "Topic"}</th>
                      <th className="p-4">{isTh ? "ผู้ขอใช้ / หน่วยงาน" : "Requester"}</th>
                      <th className="p-4 text-center">{isTh ? "สถานะ" : "Status"}</th>
                      <th className="p-4 text-right">{isTh ? "รายละเอียด" : "Details"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {listBookings.map((b) => {
                      const meta = parseBookingRemark(b.remark);
                      const lunar = getThaiLunarDate(new Date(b.startTimeIso));
                      return (
                        <tr
                          key={b.id}
                          onClick={() => setActiveBooking(b)}
                          className="hover:bg-muted/30 transition cursor-pointer"
                        >
                          <td className="p-4">
                            <div className="font-bold text-foreground">
                              {new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(
                                new Date(b.startTimeIso)
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground font-mono">
                              {formatTimeShort(b.startTimeIso)} -{" "}
                              {formatTimeShort(b.endTimeIso)} น.
                            </div>
                            {lunar.isWanPhra && (
                              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                                🪷 วันพระ ({lunar.wanPhraShortLabel})
                              </span>
                            )}
                          </td>
                          <td className="p-4 font-semibold text-foreground">{b.roomName}</td>
                          <td className="p-4">
                            <div className="font-semibold text-foreground">{b.title}</div>
                            {meta.purposeType && (
                              <span className="inline-block mt-0.5 rounded-md bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground font-medium">
                                เพื่อ: {getPurposeLabel(meta.purposeType, meta.purposeOther)}
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-muted-foreground">
                            <div className="font-medium text-foreground">
                              {meta.requesterName || b.requesterNameFallback}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {meta.requesterDepartment || "-"}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            {b.status === "APPROVED" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[11px] font-bold">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>อนุมัติแล้ว</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-[11px] font-bold">
                                <Clock className="h-3 w-3" />
                                <span>รออนุมัติ</span>
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveBooking(b);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                            >
                              <Info className="h-3 w-3 text-orange-600" />
                              <span>ดูข้อมูล</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground border rounded-2xl bg-muted/20">
              {isTh
                ? "ไม่มีรายการขอใช้ห้องประชุมในช่วงเวลาที่เลือก"
                : "No meeting room bookings found for the selected period."}
            </div>
          )}
        </div>
      )}

      {/* QUICK PREVIEW DIALOG (LiyonDialog) */}
      <LiyonDialog
        open={Boolean(activeBooking)}
        onOpenChange={(open) => {
          if (!open) setActiveBooking(null);
        }}
      >
        <LiyonDialogCloseButton label="ปิดหน้าต่าง" />
        <LiyonDialogHeader
          title={activeBooking?.title || "รายละเอียดการขอใช้ห้องประชุม"}
          description={activeBooking?.roomName}
        />
        {activeBooking && activeBookingMeta && (
          <LiyonDialogBody className="space-y-4 text-xs">
            {/* Status & Date Banner */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-orange-200 bg-orange-50/60 p-3.5">
              <div className="space-y-0.5">
                <div className="text-[11px] font-semibold text-orange-800 flex items-center gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  <span>
                    {new Intl.DateTimeFormat("th-TH", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }).format(new Date(activeBooking.startTimeIso))}
                  </span>
                </div>
                <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-orange-600" />
                  <span>
                    เวลา {formatTimeShort(activeBooking.startTimeIso)} -{" "}
                    {formatTimeShort(activeBooking.endTimeIso)} น.
                  </span>
                </div>
              </div>

              {activeBooking.status === "APPROVED" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 text-white px-3 py-1 text-xs font-bold shadow-2xs">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>อนุมัติแล้ว</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 text-white px-3 py-1 text-xs font-bold shadow-2xs">
                  <Clock className="h-3.5 w-3.5" />
                  <span>รอพิจารณาอนุมัติ</span>
                </span>
              )}
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 p-3 space-y-1">
                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-orange-600" />
                  <span>ห้องประชุม</span>
                </div>
                <div className="font-bold text-slate-900">{activeBooking.roomName}</div>
                <div className="text-[11px] text-slate-500">
                  ความจุสูงสุด {activeBooking.roomCapacity} รูป/คน
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-3 space-y-1">
                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-orange-600" />
                  <span>วัตถุประสงค์และผู้เข้าร่วม</span>
                </div>
                <div className="font-bold text-slate-900">
                  {getPurposeLabel(activeBookingMeta.purposeType, activeBookingMeta.purposeOther)}
                </div>
                <div className="text-[11px] text-slate-500">
                  ผู้เข้าร่วมประมาณ {activeBookingMeta.attendeeCount || "-"} รูป/คน
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-3 space-y-1 sm:col-span-2">
                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3 text-orange-600" />
                  <span>ผู้ขอใช้ห้องประชุม / หน่วยงาน</span>
                </div>
                <div className="font-bold text-slate-900">
                  {activeBookingMeta.requesterName || activeBooking.requesterNameFallback}
                  {activeBookingMeta.requesterPosition
                    ? ` (${activeBookingMeta.requesterPosition})`
                    : ""}
                </div>
                <div className="text-[11px] text-slate-600">
                  สังกัด: {activeBookingMeta.requesterDepartment || "คณะพุทธศาสตร์ มจร"}
                </div>
              </div>

              {activeBookingMeta.equipments && (
                <div className="rounded-xl border border-slate-200 p-3 space-y-1.5 sm:col-span-2">
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Tv className="h-3 w-3 text-orange-600" />
                    <span>อุปกรณ์โสตทัศนูปกรณ์ที่ขอใช้</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {Boolean(activeBookingMeta.equipments.computer) && (
                      <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                        คอมพิวเตอร์
                      </span>
                    )}
                    {Boolean(activeBookingMeta.equipments.ledDisplay) && (
                      <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                        จอ LED / Projector
                      </span>
                    )}
                    {Boolean(activeBookingMeta.equipments.soundSystem) && (
                      <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                        เครื่องขยายเสียง
                      </span>
                    )}
                    {Boolean(activeBookingMeta.equipments.zoomOnline) && (
                      <span className="rounded-lg bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-800">
                        Zoom Online
                      </span>
                    )}
                    {typeof activeBookingMeta.equipments.other === "string" &&
                      activeBookingMeta.equipments.other.trim() && (
                        <span className="rounded-lg bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                          อื่นๆ: {activeBookingMeta.equipments.other}
                        </span>
                      )}
                  </div>
                </div>
              )}
            </div>
          </LiyonDialogBody>
        )}
        <LiyonDialogFooter>
          <button
            type="button"
            onClick={() => setActiveBooking(null)}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            ปิดหน้าต่าง
          </button>
          {activeBooking && (
            <Link
              href={`/portal/meetings/book?roomId=${activeBooking.roomId}&date=${formatDateToIsoDate(
                new Date(activeBooking.startTimeIso)
              )}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-500 transition"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>ขอใช้ห้องประชุมนี้ในเวลาอื่น</span>
            </Link>
          )}
        </LiyonDialogFooter>
      </LiyonDialog>
    </div>
  );
}
