/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import {
  Printer,
  Calendar,
  Clock,
  MapPin,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_TIMETABLE_PERIODS,
  type TimetablePeriodConfig,
} from "../_internal/validations";

export type { TimetablePeriodConfig };
export { DEFAULT_TIMETABLE_PERIODS };

export interface TimetableSlot {
  id: string;
  dayOfWeek: number; // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun
  startTime: string; // e.g. "09.00"
  endTime: string; // e.g. "11.30"
  courseCode: string;
  courseName: string;
  instructor: string;
  room?: string | null;
  periodLabel?: string | null;
  credits?: number | null;
  notes?: string | null;
}

export interface TimetableData {
  id: string;
  titleTh: string;
  titleEn?: string | null;
  academicYear: string;
  semester: number;
  yearLevel: number;
  room?: string | null;
  termDates?: string | null;
  description?: string | null;
  notes?: string | null;
  scheduleData: TimetableSlot[] | unknown;
  curriculum?: {
    id: string;
    nameTh: string;
    nameEn?: string | null;
    degree: string;
  } | null;
  department?: {
    id: string;
    nameTh: string;
    nameEn?: string | null;
    code?: string | null;
  } | null;
}

interface TimetableGridViewProps {
  timetable: TimetableData;
  periods?: TimetablePeriodConfig[];
  locale?: string;
  showHeaderActions?: boolean;
}

const DEGREE_LABELS: Record<string, { th: string; en: string }> = {
  BACHELOR: { th: "ระดับปริญญาตรี", en: "Bachelor's Degree" },
  MASTER: { th: "ระดับปริญญาโท", en: "Master's Degree" },
  DOCTORATE: { th: "ระดับปริญญาเอก", en: "Doctorate Degree" },
  CERTIFICATE: { th: "หลักสูตรประกาศนียบัตร", en: "Certificate Program" },
};

const ALL_DAYS = [
  { num: 1, th: "จันทร์", en: "Mon.", fullTh: "วันจันทร์", fullEn: "Monday", color: "border-l-amber-400" },
  { num: 2, th: "อังคาร", en: "Tue.", fullTh: "วันอังคาร", fullEn: "Tuesday", color: "border-l-pink-400" },
  { num: 3, th: "พุธ", en: "Wed.", fullTh: "วันพุธ", fullEn: "Wednesday", color: "border-l-emerald-400" },
  { num: 4, th: "พฤหัสบดี", en: "Thu.", fullTh: "วันพฤหัสบดี", fullEn: "Thursday", color: "border-l-orange-400" },
  { num: 5, th: "ศุกร์", en: "Fri.", fullTh: "วันศุกร์", fullEn: "Friday", color: "border-l-blue-400" },
  { num: 6, th: "เสาร์", en: "Sat.", fullTh: "วันเสาร์", fullEn: "Saturday", color: "border-l-purple-400" },
  { num: 7, th: "อาทิตย์", en: "Sun.", fullTh: "วันอาทิตย์", fullEn: "Sunday", color: "border-l-rose-400" },
];

type ColorScheme = "sky" | "emerald" | "purple" | "amber";

const CLASS_PERIOD_COLORS: ColorScheme[] = ["sky", "emerald", "purple", "amber"];

// Helper to convert time string (e.g. "9", "9.00", "09:00", "10.4", "10.40") into minutes
export function parseTimeToMinutes(tStr: string, defaultMinutes = 0): number {
  if (!tStr) return defaultMinutes;
  const clean = tStr.trim().replace(":", ".");
  const parts = clean.split(".");
  const hours = parseInt(parts[0], 10);
  if (Number.isNaN(hours)) return defaultMinutes;
  let mins = 0;
  if (parts.length > 1) {
    const minPart = parts[1].replace(/\D/g, "");
    if (minPart.length === 1) {
      mins = parseInt(minPart, 10) * 10;
    } else if (minPart.length >= 2) {
      mins = parseInt(minPart.substring(0, 2), 10) || 0;
    }
  }
  return hours * 60 + mins;
}

export function TimetableGridView({
  timetable,
  periods,
  locale = "th",
  showHeaderActions = true,
}: TimetableGridViewProps) {
  const slots: TimetableSlot[] = React.useMemo(
    () =>
      Array.isArray(timetable.scheduleData)
        ? (timetable.scheduleData as TimetableSlot[])
        : [],
    [timetable.scheduleData]
  );

  // Sort configured periods or fallback to default MCU Buddhist Studies periods
  const sortedPeriods = React.useMemo(() => {
    const list =
      Array.isArray(periods) && periods.length > 0
        ? periods
        : DEFAULT_TIMETABLE_PERIODS;
    return [...list].sort((a, b) => a.orderIndex - b.orderIndex);
  }, [periods]);

  // Precompute class period color scheme per column index
  const columnColorScheme = React.useMemo(() => {
    const map = new Map<number, ColorScheme>();
    let classIdx = 0;
    sortedPeriods.forEach((p, idx) => {
      if (p.type === "CLASS") {
        map.set(idx, CLASS_PERIOD_COLORS[classIdx % CLASS_PERIOD_COLORS.length]);
        classIdx++;
      } else {
        map.set(idx, "amber");
      }
    });
    return map;
  }, [sortedPeriods]);

  // ซ่อนแถววันศุกร์/เสาร์/อาทิตย์หากไม่มีวิชาเรียนในวันนั้น (ตารางเรียนปกติแสดงวันจันทร์-พฤหัสบดี)
  const activeDays = React.useMemo(() => {
    return ALL_DAYS.filter((d) => {
      if (d.num <= 4) return true;
      return slots.some((s) => s.dayOfWeek === d.num);
    });
  }, [slots]);

  const handlePrint = () => {
    window.print();
  };

  const getSlotsForDay = (dayNum: number) => {
    return slots
      .filter((s) => s.dayOfWeek === dayNum)
      .sort(
        (a, b) =>
          parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime)
      );
  };

  // Match a course slot to its start and end column indices in `sortedPeriods`
  const matchSlotColumns = React.useCallback(
    (slot: TimetableSlot): { startCol: number; endCol: number } => {
      const sStart = parseTimeToMinutes(slot.startTime, 9 * 60);
      const sEnd = parseTimeToMinutes(slot.endTime, sStart + 150);

      const classCols: {
        colIdx: number;
        pStart: number;
        pEnd: number;
        overlap: number;
      }[] = [];

      sortedPeriods.forEach((p, colIdx) => {
        if (p.type !== "CLASS") return;
        const pStart = parseTimeToMinutes(p.startTime, 9 * 60);
        const pEnd = parseTimeToMinutes(p.endTime, pStart + 120);
        const overlap = Math.max(0, Math.min(sEnd, pEnd) - Math.max(sStart, pStart));
        classCols.push({ colIdx, pStart, pEnd, overlap });
      });

      if (classCols.length === 0) {
        return { startCol: 0, endCol: 0 };
      }

      // Significant overlap (>= 35 minutes) avoids false 20-min overlap between 13.00-15.30 and 15.10-17.00
      const significant = classCols.filter((c) => c.overlap >= 35);

      if (significant.length > 0) {
        const startCol = significant[0].colIdx;
        let endCol = startCol;
        // Only span contiguous CLASS columns (do not span across a BREAK column)
        for (let i = 1; i < significant.length; i++) {
          const nextCol = significant[i].colIdx;
          let hasBreakBetween = false;
          for (let k = endCol + 1; k < nextCol; k++) {
            if (sortedPeriods[k]?.type === "BREAK") {
              hasBreakBetween = true;
              break;
            }
          }
          if (!hasBreakBetween && nextCol === endCol + 1) {
            endCol = nextCol;
          } else {
            break;
          }
        }
        return { startCol, endCol };
      }

      // Fallback 1: pick the CLASS column with largest positive overlap
      const bestOverlap = [...classCols].sort((a, b) => b.overlap - a.overlap)[0];
      if (bestOverlap && bestOverlap.overlap > 0) {
        return { startCol: bestOverlap.colIdx, endCol: bestOverlap.colIdx };
      }

      // Fallback 2: pick the CLASS column whose start time is closest to slot's startTime
      const closest = [...classCols].sort(
        (a, b) => Math.abs(a.pStart - sStart) - Math.abs(b.pStart - sStart)
      )[0];
      return { startCol: closest.colIdx, endCol: closest.colIdx };
    },
    [sortedPeriods]
  );

  // Helper renderer for a course box
  const renderCourseCard = (slot: TimetableSlot, colorScheme: ColorScheme) => {
    const colorClasses = {
      sky: "bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-950 dark:text-sky-100 hover:border-sky-400",
      emerald:
        "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100 hover:border-emerald-400",
      purple:
        "bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 text-purple-950 dark:text-purple-100 hover:border-purple-400",
      amber:
        "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-100 hover:border-amber-400",
    }[colorScheme];

    const badgeBg = {
      sky: "bg-sky-600 text-white",
      emerald: "bg-emerald-600 text-white",
      purple: "bg-purple-600 text-white",
      amber: "bg-amber-600 text-white",
    }[colorScheme];

    return (
      <div
        key={slot.id}
        className={`h-full min-h-[105px] p-2.5 rounded-xl border flex flex-col justify-between transition-all shadow-2xs timetable-course-box timetable-course-box-${colorScheme} ${colorClasses}`}
      >
        <div>
          <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
            <span
              className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-md timetable-course-badge timetable-course-badge-${colorScheme} ${badgeBg}`}
            >
              {slot.courseCode}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono timetable-time-badge">
              {slot.startTime} - {slot.endTime} น.
            </span>
          </div>
          <h4
            className={`font-bold text-xs leading-snug line-clamp-2 timetable-course-title-${colorScheme}`}
          >
            {slot.courseName}
          </h4>
        </div>

        <div className="pt-1.5 mt-1 border-t border-black/10 dark:border-white/10 space-y-0.5 text-[11px]">
          {slot.instructor && (
            <p
              className="text-muted-foreground leading-snug line-clamp-2 sm:line-clamp-3 break-words"
              title={slot.instructor}
            >
              👤 {slot.instructor}
            </p>
          )}
          {slot.room && (
            <p className="font-semibold text-amber-700 dark:text-amber-300 text-[10px] line-clamp-1">
              📍 ห้อง {slot.room}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="timetable-container timetable-print-sheet relative bg-card rounded-2xl border border-border shadow-sm p-4 sm:p-6 lg:p-8 space-y-6 print:p-0 print:m-0 print:border-none print:shadow-none print:bg-white print:text-black print:space-y-3 text-card-foreground overflow-hidden">
      {/* ── PRINT WATERMARK (ลายน้ำตรามหาวิทยาลัย/คณะตรงกลางเอกสารเมื่อพิมพ์) ── */}
      <div className="timetable-watermark hidden items-center justify-center pointer-events-none select-none">
        <img
          src="/uploads/mcu-logo.png"
          alt="MCU Watermark"
          className="w-[320px] h-[320px] object-contain grayscale"
          onError={(e) => {
            (e.target as HTMLElement).style.display = "none";
          }}
        />
      </div>

      {/* ── TOP ACTION BAR (Hidden in print) ── */}
      {showHeaderActions && (
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border/80 print:hidden">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {locale === "th"
                  ? `ภาคการศึกษาที่ ${timetable.semester} ปีการศึกษา ${timetable.academicYear}`
                  : `Semester ${timetable.semester}, Academic Year ${timetable.academicYear}`}
              </span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>
                {locale === "th"
                  ? `ชั้นปีที่ ${timetable.yearLevel}`
                  : `Year ${timetable.yearLevel}`}
              </span>
            </span>
            {timetable.curriculum?.degree && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs font-semibold">
                <BookOpen className="w-3.5 h-3.5" />
                <span>
                  {locale === "th"
                    ? DEGREE_LABELS[timetable.curriculum.degree]?.th ||
                      timetable.curriculum.degree
                    : DEGREE_LABELS[timetable.curriculum.degree]?.en ||
                      timetable.curriculum.degree}
                </span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-2 text-xs font-medium cursor-pointer hover:bg-muted"
            >
              <Printer className="w-3.5 h-3.5 text-primary" />
              <span>{locale === "th" ? "พิมพ์ / บันทึก PDF" : "Print / Save PDF"}</span>
            </Button>
          </div>
        </div>
      )}

      {/* ── OFFICIAL HEADER (Styled like university document) ── */}
      <div className="relative text-center border-b border-border pb-6 print:pb-3 space-y-2 print:space-y-1">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 print:gap-2">
          <div className="flex items-center gap-3 text-left">
            <div className="w-14 h-14 print:w-12 print:h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center p-1.5 shrink-0 overflow-hidden print:border-black/20">
              <img
                src="/uploads/mcu-logo.png"
                alt="MCU Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
            <div>
              <p className="text-xs print:text-[11px] font-semibold text-muted-foreground print:text-black uppercase tracking-wider">
                {timetable.department?.nameTh ||
                  "คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย"}
              </p>
              <p className="text-xs print:text-[10px] text-muted-foreground print:text-neutral-700 font-sans">
                {timetable.department?.nameEn ||
                  "Faculty of Buddhism, Mahachulalongkornrajavidyalaya University, Wangnoi, Ayutthaya"}
              </p>
            </div>
          </div>

          {timetable.room && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 print:px-2.5 print:py-1 rounded-xl print:rounded-lg bg-amber-500/10 border border-amber-500/30 print:border-black/20 text-amber-800 dark:text-amber-300 print:text-black font-semibold text-xs sm:text-sm print:text-xs">
              <MapPin className="w-4 h-4 print:w-3 print:h-3 text-amber-600 dark:text-amber-400 print:text-black" />
              <span>ห้อง {timetable.room}</span>
            </div>
          )}
        </div>

        <div className="pt-2 print:pt-1 text-center">
          <h2 className="text-xl sm:text-2xl print:text-lg font-bold tracking-tight text-foreground print:text-black">
            {timetable.titleTh}
          </h2>
          {timetable.titleEn && (
            <p className="text-sm print:text-xs text-muted-foreground print:text-neutral-700 font-medium mt-0.5">
              {timetable.titleEn}
            </p>
          )}

          {timetable.termDates && (
            <p className="text-xs print:text-[11px] text-muted-foreground print:text-neutral-800 font-medium mt-1 flex items-center justify-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary print:text-black" />
              <span>{timetable.termDates}</span>
            </p>
          )}
        </div>
      </div>

      {/* ── DESKTOP WEEKLY TIMETABLE TABLE (Dynamic Periods & Times) ── */}
      <div className="hidden md:block print:block overflow-x-auto print:overflow-visible rounded-xl print:rounded-lg border border-border print:border-black/30 shadow-2xs print:shadow-none">
        <table className="w-full border-collapse text-left text-xs min-w-[900px] print:min-w-full print:w-full">
          <thead>
            <tr className="bg-muted text-foreground font-semibold border-b border-border divide-x divide-border">
              <th className="p-3 w-28 text-center bg-muted/90 align-middle">
                <div className="font-bold text-sm">
                  {locale === "th" ? "วัน / คาบ" : "Day / Period"}
                </div>
                <div className="text-[10px] text-muted-foreground font-normal mt-0.5">
                  {locale === "th" ? "เวลาเรียน" : "Class Time"}
                </div>
              </th>

              {sortedPeriods.map((period, idx) => {
                if (period.type === "BREAK") {
                  return (
                    <th
                      key={period.id || idx}
                      className="p-2 text-center w-28 bg-amber-500/10 text-amber-900 dark:text-amber-200 border-x border-border align-middle print-text-amber"
                    >
                      <div className="font-bold text-xs">
                        {locale === "th"
                          ? period.labelTh
                          : period.labelEn || period.labelTh}
                      </div>
                      {(period.subLabelTh || period.subLabelEn) && (
                        <div className="text-[10px] text-amber-800/80 dark:text-amber-300/80 font-medium mt-0.5">
                          {locale === "th"
                            ? period.subLabelTh
                            : period.subLabelEn || period.subLabelTh}
                        </div>
                      )}
                      <div className="text-[10px] text-muted-foreground font-mono font-normal mt-0.5 print:text-neutral-700">
                        {period.startTime} - {period.endTime} น.
                      </div>
                    </th>
                  );
                }

                const scheme = columnColorScheme.get(idx) || "sky";
                const headerTheme = {
                  sky: "bg-sky-500/10 text-sky-950 dark:text-sky-200 print-text-sky",
                  emerald:
                    "bg-emerald-500/10 text-emerald-950 dark:text-emerald-200 print-text-emerald",
                  purple:
                    "bg-purple-500/10 text-purple-950 dark:text-purple-200 print-text-purple",
                  amber:
                    "bg-amber-500/10 text-amber-950 dark:text-amber-200 print-text-amber",
                }[scheme];

                return (
                  <th
                    key={period.id || idx}
                    className={`p-2.5 text-center align-middle ${headerTheme}`}
                  >
                    {(period.subLabelTh || period.subLabelEn) && (
                      <div className="text-[10px] opacity-80 font-semibold mb-0.5">
                        {locale === "th"
                          ? period.subLabelTh
                          : period.subLabelEn || period.subLabelTh}
                      </div>
                    )}
                    <div className="font-bold text-xs flex items-center justify-center gap-1">
                      <span>
                        {locale === "th"
                          ? period.labelTh
                          : period.labelEn || period.labelTh}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono font-medium mt-0.5 print:text-neutral-700">
                      {period.startTime} - {period.endTime} น.
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {activeDays.map((day) => {
              const daySlots = getSlotsForDay(day.num);
              const placements = daySlots.map((slot) => ({
                slot,
                ...matchSlotColumns(slot),
              }));

              const cells: React.ReactNode[] = [];
              let colIdx = 0;

              while (colIdx < sortedPeriods.length) {
                const period = sortedPeriods[colIdx];

                if (period.type === "BREAK") {
                  cells.push(
                    <td
                      key={`break-${period.id || colIdx}`}
                      className="p-2 text-center align-middle bg-amber-500/10 text-amber-900 dark:text-amber-200 text-[11px] font-semibold border-x border-border"
                    >
                      <div className="py-2 flex flex-col items-center justify-center gap-1">
                        <span>
                          {locale === "th"
                            ? period.labelTh
                            : period.labelEn || period.labelTh}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono font-normal">
                          {period.startTime}-{period.endTime}
                        </span>
                      </div>
                    </td>
                  );
                  colIdx++;
                  continue;
                }

                // Find slots starting in this CLASS column
                const startingHere = placements.filter(
                  (pl) => pl.startCol === colIdx
                );

                if (startingHere.length > 0) {
                  // Determine max span without crossing a BREAK or another slot's startCol
                  const desiredEndCol = Math.max(
                    ...startingHere.map((pl) => pl.endCol)
                  );
                  let actualEndCol = colIdx;

                  for (let nextCol = colIdx + 1; nextCol <= desiredEndCol; nextCol++) {
                    if (sortedPeriods[nextCol]?.type === "BREAK") break;
                    const hasOtherSlotStarting = placements.some(
                      (pl) => pl.startCol === nextCol
                    );
                    if (hasOtherSlotStarting) break;
                    actualEndCol = nextCol;
                  }

                  const span = actualEndCol - colIdx + 1;
                  const scheme = columnColorScheme.get(colIdx) || "sky";
                  const cellBg = {
                    sky: "bg-sky-500/5",
                    emerald: "bg-emerald-500/5",
                    purple: "bg-purple-500/5",
                    amber: "bg-amber-500/5",
                  }[scheme];

                  cells.push(
                    <td
                      key={`class-${day.num}-${colIdx}`}
                      colSpan={span}
                      className={`p-2 align-top ${cellBg}`}
                    >
                      <div className="space-y-2 h-full">
                        {startingHere.map((pl) =>
                          renderCourseCard(pl.slot, scheme)
                        )}
                      </div>
                    </td>
                  );
                  colIdx += span;
                } else {
                  cells.push(
                    <td
                      key={`empty-${day.num}-${colIdx}`}
                      className="p-2 text-center text-muted-foreground/30 align-middle"
                    >
                      -
                    </td>
                  );
                  colIdx++;
                }
              }

              return (
                <tr
                  key={day.num}
                  className="divide-x divide-border hover:bg-muted/20 transition-colors"
                >
                  {/* Day Column */}
                  <td
                    className={`p-3 font-bold text-center border-l-4 ${day.color} bg-muted/40 align-middle`}
                  >
                    <div className="text-sm font-bold text-foreground">
                      {locale === "th" ? day.th : day.en}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-normal">
                      {locale === "th" ? day.fullTh : day.fullEn}
                    </div>
                  </td>

                  {cells}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── MOBILE RESPONSIVE CARDS VIEW (For screens < md) ── */}
      <div className="md:hidden space-y-4 print:hidden">
        {activeDays.map((day) => {
          const daySlots = getSlotsForDay(day.num);
          if (daySlots.length === 0) return null;

          return (
            <div
              key={day.num}
              className={`rounded-xl border border-border bg-card p-4 space-y-3 border-l-4 ${day.color}`}
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <span>{locale === "th" ? day.fullTh : day.fullEn}</span>
                </h4>
                <span className="text-xs text-muted-foreground font-medium">
                  {daySlots.length} {locale === "th" ? "วิชา" : "courses"}
                </span>
              </div>

              <div className="space-y-2.5 pt-1">
                {daySlots.map((s) => {
                  const { startCol } = matchSlotColumns(s);
                  const matchedPeriod = sortedPeriods[startCol];
                  const scheme = columnColorScheme.get(startCol) || "sky";
                  const tagColor = {
                    sky: "bg-sky-500/10 text-sky-800 dark:text-sky-300 border-sky-300/40",
                    emerald:
                      "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-300/40",
                    purple:
                      "bg-purple-500/10 text-purple-800 dark:text-purple-300 border-purple-300/40",
                    amber:
                      "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-300/40",
                  }[scheme];
                  const periodLabelText = matchedPeriod
                    ? locale === "th"
                      ? matchedPeriod.labelTh
                      : matchedPeriod.labelEn || matchedPeriod.labelTh
                    : s.periodLabel || "";

                  return (
                    <div
                      key={s.id}
                      className="p-3 rounded-lg border border-border/80 bg-background/70 space-y-1.5 shadow-2xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                            {s.courseCode}
                          </span>
                          {periodLabelText && (
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${tagColor}`}
                            >
                              {periodLabelText}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {s.startTime} - {s.endTime} น.
                          </span>
                        </span>
                      </div>

                      <div className="font-bold text-sm text-foreground">
                        {s.courseName}
                      </div>

                      {s.instructor && (
                        <div className="text-xs text-muted-foreground">
                          👤 {s.instructor}
                        </div>
                      )}

                      {s.room && (
                        <div className="text-xs text-amber-700 dark:text-amber-300 font-medium inline-block px-1.5 py-0.5 rounded bg-amber-500/10">
                          📍 ห้อง {s.room}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── FOOTNOTE / NOTES SECTION: 2 COLUMNS (THAI LEFT, ENGLISH RIGHT) ── */}
      <div className="p-4 sm:p-5 print:p-2 rounded-xl print:rounded-none border border-border/80 print:border-none bg-card/60 print:bg-transparent text-xs print:text-[10.5px] print:break-inside-avoid shadow-2xs font-sans">
        <div className="grid grid-cols-2 gap-4 sm:gap-8 divide-x divide-border/60">
          {/* คอลัมน์ซ้าย: ภาษาไทย */}
          <div className="space-y-1.5 text-foreground/90 print:text-black leading-relaxed font-normal">
            <div className="font-bold text-foreground print:text-black text-xs sm:text-sm tracking-wide mb-1.5">
              หมายเหตุ :
            </div>
            <p>
              ๑. วันพระและวันนักขัตฤกษ์เป็นวันหยุดทั่วไป (ตารางเรียนวันใดตรงกับวันพระให้ยกไปเรียนวันศุกร์)
            </p>
            <p>
              ๒. เครื่องหมายดอกจัน (*) อยู่หลังชื่อรายวิชาหมายถึง ข้อสอบกลาง
            </p>
            <p>
              ๓. เครื่องหมายดอกจัน (*) อยู่หลังชื่อ หมายถึง อาจารย์ผู้รับผิดชอบรายวิชา
            </p>
            <p>
              ๔. วันพระกับวันอาทิตย์เป็นวันหยุดประจำสัปดาห์
            </p>
          </div>

          {/* คอลัมน์ขวา: ภาษาอังกฤษ */}
          <div className="pl-4 sm:pl-8 print:pl-6 space-y-1.5 text-foreground/90 print:text-black leading-relaxed font-normal">
            <div className="font-bold text-foreground print:text-black text-xs sm:text-sm tracking-wide mb-1.5">
              Note :
            </div>
            <p>
              1. Buddhist Holy Days (Wan Phra) and public holidays are general holidays (any class falling on a Buddhist Holy Day will be moved to Friday).
            </p>
            <p>
              2. An asterisk (*) after a course name indicates a Centralized Examination.
            </p>
            <p>
              3. An asterisk (*) after an instructor&apos;s name indicates the Course Coordinator / Primary Instructor.
            </p>
            <p>
              4. Buddhist Holy Days (Wan Phra) and Sundays are weekly holidays.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
