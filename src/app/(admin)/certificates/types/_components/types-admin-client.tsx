"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, FileText, CheckCircle2, XCircle, Edit3, X } from "lucide-react";
import type { CertificateType } from "@/generated/prisma";
import { createTypeAction, updateTypeAction } from "@/features/certificates/actions";

export function TypesAdminClient({ initialItems }: { initialItems: CertificateType[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CertificateType | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    isActive: true,
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      description: "",
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEdit = (item: CertificateType) => {
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description || "",
      isActive: item.isActive,
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      if (editing) {
        await updateTypeAction(editing.id, form);
      } else {
        await createTypeAction(form);
      }
      setModalOpen(false);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/certificates"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับหน้ารายการคำขอ
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              จัดการประเภทหนังสือรับรอง (Certificate Types)
            </h1>
            <p className="text-xs text-slate-500">
              กำหนดรายการวัตถุประสงค์และประเภทหนังสือรับรองที่แสดงให้นิสิตเลือกยื่นคำร้อง
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
        >
          <Plus className="h-4 w-4 text-amber-400" />
          เพิ่มประเภทหนังสือรับรอง
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase text-slate-600">
              <th className="px-5 py-3.5">ชื่อประเภท / วัตถุประสงค์หนังสือรับรอง</th>
              <th className="px-5 py-3.5">คำอธิบาย / รายละเอียด</th>
              <th className="px-5 py-3.5">สถานะ</th>
              <th className="px-5 py-3.5 text-right">แก้ไข</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {initialItems.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/70">
                <td className="px-5 py-4 font-bold text-slate-900">{item.name}</td>
                <td className="px-5 py-4 text-slate-600">{item.description || "-"}</td>
                <td className="px-5 py-4">
                  {item.isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      เปิดใช้งาน
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-500">
                      <XCircle className="h-3.5 w-3.5" />
                      ปิดใช้งาน
                    </span>
                  )}
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    แก้ไข
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <FileText className="h-4 w-4 text-indigo-600" />
                {editing ? "แก้ไขประเภทหนังสือรับรอง" : "เพิ่มประเภทหนังสือรับรองใหม่"}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  ชื่อประเภทหนังสือรับรอง
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  คำอธิบายรายละเอียด
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                  />
                  เปิดใช้งาน (Active)
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
