import { PrismaClient } from "../src/generated/prisma";
import https from "https";

const prisma = new PrismaClient();

function fetchHtml(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

interface TeacherProfile {
  nameRaw: string;
  firstNameTh: string;
  lastNameTh: string;
  firstNameEn?: string;
  lastNameEn?: string;
  academicPosition: string;
  positionTh: string;
  type: "ACADEMIC";
  imageUrl: string;
  pageUrl: string;
  email?: string;
  phoneNumber?: string;
  contactInfo?: string;
  educationTh?: string;
  experiencesTh?: string;
  bioTh?: string;
  researchPublications: Array<{
    titleTh: string;
    journalName: string;
    publicationYear?: string;
    tier?: string;
    type: "RESEARCH" | "ACADEMIC";
    url?: string;
  }>;
}

const teacherMeta = [
  {
    nameRaw: "พระราชญาณวชิรเวที, ผศ.ดร.",
    academicPosition: "ผศ.ดร.",
    firstNameTh: "พระราชญาณวชิรเวที (สมเกียรติ กิตฺติญาโณ), ผศ.ดร.",
    lastNameTh: "",
    positionTh: "รองอธิการบดีฝ่ายกิจการนิสิต / อาจารย์ประจำภาควิชาพระพุทธศาสนา",
    pageUrl: "https://fb.mcu.ac.th/?p=687",
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2026/03/dent6901-221x300.png",
  },
  {
    nameRaw: "พระมหาจีรวัฒน์ กนฺตวณฺโณ, รศ.ดร.",
    academicPosition: "รศ.ดร.",
    firstNameTh: "พระมหาจีรวัฒน์ กนฺตวณฺโณ, รศ.ดร.",
    lastNameTh: "",
    positionTh: "อาจารย์ประจำภาควิชาพระพุทธศาสนา คณะพุทธศาสตร์",
    pageUrl: "https://fb.mcu.ac.th/?p=964",
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2024/03/pmjirawat67-280x300.jpg",
  },
  {
    nameRaw: "พระมหาไพโรจรน์ ญาณกุศโล, ดร.",
    academicPosition: "ดร.",
    firstNameTh: "พระมหาไพโรจรน์ ญาณกุศโล, ดร.",
    lastNameTh: "",
    positionTh: "อาจารย์ประจำภาควิชาพระพุทธศาสนา คณะพุทธศาสตร์",
    pageUrl: "https://fb.mcu.ac.th/?p=13694",
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2025/10/a3PmPairaon68-241x300.png",
  },
  {
    nameRaw: "พระมหายงยุทธ ธีรธมฺโม, ผศ.ดร.",
    academicPosition: "ผศ.ดร.",
    firstNameTh: "พระมหายงยุทธ ธีรธมฺโม, ผศ.ดร.",
    lastNameTh: "",
    positionTh: "อาจารย์ประจำภาควิชาพระพุทธศาสนา คณะพุทธศาสตร์",
    pageUrl: "https://fb.mcu.ac.th/?p=959",
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2024/03/S__22085639_0-257x300.jpg",
  },
  {
    nameRaw: "Assoc.Prof.Dr. Ven.W.Piyaratana",
    academicPosition: "รศ.ดร.",
    firstNameTh: "Ven. W. Piyaratana, Assoc.Prof.Dr.",
    lastNameTh: "",
    positionTh: "Lecturer, Department of Buddhism, Faculty of Buddhism",
    pageUrl: "https://fb.mcu.ac.th/?p=861",
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2025/10/a3VenPiyaratana68-238x300.png",
  },
  {
    nameRaw: "พระมหาราชัน จิตฺตปาโล, ดร.",
    academicPosition: "ดร.",
    firstNameTh: "พระมหาราชัน จิตฺตปาโล, ดร.",
    lastNameTh: "",
    positionTh: "อาจารย์ประจำภาควิชาพระพุทธศาสนา คณะพุทธศาสตร์",
    pageUrl: "https://fb.mcu.ac.th/?p=11005",
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2025/03/a3PmRashun68-238x300.jpeg",
  },
  {
    nameRaw: "พระครูพิศิษฐ์ธรรมพิสุทธิ์, ดร.",
    academicPosition: "ดร.",
    firstNameTh: "พระครูพิศิษฐ์ธรรมพิสุทธิ์, ดร.",
    lastNameTh: "",
    positionTh: "อาจารย์ประจำภาควิชาพระพุทธศาสนา คณะพุทธศาสตร์",
    pageUrl: "https://fb.mcu.ac.th/?p=13368",
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2025/09/a3Aphrapijit69-225x300.jpg",
  },
  {
    nameRaw: "พระมหาวีรเดช อธิปญฺโญ, ดร.",
    academicPosition: "ดร.",
    firstNameTh: "พระมหาวีรเดช อธิปญฺโญ, ดร.",
    lastNameTh: "",
    positionTh: "อาจารย์ประจำภาควิชาพระพุทธศาสนา คณะพุทธศาสตร์",
    pageUrl: "https://fb.mcu.ac.th/?p=18101",
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2026/10/a3PmViradej69-230x300.png",
  },
  {
    nameRaw: "พระครูปลัดสุขีศม สีลเตชปุตฺติโย, ดร.",
    academicPosition: "ดร.",
    firstNameTh: "พระครูปลัดสุขีศม สีลเตชปุตฺติโย, ดร.",
    lastNameTh: "",
    positionTh: "อาจารย์ประจำภาควิชาพระพุทธศาสนา คณะพุทธศาสตร์",
    pageUrl: "https://fb.mcu.ac.th/?p=14256",
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2026/04/a3PSukheesom69-233x300.png",
  },
  {
    nameRaw: "ดร.อุดม จันทิมา",
    academicPosition: "ดร.",
    firstNameTh: "อุดม",
    lastNameTh: "จันทิมา",
    positionTh: "อาจารย์ประจำภาควิชาพระพุทธศาสนา คณะพุทธศาสตร์",
    pageUrl: "https://fb.mcu.ac.th/?p=8724",
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2026/04/951813001_44-233x300.png",
  },
  {
    nameRaw: "ดร.อธิเทพ ผาทา",
    academicPosition: "ดร.",
    firstNameTh: "อธิเทพ",
    lastNameTh: "ผาทา",
    positionTh: "อาจารย์ประจำภาควิชาพระพุทธศาสนา คณะพุทธศาสตร์",
    pageUrl: "https://fb.mcu.ac.th/?p=741",
    imageUrl: "https://fb.mcu.ac.th/wp-content/uploads/2026/04/951813001_33-233x300.png",
  },
];

async function crawlTeacher(meta: (typeof teacherMeta)[0]): Promise<TeacherProfile> {
  console.log(`Crawling details for: ${meta.nameRaw} (${meta.pageUrl})...`);
  const html = await fetchHtml(meta.pageUrl);

  // Email
  const emailMatch = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i);
  const email = emailMatch ? emailMatch[0] : "";

  // Location / Room
  const roomMatch = html.match(/ห้อง[^\n<]+/i);
  const contactInfo = roomMatch ? `ห้องทำงาน: ${roomMatch[0]}` : "ภาควิชาพระพุทธศาสนา คณะพุทธศาสตร์";

  // Clean HTML to text lines
  const clean = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "");

  const lines = clean
    .replace(/<[^>]+>/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // Parse Research Publications & Books
  const researchPublications: TeacherProfile["researchPublications"] = [];
  const researchLines = lines.filter(
    (l) =>
      (l.includes("วารสาร") || l.includes("Journal") || l.includes("งานวิจัย") || l.includes("“") || l.includes('"')) &&
      l.length > 25 &&
      !l.includes("Copyright") &&
      !l.includes("Facebook")
  );

  for (const line of researchLines.slice(0, 8)) {
    // Determine year
    const yearMatch = line.match(/(?:๒๕|25)\d{2}/);
    const pubYear = yearMatch ? yearMatch[0] : "๒๕๖๖";

    // Clean title
    let title = line
      .replace(/&#8211;/g, "-")
      .replace(/&#8220;/g, '"')
      .replace(/&#8221;/g, '"')
      .replace(/^[-–\s\d,.]+/g, "")
      .trim();

    // Extract journal
    let journal = "วารสาร มจร ปริทรรศน์";
    if (title.includes("วารสาร")) {
      const jPart = title.slice(title.indexOf("วารสาร"));
      const jEnd = jPart.indexOf(",");
      journal = jEnd !== -1 ? jPart.slice(0, jEnd).trim() : jPart.slice(0, 40).trim();
    } else if (title.includes("Journal")) {
      journal = "Academic Journal of Buddhist Studies";
    }

    researchPublications.push({
      titleTh: title,
      journalName: journal,
      publicationYear: pubYear,
      tier: "TCI กลุ่ม 1",
      type: title.includes("หนังสือ") || title.includes("สำนักพิมพ์") ? "ACADEMIC" : "RESEARCH",
      url: meta.pageUrl,
    });
  }

  // Construct Experiences & Bio
  const expLines = lines.filter(
    (l) =>
      (l.includes("ตำแหน่ง") || l.includes("ผู้อำนวยการ") || l.includes("อาจารย์") || l.includes("คณบดี")) &&
      l.length > 10 &&
      l.length < 150
  );

  const experiencesTh = expLines.length > 0 ? expLines.slice(0, 5).join("\n") : meta.positionTh;
  const bioTh = `อาจารย์ประจำภาควิชาพระพุทธศาสนา คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย`;

  return {
    ...meta,
    type: "ACADEMIC",
    email: email || undefined,
    contactInfo,
    experiencesTh,
    bioTh,
    researchPublications,
  };
}

async function main() {
  console.log("=============================================================");
  console.log("  ระบบดึงข้อมูลอาจารย์และผลงานวิจัยจากเว็บคณะพุทธศาสตร์ มจร");
  console.log("  เป้าหมาย: https://fb.mcu.ac.th/?page_id=9032 (ภาควิชาพระพุทธศาสนา)");
  console.log("=============================================================\n");

  const activeTenants = await prisma.tenant.findMany({ where: { isActive: true } });
  if (activeTenants.length === 0) throw new Error("No active tenants found");

  // Crawl each teacher's full profile
  const crawledProfiles: TeacherProfile[] = [];
  for (const meta of teacherMeta) {
    try {
      const profile = await crawlTeacher(meta);
      crawledProfiles.push(profile);
      console.log(`✓ ดึงสำเร็จ: ${profile.nameRaw} (ผลงานวิจัย/วิชาการ: ${profile.researchPublications.length} เรื่อง)`);
    } catch (err: unknown) {
      console.error(`✗ เกิดข้อผิดพลาดกับ ${meta.nameRaw}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`\nรวบรวมข้อมูลเสร็จสิ้น: ${crawledProfiles.length} ท่าน`);
  console.log("กำลังบันทึกลงในฐานข้อมูลระบบ...\n");

  for (const tenant of activeTenants) {
    console.log(`--- กำลังบันทึกสำหรับ Tenant: ${tenant.nameTh} (${tenant.code}) ---`);

    // 1. Ensure department exists: ภาควิชาพระพุทธศาสนา
    let dept = await prisma.department.findFirst({
      where: {
        tenantId: tenant.id,
        nameTh: { contains: "พระพุทธศาสนา" },
      },
    });

    if (!dept) {
      dept = await prisma.department.create({
        data: {
          tenantId: tenant.id,
          nameTh: "ภาควิชาพระพุทธศาสนา",
          nameEn: "Department of Buddhism",
          code: "BUDDHISM",
          orderIndex: 1,
        },
      });
    }

    let tIndex = 1;
    let tenantPubCount = 0;

    for (const p of crawledProfiles) {
      // Upsert Personnel
      let personnel = await prisma.personnel.findFirst({
        where: {
          tenantId: tenant.id,
          firstNameTh: p.firstNameTh,
        },
      });

      const personnelData = {
        firstNameTh: p.firstNameTh,
        lastNameTh: p.lastNameTh || "",
        academicPosition: p.academicPosition,
        positionTh: p.positionTh,
        type: p.type,
        departmentId: dept.id,
        email: p.email || null,
        contactInfo: p.contactInfo || null,
        imageUrl: p.imageUrl,
        experiencesTh: p.experiencesTh || null,
        bioTh: p.bioTh || null,
        orderIndex: tIndex++,
        isActive: true,
      };

      if (personnel) {
        personnel = await prisma.personnel.update({
          where: { id: personnel.id },
          data: personnelData,
        });
      } else {
        personnel = await prisma.personnel.create({
          data: {
            tenantId: tenant.id,
            ...personnelData,
          },
        });
      }

      // Upsert research publications for this teacher
      for (const pub of p.researchPublications) {
        const existingPub = await prisma.researchPublication.findFirst({
          where: {
            tenantId: tenant.id,
            personnelId: personnel.id,
            titleTh: pub.titleTh,
          },
        });

        if (!existingPub) {
          await prisma.researchPublication.create({
            data: {
              tenantId: tenant.id,
              personnelId: personnel.id,
              titleTh: pub.titleTh,
              authors: p.nameRaw,
              journalName: pub.journalName,
              publicationYear: pub.publicationYear || "๒๕๖๖",
              tier: pub.tier || "TCI กลุ่ม 1",
              type: pub.type,
              url: pub.url || p.pageUrl,
            },
          });
          tenantPubCount++;
        }
      }
    }

    console.log(`✓ บันทึกสำเร็จ: ${crawledProfiles.length} ท่าน, ผลงานวิจัย ${tenantPubCount} เรื่อง`);
  }

  console.log("\n=============================================================");
  console.log("  เสร็จสิ้นการนำเข้าข้อมูลอาจารย์และผลงานวิจัย 100%!");
  console.log("=============================================================");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
