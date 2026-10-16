import { PrismaClient } from "../src/generated/prisma";

const db = new PrismaClient();

const CALENDAR_2026 = {
  academicYear: "2026",
  title: "Academic Calendar for Bachelor's Degree Programs, Academic year 2026",
  titleTh: "ปฏิทินการศึกษา ระดับปริญญาตรี ปีการศึกษา 2569 (Academic Year 2026)",
  degreeLevel: "BACHELOR",
  authority: "Mahachulalongkornrajavidyalaya University Notification",
  announcedDate: "20 December 2025",
  signatory: "Prof. Dr. Phra Brahmawatcharatheeracharn, Rector, Mahachulalongkornrajavidyalaya University",
  description: "Established under Section 27 (2) of the MCU Act of 1997 and Clause 11 of the University's 2023 regulations on bachelor's degree education.",
};

interface EventDef {
  semester: number;
  semesterLabel: string;
  titleEn: string;
  titleTh: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  dateDisplayEn: string;
  dateDisplayTh: string;
  eventType: string;
  orderIndex: number;
}

const EVENTS_2026: EventDef[] = [
  // =========================================================================
  // 1st Semester
  // =========================================================================
  {
    semester: 1,
    semesterLabel: "1st Semester",
    titleEn: "Course enrollment online & fee payment",
    titleTh: "ลงทะเบียนเรียนออนไลน์และชำระเงินค่าธรรมเนียมการศึกษา",
    startDate: "2026-06-01",
    endDate: "2026-06-06",
    dateDisplayEn: "June 1 - 6, 2026",
    dateDisplayTh: "1 - 6 มิถุนายน 2569",
    eventType: "ENROLLMENT",
    orderIndex: 1,
  },
  {
    semester: 1,
    semesterLabel: "1st Semester",
    titleEn: "Start of Semester",
    titleTh: "เปิดภาคการศึกษา / เริ่มต้นการเรียนการสอน",
    startDate: "2026-06-09",
    endDate: "2026-06-09",
    dateDisplayEn: "June 9, 2026",
    dateDisplayTh: "9 มิถุนายน 2569",
    eventType: "SEMESTER_START",
    orderIndex: 2,
  },
  {
    semester: 1,
    semesterLabel: "1st Semester",
    titleEn: "Add/Drop courses",
    titleTh: "เพิ่ม-ถอนรายวิชา",
    startDate: "2026-06-09",
    endDate: "2026-06-22",
    dateDisplayEn: "June 9 - 22, 2026",
    dateDisplayTh: "9 - 22 มิถุนายน 2569",
    eventType: "ADD_DROP",
    orderIndex: 3,
  },
  {
    semester: 1,
    semesterLabel: "1st Semester",
    titleEn: "Orientation ceremony",
    titleTh: "พิธีปฐมนิเทศนิสิตใหม่",
    startDate: "2026-06-23",
    endDate: "2026-06-23",
    dateDisplayEn: "June 23, 2026",
    dateDisplayTh: "23 มิถุนายน 2569",
    eventType: "ORIENTATION",
    orderIndex: 4,
  },
  {
    semester: 1,
    semesterLabel: "1st Semester",
    titleEn: "Late registration with fine payment",
    titleTh: "ลงทะเบียนล่าช้า (มีค่าปรับ)",
    startDate: "2026-06-25",
    endDate: "2026-06-25",
    dateDisplayEn: "June 25, 2026",
    dateDisplayTh: "25 มิถุนายน 2569",
    eventType: "LATE_REGISTRATION",
    orderIndex: 5,
  },
  {
    semester: 1,
    semesterLabel: "1st Semester",
    titleEn: "Lecturer evaluation (Online)",
    titleTh: "ประเมินการจัดการเรียนการสอนของอาจารย์ผู้สอน (ออนไลน์)",
    startDate: "2026-09-01",
    endDate: "2026-09-25",
    dateDisplayEn: "September 1 - 25, 2026",
    dateDisplayTh: "1 - 25 กันยายน 2569",
    eventType: "EVALUATION",
    orderIndex: 6,
  },
  {
    semester: 1,
    semesterLabel: "1st Semester",
    titleEn: "Last day of classes",
    titleTh: "วันสุดท้ายของการเรียนการสอน (ปิดเรียน)",
    startDate: "2026-09-25",
    endDate: "2026-09-25",
    dateDisplayEn: "September 25, 2026",
    dateDisplayTh: "25 กันยายน 2569",
    eventType: "LAST_DAY_CLASS",
    orderIndex: 7,
  },
  {
    semester: 1,
    semesterLabel: "1st Semester",
    titleEn: "1st semester examinations",
    titleTh: "สอบไล่ประจำภาคการศึกษาที่ 1",
    startDate: "2026-10-08",
    endDate: "2026-10-20",
    dateDisplayEn: "October 8 - 20, 2026",
    dateDisplayTh: "8 - 20 ตุลาคม 2569",
    eventType: "EXAM",
    orderIndex: 8,
  },

  // =========================================================================
  // 2nd Semester (Current Semester)
  // =========================================================================
  {
    semester: 2,
    semesterLabel: "2nd Semester",
    titleEn: "Course enrollment online & fee payment",
    titleTh: "ลงทะเบียนเรียนออนไลน์และชำระเงินค่าธรรมเนียมการศึกษา",
    startDate: "2026-10-26",
    endDate: "2026-10-30",
    dateDisplayEn: "October 26 - 30, 2026",
    dateDisplayTh: "26 - 30 ตุลาคม 2569",
    eventType: "ENROLLMENT",
    orderIndex: 9,
  },
  {
    semester: 2,
    semesterLabel: "2nd Semester",
    titleEn: "Start of Semester",
    titleTh: "เปิดภาคการศึกษา / เริ่มต้นการเรียนการสอน",
    startDate: "2026-11-02",
    endDate: "2026-11-02",
    dateDisplayEn: "November 2, 2026",
    dateDisplayTh: "2 พฤศจิกายน 2569",
    eventType: "SEMESTER_START",
    orderIndex: 10,
  },
  {
    semester: 2,
    semesterLabel: "2nd Semester",
    titleEn: "Add/Drop courses",
    titleTh: "เพิ่ม-ถอนรายวิชา",
    startDate: "2026-11-02",
    endDate: "2026-11-15",
    dateDisplayEn: "November 2 - 15, 2026",
    dateDisplayTh: "2 - 15 พฤศจิกายน 2569",
    eventType: "ADD_DROP",
    orderIndex: 11,
  },
  {
    semester: 2,
    semesterLabel: "2nd Semester",
    titleEn: "Late registration with fine payment",
    titleTh: "ลงทะเบียนล่าช้า (มีค่าปรับ)",
    startDate: "2026-11-16",
    endDate: "2026-11-16",
    dateDisplayEn: "November 16, 2026",
    dateDisplayTh: "16 พฤศจิกายน 2569",
    eventType: "LATE_REGISTRATION",
    orderIndex: 12,
  },
  {
    semester: 2,
    semesterLabel: "2nd Semester",
    titleEn: "Lecturer evaluation (Online)",
    titleTh: "ประเมินการจัดการเรียนการสอนของอาจารย์ผู้สอน (ออนไลน์)",
    startDate: "2027-02-01",
    endDate: "2027-02-26",
    dateDisplayEn: "February 1 - 26, 2027",
    dateDisplayTh: "1 - 26 กุมภาพันธ์ 2570",
    eventType: "EVALUATION",
    orderIndex: 13,
  },
  {
    semester: 2,
    semesterLabel: "2nd Semester",
    titleEn: "Last day of classes",
    titleTh: "วันสุดท้ายของการเรียนการสอน (ปิดเรียน)",
    startDate: "2027-02-26",
    endDate: "2027-02-26",
    dateDisplayEn: "February 26, 2027",
    dateDisplayTh: "26 กุมภาพันธ์ 2570",
    eventType: "LAST_DAY_CLASS",
    orderIndex: 14,
  },
  {
    semester: 2,
    semesterLabel: "2nd Semester",
    titleEn: "2nd semester examinations",
    titleTh: "สอบไล่ประจำภาคการศึกษาที่ 2",
    startDate: "2027-03-08",
    endDate: "2027-03-17",
    dateDisplayEn: "March 8 - 17, 2027",
    dateDisplayTh: "8 - 17 มีนาคม 2570",
    eventType: "EXAM",
    orderIndex: 15,
  },

  // =========================================================================
  // Summer Semester
  // =========================================================================
  {
    semester: 3,
    semesterLabel: "Summer semester",
    titleEn: "Course enrollment online & fee payment",
    titleTh: "ลงทะเบียนเรียนออนไลน์และชำระเงินค่าธรรมเนียมการศึกษา",
    startDate: "2027-03-23",
    endDate: "2027-03-29",
    dateDisplayEn: "March 23 - 29, 2027",
    dateDisplayTh: "23 - 29 มีนาคม 2570",
    eventType: "ENROLLMENT",
    orderIndex: 16,
  },
  {
    semester: 3,
    semesterLabel: "Summer semester",
    titleEn: "Start of summer Semester",
    titleTh: "เปิดภาคฤดูร้อน / เริ่มต้นการเรียนการสอน",
    startDate: "2027-04-01",
    endDate: "2027-04-01",
    dateDisplayEn: "April 1, 2027",
    dateDisplayTh: "1 เมษายน 2570",
    eventType: "SEMESTER_START",
    orderIndex: 17,
  },
  {
    semester: 3,
    semesterLabel: "Summer semester",
    titleEn: "Add/Drop courses",
    titleTh: "เพิ่ม-ถอนรายวิชา",
    startDate: "2027-04-01",
    endDate: "2027-04-07",
    dateDisplayEn: "April 1 - 7, 2027",
    dateDisplayTh: "1 - 7 เมษายน 2570",
    eventType: "ADD_DROP",
    orderIndex: 18,
  },
  {
    semester: 3,
    semesterLabel: "Summer semester",
    titleEn: "Late registration with fine payment",
    titleTh: "ลงทะเบียนล่าช้า (มีค่าปรับ)",
    startDate: "2027-04-08",
    endDate: "2027-04-08",
    dateDisplayEn: "April 8, 2027",
    dateDisplayTh: "8 เมษายน 2570",
    eventType: "LATE_REGISTRATION",
    orderIndex: 19,
  },
  {
    semester: 3,
    semesterLabel: "Summer semester",
    titleEn: "Lecturer evaluation (Online)",
    titleTh: "ประเมินการจัดการเรียนการสอนของอาจารย์ผู้สอน (ออนไลน์)",
    startDate: "2027-04-22",
    endDate: "2027-04-28",
    dateDisplayEn: "April 22 - 28, 2027",
    dateDisplayTh: "22 - 28 เมษายน 2570",
    eventType: "EVALUATION",
    orderIndex: 20,
  },
  {
    semester: 3,
    semesterLabel: "Summer semester",
    titleEn: "Last day of classes",
    titleTh: "วันสุดท้ายของการเรียนการสอน (ปิดเรียน)",
    startDate: "2027-04-28",
    endDate: "2027-04-28",
    dateDisplayEn: "April 28, 2027",
    dateDisplayTh: "28 เมษายน 2570",
    eventType: "LAST_DAY_CLASS",
    orderIndex: 21,
  },
  {
    semester: 3,
    semesterLabel: "Summer semester",
    titleEn: "Summer semester examinations",
    titleTh: "สอบไล่ประจำภาคฤดูร้อน",
    startDate: "2027-05-06",
    endDate: "2027-05-14",
    dateDisplayEn: "May 6 - 14, 2027",
    dateDisplayTh: "6 - 14 พฤษภาคม 2570",
    eventType: "EXAM",
    orderIndex: 22,
  },
];

async function main() {
  console.log("=== เริ่มต้นนำเข้าปฏิทินการศึกษาปี 2026 (2569) ===");

  const tenants = await db.tenant.findMany();
  console.log(`พบ ${tenants.length} tenants ในระบบ`);

  for (const tenant of tenants) {
    console.log(`\n--- นำเข้าปฏิทินให้กับ Tenant: ${tenant.nameTh} (${tenant.code}) ---`);

    const calendar = await db.academicCalendar.upsert({
      where: {
        tenantId_academicYear_degreeLevel: {
          tenantId: tenant.id,
          academicYear: CALENDAR_2026.academicYear,
          degreeLevel: CALENDAR_2026.degreeLevel,
        },
      },
      create: {
        tenantId: tenant.id,
        academicYear: CALENDAR_2026.academicYear,
        title: CALENDAR_2026.title,
        titleTh: CALENDAR_2026.titleTh,
        degreeLevel: CALENDAR_2026.degreeLevel,
        authority: CALENDAR_2026.authority,
        announcedDate: CALENDAR_2026.announcedDate,
        signatory: CALENDAR_2026.signatory,
        description: CALENDAR_2026.description,
        isActive: true,
      },
      update: {
        title: CALENDAR_2026.title,
        titleTh: CALENDAR_2026.titleTh,
        authority: CALENDAR_2026.authority,
        announcedDate: CALENDAR_2026.announcedDate,
        signatory: CALENDAR_2026.signatory,
        description: CALENDAR_2026.description,
        isActive: true,
      },
    });

    console.log(`  ✓ ปฏิทินหลัก: ${calendar.title} (ID: ${calendar.id})`);

    // ลบเหตุการณ์เดิมของปฏิทินนี้แล้วสร้างใหม่ทั้งหมด
    await db.academicCalendarEvent.deleteMany({
      where: { calendarId: calendar.id },
    });

    for (const ev of EVENTS_2026) {
      await db.academicCalendarEvent.create({
        data: {
          tenantId: tenant.id,
          calendarId: calendar.id,
          semester: ev.semester,
          semesterLabel: ev.semesterLabel,
          titleEn: ev.titleEn,
          titleTh: ev.titleTh,
          startDate: new Date(ev.startDate),
          endDate: new Date(ev.endDate),
          dateDisplayEn: ev.dateDisplayEn,
          dateDisplayTh: ev.dateDisplayTh,
          eventType: ev.eventType,
          orderIndex: ev.orderIndex,
        },
      });
    }

    console.log(`  ✓ บันทึกเหตุการณ์ครบ ${EVENTS_2026.length} รายการ (ภาค 1, ภาค 2, ภาคฤดูร้อน)`);
  }

  console.log("\n=== นำเข้าปฏิทินการศึกษาปี 2026 เสร็จสมบูรณ์ ===");
}

main()
  .catch((e) => {
    console.error("Error importing academic calendar:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
