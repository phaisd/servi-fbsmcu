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
  departmentName: string;
  yearLevel: number;
  academicYear: string;
  semester: number;
  room: string;
  termDates: string;
  slots: SlotDef[];
}

const TERM_DATES = "2 พฤศจิกายน 2569 – 26 กุมภาพันธ์ 2570";
const ACADEMIC_YEAR = "2569";
const SEMESTER = 2;

const TIMETABLES_DATA: TimetableDef[] = [
  // =========================================================================
  // 1. สาขาวิชาบาลีสันสกฤต (ปี 1 - 4)
  // =========================================================================
  {
    majorName: "สาขาวิชาบาลีสันสกฤต",
    curriculumName: "พุทธศาสตรบัณฑิต สาขาวิชาบาลีสันสกฤต",
    departmentName: "ภาควิชาพระพุทธศาสนา",
    yearLevel: 1,
    academicYear: ACADEMIC_YEAR,
    semester: SEMESTER,
    room: "อาคารเรียนรวม ชั้น 5 ห้อง D516",
    termDates: TERM_DATES,
    slots: [
      { dayOfWeek: 1, startTime: "09.00", endTime: "11.30", courseCode: "000 237", courseName: "ประวัติพระพุทธศาสนา", instructor: "พระครูสิริรัตนบัณฑิต, ผศ.ดร.*/อ.ดร.จันทรา บริกส์", periodLabel: "เช้า" },
      { dayOfWeek: 1, startTime: "12.30", endTime: "15.10", courseCode: "000 206", courseName: "คณิตศาสตร์และสถิติเพื่อการวิจัย", instructor: "พระมหามงคลกานต์ ฐิตธมฺโม, รศ.ดร.*/อ.ดร.สมหญิง ลมูลพักตร์", periodLabel: "บ่าย" },
      { dayOfWeek: 2, startTime: "09.00", endTime: "11.30", courseCode: "000 239", courseName: "ธรรมะภาคภาษาอังกฤษ", instructor: "พระสิทธิวัชรบัณฑิต, ผศ.ดร.*/พระสุขีศม สีลเตชปุตฺติโย, อ.ดร.", periodLabel: "เช้า" },
      { dayOfWeek: 2, startTime: "12.30", endTime: "15.10", courseCode: "000 204", courseName: "ภาษาอังกฤษเพื่อการสื่อสาร", instructor: "ผศ.ดร.ธนาธิป ฮาดเนาลี*/อ.ดร.อรจิรา วงษาพาน", periodLabel: "บ่าย" },
      { dayOfWeek: 3, startTime: "09.00", endTime: "11.30", courseCode: "108 103", courseName: "บาลีไวยากรณ์เบื้องต้น", instructor: "พระครูศรีสิทธิบัณฑิต, อ.ดร.", periodLabel: "เช้า" },
      { dayOfWeek: 3, startTime: "12.30", endTime: "15.10", courseCode: "108 104", courseName: "ไวยากรณ์สันสกฤตเบื้องต้น", instructor: "อ.ดร.สุดาพร เขียวงามดี", periodLabel: "บ่าย" },
      { dayOfWeek: 4, startTime: "09.00", endTime: "11.30", courseCode: "SP 102", courseName: "บาลี ๒ (รายวิชาเสริมพื้นฐาน)", instructor: "พระครูศรีสิทธิบัณฑิต, อ.ดร.*/พระมหาจีรวัฒน์ กนฺตวณฺโณ, รศ.ดร.", periodLabel: "เช้า" },
    ],
  },
  {
    majorName: "สาขาวิชาบาลีสันสกฤต",
    curriculumName: "พุทธศาสตรบัณฑิต สาขาวิชาบาลีสันสกฤต",
    departmentName: "ภาควิชาพระพุทธศาสนา",
    yearLevel: 2,
    academicYear: ACADEMIC_YEAR,
    semester: SEMESTER,
    room: "อาคารเรียนรวม ชั้น 3 ห้อง D516/2",
    termDates: TERM_DATES,
    slots: [
      { dayOfWeek: 1, startTime: "09.00", endTime: "11.30", courseCode: "000 117", courseName: "ภาษาสันสกฤตชั้นสูง", instructor: "พระมหานิรันดร์ กลฺยาณเมธี, อ.ดร.", periodLabel: "เช้า" },
      { dayOfWeek: 1, startTime: "12.30", endTime: "15.10", courseCode: "000 113", courseName: "ตรรกศาสตร์เบื้องต้น", instructor: "พระมหาดวงเด่น ฐิตญาโณ, ผศ.ดร.*/พระจาตุรงค์ อาจารสุโภ, ผศ.ดร.", periodLabel: "บ่าย" },
      { dayOfWeek: 2, startTime: "09.00", endTime: "11.30", courseCode: "000 229", courseName: "ภาวะผู้นำ", instructor: "พระมหาราชัน จิตฺตปาโล, อ.ดร.*/อ.ดร.สมบูรณ์ บุญศิริ", periodLabel: "เช้า" },
      { dayOfWeek: 2, startTime: "12.30", endTime: "15.10", courseCode: "000 205", courseName: "ปรัชญาเบื้องต้น", instructor: "รศ.ดร.กฤต ศรียะอาจ*/พระศรีวชิราภินันท์, อ.ดร.", periodLabel: "บ่าย" },
      { dayOfWeek: 3, startTime: "09.00", endTime: "11.30", courseCode: "000 135", courseName: "พระไตรปิฎกศึกษา", instructor: "พระมหายุทธนา นรเชฏฺโฐ, รศ.ดร.*/อ.ดร.ขวัญตระกูล บุทธิจักร", periodLabel: "เช้า" },
      { dayOfWeek: 3, startTime: "12.30", endTime: "15.10", courseCode: "000 134", courseName: "วรรณกรรมพระพุทธศาสนา", instructor: "อ.ดร.อุดม จันทิมา", periodLabel: "บ่าย" },
      { dayOfWeek: 4, startTime: "09.00", endTime: "11.30", courseCode: "108 205", courseName: "ไวยากรณ์สันสกฤตชั้นกลาง", instructor: "อ.ดร.สุดาพร เขียวงามดี", periodLabel: "เช้า" },
    ],
  },
  {
    majorName: "สาขาวิชาบาลีสันสกฤต",
    curriculumName: "พุทธศาสตรบัณฑิต สาขาวิชาบาลีสันสกฤต",
    departmentName: "ภาควิชาพระพุทธศาสนา",
    yearLevel: 3,
    academicYear: ACADEMIC_YEAR,
    semester: SEMESTER,
    room: "อาคารเรียนรวม ชั้น 2 ห้อง D219/1",
    termDates: TERM_DATES,
    slots: [
      { dayOfWeek: 1, startTime: "09.00", endTime: "11.30", courseCode: "108 314", courseName: "ประวัติวรรณคดีสันสกฤต", instructor: "พระมหาสมเดช ตปสีโล, อ.ดร.", periodLabel: "เช้า" },
      { dayOfWeek: 1, startTime: "12.30", endTime: "15.10", courseCode: "108 327", courseName: "พุทธจริตศึกษา", instructor: "อ.ดร.สุดาพร เขียวงามดี", periodLabel: "บ่าย" },
      { dayOfWeek: 2, startTime: "09.00", endTime: "11.30", courseCode: "108 318", courseName: "สัทธรรมปุณฑรีกสูตรศึกษา", instructor: "อ.ดร.สุดาพร เขียวงามดี", periodLabel: "เช้า" },
      { dayOfWeek: 2, startTime: "12.30", endTime: "15.10", courseCode: "108 326", courseName: "ภควัทคีตาศึกษา", instructor: "พระมหานิรันดร์ กลฺยาณเมธี, อ.ดร.", periodLabel: "บ่าย" },
      { dayOfWeek: 3, startTime: "09.00", endTime: "11.30", courseCode: "108 317", courseName: "ลลิตวิสตรศึกษา", instructor: "ผศ.ธีร์ พุ่มทับทิม", periodLabel: "เช้า" },
      { dayOfWeek: 3, startTime: "12.30", endTime: "15.10", courseCode: "108 308", courseName: "ไวยากรณ์สันสกฤตชั้นสูง", instructor: "ผศ.ดร.บุญเกิด เจริญแนว*/พระธรรมวชิรปัญญาจารย์, รศ.ดร.", periodLabel: "บ่าย" },
    ],
  },
  {
    majorName: "สาขาวิชาบาลีสันสกฤต",
    curriculumName: "พุทธศาสตรบัณฑิต สาขาวิชาบาลีสันสกฤต",
    departmentName: "ภาควิชาพระพุทธศาสนา",
    yearLevel: 4,
    academicYear: ACADEMIC_YEAR,
    semester: SEMESTER,
    room: "อาคารเรียนรวม ชั้น 2 ห้อง D219/2",
    termDates: TERM_DATES,
    slots: [
      { dayOfWeek: 1, startTime: "09.00", endTime: "11.30", courseCode: "108 423", courseName: "จารึกศึกษา", instructor: "ผศ.ดร.บุญเกิด เจริญแนว*/ผศ.ธีร์ พุ่มทับทิม", periodLabel: "เช้า" },
      { dayOfWeek: 1, startTime: "12.30", endTime: "15.10", courseCode: "108 412", courseName: "สัมมนาบาลีสันสกฤต", instructor: "พระครูศรีสิทธิบัณฑิต, อ.ดร.", periodLabel: "บ่าย" },
      { dayOfWeek: 2, startTime: "09.00", endTime: "11.30", courseCode: "108 422", courseName: "วากยสัมพันธ์บาลีสันสกฤต", instructor: "พระมหานิรันดร์ กลฺยาณเมธี, อ.ดร.*/พระธรรมวชิรปัญญาจารย์, รศ.ดร.", periodLabel: "เช้า" },
      { dayOfWeek: 2, startTime: "12.30", endTime: "15.10", courseCode: "108 411", courseName: "การศึกษาอิสระทางบาลีและสันสกฤต", instructor: "พระมหาสมเดช ตปสีโล, อ.ดร.", periodLabel: "บ่าย" },
      { dayOfWeek: 3, startTime: "09.00", endTime: "11.30", courseCode: "108 421", courseName: "หิโตปเทศศึกษา", instructor: "อ.ดร.สุดาพร เขียวงามดี", periodLabel: "เช้า" },
      { dayOfWeek: 3, startTime: "12.30", endTime: "15.10", courseCode: "108 431", courseName: "ไวยากรณ์ฮินดีชั้นสูง", instructor: "ผศ.ธีร์ พุ่มทับทิม", periodLabel: "บ่าย" },
    ],
  },

  // =========================================================================
  // 2. สาขาวิชาพระพุทธศาสนา (ปี 1 - 4)
  // =========================================================================
  {
    majorName: "สาขาวิชาพระพุทธศาสนา",
    curriculumName: "พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา",
    departmentName: "ภาควิชาพระพุทธศาสนา",
    yearLevel: 1,
    academicYear: ACADEMIC_YEAR,
    semester: SEMESTER,
    room: "อาคารเรียนรวม ชั้น 5 ห้อง D 516/1 (เรียนรวม)",
    termDates: TERM_DATES,
    slots: [
      { dayOfWeek: 1, startTime: "09.00", endTime: "11.30", courseCode: "000 237", courseName: "ประวัติพระพุทธศาสนา", instructor: "พระครูสิริรัตนบัณฑิต, ผศ.ดร.*/อ.ดร.จันทรา บริกส์", periodLabel: "เช้า" },
      { dayOfWeek: 1, startTime: "12.30", endTime: "15.10", courseCode: "000 206", courseName: "คณิตศาสตร์และสถิติเพื่อการวิจัย", instructor: "พระมหามงคลกานต์ ฐิตธมฺโม, รศ.ดร.*/อ.ดร.สมหญิง ลมูลพักตร์", periodLabel: "บ่าย" },
      { dayOfWeek: 2, startTime: "09.00", endTime: "11.30", courseCode: "000 239", courseName: "ธรรมะภาคภาษาอังกฤษ", instructor: "พระสิทธิวัชรบัณฑิต, ผศ.ดร./พระครูปลัดสุขีศม สีลเตชปุตฺติโย, อ.ดร.*", periodLabel: "เช้า" },
      { dayOfWeek: 2, startTime: "12.30", endTime: "15.10", courseCode: "000 204", courseName: "ภาษาอังกฤษเพื่อการสื่อสาร", instructor: "ผศ.ดร.ธนาธิป ฮาดเนาลี*/อ.ดร.อรจิรา วงษาพาน", periodLabel: "บ่าย" },
      { dayOfWeek: 3, startTime: "09.00", endTime: "11.30", courseCode: "101 102", courseName: "พระพุทธศาสนากับสังคมสงเคราะห์", instructor: "พระมหาจีรวัฒน์ กนฺตวณฺโณ, รศ.ดร.*/ผศ.พิเศษ ดร.สุภาพรรณ เพิ่มพูน", periodLabel: "เช้า" },
      { dayOfWeek: 3, startTime: "12.30", endTime: "15.10", courseCode: "101 104", courseName: "ศึกษาศาสตร์ในพระไตรปิฎก", instructor: "พระมหาวีรเดช อธิปญฺโญ, อ.ดร.*/อ.ดร.สันทยา ประภารัตน์", periodLabel: "บ่าย" },
      { dayOfWeek: 4, startTime: "09.00", endTime: "11.30", courseCode: "SP 102", courseName: "บาลี ๒ (รายวิชาพื้นฐาน)", instructor: "พระครูศรีสิทธิบัณฑิต, อ.ดร.*/พระมหาจีรวัฒน์ กนฺตวณฺโณ, รศ.ดร.", periodLabel: "เช้า" },
    ],
  },
  {
    majorName: "สาขาวิชาพระพุทธศาสนา",
    curriculumName: "พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา",
    departmentName: "ภาควิชาพระพุทธศาสนา",
    yearLevel: 2,
    academicYear: ACADEMIC_YEAR,
    semester: SEMESTER,
    room: "อาคารเรียนรวม ชั้น 5 ห้อง D 516/2 (เรียนรวม)",
    termDates: TERM_DATES,
    slots: [
      { dayOfWeek: 1, startTime: "09.00", endTime: "11.30", courseCode: "101 206", courseName: "จิตวิทยาในพระไตรปิฎก", instructor: "รศ.ดร.สุเทพ พรมเลิศ*/ผศ.พิเศษ ดร.อยุษกร งามชาติ", periodLabel: "เช้า" },
      { dayOfWeek: 1, startTime: "12.30", endTime: "15.10", courseCode: "000 113", courseName: "ตรรกศาสตร์เบื้องต้น", instructor: "พระมหาดวงเด่น ฐิตญาโณ, ผศ.ดร.*/พระจาตุรงค์ อาจารสุโภ, ผศ.ดร.", periodLabel: "บ่าย" },
      { dayOfWeek: 2, startTime: "09.00", endTime: "11.30", courseCode: "000 229", courseName: "ภาวะผู้นำ", instructor: "พระมหาราชัน จิตฺตปาโล, อ.ดร.*/อ.ดร.สมบูรณ์ บุญศิริ", periodLabel: "เช้า" },
      { dayOfWeek: 2, startTime: "12.30", endTime: "15.10", courseCode: "000 205", courseName: "ปรัชญาเบื้องต้น", instructor: "รศ.ดร.กฤต ศรียะอาจ*/พระศรีวชิราภินันท์, อ.ดร.", periodLabel: "บ่าย" },
      { dayOfWeek: 3, startTime: "09.00", endTime: "11.30", courseCode: "000 135", courseName: "พระไตรปิฎกศึกษา", instructor: "พระมหายุทธนา นรเชฏฺโฐ, รศ.ดร.*/อ.ดร.ขวัญตระกูล บุทธิจักร", periodLabel: "เช้า" },
      { dayOfWeek: 3, startTime: "12.30", endTime: "15.10", courseCode: "000 134", courseName: "วรรณกรรมพระพุทธศาสนา", instructor: "อ.ดร.อุดม จันทิมา", periodLabel: "บ่าย" },
    ],
  },
  {
    majorName: "สาขาวิชาพระพุทธศาสนา",
    curriculumName: "พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา",
    departmentName: "ภาควิชาพระพุทธศาสนา",
    yearLevel: 3,
    academicYear: ACADEMIC_YEAR,
    semester: SEMESTER,
    room: "อาคารเรียนรวม ชั้น 2 ห้อง D 223",
    termDates: TERM_DATES,
    slots: [
      { dayOfWeek: 1, startTime: "09.00", endTime: "11.30", courseCode: "101 309", courseName: "พระพุทธศาสนากับการพัฒนาที่ยั่งยืน", instructor: "พระราชอุดมวัชรเมธี, ผศ.ดร./พระมหาจีรวัฒน์ กนฺตวณฺโณ, รศ.ดร.*", periodLabel: "เช้า" },
      { dayOfWeek: 1, startTime: "12.30", endTime: "15.10", courseCode: "101 310", courseName: "พระพุทธศาสนากับสาธารณสุข", instructor: "พระมหาราชัน จิตฺตปาโล, อ.ดร.*/อ.ดร.ปรีชญา เทพละออง", periodLabel: "บ่าย" },
      { dayOfWeek: 2, startTime: "09.00", endTime: "11.30", courseCode: "101 313", courseName: "ธรรมบทศึกษา", instructor: "พระมหาวีรเดช อธิปญฺโญ, อ.ดร.", periodLabel: "เช้า" },
      { dayOfWeek: 2, startTime: "12.30", endTime: "15.10", courseCode: "101 437", courseName: "ประวัติศาสตร์พระพุทธศาสนาสมัยอยุธยา", instructor: "อ.ดร.อธิเทพ ผาทา", periodLabel: "บ่าย" },
      { dayOfWeek: 3, startTime: "09.00", endTime: "11.30", courseCode: "101 311", courseName: "หลักพุทธธรรม", instructor: "พระราชญาณวชิรเวที, ผศ.ดร./อ.ดร.อุดม จันทิมา*", periodLabel: "เช้า" },
      { dayOfWeek: 3, startTime: "12.30", endTime: "15.10", courseCode: "101 327", courseName: "พระพุทธศาสนากับสถานภาพสตรี", instructor: "พระครูสิริรัตนบัณฑิต, ผศ.ดร.*/อ.ดร.วรินธร ทวีโชติชัยกุล", periodLabel: "บ่าย" },
    ],
  },
  {
    majorName: "สาขาวิชาพระพุทธศาสนา",
    curriculumName: "พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา",
    departmentName: "ภาควิชาพระพุทธศาสนา",
    yearLevel: 4,
    academicYear: ACADEMIC_YEAR,
    semester: SEMESTER,
    room: "อาคารเรียนรวม ชั้น 2 ห้อง D 224",
    termDates: TERM_DATES,
    slots: [
      { dayOfWeek: 1, startTime: "12.30", endTime: "15.10", courseCode: "101 421", courseName: "สัมมนาพระพุทธศาสนา", instructor: "อ.ดร.อุดม จันทิมา*/อ.ดร.นภาพัทธ์ งามบุษบงโสภิน", periodLabel: "บ่าย" },
      { dayOfWeek: 2, startTime: "09.00", endTime: "11.30", courseCode: "101 419", courseName: "มังคลัตถทีปนีศึกษา", instructor: "พระมหาไพโรจน์ ญาณกุสโล, อ.ดร.", periodLabel: "เช้า" },
      { dayOfWeek: 2, startTime: "12.30", endTime: "15.10", courseCode: "101 415", courseName: "ชาดกศึกษา", instructor: "พระครูพิศิษฐ์ธรรมพิสุทธิ์, อ.ดร.*/อ.ดร.สิรีรัศมิ์ สิงห์สนธิ", periodLabel: "บ่าย" },
      { dayOfWeek: 3, startTime: "09.00", endTime: "11.30", courseCode: "101 417", courseName: "พุทธศิลปกรรม", instructor: "อ.ดร.อธิเทพ ผาทา", periodLabel: "เช้า" },
      { dayOfWeek: 3, startTime: "12.30", endTime: "15.10", courseCode: "101 433", courseName: "มิลินทปัญหาศึกษา", instructor: "พระมหายุทธนา นรเชฏฺโฐ, รศ.ดร.", periodLabel: "บ่าย" },
    ],
  },

  // =========================================================================
  // 3. สาขาวิชาวิปัสสนาภาวนา (ปี 1 - 4)
  // =========================================================================
  {
    majorName: "สาขาวิชาวิปัสสนาภาวนา",
    curriculumName: "พุทธศาสตรบัณฑิต สาขาวิชาวิปัสสนาภาวนา",
    departmentName: "ภาควิชาพระพุทธศาสนา",
    yearLevel: 1,
    academicYear: ACADEMIC_YEAR,
    semester: SEMESTER,
    room: "อาคารเรียนรวม ชั้น 5 ห้อง D 516/1 (เรียนรวม) / ชั้น 2 ห้อง D 220/1",
    termDates: TERM_DATES,
    slots: [
      { dayOfWeek: 1, startTime: "09.00", endTime: "11.30", courseCode: "000 237", courseName: "ประวัติพระพุทธศาสนา", instructor: "พระครูสิริรัตนบัณฑิต, ผศ.ดร.*/อ.ดร.จันทรา บริกส์", periodLabel: "เช้า" },
      { dayOfWeek: 1, startTime: "12.30", endTime: "15.10", courseCode: "000 206", courseName: "คณิตศาสตร์และสถิติเพื่อการวิจัย", instructor: "พระมหามงคลกานต์ ฐิตธมฺโม, รศ.ดร.*/อ.ดร.สมหญิง ลมูลพักตร์", periodLabel: "บ่าย" },
      { dayOfWeek: 2, startTime: "09.00", endTime: "11.30", courseCode: "000 239", courseName: "ธรรมะภาคภาษาอังกฤษ", instructor: "พระสิทธิวัชรบัณฑิต, ผศ.ดร./พระครูปลัดสุขีศม สีลเตชปุตฺติโย, อ.ดร.*", periodLabel: "เช้า" },
      { dayOfWeek: 2, startTime: "12.30", endTime: "15.10", courseCode: "000 204", courseName: "ภาษาอังกฤษเพื่อการสื่อสาร", instructor: "อ.ดร.ธนาธิป ฮาดเนาลี*/อ.ดร.อรจิรา วงษาพาน", periodLabel: "บ่าย" },
      { dayOfWeek: 3, startTime: "09.00", endTime: "11.30", courseCode: "111 103", courseName: "วิปัสสนากรรมฐานนิเทศ", instructor: "พระครูพิศิษฐ์ธรรมพิสุทธิ์, อ.ดร.", periodLabel: "เช้า" },
      { dayOfWeek: 3, startTime: "12.30", endTime: "15.10", courseCode: "111 104", courseName: "ปรมัตถธรรมนิเทศ", instructor: "พระมหาไพโรจน์ ญาณกุสโล, อ.ดร.*/รศ.พิเศษ ดร.จุฑามาศ วารีแสงทิพย์", periodLabel: "บ่าย" },
      { dayOfWeek: 4, startTime: "09.00", endTime: "11.30", courseCode: "SP 102", courseName: "บาลี ๒ (รายวิชาพื้นฐาน)", instructor: "พระครูศรีสิทธิบัณฑิต, อ.ดร.*/พระมหาจีรวัฒน์ กนฺตวณฺโณ, รศ.ดร.", periodLabel: "เช้า" },
    ],
  },
  {
    majorName: "สาขาวิชาวิปัสสนาภาวนา",
    curriculumName: "พุทธศาสตรบัณฑิต สาขาวิชาวิปัสสนาภาวนา",
    departmentName: "ภาควิชาพระพุทธศาสนา",
    yearLevel: 2,
    academicYear: ACADEMIC_YEAR,
    semester: SEMESTER,
    room: "อาคารเรียนรวม ชั้น 5 ห้อง D 516/1 (เรียนรวม) / ชั้น 2 ห้อง D 219/1",
    termDates: TERM_DATES,
    slots: [
      { dayOfWeek: 1, startTime: "09.00", endTime: "11.30", courseCode: "111 206", courseName: "กรรมฐานในโลกสมัยใหม่", instructor: "พระครูปลัดสุขีศม สีลเตชปุตฺติโย, อ.ดร.*/ผศ.ดร.แม่ชีวรณิช วสุรัตน์", periodLabel: "เช้า" },
      { dayOfWeek: 1, startTime: "12.30", endTime: "15.10", courseCode: "000 113", courseName: "ตรรกศาสตร์เบื้องต้น", instructor: "พระมหาดวงเด่น ฐิตญาโณ, ผศ.ดร.*/พระจาตุรงค์ อาจารสุโภ, ผศ.ดร.", periodLabel: "บ่าย" },
      { dayOfWeek: 2, startTime: "09.00", endTime: "11.30", courseCode: "000 229", courseName: "ภาวะผู้นำ", instructor: "พระมหาราชัน จิตฺตปาโล, อ.ดร.*/อ.ดร.สมบูรณ์ บุญศิริ", periodLabel: "เช้า" },
      { dayOfWeek: 2, startTime: "12.30", endTime: "15.10", courseCode: "000 205", courseName: "ปรัชญาเบื้องต้น", instructor: "รศ.ดร.กฤต ศรียะอาจ/พระศรีวชิราภินันท์, อ.ดร.", periodLabel: "บ่าย" },
      { dayOfWeek: 3, startTime: "09.00", endTime: "11.30", courseCode: "000 135", courseName: "พระไตรปิฎกศึกษา", instructor: "พระมหายุทธนา นรเชฏฺโฐ, รศ.ดร.*/อ.ดร.ขวัญตระกูล บุทธิจักร", periodLabel: "เช้า" },
      { dayOfWeek: 3, startTime: "12.30", endTime: "15.10", courseCode: "000 134", courseName: "วรรณกรรมพระพุทธศาสนา", instructor: "อ.ดร.อุดม จันทิมา", periodLabel: "บ่าย" },
    ],
  },
  {
    majorName: "สาขาวิชาวิปัสสนาภาวนา",
    curriculumName: "พุทธศาสตรบัณฑิต สาขาวิชาวิปัสสนาภาวนา",
    departmentName: "ภาควิชาพระพุทธศาสนา",
    yearLevel: 3,
    academicYear: ACADEMIC_YEAR,
    semester: SEMESTER,
    room: "อาคารเรียนรวม ชั้น 5 ห้อง D 500",
    termDates: TERM_DATES,
    slots: [
      { dayOfWeek: 1, startTime: "09.00", endTime: "11.30", courseCode: "111 309", courseName: "โสฬสญาณนิเทศ", instructor: "พระพรหมวชิรวิมลมุนี วิ., รศ.ดร./พระครูภาวนาวัฒนบัณฑิต วิ., รศ.ดร.*", periodLabel: "เช้า" },
      { dayOfWeek: 1, startTime: "12.30", endTime: "15.10", courseCode: "111 416", courseName: "การพัฒนาจิตตามหลักพระพุทธศาสนา", instructor: "พระมหายุทธนา นรเชฏฺโฐ, รศ.ดร.*/ผศ.พิเศษ ดร.จุฑารัตน์ ทองอินจันทร์", periodLabel: "บ่าย" },
      { dayOfWeek: 2, startTime: "09.00", endTime: "11.30", courseCode: "111 310", courseName: "เทคนิคการสอนกรรมฐาน", instructor: "พระครูพิศิษฐ์ธรรมพิสุทธิ์, อ.ดร.*/ผศ.พิเศษ ดร.เสนาะ ผดุงฉัตร", periodLabel: "เช้า" },
      { dayOfWeek: 2, startTime: "12.30", endTime: "15.10", courseCode: "111 304", courseName: "ภาษาบาลีเพื่อการสอนวิปัสสนาภาวนา", instructor: "พระมหาจีรวัฒน์ กนฺตวณฺโณ, รศ.ดร.*/ผศ.พิเศษ ดร.เสนาะ ผดุงฉัตร", periodLabel: "บ่าย" },
      { dayOfWeek: 3, startTime: "09.00", endTime: "11.30", courseCode: "111 418", courseName: "กรรมฐานกับการสร้างสันติภาพที่ยั่งยืน", instructor: "พระครูภาวนาวัฒนบัณฑิต, รศ.ดร.*/อ.ดร.แม่ชีวีณา ศรีคุรุวาฬ", periodLabel: "เช้า" },
      { dayOfWeek: 3, startTime: "12.30", endTime: "15.10", courseCode: "111 303", courseName: "ภาษาอังกฤษเพื่อการสอนกรรมฐาน", instructor: "พระสิทธิวัชรบัณฑิต, ผศ.ดร./พระมหายงยุทธ ธีรธมฺโม, ผศ.ดร.*", periodLabel: "บ่าย" },
    ],
  },
  {
    majorName: "สาขาวิชาวิปัสสนาภาวนา",
    curriculumName: "พุทธศาสตรบัณฑิต สาขาวิชาวิปัสสนาภาวนา",
    departmentName: "ภาควิชาพระพุทธศาสนา",
    yearLevel: 4,
    academicYear: ACADEMIC_YEAR,
    semester: SEMESTER,
    room: "อาคารเรียนรวม ชั้น 2 ห้อง D 221",
    termDates: TERM_DATES,
    slots: [
      { dayOfWeek: 1, startTime: "09.00", endTime: "11.30", courseCode: "111 409", courseName: "กรรมฐานในพระพุทธศาสนานิกายเซ็น", instructor: "พระมหายงยุทธ ธีรธมฺโม, ผศ.ดร.", periodLabel: "เช้า" },
      { dayOfWeek: 1, startTime: "12.30", endTime: "15.10", courseCode: "111 411", courseName: "สัมมนาวิปัสสนาภาวนา", instructor: "พระมหาจีรวัฒน์ กนฺตวณฺโณ, รศ.ดร.*", periodLabel: "บ่าย" },
      { dayOfWeek: 2, startTime: "09.00", endTime: "11.30", courseCode: "111 311", courseName: "กรรมฐานกับการบริหารธุรกิจ", instructor: "พระครูพิศิษฐ์ธรรมพิสุทธิ์, อ.ดร.*/อ.ดร.ฉวีวรรณ สกุลสุพิชญ์", periodLabel: "เช้า" },
      { dayOfWeek: 2, startTime: "12.30", endTime: "15.10", courseCode: "111 410", courseName: "วิปัสสนาวงศ์", instructor: "พระราชภาวนาวชิรสุนทร วิ., อ.ดร./พระครูภาวนาวัฒนบัณฑิต วิ., รศ.ดร.*", periodLabel: "บ่าย" },
      { dayOfWeek: 3, startTime: "09.00", endTime: "11.30", courseCode: "111 408", courseName: "กรรมฐานในคัมภีร์พระพุทธศาสนา", instructor: "พระครูสิริรัตนบัณฑิต, ผศ.ดร.*", periodLabel: "เช้า" },
    ],
  },

  // =========================================================================
  // 4. สาขาวิชาศาสนาและปรัชญา (ปี 1 - 4)
  // =========================================================================
  {
    majorName: "สาขาวิชาศาสนาและปรัชญา",
    curriculumName: "พุทธศาสตรบัณฑิต สาขาวิชาศาสนาและปรัชญา",
    departmentName: "ภาควิชาศาสนาและปรัชญา",
    yearLevel: 1,
    academicYear: ACADEMIC_YEAR,
    semester: SEMESTER,
    room: "อาคารเรียนรวม ชั้น 5 ห้อง D 516/1",
    termDates: TERM_DATES,
    slots: [
      { dayOfWeek: 1, startTime: "09.00", endTime: "11.30", courseCode: "000 237", courseName: "ประวัติพระพุทธศาสนา", instructor: "พระครูสิริรัตนบัณฑิต, ผศ.ดร.*/อ.ดร.จันทรา บริกส์", periodLabel: "เช้า" },
      { dayOfWeek: 1, startTime: "12.30", endTime: "15.10", courseCode: "000 206", courseName: "คณิตศาสตร์และสถิติเพื่อการวิจัย", instructor: "พระมหามงคลกานต์ ฐิตธมฺโม, รศ.ดร.*/อ.ดร.สมหญิง ลมูลพักตร์", periodLabel: "บ่าย" },
      { dayOfWeek: 2, startTime: "09.00", endTime: "11.30", courseCode: "000 239", courseName: "ธรรมะภาคภาษาอังกฤษ", instructor: "พระสิทธิวัชรบัณฑิต, ผศ.ดร./พระสุขีศม สีลเตชปุตฺติโย, อ.ดร.*", periodLabel: "เช้า" },
      { dayOfWeek: 2, startTime: "12.30", endTime: "15.10", courseCode: "000 204", courseName: "ภาษาอังกฤษเพื่อการสื่อสาร", instructor: "ผศ.ดร.ธนาธิป ฮาดเนาลี*/อ.ดร.อรจิรา วงษาพาน", periodLabel: "บ่าย" },
      { dayOfWeek: 3, startTime: "09.00", endTime: "11.30", courseCode: "112 311", courseName: "การเคลื่อนไหวใหม่ทางศาสนา", instructor: "ผศ.ดร.คงสฤษฎ์ แพงทรัพย์*/อ.ดร.ไชยา เสนแสนยา", room: "ห้อง D 323, 220/2", periodLabel: "เช้า" },
      { dayOfWeek: 3, startTime: "12.30", endTime: "15.10", courseCode: "112 304", courseName: "สุนทรียศาสตร์", instructor: "พระจาตุรงค์ อาจารสุโภ, ผศ.ดร.*/พระสมุห์เกรียงศักดิ์ สิริสกฺโก, อ.ดร.", room: "ห้อง D 323, 220/2", periodLabel: "บ่าย" },
      { dayOfWeek: 4, startTime: "09.00", endTime: "11.30", courseCode: "SP 102", courseName: "บาลี ๒ (รายวิชาเสริมพื้นฐาน)", instructor: "พระครูศรีสิทธิบัณฑิต, อ.ดร.*/พระมหาจีรวัฒน์ กนฺตวณฺโณ, รศ.ดร.", periodLabel: "เช้า" },
    ],
  },
  {
    majorName: "สาขาวิชาศาสนาและปรัชญา",
    curriculumName: "พุทธศาสตรบัณฑิต สาขาวิชาศาสนาและปรัชญา",
    departmentName: "ภาควิชาศาสนาและปรัชญา",
    yearLevel: 2,
    academicYear: ACADEMIC_YEAR,
    semester: SEMESTER,
    room: "อาคารเรียนรวม ชั้น 5 ห้อง D 516/2",
    termDates: TERM_DATES,
    slots: [
      { dayOfWeek: 1, startTime: "12.30", endTime: "15.10", courseCode: "000 113", courseName: "ตรรกศาสตร์เบื้องต้น", instructor: "พระมหาดวงเด่น ฐิตญาโณ, ผศ.ดร.*/พระจาตุรงค์ อาจารสุโภ, ผศ.ดร.", periodLabel: "บ่าย" },
      { dayOfWeek: 2, startTime: "09.00", endTime: "11.30", courseCode: "000 229", courseName: "ภาวะผู้นำ", instructor: "พระมหาราชัน จิตฺตปาโล, อ.ดร.*/อ.ดร.สมบูรณ์ บุญศิริ", periodLabel: "เช้า" },
      { dayOfWeek: 2, startTime: "12.30", endTime: "15.10", courseCode: "000 205", courseName: "ปรัชญาเบื้องต้น", instructor: "รศ.ดร.กฤต ศรียะอาจ*/พระจาตุรงค์ อาจารสุโภ, ผศ.ดร./พระศรีวชิราภินันท์, อ.ดร.", periodLabel: "บ่าย" },
      { dayOfWeek: 3, startTime: "09.00", endTime: "11.30", courseCode: "000 135", courseName: "พระไตรปิฎกศึกษา", instructor: "พระมหายุทธนา นรเชฏฺโฐ, รศ.ดร.*/อ.ดร.ขวัญตระกูล บุทธิจักร", periodLabel: "เช้า" },
      { dayOfWeek: 3, startTime: "12.30", endTime: "15.10", courseCode: "000 134", courseName: "วรรณกรรมพระพุทธศาสนา", instructor: "อาจารย์ ดร.อุดม จันทิมา", periodLabel: "บ่าย" },
    ],
  },
  {
    majorName: "สาขาวิชาศาสนาและปรัชญา",
    curriculumName: "พุทธศาสตรบัณฑิต สาขาวิชาศาสนาและปรัชญา",
    departmentName: "ภาควิชาศาสนาและปรัชญา",
    yearLevel: 3,
    academicYear: ACADEMIC_YEAR,
    semester: SEMESTER,
    room: "อาคารเรียนรวม ชั้น 2 ห้อง D 220/1",
    termDates: TERM_DATES,
    slots: [
      { dayOfWeek: 1, startTime: "09.00", endTime: "11.30", courseCode: "112 303", courseName: "จริยศาสตร์", instructor: "พระจาตุรงค์ อาจารสุโภ, ผศ.ดร.*/พระสมุห์เกรียงศักดิ์ สิริสกฺโก, อ.ดร.", periodLabel: "เช้า" },
      { dayOfWeek: 1, startTime: "12.30", endTime: "15.10", courseCode: "112 309", courseName: "ศาสนาอิสลาม", instructor: "ผศ.ดร.แสวง นิลนามะ/อ.ดร.ไชยา เสนแสนยา*", periodLabel: "บ่าย" },
      { dayOfWeek: 1, startTime: "15.10", endTime: "17.00", courseCode: "112 442", courseName: "ศิลปะทางศาสนา", instructor: "ผศ.ดร.คงสฤษฎ์ แพงทรัพย์*/อาจารย์ ดร.ดวงดี โอฐสู/พระใบฎีกาธนกฤต กตปุญฺโญ, อ.ดร.", periodLabel: "บ่าย 2" },
      { dayOfWeek: 2, startTime: "09.00", endTime: "11.30", courseCode: "112 324", courseName: "ปรัชญาเปรียบเทียบ", instructor: "พระมหาขวัญชัย กิตฺติเมธี, รศ.ดร.*/อ.ดร.คำพอง งามภักดิ์", periodLabel: "เช้า" },
      { dayOfWeek: 2, startTime: "12.30", endTime: "15.10", courseCode: "112 420", courseName: "ศาสนากับสถานภาพของสตรี", instructor: "พระมหาดวงเด่น ฐิตญาโณ, ผศ.ดร.*/พระมหามงคลกานต์ ฐิตธมฺโม, รศ.ดร.", periodLabel: "บ่าย" },
      { dayOfWeek: 3, startTime: "09.00", endTime: "11.30", courseCode: "112 323", courseName: "ปรัชญาไทย", instructor: "รศ.ดร.กฤต ศรียะอาจ*/อ.ดร.ไชยา เสนแสนยา/พระครูโกมุทสุวรรณาภรณ์, อ.ดร.", periodLabel: "เช้า" },
      { dayOfWeek: 3, startTime: "12.30", endTime: "15.10", courseCode: "112 422", courseName: "ศาสนาเปรียบเทียบ", instructor: "อ.ดร.ขวัญตระกูล บุทธิจักร*/พระมหาขวัญชัย กิตฺติเมธี, รศ.ดร./พระมหาดวงเด่น ฐิตญาโณ, ผศ.ดร.", periodLabel: "บ่าย" },
    ],
  },
  {
    majorName: "สาขาวิชาศาสนาและปรัชญา",
    curriculumName: "พุทธศาสตรบัณฑิต สาขาวิชาศาสนาและปรัชญา",
    departmentName: "ภาควิชาศาสนาและปรัชญา",
    yearLevel: 4,
    academicYear: ACADEMIC_YEAR,
    semester: SEMESTER,
    room: "อาคารเรียนรวม ชั้น 2 ห้อง D 222",
    termDates: TERM_DATES,
    slots: [
      { dayOfWeek: 1, startTime: "09.00", endTime: "11.30", courseCode: "112 433", courseName: "ปรัชญาตะวันตกสมัยใหม่", instructor: "พระมหามงคลกานต์ ฐิตธมฺโม, รศ.ดร.", periodLabel: "เช้า" },
      { dayOfWeek: 2, startTime: "09.00", endTime: "11.30", courseCode: "112 416", courseName: "ปรัชญาศาสนา", instructor: "อ.ดร.ไชยา เสนแสนยา*/พระครูปลัดภาณุวัฒน์ วฑฺฒธมฺโม, อ.ดร.", periodLabel: "เช้า" },
      { dayOfWeek: 2, startTime: "12.30", endTime: "15.10", courseCode: "112 415", courseName: "สัมมนาศาสนาและปรัชญา", instructor: "พระมหาจรูญ กิตฺติปญฺโญ, อ.ดร.*/อ.ดร.ดวงดี โอฐสู/พระครูโกวิทสุตาภรณ์, อ.ดร.", periodLabel: "บ่าย" },
      { dayOfWeek: 3, startTime: "09.00", endTime: "11.30", courseCode: "112 339", courseName: "สานเสวนาทางศาสนา", instructor: "อ.ดร.ขวัญตระกูล บุทธิจักร*/ผศ.ดร.แสวง นิลนามะ/พระมหาดวงเด่น ฐิตญาโณ, ผศ.ดร.", periodLabel: "เช้า" },
      { dayOfWeek: 3, startTime: "12.30", endTime: "15.10", courseCode: "112 417", courseName: "ศึกษาอิสระทางศาสนาและปรัชญา", instructor: "รศ.ดร.กฤต ศรียะอาจ*/อ.ดร.ไชยา เสนแสนยา", periodLabel: "บ่าย" },
    ],
  },
];

async function main() {
  console.log("=== เริ่มต้นนำเข้าตารางเรียนระดับปริญญาตรี (ภาคภาษาไทย) 16 ตารางเรียน ===");

  const tenants = await db.tenant.findMany();
  console.log(`พบ ${tenants.length} tenants ในระบบ`);

  for (const tenant of tenants) {
    console.log(`\n--- ดำเนินการกับ Tenant: ${tenant.nameTh} (${tenant.code}) ---`);

    for (const tDef of TIMETABLES_DATA) {
      // 1. หาหรือสร้าง Department
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
        console.log(`  สร้างภาควิชาใหม่: ${dept.nameTh}`);
      }

      // 2. หาหรือสร้าง Curriculum
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
            degree: "BACHELOR",
            durationYears: 4,
            descriptionTh: `หลักสูตรพุทธศาสตรบัณฑิต ${tDef.majorName} คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย`,
            isActive: true,
            orderIndex: 1,
          },
        });
        console.log(`  สร้างหลักสูตรใหม่: ${curr.nameTh}`);
      }

      // 3. สร้างหรืออัปเดต CurriculumTimetable
      const titleTh = `ตารางสอนชั้นปีที่ ${tDef.yearLevel} ${tDef.curriculumName}`;
      const titleEn = `Timetable Year ${tDef.yearLevel} - ${tDef.majorName}`;

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
        id: `slot-thai-${tDef.yearLevel}-${idx + 1}-${Math.random().toString(36).substring(2, 7)}`,
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
            description: `ตารางสอนระดับปริญญาตรี ภาคการศึกษาที่ ${tDef.semester} ปีการศึกษา ${tDef.academicYear} ${tDef.majorName}`,
            scheduleData: slotsWithIds,
            isActive: true,
          },
        });
        console.log(`  + สร้างตารางเรียนใหม่: ${titleTh} (รวม ${slotsWithIds.length} รายวิชา)`);
      }
    }
  }

  console.log("\n=== นำเข้าตารางเรียนปริญญาตรี (ภาคภาษาไทย) เสร็จสมบูรณ์ครบ 16 ตารางเรียน ===");
}

main()
  .catch((e) => {
    console.error("Error importing timetables:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
