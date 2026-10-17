import {
  CERTIFICATE_PURPOSES,
  type CertificateRequestMetadata,
  type CertificateTemplateType,
} from "./validations";

export interface BuiltCertificateText {
  template: CertificateTemplateType;
  docNo: string;
  issueDateTh: string;
  issueDateEn: string;
  subjectTh?: string;
  recipientTh?: string;
  attachmentTh?: string;
  paragraph1: string;
  paragraph2?: string;
  paragraph3?: string;
  signerName: string;
  signerTitle: string;
  signerOrg?: string;
  coordinatorName?: string;
  coordinatorPhone?: string;
}

export function extractYearNumber(classYear?: string): string {
  if (!classYear) return "1";
  const m = classYear.match(/(\d+)/);
  if (m) return m[1];
  const lower = classYear.toLowerCase();
  if (lower.includes("first") || lower.includes("frist")) return "1";
  if (lower.includes("second")) return "2";
  if (lower.includes("third")) return "3";
  if (lower.includes("fourth")) return "4";
  return "1";
}

export function formatVisaTypeTh(visaType?: string): string {
  const v = (visaType || "").trim();
  if (!v || v === "0" || v.toLowerCase() === "no visa") {
    return "ได้รับการตรวจลงตราประเภทคนอยู่ชั่วคราว (Non-Immigrant Visa)";
  }
  if (v.toLowerCase().includes("non-immigrant")) {
    return "คนอยู่ชั่วคราว (Non-Immigrant Visa)";
  }
  return v;
}

export function formatCurriculumFullTh(degreeLevel?: string, major?: string): string {
  const d = (degreeLevel || "").toLowerCase();
  const m = (major || "").toLowerCase();
  const isEng =
    d.includes("english") ||
    d.includes("อังกฤษ") ||
    m.includes("buddhist studies") ||
    m.includes("philosophy") ||
    m.includes("religion");

  if (d.includes("เอก") || d.includes("ph.d")) {
    return isEng
      ? "หลักสูตรพุทธศาสตรดุษฎีบัณฑิต (ระดับปริญญาเอก ภาคภาษาอังกฤษ)"
      : "หลักสูตรพุทธศาสตรดุษฎีบัณฑิต (ระดับปริญญาเอก)";
  }
  if (d.includes("โท") || d.includes("m.a")) {
    return isEng
      ? "หลักสูตรพุทธศาสตรมหาบัณฑิต (ระดับปริญญาโท ภาคภาษาอังกฤษ)"
      : "หลักสูตรพุทธศาสตรมหาบัณฑิต (ระดับปริญญาโท)";
  }
  return "หลักสูตรพุทธศาสตรบัณฑิต (ระดับปริญญาตรี หลักสูตร 4 ปี)";
}

export function formatMajorFullTh(degreeLevel?: string, major?: string): string {
  const d = (degreeLevel || "").toLowerCase();
  const m = (major || "").trim();
  const lowerM = m.toLowerCase();
  const isEng =
    d.includes("english") ||
    d.includes("อังกฤษ") ||
    lowerM === "buddhist studies" ||
    lowerM === "philosophy" ||
    lowerM === "religion and philosophy";

  if (lowerM.includes("religion") || lowerM.includes("philosophy") || lowerM.includes("ปรัชญา")) {
    if (m.startsWith("สาขาวิชา") && !isEng) {
      return `${m} (ภาคภาษาไทย)`;
    }
    return isEng
      ? "สาขาวิชาศาสนาและปรัชญา (ภาคภาษาอังกฤษ)"
      : "สาขาวิชาศาสนาและปรัชญา (ภาคภาษาไทย)";
  }
  if (lowerM.includes("buddhist") || lowerM.includes("พระพุทธศาสนา")) {
    return isEng
      ? "สาขาวิชาพระพุทธศาสนา (ภาคภาษาอังกฤษ)"
      : "สาขาวิชาพระพุทธศาสนา (ภาคภาษาไทย)";
  }
  if (lowerM.includes("พระไตรปิฎก")) {
    return "สาขาวิชาพระไตรปิฎกศึกษา (ภาคภาษาไทย)";
  }
  if (m.startsWith("สาขาวิชา")) {
    return isEng ? `${m} (ภาคภาษาอังกฤษ)` : `${m} (ภาคภาษาไทย)`;
  }
  return isEng ? `สาขาวิชา${m || "พระพุทธศาสนา"} (ภาคภาษาอังกฤษ)` : `สาขาวิชา${m || "พระพุทธศาสนา"}`;
}

export function formatDeptShortTh(major?: string): string {
  const lower = (major || "").toLowerCase();
  if (lower.includes("religion") || lower.includes("philosophy") || lower.includes("ปรัชญา")) {
    return "ศาสนาและปรัชญา";
  }
  if (lower.includes("พระไตรปิฎก")) {
    return "พระไตรปิฎกศึกษา";
  }
  return "พระพุทธศาสนา";
}

export function formatDegreeProgramEn(degreeLevel?: string): string {
  const d = (degreeLevel || "").toLowerCase();
  if (d.includes("เอก") || d.includes("ph.d")) {
    return "Doctor of Philosophy Program (Ph.D. Program)";
  }
  if (d.includes("โท") || d.includes("m.a")) {
    return "Master of Arts Program (M.A. Program)";
  }
  return "Bachelor of Arts Program (4-Year Undergraduate Program)";
}

export function formatMajorEn(major?: string, degreeLevel?: string): string {
  const m = (major || "").toLowerCase();
  const d = (degreeLevel || "").toLowerCase();
  const isEng = d.includes("english") || m.includes("buddhist") || m.includes("philosophy") || m.includes("religion");
  const suffix = isEng ? " (English Program)" : "";

  if (m.includes("religion") || m.includes("philosophy") || m.includes("ปรัชญา")) {
    return `Religion and Philosophy${suffix}`;
  }
  if (m.includes("พระไตรปิฎก") || m.includes("tipitaka")) {
    return `Tipitaka Studies${suffix}`;
  }
  return `Buddhist Studies${suffix}`;
}

export function formatPurposePhraseTh(purpose?: string): string {
  const p = (purpose || "").trim();
  const found = CERTIFICATE_PURPOSES.find(
    (item) => item.value.toLowerCase() === p.toLowerCase() || p.toLowerCase().includes(item.labelEn.toLowerCase())
  );
  if (found) return found.purposePhraseTh;

  const lower = p.toLowerCase();
  if (lower.includes("mobile banking")) {
    return "สำหรับการเปิดบัญชีธนาคารและเปิดใช้งานแอบพิเคชั่นของธนาคาร (Mobile Banking)";
  }
  if (lower.includes("bank")) {
    return "สำหรับการเปิดบัญชีธนาคารหรือทำธุรกรรมกับธนาคาร (Opening a Bank Account and/or Conducting Banking Transactions)";
  }
  if (lower.includes("domistory") || lower.includes("dormitory") || lower.includes("หอพัก")) {
    return "สำหรับขอพักอยู่ในหอพักนิสิต (Student's Dormitory)";
  }
  if (lower.includes("extension") || lower.includes("ต่อวีซ่า") || lower.includes("ต่ออายุ")) {
    return "สำหรับต่ออายุ Visa (การตรวจลงตรา)";
  }
  if (lower.includes("cancel") || lower.includes("ยกเลิกวีซ่า")) {
    return "สำหรับขอยกเลิกวีซ่า";
  }
  if (lower.includes("bonafide") || lower.includes("ความเป็นนิสิต")) {
    return "สำหรับรับรองสถานภาพความเป็นนิสิต";
  }
  if (lower.includes("graduat") || lower.includes("รับรองจบ")) {
    return "สำหรับรับรองการสำเร็จการศึกษา";
  }
  if (lower.includes("scholarship") || lower.includes("ทุน")) {
    return "สำหรับประกอบการขอรับทุนการศึกษา";
  }
  return `สำหรับ${p || "รับรองสถานภาพความเป็นนิสิต"}`;
}

export function inferDefaultTemplate(meta: Partial<CertificateRequestMetadata>): CertificateTemplateType {
  if (meta.docTemplate) return meta.docTemplate;
  const p = (meta.requestPurpose || "").toLowerCase();
  if (p.includes("residence") || p.includes("รับรองที่อยู่")) {
    return "RESIDENCE_MEMO";
  }
  if (meta.language === "In English language") {
    return "ENG_CERT";
  }
  return "THAI_CERT";
}

export function buildCertificateDocumentText(meta: CertificateRequestMetadata): BuiltCertificateText {
  const template = inferDefaultTemplate(meta);
  const fullName = meta.fullName || "................................................";
  const age = meta.age && meta.age !== "0" ? meta.age : "25";
  const nationality = meta.nationality && meta.nationality !== "0" ? meta.nationality : "ไทย";
  const country = meta.country && meta.country !== "0" ? meta.country : nationality;
  const passportNo = meta.passportNo && meta.passportNo !== "0" ? meta.passportNo : "";
  const visaTypeText = formatVisaTypeTh(meta.visaType);
  const yearNum = extractYearNumber(meta.classYear);
  const curriculumFullTh = formatCurriculumFullTh(meta.degreeLevel, meta.major);
  const majorFullTh = formatMajorFullTh(meta.degreeLevel, meta.major);
  const deptShortTh = formatDeptShortTh(meta.major);
  const studentCode = meta.studentCode || "....................";
  const purposePhraseTh = formatPurposePhraseTh(meta.requestPurpose);

  const isThaiNational =
    nationality.toLowerCase() === "thai" ||
    nationality.includes("ไทย") ||
    (!passportNo && (!country || country === "0"));

  const defaultDateTh = meta.issueDateTh?.trim() || "14 เดือน ตุลาคม พ.ศ. 2569";
  const defaultDateEn = meta.issueDateEn?.trim() || "August 4, 2026";
  const docNo = meta.docNo?.trim() || (template === "ENG_CERT" ? "8002/ 166" : "8002 / 710");

  if (template === "ENG_CERT") {
    const isFemale = (meta.sex || "").toUpperCase() === "F";
    const pronounCap = isFemale ? "She" : "He";
    const pronounPosCap = isFemale ? "Her" : "His";
    const degreeProgramEn = formatDegreeProgramEn(meta.degreeLevel);
    const majorEn = formatMajorEn(meta.major, meta.degreeLevel);
    const semesterEn = meta.semesterEn || "second semester";
    const academicYearEn = meta.academicYearEn || "2026";
    const passportClause = passportNo ? `, holding Passport No. ${passportNo},` : ",";

    const p1 =
      meta.customBodyText?.trim() ||
      `This is to certify that ${fullName}, whose age is ${age} years old, ${nationality} Nationality${passportClause} is currently enrolled as a student of the Faculty of Buddhism, Mahachulalongkornrajavidyalaya University, Lamsai Sub-District, Wangnoi District, Phra Nakhon Si Ayutthaya Province, 13170, Thailand. ${pronounCap} is studying in the ${degreeProgramEn}, Major in ${majorEn}, Year ${yearNum}, in the ${semesterEn} of an Academic Year ${academicYearEn}, ${pronounPosCap} student identification is ${studentCode}.`;

    return {
      template,
      docNo,
      issueDateTh: defaultDateTh,
      issueDateEn: defaultDateEn,
      paragraph1: p1,
      paragraph2: "This letter of certification is therefore issued as evidence.",
      signerName: meta.signerNameEn || "(Asst. Prof. Phrakhru Sirirattanabundit, Ph.D.)",
      signerTitle: meta.signerTitleEn || "Vice Dean, Faculty of Buddhism",
      signerOrg: "Mahachulalongkornrajavidyalaya University",
    };
  }

  if (template === "BANK_LETTER") {
    const bankAction = meta.bankActionTh?.trim() || "อัพเดตการใช้ Mobile Banking ให้แก่นิสิต";
    const bankTarget = meta.bankTargetTh?.trim() || "ผู้จัดการธนาคารกรุงไทย สาขาโลตัส นวนคร";
    const passportPart = !isThaiNational && passportNo
      ? `สัญชาติ ${nationality} ประเทศ${country} ถือหนังสือเดินทางเลขที่ ${passportNo} `
      : `สัญชาติ ${nationality} `;

    const p1 =
      meta.customBodyText?.trim() ||
      `เนื่องด้วย ${fullName} ${passportPart}รหัสนิสิต ${studentCode} เป็นนิสิต${curriculumFullTh} ชั้นปีที่ ${yearNum} ${majorFullTh} ภาควิชา${deptShortTh} คณะพุทธศาสตร์ มีความประสงค์จะทำธุรกรรมกับธนาคาร เพื่ออำนวยความสะดวกในการทำธุรกรรมกับมหาวิทยาลัยในระหว่างที่กำลังศึกษาอยู่ในภาควิชา${deptShortTh} คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย ตำบลลำไทร อำเภอวังน้อย จังหวัดพระนครศรีอยุธยา`;

    const p2 = `จึงเจริญพรมาเพื่อให้ความอนุเคราะห์ในเรื่องการ${bankAction}ดังกล่าว จะขอบคุณยิ่ง`;

    return {
      template,
      docNo: meta.docNo?.trim() || "8002/ 077",
      issueDateTh: meta.issueDateTh?.trim() || "14 ตุลาคม 2569",
      issueDateEn: defaultDateEn,
      subjectTh: `ขอความอนุเคราะห์${bankAction}`,
      recipientTh: bankTarget,
      attachmentTh: "หนังสือรับรองนิสิต          จำนวน 1 ฉบับ",
      paragraph1: p1,
      paragraph2: p2,
      signerName: meta.signerNameTh || "(พระครูสิริรัตนบัณฑิต, ผศ.ดร.)",
      signerTitle: meta.signerTitleTh || "รักษาการแทนรองคณบดีฝ่ายวิชาการ คณะพุทธศาสตร์",
      signerOrg: "มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
      coordinatorName: meta.coordinatorNameTh || "นายดวงดี โอฐสู",
      coordinatorPhone: meta.coordinatorPhoneTh || "089-516-7544 / 095-470-7849",
    };
  }

  if (template === "RESIDENCE_MEMO") {
    const addr = meta.addressLine || "MCU";
    const sub = meta.subdistrict || "Lam Sai";
    const dist = meta.district || "Wang Noi";
    const prov = meta.province || "Phra Nakhon Si Ayutthaya";
    const zip = meta.postalCode || "13170";

    const p1 =
      meta.customBodyText?.trim() ||
      `ด้วย ${fullName} รหัสนิสิต ${studentCode} อายุ ${age} สัญชาติ ${nationality} ประเทศ ${country} ถือหนังสือเดินทางเลขที่ ${passportNo || "-"} และวีซ่าประเภท ${visaTypeText} นิสิตคณะพุทธศาสตร์ ${curriculumFullTh} ชั้นปีที่ ${yearNum} ${majorFullTh} มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย ปัจจุบันพำนักอยู่ ณ ${addr} ตำบล ${sub} อำเภอ ${dist} จังหวัด ${prov} รหัสไปรษณีย์ ${zip} นั้น`;

    const p2 = `ในการนี้ คณะพุทธศาสตร์ จึงขอความอนุเคราะห์ในการออกหนังสือรับรองที่อยู่ให้กับ ${fullName} รหัสนิสิต ${studentCode} นิสิต${curriculumFullTh} ชั้นปีที่ ${yearNum} ${majorFullTh} คณะพุทธศาสตร์ เพื่อเป็นเอกสารประกอบการขออนุญาตพำนักในราชอาณาจักรชั่วคราว`;

    const p3 = "จึงเรียนมาเพื่อทราบและดำเนินการต่อไป";

    return {
      template,
      docNo: meta.docNo?.trim() || "๘๐๐๒/ ว ๐๗๒",
      issueDateTh: meta.issueDateTh?.trim() || "๒๔ สิงหาคม ๒๕๖๙",
      issueDateEn: defaultDateEn,
      subjectTh: `ขอความอนุเคราะห์ออกหนังสือรับรองที่อยู่ให้แก่นิสิต ${fullName}`,
      recipientTh: "ผู้อำนวยการกองกิจการนิสิต",
      paragraph1: p1,
      paragraph2: p2,
      paragraph3: p3,
      signerName: meta.signerNameTh || "(พระครูสิริรัตนบัณฑิต, ผศ.ดร.)",
      signerTitle: meta.signerTitleTh || "รักษาการแทนรองคณบดีฝ่ายวิชาการ คณะพุทธศาสตร์",
    };
  }

  // Default: THAI_CERT (หนังสือรับรองนิสิต ภาษาไทย)
  const foreignClause = isThaiNational
    ? `สัญชาติ ไทย `
    : `สัญชาติ ${nationality} ประเทศ ${country} ถือหนังสือเดินทางเลขที่ ${passportNo || "-"} และวีซ่าประเภท ${visaTypeText} `;

  const p1 =
    meta.customBodyText?.trim() ||
    `โดยหนังสือนี้ขอรับรองว่า ${fullName} อายุ ${age} ปี ${foreignClause}เป็นนิสิตคณะพุทธศาสตร์ ${curriculumFullTh} ชั้นปีที่ ${yearNum} ${majorFullTh} มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย รหัสประจำตัวนิสิต ${studentCode} เพื่อเป็นหลักฐาน ${purposePhraseTh} จึงออกหนังสือนี้ไว้เป็นสำคัญ`;

  return {
    template: "THAI_CERT",
    docNo,
    issueDateTh: defaultDateTh,
    issueDateEn: defaultDateEn,
    paragraph1: p1,
    signerName: meta.signerNameTh || "(พระครูสิริรัตนบัณฑิต, ผศ.ดร.)",
    signerTitle: meta.signerTitleTh || "รักษาการแทนรองคณบดีฝ่ายวิชาการ คณะพุทธศาสตร์",
  };
}

// ข้อมูลเริ่มต้นจากไฟล์ Excel และ PDF ต้นฉบับที่ผู้ใช้อัปโหลด
export const INITIAL_EXCEL_CERTIFICATE_RECORDS: Partial<CertificateRequestMetadata>[] = [
  {
    seqNo: 1,
    studentCode: "6401501018",
    fullName: "PONNYARDHAJA",
    age: "27",
    sex: "M",
    nationality: "Myanmar",
    country: "Myanmar",
    passportNo: "ME123079",
    passportExpireDate: "2024-04-06",
    visaType: "Non-Immigrant Visa",
    visaExpireDate: "28 DEC 2021",
    classYear: "ปีที่ 1 (First year)",
    degreeLevel: "ป.ตรี (B.A. English Program)",
    major: "Buddhist Studies",
    requestPurpose: "Open Bank Account (เปิดบัญชีธนาคาร)",
    language: "In Thai language",
    gpa: "0",
    email: "6401501018@mcu.ac.th",
    addressLine: "MCU",
    subdistrict: "Lamsai",
    district: "Wangnoi",
    province: "Ayutthaya",
    postalCode: "13170",
    fullAddress: "MCU ตำบลLamsai อำเภอWangnoi จังหวัดAyutthaya 13170",
    docTemplate: "THAI_CERT",
    docNo: "8002 / 710",
    issueDateTh: "12 เดือน ตุลาคม พ.ศ. 2569",
  },
  {
    seqNo: 2,
    studentCode: "6301501077",
    fullName: "VEN.KHEMARCARA",
    age: "26",
    sex: "M",
    nationality: "Myanmar",
    country: "Myanmar",
    passportNo: "ME919394",
    passportExpireDate: "2025-01-08",
    visaType: "No Visa",
    visaExpireDate: "No Visa",
    classYear: "ปีที่ 2 (Second year)",
    degreeLevel: "ป.ตรี (B.A. English Program)",
    major: "Buddhist Studies",
    requestPurpose: "Visa to Thailand",
    language: "In English language",
    gpa: "3.00",
    email: "6301501077@mcu.ac.th",
    passportCopyUrl: "https://drive.google.com/open?id=1p__gnQ9V6r-q4dG17BsxrAQxwa5gF_GW",
    addressLine: "Yaphyu Monastery",
    subdistrict: "Monywa",
    district: "Kani",
    province: "Yaphyu",
    postalCode: "2121",
    fullAddress: "Yaphyu Monastery ตำบลMonywa อำเภอKani จังหวัดYaphyu 2121",
    docTemplate: "ENG_CERT",
    docNo: "8002/ 166",
    issueDateEn: "August 4, 2026",
  },
  {
    seqNo: 3,
    studentCode: "6101501059",
    fullName: "SUNANDA",
    age: "29",
    sex: "F",
    nationality: "Myanmar",
    country: "Myanmar",
    passportNo: "MD210622",
    passportExpireDate: "2023-04-05",
    visaType: "Non-Immigrant Visa",
    visaExpireDate: "2022-09-12",
    classYear: "ปีที่ 4 (Fourth year)",
    degreeLevel: "ป.ตรี (B.A. English Program)",
    major: "Buddhist Studies",
    requestPurpose: "Graduation Certificate (รับรองจบ)",
    language: "In English language",
    gpa: "3.53",
    email: "6101501059@mcu.ac.th",
    addressLine: "Wat Phrayasiri aiyasawan",
    subdistrict: "Bang yi khan",
    district: "Bang plat",
    province: "Bangkok",
    postalCode: "10700",
    fullAddress: "Wat Phrayasiri aiyasawan ตำบลBang yi khan อำเภอBang plat จังหวัดBangkok 10700",
    docTemplate: "ENG_CERT",
    docNo: "8002/ 167",
    issueDateEn: "August 10, 2026",
  },
  {
    seqNo: 4,
    studentCode: "6401201052",
    fullName: "พระธนายุพงศ์ พลวุฑฺโฒ นามสกุล อาสนธ์",
    age: "35",
    sex: "M",
    nationality: "Thai",
    country: "Thailand",
    passportNo: "",
    visaType: "0",
    classYear: "ปีที่ 1 (First year)",
    degreeLevel: "ป.โท (M.A.)",
    major: "สาขาวิชาพระไตรปิฎกศึกษา",
    requestPurpose: "Requisting for Domistory (ขอหอพักนิสิต)",
    language: "In Thai language",
    gpa: "2.00",
    email: "6401201052@mcu.ac.th",
    addressLine: "วัดหนองบัวตากลาน 60ม.8",
    subdistrict: "ห้วยหอม",
    district: "ตาคลี",
    province: "นครสวรรค์",
    postalCode: "60140",
    fullAddress: "วัดหนองบัวตากลาน 60ม.8 ตำบลห้วยหอม อำเภอตาคลี จังหวัดนครสวรรค์ 60140",
    docTemplate: "THAI_CERT",
    docNo: "8002 / 362",
    issueDateTh: "19 เดือน มิถุนายน พ.ศ. 2569",
  },
  {
    seqNo: 5,
    studentCode: "6201501038",
    fullName: "NYARNADHAJHA",
    age: "24",
    sex: "M",
    nationality: "Myanmar",
    country: "Myanmar",
    passportNo: "MF398445",
    passportExpireDate: "2026-10-26",
    visaType: "Non-Immigrant Visa",
    visaExpireDate: "Education visa",
    classYear: "ปีที่ 3 (Third year)",
    degreeLevel: "ป.ตรี (B.A. English Program)",
    major: "Philosophy",
    requestPurpose: "Extension for Visa (ต่อวีซ่า)",
    language: "In Thai language",
    gpa: "3.11",
    email: "6201501038@mcu.ac.th",
    addressLine: "Mahachulalongkornrajavidayala university",
    subdistrict: "Lamsai",
    district: "Wangnoi",
    province: "Ayutthaya",
    postalCode: "13170",
    fullAddress: "Mahachulalongkornrajavidayala university ตำบลLamsai อำเภอWangnoi จังหวัดAyutthaya 13170",
    docTemplate: "THAI_CERT",
    docNo: "8002 / 714",
    issueDateTh: "14 เดือน ตุลาคม พ.ศ. 2569",
  },
  {
    seqNo: 6,
    studentCode: "231001",
    fullName: "พระจาตุรงค์ อาจารสุโภ, ดร.",
    age: "39",
    sex: "M",
    nationality: "Thai",
    country: "Thailand",
    passportNo: "",
    visaType: "0",
    classYear: "อาจารย์",
    degreeLevel: "ป.เอก (Ph.D.)",
    major: "สาขาวิชาปรัชญา",
    requestPurpose: "Scholarships (ทุนการศึกษา)",
    language: "In Thai language",
    gpa: "0",
    email: "231001@mcu.ac.th",
    addressLine: "มจร",
    subdistrict: "ลำไทร",
    district: "วังน้อย",
    province: "อยุธยา",
    postalCode: "13170",
    fullAddress: "มจร ตำบลลำไทร อำเภอวังน้อย จังหวัดอยุธยา 13170",
    docTemplate: "THAI_CERT",
    docNo: "8002 / 412",
    issueDateTh: "15 เดือน สิงหาคม พ.ศ. 2569",
  },
  {
    seqNo: 7,
    studentCode: "6101501069",
    fullName: "BHIKKHUNI TRAN PHUONG THUYEN",
    age: "29",
    sex: "F",
    nationality: "Vietnamese",
    country: "Vietnam",
    passportNo: "C1330730",
    passportExpireDate: "2026-02-24",
    visaType: "Transit Visa (30 Day)",
    visaExpireDate: "2022-09-07",
    classYear: "ปีที่ 4 (Fourth year)",
    degreeLevel: "ป.ตรี (B.A. English Program)",
    major: "Philosophy",
    requestPurpose: "Bonafide Certificate (ความเป็นนิสิต)",
    language: "In English language",
    gpa: "3.85",
    email: "6101501069@mcu.ac.th",
    addressLine: "Mahachulalongkornrajavidyalaya University",
    subdistrict: "Lam Sai",
    district: "Wang Noi",
    province: "Phra Nakhon Si Ayutthaya",
    postalCode: "13170",
    fullAddress: "Mahachulalongkornrajavidyalaya University ตำบลLam Sai อำเภอWang Noi จังหวัดPhra Nakhon Si Ayutthaya 13170",
    docTemplate: "ENG_CERT",
    docNo: "8002/ 168",
    issueDateEn: "August 24, 2026",
  },
  {
    seqNo: 8,
    studentCode: "6001501014",
    fullName: "EAIK HTI",
    age: "24",
    sex: "F",
    nationality: "Myanmar",
    country: "Myanmar",
    passportNo: "MC165867",
    passportExpireDate: "2022-05-05",
    visaType: "Non-Immigrant Visa",
    visaExpireDate: "2022-05-05",
    classYear: "ปีที่ 4 (Fourth year)",
    degreeLevel: "ป.ตรี (B.A. English Program)",
    major: "Philosophy",
    requestPurpose: "Renew Passport (เปลี่ยนหนังสือเดินทางใหม่)",
    language: "In English language",
    gpa: "2.86",
    email: "6001501014@mcu.ac.th",
    addressLine: "MCU",
    subdistrict: "Lamsai",
    district: "Wangnoi",
    province: "Ayutthaya",
    postalCode: "13170",
    fullAddress: "MCU ตำบลLamsai อำเภอWangnoi จังหวัดAyutthaya 13170",
    docTemplate: "ENG_CERT",
    docNo: "8002/ 169",
    issueDateEn: "September 1, 2026",
  },
  {
    seqNo: 9,
    studentCode: "6501501045",
    fullName: "RAZAWANSA",
    age: "24",
    sex: "M",
    nationality: "Myanmar",
    country: "Myanmar",
    passportNo: "MF758127",
    passportExpireDate: "2026-09-30",
    visaType: "Tourist Visa",
    visaExpireDate: "No Visa",
    classYear: "ปีที่ 1 (First year)",
    degreeLevel: "ป.ตรี (B.A. English Program)",
    major: "Buddhist Studies",
    requestPurpose: "Open Bank Account (เปิดบัญชีธนาคาร)",
    language: "In English language",
    gpa: "4.00",
    email: "6501501045@mcu.ac.th",
    addressLine: "MCU",
    subdistrict: "Lam Sai",
    district: "Wang Noi",
    province: "Pra Nakornsi Ayutthaya",
    postalCode: "13170",
    fullAddress: "MCU ตำบลLam Sai อำเภอWang Noi จังหวัดPra Nakornsi Ayutthaya 13170",
    docTemplate: "ENG_CERT",
    docNo: "8002/ 170",
    issueDateEn: "October 12, 2026",
  },
  {
    seqNo: 10,
    studentCode: "6501401004",
    fullName: "THACH VEN",
    age: "33",
    sex: "M",
    nationality: "Vietnamese",
    country: "Vietnam",
    passportNo: "K0533022",
    passportExpireDate: "2032-05-20",
    visaType: "Non-Immigrant Visa",
    visaExpireDate: "2022-09-12",
    classYear: "ปีที่ 3 (Third year)",
    degreeLevel: "ป.ตรี (B.A. Thai Program)",
    major: "Philosophy",
    requestPurpose: "Extension for Visa (ต่อวีซ่า)",
    language: "In Thai language",
    gpa: "3.65",
    email: "6501401004@mcu.ac.th",
    addressLine: "วัดทองจันทริการาม",
    subdistrict: "พะยอม",
    district: "วังน้อย",
    province: "พระนครศรีอยุธยา",
    postalCode: "13170",
    fullAddress: "วัดทองจันทริการาม ตำบลพะยอม อำเภอวังน้อย จังหวัดพระนครศรีอยุธยา 13170",
    docTemplate: "THAI_CERT",
    docNo: "8002 / 715",
    issueDateTh: "14 เดือน ตุลาคม พ.ศ. 2569",
  },
  {
    seqNo: 11,
    studentCode: "6101501042",
    fullName: "CHAU BUONL",
    age: "34",
    sex: "F",
    nationality: "Vietnamese",
    country: "Vietnam",
    passportNo: "C4164904",
    passportExpireDate: "2027-11-16",
    visaType: "Non-Immigrant Visa",
    visaExpireDate: "2022-10-02",
    classYear: "ปีที่ 4 (Fourth year)",
    degreeLevel: "ป.ตรี (B.A. English Program)",
    major: "Buddhist Studies",
    requestPurpose: "Cancellation Visa (ยกเลิกวีซ่า)",
    language: "In Thai language",
    gpa: "3.57",
    email: "6101501042@mcu.ac.th",
    addressLine: "วัดใหม่ยายแป้น",
    subdistrict: "บางขุนนนท์",
    district: "บางกอกน้อย",
    province: "กรุงเทพมหานคร",
    postalCode: "10700",
    fullAddress: "วัดใหม่ยายแป้น ตำบลบางขุนนนท์ อำเภอบางกอกน้อย จังหวัดกรุงเทพมหานคร 10700",
    docTemplate: "THAI_CERT",
    docNo: "8002 / 708",
    issueDateTh: "12 เดือน ตุลาคม พ.ศ. 2569",
  },
  // ตัวอย่างจากไฟล์ PDF ต้นฉบับเพื่อให้ผู้ดูแลระบบทดสอบพิมพ์เทียบต้นฉบับได้ทันที
  {
    seqNo: 12,
    studentCode: "6501501071",
    fullName: "VIPASSANA",
    age: "29",
    sex: "M",
    nationality: "Myanmar",
    country: "Myanmar",
    passportNo: "MF772427",
    visaType: "Non-Immigrant Visa",
    classYear: "ปีที่ 4 (Fourth year)",
    degreeLevel: "ป.ตรี (B.A. English Program)",
    major: "Religion and Philosophy",
    requestPurpose: "Bonafide Certificate (ความเป็นนิสิต)",
    language: "In English language",
    email: "6501501071@mcu.ac.th",
    addressLine: "MCU",
    subdistrict: "Lamsai",
    district: "Wangnoi",
    province: "Phra Nakhon Si Ayutthaya",
    postalCode: "13170",
    docTemplate: "ENG_CERT",
    docNo: "8002/ 166",
    issueDateEn: "August 4, 2026",
  },
  {
    seqNo: 13,
    studentCode: "6901501123",
    fullName: "Tinku Barua",
    age: "26",
    sex: "M",
    nationality: "Bangladeshi",
    country: "Bangladesh",
    passportNo: "A11511416",
    visaType: "Non-Immigrant Visa",
    classYear: "ปีที่ 1 (First year)",
    degreeLevel: "ป.ตรี (B.A. English Program)",
    major: "Religion and Philosophy",
    requestPurpose: "Mobile Banking (เปิดใช้งานแอปพลิเคชันธนาคาร)",
    language: "In Thai language",
    email: "6901501123@mcu.ac.th",
    addressLine: "MCU",
    subdistrict: "ลำไทร",
    district: "วังน้อย",
    province: "พระนครศรีอยุธยา",
    postalCode: "13170",
    docTemplate: "BANK_LETTER",
    docNo: "8002/ 077",
    issueDateTh: "14 ตุลาคม 2569",
  },
  {
    seqNo: 14,
    studentCode: "6801501121",
    fullName: "SAMKICCA",
    age: "26",
    sex: "M",
    nationality: "Myanmar",
    country: "Myanmar",
    passportNo: "MJ121085",
    visaType: "Non-Immigrant Visa",
    classYear: "ปีที่ 2 (Second year)",
    degreeLevel: "ป.ตรี (B.A. English Program)",
    major: "Religion and Philosophy",
    requestPurpose: "Residence Certificate (ขอรับรองที่อยู่)",
    language: "In Thai language",
    email: "6801501121@mcu.ac.th",
    addressLine: "MCU",
    subdistrict: "lam Sai",
    district: "Wang Noi",
    province: "Wang Noi",
    postalCode: "13170",
    docTemplate: "RESIDENCE_MEMO",
    docNo: "๘๐๐๒/ ว ๐๗๒",
    issueDateTh: "๒๔ สิงหาคม ๒๕๖๙",
  },
];
