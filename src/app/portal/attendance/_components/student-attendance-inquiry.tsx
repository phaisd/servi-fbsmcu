/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import {
  Search,
  User,
  GraduationCap,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Printer,
  ShieldCheck,
  TrendingUp,
  MapPin,
  Plus,
} from "lucide-react";
import {
  LiyonCard,
  StatusPill,
} from "@/shared/components/liyon";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getStudentPersonalAttendanceAction } from "@/features/attendance/actions";
import { StudentCourseEnrollDialog } from "./student-course-enroll-dialog";

interface AllClassSummaryItem {
  id: string;
  courseCode: string;
  courseName: string;
  term: string;
  instructorName: string;
}

interface StudentAttendanceInquiryProps {
  initialStudentCode?: string;
  canManageAttendance?: boolean;
  allClasses?: AllClassSummaryItem[];
  locale?: string;
}

interface PersonalCourseSession {
  id: string;
  sessionNumber: number;
  date: string | Date;
  startTime?: string | null;
  endTime?: string | null;
  topic?: string | null;
  sessionStatus?: string | null;
  attendanceStatus?: string | null;
  note?: string | null;
}

interface PersonalCourseItem {
  courseId: string;
  courseCode: string;
  courseName: string;
  credits: number;
  term: string;
  instructor: string;
  room?: string | null;
  eligibility: {
    isEligible: boolean | null;
    percentage: number;
    percentageDisplay: string;
    statusText: string;
    requiredRemainingToPass: number;
    attendedCount: number;
    evaluatedCount: number;
    presentCount: number;
    lateCount: number;
    excusedCount: number;
    absentCount: number;
    pendingCount: number;
  };
  sessions: PersonalCourseSession[];
}

interface PersonalSearchResult {
  found: boolean;
  message?: string;
  student: {
    id: string;
    studentCode: string;
    fullName: string;
    faculty?: string | null;
    department?: string | null;
    degree?: string | null;
    yearLevel?: number | null;
  };
  summary: {
    totalEnrolledCourses: number;
    totalCourses?: number;
    eligibleCoursesCount: number;
    atRiskCoursesCount: number;
    atRiskCourses?: number;
    overallPercentage: string;
    averageAttendanceRate?: number | string;
  };
  courses: PersonalCourseItem[];
}

export function StudentAttendanceInquiry({
  initialStudentCode = "",
  canManageAttendance = false,
  allClasses = [],
  locale = "th",
}: StudentAttendanceInquiryProps) {
  const [studentCode, setStudentCode] = useState(initialStudentCode);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<PersonalSearchResult | null>(null);
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [showAllClasses, setShowAllClasses] = useState(false);
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);

  async function runLookup(codeToSearch: string) {
    const clean = codeToSearch.trim();
    if (!clean) {
      toast.error("กรุณาระบุรหัสนิสิตเพื่อค้นหา");
      return;
    }

    try {
      setIsLoading(true);
      const res = await getStudentPersonalAttendanceAction(clean);
      if (!res.found) {
        toast.error(res.message || "ไม่พบข้อมูลนิสิตรหัสนี้");
        setSearchResult(null);
      } else {
        setSearchResult(res as unknown as PersonalSearchResult);
        if (res.courses && res.courses.length > 0) {
          setExpandedCourseId(res.courses[0].courseId);
        }
        toast.success(`พบข้อมูลการลงทะเบียนและเวลาเรียนของ ${res.student?.fullName || clean}`);
      }
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || "เกิดข้อผิดพลาดในการค้นหา");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    await runLookup(studentCode);
  }

  useEffect(() => {
    if (initialStudentCode && initialStudentCode.trim()) {
      void runLookup(initialStudentCode.trim());
    }
  }, [initialStudentCode]);

  function handlePrintTranscript() {
    window.print();
  }

  return (
    <div className="space-y-6">
      {/* Search Header Card */}
      <LiyonCard className="border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-sm">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
            <Search className="w-3.5 h-3.5" />
            พอร์ทัลนิสิต: ตรวจสอบเวลาเรียนและสิทธิ์สอบ
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            ตรวจสอบประวัติเวลาเรียนรายบุคคล
          </h2>
          <p className="text-sm text-muted-foreground">
            กรอกรหัสนิสิตของท่านเพื่อดูสรุปเปอร์เซ็นต์การเข้าเรียน สิทธิ์เข้าห้องสอบ และประวัติการเช็กชื่อรายคาบ
          </p>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-2 pt-2">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value)}
                placeholder="ระบุรหัสนิสิต (เช่น 660101, 690101001...)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background/90 text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-medium shadow-sm transition-all"
            >
              {isLoading ? "กำลังค้นหา..." : "ค้นหาข้อมูล"}
            </Button>
          </form>

          {/* Preset Student Codes Helper */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-xs text-muted-foreground">
            <span>ตัวอย่างรหัสนิสิตทดสอบ:</span>
            {["6801203001", "6701203002", "6601203005"].map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setStudentCode(code);
                  void runLookup(code);
                }}
                className="px-2 py-0.5 rounded-md bg-muted hover:bg-muted/80 text-foreground font-mono transition-colors"
              >
                {code}
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-border/40 flex justify-center">
            <button
              type="button"
              onClick={() => {
                if (!studentCode.trim()) {
                  toast.info("กรุณาระบุรหัสนิสิตในช่องค้นหาก่อน หรือเลือกตัวอย่างรหัสเพื่อลงทะเบียน");
                } else {
                  setIsEnrollDialogOpen(true);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ ลงทะเบียนรายวิชาเข้าชั้นเรียน / นำเข้าใบลงทะเบียน</span>
            </button>
          </div>
        </div>
      </LiyonCard>

      {/* Result Display */}
      {searchResult && searchResult.found && (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
          {/* Student Profile & Summary Card */}
          <LiyonCard className="p-6 border-slate-200 dark:border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xl flex-shrink-0 shadow-inner">
                  <User className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                      {searchResult.student.fullName}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold font-mono">
                      {searchResult.student.studentCode}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5" />
                      ชั้นปีที่ {searchResult.student.yearLevel || 1}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      {searchResult.student.department || "สาขาวิชาวิปัสสนาภาวนา"}
                    </span>
                    <span>•</span>
                    <span>{searchResult.student.faculty || "คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย"}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-start md:self-auto">
                <Button
                  size="sm"
                  onClick={() => setIsEnrollDialogOpen(true)}
                  className="gap-1.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground shadow-2xs hover:bg-primary/90"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ ลงทะเบียน / เพิ่มรายวิชา</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrintTranscript}
                  className="gap-1.5 rounded-xl text-xs"
                >
                  <Printer className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>พิมพ์ใบลำดับเวลาเรียน</span>
                </Button>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
              <div className="p-4 rounded-xl bg-muted/40 border border-border flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">รายวิชาที่ลงทะเบียน</p>
                  <p className="text-xl font-bold text-foreground">{searchResult.summary.totalCourses} วิชา</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted/40 border border-border flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">อัตราเข้าเรียนเฉลี่ยรวม</p>
                  <p className="text-xl font-bold text-foreground">{searchResult.summary.averageAttendanceRate}%</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted/40 border border-border flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                  (searchResult.summary.atRiskCourses ?? searchResult.summary.atRiskCoursesCount ?? 0) > 0
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                }`}>
                  {(searchResult.summary.atRiskCourses ?? searchResult.summary.atRiskCoursesCount ?? 0) > 0 ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <ShieldCheck className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">วิชาที่อยู่ในกลุ่มเสี่ยง</p>
                  <p className="text-xl font-bold text-foreground">
                    {searchResult.summary.atRiskCourses ?? searchResult.summary.atRiskCoursesCount ?? 0} วิชา
                  </p>
                </div>
              </div>
            </div>
          </LiyonCard>

          {/* Courses List */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                รายการวิชาและสถานะสิทธิ์สอบ ({searchResult.courses.length} รายวิชา)
              </h4>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEnrollDialogOpen(true)}
                  className="gap-1.5 rounded-xl text-xs font-semibold text-primary border-primary/30 hover:bg-primary/10"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มวิชาเรียน</span>
                </Button>
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  เกณฑ์สิทธิ์สอบ: เวลาเรียนต้องไม่น้อยกว่า 80%
                </span>
              </div>
            </div>

            {searchResult.courses.map((course: PersonalCourseItem) => {
              const elig = course.eligibility;
              const isExpanded = expandedCourseId === course.courseId;
              const percent = elig.percentage;

              // Color determination
              let statusTone: "ok" | "warn" | "bad" | "off" = "off";
              if (elig.isEligible === true) statusTone = "ok";
              else if (elig.isEligible === false) statusTone = "bad";
              else if (percent < 80.0 || elig.absentCount >= 3) statusTone = "warn";

              return (
                <LiyonCard
                  key={course.courseId}
                  className="overflow-hidden border-slate-200 dark:border-slate-800 transition-all hover:border-primary/30"
                >
                  {/* Course Header Bar */}
                  <div className="p-5 sm:p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-muted text-foreground text-xs font-bold font-mono">
                            {course.courseCode}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {course.credits} หน่วยกิต • ภาคเรียนที่ {course.term}
                          </span>
                        </div>
                        <h5 className="text-lg font-bold text-foreground">
                          {course.courseName}
                        </h5>
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>อาจารย์ผู้สอน: {course.instructor}</span>
                          {course.room && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {course.room}
                              </span>
                            </>
                          )}
                        </p>
                      </div>

                      {/* Right Status Badge */}
                      <div className="flex flex-col sm:items-end gap-1.5">
                        <div className="flex items-center gap-2">
                          <StatusPill tone={statusTone}>
                            {elig.statusText}
                          </StatusPill>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {elig.requiredRemainingToPass > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                              ต้องเข้าเรียนเพิ่มอีกอย่างน้อย {elig.requiredRemainingToPass} คาบ
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              เวลาเรียนอยู่ในเกณฑ์สิทธิ์สอบ
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Attendance Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between items-center text-xs font-medium">
                        <span className="text-muted-foreground">
                          เวลาเรียนที่บันทึกแล้ว: {elig.attendedCount} จาก {elig.evaluatedCount} คาบ (จัดสอนแล้ว)
                        </span>
                        <span className="font-bold text-sm font-mono text-foreground">
                          {elig.percentageDisplay}%
                        </span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-muted overflow-hidden flex">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            percent >= 80
                              ? "bg-emerald-500"
                              : percent >= 70
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          }`}
                          style={{ width: `${Math.min(100, percent)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-muted-foreground pt-0.5">
                        <span>0%</span>
                        <span className="text-amber-600 dark:text-amber-400 font-medium">เกณฑ์สิทธิ์สอบ 80%</span>
                        <span>100%</span>
                      </div>
                    </div>

                    {/* Mini Stats Breakdown */}
                    <div className="grid grid-cols-5 gap-2 pt-2 border-t border-border">
                      <div className="text-center p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-[10px] sm:text-xs font-semibold text-emerald-700 dark:text-emerald-300">มาเรียน</p>
                        <p className="text-sm sm:text-base font-bold text-emerald-800 dark:text-emerald-200 font-mono">
                          {elig.presentCount}
                        </p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <p className="text-[10px] sm:text-xs font-semibold text-amber-700 dark:text-amber-300">มาสาย</p>
                        <p className="text-sm sm:text-base font-bold text-amber-800 dark:text-amber-200 font-mono">
                          {elig.lateCount}
                        </p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <p className="text-[10px] sm:text-xs font-semibold text-blue-700 dark:text-blue-300">ลาอนุมัติ</p>
                        <p className="text-sm sm:text-base font-bold text-blue-800 dark:text-blue-200 font-mono">
                          {elig.excusedCount}
                        </p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                        <p className="text-[10px] sm:text-xs font-semibold text-rose-700 dark:text-rose-300">ขาดเรียน</p>
                        <p className="text-sm sm:text-base font-bold text-rose-800 dark:text-rose-200 font-mono">
                          {elig.absentCount}
                        </p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-slate-500/10 border border-slate-500/20">
                        <p className="text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300">รอเช็ก</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 font-mono">
                          {elig.pendingCount}
                        </p>
                      </div>
                    </div>

                    {/* Toggle Accordion Button */}
                    <div className="pt-2 flex justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedCourseId(isExpanded ? null : course.courseId)}
                        className="text-xs text-muted-foreground gap-1.5 hover:text-foreground"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            <span>ซ่อนประวัติรายคาบ</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            <span>ดูประวัติการเช็กชื่อรายคาบ (16 คาบ)</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Accordion Content: Session by Session Table */}
                  {isExpanded && (
                    <div className="border-t border-border bg-muted/20 p-4 sm:p-6 space-y-3">
                      <h6 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        บันทึกการเช็กชื่อรายคาบเรียน ({course.sessions.length} คาบ)
                      </h6>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                        {course.sessions.map((sess: PersonalCourseSession) => {
                          let badgeBg = "bg-muted text-muted-foreground border-border";
                          let label = "รอเช็ก";

                          switch (sess.attendanceStatus) {
                            case "PRESENT":
                              badgeBg = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
                              label = "มาเรียน";
                              break;
                            case "LATE":
                              badgeBg = "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30";
                              label = "มาสาย";
                              break;
                            case "EXCUSED":
                              badgeBg = "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30";
                              label = "ลา";
                              break;
                            case "ABSENT":
                              badgeBg = "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30";
                              label = "ขาดเรียน";
                              break;
                            default:
                              badgeBg = "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30";
                              label = "รอเช็ก";
                          }

                          return (
                            <div
                              key={sess.id}
                              className={`p-3 rounded-xl border bg-card/80 flex items-center justify-between text-xs transition-all ${
                                sess.sessionStatus === "COMPLETED" ? "shadow-sm" : "opacity-80"
                              }`}
                            >
                              <div className="space-y-0.5 min-w-0 pr-2">
                                <div className="flex items-center gap-1.5 font-bold text-foreground">
                                  <span>คาบที่ {sess.sessionNumber}</span>
                                </div>
                                <p className="text-[11px] text-muted-foreground truncate">
                                  {new Date(sess.date).toLocaleDateString("th-TH", {
                                    day: "numeric",
                                    month: "short",
                                  })}
                                  {sess.startTime && ` • ${sess.startTime} น.`}
                                </p>
                              </div>

                              <span className={`px-2 py-0.5 rounded-md border font-semibold text-[11px] flex-shrink-0 ${badgeBg}`}>
                                {label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </LiyonCard>
              );
            })}
          </div>
        </div>
      )}

      {/* Admin Only: Checkbox to Toggle All Available Classes */}
      {canManageAttendance && (
        <div className="pt-4 border-t border-border space-y-5">
          <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-indigo-200 bg-indigo-50/60 dark:bg-indigo-950/20 dark:border-indigo-900/50 px-4 py-3.5 transition hover:bg-indigo-50">
            <div className="space-y-0.5">
              <span className="block text-sm font-bold text-foreground">
                แสดงรายวิชาทั้งหมดที่เปิดสอนในคณะ ({allClasses.length} วิชา) — เฉพาะผู้ดูแลระบบ / อาจารย์
              </span>
              <span className="block text-xs text-muted-foreground">
                ซ่อนจากหน้านิสิตเป็นค่าเริ่มต้น เพื่อให้นิสิตเห็นเฉพาะรายวิชาที่ตนเองลงทะเบียนเรียนเท่านั้น
              </span>
            </div>
            <input
              type="checkbox"
              checked={showAllClasses}
              onChange={(e) => setShowAllClasses(e.target.checked)}
              className="h-4 w-4 rounded border-indigo-300 text-primary focus:ring-primary"
            />
          </label>

          {showAllClasses && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {locale === "th" ? "รายวิชาทั้งหมดที่เปิดสอนในระบบ" : "All Available Classes"} ({allClasses.length})
                </h2>
                <p className="text-xs text-muted-foreground">
                  {locale === "th"
                    ? "แสดงเฉพาะเมื่อผู้ดูแลระบบหรืออาจารย์ติ๊กเปิดดูข้อมูลรวม"
                    : "Visible only when toggled on by Admin/Instructor"}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {allClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex flex-col overflow-hidden rounded-2xl border bg-card hover:shadow-md transition-all"
                  >
                    <div className="p-5 flex-1">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[11px] font-semibold tracking-wide uppercase mb-2.5">
                        <BookOpen className="h-3 w-3" />
                        {cls.courseCode}
                      </div>
                      <h3 className="text-base font-bold text-foreground mb-3">{cls.courseName}</h3>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {locale === "th" ? "ภาคการศึกษา:" : "Term:"} {cls.term}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {locale === "th" ? "ผู้สอน:" : "Instructor:"}
                          </span>{" "}
                          {cls.instructorName}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dialog for Student Course Enrollment */}
      <StudentCourseEnrollDialog
        open={isEnrollDialogOpen}
        onOpenChange={setIsEnrollDialogOpen}
        studentCode={studentCode.trim() || initialStudentCode.trim()}
        initialStudentData={searchResult?.student}
        onEnrollmentSuccess={() => {
          const code = studentCode.trim() || initialStudentCode.trim();
          if (code) {
            void runLookup(code);
          }
        }}
      />
    </div>
  );
}

