import { PrismaClient } from "../src/generated/prisma";

const db = new PrismaClient();

interface SlotDef {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  courseCode: string;
  courseName: string;
  instructor: string;
  room?: string;
  periodLabel?: string;
}

interface TimetableDef {
  majorName: string;
  curriculumName: string;
  curriculumNameEn: string;
  departmentName: string;
  yearLevel: number;
  academicYear: string;
  semester: number;
  room: string;
  termDates: string;
  slots: SlotDef[];
}

const TERM_DATES = "2 พฤศจิกายน 2569 – 26 กุมภาพันธ์ 2570 (November 2, 2026 – February 26, 2027)";
const ACADEMIC_YEAR = "2569";
const SEMESTER = 2;

const ENGLISH_TIMETABLES: TimetableDef[] = [
  // =========================================================================
  // 1. Bachelor of Arts in Religion and Philosophy (English Program)
  // =========================================================================
  {
    majorName: "สาขาวิชาศาสนาและปรัชญา (หลักสูตรภาษาอังกฤษ)",
    curriculumName: "พุทธศาสตรบัณฑิต สาขาวิชาศาสนาและปรัชญา (หลักสูตรภาษาอังกฤษ)",
    curriculumNameEn: "Bachelor of Arts in Religion and Philosophy (English Program)",
    departmentName: "ภาควิชาศาสนาและปรัชญา",
    yearLevel: 1,
    academicYear: ACADEMIC_YEAR,
    semester: SEMESTER,
    room: "Room No. D 517-518",
    termDates: TERM_DATES,
    slots: [
      { dayOfWeek: 1, startTime: "09.00", endTime: "11.30", courseCode: "112 412", courseName: "Buddhist Philosophy", instructor: "Dr. Dhanardhip Hardnualee*", room: "Room No. D 122", periodLabel: "เช้า" },
      { dayOfWeek: 1, startTime: "13.00", endTime: "15.30", courseCode: "112 308", courseName: "Christianity", instructor: "Assoc. Prof. Dr. Naddhira Sridee* / Asst. Prof. Dr. Khaimook Laopipatthana", room: "Room No. D 122", periodLabel: "บ่าย" },
      { dayOfWeek: 2, startTime: "09.00", endTime: "11.30", courseCode: "000 239", courseName: "Dhamma in English", instructor: "Ven. Phrabaidika Senghurng Narinda, Ph.D.* / Ven. Phra Sukheesom Silatechaputtiyo, Ph.D.", room: "Room No. D 517-518", periodLabel: "เช้า" },
      { dayOfWeek: 2, startTime: "13.00", endTime: "15.30", courseCode: "000 204", courseName: "English for Communication", instructor: "A.Dr. Sudtida Padrit*", room: "Room No. D 517-518", periodLabel: "บ่าย" },
      { dayOfWeek: 3, startTime: "09.00", endTime: "11.30", courseCode: "000 237", courseName: "History of Buddhism", instructor: "Asst. Prof. Phra Sitthivajarabundit, Ph.D.* / Dr. Tratep Techapornchai", room: "Room No. D 517-518", periodLabel: "เช้า" },
      { dayOfWeek: 3, startTime: "13.00", endTime: "15.30", courseCode: "000 206", courseName: "Mathematics and Statistics for Research", instructor: "Ven. Dr. Dharma Priya Bhikkhu* / Dr. Pattamawadee Sangkhuenkaew", room: "Room No. D 517-518", periodLabel: "บ่าย" },
      { dayOfWeek: 4, startTime: "09.00", endTime: "11.30", courseCode: "0SP102", courseName: "Pali II", instructor: "Phramaha Niran Kalyanamedhi, Ph.D.*", room: "Room No. D 517-518", periodLabel: "เช้า" },
    ],
  },
  {
    majorName: "สาขาวิชาศาสนาและปรัชญา (หลักสูตรภาษาอังกฤษ)",
    curriculumName: "พุทธศาสตรบัณฑิต สาขาวิชาศาสนาและปรัชญา (หลักสูตรภาษาอังกฤษ)",
    curriculumNameEn: "Bachelor of Arts in Religion and Philosophy (English Program)",
    departmentName: "ภาควิชาศาสนาและปรัชญา",
    yearLevel: 2,
    academicYear: ACADEMIC_YEAR,
    semester: SEMESTER,
    room: "Room No. D 519-520",
    termDates: TERM_DATES,
    slots: [
      { dayOfWeek: 1, startTime: "09.00", endTime: "11.30", courseCode: "000 135", courseName: "Tipitaka Studies", instructor: "Dr. Duangdee Aotsoo* / Ven. Dr. Suvinaya Bhikkhu", room: "Room No. D 519-520", periodLabel: "เช้า" },
      { dayOfWeek: 1, startTime: "13.00", endTime: "15.30", courseCode: "000 205", courseName: "Introduction to Philosophy", instructor: "Phramaha Jaroon Kittipanno, Ph.D.*", room: "Room No. D 519-520", periodLabel: "บ่าย" },
      { dayOfWeek: 2, startTime: "09.00", endTime: "11.30", courseCode: "000 229", courseName: "Leadership", instructor: "Assoc. Prof. W. Piyaratana, Ph.D.*", room: "Room No. D 519-520", periodLabel: "เช้า" },
      { dayOfWeek: 2, startTime: "13.00", endTime: "15.30", courseCode: "112 311", courseName: "New Religious Movement", instructor: "Assoc. Prof. Dr. Naddhira Sridee* / Dr. Duangdee Aotsoo", room: "Room No. D 122", periodLabel: "บ่าย" },
      { dayOfWeek: 3, startTime: "09.00", endTime: "11.30", courseCode: "000 113", courseName: "Introduction to Logic", instructor: "Phrasamu Kriengsak Sirisakko, Ph.D.* / Ven. Dr. Dharma Priya", room: "Room No. D 519-520", periodLabel: "เช้า" },
      { dayOfWeek: 3, startTime: "13.00", endTime: "15.30", courseCode: "000 134", courseName: "Buddhist Literature", instructor: "Phramaha Jaroon Kittipanno, Ph.D.* / Assoc. Prof. Pha Dhammavajirapanyacarya, Ph.D.", room: "Room No. D 519-520", periodLabel: "บ่าย" },
    ],
  },
  {
    majorName: "สาขาวิชาศาสนาและปรัชญา (หลักสูตรภาษาอังกฤษ)",
    curriculumName: "พุทธศาสตรบัณฑิต สาขาวิชาศาสนาและปรัชญา (หลักสูตรภาษาอังกฤษ)",
    curriculumNameEn: "Bachelor of Arts in Religion and Philosophy (English Program)",
    departmentName: "ภาควิชาศาสนาและปรัชญา",
    yearLevel: 3,
    academicYear: ACADEMIC_YEAR,
    semester: SEMESTER,
    room: "Room No. D 121",
    termDates: TERM_DATES,
    slots: [
      { dayOfWeek: 1, startTime: "09.00", endTime: "11.30", courseCode: "112 309", courseName: "Islam", instructor: "Phramaha Jaroon Kittipanno, Ph.D.*", room: "Room No. D 121", periodLabel: "เช้า" },
      { dayOfWeek: 1, startTime: "13.00", endTime: "15.30", courseCode: "112 431", courseName: "Contemporary Indian Philosophy", instructor: "Asst. Prof. Phramaha Pornchai Sirivaro, Ph.D.*", room: "Room No. D 121", periodLabel: "บ่าย" },
      { dayOfWeek: 2, startTime: "09.00", endTime: "11.30", courseCode: "112 336", courseName: "Religion and Culture", instructor: "Dr. Dhanardhip Hardnualee*", room: "Room No. D 121", periodLabel: "เช้า" },
      { dayOfWeek: 2, startTime: "13.00", endTime: "15.30", courseCode: "112 306", courseName: "Ancient Western Philosophy", instructor: "Asst. Prof. Phramaha Somphong Khunakaro, Ph.D.*", room: "Room No. D 121", periodLabel: "บ่าย" },
      { dayOfWeek: 3, startTime: "09.00", endTime: "11.30", courseCode: "112 421", courseName: "Language of Religion", instructor: "Phramaha Khunpon Samacitto, Ph.D.*", room: "Room No. D 121", periodLabel: "เช้า" },
      { dayOfWeek: 3, startTime: "13.00", endTime: "15.30", courseCode: "112 304", courseName: "Aesthetics", instructor: "Dr. Duangdee Aotsoo* / Phrasamu Kreingsak Sirisakko, Ph.D.", room: "Room No. D 121", periodLabel: "บ่าย" },
    ],
  },
  {
    majorName: "สาขาวิชาศาสนาและปรัชญา (หลักสูตรภาษาอังกฤษ)",
    curriculumName: "พุทธศาสตรบัณฑิต สาขาวิชาศาสนาและปรัชญา (หลักสูตรภาษาอังกฤษ)",
    curriculumNameEn: "Bachelor of Arts in Religion and Philosophy (English Program)",
    departmentName: "ภาควิชาศาสนาและปรัชญา",
    yearLevel: 4,
    academicYear: ACADEMIC_YEAR,
    semester: SEMESTER,
    room: "Room No. D 120",
    termDates: TERM_DATES,
    slots: [
      { dayOfWeek: 1, startTime: "09.00", endTime: "11.30", courseCode: "112 417", courseName: "Independent Study in Religions and Philosophy", instructor: "Asst. Prof. PM. Pornchai Sirivaro, Ph.D.*", room: "Room No. D 120", periodLabel: "เช้า" },
      { dayOfWeek: 1, startTime: "13.00", endTime: "15.30", courseCode: "112 442", courseName: "Religious Arts", instructor: "Dr. Duangdee Aotsoo* / Phrasamu Kreingsak Sirisakko, Ph.D.", room: "Room No. D 120", periodLabel: "บ่าย" },
      { dayOfWeek: 2, startTime: "09.00", endTime: "11.30", courseCode: "112 433", courseName: "Modern Western Philosophy", instructor: "Asst. Prof. PM. Somphong Khunakaro, Ph.D.*", room: "Room No. D 120", periodLabel: "เช้า" },
      { dayOfWeek: 3, startTime: "09.00", endTime: "11.30", courseCode: "112 415", courseName: "Seminar in Religions and Philosophy", instructor: "Phramaha Jaroon Kittipanno, Ph.D.* / Dr. Duangdee Aotsoo", room: "Room No. D 120", periodLabel: "เช้า" },
      { dayOfWeek: 3, startTime: "13.00", endTime: "15.30", courseCode: "112 413", courseName: "Symbolic Logic", instructor: "Phramaha Khunpon Samacitto, Ph.D.*", room: "Room No. D 120", periodLabel: "บ่าย" },
    ],
  },

  // =========================================================================
  // 2. Bachelor of Arts in Buddhist Studies (English Program)
  // =========================================================================
  {
    majorName: "สาขาวิชาพระพุทธศาสนา (หลักสูตรภาษาอังกฤษ)",
    curriculumName: "พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา (หลักสูตรภาษาอังกฤษ)",
    curriculumNameEn: "Bachelor of Arts in Buddhist Studies (English Program)",
    departmentName: "ภาควิชาพระพุทธศาสนา",
    yearLevel: 1,
    academicYear: ACADEMIC_YEAR,
    semester: SEMESTER,
    room: "Room No. D 517-518",
    termDates: TERM_DATES,
    slots: [
      { dayOfWeek: 1, startTime: "09.00", endTime: "11.30", courseCode: "101 104", courseName: "Education in Tipitaka", instructor: "Asst. Prof. Phramaha Yongyut Dhiradhammo, Ph.D.*", room: "Room No. D 517-518", periodLabel: "เช้า" },
      { dayOfWeek: 1, startTime: "13.00", endTime: "15.30", courseCode: "101 102", courseName: "Buddhism and Social Works", instructor: "Asst. Prof. Dr. Supapan Permpool*", room: "Room No. D 517-518", periodLabel: "บ่าย" },
      { dayOfWeek: 2, startTime: "09.00", endTime: "11.30", courseCode: "000 239", courseName: "Dhamma in English", instructor: "Ven. Phrabaidika Senghurng Narinda, Ph.D.* / Ven. Phrakhrupalad Sukheesom Silatechaputtiyo, Ph.D.", room: "Room No. D 517-518", periodLabel: "เช้า" },
      { dayOfWeek: 2, startTime: "13.00", endTime: "15.30", courseCode: "000 204", courseName: "English for Communication", instructor: "A.Dr. Sudtida Padrit*", room: "Room No. D 517-518", periodLabel: "บ่าย" },
      { dayOfWeek: 3, startTime: "09.00", endTime: "11.30", courseCode: "000 237", courseName: "History of Buddhism", instructor: "Asst. Prof. Phra Sitthivajarabundit, Ph.D.* / Dr. Tratep Techapornchai", room: "Room No. D 517-518", periodLabel: "เช้า" },
      { dayOfWeek: 3, startTime: "13.00", endTime: "15.30", courseCode: "000 206", courseName: "Mathematics and Statistics for Research", instructor: "Ven. Dr. Dharma Priya Bhikkhu* / Dr. Pattamawadee Sangkhuenkaew", room: "Room No. D 517-518", periodLabel: "บ่าย" },
      { dayOfWeek: 4, startTime: "09.00", endTime: "11.30", courseCode: "0SP102", courseName: "Pali II", instructor: "Phramaha Niran Kalyanamedhi, Ph.D.*", room: "Room No. D 517-518", periodLabel: "เช้า" },
    ],
  },
  {
    majorName: "สาขาวิชาพระพุทธศาสนา (หลักสูตรภาษาอังกฤษ)",
    curriculumName: "พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา (หลักสูตรภาษาอังกฤษ)",
    curriculumNameEn: "Bachelor of Arts in Buddhist Studies (English Program)",
    departmentName: "ภาควิชาพระพุทธศาสนา",
    yearLevel: 2,
    academicYear: ACADEMIC_YEAR,
    semester: SEMESTER,
    room: "Room No. D 519-520",
    termDates: TERM_DATES,
    slots: [
      { dayOfWeek: 1, startTime: "09.00", endTime: "11.30", courseCode: "000 135", courseName: "Tipitaka Studies", instructor: "Dr. Duangdee Aotsoo* / Ven. Dr. Suvinaya", room: "Room No. D 519-520", periodLabel: "เช้า" },
      { dayOfWeek: 1, startTime: "13.00", endTime: "15.30", courseCode: "000 205", courseName: "Introduction to Philosophy", instructor: "Phramaha Jaroon Kittipanno, Ph.D.*", room: "Room No. D 519-520", periodLabel: "บ่าย" },
      { dayOfWeek: 2, startTime: "09.00", endTime: "11.30", courseCode: "000 229", courseName: "Leadership", instructor: "Assoc. Prof. W. Piyaratana, Ph.D.* / Dr. Low Yuen Fah", room: "Room No. D 519-520", periodLabel: "เช้า" },
      { dayOfWeek: 2, startTime: "13.00", endTime: "15.30", courseCode: "101 206", courseName: "Psychology in Tipitaka", instructor: "Phramaha Veeradej Adhipanno, Ph.D.* / Assoc. Prof. W. Piyaratana, Ph.D.", room: "Room No. D 519-520", periodLabel: "บ่าย" },
      { dayOfWeek: 3, startTime: "09.00", endTime: "11.30", courseCode: "000 113", courseName: "Introduction to Logic", instructor: "Ven. Dr. Dharma Priya Bhikkhu* / Phrasamu Kriengsak Sirisakko, Ph.D.", room: "Room No. D 519-520", periodLabel: "เช้า" },
      { dayOfWeek: 3, startTime: "13.00", endTime: "15.30", courseCode: "000 134", courseName: "Buddhist Literature", instructor: "Phramaha Niran Kalyanamedhi, Ph.D.* / Assoc. Prof. Pha Dhammavajirapanyacarya, Ph.D.", room: "Room No. D 519-520", periodLabel: "บ่าย" },
    ],
  },
  {
    majorName: "สาขาวิชาพระพุทธศาสนา (หลักสูตรภาษาอังกฤษ)",
    curriculumName: "พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา (หลักสูตรภาษาอังกฤษ)",
    curriculumNameEn: "Bachelor of Arts in Buddhist Studies (English Program)",
    departmentName: "ภาควิชาพระพุทธศาสนา",
    yearLevel: 3,
    academicYear: ACADEMIC_YEAR,
    semester: SEMESTER,
    room: "Room No. D 123",
    termDates: TERM_DATES,
    slots: [
      { dayOfWeek: 1, startTime: "09.00", endTime: "11.30", courseCode: "101 313", courseName: "Dhammapada Studies", instructor: "Assoc. Prof. Pha Dhammavajirapanyacarya, Ph.D.* / Assoc. Prof. W. Piyaratana, Ph.D. / Asst. Prof. Dr. Soontraraporn Techapalokul", room: "Room No. D 123", periodLabel: "เช้า" },
      { dayOfWeek: 1, startTime: "13.00", endTime: "15.30", courseCode: "101 330", courseName: "Life and Works of Buddhist Scholars", instructor: "Asst. Prof. Phramaha Yongyut Dhiradhammo, Ph.D.*", room: "Room No. D 123", periodLabel: "บ่าย" },
      { dayOfWeek: 2, startTime: "09.00", endTime: "11.30", courseCode: "101 327", courseName: "Buddhism and Women's Status", instructor: "Asst. Prof. Dr. Supapan Permpool*", room: "Room No. D 123", periodLabel: "เช้า" },
      { dayOfWeek: 2, startTime: "13.00", endTime: "15.30", courseCode: "101 311", courseName: "Principles of Buddhism", instructor: "Assoc. Prof. Dr. Jutamas Vareesangthip*", room: "Room No. D 123", periodLabel: "บ่าย" },
      { dayOfWeek: 3, startTime: "09.00", endTime: "11.30", courseCode: "101 310", courseName: "Buddhism and Health Care", instructor: "Asst. Prof. Dr. Doungkamon Tongkanaraksa*", room: "Room No. D 123", periodLabel: "เช้า" },
      { dayOfWeek: 3, startTime: "13.00", endTime: "15.30", courseCode: "101 309", courseName: "Buddhism and Sustainable Development", instructor: "Dr. Sudtida Padrit*", room: "Room No. D 123", periodLabel: "บ่าย" },
    ],
  },
  {
    majorName: "สาขาวิชาพระพุทธศาสนา (หลักสูตรภาษาอังกฤษ)",
    curriculumName: "พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา (หลักสูตรภาษาอังกฤษ)",
    curriculumNameEn: "Bachelor of Arts in Buddhist Studies (English Program)",
    departmentName: "ภาควิชาพระพุทธศาสนา",
    yearLevel: 4,
    academicYear: ACADEMIC_YEAR,
    semester: SEMESTER,
    room: "Room No. D 124",
    termDates: TERM_DATES,
    slots: [
      { dayOfWeek: 1, startTime: "13.00", endTime: "15.30", courseCode: "101 433", courseName: "Milindapanha Studies", instructor: "Assoc. Prof. W. Piyaratana, Ph.D.*", room: "Room No. D 124", periodLabel: "บ่าย" },
      { dayOfWeek: 2, startTime: "09.00", endTime: "11.30", courseCode: "101 417", courseName: "Seminar on Buddhism", instructor: "Assoc. Prof. Dr. Jutamas Vareesangthip*", room: "Room No. D 124", periodLabel: "เช้า" },
      { dayOfWeek: 2, startTime: "13.00", endTime: "15.30", courseCode: "101 419", courseName: "Mangalatthadipani Studies", instructor: "Assoc. Prof. Phramaha Yutthana Narajettho, Ph.D*", room: "Room No. D 124", periodLabel: "บ่าย" },
      { dayOfWeek: 3, startTime: "09.00", endTime: "11.30", courseCode: "101 416", courseName: "Independent Study on Buddhism", instructor: "Asst. Prof. W. Piyaratana, Ph.D.* / Asst. Prof. Dr. Soontaraporn Techapalokul", room: "Room No. D 124", periodLabel: "เช้า" },
      { dayOfWeek: 3, startTime: "13.00", endTime: "15.30", courseCode: "101 418", courseName: "Buddhist Arts", instructor: "Assoc. Prof. Dr. Doungkamon Tongkanaraksa*", room: "Room No. D 124", periodLabel: "บ่าย" },
    ],
  },
];

async function main() {
  console.log("=== เริ่มต้นนำเข้าตารางเรียนปริญญาตรี (ภาคภาษาอังกฤษ) ===");

  const tenants = await db.tenant.findMany();
  console.log(`พบ ${tenants.length} tenants ในระบบ:`, tenants.map(t => `${t.nameTh} (${t.code})`).join(", "));

  for (const tenant of tenants) {
    console.log(`\n--- ดำเนินการกับ Tenant: ${tenant.nameTh} (${tenant.code}) ---`);

    for (const tDef of ENGLISH_TIMETABLES) {
      // 1. ตรวจสอบหรือสร้าง Department
      let dept = await db.department.findFirst({
        where: {
          tenantId: tenant.id,
          nameTh: tDef.departmentName,
        },
      });

      if (!dept) {
        dept = await db.department.create({
          data: {
            tenantId: tenant.id,
            nameTh: tDef.departmentName,
            type: "DEPARTMENT",
            orderIndex: 1,
          },
        });
        console.log(`  สร้างภาควิชาใหม่: ${tDef.departmentName}`);
      }

      // 2. ตรวจสอบหรือสร้าง Curriculum
      let curr = await db.curriculum.findFirst({
        where: {
          tenantId: tenant.id,
          nameTh: tDef.curriculumName,
        },
      });

      if (!curr) {
        curr = await db.curriculum.create({
          data: {
            tenantId: tenant.id,
            departmentId: dept.id,
            nameTh: tDef.curriculumName,
            nameEn: tDef.curriculumNameEn,
            degree: "BACHELOR",
            durationYears: 4,
            descriptionTh: `หลักสูตรพุทธศาสตรบัณฑิต ${tDef.majorName} คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย`,
            descriptionEn: `${tDef.curriculumNameEn}, Faculty of Buddhism, MCU`,
            isActive: true,
            orderIndex: 2,
          },
        });
        console.log(`  สร้างหลักสูตรใหม่: ${tDef.curriculumName}`);
      }

      // 3. ตรวจสอบหรือสร้าง CurriculumTimetable
      const titleTh = `ตารางสอนชั้นปีที่ ${tDef.yearLevel} ${tDef.curriculumName}`;
      const titleEn = `Timetable Year ${tDef.yearLevel} - ${tDef.curriculumNameEn}`;

      const existingTimetable = await db.curriculumTimetable.findFirst({
        where: {
          tenantId: tenant.id,
          curriculumId: curr.id,
          yearLevel: tDef.yearLevel,
          academicYear: tDef.academicYear,
          semester: tDef.semester,
        },
      });

      const slotsWithIds = tDef.slots.map((s, idx) => ({
        id: `slot-en-${tDef.yearLevel}-${idx + 1}-${Math.random().toString(36).substring(2, 7)}`,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        courseCode: s.courseCode,
        courseName: s.courseName,
        instructor: s.instructor,
        room: s.room || tDef.room,
        periodLabel: s.periodLabel || (s.startTime < "12.00" ? "เช้า" : "บ่าย"),
      }));

      if (existingTimetable) {
        await db.curriculumTimetable.update({
          where: { id: existingTimetable.id },
          data: {
            titleTh,
            titleEn,
            room: tDef.room,
            termDates: tDef.termDates,
            scheduleData: slotsWithIds,
            departmentId: dept.id,
            isActive: true,
          },
        });
        console.log(`  ✓ อัปเดตตารางเรียน: ${titleTh} (รวม ${slotsWithIds.length} รายวิชา)`);
      } else {
        await db.curriculumTimetable.create({
          data: {
            tenantId: tenant.id,
            curriculumId: curr.id,
            departmentId: dept.id,
            titleTh,
            titleEn,
            academicYear: tDef.academicYear,
            semester: tDef.semester,
            yearLevel: tDef.yearLevel,
            room: tDef.room,
            termDates: tDef.termDates,
            description: `Bachelor's Degree Timetable Semester ${tDef.semester}/${tDef.academicYear} ${tDef.curriculumNameEn}`,
            scheduleData: slotsWithIds,
            isActive: true,
          },
        });
        console.log(`  + สร้างตารางเรียนใหม่: ${titleTh} (รวม ${slotsWithIds.length} รายวิชา)`);
      }
    }
  }

  console.log("\n=== นำเข้าตารางเรียนปริญญาตรี (ภาคภาษาอังกฤษ) เสร็จสมบูรณ์ครบ 8 ตารางเรียน ===");
}

main()
  .catch((e) => {
    console.error("Error importing english timetables:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
