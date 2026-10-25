import { requireSession } from "@/features/identity/server";
import { prisma } from "@/shared/lib/infra/prisma";
import { ProfileForm } from "./_components/profile-form";

export default async function MePage() {
  const ctx = await requireSession();

  let personnelProfile: {
    id: string;
    firstNameTh: string;
    lastNameTh: string;
    academicPosition: string | null;
    titlePlacement: "PREFIX" | "SUFFIX";
    positionTh: string;
    departmentName: string | null;
  } | null = null;

  if (ctx.email) {
    const cleanUserName = ctx.userName ? ctx.userName.replace(/^พระ[^\s]+/, "").trim() : "";
    const person = await prisma.personnel.findFirst({
      where: {
        tenantId: ctx.tenantId,
        OR: [
          { email: { equals: ctx.email, mode: "insensitive" } },
          ...(cleanUserName ? [{ firstNameTh: { contains: cleanUserName } }] : []),
          ...(ctx.userName ? [{ firstNameTh: { contains: ctx.userName } }] : []),
        ],
      },
      include: { department: true },
    });

    if (person) {
      personnelProfile = {
        id: person.id,
        firstNameTh: person.firstNameTh,
        lastNameTh: person.lastNameTh,
        academicPosition: person.academicPosition,
        titlePlacement: (person.titlePlacement as "PREFIX" | "SUFFIX") || "SUFFIX",
        positionTh: person.positionTh,
        departmentName: person.department?.nameTh || null,
      };
    }
  }

  return (
    <ProfileForm
      initial={{ name: ctx.userName, locale: ctx.locale ?? "th", email: ctx.email }}
      personnelProfile={personnelProfile}
    />
  );
}
