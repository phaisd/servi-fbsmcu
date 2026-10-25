import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { requireDatabaseUrl } from "../prisma/lib/require-database-url";
import { findTeacherCoursesFromTimetables } from "../src/features/personnel/_internal/timetable-sync";
import { parseTeachingExperiences, upsertTeachingCourses } from "../src/features/personnel/teaching-courses";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: requireDatabaseUrl() }) });

async function main() {
  console.log("=== SYNCING TEACHING COURSES FROM TIMETABLES FOR ALL PERSONNEL ===");
  const all = await prisma.personnel.findMany({
    include: { department: true }
  });

  let totalUpdated = 0;

  for (const p of all) {
    const rawTeaching = parseTeachingExperiences(p.experiencesTh, {
      id: p.id,
      firstNameTh: p.firstNameTh,
      lastNameTh: p.lastNameTh,
      departmentName: p.department?.nameTh,
    });

    // Find actual courses taught from curriculum timetables & course tables
    const synced = await findTeacherCoursesFromTimetables(p.tenantId, {
      firstNameTh: p.firstNameTh,
      lastNameTh: p.lastNameTh,
      academicPosition: p.academicPosition,
      email: p.email,
    });

    if (synced.length > 0) {
      // Upsert: replace/update matching courses and add new ones without creating duplicates!
      const { merged, addedCount, updatedCount } = upsertTeachingCourses(rawTeaching, synced);
      
      await prisma.personnel.update({
        where: { id: p.id },
        data: {
          experiencesTh: JSON.stringify(merged),
        },
      });

      console.log(`✅ [${p.firstNameTh} ${p.lastNameTh || ""}]: Synced ${synced.length} timetable courses (Added: ${addedCount}, Updated: ${updatedCount}, Total: ${merged.length})`);
      totalUpdated++;
    } else {
      // Clean existing duplicates if any
      const cleaned = upsertTeachingCourses([], rawTeaching).merged;
      if (cleaned.length !== rawTeaching.length) {
        await prisma.personnel.update({
          where: { id: p.id },
          data: {
            experiencesTh: JSON.stringify(cleaned),
          },
        });
        console.log(`🧹 [${p.firstNameTh} ${p.lastNameTh || ""}]: Cleaned existing duplicates (${rawTeaching.length} -> ${cleaned.length})`);
      } else {
        console.log(`ℹ️ [${p.firstNameTh} ${p.lastNameTh || ""}]: No timetable matches found, kept current ${cleaned.length} courses`);
      }
    }
  }

  console.log(`\n🎉 Completed sync for ${totalUpdated} personnel members!`);
}

main().finally(() => prisma.$disconnect());
