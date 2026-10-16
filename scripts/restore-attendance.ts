import { PrismaClient } from "../src/generated/prisma";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function runRestore() {
  const backupDir = path.join(__dirname, "..", "backups", "attendance");
  if (!fs.existsSync(backupDir)) {
    console.error(" ไม่พบโฟลเดอร์สำรองข้อมูล:", backupDir);
    process.exit(1);
  }

  // หาไฟล์ snapshot ล่าสุด
  const files = fs
    .readdirSync(backupDir)
    .filter((f) => f.startsWith("attendance_snapshot_") && f.endsWith(".json"))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.error(" ไม่พบไฟล์สำรองข้อมูลใน", backupDir);
    process.exit(1);
  }

  const targetFile = path.join(backupDir, files[0]);
  console.log(`=== กำลังกู้คืนข้อมูลจาก Snapshot ล่าสุด: ${files[0]} ===`);

  const content = JSON.parse(fs.readFileSync(targetFile, "utf-8"));
  const { data } = content;

  // กู้คืนข้อมูลตามลำดับความสัมพันธ์ของฐานข้อมูล (ForeignKey Dependencies)
  // 1. Students
  for (const st of data.students || []) {
    await prisma.student.upsert({
      where: { tenantId_studentCode: { tenantId: st.tenantId, studentCode: st.studentCode } },
      create: st,
      update: st,
    });
  }

  // 2. Courses
  for (const c of data.courses || []) {
    await prisma.course.upsert({
      where: { id: c.id },
      create: c,
      update: c,
    });
  }

  // 3. CourseTeachers
  for (const ct of data.courseTeachers || []) {
    await prisma.courseTeacher.upsert({
      where: { courseId_userId: { courseId: ct.courseId, userId: ct.userId } },
      create: ct,
      update: ct,
    });
  }

  // 4. Enrollments
  for (const enr of data.courseEnrollments || []) {
    await prisma.courseEnrollment.upsert({
      where: { courseId_studentId: { courseId: enr.courseId, studentId: enr.studentId } },
      create: enr,
      update: enr,
    });
  }

  // 5. ClassSessions
  for (const cs of data.classSessions || []) {
    await prisma.classSession.upsert({
      where: { courseId_sessionNumber: { courseId: cs.courseId, sessionNumber: cs.sessionNumber } },
      create: cs,
      update: cs,
    });
  }

  // 6. AttendanceRecords
  for (const ar of data.attendanceRecords || []) {
    await prisma.attendanceRecord.upsert({
      where: { sessionId_studentCode: { sessionId: ar.sessionId, studentCode: ar.studentCode } },
      create: ar,
      update: ar,
    });
  }

  // 7. AuditLogs
  for (const al of data.attendanceAuditLogs || []) {
    await prisma.attendanceAuditLog.upsert({
      where: { id: al.id },
      create: al,
      update: al,
    });
  }

  console.log("\n กู้คืนข้อมูลเสร็จสมบูรณ์เรียบร้อยแล้ว!");
  await prisma.$disconnect();
}

runRestore().catch((e) => {
  console.error(" เกิดข้อผิดพลาดในการกู้คืนข้อมูล:", e);
  process.exit(1);
});
