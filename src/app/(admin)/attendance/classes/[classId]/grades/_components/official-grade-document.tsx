/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import { Printer, Download, X, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StudentGradeItem {
  enrollmentId: string;
  studentId: string;
  studentCode: string;
  title: string;
  firstName: string;
  lastName: string;
  fullName: string;
  yearLevel: number;
  department: string;
  major: string;
  studyStatus: string;
  attendancePercentage: number;
  assignmentScore: number | null;
  midtermScore: number | null;
  affectiveScore: number | null;
  finalScore: number | null;
  totalScore: number | null;
  grade: string | null;
  gradeRemarks: string;
}

interface GradingConfig {
  assignmentMax: number;
  midtermMax: number;
  affectiveMax: number;
  finalMax: number;
}

interface OfficialGradeDocumentProps {
  course: {
    id: string;
    courseCode: string;
    courseName: string;
    courseNameEn?: string;
    credits: number;
    section?: string;
    term: string;
    academicYear: string;
    semester: number;
    room: string;
    primaryTeacher: string;
    degree?: string;
    programLanguage?: string;
    faculty?: string;
    yearLevel?: string;
    major?: string;
    department?: string;
    logoUrl?: string;
  };
  config: GradingConfig;
  students: StudentGradeItem[];
  defaultMode?: "final" | "midterm";
  onClose: () => void;
}

export function OfficialGradeDocument({
  course,
  config,
  students,
  defaultMode = "final",
  onClose,
}: OfficialGradeDocumentProps) {
  const [mode, setMode] = useState<"final" | "midterm">(defaultMode);
  const [showTransferRemarks, setShowTransferRemarks] = useState(false);

  // Statistics calculation for the official report
  const scoredStudents = students.filter((s) => s.totalScore !== null && s.totalScore !== undefined);
  const totalCount = students.length;
  const attendedExamCount = scoredStudents.length;
  const absentExamCount = totalCount - attendedExamCount;

  const gradeCounts: Record<string, number> = {
    A: 0,
    "B+": 0,
    B: 0,
    "C+": 0,
    C: 0,
    "D+": 0,
    D: 0,
    F: 0,
  };

  let maxScore: number | null = null;
  let minScore: number | null = null;

  scoredStudents.forEach((s) => {
    const g = s.grade || "F";
    if (gradeCounts[g] !== undefined) {
      gradeCounts[g]++;
    } else {
      gradeCounts[g] = 1;
    }

    if (s.totalScore !== null) {
      if (maxScore === null || s.totalScore > maxScore) maxScore = s.totalScore;
      if (minScore === null || s.totalScore < minScore) minScore = s.totalScore;
    }
  });

  const handlePrint = () => {
    window.print();
  };

  const currentYearBE = course.academicYear || "2569";
  const semesterStr = course.semester || "1";
  const facultyName = course.faculty || "คณะพุทธศาสตร์";
  const majorName = course.major || course.department || "สาขาวิชาพระพุทธศาสนา";
  const yearLevelStr = course.yearLevel || "4";

  const degreeStr = course.degree
    ? course.degree.startsWith("ระดับ")
      ? course.degree
      : `ระดับ${course.degree}`
    : "ระดับปริญญาตรี";
  const programLanguageStr = course.programLanguage || "ภาคภาษาอังกฤษ";

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs overflow-y-auto flex justify-center p-2 sm:p-6 print:p-0 print:bg-white print:static print:overflow-visible">
      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl max-w-5xl w-full flex flex-col my-auto border border-slate-200 print:border-none print:shadow-none print:max-w-none print:w-full print:m-0 print:rounded-none">
        
        {/* ══════════ Top Control Bar (Screen Only) ══════════ */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 rounded-t-2xl print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              เลือกรูปแบบเอกสาร:
            </span>
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setMode("final")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                  mode === "final"
                    ? "bg-primary text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                📄 ใบกรอกคะแนนผลการสอบ (ปลายภาค)
              </button>
              <button
                type="button"
                onClick={() => setMode("midterm")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                  mode === "midterm"
                    ? "bg-primary text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                📑 ใบเก็บคะแนนสอบระหว่างภาค
              </button>
            </div>
            <label className="flex items-center gap-1.5 text-xs text-slate-600 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-slate-50 transition shadow-2xs select-none">
              <input
                type="checkbox"
                checked={showTransferRemarks}
                onChange={(e) => setShowTransferRemarks(e.target.checked)}
                className="rounded text-primary focus:ring-primary w-3.5 h-3.5"
              />
              <span>แสดงคำว่า "เทียบโอน" ในหมายเหตุ</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              size="sm"
              className="gap-1.5 bg-primary text-white hover:bg-primary/90 font-semibold shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์เอกสาร (Print A4)</span>
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="gap-1 text-slate-600 hover:text-slate-900"
            >
              <X className="w-4 h-4" />
              <span>ปิดหน้าต่าง</span>
            </Button>
          </div>
        </div>

        {/* ══════════ A4 Printable Document Container ══════════ */}
        <div className="p-8 sm:p-12 print:p-0 font-serif leading-tight">
          
          {/* Header Block: Logo & Title & Grading Scale Table */}
          <div className="flex items-start justify-between gap-4 mb-4">
            
            {/* Left/Center Header Info */}
            <div className="flex items-start gap-4 flex-1">
              <img
                src={course.logoUrl || "/uploads/logo-b8eef236-b993-4bc9-a08c-b02935131b84-1792468122154.png"}
                alt="MCU Seal"
                className="w-20 h-20 object-contain shrink-0 mt-1"
                onError={(e) => {
                  // Fallback to logo or seal if not found
                  (e.target as HTMLImageElement).src = "/uploads/mcu-logo.png";
                }}
              />
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-center sm:text-left text-slate-900">
                  {mode === "final" ? "ใบกรอกคะแนนผลการสอบ คณะพุทธศาสตร์" : "ใบเก็บคะแนนและวัดผลระหว่างภาค คณะพุทธศาสตร์"}
                </h1>
                <h2 className="text-base sm:text-lg font-bold text-center sm:text-left text-slate-800">
                  มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
                </h2>
                <p className="text-sm font-semibold text-slate-700">
                  {facultyName} {yearLevelStr.startsWith("ชั้นปีที่") ? yearLevelStr : `ชั้นปีที่ ${yearLevelStr}`} {majorName}
                </p>
                <p className="text-sm font-semibold text-slate-700">
                  หลักสูตร{degreeStr} ({programLanguageStr})
                </p>
                <p className="text-sm font-semibold text-slate-700">
                  ภาคการศึกษาที่ {semesterStr} ปีการศึกษา {currentYearBE}
                </p>
              </div>
            </div>

            {/* Right Grading Scale Box (ตรงตามเอกสารทางการ PDF เป๊ะ) */}
            <div className="shrink-0 border border-black text-center text-xs w-44 shadow-2xs print:shadow-none">
              <div className="grid grid-cols-3 border-b border-black font-bold bg-slate-100 print:bg-transparent py-1">
                <div className="border-r border-black">ระดับ</div>
                <div className="border-r border-black">ค่าระดับ</div>
                <div>เกณฑ์คะแนน</div>
              </div>
              <div className="divide-y divide-black text-[11px] font-medium">
                <div className="grid grid-cols-3 py-0.5">
                  <div className="border-r border-black font-bold">A</div>
                  <div className="border-r border-black">4</div>
                  <div>90-100</div>
                </div>
                <div className="grid grid-cols-3 py-0.5">
                  <div className="border-r border-black font-bold">B+</div>
                  <div className="border-r border-black">3.5</div>
                  <div>85-89</div>
                </div>
                <div className="grid grid-cols-3 py-0.5">
                  <div className="border-r border-black font-bold">B</div>
                  <div className="border-r border-black">3</div>
                  <div>80-84</div>
                </div>
                <div className="grid grid-cols-3 py-0.5">
                  <div className="border-r border-black font-bold">C+</div>
                  <div className="border-r border-black">2.5</div>
                  <div>75-79</div>
                </div>
                <div className="grid grid-cols-3 py-0.5">
                  <div className="border-r border-black font-bold">C</div>
                  <div className="border-r border-black">2</div>
                  <div>70-74</div>
                </div>
                <div className="grid grid-cols-3 py-0.5">
                  <div className="border-r border-black font-bold">D+</div>
                  <div className="border-r border-black">1.5</div>
                  <div>65-69</div>
                </div>
                <div className="grid grid-cols-3 py-0.5">
                  <div className="border-r border-black font-bold">D</div>
                  <div className="border-r border-black">1</div>
                  <div>60-64</div>
                </div>
                <div className="grid grid-cols-3 py-0.5">
                  <div className="border-r border-black font-bold">F</div>
                  <div className="border-r border-black">0</div>
                  <div>Below 60</div>
                </div>
              </div>
            </div>
          </div>

          {/* Subject Metadata Details */}
          <div className="text-sm font-medium space-y-1.5 mb-3 border-t border-slate-300 pt-2 text-slate-800">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-bold">วิชา:</span>
              <span className="underline decoration-dotted underline-offset-4 font-semibold text-slate-950 flex-1">
                {course.courseName} {course.courseNameEn ? `(${course.courseNameEn})` : ""}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-baseline gap-2">
                <span className="font-bold">รหัสวิชา:</span>
                <span className="underline decoration-dotted underline-offset-4 font-mono font-semibold">
                  {course.courseCode} ({course.credits} หน่วยกิต)
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-bold">อาจารย์ผู้บรรยาย:</span>
                <span className="underline decoration-dotted underline-offset-4 font-semibold">
                  {course.primaryTeacher || "อาจารย์ผู้สอน"}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600 pt-0.5">
              <span>
                กำหนดส่ง วันที่...............เดือน................................พ.ศ. {currentYearBE}
              </span>
              <span className="italic font-bold text-slate-700">
                (โปรดกรอกคะแนนด้วยปากกาเท่านั้น ห้ามกรอกด้วยดินสอดำ)
              </span>
            </div>
          </div>

          {/* Main Grade Table (10 Columns exact match with PDF) */}
          <table className="w-full border-collapse border border-black text-center text-xs mb-4">
            <thead>
              <tr className="bg-slate-50 print:bg-transparent font-bold">
                <th className="border border-black px-2 py-2 w-10">ที่</th>
                <th className="border border-black px-2 py-2 w-28 font-mono">รหัส</th>
                <th className="border border-black px-3 py-2 text-left">ชื่อฉายา-นามสกุล</th>
                
                {/* 4 Score columns matching PDF */}
                <th className="border border-black px-1.5 py-2 w-14 text-center leading-tight">
                  <div className="flex flex-col items-center">
                    <span>จิต</span>
                    <span>พิ</span>
                    <span>สัย</span>
                    <span className="text-[10px] text-slate-500 font-normal">({config.affectiveMax})</span>
                  </div>
                </th>
                <th className="border border-black px-1.5 py-2 w-14 text-center leading-tight">
                  <div className="flex flex-col items-center">
                    <span>ราย</span>
                    <span>งาน</span>
                    <span className="text-[10px] text-slate-500 font-normal">({config.assignmentMax})</span>
                  </div>
                </th>
                <th className="border border-black px-1.5 py-2 w-16 text-center leading-tight">
                  <div className="flex flex-col items-center">
                    <span>สอบ</span>
                    <span>ระหว่าง</span>
                    <span>ภาค</span>
                    <span className="text-[10px] text-slate-500 font-normal">({config.midtermMax})</span>
                  </div>
                </th>
                <th className="border border-black px-1.5 py-2 w-16 text-center leading-tight">
                  <div className="flex flex-col items-center">
                    <span>สอบ</span>
                    <span>ปลาย</span>
                    <span>ภาค</span>
                    <span className="text-[10px] text-slate-500 font-normal">({config.finalMax})</span>
                  </div>
                </th>

                <th className="border border-black px-2 py-2 w-14 font-bold">รวม</th>
                <th className="border border-black px-2 py-2 w-14 font-bold">ระดับ</th>
                <th className="border border-black px-2 py-2 w-24">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, idx) => {
                const total = student.totalScore;
                const grade = student.grade;
                // Only show transfer remark if explicitly enabled or entered by instructor
                const isTransfer = student.studyStatus?.includes("เทียบโอน");
                const remarks = student.gradeRemarks || (showTransferRemarks && isTransfer ? "เทียบโอน" : "");

                return (
                  <tr key={student.enrollmentId} className="hover:bg-slate-50/50 print:hover:bg-transparent">
                    <td className="border border-black px-1 py-1.5 text-center font-mono">
                      {idx + 1}
                    </td>
                    <td className="border border-black px-2 py-1.5 font-mono text-center font-bold">
                      {student.studentCode}
                    </td>
                    <td className="border border-black px-3 py-1.5 text-left font-medium">
                      {student.fullName}
                    </td>
                    <td className="border border-black px-1 py-1.5 font-mono">
                      {student.affectiveScore !== null ? student.affectiveScore : "-"}
                    </td>
                    <td className="border border-black px-1 py-1.5 font-mono">
                      {student.assignmentScore !== null ? student.assignmentScore : "-"}
                    </td>
                    <td className="border border-black px-1 py-1.5 font-mono">
                      {student.midtermScore !== null ? student.midtermScore : "-"}
                    </td>
                    <td className="border border-black px-1 py-1.5 font-mono">
                      {mode === "final"
                        ? student.finalScore !== null
                          ? student.finalScore
                          : "-"
                        : "-"}
                    </td>
                    <td className="border border-black px-1 py-1.5 font-mono font-bold">
                      {total !== null ? total : "-"}
                    </td>
                    <td className="border border-black px-1 py-1.5 font-bold font-mono text-center">
                      {grade || "-"}
                    </td>
                    <td className="border border-black px-2 py-1.5 text-xs text-center">
                      {remarks}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Exam Summary Statistics Block */}
          <div className="border border-black p-3 text-xs space-y-2 mb-4 bg-slate-50/30 print:bg-transparent leading-relaxed">
            <div className="flex flex-wrap items-center justify-between gap-2 font-bold border-b border-black/40 pb-1.5">
              <span>สรุปผลการสอบ</span>
              <span>
                ผู้เข้าสอบทั้งหมด: <span className="font-mono underline">{attendedExamCount}</span> รูป/คน
              </span>
              <span>
                ขาดสอบ: <span className="font-mono underline">{absentExamCount}</span> รูป/คน
              </span>
              <span>
                รวมทั้งสิ้น: <span className="font-mono underline">{totalCount}</span> รูป/คน
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 text-center font-semibold text-[11px]">
              <div>ได้ระดับ A: <span className="font-bold underline">{gradeCounts["A"] || 0}</span></div>
              <div>ได้ระดับ B+: <span className="font-bold underline">{gradeCounts["B+"] || 0}</span></div>
              <div>ได้ระดับ B: <span className="font-bold underline">{gradeCounts["B"] || 0}</span></div>
              <div>ได้ระดับ C+: <span className="font-bold underline">{gradeCounts["C+"] || 0}</span></div>
              <div>ได้ระดับ C: <span className="font-bold underline">{gradeCounts["C"] || 0}</span></div>
              <div>ได้ระดับ D+: <span className="font-bold underline">{gradeCounts["D+"] || 0}</span></div>
              <div>ได้ระดับ D: <span className="font-bold underline">{gradeCounts["D"] || 0}</span></div>
              <div>ได้ระดับ F: <span className="font-bold underline">{gradeCounts["F"] || 0}</span></div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-black/30 text-[11px]">
              <span>
                คะแนนสูงสุด: <span className="font-mono font-bold underline">{maxScore !== null ? maxScore : "-"}</span> คะแนน
              </span>
              <span>
                คะแนนต่ำสุด: <span className="font-mono font-bold underline">{minScore !== null ? minScore : "-"}</span> คะแนน
              </span>
              <span className="font-bold text-slate-800">
                รับรองว่าถูกต้องตามนี้
              </span>
            </div>
          </div>

          {/* Signature Block */}
          <div className="grid grid-cols-2 gap-8 text-center text-xs mt-6 mb-4">
            <div className="space-y-2">
              <p>ลงชื่อ .............................................................. หัวหน้าภาค</p>
              <p>( .............................................................. )</p>
              <p>วันที่ .......... / .................... / {currentYearBE}</p>
            </div>
            <div className="space-y-2">
              <p>ลงชื่อ .............................................................. อาจารย์ผู้บรรยาย</p>
              <p>( {course.primaryTeacher || ".............................................................."} )</p>
              <p>วันที่ .......... / .................... / {currentYearBE}</p>
            </div>
          </div>

          {/* Quality Assurance Regulations Footer Note */}
          <div className="text-[10px] text-slate-700 border-t border-slate-300 pt-2 space-y-1 leading-snug">
            <p className="font-bold">
              ** เมื่อกรอกผลคะแนนเสร็จแล้ว กรุณาสำเนาใบกรอกคะแนนฉบับนี้หรือปริ๊นจากระบบกรอกคะแนนออนไลน์
              ส่งที่ สนง.คณบดีคณะพุทธศาสตร์ เพื่อรวบรวมสำหรับการประกันคุณภาพการศึกษา แต่ละปีการศึกษา
            </p>
            <p>
              หมายเหตุ : กรณีหลังจากส่งใบกรอกคะแนนสอบหรือกรอกผลสอบเข้าระบบแล้ว ถ้ามีการแก้ไขเกรดใด ๆ
              ต้องมีลายมือชื่ออาจารย์ผู้บรรยาย กำกับไว้ทุกครั้ง หรือลายมือชื่อของเจ้าหน้าที่ผู้รับผิดชอบ
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
