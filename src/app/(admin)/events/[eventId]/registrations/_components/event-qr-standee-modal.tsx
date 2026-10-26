/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EventData {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startDate: string | Date;
  endDate: string | Date;
  activityHours?: number | null;
}

interface Props {
  event: EventData;
  initialMode?: "EVALUATION" | "CHECKIN";
  onClose: () => void;
}

export function EventQrStandeeModal({ event, initialMode = "EVALUATION", onClose }: Props) {
  const [mode, setMode] = useState<"EVALUATION" | "CHECKIN">(initialMode);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const path = mode === "EVALUATION" ? "evaluate" : "checkin";
  const targetUrl = `${origin}/portal/events/${event.id}/${path}`;

  useEffect(() => {
    QRCode.toDataURL(targetUrl, {
      width: 600,
      margin: 2,
      color: {
        dark: mode === "EVALUATION" ? "#3b0764" : "#0f172a",
        light: "#ffffff",
      },
      errorCorrectionLevel: "H",
    })
      .then((dataUrl) => setQrDataUrl(dataUrl))
      .catch((err) => console.error("Failed to generate QR code", err));
  }, [targetUrl, mode]);

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(event.startDate).toLocaleDateString("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedTime = new Date(event.startDate).toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      {/* Control bar (Hidden during print) */}
      <div className="fixed top-3 inset-x-0 mx-auto max-w-xl z-50 flex items-center justify-between gap-2 bg-slate-900 text-white p-3 rounded-2xl shadow-2xl border border-slate-700 print:hidden">
        <div className="flex items-center gap-1.5 p-1 bg-slate-800 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode("EVALUATION")}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              mode === "EVALUATION"
                ? "bg-purple-600 text-white shadow-xs font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            📝 ป้ายแบบประเมิน (Anonymous)
          </button>
          <button
            type="button"
            onClick={() => setMode("CHECKIN")}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              mode === "CHECKIN"
                ? "bg-amber-600 text-white shadow-xs font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            📱 ป้ายเช็คชื่อ & เกียรติบัตร
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={handlePrint}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>🖨️ สั่งพิมพ์ A4 (Print)</span>
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            title="ปิดหน้าต่าง"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ══════════ A4 Printable Standee Document ══════════ */}
      <div className="bg-white text-slate-900 rounded-xl shadow-2xl max-w-[210mm] w-full mt-16 mb-8 p-8 sm:p-12 border border-slate-200 print:m-0 print:p-8 print:border-none print:shadow-none print:max-w-none print:w-full print:rounded-none">
        <div className="flex flex-col items-center text-center space-y-6">
          
          {/* Logo & Institute Header */}
          <div className="space-y-3">
            <img
              src="/uploads/mcu-official-seal.png"
              alt="ตราสัญลักษณ์ มจร"
              className="w-24 h-24 object-contain mx-auto drop-shadow-sm"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/uploads/mcu-logo.png";
              }}
            />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-wide uppercase">
                มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
              </h2>
              <p className="text-sm font-semibold text-amber-800">
                คณะพุทธศาสตร์ • Faculty of Buddhism
              </p>
            </div>
          </div>

          <div className="w-full border-t-2 border-amber-500/80 my-2"></div>

          {/* Event Title & Metadata */}
          <div className="space-y-2 max-w-lg">
            <span className="inline-block bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              โครงการ / กิจกรรมสัมมนาวิชาการ
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
              {event.title}
            </h1>
            <p className="text-xs text-slate-600 font-medium pt-1">
              {formattedDate} • เวลา {formattedTime} น.
            </p>
            {event.location && (
              <p className="text-2xs sm:text-xs text-slate-500">
                สถานที่: {event.location}
              </p>
            )}
          </div>

          {/* QR Box with High-Contrast Border */}
          <div className="p-4 sm:p-6 bg-slate-50 rounded-3xl border-4 border-slate-900 shadow-lg flex flex-col items-center justify-center space-y-3">
            <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-white ${
              mode === "EVALUATION" ? "bg-purple-800" : "bg-slate-900"
            }`}>
              {mode === "EVALUATION" ? "📝 สแกนทำแบบประเมินความพึงพอใจ" : "📱 สแกนเช็คชื่อ & รับเกียรติบัตร"}
            </div>

            <div className="p-2 bg-white rounded-2xl border-2 border-slate-300 shadow-inner">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  className="w-60 h-60 sm:w-72 sm:h-72 object-contain"
                />
              ) : (
                <div className="w-60 h-60 flex items-center justify-center text-slate-400 text-xs">
                  กำลังสร้าง QR Code...
                </div>
              )}
            </div>

            <div className="text-center space-y-1 max-w-sm">
              <p className="text-xs sm:text-sm font-black text-slate-900">
                {mode === "EVALUATION"
                  ? "เปิดกล้องโทรศัพท์ หรือ LINE สแกน QR ด้านบน"
                  : "สแกนเพื่อยืนยันการเข้าร่วม และรับชั่วโมงกิจกรรม"}
              </p>
              <p className="text-2xs text-slate-600">
                {mode === "EVALUATION"
                  ? "✨ แบบประเมินไม่ระบุตัวตน (Anonymous) รวดเร็ว ไม่ต้องกรอกรหัส"
                  : `✨ ได้รับ ${event.activityHours || 3} ชั่วโมงกิจกรรม พร้อมดาวน์โหลดเกียรติบัตร PDF ทันที`}
              </p>
            </div>
          </div>

          {/* Direct URL text for backup */}
          <div className="text-2xs text-slate-400 font-mono pt-2">
            URL: {targetUrl}
          </div>

          {/* Standee Footer */}
          <div className="w-full pt-4 border-t border-slate-200 text-2xs text-slate-500 flex items-center justify-between">
            <span>คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย</span>
            <span>ระบบบริหารจัดการกิจกรรมและออกเกียรติบัตรออนไลน์</span>
          </div>

        </div>
      </div>
    </div>
  );
}
