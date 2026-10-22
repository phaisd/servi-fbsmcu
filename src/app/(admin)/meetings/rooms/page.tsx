import { requirePermission } from "@/features/identity/server";
import { MEETINGS_P } from "@/features/meetings";
import { getMeetingRooms, getMeetingFormSettings } from "@/features/meetings/server";
import { MeetingRoomsClient } from "./_components/meeting-rooms-client";

export default async function MeetingRoomsPage() {
  const ctx = await requirePermission(MEETINGS_P.manage);
  const [items, formSettings] = await Promise.all([
    getMeetingRooms(ctx.tenantId),
    getMeetingFormSettings(ctx.tenantId).catch(() => ({
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

  return <MeetingRoomsClient initialItems={items} initialFormSettings={formSettings} />;
}
