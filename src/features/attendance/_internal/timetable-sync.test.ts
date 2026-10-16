import { describe, it, expect } from "vitest";
import {
  generateRandomTeacherPassword,
  parseInstructorsFromSlot,
} from "./services";
import { syncTimetableSchema } from "./validations";

describe("Timetable Sync & Teacher Provisioning Utilities", () => {
  it("should generate a random secure password with mixed characters", () => {
    const pwd = generateRandomTeacherPassword(10);
    expect(pwd).toHaveLength(10);
    // Should have upper, lower, digit, symbol
    expect(/[A-Z]/.test(pwd)).toBe(true);
    expect(/[a-z]/.test(pwd)).toBe(true);
    expect(/[0-9]/.test(pwd)).toBe(true);
    expect(/[@#$%&*!]/.test(pwd)).toBe(true);
  });

  it("should parse single instructor as primary", () => {
    const res = parseInstructorsFromSlot("Dr. Onjira Wongsapan");
    expect(res).toHaveLength(1);
    expect(res[0].name).toBe("Dr. Onjira Wongsapan");
    expect(res[0].isPrimary).toBe(true);
  });

  it("should parse multiple instructors separated by slash and identify asterisk as primary", () => {
    const raw = "พระมหามงคลกานต์ ฐิตธมฺโม, รศ. ดร.*/อ.ดร.คงชิต ชินสิญจ์";
    const res = parseInstructorsFromSlot(raw);
    expect(res).toHaveLength(2);
    expect(res[0].name).toBe("พระมหามงคลกานต์ ฐิตธมฺโม, รศ. ดร.");
    expect(res[0].isPrimary).toBe(true);
    expect(res[1].name).toBe("อ.ดร.คงชิต ชินสิญจ์");
    expect(res[1].isPrimary).toBe(false);
  });

  it("should identify asterisk as primary even when second instructor has it", () => {
    const raw = "พระครูศรีสิทธิบัณฑิต, ดร./ผศ. ดร.บุญเกิด เจริญแนว*";
    const res = parseInstructorsFromSlot(raw);
    expect(res).toHaveLength(2);
    expect(res[0].name).toBe("พระครูศรีสิทธิบัณฑิต, ดร.");
    expect(res[0].isPrimary).toBe(false);
    expect(res[1].name).toBe("ผศ. ดร.บุญเกิด เจริญแนว");
    expect(res[1].isPrimary).toBe(true);
  });

  it("should validate syncTimetableSchema successfully", () => {
    const valid = syncTimetableSchema.parse({
      timetableId: "b787c7fa-6dd9-4c31-af21-201ac404a7bd",
      selectedCourseCodes: ["101 101", "101 103"],
    });
    expect(valid.timetableId).toBe("b787c7fa-6dd9-4c31-af21-201ac404a7bd");
    expect(valid.selectedCourseCodes).toEqual(["101 101", "101 103"]);
  });

  it("should handle three instructors with asterisk on middle instructor", () => {
    const raw = "พระจาตุรงค์ อาจารสุโภ, ผศ.ดร.*/พระมหาจรูญ กิตฺติปญฺโญ, ดร./ผศ. ดร.ธนาธิป ฮาดเนาลี";
    const res = parseInstructorsFromSlot(raw);
    expect(res).toHaveLength(3);
    expect(res[0].name).toBe("พระจาตุรงค์ อาจารสุโภ, ผศ.ดร.");
    expect(res[0].isPrimary).toBe(true);
    expect(res[1].name).toBe("พระมหาจรูญ กิตฺติปญฺโญ, ดร.");
    expect(res[1].isPrimary).toBe(false);
    expect(res[2].name).toBe("ผศ. ดร.ธนาธิป ฮาดเนาลี");
    expect(res[2].isPrimary).toBe(false);
  });

  it("should handle empty or null instructor safely", () => {
    const emptyRes = parseInstructorsFromSlot("");
    expect(emptyRes).toHaveLength(1);
    expect(emptyRes[0].name).toBe("อาจารย์ผู้สอน");
    expect(emptyRes[0].isPrimary).toBe(true);

    const nullRes = parseInstructorsFromSlot(null);
    expect(nullRes).toHaveLength(1);
    expect(nullRes[0].name).toBe("อาจารย์ผู้สอน");
    expect(nullRes[0].isPrimary).toBe(true);
  });
});

