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
    ["7a9bdc2b-f9c9-421c-9c3e-dbfb0ef5dfab", demoTenant ? demoTenant.id : mcuTenant.id],
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
  const sessionIdMap = new Map<string, string>();

  // 1. Students
  for (const st of data.students || []) {
    const tId = resolveTenantId(st.tenantId);
    const studentData = { ...st, tenantId: tId };
    const saved = await prisma.student.upsert({
      where: { tenantId_studentCode: { tenantId: tId, studentCode: st.studentCode } },
      create: studentData,
      update: studentData,
    });
    studentIdMap.set(st.id, saved.id);
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
    const courseData = { ...c, tenantId: tId, primaryTeacherId: safeTeacherId };
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
      create: courseData,
      update: courseData,
    });
    courseIdMap.set(c.id, saved.id);
  }

  // 3. CourseTeachers
  for (const ct of data.courseTeachers || []) {
    const tId = resolveTenantId(ct.tenantId);
    const targetCourseId = courseIdMap.get(ct.courseId) || ct.courseId;
    const safeUserId = userSet.has(ct.userId) ? ct.userId : adminUser.id;
    await prisma.courseTeacher.upsert({
      where: { courseId_userId: { courseId: targetCourseId, userId: safeUserId } },
      create: { ...ct, tenantId: tId, courseId: targetCourseId, userId: safeUserId },
      update: { ...ct, tenantId: tId, courseId: targetCourseId, userId: safeUserId },
    });
  }

  // 4. Enrollments
  for (const enr of data.courseEnrollments || []) {
    const tId = resolveTenantId(enr.tenantId);
    const targetCourseId = courseIdMap.get(enr.courseId) || enr.courseId;
    const targetStudentId = studentIdMap.get(enr.studentId) || enr.studentId;
    await prisma.courseEnrollment.upsert({
      where: {
        courseId_studentId: {
          courseId: targetCourseId,
          studentId: targetStudentId,
        },
      },
      create: { ...enr, tenantId: tId, courseId: targetCourseId, studentId: targetStudentId },
      update: { ...enr, tenantId: tId, courseId: targetCourseId, studentId: targetStudentId },
    });
  }

  // 5. ClassSessions
  for (const cs of data.classSessions || []) {
    const tId = resolveTenantId(cs.tenantId);
    const targetCourseId = courseIdMap.get(cs.courseId) || cs.courseId;
    const saved = await prisma.classSession.upsert({
      where: {
        courseId_sessionNumber: {
          courseId: targetCourseId,
          sessionNumber: cs.sessionNumber,
        },
      },
      create: { ...cs, tenantId: tId, courseId: targetCourseId },
      update: { ...cs, tenantId: tId, courseId: targetCourseId },
    });
    sessionIdMap.set(cs.id, saved.id);
  }

  // 6. AttendanceRecords
  for (const ar of data.attendanceRecords || []) {
    const tId = resolveTenantId(ar.tenantId);
    const targetSessionId = sessionIdMap.get(ar.sessionId) || ar.sessionId;
    await prisma.attendanceRecord.upsert({
      where: {
        sessionId_studentCode: {
          sessionId: targetSessionId,
          studentCode: ar.studentCode,
        },
      },
      create: { ...ar, tenantId: tId, sessionId: targetSessionId },
      update: { ...ar, tenantId: tId, sessionId: targetSessionId },
    });
  }

  // 7. AuditLogs
  for (const al of data.attendanceAuditLogs || []) {
    const tId = resolveTenantId(al.tenantId);
    const targetSessionId = al.sessionId ? sessionIdMap.get(al.sessionId) || al.sessionId : null;
    await prisma.attendanceAuditLog.upsert({
      where: { id: al.id },
      create: { ...al, tenantId: tId, sessionId: targetSessionId },
      update: { ...al, tenantId: tId, sessionId: targetSessionId },
    });
  }

  // 8. CertificateTypes
  for (const ct of data.certificateTypes || []) {
    const tId = resolveTenantId(ct.tenantId);
    const ctData = { ...ct, tenantId: tId };
    await prisma.certificateType.upsert({
      where: { id: ct.id },
      create: ctData,
      update: ctData,
    });
  }

  // 9. CertificateRequests
  for (const cr of data.certificateRequests || []) {
    const tId = resolveTenantId(cr.tenantId);
    const safeUserId = userSet.has(cr.userId) ? cr.userId : adminUser.id;
    const crData = { ...cr, tenantId: tId, userId: safeUserId };
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

  console.log("\n✅ กู้คืนข้อมูลเสร็จสมบูรณ์เรียบร้อยแล้ว!");
  await prisma.$disconnect();
}

runRestore().catch((e) => {
  console.error("❌ เกิดข้อผิดพลาดในการกู้คืนข้อมูล:", e);
  process.exit(1);
});
