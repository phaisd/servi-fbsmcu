import { describe, it, expect } from "vitest";
import {
  lockSessionSchema,
  unlockSessionSchema,
  batchAttendanceRecordSchema,
} from "./validations";

describe("Session Lock & Audit Validations", () => {
  it("validates lockSessionSchema requires a valid UUID", () => {
    expect(() =>
      lockSessionSchema.parse({
        sessionId: "invalid-uuid",
      })
    ).toThrow();

    const valid = lockSessionSchema.parse({
      sessionId: "123e4567-e89b-12d3-a456-426614174000",
    });
    expect(valid.sessionId).toBe("123e4567-e89b-12d3-a456-426614174000");
  });

  it("validates unlockSessionSchema requires valid UUID and at least 3 chars reason", () => {
    expect(() =>
      unlockSessionSchema.parse({
        sessionId: "123e4567-e89b-12d3-a456-426614174000",
        reason: "no", // less than 3 chars
      })
    ).toThrow("กรุณาระบุเหตุผลในการปลดล็อคอย่างน้อย 3 ตัวอักษร");

    const valid = unlockSessionSchema.parse({
      sessionId: "123e4567-e89b-12d3-a456-426614174000",
      reason: "นิสิตนำใบรับรองแพทย์มายื่นย้อนหลัง",
    });
    expect(valid.reason).toBe("นิสิตนำใบรับรองแพทย์มายื่นย้อนหลัง");
  });

  it("validates batchAttendanceRecordSchema allows optional reason for audit trail", () => {
    const validWithReason = batchAttendanceRecordSchema.parse({
      sessionId: "123e4567-e89b-12d3-a456-426614174000",
      records: [
        {
          studentCode: "6601001",
          studentName: "พระสมชาย",
          status: "PRESENT",
        },
      ],
      reason: "แก้ไขผลการเข้าเรียนตามเอกสารคำร้อง",
    });
    expect(validWithReason.reason).toBe("แก้ไขผลการเข้าเรียนตามเอกสารคำร้อง");
    expect(validWithReason.records).toHaveLength(1);
  });
});
