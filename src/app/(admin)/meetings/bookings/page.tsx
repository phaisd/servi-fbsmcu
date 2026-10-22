import { requirePermission } from "@/features/identity/server";
import { MEETINGS_P } from "@/features/meetings";
import { getBookings, getMeetingFormSettings } from "@/features/meetings/server";
import { getPersonnelListForCertificate } from "@/features/certificates/server";
import { BookingsClient } from "./_components/bookings-client";

export default async function BookingsPage() {
  const ctx = await requirePermission(MEETINGS_P.manage);
  const [items, personnelList, formSettings] = await Promise.all([
    getBookings(ctx.tenantId),
    getPersonnelListForCertificate(ctx.tenantId).catch(() => []),
    getMeetingFormSettings(ctx.tenantId).catch(() => null),
  ]);

  return (
    <BookingsClient
      initialItems={items}
      personnelList={personnelList}
      formSettings={formSettings}
    />
  );
}
