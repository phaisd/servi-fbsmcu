/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import {
  Printer,
  Calendar,
  Clock,
  MapPin,
  GraduationCap,
  Info,
  Building2,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
  scheduleData: TimetableSlot[] | any;
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
  locale?: string;
  showHeaderActions?: boolean;
}

const DEGREE_LABELS: Record<string, { th: string; en: string }> = {
  BACHELOR: { th: "ระดับปริญญาตรี", en: "Bachelor's Degree" },
  MASTER: { th: "ระดับปริญญาโท", en: "Master's Degree" },
  DOCTORATE: { th: "ระดับปริญญาเอก", en: "Doctorate Degree" },
  CERTIFICATE: { th: "หลักสูตรประกาศนียบัตร", en: "Certificate Program" },
};

const DAY_NAMES = [
  { num: 1, th: "จันทร์", en: "Mon.", fullTh: "วันจันทร์", fullEn: "Monday", color: "border-l-amber-400" },
  { num: 2, th: "อังคาร", en: "Tue.", fullTh: "วันอังคาร", fullEn: "Tuesday", color: "border-l-pink-400" },
  { num: 3, th: "พุธ", en: "Wed.", fullTh: "วันพุธ", fullEn: "Wednesday", color: "border-l-emerald-400" },
  { num: 4, th: "พฤหัสบดี", en: "Thu.", fullTh: "วันพฤหัสบดี", fullEn: "Thursday", color: "border-l-orange-400" },
  { num: 5, th: "ศุกร์", en: "Fri.", fullTh: "วันศุกร์", fullEn: "Friday", color: "border-l-blue-400" },
];

export function TimetableGridView({
  timetable,
  locale = "th",
  showHeaderActions = true,
}: TimetableGridViewProps) {
  const isEn = locale === "en" || Boolean(timetable.titleEn && !timetable.titleTh.includes("พุทธศาสตร"));

  const slots: TimetableSlot[] = Array.isArray(timetable.scheduleData)
    ? (timetable.scheduleData as TimetableSlot[])
    : [];

  const handlePrint = () => {
    window.print();
  };

  const getSlotsForDay = (dayNum: number) => {
    return slots
      .filter((s) => s.dayOfWeek === dayNum)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  // Helper to convert time string (e.g. "9", "9.00", "09:00", "10.4", "10.40") into minutes
  const parseTimeToMinutes = (tStr: string, defaultMinutes = 0): number => {
    if (!tStr) return defaultMinutes;
    const clean = tStr.trim().replace(":", ".");
    const parts = clean.split(".");
    const hours = parseInt(parts[0], 10) || 0;
    let mins = 0;
    if (parts.length > 1) {
      const minPart = parts[1];
      // If "10.4" -> 40 mins, "10.04" -> 4 mins, "10.40" -> 40 mins
      if (minPart.length === 1) {
        mins = parseInt(minPart, 10) * 10;
      } else {
        mins = parseInt(minPart.substring(0, 2), 10) || 0;
      }
    }
    return hours * 60 + mins;
  };

  // Period time definitions in minutes from 00:00
  // Morning: P1=09:00-09:50, P2=09:50-10:40, P3=10:40-11:30
  // Afternoon 1: P4=12:30-13:20 (or 13:00-13:50), P5=13:20-14:10 (or 13:50-14:40), P6=14:10-15:00/15:30
  // Afternoon 2: P7=15:10/15:30-16:00/16:20, P8=16:00/16:20-17:00
  const getSlotPeriodRange = (startTime: string, endTime: string) => {
    const startM = parseTimeToMinutes(startTime, 9 * 60);
    const endM = parseTimeToMinutes(endTime, startM + 150);

    // Morning check (< 12:00)
    if (startM < 12 * 60) {
      // P1: ~09:00 (540m)
      // P2: ~09:50 (590m)
      // P3: ~10:40 (640m) - 11:30 (690m)
      let startP = 1;
      if (startM >= 570) {
        startP = 2; // ~09:50
      }
      if (startM >= 620) {
        startP = 3; // ~10:40
      }

      let endP = 3;
      if (endM <= 600) {
        endP = 1; // ends by 10:00 -> P1 only
      } else if (endM <= 655) {
        endP = 2; // ends by 10:55 -> P2 (e.g. 10.40)
      } else {
        endP = 3; // ends ~11:30 -> P3
      }

      if (endP < startP) endP = startP;
      return { section: "morning" as const, startP, endP, span: endP - startP + 1 };
    }

    // Afternoon 1 check (12:00 <= start < 15:00)
    if (startM < 15 * 60) {
      // P4: ~12:30/13:00 (750-780m)
      // P5: ~13:20/13:50 (800-830m)
      // P6: ~14:10/14:40 (850-880m) - 15:10/15:30 (910-930m)
      let startP = 4;
      if (startM >= 800) startP = 5;
      if (startM >= 850) startP = 6;

      let endP = 6;
      if (endM <= 820) endP = 4; // ~13:20 or ~13:40
      else if (endM <= 875) endP = 5; // ~14:10 or ~14:30
      else endP = 6;

      if (endP < startP) endP = startP;
      return { section: "afternoon1" as const, startP, endP, span: endP - startP + 1 };
    }

    // Afternoon 2 check (start >= 15:00)
    // P7: ~15:10/15:30 (910-930m)
    // P8: ~16:00/16:20 (960-980m) - 17:00 (1020m)
    let startP = 7;
    if (startM >= 960) startP = 8;

    let endP = 8;
    if (endM <= 975) endP = 7; // ends ~16:00/16:15
    else endP = 8;

    if (endP < startP) endP = startP;
    return { section: "afternoon2" as const, startP, endP, span: endP - startP + 1 };
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
                {locale === "th" ? `ชั้นปีที่ ${timetable.yearLevel}` : `Year ${timetable.yearLevel}`}
              </span>
            </span>
            {timetable.curriculum?.degree && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs font-semibold">
                <BookOpen className="w-3.5 h-3.5" />
                <span>
                  {locale === "th"
                    ? DEGREE_LABELS[timetable.curriculum.degree]?.th || timetable.curriculum.degree
                    : DEGREE_LABELS[timetable.curriculum.degree]?.en || timetable.curriculum.degree}
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
                {timetable.department?.nameTh || "คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย"}
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

      {/* ── DESKTOP WEEKLY TIMETABLE TABLE (Exact Layout of University Document) ── */}
      <div className="hidden md:block print:block overflow-x-auto print:overflow-visible rounded-xl print:rounded-lg border border-border print:border-black/30 shadow-2xs print:shadow-none">
        <table className="w-full border-collapse text-left text-xs min-w-[900px] print:min-w-full print:w-full">
          <thead>
            {/* Top Header Row: Macro Periods */}
            <tr className="bg-muted text-foreground font-semibold border-b border-border divide-x divide-border">
              <th rowSpan={2} className="p-3 w-28 text-center bg-muted/90 align-middle">
                <div className="font-bold text-sm">
                  {locale === "th" ? "วัน / คาบ" : "Day / Period"}
                </div>
                <div className="text-[10px] text-muted-foreground font-normal mt-0.5">
                  {locale === "th" ? "เวลาเรียน" : "Class Time"}
                </div>
              </th>

              {/* ช่วงเช้า (3 คาบ: คาบ 1 - 3) */}
              <th colSpan={3} className="p-2 text-center bg-sky-500/10 text-sky-950 dark:text-sky-200 print-text-sky">
                <div className="font-bold flex items-center justify-center gap-1.5 text-xs">
                  <span>{locale === "th" ? "ช่วงเช้า (3 คาบ)" : "Morning (3 Periods)"}</span>
                </div>
                <div className="text-[11px] text-muted-foreground font-medium print:text-neutral-700">
                  09.00 - 11.30 น.
                </div>
              </th>

              {/* พักฉันเพล / รับประทานอาหารกลางวัน */}
              <th
                rowSpan={2}
                className="p-2 text-center w-24 bg-amber-500/10 text-amber-900 dark:text-amber-200 border-x border-border align-middle print-text-amber"
              >
                <div className="font-bold text-[11px]">
                  {locale === "th" ? "พักฉันเพล" : "Lunch Break"}
                </div>
                <div className="text-[10px] text-muted-foreground font-normal mt-0.5 print:text-neutral-700">
                  11.30 - 12.30 / 13.00 น.
                </div>
              </th>

              {/* ช่วงบ่าย (1) (3 คาบ: คาบ 4 - 6) */}
              <th colSpan={3} className="p-2 text-center bg-emerald-500/10 text-emerald-950 dark:text-emerald-200 print-text-emerald">
                <div className="font-bold flex items-center justify-center gap-1.5 text-xs">
                  <span>{locale === "th" ? "ช่วงบ่าย 1 (3 คาบ)" : "Afternoon 1 (3 Periods)"}</span>
                </div>
                <div className="text-[11px] text-muted-foreground font-medium print:text-neutral-700">
                  12.30 / 13.00 - 15.10 / 15.30 น.
                </div>
              </th>

              {/* ช่วงบ่าย (2) (2 คาบ: คาบ 7 - 8) */}
              <th colSpan={2} className="p-2 text-center bg-purple-500/10 text-purple-950 dark:text-purple-200 print-text-purple">
                <div className="font-bold flex items-center justify-center gap-1.5 text-xs">
                  <span>{locale === "th" ? "ช่วงบ่าย 2 (2 คาบ)" : "Afternoon 2 (2 Periods)"}</span>
                </div>
                <div className="text-[11px] text-muted-foreground font-medium print:text-neutral-700">
                  15.10 / 15.30 - 17.00 น.
                </div>
              </th>
            </tr>

            {/* Sub Header Row: Individual Periods (1 to 8) */}
            <tr className="bg-muted/60 text-foreground font-medium border-b border-border divide-x divide-border text-[11px]">
              {/* คาบ 1 */}
              <th className="p-1.5 text-center w-[11%]">
                <div className="font-bold text-foreground">คาบ 1</div>
                <div className="text-[10px] text-muted-foreground font-mono">09.00-09.50</div>
              </th>
              {/* คาบ 2 */}
              <th className="p-1.5 text-center w-[11%]">
                <div className="font-bold text-foreground">คาบ 2</div>
                <div className="text-[10px] text-muted-foreground font-mono">09.50-10.40</div>
              </th>
              {/* คาบ 3 */}
              <th className="p-1.5 text-center w-[11%]">
                <div className="font-bold text-foreground">คาบ 3</div>
                <div className="text-[10px] text-muted-foreground font-mono">10.40-11.30</div>
              </th>

              {/* คาบ 4 */}
              <th className="p-1.5 text-center w-[11%]">
                <div className="font-bold text-foreground">คาบ 4</div>
                <div className="text-[10px] text-muted-foreground font-mono">12.30/13.00</div>
              </th>
              {/* คาบ 5 */}
              <th className="p-1.5 text-center w-[11%]">
                <div className="font-bold text-foreground">คาบ 5</div>
                <div className="text-[10px] text-muted-foreground font-mono">13.20/13.50</div>
              </th>
              {/* คาบ 6 */}
              <th className="p-1.5 text-center w-[11%]">
                <div className="font-bold text-foreground">คาบ 6</div>
                <div className="text-[10px] text-muted-foreground font-mono">14.10/14.40</div>
              </th>

              {/* คาบ 7 */}
              <th className="p-1.5 text-center w-[11%]">
                <div className="font-bold text-foreground">คาบ 7</div>
                <div className="text-[10px] text-muted-foreground font-mono">15.10/15.30</div>
              </th>
              {/* คาบ 8 */}
              <th className="p-1.5 text-center w-[11%]">
                <div className="font-bold text-foreground">คาบ 8</div>
                <div className="text-[10px] text-muted-foreground font-mono">16.00-17.00</div>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {DAY_NAMES.map((day) => {
              const daySlots = getSlotsForDay(day.num);

              // Helper: calculate period bounds for a slot
              // Morning:
              //   If slot starts ~09.00 and ends ~11.30 -> span 3 (p1, p2, p3)
              //   If slot starts ~09.00 and ends ~10.40 -> span 2 (p1, p2)
              //   If slot starts ~09.50 and ends ~11.30 -> span 2 (p2, p3)
              // Afternoon 1:
              //   If slot starts ~12.30/13.00 and ends ~15.10/15.30 -> span 3 (p4, p5, p6)
              //   If slot starts ~12.30 and ends ~14.10 -> span 2 (p4, p5)
              //   If slot starts ~14.10 and ends ~15.50 -> span 2 (p6, p7)
              // Afternoon 2:
              //   If slot starts ~15.10/15.30 and ends ~17.00 -> span 2 (p7, p8)
              //   If slot starts ~15.10 and ends ~16.00 -> span 1 (p7)

              const morningSlots = daySlots.filter((s) => {
                const hour = parseFloat(s.startTime.replace(":", "."));
                return hour < 12.0;
              });

              const afternoon1Slots = daySlots.filter((s) => {
                const hour = parseFloat(s.startTime.replace(":", "."));
                return hour >= 12.0 && hour < 15.0;
              });

              const afternoon2Slots = daySlots.filter((s) => {
                const hour = parseFloat(s.startTime.replace(":", "."));
                return hour >= 15.0;
              });

              // Helper renderer for a course box
              const renderCourseCard = (
                slot: TimetableSlot,
                colorScheme: "sky" | "emerald" | "purple" | "amber"
              ) => {
                const colorClasses = {
                  sky: "bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-950 dark:text-sky-100 hover:border-sky-400",
                  emerald: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100 hover:border-emerald-400",
                  purple: "bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 text-purple-950 dark:text-purple-100 hover:border-purple-400",
                  amber: "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-100 hover:border-amber-400",
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
                        <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-md timetable-course-badge timetable-course-badge-${colorScheme} ${badgeBg}`}>
                          {slot.courseCode}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono timetable-time-badge">
                          {slot.startTime} - {slot.endTime} น.
                        </span>
                      </div>
                      <h4 className={`font-bold text-xs leading-snug line-clamp-2 timetable-course-title-${colorScheme}`}>
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
                <tr
                  key={day.num}
                  className="divide-x divide-border hover:bg-muted/20 transition-colors"
                >
                  {/* Day Column */}
                  <td className={`p-3 font-bold text-center border-l-4 ${day.color} bg-muted/40 align-middle`}>
                    <div className="text-sm font-bold text-foreground">
                      {locale === "th" ? day.th : day.en}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-normal">
                      {locale === "th" ? day.fullTh : day.fullEn}
                    </div>
                  </td>

                  {/* Morning Section (3 Columns: P1, P2, P3) */}
                  {(() => {
                    // Build grid for P1, P2, P3
                    const morningCells: React.ReactNode[] = [];
                    let p = 1;
                    while (p <= 3) {
                      const matched = morningSlots.find((s) => {
                        const range = getSlotPeriodRange(s.startTime, s.endTime);
                        return range.startP === p;
                      });

                      if (matched) {
                        const range = getSlotPeriodRange(matched.startTime, matched.endTime);
                        const span = Math.min(range.span, 3 - p + 1);
                        morningCells.push(
                          <td
                            key={matched.id}
                            colSpan={span}
                            className="p-2 align-top bg-sky-500/5"
                          >
                            {renderCourseCard(matched, "sky")}
                          </td>
                        );
                        p += span;
                      } else {
                        // Check if p is inside an ongoing span from previous slot
                        const inside = morningSlots.some((s) => {
                          const range = getSlotPeriodRange(s.startTime, s.endTime);
                          return range.startP < p && range.endP >= p;
                        });
                        if (!inside) {
                          morningCells.push(
                            <td key={`empty-p-${p}`} className="p-2 text-center text-muted-foreground/30 align-middle">
                              -
                            </td>
                          );
                        }
                        p++;
                      }
                    }
                    return morningCells;
                  })()}

                  {/* Lunch Break Column */}
                  <td className="p-2 text-center align-middle bg-amber-500/10 text-amber-900 dark:text-amber-200 text-[11px] font-semibold border-x border-border">
                    <div className="py-2 flex flex-col items-center justify-center gap-1">
                      <span>{locale === "th" ? "พักฉันเพล" : "Lunch"}</span>
                      <span className="text-[10px] text-muted-foreground font-normal">11.30-12.30</span>
                    </div>
                  </td>

                  {/* Afternoon 1 Section (3 Columns: P4, P5, P6) */}
                  {(() => {
                    const afternoon1Cells: React.ReactNode[] = [];
                    let p = 4;
                    while (p <= 6) {
                      const matched = afternoon1Slots.find((s) => {
                        const range = getSlotPeriodRange(s.startTime, s.endTime);
                        return range.startP === p;
                      });

                      if (matched) {
                        const range = getSlotPeriodRange(matched.startTime, matched.endTime);
                        const span = Math.min(range.span, 6 - p + 1);
                        afternoon1Cells.push(
                          <td
                            key={matched.id}
                            colSpan={span}
                            className="p-2 align-top bg-emerald-500/5"
                          >
                            {renderCourseCard(matched, "emerald")}
                          </td>
                        );
                        p += span;
                      } else {
                        const inside = afternoon1Slots.some((s) => {
                          const range = getSlotPeriodRange(s.startTime, s.endTime);
                          return range.startP < p && range.endP >= p;
                        });
                        if (!inside) {
                          afternoon1Cells.push(
                            <td key={`empty-p-${p}`} className="p-2 text-center text-muted-foreground/30 align-middle">
                              -
                            </td>
                          );
                        }
                        p++;
                      }
                    }
                    return afternoon1Cells;
                  })()}

                  {/* Afternoon 2 Section (2 Columns: P7, P8) */}
                  {(() => {
                    const afternoon2Cells: React.ReactNode[] = [];
                    let p = 7;
                    while (p <= 8) {
                      const matched = afternoon2Slots.find((s) => {
                        const range = getSlotPeriodRange(s.startTime, s.endTime);
                        return range.startP === p;
                      });

                      if (matched) {
                        const range = getSlotPeriodRange(matched.startTime, matched.endTime);
                        const span = Math.min(range.span, 8 - p + 1);
                        afternoon2Cells.push(
                          <td
                            key={matched.id}
                            colSpan={span}
                            className="p-2 align-top bg-purple-500/5"
                          >
                            {renderCourseCard(matched, "purple")}
                          </td>
                        );
                        p += span;
                      } else {
                        const inside = afternoon2Slots.some((s) => {
                          const range = getSlotPeriodRange(s.startTime, s.endTime);
                          return range.startP < p && range.endP >= p;
                        });
                        if (!inside) {
                          afternoon2Cells.push(
                            <td key={`empty-p-${p}`} className="p-2 text-center text-muted-foreground/30 align-middle">
                              -
                            </td>
                          );
                        }
                        p++;
                      }
                    }
                    return afternoon2Cells;
                  })()}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── MOBILE RESPONSIVE CARDS VIEW (For screens < md) ── */}
      <div className="md:hidden space-y-4 print:hidden">
        {DAY_NAMES.map((day) => {
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
                  const hour = parseFloat(s.startTime.replace(":", "."));
                  const isMorning = hour < 12.0;
                  const isAfternoon1 = hour >= 12.0 && hour < 15.0;
                  const periodTag = isMorning
                    ? { label: "ช่วงเช้า (คาบ 1-3)", color: "bg-sky-500/10 text-sky-800 dark:text-sky-300 border-sky-300/40" }
                    : isAfternoon1
                    ? { label: "ช่วงบ่าย 1 (คาบ 4-6)", color: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-300/40" }
                    : { label: "ช่วงบ่าย 2 (คาบ 7-8)", color: "bg-purple-500/10 text-purple-800 dark:text-purple-300 border-purple-300/40" };

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
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${periodTag.color}`}>
                            {periodTag.label}
                          </span>
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

      {/* ── FOOTNOTE / NOTES SECTION ── */}
      {timetable.notes && (
        <div className="p-4 sm:p-5 print:p-3 rounded-xl print:rounded-lg border border-amber-500/20 print:border-black/30 bg-amber-500/5 print:bg-transparent space-y-2 print:space-y-1 text-xs print:text-[10px] print:break-inside-avoid">
          <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200 print:text-black">
            <Info className="w-4 h-4 print:w-3.5 print:h-3.5 text-amber-600 dark:text-amber-400 print:text-black" />
            <span>{locale === "th" ? "ข้อความและหมายเหตุสำคัญ" : "Important Notes"}</span>
          </div>
          <div className="text-muted-foreground print:text-neutral-900 leading-relaxed print:leading-normal whitespace-pre-line pl-5 print:pl-4 font-normal">
            {timetable.notes}
          </div>
        </div>
      )}
    </div>
  );
}
