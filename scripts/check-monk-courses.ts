import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { requireDatabaseUrl } from "../prisma/lib/require-database-url";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: requireDatabaseUrl() }) });

async function main() {
  // Check ALL timetables
  const allTts = await prisma.curriculumTimetable.findMany({
    include: { curriculum: true, department: true }
  });

  console.log(`Total timetables across all years: ${allTts.length}`);

  interface HitItem {
    year: string;
    sem: number;
    ttTitle: string;
    curriculum: string;
    curriculumDegree?: string;
    yearLevel: number | null;
    courseCode?: string;
    courseName?: string;
    instructor?: string;
    dayOfWeek?: string | number;
    time: string;
    room?: string | null;
  }
  interface RawSlot {
    courseCode?: string;
    courseName?: string;
    instructor?: string;
    dayOfWeek?: string | number;
    startTime?: string;
    endTime?: string;
    room?: string;
  }

  const hits2569_2: HitItem[] = [];
  const hitsOther: HitItem[] = [];

  for (const tt of allTts) {
    const slots = (tt.scheduleData as RawSlot[]) || [];
    for (const s of slots) {
      const inst = String(s.instructor || "");
      if (
        inst.includes("พระราชญาณวชิรเวที") ||
        inst.includes("สมเกียรติ") ||
        inst.includes("กิตฺติญาโณ")
      ) {
        const item = {
          year: tt.academicYear,
          sem: tt.semester,
          ttTitle: tt.titleTh,
          curriculum: tt.curriculum?.nameTh || "ไม่ระบุหลักสูตร",
          curriculumDegree: tt.curriculum?.degree,
          yearLevel: tt.yearLevel,
          courseCode: s.courseCode,
          courseName: s.courseName,
          instructor: s.instructor,
          dayOfWeek: s.dayOfWeek,
          time: `${s.startTime || ""} - ${s.endTime || ""}`,
          room: s.room || tt.room,
        };
        if (String(tt.academicYear).includes("2569") && Number(tt.semester) === 2) {
          hits2569_2.push(item);
        } else {
          hitsOther.push(item);
        }
      }
    }
  }

  console.log(`\n=== ผลการตรวจใน CurriculumTimetable (ปี 2569 ภาค 2) ===`);
  console.log(`พบทั้งหมด: ${hits2569_2.length} คาบ/กลุ่มเรียน`);
  hits2569_2.forEach((h, i) => {
    console.log(`${i + 1}. [${h.courseCode}] ${h.courseName}`);
    console.log(`   ตาราง: ${h.ttTitle} (ชั้นปีที่ ${h.yearLevel})`);
    console.log(`   หลักสูตร: ${h.curriculum}`);
    console.log(`   ผู้สอนตามตาราง: ${h.instructor}`);
    console.log(`   วัน-เวลา: วันที่ ${h.dayOfWeek} เวลา ${h.time} ห้อง ${h.room}\n`);
  });

  if (hitsOther.length > 0) {
    console.log(`=== พบในปี/ภาคการศึกษาอื่น (${hitsOther.length} คาบ) ===`);
    hitsOther.forEach((h, i) => {
      console.log(`${i + 1}. [ปี ${h.year} ภาค ${h.sem}] [${h.courseCode}] ${h.courseName} | ${h.ttTitle}`);
    });
  }

  // Also check Course model
  const dbCourses = await prisma.course.findMany({
    where: {
      OR: [
        { primaryTeacher: { name: { contains: "พระราชญาณวชิรเวที" } } },
        { primaryTeacher: { name: { contains: "สมเกียรติ" } } },
        { teachers: { some: { user: { name: { contains: "พระราชญาณวชิรเวที" } } } } },
      ],
    },
    include: { primaryTeacher: true },
  });
  console.log(`\n=== ผลการตรวจใน Course Model (คลาสเรียนในระบบ) ===`);
  console.log(`พบทั้งหมด: ${dbCourses.length} รายการ`);
  dbCourses.forEach((c) => {
    console.log(`- [ปี ${c.academicYear} ภาค ${c.semester}] ${c.courseCode} ${c.courseName} (ผู้สอน: ${c.primaryTeacher?.name})`);
  });

  // Also check ALL instructors in all slots that might contain part of his name
  console.log("\n=== ตรวจสอบคำค้นอื่นๆ (เช่น 'กิตฺติญาโณ', 'สมเกียรติ', 'ญาณวชิรเวที') ===");
  const allInstructors = new Set<string>();
  for (const tt of allTts) {
    const slots = (tt.scheduleData as RawSlot[]) || [];
    for (const s of slots) {
      if (s.instructor) allInstructors.add(String(s.instructor));
    }
  }
  const matchedInstructorStrings = Array.from(allInstructors).filter(
    (ins) =>
      ins.includes("พระราชญาณวชิรเวที") ||
      ins.includes("ญาณวชิรเวที") ||
      ins.includes("สมเกียรติ") ||
      ins.includes("กิตฺติญาโณ")
  );
  console.log("Matched instructor strings found in scheduleData:", matchedInstructorStrings);
}

main().finally(() => prisma.$disconnect());
