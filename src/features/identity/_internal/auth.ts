import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { prisma } from "@/shared/lib/infra/prisma";
import { env, googleOAuthConfigured, microsoftOAuthConfigured } from "@/shared/lib/infra/env";
import { hashPassword, verifyPassword } from "@/shared/lib/security/password";
import { logger } from "@/shared/lib/infra/logger";
import { loginSchema } from "./validations/auth";
import { throttleKeys, isLoginThrottled, recordLoginFailure, resetLoginFailures } from "./throttle";
import { applyAuthorizationSnapshot, loadAuthorizationSnapshot } from "./revalidate";
import { passwordHashFor, DUMMY_PASSWORD_HASH } from "./password-select";

export type OAuthProviderId = "google" | "microsoft";

/** ปุ่ม OAuth โผล่เฉพาะเมื่อ env ครบ — ไม่ลงทะเบียน provider ที่ไม่มี credential */
export function oauthProviderIds(): OAuthProviderId[] {
  const ids: OAuthProviderId[] = [];
  if (googleOAuthConfigured()) ids.push("google");
  if (microsoftOAuthConfigured()) ids.push("microsoft");
  return ids;
}

function clientIp(req: Request | undefined): string | null {
  const xff = req?.headers.get("x-forwarded-for");
  return xff ? xff.split(",")[0].trim() : null;
}

/** ผู้ใช้ต้องมีสมาชิกภาพ active ใน tenant เดียว (single tenant) — คืน tenantId */
async function homeTenantId(userId: string): Promise<string | null> {
  const ut = await prisma.userTenant.findFirst({ where: { userId, isActive: true }, orderBy: { joinedAt: "asc" }, select: { tenantId: true } });
  return ut?.tenantId ?? null;
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 2 * 24 * 60 * 60, updateAge: 24 * 60 * 60 },
  providers: [
    ...(googleOAuthConfigured() ? [Google({ clientId: env().GOOGLE_CLIENT_ID, clientSecret: env().GOOGLE_CLIENT_SECRET })] : []),
    ...(microsoftOAuthConfigured()
      ? [MicrosoftEntraID({ clientId: env().MICROSOFT_CLIENT_ID, clientSecret: env().MICROSOFT_CLIENT_SECRET, issuer: `https://login.microsoftonline.com/${env().MICROSOFT_TENANT_ID}/v2.0` })]
      : []),
    Credentials({
      credentials: { email: { type: "email" }, password: { type: "password" } },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const keys = throttleKeys(email, clientIp(request));

        if (await isLoginThrottled(keys)) {
          logger.warn("login throttled", { email });
          return null;
        }
        let user = await prisma.user.findUnique({ where: { email } });
        let passwordOk = await verifyPassword(password, passwordHashFor(user, DUMMY_PASSWORD_HASH));

        // ระบบเข้าสู่ระบบอัตโนมัติสำหรับนิสิต (Student Auto-Provisioning Login):
        // อีเมล: <รหัสนิสิต>@mcu.ac.th (เช่น 6801203001@mcu.ac.th หรือ temp-68001@mcu.ac.th)
        // รหัสผ่าน: Fb<รหัสนิสิต> (เช่น Fb6801203001)
        if ((!user || !passwordOk) && (email.endsWith("@mcu.ac.th") || email.endsWith("@buddhist.mcu.ac.th"))) {
          const emailPrefix = email.split("@")[0]?.trim() || "";
          if (emailPrefix) {
            const mcuTenant = await prisma.tenant.findFirst({ where: { code: "MCU" } });
            const student = await prisma.student.findFirst({
              where: {
                ...(mcuTenant ? { tenantId: mcuTenant.id } : {}),
                studentCode: { equals: emailPrefix, mode: "insensitive" },
              },
            });

            const expectedPw = student ? `Fb${student.studentCode.trim()}` : `Fb${emailPrefix}`;
            const isStudentPasswordMatch =
              Boolean(student) &&
              (password === expectedPw || password.toLowerCase() === expectedPw.toLowerCase());

            if (student && isStudentPasswordMatch) {
              const studentFullName =
                [student.title, student.firstName, student.lastName]
                  .filter(Boolean)
                  .join(" ")
                  .replace(/\s+/g, " ")
                  .trim() || student.studentCode;

              const newHash = await hashPassword(`Fb${student.studentCode.trim()}`);

              if (!user) {
                user = await prisma.user.create({
                  data: {
                    email,
                    name: studentFullName,
                    passwordHash: newHash,
                    provider: "credentials",
                    emailVerified: true,
                    mustChangePassword: false,
                    isActive: true,
                  },
                });
              } else {
                user = await prisma.user.update({
                  where: { id: user.id },
                  data: {
                    name: user.name || studentFullName,
                    passwordHash: newHash,
                    mustChangePassword: false,
                    isActive: true,
                  },
                });
              }

              const targetTenantId = mcuTenant?.id || student.tenantId;
              const ut = await prisma.userTenant.upsert({
                where: {
                  userId_tenantId: {
                    userId: user.id,
                    tenantId: targetTenantId,
                  },
                },
                update: { isActive: true },
                create: {
                  userId: user.id,
                  tenantId: targetTenantId,
                  isActive: true,
                },
              });

              let studentRole = await prisma.role.findFirst({
                where: { tenantId: targetTenantId, code: "STUDENT" },
              });
              if (!studentRole) {
                studentRole = await prisma.role.create({
                  data: {
                    tenantId: targetTenantId,
                    code: "STUDENT",
                    nameTh: "นิสิต/นักศึกษา",
                    nameEn: "Student",
                    isSystem: false,
                  },
                });
              }
              if (studentRole) {
                const existingRole = await prisma.userRole.findFirst({
                  where: { userTenantId: ut.id, roleId: studentRole.id },
                });
                if (!existingRole) {
                  await prisma.userRole.create({
                    data: {
                      userTenantId: ut.id,
                      roleId: studentRole.id,
                      scopeType: "ALL",
                    },
                  });
                }
                // ลบบทบาทผู้ดู (VIEWER) เดิมออกหากเคยถูกกำหนดไว้ เพื่อให้แสดงเป็น "นิสิต/นักศึกษา"
                const viewerRole = await prisma.role.findFirst({
                  where: { tenantId: targetTenantId, code: "VIEWER" },
                });
                if (viewerRole) {
                  await prisma.userRole.deleteMany({
                    where: { userTenantId: ut.id, roleId: viewerRole.id },
                  });
                }
              }

              passwordOk = true;
            }
          }
        }

        // ระบบเข้าสู่ระบบสำหรับอาจารย์ผู้สอนด้วยรหัสผ่านเริ่มต้น (Teacher Initial Password Support):
        // รหัสผ่านเริ่มต้น: Teacher1234!
        if ((!user || !passwordOk) && password === "Teacher1234!") {
          const mcuTenant = await prisma.tenant.findFirst({ where: { code: "MCU" } });
          const targetTenantId = mcuTenant?.id;

          const matchedPersonnel = await prisma.personnel.findFirst({
            where: {
              isActive: true,
              email: { equals: email, mode: "insensitive" },
            },
          });

          // ตรวจสอบว่ามีผู้ใช้นี้อยู่แล้ว หรือมีข้อมูลใน Personnel
          if (user || matchedPersonnel) {
            const newHash = await hashPassword("Teacher1234!");
            if (!user && matchedPersonnel) {
              const teacherFullName =
                [matchedPersonnel.academicPosition, matchedPersonnel.firstNameTh, matchedPersonnel.lastNameTh]
                  .filter(Boolean)
                  .join(" ")
                  .trim() || email;
              user = await prisma.user.create({
                data: {
                  email,
                  name: teacherFullName,
                  passwordHash: newHash,
                  provider: "credentials",
                  emailVerified: true,
                  mustChangePassword: false,
                  isActive: true,
                },
              });
            } else if (user) {
              user = await prisma.user.update({
                where: { id: user.id },
                data: {
                  passwordHash: newHash,
                  mustChangePassword: false,
                  isActive: true,
                },
              });
            }

            if (user && targetTenantId) {
              const ut = await prisma.userTenant.upsert({
                where: {
                  userId_tenantId: {
                    userId: user.id,
                    tenantId: targetTenantId,
                  },
                },
                update: { isActive: true },
                create: {
                  userId: user.id,
                  tenantId: targetTenantId,
                  isActive: true,
                },
              });

              const teacherRole = await prisma.role.findFirst({
                where: { tenantId: targetTenantId, code: "TEACHER" },
              });
              if (teacherRole) {
                const existingRole = await prisma.userRole.findFirst({
                  where: { userTenantId: ut.id, roleId: teacherRole.id },
                });
                if (!existingRole) {
                  await prisma.userRole.create({
                    data: {
                      userTenantId: ut.id,
                      roleId: teacherRole.id,
                      scopeType: "ALL",
                    },
                  });
                }
              }
            }

            passwordOk = true;
          }
        }

        if (!user || !user.passwordHash || !user.isActive || !passwordOk) {
          await recordLoginFailure(keys);
          return null;
        }
        await resetLoginFailures(keys);
        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        return { id: user.id, email: user.email, name: user.name, image: user.imageUrl ?? undefined };
      },
    }),
  ],
  callbacks: {
    /** OAuth: หากมีบัญชีเดิม ให้อัปเดตข้อมูล / หากไม่มีบัญชี ให้สร้างอัตโนมัติพร้อมสิทธิ์ "ผู้ดู" (VIEWER) เท่านั้น */
    async signIn({ user, account }) {
      if (!account || account.provider === "credentials") return true;
      const providerKey: OAuthProviderId = account.provider === "microsoft-entra-id" ? "microsoft" : "google";
      if (!user.email) return "/login?error=NoAccount";
      const normalizedEmail = user.email.toLowerCase();
      const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });

      if (existing) {
        if (!existing.isActive) return "/login?error=NoAccount";
        await prisma.user.update({
          where: { id: existing.id },
          data: { provider: providerKey, providerId: account.providerAccountId, imageUrl: user.image ?? existing.imageUrl, lastLoginAt: new Date() },
        });
        user.id = existing.id;
        return true;
      }

      // ผู้ใช้ใหม่ผ่าน Google / OAuth: ตรวจสอบว่าเป็นนิสิต มจร. หรือไม่
      const defaultTenant = (await prisma.tenant.findFirst({ where: { code: "MCU" } })) ?? (await prisma.tenant.findFirst());
      if (!defaultTenant) return "/login?error=NoTenant";

      const isMcuStudent = normalizedEmail.endsWith("@mcu.ac.th") || normalizedEmail.endsWith("@buddhist.mcu.ac.th");
      const emailPrefix = normalizedEmail.split("@")[0]?.trim() || "";

      let targetStudent = null;
      if (isMcuStudent && emailPrefix) {
        targetStudent = await prisma.student.findFirst({
          where: { tenantId: defaultTenant.id, studentCode: { equals: emailPrefix, mode: "insensitive" } },
        });
      }

      const defaultPasswordHash = targetStudent ? await hashPassword(`Fb${targetStudent.studentCode.trim()}`) : null;
      const studentFullName = targetStudent
        ? [targetStudent.title, targetStudent.firstName, targetStudent.lastName].filter(Boolean).join(" ").trim()
        : null;

      const newUser = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: studentFullName || user.name || normalizedEmail.split("@")[0],
          passwordHash: defaultPasswordHash,
          provider: providerKey,
          providerId: account.providerAccountId,
          imageUrl: user.image ?? null,
          emailVerified: true,
          isActive: true,
          lastLoginAt: new Date(),
        },
      });

      const ut = await prisma.userTenant.create({
        data: {
          userId: newUser.id,
          tenantId: defaultTenant.id,
          isActive: true,
        },
      });

      const targetRoleCode = targetStudent ? "STUDENT" : "VIEWER";
      let assignedRole = await prisma.role.findFirst({
        where: { tenantId: defaultTenant.id, code: targetRoleCode },
      });
      if (!assignedRole && targetRoleCode === "STUDENT") {
        assignedRole = await prisma.role.create({
          data: {
            tenantId: defaultTenant.id,
            code: "STUDENT",
            nameTh: "นิสิต/นักศึกษา",
            nameEn: "Student",
            isSystem: false,
          },
        });
      }

      if (assignedRole) {
        await prisma.userRole.create({
          data: {
            userTenantId: ut.id,
            roleId: assignedRole.id,
            scopeType: "ALL",
          },
        });
      }

      user.id = newUser.id;
      return true;
    },

    async jwt({ token, user, trigger, session }) {
      if (user?.id) {
        token.userId = user.id;
        token.tenantId = (await homeTenantId(user.id)) ?? undefined;
        token.checkedAt = 0; // บังคับโหลด snapshot ทันทีด้านล่าง
      }
      if (trigger === "update" && session) {
        if (typeof session.name === "string") token.name = session.name;
        if (session.image !== undefined) token.picture = session.image;
        token.checkedAt = 0; // เช่น เปลี่ยนรหัสผ่านแล้ว mustChangePassword ต้องหายทันที
      }
      // edge runtime ไม่มี Prisma — proxy.ts อ่าน token ที่ฝั่ง node เขียนไว้แล้วเท่านั้น
      // เงื่อนไขเวลา/การเขียน token ทั้งหมดอยู่ใน applyAuthorizationSnapshot (มีเทสต์ใน revalidate.int.test.ts)
      if (process.env.NEXT_RUNTIME === "edge") return token;
      return applyAuthorizationSnapshot(token, loadAuthorizationSnapshot);
    },

    async session({ session, token }) {
      if (token.invalid || !token.userId || !token.tenantId) {
        session.user.id = "";
        session.tenantId = "";
        session.roles = []; session.permissions = []; session.isSuperAdmin = false; session.mustChangePassword = false; session.locale = null;
        return session;
      }
      session.user.id = token.userId;
      session.user.name = (token.name as string) ?? session.user.name;
      session.user.image = (token.picture as string) ?? undefined;
      session.tenantId = token.tenantId;
      session.locale = token.locale ?? null;
      session.roles = token.roles ?? [];
      session.permissions = token.permissions ?? [];
      session.isSuperAdmin = token.isSuperAdmin ?? false;
      session.mustChangePassword = token.mustChangePassword ?? false;
      return session;
    },
  },
});
