"use client";

import { useEffect, useState, use } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  AlertCircle,
  QrCode,
  Clock,
  MapPin,
  Calendar,
  Sparkles,
  ArrowRight,
  RefreshCw,
  GraduationCap,
} from "lucide-react";
import {
  studentCheckInWithQrAction,
  getPublicSessionForCheckInAction,
} from "@/features/attendance/actions";
import { toast } from "sonner";
import Link from "next/link";

export default function StudentQrScanPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") || "";
  const token = searchParams.get("token") || "";
  const stepParam = searchParams.get("step");
  const step = stepParam ? parseInt(stepParam, 10) : undefined;

  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [studentCode, setStudentCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkInResult, setCheckInResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ดึงข้อมูลวิชาและรหัสนิสิตที่เคยบันทึกไว้ใน Browser
  useEffect(() => {
    const savedCode = localStorage.getItem("mcu_student_code");
    if (savedCode) {
      setStudentCode(savedCode);
    }

    if (!sessionId) {
      setErrorMessage("ไม่พบรหัสคาบเรียน กรุณาสแกน QR Code จากหน้าจออาจารย์ใหม่อีกครั้ง");
      setLoadingSession(false);
      return;
    }

    getPublicSessionForCheckInAction(sessionId)
      .then((res) => {
        if (res.success && res.session) {
          setSessionInfo(res.session);
        } else {
          setErrorMessage("ไม่พบข้อมูลคาบเรียนนี้ หรืออาจถูกยกเลิกไปแล้ว");
        }
      })
      .catch((err) => {
        setErrorMessage(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูลคาบเรียน");
      })
      .finally(() => {
        setLoadingSession(false);
      });
  }, [sessionId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentCode.trim()) {
      toast.error("กรุณาระบุรหัสนิสิต");
      return;
    }
    if (!token) {
      toast.error("ไม่พบรหัส QR Token กรุณาสแกนใหม่อีกครั้ง");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);

      const res = await studentCheckInWithQrAction({
        sessionId,
        studentCode: studentCode.trim(),
        token,
        step,
      });

      if (res.success) {
        setCheckInResult(res);
        localStorage.setItem("mcu_student_code", studentCode.trim());
        toast.success(
          res.alreadyCheckedIn
            ? "ยืนยันผลการเช็กชื่อของคุณเรียบร้อยแล้ว"
            : "เช็กชื่อเข้าเรียนสำเร็จเรียบร้อยแล้ว!"
        );
      }
    } catch (err: any) {
      const msg = err.message || "เกิดข้อผิดพลาดในการเช็กชื่อ";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const dateStr = sessionInfo?.date
    ? new Intl.DateTimeFormat("th-TH", {
        dateStyle: "medium",
      }).format(new Date(sessionInfo.date))
    : "";

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8 px-4 sm:px-6">
      <div className="w-full max-w-md">
        {/* Success State */}
        {checkInResult ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-7 border border-emerald-200 dark:border-emerald-800 shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="space-y-1.5">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                สถานะ: มาเรียน (PRESENT)
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white pt-2">
                เช็กชื่อสำเร็จแล้ว!
              </h2>
              <p className="text-xs text-slate-500">
                ระบบได้บันทึกเวลาเข้าเรียนของท่านลงในฐานข้อมูลเรียบร้อยแล้ว
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500">ชื่อ - นามสกุล:</span>
                <span className="font-bold text-slate-900 dark:text-white">{checkInResult.studentName}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500">รหัสนิสิต:</span>
                <span className="font-mono font-bold text-primary">{checkInResult.studentCode}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500">รายวิชา:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{checkInResult.courseName}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500">คาบที่:</span>
                <span className="font-bold text-slate-900 dark:text-white">{checkInResult.sessionNumber}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">เวลาที่บันทึก:</span>
                <span className="font-bold text-emerald-600">{checkInResult.checkInTime} น.</span>
              </div>
            </div>

            <Link
              href="/portal/attendance"
              className="inline-flex items-center justify-center w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition shadow-xs"
            >
              กลับสู่หน้าหลัก
            </Link>
          </div>
        ) : (
          /* Check-In Form */
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-7 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                <QrCode className="w-3.5 h-3.5" />
                เช็กชื่อเข้าเรียนในชั้นเรียน
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                สแกนเช็กชื่อ (QR Check-In)
              </h1>
              <p className="text-xs text-slate-500">
                กรอกรหัสนิสิตของท่านเพื่อยืนยันการเข้าชั้นเรียน
              </p>
            </div>

            {/* Session Card Info */}
            {sessionInfo && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-lg bg-primary/15 text-primary text-2xs font-extrabold font-mono">
                    {sessionInfo.course.courseCode}
                  </span>
                  <span className="text-2xs font-bold text-slate-500">
                    คาบที่ {sessionInfo.sessionNumber}
                  </span>
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                  {sessionInfo.course.courseName}
                </div>
                {sessionInfo.topic && (
                  <p className="text-xs text-slate-500 line-clamp-1">
                    หัวข้อ: {sessionInfo.topic}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3 pt-1 text-2xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-primary" /> {dateStr}
                  </span>
                  {sessionInfo.startTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-500" /> {sessionInfo.startTime} - {sessionInfo.endTime} น.
                    </span>
                  )}
                  {sessionInfo.room && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" /> {sessionInfo.room}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold">เกิดข้อผิดพลาด:</span>
                  <p>{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  รหัสนิสิต <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="เช่น 6601001"
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <p className="text-2xs text-slate-400 mt-1">
                  *ระบุเฉพาะรหัสที่ลงทะเบียนไว้ในรายวิชานี้
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting || loadingSession || !sessionInfo}
                className="w-full py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    กำลังตรวจสอบข้อมูล...
                  </>
                ) : (
                  <>
                    <span>ยืนยันการเข้าเรียน (Check In)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center">
              <p className="text-2xs text-slate-400">
                🔒 Dynamic Rolling QR Code System: รหัสสลับเปลี่ยนอัตโนมัติทุก 20 วินาที เพื่อป้องกันการส่งต่อภาพ
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
