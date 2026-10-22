import { PrismaClient } from "../src/generated/prisma";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function runRestore() {
  const backupDir = path.join(__dirname, "..", "backups", "attendance");
  if (!fs.existsSync(backupDir)) {
    console.error("❌ ไม่พบโฟลเดอร์สำรองข้อมูล:", backupDir);
    process.exit(1);
  }

  // หาไฟล์ snapshot ล่าสุด
  const files = fs
    .readdirSync(backupDir)
    .filter((f) => f.startsWith("attendance_snapshot_") && f.endsWith(".json"))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.error("❌ ไม่พบไฟล์สำรองข้อมูลใน", backupDir);
    process.exit(1);
  }

  const targetFile = path.join(backupDir, files[0]);
  console.log(`=== กำลังกู้คืนข้อมูลจาก Snapshot ล่าสุด: ${files[0]} ===`);

  const content = JSON.parse(fs.readFileSync(targetFile, "utf-8"));
  const { data } = content;

  // หา tenant MCU และ DEMO ปัจจุบัน
  const mcuTenant = await prisma.tenant.findUnique({ where: { code: "MCU" } });
  const demoTenant = await prisma.tenant.findUnique({ where: { code: "DEMO" } });
  if (!mcuTenant) {
    console.error("❌ ไม่พบ Tenant MCU ในฐานข้อมูล กรุณารัน npm run db:seed ก่อน");
    process.exit(1);
  }

  const tenantIdMap = new Map<string, string>([
    ["b8eef236-b993-4bc9-a08c-b02935131b84", mcuTenant.id],
    ["a56a0b87-0904-4c50-a247-9f62f03c221e", mcuTenant.id],
    ["7a9bdc2b-f9c9-421c-9c3e-dbfb0ef5dfab", demoTenant ? demoTenant.id : mcuTenant.id],
    ["21742791-c9d0-4ccc-833d-1c61b70b4673", demoTenant ? demoTenant.id : mcuTenant.id],
  ]);

  const resolveTenantId = (oldId?: string) => (oldId && tenantIdMap.get(oldId)) || mcuTenant.id;

  // หา User สำรองสำหรับผูก Foreign Key
  const adminUser =
    (await prisma.user.findFirst({ where: { email: "admin@buddhist.mcu.ac.th" } })) ||
    (await prisma.user.findFirst());
  if (!adminUser) {
    console.error("❌ ไม่พบ User ในระบบ กรุณารัน npm run db:seed ก่อน");
    process.exit(1);
  }

  const existingUsers = await prisma.user.findMany({ select: { id: true } });
  const userSet = new Set(existingUsers.map((u) => u.id));

  const studentIdMap = new Map<string, string>();
  const courseIdMap = new Map<string, string>();
  const enrollmentIdMap = new Map<string, string>();
  const sessionIdMap = new Map<string, string>();
  const certTypeIdMap = new Map<string, string>();

  // 1. Students
  for (const st of data.students || []) {
    const tId = resolveTenantId(st.tenantId);
    const { id: oldId, ...restSt } = st;
    const studentPayload = { ...restSt, tenantId: tId };
    const saved = await prisma.student.upsert({
      where: { tenantId_studentCode: { tenantId: tId, studentCode: st.studentCode } },
      create: studentPayload,
      update: studentPayload,
    });
    studentIdMap.set(oldId, saved.id);
  }

  // 2. Courses
  for (const c of data.courses || []) {
    const tId = resolveTenantId(c.tenantId);
    const safeTeacherId =
      c.primaryTeacherId && userSet.has(c.primaryTeacherId)
        ? c.primaryTeacherId
        : c.primaryTeacherId
          ? adminUser.id
          : null;
    const { id: oldCourseId, ...restCourse } = c;
    const coursePayload = { ...restCourse, tenantId: tId, primaryTeacherId: safeTeacherId };
    const saved = await prisma.course.upsert({
      where: {
        tenantId_courseCode_academicYear_semester_section: {
          tenantId: tId,
          courseCode: c.courseCode,
          academicYear: c.academicYear,
          semester: c.semester,
          section: c.section,
        },
      },
      create: coursePayload,
      update: coursePayload,
    });
    courseIdMap.set(oldCourseId, saved.id);
  }

  // 3. CourseTeachers
  for (const ct of data.courseTeachers || []) {
    const tId = resolveTenantId(ct.tenantId);
    const targetCourseId = courseIdMap.get(ct.courseId) || ct.courseId;
    const safeUserId = userSet.has(ct.userId) ? ct.userId : adminUser.id;
    const { id: _ctId, ...restCt } = ct;
    await prisma.courseTeacher.upsert({
      where: { courseId_userId: { courseId: targetCourseId, userId: safeUserId } },
      create: { ...restCt, tenantId: tId, courseId: targetCourseId, userId: safeUserId },
      update: { ...restCt, tenantId: tId, courseId: targetCourseId, userId: safeUserId },
    });
  }

  // 4. Enrollments
  for (const enr of data.courseEnrollments || []) {
    const tId = resolveTenantId(enr.tenantId);
    const targetCourseId = courseIdMap.get(enr.courseId) || enr.courseId;
    const targetStudentId = studentIdMap.get(enr.studentId) || enr.studentId;
    const { id: oldEnrId, ...restEnr } = enr;
    const savedEnr = await prisma.courseEnrollment.upsert({
      where: {
        courseId_studentId: {
          courseId: targetCourseId,
          studentId: targetStudentId,
        },
      },
      create: { ...restEnr, tenantId: tId, courseId: targetCourseId, studentId: targetStudentId },
      update: { ...restEnr, tenantId: tId, courseId: targetCourseId, studentId: targetStudentId },
    });
    enrollmentIdMap.set(oldEnrId, savedEnr.id);
  }

  // 5. ClassSessions
  for (const cs of data.classSessions || []) {
    const tId = resolveTenantId(cs.tenantId);
    const targetCourseId = courseIdMap.get(cs.courseId) || cs.courseId;
    const { id: oldCsId, ...restCs } = cs;
    const saved = await prisma.classSession.upsert({
      where: {
        courseId_sessionNumber: {
          courseId: targetCourseId,
          sessionNumber: cs.sessionNumber,
        },
      },
      create: { ...restCs, tenantId: tId, courseId: targetCourseId },
      update: { ...restCs, tenantId: tId, courseId: targetCourseId },
    });
    sessionIdMap.set(oldCsId, saved.id);
  }

  // 6. AttendanceRecords
  for (const ar of data.attendanceRecords || []) {
    const tId = resolveTenantId(ar.tenantId);
    const targetSessionId = sessionIdMap.get(ar.sessionId) || ar.sessionId;
    const targetEnrollmentId = ar.enrollmentId
      ? enrollmentIdMap.get(ar.enrollmentId) || null
      : null;
    const { id: _arId, ...restAr } = ar;
    await prisma.attendanceRecord.upsert({
      where: {
        sessionId_studentCode: {
          sessionId: targetSessionId,
          studentCode: ar.studentCode,
        },
      },
      create: {
        ...restAr,
        tenantId: tId,
        sessionId: targetSessionId,
        enrollmentId: targetEnrollmentId,
      },
      update: {
        ...restAr,
        tenantId: tId,
        sessionId: targetSessionId,
        enrollmentId: targetEnrollmentId,
      },
    });
  }

  // 7. AuditLogs
  for (const al of data.attendanceAuditLogs || []) {
    const tId = resolveTenantId(al.tenantId);
    const targetSessionId = al.sessionId ? sessionIdMap.get(al.sessionId) || al.sessionId : null;
    if (!targetSessionId) continue;
    const safeActorId = al.actorId && userSet.has(al.actorId) ? al.actorId : adminUser.id;
    await prisma.attendanceAuditLog.upsert({
      where: { id: al.id },
      create: { ...al, tenantId: tId, sessionId: targetSessionId, actorId: safeActorId },
      update: { ...al, tenantId: tId, sessionId: targetSessionId, actorId: safeActorId },
    });
  }

  // 8. CertificateTypes (ป้องกันการสร้างประเภทหนังสือรับรองซ้ำชื่อเดียวกันใน Tenant เดียวกัน)
  for (const ct of data.certificateTypes || []) {
    const tId = resolveTenantId(ct.tenantId);
    const existingByName = await prisma.certificateType.findFirst({
      where: { tenantId: tId, name: ct.name },
    });
    if (existingByName) {
      certTypeIdMap.set(ct.id, existingByName.id);
    } else {
      const ctData = { ...ct, tenantId: tId };
      const savedCt = await prisma.certificateType.upsert({
        where: { id: ct.id },
        create: ctData,
        update: ctData,
      });
      certTypeIdMap.set(ct.id, savedCt.id);
    }
  }

  // 9. CertificateRequests (ป้องกันการสร้างคำร้องซ้ำซ้อน)
  for (const cr of data.certificateRequests || []) {
    const tId = resolveTenantId(cr.tenantId);
    const safeUserId = userSet.has(cr.userId) ? cr.userId : adminUser.id;
    const targetCertTypeId = certTypeIdMap.get(cr.certificateTypeId) || cr.certificateTypeId;
    const existingReq = await prisma.certificateRequest.findFirst({
      where: {
        tenantId: tId,
        certificateTypeId: targetCertTypeId,
        note: cr.note,
      },
    });
    if (existingReq && existingReq.id !== cr.id) {
      continue;
    }
    const crData = {
      ...cr,
      tenantId: tId,
      userId: safeUserId,
      certificateTypeId: targetCertTypeId,
    };
    await prisma.certificateRequest.upsert({
      where: { id: cr.id },
      create: crData,
      update: crData,
    });
  }

  // 10. AdminDocuments
  for (const doc of data.adminDocuments || []) {
    const tId = resolveTenantId(doc.tenantId);
    const docData = { ...doc, tenantId: tId };
    await prisma.adminDocument.upsert({
      where: { id: doc.id },
      create: docData,
      update: docData,
    });
  }

  console.log(
    `\n✅ กู้คืนข้อมูลเสร็จสมบูรณ์เรียบร้อยแล้ว! (Students: ${(data.students || []).length}, Courses: ${(data.courses || []).length}, Enrollments: ${(data.courseEnrollments || []).length}, Documents: ${(data.adminDocuments || []).length}, Certificates: ${(data.certificateRequests || []).length})`
  );
  await prisma.$disconnect();
}

runRestore().catch((e) => {
  console.error("❌ เกิดข้อผิดพลาดในการกู้คืนข้อมูล:", e);
  process.exit(1);
});
