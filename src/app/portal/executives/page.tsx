import { resolvePublicTenantId } from "@/features/news/server";
import { getPublicPersonnelList } from "@/features/personnel/server";
import { getLocale } from "@/shared/lib/i18n/server";
import { Award } from "lucide-react";
import { PortalExecutivesClient } from "./_components/portal-executives-client";

export const dynamic = "force-dynamic";

export default async function PublicExecutivesPage() {
  const locale = await getLocale();
  const tenantId = await resolvePublicTenantId();
  const items = await getPublicPersonnelList(tenantId);

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-xs font-semibold uppercase tracking-wider mb-3">
          <Award className="h-3.5 w-3.5" />
          {locale === "th" ? "โครงสร้างผู้บริหารคณะพุทธศาสตร์" : "Faculty of Buddhism Executive Board"}
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          {locale === "th"
            ? "ทำเนียบผู้บริหารคณะพุทธศาสตร์"
            : "Executive Directory — Faculty of Buddhism"}
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-3xl leading-relaxed">
          {locale === "th"
            ? "โครงสร้างการบริหารงานคณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย ประกอบด้วย คณบดี รองคณบดี หัวหน้าภาควิชา ผู้อำนวยการหลักสูตร และสำนักงานคณบดี"
            : "Organizational leadership of the Faculty of Buddhism, Mahachulalongkornrajavidyalaya University, including the Dean, Vice Deans, Heads of Department, Program Directors, and Office of the Dean."}
        </p>
      </div>

      <PortalExecutivesClient items={items} locale={locale} />
    </div>
  );
}
