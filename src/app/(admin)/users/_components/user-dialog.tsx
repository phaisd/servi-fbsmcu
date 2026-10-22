"use client";
import { LiyonDialog, LiyonDialogHeader, LiyonDialogBody, LiyonDialogFooter, LiyonDialogCloseButton, LiyonField, LiyonSelect, LiyonSwitchRow } from "@/shared/components/liyon";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useT, useLocale } from "@/shared/lib/i18n/client";
import { localizedName } from "@/shared/lib/format";
import type { UserForm, RolePick } from "./types";

const POSITION_PRESETS = [
  "เจ้าหน้าที่บริการการศึกษา",
  "นักจัดการงานทั่วไป",
  "เจ้าหน้าที่บริหารงานทั่วไป",
  "ผู้อำนวยการหลักสูตร",
  "อาจารย์",
];

const DEPARTMENT_PRESETS = [
  "สาขาวิชาพระไตรปิฎกศึกษา",
  "สาขาวิชาพุทธนวัตกรรมและการสื่อสาร",
  "สาขาวิชาศาสนาเปรียบเทียบ",
  "สำนักงานคณบดีบัณฑิตวิทยาลัย",
];

export function UserDialog({
  open,
  mode,
  onOpenChange,
  form,
  setForm,
  roles,
  isSubmitting,
  isSelf,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  onOpenChange: (o: boolean) => void;
  form: UserForm;
  setForm: (updater: (f: UserForm) => UserForm) => void;
  roles: RolePick[];
  isSubmitting: boolean;
  isSelf: boolean;
  onSubmit: () => void;
}) {
  const t = useT();
  const locale = useLocale();
  const canSubmit = form.name.trim() !== "" && form.email.trim() !== "" && form.roleIds.length > 0 && !isSubmitting;

  function toggleRole(roleId: string, checked: boolean) {
    setForm((f) => ({ ...f, roleIds: checked ? [...f.roleIds, roleId] : f.roleIds.filter((id) => id !== roleId) }));
  }

  /**
   * SUPER_ADMIN ไม่ให้เลือกจากช่องนี้เลย ทั้งตอนสร้างและตอนแก้ไข — มอบสิทธิ์สูงสุดต้องทำนอกฟอร์มทั่วไปเสมอ
   * และตอนนี้ข้อจำกัดนี้บังคับจริงฝั่ง server แล้ว (user.service.ts: assertCanAssignRoles/assertCanActOnTarget —
   * ผู้กระทำที่ไม่ใช่ super admin มอบบทบาทนี้หรือแตะผู้ใช้ที่ถือบทบาทนี้อยู่แล้วไม่ได้เลย) ไม่ใช่แค่ซ่อนไว้ในฟอร์มเฉย ๆ
   * ส่วน ADMIN เลือกได้ทั้งตอนสร้างและแก้ไข — ผู้ดูแลระบบสร้างผู้ใช้ระดับ ADMIN ได้ในขั้นตอนเดียว ไม่ต้องสร้างก่อนแล้ว
   * ค่อยแก้ไขทีหลัง
   */
  const assignableRoles = roles.filter((r) => r.code !== "SUPER_ADMIN");

  return (
    <LiyonDialog open={open} onOpenChange={onOpenChange}>
      <LiyonDialogCloseButton label={t("common.close")} />
      <LiyonDialogHeader title={t(mode === "create" ? "users.addTitle" : "users.editTitle")} description={mode === "create" ? t("users.addDesc") : undefined} />
      <LiyonDialogBody>
        <div className="fields">
          <LiyonField label={t("users.name")} htmlFor="user-name">
            <input id="user-name" value={form.name} placeholder={t("users.namePh")} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required disabled={isSelf} />
          </LiyonField>
          <LiyonField label={t("users.email")} htmlFor="user-email">
            <input id="user-email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required disabled={isSelf} />
          </LiyonField>

          {/* ฟิลด์ตำแหน่งงาน */}
          <LiyonField
            label="ตำแหน่งงาน (Position / Job Title)"
            htmlFor="user-position"
            hint="ใช้แสดงในระบบและระบุในหนังสือรับรอง เช่น เจ้าหน้าที่บริการการศึกษา, นักจัดการงานทั่วไป"
          >
            <input
              id="user-position"
              value={form.positionName}
              placeholder="ระบุตำแหน่ง เช่น เจ้าหน้าที่บริการการศึกษา"
              onChange={(e) => setForm((f) => ({ ...f, positionName: e.target.value }))}
              disabled={isSelf}
            />
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {POSITION_PRESETS.map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, positionName: pos }))}
                  disabled={isSelf}
                  className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                    form.positionName === pos
                      ? "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700"
                      : "bg-muted/50 hover:bg-muted text-muted-foreground border-transparent"
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </LiyonField>

          {/* ฟิลด์สังกัดหลักสูตร / สาขาวิชา / ฝ่าย */}
          <LiyonField
            label="สังกัดหลักสูตร / สาขาวิชา / ฝ่าย (Curriculum / Affiliation)"
            htmlFor="user-department"
            hint="ระบุหลักสูตรหรือส่วนงานที่เจ้าหน้าที่สังกัด เช่น สาขาวิชาพระไตรปิฎกศึกษา"
          >
            <input
              id="user-department"
              value={form.departmentName}
              placeholder="ระบุสังกัด เช่น สาขาวิชาพระไตรปิฎกศึกษา"
              onChange={(e) => setForm((f) => ({ ...f, departmentName: e.target.value }))}
              disabled={isSelf}
            />
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {DEPARTMENT_PRESETS.map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, departmentName: dept }))}
                  disabled={isSelf}
                  className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                    form.departmentName === dept
                      ? "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700"
                      : "bg-muted/50 hover:bg-muted text-muted-foreground border-transparent"
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </LiyonField>

          <LiyonField label={t("users.roles")} hint={isSelf ? t("users.cannotEditSelf") : t("users.rolesHint")}>
            <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto p-3 rounded-lg border border-[var(--glass-border)] bg-[var(--panel)]/40 scrollbar-thin">
              {assignableRoles.map((role) => (
                <label key={role.id} htmlFor={`role-${role.id}`} className="flex items-center gap-2 text-sm hover:text-[var(--text)] cursor-pointer">
                  <Checkbox id={`role-${role.id}`} checked={form.roleIds.includes(role.id)} onCheckedChange={(c) => toggleRole(role.id, c === true)} disabled={isSelf} />
                  {localizedName(role, locale)}
                </label>
              ))}
            </div>
          </LiyonField>
          <LiyonField label={t("users.scope")} htmlFor="user-scope">
            <LiyonSelect id="user-scope" value="ALL" disabled>
              <option value="ALL">{t("users.scope.ALL")}</option>
            </LiyonSelect>
          </LiyonField>
          {mode === "edit" && (
            <LiyonSwitchRow
              id="must-change-password"
              checked={form.mustChangePassword}
              onCheckedChange={(c) => setForm((f) => ({ ...f, mustChangePassword: c }))}
              disabled={isSelf}
              label={t("users.forceChange")}
            />
          )}
        </div>
      </LiyonDialogBody>
      <LiyonDialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
        <Button type="button" disabled={!canSubmit} onClick={onSubmit}>{t(mode === "create" ? "users.create" : "common.save")}</Button>
      </LiyonDialogFooter>
    </LiyonDialog>
  );
}
