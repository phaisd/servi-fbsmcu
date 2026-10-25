import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const MCU_TENANT_ID = "b8eef236-b993-4bc9-a08c-b02935131b84";
const RELIGION_PHIL_DEPT_ID = "45b939e6-1704-478e-b418-bd52ca8091df";
const TEACHER_ROLE_ID = "2c4b9186-f920-4880-8185-8ad08f04593b";

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
    lastNameTh: "อาจารสุโภ (ชูศรี)",
    firstNameEn: "Phra Jaturong",
    lastNameEn: "Ajarasubho (Choosri)",
    positionTh: "อาจารย์ประจำภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์",
    positionEn: "Assistant Professor, Department of Religion and Philosophy",
    email: "jaturong.choo@mcu.ac.th",
    phoneNumber: "086-354-9871",
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2026/03/JATURONG6901.png",
    educationTh: `การศึกษาทางธรรม:
- นักธรรมชั้นเอก (น.ธ.เอก)
- เปรียญธรรม ๔ ประโยค (ป.ธ.๔)

การศึกษาทางโลก:
- พุทธศาสตรบัณฑิต (พธ.บ.) เกียรตินิยมอันดับ ๑ สาขาวิชาปรัชญา มจร
- ศิลปศาสตรมหาบัณฑิต (ศศ.ม.) สาขาวิชาปรัชญา มหาวิทยาลัยรามคำแหง
- พุทธศาสตรดุษฎีบัณฑิต (พธ.ด.) สาขาวิชาปรัชญา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย`,
    experiencesTh: `ภาระงานสอนและประสบการณ์บรรยาย:
- ปริญญาตรี: ศาสนาเปรียบเทียบ, ปรัชญาภาษา, ปรัชญาหลังนวยุค, ศาสนศาสตร์เบื้องต้น
- ปริญญาโท: สัมมนาประเด็นขัดแย้งทางศาสนาในศตวรรษที่ 21, ญาณวิทยาพุทธ
- ปริญญาเอก: สัมมนาดุษฎีนิพนธ์ทางปรัชญาและศาสนา`,
    bioTh: `ตำแหน่งและความเชี่ยวชาญ:
- ผู้ช่วยศาสตราจารย์ ประจำภาควิชาศาสนาและปรัชญา
- กรรมการและเลขานุการหลักสูตรพุทธศาสตรบัณฑิต สาขาวิชาศาสนาและปรัชญา
- ความเชี่ยวชาญ: ศาสนาเปรียบเทียบ, ปรัชญาหลังนวยุค (Postmodernism), พุทธปรัชญา`,
    orderIndex: 4,
    researchPublications: [
      {
        titleTh: "กระบวนทัศน์ทางศาสนาเพื่อการอยู่ร่วมกันในสังคมพหุวัฒนธรรม",
        authors: "พระจาตุรงค์ อาจารสุโภ (ชูศรี), ผศ.ดร.",
        journalName: "วารสาร มจร พุทธปัญญาพาทบทวน",
        publicationYear: "๒๕๖๖",
        tier: "TCI กลุ่ม 1",
        type: "RESEARCH",
      },
      {
        titleTh: "บทบาทของสถาบันศาสนาในการสร้างเสริมสุขภาวะทางปัญญาแก่ชุมชนร่วมสมัย",
        authors: "พระจาตุรงค์ อาจารสุโภ, ผศ.ดร. และคณะ",
        journalName: "วารสาร มจร มนุษยศาสตร์ปริทรรศน์",
        publicationYear: "๒๕๖๕",
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
    lastNameEn: "Sriya-art",
    positionTh: "อาจารย์ประจำภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์",
    positionEn: "Associate Professor, Department of Religion and Philosophy",
    email: "kratai_im@yahoo.com",
    phoneNumber: "089-112-3456",
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2023/10/Krit66.jpg",
    educationTh: `การศึกษา:
- พุทธศาสตรบัณฑิต (พธ.บ.) สาขาวิชาปรัชญา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
- อักษรศาสตรมหาบัณฑิต (อ.ม.) สาขาวิชาปรัชญา จุฬาลงกรณ์มหาวิทยาลัย
- พุทธศาสตรดุษฎีบัณฑิต (พธ.ด.) สาขาวิชาปรัชญา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย`,
    experiencesTh: `ภาระงานสอนและประสบการณ์บรรยาย:
- ปริญญาตรี: ปรัชญาตะวันออก, ปรัชญาจีน (ขงจื๊อและเต๋า), จริยศาสตร์สิ่งแวดล้อม
- ปริญญาโท: สัมมนาปรัชญาตะวันออกเปรียบเทียบ, พุทธปรัชญากับวิกฤตสิ่งแวดล้อมโลก
- ปริญญาเอก: สัมมนาดุษฎีนิพนธ์ขั้นสูงทางปรัชญา`,
    bioTh: `ตำแหน่งและความเชี่ยวชาญ:
- รองศาสตราจารย์ ประจำภาควิชาศาสนาและปรัชญา
- กรรมการผู้ทรงคุณวุฒิประเมินบทความวิชาการระดับชาติ (TCI)
- ความเชี่ยวชาญ: ปรัชญาตะวันออก, ปรัชญาจีน, จริยศาสตร์สิ่งแวดล้อม, พุทธปรัชญาประยุกต์`,
    orderIndex: 5,
    researchPublications: [
      {
        titleTh: "การบูรณาการหลักปรัชญาเต๋ากับพุทธปรัชญาในการอนุรักษ์ระบบนิเวศอย่างยั่งยืน",
        authors: "กฤต ศรียะอาจ, รศ.ดร.",
        journalName: "วารสาร มจร ปรัชญาปริทรรศน์",
        publicationYear: "๒๕๖๖",
        tier: "TCI กลุ่ม 2",
        type: "RESEARCH",
      },
      {
        titleTh: "วิเคราะห์มโนทัศน์ความยุติธรรมทางสังคมในปรัชญาตะวันออก",
        authors: "กฤต ศรียะอาจ, รศ.ดร.",
        journalName: "วารสารสันติศึกษาปริทรรศน์ มจร",
        publicationYear: "๒๕๖๔",
        tier: "TCI กลุ่ม 1",
        type: "RESEARCH",
      },
    ],
  },
  {
    academicPosition: "ผศ.ดร.",
    firstNameTh: "คงสกฤษฎ์",
    lastNameTh: "แพงทรัพย์",
    firstNameEn: "Kongsakrit",
    lastNameEn: "Phaengsap",
    positionTh: "อาจารย์ประจำภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์",
    positionEn: "Assistant Professor, Department of Religion and Philosophy",
    email: "khunjee08@gmail.com",
    phoneNumber: "085-889-9112",
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2026/03/DrKongSrit6901-768x1167.png",
    educationTh: `การศึกษา:
- พุทธศาสตรบัณฑิต (พธ.บ.) สาขาวิชาปรัชญา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
- ศิลปศาสตรมหาบัณฑิต (ศศ.ม.) สาขาวิชาปรัชญา มหาวิทยาลัยเชียงใหม่
- พุทธศาสตรดุษฎีบัณฑิต (พธ.ด.) สาขาวิชาปรัชญา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย`,
    experiencesTh: `ภาระงานสอนและประสบการณ์บรรยาย:
- ปริญญาตรี: ปรัชญาการเมือง, ตรรกศาสตร์สัญลักษณ์, ปรัชญาเศรษฐกิจพอเพียง
- ปริญญาโท: สัมมนาปรัชญาสังคมและการเมืองร่วมสมัย`,
    bioTh: `ตำแหน่งและความเชี่ยวชาญ:
- ผู้ช่วยศาสตราจารย์ ประจำภาควิชาศาสนาและปรัชญา
- ความเชี่ยวชาญ: ปรัชญาการเมือง, พุทธปรัชญาสังคม, ปรัชญาเศรษฐกิจพอเพียง`,
    orderIndex: 6,
    researchPublications: [
      {
        titleTh: "มโนทัศน์เรื่องรัฐในอุดมคติตามแนวพุทธปรัชญาการเมืองเปรียบเทียบกับปรัชญาตะวันตก",
        authors: "คงสกฤษฎ์ แพงทรัพย์, ผศ.ดร.",
        journalName: "วารสาร มจร พุทธศาสตรปริทรรศน์",
        publicationYear: "๒๕๖๖",
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
    lastNameEn: "Hardnaolee",
    positionTh: "อาจารย์ประจำภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์",
    positionEn: "Assistant Professor, Department of Religion and Philosophy",
    email: "dhanardhip.hard@mcu.ac.th",
    phoneNumber: "087-654-3210",
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2026/03/DrDipsig6901.png",
    educationTh: `การศึกษา:
- พุทธศาสตรบัณฑิต (พธ.บ.) สาขาวิชาปรัชญา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
- พุทธศาสตรมหาบัณฑิต (พธ.ม.) สาขาวิชาปรัชญา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
- พุทธศาสตรดุษฎีบัณฑิต (พธ.ด.) สาขาวิชาปรัชญา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย`,
    experiencesTh: `ภาระงานสอนและประสบการณ์บรรยาย:
- ปริญญาตรี: ประวัติศาสตร์ศาสนา, ศาสนายิวและอิสลาม, ศาสนาพราหมณ์-ฮินดู, ศาสนาศึกษา
- ปริญญาโท: การเสวนาทางศาสนธรรมและสันติภาพ`,
    bioTh: `ตำแหน่งและความเชี่ยวชาญ:
- ผู้ช่วยศาสตราจารย์ ประจำภาควิชาศาสนาและปรัชญา
- ความเชี่ยวชาญ: ศาสนาเปรียบเทียบ, ศาสนาอิสลามศึกษา, ศาสนาพราหมณ์-ฮินดู, ศาสนเสวนา`,
    orderIndex: 7,
    researchPublications: [
      {
        titleTh: "กระบวนการสร้างสัมพันธภาพระหว่างศาสนิกเพื่อสันติสุขในชุมชนพหุวัฒนธรรม",
        authors: "ธนาธิป ฮาดเนาลี, ผศ.ดร.",
        journalName: "วารสาร มจร สันติศึกษาปริทรรศน์",
        publicationYear: "๒๕๖๕",
        tier: "TCI กลุ่ม 1",
        type: "RESEARCH",
      },
    ],
  },
  {
    academicPosition: "อาจารย์, ดร.",
    firstNameTh: "ไชยา",
    lastNameTh: "เสนแสนยา",
    firstNameEn: "Chaiya",
    lastNameEn: "Sensaenya",
    positionTh: "อาจารย์ประจำภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์",
    positionEn: "Lecturer, Department of Religion and Philosophy",
    email: "chaiya.sen@mcu.ac.th",
    phoneNumber: "084-321-9876",
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2025/09/a3DrChaiya68-768x947.jpg",
    educationTh: `การศึกษา:
- พุทธศาสตรบัณฑิต (พธ.บ.) สาขาวิชาศาสนาและปรัชญา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
- พุทธศาสตรมหาบัณฑิต (พธ.ม.) สาขาวิชาปรัชญา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
- พุทธศาสตรดุษฎีบัณฑิต (พธ.ด.) สาขาวิชาปรัชญา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย`,
    experiencesTh: `ภาระงานสอนและประสบการณ์บรรยาย:
- ปริญญาตรี: พุทธปรัชญา, ญาณวิทยา, มนุษย์กับศาสนา, ปรัชญาเศรษฐกิจพอเพียง
- ปริญญาโท: ระเบียบวิธีวิจัยทางปรัชญาและศาสนา`,
    bioTh: `ตำแหน่งและความเชี่ยวชาญ:
- อาจารย์ประจำหลักสูตรพุทธศาสตรบัณฑิต สาขาวิชาศาสนาและปรัชญา
- เลขานุการภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์
- ความเชี่ยวชาญ: พุทธปรัชญา, ญาณวิทยา, จริยศาสตร์ประยุกต์`,
    orderIndex: 8,
    researchPublications: [
      {
        titleTh: "กระบวนการสร้างเสริมปัญญาและคุณธรรมในสังคมร่วมสมัยตามแนวพุทธปรัชญา",
        authors: "ไชยา เสนแสนยา, ดร.",
        journalName: "วารสาร มจร ปรัชญาปริทรรศน์",
        publicationYear: "๒๕๖๖",
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
    lastNameEn: "Butthichak",
    positionTh: "อาจารย์ประจำภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์",
    positionEn: "Lecturer, Department of Religion and Philosophy",
    email: "khwantrakul.but@mcu.ac.th",
    phoneNumber: "089-445-6677",
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2026/10/a3Drkhantakun69-1.jpg",
    educationTh: `การศึกษา:
- พุทธศาสตรบัณฑิต (พธ.บ.) สาขาวิชาปรัชญา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
- พุทธศาสตรมหาบัณฑิต (พธ.ม.) สาขาวิชาปรัชญา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
- พุทธศาสตรดุษฎีบัณฑิต (พธ.ด.) สาขาวิชาปรัชญา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย`,
    experiencesTh: `ภาระงานสอนและประสบการณ์บรรยาย:
- ปริญญาตรี: ปรัชญากรีกโบราณ, จริยศาสตร์วิชาชีพ, มนุษย์กับศิลปวิทยาการ, ปรัชญาศาสนาคริสต์
- ปริญญาโท: ปรัชญาจิตวิทยาและวิทยาศาสตร์ทางพุทธ`,
    bioTh: `ตำแหน่งและความเชี่ยวชาญ:
- อาจารย์ประจำภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์
- ความเชี่ยวชาญ: ปรัชญากรีกโบราณ, ศาสนาคริสต์ศึกษา, จริยศาสตร์ประยุกต์`,
    orderIndex: 9,
    researchPublications: [
      {
        titleTh: "การศึกษาวิเคราะห์มโนทัศน์เรื่องความรักและความเมตตาในปรัชญาศาสนาคริสต์และพุทธศาสนา",
        authors: "ขวัญตระกูล บุทธิจักร, ดร.",
        journalName: "วารสาร มจร มนุษยศาสตร์ปริทรรศน์",
        publicationYear: "๒๕๖๖",
        tier: "TCI กลุ่ม 2",
        type: "RESEARCH",
      },
    ],
  },
  {
    academicPosition: "ดร.",
    firstNameTh: "ดวงดี",
    lastNameTh: "โอฐสู",
    firstNameEn: "Duangdee",
    lastNameEn: "Othsoo",
    positionTh: "อาจารย์ประจำภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์",
    positionEn: "Lecturer, Department of Religion and Philosophy",
    email: "duangdee.oth@mcu.ac.th",
    phoneNumber: "081-998-7766",
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2025/12/a3Dwongdee68.jpg",
    educationTh: `การศึกษา:
- พุทธศาสตรบัณฑิต (พธ.บ.) สาขาวิชาพระพุทธศาสนา (ภาคภาษาอังกฤษ) มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
- พุทธศาสตรมหาบัณฑิต (พธ.ม.) สาขาวิชาพระพุทธศาสนา (Buddhist Studies) ภาคภาษาอังกฤษ มจร
- พุทธศาสตรดุษฎีบัณฑิต (พธ.ด.) สาขาวิชาพระพุทธศาสนา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย`,
    experiencesTh: `ภาระงานสอนและประสบการณ์บรรยาย:
- ปริญญาตรี (ภาคภาษาอังกฤษและไทย): ปรัชญาหลังนวยุค, พุทธปรัชญากับปัญหาสังคมร่วมสมัย, สัมมนาปัญหาปรัชญา
- ปริญญาโท: ปรัชญากับการพัฒนาทรัพยากรมนุษย์, ภาษาอังกฤษสำหรับนักปรัชญา`,
    bioTh: `ตำแหน่งและความเชี่ยวชาญ:
- เจ้าหน้าที่ประสานงานและอาจารย์ประจำหลักสูตรพุทธศาสตรบัณฑิต ภาคภาษาอังกฤษ
- อาจารย์ประจำภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์
- สำนักงานศูนย์บัณฑิตศึกษา ชั้น 3 โซน D มจร อยุธยา
- ความเชี่ยวชาญ: พุทธปรัชญาสังคม, ปรัชญาการศึกษา, ปรัชญาร่วมสมัย`,
    orderIndex: 10,
    researchPublications: [
      {
        titleTh: "แนวทางการประยุกต์หลักพุทธปรัชญาเพื่อการพัฒนาคุณค่าชีวิตมนุษย์ในสังคมดิจิทัล",
        authors: "ดวงดี โอฐสู, ดร.",
        journalName: "วารสาร มจร พุทธศาสตรปริทรรศน์",
        publicationYear: "๒๕๖๖",
        tier: "TCI กลุ่ม 2",
        type: "RESEARCH",
      },
    ],
  },
];

async function syncReligionPhilTeachers() {
  console.log("=== Starting Sync for ภาควิชาศาสนาและปรัชญา (10 Teachers) ===");

  // 1. Clean up duplicate seed records from demo tenant
  try {
    const seedDups = await prisma.personnel.findMany({
      where: {
        id: { in: ["a1111111-2222-3333-4444-555555555501", "a1111111-2222-3333-4444-555555555502"] }
      }
    });
    for (const dup of seedDups) {
      await prisma.researchPublication.deleteMany({ where: { personnelId: dup.id } });
      await prisma.personnel.delete({ where: { id: dup.id } });
      console.log(`Deleted demo seed duplicate ${dup.id} (${dup.firstNameTh})`);
    }
  } catch (e) {
    console.warn("Notice during seed cleanup:", e);
  }

  const defaultPasswordHash = await bcrypt.hash("Mcu@2026", 12);

  let createdCount = 0;
  let updatedCount = 0;
  let userCount = 0;
  let pubTotal = 0;

  for (const t of teachers) {
    // Check if teacher already exists by firstNameTh and departmentId or MCU tenant
    const existing = await prisma.personnel.findFirst({
      where: {
        tenantId: MCU_TENANT_ID,
        firstNameTh: { contains: t.firstNameTh.trim() },
      },
      include: { researchPublications: true }
    });

    let personnelId: string;

    if (existing) {
      // Update existing record
      const updated = await prisma.personnel.update({
        where: { id: existing.id },
        data: {
          departmentId: RELIGION_PHIL_DEPT_ID,
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
        }
      });
      personnelId = updated.id;
      updatedCount++;
      console.log(`[UPDATE] Updated existing personnel: ${t.academicPosition} ${t.firstNameTh} ${t.lastNameTh} (order: ${t.orderIndex})`);
    } else {
      // Create new personnel record
      const created = await prisma.personnel.create({
        data: {
          tenantId: MCU_TENANT_ID,
          departmentId: RELIGION_PHIL_DEPT_ID,
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
        }
      });
      personnelId = created.id;
      createdCount++;
      console.log(`[CREATE] Created new personnel: ${t.academicPosition} ${t.firstNameTh} ${t.lastNameTh} (order: ${t.orderIndex})`);
    }

    // 2. Ensure Teacher User Account exists
    const userEmail = t.email.toLowerCase().trim();
    let user = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    const userFullName = `${t.academicPosition ? `${t.academicPosition} ` : ""}${t.firstNameTh} ${t.lastNameTh}`.trim();

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: userEmail,
          name: userFullName,
          passwordHash: defaultPasswordHash,
          positionName: t.positionTh,
          departmentName: "ภาควิชาศาสนาและปรัชญา",
          imageUrl: t.imageUrl,
          emailVerified: true,
          isActive: true,
          locale: "th",
        }
      });
      userCount++;
      console.log(`  [USER] Created user account for ${userEmail}`);
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          name: userFullName,
          positionName: t.positionTh,
          departmentName: "ภาควิชาศาสนาและปรัชญา",
          imageUrl: t.imageUrl,
          isActive: true,
        }
      });
    }

    // 3. Ensure UserTenant link and UserRole with TEACHER role
    let ut = await prisma.userTenant.findUnique({
      where: {
        userId_tenantId: {
          userId: user.id,
          tenantId: MCU_TENANT_ID,
        }
      }
    });

    if (!ut) {
      ut = await prisma.userTenant.create({
        data: {
          userId: user.id,
          tenantId: MCU_TENANT_ID,
          isActive: true,
        }
      });
      console.log(`  [TENANT] Linked user ${userEmail} to MCU tenant`);
    }

    const ur = await prisma.userRole.findFirst({
      where: {
        userTenantId: ut.id,
        roleId: TEACHER_ROLE_ID,
      }
    });

    if (!ur) {
      await prisma.userRole.create({
        data: {
          userTenantId: ut.id,
          roleId: TEACHER_ROLE_ID,
          scopeType: "ALL",
        }
      });
      console.log(`  [ROLE] Assigned TEACHER role to ${userEmail}`);
    }

    // 4. Upsert research publications
    for (let i = 0; i < t.researchPublications.length; i++) {
      const pub = t.researchPublications[i];
      const existingPub = await prisma.researchPublication.findFirst({
        where: {
          tenantId: MCU_TENANT_ID,
          personnelId,
          titleTh: pub.titleTh,
        }
      });

      if (!existingPub) {
        await prisma.researchPublication.create({
          data: {
            tenantId: MCU_TENANT_ID,
            personnelId,
            titleTh: pub.titleTh,
            authors: pub.authors,
            journalName: pub.journalName,
            publicationYear: pub.publicationYear,
            tier: pub.tier || "TCI กลุ่ม 2",
            type: pub.type,
            orderIndex: i + 1,
          }
        });
        pubTotal++;
      }
    }
  }

  console.log(`\n=== SYNC SUMMARY ===`);
  console.log(`Created Personnel: ${createdCount}`);
  console.log(`Updated Personnel: ${updatedCount}`);
  console.log(`Created Teacher Users: ${userCount}`);
  console.log(`Total New Research Papers: ${pubTotal}`);
}

syncReligionPhilTeachers().finally(() => prisma.$disconnect());
