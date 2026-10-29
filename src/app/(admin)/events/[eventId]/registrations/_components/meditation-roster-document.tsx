 
"use client";

import React, { useState, useMemo } from "react";
import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  MeditationConfig,
  DailyAttendanceMap,
  PeriodAttendanceItem,
} from "@/features/events/meditation-types";

interface AttendeeItem {
  id: string;
  studentCode: string;
  studentName: string;
  role: string;
  major?: string | null;
  yearLevel?: number | null;
  department?: string | null;
  status: string;
  groupNumber?: number | null;
  groupName?: string | null;
  program?: string | null;
  dailyAttendance?: DailyAttendanceMap | null;
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
  meditationConfig?: MeditationConfig | null;
}

interface Props {
  event: EventData;
  attendees: AttendeeItem[];
  onClose: () => void;
  defaultDayKey?: string;
  defaultGroup?: number | null;
}

export function MeditationRosterDocument({
  event,
  attendees,
  onClose,
  defaultDayKey = "day_1",
  defaultGroup = null,
}: Props) {
  const [selectedGroup, setSelectedGroup] = useState<number | "ALL">(defaultGroup ?? "ALL");
  const [selectedProgram, setSelectedProgram] = useState<"ALL" | "THAI" | "ENGLISH">("ALL");
  const [selectedDayKey, setSelectedDayKey] = useState<string>(defaultDayKey);
  const [printMode, setPrintMode] = useState<"BLANK" | "FILLED">("FILLED");

  const config = event.meditationConfig || {
    daysCount: 12,
    startDate: "2025-12-11",
    endDate: "2025-12-22",
    locationTh: "ณ อาคารปฏิบัติธรรมโพธิญาณมหาวิชชาลัย ต.ศาลายา อ.พุทธมณฑล จ.นครปฐม",
    locationEn: "AT Bodhiyanmahavijjalai, Nakhon Pathom",
    periods: [
      { id: "p1", nameTh: "ภาคเช้ามืด", nameEn: "Dawn Period", time: "04.00-04.30" },
      { id: "p2", nameTh: "ภาคเช้า", nameEn: "Morning Period", time: "08.00-08.30" },
      { id: "p3", nameTh: "ภาคบ่าย", nameEn: "Afternoon Period", time: "12.30-13.00" },
      { id: "p4", nameTh: "ภาคค่ำ", nameEn: "Evening Period", time: "17.30-18.00" },
    ],
    groups: [],
    rulesTh: [
      "นิสิตจะต้องลงชื่อตามช่วงเวลาที่กำหนดให้ข้างต้นนี้ หากไม่ลงชื่อตามช่วงเวลาที่กำหนด ถือว่าขาดในช่วงระยะเวลานั้น ๆ",
      "หากขาด ๔ ช่วงเวลา เท่ากับว่าขาด ๑ วัน และถือว่าไม่ผ่านการปฏิบัติ",
    ],
    rulesEn: [
      "Please sign–in during the scheduled times above. Or you will not get credit for your ATTANDANCE !",
      "In order to get one full-day credit, you must sign in for 4 periods which can be done in different days.",
    ],
  };

  // Extract all distinct groups
  const allGroups = useMemo(() => {
    const map = new Map<number, { groupNumber: number; program: string; name: string }>();
    attendees.forEach((a) => {
      const gNum = a.groupNumber || (a.program === "ENGLISH" ? 12 : 1);
      if (!map.has(gNum)) {
        map.set(gNum, {
          groupNumber: gNum,
          program: a.program || (gNum >= 10 ? "ENGLISH" : "THAI"),
          name: a.groupName || (a.program === "ENGLISH" ? `Group : ${gNum}` : `กลุ่มที่ : ${gNum}`),
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.groupNumber - b.groupNumber);
  }, [attendees]);

  // Grouped attendees per group sheet
  const groupSheets = useMemo(() => {
    const filteredGroups = allGroups.filter((g) => {
      if (selectedGroup !== "ALL" && g.groupNumber !== selectedGroup) return false;
      if (selectedProgram !== "ALL" && g.program !== selectedProgram) return false;
      return true;
    });

    return filteredGroups.map((g) => {
      const groupAttendees = attendees.filter(
        (a) => (a.groupNumber || (a.program === "ENGLISH" ? 12 : 1)) === g.groupNumber
      );
      return {
        groupInfo: g,
        attendees: groupAttendees,
      };
    });
  }, [allGroups, attendees, selectedGroup, selectedProgram]);

  // Calculate day index and date display
  const dayNumber = parseInt(selectedDayKey.replace("day_", ""), 10) || 1;
  const startDate = new Date(config.startDate || "2025-12-11");
  const currentDate = new Date(startDate);
  currentDate.setDate(startDate.getDate() + (dayNumber - 1));

  const thaiDayDate = currentDate.getDate();
  const thaiMonth = "ธันวาคม";
  const thaiYear = "2568";

  const engDayDate = currentDate.getDate();
  const engMonth = "December";
  const engYear = "2025";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-md flex flex-col items-center">
      {/* Top Toolbar (Hidden on Print) */}
      <div className="sticky top-0 z-50 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-md py-3 px-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 font-bold">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              พิมพ์บัญชีเช็คชื่อการปฏิบัติวิปัสสนากัมมัฏฐาน (A4 Official Roster)
            </h2>
            <p className="text-xs text-slate-500">
              รองรับทั้งหลักสูตรภาษาไทย (Thai Program) และภาษาอังกฤษ (English Program)
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Program filter */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setSelectedProgram("ALL");
                setSelectedGroup("ALL");
              }}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                selectedProgram === "ALL"
                  ? "bg-white dark:bg-slate-700 shadow-xs text-slate-900 dark:text-white"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              ทุกหลักสูตร
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedProgram("THAI");
                setSelectedGroup("ALL");
              }}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                selectedProgram === "THAI"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              หลักสูตรภาษาไทย
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedProgram("ENGLISH");
                setSelectedGroup(12);
              }}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                selectedProgram === "ENGLISH"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              English Program
            </button>
          </div>

          {/* Group selector */}
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
          >
            <option value="ALL">พิมพ์ทุกกลุ่ม ({allGroups.length} กลุ่ม)</option>
            {allGroups.map((g) => (
              <option key={g.groupNumber} value={g.groupNumber}>
                {g.program === "ENGLISH" ? `English: Group ${g.groupNumber}` : `ไทย: กลุ่มที่ ${g.groupNumber}`}
              </option>
            ))}
          </select>

          {/* Day selector */}
          <select
            value={selectedDayKey}
            onChange={(e) => setSelectedDayKey(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
          >
            {Array.from({ length: config.daysCount || 12 }).map((_, i) => (
              <option key={`day_${i + 1}`} value={`day_${i + 1}`}>
                วันที่ {i + 1} (Day {i + 1} : {11 + i} ธ.ค. 2568)
              </option>
            ))}
          </select>

          {/* Print Mode: Blank vs Filled */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setPrintMode("FILLED")}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                printMode === "FILLED"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              พร้อมผลเช็คชื่อ
            </button>
            <button
              type="button"
              onClick={() => setPrintMode("BLANK")}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                printMode === "BLANK"
                  ? "bg-slate-700 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              ใบลงชื่อเปล่า (Blank)
            </button>
          </div>

          <Button
            onClick={() => window.print()}
            className="gap-2 bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
          >
            <Printer className="w-4 h-4" /> สั่งพิมพ์ (Ctrl+P)
          </Button>

          <Button variant="outline" onClick={onClose} size="icon" className="rounded-lg">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Printable Paper Sheets Container */}
      <div className="w-full flex flex-col items-center gap-8 py-8 print:p-0 print:gap-0">
        {groupSheets.length === 0 ? (
          <div className="p-12 text-center text-white bg-slate-800 rounded-2xl">
            ไม่พบรายชื่อในกลุ่มที่เลือก
          </div>
        ) : (
          groupSheets.map(({ groupInfo, attendees: gAttendees }) => {
            const isEnglish = groupInfo.program === "ENGLISH";

            return (
              <div
                key={groupInfo.groupNumber}
                className="meditation-page-sheet relative bg-white text-black shadow-2xl print:shadow-none w-[210mm] min-h-[297mm] p-[15mm] text-xs flex flex-col justify-between mb-8 print:mb-0 print:page-break-after-always"
                style={{
                  fontFamily: "'Sarabun', 'TH Sarabun New', 'Angsana New', sans-serif",
                  boxSizing: "border-box",
                }}
              >
                {/* ============================================================== */}
                {/* ENGLISH PROGRAM HEADER                                         */}
                {/* ============================================================== */}
                {isEnglish ? (
                  <div>
                    {/* Big Group Number top-right */}
                    <div className="absolute top-[12mm] right-[15mm] text-right">
                      <span className="text-5xl font-extrabold tracking-tight">{groupInfo.groupNumber}</span>
                    </div>

                    <div className="text-center pt-2 pb-4 space-y-0.5 pr-16 pl-6">
                      <h1 className="text-sm font-bold text-slate-950">
                        The Name List for the 1<sup>st</sup> - 4<sup>th</sup> students of the Faculty of Buddhism. (English Program)
                      </h1>
                      <p className="text-xs font-semibold text-slate-800">
                        The Meditation Practice on December 11 - 22, 2025
                      </p>
                      <p className="text-xs font-medium text-slate-700">
                        AT Bodhiyanmahavijjalai, Nakhon Pathom
                      </p>
                      <p className="text-xs text-slate-600">
                        Date( {engDayDate} / {engMonth} / {engYear} )
                      </p>
                    </div>

                    {/* Group Header Box */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="border border-slate-900 px-3 py-1 text-sm font-bold">
                        Group : {groupInfo.groupNumber}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ============================================================== */
                  /* THAI PROGRAM HEADER                                            */
                  /* ============================================================== */
                  <div>
                    {/* Big Group Number top-right */}
                    <div className="absolute top-[12mm] right-[15mm] text-right">
                      <span className="text-5xl font-extrabold tracking-tight">{groupInfo.groupNumber}</span>
                    </div>

                    <div className="text-center pt-2 pb-4 space-y-0.5 pr-16 pl-6">
                      <h1 className="text-sm font-bold text-slate-950">
                        บัญชีเช็คชื่อและเวลาปฏิบัติวิปัสสนากัมมัฏฐาน แต่ละวัน
                      </h1>
                      <p className="text-xs font-semibold text-slate-800">
                        นิสิตคณะพุทธศาสตร์ ชั้นปีที่ 1 - 4 ปีการศึกษา {event.academicYear || "2568"} (บรรพชิต/คฤหัสถ์)
                      </p>
                      <p className="text-xs font-medium text-slate-700">
                        {config.locationTh || "ณ อาคารปฏิบัติธรรมโพธิญาณมหาวิชชาลัย ต.ศาลายา อ.พุทธมณฑล จ.นครปฐม"}
                      </p>
                      <p className="text-xs text-slate-600">
                        วัน ........................... ที่ {thaiDayDate} เดือน {thaiMonth} พ.ศ. {thaiYear}
                      </p>
                    </div>

                    {/* Group Header Box */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="border border-slate-900 px-3 py-1 text-sm font-bold">
                        กลุ่มที่ : {groupInfo.groupNumber}
                      </div>
                    </div>
                  </div>
                )}

                {/* ============================================================== */}
                {/* TABLE OF ATTENDEES & 4 PERIODS                                 */}
                {/* ============================================================== */}
                <div className="flex-1">
                  <table className="w-full border-collapse border border-slate-900 text-[10.5px]">
                    <thead>
                      <tr className="bg-slate-50 text-slate-900">
                        <th
                          rowSpan={2}
                          className="border border-slate-900 px-1 py-1.5 text-center font-bold w-[38px]"
                        >
                          {isEnglish ? "No." : "ที่"}
                        </th>
                        <th
                          rowSpan={2}
                          className="border border-slate-900 px-2 py-1.5 text-left font-bold"
                        >
                          {isEnglish ? "Name/ Pali Name" : "ชื่อ ฉายา/นามสกุล"}
                        </th>
                        <th
                          rowSpan={2}
                          className="border border-slate-900 px-1 py-1.5 text-center font-bold w-[45px]"
                        >
                          {isEnglish ? "Vasa" : "สาขา"}
                        </th>
                        <th
                          rowSpan={2}
                          className="border border-slate-900 px-1 py-1.5 text-center font-bold w-[35px]"
                        >
                          {isEnglish ? "Group" : "กลุ่ม"}
                        </th>
                        <th
                          colSpan={4}
                          className="border border-slate-900 px-1 py-1 text-center font-bold"
                        >
                          {isEnglish ? "Signature" : "ลงชื่อ / ในแต่ละช่วงเวลา"}
                        </th>
                        <th
                          rowSpan={2}
                          className="border border-slate-900 px-1 py-1.5 text-center font-bold w-[65px]"
                        >
                          {isEnglish ? "Remark" : "หมายเหตุ"}
                        </th>
                      </tr>
                      <tr className="bg-slate-50 text-slate-800 text-[9.5px]">
                        <th className="border border-slate-900 px-1 py-1 text-center font-semibold w-[60px]">
                          {isEnglish ? "Dawn Period" : "ภาคเช้ามืด"}
                          <br />
                          <span className="font-normal text-[8.5px]">04.00-04.30</span>
                        </th>
                        <th className="border border-slate-900 px-1 py-1 text-center font-semibold w-[60px]">
                          {isEnglish ? "Morning Period" : "ภาคเช้า"}
                          <br />
                          <span className="font-normal text-[8.5px]">08.00-08.30</span>
                        </th>
                        <th className="border border-slate-900 px-1 py-1 text-center font-semibold w-[60px]">
                          {isEnglish ? "Afternoon Period" : "ภาคบ่าย"}
                          <br />
                          <span className="font-normal text-[8.5px]">12.30-13.00</span>
                        </th>
                        <th className="border border-slate-900 px-1 py-1 text-center font-semibold w-[60px]">
                          {isEnglish ? "Evening Period" : "ภาคค่ำ"}
                          <br />
                          <span className="font-normal text-[8.5px]">17.30-18.00</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {gAttendees.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="border border-slate-900 p-4 text-center text-slate-500">
                            ไม่มีรายชื่อในกลุ่มนี้
                          </td>
                        </tr>
                      ) : (
                        gAttendees.map((att, idx) => {
                          const daily = att.dailyAttendance?.[selectedDayKey] || {};
                          const p1 = daily.p1;
                          const p2 = daily.p2;
                          const p3 = daily.p3;
                          const p4 = daily.p4;

                          const renderCell = (periodItem?: PeriodAttendanceItem | null) => {
                            if (printMode === "BLANK") {
                              return <span className="text-slate-300">--------</span>;
                            }
                            if (!periodItem || !periodItem.status) {
                              return <span className="text-slate-300">--------</span>;
                            }
                            switch (periodItem.status) {
                              case "PRESENT":
                                return <span className="font-bold text-emerald-800">✔ มา</span>;
                              case "LATE":
                                return <span className="font-bold text-amber-800">⏱ สาย</span>;
                              case "ABSENT":
                                return <span className="font-bold text-rose-800">✖ ขาด</span>;
                              case "LEAVE":
                                return <span className="font-bold text-purple-800">🏥 ลา</span>;
                              default:
                                return <span className="text-slate-300">--------</span>;
                            }
                          };

                          return (
                            <tr key={att.id} className="hover:bg-slate-50/50">
                              <td className="border border-slate-900 px-1 py-1 text-center font-mono font-medium">
                                {att.studentCode || `${idx + 1}`}
                              </td>
                              <td className="border border-slate-900 px-2 py-1 font-medium">
                                {att.studentName}
                              </td>
                              <td className="border border-slate-900 px-1 py-1 text-center text-slate-700">
                                {att.major || "-"}
                              </td>
                              <td className="border border-slate-900 px-1 py-1 text-center font-bold">
                                {groupInfo.groupNumber}
                              </td>
                              <td className="border border-slate-900 px-1 py-1 text-center text-[10px]">
                                {renderCell(p1)}
                              </td>
                              <td className="border border-slate-900 px-1 py-1 text-center text-[10px]">
                                {renderCell(p2)}
                              </td>
                              <td className="border border-slate-900 px-1 py-1 text-center text-[10px]">
                                {renderCell(p3)}
                              </td>
                              <td className="border border-slate-900 px-1 py-1 text-center text-[10px]">
                                {renderCell(p4)}
                              </td>
                              <td className="border border-slate-900 px-1 py-1 text-center text-[9px] text-slate-600 truncate max-w-[65px]">
                                {printMode === "FILLED"
                                  ? p1?.note || p2?.note || p3?.note || p4?.note || att.remarks || ""
                                  : ""}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* ============================================================== */}
                {/* FOOTER & SIGNATURE BLOCK                                      */}
                {/* ============================================================== */}
                <div className="pt-4 space-y-3">
                  {/* Remark and Sign line */}
                  <div className="flex items-end justify-between">
                    <div className="flex-1 pr-6 space-y-1">
                      <p className="text-[10px] text-slate-800">
                        {isEnglish ? "Remark" : "หมายเหตุ / บันทึก"} .....................................................................................................................................................................
                      </p>
                      <p className="text-[10px] text-slate-800">
                        ...........................................................................................................................................................................................................
                      </p>
                    </div>

                    <div className="text-center shrink-0 pr-4">
                      <p className="text-[11px] font-bold mb-1">
                        {isEnglish ? "รับรองตามนี้" : "รับรองตามนี้"}
                      </p>
                      <div className="h-6"></div>
                      <p className="text-[10px] text-slate-800 font-medium">
                        ......................................................... {isEnglish ? "ผู้ดูแลกลุ่ม" : `อาจารย์ประจำกลุ่ม กลุ่มที่ : ${groupInfo.groupNumber}`}
                      </p>
                      <p className="text-[9.5px] text-slate-600 mt-1">
                        ......... / ............ / ..........
                      </p>
                    </div>

                    {/* Big Group Number bottom-right */}
                    <div className="text-right pl-4">
                      <span className="text-5xl font-extrabold tracking-tight">{groupInfo.groupNumber}</span>
                    </div>
                  </div>

                  {/* University Rules / Instructions */}
                  <div className="border-t border-slate-400 pt-2 text-[9.5px] text-slate-700 space-y-0.5">
                    {isEnglish ? (
                      <>
                        <p>• Please sign–in during the scheduled times above. Or you will not get credit for your ATTANDANCE !</p>
                        <p>• In order to get one full-day credit, you must sign in for 4 periods which can be done in different days.</p>
                      </>
                    ) : (
                      <>
                        <p>• นิสิตจะต้องลงชื่อตามช่วงเวลาที่กำหนดให้ข้างต้นนี้ หากไม่ลงชื่อตามช่วงเวลาที่กำหนด ถือว่าขาดในช่วงระยะเวลานั้น ๆ</p>
                        <p>• หากขาด ๔ ช่วงเวลา เท่ากับว่าขาด ๑ วัน และถือว่าไม่ผ่านการปฏิบัติ</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Embedded CSS for perfect A4 printing */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body {
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .meditation-page-sheet {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 5mm !important;
            width: 100% !important;
            min-height: 275mm !important;
            page-break-after: always !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
