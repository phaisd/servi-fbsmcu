import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { requireDatabaseUrl } from "../prisma/lib/require-database-url";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: requireDatabaseUrl() }),
});

async function main() {
  const mcuTenant = await db.tenant.findUnique({ where: { code: "MCU" } });
  if (!mcuTenant) return;

  const totalUsers = await db.user.count();
  const teacherRoles = await db.userRole.findMany({
    where: {
      userTenant: { tenantId: mcuTenant.id },
      role: { code: "TEACHER" },
    },
    include: {
      userTenant: { include: { user: true } },
    },
  });

  console.log("=== สรุปข้อมูลผู้ใช้และอาจารย์ในระบบ ===");
  console.log("จำนวนผู้ใช้ทั้งหมดในระบบ:", totalUsers);
  console.log("จำนวนผู้ใช้ที่มีสิทธิ์ TEACHER ใน MCU:", teacherRoles.length);

  const courses = await db.course.findMany({
    where: { tenantId: mcuTenant.id },
    include: {
      primaryTeacher: true,
      teachers: { include: { user: true } },
    },
  });

  let adminTeacherCount = 0;
  let realTeacherCount = 0;
  let unassignedCount = 0;

  for (const c of courses) {
    const tName = c.primaryTeacher?.name || "";
    if (!c.primaryTeacher) {
      unassignedCount++;
    } else if (tName.includes("ผู้ดูแลระบบ")) {
      adminTeacherCount++;
    } else {
      realTeacherCount++;
    }
  }

  console.log("\n=== สรุปข้อมูลรายวิชา (Courses) ===");
  console.log("จำนวนรายวิชาทั้งหมด:", courses.length);
  console.log("วิชาที่แสดงชื่ออาจารย์ผู้บรรยายจริง:", realTeacherCount);
  console.log("วิชาที่ยังคงเป็นผู้ดูแลระบบ:", adminTeacherCount);
  console.log("วิชาที่ยังไม่ได้ระบุผู้สอน:", unassignedCount);

  console.log("\nตัวอย่างรายวิชาและผู้บรรยาย:");
  courses.slice(0, 10).forEach((c) => {
    console.log(`- [${c.courseCode}] ${c.courseName} -> อาจารย์: ${c.primaryTeacher?.name} (${c.primaryTeacher?.email})`);
  });
}

main().finally(() => db.$disconnect());
