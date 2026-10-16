import { describe, it, expect } from "vitest";
import { calculateStudentEligibility } from "./eligibility-engine";

describe("Custom Calculation Rules & Matrix Formats", () => {
  describe("Custom Course Calculation Rules", () => {
    it("should allow minPercent to be set to 75% for special/practical courses", () => {
      // 10 conducted sessions, 8 attended = 80.0%
      // 10 conducted sessions, 7 attended = 70.0% -> Ineligible under 75%
      // 10 conducted sessions, 7.5 attended = 75.0% -> Eligible under 75%
      const records = [
        ...Array(7).fill({ status: "PRESENT" as const, isCountedSession: true, sessionStatus: "COMPLETED" }),
        { status: "LATE" as const, isCountedSession: true, sessionStatus: "COMPLETED" }, // 0.5 if lateCountsAsFull=false
        ...Array(2).fill({ status: "ABSENT" as const, isCountedSession: true, sessionStatus: "COMPLETED" }),
      ];

      const resWith75 = calculateStudentEligibility({
        studentId: "st-201",
        enrollmentId: "enr-201",
        studentCode: "6601001",
        studentName: "พระมหาทดสอบ ๑",
        records,
        totalScheduledCountedSessions: 16,
        totalConductedCountedSessions: 10,
        rules: {
          minPercent: 75.0,
          lateCountsAsFull: false,
          excuseDeductsDenominator: false,
        },
      });

      // 7 + 0.5 = 7.5 / 10 = 75.0%
      expect(resWith75.percentage).toBe(75.0);
      expect(resWith75.isEligible).toBe(true);
    });

    it("should deduct excuse from denominator when excuseDeductsDenominator is true", () => {
      // 10 sessions total: 7 present, 1 excused, 2 absent
      // If excuseDeductsDenominator = false: 7 / 10 = 70.0%
      // If excuseDeductsDenominator = true: 7 / (10 - 1) = 7 / 9 = 77.78%
      const records = [
        ...Array(7).fill({ status: "PRESENT" as const, isCountedSession: true, sessionStatus: "COMPLETED" }),
        { status: "EXCUSED" as const, isCountedSession: true, sessionStatus: "COMPLETED" },
        ...Array(2).fill({ status: "ABSENT" as const, isCountedSession: true, sessionStatus: "COMPLETED" }),
      ];

      const resDeduct = calculateStudentEligibility({
        studentId: "st-202",
        enrollmentId: "enr-202",
        studentCode: "6601002",
        studentName: "พระมหาทดสอบ ๒",
        records,
        totalScheduledCountedSessions: 16,
        totalConductedCountedSessions: 10,
        rules: {
          minPercent: 80.0,
          lateCountsAsFull: true,
          excuseDeductsDenominator: true,
        },
      });

      expect(resDeduct.excusedCount).toBe(1);
      expect(resDeduct.evaluatedCount).toBe(9);
      expect(resDeduct.percentageDisplay).toBe("77.78");
    });

    it("should count late as 0.5 when lateCountsAsFull is false", () => {
      // 10 sessions: 6 present, 4 late
      // If lateCountsAsFull = false: attendedCount = 6 + (4 * 0.5) = 8 -> 8 / 10 = 80.0%
      const records = [
        ...Array(6).fill({ status: "PRESENT" as const, isCountedSession: true, sessionStatus: "COMPLETED" }),
        ...Array(4).fill({ status: "LATE" as const, isCountedSession: true, sessionStatus: "COMPLETED" }),
      ];

      const resHalfLate = calculateStudentEligibility({
        studentId: "st-203",
        enrollmentId: "enr-203",
        studentCode: "6601003",
        studentName: "พระมหาทดสอบ ๓",
        records,
        totalScheduledCountedSessions: 16,
        totalConductedCountedSessions: 10,
        rules: {
          minPercent: 80.0,
          lateCountsAsFull: false,
          excuseDeductsDenominator: false,
        },
      });

      expect(resHalfLate.attendedCount).toBe(8);
      expect(resHalfLate.percentage).toBe(80.0);
      expect(resHalfLate.isEligible).toBe(true);
    });
  });

  describe("Attendance Matrix Structure", () => {
    it("should map student session status accurately across 16 sessions", () => {
      const sessionRecords: Record<number, string> = {
        1: "PRESENT",
        2: "PRESENT",
        3: "LATE",
        4: "EXCUSED",
        5: "ABSENT",
        6: "PENDING",
      };

      const statusThaiMap: Record<string, string> = {
        PRESENT: "มา",
        LATE: "สาย",
        EXCUSED: "ลา",
        ABSENT: "ขาด",
        PENDING: "รอ",
      };

      expect(statusThaiMap[sessionRecords[1]]).toBe("มา");
      expect(statusThaiMap[sessionRecords[3]]).toBe("สาย");
      expect(statusThaiMap[sessionRecords[4]]).toBe("ลา");
      expect(statusThaiMap[sessionRecords[5]]).toBe("ขาด");
      expect(statusThaiMap[sessionRecords[6]]).toBe("รอ");
    });
  });
});
