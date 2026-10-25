/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import { Printer, X, Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCategoryLabel } from "@/app/(admin)/events/_components/events-client";

interface EventData {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startDate: string | Date;
  endDate: string | Date;
  academicYear?: string | null;
  activityHours?: number;
  eventType?: string;
  targetGroup?: string;
  logoUrl?: string | null;
}

interface EvaluationStats {
  eventTitle: string;
  totalResponses: number;
  grandMean: number;
  grandSd?: number;
  qualitativeLevel: string;
  averages: {
    lecturer: number;
    content: number;
    facility: number;
    time: number;
    overall: number;
  };
  sds?: {
    lecturer: number;
    content: number;
    facility: number;
    time: number;
    overall: number;
  };
  feedbacks: Array<{
    name: string;
    role: string;
    comment: string;
  }>;
}

interface EvaluationConfig {
  title?: string;
  description?: string;
  questions?: Array<{
    id: string;
    category: string;
    label: string;
    subQuestions?: Array<{
      id: string;
      label: string;
    }>;
  }>;
}

interface Props {
  event: EventData;
  stats: EvaluationStats | null;
  config: EvaluationConfig | null;
  onClose: () => void;
}

export function EventEvaluationReportDocument({ event, stats, config, onClose }: Props) {
  // Format Thai dates
  const startDateObj = new Date(event.startDate);
  const endDateObj = new Date(event.endDate);

  const formattedDate = startDateObj.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedTime = `${startDateObj.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  })} - ${endDateObj.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  })} น.`;

  const logoSrc =
    event.logoUrl ||
    "/uploads/logo-b8eef236-b993-4bc9-a08c-b02935131b84-1792468122154.png";

  const getQualitativeThai = (mean: number) => {
    if (mean >= 4.51) return "มากที่สุด";
    if (mean >= 3.51) return "มาก";
    if (mean >= 2.51) return "ปานกลาง";
    if (mean >= 1.51) return "น้อย";
    if (mean > 0) return "น้อยที่สุด";
    return "-";
  };

  const handlePrint = () => {
    window.print();
  };

  // ส่งออกเป็นไฟล์ CSV สำหรับเปิดใน Microsoft Excel (UTF-8 with BOM)
  const handleExportExcel = () => {
    if (!stats) return;

    const rows: string[][] = [
      ["แบบรายงานผลการประเมินความพึงพอใจโครงการ/กิจกรรม (QA Evaluation Summary Report)"],
      ["มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย คณะพุทธศาสตร์"],
      [""],
      ["ชื่อโครงการ/กิจกรรม:", event.title],
      ["หมวดกิจกรรม:", getCategoryLabel(event.eventType)],
      ["วันที่จัดกิจกรรม:", `${formattedDate} (${formattedTime})`],
      ["สถานที่จัด:", event.location || "-"],
      ["ปีการศึกษา:", event.academicYear || "2569"],
      ["จำนวนชั่วโมงกิจกรรม:", `${event.activityHours || 3} ชั่วโมง`],
      ["จำนวนผู้ตอบแบบประเมินทั้งหมด (N):", `${stats.totalResponses} รูป/คน`],
      ["คะแนนเฉลี่ยภาพรวม (Grand Mean):", stats.grandMean.toFixed(2)],
      ["ส่วนเบี่ยงเบนมาตรฐานภาพรวม (Grand S.D.):", (stats.grandSd || 0).toFixed(2)],
      ["ระดับคุณภาพความพึงพอใจภาพรวม:", stats.qualitativeLevel],
      [""],
      ["ลำดับ", "ประเด็นการประเมิน 5 ด้าน", "ค่าเฉลี่ย (Mean)", "ส่วนเบี่ยงเบนมาตรฐาน (S.D.)", "ระดับคุณภาพ"],
      [
        "1",
        "ด้านวิทยากรและผู้บรรยาย",
        stats.averages.lecturer.toFixed(2),
        (stats.sds?.lecturer || 0).toFixed(2),
        getQualitativeThai(stats.averages.lecturer),
      ],
      [
        "2",
        "ด้านเนื้อหาและสาระของกิจกรรม",
        stats.averages.content.toFixed(2),
        (stats.sds?.content || 0).toFixed(2),
        getQualitativeThai(stats.averages.content),
      ],
      [
        "3",
        "ด้านสถานที่ สิ่งอำนวยความสะดวก และโสตทัศนูปกรณ์",
        stats.averages.facility.toFixed(2),
        (stats.sds?.facility || 0).toFixed(2),
        getQualitativeThai(stats.averages.facility),
      ],
      [
        "4",
        "ด้านระยะเวลาและการดำเนินงาน",
        stats.averages.time.toFixed(2),
        (stats.sds?.time || 0).toFixed(2),
        getQualitativeThai(stats.averages.time),
      ],
      [
        "5",
        "ความพึงพอใจในภาพรวมของโครงการ/กิจกรรม",
        stats.averages.overall.toFixed(2),
        (stats.sds?.overall || 0).toFixed(2),
        getQualitativeThai(stats.averages.overall),
      ],
      [
        "",
        "สรุปคะแนนเฉลี่ยรวมทุกด้าน",
        stats.grandMean.toFixed(2),
        (stats.grandSd || 0).toFixed(2),
        getQualitativeThai(stats.grandMean),
      ],
      [""],
      ["เกณฑ์การแปลผลระดับความพึงพอใจ (Likert 5 Scale):"],
      ["4.51 - 5.00 หมายถึง ระดับความพึงพอใจมากที่สุด"],
      ["3.51 - 4.50 หมายถึง ระดับความพึงพอใจมาก"],
      ["2.51 - 3.50 หมายถึง ระดับความพึงพอใจปานกลาง"],
      ["1.51 - 2.50 หมายถึง ระดับความพึงพอใจน้อย"],
      ["1.00 - 1.50 หมายถึง ระดับความพึงพอใจน้อยที่สุด"],
      [""],
      ["ข้อเสนอแนะและข้อคิดเห็นเพิ่มเติมของผู้เข้าร่วมโครงการ:"],
      ["ลำดับ", "ผู้ให้ข้อเสนอแนะ", "บทบาท", "ข้อความความคิดเห็น"],
    ];

    if (stats.feedbacks && stats.feedbacks.length > 0) {
      stats.feedbacks.forEach((fb, idx) => {
        rows.push([String(idx + 1), fb.name || "ผู้เข้าร่วม", fb.role || "นิสิต", fb.comment]);
      });
    } else {
      rows.push(["-", "ไม่มีข้อเสนอแนะเพิ่มเติม", "", ""]);
    }

    const csvContent =
      "\uFEFF" +
      rows
        .map((r) =>
          r
            .map((field) => `"${(field || "").replace(/"/g, '""')}"`)
            .join(",")
        )
        .join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeTitle = event.title.replace(/[\\/:*?"<>|]/g, "_").slice(0, 30);
    link.setAttribute("href", url);
    link.setAttribute("download", `รายงานผลการประเมิน_${safeTitle}_SAR.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const aspects = [
    {
      key: "lecturer",
      name: "1. ด้านวิทยากรและผู้บรรยาย",
      mean: stats?.averages?.lecturer || 0,
      sd: stats?.sds?.lecturer || 0,
    },
    {
      key: "content",
      name: "2. ด้านเนื้อหาและสาระของกิจกรรม",
      mean: stats?.averages?.content || 0,
      sd: stats?.sds?.content || 0,
    },
    {
      key: "facility",
      name: "3. ด้านสถานที่ สิ่งอำนวยความสะดวก และโสตทัศนูปกรณ์",
      mean: stats?.averages?.facility || 0,
      sd: stats?.sds?.facility || 0,
    },
    {
      key: "time",
      name: "4. ด้านระยะเวลาและการดำเนินงาน",
      mean: stats?.averages?.time || 0,
      sd: stats?.sds?.time || 0,
    },
    {
      key: "overall",
      name: "5. ความพึงพอใจในภาพรวมของโครงการ/กิจกรรม",
      mean: stats?.averages?.overall || 0,
      sd: stats?.sds?.overall || 0,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-start overflow-y-auto p-2 sm:p-4 print:p-0 print:bg-white print:static">
      {/* Top Action Bar (Hide in Print) */}
      <div className="w-full max-w-[210mm] bg-white rounded-xl shadow-lg border border-slate-200 p-3 mb-4 flex items-center justify-between gap-2 shrink-0 print:hidden">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">
              แบบรายงานสรุปผลการประเมินความพึงพอใจ (QA / SAR Report)
            </h2>
            <p className="text-2xs text-slate-500">
              จัดรูปแบบเอกสาร A4 มาตรฐาน พร้อมลงนามและแนบรายงานโครงการ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 h-8 text-xs font-semibold flex items-center gap-1.5"
            title="ดาวน์โหลดไฟล์ CSV สำหรับเปิดใน Microsoft Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ส่งออก</span> Excel
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handlePrint}
            className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            พิมพ์รายงาน A4 (PDF)
          </Button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* A4 Printable Document Container */}
      <div className="w-full max-w-[210mm] bg-white text-slate-900 shadow-2xl rounded-sm print:shadow-none print:w-full print:max-w-none p-8 sm:p-12 mb-8 border border-slate-200 print:border-none print:m-0 print:p-6 space-y-6">
        {/* Header with MCU Official Logo */}
        <div className="flex items-start gap-4 pb-4 border-b-2 border-slate-900">
          <div className="w-20 h-20 shrink-0 flex items-center justify-center">
            <img
              src={logoSrc}
              alt="MCU Logo"
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <div className="space-y-0.5 text-center flex-1 pr-4">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 font-serif leading-tight">
              มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย คณะพุทธศาสตร์
            </h1>
            <p className="text-xs text-slate-700 font-serif">
              Mahachulalongkornrajavidyalaya University · Faculty of Buddhism
            </p>
            <div className="pt-1.5">
              <span className="inline-block px-3 py-1 bg-slate-100 text-slate-900 text-xs sm:text-sm font-bold rounded-md border border-slate-300">
                รายงานผลการประเมินความพึงพอใจการจัดโครงการ/กิจกรรม (QA Evaluation Report)
              </span>
            </div>
            <p className="text-2xs text-slate-500 pt-0.5">
              สำหรับแนบประกอบรายงานผลการดำเนินงานโครงการ และรายงานการประเมินตนเอง (SAR)
            </p>
          </div>
        </div>

        {/* Project & Event General Metadata */}
        <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200 text-xs space-y-1.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
            <div>
              <span className="font-bold text-slate-700">ชื่อโครงการ/กิจกรรม: </span>
              <span className="font-semibold text-slate-900">{event.title}</span>
            </div>
            <div>
              <span className="font-bold text-slate-700">หมวดกิจกรรม: </span>
              <span className="text-indigo-700 font-semibold">{getCategoryLabel(event.eventType)}</span>
            </div>
            <div>
              <span className="font-bold text-slate-700">วันที่จัดกิจกรรม: </span>
              <span>{formattedDate} ({formattedTime})</span>
            </div>
            <div>
              <span className="font-bold text-slate-700">สถานที่จัด: </span>
              <span>{event.location || "คณะพุทธศาสตร์ มจร. วังน้อย"}</span>
            </div>
            <div>
              <span className="font-bold text-slate-700">ปีการศึกษา: </span>
              <span>{event.academicYear || "2569"}</span>
            </div>
            <div>
              <span className="font-bold text-slate-700">ชั่วโมงกิจกรรมที่ได้รับ: </span>
              <span className="font-bold text-amber-700">{event.activityHours || 3} ชั่วโมง</span>
            </div>
          </div>
        </div>

        {/* Part 1: Summary Statistics Cards */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
            ตอนที่ 1: สรุปภาพรวมผลการประเมินความพึงพอใจ
          </h3>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-2xs text-slate-500 block font-medium">จำนวนผู้ตอบแบบประเมิน (N)</span>
              <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
                {stats?.totalResponses || 0}
              </span>
              <span className="text-2xs text-slate-500 block">รูป/คน</span>
            </div>

            <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200">
              <span className="text-2xs text-indigo-700 block font-medium">คะแนนเฉลี่ยรวมทุกด้าน (Mean)</span>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-xl sm:text-2xl font-bold text-indigo-900 font-mono">
                  {stats?.grandMean ? stats.grandMean.toFixed(2) : "0.00"}
                </span>
                <span className="text-2xs text-indigo-600 font-mono">/ 5.00</span>
              </div>
              <span className="text-2xs text-indigo-700 font-mono">S.D. = {(stats?.grandSd || 0).toFixed(2)}</span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <span className="text-2xs text-emerald-700 block font-medium">ระดับคุณภาพความพึงพอใจ</span>
              <span className="text-sm sm:text-base font-bold text-emerald-900 block mt-1">
                {stats?.qualitativeLevel || "ยังไม่มีข้อมูล"}
              </span>
              <span className="text-2xs text-emerald-700 block">ผ่านเกณฑ์มาตรฐาน QA</span>
            </div>
          </div>
        </div>

        {/* Part 2: Detailed Evaluation Table with Mean and S.D. */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
            ตอนที่ 2: ผลการวิเคราะห์ระดับความพึงพอใจรายด้าน (Likert Scale 5 ระดับ)
          </h3>

          <div className="border border-slate-300 rounded-lg overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold">
                <tr>
                  <th className="py-2.5 px-3 text-center w-12">ลำดับ</th>
                  <th className="py-2.5 px-3">ประเด็นข้อคำถามการประเมิน 5 ด้าน</th>
                  <th className="py-2.5 px-3 text-center w-24">ค่าเฉลี่ย (&Chi;)</th>
                  <th className="py-2.5 px-3 text-center w-24">ส่วนเบี่ยงเบน (S.D.)</th>
                  <th className="py-2.5 px-3 text-center w-28">ระดับคุณภาพ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {aspects.map((asp, idx) => {
                  const confAspect = config?.questions?.[idx];
                  const subQuestions = confAspect?.subQuestions || [];

                  return (
                    <React.Fragment key={asp.key}>
                      {/* Main Aspect Row */}
                      <tr className="bg-slate-50/50 font-bold text-slate-900">
                        <td className="py-2 px-3 text-center">{idx + 1}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">
                          {confAspect?.label || asp.name}
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-indigo-900">
                          {asp.mean.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-slate-600">
                          {asp.sd.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className="font-semibold text-slate-900">
                            {getQualitativeThai(asp.mean)}
                          </span>
                        </td>
                      </tr>

                      {/* Sub-questions rows */}
                      {subQuestions.map((sub, sIdx) => (
                        <tr key={sub.id || sIdx} className="text-slate-600 hover:bg-slate-50/50 text-[11px]">
                          <td className="py-1 px-3 text-center text-slate-400 font-mono">
                            {idx + 1}.{sIdx + 1}
                          </td>
                          <td className="py-1 px-3 pl-6 text-slate-700">
                            {sub.label}
                          </td>
                          <td className="py-1 px-3 text-center font-mono text-slate-500">
                            {asp.mean.toFixed(2)}
                          </td>
                          <td className="py-1 px-3 text-center font-mono text-slate-400">
                            {asp.sd.toFixed(2)}
                          </td>
                          <td className="py-1 px-3 text-center text-slate-500">
                            {getQualitativeThai(asp.mean)}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}

                {/* Grand Summary Row */}
                <tr className="bg-indigo-50 font-bold text-indigo-950 border-t-2 border-slate-300">
                  <td colSpan={2} className="py-2.5 px-3 text-right">
                    สรุปผลการประเมินภาพรวมทั้งโครงการ (Grand Mean & Total S.D.):
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-sm text-indigo-900 font-bold">
                    {stats?.grandMean ? stats.grandMean.toFixed(2) : "0.00"}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-sm text-indigo-800">
                    {(stats?.grandSd || 0).toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-center text-indigo-900 font-bold">
                    {stats?.qualitativeLevel ? stats.qualitativeLevel.split(" ")[0] : "-"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Scale Legend Note */}
          <div className="text-[10px] text-slate-500 pt-1 leading-relaxed">
            * เกณฑ์การแปลผลคะแนนเฉลี่ย: 4.51–5.00 = มากที่สุด, 3.51–4.50 = มาก, 2.51–3.50 = ปานกลาง, 1.51–2.50 = น้อย, 1.00–1.50 = น้อยที่สุด (ตามมาตรฐานประกันคุณภาพการศึกษา สกอ. / สมศ.)
          </div>
        </div>

        {/* Part 3: Qualitative Feedback / Suggestions */}
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
            ตอนที่ 3: สรุปข้อเสนอแนะและข้อคิดเห็นเพิ่มเติมของผู้เข้าร่วมโครงการ
          </h3>

          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 space-y-2">
            {stats?.feedbacks && stats.feedbacks.length > 0 ? (
              <ul className="space-y-1.5 text-xs text-slate-700">
                {stats.feedbacks.slice(0, 10).map((fb, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-bold text-indigo-700 shrink-0 font-mono text-2xs">
                      [{idx + 1}]
                    </span>
                    <span className="italic leading-relaxed">
                      &ldquo;{fb.comment}&rdquo;
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500 italic text-center py-2">
                ผู้เข้าร่วมกิจกรรมไม่ได้ระบุข้อเสนอแนะเพิ่มเติม
              </p>
            )}
          </div>
        </div>

        {/* Part 4: Official Signatures for SAR Report */}
        <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
          <div className="space-y-1">
            <p>ลงชื่อ ................................................................</p>
            <p className="font-bold">( ................................................................ )</p>
            <p className="text-slate-600">ผู้รับผิดชอบโครงการ / ผู้รายงาน</p>
            <p className="text-2xs text-slate-400">วันที่ .......... / .......... / ..............</p>
          </div>

          <div className="space-y-1">
            <p>ลงชื่อ ................................................................</p>
            <p className="font-bold">( ................................................................ )</p>
            <p className="text-slate-600">รองคณบดี / หัวหน้าภาควิชา</p>
            <p className="text-2xs text-slate-400">วันที่ .......... / .......... / ..............</p>
          </div>
        </div>
      </div>
    </div>
  );
}
