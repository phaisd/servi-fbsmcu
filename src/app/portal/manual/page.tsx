import { BookOpen } from "lucide-react";
import { getLocale } from "@/shared/lib/i18n/server";
import { PortalManualClient } from "./_components/portal-manual-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "ศูนย์คู่มือการใช้งานระบบ — คณะพุทธศาสตร์ มจร",
  description: "คู่มือการใช้งานระบบสารสนเทศและการบริหารจัดการข้อมูล คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
};

export default async function PublicManualPage() {
  const locale = await getLocale();

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold uppercase tracking-wider mb-3">
          <BookOpen className="h-3.5 w-3.5" />
          {locale === "th" ? "ศูนย์ช่วยเหลือและเอกสารแนะนำ" : "Help Center & Documentation"}
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          {locale === "th"
            ? "ศูนย์คู่มือการใช้งานระบบ (User Manual)"
            : "User Manual & System Documentation"}
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-3xl leading-relaxed">
          {locale === "th"
            ? "คู่มือแนะนำขั้นตอนการใช้งานระบบสำหรับผู้บริหาร คณาจารย์ เจ้าหน้าที่ และนิสิต คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย (มจร)"
            : "System documentation and user guides for administrators, faculty members, staff, and students of the Faculty of Buddhism, MCU."}
        </p>
      </div>

      <PortalManualClient />
    </div>
  );
}
