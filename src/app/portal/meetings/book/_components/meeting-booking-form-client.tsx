"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Sparkles,
  Printer,
  Eye,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  FileText,
  Building2,
  Tv,
  Mic,
  Monitor,
  Video,
  Send,
  X,
  ChevronDown,
} from "lucide-react";
import type { MeetingRoom } from "@/generated/prisma";
import {
  MeetingBookingA4Document,
  type MeetingBookingMetadata,
  type MeetingFormSettings,
  getEarliestBookingDate,
  formatDateToIsoDate,
  validateAdvanceBookingDate,
} from "@/features/meetings";
import { createOfficialBookingAction } from "@/features/meetings/actions";

interface PersonnelItem {
  id: string;
  fullNameTh: string;
  positionTh: string;
  departmentNameTh: string;
  email: string;
  phoneNumber: string;
}

interface Props {
  rooms: MeetingRoom[];
  initialRoomId?: string;
  personnelList: PersonnelItem[];
  currentUser?: {
    id: string;
    name: string;
    email: string;
  } | null;
  formSettings?: MeetingFormSettings;
}

export function MeetingBookingFormClient({
  rooms,
  initialRoomId,
  personnelList,
  currentUser,
  formSettings,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Success dialog after submission
  const [submittedBooking, setSubmittedBooking] = useState<{
    id: string;
    title: string;
    roomName: string;
    startTime: string;
    endTime: string;
  } | null>(null);

  // Selected room
  const defaultRoomId =
    initialRoomId ||
    rooms.find((r) => r.name.includes("พุทธศาสตร์") || r.name.includes("โซนดี"))?.id ||
    rooms[0]?.id ||
    "";

  const [selectedRoomId, setSelectedRoomId] = useState<string>(defaultRoomId);

  // Form state matching the official PDF form (บังคับเงื่อนไขเว้นอย่างน้อย 1 วันทำการ ไม่รวมวันหยุดเสาร์-อาทิตย์)
  const earliestAllowedDate = getEarliestBookingDate(new Date(), 1);
  const earliestAllowedIso = formatDateToIsoDate(earliestAllowedDate);
  const earliestAllowedThaiStr = earliestAllowedDate.toLocaleDateString("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const [form, setForm] = useState<{
    requesterName: string;
    requesterPosition: string;
    requesterDepartment: string;
    requesterEmail: string;
    purposeType: string;
    purposeOther: string;
    topic: string;
    startDate: string;
    startTimeStr: string;
    endDate: string;
    endTimeStr: string;
    attendeeCount: number;
    equipments: Record<string, boolean | string>;
    coordinatorName: string;
    coordinatorEmail: string;
    agreedToRules: boolean;
  }>({
    requesterName: currentUser?.name || "",
    requesterPosition: "อาจารย์ / เจ้าหน้าที่",
    requesterDepartment: "คณะพุทธศาสตร์ มจร",
    requesterEmail: currentUser?.email || "",
    purposeType: formSettings?.purposes?.[0]?.id || "MEETING",
    purposeOther: "",
    topic: "",
    startDate: earliestAllowedIso,
    startTimeStr: "09:00",
    endDate: earliestAllowedIso,
    endTimeStr: "16:30",
    attendeeCount: 30,
    equipments: {
      computer: true,
      ledDisplay: true,
      soundSystem: true,
      zoomOnline: false,
      other: "",
    },
    coordinatorName: currentUser?.name || "",
    coordinatorEmail: currentUser?.email || "",
    agreedToRules: true,
  });

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  // Auto-fill from Personnel Directory
  const handleSelectPersonnel = (pId: string) => {
    const person = personnelList.find((p) => p.id === pId);
    if (!person) return;
    setForm((prev) => ({
      ...prev,
      requesterName: person.fullNameTh,
      requesterPosition: person.positionTh,
      requesterDepartment: person.departmentNameTh || "คณะพุทธศาสตร์ มจร",
      requesterEmail: person.email || prev.requesterEmail,
      coordinatorName: prev.coordinatorName || person.fullNameTh,
      coordinatorEmail: prev.coordinatorEmail || person.email,
    }));
    notify(`⚡ ดึงข้อมูล: ${person.fullNameTh} เรียบร้อยแล้ว`);
  };

  // Construct metadata object for preview & submission
  const currentMetadata: MeetingBookingMetadata = {
    requestDate: new Date().toISOString(),
    requesterName: form.requesterName,
    requesterPosition: form.requesterPosition,
    requesterDepartment: form.requesterDepartment,
    requesterPhone: "",
    requesterEmail: form.requesterEmail,
    purposeType: form.purposeType,
    purposeOther: form.purposeOther,
    topic: form.topic,
    startDate: form.startDate,
    startTimeStr: form.startTimeStr,
    endDate: form.endDate,
    endTimeStr: form.endTimeStr,
    attendeeCount: form.attendeeCount,
    equipments: form.equipments,
    coordinatorName: form.coordinatorName || form.requesterName,
    coordinatorEmail: form.coordinatorEmail || form.requesterEmail,
    coordinatorPhone: "",
    officerNote: "",
    isRoomAvailable: null,
    officerSignName: "",
    officerReviewDate: "",
    approverDecision: "PENDING",
    approverSignName: "พระครูปลัดสมเกียรติ กิตฺติญาโณ",
    approverPosition: "เลขานุการสำนักงานคณบดีคณะพุทธศาสตร์",
    approverDate: "",
    notes: "",
  };

  // Check if booking is a single-day request ending after 16:45
  const isSingleDay = Boolean(form.startDate && form.endDate && form.startDate === form.endDate);
  const isAfterWorkHours = isSingleDay && form.endTimeStr > "16:45";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId) {
      notify("กรุณาเลือกห้องประชุมที่ต้องการขอใช้");
      return;
    }
    if (!form.requesterName.trim()) {
      notify("กรุณากรอกชื่อ-นามสกุล / พระฉายา ของผู้ขอใช้ห้อง");
      return;
    }
    if (!form.topic.trim()) {
      notify("กรุณาระบุเรื่อง / วาระการประชุม");
      return;
    }
    if (!form.coordinatorEmail.trim()) {
      notify("กรุณากรอกอีเมลของผู้ประสานงาน");
      return;
    }
    if (!form.agreedToRules) {
      notify("กรุณายืนยันการปฏิบัติตามกฎระเบียบของการใช้ห้องประชุม");
      return;
    }

    // Combine dates and times into Date objects
    const startIso = `${form.startDate}T${form.startTimeStr}:00`;
    const endIso = `${form.endDate || form.startDate}T${form.endTimeStr}:00`;

    const startDt = new Date(startIso);
    const endDt = new Date(endIso);

    if (isNaN(startDt.getTime()) || isNaN(endDt.getTime())) {
      notify("รูปแบบวันและเวลาไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง");
      return;
    }

    if (startDt >= endDt) {
      notify("เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น");
      return;
    }

    // Check advance booking rule (เว้น 1 วันทำการ ไม่รวมเสาร์-อาทิตย์)
    const advanceCheck = validateAdvanceBookingDate(startDt, new Date(), 1);
    if (!advanceCheck.isValid) {
      notify(advanceCheck.message || "กรุณาเลือกวันขอใช้งานล่วงหน้าตามเกณฑ์ที่กำหนด");
      return;
    }

    startTransition(async () => {
      try {
        const res = await createOfficialBookingAction({
          roomId: selectedRoomId,
          title: form.topic,
          startTime: startDt,
          endTime: endDt,
          metadata: currentMetadata,
        });

        setSubmittedBooking({
          id: res.id,
          title: res.title,
          roomName: res.room.name,
          startTime: res.startTime.toLocaleString("th-TH"),
          endTime: res.endTime.toLocaleString("th-TH"),
        });

        notify("ส่งคำขอใช้ห้องประชุมเรียบร้อยแล้ว เจ้าหน้าที่จะดำเนินการตรวจสอบความพร้อม");
      } catch (err: unknown) {
        notify((err instanceof Error ? err.message : String(err)) || "เกิดข้อผิดพลาดในการส่งคำขอ");
      }
    });
  };

  return (
    <div className="mx-auto max-w-4xl py-8 px-4 sm:px-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl animate-in fade-in slide-in-from-bottom-5">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/portal/meetings"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>กลับไปยังรายการห้องประชุมและตารางการใช้</span>
        </Link>
      </div>

      {/* Main Container Card */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden">
        {/* Header Banner */}
        <div className="bg-linear-to-r from-orange-600 via-amber-600 to-indigo-700 p-6 sm:p-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-xs px-3 py-1 text-xs font-bold text-white mb-2">
                <FileText className="h-3.5 w-3.5" />
                <span>แบบฟอร์มทางการ คณะพุทธศาสตร์ มจร</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                ใบขอใช้ห้องประชุมประจำคณะพุทธศาสตร์
              </h1>
              <p className="text-xs sm:text-sm text-white/90">
                มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย ตำบลลำไทร อำเภอวังน้อย จังหวัดพระนครศรีอยุธยา
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/90 px-3.5 py-2 text-xs font-bold text-slate-900 shadow-md hover:bg-white transition"
              >
                <Eye className="h-3.5 w-3.5 text-indigo-600" />
                <span>ดูตัวอย่างเอกสาร A4</span>
              </button>
            </div>
          </div>

          {/* Rules alert banner */}
          <div className="mt-4 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 p-3 text-xs text-white/95 space-y-0.5">
            <div className="font-bold flex items-center gap-1.5">
              <span>📌 ระเบียบการขอใช้ห้องประชุม:</span>
            </div>
            <div className="pl-4 text-[11px] leading-relaxed opacity-90">
              1. ผู้ยืม (หน่วยงานที่ขอใช้ห้องประชุม) จะต้องดูแลการใช้ห้องประชุมให้เป็นที่เรียบร้อย<br />
              2. ผู้ยืม (หน่วยงานที่ขอใช้ห้องประชุม) จะต้องติดต่อขอใช้ห้องก่อนอย่างน้อย ๒ วัน
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
          {/* QUICK AUTO-FILL FROM PERSONNEL DIRECTORY */}
          <div className="overflow-hidden rounded-2xl border border-indigo-200/90 bg-linear-to-br from-indigo-50/80 via-white to-purple-50/50 p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 shadow-2xs">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-indigo-950">
                    ดึงข้อมูลผู้ขอใช้อัตโนมัติจากทำเนียบบุคลากร (Personnel Directory)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    เลือกลิสต์รายชื่ออาจารย์/เจ้าหน้าที่เพื่อนำข้อมูลชื่อ ตำแหน่ง เบอร์โทร และอีเมลมาใส่ในฟอร์มอัตโนมัติ
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100/80 px-2.5 py-1 text-[11px] font-semibold text-indigo-800">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
                {personnelList.length} ท่านในทำเนียบ
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full min-w-0">
              <div className="relative flex-1 min-w-0 w-full">
                <select
                  onChange={(e) => handleSelectPersonnel(e.target.value)}
                  defaultValue=""
                  className="w-full min-w-0 max-w-full appearance-none rounded-xl border border-indigo-200/90 bg-white pl-3.5 pr-10 py-2.5 text-xs font-semibold text-slate-800 shadow-2xs hover:border-indigo-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-none transition truncate"
                >
                  <option value="">-- คลิกเลือกชื่ออาจารย์ หรือ เจ้าหน้าที่ผู้ขอใช้ห้อง --</option>
                  <optgroup label="👨‍🏫 คณาจารย์ประจำและอาจารย์พิเศษ (Academic)">
                    {personnelList
                      .filter((p) => !p.departmentNameTh.includes("สำนักงาน") && !p.positionTh.includes("เจ้าหน้าที่"))
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.fullNameTh} — {p.positionTh} ({p.departmentNameTh})
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="💼 เจ้าหน้าที่สายสนับสนุน (Support Staff)">
                    {personnelList
                      .filter((p) => p.departmentNameTh.includes("สำนักงาน") || p.positionTh.includes("เจ้าหน้าที่"))
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.fullNameTh} — {p.positionTh} ({p.departmentNameTh})
                        </option>
                      ))}
                  </optgroup>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500" />
              </div>
            </div>

            {form.requesterName && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl bg-emerald-50/90 border border-emerald-200 p-3 text-xs text-emerald-900 shadow-2xs">
                <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-emerald-950 truncate">{form.requesterName}</span>
                      <span className="rounded-full bg-emerald-200/70 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                        ดึงข้อมูลสำเร็จ
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-700 truncate">
                      {form.requesterPosition || "-"} · {form.requesterDepartment || "-"}
                      {form.requesterEmail ? ` · อีเมล: ${form.requesterEmail}` : ""}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      requesterName: "",
                      requesterPosition: "",
                      requesterDepartment: "",
                      requesterEmail: "",
                    }))
                  }
                  className="self-end sm:self-center shrink-0 rounded-lg border border-emerald-300 bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100 transition"
                >
                  ล้างข้อมูล
                </button>
              </div>
            )}
          </div>

          {/* SECTION 1: APPLICANT INFO */}
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b pb-2">
              <Users className="h-4 w-4 text-orange-600" />
              <span>1. ข้อมูลผู้ขอใช้ห้องประชุม (Applicant Information)</span>
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  ข้าพเจ้า (ชื่อ-นามสกุล / พระฉายา) *
                </label>
                <input
                  type="text"
                  required
                  value={form.requesterName}
                  onChange={(e) => setForm((p) => ({ ...p, requesterName: e.target.value }))}
                  placeholder="เช่น พระครูปลัด... หรือ นาย..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  ตำแหน่ง (Position) *
                </label>
                <input
                  type="text"
                  required
                  value={form.requesterPosition}
                  onChange={(e) => setForm((p) => ({ ...p, requesterPosition: e.target.value }))}
                  placeholder="เช่น อาจารย์ประจำ, หัวหน้าภาควิชา, นักวิชาการศึกษา"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  สังกัดงาน / หน่วยงาน (Department / Office) *
                </label>
                <input
                  type="text"
                  required
                  value={form.requesterDepartment}
                  onChange={(e) => setForm((p) => ({ ...p, requesterDepartment: e.target.value }))}
                  placeholder="เช่น ภาควิชาพระพุทธศาสนา คณะพุทธศาสตร์"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  อีเมล (Email) *
                </label>
                <input
                  type="email"
                  required
                  value={form.requesterEmail}
                  onChange={(e) => setForm((p) => ({ ...p, requesterEmail: e.target.value }))}
                  placeholder="เช่น staff@mcu.ac.th"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: ROOM SELECTION & PURPOSE */}
          <div className="space-y-4 pt-2">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b pb-2">
              <MapPin className="h-4 w-4 text-orange-600" />
              <span>2. ห้องประชุมและวัตถุประสงค์การใช้งาน (Room & Meeting Purpose)</span>
            </h2>

            {/* Room selection */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                เลือกห้องประชุมที่ต้องการขอใช้ *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {rooms.map((room) => {
                  const active = room.id === selectedRoomId;
                  const isFacultyRoom = room.name.includes("พุทธศาสตร์") || room.capacity >= 70;
                  return (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => setSelectedRoomId(room.id)}
                      className={`flex flex-col text-left p-3.5 rounded-2xl border transition ${
                        active
                          ? "border-orange-600 bg-orange-50/70 ring-2 ring-orange-500/20"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900">{room.name}</span>
                        {isFacultyRoom && (
                          <span className="rounded-md bg-orange-100 text-orange-800 px-2 py-0.5 text-[10px] font-bold">
                            ตามแบบฟอร์มทางการ
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <Users className="h-3 w-3" />
                          <span>รองรับ {room.capacity} รูป/คน</span>
                        </span>
                        {room.equipment && (
                          <span className="truncate max-w-[200px] text-slate-400">
                            • {room.equipment}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Purpose selection (รองรับตัวเลือกไดนามิกที่ Admin ตั้งค่าไว้) */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-700">
                มีความประสงค์จะใช้ห้องประชุม เพื่อ (Purpose) *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(formSettings?.purposes?.length
                  ? formSettings.purposes
                  : [
                      { id: "MEETING", label: "ประชุม (Meeting)" },
                      { id: "TRAINING", label: "อบรม (Training)" },
                      { id: "SEMINAR", label: "สัมมนา (Seminar)" },
                      { id: "OTHER", label: "อื่นๆ (Other)" },
                    ]
                ).map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                      form.purposeType === item.id
                        ? "border-orange-600 bg-orange-50 text-orange-950 font-bold"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="purposeType"
                      value={item.id}
                      checked={form.purposeType === item.id}
                      onChange={() => setForm((p) => ({ ...p, purposeType: item.id }))}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-xs">{item.label}</span>
                  </label>
                ))}
              </div>

              {(form.purposeType === "OTHER" || form.purposeType.includes("OTHER")) && (
                <div className="mt-2.5">
                  <input
                    type="text"
                    required
                    value={form.purposeOther}
                    onChange={(e) => setForm((p) => ({ ...p, purposeOther: e.target.value }))}
                    placeholder="กรุณาระบุวัตถุประสงค์อื่นๆ เช่น ปฐมนิเทศ, ประชุมสัมมนางานวิจัย, บรรยายพิเศษ"
                    className="w-full rounded-xl border border-orange-300 px-3 py-2 text-xs"
                  />
                </div>
              )}
            </div>

            {/* Topic */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                เรื่อง / วาระการประชุม (Topic / Subject) *
              </label>
              <input
                type="text"
                required
                value={form.topic}
                onChange={(e) => setForm((p) => ({ ...p, topic: e.target.value }))}
                placeholder="เช่น การประชุมคณะกรรมการประจำคณะพุทธศาสตร์ ครั้งที่ ๑๐/๒๕๖๙"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />
            </div>

            {/* Date & Time range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 p-3 rounded-2xl border border-slate-200 bg-slate-50/50">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-orange-600" />
                  <span>เริ่มใช้งาน (Start Date & Time) *</span>
                </span>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">วันที่</label>
                    <input
                      type="date"
                      required
                      min={earliestAllowedIso}
                      value={form.startDate}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          startDate: e.target.value,
                          endDate: p.endDate < e.target.value ? e.target.value : p.endDate,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">เวลา (น.)</label>
                    <input
                      type="time"
                      required
                      value={form.startTimeStr}
                      onChange={(e) => setForm((p) => ({ ...p, startTimeStr: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 p-3 rounded-2xl border border-slate-200 bg-slate-50/50">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-orange-600" />
                  <span>สิ้นสุดการใช้งาน (End Date & Time) *</span>
                </span>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">ถึงวันที่</label>
                    <input
                      type="date"
                      required
                      value={form.endDate}
                      min={form.startDate || earliestAllowedIso}
                      onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">
                      ถึงเวลา (น.) <span className="text-[10px] text-slate-400 font-normal">(แนะนำไม่เกิน 16.45 น.)</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={form.endTimeStr}
                      onChange={(e) => setForm((p) => ({ ...p, endTimeStr: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Single-day after work hours soft notice */}
            {isAfterWorkHours && (
              <div className="flex items-start gap-2.5 rounded-2xl border border-sky-300 bg-sky-50/80 p-3 sm:p-3.5 text-xs text-sky-950 shadow-2xs animate-in fade-in duration-200">
                <Clock className="h-4 w-4 shrink-0 text-sky-600 mt-0.5" />
                <div className="space-y-0.5 text-[11px] sm:text-xs">
                  <span className="font-bold text-sky-900">
                    คำแนะนำเวลาการใช้อาคาร (การขอใช้ภายในวันเดียว):
                  </span>{" "}
                  <span className="text-sky-800 leading-relaxed">
                    เพื่อความสะดวกและเกรงใจเจ้าหน้าที่ในการตรวจสอบอุปกรณ์ โสตทัศนูปกรณ์ และปิดระบบอาคารตามเวลาราชการ แนะนำให้กิจกรรมเสร็จสิ้นไม่เกิน <strong>๑๖.๔๕ น.</strong> (หากมีความจำเป็นต้องจัดกิจกรรมล่วงเลยเวลาดังกล่าว โปรดติดต่อประสานงานเจ้าหน้าที่ผู้ดูแลอาคารล่วงหน้า)
                  </span>
                </div>
              </div>
            )}

            {/* Advance booking policy note */}
            <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200/90 bg-amber-50/70 p-3 sm:p-3.5 text-xs text-amber-950 shadow-2xs">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <div className="space-y-0.5 text-[11px] sm:text-xs">
                <span className="font-bold text-amber-900">
                  เงื่อนไขการจองล่วงหน้า (เว้นอย่างน้อย ๑ วันทำการ ไม่รวมวันเสาร์-อาทิตย์):
                </span>{" "}
                <span className="text-amber-800">
                  เพื่อให้เจ้าหน้าที่เตรียมความพร้อมห้อง โสตทัศนูปกรณ์ และระบบ Zoom ในการนี้สามารถขอใช้ห้องประชุมได้เร็วที่สุดตั้งแต่วัน{" "}
                  <strong className="underline underline-offset-2 font-bold text-amber-950">{earliestAllowedThaiStr}</strong>{" "}
                  เป็นต้นไป
                </span>
              </div>
            </div>

            {/* Attendee count */}
            <div className="max-w-xs">
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                มีจำนวนผู้เข้าใช้ห้องประชุมประมาณ (รูป/คน) *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={selectedRoom?.capacity || 100}
                  required
                  value={form.attendeeCount}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, attendeeCount: parseInt(e.target.value, 10) || 1 }))
                  }
                  className="w-32 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold"
                />
                <span className="text-xs text-slate-500">
                  รูป/คน (สูงสุด {selectedRoom?.capacity || 70} ที่นั่ง)
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3: EQUIPMENT CHECKLIST */}
          <div className="space-y-4 pt-2">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b pb-2">
              <Tv className="h-4 w-4 text-orange-600" />
              <span>3. ต้องการใช้อุปกรณ์ ดังนี้ (Equipment & Facilities)</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(
                formSettings?.equipments || [
                  {
                    key: "computer",
                    label: "คอมพิวเตอร์",
                    desc: "เครื่องคอมพิวเตอร์ควบคุมห้อง",
                  },
                  {
                    key: "ledDisplay",
                    label: "จอ LED",
                    desc: "จอแสดงผลหลัก / โปรเจกเตอร์",
                  },
                  {
                    key: "soundSystem",
                    label: "เครื่องขยายเสียง",
                    desc: "ไมโครโฟนตั้งโต๊ะ / ไร้สาย",
                  },
                  {
                    key: "zoomOnline",
                    label: "Zoom Online",
                    desc: "สัญญาณถ่ายทอดสด / Hybrid",
                  },
                ]
              ).map((eq) => {
                const getIcon = (keyOrLabel: string) => {
                  const lower = keyOrLabel.toLowerCase();
                  if (lower.includes("comput") || lower.includes("monitor")) return Monitor;
                  if (lower.includes("sound") || lower.includes("mic")) return Mic;
                  if (lower.includes("zoom") || lower.includes("video") || lower.includes("online")) return Video;
                  return Tv;
                };
                const Icon = getIcon(eq.key + " " + eq.label);
                const checked = Boolean(form.equipments[eq.key]);
                return (
                  <label
                    key={eq.key}
                    className={`flex flex-col p-3 rounded-2xl border cursor-pointer transition ${
                      checked
                        ? "border-orange-500 bg-orange-50/70 shadow-2xs"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Icon className={`h-4 w-4 ${checked ? "text-orange-600" : "text-slate-400"}`} />
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            equipments: { ...p.equipments, [eq.key]: e.target.checked },
                          }))
                        }
                        className="rounded-md text-orange-600 focus:ring-orange-500"
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-800">{eq.label}</span>
                    {eq.desc && <span className="text-[10px] text-slate-400">{eq.desc}</span>}
                  </label>
                );
              })}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                อุปกรณ์อื่น ๆ เพิ่มเติม (ถ้ามี)
              </label>
              <input
                type="text"
                value={(form.equipments.other as string) || ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    equipments: { ...p.equipments, other: e.target.value },
                  }))
                }
                placeholder="เช่น ปลั๊กพ่วง, โพเดียมบรรยาย, โต๊ะลงทะเบียนด้านหน้าห้อง"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs"
              />
            </div>
          </div>

          {/* SECTION 4: COORDINATOR & AGREEMENT */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Users className="h-4 w-4 text-orange-600" />
                <span>4. ข้อมูลผู้ประสานงานและข้อตกลง (Coordinator & Agreement)</span>
              </h2>
              <button
                type="button"
                onClick={() =>
                  setForm((p) => ({
                    ...p,
                    coordinatorName: p.requesterName,
                    coordinatorEmail: p.requesterEmail,
                  }))
                }
                className="text-[11px] font-semibold text-indigo-600 hover:underline"
              >
                + ใช้ข้อมูลเดียวกับผู้ยืม
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  ชื่อผู้ประสานงาน (ฉายา / นามสกุล)
                </label>
                <input
                  type="text"
                  value={form.coordinatorName}
                  onChange={(e) => setForm((p) => ({ ...p, coordinatorName: e.target.value }))}
                  placeholder="เช่น พระครู... หรือ นาย..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  อีเมลผู้ประสานงาน (Coordinator Email) *
                </label>
                <input
                  type="email"
                  required
                  value={form.coordinatorEmail}
                  onChange={(e) => setForm((p) => ({ ...p, coordinatorEmail: e.target.value }))}
                  placeholder="เช่น user@mcu.ac.th หรือ coordinator@example.com"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs"
                />
              </div>
            </div>

            {/* Agreement checkbox */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={form.agreedToRules}
                  onChange={(e) => setForm((p) => ({ ...p, agreedToRules: e.target.checked }))}
                  className="mt-0.5 rounded-md text-orange-600 focus:ring-orange-500"
                />
                <div className="text-xs text-slate-800 space-y-1">
                  <div className="font-bold text-amber-950">
                    ข้าพเจ้ายินดีปฏิบัติตามกฎระเบียบของการใช้ห้องประชุมของคณะพุทธศาสตร์ทุกประการ
                  </div>
                  <div className="text-[11px] text-amber-900 leading-relaxed space-y-0.5">
                    <div>๑. ผู้ยืม (หน่วยงานที่ขอใช้ห้องประชุม) จะต้องดูแลการใช้ห้องประชุมให้เป็นที่เรียบร้อย</div>
                    <div>๒. ผู้ยืม (หน่วยงานที่ขอใช้ห้องประชุม) จะต้องติดต่อขอใช้ห้องก่อน อย่างน้อย ๒ วัน (เว้นอย่างน้อย ๑ วันทำการ ไม่รวมวันเสาร์-อาทิตย์)</div>
                    <div>๓. สำหรับการขอใช้ห้องประชุมแบบไป-กลับภายในวันเดียว แนะนำให้เสร็จสิ้นไม่เกิน ๑๖.๔๕ น. เพื่อให้เจ้าหน้าที่ตรวจสอบอุปกรณ์และปิดระบบตามเวลาราชการ</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 pt-6">
            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
            >
              <Eye className="h-4 w-4 text-indigo-600" />
              <span>ดูตัวอย่างแบบฟอร์ม A4 ก่อนส่ง</span>
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 px-7 py-2.5 text-xs font-bold text-white shadow-md hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 transition"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span>{isPending ? "กำลังบันทึกคำขอ..." : "ยืนยันและส่งใบขอใช้ห้องประชุม"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* MODAL: A4 DOCUMENT PREVIEW */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-slate-100 rounded-3xl shadow-2xl overflow-hidden my-8">
            {/* Modal Top Bar */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-bold">
                  ตัวอย่างแบบฟอร์มใบขอใช้ห้องประชุม (A4 Document Preview)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/30 transition"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>พิมพ์ (Print)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Document Container */}
            <div className="p-4 sm:p-8 overflow-x-auto flex justify-center bg-slate-200/80">
              <div className="scale-90 sm:scale-100 origin-top">
                <MeetingBookingA4Document
                  metadata={currentMetadata}
                  roomName={selectedRoom?.name}
                  roomCapacity={selectedRoom?.capacity}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SUBMISSION CONFIRMATION */}
      {submittedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">
                ส่งใบขอใช้ห้องประชุมสำเร็จ
              </h3>
              <p className="text-xs text-slate-500">
                ระบบได้บันทึกคำขอของท่านเข้าสู่ระบบเรียบร้อยแล้ว
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-left text-xs space-y-1.5">
              <div className="font-semibold text-slate-800">
                เรื่อง: <span className="text-slate-900">{submittedBooking.title}</span>
              </div>
              <div className="text-slate-600">
                ห้อง: <span className="font-medium text-slate-900">{submittedBooking.roomName}</span>
              </div>
              <div className="text-slate-600">
                เวลา: <span className="font-mono text-[11px] text-indigo-700">{submittedBooking.startTime} - {submittedBooking.endTime}</span>
              </div>
              <div className="pt-1 text-[11px] text-amber-700 font-medium">
                สถานะ: รอเจ้าหน้าที่ตรวจสอบความพร้อมและเสนอพิจารณาอนุมัติ
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSubmittedBooking(null);
                  setShowPreviewModal(true);
                }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>พิมพ์ใบขอใช้ห้องประชุม (A4)</span>
              </button>

              <button
                type="button"
                onClick={() => router.push("/portal/meetings")}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition"
              >
                <span>กลับสู่หน้ารายการห้องประชุม</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
