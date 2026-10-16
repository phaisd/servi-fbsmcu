import { describe, it, expect } from "vitest";
import { calculateStudentEligibility } from "./eligibility-engine";

describe("Eligibility Engine Tests", () => {
  it("returns insufficient data when conducted sessions count is 0", () => {
    const res = calculateStudentEligibility({
      studentId: "s1",
      enrollmentId: "e1",
      studentCode: "66001",
      studentName: "Test Student",
      records: [],
      totalScheduledCountedSessions: 16,
      totalConductedCountedSessions: 0,
    });

    expect(res.hasEnoughData).toBe(false);
    expect(res.isEligible).toBeNull();
    expect(res.statusText).toContain("ยังไม่มีข้อมูล");
  });

  it("handles exact 80.00% as eligible", () => {
    // 4 out of 5 sessions = 80.0%
    const records = [
      { status: "PRESENT" as const, isCountedSession: true, sessionStatus: "COMPLETED" },
      { status: "PRESENT" as const, isCountedSession: true, sessionStatus: "COMPLETED" },
      { status: "PRESENT" as const, isCountedSession: true, sessionStatus: "COMPLETED" },
      { status: "PRESENT" as const, isCountedSession: true, sessionStatus: "COMPLETED" },
      { status: "ABSENT" as const, isCountedSession: true, sessionStatus: "COMPLETED" },
    ];

    const res = calculateStudentEligibility({
      studentId: "s1",
      enrollmentId: "e1",
      studentCode: "66001",
      studentName: "Test Student",
      records,
      totalScheduledCountedSessions: 16,
      totalConductedCountedSessions: 5,
    });

    expect(res.percentage).toBe(80.0);
    expect(res.isEligible).toBe(true);
    expect(res.statusText).toBe("มีสิทธิ์สอบ");
  });

  it("rejects 79.99% without rounding up to 80%", () => {
    // For testing unrounded check: say evaluated=1000, attended=799 -> 79.9%
    const records = [
      ...Array(799).fill({ status: "PRESENT" as const, isCountedSession: true, sessionStatus: "COMPLETED" }),
      ...Array(201).fill({ status: "ABSENT" as const, isCountedSession: true, sessionStatus: "COMPLETED" }),
    ];

    const res = calculateStudentEligibility({
      studentId: "s1",
      enrollmentId: "e1",
      studentCode: "66001",
      studentName: "Test Student",
      records,
      totalScheduledCountedSessions: 1000,
      totalConductedCountedSessions: 1000,
    });

    expect(res.percentage).toBeLessThan(80.0);
    expect(res.isEligible).toBe(false);
    expect(res.statusText).toContain("หมดสิทธิ์สอบ");
  });

  it("ignores cancelled sessions from denominator and calculation", () => {
    const records = [
      { status: "PRESENT" as const, isCountedSession: true, sessionStatus: "COMPLETED" },
      { status: "ABSENT" as const, isCountedSession: true, sessionStatus: "CANCELLED" },
    ];

    const res = calculateStudentEligibility({
      studentId: "s1",
      enrollmentId: "e1",
      studentCode: "66001",
      studentName: "Test Student",
      records,
      totalScheduledCountedSessions: 16,
      totalConductedCountedSessions: 1, // 1 conducted, 1 cancelled
    });

    expect(res.evaluatedCount).toBe(1);
    expect(res.attendedCount).toBe(1);
    expect(res.percentage).toBe(100);
    expect(res.isEligible).toBe(true);
  });
});
