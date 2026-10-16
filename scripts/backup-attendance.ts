import { PrismaClient } from "../src/generated/prisma";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function runBackup() {
  console.log("=== เริ่มต้นสำรองข้อมูลระบบตรวจสอบเวลาเรียน (Student Attendance Backup) ===");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(__dirname, "..", "backups", "attendance");

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupFile = path.join(backupDir, `attendance_snapshot_${timestamp}.json`);

  const [
    courses,
    courseTeachers,
    students,
    courseEnrollments,
    classSessions,
    attendanceRecords,
    attendanceAuditLogs,
  ] = await Promise.all([
    prisma.course.findMany(),
    prisma.courseTeacher.findMany(),
    prisma.student.findMany(),
    prisma.courseEnrollment.findMany(),
    prisma.classSession.findMany(),
    prisma.attendanceRecord.findMany(),
    prisma.attendanceAuditLog.findMany(),
  ]);

  const backupData = {
    exportedAt: new Date().toISOString(),
    version: "2.0-OptionB",
    counts: {
      courses: courses.length,
      courseTeachers: courseTeachers.length,
      students: students.length,
      courseEnrollments: courseEnrollments.length,
      classSessions: classSessions.length,
      attendanceRecords: attendanceRecords.length,
      attendanceAuditLogs: attendanceAuditLogs.length,
    },
    data: {
      courses,
      courseTeachers,
      students,
      courseEnrollments,
      classSessions,
      attendanceRecords,
      attendanceAuditLogs,
    },
  };

  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), "utf-8");

  console.log(`\n สำรองข้อมูลสำเร็จ! ไฟล์ถูกบันทึกที่:`);
  console.log(`-> ${backupFile}\n`);
  console.log("สรุปรายการข้อมูลที่สำรอง:");
  console.table(backupData.counts);

  await prisma.$disconnect();
}

runBackup().catch((e) => {
  console.error(" เกิดข้อผิดพลาดในการสำรองข้อมูล:", e);
  process.exit(1);
});
