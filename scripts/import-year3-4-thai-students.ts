import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

interface RawThaiStudent {
  code: string;
  title: string;
  firstName: string;
  lastName: string;
  major: "พระพุทธศาสนา" | "วิปัสสนาภาวนา" | "ศาสนาและปรัชญา" | "บาลีสันสกฤต";
  yearLevel: number;
  notes?: string;
  gender: "ชาย" | "หญิง";
}

const YEAR_3_THAI_STUDENTS: RawThaiStudent[] = [
  // 1. สาขาวิชาพระพุทธศาสนา (7 คน)
  { code: "6701501001", title: "นาย", firstName: "ธนไท", lastName: "สุรอังกูร", major: "พระพุทธศาสนา", yearLevel: 3, gender: "ชาย" },
  { code: "6701501045", title: "พระ", firstName: "พันธ์ศักดิ์", lastName: "วรสกฺโก", major: "พระพุทธศาสนา", yearLevel: 3, gender: "ชาย" },
  { code: "6701501046", title: "", firstName: "Bounmy", lastName: "Xaymonty", major: "พระพุทธศาสนา", yearLevel: 3, gender: "ชาย" },
  { code: "6701501047", title: "", firstName: "Panyavara", lastName: "-", major: "พระพุทธศาสนา", yearLevel: 3, gender: "ชาย" },
  { code: "6701501089", title: "พระ", firstName: "ภาสกร", lastName: "ปญฺญาคโม", major: "พระพุทธศาสนา", yearLevel: 3, gender: "ชาย" },
  { code: "6701401006", title: "พระ", firstName: "นพดล", lastName: "จินฺตามโย", major: "พระพุทธศาสนา", yearLevel: 3, gender: "ชาย" },
  { code: "6702501023", title: "พระ", firstName: "วีระชัย", lastName: "วีรปญฺโญ", major: "พระพุทธศาสนา", yearLevel: 3, gender: "ชาย" },

  // 2. สาขาวิชาวิปัสสนาภาวนา (3 คน)
  { code: "6701501075", title: "พระ", firstName: "ดำรงพล", lastName: "กตปุญฺโญ", major: "วิปัสสนาภาวนา", yearLevel: 3, gender: "ชาย" },
  { code: "6701501086", title: "พระ", firstName: "ญาณกิตต", lastName: "อตฺถกาโร", major: "วิปัสสนาภาวนา", yearLevel: 3, gender: "ชาย" },
  { code: "6701401005", title: "พระ", firstName: "เจษฎา", lastName: "อภิเจโต", major: "วิปัสสนาภาวนา", yearLevel: 3, gender: "ชาย" },

  // 3. สาขาวิชาศาสนาและปรัชญา (5 คน)
  { code: "6701501004", title: "พระมหา", firstName: "กุศล", lastName: "กุสลจิตโต", major: "ศาสนาและปรัชญา", yearLevel: 3, gender: "ชาย" },
  { code: "6701501006", title: "นาย", firstName: "ภาสวุฒิ", lastName: "บุญประเสริฐ", major: "ศาสนาและปรัชญา", yearLevel: 3, gender: "ชาย" },
  { code: "6701501049", title: "", firstName: "Thach", lastName: "Nang", major: "ศาสนาและปรัชญา", yearLevel: 3, gender: "ชาย" },
  { code: "6701501077", title: "", firstName: "Kong", lastName: "Vimonchit", major: "ศาสนาและปรัชญา", yearLevel: 3, gender: "ชาย" },
  { code: "6701501090", title: "", firstName: "Phomma", lastName: "Sonevilay", major: "ศาสนาและปรัชญา", yearLevel: 3, gender: "ชาย" },

  // 4. สาขาวิชาบาลีสันสกฤต (2 คน)
  { code: "6701501044", title: "สามเณร", firstName: "นวพล", lastName: "ธิมานิตย์", major: "บาลีสันสกฤต", yearLevel: 3, gender: "ชาย" },
  { code: "6701501050", title: "สามเณร", firstName: "พัชรพล", lastName: "เจริญเกียรติ", major: "บาลีสันสกฤต", yearLevel: 3, gender: "ชาย" },
];

const YEAR_4_THAI_STUDENTS: RawThaiStudent[] = [
  // 1. สาขาวิชาพระพุทธศาสนา (6 คน)
  { code: "6601501061", title: "พระ", firstName: "สมศักดิ์", lastName: "วํสเวชฺโช", major: "พระพุทธศาสนา", yearLevel: 4, gender: "ชาย" },
  { code: "6601501062", title: "พระ", firstName: "สุริยกมล", lastName: "ปภาโส", major: "พระพุทธศาสนา", yearLevel: 4, gender: "ชาย" },
  { code: "6601501098", title: "พระ", firstName: "วีรวิชญ์", lastName: "กตฺสาโร", major: "พระพุทธศาสนา", yearLevel: 4, gender: "ชาย" },
  { code: "6601501103", title: "พระ", firstName: "Kittiphong", lastName: "Inngkhone", major: "พระพุทธศาสนา", yearLevel: 4, gender: "ชาย" },
  { code: "6701401006", title: "พระ", firstName: "นพดล", lastName: "จิตฺตามโย", major: "พระพุทธศาสนา", yearLevel: 4, notes: "เทียบโอน", gender: "ชาย" },
  { code: "6601401002", title: "นางสาว", firstName: "สายชล", lastName: "เลิศวงศ์วาณิชย์", major: "พระพุทธศาสนา", yearLevel: 4, notes: "เทียบโอน", gender: "หญิง" },

  // 2. สาขาวิชาวิปัสสนาภาวนา (6 คน)
  { code: "6601501009", title: "พระ", firstName: "Savin", lastName: "Sujitto", major: "วิปัสสนาภาวนา", yearLevel: 4, gender: "ชาย" },
  { code: "6601501012", title: "นาง", firstName: "ชญาภา", lastName: "ธัญจารุวัจน์", major: "วิปัสสนาภาวนา", yearLevel: 4, gender: "หญิง" },
  { code: "6601501013", title: "แม่ชี", firstName: "สุวีรา", lastName: "เศรษฐภาคย์ภคิน", major: "วิปัสสนาภาวนา", yearLevel: 4, gender: "หญิง" },
  { code: "6601501089", title: "พระ", firstName: "นราธิป", lastName: "ชินวโร", major: "วิปัสสนาภาวนา", yearLevel: 4, gender: "ชาย" },
  { code: "6601501090", title: "นางสาว", firstName: "ตรีชฎา", lastName: "ศิริวงษ์", major: "วิปัสสนาภาวนา", yearLevel: 4, gender: "หญิง" },
  { code: "6601501097", title: "พระมหา", firstName: "อาทิตย์", lastName: "อภิธมฺโม", major: "วิปัสสนาภาวนา", yearLevel: 4, gender: "ชาย" },

  // 3. สาขาวิชาศาสนาและปรัชญา (6 คน)
  { code: "6601501006", title: "นาย", firstName: "ลักษณ์", lastName: "ตุ่นกาศ", major: "ศาสนาและปรัชญา", yearLevel: 4, gender: "ชาย" },
  { code: "6601501065", title: "พระมหา", firstName: "ฐิติพงศ์", lastName: "สุทฺธิโสภโณ", major: "ศาสนาและปรัชญา", yearLevel: 4, gender: "ชาย" },
  { code: "6601501068", title: "สามเณร", firstName: "โชคดี", lastName: "ขุนจันทร์", major: "ศาสนาและปรัชญา", yearLevel: 4, gender: "ชาย" },
  { code: "6601501069", title: "สามเณร", firstName: "ณรงค์กร", lastName: "แจ้งถิ่นป่า", major: "ศาสนาและปรัชญา", yearLevel: 4, gender: "ชาย" },
  { code: "6601501070", title: "สามเณร", firstName: "มนตรี", lastName: "พงษ์ประเสริฐ", major: "ศาสนาและปรัชญา", yearLevel: 4, gender: "ชาย" },
  { code: "6801401001", title: "พระ", firstName: "ทรงสิทธิ์", lastName: "จิตคุโณ", major: "ศาสนาและปรัชญา", yearLevel: 4, notes: "เทียบโอน", gender: "ชาย" },

  // 4. สาขาวิชาบาลีสันสกฤต (4 คน)
  { code: "6601501071", title: "นางสาว", firstName: "ชมพูเนกข์", lastName: "ณัฎฐ์ศิรพิพัฒน์", major: "บาลีสันสกฤต", yearLevel: 4, gender: "หญิง" },
  { code: "6601501102", title: "นาง", firstName: "สุพัตรา", lastName: "อินทนะ", major: "บาลีสันสกฤต", yearLevel: 4, gender: "หญิง" },
  { code: "6801401003", title: "พระ", firstName: "วิชัย", lastName: "วิชโย", major: "บาลีสันสกฤต", yearLevel: 4, notes: "เทียบโอน", gender: "ชาย" },
  { code: "6801401002", title: "นางสาว", firstName: "วชิราวัลย์", lastName: "มหพรภัสสร์", major: "บาลีสันสกฤต", yearLevel: 4, notes: "เทียบโอน", gender: "หญิง" },
];

interface CourseSeedDef {
  courseCode: string;
  courseName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
  instructorName: string;
  targetMajor: "พระพุทธศาสนา" | "วิปัสสนาภาวนา" | "ศาสนาและปรัชญา" | "บาลีสันสกฤต";
  yearLevel: number;
}

const YEAR_3_AND_4_COURSES: CourseSeedDef[] = [
  // ==========================================
  // YEAR 3 COURSES
  // ==========================================
  // พระพุทธศาสนา ปี 3
  { courseCode: "101 309", courseName: "พระพุทธศาสนากับการพัฒนาที่ยั่งยืน", dayOfWeek: 1, startTime: "09.00", endTime: "11.30", room: "อาคารเรียนรวม ชั้น 2 ห้อง D 223", instructorName: "พระมหาจีรวัฒน์ กนฺตวณฺโณ, รศ.ดร.", targetMajor: "พระพุทธศาสนา", yearLevel: 3 },
  { courseCode: "101 310", courseName: "พระพุทธศาสนากับสาธารณสุข", dayOfWeek: 1, startTime: "12.30", endTime: "15.10", room: "อาคารเรียนรวม ชั้น 2 ห้อง D 223", instructorName: "พระมหาราชัน จิตฺตปาโล, อ.ดร.", targetMajor: "พระพุทธศาสนา", yearLevel: 3 },
  { courseCode: "101 313", courseName: "ธรรมบทศึกษา", dayOfWeek: 2, startTime: "09.00", endTime: "11.30", room: "อาคารเรียนรวม ชั้น 2 ห้อง D 223", instructorName: "พระมหาวีรเดช อธิปญฺโญ, อ.ดร.", targetMajor: "พระพุทธศาสนา", yearLevel: 3 },
  { courseCode: "101 437", courseName: "ประวัติศาสตร์พระพุทธศาสนาสมัยอยุธยา", dayOfWeek: 2, startTime: "12.30", endTime: "15.10", room: "อาคารเรียนรวม ชั้น 2 ห้อง D 223", instructorName: "อ.ดร.อธิเทพ ผาทา", targetMajor: "พระพุทธศาสนา", yearLevel: 3 },
  { courseCode: "101 311", courseName: "หลักพุทธธรรม", dayOfWeek: 3, startTime: "09.00", endTime: "11.30", room: "อาคารเรียนรวม ชั้น 2 ห้อง D 223", instructorName: "อ.ดร.อุดม จันทิมา", targetMajor: "พระพุทธศาสนา", yearLevel: 3 },
  { courseCode: "101 327", courseName: "พระพุทธศาสนากับสถานภาพสตรี", dayOfWeek: 3, startTime: "12.30", endTime: "15.10", room: "อาคารเรียนรวม ชั้น 2 ห้อง D 223", instructorName: "พระครูสิริรัตนบัณฑิต, ผศ.ดร.", targetMajor: "พระพุทธศาสนา", yearLevel: 3 },

  // วิปัสสนาภาวนา ปี 3
  { courseCode: "111 309", courseName: "โสฬสญาณนิเทศ", dayOfWeek: 1, startTime: "09.00", endTime: "11.30", room: "อาคารเรียนรวม ชั้น 5 ห้อง D 500", instructorName: "พระครูภาวนาวัฒนบัณฑิต วิ., รศ.ดร.", targetMajor: "วิปัสสนาภาวนา", yearLevel: 3 },
  { courseCode: "111 416", courseName: "การพัฒนาจิตตามหลักพระพุทธศาสนา", dayOfWeek: 1, startTime: "12.30", endTime: "15.10", room: "อาคารเรียนรวม ชั้น 5 ห้อง D 500", instructorName: "พระมหายุทธนา นรเชฏฺโฐ, รศ.ดร.", targetMajor: "วิปัสสนาภาวนา", yearLevel: 3 },
  { courseCode: "111 310", courseName: "เทคนิคการสอนกรรมฐาน", dayOfWeek: 2, startTime: "09.00", endTime: "11.30", room: "อาคารเรียนรวม ชั้น 5 ห้อง D 500", instructorName: "พระครูพิศิษฐ์ธรรมพิสุทธิ์, อ.ดร.", targetMajor: "วิปัสสนาภาวนา", yearLevel: 3 },
  { courseCode: "111 304", courseName: "ภาษาบาลีเพื่อการสอนวิปัสสนาภาวนา", dayOfWeek: 2, startTime: "12.30", endTime: "15.10", room: "อาคารเรียนรวม ชั้น 5 ห้อง D 500", instructorName: "พระมหาจีรวัฒน์ กนฺตวณฺโณ, รศ.ดร.", targetMajor: "วิปัสสนาภาวนา", yearLevel: 3 },
  { courseCode: "111 418", courseName: "กรรมฐานกับการสร้างสันติภาพที่ยั่งยืน", dayOfWeek: 3, startTime: "09.00", endTime: "11.30", room: "อาคารเรียนรวม ชั้น 5 ห้อง D 500", instructorName: "พระครูภาวนาวัฒนบัณฑิต, รศ.ดร.", targetMajor: "วิปัสสนาภาวนา", yearLevel: 3 },
  { courseCode: "111 303", courseName: "ภาษาอังกฤษเพื่อการสอนกรรมฐาน", dayOfWeek: 3, startTime: "12.30", endTime: "15.10", room: "อาคารเรียนรวม ชั้น 5 ห้อง D 500", instructorName: "พระมหายงยุทธ ธีรธมฺโม, ผศ.ดร.", targetMajor: "วิปัสสนาภาวนา", yearLevel: 3 },

  // ศาสนาและปรัชญา ปี 3
  { courseCode: "112 303", courseName: "จริยศาสตร์", dayOfWeek: 1, startTime: "09.00", endTime: "11.30", room: "อาคารเรียนรวม ชั้น 2 ห้อง D 220/1", instructorName: "พระจาตุรงค์ อาจารสุโภ, ผศ.ดร.", targetMajor: "ศาสนาและปรัชญา", yearLevel: 3 },
  { courseCode: "112 309", courseName: "ศาสนาอิสลาม", dayOfWeek: 1, startTime: "12.30", endTime: "15.10", room: "อาคารเรียนรวม ชั้น 2 ห้อง D 220/1", instructorName: "อ.ดร.ไชยา เสนแสนยา", targetMajor: "ศาสนาและปรัชญา", yearLevel: 3 },
  { courseCode: "112 442", courseName: "ศิลปะทางศาสนา", dayOfWeek: 1, startTime: "15.10", endTime: "17.00", room: "อาคารเรียนรวม ชั้น 2 ห้อง D 220/1", instructorName: "ผศ.ดร.คงสฤษฎ์ แพงทรัพย์", targetMajor: "ศาสนาและปรัชญา", yearLevel: 3 },
  { courseCode: "112 324", courseName: "ปรัชญาเปรียบเทียบ", dayOfWeek: 2, startTime: "09.00", endTime: "11.30", room: "อาคารเรียนรวม ชั้น 2 ห้อง D 220/1", instructorName: "พระมหาขวัญชัย กิตฺติเมธี, รศ.ดร.", targetMajor: "ศาสนาและปรัชญา", yearLevel: 3 },
  { courseCode: "112 420", courseName: "ศาสนากับสถานภาพของสตรี", dayOfWeek: 2, startTime: "12.30", endTime: "15.10", room: "อาคารเรียนรวม ชั้น 2 ห้อง D 220/1", instructorName: "พระมหาดวงเด่น ฐิตญาโณ, ผศ.ดร.", targetMajor: "ศาสนาและปรัชญา", yearLevel: 3 },
  { courseCode: "112 323", courseName: "ปรัชญาไทย", dayOfWeek: 3, startTime: "09.00", endTime: "11.30", room: "อาคารเรียนรวม ชั้น 2 ห้อง D 220/1", instructorName: "รศ.ดร.กฤต ศรียะอาจ", targetMajor: "ศาสนาและปรัชญา", yearLevel: 3 },
  { courseCode: "112 422", courseName: "ศาสนาเปรียบเทียบ", dayOfWeek: 3, startTime: "12.30", endTime: "15.10", room: "อาคารเรียนรวม ชั้น 2 ห้อง D 220/1", instructorName: "อ.ดร.ขวัญตระกูล บุทธิจักร", targetMajor: "ศาสนาและปรัชญา", yearLevel: 3 },

  // บาลีสันสกฤต ปี 3
  { courseCode: "108 314", courseName: "ประวัติวรรณคดีสันสกฤต", dayOfWeek: 1, startTime: "09.00", endTime: "11.30", room: "อาคารเรียนรวม ชั้น 2 ห้อง D219/1", instructorName: "พระมหาสมเดช ตปสีโล, อ.ดร.", targetMajor: "บาลีสันสกฤต", yearLevel: 3 },
  { courseCode: "108 327", courseName: "พุทธจริตศึกษา", dayOfWeek: 1, startTime: "12.30", endTime: "15.10", room: "อาคารเรียนรวม ชั้น 2 ห้อง D219/1", instructorName: "อ.ดร.สุดาพร เขียวงามดี", targetMajor: "บาลีสันสกฤต", yearLevel: 3 },
  { courseCode: "108 318", courseName: "สัทธรรมปุณฑรีกสูตรศึกษา", dayOfWeek: 2, startTime: "09.00", endTime: "11.30", room: "อาคารเรียนรวม ชั้น 2 ห้อง D219/1", instructorName: "อ.ดร.สุดาพร เขียวงามดี", targetMajor: "บาลีสันสกฤต", yearLevel: 3 },
  { courseCode: "108 326", courseName: "ภควัทคีตาศึกษา", dayOfWeek: 2, startTime: "12.30", endTime: "15.10", room: "อาคารเรียนรวม ชั้น 2 ห้อง D219/1", instructorName: "พระมหานิรันดร์ กลฺยาณเมธี, อ.ดร.", targetMajor: "บาลีสันสกฤต", yearLevel: 3 },
  { courseCode: "108 317", courseName: "ลลิตวิสตรศึกษา", dayOfWeek: 3, startTime: "09.00", endTime: "11.30", room: "อาคารเรียนรวม ชั้น 2 ห้อง D219/1", instructorName: "ผศ.ธีร์ พุ่มทับทิม", targetMajor: "บาลีสันสกฤต", yearLevel: 3 },
  { courseCode: "108 308", courseName: "ไวยากรณ์สันสกฤตชั้นสูง", dayOfWeek: 3, startTime: "12.30", endTime: "15.10", room: "อาคารเรียนรวม ชั้น 2 ห้อง D219/1", instructorName: "ผศ.ดร.บุญเกิด เจริญแนว", targetMajor: "บาลีสันสกฤต", yearLevel: 3 },

  // ==========================================
  // YEAR 4 COURSES
  // ==========================================
  // พระพุทธศาสนา ปี 4
  { courseCode: "101 421", courseName: "สัมมนาพระพุทธศาสนา", dayOfWeek: 1, startTime: "12.30", endTime: "15.10", room: "อาคารเรียนรวม ชั้น 2 ห้อง D 224", instructorName: "อ.ดร.อุดม จันทิมา", targetMajor: "พระพุทธศาสนา", yearLevel: 4 },
  { courseCode: "101 419", courseName: "มังคลัตถทีปนีศึกษา", dayOfWeek: 2, startTime: "09.00", endTime: "11.30", room: "อาคารเรียนรวม ชั้น 2 ห้อง D 224", instructorName: "พระมหาไพโรจน์ ญาณกุสโล, อ.ดร.", targetMajor: "พระพุทธศาสนา", yearLevel: 4 },
  { courseCode: "101 415", courseName: "ชาดกศึกษา", dayOfWeek: 2, startTime: "12.30", endTime: "15.10", room: "อาคารเรียนรวม ชั้น 2 ห้อง D 224", instructorName: "พระครูพิศิษฐ์ธรรมพิสุทธิ์, อ.ดร.", targetMajor: "พระพุทธศาสนา", yearLevel: 4 },
  { courseCode: "101 417", courseName: "พุทธศิลปกรรม", dayOfWeek: 3, startTime: "09.00", endTime: "11.30", room: "อาคารเรียนรวม ชั้น 2 ห้อง D 224", instructorName: "อ.ดร.อธิเทพ ผาทา", targetMajor: "พระพุทธศาสนา", yearLevel: 4 },
  { courseCode: "101 433", courseName: "มิลินทปัญหาศึกษา", dayOfWeek: 3, startTime: "12.30", endTime: "15.10", room: "อาคารเรียนรวม ชั้น 2 ห้อง D 224", instructorName: "พระมหายุทธนา นรเชฏฺโฐ, รศ.ดร.", targetMajor: "พระพุทธศาสนา", yearLevel: 4 },

  // วิปัสสนาภาวนา ปี 4
  { courseCode: "111 409", courseName: "กรรมฐานในพระพุทธศาสนานิกายเซ็น", dayOfWeek: 1, startTime: "09.00", endTime: "11.30", room: "อาคารเรียนรวม ชั้น 2 ห้อง D 221", instructorName: "พระมหายงยุทธ ธีรธมฺโม, ผศ.ดร.", targetMajor: "วิปัสสนาภาวนา", yearLevel: 4 },
  { courseCode: "111 411", courseName: "สัมมนาวิปัสสนาภาวนา", dayOfWeek: 1, startTime: "12.30", endTime: "15.10", room: "อาคารเรียนรวม ชั้น 2 ห้อง D 221", instructorName: "พระมหาจีรวัฒน์ กนฺตวณฺโณ, รศ.ดร.", targetMajor: "วิปัสสนาภาวนา", yearLevel: 4 },
  { courseCode: "111 311", courseName: "กรรมฐานกับการบริหารธุรกิจ", dayOfWeek: 2, startTime: "09.00", endTime: "11.30", room: "อาคารเรียนรวม ชั้น 2 ห้อง D 221", instructorName: "พระครูพิศิษฐ์ธรรมพิสุทธิ์, อ.ดร.", targetMajor: "วิปัสสนาภาวนา", yearLevel: 4 },
  { courseCode: "111 410", courseName: "วิปัสสนาวงศ์", dayOfWeek: 2, startTime: "12.30", endTime: "15.10", room: "อาคารเรียนรวม ชั้น 2 ห้อง D 221", instructorName: "พระครูภาวนาวัฒนบัณฑิต วิ., รศ.ดร.", targetMajor: "วิปัสสนาภาวนา", yearLevel: 4 },
  { courseCode: "111 408", courseName: "กรรมฐานในคัมภีร์พระพุทธศาสนา", dayOfWeek: 3, startTime: "09.00", endTime: "11.30", room: "อาคารเรียนรวม ชั้น 2 ห้อง D 221", instructorName: "พระครูสิริรัตนบัณฑิต, ผศ.ดร.", targetMajor: "วิปัสสนาภาวนา", yearLevel: 4 },

  // ศาสนาและปรัชญา ปี 4
  { courseCode: "112 433", courseName: "ปรัชญาตะวันตกสมัยใหม่", dayOfWeek: 1, startTime: "09.00", endTime: "11.30", room: "อาคารเรียนรวม ชั้น 2 ห้อง D 222", instructorName: "พระมหามงคลกานต์ ฐิตธมฺโม, รศ.ดร.", targetMajor: "ศาสนาและปรัชญา", yearLevel: 4 },
  { courseCode: "112 416", courseName: "ปรัชญาศาสนา", dayOfWeek: 2, startTime: "09.00", endTime: "11.30", room: "อาคารเรียนรวม ชั้น 2 ห้อง D 222", instructorName: "อ.ดร.ไชยา เสนแสนยา", targetMajor: "ศาสนาและปรัชญา", yearLevel: 4 },
  { courseCode: "112 415", courseName: "สัมมนาศาสนาและปรัชญา", dayOfWeek: 2, startTime: "12.30", endTime: "15.10", room: "อาคารเรียนรวม ชั้น 2 ห้อง D 222", instructorName: "พระมหาจรูญ กิตฺติปญฺโญ, อ.ดร.", targetMajor: "ศาสนาและปรัชญา", yearLevel: 4 },
  { courseCode: "112 339", courseName: "สานเสวนาทางศาสนา", dayOfWeek: 3, startTime: "09.00", endTime: "11.30", room: "อาคารเรียนรวม ชั้น 2 ห้อง D 222", instructorName: "อ.ดร.ขวัญตระกูล บุทธิจักร", targetMajor: "ศาสนาและปรัชญา", yearLevel: 4 },
  { courseCode: "112 417", courseName: "ศึกษาอิสระทางศาสนาและปรัชญา", dayOfWeek: 3, startTime: "12.30", endTime: "15.10", room: "อาคารเรียนรวม ชั้น 2 ห้อง D 222", instructorName: "รศ.ดร.กฤต ศรียะอาจ", targetMajor: "ศาสนาและปรัชญา", yearLevel: 4 },

  // บาลีสันสกฤต ปี 4
  { courseCode: "108 423", courseName: "จารึกศึกษา", dayOfWeek: 1, startTime: "09.00", endTime: "11.30", room: "อาคารเรียนรวม ชั้น 2 ห้อง D219/2", instructorName: "ผศ.ดร.บุญเกิด เจริญแนว", targetMajor: "บาลีสันสกฤต", yearLevel: 4 },
  { courseCode: "108 412", courseName: "สัมมนาบาลีสันสกฤต", dayOfWeek: 1, startTime: "12.30", endTime: "15.10", room: "อาคารเรียนรวม ชั้น 2 ห้อง D219/2", instructorName: "พระครูศรีสิทธิบัณฑิต, อ.ดร.", targetMajor: "บาลีสันสกฤต", yearLevel: 4 },
  { courseCode: "108 422", courseName: "วากยสัมพันธ์บาลีสันสกฤต", dayOfWeek: 2, startTime: "09.00", endTime: "11.30", room: "อาคารเรียนรวม ชั้น 2 ห้อง D219/2", instructorName: "พระมหานิรันดร์ กลฺยาณเมธี, อ.ดร.", targetMajor: "บาลีสันสกฤต", yearLevel: 4 },
  { courseCode: "108 411", courseName: "การศึกษาอิสระทางบาลีและสันสกฤต", dayOfWeek: 2, startTime: "12.30", endTime: "15.10", room: "อาคารเรียนรวม ชั้น 2 ห้อง D219/2", instructorName: "พระมหาสมเดช ตปสีโล, อ.ดร.", targetMajor: "บาลีสันสกฤต", yearLevel: 4 },
  { courseCode: "108 421", courseName: "หิโตปเทศศึกษา", dayOfWeek: 3, startTime: "09.00", endTime: "11.30", room: "อาคารเรียนรวม ชั้น 2 ห้อง D219/2", instructorName: "อ.ดร.สุดาพร เขียวงามดี", targetMajor: "บาลีสันสกฤต", yearLevel: 4 },
  { courseCode: "108 431", courseName: "ไวยากรณ์ฮินดีชั้นสูง", dayOfWeek: 3, startTime: "12.30", endTime: "15.10", room: "อาคารเรียนรวม ชั้น 2 ห้อง D219/2", instructorName: "ผศ.ธีร์ พุ่มทับทิม", targetMajor: "บาลีสันสกฤต", yearLevel: 4 },
];

async function main() {
  console.log("=== เริ่มต้นนำเข้ารายชื่อนิสิต ชั้นปีที่ 3 (17 คน) และ ชั้นปีที่ 4 (22 คน) ภาคภาษาไทย ===");

  const tenants = await db.tenant.findMany();
  console.log(`พบ ${tenants.length} tenants ในระบบ`);

  const hashedPassword = await bcrypt.hash("Teacher1234!", 10);
  const ALL_STUDENTS = [...YEAR_3_THAI_STUDENTS, ...YEAR_4_THAI_STUDENTS];

  for (const tenant of tenants) {
    console.log(`\n--- ดำเนินการกับ Tenant: ${tenant.nameTh} (${tenant.code}) ---`);

    // 1. บันทึกข้อมูลนิสิตปี 3 และปี 4 เข้า Student table
    let studentCount = 0;
    for (const item of ALL_STUDENTS) {
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
          yearLevel: item.yearLevel,
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
          yearLevel: item.yearLevel,
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
    console.log(`  ✓ บันทึกข้อมูลนิสิตปี 3 และปี 4: ${studentCount} คน`);

    // 2. หา Role อาจารย์สำหรับ Tenant นี้
    const teacherRole = await db.role.findFirst({
      where: { tenantId: tenant.id, code: "TEACHER" },
    });

    for (const cDef of YEAR_3_AND_4_COURSES) {
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

      // 3. ลงทะเบียนนิสิตที่ตรงตามชั้นปีและสาขาวิชา (Enrollment)
      const eligibleCodes = ALL_STUDENTS
        .filter((s) => s.yearLevel === cDef.yearLevel && s.major === cDef.targetMajor)
        .map((s) => s.code);

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

      console.log(`  ✓ รายวิชา [${cDef.courseCode}] ${cDef.courseName} (ปี ${cDef.yearLevel}) -> ลงทะเบียนแล้ว ${studentsToEnroll.length} คน (ใหม่: ${enrolledForCourse})`);
    }
  }

  console.log("\n=== นำเข้ารายชื่อนิสิตปี 3-4 (ภาคภาษาไทย) และเปิดห้องเรียน 46 รายวิชาสำเร็จ 100% ===");
}

main()
  .catch((e) => {
    console.error("Error importing students:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
