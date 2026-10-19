import Link from "next/link";
import { resolveTenantSettings } from "@/features/identity/server";
import { getPublicNewsList, resolvePublicTenantId } from "@/features/news/server";
import { getLocale } from "@/shared/lib/i18n/server";
import { formatDate } from "@/shared/lib/format";
import { PortalHero } from "./_components/portal-hero";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  FileText,
  Users,
  Award,
  Video,
  Clock,
  ChevronRight,
  Sparkles,
  GraduationCap,
  Globe,
  Heart,
  ShieldCheck,
  BarChart3,
} from "lucide-react";
import {
  DEFAULT_SERVICES_SECTION_SETTINGS,
  DEFAULT_NEWS_SECTION_SETTINGS,
  DEFAULT_FACULTY_BANNER_SETTINGS,
} from "@/features/identity";
import { getExecutiveAcademicStats } from "@/features/attendance/server";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  Video,
  Award,
  FileText,
  GraduationCap,
  Calendar,
  Users,
  Globe,
  Sparkles,
  Clock,
  Heart,
  ShieldCheck,
  BarChart3,
};

export const dynamic = "force-dynamic";

export default async function PortalIndexPage() {
  const [settings, locale, tenantId] = await Promise.all([
    resolveTenantSettings(),
    getLocale(),
    resolvePublicTenantId(),
  ]);

  const newsConfig = settings?.newsSection ?? DEFAULT_NEWS_SECTION_SETTINGS;
  const facultyConfig = settings?.facultyBanner ?? DEFAULT_FACULTY_BANNER_SETTINGS;

  const [academicStats, newsRes] = await Promise.all([
    getExecutiveAcademicStats(tenantId).catch(() => null),
    newsConfig.enabled
      ? getPublicNewsList(tenantId, {
          page: 1,
          pageSize: newsConfig.pageSize || 4,
        }).catch(() => ({ items: [] }))
      : Promise.resolve({ items: [] }),
  ]);
  const latestNews = newsRes.items;

  const servicesConfig = settings?.servicesSection ?? DEFAULT_SERVICES_SECTION_SETTINGS;
  const activeServiceItems = (servicesConfig.items ?? []).filter((s) => s.enabled !== false);

  return (
    <div className="w-full">
      {/* ══════════ EMBER.dsgn / MotionSites-style Cinematic Hero Section (Full Bleed) ══════════ */}
      <PortalHero tenantSettings={settings} locale={locale} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
        {/* ══════════ Section 1: Quick Services Grid ══════════ */}
        {servicesConfig.enabled && activeServiceItems.length > 0 && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>
                    {locale === "th"
                      ? servicesConfig.eyebrowTh || "บริการสำคัญ"
                      : servicesConfig.eyebrowEn || "Core Services"}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
                  {locale === "th"
                    ? servicesConfig.titleTh || "ระบบบริการการศึกษาและสารสนเทศ"
                    : servicesConfig.titleEn || "Academic & Information Services"}
                </h2>
              </div>
              {servicesConfig.showViewAll && (
                <Link
                  href={servicesConfig.viewAllHref || "/portal/programs"}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
                >
                  <span>
                    {locale === "th"
                      ? servicesConfig.viewAllTextTh || "ดูบริการทั้งหมด"
                      : servicesConfig.viewAllTextEn || "View All"}
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {activeServiceItems.map((service) => {
                const Icon = ICON_MAP[service.icon] || Sparkles;
                const title =
                  locale === "th"
                    ? service.titleTh || service.titleEn
                    : service.titleEn || service.titleTh;
                const desc =
                  locale === "th"
                    ? service.descTh || service.descEn
                    : service.descEn || service.descTh;
                const badge =
                  locale === "th"
                    ? service.badgeTh || service.badgeEn
                    : service.badgeEn || service.badgeTh;

                return (
                  <Link
                    key={service.id}
                    href={service.href || "#"}
                    className="group relative flex flex-col justify-between p-6 rounded-2xl bg-card/60 hover:bg-card border border-border/60 hover:border-border transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Icon className="h-6 w-6" />
                        </div>
                        {badge && (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {badge}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-lg tracking-tight group-hover:text-primary transition-colors">
                        {title}
                      </h3>
                      {desc && (
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                          {desc}
                        </p>
                      )}
                    </div>

                    <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <span>{locale === "th" ? "เข้าใช้งาน" : "Access Service"}</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ══════════ Section: Executive Academic Overview & Cohort Analytics (แดชบอร์ดสรุปสถิตินิสิตแยกชั้นปี) ══════════ */}
        {academicStats && (
          <section className="space-y-6 rounded-3xl border border-border/80 bg-gradient-to-b from-card to-muted/30 p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                  <BarChart3 className="h-4 w-4" />
                  <span>
                    {locale === "th"
                      ? "ศูนย์ข้อมูลสถิตินิสิตและงานวิชาการสำหรับผู้บริหาร"
                      : "Executive Academic & Cohort Intelligence"}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-foreground">
                  {locale === "th"
                    ? "สรุปภาพรวมจำนวนนิสิตแยกตามชั้นปีและหลักสูตร"
                    : "Student Cohort Matrix & Program Distribution"}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {locale === "th"
                    ? "สถิติข้อมูลนิสิตคณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย อัปเดตล่าสุดตามทะเบียนกลาง"
                    : "Official student enrollment and academic distribution metrics of the Faculty of Buddhism, MCU."}
                </p>
              </div>

              <Link
                href="/attendance/students"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-xs transition hover:bg-primary/90 whitespace-nowrap self-start sm:self-center"
              >
                <span>{locale === "th" ? "เปิดทะเบียนนิสิต & เมทริกซ์เต็มรูปแบบ" : "Open Cohort Matrix"}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5">
                <span className="text-2xs font-semibold text-primary block">
                  {locale === "th" ? "นิสิตทั้งหมดในทะเบียน" : "Total Enrolled Students"}
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1">
                  {academicStats.totalStudents} <span className="text-xs font-normal text-muted-foreground">รูป/คน</span>
                </div>
                <span className="text-[11px] text-muted-foreground mt-1 block">
                  {locale === "th" ? `เปิดสอน ${academicStats.totalCourses} รายวิชา` : `${academicStats.totalCourses} active courses`}
                </span>
              </div>

              <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                <span className="text-2xs font-semibold text-emerald-800 dark:text-emerald-300 block">
                  {locale === "th" ? "ชั้นปี 1 (First Year)" : "Year 1 Cohort"}
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-900 dark:text-emerald-200 mt-1">
                  {academicStats.yearDistribution.year1} <span className="text-xs font-normal text-muted-foreground">รูป/คน</span>
                </div>
                <span className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 mt-1 block">
                  {locale === "th" ? "นิสิตเข้าใหม่ล่าสุด" : "Freshmen cohort"}
                </span>
              </div>

              <div className="p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5">
                <span className="text-2xs font-semibold text-blue-800 dark:text-blue-300 block">
                  {locale === "th" ? "ชั้นปี 2 - 3 (Sophomore & Junior)" : "Years 2 & 3"}
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-blue-900 dark:text-blue-200 mt-1">
                  {academicStats.yearDistribution.year2 + academicStats.yearDistribution.year3} <span className="text-xs font-normal text-muted-foreground">รูป/คน</span>
                </div>
                <span className="text-[11px] text-blue-700/80 dark:text-blue-300/80 mt-1 block">
                  {locale === "th" ? `ปี 2: ${academicStats.yearDistribution.year2} | ปี 3: ${academicStats.yearDistribution.year3}` : `Yr 2: ${academicStats.yearDistribution.year2} | Yr 3: ${academicStats.yearDistribution.year3}`}
                </span>
              </div>

              <div className="p-4 rounded-2xl border border-purple-500/20 bg-purple-500/5">
                <span className="text-2xs font-semibold text-purple-800 dark:text-purple-300 block">
                  {locale === "th" ? "ชั้นปี 4 & บัณฑิตศึกษา" : "Year 4 & Graduate"}
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-purple-900 dark:text-purple-200 mt-1">
                  {academicStats.yearDistribution.year4 + academicStats.programDistribution.graduate} <span className="text-xs font-normal text-muted-foreground">รูป/คน</span>
                </div>
                <span className="text-[11px] text-purple-700/80 dark:text-purple-300/80 mt-1 block">
                  {locale === "th" ? `ปี 4: ${academicStats.yearDistribution.year4} | ป.โท-เอก: ${academicStats.programDistribution.graduate}` : `Yr 4: ${academicStats.yearDistribution.year4} | Grad: ${academicStats.programDistribution.graduate}`}
                </span>
              </div>
            </div>

            {/* Secondary detail row: Program languages and quick cohort insight */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-muted/40 p-3.5 text-xs border border-border/50">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-foreground">สัดส่วนหลักสูตร:</span>
                <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/10 px-2 py-0.5 text-2xs font-semibold text-sky-700 dark:text-sky-300">
                  🇹🇭 ภาคภาษาไทย: {academicStats.programDistribution.thai} คน
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-2xs font-semibold text-amber-700 dark:text-amber-300">
                  🇬🇧 ภาคภาษาอังกฤษ (Inter): {academicStats.programDistribution.english} คน
                </span>
                {academicStats.programDistribution.graduate > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2 py-0.5 text-2xs font-semibold text-purple-700 dark:text-purple-300">
                    🎓 บัณฑิตศึกษา: {academicStats.programDistribution.graduate} คน
                  </span>
                )}
              </div>

              <div className="text-2xs text-muted-foreground">
                <Link
                  href="/attendance/students"
                  className="font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  {locale === "th" ? "คลิกเพื่อดูทะเบียนนิสิตและบัตรประวัตินิสิต" : "View Student Directory & Profiles"} &rarr;
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ══════════ Section 2: Latest News & Activities ══════════ */}
        {newsConfig.enabled && latestNews.length > 0 && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {locale === "th"
                      ? newsConfig.eyebrowTh || "ประชาสัมพันธ์"
                      : newsConfig.eyebrowEn || "Announcements"}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
                  {locale === "th"
                    ? newsConfig.titleTh || "ข่าวสารและกิจกรรมล่าสุด"
                    : newsConfig.titleEn || "Latest News & Events"}
                </h2>
              </div>
              {newsConfig.showViewAll && (
                <Link
                  href={newsConfig.viewAllHref || "/portal/news"}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
                >
                  <span>
                    {locale === "th"
                      ? newsConfig.viewAllTextTh || "ดูข่าวสารทั้งหมด"
                      : newsConfig.viewAllTextEn || "All News"}
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {latestNews.map((news) => {
                const title = locale === "th" ? news.titleTh : (news.titleEn || news.titleTh);
                const summary = locale === "th" ? news.summaryTh : (news.summaryEn || news.summaryTh);
                return (
                  <Link
                    key={news.id}
                    href={`/portal/news/${news.slug}`}
                    className="group flex flex-col rounded-2xl overflow-hidden border border-border/60 bg-card hover:bg-card/80 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                      {news.coverImageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={news.coverImageUrl}
                          alt={title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-900/20 to-emerald-900/20 text-muted-foreground">
                          <BookOpen className="h-10 w-10 opacity-30" />
                        </div>
                      )}
                    </div>
                    <div className="p-5 flex flex-col flex-1 justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-2">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{news.publishedAt ? formatDate(news.publishedAt, locale) : "เร็วๆ นี้"}</span>
                        </div>
                        <h3 className="font-bold text-sm sm:text-base line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                          {title}
                        </h3>
                        {summary && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-2 leading-relaxed">
                            {summary}
                          </p>
                        )}
                      </div>
                      <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs font-medium text-primary">
                        <span>{locale === "th" ? "อ่านรายละเอียด" : "Read More"}</span>
                        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ══════════ Section 3: Faculty Personnel & Community Banner ══════════ */}
        {facultyConfig.enabled && (
          <section className="relative rounded-3xl overflow-hidden p-8 sm:p-12 border border-border/60 bg-gradient-to-r from-card to-muted/50 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                <Users className="h-3.5 w-3.5" />
                <span>
                  {locale === "th"
                    ? facultyConfig.badgeTh || "คณาจารย์ผู้ทรงคุณวุฒิ"
                    : facultyConfig.badgeEn || "Distinguished Faculty"}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {locale === "th"
                  ? facultyConfig.headingTh || "รวมคณาจารย์และนักวิชาการพระพุทธศาสนาระดับโลก"
                  : facultyConfig.headingEn || "World-Class Buddhist Scholars & Academic Faculty"}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {locale === "th"
                  ? facultyConfig.descTh
                  : facultyConfig.descEn || facultyConfig.descTh}
              </p>
              <div className="pt-2">
                <Link
                  href={facultyConfig.buttonHref || "/portal/personnel"}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-xs tracking-wider uppercase hover:opacity-90 transition-opacity"
                >
                  <span>
                    {locale === "th"
                      ? facultyConfig.buttonLabelTh || "ทำเนียบคณาจารย์และบุคลากร"
                      : facultyConfig.buttonLabelEn || "View Faculty Directory"}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {facultyConfig.showCircles && (
              <div className="flex -space-x-4 overflow-hidden p-4">
                <div className="h-20 w-20 rounded-full border-4 border-background bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {facultyConfig.circle1Text || "MCU"}
                </div>
                <div className="h-20 w-20 rounded-full border-4 border-background bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {facultyConfig.circle2Text || "ธรรม"}
                </div>
                <div className="h-20 w-20 rounded-full border-4 border-background bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {facultyConfig.circle3Text || "ปัญญา"}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
