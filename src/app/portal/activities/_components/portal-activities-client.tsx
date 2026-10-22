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
  Users,
  Search,
  ExternalLink,
  ChevronRight,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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

export function PortalActivitiesClient({ initialData, user, locale }: Props) {
  const [activeTab, setActiveTab] = useState<"MY_EVENTS" | "ALL_EVENTS">("MY_EVENTS");
  const [search, setSearch] = useState("");
  const [showQRModal, setShowQRModal] = useState(false);

  const { myRegistrations, availableEvents, totalAttendedHours } = initialData;

  const attendedCount = myRegistrations.filter((r) => r.status === "ATTENDED").length;
  const pendingCount = myRegistrations.filter((r) => r.status === "REGISTERED").length;

  const filteredRegistrations = myRegistrations.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.event.title.toLowerCase().includes(q) ||
      (r.event.location || "").toLowerCase().includes(q)
    );
  });

  const filteredAvailable = availableEvents.filter((ev) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      ev.title.toLowerCase().includes(q) ||
      (ev.location || "").toLowerCase().includes(q)
    );
  });

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
              ? "ตรวจสอบตารางกิจกรรม พิธีเปิดภาคการศึกษา ประวัติการเข้าร่วม และชั่วโมงกิจกรรมสะสม"
              : "View activity schedule, opening ceremonies, attendance history, and activity hours"}
          </p>
        </div>

        {/* Digital Event Pass Button */}
        {user.code && (
          <Button
            onClick={() => setShowQRModal(true)}
            className="gap-2 bg-primary text-primary-foreground font-semibold rounded-xl shadow-xs"
          >
            <QrCode className="w-4 h-4" />
            <span>{locale === "th" ? "บัตร QR เช็คชื่อประจำตัว" : "My Event QR Pass"}</span>
          </Button>
        )}
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
          <div className="text-2xs text-muted-foreground mt-1">
            ผ่านการเข้าร่วมและยืนยันเวลาเรียบร้อย
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
            มีบันทึกการเช็คชื่อในระบบ
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-200 dark:border-blue-900/40 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-blue-700 dark:text-blue-400">
            <span>รอเข้าร่วม / ต้องเข้าร่วม</span>
            <Clock3 className="w-4 h-4" />
          </div>
          <div className="text-3xl font-black text-blue-800 dark:text-blue-300 mt-2">
            {pendingCount}{" "}
            <span className="text-sm font-normal text-muted-foreground">กิจกรรม</span>
          </div>
          <div className="text-2xs text-muted-foreground mt-1">
            กิจกรรมที่มีรายชื่อลงทะเบียนไว้
          </div>
        </div>
      </div>

      {/* ══════════ Navigation Tabs & Search ══════════ */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div className="inline-flex rounded-xl border border-border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("MY_EVENTS")}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
              activeTab === "MY_EVENTS"
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {locale === "th"
              ? `กิจกรรมของฉัน (${myRegistrations.length})`
              : `My Activities (${myRegistrations.length})`}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ALL_EVENTS")}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
              activeTab === "ALL_EVENTS"
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {locale === "th" ? "กิจกรรมทั้งหมดของมหาวิทยาลัย" : "All University Events"}
          </button>
        </div>

        <div className="relative w-full sm:w-72">
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

      {/* ══════════ Tab 1: My Activities ══════════ */}
      {activeTab === "MY_EVENTS" && (
        <div className="space-y-4">
          {filteredRegistrations.map((reg) => {
            const isAttended = reg.status === "ATTENDED";
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
                      {reg.event.location || "มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย"}
                    </span>
                  </div>
                </div>

                {/* Right Badge / Status */}
                <div className="flex flex-col items-start md:items-end justify-center shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-border">
                  {isAttended ? (
                    <div className="text-left md:text-right">
                      <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> ยืนยันเวลาเรียน/กิจกรรมแล้ว
                      </div>
                      {reg.attendedAt && (
                        <div className="text-2xs text-muted-foreground mt-0.5">
                          เช็คชื่อเมื่อ: {new Date(reg.attendedAt).toLocaleString("th-TH")}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-left md:text-right space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">
                        กรุณายื่นบัตร QR หรือแจ้งรหัส {user.code} หน้างาน
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowQRModal(true)}
                        className="text-xs gap-1"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>แสดงบัตร QR</span>
                      </Button>
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
                ท่านสามารถตรวจสอบกิจกรรมทั้งหมดของมหาวิทยาลัยได้ที่แท็บด้านบน
              </p>
            </div>
          )}
        </div>
      )}

      {/* ══════════ Tab 2: All University Events ══════════ */}
      {activeTab === "ALL_EVENTS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAvailable.map((ev) => (
            <div
              key={ev.id}
              className="bg-card border border-border rounded-2xl p-5 shadow-2xs hover:shadow-md transition space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {ev.eventType === "CEREMONY"
                    ? "พิธีการ / พิธีเปิด"
                    : ev.eventType === "ACADEMIC"
                    ? "สัมมนาวิชาการ"
                    : "กิจกรรมทั่วไป"}
                </span>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
                  {ev.activityHours || 3} ชม. กิจกรรม
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-foreground">{ev.title}</h3>
                {ev.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {ev.description}
                  </p>
                )}
              </div>

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
                    น. เป็นต้นไป
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span className="truncate">{ev.location}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between text-2xs text-muted-foreground">
                <span>กลุ่มเป้าหมาย: {ev.targetGroup || "นิสิตและคณาจารย์"}</span>
                <span className="text-primary font-semibold flex items-center gap-0.5">
                  รายละเอียด <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}

          {filteredAvailable.length === 0 && (
            <div className="col-span-full py-16 text-center bg-card border border-dashed border-border rounded-2xl">
              <div className="text-sm font-semibold text-foreground">
                ไม่พบรายการกิจกรรมอื่นๆ
              </div>
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

            {/* QR Card Presentation */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col items-center space-y-3">
              <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                <QrCode className="w-36 h-36 text-slate-900" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-mono font-bold text-primary text-base">
                  {user.code}
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {user.name}
                </div>
                <div className="text-2xs text-slate-500">
                  {user.role === "TEACHER" ? "คณาจารย์ / อาจารย์ผู้บรรยาย" : "นิสิต คณะพุทธศาสตร์"}
                </div>
              </div>
            </div>

            <Button
              onClick={() => setShowQRModal(false)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl"
            >
              ปิดหน้าต่าง
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
