import "dotenv/config";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

function parseDatabaseUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname || "localhost",
    port: parsed.port || "5432",
    user: decodeURIComponent(parsed.username || "postgres"),
    password: decodeURIComponent(parsed.password || ""),
    database: parsed.pathname.replace(/^\//, "") || "ums_dev",
  };
}

async function runRestore() {
  const fileArg = process.argv[2];
  const backupsDir = path.resolve(process.cwd(), "backups");

  let targetFile = fileArg;
  if (!targetFile) {
    // หาไฟล์ล่าสุดใน backups/
    if (!fs.existsSync(backupsDir)) {
      throw new Error("ไม่พบโฟลเดอร์ backups");
    }
    const files = fs.readdirSync(backupsDir).filter((f) => f.endsWith(".sql"));
    if (files.length === 0) {
      throw new Error("ไม่พบไฟล์สำรองข้อมูล (.sql) ในโฟลเดอร์ backups");
    }
    files.sort((a, b) => {
      const sa = fs.statSync(path.join(backupsDir, a)).mtimeMs;
      const sb = fs.statSync(path.join(backupsDir, b)).mtimeMs;
      return sb - sa;
    });
    targetFile = path.join(backupsDir, files[0]);
  } else if (!path.isAbsolute(targetFile)) {
    targetFile = path.resolve(process.cwd(), targetFile);
  }

  if (!fs.existsSync(targetFile)) {
    throw new Error(`ไม่พบไฟล์: ${targetFile}`);
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("ไม่พบ DATABASE_URL ใน .env");

  const { host, port, user, password, database } = parseDatabaseUrl(dbUrl);
  console.log("==========================================================");
  console.log("  ระบบกู้คืนฐานข้อมูล (Database Restore)");
  console.log(`  - เป้าหมาย: ${database} (${host}:${port})`);
  console.log(`  - ไฟล์สำรอง: ${path.basename(targetFile)}`);
  console.log("==========================================================");

  const env = { ...process.env, PGPASSWORD: password };
  const cmd = `psql -h ${host} -p ${port} -U ${user} -d ${database} -f "${targetFile}"`;

  try {
    execSync(cmd, { env, stdio: "inherit" });
    console.log("✓ กู้คืนฐานข้อมูลเสร็จสมบูรณ์!");
  } catch (err: unknown) {
    console.error("เกิดข้อผิดพลาดในการกู้คืนฐานข้อมูล:", err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

runRestore().catch(console.error);
