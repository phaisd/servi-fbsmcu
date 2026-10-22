import { auth } from "@/features/identity/server";
import { resolvePublicTenantId } from "@/features/news/server";
import { getLocale } from "@/shared/lib/i18n/server";
import { getUserActivities } from "@/features/events/server";
import { PortalActivitiesClient } from "./_components/portal-activities-client";

export default async function PublicEventsPage() {
  const [locale, tenantId, session] = await Promise.all([
    getLocale(),
    resolvePublicTenantId(),
    auth(),
  ]);

  let userCode = "";
  const email = session?.user?.email?.toLowerCase().trim() || "";
  if (email.endsWith("@mcu.ac.th")) {
    const prefix = email.split("@")[0]?.trim() || "";
    if (/^\d{8,12}$/.test(prefix) || prefix.startsWith("temp-")) {
      userCode = prefix.toUpperCase();
    }
  }

  // Get activities for logged in user (student code or email)
  const activitiesData = await getUserActivities(tenantId, {
    email: session?.user?.email,
    studentCode: userCode,
  });

  return (
    <PortalActivitiesClient
      initialData={activitiesData}
      user={{
        name: session?.user?.name || "ผู้ใช้งาน",
        email: session?.user?.email || "",
        code: userCode || session?.user?.email || "",
        role: userCode ? "STUDENT" : "TEACHER",
      }}
      locale={locale}
    />
  );
}
