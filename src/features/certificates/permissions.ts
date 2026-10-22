import type { PermissionDef } from "@/shared/lib/permission-def";

export const CERTIFICATES_P = {
  portalRequest: "certificates:portal:request",
  requestView: "certificates:request:view",
  requestManage: "certificates:request:manage",
  typeManage: "certificates:type:manage",
} as const;

export const CERTIFICATES_PERMISSIONS: readonly PermissionDef[] = [
  { code: CERTIFICATES_P.portalRequest, module: "certificates", action: "portal:request", description: "ยื่นคำร้องขอหนังสือรับรองและติดตามสถานะ (สำหรับนิสิต/ผู้ขอ)" },
  { code: CERTIFICATES_P.requestView, module: "certificates", action: "request:view", description: "ดูรายการคำร้องขอเอกสาร" },
  { code: CERTIFICATES_P.requestManage, module: "certificates", action: "request:manage", description: "พิจารณาอนุมัติ/ปฏิเสธคำร้องขอเอกสาร" },
  { code: CERTIFICATES_P.typeManage, module: "certificates", action: "type:manage", description: "จัดการประเภทหนังสือรับรอง" },
];
