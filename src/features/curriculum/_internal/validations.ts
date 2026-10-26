import { z } from "zod";

export const departmentTypeEnum = z.enum(["DEPARTMENT", "PROGRAM", "DIVISION"]).default("DEPARTMENT");

export const departmentSchema = z.object({
  nameTh: z.string().min(1, "กรุณาระบุชื่อภาษาไทย"),
  nameEn: z.string().optional().nullable(),
  code: z.string().max(50).optional().nullable(),
  type: z.enum(["DEPARTMENT", "PROGRAM", "DIVISION"]).default("DEPARTMENT"),
  descriptionTh: z.string().optional().nullable(),
  descriptionEn: z.string().optional().nullable(),
  orderIndex: z.number().int().default(0),
});

export const updateDepartmentSchema = departmentSchema.partial();

export const curriculumSchema = z.object({
  nameTh: z.string().min(1, "กรุณาระบุชื่อหลักสูตรภาษาไทย"),
  nameEn: z.string().optional().nullable(),
  degree: z.enum(["BACHELOR", "MASTER", "DOCTORATE", "CERTIFICATE"]),
  durationYears: z.number().int().min(1).max(10).default(4),
  departmentId: z.string().uuid().optional().nullable(),
  descriptionTh: z.string().optional().nullable(),
  descriptionEn: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().or(z.literal("")).nullable(),
  isActive: z.boolean().default(true),
  orderIndex: z.number().int().default(0),
});

export const updateCurriculumSchema = curriculumSchema.partial();

export const timetableSlotSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).substring(2, 9)),
  dayOfWeek: z.number().int().min(1).max(7),
  startTime: z.string().min(1, "กรุณาระบุเวลาเริ่ม"),
  endTime: z.string().min(1, "กรุณาระบุเวลาสิ้นสุด"),
  courseCode: z.string().min(1, "กรุณาระบุรหัสวิชา"),
  courseName: z.string().min(1, "กรุณาระบุชื่อวิชา"),
  instructor: z.string().default(""),
  room: z.string().optional().nullable(),
  periodLabel: z.string().optional().nullable(),
  credits: z.number().int().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const timetableSchema = z.object({
  titleTh: z.string().min(1, "กรุณาระบุชื่อตารางสอน (ไทย)"),
  titleEn: z.string().optional().nullable(),
  curriculumId: z.string().uuid().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  academicYear: z.string().default("2569"),
  semester: z.number().int().default(1),
  yearLevel: z.number().int().min(1).max(8).default(1),
  room: z.string().optional().nullable(),
  termDates: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  scheduleData: z.array(timetableSlotSchema).default([]),
  isActive: z.boolean().default(true),
  orderIndex: z.number().int().default(0),
});

export const updateTimetableSchema = timetableSchema.partial();

export type DepartmentInput = z.infer<typeof departmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type CurriculumInput = z.infer<typeof curriculumSchema>;
export type UpdateCurriculumInput = z.infer<typeof updateCurriculumSchema>;
export type TimetableSlotInput = z.infer<typeof timetableSlotSchema>;
export type TimetableInput = z.infer<typeof timetableSchema>;
export type UpdateTimetableInput = z.infer<typeof updateTimetableSchema>;



export const masterCourseSchema = z.object({
  courseCode: z.string().min(1, "กรุณาระบุรหัสวิชา"),
  courseNameTh: z.string().min(1, "กรุณาระบุชื่อรายวิชา (ภาษาไทย)"),
  courseNameEn: z.string().optional().nullable(),
  credits: z.coerce.number().int().min(1).default(3),
  degreeLevel: z.enum(["BACHELOR", "MASTER", "DOCTORATE"]).default("BACHELOR"),
  departmentId: z.string().uuid().optional().nullable(),
  curriculumId: z.string().uuid().optional().nullable(),
  programLanguage: z.enum(["THAI", "ENGLISH"]).default("THAI"),
  instructor: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  orderIndex: z.coerce.number().int().default(0),
});

export const updateMasterCourseSchema = masterCourseSchema.partial();
export type MasterCourseInput = z.infer<typeof masterCourseSchema>;
export type UpdateMasterCourseInput = z.infer<typeof updateMasterCourseSchema>;

export const timetablePeriodConfigSchema = z.object({
  id: z.string().min(1, "กรุณาระบุรหัสคาบ"),
  periodNumber: z.coerce.number().int().default(1),
  labelTh: z.string().min(1, "กรุณาระบุชื่อคาบเรียน (ภาษาไทย)"),
  labelEn: z.string().min(1, "กรุณาระบุชื่อคาบเรียน (ภาษาอังกฤษ)"),
  subLabelTh: z.string().optional().nullable(),
  subLabelEn: z.string().optional().nullable(),
  startTime: z.string().min(1, "กรุณาระบุเวลาเริ่ม"),
  endTime: z.string().min(1, "กรุณาระบุเวลาสิ้นสุด"),
  type: z.enum(["CLASS", "BREAK"]).default("CLASS"),
  orderIndex: z.coerce.number().int().default(1),
});

export const timetablePeriodsArraySchema = z
  .array(timetablePeriodConfigSchema)
  .min(1, "ต้องมีคาบเรียนอย่างน้อย 1 รายการ");

export type TimetablePeriodConfig = z.infer<typeof timetablePeriodConfigSchema>;

export const DEFAULT_TIMETABLE_PERIODS: TimetablePeriodConfig[] = [
  {
    id: "period-1",
    periodNumber: 1,
    labelTh: "คาบที่ 1",
    labelEn: "Period 1",
    subLabelTh: "ช่วงเช้า (Morning)",
    subLabelEn: "Morning",
    startTime: "09.00",
    endTime: "11.30",
    type: "CLASS",
    orderIndex: 1,
  },
  {
    id: "period-break",
    periodNumber: 0,
    labelTh: "พักกลางวัน",
    labelEn: "Lunch Break",
    subLabelTh: "ฉันภัตตาหารเพล / พักเที่ยง",
    subLabelEn: "Lunch Break",
    startTime: "11.30",
    endTime: "13.00",
    type: "BREAK",
    orderIndex: 2,
  },
  {
    id: "period-2",
    periodNumber: 2,
    labelTh: "คาบที่ 2",
    labelEn: "Period 2",
    subLabelTh: "ช่วงบ่าย (Afternoon)",
    subLabelEn: "Afternoon",
    startTime: "12.30",
    endTime: "15.10",
    type: "CLASS",
    orderIndex: 3,
  },
  {
    id: "period-3",
    periodNumber: 3,
    labelTh: "คาบที่ 3",
    labelEn: "Period 3",
    subLabelTh: "ช่วงบ่าย (Afternoon)",
    subLabelEn: "Afternoon",
    startTime: "15.10",
    endTime: "17.00",
    type: "CLASS",
    orderIndex: 4,
  },
];
