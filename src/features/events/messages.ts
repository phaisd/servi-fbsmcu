import type { Dictionary } from "@/shared/lib/i18n/translate";

export const MESSAGES: Dictionary = {
  "events.nav": { th: "กิจกรรมนิสิตและคณาจารย์", en: "Activities & Events" },
  "events.title": { th: "ระบบกิจกรรมและการเข้าร่วม", en: "Manage Activities & Events" },
  
  "events.status.REGISTERED": { th: "ลงทะเบียนแล้ว", en: "Registered" },
  "events.status.ATTENDED": { th: "เข้าร่วมแล้ว", en: "Attended" },
  "events.status.CANCELLED": { th: "ยกเลิก", en: "Cancelled" },

  "roles.module.events": { th: "ระบบกิจกรรม", en: "Events" },
  "perm.events:manage": { th: "จัดการกิจกรรมและรายชื่อ", en: "Manage events and registrations" },
};
