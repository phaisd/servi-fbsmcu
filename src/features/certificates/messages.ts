import type { Dictionary } from "@/shared/lib/i18n/translate";

export const MESSAGES: Dictionary = {
  // Navigation & Header
  "certificates.nav": { th: "หนังสือรับรอง", en: "Certificates" },
  "certificates.title": { th: "ระบบบริการออกหนังสือรับรอง", en: "Certificate Request System" },
  "certificates.subtitle": { th: "ยื่นคำร้องและจัดการหนังสือรับรองสำหรับนิสิตและบุคลากร", en: "Manage and request certificates for students and staff" },
  "certificates.portal.nav": { th: "บริการนิสิต (Student Portal)", en: "Student Portal" },
  "certificates.portal.request": { th: "ขอหนังสือรับรองออนไลน์", en: "Request Certificate" },
  "certificates.portal.track": { th: "ติดตามสถานะใบรับรอง", en: "Track Certificate Status" },
  "certificates.portal.attendance": { th: "เวลาเรียน & ลงทะเบียนวิชา", en: "Attendance & Course Enrollment" },

  // Permissions & Modules
  "roles.module.certificates": { th: "ระบบหนังสือรับรอง", en: "Certificates" },
  "perm.certificates:portal:request": { th: "ยื่นคำร้องขอหนังสือรับรองและติดตามสถานะ (นิสิต/ผู้ขอ)", en: "Request certificates & track status (Student Portal)" },
  "perm.certificates:request:view": { th: "ดูรายการคำร้องขอเอกสาร", en: "View certificate requests" },
  "perm.certificates:request:manage": { th: "พิจารณาอนุมัติ/ปฏิเสธคำร้องขอเอกสาร", en: "Manage certificate requests" },
  "perm.certificates:type:manage": { th: "จัดการประเภทหนังสือรับรอง", en: "Manage certificate types" },
};
