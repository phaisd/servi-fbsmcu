import { z } from "zod";

export const CERTIFICATE_TEMPLATE_TYPES = [
  "THAI_CERT",
  "ENG_CERT",
  "BANK_LETTER",
  "RESIDENCE_MEMO",
] as const;

export type CertificateTemplateType = (typeof CERTIFICATE_TEMPLATE_TYPES)[number];

export const CERTIFICATE_PURPOSES = [
  {
    value: "Open Bank Account (เปิดบัญชีธนาคาร)",
    labelTh: "เปิดบัญชีธนาคาร (Open Bank Account)",
    labelEn: "Open Bank Account",
    purposePhraseTh: "สำหรับการเปิดบัญชีธนาคารหรือทำธุรกรรมกับธนาคาร (Opening a Bank Account and/or Conducting Banking Transactions)",
    defaultTemplate: "THAI_CERT" as CertificateTemplateType,
  },
  {
    value: "Mobile Banking (เปิดใช้งานแอปพลิเคชันธนาคาร)",
    labelTh: "เปิดใช้งาน/อัพเดตแอปธนาคาร (Mobile Banking)",
    labelEn: "Mobile Banking Application",
    purposePhraseTh: "สำหรับการเปิดบัญชีธนาคารและเปิดใช้งานแอบพิเคชั่นของธนาคาร (Mobile Banking)",
    defaultTemplate: "BANK_LETTER" as CertificateTemplateType,
  },
  {
    value: "Extension for Visa (ต่อวีซ่า)",
    labelTh: "ขอต่ออายุวีซ่า (Extension for Visa)",
    labelEn: "Extension for Visa",
    purposePhraseTh: "สำหรับต่ออายุ Visa (การตรวจลงตรา)",
    defaultTemplate: "THAI_CERT" as CertificateTemplateType,
  },
  {
    value: "Visa to Thailand",
    labelTh: "ขอวีซ่าเข้าประเทศไทย (Visa to Thailand)",
    labelEn: "Visa to Thailand",
    purposePhraseTh: "สำหรับขอรับการตรวจลงตรา (Visa) เข้าประเทศไทย",
    defaultTemplate: "ENG_CERT" as CertificateTemplateType,
  },
  {
    value: "Cancellation Visa (ยกเลิกวีซ่า)",
    labelTh: "ขอยกเลิกวีซ่า (Cancellation Visa)",
    labelEn: "Cancellation of Visa",
    purposePhraseTh: "สำหรับขอยกเลิกวีซ่า",
    defaultTemplate: "THAI_CERT" as CertificateTemplateType,
  },
  {
    value: "Requisting for Domistory (ขอหอพักนิสิต)",
    labelTh: "ขอเข้าพักในหอพักนิสิต (Student's Dormitory)",
    labelEn: "Requesting for Student's Dormitory",
    purposePhraseTh: "สำหรับขอพักอยู่ในหอพักนิสิต (Student's Dormitory)",
    defaultTemplate: "THAI_CERT" as CertificateTemplateType,
  },
  {
    value: "Residence Certificate (ขอรับรองที่อยู่)",
    labelTh: "ขอความอนุเคราะห์ออกหนังสือรับรองที่อยู่ (Residence Certificate)",
    labelEn: "Residence Certificate (for Immigration)",
    purposePhraseTh: "เพื่อเป็นเอกสารประกอบการขออนุญาตพำนักในราชอาณาจักรชั่วคราว",
    defaultTemplate: "RESIDENCE_MEMO" as CertificateTemplateType,
  },
  {
    value: "Bonafide Certificate (ความเป็นนิสิต)",
    labelTh: "รับรองสถานภาพความเป็นนิสิต (Bonafide Student Certificate)",
    labelEn: "Bonafide Student Certificate",
    purposePhraseTh: "สำหรับรับรองสถานภาพความเป็นนิสิต",
    defaultTemplate: "THAI_CERT" as CertificateTemplateType,
  },
  {
    value: "Graduation Certificate (รับรองจบ)",
    labelTh: "รับรองการสำเร็จการศึกษา (Graduation Certificate)",
    labelEn: "Graduation Certificate",
    purposePhraseTh: "สำหรับรับรองการสำเร็จการศึกษา",
    defaultTemplate: "ENG_CERT" as CertificateTemplateType,
  },
  {
    value: "Scholarships (ทุนการศึกษา)",
    labelTh: "ขอรับทุนการศึกษา (Scholarships)",
    labelEn: "Scholarships Application",
    purposePhraseTh: "สำหรับประกอบการขอรับทุนการศึกษา",
    defaultTemplate: "THAI_CERT" as CertificateTemplateType,
  },
  {
    value: "Renew Passport (เปลี่ยนหนังสือเดินทางใหม่)",
    labelTh: "ขอทำหนังสือเดินทางเล่มใหม่ (Renew Passport)",
    labelEn: "Renew Passport",
    purposePhraseTh: "สำหรับการขอทำหนังสือเดินทางเล่มใหม่ (Renew Passport)",
    defaultTemplate: "ENG_CERT" as CertificateTemplateType,
  },
] as const;

export const certificateMetadataSchema = z.object({
  seqNo: z.number().optional(),
  studentCode: z.string().trim().default(""),
  fullName: z.string().trim().default(""),
  age: z.string().trim().optional().default(""),
  sex: z.string().trim().optional().default("M"),
  nationality: z.string().trim().optional().default(""),
  country: z.string().trim().optional().default(""),
  passportNo: z.string().trim().optional().default(""),
  passportExpireDate: z.string().trim().optional().default(""),
  visaType: z.string().trim().optional().default("Non-Immigrant Visa"),
  visaExpireDate: z.string().trim().optional().default(""),
  classYear: z.string().trim().optional().default("ปีที่ 1 (First year)"),
  degreeLevel: z.string().trim().optional().default("ป.ตรี (B.A. English Program)"),
  major: z.string().trim().optional().default("Buddhist Studies"),
  requestPurpose: z.string().trim().default("Bonafide Certificate (ความเป็นนิสิต)"),
  language: z.enum(["In Thai language", "In English language"]).default("In Thai language"),
  gpa: z.string().trim().optional().default(""),
  email: z.string().trim().optional().default(""),
  phone: z.string().trim().optional().default(""),
  addressLine: z.string().trim().optional().default(""),
  subdistrict: z.string().trim().optional().default(""),
  district: z.string().trim().optional().default(""),
  province: z.string().trim().optional().default(""),
  postalCode: z.string().trim().optional().default(""),
  fullAddress: z.string().trim().optional().default(""),
  passportCopyUrl: z.string().trim().optional().default(""),
  registrationPdfUrl: z.string().trim().optional().default(""),
  paymentPdfUrl: z.string().trim().optional().default(""),
  userNote: z.string().trim().optional().default(""),

  // ข้อมูลการออกเอกสารสำหรับ Admin
  docTemplate: z.enum(CERTIFICATE_TEMPLATE_TYPES).optional(),
  docNo: z.string().trim().optional().default("8002 / 710"),
  issueDateTh: z.string().trim().optional().default(""),
  issueDateEn: z.string().trim().optional().default(""),
  academicYearEn: z.string().trim().optional().default("2026"),
  semesterEn: z.string().trim().optional().default("second semester"),
  bankTargetTh: z.string().trim().optional().default("ผู้จัดการธนาคารกรุงไทย สาขาโลตัส นวนคร"),
  bankActionTh: z.string().trim().optional().default("อัพเดตการใช้ Mobile Banking ให้แก่นิสิต"),
  coordinatorNameTh: z.string().trim().optional().default("นายดวงดี โอฐสู"),
  coordinatorPhoneTh: z.string().trim().optional().default("089-516-7544 / 095-470-7849"),
  signerNameTh: z.string().trim().optional().default("(พระครูสิริรัตนบัณฑิต, ผศ.ดร.)"),
  signerTitleTh: z.string().trim().optional().default("รักษาการแทนรองคณบดีฝ่ายวิชาการ คณะพุทธศาสตร์"),
  signerNameEn: z.string().trim().optional().default("(Asst. Prof. Phrakhru Sirirattanabundit, Ph.D.)"),
  signerTitleEn: z.string().trim().optional().default("Vice Dean, Faculty of Buddhism"),
  customBodyText: z.string().optional().default(""),
  showSignatureGraphic: z.boolean().optional().default(true),
  showPhotoBox: z.boolean().optional().default(true),
  fontSizePt: z.number().min(10).max(28).optional(),
  lineHeight: z.number().min(1.1).max(3.0).optional().default(1.85),
  marginTopMm: z.number().min(10).max(60).optional().default(24),
  marginSideMm: z.number().min(10).max(50).optional().default(25),
});

export type CertificateRequestMetadata = z.infer<typeof certificateMetadataSchema>;

export function parseCertificateNote(rawNote?: string | null): CertificateRequestMetadata {
  if (!rawNote) {
    return certificateMetadataSchema.parse({});
  }
  try {
    const parsed = JSON.parse(rawNote);
    if (parsed && typeof parsed === "object") {
      return certificateMetadataSchema.parse(parsed);
    }
  } catch {
    // Plain text legacy note
  }
  return certificateMetadataSchema.parse({ userNote: rawNote });
}

export function serializeCertificateNote(meta: Partial<CertificateRequestMetadata>): string {
  const validated = certificateMetadataSchema.parse(meta);
  return JSON.stringify(validated);
}

export const createCertificateRequestSchema = z.object({
  certificateTypeId: z.string().optional().default(""),
  note: z.string().optional(),
  metadata: certificateMetadataSchema.partial().optional(),
});

export const updateCertificateRequestSchema = z.object({
  certificateTypeId: z.string().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]).optional(),
  reason: z.string().optional(),
  issuedDocumentUrl: z.string().optional(),
  metadata: certificateMetadataSchema.partial().optional(),
});

export const reviewCertificateRequestSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "PENDING", "CANCELLED"]),
  reason: z.string().optional(),
  issuedDocumentUrl: z.string().optional().or(z.literal("")),
  metadata: certificateMetadataSchema.partial().optional(),
}).refine((data) => {
  if (data.status === "REJECTED" && !data.reason) {
    return false;
  }
  return true;
}, {
  message: "กรุณาระบุเหตุผลกรณีปฏิเสธคำร้อง",
  path: ["reason"],
});

export const createCertificateTypeSchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อประเภทหนังสือรับรอง"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updateCertificateTypeSchema = createCertificateTypeSchema.partial();
