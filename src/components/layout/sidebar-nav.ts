import {
  LayoutDashboard,
  Users,
  Settings,
  Layers,
  Newspaper,
  FileText,
  GraduationCap,
  Calendar,
  ShieldCheck,
  Globe,
  Building2,
  Briefcase,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { hasPermission, P } from "@/features/identity";
import { SAMPLE_P } from "@/features/sample";
import { NEWS_P } from "@/features/news";
import { CERTIFICATES_P } from "@/features/certificates";
import { PERSONNEL_P } from "@/features/personnel";
import { CURRICULUM_P } from "@/features/curriculum";
import { ADMINISTRATION_P } from "@/features/administration";
import { MEETINGS_P } from "@/features/meetings";
import { ATTENDANCE_P } from "@/features/attendance";
import { EVENTS_P } from "@/features/events";

export interface NavItem {
  /** i18n key */
  title: string;
  href: string;
  icon?: LucideIcon;
  /** ต้องมีสิทธิ์นี้ถึงเห็น — ไม่มี = ทุกคนที่ login เห็น */
  permission?: string;
  children?: NavItem[];
}
export interface NavGroup { label: string; items: NavItem[] }
export interface NavCrumb { title: string; href: string }

export const sidebarGroups: NavGroup[] = [
  // ── 1. ภาพรวมระบบ (Overview) ──
  {
    label: "nav.group.overview",
    items: [
      { title: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "nav.portal_view", href: "/portal", icon: Globe },
    ],
  },

  // ── 2. งานบริการการศึกษาและวิชาการ (Academic & Student Affairs) ──
  {
    label: "nav.group.academic",
    items: [
      {
        title: "attendance.students.title",
        href: "/students",
        icon: Users,
        permission: ATTENDANCE_P.manage,
      },
      {
        title: "curriculum.nav",
        href: "/curriculum",
        icon: GraduationCap,
        permission: CURRICULUM_P.read,
        children: [
          { title: "curriculum.title", href: "/curriculum", permission: CURRICULUM_P.read },
          { title: "curriculum.departments_title", href: "/curriculum/departments", permission: CURRICULUM_P.read },
          { title: "curriculum.timetables_title", href: "/curriculum/timetables", permission: CURRICULUM_P.read },
          { title: "curriculum.calendar_title", href: "/curriculum/calendar", permission: CURRICULUM_P.read },
        ],
      },
      {
        title: "attendance.nav",
        href: "/attendance",
        icon: Clock,
        permission: ATTENDANCE_P.manage,
        children: [
          { title: "attendance.dashboard.title", href: "/attendance", permission: ATTENDANCE_P.manage },
          { title: "attendance.classes.title", href: "/attendance/classes", permission: ATTENDANCE_P.manage },
          { title: "attendance.students.title", href: "/attendance/students", permission: ATTENDANCE_P.manage },
          { title: "curriculum.calendar_title", href: "/curriculum/calendar", permission: ATTENDANCE_P.manage },
        ],
      },
      {
        title: "certificates.nav",
        href: "/certificates",
        icon: FileText,
        permission: CERTIFICATES_P.requestView,
        children: [
          { title: "certificates.nav", href: "/certificates", permission: CERTIFICATES_P.requestView },
          { title: "perm.certificates:type:manage", href: "/certificates/types", permission: CERTIFICATES_P.typeManage },
        ],
      },
    ],
  },

  // ── 3. งานบริหารทั่วไปและอาคารสถานที่ (Administration & Facilities) ──
  {
    label: "nav.group.facilities",
    items: [
      {
        title: "meetings.nav",
        href: "/meetings/rooms",
        icon: Building2,
        permission: MEETINGS_P.manage,
        children: [
          { title: "meetings.bookings.title", href: "/meetings/bookings", permission: MEETINGS_P.manage },
          { title: "meetings.title", href: "/meetings/rooms", permission: MEETINGS_P.manage },
        ],
      },
      {
        title: "administration.title",
        href: "/administration",
        icon: Briefcase,
        permission: ADMINISTRATION_P.read,
      },
      {
        title: "events.title",
        href: "/events",
        icon: Calendar,
        permission: EVENTS_P.manage,
      },
    ],
  },

  // ── 4. งานสื่อสารองค์กรและบุคลากร (PR & Personnel) ──
  {
    label: "nav.group.pr_personnel",
    items: [
      {
        title: "news.nav",
        href: "/news",
        icon: Newspaper,
        permission: NEWS_P.newsRead,
      },
      {
        title: "personnel.nav",
        href: "/personnel",
        icon: Users,
        permission: PERSONNEL_P.read,
        children: [
          { title: "personnel.nav", href: "/personnel", permission: PERSONNEL_P.read },
          { title: "personnel.research.nav", href: "/personnel/research", permission: PERSONNEL_P.read },
          { title: "perm.personnel:manage", href: "/personnel/departments", permission: PERSONNEL_P.manage },
        ],
      },
    ],
  },

  // ── 5. การจัดการระบบและความปลอดภัย (System Administration) ──
  {
    label: "nav.group.system",
    items: [
      {
        title: "nav.users",
        href: "/users",
        icon: Users,
        permission: P.usersRead,
        children: [
          { title: "nav.users", href: "/users", permission: P.usersRead },
          { title: "nav.roles", href: "/users/roles", permission: P.rolesManage },
        ],
      },
      {
        title: "nav.settings",
        href: "/settings",
        icon: Settings,
        permission: P.settingsManage,
      },
      {
        title: "audit.nav",
        href: "/audit-logs",
        icon: ShieldCheck,
        permission: P.auditRead,
      },
      {
        title: "sample.nav",
        href: "/sample",
        icon: Layers,
        permission: SAMPLE_P.sampleRead,
      },
    ],
  },
];

type Ctx = Parameters<typeof hasPermission>[0];

function visibleItem(item: NavItem, ctx: Ctx): NavItem | null {
  if (item.permission && !hasPermission(ctx, item.permission)) return null;
  if (!item.children) return item;
  const children = item.children.filter((c) => !c.permission || hasPermission(ctx, c.permission));
  return children.length ? { ...item, children } : null;
}

export function visibleGroups(ctx: Ctx): NavGroup[] {
  return sidebarGroups
    .map((g) => ({ ...g, items: g.items.map((i) => visibleItem(i, ctx)).filter((i): i is NavItem => i !== null) }))
    .filter((g) => g.items.length > 0);
}

/** สายเมนูสำหรับ breadcrumb — จับ href ที่ยาวที่สุดที่ตรง (ลูกชนะแม่) */
export function getActiveNavChain(pathname: string): NavCrumb[] {
  let best: { parent: NavItem | null; item: NavItem } | null = null;
  const consider = (item: NavItem, parent: NavItem | null) => {
    if (pathname === item.href || pathname.startsWith(item.href + "/")) {
      if (!best || item.href.length > best.item.href.length || (item.href.length === best.item.href.length && parent)) best = { parent, item };
    }
  };
  for (const g of sidebarGroups) for (const i of g.items) { consider(i, null); for (const c of i.children ?? []) consider(c, i); }
  if (!best) return [];
  const { parent, item } = best as { parent: NavItem | null; item: NavItem };
  const chain: NavCrumb[] = [];
  if (parent && parent.href !== item.href) chain.push({ title: parent.title, href: parent.href });
  chain.push({ title: item.title, href: item.href });
  return chain;
}
