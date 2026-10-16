import { requireSession, getDashboardStats } from "@/features/identity/server";
import { getT } from "@/i18n/server";
import { LiyonCard } from "@/shared/components/liyon";

export default async function DashboardPage() {
  const ctx = await requireSession();
  const [t, stats] = await Promise.all([getT(), getDashboardStats(ctx.tenantId)]);
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
