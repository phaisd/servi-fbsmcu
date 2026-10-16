import Link from "next/link";
import { resolvePublicTenantId } from "@/features/news/server";
import { getClasses } from "@/features/attendance/server";
import { getLocale } from "@/shared/lib/i18n/server";
import { ClipboardList, BookOpen, Clock, QrCode } from "lucide-react";
import { StudentAttendanceInquiry } from "./_components/student-attendance-inquiry";
import { Button } from "@/components/ui/button";

export default async function PublicAttendancePage() {
  const locale = await getLocale();
  const tenantId = await resolvePublicTenantId();
  
  const classes = await getClasses(tenantId);

  return (
    <div className="space-y-12 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Banner & Quick QR Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-2">
            <ClipboardList className="h-3.5 w-3.5" />
            {locale === "th" ? "ระบบเช็คชื่อและเวลาเรียน มจร." : "MCU Attendance System"}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {locale === "th" ? "พอร์ทัลเวลาเรียนนิสิต" : "Student Attendance Portal"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {locale === "th"
              ? "ตรวจสอบประวัติเวลาเรียน ตรวจสิทธิ์สอบรายบุคคล และสแกน QR Code เข้าเรียน"
              : "Check attendance history, exam eligibility, and scan QR code for check-in"}
          </p>
        </div>

        <Link href="/portal/attendance/scan">
          <Button className="gap-2 rounded-xl px-5 py-2.5 font-medium shadow-sm hover:shadow transition-all bg-primary text-primary-foreground">
            <QrCode className="w-4 h-4" />
            <span>{locale === "th" ? "สแกน QR เข้าเรียน" : "Scan QR Check-In"}</span>
          </Button>
        </Link>
      </div>

      {/* Feature 1: Student Personal Attendance Search & Dashboard */}
      <StudentAttendanceInquiry />

      {/* All Available Classes Section */}
      <div className="space-y-6 pt-4 border-t border-border">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {locale === "th" ? "รายวิชาทั้งหมดที่เปิดสอน" : "All Enrolled Classes"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {locale === "th" ? "วิชาที่มีการบันทึกเวลาเรียนในระบบ" : "Classes available for attendance tracking"}
          </p>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((cls) => (
          <div key={cls.id} className="flex flex-col overflow-hidden rounded-2xl border bg-card hover:shadow-md transition-all">
            <div className="p-6 flex-1">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[11px] font-semibold tracking-wide uppercase mb-3">
                <BookOpen className="h-3 w-3" />
                {cls.courseCode}
              </div>
              <h3 className="text-xl font-bold text-foreground mb-4">{cls.courseName}</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {locale === "th" ? "ภาคการศึกษา:" : "Term:"} {cls.term}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{locale === "th" ? "ผู้สอน:" : "Instructor:"}</span> {cls.primaryTeacher?.name || "-"}
                </div>
              </div>
            </div>
          </div>
        ))}
        {classes.length === 0 && (
          <div className="col-span-full py-20 text-center text-muted-foreground border rounded-xl bg-muted/20">
            {locale === "th" ? "ยังไม่มีรายวิชาในระบบ" : "No classes available."}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
