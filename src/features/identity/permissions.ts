import type { PermissionDef } from "@/shared/lib/permission-def";

export const P = {
  usersRead: "users:read",
  usersManage: "users:manage",
  rolesManage: "roles:manage",
  settingsManage: "settings:manage",
  auditRead: "audit:read",
} as const;

export const IDENTITY_PERMISSIONS: readonly PermissionDef[] = [
  { code: P.usersRead, module: "users", action: "read" },
  { code: P.usersManage, module: "users", action: "manage" },
  { code: P.rolesManage, module: "roles", action: "manage" },
  { code: P.settingsManage, module: "settings", action: "manage" },
  { code: P.auditRead, module: "audit", action: "read" },
];

/** บทบาทตั้งต้น — seed และ bootstrap ใช้ร่วมกัน */
export const SUPER_ADMIN_CODE = "SUPER_ADMIN";
export const DEFAULT_ROLES: ReadonlyArray<{ code: string; nameTh: string; nameEn: string; isSystem: boolean; permissions: readonly string[] }> = [
  { code: SUPER_ADMIN_CODE, nameTh: "ผู้ดูแลสูงสุด", nameEn: "Super admin", isSystem: true, permissions: [] },
  { code: "ADMIN", nameTh: "ผู้ดูแลระบบ", nameEn: "Administrator", isSystem: false, permissions: [P.usersRead, P.usersManage, P.rolesManage, P.settingsManage, P.auditRead] },
  { code: "TEACHER", nameTh: "อาจารย์ผู้สอน", nameEn: "Teacher", isSystem: false, permissions: ["attendance:read", "attendance:manage"] },
  { code: "CURRICULUM_OFFICER", nameTh: "เจ้าหน้าที่หลักสูตร", nameEn: "Curriculum Officer", isSystem: false, permissions: ["curriculum:read", "curriculum:manage", "attendance:read", "attendance:manage", "personnel:read", P.usersRead, "events:manage"] },
  { code: "STAFF", nameTh: "เจ้าหน้าที่", nameEn: "Staff", isSystem: false, permissions: [P.usersRead] },
  { code: "STUDENT", nameTh: "นิสิต/นักศึกษา", nameEn: "Student", isSystem: false, permissions: ["certificates:portal:request", "attendance:read", "curriculum:read", "administration:read", "meetings:book"] },
  { code: "VIEWER", nameTh: "ผู้ดู", nameEn: "Viewer", isSystem: false, permissions: [P.usersRead] },
];
