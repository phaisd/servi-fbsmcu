import "server-only";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma as db } from "@/shared/lib/infra/prisma";
import { writeAudit } from "@/features/identity/server";
import { AttendanceStatus, SessionStatus, SessionType, EnrollmentStatus, CourseStatus } from "@/generated/prisma";
import type { Prisma } from "@/generated/prisma";
import { calculateStudentEligibility, type StudentAttendanceSummary } from "./eligibility-engine";


// =========================================================================
// 1. COURSES & TEACHER ACCESS CHECK (OPTION B)
// =========================================================================

/**
 * ตรวจสอบว่าผู้ใช้มีสิทธิ์เข้าถึงหรือจัดการรายวิชานี้หรือไม่
 */
export async function assertCourseAccess(
  tenantId: string,
  courseId: string,
  userId: string,
  isSuperAdmin = false
): Promise<{ course: any; isTeacher: boolean; isPrimary: boolean; teacherRole: string }> {
  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      teachers: true,
      primaryTeacher: true,
    },
  });

  if (!course || course.tenantId !== tenantId) {
    throw new Error("NOT_FOUND: ไม่พบรายวิชาที่ระบุ");
  }

  if (isSuperAdmin) {
    return {
      course,
      isTeacher: true,
      isPrimary: true,
      teacherRole: "PRIMARY_TEACHER",
    };
  }

  const isPrimary = course.primaryTeacherId === userId;
  const teacherRecord = course.teachers.find((t: any) => t.userId === userId);
  const isAssigned = isPrimary || !!teacherRecord;

  if (!isAssigned) {
    throw new Error("FORBIDDEN: คุณไม่มีสิทธิ์จัดการหรือดูข้อมูลรายวิชานี้");
  }

  const teacherRole = isPrimary
    ? "PRIMARY_TEACHER"
    : (teacherRecord?.role || "CO_TEACHER");

  return { course, isTeacher: true, isPrimary, teacherRole };
}

/**
 * ดึงรายชื่ออาจารย์ทั้งหมดในระบบเพื่อใช้มอบหมายผู้สอน
 */
export async function getAvailableTeachers(tenantId: string) {
  return db.user.findMany({
    where: {
      isActive: true,
      userTenants: {
        some: {
          tenantId,
          isActive: true,
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: { name: "asc" },
  });
}

/**
 * ดึงรายชื่อผู้สอนที่ได้รับมอบหมายในวิชานี้
 */
export async function getCourseTeachers(tenantId: string, courseId: string) {
  return db.courseTeacher.findMany({
    where: { tenantId, courseId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  });
}

/**
 * มอบหมายผู้สอนร่วมหรือผู้ช่วยสอน
 */
export async function assignCourseTeacher(
  tenantId: string,
  actorId: string,
  courseId: string,
  data: {
    userId: string;
    role: "PRIMARY_TEACHER" | "CO_TEACHER" | "TEACHING_ASSISTANT";
  }
) {
  const course = await db.course.findUnique({
    where: { id: courseId },
    include: { teachers: true },
  });
  if (!course || course.tenantId !== tenantId) {
    throw new Error("NOT_FOUND: ไม่พบรายวิชา");
  }

  const isPrimary = data.role === "PRIMARY_TEACHER";

  const result = await db.$transaction(async (tx) => {
    if (isPrimary) {
      // ปรับอาจารย์คนเดิมให้ไม่ใช่ primary
      await tx.courseTeacher.updateMany({
        where: { courseId, isPrimary: true },
        data: { isPrimary: false, role: "CO_TEACHER" },
      });
      // อัปเดต primaryTeacherId ของ Course
      await tx.course.update({
        where: { id: courseId },
        data: { primaryTeacherId: data.userId },
      });
    }

    // Upsert ใน CourseTeacher
    return tx.courseTeacher.upsert({
      where: {
        courseId_userId: {
          courseId,
          userId: data.userId,
        },
      },
      create: {
        tenantId,
        courseId,
        userId: data.userId,
        role: data.role,
        isPrimary,
      },
      update: {
        role: data.role,
        isPrimary,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "course.teacher.assign",
    entity: "CourseTeacher",
    entityId: result.id,
    after: { courseId, userId: data.userId, role: data.role, isPrimary },
  });

  return result;
}

/**
 * ลบผู้สอนร่วมหรือผู้ช่วยสอนออกจากรายวิชา
 */
export async function removeCourseTeacher(
  tenantId: string,
  actorId: string,
  courseId: string,
  teacherUserId: string
) {
  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course || course.tenantId !== tenantId) {
    throw new Error("NOT_FOUND: ไม่พบรายวิชา");
  }

  if (course.primaryTeacherId === teacherUserId) {
    throw new Error(
      "CANNOT_REMOVE_PRIMARY: ไม่สามารถลบอาจารย์ผู้รับผิดชอบหลักได้ กรุณามอบหมายอาจารย์หลักท่านอื่นก่อน"
    );
  }

  await db.courseTeacher.deleteMany({
    where: { courseId, userId: teacherUserId },
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "course.teacher.remove",
    entity: "CourseTeacher",
    entityId: `${courseId}_${teacherUserId}`,
    after: { courseId, userId: teacherUserId },
  });

  return { success: true };
}

/**
 * ดึงรายการวิชา (Courses)
 */
export async function getCourses(
  tenantId: string,
  options?: {
    userId?: string;
    isSuperAdmin?: boolean;
    academicYear?: string;
    semester?: number;
    term?: string;
    status?: CourseStatus | "ALL";
    search?: string;
  }
) {
  const where: Prisma.CourseWhereInput = {
    tenantId,
    isActive: true,
  };

  if (options?.status && options.status !== "ALL") {
    where.status = options.status;
  }
  if (options?.term && options.term !== "ALL") {
    where.term = options.term;
  }
  if (options?.academicYear) where.academicYear = options.academicYear;
  if (options?.semester) where.semester = options.semester;
  if (options?.search) {
    where.OR = [
      { courseCode: { contains: options.search, mode: "insensitive" } },
      { courseName: { contains: options.search, mode: "insensitive" } },
    ];
  }

  // กรองตามบทบาทอาจารย์ (ไม่ใช่ Admin)
  if (options?.userId && !options.isSuperAdmin) {
    where.OR = [
      { primaryTeacherId: options.userId },
      { teachers: { some: { userId: options.userId } } },
    ];
  }

  return db.course.findMany({
    where,
    include: {
      primaryTeacher: { select: { id: true, name: true, email: true } },
      teachers: { include: { user: { select: { id: true, name: true, email: true } } } },
      _count: {
        select: {
          enrollments: true,
          sessions: true,
        },
      },
    },
    orderBy: [{ term: "desc" }, { createdAt: "desc" }],
  });
}

/**
 * ปิดภาคการศึกษา / สิ้นสุดการสอนของรายวิชา (Archive Course)
 */
export async function archiveCourse(tenantId: string, actorId: string, courseId: string) {
  const result = await db.course.update({
    where: { id: courseId },
    data: { status: CourseStatus.ARCHIVED },
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "course.archive",
    entity: "Course",
    entityId: courseId,
    after: { status: CourseStatus.ARCHIVED },
  });

  return result;
}

/**
 * เปิดใช้งานรายวิชาที่ปิดไปแล้วอีกครั้ง (Restore Course)
 */
export async function restoreCourse(tenantId: string, actorId: string, courseId: string) {
  const result = await db.course.update({
    where: { id: courseId },
    data: { status: CourseStatus.ACTIVE },
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "course.restore",
    entity: "Course",
    entityId: courseId,
    after: { status: CourseStatus.ACTIVE },
  });

  return result;
}

// นามแฝงความเข้ากันได้
export const getClasses = getCourses;

/**
 * ดึงข้อมูลรายวิชาเดี่ยวพร้อมรายละเอียด
 */
export async function getCourseDetail(tenantId: string, courseId: string, userId?: string, isSuperAdmin = false) {
  if (userId) {
    await assertCourseAccess(tenantId, courseId, userId, isSuperAdmin);
  }

  return db.course.findUnique({
    where: { id: courseId },
    include: {
      primaryTeacher: { select: { id: true, name: true, email: true } },
      teachers: { include: { user: { select: { id: true, name: true, email: true } } } },
      _count: {
        select: {
          enrollments: true,
          sessions: true,
        },
      },
    },
  });
}

export const getClassDetail = getCourseDetail;

/**
 * สร้างรายวิชาใหม่ พร้อมสร้าง 16 คาบเรียนตั้งต้นโดยอัตโนมัติ
 */
export async function createCourse(
  tenantId: string,
  actorId: string,
  data: {
    courseCode: string;
    courseName: string;
    courseNameEn?: string | null;
    credits?: number;
    section?: string;
    term: string;
    academicYear?: string;
    semester?: number;
    description?: string | null;
    targetSessions?: number;
    room?: string | null;
    dayOfWeek?: number | null;
    startTime?: string | null;
    endTime?: string | null;
    primaryTeacherId?: string;
    teacherIds?: string[];
  }
) {
  const primaryTeacherId = data.primaryTeacherId || actorId;
  const targetSessions = data.targetSessions || 16;

  const result = await db.$transaction(async (tx) => {
    // 1. สร้างวิชา (Course)
    const createdCourse = await tx.course.create({
      data: {
        tenantId,
        courseCode: data.courseCode,
        courseName: data.courseName,
        courseNameEn: data.courseNameEn,
        credits: data.credits || 3,
        section: data.section || "1",
        term: data.term,
        academicYear: data.academicYear || "2569",
        semester: data.semester || 1,
        description: data.description,
        targetSessions,
        room: data.room,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        primaryTeacherId,
      },
    });

    // 2. มอบหมายอาจารย์ผู้สอน
    await tx.courseTeacher.create({
      data: {
        tenantId,
        courseId: createdCourse.id,
        userId: primaryTeacherId,
        isPrimary: true,
        role: "TEACHER",
      },
    });

    if (data.teacherIds && data.teacherIds.length > 0) {
      for (const tId of data.teacherIds) {
        if (tId !== primaryTeacherId) {
          await tx.courseTeacher.create({
            data: {
              tenantId,
              courseId: createdCourse.id,
              userId: tId,
              isPrimary: false,
              role: "CO_TEACHER",
            },
          });
        }
      }
    }

    // 3. สร้าง 16 คาบเรียนมาตรฐานโดยอัตโนมัติ (ClassSession)
    const baseDate = new Date();
    baseDate.setHours(9, 0, 0, 0);
    for (let i = 1; i <= targetSessions; i++) {
      const sessionDate = new Date(baseDate);
      sessionDate.setDate(baseDate.getDate() + (i - 1) * 7);

      await tx.classSession.create({
        data: {
          tenantId,
          courseId: createdCourse.id,
          sessionNumber: i,
          date: sessionDate,
          startTime: data.startTime || "09.00",
          endTime: data.endTime || "11.30",
          room: data.room || "ห้องเรียนหลัก",
          topic: `คาบที่ ${i}: การบรรยายและกิจกรรมการเรียนรู้`,
          sessionType: SessionType.REGULAR,
          status: SessionStatus.SCHEDULED,
          isCounted: true,
        },
      });
    }

    return createdCourse;
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "course.create",
    entity: "Course",
    entityId: result.id,
    after: result,
  });

  return result;
}

export const createClass = createCourse;

/**
 * แก้ไขข้อมูลรายวิชา
 */
export async function updateCourse(
  tenantId: string,
  actorId: string,
  courseId: string,
  data: Partial<{
    courseCode: string;
    courseName: string;
    courseNameEn: string | null;
    credits: number;
    section: string;
    term: string;
    academicYear: string;
    semester: number;
    description: string | null;
    room: string | null;
    dayOfWeek: number | null;
    startTime: string | null;
    endTime: string | null;
    status: any;
    calculationRules: any;
    primaryTeacherId: string;
  }>
) {
  const before = await db.course.findUnique({ where: { id: courseId } });
  const result = await db.course.update({
    where: { id: courseId },
    data,
    include: {
      primaryTeacher: { select: { id: true, name: true, email: true } },
      teachers: { select: { user: { select: { name: true, email: true } }, isPrimary: true } },
      _count: { select: { enrollments: true, sessions: true } },
    },
  });

  if (data.primaryTeacherId) {
    await db.courseTeacher.upsert({
      where: {
        courseId_userId: {
          courseId,
          userId: data.primaryTeacherId,
        },
      },
      update: { isPrimary: true },
      create: {
        tenantId,
        courseId,
        userId: data.primaryTeacherId,
        isPrimary: true,
        role: "TEACHER",
      },
    });
  }

  await writeAudit({
    tenantId,
    actorId,
    action: "course.update",
    entity: "Course",
    entityId: courseId,
    before,
    after: result,
  });

  return result;
}

export const updateClass = updateCourse;

/**
 * ลบรายวิชาอย่างถาวร
 */
export async function deleteCourse(tenantId: string, actorId: string, courseId: string) {
  const before = await db.course.findUnique({
    where: { id: courseId },
    include: {
      _count: {
        select: { enrollments: true, sessions: true },
      },
    },
  });

  if (!before) {
    throw new Error("ไม่พบรายวิชาที่ต้องการลบ");
  }

  await db.course.delete({
    where: { id: courseId },
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "course.delete",
    entity: "Course",
    entityId: courseId,
    before,
    after: null,
  });

  return { success: true };
}

export const deleteClass = deleteCourse;

// =========================================================================
// 2. STUDENTS & COURSE ENROLLMENT MANAGEMENT
// =========================================================================

/**
 * ดึงรายชื่อนิสิตในวิชา (Enrollments)
 */
export async function getCourseStudents(tenantId: string, courseId: string) {
  return db.courseEnrollment.findMany({
    where: { tenantId, courseId, status: EnrollmentStatus.ENROLLED },
    include: {
      student: true,
    },
    orderBy: { student: { studentCode: "asc" } },
  });
}

export const getClassStudents = getCourseStudents;

/**
 * ลงทะเบียนนิสิตเข้าวิชา
 */
export async function enrollStudentInCourse(
  tenantId: string,
  actorId: string,
  courseId: string,
  studentData: {
    studentCode: string;
    firstName?: string;
    lastName?: string;
    title?: string | null;
    yearLevel?: number;
    department?: string | null;
    degree?: string | null;
    curriculumName?: string | null;
    major?: string | null;
    gender?: string | null;
    studyStatus?: string | null;
  }
) {
  const result = await db.$transaction(async (tx) => {
    // 1. ค้นหาหรือสร้างประวัตินิสิตในระบบ
    let student = await tx.student.findUnique({
      where: { tenantId_studentCode: { tenantId, studentCode: studentData.studentCode } },
    });

    if (!student) {
      if (!studentData.firstName || !studentData.lastName) {
        throw new Error("VALIDATION: นิสิตใหม่ต้องระบุชื่อและนามสกุล");
      }
      student = await tx.student.create({
        data: {
          tenantId,
          studentCode: studentData.studentCode,
          firstName: studentData.firstName,
          lastName: studentData.lastName,
          title: studentData.title,
          yearLevel: studentData.yearLevel || 1,
          department: studentData.department,
          degree: studentData.degree || "ปริญญาตรี",
          curriculumName: studentData.curriculumName,
          major: studentData.major,
          gender: studentData.gender,
          studyStatus: studentData.studyStatus || "ปกติ",
        },
      });
    } else {
      // อัปเดตข้อมูลนิสิตหากมีการระบุข้อมูลเพิ่มเติม
      student = await tx.student.update({
        where: { id: student.id },
        data: {
          ...(studentData.firstName ? { firstName: studentData.firstName } : {}),
          ...(studentData.lastName ? { lastName: studentData.lastName } : {}),
          ...(studentData.title !== undefined ? { title: studentData.title } : {}),
          ...(studentData.yearLevel ? { yearLevel: studentData.yearLevel } : {}),
          ...(studentData.department !== undefined ? { department: studentData.department } : {}),
          ...(studentData.degree !== undefined ? { degree: studentData.degree } : {}),
          ...(studentData.curriculumName !== undefined ? { curriculumName: studentData.curriculumName } : {}),
          ...(studentData.major !== undefined ? { major: studentData.major } : {}),
          ...(studentData.gender !== undefined ? { gender: studentData.gender } : {}),
          ...(studentData.studyStatus !== undefined ? { studyStatus: studentData.studyStatus } : {}),
        },
      });
    }

    // 2. ลงทะเบียนในรายวิชา
    const existingEnrollment = await tx.courseEnrollment.findUnique({
      where: { courseId_studentId: { courseId, studentId: student.id } },
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === EnrollmentStatus.ENROLLED) {
        throw new Error("DUPLICATE: นิสิตผู้นี้ลงทะเบียนในรายวิชานี้อยู่แล้ว");
      }
      return tx.courseEnrollment.update({
        where: { id: existingEnrollment.id },
        data: { status: EnrollmentStatus.ENROLLED },
        include: { student: true },
      });
    }

    return tx.courseEnrollment.create({
      data: {
        tenantId,
        courseId,
        studentId: student.id,
        status: EnrollmentStatus.ENROLLED,
      },
      include: { student: true },
    });
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "course.enrollment.create",
    entity: "CourseEnrollment",
    entityId: result.id,
    after: result,
  });

  return result;
}

export const enrollStudent = enrollStudentInCourse;

/**
 * ลบนิสิตออกจากรายวิชา
 */
export async function removeStudentFromCourse(
  tenantId: string,
  actorId: string,
  courseId: string,
  enrollmentId: string
) {
  const enrollment = await db.courseEnrollment.findUnique({
    where: { id: enrollmentId },
    include: { _count: { select: { records: true } } },
  });

  if (!enrollment || enrollment.courseId !== courseId) {
    throw new Error("NOT_FOUND: ไม่พบข้อมูลการลงทะเบียน");
  }

  let result;
  if (enrollment._count.records > 0) {
    result = await db.courseEnrollment.update({
      where: { id: enrollmentId },
      data: { status: EnrollmentStatus.DROPPED },
    });
  } else {
    result = await db.courseEnrollment.delete({
      where: { id: enrollmentId },
    });
  }

  await writeAudit({
    tenantId,
    actorId,
    action: "course.enrollment.remove",
    entity: "CourseEnrollment",
    entityId: enrollmentId,
    before: enrollment,
  });

  return result;
}

export const removeStudentFromClass = removeStudentFromCourse;

/**
 * นำเข้ารายชื่อนิสิตแบบกลุ่ม (Batch Import)
 */
export async function batchEnrollStudents(
  tenantId: string,
  actorId: string,
  courseId: string,
  students: Array<{
    studentCode: string;
    firstName: string;
    lastName: string;
    title?: string;
    yearLevel?: number;
    department?: string;
    degree?: string;
    curriculumName?: string;
    major?: string;
    gender?: string;
    studyStatus?: string;
  }>
) {
  let successCount = 0;
  const errors: string[] = [];

  for (const item of students) {
    try {
      if (!item.studentCode || !item.firstName || !item.lastName) {
        errors.push(`ข้อมูลไม่ครบถ้วน: ${item.studentCode || "ไม่ระบุรหัส"}`);
        continue;
      }
      await enrollStudentInCourse(tenantId, actorId, courseId, item);
      successCount++;
    } catch (err: any) {
      if (!err.message?.includes("DUPLICATE")) {
        errors.push(`${item.studentCode}: ${err.message}`);
      }
    }
  }

  return { successCount, errors };
}

// =========================================================================
// 3. SESSIONS MANAGEMENT (CLASS SESSIONS)
// =========================================================================

export async function getCourseSessions(tenantId: string, courseId: string) {
  return db.classSession.findMany({
    where: { tenantId, courseId },
    orderBy: { sessionNumber: "asc" },
    include: {
      _count: { select: { records: true } },
    },
  });
}

export const getSessions = getCourseSessions;

export async function getSessionDetail(tenantId: string, sessionId: string) {
  const session = await db.classSession.findUnique({
    where: { id: sessionId },
    include: {
      course: {
        include: {
          teachers: true,
          primaryTeacher: true,
        },
      },
      auditLogs: {
        orderBy: { createdAt: "desc" },
      },
      records: {
        orderBy: { studentCode: "asc" },
      },
    },
  });

  if (!session) return null;

  return {
    ...session,
    classObj: session.course, // alias สำหรับความเข้ากันได้
  };
}

/**
 * เพิ่มคาบเรียนใหม่
 */
export async function createClassSession(
  tenantId: string,
  actorId: string,
  data: {
    courseId: string;
    sessionNumber?: number;
    date: Date;
    startTime?: string | null;
    endTime?: string | null;
    room?: string | null;
    topic?: string | null;
    description?: string | null;
    sessionType?: SessionType;
    isCounted?: boolean;
  }
) {
  let sessionNumber = data.sessionNumber;
  if (!sessionNumber) {
    const lastSession = await db.classSession.findFirst({
      where: { courseId: data.courseId },
      orderBy: { sessionNumber: "desc" },
    });
    sessionNumber = (lastSession?.sessionNumber || 0) + 1;
  }

  const result = await db.classSession.create({
    data: {
      tenantId,
      courseId: data.courseId,
      sessionNumber,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      room: data.room,
      topic: data.topic,
      description: data.description,
      sessionType: data.sessionType || SessionType.REGULAR,
      status: SessionStatus.SCHEDULED,
      isCounted: data.isCounted ?? true,
    },
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "class_session.create",
    entity: "ClassSession",
    entityId: result.id,
    after: result,
  });

  return result;
}

export const createSession = createClassSession;

/**
 * แก้ไขคาบเรียน
 */
export async function updateClassSession(
  tenantId: string,
  actorId: string,
  sessionId: string,
  data: Partial<{
    sessionNumber: number;
    date: Date;
    startTime: string | null;
    endTime: string | null;
    room: string | null;
    topic: string | null;
    description: string | null;
    sessionType: SessionType;
    status: SessionStatus;
    isCounted: boolean;
  }>
) {
  const before = await db.classSession.findUnique({ where: { id: sessionId } });
  const result = await db.classSession.update({
    where: { id: sessionId },
    data,
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "class_session.update",
    entity: "ClassSession",
    entityId: sessionId,
    before,
    after: result,
  });

  return result;
}

export const updateSession = updateClassSession;

/**
 * ลบคาบเรียน (Delete Class Session)
 */
export async function deleteClassSession(tenantId: string, actorId: string, sessionId: string) {
  const session = await db.classSession.findUnique({
    where: { id: sessionId },
    include: { _count: { select: { records: true } } },
  });

  if (!session || session.tenantId !== tenantId) {
    throw new Error("NOT_FOUND: ไม่พบคาบเรียนที่ต้องการลบ");
  }

  if (session.isLocked) {
    throw new Error("LOCKED: คาบเรียนนี้ถูกปิดและล็อคแล้ว ไม่สามารถลบได้ (กรุณาปลดล็อคก่อนหรือเปลี่ยนสถานะเป็นยกเลิกคาบ)");
  }

  await db.$transaction(async (tx) => {
    await tx.attendanceAuditLog.deleteMany({ where: { sessionId } });
    await tx.attendanceRecord.deleteMany({ where: { sessionId } });
    await tx.classSession.delete({ where: { id: sessionId } });
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "class_session.delete",
    entity: "ClassSession",
    entityId: sessionId,
    before: session,
  });

  return { success: true, id: sessionId, sessionNumber: session.sessionNumber };
}

export const deleteSession = deleteClassSession;

// =========================================================================
// 3.1 DYNAMIC TIME-BASED ROLLING QR CODE CHECK-IN
// =========================================================================

export async function getOrCreateSessionQrSecret(tenantId: string, sessionId: string) {
  const session = await db.classSession.findUnique({ where: { id: sessionId } });
  if (!session || session.tenantId !== tenantId) {
    throw new Error("NOT_FOUND: ไม่พบคาบเรียน");
  }
  if (session.qrCodeSecret) {
    return session.qrCodeSecret;
  }
  const secret = crypto.randomBytes(16).toString("hex");
  await db.classSession.update({
    where: { id: sessionId },
    data: { qrCodeSecret: secret },
  });
  return secret;
}

export function computeQrToken(secret: string, sessionId: string, step: number): string {
  return crypto.createHmac("sha256", secret).update(`${sessionId}:${step}`).digest("hex").slice(0, 16);
}

/**
 * สร้าง Token สำหรับ Dynamic Rolling QR Code ที่เปลี่ยนทุก 20 วินาที
 */
export async function generateRollingQrToken(tenantId: string, sessionId: string) {
  const secret = await getOrCreateSessionQrSecret(tenantId, sessionId);
  const now = Date.now();
  const stepTimeMs = 20000; // 20 วินาที
  const step = Math.floor(now / stepTimeMs);
  const token = computeQrToken(secret, sessionId, step);
  const expiresAt = (step + 1) * stepTimeMs;
  const remainingSeconds = Math.max(0, Math.ceil((expiresAt - now) / 1000));

  return {
    token,
    step,
    expiresAt,
    remainingSeconds,
    stepTimeSeconds: 20,
  };
}

/**
 * ดึงรายการนิสิตที่เช็กชื่อแล้วแบบ Real-time สำหรับหน้าจออาจารย์
 */
export async function getSessionScannedStudents(tenantId: string, sessionId: string) {
  const session = await db.classSession.findUnique({
    where: { id: sessionId },
    include: {
      course: {
        include: {
          enrollments: {
            where: { status: EnrollmentStatus.ENROLLED },
            include: { student: true },
          },
        },
      },
      records: {
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!session || session.tenantId !== tenantId) {
    throw new Error("NOT_FOUND: ไม่พบคาบเรียน");
  }

  const totalEnrolled = session.course.enrollments.length;
  const presentRecords = session.records.filter((r) => r.status === AttendanceStatus.PRESENT);
  const lateRecords = session.records.filter((r) => r.status === AttendanceStatus.LATE);
  const absentRecords = session.records.filter((r) => r.status === AttendanceStatus.ABSENT);
  const excusedRecords = session.records.filter((r) => r.status === AttendanceStatus.EXCUSED);
  const pendingRecords = session.records.filter((r) => r.status === AttendanceStatus.PENDING);

  return {
    sessionId,
    totalEnrolled,
    presentCount: presentRecords.length,
    lateCount: lateRecords.length,
    absentCount: absentRecords.length,
    excusedCount: excusedRecords.length,
    pendingCount: pendingRecords.length,
    records: session.records.map((r) => ({
      studentCode: r.studentCode,
      studentName: r.studentName,
      status: r.status,
      note: r.note,
      updatedAt: r.updatedAt,
    })),
  };
}

/**
 * ตรวจสอบ Token และบันทึกเช็กชื่อนิสิตผ่าน QR Code
 */
export async function verifyAndCheckInWithQr(params: {
  sessionId: string;
  studentCode: string;
  token: string;
  step?: number;
}) {
  const session = await db.classSession.findUnique({
    where: { id: params.sessionId },
    include: {
      course: {
        include: {
          enrollments: {
            where: { status: EnrollmentStatus.ENROLLED },
            include: { student: true },
          },
        },
      },
    },
  });

  if (!session) {
    throw new Error("NOT_FOUND: ไม่พบคาบเรียนนี้");
  }
  if (session.isLocked) {
    throw new Error("LOCKED: คาบเรียนนี้ถูกปิดการเช็กชื่อแล้ว");
  }
  if (session.status === SessionStatus.CANCELLED) {
    throw new Error("CANCELLED: คาบเรียนนี้ถูกยกเลิกแล้ว");
  }
  if (!session.qrCodeSecret) {
    throw new Error("EXPIRED: รหัส QR Code ยังไม่ถูกเปิดใช้งานหรือหมดอายุแล้ว");
  }

  // ตรวจสอบความถูกต้องของ Token (อนุญาตช่วง step ปัจจุบัน และ step - 1 สำหรับ latency เครือข่าย)
  const currentStep = Math.floor(Date.now() / 20000);
  const validTokenCurrent = computeQrToken(session.qrCodeSecret, session.id, currentStep);
  const validTokenPrev = computeQrToken(session.qrCodeSecret, session.id, currentStep - 1);

  if (params.token !== validTokenCurrent && params.token !== validTokenPrev) {
    throw new Error("EXPIRED: รหัส QR Code หมดอายุแล้ว กรุณาสแกนรหัสใหม่จากหน้าจออาจารย์");
  }

  // ตรวจสอบว่านิสิตอยู่ในรายชื่อวิชานี้หรือไม่
  const cleanCode = params.studentCode.trim().toLowerCase();
  const enrollment = session.course.enrollments.find(
    (e) => e.student.studentCode.trim().toLowerCase() === cleanCode
  );

  if (!enrollment) {
    throw new Error(`NOT_ENROLLED: ไม่พบรหัสนิสิต "${params.studentCode}" ในรายชื่อผู้ลงทะเบียนวิชานี้`);
  }

  const studentName = `${enrollment.student.title || ""} ${enrollment.student.firstName} ${enrollment.student.lastName}`.trim();

  // บันทึกหรืออัปเดต AttendanceRecord เป็น PRESENT
  const checkInTime = new Intl.DateTimeFormat("th-TH", {
    timeStyle: "short",
  }).format(new Date());

  const existingRecord = await db.attendanceRecord.findUnique({
    where: {
      sessionId_studentCode: {
        sessionId: session.id,
        studentCode: enrollment.student.studentCode,
      },
    },
  });

  const record = await db.attendanceRecord.upsert({
    where: {
      sessionId_studentCode: {
        sessionId: session.id,
        studentCode: enrollment.student.studentCode,
      },
    },
    create: {
      tenantId: session.tenantId,
      sessionId: session.id,
      studentCode: enrollment.student.studentCode,
      studentName,
      status: AttendanceStatus.PRESENT,
      note: `เช็กชื่อผ่าน QR Code (${checkInTime} น.)`,
    },
    update: {
      status: AttendanceStatus.PRESENT,
      note: `เช็กชื่อผ่าน QR Code (${checkInTime} น.)`,
    },
  });

  return {
    success: true,
    studentCode: enrollment.student.studentCode,
    studentName,
    courseCode: session.course.courseCode,
    courseName: session.course.courseName,
    sessionNumber: session.sessionNumber,
    checkInTime,
    alreadyCheckedIn: existingRecord?.status === AttendanceStatus.PRESENT,
  };
}

/**
 * ดึงข้อมูลสรุปคาบเรียนสำหรับการสแกนของนิสิต (Public Safe)
 */
export async function getPublicSessionForCheckIn(sessionId: string) {
  const session = await db.classSession.findUnique({
    where: { id: sessionId },
    include: {
      course: {
        select: {
          id: true,
          courseCode: true,
          courseName: true,
          term: true,
        },
      },
    },
  });

  if (!session) return null;

  return {
    id: session.id,
    sessionNumber: session.sessionNumber,
    date: session.date,
    startTime: session.startTime,
    endTime: session.endTime,
    room: session.room,
    topic: session.topic,
    isLocked: session.isLocked,
    status: session.status,
    course: session.course,
  };
}

// =========================================================================
// 4. ATTENDANCE TAKING & BATCH SAVING
// =========================================================================

export async function getRecords(tenantId: string, sessionId: string) {
  return db.attendanceRecord.findMany({
    where: { tenantId, sessionId },
    orderBy: { studentCode: "asc" },
  });
}

export async function lockSession(
  tenantId: string,
  actorId: string,
  actorName: string,
  sessionId: string
) {
  const session = await db.classSession.findUnique({ where: { id: sessionId } });
  if (!session || session.tenantId !== tenantId) {
    throw new Error("NOT_FOUND: ไม่พบคาบเรียน");
  }

  const updated = await db.classSession.update({
    where: { id: sessionId },
    data: {
      isLocked: true,
      lockedAt: new Date(),
      lockedBy: actorName,
      status: SessionStatus.COMPLETED,
    },
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "attendance.session.lock",
    entity: "ClassSession",
    entityId: sessionId,
    after: { isLocked: true, lockedBy: actorName },
  });

  return updated;
}

export async function unlockSession(
  tenantId: string,
  actorId: string,
  actorName: string,
  sessionId: string,
  reason: string
) {
  const session = await db.classSession.findUnique({ where: { id: sessionId } });
  if (!session || session.tenantId !== tenantId) {
    throw new Error("NOT_FOUND: ไม่พบคาบเรียน");
  }

  const updated = await db.classSession.update({
    where: { id: sessionId },
    data: {
      isLocked: false,
      lockedAt: null,
      lockedBy: null,
    },
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "attendance.session.unlock",
    entity: "ClassSession",
    entityId: sessionId,
    after: { isLocked: false, reason },
  });

  return updated;
}

export async function getSessionAuditLogs(tenantId: string, sessionId: string) {
  return db.attendanceAuditLog.findMany({
    where: { tenantId, sessionId },
    orderBy: { createdAt: "desc" },
  });
}

export async function batchSaveAttendance(
  tenantId: string,
  actorId: string,
  actorName: string,
  sessionId: string,
  records: Array<{
    studentCode: string;
    studentName: string;
    enrollmentId?: string | null;
    status: AttendanceStatus;
    note?: string | null;
  }>,
  reason?: string | null
) {
  const session = await db.classSession.findUnique({
    where: { id: sessionId },
    include: { records: true },
  });
  if (!session || session.tenantId !== tenantId) {
    throw new Error("NOT_FOUND: ไม่พบคาบเรียน");
  }

  // หากคาบเรียนถูกปิดและล็อคไว้ ต้องระบุเหตุผลในการแก้ไข
  if (session.isLocked && (!reason || reason.trim().length === 0)) {
    throw new Error("LOCKED_SESSION: คาบเรียนนี้ถูกปิดและล็อคแล้ว กรุณาระบุเหตุผลความจำเป็นในการแก้ไขผลการเข้าเรียน");
  }

  // สร้างแผนที่ข้อมูลสถานะเดิมเพื่อบันทึก Audit Log หากมีการเปลี่ยนแปลง
  const oldRecordsMap = new Map<string, AttendanceStatus>();
  for (const r of session.records) {
    oldRecordsMap.set(r.studentCode, r.status);
  }

  const result = await db.$transaction(async (tx) => {
    const savedRecords = [];
    const auditLogsToInsert = [];

    for (const r of records) {
      const oldStatus = oldRecordsMap.get(r.studentCode);
      // หากคาบถูกล็อค หรือมีการส่งเหตุผลแก้ไข และสถานะเปลี่ยนไปจากเดิม -> บันทึกเข้าตาราง attendance_audit_logs
      if ((session.isLocked || reason) && oldStatus && oldStatus !== r.status) {
        auditLogsToInsert.push({
          tenantId,
          sessionId,
          studentCode: r.studentCode,
          studentName: r.studentName,
          oldStatus,
          newStatus: r.status,
          reason: (reason || "แก้ไขผลการเข้าเรียน").trim(),
          actorId,
          actorName,
        });
      }

      const saved = await tx.attendanceRecord.upsert({
        where: {
          sessionId_studentCode: {
            sessionId,
            studentCode: r.studentCode,
          },
        },
        create: {
          tenantId,
          sessionId,
          enrollmentId: r.enrollmentId,
          studentCode: r.studentCode,
          studentName: r.studentName,
          status: r.status,
          note: r.note,
          recordedBy: actorName,
        },
        update: {
          enrollmentId: r.enrollmentId,
          studentName: r.studentName,
          status: r.status,
          note: r.note,
          recordedBy: actorName,
        },
      });
      savedRecords.push(saved);
    }

    if (auditLogsToInsert.length > 0) {
      await tx.attendanceAuditLog.createMany({
        data: auditLogsToInsert,
      });
    }

    // ปรับสถานะคาบเรียนเป็น COMPLETED เมื่อมีการบันทึกผล
    await tx.classSession.update({
      where: { id: sessionId },
      data: { status: SessionStatus.COMPLETED },
    });

    return savedRecords;
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "attendance.record.batch_save",
    entity: "ClassSession",
    entityId: sessionId,
    after: { count: records.length, wasLocked: session.isLocked, reason },
  });

  return result;
}

// =========================================================================
// 5. ELIGIBILITY & ATTENDANCE REPORTS (OPTION B)
// =========================================================================

export async function getCourseEligibilityReport(
  tenantId: string,
  courseId: string,
  userId?: string,
  isSuperAdmin = false
): Promise<{
  course: any;
  summaries: StudentAttendanceSummary[];
  stats: {
    totalStudents: number;
    eligibleCount: number;
    ineligibleCount: number;
    undeterminedCount: number;
    conductedSessions: number;
    totalSessions: number;
    averageAttendanceRate: number;
  };
}> {
  if (userId) {
    await assertCourseAccess(tenantId, courseId, userId, isSuperAdmin);
  }

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      primaryTeacher: true,
      teachers: { include: { user: true } },
      sessions: {
        orderBy: { sessionNumber: "asc" },
      },
      enrollments: {
        where: { status: EnrollmentStatus.ENROLLED },
        include: {
          student: true,
          records: {
            include: { session: true },
          },
        },
      },
    },
  });

  if (!course) throw new Error("NOT_FOUND: ไม่พบรายวิชา");

  const scheduledCountedSessions = course.sessions.filter(
    (s: any) => s.isCounted && s.status !== SessionStatus.CANCELLED
  ).length;

  const conductedCountedSessions = course.sessions.filter(
    (s: any) =>
      s.isCounted &&
      (s.status === SessionStatus.COMPLETED || s.status === SessionStatus.IN_PROGRESS)
  ).length;

  const rules = (course.calculationRules as any) || {};

  const summaries: StudentAttendanceSummary[] = course.enrollments.map((enr: any) => {
    const formattedRecords = enr.records.map((r: any) => ({
      status: r.status,
      isCountedSession: r.session.isCounted,
      sessionStatus: r.session.status,
    }));

    return calculateStudentEligibility({
      studentId: enr.student.id,
      enrollmentId: enr.id,
      studentCode: enr.student.studentCode,
      studentName: `${enr.student.title || ""} ${enr.student.firstName} ${enr.student.lastName}`.trim(),
      yearLevel: enr.student.yearLevel,
      department: enr.student.department,
      records: formattedRecords,
      totalScheduledCountedSessions: scheduledCountedSessions,
      totalConductedCountedSessions: conductedCountedSessions,
      rules,
    });
  });

  let eligible = 0;
  let ineligible = 0;
  let undetermined = 0;
  let sumPercentage = 0;

  for (const s of summaries) {
    if (s.isEligible === true) eligible++;
    else if (s.isEligible === false) ineligible++;
    else undetermined++;

    if (s.hasEnoughData) sumPercentage += s.percentage;
  }

  const evaluatedStudentCount = summaries.filter((s) => s.hasEnoughData).length;
  const averageRate = evaluatedStudentCount > 0 ? sumPercentage / evaluatedStudentCount : 0;

  return {
    course,
    summaries,
    stats: {
      totalStudents: summaries.length,
      eligibleCount: eligible,
      ineligibleCount: ineligible,
      undeterminedCount: undetermined,
      conductedSessions: conductedCountedSessions,
      totalSessions: scheduledCountedSessions,
      averageAttendanceRate: Number(averageRate.toFixed(2)),
    },
  };
}

export const getClassEligibilityReport = async (tenantId: string, classId: string, userId?: string, isSuperAdmin = false) => {
  const rep = await getCourseEligibilityReport(tenantId, classId, userId, isSuperAdmin);
  return {
    ...rep,
    classObj: rep.course,
  };
};

// =========================================================================
// 6. DASHBOARD AGGREGATIONS
// =========================================================================

export async function getAttendanceDashboardData(
  tenantId: string,
  userId: string,
  isSuperAdmin = false
) {
  // ดึงรายวิชาที่อาจารย์รับผิดชอบ (หรือทั้งหมดหากเป็น Super Admin)
  const courses = await getCourses(tenantId, { userId, isSuperAdmin });
  const courseIds = courses.map((c) => c.id);

  if (courseIds.length === 0) {
    return {
      coursesCount: 0,
      totalStudents: 0,
      todaySessions: [],
      upcomingSessions: [],
      atRiskStudents: [],
      recentCompletedSessions: [],
      courses: [],
      stats: {
        averageAttendanceRate: 100,
        atRiskCount: 0,
        conductedSessionsCount: 0,
        totalSessionsCount: 0,
      },
    };
  }

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const allSessions = await db.classSession.findMany({
    where: {
      tenantId,
      courseId: { in: courseIds },
    },
    include: {
      course: {
        select: {
          id: true,
          courseCode: true,
          courseName: true,
          section: true,
          term: true,
        },
      },
      _count: {
        select: { records: true },
      },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  // คาบเรียนวันนี้
  const todaySessions = allSessions.filter((s) => {
    const sDate = new Date(s.date);
    return sDate >= startOfDay && sDate <= endOfDay;
  });

  // คาบเรียนที่กำลังจะมาถึง (ที่ยัง SCHEDULED อยู่)
  const upcomingSessions = allSessions.filter((s) => {
    return s.status === SessionStatus.SCHEDULED;
  }).slice(0, 8);

  // คาบเรียนที่เพิ่งบันทึกผลเสร็จ (ล่าสุด 6 คาบ)
  const recentCompletedSessions = allSessions
    .filter((s) => s.status === SessionStatus.COMPLETED)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  // คำนวณนิสิตกลุ่มเสี่ยง (< 80%) จากทุกวิชา
  const atRiskStudents: Array<{
    studentId: string;
    studentCode: string;
    studentName: string;
    courseId: string;
    courseCode: string;
    courseName: string;
    percentage: number;
    absentCount: number;
    totalConducted: number;
    totalScheduled: number;
    isEligible: boolean | null;
  }> = [];

  let totalStudentEnrollments = 0;
  let totalPercentages = 0;
  let evaluatedCount = 0;

  for (const c of courses) {
    try {
      const report = await getCourseEligibilityReport(tenantId, c.id, userId, isSuperAdmin);
      totalStudentEnrollments += report.stats.totalStudents;

      for (const st of report.summaries) {
        if (st.hasEnoughData) {
          totalPercentages += st.percentage;
          evaluatedCount++;
        }

        // เสี่ยงหมดสิทธิ์สอบ: เปอร์เซ็นต์ต่ำกว่า 80% หรือหมดสิทธิ์แล้ว
        if (st.hasEnoughData && (st.percentage < 80.0 || st.isEligible === false)) {
          atRiskStudents.push({
            studentId: st.studentId,
            studentCode: st.studentCode,
            studentName: st.studentName,
            courseId: c.id,
            courseCode: c.courseCode,
            courseName: c.courseName,
            percentage: st.percentage,
            absentCount: st.absentCount,
            totalConducted: st.evaluatedCount,
            totalScheduled: st.totalCourseSessions,
            isEligible: st.isEligible,
          });
        }
      }
    } catch {
      // ข้ามวิชาที่มีปัญหา
    }
  }

  // เรียงลำดับนิสิตกลุ่มเสี่ยงจากเปอร์เซ็นต์น้อยสุดขึ้นมา
  atRiskStudents.sort((a, b) => a.percentage - b.percentage);

  const averageAttendanceRate = evaluatedCount > 0 ? totalPercentages / evaluatedCount : 100;
  const conductedSessionsCount = allSessions.filter((s) => s.status === SessionStatus.COMPLETED).length;

  return {
    coursesCount: courses.length,
    totalStudents: totalStudentEnrollments,
    todaySessions,
    upcomingSessions,
    recentCompletedSessions,
    courses,
    atRiskStudents: atRiskStudents.slice(0, 15),
    stats: {
      averageAttendanceRate: Number(averageAttendanceRate.toFixed(2)),
      atRiskCount: atRiskStudents.length,
      conductedSessionsCount,
      totalSessionsCount: allSessions.length,
    },
  };
}

// =========================================================================
// 8. TIMETABLE-TO-COURSE SYNC & AUTO-PROVISIONING TEACHER ACCOUNTS
// =========================================================================

/**
 * สุ่มรหัสผ่านปลอดภัยสำหรับอาจารย์ผู้สอนเริ่มต้น (ความยาว 10 ตัวอักษร ผสมตัวพิมพ์ใหญ่ เล็ก ตัวเลข และอักขระพิเศษ)
 */
export function generateRandomTeacherPassword(length = 10): string {
  const uppers = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lowers = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "@#$%&*!";
  const all = uppers + lowers + digits + symbols;

  let pass = "";
  pass += uppers[crypto.randomInt(uppers.length)];
  pass += lowers[crypto.randomInt(lowers.length)];
  pass += digits[crypto.randomInt(digits.length)];
  pass += symbols[crypto.randomInt(symbols.length)];

  for (let i = pass.length; i < length; i++) {
    pass += all[crypto.randomInt(all.length)];
  }

  return pass
    .split("")
    .sort(() => crypto.randomInt(3) - 1)
    .join("");
}

/**
 * แยกชื่ออาจารย์ผู้รับผิดชอบหลักและผู้ร่วมสอนจากข้อมูลในตารางเรียน
 * ดอกจัน (*) บ่งบอกอาจารย์ผู้รับผิดชอบหลัก หากไม่มีดอกจัน ให้คนแรกเป็นอาจารย์หลัก
 */
export function parseInstructorsFromSlot(
  raw: string | undefined | null
): Array<{ name: string; isPrimary: boolean }> {
  if (!raw || !raw.trim()) {
    return [{ name: "อาจารย์ผู้สอน", isPrimary: true }];
  }

  const parts = raw
    .split(/[\/\n]/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (parts.length === 0) {
    return [{ name: "อาจารย์ผู้สอน", isPrimary: true }];
  }

  const hasExplicitPrimary = parts.some((p) => p.includes("*"));

  return parts.map((part, index) => {
    const isPrimary = hasExplicitPrimary ? part.includes("*") : index === 0;
    const cleanName = part.replace(/\*/g, "").trim();
    return {
      name: cleanName,
      isPrimary,
    };
  });
}

/**
 * คำนวณวันแรกของคาบเรียนตามวันในสัปดาห์ (1=จันทร์..7=อาทิตย์)
 */
function getFirstSessionDate(dayOfWeek: number, _termDatesStr?: string | null): Date {
  const targetJsDay = dayOfWeek === 7 ? 0 : dayOfWeek;
  const startDate = new Date();
  startDate.setHours(9, 0, 0, 0);

  const currentJsDay = startDate.getDay();
  let daysDiff = targetJsDay - currentJsDay;
  if (daysDiff <= 0) {
    daysDiff += 7;
  }
  startDate.setDate(startDate.getDate() + daysDiff);
  return startDate;
}

/**
 * ค้นหาหรือสร้างบัญชีผู้ใช้งานอาจารย์ (Auto-Provisioning)
 */
async function findOrCreateTeacherUser(
  tenantId: string,
  teacherName: string,
  academicYear: string,
  runningCounter: { value: number }
): Promise<{ user: any; isNew: boolean; plainPassword?: string; email: string }> {
  const cleanName = teacherName.trim();

  // 1. ตรวจสอบว่ามีผู้ใช้นี้อยู่แล้วหรือไม่
  const existingUser = await db.user.findFirst({
    where: {
      name: { equals: cleanName, mode: "insensitive" },
    },
  });

  if (existingUser) {
    // ผูก User เข้ากับ Tenant หากยังไม่ได้ผูก
    const userTenant = await db.userTenant.upsert({
      where: { userId_tenantId: { userId: existingUser.id, tenantId } },
      update: { isActive: true },
      create: { userId: existingUser.id, tenantId, isActive: true },
    });

    // มอบหมายบทบาท TEACHER
    const teacherRole = await db.role.findFirst({
      where: { tenantId, code: "TEACHER" },
    });
    if (teacherRole) {
      const existingUserRole = await db.userRole.findFirst({
        where: { userTenantId: userTenant.id, roleId: teacherRole.id },
      });
      if (!existingUserRole) {
        await db.userRole.create({
          data: {
            userTenantId: userTenant.id,
            roleId: teacherRole.id,
            scopeType: "ALL",
          },
        });
      }
    }

    return {
      user: existingUser,
      isNew: false,
      email: existingUser.email,
    };
  }

  // 2. สร้างบัญชีใหม่พร้อมรหัสผ่านสุ่มปลอดภัย
  const yearCode = academicYear ? academicYear.slice(-2) : "69";
  let targetEmail = "";
  let isUnique = false;

  while (!isUnique) {
    const seqStr = String(runningCounter.value++).padStart(3, "0");
    targetEmail = `t${yearCode}${seqStr}@buddhist.mcu.ac.th`.toLowerCase();
    const emailConflict = await db.user.findUnique({
      where: { email: targetEmail },
    });
    if (!emailConflict) {
      isUnique = true;
    }
  }

  const plainPassword = generateRandomTeacherPassword(10);
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const newUser = await db.user.create({
    data: {
      name: cleanName,
      email: targetEmail,
      passwordHash,
      emailVerified: true,
      mustChangePassword: true,
      isActive: true,
      provider: "credentials",
    },
  });

  const userTenant = await db.userTenant.create({
    data: {
      userId: newUser.id,
      tenantId,
      isActive: true,
    },
  });

  const teacherRole = await db.role.findFirst({
    where: { tenantId, code: "TEACHER" },
  });
  if (teacherRole) {
    await db.userRole.create({
      data: {
        userTenantId: userTenant.id,
        roleId: teacherRole.id,
        scopeType: "ALL",
      },
    });
  }

  return {
    user: newUser,
    isNew: true,
    plainPassword,
    email: targetEmail,
  };
}

/**
 * ดึงรายการตารางเรียนหลักสูตรที่พร้อมนำเข้าสู่ระบบเช็กชื่อ
 */
export async function getAvailableTimetablesForSync(
  tenantId: string,
  filters?: { academicYear?: string; semester?: number }
) {
  const where: Prisma.CurriculumTimetableWhereInput = {
    tenantId,
    isActive: true,
  };
  if (filters?.academicYear) where.academicYear = filters.academicYear;
  if (filters?.semester) where.semester = filters.semester;

  const timetables = await db.curriculumTimetable.findMany({
    where,
    include: {
      curriculum: {
        select: {
          id: true,
          nameTh: true,
          nameEn: true,
          degree: true,
        },
      },
      department: {
        select: {
          id: true,
          nameTh: true,
          nameEn: true,
        },
      },
    },
    orderBy: [
      { academicYear: "desc" },
      { semester: "asc" },
      { yearLevel: "asc" },
      { orderIndex: "asc" },
    ],
  });

  return timetables.map((t) => {
    const schedule = Array.isArray(t.scheduleData) ? (t.scheduleData as any[]) : [];
    return {
      id: t.id,
      titleTh: t.titleTh,
      titleEn: t.titleEn,
      academicYear: t.academicYear,
      semester: t.semester,
      yearLevel: t.yearLevel,
      room: t.room,
      termDates: t.termDates,
      curriculumName: t.curriculum?.nameTh || t.curriculum?.nameEn || "หลักสูตรทั่วไป",
      departmentName: t.department?.nameTh || t.department?.nameEn || "คณะพุทธศาสตร์",
      courseCount: schedule.length,
      courses: schedule.map((c) => ({
        id: c.id,
        courseCode: c.courseCode,
        courseName: c.courseName,
        instructor: c.instructor,
        dayOfWeek: c.dayOfWeek,
        startTime: c.startTime,
        endTime: c.endTime,
        room: c.room || t.room,
        periodLabel: c.periodLabel,
      })),
    };
  });
}

export interface SyncTimetableResult {
  success: boolean;
  importedCount: number;
  skippedCount: number;
  createdCourses: Array<{ courseId: string; courseCode: string; courseName: string }>;
  skippedCourses: Array<{ courseCode: string; courseName: string; reason: string }>;
  teacherCredentials: Array<{
    teacherName: string;
    email: string;
    initialPassword?: string;
    courses: string[];
    isNew: boolean;
  }>;
}

/**
 * นำเข้าข้อมูลรายวิชาจากตารางเรียนหลักสูตร พร้อมสร้างไอดีอาจารย์และกำหนด 16 คาบเรียนอัตโนมัติ
 */
export async function syncCoursesFromTimetable(
  tenantId: string,
  actorId: string,
  params: {
    timetableId: string;
    selectedCourseCodes?: string[];
  }
): Promise<SyncTimetableResult> {
  const timetable = await db.curriculumTimetable.findUnique({
    where: { id: params.timetableId, tenantId },
    include: {
      curriculum: true,
      department: true,
    },
  });

  if (!timetable) {
    throw new Error("NOT_FOUND: ไม่พบตารางเรียนที่ระบุ");
  }

  const scheduleSlots = Array.isArray(timetable.scheduleData)
    ? (timetable.scheduleData as any[])
    : [];

  const slotsToImport =
    params.selectedCourseCodes && params.selectedCourseCodes.length > 0
      ? scheduleSlots.filter((slot) => params.selectedCourseCodes!.includes(slot.courseCode))
      : scheduleSlots;

  if (slotsToImport.length === 0) {
    throw new Error("INVALID_DATA: ไม่มีรายการวิชาที่เลือกนำเข้า");
  }

  // เตรียมเลขลำดับอาจารย์ใหม่
  const yearCode = timetable.academicYear ? timetable.academicYear.slice(-2) : "69";
  const existingTeacherUsers = await db.user.findMany({
    where: { email: { startsWith: `t${yearCode}` } },
    select: { email: true },
  });
  let maxSeq = 1;
  for (const u of existingTeacherUsers) {
    const match = u.email.match(/^t\d{2}(\d{3})@/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num >= maxSeq) {
        maxSeq = num + 1;
      }
    }
  }
  const runningCounter = { value: maxSeq };

  const createdCourses: Array<{ courseId: string; courseCode: string; courseName: string }> = [];
  const skippedCourses: Array<{ courseCode: string; courseName: string; reason: string }> = [];
  const credentialsMap = new Map<
    string,
    {
      teacherName: string;
      email: string;
      initialPassword?: string;
      courses: string[];
      isNew: boolean;
    }
  >();

  for (const slot of slotsToImport) {
    const courseCode = (slot.courseCode || "").trim();
    const courseName = (slot.courseName || "").trim();

    if (!courseCode || !courseName) {
      skippedCourses.push({
        courseCode: courseCode || "-",
        courseName: courseName || "-",
        reason: "ข้อมูลรหัสวิชาหรือชื่อวิชาไม่สมบูรณ์",
      });
      continue;
    }

    // ตรวจสอบว่ามีวิชานี้ในภาคการศึกษานี้อยู่แล้วหรือไม่
    const existingCourse = await db.course.findFirst({
      where: {
        tenantId,
        courseCode,
        academicYear: timetable.academicYear,
        semester: timetable.semester,
        section: "1",
      },
    });

    if (existingCourse) {
      // กรณีห้องเรียนรวม (สอนรวมหลายสาขาวิชา): ดึงนิสิตของสาขา/ตารางนี้เข้าเรียนเพิ่มเติมอัตโนมัติ
      const matchingDept = (timetable.department?.nameTh || timetable.curriculum?.nameTh || "")
        .replace(/พุทธศาสตร(ดุษฎีบัณฑิต|มหาบัณฑิต|บัณฑิต)/g, "")
        .replace(/(ดุษฎีบัณฑิต|มหาบัณฑิต|บัณฑิต)/g, "")
        .replace(/ปริญญา(เอก|โท|ตรี)/g, "")
        .replace(/ประกาศนียบัตร/g, "")
        .replace(/หลักสูตร/g, "")
        .replace(/ภาควิชา/g, "")
        .replace(/สาขาวิชา/g, "")
        .replace(/\(หลักสูตร(ภาษาอังกฤษ|ภาษาไทย|นานาชาติ)\)/g, "")
        .trim();

      const targetDegree =
        timetable.curriculum?.degree === "MASTER" || /ปริญญาโท|มหาบัณฑิต/.test(timetable.titleTh)
          ? "ปริญญาโท"
          : timetable.curriculum?.degree === "DOCTORATE" || /ปริญญาเอก|ดุษฎีบัณฑิต/.test(timetable.titleTh)
          ? "ปริญญาเอก"
          : timetable.curriculum?.degree === "CERTIFICATE" || /ประกาศนียบัตร/.test(timetable.titleTh)
          ? "ประกาศนียบัตร"
          : timetable.curriculum?.degree === "BACHELOR" || /ปริญญาตรี|พุทธศาสตรบัณฑิต/.test(timetable.titleTh)
          ? "ปริญญาตรี"
          : undefined;

      const candidateStudents = await db.student.findMany({
        where: {
          tenantId,
          yearLevel: timetable.yearLevel,
          isActive: true,
          ...(targetDegree ? { degree: targetDegree } : {}),
          ...(matchingDept
            ? {
                OR: [
                  { department: { contains: matchingDept, mode: "insensitive" } },
                  { major: { contains: matchingDept, mode: "insensitive" } },
                  { curriculumName: { contains: matchingDept, mode: "insensitive" } },
                ],
              }
            : {}),
        },
      });

      let newlyEnrolled = 0;
      for (const st of candidateStudents) {
        const exist = await db.courseEnrollment.findUnique({
          where: { courseId_studentId: { courseId: existingCourse.id, studentId: st.id } },
        });
        if (!exist) {
          await db.courseEnrollment.create({
            data: {
              tenantId,
              courseId: existingCourse.id,
              studentId: st.id,
              status: EnrollmentStatus.ENROLLED,
            },
          });
          newlyEnrolled++;
        }
      }

      skippedCourses.push({
        courseCode,
        courseName,
        reason:
          newlyEnrolled > 0
            ? `ห้องเรียนรวม: ดึงนิสิตสาขา ${timetable.titleTh} เข้าห้องเรียนเพิ่ม ${newlyEnrolled} คนเรียบร้อยแล้ว`
            : "มีรายวิชานี้ในระบบแล้ว (ห้องเรียนรวม)",
      });
      continue;
    }

    // แยกรายชื่ออาจารย์
    const parsedInstructors = parseInstructorsFromSlot(slot.instructor);
    const teacherAccounts: Array<{
      user: any;
      isPrimary: boolean;
      isNew: boolean;
      plainPassword?: string;
      email: string;
    }> = [];

    for (const inst of parsedInstructors) {
      const account = await findOrCreateTeacherUser(
        tenantId,
        inst.name,
        timetable.academicYear,
        runningCounter
      );
      teacherAccounts.push({
        ...account,
        isPrimary: inst.isPrimary,
      });

      // บันทึกข้อมูลบัญชีสำหรับใบส่งมอบ (Handover)
      const existingCred = credentialsMap.get(account.email);
      const courseLabel = `${courseCode} ${courseName}`.trim();
      if (existingCred) {
        if (!existingCred.courses.includes(courseLabel)) {
          existingCred.courses.push(courseLabel);
        }
      } else {
        credentialsMap.set(account.email, {
          teacherName: inst.name,
          email: account.email,
          initialPassword: account.plainPassword,
          courses: [courseLabel],
          isNew: account.isNew,
        });
      }
    }

    const primaryInstructorAccount =
      teacherAccounts.find((t) => t.isPrimary) || teacherAccounts[0];
    const primaryTeacherId = primaryInstructorAccount?.user?.id || actorId;

    // สร้าง Course และ 16 ClassSessions ใน Transaction
    const course = await db.$transaction(async (tx) => {
      const newCourse = await tx.course.create({
        data: {
          tenantId,
          courseCode,
          courseName,
          credits: 3,
          section: "1",
          term: `${timetable.semester}/${timetable.academicYear}`,
          academicYear: timetable.academicYear,
          semester: timetable.semester,
          description: `นำเข้าจากตารางเรียนหลักสูตร: ${timetable.titleTh}`,
          targetSessions: 16,
          room: slot.room || timetable.room || "ห้องเรียนหลัก",
          dayOfWeek: Number(slot.dayOfWeek) || 1,
          startTime: slot.startTime || "09.00",
          endTime: slot.endTime || "11.30",
          primaryTeacherId,
        },
      });

      // บันทึกอาจารย์ผู้สอนใน CourseTeacher
      for (const t of teacherAccounts) {
        await tx.courseTeacher.upsert({
          where: {
            courseId_userId: {
              courseId: newCourse.id,
              userId: t.user.id,
            },
          },
          update: {
            isPrimary: t.isPrimary,
            role: t.isPrimary ? "PRIMARY_TEACHER" : "CO_TEACHER",
          },
          create: {
            tenantId,
            courseId: newCourse.id,
            userId: t.user.id,
            isPrimary: t.isPrimary,
            role: t.isPrimary ? "PRIMARY_TEACHER" : "CO_TEACHER",
          },
        });
      }

      // สร้าง 16 คาบเรียนมาตรฐานประจำสัปดาห์
      const dayOfWeek = Number(slot.dayOfWeek) || 1;
      const firstSessionDate = getFirstSessionDate(dayOfWeek, timetable.termDates);

      for (let i = 1; i <= 16; i++) {
        const sessionDate = new Date(firstSessionDate);
        sessionDate.setDate(firstSessionDate.getDate() + (i - 1) * 7);

        await tx.classSession.create({
          data: {
            tenantId,
            courseId: newCourse.id,
            sessionNumber: i,
            date: sessionDate,
            startTime: slot.startTime || "09.00",
            endTime: slot.endTime || "11.30",
            room: slot.room || timetable.room || "ห้องเรียนหลัก",
            topic: `คาบที่ ${i}: การบรรยายและกิจกรรมการเรียนรู้`,
            sessionType: SessionType.REGULAR,
            status: SessionStatus.SCHEDULED,
            isCounted: true,
          },
        });
      }

      // ดึงนิสิตที่ตรงกับชั้นปีและสาขาวิชาเข้าห้องเรียนให้อัตโนมัติ (Auto-Enroll matching cohort students)
      const matchingDept = (timetable.department?.nameTh || timetable.curriculum?.nameTh || "")
        .replace(/พุทธศาสตร(ดุษฎีบัณฑิต|มหาบัณฑิต|บัณฑิต)/g, "")
        .replace(/(ดุษฎีบัณฑิต|มหาบัณฑิต|บัณฑิต)/g, "")
        .replace(/ปริญญา(เอก|โท|ตรี)/g, "")
        .replace(/ประกาศนียบัตร/g, "")
        .replace(/หลักสูตร/g, "")
        .replace(/ภาควิชา/g, "")
        .replace(/สาขาวิชา/g, "")
        .replace(/\(หลักสูตร(ภาษาอังกฤษ|ภาษาไทย|นานาชาติ)\)/g, "")
        .trim();

      const targetDegree =
        timetable.curriculum?.degree === "MASTER" || /ปริญญาโท|มหาบัณฑิต/.test(timetable.titleTh)
          ? "ปริญญาโท"
          : timetable.curriculum?.degree === "DOCTORATE" || /ปริญญาเอก|ดุษฎีบัณฑิต/.test(timetable.titleTh)
          ? "ปริญญาเอก"
          : timetable.curriculum?.degree === "CERTIFICATE" || /ประกาศนียบัตร/.test(timetable.titleTh)
          ? "ประกาศนียบัตร"
          : timetable.curriculum?.degree === "BACHELOR" || /ปริญญาตรี|พุทธศาสตรบัณฑิต/.test(timetable.titleTh)
          ? "ปริญญาตรี"
          : undefined;

      const candidateStudents = await tx.student.findMany({
        where: {
          tenantId,
          yearLevel: timetable.yearLevel,
          isActive: true,
          ...(targetDegree ? { degree: targetDegree } : {}),
          ...(matchingDept
            ? {
                OR: [
                  { department: { contains: matchingDept, mode: "insensitive" } },
                  { major: { contains: matchingDept, mode: "insensitive" } },
                  { curriculumName: { contains: matchingDept, mode: "insensitive" } },
                ],
              }
            : {}),
        },
      });

      const studentsToEnroll =
        candidateStudents.length > 0
          ? candidateStudents
          : await tx.student.findMany({
              where: {
                tenantId,
                yearLevel: timetable.yearLevel,
                isActive: true,
                ...(targetDegree ? { degree: targetDegree } : {}),
              },
            });

      for (const st of studentsToEnroll) {
        await tx.courseEnrollment.create({
          data: {
            tenantId,
            courseId: newCourse.id,
            studentId: st.id,
            status: EnrollmentStatus.ENROLLED,
          },
        });
      }

      return newCourse;
    });

    createdCourses.push({
      courseId: course.id,
      courseCode: course.courseCode,
      courseName: course.courseName,
    });
  }

  await writeAudit({
    tenantId,
    actorId,
    action: "course.timetable.sync",
    entity: "CurriculumTimetable",
    entityId: timetable.id,
    after: {
      timetableId: timetable.id,
      importedCount: createdCourses.length,
      skippedCount: skippedCourses.length,
      newTeachersCount: Array.from(credentialsMap.values()).filter((c) => c.isNew).length,
    },
  });

  return {
    success: true,
    importedCount: createdCourses.length,
    skippedCount: skippedCourses.length,
    createdCourses,
    skippedCourses,
    teacherCredentials: Array.from(credentialsMap.values()),
  };
}

// =========================================================================
// 9. COHORT STUDENT ENROLLMENT (ดึงนิสิตเข้าห้องเรียนตามชั้นปี/สาขาวิชา)
// =========================================================================

export async function getAvailableStudentsForCohort(
  tenantId: string,
  courseId: string,
  filters?: {
    yearLevel?: number;
    department?: string;
    search?: string;
  }
) {
  // ดึงรายการนิสิตที่ลงทะเบียนในวิชานี้อยู่แล้วเพื่อยกเว้น
  const existingEnrollments = await db.courseEnrollment.findMany({
    where: {
      tenantId,
      courseId,
      status: { not: EnrollmentStatus.DROPPED },
    },
    select: { studentId: true },
  });
  const enrolledStudentIds = new Set(existingEnrollments.map((e) => e.studentId));

  const where: Prisma.StudentWhereInput = {
    tenantId,
    isActive: true,
  };

  if (filters?.yearLevel) {
    where.yearLevel = filters.yearLevel;
  }
  if (filters?.department && filters.department !== "ALL") {
    where.department = filters.department;
  }
  if (filters?.search) {
    where.OR = [
      { studentCode: { contains: filters.search, mode: "insensitive" } },
      { firstName: { contains: filters.search, mode: "insensitive" } },
      { lastName: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const allMatchingStudents = await db.student.findMany({
    where,
    orderBy: [
      { yearLevel: "asc" },
      { studentCode: "asc" },
    ],
  });

  const availableStudents = allMatchingStudents.filter(
    (s) => !enrolledStudentIds.has(s.id)
  );

  const allDepartmentsInDb = await db.student.findMany({
    where: { tenantId, department: { not: null } },
    select: { department: true },
    distinct: ["department"],
  });
  const departmentOptions = allDepartmentsInDb
    .map((d) => d.department!)
    .filter(Boolean);

  return {
    students: availableStudents.map((s) => ({
      id: s.id,
      studentCode: s.studentCode,
      title: s.title,
      firstName: s.firstName,
      lastName: s.lastName,
      yearLevel: s.yearLevel,
      degree: s.degree || "ปริญญาตรี",
      curriculumName: s.curriculumName,
      department: s.department,
      faculty: s.faculty,
    })),
    totalAvailable: availableStudents.length,
    alreadyEnrolledCount: allMatchingStudents.length - availableStudents.length,
    departmentOptions,
  };
}

export async function enrollCohortStudents(
  tenantId: string,
  actorId: string,
  courseId: string,
  studentIds: string[]
) {
  if (!studentIds || studentIds.length === 0) {
    throw new Error("INVALID_DATA: กรุณาเลือกนิสิตอย่างน้อย 1 คน");
  }

  const course = await db.course.findUnique({
    where: { id: courseId, tenantId },
  });
  if (!course) {
    throw new Error("NOT_FOUND: ไม่พบรายวิชาที่ระบุ");
  }

  let enrolledCount = 0;
  for (const studentId of studentIds) {
    await db.courseEnrollment.upsert({
      where: {
        courseId_studentId: {
          courseId,
          studentId,
        },
      },
      update: {
        status: EnrollmentStatus.ENROLLED,
      },
      create: {
        tenantId,
        courseId,
        studentId,
        status: EnrollmentStatus.ENROLLED,
      },
    });
    enrolledCount++;
  }

  await writeAudit({
    tenantId,
    actorId,
    action: "course.enrollment.cohort_import",
    entity: "CourseEnrollment",
    entityId: courseId,
    after: {
      courseId,
      enrolledCount,
      studentIds,
    },
  });

  return {
    success: true,
    enrolledCount,
  };
}

// =========================================================================
// 10. AT-RISK STUDENTS EARLY WARNING & NOTIFICATIONS (แจ้งเตือนกลุ่มเสี่ยง)
// =========================================================================

export async function sendAtRiskWarningNotifications(
  tenantId: string,
  actorId: string,
  courseId: string,
  studentIds?: string[]
) {
  const report = await getCourseEligibilityReport(tenantId, courseId, actorId, true);
  if (!report || !report.course) {
    throw new Error("NOT_FOUND: ไม่พบรายวิชา");
  }

  // หานิสิตที่เข้าข่ายกลุ่มเสี่ยง (< 80% หรือ ขาด >= 3 คาบ หรือ isEligible === false)
  const atRiskStudents = report.summaries.filter(
    (s) =>
      s.hasEnoughData &&
      (s.percentage < 80.0 || s.absentCount >= 3 || s.isEligible === false) &&
      (!studentIds || studentIds.includes(s.studentId))
  );

  if (atRiskStudents.length === 0) {
    return {
      success: true,
      warnedCount: 0,
      warnedStudents: [],
      message: "ไม่พบนิสิตในกลุ่มเสี่ยงหมดสิทธิ์สอบ",
    };
  }

  const warnedList = atRiskStudents.map((st) => ({
    studentId: st.studentId,
    studentCode: st.studentCode,
    studentName: st.studentName,
    percentage: st.percentage,
    absentCount: st.absentCount,
    evaluatedCount: st.evaluatedCount,
    requiredToPass: st.requiredRemainingToPass,
  }));

  await writeAudit({
    tenantId,
    actorId,
    action: "attendance.at_risk.warning_issued",
    entity: "Course",
    entityId: courseId,
    after: {
      courseCode: report.course.courseCode,
      courseName: report.course.courseName,
      warnedCount: warnedList.length,
      students: warnedList,
      issuedAt: new Date().toISOString(),
    },
  });

  return {
    success: true,
    warnedCount: warnedList.length,
    warnedStudents: warnedList,
    courseCode: report.course.courseCode,
    courseName: report.course.courseName,
  };
}

/**
 * ดึงข้อมูลประวัติเวลาเรียนและสรุปสิทธิ์สอบรายบุคคลของนิสิต (สำหรับพอร์ทัลนิสิต)
 */
export async function getStudentPersonalAttendance(
  tenantId: string,
  studentCode: string
) {
  const cleanCode = studentCode.trim();
  if (!cleanCode) {
    throw new Error("กรุณาระบุรหัสนิสิต");
  }

  const student = await db.student.findFirst({
    where: {
      tenantId,
      studentCode: {
        equals: cleanCode,
        mode: "insensitive",
      },
    },
    include: {
      enrollments: {
        where: {
          status: EnrollmentStatus.ENROLLED,
        },
        include: {
          course: {
            include: {
              primaryTeacher: true,
              sessions: {
                orderBy: { sessionNumber: "asc" },
              },
            },
          },
          records: {
            include: {
              session: true,
            },
          },
        },
      },
    },
  });

  if (!student) {
    return {
      found: false,
      message: `ไม่พบข้อมูลนิสิตรหัส "${cleanCode}" ในระบบ`,
      student: null,
      summary: null,
      courses: [],
    };
  }

  const coursesList = student.enrollments.map((enr: any) => {
    const course = enr.course;
    const rules = (course.calculationRules as any) || {};

    const scheduledCountedSessions = course.sessions.filter(
      (s: any) => s.isCounted && s.status !== SessionStatus.CANCELLED
    ).length;

    const conductedCountedSessions = course.sessions.filter(
      (s: any) =>
        s.isCounted &&
        (s.status === SessionStatus.COMPLETED || s.status === SessionStatus.IN_PROGRESS)
    ).length;

    const formattedRecords = enr.records.map((r: any) => ({
      status: r.status,
      isCountedSession: r.session.isCounted,
      sessionStatus: r.session.status,
    }));

    const eligibility = calculateStudentEligibility({
      studentId: student.id,
      enrollmentId: enr.id,
      studentCode: student.studentCode,
      studentName: `${student.title || ""} ${student.firstName} ${student.lastName}`.trim(),
      yearLevel: student.yearLevel,
      department: student.department,
      records: formattedRecords,
      totalScheduledCountedSessions: scheduledCountedSessions,
      totalConductedCountedSessions: conductedCountedSessions,
      rules,
    });

    const recordMap = new Map<string, any>();
    for (const r of enr.records) {
      recordMap.set(r.sessionId, r);
    }

    const sessionBreakdown = course.sessions.map((sess: any) => {
      const rec = recordMap.get(sess.id);
      return {
        id: sess.id,
        sessionNumber: sess.sessionNumber,
        date: sess.date,
        startTime: sess.startTime,
        endTime: sess.endTime,
        room: sess.room,
        topic: sess.topic,
        sessionStatus: sess.status,
        isCounted: sess.isCounted,
        attendanceStatus: rec ? rec.status : "PENDING",
        note: rec?.note || null,
        updatedAt: rec?.updatedAt || null,
      };
    });

    return {
      courseId: course.id,
      courseCode: course.courseCode,
      courseName: course.courseName,
      courseNameEn: course.courseNameEn,
      credits: course.credits,
      term: course.term,
      academicYear: course.academicYear,
      semester: course.semester,
      room: course.room,
      instructor: course.primaryTeacher?.name || "-",
      eligibility,
      sessions: sessionBreakdown,
    };
  });

  const totalCourses = coursesList.length;
  const atRiskCourses = coursesList.filter(
    (c) => c.eligibility.hasEnoughData && (c.eligibility.percentage < 80.0 || c.eligibility.isEligible === false)
  ).length;

  const averageAttendance =
    totalCourses > 0
      ? coursesList.reduce((acc, c) => acc + c.eligibility.percentage, 0) / totalCourses
      : 0;

  return {
    found: true,
    student: {
      id: student.id,
      studentCode: student.studentCode,
      title: student.title || "",
      firstName: student.firstName,
      lastName: student.lastName,
      fullName: `${student.title || ""} ${student.firstName} ${student.lastName}`.trim(),
      yearLevel: student.yearLevel,
      department: student.department || "คณะพุทธศาสตร์",
      faculty: student.faculty || "คณะพุทธศาสตร์",
      email: student.email,
    },
    summary: {
      totalCourses,
      atRiskCourses,
      averageAttendanceRate: Math.round(averageAttendance * 100) / 100,
    },
    courses: coursesList,
  };
}

/**
 * ดึงตาราง Matrix การเข้าเรียนรายคาบครบ 16 คาบของรายวิชา (สำหรับ Export CSV/Excel)
 */
export async function getCourseAttendanceMatrix(
  tenantId: string,
  courseId: string,
  userId?: string,
  isSuperAdmin = false
) {
  if (userId) {
    await assertCourseAccess(tenantId, courseId, userId, isSuperAdmin);
  }

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      primaryTeacher: true,
      sessions: {
        orderBy: { sessionNumber: "asc" },
      },
      enrollments: {
        where: { status: EnrollmentStatus.ENROLLED },
        include: {
          student: true,
          records: {
            include: { session: true },
          },
        },
      },
    },
  });

  if (!course) throw new Error("NOT_FOUND: ไม่พบรายวิชา");

  const scheduledCountedSessions = course.sessions.filter(
    (s: any) => s.isCounted && s.status !== SessionStatus.CANCELLED
  ).length;

  const conductedCountedSessions = course.sessions.filter(
    (s: any) =>
      s.isCounted &&
      (s.status === SessionStatus.COMPLETED || s.status === SessionStatus.IN_PROGRESS)
  ).length;

  const rules = (course.calculationRules as any) || {};

  const matrix = course.enrollments.map((enr: any) => {
    const formattedRecords = enr.records.map((r: any) => ({
      status: r.status,
      isCountedSession: r.session.isCounted,
      sessionStatus: r.session.status,
    }));

    const eligibility = calculateStudentEligibility({
      studentId: enr.student.id,
      enrollmentId: enr.id,
      studentCode: enr.student.studentCode,
      studentName: `${enr.student.title || ""} ${enr.student.firstName} ${enr.student.lastName}`.trim(),
      yearLevel: enr.student.yearLevel,
      department: enr.student.department,
      records: formattedRecords,
      totalScheduledCountedSessions: scheduledCountedSessions,
      totalConductedCountedSessions: conductedCountedSessions,
      rules,
    });

    const sessionRecords: Record<number, string> = {};
    for (const r of enr.records) {
      sessionRecords[r.session.sessionNumber] = r.status;
    }

    return {
      studentId: enr.student.id,
      studentCode: enr.student.studentCode,
      studentName: `${enr.student.title || ""} ${enr.student.firstName} ${enr.student.lastName}`.trim(),
      yearLevel: enr.student.yearLevel,
      department: enr.student.department,
      sessionRecords,
      totals: {
        present: eligibility.presentCount,
        late: eligibility.lateCount,
        excused: eligibility.excusedCount,
        absent: eligibility.absentCount,
        pending: eligibility.pendingCount,
        percentage: eligibility.percentage,
        isEligible: eligibility.isEligible,
        statusText: eligibility.statusText,
      },
    };
  });

  return {
    course: {
      id: course.id,
      courseCode: course.courseCode,
      courseName: course.courseName,
      credits: course.credits,
      term: course.term,
      academicYear: course.academicYear,
      semester: course.semester,
      primaryTeacher: course.primaryTeacher?.name || "-",
      calculationRules: rules,
    },
    sessions: course.sessions.map((s: any) => ({
      id: s.id,
      sessionNumber: s.sessionNumber,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      topic: s.topic,
      isCounted: s.isCounted,
      status: s.status,
    })),
    matrix,
  };
}

/**
 * อัปเดตเกณฑ์การคำนวณสิทธิ์สอบเฉพาะรายวิชา (Calculation Rules)
 */
export async function updateCourseCalculationRules(
  tenantId: string,
  actorId: string,
  courseId: string,
  rules: {
    minPercent: number;
    lateCountsAsFull: boolean;
    excuseDeductsDenominator: boolean;
  }
) {
  const course = await db.course.findUnique({
    where: { id: courseId },
  });
  if (!course) throw new Error("NOT_FOUND: ไม่พบรายวิชา");

  const minPercent = Number(rules.minPercent) || 80.0;
  if (minPercent < 50 || minPercent > 100) {
    throw new Error("เกณฑ์เปอร์เซ็นต์ขั้นต่ำต้องอยู่ระหว่าง 50% ถึง 100%");
  }

  const updatedRules = {
    lateCountsAsFull: Boolean(rules.lateCountsAsFull),
    excuseDeductsDenominator: Boolean(rules.excuseDeductsDenominator),
    minPercent,
  };

  const updatedCourse = await db.course.update({
    where: { id: courseId },
    data: {
      calculationRules: updatedRules,
    },
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "attendance.course.rules_updated",
    entity: "Course",
    entityId: courseId,
    before: { calculationRules: course.calculationRules },
    after: { calculationRules: updatedRules },
  });

  return updatedCourse;
}

// =========================================================================
// 10. GRADING & ASSESSMENT (คะแนนเก็บ, สอบระหว่างภาค, จิตพิสัย, สอบปลายภาค)
// =========================================================================

export interface CourseGradingConfig {
  assignmentMax: number; // คะแนนเก็บ (Default: 30)
  midtermMax: number;    // สอบระหว่างภาค (Default: 30)
  affectiveMax: number;  // จิตวิสัย / จิตพิสัย (Default: 10)
  finalMax: number;      // สอบปลายภาค (Default: 30)
}

export function calculateGradeFromScore(totalScore: number): string {
  if (totalScore >= 80) return "A";
  if (totalScore >= 75) return "B+";
  if (totalScore >= 70) return "B";
  if (totalScore >= 65) return "C+";
  if (totalScore >= 60) return "C";
  if (totalScore >= 55) return "D+";
  if (totalScore >= 50) return "D";
  return "F";
}

/**
 * ดึงข้อมูลการให้คะแนนและเกรดของรายวิชา (Gradebook)
 */
export async function getCourseGrades(
  tenantId: string,
  courseId: string,
  userId?: string,
  isSuperAdmin = false
) {
  if (userId) {
    await assertCourseAccess(tenantId, courseId, userId, isSuperAdmin);
  }

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      primaryTeacher: true,
      sessions: {
        orderBy: { sessionNumber: "asc" },
      },
      enrollments: {
        where: { status: EnrollmentStatus.ENROLLED },
        include: {
          student: true,
          records: {
            include: { session: true },
          },
        },
        orderBy: [
          { student: { yearLevel: "asc" } },
          { student: { studentCode: "asc" } },
        ],
      },
    },
  });

  if (!course) throw new Error("NOT_FOUND: ไม่พบรายวิชา");

  const defaultConfig: CourseGradingConfig = {
    assignmentMax: 30,
    midtermMax: 30,
    affectiveMax: 10,
    finalMax: 30,
  };

  const rawConfig = (course.gradingConfig as any) || {};
  const gradingConfig: CourseGradingConfig = {
    assignmentMax: Number(rawConfig.assignmentMax) >= 0 ? Number(rawConfig.assignmentMax) : defaultConfig.assignmentMax,
    midtermMax: Number(rawConfig.midtermMax) >= 0 ? Number(rawConfig.midtermMax) : defaultConfig.midtermMax,
    affectiveMax: Number(rawConfig.affectiveMax) >= 0 ? Number(rawConfig.affectiveMax) : defaultConfig.affectiveMax,
    finalMax: Number(rawConfig.finalMax) >= 0 ? Number(rawConfig.finalMax) : defaultConfig.finalMax,
  };

  const scheduledCountedSessions = course.sessions.filter(
    (s: any) => s.isCounted && s.status !== SessionStatus.CANCELLED
  ).length;

  const conductedCountedSessions = course.sessions.filter(
    (s: any) =>
      s.isCounted &&
      (s.status === SessionStatus.COMPLETED || s.status === SessionStatus.IN_PROGRESS)
  ).length;

  const rules = (course.calculationRules as any) || {};

  const students = course.enrollments.map((enr: any) => {
    const formattedRecords = enr.records.map((r: any) => ({
      status: r.status,
      isCountedSession: r.session.isCounted,
      sessionStatus: r.session.status,
    }));

    const eligibility = calculateStudentEligibility({
      studentId: enr.student.id,
      enrollmentId: enr.id,
      studentCode: enr.student.studentCode,
      studentName: `${enr.student.title || ""} ${enr.student.firstName} ${enr.student.lastName}`.trim(),
      yearLevel: enr.student.yearLevel,
      department: enr.student.department,
      records: formattedRecords,
      totalScheduledCountedSessions: scheduledCountedSessions,
      totalConductedCountedSessions: conductedCountedSessions,
      rules,
    });

    const hasAnyScore =
      enr.assignmentScore !== null ||
      enr.midtermScore !== null ||
      enr.affectiveScore !== null ||
      enr.finalScore !== null;

    const computedTotal = hasAnyScore
      ? Math.round(
          ((enr.assignmentScore || 0) +
            (enr.midtermScore || 0) +
            (enr.affectiveScore || 0) +
            (enr.finalScore || 0)) * 100
        ) / 100
      : enr.totalScore;

    const currentGrade =
      enr.grade ||
      (computedTotal !== null && computedTotal !== undefined
        ? calculateGradeFromScore(computedTotal)
        : null);

    return {
      enrollmentId: enr.id,
      studentId: enr.student.id,
      studentCode: enr.student.studentCode,
      title: enr.student.title || "",
      firstName: enr.student.firstName,
      lastName: enr.student.lastName,
      fullName: `${enr.student.title || ""} ${enr.student.firstName} ${enr.student.lastName}`.trim(),
      yearLevel: enr.student.yearLevel,
      department: enr.student.department || "-",
      major: enr.student.major || enr.student.department || "-",
      gender: enr.student.gender || "-",
      studyStatus: enr.student.studyStatus || "ปกติ",
      attendancePercentage: eligibility.percentage,
      isEligible: eligibility.isEligible,
      eligibilityStatusTh: (eligibility as any).statusTh || "",
      assignmentScore: enr.assignmentScore,
      midtermScore: enr.midtermScore,
      affectiveScore: enr.affectiveScore,
      finalScore: enr.finalScore,
      totalScore: computedTotal !== undefined ? computedTotal : null,
      grade: currentGrade,
      gradeRemarks: enr.gradeRemarks || "",
    };
  });

  return {
    course: {
      id: course.id,
      courseCode: course.courseCode,
      courseName: course.courseName,
      credits: course.credits,
      term: course.term,
      academicYear: course.academicYear,
      semester: course.semester,
      room: course.room || "-",
      primaryTeacher: course.primaryTeacher?.name || "-",
    },
    gradingConfig,
    students,
  };
}

/**
 * บันทึกคะแนนและเกรดแบบกลุ่ม (Batch Grade Update)
 */
export async function batchUpdateCourseGrades(
  tenantId: string,
  actorId: string,
  courseId: string,
  items: Array<{
    enrollmentId: string;
    assignmentScore?: number | null;
    midtermScore?: number | null;
    affectiveScore?: number | null;
    finalScore?: number | null;
    totalScore?: number | null;
    grade?: string | null;
    gradeRemarks?: string | null;
  }>
) {
  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course || course.tenantId !== tenantId) {
    throw new Error("NOT_FOUND: ไม่พบรายวิชา");
  }

  const results = await db.$transaction(async (tx) => {
    const updated = [];
    for (const item of items) {
      const hasAnyScore =
        item.assignmentScore !== null && item.assignmentScore !== undefined ||
        item.midtermScore !== null && item.midtermScore !== undefined ||
        item.affectiveScore !== null && item.affectiveScore !== undefined ||
        item.finalScore !== null && item.finalScore !== undefined;

      const computedTotal =
        item.totalScore !== undefined && item.totalScore !== null
          ? item.totalScore
          : hasAnyScore
          ? Math.round(
              ((item.assignmentScore || 0) +
                (item.midtermScore || 0) +
                (item.affectiveScore || 0) +
                (item.finalScore || 0)) * 100
            ) / 100
          : null;

      const resolvedGrade =
        item.grade && item.grade.trim() !== ""
          ? item.grade.trim().toUpperCase()
          : computedTotal !== null && computedTotal !== undefined
          ? calculateGradeFromScore(computedTotal)
          : null;

      const res = await tx.courseEnrollment.update({
        where: { id: item.enrollmentId },
        data: {
          assignmentScore: item.assignmentScore !== undefined ? item.assignmentScore : undefined,
          midtermScore: item.midtermScore !== undefined ? item.midtermScore : undefined,
          affectiveScore: item.affectiveScore !== undefined ? item.affectiveScore : undefined,
          finalScore: item.finalScore !== undefined ? item.finalScore : undefined,
          totalScore: computedTotal,
          grade: resolvedGrade,
          gradeRemarks: item.gradeRemarks !== undefined ? item.gradeRemarks : undefined,
        },
      });
      updated.push(res);
    }
    return updated;
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "attendance.grades.batch_update",
    entity: "Course",
    entityId: courseId,
    after: {
      updatedCount: results.length,
      updatedAt: new Date().toISOString(),
    },
  });

  return { success: true, updatedCount: results.length };
}

/**
 * อัปเดตสัดส่วนคะแนนเต็มของรายวิชา (Course Grading Config)
 */
export async function updateCourseGradingConfig(
  tenantId: string,
  actorId: string,
  courseId: string,
  config: CourseGradingConfig
) {
  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course || course.tenantId !== tenantId) {
    throw new Error("NOT_FOUND: ไม่พบรายวิชา");
  }

  const sanitizedConfig: CourseGradingConfig = {
    assignmentMax: Math.max(0, Number(config.assignmentMax) || 0),
    midtermMax: Math.max(0, Number(config.midtermMax) || 0),
    affectiveMax: Math.max(0, Number(config.affectiveMax) || 0),
    finalMax: Math.max(0, Number(config.finalMax) || 0),
  };

  const updated = await db.course.update({
    where: { id: courseId },
    data: {
      gradingConfig: sanitizedConfig as any,
    },
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "attendance.course.grading_config_updated",
    entity: "Course",
    entityId: courseId,
    after: sanitizedConfig,
  });

  return updated;
}

/**
 * ดึงข้อมูลนิสิตทั้งหมดในระบบสำหรับหน้าทะเบียนนิสิตกลาง (Student Directory)
 */
export async function getAllStudentsDirectory(tenantId: string) {
  const students = await db.student.findMany({
    where: { tenantId },
    include: {
      enrollments: {
        where: { status: { not: EnrollmentStatus.DROPPED } },
        include: {
          course: {
            select: {
              id: true,
              courseCode: true,
              courseName: true,
              courseNameEn: true,
              academicYear: true,
              semester: true,
            },
          },
        },
      },
    },
    orderBy: [
      { yearLevel: "asc" },
      { studentCode: "asc" },
    ],
  });

  return students;
}

export async function createOrUpdateStudent(
  tenantId: string,
  actorId: string,
  data: {
    id?: string;
    studentCode: string;
    title?: string | null;
    firstName: string;
    lastName: string;
    yearLevel: number;
    department?: string | null;
    degree?: string | null;
    curriculumName?: string | null;
    major?: string | null;
    faculty?: string | null;
    studyStatus?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
  }
) {
  if (data.id) {
    const updated = await db.student.update({
      where: { id: data.id },
      data: {
        studentCode: data.studentCode,
        title: data.title,
        firstName: data.firstName,
        lastName: data.lastName,
        yearLevel: data.yearLevel,
        department: data.department,
        degree: data.degree,
        curriculumName: data.curriculumName,
        major: data.major,
        faculty: data.faculty || "คณะพุทธศาสตร์",
        studyStatus: data.studyStatus || "ปกติ",
        email: data.email,
        phoneNumber: data.phoneNumber,
      },
    });

    await writeAudit({
      tenantId,
      actorId,
      action: "attendance.student.updated",
      entity: "Student",
      entityId: updated.id,
      after: updated,
    });

    return updated;
  }

  const created = await db.student.create({
    data: {
      tenantId,
      studentCode: data.studentCode,
      title: data.title,
      firstName: data.firstName,
      lastName: data.lastName,
      yearLevel: data.yearLevel,
      department: data.department,
      degree: data.degree || "ปริญญาตรี",
      curriculumName: data.curriculumName,
      major: data.major,
      faculty: data.faculty || "คณะพุทธศาสตร์",
      studyStatus: data.studyStatus || "ปกติ",
      email: data.email,
      phoneNumber: data.phoneNumber,
    },
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "attendance.student.created",
    entity: "Student",
    entityId: created.id,
    after: created,
  });

  return created;
}

export async function deleteStudent(tenantId: string, actorId: string, studentId: string) {
  const student = await db.student.findUnique({
    where: { id: studentId },
  });

  if (!student || student.tenantId !== tenantId) {
    throw new Error("NOT_FOUND: ไม่พบนิสิต");
  }

  await db.student.delete({
    where: { id: studentId },
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "attendance.student.deleted",
    entity: "Student",
    entityId: studentId,
    before: student,
  });

  return { success: true };
}

/**
 * นำเข้าหรืออัปเดตข้อมูลนิสิตเป็นชุด (Batch Import & Update Students)
 */
export async function batchImportStudents(
  tenantId: string,
  actorId: string,
  items: Array<{
    studentCode: string;
    firstName: string;
    lastName: string;
    title?: string | null;
    yearLevel?: number;
    degree?: string | null;
    curriculumName?: string | null;
    department?: string | null;
    major?: string | null;
    studyStatus?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
  }>
) {
  let createdCount = 0;
  let updatedCount = 0;

  for (const item of items) {
    if (!item.studentCode || !item.firstName || !item.lastName) continue;

    const code = item.studentCode.trim();
    const existing = await db.student.findUnique({
      where: {
        tenantId_studentCode: {
          tenantId,
          studentCode: code,
        },
      },
    });

    if (existing) {
      await db.student.update({
        where: { id: existing.id },
        data: {
          firstName: item.firstName.trim(),
          lastName: item.lastName.trim(),
          title: item.title !== undefined && item.title !== null ? item.title : existing.title,
          yearLevel: item.yearLevel !== undefined && item.yearLevel !== null ? item.yearLevel : existing.yearLevel,
          degree: item.degree !== undefined && item.degree !== null ? item.degree : existing.degree,
          curriculumName: item.curriculumName !== undefined ? item.curriculumName : existing.curriculumName,
          department: item.department !== undefined && item.department !== null ? item.department : existing.department,
          major: item.major !== undefined && item.major !== null ? item.major : existing.major,
          studyStatus: item.studyStatus !== undefined && item.studyStatus !== null ? item.studyStatus : existing.studyStatus,
          email: item.email !== undefined && item.email !== null ? item.email : existing.email,
          phoneNumber: item.phoneNumber !== undefined && item.phoneNumber !== null ? item.phoneNumber : existing.phoneNumber,
        },
      });
      updatedCount++;
    } else {
      await db.student.create({
        data: {
          tenantId,
          studentCode: code,
          firstName: item.firstName.trim(),
          lastName: item.lastName.trim(),
          title: item.title || "พระ",
          yearLevel: item.yearLevel || 1,
          degree: item.degree || "ปริญญาตรี",
          curriculumName: item.curriculumName || null,
          department: item.department || "สาขาวิชาพระพุทธศาสนา",
          faculty: "คณะพุทธศาสตร์",
          studyStatus: item.studyStatus || "ปกติ",
          email: item.email || null,
          phoneNumber: item.phoneNumber || null,
        },
      });
      createdCount++;
    }
  }

  await writeAudit({
    tenantId,
    actorId,
    action: "attendance.students.batchImport",
    entity: "Student",
    entityId: "batch",
    after: { createdCount, updatedCount, totalProcessed: items.length },
  });

  return { success: true, createdCount, updatedCount };
}

