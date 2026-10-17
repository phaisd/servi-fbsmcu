import { z } from "zod";
import { PALETTE_IDS } from "@/shared/lib/palette";

export const heroNavLinkSchema = z.object({
  id: z.string(),
  labelTh: z.string().default(""),
  labelEn: z.string().default(""),
  href: z.string().default("#"),
  enabled: z.boolean().default(true),
});

export const heroSocialLinkSchema = z.object({
  id: z.string(),
  label: z.string().default(""),
  href: z.string().default("#"),
  enabled: z.boolean().default(true),
});

export const HERO_TYPOGRAPHY_SIZES = ["giant", "large", "medium", "small"] as const;
export type HeroTypographySize = (typeof HERO_TYPOGRAPHY_SIZES)[number];

export const heroSettingsSchema = z.object({
  enabled: z.boolean().default(true),
  layout: z.enum(["center-motion", "split", "minimal"]).default("center-motion"),
  heightMode: z.enum(["full", "screen-90", "compact"]).default("screen-90"),
  textTone: z.enum(["dark", "navy", "amber", "crimson", "emerald", "slate", "custom"]).default("dark"),
  customTextColor: z.string().optional().default(""),
  bgImageUrl: z.string().optional().default(""),
  bgModeDefault: z.enum(["subtle", "vivid", "minimal", "hidden"]).default("subtle"),
  showBgToggle: z.boolean().default(true),
  showMotionArtwork: z.boolean().default(true),
  motionArtworkUrl: z.string().optional().default(""),
  motionPreviewUrl: z.string().optional().default(""),
  topTypography: z.object({
    enabled: z.boolean().default(true),
    text: z.string().default("EMBER"),
    linkHref: z.string().default("/portal/news"),
    fontSize: z.enum(HERO_TYPOGRAPHY_SIZES).optional().default("giant"),
  }).default({ enabled: true, text: "EMBER", linkHref: "/portal/news", fontSize: "giant" }),
  bottomWatermark: z.object({
    enabled: z.boolean().default(true),
    text: z.string().default("STUDIO"),
    fontSize: z.enum(HERO_TYPOGRAPHY_SIZES).optional().default("giant"),
  }).default({ enabled: true, text: "STUDIO", fontSize: "giant" }),
  manifesto: z.object({
    enabled: z.boolean().default(true),
    badgeTextTh: z.string().default("เกี่ยวกับเรา"),
    badgeTextEn: z.string().default("ABOUT"),
    headingTh: z.string().default(""),
    headingEn: z.string().default(""),
    bodyTh: z.string().default(""),
    bodyEn: z.string().default(""),
  }).default({
    enabled: true,
    badgeTextTh: "เกี่ยวกับเรา",
    badgeTextEn: "ABOUT",
    headingTh: "",
    headingEn: "",
    bodyTh: "",
    bodyEn: "",
  }),
  header: z.object({
    showLogo: z.boolean().default(true),
    showBrandText: z.boolean().default(true),
    customBrandText: z.string().optional().default(""),
    showLanguageSwitcher: z.boolean().default(true),
    showThemeToggle: z.boolean().default(true),
    showAvatarMenu: z.boolean().default(true),
    contactPill: z.object({
      enabled: z.boolean().default(true),
      labelTh: z.string().default("ติดต่อเรา"),
      labelEn: z.string().default("CONTACTS"),
      href: z.string().default("/portal/documents"),
    }).default({
      enabled: true,
      labelTh: "ติดต่อเรา",
      labelEn: "CONTACTS",
      href: "/portal/documents",
    }),
    navLinks: z.array(heroNavLinkSchema).default([]),
  }).default({
    showLogo: true,
    showBrandText: true,
    customBrandText: "",
    showLanguageSwitcher: true,
    showThemeToggle: true,
    showAvatarMenu: true,
    contactPill: {
      enabled: true,
      labelTh: "ติดต่อเรา",
      labelEn: "CONTACTS",
      href: "/portal/documents",
    },
    navLinks: [],
  }),
  footerRail: z.object({
    enabled: z.boolean().default(true),
    ctaButton: z.object({
      enabled: z.boolean().default(true),
      eyebrow: z.string().default("DOUBLE CLICK AND"),
      labelTh: z.string().default("สำรวจบริการและผลงาน"),
      labelEn: z.string().default("EXPLORE OUR WORK"),
      href: z.string().default("/portal/programs"),
    }).default({
      enabled: true,
      eyebrow: "DOUBLE CLICK AND",
      labelTh: "สำรวจบริการและผลงาน",
      labelEn: "EXPLORE OUR WORK",
      href: "/portal/programs",
    }),
    socialLinks: z.array(heroSocialLinkSchema).default([]),
    locationText: z.object({
      enabled: z.boolean().default(true),
      title: z.string().default(""),
      address: z.string().default("WANG NOI, AYUTTHAYA 13170, THAILAND"),
    }).default({
      enabled: true,
      title: "",
      address: "WANG NOI, AYUTTHAYA 13170, THAILAND",
    }),
  }).default({
    enabled: true,
    ctaButton: {
      enabled: true,
      eyebrow: "DOUBLE CLICK AND",
      labelTh: "สำรวจบริการและผลงาน",
      labelEn: "EXPLORE OUR WORK",
      href: "/portal/programs",
    },
    socialLinks: [],
    locationText: {
      enabled: true,
      title: "",
      address: "WANG NOI, AYUTTHAYA 13170, THAILAND",
    },
  }),
});

export const serviceItemSchema = z.object({
  id: z.string(),
  titleTh: z.string().default(""),
  titleEn: z.string().default(""),
  descTh: z.string().default(""),
  descEn: z.string().default(""),
  href: z.string().default("#"),
  icon: z.string().default("BookOpen"),
  badgeTh: z.string().default(""),
  badgeEn: z.string().default(""),
  enabled: z.boolean().default(true),
});

export const servicesSectionSchema = z.object({
  enabled: z.boolean().default(true),
  eyebrowTh: z.string().default("บริการสำคัญ"),
  eyebrowEn: z.string().default("Core Services"),
  titleTh: z.string().default("ระบบบริการการศึกษาและสารสนเทศ"),
  titleEn: z.string().default("Academic & Information Services"),
  viewAllTextTh: z.string().default("ดูบริการทั้งหมด"),
  viewAllTextEn: z.string().default("View All"),
  viewAllHref: z.string().default("/portal/programs"),
  showViewAll: z.boolean().default(true),
  items: z.array(serviceItemSchema).default([]),
});

export const newsSectionSchema = z.object({
  enabled: z.boolean().default(true),
  eyebrowTh: z.string().default("ประชาสัมพันธ์"),
  eyebrowEn: z.string().default("Announcements"),
  titleTh: z.string().default("ข่าวสารและกิจกรรมล่าสุด"),
  titleEn: z.string().default("Latest News & Events"),
  showViewAll: z.boolean().default(true),
  viewAllTextTh: z.string().default("ดูข่าวสารทั้งหมด"),
  viewAllTextEn: z.string().default("All News"),
  viewAllHref: z.string().default("/portal/news"),
  pageSize: z.number().int().min(1).max(12).default(4),
});

export const facultyBannerSchema = z.object({
  enabled: z.boolean().default(true),
  badgeTh: z.string().default("คณาจารย์ผู้ทรงคุณวุฒิ"),
  badgeEn: z.string().default("Distinguished Faculty"),
  headingTh: z.string().default("รวมคณาจารย์และนักวิชาการพระพุทธศาสนาระดับโลก"),
  headingEn: z.string().default("World-Class Buddhist Scholars & Academic Faculty"),
  descTh: z.string().default("พบกับผู้เชี่ยวชาญด้านพระไตรปิฎกศึกษา ปรัชญา ศาสนาเปรียบเทียบ และการบริหารจัดการศึกษา ที่พร้อมถ่ายทอดองค์ความรู้แก่นิสิตทุกระดับชั้น"),
  descEn: z.string().default("Learn from specialized professors in Tipitaka studies, Buddhist philosophy, and comparative religion."),
  buttonLabelTh: z.string().default("ทำเนียบคณาจารย์และบุคลากร"),
  buttonLabelEn: z.string().default("View Faculty Directory"),
  buttonHref: z.string().default("/portal/personnel"),
  showCircles: z.boolean().default(true),
  circle1Text: z.string().default("MCU"),
  circle2Text: z.string().default("ธรรม"),
  circle3Text: z.string().default("ปัญญา"),
});

export const footerSchema = z.object({
  enabled: z.boolean().default(true),
  descTh: z.string().default(
    "ศูนย์กลางการศึกษาพระพุทธศาสนาระดับอุดมศึกษา มุ่งผลิตบัณฑิตให้มีปฏิปทาน่าเลื่อมใส ใฝ่รู้ใฝ่คิด มีความเป็นผู้นำทางจิตใจและปัญญา บูรณาการพุทธธรรมกับศาสตร์สมัยใหม่ เพื่อประโยชน์สุขของสังคม"
  ),
  descEn: z.string().default(
    "Center of Buddhist Higher Education, integrating Dhamma principles with modern sciences to cultivate ethical leadership and global wisdom."
  ),
  addressTh: z.string().default(
    "79 หมู่ 1 ถนนพหลโยธิน กม. 55 ต.ลำไทร อ.วังน้อย จ.พระนครศรีอยุธยา 13170"
  ),
  addressEn: z.string().default(
    "79 Moo 1, Phahonyothin Rd., Lamsai, Wang Noi, Phra Nakhon Si Ayutthaya 13170, Thailand"
  ),
  phone: z.string().default("035-248-000 ต่อ 8100-8104"),
  email: z.string().default("buddhist@mcu.ac.th"),
  subTaglineTh: z.string().default("มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย (มจร)"),
  subTaglineEn: z.string().default("Mahachulalongkornrajavidyalaya University (MCU)"),
  copyrightTh: z.string().default("สงวนลิขสิทธิ์ทั้งหมด"),
  copyrightEn: z.string().default("All rights reserved."),
  quickLinksTitleTh: z.string().default("เมนูลัด & บริการนิสิต"),
  quickLinksTitleEn: z.string().default("QUICK LINKS & SERVICES"),
  systemsTitleTh: z.string().default("ระบบสารสนเทศองค์กร"),
  systemsTitleEn: z.string().default("INFORMATION SYSTEMS"),
  mainWebsiteUrl: z.string().default("https://www.mcu.ac.th"),
  mainWebsiteTextTh: z.string().default("เว็บไซต์หลัก มหาวิทยาลัย มจร"),
  mainWebsiteTextEn: z.string().default("MCU Main Website"),
  showStaffConsole: z.boolean().default(true),
});

export const smtpSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  service: z.enum(["gmail", "custom"]).default("gmail"),
  host: z.string().default("smtp.gmail.com"),
  port: z.coerce.number().default(465),
  secure: z.boolean().default(true),
  user: z.string().default(""),
  pass: z.string().default(""),
  fromName: z.string().default(""),
  fromEmail: z.string().default(""),
});

export type SmtpSettingsInput = z.infer<typeof smtpSettingsSchema>;
export type SmtpSettings = SmtpSettingsInput;

export const DEFAULT_SMTP_SETTINGS: SmtpSettings = {
  enabled: false,
  service: "gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  user: "",
  pass: "",
  fromName: "คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
  fromEmail: "",
};

export const FONT_SIZES = ["small", "normal", "medium", "large", "xlarge"] as const;
export type FontSizePreference = (typeof FONT_SIZES)[number];

export const updateSettingsSchema = z.object({
  nameTh: z.string().trim().min(1).max(255),
  nameEn: z.string().trim().min(1).max(255),
  logoUrl: z
    .string()
    .trim()
    .max(1000)
    .refine((v) => v === "" || v.startsWith("/") || z.string().url().safeParse(v).success, {
      message: "url",
    })
    .or(z.literal(""))
    .default(""),
  palette: z.enum(PALETTE_IDS),
  fontSize: z.enum(FONT_SIZES).optional().default("normal"),
  hero: heroSettingsSchema.optional(),
  servicesSection: servicesSectionSchema.optional(),
  newsSection: newsSectionSchema.optional(),
  facultyBanner: facultyBannerSchema.optional(),
  footer: footerSchema.optional(),
  smtp: smtpSettingsSchema.optional(),
});
export const updateProfileSchema = z.object({ name: z.string().trim().min(1).max(255), locale: z.enum(["th", "en"]) });
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type HeroSettingsInput = z.infer<typeof heroSettingsSchema>;
export type HeroNavLinkInput = z.infer<typeof heroNavLinkSchema>;
export type HeroSocialLinkInput = z.infer<typeof heroSocialLinkSchema>;

export type ServiceItemInput = z.infer<typeof serviceItemSchema>;
export type ServicesSectionInput = z.infer<typeof servicesSectionSchema>;

export type ServiceItem = ServiceItemInput;
export type ServicesSectionSettings = ServicesSectionInput;

export const DEFAULT_SERVICES_SECTION_SETTINGS: ServicesSectionSettings = {
  enabled: true,
  eyebrowTh: "บริการสำคัญ",
  eyebrowEn: "Core Services",
  titleTh: "ระบบบริการการศึกษาและสารสนเทศ",
  titleEn: "Academic & Information Services",
  viewAllTextTh: "ดูบริการทั้งหมด",
  viewAllTextEn: "View All",
  viewAllHref: "/portal/programs",
  showViewAll: true,
  items: [
    {
      id: "programs",
      titleTh: "หลักสูตรระดับปริญญา",
      titleEn: "Academic Programs",
      descTh: "ปริญญาตรี โท เอก สาขาพระพุทธศาสนา",
      descEn: "Undergraduate, Master & Ph.D.",
      href: "/portal/programs",
      icon: "BookOpen",
      badgeTh: "เปิดรับสมัคร",
      badgeEn: "Admissions",
      enabled: true,
    },
    {
      id: "meetings",
      titleTh: "ระบบจองห้องประชุม",
      titleEn: "Room Booking System",
      descTh: "จองห้องประชุมและอุปกรณ์ออนไลน์",
      descEn: "Online Conference Reservations",
      href: "/portal/meetings",
      icon: "Video",
      badgeTh: "บริการออนไลน์",
      badgeEn: "Online",
      enabled: true,
    },
    {
      id: "certificates",
      titleTh: "คำร้อง & ขอใบรับรอง",
      titleEn: "Student Requests & Forms",
      descTh: "ยื่นคำร้องขอเอกสารสำคัญทางการศึกษา",
      descEn: "Official Certificates & Requests",
      href: "/portal/certificates/request",
      icon: "Award",
      badgeTh: "บริการนิสิต",
      badgeEn: "Services",
      enabled: true,
    },
    {
      id: "documents",
      titleTh: "คลังเอกสาร & แบบฟอร์ม",
      titleEn: "Document Downloads",
      descTh: "ดาวน์โหลดแบบฟอร์มคำร้องและระเบียบ",
      descEn: "Academic Guidelines & Downloads",
      href: "/portal/documents",
      icon: "FileText",
      badgeTh: "ดาวน์โหลด",
      badgeEn: "Downloads",
      enabled: true,
    },
  ],
};

export type HeroSettings = HeroSettingsInput;
export type HeroNavLink = HeroNavLinkInput;
export type HeroSocialLink = HeroSocialLinkInput;
export type HeroTextTone = NonNullable<HeroSettings["textTone"]>;

export const DEFAULT_HERO_SETTINGS: HeroSettings = {
  enabled: true,
  layout: "center-motion",
  heightMode: "screen-90",
  textTone: "dark",
  customTextColor: "",
  bgImageUrl: "/buddhist-hero-bg.jpg",
  bgModeDefault: "subtle",
  showBgToggle: true,
  showMotionArtwork: true,
  motionArtworkUrl: "/ember_animation_30fps.webp",
  motionPreviewUrl: "/ember_preview.gif",
  topTypography: {
    enabled: true,
    text: "EMBER",
    linkHref: "/portal/news",
    fontSize: "giant",
  },
  bottomWatermark: {
    enabled: true,
    text: "STUDIO",
    fontSize: "giant",
  },
  manifesto: {
    enabled: true,
    badgeTextTh: "เกี่ยวกับเรา",
    badgeTextEn: "ABOUT",
    headingTh: "",
    headingEn: "",
    bodyTh: "เราผสานแก่นธรรมโบราณเข้ากับนวัตกรรมแห่งอนาคต สร้างสรรค์ผู้นำทางจิตปัญญา ผ่านการศึกษาและวิจัยชั้นนำระดับสากล",
    bodyEn: "We shape striking digital identities through bold contrasts and meaningful motion. Our design process transforms the primal into the powerful.",
  },
  header: {
    showLogo: true,
    showBrandText: true,
    customBrandText: "",
    showLanguageSwitcher: true,
    showThemeToggle: true,
    showAvatarMenu: true,
    contactPill: {
      enabled: true,
      labelTh: "ติดต่อเรา",
      labelEn: "CONTACTS",
      href: "/portal/documents",
    },
    navLinks: [
      { id: "news", labelTh: "WORKS / ข่าวสาร", labelEn: "WORKS", href: "/portal/news", enabled: true },
      { id: "programs", labelTh: "SERVICES / บริการ", labelEn: "SERVICES", href: "/portal/programs", enabled: true },
      { id: "personnel", labelTh: "ABOUT / บุคลากร", labelEn: "ABOUT", href: "/portal/personnel", enabled: true },
      { id: "events", labelTh: "TEAM / กิจกรรม", labelEn: "TEAM", href: "/portal/events", enabled: true },
    ],
  },
  footerRail: {
    enabled: true,
    ctaButton: {
      enabled: true,
      eyebrow: "DOUBLE CLICK AND",
      labelTh: "สำรวจบริการและผลงาน",
      labelEn: "EXPLORE OUR WORK",
      href: "/portal/programs",
    },
    socialLinks: [
      { id: "fb", label: "FACEBOOK", href: "https://facebook.com", enabled: true },
      { id: "ig", label: "INSTAGRAM", href: "https://instagram.com", enabled: true },
      { id: "tg", label: "TELEGRAM", href: "https://t.me", enabled: true },
    ],
    locationText: {
      enabled: true,
      title: "",
      address: "WANG NOI, AYUTTHAYA 13170, THAILAND",
    },
  },
};

export type NewsSectionSettingsInput = z.infer<typeof newsSectionSchema>;
export type FacultyBannerSettingsInput = z.infer<typeof facultyBannerSchema>;

export type NewsSectionSettings = NewsSectionSettingsInput;
export type FacultyBannerSettings = FacultyBannerSettingsInput;

export const DEFAULT_NEWS_SECTION_SETTINGS: NewsSectionSettings = {
  enabled: true,
  eyebrowTh: "ประชาสัมพันธ์",
  eyebrowEn: "Announcements",
  titleTh: "ข่าวสารและกิจกรรมล่าสุด",
  titleEn: "Latest News & Events",
  showViewAll: true,
  viewAllTextTh: "ดูข่าวสารทั้งหมด",
  viewAllTextEn: "All News",
  viewAllHref: "/portal/news",
  pageSize: 4,
};

export const DEFAULT_FACULTY_BANNER_SETTINGS: FacultyBannerSettings = {
  enabled: true,
  badgeTh: "คณาจารย์ผู้ทรงคุณวุฒิ",
  badgeEn: "Distinguished Faculty",
  headingTh: "รวมคณาจารย์และนักวิชาการพระพุทธศาสนาระดับโลก",
  headingEn: "World-Class Buddhist Scholars & Academic Faculty",
  descTh: "พบกับผู้เชี่ยวชาญด้านพระไตรปิฎกศึกษา ปรัชญา ศาสนาเปรียบเทียบ และการบริหารจัดการศึกษา ที่พร้อมถ่ายทอดองค์ความรู้แก่นิสิตทุกระดับชั้น",
  descEn: "Learn from specialized professors in Tipitaka studies, Buddhist philosophy, and comparative religion.",
  buttonLabelTh: "ทำเนียบคณาจารย์และบุคลากร",
  buttonLabelEn: "View Faculty Directory",
  buttonHref: "/portal/personnel",
  showCircles: true,
  circle1Text: "MCU",
  circle2Text: "ธรรม",
  circle3Text: "ปัญญา",
};

export type FooterSettingsInput = z.infer<typeof footerSchema>;
export type FooterSettings = FooterSettingsInput;

export const DEFAULT_FOOTER_SETTINGS: FooterSettings = {
  enabled: true,
  descTh:
    "ศูนย์กลางการศึกษาพระพุทธศาสนาระดับอุดมศึกษา มุ่งผลิตบัณฑิตให้มีปฏิปทาน่าเลื่อมใส ใฝ่รู้ใฝ่คิด มีความเป็นผู้นำทางจิตใจและปัญญา บูรณาการพุทธธรรมกับศาสตร์สมัยใหม่ เพื่อประโยชน์สุขของสังคม",
  descEn:
    "Center of Buddhist Higher Education, integrating Dhamma principles with modern sciences to cultivate ethical leadership and global wisdom.",
  addressTh: "79 หมู่ 1 ถนนพหลโยธิน กม. 55 ต.ลำไทร อ.วังน้อย จ.พระนครศรีอยุธยา 13170",
  addressEn:
    "79 Moo 1, Phahonyothin Rd., Lamsai, Wang Noi, Phra Nakhon Si Ayutthaya 13170, Thailand",
  phone: "035-248-000 ต่อ 8100-8104",
  email: "buddhist@mcu.ac.th",
  subTaglineTh: "มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย (มจร)",
  subTaglineEn: "Mahachulalongkornrajavidyalaya University (MCU)",
  copyrightTh: "สงวนลิขสิทธิ์ทั้งหมด",
  copyrightEn: "All rights reserved.",
  quickLinksTitleTh: "เมนูลัด & บริการนิสิต",
  quickLinksTitleEn: "QUICK LINKS & SERVICES",
  systemsTitleTh: "ระบบสารสนเทศองค์กร",
  systemsTitleEn: "INFORMATION SYSTEMS",
  mainWebsiteUrl: "https://www.mcu.ac.th",
  mainWebsiteTextTh: "เว็บไซต์หลัก มหาวิทยาลัย มจร",
  mainWebsiteTextEn: "MCU Main Website",
  showStaffConsole: true,
};

export interface TenantSettings {
  code: string;
  nameTh: string;
  nameEn: string;
  logoUrl: string | null;
  palette: import("@/shared/lib/palette").PaletteId;
  fontSize?: FontSizePreference;
  hero: HeroSettings;
  servicesSection: ServicesSectionSettings;
  newsSection: NewsSectionSettings;
  facultyBanner: FacultyBannerSettings;
  footer: FooterSettings;
  smtp: SmtpSettings;
}



