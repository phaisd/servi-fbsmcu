"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Printer,
  Edit3,
  Trash2,
  X,
  Loader2,
  Sparkles,
  FileText,
  MapPin,
  Check,
  Building2,
  ChevronRight,
} from "lucide-react";
import type { MeetingBooking, MeetingRoom, User, BookingStatus } from "@/generated/prisma";
import {
  MeetingBookingA4Document,
  parseBookingRemark,
  type MeetingBookingMetadata,
} from "@/features/meetings";
import {
  reviewOfficialBookingAction,
  approveOrRejectOfficialBookingAction,
  deleteMeetingBookingAction,
} from "@/features/meetings/actions";

type BookingWithRelations = MeetingBooking & { room: MeetingRoom; requester: User };

export function BookingsClient({ initialItems }: { initialItems: BookingWithRelations[] }) {
  const router = useRouter();
  const [items, setItems] = useState<BookingWithRelations[]>(initialItems);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modals state
  const [previewBooking, setPreviewBooking] = useState<BookingWithRelations | null>(null);
  const [reviewBooking, setReviewBooking] = useState<BookingWithRelations | null>(null);
  const [approvalBooking, setApprovalBooking] = useState<BookingWithRelations | null>(null);

  // Review form state (Officer)
  const [officerNote, setOfficerNote] = useState("");
  const [isRoomAvailable, setIsRoomAvailable] = useState<boolean>(true);
  const [officerSignName, setOfficerSignName] = useState("เจ้าหน้าที่ดูแลห้องประชุม");

  // Approval form state (Secretary to Dean Office)
  const [approvalDecision, setApprovalDecision] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [approverSignName, setApproverSignName] = useState("พระครูปลัดสมเกียรติ กิตฺติญาโณ");
  const [approverPosition, setApproverPosition] = useState("เลขานุการสำนักงานคณบดีคณะพุทธศาสตร์");
  const [approvalNote, setApprovalNote] = useState("");

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Open Officer Review modal
  const handleOpenReview = (b: BookingWithRelations) => {
    const meta = parseBookingRemark(b.remark);
    setOfficerNote(meta.officerNote || "");
    setIsRoomAvailable(meta.isRoomAvailable !== false);
    setOfficerSignName(meta.officerSignName || "เจ้าหน้าที่ดูแลห้องประชุม");
    setReviewBooking(b);
  };

  // Submit Officer Review
  const handleSaveReview = () => {
    if (!reviewBooking) return;
    startTransition(async () => {
      try {
        const res = await reviewOfficialBookingAction(reviewBooking.id, {
          officerNote,
          isRoomAvailable,
          officerSignName,
        });
        setItems((prev) => prev.map((item) => (item.id === res.id ? (res as BookingWithRelations) : item)));
        setReviewBooking(null);
        notify("บันทึกความเห็นของเจ้าหน้าที่เรียบร้อยแล้ว");
        router.refresh();
      } catch (err: unknown) {
        notify((err instanceof Error ? err.message : String(err)) || "เกิดข้อผิดพลาดในการบันทึก");
      }
    });
  };

  // Open Approval modal
  const handleOpenApproval = (b: BookingWithRelations) => {
    const meta = parseBookingRemark(b.remark);
    setApprovalDecision(b.status === "APPROVED" ? "APPROVED" : b.status === "REJECTED" ? "REJECTED" : "APPROVED");
    setApproverSignName(meta.approverSignName || "พระครูปลัดสมเกียรติ กิตฺติญาโณ");
    setApproverPosition(meta.approverPosition || "เลขานุการสำนักงานคณบดีคณะพุทธศาสตร์");
    setApprovalNote(meta.notes || "");
    setApprovalBooking(b);
  };

  // Submit Approval
  const handleSaveApproval = () => {
    if (!approvalBooking) return;
    startTransition(async () => {
      try {
        const res = await approveOrRejectOfficialBookingAction(approvalBooking.id, {
          decision: approvalDecision,
          approverSignName,
          approverPosition,
          note: approvalNote,
        });
        setItems((prev) => prev.map((item) => (item.id === res.id ? (res as BookingWithRelations) : item)));
        setApprovalBooking(null);
        notify(
          approvalDecision === "APPROVED"
            ? "อนุมัติคำขอใช้ห้องประชุมเรียบร้อยแล้ว"
            : "บันทึกไม่อนุมัติคำขอเรียบร้อยแล้ว"
        );
        router.refresh();
      } catch (err: unknown) {
        notify((err instanceof Error ? err.message : String(err)) || "เกิดข้อผิดพลาดในการอนุมัติ");
      }
    });
  };

  // Delete booking
  const handleDeleteBooking = (id: string, title: string) => {
    if (!window.confirm(`ยืนยันการลบคำขอ "${title}" หรือไม่?`)) return;
    startTransition(async () => {
      try {
        await deleteMeetingBookingAction(id);
        setItems((prev) => prev.filter((item) => item.id !== id));
        notify("ลบคำขอใช้ห้องประชุมเรียบร้อยแล้ว");
        router.refresh();
      } catch (err: unknown) {
        notify((err instanceof Error ? err.message : String(err)) || "เกิดข้อผิดพลาดในการลบคำขอ");
      }
    });
  };

  // Filtered items
  const filteredItems = items.filter((item) => {
    const meta = parseBookingRemark(item.remark);
    const matchesStatus =
      statusFilter === "ALL" ? true : item.status === statusFilter;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesStatus;

    const matchesSearch =
      item.title.toLowerCase().includes(q) ||
      item.room.name.toLowerCase().includes(q) ||
      (meta.requesterName || "").toLowerCase().includes(q) ||
      (meta.requesterDepartment || "").toLowerCase().includes(q) ||
      (item.requester.name || "").toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  const pendingCount = items.filter((i) => i.status === "PENDING").length;
  const approvedCount = items.filter((i) => i.status === "APPROVED").length;
  const rejectedCount = items.filter((i) => i.status === "REJECTED").length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl animate-in fade-in">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 text-orange-800 px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-2">
            <Calendar className="h-3.5 w-3.5" />
            <span>ระบบบริหารจัดการห้องประชุม</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            รายการคำขอใช้ห้องประชุม (ใบขอใช้ห้องประชุมประจำคณะพุทธศาสตร์)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ตรวจสอบความว่าง บันทึกความเห็นเจ้าหน้าที่ และพิจารณาอนุมัติคำขอตามแบบฟอร์มทางการ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/portal/meetings/book")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-orange-500 transition"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>+ สร้างใบขอใช้ห้องประชุมใหม่</span>
          </button>
        </div>
      </div>

      {/* Stats Counter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setStatusFilter("ALL")}
          className={`p-4 rounded-2xl border text-left transition ${
            statusFilter === "ALL" ? "border-slate-800 bg-slate-900 text-white shadow-md" : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          <div className="text-xs font-semibold opacity-75">คำขอทั้งหมด</div>
          <div className="text-2xl font-black mt-1">{items.length}</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("PENDING")}
          className={`p-4 rounded-2xl border text-left transition ${
            statusFilter === "PENDING" ? "border-amber-500 bg-amber-500 text-white shadow-md" : "border-amber-200 bg-amber-50/70 hover:bg-amber-100/70 text-amber-950"
          }`}
        >
          <div className="text-xs font-semibold opacity-85">รอตรวจสอบ/อนุมัติ</div>
          <div className="text-2xl font-black mt-1">{pendingCount}</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("APPROVED")}
          className={`p-4 rounded-2xl border text-left transition ${
            statusFilter === "APPROVED" ? "border-emerald-600 bg-emerald-600 text-white shadow-md" : "border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-950"
          }`}
        >
          <div className="text-xs font-semibold opacity-85">อนุมัติแล้ว</div>
          <div className="text-2xl font-black mt-1">{approvedCount}</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("REJECTED")}
          className={`p-4 rounded-2xl border text-left transition ${
            statusFilter === "REJECTED" ? "border-rose-600 bg-rose-600 text-white shadow-md" : "border-rose-200 bg-rose-50/70 hover:bg-rose-100/70 text-rose-950"
          }`}
        >
          <div className="text-xs font-semibold opacity-85">ไม่อนุมัติ / ยกเลิก</div>
          <div className="text-2xl font-black mt-1">{rejectedCount}</div>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อเรื่อง, ผู้ขอใช้, สังกัด หรือห้องประชุม..."
            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-xs focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 w-full sm:w-auto"
          >
            <option value="ALL">สถานะทั้งหมด ({items.length})</option>
            <option value="PENDING">รอพิจารณา ({pendingCount})</option>
            <option value="APPROVED">อนุมัติแล้ว ({approvedCount})</option>
            <option value="REJECTED">ไม่อนุมัติ ({rejectedCount})</option>
          </select>
        </div>
      </div>

      {/* Bookings Table Card */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4">วันและเวลาที่ขอใช้</th>
                <th className="p-4">ห้องประชุม</th>
                <th className="p-4">เรื่อง / วาระการประชุม</th>
                <th className="p-4">ผู้ยื่นคำร้อง & สังกัด</th>
                <th className="p-4">สถานะคำขอ</th>
                <th className="p-4 text-right">การจัดการ & ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((b) => {
                const meta = parseBookingRemark(b.remark);
                return (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition">
                    {/* Time */}
                    <td className="p-4 font-mono whitespace-nowrap">
                      <div className="font-bold text-slate-900">
                        {new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(b.startTime))}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Intl.DateTimeFormat("th-TH", { timeStyle: "short" }).format(new Date(b.startTime))} - {new Intl.DateTimeFormat("th-TH", { timeStyle: "short" }).format(new Date(b.endTime))} น.
                        </span>
                      </div>
                    </td>

                    {/* Room */}
                    <td className="p-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{b.room.name}</div>
                      <div className="text-[11px] text-slate-500">
                        รองรับ {b.room.capacity} รูป/คน
                      </div>
                    </td>

                    {/* Topic & Purpose */}
                    <td className="p-4 min-w-[220px]">
                      <div className="font-bold text-slate-900 line-clamp-2">{b.title}</div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="rounded-md bg-orange-100 text-orange-800 px-2 py-0.5 text-[10px] font-bold">
                          เพื่อ: {meta.purposeType === "MEETING" ? "ประชุม" : meta.purposeType === "TRAINING" ? "อบรม" : meta.purposeType === "SEMINAR" ? "สัมมนา" : meta.purposeOther || "อื่นๆ"}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {meta.attendeeCount || 1} รูป/คน
                        </span>
                      </div>
                    </td>

                    {/* Requester & Department */}
                    <td className="p-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">
                        {meta.requesterName || b.requester.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {meta.requesterPosition || meta.requesterDepartment || "-"}
                      </div>
                      {meta.requesterPhone && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          โทร: {meta.requesterPhone}
                        </div>
                      )}
                    </td>

                    {/* Status Pill */}
                    <td className="p-4 whitespace-nowrap">
                      {b.status === "APPROVED" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-800">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span>อนุมัติแล้ว</span>
                        </span>
                      ) : b.status === "PENDING" ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-800">
                            <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                            <span>รอพิจารณา</span>
                          </span>
                          {meta.isRoomAvailable === true && (
                            <div className="text-[10px] text-emerald-600 font-semibold">
                              ✓ เจ้าหน้าที่ตรวจแล้ว: ห้องว่าง
                            </div>
                          )}
                          {meta.isRoomAvailable === false && (
                            <div className="text-[10px] text-rose-600 font-semibold">
                              ✕ เจ้าหน้าที่ตรวจแล้ว: ห้องไม่ว่าง
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-[11px] font-bold text-rose-800">
                          <XCircle className="h-3.5 w-3.5 text-rose-600" />
                          <span>ไม่อนุมัติ</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {/* A4 Preview & Print */}
                        <button
                          type="button"
                          onClick={() => setPreviewBooking(b)}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                          title="พรีวิว / พิมพ์ใบขอใช้ห้องประชุม A4"
                        >
                          <Printer className="h-3.5 w-3.5 text-indigo-600" />
                          <span className="hidden sm:inline">พิมพ์ A4</span>
                        </button>

                        {/* Officer Review button */}
                        <button
                          type="button"
                          onClick={() => handleOpenReview(b)}
                          className="inline-flex items-center gap-1 rounded-xl border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition shadow-2xs"
                          title="บันทึกความเห็นเจ้าหน้าที่ / ตรวจห้องว่าง"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-amber-700" />
                          <span className="hidden sm:inline">ตรวจห้อง</span>
                        </button>

                        {/* Approver Decision button */}
                        <button
                          type="button"
                          onClick={() => handleOpenApproval(b)}
                          className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition shadow-2xs"
                          title="พิจารณาอนุมัติ / ไม่อนุมัติ (เลขานุการสำนักงานคณบดี)"
                        >
                          <Check className="h-3.5 w-3.5 text-amber-400" />
                          <span>อนุมัติ</span>
                        </button>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteBooking(b.id, b.title)}
                          className="rounded-xl p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                          title="ลบคำขอ"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredItems.length === 0 && (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <Calendar className="h-10 w-10 mx-auto opacity-40" />
              <div className="text-sm font-semibold">ไม่พบรายการคำขอใช้ห้องประชุม</div>
              <div className="text-xs">สามารถสร้างคำขอใหม่ได้จากปุ่มด้านบน</div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: A4 DOCUMENT PREVIEW & PRINT */}
      {previewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-slate-100 rounded-3xl shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-bold">
                  ใบขอใช้ห้องประชุมประจำคณะพุทธศาสตร์ — {previewBooking.title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-orange-500 transition shadow-sm"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>สั่งพิมพ์ (Print)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewBooking(null)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-8 overflow-x-auto flex justify-center bg-slate-200/80">
              <div className="scale-90 sm:scale-100 origin-top">
                <MeetingBookingA4Document
                  metadata={parseBookingRemark(previewBooking.remark)}
                  roomName={previewBooking.room.name}
                  roomCapacity={previewBooking.room.capacity}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: OFFICER REVIEW (ความเห็นของเจ้าหน้าที่ & ตรวจสอบห้องว่าง) */}
      {reviewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">
                  บันทึกความเห็นของเจ้าหน้าที่ดูแลห้องประชุม
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReviewBooking(null)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 text-xs space-y-1">
              <div className="font-semibold text-slate-800">เรื่อง: {reviewBooking.title}</div>
              <div className="text-slate-500">
                ห้อง: {reviewBooking.room.name} | เวลา: {new Date(reviewBooking.startTime).toLocaleString("th-TH")} - {new Date(reviewBooking.endTime).toLocaleString("th-TH")}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  ความเห็นของเจ้าหน้าที่ (ระบุ)
                </label>
                <input
                  type="text"
                  value={officerNote}
                  onChange={(e) => setOfficerNote(e.target.value)}
                  placeholder="เช่น ตรวจสอบตารางการใช้แล้ว ห้องมีความพร้อมและว่างตามเวลาที่ขอ"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  ในวัน/เวลาที่ขอใช้ห้องประชุม *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                      isRoomAvailable
                        ? "border-emerald-500 bg-emerald-50 text-emerald-950 font-bold"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="avail"
                      checked={isRoomAvailable === true}
                      onChange={() => setIsRoomAvailable(true)}
                    />
                    <span className="text-xs">🔘 ว่าง (พร้อมใช้งาน)</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                      !isRoomAvailable
                        ? "border-rose-500 bg-rose-50 text-rose-950 font-bold"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="avail"
                      checked={isRoomAvailable === false}
                      onChange={() => setIsRoomAvailable(false)}
                    />
                    <span className="text-xs">🔘 ไม่ว่าง (ติดภารกิจอื่น)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  ลงชื่อเจ้าหน้าที่ผู้ตรวจสอบ
                </label>
                <input
                  type="text"
                  value={officerSignName}
                  onChange={(e) => setOfficerSignName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setReviewBooking(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleSaveReview}
                className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-5 py-2 text-xs font-bold text-white hover:bg-orange-500 disabled:opacity-50"
              >
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                <span>บันทึกความเห็นเจ้าหน้าที่</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: APPROVER DECISION (ความเห็นผู้อนุมัติ: เลขานุการสำนักงานคณบดีคณะพุทธศาสตร์) */}
      {approvalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  พิจารณาอนุมัติคำขอใช้ห้องประชุม
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setApprovalBooking(null)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 text-xs space-y-1">
              <div className="font-semibold text-slate-800">เรื่อง: {approvalBooking.title}</div>
              <div className="text-slate-500">
                ห้อง: {approvalBooking.room.name} | ผู้ยื่น: {parseBookingRemark(approvalBooking.remark).requesterName || approvalBooking.requester.name}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  ผลการพิจารณา (ความเห็น) *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition ${
                      approvalDecision === "APPROVED"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/10"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="decision"
                      checked={approvalDecision === "APPROVED"}
                      onChange={() => setApprovalDecision("APPROVED")}
                    />
                    <span className="text-xs">🔘 อนุมัติการใช้ห้อง</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition ${
                      approvalDecision === "REJECTED"
                        ? "border-rose-600 bg-rose-50 text-rose-950 font-bold ring-2 ring-rose-500/10"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="decision"
                      checked={approvalDecision === "REJECTED"}
                      onChange={() => setApprovalDecision("REJECTED")}
                    />
                    <span className="text-xs">🔘 ไม่อนุมัติ</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  ลงชื่อผู้อนุมัติ (Authorized Signatory) *
                </label>
                <input
                  type="text"
                  required
                  value={approverSignName}
                  onChange={(e) => setApproverSignName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  ตำแหน่งผู้อนุมัติ
                </label>
                <input
                  type="text"
                  value={approverPosition}
                  onChange={(e) => setApproverPosition(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  หมายเหตุ / ข้อความสั่งการเพิ่มเติม (ถ้ามี)
                </label>
                <input
                  type="text"
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  placeholder="เช่น มอบเจ้าหน้าที่ดูแลเครื่องขยายเสียงและโสตทัศนูปกรณ์ให้พร้อม"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setApprovalBooking(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleSaveApproval}
                className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-xs transition disabled:opacity-50 ${
                  approvalDecision === "APPROVED"
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : "bg-rose-600 hover:bg-rose-500"
                }`}
              >
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                <span>
                  {approvalDecision === "APPROVED"
                    ? "ยืนยันการอนุมัติคำขอ"
                    : "ยืนยันไม่อนุมัติคำขอ"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
