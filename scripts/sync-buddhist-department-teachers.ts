import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { requireDatabaseUrl } from "../prisma/lib/require-database-url";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: requireDatabaseUrl() }),
});

const DEFAULT_PASSWORD = "Passw0rd!vibe";

interface TeacherConfig {
  nameRaw: string;
  firstNameTh: string;
  lastNameTh: string;
  firstNameEn?: string;
  lastNameEn?: string;
  academicPosition?: string;
  positionTh: string;
  imageUrl?: string;
  crawledEmail?: string;
  preferredEmail: string; // The email to use (gmail or @mcu.ac.th, or system-generated @mcu.ac.th)
  aliases: string[];
}

const MCU_BUDDHISM_TEACHERS: TeacherConfig[] = [
  {
    nameRaw: "พระราชญาณวชิรเวที, ผศ.ดร.",
    academicPosition: "ผศ.ดร.",
    firstNameTh: "พระราชญาณวชิรเวที (สมเกียรติ กิตฺติญาโณ)",
    lastNameTh: "",
    firstNameEn: "Phra Rajayanavajiravedi (Somkiat Kittiyano)",
    lastNameEn: "",
    positionTh: "รองอธิการบดีฝ่ายกิจการนิสิต / อาจารย์ประจำภาควิชาพระพุทธศาสนา",
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2026/03/dent6901-221x300.png",
    crawledEmail: "methi424@gmail.com",
    preferredEmail: "methi424@gmail.com", // Gmail: ใช้ตามจริง
    aliases: ["พระราชญาณวชิรเวที", "สมเกียรติ กิตฺติญาโณ", "methi424@gmail.com"],
  },
  {
    nameRaw: "พระมหาจีรวัฒน์ กนฺตวณฺโณ, รศ.ดร.",
    academicPosition: "รศ.ดร.",
    firstNameTh: "พระมหาจีรวัฒน์ กนฺตวณฺโณ",
    lastNameTh: "",
    firstNameEn: "Phramaha Jeerawat Kantavanno",
    lastNameEn: "",
    positionTh: "อาจารย์ประจำภาควิชาพระพุทธศาสนา คณะพุทธศาสตร์",
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2024/03/pmjirawat67-280x300.jpg",
    crawledEmail: "chiravat.kan@mcu.ac.th",
    preferredEmail: "chiravat.kan@mcu.ac.th", // @mcu.ac.th: ใช้ตามจริง
    aliases: ["พระมหาจีรวัฒน์", "chiravat.kan@mcu.ac.th", "jeerawat.kan@mcu.ac.th"],
  },
  {
    nameRaw: "พระมหาไพโรจรน์ ญาณกุศโล, ดร.",
    academicPosition: "ดร.",
    firstNameTh: "พระมหาไพโรจรน์ ญาณกุศโล",
    lastNameTh: "",
    firstNameEn: "Phramaha Phairoat Yanakusalo",
    lastNameEn: "",
    positionTh: "อาจารย์ประจำภาควิชาพระพุทธศาสนา คณะพุทธศาสตร์",
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2025/10/a3PmPairaon68-241x300.png",
    crawledEmail: "",
    preferredEmail: "phairot.yan@mcu.ac.th", // ระบบกำหนดเป็น @mcu.ac.th
    aliases: ["พระมหาไพโรจรน์", "phairot.yan@mcu.ac.th"],
  },
  {
    nameRaw: "พระมหายงยุทธ ธีรธมฺโม, ผศ.ดร.",
    academicPosition: "ผศ.ดร.",
    firstNameTh: "พระมหายงยุทธ ธีรธมฺโม",
    lastNameTh: "",
    firstNameEn: "Phramaha Yongyut Dhiradhammo",
    lastNameEn: "",
    positionTh: "อาจารย์ประจำภาควิชาพระพุทธศาสนา คณะพุทธศาสตร์",
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2024/03/S__22085639_0-257x300.jpg",
    crawledEmail: "pmyongyut@hotmail.com", // Hotmail -> ไม่ใช่ Gmail/@mcu.ac.th
    preferredEmail: "yongyut.dhi@mcu.ac.th", // ระบบกำหนดเป็น @mcu.ac.th ให้โดยอัตโนมัติ
    aliases: ["พระมหายงยุทธ", "pmyongyut@hotmail.com", "yongyut.dhi@mcu.ac.th"],
  },
  {
    nameRaw: "Assoc.Prof.Dr. Ven.W.Piyaratana",
    academicPosition: "รศ.ดร.",
    firstNameTh: "Ven. W. Piyaratana",
    lastNameTh: "",
    firstNameEn: "Ven. W. Piyaratana",
    lastNameEn: "",
    positionTh: "Lecturer, Department of Buddhism, Faculty of Buddhism",
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2025/10/a3VenPiyaratana68-238x300.png",
    crawledEmail: "piyaratano10@yahoo.com", // Yahoo -> ไม่ใช่ Gmail/@mcu.ac.th
    preferredEmail: "piyaratana.w@mcu.ac.th", // ระบบกำหนดเป็น @mcu.ac.th ให้โดยอัตโนมัติ
    aliases: ["Piyaratana", "piyaratano10@yahoo.com", "piyaratana.w@mcu.ac.th"],
  },
  {
    nameRaw: "พระมหาราชัน จิตฺตปาโล, ดร.",
    academicPosition: "ดร.",
    firstNameTh: "พระมหาราชัน จิตฺตปาโล",
    lastNameTh: "",
    firstNameEn: "Phramaha Rachan Cittapalo",
    lastNameEn: "",
    positionTh: "อาจารย์ประจำภาควิชาพระพุทธศาสนา คณะพุทธศาสตร์",
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2025/03/a3PmRashun68-238x300.jpeg",
    crawledEmail: "pmrachan@gmail.com",
    preferredEmail: "pmrachan@gmail.com", // Gmail: ใช้ตามจริง
    aliases: ["พระมหาราชัน", "pmrachan@gmail.com", "rachan.cit@mcu.ac.th"],
  },
  {
    nameRaw: "พระครูพิศิษฐ์ธรรมพิสุทธิ์, ดร.",
    academicPosition: "ดร.",
    firstNameTh: "พระครูพิศิษฐ์ธรรมพิสุทธิ์",
    lastNameTh: "",
    firstNameEn: "Phrakhru Phisitdhammapisut",
    lastNameEn: "",
    positionTh: "อาจารย์ประจำภาควิชาพระพุทธศาสนา คณะพุทธศาสตร์",
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2025/09/a3Aphrapijit69-225x300.jpg",
    crawledEmail: "pichit.dha@mcu.ac.th",
    preferredEmail: "pichit.dha@mcu.ac.th", // @mcu.ac.th: ใช้ตามจริง
    aliases: ["พระครูพิศิษฐ์ธรรมพิสุทธิ์", "pichit.dha@mcu.ac.th", "phisit.dha@mcu.ac.th"],
  },
  {
    nameRaw: "พระมหาวีรเดช อธิปญฺโญ, ดร.",
    academicPosition: "ดร.",
    firstNameTh: "พระมหาวีรเดช อธิปญฺโญ",
    lastNameTh: "",
    firstNameEn: "Phramaha Veeradej Adhipanno",
    lastNameEn: "",
    positionTh: "อาจารย์ประจำภาควิชาพระพุทธศาสนา คณะพุทธศาสตร์",
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2026/10/a3PmViradej69-230x300.png",
    crawledEmail: "veeradej.adh@mcu.ac.th",
    preferredEmail: "veeradej.adh@mcu.ac.th", // @mcu.ac.th: ใช้ตามจริง
    aliases: ["พระมหาวีรเดช", "veeradej.adh@mcu.ac.th"],
  },
  {
    nameRaw: "พระครูปลัดสุขีศม สีลเตชปุตฺติโย, ดร.",
    academicPosition: "ดร.",
    firstNameTh: "พระครูปลัดสุขีศม สีลเตชปุตฺติโย",
    lastNameTh: "",
    firstNameEn: "Phrakhrupalad Sukhisam Silatechaputtiyo",
    lastNameEn: "",
    positionTh: "อาจารย์ประจำภาควิชาพระพุทธศาสนา คณะพุทธศาสตร์",
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2026/04/a3PSukheesom69-233x300.png",
    crawledEmail: "sukhisam.sil@mcu.ac.th",
    preferredEmail: "sukhisam.sil@mcu.ac.th", // @mcu.ac.th: ใช้ตามจริง
    aliases: ["พระครูปลัดสุขีศม", "sukhisam.sil@mcu.ac.th"],
  },
  {
    nameRaw: "ดร.อุดม จันทิมา",
    academicPosition: "ดร.",
    firstNameTh: "อุดม",
    lastNameTh: "จันทิมา",
    firstNameEn: "Udom",
    lastNameEn: "Chanthima",
    positionTh: "อาจารย์ประจำภาควิชาพระพุทธศาสนา คณะพุทธศาสตร์",
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2026/04/951813001_44-233x300.png",
    crawledEmail: "udom.chan@mcu.ac.th",
    preferredEmail: "udom.chan@mcu.ac.th", // @mcu.ac.th: ใช้ตามจริง
    aliases: ["อุดม จันทิมา", "udom.chan@mcu.ac.th", "udom.jan@mcu.ac.th"],
  },
  {
    nameRaw: "ดร.อธิเทพ ผาทา",
    academicPosition: "ดร.",
    firstNameTh: "อธิเทพ",
    lastNameTh: "ผาทา",
    firstNameEn: "Athithep",
    lastNameEn: "Phatha",
    positionTh: "อาจารย์ประจำภาควิชาพระพุทธศาสนา คณะพุทธศาสตร์",
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2026/04/951813001_33-233x300.png",
    crawledEmail: "eston045@yahoo.com", // Yahoo -> ไม่ใช่ Gmail/@mcu.ac.th
    preferredEmail: "atithep.pha@mcu.ac.th", // ระบบกำหนดเป็น @mcu.ac.th ให้โดยอัตโนมัติ
    aliases: ["อธิเทพ ผาทา", "eston045@yahoo.com", "atithep.pha@mcu.ac.th"],
  },
];

async function main() {
  console.log("==========================================================");
  console.log("  ปรับปรุงข้อมูลบัญชีและอีเมลอาจารย์ประจำภาควิชาพระพุทธศาสนา");
  console.log("  (https://fb.mcu.ac.th/?page_id=9032)");
  console.log("==========================================================\n");

  const mcuTenant = await db.tenant.findUnique({ where: { code: "MCU" } });
  if (!mcuTenant) throw new Error("ไม่พบ Tenant MCU");

  const teacherRole = await db.role.findFirst({
    where: { tenantId: mcuTenant.id, code: "TEACHER" },
  });
  if (!teacherRole) throw new Error("ไม่พบ Role TEACHER");

  const dept = await db.department.findFirst({
    where: {
      tenantId: mcuTenant.id,
      nameTh: { contains: "พระพุทธศาสนา" },
    },
  });

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  // 1. ตรวจสอบและสร้าง/อัปเดตบัญชี User สำหรับอาจารย์ทั้ง 11 ท่าน
  console.log("--- 1. ดำเนินการตรวจสอบและอัปเดตตาราง User ---");
  for (const t of MCU_BUDDHISM_TEACHERS) {
    // ค้นหา User จากอีเมลหรือชื่อ
    let user = await db.user.findFirst({
      where: {
        OR: [
          { email: t.preferredEmail },
          { email: t.crawledEmail ? t.crawledEmail : undefined },
          ...t.aliases.map((a) => (a.includes("@") ? { email: a } : { name: { contains: a } })),
        ].filter(Boolean) as any,
      },
      include: {
        userTenants: {
          include: { userRoles: true },
        },
      },
    });

    const displayName = `${t.academicPosition ? t.academicPosition + " " : ""}${t.firstNameTh} ${t.lastNameTh}`.trim();

    if (!user) {
      console.log(`[+] สร้างบัญชี User ใหม่: ${displayName} (${t.preferredEmail})`);
      user = await db.user.create({
        data: {
          name: displayName,
          email: t.preferredEmail,
          passwordHash,
          userTenants: {
            create: {
              tenantId: mcuTenant.id,
              userRoles: {
                create: {
                  roleId: teacherRole.id,
                },
              },
            },
          },
        },
        include: {
          userTenants: {
            include: { userRoles: true },
          },
        },
      });
    } else {
      // ตรวจสอบว่าต้องอัปเดตอีเมลหรือไม่
      if (user.email !== t.preferredEmail) {
        console.log(`[*] อัปเดตอีเมล User: ${user.name}`);
        console.log(`    เดิม: ${user.email} -> ใหม่: ${t.preferredEmail}`);

        // ตรวจสอบว่า preferredEmail มีผู้ใช้อื่นซ้ำไหม
        const existing = await db.user.findUnique({ where: { email: t.preferredEmail } });
        if (existing && existing.id !== user.id) {
          console.log(`    ! อีเมล ${t.preferredEmail} ชนกับ User id ${existing.id} -> รวมข้อมูลหรือเคลียร์บัญชีซ้ำ`);
          // ย้ายความสัมพันธ์หรือลบ
        } else {
          user = await db.user.update({
            where: { id: user.id },
            data: { email: t.preferredEmail },
            include: {
              userTenants: {
                include: { userRoles: true },
              },
            },
          });
        }
      } else {
        console.log(`[✓] บัญชี User: ${user.name} ใช้อีเมล ${t.preferredEmail} ถูกต้องแล้ว`);
      }

      // ตรวจสอบสิทธิ์ TEACHER
      const hasTeacherRole = user.userTenants.some((ut) =>
        ut.userRoles.some((ur) => ur.roleId === teacherRole.id)
      );
      if (!hasTeacherRole) {
        const primaryUt = user.userTenants[0];
        if (primaryUt) {
          await db.userRole.create({
            data: {
              userTenantId: primaryUt.id,
              roleId: teacherRole.id,
            },
          });
          console.log(`    + เพิ่มสิทธิ์ TEACHER ให้ ${user.name}`);
        }
      }
    }
  }

  // 2. เคลียร์ข้อมูลซ้ำซ้อนในตาราง Personnel และอัปเดตอีเมลโปรไฟล์
  console.log("\n--- 2. ดำเนินการตรวจสอบและจัดระเบียบตาราง Personnel ---");
  for (const t of MCU_BUDDHISM_TEACHERS) {
    const records = await db.personnel.findMany({
      where: {
        OR: [
          { email: t.preferredEmail },
          { email: t.crawledEmail ? t.crawledEmail : undefined },
          { firstNameTh: { contains: t.firstNameTh.slice(0, 10) } },
        ].filter(Boolean) as any,
      },
      include: { researchPublications: true },
      orderBy: { createdAt: "asc" },
    });

    if (records.length === 0) {
      console.log(`[+] ไม่พบข้อมูล Personnel สร้างใหม่: ${t.nameRaw}`);
      await db.personnel.create({
        data: {
          tenantId: mcuTenant.id,
          departmentId: dept?.id ?? null,
          academicPosition: t.academicPosition,
          firstNameTh: t.firstNameTh,
          lastNameTh: t.lastNameTh,
          firstNameEn: t.firstNameEn,
          lastNameEn: t.lastNameEn,
          positionTh: t.positionTh,
          imageUrl: t.imageUrl,
          email: t.preferredEmail,
          type: "ACADEMIC",
        },
      });
      continue;
    }

    // มี records -> เลือก primary record ตัวที่มีงานวิจัย หรือตัวแรก
    const primary = records.reduce((best, curr) =>
      curr.researchPublications.length > best.researchPublications.length ? curr : best
    );

    // ย้าย publications จากตัวอื่นมาที่ primary แล้วลบตัวซ้ำ
    for (const other of records) {
      if (other.id === primary.id) continue;
      if (other.researchPublications.length > 0) {
        console.log(`    - ย้ายผลงานวิจัย ${other.researchPublications.length} ชิ้น จาก ID ${other.id} มายัง ${primary.id}`);
        await db.researchPublication.updateMany({
          where: { personnelId: other.id },
          data: { personnelId: primary.id },
        });
      }
      console.log(`    - ลบรายการ Personnel ซ้ำ: ID ${other.id}`);
      await db.personnel.delete({ where: { id: other.id } });
    }

    // อัปเดต primary record
    await db.personnel.update({
      where: { id: primary.id },
      data: {
        departmentId: dept?.id ?? null,
        academicPosition: t.academicPosition,
        firstNameTh: t.firstNameTh,
        lastNameTh: t.lastNameTh,
        positionTh: t.positionTh,
        imageUrl: t.imageUrl ?? primary.imageUrl,
        email: t.preferredEmail,
      },
    });

    const pubCount = await db.researchPublication.count({ where: { personnelId: primary.id } });
    console.log(`[✓] จัดระเบียบสำเร็จ: ${t.academicPosition || ""} ${t.firstNameTh} ${t.lastNameTh}`);
    console.log(`    - อีเมลโปรไฟล์: ${t.preferredEmail}`);
    console.log(`    - ผลงานวิจัย: ${pubCount} รายการ`);
  }

  console.log("\n==========================================================");
  console.log("✓ เสร็จสิ้นการซิงค์และจัดระเบียบบัญชีอาจารย์ประจำภาควิชาพระพุทธศาสนา!");
  console.log("==========================================================");
}

main().finally(() => db.$disconnect());
