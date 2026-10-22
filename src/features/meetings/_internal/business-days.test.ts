import { describe, it, expect } from "vitest";
import {
  isWeekend,
  formatDateToIsoDate,
  getEarliestBookingDate,
  validateAdvanceBookingDate,
} from "./business-days";

describe("Meeting Advance Business Days Validation", () => {
  it("ตรวจจับวันเสาร์-อาทิตย์ ได้ถูกต้อง", () => {
    // 2026-10-24 is Saturday, 2026-10-25 is Sunday
    expect(isWeekend(new Date("2026-10-24"))).toBe(true);
    expect(isWeekend(new Date("2026-10-25"))).toBe(true);
    // 2026-10-21 is Wednesday
    expect(isWeekend(new Date("2026-10-21"))).toBe(false);
  });

  it("ยื่นวันจันทร์ -> เว้นอังคาร (1 วันทำการ) -> เร็วที่สุดคือ วันพุธ", () => {
    // Monday 2026-10-19
    const monday = new Date("2026-10-19T09:00:00");
    const earliest = getEarliestBookingDate(monday, 1);
    expect(formatDateToIsoDate(earliest)).toBe("2026-10-21"); // Wednesday
  });

  it("ยื่นวันพุธ -> เว้นพฤหัสบดี (1 วันทำการ) -> เร็วที่สุดคือ วันศุกร์", () => {
    // Wednesday 2026-10-21
    const wednesday = new Date("2026-10-21T10:00:00");
    const earliest = getEarliestBookingDate(wednesday, 1);
    expect(formatDateToIsoDate(earliest)).toBe("2026-10-23"); // Friday
  });

  it("ยื่นวันพฤหัสบดี -> เว้นศุกร์ (1 วันทำการ) -> ข้ามเสาร์-อาทิตย์ -> เร็วที่สุดคือ วันจันทร์ถัดไป", () => {
    // Thursday 2026-10-22
    const thursday = new Date("2026-10-22T14:00:00");
    const earliest = getEarliestBookingDate(thursday, 1);
    expect(formatDateToIsoDate(earliest)).toBe("2026-10-26"); // Monday
  });

  it("ยื่นวันศุกร์ -> ข้ามเสาร์-อาทิตย์ -> เว้นจันทร์ (1 วันทำการ) -> เร็วที่สุดคือ วันอังคารถัดไป", () => {
    // Friday 2026-10-23
    const friday = new Date("2026-10-23T15:00:00");
    const earliest = getEarliestBookingDate(friday, 1);
    expect(formatDateToIsoDate(earliest)).toBe("2026-10-27"); // Tuesday
  });

  it("ยื่นวันเสาร์หรืออาทิตย์ -> นับเริ่มวันจันทร์ -> เว้นอังคาร -> เร็วที่สุดคือ วันพุธถัดไป", () => {
    // Saturday 2026-10-24
    const saturday = new Date("2026-10-24T12:00:00");
    const earliestSat = getEarliestBookingDate(saturday, 1);
    expect(formatDateToIsoDate(earliestSat)).toBe("2026-10-28"); // Wednesday

    // Sunday 2026-10-25
    const sunday = new Date("2026-10-25T18:00:00");
    const earliestSun = getEarliestBookingDate(sunday, 1);
    expect(formatDateToIsoDate(earliestSun)).toBe("2026-10-28"); // Wednesday
  });

  it("validateAdvanceBookingDate ปฏิเสธวันที่เร็วกว่าเกณฑ์ และยอมรับวันที่ถึงเกณฑ์", () => {
    // ยื่นวันพุธ 2026-10-21
    const baseDate = new Date("2026-10-21T10:00:00");

    // จองวันเดียวกัน (พุธ) -> ไม่ผ่าน
    const checkSameDay = validateAdvanceBookingDate("2026-10-21", baseDate, 1);
    expect(checkSameDay.isValid).toBe(false);
    expect(checkSameDay.message).toContain("ไม่รวมวันเสาร์-อาทิตย์");

    // จองวันพรุ่งนี้ (พฤหัสบดี) -> ไม่ผ่าน เพราะยังไม่ได้เว้น 1 วันทำการ
    const checkNextDay = validateAdvanceBookingDate("2026-10-22", baseDate, 1);
    expect(checkNextDay.isValid).toBe(false);

    // จองวันมะรืน (ศุกร์) -> ผ่าน!
    const checkFriday = validateAdvanceBookingDate("2026-10-23", baseDate, 1);
    expect(checkFriday.isValid).toBe(true);

    // จองสัปดาห์ถัดไป -> ผ่าน!
    const checkNextWeek = validateAdvanceBookingDate("2026-10-28", baseDate, 1);
    expect(checkNextWeek.isValid).toBe(true);
  });
});
