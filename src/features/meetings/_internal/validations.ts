import { z } from "zod";

export const meetingRoomSchema = z.object({
  name: z.string().min(1, "Required").max(255),
  capacity: z.number().int().min(1).default(10),
  equipment: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().or(z.literal("")).nullable(),
  isActive: z.boolean().default(true),
});

export const updateMeetingRoomSchema = meetingRoomSchema.partial();

export const meetingBookingSchema = z.object({
  roomId: z.string().uuid("Invalid room ID"),
  title: z.string().min(1, "Required").max(255),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  remark: z.string().optional().nullable(),
}).refine((data) => data.startTime < data.endTime, {
  message: "End time must be after start time",
  path: ["endTime"],
});

// ========================================================
// Official Meeting Request Form (ใบขอใช้ห้องประชุมประจำคณะพุทธศาสตร์)
// ========================================================

export type MeetingPurposeType = string;

export const meetingFormPurposeOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
});
export type MeetingFormPurposeOption = z.infer<typeof meetingFormPurposeOptionSchema>;

export const meetingFormEquipmentOptionSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  desc: z.string().optional().default(""),
});
export type MeetingFormEquipmentOption = z.infer<typeof meetingFormEquipmentOptionSchema>;

export const meetingFormSettingsSchema = z.object({
  purposes: z.array(meetingFormPurposeOptionSchema).default([
    { id: "MEETING", label: "ประชุม (Meeting)" },
    { id: "TRAINING", label: "อบรม (Training)" },
    { id: "SEMINAR", label: "สัมมนา (Seminar)" },
    { id: "OTHER", label: "อื่นๆ (Other)" },
  ]),
  equipments: z.array(meetingFormEquipmentOptionSchema).default([
    { key: "computer", label: "คอมพิวเตอร์ (Computer)", desc: "เครื่องคอมพิวเตอร์ควบคุมประจำห้อง" },
    { key: "ledDisplay", label: "จอ LED / Projector", desc: "จอแสดงผลความละเอียดสูง" },
    { key: "soundSystem", label: "เครื่องขยายเสียง (Sound System)", desc: "ไมโครโฟนตั้งโต๊ะและชุดลำโพง" },
    { key: "zoomOnline", label: "Zoom Online", desc: "สัญญาณอินเทอร์เน็ตและการถ่ายทอดสด" },
  ]),
});
export type MeetingFormSettings = z.infer<typeof meetingFormSettingsSchema>;

export const meetingBookingMetadataSchema = z.object({
  requestDate: z.string().optional().default(""),
  // ข้าพเจ้า
  requesterName: z.string().trim().default(""),
  requesterPosition: z.string().trim().optional().default(""),
  requesterDepartment: z.string().trim().optional().default(""),
  requesterPhone: z.string().trim().optional().default(""),
  requesterEmail: z.string().trim().optional().default(""),
  // เพื่อ (วัตถุประสงค์ - รองรับทั้งแบบมาตรฐานและแบบที่ Admin กำหนดเอง)
  purposeType: z.string().default("MEETING"),
  purposeOther: z.string().trim().optional().default(""),
  // เรื่อง (Topic)
  topic: z.string().trim().default(""),
  // วัน-เวลา
  startDate: z.string().trim().default(""),
  startTimeStr: z.string().trim().default(""),
  endDate: z.string().trim().default(""),
  endTimeStr: z.string().trim().default(""),
  // จำนวนผู้เข้าใช้ห้องประชุม
  attendeeCount: z.coerce.number().int().min(1).default(1),
  // ต้องการใช้อุปกรณ์ (รองรับไดนามิกตามที่ Admin กำหนด)
  equipments: z.record(z.string(), z.union([z.boolean(), z.string()])).default({
    computer: false,
    ledDisplay: false,
    soundSystem: false,
    zoomOnline: false,
    other: "",
  }),
  // ผู้ประสานงาน (เปลี่ยนเป็นเก็บอีเมลแทนเบอร์โทรตามคำขอ และรองรับเบอร์เดิม)
  coordinatorName: z.string().trim().optional().default(""),
  coordinatorEmail: z.string().trim().optional().default(""),
  coordinatorPhone: z.string().trim().optional().default(""),
  // ความเห็นของเจ้าหน้าที่
  officerNote: z.string().trim().optional().default(""),
  isRoomAvailable: z.boolean().nullable().optional().default(null),
  officerSignName: z.string().trim().optional().default(""),
  officerReviewDate: z.string().trim().optional().default(""),
  // ความเห็นผู้อนุมัติ (เลขานุการสำนักงานคณบดีคณะพุทธศาสตร์)
  approverDecision: z.enum(["APPROVED", "REJECTED", "PENDING"]).default("PENDING"),
  approverSignName: z.string().trim().optional().default("พระครูปลัดสมเกียรติ กิตฺติญาโณ"),
  approverPosition: z.string().trim().optional().default("เลขานุการสำนักงานคณบดีคณะพุทธศาสตร์"),
  approverDate: z.string().trim().optional().default(""),
  // บันทึกเพิ่มเติม
  notes: z.string().trim().optional().default(""),
});

export type MeetingBookingMetadata = z.infer<typeof meetingBookingMetadataSchema>;

export function serializeBookingRemark(meta: Partial<MeetingBookingMetadata>): string {
  return JSON.stringify(meta);
}

export function parseBookingRemark(raw: string | null | undefined): MeetingBookingMetadata {
  const defaultMeta: MeetingBookingMetadata = {
    requestDate: "",
    requesterName: "",
    requesterPosition: "",
    requesterDepartment: "",
    requesterPhone: "",
    requesterEmail: "",
    purposeType: "MEETING",
    purposeOther: "",
    topic: "",
    startDate: "",
    startTimeStr: "",
    endDate: "",
    endTimeStr: "",
    attendeeCount: 1,
    equipments: {
      computer: false,
      ledDisplay: false,
      soundSystem: false,
      zoomOnline: false,
      other: "",
    },
    coordinatorName: "",
    coordinatorEmail: "",
    coordinatorPhone: "",
    officerNote: "",
    isRoomAvailable: null,
    officerSignName: "",
    officerReviewDate: "",
    approverDecision: "PENDING",
    approverSignName: "พระครูปลัดสมเกียรติ กิตฺติญาโณ",
    approverPosition: "เลขานุการสำนักงานคณบดีคณะพุทธศาสตร์",
    approverDate: "",
    notes: "",
  };

  if (!raw || !raw.trim()) {
    return defaultMeta;
  }
  try {
    const obj = JSON.parse(raw);
    if (typeof obj === "object" && obj !== null) {
      const parsed = meetingBookingMetadataSchema.safeParse(obj);
      if (parsed.success) {
        return parsed.data;
      }
      return { ...defaultMeta, ...obj };
    }
  } catch {
    // Legacy plain string fallback
    return {
      ...defaultMeta,
      notes: raw,
      topic: raw,
    };
  }
  return defaultMeta;
}

export const createOfficialBookingSchema = z.object({
  roomId: z.string().uuid("กรุณาเลือกห้องประชุม"),
  title: z.string().min(1, "กรุณาระบุเรื่องการประชุม").max(255),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  metadata: meetingBookingMetadataSchema
    .refine((m) => m.requesterName.trim().length > 0, {
      message: "กรุณากรอกชื่อผู้ขอใช้ห้อง",
      path: ["requesterName"],
    })
    .refine((m) => m.topic.trim().length > 0, {
      message: "กรุณาระบุเรื่องการประชุม",
      path: ["topic"],
    }),
  isAdminBypass: z.boolean().optional().default(false),
}).refine((data) => data.startTime < data.endTime, {
  message: "เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น",
  path: ["endTime"],
});

export type CreateOfficialBookingInput = z.infer<typeof createOfficialBookingSchema>;
