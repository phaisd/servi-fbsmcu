import "dotenv/config";
import fs from "fs";
import path from "path";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  const backupDir = path.join(process.cwd(), "backups");
  const files = fs
    .readdirSync(backupDir)
    .filter((f) => f.startsWith("certificate_requests_backup_") && f.endsWith(".json"))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.log("ไม่พบไฟล์สำรองข้อมูล");
    return;
  }

  const latestFile = path.join(backupDir, files[0]);
  console.log(`กำลังกู้คืนข้อมูลจาก: ${latestFile}`);

  const data = JSON.parse(fs.readFileSync(latestFile, "utf-8"));
  let restored = 0;

  for (const item of data) {
    await prisma.certificateRequest.create({
      data: {
        id: item.id,
        tenantId: item.tenantId,
        userId: item.userId,
        certificateTypeId: item.certificateTypeId,
        status: item.status,
        reason: item.reason,
        note: item.note,
        issuedDocumentUrl: item.issuedDocumentUrl,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      },
    });
    restored++;
  }

  console.log(`กู้คืนข้อมูลคำร้องสำเร็จ ${restored} รายการ`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
