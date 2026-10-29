import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { serializeCertificateNote } from "../src/features/certificates";

const prisma = new PrismaClient();

async function main() {
  console.log("=== เริ่มสร้างข้อมูลทดสอบ: นิสิตใหม่ รหัสชั่วคราว (TEMP ID) ===");

  const tenant = await prisma.tenant.findFirst({
    where: { code: "MCU" },
  });
  if (!tenant) throw new Error("ไม่พบ Tenant MCU");

  const staff = await prisma.user.findFirst({
    where: { email: { contains: "staff" } },
  }) || await prisma.user.findFirst();

  if (!staff) throw new Error("ไม่พบ User สำหรับผูกคำร้อง");

  const tempCode = "TEMP-69001";

  // 1. สร้างหรืออัปเดตข้อมูลนิสิตในทะเบียน Student Directory
  const student = await prisma.student.upsert({
    where: { id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d" },
    update: {
      studentCode: tempCode,
      title: "Ven.",
      firstName: "Dhammapala",
      lastName: "Sayadaw",
      yearLevel: 1,
      degree: "ปริญญาตรี",
      curriculumName: "พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา (หลักสูตรภาษาอังกฤษ)",
      department: "ภาควิชาพระพุทธศาสนา",
      major: "Buddhist Studies",
      gender: "บรรพชิต",
      studyStatus: "นิสิตใหม่ (รอออกรหัส)",
      faculty: "คณะพุทธศาสตร์",
      email: `${tempCode.toLowerCase()}@mcu.ac.th`,
      phoneNumber: "081-234-5678",
      nationality: "Myanmar",
      country: "Myanmar",
      address: "MCU Main Campus, Phra Nakhon Si Ayutthaya",
      isActive: true,
    },
    create: {
      id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
      tenantId: tenant.id,
      studentCode: tempCode,
      title: "Ven.",
      firstName: "Dhammapala",
      lastName: "Sayadaw",
      yearLevel: 1,
      degree: "ปริญญาตรี",
      curriculumName: "พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา (หลักสูตรภาษาอังกฤษ)",
      department: "ภาควิชาพระพุทธศาสนา",
      major: "Buddhist Studies",
      gender: "บรรพชิต",
      studyStatus: "นิสิตใหม่ (รอออกรหัส)",
      faculty: "คณะพุทธศาสตร์",
      email: `${tempCode.toLowerCase()}@mcu.ac.th`,
      phoneNumber: "081-234-5678",
      nationality: "Myanmar",
      country: "Myanmar",
      address: "MCU Main Campus, Phra Nakhon Si Ayutthaya",
      isActive: true,
    },
  });

  console.log(`1. สร้างข้อมูลนิสิตในทะเบียนนักศึกษาเรียบร้อย: ${student.studentCode} (${student.title} ${student.firstName} ${student.lastName})`);

  // 2. ค้นหาประเภทหนังสือรับรองที่เหมาะสม (สำหรับขอวีซ่าเข้าประเทศ / หนังสือรับรองการผ่านการคัดเลือก)
  let certType = await prisma.certificateType.findFirst({
    where: {
      tenantId: tenant.id,
      OR: [
        { name: { contains: "คัดเลือก" } },
        { name: { contains: "Visa" } },
        { name: { contains: "สิทธิเข้าศึกษา" } },
      ],
    },
  });

  if (!certType) {
    certType = await prisma.certificateType.findFirst({ where: { tenantId: tenant.id } });
  }

  // 3. สร้างคำร้องในระบบ Certificate Requests
  const meta = {
    applicantType: "NEW_STUDENT" as const,
    studentCode: tempCode,
    fullName: "Ven. Dhammapala Sayadaw",
    passportNo: "ME987654",
    passportExpireDate: "2028-12-31",
    visaType: "Non-Immigrant Visa (ED)",
    classYear: "ปีที่ 1 (First year)",
    degreeLevel: "ป.ตรี (B.A. English Program)",
    major: "Buddhist Studies",
    requestPurpose: "Letter of Acceptance (หนังสือตอบรับเข้าศึกษา)",
    docTemplate: "ENG_CERT" as const,
    language: "In English language" as const,
    age: "25",
    sex: "M" as const,
    nationality: "Myanmar",
    country: "Myanmar",
    email: `${tempCode.toLowerCase()}@mcu.ac.th`,
    docNo: "8002/ 716",
    issueDateEn: "October 29, 2026",
    issueDateTh: "29 เดือน ตุลาคม พ.ศ. 2569",
    academicYearEn: "2026",
    semesterEn: "first semester",
    fontSizePt: 12.5,
    fontFamily: "Times New Roman",
  };

  const noteJson = serializeCertificateNote(meta);

  const certReq = await prisma.certificateRequest.create({
    data: {
      tenantId: tenant.id,
      userId: staff.id,
      certificateTypeId: certType!.id,
      status: "APPROVED",
      note: noteJson,
    },
  });

  console.log(`2. สร้างคำร้องขอหนังสือรับรองทดสอบเรียบร้อย: ID = ${certReq.id}`);
  console.log(`   - รหัสนิสิตชั่วคราว: ${tempCode}`);
  console.log(`   - ชื่อ: Ven. Dhammapala Sayadaw`);
  console.log(`   - พาสปอร์ต: ME987654`);
  console.log(`   - สถานะ: NEW_STUDENT (Letter of Acceptance / Non-ED Visa)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
