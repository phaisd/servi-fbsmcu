import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { requireDatabaseUrl } from "../prisma/lib/require-database-url";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: requireDatabaseUrl() }),
});

async function main() {
  const personnel = await db.personnel.findMany({
    include: { department: true },
  });
  console.log("Total personnel:", personnel.length);
  const deptCounts: Record<string, number> = {};
  for (const p of personnel) {
    const deptName = p.department?.nameTh || "NULL (ไม่มีภาควิชา)";
    deptCounts[deptName] = (deptCounts[deptName] || 0) + 1;
  }
  console.log("Department counts in personnel table:", deptCounts);

  const departments = await db.department.findMany();
  console.log("\nAll departments in DB:", departments.map((d) => ({ id: d.id, nameTh: d.nameTh })));

  const nullDepts = personnel.filter((p) => !p.departmentId);
  console.log(`\nPersonnel with NULL departmentId (${nullDepts.length}):`);
  for (const p of nullDepts) {
    console.log(`- ${p.firstNameTh} ${p.lastNameTh} | position: ${p.positionTh}`);
  }
}

main().finally(() => db.$disconnect());
