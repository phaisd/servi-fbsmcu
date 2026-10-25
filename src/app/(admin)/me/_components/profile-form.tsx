"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LiyonCard, LiyonField, LiyonSelect } from "@/shared/components/liyon";
import { useT } from "@/shared/lib/i18n/client";
import type { Locale } from "@/shared/lib/i18n/config";
import { updateProfileAction } from "@/features/identity/actions";
import { updateMyTitlePlacementAction } from "@/features/personnel/actions";
import { formatPersonnelName } from "@/features/personnel";

export interface PersonnelProfileData {
  id: string;
  firstNameTh: string;
  lastNameTh: string;
  academicPosition: string | null;
  titlePlacement: "PREFIX" | "SUFFIX";
  positionTh: string;
  departmentName: string | null;
}

interface Props {
  initial: { name: string; locale: Locale; email: string };
  personnelProfile?: PersonnelProfileData | null;
}

export function ProfileForm({ initial, personnelProfile }: Props) {
  const t = useT();
  const router = useRouter();
  const { update } = useSession();

  const [form, setForm] = useState({ name: initial.name, locale: initial.locale });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [pending, start] = useTransition();

  // Personnel Title Placement State
  const [titlePlacement, setTitlePlacement] = useState<"PREFIX" | "SUFFIX">(
    personnelProfile?.titlePlacement || "SUFFIX"
  );
  const [isSavingPlacement, setIsSavingPlacement] = useState(false);

  // Live formatted name preview
  const previewFormattedName = useMemo(() => {
    if (!personnelProfile) return "";
    return formatPersonnelName({
      firstNameTh: personnelProfile.firstNameTh,
      lastNameTh: personnelProfile.lastNameTh,
      academicPosition: personnelProfile.academicPosition,
      titlePlacement: titlePlacement,
    });
  }, [personnelProfile, titlePlacement]);

  const handleSavePlacement = async () => {
    if (!personnelProfile) return;
    try {
      setIsSavingPlacement(true);
      await updateMyTitlePlacementAction(personnelProfile.id, titlePlacement);
      toast.success("บันทึกรูปแบบการแสดงตำแหน่งทางวิชาการเรียบร้อยแล้ว");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึก";
      toast.error(msg);
    } finally {
      setIsSavingPlacement(false);
    }
  };

  function save() {
    start(async () => {
      const r = await updateProfileAction(form);
      if (!r.ok) {
        setErrors(r.error.fieldErrors ?? {});
        if (!r.error.fieldErrors) toast.error(t(`error.${r.error.code}`));
        return;
      }

      // If personnel profile title placement was also changed, save it too
      if (personnelProfile && titlePlacement !== personnelProfile.titlePlacement) {
        try {
          await updateMyTitlePlacementAction(personnelProfile.id, titlePlacement);
        } catch {
          // Handled silently
        }
      }

      setErrors({});
      await update({ name: form.name });
      router.refresh();
      toast.success(t("me.saveOk"));
    });
  }

  return (
    <>
      <header className="ph">
        <h1>{t("me.title")}</h1>
      </header>

      <div className="set-cards space-y-6">
        {/* Card 1: ข้อมูลบัญชีผู้ใช้งานทั่วไป */}
        <LiyonCard>
          <div className="fields">
            <LiyonField label={t("auth.email")} htmlFor="me-email">
              <input id="me-email" value={initial.email} readOnly disabled />
            </LiyonField>
            <LiyonField label={t("me.name")} htmlFor="me-name" error={errors.name?.[0]}>
              <input
                id="me-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </LiyonField>
            <LiyonField label={t("me.language")} htmlFor="me-locale" error={errors.locale?.[0]}>
              <LiyonSelect
                id="me-locale"
                value={form.locale}
                onChange={(e) => setForm({ ...form, locale: e.target.value as Locale })}
              >
                <option value="th">{t("me.localeTh")}</option>
                <option value="en">{t("me.localeEn")}</option>
              </LiyonSelect>
            </LiyonField>
          </div>
          <p className="mt-3">
            <Link href="/change-password" className="text-primary text-xs hover:underline">
              {t("me.passwordTitle")}
            </Link>
          </p>
        </LiyonCard>

        {/* Card 2: การตั้งค่ารูปแบบชื่อสำหรับอาจารย์ผู้สอน (ปรากฏเมื่อบัญชีนี้ผูกกับโปรไฟล์อาจารย์) */}
        {personnelProfile && (
          <LiyonCard>
            <div className="space-y-4">
              <div className="border-b border-border pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span>🎓</span>
                    <span>รูปแบบการแสดงตำแหน่งทางวิชาการ (Academic Title Placement)</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    โปรไฟล์อาจารย์: <strong>{personnelProfile.firstNameTh} {personnelProfile.lastNameTh}</strong>
                    {personnelProfile.departmentName && ` • ${personnelProfile.departmentName}`}
                  </p>
                </div>
                <span className="self-start sm:self-auto text-[11px] px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">
                  อาจารย์ผู้สอนประจำ
                </span>
              </div>

              {/* กล่องแสดงตัวอย่างชื่อจริงแบบ Real-time */}
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] text-muted-foreground block font-medium">
                    ตัวอย่างชื่อที่จะแสดงในการ์ดอาจารย์ หน้าโปรไฟล์ และเอกสารทางการ (Live Preview):
                  </span>
                  <span className="text-base font-bold text-foreground tracking-wide mt-0.5 block font-serif">
                    {previewFormattedName}
                  </span>
                </div>
                <span className="self-start sm:self-auto text-xs font-mono px-2.5 py-1 rounded-md bg-background border border-border text-foreground font-semibold">
                  {titlePlacement === "SUFFIX" ? "ไว้หลังสมณศักดิ์" : "ไว้หน้าชื่อ"}
                </span>
              </div>

              {/* ตัวเลือกรูปแบบการจัดวาง */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* ตัวเลือก 1: SUFFIX (ไว้หลังสมณศักดิ์ / ฉายา) */}
                <label
                  onClick={() => setTitlePlacement("SUFFIX")}
                  className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    titlePlacement === "SUFFIX"
                      ? "border-primary bg-primary/5 text-foreground shadow-xs"
                      : "border-border hover:border-primary/40 bg-background text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs flex items-center gap-1.5 text-foreground">
                      <span>🪷</span>
                      <span>ไว้หลังสมณศักดิ์ / ฉายา (SUFFIX)</span>
                    </span>
                    <input
                      type="radio"
                      name="me-title-placement"
                      checked={titlePlacement === "SUFFIX"}
                      onChange={() => setTitlePlacement("SUFFIX")}
                      className="w-4 h-4 text-primary"
                    />
                  </div>
                  <p className="text-[11.5px] text-muted-foreground leading-relaxed">
                    ตามจารีต มจร. และมหาเถรสมาคม เช่น <em>{personnelProfile.firstNameTh}{personnelProfile.academicPosition ? `, ${personnelProfile.academicPosition}` : ""}</em>
                  </p>
                </label>

                {/* ตัวเลือก 2: PREFIX (ไว้หน้าชื่อ) */}
                <label
                  onClick={() => setTitlePlacement("PREFIX")}
                  className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    titlePlacement === "PREFIX"
                      ? "border-primary bg-primary/5 text-foreground shadow-xs"
                      : "border-border hover:border-primary/40 bg-background text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs flex items-center gap-1.5 text-foreground">
                      <span>🏛️</span>
                      <span>ไว้หน้าชื่อ (PREFIX)</span>
                    </span>
                    <input
                      type="radio"
                      name="me-title-placement"
                      checked={titlePlacement === "PREFIX"}
                      onChange={() => setTitlePlacement("PREFIX")}
                      className="w-4 h-4 text-primary"
                    />
                  </div>
                  <p className="text-[11.5px] text-muted-foreground leading-relaxed">
                    ตามระเบียบ อว. / ก.พ.อ. / รายงานประกันคุณภาพ AUN-QA เช่น <em>{personnelProfile.academicPosition ? `${personnelProfile.academicPosition} ` : ""}{personnelProfile.firstNameTh}</em>
                  </p>
                </label>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/60">
                <span className="text-[11.5px] text-muted-foreground">
                  💡 ท่านสามารถสลับรูปแบบได้ตลอดเวลา การเปลี่ยนแปลงจะมีผลกับการแสดงผลสาธารณะและการส่งออกเอกสาร Word ทันที
                </span>
                <Button
                  type="button"
                  size="sm"
                  disabled={isSavingPlacement || titlePlacement === personnelProfile.titlePlacement}
                  onClick={handleSavePlacement}
                  className="gap-1.5 h-8 text-xs shrink-0 cursor-pointer"
                >
                  {isSavingPlacement ? "กำลังบันทึก..." : "บันทึกเฉพาะรูปแบบชื่อ"}
                </Button>
              </div>
            </div>
          </LiyonCard>
        )}

        <div className="savebar">
          <Button type="button" onClick={save} disabled={pending} className="cursor-pointer">
            {pending ? "กำลังบันทึก..." : t("common.save")}
          </Button>
        </div>
      </div>
    </>
  );
}
