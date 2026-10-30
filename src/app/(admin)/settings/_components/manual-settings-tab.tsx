"use client";

import { BookOpen, CheckCircle2, Lock, Eye, EyeOff, ShieldCheck, HelpCircle } from "lucide-react";
import { LiyonCard, LiyonSwitch } from "@/shared/components/liyon";
import type { ManualSettings } from "@/features/identity";

interface ManualSettingsTabProps {
  value: ManualSettings;
  onChange: (value: ManualSettings) => void;
}

export function ManualSettingsTab({ value, onChange }: ManualSettingsTabProps) {
  const update = <K extends keyof ManualSettings>(key: K, val: ManualSettings[K]) => {
    onChange({ ...value, [key]: val });
  };

  const manualItems: Array<{
    key: keyof Omit<ManualSettings, "enabled">;
    title: string;
    desc: string;
    adminOnlyNote?: string;
  }> = [
    {
      key: "showPersonnel",
      title: "๑. ระบบทำเนียบคณาจารย์ บุคลากร และผู้บริหาร (Portal)",
      desc: "คู่มือการสืบค้นข้อมูลอาจารย์ คัดกรองตามภาควิชา ตรวจสอบตารางสอน งานวิจัย และเปิดดูไฟล์คำสั่งแต่งตั้ง (PDF/JPG)",
    },
    {
      key: "showPersonnelAdmin",
      title: "๒. ระบบจัดการข้อมูลอาจารย์ คำสั่งแต่งตั้ง และงานวิจัย (Admin)",
      desc: "คู่มือสำหรับเจ้าหน้าที่: เพิ่มแก้ไขข้อมูลอาจารย์ อัปโหลดคำสั่งแต่งตั้ง (PDF/JPG) เพิ่มผลงานวิจัย และตั้งค่าหน้า Portal",
      adminOnlyNote: "เฉพาะผู้ดูแลระบบและเจ้าหน้าที่",
    },
    {
      key: "showCurriculum",
      title: "๓. ระบบทะเบียนนิสิต หลักสูตร และตารางสอน",
      desc: "คู่มือตรวจสอบรายชื่อนิสิต ๕๒๗ รูป/คน จัดการหลักสูตร ๑๓ หลักสูตร และการดึงตารางสอนอัตโนมัติ (Sync Timetable)",
    },
    {
      key: "showAttendance",
      title: "๔. ระบบเช็คชื่อเข้าชั้นเรียน (Smart Attendance & QR Code)",
      desc: "คู่มือการบันทึกเวลาเรียน การเปิดคาบเรียนฉาย Dynamic QR Code ให้นิสิตสแกน และรายงานสถิติสิทธิ์สอบ ๘๐%",
    },
    {
      key: "showMeetings",
      title: "๕. ระบบจองห้องประชุมและขอใช้สถานที่ (Meeting Rooms)",
      desc: "คู่มือตรวจสอบปฏิทินห้องว่าง ยื่นขอจองห้องประชุม การอนุมัติของเจ้าหน้าที่ และหน้าจอฉายผล Smart Projector View",
    },
    {
      key: "showCertificates",
      title: "๖. ระบบคำร้องและขอหนังสือรับรองออนไลน์ (Certificates & Forms)",
      desc: "คู่มือการดาวน์โหลดแบบฟอร์มคำร้องทั่วไป และการติดตามสถานะขอหนังสือรับรองนิสิต/อาจารย์",
    },
    {
      key: "showNews",
      title: "๗. ระบบข่าวสาร ประชาสัมพันธ์ และกิจกรรมคณะ (News & Events)",
      desc: "คู่มือการเผยแพร่ข่าวประชาสัมพันธ์ แนบภาพ/เอกสารประกาศ และปฏิทินกิจกรรมคณะ",
    },
    {
      key: "showSystemSettings",
      title: "๘. ระบบตั้งค่าองค์กร เมนูนำทาง และสิทธิ์ผู้ใช้ (Settings & RBAC)",
      desc: "คู่มือการปรับแต่งหน้าแรก (Hero Section) เมนูนำทาง ข้อมูลติดต่อ สีของระบบ และการกำหนดสิทธิ์ผู้ใช้งาน",
      adminOnlyNote: "เฉพาะผู้ดูแลระบบและเจ้าหน้าที่",
    },
  ];

  return (
    <div className="space-y-6">
      {/* CARD 1: เปิด/ปิด ภาพรวมของหน้าคู่มือ */}
      <LiyonCard>
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-lg font-bold">1. สถานะการเปิดใช้งานศูนย์คู่มือ (Master Toggle)</h2>
              <p className="text-xs text-muted-foreground">
                กำหนดว่าจะเปิดให้บริการหน้าศูนย์คู่มือ (/portal/manual) หรือไม่
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold ${value.enabled ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
              {value.enabled ? "เปิดใช้งานศูนย์คู่มือ" : "ปิดใช้งานศูนย์คู่มือ"}
            </span>
            <LiyonSwitch
              checked={value.enabled}
              onCheckedChange={(checked) => update("enabled", checked)}
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          เมื่อเปิดใช้งาน ผู้เข้าชมจะสามารถเข้าสู่หน้า <strong className="text-foreground">/portal/manual</strong> ได้ และจะแสดงลิงก์คู่มือที่ท้ายเว็บ (Portal Footer) ตามการตั้งค่า
        </p>
      </LiyonCard>

      {/* CARD 2: สวิตช์ เปิด/ปิด แต่ละระบบในคู่มือ */}
      <LiyonCard>
        <div className="border-b pb-3 mb-4 space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">2. เปิด / ปิด การแสดงผลคู่มือรายระบบ</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            สับสวิตช์เป็น <strong>&ldquo;เปิดแสดง&rdquo;</strong> หรือ <strong>&ldquo;ปิดซ่อน&rdquo;</strong> สำหรับแต่ละระบบตามต้องการได้ทันที ระบบจะบันทึกเมื่อกดปุ่มบันทึกด้านล่าง
          </p>
        </div>

        <div className="space-y-3">
          {manualItems.map((item, idx) => {
            const isEnabled = Boolean(value[item.key]);
            return (
              <div
                key={item.key}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isEnabled
                    ? "bg-card border-border shadow-xs"
                    : "bg-muted/30 border-dashed border-muted-foreground/30 opacity-70"
                }`}
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-muted-foreground">#{idx + 1}</span>
                    <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
                    {item.adminOnlyNote && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                        <Lock className="w-2.5 h-2.5" />
                        <span>{item.adminOnlyNote}</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-5">{item.desc}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pl-5 sm:pl-0">
                  <LiyonSwitch
                    checked={isEnabled}
                    onCheckedChange={(checked) => update(item.key, checked)}
                  />
                  <span
                    className={`text-xs font-bold w-16 text-right ${
                      isEnabled
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    {isEnabled ? "เปิดแสดง" : "ปิดซ่อน"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </LiyonCard>
    </div>
  );
}
