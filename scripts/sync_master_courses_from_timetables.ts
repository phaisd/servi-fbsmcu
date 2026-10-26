import * as dotenv from 'dotenv';
dotenv.config();
import { PrismaClient, DegreeLevel } from '../src/generated/prisma';

const prisma = new PrismaClient();

function hasThai(text?: string | null): boolean {
  if (!text) return false;
  return /[\u0E00-\u0E7F]/.test(text);
}

function normalizeCode(code?: string | null): string {
  if (!code) return '';
  return code.trim().replace(/\s+/g, ' ');
}

export async function syncMasterCourses(tenantId?: string) {
  let activeTenantId = tenantId;
  if (!activeTenantId) {
    const tenant = await prisma.tenant.findFirst({
      where: { code: 'buddhist' },
    });
    activeTenantId = tenant ? tenant.id : (await prisma.tenant.findFirst())?.id;
  }

  if (!activeTenantId) {
    throw new Error('Tenant not found');
  }

  console.log(`[SYNC] Using tenantId: ${activeTenantId}`);

  const timetables = await prisma.curriculumTimetable.findMany({
    where: { tenantId: activeTenantId },
    include: {
      curriculum: true,
      department: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`[SYNC] Found ${timetables.length} timetables`);

  const coursesMap = new Map<
    string,
    {
      courseCode: string;
      courseNameTh: string;
      courseNameEn?: string;
      credits: number;
      degreeLevel: DegreeLevel;
      departmentId?: string | null;
      curriculumId?: string | null;
      programLanguage: string;
      instructor?: string;
      notes?: string;
      sourceCount: number;
    }
  >();

  interface RawSlot {
    courseCode?: string;
    courseName?: string;
    credits?: number | string;
    instructor?: string;
    notes?: string;
  }
  for (const t of timetables) {
    const slots = Array.isArray(t.scheduleData) ? (t.scheduleData as RawSlot[]) : [];
    const isEngCurr =
      t.curriculum?.nameTh?.toLowerCase().includes('english') ||
      t.curriculum?.nameTh?.includes('ภาษาอังกฤษ') ||
      t.curriculum?.nameEn?.toLowerCase().includes('english') ||
      false;

    for (const s of slots) {
      const rawCode = normalizeCode(s.courseCode);
      const rawName = (s.courseName || '').trim();
      if (!rawCode && !rawName) continue;

      const codeKey = rawCode || rawName;

      let existing = coursesMap.get(codeKey);
      if (!existing) {
        const isThaiName = hasThai(rawName);
        existing = {
          courseCode: rawCode || 'N/A',
          courseNameTh: isThaiName ? rawName : rawName, // fallback
          courseNameEn: isThaiName ? undefined : rawName,
          credits: 3,
          degreeLevel: (t.curriculum?.degree as DegreeLevel) || 'BACHELOR',
          departmentId: t.departmentId || t.curriculum?.departmentId || null,
          curriculumId: t.curriculumId || null,
          programLanguage: isEngCurr ? 'ENGLISH' : 'THAI',
          instructor: s.instructor ? s.instructor.trim() : undefined,
          notes: t.curriculum?.nameTh ? `หลักสูตร: ${t.curriculum.nameTh}` : undefined,
          sourceCount: 1,
        };
        coursesMap.set(codeKey, existing);
      } else {
        existing.sourceCount++;
        // If existing doesn't have English or Thai name, fill it
        if (hasThai(rawName)) {
          if (!hasThai(existing.courseNameTh)) {
            existing.courseNameTh = rawName;
          }
        } else if (rawName && !existing.courseNameEn) {
          existing.courseNameEn = rawName;
        }

        // Keep department/curriculum if missing
        if (!existing.departmentId && (t.departmentId || t.curriculum?.departmentId)) {
          existing.departmentId = t.departmentId || t.curriculum?.departmentId || null;
        }
        if (!existing.curriculumId && t.curriculumId) {
          existing.curriculumId = t.curriculumId;
        }

        // If instructor wasn't set, set it
        if (!existing.instructor && s.instructor) {
          existing.instructor = s.instructor.trim();
        }
      }
    }
  }

  console.log(`[SYNC] Extracted ${coursesMap.size} unique master courses`);

  let createdCount = 0;
  let updatedCount = 0;
  let order = 1;

  for (const [_, item] of coursesMap.entries()) {
    const existingInDb = await prisma.masterCourse.findFirst({
      where: {
        tenantId: activeTenantId,
        courseCode: item.courseCode,
      },
    });

    if (!existingInDb) {
      await prisma.masterCourse.create({
        data: {
          tenantId: activeTenantId,
          courseCode: item.courseCode,
          courseNameTh: item.courseNameTh || item.courseCode,
          courseNameEn: item.courseNameEn || null,
          credits: item.credits,
          degreeLevel: item.degreeLevel,
          programLanguage: item.programLanguage,
          departmentId: item.departmentId,
          curriculumId: item.curriculumId,
          instructor: item.instructor || null,
          notes: item.notes || null,
          orderIndex: order++,
          isActive: true,
        },
      });
      createdCount++;
    } else {
      await prisma.masterCourse.update({
        where: { id: existingInDb.id },
        data: {
          courseNameTh: item.courseNameTh || existingInDb.courseNameTh,
          courseNameEn: item.courseNameEn || existingInDb.courseNameEn,
          departmentId: existingInDb.departmentId || item.departmentId,
          curriculumId: existingInDb.curriculumId || item.curriculumId,
          instructor: existingInDb.instructor || item.instructor || null,
        },
      });
      updatedCount++;
    }
  }

  console.log(`[SYNC] Done! Created: ${createdCount}, Updated: ${updatedCount}`);
  return { createdCount, updatedCount, total: coursesMap.size };
}

if (require.main === module) {
  syncMasterCourses()
    .then((res) => {
      console.log('Sync finished successfully:', res);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Sync failed:', err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
