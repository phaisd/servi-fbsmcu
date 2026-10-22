import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

interface TeacherCluster {
  masterName: string;
  nameEn?: string;
  defaultEmailPrefix?: string;
  aliases: string[];
}

const TEACHER_CLUSTERS: TeacherCluster[] = [
  // 1. Dual Thai & English Instructors
  {
    masterName: "พระมหาจรูญ กิตฺติปญฺโญ, อ.ดร.",
    nameEn: "Phramaha Jaroon Kittipanno, Ph.D.",
    defaultEmailPrefix: "jaroon.kit",
    aliases: [
      "พระมหาจรูญ กิตฺติปญฺโญ, อ.ดร.",
      "Phramaha Jaroon Kittipanno, Ph.D.",
    ],
  },
  {
    masterName: "พระมหานิรันดร์ กลฺยาณเมธี, อ.ดร.",
    nameEn: "Phramaha Niran Kalyanamedhi, Ph.D.",
    defaultEmailPrefix: "niran.kal",
    aliases: [
      "พระมหานิรันดร์ กลฺยาณเมธี, อ.ดร.",
      "Phramaha Niran Kalyanamedhi, Ph.D.",
    ],
  },
  {
    masterName: "พระมหายุทธนา นรเชฏฺโฐ, รศ.ดร.",
    nameEn: "Assoc. Prof. Phramaha Yutthana Narajettho, Ph.D",
    defaultEmailPrefix: "yutthana.nar",
    aliases: [
      "พระมหายุทธนา นรเชฏฺโฐ, รศ.ดร.",
      "Assoc. Prof. Phramaha Yutthana Narajettho, Ph.D",
    ],
  },
  {
    masterName: "พระมหาวีรเดช อธิปญฺโญ, อ.ดร.",
    nameEn: "Phramaha Veeradej Adhipanno, Ph.D.",
    defaultEmailPrefix: "veeradej.adh",
    aliases: [
      "พระมหาวีรเดช อธิปญฺโญ, อ.ดร.",
      "Phramaha Veeradej Adhipanno, Ph.D.",
    ],
  },
  {
    masterName: "พระมหายงยุทธ ธีรธมฺโม, ผศ.ดร.",
    nameEn: "Asst. Prof. Phramaha Yongyut Dhiradhammo, Ph.D.",
    defaultEmailPrefix: "yongyut.dhi",
    aliases: [
      "พระมหายงยุทธ ธีรธมฺโม, ผศ.ดร.",
      "Asst. Prof. Phramaha Yongyut Dhiradhammo, Ph.D.",
    ],
  },
  {
    masterName: "ผศ.ดร.ธนาธิป ฮาดเนาลี",
    nameEn: "Dr. Dhanardhip Hardnualee",
    defaultEmailPrefix: "dhanardhip.h",
    aliases: [
      "ผศ.ดร.ธนาธิป ฮาดเนาลี",
      "Dr. Dhanardhip Hardnualee",
    ],
  },
  {
    masterName: "พระครูสิริรัตนบัณฑิต, ผศ.ดร.",
    nameEn: "Asst. Prof. Phra Sitthivajarabundit, Ph.D.",
    defaultEmailPrefix: "siriratan.ban",
    aliases: [
      "พระครูสิริรัตนบัณฑิต, ผศ.ดร.",
      "Asst. Prof. Phra Sitthivajarabundit, Ph.D.",
    ],
  },
  {
    masterName: "พระครูปลัดสุขีศม สีลเตชปุตฺติโย, อ.ดร.",
    nameEn: "Ven. Phrabaidika Senghurng Narinda, Ph.D.",
    defaultEmailPrefix: "sukhisam.sil",
    aliases: [
      "พระครูปลัดสุขีศม สีลเตชปุตฺติโย, อ.ดร.",
      "พระสุขีศม สีลเตชปุตฺติโย, อ.ดร.",
      "Ven. Phrabaidika Senghurng Narinda, Ph.D.",
    ],
  },

  // 2. Thai Instructors (Consolidate multiple course accounts)
  {
    masterName: "พระมหาจีรวัฒน์ กนฺตวณฺโณ, รศ.ดร.",
    defaultEmailPrefix: "jeerawat.kan",
    aliases: ["พระมหาจีรวัฒน์ กนฺตวณฺโณ, รศ.ดร."],
  },
  {
    masterName: "อ.ดร.สุดาพร เขียวงามดี",
    defaultEmailPrefix: "sudaporn.khi",
    aliases: ["อ.ดร.สุดาพร เขียวงามดี"],
  },
  {
    masterName: "พระครูพิศิษฐ์ธรรมพิสุทธิ์, อ.ดร.",
    defaultEmailPrefix: "phisit.dha",
    aliases: ["พระครูพิศิษฐ์ธรรมพิสุทธิ์, อ.ดร."],
  },
  {
    masterName: "พระครูภาวนาวัฒนบัณฑิต วิ., รศ.ดร.",
    defaultEmailPrefix: "bhavanavat.ban",
    aliases: [
      "พระครูภาวนาวัฒนบัณฑิต วิ., รศ.ดร.",
      "พระครูภาวนาวัฒนบัณฑิต, รศ.ดร.",
    ],
  },
  {
    masterName: "พระครูศรีสิทธิบัณฑิต, อ.ดร.",
    defaultEmailPrefix: "srisiddhi.ban",
    aliases: ["พระครูศรีสิทธิบัณฑิต, อ.ดร."],
  },
  {
    masterName: "พระจาตุรงค์ อาจารสุโภ, ผศ.ดร.",
    defaultEmailPrefix: "jaturong.aca",
    aliases: ["พระจาตุรงค์ อาจารสุโภ, ผศ.ดร."],
  },
  {
    masterName: "พระมหาขวัญชัย กิตฺติเมธี, รศ.ดร.",
    defaultEmailPrefix: "khwanchai.kit",
    aliases: ["พระมหาขวัญชัย กิตฺติเมธี, รศ.ดร."],
  },
  {
    masterName: "พระมหาดวงเด่น ฐิตญาโณ, ผศ.ดร.",
    defaultEmailPrefix: "duangden.thi",
    aliases: ["พระมหาดวงเด่น ฐิตญาโณ, ผศ.ดร."],
  },
  {
    masterName: "พระมหามงคลกานต์ ฐิตธมฺโม, รศ.ดร.",
    defaultEmailPrefix: "mongkolkarn.thi",
    aliases: ["พระมหามงคลกานต์ ฐิตธมฺโม, รศ.ดร."],
  },
  {
    masterName: "พระมหาสมเดช ตปสีโล, อ.ดร.",
    defaultEmailPrefix: "somdej.tap",
    aliases: ["พระมหาสมเดช ตปสีโล, อ.ดร."],
  },
  {
    masterName: "พระมหาไพโรจน์ ญาณกุสโล, อ.ดร.",
    defaultEmailPrefix: "phairot.yan",
    aliases: ["พระมหาไพโรจน์ ญาณกุสโล, อ.ดร."],
  },
  {
    masterName: "พระมหาราชัน จิตฺตปาโล, อ.ดร.",
    defaultEmailPrefix: "rachan.cit",
    aliases: ["พระมหาราชัน จิตฺตปาโล, อ.ดร.", "Phramaha Rachan Cittapalo, Ph.D."],
  },
  {
    masterName: "รศ.ดร.กฤต ศรียะอาจ",
    defaultEmailPrefix: "krit.sri",
    aliases: ["รศ.ดร.กฤต ศรียะอาจ"],
  },
  {
    masterName: "รศ.ดร.สุเทพ พรมเลิศ",
    defaultEmailPrefix: "suthep.pro",
    aliases: ["รศ.ดร.สุเทพ พรมเลิศ"],
  },
  {
    masterName: "อ.ดร.ขวัญตระกูล บุทธิจักร",
    defaultEmailPrefix: "khwantrakul.but",
    aliases: ["อ.ดร.ขวัญตระกูล บุทธิจักร"],
  },
  {
    masterName: "อ.ดร.อธิเทพ ผาทา",
    defaultEmailPrefix: "atithep.pha",
    aliases: ["อ.ดร.อธิเทพ ผาทา"],
  },
  {
    masterName: "อ.ดร.อุดม จันทิมา",
    defaultEmailPrefix: "udom.jan",
    aliases: ["อ.ดร.อุดม จันทิมา", "อาจารย์ ดร.อุดม จันทิมา"],
  },
  {
    masterName: "อ.ดร.ไชยา เสนแสนยา",
    defaultEmailPrefix: "chaiya.sen",
    aliases: ["อ.ดร.ไชยา เสนแสนยา", "ดร.ไชยา เสนแสนยา"],
  },
  {
    masterName: "ผศ.ดร.คงสฤษฎ์ แพงทรัพย์",
    defaultEmailPrefix: "khongsrit.pha",
    aliases: ["ผศ.ดร.คงสฤษฎ์ แพงทรัพย์"],
  },
  {
    masterName: "ผศ.ดร.บุญเกิด เจริญแนว",
    defaultEmailPrefix: "boonkoed.cha",
    aliases: ["ผศ.ดร.บุญเกิด เจริญแนว"],
  },
  {
    masterName: "ผศ.ธีร์ พุ่มทับทิม",
    defaultEmailPrefix: "thee.pum",
    aliases: ["ผศ.ธีร์ พุ่มทับทิม"],
  },
  {
    masterName: "ผศ.ดร.พระมหาสมโภช ญาณสิทฺธิ",
    defaultEmailPrefix: "sompoch.yan",
    aliases: ["ผศ.ดร.พระมหาสมโภช ญาณสิทฺธิ"],
  },
  {
    masterName: "ดร.วิสุทธิ์ สิทธิธรรม",
    defaultEmailPrefix: "wisut.sit",
    aliases: ["ดร.วิสุทธิ์ สิทธิธรรม"],
  },

  // 3. English Program Instructors
  {
    masterName: "Ven. Dr. Dharma Priya Bhikkhu",
    defaultEmailPrefix: "dharmapriya.bhi",
    aliases: ["Ven. Dr. Dharma Priya Bhikkhu"],
  },
  {
    masterName: "Phrasamu Kriengsak Sirisakko, Ph.D.",
    defaultEmailPrefix: "kriengsak.sir",
    aliases: ["Phrasamu Kriengsak Sirisakko, Ph.D."],
  },
  {
    masterName: "Dr. Duangdee Aotsoo",
    defaultEmailPrefix: "duangdee.aot",
    aliases: ["Dr. Duangdee Aotsoo", "อ.ดร.ดวงดี โอฐสู"],
  },
  {
    masterName: "Phramaha Khunpon Samacitto, Ph.D.",
    defaultEmailPrefix: "khunpon.sam",
    aliases: ["Phramaha Khunpon Samacitto, Ph.D."],
  },
  {
    masterName: "Asst. Prof. Phramaha Pornchai Sirivaro, Ph.D.",
    defaultEmailPrefix: "pornchai.sir",
    aliases: ["Asst. Prof. Phramaha Pornchai Sirivaro, Ph.D.", "Asst. Prof. PM. Pornchai Sirivaro, Ph.D."],
  },
  {
    masterName: "Asst. Prof. Phramaha Somphong Khunakaro, Ph.D.",
    defaultEmailPrefix: "somphong.khu",
    aliases: ["Asst. Prof. Phramaha Somphong Khunakaro, Ph.D.", "Asst. Prof. PM. Somphong Khunakaro, Ph.D."],
  },
  {
    masterName: "Assoc. Prof. Dr. Jutamas Vareesangthip",
    defaultEmailPrefix: "jutamas.var",
    aliases: ["Assoc. Prof. Dr. Jutamas Vareesangthip", "Assoc. Prof. Dr. Jutamas Vareesengthip", "รศ.พิเศษ ดร.จุฑามาศ วารีแสงทิพย์"],
  },
  {
    masterName: "Assoc. Prof. Dr. Doungkamon Tongkanaraksa",
    defaultEmailPrefix: "doungkamon.ton",
    aliases: [
      "Assoc. Prof. Dr. Doungkamon Tongkanaraksa",
      "Asst. Prof. Dr. Doungkamon Tongkanaraksa",
    ],
  },
  {
    masterName: "Assoc. Prof. Dr. Naddhira Sridee",
    defaultEmailPrefix: "naddhira.sri",
    aliases: ["Assoc. Prof. Dr. Naddhira Sridee"],
  },
  {
    masterName: "Assoc. Prof. Pha Dhammavajirapanyacarya, Ph.D.",
    defaultEmailPrefix: "dhammavajira.pan",
    aliases: ["Assoc. Prof. Pha Dhammavajirapanyacarya, Ph.D."],
  },
  {
    masterName: "Assoc. Prof. W. Piyaratana, Ph.D.",
    defaultEmailPrefix: "piyaratana.w",
    aliases: [
      "Assoc. Prof. W. Piyaratana, Ph.D.",
      "Asst. Prof. W. Piyaratana, Ph.D.",
    ],
  },
  {
    masterName: "Asst. Prof. Dr. Supapan Permpool",
    defaultEmailPrefix: "supapan.per",
    aliases: ["Asst. Prof. Dr. Supapan Permpool", "ผศ.พิเศษ ดร.สุภาพรรณ เพิ่มพูน"],
  },
  {
    masterName: "Dr. Sudtida Padrit",
    defaultEmailPrefix: "sudtida.pad",
    aliases: ["Dr. Sudtida Padrit", "A.Dr. Sudtida Padrit"],
  },
];

async function main() {
  console.log("=== STARTING TEACHER ACCOUNT CONSOLIDATION ===");

  // Find the primary tenant
  const tenant = await prisma.tenant.findFirst({
    where: { isActive: true },
  });
  if (!tenant) {
    throw new Error("No active tenant found.");
  }
  const tenantId = tenant.id;

  // Find the TEACHER role
  const teacherRole = await prisma.role.findFirst({
    where: { tenantId, code: "TEACHER" },
  });
  if (!teacherRole) {
    throw new Error("TEACHER role not found.");
  }

  const allUsers = await prisma.user.findMany({
    include: {
      userTenants: {
        include: { userRoles: true },
      },
    },
  });

  const allCourses = await prisma.course.findMany({
    select: {
      id: true,
      courseCode: true,
      courseName: true,
      primaryTeacherId: true,
    },
  });

  const standardPassword = "Mcu@2569Teacher";
  const standardPasswordHash = await bcrypt.hash(standardPassword, 10);

  const results: Array<{
    nameTh: string;
    nameEn?: string;
    masterEmail: string;
    isDualProgram: boolean;
    coursesCount: number;
    courseList: string[];
    mergedAccountEmails: string[];
  }> = [];

  for (const cluster of TEACHER_CLUSTERS) {
    // 1. Find all user accounts matching aliases
    const matchedUsers = allUsers.filter((u) =>
      cluster.aliases.some(
        (alias) => u.name.trim().toLowerCase() === alias.trim().toLowerCase()
      )
    );

    if (matchedUsers.length === 0) {
      console.log(`[WARN] No user accounts found for ${cluster.masterName}`);
      continue;
    }

    // 2. Select the Master User: prefer official @mcu.ac.th over temporary t69...
    let masterUser =
      matchedUsers.find((u) => u.email.toLowerCase().endsWith("@mcu.ac.th") && !u.email.toLowerCase().includes("t69")) ||
      matchedUsers.find((u) => !u.email.toLowerCase().includes(".en.") && !u.email.toLowerCase().startsWith("t69")) ||
      matchedUsers.find((u) => !u.email.toLowerCase().includes(".en.")) ||
      matchedUsers[0];

    const targetEmail = cluster.defaultEmailPrefix
      ? `${cluster.defaultEmailPrefix}@mcu.ac.th`.toLowerCase()
      : masterUser.email.toLowerCase();

    // If an official user in matchedUsers already has targetEmail, that's definitively our masterUser!
    const exactTargetUser = matchedUsers.find((u) => u.email.toLowerCase() === targetEmail);
    if (exactTargetUser) {
      masterUser = exactTargetUser;
    }

    // Rename any other accounts in matchedUsers away from targetEmail first to prevent unique constraint conflict
    for (const other of matchedUsers) {
      if (other.id !== masterUser.id && other.email.toLowerCase() === targetEmail) {
        const tempEmail = `temp-${Date.now()}-${other.email}`;
        await prisma.user.update({
          where: { id: other.id },
          data: { email: tempEmail },
        });
        other.email = tempEmail;
      }
    }

    const conflictUser = allUsers.find(
      (u) => u.email.toLowerCase() === targetEmail && !matchedUsers.some((m) => m.id === u.id)
    );
    const finalMasterEmail = conflictUser ? masterUser.email : targetEmail;

    // Update masterUser details: name, finalMasterEmail, password
    await prisma.user.update({
      where: { id: masterUser.id },
      data: {
        name: cluster.masterName,
        email: finalMasterEmail,
        passwordHash: standardPasswordHash,
        emailVerified: true,
        isActive: true,
      },
    });

    // Ensure Master User has TEACHER role in the tenant
    let masterUserTenant = await prisma.userTenant.findUnique({
      where: { userId_tenantId: { userId: masterUser.id, tenantId } },
    });
    if (!masterUserTenant) {
      masterUserTenant = await prisma.userTenant.create({
        data: { userId: masterUser.id, tenantId, isActive: true },
      });
    }

    const hasTeacherRole = await prisma.userRole.findFirst({
      where: { userTenantId: masterUserTenant.id, roleId: teacherRole.id },
    });
    if (!hasTeacherRole) {
      await prisma.userRole.create({
        data: {
          userTenantId: masterUserTenant.id,
          roleId: teacherRole.id,
          scopeType: "ALL",
        },
      });
    }

    // 3. Transfer all courses to the Master User
    const allMatchedIds = matchedUsers.map((u) => u.id);
    const affectedCourses = allCourses.filter((c) => allMatchedIds.includes(c.primaryTeacherId));

    for (const course of affectedCourses) {
      // Update Course.primaryTeacherId
      await prisma.course.update({
        where: { id: course.id },
        data: { primaryTeacherId: masterUser.id },
      });

      // Update CourseTeacher
      // Remove any old references for the matched users
      await prisma.courseTeacher.deleteMany({
        where: {
          courseId: course.id,
          userId: { in: allMatchedIds },
        },
      });

      // Insert clean primary teacher record for masterUser
      await prisma.courseTeacher.create({
        data: {
          tenantId,
          courseId: course.id,
          userId: masterUser.id,
          isPrimary: true,
          role: "TEACHER",
        },
      });
    }

    // 4. Mark secondary duplicate accounts as inactive to prevent confusion
    for (const otherUser of matchedUsers) {
      if (otherUser.id !== masterUser.id) {
        // Change email slightly if it was duplicate or conflict, and deactivate
        await prisma.user.update({
          where: { id: otherUser.id },
          data: {
            isActive: false,
          },
        });
      }
    }

    results.push({
      nameTh: cluster.masterName,
      nameEn: cluster.nameEn,
      masterEmail: finalMasterEmail,
      isDualProgram: !!cluster.nameEn,
      coursesCount: affectedCourses.length,
      courseList: affectedCourses.map((c) => `${c.courseCode} ${c.courseName}`),
      mergedAccountEmails: matchedUsers.map((u) => u.email),
    });
  }

  console.log(`\n=== CONSOLIDATION SUCCESSFUL ===`);
  console.log(`Successfully consolidated ${results.length} teacher master accounts.`);
  console.log(`Default Password set for all teachers: ${standardPassword}`);

  // Summary of Dual-program teachers
  console.log("\n--- Dual-Program Teachers (Teaching Thai & English) ---");
  results
    .filter((r) => r.isDualProgram)
    .forEach((r, idx) => {
      console.log(
        `${idx + 1}. ${r.nameTh} (${r.nameEn})\n   Master Email: ${r.masterEmail}\n   Total Courses: ${r.coursesCount} courses\n   Merged Accounts: ${r.mergedAccountEmails.join(", ")}\n`
      );
    });

  // Summary of Single-program teachers
  console.log("--- Single-Program Teachers Consolidated ---");
  results
    .filter((r) => !r.isDualProgram)
    .forEach((r, idx) => {
      console.log(
        `${idx + 1}. ${r.nameTh}\n   Master Email: ${r.masterEmail}\n   Total Courses: ${r.coursesCount} courses\n   Merged Accounts: ${r.mergedAccountEmails.join(", ")}\n`
      );
    });
}

main()
  .catch((e) => {
    console.error("Error during consolidation:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
