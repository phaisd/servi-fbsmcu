import { resolvePublicTenantId } from "@/features/news/server";
import { getResearchPublications } from "@/features/personnel/server";
import { getLocale } from "@/shared/lib/i18n/server";
import { BookOpen } from "lucide-react";
import { PortalResearchClient } from "./_components/portal-research-client";

export const metadata = {
  title: "ผลงานวิจัยและบทความวิชาการ | คณะพุทธศาสตร์ มจร",
  description: "คลังผลงานวิจัย บทความวิชาการ และดุษฎีนิพนธ์ โดยคณาจารย์คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
};

export default async function PublicResearchPage() {
  const locale = await getLocale();
  const tenantId = await resolvePublicTenantId();
  const publications = await getResearchPublications(tenantId);

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-3">
          <BookOpen className="h-3.5 w-3.5" />
          {locale === "th" ? "คลังผลงานวิชาการ" : "Research & Publications"}
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          {locale === "th" ? "ผลงานวิจัยและบทความวิชาการ" : "Academic Research & Publications"}
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-3xl leading-relaxed">
          {locale === "th"
            ? "รวบรวมผลงานวิจัย บทความวิชาการ และดุษฎีนิพนธ์ของคณาจารย์คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย ที่ได้รับการตีพิมพ์และเผยแพร่ในวารสารวิชาการระดับชาติตามฐานข้อมูล TCI พร้อมลิงก์เข้าถึงเอกสารฉบับเต็ม"
            : "A collection of research papers, academic articles, and dissertations published by the faculty members of the Faculty of Buddhism in indexed academic journals."}
        </p>
      </div>

      <PortalResearchClient publications={publications} locale={locale} />
    </div>
  );
}
