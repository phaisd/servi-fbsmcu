import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function seed() {
  console.log("Seeding teacher data and research publications...");

  // 1. Get or create tenant
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    throw new Error("No tenant found");
  }

  // 2. Find or create Department: ภาควิชาศาสนาและปรัชญา
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
  }

  // 3. Upsert Teacher 1: นายไชยา เสนแสนยา
  const chaiya = await prisma.personnel.upsert({
    where: {
      id: "a1111111-2222-3333-4444-555555555501",
    },
    update: {
      firstNameTh: "ไชยา",
      lastNameTh: "เสนแสนยา",
      firstNameEn: "Chaiya",
      lastNameEn: "Sensaenya",
      positionTh: "อาจารย์ประจำหลักสูตรพุทธศาสตรบัณฑิต สาขาวิชาศาสนาและปรัชญา",
      positionEn: "Lecturer in Religion and Philosophy",
      academicPosition: "อาจารย์",
      type: "ACADEMIC",
      departmentId: dept.id,
      email: "chaiya.sen@mcu.ac.th",
      phoneNumber: "098-387-5997",
      contactInfo: "Tel. 098 387 5997, Facebook: ไชยา เสนแสนยา, Line ID: 0983875997",
      educationTh: `พ.ศ. ๒๕๓๓ นักธรรมชั้นเอก วัดศรีบุญเรือง สำนักเรียนคณะจังหวัดเลย กองธรรมสนามหลวง\nพ.ศ. ๒๕๔๒ เปรียญธรรม ๗ ประโยค วัดครุใน สำนักเรียนคณะจังหวัดสมุทรปราการ กองบาลีสนามหลวง\nพ.ศ. ๒๕๔๒ พธ.บ. (ภาษาไทย) ปริญญาพุทธศาสตรบัณฑิต สาขาวิชาภาษาไทย คณะมนุษยศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย\nพ.ศ. ๒๕๔๗ พธ.ม. (พระพุทธศาสนา) ปริญญาพุทธศาสตรมหาบัณฑิต สาขาวิชาพระพุทธศาสนา บัณฑิตวิทยาลัย มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย (วิทยานิพนธ์เรื่อง "ศึกษาทัศนคติและความคาดหวังของครูและนักเรียนที่มีต่อพระภิกษุผู้สอนธรรมศึกษา")\nพ.ศ. ๒๕๖๘ พธ.ด. (ปรัชญา) ปริญญาพุทธศาสตรดุษฎีบัณฑิต สาขาวิชาปรัชญา บัณฑิตวิทยาลัย มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย (ดุษฎีนิพนธ์เรื่อง "แนวคิดเรื่องความดีในพุทธปรัชญาเถรวาท : การศึกษาเชิงวิพากษ์")`,
      experiencesTh: `พ.ศ. ๒๕๕๓ - ๒๕๖๘ : นักจัดการงานทั่วไป หลักสูตรพุทธศาสตรมหาบัณฑิต สาขาวิชาศาสนาเปรียบเทียบ สังกัดคณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย\nพ.ศ. ๒๕๖๔ - ปัจจุบัน : อาจารย์ประจำหลักสูตรพุทธศาสตรบัณฑิต สาขาวิชาศาสนาและปรัชญา ภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์ เลขที่ ๐๒๓๑๐๐๕`,
      bioTh: `อาจารย์ประจำหลักสูตรพุทธศาสตรบัณฑิต สาขาวิชาศาสนาและปรัชญา ภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์ เลขที่ ๐๒๓๑๐๐๕ ผู้เชี่ยวชาญด้านพระไตรปิฎกศึกษา ภาษาไทย และพุทธปรัชญาเถรวาท`,
      orderIndex: 10,
    },
    create: {
      id: "a1111111-2222-3333-4444-555555555501",
      tenantId: tenant.id,
      firstNameTh: "ไชยา",
      lastNameTh: "เสนแสนยา",
      firstNameEn: "Chaiya",
      lastNameEn: "Sensaenya",
      positionTh: "อาจารย์ประจำหลักสูตรพุทธศาสตรบัณฑิต สาขาวิชาศาสนาและปรัชญา",
      positionEn: "Lecturer in Religion and Philosophy",
      academicPosition: "อาจารย์",
      type: "ACADEMIC",
      departmentId: dept.id,
      email: "chaiya.sen@mcu.ac.th",
      phoneNumber: "098-387-5997",
      contactInfo: "Tel. 098 387 5997, Facebook: ไชยา เสนแสนยา, Line ID: 0983875997",
      educationTh: `พ.ศ. ๒๕๓๓ นักธรรมชั้นเอก วัดศรีบุญเรือง สำนักเรียนคณะจังหวัดเลย กองธรรมสนามหลวง\nพ.ศ. ๒๕๔๒ เปรียญธรรม ๗ ประโยค วัดครุใน สำนักเรียนคณะจังหวัดสมุทรปราการ กองบาลีสนามหลวง\nพ.ศ. ๒๕๔๒ พธ.บ. (ภาษาไทย) ปริญญาพุทธศาสตรบัณฑิต สาขาวิชาภาษาไทย คณะมนุษยศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย\nพ.ศ. ๒๕๔๗ พธ.ม. (พระพุทธศาสนา) ปริญญาพุทธศาสตรมหาบัณฑิต สาขาวิชาพระพุทธศาสนา บัณฑิตวิทยาลัย มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย (วิทยานิพนธ์เรื่อง "ศึกษาทัศนคติและความคาดหวังของครูและนักเรียนที่มีต่อพระภิกษุผู้สอนธรรมศึกษา")\nพ.ศ. ๒๕๖๘ พธ.ด. (ปรัชญา) ปริญญาพุทธศาสตรดุษฎีบัณฑิต สาขาวิชาปรัชญา บัณฑิตวิทยาลัย มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย (ดุษฎีนิพนธ์เรื่อง "แนวคิดเรื่องความดีในพุทธปรัชญาเถรวาท : การศึกษาเชิงวิพากษ์")`,
      experiencesTh: `พ.ศ. ๒๕๕๓ - ๒๕๖๘ : นักจัดการงานทั่วไป หลักสูตรพุทธศาสตรมหาบัณฑิต สาขาวิชาศาสนาเปรียบเทียบ สังกัดคณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย\nพ.ศ. ๒๕๖๔ - ปัจจุบัน : อาจารย์ประจำหลักสูตรพุทธศาสตรบัณฑิต สาขาวิชาศาสนาและปรัชญา ภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์ เลขที่ ๐๒๓๑๐๐๕`,
      bioTh: `อาจารย์ประจำหลักสูตรพุทธศาสตรบัณฑิต สาขาวิชาศาสนาและปรัชญา ภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์ เลขที่ ๐๒๓๑๐๐๕ ผู้เชี่ยวชาญด้านพระไตรปิฎกศึกษา ภาษาไทย และพุทธปรัชญาเถรวาท`,
      orderIndex: 10,
    },
  });

  // 4. Upsert Teacher 2: พระจาตุรงค์ อาจารสุโภ (ชูศรี)
  const chaturong = await prisma.personnel.upsert({
    where: {
      id: "a1111111-2222-3333-4444-555555555502",
    },
    update: {
      firstNameTh: "พระจาตุรงค์ อาจารสุโภ",
      lastNameTh: "(ชูศรี), ดร.",
      firstNameEn: "Phra Chaturong",
      lastNameEn: "Ajarasubho (Chusri), Ph.D.",
      positionTh: "อาจารย์ประจำภาควิชาศาสนาและปรัชญา",
      positionEn: "Lecturer in Religion and Philosophy",
      academicPosition: "อาจารย์",
      type: "ACADEMIC",
      departmentId: dept.id,
      email: "chaturong.chu@mcu.ac.th",
      educationTh: `พ.ศ. ๒๕๔๘ ประโยค ๑-๒\nพ.ศ. ๒๕๕๐ พธ.บ. (สังคมวิทยาและมานุษยวิทยา) มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย\nพ.ศ. ๒๕๕๒ พธ.ม. (ปรัชญา) มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย\nพ.ศ. ๒๕๕๖ พธ.ด. (ปรัชญา) มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย`,
      experiencesTh: `อาจารย์ เลขที่ ๐๒๓๑๐๐๑ ภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์ มจร (คำสั่ง มจร ที่ ๑๖๖๔/๒๕๖๕ บรรจุแต่งตั้งบุคคลเป็นบุคลากรประเภทวิชาการ ตั้งแต่วันที่ ๑๖ มีนาคม ๒๕๖๕)\nภาระงานสอนระดับปริญญาตรี: แนวคิดใหม่ทางศาสนา, พระพุทธศาสนากับปรัชญา, ศาสนากับคนรุ่นใหม่, จริยศาสตร์ประยุกต์, ศาสนากับสถานภาพสตรี, ปรัชญากับศาสนา, จริยศาสตร์, สุนทรียศาสตร์\nภาระงานสอนระดับปริญญาโท: สัมมนาวิทยานิพนธ์, เปรียบเทียบหลักจริยธรรมในศาสนา, พัฒนาการแนวคิดทางศาสนา\nภาระงานสอนระดับปริญญาเอก: ศาสนากับการพัฒนาสังคม, ศาสนากับวิทยาการโลกยุคใหม่, สัมมนาดุษฎีนิพนธ์, สัมมนาปัญหาศาสนาในปัจจุบัน, พัฒนาการแนวคิดใหม่ทางศาสนา, หลักการสานเสวนาทางศาสนา`,
      bioTh: `อาจารย์ประจำภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์ เลขที่ ๐๒๓๑๐๐๑ ผู้เชี่ยวชาญด้านปรัชญา พุทธปรัชญา จริยศาสตร์ และสุนทรียศาสตร์ มีผลงานวิจัยและบทความวิชาการตีพิมพ์ในวารสารระดับชาติต่อเนื่อง`,
      orderIndex: 11,
    },
    create: {
      id: "a1111111-2222-3333-4444-555555555502",
      tenantId: tenant.id,
      firstNameTh: "พระจาตุรงค์ อาจารสุโภ",
      lastNameTh: "(ชูศรี), ดร.",
      firstNameEn: "Phra Chaturong",
      lastNameEn: "Ajarasubho (Chusri), Ph.D.",
      positionTh: "อาจารย์ประจำภาควิชาศาสนาและปรัชญา",
      positionEn: "Lecturer in Religion and Philosophy",
      academicPosition: "อาจารย์",
      type: "ACADEMIC",
      departmentId: dept.id,
      email: "chaturong.chu@mcu.ac.th",
      educationTh: `พ.ศ. ๒๕๔๘ ประโยค ๑-๒\nพ.ศ. ๒๕๕๐ พธ.บ. (สังคมวิทยาและมานุษยวิทยา) มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย\nพ.ศ. ๒๕๕๒ พธ.ม. (ปรัชญา) มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย\nพ.ศ. ๒๕๕๖ พธ.ด. (ปรัชญา) มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย`,
      experiencesTh: `อาจารย์ เลขที่ ๐๒๓๑๐๐๑ ภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์ มจร (คำสั่ง มจร ที่ ๑๖๖๔/๒๕๖๕ บรรจุแต่งตั้งบุคคลเป็นบุคลากรประเภทวิชาการ ตั้งแต่วันที่ ๑๖ มีนาคม ๒๕๖๕)\nภาระงานสอนระดับปริญญาตรี: แนวคิดใหม่ทางศาสนา, พระพุทธศาสนากับปรัชญา, ศาสนากับคนรุ่นใหม่, จริยศาสตร์ประยุกต์, ศาสนากับสถานภาพสตรี, ปรัชญากับศาสนา, จริยศาสตร์, สุนทรียศาสตร์\nภาระงานสอนระดับปริญญาโท: สัมมนาวิทยานิพนธ์, เปรียบเทียบหลักจริยธรรมในศาสนา, พัฒนาการแนวคิดทางศาสนา\nภาระงานสอนระดับปริญญาเอก: ศาสนากับการพัฒนาสังคม, ศาสนากับวิทยาการโลกยุคใหม่, สัมมนาดุษฎีนิพนธ์, สัมมนาปัญหาศาสนาในปัจจุบัน, พัฒนาการแนวคิดใหม่ทางศาสนา, หลักการสานเสวนาทางศาสนา`,
      bioTh: `อาจารย์ประจำภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์ เลขที่ ๐๒๓๑๐๐๑ ผู้เชี่ยวชาญด้านปรัชญา พุทธปรัชญา จริยศาสตร์ และสุนทรียศาสตร์ มีผลงานวิจัยและบทความวิชาการตีพิมพ์ในวารสารระดับชาติต่อเนื่อง`,
      orderIndex: 11,
    },
  });

  // 5. Clear old publications for these 2 teachers to avoid duplicates when re-running
  await prisma.researchPublication.deleteMany({
    where: {
      personnelId: { in: [chaiya.id, chaturong.id] },
    },
  });

  // 6. Insert publications for นายไชยา เสนแสนยา
  const chaiyaPubs = [
    {
      titleTh: "ศาสนารมณ์: เทคนิคการจัดการอารมณ์ตามแนวทางพระพุทธศาสนา",
      titleEn: "Religion and Emotion: A Technique on Emotional Management According to the Principle of Buddhism",
      authors: "นายไชยา เสนแสนยา, พระธรรมวชิรมุนี วิ.,รศ.ดร., รศ.ดร.กฤต ศรียะอาจ, พระครูโกมุทสุวรรณาภรณ์,ดร., พระมหาขวัญชัย กิตฺติเมธี, ผศ.ดร., นางสาวเกษริน บุตรา",
      journalName: "วารสาร มจร ปรัชญาปริทรรศน์",
      volume: "ปีที่ ๙",
      issue: "ฉบับที่ ๑",
      publicationYear: "๒๕๖๙",
      pages: "๒๖๔-๒๗๕",
      issn: "3027-7388 (Online)",
      tier: "TCI กลุ่ม 2",
      type: "RESEARCH",
      url: "https://so06.tci-thaijo.org/index.php/jmpr/article/view/292431/194379",
      orderIndex: 1,
    },
    {
      titleTh: "ท้าวจาตุโลกบาล: การสื่อสารแบบซอฟพาวเวอร์จากเทพสู่วัตถุมงคลทางศาสนาในประเทศไทย",
      titleEn: "The Four Guardian Gods: Soft Power Communication from Gods to Religious Spiritual Materialism in Thailand",
      authors: "พระมหาขวัญชัย เหมประไพ, คงสฤษฎ์ แพงทรัพย์, ไชยา เสนแสนยา และ เพ็ญพรรณ เฟื่องฟูลอย",
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

  for (const pub of chaiyaPubs) {
    await prisma.researchPublication.create({
      data: {
        tenantId: tenant.id,
        personnelId: chaiya.id,
        ...pub,
      },
    });
  }

  // 7. Insert publications for พระจาตุรงค์ อาจารสุโภ (ชูศรี)
  const chaturongPubs = [
    {
      titleTh: "ปรัชญาความขัดแย้ง",
      titleEn: "Philosophy of Conflict",
      authors: "พระมหาดวงเด่น ฐิตญาโณ, พระจาตุรงค์ อาจารสุโภ, พระถนัด วฑฺฒโน, สุมาลัย กาญจนะ",
      journalName: "วารสารสันติศึกษาปริทรรศน์ มจร",
      volume: "ปีที่ ๖",
      issue: "ฉบับที่ ๑",
      publicationYear: "๒๕๖๑",
      pages: "๒๘๔-๒๙๒",
      tier: "TCI กลุ่ม ๑",
      type: "RESEARCH",
      url: "https://so03.tci-thaijo.org/index.php/journal-peace/article/view/107984",
      orderIndex: 1,
    },
    {
      titleTh: "ประโยชน์จากการเผยแผ่ธรรมะออนไลน์ขององค์การธรรมเป็นทีมสากล",
      titleEn: "Benefits of Online Dhamma Propagation by Dhamma as a Global Team Organization",
      authors: "พระจาตุรงค์ ชูศรี, พระมหาสราวุธ โพธิ์ศรีขาม, พระมหาดวงทิพย์ ปริยตฺติธารี",
      journalName: "วารสารสังคมศึกษา ศาสนา และวัฒนธรรม",
      volume: "ปีที่ ๓",
      issue: "ฉบับที่ ๑",
      publicationYear: "๒๕๖๕",
      pages: "๑-๑๓",
      type: "ACADEMIC",
      url: "https://so12.tci-thaijo.org/index.php/src/article/view/59",
      orderIndex: 2,
    },
    {
      titleTh: "ความหลากหลายด้านสถาปัตยกรรมในยุคสุโขทัย: เจดีย์ทรงระฆังและทรงพุ่มข้าวบิณฑ์, ธรรมธารา",
      titleEn: "Architectural Diversity in the Sukhothai Era: Bell-Shaped and Lotus-Bud Stupas",
      authors: "พระมหาสราวุธ โพธิ์ศรีขาม, พระจาตุรงค์ ชูศรี",
      journalName: "วารสารวิชาการทางพระพุทธศาสนา",
      volume: "ปีที่ ๘",
      issue: "ฉบับที่ ๑ (ฉบับรวมที่ ๑๔)",
      publicationYear: "๒๕๖๕",
      pages: "๑๕๗-๒๑๒",
      tier: "TCI ฐาน ๑",
      type: "ACADEMIC",
      url: "https://so01.tci-thaijo.org/index.php/dhammadhara/article/view/249475",
      orderIndex: 3,
    },
    {
      titleTh: "การปฏิเสธอัตตาของพระพุทธเจ้าในพระไตรปิฎก",
      titleEn: "The Buddha's Denial of Atta (Self) in the Tipitaka",
      authors: "พระมหาสราวุธ โพธิ์ศรีขาม, พระจาตุรงค์ ชูศรี, พระปลัดบุญช่วย ฐิตจิตฺโต (ยังสามารถ)",
      journalName: "วารสาร มจร พุทธศาสตร์ปริทรรศน์",
      volume: "ปีที่ ๕",
      issue: "ฉบับที่ ๒",
      publicationYear: "๒๕๖๔",
      pages: "๑๑๘-๑๓๖",
      tier: "TCI ฐาน ๒",
      type: "ACADEMIC",
      url: "https://so06.tci-thaijo.org/index.php/jmb/article/view/252501",
      orderIndex: 4,
    },
    {
      titleTh: "จริยศาสตร์",
      titleEn: "Ethics",
      authors: "พระจาตุรงค์ ชูศรี,ดร.",
      journalName: "วารสารสังคมศึกษา ศาสนา และวัฒนธรรม",
      volume: "ปีที่ ๒",
      issue: "ฉบับที่ ๑",
      publicationYear: "๒๕๖๔",
      pages: "๔๘-๕๖",
      type: "ACADEMIC",
      url: "https://so12.tci-thaijo.org/index.php/src/article/view/45",
      orderIndex: 5,
    },
    {
      titleTh: "คุณวิทยา : คุณค่าคืออะไร? วาทกรรมว่าด้วยความจริง ความดีและความงาม",
      titleEn: "Axiology : What is Value? Discourse on Truth, Goodness, and Beauty",
      authors: "พระจาตุรงค์ อาจารสุโภ",
      journalName: "วารสารชัยภูมิปริทรรศน์",
      volume: "ปีที่ ๔",
      issue: "ฉบับที่ ๓",
      publicationYear: "๒๕๖๔",
      pages: "๓๑-๓๗",
      type: "ACADEMIC",
      url: "https://so02.tci-thaijo.org/index.php/jcr/article/view/249884",
      orderIndex: 6,
    },
    {
      titleTh: "วิเคราะห์ปรากฏการณ์วิทยาของฮุสเซิร์ล",
      titleEn: "An Analysis of Husserl's Phenomenology",
      authors: "พระจาตุรงค์ อาจารสุโภ",
      journalName: "วารสารวิจัยธรรมศึกษา ศูนย์วิจัยธรรมศึกษา สำนักเรียนวัดอาวุธวิกสิตาราม",
      volume: "ปีที่ ๓",
      issue: "ฉบับที่ ๑",
      publicationYear: "๒๕๖๓",
      pages: "๑-๙",
      tier: "TCI กลุ่ม ๒",
      type: "ACADEMIC",
      url: "https://www.awut.org/ojs/index.php/dsr/article/view/22",
      orderIndex: 7,
    },
    {
      titleTh: "สุนทรียศาสตร์อุโบสถวัดร่องขุ่น",
      titleEn: "Aesthetics of Wat Rong Khun's Ubosot",
      authors: "พระจาตุรงค์ อาจารสุโภ",
      journalName: "วารสารสังคมศึกษา มมร สาขาวิชาการสอนสังคมศึกษา",
      volume: "ปีที่ ๑",
      issue: "ฉบับที่ ๑",
      publicationYear: "๒๕๖๓",
      pages: "๓๙-๕๐",
      type: "ACADEMIC",
      url: "http://ojs.mbu.ac.th/index.php/josmbu/article/view/683",
      orderIndex: 8,
    },
    {
      titleTh: "การทำความเข้าใจความทุกข์โดยการทำความเข้าใจธรรมชาติของมนุษย์",
      titleEn: "Understanding Suffering through Understanding Human Nature",
      authors: "พระจาตุรงค์ อาจารสุโภ",
      journalName: "วารสารพุทธมัคค์ ศูนย์วิจัยธรรมศึกษา สำนักเรียนวัดอาวุธวิกสิตาราม",
      volume: "ปีที่ ๔",
      issue: "ฉบับที่ ๒",
      publicationYear: "๒๕๖๒",
      pages: "๒๐-๓๐",
      type: "ACADEMIC",
      url: "https://so01.tci-thaijo.org/index.php/bdm/article/view/233569",
      orderIndex: 9,
    },
    {
      titleTh: "เรื่องไร้สาระในคัมภีร์พระพุทธศาสนา",
      titleEn: "Nonsense in Buddhist Scriptures",
      authors: "พระจาตุรงค์ อาจารสุโภ",
      journalName: "วารสารวิจัยธรรมศึกษา ศูนย์วิจัยธรรมศึกษา สำนักเรียนวัดอาวุธวิกสิตาราม",
      volume: "ปีที่ ๒",
      issue: "ฉบับที่ ๒",
      publicationYear: "๒๕๖๒",
      pages: "๑-๗",
      type: "ACADEMIC",
      url: "https://www.awut.org/ojs/index.php/dsr/article/view/7",
      orderIndex: 10,
    },
    {
      titleTh: "การอ้างสิทธิในการฆ่าตัวตายกับหลักกรรมในพระพุทธศาสนา",
      titleEn: "Claiming the Right to Suicide and the Law of Kamma in Buddhism",
      authors: "พระจาตุรงค์ อาจารสุโภ",
      journalName: "วารสารชัยภูมิปริทรรศน์",
      volume: "ปีที่ ๒",
      issue: "ฉบับที่ ๒",
      publicationYear: "๒๕๖๒",
      pages: "๑๖-๒๙",
      type: "ACADEMIC",
      url: "https://so02.tci-thaijo.org/index.php/jcr/article/view/246259",
      orderIndex: 11,
    },
    {
      titleTh: "การปรับเปลี่ยนพฤติกรรมให้มีเมตตาโดยการคบคนดี",
      titleEn: "Behavior Modification towards Loving-Kindness by Associating with Good People",
      authors: "พระจาตุรงค์ อาจารสุโภ",
      journalName: "วารสารพุทธมัคค์ ศูนย์วิจัยธรรมศึกษา สำนักเรียนวัดอาวุธวิกสิตาราม",
      volume: "ปีที่ ๔",
      issue: "ฉบับที่ ๑",
      publicationYear: "๒๕๖๒",
      pages: "๒๗-๓๗",
      tier: "TCI กลุ่ม ๒",
      type: "ACADEMIC",
      url: "https://so01.tci-thaijo.org/index.php/bdm/article/view/187402",
      orderIndex: 12,
    },
    {
      titleTh: "ข้อยืนยันสาระสำคัญของอภิปรัชญาเชน",
      titleEn: "Essential Affirmations of Jaina Metaphysics",
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

  for (const pub of chaturongPubs) {
    await prisma.researchPublication.create({
      data: {
        tenantId: tenant.id,
        personnelId: chaturong.id,
        ...pub,
      },
    });
  }

  console.log("Successfully seeded 2 teachers and " + (chaiyaPubs.length + chaturongPubs.length) + " research publications!");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
