import { describe, it, expect } from "vitest";
import { calculateStudentEligibility } from "./eligibility-engine";
import {
  courseSchema,
  classSessionSchema,
  assignTeacherSchema,
  unlockSessionSchema,
  batchAttendanceRecordSchema,
} from "./validations";

describe("Student Attendance & Exam Eligibility Workflow (End-to-End Logic)", () => {
  describe("1. Real Unrounded Exam Eligibility Evaluation (80.00% Threshold)", () => {
    it("strictly evaluates 80.00% as eligible (PASS)", () => {
      // 16 sessions total: 12 attended out of 15 conducted = 80.00%
      const records = [
        ...Array(12).fill({ status: "PRESENT" as const, isCountedSession: true, sessionStatus: "COMPLETED" }),
        ...Array(3).fill({ status: "ABSENT" as const, isCountedSession: true, sessionStatus: "COMPLETED" }),
      ];

      const res = calculateStudentEligibility({
        studentId: "st-001",
        enrollmentId: "enr-001",
        studentCode: "6601001",
        studentName: "พระมหาธีรภัทร ญาณธโร",
        records,
        totalScheduledCountedSessions: 16,
        totalConductedCountedSessions: 15,
      });

      expect(res.percentage).toBe(80.0);
      expect(res.isEligible).toBe(true);
      expect(res.statusText).toBe("มีสิทธิ์สอบ");
    });

    it("strictly rejects 79.99% without rounding up (FAIL)", () => {
      // 799 attended out of 1000 conducted = 79.90%
      const records = [
        ...Array(799).fill({ status: "PRESENT" as const, isCountedSession: true, sessionStatus: "COMPLETED" }),
        ...Array(201).fill({ status: "ABSENT" as const, isCountedSession: true, sessionStatus: "COMPLETED" }),
      ];

      const res = calculateStudentEligibility({
        studentId: "st-002",
        enrollmentId: "enr-002",
        studentCode: "6601002",
        studentName: "นายสมเกียรติ สว่างวงศ์",
        records,
        totalScheduledCountedSessions: 1000,
        totalConductedCountedSessions: 1000,
      });

      expect(res.percentage).toBeLessThan(80.0);
      expect(res.isEligible).toBe(false);
      expect(res.statusText).toContain("หมดสิทธิ์สอบ");
    });

    it("correctly calculates required remaining sessions to pass", () => {
      // Total 16 sessions, conducted 8 sessions, student attended 4 sessions (50%)
      // To reach 80% of 16 sessions (12.8 -> 13 sessions needed)
      // Student already attended 4, so needs 9 more sessions, but only 8 remain!
      // Therefore, student can attend at most 4 + 8 = 12 sessions (75%) -> -1 (impossible to pass)
      const records = [
        ...Array(4).fill({ status: "PRESENT" as const, isCountedSession: true, sessionStatus: "COMPLETED" }),
        ...Array(4).fill({ status: "ABSENT" as const, isCountedSession: true, sessionStatus: "COMPLETED" }),
      ];

      const res = calculateStudentEligibility({
        studentId: "st-003",
        enrollmentId: "enr-003",
        studentCode: "6601003",
        studentName: "พระสมุห์วินัย",
        records,
        totalScheduledCountedSessions: 16,
        totalConductedCountedSessions: 8,
      });

      expect(res.remainingSessions).toBe(8);
      expect(res.maxPossiblePercentage).toBe(75.0);
      expect(res.requiredRemainingToPass).toBe(-1); // Cannot pass anymore
      expect(res.isEligible).toBe(false);
    });
  });

  describe("2. Course & Session Generation Validations", () => {
    it("validates course schema with default 16 sessions and Buddhist year term", () => {
      const parsed = courseSchema.parse({
        courseCode: "BUD101",
        courseName: "ประวัติศาสตร์พระพุทธศาสนา",
        term: "1/2569",
        academicYear: "2569",
        semester: 1,
        section: "1",
      });

      expect(parsed.targetSessions).toBe(16);
      expect(parsed.credits).toBe(3);
      expect(parsed.status).toBe("ACTIVE");
    });

    it("validates session schema requires valid courseId UUID and date", () => {
      const session = classSessionSchema.parse({
        courseId: "123e4567-e89b-12d3-a456-426614174000",
        sessionNumber: 1,
        date: "2026-10-14T09:00:00Z",
        topic: "ปฐมนิเทศและภาพรวมรายวิชา",
      });

      expect(session.sessionNumber).toBe(1);
      expect(session.isCounted).toBe(true);
      expect(session.status).toBe("SCHEDULED");
    });
  });

  describe("3. Multiple Teachers & Role Assignment Validations", () => {
    it("validates teacher assignment for Primary, Co-Teacher, and Assistant", () => {
      const roles = ["PRIMARY_TEACHER", "CO_TEACHER", "TEACHING_ASSISTANT"] as const;
      for (const role of roles) {
        const parsed = assignTeacherSchema.parse({
          courseId: "123e4567-e89b-12d3-a456-426614174000",
          userId: "123e4567-e89b-12d3-a456-426614174001",
          role,
        });
        expect(parsed.role).toBe(role);
      }
    });
  });

  describe("4. Session Lock & Audit Log Rules", () => {
    it("enforces reason requirement when unlocking session", () => {
      expect(() =>
        unlockSessionSchema.parse({
          sessionId: "123e4567-e89b-12d3-a456-426614174000",
          reason: "",
        })
      ).toThrow();

      const valid = unlockSessionSchema.parse({
        sessionId: "123e4567-e89b-12d3-a456-426614174000",
        reason: "นิสิตนำใบรับรองแพทย์และเอกสารขอลามายื่นย้อนหลัง",
      });
      expect(valid.reason).toBe("นิสิตนำใบรับรองแพทย์และเอกสารขอลามายื่นย้อนหลัง");
    });

    it("validates batch attendance records with audit reason", () => {
      const batch = batchAttendanceRecordSchema.parse({
        sessionId: "123e4567-e89b-12d3-a456-426614174000",
        records: [
          {
            studentCode: "6601001",
            studentName: "พระมหาธีรภัทร",
            status: "EXCUSED",
            note: "มีใบรับรองแพทย์",
          },
        ],
        reason: "แก้ไขผลการเข้าเรียนตามเอกสารคำร้อง",
      });

      expect(batch.records[0].status).toBe("EXCUSED");
      expect(batch.reason).toBe("แก้ไขผลการเข้าเรียนตามเอกสารคำร้อง");
    });
  });
});
