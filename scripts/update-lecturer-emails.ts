import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

interface TeacherEmailUpdate {
  userId: string;
  expectedName: string;
  oldEmail: string;
  newEmail: string;
  reason: string;
}

const updates: TeacherEmailUpdate[] = [
  {
    userId: "f4a0ab14-ca64-44b0-a57d-42f67f188c4f",
    expectedName: "พระมหาจีรวัฒน์ กนฺตวณฺโณ, รศ.ดร.",
    oldEmail: "jeerawat.kan@mcu.ac.th",
    newEmail: "chiravat.kan@mcu.ac.th",
    reason: "อีเมลจริงจาก fb.mcu.ac.th/?p=964 (สอน 11 วิชา)",
  },
  {
    userId: "2e747079-b9e9-4083-aede-56fdd62e5a52",
    expectedName: "พระมหายงยุทธ ธีรธมฺโม, ผศ.ดร.",
    oldEmail: "yongyut.dhi@mcu.ac.th",
    newEmail: "pmyongyut@hotmail.com",
    reason: "อีเมลจริงจาก fb.mcu.ac.th/?p=959 (สอน 8 วิชา)",
  },
  {
    userId: "5af8d1d2-3734-4719-b36d-dc1e6030e8f4",
    expectedName: "Assoc. Prof. W. Piyaratana, Ph.D.",
    oldEmail: "piyaratana.w@mcu.ac.th",
    newEmail: "piyaratano10@yahoo.com",
    reason: "อีเมลจริงจาก fb.mcu.ac.th/?p=861 (สอน 12 วิชา)",
  },
  {
    userId: "6cb56ec1-3fcf-4916-95ca-8c3ba5dfa7c7", // Let's check Rachan's actual user id
    expectedName: "พระมหาราชัน จิตฺตปาโล",
    oldEmail: "rachan.cit@mcu.ac.th",
    newEmail: "pmrachan@gmail.com",
    reason: "อีเมลจริงจาก fb.mcu.ac.th/?p=11005 (สอน 8 วิชา)",
  },
  {
    userId: "75b5de27-523c-4dc6-ad27-0ba4ea3e080e",
    expectedName: "พระครูพิศิษฐ์ธรรมพิสุทธิ์, อ.ดร.",
    oldEmail: "phisit.dha@mcu.ac.th",
    newEmail: "pichit.dha@mcu.ac.th",
    reason: "อีเมลจริงจาก fb.mcu.ac.th/?p=13368 (สอน 8 วิชา)",
  },
  {
    userId: "66cc5682-ec66-4fd2-bb7f-d747c56257c7",
    expectedName: "อ.ดร.อุดม จันทิมา",
    oldEmail: "udom.jan@mcu.ac.th",
    newEmail: "udom.chan@mcu.ac.th",
    reason: "อีเมลจริงจาก fb.mcu.ac.th/?p=8724 (สอน 8 วิชา)",
  },
  {
    userId: "78999937-5297-4b8c-8e87-7b0228f8f74e",
    expectedName: "อ.ดร.อธิเทพ ผาทา",
    oldEmail: "atithep.pha@mcu.ac.th",
    newEmail: "eston045@yahoo.com",
    reason: "อีเมลจริงจาก fb.mcu.ac.th/?p=741 (สอน 6 วิชา)",
  },
];

async function main() {
  console.log("==================================================");
  console.log("  ปรับปรุงอีเมลอาจารย์ผู้บรรยาย ให้ตรงกับเว็บไซต์ fb.mcu.ac.th");
  console.log("==================================================\n");

  for (const item of updates) {
    // Check by oldEmail or expectedName
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: item.oldEmail },
          { email: item.newEmail },
          { name: { contains: item.expectedName.split(",")[0].trim() } },
        ],
      },
    });

    if (!user) {
      console.log(`[!] ไม่พบบัญชีผู้ใช้: ${item.expectedName} (Email: ${item.oldEmail})`);
      continue;
    }

    if (user.email === item.newEmail) {
      console.log(`[✓] บัญชี ${user.name} ใช้อีเมลใหม่ ${item.newEmail} อยู่แล้ว`);
      continue;
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        email: item.newEmail,
      },
    });

    console.log(`[✓] อัปเดตสำเร็จ: ${updated.name}`);
    console.log(`    - เดิม: ${user.email}`);
    console.log(`    - ใหม่: ${updated.email}`);
    console.log(`    - หมายเหตุ: ${item.reason}\n`);
  }

  // Also sync personnel records that had null email with their verified teacher user emails
  const personnelSyncList = [
    { namePart: "ไพโรจ", email: "phairot.yan@mcu.ac.th" },
    { namePart: "วีรเดช", email: "veeradej.adh@mcu.ac.th" },
    { namePart: "สุขีศม", email: "sukhisam.sil@mcu.ac.th" },
  ];

  console.log("--------------------------------------------------");
  console.log("  ซิงค์อีเมลในตารางทำเนียบบุคลากร (Personnel) ให้ครบถ้วน");
  console.log("--------------------------------------------------");
  for (const sync of personnelSyncList) {
    const updatedCount = await prisma.personnel.updateMany({
      where: {
        firstNameTh: { contains: sync.namePart },
        email: null,
      },
      data: {
        email: sync.email,
      },
    });
    if (updatedCount.count > 0) {
      console.log(`[✓] ซิงค์อีเมล Personnel สำหรับ ${sync.namePart}: ${sync.email} (${updatedCount.count} รายการ)`);
    }
  }
}

main().finally(async () => {
  await prisma.$disconnect();
});
