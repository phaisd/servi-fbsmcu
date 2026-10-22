"use client";

import React, { useState } from "react";
import {
  Printer,
  Download,
  X,
  GraduationCap,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Clock,
} from "lucide-react";

export interface StudentSemesterAttendanceCourseItem {
  id: string;
  courseCode: string;
  courseName: string;
  courseNameEn?: string | null;
  credits: number;
  totalConducted: number;
  present: number;
  late: number;
  excused: number;
  absent: number;
  percentage: number;
  isEligible: boolean;
  grade?: string | null;
}

export interface StudentSemesterAttendanceData {
  student: {
    studentCode: string;
    fullName: string;
    title?: string | null;
    degree?: string | null;
    faculty?: string | null;
    department?: string | null;
    major?: string | null;
    yearLevel?: number | null;
    studyStatus?: string | null;
  };
  term: {
    termKey: string;
    semester: number;
    academicYear: string;
  };
  courses: StudentSemesterAttendanceCourseItem[];
  summary: {
    totalCourses: number;
    totalCredits: number;
    totalConducted: number;
    totalAttended: number;
    totalPresent: number;
    totalLate: number;
    totalExcused: number;
    totalAbsent: number;
    overallPercentage: number;
    isOverallEligible: boolean;
    eligibleCount: number;
    atRiskCount: number;
    ineligibleCount: number;
    referenceNo: string;
    issuedDate: string;
  };
}

interface Props {
  data: StudentSemesterAttendanceData;
  onClose: () => void;
}

export function StudentSemesterAttendanceDocument({ data, onClose }: Props) {
  const { student, term, courses, summary } = data;

  const handlePrint = () => {
    window.print();
  };

  // Export to Excel / CSV with UTF-8 BOM
  const handleExportCSV = () => {
    const BOM = "\uFEFF";
    const headers = [
      "ลำดับ",
      "รหัสวิชา",
      "ชื่อรายวิชา",
      "หน่วยกิต",
      "คาบเรียนจริง",
      "มาเรียน (คาบ)",
      "มาสาย (คาบ)",
      "ลากิจ/ลาป่วย (คาบ)",
      "ขาดเรียน (คาบ)",
      "ร้อยละการเข้าเรียน (%)",
      "สถานะสิทธิ์สอบ",
    ];

    const rows = courses.map((c, idx) => {
      const eligibilityStatus =
        c.percentage >= 80
          ? "มีสิทธิ์สอบ"
          : c.percentage >= 75
          ? "เสี่ยงหมดสิทธิ์สอบ"
          : "หมดสิทธิ์สอบ";

      return [
        `"${idx + 1}"`,
        `"${c.courseCode}"`,
        `"${c.courseName.replace(/"/g, '""')}"`,
        `"${c.credits}"`,
        `"${c.totalConducted}"`,
        `"${c.present}"`,
        `"${c.late}"`,
        `"${c.excused}"`,
        `"${c.absent}"`,
        `"${c.percentage}%"`,
        `"${eligibilityStatus}"`,
      ].join(",");
    });

    const studentMeta = [
      `"ใบรายงานสรุปผลเวลาเรียนและสิทธิ์การสอบ (Semester Attendance Transcript)"`,
      `"มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย คณะพุทธศาสตร์"`,
      `"ภาคการศึกษา: ${term.termKey} (ภาคเรียนที่ ${term.semester} ปีการศึกษา ${term.academicYear})"`,
      `"รหัสนิสิต: ${student.studentCode}"`,
      `"ชื่อ-สกุล: ${student.fullName}"`,
      `"ระดับการศึกษา: ${student.degree || "-"}"`,
      `"ภาควิชา: ${student.department || "-"}"`,
      `"สาขาวิชา: ${student.major || "-"}"`,
      `"ชั้นปีที่: ${student.yearLevel || "-"}"`,
      `"สถานะภาพนิสิต: ${student.studyStatus || "ปกติ"}"`,
      `"จำนวนวิชาที่ลงทะเบียน: ${summary.totalCourses} วิชา (${summary.totalCredits} หน่วยกิต)"`,
      `"เวลาเรียนรวมทั้งภาค: ${summary.totalAttended}/${summary.totalConducted} คาบ (${summary.overallPercentage}%)"`,
      `"ผลประเมินสิทธิ์สอบภาพรวม: ${summary.isOverallEligible ? "ผ่านเกณฑ์มีสิทธิ์สอบ" : "มีวิชาเสี่ยงหรือหมดสิทธิ์สอบ"}"`,
      `"เลขที่เอกสารอ้างอิง: ${summary.referenceNo}"`,
      "",
    ].join("\n");

    const csvContent = BOM + studentMeta + headers.join(",") + "\n" + rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Attendance_${student.studentCode}_${term.academicYear}_Sem${term.semester}.csv`;
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
          <Clock className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold truncate max-w-[180px] sm:max-w-[280px]">
            {term.termKey}: {student.studentCode} ({student.fullName})
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center h-8 px-3 rounded-lg gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ส่งออก</span> Excel (CSV)
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center h-8 px-3 rounded-lg gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>พิมพ์ A4 / บันทึก PDF</span>
          </button>

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
        <style
          dangerouslySetInnerHTML={{
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
          `,
          }}
        />

        {/* ══════════ DOCUMENT HEADER ══════════ */}
        <div className="flex items-center gap-4 pb-4 border-b-2 border-slate-900">
          <img
            src="/uploads/logo-b8eef236-b993-4bc9-a08c-b02935131b84-1792468122154.png"
            alt="MCU Logo"
            className="w-18 h-18 object-contain shrink-0"
          />
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
              มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
            </h1>
            <p className="text-xs sm:text-sm font-bold text-slate-800">
              คณะพุทธศาสตร์ • งานบริการการศึกษาและทะเบียน
            </p>
            <p className="text-2xs sm:text-xs text-slate-500 font-medium">
              MAHACHULALONGKORNRAJAVIDYALAYA UNIVERSITY • FACULTY OF BUDDHISM
            </p>
            <div className="mt-1 inline-block bg-slate-100 border border-slate-300 text-slate-900 px-3 py-0.5 rounded-full text-xs font-bold tracking-wide">
              ใบรายงานสรุปเวลาเรียนและสิทธิ์การสอบ (Individual Semester Attendance Transcript)
            </div>
          </div>
          <div className="hidden sm:block text-right shrink-0 text-2xs text-slate-500">
            <div>
              เลขที่เอกสาร:{" "}
              <span className="font-mono font-bold text-slate-800">
                {summary.referenceNo}
              </span>
            </div>
            <div>
              วันที่ออกเอกสาร:{" "}
              <span className="font-semibold text-slate-800">
                {formattedIssuedDate}
              </span>
            </div>
            <div className="mt-1 font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded inline-block">
              {term.termKey}
            </div>
          </div>
        </div>

        {/* ══════════ STUDENT INFORMATION ══════════ */}
        <div className="mt-5 p-4 rounded-xl border border-slate-200 bg-slate-50/80 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
            <div>
              <span className="text-slate-500 font-medium">รหัสนิสิต (Student ID):</span>{" "}
              <span className="font-mono font-bold text-slate-900 text-sm">
                {student.studentCode}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">ชื่อ-นามสกุล (Full Name):</span>{" "}
              <span className="font-bold text-slate-900 text-sm">
                {student.fullName}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">ระดับการศึกษา (Degree):</span>{" "}
              <span className="font-semibold text-slate-800">
                {student.degree || "ปริญญาตรี"}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">ภาควิชา/สาขาวิชา (Dept/Major):</span>{" "}
              <span className="font-semibold text-slate-800">
                {student.department || "-"} / {student.major || "-"}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">ชั้นปีที่ (Year Level):</span>{" "}
              <span className="font-semibold text-slate-800">
                ชั้นปีที่ {student.yearLevel || 1}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">สถานภาพนิสิต (Status):</span>{" "}
              <span className="font-semibold text-slate-800">
                {student.studyStatus || "ปกติ"}
              </span>
            </div>
          </div>
        </div>

        {/* ══════════ COURSES ATTENDANCE TABLE ══════════ */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <span>
                รายละเอียดเวลาเรียนรายวิชา • ภาคการศึกษาที่ {term.semester} ปีการศึกษา {term.academicYear}
              </span>
            </h2>
            <span className="text-2xs text-slate-500">
              เกณฑ์มีสิทธิ์สอบ: เวลาเรียน &ge; 80% (ขาดเรียนได้ไม่เกิน 20%)
            </span>
          </div>

          <table className="w-full text-xs border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold text-center">
                <th className="border border-slate-300 py-2 px-1 w-8">ลำดับ</th>
                <th className="border border-slate-300 py-2 px-2 w-20 text-left">รหัสวิชา</th>
                <th className="border border-slate-300 py-2 px-2 text-left">ชื่อรายวิชา</th>
                <th className="border border-slate-300 py-2 px-1 w-12">นก.</th>
                <th className="border border-slate-300 py-2 px-1 w-12">คาบจริง</th>
                <th className="border border-slate-300 py-2 px-1 w-10 text-emerald-700">มา</th>
                <th className="border border-slate-300 py-2 px-1 w-10 text-amber-700">สาย</th>
                <th className="border border-slate-300 py-2 px-1 w-10 text-blue-700">ลา</th>
                <th className="border border-slate-300 py-2 px-1 w-10 text-rose-700">ขาด</th>
                <th className="border border-slate-300 py-2 px-1.5 w-16">ร้อยละ (%)</th>
                <th className="border border-slate-300 py-2 px-2 w-24">สิทธิ์การสอบ</th>
              </tr>
            </thead>
            <tbody>
              {courses.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="border border-slate-300 text-center py-6 text-slate-400"
                  >
                    ไม่พบข้อมูลการลงทะเบียนเรียนในภาคการศึกษานี้
                  </td>
                </tr>
              ) : (
                courses.map((c, idx) => {
                  const isEligible = c.percentage >= 80;
                  const isAtRisk = c.percentage >= 75 && c.percentage < 80;

                  return (
                    <tr
                      key={c.id || idx}
                      className={
                        idx % 2 === 1
                          ? "bg-slate-50/70 hover:bg-slate-100/50"
                          : "hover:bg-slate-100/50"
                      }
                    >
                      <td className="border border-slate-300 py-2 px-1 text-center font-mono">
                        {idx + 1}
                      </td>
                      <td className="border border-slate-300 py-2 px-2 font-mono font-semibold text-slate-800">
                        {c.courseCode}
                      </td>
                      <td className="border border-slate-300 py-2 px-2 font-medium text-slate-900">
                        <div>{c.courseName}</div>
                        {c.courseNameEn && (
                          <div className="text-[10px] text-slate-400">{c.courseNameEn}</div>
                        )}
                      </td>
                      <td className="border border-slate-300 py-2 px-1 text-center font-mono font-medium">
                        {c.credits}
                      </td>
                      <td className="border border-slate-300 py-2 px-1 text-center font-mono font-bold">
                        {c.totalConducted}
                      </td>
                      <td className="border border-slate-300 py-2 px-1 text-center font-mono text-emerald-700 font-semibold">
                        {c.present}
                      </td>
                      <td className="border border-slate-300 py-2 px-1 text-center font-mono text-amber-700 font-semibold">
                        {c.late}
                      </td>
                      <td className="border border-slate-300 py-2 px-1 text-center font-mono text-blue-700 font-semibold">
                        {c.excused}
                      </td>
                      <td className="border border-slate-300 py-2 px-1 text-center font-mono text-rose-700 font-bold">
                        {c.absent}
                      </td>
                      <td className="border border-slate-300 py-2 px-1.5 text-center font-mono font-bold">
                        <span
                          className={
                            isEligible
                              ? "text-emerald-700"
                              : isAtRisk
                              ? "text-amber-700"
                              : "text-rose-700"
                          }
                        >
                          {c.percentage}%
                        </span>
                      </td>
                      <td className="border border-slate-300 py-2 px-2 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            isEligible
                              ? "bg-emerald-100 text-emerald-800"
                              : isAtRisk
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {isEligible
                            ? "✓ มีสิทธิ์สอบ"
                            : isAtRisk
                            ? "⚠️ เสี่ยงหมดสิทธิ์"
                            : "✕ หมดสิทธิ์สอบ"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {courses.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100/90 font-bold text-slate-900 border-t-2 border-slate-400">
                  <td colSpan={3} className="border border-slate-300 py-2 px-3 text-right">
                    รวมทั้งสิ้น ({summary.totalCourses} วิชา):
                  </td>
                  <td className="border border-slate-300 py-2 px-1 text-center font-mono">
                    {summary.totalCredits}
                  </td>
                  <td className="border border-slate-300 py-2 px-1 text-center font-mono">
                    {summary.totalConducted}
                  </td>
                  <td className="border border-slate-300 py-2 px-1 text-center font-mono text-emerald-700">
                    {summary.totalPresent}
                  </td>
                  <td className="border border-slate-300 py-2 px-1 text-center font-mono text-amber-700">
                    {summary.totalLate}
                  </td>
                  <td className="border border-slate-300 py-2 px-1 text-center font-mono text-blue-700">
                    {summary.totalExcused}
                  </td>
                  <td className="border border-slate-300 py-2 px-1 text-center font-mono text-rose-700">
                    {summary.totalAbsent}
                  </td>
                  <td className="border border-slate-300 py-2 px-1.5 text-center font-mono font-black text-sm text-indigo-700">
                    {summary.overallPercentage}%
                  </td>
                  <td className="border border-slate-300 py-2 px-2 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        summary.isOverallEligible
                          ? "bg-emerald-100 text-emerald-900"
                          : "bg-rose-100 text-rose-900"
                      }`}
                    >
                      {summary.isOverallEligible ? "ผ่านเกณฑ์ภาพรวม" : "มีวิชาไม่ผ่านเกณฑ์"}
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* ══════════ SEMESTER SUMMARY STATS ══════════ */}
        <div className="mt-5 p-4 rounded-xl border border-slate-200 bg-slate-50/70 page-break-inside-avoid">
          <h3 className="text-xs font-bold text-slate-900 mb-2">
            สรุปผลการประเมินเวลาเรียนประจำภาคการศึกษา (Semester Summary Evaluation)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-500 text-[11px] block">วิชาที่ลงทะเบียน</span>
              <span className="font-bold text-slate-900 text-sm">
                {summary.totalCourses} วิชา ({summary.totalCredits} นก.)
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-500 text-[11px] block">เข้าเรียนรวม</span>
              <span className="font-bold text-slate-900 text-sm">
                {summary.totalAttended} / {summary.totalConducted} คาบ
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-500 text-[11px] block">ร้อยละเวลาเรียนเฉลี่ย</span>
              <span className="font-bold text-indigo-700 text-sm">
                {summary.overallPercentage}%
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-500 text-[11px] block">สถานะสิทธิ์สอบ</span>
              <span
                className={`font-bold text-sm ${
                  summary.isOverallEligible ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {summary.isOverallEligible
                  ? `✓ มีสิทธิ์สอบครบ (${summary.eligibleCount}/${summary.totalCourses})`
                  : `⚠️ มีวิชาไม่ผ่าน (${summary.ineligibleCount + summary.atRiskCount} วิชา)`}
              </span>
            </div>
          </div>
        </div>

        {/* ══════════ CERTIFICATION & SIGNATURES ══════════ */}
        <div className="mt-10 pt-4 border-t border-slate-300 page-break-inside-avoid text-xs">
          <div className="grid grid-cols-2 gap-8 text-center pt-2">
            <div className="space-y-12">
              <div>
                <p className="text-slate-500 text-2xs mb-1">
                  รับรองข้อมูลเวลาเรียนถูกต้องตามระบบทะเบียน
                </p>
                <div className="h-10"></div>
                <div className="font-medium text-slate-700">
                  (.......................................................................)
                </div>
                <div className="text-2xs text-slate-500 mt-1">
                  อาจารย์ที่ปรึกษา / อาจารย์ผู้รับผิดชอบรายวิชา
                </div>
              </div>
            </div>

            <div className="space-y-12">
              <div>
                <p className="text-slate-500 text-2xs mb-1">
                  ฝ่ายบริการการศึกษาและทะเบียน คณะพุทธศาสตร์
                </p>
                <div className="h-10"></div>
                <div className="font-medium text-slate-700">
                  (.......................................................................)
                </div>
                <div className="text-2xs text-slate-500 mt-1">
                  เจ้าหน้าที่งานบริการการศึกษาและทะเบียน
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-2xs text-slate-400">
            เอกสารฉบับนี้พิมพ์จากระบบสารสนเทศคณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย เมื่อวันที่ {formattedIssuedDate}
          </div>
        </div>
      </div>
    </div>
  );
}
