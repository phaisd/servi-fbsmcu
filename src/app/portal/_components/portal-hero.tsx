"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";
import {
  DEFAULT_HERO_SETTINGS,
  getHeroToneConfig,
  type TenantSettings,
  type HeroSettings,
} from "@/features/identity";

interface PortalHeroProps {
  tenantSettings?: TenantSettings | null;
  locale?: string;
}

export function PortalHero({ tenantSettings, locale = "th" }: PortalHeroProps) {
  const [activeTab] = React.useState<"TH" | "EN">(locale === "th" ? "TH" : "EN");

  const hero: HeroSettings = React.useMemo(() => {
    return tenantSettings?.hero ?? DEFAULT_HERO_SETTINGS;
  }, [tenantSettings?.hero]);

  const defaultBg = hero.bgModeDefault ?? "subtle";
  const [userBgMode, setUserBgMode] = React.useState<HeroSettings["bgModeDefault"] | null>(null);
  const bgMode = userBgMode ?? defaultBg;

  const brandName =
    activeTab === "TH"
      ? tenantSettings?.nameTh || "คณะพุทธศาสตร์ มจร"
      : tenantSettings?.nameEn || "Faculty of Buddhism";

  const cycleBgMode = () => {
    setUserBgMode((prev) => {
      const current = prev ?? defaultBg;
      if (current === "subtle") return "vivid";
      if (current === "vivid") return "minimal";
      return "subtle";
    });
  };

  const bgOpacityClass =
    bgMode === "vivid"
      ? "opacity-60"
      : bgMode === "subtle"
      ? "opacity-25"
      : "opacity-0";

  const heightClass =
    hero.heightMode === "full"
      ? "min-h-[calc(100vh-64px)]"
      : hero.heightMode === "compact"
      ? "min-h-[70vh] lg:min-h-[78vh]"
      : "min-h-[88vh] xl:min-h-[calc(100vh-64px)]";

  const bgImageUrl = hero.bgImageUrl?.trim() || "/buddhist-hero-bg.jpg";
  const showBgLayer = hero.bgModeDefault !== "hidden";

  const topTypo = hero.topTypography ?? DEFAULT_HERO_SETTINGS.topTypography;
  const manifesto = hero.manifesto ?? DEFAULT_HERO_SETTINGS.manifesto;
  const watermark = hero.bottomWatermark ?? DEFAULT_HERO_SETTINGS.bottomWatermark;
  const footerSettings = hero.footerRail ?? DEFAULT_HERO_SETTINGS.footerRail;

  const topTypoSizeClass =
    topTypo.fontSize === "small"
      ? "text-4xl sm:text-6xl lg:text-[5.5rem]"
      : topTypo.fontSize === "medium"
      ? "text-5xl sm:text-7xl lg:text-[7.5rem]"
      : topTypo.fontSize === "large"
      ? "text-6xl sm:text-8xl lg:text-[10rem]"
      : "text-7xl sm:text-9xl lg:text-[13.5rem]";

  const watermarkSizeClass =
    watermark.fontSize === "small"
      ? "text-4xl sm:text-6xl lg:text-[5rem]"
      : watermark.fontSize === "medium"
      ? "text-5xl sm:text-7xl lg:text-[7rem]"
      : watermark.fontSize === "large"
      ? "text-6xl sm:text-8xl lg:text-[9.5rem]"
      : "text-7xl sm:text-9xl lg:text-[13rem]";

  const toneConfig = React.useMemo(() => {
    return getHeroToneConfig(hero.textTone, hero.customTextColor);
  }, [hero.textTone, hero.customTextColor]);

  return (
    <section
      className={`relative w-full ${heightClass} bg-gradient-to-r from-[#b7bbc2] via-[#ced1d7] to-[#dadde2] overflow-hidden select-none font-sans flex flex-col justify-between`}
      style={{ color: toneConfig.bodyColor }}
    >
      
      {/* ══════════════════════════════════════════════════════════════
          BACKGROUND COMPONENT LAYER (User's Photo: Faculty Landmark)
          - Blended smoothly into the studio atmosphere
          - Allows user to toggle intensity (Subtle / Vivid / Minimal)
         ══════════════════════════════════════════════════════════════ */}
      {showBgLayer && (
        <>
          <div
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 pointer-events-none mix-blend-overlay ${bgOpacityClass}`}
            style={{
              backgroundImage: `url('${bgImageUrl}')`,
              filter: "saturate(1.2) contrast(1.1)",
            }}
          />
          <div
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 pointer-events-none mix-blend-multiply ${
              bgMode === "minimal" ? "opacity-0" : "opacity-15"
            }`}
            style={{
              backgroundImage: `url('${bgImageUrl}')`,
            }}
          />
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
          CINEMATIC 3D MOTION ARTWORK (Exact EMBER.dsgn Animation Loop)
          30 FPS buttery smooth animation from MotionSites AI
         ══════════════════════════════════════════════════════════════ */}
      {hero.showMotionArtwork && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden">
          <picture className="w-full h-full flex items-center justify-center">
            <source
              srcSet={hero.motionArtworkUrl?.trim() || "/ember_animation_30fps.webp"}
              type="image/webp"
            />
            <img
              src={hero.motionPreviewUrl?.trim() || "/ember_preview.gif"}
              alt="EMBER.dsgn 3D Creative Designer Motion"
              className="w-full h-full object-cover lg:object-contain object-center scale-[1.01] transition-transform duration-700"
            />
          </picture>
          {/* Soft edge feathering so the animation seamlessly melds with full-bleed viewports */}
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#b7bbc2] to-transparent pointer-events-none hidden xl:block" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#dadde2] to-transparent pointer-events-none hidden xl:block" />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          HERO BODY: Giant Masked Typography & Manifesto Overlay
         ══════════════════════════════════════════════════════════════ */}
      <div className="relative z-20 flex-1 px-6 sm:px-12 flex flex-col justify-between py-8 sm:py-12 lg:py-16 pointer-events-none">
        
        {/* Top Typography Row: Giant Mask Typography (Clickable to explore) */}
        {topTypo.enabled && (
          <div className="relative mt-2 lg:mt-4 pointer-events-auto">
            <Link
              href={topTypo.linkHref || "/portal/news"}
              className="inline-block group cursor-pointer"
            >
              <span
                className={`${topTypoSizeClass} font-black tracking-tighter leading-[0.8] select-none uppercase transition-all duration-300 drop-shadow-sm opacity-60 group-hover:opacity-100`}
                style={{
                  WebkitTextStroke: `2px ${toneConfig.strokeColor}`,
                  color: toneConfig.maskTextColor,
                }}
              >
                {topTypo.text || "EMBER"}
              </span>
            </Link>
          </div>
        )}

        {/* Middle Manifesto Block (Left side) with High-Contrast Glass Card */}
        {manifesto.enabled && (
          <div className="max-w-xl space-y-3.5 my-8 lg:my-0 pointer-events-auto">
            {/* Pill Badge */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-md shadow-xs border transition-colors"
              style={{
                backgroundColor: toneConfig.badgeBg,
                borderColor: toneConfig.badgeBorder,
              }}
            >
              <span
                className="w-2 h-2 rounded-full animate-ping"
                style={{ backgroundColor: toneConfig.accentColor }}
              />
              <p
                className="text-[11px] font-mono tracking-widest uppercase font-bold"
                style={{ color: toneConfig.primaryColor }}
              >
                {activeTab === "TH"
                  ? manifesto.badgeTextTh || manifesto.badgeTextEn || "เกี่ยวกับเรา"
                  : manifesto.badgeTextEn || manifesto.badgeTextTh || "ABOUT"}
              </p>
            </div>

            {/* Manifesto Card (High-Contrast Glassmorphism) */}
            <div
              className="p-5 sm:p-6 rounded-2xl backdrop-blur-xl border shadow-xl space-y-2.5 transition-all duration-300 ring-1 ring-black/5 animate-in fade-in duration-300"
              style={{
                backgroundColor: toneConfig.cardBg,
                borderColor: toneConfig.cardBorder,
              }}
            >
              <h2
                className="text-lg sm:text-xl font-bold tracking-tight flex items-center gap-2"
                style={{ color: toneConfig.primaryColor }}
              >
                <Sparkles className="w-4 h-4 shrink-0" style={{ color: toneConfig.accentColor }} />
                <span>
                  {activeTab === "TH"
                    ? manifesto.headingTh || brandName
                    : manifesto.headingEn || brandName}
                </span>
              </h2>
              <p
                className="text-sm sm:text-base font-medium leading-relaxed"
                style={{ color: toneConfig.bodyColor }}
              >
                {activeTab === "TH"
                  ? manifesto.bodyTh ||
                    "เราผสานแก่นธรรมโบราณเข้ากับนวัตกรรมแห่งอนาคต สร้างสรรค์ผู้นำทางจิตปัญญา ผ่านการศึกษาและวิจัยชั้นนำระดับสากล"
                  : manifesto.bodyEn ||
                    "We shape striking digital identities through bold contrasts and meaningful motion. Our design process transforms the primal into the powerful."}
              </p>
            </div>
          </div>
        )}

        {/* Bottom Giant Typography Watermark Alignment */}
        {watermark.enabled && (
          <div className="absolute right-6 sm:right-12 bottom-10 select-none pointer-events-none hidden sm:block">
            <span
              className={`${watermarkSizeClass} font-black tracking-tighter leading-none block select-none drop-shadow-sm transition-colors`}
              style={{
                WebkitTextStroke: `1.5px ${toneConfig.watermarkStroke}`,
                color: toneConfig.watermarkColor,
              }}
            >
              {watermark.text || "STUDIO"}
            </span>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          HERO FOOTER RAIL (Exact EMBER.dsgn Bottom Info Bar)
         ══════════════════════════════════════════════════════════════ */}
      {footerSettings.enabled && (
        <footer className="relative z-30 w-full px-6 sm:px-12 pb-7 flex flex-wrap items-end justify-between gap-6 text-[11px] font-mono tracking-wider uppercase">
          {/* Left: Explore CTA Button */}
          {footerSettings.ctaButton?.enabled ? (
            <div className="space-y-1">
              {footerSettings.ctaButton.eyebrow && (
                <p
                  className="text-[9px] tracking-widest font-bold"
                  style={{ color: toneConfig.mutedColor }}
                >
                  {footerSettings.ctaButton.eyebrow}
                </p>
              )}
              <Link
                href={footerSettings.ctaButton.href || "/portal/programs"}
                className="group inline-flex items-center gap-1.5 font-bold transition-all py-1.5 px-3 rounded-full backdrop-blur-md shadow-xs border hover:brightness-105"
                style={{
                  backgroundColor: toneConfig.pillBg,
                  color: toneConfig.primaryColor,
                  borderColor: toneConfig.pillBorder,
                }}
              >
                <span>
                  {activeTab === "TH"
                    ? footerSettings.ctaButton.labelTh || footerSettings.ctaButton.labelEn || "สำรวจบริการและผลงาน"
                    : footerSettings.ctaButton.labelEn || footerSettings.ctaButton.labelTh || "EXPLORE OUR WORK"}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          ) : (
            <div />
          )}

          {/* Center: Social Links & Background Component Control */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
            {footerSettings.socialLinks && footerSettings.socialLinks.length > 0 && (
              <div
                className="flex items-center gap-4 px-3.5 py-1.5 rounded-full backdrop-blur-md border shadow-2xs"
                style={{
                  backgroundColor: toneConfig.pillBg,
                  borderColor: toneConfig.pillBorder,
                }}
              >
                {footerSettings.socialLinks
                  .filter((s) => s.enabled !== false)
                  .map((s) => (
                    <a
                      key={s.id}
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold transition-opacity hover:opacity-100 opacity-80"
                      style={{ color: toneConfig.primaryColor }}
                    >
                      • {s.label}
                    </a>
                  ))}
              </div>
            )}

            {/* Background Photo Toggle: Fulfilling user request to have the photo as background component */}
            {hero.showBgToggle && showBgLayer && (
              <button
                type="button"
                onClick={cycleBgMode}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-sans font-bold transition-all cursor-pointer shadow-2xs backdrop-blur-md border hover:brightness-105"
                style={{
                  backgroundColor: toneConfig.pillBg,
                  borderColor: toneConfig.pillBorder,
                  color: toneConfig.primaryColor,
                }}
                title="สลับโหมดการแสดงภาพพื้นหลัง (ภาพสถานที่)"
              >
                <ImageIcon className="w-3 h-3" style={{ color: toneConfig.accentColor }} />
                <span>
                  ภาพพื้นหลัง:{" "}
                  {bgMode === "subtle"
                    ? "กลมกลืน (25%)"
                    : bgMode === "vivid"
                    ? "ชัดเจน (60%)"
                    : "สตูดิโอ (0%)"}
                </span>
              </button>
            )}
          </div>

          {/* Right: Location & Address */}
          {footerSettings.locationText?.enabled && (
            <div
              className="text-right leading-tight text-[10px] sm:text-[11px] px-3.5 py-1.5 rounded-xl backdrop-blur-md border shadow-2xs"
              style={{
                backgroundColor: toneConfig.pillBg,
                borderColor: toneConfig.pillBorder,
              }}
            >
              <p className="font-bold" style={{ color: toneConfig.primaryColor }}>
                {footerSettings.locationText.title?.trim() || brandName}
              </p>
              {footerSettings.locationText.address && (
                <p className="font-medium" style={{ color: toneConfig.mutedColor }}>
                  {footerSettings.locationText.address}
                </p>
              )}
            </div>
          )}
        </footer>
      )}

    </section>
  );
}
