import Link from "next/link";
import { requireSession, getDashboardStats } from "@/features/identity/server";
import { lookupStudentForCertificate } from "@/features/certificates/server";
import { getT } from "@/i18n/server";
import { LiyonCard } from "@/shared/components/liyon";

export default async function DashboardPage() {
  const ctx = await requireSession();
  const emailPrefix = (ctx.email || "").split("@")[0]?.trim() || "";
  const isStudentEmail =
    (ctx.email || "").toLowerCase().endsWith("@mcu.ac.th") &&
    (/^\d{8,12}$/.test(emailPrefix) || emailPrefix.toUpperCase().startsWith("TEMP-"));

  const [t, stats, studentProfile] = await Promise.all([
    getT(),
    getDashboardStats(ctx.tenantId),
    isStudentEmail ? lookupStudentForCertificate(ctx.tenantId, emailPrefix).catch(() => null) : Promise.resolve(null),
  ]);

  const cards = [
    { label: t("dash.users"), value: stats.users },
    { label: t("dash.activeUsers"), value: stats.activeUsers },
    { label: t("dash.roles"), value: stats.roles },
  ];
  return (
    <>
      <header className="ph">
        <h1>{t("dash.title")}</h1>
        <p className="sub">{t("dash.welcome", { name: ctx.userName })}</p>
      </header>

      {/* ศูนย์บริการนิสิตออนไลน์ (แสดงเด่นชัดเมื่อนิสิตเข้าสู่ระบบด้วย รหัสนิสิต@mcu.ac.th) */}
      {(isStudentEmail || studentProfile) && (
        <div className="mb-8 rounded-3xl border border-indigo-200 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-lg">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-bold text-amber-300 ring-1 ring-amber-400/30">
                🎓 ระบบบริการนิสิตออนไลน์ • คณะพุทธศาสตร์ มจร (Student Service Portal)
              </span>
              <h2 className="text-xl font-extrabold sm:text-2xl">
                ยินดีต้อนรับ {studentProfile?.fullName || ctx.userName}
              </h2>
              <p className="text-xs text-slate-300 sm:text-sm">
                รหัสนิสิต:{" "}
                <span className="font-mono font-bold text-amber-300">
                  {studentProfile?.studentCode || emailPrefix.toUpperCase()}
                </span>{" "}
                {studentProfile?.degreeLevel ? `• ${studentProfile.degreeLevel}` : ""}{" "}
                {studentProfile?.major ? `• สาขาวิชา ${studentProfile.major}` : ""}{" "}
                {studentProfile?.classYear ? `• ${studentProfile.classYear}` : ""}
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <Link
                href="/portal/attendance"
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-xs font-extrabold text-primary-foreground shadow-md transition hover:bg-primary/90 sm:text-sm"
              >
                🕒 เวลาเรียน & ลงทะเบียนวิชา →
              </Link>
              <Link
                href="/portal/certificates/request"
                className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 text-xs font-extrabold text-slate-950 shadow-md transition hover:bg-amber-300 sm:text-sm"
              >
                📜 ขอหนังสือรับรอง
              </Link>
              <Link
                href="/portal/certificates"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-xs font-bold text-white transition hover:bg-white/20 sm:text-sm"
              >
                🔍 ติดตามสถานะใบรับรอง
              </Link>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 border-t border-white/15 pt-4 sm:grid-cols-3">
            <Link
              href="/portal/attendance"
              className="rounded-2xl border border-white/15 bg-white/5 p-3.5 transition hover:bg-white/10"
            >
              <div className="text-xs font-bold text-amber-300">🕒 เวลาเรียน & ลงทะเบียนวิชา</div>
              <div className="mt-0.5 text-[11px] text-slate-300">
                ดูสถิติเวลาเรียน สิทธิ์สอบ และลงทะเบียนรายวิชาเข้าชั้นเรียน
              </div>
            </Link>
            <Link
              href="/portal/programs"
              className="rounded-2xl border border-white/15 bg-white/5 p-3.5 transition hover:bg-white/10"
            >
              <div className="text-xs font-bold text-sky-300">📅 ตารางเรียนประจำภาคการศึกษา</div>
              <div className="mt-0.5 text-[11px] text-slate-300">
                ตรวจสอบตารางเรียน ห้องเรียน และรายชื่ออาจารย์ผู้สอน
              </div>
            </Link>
            <Link
              href="/documents"
              className="rounded-2xl border border-white/15 bg-white/5 p-3.5 transition hover:bg-white/10"
            >
              <div className="text-xs font-bold text-emerald-300">📄 ดาวน์โหลดเอกสารและแบบฟอร์ม</div>
              <div className="mt-0.5 text-[11px] text-slate-300">
                แบบฟอร์มคำร้อง ประกาศ และระเบียบคณะพุทธศาสตร์
              </div>
            </Link>
          </div>
        </div>
      )}

      <div className="kpis">
        {cards.map((c) => (
          <LiyonCard key={c.label} className="kpi">
            <span className="lab">{c.label}</span>
            <b className="val num">{c.value}</b>
          </LiyonCard>
        ))}
      </div>

      <div className="mt-8 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-2xl border border-primary/20 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold bg-primary/20 text-primary">
            ระบบงานบริการการศึกษา
          </span>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            ระบบตรวจสอบเวลาเข้าเรียนและสิทธิ์สอบ (Student Attendance System)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            จัดการรายวิชา ตารางคาบเรียน เช็กชื่อนิสิต สรุปเวลาเรียน และคำนวณสิทธิ์สอบวัดผลปลายภาค (เกณฑ์ &ge; 80%)
          </p>
        </div>
        <a
          href="/attendance"
          className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition shadow-sm whitespace-nowrap"
        >
          เข้าสู่ระบบเวลาเรียน &rarr;
        </a>
      </div>
    </>
  );
}
