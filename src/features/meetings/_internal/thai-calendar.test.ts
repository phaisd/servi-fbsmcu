import { describe, it, expect } from "vitest";
import {
  getThaiLunarDate,
  getThaiCalendarDayInfo,
  getMonthCalendarSummary,
} from "./thai-calendar";

describe("thai-calendar", () => {
  describe("getThaiCalendarDayInfo & Wan Phra calculation", () => {
    it("correctly identifies Makha Bucha 2025 (2025-02-12) as Major Wan Phra (ขึ้น ๑๕ ค่ำ เดือน ๓) and Buddhist Public Holiday", () => {
      const info = getThaiCalendarDayInfo("2025-02-12");
      expect(info.isWanPhra).toBe(true);
      expect(info.isMajorWanPhra).toBe(true);
      expect(info.lunar.phase).toBe("WAXING");
      expect(info.lunar.day).toBe(15);
      expect(info.lunar.fullLunarLabel).toBe("ขึ้น ๑๕ ค่ำ เดือน ๓");
      expect(info.isPublicHoliday).toBe(true);
      expect(info.isBuddhistHoliday).toBe(true);
      expect(info.holidays.some((h) => h.nameTh === "วันมาฆบูชา")).toBe(true);
    });

    it("correctly identifies Visakha Bucha 2026 (2026-05-31) and Asanha Bucha 2026 (2026-07-29 in Athikamasa 8th month)", () => {
      const visakha = getThaiCalendarDayInfo("2026-05-31");
      expect(visakha.isWanPhra).toBe(true);
      expect(visakha.isMajorWanPhra).toBe(true);
      expect(visakha.isBuddhistHoliday).toBe(true);
      expect(visakha.isPublicHoliday).toBe(true);

      const asanha = getThaiCalendarDayInfo("2026-07-29");
      expect(asanha.isWanPhra).toBe(true);
      expect(asanha.lunar.monthLabel).toBe("เดือน ๘ หลัง");
      expect(asanha.holidays.some((h) => h.nameTh === "วันอาสาฬหบูชา")).toBe(true);
    });

    it("correctly identifies fixed Thai public holidays such as Songkran and New Year's Day", () => {
      const newYear = getThaiCalendarDayInfo("2026-01-01");
      expect(newYear.isPublicHoliday).toBe(true);
      expect(newYear.isBuddhistHoliday).toBe(false);
      expect(newYear.holidays[0]?.nameTh).toBe("วันขึ้นปีใหม่");

      const songkran = getThaiCalendarDayInfo("2026-04-13");
      expect(songkran.isPublicHoliday).toBe(true);
      expect(songkran.holidays[0]?.nameTh).toContain("วันสงกรานต์");
    });

    it("correctly identifies minor Wan Phra (ขึ้น ๘ ค่ำ / แรม ๘ ค่ำ) and end-of-month Wan Phra (แรม ๑๔/๑๕ ค่ำ)", () => {
      // 2024-12-01 is ขึ้น ๑ ค่ำ เดือน ๑ (29 days) -> 2024-12-08 is ขึ้น ๘ ค่ำ เดือน ๑
      const waxing8 = getThaiCalendarDayInfo("2024-12-08");
      expect(waxing8.isWanPhra).toBe(true);
      expect(waxing8.isMajorWanPhra).toBe(false);
      expect(waxing8.lunar.wanPhraShortLabel).toBe("ขึ้น ๘ ค่ำ");

      // 29-day month ends on 2024-12-29 -> แรม ๑๔ ค่ำ เดือน ๑
      const waning14 = getThaiLunarDate("2024-12-29");
      expect(waning14.isWanPhra).toBe(true);
      expect(waning14.isMajorWanPhra).toBe(true);
      expect(waning14.wanPhraShortLabel).toBe("แรม ๑๔ ค่ำ");
    });
  });

  describe("getMonthCalendarSummary", () => {
    it("returns accurate monthly summary counts for July 2026 (Athikamasa month with King's Birthday, Asanha Bucha, Khao Phansa)", () => {
      const summary = getMonthCalendarSummary(2026, 7);
      expect(summary.year).toBe(2026);
      expect(summary.month).toBe(7);
      expect(summary.totalDays).toBe(31);
      expect(summary.wanPhraCount).toBe(4);
      expect(summary.majorWanPhraCount).toBe(2);
      // 2026-07-28 (King's Birthday), 2026-07-29 (Asanha Bucha), 2026-07-30 (Buddhist Lent)
      expect(summary.publicHolidayCount).toBe(3);
      expect(summary.buddhistHolidayCount).toBe(2);
      expect(summary.wanPhraDates).toContain("2026-07-29");
    });

    it("returns accurate monthly summary counts for May 2025", () => {
      const summary = getMonthCalendarSummary(2025, 5);
      expect(summary.totalDays).toBe(31);
      expect(summary.wanPhraCount).toBe(4);
      // May 2025 public holidays: May 4, May 5 (sub), May 9 (Ploughing), May 11 (Visakha), May 12 (sub) = 5 public holidays
      // Plus May 19 (Atthami Bucha - Buddhist non-public holiday)
      expect(summary.publicHolidayCount).toBe(5);
      expect(summary.buddhistHolidayCount).toBe(2);
    });
  });
});
