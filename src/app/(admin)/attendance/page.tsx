import { requirePermission } from "@/features/identity/server";
import { ATTENDANCE_P } from "@/features/attendance";
import { getAttendanceDashboardData } from "@/features/attendance/server";
import {
  BookOpen,
  Users,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowRight,
  TrendingUp,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export default async function AttendanceDashboardPage() {
  const ctx = await requirePermission(ATTENDANCE_P.manage);
  const data = await getAttendanceDashboardData(
    ctx.tenantId,
    ctx.userId,
    ctx.isSuperAdmin
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 sm:p-8 rounded-3xl border border-primary/20 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold mb-2">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย • คณะพุทธศาสตร์</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              ระบบตรวจสอบเวลาเข้าเรียนและสิทธิ์สอบ
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              ยินดีต้อนรับอาจารย์ <span className="font-bold text-slate-800 dark:text-slate-200">{ctx.userName}</span> •
              เกณฑ์ประเมินสิทธิ์สอบวัดผลปลายภาคเรียน: เวลาเรียนไม่น้อยกว่า <span className="font-bold text-primary">80.00%</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/attendance/classes"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-white text-sm font-bold shadow-md hover:bg-primary/90 hover:shadow-lg transition"
            >
              <BookOpen className="w-4 h-4" />
              <span>จัดการรายวิชาทั้งหมด</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">วิชาที่รับผิดชอบ</span>
            <BookOpen className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {data.coursesCount} <span className="text-xs font-normal text-slate-400">วิชา</span>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">นิสิตทั้งหมด</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {data.totalStudents} <span className="text-xs font-normal text-slate-400">คน</span>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">คาบที่สอนแล้ว</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {data.stats.conductedSessionsCount}{" "}
            <span className="text-xs font-normal text-slate-400">/ {data.stats.totalSessionsCount} คาบ</span>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">อัตราเข้าเรียนเฉลี่ย</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {data.stats.averageAttendanceRate}%
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-red-200 dark:border-red-900/60 shadow-2xs bg-red-50/20 dark:bg-red-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-600 dark:text-red-400">กลุ่มเสี่ยง (&lt; 80%)</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-2">
            {data.stats.atRiskCount} <span className="text-xs font-normal text-slate-400">คน</span>
          </p>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Today's & Upcoming Sessions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Sessions */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  ตารางสอนวันนี้ (Today's Sessions)
                </h2>
              </div>
              <span className="text-xs text-slate-400">
                {new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date())}
              </span>
            </div>

            {data.todaySessions.length === 0 ? (
              <div className="py-8 px-4 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs space-y-1">
                <Sparkles className="w-6 h-6 mx-auto text-slate-300" />
                <p className="font-semibold text-slate-600 dark:text-slate-300">
                  ไม่มีตารางสอนในวันนี้
                </p>
                <p>อาจารย์สามารถตรวจดูคาบเรียนที่จะมาถึง หรือตรวจสอบรายวิชาที่รับผิดชอบด้านล่าง</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.todaySessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-primary/40 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-bold">
                          {session.course.courseCode}
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          คาบที่ {session.sessionNumber}
                        </span>
                        {session.isLocked ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 text-2xs font-bold flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> ปิดคาบแล้ว
                          </span>
                        ) : session.status === "COMPLETED" ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-2xs font-bold">
                            เช็กชื่อแล้ว ({session._count.records} คน)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 text-2xs font-bold">
                            รอเช็กชื่อ
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-sm text-slate-900 dark:text-white mt-1">
                        {session.course.courseName}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        {session.startTime && session.endTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-500" />
                            {session.startTime} - {session.endTime} น.
                          </span>
                        )}
                        {session.room && (
                          <span>ห้องเรียน: {session.room}</span>
                        )}
                      </div>
                    </div>

                    <Link
                      href={`/attendance/classes/${session.course.id}/sessions/${session.id}`}
                      className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition whitespace-nowrap self-stretch sm:self-auto justify-center"
                    >
                      <span>{session.status === "COMPLETED" ? "ดูผล / แก้ไข" : "เช็กชื่อคาบนี้"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Sessions Preview */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-500" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  คาบเรียนที่กำลังจะมาถึง (Upcoming Sessions)
                </h2>
              </div>
              <span className="text-xs text-slate-400">ตามตารางสอน</span>
            </div>

            {data.upcomingSessions.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">ไม่มีคาบเรียนที่รอสอน</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.upcomingSessions.map((session) => {
                  const sDate = new Intl.DateTimeFormat("th-TH", {
                    dateStyle: "medium",
                  }).format(new Date(session.date));
                  return (
                    <div
                      key={session.id}
                      className="py-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {session.course.courseCode} — คาบที่ {session.sessionNumber}
                          </span>
                          <span className="text-slate-400">• {sDate}</span>
                          {session.startTime && (
                            <span className="text-slate-400 font-mono">({session.startTime} น.)</span>
                          )}
                        </div>
                        <p className="text-slate-500 text-2xs mt-0.5 truncate max-w-md">
                          {session.topic || session.course.courseName}
                        </p>
                      </div>

                      <Link
                        href={`/attendance/classes/${session.course.id}/sessions/${session.id}`}
                        className="text-primary hover:underline font-bold text-xs flex items-center gap-1 shrink-0"
                      >
                        เข้าสู่คาบ <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): At-Risk Students Watchlist */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  นิสิตกลุ่มเสี่ยง (&lt; 80%)
                </h2>
              </div>
              <span className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950 px-2 py-0.5 rounded-full">
                {data.atRiskStudents.length} คน
              </span>
            </div>
            <p className="text-2xs text-slate-500">
              รายชื่อนิสิตที่มีเวลาเรียนต่ำกว่าเกณฑ์ 80.00% หรือมีความเสี่ยงหมดสิทธิ์สอบวัดผลปลายภาค
            </p>

            {data.atRiskStudents.length === 0 ? (
              <div className="py-8 text-center text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/40 p-4 space-y-1">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
                <p className="text-xs font-bold">ไม่มีนิสิตกลุ่มเสี่ยงในขณะนี้</p>
                <p className="text-2xs text-emerald-700/80 dark:text-emerald-400">
                  นิสิตทุกคนมีเวลาเรียนตามเกณฑ์สิทธิ์สอบ
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto pr-1">
                {data.atRiskStudents.map((st) => (
                  <div key={`${st.courseId}-${st.studentCode}`} className="py-3 text-xs space-y-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">
                          {st.studentName}
                        </p>
                        <p className="text-2xs font-mono text-slate-400">
                          {st.studentCode} • {st.courseCode}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
                        {st.percentage.toFixed(1)}%
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-2xs text-slate-500 pt-1">
                      <span>ขาดเรียน: <b className="text-red-600">{st.absentCount}</b> คาบ</span>
                      <Link
                        href={`/attendance/classes/${st.courseId}/eligibility`}
                        className="text-primary hover:underline font-semibold"
                      >
                        ดูสิทธิ์สอบ →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: My Courses Cards */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              รายวิชาที่รับผิดชอบ (My Assigned Courses)
            </h2>
            <p className="text-xs text-slate-500">
              เข้าถึงตารางคาบเรียน รายชื่อนิสิต และรายงานสรุปสิทธิ์สอบรายวิชา
            </p>
          </div>
          <Link
            href="/attendance/classes"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            ดูทั้งหมด ({data.courses.length}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.courses.map((course) => (
            <div
              key={course.id}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex justify-between items-start gap-2">
                  <span className="px-2.5 py-1 rounded-xl bg-primary/10 text-primary font-bold text-xs">
                    {course.courseCode}
                  </span>
                  <span className="text-2xs text-slate-400 font-medium">
                    ภาค {course.term} • กลุ่ม {course.section || "1"}
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 dark:text-white mt-2 line-clamp-1">
                  {course.courseName}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  นิสิตลงทะเบียน: <b className="text-slate-700 dark:text-slate-300">{course._count.enrollments}</b> คน
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center text-xs">
                <Link
                  href={`/attendance/classes/${course.id}/sessions`}
                  className="py-2 px-1 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary transition font-semibold"
                >
                  ตารางคาบ
                </Link>
                <Link
                  href={`/attendance/classes/${course.id}/students`}
                  className="py-2 px-1 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary transition font-semibold"
                >
                  นิสิต
                </Link>
                <Link
                  href={`/attendance/classes/${course.id}/eligibility`}
                  className="py-2 px-1 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary transition font-semibold text-emerald-600 dark:text-emerald-400"
                >
                  สิทธิ์สอบ
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
