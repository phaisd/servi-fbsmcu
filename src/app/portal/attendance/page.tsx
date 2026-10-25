import Link from "next/link";
import { auth } from "@/features/identity/server";
import { resolvePublicTenantId } from "@/features/news/server";
import { getClasses } from "@/features/attendance/server";
import { getLocale } from "@/shared/lib/i18n/server";
import { ClipboardList, QrCode } from "lucide-react";
import { StudentAttendanceInquiry } from "./_components/student-attendance-inquiry";
import { Button } from "@/components/ui/button";

export default async function PublicAttendancePage() {
  const [locale, tenantId, session] = await Promise.all([
    getLocale(),
    resolvePublicTenantId(),
    auth(),
  ]);

  let initialStudentCode = "";
  const email = session?.user?.email?.toLowerCase().trim() || "";
  if (email.endsWith("@mcu.ac.th")) {
    const prefix = email.split("@")[0]?.trim() || "";
    if (/^\d{8,12}$/.test(prefix) || prefix.startsWith("temp-")) {
      initialStudentCode = prefix.toUpperCase();
    }
  }

  const canManageAttendance = Boolean(
    session?.isSuperAdmin || session?.permissions?.includes("attendance:manage")
  );

  const classes = canManageAttendance ? await getClasses(tenantId) : [];
  const serializedClasses = classes.map((cls) => ({
    id: cls.id,
    courseCode: cls.courseCode,
    courseName: cls.courseName,
    term: cls.term,
    instructorName: cls.primaryTeacher?.name || "-",
  }));

  return (
    <div className="space-y-10 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
              ? "ตรวจสอบประวัติเวลาเรียน ตรวจสิทธิ์สอบรายบุคคล ลงทะเบียนรายวิชาเข้าชั้นเรียน และสแกน QR Code เข้าเรียน"
              : "Check attendance history, exam eligibility, register courses, and scan QR code for check-in"}
          </p>
        </div>

        <Link href="/portal/attendance/scan">
          <Button className="gap-2 rounded-xl px-5 py-2.5 font-medium shadow-sm hover:shadow transition-all bg-primary text-primary-foreground">
            <QrCode className="w-4 h-4" />
            <span>{locale === "th" ? "สแกน QR เข้าเรียน" : "Scan QR Check-In"}</span>
          </Button>
        </Link>
      </div>

      {/* Security notice for students */}
      {session?.user && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-700 dark:text-amber-300">🔒 คำแนะนำด้านความปลอดภัย:</span>
            <span>
              {locale === "th"
                ? "เพื่อความปลอดภัยของข้อมูลส่วนตัว (PDPA) หากท่านยังใช้รหัสผ่านเริ่มต้น (Fbตามด้วยรหัสนิสิต) กรุณาเปลี่ยนเป็นรหัสผ่านส่วนตัว"
                : "Security tip: If you are still using your default password, please change it to protect your privacy."}
            </span>
          </div>
          <Link
            href="/change-password"
            className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-300 hover:underline shrink-0"
          >
            <span>{locale === "th" ? "เปลี่ยนรหัสผ่านที่นี่ →" : "Change password here →"}</span>
          </Link>
        </div>
      )}

      {/* Feature 1: Student Personal Attendance Search & Dashboard (+ Optional Admin All Classes Toggle) */}
      <StudentAttendanceInquiry
        initialStudentCode={initialStudentCode}
        canManageAttendance={canManageAttendance}
        allClasses={serializedClasses}
        locale={locale}
      />
    </div>
  );
}
