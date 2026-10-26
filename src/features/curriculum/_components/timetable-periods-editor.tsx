"use client";

import * as React from "react";
import {
  Clock,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Save,
  Coffee,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiyonCard } from "@/shared/components/liyon";
import { toast } from "sonner";
import {
  updateTimetablePeriodsAction,
  resetTimetablePeriodsAction,
} from "@/features/curriculum/actions";
import {
  DEFAULT_TIMETABLE_PERIODS,
  type TimetablePeriodConfig,
} from "../_internal/validations";

interface TimetablePeriodsEditorProps {
  initialPeriods: TimetablePeriodConfig[];
  onSaved?: (updated: TimetablePeriodConfig[]) => void;
  onCancel?: () => void;
}

export function TimetablePeriodsEditor({
  initialPeriods,
  onSaved,
  onCancel,
}: TimetablePeriodsEditorProps) {
  const [periods, setPeriods] = React.useState<TimetablePeriodConfig[]>(() => {
    const list =
      Array.isArray(initialPeriods) && initialPeriods.length > 0
        ? initialPeriods
        : DEFAULT_TIMETABLE_PERIODS;
    return [...list].sort((a, b) => a.orderIndex - b.orderIndex);
  });
  const [saving, setSaving] = React.useState(false);

  const handleFieldChange = (
    idx: number,
    field: keyof TimetablePeriodConfig,
    value: string | number | null
  ) => {
    setPeriods((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const handleAddClassPeriod = () => {
    const classCount = periods.filter((p) => p.type === "CLASS").length;
    const nextNum = classCount + 1;
    const newPeriod: TimetablePeriodConfig = {
      id: `period-${Date.now()}`,
      periodNumber: nextNum,
      labelTh: `คาบที่ ${nextNum}`,
      labelEn: `Period ${nextNum}`,
      subLabelTh: "ช่วงเย็น (Evening)",
      subLabelEn: "Evening",
      startTime: "17.00",
      endTime: "19.00",
      type: "CLASS",
      orderIndex: periods.length + 1,
    };
    setPeriods((prev) => [...prev, newPeriod]);
  };

  const handleAddBreakPeriod = () => {
    const newBreak: TimetablePeriodConfig = {
      id: `break-${Date.now()}`,
      periodNumber: 0,
      labelTh: "พักเบรก",
      labelEn: "Break",
      subLabelTh: "พักระหว่างคาบ",
      subLabelEn: "Short Break",
      startTime: "15.00",
      endTime: "15.15",
      type: "BREAK",
      orderIndex: periods.length + 1,
    };
    setPeriods((prev) => [...prev, newBreak]);
  };

  const handleMove = (idx: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= periods.length) return;
    setPeriods((prev) => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy.map((p, i) => ({ ...p, orderIndex: i + 1 }));
    });
  };

  const handleRemove = (idx: number) => {
    if (periods.length <= 1) {
      toast.error("ต้องมีคาบเรียนอย่างน้อย 1 รายการ");
      return;
    }
    setPeriods((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((p, i) => ({ ...p, orderIndex: i + 1 }))
    );
  };

  const handleResetDefault = async () => {
    setSaving(true);
    try {
      const res = await resetTimetablePeriodsAction();
      setPeriods(res.periods);
      onSaved?.(res.periods);
      toast.success("คืนค่าคาบเรียนและเวลาเริ่มต้นเรียบร้อยแล้ว");
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || "เกิดข้อผิดพลาดในการคืนค่าเริ่มต้น");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const p of periods) {
      if (!p.labelTh.trim() || !p.startTime.trim() || !p.endTime.trim()) {
        toast.error("กรุณากรอกชื่อคาบ เวลาเริ่ม และเวลาสิ้นสุดให้ครบถ้วน");
        return;
      }
    }

    setSaving(true);
    try {
      const normalized = periods.map((p, idx) => ({
        ...p,
        labelTh: p.labelTh.trim(),
        labelEn: p.labelEn.trim() || p.labelTh.trim(),
        subLabelTh: p.subLabelTh?.trim() || null,
        subLabelEn: p.subLabelEn?.trim() || null,
        startTime: p.startTime.trim().replace(":", "."),
        endTime: p.endTime.trim().replace(":", "."),
        orderIndex: idx + 1,
      }));
      const res = await updateTimetablePeriodsAction(normalized);
      setPeriods(res.periods);
      onSaved?.(res.periods);
      toast.success("บันทึกการตั้งค่าคาบเรียนและเวลาเรียบร้อยแล้ว");
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || "ไม่สามารถบันทึกการตั้งค่าคาบเรียนได้");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* ── LIVE HEADER PREVIEW ── */}
      <LiyonCard className="p-4 space-y-3 bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-primary" />
            <span>ตัวอย่างหัวตารางเรียน (Live Header Preview)</span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            แสดงผลตามลำดับคอลัมน์ในหน้าตารางเรียนนิสิตและเอกสารพิมพ์
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-2xs">
          <table className="w-full border-collapse text-xs min-w-[700px]">
            <thead>
              <tr className="divide-x divide-border border-b border-border">
                <th className="p-2.5 w-28 text-center bg-muted/80 align-middle">
                  <div className="font-bold text-xs">วัน / คาบ</div>
                  <div className="text-[10px] text-muted-foreground font-normal">
                    เวลาเรียน
                  </div>
                </th>
                {periods.map((p, idx) => {
                  if (p.type === "BREAK") {
                    return (
                      <th
                        key={p.id || idx}
                        className="p-2 text-center w-28 bg-amber-500/10 text-amber-900 dark:text-amber-200 align-middle"
                      >
                        <div className="font-bold text-xs">{p.labelTh}</div>
                        {p.subLabelTh && (
                          <div className="text-[10px] opacity-80 font-medium">
                            {p.subLabelTh}
                          </div>
                        )}
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                          {p.startTime} - {p.endTime} น.
                        </div>
                      </th>
                    );
                  }
                  return (
                    <th
                      key={p.id || idx}
                      className="p-2.5 text-center bg-sky-500/10 text-sky-950 dark:text-sky-200 align-middle"
                    >
                      {p.subLabelTh && (
                        <div className="text-[10px] opacity-80 font-semibold mb-0.5">
                          {p.subLabelTh}
                        </div>
                      )}
                      <div className="font-bold text-xs">{p.labelTh}</div>
                      <div className="text-[11px] text-muted-foreground font-mono font-medium mt-0.5">
                        {p.startTime} - {p.endTime} น.
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
          </table>
        </div>
      </LiyonCard>

      {/* ── ACTION BUTTONS TO ADD PERIOD / BREAK ── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddClassPeriod}
            className="gap-1.5 text-xs font-semibold text-primary border-primary/30 hover:bg-primary/10 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <BookOpen className="w-3.5 h-3.5" />
            <span>เพิ่มคาบเรียน (Class Period)</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddBreakPeriod}
            className="gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/10 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <Coffee className="w-3.5 h-3.5" />
            <span>เพิ่มช่วงพัก (Break)</span>
          </Button>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleResetDefault}
          disabled={saving}
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>คืนค่าเริ่มต้น (4 คอลัมน์มาตรฐาน)</span>
        </Button>
      </div>

      {/* ── PERIODS LIST EDITOR ── */}
      <div className="space-y-3">
        {periods.map((period, idx) => {
          const isBreak = period.type === "BREAK";
          return (
            <div
              key={period.id || idx}
              className={`p-4 rounded-2xl border transition-all space-y-3 ${
                isBreak
                  ? "border-amber-500/30 bg-amber-500/5"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-muted text-foreground text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                      isBreak
                        ? "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {isBreak ? (
                      <>
                        <Coffee className="w-3 h-3" />
                        <span>ช่วงพัก (BREAK)</span>
                      </>
                    ) : (
                      <>
                        <BookOpen className="w-3 h-3" />
                        <span>คาบเรียน (CLASS)</span>
                      </>
                    )}
                  </span>
                  <span className="font-bold text-xs text-foreground">
                    {period.labelTh} ({period.startTime} - {period.endTime} น.)
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMove(idx, "up")}
                    disabled={idx === 0}
                    title="เลื่อนขึ้น"
                    className="h-7 w-7 p-0 cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMove(idx, "down")}
                    disabled={idx === periods.length - 1}
                    title="เลื่อนลง"
                    className="h-7 w-7 p-0 cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(idx)}
                    disabled={periods.length <= 1}
                    title="ลบรายการนี้"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 text-xs">
                {/* Type */}
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                    ประเภทคอลัมน์
                  </label>
                  <select
                    value={period.type}
                    onChange={(e) =>
                      handleFieldChange(
                        idx,
                        "type",
                        e.target.value as "CLASS" | "BREAK"
                      )
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-border bg-background"
                  >
                    <option value="CLASS">📚 คาบเรียน (CLASS)</option>
                    <option value="BREAK">☕ ช่วงพัก (BREAK)</option>
                  </select>
                </div>

                {/* Label TH */}
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                    ชื่อคาบ (ภาษาไทย) *
                  </label>
                  <input
                    type="text"
                    value={period.labelTh}
                    onChange={(e) =>
                      handleFieldChange(idx, "labelTh", e.target.value)
                    }
                    placeholder="เช่น คาบที่ 1, พักกลางวัน"
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-border bg-background"
                    required
                  />
                </div>

                {/* Label EN */}
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                    ชื่อคาบ (English) *
                  </label>
                  <input
                    type="text"
                    value={period.labelEn}
                    onChange={(e) =>
                      handleFieldChange(idx, "labelEn", e.target.value)
                    }
                    placeholder="e.g. Period 1, Lunch Break"
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-border bg-background"
                    required
                  />
                </div>

                {/* SubLabel TH */}
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                    คำอธิบายช่วงเวลา (ไทย)
                  </label>
                  <input
                    type="text"
                    value={period.subLabelTh || ""}
                    onChange={(e) =>
                      handleFieldChange(idx, "subLabelTh", e.target.value)
                    }
                    placeholder="เช่น ช่วงเช้า (Morning)"
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-border bg-background"
                  />
                </div>

                {/* Start Time */}
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                    เวลาเริ่ม *
                  </label>
                  <input
                    type="text"
                    value={period.startTime}
                    onChange={(e) =>
                      handleFieldChange(idx, "startTime", e.target.value)
                    }
                    placeholder="09.00"
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded-xl border border-border bg-background"
                    required
                  />
                </div>

                {/* End Time */}
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                    เวลาสิ้นสุด *
                  </label>
                  <input
                    type="text"
                    value={period.endTime}
                    onChange={(e) =>
                      handleFieldChange(idx, "endTime", e.target.value)
                    }
                    placeholder="11.30"
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded-xl border border-border bg-background"
                    required
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── FOOTER SAVE / CANCEL ── */}
      <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={saving}
            className="text-xs cursor-pointer"
          >
            ปิดหน้าต่าง
          </Button>
        )}
        <Button
          type="submit"
          size="sm"
          disabled={saving}
          className="gap-2 text-xs font-semibold cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          <span>
            {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่าคาบเรียนและเวลา"}
          </span>
        </Button>
      </div>
    </form>
  );
}
