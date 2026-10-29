export interface MeditationPeriod {
  id: string;
  nameTh: string;
  nameEn: string;
  time: string;
}

export const DEFAULT_MEDITATION_PERIODS: MeditationPeriod[] = [
  { id: "p1", nameTh: "ภาคเช้ามืด", nameEn: "Dawn Period", time: "04.00-04.30" },
  { id: "p2", nameTh: "ภาคเช้า", nameEn: "Morning Period", time: "08.00-08.30" },
  { id: "p3", nameTh: "ภาคบ่าย", nameEn: "Afternoon Period", time: "12.30-13.00" },
  { id: "p4", nameTh: "ภาคค่ำ", nameEn: "Evening Period", time: "17.30-18.00" },
];

export interface MeditationGroup {
  groupNumber: number;
  nameTh: string;
  nameEn: string;
  program: "THAI" | "ENGLISH";
  advisorName?: string;
  location?: string;
}

export type MeditationAttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "LEAVE";

export interface PeriodAttendanceItem {
  status: MeditationAttendanceStatus;
  note?: string;
  updatedAt?: string;
}

export type DayAttendanceRecord = Record<string, PeriodAttendanceItem>; // periodId -> item

export type DailyAttendanceMap = Record<string, DayAttendanceRecord>; // dayKey ("day_1" or "2025-12-11") -> DayAttendanceRecord

export interface MeditationConfig {
  isMeditationEvent?: boolean;
  daysCount: number; // 10 - 12 (default 12)
  startDate: string; // "2025-12-11"
  endDate: string; // "2025-12-22"
  locationTh: string;
  locationEn: string;
  periods: MeditationPeriod[];
  groups: MeditationGroup[];
  rulesTh: string[];
  rulesEn: string[];
}

export const DEFAULT_MEDITATION_CONFIG: MeditationConfig = {
  isMeditationEvent: true,
  daysCount: 12,
  startDate: "2025-12-11",
  endDate: "2025-12-22",
  locationTh: "ณ อาคารปฏิบัติธรรมโพธิญาณมหาวิชชาลัย ต.ศาลายา อ.พุทธมณฑล จ.นครปฐม",
  locationEn: "AT Bodhiyanmahavijjalai, Nakhon Pathom",
  periods: DEFAULT_MEDITATION_PERIODS,
  groups: [
    { groupNumber: 1, nameTh: "กลุ่มที่ 1", nameEn: "Group 1", program: "THAI", advisorName: "พระมหาอาทิตย์ อภิธมฺโม" },
    { groupNumber: 2, nameTh: "กลุ่มที่ 2", nameEn: "Group 2", program: "THAI", advisorName: "พระครูสมุห์รัชกฤช ภทฺทปญฺโญ" },
    { groupNumber: 3, nameTh: "กลุ่มที่ 3", nameEn: "Group 3", program: "THAI", advisorName: "พระมหาอุเทน อุเทโน" },
    { groupNumber: 12, nameTh: "กลุ่มที่ 12 (English)", nameEn: "Group : 12", program: "ENGLISH", advisorName: "Ven. Dr. Phramaha Somphong" },
  ],
  rulesTh: [
    "นิสิตจะต้องลงชื่อตามช่วงเวลาที่กำหนดให้ข้างต้นนี้ หากไม่ลงชื่อตามช่วงเวลาที่กำหนด ถือว่าขาดในช่วงระยะเวลานั้น ๆ",
    "หากขาด ๔ ช่วงเวลา เท่ากับว่าขาด ๑ วัน และถือว่าไม่ผ่านการปฏิบัติ",
  ],
  rulesEn: [
    "Please sign-in during the scheduled times above. Or you will not get credit for your ATTENDANCE !",
    "In order to get one full-day credit, you must sign in for 4 periods which can be done in different days.",
  ],
};
