import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { requireDatabaseUrl } from "../prisma/lib/require-database-url";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: requireDatabaseUrl() }),
});

async function main() {
  console.log("=== เริ่มตรวจสอบและรวมรายการประเภทหนังสือรับรอง (CertificateType) ที่ซ้ำซ้อน ===");

  const allTypes = await db.certificateType.findMany({
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

  // จัดกลุ่มตาม tenantId + ชื่อประเภทหนังสือรับรอง (name)
  const grouped = new Map<string, typeof allTypes>();
  for (const ct of allTypes) {
    const key = `${ct.tenantId}::${ct.name.trim().toLowerCase()}`;
    const list = grouped.get(key) || [];
    list.push(ct);
    grouped.set(key, list);
  }

  let mergedCount = 0;
  let movedRequestsCount = 0;

  for (const [, group] of grouped.entries()) {
    if (group.length <= 1) continue;

    const primary = group[0];
    const duplicates = group.slice(1);

    for (const dup of duplicates) {
      // โอนย้ายคำร้อง (CertificateRequest) ที่ผูกกับรายการซ้ำ มาผูกกับรายการหลัก (primary)
      const updatedReqs = await db.certificateRequest.updateMany({
        where: { certificateTypeId: dup.id },
        data: { certificateTypeId: primary.id },
      });
      movedRequestsCount += updatedReqs.count;

      // ลบรายการประเภทหนังสือรับรองที่ซ้ำออก
      await db.certificateType.delete({
        where: { id: dup.id },
      });
      mergedCount++;
      console.log(`- รวมและลบรายการซ้ำ: "${dup.name}" (ย้ายคำร้อง ${updatedReqs.count} รายการ -> [${primary.id}])`);
    }
  }

  // เพิ่มประเภทหนังสือรับรองสำหรับอาจารย์และเจ้าหน้าที่ (หากยังไม่มีในระบบ)
  const mcuTenant = await db.tenant.findFirst({ where: { code: "MCU" } });
  if (mcuTenant) {
    const staffTypes = [
      {
        name: "Teaching & Lecturer Certificate (รับรองการเป็นอาจารย์ประจำ/อาจารย์พิเศษ)",
        description:
          "หนังสือรับรองการเป็นอาจารย์ผู้สอน / อาจารย์พิเศษ และภาระงานสอนรายวิชาของคณะพุทธศาสตร์ (ภาษาไทย / ภาษาอังกฤษ)",
      },
      {
        name: "Faculty & Staff Employment Certificate (รับรองการปฏิบัติงานอาจารย์/เจ้าหน้าที่)",
        description:
          "หนังสือรับรองการปฏิบัติงานและสังกัดคณะพุทธศาสตร์ สำหรับอาจารย์และเจ้าหน้าที่สายสนับสนุน",
      },
    ];

    for (const st of staffTypes) {
      const exists = await db.certificateType.findFirst({
        where: { tenantId: mcuTenant.id, name: st.name },
      });
      if (!exists) {
        await db.certificateType.create({
          data: {
            tenantId: mcuTenant.id,
            name: st.name,
            description: st.description,
            isActive: true,
          },
        });
        console.log(`+ เพิ่มประเภทหนังสือรับรองใหม่: "${st.name}"`);
      }
    }
  }

  // แสดงรายการที่เหลือทั้งหมดหลังทำความสะอาด
  const finalTypes = await db.certificateType.findMany({
    where: mcuTenant ? { tenantId: mcuTenant.id } : undefined,
    include: { _count: { select: { requests: true } } },
    orderBy: { createdAt: "asc" },
  });

  console.log(
    `\n✅ ลบประเภทหนังสือรับรองที่ซ้ำสำเร็จ: ${mergedCount} รายการ (โอนย้ายคำร้อง ${movedRequestsCount} รายการ)`
  );
  console.log(`=== รายการประเภทหนังสือรับรองปัจจุบัน (ไม่มีรายการซ้ำแล้ว): รวม ${finalTypes.length} รายการ ===`);
  finalTypes.forEach((t, idx) => {
    console.log(`${idx + 1}. ${t.name} (คำร้อง: ${t._count.requests} รายการ)`);
  });

  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
