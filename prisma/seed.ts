import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { seedCore, seedUser } from "./lib/seed-core";
import { requireDatabaseUrl } from "./lib/require-database-url";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: requireDatabaseUrl() }) });

/** รหัสผ่านทุกบัญชีตัวอย่าง */
export const DEV_PASSWORD = "Passw0rd!vibe";

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.SEED_ALLOW_PROD !== "1") {
    console.error("[seed] ปฏิเสธ: NODE_ENV=production — ใช้ npm run db:bootstrap แทน");
    process.exit(1);
  }
  const core = await seedCore(prisma, {
    tenantCode: "MCU",
    nameTh: "คณะพุทธศาสตร์",
    nameEn: "Faculty of Buddhism",
    logoUrl: "/uploads/mcu-logo.png",
  });
  // สร้าง DEMO tenant ไว้ด้วยเพื่อความเข้ากันได้ย้อนหลัง
  await seedCore(prisma, {
    tenantCode: "DEMO",
    nameTh: "คณะพุทธศาสตร์ (Demo)",
    nameEn: "Faculty of Buddhism (Demo)",
    logoUrl: "/uploads/mcu-logo.png",
  });

  const hash = await bcrypt.hash(DEV_PASSWORD, 12);
  const users = [
    { email: "admin@buddhist.mcu.ac.th", name: "ผู้ดูแลระบบ คณะพุทธศาสตร์", roles: ["SUPER_ADMIN"] },
    { email: "admin@app.local", name: "ผู้ดูแลสูงสุด (Local Dev)", roles: ["SUPER_ADMIN"] },
    { email: "teacher@buddhist.mcu.ac.th", name: "ผศ.ดร.พระมหาสมโภช ญาณสิทฺธิ", roles: ["TEACHER"] },
    { email: "teacher2@buddhist.mcu.ac.th", name: "ดร.วิสุทธิ์ สิทธิธรรม", roles: ["TEACHER"] },
    { email: "curriculum@buddhist.mcu.ac.th", name: "เจ้าหน้าที่บริการการศึกษาและหลักสูตร", roles: ["CURRICULUM_OFFICER"] },
    { email: "curriculum.ug@buddhist.mcu.ac.th", name: "เจ้าหน้าที่หลักสูตรระดับปริญญาตรี", roles: ["CURRICULUM_OFFICER"] },
    { email: "curriculum.grad@buddhist.mcu.ac.th", name: "เจ้าหน้าที่หลักสูตรบัณฑิตศึกษา (ป.โท - ป.เอก)", roles: ["CURRICULUM_OFFICER"] },
    { email: "curriculum.inter@buddhist.mcu.ac.th", name: "เจ้าหน้าที่หลักสูตรนานาชาติ (International Program)", roles: ["CURRICULUM_OFFICER"] },
    { email: "grad.tipitaka@buddhist.mcu.ac.th", name: "เจ้าหน้าที่หลักสูตรพระไตรปิฎกศึกษา (ป.โท - ป.เอก)", roles: ["CURRICULUM_OFFICER"] },
    { email: "grad.religion@buddhist.mcu.ac.th", name: "เจ้าหน้าที่หลักสูตรศาสนาเปรียบเทียบ (ป.โท - ป.เอก)", roles: ["CURRICULUM_OFFICER"] },
    { email: "grad.vipassana@buddhist.mcu.ac.th", name: "เจ้าหน้าที่หลักสูตรวิปัสสนาภาวนาศึกษา (ป.โท)", roles: ["CURRICULUM_OFFICER"] },
    { email: "curriculum@app.local", name: "เจ้าหน้าที่หลักสูตร (Local Dev)", roles: ["CURRICULUM_OFFICER"] },
    { email: "staff@buddhist.mcu.ac.th", name: "เจ้าหน้าที่บริหารงานทั่วไป", roles: ["STAFF"] },
    { email: "staff@app.local", name: "เจ้าหน้าที่", roles: ["STAFF"] },
    { email: "student@buddhist.mcu.ac.th", name: "พระมหาธีรภัทร นิสิตชั้นปีที่ 3", roles: ["STUDENT"] },
    { email: "viewer@app.local", name: "ผู้ดู", roles: ["VIEWER"] },
    { email: "lockme@app.local", name: "บัญชีทดสอบล็อก", roles: ["VIEWER"] },
    { email: "forced@app.local", name: "บัญชีบังคับเปลี่ยนรหัส", roles: ["VIEWER"], mustChangePassword: true },
  ];
  for (const u of users) {
    await seedUser(prisma, core.tenantId, { ...u, passwordHash: hash, roleIds: u.roles.map((c) => core.roleIds[c]) });
  }

  // สร้างข่าวสารตัวอย่างสำหรับคณะพุทธศาสตร์
  const adminUser = await prisma.user.findUnique({ where: { email: "admin@app.local" } });
  if (adminUser) {
    await prisma.newsArticle.upsert({
      where: { tenantId_slug: { tenantId: core.tenantId, slug: "admission-buddhist-studies-2569" } },
      update: {},
      create: {
        tenantId: core.tenantId,
        authorId: adminUser.id,
        titleTh: "คณะพุทธศาสตร์ เปิดรับสมัครนิสิตใหม่ ระดับปริญญาตรี ประจำปีการศึกษา 2569",
        titleEn: "Faculty of Buddhism Opens Applications for Undergraduate Programs (AY 2026)",
        slug: "admission-buddhist-studies-2569",
        summaryTh: "เปิดรับสมัครผู้สนใจเข้าศึกษาต่อสาขาวิชาพระพุทธศาสนา สาขาวิชาปรัชญา และสาขาวิชาบาลีพุทธศาสตร์ ทุนการศึกษาเต็มจำนวนสำหรับพระภิกษุสามเณร",
        summaryEn: "Admission is open for Bachelor of Arts in Buddhist Studies, Philosophy, and Pali-Buddhist Studies with scholarships.",
        contentTh: "คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย มีความประสงค์เปิดรับสมัครบุคคลเข้าศึกษาในระดับปริญญาตรี (พธ.บ.) ประจำปีการศึกษา 2569\n\nสาขาวิชาที่เปิดรับสมัคร:\n1. สาขาวิชาพระพุทธศาสนา\n2. สาขาวิชาปรัชญา\n3. สาขาวิชาบาลีพุทธศาสตร์\n\nคุณสมบัติผู้สมัคร:\n- พระภิกษุ สามเณร และคฤหัสถ์ผู้สำเร็จการศึกษาระดับมัธยมศึกษาตอนปลาย (ม.6) หรือเทียบเท่า หรือสอบได้เปรียญธรรม ๓ ประโยคขึ้นไป",
        contentEn: "The Faculty of Buddhism invites applications for undergraduate degree programs for the academic year 2026.",
        category: "ACADEMIC",
        status: "PUBLISHED",
        isPinned: true,
        pinOrder: 1,
        publishedAt: new Date(),
        viewCount: 142,
      },
    });

    await prisma.newsArticle.upsert({
      where: { tenantId_slug: { tenantId: core.tenantId, slug: "buddhist-conference-2026" } },
      update: {},
      create: {
        tenantId: core.tenantId,
        authorId: adminUser.id,
        titleTh: "โครงการสัมมนาวิชาการระดับนานาชาติ เรื่อง พุทธปรัชญากับปัญญาประดิษฐ์ในยุคดิจิทัล",
        titleEn: "International Academic Conference: Buddhist Philosophy and AI in the Digital Era",
        slug: "buddhist-conference-2026",
        summaryTh: "ขอเชิญคณาจารย์ นักวิจัย และนิสิต ร่วมฟังการเสวนาและนำเสนอผลงานวิชาการพุทธศาสนาร่วมสมัย",
        summaryEn: "Inviting faculty, researchers, and students to attend the international academic conference.",
        contentTh: "ขอเชิญคณาจารย์ นักวิจัย และนิสิต ร่วมรับฟังการเสวนาและนำเสนอผลงานวิชาการ ในงานสัมมนาวิชาการระดับนานาชาติ เรื่อง พุทธปรัชญากับปัญญาประดิษฐ์ในยุคดิจิทัล\n\nณ ห้องประชุมใหญ่ คณะพุทธศาสตร์",
        contentEn: "Conference on Buddhist Philosophy and AI in the Digital Era.",
        category: "EVENT",
        status: "PUBLISHED",
        isPinned: false,
        publishedAt: new Date(),
        viewCount: 88,
      },
    });

    // Seed Certificates
    const certType1 = await prisma.certificateType.findFirst({ where: { tenantId: core.tenantId, name: "หนังสือรับรองสภาพนิสิต" } }) ?? await prisma.certificateType.create({
      data: {
        tenantId: core.tenantId,
        name: "หนังสือรับรองสภาพนิสิต",
        description: "รับรองสถานะการเป็นนิสิตปัจจุบัน สำหรับใช้ติดต่อหน่วยงานราชการหรือขอทุนการศึกษา",
        isActive: true,
      }
    });

    const certType2 = await prisma.certificateType.findFirst({ where: { tenantId: core.tenantId, name: "ใบรายงานผลการศึกษา (Transcript)" } }) ?? await prisma.certificateType.create({
      data: {
        tenantId: core.tenantId,
        name: "ใบรายงานผลการศึกษา (Transcript)",
        description: "ใบแสดงผลการศึกษาอย่างไม่เป็นทางการ",
        isActive: true,
      }
    });

    const viewerUser = await prisma.user.findUnique({ where: { email: "viewer@app.local" } });
    if (viewerUser) {
      const existingReq = await prisma.certificateRequest.findFirst({ where: { tenantId: core.tenantId, userId: viewerUser.id } });
      if (!existingReq) {
        await prisma.certificateRequest.create({
          data: {
            tenantId: core.tenantId,
            userId: viewerUser.id,
            certificateTypeId: certType1.id,
            status: "PENDING",
            note: "นำไปขอทุนการศึกษาครับ",
          }
        });
        await prisma.certificateRequest.create({
          data: {
            tenantId: core.tenantId,
            userId: viewerUser.id,
            certificateTypeId: certType2.id,
            status: "APPROVED",
            issuedDocumentUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          }
        });
      }
    }

    // Seed Personnel
    const dept1 = await prisma.department.findFirst({ where: { tenantId: core.tenantId, nameTh: "ภาควิชาพระพุทธศาสนา" } }) ?? await prisma.department.create({
      data: {
        tenantId: core.tenantId,
        nameTh: "ภาควิชาพระพุทธศาสนา",
        nameEn: "Department of Buddhist Studies",
        orderIndex: 1,
      }
    });

    const dept2 = await prisma.department.findFirst({ where: { tenantId: core.tenantId, nameTh: "ภาควิชาปรัชญา" } }) ?? await prisma.department.create({
      data: {
        tenantId: core.tenantId,
        nameTh: "ภาควิชาปรัชญา",
        nameEn: "Department of Philosophy",
        orderIndex: 2,
      }
    });

    const existingPerson = await prisma.personnel.findFirst({ where: { tenantId: core.tenantId, email: "boonchoo@app.local" } });
    if (!existingPerson) {
      await prisma.personnel.create({
        data: {
          tenantId: core.tenantId,
          departmentId: dept1.id,
          firstNameTh: "พระครูปลัดสมเกียรติ",
          lastNameTh: "กิตฺติญาโณ",
          positionTh: "เลขานุการสำนักงานคณบดีคณะพุทธศาสตร์",
          type: "EXECUTIVE",
          email: "somkiat@app.local",
          phoneNumber: "02-123-4560",
          orderIndex: 1,
        }
      });

      await prisma.personnel.create({
        data: {
          tenantId: core.tenantId,
          departmentId: dept1.id,
          firstNameTh: "พระมหาบุญชู",
          lastNameTh: "ญาณวิโรจน์, ผศ.ดร.",
          positionTh: "คณบดีคณะพุทธศาสตร์",
          type: "EXECUTIVE",
          email: "boonchoo@app.local",
          phoneNumber: "02-123-4567",
          orderIndex: 2,
        }
      });

      await prisma.personnel.create({
        data: {
          tenantId: core.tenantId,
          departmentId: dept1.id,
          firstNameTh: "พระมหาชุติภัทร",
          lastNameTh: "โชติปญฺโญ, ดร.",
          positionTh: "รองคณบดีฝ่ายบริหาร คณะพุทธศาสตร์",
          type: "EXECUTIVE",
          orderIndex: 3,
        }
      });

      await prisma.personnel.create({
        data: {
          tenantId: core.tenantId,
          departmentId: dept1.id,
          firstNameTh: "พระครูสุตพุทธานุวัตร",
          lastNameTh: "ผศ.ดร.",
          positionTh: "รองคณบดีฝ่ายวิชาการ คณะพุทธศาสตร์",
          type: "EXECUTIVE",
          orderIndex: 4,
        }
      });

      await prisma.personnel.create({
        data: {
          tenantId: core.tenantId,
          departmentId: dept1.id,
          firstNameTh: "สมชาย",
          lastNameTh: "ใจดี",
          positionTh: "อาจารย์ประจำภาควิชา",
          type: "ACADEMIC",
          email: "somchai@app.local",
          orderIndex: 5,
        }
      });

      await prisma.personnel.create({
        data: {
          tenantId: core.tenantId,
          departmentId: dept2.id,
          firstNameTh: "สมหญิง",
          lastNameTh: "รักดี",
          positionTh: "อาจารย์ประจำภาควิชา",
          type: "ACADEMIC",
          email: "somying@app.local",
          orderIndex: 6,
        }
      });
    }

    // Seed Curriculum
    const existingCurr = await prisma.curriculum.findFirst({ where: { tenantId: core.tenantId, nameTh: "พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา" } });
    if (!existingCurr) {
      await prisma.curriculum.create({
        data: {
          tenantId: core.tenantId,
          nameTh: "พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา",
          nameEn: "Bachelor of Arts in Buddhist Studies",
          degree: "BACHELOR",
          durationYears: 4,
          descriptionTh: "ศึกษาหลักธรรมคำสอนในพระพุทธศาสนา ประวัติศาสตร์ และการประยุกต์ใช้ในสังคมปัจจุบัน",
          orderIndex: 1,
        }
      });

      await prisma.curriculum.create({
        data: {
          tenantId: core.tenantId,
          nameTh: "พุทธศาสตรมหาบัณฑิต สาขาวิชาปรัชญา",
          nameEn: "Master of Arts in Philosophy",
          degree: "MASTER",
          durationYears: 2,
          descriptionTh: "ศึกษาและวิจัยเชิงลึกในปรัชญาตะวันออกและตะวันตก",
          orderIndex: 2,
        }
      });
    }

    // Seed Administration
    const existingDoc = await prisma.adminDocument.findFirst({ where: { tenantId: core.tenantId, title: "คู่มือการปฏิบัติงานสำหรับบุคลากรใหม่" } });
    if (!existingDoc) {
      await prisma.adminDocument.create({
        data: {
          tenantId: core.tenantId,
          title: "คู่มือการปฏิบัติงานสำหรับบุคลากรใหม่",
          description: "อธิบายโครงสร้าง สวัสดิการ และการทำงานเบื้องต้น",
          fileUrl: "https://example.com/docs/manual-new-staff.pdf",
          category: "MANUAL",
          visibility: "INTERNAL",
        }
      });

      await prisma.adminDocument.create({
        data: {
          tenantId: core.tenantId,
          title: "แบบฟอร์มขอลาพักผ่อน",
          description: "แบบฟอร์มสำหรับยื่นขอลาพักผ่อนประจำปี",
          fileUrl: "https://example.com/docs/leave-form.pdf",
          category: "FORM",
          visibility: "PUBLIC",
        }
      });
    }

    // Seed Meetings
    const room1 = await prisma.meetingRoom.findFirst({ where: { tenantId: core.tenantId, name: "ห้องประชุม 1 (พุทธปัญญา)" } }) ?? await prisma.meetingRoom.create({
      data: {
        tenantId: core.tenantId,
        name: "ห้องประชุม 1 (พุทธปัญญา)",
        capacity: 30,
        equipment: "Projector, Whiteboard, Mic",
      }
    });

    const existingRoom2 = await prisma.meetingRoom.findFirst({ where: { tenantId: core.tenantId, name: "ห้องประชุม 2 (สัมมาทิฏฐิ)" } });
    if (!existingRoom2) {
      await prisma.meetingRoom.create({
        data: {
          tenantId: core.tenantId,
          name: "ห้องประชุม 2 (สัมมาทิฏฐิ)",
          capacity: 10,
          equipment: "Smart TV, Video Conference",
        }
      });
    }

    const existingBooking = await prisma.meetingBooking.findFirst({ where: { tenantId: core.tenantId, roomId: room1.id } });
    if (!existingBooking) {
      await prisma.meetingBooking.create({
        data: {
          tenantId: core.tenantId,
          roomId: room1.id,
          requesterId: adminUser!.id,
          title: "ประชุมอาจารย์ประจำภาควิชา",
          startTime: new Date(Date.now() + 86400000), // Tomorrow
          endTime: new Date(Date.now() + 86400000 + 7200000), // +2 hours
          status: "APPROVED",
          remark: "ขอเตรียมน้ำดื่ม 30 ขวด",
        }
      });
    }

    // Seed Teacher & Attendance Class
    const teacherUser = await prisma.user.findUnique({ where: { email: "teacher@buddhist.mcu.ac.th" } }) ?? adminUser!;
    
    // Seed Sample Students
    const sampleStudentsData = [
      { studentCode: "660101001", firstName: "พระมหาธีรภัทร", lastName: "ญาณเมธี", title: "พระมหา", yearLevel: 3, department: "สาขาวิชาพระพุทธศาสนา" },
      { studentCode: "660101002", firstName: "พระชยานันท์", lastName: "วชิรญาโณ", title: "พระ", yearLevel: 3, department: "สาขาวิชาพระพุทธศาสนา" },
      { studentCode: "660101003", firstName: "สามเณรสมพร", lastName: "ใจบุญ", title: "สามเณร", yearLevel: 3, department: "สาขาวิชาปรัชญา" },
      { studentCode: "660101004", firstName: "สมชาย", lastName: "สิทธิพงษ์", title: "นาย", yearLevel: 3, department: "สาขาวิชาพระพุทธศาสนา" },
      { studentCode: "660101005", firstName: "กัญญา", lastName: "เมตตาจิต", title: "นางสาว", yearLevel: 3, department: "สาขาวิชาบาลีพุทธศาสตร์" },
    ];

    const seededStudents: any[] = [];
    for (const s of sampleStudentsData) {
      const student = await prisma.student.upsert({
        where: { tenantId_studentCode: { tenantId: core.tenantId, studentCode: s.studentCode } },
        update: { firstName: s.firstName, lastName: s.lastName, yearLevel: s.yearLevel, department: s.department },
        create: {
          tenantId: core.tenantId,
          studentCode: s.studentCode,
          firstName: s.firstName,
          lastName: s.lastName,
          title: s.title,
          yearLevel: s.yearLevel,
          department: s.department,
          faculty: "คณะพุทธศาสตร์",
        },
      });
      seededStudents.push(student);
    }

    // Seed Course (Option B Enterprise Model)
    let course = await prisma.course.findFirst({
      where: { tenantId: core.tenantId, courseCode: "BUD101" },
    });

    if (!course) {
      course = await prisma.course.create({
        data: {
          tenantId: core.tenantId,
          courseCode: "BUD101",
          courseName: "พุทธประวัติและวรรณกรรมทางพระพุทธศาสนา",
          courseNameEn: "Life of the Buddha and Buddhist Literature",
          credits: 3,
          section: "1",
          term: "1/2569",
          academicYear: "2569",
          semester: 1,
          description: "ศึกษาประวัติความเป็นมาและวรรณกรรมพุทธศาสนาชั้นต้น",
          targetSessions: 16,
          room: "B302 อาคารเรียนรวม",
          dayOfWeek: 1, // จันทร์
          startTime: "09.00",
          endTime: "11.30",
          primaryTeacherId: teacherUser.id,
        },
      });
    }

    // Link Course Teacher
    await prisma.courseTeacher.upsert({
      where: { courseId_userId: { courseId: course.id, userId: teacherUser.id } },
      update: { isPrimary: true },
      create: {
        tenantId: core.tenantId,
        courseId: course.id,
        userId: teacherUser.id,
        isPrimary: true,
        role: "TEACHER",
      },
    });

    // Enroll Students in Course
    const enrollments: any[] = [];
    for (const s of seededStudents) {
      const enr = await prisma.courseEnrollment.upsert({
        where: { courseId_studentId: { courseId: course.id, studentId: s.id } },
        update: {},
        create: {
          tenantId: core.tenantId,
          courseId: course.id,
          studentId: s.id,
          status: "ENROLLED",
        },
      });
      enrollments.push(enr);
    }

    // Generate Standard 16 Class Sessions
    const baseDate = new Date();
    baseDate.setHours(9, 0, 0, 0);
    // ย้อนหลัง 4 สัปดาห์ เพื่อให้มี 4 คาบที่สอนแล้ว และ 12 คาบในอนาคต
    baseDate.setDate(baseDate.getDate() - 28);

    for (let i = 1; i <= 16; i++) {
      const sessionDate = new Date(baseDate);
      sessionDate.setDate(baseDate.getDate() + (i - 1) * 7);

      const isPast = i <= 4;
      const status = isPast ? "COMPLETED" : "SCHEDULED";

      const session = await prisma.classSession.upsert({
        where: { courseId_sessionNumber: { courseId: course.id, sessionNumber: i } },
        update: {
          sessionNumber: i,
          status,
        },
        create: {
          tenantId: core.tenantId,
          courseId: course.id,
          sessionNumber: i,
          date: sessionDate,
          startTime: "09.00",
          endTime: "11.30",
          room: "B302 อาคารเรียนรวม",
          topic: `การบรรยายประจำสัปดาห์ที่ ${i}: หัวข้อการเรียนรู้บทที่ ${Math.min(i, 12)}`,
          sessionType: "REGULAR",
          status,
          isCounted: true,
        },
      });

      // ถ้าเป็น 4 คาบแรกที่ COMPLETED แล้ว ให้สร้างบันทึกการเข้าเรียนตัวอย่าง
      if (isPast) {
        for (let sIdx = 0; sIdx < seededStudents.length; sIdx++) {
          const st = seededStudents[sIdx];
          const enr = enrollments[sIdx];
          
          let attStatus: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" = "PRESENT";
          let note: string | null = null;
          if (sIdx === 1 && i === 2) {
            attStatus = "LATE";
            note = "มาสาย 15 นาที";
          } else if (sIdx === 2 && i === 3) {
            attStatus = "ABSENT";
            note = "ไม่แจ้งเหตุขัดข้อง";
          } else if (sIdx === 3 && i === 4) {
            attStatus = "EXCUSED";
            note = "ลาป่วย มีใบรับรองแพทย์";
          }

          await prisma.attendanceRecord.upsert({
            where: { sessionId_studentCode: { sessionId: session.id, studentCode: st.studentCode } },
            update: {
              status: attStatus,
              note,
              enrollmentId: enr.id,
            },
            create: {
              tenantId: core.tenantId,
              sessionId: session.id,
              enrollmentId: enr.id,
              studentCode: st.studentCode,
              studentName: `${st.title || ""} ${st.firstName} ${st.lastName}`.trim(),
              status: attStatus,
              note,
              recordedBy: teacherUser.name,
            },
          });
        }
      }
    }

    // Seed Events
    const evt = await prisma.event.findFirst({ where: { tenantId: core.tenantId, title: "ค่ายพุทธธรรมนำชีวิต" } }) ?? await prisma.event.create({
      data: {
        tenantId: core.tenantId,
        title: "ค่ายพุทธธรรมนำชีวิต",
        description: "กิจกรรมเข้าค่ายปฏิบัติธรรม 3 วัน 2 คืน สำหรับนิสิตใหม่",
        location: "วัดมหาธาตุ",
        startDate: new Date(Date.now() + 86400000 * 7), // Next week
        endDate: new Date(Date.now() + 86400000 * 9),
        capacity: 50,
      }
    });

    const existingReg = await prisma.eventRegistration.findFirst({ where: { tenantId: core.tenantId, eventId: evt.id } });
    if (!existingReg) {
      await prisma.eventRegistration.create({
        data: {
          tenantId: core.tenantId,
          eventId: evt.id,
          studentCode: "660001",
          studentName: "นาย สมชาย ใจดี",
          status: "REGISTERED",
        }
      });
    }
  }

  console.log(`[seed] เสร็จสิ้น — บัญชีเข้าสู่ระบบ:`);
  console.log(`  1. ผู้ดูแลระบบ MCU: admin@buddhist.mcu.ac.th / ${DEV_PASSWORD}`);
  console.log(`  2. ผู้ดูแลระบบ Local: admin@app.local / ${DEV_PASSWORD}`);
  console.log(`  3. เจ้าหน้าที่ MCU: staff@buddhist.mcu.ac.th / ${DEV_PASSWORD}`);
  console.log(`  4. นิสิต MCU: student@buddhist.mcu.ac.th / ${DEV_PASSWORD}`);
}

main().finally(() => prisma.$disconnect());
