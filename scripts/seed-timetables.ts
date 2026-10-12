import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function seedForTenant(tenantId: string) {
  console.log(`Seeding timetables for tenant: ${tenantId}`);

  // 1. Departments
  const deptBuddhism = await prisma.department.upsert({
    where: { id: (await prisma.department.findFirst({ where: { tenantId, nameTh: "ภาควิชาพระพุทธศาสนา" } }))?.id || "00000000-0000-0000-0000-000000000000" },
    update: {},
    create: {
      tenantId,
      nameTh: "ภาควิชาพระพุทธศาสนา",
      nameEn: "Department of Buddhist Studies",
      code: "BUD",
      type: "DEPARTMENT",
      orderIndex: 1,
    },
  });

  const deptPhilosophy = await prisma.department.upsert({
    where: { id: (await prisma.department.findFirst({ where: { tenantId, nameTh: "ภาควิชาศาสนาและปรัชญา" } }))?.id || "00000000-0000-0000-0000-000000000000" },
    update: {
      nameTh: "ภาควิชาศาสนาและปรัชญา",
      nameEn: "Department of Religion and Philosophy",
    },
    create: {
      tenantId,
      nameTh: "ภาควิชาศาสนาและปรัชญา",
      nameEn: "Department of Religion and Philosophy",
      code: "REL-PHIL",
      type: "DEPARTMENT",
      orderIndex: 2,
    },
  });

  // 2. Curriculums
  // 2.1 Bachelor of Art Degree in Buddhist Studies (English Program)
  let currBuddhismEng = await prisma.curriculum.findFirst({
    where: {
      tenantId,
      nameEn: "Bachelor of Art Degree in Buddhist Studies (English Program)",
    },
  });
  if (!currBuddhismEng) {
    currBuddhismEng = await prisma.curriculum.create({
      data: {
        tenantId,
        departmentId: deptBuddhism.id,
        nameTh: "พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา (หลักสูตรภาษาอังกฤษ)",
        nameEn: "Bachelor of Art Degree in Buddhist Studies (English Program)",
        degree: "BACHELOR",
        durationYears: 4,
        descriptionTh: "หลักสูตรพุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา หลักสูตรนานาชาติ มุ่งเน้นการศึกษาพระพุทธศาสนาในระดับสากล",
        descriptionEn: "Bachelor of Art Degree in Buddhist Studies (English Program), Faculty of Buddhism, Mahachulalongkornrajavidyalaya University.",
        orderIndex: 1,
      },
    });
  }

  // 2.2 สาขาวิชาศาสนาและปรัชญา
  let currRelPhil = await prisma.curriculum.findFirst({
    where: {
      tenantId,
      nameTh: "พุทธศาสตรบัณฑิต สาขาวิชาศาสนาและปรัชญา",
    },
  });
  if (!currRelPhil) {
    currRelPhil = await prisma.curriculum.create({
      data: {
        tenantId,
        departmentId: deptPhilosophy.id,
        nameTh: "พุทธศาสตรบัณฑิต สาขาวิชาศาสนาและปรัชญา",
        nameEn: "Bachelor of Arts in Religion and Philosophy",
        degree: "BACHELOR",
        durationYears: 4,
        descriptionTh: "มุ่งเน้นการศึกษาศาสนาเปรียบเทียบ ปรัชญาอินเดีย พุทธปรัชญา และปรัชญาร่วมสมัย",
        descriptionEn: "Study of comparative religions, Indian philosophy, Buddhist philosophy, and contemporary thought.",
        orderIndex: 2,
      },
    });
  }

  // Common notes
  const notesEnglish = `Note :
1. The class day is Buddhist Holy Day (Dhammasavana Day), it is replaced on Friday.
2. The Buddhist Holy Days and Sundays are weekly holiday.
3. Official Days are Holiday.
4. This schedule will be changed properly.`;

  const notesThai = `หมายเหตุ :
1. วันพระและวันนักขัตฤกษ์เป็นวันหยุดทั่วไป (ตารางเรียนวันใดตรงกับวันพระให้ยกไปเรียนวันศุกร์)
2. เครื่องหมายดอกจัน (*) อยู่หลังชื่อรายวิชา หมายถึง ข้อสอบกลาง
3. เครื่องหมายดอกจัน (*) อยู่หลังชื่ออาจารย์ หมายถึง อาจารย์ผู้รับผิดชอบรายวิชา
4. วันพระกับวันอาทิตย์เป็นวันหยุดประจำสัปดาห์`;

  // 3. Timetables
  const timetablesData = [
    // -------------------------------------------------------------
    // 1. English Program - Year 1
    // -------------------------------------------------------------
    {
      curriculumId: currBuddhismEng.id,
      departmentId: deptBuddhism.id,
      titleTh: "ตารางสอนชั้นปีที่ 1 พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา (หลักสูตรภาษาอังกฤษ)",
      titleEn: "Timetable of First Year Students, First Semester, Academic Year 2026",
      academicYear: "2569",
      semester: 1,
      yearLevel: 1,
      room: "Room No. D 517-518",
      termDates: "June 9, 2026 – September 25, 2026",
      notes: notesEnglish,
      scheduleData: [
        {
          id: "eng-y1-1",
          dayOfWeek: 1, // Mon
          startTime: "09.00",
          endTime: "11.30",
          courseCode: "101 101",
          courseName: "Buddhism and Science",
          instructor: "Dr. Onjira Wongsapan",
          periodLabel: "Morning",
        },
        {
          id: "eng-y1-2",
          dayOfWeek: 1, // Mon
          startTime: "13.00",
          endTime: "15.30",
          courseCode: "101 103",
          courseName: "Communication in Tipitaka",
          instructor: "Asst. Prof. Phramaha Yongyut Dhiradhammo, Ph.D. / Ven. Thit Zana",
          periodLabel: "Afternoon",
        },
        {
          id: "eng-y1-3",
          dayOfWeek: 2, // Tue
          startTime: "09.00",
          endTime: "11.30",
          courseCode: "000 102",
          courseName: "General Law",
          instructor: "Asst. Prof. Dr. Doungkamon Tongkanaraksa",
          periodLabel: "Morning",
        },
        {
          id: "eng-y1-4",
          dayOfWeek: 2, // Tue
          startTime: "13.00",
          endTime: "15.30",
          courseCode: "000 136",
          courseName: "Pali",
          instructor: "Assoc. Prof. Phra Dhammavajirapanyacarya, Ph.D. / Assoc. Prof. W. Piyaratana, Ph.D.",
          periodLabel: "Afternoon",
        },
        {
          id: "eng-y1-5",
          dayOfWeek: 2, // Tue
          startTime: "15.30",
          endTime: "17.00",
          courseCode: "0SP 101",
          courseName: "Pali",
          instructor: "Asst. Prof. Piphat Khongprasert",
          periodLabel: "Late Afternoon",
        },
        {
          id: "eng-y1-6",
          dayOfWeek: 3, // Wed
          startTime: "09.00",
          endTime: "11.30",
          courseCode: "000 101",
          courseName: "Man and Society",
          instructor: "Ven. Dharma Priya Bhikkhu, Ph.D.",
          periodLabel: "Morning",
        },
        {
          id: "eng-y1-7",
          dayOfWeek: 3, // Wed
          startTime: "13.00",
          endTime: "15.30",
          courseCode: "000 140",
          courseName: "Buddhist Meditation I",
          instructor: "Phra Sukheesom Silatechaputtiyo, Ph.D.",
          periodLabel: "Afternoon",
        },
      ],
      orderIndex: 1,
    },

    // -------------------------------------------------------------
    // 2. English Program - Year 2
    // -------------------------------------------------------------
    {
      curriculumId: currBuddhismEng.id,
      departmentId: deptBuddhism.id,
      titleTh: "ตารางสอนชั้นปีที่ 2 พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา (หลักสูตรภาษาอังกฤษ)",
      titleEn: "Timetable of Second Year Students, First Semester, Academic Year 2026",
      academicYear: "2569",
      semester: 1,
      yearLevel: 2,
      room: "Room No. D 519-520",
      termDates: "June 9, 2026 – September 25, 2026",
      notes: notesEnglish,
      scheduleData: [
        {
          id: "eng-y2-1",
          dayOfWeek: 1, // Mon
          startTime: "09.00",
          endTime: "11.30",
          courseCode: "000 116",
          courseName: "Basic Sanskrit",
          instructor: "Asst. Prof. W. Piyaratana, Ph.D. / Dr. Sudaporn Kiewngamdee",
          periodLabel: "Morning",
        },
        {
          id: "eng-y2-2",
          dayOfWeek: 1, // Mon
          startTime: "13.00",
          endTime: "15.30",
          courseCode: "000 238",
          courseName: "Buddhist Festival and Traditions",
          instructor: "Asst. Prof. Dr. Supapan Permpool",
          periodLabel: "Afternoon",
        },
        {
          id: "eng-y2-3",
          dayOfWeek: 2, // Tue
          startTime: "09.00",
          endTime: "11.30",
          courseCode: "000 233",
          courseName: "General Religions",
          instructor: "Asst. Prof. Dr. Dhanardhip Hardnualee",
          periodLabel: "Morning",
        },
        {
          id: "eng-y2-4",
          dayOfWeek: 2, // Tue
          startTime: "13.00",
          endTime: "15.30",
          courseCode: "000 103",
          courseName: "Computer and Digital Technology",
          instructor: "Asst. Prof. Phramaha Yongyut Dhiradhammo, Ph.D.",
          periodLabel: "Afternoon",
        },
        {
          id: "eng-y2-5",
          dayOfWeek: 3, // Wed
          startTime: "09.00",
          endTime: "11.30",
          courseCode: "000 241",
          courseName: "Buddhist Meditation II",
          instructor: "Phra Sukheesom Silatechaputtiyo, Ph.D. / Ven. Dr. Subinoy Bhikku*",
          periodLabel: "Morning",
        },
        {
          id: "eng-y2-6",
          dayOfWeek: 3, // Wed
          startTime: "13.00",
          endTime: "15.30",
          courseCode: "101 205",
          courseName: "Buddhism and Ecology",
          instructor: "Dr. Nadnapang Phophichit",
          periodLabel: "Afternoon",
        },
        {
          id: "eng-y2-7",
          dayOfWeek: 4, // Thu
          startTime: "09.00",
          endTime: "11.30",
          courseCode: "0SP 103",
          courseName: "Pali",
          instructor: "Asst. Prof. Piphat Khongprasert / Phramaha Niran Kalyanamedhi, Ph.D.*",
          periodLabel: "Morning",
        },
        {
          id: "eng-y2-8",
          dayOfWeek: 4, // Thu
          startTime: "13.00",
          endTime: "15.30",
          courseCode: "LIB 100",
          courseName: "Library Resource / Home Room",
          instructor: "Staff / Advisor",
          periodLabel: "Afternoon",
        },
      ],
      orderIndex: 2,
    },

    // -------------------------------------------------------------
    // 3. English Program - Year 3
    // -------------------------------------------------------------
    {
      curriculumId: currBuddhismEng.id,
      departmentId: deptBuddhism.id,
      titleTh: "ตารางสอนชั้นปีที่ 3 พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา (หลักสูตรภาษาอังกฤษ)",
      titleEn: "Timetable of Third Year Students, First Semester, Academic Year 2026",
      academicYear: "2569",
      semester: 1,
      yearLevel: 3,
      room: "Room No. D 123",
      termDates: "June 9, 2026 – September 25, 2026",
      notes: notesEnglish,
      scheduleData: [
        {
          id: "eng-y3-1",
          dayOfWeek: 1, // Mon
          startTime: "09.00",
          endTime: "11.30",
          courseCode: "101 322",
          courseName: "Political Science in Tipitaka",
          instructor: "Phramaha Jaroon Kittiyanno, Ph.D.",
          periodLabel: "Morning",
        },
        {
          id: "eng-y3-2",
          dayOfWeek: 1, // Mon
          startTime: "13.00",
          endTime: "15.30",
          courseCode: "000 342",
          courseName: "Buddhist Meditation III",
          instructor: "Phra Sukheesom Silatechaputtiyo, Ph.D.",
          periodLabel: "Afternoon",
        },
        {
          id: "eng-y3-3",
          dayOfWeek: 2, // Tue
          startTime: "09.00",
          endTime: "11.30",
          courseCode: "101 314",
          courseName: "Visuddhimagga Studies",
          instructor: "Assoc. Prof. Phra Dhammavajirapanyacarya, Ph.D. / Assoc. Prof. W. Piyaratana, Ph.D.",
          periodLabel: "Morning",
        },
        {
          id: "eng-y3-4",
          dayOfWeek: 2, // Tue
          startTime: "13.00",
          endTime: "15.30",
          courseCode: "101 307",
          courseName: "Theravada Buddhist Philosophy",
          instructor: "Asst. Prof. Dr. Dhanardhip Hardnualee",
          periodLabel: "Afternoon",
        },
        {
          id: "eng-y3-5",
          dayOfWeek: 3, // Wed
          startTime: "09.00",
          endTime: "11.30",
          courseCode: "101 308",
          courseName: "Buddhism and Human Rights",
          instructor: "Dr. Tratep Techapornchai",
          periodLabel: "Morning",
        },
        {
          id: "eng-y3-6",
          dayOfWeek: 3, // Wed
          startTime: "13.00",
          endTime: "15.30",
          courseCode: "101 322",
          courseName: "Comparison Between Theravada and Mahayana",
          instructor: "Phra Kriengsak Sirisakko, Ph.D. / Dr. Low Yuen Fah*",
          periodLabel: "Afternoon",
        },
      ],
      orderIndex: 3,
    },

    // -------------------------------------------------------------
    // 4. English Program - Year 4
    // -------------------------------------------------------------
    {
      curriculumId: currBuddhismEng.id,
      departmentId: deptBuddhism.id,
      titleTh: "ตารางสอนชั้นปีที่ 4 พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา (หลักสูตรภาษาอังกฤษ)",
      titleEn: "Timetable of Fourth Year Students, First Semester, Academic Year 2026",
      academicYear: "2569",
      semester: 1,
      yearLevel: 4,
      room: "Room No. D 124",
      termDates: "June 9, 2026 – September 25, 2026",
      notes: notesEnglish,
      scheduleData: [
        {
          id: "eng-y4-1",
          dayOfWeek: 1, // Mon
          startTime: "09.00",
          endTime: "11.30",
          courseCode: "101 415",
          courseName: "Jataka Studies",
          instructor: "Phramaha Rachan Cittapalo, Ph.D.",
          periodLabel: "Morning",
        },
        {
          id: "eng-y4-2",
          dayOfWeek: 1, // Mon
          startTime: "13.00",
          endTime: "15.30",
          courseCode: "101 326",
          courseName: "Buddhism and Peace",
          instructor: "Dr. Onjira Wongsaparn",
          periodLabel: "Afternoon",
        },
        {
          id: "eng-y4-3",
          dayOfWeek: 2, // Tue
          startTime: "09.00",
          endTime: "11.30",
          courseCode: "101 418",
          courseName: "English for Buddhism",
          instructor: "Assoc. Prof. Dr. Jutamas Vareesengthip",
          periodLabel: "Morning",
        },
        {
          id: "eng-y4-4",
          dayOfWeek: 2, // Tue
          startTime: "13.00",
          endTime: "15.30",
          courseCode: "000 443",
          courseName: "Buddhist Meditation IV",
          instructor: "Phra Sukheesom Silatechaputtiyo, Ph.D.",
          periodLabel: "Afternoon",
        },
        {
          id: "eng-y4-5",
          dayOfWeek: 3, // Wed
          startTime: "09.00",
          endTime: "11.30",
          courseCode: "101 431",
          courseName: "Buddhism and Modern Economy",
          instructor: "Asst. Prof. Dr. Soontaraporn Techapalokul",
          periodLabel: "Morning",
        },
        {
          id: "eng-y4-6",
          dayOfWeek: 3, // Wed
          startTime: "13.00",
          endTime: "15.30",
          courseCode: "000 416",
          courseName: "Mahayana Buddhism",
          instructor: "Assoc. Prof. Ven. Piyaratana, Ph.D.",
          periodLabel: "Afternoon",
        },
      ],
      orderIndex: 4,
    },

    // -------------------------------------------------------------
    // 5. สาขาวิชาศาสนาและปรัชญา - ชั้นปีที่ 1
    // -------------------------------------------------------------
    {
      curriculumId: currRelPhil.id,
      departmentId: deptPhilosophy.id,
      titleTh: "ตารางสอนชั้นปีที่ 1 พุทธศาสตรบัณฑิต สาขาวิชาศาสนาและปรัชญา",
      titleEn: "Timetable of First Year Students, Department of Religion and Philosophy",
      academicYear: "2569",
      semester: 1,
      yearLevel: 1,
      room: "ชั้น 5 ห้อง D 516/1",
      termDates: "เปิดเรียนวันที่ 9 มิถุนายน 2569 สิ้นสุดวันที่ 25 กันยายน 2569",
      notes: notesThai,
      scheduleData: [
        {
          id: "phil-y1-1",
          dayOfWeek: 1, // จันทร์
          startTime: "09.00",
          endTime: "11.30",
          courseCode: "000 102",
          courseName: "กฎหมายทั่วไป",
          instructor: "พระมหามงคลกานต์ ฐิตธมฺโม, รศ. ดร.*/อ.ดร.คงชิต ชินสิญจ์",
          periodLabel: "เช้า",
        },
        {
          id: "phil-y1-2",
          dayOfWeek: 1, // จันทร์
          startTime: "12.30",
          endTime: "15.10",
          courseCode: "000 136",
          courseName: "ภาษาบาลี",
          instructor: "พระครูศรีสิทธิบัณฑิต, ดร./ผศ. ดร.บุญเกิด เจริญแนว*",
          periodLabel: "บ่าย 1",
        },
        {
          id: "phil-y1-3",
          dayOfWeek: 2, // อังคาร
          startTime: "09.00",
          endTime: "11.30",
          courseCode: "112 305",
          courseName: "ปรัชญาอินเดียสมัยโบราณ (เรียนห้อง D 220/2)",
          instructor: "พระจาตุรงค์ อาจารสุโภ, ผศ.ดร.*/พระมหาจรูญ กิตฺติปญฺโญ, ดร./ผศ. ดร.ธนาธิป ฮาดเนาลี",
          room: "D 220/2",
          periodLabel: "เช้า",
        },
        {
          id: "phil-y1-4",
          dayOfWeek: 2, // อังคาร
          startTime: "12.30",
          endTime: "15.10",
          courseCode: "000 140",
          courseName: "กรรมฐาน 1",
          instructor: "พระครูพิศิษฐ์ธรรมพิสุทธิ์, อ.ดร.*/พระมหาไพโรจน์ ญาณกุสโล, อ.ดร.",
          periodLabel: "บ่าย 1",
        },
        {
          id: "phil-y1-5",
          dayOfWeek: 2, // อังคาร
          startTime: "15.10",
          endTime: "17.00",
          courseCode: "112 102",
          courseName: "ศาสนาพราหมณ์-ฮินดู (เรียนห้อง D 220/2)",
          instructor: "ผศ.ดร.คงสฤษฎ์ แพงทรัพย์*/พระครูโกวิทสุตาภรณ์, ดร.",
          room: "D 220/2",
          periodLabel: "บ่าย 2",
        },
        {
          id: "phil-y1-6",
          dayOfWeek: 3, // พุธ
          startTime: "09.00",
          endTime: "11.30",
          courseCode: "999 999",
          courseName: "Ai เบื้องต้น",
          instructor: "รศ.ดร.บัญญพน สวัสดี/ดร.วิศาล มายัง",
          periodLabel: "เช้า",
        },
        {
          id: "phil-y1-7",
          dayOfWeek: 3, // พุธ
          startTime: "12.30",
          endTime: "15.10",
          courseCode: "000 101",
          courseName: "มนุษย์กับสังคม",
          instructor: "พระมหาราชัน จิตฺตปาโล, ดร./ ดร.อธิเทพ ผาทา",
          periodLabel: "บ่าย 1",
        },
        {
          id: "phil-y1-8",
          dayOfWeek: 3, // พุธ
          startTime: "15.10",
          endTime: "17.00",
          courseCode: "SP 101",
          courseName: "บาลี 1 (รายวิชาเสริมพื้นฐาน)",
          instructor: "ผศ.ดร.บุญเกิด เจริญแนว",
          periodLabel: "บ่าย 2",
        },
      ],
      orderIndex: 5,
    },

    // -------------------------------------------------------------
    // 6. สาขาวิชาศาสนาและปรัชญา - ชั้นปีที่ 2
    // -------------------------------------------------------------
    {
      curriculumId: currRelPhil.id,
      departmentId: deptPhilosophy.id,
      titleTh: "ตารางสอนชั้นปีที่ 2 พุทธศาสตรบัณฑิต สาขาวิชาศาสนาและปรัชญา",
      titleEn: "Timetable of Second Year Students, Department of Religion and Philosophy",
      academicYear: "2569",
      semester: 1,
      yearLevel: 2,
      room: "ชั้น 5 ห้อง D 516/2",
      termDates: "เปิดเรียนวันที่ 9 มิถุนายน 2569 สิ้นสุดวันที่ 25 กันยายน 2569",
      notes: notesThai,
      scheduleData: [
        {
          id: "phil-y2-1",
          dayOfWeek: 1, // จันทร์
          startTime: "09.00",
          endTime: "11.30",
          courseCode: "000 238",
          courseName: "เทศกาลและพิธีกรรมพระพุทธศาสนา*",
          instructor: "พระครูพิศิษฐ์ธรรมพิสุทธิ์, ดร.",
          periodLabel: "เช้า",
        },
        {
          id: "phil-y2-2",
          dayOfWeek: 1, // จันทร์
          startTime: "12.30",
          endTime: "15.10",
          courseCode: "000 241",
          courseName: "กรรมฐาน 2",
          instructor: "พระครูภาวนาพัฒนบัณฑิต วิ., ผศ. ดร.*/พระภาวนาวชิรสุนทร วิ., ดร.",
          periodLabel: "บ่าย 1",
        },
        {
          id: "phil-y2-3",
          dayOfWeek: 2, // อังคาร
          startTime: "09.00",
          endTime: "11.30",
          courseCode: "000 103",
          courseName: "คอมพิวเตอร์และเทคโนโลยีดิจิตัล*",
          instructor: "พระมหายงยุทธ ธีรธมฺโม, ผศ. ดร.",
          periodLabel: "เช้า",
        },
        {
          id: "phil-y2-4",
          dayOfWeek: 2, // อังคาร
          startTime: "12.30",
          endTime: "15.10",
          courseCode: "000 116",
          courseName: "ภาษาสันสกฤตเบื้องต้น",
          instructor: "อ.ดร.สุดาพร เขียวงามดี",
          periodLabel: "บ่าย 1",
        },
        {
          id: "phil-y2-5",
          dayOfWeek: 3, // พุธ
          startTime: "09.00",
          endTime: "11.30",
          courseCode: "000 233",
          courseName: "ศาสนาทั่วไป",
          instructor: "ผศ.ดร.แสวง นิลนามะ*/ผศ.ดร.คงสฤษฎ์ แพงทรัพย์",
          periodLabel: "เช้า",
        },
        {
          id: "phil-y2-6",
          dayOfWeek: 3, // พุธ
          startTime: "12.30",
          endTime: "15.10",
          courseCode: "112 412",
          courseName: "พุทธปรัชญา (เรียนห้อง D 220/2)",
          instructor: "พระมหามงคลกานต์ ฐิตธมฺโม, รศ. ดร.*/ดร.ไชยา เสนแสนยา",
          room: "D 220/2",
          periodLabel: "บ่าย 1",
        },
        {
          id: "phil-y2-7",
          dayOfWeek: 3, // พุธ
          startTime: "15.10",
          endTime: "17.00",
          courseCode: "888 888",
          courseName: "Gamification",
          instructor: "รศ.ดร.วิลาวัลย์ / รศ.ดร.วราพร",
          periodLabel: "บ่าย 2",
        },
        {
          id: "phil-y2-8",
          dayOfWeek: 4, // พฤหัสบดี
          startTime: "09.00",
          endTime: "11.30",
          courseCode: "SP 103",
          courseName: "บาลี 3 (รายวิชาเสริมพื้นฐาน)",
          instructor: "ผศ.ดร.บุญเกิด เจริญแนว",
          periodLabel: "เช้า",
        },
      ],
      orderIndex: 6,
    },
  ];

  for (const item of timetablesData) {
    const existing = await prisma.curriculumTimetable.findFirst({
      where: {
        tenantId,
        curriculumId: item.curriculumId,
        yearLevel: item.yearLevel,
        academicYear: item.academicYear,
        semester: item.semester,
      },
    });

    if (existing) {
      await prisma.curriculumTimetable.update({
        where: { id: existing.id },
        data: item,
      });
      console.log(`Updated timetable: ${item.titleTh}`);
    } else {
      await prisma.curriculumTimetable.create({
        data: {
          tenantId,
          ...item,
        },
      });
      console.log(`Created timetable: ${item.titleTh}`);
    }
  }
}

async function main() {
  const tenants = await prisma.tenant.findMany({
    where: {
      code: { in: ["MCU", "DEMO"] },
    },
  });

  for (const t of tenants) {
    await seedForTenant(t.id);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
