import { describe, it, expect } from "vitest";

describe("Student Self-Enrollment Slip Parsing Logic", () => {
  it("should extract 6-digit MCU course codes with spaces (e.g. 400 101)", () => {
    const rawSlip = `
      มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
      ใบลงทะเบียนเรียน / ใบเสร็จรับเงิน
      ภาคการศึกษาที่ 1 ปีการศึกษา 2569
      รหัสนิสิต: 6801203001
      1. 400 101 พระไตรปิฎกศึกษาเบื้องต้น 3 หน่วยกิต
      2. 000 115 ภาษาบาลี 2 หน่วยกิต
      3. 401 201 ประวัติศาสตร์พระพุทธศาสนา 3 หน่วยกิต
      รวม 8 หน่วยกิต
    `;

    const regex6Digit = /\b(\d{3})\s?(\d{3})\b/g;
    const candidates = new Set<string>();
    let match;
    while ((match = regex6Digit.exec(rawSlip)) !== null) {
      candidates.add(`${match[1]} ${match[2]}`);
    }

    expect(candidates.has("400 101")).toBe(true);
    expect(candidates.has("000 115")).toBe(true);
    expect(candidates.has("401 201")).toBe(true);
    // Student code 6801203001 should not be matched as standard 6-digit course code
    expect(candidates.has("680 120")).toBe(false);
  });

  it("should extract compact 6-digit course codes without spaces (e.g. 400101)", () => {
    const rawSlip = "ตารางเรียน: 400101 Section 1, 000115 Section 2, 401201 Section 1";
    const regex6Digit = /\b(\d{3})\s?(\d{3})\b/g;
    const candidates = new Set<string>();
    let match;
    while ((match = regex6Digit.exec(rawSlip)) !== null) {
      candidates.add(`${match[1]} ${match[2]}`);
    }

    expect(candidates.has("400 101")).toBe(true);
    expect(candidates.has("000 115")).toBe(true);
    expect(candidates.has("401 201")).toBe(true);
  });

  it("should match extracted codes against available faculty courses accurately", () => {
    const availableFacultyCourses = [
      { id: "c-1", courseCode: "400 101", courseName: "พระไตรปิฎกศึกษา", isEnrolled: false },
      { id: "c-2", courseCode: "000 115", courseName: "ภาษามคธ", isEnrolled: true }, // already enrolled
      { id: "c-3", courseCode: "401 201", courseName: "ประวัติศาสตร์พระพุทธศาสนา", isEnrolled: false },
      { id: "c-4", courseCode: "405 301", courseName: "สัมมนาพระพุทธศาสนา", isEnrolled: false },
    ];

    const extractedCodes = new Set(["400 101", "400101", "000 115", "000115", "999 999"]); // 999 999 is external

    const matchedToEnroll: string[] = [];
    const alreadyEnrolled: string[] = [];
    const unmatchedCodes: string[] = [];

    availableFacultyCourses.forEach((c) => {
      const code = c.courseCode.trim();
      const codeCompact = code.replace(/\s+/g, "");
      if (extractedCodes.has(code) || extractedCodes.has(codeCompact)) {
        if (c.isEnrolled) {
          alreadyEnrolled.push(c.courseCode);
        } else {
          matchedToEnroll.push(c.id);
        }
      }
    });

    expect(matchedToEnroll).toEqual(["c-1"]);
    expect(alreadyEnrolled).toEqual(["000 115"]);
  });
});
