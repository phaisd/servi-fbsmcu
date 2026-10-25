"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  Sparkles,
  Award,
  Send,
  MessageSquare,
} from "lucide-react";
import { submitEventEvaluationAction } from "@/features/events/actions";
import { toast } from "sonner";
import Link from "next/link";

interface EventEvaluateClientProps {
  event: {
    id: string;
    title: string;
    description?: string | null;
    location?: string | null;
    startDate: string;
    endDate: string;
    activityHours?: number | null;
    eventType?: string | null;
  };
  config: {
    title: string;
    description: string;
    isActive: boolean;
    questions: Array<{
      id: string;
      category: string;
      label: string;
      description?: string;
      subQuestions?: Array<{
        id: string;
        label: string;
      }>;
    }>;
  };
}

const RATING_LEVELS = [
  { value: 5, label: "มากที่สุด", short: "5", color: "bg-emerald-600 text-white border-emerald-600" },
  { value: 4, label: "มาก", short: "4", color: "bg-teal-600 text-white border-teal-600" },
  { value: 3, label: "ปานกลาง", short: "3", color: "bg-amber-500 text-white border-amber-500" },
  { value: 2, label: "น้อย", short: "2", color: "bg-orange-500 text-white border-orange-500" },
  { value: 1, label: "น้อยที่สุด", short: "1", color: "bg-rose-500 text-white border-rose-500" },
];

export function EventEvaluateClient({ event, config }: EventEvaluateClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryCode = searchParams.get("code") || "";

  const [ratings, setRatings] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {
      lecturer: 5,
      content: 5,
      facility: 5,
      time: 5,
      overall: 5,
    };
    if (config?.questions) {
      config.questions.forEach((q) => {
        if (q.subQuestions && q.subQuestions.length > 0) {
          q.subQuestions.forEach((sq) => {
            initial[sq.id] = 5;
          });
        }
      });
    }
    return initial;
  });
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRatingChange = (key: string, value: number) => {
    setRatings((prev) => ({ ...prev, [key]: value }));
  };

  const calcCategoryAvg = (category: string) => {
    const catQ = config.questions.find((q) => q.category === category);
    if (catQ && catQ.subQuestions && catQ.subQuestions.length > 0) {
      const scores = catQ.subQuestions.map((sq) => ratings[sq.id] ?? 5);
      const sum = scores.reduce((a, b) => a + b, 0);
      return Math.round((sum / scores.length) * 100) / 100;
    }
    return ratings[category] ?? 5;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const payload = {
        studentCode: "ANONYMOUS",
        ratingLecturer: calcCategoryAvg("lecturer"),
        ratingContent: calcCategoryAvg("content"),
        ratingFacility: calcCategoryAvg("facility"),
        ratingTime: calcCategoryAvg("time"),
        ratingOverall: calcCategoryAvg("overall"),
        customAnswers: ratings,
        feedback: feedback.trim() || undefined,
      };

      const res = await submitEventEvaluationAction(event.id, payload);
      if (res && res.success) {
        setResult(res);
        toast.success("บันทึกการส่งแบบประเมินความพึงพอใจเรียบร้อยแล้ว!");
      }
    } catch (err: any) {
      console.error("Evaluation submission error:", err);
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการส่งแบบประเมิน");
      toast.error(err.message || "เกิดข้อผิดพลาดในการส่งแบบประเมิน");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/60 via-slate-50 to-slate-100 py-6 px-4 flex flex-col justify-between items-center font-sans">
      <div className="w-full max-w-xl space-y-6">
        
        {/* Header มจร */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center">
            <img
              src="/uploads/mcu-official-seal.png"
              alt="ตราสัญลักษณ์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย"
              className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-sm mx-auto"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/uploads/mcu-logo.png";
              }}
            />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-amber-950 tracking-wide">
              มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย คณะพุทธศาสตร์
            </h2>
            <p className="text-xs font-semibold text-slate-600 mt-0.5">
              ระบบแบบประเมินความพึงพอใจการจัดกิจกรรมและออกเกียรติบัตร
            </p>
          </div>
        </div>

        {/* ข้อมูลกิจกรรม */}
        <div className="bg-white border border-amber-200/90 rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-amber-100 text-amber-900 text-2xs font-bold px-2 py-0.5 rounded-full">
              {event.eventType || "โครงการสัมมนาและกิจกรรม"}
            </span>
            <span className="bg-indigo-50 text-indigo-700 text-2xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" /> {event.activityHours || 3} ชั่วโมงกิจกรรม
            </span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
            {event.title}
          </h1>
          <div className="text-2xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 border-t border-slate-100">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-amber-600" />
              {new Date(event.startDate).toLocaleDateString("th-TH", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-600" />
              {new Date(event.startDate).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.
            </span>
          </div>
        </div>

        {/* ผลลัพธ์เมื่อส่งแบบประเมินสำเร็จ (Success Card) */}
        {result ? (
          <div className="bg-white border-2 border-emerald-500 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-5 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <div className="inline-block bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
                ✓ บันทึกผลการประเมินความพึงพอใจเรียบร้อยแล้ว
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                ขอขอบพระคุณเป็นอย่างยิ่ง
              </h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย ขอขอบคุณที่ท่านได้สละเวลาประเมินและให้ข้อเสนอแนะอันมีค่ายิ่ง เพื่อนำไปพัฒนาการจัดกิจกรรมในโอกาสต่อไป
              </p>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 text-left space-y-1.5">
                <span className="font-bold flex items-center gap-1.5 text-amber-950">
                  <Award className="w-4 h-4 text-amber-700" /> ต้องการเช็คชื่อเข้างาน / รับเกียรติบัตรเข้าร่วมกิจกรรม?
                </span>
                <p className="text-2xs text-amber-800 leading-relaxed">
                  หากท่านต้องการบันทึกเวลาเข้าร่วมกิจกรรมหรือรับใบประกาศนียบัตร (Certificate) สามารถสแกน QR เช็คชื่อหน้างาน หรือกดที่ปุ่มด้านล่างเพื่อยืนยันรหัสนิสิตได้ครับ
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <Link
                  href={`/portal/events/${event.id}/checkin`}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-md transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>ไปที่หน้าเช็คชื่อ & รับเกียรติบัตร ↗</span>
                </Link>

                <Link
                  href="/portal/events"
                  className="inline-flex items-center justify-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold py-3 px-4 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  <span>กลับหน้ารายการกิจกรรม</span>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* ฟอร์มทำแบบประเมินความพึงพอใจ 5 ระดับ (Anonymous) */
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
            
            {/* คำชี้แจง */}
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                {config.title || "แบบประเมินความพึงพอใจการเข้าร่วมกิจกรรม"}
              </h2>
              <p className="text-2xs sm:text-xs text-slate-500 mt-1">
                {config.description || "คำชี้แจง: โปรดทำเครื่องหมายเลือกระดับความพึงพอใจตามความคิดเห็นของท่าน (5 = มากที่สุด, 1 = น้อยที่สุด)"}
              </p>
            </div>

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* กล่องแจ้งแบบประเมินไม่ระบุตัวตน (Anonymous Evaluation Banner) */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold mt-0.5">
                🔒
              </div>
              <div className="space-y-0.5">
                <span className="font-bold text-emerald-950 block">
                  แบบประเมินความพึงพอใจนี้เป็นแบบไม่ระบุตัวตน (Anonymous)
                </span>
                <p className="text-2xs text-emerald-800 leading-relaxed">
                  ท่านสามารถเลือกระดับความพึงพอใจและให้ข้อเสนอแนะได้อย่างอิสระ ไม่ต้องกรอกรหัสนิสิตหรือชื่อ เพื่อนำความคิดเห็นของท่านไปพัฒนาคุณภาพการจัดกิจกรรมของคณะพุทธศาสตร์ มจร ต่อไป
                </p>
              </div>
            </div>

            {/* ส่วนที่ 2: รายการประเมิน 5 ระดับ (Likert Scale) */}
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  หัวข้อการประเมินความพึงพอใจ
                </span>
                <span className="text-2xs text-slate-400">
                  (5=มากที่สุด, 1=น้อยที่สุด)
                </span>
              </div>

              {config.questions.map((q, idx) => {
                const hasSubs = q.subQuestions && q.subQuestions.length > 0;

                if (hasSubs) {
                  return (
                    <div
                      key={q.id || idx}
                      className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-amber-300 transition space-y-3.5 shadow-2xs"
                    >
                      <div className="border-b border-slate-100 pb-2.5">
                        <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center text-2xs font-mono font-bold">
                            {idx + 1}
                          </span>
                          <span>{q.label}</span>
                        </div>
                        {q.description && (
                          <div className="text-2xs text-slate-500 mt-1 pl-7">
                            {q.description}
                          </div>
                        )}
                      </div>

                      {/* Sub-questions List */}
                      <div className="space-y-3 pl-1 sm:pl-2">
                        {q.subQuestions!.map((subQ, sIdx) => {
                          const currentVal = ratings[subQ.id] || 5;
                          return (
                            <div
                              key={subQ.id || sIdx}
                              className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-2"
                            >
                              <div className="text-xs font-semibold text-slate-800 flex items-start gap-1.5 leading-snug">
                                <span className="text-2xs font-mono font-bold text-amber-700 mt-0.5 shrink-0">
                                  {idx + 1}.{sIdx + 1}
                                </span>
                                <span>{subQ.label}</span>
                              </div>

                              {/* Rating 1-5 buttons */}
                              <div className="grid grid-cols-5 gap-1.5 pt-0.5">
                                {RATING_LEVELS.map((lvl) => {
                                  const isSelected = currentVal === lvl.value;
                                  return (
                                    <button
                                      key={lvl.value}
                                      type="button"
                                      onClick={() => handleRatingChange(subQ.id, lvl.value)}
                                      className={`py-2 px-1 rounded-xl border text-center transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                                        isSelected
                                          ? `${lvl.color} shadow-2xs font-bold scale-[1.02]`
                                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                                      }`}
                                    >
                                      <span className="text-xs sm:text-sm font-mono font-bold leading-none">
                                        {lvl.short}
                                      </span>
                                      <span className="text-[10px] sm:text-2xs truncate max-w-full">
                                        {lvl.label}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                const currentVal = ratings[q.category] || 5;
                return (
                  <div
                    key={q.id || idx}
                    className="p-3.5 rounded-2xl border border-slate-200/90 hover:border-amber-300 hover:bg-amber-50/20 transition space-y-2.5"
                  >
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900">
                        {q.label}
                      </div>
                      {q.description && (
                        <div className="text-2xs text-slate-500 mt-0.5">
                          {q.description}
                        </div>
                      )}
                    </div>

                    {/* ปุ่มเลือกคะแนน 1-5 */}
                    <div className="grid grid-cols-5 gap-1.5 pt-1">
                      {RATING_LEVELS.map((lvl) => {
                        const isSelected = currentVal === lvl.value;
                        return (
                          <button
                            key={lvl.value}
                            type="button"
                            onClick={() => handleRatingChange(q.category, lvl.value)}
                            className={`py-2 px-1 rounded-xl border text-center transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                              isSelected
                                ? `${lvl.color} shadow-sm font-bold scale-[1.02]`
                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            <span className="text-xs sm:text-sm font-mono font-bold leading-none">
                              {lvl.short}
                            </span>
                            <span className="text-[10px] sm:text-2xs truncate max-w-full">
                              {lvl.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ส่วนที่ 3: ข้อเสนอแนะเพิ่มเติม */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                ข้อเสนอแนะเพื่อการปรับปรุงและพัฒนาในครั้งต่อไป:
              </label>
              <textarea
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="ระบุข้อเสนอแนะเพิ่มเติม เช่น หัวข้อที่ต้องการให้จัดในครั้งหน้า, สิ่งที่ประทับใจ หรือข้อควรปรับปรุง..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white focus:outline-hidden"
              />
            </div>

            {/* ปุ่มบันทึก */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl text-sm shadow-lg shadow-emerald-600/30 transition cursor-pointer"
              >
                {submitting ? (
                  <span>กำลังส่งผลประเมิน...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>✓ ส่งแบบประเมินความพึงพอใจ</span>
                  </>
                )}
              </button>
              <p className="text-center text-2xs text-slate-400 mt-2">
                * แบบประเมินนี้ส่งแบบไม่ระบุตัวตน (Anonymous) รวดเร็วและปลอดภัย
              </p>
            </div>

          </form>
        )}

      </div>

      <footer className="text-center py-4 text-2xs text-slate-400">
        คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย © 2026
      </footer>
    </div>
  );
}
