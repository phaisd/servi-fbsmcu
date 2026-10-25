"use client";

import * as React from "react";
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Layout,
  Image as ImageIcon,
  Type,
  Compass,
  Share2,
  Upload,
  Loader2,
  Palette,
  Sparkles,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiyonCard, LiyonField, LiyonSelect, LiyonSwitch } from "@/shared/components/liyon";
import { cn } from "@/shared/lib/utils";
import { toast } from "sonner";
import { uploadLogoAction } from "@/features/identity/actions";
import {
  HERO_TONE_CONFIGS,
  getHeroToneConfig,
  type HeroSettings,
  type HeroNavLink,
  type HeroSocialLink,
  type HeroTextTone,
  type HeroTypographySize,
} from "@/features/identity";

const TYPOGRAPHY_SIZE_OPTIONS: {
  id: HeroTypographySize;
  labelTh: string;
  labelEn: string;
  descTh: string;
  scaleLabel: string;
  badge?: string;
}[] = [
  {
    id: "giant",
    labelTh: "ข้อความตัวโต",
    labelEn: "Giant (13.5rem)",
    descTh: "ขนาดใหญ่สุดต้นฉบับ เหมาะกับคำสั้น 3-6 ตัวอักษร เช่น EMBER, MCU",
    scaleLabel: "100% (ใหญ่สุด)",
  },
  {
    id: "large",
    labelTh: "ขนาดกลางใหญ่",
    labelEn: "Medium Large (10rem)",
    descTh: "ขนาดลดลง 25% สวยงามลงตัวสำหรับคำยาว 6-8 ตัวอักษร เช่น BUDDHIST",
    scaleLabel: "75% (กลางใหญ่)",
    badge: "แนะนำ",
  },
  {
    id: "medium",
    labelTh: "ขนาดกลาง",
    labelEn: "Medium (7.5rem)",
    descTh: "ขนาดกะทัดรัด ไม่บดบังภาพเคลื่อนไหวหรือพื้นหลัง",
    scaleLabel: "55% (ขนาดกลาง)",
  },
  {
    id: "small",
    labelTh: "ขนาดกลางเล็ก",
    labelEn: "Medium Small (5.5rem)",
    descTh: "ขนาดกะทัดรัดพิเศษ เหมาะกับข้อความยาวหรือต้องการความเรียบร้อย",
    scaleLabel: "40% (กลางเล็ก)",
  },
];

const MOTION_PRESET_OPTIONS: {
  id: NonNullable<HeroSettings["motionPreset"]>;
  titleTh: string;
  titleEn: string;
  descTh: string;
  iconText: string;
  badge?: string;
  recommended?: boolean;
}[] = [
  {
    id: "lotus-bloom",
    titleTh: "ดอกบัวหลวงกำลังบาน (Sacred Lotus)",
    titleEn: "Blooming Sacred Lotus",
    descTh: "กลีบบัวสีชมพูขาวคลี่บานอย่างสง่างาม เกสรสีทองเรืองแสง สัญลักษณ์แห่งปัญญาและการตื่นรู้",
    iconText: "🪷",
    badge: "แนะนำสำหรับคณะพุทธศาสตร์",
    recommended: true,
  },
  {
    id: "ashoka-flower",
    titleTh: "ดอกอโศกอินเดีย (Ashoka Blossom)",
    titleEn: "Ashoka Flower Cluster",
    descTh: "ช่อดอกอโศกสีส้มทองแสด เกสรยื่นยาวพลิ้วไหว สื่อถึงพุทธประวัติและความร่มเย็น",
    iconText: "🌺",
    badge: "พุทธประวัติและมงคล",
    recommended: true,
  },
  {
    id: "dharmachakra",
    titleTh: "วงล้อธรรมจักรสีทอง (Golden Wheel)",
    titleEn: "Golden Dharmachakra Motion",
    descTh: "กงล้อแห่งพระธรรม 8 ซี่ หมุนวนอย่างช้าๆ นุ่มนวล เปล่งประกายแสงฉัพพรรณรังสี",
    iconText: "☸️",
  },
  {
    id: "bodhi-leaf",
    titleTh: "ใบโพธิ์ทองแห่งการตรัสรู้ (Bodhi Leaf)",
    titleEn: "Luminous Bodhi Leaf",
    descTh: "ใบโพธิ์สีทองพลิ้วไหว เส้นลายใบเรืองแสง สื่อถึงความสงบ สันติ และปัญญา",
    iconText: "🍃",
  },
  {
    id: "ember",
    titleTh: "EMBER 3D Ribbon (แบบดั้งเดิม)",
    titleEn: "EMBER 3D Motion",
    descTh: "งานศิลป์ 3D ลูป 30 FPS สไตล์ดิจิทัลโมเดิร์นและมินิมอลดั้งเดิม",
    iconText: "🌀",
  },
  {
    id: "custom",
    titleTh: "กำหนด URL เอง (Custom Artwork)",
    titleEn: "Custom URL (WebP/GIF/Video)",
    descTh: "ระบุลิงก์ไฟล์ WebP, GIF หรือแอนิเมชันของตนเองได้ตามต้องการ",
    iconText: "🔗",
  },
];

interface HeroSettingsTabProps {
  value: HeroSettings;
  onChange: (value: HeroSettings) => void;
}

export function HeroSettingsTab({ value, onChange }: HeroSettingsTabProps) {
  const [uploadingBg, setUploadingBg] = React.useState(false);
  const bgInputRef = React.useRef<HTMLInputElement>(null);

  // Helper to update shallow properties
  const update = <K extends keyof HeroSettings>(key: K, val: HeroSettings[K]) => {
    onChange({ ...value, [key]: val });
  };

  // Nav link operations
  const addNavLink = () => {
    const newLink: HeroNavLink = {
      id: `link-${Date.now()}`,
      labelTh: "เมนูใหม่",
      labelEn: "NEW LINK",
      href: "/portal",
      enabled: true,
    };
    update("header", {
      ...value.header,
      navLinks: [...value.header.navLinks, newLink],
    });
  };

  const updateNavLink = (id: string, patch: Partial<HeroNavLink>) => {
    update("header", {
      ...value.header,
      navLinks: value.header.navLinks.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    });
  };

  const removeNavLink = (id: string) => {
    update("header", {
      ...value.header,
      navLinks: value.header.navLinks.filter((l) => l.id !== id),
    });
  };

  // Social link operations
  const addSocialLink = () => {
    const newSocial: HeroSocialLink = {
      id: `social-${Date.now()}`,
      label: "SOCIAL",
      href: "https://",
      enabled: true,
    };
    update("footerRail", {
      ...value.footerRail,
      socialLinks: [...value.footerRail.socialLinks, newSocial],
    });
  };

  const updateSocialLink = (id: string, patch: Partial<HeroSocialLink>) => {
    update("footerRail", {
      ...value.footerRail,
      socialLinks: value.footerRail.socialLinks.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  };

  const removeSocialLink = (id: string) => {
    update("footerRail", {
      ...value.footerRail,
      socialLinks: value.footerRail.socialLinks.filter((s) => s.id !== id),
    });
  };

  // Background Image Upload
  async function handleBgFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const formData = new FormData();
    formData.append("file", file);

    setUploadingBg(true);
    try {
      const res = await uploadLogoAction(formData);
      if (res.ok) {
        update("bgImageUrl", res.data.url);
        toast.success("อัปโหลดภาพพื้นหลังสำเร็จ");
      } else {
        toast.error("อัปโหลดภาพไม่สำเร็จ");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการอัปโหลดภาพ");
    } finally {
      setUploadingBg(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* ── CARD 1: การจัดวางเลย์เอาต์ & โครงสร้าง ── */}
      <LiyonCard>
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Layout className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">1. การจัดวางเลย์เอาต์ (Layout & Display)</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {value.enabled ? "เปิดแสดงผล Section" : "ปิดแสดงผล Section"}
            </span>
            <LiyonSwitch
              checked={value.enabled}
              onCheckedChange={(checked) => update("enabled", checked)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LiyonField label="สไตล์เลย์เอาต์ (Layout Style)" hint="รูปแบบการจัดวางองค์ประกอบหลัก">
            <LiyonSelect
              value={value.layout}
              onChange={(e) => update("layout", e.target.value as HeroSettings["layout"])}
            >
              <option value="center-motion">Studio Center Motion (ค่าเริ่มต้น - ศิลป์ 3D ตรงกลาง)</option>
              <option value="split">Studio Split (ข้อความฝั่งซ้าย ภาพฝั่งขวา)</option>
              <option value="minimal">Minimalist (เรียบหรู เน้นภาพพื้นหลัง & Typography)</option>
            </LiyonSelect>
          </LiyonField>

          <LiyonField label="ความสูงของ Section (Height)" hint="ความสูงเทียบกับหน้าจอผู้ใช้">
            <LiyonSelect
              value={value.heightMode}
              onChange={(e) => update("heightMode", e.target.value as HeroSettings["heightMode"])}
            >
              <option value="screen-90">เกือบเต็มจอ (90vh - เห็นบริการสำคัญด้านล่างเล็กน้อย)</option>
              <option value="full">เต็มจอพอดี (100vh Full Screen Impact)</option>
              <option value="compact">กะทัดรัด (80vh Compact Studio)</option>
            </LiyonSelect>
          </LiyonField>
        </div>
      </LiyonCard>

      {/* ── CARD 2: ภาพพื้นหลัง & งานศิลป์ 3D Motion ── */}
      <LiyonCard>
        <div className="flex items-center gap-2 border-b pb-3 mb-4">
          <ImageIcon className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">2. ภาพและสื่อ (Media & 3D Motion Artwork)</h2>
        </div>

        <div className="space-y-4">
          {/* Background Image */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">ภาพพื้นหลังฉากหลัง (Background Image)</label>
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              <input
                type="text"
                placeholder="เช่น /buddhist-hero-bg.jpg หรือ URL รูปภาพ"
                value={value.bgImageUrl ?? ""}
                onChange={(e) => update("bgImageUrl", e.target.value)}
                className="flex-1"
              />
              <input
                ref={bgInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBgFileChange}
              />
              <Button
                type="button"
                variant="outline"
                disabled={uploadingBg}
                onClick={() => bgInputRef.current?.click()}
                className="shrink-0 flex items-center gap-2 cursor-pointer"
              >
                {uploadingBg ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                <span>{uploadingBg ? "กำลังอัปโหลด..." : "อัปโหลดภาพ"}</span>
              </Button>
            </div>
            {value.bgImageUrl && (
              <div className="h-20 w-40 rounded-lg border overflow-hidden bg-muted/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={value.bgImageUrl} alt="Background preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <LiyonField label="ระดับความโปร่งใสเริ่มต้น (Default Blend)" hint="ความชัดเจนของภาพพื้นหลัง">
              <LiyonSelect
                value={value.bgModeDefault}
                onChange={(e) => update("bgModeDefault", e.target.value as HeroSettings["bgModeDefault"])}
              >
                <option value="subtle">กลมกลืนสตูดิโอ Subtle (25% - สบายตา)</option>
                <option value="vivid">เห็นภาพเด่นชัด Vivid (60% - สดใส)</option>
                <option value="minimal">บรรยากาศสตูดิโอล้วน Minimal (0%)</option>
                <option value="hidden">ปิดการแสดงภาพพื้นหลัง (Hidden)</option>
              </LiyonSelect>
            </LiyonField>

            <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/20 mt-6">
              <div>
                <p className="text-sm font-semibold">ปุ่มสลับระดับภาพพื้นหลัง</p>
                <p className="text-xs text-muted-foreground">อนุญาตให้ผู้เข้าชมกดปุ่มปรับความชัดของภาพเอง</p>
              </div>
              <LiyonSwitch
                checked={value.showBgToggle}
                onCheckedChange={(checked) => update("showBgToggle", checked)}
              />
            </div>
          </div>

          {/* 3D & Vector Motion Artwork Presets */}
          <div className="border-t pt-4 mt-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  ภาพเคลื่อนไหวและงานศิลป์ Hero Motion (3D & Vector Art)
                </p>
                <p className="text-xs text-muted-foreground">
                  เลือกแอนิเมชันสัญลักษณ์มงคล เช่น ดอกบัวบาน ดอกอโศก หรือ ธรรมจักร สำหรับแสดงใจกลางหน้าเว็บ
                </p>
              </div>
              <LiyonSwitch
                checked={value.showMotionArtwork}
                onCheckedChange={(checked) => update("showMotionArtwork", checked)}
              />
            </div>

            {value.showMotionArtwork && (
              <div className="space-y-4 pt-1">
                {/* Motion Preset Selection Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {MOTION_PRESET_OPTIONS.map((opt) => {
                    const isSelected = (value.motionPreset ?? "lotus-bloom") === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => update("motionPreset", opt.id)}
                        className={cn(
                          "relative text-left p-3.5 rounded-xl border transition-all duration-200 flex items-start gap-3.5",
                          isSelected
                            ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary/30"
                            : "bg-background/80 hover:bg-muted/40 border-border/80"
                        )}
                      >
                        <div
                          className={cn(
                            "w-11 h-11 shrink-0 rounded-lg flex items-center justify-center text-2xl shadow-xs border transition-colors",
                            isSelected
                              ? "bg-primary/10 border-primary/40 text-primary"
                              : "bg-muted/50 border-border text-muted-foreground"
                          )}
                        >
                          {opt.iconText}
                        </div>

                        <div className="flex-1 min-w-0 pr-6">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm leading-tight text-foreground">
                              {opt.titleTh}
                            </span>
                            {opt.badge && (
                              <span
                                className={cn(
                                  "text-[10px] px-2 py-0.5 rounded-full font-medium",
                                  opt.recommended
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/40"
                                    : "bg-muted text-muted-foreground"
                                )}
                              >
                                {opt.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                            {opt.descTh}
                          </p>
                        </div>

                        {isSelected && (
                          <div className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* If Custom or Ember, show URL Inputs */}
                {((value.motionPreset ?? "lotus-bloom") === "custom" ||
                  (value.motionPreset ?? "lotus-bloom") === "ember") && (
                  <div className="p-4 rounded-xl border bg-muted/20 space-y-3 animate-in fade-in duration-200">
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <span>🔗 กำหนด URL ไฟล์แอนิเมชัน</span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <LiyonField label="URL ไฟล์ WebP/Animation" hint="ไฟล์หลักที่ใช้เล่นแอนิเมชัน">
                        <input
                          type="text"
                          value={value.motionArtworkUrl ?? ""}
                          onChange={(e) => update("motionArtworkUrl", e.target.value)}
                          placeholder="/ember_animation_30fps.webp"
                        />
                      </LiyonField>
                      <LiyonField label="URL ไฟล์ GIF สำรอง" hint="Fallback สำหรับอุปกรณ์รุ่นเก่า">
                        <input
                          type="text"
                          value={value.motionPreviewUrl ?? ""}
                          onChange={(e) => update("motionPreviewUrl", e.target.value)}
                          placeholder="/ember_preview.gif"
                        />
                      </LiyonField>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </LiyonCard>

      {/* ── CARD 3: Typography สตูดิโอ & แถลงการณ์ (Manifesto) ── */}
      <LiyonCard>
        <div className="flex items-center gap-2 border-b pb-3 mb-4">
          <Type className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">3. Typography ระดับสตูดิโอ & ปณิธาน (Studio Typography)</h2>
        </div>

        <div className="space-y-5">
          {/* โทนสีตัวอักษรและคอนทราสต์ (Text Color Tone & Readability) */}
          <div className="p-4 rounded-xl border bg-muted/20 space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold">โทนสีตัวอักษรและคอนทราสต์ (Text Color Tone & Readability)</p>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                ปรับโทนสีของตัวอักษรและหัวข้อใน Hero Section ได้ตามต้องการ พร้อมเทคโนโลยีรักษาความชัดเจนไม่ให้กลืนกับภาพพื้นหลัง
              </p>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {(Object.keys(HERO_TONE_CONFIGS) as Array<keyof typeof HERO_TONE_CONFIGS>).map((toneKey) => {
                const conf = HERO_TONE_CONFIGS[toneKey];
                const isSelected = (value.textTone ?? "dark") === toneKey;
                return (
                  <button
                    key={toneKey}
                    type="button"
                    onClick={() => update("textTone", toneKey as HeroTextTone)}
                    className={cn(
                      "flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                      isSelected
                        ? "border-primary bg-primary/10 shadow-xs ring-2 ring-primary/20"
                        : "border-border bg-background hover:bg-muted/40"
                    )}
                  >
                    <span
                      className="w-5 h-5 rounded-full shrink-0 shadow-xs border border-black/10 flex items-center justify-center text-white text-[11px]"
                      style={{ backgroundColor: conf.swatchHex }}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate leading-tight">{conf.nameTh.split(" (")[0]}</p>
                      <p className="text-[10px] text-muted-foreground truncate leading-tight">{conf.nameEn}</p>
                    </div>
                  </button>
                );
              })}

              {/* Custom Color Option */}
              <button
                type="button"
                onClick={() => update("textTone", "custom")}
                className={cn(
                  "flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                  value.textTone === "custom"
                    ? "border-primary bg-primary/10 shadow-xs ring-2 ring-primary/20"
                    : "border-border bg-background hover:bg-muted/40"
                )}
              >
                <span
                  className="w-5 h-5 rounded-full shrink-0 shadow-xs border border-black/10 flex items-center justify-center text-white"
                  style={{
                    background: "linear-gradient(135deg, #f43f5e, #8b5cf6, #06b6d4)",
                  }}
                >
                  {value.textTone === "custom" && <Check className="w-3 h-3 stroke-[3]" />}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate leading-tight">กำหนดสีเอง</p>
                  <p className="text-[10px] text-muted-foreground truncate leading-tight">Custom Hex</p>
                </div>
              </button>
            </div>

            {/* If Custom, show Color Picker & Hex Input */}
            {value.textTone === "custom" && (
              <div className="pt-2 border-t flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={value.customTextColor || "#0f172a"}
                    onChange={(e) => update("customTextColor", e.target.value)}
                    className="w-9 h-9 rounded-lg border border-border cursor-pointer p-0.5 bg-background"
                  />
                  <input
                    type="text"
                    value={value.customTextColor || ""}
                    onChange={(e) => update("customTextColor", e.target.value)}
                    placeholder="#0f172a"
                    className="w-28 px-2.5 py-1.5 text-xs font-mono rounded-lg border border-border bg-background"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  ใส่รหัสสี Hex เพื่อกำหนดโทนสีของหัวข้อและตัวอักษรทั้งหมดในส่วน Hero
                </p>
              </div>
            )}

            {/* Live Preview Box */}
            {(() => {
              const previewConf = getHeroToneConfig(value.textTone, value.customTextColor);
              return (
                <div
                  className="p-3.5 rounded-xl border transition-all mt-2"
                  style={{
                    backgroundColor: previewConf.cardBg,
                    borderColor: previewConf.cardBorder,
                  }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border"
                      style={{
                        backgroundColor: previewConf.badgeBg,
                        borderColor: previewConf.badgeBorder,
                        color: previewConf.primaryColor,
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: previewConf.accentColor }} />
                      ตัวอย่างการแสดงผล (PREVIEW)
                    </span>
                    <span className="text-[10px] font-mono font-medium" style={{ color: previewConf.mutedColor }}>
                      {previewConf.nameEn}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold flex items-center gap-1.5" style={{ color: previewConf.primaryColor }}>
                    <Sparkles className="w-3.5 h-3.5" style={{ color: previewConf.accentColor }} />
                    ข้อความหัวข้อคมชัด สบายตา ไม่กลืนกับพื้นหลัง
                  </h4>
                  <p className="text-xs font-medium leading-relaxed mt-1" style={{ color: previewConf.bodyColor }}>
                    ตัวอักษรและรายละเอียดได้รับการออกแบบให้มีความชัดเจนสูง สบายตา และมีเอกลักษณ์ระดับพรีเมียม
                  </p>
                </div>
              );
            })()}
          </div>

          {/* Top Giant Mask Typography */}
          <div className="p-4 rounded-xl border bg-muted/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Type className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    ข้อความตัวโตด้านบน (Top Giant Mask Typography)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ตัวอักษร Mask โปร่งแสงขนาดใหญ่ เช่น &ldquo;EMBER&rdquo;, &ldquo;BUDDHIST&rdquo;, &ldquo;MCU&rdquo; (คลิกเพื่อเปิดลิงก์ได้)
                  </p>
                </div>
              </div>
              <LiyonSwitch
                checked={value.topTypography.enabled}
                onCheckedChange={(checked) =>
                  update("topTypography", { ...value.topTypography, enabled: checked })
                }
              />
            </div>

            {value.topTypography.enabled && (
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <LiyonField label="ข้อความตัวโต">
                    <input
                      type="text"
                      value={value.topTypography.text}
                      onChange={(e) =>
                        update("topTypography", { ...value.topTypography, text: e.target.value })
                      }
                      placeholder="EMBER หรือ MCU"
                    />
                  </LiyonField>
                  <LiyonField label="ลิงก์ปลายทางเมื่อคลิก">
                    <input
                      type="text"
                      value={value.topTypography.linkHref ?? ""}
                      onChange={(e) =>
                        update("topTypography", { ...value.topTypography, linkHref: e.target.value })
                      }
                      placeholder="/portal/news"
                    />
                  </LiyonField>
                </div>

                {/* Size Selection Buttons */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <span>ขนาดข้อความตัวโตด้านบน:</span>
                      <span className="text-primary font-bold">
                        {
                          TYPOGRAPHY_SIZE_OPTIONS.find(
                            (o) => o.id === (value.topTypography.fontSize || "giant")
                          )?.labelTh
                        }
                      </span>
                    </label>
                    <span className="text-[11px] text-muted-foreground">
                      เลือกขนาดให้เหมาะสมกับความยาวของข้อความ
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {TYPOGRAPHY_SIZE_OPTIONS.map((opt) => {
                      const isSelected = (value.topTypography.fontSize || "giant") === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            update("topTypography", {
                              ...value.topTypography,
                              fontSize: opt.id,
                            })
                          }
                          className={cn(
                            "relative flex flex-col p-2.5 rounded-lg border text-left transition-all cursor-pointer",
                            isSelected
                              ? "border-primary bg-primary/10 ring-1 ring-primary shadow-xs"
                              : "border-border/80 bg-background hover:bg-muted/40"
                          )}
                        >
                          {opt.badge && (
                            <span className="absolute top-1.5 right-1.5 px-1 py-0.2 rounded text-[9px] font-bold bg-primary text-primary-foreground">
                              {opt.badge}
                            </span>
                          )}
                          <div className="font-semibold text-xs text-foreground flex items-center justify-between">
                            <span>{opt.labelTh}</span>
                            {isSelected && <Check className="h-3.5 w-3.5 text-primary ml-1" />}
                          </div>
                          <span className="text-[10px] font-mono text-primary font-medium mt-0.5">
                            {opt.scaleLabel}
                          </span>
                          <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 leading-tight">
                            {opt.descTh}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Live Preview Box */}
                <div className="p-3 bg-muted/40 rounded-lg border border-border/70 overflow-hidden">
                  <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-border/50 text-[11px] text-muted-foreground">
                    <span className="font-semibold">ตัวอย่างการแสดงผลข้อความด้านบน (Live Preview):</span>
                    <span className="font-mono text-primary font-medium">
                      ขนาด: {value.topTypography.fontSize || "giant"}
                    </span>
                  </div>
                  <div className="py-4 px-4 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-md flex items-center justify-center overflow-hidden min-h-[90px]">
                    <span
                      className={cn(
                        "font-black tracking-tighter uppercase select-none transition-all duration-200 drop-shadow-xs leading-none",
                        value.topTypography.fontSize === "small"
                          ? "text-2xl sm:text-3xl"
                          : value.topTypography.fontSize === "medium"
                          ? "text-3xl sm:text-4xl"
                          : value.topTypography.fontSize === "large"
                          ? "text-4xl sm:text-5xl"
                          : "text-5xl sm:text-6xl"
                      )}
                      style={{
                        WebkitTextStroke: "1.5px rgba(100, 116, 139, 0.9)",
                        color: "transparent",
                      }}
                    >
                      {value.topTypography.text || "EMBER"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Watermark Typography */}
          <div className="p-4 rounded-xl border bg-muted/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Type className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    ลายน้ำตัวโตมุมล่าง (Bottom Watermark Typography)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ลายน้ำศิลปะสไตล์สตูดิโอ เช่น &ldquo;STUDIO&rdquo;, &ldquo;FACULTY&rdquo; ที่มุมขวาล่างของส่วนหัว
                  </p>
                </div>
              </div>
              <LiyonSwitch
                checked={value.bottomWatermark.enabled}
                onCheckedChange={(checked) =>
                  update("bottomWatermark", { ...value.bottomWatermark, enabled: checked })
                }
              />
            </div>

            {value.bottomWatermark.enabled && (
              <div className="space-y-4 pt-1">
                <LiyonField label="ข้อความลายน้ำ">
                  <input
                    type="text"
                    value={value.bottomWatermark.text}
                    onChange={(e) =>
                      update("bottomWatermark", { ...value.bottomWatermark, text: e.target.value })
                    }
                    placeholder="STUDIO หรือ BUDDHIST"
                  />
                </LiyonField>

                {/* Size Selection Buttons */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <span>ขนาดลายน้ำมุมล่าง:</span>
                      <span className="text-primary font-bold">
                        {
                          TYPOGRAPHY_SIZE_OPTIONS.find(
                            (o) => o.id === (value.bottomWatermark.fontSize || "giant")
                          )?.labelTh
                        }
                      </span>
                    </label>
                    <span className="text-[11px] text-muted-foreground">
                      เลือกขนาดที่กลมกลืนและไม่ทับข้อมูลแถบด้านล่าง
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {TYPOGRAPHY_SIZE_OPTIONS.map((opt) => {
                      const isSelected = (value.bottomWatermark.fontSize || "giant") === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            update("bottomWatermark", {
                              ...value.bottomWatermark,
                              fontSize: opt.id,
                            })
                          }
                          className={cn(
                            "relative flex flex-col p-2.5 rounded-lg border text-left transition-all cursor-pointer",
                            isSelected
                              ? "border-primary bg-primary/10 ring-1 ring-primary shadow-xs"
                              : "border-border/80 bg-background hover:bg-muted/40"
                          )}
                        >
                          {opt.badge && (
                            <span className="absolute top-1.5 right-1.5 px-1 py-0.2 rounded text-[9px] font-bold bg-primary text-primary-foreground">
                              {opt.badge}
                            </span>
                          )}
                          <div className="font-semibold text-xs text-foreground flex items-center justify-between">
                            <span>{opt.labelTh}</span>
                            {isSelected && <Check className="h-3.5 w-3.5 text-primary ml-1" />}
                          </div>
                          <span className="text-[10px] font-mono text-primary font-medium mt-0.5">
                            {opt.scaleLabel}
                          </span>
                          <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 leading-tight">
                            {opt.descTh}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Live Preview Box */}
                <div className="p-3 bg-muted/40 rounded-lg border border-border/70 overflow-hidden">
                  <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-border/50 text-[11px] text-muted-foreground">
                    <span className="font-semibold">ตัวอย่างการแสดงผลลายน้ำมุมล่าง (Live Preview):</span>
                    <span className="font-mono text-primary font-medium">
                      ขนาด: {value.bottomWatermark.fontSize || "giant"}
                    </span>
                  </div>
                  <div className="py-4 px-4 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-md flex items-center justify-end overflow-hidden min-h-[90px]">
                    <span
                      className={cn(
                        "font-black tracking-tighter uppercase select-none transition-all duration-200 drop-shadow-xs leading-none",
                        value.bottomWatermark.fontSize === "small"
                          ? "text-2xl sm:text-3xl"
                          : value.bottomWatermark.fontSize === "medium"
                          ? "text-3xl sm:text-4xl"
                          : value.bottomWatermark.fontSize === "large"
                          ? "text-4xl sm:text-5xl"
                          : "text-5xl sm:text-6xl"
                      )}
                      style={{
                        WebkitTextStroke: "1px rgba(100, 116, 139, 0.6)",
                        color: "rgba(100, 116, 139, 0.15)",
                      }}
                    >
                      {value.bottomWatermark.text || "STUDIO"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Manifesto / About Card */}
          <div className="p-3.5 rounded-xl border bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">การ์ดปณิธาน / แถลงการณ์ (Manifesto / About Card)</p>
                <p className="text-xs text-muted-foreground">กล่องแก้ว Glassmorphism แสดงวิสัยทัศน์กลางจอ</p>
              </div>
              <LiyonSwitch
                checked={value.manifesto.enabled}
                onCheckedChange={(checked) =>
                  update("manifesto", { ...value.manifesto, enabled: checked })
                }
              />
            </div>
            {value.manifesto.enabled && (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <LiyonField label="ป้ายกำกับ (ภาษาไทย)">
                    <input
                      type="text"
                      value={value.manifesto.badgeTextTh}
                      onChange={(e) =>
                        update("manifesto", { ...value.manifesto, badgeTextTh: e.target.value })
                      }
                      placeholder="เกี่ยวกับเรา"
                    />
                  </LiyonField>
                  <LiyonField label="ป้ายกำกับ (ภาษาอังกฤษ)">
                    <input
                      type="text"
                      value={value.manifesto.badgeTextEn}
                      onChange={(e) =>
                        update("manifesto", { ...value.manifesto, badgeTextEn: e.target.value })
                      }
                      placeholder="ABOUT"
                    />
                  </LiyonField>
                </div>
                <LiyonField label="ข้อความปณิธาน (ภาษาไทย)" hint="แสดงเมื่อเปิดโหมดภาษาไทย">
                  <textarea
                    rows={3}
                    value={value.manifesto.bodyTh}
                    onChange={(e) =>
                      update("manifesto", { ...value.manifesto, bodyTh: e.target.value })
                    }
                    className="w-full rounded-md border p-2 text-sm bg-background"
                  />
                </LiyonField>
                <LiyonField label="ข้อความปณิธาน (ภาษาอังกฤษ)" hint="แสดงเมื่อเปิดโหมดภาษาอังกฤษ">
                  <textarea
                    rows={3}
                    value={value.manifesto.bodyEn}
                    onChange={(e) =>
                      update("manifesto", { ...value.manifesto, bodyEn: e.target.value })
                    }
                    className="w-full rounded-md border p-2 text-sm bg-background"
                  />
                </LiyonField>
              </div>
            )}
          </div>
        </div>
      </LiyonCard>

      {/* ── CARD 4: แถบเมนูหัวเว็บ (EMBER.dsgn Header) ── */}
      <LiyonCard>
        <div className="flex items-center gap-2 border-b pb-3 mb-4">
          <Compass className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">4. แถบเมนูหัวเว็บ (EMBER.dsgn Header Navigation)</h2>
        </div>

        <div className="space-y-4">
          {/* Quick Visibility Controls */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-xl border bg-muted/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">แสดงโลโก้</span>
              <LiyonSwitch
                checked={value.header.showLogo}
                onCheckedChange={(c) => update("header", { ...value.header, showLogo: c })}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">แสดงชื่อแบรนด์</span>
              <LiyonSwitch
                checked={value.header.showBrandText}
                onCheckedChange={(c) => update("header", { ...value.header, showBrandText: c })}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">ปุ่มเปลี่ยนภาษา (TH/EN)</span>
              <LiyonSwitch
                checked={value.header.showLanguageSwitcher}
                onCheckedChange={(c) => update("header", { ...value.header, showLanguageSwitcher: c })}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">ปุ่มโหมดมืด/สว่าง</span>
              <LiyonSwitch
                checked={value.header.showThemeToggle}
                onCheckedChange={(c) => update("header", { ...value.header, showThemeToggle: c })}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">ปุ่ม Avatar Menu (Staff)</span>
              <LiyonSwitch
                checked={value.header.showAvatarMenu}
                onCheckedChange={(c) => update("header", { ...value.header, showAvatarMenu: c })}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">ปุ่ม Contact Pill</span>
              <LiyonSwitch
                checked={value.header.contactPill.enabled}
                onCheckedChange={(c) =>
                  update("header", {
                    ...value.header,
                    contactPill: { ...value.header.contactPill, enabled: c },
                  })
                }
              />
            </div>
          </div>

          {/* Contact Pill Details */}
          {value.header.contactPill.enabled && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl border bg-muted/10">
              <LiyonField label="ข้อความ Contact (TH)">
                <input
                  type="text"
                  value={value.header.contactPill.labelTh}
                  onChange={(e) =>
                    update("header", {
                      ...value.header,
                      contactPill: { ...value.header.contactPill, labelTh: e.target.value },
                    })
                  }
                  placeholder="ติดต่อเรา"
                />
              </LiyonField>
              <LiyonField label="ข้อความ Contact (EN)">
                <input
                  type="text"
                  value={value.header.contactPill.labelEn}
                  onChange={(e) =>
                    update("header", {
                      ...value.header,
                      contactPill: { ...value.header.contactPill, labelEn: e.target.value },
                    })
                  }
                  placeholder="CONTACTS"
                />
              </LiyonField>
              <LiyonField label="ลิงก์ปลายทาง">
                <input
                  type="text"
                  value={value.header.contactPill.href}
                  onChange={(e) =>
                    update("header", {
                      ...value.header,
                      contactPill: { ...value.header.contactPill, href: e.target.value },
                    })
                  }
                  placeholder="/portal/documents"
                />
              </LiyonField>
            </div>
          )}

          {/* Navigation Links Table with Add / Edit / Delete / Toggle */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">รายการเมนูนำทาง (Header Navigation Links)</h3>
                <p className="text-xs text-muted-foreground">ลิงก์ที่มีจุดสีส้มนำหน้าบนแถบเมนูด้านบน</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addNavLink}
                className="cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มเมนูนำทาง</span>
              </Button>
            </div>

            <div className="space-y-2">
              {value.header.navLinks.map((link, index) => (
                <div
                  key={link.id}
                  className={cn(
                    "flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 rounded-xl border transition-all",
                    link.enabled ? "bg-background" : "bg-muted/40 opacity-60"
                  )}
                >
                  <span className="text-xs font-mono font-bold text-muted-foreground w-6 text-center shrink-0 hidden sm:inline">
                    #{index + 1}
                  </span>
                  <input
                    type="text"
                    value={link.labelTh}
                    onChange={(e) => updateNavLink(link.id, { labelTh: e.target.value })}
                    placeholder="ชื่อเมนูภาษาไทย"
                    className="flex-1 text-sm font-medium"
                  />
                  <input
                    type="text"
                    value={link.labelEn}
                    onChange={(e) => updateNavLink(link.id, { labelEn: e.target.value })}
                    placeholder="ชื่อเมนูภาษาอังกฤษ"
                    className="flex-1 text-sm font-medium"
                  />
                  <input
                    type="text"
                    value={link.href}
                    onChange={(e) => updateNavLink(link.id, { href: e.target.value })}
                    placeholder="URL (เช่น /portal/news)"
                    className="flex-1 text-sm font-mono"
                  />
                  <div className="flex items-center gap-1 shrink-0 justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => updateNavLink(link.id, { enabled: !link.enabled })}
                      title={link.enabled ? "คลิกเพื่อซ่อน" : "คลิกเพื่อแสดง"}
                      className="cursor-pointer text-muted-foreground hover:text-foreground"
                    >
                      {link.enabled ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeNavLink(link.id)}
                      title="ลบเมนูนี้"
                      className="cursor-pointer text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {value.header.navLinks.length === 0 && (
                <div className="text-center py-6 border border-dashed rounded-xl text-muted-foreground text-xs">
                  ยังไม่มีเมนูนำทาง กรุณากดปุ่ม &ldquo;เพิ่มเมนูนำทาง&rdquo; ด้านบน
                </div>
              )}
            </div>
          </div>
        </div>
      </LiyonCard>

      {/* ── CARD 5: แถบข้อมูลด้านล่าง (Footer Rail) ── */}
      <LiyonCard>
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">5. แถบข้อมูลด้านล่าง (Hero Footer Rail)</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {value.footerRail.enabled ? "เปิดแสดง Footer Rail" : "ปิดแสดง Footer Rail"}
            </span>
            <LiyonSwitch
              checked={value.footerRail.enabled}
              onCheckedChange={(c) => update("footerRail", { ...value.footerRail, enabled: c })}
            />
          </div>
        </div>

        {value.footerRail.enabled && (
          <div className="space-y-5">
            {/* CTA Button */}
            <div className="p-3.5 rounded-xl border bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">ปุ่มสำรวจผลงาน / แอ็กชัน (CTA Explore Button)</p>
                  <p className="text-xs text-muted-foreground">ปุ่มวงรีที่มุมซ้ายล่าง เช่น &ldquo;EXPLORE OUR WORK&rdquo;</p>
                </div>
                <LiyonSwitch
                  checked={value.footerRail.ctaButton.enabled}
                  onCheckedChange={(c) =>
                    update("footerRail", {
                      ...value.footerRail,
                      ctaButton: { ...value.footerRail.ctaButton, enabled: c },
                    })
                  }
                />
              </div>

              {value.footerRail.ctaButton.enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <LiyonField label="ข้อความด้านบน (Eyebrow)">
                    <input
                      type="text"
                      value={value.footerRail.ctaButton.eyebrow}
                      onChange={(e) =>
                        update("footerRail", {
                          ...value.footerRail,
                          ctaButton: { ...value.footerRail.ctaButton, eyebrow: e.target.value },
                        })
                      }
                      placeholder="DOUBLE CLICK AND"
                    />
                  </LiyonField>
                  <LiyonField label="ข้อความปุ่ม (TH / EN)">
                    <input
                      type="text"
                      value={value.footerRail.ctaButton.labelEn}
                      onChange={(e) =>
                        update("footerRail", {
                          ...value.footerRail,
                          ctaButton: { ...value.footerRail.ctaButton, labelEn: e.target.value },
                        })
                      }
                      placeholder="EXPLORE OUR WORK"
                    />
                  </LiyonField>
                  <LiyonField label="ลิงก์ปลายทาง">
                    <input
                      type="text"
                      value={value.footerRail.ctaButton.href}
                      onChange={(e) =>
                        update("footerRail", {
                          ...value.footerRail,
                          ctaButton: { ...value.footerRail.ctaButton, href: e.target.value },
                        })
                      }
                      placeholder="/portal/programs"
                    />
                  </LiyonField>
                </div>
              )}
            </div>

            {/* Social Links with Add / Edit / Delete / Toggle */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold">โซเชียลมีเดียลิงก์ (Social Links)</h3>
                  <p className="text-xs text-muted-foreground">ลิงก์โซเชียลตรงกลางแถบด้านล่าง (เช่น FACEBOOK, INSTAGRAM)</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSocialLink}
                  className="cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>เพิ่มโซเชียลลิงก์</span>
                </Button>
              </div>

              <div className="space-y-2">
                {value.footerRail.socialLinks.map((social) => (
                  <div
                    key={social.id}
                    className={cn(
                      "flex items-center gap-2 p-2.5 rounded-xl border transition-all",
                      social.enabled ? "bg-background" : "bg-muted/40 opacity-60"
                    )}
                  >
                    <input
                      type="text"
                      value={social.label}
                      onChange={(e) => updateSocialLink(social.id, { label: e.target.value })}
                      placeholder="ชื่อแพลตฟอร์ม (เช่น FACEBOOK)"
                      className="w-1/3 text-sm font-bold uppercase"
                    />
                    <input
                      type="text"
                      value={social.href}
                      onChange={(e) => updateSocialLink(social.id, { href: e.target.value })}
                      placeholder="URL ลิงก์ (https://...)"
                      className="flex-1 text-sm font-mono"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => updateSocialLink(social.id, { enabled: !social.enabled })}
                      title={social.enabled ? "คลิกเพื่อซ่อน" : "คลิกเพื่อแสดง"}
                      className="cursor-pointer text-muted-foreground hover:text-foreground"
                    >
                      {social.enabled ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSocialLink(social.id)}
                      title="ลบลิงก์นี้"
                      className="cursor-pointer text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {value.footerRail.socialLinks.length === 0 && (
                  <div className="text-center py-4 border border-dashed rounded-xl text-muted-foreground text-xs">
                    ยังไม่มีโซเชียลมีเดียลิงก์ กรุณากดปุ่ม &ldquo;เพิ่มโซเชียลลิงก์&rdquo;
                  </div>
                )}
              </div>
            </div>

            {/* Location Text */}
            <div className="p-3.5 rounded-xl border bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">ข้อมูลที่ตั้งและพิกัด (Location & Address)</p>
                  <p className="text-xs text-muted-foreground">แสดงที่มุมขวาล่างของแถบ Footer Rail</p>
                </div>
                <LiyonSwitch
                  checked={value.footerRail.locationText.enabled}
                  onCheckedChange={(c) =>
                    update("footerRail", {
                      ...value.footerRail,
                      locationText: { ...value.footerRail.locationText, enabled: c },
                    })
                  }
                />
              </div>

              {value.footerRail.locationText.enabled && (
                <LiyonField label="ข้อความที่อยู่/พิกัด">
                  <input
                    type="text"
                    value={value.footerRail.locationText.address ?? ""}
                    onChange={(e) =>
                      update("footerRail", {
                        ...value.footerRail,
                        locationText: { ...value.footerRail.locationText, address: e.target.value },
                      })
                    }
                    placeholder="WANG NOI, AYUTTHAYA 13170, THAILAND"
                  />
                </LiyonField>
              )}
            </div>
          </div>
        )}
      </LiyonCard>
    </div>
  );
}
