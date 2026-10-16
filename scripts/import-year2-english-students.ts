import { PrismaClient } from "../src/generated/prisma";

const db = new PrismaClient();

interface RawStudent {
  code: string;
  name: string;
  major: "Religion and Philosophy" | "Buddhist Studies";
}

const YEAR_2_ENGLISH_STUDENTS: RawStudent[] = [
  // Major in Religion and Philosophy (18 students)
  { code: "6801501062", name: "Dipta Barua", major: "Religion and Philosophy" },
  { code: "6801501063", name: "Efol Barua", major: "Religion and Philosophy" },
  { code: "6801501065", name: "Panna -", major: "Religion and Philosophy" },
  { code: "6801501067", name: "Sujoy Barua Banik", major: "Religion and Philosophy" },
  { code: "6801501068", name: "Janaka Udayawansa Lanka Purayalage -", major: "Religion and Philosophy" },
  { code: "6801501069", name: "Jesy Chakma", major: "Religion and Philosophy" },
  { code: "6801501070", name: "Santo Barua", major: "Religion and Philosophy" },
  { code: "6801501108", name: "Akash Barua", major: "Religion and Philosophy" },
  { code: "6801501112", name: "Hridoy Barua -", major: "Religion and Philosophy" },
  { code: "6801501117", name: "Pranotus Barua", major: "Religion and Philosophy" },
  { code: "6801501118", name: "Probal Barua", major: "Religion and Philosophy" },
  { code: "6801501120", name: "Rony Barua", major: "Religion and Philosophy" },
  { code: "6801501121", name: "Samkicca", major: "Religion and Philosophy" },
  { code: "6801501122", name: "Sohag Barua -", major: "Religion and Philosophy" },
  { code: "6801501123", name: "Tinku Barua", major: "Religion and Philosophy" },
  { code: "6801501125", name: "Vicara -", major: "Religion and Philosophy" },
  { code: "6801501136", name: "Alak Barua Dipta", major: "Religion and Philosophy" },
  { code: "6801501137", name: "Ovijit Barua Ovi", major: "Religion and Philosophy" },

  // Major in Buddhist Studies (32 students)
  { code: "6801501003", name: "Khanon Barua Purna", major: "Buddhist Studies" },
  { code: "6801501004", name: "Uchingoing Marma", major: "Buddhist Studies" },
  { code: "6801501005", name: "Uhlasing Marma", major: "Buddhist Studies" },
  { code: "6801501023", name: "Anup Barua Apu", major: "Buddhist Studies" },
  { code: "6801501025", name: "Babu Tongchangya -", major: "Buddhist Studies" },
  { code: "6801501027", name: "Dalim Barua", major: "Buddhist Studies" },
  { code: "6801501030", name: "Emon Barua Badon", major: "Buddhist Studies" },
  { code: "6801501031", name: "Impel Barua Joy", major: "Buddhist Studies" },
  { code: "6801501035", name: "Kansamong Tangchangya -", major: "Buddhist Studies" },
  { code: "6801501037", name: "Marginda -", major: "Buddhist Studies" },
  { code: "6801501038", name: "Mitu Barua", major: "Buddhist Studies" },
  { code: "6801501039", name: "Nam Tran Quoc", major: "Buddhist Studies" },
  { code: "6801501040", name: "Nandar Sarya", major: "Buddhist Studies" },
  { code: "6801501043", name: "Nipu Barua", major: "Buddhist Studies" },
  { code: "6801501044", name: "Nirob Barua", major: "Buddhist Studies" },
  { code: "6801501045", name: "Oujjal Barua", major: "Buddhist Studies" },
  { code: "6801501052", name: "Rupok Kanti Barua", major: "Buddhist Studies" },
  { code: "6801501053", name: "Sasanamuni", major: "Buddhist Studies" },
  { code: "6801501054", name: "Siyabhalape Jinarathana Thero", major: "Buddhist Studies" },
  { code: "6801501055", name: "Urjoy Barua", major: "Buddhist Studies" },
  { code: "6801501057", name: "Utsha Barua", major: "Buddhist Studies" },
  { code: "6801501058", name: "Zinto Barua", major: "Buddhist Studies" },
  { code: "6801501059", name: "Remel Barua", major: "Buddhist Studies" },
  { code: "6801501088", name: "Akash Barua", major: "Buddhist Studies" },
  { code: "6801501092", name: "Kondanna", major: "Buddhist Studies" },
  { code: "6801501096", name: "Nyar Nate Sara -", major: "Buddhist Studies" },
  { code: "6801501098", name: "Sagar Barua", major: "Buddhist Studies" },
  { code: "6801501101", name: "Sourav Barua -", major: "Buddhist Studies" },
  { code: "6801501102", name: "Sucinta", major: "Buddhist Studies" },
  { code: "6801501103", name: "Thach Du", major: "Buddhist Studies" },
  { code: "6801501105", name: "Tipon Barua", major: "Buddhist Studies" },
  { code: "6801501140", name: "Huynh Xuan Vinh", major: "Buddhist Studies" },
];

function splitName(rawName: string) {
  const clean = rawName.trim().replace(/\s+/g, " ");
  const parts = clean.split(" ");
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "-" };
  }
  if (parts.length === 2) {
    return { firstName: parts[0], lastName: parts[1] };
  }
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
}

async function main() {
  console.log("=== เริ่มต้นนำเข้ารายชื่อนิสิต ชั้นปีที่ 2 ภาคภาษาอังกฤษ (50 คน) ===");

  const tenants = await db.tenant.findMany();
  console.log(`พบ ${tenants.length} tenants ในระบบ:`, tenants.map(t => `${t.nameTh} (${t.code})`).join(", "));

  for (const tenant of tenants) {
    console.log(`\n--- ดำเนินการกับ Tenant: ${tenant.nameTh} (${tenant.code}) ---`);

    let upsertedCount = 0;

    for (const item of YEAR_2_ENGLISH_STUDENTS) {
      const { firstName, lastName } = splitName(item.name);
      const department =
        item.major === "Religion and Philosophy"
          ? "ภาควิชาศาสนาและปรัชญา"
          : "ภาควิชาพระพุทธศาสนา";
      const curriculumName = `พุทธศาสตรบัณฑิต สาขาวิชา${item.major === "Religion and Philosophy" ? "ศาสนาและปรัชญา" : "พระพุทธศาสนา"} (หลักสูตรภาษาอังกฤษ)`;

      await db.student.upsert({
        where: {
          tenantId_studentCode: {
            tenantId: tenant.id,
            studentCode: item.code,
          },
        },
        create: {
          tenantId: tenant.id,
          studentCode: item.code,
          title: "",
          firstName,
          lastName,
          yearLevel: 2,
          degree: "ปริญญาตรี",
          curriculumName,
          department,
          major: item.major,
          gender: "ชาย",
          studyStatus: "ปกติ",
          faculty: "คณะพุทธศาสตร์",
          isActive: true,
        },
        update: {
          firstName,
          lastName,
          yearLevel: 2,
          degree: "ปริญญาตรี",
          curriculumName,
          department,
          major: item.major,
          studyStatus: "ปกติ",
          isActive: true,
        },
      });

      upsertedCount++;
    }

    console.log(`  ✓ บันทึกข้อมูลนิสิตปี 2 สำเร็จ: ${upsertedCount} คน`);

    const relPhilCount = await db.student.count({
      where: { tenantId: tenant.id, yearLevel: 2, major: "Religion and Philosophy" },
    });
    const buddStudCount = await db.student.count({
      where: { tenantId: tenant.id, yearLevel: 2, major: "Buddhist Studies" },
    });

    console.log(`  - Religion and Philosophy: ${relPhilCount} คน`);
    console.log(`  - Buddhist Studies: ${buddStudCount} คน`);
  }

  console.log("\n=== นำเข้าข้อมูลนิสิตปี 2 ภาคภาษาอังกฤษเสร็จสมบูรณ์ครบทั้ง 50 คน ===");
}

main()
  .catch((e) => {
    console.error("Error importing students:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
