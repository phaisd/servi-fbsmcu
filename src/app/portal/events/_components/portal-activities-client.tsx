"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Clock3,
  Award,
  Sparkles,
  QrCode,
  Search,
  ChevronRight,
  FileText,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getStudentActivityTranscriptAction } from "@/features/events/actions";
import {
  StudentActivityTranscriptDocument,
  type StudentActivityTranscriptData,
} from "@/components/documents/student-activity-transcript-document";

interface RegistrationItem {
  id: string;
  status: "REGISTERED" | "ATTENDED" | "CANCELLED";
  role: string;
  major?: string | null;
  yearLevel?: number | null;
  remarks?: string | null;
  attendedAt?: Date | string | null;
  event: {
    id: string;
    title: string;
    description?: string | null;
    location?: string | null;
    startDate: Date | string;
    endDate: Date | string;
    activityHours?: number;
    eventType?: string;
    academicYear?: string | null;
    targetGroup?: string | null;
  };
}

interface AvailableEvent {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startDate: Date | string;
  endDate: Date | string;
  activityHours?: number;
  eventType?: string;
  academicYear?: string | null;
  targetGroup?: string | null;
}

interface Props {
  initialData: {
    myRegistrations: RegistrationItem[];
    availableEvents: AvailableEvent[];
    allEvents?: AvailableEvent[];
    totalAttendedHours: number;
  };
  user: {
    name: string;
    email: string;
    code: string;
    role: "STUDENT" | "TEACHER";
  };
  locale: string;
}

export function getEventScope(targetGroup?: string | null): "FACULTY" | "UNIVERSITY" | "ALL" {
  if (!targetGroup) return "ALL";
  const tg = targetGroup.toUpperCase();
  if (tg === "FACULTY" || tg.includes("FACULTY") || tg.includes("คณะ") || tg.includes("สาขาวิชา") || tg.includes("ภาควิชา")) {
    return "FACULTY";
  }
  if (tg === "UNIVERSITY" || tg.includes("UNIVERSITY") || tg.includes("มหาวิทยาลัย") || tg.includes("มจร") || tg.includes("ส่วนกลาง")) {
    return "UNIVERSITY";
  }
  return "ALL";
}

export function getCategoryLabel(type?: string) {
  switch (type) {
    case "CEREMONY":
      return "พิธีการ / ปฐมนิเทศ";
    case "ACADEMIC":
      return "วิชาการ / สัมมนา";
    case "BUDDHIST":
      return "กิจกรรมพระพุทธศาสนา / ปฏิบัติธรรม";
    case "VOLUNTEER":
      return "จิตอาสา / บำเพ็ญประโยชน์";
    case "CULTURE":
      return "ทำนุบำรุงศิลปวัฒนธรรม";
    case "ACADEMIC_SERVICE":
      return "บริการวิชาการแก่ท้องถิ่น";
    case "SPORTS_HEALTH":
      return "กีฬาและส่งเสริมสุขภาพ";
    default:
      return "กิจกรรมทั่วไป";
  }
}

export function PortalActivitiesClient({ initialData, user, locale }: Props) {
  const [activeTab, setActiveTab] = useState<"ALL_EVENTS" | "FACULTY_EVENTS" | "UNIVERSITY_EVENTS" | "MY_EVENTS">("ALL_EVENTS");
  const [search, setSearch] = useState("");
  const [showQRModal, setShowQRModal] = useState(false);
  const [transcriptData, setTranscriptData] = useState<StudentActivityTranscriptData | null>(null);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);

  const handleOpenTranscript = async () => {
    if (!user.code) {
      toast.error("ไม่พบรหัสประจำตัวนิสิต");
      return;
    }
    setIsLoadingTranscript(true);
    try {
      const res = await getStudentActivityTranscriptAction(user.code);
      setTranscriptData(res as StudentActivityTranscriptData);
    } catch (err: any) {
      toast.error(err.message || "ไม่สามารถโหลดระเบียนกิจกรรมได้");
    } finally {
      setIsLoadingTranscript(false);
    }
  };

  const { myRegistrations, availableEvents, allEvents, totalAttendedHours } = initialData;

  // Build a complete list of all events
  const completeEventsList: AvailableEvent[] = allEvents && allEvents.length > 0
    ? allEvents
    : [
        ...myRegistrations.map((r) => ({
          ...r.event,
        })),
        ...availableEvents.filter((ev) => !myRegistrations.some((r) => r.event.id === ev.id)),
      ];

  // Mapping for user registration status check
  const registrationMap = new Map<string, RegistrationItem>();
  myRegistrations.forEach((r) => registrationMap.set(r.event.id, r));

  const attendedCount = myRegistrations.filter((r) => r.status === "ATTENDED").length;
  const pendingCount = myRegistrations.filter((r) => r.status === "REGISTERED").length;

  // Faculty Events
  const facultyEvents = completeEventsList.filter((ev) => {
    const scope = getEventScope(ev.targetGroup);
    return scope === "FACULTY" || scope === "ALL";
  });

  // University Events
  const universityEvents = completeEventsList.filter((ev) => {
    const scope = getEventScope(ev.targetGroup);
    return scope === "UNIVERSITY" || scope === "ALL";
  });

  // Filtered registrations for My Activities
  const filteredRegistrations = myRegistrations.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.event.title.toLowerCase().includes(q) ||
      (r.event.location || "").toLowerCase().includes(q)
    );
  });

  // Filtered list based on current active tab
  const getTabEvents = () => {
    let list: AvailableEvent[] = [];
    if (activeTab === "ALL_EVENTS") list = completeEventsList;
    else if (activeTab === "FACULTY_EVENTS") list = facultyEvents;
    else if (activeTab === "UNIVERSITY_EVENTS") list = universityEvents;
    else return [];

    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((ev) =>
      ev.title.toLowerCase().includes(q) ||
      (ev.location || "").toLowerCase().includes(q) ||
      (ev.description || "").toLowerCase().includes(q)
    );
  };

  const currentTabEvents = getTabEvents();

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* ══════════ Top Banner ══════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-2">
            <Award className="h-3.5 w-3.5" />
            {locale === "th" ? "ระบบกิจกรรมและการเข้าร่วม มจร." : "MCU Activity & Event System"}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {locale === "th" ? "กิจกรรมของนิสิตและคณาจารย์" : "Student & Faculty Activities"}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            {locale === "th"
              ? "ตรวจสอบตารางกิจกรรมของคณะ กิจกรรมของมหาวิทยาลัย ประวัติการเข้าร่วม และชั่วโมงกิจกรรมสะสม"
              : "View faculty and university activity schedule, attendance history, and activity hours"}
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {user.code && (
            <Button
              onClick={handleOpenTranscript}
              disabled={isLoadingTranscript}
              className="gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold rounded-xl shadow-xs text-xs sm:text-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>
                {isLoadingTranscript
                  ? "กำลังโหลด..."
                  : locale === "th"
                  ? "📄 พิมพ์ระเบียนกิจกรรม (Activity Transcript)"
                  : "Print Activity Transcript"}
              </span>
            </Button>
          )}

          {user.code && (
            <Button
              onClick={() => setShowQRModal(true)}
              variant="outline"
              className="gap-2 font-semibold rounded-xl shadow-xs text-xs sm:text-sm cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>{locale === "th" ? "บัตร QR เช็คชื่อประจำตัว" : "My Event QR Pass"}</span>
            </Button>
          )}
        </div>
      </div>

      {/* ══════════ Summary Stats Cards ══════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 dark:border-amber-900/40 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-400">
            <span>ชั่วโมงกิจกรรมสะสม</span>
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-3xl font-black text-amber-800 dark:text-amber-300 mt-2">
            {totalAttendedHours}{" "}
            <span className="text-sm font-normal text-muted-foreground">ชั่วโมง</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-amber-200/60 dark:border-amber-900/40 text-2xs">
            <span className="text-muted-foreground">ผ่านการเข้าร่วมสมบูรณ์</span>
            <button
              type="button"
              onClick={handleOpenTranscript}
              className="font-bold text-amber-800 dark:text-amber-300 hover:underline cursor-pointer flex items-center gap-0.5"
            >
              <span>ดูใบระเบียน (A4) &rarr;</span>
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
            <span>เข้าร่วมแล้ว (Attended)</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-3xl font-black text-emerald-800 dark:text-emerald-300 mt-2">
            {attendedCount}{" "}
            <span className="text-sm font-normal text-muted-foreground">กิจกรรม</span>
          </div>
          <div className="text-2xs text-muted-foreground mt-1">
            สามารถพิมพ์ใบรับรองและทำแบบประเมินได้
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-200 dark:border-blue-900/40 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-blue-700 dark:text-blue-400">
            <span>กิจกรรมที่เปิดรับในระบบ</span>
            <Clock3 className="w-4 h-4" />
          </div>
          <div className="text-3xl font-black text-blue-800 dark:text-blue-300 mt-2">
            {completeEventsList.length}{" "}
            <span className="text-sm font-normal text-muted-foreground">กิจกรรม</span>
          </div>
          <div className="text-2xs text-muted-foreground mt-1">
            คณะ: {facultyEvents.length} | มหาวิทยาลัย: {universityEvents.length}
          </div>
        </div>
      </div>

      {/* ══════════ Navigation Tabs & Search ══════════ */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-border pb-3">
        <div className="inline-flex flex-wrap rounded-xl border border-border bg-muted/40 p-1 gap-1">
          {/* Tab 1: กิจกรรมทั้งหมด */}
          <button
            type="button"
            onClick={() => setActiveTab("ALL_EVENTS")}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
              activeTab === "ALL_EVENTS"
                ? "bg-background text-foreground shadow-2xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {locale === "th"
              ? `กิจกรรมทั้งหมด (${completeEventsList.length})`
              : `All Events (${completeEventsList.length})`}
          </button>

          {/* Tab 2: กิจกรรมของคณะ */}
          <button
            type="button"
            onClick={() => setActiveTab("FACULTY_EVENTS")}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 ${
              activeTab === "FACULTY_EVENTS"
                ? "bg-background text-indigo-700 dark:text-indigo-400 shadow-2xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>🏛️</span>
            <span>
              {locale === "th"
                ? `กิจกรรมของคณะ (${facultyEvents.length})`
                : `Faculty Events (${facultyEvents.length})`}
            </span>
          </button>

          {/* Tab 3: กิจกรรมของมหาวิทยาลัย */}
          <button
            type="button"
            onClick={() => setActiveTab("UNIVERSITY_EVENTS")}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 ${
              activeTab === "UNIVERSITY_EVENTS"
                ? "bg-background text-sky-700 dark:text-sky-400 shadow-2xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>🌐</span>
            <span>
              {locale === "th"
                ? `กิจกรรมของมหาวิทยาลัย (${universityEvents.length})`
                : `University Events (${universityEvents.length})`}
            </span>
          </button>

          {/* Tab 4: กิจกรรมของฉัน */}
          <button
            type="button"
            onClick={() => setActiveTab("MY_EVENTS")}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
              activeTab === "MY_EVENTS"
                ? "bg-background text-foreground shadow-2xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {locale === "th"
              ? `กิจกรรมของฉัน (${myRegistrations.length})`
              : `My Activities (${myRegistrations.length})`}
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={locale === "th" ? "ค้นหากิจกรรม, สถานที่..." : "Search activity..."}
            className="w-full bg-muted/30 border border-border rounded-xl pl-9 pr-3 py-1.5 text-xs sm:text-sm focus:outline-hidden focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* ══════════ Tab: My Activities (กิจกรรมของฉัน) ══════════ */}
      {activeTab === "MY_EVENTS" && (
        <div className="space-y-4">
          {filteredRegistrations.map((reg) => {
            const isAttended = reg.status === "ATTENDED";
            const scope = getEventScope(reg.event.targetGroup);
            return (
              <div
                key={reg.id}
                className="bg-card border border-border rounded-2xl p-5 shadow-2xs hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        isAttended
                          ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                          : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                      }`}
                    >
                      {isAttended ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>เข้าร่วมแล้ว (Attended)</span>
                        </>
                      ) : (
                        <>
                          <Clock3 className="w-3.5 h-3.5" />
                          <span>รอเข้าร่วม / ยังไม่เช็คชื่อ</span>
                        </>
                      )}
                    </span>

                    {/* Scope Badge */}
                    {scope === "FACULTY" ? (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200">
                        🏛️ กิจกรรมของคณะ
                      </span>
                    ) : scope === "UNIVERSITY" ? (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200">
                        🌐 กิจกรรมของมหาวิทยาลัย
                      </span>
                    ) : null}

                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 px-2 py-0.5 rounded-md">
                      +{reg.event.activityHours || 3} ชม. กิจกรรม
                    </span>

                    <span className="text-2xs text-muted-foreground">
                      ปีการศึกษา {reg.event.academicYear || "2569"}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-foreground">
                      {reg.event.title}
                    </h3>
                    {reg.event.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {reg.event.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      {new Date(reg.event.startDate).toLocaleDateString("th-TH", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      {new Date(reg.event.startDate).toLocaleTimeString("th-TH", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      น. เป็นต้นไป
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      <span className="truncate">{reg.event.location || "มจร. วังน้อย"}</span>
                    </span>
                  </div>
                </div>

                {/* Right Action / Certificate / Evaluation */}
                <div className="flex flex-col items-start md:items-end justify-center shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-border gap-2">
                  {isAttended ? (
                    <div className="text-left md:text-right space-y-2">
                      <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center md:justify-end gap-1">
                        <CheckCircle2 className="w-4 h-4" /> ยืนยันเวลาเรียน/กิจกรรมแล้ว
                      </div>
                      {reg.attendedAt && (
                        <div className="text-2xs text-muted-foreground">
                          เช็คชื่อเมื่อ: {new Date(reg.attendedAt).toLocaleString("th-TH")}
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <Link
                          href={`/portal/events/${reg.event.id}/certificate`}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>เกียรติบัตร</span>
                        </Link>
                        <Link
                          href={`/portal/events/${reg.event.id}/evaluate`}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xs transition"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>แบบประเมิน</span>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="text-left md:text-right space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">
                        กรุณายื่นบัตร QR หรือแจ้งรหัส {user.code} หน้างาน
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowQRModal(true)}
                          className="text-xs gap-1"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>แสดงบัตร QR</span>
                        </Button>
                        <Link
                          href={`/portal/events/${reg.event.id}/evaluate`}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xs transition"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>ประเมิน & เช็คชื่อ</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {filteredRegistrations.length === 0 && (
            <div className="py-16 text-center bg-card border border-dashed border-border rounded-2xl space-y-2">
              <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <div className="text-sm font-semibold text-foreground">
                ไม่พบประวัติกิจกรรมของท่านในหมวดนี้
              </div>
              <p className="text-xs text-muted-foreground">
                ท่านสามารถตรวจสอบกิจกรรมทั้งหมดของคณะและมหาวิทยาลัยได้ที่แท็บด้านบน
              </p>
            </div>
          )}
        </div>
      )}

      {/* ══════════ Tabs: All Events / Faculty / University ══════════ */}
      {activeTab !== "MY_EVENTS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentTabEvents.map((ev) => {
            const scope = getEventScope(ev.targetGroup);
            const userReg = registrationMap.get(ev.id);
            const isAttended = userReg?.status === "ATTENDED";
            const isRegistered = userReg?.status === "REGISTERED";

            return (
              <div
                key={ev.id}
                className="bg-card border border-border rounded-2xl p-5 shadow-2xs hover:shadow-md transition space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  {/* Badges: Scope, Type, Hours */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {scope === "FACULTY" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200">
                          🏛️ กิจกรรมของคณะ (คณะพุทธศาสตร์)
                        </span>
                      ) : scope === "UNIVERSITY" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200">
                          🌐 กิจกรรมของมหาวิทยาลัย (มจร. ส่วนกลาง)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-muted text-muted-foreground border border-border">
                          🏢 กิจกรรมร่วม / ทุกระดับ
                        </span>
                      )}

                      <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {getCategoryLabel(ev.eventType)}
                      </span>
                    </div>

                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900/50">
                      {ev.activityHours || 3} ชม. กิจกรรม
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-bold text-foreground">{ev.title}</h3>
                    {ev.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {ev.description}
                      </p>
                    )}
                  </div>

                  {/* Date, Time, Location */}
                  <div className="space-y-1 text-xs text-muted-foreground pt-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      <span>
                        {new Date(ev.startDate).toLocaleDateString("th-TH", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <span>
                        {new Date(ev.startDate).toLocaleTimeString("th-TH", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        -{" "}
                        {new Date(ev.endDate).toLocaleTimeString("th-TH", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        น.
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      <span className="truncate">{ev.location || "มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย"}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Status & Links */}
                <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2">
                  <div>
                    {isAttended ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>เข้าร่วมกิจกรรมแล้ว</span>
                      </span>
                    ) : isRegistered ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                        <Clock3 className="w-3.5 h-3.5" />
                        <span>ลงทะเบียนแล้ว</span>
                      </span>
                    ) : (
                      <span className="text-2xs text-muted-foreground">
                        กลุ่มเป้าหมาย: {ev.targetGroup || "นิสิตและคณาจารย์"}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isAttended ? (
                      <Link
                        href={`/portal/events/${ev.id}/certificate`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs transition"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>เกียรติบัตร</span>
                      </Link>
                    ) : null}

                    <Link
                      href={`/portal/events/${ev.id}/evaluate`}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs transition"
                    >
                      <span>แบบประเมิน</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {currentTabEvents.length === 0 && (
            <div className="col-span-full py-16 text-center bg-card border border-dashed border-border rounded-2xl">
              <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <div className="text-sm font-semibold text-foreground">
                ไม่พบรายการกิจกรรมในหมวดนี้
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                คุณสามารถเลือกดูแท็บ &quot;กิจกรรมทั้งหมด&quot; เพื่อดูกิจกรรมอื่นๆ เพิ่มเติม
              </p>
            </div>
          )}
        </div>
      )}

      {/* ══════════ Personal Digital QR Pass Modal ══════════ */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white text-slate-900 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-center">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                MCU Event Pass
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-2">
                บัตร QR ประจำตัวสำหรับเช็คชื่อ
              </h3>
              <p className="text-xs text-slate-500">
                ยื่นให้เจ้าหน้าที่สแกนที่จุดลงทะเบียนหน้างาน
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col items-center justify-center space-y-3">
              <div className="bg-white p-3 rounded-xl shadow-xs border border-slate-200">
                {/* Visual QR Code Display */}
                <div className="w-44 h-44 bg-slate-900 rounded-lg flex flex-col items-center justify-center text-white p-2 text-center relative overflow-hidden">
                  <div className="absolute inset-2 border-2 border-dashed border-white/40 rounded flex flex-col items-center justify-center">
                    <QrCode className="w-20 h-20 text-white" />
                    <span className="text-xs font-mono font-bold mt-1 tracking-widest">
                      {user.code}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="font-bold text-sm text-slate-900">{user.name}</div>
                <div className="text-xs text-slate-500 font-mono mt-0.5">
                  รหัสประจำตัว: {user.code}
                </div>
                <div className="text-[11px] font-medium text-primary mt-1">
                  สถานะ: {user.role === "STUDENT" ? "นิสิตคณะพุทธศาสตร์" : "คณาจารย์ / บุคลากร"}
                </div>
              </div>
            </div>

            <Button
              onClick={() => setShowQRModal(false)}
              className="w-full bg-slate-900 text-white hover:bg-slate-800 rounded-xl"
            >
              ปิดหน้าต่าง
            </Button>
          </div>
        </div>
      )}

      {/* ══════════ Activity Transcript Printable Modal ══════════ */}
      {transcriptData && (
        <StudentActivityTranscriptDocument
          data={transcriptData}
          onClose={() => setTranscriptData(null)}
        />
      )}
    </div>
  );
}
