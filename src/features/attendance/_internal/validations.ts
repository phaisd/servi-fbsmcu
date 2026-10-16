import { z } from "zod";

export const courseSchema = z.object({
  courseCode: z.string().min(1, "กรุณาระบุรหัสวิชา").max(50),
  courseName: z.string().min(1, "กรุณาระบุชื่อวิชา").max(255),
  courseNameEn: z.string().max(255).optional().nullable(),
  credits: z.coerce.number().int().min(1).max(20).default(3),
  section: z.string().max(20).default("1"),
  term: z.string().min(1, "กรุณาระบุภาคการศึกษา เช่น 1/2569").max(50),
  academicYear: z.string().min(4).max(20).default("2569"),
  semester: z.coerce.number().int().min(1).max(3).default(1),
  description: z.string().optional().nullable(),
  targetSessions: z.coerce.number().int().min(1).max(40).default(16),
  room: z.string().max(100).optional().nullable(),
  dayOfWeek: z.coerce.number().int().min(1).max(7).optional().nullable(),
  startTime: z.string().max(20).optional().nullable(),
  endTime: z.string().max(20).optional().nullable(),
  status: z.enum(["ACTIVE", "ARCHIVED", "CANCELLED"]).default("ACTIVE"),
  primaryTeacherId: z.string().uuid().optional(),
  teacherIds: z.array(z.string().uuid()).optional(),
  calculationRules: z.object({
    lateCountsAsFull: z.boolean().default(true),
    excuseDeductsDenominator: z.boolean().default(false),
    minPercent: z.number().default(80.0),
  }).optional(),
});

export const updateCourseSchema = courseSchema.partial();

export const studentSchema = z.object({
  studentCode: z.string().min(1, "กรุณาระบุรหัสนิสิต").max(50),
  title: z.string().max(50).optional().nullable(),
  firstName: z.string().min(1, "กรุณาระบุชื่อ").max(100),
  lastName: z.string().min(1, "กรุณาระบุนามสกุล").max(100),
  yearLevel: z.coerce.number().int().min(1).max(8).default(1),
  department: z.string().max(255).optional().nullable(),
  faculty: z.string().max(255).default("คณะพุทธศาสตร์"),
  email: z.string().email("อีเมลไม่ถูกต้อง").optional().nullable().or(z.literal("")),
  phoneNumber: z.string().max(50).optional().nullable(),
});

export const updateStudentSchema = studentSchema.partial();

export const enrollStudentSchema = z.object({
  courseId: z.string().uuid(),
  studentCode: z.string().min(1, "กรุณาระบุรหัสนิสิต"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  title: z.string().optional().nullable(),
  yearLevel: z.coerce.number().int().optional(),
  department: z.string().optional().nullable(),
});

export const classSessionSchema = z.object({
  courseId: z.string().uuid(),
  sessionNumber: z.coerce.number().int().min(1),
  date: z.coerce.date(),
  startTime: z.string().max(20).optional().nullable(),
  endTime: z.string().max(20).optional().nullable(),
  room: z.string().max(100).optional().nullable(),
  topic: z.string().max(255).optional().nullable(),
  description: z.string().optional().nullable(),
  sessionType: z.enum(["REGULAR", "SPECIAL"]).default("REGULAR"),
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).default("SCHEDULED"),
  isCounted: z.boolean().default(true),
});

export const updateSessionSchema = classSessionSchema.partial().omit({ courseId: true });

export const attendanceRecordItemSchema = z.object({
  studentCode: z.string().min(1),
  studentName: z.string().min(1),
  enrollmentId: z.string().uuid().optional().nullable(),
  status: z.enum(["PENDING", "PRESENT", "ABSENT", "LATE", "EXCUSED"]),
  note: z.string().optional().nullable(),
});

export const batchAttendanceRecordSchema = z.object({
  sessionId: z.string().uuid(),
  records: z.array(attendanceRecordItemSchema),
  reason: z.string().optional().nullable(),
});

export const lockSessionSchema = z.object({
  sessionId: z.string().uuid(),
});

export const unlockSessionSchema = z.object({
  sessionId: z.string().uuid(),
  reason: z.string().min(3, "กรุณาระบุเหตุผลในการปลดล็อคอย่างน้อย 3 ตัวอักษร"),
});

export const assignTeacherSchema = z.object({
  courseId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(["PRIMARY_TEACHER", "CO_TEACHER", "TEACHING_ASSISTANT"]).default("CO_TEACHER"),
});

export const attendanceRecordSchema = z.object({
  sessionId: z.string().uuid(),
  studentCode: z.string().min(1).max(50),
  studentName: z.string().min(1).max(255),
  status: z.enum(["PENDING", "PRESENT", "ABSENT", "LATE", "EXCUSED"]),
  note: z.string().optional().nullable(),
});

export const attendanceClassSchema = courseSchema;
export const updateAttendanceClassSchema = updateCourseSchema;
export const attendanceSessionSchema = classSessionSchema;

export const syncTimetableSchema = z.object({
  timetableId: z.string().uuid(),
  selectedCourseCodes: z.array(z.string()).optional(),
});

