import { validateUploadFile } from "@/shared/lib/security/file-validation";
"use server";

import fs from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/shared/lib/result";
import { getLocale } from "@/shared/lib/i18n/server";
import { zodErrorMap } from "@/shared/lib/i18n/zod-locale";
import { errors } from "@/shared/lib/errors";
import { requirePermission } from "@/features/identity/server";
import { ADMINISTRATION_P } from "./permissions";
import {
  createAdminDocument,
  updateAdminDocument,
  deleteAdminDocument,
  getAdminDocuments,
} from "./_internal/services";
import {
  adminDocumentSchema,
  updateAdminDocumentSchema,
} from "./_internal/validations";
import type { DocumentFilterOptions } from "./_internal/services";
import type { AdminDocument } from "@/generated/prisma";

export async function getAdminDocumentsAction(
  filters?: DocumentFilterOptions
): Promise<ActionResult<AdminDocument[]>> {
  return runAction(async () => {
    const ctx = await requirePermission(ADMINISTRATION_P.read);
    return getAdminDocuments(ctx.tenantId, filters);
  });
}

export async function createAdminDocumentAction(data: unknown): Promise<ActionResult<AdminDocument>> {
  return runAction(async () => {
    const ctx = await requirePermission(ADMINISTRATION_P.manage);
    const locale = await getLocale();
    const parsed = adminDocumentSchema.parse(data, { error: zodErrorMap(locale) });
    const result = await createAdminDocument(ctx.tenantId, ctx.userId, parsed);

    revalidatePath("/administration");
    revalidatePath("/documents");
    revalidatePath("/portal/documents");
    return result;
  });
}

export async function updateAdminDocumentAction(
  id: string,
  data: unknown
): Promise<ActionResult<AdminDocument>> {
  return runAction(async () => {
    const ctx = await requirePermission(ADMINISTRATION_P.manage);
    const locale = await getLocale();
    const parsed = updateAdminDocumentSchema.parse(data, { error: zodErrorMap(locale) });
    const result = await updateAdminDocument(ctx.tenantId, ctx.userId, id, parsed);

    revalidatePath("/administration");
    revalidatePath("/documents");
    revalidatePath("/portal/documents");
    return result;
  });
}

export async function deleteAdminDocumentAction(id: string): Promise<ActionResult<void>> {
  return runAction(async () => {
    const ctx = await requirePermission(ADMINISTRATION_P.manage);
    await deleteAdminDocument(ctx.tenantId, ctx.userId, id);

    revalidatePath("/administration");
    revalidatePath("/documents");
    revalidatePath("/portal/documents");
  });
}

export async function uploadAdminDocumentFileAction(
  formData: FormData
): Promise<ActionResult<{ url: string; fileName: string; fileSize: number }>> {
  return runAction(async () => {
    const _ctx = await requirePermission(ADMINISTRATION_P.manage);
    const file = formData.get("file");

    if (!file || !(file instanceof File) || file.size === 0) {
      throw errors.validation("No file provided", { file: ["กรุณาเลือกไฟล์เอกสารที่ต้องการอัปโหลด"] });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const validation = validateUploadFile(file.name, buffer, {
      allowedExtensions: ["pdf", "docx", "xlsx", "pptx", "png", "jpg", "jpeg"],
      maxSizeBytes: 30 * 1024 * 1024,
    });

    if (!validation.valid) {
      throw errors.validation(validation.error || "ไฟล์ไม่ถูกต้อง", {
        file: [validation.error || "ไฟล์ไม่ถูกต้อง"]
      });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "documents");
    await fs.mkdir(uploadsDir, { recursive: true });

    const safeBaseName = path
      .basename(file.name, `.${validation.ext}`)
      .replace(/[^a-zA-Z0-9_\u0E00-\u0E7F-]/g, "_")
      .slice(0, 40);

    const filename = `doc-${Date.now()}-${safeBaseName || "file"}.${validation.ext}`;
    const filePath = path.join(uploadsDir, filename);

    await fs.writeFile(filePath, buffer);

    const url = `/uploads/documents/${filename}`;
    return {
      url,
      fileName: file.name,
      fileSize: file.size,
    };
  });
}

export async function importAdminDocumentsAction(
  items: unknown[]
): Promise<ActionResult<{ count: number }>> {
  return runAction(async () => {
    const ctx = await requirePermission(ADMINISTRATION_P.manage);
    const locale = await getLocale();

    if (!Array.isArray(items) || items.length === 0) {
      throw errors.validation("Invalid items array", {
        items: ["รายการนำเข้าต้องเป็น Array และมีข้อมูลอย่างน้อย 1 รายการ"],
      });
    }

    let importedCount = 0;
    for (const raw of items) {
      try {
        const parsed = adminDocumentSchema.parse(raw, { error: zodErrorMap(locale) });
        await createAdminDocument(ctx.tenantId, ctx.userId, parsed);
        importedCount++;
      } catch {
        // Skip or record error per row
      }
    }

    revalidatePath("/administration");
    revalidatePath("/documents");
    revalidatePath("/portal/documents");

    return { count: importedCount };
  });
}

