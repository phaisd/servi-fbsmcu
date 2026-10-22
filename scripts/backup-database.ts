import "dotenv/config";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// ═══════════════════════════════════════════════════════════════════
// Automated PostgreSQL Database Backup Script for MCU Faculty of Buddhism
// ═══════════════════════════════════════════════════════════════════

const RETENTION_DAYS = 30; // เก็บสำรองข้อมูลย้อนหลัง 30 วัน

function parseDatabaseUrl(url: string) {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || "localhost",
      port: parsed.port || "5432",
      user: decodeURIComponent(parsed.username || "postgres"),
      password: decodeURIComponent(parsed.password || ""),
      database: parsed.pathname.replace(/^\//, "") || "ums_dev",
    };
  } catch (err) {
    throw new Error(`ไม่สามารถอ่าน DATABASE_URL ได้: ${err}`);
  }
}

async function runBackup() {
  const startTime = Date.now();
  console.log("==========================================================");
  console.log("  ระบบสำรองข้อมูลฐานข้อมูลอัตโนมัติ (Automated DB Backup)");
  console.log("  มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย • คณะพุทธศาสตร์");
  console.log("==========================================================");

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("ไม่พบ DATABASE_URL ในสภาพแวดล้อม (.env)");
  }

  const { host, port, user, password, database } = parseDatabaseUrl(dbUrl);
  console.log(`- ฐานข้อมูลเป้าหมาย: ${database} (${host}:${port})`);
  console.log(`- ผู้ใช้งาน: ${user}`);

  // 1. ตรวจสอบและสร้างโฟลเดอร์ backups
  const backupsDir = path.resolve(process.cwd(), "backups");
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
    console.log(`- สร้างโฟลเดอร์สำรองข้อมูล: ${backupsDir}`);
  }

  // 2. ตั้งชื่อไฟล์ตามวันเวลา
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const backupFileName = `backup_${database}_${timestamp}.sql`;
  const backupFilePath = path.join(backupsDir, backupFileName);

  console.log(`- กำลังสำรองข้อมูลไปยัง: ${backupFileName} ...`);

  // 3. เรียกใช้งาน pg_dump
  const env = { ...process.env, PGPASSWORD: password };
  const cmd = `pg_dump -h ${host} -p ${port} -U ${user} -d ${database} --encoding=UTF8 --clean --if-exists -f "${backupFilePath}"`;

  try {
    execSync(cmd, { env, stdio: "inherit" });
  } catch (err: any) {
    console.error("เกิดข้อผิดพลาดในการรัน pg_dump:", err.message);
    throw err;
  }

  if (!fs.existsSync(backupFilePath)) {
    throw new Error("ไฟล์สำรองข้อมูลไม่ถูกสร้าง");
  }

  const stats = fs.statSync(backupFilePath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`✓ สำรองข้อมูลเสร็จสมบูรณ์!`);
  console.log(`  - ขนาดไฟล์: ${sizeMB} MB`);
  console.log(`  - เวลาที่ใช้: ${elapsedSec} วินาที`);
  console.log(`  - ตำแหน่งไฟล์: ${backupFilePath}`);

  // 4. ลบไฟล์สำรองข้อมูลเก่าเกินอายุ (Retention Policy)
  try {
    const files = fs.readdirSync(backupsDir);
    const retentionMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;
    let prunedCount = 0;

    for (const file of files) {
      if (file.endsWith(".sql") && file.startsWith(`backup_${database}_`)) {
        const fullPath = path.join(backupsDir, file);
        const fStat = fs.statSync(fullPath);
        if (Date.now() - fStat.mtimeMs > retentionMs) {
          fs.unlinkSync(fullPath);
          prunedCount++;
          console.log(`  - ลบไฟล์สำรองเก่า: ${file} (เกิน ${RETENTION_DAYS} วัน)`);
        }
      }
    }
    if (prunedCount > 0) {
      console.log(`- ลบไฟล์เก่าเรียบร้อย ${prunedCount} ไฟล์`);
    }
  } catch (cleanErr) {
    console.warn("คำเตือนในการล้างไฟล์เก่า:", cleanErr);
  }

  console.log("==========================================================");
  console.log("คำแนะนำในการกู้คืนข้อมูล (Restore):");
  console.log(`  psql -h ${host} -p ${port} -U ${user} -d ${database} -f "${backupFilePath}"`);
  console.log("==========================================================");
}

runBackup().catch((err) => {
  console.error("Backup failed:", err);
  process.exit(1);
});
