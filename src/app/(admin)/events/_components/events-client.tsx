"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  ArrowRight,
  Sparkles,
  Award,
  RefreshCw,
  Search,
  Edit2,
  Trash2,
  Tv,
  Filter,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  createEventAction,
  updateEventAction,
  deleteEventAction,
  seedOpeningCeremonyAction,
} from "@/features/events/actions";
import { useRouter } from "next/navigation";

export interface EventItem {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startDate: Date | string;
  endDate: Date | string;
  capacity: number;
  academicYear?: string | null;
  activityHours?: number;
  eventType?: string;
  targetGroup?: string;
  isActive: boolean;
  stats?: {
    total: number;
    attended: number;
    pending: number;
    studentCount: number;
    teacherCount: number;
    percentage: number;
  };
  _count?: { registrations: number };
}

interface Props {
  initialItems: EventItem[];
}

export function getEventScope(targetGroup?: string | null): "FACULTY" | "UNIVERSITY" | "ALL" {
  if (!targetGroup) return "ALL";
  const tg = targetGroup.toUpperCase();
  if (tg === "FACULTY" || tg.includes("FACULTY") || tg.includes("คณะ") || tg.includes("สาขาวิชา") || tg.includes("ภาควิชา")) {
    return "FACULTY";
  }
  if (tg === "UNIVERSITY" || tg.includes("UNIVERSITY") || tg.includes("มหาวิทยาลัย") || tg.includes("มจร") || tg.includes("ส่วนกลาง")) {
    return "UNIVERSITY";
  }
  return "ALL";
}

export function getCategoryLabel(type?: string) {
  switch (type) {
    case "CEREMONY":
      return "พิธีการ / ปฐมนิเทศ";
    case "ACADEMIC":
      return "วิชาการ / สัมมนา";
    case "BUDDHIST":
      return "กิจกรรมพระพุทธศาสนา / ปฏิบัติธรรม";
    case "VOLUNTEER":
      return "จิตอาสา / บำเพ็ญประโยชน์";
    case "CULTURE":
      return "ทำนุบำรุงศิลปวัฒนธรรม";
    case "ACADEMIC_SERVICE":
      return "บริการวิชาการแก่ท้องถิ่น";
    case "SPORTS_HEALTH":
      return "กีฬาและส่งเสริมสุขภาพ";
    default:
      return "กิจกรรมทั่วไป";
  }
}

export function EventsClient({ initialItems }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<EventItem[]>(initialItems);
  const [search, setSearch] = useState("");
  const [selectedScope, setSelectedScope] = useState<"ALL" | "FACULTY" | "UNIVERSITY">("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Edit State
  const [editTarget, setEditTarget] = useState<EventItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<EventItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State สำหรับสร้างกิจกรรมใหม่
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    startDate: new Date().toISOString().split("T")[0] + "T09:00",
    endDate: new Date().toISOString().split("T")[0] + "T16:00",
    capacity: 0,
    academicYear: "2569",
    activityHours: 3,
    eventType: "CEREMONY",
    targetGroup: "FACULTY",
  });

  // Form State สำหรับแก้ไขกิจกรรม
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    location: "",
    startDate: "",
    endDate: "",
    capacity: 0,
    academicYear: "2569",
    activityHours: 3,
    eventType: "CEREMONY",
    targetGroup: "FACULTY",
  });

  const openEditModal = (item: EventItem) => {
    setEditTarget(item);
    const startStr = item.startDate ? new Date(item.startDate).toISOString().slice(0, 16) : "";
    const endStr = item.endDate ? new Date(item.endDate).toISOString().slice(0, 16) : "";
    const scope = getEventScope(item.targetGroup);
    setEditForm({
      title: item.title,
      description: item.description || "",
      location: item.location || "",
      startDate: startStr,
      endDate: endStr,
      capacity: item.capacity || 0,
      academicYear: item.academicYear || "2569",
      activityHours: item.activityHours || 3,
      eventType: item.eventType || "CEREMONY",
      targetGroup: scope,
    });
    setIsEditModalOpen(true);
  };

  const facultyCount = items.filter((item) => {
    const s = getEventScope(item.targetGroup);
    return s === "FACULTY" || s === "ALL";
  }).length;

  const universityCount = items.filter((item) => {
    const s = getEventScope(item.targetGroup);
    return s === "UNIVERSITY" || s === "ALL";
  }).length;

  const filtered = items.filter((item) => {
    // 1. Filter by Scope
    if (selectedScope !== "ALL") {
      const s = getEventScope(item.targetGroup);
      if (s !== selectedScope && s !== "ALL") return false;
    }

    // 2. Filter by Category
    if (selectedType !== "ALL") {
      if (item.eventType !== selectedType) return false;
    }

    // 3. Search query
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      (item.description || "").toLowerCase().includes(q) ||
      (item.location || "").toLowerCase().includes(q)
    );
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("กรุณาระบุชื่อกิจกรรม");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await createEventAction(form);
      if (res.success && res.event) {
        toast.success("สร้างกิจกรรมใหม่เรียบร้อยแล้ว");
        setIsNewModalOpen(false);
        setItems([res.event as unknown as (typeof items)[number], ...items]);
        router.refresh();
      }
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || "เกิดข้อผิดพลาดในการสร้างกิจกรรม");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget || !editForm.title.trim()) {
      toast.error("กรุณาระบุชื่อกิจกรรม");
      return;
    }
    setIsUpdating(true);
    try {
      const res = await updateEventAction(editTarget.id, editForm);
      if (res.success && res.event) {
        toast.success("บันทึกการแก้ไขกิจกรรมเรียบร้อยแล้ว");
        setIsEditModalOpen(false);
        setItems(items.map((it) => (it.id === editTarget.id ? { ...it, ...res.event } : it)));
        router.refresh();
      }
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || "เกิดข้อผิดพลาดในการแก้ไขกิจกรรม");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await deleteEventAction(deleteTarget.id);
      if (res.success) {
        toast.success(`ลบกิจกรรม "${deleteTarget.title}" เรียบร้อยแล้ว`);
        setItems(items.filter((it) => it.id !== deleteTarget.id));
        setDeleteTarget(null);
        router.refresh();
      }
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || "ไม่สามารถลบกิจกรรมได้");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSeedOpeningCeremony = async () => {
    setIsSyncing(true);
    try {
      const res = await seedOpeningCeremonyAction();
      if (res.success) {
        toast.success(
          `สร้างกิจกรรมพิธีเปิดและนำเข้ารายชื่อเรียบร้อย! (นิสิต ${res.studentRegisteredCount} คน, อาจารย์ ${res.teacherRegisteredCount} ท่าน)`
        );
        router.refresh();
      }
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || "ไม่สามารถสร้างกิจกรรมได้");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6 px-4 sm:px-6">
      {/* ══════════ Top Header Banner ══════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-2">
            <Award className="h-3.5 w-3.5" />
            Activity & Event Management
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            ระบบจัดการกิจกรรมและการเข้าร่วม (Activities & Events)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            บริหารจัดการกิจกรรมของคณะและกิจกรรมของมหาวิทยาลัย บันทึกการเข้าร่วม พิมพ์ใบลงทะเบียน และแสดงจอโปรเจกเตอร์
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleSeedOpeningCeremony}
            disabled={isSyncing}
            variant="outline"
            className="gap-1.5 text-xs font-semibold border-amber-300 text-amber-800 bg-amber-50/50 hover:bg-amber-100/80 shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-600 ${isSyncing ? "animate-spin" : ""}`} />
            <span>ซิงค์พิธีเปิดภาคการศึกษา 2026</span>
          </Button>

          <Button
            onClick={() => setIsNewModalOpen(true)}
            className="gap-1.5 bg-primary text-white hover:bg-primary/90 font-semibold shadow-xs text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>สร้างกิจกรรมใหม่</span>
          </Button>
        </div>
      </div>

      {/* ══════════ Scope Tabs & Filters Bar ══════════ */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Scope Filter Tabs */}
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setSelectedScope("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedScope === "ALL"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              กิจกรรมทั้งหมด ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedScope("FACULTY")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                selectedScope === "FACULTY"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-slate-500 hover:text-indigo-700"
              }`}
            >
              <span>🏛️ กิจกรรมของคณะ</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedScope === "FACULTY" ? "bg-white/20" : "bg-slate-200 text-slate-700"}`}>
                {facultyCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedScope("UNIVERSITY")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                selectedScope === "UNIVERSITY"
                  ? "bg-sky-600 text-white shadow-2xs"
                  : "text-slate-500 hover:text-sky-700"
              }`}
            >
              <span>🌐 กิจกรรมของมหาวิทยาลัย</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedScope === "UNIVERSITY" ? "bg-white/20" : "bg-slate-200 text-slate-700"}`}>
                {universityCount}
              </span>
            </button>
          </div>

          {/* Category Filter & Search */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>ประเภท:</span>
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">ทุกประเภทกิจกรรม</option>
              <option value="CEREMONY">พิธีการ / ปฐมนิเทศ</option>
              <option value="ACADEMIC">วิชาการ / สัมมนา</option>
              <option value="BUDDHIST">กิจกรรมทางพระพุทธศาสนา / ปฏิบัติธรรม</option>
              <option value="VOLUNTEER">จิตอาสา / บำเพ็ญประโยชน์</option>
              <option value="CULTURE">ทำนุบำรุงศิลปวัฒนธรรมและประเพณี</option>
              <option value="ACADEMIC_SERVICE">บริการวิชาการแก่สังคมและท้องถิ่น</option>
              <option value="SPORTS_HEALTH">กีฬาและการส่งเสริมสุขภาพ</option>
              <option value="OTHER">กิจกรรมทั่วไป</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหากิจกรรม, สถานที่, หรือรายละเอียด..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs sm:text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* ══════════ Events Cards Grid ══════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => {
          const stats = item.stats || {
            total: item._count?.registrations || 0,
            attended: 0,
            pending: item._count?.registrations || 0,
            percentage: 0,
            studentCount: 0,
            teacherCount: 0,
          };

          const scope = getEventScope(item.targetGroup);

          return (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between group"
            >
              <div className="space-y-3">
                {/* Badges: Scope & Type */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {scope === "FACULTY" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        🏛️ กิจกรรมของคณะ (คณะพุทธศาสตร์)
                      </span>
                    ) : scope === "UNIVERSITY" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                        🌐 กิจกรรมของมหาวิทยาลัย (มจร. ส่วนกลาง)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        🏢 ทุกระดับ / กิจกรรมร่วม
                      </span>
                    )}

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                      <Sparkles className="w-3 h-3" />
                      {getCategoryLabel(item.eventType)}
                    </span>
                  </div>

                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    {item.activityHours || 3} ชม. กิจกรรม
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-primary transition">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Date & Location */}
                <div className="space-y-1 text-xs text-slate-500 pt-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>
                      {new Date(item.startDate).toLocaleDateString("th-TH", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>
                      {new Date(item.startDate).toLocaleTimeString("th-TH", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {new Date(item.endDate).toLocaleTimeString("th-TH", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      น.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">
                      {item.location || "มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย"}
                    </span>
                  </div>
                </div>

                {/* Attendance Progress bar */}
                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <div className="flex items-center justify-between text-2xs">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-400" />
                      เช็คชื่อแล้ว {stats.attended} / {stats.total} คน
                    </span>
                    <span className="font-bold text-slate-700">
                      {stats.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${stats.percentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action buttons footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditModal(item)}
                    className="h-8 px-2 text-xs text-slate-600 hover:text-primary hover:bg-slate-100 gap-1 rounded-lg"
                    title="แก้ไขข้อมูลกิจกรรมและประเภท"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>แก้ไข</span>
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteTarget(item)}
                    className="h-8 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1 rounded-lg"
                    title="ลบกิจกรรม"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ลบ</span>
                  </Button>

                  <Link
                    href={`/events/${item.id}/projector`}
                    target="_blank"
                    className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs font-medium text-slate-600 hover:text-primary hover:bg-slate-100 transition"
                    title="เปิดจอโปรเจกเตอร์สำหรับสแกน"
                  >
                    <Tv className="w-3.5 h-3.5 text-primary" />
                    <span>จอฉาย</span>
                  </Link>

                  <Link
                    href={`/portal/events/${item.id}/evaluate`}
                    target="_blank"
                    className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100/90 border border-indigo-200 transition"
                    title="เปิดหน้าแบบประเมินกิจกรรมและออกเกียรติบัตรสำหรับนิสิต"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>แบบประเมิน</span>
                  </Link>
                </div>

                <Link
                  href={`/events/${item.id}/registrations`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-2xs transition"
                >
                  <span>จัดการรายชื่อ & เช็คชื่อ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white border border-dashed border-slate-200 rounded-2xl space-y-3">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-sm font-semibold text-slate-700">
              ไม่พบรายการกิจกรรมในหมวดที่เลือก
            </div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              คุณสามารถกดปุ่มสร้างกิจกรรมใหม่ หรือกด &quot;ซิงค์พิธีเปิดภาคการศึกษา 2026&quot; เพื่อดึงข้อมูลเข้าสู่ระบบ
            </p>
            <Button
              onClick={handleSeedOpeningCeremony}
              disabled={isSyncing}
              className="gap-1.5 text-xs bg-primary text-white"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              <span>ซิงค์พิธีเปิดภาคการศึกษา 2026 ตอนนี้</span>
            </Button>
          </div>
        )}
      </div>

      {/* ══════════ Create Event Modal ══════════ */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                สร้างกิจกรรมใหม่ (Create Activity / Event)
              </h3>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ชื่อกิจกรรม (Title) *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="เช่น โครงการปฏิบัติธรรมและบรรยายพิเศษ คณะพุทธศาสตร์"
                  className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-primary focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  รายละเอียดกิจกรรม (Description)
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="วัตถุประสงค์และรายละเอียดของกิจกรรม..."
                  className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-primary focus:outline-hidden"
                />
              </div>

              {/* Scope & Type Dropdowns */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ระดับ / สังกัดกิจกรรม *
                  </label>
                  <select
                    value={form.targetGroup}
                    onChange={(e) => setForm({ ...form, targetGroup: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white font-medium"
                  >
                    <option value="FACULTY">🏛️ กิจกรรมของคณะ (คณะพุทธศาสตร์)</option>
                    <option value="UNIVERSITY">🌐 กิจกรรมของมหาวิทยาลัย (มจร. ส่วนกลาง)</option>
                    <option value="ALL">🏢 ทุกระดับ / กิจกรรมร่วม</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ประเภทกิจกรรม *
                  </label>
                  <select
                    value={form.eventType}
                    onChange={(e) => setForm({ ...form, eventType: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white font-medium"
                  >
                    <option value="CEREMONY">พิธีการ / ปฐมนิเทศ</option>
                    <option value="ACADEMIC">วิชาการ / สัมมนา</option>
                    <option value="BUDDHIST">กิจกรรมทางพระพุทธศาสนา / ปฏิบัติธรรม</option>
                    <option value="VOLUNTEER">จิตอาสา / บำเพ็ญประโยชน์</option>
                    <option value="CULTURE">ทำนุบำรุงศิลปวัฒนธรรมและประเพณี</option>
                    <option value="ACADEMIC_SERVICE">บริการวิชาการแก่สังคมและท้องถิ่น</option>
                    <option value="SPORTS_HEALTH">กีฬาและการส่งเสริมสุขภาพ</option>
                    <option value="OTHER">กิจกรรมทั่วไป</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ชั่วโมงกิจกรรม (Activity Hours)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.activityHours}
                    onChange={(e) =>
                      setForm({ ...form, activityHours: Number(e.target.value) })
                    }
                    className="w-full border border-slate-200 rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ปีการศึกษา
                  </label>
                  <input
                    type="text"
                    value={form.academicYear}
                    onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  สถานที่จัดงาน (Location)
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="เช่น หอประชุม มวก. 48 พรรษา หรือ ห้องประชุมคณะพุทธศาสตร์"
                  className="w-full border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    วัน-เวลาเริ่ม
                  </label>
                  <input
                    type="datetime-local"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    วัน-เวลาสิ้นสุด
                  </label>
                  <input
                    type="datetime-local"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewModalOpen(false)}
                  size="sm"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="sm"
                  className="bg-primary text-white"
                >
                  {isSubmitting ? "กำลังบันทึก..." : "บันทึกกิจกรรม"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════ Edit Event Modal ══════════ */}
      {isEditModalOpen && editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                แก้ไขกิจกรรม (Edit Activity / Event)
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ชื่อกิจกรรม (Title) *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-primary focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  รายละเอียดกิจกรรม (Description)
                </label>
                <textarea
                  rows={2}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-primary focus:outline-hidden"
                />
              </div>

              {/* Scope & Type Dropdowns */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ระดับ / สังกัดกิจกรรม *
                  </label>
                  <select
                    value={editForm.targetGroup}
                    onChange={(e) => setEditForm({ ...editForm, targetGroup: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white font-medium"
                  >
                    <option value="FACULTY">🏛️ กิจกรรมของคณะ (คณะพุทธศาสตร์)</option>
                    <option value="UNIVERSITY">🌐 กิจกรรมของมหาวิทยาลัย (มจร. ส่วนกลาง)</option>
                    <option value="ALL">🏢 ทุกระดับ / กิจกรรมร่วม</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ประเภทกิจกรรม *
                  </label>
                  <select
                    value={editForm.eventType}
                    onChange={(e) => setEditForm({ ...editForm, eventType: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white font-medium"
                  >
                    <option value="CEREMONY">พิธีการ / ปฐมนิเทศ</option>
                    <option value="ACADEMIC">วิชาการ / สัมมนา</option>
                    <option value="BUDDHIST">กิจกรรมทางพระพุทธศาสนา / ปฏิบัติธรรม</option>
                    <option value="VOLUNTEER">จิตอาสา / บำเพ็ญประโยชน์</option>
                    <option value="CULTURE">ทำนุบำรุงศิลปวัฒนธรรมและประเพณี</option>
                    <option value="ACADEMIC_SERVICE">บริการวิชาการแก่สังคมและท้องถิ่น</option>
                    <option value="SPORTS_HEALTH">กีฬาและการส่งเสริมสุขภาพ</option>
                    <option value="OTHER">กิจกรรมทั่วไป</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ชั่วโมงกิจกรรม
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.activityHours}
                    onChange={(e) =>
                      setEditForm({ ...editForm, activityHours: Number(e.target.value) })
                    }
                    className="w-full border border-slate-200 rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ปีการศึกษา
                  </label>
                  <input
                    type="text"
                    value={editForm.academicYear}
                    onChange={(e) => setEditForm({ ...editForm, academicYear: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  สถานที่จัดงาน (Location)
                </label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    วัน-เวลาเริ่ม
                  </label>
                  <input
                    type="datetime-local"
                    value={editForm.startDate}
                    onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    วัน-เวลาสิ้นสุด
                  </label>
                  <input
                    type="datetime-local"
                    value={editForm.endDate}
                    onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  size="sm"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdating}
                  size="sm"
                  className="bg-primary text-white"
                >
                  {isUpdating ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════ Delete Confirmation Modal ══════════ */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                ยืนยันการลบกิจกรรม?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                คุณกำลังจะลบกิจกรรม &quot;{deleteTarget.title}&quot; ข้อมูลการลงทะเบียนและการเช็คชื่อทั้งหมดในกิจกรรมนี้จะถูกลบไปด้วย
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                ยกเลิก
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "กำลังลบ..." : "ยืนยันลบกิจกรรม"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
