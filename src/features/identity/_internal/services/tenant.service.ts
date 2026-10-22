import { cache } from "react";
import { prisma, type Db } from "@/shared/lib/infra/prisma";
import { DEFAULT_PALETTE, isPalette, type PaletteId } from "@/shared/lib/palette";
import { errors } from "@/shared/lib/errors";
import { writeAudit } from "../audit";
import type { UpdateSettingsInput } from "../validations/settings";
import {
  DEFAULT_HERO_SETTINGS,
  DEFAULT_SERVICES_SECTION_SETTINGS,
  DEFAULT_NEWS_SECTION_SETTINGS,
  DEFAULT_FACULTY_BANNER_SETTINGS,
  DEFAULT_FOOTER_SETTINGS,
  DEFAULT_FOOTER_QUICK_LINKS,
  DEFAULT_FOOTER_SYSTEM_LINKS,
  DEFAULT_SMTP_SETTINGS,
  DEFAULT_GEMINI_SETTINGS,
  type TenantSettings,
  type GeminiSettings,
  type HeroSettings,
  type HeroNavLink,
  type HeroSocialLink,
  type ServicesSectionSettings,
  type ServiceItem,
  type NewsSectionSettings,
  type FacultyBannerSettings,
  type FooterSettings,
  type FooterLink,
  type SmtpSettings,
} from "../validations/settings";

export type {
  TenantSettings,
  HeroSettings,
  HeroNavLink,
  HeroSocialLink,
  ServicesSectionSettings,
  ServiceItem,
  NewsSectionSettings,
  FacultyBannerSettings,
  FooterSettings,
  FooterLink,
  SmtpSettings,
  GeminiSettings,
};
export {
  DEFAULT_HERO_SETTINGS,
  DEFAULT_SERVICES_SECTION_SETTINGS,
  DEFAULT_NEWS_SECTION_SETTINGS,
  DEFAULT_FACULTY_BANNER_SETTINGS,
  DEFAULT_FOOTER_SETTINGS,
  DEFAULT_FOOTER_QUICK_LINKS,
  DEFAULT_FOOTER_SYSTEM_LINKS,
  DEFAULT_SMTP_SETTINGS,
  DEFAULT_GEMINI_SETTINGS,
};

async function readTenantSettings(tenantId: string, db: Db): Promise<TenantSettings> {
  const t = await db.tenant.findUnique({ where: { id: tenantId } });
  if (!t) throw errors.not_found();
  const settingsObj = (t.settings as {
    palette?: unknown;
    fontSize?: unknown;
    hero?: unknown;
    servicesSection?: unknown;
    newsSection?: unknown;
    facultyBanner?: unknown;
    footer?: unknown;
    smtp?: unknown;
    gemini?: unknown;
  }) ?? {};
  const p = settingsObj.palette;
  const rawFontSize = settingsObj.fontSize as string;
  const fontSize = (["small", "normal", "medium", "large", "xlarge"] as const).includes(rawFontSize as any)
    ? (rawFontSize as "small" | "normal" | "medium" | "large" | "xlarge")
    : "normal";
  const rawHero = (settingsObj.hero as Partial<HeroSettings>) ?? {};
  const hero: HeroSettings = {
    ...DEFAULT_HERO_SETTINGS,
    ...rawHero,
    topTypography: { ...DEFAULT_HERO_SETTINGS.topTypography, ...(rawHero.topTypography ?? {}) },
    bottomWatermark: { ...DEFAULT_HERO_SETTINGS.bottomWatermark, ...(rawHero.bottomWatermark ?? {}) },
    manifesto: { ...DEFAULT_HERO_SETTINGS.manifesto, ...(rawHero.manifesto ?? {}) },
    header: {
      ...DEFAULT_HERO_SETTINGS.header,
      ...(rawHero.header ?? {}),
      contactPill: { ...DEFAULT_HERO_SETTINGS.header.contactPill, ...(rawHero.header?.contactPill ?? {}) },
      navLinks: rawHero.header?.navLinks?.length ? rawHero.header.navLinks : DEFAULT_HERO_SETTINGS.header.navLinks,
    },
    footerRail: {
      ...DEFAULT_HERO_SETTINGS.footerRail,
      ...(rawHero.footerRail ?? {}),
      ctaButton: { ...DEFAULT_HERO_SETTINGS.footerRail.ctaButton, ...(rawHero.footerRail?.ctaButton ?? {}) },
      socialLinks: rawHero.footerRail?.socialLinks?.length ? rawHero.footerRail.socialLinks : DEFAULT_HERO_SETTINGS.footerRail.socialLinks,
      locationText: { ...DEFAULT_HERO_SETTINGS.footerRail.locationText, ...(rawHero.footerRail?.locationText ?? {}) },
    },
  };

  const rawServices = (settingsObj.servicesSection as Partial<ServicesSectionSettings>) ?? {};
  const servicesSection: ServicesSectionSettings = {
    ...DEFAULT_SERVICES_SECTION_SETTINGS,
    ...rawServices,
    items: rawServices.items?.length ? rawServices.items : DEFAULT_SERVICES_SECTION_SETTINGS.items,
  };

  const rawNews = (settingsObj.newsSection as Partial<NewsSectionSettings>) ?? {};
  const newsSection: NewsSectionSettings = {
    ...DEFAULT_NEWS_SECTION_SETTINGS,
    ...rawNews,
  };

  const rawFaculty = (settingsObj.facultyBanner as Partial<FacultyBannerSettings>) ?? {};
  const facultyBanner: FacultyBannerSettings = {
    ...DEFAULT_FACULTY_BANNER_SETTINGS,
    ...rawFaculty,
  };

  const rawFooter = (settingsObj.footer as Partial<FooterSettings>) ?? {};
  const footer: FooterSettings = {
    ...DEFAULT_FOOTER_SETTINGS,
    ...rawFooter,
    quickLinks:
      rawFooter.quickLinks && Array.isArray(rawFooter.quickLinks) && rawFooter.quickLinks.length > 0
        ? rawFooter.quickLinks
        : DEFAULT_FOOTER_QUICK_LINKS,
    systemLinks:
      rawFooter.systemLinks && Array.isArray(rawFooter.systemLinks) && rawFooter.systemLinks.length > 0
        ? rawFooter.systemLinks
        : DEFAULT_FOOTER_SYSTEM_LINKS,
  };

  const rawSmtp = (settingsObj.smtp as Partial<SmtpSettings>) ?? {};
  const smtp: SmtpSettings = {
    ...DEFAULT_SMTP_SETTINGS,
    ...rawSmtp,
  };

  const rawGemini = (settingsObj.gemini as Partial<GeminiSettings>) ?? {};
  const gemini: GeminiSettings = {
    ...DEFAULT_GEMINI_SETTINGS,
    ...rawGemini,
  };

  return {
    code: t.code,
    nameTh: t.nameTh,
    nameEn: t.nameEn,
    logoUrl: t.logoUrl,
    palette: isPalette(p) ? p : DEFAULT_PALETTE,
    fontSize,
    hero,
    servicesSection,
    newsSection,
    facultyBanner,
    footer,
    smtp,
    gemini,
  };
}

export async function getTenantSettings(tenantId: string): Promise<TenantSettings> {
  return readTenantSettings(tenantId, prisma);
}

/** เก็บคีย์อื่น ๆ ใน settings JSON ไว้ทั้งหมด — merge palette, fontSize, hero, servicesSection, newsSection, facultyBanner, footer, smtp ไม่ทับทั้งก้อน */
export async function updateTenantSettings(input: { tenantId: string; actorId: string } & UpdateSettingsInput): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // อ่านผ่าน tx เดียวกัน ไม่ใช่ client กลาง
    const before = await readTenantSettings(input.tenantId, tx);
    const t = await tx.tenant.findUniqueOrThrow({ where: { id: input.tenantId }, select: { settings: true } });
    const existing = (t.settings as object) ?? {};
    const updatedSettings = {
      ...existing,
      palette: input.palette,
      ...(input.fontSize ? { fontSize: input.fontSize } : {}),
      ...(input.hero ? { hero: input.hero } : {}),
      ...(input.servicesSection ? { servicesSection: input.servicesSection } : {}),
      ...(input.newsSection ? { newsSection: input.newsSection } : {}),
      ...(input.facultyBanner ? { facultyBanner: input.facultyBanner } : {}),
      ...(input.footer ? { footer: input.footer } : {}),
      ...(input.smtp ? { smtp: input.smtp } : {}),
      ...(input.gemini ? { gemini: input.gemini } : {}),
    };
    await tx.tenant.update({
      where: { id: input.tenantId },
      data: {
        nameTh: input.nameTh,
        nameEn: input.nameEn,
        logoUrl: input.logoUrl || null,
        settings: updatedSettings,
      },
    });
    await writeAudit({ tenantId: input.tenantId, actorId: input.actorId, action: "tenant.settings_update", entity: "tenant", entityId: input.tenantId, before, after: input }, tx);
  });
}

export async function getTenantPalette(tenantId: string): Promise<PaletteId> {
  const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { settings: true } });
  const p = (t?.settings as { palette?: unknown } | null)?.palette;
  return isPalette(p) ? p : DEFAULT_PALETTE;
}

/**
 * tenant ของ session ถ้ามี — import แบบ dynamic เพราะ `../auth` ดึง next-auth ทั้งก้อนเข้ามา และ
 * โมดูลนี้ถูก import จาก root layout ที่รันทุก request · แยก try ของตัวเองไว้ต่างหากโดยเจตนา: เดิมมันอยู่
 * ใน try เดียวกับการอ่านฐานข้อมูล ทำให้ "โหลด auth ไม่ได้" กับ "ฐานข้อมูลล้ม" กลืนหายไปเป็นค่าเดียวกัน
 * และเส้นทางอ่าน tenant ทั้งเส้นทดสอบไม่ได้เลย (ในสภาพแวดล้อมเทสต์ next-auth resolve ไม่ผ่าน)
 */
async function sessionTenantId(): Promise<string | null> {
  try {
    const { auth } = await import("../auth");
    return (await auth())?.tenantId || null;
  } catch {
    return null;
  }
}

async function fallbackTenantId(): Promise<string | null> {
  const mcu = await prisma.tenant.findFirst({
    where: { code: "MCU", isActive: true },
    select: { id: true },
  });
  if (mcu) return mcu.id;

  const t = await prisma.tenant.findFirst({
    where: { isActive: true },
    orderBy: [{ userTenants: { _count: "desc" } }, { createdAt: "asc" }],
    select: { id: true },
  });
  return t?.id ?? (await prisma.tenant.findFirst({ select: { id: true } }))?.id ?? null;
}

/** ใช้โดย root layout ทุก request — tenant จาก session ถ้ามี ไม่งั้น tenant แรก (หน้า login ยังไม่มี session) · ไม่ throw */
export const resolvePalette = cache(async (): Promise<PaletteId> => {
  try {
    const tenantId = (await sessionTenantId()) || (await fallbackTenantId());
    return tenantId ? await getTenantPalette(tenantId) : DEFAULT_PALETTE;
  } catch {
    return DEFAULT_PALETTE;
  }
});

/** ใช้โดย layout ต่าง ๆ ทุก request — tenant settings จาก session ถ้ามี ไม่งั้น tenant แรก · ไม่ throw */
export const resolveTenantSettings = cache(async (): Promise<TenantSettings | null> => {
  try {
    const tenantId = (await sessionTenantId()) || (await fallbackTenantId());
    return tenantId ? await readTenantSettings(tenantId, prisma) : null;
  } catch {
    return null;
  }
});

