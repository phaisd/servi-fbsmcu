import { prisma } from "@/shared/lib/infra/prisma";
import {
  type TeachingCourse,
  type DegreeLevel,
  normalizeCourseYear,
  getCourseUniqueKey,
} from "../teaching-courses";

const DAY_NAMES: Record<number, string> = {
  1: "วันจันทร์",
  2: "วันอังคาร",
  3: "วันพุธ",
  4: "วันพฤหัสบดี",
  5: "วันศุกร์",
  6: "วันเสาร์",
  7: "วันอาทิตย์",
};

const EXCLUDED_TITLES = new Set([
  "dr.", "dr", "ven.", "ven", "prof.", "prof", "assoc.", "assoc", "asst.", "asst", "ph.d.", "ph.d",
  "phramaha", "phrakhru", "phrakru", "phrakhrupalad", "phra", "most", "rev.", "rev", "mae", "chee", "maechee",
  "พระ", "มหา", "ดร.", "ผศ.", "รศ.", "ศ.", "อาจารย์", "อาจารย์,", "ผศ.ดร.", "รศ.ดร.", "ศ.ดร.", "อ.ดร.", "อ.",
  "นาย", "นาง", "นางสาว", "เจ้าคุณ", "พระครู", "พระมหา", "ดร", "ผศ", "รศ", "ศ", "วิ.", "พิเศษ"
]);

function normalizeThaiConsonants(str: string): string {
  return str
    .replace(/รน์/g, "")
    .replace(/[์๎ฺ]/g, "") // remove thantakhat, pinthu
    .replace(/ศ/g, "ส")
    .replace(/ษ/g, "ส")
    .replace(/ญ/g, "ย")
    .replace(/ณ/g, "น")
    .replace(/ฎ/g, "ด")
    .replace(/ฏ/g, "ต")
    .replace(/ฐ/g, "ถ")
    .replace(/ฑ/g, "ท")
    .replace(/ฒ/g, "ท")
    .replace(/ฬ/g, "ล")
    .toLowerCase();
}

function cleanKaran(str: string): string {
  return str.replace(/รน์/g, "").replace(/[ก-ฮ]?์/g, "");
}

export function extractTeacherKeywords(teacher: {
  firstNameTh: string;
  lastNameTh?: string | null;
  firstNameEn?: string | null;
  lastNameEn?: string | null;
  academicPosition?: string | null;
  email?: string | null;
}): { rawTokens: string[]; normalizedTokens: string[] } {
  const f = teacher.firstNameTh.trim();
  const l = (teacher.lastNameTh || "").trim();
  const fEn = (teacher.firstNameEn || "").trim();
  const lEn = (teacher.lastNameEn || "").trim();

  const titlePrefixes = [
    "พระครูปลัด", "พระครูวินัยธร", "พระครูธรรมธร", "พระครูสมุห์", "พระครูใบฎีกา", "พระครู",
    "พระราชญาณวชิรเวที", "พระราชอุดมวัชรเมธี", "พระราช", "พระเทพ", "พระธรรม", "พระพรหม",
    "พระสิทธิวัชรบัณฑิต", "พระสิทธิ", "พระศรีวชิราภินันท์", "พระศรี",
    "พระมหา", "พระสมุห์", "พระใบฎีกา", "พระปลัด", "พระ", "สามเณร", "แม่ชี",
    "ผศ.พิเศษ ดร.", "รศ.พิเศษ ดร.", "ผศ.ดร.", "รศ.ดร.", "ศ.ดร.", "อ.ดร.", "ดร.", "ผศ.", "รศ.", "ศ.",
    "อาจารย์,", "อาจารย์", "อ.", "นาย", "นางสาว", "นาง",
    "Assoc. Prof. Dr.", "Asst. Prof. Dr.", "Assoc. Prof.", "Asst. Prof.", "Prof. Dr.",
    "Phrakhrupalad", "Phrakhru", "Phrakru", "Phramaha", "Phra", "Ven. Dr.", "Ven.", "Dr."
  ];

  const rawParts = `${f} ${l} ${fEn} ${lEn}`
    .replace(/[\(\)（）\*,]/g, " ")
    .split(/\s+/)
    .filter((p) => p.length >= 2);

  const rawTokens = new Set<string>();
  if (f) rawTokens.add(f);
  if (l) rawTokens.add(l);
  if (fEn) rawTokens.add(fEn);
  if (lEn) rawTokens.add(lEn);

  for (const part of rawParts) {
    rawTokens.add(part);
    let stripped = part;
    for (const prefix of titlePrefixes) {
      if (stripped.toLowerCase().startsWith(prefix.toLowerCase()) && stripped.length > prefix.length + 2) {
        stripped = stripped.substring(prefix.length).trim();
        if (stripped.length >= 3) rawTokens.add(stripped);
      }
    }
  }

  const validRaw = Array.from(rawTokens).filter((t) => {
    const lower = t.toLowerCase().trim();
    return t.length >= 3 && !EXCLUDED_TITLES.has(lower);
  });

  const normalizedTokens = validRaw.flatMap((t) => {
    const norm = normalizeThaiConsonants(t);
    const cleaned = cleanKaran(norm);
    return [norm, cleaned];
  }).filter((t) => t.length >= 3);

  return { rawTokens: validRaw, normalizedTokens: Array.from(new Set(normalizedTokens)) };
}

export function checkInstructorMatch(
  instructorField: string,
  teacherKeywords: { rawTokens: string[]; normalizedTokens: string[] }
): { isMatch: boolean; isPrimary: boolean; matchedInstructor: string } {
  if (!instructorField) return { isMatch: false, isPrimary: false, matchedInstructor: "" };

  const instructors = instructorField.split(/[/และ]/).map((i) => i.trim()).filter(Boolean);

  for (let idx = 0; idx < instructors.length; idx++) {
    const rawInst = instructors[idx];
    const cleanInst = rawInst.replace(/[\*]/g, "").trim();
    const cleanInstLower = cleanInst.toLowerCase();
    const normInst = normalizeThaiConsonants(cleanInst);
    const cleanedInst = cleanKaran(normInst);

    const directHit = teacherKeywords.rawTokens.some(
      (tok) => cleanInst.includes(tok) || cleanInstLower.includes(tok.toLowerCase())
    );
    const fuzzyHit = !directHit && teacherKeywords.normalizedTokens.some((tok) => normInst.includes(tok) || cleanedInst.includes(tok));

    if (directHit || fuzzyHit) {
      const isPrimary = rawInst.includes("*") || (idx === 0 && !instructors.some((o) => o.includes("*")));
      return { isMatch: true, isPrimary, matchedInstructor: rawInst };
    }
  }

  return { isMatch: false, isPrimary: false, matchedInstructor: "" };
}

export async function findTeacherCoursesFromTimetables(
  tenantId: string,
  teacher: {
    firstNameTh: string;
    lastNameTh?: string | null;
    firstNameEn?: string | null;
    lastNameEn?: string | null;
    academicPosition?: string | null;
    email?: string | null;
  }
): Promise<TeachingCourse[]> {
  const kws = extractTeacherKeywords(teacher);
  const courseMap = new Map<string, TeachingCourse>();

  // 1. ตรวจสอบจาก CurriculumTimetable
  const timetables = await prisma.curriculumTimetable.findMany({
    where: { tenantId },
    include: { curriculum: true, department: true },
    orderBy: [{ academicYear: "desc" }, { semester: "desc" }],
  });

  interface RawTimetableSlot {
    instructor?: string;
    courseCode?: string;
    courseName?: string;
    courseNameEn?: string;
    credits?: number | string;
    dayOfWeek?: number | string;
    startTime?: string;
    endTime?: string;
    room?: string | null;
  }

  for (const tt of timetables) {
    const slots = Array.isArray(tt.scheduleData)
      ? (tt.scheduleData as unknown as RawTimetableSlot[])
      : [];
    const yearNorm = normalizeCourseYear(tt.academicYear) || "2569";
    const semNorm = String(tt.semester || "1");

    for (const slot of slots) {
      const instructorStr = String(slot.instructor || "");
      const match = checkInstructorMatch(instructorStr, kws);

      if (match.isMatch && (slot.courseCode || slot.courseName)) {
        const rawCode = String(slot.courseCode || "").trim();
        const rawName = String(slot.courseName || "").trim();
        const key = getCourseUniqueKey(rawCode, yearNorm, semNorm);

        let level: DegreeLevel = "BACHELOR";
        const progName = tt.curriculum?.nameTh || tt.titleTh || "";
        const codeNum = rawCode.replace(/\D/g, "");

        if (
          tt.curriculum?.degree === "MASTER" ||
          codeNum.startsWith("6") ||
          codeNum.startsWith("7") ||
          progName.includes("โท") ||
          progName.includes("มหาบัณฑิต")
        ) {
          level = "MASTER";
        } else if (
          tt.curriculum?.degree === "DOCTORATE" ||
          codeNum.startsWith("8") ||
          codeNum.startsWith("9") ||
          progName.includes("เอก") ||
          progName.includes("ดุษฎีบัณฑิต")
        ) {
          level = "DOCTORAL";
        }

        const dayName = slot.dayOfWeek ? (DAY_NAMES[Number(slot.dayOfWeek)] || "") : "";
        const timeStr = slot.startTime && slot.endTime ? `${slot.startTime} - ${slot.endTime} น.` : "";
        const roomStr = slot.room ? `ห้องเรียน: ${slot.room}` : tt.room ? `ห้องเรียน: ${tt.room}` : "";
        const scheduleInfo = [dayName, timeStr, roomStr].filter(Boolean).join(" ");

        const programTh =
          tt.curriculum?.nameTh ||
          (level === "DOCTORAL"
            ? "หลักสูตรพุทธศาสตรดุษฎีบัณฑิต (พธ.ด.)"
            : level === "MASTER"
            ? "หลักสูตรพุทธศาสตรมหาบัณฑิต (พธ.ม.)"
            : "หลักสูตรพุทธศาสตรบัณฑิต (พธ.บ.)");

        const role = match.isPrimary ? "อาจารย์ผู้สอนประจำวิชา" : "ผู้สอนร่วม";
        const isEnglishProg =
          progName.includes("ภาษาอังกฤษ") ||
          progName.toLowerCase().includes("english") ||
          progName.includes("นานาชาติ") ||
          (tt.titleTh || "").includes("ภาษาอังกฤษ") ||
          (tt.titleTh || "").toLowerCase().includes("english") ||
          rawCode.toUpperCase().startsWith("IB");
        const programLanguage = isEnglishProg ? "ENGLISH" : "THAI";

        if (courseMap.has(key)) {
          // รวมตารางเวลา/ห้องเรียนถ้ามีหลายคาบ
          const existing = courseMap.get(key)!;
          if (scheduleInfo && existing.description && !existing.description.includes(dayName)) {
            existing.description = `${existing.description}; ${scheduleInfo}`;
          } else if (scheduleInfo && !existing.description) {
            existing.description = scheduleInfo;
          }
          if (match.isPrimary) {
            existing.role = "อาจารย์ผู้สอนประจำวิชา";
          }
        } else {
          courseMap.set(key, {
            id: `tc-tt-${rawCode.replace(/\s+/g, "")}-${yearNorm}-${semNorm}`,
            year: yearNorm,
            semester: semNorm,
            level,
            courseCode: rawCode || "000 100",
            courseNameTh: rawName || "รายวิชาในตารางสอน",
            courseNameEn: slot.courseNameEn || undefined,
            credits: Number(slot.credits) || 3,
            programTh,
            programLanguage,
            role,
            description: scheduleInfo || undefined,
          });
        }
      }
    }
  }

  // 2. ตรวจสอบจาก Course และ CourseTeacher ในระบบ (รองรับทั้งชื่อภาษาไทยและภาษาอังกฤษ)
  const email = teacher.email ? teacher.email.trim() : "";
  const firstName = teacher.firstNameTh.trim();
  const lastName = teacher.lastNameTh ? teacher.lastNameTh.trim() : "";
  const firstNameEn = teacher.firstNameEn ? teacher.firstNameEn.trim() : "";
  const lastNameEn = teacher.lastNameEn ? teacher.lastNameEn.trim() : "";
  const searchTokens = Array.from(
    new Set(
      [firstName, lastName, firstNameEn, lastNameEn, ...kws.rawTokens]
        .map((s) => s.trim())
        .filter((s) => s.length >= 3)
    )
  );

  const dbCourses = await prisma.course.findMany({
    where: {
      tenantId,
      OR: [
        ...(email ? [{ primaryTeacher: { email } }] : []),
        ...searchTokens.map((tok) => ({ primaryTeacher: { name: { contains: tok, mode: "insensitive" as const } } })),
        ...searchTokens.map((tok) => ({ teachers: { some: { user: { name: { contains: tok, mode: "insensitive" as const } } } } })),
      ],
    },
    include: { primaryTeacher: true },
  });

  for (const c of dbCourses) {
    const yearNorm = normalizeCourseYear(c.academicYear) || "2569";
    const semNorm = String(c.semester || "1");
    const rawCode = c.courseCode.trim();
    const key = getCourseUniqueKey(rawCode, yearNorm, semNorm);

    if (!courseMap.has(key)) {
      let level: DegreeLevel = "BACHELOR";
      const codeNum = rawCode.replace(/\D/g, "");
      if (codeNum.startsWith("6") || codeNum.startsWith("7")) {
        level = "MASTER";
      } else if (codeNum.startsWith("8") || codeNum.startsWith("9")) {
        level = "DOCTORAL";
      }

      courseMap.set(key, {
        id: `course-${c.id}`,
        year: yearNorm,
        semester: semNorm,
        level,
        courseCode: rawCode,
        courseNameTh: c.courseName.trim(),
        courseNameEn: c.courseNameEn || undefined,
        credits: c.credits || 3,
        programTh: "หลักสูตรพุทธศาสตรบัณฑิต (พธ.บ.)",
        role: "อาจารย์ผู้สอนประจำวิชา",
        description: c.room ? `ห้องเรียน: ${c.room}` : undefined,
      });
    }
  }

  return Array.from(courseMap.values());
}
