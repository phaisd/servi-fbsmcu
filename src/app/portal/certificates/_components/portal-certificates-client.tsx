"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileBadge,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Globe,
  ShieldCheck,
  UserCheck,
  Lock,
  Settings2,
} from "lucide-react";
import { useLocale } from "@/shared/lib/i18n/client";
import {
  type CertificateRequestMetadata,
  type CertificateTemplateType,
} from "@/features/certificates";

interface PortalRequestItem {
  id: string;
  userId: string;
  certificateTypeId: string;
  typeName: string;
  status: string;
  createdAt: string;
  metadata: CertificateRequestMetadata;
}

interface CurrentUserContext {
  id: string | null;
  email: string;
  name: string;
  studentCode: string;
  isAdminOrStaff: boolean;
}

interface Props {
  initialItems: PortalRequestItem[];
  currentUser: CurrentUserContext;
}

const TEMPLATE_INFO: Record<
  CertificateTemplateType,
  {
    titleTh: string;
    titleEn: string;
    subtitleTh: string;
    subtitleEn: string;
    badgeTh: string;
    badgeEn: string;
    color: string;
  }
> = {
  THAI_CERT: {
    titleTh: "หนังสือรับรองการเป็นนิสิต (ภาษาไทย)",
    titleEn: "Student Status Certificate (Thai)",
    subtitleTh: "สำหรับขอต่อวีซ่า (ตม.) หรือรับรองสถานภาพนิสิตภายในประเทศ",
    subtitleEn: "For Thailand immigration/visa extension and domestic student status verification",
    badgeTh: "ภาษาไทย",
    badgeEn: "Thai Language",
    color: "bg-blue-50 text-blue-700 ring-blue-600/20",
  },
  ENG_CERT: {
    titleTh: "หนังสือรับรองภาษาอังกฤษ (ใช้นอกประเทศ)",
    titleEn: "English Certificate (International Use)",
    subtitleTh: "TO WHOM IT MAY CONCERN • สำหรับศึกษาต่อ ขอวีซ่าต่างประเทศ หรือใช้นอกประเทศ",
    subtitleEn: "TO WHOM IT MAY CONCERN • For overseas studies, foreign embassies & international travel",
    badgeTh: "English",
    badgeEn: "English",
    color: "bg-purple-50 text-purple-700 ring-purple-600/20",
  },
  BANK_LETTER: {
    titleTh: "หนังสือขอความอนุเคราะห์ธนาคาร (เปิดบัญชี / Mobile Banking)",
    titleEn: "Bank Letter (Account Opening / Mobile Banking)",
    subtitleTh: "หนังสือถึงผู้จัดการธนาคารเพื่อขอเปิดบัญชีเงินฝากหรือสมัครแอปพลิเคชันธนาคาร",
    subtitleEn: "Official letter addressed to Bank Manager to open a savings account or mobile banking",
    badgeTh: "หนังสือธนาคาร",
    badgeEn: "Bank Letter",
    color: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  },
  RESIDENCE_MEMO: {
    titleTh: "บันทึกข้อความ ขอออกหนังสือรับรองที่อยู่นิสิต",
    titleEn: "Memorandum for Student Residence Certificate",
    subtitleTh: "บันทึกข้อความส่วนงานคณะพุทธศาสตร์ เรียน ผู้อำนวยการกองกิจการนิสิต",
    subtitleEn: "Faculty of Buddhism official memorandum addressed to Director of Student Affairs",
    badgeTh: "บันทึกข้อความ",
    badgeEn: "Residence Memo",
    color: "bg-amber-50 text-amber-700 ring-amber-600/20",
  },
};

export function PortalCertificatesClient({ initialItems, currentUser }: Props) {
  const locale = useLocale();
  const isEn = locale === "en";

  const [searchQuery, setSearchQuery] = useState("");
  const [templateFilter, setTemplateFilter] = useState<string>("ALL");
  const [adminShowAll, setAdminShowAll] = useState<boolean>(false);

  const isLoggedIn = Boolean(currentUser.id);
  const isAdmin = currentUser.isAdminOrStaff;

  const isItemOwnedByCurrentUser = (item: PortalRequestItem) => {
    if (!currentUser.id) return false;
    if (item.userId === currentUser.id) return true;
    const m = item.metadata;
    const itemCode = (m.studentCode || "").trim().toLowerCase();
    const myCode = (currentUser.studentCode || "").trim().toLowerCase();
    if (myCode && itemCode && itemCode === myCode) return true;
    const itemEmail = (m.email || "").trim().toLowerCase();
    const myEmail = (currentUser.email || "").trim().toLowerCase();
    if (myEmail && itemEmail && itemEmail === myEmail) return true;
    const itemName = (m.fullName || "").trim().toLowerCase();
    const myName = (currentUser.name || "").trim().toLowerCase();
    if (myName && itemName && itemName === myName) return true;
    return false;
  };

  const filteredItems = useMemo(() => {
    return initialItems.filter((item) => {
      const m = item.metadata;
      const tpl = m.docTemplate || "THAI_CERT";

      // 1. กรองตามสิทธิ์ผู้เข้าใช้งาน (นิสิตเห็นเฉพาะของตนเอง / Admin เลือกติ๊กเปิดดูทั้งหมดได้)
      if (isAdmin) {
        if (!adminShowAll && !searchQuery.trim()) {
          // หาก Admin ยังไม่ได้ติ๊ก "แสดงทั้งหมด" และไม่ได้พิมพ์ค้นหา ให้แสดงเฉพาะของตนเอง (ถ้ามี)
          if (!isItemOwnedByCurrentUser(item)) return false;
        }
      } else if (isLoggedIn) {
        // นิสิตหรือบุคลากรที่ล็อกอินแล้ว: เห็นเฉพาะคำร้องของตนเองเท่านั้น
        if (!isItemOwnedByCurrentUser(item)) return false;
      } else {
        // ผู้ที่ยังไม่ได้เข้าสู่ระบบ: ต้องพิมพ์รหัสนิสิตหรือเลขพาสปอร์ตอย่างน้อย 5 ตัวอักษรจึงจะค้นหาเจอ
        const q = searchQuery.toLowerCase().trim();
        if (q.length < 5) return false;
        const exactMatch =
          (m.studentCode || "").trim().toLowerCase() === q ||
          (m.passportNo || "").trim().toLowerCase() === q;
        if (!exactMatch) return false;
      }

      if (templateFilter !== "ALL" && tpl !== templateFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const hay = [
          m.studentCode,
          m.fullName,
          m.passportNo,
          m.nationality,
          m.country,
          m.major,
          m.requestPurpose,
          item.typeName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialItems, searchQuery, templateFilter, isAdmin, adminShowAll, isLoggedIn, currentUser]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-lg sm:p-8">
        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-300 ring-1 ring-amber-400/30">
              <FileBadge className="h-3.5 w-3.5" />
              {isEn
                ? "Faculty of Buddhism, MCU • Student Certificate Service"
                : "ระบบบริการหนังสือรับรองนิสิต คณะพุทธศาสตร์ มจร (Student Certificate Service)"}
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              {isEn
                ? "Student Certificate Requests & Status Tracking"
                : "ยื่นคำร้องและตรวจสอบสถานะหนังสือรับรองนิสิต"}
            </h1>
            <p className="max-w-2xl text-xs leading-relaxed text-slate-300 sm:text-sm">
              {isEn
                ? "Apply online and track your official student status certificates, bank recommendation letters, and residency memos. When approved, please bring your Student ID to collect the official stamped document at the Dean's Office."
                : "บริการยื่นคำร้องและติดตามสถานะหนังสือรับรองสถานภาพนิสิต (ภาษาไทย/อังกฤษ), หนังสือขอความอนุเคราะห์ธนาคาร และบันทึกข้อความรับรองที่อยู่ (เมื่อได้รับการอนุมัติ สามารถติดต่อรับเอกสารฉบับจริงพร้อมตราประทับและลายมือชื่อได้ที่สำนักงานคณบดี คณะพุทธศาสตร์)"}
            </p>
          </div>

          <div className="shrink-0 flex flex-wrap gap-2.5">
            {isAdmin && (
              <Link
                href="/certificates"
                className="inline-flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/25 px-4 py-3 text-sm font-bold text-white shadow-xs transition backdrop-blur-xs"
              >
                <Settings2 className="h-4 w-4 text-amber-300" />
                {isEn ? "Manage Certificates (Admin)" : "จัดการคำร้องหลังบ้าน (Admin)"}
              </Link>
            )}
            <Link
              href="/portal/certificates/request"
              className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-md transition hover:bg-amber-300"
            >
              <Plus className="h-4 w-4" />
              {isEn ? "Apply for New Certificate" : "ยื่นคำร้องขอหนังสือรับรองใหม่ (New Request)"}
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Official Certificate Templates Overview */}
      <div className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(TEMPLATE_INFO) as CertificateTemplateType[]).map((key) => {
          const info = TEMPLATE_INFO[key];
          return (
            <div
              key={key}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-indigo-300 hover:shadow-sm"
            >
              <div>
                <span className={`inline-block rounded-lg px-2.5 py-0.5 text-[11px] font-bold ${info.color}`}>
                  {isEn ? info.badgeEn : info.badgeTh}
                </span>
                <h3 className="mt-2.5 text-sm font-bold text-slate-900">
                  {isEn ? info.titleEn : info.titleTh}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {isEn ? info.subtitleEn : info.subtitleTh}
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-100">
                <Link
                  href={`/portal/certificates/request?template=${key}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-500"
                >
                  {isEn ? "Apply for this type →" : "ยื่นคำขอประเภทนี้ →"}
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Personal Filter Status Banner & Admin Toggle Checkbox */}
      {isAdmin ? (
        <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-indigo-200 bg-indigo-50/70 px-4 py-3.5 transition hover:bg-indigo-50">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="block text-sm font-bold text-slate-900">
                {isEn
                  ? `Show All Student Certificate Requests (${initialItems.length} total) — Admin / Staff Only`
                  : `แสดงรายการคำร้องขอหนังสือรับรองของนิสิตทั้งหมด (${initialItems.length} รายการ) — เฉพาะผู้ดูแลระบบ / เจ้าหน้าที่`}
              </span>
              <span className="block text-xs text-slate-600">
                {isEn
                  ? "For students, the system strictly filters to show only their own requests for privacy (PDPA)."
                  : "สำหรับนิสิต ระบบจะกรองแสดงเฉพาะคำร้องของนิสิตที่เข้าสู่ระบบท่านนั้นโดยอัตโนมัติ (ติ๊กถูกเพื่อดูรายการทั้งหมดในฐานะ Admin)"}
              </span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={adminShowAll}
            onChange={(e) => setAdminShowAll(e.target.checked)}
            className="h-4 w-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
          />
        </label>
      ) : isLoggedIn ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <UserCheck className="h-5 w-5 text-emerald-600 shrink-0" />
            <div className="text-xs sm:text-sm text-emerald-950">
              <span className="font-bold">
                {isEn ? "Showing only your certificate requests:" : "กำลังแสดงเฉพาะรายการคำร้องขอหนังสือรับรองของท่าน:"}
              </span>{" "}
              <span className="font-semibold">{currentUser.name}</span>{" "}
              {currentUser.studentCode && (
                <span className="ml-1 rounded-md bg-emerald-600/15 px-2 py-0.5 font-mono text-xs font-bold text-emerald-800">
                  {currentUser.studentCode}
                </span>
              )}
            </div>
          </div>
          <span className="text-[11px] font-medium text-emerald-700">
            🔒 {isEn ? "Personal Privacy Protected (PDPA)" : "ข้อมูลส่วนบุคคลเฉพาะบัญชีของท่าน"}
          </span>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <Lock className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="text-xs text-amber-950">
              <span className="font-bold">
                {isEn
                  ? "Please log in with your Student ID (@mcu.ac.th) to view your certificate requests"
                  : "กรุณาเข้าสู่ระบบด้วยรหัสนิสิต (<รหัสนิสิต>@mcu.ac.th) เพื่อดูรายการคำร้องของท่าน"}
              </span>{" "}
              <span>
                {isEn
                  ? "or enter your exact Student ID / Passport No. below to check status."
                  : "หรือพิมพ์รหัสนิสิต / เลขที่ Passport ของท่านในช่องค้นหาด้านล่างเพื่อตรวจสอบสถานะ"}
              </span>
            </div>
          </div>
          <Link
            href="/login"
            className="shrink-0 inline-flex items-center justify-center rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-500 transition"
          >
            {isEn ? "Student Login →" : "เข้าสู่ระบบนิสิต →"}
          </Link>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isEn
                ? "Search your requests by Student ID, Passport No, or Purpose..."
                : "ค้นหาคำร้องด้วยรหัสนิสิต (Student ID), เลขที่ Passport หรือวัตถุประสงค์..."
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
          />
        </div>

        <select
          value={templateFilter}
          onChange={(e) => setTemplateFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700"
        >
          <option value="ALL">{isEn ? "All Certificate Types" : "ทุกประเภทหนังสือรับรอง"}</option>
          <option value="THAI_CERT">
            {isEn ? "Student Status Certificate (Thai)" : "หนังสือรับรองนิสิต (ภาษาไทย)"}
          </option>
          <option value="ENG_CERT">
            {isEn ? "English Certificate (International)" : "หนังสือรับรองภาษาอังกฤษ (ใช้นอกประเทศ)"}
          </option>
          <option value="BANK_LETTER">
            {isEn ? "Bank Request Letter" : "หนังสือขอความอนุเคราะห์ธนาคาร"}
          </option>
          <option value="RESIDENCE_MEMO">
            {isEn ? "Residency Memorandum" : "บันทึกข้อความ รับรองที่อยู่"}
          </option>
        </select>
      </div>

      {/* List Header & PDPA Privacy Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <h2 className="text-base font-bold text-slate-900">
          {isEn
            ? `My Certificate Requests (${filteredItems.length} items)`
            : `รายการคำร้องขอหนังสือรับรอง (${filteredItems.length} รายการ)`}
        </h2>
        <div className="inline-flex items-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>
            {isEn
              ? "PDPA Protected: Only your personal requests are displayed."
              : "คุ้มครองข้อมูลส่วนบุคคล (PDPA): แสดงเฉพาะคำร้องของนิสิตที่เข้าสู่ระบบ รับฉบับจริงพร้อมตราประทับ ณ สำนักงานคณบดี"}
          </span>
        </div>
      </div>

      {/* Horizontal List View of Certificate Requests */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <FileBadge className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="mt-3 text-sm font-bold text-slate-800">
              {isAdmin && !adminShowAll
                ? isEn
                  ? "Tick the Admin checkbox above to view all student requests"
                  : "คุณยังไม่มีคำร้องส่วนตัว (สามารถติ๊กถูกที่กล่องผู้ดูแลระบบด้านบนเพื่อดูคำร้องของนิสิตทั้งหมด)"
                : isEn
                  ? "No certificate requests found for your account"
                  : "ยังไม่มีรายการคำร้องขอหนังสือรับรองในบัญชีของท่าน"}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {isEn
                ? "Click 'Apply for New Certificate' above to submit a new request."
                : "สามารถกดปุ่ม 'ยื่นคำร้องขอหนังสือรับรองใหม่' ด้านบนเพื่อส่งคำขอได้ทันที"}
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const m = item.metadata;
            const tpl = (m.docTemplate || "THAI_CERT") as CertificateTemplateType;
            const info = TEMPLATE_INFO[tpl] || TEMPLATE_INFO.THAI_CERT;

            return (
              <div
                key={item.id}
                className="group relative flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-slate-300 hover:shadow-sm sm:flex-row sm:items-center sm:p-5"
              >
                {/* Main Information */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-bold text-slate-800">
                      {m.studentCode || (isEn ? "ID Not specified" : "ไม่ระบุรหัส")}
                    </span>
                    <span className={`rounded-md px-2.5 py-0.5 text-xs font-semibold ring-1 ${info.color}`}>
                      {isEn ? info.badgeEn : info.badgeTh}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                      <Globe className="h-3 w-3 text-indigo-400" />
                      {m.language || (isEn ? "In Thai language" : "In Thai language")}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition">
                      {m.fullName || (isEn ? "Faculty Student" : "นิสิตคณะพุทธศาสตร์")}
                    </h3>
                    <span className="text-xs text-slate-500">
                      {isEn ? info.titleEn : info.titleTh}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs text-slate-600">
                    <div>
                      <span className="text-[11px] text-slate-400">
                        {isEn ? "Purpose:" : "วัตถุประสงค์:"}
                      </span>
                      <p className="font-semibold text-slate-800 truncate" title={m.requestPurpose || "-"}>
                        {m.requestPurpose || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400">
                        {isEn ? "Major / Class Year:" : "สาขาวิชา / ชั้นปี:"}
                      </span>
                      <p className="font-medium text-slate-700 truncate">
                        {m.major || "-"} {m.classYear ? `(${m.classYear})` : ""}
                      </p>
                    </div>
                    {/* PDPA: Displays ONLY Nationality/Country, removing the sensitive Passport Number */}
                    <div>
                      <span className="text-[11px] text-slate-400">
                        {isEn ? "Nationality / Country:" : "สัญชาติ / ประเทศ:"}
                      </span>
                      <p className="font-medium text-slate-700 truncate">
                        {m.nationality || m.country || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status & Office Pickup Notice */}
                <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 sm:pl-5 sm:border-l sm:min-w-[210px]">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                      item.status === "APPROVED"
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                        : item.status === "REJECTED"
                          ? "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20"
                          : "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
                    }`}
                  >
                    {item.status === "APPROVED" ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" /> {isEn ? "Approved" : "อนุมัติแล้ว"}
                      </>
                    ) : item.status === "REJECTED" ? (
                      <>
                        <XCircle className="h-4 w-4" /> {isEn ? "Rejected" : "ไม่อนุมัติ"}
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4" /> {isEn ? "Pending" : "รอดำเนินการ"}
                      </>
                    )}
                  </span>

                  {item.status === "APPROVED" ? (
                    <span className="text-[11px] font-medium text-emerald-600 text-right">
                      {isEn
                        ? "✓ Collect official sealed copy at Dean's Office"
                        : "✓ ติดต่อรับฉบับจริงพร้อมตราประทับที่สำนักงานคณบดี"}
                    </span>
                  ) : item.status === "REJECTED" ? (
                    <span className="text-[11px] font-medium text-rose-500 text-right">
                      {isEn
                        ? "Please contact registrar staff for inquiry"
                        : "ติดต่อเจ้าหน้าที่ทะเบียนเพื่อตรวจสอบข้อมูล"}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 text-right">
                      {isEn ? "Staff is reviewing your request" : "เจ้าหน้าที่กำลังตรวจสอบคำร้อง"}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
