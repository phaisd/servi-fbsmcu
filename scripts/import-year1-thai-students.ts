import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

interface RawThaiStudent {
  code: string;
  title: string;
  firstName: string;
  lastName: string;
  major: "พระพุทธศาสนา" | "วิปัสสนาภาวนา" | "ศาสนาและปรัชญา" | "บาลีสันสกฤต";
  notes?: string;
  gender: "ชาย" | "หญิง";
}

const YEAR_1_THAI_STUDENTS: RawThaiStudent[] = [
  // 1. สาขาวิชาพระพุทธศาสนา (7 คน)
  { code: "6901501003", title: "สามเณร", firstName: "พงศกร", lastName: "สอนเเก้ว", major: "พระพุทธศาสนา", gender: "ชาย" },
  { code: "6901501004", title: "นาย", firstName: "ศิรภพ", lastName: "สนิทใจ", major: "พระพุทธศาสนา", gender: "ชาย" },
  { code: "6901501049", title: "พระ", firstName: "ธเนศ", lastName: "กตปุญโญ", major: "พระพุทธศาสนา", gender: "ชาย" },
  { code: "6901501050", title: "สามเณร", firstName: "ฉันทพัฒน์", lastName: "อินทร์ชัยศรี", major: "พระพุทธศาสนา", gender: "ชาย" },
  { code: "6901501051", title: "นาย", firstName: "รชตะ", lastName: "อาโปพิบูลย์ เรืองผล", major: "พระพุทธศาสนา", gender: "ชาย" },
  { code: "6901501095", title: "พระ", firstName: "พิรุณชัย", lastName: "ธมฺมธโร", major: "พระพุทธศาสนา", gender: "ชาย" },
  { code: "6801504141", title: "พระมหา", firstName: "นิพิฐ", lastName: "ธมฺมานนฺโท", major: "พระพุทธศาสนา", notes: "ย้ายมา", gender: "ชาย" },

  // 2. สาขาวิชาวิปัสสนาภาวนา (3 คน)
  { code: "6901501091", title: "พระ", firstName: "กิติศักดิ์", lastName: "กิตฺติสกฺโก", major: "วิปัสสนาภาวนา", gender: "ชาย" },
  { code: "6901501092", title: "พระ", firstName: "ธนพล", lastName: "กตสาโร", major: "วิปัสสนาภาวนา", gender: "ชาย" },
  { code: "6901501094", title: "นาย", firstName: "คณาวุฒิ", lastName: "มณีโชติ", major: "วิปัสสนาภาวนา", gender: "ชาย" },

  // 3. สาขาวิชาศาสนาและปรัชญา (4 คน)
  { code: "6901501052", title: "พระ", firstName: "ศิวาพัชร์", lastName: "ถาวรจิตฺโต", major: "ศาสนาและปรัชญา", gender: "ชาย" },
  { code: "6901501098", title: "Ven.", firstName: "Dhammasiri", lastName: "-", major: "ศาสนาและปรัชญา", gender: "ชาย" },
  { code: "6901501099", title: "นาย", firstName: "ชัยมงคล", lastName: "ทองศรี", major: "ศาสนาและปรัชญา", gender: "ชาย" },
  { code: "6901501100", title: "นางสาว", firstName: "อรพรรณ", lastName: "สุภิษะ", major: "ศาสนาและปรัชญา", gender: "หญิง" },

  // 4. สาขาวิชาบาลีสันสกฤต (1 คน)
  { code: "6901501054", title: "พระ", firstName: "ติณณ์วิพัฒน์", lastName: "จิรฎฺฐิโก", major: "บาลีสันสกฤต", gender: "ชาย" },
];

interface CourseSeedDef {
  courseCode: string;
  courseName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
  instructorName: string;
  targetMajor: "ALL" | "พระพุทธศาสนา" | "วิปัสสนาภาวนา" | "ศาสนาและปรัชญา" | "บาลีสันสกฤต";
}

const YEAR_1_COURSES: CourseSeedDef[] = [
  // Common Courses (เรียนรวมทุกสาขา)
  { courseCode: "000 237", courseName: "ประวัติพระพุทธศาสนา", dayOfWeek: 1, startTime: "09.00", endTime: "11.30", room: "อาคารเรียนรวม ชั้น 5 ห้อง D 516/1", instructorName: "พระครูสิริรัตนบัณฑิต, ผศ.ดร.", targetMajor: "ALL" },
  { courseCode: "000 206", courseName: "คณิตศาสตร์และสถิติเพื่อการวิจัย", dayOfWeek: 1, startTime: "12.30", endTime: "15.10", room: "อาคารเรียนรวม ชั้น 5 ห้อง D 516/1", instructorName: "พระมหามงคลกานต์ ฐิตธมฺโม, รศ.ดร.", targetMajor: "ALL" },
  { courseCode: "000 239", courseName: "ธรรมะภาคภาษาอังกฤษ", dayOfWeek: 2, startTime: "09.00", endTime: "11.30", room: "อาคารเรียนรวม ชั้น 5 ห้อง D 516/1", instructorName: "พระสุขีศม สีลเตชปุตฺติโย, อ.ดร.", targetMajor: "ALL" },
  { courseCode: "000 204", courseName: "ภาษาอังกฤษเพื่อการสื่อสาร", dayOfWeek: 2, startTime: "12.30", endTime: "15.10", room: "อาคารเรียนรวม ชั้น 5 ห้อง D 516/1", instructorName: "ผศ.ดร.ธนาธิป ฮาดเนาลี", targetMajor: "ALL" },
  { courseCode: "SP 102", courseName: "บาลี ๒ (รายวิชาพื้นฐาน/เสริมพื้นฐาน)", dayOfWeek: 4, startTime: "09.00", endTime: "11.30", room: "อาคารเรียนรวม ชั้น 5 ห้อง D 516/1", instructorName: "พระครูศรีสิทธิบัณฑิต, อ.ดร.", targetMajor: "ALL" },

  // เฉพาะสาขาวิชาพระพุทธศาสนา
  { courseCode: "101 102", courseName: "พระพุทธศาสนากับสังคมสงเคราะห์", dayOfWeek: 3, startTime: "09.00", endTime: "11.30", room: "อาคารเรียนรวม ชั้น 5 ห้อง D 516/1", instructorName: "พระมหาจีรวัฒน์ กนฺตวณฺโณ, รศ.ดร.", targetMajor: "พระพุทธศาสนา" },
  { courseCode: "101 104", courseName: "ศึกษาศาสตร์ในพระไตรปิฎก", dayOfWeek: 3, startTime: "12.30", endTime: "15.10", room: "อาคารเรียนรวม ชั้น 5 ห้อง D 516/1", instructorName: "พระมหาวีรเดช อธิปญฺโญ, อ.ดร.", targetMajor: "พระพุทธศาสนา" },

  // เฉพาะสาขาวิชาวิปัสสนาภาวนา
  { courseCode: "111 103", courseName: "วิปัสสนากรรมฐานนิเทศ", dayOfWeek: 3, startTime: "09.00", endTime: "11.30", room: "อาคารเรียนรวม ชั้น 2 ห้อง D 220/1", instructorName: "พระครูพิศิษฐ์ธรรมพิสุทธิ์, อ.ดร.", targetMajor: "วิปัสสนาภาวนา" },
  { courseCode: "111 104", courseName: "ปรมัตถธรรมนิเทศ", dayOfWeek: 3, startTime: "12.30", endTime: "15.10", room: "อาคารเรียนรวม ชั้น 2 ห้อง D 220/1", instructorName: "พระมหาไพโรจน์ ญาณกุสโล, อ.ดร.", targetMajor: "วิปัสสนาภาวนา" },

  // เฉพาะสาขาวิชาศาสนาและปรัชญา
  { courseCode: "112 311", courseName: "การเคลื่อนไหวใหม่ทางศาสนา", dayOfWeek: 3, startTime: "09.00", endTime: "11.30", room: "ห้อง D 323, 220/2", instructorName: "ผศ.ดร.คงสฤษฎ์ แพงทรัพย์", targetMajor: "ศาสนาและปรัชญา" },
  { courseCode: "112 304", courseName: "สุนทรียศาสตร์", dayOfWeek: 3, startTime: "12.30", endTime: "15.10", room: "ห้อง D 323, 220/2", instructorName: "พระจาตุรงค์ อาจารสุโภ, ผศ.ดร.", targetMajor: "ศาสนาและปรัชญา" },

  // เฉพาะสาขาวิชาบาลีสันสกฤต
  { courseCode: "108 103", courseName: "บาลีไวยากรณ์เบื้องต้น", dayOfWeek: 3, startTime: "09.00", endTime: "11.30", room: "อาคารเรียนรวม ชั้น 5 ห้อง D516", instructorName: "พระครูศรีสิทธิบัณฑิต, อ.ดร.", targetMajor: "บาลีสันสกฤต" },
  { courseCode: "108 104", courseName: "ไวยากรณ์สันสกฤตเบื้องต้น", dayOfWeek: 3, startTime: "12.30", endTime: "15.10", room: "อาคารเรียนรวม ชั้น 5 ห้อง D516", instructorName: "อ.ดร.สุดาพร เขียวงามดี", targetMajor: "บาลีสันสกฤต" },
];

async function main() {
  console.log("=== เริ่มต้นนำเข้ารายชื่อนิสิต ชั้นปีที่ 1 ภาคภาษาไทย (15 คน) ===");

  const tenants = await db.tenant.findMany();
  console.log(`พบ ${tenants.length} tenants ในระบบ`);

  const hashedPassword = await bcrypt.hash("Teacher1234!", 10);

  for (const tenant of tenants) {
    console.log(`\n--- ดำเนินการกับ Tenant: ${tenant.nameTh} (${tenant.code}) ---`);

    // 1. บันทึกข้อมูลนิสิตปี 1 เข้า Student table
    let studentCount = 0;
    for (const item of YEAR_1_THAI_STUDENTS) {
      const department =
        item.major === "ศาสนาและปรัชญา"
          ? "ภาควิชาศาสนาและปรัชญา"
          : "ภาควิชาพระพุทธศาสนา";
      const curriculumName = `พุทธศาสตรบัณฑิต สาขาวิชา${item.major}`;

      await db.student.upsert({
        where: {
          tenantId_studentCode: {
            tenantId: tenant.id,
            studentCode: item.code,
          },
        },
        create: {
          tenantId: tenant.id,
          studentCode: item.code,
          title: item.title,
          firstName: item.firstName,
          lastName: item.lastName,
          yearLevel: 1,
          degree: "ปริญญาตรี",
          curriculumName,
          department,
          major: item.major,
          gender: item.gender,
          studyStatus: item.notes ? item.notes : "ปกติ",
          faculty: "คณะพุทธศาสตร์",
          isActive: true,
        },
        update: {
          title: item.title,
          firstName: item.firstName,
          lastName: item.lastName,
          yearLevel: 1,
          degree: "ปริญญาตรี",
          curriculumName,
          department,
          major: item.major,
          gender: item.gender,
          studyStatus: item.notes ? item.notes : "ปกติ",
          isActive: true,
        },
      });
      studentCount++;
    }
    console.log(`  ✓ บันทึกข้อมูลนิสิตปี 1: ${studentCount} คน`);

    // 2. หา Role อาจารย์สำหรับ Tenant นี้
    const teacherRole = await db.role.findFirst({
      where: { tenantId: tenant.id, code: "TEACHER" },
    });

    for (const cDef of YEAR_1_COURSES) {
      // 2.1 หาหรือสร้าง User อาจารย์
      const teacherEmail = `t69.${cDef.courseCode.replace(/\s+/g, "").toLowerCase()}@mcu.ac.th`;

      let teacherUser = await db.user.findFirst({
        where: { email: teacherEmail },
      });

      if (!teacherUser) {
        teacherUser = await db.user.create({
          data: {
            email: teacherEmail,
            name: cDef.instructorName,
            passwordHash: hashedPassword,
            isActive: true,
          },
        });
      }

      // ผูก UserTenant
      const userTenant = await db.userTenant.upsert({
        where: {
          userId_tenantId: {
            userId: teacherUser.id,
            tenantId: tenant.id,
          },
        },
        create: {
          userId: teacherUser.id,
          tenantId: tenant.id,
          isActive: true,
        },
        update: {
          isActive: true,
        },
      });

      // ผูก UserRole
      if (teacherRole) {
        const existRole = await db.userRole.findFirst({
          where: {
            userTenantId: userTenant.id,
            roleId: teacherRole.id,
          },
        });
        if (!existRole) {
          await db.userRole.create({
            data: {
              userTenantId: userTenant.id,
              roleId: teacherRole.id,
              scopeType: "ALL",
            },
          });
        }
      }

      // 2.2 หาหรือสร้าง Course
      let course = await db.course.findFirst({
        where: {
          tenantId: tenant.id,
          courseCode: cDef.courseCode,
          academicYear: "2569",
          semester: 2,
          section: "1",
        },
      });

      if (!course) {
        course = await db.course.create({
          data: {
            tenantId: tenant.id,
            courseCode: cDef.courseCode,
            courseName: cDef.courseName,
            credits: 3,
            section: "1",
            term: "2/2569",
            academicYear: "2569",
            semester: 2,
            targetSessions: 16,
            room: cDef.room,
            dayOfWeek: cDef.dayOfWeek,
            startTime: cDef.startTime,
            endTime: cDef.endTime,
            primaryTeacherId: teacherUser.id,
            status: "ACTIVE",
          },
        });

        // กำหนดอาจารย์ผู้สอน
        await db.courseTeacher.upsert({
          where: {
            courseId_userId: {
              courseId: course.id,
              userId: teacherUser.id,
            },
          },
          create: {
            tenantId: tenant.id,
            courseId: course.id,
            userId: teacherUser.id,
            isPrimary: true,
            role: "TEACHER",
          },
          update: {},
        });

        // สร้าง 16 คาบเรียนอัตโนมัติ (เริ่ม 2 พ.ย. 2569)
        const termStart = new Date("2026-11-02T09:00:00Z");
        const dayOffset = (cDef.dayOfWeek - 1);
        termStart.setDate(termStart.getDate() + dayOffset);

        for (let sNum = 1; sNum <= 16; sNum++) {
          const sDate = new Date(termStart);
          sDate.setDate(termStart.getDate() + (sNum - 1) * 7);

          await db.classSession.create({
            data: {
              tenantId: tenant.id,
              courseId: course.id,
              sessionNumber: sNum,
              date: sDate,
              startTime: cDef.startTime,
              endTime: cDef.endTime,
              room: cDef.room,
              topic: `คาบเรียนที่ ${sNum}: ${cDef.courseName}`,
              sessionType: "REGULAR",
              status: "SCHEDULED",
              isCounted: true,
            },
          });
        }
      }

      // 3. ลงทะเบียนนิสิตที่ตรงตามสาขาวิชา (Enrollment)
      let eligibleCodes: string[] = [];
      if (cDef.targetMajor === "ALL") {
        eligibleCodes = YEAR_1_THAI_STUDENTS.map((s) => s.code);
      } else {
        eligibleCodes = YEAR_1_THAI_STUDENTS.filter((s) => s.major === cDef.targetMajor).map((s) => s.code);
      }

      const studentsToEnroll = await db.student.findMany({
        where: {
          tenantId: tenant.id,
          studentCode: { in: eligibleCodes },
        },
      });

      let enrolledForCourse = 0;
      for (const st of studentsToEnroll) {
        const exist = await db.courseEnrollment.findUnique({
          where: {
            courseId_studentId: {
              courseId: course.id,
              studentId: st.id,
            },
          },
        });

        if (!exist) {
          await db.courseEnrollment.create({
            data: {
              tenantId: tenant.id,
              courseId: course.id,
              studentId: st.id,
              status: "ENROLLED",
            },
          });
          enrolledForCourse++;
        }
      }

      console.log(`  ✓ รายวิชา [${cDef.courseCode}] ${cDef.courseName} -> ลงทะเบียนแล้ว ${studentsToEnroll.length} คน (ใหม่: ${enrolledForCourse})`);
    }
  }

  console.log("\n=== นำเข้ารายชื่อนิสิตปี 1 (ภาคภาษาไทย) และเปิดห้องเรียน 13 รายวิชาสำเร็จ 100% ===");
}

main()
  .catch((e) => {
    console.error("Error importing students:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
