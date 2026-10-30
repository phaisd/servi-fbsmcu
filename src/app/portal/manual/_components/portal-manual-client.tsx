"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Users,
  FileText,
  Settings,
  Search,
  ExternalLink,
  CheckCircle2,
  HelpCircle,
  FolderOpen,
  Printer,
  Sparkles,
} from "lucide-react";

interface ManualSection {
  id: string;
  category: "GENERAL" | "ADMIN";
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  steps: {
    title: string;
    description: string;
    bullets?: string[];
    tip?: string;
    path?: string;
  }[];
}

const MANUAL_SECTIONS: ManualSection[] = [
  {
    id: "personnel-search",
    category: "GENERAL",
    title: "๑. การสืบค้นทำเนียบคณาจารย์และบุคลากร",
    desc: "ค้นหาข้อมูลอาจารย์ คัดกรองตามภาควิชา ตรวจสอบประวัติการศึกษา ตารางสอน และผลงานวิจัย",
    icon: Users,
    steps: [
      {
        title: "การเข้าสู่หน้าทำเนียบอาจารย์และบุคลากร",
        description: "ผู้เข้าชมสามารถเข้าถึงหน้าทำเนียบอาจารย์ได้จากแถบเมนูหลักบนเว็บไซต์",
        path: "/portal/personnel",
        bullets: [
          "คลิกเมนู 'บริการออนไลน์' -> เลือก 'คณาจารย์และบุคลากร'",
          "หรือคลิกที่ปุ่มลัด 'ทำเนียบคณาจารย์' บนหน้าแรกของเว็บไซต์",
        ],
      },
      {
        title: "การคัดกรองตามสังกัด / ภาควิชา",
        description: "สามารถเลือกดูรายชื่ออาจารย์เฉพาะกลุ่มได้โดยคลิกแท็บสังกัดด้านบน",
        bullets: [
          "แท็บคณะผู้บริหาร: แสดงเฉพาะผู้บริหารระดับคณะและหัวหน้าภาควิชา",
          "แท็บภาควิชา: ภาควิชาพระพุทธศาสนา, ภาควิชาศาสนาและปรัชญา, ภาควิชาบาลีและสันสกฤต",
          "แท็บอาจารย์พิเศษ และเจ้าหน้าที่สำนักงานคณบดี",
        ],
        tip: "สามารถใช้ช่อง 'ค้นหาชื่ออาจารย์หรือตำแหน่ง...' ทางขวามือเพื่อค้นหาแบบรวดเร็วได้ทันที",
      },
      {
        title: "การดูประวัติอาจารย์ฉบับเต็มและหลักฐานแนบ",
        description: "คลิกที่การ์ดอาจารย์ท่านใดก็ได้ เพื่อเข้าสู่หน้ารายละเอียดประวัติส่วนบุคคล",
        bullets: [
          "แท็บตารางสอน: แสดงรายวิชาที่สอน ระดับ ป.ตรี, ป.โท, ป.เอก พร้อมหน่วยกิตและปีการศึกษา",
          "แท็บผลงานวิจัย: มีปุ่มเลือกดูแบบ 'ตาราง มจร' และ 'การ์ด' พร้อมปุ่มคลิกเปิดเอกสารแนบ (PDF) หรือ (jpg.)",
          "แท็บประวัติการศึกษาและตำแหน่ง: แสดงตารางตำแหน่งทางวิชาการ/บริหาร (ก.) และตำแหน่งกรรมการ (ข.) พร้อมไฟล์คำสั่งแต่งตั้ง",
        ],
      },
    ],
  },
  {
    id: "documents-download",
    category: "GENERAL",
    title: "๒. การดาวน์โหลดแบบฟอร์มและเอกสารคำร้อง",
    desc: "ค้นหาและดาวน์โหลดเอกสารแบบฟอร์มคำร้องการศึกษาและบริการของคณะ",
    icon: FileText,
    steps: [
      {
        title: "การเข้าสู่ศูนย์บริการเอกสาร",
        description: "เข้าสู่หน้ารายการหนังสือคำร้องและแบบฟอร์มต่างๆ",
        path: "/portal/documents",
        bullets: [
          "คลิกเมนู 'รายการหนังสือคำร้อง' บนแถบนำทางด้านบน",
          "สามารถเลือกดูตามหมวดหมู่ เช่น แบบฟอร์มงานทะเบียน, คำร้องทั่วไป, แบบฟอร์มวิจัย",
        ],
      },
      {
        title: "การดาวน์โหลดไฟล์เอกสาร",
        description: "คลิกปุ่ม 'ดาวน์โหลด (PDF/DOCX)' เพื่อบันทึกไฟล์ลงในเครื่องหรือเปิดพิมพ์ได้ทันที",
      },
    ],
  },
  {
    id: "admin-personnel",
    category: "ADMIN",
    title: "๓. การจัดการข้อมูลอาจารย์ / คำสั่งแต่งตั้ง / วิจัย",
    desc: "คู่มือสำหรับแอดมิน: เพิ่มแก้ไขข้อมูลอาจารย์ อัปโหลดคำสั่งแต่งตั้ง และผลงานวิจัย",
    icon: FolderOpen,
    steps: [
      {
        title: "การเข้าสู่ระบบจัดการบุคลากร (Admin Console)",
        description: "เข้าสู่ระบบด้วยบัญชีแอดมิน/เจ้าหน้าที่ที่มีสิทธิ์",
        path: "/personnel",
        bullets: [
          "เข้าสู่หน้า /personnel หรือคลิกเมนู 'ทำเนียบบุคลากร' บนแถบด้านซ้ายของ Admin Console",
          "จะเห็นรายชื่ออาจารย์ทั้งหมด พร้อมปุ่ม 'เพิ่มอาจารย์ / บุคลากร' ด้านบนขวา",
        ],
      },
      {
        title: "การเปิด/ปิด ปุ่ม 'ทุกสังกัด' บนหน้า Portal",
        description: "กำหนดว่าจะให้ผู้เข้าชมหน้า Portal เห็นปุ่ม 'ทุกสังกัด' หรือไม่",
        bullets: [
          "บนแถบสีฟ้าด้านบน: 'การแสดงปุ่ม ทุกสังกัด ในแถบตัวกรองหน้า Portal'",
          "คลิก [✓ เปิดแสดง]: หน้า Portal จะแสดงปุ่มทุกสังกัดเป็นปุ่มแรก",
          "คลิก [✕ ปิดการแสดง]: หน้า Portal จะซ่อนปุ่มทุกสังกัด และเริ่มต้นที่แท็บผู้บริหารให้อัตโนมัติ",
        ],
        tip: "ระบบจะบันทึกการตั้งค่าทันทีที่คลิก โดยไม่ต้องกดปุ่มบันทึกเพิ่มเติม",
      },
      {
        title: "การเพิ่มและแนบไฟล์คำสั่งแต่งตั้ง (PDF/JPG)",
        description: "การระบุตำแหน่งทางวิชาการ/บริหาร หรือกรรมการ พร้อมหลักฐานคำสั่งแต่งตั้ง",
        bullets: [
          "คลิกไอคอน 'แก้ไข (รูปดินสอ)' ที่อาจารย์ท่านที่ต้องการ",
          "ไปที่แท็บ 'ตำแหน่ง & คำสั่งแต่งตั้ง' (แท็บที่ 2)",
          "คลิก '+ เพิ่มตำแหน่ง / คำสั่งแต่งตั้ง'",
          "เลือกประเภท: 'ก. ตำแหน่งทางวิชาการ/บริหาร' หรือ 'ข. ตำแหน่งกรรมการ'",
          "กรอกชื่อตำแหน่ง เลขที่คำสั่งแต่งตั้ง และปี พ.ศ.",
          "คลิกปุ่ม 'อัปโหลดไฟล์คำสั่ง (PDF/JPG)' เพื่อเลือกไฟล์หลักฐาน (ขนาดไม่เกิน 15MB)",
          "กด 'บันทึกตำแหน่งนี้' และกด 'บันทึกการแก้ไข' ด้านล่าง",
        ],
      },
      {
        title: "การเพิ่มผลงานวิจัยและแนบไฟล์วิจัย",
        description: "เพิ่มบทความวิจัย สิ่งตีพิมพ์ พร้อมไฟล์เอกสารฉบับเต็ม",
        bullets: [
          "ในหน้าต่างแก้ไขอาจารย์ ไปที่แท็บ 'ผลงานวิจัย'",
          "คลิกปุ่ม '+ เพิ่มผลงานวิจัยให้อาจารย์'",
          "กรอกชื่อเรื่องบทความวิจัย ชื่อวารสาร ปี พ.ศ. และระดับ TCI",
          "คลิก 'อัปโหลดไฟล์ (PDF/JPG)' เพื่อแนบไฟล์รายงานวิจัยหรือบทความ",
          "กด 'บันทึกผลงานวิจัย'",
        ],
      },
    ],
  },
  {
    id: "admin-settings",
    category: "ADMIN",
    title: "๔. การตั้งค่าระบบองค์กรและแถบเมนูเว็บไซต์",
    desc: "การปรับแต่งหน้าแรก โลโก้ ข้อมูลติดต่อ และการเปิด/ปิดเมนูนำทาง",
    icon: Settings,
    steps: [
      {
        title: "การเข้าสู่หน้าตั้งค่าองค์กร (Tenant Settings)",
        description: "เข้าสู่หน้าตั้งค่าหลักของระบบ",
        path: "/settings",
        bullets: [
          "คลิกเมนู 'ตั้งค่าองค์กร' ที่แถบเมนูด้านซ้ายล่างของระบบ Admin",
          "หน้าต่างตั้งค่าประกอบด้วยแท็บต่างๆ จัดเรียงแบบหลายแถว (Pill Tabs) อ่านง่าย",
        ],
      },
      {
        title: "การเปิด/ปิด หรือแก้ไขเมนูนำทางด้านบน (Navbar)",
        description: "จัดการเมนูด้านบน เช่น ซ่อนหรือแสดงเมนู 'ทำเนียบผู้บริหาร'",
        bullets: [
          "ไปที่แท็บ 'ปรับแต่ง Hero Section'",
          "เลื่อนลงมาที่หมวด '4. แถบนำทางด้านบน (Header Navigation)'",
          "คลิกที่ไอคอนรูปดวงตา (👁) ที่เมนู 'ทำเนียบผู้บริหาร' เพื่อปิด/ซ่อนเมนู (จะกลายเป็นดวงตาขีดฆ่า)",
          "หรือคลิกรูปถังขยะ (🗑) เพื่อลบเมนูออกถาวร",
          "เลื่อนลงล่างสุดแล้วกดปุ่ม 'บันทึกการตั้งค่า' สีน้ำเงิน",
        ],
      },
      {
        title: "การแก้ไขข้อมูลการติดต่อและท้ายเว็บ (Footer)",
        description: "ปรับปรุงเบอร์โทรศัพท์ อีเมล ที่อยู่ และเมนูลัดท้ายเว็บ",
        bullets: [
          "ไปที่แท็บ 'ท้ายเว็บ (Portal Footer)'",
          "แก้ไขเบอร์โทรศัพท์ อีเมล ที่อยู่ของคณะ และลิงก์ระบบสารสนเทศ",
          "กดปุ่ม 'บันทึกการตั้งค่า'",
        ],
      },
    ],
  },
];

export function PortalManualClient() {
  const [selectedSectionId, setSelectedSectionId] = useState<string>("personnel-search");
  const [searchQuery, setSearchQuery] = useState("");

  const activeSection = MANUAL_SECTIONS.find((s) => s.id === selectedSectionId) || MANUAL_SECTIONS[0];

  const filteredSections = MANUAL_SECTIONS.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      s.title.toLowerCase().includes(q) ||
      s.desc.toLowerCase().includes(q) ||
      s.steps.some(
        (st) =>
          st.title.toLowerCase().includes(q) ||
          st.description.toLowerCase().includes(q) ||
          st.bullets?.some((b) => b.toLowerCase().includes(q))
      )
    );
  });

  return (
    <div className="space-y-8">
      {/* Search Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/10 via-amber-500/10 to-primary/5 border border-primary/20 p-6 sm:p-10 shadow-xs">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ศูนย์ช่วยเหลือ & คู่มือการใช้งานระบบ</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            คู่มือการใช้งานระบบสารสนเทศและเว็บไซต์ คณะพุทธศาสตร์
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            แหล่งรวบรวมวิธีใช้งานระบบ ขั้นตอนการสืบค้นข้อมูล การแนบไฟล์คำสั่งแต่งตั้งอาจารย์ การจัดการผลงานวิจัย และการตั้งค่าระบบสำหรับเจ้าหน้าที่และผู้ใช้งานทั่วไป
          </p>

          {/* Search Box */}
          <div className="pt-2 relative max-w-xl">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="ค้นหาขั้นตอนการใช้งาน (เช่น อัปโหลดคำสั่ง, ผลงานวิจัย, ซ่อนสังกัด, ปรับเมนู)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border bg-background shadow-xs text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Sidebar Menu + Detail Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar Menu */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-2 sticky top-24">
            <div className="flex items-center justify-between pb-2 border-b">
              <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-primary" />
                <span>หมวดหมู่คู่มือ</span>
              </span>
              <span className="text-xs text-muted-foreground font-semibold">
                {filteredSections.length} หมวด
              </span>
            </div>

            <div className="space-y-1 pt-1">
              {filteredSections.map((sec) => {
                const Icon = sec.icon;
                const isSelected = sec.id === activeSection.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setSelectedSectionId(sec.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-sm font-bold"
                        : "hover:bg-muted/60 text-foreground"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs sm:text-sm font-semibold truncate leading-tight">
                          {sec.title}
                        </h4>
                      </div>
                      <span
                        className={`inline-block mt-1 text-[10px] px-2 py-0.2 rounded-full font-semibold ${
                          sec.category === "ADMIN"
                            ? isSelected
                              ? "bg-amber-400 text-stone-900"
                              : "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/20"
                            : isSelected
                            ? "bg-white/20 text-white"
                            : "bg-blue-500/10 text-blue-700 dark:text-blue-300"
                        }`}
                      >
                        {sec.category === "ADMIN" ? "สำหรับผู้ดูแลระบบ (Admin)" : "สำหรับผู้ใช้งานทั่วไป"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t text-[11px] text-muted-foreground space-y-1">
              <p className="flex items-center gap-1.5 font-medium">
                <HelpCircle className="w-3.5 h-3.5 text-primary" />
                <span>ต้องการความช่วยเหลือเพิ่มเติม?</span>
              </p>
              <p>ติดต่อสำนักงานคณบดีคณะพุทธศาสตร์ มจร โทร. 035-248-000 ต่อ 8100</p>
            </div>
          </div>
        </div>

        {/* Right Detail Steps */}
        <div className="lg:col-span-8 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl border bg-card shadow-xs space-y-6">
            {/* Section Header */}
            <div className="border-b pb-4 space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    activeSection.category === "ADMIN"
                      ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30"
                      : "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20"
                  }`}
                >
                  {activeSection.category === "ADMIN"
                    ? "สำหรับผู้ดูแลระบบ (Admin Console)"
                    : "สำหรับผู้ใช้งานทั่วไป (Public Portal)"}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-foreground">
                {activeSection.title}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {activeSection.desc}
              </p>
            </div>

            {/* Steps Container */}
            <div className="space-y-6">
              {activeSection.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl border bg-muted/20 hover:bg-muted/30 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                        {idx + 1}
                      </span>
                      <h4 className="text-sm sm:text-base font-bold text-foreground">
                        {step.title}
                      </h4>
                    </div>

                    {step.path && (
                      <Link
                        href={step.path}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors cursor-pointer"
                      >
                        <span>เปิดหน้านี้ในระบบ ({step.path})</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-8">
                    {step.description}
                  </p>

                  {step.bullets && step.bullets.length > 0 && (
                    <div className="pl-8 space-y-1.5 pt-1">
                      {step.bullets.map((b, bIdx) => (
                        <div key={bIdx} className="flex items-start gap-2 text-xs text-foreground font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          <span className="leading-relaxed">{b}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {step.tip && (
                    <div className="ml-8 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                      <span>
                        <strong>คำแนะนำ: </strong>
                        {step.tip}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Quick Actions Footer */}
            <div className="pt-4 border-t flex flex-wrap items-center justify-between gap-4 text-xs">
              <span className="text-muted-foreground">
                อัปเดตล่าสุด: ตุลาคม ๒๕๖๙ | คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
              </span>
              <button
                type="button"
                onClick={() => typeof window !== "undefined" && window.print()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border bg-background hover:bg-muted text-foreground font-semibold cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>พิมพ์คู่มือหน้านี้</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
