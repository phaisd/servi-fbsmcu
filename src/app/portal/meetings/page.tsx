import { resolvePublicTenantId } from "@/features/news/server";
import { getPublicMeetingRooms, getUpcomingBookings } from "@/features/meetings/server";
import { parseBookingRemark } from "@/features/meetings";
import { getLocale } from "@/shared/lib/i18n/server";
import { getSessionContext } from "@/features/identity/server";
import { Calendar, Users, MapPin, Clock, FileText, CheckCircle2, Tv } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "ระบบขอใช้ห้องประชุมประจำคณะพุทธศาสตร์ | มจร",
};

export default async function PublicMeetingsPage() {
  const locale = await getLocale();
  const session = await getSessionContext().catch(() => null);
  const tenantId = session?.tenantId || (await resolvePublicTenantId());

  const [rooms, bookings] = await Promise.all([
    getPublicMeetingRooms(tenantId),
    getUpcomingBookings(tenantId),
  ]);

  return (
    <div className="space-y-10 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-linear-to-r from-orange-50 via-white to-amber-50 p-6 rounded-3xl border border-orange-100 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-semibold uppercase tracking-wider mb-2">
            <Calendar className="h-3.5 w-3.5" />
            {locale === "th" ? "ห้องประชุมคณะพุทธศาสตร์" : "Faculty Meeting Rooms"}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {locale === "th" ? "ระบบขอใช้ห้องประชุมประจำคณะพุทธศาสตร์" : "Meeting Room Reservation"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {locale === "th"
              ? "ยื่นแบบฟอร์มขอใช้ห้องประชุมตามระเบียบคณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย วังน้อย"
              : "Faculty of Buddhism, Mahachulalongkornrajavidyalaya University, Wang Noi"}
          </p>
        </div>

        <Link
          href="/portal/meetings/book"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 px-5 py-3 text-sm font-bold text-white shadow-md hover:from-orange-500 hover:to-amber-500 transition-all duration-200"
        >
          <FileText className="h-4 w-4" />
          <span>{locale === "th" ? "ยื่นแบบฟอร์มขอใช้ห้องประชุม →" : "Submit Booking Request →"}</span>
        </Link>
      </div>

      {/* Available Rooms Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <MapPin className="h-5 w-5 text-orange-600" />
            <span>{locale === "th" ? "รายการห้องประชุมที่เปิดให้บริการ" : "Available Meeting Rooms"}</span>
          </h2>
          <span className="text-xs text-muted-foreground">{rooms.length} ห้อง</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => {
            const isFacultyZoneD = room.name.includes("พุทธศาสตร์") || room.capacity >= 70;
            return (
              <div
                key={room.id}
                className={`flex flex-col overflow-hidden rounded-3xl border bg-card transition-all duration-300 hover:shadow-lg ${
                  isFacultyZoneD ? "border-orange-300 ring-2 ring-orange-500/10" : "border-border"
                }`}
              >
                <div className="aspect-video w-full overflow-hidden bg-muted relative">
                  {room.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={room.imageUrl}
                      alt={room.name}
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-orange-100 to-amber-50 text-orange-800">
                      <Tv className="h-12 w-12 opacity-40 mb-1" />
                      <span className="text-xs font-bold opacity-75">{room.name}</span>
                    </div>
                  )}

                  {isFacultyZoneD && (
                    <div className="absolute top-3 left-3 rounded-full bg-orange-600/95 backdrop-blur-xs text-white text-[11px] font-bold px-3 py-1 shadow-sm">
                      ⭐ ห้องประชุมหลัก (โซนดี)
                    </div>
                  )}
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-foreground leading-snug">{room.name}</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-lg w-fit">
                        <Users className="h-3.5 w-3.5" />
                        <span>รองรับ {room.capacity} รูป/คน</span>
                      </div>
                      {room.equipment && (
                        <div className="text-xs text-muted-foreground flex items-start gap-1.5 leading-relaxed">
                          <span className="font-semibold text-foreground/80 shrink-0">อุปกรณ์:</span>
                          <span>{room.equipment}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t">
                    <Link
                      href={`/portal/meetings/book?roomId=${room.id}`}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-orange-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-2xs hover:bg-orange-500 transition"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>{locale === "th" ? "ขอใช้ห้องนี้ (ยื่นแบบฟอร์ม) →" : "Book This Room →"}</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Approved Schedule */}
      <div className="space-y-4 pt-6">
        <div className="flex items-center justify-between border-b pb-2">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            <span>{locale === "th" ? "ตารางการใช้ห้องประชุมที่ได้รับอนุมัติแล้ว" : "Upcoming Approved Schedule"}</span>
          </h2>
          <span className="text-xs text-muted-foreground">กำลังจะมาถึง</span>
        </div>

        {bookings.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border bg-card shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/60 border-b text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-4">{locale === "th" ? "วันและเวลา" : "Date & Time"}</th>
                    <th className="p-4">{locale === "th" ? "ห้องประชุม" : "Room"}</th>
                    <th className="p-4">{locale === "th" ? "หัวข้อการประชุม / กิจกรรม" : "Topic"}</th>
                    <th className="p-4">{locale === "th" ? "ผู้ขอใช้ / หน่วยงาน" : "Requester"}</th>
                    <th className="p-4 text-center">{locale === "th" ? "สถานะ" : "Status"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {bookings.map((b) => {
                    const meta = parseBookingRemark(b.remark);
                    return (
                      <tr key={b.id} className="hover:bg-muted/30 transition">
                        <td className="p-4 font-mono">
                          <div className="font-bold text-foreground">
                            {new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(b.startTime))}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {new Intl.DateTimeFormat("th-TH", { timeStyle: "short" }).format(new Date(b.startTime))} - {new Intl.DateTimeFormat("th-TH", { timeStyle: "short" }).format(new Date(b.endTime))} น.
                          </div>
                        </td>
                        <td className="p-4 font-semibold text-foreground">{b.room.name}</td>
                        <td className="p-4">
                          <div className="font-semibold text-foreground">{b.title}</div>
                          {meta.purposeType && (
                            <span className="inline-block mt-0.5 rounded-md bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground font-medium">
                              เพื่อ: {meta.purposeType === "MEETING" ? "ประชุม" : meta.purposeType === "TRAINING" ? "อบรม" : meta.purposeType === "SEMINAR" ? "สัมมนา" : meta.purposeOther || "อื่นๆ"}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-muted-foreground">
                          <div className="font-medium text-foreground">{meta.requesterName || b.requester.name}</div>
                          <div className="text-[11px] text-muted-foreground">{meta.requesterDepartment || "-"}</div>
                        </td>
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[11px] font-bold">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>อนุมัติแล้ว</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground border rounded-2xl bg-muted/20">
            {locale === "th" ? "ยังไม่มีรายการใช้ห้องประชุมที่ได้รับอนุมัติในเร็วๆ นี้" : "No upcoming approved bookings."}
          </div>
        )}
      </div>
    </div>
  );
}
