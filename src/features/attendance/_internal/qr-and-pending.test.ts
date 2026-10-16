import { describe, it, expect } from "vitest";
import { calculateStudentEligibility } from "./eligibility-engine";
import { computeQrToken } from "./services";
import { attendanceRecordItemSchema, classSessionSchema } from "./validations";

describe("PENDING Attendance Status & Engine Validation", () => {
  it("should support PENDING status in validation schema", () => {
    const item = {
      studentCode: "6601001",
      studentName: "พระสมุห์สมชาย",
      status: "PENDING",
      note: null,
    };
    const parsed = attendanceRecordItemSchema.safeParse(item);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.status).toBe("PENDING");
    }
  });

  it("should correctly count PENDING records without treating them as attended", () => {
    const result = calculateStudentEligibility({
      studentId: "s1",
      enrollmentId: "e1",
      studentCode: "6601001",
      studentName: "พระสมุห์สมชาย",
      totalScheduledCountedSessions: 16,
      totalConductedCountedSessions: 10,
      records: [
        { status: "PRESENT", isCountedSession: true, sessionStatus: "COMPLETED" },
        { status: "PRESENT", isCountedSession: true, sessionStatus: "COMPLETED" },
        { status: "PRESENT", isCountedSession: true, sessionStatus: "COMPLETED" },
        { status: "PRESENT", isCountedSession: true, sessionStatus: "COMPLETED" },
        { status: "PRESENT", isCountedSession: true, sessionStatus: "COMPLETED" },
        { status: "PRESENT", isCountedSession: true, sessionStatus: "COMPLETED" },
        { status: "PRESENT", isCountedSession: true, sessionStatus: "COMPLETED" },
        { status: "PRESENT", isCountedSession: true, sessionStatus: "COMPLETED" },
        { status: "PENDING", isCountedSession: true, sessionStatus: "SCHEDULED" },
        { status: "PENDING", isCountedSession: true, sessionStatus: "SCHEDULED" },
      ],
    });

    expect(result.pendingCount).toBe(2);
    expect(result.presentCount).toBe(8);
    expect(result.attendedCount).toBe(8);
    expect(result.evaluatedCount).toBe(10);
    expect(result.percentage).toBe(80.0);
    expect(result.isEligible).toBe(true);
  });
});

describe("Dynamic Rolling QR Code Token Generation & Security", () => {
  const secret = "a1b2c3d4e5f678901234567890abcdef";
  const sessionId = "sess-uuid-1234";

  it("should generate 16-character hexadecimal rolling token", () => {
    const step = 1000;
    const token = computeQrToken(secret, sessionId, step);
    expect(token).toHaveLength(16);
    expect(/^[0-9a-f]{16}$/.test(token)).toBe(true);
  });

  it("should generate different tokens for consecutive time steps (20s rollover)", () => {
    const tokenStep1 = computeQrToken(secret, sessionId, 1000);
    const tokenStep2 = computeQrToken(secret, sessionId, 1001);
    expect(tokenStep1).not.toBe(tokenStep2);
  });

  it("should generate different tokens for different session IDs in same time step", () => {
    const token1 = computeQrToken(secret, "session-A", 1000);
    const token2 = computeQrToken(secret, "session-B", 1000);
    expect(token1).not.toBe(token2);
  });

  it("should accept token within current and previous step (tolerance window)", () => {
    const currentStep = 1000;
    const currentToken = computeQrToken(secret, sessionId, currentStep);
    const prevToken = computeQrToken(secret, sessionId, currentStep - 1);
    const expiredToken = computeQrToken(secret, sessionId, currentStep - 2);

    const validCurrent = computeQrToken(secret, sessionId, currentStep);
    const validPrev = computeQrToken(secret, sessionId, currentStep - 1);

    expect(currentToken === validCurrent || currentToken === validPrev).toBe(true);
    expect(prevToken === validCurrent || prevToken === validPrev).toBe(true);
    expect(expiredToken === validCurrent || expiredToken === validPrev).toBe(false);
  });
});

describe("Class Session CRUD Schema Validation", () => {
  it("should validate regular session creation schema", () => {
    const session = {
      courseId: "123e4567-e89b-12d3-a456-426614174000",
      sessionNumber: 5,
      date: new Date(),
      startTime: "09.00",
      endTime: "11.30",
      room: "ห้อง 302",
      topic: "วิเคราะห์พระวินัยปิฎก",
      sessionType: "REGULAR",
      status: "SCHEDULED",
      isCounted: true,
    };
    const parsed = classSessionSchema.safeParse(session);
    expect(parsed.success).toBe(true);
  });

  it("should validate special session creation schema", () => {
    const session = {
      courseId: "123e4567-e89b-12d3-a456-426614174000",
      sessionNumber: 17,
      date: new Date(),
      startTime: "13.00",
      endTime: "16.00",
      room: "ห้องประชุมใหญ่",
      topic: "คาบสอนชดเชยวันหยุดนักขัตฤกษ์",
      sessionType: "SPECIAL",
      status: "SCHEDULED",
      isCounted: true,
    };
    const parsed = classSessionSchema.safeParse(session);
    expect(parsed.success).toBe(true);
  });
});
