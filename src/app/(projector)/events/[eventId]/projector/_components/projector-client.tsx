"use client";

import { useEffect, useState, useCallback } from "react";
import QRCode from "qrcode";
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Users,
  CheckCircle2,
  Maximize2,
  Minimize2,
  RefreshCw,
  ArrowLeft,
  Copy,
  Check,
  Smartphone,
  ExternalLink,
  Printer,
} from "lucide-react";
import { getEventProjectorDataAction } from "@/features/events/actions";
import { toast } from "sonner";
import Link from "next/link";
import { EventQrStandeeModal } from "@/app/(admin)/events/[eventId]/registrations/_components/event-qr-standee-modal";

interface ProjectorClientProps {
  initialData: {
    event: {
      id: string;
      title: string;
      description?: string | null;
      location?: string | null;
      startDate: string;
      endDate: string;
      activityHours?: number | null;
      eventType?: string | null;
      targetGroup?: string | null;
      academicYear?: string | null;
    };
    stats: {
      total: number;
      attended: number;
      pending: number;
      percent: number;
    };
    recentCheckIns: Array<{
      id: string;
      studentName: string;
      studentCode: string;
      role: string;
      major?: string | null;
      department?: string | null;
      attendedAt: string | null;
    }>;
  };
}

export function ProjectorClient({ initialData }: ProjectorClientProps) {
  const [data, setData] = useState(initialData);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [checkinUrl, setCheckinUrl] = useState<string>("");
  const [qrMode, setQrMode] = useState<"CHECKIN" | "EVALUATION">("CHECKIN");
  const [isStandeeModalOpen, setIsStandeeModalOpen] = useState(false);

  const event = data.event;
  const stats = data.stats;
  const recentCheckIns = data.recentCheckIns;

  // ตั้งค่า URL และสร้างภาพ QR Code ตามโหมด (เช็คชื่อ หรือ ทำแบบประเมิน)
  useEffect(() => {
    const origin = window.location.origin;
    const targetPath = qrMode === "CHECKIN" ? "checkin" : "evaluate";
    const url = `${origin}/portal/events/${event.id}/${targetPath}`;
    setCheckinUrl(url);

    QRCode.toDataURL(url, {
      width: 450,
      margin: 2,
      color: {
        dark: qrMode === "CHECKIN" ? "#0f172a" : "#3b0764",
        light: "#ffffff",
      },
      errorCorrectionLevel: "H",
    })
      .then((dataUrl) => {
        setQrDataUrl(dataUrl);
      })
      .catch((err) => {
        console.error("Failed to generate QR code", err);
      });
  }, [event.id, qrMode]);

  // นาฬิกาบอกเวลาสดแบบเรียลไทม์
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // ฟังก์ชันดึงสถิติสด
  const fetchStats = useCallback(async (showToast = false) => {
    try {
      setIsRefreshing(true);
      const res = await getEventProjectorDataAction(event.id);
      setData(res);
      if (showToast) {
        toast.success("อัปเดตสถิติล่าสุดแล้ว");
      }
    } catch (err: any) {
      console.error("Error refreshing projector stats:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [event.id]);

  // Auto-polling ทุก ๆ 4 วินาที เพื่อให้ตัวเลขหน้าจอขยับสดเมื่อมีคนสแกน
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats(false);
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  // สลับโหมดขยายเต็มหน้าจอโปรเจกเตอร์ (Fullscreen)
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        toast.error("ไม่สามารถเปิดโหมดเต็มจอได้: " + err.message);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const handleCopyLink = () => {
    if (!checkinUrl) return;
    navigator.clipboard.writeText(checkinUrl);
    setCopied(true);
    toast.success("คัดลอกลิงก์เช็คชื่อเรียบร้อยแล้ว");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-radial from-slate-900 via-slate-950 to-black text-slate-100 flex flex-col justify-between p-4 md:p-8 select-none overflow-x-hidden font-sans">
      {/* ══════════ TOP BAR: มหาวิทยาลัย + นาฬิกา + ปุ่มควบคุม ══════════ */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        {/* ตราสัญลักษณ์และชื่อสถาบัน */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 flex items-center justify-center shrink-0">
            <img
              src="/uploads/mcu-official-seal.png"
              alt="ตราสัญลักษณ์ มจร"
              className="w-11 h-11 object-contain drop-shadow-md"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/uploads/mcu-logo.png";
              }}
            />
          </div>
          <div>
            <div className="text-sm md:text-base font-bold text-amber-400 tracking-wide">
              มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย • คณะพุทธศาสตร์
            </div>
            <div className="text-2xs md:text-xs text-slate-400 font-medium">
              Faculty of Buddhism, Mahachulalongkornrajavidyalaya University
            </div>
          </div>
        </div>

        {/* สถานะสด + นาฬิกาดิจิทัล + ปุ่มควบคุม */}
        <div className="flex items-center gap-3 md:gap-5">
          {/* สถานะ LIVE */}
          <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 px-3 py-1.5 rounded-full text-xs font-semibold shadow-inner">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span>LIVE CHECK-IN</span>
          </div>

          {/* นาฬิกาแบบเรียลไทม์ */}
          <div className="bg-slate-900/90 border border-slate-800 text-amber-300 font-mono text-base md:text-xl font-bold px-3.5 py-1.5 rounded-xl shadow-inner">
            🕒 {currentTime || "--:--:--"}
          </div>

          {/* ปุ่มรีเฟรช */}
          <button
            onClick={() => fetchStats(true)}
            disabled={isRefreshing}
            title="รีเฟรชข้อมูลสด"
            className="p-2 md:p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 md:w-5 md:h-5 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
          </button>

          {/* ปุ่มขยายเต็มจอ (Fullscreen) สำหรับต่อโปรเจกเตอร์ */}
          <button
            onClick={toggleFullscreen}
            title="เปิดโหมดเต็มจอโปรเจกเตอร์ (Fullscreen)"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs md:text-sm shadow-lg shadow-amber-600/30 border border-amber-400 transition cursor-pointer"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4" />
                <span className="hidden sm:inline">ย่อจอ</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4" />
                <span className="hidden sm:inline">ขยายเต็มจอ</span>
              </>
            )}
          </button>

          {/* ปุ่มพิมพ์ป้าย QR A4 */}
          <button
            onClick={() => setIsStandeeModalOpen(true)}
            title="พิมพ์ป้าย QR Code ตั้งโต๊ะ A4 (Print Standee)"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-semibold text-xs md:text-sm shadow-md border border-purple-500 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">พิมพ์ป้าย A4</span>
          </button>

          {/* ปุ่มกลับไปหน้ารายชื่อ */}
          <Link
            href={`/events/${event.id}/registrations`}
            className="p-2 md:p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
            title="ปิดหน้าจอโปรเจกเตอร์"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
          </Link>
        </div>
      </header>

      {/* ══════════ MAIN CONTENT: แบ่ง 2 คอลัมน์ (ข้อมูลกิจกรรม & QR Code ยักษ์) ══════════ */}
      <main className="flex-1 my-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
        
        {/* ─── ฝั่งซ้าย (5 หรือ 6 cols): ข้อมูลกิจกรรมและสถิติดิจิทัล ─── */}
        <div className="lg:col-span-6 space-y-6">
          {/* Badge & หัวข้อโครงการ */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs md:text-sm font-semibold px-3 py-1 rounded-full">
                {event.eventType || "กิจกรรมและโครงการสำคัญ"}
              </span>
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs md:text-sm font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> {event.activityHours || 3} ชั่วโมงกิจกรรม
              </span>
              {event.academicYear && (
                <span className="bg-slate-800 text-slate-300 text-xs md:text-sm px-2.5 py-1 rounded-full">
                  ปีการศึกษา {event.academicYear}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-md">
              {event.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm md:text-base text-slate-300 pt-1">
              <span className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-4 h-4 text-amber-400" />
                {new Date(event.startDate).toLocaleDateString("th-TH", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-amber-400" />
                {new Date(event.startDate).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.
              </span>
              <span className="flex items-center gap-1.5 font-medium text-amber-200">
                <MapPin className="w-4 h-4 text-amber-400" />
                {event.location || "หอประชุม มวก. 48 พรรษา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย"}
              </span>
            </div>
          </div>

          {/* กล่องสรุปยอดผู้เข้าร่วมสด (Live Counter Card) */}
          <div className="bg-slate-900/80 border border-slate-700/80 rounded-3xl p-5 md:p-6 shadow-2xl backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between text-xs md:text-sm text-slate-400">
              <span className="flex items-center gap-1.5 font-semibold text-slate-300 uppercase tracking-wider">
                <Users className="w-4 h-4 text-amber-400" /> สถิติการเช็คชื่อเข้างาน (Realtime)
              </span>
              <span className="text-amber-400 font-mono text-sm font-bold">
                {stats.percent}%
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-3 md:p-4">
                <div className="text-2xs sm:text-xs font-semibold text-emerald-400">เช็คชื่อแล้ว</div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-black text-emerald-300 font-mono mt-1">
                  {stats.attended}
                </div>
                <div className="text-2xs text-emerald-500 mt-0.5">ท่าน (Attended)</div>
              </div>

              <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-3 md:p-4">
                <div className="text-2xs sm:text-xs font-semibold text-amber-400">ยังไม่เช็คชื่อ</div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-black text-amber-300 font-mono mt-1">
                  {stats.pending}
                </div>
                <div className="text-2xs text-amber-500 mt-0.5">ท่าน (Pending)</div>
              </div>

              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-3 md:p-4">
                <div className="text-2xs sm:text-xs font-semibold text-slate-400">ยอดรวมทั้งหมด</div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-black text-white font-mono mt-1">
                  {stats.total}
                </div>
                <div className="text-2xs text-slate-400 mt-0.5">ท่าน (Total)</div>
              </div>
            </div>

            {/* Progress bar เส้นใหญ่ */}
            <div className="w-full bg-slate-800 rounded-full h-3 md:h-4 overflow-hidden border border-slate-700">
              <div
                className="bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 h-full rounded-full transition-all duration-700 shadow-md"
                style={{ width: `${stats.percent}%` }}
              />
            </div>
          </div>

          {/* แถบรายชื่อที่เพิ่งสแกนสำเร็จล่าสุด (Live Ticker) */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-2.5">
            <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                รายชื่อที่เพิ่งสแกนสำเร็จ (Live Ticker):
              </span>
              <span className="text-2xs text-slate-500 font-mono">อัปเดตอัตโนมัติ</span>
            </div>

            {recentCheckIns.length === 0 ? (
              <div className="text-xs text-slate-500 italic py-2 text-center">
                กำลังรอการสแกนเช็คชื่อจากนิสิตและผู้เข้าร่วมในหอประชุม...
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {recentCheckIns.map((item) => (
                  <div
                    key={item.id}
                    className="inline-flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-full text-xs text-slate-200 shadow-xs animate-in fade-in duration-300"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="font-semibold text-white">{item.studentName}</span>
                    <span className="text-slate-400 text-2xs font-mono">({item.studentCode})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── ฝั่งขวา (6 หรือ 7 cols): ป้าย QR Code คมชัดสูงสำหรับจอโปรเจกเตอร์ ─── */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center">
          <div className="w-full max-w-lg bg-gradient-to-b from-amber-400/20 via-slate-900/80 to-slate-950 p-1 rounded-3xl shadow-2xl border-2 border-amber-400/40 relative group">
            
            {/* กล่องสีขาวพื้นหลังสำหรับ QR Code คมชัดเป็นพิเศษ */}
            <div className="bg-white rounded-[22px] p-6 sm:p-8 flex flex-col items-center justify-center text-slate-900 shadow-xl">
              
              {/* หัวข้อบน QR */}
              <div className="w-full space-y-2 mb-3">
                {/* ปุ่มสลับโหมด เช็คชื่อเข้างาน vs ทำแบบประเมิน */}
                <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setQrMode("CHECKIN")}
                    className={`py-1.5 px-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
                      qrMode === "CHECKIN"
                        ? "bg-amber-600 text-white shadow-xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>เช็คชื่อเข้างาน</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrMode("EVALUATION")}
                    className={`py-1.5 px-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
                      qrMode === "EVALUATION"
                        ? "bg-purple-700 text-white shadow-xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>📝 ทำแบบประเมิน</span>
                  </button>
                </div>

                <div className="text-center">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-1 ${
                    qrMode === "CHECKIN" ? "bg-amber-100 text-amber-900" : "bg-purple-100 text-purple-900"
                  }`}>
                    {qrMode === "CHECKIN" ? (
                      <>
                        <Smartphone className="w-3.5 h-3.5 text-amber-700" />
                        <span>สแกนเช็คชื่อเข้างาน (Scan Check-in)</span>
                      </>
                    ) : (
                      <>
                        <span>📝 สแกนทำแบบประเมินและรับเกียรติบัตร</span>
                      </>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    {qrMode === "CHECKIN" ? "สแกนด้วยกล้องมือถือเพื่อเช็คชื่อ" : "สแกนทำแบบประเมินความพึงพอใจ"}
                  </h3>
                  <p className="text-2xs sm:text-xs text-slate-500">
                    {qrMode === "CHECKIN" ? "เปิดกล้องโทรศัพท์ หรือ LINE สแกน QR ด้านล่าง" : "ประเมินเสร็จแล้ว สามารถดาวน์โหลดเกียรติบัตรได้ทันที"}
                  </p>
                </div>
              </div>

              {/* รูปภาพ QR Code ขนาดยักษ์ คมชัดสูง */}
              <div className="relative p-2 bg-white rounded-2xl border-4 border-slate-900/10 shadow-inner flex items-center justify-center">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Event Check-in QR Code"
                    className="w-64 h-64 sm:w-80 sm:h-80 md:w-88 md:h-88 object-contain"
                  />
                ) : (
                  <div className="w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center text-slate-400 text-sm">
                    กำลังสร้าง QR Code...
                  </div>
                )}
              </div>

              {/* คำแนะนำใต้ QR */}
              <div className="mt-4 text-center space-y-1">
                <p className="text-xs sm:text-sm font-semibold text-slate-800">
                  ✨ ไม่ต้องลงแอปพลิเคชัน • กรอกรหัสนิสิตหรือสแกนปุ๊บ บันทึกปั๊บ
                </p>
                <p className="text-2xs sm:text-xs text-slate-500">
                  ได้รับ {event.activityHours || 3} ชั่วโมงกิจกรรมทันทีเมื่อเช็คชื่อสำเร็จ
                </p>
              </div>

              {/* ลิงก์ตรงสำหรับผู้ที่ไม่สะดวกสแกนกล้อง */}
              <div className="mt-4 w-full pt-3 border-t border-slate-200 flex items-center justify-between gap-2 text-2xs text-slate-500">
                <div className="truncate font-mono">
                  เว็บ: <span className="text-slate-800 font-semibold">{checkinUrl}</span>
                </div>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md font-semibold transition shrink-0 cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}</span>
                </button>
              </div>

            </div>
          </div>
        </div>

      </main>

      {/* ══════════ FOOTER: คำแนะนำและปุ่มเปิดคู่ขนาน ══════════ */}
      <footer className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-2xs md:text-xs text-slate-500">
        <div>
          💡 แนะนำ: กดปุ่ม <span className="text-amber-400 font-semibold">"ขยายเต็มจอ"</span> หรือกดปุ่ม <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700 font-mono">F11</kbd> เพื่อฉายภาพขึ้นจอโปรเจกเตอร์ในหอประชุมได้อย่างเต็มตา
        </div>
        <div className="flex items-center gap-3">
          <a
            href={checkinUrl}
            target="_blank"
            rel="noreferrer"
            className="hover:text-amber-400 transition flex items-center gap-1 font-semibold"
          >
            <span>ทดสอบเปิดหน้าเช็คชื่อมือถือ</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <span>•</span>
          <span>คณะพุทธศาสตร์ มจร © 2026</span>
        </div>
      </footer>

      {/* ══════════ Printable A4 QR Standee Modal ══════════ */}
      {isStandeeModalOpen && (
        <EventQrStandeeModal
          event={event}
          initialMode={qrMode}
          onClose={() => setIsStandeeModalOpen(false)}
        />
      )}
    </div>
  );
}
