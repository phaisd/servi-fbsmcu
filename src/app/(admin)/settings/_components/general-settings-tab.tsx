"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, X, Loader2, Image as ImageIcon, Type, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiyonCard, LiyonField, PalettePicker } from "@/shared/components/liyon";
import { useT } from "@/shared/lib/i18n/client";
import { cn } from "@/shared/lib/utils";
import type { PaletteId } from "@/shared/lib/palette";
import type { FontSizePreference } from "@/features/identity";
import { uploadLogoAction, removeLogoAction } from "@/features/identity/actions";

interface GeneralSettingsTabProps {
  nameTh: string;
  nameEn: string;
  logoUrl: string;
  palette: PaletteId;
  fontSize?: FontSizePreference;
  errors: Record<string, string[]>;
  onChange: (patch: {
    nameTh?: string;
    nameEn?: string;
    logoUrl?: string;
    palette?: PaletteId;
    fontSize?: FontSizePreference;
  }) => void;
}

const FONT_SIZE_OPTIONS: {
  id: FontSizePreference;
  labelTh: string;
  labelEn: string;
  scalePercent: string;
  descTh: string;
  letterSize: string;
  badge?: string;
}[] = [
  {
    id: "small",
    labelTh: "เล็ก",
    labelEn: "Small",
    scalePercent: "90%",
    descTh: "กะทัดรัด เหมาะกับจอความละเอียดสูงหรือต้องการดูข้อมูลมาก",
    letterSize: "text-sm",
  },
  {
    id: "normal",
    labelTh: "ปกติ (ค่าเริ่มต้น)",
    labelEn: "Default",
    scalePercent: "100%",
    descTh: "ขนาดมาตรฐานทั่วไป สัดส่วนสมดุล",
    letterSize: "text-base",
  },
  {
    id: "medium",
    labelTh: "ปานกลาง",
    labelEn: "Medium",
    scalePercent: "110%",
    descTh: "อ่านสบายตา เหมาะสำหรับจอโน้ตบุ๊กหรือมองสบายๆ",
    letterSize: "text-lg",
    badge: "แนะนำ",
  },
  {
    id: "large",
    labelTh: "ใหญ่",
    labelEn: "Large",
    scalePercent: "120%",
    descTh: "ตัวอักษรใหญ่ชัดเจน สำหรับผู้ที่ตัวหนังสือเล็กมองยาก",
    letterSize: "text-xl",
    badge: "มองง่ายชัดเจน",
  },
  {
    id: "xlarge",
    labelTh: "ใหญ่พิเศษ",
    labelEn: "Extra Large",
    scalePercent: "130%",
    descTh: "ขนาดใหญ่พิเศษ ชัดเจนเต็มตา อ่านง่ายที่สุด",
    letterSize: "text-2xl",
  },
];

export function GeneralSettingsTab({
  nameTh,
  nameEn,
  logoUrl,
  palette,
  fontSize = "normal",
  errors,
  onChange,
}: GeneralSettingsTabProps) {
  const t = useT();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  function handleSelectFontSize(size: FontSizePreference) {
    onChange({ fontSize: size });
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-font-size", size);
      try {
        localStorage.setItem("vibe_font_size", size);
        document.cookie = `vibe_font_size=${size};path=/;max-age=31536000;SameSite=Lax`;
      } catch {}
    }
  }

  const currentOpt = FONT_SIZE_OPTIONS.find((o) => o.id === (fontSize || "normal")) || FONT_SIZE_OPTIONS[1];

  async function uploadFile(file: File) {
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
    if (!allowed.includes(file.type)) {
      toast.error("รองรับเฉพาะไฟล์ PNG, JPEG, WebP และ SVG เท่านั้น");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("ขนาดไฟล์ต้องไม่เกิน 5MB");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const res = await uploadLogoAction(formData);
      if (res.ok) {
        onChange({ logoUrl: res.data.url });
        toast.success(t("settings.uploadSuccess"));
        router.refresh();
      } else {
        toast.error(res.error.fieldErrors?.file?.[0] ?? t("settings.uploadError"));
      }
    } catch {
      toast.error(t("settings.uploadError"));
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    void uploadFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if ((e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      void uploadFile(file);
    }
  }

  return (
    <>
      <LiyonCard>
        <h2>{t("settings.orgTitle")}</h2>
        <div className="fields">
          <LiyonField label={t("settings.nameTh")} htmlFor="s-name-th" error={errors.nameTh?.[0]}>
            <input
              id="s-name-th"
              value={nameTh}
              onChange={(e) => onChange({ nameTh: e.target.value })}
            />
          </LiyonField>
          <LiyonField label={t("settings.nameEn")} htmlFor="s-name-en" error={errors.nameEn?.[0]}>
            <input
              id="s-name-en"
              value={nameEn}
              onChange={(e) => onChange({ nameEn: e.target.value })}
            />
          </LiyonField>

          <div className="space-y-4">
            {/* กล่องอัปโหลดโลโก้ (เหนือช่อง URL) */}
            <div className="field">
              <label>{t("settings.uploadLogo")}</label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleFileChange}
              />

              <div
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => {
                  if (!uploading) fileInputRef.current?.click();
                }}
                className={cn(
                  "relative border-2 border-dashed rounded-xl p-5 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center",
                  isDragging
                    ? "border-primary bg-primary/10 ring-2 ring-primary/20 scale-[1.01]"
                    : "border-border/80 hover:border-primary/60 hover:bg-muted/40 bg-muted/20",
                  uploading && "opacity-75 pointer-events-none"
                )}
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm font-medium text-foreground">{t("settings.uploading")}</p>
                  </div>
                ) : logoUrl ? (
                  <div
                    className="flex flex-col sm:flex-row items-center gap-4 w-full p-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="h-20 w-20 rounded-lg bg-background border border-border flex items-center justify-center overflow-hidden p-2 shadow-sm shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={logoUrl}
                        alt="Logo preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {t("settings.logoPreview")}
                        </span>
                        <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-md font-medium">
                          {t("settings.readyToUse")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-1">{logoUrl}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("settings.dropToReplaceHint")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="cursor-pointer"
                      >
                        <Upload className="h-4 w-4 mr-1.5" />
                        <span>{t("settings.changeLogo")}</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={async (e) => {
                          e.stopPropagation();
                          onChange({ logoUrl: "" });
                          try {
                            await removeLogoAction();
                            toast.success("ลบโลโก้เรียบร้อยแล้ว");
                            router.refresh();
                          } catch {
                            // ignore
                          }
                        }}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                        title={t("settings.removeLogo")}
                      >
                        <X className="h-4 w-4 mr-1" />
                        <span>{t("settings.removeLogo")}</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-1">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {isDragging ? t("settings.dropzoneActive") : t("settings.dropzonePrompt")}
                    </p>
                    <p className="text-xs text-muted-foreground">{t("settings.dropzoneHint")}</p>
                  </div>
                )}
              </div>
            </div>

            {/* ช่อง URL โลโก้ อยู่ด้านล่างกล่องอัปโหลด */}
            <LiyonField
              label={t("settings.logoUrl")}
              htmlFor="s-logo"
              hint={t("common.optional")}
              error={errors.logoUrl?.[0]}
            >
              <input
                id="s-logo"
                type="text"
                placeholder="https://... หรืออัปโหลดจากกล่องด้านบน"
                value={logoUrl}
                onChange={(e) => onChange({ logoUrl: e.target.value })}
              />
            </LiyonField>
          </div>
        </div>
      </LiyonCard>

      <LiyonCard>
        <h2>{t("settings.brandTitle")}</h2>
        <p>{t("settings.brandDesc")}</p>
        <PalettePicker
          value={palette}
          onChange={(p) => onChange({ palette: p })}
          label={t("settings.paletteLabel")}
        />
        {palette === "coral" && (
          <p className="warn" role="note">
            {t("settings.coralWarn")}
          </p>
        )}
      </LiyonCard>

      <LiyonCard>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Type className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                การแสดงผลและขนาดตัวอักษร (Display & Font Size)
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                ปรับขนาดตัวอักษรของระบบ เพื่อให้อ่านง่าย สบายตา ชัดเจนขึ้น (มีผลกับเมนู ข้อมูลตาราง ฟอร์ม และข้อความทั้งหมด)
              </p>
            </div>
          </div>
          {fontSize !== "normal" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSelectFontSize("normal")}
              className="text-xs h-8 gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>รีเซ็ตค่าเริ่มต้น (100%)</span>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
          {FONT_SIZE_OPTIONS.map((opt) => {
            const isSelected = (fontSize || "normal") === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelectFontSize(opt.id)}
                className={cn(
                  "relative flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer",
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                    : "border-border/80 bg-background hover:bg-muted/40 hover:border-border"
                )}
              >
                {opt.badge && (
                  <span className="absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary">
                    {opt.badge}
                  </span>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg font-bold border",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-border/80",
                      opt.letterSize
                    )}
                  >
                    ก
                  </span>
                  <div>
                    <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                      <span>{opt.labelTh}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                    </div>
                    <span className="text-xs font-mono font-medium text-primary">
                      {opt.scalePercent}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-auto">
                  {opt.descTh}
                </p>
              </button>
            );
          })}
        </div>

        {/* Live Preview Box */}
        <div className="mt-5 p-4 rounded-xl border border-border/80 bg-muted/20 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-xs text-foreground uppercase tracking-wider">
                ตัวอย่างการแสดงผลจริง (Live Preview)
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                ขนาด: {currentOpt?.labelTh} ({currentOpt?.scalePercent})
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              * การเปลี่ยนแปลงจะมีผลทั่วทั้งระบบทันที
            </span>
          </div>

          <div className="p-4 bg-background rounded-lg border border-border/80 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs text-muted-foreground font-mono">รหัสนิสิต: 6601501004</span>
                <h4 className="text-base font-bold text-foreground">
                  พระปัญญาทีโป (Ven. Pannadipo)
                </h4>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                ● เข้าเรียนปกติ (Present)
              </span>
            </div>

            <p className="text-sm text-muted-foreground">
              สาขาวิชาพระพุทธศาสนา (Buddhist Studies) • หลักสูตรพุทธศาสตรบัณฑิต ภาคภาษาอังกฤษ • ชั้นปีที่ 4
            </p>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60 text-xs">
              <span className="text-muted-foreground">
                วิชา: 000 101 พระไตรปิฎกศึกษา (Tipitaka Studies)
              </span>
              <div className="flex gap-2">
                <span className="px-2.5 py-1 rounded-md bg-muted text-foreground font-medium">
                  ดูประวัติการเข้าเรียน
                </span>
                <span className="px-2.5 py-1 rounded-md bg-primary text-primary-foreground font-medium">
                  บันทึกเวลาเข้าเรียน
                </span>
              </div>
            </div>
          </div>
        </div>
      </LiyonCard>
    </>
  );
}
