import { PrismaClient } from "../src/generated/prisma";

const db = new PrismaClient();

interface RawStudent {
  code: string;
  name: string;
  major: "Religion and Philosophy" | "Buddhist Studies";
}

const YEAR_1_ENGLISH_STUDENTS: RawStudent[] = [
  // Major in Religion and Philosophy (18 students)
  { code: "6901501005", name: "Babudhan Marma", major: "Religion and Philosophy" },
  { code: "6901501028", name: "Visuddha -", major: "Religion and Philosophy" },
  { code: "6901501029", name: "Arka Barua", major: "Religion and Philosophy" },
  { code: "6901501030", name: "Liton Barua", major: "Religion and Philosophy" },
  { code: "6901501034", name: "Shohag Barua", major: "Religion and Philosophy" },
  { code: "6901501035", name: "Tejavanata -", major: "Religion and Philosophy" },
  { code: "6901501036", name: "Juni Marma", major: "Religion and Philosophy" },
  { code: "6901501037", name: "Kongshajai Marma", major: "Religion and Philosophy" },
  { code: "6901501038", name: "Mong Sain Marma", major: "Religion and Philosophy" },
  { code: "6901501039", name: "Mongsathowai Marma", major: "Religion and Philosophy" },
  { code: "6901501040", name: "Mongri Marma", major: "Religion and Philosophy" },
  { code: "6901501042", name: "Paimong Marma", major: "Religion and Philosophy" },
  { code: "6901501044", name: "Tong Mone Chakma", major: "Religion and Philosophy" },
  { code: "6901501045", name: "U Hla Swe Marma", major: "Religion and Philosophy" },
  { code: "6901501046", name: "U sai swe Marma", major: "Religion and Philosophy" },
  { code: "6901501058", name: "Bipul B K", major: "Religion and Philosophy" },
  { code: "6901501085", name: "Akash Barua", major: "Religion and Philosophy" },
  { code: "6901501088", name: "Sajib Barua Pappu", major: "Religion and Philosophy" },

  // Major in Buddhist Studies (37 students)
  { code: "6901501012", name: "Joy Barua", major: "Buddhist Studies" },
  { code: "6901501014", name: "Khokan Barua", major: "Buddhist Studies" },
  { code: "6901501015", name: "Misson Barua", major: "Buddhist Studies" },
  { code: "6901501016", name: "Moon Barua", major: "Buddhist Studies" },
  { code: "6901501017", name: "Torjoy Barua Newton", major: "Buddhist Studies" },
  { code: "6901501018", name: "Parta Barua", major: "Buddhist Studies" },
  { code: "6901501019", name: "Prantik Barua", major: "Buddhist Studies" },
  { code: "6901501020", name: "Promise Barua", major: "Buddhist Studies" },
  { code: "6901501021", name: "Rubel Barua", major: "Buddhist Studies" },
  { code: "6901501022", name: "Sajib Barua", major: "Buddhist Studies" },
  { code: "6901501023", name: "Sawrav Barua", major: "Buddhist Studies" },
  { code: "6901501025", name: "Swapon Barua", major: "Buddhist Studies" },
  { code: "6901501026", name: "Thowaichingaung Marma", major: "Buddhist Studies" },
  { code: "6901501027", name: "U Aong Shing Marma", major: "Buddhist Studies" },
  { code: "6901501059", name: "Bipul Barua Joy", major: "Buddhist Studies" },
  { code: "6901501060", name: "Dip Barua", major: "Buddhist Studies" },
  { code: "6901501061", name: "Chandan Bappy", major: "Buddhist Studies" },
  { code: "6901501062", name: "Eain Daka -", major: "Buddhist Studies" },
  { code: "6901501064", name: "Huu Tan Le", major: "Buddhist Studies" },
  { code: "6901501065", name: "Kowshik Barua", major: "Buddhist Studies" },
  { code: "6901501066", name: "Nayan Barua", major: "Buddhist Studies" },
  { code: "6901501067", name: "Nguyen Tan Tien", major: "Buddhist Studies" },
  { code: "6901501068", name: "Nikhil Barua", major: "Buddhist Studies" },
  { code: "6901501069", name: "Partho Barua", major: "Buddhist Studies" },
  { code: "6901501071", name: "Promiz Barua", major: "Buddhist Studies" },
  { code: "6901501072", name: "Punam Barua", major: "Buddhist Studies" },
  { code: "6901501073", name: "Pyinar Satka -", major: "Buddhist Studies" },
  { code: "6901501075", name: "Rudra Barua", major: "Buddhist Studies" },
  { code: "6901501076", name: "Sajib Barua", major: "Buddhist Studies" },
  { code: "6901501077", name: "Sajo Barua", major: "Buddhist Studies" },
  { code: "6901501078", name: "Semul Barua", major: "Buddhist Studies" },
  { code: "6901501079", name: "Shawon Barua", major: "Buddhist Studies" },
  { code: "6901501080", name: "Sreekanta Barua", major: "Buddhist Studies" },
  { code: "6901501083", name: "Uttam Barua", major: "Buddhist Studies" },
  { code: "6901501104", name: "Dolan Barua", major: "Buddhist Studies" },
  { code: "6901501107", name: "Malaprue Karbary", major: "Buddhist Studies" },
  { code: "6901501108", name: "Pranta Barua", major: "Buddhist Studies" },
];

function splitName(rawName: string) {
  const clean = rawName.trim().replace(/\s+/g, " ");
  const parts = clean.split(" ");
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "-" };
  }
  if (parts.length === 2) {
    return { firstName: parts[0], lastName: parts[1] };
  }
  // 3 or more words (e.g. "U Hla Swe Marma" or "Torjoy Barua Newton" or "Nguyen Tan Tien")
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
}

async function main() {
  console.log("=== เริ่มต้นนำเข้ารายชื่อนิสิต ชั้นปีที่ 1 ภาคภาษาอังกฤษ (55 คน) ===");

  const tenants = await db.tenant.findMany();
  console.log(`พบ ${tenants.length} tenants ในระบบ:`, tenants.map(t => `${t.nameTh} (${t.code})`).join(", "));

  for (const tenant of tenants) {
    console.log(`\n--- ดำเนินการกับ Tenant: ${tenant.nameTh} (${tenant.code}) ---`);

    let upsertedCount = 0;

    for (const item of YEAR_1_ENGLISH_STUDENTS) {
      const { firstName, lastName } = splitName(item.name);
      const department =
        item.major === "Religion and Philosophy"
          ? "ภาควิชาศาสนาและปรัชญา"
          : "ภาควิชาพระพุทธศาสนา";
      const curriculumName = `พุทธศาสตรบัณฑิต สาขาวิชา${item.major === "Religion and Philosophy" ? "ศาสนาและปรัชญา" : "พระพุทธศาสนา"} (หลักสูตรภาษาอังกฤษ)`;

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
          title: "",
          firstName,
          lastName,
          yearLevel: 1,
          degree: "ปริญญาตรี",
          curriculumName,
          department,
          major: item.major,
          gender: "ชาย",
          studyStatus: "ปกติ",
          faculty: "คณะพุทธศาสตร์",
          isActive: true,
        },
        update: {
          firstName,
          lastName,
          yearLevel: 1,
          degree: "ปริญญาตรี",
          curriculumName,
          department,
          major: item.major,
          studyStatus: "ปกติ",
          isActive: true,
        },
      });

      upsertedCount++;
    }

    console.log(`  ✓ บันทึกข้อมูลนิสิตปี 1 สำเร็จ: ${upsertedCount} คน`);

    // ดึงนิสิตปี 1 เข้าคอร์สที่มีอยู่แล้วในระบบทันที
    const courses = await db.course.findMany({
      where: {
        tenantId: tenant.id,
        academicYear: "2569",
        semester: 2,
      },
    });

    console.log(`  พบคอร์สเปิดสอนเทอม 2/2569 ทั้งหมด ${courses.length} คอร์ส`);

    let autoEnrolledTotal = 0;
    for (const course of courses) {
      // ตรวจสอบว่าคอร์สนี้เป็นวิชาของปี 1 หรือไม่
      // วิชาปี 1 ของภาคภาษาอังกฤษ:
      // ร่วมกัน: 000 239, 000 204, 000 237, 000 206, 0SP102
      // เฉพาะ Rel-Phil: 112 412, 112 308
      // เฉพาะ Budd-Stud: 101 104, 101 102
      const isCommonYear1 = ["000 239", "000 204", "000 237", "000 206", "0SP102", "SP 102"].includes(course.courseCode);
      const isRelPhilYear1 = ["112 412", "112 308"].includes(course.courseCode);
      const isBuddStudYear1 = ["101 104", "101 102"].includes(course.courseCode);

      if (isCommonYear1 || isRelPhilYear1 || isBuddStudYear1) {
        // หานิสิตที่เข้าเงื่อนไข
        let eligibleCodes: string[] = [];
        if (isCommonYear1) {
          eligibleCodes = YEAR_1_ENGLISH_STUDENTS.map((s) => s.code);
        } else if (isRelPhilYear1) {
          eligibleCodes = YEAR_1_ENGLISH_STUDENTS.filter((s) => s.major === "Religion and Philosophy").map((s) => s.code);
        } else if (isBuddStudYear1) {
          eligibleCodes = YEAR_1_ENGLISH_STUDENTS.filter((s) => s.major === "Buddhist Studies").map((s) => s.code);
        }

        const matchingStudents = await db.student.findMany({
          where: {
            tenantId: tenant.id,
            studentCode: { in: eligibleCodes },
          },
        });

        for (const st of matchingStudents) {
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
            autoEnrolledTotal++;
          }
        }
      }
    }

    console.log(`  ✓ เชื่อมโยงเข้าห้องเรียนให้อัตโนมัติ: ${autoEnrolledTotal} รายการลงทะเบียน`);
  }

  console.log("\n=== นำเข้าข้อมูลนิสิตปี 1 ภาคภาษาอังกฤษเสร็จสมบูรณ์ครบทั้ง 55 คน ===");
}

main()
  .catch((e) => {
    console.error("Error importing students:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
