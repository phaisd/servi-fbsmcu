"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  Sparkles,
  Tv,
  Settings,
  Check,
  Camera,
  UploadCloud,
} from "lucide-react";
import type { MeetingRoom } from "@/generated/prisma";
import {
  createMeetingRoomAction,
  updateMeetingRoomAction,
  deleteMeetingRoomAction,
  updateMeetingFormSettingsAction,
  uploadMeetingRoomImageAction,
} from "@/features/meetings/actions";
import type {
  MeetingFormSettings,
  MeetingFormPurposeOption,
  MeetingFormEquipmentOption,
} from "@/features/meetings";

export function MeetingRoomsClient({
  initialItems,
  initialFormSettings,
}: {
  initialItems: MeetingRoom[];
  initialFormSettings?: MeetingFormSettings;
}) {
  const router = useRouter();
  const [items, setItems] = useState<MeetingRoom[]>(initialItems);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  // Edit/Create Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<MeetingRoom | null>(null);

  const [formName, setFormName] = useState("");
  const [formCapacity, setFormCapacity] = useState(70);
  const [formEquipment, setFormEquipment] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      notify("กรุณาเลือกไฟล์รูปภาพ (JPG, PNG, WEBP)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      notify("ขนาดไฟล์รูปภาพต้องไม่เกิน 10MB");
      return;
    }

    try {
      setIsUploadingImage(true);
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadMeetingRoomImageAction(formData);
      setFormImageUrl(res.url);
      notify("อัปโหลดรูปภาพห้องประชุมสำเร็จ");
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Form Settings Modal state (วัตถุประสงค์ & อุปกรณ์)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"PURPOSES" | "EQUIPMENTS">("PURPOSES");
  const [purposes, setPurposes] = useState<MeetingFormPurposeOption[]>(
    initialFormSettings?.purposes || [
      { id: "MEETING", label: "ประชุม (Meeting)" },
      { id: "TRAINING", label: "อบรม (Training)" },
      { id: "SEMINAR", label: "สัมมนา (Seminar)" },
      { id: "OTHER", label: "อื่นๆ (Other)" },
    ]
  );
  const [equipments, setEquipments] = useState<MeetingFormEquipmentOption[]>(
    initialFormSettings?.equipments || [
      { key: "computer", label: "คอมพิวเตอร์", desc: "เครื่องคอมพิวเตอร์ควบคุมห้อง" },
      { key: "ledDisplay", label: "จอ LED", desc: "จอแสดงผลหลัก / โปรเจกเตอร์" },
      { key: "soundSystem", label: "เครื่องขยายเสียง", desc: "ไมโครโฟนตั้งโต๊ะ / ไร้สาย" },
      { key: "zoomOnline", label: "Zoom Online", desc: "สัญญาณถ่ายทอดสด / Hybrid" },
    ]
  );
  const [newPurposeLabel, setNewPurposeLabel] = useState("");
  const [newEquipmentLabel, setNewEquipmentLabel] = useState("");
  const [newEquipmentDesc, setNewEquipmentDesc] = useState("");

  const handleAddPurpose = () => {
    if (!newPurposeLabel.trim()) return;
    const newId = `P_${Date.now()}`;
    setPurposes((prev) => [...prev, { id: newId, label: newPurposeLabel.trim() }]);
    setNewPurposeLabel("");
  };

  const handleRemovePurpose = (id: string) => {
    setPurposes((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAddEquipment = () => {
    if (!newEquipmentLabel.trim()) return;
    const newKey = `eq_${Date.now()}`;
    setEquipments((prev) => [
      ...prev,
      { key: newKey, label: newEquipmentLabel.trim(), desc: newEquipmentDesc.trim() },
    ]);
    setNewEquipmentLabel("");
    setNewEquipmentDesc("");
  };

  const handleRemoveEquipment = (key: string) => {
    setEquipments((prev) => prev.filter((eq) => eq.key !== key));
  };

  const handleSaveFormSettings = () => {
    startTransition(async () => {
      try {
        await updateMeetingFormSettingsAction({
          purposes,
          equipments,
        });
        notify("บันทึกการตั้งค่าตัวเลือกแบบฟอร์ม (วัตถุประสงค์ & อุปกรณ์) เรียบร้อยแล้ว");
        setIsSettingsModalOpen(false);
        router.refresh();
      } catch (err: unknown) {
        notify((err instanceof Error ? err.message : String(err)) || "เกิดข้อผิดพลาดในการบันทึกการตั้งค่า");
      }
    });
  };

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleOpenCreate = () => {
    setEditingRoom(null);
    setFormName("ห้องประชุมคณะพุทธศาสตร์ (โซนดี)");
    setFormCapacity(70);
    setFormEquipment("คอมพิวเตอร์, จอ LED, เครื่องขยายเสียง, Zoom Online");
    setFormImageUrl("");
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (room: MeetingRoom) => {
    setEditingRoom(room);
    setFormName(room.name);
    setFormCapacity(room.capacity);
    setFormEquipment(room.equipment || "");
    setFormImageUrl(room.imageUrl || "");
    setFormIsActive(room.isActive);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      notify("กรุณากรอกชื่อห้องประชุม");
      return;
    }

    startTransition(async () => {
      try {
        if (editingRoom) {
          const res = await updateMeetingRoomAction(editingRoom.id, {
            name: formName.trim(),
            capacity: Number(formCapacity) || 10,
            equipment: formEquipment.trim(),
            imageUrl: formImageUrl.trim() || null,
            isActive: formIsActive,
          });
          setItems((prev) => prev.map((item) => (item.id === res.id ? res : item)));
          notify("อัปเดตข้อมูลห้องประชุมเรียบร้อยแล้ว");
        } else {
          const res = await createMeetingRoomAction({
            name: formName.trim(),
            capacity: Number(formCapacity) || 10,
            equipment: formEquipment.trim(),
            imageUrl: formImageUrl.trim() || null,
            isActive: formIsActive,
          });
          setItems((prev) => [...prev, res]);
          notify("เพิ่มห้องประชุมใหม่เรียบร้อยแล้ว");
        }
        setIsModalOpen(false);
        router.refresh();
      } catch (err: unknown) {
        notify((err instanceof Error ? err.message : String(err)) || "เกิดข้อผิดพลาดในการบันทึก");
      }
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`ยืนยันการลบห้องประชุม "${name}" หรือไม่?`)) return;
    startTransition(async () => {
      try {
        await deleteMeetingRoomAction(id);
        setItems((prev) => prev.filter((item) => item.id !== id));
        notify("ลบห้องประชุมเรียบร้อยแล้ว");
        router.refresh();
      } catch (err: unknown) {
        notify((err instanceof Error ? err.message : String(err)) || "เกิดข้อผิดพลาดในการลบ");
      }
    });
  };

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
            <Building2 className="h-3.5 w-3.5" />
            <span>ระบบห้องประชุม</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            จัดการห้องประชุม (Meeting Rooms)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            กำหนดรายชื่อห้อง ความจุที่นั่ง โสตทัศนูปกรณ์ และสถานะความพร้อมใช้งาน
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
          >
            <Settings className="h-4 w-4 text-slate-500" />
            <span>ตั้งค่าตัวเลือกแบบฟอร์ม (วัตถุประสงค์ / อุปกรณ์)</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-orange-500 transition"
          >
            <Plus className="h-4 w-4" />
            <span>+ เพิ่มห้องประชุม</span>
          </button>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((room) => {
          const isFacultyZoneD = room.name.includes("พุทธศาสตร์") || room.capacity >= 70;
          return (
            <div
              key={room.id}
              className={`rounded-3xl border bg-white overflow-hidden shadow-sm flex flex-col justify-between transition hover:shadow-md ${
                isFacultyZoneD ? "border-orange-300 ring-2 ring-orange-500/10" : "border-slate-200"
              }`}
            >
              <div>
                <div className="aspect-video w-full bg-slate-100 relative overflow-hidden flex items-center justify-center">
                  {room.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={room.imageUrl} alt={room.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Tv className="h-10 w-10 opacity-50 mb-1 text-orange-600" />
                      <span className="text-xs font-semibold">{room.name}</span>
                    </div>
                  )}

                  {isFacultyZoneD && (
                    <span className="absolute top-3 left-3 rounded-full bg-orange-600 text-white text-[10px] font-bold px-2.5 py-0.5 shadow-xs">
                      ⭐ ห้องประชุมคณะ (โซนดี)
                    </span>
                  )}

                  <span
                    className={`absolute top-3 right-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      room.isActive
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {room.isActive ? "เปิดใช้งาน" : "ปิดชั่วคราว"}
                  </span>
                </div>

                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{room.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-700">
                        <Users className="h-3.5 w-3.5" />
                        <span>{room.capacity} รูป/คน</span>
                      </span>
                    </div>
                  </div>

                  {room.equipment && (
                    <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="font-semibold text-slate-700 block mb-0.5">อุปกรณ์ประจำห้อง:</span>
                      <span>{room.equipment}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5 pt-0 border-t border-slate-100 flex items-center justify-between gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(room)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 p-1"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>แก้ไขข้อมูล</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(room.id, room.name)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800 p-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>ลบ</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-orange-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {editingRoom ? "แก้ไขข้อมูลห้องประชุม" : "เพิ่มห้องประชุมใหม่"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  ชื่อห้องประชุม *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="เช่น ห้องประชุมคณะพุทธศาสตร์ (โซนดี)"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    ความจุที่นั่ง (รูป/คน) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    required
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(parseInt(e.target.value, 10) || 10)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    สถานะการใช้งาน
                  </label>
                  <select
                    value={formIsActive ? "ACTIVE" : "INACTIVE"}
                    onChange={(e) => setFormIsActive(e.target.value === "ACTIVE")}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold"
                  >
                    <option value="ACTIVE">เปิดใช้งาน (Active)</option>
                    <option value="INACTIVE">ปิดชั่วคราว (Inactive)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  อุปกรณ์โสตทัศนูปกรณ์ประจำห้อง
                </label>
                <input
                  type="text"
                  value={formEquipment}
                  onChange={(e) => setFormEquipment(e.target.value)}
                  placeholder="เช่น คอมพิวเตอร์, จอ LED, เครื่องขยายเสียง, Zoom Online"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    รูปภาพห้องประชุม (Room Image)
                  </label>
                  {formImageUrl && (
                    <button
                      type="button"
                      onClick={() => setFormImageUrl("")}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      ลบรูปภาพ
                    </button>
                  )}
                </div>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleImageUpload}
                />

                {/* Preview Box & Upload Area */}
                <div className="rounded-2xl border border-dashed border-slate-300 p-3 bg-slate-50/50 flex flex-col items-center justify-center gap-2">
                  {formImageUrl ? (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={formImageUrl}
                        alt="Room preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingImage}
                          className="px-3 py-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-800 text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>เปลี่ยนรูปภาพ</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-6 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-100/60 rounded-xl transition border border-transparent"
                    >
                      <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                        {isUploadingImage ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <UploadCloud className="w-5 h-5" />
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-700">
                        {isUploadingImage ? "กำลังอัปโหลดรูปภาพ..." : "คลิกเพื่ออัปโหลดรูปภาพห้องประชุม"}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        รองรับไฟล์ JPG, PNG, WEBP (ไม่เกิน 10MB)
                      </span>
                    </div>
                  )}

                  <div className="w-full flex items-center gap-2 pt-1 border-t border-slate-200/60">
                    <button
                      type="button"
                      disabled={isUploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold border border-orange-200 transition shrink-0 cursor-pointer"
                    >
                      {isUploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                      <span>{formImageUrl ? "เปลี่ยนรูป" : "อัปโหลดรูปภาพ"}</span>
                    </button>
                    <input
                      type="text"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      placeholder="หรือระบุ URL รูปภาพ (https://... หรือ /uploads/...)"
                      className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-600 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-5 py-2 text-xs font-bold text-white hover:bg-orange-500 disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  <span>{editingRoom ? "บันทึกการแก้ไข" : "เพิ่มห้องประชุม"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FORM SETTINGS MODAL (วัตถุประสงค์ & อุปกรณ์) */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b p-5 bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
                  <Settings className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    ตั้งค่าตัวเลือกแบบฟอร์มขอใช้ห้องประชุม (Form Options)
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    กำหนดวัตถุประสงค์และอุปกรณ์ เพื่อแสดงในหน้าขอใช้ห้องประชุมของ Portal
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b px-5 bg-white">
              <button
                type="button"
                onClick={() => setSettingsTab("PURPOSES")}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
                  settingsTab === "PURPOSES"
                    ? "border-orange-600 text-orange-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                1. วัตถุประสงค์การใช้งาน ({purposes.length})
              </button>
              <button
                type="button"
                onClick={() => setSettingsTab("EQUIPMENTS")}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
                  settingsTab === "EQUIPMENTS"
                    ? "border-orange-600 text-orange-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                2. รายการอุปกรณ์ที่ให้เลือก ({equipments.length})
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {settingsTab === "PURPOSES" ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-800">
                      รายการวัตถุประสงค์ปัจจุบัน (คลิกเพื่อแก้ไข หรือกดถังขยะเพื่อลบ)
                    </label>
                    <div className="space-y-2">
                      {purposes.map((p, idx) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/60"
                        >
                          <span className="text-xs font-bold text-slate-400 w-6 text-center shrink-0">
                            {idx + 1}.
                          </span>
                          <input
                            type="text"
                            value={p.label}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPurposes((prev) =>
                                prev.map((item) => (item.id === p.id ? { ...item, label: val } : item))
                              );
                            }}
                            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePurpose(p.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add Purpose */}
                  <div className="pt-2 border-t">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      + เพิ่มวัตถุประสงค์ใหม่
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newPurposeLabel}
                        onChange={(e) => setNewPurposeLabel(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddPurpose();
                          }
                        }}
                        placeholder="เช่น สอบป้องกันดุษฎีนิพนธ์, บรรยายพิเศษ, พิธีปฐมนิเทศ"
                        className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddPurpose}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-orange-500 transition"
                      >
                        <Plus className="h-4 w-4" />
                        <span>เพิ่ม</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-800">
                      รายการอุปกรณ์มาตรฐานปัจจุบัน
                    </label>
                    <div className="space-y-2">
                      {equipments.map((eq, idx) => (
                        <div
                          key={eq.key}
                          className="flex items-start gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/60"
                        >
                          <span className="text-xs font-bold text-slate-400 w-6 text-center shrink-0 mt-2">
                            {idx + 1}.
                          </span>
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={eq.label}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEquipments((prev) =>
                                  prev.map((item) => (item.key === eq.key ? { ...item, label: val } : item))
                                );
                              }}
                              placeholder="ชื่ออุปกรณ์ เช่น ไมค์ลอย 2 ตัว"
                              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800"
                            />
                            <input
                              type="text"
                              value={eq.desc || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEquipments((prev) =>
                                  prev.map((item) => (item.key === eq.key ? { ...item, desc: val } : item))
                                );
                              }}
                              placeholder="คำอธิบาย เช่น ชุดไมโครโฟนไร้สาย"
                              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveEquipment(eq.key)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition mt-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add Equipment */}
                  <div className="pt-2 border-t space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      + เพิ่มอุปกรณ์ใหม่
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={newEquipmentLabel}
                        onChange={(e) => setNewEquipmentLabel(e.target.value)}
                        placeholder="ชื่ออุปกรณ์ เช่น โพเดียมบรรยาย, ไมค์ลอย 2 ตัว"
                        className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newEquipmentDesc}
                          onChange={(e) => setNewEquipmentDesc(e.target.value)}
                          placeholder="คำอธิบาย เช่น โพเดียมพร้อมไมค์คอห่าน"
                          className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs"
                        />
                        <button
                          type="button"
                          onClick={handleAddEquipment}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-orange-500 transition shrink-0"
                        >
                          <Plus className="h-4 w-4" />
                          <span>เพิ่ม</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t bg-slate-50">
              <span className="text-[11px] text-slate-500">
                เมื่อบันทึกแล้ว รายการตัวเลือกในหน้าขอใช้ห้องประชุมจะเปลี่ยนตามทันที
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                >
                  ปิด
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleSaveFormSettings}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-orange-500 disabled:opacity-50 transition"
                >
                  {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  <span>บันทึกการตั้งค่าตัวเลือก</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
