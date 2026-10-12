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

