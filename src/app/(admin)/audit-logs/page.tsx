import { requirePermission, P, getAuditLogs } from "@/features/identity/server";
import { AuditLogsClient } from "./_components/audit-logs-client";

export const metadata = {
  title: "บันทึกประวัติระบบ (Audit Logs) | คณะพุทธศาสตร์ มจร.",
};

export default async function AuditLogsPage() {
  const ctx = await requirePermission(P.auditRead);
  const initialData = await getAuditLogs(ctx.tenantId, { page: 1, pageSize: 25 });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <AuditLogsClient initialData={initialData} />
    </div>
  );
}
