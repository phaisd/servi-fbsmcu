import fs from "fs";
import path from "path";
import { prisma } from "../src/shared/lib/infra/prisma";

const STAFF_MEMBERS = [
  {
    firstNameTh: "พระมหาศตนนท",
    lastNameTh: "คมฺภีรเมโธ",
    positionTh: "เจ้าหน้าที่นักจัดการงานทั่วไป / สำนักงานคณบดี",
    positionEn: "General Administrative Officer, Office of the Dean",
    academicPosition: "",
    academicPositionEn: "",
    type: "SUPPORT" as const,
    photoUrl: "https://fb.mcu.ac.th/wp-content/uploads/2022/06/a3st_non.jpg",
    localFileName: "staff_satanon.jpg",
    phoneNumber: "035-248-000",
    officeLocation: "สำนักงานคณบดี คณะพุทธศาสตร์ อาคารสมเด็จพระพุฒาจารย์ (เกี่ยว อุปเสณมหาเถร) อาคารเรียนรวม มจร วังน้อย อยุธยา",
    educationTh: "เปรียญธรรม ๕ ประโยค (ป.ธ.๕)\nพุทธศาสตรบัณฑิต (ภาษาอังกฤษ) (พธ.บ.)",
    bioTh: "ภาระหน้าที่รับผิดชอบ:\n- การจัดทำแผนพัฒนาคณะพุทธศาสตร์\n- จัดทำแผนปฏิบัติการประจำปี\n- งานวิเคราะห์และดำเนินการจัดทำงบประมาณประจำปี\n- งานรายงานสรุปและประเมินผลการปฏิบัติโครงการต่างๆ ของคณะ",
    contactInfo: "สำนักงานคณบดี คณะพุทธศาสตร์ โทร. 035-248-000",
    orderIndex: 1,
  },
  {
    firstNameTh: "พระมหาไพศาล",
    lastNameTh: "วิสาโล",
    positionTh: "เจ้าหน้าที่นักจัดการงานทั่วไป / สำนักงานคณบดี",
    positionEn: "General Administrative Officer (IT & Media), Office of the Dean",
    academicPosition: "",
    academicPositionEn: "",
    type: "SUPPORT" as const,
    photoUrl: "https://fb.mcu.ac.th/wp-content/uploads/2022/06/a3pisarn.jpg",
    localFileName: "staff_pisarn.jpg",
    phoneNumber: "035-248-000",
    officeLocation: "สำนักงานคณบดี คณะพุทธศาสตร์ อาคารสมเด็จพระพุฒาจารย์ (เกี่ยว อุปเสณมหาเถร) อาคารเรียนรวม มจร วังน้อย อยุธยา",
    educationTh: "นักธรรมชั้นเอก, เปรียญธรรม ๓ ประโยค (ป.ธ.๓)\nพุทธศาสตรบัณฑิต (เศรษฐศาสตร์) (พธ.บ.)\nพุทธศาสตรมหาบัณฑิต (ธรรมนิเทศ) (พธ.ม.)",
    bioTh: "ภาระหน้าที่รับผิดชอบ:\n- ดูแลและพัฒนาระบบเว็บไซต์ประจำคณะพุทธศาสตร์\n- งานสารสนเทศและเทคโนโลยีดิจิทัล คณะพุทธศาสตร์\n- งานสื่อสารองค์กรและประชาสัมพันธ์",
    contactInfo: "สำนักงานคณบดี คณะพุทธศาสตร์ โทร. 035-248-000",
    orderIndex: 2,
  },
  {
    firstNameTh: "พระมหาขันทอง",
    lastNameTh: "ถาวโร",
    positionTh: "เจ้าหน้าที่นักจัดการงานทั่วไป / สำนักงานคณบดี",
    positionEn: "General Administrative Officer, Office of the Dean",
    academicPosition: "",
    academicPositionEn: "",
    type: "SUPPORT" as const,
    photoUrl: "https://fb.mcu.ac.th/wp-content/uploads/2025/05/a3knongtong68.png",
    localFileName: "staff_khanthong.png",
    phoneNumber: "035-248-000",
    officeLocation: "สำนักงานคณบดี คณะพุทธศาสตร์ อาคารสมเด็จพระพุฒาจารย์ (เกี่ยว อุปเสณมหาเถร) อาคารเรียนรวม มจร วังน้อย อยุธยา",
    educationTh: "นักธรรมชั้นเอก, เปรียญธรรม ๓ ประโยค (ป.ธ.๓)\nพุทธศาสตรบัณฑิต (พระพุทธศาสนา) (พธ.บ.)\nพุทธศาสตรมหาบัณฑิต (พระไตรปิฎกศึกษา) (พธ.ม.)",
    bioTh: "ภาระหน้าที่รับผิดชอบ:\n- งานจัดการงานทั่วไปและธุรการ สำนักงานคณบดี\n- งานสนับสนุนการจัดการศึกษาและการประชุมคณะ\n- งานประสานงานและบริการคณาจารย์ นิสิต",
    contactInfo: "สำนักงานคณบดี คณะพุทธศาสตร์ โทร. 035-248-000",
    orderIndex: 3,
  },
  {
    firstNameTh: "พีรพงศ์",
    lastNameTh: "โตดี",
    positionTh: "เจ้าหน้าที่นักจัดการงานทั่วไป (งานห้องสมุดคณะพุทธศาสตร์)",
    positionEn: "Library & Information Officer, Faculty of Buddhism Library",
    academicPosition: "นาย",
    academicPositionEn: "Mr.",
    type: "SUPPORT" as const,
    photoUrl: "https://fb.mcu.ac.th/wp-content/uploads/2026/04/a3pirapon69.png",
    localFileName: "staff_peerapong.png",
    phoneNumber: "035-248-000",
    officeLocation: "ห้องสมุดประจำคณะพุทธศาสตร์ อาคารสมเด็จพระพุฒาจารย์ (เกี่ยว อุปเสณมหาเถร) อาคารเรียนรวม มจร วังน้อย อยุธยา",
    educationTh: "ครุศาสตรบัณฑิต (พลศึกษา) (ค.บ.)",
    bioTh: "ภาระหน้าที่รับผิดชอบ:\n- เจ้าหน้าที่ห้องสมุดประจำคณะพุทธศาสตร์\n- งานบริการยืม-คืน ทรัพยากรสารสนเทศและตำราวิชาการ\n- การจัดหมวดหมู่และบำรุงรักษาหนังสือและสื่อการเรียนรู้",
    contactInfo: "ห้องสมุดประจำคณะพุทธศาสตร์ โทร. 035-248-000",
    orderIndex: 4,
  },
  {
    firstNameTh: "วิเชียร",
    lastNameTh: "บัวสำลี",
    positionTh: "เจ้าหน้าที่ธุรการ / สำนักงานคณบดี",
    positionEn: "Administrative & Electronic Document Officer, Office of the Dean",
    academicPosition: "นาย",
    academicPositionEn: "Mr.",
    type: "SUPPORT" as const,
    photoUrl: "https://fb.mcu.ac.th/wp-content/uploads/2025/12/a3Wichan68.jpg",
    localFileName: "staff_wichian.jpg",
    phoneNumber: "035-248-096",
    officeLocation: "สำนักงานคณบดี ชั้น G โซน D อาคารเรียนรวม คณะพุทธศาสตร์ มจร วังน้อย อยุธยา",
    educationTh: "นักธรรมชั้นเอก\nพุทธศาสตรบัณฑิต (วิปัสสนาภาวนา) (พธ.บ.)",
    bioTh: "ภาระหน้าที่รับผิดชอบ:\n- งานสารบรรณและงานเอกสาร เข้า-ออก, รับ-ส่ง ประจำคณะพุทธศาสตร์\n- งานระบบสารบรรณอิเล็กทรอนิกส์ (e-Document) คณะพุทธศาสตร์\n- งานสนับสนุนงานอำนวยการสำนักงานคณบดี",
    contactInfo: "สำนักงานคณบดี ชั้น G โซน D โทร. 035-248-096",
    orderIndex: 5,
  },
];

async function main() {
  const tenants = await prisma.tenant.findMany({ where: { isActive: true } });
  console.log("Syncing staff to all active tenants:", tenants.map(t => `${t.code} (${t.id})`));

  const uploadDir = path.join(process.cwd(), "public", "uploads", "personnel");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  for (const tenant of tenants) {
    const tenantId = tenant.id;
    console.log(`\n--- Tenant ${tenant.code} (${tenantId}) ---`);

    for (const s of STAFF_MEMBERS) {
      const localFilePath = path.join(uploadDir, s.localFileName);
      const publicUrl = `/uploads/personnel/${s.localFileName}`;

      const existing = await prisma.personnel.findFirst({
        where: {
          tenantId,
          firstNameTh: s.firstNameTh,
          lastNameTh: s.lastNameTh,
        },
      });

      const data = {
        tenantId,
        departmentId: null,
        firstNameTh: s.firstNameTh,
        lastNameTh: s.lastNameTh,
        positionTh: s.positionTh,
        positionEn: s.positionEn,
        academicPosition: s.academicPosition || null,
        academicPositionEn: s.academicPositionEn || null,
        titlePlacement: "PREFIX",
        type: s.type,
        imageUrl: fs.existsSync(localFilePath) ? publicUrl : s.photoUrl,
        phoneNumber: s.phoneNumber,
        officeLocation: s.officeLocation,
        educationTh: s.educationTh,
        bioTh: s.bioTh,
        contactInfo: s.contactInfo,
        isActive: true,
        orderIndex: s.orderIndex + 10,
      };

      if (existing) {
        await prisma.personnel.update({
          where: { id: existing.id },
          data,
        });
        console.log(`Updated personnel in ${tenant.code}: ${s.firstNameTh} ${s.lastNameTh}`);
      } else {
        await prisma.personnel.create({
          data,
        });
        console.log(`Created personnel in ${tenant.code}: ${s.firstNameTh} ${s.lastNameTh}`);
      }
    }
  }

  console.log("\nFinished syncing staff.");
}

main().finally(() => prisma.$disconnect());
