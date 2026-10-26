"use client";

import * as React from "react";
import {
  BookOpen,
  Plus,
  Search,
  GraduationCap,
  Edit2,
  Trash2,
  RefreshCw,
  Globe,
} from "lucide-react";
import { useT } from "@/shared/lib/i18n/client";
import {
  LiyonCard,
  LiyonField,
  LiyonDialog,
  LiyonDialogHeader,
  LiyonDialogBody,
  LiyonDialogCloseButton,
} from "@/shared/components/liyon";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  createMasterCourseAction,
  updateMasterCourseAction,
  deleteMasterCourseAction,
  toggleMasterCourseActiveAction,
  syncMasterCoursesAction,
} from "@/features/curriculum/actions";
import type { Curriculum, DegreeLevel, Department, MasterCourse } from "@/generated/prisma";

type MasterCourseWithRelations = MasterCourse & {
  department?: Department | null;
  curriculum?: Curriculum | null;
};

interface CoursesAdminClientProps {
  initialItems: MasterCourseWithRelations[];
  curriculums: Curriculum[];
  departments: Department[];
}

export function CoursesAdminClient({
  initialItems,
  curriculums,
  departments,
}: CoursesAdminClientProps) {
  const _t = useT();
  const [items, setItems] = React.useState<MasterCourseWithRelations[]>(initialItems);
  const [search, setSearch] = React.useState("");
  const [filterDegree, setFilterDegree] = React.useState<string>("ALL");
  const [filterDept, setFilterDept] = React.useState<string>("ALL");
  const [filterLang, setFilterLang] = React.useState<string>("ALL");

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<MasterCourseWithRelations | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);

  // Form State
  const [formData, setFormData] = React.useState({
    courseCode: "",
    courseNameTh: "",
    courseNameEn: "",
    credits: 3,
    degreeLevel: "BACHELOR",
    departmentId: "",
    curriculumId: "",
    programLanguage: "THAI",
    instructor: "",
    notes: "",
    description: "",
    isActive: true,
  });

  // Delete State
  const [deleteTarget, setDeleteTarget] = React.useState<MasterCourseWithRelations | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Filtered List
  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      if (filterDegree !== "ALL" && item.degreeLevel !== filterDegree) return false;
      if (filterDept !== "ALL") {
        if (filterDept === "none" && item.departmentId) return false;
        if (filterDept !== "none" && item.departmentId !== filterDept) return false;
      }
      if (filterLang !== "ALL" && item.programLanguage !== filterLang) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        item.courseCode.toLowerCase().includes(q) ||
        item.courseNameTh.toLowerCase().includes(q) ||
        (item.courseNameEn && item.courseNameEn.toLowerCase().includes(q)) ||
        (item.instructor && item.instructor.toLowerCase().includes(q)) ||
        (item.notes && item.notes.toLowerCase().includes(q)) ||
        (item.department?.nameTh && item.department.nameTh.toLowerCase().includes(q))
      );
    });
  }, [items, search, filterDegree, filterDept, filterLang]);

  // Statistics
  const stats = React.useMemo(() => {
    const total = items.length;
    const bachelor = items.filter((i) => i.degreeLevel === "BACHELOR").length;
    const master = items.filter((i) => i.degreeLevel === "MASTER").length;
    const doctorate = items.filter((i) => i.degreeLevel === "DOCTORATE").length;
    const english = items.filter((i) => i.programLanguage === "ENGLISH").length;
    return { total, bachelor, master, doctorate, english };
  }, [items]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      courseCode: "",
      courseNameTh: "",
      courseNameEn: "",
      credits: 3,
      degreeLevel: "BACHELOR",
      departmentId: departments[0]?.id || "",
      curriculumId: "",
      programLanguage: "THAI",
      instructor: "",
      notes: "",
      description: "",
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: MasterCourseWithRelations) => {
    setEditingItem(item);
    setFormData({
      courseCode: item.courseCode,
      courseNameTh: item.courseNameTh,
      courseNameEn: item.courseNameEn || "",
      credits: item.credits,
      degreeLevel: item.degreeLevel,
      departmentId: item.departmentId || "",
      curriculumId: item.curriculumId || "",
      programLanguage: item.programLanguage,
      instructor: item.instructor || "",
      notes: item.notes || "",
      description: item.description || "",
      isActive: item.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.courseCode.trim() || !formData.courseNameTh.trim()) {
      toast.error("กรุณาระบุรหัสวิชาและชื่อวิชาภาษาไทย");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        courseCode: formData.courseCode.trim(),
        courseNameTh: formData.courseNameTh.trim(),
        courseNameEn: formData.courseNameEn.trim() || null,
        credits: Number(formData.credits) || 3,
        degreeLevel: formData.degreeLevel as DegreeLevel,
        departmentId: formData.departmentId || null,
        curriculumId: formData.curriculumId || null,
        programLanguage: formData.programLanguage as "THAI" | "ENGLISH",
        instructor: formData.instructor.trim() || null,
        notes: formData.notes.trim() || null,
        description: formData.description.trim() || null,
        isActive: formData.isActive,
      };

      if (editingItem) {
        const res = await updateMasterCourseAction(editingItem.id, payload);
        if (res.success && res.course) {
          const dept = departments.find((d) => d.id === payload.departmentId);
          const curr = curriculums.find((c) => c.id === payload.curriculumId);
          setItems((prev) =>
            prev.map((i) =>
              i.id === editingItem.id
                ? { ...i, ...res.course, department: dept || null, curriculum: curr || null }
                : i
            )
          );
          toast.success("อัปเดตข้อมูลรายวิชาเรียบร้อยแล้ว");
          setIsDialogOpen(false);
        }
      } else {
        const res = await createMasterCourseAction(payload);
        if (res.success && res.course) {
          const dept = departments.find((d) => d.id === payload.departmentId);
          const curr = curriculums.find((c) => c.id === payload.curriculumId);
          setItems((prev) => [
            { ...res.course, department: dept || null, curriculum: curr || null },
            ...prev,
          ]);
          toast.success("เพิ่มรายวิชาใหม่เรียบร้อยแล้ว");
          setIsDialogOpen(false);
        }
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await deleteMasterCourseAction(deleteTarget.id);
      if (res.success) {
        setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
        toast.success(`ลบรายวิชา ${deleteTarget.courseCode} เรียบร้อยแล้ว`);
        setDeleteTarget(null);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "ไม่สามารถลบรายวิชานี้ได้");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (item: MasterCourseWithRelations) => {
    try {
      const res = await toggleMasterCourseActiveAction(item.id);
      if (res.success) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, isActive: !i.isActive } : i))
        );
        toast.success(`เปลี่ยนสถานะวิชา ${item.courseCode} เรียบร้อยแล้ว`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
    }
  };

  const handleSyncTimetables = async () => {
    setIsSyncing(true);
    try {
      const res = await syncMasterCoursesAction();
      if (res.success) {
        toast.success(
          `ดึงข้อมูลสำเร็จ! สร้างวิชาใหม่: ${res.createdCount} วิชา, อัปเดต: ${res.updatedCount} วิชา`
        );
        window.location.reload();
      }
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการดึงข้อมูลจากตารางเรียน"
      );
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                ทะเบียนข้อมูลรายวิชาที่เปิดสอน
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                ฐานข้อมูลรายวิชาแม่บทสำหรับจัดตารางสอนและลงทะเบียนเรียนในปีถัดไป (ไม่ต้องพิมพ์ใหม่)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncTimetables}
            disabled={isSyncing}
            className="gap-2 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "กำลังดึงข้อมูล..." : "ดึงวิชาจากตารางเรียน (Sync)"}</span>
          </Button>

          <Button size="sm" onClick={handleOpenCreate} className="gap-2 text-xs font-semibold">
            <Plus className="w-4 h-4" />
            <span>เพิ่มรายวิชาใหม่</span>
          </Button>
        </div>
      </div>

      {/* ── Statistics Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <LiyonCard className="p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">รายวิชาทั้งหมด</div>
            <div className="text-xl font-bold text-foreground">{stats.total} วิชา</div>
          </div>
        </LiyonCard>

        <LiyonCard className="p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">ระดับปริญญาตรี</div>
            <div className="text-xl font-bold text-foreground">{stats.bachelor} วิชา</div>
          </div>
        </LiyonCard>

        <LiyonCard className="p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">ระดับปริญญาโท</div>
            <div className="text-xl font-bold text-foreground">{stats.master} วิชา</div>
          </div>
        </LiyonCard>

        <LiyonCard className="p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">ระดับปริญญาเอก</div>
            <div className="text-xl font-bold text-foreground">{stats.doctorate} วิชา</div>
          </div>
        </LiyonCard>

        <LiyonCard className="p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">หลักสูตรภาษาอังกฤษ</div>
            <div className="text-xl font-bold text-foreground">{stats.english} วิชา</div>
          </div>
        </LiyonCard>
      </div>

      {/* ── Filter & Search Toolbar ── */}
      <LiyonCard className="p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="ค้นหารหัสวิชา, ชื่อวิชา, ชื่ออาจารย์ผู้สอน, หมายเหตุ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Degree Filter */}
            <select
              value={filterDegree}
              onChange={(e) => setFilterDegree(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-border bg-background text-foreground"
            >
              <option value="ALL">🎓 ทุกระดับการศึกษา</option>
              <option value="BACHELOR">ปริญญาตรี (พธ.บ.)</option>
              <option value="MASTER">ปริญญาโท (พธ.ม.)</option>
              <option value="DOCTORATE">ปริญญาเอก (พธ.ด.)</option>
            </select>

            {/* Department Filter */}
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-border bg-background text-foreground max-w-[200px]"
            >
              <option value="ALL">🏛️ ทุกภาควิชา</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nameTh}
                </option>
              ))}
            </select>

            {/* Language Filter */}
            <select
              value={filterLang}
              onChange={(e) => setFilterLang(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-border bg-background text-foreground"
            >
              <option value="ALL">🌐 ทุกภาษาหลักสูตร</option>
              <option value="THAI">🇹🇭 หลักสูตรภาษาไทย</option>
              <option value="ENGLISH">🌐 หลักสูตรภาษาอังกฤษ</option>
            </select>
          </div>
        </div>

        <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1 border-t border-border/50">
          <span>
            แสดงผล <b>{filteredItems.length}</b> จากทั้งหมด {items.length} รายวิชา
          </span>
          {(search || filterDegree !== "ALL" || filterDept !== "ALL" || filterLang !== "ALL") && (
            <button
              onClick={() => {
                setSearch("");
                setFilterDegree("ALL");
                setFilterDept("ALL");
                setFilterLang("ALL");
              }}
              className="text-primary hover:underline cursor-pointer"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          )}
        </div>
      </LiyonCard>

      {/* ── Table View ── */}
      <LiyonCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-medium">
              <tr>
                <th className="py-3 px-4 w-28">รหัสวิชา</th>
                <th className="py-3 px-4 min-w-[220px]">ชื่อรายวิชา</th>
                <th className="py-3 px-3 text-center w-20">หน่วยกิต</th>
                <th className="py-3 px-3 w-28">ระดับ</th>
                <th className="py-3 px-3 min-w-[160px]">ภาควิชา</th>
                <th className="py-3 px-3 w-24">ภาษา</th>
                <th className="py-3 px-4 min-w-[200px]">อาจารย์ผู้สอน</th>
                <th className="py-3 px-3 text-center w-20">สถานะ</th>
                <th className="py-3 px-4 text-right w-24">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-medium">ไม่พบข้อมูลรายวิชาที่ตรงกับเงื่อนไข</p>
                    <p className="text-[11px] mt-1">ลองเปลี่ยนคำค้นหา หรือกดปุ่ม "ดึงวิชาจากตารางเรียน (Sync)"</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const degreeBadge =
                    item.degreeLevel === "DOCTORATE"
                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                      : item.degreeLevel === "MASTER"
                      ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30"
                      : "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30";

                  const degreeLabel =
                    item.degreeLevel === "DOCTORATE"
                      ? "ปริญญาเอก"
                      : item.degreeLevel === "MASTER"
                      ? "ปริญญาโท"
                      : "ปริญญาตรี";

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      {/* Course Code */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded text-xs whitespace-nowrap">
                          {item.courseCode}
                        </span>
                      </td>

                      {/* Course Name */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground">{item.courseNameTh}</div>
                        {item.courseNameEn && (
                          <div className="text-[11px] text-muted-foreground italic mt-0.5">
                            {item.courseNameEn}
                          </div>
                        )}
                        {item.notes && (
                          <div className="text-[10px] text-muted-foreground/80 mt-1 line-clamp-1">
                            {item.notes}
                          </div>
                        )}
                      </td>

                      {/* Credits */}
                      <td className="py-3 px-3 text-center">
                        <span className="font-semibold text-foreground">
                          {item.credits}
                        </span>
                      </td>

                      {/* Degree Level */}
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border font-medium inline-block whitespace-nowrap ${degreeBadge}`}
                        >
                          {degreeLabel}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-3">
                        <div className="text-[11px] text-foreground font-medium line-clamp-1">
                          {item.department?.nameTh || "—"}
                        </div>
                      </td>

                      {/* Language */}
                      <td className="py-3 px-3">
                        {item.programLanguage === "ENGLISH" ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30 font-medium inline-flex items-center gap-1 whitespace-nowrap">
                            <span>🌐</span>
                            <span>อังกฤษ</span>
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 font-medium inline-flex items-center gap-1 whitespace-nowrap">
                            <span>🇹🇭</span>
                            <span>ไทย</span>
                          </span>
                        )}
                      </td>

                      {/* Instructor */}
                      <td className="py-3 px-4">
                        {item.instructor ? (
                          <div className="text-xs text-foreground/90 font-medium line-clamp-2">
                            {item.instructor}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-[11px]">
                            ไม่ได้ระบุอาจารย์ผู้สอน
                          </span>
                        )}
                      </td>

                      {/* Status Active */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(item)}
                          className="cursor-pointer"
                        >
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              item.isActive
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                                : "bg-muted text-muted-foreground border border-border"
                            }`}
                          >
                            {item.isActive ? "เปิดสอน" : "ปิดชั่วคราว"}
                          </span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-primary cursor-pointer"
                            onClick={() => handleOpenEdit(item)}
                            title="แก้ไขข้อมูลวิชา"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                            onClick={() => setDeleteTarget(item)}
                            title="ลบรายวิชา"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </LiyonCard>

      {/* ── Dialog: Create / Edit Course ── */}
      <LiyonDialog
        open={isDialogOpen}
        onOpenChange={(open) => !isSubmitting && setIsDialogOpen(open)}
        wide
      >
        <LiyonDialogCloseButton label="ปิด" />
        <LiyonDialogHeader
          title={editingItem ? `แก้ไขข้อมูลรายวิชา: ${editingItem.courseCode}` : "เพิ่มรายวิชาใหม่ในทะเบียน"}
          description="กำหนดรหัสวิชา ชื่อวิชา หน่วยกิต ภาควิชา และอาจารย์ผู้สอน เพื่อใช้จัดตารางสอนในปีถัดไป"
        />

        <form onSubmit={handleSubmit}>
          <LiyonDialogBody className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <LiyonField label="รหัสวิชา (Course Code) *">
                  <input
                    type="text"
                    required
                    placeholder="เช่น 000 102"
                    value={formData.courseCode}
                    onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background font-mono font-bold focus:ring-2 focus:ring-primary/20"
                  />
                </LiyonField>
              </div>

              <div className="sm:col-span-2">
                <LiyonField label="ชื่อรายวิชา (ภาษาไทย) *">
                  <input
                    type="text"
                    required
                    placeholder="เช่น กฎหมายทั่วไป"
                    value={formData.courseNameTh}
                    onChange={(e) => setFormData({ ...formData, courseNameTh: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20"
                  />
                </LiyonField>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <LiyonField label="ชื่อรายวิชา (ภาษาอังกฤษ) (Course Name EN)">
                  <input
                    type="text"
                    placeholder="e.g. General Law"
                    value={formData.courseNameEn}
                    onChange={(e) => setFormData({ ...formData, courseNameEn: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20"
                  />
                </LiyonField>
              </div>

              <div>
                <LiyonField label="จำนวนหน่วยกิต (Credits) *">
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) || 3 })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background font-semibold focus:ring-2 focus:ring-primary/20"
                  />
                </LiyonField>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <LiyonField label="ระดับหลักสูตร (Degree Level) *">
                  <select
                    value={formData.degreeLevel}
                    onChange={(e) => setFormData({ ...formData, degreeLevel: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background"
                  >
                    <option value="BACHELOR">ปริญญาตรี (พธ.บ.)</option>
                    <option value="MASTER">ปริญญาโท (พธ.ม.)</option>
                    <option value="DOCTORATE">ปริญญาเอก (พธ.ด.)</option>
                  </select>
                </LiyonField>
              </div>

              <div>
                <LiyonField label="ภาควิชาที่สังกัด">
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background"
                  >
                    <option value="">-- ไม่ระบุ --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nameTh}
                      </option>
                    ))}
                  </select>
                </LiyonField>
              </div>

              <div>
                <LiyonField label="ภาษาของหลักสูตร *">
                  <select
                    value={formData.programLanguage}
                    onChange={(e) => setFormData({ ...formData, programLanguage: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background"
                  >
                    <option value="THAI">🇹🇭 หลักสูตรภาษาไทย</option>
                    <option value="ENGLISH">🌐 หลักสูตรภาษาอังกฤษ</option>
                  </select>
                </LiyonField>
              </div>
            </div>

            <div>
              <LiyonField
                label="ชื่ออาจารย์ผู้สอนประจำวิชา (Instructor)"
                hint="ระบุชื่ออาจารย์ผู้บรรยายตามตารางเรียน (สามารถใส่หลายท่านได้ คั่นด้วย */ หรือ /)"
              >
                <input
                  type="text"
                  placeholder="เช่น พระมหามงคลกานต์ ฐิตธมฺโม, รศ. ดร.*/อ.ดร.คงชิต ชินสิญจ์"
                  value={formData.instructor}
                  onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20"
                />
              </LiyonField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <LiyonField label="หมายเหตุ (Notes)" hint="เช่น วิชาบังคับ, วิชาเอก, วิชาเลือกเสรี">
                  <input
                    type="text"
                    placeholder="เช่น วิชาบังคับทั่วไป"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20"
                  />
                </LiyonField>
              </div>

              <div>
                <LiyonField label="คำอธิบายรายวิชา (ย่อ)">
                  <input
                    type="text"
                    placeholder="คำอธิบายสาระสำคัญของรายวิชา"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20"
                  />
                </LiyonField>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-border">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded text-primary focus:ring-primary"
                />
                <span>สถานะเปิดให้ใช้จัดตารางเรียน (Active)</span>
              </label>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  ยกเลิก
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting} className="font-semibold">
                  {isSubmitting ? "กำลังบันทึก..." : editingItem ? "บันทึกการแก้ไข" : "เพิ่มรายวิชา"}
                </Button>
              </div>
            </div>
          </LiyonDialogBody>
        </form>
      </LiyonDialog>

      {/* ── Dialog: Delete Confirmation ── */}
      <LiyonDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !isDeleting && !open && setDeleteTarget(null)}
      >
        <LiyonDialogCloseButton label="ปิด" />
        <LiyonDialogHeader
          title="ยืนยันการลบรายวิชา"
          description="การลบรายวิชาออกจากทะเบียนหลักสูตรแม่บท"
        />

        <LiyonDialogBody className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            ท่านต้องการลบรายวิชา{" "}
            <b className="text-foreground">
              {deleteTarget?.courseCode} {deleteTarget?.courseNameTh}
            </b>{" "}
            ออกจากทะเบียนรายวิชาใช่หรือไม่? ข้อมูลนี้จะไม่สามารถกู้คืนได้
          </p>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
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
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="font-semibold"
            >
              {isDeleting ? "กำลังลบ..." : "ยืนยันการลบ"}
            </Button>
          </div>
        </LiyonDialogBody>
      </LiyonDialog>
    </div>
  );
}
