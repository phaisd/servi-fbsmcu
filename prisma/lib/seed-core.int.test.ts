import { describe, it, expect } from "vitest";
import { prisma } from "@/shared/lib/infra/prisma";
import { seedCore } from "./seed-core";
import { ALL_PERMISSIONS } from "@/permissions";
import { DEFAULT_ROLES } from "@/features/identity/permissions";

describe("seedCore", () => {
  it("สร้าง tenant, permissions ทั้งหมด และบทบาทตั้งต้น 7 ตัว", async () => {
    const r = await seedCore(prisma, { tenantCode: "TEST", nameTh: "องค์กรทดสอบ", nameEn: "Test Org" });
    expect(await prisma.permission.count()).toBe(ALL_PERMISSIONS.length);
    const roles = await prisma.role.findMany({ where: { tenantId: r.tenantId } });
    const expectedRoleCodes = DEFAULT_ROLES.map((r) => r.code).sort();
    expect(roles.map((x) => x.code).sort()).toEqual(expectedRoleCodes);
    expect(roles.find((x) => x.code === "SUPER_ADMIN")!.isSystem).toBe(true);
    const admin = await prisma.role.findFirst({ where: { code: "ADMIN" }, include: { rolePermissions: true } });
    expect(admin!.rolePermissions.length).toBe(5);
    const superAdmin = await prisma.role.findFirst({ where: { code: "SUPER_ADMIN" }, include: { rolePermissions: true } });
    expect(superAdmin!.rolePermissions.length).toBe(0);
  });
  it("รันซ้ำได้โดยไม่สร้างซ้ำ", async () => {
    await seedCore(prisma, { tenantCode: "TEST", nameTh: "a", nameEn: "a" });
    await seedCore(prisma, { tenantCode: "TEST", nameTh: "a", nameEn: "a" });
    expect(await prisma.tenant.count()).toBe(1);
    expect(await prisma.role.count()).toBe(DEFAULT_ROLES.length);
    expect(await prisma.permission.count()).toBe(ALL_PERMISSIONS.length);
  });
});
