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

const YEAR_2_THAI_STUDENTS: RawThaiStudent[] = [
  // 1. สาขาวิชาพระพุทธศาสนา (8 คน)
  { code: "6801501002", title: "", firstName: "Khuangphan", lastName: "Sengmany", major: "พระพุทธศาสนา", gender: "ชาย" },
  { code: "6801501008", title: "พระมหา", firstName: "ศุภัช", lastName: "มหาวีโร", major: "พระพุทธศาสนา", gender: "ชาย" },
  { code: "6801501071", title: "พระครูสมุห์", firstName: "รัชกฤช", lastName: "ภทฺทปญฺโญ", major: "พระพุทธศาสนา", gender: "ชาย" },
  { code: "6801501072", title: "พระมหา", firstName: "วชิรวิทย์", lastName: "ธนวุฑฺโฒ", major: "พระพุทธศาสนา", gender: "ชาย" },
  { code: "6801501075", title: "พระ", firstName: "สมชาย", lastName: "ปญฺญาธโร", major: "พระพุทธศาสนา", gender: "ชาย" },
  { code: "6801501076", title: "สามเณร", firstName: "อภิสร", lastName: "ใสสะอาด", major: "พระพุทธศาสนา", gender: "ชาย" },
  { code: "6801504141", title: "พระมหา", firstName: "นิพิฐ", lastName: "ธมฺมานนฺโท", major: "พระพุทธศาสนา", gender: "ชาย" },
  { code: "6702501023", title: "พระ", firstName: "วีระชัย", lastName: "วีรปญฺโญ", major: "พระพุทธศาสนา", notes: "เทียบโอน", gender: "ชาย" },

  // 2. สาขาวิชาวิปัสสนาภาวนา (3 คน)
  { code: "6801501014", title: "นาย", firstName: "รัฐธนนท์", lastName: "วรเจริญศรี", major: "วิปัสสนาภาวนา", gender: "ชาย" },
  { code: "6801501016", title: "นาง", firstName: "ธมล", lastName: "ธนวฬาเจริญ", major: "วิปัสสนาภาวนา", gender: "หญิง" },
  { code: "6801501085", title: "พระ", firstName: "บุญธรรม", lastName: "สุขวิชฺโช", major: "วิปัสสนาภาวนา", gender: "ชาย" },

  // 3. สาขาวิชาศาสนาและปรัชญา (7 คน)
  { code: "6801501009", title: "พระมหา", firstName: "ชนุดม", lastName: "อุตฺตมวํโส", major: "ศาสนาและปรัชญา", gender: "ชาย" },
  { code: "6801501078", title: "สามเณร", firstName: "กิตติพัฒน์", lastName: "พุ่มพวง", major: "ศาสนาและปรัชญา", gender: "ชาย" },
  { code: "6801501079", title: "สามเณร", firstName: "พชร", lastName: "พรมมี", major: "ศาสนาและปรัชญา", gender: "ชาย" },
  { code: "6801501080", title: "สามเณร", firstName: "ภูบดินทร", lastName: "กาวิจา", major: "ศาสนาและปรัชญา", gender: "ชาย" },
  { code: "6801501138", title: "พระ", firstName: "สุพรรณ", lastName: "แฮล", major: "ศาสนาและปรัชญา", gender: "ชาย" },
  { code: "6801501134", title: "สามเณร", firstName: "ยมมะลา", lastName: "อ่อนอินทร์", major: "ศาสนาและปรัชญา", gender: "ชาย" },
  { code: "6801401001", title: "พระ", firstName: "ทรงสิทธิ์", lastName: "จิตคุโณ", major: "ศาสนาและปรัชญา", notes: "เทียบโอน", gender: "ชาย" },

  // 4. สาขาวิชาบาลีสันสกฤต (4 คน)
  { code: "6801501013", title: "นางสาว", firstName: "สุรางค์", lastName: "ชีวศุภกร", major: "บาลีสันสกฤต", gender: "หญิง" },
  { code: "6801501084", title: "พระ", firstName: "สายัน", lastName: "สารโท", major: "บาลีสันสกฤต", gender: "ชาย" },
  { code: "6801401002", title: "นางสาว", firstName: "วชิราวัลย์", lastName: "มหพรภัสสร์", major: "บาลีสันสกฤต", notes: "เทียบโอน", gender: "หญิง" },
  { code: "6801401003", title: "พระ", firstName: "วิชัย", lastName: "วิชโย", major: "บาลีสันสกฤต", notes: "เทียบโอน", gender: "ชาย" },
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

const YEAR_2_COURSES: CourseSeedDef[] = [
  // 1. Common Courses (เรียนรวมทุกสาขาของปี 2)
  { courseCode: "000 113", courseName: "ตรรกศาสตร์เบื้องต้น", dayOfWeek: 1, startTime: "12.30", endTime: "15.10", room: "อาคารเรียนรวม ชั้น 5 ห้อง D 516/2 (เรียนรวม)", instructorName: "พระมหาดวงเด่น ฐิตญาโณ, ผศ.ดร.", targetMajor: "ALL" },
  { courseCode: "000 229", courseName: "ภาวะผู้นำ", dayOfWeek: 2, startTime: "09.00", endTime: "11.30", room: "อาคารเรียนรวม ชั้น 5 ห้อง D 516/2 (เรียนรวม)", instructorName: "พระมหาราชัน จิตฺตปาโล, อ.ดร.", targetMajor: "ALL" },
  { courseCode: "000 205", courseName: "ปรัชญาเบื้องต้น", dayOfWeek: 2, startTime: "12.30", endTime: "15.10", room: "อาคารเรียนรวม ชั้น 5 ห้อง D 516/2 (เรียนรวม)", instructorName: "รศ.ดร.กฤต ศรียะอาจ", targetMajor: "ALL" },
  { courseCode: "000 135", courseName: "พระไตรปิฎกศึกษา", dayOfWeek: 3, startTime: "09.00", endTime: "11.30", room: "อาคารเรียนรวม ชั้น 5 ห้อง D 516/2 (เรียนรวม)", instructorName: "พระมหายุทธนา นรเชฏฺโฐ, รศ.ดร.", targetMajor: "ALL" },
  { courseCode: "000 134", courseName: "วรรณกรรมพระพุทธศาสนา", dayOfWeek: 3, startTime: "12.30", endTime: "15.10", room: "อาคารเรียนรวม ชั้น 5 ห้อง D 516/2 (เรียนรวม)", instructorName: "อาจารย์ ดร.อุดม จันทิมา", targetMajor: "ALL" },

  // 2. เฉพาะสาขาวิชาพระพุทธศาสนา
  { courseCode: "101 206", courseName: "จิตวิทยาในพระไตรปิฎก", dayOfWeek: 1, startTime: "09.00", endTime: "11.30", room: "อาคารเรียนรวม ชั้น 5 ห้อง D 516/2", instructorName: "รศ.ดร.สุเทพ พรมเลิศ", targetMajor: "พระพุทธศาสนา" },

  // 3. เฉพาะสาขาวิชาวิปัสสนาภาวนา
  { courseCode: "111 206", courseName: "กรรมฐานในโลกสมัยใหม่", dayOfWeek: 1, startTime: "09.00", endTime: "11.30", room: "ชั้น 2 ห้อง D 219/1", instructorName: "พระครูปลัดสุขีศม สีลเตชปุตฺติโย, อ.ดร.", targetMajor: "วิปัสสนาภาวนา" },

  // 4. เฉพาะสาขาวิชาบาลีสันสกฤต
  { courseCode: "000 117", courseName: "ภาษาสันสกฤตชั้นสูง", dayOfWeek: 1, startTime: "09.00", endTime: "11.30", room: "อาคารเรียนรวม ชั้น 3 ห้อง D516/2", instructorName: "พระมหานิรันดร์ กลฺยาณเมธี, อ.ดร.", targetMajor: "บาลีสันสกฤต" },
  { courseCode: "108 205", courseName: "ไวยากรณ์สันสกฤตชั้นกลาง", dayOfWeek: 4, startTime: "09.00", endTime: "11.30", room: "อาคารเรียนรวม ชั้น 3 ห้อง D516/2", instructorName: "อ.ดร.สุดาพร เขียวงามดี", targetMajor: "บาลีสันสกฤต" },
];

async function main() {
  console.log("=== เริ่มต้นนำเข้ารายชื่อนิสิต ชั้นปีที่ 2 ภาคภาษาไทย (22 คน) ===");

  const tenants = await db.tenant.findMany();
  console.log(`พบ ${tenants.length} tenants ในระบบ`);

  const hashedPassword = await bcrypt.hash("Teacher1234!", 10);

  for (const tenant of tenants) {
    console.log(`\n--- ดำเนินการกับ Tenant: ${tenant.nameTh} (${tenant.code}) ---`);

    // 1. บันทึกข้อมูลนิสิตปี 2 เข้า Student table
    let studentCount = 0;
    for (const item of YEAR_2_THAI_STUDENTS) {
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
          yearLevel: 2,
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
          yearLevel: 2,
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
    console.log(`  ✓ บันทึกข้อมูลนิสิตปี 2: ${studentCount} คน`);

    // 2. หา Role อาจารย์สำหรับ Tenant นี้
    const teacherRole = await db.role.findFirst({
      where: { tenantId: tenant.id, code: "TEACHER" },
    });

    for (const cDef of YEAR_2_COURSES) {
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
        eligibleCodes = YEAR_2_THAI_STUDENTS.map((s) => s.code);
      } else {
        eligibleCodes = YEAR_2_THAI_STUDENTS.filter((s) => s.major === cDef.targetMajor).map((s) => s.code);
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

  console.log("\n=== นำเข้ารายชื่อนิสิตปี 2 (ภาคภาษาไทย) และเปิดห้องเรียน 9 รายวิชาสำเร็จ 100% ===");
}

main()
  .catch((e) => {
    console.error("Error importing students:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
