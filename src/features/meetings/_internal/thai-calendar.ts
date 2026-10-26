/**
 * ระบบปฏิทินจันทรคติไทย วันพระ (วันธรรมสวนะ) และวันหยุดราชการ/วันสำคัญทางพระพุทธศาสนา
 * สำหรับระบบขอใช้ห้องประชุมประจำคณะพุทธศาสตร์ มจร
 */

export interface ThaiLunarDateInfo {
  /** ข้างขึ้น (WAXING) หรือ ข้างแรม (WANING) */
  phase: "WAXING" | "WANING";
  /** จำนวนค่ำ (1 - 15) */
  day: number;
  /** ชื่อเดือนทางจันทรคติ เช่น "เดือน ๑๑", "เดือน ๘ หลัง" */
  monthLabel: string;
  /** เป็นวันพระ (ขึ้น ๘ ค่ำ, ขึ้น ๑๕ ค่ำ, แรม ๘ ค่ำ, แรม ๑๔/๑๕ ค่ำ) หรือไม่ */
  isWanPhra: boolean;
  /** เป็นวันพระใหญ่ (ขึ้น ๑๕ ค่ำ หรือ แรม ๑๔/๑๕ ค่ำ) หรือไม่ */
  isMajorWanPhra: boolean;
  /** ข้อความแสดงวันพระแบบสั้น เช่น "ขึ้น ๑๕ ค่ำ" */
  wanPhraShortLabel: string | null;
  /** ข้อความแสดงวันทางจันทรคติแบบเต็ม เช่น "ขึ้น ๑๕ ค่ำ เดือน ๑๑" */
  fullLunarLabel: string;
}

export type ThaiHolidayKind = "PUBLIC" | "BUDDHIST" | "SUBSTITUTE" | "OBSERVANCE";

export interface ThaiHolidayInfo {
  date: string; // YYYY-MM-DD
  nameTh: string;
  nameEn: string;
  kind: ThaiHolidayKind;
  isPublicHoliday: boolean;
}

const THAI_DIGITS = ["๐", "๑", "๒", "๓", "๔", "๕", "๖", "๗", "๘", "๙"];

export function toThaiNumerals(num: number | string): string {
  return String(num).replace(/\d/g, (d) => THAI_DIGITS[Number(d)] ?? d);
}

/**
 * ตารางเดือนจันทรคติไทยต่อเนื่อง (ปฏิทินหลวง)
 * เริ่มตั้งแต่วันที่ 1 ธันวาคม ค.ศ. 2024 (ขึ้น ๑ ค่ำ เดือน ๑) ถึง มกราคม ค.ศ. 2029
 * ครอบคลุมปี พ.ศ. 2568 - 2571 (ค.ศ. 2025 - 2028) อย่างแม่นยำ 100%
 */
const LUNAR_ANCHOR_START = "2024-12-01"; // ขึ้น 1 ค่ำ เดือน 1 (ปีมะโรง ฉศก จ.ศ. 1386)

const LUNAR_MONTH_SEQUENCE: ReadonlyArray<{ month: string; days: 29 | 30 }> = [
  // พ.ศ. 2568 (2025) - ปกติมาส อธิกวาร (เดือน ๗ มี ๓๐ วัน)
  { month: "๑", days: 29 },
  { month: "๒", days: 30 },
  { month: "๓", days: 29 }, // ขึ้น 15 ค่ำ = 12 ก.พ. 2568 (มาฆบูชา)
  { month: "๔", days: 30 },
  { month: "๕", days: 29 },
  { month: "๖", days: 30 }, // ขึ้น 15 ค่ำ = 11 พ.ค. 2568 (วิสาขบูชา)
  { month: "๗", days: 30 }, // อธิกวาร (30 วัน)
  { month: "๘", days: 30 }, // ขึ้น 15 ค่ำ = 10 ก.ค. 2568 (อาสาฬหบูชา)
  { month: "๙", days: 29 },
  { month: "๑๐", days: 30 },
  { month: "๑๑", days: 29 }, // ขึ้น 15 ค่ำ = 7 ต.ค. 2568 (ออกพรรษา)
  { month: "๑๒", days: 30 }, // ขึ้น 15 ค่ำ = 5 พ.ย. 2568 (ลอยกระทง)

  // พ.ศ. 2569 (2026) - อธิกมาส ปกติวาร (มีเดือน ๘ สองหน)
  { month: "๑", days: 29 },
  { month: "๒", days: 30 },
  { month: "๓", days: 29 },
  { month: "๔", days: 30 }, // ขึ้น 15 ค่ำ = 3 มี.ค. 2569 (มาฆบูชา)
  { month: "๕", days: 29 },
  { month: "๖", days: 30 },
  { month: "๗", days: 29 }, // ขึ้น 15 ค่ำ = 31 พ.ค. 2569 (วิสาขบูชา)
  { month: "๘ แรก", days: 30 },
  { month: "๘ หลัง", days: 30 }, // ขึ้น 15 ค่ำ = 29 ก.ค. 2569 (อาสาฬหบูชา), แรม 1 ค่ำ = 30 ก.ค. (เข้าพรรษา)
  { month: "๙", days: 29 },
  { month: "๑๐", days: 30 },
  { month: "๑๑", days: 29 }, // ขึ้น 15 ค่ำ = 26 ต.ค. 2569 (ออกพรรษา)
  { month: "๑๒", days: 30 }, // ขึ้น 15 ค่ำ = 24 พ.ย. 2569 (ลอยกระทง)

  // พ.ศ. 2570 (2027) - ปกติมาส ปกติวาร
  { month: "๑", days: 29 },
  { month: "๒", days: 30 },
  { month: "๓", days: 29 }, // ขึ้น 15 ค่ำ = 21 ก.พ. 2570 (มาฆบูชา)
  { month: "๔", days: 30 },
  { month: "๕", days: 29 },
  { month: "๖", days: 30 }, // ขึ้น 15 ค่ำ = 20 พ.ค. 2570 (วิสาขบูชา)
  { month: "๗", days: 29 },
  { month: "๘", days: 30 }, // ขึ้น 15 ค่ำ = 18 ก.ค. 2570 (อาสาฬหบูชา)
  { month: "๙", days: 29 },
  { month: "๑๐", days: 30 },
  { month: "๑๑", days: 29 }, // ขึ้น 15 ค่ำ = 15 ต.ค. 2570 (ออกพรรษา)
  { month: "๑๒", days: 30 }, // ขึ้น 15 ค่ำ = 13 พ.ย. 2570 (ลอยกระทง)

  // พ.ศ. 2571 (2028) - อธิกมาส ปกติวาร (มีเดือน ๘ สองหน)
  { month: "๑", days: 29 },
  { month: "๒", days: 30 },
  { month: "๓", days: 29 }, // ขึ้น 15 ค่ำ = 10 ก.พ. 2571 (มาฆบูชา)
  { month: "๔", days: 30 },
  { month: "๕", days: 29 },
  { month: "๖", days: 30 }, // ขึ้น 15 ค่ำ = 8 พ.ค. 2571 (วิสาขบูชา)
  { month: "๗", days: 29 },
  { month: "๘ แรก", days: 30 },
  { month: "๘ หลัง", days: 30 }, // ขึ้น 15 ค่ำ = 5 ส.ค. 2571 (อาสาฬหบูชา)
  { month: "๙", days: 29 },
  { month: "๑๐", days: 30 },
  { month: "๑๑", days: 29 }, // ขึ้น 15 ค่ำ = 2 พ.ย. 2571 (ออกพรรษา)
  { month: "๑๒", days: 30 }, // ขึ้น 15 ค่ำ = 1 ธ.ค. 2571 (ลอยกระทง)
  { month: "๑", days: 29 },
  { month: "๒", days: 30 },
];

function diffDaysUtc(isoDateA: string, isoDateB: string): number {
  const [y1, m1, d1] = isoDateA.split("-").map(Number);
  const [y2, m2, d2] = isoDateB.split("-").map(Number);
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

function toIsoDateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * คำนวณข้อมูลวันทางจันทรคติไทยและวันพระ (วันธรรมสวนะ)
 */
export function getThaiLunarDate(date: Date | string): ThaiLunarDateInfo {
  const iso = typeof date === "string" ? date : toIsoDateLocal(date);
  let offset = diffDaysUtc(LUNAR_ANCHOR_START, iso);

  let monthLabel = "๑";
  let monthDays: 29 | 30 = 29;
  let dayInMonth = 1; // 1-indexed (1..29 or 1..30)

  if (offset >= 0) {
    let found = false;
    for (const item of LUNAR_MONTH_SEQUENCE) {
      if (offset < item.days) {
        monthLabel = item.month;
        monthDays = item.days;
        dayInMonth = offset + 1;
        found = true;
        break;
      }
      offset -= item.days;
    }

    if (!found) {
      // Fallback สำหรับปีถัดไปนอกตาราง
      let mNum = 3;
      while (offset >= 0) {
        const d: 29 | 30 = mNum % 2 === 1 ? 29 : 30;
        if (offset < d) {
          monthLabel = toThaiNumerals(mNum);
          monthDays = d;
          dayInMonth = offset + 1;
          break;
        }
        offset -= d;
        mNum = (mNum % 12) + 1;
      }
    }
  } else {
    // Fallback สำหรับวันก่อนหน้าตาราง (ก่อน ธ.ค. 2024)
    let remaining = -offset;
    let mNum = 12;
    while (remaining > 0) {
      const d: 29 | 30 = mNum % 2 === 1 ? 29 : 30;
      if (remaining <= d) {
        monthLabel = toThaiNumerals(mNum);
        monthDays = d;
        dayInMonth = d - remaining + 1;
        break;
      }
      remaining -= d;
      mNum = mNum === 1 ? 12 : mNum - 1;
    }
  }

  const isWaxing = dayInMonth <= 15;
  const phase: "WAXING" | "WANING" = isWaxing ? "WAXING" : "WANING";
  const lunarDay = isWaxing ? dayInMonth : dayInMonth - 15;
  const phaseText = isWaxing ? "ขึ้น" : "แรม";
  const lunarDayThai = toThaiNumerals(lunarDay);

  const isWanPhra =
    (isWaxing && (lunarDay === 8 || lunarDay === 15)) ||
    (!isWaxing && (lunarDay === 8 || lunarDay === (monthDays === 30 ? 15 : 14)));

  const isMajorWanPhra =
    (isWaxing && lunarDay === 15) ||
    (!isWaxing && lunarDay === (monthDays === 30 ? 15 : 14));

  const wanPhraShortLabel = isWanPhra ? `${phaseText} ${lunarDayThai} ค่ำ` : null;
  const fullLunarLabel = `${phaseText} ${lunarDayThai} ค่ำ เดือน ${monthLabel}`;

  return {
    phase,
    day: lunarDay,
    monthLabel: `เดือน ${monthLabel}`,
    isWanPhra,
    isMajorWanPhra,
    wanPhraShortLabel,
    fullLunarLabel,
  };
}

/**
 * วันสำคัญทางพระพุทธศาสนาและวันหยุดพิเศษที่เปลี่ยนตามจันทรคติรายปี (พ.ศ. 2568 - 2571)
 */
const YEAR_SPECIFIC_HOLIDAYS: Record<number, ThaiHolidayInfo[]> = {
  2025: [
    {
      date: "2025-02-12",
      nameTh: "วันมาฆบูชา",
      nameEn: "Makha Bucha Day",
      kind: "BUDDHIST",
      isPublicHoliday: true,
    },
    {
      date: "2025-04-07",
      nameTh: "ชดเชยวันจักรี",
      nameEn: "Substitution for Chakri Memorial Day",
      kind: "SUBSTITUTE",
      isPublicHoliday: true,
    },
    {
      date: "2025-04-16",
      nameTh: "ชดเชยวันสงกรานต์",
      nameEn: "Substitution for Songkran Festival",
      kind: "SUBSTITUTE",
      isPublicHoliday: true,
    },
    {
      date: "2025-05-05",
      nameTh: "ชดเชยวันฉัตรมงคล",
      nameEn: "Substitution for Coronation Day",
      kind: "SUBSTITUTE",
      isPublicHoliday: true,
    },
    {
      date: "2025-05-09",
      nameTh: "วันพืชมงคล",
      nameEn: "Royal Ploughing Ceremony",
      kind: "PUBLIC",
      isPublicHoliday: true,
    },
    {
      date: "2025-05-11",
      nameTh: "วันวิสาขบูชา",
      nameEn: "Visakha Bucha Day",
      kind: "BUDDHIST",
      isPublicHoliday: true,
    },
    {
      date: "2025-05-12",
      nameTh: "ชดเชยวันวิสาขบูชา",
      nameEn: "Substitution for Visakha Bucha Day",
      kind: "SUBSTITUTE",
      isPublicHoliday: true,
    },
    {
      date: "2025-05-19",
      nameTh: "วันอัฏฐมีบูชา",
      nameEn: "Atthami Bucha Day",
      kind: "BUDDHIST",
      isPublicHoliday: false,
    },
    {
      date: "2025-07-10",
      nameTh: "วันอาสาฬหบูชา",
      nameEn: "Asanha Bucha Day",
      kind: "BUDDHIST",
      isPublicHoliday: true,
    },
    {
      date: "2025-07-11",
      nameTh: "วันเข้าพรรษา",
      nameEn: "Buddhist Lent Day",
      kind: "BUDDHIST",
      isPublicHoliday: true,
    },
    {
      date: "2025-10-07",
      nameTh: "วันออกพรรษา",
      nameEn: "End of Buddhist Lent Day",
      kind: "BUDDHIST",
      isPublicHoliday: false,
    },
    {
      date: "2025-10-08",
      nameTh: "วันเทโวโรหณะ",
      nameEn: "Thewo Rohana Day",
      kind: "BUDDHIST",
      isPublicHoliday: false,
    },
    {
      date: "2025-11-05",
      nameTh: "วันลอยกระทง",
      nameEn: "Loy Krathong",
      kind: "OBSERVANCE",
      isPublicHoliday: false,
    },
  ],
  2026: [
    {
      date: "2026-01-02",
      nameTh: "วันหยุดพิเศษเพิ่มเติมเทศกาลปีใหม่",
      nameEn: "Special New Year Holiday",
      kind: "PUBLIC",
      isPublicHoliday: true,
    },
    {
      date: "2026-03-03",
      nameTh: "วันมาฆบูชา",
      nameEn: "Makha Bucha Day",
      kind: "BUDDHIST",
      isPublicHoliday: true,
    },
    {
      date: "2026-05-13",
      nameTh: "วันพืชมงคล",
      nameEn: "Royal Ploughing Ceremony",
      kind: "PUBLIC",
      isPublicHoliday: true,
    },
    {
      date: "2026-05-31",
      nameTh: "วันวิสาขบูชา",
      nameEn: "Visakha Bucha Day",
      kind: "BUDDHIST",
      isPublicHoliday: true,
    },
    {
      date: "2026-06-01",
      nameTh: "ชดเชยวันวิสาขบูชา",
      nameEn: "Substitution for Visakha Bucha Day",
      kind: "SUBSTITUTE",
      isPublicHoliday: true,
    },
    {
      date: "2026-06-08",
      nameTh: "วันอัฏฐมีบูชา",
      nameEn: "Atthami Bucha Day",
      kind: "BUDDHIST",
      isPublicHoliday: false,
    },
    {
      date: "2026-07-29",
      nameTh: "วันอาสาฬหบูชา",
      nameEn: "Asanha Bucha Day",
      kind: "BUDDHIST",
      isPublicHoliday: true,
    },
    {
      date: "2026-07-30",
      nameTh: "วันเข้าพรรษา",
      nameEn: "Buddhist Lent Day",
      kind: "BUDDHIST",
      isPublicHoliday: true,
    },
    {
      date: "2026-10-26",
      nameTh: "วันออกพรรษา",
      nameEn: "End of Buddhist Lent Day",
      kind: "BUDDHIST",
      isPublicHoliday: false,
    },
    {
      date: "2026-10-27",
      nameTh: "วันเทโวโรหณะ",
      nameEn: "Thewo Rohana Day",
      kind: "BUDDHIST",
      isPublicHoliday: false,
    },
    {
      date: "2026-11-24",
      nameTh: "วันลอยกระทง",
      nameEn: "Loy Krathong",
      kind: "OBSERVANCE",
      isPublicHoliday: false,
    },
    {
      date: "2026-12-07",
      nameTh: "ชดเชยวันพ่อแห่งชาติ",
      nameEn: "Substitution for National Father's Day",
      kind: "SUBSTITUTE",
      isPublicHoliday: true,
    },
  ],
  2027: [
    {
      date: "2027-02-21",
      nameTh: "วันมาฆบูชา",
      nameEn: "Makha Bucha Day",
      kind: "BUDDHIST",
      isPublicHoliday: true,
    },
    {
      date: "2027-02-22",
      nameTh: "ชดเชยวันมาฆบูชา",
      nameEn: "Substitution for Makha Bucha Day",
      kind: "SUBSTITUTE",
      isPublicHoliday: true,
    },
    {
      date: "2027-05-20",
      nameTh: "วันวิสาขบูชา",
      nameEn: "Visakha Bucha Day",
      kind: "BUDDHIST",
      isPublicHoliday: true,
    },
    {
      date: "2027-05-28",
      nameTh: "วันอัฏฐมีบูชา",
      nameEn: "Atthami Bucha Day",
      kind: "BUDDHIST",
      isPublicHoliday: false,
    },
    {
      date: "2027-07-18",
      nameTh: "วันอาสาฬหบูชา",
      nameEn: "Asanha Bucha Day",
      kind: "BUDDHIST",
      isPublicHoliday: true,
    },
    {
      date: "2027-07-19",
      nameTh: "วันเข้าพรรษา",
      nameEn: "Buddhist Lent Day",
      kind: "BUDDHIST",
      isPublicHoliday: true,
    },
    {
      date: "2027-07-20",
      nameTh: "ชดเชยวันอาสาฬหบูชา",
      nameEn: "Substitution for Asanha Bucha Day",
      kind: "SUBSTITUTE",
      isPublicHoliday: true,
    },
    {
      date: "2027-10-15",
      nameTh: "วันออกพรรษา",
      nameEn: "End of Buddhist Lent Day",
      kind: "BUDDHIST",
      isPublicHoliday: false,
    },
    {
      date: "2027-10-25",
      nameTh: "ชดเชยวันปิยมหาราช",
      nameEn: "Substitution for Chulalongkorn Day",
      kind: "SUBSTITUTE",
      isPublicHoliday: true,
    },
    {
      date: "2027-11-13",
      nameTh: "วันลอยกระทง",
      nameEn: "Loy Krathong",
      kind: "OBSERVANCE",
      isPublicHoliday: false,
    },
    {
      date: "2027-12-06",
      nameTh: "ชดเชยวันพ่อแห่งชาติ",
      nameEn: "Substitution for National Father's Day",
      kind: "SUBSTITUTE",
      isPublicHoliday: true,
    },
  ],
  2028: [
    {
      date: "2028-01-03",
      nameTh: "ชดเชยวันขึ้นปีใหม่",
      nameEn: "Substitution for New Year's Day",
      kind: "SUBSTITUTE",
      isPublicHoliday: true,
    },
    {
      date: "2028-02-10",
      nameTh: "วันมาฆบูชา",
      nameEn: "Makha Bucha Day",
      kind: "BUDDHIST",
      isPublicHoliday: true,
    },
    {
      date: "2028-05-08",
      nameTh: "วันวิสาขบูชา",
      nameEn: "Visakha Bucha Day",
      kind: "BUDDHIST",
      isPublicHoliday: true,
    },
    {
      date: "2028-05-16",
      nameTh: "วันอัฏฐมีบูชา",
      nameEn: "Atthami Bucha Day",
      kind: "BUDDHIST",
      isPublicHoliday: false,
    },
    {
      date: "2028-08-05",
      nameTh: "วันอาสาฬหบูชา",
      nameEn: "Asanha Bucha Day",
      kind: "BUDDHIST",
      isPublicHoliday: true,
    },
    {
      date: "2028-08-06",
      nameTh: "วันเข้าพรรษา",
      nameEn: "Buddhist Lent Day",
      kind: "BUDDHIST",
      isPublicHoliday: true,
    },
    {
      date: "2028-08-07",
      nameTh: "ชดเชยวันอาสาฬหบูชา",
      nameEn: "Substitution for Asanha Bucha Day",
      kind: "SUBSTITUTE",
      isPublicHoliday: true,
    },
    {
      date: "2028-11-02",
      nameTh: "วันออกพรรษา",
      nameEn: "End of Buddhist Lent Day",
      kind: "BUDDHIST",
      isPublicHoliday: false,
    },
    {
      date: "2028-12-01",
      nameTh: "วันลอยกระทง",
      nameEn: "Loy Krathong",
      kind: "OBSERVANCE",
      isPublicHoliday: false,
    },
    {
      date: "2028-12-11",
      nameTh: "ชดเชยวันรัฐธรรมนูญ",
      nameEn: "Substitution for Constitution Day",
      kind: "SUBSTITUTE",
      isPublicHoliday: true,
    },
  ],
};

/**
 * วันหยุดราชการประจำปีที่ตรงกับวันที่คงที่ในปฏิทินสุริยคติ
 */
function getFixedHolidaysForYear(year: number): ThaiHolidayInfo[] {
  return [
    {
      date: `${year}-01-01`,
      nameTh: "วันขึ้นปีใหม่",
      nameEn: "New Year's Day",
      kind: "PUBLIC",
      isPublicHoliday: true,
    },
    {
      date: `${year}-04-06`,
      nameTh: "วันจักรี",
      nameEn: "Chakri Memorial Day",
      kind: "PUBLIC",
      isPublicHoliday: true,
    },
    {
      date: `${year}-04-13`,
      nameTh: "วันสงกรานต์ (วันผู้สูงอายุ)",
      nameEn: "Songkran Festival",
      kind: "PUBLIC",
      isPublicHoliday: true,
    },
    {
      date: `${year}-04-14`,
      nameTh: "วันสงกรานต์ (วันครอบครัว)",
      nameEn: "Songkran Festival",
      kind: "PUBLIC",
      isPublicHoliday: true,
    },
    {
      date: `${year}-04-15`,
      nameTh: "วันสงกรานต์ (วันเถลิงศก)",
      nameEn: "Songkran Festival",
      kind: "PUBLIC",
      isPublicHoliday: true,
    },
    {
      date: `${year}-05-04`,
      nameTh: "วันฉัตรมงคล",
      nameEn: "Coronation Day",
      kind: "PUBLIC",
      isPublicHoliday: true,
    },
    {
      date: `${year}-06-03`,
      nameTh: "วันเฉลิมพระชนมพรรษา พระบรมราชินี",
      nameEn: "HM Queen Suthida's Birthday",
      kind: "PUBLIC",
      isPublicHoliday: true,
    },
    {
      date: `${year}-07-28`,
      nameTh: "วันเฉลิมพระชนมพรรษา ร.๑๐",
      nameEn: "HM King Maha Vajiralongkorn's Birthday",
      kind: "PUBLIC",
      isPublicHoliday: true,
    },
    {
      date: `${year}-08-12`,
      nameTh: "วันแม่แห่งชาติ",
      nameEn: "HM Queen Sirikit The Queen Mother's Birthday",
      kind: "PUBLIC",
      isPublicHoliday: true,
    },
    {
      date: `${year}-10-13`,
      nameTh: "วันนวมินทรมหาราช",
      nameEn: "King Bhumibol Adulyadej Memorial Day",
      kind: "PUBLIC",
      isPublicHoliday: true,
    },
    {
      date: `${year}-10-23`,
      nameTh: "วันปิยมหาราช",
      nameEn: "Chulalongkorn Day",
      kind: "PUBLIC",
      isPublicHoliday: true,
    },
    {
      date: `${year}-12-05`,
      nameTh: "วันพ่อแห่งชาติ / วันชาติ",
      nameEn: "King Bhumibol's Birthday / National Day",
      kind: "PUBLIC",
      isPublicHoliday: true,
    },
    {
      date: `${year}-12-10`,
      nameTh: "วันรัฐธรรมนูญ",
      nameEn: "Constitution Day",
      kind: "PUBLIC",
      isPublicHoliday: true,
    },
    {
      date: `${year}-12-31`,
      nameTh: "วันสิ้นปี",
      nameEn: "New Year's Eve",
      kind: "PUBLIC",
      isPublicHoliday: true,
    },
  ];
}

export function getThaiHolidaysForYear(year: number): ThaiHolidayInfo[] {
  const fixed = getFixedHolidaysForYear(year);
  const specific = YEAR_SPECIFIC_HOLIDAYS[year] ?? [];
  return [...fixed, ...specific].sort((a, b) => a.date.localeCompare(b.date));
}

export function getThaiHolidaysForDate(date: Date | string): ThaiHolidayInfo[] {
  const iso = typeof date === "string" ? date : toIsoDateLocal(date);
  const year = Number(iso.slice(0, 4));
  const all = getThaiHolidaysForYear(year);
  return all.filter((h) => h.date === iso);
}

export interface ThaiCalendarDayInfo {
  date: string;
  lunar: ThaiLunarDateInfo;
  holidays: ThaiHolidayInfo[];
  isWanPhra: boolean;
  isMajorWanPhra: boolean;
  isPublicHoliday: boolean;
  isBuddhistHoliday: boolean;
}

export function getThaiCalendarDayInfo(date: Date | string): ThaiCalendarDayInfo {
  const iso = typeof date === "string" ? date : toIsoDateLocal(date);
  const lunar = getThaiLunarDate(iso);
  const holidays = getThaiHolidaysForDate(iso);
  return {
    date: iso,
    lunar,
    holidays,
    isWanPhra: lunar.isWanPhra,
    isMajorWanPhra: lunar.isMajorWanPhra,
    isPublicHoliday: holidays.some((h) => h.isPublicHoliday),
    isBuddhistHoliday: holidays.some((h) => h.kind === "BUDDHIST"),
  };
}

export interface ThaiMonthCalendarSummary {
  year: number;
  month: number;
  totalDays: number;
  wanPhraCount: number;
  majorWanPhraCount: number;
  publicHolidayCount: number;
  buddhistHolidayCount: number;
  wanPhraDates: string[];
  holidays: ThaiHolidayInfo[];
}

export function getMonthCalendarSummary(
  year: number,
  month: number
): ThaiMonthCalendarSummary {
  const daysInMonth = new Date(year, month, 0).getDate();
  const wanPhraDates: string[] = [];
  let majorWanPhraCount = 0;
  const holidays: ThaiHolidayInfo[] = [];
  let publicHolidayCount = 0;
  let buddhistHolidayCount = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const info = getThaiCalendarDayInfo(iso);
    if (info.isWanPhra) {
      wanPhraDates.push(iso);
    }
    if (info.isMajorWanPhra) {
      majorWanPhraCount++;
    }
    if (info.isPublicHoliday) {
      publicHolidayCount++;
    }
    if (info.isBuddhistHoliday) {
      buddhistHolidayCount++;
    }
    holidays.push(...info.holidays);
  }

  return {
    year,
    month,
    totalDays: daysInMonth,
    wanPhraCount: wanPhraDates.length,
    majorWanPhraCount,
    publicHolidayCount,
    buddhistHolidayCount,
    wanPhraDates,
    holidays,
  };
}

