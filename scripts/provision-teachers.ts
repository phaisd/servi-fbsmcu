import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { requireDatabaseUrl } from "../prisma/lib/require-database-url";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: requireDatabaseUrl() }),
});

function parseInstructorsFromSlot(raw: string | undefined | null) {
  if (!raw || !raw.trim()) {
    return [{ name: "อาจารย์ผู้สอน", isPrimary: true }];
  }
  const parts = raw
    .split(/[\/\n]/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  if (parts.length === 0) {
    return [{ name: "อาจารย์ผู้สอน", isPrimary: true }];
  }
  const hasExplicitPrimary = parts.some((p) => p.includes("*"));
  return parts.map((part, index) => {
    const isPrimary = hasExplicitPrimary ? part.includes("*") : index === 0;
    const cleanName = part.replace(/\*/g, "").trim();
    return { name: cleanName, isPrimary };
  });
}

async function processTenant(tenant: { id: string; code: string; nameTh: string }) {
  console.log(`\n--- กำลังประมวลผล Tenant: ${tenant.code} (${tenant.nameTh}) ---`);
  const tenantId = tenant.id;

  const teacherRole = await db.role.findFirst({
    where: { tenantId, code: "TEACHER" },
  });
  if (!teacherRole) {
    console.error(`ไม่พบ Role TEACHER สำหรับ Tenant ${tenant.code}`);
    return;
  }

  // 1. ดึงข้อมูลคาบเรียนทั้งหมดจาก CurriculumTimetable
  const timetables = await db.curriculumTimetable.findMany({
    where: { tenantId },
  });

  interface SlotEntry {
    courseCode?: string;
    instructor?: string;
  }
  const slotMap = new Map<string, SlotEntry>();
  for (const tt of timetables) {
    const slots = Array.isArray(tt.scheduleData) ? (tt.scheduleData as SlotEntry[]) : [];
    for (const s of slots) {
      if (s.courseCode && s.instructor && !slotMap.has(s.courseCode.trim())) {
        slotMap.set(s.courseCode.trim(), s);
      }
    }
  }
  console.log(`พบข้อมูลรายวิชาพร้อมชื่อผู้สอนในตารางเรียน: ${slotMap.size} วิชา`);

  // 2. ดึง Courses ทั้งหมดของ Tenant
  const courses = await db.course.findMany({
    where: { tenantId },
  });
  console.log(`พบคอร์สในระบบ: ${courses.length} คอร์ส`);

  // ลำดับเลขบัญชีอาจารย์
  const existingTeachers = await db.user.findMany({
    where: { email: { startsWith: "t69" } },
    select: { email: true },
  });
  let maxSeq = 1;
  for (const u of existingTeachers) {
    const match = u.email.match(/^t\d{2}(\d{3})@/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num >= maxSeq) {
        maxSeq = num + 1;
      }
    }
  }

  const defaultPasswordHash = await bcrypt.hash("Passw0rd!vibe", 10);
  const teacherAccountMap = new Map<string, { id: string; name: string | null; email: string }>();

  let updatedCourseCount = 0;
  let newTeacherCount = 0;

  for (const course of courses) {
    const slot = slotMap.get(course.courseCode.trim());
    if (!slot || !slot.instructor) continue;

    const instructors = parseInstructorsFromSlot(slot.instructor);
    const teacherUsers: Array<{ user: { id: string; name: string | null; email: string }; isPrimary: boolean }> = [];

    for (const inst of instructors) {
      let teacherUser: { id: string; name: string | null; email: string } | null | undefined = teacherAccountMap.get(inst.name);

      if (!teacherUser) {
        teacherUser = await db.user.findFirst({
          where: { name: { equals: inst.name, mode: "insensitive" } },
        });

        if (!teacherUser) {
          const seqStr = String(maxSeq++).padStart(3, "0");
          const email = `t69${seqStr}@buddhist.mcu.ac.th`.toLowerCase();

          teacherUser = await db.user.create({
            data: {
              name: inst.name,
              email,
              passwordHash: defaultPasswordHash,
              emailVerified: true,
              mustChangePassword: false,
              isActive: true,
              provider: "credentials",
            },
          });
          newTeacherCount++;
          console.log(`  + สร้างบัญชีอาจารย์ใหม่: ${inst.name} (${email})`);
        }

        const userTenant = await db.userTenant.upsert({
          where: { userId_tenantId: { userId: teacherUser.id, tenantId } },
          update: { isActive: true },
          create: { userId: teacherUser.id, tenantId, isActive: true },
        });

        const existingRole = await db.userRole.findFirst({
          where: { userTenantId: userTenant.id, roleId: teacherRole.id },
        });
        if (!existingRole) {
          await db.userRole.create({
            data: {
              userTenantId: userTenant.id,
              roleId: teacherRole.id,
              scopeType: "ALL",
            },
          });
        }

        teacherAccountMap.set(inst.name, teacherUser);
      }

      teacherUsers.push({ user: teacherUser, isPrimary: inst.isPrimary });
    }

    if (teacherUsers.length === 0) continue;

    const primaryTeacher = teacherUsers.find((t) => t.isPrimary) || teacherUsers[0];

    await db.course.update({
      where: { id: course.id },
      data: { primaryTeacherId: primaryTeacher.user.id },
    });

    for (const t of teacherUsers) {
      await db.courseTeacher.upsert({
        where: {
          courseId_userId: { courseId: course.id, userId: t.user.id },
        },
        update: {
          isPrimary: t.isPrimary,
          role: t.isPrimary ? "PRIMARY_TEACHER" : "CO_TEACHER",
        },
        create: {
          tenantId,
          courseId: course.id,
          userId: t.user.id,
          isPrimary: t.isPrimary,
          role: t.isPrimary ? "PRIMARY_TEACHER" : "CO_TEACHER",
        },
      });
    }

    updatedCourseCount++;
  }

  console.log(`[${tenant.code}] ผลการดำเนินการ: สร้างใหม่ ${newTeacherCount} บัญชี, อัปเดตรายวิชา ${updatedCourseCount} รายวิชา`);
}

async function main() {
  console.log("=== เริ่มต้นเชื่อมโยงอาจารย์ผู้สอนจากตารางเรียน และสร้างบัญชีผู้ใช้งาน ===");
  const tenants = await db.tenant.findMany();
  for (const t of tenants) {
    await processTenant(t);
  }
  console.log("\nเสร็จสิ้นทุก Tenant เรียบร้อยแล้ว!");
}

main()
  .catch((e) => console.error(e))
  .finally(() => db.$disconnect());
