import { PrismaClient } from "../src/generated/prisma";

const db = new PrismaClient();

interface RawStudent {
  code: string;
  rawName: string;
  yearLevel: number;
  major: "Religion and Philosophy" | "Buddhist Studies";
}

const YEAR_3_AND_4_STUDENTS: RawStudent[] = [
  // =========================================================================
  // YEAR 3: Buddhist Studies (23 students)
  // =========================================================================
  { code: "6701501003", rawName: "Kelasa -", yearLevel: 3, major: "Buddhist Studies" },
  { code: "6701501014", rawName: "Aunkan Barua", yearLevel: 3, major: "Buddhist Studies" },
  { code: "6701501015", rawName: "Bijoy Barua", yearLevel: 3, major: "Buddhist Studies" },
  { code: "6701501017", rawName: "Hero Barua", yearLevel: 3, major: "Buddhist Studies" },
  { code: "6701501021", rawName: "Nanda Dhama", yearLevel: 3, major: "Buddhist Studies" },
  { code: "6701501023", rawName: "Nguyen Quoc Trung", yearLevel: 3, major: "Buddhist Studies" },
  { code: "6701501026", rawName: "Vizaya", yearLevel: 3, major: "Buddhist Studies" },
  { code: "6701501029", rawName: "Sajib Barua", yearLevel: 3, major: "Buddhist Studies" },
  { code: "6701501040", rawName: "Thiha Narda", yearLevel: 3, major: "Buddhist Studies" },
  { code: "6701501041", rawName: "Ashin Aggacara", yearLevel: 3, major: "Buddhist Studies" },
  { code: "6701501042", rawName: "Tran Quang Tu", yearLevel: 3, major: "Buddhist Studies" },
  { code: "6701501053", rawName: "Arcinna", yearLevel: 3, major: "Buddhist Studies" },
  { code: "6701501054", rawName: "Arsawkadhamma", yearLevel: 3, major: "Buddhist Studies" },
  { code: "6701501055", rawName: "Candardhika", yearLevel: 3, major: "Buddhist Studies" },
  { code: "6701501056", rawName: "Gonttannya", yearLevel: 3, major: "Buddhist Studies" },
  { code: "6701501057", rawName: "Iddhimaya -", yearLevel: 3, major: "Buddhist Studies" },
  { code: "6701501058", rawName: "Lam Sam Bach", yearLevel: 3, major: "Buddhist Studies" },
  { code: "6701501059", rawName: "Jotiparla -", yearLevel: 3, major: "Buddhist Studies" },
  { code: "6701501060", rawName: "Pannyasiha -", yearLevel: 3, major: "Buddhist Studies" },
  { code: "6701501061", rawName: "Rajan Barua", yearLevel: 3, major: "Buddhist Studies" },
  { code: "6701501063", rawName: "Utama", yearLevel: 3, major: "Buddhist Studies" },
  { code: "6701501076", rawName: "Kaw Vidahtaja", yearLevel: 3, major: "Buddhist Studies" },
  { code: "6701501091", rawName: "Nguyen Tan Dat", yearLevel: 3, major: "Buddhist Studies" },

  // =========================================================================
  // YEAR 3: Religion and Philosophy (9 students)
  // =========================================================================
  { code: "6701501030", rawName: "Apolu Barua", yearLevel: 3, major: "Religion and Philosophy" },
  { code: "6701501031", rawName: "Puspankar Bhoud", yearLevel: 3, major: "Religion and Philosophy" },
  { code: "6701501032", rawName: "Jakson Barua Emo", yearLevel: 3, major: "Religion and Philosophy" },
  { code: "6701501068", rawName: "Kim Pisay Sambac", yearLevel: 3, major: "Religion and Philosophy" },
  { code: "6701501069", rawName: "Lam Hai", yearLevel: 3, major: "Religion and Philosophy" },
  { code: "6701501070", rawName: "Marnita", yearLevel: 3, major: "Religion and Philosophy" },
  { code: "6701501071", rawName: "Suwanna", yearLevel: 3, major: "Religion and Philosophy" },
  { code: "6701501072", rawName: "Thach Hon", yearLevel: 3, major: "Religion and Philosophy" },
  { code: "6701501073", rawName: "Tri Chanh Tha", yearLevel: 3, major: "Religion and Philosophy" },

  // =========================================================================
  // YEAR 4: Religion and Philosophy (16 students)
  // =========================================================================
  { code: "6601501004", rawName: "Pannadipa", yearLevel: 4, major: "Religion and Philosophy" },
  { code: "6601501046", rawName: "Ariya", yearLevel: 4, major: "Religion and Philosophy" },
  { code: "6601501047", rawName: "Channa An", yearLevel: 4, major: "Religion and Philosophy" },
  { code: "6601501048", rawName: "Chheang Seak", yearLevel: 4, major: "Religion and Philosophy" },
  { code: "6601501049", rawName: "Do Tan An", yearLevel: 4, major: "Religion and Philosophy" },
  { code: "6601501052", rawName: "San Dimar", yearLevel: 4, major: "Religion and Philosophy" },
  { code: "6601501053", rawName: "Soc Khan Thach", yearLevel: 4, major: "Religion and Philosophy" },
  { code: "6601501054", rawName: "Soriya", yearLevel: 4, major: "Religion and Philosophy" },
  { code: "6601501056", rawName: "Uttama", yearLevel: 4, major: "Religion and Philosophy" },
  { code: "6601501057", rawName: "Wicitta", yearLevel: 4, major: "Religion and Philosophy" },
  { code: "6601501058", rawName: "Mr. Khun Maung Chan Aung", yearLevel: 4, major: "Religion and Philosophy" },
  { code: "6601501059", rawName: "Mr. Supan Chakma", yearLevel: 4, major: "Religion and Philosophy" },
  { code: "6601501083", rawName: "Kantitharra", yearLevel: 4, major: "Religion and Philosophy" },
  { code: "6601501085", rawName: "Son Ngoc Vu", yearLevel: 4, major: "Religion and Philosophy" },
  { code: "6601501086", rawName: "Thach Sol", yearLevel: 4, major: "Religion and Philosophy" },
  { code: "6601501087", rawName: "Thach Thanh", yearLevel: 4, major: "Religion and Philosophy" },

  // =========================================================================
  // YEAR 4: Buddhist Studies (28 students)
  // =========================================================================
  { code: "6601501014", rawName: "Tran Thi My Hau", yearLevel: 4, major: "Buddhist Studies" },
  { code: "6601501015", rawName: "Hridoy Barua", yearLevel: 4, major: "Buddhist Studies" },
  { code: "6601501016", rawName: "Soyel Barua", yearLevel: 4, major: "Buddhist Studies" },
  { code: "6601501017", rawName: "Bhikkhuni Kalaganwaththe Padmananda Silmathawa", yearLevel: 4, major: "Buddhist Studies" },
  { code: "6601501018", rawName: "Sucitta", yearLevel: 4, major: "Buddhist Studies" },
  { code: "6601501021", rawName: "Acinna", yearLevel: 4, major: "Buddhist Studies" },
  { code: "6601501022", rawName: "Tay Zein Da", yearLevel: 4, major: "Buddhist Studies" },
  { code: "6601501028", rawName: "Kissana", yearLevel: 4, major: "Buddhist Studies" },
  { code: "6601501030", rawName: "Bhikkhuni Le Thi Phuong Nhi", yearLevel: 4, major: "Buddhist Studies" },
  { code: "6601501032", rawName: "Sushil Barua", yearLevel: 4, major: "Buddhist Studies" },
  { code: "6601501033", rawName: "Dhammananda", yearLevel: 4, major: "Buddhist Studies" },
  { code: "6601501037", rawName: "Thiha", yearLevel: 4, major: "Buddhist Studies" },
  { code: "6601501039", rawName: "Pyinarzawta", yearLevel: 4, major: "Buddhist Studies" },
  { code: "6601501040", rawName: "Mandanasara", yearLevel: 4, major: "Buddhist Studies" },
  { code: "6601501041", rawName: "Si La Won Sa", yearLevel: 4, major: "Buddhist Studies" },
  { code: "6601501042", rawName: "Adicca", yearLevel: 4, major: "Buddhist Studies" },
  { code: "6601501043", rawName: "Rijon Chakma", yearLevel: 4, major: "Buddhist Studies" },
  { code: "6601501044", rawName: "Guniya", yearLevel: 4, major: "Buddhist Studies" },
  { code: "6601501073", rawName: "Indavansa", yearLevel: 4, major: "Buddhist Studies" },
  { code: "6601501074", rawName: "Koliya", yearLevel: 4, major: "Buddhist Studies" },
  { code: "6601501075", rawName: "Kuthala", yearLevel: 4, major: "Buddhist Studies" },
  { code: "6601501078", rawName: "Sonviene Thamniempanya", yearLevel: 4, major: "Buddhist Studies" },
  { code: "6601501079", rawName: "Sonjoy Barua", yearLevel: 4, major: "Buddhist Studies" },
  { code: "6601501082", rawName: "Bhikkhuni Quach Thi Diu", yearLevel: 4, major: "Buddhist Studies" },
  { code: "6601501088", rawName: "Truong Tang", yearLevel: 4, major: "Buddhist Studies" },
  { code: "6601501094", rawName: "Pahalawela Dhammakitthi Thero", yearLevel: 4, major: "Buddhist Studies" },
  { code: "6601501095", rawName: "Rev Pitawala Vimaladhamma Thero", yearLevel: 4, major: "Buddhist Studies" },
  { code: "6601501099", rawName: "Kundala", yearLevel: 4, major: "Buddhist Studies" },
];

function parseName(raw: string) {
  let clean = raw.trim().replace(/\s+/g, " ");
  let title = "";
  let gender = "ชาย";

  if (clean.startsWith("Bhikkhuni ")) {
    title = "Bhikkhuni";
    gender = "หญิง";
    clean = clean.replace(/^Bhikkhuni\s+/, "");
  } else if (clean.startsWith("Mr. ")) {
    title = "Mr.";
    gender = "ชาย";
    clean = clean.replace(/^Mr\.\s+/, "");
  } else if (clean.startsWith("Rev ")) {
    title = "Rev.";
    gender = "ชาย";
    clean = clean.replace(/^Rev\s+/, "");
  }

  const parts = clean.split(" ");
  if (parts.length === 1) {
    return { title, firstName: parts[0], lastName: "-", gender };
  }
  if (parts.length === 2) {
    return { title, firstName: parts[0], lastName: parts[1], gender };
  }
  return {
    title,
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1],
    gender,
  };
}

async function main() {
  console.log("=== เริ่มต้นนำเข้ารายชื่อนิสิต ชั้นปีที่ 3 และ ปีที่ 4 (ภาคภาษาอังกฤษ 76 คน) ===");

  const tenants = await db.tenant.findMany();
  console.log(`พบ ${tenants.length} tenants ในระบบ:`, tenants.map(t => `${t.nameTh} (${t.code})`).join(", "));

  for (const tenant of tenants) {
    console.log(`\n--- ดำเนินการกับ Tenant: ${tenant.nameTh} (${tenant.code}) ---`);

    let countYear3 = 0;
    let countYear4 = 0;

    for (const item of YEAR_3_AND_4_STUDENTS) {
      const { title, firstName, lastName, gender } = parseName(item.rawName);
      const department =
        item.major === "Religion and Philosophy"
          ? "ภาควิชาศาสนาและปรัชญา"
          : "ภาควิชาพระพุทธศาสนา";
      const curriculumName = `พุทธศาสตรบัณฑิต สาขาวิชา${item.major === "Religion and Philosophy" ? "ศาสนาและปรัชญา" : "พระพุทธศาสนา"} (หลักสูตรภาษาอังกฤษ)`;

      await db.student.upsert({
        where: {
          tenantId_studentCode: {
            tenantId: tenant.id,
            studentCode: item.code,
          },
        },
        create: {
          tenantId: tenant.id,
          studentCode: item.code,
          title,
          firstName,
          lastName,
          yearLevel: item.yearLevel,
          degree: "ปริญญาตรี",
          curriculumName,
          department,
          major: item.major,
          gender,
          studyStatus: "ปกติ",
          faculty: "คณะพุทธศาสตร์",
          isActive: true,
        },
        update: {
          title: title || undefined,
          firstName,
          lastName,
          yearLevel: item.yearLevel,
          degree: "ปริญญาตรี",
          curriculumName,
          department,
          major: item.major,
          gender,
          studyStatus: "ปกติ",
          isActive: true,
        },
      });

      if (item.yearLevel === 3) countYear3++;
      if (item.yearLevel === 4) countYear4++;
    }

    console.log(`  ✓ บันทึกสำเร็จ: ปี 3 จำนวน ${countYear3} คน, ปี 4 จำนวน ${countYear4} คน (รวม ${countYear3 + countYear4} คน)`);

    // สรุปยอดรวมนิสิตทุกชั้นปีในระบบ
    const y1 = await db.student.count({ where: { tenantId: tenant.id, yearLevel: 1 } });
    const y2 = await db.student.count({ where: { tenantId: tenant.id, yearLevel: 2 } });
    const y3 = await db.student.count({ where: { tenantId: tenant.id, yearLevel: 3 } });
    const y4 = await db.student.count({ where: { tenantId: tenant.id, yearLevel: 4 } });
    console.log(`  สรุปยอดนิสิตทุกชั้นปีของ ${tenant.nameTh}: ปี 1 = ${y1}, ปี 2 = ${y2}, ปี 3 = ${y3}, ปี 4 = ${y4} (รวมทั้งหมด ${y1 + y2 + y3 + y4} คน)`);
  }

  console.log("\n=== นำเข้าข้อมูลนิสิตปี 3 และ ปี 4 ภาคภาษาอังกฤษเสร็จสมบูรณ์ครบทั้ง 76 คน ===");
}

main()
  .catch((e) => {
    console.error("Error importing students:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
