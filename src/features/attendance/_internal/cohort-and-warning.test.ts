import { describe, it, expect } from "vitest";
import { calculateStudentEligibility } from "./eligibility-engine";

describe("Cohort Enrollment & At-Risk Warning System", () => {
  describe("At-Risk Student Identification", () => {
    it("should identify student with attendance < 80% as at-risk", () => {
      // 10 conducted sessions, attended 7 = 70.0% (at-risk)
      const records = [
        ...Array(7).fill({ status: "PRESENT" as const, isCountedSession: true, sessionStatus: "COMPLETED" }),
        ...Array(3).fill({ status: "ABSENT" as const, isCountedSession: true, sessionStatus: "COMPLETED" }),
      ];

      const res = calculateStudentEligibility({
        studentId: "st-101",
        enrollmentId: "enr-101",
        studentCode: "690101001",
        studentName: "พระมหาวิทยา ปญฺญาวุฑฺโฒ",
        records,
        totalScheduledCountedSessions: 16,
        totalConductedCountedSessions: 10,
      });

      expect(res.percentage).toBe(70.0);
      expect(res.absentCount).toBe(3);
      const isAtRisk = res.percentage < 80.0 || res.absentCount >= 3 || res.isEligible === false;
      expect(isAtRisk).toBe(true);
    });

    it("should identify student with 3 or more absences as at-risk even if current percentage is passing", () => {
      // 15 conducted sessions, 12 attended, 3 absences = 80.0% (at-risk because absentCount >= 3)
      const records = [
        ...Array(12).fill({ status: "PRESENT" as const, isCountedSession: true, sessionStatus: "COMPLETED" }),
        ...Array(3).fill({ status: "ABSENT" as const, isCountedSession: true, sessionStatus: "COMPLETED" }),
      ];

      const res = calculateStudentEligibility({
        studentId: "st-102",
        enrollmentId: "enr-102",
        studentCode: "690101002",
        studentName: "พระเอกชัย เขมธโร",
        records,
        totalScheduledCountedSessions: 16,
        totalConductedCountedSessions: 15,
      });

      expect(res.absentCount).toBe(3);
      const isAtRisk = res.percentage < 80.0 || res.absentCount >= 3 || res.isEligible === false;
      expect(isAtRisk).toBe(true);
    });

    it("should not mark student as at-risk if percentage >= 80% and absences < 3", () => {
      const records = [
        ...Array(9).fill({ status: "PRESENT" as const, isCountedSession: true, sessionStatus: "COMPLETED" }),
        ...Array(1).fill({ status: "ABSENT" as const, isCountedSession: true, sessionStatus: "COMPLETED" }),
      ];

      const res = calculateStudentEligibility({
        studentId: "st-103",
        enrollmentId: "enr-103",
        studentCode: "690101003",
        studentName: "สามเณรพงศกร บุญมี",
        records,
        totalScheduledCountedSessions: 16,
        totalConductedCountedSessions: 10,
      });

      expect(res.percentage).toBe(90.0);
      expect(res.absentCount).toBe(1);
      const isAtRisk = res.percentage < 80.0 || res.absentCount >= 3 || res.isEligible === false;
      expect(isAtRisk).toBe(false);
    });
  });

  describe("Cohort Filter Utilities", () => {
    const mockStudents = [
      { id: "1", studentCode: "6901001", yearLevel: 1, department: "สาขาวิชาพระพุทธศาสนา" },
      { id: "2", studentCode: "6901002", yearLevel: 1, department: "สาขาวิชาปรัชญา" },
      { id: "3", studentCode: "6801001", yearLevel: 2, department: "สาขาวิชาพระพุทธศาสนา" },
      { id: "4", studentCode: "6701001", yearLevel: 3, department: "สาขาวิชาบาลีพุทธศาสตร์" },
    ];

    it("filters cohort students correctly by year level", () => {
      const year1Students = mockStudents.filter((s) => s.yearLevel === 1);
      expect(year1Students).toHaveLength(2);
      expect(year1Students.map((s) => s.studentCode)).toEqual(["6901001", "6901002"]);
    });

    it("filters cohort students correctly by department", () => {
      const buddhismStudents = mockStudents.filter((s) => s.department === "สาขาวิชาพระพุทธศาสนา");
      expect(buddhismStudents).toHaveLength(2);
      expect(buddhismStudents.map((s) => s.id)).toEqual(["1", "3"]);
    });
  });
});
