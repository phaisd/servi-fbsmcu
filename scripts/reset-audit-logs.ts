import * as fs from "fs";
import * as path from "path";
import { prisma } from "../src/shared/lib/infra/prisma";

async function main() {
  const count = await prisma.auditLog.count();
  console.log(`Current AuditLog count: ${count}`);

  if (count > 0) {
    const allLogs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
    });

    const backupDir = path.join(__dirname, "../backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFilePath = path.join(backupDir, `audit_logs_backup_${timestamp}.json`);
    fs.writeFileSync(backupFilePath, JSON.stringify(allLogs, null, 2), "utf8");
    console.log(`Backed up ${allLogs.length} audit logs to: ${backupFilePath}`);

    const deleteResult = await prisma.auditLog.deleteMany({});
    console.log(`Deleted ${deleteResult.count} audit logs.`);
  } else {
    console.log("No audit logs to delete.");
  }

  const remaining = await prisma.auditLog.count();
  console.log(`Remaining AuditLog count: ${remaining}`);
}

main()
  .catch((e) => {
    console.error("Error resetting audit logs:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
