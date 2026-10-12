"use client";

import * as React from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  Search,
  GraduationCap,
  Users,
  Edit2,
  Trash2,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Landmark,
} from "lucide-react";
import { useT } from "@/shared/lib/i18n/client";
import {
  LiyonCard,
  LiyonField,
  LiyonSelect,
  LiyonDialog,
  LiyonDialogHeader,
  LiyonDialogBody,
  LiyonDialogFooter,
  LiyonDialogCloseButton,
} from "@/shared/components/liyon";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  createDepartmentAction,
  updateDepartmentAction,
  deleteDepartmentAction,
} from "@/features/curriculum/actions";
import type { Department, Curriculum } from "@/generated/prisma";

type DepartmentWithCurriculums = Department & {
  curriculums?: Array<Pick<Curriculum, "id" | "nameTh" | "nameEn" | "degree" | "isActive" | "durationYears">>;
  _count?: {
    curriculums?: number;
    personnel?: number;
  };
};

interface DepartmentsAdminClientProps {
  initialItems: DepartmentWithCurriculums[];
}

const TYPE_CONFIG: Record<
  string,
  { labelTh: string; labelEn: string; icon: typeof Building2; color: string }
> = {
  DEPARTMENT: {
    labelTh: "ภาควิชา",
    labelEn: "Department",
    icon: Landmark,
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  PROGRAM: {
    labelTh: "สาขาวิชา",
    labelEn: "Program",
    icon: BookOpen,
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  DIVISION: {
    labelTh: "ส่วนงาน / สำนักงาน",
    labelEn: "Division",
    icon: Building2,
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
};

export function DepartmentsAdminClient({ initialItems }: DepartmentsAdminClientProps) {
  const t = useT();
  const [items, setItems] = React.useState<DepartmentWithCurriculums[]>(initialItems);
  const [search, setSearch] = React.useState("");
  const [filterType, setFilterType] = React.useState("ALL");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  // Dialog state
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<DepartmentWithCurriculums | null>(null);
  const [isDeleting, setIsDeleting] = React.useState<DepartmentWithCurriculums | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  // Form state
  const [formData, setFormData] = React.useState({
    nameTh: "",
    nameEn: "",
    code: "",
    type: "DEPARTMENT",
    descriptionTh: "",
    descriptionEn: "",
    orderIndex: 0,
  });

  const openCreateDialog = () => {
    setEditingItem(null);
    setFormData({
      nameTh: "",
      nameEn: "",
      code: "",
      type: "DEPARTMENT",
      descriptionTh: "",
      descriptionEn: "",
      orderIndex: items.length,
    });
    setIsFormOpen(true);
  };

  const openEditDialog = (item: DepartmentWithCurriculums) => {
    setEditingItem(item);
    setFormData({
      nameTh: item.nameTh,
      nameEn: item.nameEn || "",
      code: item.code || "",
      type: item.type || "DEPARTMENT",
      descriptionTh: item.descriptionTh || "",
      descriptionEn: item.descriptionEn || "",
      orderIndex: item.orderIndex,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameTh.trim()) {
      toast.error("กรุณาระบุชื่อภาษาไทย");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        nameTh: formData.nameTh.trim(),
        nameEn: formData.nameEn.trim() || null,
        code: formData.code.trim().toUpperCase() || null,
        type: formData.type,
        descriptionTh: formData.descriptionTh.trim() || null,
        descriptionEn: formData.descriptionEn.trim() || null,
        orderIndex: Number(formData.orderIndex) || 0,
      };

      if (editingItem) {
        const updated = await updateDepartmentAction(editingItem.id, payload);
        setItems((prev) =>
          prev.map((it) =>
            it.id === editingItem.id
              ? {
                  ...it,
                  ...updated,
                  curriculums: it.curriculums,
                  _count: it._count,
                }
              : it
          )
        );
        toast.success("แก้ไขข้อมูลหน่วยงานเรียบร้อยแล้ว");
      } else {
        const created = await createDepartmentAction(payload);
        setItems((prev) => [
          ...prev,
          {
            ...created,
            curriculums: [],
            _count: { curriculums: 0, personnel: 0 },
          },
        ]);
        toast.success("เพิ่มหน่วยงานใหม่เรียบร้อยแล้ว");
      }
      setIsFormOpen(false);
    } catch {
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isDeleting) return;
    setSubmitting(true);
    try {
      await deleteDepartmentAction(isDeleting.id);
      setItems((prev) => prev.filter((it) => it.id !== isDeleting.id));
      toast.success("ลบหน่วยงานเรียบร้อยแล้ว");
      setIsDeleting(null);
    } catch {
      toast.error("ไม่สามารถลบหน่วยงานได้");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Stats
  const stats = React.useMemo(() => {
    const departmentsCount = items.filter(
      (i) => (i.type || "DEPARTMENT") === "DEPARTMENT" && !i.nameTh.includes("สาขาวิชา")
    ).length;

    // หน่วยงานที่เป็นสาขาวิชาโดยตรง (type === "PROGRAM" หรือชื่อมี "สาขาวิชา")
    const explicitProgramDepts = items.filter(
      (i) => i.type === "PROGRAM" || i.nameTh.includes("สาขาวิชา")
    ).length;

    // จำนวนหลักสูตร/สาขาวิชาที่มีการเปิดสอนในสังกัด
    const totalCurriculumsCount = items.reduce(
      (sum, item) => sum + (item._count?.curriculums ?? item.curriculums?.length ?? 0),
      0
    );

    // หากยังไม่มีหน่วยงานที่ตั้ง type เป็น PROGRAM ให้สะท้อนจากหลักสูตร/สาขาวิชาที่เปิดสอน หรือหน่วยงานสาขาวิชา
    const programsCount = explicitProgramDepts > 0 ? explicitProgramDepts : totalCurriculumsCount;

    const divisionsCount = items.filter((i) => i.type === "DIVISION").length;

    return {
      departmentsCount,
      programsCount,
      divisionsCount,
      totalCurriculumsCount,
    };
  }, [items]);

  const totalCurriculums = stats.totalCurriculumsCount;

  // Filtered
  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTh = item.nameTh.toLowerCase().includes(q);
        const matchEn = (item.nameEn || "").toLowerCase().includes(q);
        const matchCode = (item.code || "").toLowerCase().includes(q);
        if (!matchTh && !matchEn && !matchCode) return false;
      }
      if (filterType !== "ALL") {
        const itemType = item.type || "DEPARTMENT";
        if (filterType === "PROGRAM") {
          if (itemType !== "PROGRAM" && !item.nameTh.includes("สาขาวิชา")) return false;
        } else if (filterType === "DEPARTMENT") {
          if (itemType !== "DEPARTMENT" || item.nameTh.includes("สาขาวิชา")) return false;
        } else if (itemType !== filterType) {
          return false;
        }
      }
      return true;
    });
  }, [items, search, filterType]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>{t("curriculum.departments_title")}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-muted font-normal text-muted-foreground">
                  {items.length} หน่วยงาน
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {t("curriculum.departments_subtitle")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/curriculum">
            <Button variant="outline" className="gap-2 text-xs">
              <GraduationCap className="w-4 h-4 text-primary" />
              <span>ดูหลักสูตรทั้งหมด</span>
              <span className="px-1.5 py-0.2 rounded-md bg-muted text-[10px] text-muted-foreground">
                {totalCurriculums}
              </span>
            </Button>
          </Link>
          <Button onClick={openCreateDialog} className="gap-2 text-xs font-semibold">
            <Plus className="w-4 h-4" />
            <span>เพิ่มภาควิชา / ส่วนงาน</span>
          </Button>
        </div>
      </div>

      {/* ── SUMMARY STATS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <LiyonCard>
          <div className="p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">ภาควิชา</p>
              <p className="text-lg font-bold">{stats.departmentsCount}</p>
            </div>
          </div>
        </LiyonCard>

        <LiyonCard>
          <div className="p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">สาขาวิชา</p>
              <p className="text-lg font-bold">{stats.programsCount}</p>
            </div>
          </div>
        </LiyonCard>

        <LiyonCard>
          <div className="p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">ส่วนงาน / ศูนย์</p>
              <p className="text-lg font-bold">{stats.divisionsCount}</p>
            </div>
          </div>
        </LiyonCard>

        <LiyonCard>
          <div className="p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">หลักสูตรในสังกัดรวม</p>
              <p className="text-lg font-bold">{stats.totalCurriculumsCount}</p>
            </div>
          </div>
        </LiyonCard>
      </div>

      {/* ── FILTERS ── */}
      <LiyonCard>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อหน่วยงาน หรือรหัสย่อ..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <LiyonSelect
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs"
          >
            <option value="ALL">🏛️ ทุกประเภทหน่วยงาน</option>
            <option value="DEPARTMENT">ภาควิชา (Department)</option>
            <option value="PROGRAM">สาขาวิชา (Program)</option>
            <option value="DIVISION">ส่วนงาน / สำนักงาน (Division)</option>
          </LiyonSelect>
        </div>
      </LiyonCard>

      {/* ── LIST ── */}
      <LiyonCard>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b bg-muted/30 text-muted-foreground font-semibold">
                <th className="py-3 px-4 w-10 text-center">#</th>
                <th className="py-3 px-4">ชื่อภาควิชา / สาขาวิชา / ส่วนงาน</th>
                <th className="py-3 px-4">ประเภท</th>
                <th className="py-3 px-4">รหัสย่อ</th>
                <th className="py-3 px-4 text-center">หลักสูตรในสังกัด</th>
                <th className="py-3 px-4 text-center">บุคลากร</th>
                <th className="py-3 px-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredItems.map((item, index) => {
                const conf = TYPE_CONFIG[item.type || "DEPARTMENT"] || TYPE_CONFIG.DEPARTMENT;
                const IconComp = conf.icon;
                const currCount = item._count?.curriculums ?? item.curriculums?.length ?? 0;
                const personCount = item._count?.personnel ?? 0;
                const isExpanded = expandedId === item.id;

                return (
                  <React.Fragment key={item.id}>
                    <tr className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 text-center text-muted-foreground font-mono">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {currCount > 0 && (
                            <button
                              type="button"
                              onClick={() => toggleExpand(item.id)}
                              className="text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
                              title="ดูหลักสูตรที่สังกัด"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          <div>
                            <p className="font-bold text-foreground text-sm flex items-center gap-2">
                              <span>{item.nameTh}</span>
                            </p>
                            {item.nameEn && (
                              <p className="text-muted-foreground text-[11px] font-sans">
                                {item.nameEn}
                              </p>
                            )}
                            {item.descriptionTh && (
                              <p className="text-muted-foreground text-[11px] line-clamp-1 mt-0.5 max-w-md">
                                {item.descriptionTh}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border ${conf.color}`}
                        >
                          <IconComp className="w-3 h-3" />
                          <span>{conf.labelTh}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {item.code ? (
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-foreground">
                            {item.code}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/60 text-[11px]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {currCount > 0 ? (
                          <button
                            type="button"
                            onClick={() => toggleExpand(item.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold text-xs hover:bg-primary/20 transition-colors cursor-pointer"
                          >
                            <GraduationCap className="w-3.5 h-3.5" />
                            <span>{currCount} หลักสูตร</span>
                          </button>
                        ) : (
                          <span className="text-muted-foreground text-xs">0 หลักสูตร</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
                          <Users className="w-3.5 h-3.5" />
                          <span>{personCount} คน</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEditDialog(item)}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="แก้ไขหน่วยงาน"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setIsDeleting(item)}
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            title="ลบหน่วยงาน"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable row: Curriculums under this department */}
                    {isExpanded && item.curriculums && item.curriculums.length > 0 && (
                      <tr className="bg-muted/15 border-b">
                        <td colSpan={7} className="p-4 pl-12">
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                              <GraduationCap className="w-4 h-4 text-primary" />
                              <span>หลักสูตรที่สังกัดใน &ldquo;{item.nameTh}&rdquo; ({item.curriculums.length}) :</span>
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                              {item.curriculums.map((curr) => (
                                <div
                                  key={curr.id}
                                  className="p-2.5 rounded-lg border bg-background flex items-center justify-between gap-2 shadow-2xs"
                                >
                                  <div className="min-w-0">
                                    <p className="font-semibold text-xs truncate text-foreground">
                                      {curr.nameTh}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                      {curr.degree} • {curr.durationYears} ปี
                                    </p>
                                  </div>
                                  <span
                                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold shrink-0 ${
                                      curr.isActive
                                        ? "bg-emerald-500/10 text-emerald-600"
                                        : "bg-muted text-muted-foreground"
                                    }`}
                                  >
                                    {curr.isActive ? "เปิดสอน" : "ปิด"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <Building2 className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                    <p className="font-medium">ไม่พบข้อมูลภาควิชาหรือหน่วยงานที่ค้นหา</p>
                    <p className="text-[11px] mt-1">สามารถกด &ldquo;เพิ่มภาควิชา / ส่วนงาน&rdquo; เพื่อสร้างข้อมูลได้ทันที</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </LiyonCard>

      {/* ── CREATE / EDIT DIALOG ── */}
      <LiyonDialog open={isFormOpen} onOpenChange={setIsFormOpen} wide>
        <LiyonDialogCloseButton label="ปิด" />
        <LiyonDialogHeader
          title={editingItem ? "แก้ไขภาควิชา / ส่วนงาน" : "เพิ่มภาควิชา / ส่วนงานใหม่"}
          description="กำหนดข้อมูลและโครงสร้างของหน่วยงาน เพื่อจัดเก็บหลักสูตรและบุคลากร"
        />
        <form onSubmit={handleSubmit}>
          <LiyonDialogBody className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <LiyonField label="ชื่อหน่วยงาน (ภาษาไทย) *" hint="เช่น ภาควิชาพระพุทธศาสนา หรือ สาขาวิชาปรัชญา">
                <input
                  type="text"
                  required
                  value={formData.nameTh}
                  onChange={(e) => setFormData({ ...formData, nameTh: e.target.value })}
                  placeholder="ภาควิชาพระพุทธศาสนา"
                />
              </LiyonField>
              <LiyonField label="ชื่อหน่วยงาน (ภาษาอังกฤษ)" hint="เช่น Department of Buddhism">
                <input
                  type="text"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  placeholder="Department of Buddhism"
                />
              </LiyonField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <LiyonField label="ประเภทโครงสร้าง *" hint="ระดับของหน่วยงาน">
                <LiyonSelect
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="DEPARTMENT">🏛️ ภาควิชา (Department)</option>
                  <option value="PROGRAM">📚 สาขาวิชา (Program)</option>
                  <option value="DIVISION">🏢 ส่วนงาน / สำนักงาน (Division)</option>
                </LiyonSelect>
              </LiyonField>

              <LiyonField label="รหัสย่อ (Code)" hint="เช่น BUD, PHI, DEAN">
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="BUD"
                  maxLength={50}
                />
              </LiyonField>

              <LiyonField label="ลำดับการจัดเรียง (Order Index)">
                <input
                  type="number"
                  value={formData.orderIndex}
                  onChange={(e) =>
                    setFormData({ ...formData, orderIndex: Number(e.target.value) || 0 })
                  }
                />
              </LiyonField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <LiyonField label="คำอธิบาย / พันธกิจ (ภาษาไทย)">
                <textarea
                  rows={3}
                  value={formData.descriptionTh}
                  onChange={(e) => setFormData({ ...formData, descriptionTh: e.target.value })}
                  placeholder="รายละเอียด พันธกิจ หรือข้อมูลการติดต่อของหน่วยงาน..."
                />
              </LiyonField>
              <LiyonField label="คำอธิบาย / พันธกิจ (ภาษาอังกฤษ)">
                <textarea
                  rows={3}
                  value={formData.descriptionEn}
                  onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                  placeholder="Department vision, mission, and contact information..."
                />
              </LiyonField>
            </div>
          </LiyonDialogBody>
          <LiyonDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              disabled={submitting}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "กำลังบันทึก..." : editingItem ? "บันทึกการแก้ไข" : "บันทึกหน่วยงาน"}
            </Button>
          </LiyonDialogFooter>
        </form>
      </LiyonDialog>

      {/* ── DELETE CONFIRM DIALOG ── */}
      <LiyonDialog open={!!isDeleting} onOpenChange={() => setIsDeleting(null)} danger>
        <LiyonDialogCloseButton label="ปิด" />
        <LiyonDialogHeader
          title="ยืนยันการลบหน่วยงาน"
          description="หลักสูตรและบุคลากรที่เคยสังกัดจะถูกเปลี่ยนสถานะเป็น ไม่ระบุภาควิชา"
        />
        <LiyonDialogBody>
          <p className="text-sm text-foreground">
            คุณแน่ใจหรือไม่ว่าต้องการลบหน่วยงาน{" "}
            <span className="font-bold text-destructive">&ldquo;{isDeleting?.nameTh}&rdquo;</span>?
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            ⚠️ <strong>หมายเหตุ:</strong> ข้อมูลหลักสูตรจะไม่ถูกลบออกจากระบบ แต่จะถูกปลดออกจากหน่วยงานนี้
          </p>
        </LiyonDialogBody>
        <LiyonDialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsDeleting(null)}
            disabled={submitting}
          >
            ยกเลิก
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={submitting}
          >
            {submitting ? "กำลังลบ..." : "ยืนยันการลบ"}
          </Button>
        </LiyonDialogFooter>
      </LiyonDialog>
    </div>
  );
}
