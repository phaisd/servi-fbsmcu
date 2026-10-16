import type { Dictionary } from "@/shared/lib/i18n/translate";

export const MESSAGES: Dictionary = {
  "attendance.nav": { th: "เวลาเรียนและสิทธิ์สอบ", en: "Attendance & Eligibility" },
  "attendance.dashboard.title": { th: "แดชบอร์ดภาพรวม", en: "Dashboard Overview" },
  "attendance.classes.title": { th: "รายวิชาและเวลาเรียน", en: "Course Attendance" },
  "attendance.sessions.title": { th: "ตารางคาบเรียนและการเช็กชื่อ", en: "Sessions & Attendance" },
  
  "attendance.status.PRESENT": { th: "มาเรียน", en: "Present" },
  "attendance.status.ABSENT": { th: "ขาดเรียน", en: "Absent" },
  "attendance.status.LATE": { th: "มาสาย", en: "Late" },
  "attendance.status.EXCUSED": { th: "ลาที่อนุมัติ", en: "Excused" },

  "roles.module.attendance": { th: "ระบบตรวจสอบเวลาเข้าเรียนและสิทธิ์สอบ", en: "Attendance & Exam Eligibility" },
  "perm.attendance:read": { th: "ดูสถิติและรายงานสิทธิ์สอบ", en: "View attendance & eligibility reports" },
  "perm.attendance:manage": { th: "จัดการวิชา คาบเรียน นิสิต และบันทึกเวลาเรียน", en: "Manage courses, sessions, rosters & attendance" },
};
