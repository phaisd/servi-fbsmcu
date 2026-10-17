"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building, Sparkles, Grid, Newspaper, PanelBottom } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/shared/lib/i18n/client";
import { cn } from "@/shared/lib/utils";
import type { PaletteId } from "@/shared/lib/palette";
import {
  DEFAULT_HERO_SETTINGS,
  DEFAULT_SERVICES_SECTION_SETTINGS,
  DEFAULT_NEWS_SECTION_SETTINGS,
  DEFAULT_FACULTY_BANNER_SETTINGS,
  DEFAULT_FOOTER_SETTINGS,
  DEFAULT_SMTP_SETTINGS,
  type TenantSettings,
  type FontSizePreference,
} from "@/features/identity";
import { updateSettingsAction } from "@/features/identity/actions";
import { Mail } from "lucide-react";
import { GeneralSettingsTab } from "./general-settings-tab";
import { HeroSettingsTab } from "./hero-settings-tab";
import { ServicesSettingsTab } from "./services-settings-tab";
import { PortalContentSettingsTab } from "./portal-content-settings-tab";
import { FooterSettingsTab } from "./footer-settings-tab";
import { SmtpSettingsTab } from "./smtp-settings-tab";

export function SettingsForm({ initial }: { initial: TenantSettings }) {
  const t = useT();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"general" | "hero" | "services" | "content" | "footer" | "smtp">("general");
  const [form, setForm] = useState({
    nameTh: initial.nameTh,
    nameEn: initial.nameEn,
    logoUrl: initial.logoUrl ?? "",
    palette: initial.palette as PaletteId,
    fontSize: (initial.fontSize ?? "normal") as FontSizePreference,
    hero: initial.hero ?? DEFAULT_HERO_SETTINGS,
    servicesSection: initial.servicesSection ?? DEFAULT_SERVICES_SECTION_SETTINGS,
    newsSection: initial.newsSection ?? DEFAULT_NEWS_SECTION_SETTINGS,
    facultyBanner: initial.facultyBanner ?? DEFAULT_FACULTY_BANNER_SETTINGS,
    footer: initial.footer ?? DEFAULT_FOOTER_SETTINGS,
    smtp: initial.smtp ?? DEFAULT_SMTP_SETTINGS,
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [pending, start] = useTransition();

  function save() {
    start(async () => {
      const r = await updateSettingsAction(form);
      if (!r.ok) {
        setErrors(r.error.fieldErrors ?? {});
        const firstError = Object.values(r.error.fieldErrors ?? {}).flat()[0];
        toast.error(firstError || (r.error.code ? t(`error.${r.error.code}`) : "บันทึกการตั้งค่าไม่สำเร็จ"));
        return;
      }
      setErrors({});
      toast.success(t("settings.saveOk"));
      router.refresh();
    });
  }

  return (
    <>
      <header className="ph">
        <h1>{t("settings.title")}</h1>
      </header>

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 border-b border-border/80 mb-6 px-1 max-w-5xl">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={cn(
            "px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 -mb-px",
            activeTab === "general"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Building className="w-4 h-4" />
          <span>ข้อมูลองค์กร & แบรนด์</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("hero")}
          className={cn(
            "px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 -mb-px",
            activeTab === "hero"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Sparkles className="w-4 h-4" />
          <span>ปรับแต่ง Hero Section (หน้าแรก Portal)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("services")}
          className={cn(
            "px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 -mb-px",
            activeTab === "services"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Grid className="w-4 h-4" />
          <span>บริการสำคัญ & หลักสูตร (Quick Services)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("content")}
          className={cn(
            "px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 -mb-px",
            activeTab === "content"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Newspaper className="w-4 h-4" />
          <span>ข่าวสาร & แบนเนอร์คณาจารย์</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("footer")}
          className={cn(
            "px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 -mb-px",
            activeTab === "footer"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <PanelBottom className="w-4 h-4" />
          <span>ท้ายเว็บ (Portal Footer)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("smtp")}
          className={cn(
            "px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 -mb-px",
            activeTab === "smtp"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Mail className="w-4 h-4" />
          <span>อีเมล & SMTP (Gmail)</span>
        </button>
      </div>

      <div className="set-cards">
        {activeTab === "hero" ? (
          <HeroSettingsTab
            value={form.hero}
            onChange={(h) => setForm((prev) => ({ ...prev, hero: h }))}
          />
        ) : activeTab === "services" ? (
          <ServicesSettingsTab
            value={form.servicesSection}
            onChange={(s) => setForm((prev) => ({ ...prev, servicesSection: s }))}
          />
        ) : activeTab === "content" ? (
          <PortalContentSettingsTab
            newsValue={form.newsSection}
            onNewsChange={(n) => setForm((prev) => ({ ...prev, newsSection: n }))}
            bannerValue={form.facultyBanner}
            onBannerChange={(b) => setForm((prev) => ({ ...prev, facultyBanner: b }))}
          />
        ) : activeTab === "footer" ? (
          <FooterSettingsTab
            value={form.footer}
            onChange={(f) => setForm((prev) => ({ ...prev, footer: f }))}
          />
        ) : activeTab === "smtp" ? (
          <SmtpSettingsTab
            smtp={form.smtp}
            errors={errors}
            onChange={(s) => setForm((prev) => ({ ...prev, smtp: s }))}
          />
        ) : (
          <GeneralSettingsTab
            nameTh={form.nameTh}
            nameEn={form.nameEn}
            logoUrl={form.logoUrl}
            palette={form.palette}
            fontSize={form.fontSize}
            errors={errors}
            onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
          />
        )}
        <div className="savebar">
          <Button type="button" onClick={save} disabled={pending}>
            {t("common.save")}
          </Button>
        </div>
      </div>
    </>
  );
}
