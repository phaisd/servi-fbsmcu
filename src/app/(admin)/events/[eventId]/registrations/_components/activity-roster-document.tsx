/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useMemo } from "react";
import { Printer, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AttendeeItem {
  id: string;
  studentCode: string;
  studentName: string;
  role: string;
  major?: string | null;
  yearLevel?: number | null;
  department?: string | null;
  status: string;
  remarks?: string | null;
}

interface EventData {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startDate: string | Date;
  endDate: string | Date;
  academicYear?: string | null;
  activityHours?: number;
  logoUrl?: string | null;
}

interface Props {
  event: EventData;
  attendees: AttendeeItem[];
  onClose: () => void;
}

export function ActivityRosterDocument({ event, attendees, onClose }: Props) {
  const [filterRole, setFilterRole] = useState<"ALL" | "STUDENT" | "TEACHER" | "EXECUTIVE">("ALL");
  const [filterMajor, setFilterMajor] = useState<string>("ALL");
  const [filterYear, setFilterYear] = useState<string>("ALL");

  // Format date display
  const dateObj = new Date(event.startDate);
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const logoSrc =
    event.logoUrl ||
    "/uploads/logo-b8eef236-b993-4bc9-a08c-b02935131b84-1792468122154.png";

  // Filter attendees
  const filtered = useMemo(() => {
    return attendees.filter((a) => {
      if (filterRole !== "ALL" && a.role !== filterRole) return false;
      if (filterMajor !== "ALL" && a.major !== filterMajor) return false;
      if (filterYear !== "ALL" && String(a.yearLevel) !== filterYear) return false;
      return true;
    });
  }, [attendees, filterRole, filterMajor, filterYear]);

  // Group attendees for printing:
  // 1. Buddhist Studies (Years 1, 2, 3, 4)
  // 2. Religion and Philosophy (Years 1, 2, 3, 4)
  // 3. Teachers & Lecturers
  const sections = useMemo(() => {
    const list: Array<{
      title: string;
      items: AttendeeItem[];
      isTeacher?: boolean;
    }> = [];

    // Students - Buddhist Studies
    const bsStudents = filtered.filter(
      (a) => a.role === "STUDENT" && (!a.major || a.major.includes("Buddhist"))
    );
    if (bsStudents.length > 0) {
      list.push({
        title: "Major : Buddhist Studies",
        items: bsStudents,
      });
    }

    // Students - Religion and Philosophy
    const rpStudents = filtered.filter(
      (a) => a.role === "STUDENT" && a.major?.includes("Religion")
    );
    if (rpStudents.length > 0) {
      list.push({
        title: "Major : Religion and Philosophy",
        items: rpStudents,
      });
    }

    // Students - Other / General
    const otherStudents = filtered.filter(
      (a) =>
        a.role === "STUDENT" &&
        a.major &&
        !a.major.includes("Buddhist") &&
        !a.major.includes("Religion")
    );
    if (otherStudents.length > 0) {
      list.push({
        title: "Major : General Programs",
        items: otherStudents,
      });
    }

    // 1. Executive Board & Distinguished Guests
    const executives = filtered.filter((a) => a.role === "EXECUTIVE");
    if (executives.length > 0) {
      list.push({
        title: "Executive Board & Distinguished Guests (คณะผู้บริหารและแขกผู้มีเกียรติ)",
        items: executives,
        isTeacher: true,
      });
    }

    // 2. Teachers & Faculty
    const teachers = filtered.filter((a) => a.role === "TEACHER");
    if (teachers.length > 0) {
      list.push({
        title: "Faculty Members & Lecturers (คณาจารย์และผู้บรรยาย)",
        items: teachers,
        isTeacher: true,
      });
    }

    return list;
  }, [filtered]);

  // Break items into pages of ~31 rows each (matching the PDF)
  const ROWS_PER_PAGE = 31;
  const pages = useMemo(() => {
    const pList: Array<{
      sectionTitle: string;
      items: Array<AttendeeItem & { itemNo: number }>;
      isTeacher?: boolean;
    }> = [];

    sections.forEach((sec) => {
      for (let i = 0; i < sec.items.length; i += ROWS_PER_PAGE) {
        const chunk = sec.items.slice(i, i + ROWS_PER_PAGE).map((item, idx) => ({
          ...item,
          itemNo: i + idx + 1,
        }));
        pList.push({
          sectionTitle: sec.title,
          items: chunk,
          isTeacher: sec.isTeacher,
        });
      }
    });

    return pList;
  }, [sections]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs overflow-y-auto flex justify-center p-2 sm:p-6 print:p-0 print:bg-white print:static print:overflow-visible">
      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl max-w-5xl w-full flex flex-col my-auto border border-slate-200 print:border-none print:shadow-none print:max-w-none print:w-full print:m-0 print:rounded-none">
        
        {/* ══════════ Top Control Bar (Screen Only) ══════════ */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-200 bg-slate-50 rounded-t-2xl print:hidden">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-slate-600 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> ตัวกรอง:
            </span>

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as "ALL" | "STUDENT" | "EXECUTIVE" | "TEACHER")}
              className="bg-white border border-slate-200 rounded-md px-2 py-1 text-xs"
            >
              <option value="ALL">กลุ่มผู้เข้าร่วม: ทั้งหมด</option>
              <option value="STUDENT">เฉพาะนิสิต (Students)</option>
              <option value="EXECUTIVE">เฉพาะคณะผู้บริหาร (Executives)</option>
              <option value="TEACHER">เฉพาะคณาจารย์ (Lecturers)</option>
            </select>

            <select
              value={filterMajor}
              onChange={(e) => setFilterMajor(e.target.value)}
              className="bg-white border border-slate-200 rounded-md px-2 py-1 text-xs"
            >
              <option value="ALL">สาขาวิชา: ทั้งหมด</option>
              <option value="Buddhist Studies">Buddhist Studies</option>
              <option value="Religion and Philosophy">Religion and Philosophy</option>
            </select>

            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="bg-white border border-slate-200 rounded-md px-2 py-1 text-xs"
            >
              <option value="ALL">ชั้นปี: ทั้งหมด</option>
              <option value="1">ชั้นปีที่ 1</option>
              <option value="2">ชั้นปีที่ 2</option>
              <option value="3">ชั้นปีที่ 3</option>
              <option value="4">ชั้นปีที่ 4</option>
            </select>

            <span className="text-slate-400">|</span>
            <span className="font-semibold text-slate-700">
              จำนวนทั้งหมด {filtered.length} รายการ ({pages.length} หน้า)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              size="sm"
              className="gap-1.5 bg-primary text-white hover:bg-primary/90 font-semibold shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์ใบลงทะเบียน A4 (Print Roster)</span>
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="gap-1 text-slate-600 hover:text-slate-900"
            >
              <X className="w-4 h-4" />
              <span>ปิด</span>
            </Button>
          </div>
        </div>

        {/* ══════════ A4 Printable Pages Container ══════════ */}
        <div className="p-4 sm:p-10 print:p-0 font-serif leading-tight bg-white">
          {pages.map((page, pIdx) => (
            <div
              key={pIdx}
              className={`bg-white text-slate-900 ${
                pIdx > 0 ? "mt-12 pt-8 border-t border-dashed border-slate-300 print:mt-0 print:pt-0 print:border-none" : ""
              } print:break-after-page`}
              style={{ minHeight: "297mm", pageBreakAfter: "always" }}
            >
              {/* Header: Logo & Title block (Exact match with PDF) */}
              <div className="text-center space-y-1 mb-4 pt-2">
                <div className="flex justify-center mb-2">
                  <img
                    src={logoSrc}
                    alt="MCU Seal"
                    className="w-16 h-16 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/uploads/mcu-logo.png";
                    }}
                  />
                </div>
                <h1 className="text-sm font-semibold tracking-wide text-slate-800">
                  {page.isTeacher
                    ? "Faculty & Staff Roster: Faculty of Buddhism (English Program)"
                    : "Student Roster: Bachelor of Arts Program, Faculty of Buddhism (English Program)"}
                </h1>
                <h2 className="text-base font-bold text-slate-950">
                  {event.title}
                </h2>
                <p className="text-xs font-medium text-slate-700">
                  {formattedDate}, from 12:00 p.m. Onwards
                </p>
                <p className="text-xs font-medium text-slate-700">
                  {event.location ||
                    "at the M.W.K. 48th Birthday Anniversary Auditorium, Mahachulalongkornrajavidyalaya University, Wang Noi, Phra Nakhon Si Ayutthaya"}
                </p>
              </div>

              {/* Major / Section Title */}
              <div className="text-xs font-bold text-slate-900 mb-1 px-1">
                {page.sectionTitle}
              </div>

              {/* Roster Table (No. | Student ID | Full Name | Year | Signature | Remarks / Note) */}
              <table className="w-full border-collapse border border-black text-center text-[11px] mb-4">
                <thead>
                  <tr className="bg-slate-50 print:bg-transparent font-bold">
                    <th className="border border-black px-1.5 py-1.5 w-10">No.</th>
                    <th className="border border-black px-2 py-1.5 w-28 font-mono">
                      {page.isTeacher ? "Personnel ID / Email" : "Student ID"}
                    </th>
                    <th className="border border-black px-3 py-1.5 text-left">Full Name</th>
                    <th className="border border-black px-2 py-1.5 w-14">
                      {page.isTeacher ? "Position / Year" : "Year"}
                    </th>
                    <th className="border border-black px-2 py-1.5 w-40">Signature</th>
                    <th className="border border-black px-2 py-1.5 w-28">Remarks / Note</th>
                  </tr>
                </thead>
                <tbody>
                  {page.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 print:hover:bg-transparent">
                      <td className="border border-black px-1 py-1.5 font-mono">
                        {item.itemNo}
                      </td>
                      <td className="border border-black px-2 py-1.5 font-mono text-center font-bold">
                        {item.studentCode}
                      </td>
                      <td className="border border-black px-3 py-1.5 text-left font-medium">
                        {item.studentName}
                      </td>
                      <td className="border border-black px-2 py-1.5 text-center font-mono">
                        {item.role === "EXECUTIVE" ? item.remarks || item.major || "ผู้บริหาร" : page.isTeacher ? "อาจารย์" : item.yearLevel || "-"}
                      </td>
                      <td className="border border-black px-2 py-1.5 text-center text-slate-400">
                        {item.status === "ATTENDED" ? (
                          <span className="text-[10px] text-emerald-700 font-semibold print:hidden">
                            ✓ เช็คชื่อแล้ว
                          </span>
                        ) : null}
                      </td>
                      <td className="border border-black px-2 py-1.5 text-center text-slate-700">
                        {item.remarks || ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Page Footer (Exact match with PDF) */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-200 mt-2">
                <span>บชกิจกรรมนิสิต69อัพเวป</span>
                <span>
                  {pIdx + 1} / {pages.length}
                </span>
                <span>กิจกรรม690523อังกฤษ</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
