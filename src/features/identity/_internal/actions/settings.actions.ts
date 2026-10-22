"use server";
import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/shared/lib/result";
import { getLocale } from "@/shared/lib/i18n/server";
import { zodErrorMap } from "@/shared/lib/i18n/zod-locale";
import { P } from "../../permissions";
import { requirePermission } from "../rbac";
import fs from "node:fs/promises";
import path from "node:path";
import { errors } from "@/shared/lib/errors";
import { updateSettingsSchema } from "../validations/settings";
import { prisma } from "@/shared/lib/infra/prisma";
import { getTenantSettings, updateTenantSettings, type TenantSettings } from "../services/tenant.service";
import { testGeminiApiKey } from "@/shared/lib/ai/gemini";

export async function getSettingsAction(): Promise<ActionResult<TenantSettings>> {
  return runAction(async () => getTenantSettings((await requirePermission(P.settingsManage)).tenantId));
}
export async function updateSettingsAction(input: unknown): Promise<ActionResult<void>> {
  return runAction(async () => {
    const ctx = await requirePermission(P.settingsManage);
    await updateTenantSettings({ tenantId: ctx.tenantId, actorId: ctx.userId, ...updateSettingsSchema.parse(input, { error: zodErrorMap(await getLocale()) }) });
    revalidatePath("/", "layout"); // data-palette บน <html> อ่านใหม่
    revalidatePath("/portal", "layout");
    revalidatePath("/(admin)", "layout");
    revalidatePath("/(auth)", "layout");
    revalidatePath("/login");
    revalidatePath("/settings");
  });
}

export async function uploadLogoAction(formData: FormData): Promise<ActionResult<{ url: string }>> {
  return runAction(async () => {
    const ctx = await requirePermission(P.settingsManage);
    const file = formData.get("file");
    if (!file || !(file instanceof File) || file.size === 0) {
      throw errors.validation("No file provided", { file: ["กรุณาเลือกไฟล์รูปภาพ"] });
    }

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      throw errors.validation("Invalid file type", { file: ["รองรับเฉพาะไฟล์ PNG, JPEG, WebP และ SVG เท่านั้น"] });
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw errors.validation("File too large", { file: ["ขนาดไฟล์ต้องไม่เกิน 5MB"] });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const rawExt = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const ext = ["png", "jpg", "jpeg", "webp", "svg"].includes(rawExt) ? rawExt : "png";
    const filename = `logo-${ctx.tenantId}-${Date.now()}.${ext}`;
    const filePath = path.join(uploadsDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    const url = `/uploads/${filename}`;

    // บันทึกลงฐานข้อมูลทันที เพื่อให้ทุกหน้าแสดงผลโลโก้ใหม่โดยอัตโนมัติ ไม่สูญหายเมื่อปิด/เปิดใหม่
    await prisma.tenant.update({
      where: { id: ctx.tenantId },
      data: { logoUrl: url },
    });

    revalidatePath("/", "layout");
    revalidatePath("/portal", "layout");
    revalidatePath("/(admin)", "layout");
    revalidatePath("/(auth)", "layout");
    revalidatePath("/login");
    revalidatePath("/settings");

    return { url };
  });
}

export async function removeLogoAction(): Promise<ActionResult<void>> {
  return runAction(async () => {
    const ctx = await requirePermission(P.settingsManage);
    await prisma.tenant.update({
      where: { id: ctx.tenantId },
      data: { logoUrl: null },
    });

    revalidatePath("/", "layout");
    revalidatePath("/portal", "layout");
    revalidatePath("/(admin)", "layout");
    revalidatePath("/(auth)", "layout");
    revalidatePath("/login");
    revalidatePath("/settings");
  });
}

export async function testSmtpAction(input: unknown): Promise<ActionResult<{ message: string }>> {
  return runAction(async () => {
    await requirePermission(P.settingsManage);
    const nodemailer = (await import("nodemailer")).default;
    const { smtpSettingsSchema } = await import("../validations/settings");
    const z = (await import("zod")).default;

    const schema = z.object({
      smtp: smtpSettingsSchema,
      testEmail: z.string().trim().email("กรุณาระบุรูปแบบอีเมลปลายทางให้ถูกต้อง"),
    });

    const parsed = schema.parse(input);
    const { smtp, testEmail } = parsed;

    if (!smtp.user) {
      throw errors.validation("Missing user", { user: ["กรุณาระบุที่อยู่อีเมล Gmail ผู้ส่ง"] });
    }
    if (!smtp.pass) {
      throw errors.validation("Missing pass", { pass: ["กรุณาระบุรหัสผ่านสำหรับแอป (App Password)"] });
    }

    const host = smtp.service === "gmail" ? "smtp.gmail.com" : smtp.host || "smtp.gmail.com";
    const port = smtp.service === "gmail" ? (smtp.secure ? 465 : 587) : smtp.port || 465;
    const secure = smtp.secure ?? (port === 465);
    const pass = smtp.pass.replace(/\s+/g, "");

    const transport = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user: smtp.user.trim(), pass },
      connectionTimeout: 10000,
    });

    try {
      await transport.verify();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      let extraHint = "";
      if (host.includes("office365") || host.includes("outlook") || msg.includes("OUTLOOK.COM")) {
        extraHint = " (ตรวจพบว่ากำลังเชื่อมต่อกับเซิร์ฟเวอร์ Microsoft Outlook: หากท่านใช้รหัสผ่านสำหรับแอปของ Gmail กรุณากดเลือกตัวเลือก 'Gmail / Google Workspace' หรือเปลี่ยน SMTP Host เป็น smtp.gmail.com)";
      } else {
        extraHint = ` (หากใช้ Gmail กรุณาตรวจสอบว่าได้สร้าง "รหัสผ่านสำหรับแอป" 16 หลัก และเปิด 2-Step Verification แล้ว)`;
      }
      throw errors.validation("SMTP verification failed", {
        pass: [`ไม่สามารถยืนยันการเชื่อมต่อ SMTP ได้: ${msg}${extraHint}`],
      });
    }

    const fromName = smtp.fromName || "คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย";
    const fromEmail = smtp.fromEmail || smtp.user.trim();
    const from = `"${fromName}" <${fromEmail}>`;

    try {
      await transport.sendMail({
        from,
        to: testEmail,
        subject: "ทดสอบการเชื่อมต่อระบบอีเมล (Gmail SMTP Test)",
        text: `สวัสดีครับ/ค่ะ,\n\nนี่คืออีเมลทดสอบการเชื่อมต่อระบบ Gmail SMTP จาก MCU Portal\nระบบสามารถเชื่อมต่อและส่งอีเมลสำเร็จเรียบร้อยแล้ว\n\nเวลาที่ส่ง: ${new Date().toLocaleString("th-TH")}\nส่งจาก: ${fromEmail}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <h2 style="color: #2563eb; margin-top: 0;">การเชื่อมต่อ Gmail SMTP สำเร็จ ✅</h2>
            <p style="font-size: 15px; color: #334155; line-height: 1.6;">
              นี่คืออีเมลทดสอบการเชื่อมต่อระบบ Gmail SMTP จาก <strong>${fromName}</strong>
            </p>
            <div style="background: #f8fafc; border-left: 4px solid #2563eb; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #475569;">
                <strong>ผู้ส่ง:</strong> ${fromEmail}<br/>
                <strong>เซิร์ฟเวอร์:</strong> ${host}:${port}<br/>
                <strong>เวลาที่ส่ง:</strong> ${new Date().toLocaleString("th-TH")}
              </p>
            </div>
            <p style="font-size: 13px; color: #94a3b8; margin-bottom: 0;">
              ข้อความนี้สร้างขึ้นโดยอัตโนมัติจากการทดสอบการตั้งค่า SMTP ในหน้า Settings
            </p>
          </div>
        `,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw errors.validation("Send mail failed", {
        testEmail: [`การเชื่อมต่อสำเร็จ แต่ส่งอีเมลทดสอบไม่สำเร็จ: ${msg}`],
      });
    }

    return { message: `เชื่อมต่อสำเร็จและส่งอีเมลทดสอบไปยัง ${testEmail} เรียบร้อยแล้ว` };
  });
}


export async function testGeminiApiKeyAction(input: {
  apiKey: string;
  model?: string;
}): Promise<ActionResult<{ ok: boolean; model: string; message: string }>> {
  return runAction(async () => {
    await requirePermission(P.settingsManage);
    if (!input.apiKey?.trim()) {
      throw errors.validation("Gemini API Key missing", {
        apiKey: ["กรุณาระบุ Gemini API Key"],
      });
    }
    const res = await testGeminiApiKey(input.apiKey, input.model);
    return {
      ok: true,
      model: res.model,
      message: `เชื่อมต่อ Google Gemini API (${res.model}) สำเร็จเรียบร้อยแล้ว`,
    };
  });
}
