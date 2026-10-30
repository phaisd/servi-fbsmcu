import { prisma } from "../src/shared/lib/infra/prisma";

async function main() {
  const tenants = await prisma.tenant.findMany({ where: { isActive: true } });
  console.log("Active tenants:", tenants.map((t) => `${t.code} (${t.id})`));

  for (const tenant of tenants) {
    const existing = await prisma.department.findFirst({
      where: {
        tenantId: tenant.id,
        nameTh: "สำนักงานคณบดี",
      },
    });

    if (existing) {
      console.log(`[Tenant ${tenant.code}] Department 'สำนักงานคณบดี' already exists: ${existing.id}`);
    } else {
      const created = await prisma.department.create({
        data: {
          tenantId: tenant.id,
          nameTh: "สำนักงานคณบดี",
          nameEn: "Office of the Dean",
          code: "DEAN_OFFICE",
          type: "OFFICE",
          descriptionTh: "สำนักงานคณบดี คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
          descriptionEn: "Office of the Dean, Faculty of Buddhism, Mahachulalongkornrajavidyalaya University",
          orderIndex: 4,
        },
      });
      console.log(`[Tenant ${tenant.code}] Created department 'สำนักงานคณบดี': ${created.id}`);

      // Link staff members (SUPPORT) who currently have departmentId: null to สำนักงานคณบดี
      const updatedStaff = await prisma.personnel.updateMany({
        where: {
          tenantId: tenant.id,
          type: "SUPPORT",
          departmentId: null,
        },
        data: {
          departmentId: created.id,
        },
      });
      console.log(`[Tenant ${tenant.code}] Linked ${updatedStaff.count} support staff to สำนักงานคณบดี`);
    }
  }
}

main().finally(() => prisma.$disconnect());
