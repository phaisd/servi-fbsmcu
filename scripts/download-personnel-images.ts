import "dotenv/config";
import https from "node:https";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { requireDatabaseUrl } from "../prisma/lib/require-database-url";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: requireDatabaseUrl() }),
});

function downloadImage(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const req = client.get(
      url,
      { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } },
      (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} when downloading ${url}`));
        }
        const fileStream = fs.createWriteStream(destPath);
        res.pipe(fileStream);
        fileStream.on("finish", () => {
          fileStream.close();
          resolve();
        });
      }
    );
    req.on("error", (err) => {
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

async function main() {
  console.log("==========================================================");
  console.log("  ดาวน์โหลดและบันทึกรูปภาพอาจารย์/บุคลากรลงเครื่องเซิร์ฟเวอร์");
  console.log("  (Persisting External MCU Teacher Images to Local Storage)");
  console.log("==========================================================");

  const uploadsDir = path.resolve(process.cwd(), "public", "uploads", "personnel");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const personnelList = await db.personnel.findMany({
    where: {
      imageUrl: {
        startsWith: "http",
      },
    },
    select: {
      id: true,
      firstNameTh: true,
      lastNameTh: true,
      imageUrl: true,
    },
  });

  console.log(`พบอาจารย์ที่ใช้รูปภาพจากภายนอก: ${personnelList.length} ท่าน\n`);

  let successCount = 0;

  for (const p of personnelList) {
    if (!p.imageUrl) continue;
    try {
      const parsedUrl = new URL(p.imageUrl);
      const ext = path.extname(parsedUrl.pathname) || ".png";
      const cleanBaseName = path.basename(parsedUrl.pathname, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
      const localFileName = `mcu-${p.id.slice(0, 8)}-${cleanBaseName}${ext}`;
      const localFilePath = path.join(uploadsDir, localFileName);
      const publicPath = `/uploads/personnel/${localFileName}`;

      process.stdout.write(`กำลังดาวน์โหลดรูปของ: ${p.firstNameTh} ... `);

      if (!fs.existsSync(localFilePath) || fs.statSync(localFilePath).size === 0) {
        await downloadImage(p.imageUrl, localFilePath);
      }

      await db.personnel.update({
        where: { id: p.id },
        data: { imageUrl: publicPath },
      });

      console.log(`✓ สำเร็จ! -> ${publicPath}`);
      successCount++;
    } catch (err: unknown) {
      console.log(`❌ ล้มเหลว (${err instanceof Error ? err.message : String(err)})`);
    }
  }

  console.log("\n==========================================================");
  console.log(`✓ บันทึกรูปภาพทั้งหมดเรียบร้อยแล้ว: ${successCount} / ${personnelList.length} รูป`);
  console.log(`  ตำแหน่งไฟล์: ${uploadsDir}`);
  console.log("==========================================================");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
