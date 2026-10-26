import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma";
import { findTeacherCoursesFromTimetables } from "../src/features/personnel/_internal/timetable-sync";
import {
  parseTeachingExperiences,
  upsertTeachingCourses,
} from "../src/features/personnel/teaching-courses";

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = "Password123!";

interface ResearchItem {
  titleTh: string;
  titleEn?: string;
  authors: string;
  journalName: string;
  publicationYear: string;
  tier?: string;
  type: "RESEARCH" | "ACADEMIC" | "DISSERTATION";
}

interface TeacherSyncSeed {
  orderIndex: number;
  departmentCode: "BUDDHISM" | "PHILOSOPHY" | "PALI_SANSKRIT";
  academicPosition: string | null;
  academicPositionEn: string | null;
  titlePlacement: "PREFIX" | "SUFFIX";
  firstNameTh: string;
  lastNameTh: string;
  firstNameEn: string;
  lastNameEn: string;
  positionTh: string;
  positionEn: string;
  type: "ACADEMIC" | "EXECUTIVE" | "SUPPORT" | "SPECIAL";
  webEmail: string | null; // Email shown on fb.mcu.ac.th website
  fallbackMcuEmail: string; // Generated @mcu.ac.th email if no User exists & webEmail is not @gmail/@mcu
  existingUserEmails: string[]; // Known existing User emails (e.g. t69xxx@buddhist.mcu.ac.th) to match/merge
  phoneNumber: string | null;
  imageUrl: string | null;
  educationTh: string;
  experiencesTh: string;
  bioTh: string;
  contactInfo: string;
  researchPublications?: ResearchItem[];
}

function isGmailOrMcuDomain(email?: string | null): boolean {
  if (!email) return false;
  const lower = email.trim().toLowerCase();
  return lower.endsWith("@gmail.com") || lower.endsWith("@mcu.ac.th");
}

// ─────────────────────────────────────────────────────────────────────────────
// TASK 1: PALI & SANSKRIT DEPARTMENT TEACHERS (https://fb.mcu.ac.th/?page_id=9113)
// Note: ผศ.ดร.แสวง นิลนามะ is Head of Dept (orderIndex 1, defined in Executives below),
// and the 6 teachers from page 9113 follow at orderIndex 2..7.
// ─────────────────────────────────────────────────────────────────────────────
const PALI_SANSKRIT_TEACHERS: TeacherSyncSeed[] = [
  {
    orderIndex: 2,
    departmentCode: "PALI_SANSKRIT",
    academicPosition: "ดร.",
    academicPositionEn: "Dr.",
    titlePlacement: "SUFFIX",
    firstNameTh: "พระครูศรีสิทธิบัณฑิต",
    lastNameTh: "(ทวิช ถิรปญฺโญ)",
    firstNameEn: "Phrakhru Srisitthipandit",
    lastNameEn: "(Thawin Thirapanyo)",
    positionTh: "ผู้อำนวยการสำนักทะเบียนและวัดผล / อาจารย์ประจำภาควิชาบาลีและสันสกฤต",
    positionEn: "Director of Registration and Evaluation Office / Lecturer in Department of Pali and Sanskrit",
    type: "ACADEMIC",
    webEmail: "thawin-mcu@gmail.com",
    fallbackMcuEmail: "thawin.thi@mcu.ac.th",
    existingUserEmails: ["t69052@buddhist.mcu.ac.th", "thawin-mcu@gmail.com"],
    phoneNumber: null,
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2022/06/a3PmTWil62.jpg",
    educationTh: [
      "พ.ศ. ๒๕๓๙ ป.ธ.๖ สำนักเรียนวัดสร้อยทอง กรุงเทพมหานคร",
      "พ.ศ. ๒๕๔๔ พุทธศาสตรบัณฑิต พธ.บ. (การบริหารรัฐกิจ) มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
      "พ.ศ. ๒๕๕๐ พุทธศาสตรมหาบัณฑิต พธ.ม. (ภาษาบาลี) มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
      "พ.ศ. ๒๕๕๗ พุทธศาสตรดุษฎีบัณฑิต พธ.ด. (พระพุทธศาสนา) มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
    ].join("\n"),
    experiencesTh: [
      "ผู้อำนวยการสำนักทะเบียนและวัดผล มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
      "อาจารย์ประจำหลักสูตรพุทธศาสตรบัณฑิต สาขาวิชาภาษาบาลีและสันสกฤต",
      "บรรยายระดับปริญญาตรี: รายวิชาความรู้ทั่วไปเกี่ยวกับภาษาบาลี, ภาษาบาลี, มังคลัตถทีปนีศึกษา, การอ่านภาษาบาลี, บาลี ๒, สัมมนาบาลีสันสกฤต, บาลีไวยากรณ์เบื้องต้น",
    ].join("\n"),
    bioTh: "ผู้เชี่ยวชาญด้านภาษาบาลี ไวยากรณ์บาลีชั้นสูง คัมภีร์มังคลัตถทีปนี และการบริหารการศึกษาพระพุทธศาสนา",
    contactInfo: "ภาควิชาบาลีและสันสกฤต คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย ต.ลำไทร อ.วังน้อย จ.พระนครศรีอยุธยา 13170",
    researchPublications: [
      {
        titleTh: "การศึกษาวิเคราะห์หลักธรรมในคัมภีร์มังคลัตถทีปนีเพื่อการพัฒนาคุณภาพชีวิต",
        authors: "พระครูศรีสิทธิบัณฑิต, ดร.",
        journalName: "วารสารพุทธศาสตร์ศึกษา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
        publicationYear: "2566",
        tier: "TCI กลุ่ม 2",
        type: "RESEARCH",
      },
    ],
  },
  {
    orderIndex: 3,
    departmentCode: "PALI_SANSKRIT",
    academicPosition: "ดร.",
    academicPositionEn: "Ph.D.",
    titlePlacement: "SUFFIX",
    firstNameTh: "พระมหาสมเดช",
    lastNameTh: "ตปสีโล",
    firstNameEn: "Phramaha Somdej",
    lastNameEn: "Tapasilo",
    positionTh: "ผู้อำนวยการส่วนงานวิชาการและวิจัย / อาจารย์ประจำภาควิชาบาลีและสันสกฤต",
    positionEn: "Director of Academic and Research Division / Lecturer in Department of Pali and Sanskrit",
    type: "ACADEMIC",
    webEmail: null,
    fallbackMcuEmail: "somdej.tap@mcu.ac.th",
    existingUserEmails: ["t69047@buddhist.mcu.ac.th", "somdej.tap@mcu.ac.th"],
    phoneNumber: null,
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2026/02/a3PmSomdach69.jpg",
    educationTh: [
      "พ.ศ. ๒๕๕๒ เปรียญธรรม ๙ ประโยค (ป.ธ.๙) สำนักเรียนวัดสร้อยทอง กรุงเทพมหานคร",
      "พ.ศ. ๒๕๕๑ พุทธศาสตรบัณฑิต พธ.บ. (ภาษาอังกฤษ) เกียรตินิยมอันดับ ๑ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
      "พ.ศ. ๒๕๖๑ อักษรศาสตรมหาบัณฑิต อ.ม. (ศาสนาเปรียบเทียบ) มหาวิทยาลัยมหิดล",
      "พ.ศ. ๒๕๖๘ Doctor of Philosophy Ph.D. (Buddhist Studies) University of Delhi, India",
    ].join("\n"),
    experiencesTh: [
      "ผู้อำนวยการส่วนงานวิชาการและวิจัย คณะพุทธศาสตร์",
      "อาจารย์ประจำหลักสูตรพุทธศาสตรบัณฑิต สาขาวิชาภาษาบาลีและสันสกฤต",
      "บรรยายระดับปริญญาตรี: รายวิชาประวัติวรรณคดีสันสกฤต, การแต่งฉันท์บาลี, วรรณคดีบาลีในประเทศไทย",
    ].join("\n"),
    bioTh: "เปรียญธรรม ๙ ประโยค ผู้เชี่ยวชาญด้านภาษาบาลี วรรณคดีบาลีและสันสกฤต การแต่งฉันท์บาลี และพุทธศาสนศึกษานานาชาติ",
    contactInfo: "ภาควิชาบาลีและสันสกฤต คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย ต.ลำไทร อ.วังน้อย จ.พระนครศรีอยุธยา 13170",
    researchPublications: [
      {
        titleTh: "การศึกษาวิเคราะห์วรรณคดีบาลีในประเทศไทยและการประยุกต์ใช้ในการเรียนการสอนภาษาบาลี",
        authors: "พระมหาสมเดช ตปสีโล, ดร.",
        journalName: "วารสารพุทธศาสตร์ศึกษา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
        publicationYear: "2568",
        tier: "TCI กลุ่ม 2",
        type: "RESEARCH",
      },
    ],
  },
  {
    orderIndex: 4,
    departmentCode: "PALI_SANSKRIT",
    academicPosition: "ดร.",
    academicPositionEn: "Ph.D.",
    titlePlacement: "SUFFIX",
    firstNameTh: "พระมหานิรันดร์",
    lastNameTh: "กลฺยาณเมธี",
    firstNameEn: "Phramaha Niran",
    lastNameEn: "Kalyanamedhi",
    positionTh: "อาจารย์ประจำภาควิชาบาลีและสันสกฤต คณะพุทธศาสตร์",
    positionEn: "Lecturer, Department of Pali and Sanskrit",
    type: "ACADEMIC",
    webEmail: null,
    fallbackMcuEmail: "niran.kal@mcu.ac.th",
    existingUserEmails: ["t69032@buddhist.mcu.ac.th", "t69058@buddhist.mcu.ac.th", "niran.kal@mcu.ac.th"],
    phoneNumber: null,
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2026/06/a3PmNiran69-1.jpg",
    educationTh: [
      "พ.ศ. ๒๕๕๕ เปรียญธรรม ๙ ประโยค (ป.ธ.๙) สำนักเรียนวัดเทพลีลา กรุงเทพมหานคร",
      "พ.ศ. ๒๕๕๙ อักษรศาสตรมหาบัณฑิต อ.ม. (ภาษาบาลีและสันสกฤต) จุฬาลงกรณ์มหาวิทยาลัย",
      "พ.ศ. ๒๕๖๑ Master of Philosophy (Buddhist Studies and Civilization) Gautam Buddha University, India",
      "พ.ศ. ๒๕๖๘ Doctor of Philosophy Ph.D. (Sanskrit) University of Delhi, India",
    ].join("\n"),
    experiencesTh: [
      "อาจารย์ประจำหลักสูตรพุทธศาสตรบัณฑิต สาขาวิชาภาษาบาลีและสันสกฤต",
      "บรรยายระดับปริญญาตรี (หลักสูตรภาษาไทยและภาษาอังกฤษ): รายวิชาไวยากรณ์บาลีชั้นสูง (ปทรูปสิทธิ), บาลีนิรุกติศาสตร์, ภาษาสันสกฤต ๑, อภิธานัปปทีปิกา, ภาษาอังกฤษสำหรับพระไตรปิฎก, ภาษาบาลีในพระไตรปิฎก, English and Pali in Tipitaka",
    ].join("\n"),
    bioTh: "เปรียญธรรม ๙ ประโยค ดุษฎีบัณฑิตสาขาภาษาสันสกฤต (University of Delhi) ผู้เชี่ยวชาญด้านไวยากรณ์บาลีชั้นสูง คัมภีร์ปทรูปสิทธิ บาลีนิรุกติศาสตร์ และภาษาสันสกฤต",
    contactInfo: "ภาควิชาบาลีและสันสกฤต คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย ต.ลำไทร อ.วังน้อย จ.พระนครศรีอยุธยา 13170",
    researchPublications: [
      {
        titleTh: "การศึกษาเปรียบเทียบระบบไวยากรณ์ในคัมภีร์ปทรูปสิทธิและไวยากรณ์สันสกฤต",
        authors: "พระมหานิรันดร์ กลฺยาณเมธี, ดร.",
        journalName: "วารสารพุทธศาสตร์ศึกษา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
        publicationYear: "2568",
        tier: "TCI กลุ่ม 2",
        type: "RESEARCH",
      },
    ],
  },
  {
    orderIndex: 5,
    departmentCode: "PALI_SANSKRIT",
    academicPosition: "ผศ.",
    academicPositionEn: "Asst. Prof.",
    titlePlacement: "PREFIX",
    firstNameTh: "ธีร์",
    lastNameTh: "พุ่มทับทิม",
    firstNameEn: "Theer",
    lastNameEn: "Phumthapthim",
    positionTh: "อาจารย์ประจำภาควิชาบาลีและสันสกฤต คณะพุทธศาสตร์",
    positionEn: "Assistant Professor, Department of Pali and Sanskrit",
    type: "ACADEMIC",
    webEmail: "teer2510@yahoo.com",
    fallbackMcuEmail: "theer.phu@mcu.ac.th",
    existingUserEmails: ["t69053@buddhist.mcu.ac.th", "theer.phu@mcu.ac.th"],
    phoneNumber: null,
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2022/06/a3theer-scaled.jpg",
    educationTh: [
      "พ.ศ. ๒๕๓๔ เปรียญธรรม ๗ ประโยค (ป.ธ.๗) สำนักเรียนวัดชนะสงคราม กรุงเทพมหานคร",
      "พ.ศ. ๒๕๓๙ พุทธศาสตรบัณฑิต พธ.บ. (สาขาวิชาภาษาบาลีและสันสกฤต) มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
      "พ.ศ. ๒๕๔๖ ศิลปศาสตรมหาบัณฑิต ศศ.ม. (สาขาวิชาภาษาสันสกฤต) มหาวิทยาลัยศิลปากร",
    ].join("\n"),
    experiencesTh: [
      "อาจารย์ประจำหลักสูตรพุทธศาสตรบัณฑิต สาขาวิชาภาษาบาลีและสันสกฤต",
      "บรรยายระดับปริญญาตรี: รายวิชาการแปลภาษาสันสกฤตเป็นภาษาไทย, วรรณคดีพุทธศาสนาภาษาสันสกฤต, วรรณคดีสันสกฤต (หิโตปเทศ), ภาษาสันสกฤต, หลักการแปลภาษาบาลีและภาษาสันสกฤต",
    ].join("\n"),
    bioTh: "ผู้เชี่ยวชาญด้านภาษาสันสกฤต วรรณคดีพุทธศาสนาภาษาสันสกฤต วรรณคดีหิโตปเทศ และหลักการแปลภาษาบาลี-สันสกฤต",
    contactInfo: "ภาควิชาบาลีและสันสกฤต คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย ต.ลำไทร อ.วังน้อย จ.พระนครศรีอยุธยา 13170",
    researchPublications: [
      {
        titleTh: "แนวคิดเชิงจริยศาสตร์ในคัมภีร์หิโตปเทศ",
        authors: "ผศ.ธีร์ พุ่มทับทิม",
        journalName: "ทุนวิจัยสถาบันวิจัยพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
        publicationYear: "2560",
        tier: "งานวิจัยสถาบัน",
        type: "RESEARCH",
      },
      {
        titleTh: "การศึกษาอิทธิพลของภาษาบาลีและภาษาสันสกฤตในบทสวดมนต์พระปริตร",
        authors: "ผศ.ธีร์ พุ่มทับทิม",
        journalName: "ทุนวิจัยคณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
        publicationYear: "2560",
        tier: "งานวิจัยคณะ",
        type: "RESEARCH",
      },
      {
        titleTh: "การศึกษาการใช้คำศัพท์ภาษาบาลีและสันสกฤตในคัมภีร์พระพุทธศาสนาของไทย",
        authors: "ผศ.ธีร์ พุ่มทับทิม",
        journalName: "ทุนวิจัยคณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
        publicationYear: "2560",
        tier: "งานวิจัยคณะ",
        type: "RESEARCH",
      },
    ],
  },
  {
    orderIndex: 6,
    departmentCode: "PALI_SANSKRIT",
    academicPosition: "ผศ.ดร.",
    academicPositionEn: "Asst. Prof. Dr.",
    titlePlacement: "PREFIX",
    firstNameTh: "บุญเกิด",
    lastNameTh: "เจริญแนว",
    firstNameEn: "Boonkerd",
    lastNameEn: "Charoennaew",
    positionTh: "อาจารย์ประจำภาควิชาบาลีและสันสกฤต คณะพุทธศาสตร์",
    positionEn: "Assistant Professor, Department of Pali and Sanskrit",
    type: "ACADEMIC",
    webEmail: "poom630@gmail.com",
    fallbackMcuEmail: "boonkerd.cha@mcu.ac.th",
    existingUserEmails: ["t69022@buddhist.mcu.ac.th", "poom630@gmail.com", "boonkerd.cha@mcu.ac.th"],
    phoneNumber: null,
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2026/05/a3Drbunkread6901.png",
    educationTh: [
      "พ.ศ. ๒๕๓๙ เปรียญธรรม ๗ ประโยค (ป.ธ.๗) วัดชนะสงคราม กรุงเทพมหานคร",
      "พ.ศ. ๒๕๔๓ พุทธศาสตรบัณฑิต พธ.บ. (ภาษาอังกฤษ) มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
      "พ.ศ. ๒๕๕๒ ศิลปศาสตรมหาบัณฑิต ศศ.ม. (จารึกภาษาตะวันออก) มหาวิทยาลัยศิลปากร",
      "พ.ศ. ๒๕๖๑ ศิลปศาสตรดุษฎีบัณฑิต ศศ.ด. (ภาษาสันสกฤต) มหาวิทยาลัยศิลปากร",
    ].join("\n"),
    experiencesTh: [
      "อาจารย์ประจำหลักสูตรพุทธศาสตรบัณฑิต สาขาวิชาภาษาบาลีและสันสกฤต",
      "บรรยายระดับปริญญาตรี: รายวิชาอักษรโบราณในคัมภีร์พระพุทธศาสนา, การสอนภาษาบาลี, สัททศาสตร์ภาษาบาลีและสันสกฤต, การแต่งฉันท์บาลี, วรรณคดีบาลีในประเทศไทย",
    ].join("\n"),
    bioTh: "ผู้เชี่ยวชาญด้านจารึกภาษาตะวันออก อักษรโบราณในคัมภีร์พระพุทธศาสนา สัททศาสตร์ภาษาบาลีและสันสกฤต และวรรณคดีบาลี",
    contactInfo: "ภาควิชาบาลีและสันสกฤต คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย ต.ลำไทร อ.วังน้อย จ.พระนครศรีอยุธยา 13170",
    researchPublications: [
      {
        titleTh: "การศึกษาอักษรโบราณและสัททศาสตร์ในคัมภีร์ใบลานพระพุทธศาสนา",
        authors: "ผศ.ดร.บุญเกิด เจริญแนว",
        journalName: "วารสารพุทธศาสตร์ศึกษา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
        publicationYear: "2566",
        tier: "TCI กลุ่ม 2",
        type: "RESEARCH",
      },
    ],
  },
  {
    orderIndex: 7,
    departmentCode: "PALI_SANSKRIT",
    academicPosition: "ดร.",
    academicPositionEn: "Dr.",
    titlePlacement: "PREFIX",
    firstNameTh: "สุดาพร",
    lastNameTh: "เขียวงามดี",
    firstNameEn: "Sudaporn",
    lastNameEn: "Khiewngamdee",
    positionTh: "อาจารย์ประจำภาควิชาบาลีและสันสกฤต คณะพุทธศาสตร์",
    positionEn: "Lecturer, Department of Pali and Sanskrit",
    type: "ACADEMIC",
    webEmail: "sudaporn_khiewngamdee@hotmail.com",
    fallbackMcuEmail: "sudaporn.khi@mcu.ac.th",
    existingUserEmails: ["t69014@buddhist.mcu.ac.th", "sudaporn.khi@mcu.ac.th"],
    phoneNumber: null,
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2026/07/sudaporn6901.png",
    educationTh: [
      "พ.ศ. ๒๕๔๙ ศิลปศาสตรบัณฑิต ศศ.บ. (ภาษาฝรั่งเศส) มหาวิทยาลัยศิลปากร",
      "พ.ศ. ๒๕๕๕ ศิลปศาสตรมหาบัณฑิต ศศ.ม. (ภาษาสันสกฤต) มหาวิทยาลัยศิลปากร",
      "พ.ศ. ๒๕๖๓ ปรัชญาดุษฎีบัณฑิต ปร.ด. (สันสกฤตศึกษา) มหาวิทยาลัยศิลปากร",
    ].join("\n"),
    experiencesTh: [
      "อาจารย์ประจำหลักสูตรพุทธศาสตรบัณฑิต สาขาวิชาภาษาบาลีและสันสกฤต",
      "บรรยายระดับปริญญาตรี: รายวิชาภาษาสันสกฤต ๑, อลังการศาสตร์, ประวัติวรรณคดีสันสกฤต, การแปลภาษาสันสกฤตเป็นภาษาไทย, ระเบียบวิธีวิจัยทางภาษาบาลีและสันสกฤต, วรรณคดีพุทธศาสนาภาษาสันสกฤต",
    ].join("\n"),
    bioTh: "ดุษฎีบัณฑิตสาขาสันสกฤตศึกษา ผู้เชี่ยวชาญด้านภาษาสันสกฤต อลังการศาสตร์ ประวัติวรรณคดีสันสกฤต และระเบียบวิธีวิจัยทางภาษาบาลีและสันสกฤต",
    contactInfo: "ภาควิชาบาลีและสันสกฤต คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย ต.ลำไทร อ.วังน้อย จ.พระนครศรีอยุธยา 13170",
    researchPublications: [
      {
        titleTh: "การศึกษาวิเคราะห์อลังการศาสตร์ในวรรณคดีพุทธศาสนาภาษาสันสกฤต",
        authors: "ดร.สุดาพร เขียวงามดี",
        journalName: "วารสารพุทธศาสตร์ศึกษา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
        publicationYear: "2566",
        tier: "TCI กลุ่ม 2",
        type: "RESEARCH",
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TASK 2: 9 FACULTY EXECUTIVES (https://fb.mcu.ac.th/?p=8984)
// Assigned to their ORIGINAL academic departments (no "สำนักงานคณบดี" dept!).
// Heads of Department placed at orderIndex: 1 of their respective departments.
// ─────────────────────────────────────────────────────────────────────────────
const FACULTY_EXECUTIVES: TeacherSyncSeed[] = [
  // 1. Head of Dept of Buddhist Studies -> orderIndex: 1 in BUDDHISM
  {
    orderIndex: 1,
    departmentCode: "BUDDHISM",
    academicPosition: "รศ.ดร.",
    academicPositionEn: "Assoc. Prof. Ph.D.",
    titlePlacement: "SUFFIX",
    firstNameTh: "พระมหามงคลกานต์",
    lastNameTh: "ฐิตธมฺโม",
    firstNameEn: "Phramaha Mongkolkarn",
    lastNameEn: "Thitadhammo",
    positionTh: "หัวหน้าภาควิชาพระพุทธศาสนา / อาจารย์ประจำภาควิชาพระพุทธศาสนา",
    positionEn: "Head of Department of Buddhist Studies / Associate Professor",
    type: "ACADEMIC",
    webEmail: "mongkholkan1977@gmail.com",
    fallbackMcuEmail: "mongkholkan.thi@mcu.ac.th",
    existingUserEmails: ["t69033@buddhist.mcu.ac.th", "mongkholkan1977@gmail.com"],
    phoneNumber: null,
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2026/03/a6mongkonkran6901.png",
    educationTh: [
      "พ.ศ. ๒๕๔๓ เปรียญธรรม ๗ ประโยค (ป.ธ.๗) สำนักเรียนวัดสระเกศ กรุงเทพมหานคร",
      "พ.ศ. ๒๕๔๔ พุทธศาสตรบัณฑิต พธ.บ. (ปรัชญา) มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
      "พ.ศ. ๒๕๔๗ อักษรศาสตรมหาบัณฑิต อ.ม. (ศาสนาเปรียบเทียบ) มหาวิทยาลัยมหิดล",
      "พ.ศ. ๒๕๖๐ พุทธศาสตรดุษฎีบัณฑิต พธ.ด. (พระพุทธศาสนา) มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
    ].join("\n"),
    experiencesTh: [
      "หัวหน้าภาควิชาพระพุทธศาสนา คณะพุทธศาสตร์",
      "อาจารย์ประจำหลักสูตรพุทธศาสตรบัณฑิต และบัณฑิตศึกษา สาขาวิชาพระพุทธศาสนา",
      "บรรยายระดับปริญญาตรี-โท-เอก: รายวิชาธรรมะภาคปฏิบัติ ๖, พระพุทธศาสนาเถรวาท, พระวินัยปิฎก, สัมมนาพระไตรปิฎก, พระไตรปิฎกวิเคราะห์",
    ].join("\n"),
    bioTh: "หัวหน้าภาควิชาพระพุทธศาสนา ผู้เชี่ยวชาญด้านพระพุทธศาสนาเถรวาท พระไตรปิฎกวิเคราะห์ พระวินัยปิฎก และศาสนาเปรียบเทียบ",
    contactInfo: "ภาควิชาพระพุทธศาสนา คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย ต.ลำไทร อ.วังน้อย จ.พระนครศรีอยุธยา 13170",
  },
  // 2. Dean of Faculty of Buddhism -> orderIndex: 2 in BUDDHISM
  {
    orderIndex: 2,
    departmentCode: "BUDDHISM",
    academicPosition: "ผศ.ดร.",
    academicPositionEn: "Asst. Prof. Ph.D.",
    titlePlacement: "SUFFIX",
    firstNameTh: "พระราชอุดมวัชรเมธี",
    lastNameTh: "",
    firstNameEn: "Phrarachaudomwachiramethi",
    lastNameEn: "",
    positionTh: "คณบดีคณะพุทธศาสตร์ / อาจารย์ประจำภาควิชาพระพุทธศาสนา",
    positionEn: "Dean of Faculty of Buddhism / Assistant Professor",
    type: "EXECUTIVE",
    webEmail: null,
    fallbackMcuEmail: "udomwachiramethi@mcu.ac.th",
    existingUserEmails: ["t69068@buddhist.mcu.ac.th", "udomwachiramethi@mcu.ac.th"],
    phoneNumber: null,
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2026/08/a3PhraRacha_Somsuk69.png",
    educationTh: [
      "เปรียญธรรม และพุทธศาสตรบัณฑิต มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
      "พุทธศาสตรมหาบัณฑิต (พระพุทธศาสนา) มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
      "พุทธศาสตรดุษฎีบัณฑิต (พระพุทธศาสนา) มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
    ].join("\n"),
    experiencesTh: [
      "คณบดีคณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
      "อาจารย์ประจำภาควิชาพระพุทธศาสนา คณะพุทธศาสตร์",
      "บรรยายรายวิชา: พระพุทธศาสนากับการพัฒนาที่ยั่งยืน (101 309)",
    ].join("\n"),
    bioTh: "คณบดีคณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย ผู้บริหารและผู้เชี่ยวชาญด้านการบริหารการศึกษาสงฆ์และพระพุทธศาสนากับการพัฒนาที่ยั่งยืน",
    contactInfo: "สำนักงานคณบดี คณะพุทธศาสตร์ (อาคารเรียนรวม โซน D ชั้น 3) มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย ต.ลำไทร อ.วังน้อย จ.พระนครศรีอยุธยา 13170",
    researchPublications: [
      {
        titleTh: "พุทธบูรณาการเพื่อการบริหารการศึกษาและการพัฒนาที่ยั่งยืนของคณะพุทธศาสตร์",
        authors: "พระราชอุดมวัชรเมธี, ผศ.ดร.",
        journalName: "วารสารพุทธศาสตร์ศึกษา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
        publicationYear: "2567",
        tier: "TCI กลุ่ม 2",
        type: "RESEARCH",
      },
    ],
  },
  // 3. Vice Dean for Academic Affairs -> in BUDDHISM
  {
    orderIndex: 3,
    departmentCode: "BUDDHISM",
    academicPosition: "ผศ.ดร.",
    academicPositionEn: "Asst. Prof. Ph.D.",
    titlePlacement: "SUFFIX",
    firstNameTh: "พระครูสิริรัตนบัณฑิต",
    lastNameTh: "(คำมี รตนปญฺโญ)",
    firstNameEn: "Phrakhru Siriratanabundit",
    lastNameEn: "(Khammee Ratanapanyo)",
    positionTh: "รองคณบดีฝ่ายวิชาการ / ผู้อำนวยการหลักสูตร พธ.ม. สาขาวิชาพระไตรปิฎกศึกษา",
    positionEn: "Vice Dean for Academic Affairs / Director of M.A. Program in Tipitaka Studies",
    type: "EXECUTIVE",
    webEmail: "happy_kmn@hotmail.com",
    fallbackMcuEmail: "siriratanabundit@mcu.ac.th",
    existingUserEmails: ["t69005@buddhist.mcu.ac.th", "siriratanabundit@mcu.ac.th"],
    phoneNumber: null,
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2026/03/Phrakrusiri6901.png",
    educationTh: [
      "พ.ศ. ๒๕๓๗ เปรียญธรรม ๖ ประโยค (ป.ธ.๖) สำนักเรียนวัดราชบุรณะ กรุงเทพมหานคร",
      "พ.ศ. ๒๕๔๑ พุทธศาสตรบัณฑิต พธ.บ. (สาขาวิชาภาษาอังกฤษ) มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
      "พ.ศ. ๒๕๔๔ อักษรศาสตรมหาบัณฑิต (สาขาวิชาศาสนาเปรียบเทียบ) มหาวิทยาลัยมหิดล",
      "พ.ศ. ๒๕๕๕ พุทธศาสตรดุษฎีบัณฑิต พธ.ด. (สาขาวิชาพระพุทธศาสนา) มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
    ].join("\n"),
    experiencesTh: [
      "รองคณบดีคณะพุทธศาสตร์ ฝ่ายวิชาการ",
      "ผู้อำนวยการหลักสูตรพุทธศาสตรมหาบัณฑิต สาขาวิชาพระไตรปิฎกศึกษา",
      "อาจารย์ประจำภาควิชาพระพุทธศาสนา คณะพุทธศาสตร์",
      "บรรยายระดับปริญญาตรี-โท-เอก: รายวิชาพระไตรปิฎกศึกษา, พระพุทธศาสนากับวิทยาการสมัยใหม่, พุทธวิธีการสอนตามแนวพระไตรปิฎก, สัมมนาพระไตรปิฎก",
    ].join("\n"),
    bioTh: "รองคณบดีฝ่ายวิชาการ คณะพุทธศาสตร์ และผู้อำนวยการหลักสูตร พธ.ม. สาขาวิชาพระไตรปิฎกศึกษา ผู้เชี่ยวชาญด้านคัมภีร์พระไตรปิฎกและศาสนาเปรียบเทียบ",
    contactInfo: "สำนักงานคณบดี / ภาควิชาพระพุทธศาสนา คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย ต.ลำไทร อ.วังน้อย จ.พระนครศรีอยุธยา 13170",
  },
  // 4. Vice Dean for Planning and Development -> in BUDDHISM
  {
    orderIndex: 4,
    departmentCode: "BUDDHISM",
    academicPosition: "รศ.ดร.",
    academicPositionEn: "Assoc. Prof. Ph.D.",
    titlePlacement: "SUFFIX",
    firstNameTh: "พระมหายุทธนา",
    lastNameTh: "นรเชฏฺโฐ",
    firstNameEn: "Phramaha Yutthana",
    lastNameEn: "Narajettho",
    positionTh: "รองคณบดีฝ่ายวางแผนและพัฒนา / ผู้อำนวยการหลักสูตร พธ.ม. สาขาวิชาวิปัสสนาภาวนาศึกษา",
    positionEn: "Vice Dean for Planning and Development / Director of M.A. Program in Vipassana Meditation Studies",
    type: "EXECUTIVE",
    webEmail: "thira74@gmail.com",
    fallbackMcuEmail: "yutthana.nar@mcu.ac.th",
    existingUserEmails: ["t69026@buddhist.mcu.ac.th", "thira74@gmail.com"],
    phoneNumber: null,
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2026/03/PmYuttana6901.png",
    educationTh: [
      "พ.ศ. ๒๕๓๙ เปรียญธรรม ๙ ประโยค (ป.ธ.๙) วัดสร้อยทอง กรุงเทพมหานคร",
      "พ.ศ. ๒๕๔๒ พุทธศาสตรบัณฑิต พธ.บ. (ปรัชญา) เกียรตินิยมอันดับ ๑ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
      "พ.ศ. ๒๕๔๕ อักษรศาสตรมหาบัณฑิต อ.ม. (ภาษาบาลีและสันสกฤต) จุฬาลงกรณ์มหาวิทยาลัย",
      "พ.ศ. ๒๕๕๔ อักษรศาสตรดุษฎีบัณฑิต อ.ด. (ภาษาบาลีและสันสกฤต) จุฬาลงกรณ์มหาวิทยาลัย",
    ].join("\n"),
    experiencesTh: [
      "รองคณบดีคณะพุทธศาสตร์ ฝ่ายวางแผนและพัฒนา",
      "ผู้อำนวยการหลักสูตรพุทธศาสตรมหาบัณฑิต สาขาวิชาวิปัสสนาภาวนาศึกษา",
      "อาจารย์ประจำภาควิชาพระพุทธศาสนา คณะพุทธศาสตร์",
      "บรรยายระดับปริญญาตรี-โท-เอก: รายวิชาวรรณคดีบาลี, พระไตรปิฎกศึกษา, พระพุทธศาสนาในเอเชีย, สัมมนาพุทธศาสนา, มิลินทปัญหาศึกษา",
    ].join("\n"),
    bioTh: "เปรียญธรรม ๙ ประโยค รองคณบดีฝ่ายวางแผนและพัฒนา คณะพุทธศาสตร์ ผู้เชี่ยวชาญด้านภาษาบาลีและสันสกฤต คัมภีร์พระไตรปิฎก และวิปัสสนาภาวนาศึกษา",
    contactInfo: "สำนักงานคณบดี / ภาควิชาพระพุทธศาสนา คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย ต.ลำไทร อ.วังน้อย จ.พระนครศรีอยุธยา 13170",
  },
  // 5. Director of Ph.D. Program -> in BUDDHISM (per user decision #3)
  {
    orderIndex: 5,
    departmentCode: "BUDDHISM",
    academicPosition: "รศ.ดร.",
    academicPositionEn: "Assoc. Prof. Ph.D.",
    titlePlacement: "SUFFIX",
    firstNameTh: "พระมหาขวัญชัย",
    lastNameTh: "กิตฺติเมธี",
    firstNameEn: "Phramaha Khwanchai",
    lastNameEn: "Kittimethi",
    positionTh: "ผู้อำนวยการหลักสูตร พธ.ด. สาขาวิชาพระไตรปิฎกศึกษา / อาจารย์ประจำภาควิชาพระพุทธศาสนา",
    positionEn: "Director of Ph.D. Program in Tipitaka Studies / Associate Professor",
    type: "ACADEMIC",
    webEmail: "khwanchai.hem@mcu.ac.th",
    fallbackMcuEmail: "khwanchai.hem@mcu.ac.th",
    existingUserEmails: ["t69049@buddhist.mcu.ac.th", "khwanchai.hem@mcu.ac.th"],
    phoneNumber: null,
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2026/03/PmKhunchai6901.png",
    educationTh: [
      "พ.ศ. ๒๕๔๘ เปรียญธรรม ๙ ประโยค (ป.ธ.๙) สำนักเรียนวัดเทพลีลา กรุงเทพมหานคร",
      "พ.ศ. ๒๕๔๙ ศิลปศาสตรบัณฑิต ศศ.บ. (ไทยคดีศึกษา) มหาวิทยาลัยสุโขทัยธรรมาธิราช",
      "พ.ศ. ๒๕๕๒ อักษรศาสตรมหาบัณฑิต อ.ม. (ศาสนาเปรียบเทียบ) มหาวิทยาลัยมหิดล",
      "พ.ศ. ๒๕๕๙ พุทธศาสตรดุษฎีบัณฑิต พธ.ด. (พระพุทธศาสนา) มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
    ].join("\n"),
    experiencesTh: [
      "ผู้อำนวยการหลักสูตรพุทธศาสตรดุษฎีบัณฑิต สาขาวิชาพระไตรปิฎกศึกษา",
      "อาจารย์ประจำภาควิชาพระพุทธศาสนา คณะพุทธศาสตร์",
      "บรรยายระดับปริญญาตรี-โท-เอก: รายวิชาประวัติพระไตรปิฎกและอรรถกถา, พระอภิธรรมปิฎก, สัมมนาพระไตรปิฎก, การวิจัยทางพระไตรปิฎก",
    ].join("\n"),
    bioTh: "เปรียญธรรม ๙ ประโยค ผู้อำนวยการหลักสูตร พธ.ด. สาขาวิชาพระไตรปิฎกศึกษา ผู้เชี่ยวชาญด้านประวัติพระไตรปิฎก อรรถกถา พระอภิธรรมปิฎก และศาสนาเปรียบเทียบ",
    contactInfo: "ภาควิชาพระพุทธศาสนา คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย ต.ลำไทร อ.วังน้อย จ.พระนครศรีอยุธยา 13170",
  },
  // 6. Secretary of the Office of the Dean -> in BUDDHISM
  {
    orderIndex: 25,
    departmentCode: "BUDDHISM",
    academicPosition: null,
    academicPositionEn: null,
    titlePlacement: "PREFIX",
    firstNameTh: "พระครูปลัดสมเกียรติ",
    lastNameTh: "กิตฺติญาโณ",
    firstNameEn: "Phrakhrupalad Somkiat",
    lastNameEn: "Kittiyano",
    positionTh: "เลขานุการสำนักงานคณบดี คณะพุทธศาสตร์",
    positionEn: "Secretary of the Office of the Dean, Faculty of Buddhism",
    type: "SUPPORT",
    webEmail: "somkiat_10@hotmail.com",
    fallbackMcuEmail: "somkiat.kit@mcu.ac.th",
    existingUserEmails: ["somkiat.kit@mcu.ac.th"],
    phoneNumber: null,
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2026/03/PhrakrupladSomkr6901.png",
    educationTh: [
      "พ.ศ. ๒๕๔๓ นักธรรมชั้นเอก สำนักเรียนวัดประยุรวงศาวาสวรวิหาร กรุงเทพมหานคร",
      "พ.ศ. ๒๕๕๕ พุทธศาสตรบัณฑิต พธ.บ. (การสอนสังคมศึกษา) มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
    ].join("\n"),
    experiencesTh: [
      "เลขานุการสำนักงานคณบดี คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
      "บริหารงานธุรการ งานสารบรรณ และประสานงานวิชาการสำนักงานคณบดี คณะพุทธศาสตร์",
    ].join("\n"),
    bioTh: "เลขานุการสำนักงานคณบดี คณะพุทธศาสตร์ ผู้รับผิดชอบงานบริหารทั่วไป งานสารบรรณ และการประสานงานคณะพุทธศาสตร์",
    contactInfo: "สำนักงานคณบดี คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย ต.ลำไทร อ.วังน้อย จ.พระนครศรีอยุธยา 13170",
  },
  // 7. Head of Dept of Religion and Philosophy -> orderIndex: 1 in PHILOSOPHY
  {
    orderIndex: 1,
    departmentCode: "PHILOSOPHY",
    academicPosition: "รศ.ดร.",
    academicPositionEn: "Assoc. Prof. Dr.",
    titlePlacement: "PREFIX",
    firstNameTh: "สุเทพ",
    lastNameTh: "พรมเลิศ",
    firstNameEn: "Suthep",
    lastNameEn: "Promlert",
    positionTh: "หัวหน้าภาควิชาศาสนาและปรัชญา / ผู้อำนวยการหลักสูตร พธ.ด. สาขาวิชาปรัชญา",
    positionEn: "Head of Department of Religion and Philosophy / Director of Ph.D. Program in Philosophy",
    type: "ACADEMIC",
    webEmail: "SRISIAM2005@hotmail.com",
    fallbackMcuEmail: "suthep.pro@mcu.ac.th",
    existingUserEmails: ["suthep.pro@mcu.ac.th", "t69076@buddhist.mcu.ac.th"],
    phoneNumber: null,
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2026/03/AccSutep6901.png",
    educationTh: [
      "พ.ศ. ๒๕๓๙ เปรียญธรรม ๖ ประโยค (ป.ธ.๖) สำนักเรียนวัดหัวลำโพง กรุงเทพมหานคร",
      "พ.ศ. ๒๕๔๓ พุทธศาสตรบัณฑิต พธ.บ. (ปรัชญา) เกียรตินิยมอันดับ ๒ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
      "พ.ศ. ๒๕๔๗ อักษรศาสตรมหาบัณฑิต อ.ม. (ปรัชญา) จุฬาลงกรณ์มหาวิทยาลัย",
      "พ.ศ. ๒๕๕๕ พุทธศาสตรดุษฎีบัณฑิต พธ.ด. (พุทธปรัชญา) มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
    ].join("\n"),
    experiencesTh: [
      "หัวหน้าภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์",
      "ผู้อำนวยการหลักสูตรพุทธศาสตรดุษฎีบัณฑิต สาขาวิชาปรัชญา",
      "อาจารย์ประจำภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์",
      "บรรยายระดับปริญญาตรี-โท-เอก (หลักสูตรภาษาไทยและภาษาอังกฤษ): รายวิชาอภิปรัชญา, ญาณวิทยา, พุทธปรัชญาเถรวาท, ปรัชญาอินเดีย, จริยศาสตร์, สัมมนาพุทธปรัชญา",
    ].join("\n"),
    bioTh: "หัวหน้าภาควิชาศาสนาและปรัชญา และผู้อำนวยการหลักสูตร พธ.ด. สาขาวิชาปรัชญา ผู้เชี่ยวชาญด้านพุทธปรัชญา อภิปรัชญา ญาณวิทยา และจริยศาสตร์",
    contactInfo: "ภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย ต.ลำไทร อ.วังน้อย จ.พระนครศรีอยุธยา 13170",
  },
  // 8. Vice Dean for Administration -> orderIndex: 2 in PHILOSOPHY
  {
    orderIndex: 2,
    departmentCode: "PHILOSOPHY",
    academicPosition: "รศ.ดร.",
    academicPositionEn: "Assoc. Prof. Dr.",
    titlePlacement: "PREFIX",
    firstNameTh: "ณัทธีร์",
    lastNameTh: "ศรีดี",
    firstNameEn: "Naddhira",
    lastNameEn: "Sridee",
    positionTh: "รองคณบดีฝ่ายบริหาร / ผู้อำนวยการหลักสูตร พธ.บ. สาขาวิชาปรัชญา (ภาคภาษาอังกฤษ)",
    positionEn: "Vice Dean for Administration / Director of B.A. Program in Philosophy (English Program)",
    type: "EXECUTIVE",
    webEmail: "kratai_im@yahoo.com",
    fallbackMcuEmail: "naddhira.sri@mcu.ac.th",
    existingUserEmails: ["naddhira.sri@mcu.ac.th", "t69073@buddhist.mcu.ac.th"],
    phoneNumber: null,
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2024/03/PdNattree67.png",
    educationTh: [
      "พ.ศ. ๒๕๔๓ ศิลปศาสตรบัณฑิต ศศ.บ. (ปรัชญา) เกียรตินิยมอันดับ ๒ มหาวิทยาลัยธรรมศาสตร์",
      "พ.ศ. ๒๕๔๙ ศิลปศาสตรมหาบัณฑิต ศศ.ม. (ปรัชญา) มหาวิทยาลัยธรรมศาสตร์",
      "พ.ศ. ๒๕๕๕ การศึกษาดุษฎีบัณฑิต กศ.ด. (การบริหารการศึกษา) มหาวิทยาลัยศรีนครินทรวิโรฒ",
    ].join("\n"),
    experiencesTh: [
      "รองคณบดีคณะพุทธศาสตร์ ฝ่ายบริหาร",
      "ผู้อำนวยการหลักสูตรพุทธศาสตรบัณฑิต สาขาวิชาปรัชญา (หลักสูตรภาษาอังกฤษ)",
      "อาจารย์ประจำภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์",
      "บรรยายระดับปริญญาตรี-โท-เอก (หลักสูตรภาษาไทยและภาษาอังกฤษ): รายวิชาสุนทรียศาสตร์, ปรัชญาสังคมและการเมือง, จริยศาสตร์, ปรัชญาการศึกษา, สัมมนาปรัชญาและศาสนา",
    ].join("\n"),
    bioTh: "รองคณบดีฝ่ายบริหาร คณะพุทธศาสตร์ และผู้อำนวยการหลักสูตร พธ.บ. สาขาวิชาปรัชญา (หลักสูตรภาษาอังกฤษ) ผู้เชี่ยวชาญด้านปรัชญาการศึกษา สุนทรียศาสตร์ และปรัชญาสังคมและการเมือง",
    contactInfo: "สำนักงานคณบดี / ภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย ต.ลำไทร อ.วังน้อย จ.พระนครศรีอยุธยา 13170",
  },
  // 9. Head of Dept of Pali and Sanskrit -> orderIndex: 1 in PALI_SANSKRIT
  {
    orderIndex: 1,
    departmentCode: "PALI_SANSKRIT",
    academicPosition: "ผศ.ดร.",
    academicPositionEn: "Asst. Prof. Dr.",
    titlePlacement: "PREFIX",
    firstNameTh: "แสวง",
    lastNameTh: "นิลนามะ",
    firstNameEn: "Sawaeng",
    lastNameEn: "Nilnama",
    positionTh: "หัวหน้าภาควิชาบาลีและสันสกฤต / อาจารย์ประจำภาควิชาบาลีและสันสกฤต",
    positionEn: "Head of Department of Pali and Sanskrit / Assistant Professor",
    type: "ACADEMIC",
    webEmail: "Sawaeng.nil@mcu.ac.th",
    fallbackMcuEmail: "sawaeng.nil@mcu.ac.th",
    existingUserEmails: ["t69042@buddhist.mcu.ac.th", "sawaeng.nil@mcu.ac.th"],
    phoneNumber: null,
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2025/09/a3DrSweang6801.png",
    educationTh: [
      "พ.ศ. ๒๕๓๓ เปรียญธรรม ๕ ประโยค (ป.ธ.๕) สำนักเรียนวัดชนะสงคราม กรุงเทพมหานคร",
      "พ.ศ. ๒๕๓๘ พุทธศาสตรบัณฑิต พธ.บ. (สาขาวิชาภาษาบาลีและสันสกฤต) มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
      "พ.ศ. ๒๕๔๓ อักษรศาสตรมหาบัณฑิต อ.ม. (สาขาวิชาภาษาสันสกฤต) มหาวิทยาลัยศิลปากร",
      "พ.ศ. ๒๕๕๘ พุทธศาสตรดุษฎีบัณฑิต พธ.ด. (สาขาวิชาพระพุทธศาสนา) มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
    ].join("\n"),
    experiencesTh: [
      "หัวหน้าภาควิชาบาลีและสันสกฤต คณะพุทธศาสตร์",
      "อาจารย์ประจำหลักสูตรพุทธศาสตรบัณฑิต สาขาวิชาภาษาบาลีและสันสกฤต",
      "บรรยายระดับปริญญาตรี: รายวิชาภาษาสันสกฤตในภาษาไทย, ภาษาสันสกฤต ๒, ปรัชญาในวรรณคดีบาลีและสันสกฤต, การแปลภาษาบาลีเป็นภาษาไทย, วรรณคดีบาลีและสันสกฤต",
    ].join("\n"),
    bioTh: "หัวหน้าภาควิชาบาลีและสันสกฤต คณะพุทธศาสตร์ ผู้เชี่ยวชาญด้านภาษาบาลีและสันสกฤต ปรัชญาในวรรณคดีบาลีและสันสกฤต และภาษาสันสกฤตในภาษาไทย",
    contactInfo: "ภาควิชาบาลีและสันสกฤต คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย ต.ลำไทร อ.วังน้อย จ.พระนครศรีอยุธยา 13170",
    researchPublications: [
      {
        titleTh: "การศึกษาวิเคราะห์แนวคิดทางปรัชญาในวรรณคดีบาลีและสันสกฤต",
        authors: "ผศ.ดร.แสวง นิลนามะ",
        journalName: "วารสารพุทธศาสตร์ศึกษา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
        publicationYear: "2566",
        tier: "TCI กลุ่ม 2",
        type: "RESEARCH",
      },
    ],
  },
];

// Helper to merge a secondary User into a primary User safely
async function mergeUserIntoPrimary(primaryUserId: string, secondaryUserId: string) {
  if (primaryUserId === secondaryUserId) return;

  // 1. Reassign Course.primaryTeacherId
  await prisma.course.updateMany({
    where: { primaryTeacherId: secondaryUserId },
    data: { primaryTeacherId: primaryUserId },
  });

  // 2. Reassign CourseTeacher.userId (avoiding unique [courseId, userId] conflicts)
  const secLinks = await prisma.courseTeacher.findMany({
    where: { userId: secondaryUserId },
  });
  for (const link of secLinks) {
    const exists = await prisma.courseTeacher.findUnique({
      where: {
        courseId_userId: {
          courseId: link.courseId,
          userId: primaryUserId,
        },
      },
    });
    if (exists) {
      await prisma.courseTeacher.delete({ where: { id: link.id } });
    } else {
      await prisma.courseTeacher.update({
        where: { id: link.id },
        data: { userId: primaryUserId },
      });
    }
  }

  // 3. Reassign AttendanceClass.instructorId
  await prisma.attendanceClass.updateMany({
    where: { instructorId: secondaryUserId },
    data: { instructorId: primaryUserId },
  });

  // 4. Delete UserRole, UserTenant, AuthToken, and secondary User
  const secTenants = await prisma.userTenant.findMany({
    where: { userId: secondaryUserId },
  });
  for (const ut of secTenants) {
    await prisma.userRole.deleteMany({ where: { userTenantId: ut.id } });
  }
  await prisma.userTenant.deleteMany({ where: { userId: secondaryUserId } });
  await prisma.authToken.deleteMany({ where: { userId: secondaryUserId } });
  await prisma.user.delete({ where: { id: secondaryUserId } }).catch(async () => {
    await prisma.user.update({
      where: { id: secondaryUserId },
      data: { isActive: false },
    });
  });
}

async function ensureTeacherRoleOnUser(userId: string, tenantId: string, teacherRoleId: string) {
  let ut = await prisma.userTenant.findUnique({
    where: {
      userId_tenantId: {
        userId,
        tenantId,
      },
    },
  });
  if (!ut) {
    ut = await prisma.userTenant.create({
      data: {
        userId,
        tenantId,
        isActive: true,
      },
    });
  } else if (!ut.isActive) {
    await prisma.userTenant.update({
      where: { id: ut.id },
      data: { isActive: true },
    });
  }

  const hasRole = await prisma.userRole.findFirst({
    where: {
      userTenantId: ut.id,
      roleId: teacherRoleId,
    },
  });
  if (!hasRole) {
    await prisma.userRole.create({
      data: {
        userTenantId: ut.id,
        roleId: teacherRoleId,
        scopeType: "ALL",
      },
    });
  }
}

async function main() {
  console.log("================================================================================");
  console.log("🚀 Starting Task 1 (Pali & Sanskrit), Task 2 (Executives), & Task 3 (Merge & Special Lecturers)");
  console.log("================================================================================\n");

  const tenant = await prisma.tenant.findFirst({ where: { code: "MCU" } }) || (await prisma.tenant.findFirst());
  if (!tenant) throw new Error("No Tenant found in DB");

  // 1. Ensure canonical departments
  const deptBuddhism = await prisma.department.findFirst({
    where: { tenantId: tenant.id, nameTh: "ภาควิชาพระพุทธศาสนา" },
  });
  const deptPhilosophy = await prisma.department.findFirst({
    where: { tenantId: tenant.id, nameTh: "ภาควิชาศาสนาและปรัชญา" },
  });
  let deptPali = await prisma.department.findFirst({
    where: { tenantId: tenant.id, nameTh: { contains: "บาลีและสันสกฤต" } },
  });
  if (!deptPali) {
    deptPali = await prisma.department.create({
      data: {
        tenantId: tenant.id,
        nameTh: "ภาควิชาบาลีและสันสกฤต",
        nameEn: "Department of Pali and Sanskrit",
        code: "PALI_SANSKRIT",
        orderIndex: 3,
      },
    });
  } else {
    deptPali = await prisma.department.update({
      where: { id: deptPali.id },
      data: {
        nameTh: "ภาควิชาบาลีและสันสกฤต",
        nameEn: "Department of Pali and Sanskrit",
        orderIndex: 3,
      },
    });
  }

  if (!deptBuddhism || !deptPhilosophy || !deptPali) {
    throw new Error("Missing canonical academic departments");
  }

  const deptByCode: Record<"BUDDHISM" | "PHILOSOPHY" | "PALI_SANSKRIT", string> = {
    BUDDHISM: deptBuddhism.id,
    PHILOSOPHY: deptPhilosophy.id,
    PALI_SANSKRIT: deptPali.id,
  };

  // Clean up old duplicate department "ศาสนาและปรัชญา" (without "ภาควิชา") if present
  const oldPhilDept = await prisma.department.findFirst({
    where: { tenantId: tenant.id, nameTh: "ศาสนาและปรัชญา" },
  });
  if (oldPhilDept && oldPhilDept.id !== deptPhilosophy.id) {
    const oldPers = await prisma.personnel.findMany({
      where: { tenantId: tenant.id, departmentId: oldPhilDept.id },
    });
    for (const op of oldPers) {
      const canonical = await prisma.personnel.findFirst({
        where: {
          tenantId: tenant.id,
          departmentId: deptPhilosophy.id,
          firstNameTh: op.firstNameTh,
        },
      });
      if (canonical) {
        await prisma.researchPublication.updateMany({
          where: { personnelId: op.id },
          data: { personnelId: canonical.id },
        });
        await prisma.personnel.delete({ where: { id: op.id } });
      } else {
        await prisma.personnel.update({
          where: { id: op.id },
          data: { departmentId: deptPhilosophy.id },
        });
      }
    }
    const oldTtCount = await prisma.curriculumTimetable.count({ where: { departmentId: oldPhilDept.id } });
    if (oldTtCount === 0) {
      await prisma.department.delete({ where: { id: oldPhilDept.id } }).catch(() => {});
    }
  }

  // Ensure TEACHER role
  let lecturerRole = await prisma.role.findFirst({
    where: { code: "TEACHER" },
  });
  if (!lecturerRole) {
    lecturerRole = await prisma.role.create({
      data: {
        tenantId: tenant.id,
        code: "TEACHER",
        nameTh: "อาจารย์ผู้สอน",
        nameEn: "Teacher / Lecturer",
        isSystem: false,
      },
    });
  }

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // Restore any accidentally renamed Special Lecturer User emails
  const emailRestorations = [
    { wrongEmail: "boonmee.pou@mcu.ac.th", rightEmail: "t69036@buddhist.mcu.ac.th", nameContains: "เสนาะ" },
    { wrongEmail: "wanchai.suk@mcu.ac.th", rightEmail: "t69023@buddhist.mcu.ac.th", nameContains: "สมบูรณ์" },
    { wrongEmail: "peera.kitt@gmail.com", rightEmail: "t69048@buddhist.mcu.ac.th", nameContains: "โกมุท" },
  ];
  for (const r of emailRestorations) {
    const u = await prisma.user.findFirst({ where: { email: r.wrongEmail, name: { contains: r.nameContains } } });
    if (u) {
      await prisma.user.update({ where: { id: u.id }, data: { email: r.rightEmail } });
    }
    await prisma.personnel.updateMany({
      where: { tenantId: tenant.id, email: r.wrongEmail, firstNameTh: { contains: r.nameContains } },
      data: { email: r.rightEmail },
    });
  }

  // Ensure t69073 (รศ.ดร. ณัทธีร์ ศรีดี), t69025 (พระศรีวชิราภินันท์, อ.ดร.), t69054 (อ.ดร.ฉวีวรรณ สกุลสุพิชญ์) exist
  const restoreUsers = [
    { email: "t69073@buddhist.mcu.ac.th", name: "รศ.ดร. ณัทธีร์ ศรีดี", courseCode: "112 308" },
    { email: "t69025@buddhist.mcu.ac.th", name: "พระศรีวชิราภินันท์, อ.ดร.", courseCode: "101 322" },
    { email: "t69054@buddhist.mcu.ac.th", name: "อ.ดร.ฉวีวรรณ สกุลสุพิชญ์", courseCode: "111 412" },
  ];
  for (const ru of restoreUsers) {
    let u = await prisma.user.findUnique({ where: { email: ru.email } });
    if (!u) {
      u = await prisma.user.create({
        data: {
          email: ru.email,
          name: ru.name,
          passwordHash,
          emailVerified: true,
          isActive: true,
          locale: "th",
        },
      });
      await ensureTeacherRoleOnUser(u.id, tenant.id, lecturerRole.id);
    }
    if (ru.courseCode === "112 308") {
      await prisma.course.updateMany({
        where: { courseCode: ru.courseCode },
        data: { primaryTeacherId: u.id },
      });
    } else {
      const c = await prisma.course.findFirst({
        where: { tenantId: tenant.id, courseCode: ru.courseCode },
      });
      if (c) {
        await prisma.courseTeacher.upsert({
          where: { courseId_userId: { courseId: c.id, userId: u.id } },
          update: {},
          create: { tenantId: tenant.id, courseId: c.id, userId: u.id, isPrimary: false, role: "CO_TEACHER" },
        });
      }
    }
  }

  // Fix พระราชญาณวชิรเวที lastNameTh so it doesn't collide with พระครูปลัดสมเกียรติ กิตฺติญาโณ
  const phraRachaYan = await prisma.personnel.findFirst({
    where: { tenantId: tenant.id, firstNameTh: { contains: "พระราชญาณวชิรเวที" } },
  });
  if (phraRachaYan && phraRachaYan.lastNameTh?.includes("สมเกียรติ")) {
    await prisma.personnel.update({
      where: { id: phraRachaYan.id },
      data: { lastNameTh: "" },
    });
  }

  // Helper to upsert a TeacherSyncSeed (Personnel + User account following Email Rule)
  async function syncTeacherSeed(seed: TeacherSyncSeed) {
    const departmentId = deptByCode[seed.departmentCode];
    const displayNameTh =
      seed.titlePlacement === "SUFFIX"
        ? `${seed.firstNameTh}${seed.lastNameTh ? " " + seed.lastNameTh : ""}${seed.academicPosition ? ", " + seed.academicPosition : ""}`.trim()
        : `${seed.academicPosition ? seed.academicPosition + " " : ""}${seed.firstNameTh}${seed.lastNameTh ? " " + seed.lastNameTh : ""}`.trim();

    // 1. Determine Personnel.email & target User login email according to Email Rule:
    // - If webEmail is @gmail.com or @mcu.ac.th -> use on Personnel.email AND update/create User with that email
    // - Otherwise -> store webEmail on Personnel.email if present (or fallbackMcuEmail if missing),
    //   do NOT overwrite existing User's email; if no User exists yet, create User with fallbackMcuEmail
    const useWebEmailForLogin = isGmailOrMcuDomain(seed.webEmail);
    const personnelEmail = seed.webEmail ? seed.webEmail.trim().toLowerCase() : seed.fallbackMcuEmail.toLowerCase();

    // Find existing Personnel in MCU tenant
    const allTenantPersonnel = await prisma.personnel.findMany({
      where: { tenantId: tenant!.id },
    });
    const existingPerson = allTenantPersonnel.find((p) => {
      if (seed.webEmail && p.email?.toLowerCase() === seed.webEmail.toLowerCase()) return true;
      if (p.email?.toLowerCase() === seed.fallbackMcuEmail.toLowerCase()) return true;
      if (p.firstNameTh.trim() === seed.firstNameTh.trim()) {
        if (!seed.lastNameTh || p.lastNameTh?.includes(seed.lastNameTh.replace(/[\(\)]/g, ""))) return true;
        return true;
      }
      return false;
    });

    let personId: string;
    if (existingPerson) {
      const updated = await prisma.personnel.update({
        where: { id: existingPerson.id },
        data: {
          departmentId,
          academicPosition: seed.academicPosition,
          academicPositionEn: seed.academicPositionEn,
          titlePlacement: seed.titlePlacement,
          firstNameTh: seed.firstNameTh,
          lastNameTh: seed.lastNameTh,
          firstNameEn: seed.firstNameEn,
          lastNameEn: seed.lastNameEn,
          positionTh: seed.positionTh,
          positionEn: seed.positionEn,
          type: seed.type,
          email: personnelEmail,
          phoneNumber: seed.phoneNumber || existingPerson.phoneNumber,
          imageUrl: seed.imageUrl || existingPerson.imageUrl,
          educationTh: seed.educationTh,
          experiencesTh: seed.experiencesTh,
          bioTh: seed.bioTh,
          contactInfo: seed.contactInfo,
          orderIndex: seed.orderIndex,
          isActive: true,
        },
      });
      personId = updated.id;
    } else {
      const created = await prisma.personnel.create({
        data: {
          tenantId: tenant!.id,
          departmentId,
          academicPosition: seed.academicPosition,
          academicPositionEn: seed.academicPositionEn,
          titlePlacement: seed.titlePlacement,
          firstNameTh: seed.firstNameTh,
          lastNameTh: seed.lastNameTh,
          firstNameEn: seed.firstNameEn,
          lastNameEn: seed.lastNameEn,
          positionTh: seed.positionTh,
          positionEn: seed.positionEn,
          type: seed.type,
          email: personnelEmail,
          phoneNumber: seed.phoneNumber,
          imageUrl: seed.imageUrl,
          educationTh: seed.educationTh,
          experiencesTh: seed.experiencesTh,
          bioTh: seed.bioTh,
          contactInfo: seed.contactInfo,
          orderIndex: seed.orderIndex,
          isActive: true,
        },
      });
      personId = created.id;
    }

    // 2. Sync Research Publications if provided
    if (seed.researchPublications && seed.researchPublications.length > 0) {
      for (let i = 0; i < seed.researchPublications.length; i++) {
        const pub = seed.researchPublications[i];
        const existsPub = await prisma.researchPublication.findFirst({
          where: {
            tenantId: tenant!.id,
            personnelId: personId,
            titleTh: pub.titleTh,
          },
        });
        if (!existsPub) {
          await prisma.researchPublication.create({
            data: {
              tenantId: tenant!.id,
              personnelId: personId,
              titleTh: pub.titleTh,
              titleEn: pub.titleEn || null,
              authors: pub.authors,
              journalName: pub.journalName,
              publicationYear: pub.publicationYear,
              tier: pub.tier || null,
              type: pub.type,
              orderIndex: i + 1,
            },
          });
        }
      }
    }

    // 3. Find/Update/Create User login account following Email Rule
    const candidateEmails = Array.from(
      new Set(
        [
          ...(seed.webEmail ? [seed.webEmail.toLowerCase()] : []),
          seed.fallbackMcuEmail.toLowerCase(),
          ...seed.existingUserEmails.map((e) => e.toLowerCase()),
        ].filter(Boolean)
      )
    );

    const nameSearchToken =
      seed.firstNameTh.trim().length <= 4 && seed.lastNameTh
        ? `${seed.firstNameTh} ${seed.lastNameTh}`.trim()
        : seed.firstNameTh.trim();

    const matchingUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { in: candidateEmails } },
          { name: { contains: nameSearchToken } },
          ...(seed.firstNameEn && seed.lastNameEn
            ? [{ name: { contains: seed.lastNameEn, mode: "insensitive" as const } }]
            : []),
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    let primaryUser = matchingUsers[0] || null;
    if (matchingUsers.length > 1) {
      // Prefer the user whose email matches webEmail or fallbackMcuEmail, or has courses
      const preferred =
        matchingUsers.find((u) => seed.webEmail && u.email.toLowerCase() === seed.webEmail.toLowerCase()) ||
        matchingUsers.find((u) => u.email.toLowerCase() === seed.fallbackMcuEmail.toLowerCase()) ||
        matchingUsers[0];
      primaryUser = preferred;
      for (const other of matchingUsers) {
        if (other.id !== primaryUser.id) {
          console.log(`   🔗 Merging duplicate User ${other.email} (${other.name}) -> ${primaryUser.email}`);
          await mergeUserIntoPrimary(primaryUser.id, other.id);
        }
      }
    }

    const deptNameTh =
      seed.departmentCode === "BUDDHISM"
        ? "ภาควิชาพระพุทธศาสนา"
        : seed.departmentCode === "PHILOSOPHY"
        ? "ภาควิชาศาสนาและปรัชญา"
        : "ภาควิชาบาลีและสันสกฤต";

    let finalLoginEmail: string;
    if (primaryUser) {
      if (useWebEmailForLogin && seed.webEmail) {
        finalLoginEmail = seed.webEmail.trim().toLowerCase();
      } else {
        // Do NOT overwrite existing User's email when webEmail is @hotmail/@yahoo or missing
        finalLoginEmail = primaryUser.email;
      }
      primaryUser = await prisma.user.update({
        where: { id: primaryUser.id },
        data: {
          email: finalLoginEmail,
          name: displayNameTh,
          passwordHash,
          positionName: seed.positionTh,
          departmentName: deptNameTh,
          imageUrl: seed.imageUrl || primaryUser.imageUrl,
          emailVerified: true,
          isActive: true,
        },
      });
    } else {
      finalLoginEmail =
        useWebEmailForLogin && seed.webEmail
          ? seed.webEmail.trim().toLowerCase()
          : seed.fallbackMcuEmail.toLowerCase();
      primaryUser = await prisma.user.create({
        data: {
          email: finalLoginEmail,
          name: displayNameTh,
          passwordHash,
          positionName: seed.positionTh,
          departmentName: deptNameTh,
          imageUrl: seed.imageUrl,
          emailVerified: true,
          isActive: true,
          locale: "th",
        },
      });
    }

    // Ensure UserTenant & TEACHER role on primaryUser
    await ensureTeacherRoleOnUser(primaryUser.id, tenant!.id, lecturerRole!.id);

    return {
      personId,
      displayNameTh,
      departmentCode: seed.departmentCode,
      webEmail: seed.webEmail,
      personnelEmail,
      loginEmail: finalLoginEmail,
      userId: primaryUser.id,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // STEP A: Sync Task 1 (6 Pali & Sanskrit Teachers) + Task 2 (9 Executives)
  // ───────────────────────────────────────────────────────────────────────────
  console.log("--- 1. Syncing Faculty Executives (9 people) ---");
  const execResults = [];
  for (const exec of FACULTY_EXECUTIVES) {
    const res = await syncTeacherSeed(exec);
    execResults.push(res);
    console.log(
      `✅ [EXEC] ${res.displayNameTh} -> Dept: ${res.departmentCode} | Personnel.email: ${res.personnelEmail} | Login: ${res.loginEmail}`
    );
  }

  console.log("\n--- 2. Syncing Pali & Sanskrit Department Teachers (6 people) ---");
  const paliResults = [];
  for (const t of PALI_SANSKRIT_TEACHERS) {
    const res = await syncTeacherSeed(t);
    paliResults.push(res);
    console.log(
      `✅ [PALI] ${res.displayNameTh} -> Dept: ${res.departmentCode} | Personnel.email: ${res.personnelEmail} | Login: ${res.loginEmail}`
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // STEP B: Apply Email Rule & Merge Duplicate User Accounts Across ALL Personnel
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n--- 3. Merging Duplicate Lecturer User Accounts (Thai vs English & Duplicate Accounts) ---");

  // Explicit known pairs + automatic matching from Personnel
  const explicitMergePairs: Array<{
    keepEmailMatch: string[];
    mergeEmailMatch: string[];
    firstNameTh: string;
    firstNameEn?: string;
    lastNameEn?: string;
  }> = [
    {
      firstNameTh: "พระมหาไพโรจน์",
      firstNameEn: "Phramaha Phairot",
      lastNameEn: "Yanakusalo",
      keepEmailMatch: ["phairot.yan@mcu.ac.th"],
      mergeEmailMatch: ["t69015@buddhist.mcu.ac.th"],
    },
    {
      firstNameTh: "พระครูปลัดสุขีศม",
      firstNameEn: "Phrakhrupalad Sukhisam",
      lastNameEn: "Silatejaputtiyo",
      keepEmailMatch: ["sukhisam.sil@mcu.ac.th"],
      mergeEmailMatch: ["t69008@buddhist.mcu.ac.th"],
    },
    {
      firstNameTh: "พระมหาวีรเดช",
      firstNameEn: "Phramaha Veeradej",
      lastNameEn: "Adhipanno",
      keepEmailMatch: ["veeradej.adh@mcu.ac.th"],
      mergeEmailMatch: ["t69030@buddhist.mcu.ac.th"],
    },
    {
      firstNameTh: "ธนาธิป",
      firstNameEn: "Dhanardhip",
      lastNameEn: "Hardnualee",
      keepEmailMatch: ["dhanardhip.hard@mcu.ac.th"],
      mergeEmailMatch: ["t69057@buddhist.mcu.ac.th"],
    },
    {
      firstNameTh: "ดวงดี",
      firstNameEn: "Duangdee",
      lastNameEn: "Othasu",
      keepEmailMatch: ["duangdee.oth@mcu.ac.th"],
      mergeEmailMatch: ["t69063@buddhist.mcu.ac.th"],
    },
    {
      firstNameTh: "Ven. W.",
      firstNameEn: "Ven. W.",
      lastNameEn: "Piyaratana",
      keepEmailMatch: ["piyaratana.w@mcu.ac.th"],
      mergeEmailMatch: ["t69066@buddhist.mcu.ac.th"],
    },
    {
      firstNameTh: "พระครูภาวนาวัฒนบัณฑิต",
      firstNameEn: "Phrakru Bhavanavattanabandit",
      lastNameEn: "Vi.",
      keepEmailMatch: ["t69038@buddhist.mcu.ac.th"],
      mergeEmailMatch: ["t69070@buddhist.mcu.ac.th"],
    },
    {
      firstNameTh: "พระมหายงยุทธ",
      firstNameEn: "Phramaha Yongyut",
      lastNameEn: "Dhiradhammo",
      keepEmailMatch: ["yongyut.dhi@mcu.ac.th"],
      mergeEmailMatch: ["t69075@buddhist.mcu.ac.th"],
    },
    {
      firstNameTh: "พระราชญาณวชิรเวที",
      firstNameEn: "Phrarachayanwachirawethi",
      lastNameEn: "",
      keepEmailMatch: ["methi424@gmail.com"],
      mergeEmailMatch: [],
    },
    {
      firstNameTh: "พระจาตุรงค์",
      firstNameEn: "Phra Chaturong",
      lastNameEn: "Acharasubho",
      keepEmailMatch: ["jaturong.choo@mcu.ac.th", "t69051@buddhist.mcu.ac.th"],
      mergeEmailMatch: ["t69051@buddhist.mcu.ac.th"],
    },
  ];

  for (const item of explicitMergePairs) {
    const keepUser = await prisma.user.findFirst({
      where: { email: { in: item.keepEmailMatch } },
    });
    if (!keepUser) continue;

    // If keepEmailMatch[0] is a @gmail.com or @mcu.ac.th and keepUser has a @buddhist.mcu.ac.th email, update it
    const targetEmail = item.keepEmailMatch[0];
    if (isGmailOrMcuDomain(targetEmail) && keepUser.email.toLowerCase() !== targetEmail.toLowerCase()) {
      const conflict = await prisma.user.findFirst({
        where: { email: targetEmail.toLowerCase() },
      });
      if (!conflict) {
        await prisma.user.update({
          where: { id: keepUser.id },
          data: { email: targetEmail.toLowerCase(), passwordHash, isActive: true },
        });
        console.log(`   ✉️ Updated User email ${keepUser.email} -> ${targetEmail.toLowerCase()}`);
      }
    }

    for (const secEmail of item.mergeEmailMatch) {
      const secUser = await prisma.user.findFirst({
        where: { email: secEmail },
      });
      if (secUser && secUser.id !== keepUser.id) {
        console.log(`   🔗 Merging duplicate User ${secUser.email} (${secUser.name}) -> ${keepUser.email}`);
        await mergeUserIntoPrimary(keepUser.id, secUser.id);
      }
    }

    // Also update English names on Personnel if present
    if (item.firstNameEn) {
      const p = await prisma.personnel.findFirst({
        where: { tenantId: tenant.id, firstNameTh: { contains: item.firstNameTh } },
      });
      if (p) {
        await prisma.personnel.update({
          where: { id: p.id },
          data: {
            firstNameTh: p.firstNameTh === "พระมหาไพโรจรน์" ? "พระมหาไพโรจน์" : p.firstNameTh,
            lastNameTh: p.lastNameTh === "ญาณกุศโล" ? "ญาณกุสโล" : p.lastNameTh,
            firstNameEn: item.firstNameEn,
            lastNameEn: item.lastNameEn || "",
          },
        });
      }
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // STEP C: Re-sequence orderIndex in Each of the 3 Academic Departments
  // ensuring the 3 Heads of Department are at orderIndex: 1
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n--- 4. Re-sequencing Department Order Index (Heads of Dept at #1) ---");

  // 1. ภาควิชาพระพุทธศาสนา:
  // #1 พระมหามงคลกานต์ ฐิตธมฺโม (Head of Dept)
  // #2 พระราชอุดมวัชรเมธี (Dean)
  // #3 พระครูสิริรัตนบัณฑิต (Vice Dean Academic)
  // #4 พระมหายุทธนา นรเชฏฺโฐ (Vice Dean Planning)
  // #5 พระมหาขวัญชัย กิตฺติเมธี (PhD Director)
  // followed by remaining teachers in Buddhism in their existing relative order
  const buddhismPersonnel = await prisma.personnel.findMany({
    where: { tenantId: tenant.id, departmentId: deptBuddhism.id },
    orderBy: [{ orderIndex: "asc" }, { firstNameTh: "asc" }],
  });

  const priorityBuddhismNames = [
    "พระมหามงคลกานต์", // #1 Head of Department
    "พระราชอุดมวัชรเมธี", // #2 Dean
    "พระครูสิริรัตนบัณฑิต", // #3 Vice Dean Academic
    "พระมหายุทธนา", // #4 Vice Dean Planning
    "พระมหาขวัญชัย", // #5 Ph.D. Program Director
  ];
  const orderedBuddhism: typeof buddhismPersonnel = [];
  for (const pName of priorityBuddhismNames) {
    const found = buddhismPersonnel.find((p) => p.firstNameTh.includes(pName));
    if (found && !orderedBuddhism.some((o) => o.id === found.id)) {
      orderedBuddhism.push(found);
    }
  }
  for (const p of buddhismPersonnel) {
    if (!orderedBuddhism.some((o) => o.id === p.id) && p.type !== "SUPPORT" && p.type !== "SPECIAL") {
      orderedBuddhism.push(p);
    }
  }
  for (const p of buddhismPersonnel) {
    if (!orderedBuddhism.some((o) => o.id === p.id) && p.type === "SUPPORT") {
      orderedBuddhism.push(p);
    }
  }
  for (let i = 0; i < orderedBuddhism.length; i++) {
    await prisma.personnel.update({
      where: { id: orderedBuddhism[i].id },
      data: { orderIndex: i + 1 },
    });
  }
  const specialInBuddhism = buddhismPersonnel.filter((p) => p.type === "SPECIAL");
  for (let i = 0; i < specialInBuddhism.length; i++) {
    await prisma.personnel.update({
      where: { id: specialInBuddhism[i].id },
      data: { orderIndex: 101 + i },
    });
  }
  console.log(`   ✅ Ordered ${orderedBuddhism.length} members in ภาควิชาพระพุทธศาสนา (#1: ${orderedBuddhism[0]?.firstNameTh})`);

  // 2. ภาควิชาศาสนาและปรัชญา:
  // #1 รศ.ดร.สุเทพ พรมเลิศ (Head of Dept)
  // #2 รศ.ดร.ณัทธีร์ ศรีดี (Vice Dean Admin)
  // followed by remaining teachers in Religion & Philosophy
  const philPersonnel = await prisma.personnel.findMany({
    where: { tenantId: tenant.id, departmentId: deptPhilosophy.id },
    orderBy: [{ orderIndex: "asc" }, { firstNameTh: "asc" }],
  });
  const priorityPhilNames = ["สุเทพ", "ณัทธีร์"];
  const orderedPhil: typeof philPersonnel = [];
  for (const pName of priorityPhilNames) {
    const found = philPersonnel.find((p) => p.firstNameTh.includes(pName));
    if (found && !orderedPhil.some((o) => o.id === found.id)) {
      orderedPhil.push(found);
    }
  }
  for (const p of philPersonnel) {
    if (!orderedPhil.some((o) => o.id === p.id)) {
      orderedPhil.push(p);
    }
  }
  for (let i = 0; i < orderedPhil.length; i++) {
    await prisma.personnel.update({
      where: { id: orderedPhil[i].id },
      data: { orderIndex: i + 1 },
    });
  }
  console.log(`   ✅ Ordered ${orderedPhil.length} members in ภาควิชาศาสนาและปรัชญา (#1: ${orderedPhil[0]?.firstNameTh})`);

  // 3. ภาควิชาบาลีและสันสกฤต:
  // #1 ผศ.ดร.แสวง นิลนามะ (Head of Dept)
  // #2..#7 The 6 teachers from page 9113
  const paliPersonnel = await prisma.personnel.findMany({
    where: { tenantId: tenant.id, departmentId: deptPali.id },
    orderBy: [{ orderIndex: "asc" }, { firstNameTh: "asc" }],
  });
  for (let i = 0; i < paliPersonnel.length; i++) {
    await prisma.personnel.update({
      where: { id: paliPersonnel[i].id },
      data: { orderIndex: i + 1 },
    });
  }
  console.log(`   ✅ Ordered ${paliPersonnel.length} members in ภาควิชาบาลีและสันสกฤต (#1: ${paliPersonnel[0]?.firstNameTh})`);

  // ───────────────────────────────────────────────────────────────────────────
  // STEP D: Task 3 — Create/Update `Personnel` with `type: "SPECIAL"` for
  // Special / Visiting Lecturers (อาจารย์พิเศษ) who have User/Course records
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n--- 5. Populating Special Lecturers (อาจารย์พิเศษ, PersonnelType.SPECIAL) ---");

  const allCurrentPersonnel = await prisma.personnel.findMany({
    where: { tenantId: tenant.id },
  });

  // Get all Users who teach at least 1 course OR are t69xxx lecturer accounts
  const allTeachingUsers = await prisma.user.findMany({
    where: {
      isActive: true,
      OR: [
        { primaryCourses: { some: {} } },
        { taughtCourses: { some: {} } },
        { email: { startsWith: "t69" } },
      ],
    },
    include: {
      primaryCourses: true,
      taughtCourses: { include: { course: true } },
    },
  });

  // Parse a raw instructor display name into academicPosition, firstNameTh, lastNameTh, firstNameEn, lastNameEn, titlePlacement
  function parseInstructorDisplayName(rawName: string) {
    const clean = rawName.trim();
    const isEnglish = /^[A-Za-z.\s,\-]+$/.test(clean);

    if (isEnglish) {
      let rest = clean.replace(/,\s*Ph\.?D\.?$/i, "").trim();
      const hasPhd = /Ph\.?D\.?/i.test(clean);
      let acadEn = "";
      const prefixes = [
        "Assoc. Prof. Dr.",
        "Asst. Prof. Dr.",
        "Assoc. Prof.",
        "Asst. Prof.",
        "Prof. Dr.",
        "Ven. Dr.",
        "Dr.",
      ];
      for (const pre of prefixes) {
        if (rest.toLowerCase().startsWith(pre.toLowerCase())) {
          acadEn = pre;
          rest = rest.slice(pre.length).trim();
          break;
        }
      }
      if (hasPhd && !acadEn.toLowerCase().includes("dr")) {
        acadEn = acadEn ? `${acadEn}, Ph.D.` : "Ph.D.";
      }
      const parts = rest.split(/\s+/);
      let firstNameEn = parts[0] || rest;
      let lastNameEn = parts.slice(1).join(" ");
      if (/^(Phramaha|Phrakhru|Phrakru|Phra|Ven\.?)$/i.test(parts[0]) && parts.length >= 2) {
        firstNameEn = `${parts[0]} ${parts[1]}`;
        lastNameEn = parts.slice(2).join(" ");
      }
      return {
        academicPosition: acadEn.includes("Assoc") ? "รศ.ดร." : acadEn.includes("Asst") ? "ผศ.ดร." : "ดร.",
        academicPositionEn: acadEn || "Dr.",
        titlePlacement: (/^(Phra|Ven)/i.test(firstNameEn) ? "SUFFIX" : "PREFIX") as "PREFIX" | "SUFFIX",
        firstNameTh: firstNameEn,
        lastNameTh: lastNameEn,
        firstNameEn,
        lastNameEn,
      };
    }

    // Thai instructor name: e.g. "พระครูภาวนาวัฒนบัณฑิต วิ., รศ.ดร." or "ผศ.พิเศษ ดร.จุฑารัตน์ ทองอินจันทร์" or "อ.ดร.สันทยา ประภารัตน์"
    if (clean.includes(",")) {
      const [namePart, suffixPart] = clean.split(",").map((s) => s.trim());
      const parts = namePart.split(/\s+/);
      return {
        academicPosition: suffixPart.replace(/^อ\.ดร\./, "ดร.") || "ดร.",
        academicPositionEn: "Dr.",
        titlePlacement: "SUFFIX" as const,
        firstNameTh: parts[0] || namePart,
        lastNameTh: parts.slice(1).join(" "),
        firstNameEn: null,
        lastNameEn: null,
      };
    }

    const prefixList = [
      "รศ.พิเศษ ดร.",
      "ผศ.พิเศษ ดร.",
      "ศ.ดร.",
      "รศ.ดร.",
      "ผศ.ดร.",
      "อ.ดร.",
      "ดร.",
      "รศ.",
      "ผศ.",
      "อ.",
    ];
    let acadTh: string | null = null;
    let rest = clean;
    for (const pre of prefixList) {
      if (rest.startsWith(pre)) {
        acadTh = pre === "อ.ดร." ? "ดร." : pre;
        rest = rest.slice(pre.length).trim();
        break;
      }
    }
    const parts = rest.split(/\s+/);
    const isMonk = /^พระ/.test(parts[0] || "");
    return {
      academicPosition: acadTh,
      academicPositionEn: null,
      titlePlacement: (isMonk ? "SUFFIX" : "PREFIX") as "PREFIX" | "SUFFIX",
      firstNameTh: parts[0] || rest,
      lastNameTh: parts.slice(1).join(" "),
      firstNameEn: null,
      lastNameEn: null,
    };
  }

  let specialOrderIdx = 101;
  let specialCreatedCount = 0;

  // Delete any accidental "ผู้ดูแลระบบ" Personnel record
  await prisma.personnel.deleteMany({
    where: { tenantId: tenant.id, firstNameTh: { contains: "ผู้ดูแลระบบ" } },
  });

  for (const u of allTeachingUsers) {
    if (u.email.toLowerCase().startsWith("admin@") || u.name.includes("ผู้ดูแลระบบ")) continue;
    // Check if this User already corresponds to an existing Personnel record
    const matchedPerson = allCurrentPersonnel.find((p) => {
      if (p.email && p.email.toLowerCase() === u.email.toLowerCase()) return true;
      const uName = u.name.toLowerCase();
      const fTh = p.firstNameTh.trim().toLowerCase();
      const lTh = (p.lastNameTh || "").replace(/[\(\)]/g, "").trim().toLowerCase();
      const fEn = (p.firstNameEn || "").trim().toLowerCase();
      const lEn = (p.lastNameEn || "").trim().toLowerCase();
      if (fTh.length >= 3 && uName.includes(fTh)) {
        if (!lTh || uName.includes(lTh) || fTh.startsWith("พระครู") || fTh.startsWith("พระราช")) return true;
      }
      if (lEn.length >= 4 && uName.includes(lEn)) return true;
      if (fEn.length >= 4 && lEn.length === 0 && uName.includes(fEn)) return true;
      return false;
    });

    if (matchedPerson) continue;

    // Determine department from their courses (e.g. course code prefix)
    const sampleCode =
      u.primaryCourses[0]?.courseCode ||
      u.taughtCourses[0]?.course?.courseCode ||
      "";
    let targetDeptId = deptBuddhism.id;
    if (sampleCode.startsWith("102") || sampleCode.startsWith("602") || sampleCode.startsWith("802") || sampleCode.startsWith("IB")) {
      targetDeptId = deptPhilosophy.id;
    } else if (sampleCode.startsWith("103") || sampleCode.startsWith("104")) {
      targetDeptId = deptPali.id;
    }

    const parsedName = parseInstructorDisplayName(u.name);
    const createdSpecial = await prisma.personnel.create({
      data: {
        tenantId: tenant.id,
        departmentId: targetDeptId,
        academicPosition: parsedName.academicPosition,
        academicPositionEn: parsedName.academicPositionEn,
        titlePlacement: parsedName.titlePlacement,
        firstNameTh: parsedName.firstNameTh,
        lastNameTh: parsedName.lastNameTh,
        firstNameEn: parsedName.firstNameEn,
        lastNameEn: parsedName.lastNameEn,
        positionTh: "อาจารย์พิเศษ / อาจารย์ผู้สอนร่วม คณะพุทธศาสตร์",
        positionEn: "Special / Visiting Lecturer, Faculty of Buddhism",
        type: "SPECIAL",
        email: u.email,
        educationTh: "ผู้ทรงคุณวุฒิและอาจารย์พิเศษประจำรายวิชา คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
        bioTh: "อาจารย์พิเศษและผู้ทรงคุณวุฒิร่วมสอนในหลักสูตรของคณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
        contactInfo: "คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย ต.ลำไทร อ.วังน้อย จ.พระนครศรีอยุธยา 13170",
        orderIndex: specialOrderIdx++,
        isActive: true,
      },
    });
    allCurrentPersonnel.push(createdSpecial);
    specialCreatedCount++;
  }
  console.log(`   ✅ Created ${specialCreatedCount} Special Lecturer (อาจารย์พิเศษ) Personnel records`);

  // ───────────────────────────────────────────────────────────────────────────
  // STEP E: Sync Teaching Courses from Timetables (Both Thai & English Programs)
  // for ALL Personnel Records
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n--- 6. Syncing Teaching Courses (Thai + English Programs) for All Personnel ---");
  const finalPersonnelList = await prisma.personnel.findMany({
    where: { tenantId: tenant.id },
    include: { department: true },
    orderBy: [{ departmentId: "asc" }, { orderIndex: "asc" }],
  });

  let syncedTeachersCount = 0;
  for (const person of finalPersonnelList) {
    const timetableCourses = await findTeacherCoursesFromTimetables(tenant.id, {
      firstNameTh: person.firstNameTh,
      lastNameTh: person.lastNameTh,
      firstNameEn: person.firstNameEn,
      lastNameEn: person.lastNameEn,
      academicPosition: person.academicPosition,
      email: person.email,
    });

    if (timetableCourses.length > 0) {
      const existingParsed =
        person.experiencesTh && person.experiencesTh.trim().startsWith("[")
          ? parseTeachingExperiences(person.experiencesTh, {
              id: person.id,
              firstNameTh: person.firstNameTh,
              lastNameTh: person.lastNameTh,
              firstNameEn: person.firstNameEn,
              lastNameEn: person.lastNameEn,
              departmentName: person.department?.nameTh,
            })
          : [];
      const { merged } = upsertTeachingCourses(existingParsed, timetableCourses);
      await prisma.personnel.update({
        where: { id: person.id },
        data: {
          experiencesTh: JSON.stringify(merged),
        },
      });
      syncedTeachersCount++;
    }
  }
  console.log(`   ✅ Synced teaching courses from timetables for ${syncedTeachersCount} personnel records`);

  console.log("\n================================================================================");
  console.log("🎉 ALL TASKS COMPLETED SUCCESSFULLY!");
  console.log("================================================================================");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
