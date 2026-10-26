/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  ArrowRight,
  UserCheck,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { publicSelfCheckInEventAction } from "@/features/events/actions";
import { toast } from "sonner";
import Link from "next/link";

interface SelfCheckinClientProps {
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
}

export function SelfCheckinClient({ event }: SelfCheckinClientProps) {
  const [code, setCode] = useState("");
  const [rememberCode, setRememberCode] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof publicSelfCheckInEventAction>> | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ดึงรหัสนิสิตที่เคยบันทึกไว้ใน Browser
  useEffect(() => {
    const saved = localStorage.getItem("mcu_student_code");
    if (saved) {
      setCode(saved);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanCode = code.trim();
    if (!cleanCode) {
      toast.error("กรุณากรอกรหัสนิสิต หรืออีเมลอาจารย์/บุคลากร");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const res = await publicSelfCheckInEventAction(event.id, cleanCode);
      if (res && res.success) {
        setResult(res);
        toast.success(res.message || "เช็คชื่อเข้าร่วมกิจกรรมสำเร็จแล้ว!");
        if (rememberCode) {
          localStorage.setItem("mcu_student_code", cleanCode);
        }
      } else {
        setErrorMsg("ไม่สามารถเช็คชื่อได้ กรุณาลองใหม่อีกครั้ง");
      }
    } catch (err: unknown) {
      console.error("Check-in error:", err);
      const msg = (err instanceof Error ? err.message : String(err)) || "เกิดข้อผิดพลาดในการเช็คชื่อ";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const handleResetForAnother = () => {
    setResult(null);
    setCode("");
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-slate-50 to-slate-100 py-8 px-4 flex flex-col justify-between items-center font-sans">
      <div className="w-full max-w-md space-y-6">
        
        {/* หัวกระดาษสถาบันและตราธรรมจักร */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-md shadow-amber-500/20 items-center justify-center">
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-amber-400 font-bold text-2xl">
              ☸
            </div>
          </div>
          <div>
            <h2 className="text-sm font-bold text-amber-900 tracking-wide">
              มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
            </h2>
            <p className="text-xs font-semibold text-slate-600">
              คณะพุทธศาสตร์ • ระบบเช็คชื่อเข้าร่วมกิจกรรมออนไลน์
            </p>
          </div>
        </div>

        {/* ข้อมูลกิจกรรม */}
        <div className="bg-white border border-amber-200/80 rounded-2xl p-4 shadow-sm space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="bg-amber-100 text-amber-800 text-2xs font-bold px-2 py-0.5 rounded-full">
              {event.eventType || "กิจกรรมและโครงการ"}
            </span>
            <span className="bg-indigo-50 text-indigo-700 text-2xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" /> {event.activityHours || 3} ชั่วโมงกิจกรรม
            </span>
          </div>

          <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
            {event.title}
          </h1>

          <div className="text-2xs sm:text-xs text-slate-500 space-y-1 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                {new Date(event.startDate).toLocaleDateString("th-TH", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{new Date(event.startDate).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="truncate">{event.location || "หอประชุม มวก. 48 พรรษา"}</span>
            </div>
          </div>
        </div>

        {/* กรณีเช็คชื่อสำเร็จแล้ว (Show Check-in Receipt Card) */}
        {result ? (
          <div className="bg-white border-2 border-emerald-500 rounded-3xl p-6 shadow-xl text-center space-y-5 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <div className="inline-block bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full mb-1">
                เช็คชื่อสำเร็จแล้ว (Check-in Verified)
              </div>
              <h2 className="text-xl font-black text-slate-900 mt-1">
                {result.studentName}
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                รหัส: {result.studentCode}
              </p>
            </div>

            {/* รายละเอียดการเข้าร่วม */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs space-y-2 text-left">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">บทบาท:</span>
                <span className="font-semibold text-slate-800">
                  {result.role === "EXECUTIVE" ? "👑 คณะผู้บริหาร/แขกพิเศษ" : result.role === "TEACHER" ? "👨‍🏫 อาจารย์" : "🎓 นิสิต"}
                </span>
              </div>
              {result.department && (
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">สังกัด / สาขาวิชา:</span>
                  <span className="font-semibold text-slate-800 text-right truncate max-w-[200px]">
                    {result.major || result.department}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">ชั่วโมงกิจกรรมที่ได้รับ:</span>
                <span className="font-bold text-amber-600 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> +{result.activityHours || 3} ชั่วโมง
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">เวลาที่เช็คชื่อ:</span>
                <span className="font-medium text-slate-700">
                  {new Date(result.attendedAt).toLocaleTimeString("th-TH", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })} น.
                </span>
              </div>
            </div>

            {result.isNewRegistration && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-2.5 text-2xs text-left">
                ✨ บันทึกการลงทะเบียนหน้างานให้อัตโนมัติเรียบร้อยแล้ว
              </div>
            )}

            {/* ปุ่มดำเนินการต่อ */}
            <div className="space-y-2 pt-2">
              <Link
                href={`/portal/events/${event.id}/evaluate?code=${encodeURIComponent(result.studentCode)}`}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white font-bold py-3.5 rounded-xl text-xs sm:text-sm shadow-md transition cursor-pointer"
              >
                <span>📝 ทำแบบประเมินความพึงพอใจเพื่อรับเกียรติบัตร</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={handleResetForAnother}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl text-xs sm:text-sm shadow-md transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>เช็คชื่อให้เพื่อนอีกคน (Check-in for Another)</span>
              </button>

              <Link
                href="/portal/activities"
                className="w-full inline-flex items-center justify-center gap-1.5 text-xs text-primary font-semibold hover:underline py-2"
              >
                <span>ดูประวัติกิจกรรมของฉันในพอร์ทัล</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          /* ฟอร์มกรอกรหัสนิสิตเพื่อเช็คชื่อ */
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="text-center space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                กรอกรหัสนิสิต เพื่อเช็คชื่อเข้างาน
              </h3>
              <p className="text-xs text-slate-500">
                (อาจารย์หรือบุคลากรสามารถใช้อีเมลหรือชื่อ-นามสกุลได้)
              </p>
            </div>

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700 flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  รหัสนิสิต (Student ID) / อีเมลอาจารย์
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    required
                    autoFocus
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="เช่น 6401201001 หรือ email@mcu.ac.th"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 rounded-xl py-3 px-3.5 text-sm font-mono text-slate-900 focus:outline-hidden transition shadow-2xs"
                  />
                  <div className="absolute right-3 text-slate-400">
                    <UserCheck className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberCode}
                    onChange={(e) => setRememberCode(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>จำรหัสนิสิตไว้ในเครื่องนี้</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting || !code.trim()}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl text-sm shadow-lg shadow-amber-600/30 transition cursor-pointer"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>กำลังตรวจสอบข้อมูล...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>✓ ยืนยันการเช็คชื่อเข้างาน (Check In)</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

      </div>

      <footer className="text-center py-4 text-2xs text-slate-400">
        คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย © 2026
      </footer>
    </div>
  );
}
