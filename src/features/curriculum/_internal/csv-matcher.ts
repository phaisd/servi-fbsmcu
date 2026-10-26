import type { Curriculum, Department } from "@/generated/prisma";

export function normalizeCurriculumText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/บาลีและสันสกฤต/g, "บาลีสันสกฤต")
    .replace(/\(\s*english\s+program\s*\)/gi, "(หลักสูตรภาษาอังกฤษ)")
    .replace(/^หลักสูตร\s*/g, "");
}

export function isEnglishProgramText(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes("ภาษาอังกฤษ") ||
    t.includes("english") ||
    t.includes("นานาชาติ") ||
    t.includes("international")
  );
}

export function findBestMatchingCurriculum<
  T extends Pick<Curriculum, "nameTh" | "nameEn">,
>(rawName: string, curriculums: T[]): T | undefined {
  const raw = rawName.trim();
  if (!raw) return undefined;
  const rawLower = raw.toLowerCase();
  const rawNorm = normalizeCurriculumText(raw);
  const rawIsEng = isEnglishProgramText(raw);

  // 1. Exact match (case-insensitive, trimmed)
  const exact = curriculums.find(
    (c) =>
      c.nameTh.trim() === raw ||
      c.nameTh.trim().toLowerCase() === rawLower ||
      (Boolean(c.nameEn?.trim()) && c.nameEn!.trim().toLowerCase() === rawLower)
  );
  if (exact) return exact;

  // 2. Normalized exact match (handles "บาลีและสันสกฤต" <-> "บาลีสันสกฤต", "(English Program)" <-> "(หลักสูตรภาษาอังกฤษ)")
  const normExact = curriculums.find(
    (c) =>
      normalizeCurriculumText(c.nameTh) === rawNorm ||
      (Boolean(c.nameEn?.trim()) && normalizeCurriculumText(c.nameEn!) === rawNorm)
  );
  if (normExact) return normExact;

  // 3. Safe substring match:
  //    - Never match against empty/null nameEn
  //    - Must have the same English Program vs Regular Thai Program status
  //    - Sort by longest nameTh first so specific names win over shorter prefixes
  const candidates = [...curriculums]
    .filter((c) => {
      const cCombined = `${c.nameTh} ${c.nameEn || ""}`;
      return isEnglishProgramText(cCombined) === rawIsEng;
    })
    .sort((a, b) => b.nameTh.length - a.nameTh.length);

  return candidates.find((c) => {
    const cThNorm = normalizeCurriculumText(c.nameTh);
    const cEnNorm = c.nameEn?.trim() ? normalizeCurriculumText(c.nameEn) : "";

    // Guard against "พระพุทธศาสนา" colliding with "ศาสนาและปรัชญา"
    const rawHasBuddhism = rawNorm.includes("พระพุทธศาสนา");
    const cHasBuddhism = cThNorm.includes("พระพุทธศาสนา");
    if (rawHasBuddhism !== cHasBuddhism) {
      if (rawNorm.includes("ศาสนาและปรัชญา") || cThNorm.includes("ศาสนาและปรัชญา")) {
        return false;
      }
    }

    if (cThNorm.length >= 4 && (cThNorm.includes(rawNorm) || rawNorm.includes(cThNorm))) {
      return true;
    }
    if (cEnNorm.length >= 4 && (cEnNorm.includes(rawNorm) || rawNorm.includes(cEnNorm))) {
      return true;
    }
    return false;
  });
}

export function findBestMatchingDepartment<
  T extends Pick<Department, "nameTh" | "nameEn">,
>(rawName: string, departments: T[]): T | undefined {
  const raw = rawName.trim();
  if (!raw) return undefined;
  const rawLower = raw.toLowerCase();
  const rawNorm = normalizeCurriculumText(raw).replace(/^(ภาควิชา|สาขาวิชา)\s*/g, "");

  // 1. Exact match
  const exact = departments.find(
    (d) =>
      d.nameTh.trim() === raw ||
      d.nameTh.trim().toLowerCase() === rawLower ||
      (Boolean(d.nameEn?.trim()) && d.nameEn!.trim().toLowerCase() === rawLower)
  );
  if (exact) return exact;

  // 2. Normalized exact match
  const normExact = departments.find((d) => {
    const dThNorm = normalizeCurriculumText(d.nameTh).replace(/^(ภาควิชา|สาขาวิชา)\s*/g, "");
    const dEnNorm = d.nameEn?.trim() ? normalizeCurriculumText(d.nameEn) : "";
    return dThNorm === rawNorm || (dEnNorm.length > 0 && dEnNorm === rawNorm);
  });
  if (normExact) return normExact;

  // 3. Safe substring match (prevent "พระพุทธศาสนา" from matching "ศาสนาและปรัชญา")
  const candidates = [...departments].sort((a, b) => b.nameTh.length - a.nameTh.length);
  return candidates.find((d) => {
    const dThNorm = normalizeCurriculumText(d.nameTh).replace(/^(ภาควิชา|สาขาวิชา)\s*/g, "");
    const dEnNorm = d.nameEn?.trim() ? normalizeCurriculumText(d.nameEn) : "";

    if (
      (rawNorm.includes("พระพุทธศาสนา") && !dThNorm.includes("พระพุทธศาสนา")) ||
      (!rawNorm.includes("พระพุทธศาสนา") && dThNorm.includes("พระพุทธศาสนา"))
    ) {
      return false;
    }

    if (dThNorm.length >= 4 && (dThNorm.includes(rawNorm) || rawNorm.includes(dThNorm))) {
      return true;
    }
    if (dEnNorm.length >= 4 && (dEnNorm.includes(rawNorm) || rawNorm.includes(dEnNorm))) {
      return true;
    }
    return false;
  });
}
