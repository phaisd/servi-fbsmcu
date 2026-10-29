import "server-only";
import { prisma as db } from "@/shared/lib/infra/prisma";
import { writeAudit } from "@/features/identity/server";
import { RegistrationStatus } from "@/generated/prisma";
import type { Prisma } from "@/generated/prisma";
import {
  DEFAULT_MEDITATION_CONFIG,
  type MeditationConfig,
  type PeriodAttendanceItem,
  type MeditationAttendanceStatus,
} from "../meditation-types";
import { SAMPLE_ENGLISH_ATTENDEES, SAMPLE_THAI_ATTENDEES } from "../meditation-sample-data";

export async function getEvents(tenantId: string) {
  const events = await db.event.findMany({
    where: { tenantId },
    orderBy: { startDate: "desc" },
    include: {
      registrations: {
        select: { id: true, status: true, role: true },
      },
      _count: { select: { registrations: true } },
    },
  });

  return events.map((ev) => {
    const total = ev.registrations.length;
    const attended = ev.registrations.filter((r) => r.status === "ATTENDED").length;
    const studentCount = ev.registrations.filter((r) => r.role === "STUDENT").length;
    const teacherCount = ev.registrations.filter((r) => r.role === "TEACHER").length;
    return {
      ...ev,
      stats: {
        total,
        attended,
        pending: total - attended,
        studentCount,
        teacherCount,
        percentage: total > 0 ? Math.round((attended / total) * 100) : 0,
      },
    };
  });
}

export async function getPublicEvents(tenantId: string) {
  return db.event.findMany({
    where: { tenantId, isActive: true },
    orderBy: { startDate: "asc" },
  });
}

export async function getEventById(tenantId: string, id: string) {
  const ev = await db.event.findUnique({
    where: { id, tenantId },
    include: {
      tenant: { select: { logoUrl: true, nameTh: true, nameEn: true } },
      registrations: true,
      _count: { select: { registrations: true } },
    },
  });

  if (!ev) return null;

  const total = ev.registrations.length;
  const attended = ev.registrations.filter((r) => r.status === "ATTENDED").length;
  const studentCount = ev.registrations.filter((r) => r.role === "STUDENT").length;
  const teacherCount = ev.registrations.filter((r) => r.role === "TEACHER").length;

  return {
    ...ev,
    stats: {
      total,
      attended,
      pending: total - attended,
      studentCount,
      teacherCount,
      percentage: total > 0 ? Math.round((attended / total) * 100) : 0,
    },
  };
}

export async function createEvent(
  tenantId: string,
  actorId: string,
  data: {
    title: string;
    description?: string | null;
    location?: string | null;
    startDate: Date | string;
    endDate: Date | string;
    capacity?: number;
    academicYear?: string | null;
    activityHours?: number;
    eventType?: string;
    targetGroup?: string;
  }
) {
  const result = await db.event.create({
    data: {
      tenantId,
      title: data.title,
      description: data.description,
      location: data.location,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      capacity: data.capacity || 0,
      academicYear: data.academicYear || "2569",
      activityHours: data.activityHours || 3,
      eventType: data.eventType || "CEREMONY",
      targetGroup: data.targetGroup || "ALL",
      isActive: true,
    },
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "events.event.create",
    entity: "Event",
    entityId: result.id,
    after: result,
  });

  return result;
}

export async function updateEvent(
  tenantId: string,
  actorId: string,
  id: string,
  data: Partial<{
    title: string;
    description: string | null;
    location: string | null;
    startDate: Date | string;
    endDate: Date | string;
    capacity: number;
    academicYear: string | null;
    activityHours: number;
    eventType: string;
    targetGroup: string;
    isActive: boolean;
  }>
) {
  const updateData: Prisma.EventUpdateInput = {
    ...data,
    startDate: data.startDate ? new Date(data.startDate) : undefined,
    endDate: data.endDate ? new Date(data.endDate) : undefined,
  };
  if (data.startDate) updateData.startDate = new Date(data.startDate);
  if (data.endDate) updateData.endDate = new Date(data.endDate);

  const result = await db.event.update({
    where: { id, tenantId },
    data: updateData,
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "events.event.update",
    entity: "Event",
    entityId: result.id,
    after: result,
  });

  return result;
}

export async function deleteEvent(tenantId: string, actorId: string, id: string) {
  const result = await db.event.delete({
    where: { id, tenantId },
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "events.event.delete",
    entity: "Event",
    entityId: id,
  });

  return result;
}

export async function getRegistrations(tenantId: string, eventId: string) {
  return db.eventRegistration.findMany({
    where: { tenantId, eventId },
    orderBy: [
      { role: "asc" }, // TEACHER first, then STUDENT
      { major: "asc" },
      { yearLevel: "asc" },
      { studentCode: "asc" },
    ],
  });
}

export async function updateRegistrationStatus(
  tenantId: string,
  actorId: string,
  id: string,
  status: RegistrationStatus,
  remarks?: string
) {
  const before = await db.eventRegistration.findUnique({ where: { id, tenantId } });
  if (!before) throw new Error("Not found");

  const updateData: Prisma.EventRegistrationUpdateInput = { status };
  if (remarks !== undefined) updateData.remarks = remarks;
  if (status === "ATTENDED" && !before.attendedAt) {
    updateData.attendedAt = new Date();
  } else if (status !== "ATTENDED") {
    updateData.attendedAt = null;
  }

  const result = await db.eventRegistration.update({
    where: { id, tenantId },
    data: updateData,
  });

  await writeAudit({
    tenantId,
    actorId,
    action: `events.registration.status_change`,
    entity: "EventRegistration",
    entityId: result.id,
    before,
    after: result,
  });

  return result;
}

export async function updateRegistrationRemarks(
  tenantId: string,
  actorId: string,
  id: string,
  remarks: string
) {
  return db.eventRegistration.update({
    where: { id, tenantId },
    data: { remarks },
  });
}

export async function quickCheckInByCode(
  tenantId: string,
  actorId: string,
  eventId: string,
  code: string
) {
  const cleanCode = code.trim();
  const reg = await db.eventRegistration.findFirst({
    where: {
      tenantId,
      eventId,
      studentCode: cleanCode,
    },
  });

  if (!reg) {
    throw new Error(`ไม่พบรายชื่อรหัส ${cleanCode} ในกิจกรรมนี้`);
  }

  const updated = await db.eventRegistration.update({
    where: { id: reg.id },
    data: {
      status: "ATTENDED",
      attendedAt: new Date(),
    },
  });

  return {
    success: true,
    registration: updated,
    message: `เช็คชื่อสำเร็จ: ${reg.studentName} (${reg.studentCode})`,
  };
}

/**
 * ดึงข้อมูลกิจกรรมและประวัติการเข้าร่วมของผู้ใช้ (นิสิต หรือ อาจารย์)
 */
export async function getUserActivities(tenantId: string, userIdentifier: { email?: string; studentCode?: string }) {
  const codes = [
    userIdentifier.studentCode,
    userIdentifier.email,
  ].filter(Boolean) as string[];

  const myRegistrations = await db.eventRegistration.findMany({
    where: {
      tenantId,
      studentCode: { in: codes },
    },
    include: {
      event: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const allEvents = await db.event.findMany({
    where: { tenantId, isActive: true },
    orderBy: { startDate: "asc" },
  });

  const registeredEventIds = new Set(myRegistrations.map((r) => r.eventId));
  const availableEvents = allEvents.filter((ev) => !registeredEventIds.has(ev.id));

  // คำนวณชั่วโมงกิจกรรมรวมที่เข้าร่วมแล้ว
  const totalAttendedHours = myRegistrations
    .filter((r) => r.status === "ATTENDED")
    .reduce((sum, r) => sum + (r.event?.activityHours || 0), 0);

  return {
    myRegistrations,
    availableEvents,
    allEvents,
    totalAttendedHours,
  };
}

/**
 * ซิงค์หรือสร้างข้อมูลกิจกรรมพิธีเปิดภาคการศึกษา (Opening Ceremony 2026)
 * พร้อมลงทะเบียนนิสิตทุกชั้นปีและอาจารย์ผู้สอนตามเอกสารทางการ
 */
export async function seedOpeningCeremonyEvent(tenantId: string, _actorId: string) {
  // 1. ตรวจสอบหรือสร้าง Event
  let event = await db.event.findFirst({
    where: {
      tenantId,
      title: "The Opening Ceremony of the Academic Year 2026",
    },
  });

  if (!event) {
    event = await db.event.create({
      data: {
        tenantId,
        title: "The Opening Ceremony of the Academic Year 2026",
        description: "พิธีเปิดภาคการศึกษา ประจำปีการศึกษา 2569 คณะพุทธศาสตร์ หลักสูตรพุทธศาสตรบัณฑิต (ภาคภาษาอังกฤษ) และคณาจารย์",
        location: "at the M.W.K. 48th Birthday Anniversary Auditorium, Mahachulalongkornrajavidyalaya University, Wang Noi, Phra Nakhon Si Ayutthaya",
        startDate: new Date("2026-06-23T12:00:00+07:00"),
        endDate: new Date("2026-06-23T17:00:00+07:00"),
        capacity: 500,
        academicYear: "2569",
        activityHours: 4,
        eventType: "CEREMONY",
        targetGroup: "Bachelor of Arts Program, Faculty of Buddhism (English Program) & Lecturers",
        isActive: true,
      },
    });
  }

  // 2. ดึงรายชื่อนิสิตทั้งหมดของ tenant นี้
  const students = await db.student.findMany({
    where: { tenantId },
    orderBy: [
      { major: "asc" },
      { yearLevel: "asc" },
      { studentCode: "asc" },
    ],
  });

  // 3. ดึงรายชื่ออาจารย์จากคอร์สของ tenant นี้
  const courses = await db.course.findMany({
    where: { tenantId },
    include: { primaryTeacher: true },
  });

  const teacherMap = new Map<string, { id: string; name: string; email: string }>();
  for (const c of courses) {
    if (c.primaryTeacher) {
      teacherMap.set(c.primaryTeacher.id, {
        id: c.primaryTeacher.id,
        name: c.primaryTeacher.name,
        email: c.primaryTeacher.email,
      });
    }
  }

  // 4. บันทึกลงทะเบียนนิสิต (Upsert)
  let studentRegisteredCount = 0;
  for (const st of students) {
    const fullName = `${st.title ? st.title + " " : ""}${st.firstName} ${st.lastName}`.trim();
    const existing = await db.eventRegistration.findUnique({
      where: {
        eventId_studentCode: {
          eventId: event.id,
          studentCode: st.studentCode,
        },
      },
    });

    if (!existing) {
      await db.eventRegistration.create({
        data: {
          tenantId,
          eventId: event.id,
          studentCode: st.studentCode,
          studentName: fullName,
          role: "STUDENT",
          major: st.major || st.department || "Buddhist Studies",
          yearLevel: st.yearLevel,
          department: st.department || "Faculty of Buddhism",
          status: "REGISTERED",
        },
      });
      studentRegisteredCount++;
    }
  }

  // 5. บันทึกลงทะเบียนอาจารย์ (Upsert)
  let teacherRegisteredCount = 0;
  for (const t of Array.from(teacherMap.values())) {
    const existing = await db.eventRegistration.findUnique({
      where: {
        eventId_studentCode: {
          eventId: event.id,
          studentCode: t.email, // ใช้อีเมลเป็น ID ประจำตัวอาจารย์
        },
      },
    });

    if (!existing) {
      await db.eventRegistration.create({
        data: {
          tenantId,
          eventId: event.id,
          studentCode: t.email,
          studentName: t.name,
          role: "TEACHER",
          major: "Faculty of Buddhism (English Program)",
          department: "คณาจารย์และผู้บรรยาย",
          status: "REGISTERED",
        },
      });
      teacherRegisteredCount++;
    }
  }

  return {
    eventId: event.id,
    studentRegisteredCount,
    teacherRegisteredCount,
    totalStudents: students.length,
    totalTeachers: teacherMap.size,
  };
}

/**
 * เพิ่มผู้เข้าร่วมกิจกรรมแบบรายบุคคล (นิสิต หรือ อาจารย์)
 */
export async function addIndividualAttendee(
  tenantId: string,
  actorId: string,
  eventId: string,
  codeOrId: string,
  role: "STUDENT" | "TEACHER" | "EXECUTIVE" = "STUDENT",
  customData?: {
    name?: string;
    position?: string;
    department?: string;
  }
) {
  const event = await db.event.findUnique({ where: { id: eventId, tenantId } });
  if (!event) throw new Error("ไม่พบกิจกรรมนี้");

  const cleanCode = (codeOrId || (customData?.name ? `EXEC-${Date.now().toString().slice(-6)}` : "")).trim();

  // ตรวจสอบว่ามีอยู่แล้วหรือไม่
  if (cleanCode) {
    const existing = await db.eventRegistration.findUnique({
      where: {
        eventId_studentCode: {
          eventId,
          studentCode: cleanCode,
        },
      },
    });

    if (existing) {
      throw new Error(`รหัส ${cleanCode} มีรายชื่อในกิจกรรมนี้อยู่แล้ว`);
    }
  }

  // กรณีผู้บริหาร หรือระบุชื่อ-ตำแหน่งมาโดยตรง (Custom Executive/Personnel)
  if (role === "EXECUTIVE" || (customData?.name && customData.name.trim())) {
    const fullName = customData?.name?.trim() || cleanCode;
    const finalCode = cleanCode || `EXEC-${Date.now().toString().slice(-6)}`;
    return db.eventRegistration.create({
      data: {
        tenantId,
        eventId,
        studentCode: finalCode,
        studentName: fullName,
        role: "EXECUTIVE",
        major: customData?.position || "คณะผู้บริหาร",
        department: customData?.department || "มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
        remarks: customData?.position || "ผู้บริหาร",
        status: "REGISTERED",
      },
    });
  }

  // หากเป็นนิสิต ค้นหาข้อมูลจากตาราง Student
  if (role === "STUDENT") {
    const student = await db.student.findFirst({
      where: {
        tenantId,
        OR: [
          { studentCode: cleanCode },
          { id: cleanCode.length === 36 ? cleanCode : undefined },
        ],
      },
    });

    if (student) {
      const fullName = `${student.title ? student.title + " " : ""}${student.firstName} ${student.lastName}`.trim();
      return db.eventRegistration.create({
        data: {
          tenantId,
          eventId,
          studentCode: student.studentCode,
          studentName: fullName,
          role: "STUDENT",
          major: student.major || student.department || "Buddhist Studies",
          yearLevel: student.yearLevel,
          department: student.department || "Faculty of Buddhism",
          status: "REGISTERED",
        },
      });
    }
  }

  // หากเป็นอาจารย์ หรือไม่พบนิสิต ให้ค้นหาจาก User
  const user = await db.user.findFirst({
    where: {
      OR: [
        { email: cleanCode },
        { id: cleanCode.length === 36 ? cleanCode : undefined },
      ],
    },
  });

  if (user) {
    return db.eventRegistration.create({
      data: {
        tenantId,
        eventId,
        studentCode: user.email,
        studentName: user.name,
        role: role === "TEACHER" ? "TEACHER" : "STUDENT",
        major: "Faculty of Buddhism",
        status: "REGISTERED",
      },
    });
  }

  throw new Error(`ไม่พบข้อมูลนิสิตหรืออาจารย์ที่ตรงกับรหัส/อีเมล "${cleanCode}" ในระบบ`);
}

/**
 * ดึงรายชื่อผู้บริหารและบุคลากรจากทำเนียบ (Personnel) เข้าสู่กิจกรรม
 */
export async function importPersonnelToEvent(
  tenantId: string,
  actorId: string,
  eventId: string
) {
  const personnelList = await db.personnel.findMany({
    where: { tenantId, isActive: true },
    orderBy: { orderIndex: "asc" },
  });

  let added = 0;
  for (const p of personnelList) {
    const code = p.email || `PERS-${p.id.slice(0, 8)}`;
    const fullName = `${p.firstNameTh} ${p.lastNameTh}`.trim();
    const existing = await db.eventRegistration.findUnique({
      where: {
        eventId_studentCode: { eventId, studentCode: code },
      },
    });

    if (!existing) {
      await db.eventRegistration.create({
        data: {
          tenantId,
          eventId,
          studentCode: code,
          studentName: fullName,
          role: "EXECUTIVE",
          major: p.positionTh || "ผู้บริหาร / บุคลากร",
          department: "คณะพุทธศาสตร์ มจร",
          remarks: p.positionTh || "ผู้บริหาร",
          status: "REGISTERED",
        },
      });
      added++;
    }
  }

  return { added, total: personnelList.length };
}

/**
 * ดึงรายชื่อนิสิตแบบกลุ่มเข้ากิจกรรม (ตามชั้นปี หรือ สาขาวิชา)
 */
export async function batchAddStudentsToEvent(
  tenantId: string,
  actorId: string,
  eventId: string,
  filters: {
    yearLevel?: number;
    major?: string;
    degree?: string;
    department?: string;
    programLanguage?: "ALL" | "THAI" | "ENGLISH";
  }
) {
  const event = await db.event.findUnique({ where: { id: eventId, tenantId } });
  if (!event) throw new Error("ไม่พบกิจกรรมนี้");

  const andConditions: Prisma.StudentWhereInput[] = [
    { tenantId },
    { isActive: true },
    {
      OR: [
        { studyStatus: null },
        { studyStatus: { notIn: ["ลาออก", "ย้ายออก", "พ้นสภาพ", "สำเร็จการศึกษา"] } },
      ],
    },
  ];

  if (filters.yearLevel && filters.yearLevel > 0) {
    andConditions.push({ yearLevel: filters.yearLevel });
  }

  if (filters.degree && filters.degree !== "ALL") {
    if (filters.degree === "BACHELOR") {
      andConditions.push({ degree: { contains: "ตรี" } });
    } else if (filters.degree === "MASTER") {
      andConditions.push({ degree: { contains: "โท" } });
    } else if (filters.degree === "DOCTORATE") {
      andConditions.push({ degree: { contains: "เอก" } });
    } else {
      andConditions.push({ degree: { contains: filters.degree } });
    }
  }

  if (filters.department && filters.department !== "ALL") {
    andConditions.push({
      OR: [
        { department: { contains: filters.department } },
        { curriculumName: { contains: filters.department } },
      ],
    });
  }

  if (filters.major && filters.major !== "ALL") {
    andConditions.push({
      OR: [
        { major: { contains: filters.major } },
        { curriculumName: { contains: filters.major } },
      ],
    });
  }

  if (filters.programLanguage === "THAI") {
    andConditions.push({
      NOT: [
        { curriculumName: { contains: "ภาษาอังกฤษ" } },
        { curriculumName: { contains: "English" } },
        { major: { in: ["Buddhist Studies", "Religion and Philosophy", "Philosophy"] } },
        { degree: { contains: "English" } },
      ],
    });
  } else if (filters.programLanguage === "ENGLISH") {
    andConditions.push({
      OR: [
        { curriculumName: { contains: "ภาษาอังกฤษ" } },
        { curriculumName: { contains: "English" } },
        { major: { in: ["Buddhist Studies", "Religion and Philosophy", "Philosophy"] } },
        { degree: { contains: "English" } },
      ],
    });
  }

  const whereClause = { AND: andConditions };

  const students = await db.student.findMany({
    where: whereClause,
    orderBy: [{ yearLevel: "asc" }, { studentCode: "asc" }],
  });

  let addedCount = 0;
  for (const st of students) {
    const existing = await db.eventRegistration.findUnique({
      where: {
        eventId_studentCode: {
          eventId,
          studentCode: st.studentCode,
        },
      },
    });

    if (!existing) {
      const fullName = (st.title ? st.title + " " : "") + st.firstName + " " + st.lastName;
      await db.eventRegistration.create({
        data: {
          tenantId,
          eventId,
          studentCode: st.studentCode,
          studentName: fullName,
          role: "STUDENT",
          major: st.major || st.department || "สาขาวิชาพระพุทธศาสนา",
          yearLevel: st.yearLevel,
          department: st.department || "คณะพุทธศาสตร์",
          status: "REGISTERED",
        },
      });
      addedCount++;
    }
  }

  if (addedCount > 0) {
    await writeAudit({
      tenantId,
      actorId,
      action: "events.attendees.batch_add",
      entity: "EventRegistration",
      entityId: eventId,
      after: { addedCount, totalFound: students.length },
    });
  }

  return { addedCount, totalFound: students.length };
}

/**
 * ลบผู้เข้าร่วมออกจากกิจกรรม
 */
export async function removeAttendeeFromEvent(
  tenantId: string,
  actorId: string,
  registrationId: string
) {
  const existing = await db.eventRegistration.findUnique({
    where: { id: registrationId, tenantId },
  });

  const result = await db.eventRegistration.delete({
    where: { id: registrationId, tenantId },
  });

  if (existing) {
    await writeAudit({
      tenantId,
      actorId,
      action: "events.attendees.remove",
      entity: "EventRegistration",
      entityId: registrationId,
      before: existing,
    });
  }

  return result;
}


/**
 * ดึงข้อมูลกิจกรรมและสถิติสดสำหรับขึ้นจอโปรเจกเตอร์ (Projector Display)
 */
export async function getEventProjectorData(tenantId: string, eventId: string) {
  const event = await db.event.findFirst({
    where: { id: eventId, tenantId },
  });

  if (!event) {
    throw new Error("ไม่พบข้อมูลกิจกรรมนี้");
  }

  const [total, attended, recentCheckIns] = await Promise.all([
    db.eventRegistration.count({ where: { eventId, tenantId } }),
    db.eventRegistration.count({ where: { eventId, tenantId, status: "ATTENDED" } }),
    db.eventRegistration.findMany({
      where: { eventId, tenantId, status: "ATTENDED" },
      orderBy: { attendedAt: "desc" },
      take: 6,
      select: {
        id: true,
        studentName: true,
        studentCode: true,
        role: true,
        major: true,
        department: true,
        attendedAt: true,
      },
    }),
  ]);

  const percent = total > 0 ? Math.round((attended / total) * 100) : 0;

  return {
    event: {
      id: event.id,
      title: event.title,
      description: event.description,
      location: event.location,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      activityHours: event.activityHours,
      eventType: event.eventType,
      targetGroup: event.targetGroup,
      academicYear: event.academicYear,
    },
    stats: {
      total,
      attended,
      pending: Math.max(0, total - attended),
      percent,
    },
    recentCheckIns: recentCheckIns.map((item) => ({
      ...item,
      attendedAt: item.attendedAt ? item.attendedAt.toISOString() : null,
    })),
  };
}

/**
 * สแกนหรือพิมพ์เช็คชื่อเข้าร่วมกิจกรรมด้วยตนเอง (Self Check-in via QR / Web)
 */
export async function publicSelfCheckInEvent(tenantId: string, eventId: string, code: string) {
  const cleanCode = code.trim();
  if (!cleanCode) {
    throw new Error("กรุณาระบุรหัสนิสิต หรืออีเมลอาจารย์/บุคลากร");
  }

  const event = await db.event.findFirst({
    where: { id: eventId, tenantId },
  });

  if (!event) {
    throw new Error("ไม่พบกิจกรรมนี้ หรือกิจกรรมอาจถูกปิดไปแล้ว");
  }

  // 1. ตรวจสอบในรายชื่อลงทะเบียนเดิมของกิจกรรม
  let reg = await db.eventRegistration.findFirst({
    where: {
      tenantId,
      eventId,
      OR: [
        { studentCode: cleanCode },
        { studentCode: { equals: cleanCode, mode: "insensitive" } },
      ],
    },
  });

  // 2. ถ้ายังไม่ได้ลงทะเบียนไว้ ให้ค้นหาในฐานข้อมูลนิสิตหรือบุคลากร เพื่อลงทะเบียนหน้างานอัตโนมัติ (Walk-in Auto Registration)
  if (!reg) {
    // 2.1 ค้นหาในตารางนิสิต
    const student = await db.student.findFirst({
      where: {
        tenantId,
        studentCode: cleanCode,
      },
    });

    if (student) {
      const fullName = `${student.title ? student.title + " " : ""}${student.firstName} ${student.lastName}`.trim();
      reg = await db.eventRegistration.create({
        data: {
          tenantId,
          eventId,
          studentCode: student.studentCode,
          studentName: fullName,
          role: "STUDENT",
          major: student.major || student.department || "สาขาวิชาพระพุทธศาสนา",
          yearLevel: student.yearLevel,
          department: student.department || student.faculty || "คณะพุทธศาสตร์",
          status: "ATTENDED",
          attendedAt: new Date(),
          remarks: "เช็คชื่อผ่าน QR โปรเจกเตอร์หน้างาน (Walk-in)",
        },
      });

      return {
        success: true,
        isNewRegistration: true,
        studentName: reg.studentName,
        studentCode: reg.studentCode,
        role: reg.role,
        major: reg.major,
        department: reg.department,
        activityHours: event.activityHours,
        eventTitle: event.title,
        attendedAt: reg.attendedAt ? reg.attendedAt.toISOString() : new Date().toISOString(),
        message: `เช็คชื่อสำเร็จแล้ว! ยินดีต้อนรับ ${reg.studentName}`,
      };
    }

    // 2.2 ค้นหาในตารางบุคลากร/อาจารย์/ผู้บริหาร
    const personnel = await db.personnel.findFirst({
      where: {
        tenantId,
        OR: [
          { email: cleanCode },
          { firstNameTh: { contains: cleanCode, mode: "insensitive" } },
        ],
      },
    });

    if (personnel) {
      const isExec = personnel.positionTh?.includes("คณบดี") || 
                     personnel.positionTh?.includes("อธิการ") || 
                     personnel.positionTh?.includes("ผู้อำนวยการ");
      reg = await db.eventRegistration.create({
        data: {
          tenantId,
          eventId,
          studentCode: personnel.email || cleanCode,
          studentName: `${personnel.firstNameTh} ${personnel.lastNameTh}`,
          role: isExec ? "EXECUTIVE" : "TEACHER",
          department: personnel.positionTh || "บุคลากร มจร",
          remarks: personnel.positionTh,
          status: "ATTENDED",
          attendedAt: new Date(),
        },
      });

      return {
        success: true,
        isNewRegistration: true,
        studentName: reg.studentName,
        studentCode: reg.studentCode,
        role: reg.role,
        major: reg.major,
        department: reg.department,
        activityHours: event.activityHours,
        eventTitle: event.title,
        attendedAt: reg.attendedAt ? reg.attendedAt.toISOString() : new Date().toISOString(),
        message: `เช็คชื่อสำเร็จแล้ว! ยินดีต้อนรับ ${reg.studentName}`,
      };
    }

    throw new Error(`ไม่พบรหัส "${cleanCode}" ในระบบ กรุณาตรวจสอบรหัสนิสิตอีกครั้ง หรือติดต่อเจ้าหน้าที่ประจำหอประชุม`);
  }

  // 3. ถ้ามีรายชื่ออยู่แล้ว ให้อัปเดตสถานะเป็น ATTENDED
  const updated = await db.eventRegistration.update({
    where: { id: reg.id },
    data: {
      status: "ATTENDED",
      attendedAt: reg.attendedAt || new Date(),
    },
  });

  return {
    success: true,
    isNewRegistration: false,
    studentName: updated.studentName,
    studentCode: updated.studentCode,
    role: updated.role,
    major: updated.major,
    department: updated.department,
    activityHours: event.activityHours,
    eventTitle: event.title,
    attendedAt: updated.attendedAt ? updated.attendedAt.toISOString() : new Date().toISOString(),
    message: `เช็คชื่อสำเร็จแล้ว! ${updated.studentName}`,
  };
}


/**
 * นำเข้ารายชื่อผู้เข้าร่วมเป็นชุด (จาก Excel / CSV / วางข้อความ)
 */
export async function batchImportAttendees(
  tenantId: string,
  actorId: string,
  eventId: string,
  items: Array<{
    studentCode: string;
    studentName?: string;
    role?: string;
    major?: string;
    department?: string;
    yearLevel?: number;
    remarks?: string;
  }>
) {
  let importedCount = 0;
  let skippedCount = 0;

  const existing = await db.eventRegistration.findMany({
    where: { tenantId, eventId },
    select: { studentCode: true },
  });
  const existingCodes = new Set(existing.map((e) => e.studentCode.trim().toLowerCase()));

  for (const item of items) {
    const cleanCode = item.studentCode?.trim();
    if (!cleanCode) continue;

    if (existingCodes.has(cleanCode.toLowerCase())) {
      skippedCount++;
      continue;
    }

    let name = item.studentName?.trim() || "";
    let role = item.role || "STUDENT";
    let major = item.major || "";
    let department = item.department || "";
    let yearLevel = item.yearLevel || null;

    // ถ้าไม่มีชื่อ ให้ค้นหาจากฐานข้อมูลนิสิต
    if (!name) {
      const student = await db.student.findFirst({
        where: { tenantId, studentCode: cleanCode },
      });
      if (student) {
        name = `${student.title ? student.title + " " : ""}${student.firstName} ${student.lastName}`.trim();
        major = major || student.major || student.curriculumName || "สาขาวิชาพระพุทธศาสนา";
        department = department || student.faculty || student.department || "คณะพุทธศาสตร์";
        yearLevel = yearLevel || student.yearLevel;
        role = "STUDENT";
      } else {
        const personnel = await db.personnel.findFirst({
          where: { tenantId, email: cleanCode },
        });
        if (personnel) {
          name = `${personnel.firstNameTh} ${personnel.lastNameTh}`.trim();
          department = department || personnel.positionTh || "บุคลากร";
          role = personnel.positionTh?.includes("คณบดี") || personnel.positionTh?.includes("อธิการ") ? "EXECUTIVE" : "TEACHER";
        } else {
          name = `รหัส ${cleanCode}`;
        }
      }
    }

    await db.eventRegistration.create({
      data: {
        tenantId,
        eventId,
        studentCode: cleanCode,
        studentName: name,
        role,
        major: major || null,
        department: department || null,
        yearLevel: yearLevel || null,
        remarks: item.remarks || null,
        status: "REGISTERED",
      },
    });

    existingCodes.add(cleanCode.toLowerCase());
    importedCount++;
  }

  if (importedCount > 0) {
    await writeAudit({
      tenantId,
      actorId,
      action: "events.attendees.excel_import",
      entity: "EventRegistration",
      entityId: eventId,
      after: { importedCount, skippedCount, total: items.length },
    });
  }

  return { importedCount, skippedCount };
}

/**
 * ดึงข้อมูลประวัติกิจกรรมและคำนวณ Transcript กิจกรรมสะสมของนิสิต (Student Activity Transcript)
 */
export async function getStudentActivityTranscript(tenantId: string, studentCode: string) {
  const cleanCode = studentCode.trim();

  // 1. ค้นหาข้อมูลนิสิตจากตารางนักศึกษา
  const student = await db.student.findFirst({
    where: {
      tenantId,
      studentCode: { equals: cleanCode, mode: "insensitive" },
    },
  });

  // 2. ดึงประวัติการลงทะเบียนกิจกรรมทั้งหมด
  const registrations = await db.eventRegistration.findMany({
    where: {
      tenantId,
      studentCode: { equals: cleanCode, mode: "insensitive" },
    },
    include: {
      event: true,
    },
    orderBy: {
      event: {
        startDate: "asc",
      },
    },
  });

  // 3. กำหนดข้อมูลพื้นฐานของนิสิต (ใช้จาก student หรือ fallback จาก registration)
  const firstReg = registrations[0];
  const studentInfo = {
    studentCode: cleanCode,
    fullName: student
      ? `${student.title ? student.title + " " : ""}${student.firstName} ${student.lastName}`.trim()
      : firstReg?.studentName || `รหัสนิสิต ${cleanCode}`,
    degree: student?.degree || (cleanCode.length >= 8 && cleanCode.startsWith("6") ? "ปริญญาตรี" : "ปริญญาตรี"),
    faculty: student?.faculty || "คณะพุทธศาสตร์",
    department: student?.department || firstReg?.department || "ภาควิชาพระพุทธศาสนา",
    major: student?.major || student?.curriculumName || firstReg?.major || "สาขาวิชาพระพุทธศาสนา",
    curriculumName: student?.curriculumName || "หลักสูตรพุทธศาสตรบัณฑิต คณะพุทธศาสตร์ มจร.",
    yearLevel: student?.yearLevel || firstReg?.yearLevel || 1,
    studyStatus: student?.studyStatus || "ปกติ",
    email: student?.email || `${cleanCode}@mcu.ac.th`,
    phoneNumber: student?.phoneNumber || "-",
    entryYear: student?.createdAt
      ? String(new Date(student.createdAt).getFullYear() + 543)
      : (cleanCode.length >= 2 ? `25${cleanCode.substring(0, 2)}` : "2569"),
  };

  // 4. คำนวณชั่วโมงสะสม
  const attendedRegistrations = registrations.filter((r) => r.status === "ATTENDED");
  const totalAttendedHours = attendedRegistrations.reduce(
    (sum, r) => sum + (r.event?.activityHours || 0),
    0
  );
  const totalRegisteredHours = registrations.reduce(
    (sum, r) => sum + (r.event?.activityHours || 0),
    0
  );

  // เกณฑ์ชั่วโมงขั้นต่ำตามระดับปริญญา
  let requiredHours = 100; // ปริญญาตรี 100 ชั่วโมง
  if (studentInfo.degree.includes("เอก") || studentInfo.degree.toLowerCase().includes("doc")) {
    requiredHours = 20;
  } else if (studentInfo.degree.includes("โท") || studentInfo.degree.toLowerCase().includes("master")) {
    requiredHours = 30;
  }

  const isPassed = totalAttendedHours >= requiredHours;
  const progressPercent = Math.min(100, Math.round((totalAttendedHours / requiredHours) * 100));

  // หมวดหมู่กิจกรรม
  const categoryMap: Record<string, { label: string; hours: number; count: number }> = {
    CEREMONY: { label: "พิธีการ / ปฐมนิเทศ", hours: 0, count: 0 },
    ACADEMIC: { label: "วิชาการ / สัมมนา", hours: 0, count: 0 },
    BUDDHIST: { label: "กิจกรรมพระพุทธศาสนา / ปฏิบัติธรรม", hours: 0, count: 0 },
    VOLUNTEER: { label: "จิตอาสา / บำเพ็ญประโยชน์", hours: 0, count: 0 },
    CULTURE: { label: "ทำนุบำรุงศิลปวัฒนธรรม", hours: 0, count: 0 },
    ACADEMIC_SERVICE: { label: "บริการวิชาการแก่ท้องถิ่น", hours: 0, count: 0 },
    SPORTS_HEALTH: { label: "กีฬาและส่งเสริมสุขภาพ", hours: 0, count: 0 },
    OTHER: { label: "กิจกรรมทั่วไป", hours: 0, count: 0 },
  };

  attendedRegistrations.forEach((r) => {
    const cat = r.event?.eventType || "OTHER";
    const hours = r.event?.activityHours || 0;
    if (!categoryMap[cat]) {
      categoryMap[cat] = { label: "กิจกรรมทั่วไป", hours: 0, count: 0 };
    }
    categoryMap[cat].hours += hours;
    categoryMap[cat].count += 1;
  });

  const categories = Object.entries(categoryMap).map(([key, val]) => ({
    key,
    label: val.label,
    hours: val.hours,
    count: val.count,
  }));

  const currentYear = new Date().getFullYear() + 543;
  const referenceNo = `TR-MCU-${cleanCode}-${currentYear}`;

  return {
    student: studentInfo,
    registrations,
    summary: {
      totalAttendedHours,
      totalRegisteredHours,
      attendedCount: attendedRegistrations.length,
      registeredCount: registrations.length,
      requiredHours,
      isPassed,
      progressPercent,
      categories,
      referenceNo,
      issuedDate: new Date().toISOString(),
    },
  };
}


// =============================================================
// MEDITATION PRACTICE RETREAT (10-12 DAYS) SERVICES
// =============================================================

export async function updateMeditationAttendance(
  tenantId: string,
  actorId: string,
  eventId: string,
  attendeeId: string,
  dayKey: string,
  periodId: string,
  status: "PRESENT" | "LATE" | "ABSENT" | "LEAVE" | "CLEAR",
  note?: string
) {
  const reg = await db.eventRegistration.findUnique({
    where: { id: attendeeId, tenantId, eventId },
  });
  if (!reg) throw new Error("Attendee not found");

  const currentDaily = ((reg.dailyAttendance as unknown as Record<string, Record<string, PeriodAttendanceItem>>) || {});
  const dayRecord = { ...(currentDaily[dayKey] || {}) };

  if (status === "CLEAR") {
    delete dayRecord[periodId];
  } else {
    dayRecord[periodId] = {
      status,
      note: note || "",
      updatedAt: new Date().toISOString(),
    };
  }

  const updatedDaily = {
    ...currentDaily,
    [dayKey]: dayRecord,
  };

  const updated = await db.eventRegistration.update({
    where: { id: attendeeId },
    data: { dailyAttendance: updatedDaily as unknown as Prisma.InputJsonValue },
  });

  return updated;
}

export async function batchUpdateMeditationAttendance(
  tenantId: string,
  actorId: string,
  eventId: string,
  updates: Array<{
    attendeeId: string;
    dayKey: string;
    periodId: string;
    status: "PRESENT" | "LATE" | "ABSENT" | "LEAVE" | "CLEAR";
    note?: string;
  }>
) {
  const byAttendee: Record<string, Array<{ dayKey: string; periodId: string; status: MeditationAttendanceStatus | "CLEAR"; note?: string }>> = {};
  for (const u of updates) {
    if (!byAttendee[u.attendeeId]) byAttendee[u.attendeeId] = [];
    byAttendee[u.attendeeId].push(u);
  }

  for (const [attendeeId, attendeeUpdates] of Object.entries(byAttendee)) {
    const reg = await db.eventRegistration.findUnique({
      where: { id: attendeeId, tenantId, eventId },
    });
    if (!reg) continue;

    const currentDaily = ((reg.dailyAttendance as unknown as Record<string, Record<string, PeriodAttendanceItem>>) || {});
    const updatedDaily = { ...currentDaily };

    for (const u of attendeeUpdates) {
      const dayRecord = { ...(updatedDaily[u.dayKey] || {}) };
      if (u.status === "CLEAR") {
        delete dayRecord[u.periodId];
      } else {
        dayRecord[u.periodId] = {
          status: u.status,
          note: u.note || "",
          updatedAt: new Date().toISOString(),
        };
      }
      updatedDaily[u.dayKey] = dayRecord;
    }

    await db.eventRegistration.update({
      where: { id: attendeeId },
      data: { dailyAttendance: updatedDaily as unknown as Prisma.InputJsonValue },
    });
  }

  return { success: true };
}

export async function updateAttendeeGroup(
  tenantId: string,
  actorId: string,
  attendeeId: string,
  data: {
    groupNumber?: number | null;
    groupName?: string | null;
    program?: string;
    studentName?: string;
    studentCode?: string;
    major?: string;
  }
) {
  const updated = await db.eventRegistration.update({
    where: { id: attendeeId, tenantId },
    data,
  });
  return updated;
}

export async function saveMeditationConfig(
  tenantId: string,
  actorId: string,
  eventId: string,
  config: MeditationConfig | Prisma.InputJsonValue
) {
  const updated = await db.event.update({
    where: { id: eventId, tenantId },
    data: { meditationConfig: config as unknown as Prisma.InputJsonValue },
  });
  return updated;
}

export async function seedMeditationPracticeEvent(tenantId: string, actorId: string) {
  // Check if an existing meditation event exists
  const existing = await db.event.findFirst({
    where: {
      tenantId,
      eventType: "MEDITATION",
    },
    include: { _count: { select: { registrations: true } } },
  });

  let eventId: string;

  if (!existing) {
    const newEvent = await db.event.create({
      data: {
        tenantId,
        title: "โครงการปฏิบัติวิปัสสนากัมมัฏฐานประจำปี นิสิตคณะพุทธศาสตร์ (Annual Meditation Practice)",
        description: "โครงการปฏิบัติวิปัสสนากัมมัฏฐานประจำปี สำหรับนิสิตคณะพุทธศาสตร์ ชั้นปีที่ 1 - 4 ทั้งหลักสูตรภาษาไทยและภาษาอังกฤษ รวมระยะเวลา 12 วัน ณ อาคารปฏิบัติธรรมโพธิญาณมหาวิชชาลัย ต.ศาลายา อ.พุทธมณฑล จ.นครปฐม",
        location: "ณ อาคารปฏิบัติธรรมโพธิญาณมหาวิชชาลัย ต.ศาลายา อ.พุทธมณฑล จ.นครปฐม",
        startDate: new Date("2025-12-11T00:00:00+07:00"),
        endDate: new Date("2025-12-22T23:59:59+07:00"),
        capacity: 200,
        isActive: true,
        academicYear: "2568",
        activityHours: 72,
        eventType: "MEDITATION",
        targetGroup: "FACULTY",
        meditationConfig: DEFAULT_MEDITATION_CONFIG as unknown as Prisma.InputJsonValue,
      },
    });
    eventId = newEvent.id;
  } else {
    eventId = existing.id;
    if (!existing.meditationConfig) {
      await db.event.update({
        where: { id: existing.id },
        data: { meditationConfig: DEFAULT_MEDITATION_CONFIG as unknown as Prisma.InputJsonValue },
      });
    }
  }

  // Check if registrations already seeded
  const currentRegCount = await db.eventRegistration.count({
    where: { tenantId, eventId },
  });

  if (currentRegCount === 0) {
    const allAttendees = [...SAMPLE_ENGLISH_ATTENDEES, ...SAMPLE_THAI_ATTENDEES];
    const periods = ["p1", "p2", "p3", "p4"];
    
    for (const att of allAttendees) {
      const day1Att: Record<string, PeriodAttendanceItem> = {};
      
      if (att.studentCode === "T105") {
        day1Att["p1"] = { status: "LATE", note: "มาสาย 10 นาที" };
        day1Att["p2"] = { status: "PRESENT" };
        day1Att["p3"] = { status: "PRESENT" };
        day1Att["p4"] = { status: "PRESENT" };
      } else if (att.studentCode === "T208") {
        day1Att["p1"] = { status: "PRESENT" };
        day1Att["p2"] = { status: "PRESENT" };
        day1Att["p3"] = { status: "ABSENT", note: "ไม่ได้มาลงชื่อ" };
        day1Att["p4"] = { status: "PRESENT" };
      } else if (att.studentCode === "T307") {
        day1Att["p1"] = { status: "PRESENT" };
        day1Att["p2"] = { status: "LEAVE", note: "ปวดศีรษะ พักห้องพยาบาล" };
        day1Att["p3"] = { status: "LEAVE", note: "ปวดศีรษะ" };
        day1Att["p4"] = { status: "PRESENT" };
      } else if (att.studentCode === "E1202") {
        day1Att["p1"] = { status: "PRESENT" };
        day1Att["p2"] = { status: "LATE", note: "Late 5 mins" };
        day1Att["p3"] = { status: "PRESENT" };
        day1Att["p4"] = { status: "PRESENT" };
      } else if (att.studentCode === "E1209") {
        day1Att["p1"] = { status: "PRESENT" };
        day1Att["p2"] = { status: "PRESENT" };
        day1Att["p3"] = { status: "PRESENT" };
        day1Att["p4"] = { status: "ABSENT", note: "Missed evening session" };
      } else {
        periods.forEach(p => {
          day1Att[p] = { status: "PRESENT" };
        });
      }

      await db.eventRegistration.create({
        data: {
          tenantId,
          eventId: eventId,
          studentCode: att.studentCode,
          studentName: att.studentName,
          major: att.major,
          role: att.role,
          yearLevel: att.yearLevel,
          department: att.department,
          groupNumber: att.groupNumber,
          groupName: att.groupName,
          program: att.program,
          status: "ATTENDED",
          dailyAttendance: {
            day_1: day1Att,
          } as unknown as Prisma.InputJsonValue,
        },
      });
    }
  }

  await writeAudit({
    tenantId,
    actorId,
    action: "events.meditation.seed",
    entity: "Event",
    entityId: eventId,
  });

  return { success: true, eventId };
}
