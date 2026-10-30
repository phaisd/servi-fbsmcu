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
  GraduationCap,
  Clock,
  Building2,
  Calendar,
  Newspaper,
  ShieldCheck,
  LayoutDashboard,
  Award,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAppSession } from "@/hooks/use-session";
import type { ManualSettings } from "@/features/identity";
import { DEFAULT_MANUAL_SETTINGS } from "@/features/identity";

interface ManualSection {
  id: string;
  category: "PORTAL" | "ACADEMIC" | "ADMINISTRATION" | "SYSTEM";
  categoryLabel: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled?: boolean; // ปิดการแสดงผลคู่มือนี้ (fallback)
  adminOnly?: boolean; // แสดงเฉพาะแอดมิน (true = เฉพาะแอดมิน, false = ทุกคนเห็น)
  steps: {
    title: string;
    description: string;
    bullets?: string[];
    tip?: string;
    path?: string;
  }[];
}

const MANUAL_SECTIONS: ManualSection[] = [
  // ── ระบบทำเนียบคณาจารย์และผู้บริหาร ──
  {
    id: "personnel-search",
    category: "PORTAL",
    categoryLabel: "หน้าเว็บสาธารณะ & ทำเนียบ",
    title: "ระบบทำเนียบคณาจารย์ บุคลากร และผู้บริหาร",
    desc: "การค้นหาข้อมูลอาจารย์ คัดกรองตามภาควิชา ตรวจสอบตารางสอน งานวิจัย และเปิดดูไฟล์คำสั่งแต่งตั้ง (PDF/JPG)",
    icon: Users,
    steps: [
      {
        title: "การเข้าสู่หน้าทำเนียบคณาจารย์และบุคลากร",
        description: "ผู้เข้าชมสามารถเข้าถึงทำเนียบอาจารย์และผู้บริหารได้จากหน้าพอร์ทัลหลัก",
        path: "/portal/personnel",
        bullets: [
          "เข้าผ่าน URL: /portal/personnel",
          "เลือกดูแท็บสังกัด: คณะผู้บริหาร, ภาควิชาพระพุทธศาสนา, ภาควิชาศาสนาและปรัชญา, ภาควิชาบาลีและสันสกฤต, อาจารย์พิเศษ, และเจ้าหน้าที่สำนักงานคณบดี",
          "ใช้ช่องค้นหาชื่ออาจารย์ รหัส หรือตำแหน่งงานเพื่อกรองรายชื่อทันที",
        ],
      },
      {
        title: "การดูประวัติอาจารย์ ตารางสอน และผลงานวิจัยฉบับเต็ม",
        description: "คลิกการ์ดอาจารย์ท่านใดก็ได้ เพื่อเข้าสู่หน้ารายละเอียด (/portal/personnel/[id])",
        bullets: [
          "แท็บที่ ๑ (ตารางสอน): แสดงรายวิชาที่สอน ระดับ ป.ตรี, ป.โท, ป.เอก พร้อมหน่วยกิตและปีการศึกษา",
          "แท็บที่ ๒ (ผลงานวิจัย): เลือกดูได้ทั้งแบบ 'ตาราง มจร' (เรียงลำดับ ๑.๑, ๑.๒) และแบบ 'การ์ด' พร้อมปุ่มเปิดดูเอกสารแนบ (PDF) หรือ (jpg.)",
          "แท็บที่ ๓ (ตำแหน่งและประวัติการศึกษา): แสดงตารางตำแหน่งทางวิชาการ/บริหาร (ข้อ ก.) และตำแหน่งกรรมการ (ข้อ ข.) พร้อมปุ่มกดดูเอกสารคำสั่งแต่งตั้งฉบับเต็ม",
        ],
      },
      {
        title: "การดูโครงสร้างผู้บริหารคณะเฉพาะ",
        description: "เข้าสู่หน้าทำเนียบผู้บริหารระดับคณะและหัวหน้าภาควิชา",
        path: "/portal/executives",
        bullets: [
          "แสดงแผนผังโครงสร้างผู้บริหาร คณบดี รองคณบดี ผู้ช่วยคณบดี และหัวหน้าภาควิชาอย่างเป็นระเบียบ",
        ],
      },
    ],
  },

  // ── ระบบจัดการข้อมูลอาจารย์ คำสั่งแต่งตั้ง และงานวิจัย (สำหรับ Admin) ──
  {
    id: "admin-personnel",
    category: "ACADEMIC",
    categoryLabel: "ระบบบริหารจัดการบุคคล",
    title: "ระบบจัดการข้อมูลอาจารย์ คำสั่งแต่งตั้ง และงานวิจัย (Admin)",
    desc: "สำหรับเจ้าหน้าที่/แอดมิน: เพิ่มแก้ไขข้อมูลอาจารย์ อัปโหลดคำสั่งแต่งตั้ง (PDF/JPG) เพิ่มผลงานวิจัย และตั้งค่าหน้า Portal",
    icon: FolderOpen,
    adminOnly: true,
    steps: [
      {
        title: "การเข้าสู่ระบบจัดการบุคลากร (Admin Console)",
        description: "ล็อกอินเข้าสู่ระบบด้วยบัญชีแอดมิน/เจ้าหน้าที่",
        path: "/personnel",
        bullets: [
          "เข้าสู่หน้า /personnel จะพบรายชื่ออาจารย์ทั้งหมด ๘๗ ท่าน พร้อมตัวกรองสายงานและภาควิชา",
          "ปุ่ม 'เพิ่มอาจารย์ / บุคลากร' (ด้านบนขวา) สำหรับสร้างข้อมูลอาจารย์ใหม่",
          "ปุ่ม 'สลับตำแหน่งผู้บริหาร' สำหรับแต่งตั้งหรือปรับเปลี่ยนตำแหน่งบริหาร",
        ],
      },
      {
        title: "การตั้งค่าเปิด/ปิด ปุ่ม 'ทุกสังกัด' บนหน้า Portal",
        description: "แถบควบคุมสีฟ้าด้านบน 'การแสดงปุ่ม ทุกสังกัด ในแถบตัวกรองหน้า Portal'",
        bullets: [
          "คลิก [✓ เปิดแสดง]: หน้า Portal จะมีปุ่ม 'ทุกสังกัด' ให้ผู้เข้าชมเลือกดูอาจารย์ทุกคนพร้อมกัน",
          "คลิก [✕ ปิดการแสดง]: หน้า Portal จะซ่อนปุ่มทุกสังกัด และเริ่มต้นที่แท็บ 'คณะผู้บริหาร' ให้อัตโนมัติ",
        ],
        tip: "ระบบจะบันทึกการตั้งค่าทันทีที่คลิก โดยไม่ต้องกดปุ่มบันทึกเพิ่มเติม",
      },
      {
        title: "การเพิ่มและแนบไฟล์คำสั่งแต่งตั้ง (ก. วิชาการ/บริหาร และ ข. กรรมการ)",
        description: "ระบุตำแหน่งตามแบบฟอร์ม มจร พร้อมไฟล์หลักฐานคำสั่งแต่งตั้ง",
        bullets: [
          "คลิกไอคอน 'แก้ไข (รูปดินสอ)' ที่อาจารย์ท่านที่ต้องการแก้ไข",
          "ไปที่แท็บ 'ตำแหน่ง & คำสั่งแต่งตั้ง' (แท็บที่ ๒)",
          "คลิก '+ เพิ่มตำแหน่ง / คำสั่งแต่งตั้ง'",
          "เลือกหมวดหมู่: 'ก. ตำแหน่งทางวิชาการ/บริหาร' หรือ 'ข. ตำแหน่งกรรมการ'",
          "กรอกชื่อตำแหน่ง เลขที่คำสั่งแต่งตั้ง และปี พ.ศ.",
          "คลิกปุ่ม 'อัปโหลดไฟล์คำสั่ง (PDF/JPG)' เลือกไฟล์ (ขนาดสูงสุด 15MB) ระบบจะจัดเก็บในโฟลเดอร์ appointments ให้อัตโนมัติ",
          "กด 'บันทึกตำแหน่งนี้' และกด 'บันทึกการแก้ไข' ด้านล่าง",
        ],
      },
      {
        title: "การเพิ่มผลงานวิจัยและแนบไฟล์รายงานวิจัย",
        description: "เพิ่มบทความวิจัย สิ่งตีพิมพ์ และหนังสือ",
        bullets: [
          "ในหน้าต่างแก้ไขอาจารย์ ไปที่แท็บ 'ผลงานวิจัย'",
          "คลิกปุ่ม '+ เพิ่มผลงานวิจัยให้อาจารย์'",
          "กรอกชื่อเรื่องบทความวิจัย ชื่อวารสาร ปี พ.ศ. และระดับ TCI (ถ้ามี)",
          "คลิก 'อัปโหลดไฟล์ (PDF/JPG)' เพื่อแนบไฟล์รายงานวิจัยฉบับเต็ม",
          "กด 'บันทึกผลงานวิจัย'",
        ],
      },
    ],
  },

  // ── ระบบทะเบียนนิสิตและตารางสอน ──
  {
    id: "students-and-curriculum",
    category: "ACADEMIC",
    categoryLabel: "งานบริการการศึกษา",
    title: "ระบบทะเบียนนิสิต หลักสูตร และตารางสอน",
    desc: "การตรวจสอบรายชื่อนิสิต ๕๒๗ รูป/คน จัดการหลักสูตร ๑๓ หลักสูตร และตารางสอนรายภาคการศึกษา",
    icon: GraduationCap,
    steps: [
      {
        title: "การจัดการทะเบียนนิสิต (Students Management)",
        description: "ตรวจสอบรายชื่อนิสิต ข้อมูลการศึกษา และประวัติการลงทะเบียน",
        path: "/students",
        bullets: [
          "เข้าที่หน้า /students เพื่อดูรายชื่อนิสิตทั้งหมด ๕๒๗ รูป/คน",
          "ค้นหาด้วยรหัสนิสิต ชื่อ-นามสกุล หรือระดับการศึกษา (พธ.บ. / พธ.ม. / พธ.ด.)",
          "สามารถนำเข้าข้อมูลนิสิตผ่านไฟล์ CSV / Excel ได้",
        ],
      },
      {
        title: "การจัดการหลักสูตรและรายวิชา (Curriculum & Courses)",
        description: "โครงสร้างหลักสูตรและรายวิชาที่เปิดสอนในคณะพุทธศาสตร์",
        path: "/curriculum",
        bullets: [
          "เข้าที่หน้า /curriculum เพื่อดูหลักสูตรทั้งหมด ๑๓ หลักสูตร",
          "เข้าที่หน้า /curriculum/courses เพื่อดูรายวิชาทั้งหมด ๒๑๓ วิชา พร้อมหน่วยกิตและคำอธิบายรายวิชา",
          "เข้าที่หน้า /curriculum/timetables เพื่อจัดตารางสอนและกำหนดห้องเรียน",
        ],
      },
      {
        title: "การดึงตารางสอนเข้าสู่อาจารย์ผู้สอนอัตโนมัติ (Sync Timetable)",
        description: "ในหน้าแก้ไขอาจารย์ (/personnel) มีปุ่ม 'ดึงรายวิชาจากตารางสอนล่าสุด'",
        bullets: [
          "ระบบจะค้นหาชื่ออาจารย์ในตารางสอน ภาคการศึกษา ๑/๒๕๖๙",
          "ดึงรายวิชาที่อาจารย์มีชื่อสอน เข้าสู่ตารางสอนของอาจารย์ให้อัตโนมัติโดยไม่ต้องพิมพ์เอง",
        ],
      },
    ],
  },

  // ── ระบบเช็คชื่อเข้าชั้นเรียนและการมาเรียน ──
  {
    id: "attendance-system",
    category: "ACADEMIC",
    categoryLabel: "งานบริการการศึกษา",
    title: "ระบบเช็คชื่อเข้าชั้นเรียน (Smart Attendance & QR Code)",
    desc: "การบันทึกเวลาเรียน การสแกน QR Code เข้าเรียน การส่งใบลา และรายงานสถิติการเข้าเรียน",
    icon: Clock,
    steps: [
      {
        title: "หน้าแดชบอร์ดการเข้าเรียน (Attendance Dashboard)",
        description: "ภาพรวมสถิติการเข้าชั้นเรียนของแต่ละรายวิชา",
        path: "/attendance",
        bullets: [
          "เข้าที่หน้า /attendance เพื่อดูสถิติการมาเรียน มาสาย ลา และขาดเรียน",
          "ดูรายงานความเสี่ยง (Warning) สำหรับนิสิตที่มีเวลาเรียนไม่ถึง ๘๐% ของเกณฑ์สิทธิ์สอบ",
        ],
      },
      {
        title: "การเปิดคาบเรียนและสร้าง QR Code เช็คชื่อ",
        description: "อาจารย์ผู้สอนสามารถเปิดคาบเรียนและฉาย QR Code ให้นิสิตสแกน",
        path: "/attendance/classes",
        bullets: [
          "เลือกรายวิชาที่กำลังสอน แล้วกด 'เปิดคาบเรียนใหม่'",
          "ระบบจะสร้างรหัส QR Code แบบ Dynamic ที่เปลี่ยนอัตโนมัติเพื่อป้องกันการส่งต่อ",
          "นิสิตสามารถใช้มือถือสแกนเพื่อเช็คชื่อเข้าเรียนได้ทันที",
          "อาจารย์สามารถแก้ไขสถานะ (มา / สาย / ลา / ขาด) แบบ Manual รายรูป/คนได้",
        ],
      },
    ],
  },

  // ── ระบบจองห้องประชุมและขอใช้สถานที่ ──
  {
    id: "meeting-rooms",
    category: "ADMINISTRATION",
    categoryLabel: "งานบริหารทั่วไป",
    title: "ระบบจองห้องประชุมและขอใช้สถานที่ (Meeting Rooms)",
    desc: "การตรวจสอบปฏิทินห้องว่าง ยื่นคำขอจองห้องประชุม อนุมัติการใช้งาน และฉายหน้าจอ Projector Display",
    icon: Building2,
    steps: [
      {
        title: "การตรวจสอบตารางการใช้ห้องประชุมและยื่นขอจอง",
        description: "ดูปฏิทินการใช้ห้องประชุมของคณะพุทธศาสตร์",
        path: "/meetings/bookings",
        bullets: [
          "เข้าที่หน้า /meetings/bookings เพื่อดูตารางการใช้ห้องประชุมในแต่ละวัน",
          "คลิกปุ่ม 'จองห้องประชุม' เพื่อกรอกชื่อการประชุม วันที่ เวลา และจำนวนผู้เข้าร่วม",
          "เลือกห้องประชุม เช่น ห้องประชุมคณบดี, ห้องประชุมภาควิชา, หรือห้องประชุมสัมมนา",
        ],
      },
      {
        title: "การจัดการห้องประชุมและอุปกรณ์ (สำหรับเจ้าหน้าที่)",
        description: "กำหนดข้อมูลห้อง ความจุ อุปกรณ์โสตทัศนูปกรณ์",
        path: "/meetings/rooms",
        bullets: [
          "เพิ่ม แก้ไข หรือปิดปรับปรุงห้องประชุม",
          "ตรวจสอบคำขอจองและกด 'อนุมัติ (Approve)' หรือ 'ปฏิเสธ (Reject)' พร้อมระบุเหตุผล",
        ],
      },
      {
        title: "หน้าจอแสดงผลหน้าห้องประชุม (Smart Projector View)",
        description: "เปิดแสดงสถานะห้องประชุมบนจอ TV หน้าห้อง",
        bullets: [
          "ระบบมีหน้า Projector Display แสดงหัวข้อประชุม ผู้จอง และเวลาประชุมแบบเรียลไทม์",
        ],
      },
    ],
  },

  // ── ระบบคำร้องและหนังสือรับรองออนไลน์ ──
  {
    id: "certificates-and-documents",
    category: "ADMINISTRATION",
    categoryLabel: "งานบริหารทั่วไป",
    title: "ระบบคำร้องและขอหนังสือรับรองออนไลน์ (Certificates & Forms)",
    desc: "การขอใบรับรองการเป็นนิสิต/อาจารย์ การตรวจสอบสถานะคำร้อง และศูนย์ดาวน์โหลดแบบฟอร์ม",
    icon: FileText,
    steps: [
      {
        title: "ศูนย์ดาวน์โหลดแบบฟอร์มคำร้องสาธารณะ",
        description: "ผู้ใช้งานทั่วไปและนิสิตสามารถดาวน์โหลดเอกสารแบบฟอร์มได้โดยตรง",
        path: "/portal/documents",
        bullets: [
          "เข้าสู่หน้า /portal/documents",
          "ค้นหาแบบฟอร์ม เช่น คำร้องขอลงทะเบียนล่าช้า, คำร้องขอลาพักการเรียน, แบบฟอร์มขอสอบดุษฎีนิพนธ์",
          "กดปุ่ม 'ดาวน์โหลด (PDF/DOCX)' เพื่อพิมพ์ใช้งานได้ทันที",
        ],
      },
      {
        title: "ระบบจัดการคำขอหนังสือรับรอง (Admin Console)",
        description: "เจ้าหน้าที่ตรวจสอบและออกหนังสือรับรอง",
        path: "/certificates",
        bullets: [
          "เข้าสู่หน้า /certificates เพื่อดูรายการคำขอหนังสือรับรองที่ส่งเข้ามา",
          "อัปเดตสถานะ: รอดำเนินการ, กำลังจัดทำ, อนุมัติเรียบร้อย, พร้อมรับเอกสาร",
          "หน้า /certificates/types สำหรับกำหนดประเภทหนังสือรับรองและค่าธรรมเนียม (ถ้ามี)",
        ],
      },
    ],
  },

  // ── ระบบข่าวสาร ประชาสัมพันธ์ และปฏิทินกิจกรรม ──
  {
    id: "news-and-events",
    category: "ADMINISTRATION",
    categoryLabel: "งานสื่อสารองค์กร",
    title: "ระบบข่าวสาร ประชาสัมพันธ์ และกิจกรรมคณะ (News & Events)",
    desc: "การเผยแพร่ข่าวประชาสัมพันธ์ ข่าวกิจกรรมวิชาการ การแนบภาพ/เอกสาร และปฏิทินกิจกรรม",
    icon: Newspaper,
    steps: [
      {
        title: "การเผยแพร่ข่าวสารและกิจกรรม (News Management)",
        description: "เจ้าหน้าที่ประชาสัมพันธ์สร้างและเผยแพร่ข่าว",
        path: "/news",
        bullets: [
          "เข้าสู่หน้า /news เพื่อจัดการบทความข่าวสารทั้งหมด",
          "คลิก 'สร้างข่าวใหม่' ใส่หัวข้อ เนื้อหาข่าว ภาพหน้าปก และเอกสารแนบ",
          "กำหนดสถานะการเผยแพร่ (ฉบับร่าง หรือ เผยแพร่ทันที)",
          "ข่าวที่เผยแพร่จะไปปรากฏที่หน้าแรก (/) และหน้าศูนย์ข่าวสาร (/portal/news)",
        ],
      },
      {
        title: "การจัดการปฏิทินกิจกรรมคณะ (Events Management)",
        description: "กำหนดการสัมมนา ปฏิบัติธรรม และงานประชุมวิชาการ",
        path: "/events",
        bullets: [
          "เข้าสู่หน้า /events เพื่อสร้างกิจกรรมใหม่ พร้อมกำหนดวัน-เวลา และสถานที่",
          "เปิดรับลงทะเบียนเข้าร่วมกิจกรรมผ่านหน้าเว็บไซต์ได้",
        ],
      },
    ],
  },

  // ── ระบบตั้งค่าองค์กรและสิทธิ์ผู้ใช้งาน ──
  {
    id: "admin-settings",
    category: "SYSTEM",
    categoryLabel: "การจัดการระบบและความปลอดภัย",
    title: "ระบบตั้งค่าองค์กร เมนูนำทาง และสิทธิ์ผู้ใช้ (Settings & RBAC)",
    desc: "การปรับแต่งหน้าแรก (Hero Section) เมนูนำทาง ข้อมูลติดต่อ สีของระบบ และการกำหนดสิทธิ์ผู้ใช้งาน",
    icon: Settings,
    adminOnly: true,
    steps: [
      {
        title: "การตั้งค่าองค์กรและหน้าแรก (Tenant Settings)",
        description: "ปรับปรุงข้อมูลส่วนหัว โลโก้ และเนื้อหาหน้าแรก",
        path: "/settings",
        bullets: [
          "เข้าที่หน้า /settings เมนูถูกจัดเป็นแท็บหลายแถว (Pill Tabs) เลือกง่าย",
          "แท็บ 'ข้อมูลองค์กร & แบรนด์': เปลี่ยนชื่อคณะ โลโก้ และชุดสีของเว็บไซต์ (Palette)",
          "แท็บ 'ปรับแต่ง Hero Section': ปรับเปลี่ยนภาพพื้นหลัง สไตล์เลย์เอาต์ และหัวข้อหน้าแรก",
          "แท็บ 'ท้ายเว็บ (Portal Footer)': แก้ไขที่อยู่ เบอร์โทรศัพท์ อีเมล และเมนูลัด",
        ],
      },
      {
        title: "การเปิด/ปิด หรือแก้ไขเมนูนำทางด้านบน (Navbar Header)",
        description: "ซ่อน แสดง หรือลบเมนูนำทาง เช่น เมนูทำเนียบผู้บริหาร",
        bullets: [
          "ในหน้า /settings -> ไปที่แท็บ 'ปรับแต่ง Hero Section'",
          "เลื่อนลงมาที่หมวด '4. แถบนำทางด้านบน (Header Navigation)'",
          "คลิกรูปดวงตา (👁) ที่เมนู 'ทำเนียบผู้บริหาร' เพื่อซ่อนเมนู (จะกลายเป็นดวงตาขีดฆ่า)",
          "หรือคลิกรูปถังขยะ (🗑) เพื่อลบเมนูออก",
          "เลื่อนลงล่างสุดแล้วกดปุ่ม 'บันทึกการตั้งค่า' สีน้ำเงิน",
        ],
      },
      {
        title: "การจัดการบัญชีผู้ใช้และกำหนดสิทธิ์ (Users & Roles)",
        description: "เพิ่ม ลบ หรือระงับการใช้งานบัญชีผู้ดูแลระบบและเจ้าหน้าที่",
        path: "/users",
        bullets: [
          "เข้าสู่หน้า /users เพื่อดูบัญชีผู้ใช้งานทั้งหมดในระบบ",
          "สามารถระงับการใช้งาน (Deactivate) หรือลบบัญชีผู้ใช้ที่ไม่ได้ใช้งานแล้วได้",
          "เข้าสู่หน้า /users/roles เพื่อกำหนดบทบาท (Super Admin, Academic Staff, Viewer) และสิทธิ์การเข้าถึงแต่ละโมดูล",
        ],
      },
      {
        title: "การตรวจสอบบันทึกความปลอดภัย (Audit Logs)",
        description: "ตรวจสอบประวัติการแก้ไขข้อมูลและการล็อกอินของเจ้าหน้าที่",
        path: "/audit-logs",
        bullets: [
          "เก็บบันทึกประวัติการกระทำสำคัญ เช่น การเพิ่ม/ลบอาจารย์ การแก้ไขเกรด/เวลาเรียน เพื่อความโปร่งใสและตรวจสอบได้",
        ],
      },
    ],
  },
];

interface PortalManualClientProps {
  manualSettings?: ManualSettings;
}

export function PortalManualClient({
  manualSettings = DEFAULT_MANUAL_SETTINGS,
}: PortalManualClientProps) {
  const { isAuthenticated, isSuperAdmin, roles } = useAppSession();
  const isAdminUser = isAuthenticated && (isSuperAdmin || roles.some((r) => r.code === "SUPER_ADMIN" || r.code === "ADMIN"));

  const [selectedSectionId, setSelectedSectionId] = useState<string>("personnel-search");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [adminOnlyFilter, setAdminOnlyFilter] = useState<"ALL" | "GENERAL" | "ADMIN">("ALL");

  // ตรวจสอบสถานะเปิด/ปิดของแต่ละระบบตามการตั้งค่าในหน้า /settings
  const isSectionEnabled = (id: string): boolean => {
    if (!manualSettings.enabled) return false;
    switch (id) {
      case "personnel-search":
        return manualSettings.showPersonnel ?? false;
      case "admin-personnel":
        return manualSettings.showPersonnelAdmin ?? true;
      case "students-and-curriculum":
        return manualSettings.showCurriculum ?? true;
      case "attendance-system":
        return manualSettings.showAttendance ?? true;
      case "meeting-rooms":
        return manualSettings.showMeetings ?? true;
      case "certificates-and-documents":
        return manualSettings.showCertificates ?? true;
      case "news-and-events":
        return manualSettings.showNews ?? false;
      case "admin-settings":
        return manualSettings.showSystemSettings ?? true;
      default:
        return true;
    }
  };

  // กรองเฉพาะคู่มือที่อนุญาตให้ผู้ใช้ปัจจุบันเห็น
  const accessibleSections = MANUAL_SECTIONS.filter((s) => {
    if (s.enabled === false) return false;
    if (!isSectionEnabled(s.id)) return false;
    if (s.adminOnly && !isAdminUser) return false;
    return true;
  });

  const activeSection =
    accessibleSections.find((s) => s.id === selectedSectionId) || accessibleSections[0];

  const filteredSections = accessibleSections.filter((s) => {
    const matchesCat = selectedCategory === "ALL" || s.category === selectedCategory;
    const matchesAdminFilter =
      adminOnlyFilter === "ALL" ||
      (adminOnlyFilter === "ADMIN" && s.adminOnly) ||
      (adminOnlyFilter === "GENERAL" && !s.adminOnly);

    if (!searchQuery.trim()) return matchesCat && matchesAdminFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      s.title.toLowerCase().includes(q) ||
      s.desc.toLowerCase().includes(q) ||
      s.categoryLabel.toLowerCase().includes(q) ||
      s.steps.some(
        (st) =>
          st.title.toLowerCase().includes(q) ||
          st.description.toLowerCase().includes(q) ||
          st.bullets?.some((b) => b.toLowerCase().includes(q))
      );
    return matchesCat && matchesAdminFilter && matchesQuery;
  });

  if (!manualSettings.enabled) {
    return (
      <div className="p-12 text-center rounded-3xl border border-dashed bg-card space-y-4 max-w-2xl mx-auto my-12">
        <EyeOff className="w-12 h-12 text-muted-foreground mx-auto" />
        <h2 className="text-xl font-bold text-foreground">ศูนย์คู่มือการใช้งานระบบถูกปิดการแสดงผลชั่วคราว</h2>
        <p className="text-sm text-muted-foreground">
          ขณะนี้ผู้ดูแลระบบได้ปิดการแสดงผลศูนย์คู่มือการใช้งานระบบไว้
        </p>
        {isAdminUser && (
          <div className="pt-2">
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>ไปที่หน้าตั้งค่าระบบเพื่อเปิดใช้งาน (Settings)</span>
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Search Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/10 via-amber-500/10 to-primary/5 border border-primary/20 p-6 sm:p-10 shadow-xs">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ศูนย์คู่มือการใช้งานระบบสารสนเทศ (Comprehensive System Manual)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            คู่มือการใช้งานระบบสารสนเทศ คณะพุทธศาสตร์ มจร
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            รวบรวมวิธีใช้งานระบบสารสนเทศทั้งหมดของคณะ ครอบคลุมทั้งส่วนหน้าเว็บสาธารณะ (Portal) ระบบบริการการศึกษา (ทะเบียนนิสิต ตารางสอน เช็คชื่อ) ระบบบริหารทั่วไป (จองห้อง คำร้อง ข่าวสาร) และระบบตั้งค่าความปลอดภัย
          </p>

          {/* Search Box */}
          <div className="pt-2 relative max-w-xl">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="ค้นหาระบบหรือขั้นตอนการใช้งาน (เช่น เช็คชื่อ, จองห้อง, คำสั่งแต่งตั้ง, ทะเบียนนิสิต, ซ่อนเมนู)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border bg-background shadow-xs text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Category Pills & Admin Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {[
            { id: "ALL", label: `ทั้งหมด` },
            { id: "PORTAL", label: "หน้าเว็บสาธารณะ & ทำเนียบ" },
            { id: "ACADEMIC", label: "บริการการศึกษา & วิจัย" },
            { id: "ADMINISTRATION", label: "บริหารทั่วไป & อาคารสถานที่" },
            { id: "SYSTEM", label: "การจัดการระบบ & ความปลอดภัย" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Admin Quick Filter Toggle (Visible only when logged in as Admin) */}
        {isAdminUser && (
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-amber-500/10 border border-amber-500/30 shrink-0 text-xs font-semibold">
            <span className="text-[11px] text-amber-900 dark:text-amber-200 px-2 flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-600" />
              <span>โหมดแอดมิน:</span>
            </span>
            <button
              type="button"
              onClick={() => setAdminOnlyFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                adminOnlyFilter === "ALL"
                  ? "bg-amber-500 text-stone-900 font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              แสดงทั้งหมด
            </button>
            <button
              type="button"
              onClick={() => setAdminOnlyFilter("ADMIN")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                adminOnlyFilter === "ADMIN"
                  ? "bg-amber-500 text-stone-900 font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              เฉพาะของแอดมิน
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Sidebar Menu + Detail Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar Menu */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-2 sticky top-24">
            <div className="flex items-center justify-between pb-2 border-b">
              <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-primary" />
                <span>สารบัญระบบ ({filteredSections.length})</span>
              </span>
            </div>

            <div className="space-y-1.5 pt-1">
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
                        : "hover:bg-muted/60 text-foreground border border-transparent"
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
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs sm:text-sm font-semibold truncate leading-tight">
                          {sec.title}
                        </h4>
                        {sec.adminOnly && (
                          <span
                            className={`p-0.5 rounded ${
                              isSelected ? "text-amber-200" : "text-amber-600 dark:text-amber-400"
                            }`}
                            title="คู่มือเฉพาะผู้ดูแลระบบ"
                          >
                            <Lock className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <span
                        className={`inline-block mt-1 text-[10px] px-2 py-0.2 rounded-full font-semibold ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : sec.adminOnly
                            ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/20"
                            : "bg-muted text-muted-foreground border border-border/60"
                        }`}
                      >
                        {sec.adminOnly ? "🔒 เฉพาะผู้ดูแลระบบ" : sec.categoryLabel}
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
          {activeSection ? (
            <div className="p-6 sm:p-8 rounded-3xl border bg-card shadow-xs space-y-6">
              {/* Section Header */}
              <div className="border-b pb-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {activeSection.categoryLabel}
                  </span>
                  {activeSection.adminOnly && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                      <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span>เฉพาะผู้ดูแลระบบ (Admin)</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                    <activeSection.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-foreground">
                    {activeSection.title}
                  </h3>
                </div>
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
          ) : (
            <div className="p-12 text-center rounded-3xl border border-dashed bg-card space-y-3">
              <EyeOff className="w-8 h-8 text-muted-foreground mx-auto" />
              <h3 className="text-base font-bold text-foreground">
                ไม่พบคู่มือที่ตรงกับเงื่อนไข หรือคู่มือถูกปิดการแสดงผล
              </h3>
              <p className="text-xs text-muted-foreground">
                กรุณาเลือกหมวดหมู่อื่น หรือปรับการตั้งค่าการแสดงผลในหน้าตั้งค่าระบบ
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
