 
"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Calendar,
  GraduationCap,
  Clock,
  BookOpen,
  Search,
} from "lucide-react";
import {
  TimetableGridView,
} from "@/features/curriculum/_components/timetable-grid-view";
import { Button } from "@/components/ui/button";
import type { Curriculum, Department } from "@/generated/prisma";

interface TimetablesPortalClientProps {
  initialItems: any[];
  curriculums: Curriculum[];
  departments: Department[];
  locale?: string;
}

const DEGREE_LABELS: Record<string, { th: string; en: string }> = {
  BACHELOR: { th: "ระดับปริญญาตรี", en: "Bachelor's" },
  MASTER: { th: "ระดับปริญญาโท", en: "Master's" },
  DOCTORATE: { th: "ระดับปริญญาเอก", en: "Doctorate" },
  CERTIFICATE: { th: "ประกาศนียบัตร", en: "Certificate" },
};

export function TimetablesPortalClient({
  initialItems,
  curriculums,
  departments: _departments,
  locale = "th",
}: TimetablesPortalClientProps) {
  const searchParams = useSearchParams();
  const initialCurriculumId = searchParams.get("curriculumId");
  const initialYear = searchParams.get("year");

  // Selection states
  const [selectedAcademicYear, setSelectedAcademicYear] = React.useState<string>("ALL");
  const [selectedSemester, setSelectedSemester] = React.useState<string>("ALL");
  const [selectedDegree, setSelectedDegree] = React.useState<string>("ALL");
  const [selectedCurriculumId, setSelectedCurriculumId] = React.useState<string>(
    initialCurriculumId || "ALL"
  );
  const [selectedYearLevel, setSelectedYearLevel] = React.useState<number | "ALL">(
    initialYear ? Number(initialYear) : "ALL"
  );
  const [selectedTimetableId, setSelectedTimetableId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");

  // Available Academic Years dynamically
  const availableYears = React.useMemo(() => {
    const years = Array.from(
      new Set(initialItems.map((t) => t.academicYear).filter(Boolean))
    ) as string[];
    return years.sort().reverse();
  }, [initialItems]);

  // Curriculums filtered by selected degree if chosen
  const filteredCurriculums = React.useMemo(() => {
    let list = curriculums.filter(
      (c) => c.nameTh !== "พุทธศาสตรบัณฑิต สาขาศาสนาและปรัชญา"
    );
    if (selectedDegree !== "ALL") {
      list = list.filter((c) => c.degree === selectedDegree);
    }
    return list.filter((curr) => initialItems.some((t) => t.curriculumId === curr.id));
  }, [curriculums, selectedDegree, initialItems]);

  // Available Degrees present in curriculums
  const availableDegrees = React.useMemo(() => {
    const set = new Set<string>();
    curriculums.forEach((c) => {
      if (c.degree) set.add(c.degree);
    });
    // Also check initialItems
    initialItems.forEach((t) => {
      if (t.curriculum?.degree) set.add(t.curriculum.degree);
    });
    return Array.from(set);
  }, [curriculums, initialItems]);

  // Filtered list
  const filteredTimetables = React.useMemo(() => {
    return initialItems.filter((item) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTh = item.titleTh.toLowerCase().includes(q);
        const matchEn = (item.titleEn || "").toLowerCase().includes(q);
        const matchRoom = (item.room || "").toLowerCase().includes(q);
        const matchCurr = (item.curriculum?.nameTh || "").toLowerCase().includes(q);
        if (!matchTh && !matchEn && !matchRoom && !matchCurr) return false;
      }
      // Academic Year
      if (selectedAcademicYear !== "ALL" && item.academicYear !== selectedAcademicYear) {
        return false;
      }
      // Semester
      if (selectedSemester !== "ALL" && String(item.semester) !== selectedSemester) {
        return false;
      }
      // Degree level
      if (selectedDegree !== "ALL" && item.curriculum?.degree !== selectedDegree) {
        return false;
      }
      // Curriculum
      if (selectedCurriculumId !== "ALL") {
        if (item.curriculumId !== selectedCurriculumId) return false;
      }
      // Year level
      if (selectedYearLevel !== "ALL") {
        if (item.yearLevel !== selectedYearLevel) return false;
      }
      return true;
    });
  }, [
    initialItems,
    search,
    selectedAcademicYear,
    selectedSemester,
    selectedDegree,
    selectedCurriculumId,
    selectedYearLevel,
  ]);

  // Currently active timetable to display
  const activeTimetable = React.useMemo(() => {
    if (selectedTimetableId) {
      return (
        initialItems.find((it) => it.id === selectedTimetableId) ||
        filteredTimetables[0] ||
        null
      );
    }
    return filteredTimetables[0] || initialItems[0] || null;
  }, [selectedTimetableId, filteredTimetables, initialItems]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 print:p-0 print:m-0 print:max-w-none print:w-full">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6 print:hidden">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-3">
            <Calendar className="h-3.5 w-3.5" />
            <span>{locale === "th" ? "ตารางเรียนและตารางสอน" : "Class Timetables & Schedules"}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {locale === "th" ? "ตารางเรียนแต่ละหลักสูตรและสาขาวิชา" : "Academic Timetables"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            {locale === "th"
              ? "ตรวจสอบวัน เวลาเรียน รายวิชา อาจารย์ผู้สอน และห้องเรียน แยกตามหลักสูตร สาขาวิชา และชั้นปี ประจำภาคการศึกษา"
              : "View course schedules, instructors, classrooms, and lecture times organized by curriculum and year level."}
          </p>
        </div>

        {/* View Programs Link */}
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/portal/programs">
            <Button variant="outline" size="sm" className="gap-2 text-xs font-medium cursor-pointer">
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              <span>{locale === "th" ? "ดูข้อมูลหลักสูตรทั้งหมด" : "View Curriculums"}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* ── FILTER CONTROLS (Dropdown Menus) ── */}
      <div className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-2xs print:hidden">
        {/* Row 1: Academic Year, Semester, Degree Level */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Academic Year Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>{locale === "th" ? "ปีการศึกษา (Academic Year)" : "Academic Year"}</span>
            </label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => {
                setSelectedAcademicYear(e.target.value);
                setSelectedTimetableId(null);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:ring-1 focus:ring-primary focus:outline-hidden font-medium cursor-pointer"
            >
              <option value="ALL">
                {locale === "th" ? "📅 ทุกปีการศึกษา (All Years)" : "All Academic Years"}
              </option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {locale === "th" ? `ปีการศึกษา ${yr}` : `Academic Year ${yr}`}
                </option>
              ))}
            </select>
          </div>

          {/* Semester Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>{locale === "th" ? "ภาคการศึกษา (Semester)" : "Semester"}</span>
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => {
                setSelectedSemester(e.target.value);
                setSelectedTimetableId(null);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:ring-1 focus:ring-primary focus:outline-hidden font-medium cursor-pointer"
            >
              <option value="ALL">
                {locale === "th" ? "⏱️ ทุกภาคการศึกษา (All Semesters)" : "All Semesters"}
              </option>
              <option value="1">
                {locale === "th" ? "ภาคการศึกษาที่ 1 (Semester 1)" : "Semester 1"}
              </option>
              <option value="2">
                {locale === "th" ? "ภาคการศึกษาที่ 2 (Semester 2)" : "Semester 2"}
              </option>
              <option value="3">
                {locale === "th" ? "ภาคฤดูร้อน (Summer Semester)" : "Summer Semester"}
              </option>
            </select>
          </div>

          {/* Degree Level Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              <span>{locale === "th" ? "ระดับหลักสูตร (Degree Level)" : "Degree Level"}</span>
            </label>
            <select
              value={selectedDegree}
              onChange={(e) => {
                setSelectedDegree(e.target.value);
                setSelectedTimetableId(null);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:ring-1 focus:ring-primary focus:outline-hidden font-medium cursor-pointer"
            >
              <option value="ALL">
                {locale === "th" ? "🎓 ทุกระดับหลักสูตร (All Degrees)" : "All Degrees"}
              </option>
              {availableDegrees.map((deg) => (
                <option key={deg} value={deg}>
                  {DEGREE_LABELS[deg]?.[locale === "th" ? "th" : "en"] || deg}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Curriculum, Year Level, and Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-3 border-t border-border/80">
          {/* Curriculum Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-primary" />
              <span>{locale === "th" ? "หลักสูตร / สาขาวิชา:" : "Curriculum / Program:"}</span>
            </label>
            <select
              value={selectedCurriculumId}
              onChange={(e) => {
                setSelectedCurriculumId(e.target.value);
                setSelectedTimetableId(null);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:ring-1 focus:ring-primary focus:outline-hidden font-medium cursor-pointer"
            >
              <option value="ALL">
                {locale === "th" ? "🏛️ ทุกหลักสูตร / สาขาวิชา" : "All Curriculums"}
              </option>
              {filteredCurriculums.map((curr) => {
                const count = initialItems.filter((t) => t.curriculumId === curr.id).length;
                return (
                  <option key={curr.id} value={curr.id}>
                    {locale === "th" ? curr.nameTh : (curr.nameEn || curr.nameTh)}
                    {count > 0 ? ` (${count} ตาราง)` : ""}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Year Level Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>{locale === "th" ? "ระดับชั้นปี:" : "Year Level:"}</span>
            </label>
            <select
              value={String(selectedYearLevel)}
              onChange={(e) => {
                const val = e.target.value === "ALL" ? "ALL" : Number(e.target.value);
                setSelectedYearLevel(val as any);
                setSelectedTimetableId(null);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:ring-1 focus:ring-primary focus:outline-hidden font-medium cursor-pointer"
            >
              <option value="ALL">
                {locale === "th" ? "📚 ทุกชั้นปี (All Year Levels)" : "All Year Levels"}
              </option>
              <option value="1">
                {locale === "th" ? "ชั้นปีที่ 1 (Year 1)" : "Year 1"}
              </option>
              <option value="2">
                {locale === "th" ? "ชั้นปีที่ 2 (Year 2)" : "Year 2"}
              </option>
              <option value="3">
                {locale === "th" ? "ชั้นปีที่ 3 (Year 3)" : "Year 3"}
              </option>
              <option value="4">
                {locale === "th" ? "ชั้นปีที่ 4 (Year 4)" : "Year 4"}
              </option>
            </select>
          </div>

          {/* Search Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-primary" />
              <span>{locale === "th" ? "ค้นหารายวิชา / ห้องเรียน:" : "Search:"}</span>
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={locale === "th" ? "ค้นหารหัสวิชา, ชื่อวิชา, ห้องเรียน..." : "Search course, room..."}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-border bg-background focus:outline-hidden focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Active filter summary indicators */}
        {(selectedAcademicYear !== "ALL" || selectedSemester !== "ALL" || selectedDegree !== "ALL") && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60 text-xs">
            <span className="text-muted-foreground font-medium">กำลังแสดงเฉพาะ:</span>
            {selectedAcademicYear !== "ALL" && (
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold flex items-center gap-1">
                <span>ปีการศึกษา {selectedAcademicYear}</span>
                <button
                  type="button"
                  onClick={() => setSelectedAcademicYear("ALL")}
                  className="hover:opacity-75 cursor-pointer ml-0.5"
                >
                  ×
                </button>
              </span>
            )}
            {selectedSemester !== "ALL" && (
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 font-semibold flex items-center gap-1">
                <span>
                  {selectedSemester === "3" ? "ภาคฤดูร้อน" : `ภาคการศึกษาที่ ${selectedSemester}`}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedSemester("ALL")}
                  className="hover:opacity-75 cursor-pointer ml-0.5"
                >
                  ×
                </button>
              </span>
            )}
            {selectedDegree !== "ALL" && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1">
                <span>
                  {selectedDegree === "BACHELOR"
                    ? "ปริญญาตรี"
                    : selectedDegree === "MASTER"
                    ? "ปริญญาโท"
                    : selectedDegree === "DOCTORATE"
                    ? "ปริญญาเอก"
                    : selectedDegree}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedDegree("ALL")}
                  className="hover:opacity-75 cursor-pointer ml-0.5"
                >
                  ×
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setSelectedAcademicYear("ALL");
                setSelectedSemester("ALL");
                setSelectedDegree("ALL");
                setSelectedTimetableId(null);
              }}
              className="text-xs text-muted-foreground hover:text-foreground underline ml-1 cursor-pointer"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          </div>
        )}
      </div>

      {/* ── TIMETABLES DROPDOWN / TABS SELECTOR IF MULTIPLE ARE MATCHED ── */}
      {filteredTimetables.length > 1 && (
        <div className="space-y-3 bg-muted/30 p-4 rounded-2xl border border-border print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" />
              <span>
                {locale === "th"
                  ? `เลือกดูตารางเรียน (พบทั้งหมด ${filteredTimetables.length} ตาราง):`
                  : `Select Timetable (${filteredTimetables.length} available):`}
              </span>
            </label>

            {/* Quick dropdown for direct selection */}
            <select
              value={activeTimetable?.id || ""}
              onChange={(e) => setSelectedTimetableId(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-border bg-background focus:ring-1 focus:ring-primary focus:outline-hidden cursor-pointer"
            >
              {filteredTimetables.map((item) => (
                <option key={item.id} value={item.id}>
                  {`[ชั้นปีที่ ${item.yearLevel}] ${locale === "th" ? item.titleTh : (item.titleEn || item.titleTh)}${item.room ? ` (ห้อง ${item.room})` : ""}`}
                </option>
              ))}
            </select>
          </div>

          {/* Cards for visual selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredTimetables.map((item) => {
              const isCurrent = activeTimetable?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedTimetableId(item.id)}
                  className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isCurrent
                      ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/40"
                      : "border-border bg-card hover:border-primary/40 hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-xs text-primary px-2 py-0.5 rounded bg-primary/15">
                      {locale === "th" ? `ชั้นปีที่ ${item.yearLevel}` : `Year ${item.yearLevel}`}
                    </span>
                    {item.room && (
                      <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                        📍 {item.room}
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-foreground line-clamp-1">
                    {locale === "th" ? item.titleTh : (item.titleEn || item.titleTh)}
                  </h4>
                  {item.termDates && (
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                      {item.termDates}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── MAIN TIMETABLE GRID ── */}
      {activeTimetable ? (
        <div className="space-y-4">
          <TimetableGridView
            timetable={activeTimetable}
            locale={locale}
            showHeaderActions={true}
          />
        </div>
      ) : (
        <div className="py-20 text-center text-muted-foreground rounded-2xl border border-dashed p-8">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-base font-semibold">
            {locale === "th" ? "ไม่พบตารางเรียนที่ตรงกับเงื่อนไข" : "No timetables found."}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {locale === "th"
              ? "ลองเลือกหลักสูตรหรือชั้นปีอื่น หรือล้างคำค้นหา"
              : "Try choosing another curriculum or year level."}
          </p>
        </div>
      )}
    </div>
  );
}
