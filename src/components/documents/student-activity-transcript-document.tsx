/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import { Printer, X, Download, FileSpreadsheet, CheckCircle2, Clock3, Award } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface TranscriptStudentInfo {
  studentCode: string;
  fullName: string;
  degree: string;
  faculty: string;
  department: string;
  major: string;
  curriculumName: string;
  yearLevel: number;
  studyStatus: string;
  email: string;
  phoneNumber: string;
  entryYear: string;
}

export interface TranscriptRegistrationItem {
  id: string;
  studentCode: string;
  studentName: string;
  status: "REGISTERED" | "ATTENDED" | "CANCELLED" | string;
  role: string;
  major?: string | null;
  department?: string | null;
  attendedAt?: Date | string | null;
  remarks?: string | null;
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

export interface TranscriptCategoryStat {
  key: string;
  label: string;
  hours: number;
  count: number;
}

export interface TranscriptSummary {
  totalAttendedHours: number;
  totalRegisteredHours: number;
  attendedCount: number;
  registeredCount: number;
  requiredHours: number;
  isPassed: boolean;
  progressPercent: number;
  categories: TranscriptCategoryStat[];
  referenceNo: string;
  issuedDate: string;
}

export interface StudentActivityTranscriptData {
  student: TranscriptStudentInfo;
  registrations: TranscriptRegistrationItem[];
  summary: TranscriptSummary;
}

interface Props {
  data: StudentActivityTranscriptData;
  onClose: () => void;
}

export function StudentActivityTranscriptDocument({ data, onClose }: Props) {
  const [showOnlyAttended, setShowOnlyAttended] = useState(true);

  const { student, registrations, summary } = data;

  const displayList = showOnlyAttended
    ? registrations.filter((r) => r.status === "ATTENDED")
    : registrations;

  const handlePrint = () => {
    window.print();
  };

  // Export to Excel / CSV with UTF-8 BOM
  const handleExportCSV = () => {
    const BOM = "\uFEFF";
    const headers = [
      "ลำดับ",
      "ปีการศึกษา",
      "วันที่จัดกิจกรรม",
      "ชื่อโครงการ/กิจกรรม",
      "ประเภทกิจกรรม",
      "บทบาท",
      "สถานที่",
      "ชั่วโมงกิจกรรม",
      "สถานะการเข้าร่วม",
    ];

    const rows = displayList.map((item, idx) => {
      const d = new Date(item.event.startDate);
      const dateStr = d.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      const catLabel =
        summary.categories.find((c) => c.key === item.event.eventType)?.label ||
        "กิจกรรมทั่วไป";
      const statusLabel = item.status === "ATTENDED" ? "เข้าร่วมสมบูรณ์" : "ลงทะเบียน";

      return [
        `"${idx + 1}"`,
        `"${item.event.academicYear || "-"}"`,
        `"${dateStr}"`,
        `"${(item.event.title || "").replace(/"/g, '""')}"`,
        `"${catLabel}"`,
        `"${item.role || "นิสิต"}"`,
        `"${(item.event.location || "").replace(/"/g, '""')}"`,
        `"${item.event.activityHours || 0}"`,
        `"${statusLabel}"`,
      ].join(",");
    });

    const studentMeta = [
      `"ระเบียนแสดงผลการเข้าร่วมกิจกรรมพัฒนานิสิต (Student Activity Transcript)"`,
      `"มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย คณะพุทธศาสตร์"`,
      `"รหัสนิสิต: ${student.studentCode}"`,
      `"ชื่อ-สกุล: ${student.fullName}"`,
      `"ระดับการศึกษา: ${student.degree}"`,
      `"สาขาวิชา: ${student.major}"`,
      `"ชั่วโมงสะสมรวม: ${summary.totalAttendedHours} ชั่วโมง (จากเกณฑ์ ${summary.requiredHours} ชม.)"`,
      `"ผลการประเมิน: ${summary.isPassed ? "ผ่านเกณฑ์" : "กำลังดำเนินการ"}"`,
      `"เลขที่อ้างอิง: ${summary.referenceNo}"`,
      "",
    ].join("\n");

    const csvContent = BOM + studentMeta + headers.join(",") + "\n" + rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Activity_Transcript_${student.studentCode}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const issuedDateObj = new Date(summary.issuedDate || Date.now());
  const formattedIssuedDate = issuedDateObj.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs overflow-y-auto flex justify-center p-0 sm:p-4 print:p-0 print:bg-white print:fixed-none">
      {/* ── Floating Controls Bar (Hidden during Print) ── */}
      <div className="fixed top-4 z-50 flex flex-wrap items-center gap-2 bg-slate-900/95 text-white px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-md border border-slate-700/80 print:hidden max-w-[95vw]">
        <div className="flex items-center gap-2 pr-3 border-r border-slate-700">
          <Award className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold truncate max-w-[180px] sm:max-w-[260px]">
            Activity Transcript: {student.studentCode} ({student.fullName})
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer px-2 py-1 rounded-md hover:bg-slate-800 transition">
            <input
              type="checkbox"
              checked={showOnlyAttended}
              onChange={(e) => setShowOnlyAttended(e.target.checked)}
              className="rounded text-amber-500 focus:ring-amber-400"
            />
            <span>แสดงเฉพาะที่เข้าร่วมแล้ว ({summary.attendedCount})</span>
          </label>

          <Button
            size="sm"
            onClick={handleExportCSV}
            className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ส่งออก</span> Excel
          </Button>

          <Button
            size="sm"
            onClick={handlePrint}
            className="h-8 gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>พิมพ์เอกสาร / บันทึก PDF</span>
          </Button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer ml-1"
            title="ปิดหน้าต่าง"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Printable A4 Sheet Document Container ── */}
      <div className="bg-white text-slate-900 w-full max-w-[210mm] min-h-[297mm] my-0 sm:my-16 p-8 sm:p-12 shadow-2xl rounded-sm font-sans relative print:m-0 print:p-0 print:shadow-none print:w-full print:rounded-none">
        {/* Style block for Print Optimization */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: A4 portrait;
                margin: 12mm 15mm 12mm 15mm;
              }
              body {
                background: white !important;
                color: black !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .print\\:hidden {
                display: none !important;
              }
              .page-break-inside-avoid {
                page-break-inside: avoid;
                break-inside: avoid;
              }
            }
          `
        }} />

        {/* ══════════ DOCUMENT HEADER ══════════ */}
        <div className="flex items-center gap-4 pb-4 border-b-2 border-amber-600">
          <img
            src="/uploads/logo-b8eef236-b993-4bc9-a08c-b02935131b84-1792468122154.png"
            alt="MCU Logo"
            className="w-18 h-18 object-contain shrink-0"
          />
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
              มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
            </h1>
            <p className="text-xs sm:text-sm font-bold text-amber-800">
              คณะพุทธศาสตร์ • ฝ่ายกิจการนิสิต
            </p>
            <p className="text-2xs sm:text-xs text-slate-500 font-medium">
              MAHACHULALONGKORNRAJAVIDYALAYA UNIVERSITY • FACULTY OF BUDDHISM
            </p>
            <div className="mt-1 inline-block bg-amber-50 border border-amber-300 text-amber-900 px-3 py-0.5 rounded-full text-xs font-black tracking-wide uppercase">
              ระเบียนแสดงผลการเข้าร่วมกิจกรรมพัฒนานิสิต (Student Activity Transcript)
            </div>
          </div>
          <div className="hidden sm:block text-right shrink-0 text-2xs text-slate-500">
            <div>เลขที่เอกสาร: <span className="font-mono font-bold text-slate-800">{summary.referenceNo}</span></div>
            <div>วันที่ออกเอกสาร: <span className="font-semibold text-slate-800">{formattedIssuedDate}</span></div>
            <div className="text-emerald-700 font-semibold mt-1">✓ ระบบตรวจสอบความถูกต้อง</div>
          </div>
        </div>

        {/* ══════════ SECTION 1: STUDENT PROFILE BOX ══════════ */}
        <div className="mt-5 p-4 rounded-xl border border-slate-200 bg-slate-50/70 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-4">
            <div>
              <span className="text-slate-500 text-2xs block">ชื่อ-ฉายา / นามสกุล:</span>
              <span className="font-bold text-slate-900 text-sm">{student.fullName}</span>
            </div>
            <div>
              <span className="text-slate-500 text-2xs block">รหัสนิสิต (Student ID):</span>
              <span className="font-mono font-bold text-amber-800 text-sm">{student.studentCode}</span>
            </div>
            <div>
              <span className="text-slate-500 text-2xs block">ระดับการศึกษา:</span>
              <span className="font-semibold text-slate-800">{student.degree} (ชั้นปีที่ {student.yearLevel})</span>
            </div>
            <div>
              <span className="text-slate-500 text-2xs block">คณะ / สังกัด:</span>
              <span className="font-semibold text-slate-800">{student.faculty}</span>
            </div>
            <div>
              <span className="text-slate-500 text-2xs block">ภาควิชา / สาขาวิชา:</span>
              <span className="font-semibold text-slate-800">{student.major}</span>
            </div>
            <div>
              <span className="text-slate-500 text-2xs block">สถานภาพนิสิต:</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                {student.studyStatus || "ปกติ"} (ปีที่เข้าศึกษา: {student.entryYear})
              </span>
            </div>
          </div>
        </div>

        {/* ══════════ SECTION 2: ACTIVITY HOURS SUMMARY ══════════ */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
          <div className="border border-slate-200 rounded-xl p-3 bg-white">
            <span className="text-2xs font-bold text-slate-500 uppercase block">เกณฑ์ชั่วโมงขั้นต่ำ</span>
            <div className="text-2xl font-black text-slate-700 mt-1">
              {summary.requiredHours} <span className="text-xs font-normal text-slate-500">ชม.</span>
            </div>
            <span className="text-2xs text-slate-400">ตามเกณฑ์คณะพุทธศาสตร์</span>
          </div>

          <div className="border border-amber-300 rounded-xl p-3 bg-gradient-to-br from-amber-50 to-white">
            <span className="text-2xs font-bold text-amber-700 uppercase block">ชั่วโมงกิจกรรมสะสม</span>
            <div className="text-2xl font-black text-amber-900 mt-1">
              {summary.totalAttendedHours} <span className="text-xs font-normal text-slate-500">ชม.</span>
            </div>
            <span className="text-2xs text-amber-700 font-semibold">
              สะสมแล้ว {summary.progressPercent}%
            </span>
          </div>

          <div className="border border-blue-200 rounded-xl p-3 bg-blue-50/50">
            <span className="text-2xs font-bold text-blue-700 uppercase block">จำนวนกิจกรรมที่เข้าร่วม</span>
            <div className="text-2xl font-black text-blue-900 mt-1">
              {summary.attendedCount} <span className="text-xs font-normal text-slate-500">โครงการ</span>
            </div>
            <span className="text-2xs text-blue-600">ลงทะเบียน {summary.registeredCount} รายการ</span>
          </div>

          <div className={`border rounded-xl p-3 flex flex-col justify-center items-center ${
            summary.isPassed
              ? "border-emerald-300 bg-emerald-50/80 text-emerald-900"
              : "border-amber-300 bg-amber-50/80 text-amber-900"
          }`}>
            <span className="text-2xs font-bold uppercase block">ผลการประเมินกิจกรรม</span>
            <div className="text-sm font-black mt-1 flex items-center gap-1">
              {summary.isPassed ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>ผ่านเกณฑ์ (PASSED)</span>
                </>
              ) : (
                <>
                  <Clock3 className="w-4 h-4 text-amber-600" />
                  <span>กำลังดำเนินการ</span>
                </>
              )}
            </div>
            <span className="text-2xs opacity-80 mt-0.5">
              {summary.isPassed ? "ครบตามข้อกำหนดหลักสูตร" : `ขาดอีก ${Math.max(0, summary.requiredHours - summary.totalAttendedHours)} ชม.`}
            </span>
          </div>
        </div>

        {/* ══════════ SECTION 3: HOURS BREAKDOWN BY CATEGORY ══════════ */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              สรุปชั่วโมงสะสมจำแนกตามหมวดกิจกรรมพัฒนานิสิต
            </h2>
            <span className="text-2xs text-slate-500">มาตรฐานประกันคุณภาพ มจร.</span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 text-2xs uppercase">
                  <th className="py-1.5 px-3 text-left">หมวดหมู่กิจกรรม</th>
                  <th className="py-1.5 px-3 text-center w-28">จำนวนกิจกรรม</th>
                  <th className="py-1.5 px-3 text-center w-28">ชั่วโมงสะสม</th>
                  <th className="py-1.5 px-3 text-left w-36">สัดส่วนชั่วโมง</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.categories.map((cat, idx) => {
                  const percent = summary.totalAttendedHours > 0
                    ? Math.round((cat.hours / summary.totalAttendedHours) * 100)
                    : 0;
                  return (
                    <tr key={idx} className={cat.hours > 0 ? "bg-white font-medium" : "bg-slate-50/50 text-slate-400"}>
                      <td className="py-1.5 px-3">{cat.label}</td>
                      <td className="py-1.5 px-3 text-center">{cat.count} รายการ</td>
                      <td className="py-1.5 px-3 text-center font-bold text-slate-900">{cat.hours} ชม.</td>
                      <td className="py-1.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-amber-600 h-1.5 rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-2xs text-slate-500 w-8">{percent}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-amber-50/70 border-t border-amber-200 font-bold text-amber-950">
                  <td className="py-2 px-3 text-right">รวมชั่วโมงสะสมทั้งหมด:</td>
                  <td className="py-2 px-3 text-center">{summary.attendedCount} รายการ</td>
                  <td className="py-2 px-3 text-center text-sm font-black text-amber-900">{summary.totalAttendedHours} ชม.</td>
                  <td className="py-2 px-3 text-xs text-amber-800">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ══════════ SECTION 4: DETAILED ACTIVITY PARTICIPATION LOG ══════════ */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
              รายการประวัติการเข้าร่วมกิจกรรม ({displayList.length} รายการ)
            </h2>
            <span className="text-2xs text-slate-500">
              เรียงลำดับตามวันที่จัดกิจกรรม
            </span>
          </div>

          {displayList.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-slate-300 rounded-xl text-xs text-slate-400">
              ยังไม่มีประวัติการเข้าร่วมกิจกรรมที่สมบูรณ์ในระบบ
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 text-2xs uppercase">
                    <th className="py-2 px-2 text-center w-10">ลำดับ</th>
                    <th className="py-2 px-2.5 text-left w-24">วันที่จัดกิจกรรม</th>
                    <th className="py-2 px-3 text-left">ชื่อโครงการ / กิจกรรม</th>
                    <th className="py-2 px-2.5 text-left w-36">ประเภทกิจกรรม</th>
                    <th className="py-2 px-2 text-center w-16">บทบาท</th>
                    <th className="py-2 px-2 text-center w-16">ชั่วโมง</th>
                    <th className="py-2 px-2.5 text-center w-24">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayList.map((item, idx) => {
                    const dateObj = new Date(item.event.startDate);
                    const dateDisplay = dateObj.toLocaleDateString("th-TH", {
                      day: "numeric",
                      month: "short",
                      year: "2-digit",
                    });

                    const catLabel =
                      summary.categories.find((c) => c.key === item.event.eventType)?.label ||
                      "กิจกรรมทั่วไป";

                    const isAttended = item.status === "ATTENDED";

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/50 transition ${
                          isAttended ? "bg-white" : "bg-slate-50/70 text-slate-400"
                        }`}
                      >
                        <td className="py-2 px-2 text-center font-mono text-slate-500 text-2xs">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-2.5 text-slate-600 whitespace-nowrap text-2xs font-medium">
                          {dateDisplay}
                        </td>
                        <td className="py-2 px-3">
                          <span className="font-bold text-slate-900 block leading-tight">
                            {item.event.title}
                          </span>
                          {item.event.location && (
                            <span className="text-2xs text-slate-400 block mt-0.5">
                              📍 {item.event.location}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2.5 text-slate-600 text-2xs">
                          {catLabel}
                        </td>
                        <td className="py-2 px-2 text-center text-2xs font-medium text-slate-700">
                          {item.role || "นิสิต"}
                        </td>
                        <td className="py-2 px-2 text-center font-black text-amber-900">
                          +{item.event.activityHours || 0}
                        </td>
                        <td className="py-2 px-2.5 text-center">
                          {isAttended ? (
                            <span className="inline-flex items-center gap-1 text-2xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              ✓ ผ่าน
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-2xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                              ลงทะเบียน
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ══════════ SECTION 5: OFFICIAL SIGNATURES & VERIFICATION ══════════ */}
        <div className="mt-8 pt-6 border-t-2 border-slate-200 page-break-inside-avoid">
          <div className="grid grid-cols-2 gap-8 text-center text-xs">
            {/* Signature 1: Student Affairs Officer */}
            <div className="space-y-1.5 flex flex-col items-center">
              <span className="text-2xs font-semibold text-slate-500">
                ผู้จัดทำและตรวจสอบข้อมูลระเบียนกิจกรรม
              </span>
              <div className="h-12 w-48 border-b border-dashed border-slate-400 mt-2"></div>
              <span className="font-bold text-slate-800 text-2xs pt-1">
                ( ................................................................ )
              </span>
              <span className="text-2xs text-slate-600">
                เจ้าหน้าที่ฝ่ายกิจการนิสิต คณะพุทธศาสตร์
              </span>
              <span className="text-2xs text-slate-400">
                วันที่ ........ / ........................ / ............
              </span>
            </div>

            {/* Signature 2: Deputy Dean */}
            <div className="space-y-1.5 flex flex-col items-center">
              <span className="text-2xs font-semibold text-slate-500">
                ผู้รับรองความถูกต้องผลการประเมินกิจกรรม
              </span>
              <div className="h-12 w-48 border-b border-dashed border-slate-400 mt-2"></div>
              <span className="font-bold text-slate-800 text-2xs pt-1">
                ( พระมหาบุญเลิศ อินฺทปญฺโญ, ศ.ดร. )
              </span>
              <span className="text-2xs text-slate-600">
                รองคณบดีฝ่ายบริหาร / กิจการนิสิต คณะพุทธศาสตร์
              </span>
              <span className="text-2xs text-slate-400">
                มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
              </span>
            </div>
          </div>

          {/* Footer Official Notice */}
          <div className="mt-6 pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-2xs text-slate-400 gap-2">
            <div>
              * เอกสารฉบับนี้พิมพ์จากระบบสารสนเทศกิจการนิสิต คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
            </div>
            <div className="font-mono text-slate-500">
              ID: {summary.referenceNo}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
