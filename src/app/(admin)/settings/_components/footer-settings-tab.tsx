"use client";

import * as React from "react";
import {
  Phone,
  Mail,
  MapPin,
  Globe,
  Info,
  ShieldCheck,
  PanelBottom,
  Plus,
  Trash2,
  RotateCcw,
  ListOrdered,
  Layers,
  Code,
} from "lucide-react";
import { LiyonCard, LiyonField, LiyonSwitch } from "@/shared/components/liyon";
import {
  type FooterSettings,
  type FooterLink,
  DEFAULT_FOOTER_QUICK_LINKS,
  DEFAULT_FOOTER_SYSTEM_LINKS,
} from "@/features/identity";

interface FooterSettingsTabProps {
  value: FooterSettings;
  onChange: (value: FooterSettings) => void;
}

export function FooterSettingsTab({ value, onChange }: FooterSettingsTabProps) {
  const update = <K extends keyof FooterSettings>(key: K, val: FooterSettings[K]) => {
    onChange({ ...value, [key]: val });
  };

  const quickLinks: FooterLink[] =
    value.quickLinks && value.quickLinks.length > 0
      ? value.quickLinks
      : DEFAULT_FOOTER_QUICK_LINKS;

  const systemLinks: FooterLink[] =
    value.systemLinks && value.systemLinks.length > 0
      ? value.systemLinks
      : DEFAULT_FOOTER_SYSTEM_LINKS;

  const updateQuickLink = (id: string, patch: Partial<FooterLink>) => {
    const next = quickLinks.map((l) => (l.id === id ? { ...l, ...patch } : l));
    update("quickLinks", next);
  };

  const addQuickLink = () => {
    const newLink: FooterLink = {
      id: `link-${Date.now()}`,
      labelTh: "เมนูใหม่",
      labelEn: "New Menu",
      href: "/portal",
      enabled: true,
    };
    update("quickLinks", [...quickLinks, newLink]);
  };

  const removeQuickLink = (id: string) => {
    update("quickLinks", quickLinks.filter((l) => l.id !== id));
  };

  const resetQuickLinks = () => {
    update("quickLinks", DEFAULT_FOOTER_QUICK_LINKS);
  };

  const updateSystemLink = (id: string, patch: Partial<FooterLink>) => {
    const next = systemLinks.map((l) => (l.id === id ? { ...l, ...patch } : l));
    update("systemLinks", next);
  };

  const addSystemLink = () => {
    const newLink: FooterLink = {
      id: `sys-${Date.now()}`,
      labelTh: "ระบบใหม่",
      labelEn: "New System",
      href: "/portal",
      enabled: true,
    };
    update("systemLinks", [...systemLinks, newLink]);
  };

  const removeSystemLink = (id: string) => {
    update("systemLinks", systemLinks.filter((l) => l.id !== id));
  };

  const resetSystemLinks = () => {
    update("systemLinks", DEFAULT_FOOTER_SYSTEM_LINKS);
  };

  return (
    <div className="space-y-6">
      {/* ── CARD 1: ข้อมูลการติดต่อ & ที่ตั้งสำนักงาน ── */}
      <LiyonCard>
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <div className="flex items-center gap-2">
            <PanelBottom className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">1. สถานะและการแสดงผลท้ายเว็บ (Footer Display)</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {value.enabled ? "เปิดแสดง Footer ท้ายเว็บ" : "ปิดแสดง Footer ท้ายเว็บ"}
            </span>
            <LiyonSwitch
              checked={value.enabled}
              onCheckedChange={(checked) => update("enabled", checked)}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border">
            <div className="space-y-0.5">
              <div className="text-sm font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>แสดงปุ่มเข้าระบบสำหรับเจ้าหน้าที่ (Staff Console)</span>
              </div>
              <p className="text-xs text-muted-foreground">
                แสดงปุ่มทางลัดเข้าสู่ระบบหลังบ้านสำหรับบุคลากรใน Footer และแถบล่างสุด
              </p>
            </div>
            <LiyonSwitch
              checked={value.showStaffConsole}
              onCheckedChange={(checked) => update("showStaffConsole", checked)}
            />
          </div>

          {/* Dev Credit Toggle & Text */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border">
            <div className="space-y-0.5">
              <div className="text-sm font-medium flex items-center gap-1.5">
                <Code className="w-4 h-4 text-primary" />
                <span>แสดงเครดิตผู้พัฒนา (Dev. Credit) ท้ายเว็บ</span>
              </div>
              <p className="text-xs text-muted-foreground">
                แสดงข้อความ &quot;Dev. by สำนักงานคณบดีคณะพุทธศาสตร์&quot; ที่แถบล่างสุดของ Footer
              </p>
            </div>
            <LiyonSwitch
              checked={value.showDevCredit ?? true}
              onCheckedChange={(checked) => update("showDevCredit", checked)}
            />
          </div>

          {(value.showDevCredit ?? true) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-lg border bg-slate-50/50 dark:bg-muted/20">
              <LiyonField
                label="ข้อความเครดิตผู้พัฒนา (ภาษาไทย)"
                hint="เช่น Dev. by สำนักงานคณบดีคณะพุทธศาสตร์"
              >
                <input
                  type="text"
                  className="input"
                  value={value.devCreditTh ?? "Dev. by สำนักงานคณบดีคณะพุทธศาสตร์"}
                  onChange={(e) => update("devCreditTh", e.target.value)}
                />
              </LiyonField>
              <LiyonField
                label="Developer Credit Text (English)"
                hint="e.g. Dev. by Office of the Dean, Faculty of Buddhism"
              >
                <input
                  type="text"
                  className="input"
                  value={value.devCreditEn ?? "Dev. by Office of the Dean, Faculty of Buddhism"}
                  onChange={(e) => update("devCreditEn", e.target.value)}
                />
              </LiyonField>
            </div>
          )}

          <div className="space-y-4 pt-2">
            <LiyonField
              label="คำอธิบายองค์กร / ปณิธานสังเขป (TH)"
              hint="ข้อความแนะนำองค์กรใต้โลโก้ฝั่งซ้ายของ Footer"
            >
              <textarea
                className="input min-h-[72px] resize-y"
                value={value.descTh}
                onChange={(e) => update("descTh", e.target.value)}
                rows={3}
              />
            </LiyonField>

            <LiyonField
              label="คำอธิบายองค์กร / ปณิธานสังเขป (EN)"
              hint="Mission & About description under logo in English"
            >
              <textarea
                className="input min-h-[72px] resize-y"
                value={value.descEn}
                onChange={(e) => update("descEn", e.target.value)}
                rows={3}
              />
            </LiyonField>
          </div>
        </div>
      </LiyonCard>

      {/* ── CARD 2: ข้อมูลติดต่อ (Contact Information) ── */}
      <LiyonCard>
        <div className="flex items-center gap-2 border-b pb-3 mb-4">
          <MapPin className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">2. ช่องทางการติดต่อและที่อยู่ (Contact Details)</h2>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LiyonField
              label="เบอร์โทรศัพท์ติดต่อ"
              hint="เช่น 035-248-000 ต่อ 8100-8104"
            >
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  className="input pl-9"
                  value={value.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="035-248-000"
                />
              </div>
            </LiyonField>

            <LiyonField
              label="อีเมลติดต่อหลัก"
              hint="เช่น buddhist@mcu.ac.th"
            >
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  className="input pl-9"
                  value={value.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="buddhist@mcu.ac.th"
                />
              </div>
            </LiyonField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LiyonField
              label="ที่อยู่สำนักงาน / คณะ (TH)"
              hint="เลขที่ ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
            >
              <textarea
                className="input min-h-[64px] resize-y"
                value={value.addressTh}
                onChange={(e) => update("addressTh", e.target.value)}
                rows={2}
              />
            </LiyonField>

            <LiyonField
              label="ที่อยู่สำนักงาน / คณะ (EN)"
              hint="Office Address in English"
            >
              <textarea
                className="input min-h-[64px] resize-y"
                value={value.addressEn}
                onChange={(e) => update("addressEn", e.target.value)}
                rows={2}
              />
            </LiyonField>
          </div>
        </div>
      </LiyonCard>

      {/* ── CARD 3: คอลัมน์และลิงก์ภายนอก ── */}
      <LiyonCard>
        <div className="flex items-center gap-2 border-b pb-3 mb-4">
          <Globe className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">3. คอลัมน์ลิงก์ & ลิงก์มหาวิทยาลัย (Links & Systems)</h2>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LiyonField label="หัวข้อคอลัมน์ที่ 2 (TH)" hint="หัวข้อหมวดเมนูลัด">
              <input
                type="text"
                className="input"
                value={value.quickLinksTitleTh}
                onChange={(e) => update("quickLinksTitleTh", e.target.value)}
              />
            </LiyonField>
            <LiyonField label="หัวข้อคอลัมน์ที่ 2 (EN)">
              <input
                type="text"
                className="input"
                value={value.quickLinksTitleEn}
                onChange={(e) => update("quickLinksTitleEn", e.target.value)}
              />
            </LiyonField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LiyonField label="หัวข้อคอลัมน์ที่ 3 (TH)" hint="หัวข้อหมวดระบบสารสนเทศ">
              <input
                type="text"
                className="input"
                value={value.systemsTitleTh}
                onChange={(e) => update("systemsTitleTh", e.target.value)}
              />
            </LiyonField>
            <LiyonField label="หัวข้อคอลัมน์ที่ 3 (EN)">
              <input
                type="text"
                className="input"
                value={value.systemsTitleEn}
                onChange={(e) => update("systemsTitleEn", e.target.value)}
              />
            </LiyonField>
          </div>

          <div className="border-t pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <LiyonField label="URL เว็บไซต์หลัก มหาวิทยาลัย" hint="ลิงก์ภายนอก เช่น https://www.mcu.ac.th">
                  <input
                    type="url"
                    className="input"
                    value={value.mainWebsiteUrl}
                    onChange={(e) => update("mainWebsiteUrl", e.target.value)}
                    placeholder="https://www.mcu.ac.th"
                  />
                </LiyonField>
              </div>
              <div>
                <LiyonField label="ชื่อปุ่มเว็บไซต์หลัก มจร (TH)">
                  <input
                    type="text"
                    className="input"
                    value={value.mainWebsiteTextTh}
                    onChange={(e) => update("mainWebsiteTextTh", e.target.value)}
                  />
                </LiyonField>
              </div>
              <div>
                <LiyonField label="ชื่อปุ่มเว็บไซต์หลัก มจร (EN)">
                  <input
                    type="text"
                    className="input"
                    value={value.mainWebsiteTextEn}
                    onChange={(e) => update("mainWebsiteTextEn", e.target.value)}
                  />
                </LiyonField>
              </div>
            </div>

            {/* แถวเว็บไซต์หลัก คณะพุทธศาสตร์ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-border/50">
              <div className="md:col-span-1">
                <LiyonField label="URL เว็บไซต์หลัก คณะพุทธศาสตร์" hint="ลิงก์ภายนอก เช่น https://fb.mcu.ac.th">
                  <input
                    type="url"
                    className="input"
                    value={value.facultyWebsiteUrl ?? "https://fb.mcu.ac.th"}
                    onChange={(e) => update("facultyWebsiteUrl", e.target.value)}
                    placeholder="https://fb.mcu.ac.th"
                  />
                </LiyonField>
              </div>
              <div>
                <LiyonField label="ชื่อปุ่มเว็บไซต์คณะ (TH)">
                  <input
                    type="text"
                    className="input"
                    value={value.facultyWebsiteTextTh ?? "เว็บไซต์หลัก คณะพุทธศาสตร์"}
                    onChange={(e) => update("facultyWebsiteTextTh", e.target.value)}
                  />
                </LiyonField>
              </div>
              <div>
                <LiyonField label="ชื่อปุ่มเว็บไซต์คณะ (EN)">
                  <input
                    type="text"
                    className="input"
                    value={value.facultyWebsiteTextEn ?? "Faculty of Buddhism Website"}
                    onChange={(e) => update("facultyWebsiteTextEn", e.target.value)}
                  />
                </LiyonField>
              </div>
            </div>
          </div>
        </div>
      </LiyonCard>

      {/* ── CARD 4: รายการเมนูลัด & บริการนิสิต (Quick Links) ── */}
      <LiyonCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 mb-4">
          <div className="flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-lg font-bold">4. จัดการรายการเมนูลัด & บริการนิสิต (Quick Links)</h2>
              <p className="text-xs text-muted-foreground">
                สามารถเปิด/ปิดการแสดงผลแต่ละเมนู (เช่น ซ่อนเมนูที่ยังพัฒนาไม่เสร็จ) หรือแก้ไขชื่อและ URL ได้ทันที
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetQuickLinks}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground transition"
              title="คืนค่าเริ่มต้นของเมนูลัดทั้งหมด"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>คืนค่าเริ่มต้น</span>
            </button>
            <button
              type="button"
              onClick={addQuickLink}
              className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มเมนูลัด</span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {quickLinks.map((link, index) => (
            <div
              key={link.id}
              className={`p-3.5 rounded-xl border transition-all ${
                link.enabled
                  ? "bg-card border-border shadow-xs"
                  : "bg-muted/30 border-dashed border-muted-foreground/30 opacity-60"
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                <div className="flex items-center justify-between lg:justify-start gap-2 shrink-0">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    #{index + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <LiyonSwitch
                      checked={link.enabled}
                      onCheckedChange={(checked) => updateQuickLink(link.id, { enabled: checked })}
                    />
                    <span className={`text-xs font-medium ${link.enabled ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-muted-foreground"}`}>
                      {link.enabled ? "เปิดแสดง" : "ปิดซ่อน"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground block mb-0.5">
                      ชื่อเมนู (ไทย)
                    </label>
                    <input
                      type="text"
                      value={link.labelTh}
                      onChange={(e) => updateQuickLink(link.id, { labelTh: e.target.value })}
                      placeholder="เช่น ข่าวสารและประกาศ"
                      className="input w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground block mb-0.5">
                      ชื่อเมนู (อังกฤษ)
                    </label>
                    <input
                      type="text"
                      value={link.labelEn}
                      onChange={(e) => updateQuickLink(link.id, { labelEn: e.target.value })}
                      placeholder="เช่น News & Announcements"
                      className="input w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground block mb-0.5">
                      ลิงก์ปลายทาง (URL / Path)
                    </label>
                    <input
                      type="text"
                      value={link.href}
                      onChange={(e) => updateQuickLink(link.id, { href: e.target.value })}
                      placeholder="เช่น /portal/news"
                      className="input w-full text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end shrink-0 pt-2 lg:pt-0">
                  <button
                    type="button"
                    onClick={() => removeQuickLink(link.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                    title="ลบเมนูนี้"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {quickLinks.length === 0 && (
            <div className="text-center py-6 text-muted-foreground text-xs border border-dashed rounded-xl">
              ไม่มีเมนูลัดในระบบ สามารถคลิก &quot;เพิ่มเมนูลัด&quot; หรือ &quot;คืนค่าเริ่มต้น&quot; ได้
            </div>
          )}
        </div>
      </LiyonCard>

      {/* ── CARD 5: รายการระบบสารสนเทศ (System Links) ── */}
      <LiyonCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-lg font-bold">5. จัดการรายการระบบสารสนเทศ (Systems)</h2>
              <p className="text-xs text-muted-foreground">
                ลิงก์ระบบสารสนเทศองค์กรในคอลัมน์ที่ 3 เช่น ระบบจองห้องประชุม, ระบบเช็คชื่อ
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetSystemLinks}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground transition"
              title="คืนค่าเริ่มต้นของระบบสารสนเทศทั้งหมด"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>คืนค่าเริ่มต้น</span>
            </button>
            <button
              type="button"
              onClick={addSystemLink}
              className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มระบบ</span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {systemLinks.map((link, index) => (
            <div
              key={link.id}
              className={`p-3.5 rounded-xl border transition-all ${
                link.enabled
                  ? "bg-card border-border shadow-xs"
                  : "bg-muted/30 border-dashed border-muted-foreground/30 opacity-60"
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                <div className="flex items-center justify-between lg:justify-start gap-2 shrink-0">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    #{index + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <LiyonSwitch
                      checked={link.enabled}
                      onCheckedChange={(checked) => updateSystemLink(link.id, { enabled: checked })}
                    />
                    <span className={`text-xs font-medium ${link.enabled ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-muted-foreground"}`}>
                      {link.enabled ? "เปิดแสดง" : "ปิดซ่อน"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground block mb-0.5">
                      ชื่อระบบ (ไทย)
                    </label>
                    <input
                      type="text"
                      value={link.labelTh}
                      onChange={(e) => updateSystemLink(link.id, { labelTh: e.target.value })}
                      placeholder="เช่น ระบบจองห้องประชุมออนไลน์"
                      className="input w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground block mb-0.5">
                      ชื่อระบบ (อังกฤษ)
                    </label>
                    <input
                      type="text"
                      value={link.labelEn}
                      onChange={(e) => updateSystemLink(link.id, { labelEn: e.target.value })}
                      placeholder="เช่น Online Room Booking"
                      className="input w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground block mb-0.5">
                      ลิงก์ปลายทาง (URL / Path)
                    </label>
                    <input
                      type="text"
                      value={link.href}
                      onChange={(e) => updateSystemLink(link.id, { href: e.target.value })}
                      placeholder="เช่น /meetings"
                      className="input w-full text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end shrink-0 pt-2 lg:pt-0">
                  <button
                    type="button"
                    onClick={() => removeSystemLink(link.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                    title="ลบระบบนี้"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {systemLinks.length === 0 && (
            <div className="text-center py-6 text-muted-foreground text-xs border border-dashed rounded-xl">
              ไม่มีระบบสารสนเทศในรายการ สามารถคลิก &quot;เพิ่มระบบ&quot; หรือ &quot;คืนค่าเริ่มต้น&quot; ได้
            </div>
          )}
        </div>
      </LiyonCard>

      {/* ── CARD 6: แถบล่างสุด & ข้อมูลลิขสิทธิ์ (Footer Bottom Bar) ── */}
      <LiyonCard>
        <div className="flex items-center gap-2 border-b pb-3 mb-4">
          <Info className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">6. แถบล่างสุด & ลิขสิทธิ์ (Copyright & Bottom Bar)</h2>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LiyonField
              label="ชื่อมหาวิทยาลัย / หน่วยงานสังกัด (TH)"
              hint="ต่อท้ายชื่อคณะในบรรทัดลิขสิทธิ์"
            >
              <input
                type="text"
                className="input"
                value={value.subTaglineTh}
                onChange={(e) => update("subTaglineTh", e.target.value)}
              />
            </LiyonField>
            <LiyonField
              label="ชื่อมหาวิทยาลัย / หน่วยงานสังกัด (EN)"
              hint="University / Affiliation in English"
            >
              <input
                type="text"
                className="input"
                value={value.subTaglineEn}
                onChange={(e) => update("subTaglineEn", e.target.value)}
              />
            </LiyonField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LiyonField label="ข้อความสงวนลิขสิทธิ์ (TH)" hint="เช่น สงวนลิขสิทธิ์ทั้งหมด">
              <input
                type="text"
                className="input"
                value={value.copyrightTh}
                onChange={(e) => update("copyrightTh", e.target.value)}
              />
            </LiyonField>
            <LiyonField label="ข้อความสงวนลิขสิทธิ์ (EN)" hint="เช่น All rights reserved.">
              <input
                type="text"
                className="input"
                value={value.copyrightEn}
                onChange={(e) => update("copyrightEn", e.target.value)}
              />
            </LiyonField>
          </div>
        </div>
      </LiyonCard>
    </div>
  );
}
