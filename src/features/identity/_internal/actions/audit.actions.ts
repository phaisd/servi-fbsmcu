"use server";

import { requirePermission } from "@/features/identity/server";
import { P } from "@/features/identity/permissions";
import { getAuditLogs, type GetAuditLogsOptions } from "../audit";

export async function getAuditLogsAction(options: GetAuditLogsOptions = {}) {
  const ctx = await requirePermission(P.auditRead);
  return getAuditLogs(ctx.tenantId, options);
}
