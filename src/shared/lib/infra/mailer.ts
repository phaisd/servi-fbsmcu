import "server-only";
import nodemailer from "nodemailer";
import { env, smtpConfigured } from "./env";
import { logger } from "./logger";
import { prisma } from "./prisma";
interface SmtpSettings {
  enabled?: boolean;
  service?: string;
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  pass?: string;
  from?: string;
  fromName?: string;
  fromEmail?: string;
}

export interface MailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
  tenantId?: string;
}

/** ตรวจสอบ SMTP จาก Tenant Settings ก่อน ถ้าไม่มีจึง fallback ไป env() ถ้าไม่มีเลยจะเขียนลง log */
export async function sendMail(input: MailInput): Promise<{ delivered: boolean }> {
  try {
    const tenant = input.tenantId
      ? await prisma.tenant.findUnique({ where: { id: input.tenantId }, select: { settings: true, nameTh: true } })
      : await prisma.tenant.findFirst({ select: { settings: true, nameTh: true } });

    const smtp = (tenant?.settings as { smtp?: SmtpSettings })?.smtp;
    if (smtp?.enabled && smtp.user && smtp.pass) {
      const host = smtp.service === "gmail" ? "smtp.gmail.com" : smtp.host || "smtp.gmail.com";
      const port = smtp.service === "gmail" ? (smtp.secure ? 465 : 587) : smtp.port || 465;
      const secure = smtp.secure ?? (port === 465);
      const transport = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user: smtp.user.trim(),
          pass: smtp.pass.replace(/\s+/g, ""),
        },
      });

      const fromName = smtp.fromName || tenant?.nameTh || "ระบบบริหารจัดการ";
      const fromEmail = smtp.fromEmail || smtp.user.trim();
      const from = `"${fromName}" <${fromEmail}>`;

      await transport.sendMail({
        from,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      });
      return { delivered: true };
    }
  } catch (err) {
    logger.warn("tenant smtp failed, fallback to env smtp", { err: err instanceof Error ? err.message : String(err) });
  }

  if (!smtpConfigured()) {
    logger.info("mail (no SMTP, logged only)", { to: input.to, subject: input.subject, text: input.text });
    return { delivered: false };
  }
  const e = env();
  try {
    const transport = nodemailer.createTransport({
      host: e.SMTP_HOST,
      port: e.SMTP_PORT,
      secure: e.SMTP_PORT === 465,
      auth: e.SMTP_USER ? { user: e.SMTP_USER, pass: e.SMTP_PASS } : undefined,
    });
    await transport.sendMail({ from: e.SMTP_FROM, to: input.to, subject: input.subject, text: input.text, html: input.html });
    return { delivered: true };
  } catch (err) {
    logger.error("mail send failed", { to: input.to, err: err instanceof Error ? err.message : String(err) });
    return { delivered: false };
  }
}
