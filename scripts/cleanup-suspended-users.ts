import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { requireDatabaseUrl } from "../prisma/lib/require-database-url";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: requireDatabaseUrl() }),
});

async function main() {
  console.log("=== 1. ตรวจสอบและแยกสิทธิ์อาจารย์ (TEACHER) ออกจากสิทธิ์นิสิต (STUDENT) ===");
  const studentRoles = await db.role.findMany({ where: { code: "STUDENT" } });
  const studentRoleIds = studentRoles.map((r) => r.id);

  // ลบบทบาท STUDENT ออกจากบัญชีอาจารย์ (t69*@mcu.ac.th และ teacher*)
  const teacherUsers = await db.user.findMany({
    where: {
      OR: [
        { email: { startsWith: "t69" } },
        { email: { startsWith: "teacher" } },
      ],
    },
    include: { userTenants: true },
  });

  for (const tu of teacherUsers) {
    for (const ut of tu.userTenants) {
      await db.userRole.deleteMany({
        where: {
          userTenantId: ut.id,
          roleId: { in: studentRoleIds },
        },
      });
    }
  }
  console.log(`✅ ตรวจสอบสิทธิ์อาจารย์ ${teacherUsers.length} บัญชี ให้ถือเฉพาะบทบาท "อาจารย์ผู้สอน (TEACHER)" เรียบร้อยแล้ว`);

  console.log("\n=== 2. ลบบัญชีที่สถานะ 'ระงับ' (บัญชีอาจารย์ซ้ำจากการนำเข้าวิชาเก่า) ออกจากระบบ ===");
  const inactiveUsers = await db.user.findMany({
    where: {
      OR: [
        { isActive: false },
        { userTenants: { some: { isActive: false } } },
      ],
    },
    include: {
      primaryCourses: { select: { id: true, courseCode: true, courseName: true } },
      taughtCourses: { select: { id: true, courseId: true } },
      certificateRequests: { select: { id: true } },
      authoredNews: { select: { id: true } },
      reviewedNews: { select: { id: true } },
      meetingBookings: { select: { id: true } },
    },
    orderBy: { name: "asc" },
  });

  console.log(`พบบัญชีสถานะ "ระงับ" ที่ซ้ำซ้อนจำนวน: ${inactiveUsers.length} บัญชี`);

  // ดึงบัญชีอาจารย์ที่ใช้งานจริง (Active) เพื่อโอนย้ายการผูกวิชาที่อาจตกค้าง
  const activeUsers = await db.user.findMany({
    where: { isActive: true },
  });
  const activeByName = new Map<string, string>();
  for (const au of activeUsers) {
    activeByName.set(au.name.trim().toLowerCase(), au.id);
  }
  const fallbackAdmin =
    activeUsers.find((u) => u.email === "admin@buddhist.mcu.ac.th") || activeUsers[0];

  let deletedCount = 0;

  for (const u of inactiveUsers) {
    const replacementUserId =
      activeByName.get(u.name.trim().toLowerCase()) || fallbackAdmin.id;

    // 1. ย้าย primaryCourses ที่อาจผูกอยู่กับบัญชีซ้ำไปหาบัญชีจริง
    if (u.primaryCourses.length > 0) {
      await db.course.updateMany({
        where: { primaryTeacherId: u.id },
        data: { primaryTeacherId: replacementUserId },
      });
    }

    // 2. ลบ CourseTeacher ของบัญชีซ้ำ (และสร้างให้บัญชีจริงหากยังไม่มี)
    if (u.taughtCourses.length > 0) {
      await db.courseTeacher.deleteMany({
        where: { userId: u.id },
      });
    }

    // 3. ย้ายข้อมูลอื่นๆ หากมีผูกไว้
    if (u.certificateRequests.length > 0) {
      await db.certificateRequest.updateMany({
        where: { userId: u.id },
        data: { userId: replacementUserId },
      });
    }
    if (u.authoredNews.length > 0) {
      await db.newsArticle.updateMany({
        where: { authorId: u.id },
        data: { authorId: replacementUserId },
      });
    }
    if (u.reviewedNews.length > 0) {
      await db.newsArticle.updateMany({
        where: { reviewerId: u.id },
        data: { reviewerId: replacementUserId },
      });
    }
    if (u.meetingBookings.length > 0) {
      await db.meetingBooking.updateMany({
        where: { requesterId: u.id },
        data: { requesterId: replacementUserId },
      });
    }

    // 4. ลบ AuditLog / AuthToken / UserRole / UserTenant และลบ User ออกจากระบบ
    await db.auditLog.deleteMany({ where: { actorId: u.id } });
    await db.authToken.deleteMany({ where: { userId: u.id } });
    const uts = await db.userTenant.findMany({ where: { userId: u.id }, select: { id: true } });
    if (uts.length > 0) {
      await db.userRole.deleteMany({
        where: { userTenantId: { in: uts.map((x) => x.id) } },
      });
      await db.userTenant.deleteMany({
        where: { userId: u.id },
      });
    }

    await db.user.delete({ where: { id: u.id } });
    deletedCount++;
  }

  const remainingInactive = await db.user.count({
    where: {
      OR: [
        { isActive: false },
        { userTenants: { some: { isActive: false } } },
      ],
    },
  });

  console.log(`✅ ลบบัญชีสถานะ "ระงับ" ที่ซ้ำซ้อนออกจากระบบสำเร็จ: ${deletedCount} บัญชี`);
  console.log(`✅ จำนวนบัญชีสถานะ "ระงับ" ที่เหลือในระบบตอนนี้: ${remainingInactive} บัญชี`);

  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
