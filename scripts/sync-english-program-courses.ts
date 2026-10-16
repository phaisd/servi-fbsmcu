import { PrismaClient } from "../src/generated/prisma";
import * as bcrypt from "bcryptjs";

const db = new PrismaClient();

interface CourseDef {
  yearLevel: number;
  courseCode: string;
  courseName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
  instructorName: string;
  targetMajor: "ALL" | "Religion and Philosophy" | "Buddhist Studies";
}

const ENGLISH_COURSES: CourseDef[] = [
  // =========================================================================
  // Year 1 (Total 9 courses)
  // =========================================================================
  // Religion and Philosophy specific
  {
    yearLevel: 1,
    courseCode: "112 412",
    courseName: "Buddhist Philosophy",
    dayOfWeek: 1,
    startTime: "09.00",
    endTime: "11.30",
    room: "Room No. D 122",
    instructorName: "Dr. Dhanardhip Hardnualee",
    targetMajor: "Religion and Philosophy",
  },
  {
    yearLevel: 1,
    courseCode: "112 308",
    courseName: "Christianity",
    dayOfWeek: 1,
    startTime: "13.00",
    endTime: "15.30",
    room: "Room No. D 122",
    instructorName: "Assoc. Prof. Dr. Naddhira Sridee",
    targetMajor: "Religion and Philosophy",
  },
  // Buddhist Studies specific
  {
    yearLevel: 1,
    courseCode: "101 104",
    courseName: "Education in Tipitaka",
    dayOfWeek: 1,
    startTime: "09.00",
    endTime: "11.30",
    room: "Room No. D 517-518",
    instructorName: "Asst. Prof. Phramaha Yongyut Dhiradhammo, Ph.D.",
    targetMajor: "Buddhist Studies",
  },
  {
    yearLevel: 1,
    courseCode: "101 102",
    courseName: "Buddhism and Social Works",
    dayOfWeek: 1,
    startTime: "13.00",
    endTime: "15.30",
    room: "Room No. D 517-518",
    instructorName: "Asst. Prof. Dr. Supapan Permpool",
    targetMajor: "Buddhist Studies",
  },
  // Common for Year 1 (All majors)
  {
    yearLevel: 1,
    courseCode: "000 239",
    courseName: "Dhamma in English",
    dayOfWeek: 2,
    startTime: "09.00",
    endTime: "11.30",
    room: "Room No. D 517-518",
    instructorName: "Ven. Phrabaidika Senghurng Narinda, Ph.D.",
    targetMajor: "ALL",
  },
  {
    yearLevel: 1,
    courseCode: "000 204",
    courseName: "English for Communication",
    dayOfWeek: 2,
    startTime: "13.00",
    endTime: "15.30",
    room: "Room No. D 517-518",
    instructorName: "A.Dr. Sudtida Padrit",
    targetMajor: "ALL",
  },
  {
    yearLevel: 1,
    courseCode: "000 237",
    courseName: "History of Buddhism",
    dayOfWeek: 3,
    startTime: "09.00",
    endTime: "11.30",
    room: "Room No. D 517-518",
    instructorName: "Asst. Prof. Phra Sitthivajarabundit, Ph.D.",
    targetMajor: "ALL",
  },
  {
    yearLevel: 1,
    courseCode: "000 206",
    courseName: "Mathematics and Statistics for Research",
    dayOfWeek: 3,
    startTime: "13.00",
    endTime: "15.30",
    room: "Room No. D 517-518",
    instructorName: "Ven. Dr. Dharma Priya Bhikkhu",
    targetMajor: "ALL",
  },
  {
    yearLevel: 1,
    courseCode: "0SP102",
    courseName: "Pali II",
    dayOfWeek: 4,
    startTime: "09.00",
    endTime: "11.30",
    room: "Room No. D 517-518",
    instructorName: "Phramaha Niran Kalyanamedhi, Ph.D.",
    targetMajor: "ALL",
  },

  // =========================================================================
  // Year 2 (Total 7 courses)
  // =========================================================================
  // Common for Year 2
  {
    yearLevel: 2,
    courseCode: "000 135",
    courseName: "Tipitaka Studies",
    dayOfWeek: 1,
    startTime: "09.00",
    endTime: "11.30",
    room: "Room No. D 519-520",
    instructorName: "Dr. Duangdee Aotsoo",
    targetMajor: "ALL",
  },
  {
    yearLevel: 2,
    courseCode: "000 205",
    courseName: "Introduction to Philosophy",
    dayOfWeek: 1,
    startTime: "13.00",
    endTime: "15.30",
    room: "Room No. D 519-520",
    instructorName: "Phramaha Jaroon Kittipanno, Ph.D.",
    targetMajor: "ALL",
  },
  {
    yearLevel: 2,
    courseCode: "000 229",
    courseName: "Leadership",
    dayOfWeek: 2,
    startTime: "09.00",
    endTime: "11.30",
    room: "Room No. D 519-520",
    instructorName: "Assoc. Prof. W. Piyaratana, Ph.D.",
    targetMajor: "ALL",
  },
  {
    yearLevel: 2,
    courseCode: "000 113",
    courseName: "Introduction to Logic",
    dayOfWeek: 3,
    startTime: "09.00",
    endTime: "11.30",
    room: "Room No. D 519-520",
    instructorName: "Phrasamu Kriengsak Sirisakko, Ph.D.",
    targetMajor: "ALL",
  },
  {
    yearLevel: 2,
    courseCode: "000 134",
    courseName: "Buddhist Literature",
    dayOfWeek: 3,
    startTime: "13.00",
    endTime: "15.30",
    room: "Room No. D 519-520",
    instructorName: "Phramaha Jaroon Kittipanno, Ph.D.",
    targetMajor: "ALL",
  },
  // Major specific Year 2
  {
    yearLevel: 2,
    courseCode: "112 311",
    courseName: "New Religious Movement",
    dayOfWeek: 2,
    startTime: "13.00",
    endTime: "15.30",
    room: "Room No. D 122",
    instructorName: "Assoc. Prof. Dr. Naddhira Sridee",
    targetMajor: "Religion and Philosophy",
  },
  {
    yearLevel: 2,
    courseCode: "101 206",
    courseName: "Psychology in Tipitaka",
    dayOfWeek: 2,
    startTime: "13.00",
    endTime: "15.30",
    room: "Room No. D 519-520",
    instructorName: "Phramaha Veeradej Adhipanno, Ph.D.",
    targetMajor: "Buddhist Studies",
  },

  // =========================================================================
  // Year 3 (Total 12 courses)
  // =========================================================================
  // Religion and Philosophy (6 courses)
  {
    yearLevel: 3,
    courseCode: "112 309",
    courseName: "Islam",
    dayOfWeek: 1,
    startTime: "09.00",
    endTime: "11.30",
    room: "Room No. D 121",
    instructorName: "Phramaha Jaroon Kittipanno, Ph.D.",
    targetMajor: "Religion and Philosophy",
  },
  {
    yearLevel: 3,
    courseCode: "112 431",
    courseName: "Contemporary Indian Philosophy",
    dayOfWeek: 1,
    startTime: "13.00",
    endTime: "15.30",
    room: "Room No. D 121",
    instructorName: "Asst. Prof. Phramaha Pornchai Sirivaro, Ph.D.",
    targetMajor: "Religion and Philosophy",
  },
  {
    yearLevel: 3,
    courseCode: "112 336",
    courseName: "Religion and Culture",
    dayOfWeek: 2,
    startTime: "09.00",
    endTime: "11.30",
    room: "Room No. D 121",
    instructorName: "Dr. Dhanardhip Hardnualee",
    targetMajor: "Religion and Philosophy",
  },
  {
    yearLevel: 3,
    courseCode: "112 306",
    courseName: "Ancient Western Philosophy",
    dayOfWeek: 2,
    startTime: "13.00",
    endTime: "15.30",
    room: "Room No. D 121",
    instructorName: "Asst. Prof. Phramaha Somphong Khunakaro, Ph.D.",
    targetMajor: "Religion and Philosophy",
  },
  {
    yearLevel: 3,
    courseCode: "112 421",
    courseName: "Language of Religion",
    dayOfWeek: 3,
    startTime: "09.00",
    endTime: "11.30",
    room: "Room No. D 121",
    instructorName: "Phramaha Khunpon Samacitto, Ph.D.",
    targetMajor: "Religion and Philosophy",
  },
  {
    yearLevel: 3,
    courseCode: "112 304",
    courseName: "Aesthetics",
    dayOfWeek: 3,
    startTime: "13.00",
    endTime: "15.30",
    room: "Room No. D 121",
    instructorName: "Dr. Duangdee Aotsoo",
    targetMajor: "Religion and Philosophy",
  },
  // Buddhist Studies (6 courses)
  {
    yearLevel: 3,
    courseCode: "101 313",
    courseName: "Dhammapada Studies",
    dayOfWeek: 1,
    startTime: "09.00",
    endTime: "11.30",
    room: "Room No. D 123",
    instructorName: "Assoc. Prof. Pha Dhammavajirapanyacarya, Ph.D.",
    targetMajor: "Buddhist Studies",
  },
  {
    yearLevel: 3,
    courseCode: "101 330",
    courseName: "Life and Works of Buddhist Scholars",
    dayOfWeek: 1,
    startTime: "13.00",
    endTime: "15.30",
    room: "Room No. D 123",
    instructorName: "Asst. Prof. Phramaha Yongyut Dhiradhammo, Ph.D.",
    targetMajor: "Buddhist Studies",
  },
  {
    yearLevel: 3,
    courseCode: "101 327",
    courseName: "Buddhism and Women's Status",
    dayOfWeek: 2,
    startTime: "09.00",
    endTime: "11.30",
    room: "Room No. D 123",
    instructorName: "Asst. Prof. Dr. Supapan Permpool",
    targetMajor: "Buddhist Studies",
  },
  {
    yearLevel: 3,
    courseCode: "101 311",
    courseName: "Principles of Buddhism",
    dayOfWeek: 2,
    startTime: "13.00",
    endTime: "15.30",
    room: "Room No. D 123",
    instructorName: "Assoc. Prof. Dr. Jutamas Vareesangthip",
    targetMajor: "Buddhist Studies",
  },
  {
    yearLevel: 3,
    courseCode: "101 310",
    courseName: "Buddhism and Health Care",
    dayOfWeek: 3,
    startTime: "09.00",
    endTime: "11.30",
    room: "Room No. D 123",
    instructorName: "Asst. Prof. Dr. Doungkamon Tongkanaraksa",
    targetMajor: "Buddhist Studies",
  },
  {
    yearLevel: 3,
    courseCode: "101 309",
    courseName: "Buddhism and Sustainable Development",
    dayOfWeek: 3,
    startTime: "13.00",
    endTime: "15.30",
    room: "Room No. D 123",
    instructorName: "Dr. Sudtida Padrit",
    targetMajor: "Buddhist Studies",
  },

  // =========================================================================
  // Year 4 (Total 10 courses)
  // =========================================================================
  // Religion and Philosophy (5 courses)
  {
    yearLevel: 4,
    courseCode: "112 417",
    courseName: "Independent Study in Religions and Philosophy",
    dayOfWeek: 1,
    startTime: "09.00",
    endTime: "11.30",
    room: "Room No. D 120",
    instructorName: "Asst. Prof. Phramaha Pornchai Sirivaro, Ph.D.",
    targetMajor: "Religion and Philosophy",
  },
  {
    yearLevel: 4,
    courseCode: "112 442",
    courseName: "Religious Arts",
    dayOfWeek: 1,
    startTime: "13.00",
    endTime: "15.30",
    room: "Room No. D 120",
    instructorName: "Dr. Duangdee Aotsoo",
    targetMajor: "Religion and Philosophy",
  },
  {
    yearLevel: 4,
    courseCode: "112 433",
    courseName: "Modern Western Philosophy",
    dayOfWeek: 2,
    startTime: "09.00",
    endTime: "11.30",
    room: "Room No. D 120",
    instructorName: "Asst. Prof. Phramaha Somphong Khunakaro, Ph.D.",
    targetMajor: "Religion and Philosophy",
  },
  {
    yearLevel: 4,
    courseCode: "112 415",
    courseName: "Seminar in Religions and Philosophy",
    dayOfWeek: 3,
    startTime: "09.00",
    endTime: "11.30",
    room: "Room No. D 120",
    instructorName: "Phramaha Jaroon Kittipanno, Ph.D.",
    targetMajor: "Religion and Philosophy",
  },
  {
    yearLevel: 4,
    courseCode: "112 413",
    courseName: "Symbolic Logic",
    dayOfWeek: 3,
    startTime: "13.00",
    endTime: "15.30",
    room: "Room No. D 120",
    instructorName: "Phramaha Khunpon Samacitto, Ph.D.",
    targetMajor: "Religion and Philosophy",
  },
  // Buddhist Studies (5 courses)
  {
    yearLevel: 4,
    courseCode: "101 433",
    courseName: "Milindapanha Studies",
    dayOfWeek: 1,
    startTime: "13.00",
    endTime: "15.30",
    room: "Room No. D 124",
    instructorName: "Assoc. Prof. W. Piyaratana, Ph.D.",
    targetMajor: "Buddhist Studies",
  },
  {
    yearLevel: 4,
    courseCode: "101 417",
    courseName: "Seminar on Buddhism",
    dayOfWeek: 2,
    startTime: "09.00",
    endTime: "11.30",
    room: "Room No. D 124",
    instructorName: "Assoc. Prof. Dr. Jutamas Vareesangthip",
    targetMajor: "Buddhist Studies",
  },
  {
    yearLevel: 4,
    courseCode: "101 419",
    courseName: "Mangalatthadipani Studies",
    dayOfWeek: 2,
    startTime: "13.00",
    endTime: "15.30",
    room: "Room No. D 124",
    instructorName: "Assoc. Prof. Phramaha Yutthana Narajettho, Ph.D",
    targetMajor: "Buddhist Studies",
  },
  {
    yearLevel: 4,
    courseCode: "101 416",
    courseName: "Independent Study on Buddhism",
    dayOfWeek: 3,
    startTime: "09.00",
    endTime: "11.30",
    room: "Room No. D 124",
    instructorName: "Asst. Prof. W. Piyaratana, Ph.D.",
    targetMajor: "Buddhist Studies",
  },
  {
    yearLevel: 4,
    courseCode: "101 418",
    courseName: "Buddhist Arts",
    dayOfWeek: 3,
    startTime: "13.00",
    endTime: "15.30",
    room: "Room No. D 124",
    instructorName: "Assoc. Prof. Dr. Doungkamon Tongkanaraksa",
    targetMajor: "Buddhist Studies",
  },
];

async function main() {
  console.log("=== เริ่มต้นสร้างห้องเรียนและลงทะเบียนนิสิตหลักสูตรภาษาอังกฤษ (English Program) ===");
  console.log(`จำนวนรายวิชาทั้งหมดที่จะเปิด: ${ENGLISH_COURSES.length} รายวิชา (ปี 1-4)`);

  const tenants = await db.tenant.findMany();
  console.log(`พบ ${tenants.length} tenants ในระบบ:`, tenants.map((t) => `${t.nameTh} (${t.code})`).join(", "));

  const hashedPassword = await bcrypt.hash("Teacher1234!", 10);

  for (const tenant of tenants) {
    console.log(`\n------------------------------------------------------------`);
    console.log(`กำลังดำเนินการ Tenant: ${tenant.nameTh} (${tenant.code})`);
    console.log(`------------------------------------------------------------`);

    const teacherRole = await db.role.findFirst({
      where: { tenantId: tenant.id, code: "TEACHER" },
    });

    let totalCreatedCourses = 0;
    let totalEnrolled = 0;

    for (const cDef of ENGLISH_COURSES) {
      // 1. หาหรือสร้าง User อาจารย์
      const teacherEmail = `t69.en.${cDef.courseCode.replace(/\s+/g, "").toLowerCase()}@mcu.ac.th`;

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

      // 2. หาหรือสร้าง Course
      let course = await db.course.findFirst({
        where: {
          tenantId: tenant.id,
          courseCode: cDef.courseCode,
          academicYear: "2569",
          semester: 2,
          section: "EN",
        },
      });

      if (!course) {
        course = await db.course.create({
          data: {
            tenantId: tenant.id,
            courseCode: cDef.courseCode,
            courseName: cDef.courseName,
            courseNameEn: cDef.courseName,
            credits: 3,
            section: "EN",
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
        totalCreatedCourses++;
      } else {
        // อัปเดตข้อมูลห้องและอาจารย์ให้ถูกต้อง
        await db.course.update({
          where: { id: course.id },
          data: {
            room: cDef.room,
            dayOfWeek: cDef.dayOfWeek,
            startTime: cDef.startTime,
            endTime: cDef.endTime,
            primaryTeacherId: teacherUser.id,
            courseNameEn: cDef.courseName,
          },
        });
      }

      // ผูก CourseTeacher
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

      // ตรวจสอบและสร้าง 16 คาบเรียน
      const existingSessionsCount = await db.classSession.count({
        where: { courseId: course.id },
      });

      if (existingSessionsCount === 0) {
        const termStart = new Date("2026-11-02T09:00:00Z");
        const dayOffset = cDef.dayOfWeek - 1;
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
              topic: `Session ${sNum}: ${cDef.courseName}`,
              sessionType: "REGULAR",
              status: "SCHEDULED",
              isCounted: true,
            },
          });
        }
      }

      // 3. หานิสิตหลักสูตรภาษาอังกฤษที่ตรงตามเงื่อนไข (ปี + สาขาวิชา)
      let studentFilter: any = {
        tenantId: tenant.id,
        yearLevel: cDef.yearLevel,
        curriculumName: { contains: "ภาษาอังกฤษ" },
      };

      if (cDef.targetMajor === "ALL") {
        // รวมทุกสาขาของปีนั้นในหลักสูตรภาษาอังกฤษ
      } else {
        studentFilter.major = cDef.targetMajor;
      }

      const studentsToEnroll = await db.student.findMany({
        where: studentFilter,
      });

      let newlyEnrolledForCourse = 0;
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
          newlyEnrolledForCourse++;
          totalEnrolled++;
        }
      }

      console.log(
        `  ✓ [${cDef.courseCode}] ${cDef.courseName} (Yr ${cDef.yearLevel}, Sec EN) -> นิสิตทั้งหมด: ${studentsToEnroll.length} คน (ใหม่: ${newlyEnrolledForCourse})`
      );
    }

    console.log(
      `Tenant ${tenant.code}: เปิดวิชาใหม่ ${totalCreatedCourses} วิชา, ลงทะเบียนนิสิตใหม่ ${totalEnrolled} รายการ`
    );
  }

  // ซ่อมบำรุงวิชาภาคภาษาไทยที่มี 0 sessions หากมีตกค้าง
  console.log("\n--- ตรวจสอบและเติมคาบเรียนสำหรับรายวิชาภาคภาษาไทยที่ยังไม่มีคาบเรียน ---");
  const zeroSessionCourses = await db.course.findMany({
    where: {
      sessions: { none: {} },
    },
  });

  console.log(`พบวิชาที่มี 0 sessions: ${zeroSessionCourses.length} รายวิชา`);
  for (const c of zeroSessionCourses) {
    const day = c.dayOfWeek || 1;
    const termStart = new Date("2026-11-02T09:00:00Z");
    const dayOffset = day - 1;
    termStart.setDate(termStart.getDate() + dayOffset);

    for (let sNum = 1; sNum <= 16; sNum++) {
      const sDate = new Date(termStart);
      sDate.setDate(termStart.getDate() + (sNum - 1) * 7);

      await db.classSession.create({
        data: {
          tenantId: c.tenantId,
          courseId: c.id,
          sessionNumber: sNum,
          date: sDate,
          startTime: c.startTime || "09.00",
          endTime: c.endTime || "11.30",
          room: c.room || "ห้องเรียนคณะพุทธศาสตร์",
          topic: `คาบเรียนที่ ${sNum}: ${c.courseName}`,
          sessionType: "REGULAR",
          status: "SCHEDULED",
          isCounted: true,
        },
      });
    }
    console.log(`  ✓ เพิ่ม 16 คาบเรียนให้วิชา [${c.courseCode}] ${c.courseName} เรียบร้อย`);
  }

  console.log("\n=== ดำเนินการสร้างห้องเรียนและลงทะเบียนนิสิตหลักสูตรภาษาอังกฤษครบถ้วนสมบูรณ์ 100% ===");
}

main()
  .catch((e) => {
    console.error("Error syncing English program courses:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
