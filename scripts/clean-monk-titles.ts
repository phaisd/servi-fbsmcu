import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { requireDatabaseUrl } from "../prisma/lib/require-database-url";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: requireDatabaseUrl() }),
});

async function main() {
  console.log("=== CLEANING MONK TITLES & SETTING DEFAULT PLACEMENT ===");
  const all = await prisma.personnel.findMany();

  for (const item of all) {
    const fTh = item.firstNameTh.trim();
    const isMonk = fTh.startsWith("พระ") || fTh.startsWith("สามเณร") || fTh.startsWith("Ven.");

    // Clean duplicate trailing academic position from firstNameTh if any
    const cleaned = fTh.replace(/[,，]\s*(ศ\.ดร\.|รศ\.ดร\.|ผศ\.ดร\.|ดร\.|อาจารย์, ดร\.|อาจารย์|ผศ\.|รศ\.)\s*$/g, "").trim();

    // Default title placement: Monks default to SUFFIX (MCU convention), Laypeople default to PREFIX
    const defaultPlacement = isMonk ? "SUFFIX" : "PREFIX";

    await prisma.personnel.update({
      where: { id: item.id },
      data: {
        firstNameTh: cleaned,
        titlePlacement: item.titlePlacement || defaultPlacement,
      },
    });

    if (cleaned !== fTh) {
      console.log(`Cleaned: "${fTh}" -> "${cleaned}" (placement: ${item.titlePlacement || defaultPlacement})`);
    } else {
      console.log(`Checked: "${cleaned}" (placement: ${item.titlePlacement || defaultPlacement})`);
    }
  }

  console.log("Done cleaning titles!");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
