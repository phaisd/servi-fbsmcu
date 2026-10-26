import { resolvePublicTenantId } from "@/features/news/server";
import { getPublicPersonnelList, getPersonnelPortalConfig } from "@/features/personnel/server";
import { getLocale } from "@/shared/lib/i18n/server";
import { Users } from "lucide-react";
import { PortalPersonnelClient } from "./_components/portal-personnel-client";

export default async function PublicPersonnelPage(props: {
  searchParams?: Promise<{ dept?: string; view?: string }>;
}) {
  const searchParams = props.searchParams ? await props.searchParams : undefined;
  const locale = await getLocale();
  const tenantId = await resolvePublicTenantId();
  const [items, portalConfig] = await Promise.all([
    getPublicPersonnelList(tenantId),
    getPersonnelPortalConfig(tenantId),
  ]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-3">
          <Users className="h-3.5 w-3.5" />
          {locale === "th" ? "ทำเนียบคณาจารย์และบุคลากร" : "Faculty & Personnel Directory"}
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          {locale === "th" ? "คณาจารย์และบุคลากรคณะพุทธศาสตร์" : "Faculty of Buddhism Personnel"}
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-3xl leading-relaxed">
          {locale === "th"
            ? "รวมรายนามคณาจารย์ประจำหลักสูตร ผู้ทรงคุณวุฒิด้านพระไตรปิฎกศึกษา ปรัชญา และศาสนาเปรียบเทียบ พร้อมประวัติการศึกษา ประสบการณ์สอน และคลังผลงานวิจัยตีพิมพ์ในวารสารระดับชาติ (TCI) จำแนกตามปี พ.ศ."
            : "Directory of academic faculty and personnel of the Faculty of Buddhism, including academic background, teaching experience, and published research articles categorized by academic year."}
        </p>
      </div>

      <PortalPersonnelClient
        items={items}
        locale={locale}
        initialDept={searchParams?.dept}
        initialView={searchParams?.view}
        publicationYearsLimit={portalConfig.publicationYearsLimit}
      />
    </div>
  );
}
