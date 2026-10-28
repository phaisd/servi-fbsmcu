import { describe, it, expect } from "vitest";
import {
  FACULTY_EXECUTIVE_SLOTS,
  matchExecutiveSlot,
  classifyExecutivePersonnel,
  computeStepDownUpdates,
  computeAppointExecutiveUpdates,
} from "../executive-roles";

describe("executive-roles", () => {
  it("matches Dean without confusing Vice Dean or Office of the Dean", () => {
    const dean = matchExecutiveSlot({
      positionTh: "คณบดีคณะพุทธศาสตร์ / อาจารย์ประจำภาควิชาพระพุทธศาสนา",
      positionEn: "Dean of Faculty of Buddhism",
      type: "EXECUTIVE",
    });
    expect(dean?.slotKey).toBe("DEAN");
    expect(dean?.tier).toBe(1);

    const viceDean = matchExecutiveSlot({
      positionTh: "รองคณบดีฝ่ายวิชาการ / ผู้อำนวยการหลักสูตร พธ.ม. สาขาวิชาพระไตรปิฎกศึกษา",
      positionEn: "Vice Dean for Academic Affairs",
      type: "EXECUTIVE",
    });
    expect(viceDean?.slotKey).toBe("VICE_DEAN_ACADEMIC");
    expect(viceDean?.tier).toBe(2);

    const secretary = matchExecutiveSlot({
      positionTh: "เลขานุการสำนักงานคณบดี คณะพุทธศาสตร์",
      positionEn: "Secretary of the Office of the Dean",
      type: "SUPPORT",
    });
    expect(secretary?.slotKey).toBe("DEAN_OFFICE_SECRETARY");
    expect(secretary?.tier).toBe(4);
  });

  it("classifies Department Heads into Tier 3 and excludes SPECIAL lecturers", () => {
    const headBuddhism = classifyExecutivePersonnel({
      id: "p1",
      firstNameTh: "พระมหามงคลกานต์",
      lastNameTh: "ฐิตธมฺโม",
      positionTh: "หัวหน้าภาควิชาพระพุทธศาสนา / อาจารย์ประจำภาควิชาพระพุทธศาสนา",
      type: "ACADEMIC",
      orderIndex: 1,
    });
    expect(headBuddhism?.tier).toBe(3);
    expect(headBuddhism?.tierOrder).toBe(1);
    expect(headBuddhism?.slotKey).toBe("HEAD_DEPT_BUDDHISM");

    // Deputy Head of Department should not match HEAD_DEPT slot, and should sort after heads (tierOrder: 20)
    const deputyHead = classifyExecutivePersonnel({
      id: "p3",
      firstNameTh: "สุเทพ",
      lastNameTh: "พรมเลิศ",
      positionTh: "รองหัวหน้าภาควิชาพระพุทธศาสนา / ผู้อำนวยการหลักสูตร พธ.ด. สาขาวิชาปรัชญา",
      type: "EXECUTIVE",
      orderIndex: 3,
    });
    expect(deputyHead?.tier).toBe(3);
    expect(deputyHead?.tierOrder).toBe(20);
    expect(deputyHead?.slotKey).toBeNull();
    expect(deputyHead?.executiveBadgeTh).toBe("รองหัวหน้าภาควิชาพระพุทธศาสนา");

    const specialTeacher = classifyExecutivePersonnel({
      id: "p2",
      firstNameTh: "อาจารย์พิเศษ",
      lastNameTh: "ทดสอบ",
      positionTh: "อาจารย์พิเศษ",
      type: "SPECIAL",
    });
    expect(specialTeacher).toBeNull();
  });

  it("computes step-down and appointment updates cleanly when swapping executives", () => {
    const headSlot = FACULTY_EXECUTIVE_SLOTS.find((s) => s.slotKey === "HEAD_DEPT_PHILOSOPHY")!;

    const outgoing = computeStepDownUpdates(
      {
        id: "old-head",
        firstNameTh: "สุเทพ",
        lastNameTh: "พรมเลิศ",
        positionTh: "หัวหน้าภาควิชาศาสนาและปรัชญา / ผู้อำนวยการหลักสูตร พธ.ด. สาขาวิชาปรัชญา",
        positionEn: "Head of Department of Religion and Philosophy / Director of Ph.D. Program in Philosophy",
        type: "EXECUTIVE",
        orderIndex: 1,
        department: { id: "d-phil", nameTh: "ภาควิชาศาสนาและปรัชญา", nameEn: "Department of Religion and Philosophy" },
      },
      headSlot
    );

    expect(outgoing.positionTh).toBe("ผู้อำนวยการหลักสูตร พธ.ด. สาขาวิชาปรัชญา");
    expect(outgoing.type).toBe("ACADEMIC");
    expect(outgoing.orderIndex).toBe(2);

    const incoming = computeAppointExecutiveUpdates(
      {
        id: "new-head",
        firstNameTh: "อาจารย์ใหม่",
        lastNameTh: "ทดสอบ",
        positionTh: "อาจารย์ประจำภาควิชาศาสนาและปรัชญา",
        type: "ACADEMIC",
        orderIndex: 5,
        department: { id: "d-phil", nameTh: "ภาควิชาศาสนาและปรัชญา", nameEn: "Department of Religion and Philosophy" },
      },
      headSlot
    );

    expect(incoming.positionTh).toContain("หัวหน้าภาควิชาศาสนาและปรัชญา");
    expect(incoming.type).toBe("EXECUTIVE");
    expect(incoming.orderIndex).toBe(1);
  });
});
