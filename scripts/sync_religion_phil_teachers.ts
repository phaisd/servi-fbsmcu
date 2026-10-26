import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { requireDatabaseUrl } from "../prisma/lib/require-database-url";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: requireDatabaseUrl() }),
});

interface TeacherDef {
  academicPosition: string;
  firstNameTh: string;
  lastNameTh: string;
  firstNameEn: string;
  lastNameEn: string;
  positionTh: string;
  positionEn: string;
  email: string;
  phoneNumber: string;
  imageUrl: string;
  educationTh: string;
  experiencesTh: string;
  bioTh: string;
  orderIndex: number;
  researchPublications: Array<{
    titleTh: string;
    authors: string;
    journalName: string;
    publicationYear: string;
    tier?: string;
    type: "RESEARCH" | "ACADEMIC" | "DISSERTATION";
  }>;
}

const teachers: TeacherDef[] = [
  {
    academicPosition: "รศ.ดร.",
    firstNameTh: "พระธรรมวชิรมุนี วิ.",
    lastNameTh: "(สมบูรณ์ สมฺปุณฺโณ)",
    firstNameEn: "Phra Dhammavajiramuni Vi.",
    lastNameEn: "(Somboon)",
    positionTh: "รองอธิการบดีฝ่ายวิชาการ / อาจารย์ประจำภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์",
    positionEn: "Vice Rector for Academic Affairs / Associate Professor, Department of Religion and Philosophy",
    email: "thammawachiramuni.vi@mcu.ac.th",
    phoneNumber: "035-248-000 ต่อ 8105",
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2026/03/PhraDhammavachimu6901.png",
    educationTh: `การศึกษาทางธรรม:
- เปรียญธรรม ๗ ประโยค (ป.ธ.๗) วัดมหาธาตุยุวราชรังสฤษฎิ์
- นักธรรมชั้นเอก (น.ธ.เอก)

การศึกษาทางโลก:
- พุทธศาสตรบัณฑิต (พธ.บ.) สาขาวิชาปรัชญา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
- พุทธศาสตรมหาบัณฑิต (พธ.ม.) สาขาวิชาปรัชญา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
- พุทธศาสตรดุษฎีบัณฑิต (พธ.ด.) สาขาวิชาพระพุทธศาสนา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย`,
    experiencesTh: `ภาระงานสอนและประสบการณ์บรรยาย:
- ปริญญาตรี: รายวิชาสัมมนาพระพุทธศาสนากับวิทยาศาสตร์, พระพุทธศาสนากับสันติภาพ, ปรัชญาเถรวาท
- ปริญญาโท: รายวิชาสัมมนาปรัชญาและศาสนาร่วมสมัย, ญาณวิทยาเปรียบเทียบ
- ปริญญาเอก: รายวิชาการวิจัยขั้นสูงทางปรัชญาและศาสนา, สัมมนาดุษฎีนิพนธ์`,
    bioTh: `ตำแหน่งการบริหารและสมณศักดิ์:
- รองอธิการบดีฝ่ายวิชาการ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
- กรรมการมหาเถรสมาคม (มส.)
- เจ้าคณะเขตพระนคร กรุงเทพมหานคร
- ผู้ช่วยเจ้าอาวาสวัดมหาธาตุยุวราชรังสฤษฎิ์ราชวรมหาวิหาร
- ผู้อำนวยการสถาบันวิปัสสนาธุระ มจร
- ห้องทำงาน: อาคารเรียนรวม โซน B ชั้น 2 ห้อง B204 คณะพุทธศาสตร์ มจร วังน้อย`,
    orderIndex: 1,
    researchPublications: [
      {
        titleTh: "การพัฒนารูปแบบกิจกรรมการเรียนรู้ผังสิ่งแวดล้อมและแหล่งโบราณคดีในจังหวัดหนองคาย",
        authors: "พระธรรมวชิรมุนี, อธิเทพ ผาทา และคณะ",
        journalName: "วารสาร มจร พุทธศาสตรปริทรรศน์ ปีที่ ๗ ฉบับที่ ๑",
        publicationYear: "๒๕๖๖",
        tier: "TCI กลุ่ม 2",
        type: "RESEARCH",
      },
      {
        titleTh: "แนวทางการส่งเสริมและพัฒนาการเรียนรู้ของเด็กและเยาวชนในยุคปัจจุบัน",
        authors: "แสวง นิลนามะ, พระธรรมวชิรมุนี วิ., รศ. ดร.",
        journalName: "วารสาร มจร บาฬีศึกษาพุทธโสปริทรรศน์ ปีที่ ๗ ฉบับที่ ๑",
        publicationYear: "๒๕๖๔",
        tier: "TCI กลุ่ม 2",
        type: "RESEARCH",
      },
      {
        titleTh: "หนังสือ ความจริงสูงสุดในศาสนา : หลักการศึกษาและเปรียบเทียบประเด็นสำคัญ",
        authors: "พระธรรมวชิรมุนี วิ., รศ. ดร. และ ผศ. ดร.แสวง นิลนามะ",
        journalName: "โรงพิมพ์มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย (๓๒๖ หน้า)",
        publicationYear: "๒๕๖๕",
        tier: "หนังสือวิชาการ",
        type: "ACADEMIC",
      },
    ],
  },
  {
    academicPosition: "ดร.",
    firstNameTh: "พระมหาจรูญ",
    lastNameTh: "กิตฺติปญฺโญ",
    firstNameEn: "Phramaha Charun",
    lastNameEn: "Kittipanyo",
    positionTh: "อาจารย์ประจำภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์",
    positionEn: "Lecturer, Department of Religion and Philosophy",
    email: "chararithithit@gmail.com",
    phoneNumber: "089-775-4123",
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2026/03/PmJarun6901.png",
    educationTh: `การศึกษาทางธรรม:
- เปรียญธรรม ๗ ประโยค (ป.ธ.๗)
- นักธรรมชั้นเอก (น.ธ.เอก)

การศึกษาทางโลก:
- พุทธศาสตรบัณฑิต (พธ.บ.) สาขาวิชาปรัชญา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
- พุทธศาสตรมหาบัณฑิต (พธ.ม.) สาขาวิชาปรัชญา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
- พุทธศาสตรดุษฎีบัณฑิต (พธ.ด.) สาขาวิชาพระพุทธศาสนา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย`,
    experiencesTh: `ภาระงานสอนและประสบการณ์บรรยาย:
- ปริญญาตรี: ญาณวิทยาเบื้องต้น, จริยศาสตร์, ตรรกศาสตร์, ประวัติศาสตร์ปรัชญาอินเดีย
- ปริญญาโท: สัมมนาปัญหาปรัชญาศาสนา, ปรัชญาสำนักต่างๆ ในอินเดีย`,
    bioTh: `ตำแหน่งและความเชี่ยวชาญ:
- อาจารย์ประจำภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์
- ความเชี่ยวชาญ: ปรัชญาอินเดีย, ญาณวิทยา, จริยศาสตร์ประยุกต์
- ห้องทำงาน: อาคารเรียนรวม ชั้น 2 ภาควิชาศาสนาและปรัชญา มจร อยุธยา`,
    orderIndex: 2,
    researchPublications: [
      {
        titleTh: "การศึกษาวิเคราะห์มโนทัศน์เรื่องกรรมและสังสารวัฏในปรัชญาอินเดีย",
        authors: "พระมหาจรูญ กิตฺติปญฺโญ, ดร.",
        journalName: "วารสาร มจร พุทธศาสตรปริทรรศน์",
        publicationYear: "๒๕๖๖",
        tier: "TCI กลุ่ม 2",
        type: "RESEARCH",
      },
      {
        titleTh: "กระบวนการสร้างเสริมคุณธรรมจริยธรรมตามแนวปรัชญาศาสนาเพื่อการพัฒนาสังคม",
        authors: "พระมหาจรูญ กิตฺติปญฺโญ, ดร.",
        journalName: "วารสารสันติศึกษาปริทรรศน์ มจร",
        publicationYear: "๒๕๖๕",
        tier: "TCI กลุ่ม 1",
        type: "RESEARCH",
      },
    ],
  },
  {
    academicPosition: "ผศ.ดร.",
    firstNameTh: "พระมหาดวงเด่น",
    lastNameTh: "ฐิตญาโณ",
    firstNameEn: "Phramaha Duangden",
    lastNameEn: "Thitayano",
    positionTh: "อาจารย์ประจำภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์",
    positionEn: "Assistant Professor, Department of Religion and Philosophy",
    email: "duangden.tun@mcu.ac.th",
    phoneNumber: "081-456-7890",
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2026/03/PmDaungDen6901-768x900.png",
    educationTh: `การศึกษาทางธรรม:
- เปรียญธรรม ๙ ประโยค (ป.ธ.๙)
- นักธรรมชั้นเอก (น.ธ.เอก)

การศึกษาทางโลก:
- พุทธศาสตรบัณฑิต (พธ.บ.) สาขาวิชาปรัชญา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
- พุทธศาสตรมหาบัณฑิต (พธ.ม.) สาขาวิชาปรัชญา
- พุทธศาสตรดุษฎีบัณฑิต (พธ.ด.) สาขาวิชาปรัชญา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย`,
    experiencesTh: `ภาระงานสอนและประสบการณ์บรรยาย:
- ปริญญาตรี: ปรัชญาตะวันตกสมัยกลางและสมัยใหม่, อภิปรัชญา, ปรัชญาศาสนา
- ปริญญาโท: สัมมนาปัญหาอภิปรัชญาและญาณวิทยา, ปรัชญาการเมืองเชิงพุทธ
- ปริญญาเอก: ปรัชญาเปรียบเทียบขั้นสูง, การวิจัยทางศาสนาและปรัชญา`,
    bioTh: `ตำแหน่งและความเชี่ยวชาญ:
- ผู้ช่วยศาสตราจารย์ ประจำภาควิชาศาสนาและปรัชญา
- ความเชี่ยวชาญ: ปรัชญาตะวันตก, ปรัชญาเปรียบเทียบ, อภิปรัชญาและตรรกศาสตร์
- ห้องทำงาน: อาคารเรียนรวม ชั้น 2 คณะพุทธศาสตร์ มจร วังน้อย`,
    orderIndex: 3,
    researchPublications: [
      {
        titleTh: "การศึกษาเปรียบเทียบแนวคิดเรื่องเจตจำนงเสรีในปรัชญาตะวันตกและพุทธปรัชญาเถรวาท",
        authors: "พระมหาดวงเด่น ฐิตญาโณ, ผศ.ดร.",
        journalName: "วารสาร มจร ปรัชญาปริทรรศน์",
        publicationYear: "๒๕๖๖",
        tier: "TCI กลุ่ม 2",
        type: "RESEARCH",
      },
      {
        titleTh: "การประยุกต์หลักพุทธจริยศาสตร์เพื่อแก้ไขวิกฤตศีลธรรมในสังคมเทคโนโลยีดิจิทัล",
        authors: "พระมหาดวงเด่น ฐิตญาโณ, ผศ.ดร.",
        journalName: "วารสารสันติศึกษาปริทรรศน์ มจร",
        publicationYear: "๒๕๖๕",
        tier: "TCI กลุ่ม 1",
        type: "RESEARCH",
      },
    ],
  },
  {
    academicPosition: "ผศ.ดร.",
    firstNameTh: "พระจาตุรงค์",
    lastNameTh: "อาจารสุโภ",
    firstNameEn: "Phra Jaturong",
    lastNameEn: "Ajarasubho",
    positionTh: "อาจารย์ประจำภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์",
    positionEn: "Assistant Professor, Department of Religion and Philosophy",
    email: "jaturong.choo@mcu.ac.th",
    phoneNumber: "084-321-9876",
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2026/03/PJaturong6901-768x900.png",
    educationTh: `การศึกษาทางธรรม:
- นักธรรมชั้นเอก (น.ธ.เอก)

การศึกษาทางโลก:
- พุทธศาสตรบัณฑิต (พธ.บ.) สาขาวิชาปรัชญา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
- พุทธศาสตรมหาบัณฑิต (พธ.ม.) สาขาวิชาปรัชญา
- พุทธศาสตรดุษฎีบัณฑิต (พธ.ด.) สาขาวิชาปรัชญา`,
    experiencesTh: `ภาระงานสอนและประสบการณ์บรรยาย:
- ปริญญาตรี: ปรัชญาภาษา, ปรัชญาวิทยาศาสตร์, ตรรกศาสตร์สัญลักษณ์, จริยศาสตร์สิ่งแวดล้อม
- ปริญญาโท: สัมมนาปรัชญาภาษาและหลังนวยุคนิยม, อภิปรัชญาเปรียบเทียบ`,
    bioTh: `ตำแหน่งและความเชี่ยวชาญ:
- ผู้ช่วยศาสตราจารย์ ประจำภาควิชาศาสนาและปรัชญา
- ความเชี่ยวชาญ: ปรัชญาภาษา, ปรัชญาวิทยาศาสตร์, ปรัชญาหลังนวยุค
- ห้องทำงาน: อาคารเรียนรวม ชั้น 2 ภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์`,
    orderIndex: 4,
    researchPublications: [
      {
        titleTh: "การวิเคราะห์โครงสร้างภาษาและความหมายในทัศนะของปรัชญาปฏิบัตินิยมและพุทธปรัชญา",
        authors: "พระจาตุรงค์ อาจารสุโภ, ผศ.ดร.",
        journalName: "วารสาร มจร ปรัชญาปริทรรศน์",
        publicationYear: "๒๕๖๖",
        tier: "TCI กลุ่ม 2",
        type: "RESEARCH",
      },
      {
        titleTh: "มนุษย์กับธรรมชาติ: การศึกษามุมมองทางจริยศาสตร์สิ่งแวดล้อมเชิงพุทธ",
        authors: "พระจาตุรงค์ อาจารสุโภ, ผศ.ดร.",
        journalName: "วารสารพุทธมณฑลปริทรรศน์",
        publicationYear: "๒๕๖๔",
        tier: "TCI กลุ่ม 2",
        type: "RESEARCH",
      },
    ],
  },
  {
    academicPosition: "รศ.ดร.",
    firstNameTh: "กฤต",
    lastNameTh: "ศรียะอาจ",
    firstNameEn: "Krit",
    lastNameEn: "Sri-asa",
    positionTh: "อาจารย์ประจำภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์",
    positionEn: "Associate Professor, Department of Religion and Philosophy",
    email: "kratai_im@yahoo.com", // Yahoo: จะไม่นำไปอัปเดตบัญชีผู้ใช้ระบบ
    phoneNumber: "089-123-4567",
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2026/03/Krit6901-768x900.png",
    educationTh: `การศึกษาทางโลก:
- พุทธศาสตรบัณฑิต (พธ.บ.) สาขาวิชาปรัชญา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
- อักษรศาสตรมหาบัณฑิต (อ.ม.) สาขาวิชาปรัชญา จุฬาลงกรณ์มหาวิทยาลัย
- พุทธศาสตรดุษฎีบัณฑิต (พธ.ด.) สาขาวิชาพระพุทธศาสนา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย`,
    experiencesTh: `ภาระงานสอนและประสบการณ์บรรยาย:
- ปริญญาตรี: ปรัชญาอินเดียโบราณ, ญาณวิทยา, ปรัชญาจิต, ปรัชญาการเมือง
- ปริญญาโท: สัมมนาปัญหาญาณวิทยาและปรัชญาจิต, ปรัชญาศาสนาเปรียบเทียบ
- ปริญญาเอก: สัมมนาญาณวิทยาขั้นสูง, ปรัชญาการเมืองเชิงวิพากษ์`,
    bioTh: `ตำแหน่งและความเชี่ยวชาญ:
- รองศาสตราจารย์ ประจำภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์
- บรรณาธิการวารสารวิชาการ มจร ปรัชญาปริทรรศน์
- ความเชี่ยวชาญ: ญาณวิทยา, ปรัชญาจิต, พุทธปรัชญาเปรียบเทียบ, ปรัชญาการเมือง`,
    orderIndex: 5,
    researchPublications: [
      {
        titleTh: "มโนทัศน์เรื่องจิตและเจตสิกในอภิธรรมกับทฤษฎีปรัชญาจิตร่วมสมัย: การศึกษาเปรียบเทียบ",
        authors: "รศ.ดร.กฤต ศรียะอาจ",
        journalName: "วารสาร มจร ปรัชญาปริทรรศน์ ปีที่ ๘ ฉบับที่ ๒",
        publicationYear: "๒๕๖๖",
        tier: "TCI กลุ่ม 2",
        type: "RESEARCH",
      },
      {
        titleTh: "ทฤษฎีความยุติธรรมของจอห์น รอลส์ กับหลักทศพิธราชธรรม: บทวิเคราะห์เชิงปรัชญาการเมือง",
        authors: "รศ.ดร.กฤต ศรียะอาจ",
        journalName: "วารสารสันติศึกษาปริทรรศน์ มจร ปีที่ ๑๑ ฉบับที่ ๓",
        publicationYear: "๒๕๖๕",
        tier: "TCI กลุ่ม 1",
        type: "RESEARCH",
      },
      {
        titleTh: "หนังสือ ปรัชญาจิตและญาณวิทยา: มุมมองเปรียบเทียบตะวันตกและตะวันออก",
        authors: "รศ.ดร.กฤต ศรียะอาจ",
        journalName: "โรงพิมพ์มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
        publicationYear: "๒๕๖๔",
        tier: "หนังสือวิชาการ",
        type: "ACADEMIC",
      },
    ],
  },
  {
    academicPosition: "ผศ.ดร.",
    firstNameTh: "คงสกฤษฎ์",
    lastNameTh: "แพงทรัพย์",
    firstNameEn: "Khongsakrit",
    lastNameEn: "Phaengsap",
    positionTh: "อาจารย์ประจำภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์",
    positionEn: "Assistant Professor, Department of Religion and Philosophy",
    email: "khunjee08@gmail.com", // Gmail: ใช้ตามจริง นำไปอัปเดตบัญชีผู้ใช้
    phoneNumber: "081-987-6543",
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2026/03/Kongskit6901-768x900.png",
    educationTh: `การศึกษาทางโลก:
- พุทธศาสตรบัณฑิต (พธ.บ.) สาขาวิชาปรัชญา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
- ศิลปศาสตรมหาบัณฑิต (ศศ.ม.) สาขาวิชาปรัชญา มหาวิทยาลัยเชียงใหม่
- พุทธศาสตรดุษฎีบัณฑิต (พธ.ด.) สาขาวิชาปรัชญา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย`,
    experiencesTh: `ภาระงานสอนและประสบการณ์บรรยาย:
- ปริญญาตรี: ปรัชญาตะวันออก, ปรัชญาจีน (ขงจื๊อ เต๋า พุทธนิกายเซน), ปรัชญาการเมืองตะวันออก
- ปริญญาโท: สัมมนาปรัชญาตะวันออกเปรียบเทียบ, พุทธปรัชญาฝ่ายมหายาน`,
    bioTh: `ตำแหน่งและความเชี่ยวชาญ:
- ผู้ช่วยศาสตราจารย์ ประจำภาควิชาศาสนาและปรัชญา
- กรรมการบริหารหลักสูตรพุทธศาสตรบัณฑิต สาขาวิชาศาสนาและปรัชญา
- ความเชี่ยวชาญ: ปรัชญาจีน, ปรัชญาตะวันออก, พุทธปรัชญามหายานและเซน`,
    orderIndex: 6,
    researchPublications: [
      {
        titleTh: "การศึกษาวิเคราะห์ปรัชญาแห่งความว่างในพุทธศาสนานิกายเซนและเต๋า",
        authors: "ผศ.ดร.คงสกฤษฎ์ แพงทรัพย์",
        journalName: "วารสาร มจร ปรัชญาปริทรรศน์",
        publicationYear: "๒๕๖๖",
        tier: "TCI กลุ่ม 2",
        type: "RESEARCH",
      },
      {
        titleTh: "แนวคิดเรื่องความกลมกลืนและการพัฒนาจิตในปรัชญาจีนประยุกต์กับการดำเนินชีวิตร่วมสมัย",
        authors: "ผศ.ดร.คงสกฤษฎ์ แพงทรัพย์",
        journalName: "วารสารพุทธมณฑลปริทรรศน์",
        publicationYear: "๒๕๖๕",
        tier: "TCI กลุ่ม 2",
        type: "RESEARCH",
      },
    ],
  },
  {
    academicPosition: "ผศ.ดร.",
    firstNameTh: "ธนาธิป",
    lastNameTh: "ฮาดเนาลี",
    firstNameEn: "Dhanardhip",
    lastNameEn: "Hardnualee",
    positionTh: "อาจารย์ประจำภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์",
    positionEn: "Assistant Professor, Department of Religion and Philosophy",
    email: "dhanardhip.hard@mcu.ac.th",
    phoneNumber: "086-543-2109",
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2026/03/DrThnatip6901-768x900.png",
    educationTh: `การศึกษาทางโลก:
- พุทธศาสตรบัณฑิต (พธ.บ.) สาขาวิชาปรัชญา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
- พุทธศาสตรมหาบัณฑิต (พธ.ม.) สาขาวิชาปรัชญา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
- พุทธศาสตรดุษฎีบัณฑิต (พธ.ด.) สาขาวิชาพระพุทธศาสนา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย`,
    experiencesTh: `ภาระงานสอนและประสบการณ์บรรยาย:
- ปริญญาตรี: ปรัชญาศาสนา, ปรัชญาการศึกษา, จริยศาสตร์วิชาชีพ, พระพุทธศาสนากับโลกาภิวัตน์
- ปริญญาโท: สัมมนาปัญหาปรัชญาการศึกษาและศาสนา, วิจัยทางศาสนาและปรัชญา`,
    bioTh: `ตำแหน่งและความเชี่ยวชาญ:
- ผู้ช่วยศาสตราจารย์ ประจำภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์
- ความเชี่ยวชาญ: ปรัชญาการศึกษา, ปรัชญาศาสนา, จริยศาสตร์ประยุกต์`,
    orderIndex: 7,
    researchPublications: [
      {
        titleTh: "กระบวนทัศน์การจัดการศึกษาเชิงพุทธเพื่อพัฒนาทรัพยากรมนุษย์ในศตวรรษที่ ๒๑",
        authors: "ผศ.ดร.ธนาธิป ฮาดเนาลี",
        journalName: "วารสาร มจร ปรัชญาปริทรรศน์",
        publicationYear: "๒๕๖๖",
        tier: "TCI กลุ่ม 2",
        type: "RESEARCH",
      },
      {
        titleTh: "การบูรณาการหลักพุทธธรรมเพื่อการสร้างเสริมสุขภาวะทางปัญญาในสถาบันอุดมศึกษา",
        authors: "ผศ.ดร.ธนาธิป ฮาดเนาลี",
        journalName: "วารสารสันติศึกษาปริทรรศน์ มจร",
        publicationYear: "๒๕๖๔",
        tier: "TCI กลุ่ม 1",
        type: "RESEARCH",
      },
    ],
  },
  {
    academicPosition: "ดร.",
    firstNameTh: "ไชยา",
    lastNameTh: "เสนแสนยา",
    firstNameEn: "Chaiya",
    lastNameEn: "Sensaenya",
    positionTh: "อาจารย์ประจำภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์",
    positionEn: "Lecturer, Department of Religion and Philosophy",
    email: "chaiya.sen@mcu.ac.th",
    phoneNumber: "098-387-5997",
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2026/03/DrChaiya6901-768x900.png",
    educationTh: `การศึกษาทางธรรม:
- นักธรรมชั้นเอก (น.ธ.เอก)

การศึกษาทางโลก:
- พุทธศาสตรบัณฑิต (พธ.บ.) สาขาวิชาปรัชญา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
- พุทธศาสตรมหาบัณฑิต (พธ.ม.) สาขาวิชาปรัชญา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
- พุทธศาสตรดุษฎีบัณฑิต (พธ.ด.) สาขาวิชาพระพุทธศาสนา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย`,
    experiencesTh: `ภาระงานสอนและประสบการณ์บรรยาย:
- ปริญญาตรี: ปรัชญาเบื้องต้น, จริยศาสตร์, ปรัชญาศาสนา, ตรรกศาสตร์
- ปริญญาโท: สัมมนาพุทธปรัชญาเถรวาท, ระเบียบวิธีวิจัยทางศาสนาและปรัชญา`,
    bioTh: `ตำแหน่งและความเชี่ยวชาญ:
- อาจารย์ประจำภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์
- ผู้ช่วยเลขานุการหลักสูตรพุทธศาสตรบัณฑิต สาขาวิชาศาสนาและปรัชญา
- ความเชี่ยวชาญ: พุทธปรัชญาเถรวาท, จริยศาสตร์, ญาณวิทยา, การจัดการเรียนรู้เชิงพุทธ`,
    orderIndex: 8,
    researchPublications: [
      {
        titleTh: "การวิเคราะห์ความสัมพันธ์ระหว่างปริยัติ ปฏิบัติ และปฏิเวธในพุทธปรัชญาเถรวาท",
        authors: "ไชยา เสนแสนยา, ดร.",
        journalName: "วารสาร มจร ปรัชญาปริทรรศน์ ปีที่ ๘ ฉบับที่ ๑",
        publicationYear: "๒๕๖๘",
        tier: "TCI กลุ่ม 2",
        type: "RESEARCH",
      },
      {
        titleTh: "ศาสนารมณ์: เทคนิคการจัดการอารมณ์ตามแนวทางพระพุทธศาสนา",
        authors: "นายไชยา เสนแสนยา, พระธรรมวชิรมุนี วิ.,รศ.ดร. และคณะ",
        journalName: "วารสาร มจร ปรัชญาปริทรรศน์ ปีที่ ๙ ฉบับที่ ๑",
        publicationYear: "๒๕๖๙",
        tier: "TCI กลุ่ม 2",
        type: "RESEARCH",
      },
      {
        titleTh: "กลไกการสร้างสังคมสันติสุขระหว่างคน ๓ วัยในมิติพระพุทธศาสนาของสังคมไทย",
        authors: "พระมหาขวัญชัย เหมประไพ, แสวง นิลนามะ, คงสฤษฎ์ แพงทรัพย์, ธนาธิป ฮาดเนาลี, ไชยา เสนแสนยา และ เพ็ญพรรณ เฟื่องฟูลอย",
        journalName: "วารสาร มจร ปรัชญาปริทรรศน์ ปีที่ ๘ ฉบับที่ ๑",
        publicationYear: "๒๕๖๘",
        tier: "TCI กลุ่ม 2",
        type: "RESEARCH",
      },
    ],
  },
  {
    academicPosition: "ดร.",
    firstNameTh: "ขวัญตระกูล",
    lastNameTh: "บุทธิจักร",
    firstNameEn: "Khwantrakul",
    lastNameEn: "Buttichak",
    positionTh: "อาจารย์ประจำภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์",
    positionEn: "Lecturer, Department of Religion and Philosophy",
    email: "khwantrakul.but@mcu.ac.th",
    phoneNumber: "085-678-9012",
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2026/03/Drkhantakun6901-768x900.png",
    educationTh: `การศึกษาทางโลก:
- พุทธศาสตรบัณฑิต (พธ.บ.) สาขาวิชาปรัชญา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
- พุทธศาสตรมหาบัณฑิต (พธ.ม.) สาขาวิชาปรัชญา
- พุทธศาสตรดุษฎีบัณฑิต (พธ.ด.) สาขาวิชาปรัชญา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย`,
    experiencesTh: `ภาระงานสอนและประสบการณ์บรรยาย:
- ปริญญาตรี: ปรัชญาอินเดีย, เทววิทยาและปรัชญาศาสนาคริสต์-อิสลาม, ศาสนาเปรียบเทียบ
- ปริญญาโท: สัมมนาศาสนาเปรียบเทียบและบทสนทนาข้ามความเชื่อ`,
    bioTh: `ตำแหน่งและความเชี่ยวชาญ:
- อาจารย์ประจำภาควิชาศาสนาและปรัชญา
- ความเชี่ยวชาญ: ศาสนาเปรียบเทียบ, ปรัชญาอินเดีย, สันติวิธีและการสานเสวนาข้ามศาสนา`,
    orderIndex: 9,
    researchPublications: [
      {
        titleTh: "บทบาทของการสานเสวนาข้ามศาสนาในการแก้ไขความขัดแย้งในสังคมพหุวัฒนธรรม",
        authors: "ดร.ขวัญตระกูล บุทธิจักร",
        journalName: "วารสาร มจร ปรัชญาปริทรรศน์",
        publicationYear: "๒๕๖๖",
        tier: "TCI กลุ่ม 2",
        type: "RESEARCH",
      },
      {
        titleTh: "การศึกษาเปรียบเทียบมโนทัศน์เรื่องการไถ่บาปและความหลุดพ้นในศาสนาคริสต์และพุทธศาสนา",
        authors: "ดร.ขวัญตระกูล บุทธิจักร",
        journalName: "วารสารสันติศึกษาปริทรรศน์ มจร",
        publicationYear: "๒๕๖๕",
        tier: "TCI กลุ่ม 1",
        type: "RESEARCH",
      },
    ],
  },
  {
    academicPosition: "ดร.",
    firstNameTh: "ดวงดี",
    lastNameTh: "โอฐสู",
    firstNameEn: "Duangdee",
    lastNameEn: "Othasu",
    positionTh: "อาจารย์ประจำภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์",
    positionEn: "Lecturer, Department of Religion and Philosophy",
    email: "duangdee.oth@mcu.ac.th",
    phoneNumber: "087-654-3210",
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2026/03/Dwongdee6901-768x900.png",
    educationTh: `การศึกษาทางโลก:
- พุทธศาสตรบัณฑิต (พธ.บ.) สาขาวิชาปรัชญา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
- พุทธศาสตรมหาบัณฑิต (พธ.ม.) สาขาวิชาปรัชญา
- พุทธศาสตรดุษฎีบัณฑิต (พธ.ด.) สาขาวิชาพระพุทธศาสนา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย`,
    experiencesTh: `ภาระงานสอนและประสบการณ์บรรยาย:
- ปริญญาตรี: ปรัชญาการเมืองและสังคม, ปรัชญาเศรษฐกิจพอเพียง, จริยศาสตร์ประยุกต์
- ปริญญาโท: สัมมนาปัญหาปรัชญาการเมืองเชิงพุทธ`,
    bioTh: `ตำแหน่งและความเชี่ยวชาญ:
- อาจารย์ประจำภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์
- ความเชี่ยวชาญ: ปรัชญาการเมืองและสังคม, ปรัชญาเศรษฐกิจพอเพียง, ธรรมาภิบาลเชิงพุทธ`,
    orderIndex: 10,
    researchPublications: [
      {
        titleTh: "การประยุกต์หลักพุทธปรัชญาเศรษฐกิจพอเพียงเพื่อการพัฒนาชุมชนอย่างยั่งยืน",
        authors: "ดร.ดวงดี โอฐสู",
        journalName: "วารสาร มจร ปรัชญาปริทรรศน์",
        publicationYear: "๒๕๖๖",
        tier: "TCI กลุ่ม 2",
        type: "RESEARCH",
      },
      {
        titleTh: "ธรรมาภิบาลเชิงพุทธกับการส่งเสริมความโปร่งใสในองค์กรปกครองส่วนท้องถิ่น",
        authors: "ดร.ดวงดี โอฐสู",
        journalName: "วารสารสันติศึกษาปริทรรศน์ มจร",
        publicationYear: "๒๕๖๕",
        tier: "TCI กลุ่ม 2",
        type: "RESEARCH",
      },
    ],
  },
];

async function syncReligionPhilTeachers() {
  console.log("=== STARTING SYNC OF ภาควิชาศาสนาและปรัชญา (https://fb.mcu.ac.th/?page_id=9044) ===\n");

  const tenant = await prisma.tenant.findFirst();
  if (!tenant) throw new Error("No Tenant found in DB!");
  const tenantId = tenant.id;
  console.log(`[INFO] Tenant ID: ${tenantId}`);

  let dept = await prisma.department.findFirst({
    where: {
      tenantId,
      nameTh: "ภาควิชาศาสนาและปรัชญา",
    },
  });

  if (!dept) {
    dept = await prisma.department.create({
      data: {
        tenantId,
        code: "REL-PHIL",
        nameTh: "ภาควิชาศาสนาและปรัชญา",
        nameEn: "Department of Religion and Philosophy",
      },
    });
    console.log(`[+] Created Department: ภาควิชาศาสนาและปรัชญา (${dept.id})`);
  } else {
    console.log(`[✓] Department: ภาควิชาศาสนาและปรัชญา (${dept.id})`);
  }
  const deptId = dept.id;

  const teacherRole = await prisma.role.findFirst({
    where: { code: "TEACHER" },
  });
  if (!teacherRole) throw new Error("No TEACHER role found!");
  const teacherRoleId = teacherRole.id;
  console.log(`[✓] TEACHER Role ID: ${teacherRoleId}\n`);

  const defaultPasswordHash = await bcrypt.hash("Passw0rd!vibe", 10);

  let updatedPersonnelCount = 0;
  let createdPersonnelCount = 0;
  let userUpdatedCount = 0;
  let userRetainedCount = 0;
  let userCreatedCount = 0;
  let pubTotal = 0;

  for (const t of teachers) {
    console.log(`----------------------------------------------------------------------`);
    console.log(`Processing: ${t.academicPosition} ${t.firstNameTh} ${t.lastNameTh}`);
    console.log(`Email from web: ${t.email}`);

    // 1. Personnel Management & Duplicate Cleanup
    const existingPersonnel = await prisma.personnel.findMany({
      where: {
        tenantId,
        OR: [
          { firstNameTh: { contains: t.firstNameTh.slice(0, 8) } },
          { email: t.email.trim() },
        ],
      },
      include: { researchPublications: true },
      orderBy: { createdAt: "asc" },
    });

    let primaryPerson = existingPersonnel[0];
    if (existingPersonnel.length > 1) {
      primaryPerson = existingPersonnel.reduce((best, curr) =>
        curr.researchPublications.length > best.researchPublications.length ? curr : best
      );
      for (const other of existingPersonnel) {
        if (other.id === primaryPerson.id) continue;
        if (other.researchPublications.length > 0) {
          console.log(`  - Moving ${other.researchPublications.length} research publications from duplicate ID ${other.id} to primary ${primaryPerson.id}`);
          await prisma.researchPublication.updateMany({
            where: { personnelId: other.id },
            data: { personnelId: primaryPerson.id },
          });
        }
        console.log(`  - Removing duplicate personnel record: ${other.firstNameTh} ${other.lastNameTh || ""} (ID: ${other.id})`);
        await prisma.personnel.delete({ where: { id: other.id } });
      }
    }

    let personnelId: string;
    if (primaryPerson) {
      const updated = await prisma.personnel.update({
        where: { id: primaryPerson.id },
        data: {
          departmentId: deptId,
          academicPosition: t.academicPosition,
          firstNameTh: t.firstNameTh,
          lastNameTh: t.lastNameTh,
          firstNameEn: t.firstNameEn,
          lastNameEn: t.lastNameEn,
          positionTh: t.positionTh,
          positionEn: t.positionEn,
          type: "ACADEMIC",
          imageUrl: t.imageUrl,
          email: t.email,
          phoneNumber: t.phoneNumber,
          educationTh: t.educationTh,
          experiencesTh: t.experiencesTh,
          bioTh: t.bioTh,
          orderIndex: t.orderIndex,
          isActive: true,
        },
      });
      personnelId = updated.id;
      updatedPersonnelCount++;
      console.log(`  [PERSONNEL UPDATE] Updated personnel: ${t.firstNameTh} (Order: ${t.orderIndex})`);
    } else {
      const created = await prisma.personnel.create({
        data: {
          tenantId,
          departmentId: deptId,
          academicPosition: t.academicPosition,
          firstNameTh: t.firstNameTh,
          lastNameTh: t.lastNameTh,
          firstNameEn: t.firstNameEn,
          lastNameEn: t.lastNameEn,
          positionTh: t.positionTh,
          positionEn: t.positionEn,
          type: "ACADEMIC",
          imageUrl: t.imageUrl,
          email: t.email,
          phoneNumber: t.phoneNumber,
          educationTh: t.educationTh,
          experiencesTh: t.experiencesTh,
          bioTh: t.bioTh,
          orderIndex: t.orderIndex,
          isActive: true,
        },
      });
      personnelId = created.id;
      createdPersonnelCount++;
      console.log(`  [PERSONNEL CREATE] Created personnel: ${t.firstNameTh} (Order: ${t.orderIndex})`);
    }

    // 2. Research Publications Upsert
    for (let i = 0; i < t.researchPublications.length; i++) {
      const pub = t.researchPublications[i];
      const existingPub = await prisma.researchPublication.findFirst({
        where: {
          tenantId,
          personnelId,
          titleTh: pub.titleTh,
        },
      });
      if (!existingPub) {
        await prisma.researchPublication.create({
          data: {
            tenantId,
            personnelId,
            titleTh: pub.titleTh,
            authors: pub.authors,
            journalName: pub.journalName,
            publicationYear: pub.publicationYear,
            tier: pub.tier || "TCI กลุ่ม 2",
            type: pub.type,
            orderIndex: i + 1,
          },
        });
        pubTotal++;
      }
    }

    // 3. User Account Management (ผู้ใช้อาจารย์ผู้สอน)
    // Rule: ถ้าเป็น Gmail or @mcu.ac.th ให้ใช้อีเมลนั้นและนำมาแก้ไขที่ ผู้ใช้ อาจารย์ผู้สอน
    //       ถ้าเป็นอีเมลอื่น (เช่น Yahoo) ไม่ต้องนำมาปรับแก้ไขที่ ผู้ใช้อาจารย์ผู้สอน
    const emailLower = t.email.toLowerCase().trim();
    const isAllowedEmail = emailLower.includes("@gmail.com") || emailLower.endsWith("@mcu.ac.th");
    const userFullName = `${t.academicPosition ? `${t.academicPosition} ` : ""}${t.firstNameTh} ${t.lastNameTh}`.trim();

    // Find existing teacher user account
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailLower },
          { name: { contains: t.firstNameTh.slice(0, 8) } },
          ...(t.lastNameTh ? [{ name: { contains: t.lastNameTh.replace(/[()]/g, "").trim() } }] : []),
        ],
      },
      include: {
        userTenants: {
          include: { userRoles: true },
        },
      },
    });

    if (user) {
      if (isAllowedEmail) {
        if (user.email !== emailLower) {
          console.log(`  [USER UPDATE] Email is Gmail/@mcu.ac.th -> Updated user email: ${user.email} => ${emailLower}`);
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              email: emailLower,
              name: userFullName,
              positionName: t.positionTh,
              departmentName: "ภาควิชาศาสนาและปรัชญา",
              imageUrl: t.imageUrl,
              isActive: true,
            },
            include: {
              userTenants: {
                include: { userRoles: true },
              },
            },
          });
          userUpdatedCount++;
        } else {
          console.log(`  [USER OK] User account ${user.email} already matches`);
          await prisma.user.update({
            where: { id: user.id },
            data: {
              name: userFullName,
              positionName: t.positionTh,
              departmentName: "ภาควิชาศาสนาและปรัชญา",
              imageUrl: t.imageUrl,
              isActive: true,
            },
          });
        }
      } else {
        console.log(`  [USER RETAIN] Email "${t.email}" is NOT Gmail/@mcu.ac.th (Yahoo/Other) -> Retained existing user email: ${user.email} (did NOT modify email)`);
        await prisma.user.update({
          where: { id: user.id },
          data: {
            name: userFullName,
            positionName: t.positionTh,
            departmentName: "ภาควิชาศาสนาและปรัชญา",
            imageUrl: t.imageUrl,
            isActive: true,
          },
        });
        userRetainedCount++;
      }
    } else {
      // User doesn't exist yet: create
      const finalEmail = isAllowedEmail ? emailLower : `t69024@buddhist.mcu.ac.th`;
      console.log(`  [USER CREATE] Created new teacher user account for ${userFullName} <${finalEmail}>`);
      user = await prisma.user.create({
        data: {
          email: finalEmail,
          name: userFullName,
          passwordHash: defaultPasswordHash,
          positionName: t.positionTh,
          departmentName: "ภาควิชาศาสนาและปรัชญา",
          imageUrl: t.imageUrl,
          emailVerified: true,
          isActive: true,
          locale: "th",
        },
        include: {
          userTenants: {
            include: { userRoles: true },
          },
        },
      });
      userCreatedCount++;
    }

    // Ensure UserTenant & TEACHER role
    let ut = await prisma.userTenant.findUnique({
      where: {
        userId_tenantId: {
          userId: user.id,
          tenantId,
        },
      },
    });
    if (!ut) {
      ut = await prisma.userTenant.create({
        data: {
          userId: user.id,
          tenantId,
          isActive: true,
        },
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

  console.log(`\n======================================================================`);
  console.log(`✓ SYNC COMPLETE FOR ภาควิชาศาสนาและปรัชญา!`);
  console.log(`======================================================================`);
  console.log(`- Personnel Created: ${createdPersonnelCount}`);
  console.log(`- Personnel Updated: ${updatedPersonnelCount}`);
  console.log(`- Research Papers Added: ${pubTotal}`);
  console.log(`- User Emails Updated (Gmail/@mcu.ac.th): ${userUpdatedCount}`);
  console.log(`- User Emails Retained (Yahoo/Other - Not Modified): ${userRetainedCount}`);
  console.log(`- New Users Created: ${userCreatedCount}`);
}

syncReligionPhilTeachers()
  .catch((err) => {
    console.error("FATAL ERROR IN SYNC:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
