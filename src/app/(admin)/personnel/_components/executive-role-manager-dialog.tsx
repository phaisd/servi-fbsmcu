"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import {
  Award,
  Users,
  ArrowRightLeft,
  Check,
  ExternalLink,
  UserMinus,
  Building2,
} from "lucide-react";
import {
  LiyonDialog,
  LiyonDialogHeader,
  LiyonDialogBody,
  LiyonDialogFooter,
  LiyonDialogCloseButton,
} from "@/shared/components/liyon";
import { Button } from "@/components/ui/button";
import {
  FACULTY_EXECUTIVE_SLOTS,
  matchExecutiveSlot,
  formatPersonnelName,
  type ExecutiveSlotDefinition,
} from "@/features/personnel";
import {
  assignExecutiveSlotAction,
  stepDownExecutiveAction,
} from "@/features/personnel/actions";
import type { Personnel, Department, ResearchPublication } from "@/generated/prisma";

type PersonnelWithRelations = Personnel & {
  department: Department | null;
  researchPublications?: ResearchPublication[];
};

interface ExecutiveRoleManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: PersonnelWithRelations[];
  onUpdatedItems: (updatedPersons: PersonnelWithRelations[]) => void;
}

export function ExecutiveRoleManagerDialog({
  open,
  onOpenChange,
  items,
  onUpdatedItems,
}: ExecutiveRoleManagerDialogProps) {
  const [demotePrevious, setDemotePrevious] = useState(true);
  const [pendingSelections, setPendingSelections] = useState<Record<string, string>>({});
  const [savingSlotKey, setSavingSlotKey] = useState<string | null>(null);
  const [steppingDownId, setSteppingDownId] = useState<string | null>(null);

  // Eligible candidates (exclude SPECIAL guest lecturers)
  const eligibleCandidates = useMemo(() => {
    return items
      .filter((p) => p.type !== "SPECIAL")
      .sort((a, b) => {
        const deptA = a.department?.nameTh || "";
        const deptB = b.department?.nameTh || "";
        if (deptA !== deptB) return deptA.localeCompare(deptB, "th");
        return (a.orderIndex ?? 99) - (b.orderIndex ?? 99);
      });
  }, [items]);

  // Map each of the 9 standard slots to its current holder
  const slotHolders = useMemo(() => {
    const map = new Map<string, PersonnelWithRelations>();
    for (const person of items) {
      if (person.type === "SPECIAL") continue;
      const slot = matchExecutiveSlot(person);
      if (slot && !map.has(slot.slotKey)) {
        map.set(slot.slotKey, person);
      }
    }
    return map;
  }, [items]);

  const handleAssignSlot = async (slot: ExecutiveSlotDefinition) => {
    const currentHolder = slotHolders.get(slot.slotKey);
    const selectedId =
      pendingSelections[slot.slotKey] !== undefined
        ? pendingSelections[slot.slotKey]
        : currentHolder?.id || "";

    if (!selectedId && !currentHolder) {
      toast.error("กรุณาเลือกบุคลากรที่ต้องการแต่งตั้ง");
      return;
    }

    if (selectedId === (currentHolder?.id || "")) {
      toast.info("บุคลากรท่านนี้ดำรงตำแหน่งนี้อยู่แล้ว");
      return;
    }

    setSavingSlotKey(slot.slotKey);
    try {
      const res = await assignExecutiveSlotAction({
        slotKey: slot.slotKey,
        newPersonnelId: selectedId || null,
        previousPersonnelId: currentHolder?.id || null,
        demotePrevious,
      });

      const updatedBatch: PersonnelWithRelations[] = [];
      if (res.steppedDownPerson) {
        updatedBatch.push(res.steppedDownPerson as PersonnelWithRelations);
      }
      if (res.appointedPerson) {
        updatedBatch.push(res.appointedPerson as PersonnelWithRelations);
      }
      if (updatedBatch.length > 0) {
        onUpdatedItems(updatedBatch);
      }

      toast.success(`อัปเดตตำแหน่ง "${slot.titleTh}" เรียบร้อยแล้ว`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการสลับตำแหน่ง";
      toast.error(msg);
    } finally {
      setSavingSlotKey(null);
    }
  };

  const handleStepDown = async (person: PersonnelWithRelations) => {
    setSteppingDownId(person.id);
    try {
      const updated = await stepDownExecutiveAction(person.id);
      onUpdatedItems([updated as PersonnelWithRelations]);
      toast.success(
        `ปรับสถานะ "${formatPersonnelName(person)}" เป็นอาจารย์ประจำ/บุคลากรปกติเรียบร้อยแล้ว`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      toast.error(msg);
    } finally {
      setSteppingDownId(null);
    }
  };

  return (
    <LiyonDialog open={open} onOpenChange={onOpenChange} wide>
      <div className="max-w-4xl w-full">
        <LiyonDialogHeader
          title="แต่งตั้ง / เปลี่ยนผ่านคณะผู้บริหาร คณะพุทธศาสตร์"
          description={
            <span className="inline-flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                <Award className="w-4 h-4" />
                <span>ระบบจัดการและสลับตำแหน่งผู้บริหาร (Executive Handover)</span>
              </span>
              <Link
                href="/portal/executives"
                target="_blank"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                <span>ดูหน้าทำเนียบผู้บริหาร (/portal/executives)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </span>
          }
        />
        <LiyonDialogCloseButton label="ปิดหน้าต่าง" />

        <LiyonDialogBody className="space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Option Banner */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <p className="font-bold text-foreground">
                เลือกบุคลากรคนใหม่ในตำแหน่งบริหารที่ต้องการเปลี่ยนผ่าน
              </p>
              <p className="text-muted-foreground">
                หากเป็นตำแหน่งหัวหน้าภาควิชา ระบบจะจัดลำดับแสดงผล (`orderIndex = 1`) ขึ้นเป็นท่านแรกของภาควิชาให้อัตโนมัติ
              </p>
            </div>
            <label className="inline-flex items-center gap-2 font-semibold text-foreground cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={demotePrevious}
                onChange={(e) => setDemotePrevious(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary"
              />
              <span>ปรับคนเดิมกลับเป็นอาจารย์ประจำอัตโนมัติ</span>
            </label>
          </div>

          {/* Slots List */}
          <div className="space-y-3">
            {FACULTY_EXECUTIVE_SLOTS.map((slot) => {
              const currentHolder = slotHolders.get(slot.slotKey);
              const selectedId =
                pendingSelections[slot.slotKey] !== undefined
                  ? pendingSelections[slot.slotKey]
                  : currentHolder?.id || "";
              const isChanged = selectedId !== (currentHolder?.id || "");
              const isSaving = savingSlotKey === slot.slotKey;

              return (
                <div
                  key={slot.slotKey}
                  className="p-4 rounded-xl border bg-card flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-2xs"
                >
                  {/* Left: Slot Info & Current Holder */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="relative w-12 h-14 rounded-lg overflow-hidden border bg-muted shrink-0">
                      {currentHolder?.imageUrl ? (
                        <Image
                          src={currentHolder.imageUrl}
                          alt={currentHolder.firstNameTh}
                          fill
                          sizes="48px"
                          className="object-cover object-top"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                          <Users className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-extrabold text-primary">
                          {slot.titleTh}
                        </span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-muted text-muted-foreground font-medium">
                          ระดับที่ {slot.tier}
                        </span>
                      </div>
                      {currentHolder ? (
                        <p className="text-sm font-bold text-foreground truncate">
                          ผู้ดำรงตำแหน่งปัจจุบัน: {formatPersonnelName(currentHolder)}
                        </p>
                      ) : (
                        <p className="text-xs text-amber-600 font-semibold">
                          ยังไม่ได้ระบุผู้ดำรงตำแหน่ง
                        </p>
                      )}
                      {currentHolder?.department?.nameTh && (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-primary" />
                          <span>{currentHolder.department.nameTh}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Candidate Selector & Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 lg:w-[420px] shrink-0">
                    <select
                      value={selectedId}
                      onChange={(e) =>
                        setPendingSelections((prev) => ({
                          ...prev,
                          [slot.slotKey]: e.target.value,
                        }))
                      }
                      aria-label={`เลือกผู้ดำรงตำแหน่ง ${slot.titleTh}`}
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-border bg-background text-foreground"
                    >
                      <option value="">-- ว่าง / ไม่ระบุผู้ดำรงตำแหน่ง --</option>
                      {eligibleCandidates.map((cand) => (
                        <option key={cand.id} value={cand.id}>
                          {formatPersonnelName(cand)}
                          {cand.department?.nameTh ? ` (${cand.department.nameTh})` : ""}
                        </option>
                      ))}
                    </select>

                    <Button
                      type="button"
                      size="sm"
                      disabled={!isChanged || isSaving}
                      onClick={() => handleAssignSlot(slot)}
                      className="gap-1.5 text-xs font-semibold cursor-pointer shrink-0"
                    >
                      {isSaving ? (
                        <span>กำลังบันทึก...</span>
                      ) : (
                        <>
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>สลับตำแหน่ง</span>
                        </>
                      )}
                    </Button>

                    {currentHolder && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={steppingDownId === currentHolder.id}
                        onClick={() => handleStepDown(currentHolder)}
                        title="พ้นวาระบริหาร (ปรับเป็นอาจารย์ประจำ)"
                        className="text-xs px-2.5 cursor-pointer shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </LiyonDialogBody>

        <LiyonDialogFooter className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            การเปลี่ยนตำแหน่งจะอัปเดตทั้งหน้าทำเนียบผู้บริหารและหน้าภาควิชาโดยอัตโนมัติ
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs gap-1.5 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>เสร็จสิ้น</span>
          </Button>
        </LiyonDialogFooter>
      </div>
    </LiyonDialog>
  );
}
