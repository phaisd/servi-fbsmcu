import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { requireDatabaseUrl } from "../prisma/lib/require-database-url";
import { ALL_PERMISSIONS } from "../src/permissions";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: requireDatabaseUrl() }),
});

const STUDENT_PERMISSION_CODES = [
  "certificates:portal:request",
  "attendance:read",
  "curriculum:read",
  "administration:read",
  "meetings:book",
];

async function ensureStudentRole(tenantId: string) {
  // 1. ซิงก์ Permission ทั้งหมดลงตาราง Permission
  for (const p of ALL_PERMISSIONS) {
    await db.permission.upsert({
      where: { code: p.code },
      update: { module: p.module, action: p.action, description: p.description ?? null },
      create: { code: p.code, module: p.module, action: p.action, description: p.description ?? null },
    });
  }

  // 2. สร้างหรืออัปเดตบทบาท STUDENT (นิสิต/นักศึกษา)
  const studentRole = await db.role.upsert({
    where: { tenantId_code: { tenantId, code: "STUDENT" } },
    update: {
      nameTh: "นิสิต/นักศึกษา",
      nameEn: "Student",
      description: "สิทธิ์การใช้งานระบบบริการนิสิต (ขอหนังสือรับรอง ตรวจสอบเวลาเรียน ดูหลักสูตร ตารางเรียน และดาวน์โหลดเอกสาร)",
      isSystem: false,
    },
    create: {
      tenantId,
      code: "STUDENT",
      nameTh: "นิสิต/นักศึกษา",
      nameEn: "Student",
      description: "สิทธิ์การใช้งานระบบบริการนิสิต (ขอหนังสือรับรอง ตรวจสอบเวลาเรียน ดูหลักสูตร ตารางเรียน และดาวน์โหลดเอกสาร)",
      isSystem: false,
    },
  });

  // 3. ผูกสิทธิ์ (RolePermission) ให้กับบทบาท STUDENT
  const perms = await db.permission.findMany({
    where: { code: { in: STUDENT_PERMISSION_CODES } },
  });

  for (const perm of perms) {
    await db.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: studentRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: studentRole.id,
        permissionId: perm.id,
      },
    });
  }

  return studentRole;
}

async function main() {
  console.log("=== เริ่มสร้างบทบาท นิสิต/นักศึกษา (STUDENT) และอัปเดตสิทธิ์นิสิตทั้งหมด ===");
  const mcuTenant = await db.tenant.findFirst({ where: { code: "MCU" } });
  if (!mcuTenant) {
    console.error("ไม่พบ Tenant MCU");
    process.exit(1);
  }

  // สร้างบทบาท STUDENT ในทุก Tenant (MCU และ DEMO)
  const allTenants = await db.tenant.findMany();
  for (const t of allTenants) {
    await ensureStudentRole(t.id);
  }

  const studentRole = await ensureStudentRole(mcuTenant.id);
  const viewerRole = await db.role.findFirst({
    where: { tenantId: mcuTenant.id, code: "VIEWER" },
  });

  const students = await db.student.findMany({
    orderBy: { studentCode: "asc" },
  });

  console.log(`พบรายชื่อนิสิตทั้งหมดในระบบ: ${students.length} คน`);

  let createdOrUpdated = 0;

  for (const st of students) {
    const code = st.studentCode.trim();
    if (!code) continue;

    const email = `${code.toLowerCase()}@mcu.ac.th`;
    const plainPw = `Fb${code}`;
    const passwordHash = await bcrypt.hash(plainPw, 8);
    const fullName =
      [st.title, st.firstName, st.lastName]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim() || code;

    const user = await db.user.upsert({
      where: { email },
      update: {
        name: fullName,
        passwordHash,
        mustChangePassword: false,
        isActive: true,
      },
      create: {
        email,
        name: fullName,
        passwordHash,
        provider: "credentials",
        emailVerified: true,
        mustChangePassword: false,
        isActive: true,
      },
    });

    const ut = await db.userTenant.upsert({
      where: {
        userId_tenantId: {
          userId: user.id,
          tenantId: mcuTenant.id,
        },
      },
      update: { isActive: true },
      create: {
        userId: user.id,
        tenantId: mcuTenant.id,
        isActive: true,
      },
    });

    // มอบบทบาท STUDENT (นิสิต/นักศึกษา)
    const hasStudentRole = await db.userRole.findFirst({
      where: { userTenantId: ut.id, roleId: studentRole.id },
    });
    if (!hasStudentRole) {
      await db.userRole.create({
        data: {
          userTenantId: ut.id,
          roleId: studentRole.id,
          scopeType: "ALL",
        },
      });
    }

    // ลบบทบาท VIEWER (ผู้ดู) ออกจากบัญชีนิสิต เพื่อให้แสดงบทบาท "นิสิต/นักศึกษา" ชัดเจน
    if (viewerRole) {
      await db.userRole.deleteMany({
        where: { userTenantId: ut.id, roleId: viewerRole.id },
      });
    }

    createdOrUpdated++;
  }

  // อัปเดตบัญชีตัวอย่าง student@buddhist.mcu.ac.th และบัญชี @mcu.ac.th ที่เป็นนิสิตอื่นๆ ให้เป็น STUDENT ด้วย
  const extraStudentUsers = await db.user.findMany({
    where: {
      OR: [
        { email: "student@buddhist.mcu.ac.th" },
        { email: { endsWith: "@mcu.ac.th" } },
      ],
    },
  });

  for (const u of extraStudentUsers) {
    // ข้ามถ้าเป็น admin/staff/teacher (รวมถึงรหัสอาจารย์ t69xxx@mcu.ac.th)
    if (
      u.email.startsWith("admin@") ||
      u.email.startsWith("staff@") ||
      u.email.startsWith("teacher") ||
      u.email.startsWith("t69")
    ) {
      continue;
    }
    const ut = await db.userTenant.findFirst({
      where: { userId: u.id, tenantId: mcuTenant.id },
    });
    if (!ut) continue;

    const hasStudentRole = await db.userRole.findFirst({
      where: { userTenantId: ut.id, roleId: studentRole.id },
    });
    if (!hasStudentRole) {
      await db.userRole.create({
        data: {
          userTenantId: ut.id,
          roleId: studentRole.id,
          scopeType: "ALL",
        },
      });
    }
    if (viewerRole) {
      await db.userRole.deleteMany({
        where: { userTenantId: ut.id, roleId: viewerRole.id },
      });
    }
  }

  const studentMemberCount = await db.userRole.count({
    where: { roleId: studentRole.id },
  });

  console.log(
    `✅ สร้างบทบาท "นิสิต/นักศึกษา (STUDENT)" และอัปเดตสิทธิ์นิสิตสำเร็จ: ${createdOrUpdated} คน (รวมสมาชิกในบทบาทนิสิตทั้งหมด: ${studentMemberCount} คน)`
  );

  await db.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
