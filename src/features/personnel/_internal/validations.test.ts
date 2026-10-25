import { describe, it, expect } from "vitest";
import { departmentSchema, personnelSchema, updatePersonnelSchema } from "./validations";
import { upsertTeachingCourses } from "../teaching-courses";

describe("Personnel Validations", () => {
  it("validates department creation", () => {
    expect(() => departmentSchema.parse({ nameTh: "ภาควิชาพระพุทธศาสนา" })).not.toThrow();
    expect(() => departmentSchema.parse({ nameTh: "" })).toThrow();
  });

  it("validates personnel creation", () => {
    const validData = {
      firstNameTh: "สมชาย",
      lastNameTh: "ใจดี",
      positionTh: "อาจารย์ประจำ",
      type: "ACADEMIC",
    };
    expect(() => personnelSchema.parse(validData)).not.toThrow();
    expect(() => personnelSchema.parse({ ...validData, type: "INVALID" })).toThrow();
  });

  it("allows monks with empty or null lastNameTh (พระภิกษุไม่มีนามสกุล)", () => {
    const monkWithEmptyLastname = {
      firstNameTh: "พระมหาสมปอง",
      lastNameTh: "",
      positionTh: "อาจารย์ประจำภาควิชา",
      type: "ACADEMIC",
    };
    const parsed1 = personnelSchema.parse(monkWithEmptyLastname);
    expect(parsed1.lastNameTh).toBe("");

    const monkWithNullLastname = {
      firstNameTh: "พระครูปลัด",
      lastNameTh: null,
      positionTh: "อาจารย์ผู้สอน",
      type: "ACADEMIC",
    };
    const parsed2 = personnelSchema.parse(monkWithNullLastname);
    expect(parsed2.lastNameTh).toBe("");

    const monkWithNoLastname = {
      firstNameTh: "พระธรรมโฆษาจารย์",
      positionTh: "อาจารย์พิเศษ",
      type: "ACADEMIC",
    };
    const parsed3 = personnelSchema.parse(monkWithNoLastname);
    expect(parsed3.lastNameTh).toBe("");
  });

  it("handles partial updates correctly for monks and secular teachers", () => {
    const update1 = updatePersonnelSchema.parse({ firstNameTh: "พระอาจารย์เปลี่ยนชื่อ" });
    expect(update1.firstNameTh).toBe("พระอาจารย์เปลี่ยนชื่อ");
    expect(update1.lastNameTh).toBeUndefined();

    const update2 = updatePersonnelSchema.parse({ lastNameTh: "" });
    expect(update2.lastNameTh).toBe("");
  });

  it("upserts teaching courses without creating duplicates", () => {
    const existing = [
      {
        id: "c-1",
        year: "2569",
        semester: "2",
        level: "BACHELOR" as const,
        courseCode: "000 135",
        courseNameTh: "พระไตรปิฎกศึกษา",
        credits: 3,
        programTh: "พธ.บ.",
        role: "อาจารย์ผู้สอนประจำวิชา",
      },
    ];

    const incoming = [
      // Update to existing course (same code + year + semester with different spacing)
      {
        id: "c-sync-1",
        year: "๒๕๖๙", // Thai numerals
        semester: "2",
        level: "BACHELOR" as const,
        courseCode: "000135", // No space
        courseNameTh: "พระไตรปิฎกศึกษา (ฉบับปรับปรุง)",
        credits: 3,
        programTh: "พธ.บ. สาขาวิชาพระพุทธศาสนา",
        role: "ผู้สอนร่วม",
        description: "วันพุธ ห้อง D516",
      },
      // New course
      {
        id: "c-sync-2",
        year: "2569",
        semester: "2",
        level: "BACHELOR" as const,
        courseCode: "101 311",
        courseNameTh: "หลักพุทธธรรม",
        credits: 3,
        programTh: "พธ.บ.",
        role: "อาจารย์ผู้สอนประจำวิชา",
      },
    ];

    const { merged, addedCount, updatedCount } = upsertTeachingCourses(existing, incoming);
    expect(addedCount).toBe(1);
    expect(updatedCount).toBe(1);
    expect(merged.length).toBe(2);

    const updated = merged.find((c) => c.courseCode === "000135" || c.courseCode === "000 135");
    expect(updated?.courseNameTh).toBe("พระไตรปิฎกศึกษา (ฉบับปรับปรุง)");
    expect(updated?.role).toBe("ผู้สอนร่วม");
    expect(updated?.description).toBe("วันพุธ ห้อง D516");
  });
});
