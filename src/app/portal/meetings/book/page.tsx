import { resolvePublicTenantId } from "@/features/news/server";
import { getPublicMeetingRooms, getMeetingFormSettings } from "@/features/meetings/server";
import { getPersonnelListForCertificate } from "@/features/certificates/server";
import { getSessionContext } from "@/features/identity/server";
import { MeetingBookingFormClient } from "./_components/meeting-booking-form-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "ใบขอใช้ห้องประชุมประจำคณะพุทธศาสตร์ | มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
};

export default async function BookMeetingPage({
  searchParams,
}: {
  searchParams: Promise<{ roomId?: string }>;
}) {
  const session = await getSessionContext().catch(() => null);
  const tenantId = session?.tenantId || (await resolvePublicTenantId());
  const resolvedParams = await searchParams;

  const [rooms, personnelList, formSettings] = await Promise.all([
    getPublicMeetingRooms(tenantId),
    getPersonnelListForCertificate(tenantId).catch(() => []),
    getMeetingFormSettings(tenantId).catch(() => ({
      purposes: [
        { id: "MEETING", label: "ประชุม (Meeting)" },
        { id: "TRAINING", label: "อบรม (Training)" },
        { id: "SEMINAR", label: "สัมมนา (Seminar)" },
        { id: "OTHER", label: "อื่นๆ (Other)" },
      ],
      equipments: [
        { key: "computer", label: "คอมพิวเตอร์ (Computer)", desc: "เครื่องคอมพิวเตอร์ควบคุมประจำห้อง" },
        { key: "ledDisplay", label: "จอ LED / Projector", desc: "จอแสดงผลความละเอียดสูง" },
        { key: "soundSystem", label: "เครื่องขยายเสียง (Sound System)", desc: "ไมโครโฟนตั้งโต๊ะและชุดลำโพง" },
        { key: "zoomOnline", label: "Zoom Online", desc: "สัญญาณอินเทอร์เน็ตและการถ่ายทอดสด" },
      ],
    })),
  ]);

  const currentUser = session
    ? {
        id: session.userId,
        name: session.email?.split("@")[0] || "",
        email: session.email || "",
      }
    : null;

  return (
    <MeetingBookingFormClient
      rooms={rooms}
      initialRoomId={resolvedParams.roomId}
      personnelList={personnelList}
      currentUser={currentUser}
      formSettings={formSettings}
    />
  );
}
