import "server-only";
import { prisma as db } from "@/shared/lib/infra/prisma";
import { writeAudit } from "@/features/identity/server";
import { CertificateRequestStatus } from "@/generated/prisma";
import {
  CERTIFICATE_PURPOSES,
  parseCertificateNote,
  serializeCertificateNote,
  type CertificateRequestMetadata,
  type CertificateTemplateType,
} from "./validations";
import { INITIAL_EXCEL_CERTIFICATE_RECORDS, inferDefaultTemplate } from "./templates";

// ==========================================
// Helper: Resolve Default User for Public Portal Requests
// ==========================================
async function resolveFallbackUserId(tenantId: string, preferredUserId?: string | null): Promise<string> {
  if (preferredUserId) {
    const exists = await db.user.findUnique({ where: { id: preferredUserId }, select: { id: true } });
    if (exists) return exists.id;
  }
  const ut = await db.userTenant.findFirst({
    where: { tenantId },
    select: { userId: true },
    orderBy: { joinedAt: "asc" },
  });
  if (ut) return ut.userId;

  const anyUser = await db.user.findFirst({ select: { id: true } });
  if (!anyUser) throw new Error("No user found in system");
  return anyUser.id;
}

// ==========================================
// Auto-seed Default Types & Excel Records
// ==========================================
export async function ensureCertificateDefaults(tenantId: string) {
  const existingTypes = await db.certificateType.findMany({ where: { tenantId } });
  const typeMap = new Map<string, string>();
  for (const t of existingTypes) {
    typeMap.set(t.name.toLowerCase(), t.id);
  }

  if (existingTypes.length < 3) {
    for (const p of CERTIFICATE_PURPOSES) {
      if (!typeMap.has(p.value.toLowerCase())) {
        const created = await db.certificateType.create({
          data: {
            tenantId,
            name: p.value,
            description: `${p.labelTh} — ${p.purposePhraseTh}`,
            isActive: true,
          },
        });
        typeMap.set(created.name.toLowerCase(), created.id);
      }
    }
  }

  const allTypes = await db.certificateType.findMany({ where: { tenantId } });
  const defaultTypeId = allTypes[0]?.id;
  if (!defaultTypeId) return;

  const existingRequests = await db.certificateRequest.findMany({
    where: { tenantId },
    select: { id: true, note: true },
  });

  if (existingRequests.length < INITIAL_EXCEL_CERTIFICATE_RECORDS.length) {
    const existingKeys = new Set(
      existingRequests.map((r) => {
        const m = parseCertificateNote(r.note);
        return `${m.studentCode || ""}|${m.fullName || ""}|${m.requestPurpose || ""}`;
      })
    );

    const fallbackUserId = await resolveFallbackUserId(tenantId);
    for (const rec of INITIAL_EXCEL_CERTIFICATE_RECORDS) {
      const key = `${rec.studentCode || ""}|${rec.fullName || ""}|${rec.requestPurpose || ""}`;
      if (existingKeys.has(key)) continue;

      const matchedType =
        allTypes.find(
          (t) =>
            t.name.toLowerCase() === (rec.requestPurpose || "").toLowerCase() ||
            t.name.toLowerCase().includes((rec.requestPurpose || "").slice(0, 12).toLowerCase())
        ) || allTypes[0];

      const noteJson = serializeCertificateNote({
        ...rec,
        docTemplate: rec.docTemplate ?? inferDefaultTemplate(rec),
      });

      await db.certificateRequest.create({
        data: {
          tenantId,
          userId: fallbackUserId,
          certificateTypeId: matchedType.id,
          status: CertificateRequestStatus.APPROVED,
          note: noteJson,
        },
      });
    }
  }
}

// ==========================================
// Student Directory Lookup for Auto-fill
// ==========================================
export async function lookupStudentForCertificate(tenantId: string, query: string) {
  const q = query.trim();
  if (!q) return null;

  const student = await db.student.findFirst({
    where: {
      tenantId,
      OR: [
        { studentCode: { equals: q, mode: "insensitive" } },
        { studentCode: { contains: q, mode: "insensitive" } },
        { firstName: { contains: q, mode: "insensitive" } },
      ],
    },
  });

  if (!student) return null;

  const fullName = [student.title, student.firstName, student.lastName]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  const isEngCurr =
    (student.curriculumName || "").includes("อังกฤษ") ||
    (student.curriculumName || "").toLowerCase().includes("english") ||
    (student.department || "").toLowerCase().includes("english");

  const yearMap: Record<number, string> = {
    1: "ปีที่ 1 (First year)",
    2: "ปีที่ 2 (Second year)",
    3: "ปีที่ 3 (Third year)",
    4: "ปีที่ 4 (Fourth year)",
  };

  let degreeLevel = "ป.ตรี (B.A. English Program)";
  if ((student.degree || "").includes("เอก")) {
    degreeLevel = "ป.เอก (Ph.D.)";
  } else if ((student.degree || "").includes("โท")) {
    degreeLevel = "ป.โท (M.A.)";
  } else if (!isEngCurr) {
    degreeLevel = "ป.ตรี (B.A. Thai Program)";
  }

  let major = student.major || student.department || "Buddhist Studies";
  if (isEngCurr) {
    if (major.includes("พระพุทธศาสนา") || major.toLowerCase().includes("buddhist")) {
      major = "Buddhist Studies";
    } else if (major.includes("ศาสนา") || major.includes("ปรัชญา") || major.toLowerCase().includes("philosophy")) {
      major = "Religion and Philosophy";
    }
  }

  return {
    studentCode: student.studentCode,
    fullName,
    classYear: yearMap[student.yearLevel] || `ปีที่ ${student.yearLevel}`,
    degreeLevel,
    major,
    sex: student.gender === "หญิง" || student.gender === "F" ? "F" : "M",
    email: student.email || `${student.studentCode}@mcu.ac.th`,
    phone: student.phoneNumber || "",
    nationality: student.nationality || "",
    country: student.country || "",
    address: student.address || "",
    language: isEngCurr ? ("In English language" as const) : ("In Thai language" as const),
  };
}

// ==========================================
// Certificate Types
// ==========================================

export async function getCertificateTypes(tenantId: string) {
  await ensureCertificateDefaults(tenantId);
  return db.certificateType.findMany({
    where: { tenantId },
    orderBy: { createdAt: "asc" },
  });
}

export async function getActiveCertificateTypes(tenantId: string) {
  await ensureCertificateDefaults(tenantId);
  return db.certificateType.findMany({
    where: { tenantId, isActive: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getCertificateTypeById(tenantId: string, id: string) {
  return db.certificateType.findUnique({
    where: { id, tenantId },
  });
}

export async function createCertificateType(
  tenantId: string,
  actorId: string,
  data: { name: string; description?: string; isActive?: boolean }
) {
  const result = await db.certificateType.create({
    data: {
      tenantId,
      name: data.name,
      description: data.description,
      isActive: data.isActive ?? true,
    },
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "certificateType.create",
    entity: "CertificateType",
    entityId: result.id,
    after: result,
  });

  return result;
}

export async function updateCertificateType(
  tenantId: string,
  actorId: string,
  id: string,
  data: { name?: string; description?: string; isActive?: boolean }
) {
  const before = await db.certificateType.findUnique({ where: { id, tenantId } });
  if (!before) throw new Error("Not found");

  const result = await db.certificateType.update({
    where: { id, tenantId },
    data,
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "certificateType.update",
    entity: "CertificateType",
    entityId: result.id,
    before,
    after: result,
  });

  return result;
}

export async function deleteCertificateType(tenantId: string, actorId: string, id: string) {
  const before = await db.certificateType.findUnique({ where: { id, tenantId } });
  if (!before) throw new Error("Not found");

  const count = await db.certificateRequest.count({ where: { certificateTypeId: id } });
  if (count > 0) {
    throw new Error("ไม่สามารถลบประเภทเอกสารที่มีคำร้องผูกอยู่ได้ (กรุณาปิดใช้งานแทน)");
  }

  await db.certificateType.delete({ where: { id, tenantId } });
  await writeAudit({
    tenantId,
    actorId,
    action: "certificateType.delete",
    entity: "CertificateType",
    entityId: id,
    before,
  });
}

// ==========================================
// Certificate Requests
// ==========================================

export async function getMyCertificateRequests(tenantId: string, _userId?: string | null) {
  await ensureCertificateDefaults(tenantId);
  return db.certificateRequest.findMany({
    where: { tenantId },
    include: {
      certificateType: true,
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllCertificateRequests(tenantId: string) {
  await ensureCertificateDefaults(tenantId);
  return db.certificateRequest.findMany({
    where: { tenantId },
    include: {
      certificateType: true,
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCertificateRequestById(tenantId: string, id: string) {
  return db.certificateRequest.findUnique({
    where: { id, tenantId },
    include: {
      certificateType: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function createCertificateRequest(
  tenantId: string,
  userId: string | null | undefined,
  data: {
    certificateTypeId?: string;
    note?: string;
    metadata?: Partial<CertificateRequestMetadata>;
    status?: CertificateRequestStatus;
  }
) {
  await ensureCertificateDefaults(tenantId);
  const resolvedUserId = await resolveFallbackUserId(tenantId, userId);

  let certTypeId = data.certificateTypeId;
  const allTypes = await db.certificateType.findMany({ where: { tenantId } });

  if (!certTypeId && data.metadata?.requestPurpose) {
    const matched = allTypes.find(
      (t) =>
        t.name.toLowerCase() === data.metadata!.requestPurpose!.toLowerCase() ||
        t.name.toLowerCase().includes(data.metadata!.requestPurpose!.slice(0, 12).toLowerCase())
    );
    certTypeId = matched?.id;
  }
  if (!certTypeId) {
    certTypeId = allTypes[0]?.id;
  }
  if (!certTypeId) {
    throw new Error("ไม่พบประเภทหนังสือรับรองในระบบ");
  }

  const chosenType = allTypes.find((t) => t.id === certTypeId);

  let finalNote = data.note || "";
  if (data.metadata) {
    finalNote = serializeCertificateNote({
      ...data.metadata,
      requestPurpose: data.metadata.requestPurpose || chosenType?.name || "Bonafide Certificate (ความเป็นนิสิต)",
      docTemplate: data.metadata.docTemplate ?? inferDefaultTemplate(data.metadata),
    });
  } else if (data.note) {
    const parsed = parseCertificateNote(data.note);
    finalNote = serializeCertificateNote({
      ...parsed,
      requestPurpose: chosenType?.name || parsed.requestPurpose,
    });
  }

  const result = await db.certificateRequest.create({
    data: {
      tenantId,
      userId: resolvedUserId,
      certificateTypeId: certTypeId,
      note: finalNote,
      status: data.status ?? CertificateRequestStatus.PENDING,
    },
    include: {
      certificateType: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });

  await writeAudit({
    tenantId,
    actorId: resolvedUserId,
    action: "certificateRequest.create",
    entity: "CertificateRequest",
    entityId: result.id,
    after: result,
  });

  if (data.metadata?.studentCode) {
    try {
      await syncCertificateStudentToDirectory(tenantId, data.metadata);
    } catch (e) {
      console.warn("Failed to sync student to directory on create:", e);
    }
  }

  return result;
}


export async function updateCertificateRequest(
  tenantId: string,
  actorId: string,
  id: string,
  data: {
    certificateTypeId?: string;
    status?: CertificateRequestStatus;
    reason?: string;
    issuedDocumentUrl?: string;
    metadata?: Partial<CertificateRequestMetadata>;
  }
) {
  const before = await db.certificateRequest.findUnique({ where: { id, tenantId } });
  if (!before) throw new Error("ไม่พบรายการคำร้องขอหนังสือรับรอง");

  const existingMeta = parseCertificateNote(before.note);
  const mergedMeta = data.metadata
    ? { ...existingMeta, ...data.metadata }
    : existingMeta;

  let certTypeId = data.certificateTypeId || before.certificateTypeId;
  if (data.metadata?.requestPurpose && !data.certificateTypeId) {
    const allTypes = await db.certificateType.findMany({ where: { tenantId } });
    const matched = allTypes.find(
      (t) =>
        t.name.toLowerCase() === data.metadata!.requestPurpose!.toLowerCase() ||
        t.name.toLowerCase().includes(data.metadata!.requestPurpose!.slice(0, 12).toLowerCase())
    );
    if (matched) certTypeId = matched.id;
  }

  const result = await db.certificateRequest.update({
    where: { id, tenantId },
    data: {
      certificateTypeId: certTypeId,
      status: data.status ?? before.status,
      reason: data.reason !== undefined ? data.reason : before.reason,
      issuedDocumentUrl:
        data.issuedDocumentUrl !== undefined ? data.issuedDocumentUrl : before.issuedDocumentUrl,
      note: serializeCertificateNote(mergedMeta),
    },
    include: {
      certificateType: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "certificateRequest.update",
    entity: "CertificateRequest",
    entityId: result.id,
    before,
    after: result,
  });

  if (mergedMeta?.studentCode) {
    try {
      await syncCertificateStudentToDirectory(tenantId, mergedMeta);
    } catch (e) {
      console.warn("Failed to sync student to directory on update:", e);
    }
  }

  return result;
}


export async function reviewCertificateRequest(
  tenantId: string,
  actorId: string,
  id: string,
  data: {
    status: CertificateRequestStatus;
    reason?: string;
    issuedDocumentUrl?: string;
    metadata?: Partial<CertificateRequestMetadata>;
  }
) {
  return updateCertificateRequest(tenantId, actorId, id, data);
}

export async function deleteCertificateRequest(tenantId: string, actorId: string, id: string) {
  const before = await db.certificateRequest.findUnique({ where: { id, tenantId } });
  if (!before) throw new Error("ไม่พบรายการคำร้อง");

  await db.certificateRequest.delete({ where: { id, tenantId } });

  await writeAudit({
    tenantId,
    actorId,
    action: "certificateRequest.delete",
    entity: "CertificateRequest",
    entityId: id,
    before,
  });
}

export async function bulkImportCertificateRequests(
  tenantId: string,
  actorId: string,
  records: Partial<CertificateRequestMetadata>[]
) {
  await ensureCertificateDefaults(tenantId);
  const allTypes = await db.certificateType.findMany({ where: { tenantId } });
  const fallbackUserId = await resolveFallbackUserId(tenantId, actorId);

  let createdCount = 0;
  let updatedCount = 0;

  const existingRequests = await db.certificateRequest.findMany({ where: { tenantId } });

  for (const rec of records) {
    if (!rec.fullName && !rec.studentCode) continue;

    const matchedType =
      allTypes.find(
        (t) =>
          t.name.toLowerCase() === (rec.requestPurpose || "").toLowerCase() ||
          t.name.toLowerCase().includes((rec.requestPurpose || "").slice(0, 12).toLowerCase())
      ) || allTypes[0];

    // Check if an identical studentCode + requestPurpose already exists
    const existing = existingRequests.find((r) => {
      const m = parseCertificateNote(r.note);
      return (
        m.studentCode &&
        rec.studentCode &&
        m.studentCode.trim() === rec.studentCode.trim() &&
        m.requestPurpose === (rec.requestPurpose || matchedType.name)
      );
    });

    if (existing) {
      const prevMeta = parseCertificateNote(existing.note);
      await db.certificateRequest.update({
        where: { id: existing.id },
        data: {
          certificateTypeId: matchedType.id,
          note: serializeCertificateNote({
            ...prevMeta,
            ...rec,
            docTemplate: rec.docTemplate ?? prevMeta.docTemplate ?? inferDefaultTemplate(rec),
          }),
        },
      });
      updatedCount++;
    } else {
      await db.certificateRequest.create({
        data: {
          tenantId,
          userId: fallbackUserId,
          certificateTypeId: matchedType.id,
          status: CertificateRequestStatus.APPROVED,
          note: serializeCertificateNote({
            ...rec,
            requestPurpose: rec.requestPurpose || matchedType.name,
            docTemplate: rec.docTemplate ?? inferDefaultTemplate(rec),
          }),
        },
      });
      createdCount++;
    }

    if (rec.studentCode) {
      try {
        await syncCertificateStudentToDirectory(tenantId, rec);
      } catch (e) {
        console.warn("Failed to sync imported student to directory:", e);
      }
    }
  }

  return { createdCount, updatedCount };

}

/**
 * ดึงข้อมูลการตรวจสอบความถูกต้องของหนังสือรับรองสำหรับ ตม. / หน่วยงานภายนอก (Public Verification)
 * ค้นหาได้ทั้งจาก ID (UUID), เลขที่หนังสือ (docNo), หรือรหัสนิสิต (studentCode)
 */
export async function getPublicCertificateVerification(queryIdOrCode: string) {
  const clean = queryIdOrCode.trim();
  if (!clean) return null;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);
  type RequestWithTenant = Awaited<ReturnType<typeof db.certificateRequest.findFirst<{
    include: {
      certificateType: true;
      tenant: { select: { id: true; code: true; nameTh: true; nameEn: true; logoUrl: true } };
    };
  }>>>;
  let request: RequestWithTenant = null;

  if (isUuid) {
    request = await db.certificateRequest.findUnique({
      where: { id: clean },
      include: {
        certificateType: true,
        tenant: { select: { id: true, code: true, nameTh: true, nameEn: true, logoUrl: true } },
      },
    });
  }

  if (!request) {
    const all = await db.certificateRequest.findMany({
      take: 200,
      include: {
        certificateType: true,
        tenant: { select: { id: true, code: true, nameTh: true, nameEn: true, logoUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    request = all.find((r) => {
      const meta = parseCertificateNote(r.note);
      const matchDocNo = meta.docNo && meta.docNo.replace(/\s+/g, "").includes(clean.replace(/\s+/g, ""));
      const matchStudent = meta.studentCode && meta.studentCode.trim().toLowerCase() === clean.toLowerCase();
      const matchSeq = meta.seqNo && String(meta.seqNo) === clean;
      return matchDocNo || matchStudent || matchSeq;
    }) ?? null;
  }

  if (!request) return null;

  const metadata = parseCertificateNote(request.note);
  return {
    id: request.id,
    tenantId: request.tenantId,
    tenantNameTh: request.tenant.nameTh,
    tenantNameEn: request.tenant.nameEn,
    tenantLogoUrl: request.tenant.logoUrl,
    certificateTypeName: request.certificateType.name,
    status: request.status,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    metadata: {
      ...metadata,
      docTemplate: metadata.docTemplate ?? inferDefaultTemplate(metadata),
    },
  };
}

/**
 * คำนวณเลขที่หนังสือฉบับถัดไปอัตโนมัติต่อจากฉบับล่าสุดในระบบ (Auto-increment Doc No.)
 * แยกตามหมวดหมู่แม่แบบเอกสาร (THAI_CERT, ENG_CERT, BANK_LETTER, RESIDENCE_MEMO)
 */
export async function getNextCertificateDocNo(
  tenantId: string,
  template: CertificateTemplateType = "THAI_CERT"
): Promise<string> {
  // 1. หนังสือบันทึกข้อความ ให้กรอกเลขเอง ไม่ใช้เลขรันอัตโนมัติจากทะเบียนหนังสือรับรอง
  if (template === "RESIDENCE_MEMO") {
    return "";
  }

  // 2. หนังสือรับรองทุกฉบับ (ภาษาไทย, ภาษาอังกฤษ, หนังสือติดต่อธนาคาร ฯลฯ)
  // ให้ใช้เลขทะเบียนต่อเนื่องกันอัตโนมัติทุกฉบับ
  const requests = await db.certificateRequest.findMany({
    where: { tenantId },
    select: { note: true },
    orderBy: { createdAt: "desc" },
  });

  const thaiToArabic = (str: string) =>
    str.replace(/[๐-๙]/g, (d) => String("๐๑๒๓๔๕๖๗๘๙".indexOf(d)));

  let maxNum = 0;
  let hasFound = false;

  for (const r of requests) {
    const m = parseCertificateNote(r.note);
    if (!m.docNo?.trim()) continue;

    // ข้ามเอกสารบันทึกข้อความ (หมวด ว)
    if (m.docTemplate === "RESIDENCE_MEMO" || m.docNo.includes("ว")) continue;

    const norm = thaiToArabic(m.docNo.trim());
    // ค้นหาเลขที่หนังสือ เช่น 8002 / 715 หรือ 8002/ 170 หรือ / 715
    const match = norm.match(/8002\s*\/\s*(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum && num < 100000) {
        maxNum = num;
        hasFound = true;
      }
    }
  }

  // เลขถัดไปแบบต่อเนื่องกันทุกฉบับ
  const nextVal = hasFound && maxNum > 0 ? maxNum + 1 : 716;

  if (template === "ENG_CERT") {
    return `8002/ ${nextVal}`;
  }
  return `8002 / ${nextVal}`;
}


// ==========================================
// Certificate Notice Banner (Admin Customizable)
// ==========================================

export const DEFAULT_CERTIFICATE_NOTICE_TH =
  "*สำหรับการขอต่ออายุวีซ่า ให้ดำเนินการ ก่อนหมดอายุที่ท้ายเล่ม 30 วัน";
export const DEFAULT_CERTIFICATE_NOTICE_EN =
  "*For visa extension requests, please submit your application at least 30 days before your visa/passport expiration date.";

export async function getCertificateNotice(tenantId: string): Promise<{
  noticeTh: string;
  noticeEn: string;
}> {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  });
  const settings = (tenant?.settings as Record<string, unknown>) || {};
  const certSettings = (settings.certificates as { noticeTh?: string; noticeEn?: string } | undefined) || {};
  return {
    noticeTh: certSettings.noticeTh?.trim() || DEFAULT_CERTIFICATE_NOTICE_TH,
    noticeEn: certSettings.noticeEn?.trim() || DEFAULT_CERTIFICATE_NOTICE_EN,
  };
}

export async function updateCertificateNotice(
  tenantId: string,
  actorId: string,
  input: { noticeTh: string; noticeEn?: string }
) {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  });
  const existingSettings = (tenant?.settings as Record<string, unknown>) || {};
  const existingCert = (existingSettings.certificates as Record<string, unknown> | undefined) || {};
  const updatedSettings = {
    ...existingSettings,
    certificates: {
      ...existingCert,
      noticeTh: input.noticeTh.trim() || DEFAULT_CERTIFICATE_NOTICE_TH,
      noticeEn: (input.noticeEn || "").trim() || DEFAULT_CERTIFICATE_NOTICE_EN,
    },
  };

  await db.tenant.update({
    where: { id: tenantId },

    data: { settings: updatedSettings },
  });

  await writeAudit({
    tenantId,
    actorId,
    action: "certificate.notice_update",
    entity: "tenant_settings",
    entityId: tenantId,
    before: existingSettings.certificates || null,
    after: updatedSettings.certificates,
  });

  return {
    noticeTh: updatedSettings.certificates.noticeTh,
    noticeEn: updatedSettings.certificates.noticeEn,
  };
}

// ==========================================
// Sync Student Profile to Student Directory
// (เพศ, สัญชาติ, เชื้อชาติ/ประเทศ, ที่อยู่)
// ==========================================

export async function syncCertificateStudentToDirectory(
  tenantId: string,
  meta: Partial<CertificateRequestMetadata>
) {
  const code = meta.studentCode?.trim();
  if (!code) return null;

  const genderStr =
    meta.sex === "F" || meta.sex === "หญิง"
      ? "หญิง (F)"
      : meta.sex === "M" || meta.sex === "ชาย"
      ? "ชาย (M)"
      : meta.sex || null;

  const existing = await db.student.findFirst({
    where: { tenantId, studentCode: { equals: code, mode: "insensitive" } },
  });

  if (existing) {
    return db.student.update({
      where: { id: existing.id },
      data: {
        gender: genderStr || existing.gender,
        nationality: meta.nationality?.trim() || existing.nationality,
        country: meta.country?.trim() || existing.country,
        address: meta.fullAddress?.trim() || existing.address,
      },
    });
  }

  // Create new student in directory if not exists
  const rawName = meta.fullName?.trim() || `นิสิต ${code}`;
  const parts = rawName.split(/\s+/);
  const firstName = parts[0] || rawName;
  const lastName = parts.slice(1).join(" ") || "-";

  let yr = 1;
  if (meta.classYear) {
    const m = meta.classYear.match(/(\d+)/);
    if (m) yr = parseInt(m[1], 10);
  }

  return db.student.create({
    data: {
      tenantId,
      studentCode: code,
      firstName,
      lastName,
      gender: genderStr || "ชาย (M)",
      nationality: meta.nationality?.trim() || "Thai",
      country: meta.country?.trim() || "Thailand",
      address: meta.fullAddress?.trim() || "",
      yearLevel: yr,
      degree: meta.degreeLevel || "ปริญญาตรี",
      major: meta.major || "Buddhist Studies",
      email: meta.email || `${code}@mcu.ac.th`,
      faculty: "คณะพุทธศาสตร์",
      studyStatus: "ปกติ",
      isActive: true,
    },
  });
}

export async function syncAllCertificatesToStudentDirectory(
  tenantId: string,
  actorId: string
) {
  const requests = await db.certificateRequest.findMany({
    where: { tenantId },
    select: { note: true },
    orderBy: { createdAt: "asc" },
  });

  let syncedCount = 0;
  for (const r of requests) {
    const meta = parseCertificateNote(r.note);
    if (!meta.studentCode?.trim()) continue;
    try {
      await syncCertificateStudentToDirectory(tenantId, meta);
      syncedCount++;
    } catch (e) {
      console.warn("Failed to sync record:", meta.studentCode, e);
    }
  }

  await writeAudit({
    tenantId,
    actorId,
    action: "student.sync_from_certificates",
    entity: "students",
    entityId: tenantId,
    before: null,
    after: { syncedCount },
  });

  return { success: true, syncedCount };
}


