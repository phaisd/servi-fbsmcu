"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building, Sparkles, Grid, Newspaper, PanelBottom, Mail, BookOpen } from "lucide-react";
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
  DEFAULT_GEMINI_SETTINGS,
  DEFAULT_MANUAL_SETTINGS,
  type TenantSettings,
  type FontSizePreference,
} from "@/features/identity";
import { updateSettingsAction } from "@/features/identity/actions";
import { GeneralSettingsTab } from "./general-settings-tab";
import { HeroSettingsTab } from "./hero-settings-tab";
import { ServicesSettingsTab } from "./services-settings-tab";
import { PortalContentSettingsTab } from "./portal-content-settings-tab";
import { FooterSettingsTab } from "./footer-settings-tab";
import { SmtpSettingsTab } from "./smtp-settings-tab";
import { GeminiSettingsTab } from "./gemini-settings-tab";
import { ManualSettingsTab } from "./manual-settings-tab";

export function SettingsForm({ initial }: { initial: TenantSettings }) {
  const t = useT();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "general" | "hero" | "services" | "content" | "footer" | "manual" | "smtp" | "gemini"
  >("general");
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
    gemini: initial.gemini ?? DEFAULT_GEMINI_SETTINGS,
    manual: initial.manual ?? DEFAULT_MANUAL_SETTINGS,
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
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-muted/40 rounded-2xl border border-border/60 mb-6 max-w-5xl">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={cn(
            "px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2",
            activeTab === "general"
              ? "bg-primary text-primary-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
          )}
        >
          <Building className="w-4 h-4" />
          <span>ข้อมูลองค์กร & แบรนด์</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("hero")}
          className={cn(
            "px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2",
            activeTab === "hero"
              ? "bg-primary text-primary-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
          )}
        >
          <Sparkles className="w-4 h-4" />
          <span>ปรับแต่ง Hero Section</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("services")}
          className={cn(
            "px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2",
            activeTab === "services"
              ? "bg-primary text-primary-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
          )}
        >
          <Grid className="w-4 h-4" />
          <span>เมนูบริการ (Services)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("content")}
          className={cn(
            "px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2",
            activeTab === "content"
              ? "bg-primary text-primary-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
          )}
        >
          <Newspaper className="w-4 h-4" />
          <span>ข่าวสาร & แบนเนอร์</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("footer")}
          className={cn(
            "px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2",
            activeTab === "footer"
              ? "bg-primary text-primary-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
          )}
        >
          <PanelBottom className="w-4 h-4" />
          <span>ท้ายเว็บ (Portal Footer)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("manual")}
          className={cn(
            "px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2",
            activeTab === "manual"
              ? "bg-primary text-primary-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
          )}
        >
          <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>จัดการคู่มือการใช้งานระบบ</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("smtp")}
          className={cn(
            "px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2",
            activeTab === "smtp"
              ? "bg-primary text-primary-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
          )}
        >
          <Mail className="w-4 h-4" />
          <span>อีเมล & SMTP (Gmail)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("gemini")}
          className={cn(
            "px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2",
            activeTab === "gemini"
              ? "bg-primary text-primary-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
          )}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>AI & Gemini API</span>
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
        ) : activeTab === "manual" ? (
          <ManualSettingsTab
            value={form.manual}
            onChange={(m) => setForm((prev) => ({ ...prev, manual: m }))}
          />
        ) : activeTab === "smtp" ? (
          <SmtpSettingsTab
            smtp={form.smtp}
            errors={errors}
            onChange={(s) => setForm((prev) => ({ ...prev, smtp: s }))}
          />
        ) : activeTab === "gemini" ? (
          <GeminiSettingsTab
            gemini={form.gemini}
            errors={errors}
            onChange={(g) => setForm((prev) => ({ ...prev, gemini: g }))}
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
