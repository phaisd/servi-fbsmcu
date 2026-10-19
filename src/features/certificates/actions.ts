"use server";

import { revalidatePath } from "next/cache";
import { auth, requireSession, requirePermission } from "@/features/identity/server";
import { resolvePublicTenantId } from "@/features/news/server";
import { CERTIFICATES_P } from "./permissions";
import {
  createCertificateType,
  updateCertificateType,
  deleteCertificateType,
  createCertificateRequest,
  updateCertificateRequest,
  reviewCertificateRequest,
  deleteCertificateRequest,
  bulkImportCertificateRequests,
  lookupStudentForCertificate,
  getNextCertificateDocNo,
  getCertificateNotice,
  updateCertificateNotice,
  syncAllCertificatesToStudentDirectory,
} from "./_internal/services";

import {
  createCertificateTypeSchema,
  updateCertificateTypeSchema,
  createCertificateRequestSchema,
  updateCertificateRequestSchema,
  reviewCertificateRequestSchema,
  type CertificateRequestMetadata,
  type CertificateTemplateType,
} from "./_internal/validations";

function revalidateAllCertificates() {
  revalidatePath("/certificates");
  revalidatePath("/certificates/types");
  revalidatePath("/portal/certificates");
  revalidatePath("/portal/certificates/request");
}

export async function lookupStudentByCodeAction(query: string) {
  const session = await auth().catch(() => null);
  const tenantId = session?.tenantId || (await resolvePublicTenantId());
  return lookupStudentForCertificate(tenantId, query);
}

export async function createTypeAction(data: unknown) {
  const session = await requireSession();
  await requirePermission(CERTIFICATES_P.typeManage);
  const parsed = createCertificateTypeSchema.parse(data);
  const res = await createCertificateType(session.tenantId, session.userId, parsed);
  revalidateAllCertificates();
  return res;
}

export async function updateTypeAction(id: string, data: unknown) {
  const session = await requireSession();
  await requirePermission(CERTIFICATES_P.typeManage);
  const parsed = updateCertificateTypeSchema.parse(data);
  const res = await updateCertificateType(session.tenantId, session.userId, id, parsed);
  revalidateAllCertificates();
  return res;
}

export async function deleteTypeAction(id: string) {
  const session = await requireSession();
  await requirePermission(CERTIFICATES_P.typeManage);
  await deleteCertificateType(session.tenantId, session.userId, id);
  revalidateAllCertificates();
  return { ok: true };
}

export async function submitRequestAction(data: unknown) {
  const session = await auth().catch(() => null);
  const tenantId = session?.tenantId || (await resolvePublicTenantId());
  const parsed = createCertificateRequestSchema.parse(data);
  const res = await createCertificateRequest(tenantId, session?.user?.id, parsed);
  revalidateAllCertificates();
  return res;
}

export async function createAdminCertificateRequestAction(data: {
  certificateTypeId?: string;
  status?: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  metadata: Partial<CertificateRequestMetadata>;
}) {
  const session = await requireSession();
  await requirePermission(CERTIFICATES_P.requestManage);
  const res = await createCertificateRequest(session.tenantId, session.userId, {
    certificateTypeId: data.certificateTypeId,
    metadata: data.metadata,
    status: data.status ?? "APPROVED",
  });
  revalidateAllCertificates();
  return res;
}

export async function updateCertificateRequestAction(id: string, data: unknown) {
  const session = await requireSession();
  await requirePermission(CERTIFICATES_P.requestManage);
  const parsed = updateCertificateRequestSchema.parse(data);
  const res = await updateCertificateRequest(session.tenantId, session.userId, id, parsed);
  revalidateAllCertificates();
  revalidatePath(`/certificates/${id}`);
  return res;
}

export async function reviewRequestAction(id: string, data: unknown) {
  const session = await requireSession();
  await requirePermission(CERTIFICATES_P.requestManage);
  const parsed = reviewCertificateRequestSchema.parse(data);
  const res = await reviewCertificateRequest(session.tenantId, session.userId, id, parsed);
  revalidateAllCertificates();
  revalidatePath(`/certificates/${id}`);
  return res;
}

export async function deleteCertificateRequestAction(id: string) {
  const session = await requireSession();
  await requirePermission(CERTIFICATES_P.requestManage);
  await deleteCertificateRequest(session.tenantId, session.userId, id);
  revalidateAllCertificates();
  return { ok: true };
}

export async function importCertificateRequestsAction(records: Partial<CertificateRequestMetadata>[]) {
  const session = await requireSession();
  await requirePermission(CERTIFICATES_P.requestManage);
  const res = await bulkImportCertificateRequests(session.tenantId, session.userId, records);
  revalidateAllCertificates();
  return res;
}

export async function getNextDocNoAction(template: CertificateTemplateType) {
  const session = await requireSession();
  await requirePermission(CERTIFICATES_P.requestView);
  return getNextCertificateDocNo(session.tenantId, template);
}

export async function getCertificateNoticeAction() {
  const session = await auth().catch(() => null);
  const tenantId = session?.tenantId || (await resolvePublicTenantId());
  return getCertificateNotice(tenantId);
}

export async function updateCertificateNoticeAction(data: { noticeTh: string; noticeEn?: string }) {
  const session = await requireSession();
  await requirePermission(CERTIFICATES_P.requestManage);
  const res = await updateCertificateNotice(session.tenantId, session.userId, data);
  revalidateAllCertificates();
  return res;
}

export async function syncCertificatesToStudentDirectoryAction() {
  const session = await requireSession();
  await requirePermission(CERTIFICATES_P.requestManage);
  const res = await syncAllCertificatesToStudentDirectory(session.tenantId, session.userId);
  revalidatePath("/attendance/students");
  revalidateAllCertificates();
  return res;
}import fs from "node:fs/promises";
import path from "node:path";

export async function uploadCertificateAttachmentAction(formData: FormData) {
  const file = formData.get("file");
  if (!file || !(file instanceof File) || file.size === 0) {
    throw new Error("No file provided");
  }
  const maxSizeBytes = 15 * 1024 * 1024; // 15MB
  if (file.size > maxSizeBytes) {
    throw new Error("File too large (max 15MB)");
  }
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "certificates");
  await fs.mkdir(uploadsDir, { recursive: true });

  const rawExt = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
  const safeBaseName = path
    .basename(file.name, `.${rawExt}`)
    .replace(/[^a-zA-Z0-9_\u0E00-\u0E7F-]/g, "_")
    .slice(0, 40);

  const filename = `cert-attach-${Date.now()}-${safeBaseName || "doc"}.${rawExt}`;
  const filePath = path.join(uploadsDir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  const url = `/uploads/certificates/${filename}`;
  return { url, fileName: file.name, fileSize: file.size };
}
