import "dotenv/config";
import fs from "fs";
import path from "path";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("=== เริ่มต้นสำรองข้อมูลและลบคำร้องในระบบหนังสือรับรองนิสิต ===");

  const allRequests = await prisma.certificateRequest.findMany({
    include: {
      certificateType: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  console.log(`พบข้อมูลคำร้องขอหนังสือรับรองทั้งหมด: ${allRequests.length} รายการ`);

  // Backup to JSON
  const backupDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFilePath = path.join(backupDir, `certificate_requests_backup_${timestamp}.json`);

  fs.writeFileSync(backupFilePath, JSON.stringify(allRequests, null, 2), "utf-8");
  console.log(`บันทึกไฟล์สำรองข้อมูลไว้ที่: ${backupFilePath}`);

  // Delete all certificate requests
  const deleteResult = await prisma.certificateRequest.deleteMany({});
  console.log(`ลบข้อมูลคำร้องขอหนังสือรับรองเรียบร้อยแล้ว: ${deleteResult.count} รายการ`);

  // Verify
  const remaining = await prisma.certificateRequest.count();
  console.log(`จำนวนคงเหลือในระบบ: ${remaining} รายการ`);
}

main()
  .catch((err) => {
    console.error("เกิดข้อผิดพลาดในการดำเนินการ:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
