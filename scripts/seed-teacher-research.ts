import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

const chaiyaPubs = [
  {
    titleTh: "กระบวนทัศน์ทางพระพุทธศาสนาในการจัดการความขัดแย้งทางการเมืองของสังคมไทย",
    titleEn: "Buddhist Paradigm on Political Conflict Management of Thai Society",
    authors: "ไชยา เสนแสนยา, ธนาธิป ฮาดเนาลี, คงสฤษฎ์ แพงทรัพย์, พระมหาขวัญชัย เหมประไพ, เพ็ญพรรณ เฟื่องฟูลอย, แสวง นิลนามะ",
    journalName: "วารสาร มจร ปรัชญาปริทรรศน์",
    volume: "ปีที่ ๙",
    issue: "ฉบับที่ ๑",
    publicationYear: "๒๕๖๙",
    pages: "๑-๑๑",
    issn: "3027-7388 (Online)",
    tier: "TCI กลุ่ม 2",
    type: "RESEARCH",
    url: "https://so06.tci-thaijo.org/index.php/jmpr/article/view/287413",
    orderIndex: 1,
  },
  {
    titleTh: "หลักการสมานฉันท์ในมิติพระพุทธศาสนาเถรวาทเพื่อการอยู่ร่วมกันในสังคมพหุวัฒนธรรม",
    titleEn: "Reconciliation Principles in Theravada Buddhist Dimension for Living in a Multicultural Society",
    authors: "ไชยา เสนแสนยา, ธนาธิป ฮาดเนาลี, คงสฤษฎ์ แพงทรัพย์, พระมหาขวัญชัย เหมประไพ, เพ็ญพรรณ เฟื่องฟูลอย, แสวง นิลนามะ",
    journalName: "วารสาร มจร ปรัชญาปริทรรศน์",
    volume: "ปีที่ ๙",
    issue: "ฉบับที่ ๑",
    publicationYear: "๒๕๖๙",
    pages: "๑๐๐-๑๑๓",
    issn: "3027-7388 (Online)",
    tier: "TCI กลุ่ม 2",
    type: "RESEARCH",
    url: "https://so06.tci-thaijo.org/index.php/jmpr/article/view/288939",
    orderIndex: 2,
  },
  {
    titleTh: "กลไกการสร้างสังคมสันติสุขระหว่างคน ๓ วัยในมิติพระพุทธศาสนาของสังคมไทย",
    titleEn: "A Mechanic to Strengthen Peace in the Society of Three Groups in Buddhist Viewpoints of Thai Society",
    authors: "พระมหาขวัญชัย เหมประไพ, แสวง นิลนามะ, คงสฤษฎ์ แพงทรัพย์, ธนาธิป ฮาดเนาลี, ไชยา เสนแสนยา และ เพ็ญพรรณ เฟื่องฟูลอย",
    journalName: "วารสาร มจร ปรัชญาปริทรรศน์",
    volume: "ปีที่ ๘",
    issue: "ฉบับที่ ๑",
    publicationYear: "๒๕๖๘",
    pages: "๒๕๗-๒๗๐",
    issn: "3027-7388 (Online)",
    tier: "TCI กลุ่ม 2",
    type: "RESEARCH",
    url: "https://so06.tci-thaijo.org/index.php/jmpr/article/view/281119/187868",
    orderIndex: 3,
  },
  {
    titleTh: "การวิเคราะห์ความสัมพันธ์ระหว่างปริยัติปฏิบัติและปฏิเวธในพุทธปรัชญาเถรวาท",
    titleEn: "An Analysis of the Relationship between Pariyatti, Patipatti, and Pativedha in Theravada Buddhist Philosophy",
    authors: "ไชยา เสนแสนยา",
    journalName: "วารสาร มจร ปรัชญาปริทรรศน์",
    volume: "ปีที่ ๘",
    issue: "ฉบับที่ ๑",
    publicationYear: "๒๕๖๘",
    pages: "๕๐๐-๕๑๓",
    issn: "3027-7388 (Online)",
    tier: "TCI กลุ่ม 2",
    type: "ACADEMIC",
    url: "https://so06.tci-thaijo.org/index.php/jmpr/article/view/283179",
    orderIndex: 4,
  },
  {
    titleTh: "แนวคิดเรื่องความดีในพุทธปรัชญาเถรวาท : การศึกษาเชิงวิพากษ์ (ดุษฎีนิพนธ์)",
    titleEn: "A Concept of Goodness in Theravada Buddhist Philosophy : A Critical Study",
    authors: "ไชยา เสนแสนยา",
    journalName: "วารสาร มจร ปรัชญาปริทรรศน์",
    volume: "ปีที่ ๘",
    issue: "ฉบับที่ ๓",
    publicationYear: "๒๕๖๘",
    issn: "3027-7388 (Online)",
    tier: "TCI กลุ่ม 2",
    type: "DISSERTATION",
    orderIndex: 5,
  },
];

const chaturongPubs = [
  {
    titleTh: "ปรัชญาความขัดแย้ง",
    titleEn: "Philosophy of Conflict",
    authors: "พระมหาดวงเด่น ฐิตญาโณ, พระจาตุรงค์ อาจารสุโภ, พระถนัด วฑฺฒโน, สุมาลัย กาญจนะ",
    journalName: "วารสารสันติศึกษาปริทรรศน์ มจร",
    volume: "ปีที่ ๖",
    issue: "ฉบับพิเศษ",
    publicationYear: "๒๕๖๑",
    pages: "๓๑๕-๓๒๖",
    issn: "2774-0455 (Online)",
    tier: "TCI กลุ่ม ๑",
    type: "ACADEMIC",
    url: "https://so03.tci-thaijo.org/index.php/journal-peace/article/view/143501",
    orderIndex: 1,
  },
  {
    titleTh: "แนวทางการบูรณาการหลักพระพุทธศาสนากับการระงับข้อพิพาทเกี่ยวกับมรดก",
    titleEn: "Guidelines for Integrating Buddhist Principles with Inheritance Dispute Resolution",
    authors: "พระจาตุรงค์ อาจารสุโภ",
    journalName: "วารสาร มจร ปรัชญาปริทรรศน์",
    volume: "ปีที่ ๖",
    issue: "ฉบับที่ ๑",
    publicationYear: "๒๕๖๖",
    pages: "๕๘-๗๐",
    issn: "3027-7388 (Online)",
    tier: "TCI กลุ่ม ๒",
    type: "ACADEMIC",
    url: "https://so06.tci-thaijo.org/index.php/jmpr/article/view/264259",
    orderIndex: 2,
  },
  {
    titleTh: "การระงับข้อพิพาทของพระมหากษัตริย์ในสมัยกรุงศรีอยุธยา : กรณีศึกษาสมเด็จพระบรมไตรโลกนาถ",
    titleEn: "Dispute Resolution by Kings in Ayutthaya Period : A Case Study of King Borommatrailokanat",
    authors: "พระจาตุรงค์ อาจารสุโภ",
    journalName: "วารสาร มจร ปรัชญาปริทรรศน์",
    volume: "ปีที่ ๖",
    issue: "ฉบับที่ ๒",
    publicationYear: "๒๕๖๖",
    pages: "๑๑-๒๔",
    issn: "3027-7388 (Online)",
    tier: "TCI กลุ่ม ๒",
    type: "ACADEMIC",
    url: "https://so06.tci-thaijo.org/index.php/jmpr/article/view/266014",
    orderIndex: 3,
  },
  {
    titleTh: "กระบวนการสร้างและประเมินมาตรวัดความผาสุกทางจิตวิญญาณของผู้บริหารสถานศึกษา สังกัดสำนักงานเขตพื้นที่การศึกษาประถมศึกษา ในภาคตะวันออกเฉียงเหนือ",
    titleEn: "The Development and Assessment Process of Spiritual Well-Being Scale of School Administrators...",
    authors: "พระจาตุรงค์ ชูศรี และคณะ",
    journalName: "วารสารสันติศึกษาปริทรรศน์ มจร",
    volume: "ปีที่ ๑๑",
    issue: "ฉบับที่ ๔",
    publicationYear: "๒๕๖๖",
    pages: "๑๖๐๙-๑๖๒๒",
    issn: "2774-0455 (Online)",
    tier: "TCI กลุ่ม ๑",
    type: "RESEARCH",
    url: "https://so03.tci-thaijo.org/index.php/journal-peace/article/view/260799",
    orderIndex: 4,
  },
  {
    titleTh: "การประยุกต์ใช้พุทธวิธีการระงับข้อพิพาทในคดีที่ดิน",
    titleEn: "Application of Buddhist Methods for Dispute Resolution in Land Cases",
    authors: "พระจาตุรงค์ ชูศรี, พระปราโมทย์ วาทโกวิโท, นันทรัตน์ เจริญผล",
    journalName: "วารสารพุทธมัคค์ ศูนย์วิจัยธรรมศึกษา สำนักเรียนวัดอาวุธวิกสิตาราม",
    volume: "ปีที่ ๘",
    issue: "ฉบับที่ ๑",
    publicationYear: "๒๕๖๖",
    pages: "๒๙-๔๐",
    issn: "2774-0463 (Online)",
    tier: "TCI กลุ่ม ๒",
    type: "RESEARCH",
    url: "https://so01.tci-thaijo.org/index.php/bdm/article/view/263795",
    orderIndex: 5,
  },
  {
    titleTh: "แนวทางการบูรณาการกระบวนการระงับข้อพิพาทในคดีครอบครัวตามหลักพุทธสันติวิธี",
    titleEn: "Guidelines for Integrating Family Dispute Resolution Processes Based on Buddhist Peaceful Means",
    authors: "พระจาตุรงค์ อาจารสุโภ",
    journalName: "วารสาร มจร ปรัชญาปริทรรศน์",
    volume: "ปีที่ ๕",
    issue: "ฉบับที่ ๒",
    publicationYear: "๒๕๖๕",
    pages: "๑๖-๒๘",
    issn: "3027-7388 (Online)",
    tier: "TCI กลุ่ม ๒",
    type: "ACADEMIC",
    url: "https://so06.tci-thaijo.org/index.php/jmpr/article/view/261947",
    orderIndex: 6,
  },
  {
    titleTh: "กระบวนการสร้างและประเมินมาตรวัดความผาสุกทางจิตวิญญาณของผู้บริหารสถานศึกษา...",
    titleEn: "The Development and Assessment of Spiritual Well-Being Scale...",
    authors: "พระจาตุรงค์ ชูศรี",
    journalName: "วารสารพุทธมัคค์ ศูนย์วิจัยธรรมศึกษา",
    volume: "ปีที่ ๗",
    issue: "ฉบับที่ ๒",
    publicationYear: "๒๕๖๕",
    pages: "๑๖๙-๑๘๐",
    issn: "2774-0463 (Online)",
    tier: "TCI กลุ่ม ๒",
    type: "RESEARCH",
    url: "https://so01.tci-thaijo.org/index.php/bdm/article/view/258440",
    orderIndex: 7,
  },
  {
    titleTh: "ปัจจัยเชิงสาเหตุและผลของความผาสุกทางจิตวิญญาณของผู้บริหารสถานศึกษา สังกัดสำนักงานเขตพื้นที่การศึกษาประถมศึกษา ในภาคตะวันออกเฉียงเหนือ",
    titleEn: "Causal Factors and Effects of Spiritual Well-Being of School Administrators...",
    authors: "พระจาตุรงค์ ชูศรี",
    journalName: "วารสารสมาคมพัฒนาวิชาชีพการบริหารการศึกษาแห่งประเทศไทย (สพบท.)",
    volume: "ปีที่ ๔",
    issue: "ฉบับที่ ๔",
    publicationYear: "๒๕๖๕",
    pages: "๑๕-๒๘",
    issn: "2697-4789 (Online)",
    tier: "TCI กลุ่ม ๒",
    type: "RESEARCH",
    url: "https://so04.tci-thaijo.org/index.php/eadatjournal/article/view/260799",
    orderIndex: 8,
  },
  {
    titleTh: "พุทธกระบวนการพัฒนานวัตกรรมการระงับข้อพิพาทเพื่อสังคมสมานฉันท์",
    titleEn: "Buddhist Process of Developing Innovation for Dispute Resolution Towards Harmonious Society",
    authors: "พระจาตุรงค์ อาจารสุโภ",
    journalName: "วารสาร มจร ปรัชญาปริทรรศน์",
    volume: "ปีที่ ๔",
    issue: "ฉบับที่ ๒",
    publicationYear: "๒๕๖๔",
    pages: "๑-๑๒",
    issn: "3027-7388 (Online)",
    tier: "TCI กลุ่ม ๒",
    type: "ACADEMIC",
    url: "https://so06.tci-thaijo.org/index.php/jmpr/article/view/254429",
    orderIndex: 9,
  },
  {
    titleTh: "การระงับข้อพิพาทด้านมรดกตามแนวพระพุทธศาสนา",
    titleEn: "Inheritance Dispute Resolution According to Buddhism",
    authors: "พระจาตุรงค์ อาจารสุโภ",
    journalName: "วารสารบัณฑิตศึกษาปริทรรศน์ วิทยาลัยสงฆ์นครสวรรค์",
    volume: "ปีที่ ๙",
    issue: "ฉบับที่ ๑",
    publicationYear: "๒๕๖๔",
    pages: "๑-๑๔",
    issn: "2408-1647 (Print)",
    tier: "TCI กลุ่ม ๒",
    type: "ACADEMIC",
    url: "https://so04.tci-thaijo.org/index.php/pnakhorn/article/view/246473",
    orderIndex: 10,
  },
  {
    titleTh: "พุทธสันติวิธีกับการระงับข้อพิพาทในคดีที่ดิน",
    titleEn: "Buddhist Peaceful Means and Dispute Resolution in Land Cases",
    authors: "พระจาตุรงค์ อาจารสุโภ",
    journalName: "วารสาร มจร สันติศึกษาปริทรรศน์",
    volume: "ปีที่ ๘",
    issue: "ฉบับที่ ๔",
    publicationYear: "๒๕๖๓",
    pages: "๑๔๗๔-๑๔๘๖",
    issn: "2774-0455 (Online)",
    tier: "TCI กลุ่ม ๑",
    type: "ACADEMIC",
    url: "https://so03.tci-thaijo.org/index.php/journal-peace/article/view/241857",
    orderIndex: 11,
  },
  {
    titleTh: "พุทธสันติวิธีกับการระงับข้อพิพาทในคดีครอบครัว",
    titleEn: "Buddhist Peaceful Means and Family Dispute Resolution",
    authors: "พระจาตุรงค์ อาจารสุโภ",
    journalName: "วารสารวิชาการ มจร บุรีรัมย์",
    volume: "ปีที่ ๕",
    issue: "ฉบับที่ ๒",
    publicationYear: "๒๕๖๓",
    pages: "๔๕-๕๖",
    issn: "2651-1770 (Online)",
    tier: "TCI กลุ่ม ๒",
    type: "ACADEMIC",
    url: "https://so05.tci-thaijo.org/index.php/ProjectMCRBR/article/view/243763",
    orderIndex: 12,
  },
  {
    titleTh: "การจัดการความขัดแย้งของพระสงฆ์ตามพระธรรมวินัย",
    titleEn: "Conflict Management of Buddhist Monks According to the Vinaya",
    authors: "พระจาตุรงค์ อาจารสุโภ",
    journalName: "วารสารวิจัยธรรมศึกษา ศูนย์วิจัยธรรมศึกษา สำนักเรียนวัดอาวุธวิกสิตาราม",
    volume: "ปีที่ ๒",
    issue: "ฉบับที่ ๑",
    publicationYear: "๒๕๖๒",
    pages: "๑-๘",
    tier: "TCI กลุ่ม ๒",
    type: "ACADEMIC",
    url: "https://www.awut.org/ojs/index.php/dsr/article/view/17",
    orderIndex: 13,
  },
  {
    titleTh: "การเข้าใจชีวิตบนพื้นฐานแนวคิดเรื่องธาตุ ๑๘",
    titleEn: "Understanding Life on the Basis of the 18 Elements Concept",
    authors: "พระจาตุรงค์ อาจารสุโภ",
    journalName: "วารสารพุทธมัคค์ ศูนย์วิจัยธรรมศึกษา สำนักเรียนวัดอาวุธวิกสิตาราม",
    volume: "ปีที่ ๒",
    issue: "ฉบับที่ ๒",
    publicationYear: "๒๕๖๑",
    pages: "๓๒-๓๘",
    tier: "TCI กลุ่ม ๒",
    type: "ACADEMIC",
    url: "https://so01.tci-thaijo.org/index.php/bdm/article/view/179650",
    orderIndex: 14,
  },
  {
    titleTh: "ธรรมชาติความแตกแยกของมนุษย์บนรากฐานแนวคิดเรื่องธาตุ",
    titleEn: "The Nature of Human Discord Based on the Element Concept",
    authors: "พระจาตุรงค์ อาจารสุโภ",
    journalName: "วารสารบัณฑิตสาเกตปริทรรศน์",
    volume: "ปีที่ ๓",
    issue: "ฉบับที่ ๒",
    publicationYear: "๒๕๖๑",
    pages: "๘๙-๙๘",
    tier: "TCI กลุ่ม ๒",
    type: "ACADEMIC",
    url: "https://so03.tci-thaijo.org/index.php/saketreview/article/view/248007",
    orderIndex: 15,
  },
];

async function seed() {
  console.log("Seeding teacher data and research publications across all active tenants...");

  const tenants = await prisma.tenant.findMany({
    where: { isActive: true },
  });

  if (tenants.length === 0) {
    throw new Error("No active tenants found");
  }

  for (const tenant of tenants) {
    console.log(`\n--- Seeding for Tenant: ${tenant.nameTh} (${tenant.code}) [${tenant.id}] ---`);

    // 1. Find or create Department: ภาควิชาศาสนาและปรัชญา
    let dept = await prisma.department.findFirst({
      where: {
        tenantId: tenant.id,
        nameTh: { contains: "ศาสนาและปรัชญา" },
      },
    });

    if (!dept) {
      dept = await prisma.department.create({
        data: {
          tenantId: tenant.id,
          nameTh: "ภาควิชาศาสนาและปรัชญา",
          nameEn: "Department of Religion and Philosophy",
          code: "REL-PHIL",
          orderIndex: 2,
        },
      });
      console.log(`Created department: ${dept.nameTh} for tenant ${tenant.code}`);
    } else {
      console.log(`Found existing department: ${dept.nameTh} for tenant ${tenant.code}`);
    }

    // 2. Upsert Teacher 1: นายไชยา เสนแสนยา
    let chaiya = await prisma.personnel.findFirst({
      where: {
        tenantId: tenant.id,
        firstNameTh: "ไชยา",
        lastNameTh: "เสนแสนยา",
      },
    });

    const chaiyaData = {
      firstNameTh: "ไชยา",
      lastNameTh: "เสนแสนยา",
      firstNameEn: "Chaiya",
      lastNameEn: "Sensaenya",
      positionTh: "อาจารย์ประจำหลักสูตรพุทธศาสตรบัณฑิต สาขาวิชาศาสนาและปรัชญา",
      positionEn: "Lecturer in Religion and Philosophy",
      academicPosition: "อาจารย์",
      type: "ACADEMIC" as const,
      departmentId: dept.id,
      email: "chaiya.sen@mcu.ac.th",
      phoneNumber: "098-387-5997",
      contactInfo: "Tel. 098 387 5997, Facebook: ไชยา เสนแสนยา, Line ID: 0983875997",
      educationTh: `พ.ศ. ๒๕๓๓ นักธรรมชั้นเอก วัดศรีบุญเรือง สำนักเรียนคณะจังหวัดเลย กองธรรมสนามหลวง\nพ.ศ. ๒๕๔๒ เปรียญธรรม ๗ ประโยค วัดครุใน สำนักเรียนคณะจังหวัดสมุทรปราการ กองบาลีสนามหลวง\nพ.ศ. ๒๕๔๒ พธ.บ. (ภาษาไทย) ปริญญาพุทธศาสตรบัณฑิต สาขาวิชาภาษาไทย คณะมนุษยศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย\nพ.ศ. ๒๕๔๗ พธ.ม. (พระพุทธศาสนา) ปริญญาพุทธศาสตรมหาบัณฑิต สาขาวิชาพระพุทธศาสนา บัณฑิตวิทยาลัย มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย (วิทยานิพนธ์เรื่อง "ศึกษาทัศนคติและความคาดหวังของครูและนักเรียนที่มีต่อพระภิกษุผู้สอนธรรมศึกษา")\nพ.ศ. ๒๕๖๘ พธ.ด. (ปรัชญา) ปริญญาพุทธศาสตรดุษฎีบัณฑิต สาขาวิชาปรัชญา บัณฑิตวิทยาลัย มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย (ดุษฎีนิพนธ์เรื่อง "แนวคิดเรื่องความดีในพุทธปรัชญาเถรวาท : การศึกษาเชิงวิพากษ์")`,
      experiencesTh: `พ.ศ. ๒๕๕๓ - ๒๕๖๘ : นักจัดการงานทั่วไป หลักสูตรพุทธศาสตรมหาบัณฑิต สาขาวิชาศาสนาเปรียบเทียบ สังกัดคณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย\nพ.ศ. ๒๕๖๔ - ปัจจุบัน : อาจารย์ประจำหลักสูตรพุทธศาสตรบัณฑิต สาขาวิชาศาสนาและปรัชญา ภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์ เลขที่ ๐๒๓๑๐๐๕`,
      bioTh: `อาจารย์ประจำหลักสูตรพุทธศาสตรบัณฑิต สาขาวิชาศาสนาและปรัชญา ภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์ เลขที่ ๐๒๓๑๐๐๕ ผู้เชี่ยวชาญด้านพระไตรปิฎกศึกษา ภาษาไทย และพุทธปรัชญาเถรวาท`,
      orderIndex: 10,
      isActive: true,
    };

    if (chaiya) {
      chaiya = await prisma.personnel.update({
        where: { id: chaiya.id },
        data: chaiyaData,
      });
      console.log(`Updated Chaiya Sensaenya (${chaiya.id})`);
    } else {
      chaiya = await prisma.personnel.create({
        data: {
          tenantId: tenant.id,
          ...chaiyaData,
        },
      });
      console.log(`Created Chaiya Sensaenya (${chaiya.id})`);
    }

    // 3. Upsert Teacher 2: พระจาตุรงค์ อาจารสุโภ (ชูศรี), ดร.
    let chaturong = await prisma.personnel.findFirst({
      where: {
        tenantId: tenant.id,
        firstNameTh: { contains: "จาตุรงค์" },
      },
    });

    const chaturongData = {
      firstNameTh: "พระจาตุรงค์ อาจารสุโภ (ชูศรี), ดร.",
      lastNameTh: "",
      firstNameEn: "Phra Chaturong",
      lastNameEn: "Ajarasubho (Chusri), Ph.D.",
      positionTh: "อาจารย์ประจำภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์",
      positionEn: "Lecturer, Department of Religion and Philosophy",
      academicPosition: "อาจารย์, ดร.",
      type: "ACADEMIC" as const,
      departmentId: dept.id,
      email: "jaturong.aca@mcu.ac.th",
      phoneNumber: "02-623-6333",
      contactInfo: "ภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
      educationTh: `พ.ศ. ๒๕๓๓ นักธรรมชั้นเอก สำนักเรียนวัดมงคลทับคล้อ สำนักเรียนคณะจังหวัดพิจิตร\nพ.ศ. ๒๕๓๗ เปรียญธรรม ๑-๒ ประโยค สำนักเรียนวัดมงคลทับคล้อ สำนักเรียนคณะจังหวัดพิจิตร\nพ.ศ. ๒๕๔๐ ปริญญาพุทธศาสตรบัณฑิต (พธ.บ.) สาขาวิชาสังคมวิทยาและมานุษยวิทยา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย\nพ.ศ. ๒๕๕๓ ปริญญาพุทธศาสตรมหาบัณฑิต (พธ.ม.) สาขาวิชาปรัชญา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย\nพ.ศ. ๒๕๖๓ ปริญญาพุทธศาสตรดุษฎีบัณฑิต (พธ.ด.) สาขาวิชาปรัชญา มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย (ดุษฎีนิพนธ์เรื่อง "การพัฒนานวัตกรรมการระงับข้อพิพาทของศาลยุติธรรมตามแนวพุทธสันติวิธี")`,
      experiencesTh: `อาจารย์ประจำหลักสูตรพุทธศาสตรบัณฑิต สาขาวิชาศาสนาและปรัชญา คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย (เลขที่ ๐๒๓๑๐๐๑)\nอาจารย์ผู้สอนระดับปริญญาตรี บรรยายรายวิชา: ปรัชญาเบื้องต้น, พุทธปรัชญา, มนุษย์กับสังคม, พุทธปรัชญาเถรวาท\nอาจารย์ผู้สอนระดับปริญญาโท บรรยายรายวิชา: สัมมนาพุทธปรัชญาเถรวาท, ทฤษฎีความรู้ทางปรัชญา\nอาจารย์ผู้สอนระดับปริญญาเอก บรรยายรายวิชา: พุทธปรัชญาดุษฎีบัณฑิตศึกษา, นวัตกรรมและสันติวิธี`,
      bioTh: `อาจารย์ประจำภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์ เลขที่ ๐๒๓๑๐๐๑ ผู้เชี่ยวชาญด้านพุทธปรัชญาและพุทธสันติวิธีกับการระงับข้อพิพาท มีผลงานตีพิมพ์ทางวิชาการและงานวิจัยระดับชาติ TCI กลุ่ม 1 และกลุ่ม 2 รวมกว่า 15 เรื่อง`,
      orderIndex: 11,
      isActive: true,
    };

    if (chaturong) {
      chaturong = await prisma.personnel.update({
        where: { id: chaturong.id },
        data: chaturongData,
      });
      console.log(`Updated Phra Chaturong (${chaturong.id})`);
    } else {
      chaturong = await prisma.personnel.create({
        data: {
          tenantId: tenant.id,
          ...chaturongData,
        },
      });
      console.log(`Created Phra Chaturong (${chaturong.id})`);
    }

    // 4. Clear existing publications for these 2 teachers in this tenant
    await prisma.researchPublication.deleteMany({
      where: {
        tenantId: tenant.id,
        personnelId: { in: [chaiya.id, chaturong.id] },
      },
    });

    // 5. Insert Chaiya publications
    for (const pub of chaiyaPubs) {
      await prisma.researchPublication.create({
        data: {
          tenantId: tenant.id,
          personnelId: chaiya.id,
          ...pub,
        },
      });
    }

    // 6. Insert Chaturong publications
    for (const pub of chaturongPubs) {
      await prisma.researchPublication.create({
        data: {
          tenantId: tenant.id,
          personnelId: chaturong.id,
          ...pub,
        },
      });
    }

    console.log(`Seeded publications: Chaiya (${chaiyaPubs.length}), Chaturong (${chaturongPubs.length})`);
  }

  console.log("\nFinished seeding teacher profiles and research across all tenants successfully!");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
