export type ExecutiveTier = 1 | 2 | 3 | 4;

export interface ExecutiveSlotDefinition {
  slotKey: string;
  tier: ExecutiveTier;
  tierOrder: number;
  titleTh: string;
  titleEn: string;
  shortBadgeTh: string;
  shortBadgeEn: string;
  defaultType: "EXECUTIVE" | "ACADEMIC" | "SUPPORT";
  departmentKeyword?: string;
  isDepartmentHead?: boolean;
  matchKeywords: string[];
}

export const FACULTY_EXECUTIVE_SLOTS: ExecutiveSlotDefinition[] = [
  {
    slotKey: "DEAN",
    tier: 1,
    tierOrder: 1,
    titleTh: "คณบดีคณะพุทธศาสตร์",
    titleEn: "Dean of Faculty of Buddhism",
    shortBadgeTh: "คณบดีคณะพุทธศาสตร์",
    shortBadgeEn: "Dean",
    defaultType: "EXECUTIVE",
    matchKeywords: ["คณบดีคณะพุทธศาสตร์"],
  },
  {
    slotKey: "VICE_DEAN_ACADEMIC",
    tier: 2,
    tierOrder: 1,
    titleTh: "รองคณบดีฝ่ายวิชาการ",
    titleEn: "Vice Dean for Academic Affairs",
    shortBadgeTh: "รองคณบดีฝ่ายวิชาการ",
    shortBadgeEn: "Vice Dean (Academic Affairs)",
    defaultType: "EXECUTIVE",
    matchKeywords: ["รองคณบดีฝ่ายวิชาการ", "รองคณบดีคณะพุทธศาสตร์ ฝ่ายวิชาการ"],
  },
  {
    slotKey: "VICE_DEAN_ADMIN",
    tier: 2,
    tierOrder: 2,
    titleTh: "รองคณบดีฝ่ายบริหาร",
    titleEn: "Vice Dean for Administration",
    shortBadgeTh: "รองคณบดีฝ่ายบริหาร",
    shortBadgeEn: "Vice Dean (Administration)",
    defaultType: "EXECUTIVE",
    matchKeywords: ["รองคณบดีฝ่ายบริหาร", "รองคณบดีคณะพุทธศาสตร์ ฝ่ายบริหาร"],
  },
  {
    slotKey: "VICE_DEAN_PLANNING",
    tier: 2,
    tierOrder: 3,
    titleTh: "รองคณบดีฝ่ายวางแผนและพัฒนา",
    titleEn: "Vice Dean for Planning and Development",
    shortBadgeTh: "รองคณบดีฝ่ายวางแผนและพัฒนา",
    shortBadgeEn: "Vice Dean (Planning & Development)",
    defaultType: "EXECUTIVE",
    matchKeywords: ["รองคณบดีฝ่ายวางแผนและพัฒนา", "รองคณบดีคณะพุทธศาสตร์ ฝ่ายวางแผน"],
  },
  {
    slotKey: "HEAD_DEPT_BUDDHISM",
    tier: 3,
    tierOrder: 1,
    titleTh: "หัวหน้าภาควิชาพระพุทธศาสนา",
    titleEn: "Head of Department of Buddhist Studies",
    shortBadgeTh: "หัวหน้าภาควิชาพระพุทธศาสนา",
    shortBadgeEn: "Head of Dept. of Buddhist Studies",
    defaultType: "EXECUTIVE",
    departmentKeyword: "พระพุทธศาสนา",
    isDepartmentHead: true,
    matchKeywords: ["หัวหน้าภาควิชาพระพุทธศาสนา"],
  },
  {
    slotKey: "HEAD_DEPT_PHILOSOPHY",
    tier: 3,
    tierOrder: 2,
    titleTh: "หัวหน้าภาควิชาศาสนาและปรัชญา",
    titleEn: "Head of Department of Religion and Philosophy",
    shortBadgeTh: "หัวหน้าภาควิชาศาสนาและปรัชญา",
    shortBadgeEn: "Head of Dept. of Religion & Philosophy",
    defaultType: "EXECUTIVE",
    departmentKeyword: "ศาสนาและปรัชญา",
    isDepartmentHead: true,
    matchKeywords: ["หัวหน้าภาควิชาศาสนาและปรัชญา"],
  },
  {
    slotKey: "HEAD_DEPT_PALI",
    tier: 3,
    tierOrder: 3,
    titleTh: "หัวหน้าภาควิชาบาลีและสันสกฤต",
    titleEn: "Head of Department of Pali and Sanskrit",
    shortBadgeTh: "หัวหน้าภาควิชาบาลีและสันสกฤต",
    shortBadgeEn: "Head of Dept. of Pali & Sanskrit",
    defaultType: "EXECUTIVE",
    departmentKeyword: "บาลี",
    isDepartmentHead: true,
    matchKeywords: ["หัวหน้าภาควิชาบาลีและสันสกฤต", "หัวหน้าภาควิชาบาลีสันสกฤต"],
  },
  {
    slotKey: "PROGRAM_DIRECTOR_PHD_TIPITAKA",
    tier: 4,
    tierOrder: 1,
    titleTh: "ผู้อำนวยการหลักสูตร พธ.ด. สาขาวิชาพระไตรปิฎกศึกษา",
    titleEn: "Director of Ph.D. Program in Tipitaka Studies",
    shortBadgeTh: "ผู้อำนวยการหลักสูตร พธ.ด. (พระไตรปิฎกศึกษา)",
    shortBadgeEn: "Director of Ph.D. Program (Tipitaka Studies)",
    defaultType: "EXECUTIVE",
    matchKeywords: ["ผู้อำนวยการหลักสูตร พธ.ด. สาขาวิชาพระไตรปิฎกศึกษา"],
  },
  {
    slotKey: "DEAN_OFFICE_SECRETARY",
    tier: 4,
    tierOrder: 2,
    titleTh: "เลขานุการสำนักงานคณบดี คณะพุทธศาสตร์",
    titleEn: "Secretary of the Office of the Dean, Faculty of Buddhism",
    shortBadgeTh: "เลขานุการสำนักงานคณบดี",
    shortBadgeEn: "Secretary of the Office of the Dean",
    defaultType: "SUPPORT",
    matchKeywords: [
      "เลขานุการสำนักงานคณบดี",
      "รักษาการผู้อำนวยการสำนักงานคณบดี",
      "ผู้อำนวยการสำนักงานคณบดี",
    ],
  },
];

export interface MinimalPersonnelForExecutive {
  id: string;
  firstNameTh: string;
  lastNameTh?: string | null;
  positionTh: string;
  positionEn?: string | null;
  type: string;
  orderIndex?: number | null;
  department?: {
    id: string;
    nameTh: string;
    nameEn?: string | null;
  } | null;
}

/**
 * Matches a personnel record to one of the 9 standard Faculty Executive Slots, if applicable.
 */
export function matchExecutiveSlot(
  person: Pick<MinimalPersonnelForExecutive, "positionTh" | "positionEn" | "type">
): ExecutiveSlotDefinition | null {
  const posTh = (person.positionTh || "").trim();

  // Check Vice Dean before Dean because "รองคณบดีคณะพุทธศาสตร์" contains "คณบดีคณะพุทธศาสตร์"
  for (const slot of FACULTY_EXECUTIVE_SLOTS) {
    if (slot.slotKey === "DEAN") {
      if (
        posTh.includes("คณบดี") &&
        !posTh.includes("รองคณบดี") &&
        !posTh.includes("ผู้ช่วยคณบดี") &&
        !posTh.includes("สำนักงานคณบดี")
      ) {
        return slot;
      }
      continue;
    }
    if (slot.matchKeywords.some((kw) => posTh.includes(kw))) {
      return slot;
    }
  }
  return null;
}

export interface ClassifiedExecutive<T extends MinimalPersonnelForExecutive> {
  person: T;
  tier: ExecutiveTier;
  tierOrder: number;
  slotKey: string | null;
  executiveBadgeTh: string;
  executiveBadgeEn: string;
}

/**
 * Determines whether a person is a Faculty Executive and classifies them into Tier 1..4
 * for the Executive Directory (/portal/executives).
 */
export function classifyExecutivePersonnel<T extends MinimalPersonnelForExecutive>(
  person: T
): ClassifiedExecutive<T> | null {
  if (person.type === "SPECIAL") return null;

  const matchedSlot = matchExecutiveSlot(person);
  if (matchedSlot) {
    return {
      person,
      tier: matchedSlot.tier,
      tierOrder: matchedSlot.tierOrder,
      slotKey: matchedSlot.slotKey,
      executiveBadgeTh: matchedSlot.shortBadgeTh,
      executiveBadgeEn: matchedSlot.shortBadgeEn,
    };
  }

  const posTh = (person.positionTh || "").trim();
  const posEn = (person.positionEn || "").trim();

  if (posTh.includes("ผู้ช่วยคณบดี") || posTh.includes("รองคณบดี")) {
    return {
      person,
      tier: 2,
      tierOrder: 10,
      slotKey: null,
      executiveBadgeTh: posTh.split("/")[0].trim(),
      executiveBadgeEn: posEn ? posEn.split("/")[0].trim() : "Vice / Assistant Dean",
    };
  }

  if (posTh.includes("หัวหน้าภาควิชา")) {
    return {
      person,
      tier: 3,
      tierOrder: 10,
      slotKey: null,
      executiveBadgeTh: posTh.split("/")[0].trim(),
      executiveBadgeEn: posEn ? posEn.split("/")[0].trim() : "Head of Department",
    };
  }

  if (person.type === "EXECUTIVE") {
    return {
      person,
      tier: 4,
      tierOrder: 10,
      slotKey: null,
      executiveBadgeTh: posTh.split("/")[0].trim() || "ผู้บริหารคณะพุทธศาสตร์",
      executiveBadgeEn: posEn ? posEn.split("/")[0].trim() : "Faculty Executive",
    };
  }

  return null;
}

/**
 * Computes the fallback regular position & type when an executive steps down from a slot.
 */
export function computeStepDownUpdates(
  person: MinimalPersonnelForExecutive,
  slotToStepDown?: ExecutiveSlotDefinition | null
): {
  positionTh: string;
  positionEn: string | null;
  type: "ACADEMIC" | "SUPPORT" | "EXECUTIVE";
  orderIndex: number;
} {
  const deptNameTh = person.department?.nameTh || "คณะพุทธศาสตร์";
  const deptNameEn = person.department?.nameEn || "Faculty of Buddhism";

  // Split multi-role positions separated by "/"
  const partsTh = (person.positionTh || "")
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean);
  const partsEn = (person.positionEn || "")
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean);

  const isExecSegment = (seg: string): boolean => {
    if (slotToStepDown && slotToStepDown.matchKeywords.some((kw) => seg.includes(kw))) {
      return true;
    }
    return (
      seg.includes("คณบดี") ||
      seg.includes("หัวหน้าภาควิชา") ||
      seg.includes("เลขานุการสำนักงานคณบดี") ||
      seg.includes("ผู้อำนวยการสำนักงานคณบดี")
    );
  };

  const remainingTh = partsTh.filter((seg) => !isExecSegment(seg));
  const remainingEn = partsEn.filter(
    (seg) =>
      !seg.toLowerCase().includes("dean") &&
      !seg.toLowerCase().includes("head of department") &&
      !seg.toLowerCase().includes("secretary of the office")
  );

  const isSupportStaff =
    person.type === "SUPPORT" && !person.positionTh.includes("อาจารย์");

  const fallbackTh = isSupportStaff
    ? `บุคลากรสายสนับสนุน ${deptNameTh}`
    : `อาจารย์ประจำ${deptNameTh}`;
  const fallbackEn = isSupportStaff
    ? `Academic Support Staff, ${deptNameEn}`
    : `Lecturer, ${deptNameEn}`;

  const nextPositionTh = remainingTh.length > 0 ? remainingTh.join(" / ") : fallbackTh;
  const nextPositionEn = remainingEn.length > 0 ? remainingEn.join(" / ") : fallbackEn;

  const currentOrder = person.orderIndex ?? 10;
  const nextOrderIndex =
    slotToStepDown?.isDepartmentHead && currentOrder <= 1 ? 2 : currentOrder;

  return {
    positionTh: nextPositionTh,
    positionEn: nextPositionEn,
    type: isSupportStaff ? "SUPPORT" : "ACADEMIC",
    orderIndex: nextOrderIndex,
  };
}

/**
 * Computes the new position, type, and orderIndex when a person is appointed to an executive slot.
 */
export function computeAppointExecutiveUpdates(
  person: MinimalPersonnelForExecutive,
  slot: ExecutiveSlotDefinition
): {
  positionTh: string;
  positionEn: string;
  type: "EXECUTIVE" | "ACADEMIC" | "SUPPORT";
  orderIndex: number;
} {
  const deptNameTh = person.department?.nameTh || "คณะพุทธศาสตร์";
  const deptNameEn = person.department?.nameEn || "Faculty of Buddhism";

  // Preserve any existing secondary role like "ผู้อำนวยการหลักสูตร..." if not conflicting
  const existingPartsTh = (person.positionTh || "")
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean);
  const secondaryRolesTh = existingPartsTh.filter(
    (seg) =>
      seg.includes("ผู้อำนวยการหลักสูตร") &&
      !slot.matchKeywords.some((kw) => seg.includes(kw))
  );

  let positionTh = slot.titleTh;
  if (secondaryRolesTh.length > 0) {
    positionTh = `${slot.titleTh} / ${secondaryRolesTh.join(" / ")}`;
  } else if (slot.defaultType !== "SUPPORT") {
    positionTh = `${slot.titleTh} / อาจารย์ประจำ${deptNameTh}`;
  }

  const positionEn =
    slot.defaultType === "SUPPORT"
      ? slot.titleEn
      : `${slot.titleEn} / Lecturer in ${deptNameEn}`;

  const orderIndex = slot.isDepartmentHead
    ? 1
    : slot.slotKey === "DEAN"
      ? Math.min(person.orderIndex || 2, 2)
      : person.orderIndex || 3;

  return {
    positionTh,
    positionEn,
    type: slot.defaultType === "SUPPORT" ? "SUPPORT" : "EXECUTIVE",
    orderIndex,
  };
}
