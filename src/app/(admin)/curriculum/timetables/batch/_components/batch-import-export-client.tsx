 
"use client";

import * as React from "react";
import Link from "next/link";
import {
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Layers,
  Building2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiyonCard } from "@/shared/components/liyon";
import { toast } from "sonner";
import { batchImportTimetablesAction } from "@/features/curriculum/actions";
import {
  TimetableGridView,
  type TimetableSlot,
} from "@/features/curriculum/_components/timetable-grid-view";
import type { Curriculum, Department } from "@/generated/prisma";

interface BatchImportExportClientProps {
  timetables: any[];
  curriculums: Curriculum[];
  departments: Department[];
}

interface ParsedSlotRow {
  curriculumName: string;
  departmentName: string;
  academicYear: string;
  semester: number;
  yearLevel: number;
  room: string;
  termDates: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  courseCode: string;
  courseName: string;
  instructor: string;
  courseRoom: string;
  notes: string;
}

interface GroupedTimetablePreview {
  groupKey: string;
  titleTh: string;
  titleEn?: string;
  curriculumId?: string;
  curriculumName: string;
  departmentId?: string;
  departmentName: string;
  academicYear: string;
  semester: number;
  yearLevel: number;
  room: string;
  termDates: string;
  notes: string;
  slots: TimetableSlot[];
}

export function BatchImportExportClient({
  timetables,
  curriculums,
  departments,
}: BatchImportExportClientProps) {
  const [activeTab, setActiveTab] = React.useState<"import" | "export">("import");

  // ─────────────────────────────────────────────
  // IMPORT STATE
  // ─────────────────────────────────────────────
  const [csvContent, setCsvContent] = React.useState("");
  const [fileName, setFileName] = React.useState("");
  const [parsedRows, setParsedRows] = React.useState<ParsedSlotRow[]>([]);
  const [groupedTimetables, setGroupedTimetables] = React.useState<GroupedTimetablePreview[]>([]);
  const [parseErrors, setParseErrors] = React.useState<string[]>([]);
  const [isImporting, setIsImporting] = React.useState(false);
  const [importResult, setImportResult] = React.useState<{
    createdCount: number;
    updatedCount: number;
    totalSlots: number;
  } | null>(null);

  // ─────────────────────────────────────────────
  // EXPORT STATE
  // ─────────────────────────────────────────────
  const [exportFilterCurr, setExportFilterCurr] = React.useState<string>("ALL");
  const [exportFilterYear, setExportFilterYear] = React.useState<string>("ALL");
  const [selectedForPrint, setSelectedForPrint] = React.useState<string[]>(
    timetables.map((t) => t.id)
  );

  // ─────────────────────────────────────────────
  // CSV PARSER
  // ─────────────────────────────────────────────
  const parseCSV = (text: string): string[][] => {
    const lines: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let curVal = "";

    const clean = text.replace(/^\uFEFF/, "");

    for (let i = 0; i < clean.length; i++) {
      const char = clean[i];
      const nextChar = clean[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          curVal += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        row.push(curVal.trim());
        curVal = "";
      } else if ((char === "\r" || char === "\n") && !inQuotes) {
        if (char === "\r" && nextChar === "\n") i++;
        row.push(curVal.trim());
        if (row.some((cell) => cell.length > 0)) {
          lines.push(row);
        }
        row = [];
        curVal = "";
      } else {
        curVal += char;
      }
    }

    if (curVal.length > 0 || row.length > 0) {
      row.push(curVal.trim());
      if (row.some((cell) => cell.length > 0)) {
        lines.push(row);
      }
    }

    return lines;
  };

  const normalizeTimeString = (val: string, fallback: string): string => {
    if (!val || !val.trim()) return fallback;
    const clean = val.trim().replace(":", ".");
    const parts = clean.split(".");
    const h = parseInt(parts[0], 10);
    if (isNaN(h)) return fallback;
    const hStr = h < 10 ? `0${h}` : `${h}`;
    let mStr = "00";
    if (parts.length > 1) {
      const minPart = parts[1];
      if (minPart.length === 1) {
        // e.g. "4" -> "40"
        mStr = `${minPart}0`;
      } else {
        mStr = minPart.substring(0, 2);
      }
    }
    return `${hStr}.${mStr}`;
  };

  const parseDayOfWeek = (val: string): number => {
    const v = val.trim().toLowerCase();
    if (v === "1" || v.includes("จันทร์") || v.startsWith("mon")) return 1;
    if (v === "2" || v.includes("อังคาร") || v.startsWith("tue")) return 2;
    if (v === "3" || v.includes("พุธ") || v.startsWith("wed")) return 3;
    if (v === "4" || v.includes("พฤหัส") || v.startsWith("thu")) return 4;
    if (v === "5" || v.includes("ศุกร์") || v.startsWith("fri")) return 5;
    if (v === "6" || v.includes("เสาร์") || v.startsWith("sat")) return 6;
    if (v === "7" || v.includes("อาทิตย์") || v.startsWith("sun")) return 7;
    return 1;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      processCsvData(text);
    };
    reader.readAsText(file, "UTF-8");
  };

  const processCsvData = (rawText: string) => {
    try {
      const matrix = parseCSV(rawText);
      if (matrix.length < 2) {
        setParseErrors(["ไฟล์ CSV ต้องมีแถวหัวตารางและข้อมูลอย่างน้อย 1 แถว"]);
        return;
      }

      const headers = matrix[0].map((h) => h.toLowerCase());
      const findIndex = (keywords: string[]) => {
        return headers.findIndex((h) => keywords.some((k) => h.includes(k)));
      };

      const currIdx = findIndex(["หลักสูตร", "curriculum"]);
      const deptIdx = findIndex(["ภาควิชา", "department"]);
      const yearIdx = findIndex(["ปีการศึกษา", "academic_year"]);
      const semIdx = findIndex(["ภาคเรียน", "ภาคการศึกษา", "semester"]);
      const yearLevelIdx = findIndex(["ชั้นปี", "year_level"]);
      const roomIdx = findIndex(["ห้องเรียนประจำ", "ห้องเรียน", "main_room", "room"]);
      const termDatesIdx = findIndex(["ระยะเวลา", "วันเปิด", "term_dates"]);
      const dayIdx = findIndex(["วัน", "day"]);
      const startIdx = findIndex(["เวลาเริ่ม", "start_time", "start"]);
      const endIdx = findIndex(["เวลาสิ้นสุด", "end_time", "end"]);
      const codeIdx = findIndex(["รหัสวิชา", "course_code", "code"]);
      const nameIdx = findIndex(["ชื่อวิชา", "course_name", "title"]);
      const instIdx = findIndex(["อาจารย์", "ผู้สอน", "instructor"]);
      const courseRoomIdx = findIndex(["ห้องเรียนเฉพาะวิชา", "course_room"]);
      const notesIdx = findIndex(["หมายเหตุ", "notes"]);

      const rows: ParsedSlotRow[] = [];
      const errors: string[] = [];

      for (let i = 1; i < matrix.length; i++) {
        const r = matrix[i];
        if (r.length < 4 || !r.some((c) => c.length > 0)) continue;

        const courseCode = codeIdx >= 0 ? r[codeIdx] : r[10] || "";
        const courseName = nameIdx >= 0 ? r[nameIdx] : r[11] || "";

        if (!courseCode && !courseName) {
          continue;
        }

        const currName = currIdx >= 0 ? r[currIdx] : r[0] || "";
        const deptName = deptIdx >= 0 ? r[deptIdx] : r[1] || "";
        const acadYear = (yearIdx >= 0 ? r[yearIdx] : r[2]) || "2569";
        const semester = Number(semIdx >= 0 ? r[semIdx] : r[3]) || 1;
        const yearLevel = Number(yearLevelIdx >= 0 ? r[yearLevelIdx] : r[4]) || 1;
        const mainRoom = roomIdx >= 0 ? r[roomIdx] : r[5] || "";
        const termDates = termDatesIdx >= 0 ? r[termDatesIdx] : r[6] || "";
        const dayVal = dayIdx >= 0 ? r[dayIdx] : r[7] || "1";
        const startTime = normalizeTimeString(startIdx >= 0 ? r[startIdx] : r[8], "09.00");
        const endTime = normalizeTimeString(endIdx >= 0 ? r[endIdx] : r[9], "11.30");
        const instructor = (instIdx >= 0 ? r[instIdx] : r[12]) || "";
        const courseRoom = (courseRoomIdx >= 0 ? r[courseRoomIdx] : r[13]) || "";
        const notes = (notesIdx >= 0 ? r[notesIdx] : r[14]) || "";

        rows.push({
          curriculumName: currName,
          departmentName: deptName,
          academicYear: acadYear,
          semester,
          yearLevel,
          room: mainRoom,
          termDates,
          dayOfWeek: parseDayOfWeek(dayVal),
          startTime,
          endTime,
          courseCode,
          courseName,
          instructor,
          courseRoom,
          notes,
        });
      }

      if (rows.length === 0) {
        setParseErrors(["ไม่พบแถวข้อมูลรายวิชาในไฟล์ CSV กรุณาตรวจสอบหัวตาราง"]);
        return;
      }

      setParsedRows(rows);
      setParseErrors(errors);

      // Group into Timetables
      const groupsMap = new Map<string, GroupedTimetablePreview>();

      for (const row of rows) {
        // Find matching curriculum in database
        const matchedCurr = curriculums.find(
          (c) =>
            (row.curriculumName &&
              (c.nameTh.includes(row.curriculumName) ||
                (c.nameEn && c.nameEn.toLowerCase().includes(row.curriculumName.toLowerCase())))) ||
            (row.curriculumName &&
              row.curriculumName.toLowerCase().includes((c.nameEn || "").toLowerCase()))
        );

        // Find matching department
        const matchedDept = departments.find(
          (d) =>
            row.departmentName &&
            (d.nameTh.includes(row.departmentName) ||
              (d.nameEn && d.nameEn.toLowerCase().includes(row.departmentName.toLowerCase())))
        );

        const groupKey = `${matchedCurr?.id || row.curriculumName || "unknown"}__${row.yearLevel}__${row.academicYear}__${row.semester}`;

        let group = groupsMap.get(groupKey);
        if (!group) {
          const displayCurrName = matchedCurr?.nameTh || row.curriculumName || "หลักสูตร";
          group = {
            groupKey,
            titleTh: `ตารางสอนชั้นปีที่ ${row.yearLevel} ${displayCurrName}`,
            titleEn: matchedCurr?.nameEn ? `Timetable of Year ${row.yearLevel} Students` : undefined,
            curriculumId: matchedCurr?.id,
            curriculumName: displayCurrName,
            departmentId: matchedDept?.id || matchedCurr?.departmentId || undefined,
            departmentName: matchedDept?.nameTh || row.departmentName || "คณะพุทธศาสตร์",
            academicYear: row.academicYear,
            semester: row.semester,
            yearLevel: row.yearLevel,
            room: row.room,
            termDates: row.termDates,
            notes: row.notes,
            slots: [],
          };
          groupsMap.set(groupKey, group);
        }

        group.slots.push({
          id: "slot-import-" + Math.random().toString(36).substring(2, 9),
          dayOfWeek: row.dayOfWeek,
          startTime: row.startTime,
          endTime: row.endTime,
          courseCode: row.courseCode,
          courseName: row.courseName,
          instructor: row.instructor,
          room: row.courseRoom || null,
          periodLabel: row.startTime < "12.00" ? "เช้า" : "บ่าย",
        });
      }

      setGroupedTimetables(Array.from(groupsMap.values()));
      toast.success(`อ่านข้อมูลสำเร็จ: พบ ${groupsMap.size} ตารางเรียน รวม ${rows.length} รายวิชา`);
    } catch (err: any) {
      setParseErrors([err.message || "เกิดข้อผิดพลาดในการอ่านไฟล์ CSV"]);
    }
  };

  const handleDownloadTemplate = () => {
    const templateContent = `\uFEFF"หลักสูตร","ภาควิชา","ปีการศึกษา","ภาคเรียน","ชั้นปี","ห้องเรียนประจำ","วันเปิด-ปิดภาคเรียน","วันในสัปดาห์","เวลาเริ่ม","เวลาสิ้นสุด","รหัสวิชา","ชื่อวิชา","อาจารย์ผู้สอน","ห้องเรียนเฉพาะวิชา","หมายเหตุ"
"พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา (หลักสูตรภาษาอังกฤษ)","ภาควิชาพระพุทธศาสนา","2569","1","1","Room No. D 517-518","June 9, 2026 – September 25, 2026","1","09.00","11.30","101 101","Buddhism and Science","Dr. Onjira Wongsapan","","The class day is Buddhist Holy Day (Dhammasavana Day), it is replaced on Friday."
"พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา (หลักสูตรภาษาอังกฤษ)","ภาควิชาพระพุทธศาสนา","2569","1","1","Room No. D 517-518","June 9, 2026 – September 25, 2026","1","13.00","15.30","101 103","Communication in Tipitaka","Asst. Prof. Phramaha Yongyut Dhiradhammo, Ph.D. / Ven. Thit Zana","",""
"พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา (หลักสูตรภาษาอังกฤษ)","ภาควิชาพระพุทธศาสนา","2569","1","1","Room No. D 517-518","June 9, 2026 – September 25, 2026","2","09.00","11.30","000 102","General Law","Asst. Prof. Dr. Doungkamon Tongkanaraksa","",""
"พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา (หลักสูตรภาษาอังกฤษ)","ภาควิชาพระพุทธศาสนา","2569","1","1","Room No. D 517-518","June 9, 2026 – September 25, 2026","2","13.00","15.30","000 136","Pali","Assoc. Prof. Phra Dhammavajirapanyacarya, Ph.D. / Assoc. Prof. W. Piyaratana, Ph.D.","",""
"พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา (หลักสูตรภาษาอังกฤษ)","ภาควิชาพระพุทธศาสนา","2569","1","1","Room No. D 517-518","June 9, 2026 – September 25, 2026","2","15.30","17.00","0SP 101","Pali","Asst. Prof. Piphat Khongprasert","",""
"พุทธศาสตรบัณฑิต สาขาวิชาศาสนาและปรัชญา","ภาควิชาศาสนาและปรัชญา","2569","1","1","ชั้น 5 ห้อง D 516/1","9 มิถุนายน 2569 – 25 กันยายน 2569","1","09.00","11.30","000 102","กฎหมายทั่วไป","พระมหามงคลกานต์ ฐิตธมฺโม, รศ. ดร.*/อ.ดร.คงชิต ชินสิญจ์","","วันพระและวันนักขัตฤกษ์เป็นวันหยุดทั่วไป"
"พุทธศาสตรบัณฑิต สาขาวิชาศาสนาและปรัชญา","ภาควิชาศาสนาและปรัชญา","2569","1","1","ชั้น 5 ห้อง D 516/1","9 มิถุนายน 2569 – 25 กันยายน 2569","1","12.30","15.10","000 136","ภาษาบาลี","พระครูศรีสิทธิบัณฑิต, ดร./ผศ. ดร.บุญเกิด เจริญแนว*","",""
"พุทธศาสตรบัณฑิต สาขาวิชาศาสนาและปรัชญา","ภาควิชาศาสนาและปรัชญา","2569","1","1","ชั้น 5 ห้อง D 516/1","9 มิถุนายน 2569 – 25 กันยายน 2569","2","09.00","11.30","112 305","ปรัชญาอินเดียสมัยโบราณ (เรียนห้อง D 220/2)","พระจาตุรงค์ อาจารสุโภ, ผศ.ดร.*/พระมหาจรูญ กิตฺติปญฺโญ, ดร.","D 220/2",""
"พุทธศาสตรบัณฑิต สาขาวิชาศาสนาและปรัชญา","ภาควิชาศาสนาและปรัชญา","2569","1","1","ชั้น 5 ห้อง D 516/1","9 มิถุนายน 2569 – 25 กันยายน 2569","3","09.00","11.30","999 999","Ai เบื้องต้น","รศ.ดร.บัญญพน สวัสดี/ดร.วิศาล มายัง","",""
`;

    const blob = new Blob([templateContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "template_timetables.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmImport = async () => {
    if (groupedTimetables.length === 0) {
      toast.error("ไม่มีข้อมูลที่จะนำเข้า");
      return;
    }

    setIsImporting(true);
    try {
      const itemsToImport = groupedTimetables.map((g) => ({
        titleTh: g.titleTh,
        titleEn: g.titleEn || null,
        curriculumId: g.curriculumId || null,
        curriculumName: g.curriculumName || null,
        departmentId: g.departmentId || null,
        departmentName: g.departmentName || null,
        academicYear: g.academicYear,
        semester: g.semester,
        yearLevel: g.yearLevel,
        room: g.room || null,
        termDates: g.termDates || null,
        notes: g.notes || null,
        scheduleData: g.slots,
        isActive: true,
      }));

      const res = await batchImportTimetablesAction(itemsToImport);
      setImportResult(res);
      let successMsg = `นำเข้าตารางเรียนสำเร็จ! สร้างใหม่ ${res.createdCount} ตาราง, อัปเดต ${res.updatedCount} ตาราง (รวม ${res.totalSlots} รายวิชา)`;
      if ((res as any).autoCreatedCurriculums > 0 || (res as any).autoCreatedDepartments > 0) {
        successMsg += ` [สร้างหลักสูตรอัตโนมัติ: ${(res as any).autoCreatedCurriculums || 0}, สาขาวิชา: ${(res as any).autoCreatedDepartments || 0}]`;
      }
      toast.success(successMsg);
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการนำเข้าข้อมูล");
    } finally {
      setIsImporting(false);
    }
  };

  // ─────────────────────────────────────────────
  // EXPORT HANDLERS
  // ─────────────────────────────────────────────
  const filteredExportTimetables = React.useMemo(() => {
    return timetables.filter((t) => {
      if (exportFilterCurr !== "ALL" && t.curriculumId !== exportFilterCurr) return false;
      if (exportFilterYear !== "ALL" && String(t.yearLevel) !== exportFilterYear) return false;
      return true;
    });
  }, [timetables, exportFilterCurr, exportFilterYear]);

  const handleExportCSV = () => {
    const header = [
      "หลักสูตร",
      "ภาควิชา",
      "ปีการศึกษา",
      "ภาคเรียน",
      "ชั้นปี",
      "ห้องเรียนประจำ",
      "วันเปิด-ปิดภาคเรียน",
      "วันในสัปดาห์",
      "เวลาเริ่ม",
      "เวลาสิ้นสุด",
      "รหัสวิชา",
      "ชื่อวิชา",
      "อาจารย์ผู้สอน",
      "ห้องเรียนเฉพาะวิชา",
      "หมายเหตุ",
    ];

    const rows: string[][] = [];

    for (const t of filteredExportTimetables) {
      const currName = t.curriculum?.nameTh || t.titleTh;
      const deptName = t.department?.nameTh || "";
      const acadYear = t.academicYear || "2569";
      const sem = String(t.semester || 1);
      const yLevel = String(t.yearLevel || 1);
      const room = t.room || "";
      const termDates = t.termDates || "";
      const notes = t.notes || "";

      const slots = Array.isArray(t.scheduleData) ? t.scheduleData : [];
      if (slots.length === 0) {
        rows.push([
          currName,
          deptName,
          acadYear,
          sem,
          yLevel,
          room,
          termDates,
          "1",
          "-",
          "-",
          "-",
          "-",
          "-",
          "",
          notes,
        ]);
      } else {
        for (const s of slots) {
          rows.push([
            currName,
            deptName,
            acadYear,
            sem,
            yLevel,
            room,
            termDates,
            String(s.dayOfWeek || 1),
            s.startTime || "",
            s.endTime || "",
            s.courseCode || "",
            s.courseName || "",
            s.instructor || "",
            s.room || "",
            notes,
          ]);
        }
      }
    }

    const csvLines = [
      header.map((h) => `"${h}"`).join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${(cell || "").replace(/"/g, '""')}"`).join(",")
      ),
    ];

    const csvBlob = new Blob(["\uFEFF" + csvLines.join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(csvBlob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `timetables_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`ส่งออก CSV สำเร็จ: ${rows.length} รายการ`);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const toggleSelectForPrint = (id: string) => {
    setSelectedForPrint((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* ── TOP NAV & BREADCRUMB ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 print:hidden">
        <div>
          <Link
            href="/curriculum/timetables"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>กลับไปหน้ารายการตารางเรียน</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-primary" />
            <span>นำเข้าและส่งออกข้อมูลตารางเรียน (Batch Import / Export)</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            เครื่องมือนำเข้าข้อมูลตารางเรียนเป็นชุดผ่านไฟล์ CSV และส่งออกเป็น CSV / PDF สำหรับจัดพิมพ์
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border">
          <button
            type="button"
            onClick={() => setActiveTab("import")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "import"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-primary" />
            <span>นำเข้าข้อมูล (Import)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("export")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "export"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Download className="w-3.5 h-3.5 text-primary" />
            <span>ส่งออกข้อมูล (Export)</span>
          </button>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════ */}
      {/* TAB 1: BATCH IMPORT (CSV / TEXT)                        */}
      {/* ═════════════════════════════════════════════════════════ */}
      {activeTab === "import" && (
        <div className="space-y-6 print:hidden">
          {/* Instructions and Download Template Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <LiyonCard className="p-5 md:col-span-2 space-y-2">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-primary" />
                <span>ขั้นตอนการนำเข้าตารางเรียนเป็นชุดด้วย CSV</span>
              </h3>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside leading-relaxed">
                <li>
                  ดาวน์โหลดไฟล์ตัวอย่าง CSV (Template) ซึ่งมีหัวตารางและตัวอย่างข้อมูลพร้อมใช้
                </li>
                <li>
                  กรอกข้อมูลตารางเรียน เช่น หลักสูตร, ชั้นปี, วันในสัปดาห์, เวลา, รหัสวิชา, ชื่อวิชา, อาจารย์ผู้สอน
                </li>
                <li>
                  อัปโหลดไฟล์ CSV ด้านล่าง — ระบบจะจัดกลุ่มเป็นตารางเรียนของแต่ละชั้นปีโดยอัตโนมัติ
                </li>
                <li>ตรวจสอบความถูกต้องในตารางพรีวิว แล้วกดปุ่ม &ldquo;ยืนยันนำเข้าข้อมูลเป็นชุด&rdquo;</li>
              </ol>
            </LiyonCard>

            <LiyonCard className="p-5 flex flex-col justify-between space-y-3 bg-primary/5 border-primary/20">
              <div>
                <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                  Template Download
                </span>
                <h4 className="font-bold text-sm text-foreground mt-0.5">
                  ไฟล์ตัวอย่าง CSV เทมเพลต
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  มีตัวอย่างวิชาของหลักสูตรภาษาอังกฤษ และสาขาศาสนาและปรัชญา
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="gap-2 text-xs font-semibold bg-background hover:bg-muted cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-primary" />
                <span>ดาวน์โหลด Template (.csv)</span>
              </Button>
            </LiyonCard>
          </div>

          {/* Upload Dropzone */}
          <LiyonCard className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Upload className="w-4 h-4 text-primary" />
                  <span>อัปโหลดไฟล์ CSV</span>
                </h3>
                {fileName && (
                  <span className="text-xs text-primary font-medium bg-primary/10 px-2.5 py-0.5 rounded-md">
                    ไฟล์ที่เลือก: {fileName}
                  </span>
                )}
              </div>

              <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-primary/50 transition-colors bg-muted/10">
                <input
                  type="file"
                  id="csv-file-input"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="csv-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-sm text-foreground">
                    คลิกเพื่อเลือกไฟล์ หรือลากไฟล์ CSV มาวางที่นี่
                  </span>
                  <span className="text-xs text-muted-foreground">
                    รองรับไฟล์ .csv (UTF-8) ที่มีข้อมูลตารางเรียน
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 text-xs pointer-events-none"
                  >
                    เลือกไฟล์ CSV
                  </Button>
                </label>
              </div>

              {parseErrors.length > 0 && (
                <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    <span>พบข้อผิดพลาดในการอ่านไฟล์:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 pl-4">
                    {parseErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </LiyonCard>

          {/* Success Banner if already imported */}
          {importResult && (
            <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>นำเข้าข้อมูลตารางเรียนสำเร็จเรียบร้อยแล้ว!</span>
              </div>
              <p className="text-xs leading-relaxed">
                สร้างตารางเรียนใหม่: <b>{importResult.createdCount}</b> ตาราง | อัปเดตตารางเดิม:{" "}
                <b>{importResult.updatedCount}</b> ตาราง | รวมรายวิชาทั้งหมด:{" "}
                <b>{importResult.totalSlots}</b> รายวิชา
                {(importResult as any).autoCreatedCurriculums > 0 && (
                  <span>
                    {" "}
                    | สร้างหลักสูตรใหม่อัตโนมัติ:{" "}
                    <b className="text-primary">{(importResult as any).autoCreatedCurriculums}</b> หลักสูตร
                  </span>
                )}
                {(importResult as any).autoCreatedDepartments > 0 && (
                  <span>
                    {" "}
                    | สร้างสาขาวิชาใหม่อัตโนมัติ:{" "}
                    <b className="text-primary">{(importResult as any).autoCreatedDepartments}</b> สาขา
                  </span>
                )}
              </p>
              <div className="pt-2 flex items-center gap-3">
                <Link href="/curriculum/timetables">
                  <Button size="sm" className="text-xs font-semibold">
                    ดูหน้ารายการตารางเรียน
                  </Button>
                </Link>
                <Link href="/portal/timetables" target="_blank">
                  <Button variant="outline" size="sm" className="text-xs">
                    ดูตารางเรียนบน Web Portal
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Previews of Grouped Timetables */}
          {groupedTimetables.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>ข้อมูลที่จะนำเข้า: {groupedTimetables.length} ตารางเรียน</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-normal">
                      รวม {parsedRows.length} รายวิชา
                    </span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    ระบบได้รวมรายวิชาเข้ากับตารางเรียนของแต่ละชั้นปีเรียบร้อย สามารถตรวจสอบและกดบันทึก
                  </p>
                </div>

                <Button
                  onClick={handleConfirmImport}
                  disabled={isImporting}
                  className="gap-2 text-xs font-semibold shadow-sm cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {isImporting ? "กำลังนำเข้าข้อมูล..." : "ยืนยันนำเข้าข้อมูลเป็นชุด (Confirm Import)"}
                  </span>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupedTimetables.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl border border-border bg-card space-y-3 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs px-2.5 py-0.5 rounded-md bg-primary/10 text-primary">
                          ชั้นปีที่ {item.yearLevel}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-medium">
                          ภาค {item.semester}/{item.academicYear}
                        </span>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                        {item.slots.length} รายวิชา
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-foreground line-clamp-1">
                        {item.titleTh}
                      </h4>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-primary" />
                        <span>{item.departmentName}</span>
                        {item.room && <span>• 📍 {item.room}</span>}
                      </p>
                    </div>

                    {/* Quick list of slots */}
                    <div className="space-y-1.5 pt-2 border-t border-border/60 max-h-48 overflow-y-auto text-xs pr-1">
                      {item.slots.map((s, sIdx) => {
                        const dayName = ["", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"][
                          s.dayOfWeek
                        ];
                        return (
                          <div
                            key={sIdx}
                            className="p-2 rounded-lg bg-muted/40 border border-border/50 flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="font-semibold text-[11px] text-muted-foreground w-12 shrink-0">
                                {dayName}
                              </span>
                              <span className="font-mono text-primary font-bold shrink-0">
                                {s.courseCode}
                              </span>
                              <span className="truncate font-medium text-foreground">
                                {s.courseName}
                              </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                              {s.startTime} - {s.endTime}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════ */}
      {/* TAB 2: EXPORT (CSV & PDF)                                */}
      {/* ═════════════════════════════════════════════════════════ */}
      {activeTab === "export" && (
        <div className="space-y-6">
          {/* Controls Bar (Hidden in Print) */}
          <LiyonCard className="p-5 print:hidden space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Download className="w-4 h-4 text-primary" />
                  <span>ตัวเลือกการส่งออกข้อมูลตารางเรียน</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  เลือกหลักสูตรและชั้นปีที่ต้องการส่งออกเป็น CSV หรือพิมพ์เป็นเอกสาร PDF
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2.5">
                <Button
                  onClick={handleExportCSV}
                  variant="outline"
                  size="sm"
                  className="gap-2 text-xs font-semibold cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>ส่งออกเป็น CSV (Excel)</span>
                </Button>
                <Button
                  onClick={handlePrintPDF}
                  size="sm"
                  className="gap-2 text-xs font-semibold cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>พิมพ์ / บันทึก PDF</span>
                </Button>
              </div>
            </div>

            {/* Filter selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-3 border-t">
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">หลักสูตร</label>
                <select
                  value={exportFilterCurr}
                  onChange={(e) => setExportFilterCurr(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-border bg-background"
                >
                  <option value="ALL">🎓 ทุกหลักสูตร ({timetables.length} ตาราง)</option>
                  {curriculums.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameTh}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">ระดับชั้นปี</label>
                <select
                  value={exportFilterYear}
                  onChange={(e) => setExportFilterYear(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-border bg-background"
                >
                  <option value="ALL">📚 ทุกชั้นปี (1 - 4)</option>
                  <option value="1">ชั้นปีที่ 1</option>
                  <option value="2">ชั้นปีที่ 2</option>
                  <option value="3">ชั้นปีที่ 3</option>
                  <option value="4">ชั้นปีที่ 4</option>
                </select>
              </div>

              <div className="flex items-end">
                <div className="text-xs text-muted-foreground">
                  พบข้อมูลที่ตรงกับเงื่อนไข:{" "}
                  <b className="text-foreground">{filteredExportTimetables.length}</b> ตารางเรียน
                </div>
              </div>
            </div>
          </LiyonCard>

          {/* Timetable Selection Pill Bar (Hidden in Print) */}
          <div className="print:hidden space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-muted-foreground">
                เลือกตารางเรียนที่จะรวมในชุดจัดพิมพ์ PDF:
              </span>
              <button
                type="button"
                onClick={() =>
                  setSelectedForPrint(
                    selectedForPrint.length === filteredExportTimetables.length
                      ? []
                      : filteredExportTimetables.map((t) => t.id)
                  )
                }
                className="text-primary hover:underline font-semibold cursor-pointer"
              >
                {selectedForPrint.length === filteredExportTimetables.length
                  ? "ยกเลิกเลือกทั้งหมด"
                  : "เลือกทั้งหมด"}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {filteredExportTimetables.map((t) => {
                const isSelected = selectedForPrint.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleSelectForPrint(t.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <span>
                      ชั้นปีที่ {t.yearLevel} - {t.titleTh}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── PRINT / PDF LIVE PREVIEW CONTAINER ── */}
          <div className="space-y-8 print:space-y-12">
            {filteredExportTimetables
              .filter((t) => selectedForPrint.includes(t.id))
              .map((t) => (
                <div key={t.id} className="print:break-after-page">
                  <TimetableGridView timetable={t} showHeaderActions={false} />
                </div>
              ))}

            {filteredExportTimetables.filter((t) => selectedForPrint.includes(t.id)).length ===
              0 && (
              <div className="py-16 text-center text-muted-foreground rounded-2xl border border-dashed p-6 print:hidden">
                <FileText className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
                <p className="font-semibold text-sm">ยังไม่ได้เลือกตารางเรียนที่จะแสดง</p>
                <p className="text-xs mt-1">กรุณาเลือกตารางเรียนจากแถบด้านบน</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
