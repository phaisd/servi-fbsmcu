"use client";

import * as React from "react";
import Link from "next/link";
import {
  Calendar,
  Plus,
  Search,
  Building2,
  GraduationCap,
  Edit2,
  Trash2,
  Clock,
  Eye,
  ExternalLink,
  MapPin,
  X,
  FileSpreadsheet,
} from "lucide-react";
import { useT } from "@/shared/lib/i18n/client";
import {
  LiyonCard,
  LiyonField,
  LiyonSelect,
  LiyonSwitch,
  StatusPill,
  LiyonDialog,
  LiyonDialogHeader,
  LiyonDialogBody,
  LiyonDialogFooter,
  LiyonDialogCloseButton,
} from "@/shared/components/liyon";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  createTimetableAction,
  updateTimetableAction,
  deleteTimetableAction,
  toggleTimetableActiveAction,
  createCurriculumAction,
  createDepartmentAction,
} from "@/features/curriculum/actions";
import {
  TimetableGridView,
  type TimetableData,
  type TimetableSlot,
} from "@/features/curriculum/_components/timetable-grid-view";
import type { Curriculum, Department } from "@/generated/prisma";

type TimetableWithRelations = TimetableData & {
  curriculum?: Curriculum | null;
  department?: Department | null;
  isActive: boolean;
  orderIndex: number;
  createdAt?: any;
  updatedAt?: any;
};

interface TimetablesAdminClientProps {
  initialItems: any[];
  curriculums: Curriculum[];
  departments: Department[];
}

const DAY_OPTIONS = [
  { value: 1, label: "วันจันทร์ (Monday)" },
  { value: 2, label: "วันอังคาร (Tuesday)" },
  { value: 3, label: "วันพุธ (Wednesday)" },
  { value: 4, label: "วันพฤหัสบดี (Thursday)" },
  { value: 5, label: "วันศุกร์ (Friday)" },
  { value: 6, label: "วันเสาร์ (Saturday)" },
  { value: 7, label: "วันอาทิตย์ (Sunday)" },
];

const STANDARD_TIME_PRESETS = [
  { label: "กำหนดเวลาเอง...", start: "", end: "" },
  { label: "ช่วงเช้า 3 คาบ (09.00 - 11.30)", start: "09.00", end: "11.30" },
  { label: "ช่วงเช้า คาบ 1-2 (09.00 - 10.40)", start: "09.00", end: "10.40" },
  { label: "ช่วงเช้า คาบ 2-3 (09.50 - 11.30)", start: "09.50", end: "11.30" },
  { label: "ช่วงเช้า คาบ 1 (09.00 - 09.50)", start: "09.00", end: "09.50" },
  { label: "ช่วงเช้า คาบ 2 (09.50 - 10.40)", start: "09.50", end: "10.40" },
  { label: "ช่วงเช้า คาบ 3 (10.40 - 11.30)", start: "10.40", end: "11.30" },
  { label: "ช่วงบ่าย 1 รวม 3 คาบ (12.30 - 15.10)", start: "12.30", end: "15.10" },
  { label: "ช่วงบ่าย 1 รวม 3 คาบ (13.00 - 15.30)", start: "13.00", end: "15.30" },
  { label: "ช่วงบ่าย คาบ 4-5 (12.30 - 14.10)", start: "12.30", end: "14.10" },
  { label: "ช่วงบ่าย คาบ 4-5 (13.00 - 14.40)", start: "13.00", end: "14.40" },
  { label: "ช่วงบ่าย 2 รวม 2 คาบ (15.10 - 17.00)", start: "15.10", end: "17.00" },
  { label: "ช่วงบ่าย 2 รวม 2 คาบ (14.30 - 16.50)", start: "14.30", end: "16.50" },
  { label: "ช่วงบ่าย 2 รวม 2 คาบ (15.30 - 17.00)", start: "15.30", end: "17.00" },
];

export function TimetablesAdminClient({
  initialItems,
  curriculums: initialCurriculums,
  departments: initialDepartments,
}: TimetablesAdminClientProps) {
  const t = useT();
  const [items, setItems] = React.useState<TimetableWithRelations[]>(initialItems);
  const [curriculums, setCurriculums] = React.useState<Curriculum[]>(initialCurriculums);
  const [departments, setDepartments] = React.useState<Department[]>(initialDepartments);
  const [search, setSearch] = React.useState("");
  const [filterAcademicYear, setFilterAcademicYear] = React.useState<string>("ALL");
  const [filterSemester, setFilterSemester] = React.useState<string>("ALL");
  const [filterDegree, setFilterDegree] = React.useState<string>("ALL");
  const [filterDept, setFilterDept] = React.useState<string>("ALL");
  const [filterCurr, setFilterCurr] = React.useState<string>("ALL");
  const [filterYear, setFilterYear] = React.useState<string>("ALL");
  const [filterActive, setFilterActive] = React.useState<string>("ALL");

  // Quick Create Modal States
  const [isQuickCurrOpen, setIsQuickCurrOpen] = React.useState(false);
  const [isQuickDeptOpen, setIsQuickDeptOpen] = React.useState(false);
  const [quickSubmitting, setQuickSubmitting] = React.useState(false);

  const [quickCurrForm, setQuickCurrForm] = React.useState<{
    nameTh: string;
    nameEn: string;
    degree: "BACHELOR" | "MASTER" | "DOCTORATE" | "CERTIFICATE";
    departmentId: string;
  }>({
    nameTh: "",
    nameEn: "",
    degree: "BACHELOR",
    departmentId: "",
  });

  const [quickDeptForm, setQuickDeptForm] = React.useState({
    nameTh: "",
    nameEn: "",
    type: "DEPARTMENT" as const,
  });

  // Dynamic available academic years
  const availableYears = React.useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.academicYear) set.add(item.academicYear);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [items]);

  // Curriculums filtered by filterDept and filterDegree for admin filter bar
  const filterableCurriculums = React.useMemo(() => {
    return curriculums.filter((c) => {
      if (filterDept !== "ALL" && c.departmentId !== filterDept) return false;
      if (filterDegree !== "ALL" && c.degree !== filterDegree) return false;
      return true;
    });
  }, [curriculums, filterDept, filterDegree]);

  // Preview Modal
  const [previewItem, setPreviewItem] = React.useState<TimetableWithRelations | null>(null);

  // Form Dialog state
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<TimetableWithRelations | null>(null);
  const [isDeleting, setIsDeleting] = React.useState<TimetableWithRelations | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  // Form State
  const [formData, setFormData] = React.useState({
    titleTh: "",
    titleEn: "",
    curriculumId: "",
    departmentId: "",
    academicYear: "2569",
    semester: 1,
    yearLevel: 1,
    room: "",
    termDates: "",
    notes: "",
    isActive: true,
    orderIndex: 0,
    scheduleData: [] as TimetableSlot[],
  });

  // Slot editor state
  const [editingSlotId, setEditingSlotId] = React.useState<string | null>(null);
  const [newSlot, setNewSlot] = React.useState<Partial<TimetableSlot>>({
    dayOfWeek: 1,
    startTime: "09.00",
    endTime: "11.30",
    courseCode: "",
    courseName: "",
    instructor: "",
    room: "",
    periodLabel: "เช้า",
  });

  const openCreateDialog = () => {
    setEditingItem(null);
    setEditingSlotId(null);
    setFormData({
      titleTh: "",
      titleEn: "",
      curriculumId: curriculums[0]?.id || "",
      departmentId: departments[0]?.id || "",
      academicYear: "2569",
      semester: 1,
      yearLevel: 1,
      room: "",
      termDates: "9 มิถุนายน 2569 – 25 กันยายน 2569",
      notes: `หมายเหตุ :
1. วันพระและวันนักขัตฤกษ์เป็นวันหยุดทั่วไป (ตารางเรียนวันใดตรงกับวันพระให้ยกไปเรียนวันศุกร์)
2. เครื่องหมายดอกจัน (*) อยู่หลังชื่อรายวิชา หมายถึง ข้อสอบกลาง
3. เครื่องหมายดอกจัน (*) อยู่หลังชื่ออาจารย์ หมายถึง อาจารย์ผู้รับผิดชอบรายวิชา
4. วันพระกับวันอาทิตย์เป็นวันหยุดประจำสัปดาห์`,
      isActive: true,
      orderIndex: items.length + 1,
      scheduleData: [],
    });
    setIsFormOpen(true);
  };

  const openEditDialog = (item: TimetableWithRelations) => {
    setEditingItem(item);
    setEditingSlotId(null);
    setFormData({
      titleTh: item.titleTh,
      titleEn: item.titleEn || "",
      curriculumId: item.curriculum?.id || "",
      departmentId: item.department?.id || "",
      academicYear: item.academicYear || "2569",
      semester: item.semester || 1,
      yearLevel: item.yearLevel || 1,
      room: item.room || "",
      termDates: item.termDates || "",
      notes: item.notes || "",
      isActive: item.isActive,
      orderIndex: item.orderIndex || 0,
      scheduleData: Array.isArray(item.scheduleData) ? [...item.scheduleData] : [],
    });
    setIsFormOpen(true);
  };

  const handleAddSlot = () => {
    if (!newSlot.courseCode?.trim() || !newSlot.courseName?.trim()) {
      toast.error("กรุณาระบุรหัสวิชาและชื่อวิชา");
      return;
    }

    if (editingSlotId) {
      // อัปเดตวิชาที่มีอยู่เดิม
      setFormData((prev) => ({
        ...prev,
        scheduleData: prev.scheduleData.map((s) =>
          s.id === editingSlotId
            ? {
                ...s,
                dayOfWeek: Number(newSlot.dayOfWeek) || 1,
                startTime: newSlot.startTime?.trim() || "09.00",
                endTime: newSlot.endTime?.trim() || "11.30",
                courseCode: newSlot.courseCode?.trim() || "",
                courseName: newSlot.courseName?.trim() || "",
                instructor: newSlot.instructor?.trim() || "",
                room: newSlot.room?.trim() || null,
                periodLabel: newSlot.periodLabel?.trim() || null,
              }
            : s
        ),
      }));

      setEditingSlotId(null);
      toast.success("อัปเดตข้อมูลรายวิชาเรียบร้อย");
    } else {
      // เพิ่มวิชาใหม่
      const slotToAdd: TimetableSlot = {
        id: "slot-" + Date.now(),
        dayOfWeek: Number(newSlot.dayOfWeek) || 1,
        startTime: newSlot.startTime?.trim() || "09.00",
        endTime: newSlot.endTime?.trim() || "11.30",
        courseCode: newSlot.courseCode?.trim() || "",
        courseName: newSlot.courseName?.trim() || "",
        instructor: newSlot.instructor?.trim() || "",
        room: newSlot.room?.trim() || null,
        periodLabel: newSlot.periodLabel?.trim() || null,
      };

      setFormData((prev) => ({
        ...prev,
        scheduleData: [...prev.scheduleData, slotToAdd],
      }));

      toast.success("เพิ่มวิชาในตารางเรียบร้อย");
    }

    // Reset slot input
    setNewSlot((prev) => ({
      ...prev,
      courseCode: "",
      courseName: "",
      instructor: "",
      room: "",
    }));
  };

  const handleStartEditSlot = (slot: TimetableSlot) => {
    setEditingSlotId(slot.id);
    setNewSlot({
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      courseCode: slot.courseCode,
      courseName: slot.courseName,
      instructor: slot.instructor || "",
      room: slot.room || "",
      periodLabel: slot.periodLabel || "เช้า",
    });
  };

  const handleCancelEditSlot = () => {
    setEditingSlotId(null);
    setNewSlot((prev) => ({
      ...prev,
      courseCode: "",
      courseName: "",
      instructor: "",
      room: "",
    }));
  };

  const handleRemoveSlot = (slotId: string) => {
    if (editingSlotId === slotId) {
      handleCancelEditSlot();
    }
    setFormData((prev) => ({
      ...prev,
      scheduleData: prev.scheduleData.filter((s) => s.id !== slotId),
    }));
  };

  const handleQuickCreateCurriculum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCurrForm.nameTh.trim()) {
      toast.error("กรุณาระบุชื่อหลักสูตรภาษาไทย");
      return;
    }
    setQuickSubmitting(true);
    try {
      const created = await createCurriculumAction({
        nameTh: quickCurrForm.nameTh.trim(),
        nameEn: quickCurrForm.nameEn.trim() || null,
        degree: quickCurrForm.degree,
        departmentId: quickCurrForm.departmentId || null,
        durationYears: quickCurrForm.degree === "DOCTORATE" ? 3 : quickCurrForm.degree === "MASTER" ? 2 : 4,
        isActive: true,
      });
      setCurriculums((prev) => [created as any, ...prev]);
      setFormData((prev) => ({
        ...prev,
        curriculumId: created.id,
        departmentId: created.departmentId || prev.departmentId,
      }));
      toast.success(`สร้างหลักสูตร "${created.nameTh}" เรียบร้อยแล้ว`);
      setIsQuickCurrOpen(false);
      setQuickCurrForm({ nameTh: "", nameEn: "", degree: "BACHELOR", departmentId: "" });
    } catch (err: any) {
      toast.error(err.message || "ไม่สามารถสร้างหลักสูตรได้");
    } finally {
      setQuickSubmitting(false);
    }
  };

  const handleQuickCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickDeptForm.nameTh.trim()) {
      toast.error("กรุณาระบุชื่อภาควิชา/สาขาวิชาภาษาไทย");
      return;
    }
    setQuickSubmitting(true);
    try {
      const created = await createDepartmentAction({
        nameTh: quickDeptForm.nameTh.trim(),
        nameEn: quickDeptForm.nameEn.trim() || null,
        type: quickDeptForm.type,
      });
      setDepartments((prev) => [created as any, ...prev]);
      setFormData((prev) => ({
        ...prev,
        departmentId: created.id,
      }));
      toast.success(`สร้างภาควิชา/สาขาวิชา "${created.nameTh}" เรียบร้อยแล้ว`);
      setIsQuickDeptOpen(false);
      setQuickDeptForm({ nameTh: "", nameEn: "", type: "DEPARTMENT" });
    } catch (err: any) {
      toast.error(err.message || "ไม่สามารถสร้างภาควิชาได้");
    } finally {
      setQuickSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titleTh.trim()) {
      toast.error("กรุณาระบุชื่อตารางเรียน");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        titleTh: formData.titleTh.trim(),
        titleEn: formData.titleEn.trim() || null,
        curriculumId: formData.curriculumId || null,
        departmentId: formData.departmentId || null,
        academicYear: formData.academicYear.trim() || "2569",
        semester: Number(formData.semester) || 1,
        yearLevel: Number(formData.yearLevel) || 1,
        room: formData.room.trim() || null,
        termDates: formData.termDates.trim() || null,
        notes: formData.notes.trim() || null,
        isActive: formData.isActive,
        orderIndex: Number(formData.orderIndex) || 0,
        scheduleData: formData.scheduleData,
      };

      if (editingItem) {
        const updated = await updateTimetableAction(editingItem.id, payload);
        const curr = curriculums.find((c) => c.id === payload.curriculumId) || null;
        const dept = departments.find((d) => d.id === payload.departmentId) || null;
        setItems((prev) =>
          prev.map((it) =>
            it.id === editingItem.id ? { ...updated, curriculum: curr, department: dept } : it
          )
        );
        toast.success("บันทึกการแก้ไขตารางเรียนเรียบร้อยแล้ว");
      } else {
        const created = await createTimetableAction(payload);
        const curr = curriculums.find((c) => c.id === payload.curriculumId) || null;
        const dept = departments.find((d) => d.id === payload.departmentId) || null;
        setItems((prev) => [{ ...created, curriculum: curr, department: dept }, ...prev]);
        toast.success("สร้างตารางเรียนใหม่เรียบร้อยแล้ว");
      }
      setIsFormOpen(false);
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isDeleting) return;
    setSubmitting(true);
    try {
      await deleteTimetableAction(isDeleting.id);
      setItems((prev) => prev.filter((it) => it.id !== isDeleting.id));
      toast.success("ลบตารางเรียนเรียบร้อยแล้ว");
      setIsDeleting(null);
    } catch (err: any) {
      toast.error(err.message || "ไม่สามารถลบตารางเรียนได้");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (item: TimetableWithRelations) => {
    try {
      const nextActive = !item.isActive;
      await toggleTimetableActiveAction(item.id, nextActive);
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, isActive: nextActive } : it))
      );
      toast.success(nextActive ? "เปิดแสดงตารางเรียนแล้ว" : "ซ่อนตารางเรียนแล้ว");
    } catch (err: any) {
      toast.error("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
    }
  };

  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTh = item.titleTh.toLowerCase().includes(q);
        const matchEn = (item.titleEn || "").toLowerCase().includes(q);
        const matchRoom = (item.room || "").toLowerCase().includes(q);
        const matchCurr = (item.curriculum?.nameTh || "").toLowerCase().includes(q);
        const matchDept = (item.department?.nameTh || "").toLowerCase().includes(q);
        if (!matchTh && !matchEn && !matchRoom && !matchCurr && !matchDept) return false;
      }
      // Academic Year filter
      if (filterAcademicYear !== "ALL" && item.academicYear !== filterAcademicYear) return false;
      // Semester filter
      if (filterSemester !== "ALL" && String(item.semester) !== filterSemester) return false;
      // Degree Level filter
      if (filterDegree !== "ALL" && item.curriculum?.degree !== filterDegree) return false;
      // Department
      if (filterDept !== "ALL" && item.department?.id !== filterDept) return false;
      // Curriculum
      if (filterCurr !== "ALL" && item.curriculum?.id !== filterCurr) return false;
      // Year level
      if (filterYear !== "ALL" && String(item.yearLevel) !== filterYear) return false;
      // Active
      if (filterActive === "ACTIVE" && !item.isActive) return false;
      if (filterActive === "INACTIVE" && item.isActive) return false;

      return true;
    });
  }, [items, search, filterAcademicYear, filterSemester, filterDegree, filterDept, filterCurr, filterYear, filterActive]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>จัดการตารางเรียน / ตารางสอน</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-muted font-normal text-muted-foreground">
                  {items.length} ตาราง
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                จัดการตารางเรียนตารางสอนแยกตามหลักสูตร สาขาวิชา และชั้นปี (ตามเอกสารหลักสูตร)
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/portal/timetables" target="_blank">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-primary">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>ดูหน้าตารางเรียนนิสิต</span>
            </Button>
          </Link>
          <Link href="/curriculum">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>หลักสูตร</span>
            </Button>
          </Link>
          <Link href="/curriculum/departments">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Building2 className="w-3.5 h-3.5" />
              <span>ภาควิชา</span>
            </Button>
          </Link>
          <Link href="/curriculum/timetables/batch">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>นำเข้า / ส่งออก (CSV, PDF)</span>
            </Button>
          </Link>
          <Button onClick={openCreateDialog} size="sm" className="gap-2 text-xs font-semibold">
            <Plus className="w-4 h-4" />
            <span>เพิ่มตารางเรียนใหม่</span>
          </Button>
        </div>
      </div>

      {/* ── FILTERS BAR ── */}
      <LiyonCard className="p-4 space-y-3">
        {/* Row 1: Quick filters for Academic Year, Semester, Degree */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-3 border-b border-border/70">
          {/* Academic Year */}
          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
              📅 ปีการศึกษา (Academic Year)
            </label>
            <select
              value={filterAcademicYear}
              onChange={(e) => setFilterAcademicYear(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-border bg-background focus:ring-1 focus:ring-primary focus:outline-hidden font-medium"
            >
              <option value="ALL">ทุกปีการศึกษา</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  ปีการศึกษา {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Semester */}
          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
              ⏱️ ภาคการศึกษา (Semester)
            </label>
            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-border bg-background focus:ring-1 focus:ring-primary focus:outline-hidden font-medium"
            >
              <option value="ALL">ทุกภาคเรียน</option>
              <option value="1">ภาคการศึกษาที่ 1</option>
              <option value="2">ภาคการศึกษาที่ 2</option>
              <option value="3">ภาคฤดูร้อน (Summer)</option>
            </select>
          </div>

          {/* Degree Level */}
          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
              🎓 ระดับหลักสูตร (Degree Level)
            </label>
            <select
              value={filterDegree}
              onChange={(e) => setFilterDegree(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-border bg-background focus:ring-1 focus:ring-primary focus:outline-hidden font-medium"
            >
              <option value="ALL">ทุกระดับการศึกษา</option>
              <option value="BACHELOR">ระดับปริญญาตรี (Bachelor)</option>
              <option value="MASTER">ระดับปริญญาโท (Master)</option>
              <option value="DOCTORATE">ระดับปริญญาเอก (Doctorate)</option>
              <option value="CERTIFICATE">หลักสูตรประกาศนียบัตร (Certificate)</option>
            </select>
          </div>
        </div>

        {/* Row 2: Search, Department, Curriculum, Year level, Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อตาราง/ห้อง..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-border bg-background focus:ring-1 focus:ring-primary focus:outline-hidden"
            />
          </div>

          {/* Dept filter */}
          <div>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-border bg-background focus:ring-1 focus:ring-primary focus:outline-hidden"
            >
              <option value="ALL">🏛️ ทุกภาควิชา</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nameTh}
                </option>
              ))}
            </select>
          </div>

          {/* Curriculum filter */}
          <div>
            <select
              value={filterCurr}
              onChange={(e) => setFilterCurr(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-border bg-background focus:ring-1 focus:ring-primary focus:outline-hidden"
            >
              <option value="ALL">🎓 ทุกหลักสูตร</option>
              {filterableCurriculums.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameTh}
                </option>
              ))}
            </select>
          </div>

          {/* Year level filter */}
          <div>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-border bg-background focus:ring-1 focus:ring-primary focus:outline-hidden"
            >
              <option value="ALL">📚 ทุกชั้นปี (1 - 4)</option>
              <option value="1">ชั้นปีที่ 1 (Year 1)</option>
              <option value="2">ชั้นปีที่ 2 (Year 2)</option>
              <option value="3">ชั้นปีที่ 3 (Year 3)</option>
              <option value="4">ชั้นปีที่ 4 (Year 4)</option>
            </select>
          </div>

          {/* Active filter */}
          <div>
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-border bg-background focus:ring-1 focus:ring-primary focus:outline-hidden"
            >
              <option value="ALL">สถานะทั้งหมด</option>
              <option value="ACTIVE">เปิดใช้งาน</option>
              <option value="INACTIVE">ปิดใช้งาน</option>
            </select>
          </div>
        </div>
      </LiyonCard>

      {/* ── TIMETABLES LIST ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map((item) => {
          const slotsCount = Array.isArray(item.scheduleData) ? item.scheduleData.length : 0;
          return (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 hover:shadow-md transition-all group"
            >
              <div className="space-y-3">
                {/* Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-md bg-primary/10 text-primary font-bold text-xs">
                      ชั้นปีที่ {item.yearLevel}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[11px] font-medium">
                      ภาคเรียน {item.semester}/{item.academicYear}
                    </span>
                    {item.curriculum?.degree && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] font-medium">
                        {item.curriculum.degree === "BACHELOR"
                          ? "ป.ตรี"
                          : item.curriculum.degree === "MASTER"
                          ? "ป.โท"
                          : item.curriculum.degree === "DOCTORATE"
                          ? "ป.เอก"
                          : item.curriculum.degree}
                      </span>
                    )}
                  </div>
                  <StatusPill tone={item.isActive ? "ok" : "off"}>
                    {item.isActive ? "เปิดใช้งาน" : "ปิด"}
                  </StatusPill>
                </div>

                {/* Title */}
                <div>
                  <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {item.titleTh}
                  </h3>
                  {item.titleEn && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 font-sans">
                      {item.titleEn}
                    </p>
                  )}
                </div>

                {/* Metadata */}
                <div className="space-y-1.5 pt-2 border-t border-border/60 text-xs text-muted-foreground">
                  {item.room && (
                    <div className="flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-300">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.room}</span>
                    </div>
                  )}
                  {item.termDates && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span className="line-clamp-1">{item.termDates}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] bg-muted px-2 py-0.5 rounded text-muted-foreground">
                      {slotsCount} รายวิชาในตาราง
                    </span>
                    {item.department && (
                      <span className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                        {item.department.nameTh}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-4 mt-3 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewItem(item)}
                  className="gap-1.5 text-xs text-primary cursor-pointer hover:bg-primary/10"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>ดูตารางสอน</span>
                </Button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(item)}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
                    title={item.isActive ? "คลิกเพื่อซ่อน" : "คลิกเพื่อเปิด"}
                  >
                    <LiyonSwitch
                      checked={item.isActive}
                      onCheckedChange={() => handleToggleActive(item)}
                    />
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(item)}
                    className="h-8 w-8 p-0 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsDeleting(item)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="col-span-full py-16 text-center text-muted-foreground border border-dashed rounded-2xl p-6">
            <Calendar className="w-10 h-10 mx-auto mb-2 text-muted-foreground/40" />
            <p className="font-semibold text-sm">ไม่พบข้อมูลตารางเรียนที่ค้นหา</p>
            <p className="text-xs mt-1">สามารถกด &ldquo;เพิ่มตารางเรียนใหม่&rdquo; เพื่อสร้างตารางเรียน</p>
          </div>
        )}
      </div>

      {/* ── PREVIEW MODAL ── */}
      {previewItem && (
        <LiyonDialog open={Boolean(previewItem)} onOpenChange={() => setPreviewItem(null)} wide>
          <LiyonDialogCloseButton label="ปิด" />
          <LiyonDialogHeader
            title={`ตารางเรียน: ${previewItem.titleTh}`}
            description={previewItem.titleEn || undefined}
          />
          <LiyonDialogBody className="max-h-[80vh] overflow-y-auto">
            <TimetableGridView timetable={previewItem} showHeaderActions={true} />
          </LiyonDialogBody>
        </LiyonDialog>
      )}

      {/* ── CREATE / EDIT DIALOG ── */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-background rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-border overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-lg text-foreground">
                  {editingItem ? "แก้ไขตารางเรียน" : "เพิ่มตารางเรียนใหม่"}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {!editingItem && (
                  <Link href="/curriculum/timetables/batch">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs text-primary font-medium">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>นำเข้าข้อมูลเป็นชุด (CSV)</span>
                    </Button>
                  </Link>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFormOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* General Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <LiyonField label="ชื่อตารางเรียน (ไทย) *">
                    <input
                      type="text"
                      value={formData.titleTh}
                      onChange={(e) => setFormData({ ...formData, titleTh: e.target.value })}
                      placeholder="เช่น ตารางสอนชั้นปีที่ 1 พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background"
                      required
                    />
                  </LiyonField>
                </div>

                <div className="md:col-span-2">
                  <LiyonField label="ชื่อตารางเรียน (English)">
                    <input
                      type="text"
                      value={formData.titleEn}
                      onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                      placeholder="e.g. Timetable of First Year Students, Bachelor of Art Degree in Buddhist Studies"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background"
                    />
                  </LiyonField>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-foreground">
                      หลักสูตรที่เกี่ยวข้อง
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsQuickCurrOpen(true)}
                      className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>เพิ่มหลักสูตรใหม่</span>
                    </button>
                  </div>
                  <select
                    value={formData.curriculumId}
                    onChange={(e) => {
                      const newCurrId = e.target.value;
                      const matchingCurr = curriculums.find((c) => c.id === newCurrId);
                      setFormData((prev) => ({
                        ...prev,
                        curriculumId: newCurrId,
                        // Auto-select department if curriculum has an associated department
                        departmentId: matchingCurr?.departmentId || prev.departmentId,
                      }));
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background"
                  >
                    <option value="">-- ไม่ระบุหลักสูตร --</option>
                    {curriculums.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameTh}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-foreground">
                      ภาควิชา / สาขาวิชา
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsQuickDeptOpen(true)}
                      className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>เพิ่มสาขาวิชาใหม่</span>
                    </button>
                  </div>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background"
                  >
                    <option value="">-- ไม่ระบุภาควิชา --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nameTh}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <LiyonField label="ชั้นปีที่">
                    <select
                      value={formData.yearLevel}
                      onChange={(e) =>
                        setFormData({ ...formData, yearLevel: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background"
                    >
                      <option value={1}>ชั้นปีที่ 1 (Year 1)</option>
                      <option value={2}>ชั้นปีที่ 2 (Year 2)</option>
                      <option value={3}>ชั้นปีที่ 3 (Year 3)</option>
                      <option value={4}>ชั้นปีที่ 4 (Year 4)</option>
                    </select>
                  </LiyonField>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <LiyonField label="ภาคการศึกษา">
                    <input
                      type="number"
                      value={formData.semester}
                      onChange={(e) =>
                        setFormData({ ...formData, semester: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background"
                    />
                  </LiyonField>
                  <LiyonField label="ปีการศึกษา">
                    <input
                      type="text"
                      value={formData.academicYear}
                      onChange={(e) =>
                        setFormData({ ...formData, academicYear: e.target.value })
                      }
                      placeholder="2569"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background"
                    />
                  </LiyonField>
                </div>

                <div>
                  <LiyonField label="ห้องเรียนประจำ (Room)">
                    <input
                      type="text"
                      value={formData.room}
                      onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                      placeholder="เช่น Room No. D 517-518 หรือ ชั้น 5 ห้อง D 516/1"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background"
                    />
                  </LiyonField>
                </div>

                <div>
                  <LiyonField label="ระยะเวลาเปิด-ปิดภาคเรียน (Term Dates)">
                    <input
                      type="text"
                      value={formData.termDates}
                      onChange={(e) => setFormData({ ...formData, termDates: e.target.value })}
                      placeholder="เช่น 9 มิถุนายน 2569 – 25 กันยายน 2569"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background"
                    />
                  </LiyonField>
                </div>

                <div className="md:col-span-2">
                  <LiyonField label="ข้อความหมายเหตุ (Notes)">
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      placeholder="1. วันพระและวันนักขัตฤกษ์เป็นวันหยุดทั่วไป..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background resize-y"
                    />
                  </LiyonField>
                </div>
              </div>

              {/* ── SCHEDULE SLOTS BUILDER ── */}
              <div className="border-t pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>รายวิชาในตารางเรียน ({formData.scheduleData.length} วิชา)</span>
                  </h4>
                </div>

                {/* Add/Edit slot form box */}
                <div
                  className={`p-4 rounded-xl border transition-colors space-y-3 ${
                    editingSlotId
                      ? "border-amber-500/50 bg-amber-500/5 dark:bg-amber-500/10"
                      : "border-border bg-muted/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      {editingSlotId ? (
                        <>
                          <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                          <span className="text-amber-600 dark:text-amber-400 font-bold">
                            กำลังแก้ไขรายวิชา
                          </span>
                        </>
                      ) : (
                        <span>เพิ่มรายวิชาในตาราง</span>
                      )}
                    </p>
                    {editingSlotId && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEditSlot}
                        className="h-6 text-[11px] text-muted-foreground hover:text-foreground px-2"
                      >
                        ยกเลิกการแก้ไข
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                    <div>
                      <label className="text-[11px] text-muted-foreground mb-1 block">วันในสัปดาห์</label>
                      <select
                        value={newSlot.dayOfWeek}
                        onChange={(e) =>
                          setNewSlot({ ...newSlot, dayOfWeek: Number(e.target.value) })
                        }
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background"
                      >
                        {DAY_OPTIONS.map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] text-muted-foreground block">ช่วงเวลา / คาบเรียน</label>
                      </div>
                      <div className="space-y-1">
                        <select
                          value={
                            STANDARD_TIME_PRESETS.find(
                              (p) => p.start === newSlot.startTime && p.end === newSlot.endTime
                            )?.label || "custom"
                          }
                          onChange={(e) => {
                            const found = STANDARD_TIME_PRESETS.find((p) => p.label === e.target.value);
                            if (found && found.start) {
                              setNewSlot({
                                ...newSlot,
                                startTime: found.start,
                                endTime: found.end,
                              });
                            }
                          }}
                          className="w-full px-2 py-1 text-[11px] rounded-lg border border-border bg-background"
                        >
                          <option value="custom">⏱️ เลือกคาบมาตรฐาน...</option>
                          {STANDARD_TIME_PRESETS.filter((p) => p.start).map((p) => (
                            <option key={p.label} value={p.label}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                        <div className="grid grid-cols-2 gap-1">
                          <input
                            type="text"
                            value={newSlot.startTime}
                            onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                            placeholder="09.00"
                            title="เวลาเริ่ม (เช่น 09.00)"
                            className="w-full px-2 py-1.5 text-xs rounded-lg border border-border bg-background"
                          />
                          <input
                            type="text"
                            value={newSlot.endTime}
                            onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                            placeholder="11.30"
                            title="เวลาสิ้นสุด (เช่น 10.40 หรือ 11.30)"
                            className="w-full px-2 py-1.5 text-xs rounded-lg border border-border bg-background"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] text-muted-foreground mb-1 block">รหัสวิชา *</label>
                      <input
                        type="text"
                        value={newSlot.courseCode}
                        onChange={(e) => setNewSlot({ ...newSlot, courseCode: e.target.value })}
                        placeholder="เช่น 101 101, 000 102"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-muted-foreground mb-1 block">ชื่อวิชา *</label>
                      <input
                        type="text"
                        value={newSlot.courseName}
                        onChange={(e) => setNewSlot({ ...newSlot, courseName: e.target.value })}
                        placeholder="เช่น Buddhism and Science"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] text-muted-foreground block">อาจารย์ผู้สอน</label>
                        <span className="text-[10px] text-muted-foreground font-normal">
                          (หากมีหลายท่าน ใช้ / หรือ , คั่นได้ เช่น พระครูฯ, ดร. / ผศ. ดร.บุญเกิด)
                        </span>
                      </div>
                      <input
                        type="text"
                        value={newSlot.instructor}
                        onChange={(e) => setNewSlot({ ...newSlot, instructor: e.target.value })}
                        placeholder="เช่น พระครูศรีสิทธิบัณฑิต, ดร. / ผศ. ดร.บุญเกิด เจริญแนว*"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-muted-foreground mb-1 block">ห้องเรียน (ระบุเฉพาะเจาะจง)</label>
                      <input
                        type="text"
                        value={newSlot.room || ""}
                        onChange={(e) => setNewSlot({ ...newSlot, room: e.target.value })}
                        placeholder="เช่น D 220/2"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background"
                      />
                    </div>

                    <div className="flex items-end gap-1.5">
                      <Button
                        type="button"
                        onClick={handleAddSlot}
                        className={`w-full text-xs font-semibold ${
                          editingSlotId
                            ? "bg-amber-600 hover:bg-amber-700 text-white"
                            : ""
                        }`}
                      >
                        {editingSlotId ? (
                          <>
                            <Edit2 className="w-3.5 h-3.5 mr-1" />
                            บันทึกการแก้ไข
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            เพิ่มวิชานี้
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Slots list */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {formData.scheduleData.map((slot, idx) => {
                    const dayLabel = DAY_OPTIONS.find((d) => d.value === slot.dayOfWeek)?.label || "";
                    const isCurrentEditing = editingSlotId === slot.id;
                    return (
                      <div
                        key={slot.id || idx}
                        className={`flex items-center justify-between gap-3 p-3 rounded-xl border text-xs transition-colors ${
                          isCurrentEditing
                            ? "border-amber-500 bg-amber-500/10 shadow-xs"
                            : "border-border bg-card"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="font-bold px-2 py-0.5 rounded bg-muted text-[11px] w-24 text-center shrink-0 truncate">
                            {dayLabel.split(" ")[0]}
                          </span>
                          <span className="font-mono text-muted-foreground shrink-0">
                            {slot.startTime} - {slot.endTime}
                          </span>
                          <span className="font-mono font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10 shrink-0">
                            {slot.courseCode}
                          </span>
                          <span className="font-bold text-foreground truncate">{slot.courseName}</span>
                          {slot.instructor && (
                            <span className="text-muted-foreground truncate max-w-xs shrink-0">
                              ({slot.instructor})
                            </span>
                          )}
                          {slot.room && (
                            <span className="text-amber-700 dark:text-amber-300 font-medium shrink-0">
                              📍 {slot.room}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            title="แก้ไขวิชานี้"
                            onClick={() => handleStartEditSlot(slot)}
                            className={`h-7 w-7 p-0 ${
                              isCurrentEditing
                                ? "text-amber-600 hover:text-amber-700 bg-amber-500/20"
                                : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                            }`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            title="ลบวิชานี้"
                            onClick={() => handleRemoveSlot(slot.id)}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}

                  {formData.scheduleData.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4 italic">
                      ยังไม่มีวิชาในตารางเรียน กรุณากรอกแบบฟอร์มด้านบนแล้วกด &ldquo;เพิ่มวิชานี้&rdquo;
                    </p>
                  )}
                </div>
              </div>

              {/* Status Switch */}
              <div className="flex items-center justify-between border-t pt-4">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-foreground">เปิดแสดงตารางเรียนนี้</div>
                  <div className="text-[11px] text-muted-foreground">
                    นิสิตและบุคคลทั่วไปสามารถดูตารางเรียนนี้ได้บน Web Portal
                  </div>
                </div>
                <LiyonSwitch
                  checked={formData.isActive}
                  onCheckedChange={(val) => setFormData({ ...formData, isActive: val })}
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                  disabled={submitting}
                  className="text-xs"
                >
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={submitting} className="text-xs font-semibold">
                  {submitting ? "กำลังบันทึก..." : editingItem ? "บันทึกการแก้ไข" : "สร้างตารางเรียน"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION ── */}
      {isDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-background rounded-2xl max-w-md w-full p-6 space-y-4 border border-border shadow-2xl">
            <h3 className="font-bold text-lg text-foreground">ยืนยันการลบตารางเรียน?</h3>
            <p className="text-xs text-muted-foreground">
              คุณต้องการลบตารางเรียน &ldquo;{isDeleting.titleTh}&rdquo; ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleting(null)}
                disabled={submitting}
                className="text-xs"
              >
                ยกเลิก
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={submitting}
                className="text-xs font-semibold"
              >
                {submitting ? "กำลังลบ..." : "ยืนยันลบ"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── QUICK CREATE CURRICULUM MODAL ── */}
      {isQuickCurrOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-background rounded-2xl max-w-md w-full p-6 space-y-4 border border-border shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-primary" />
                <span>เพิ่มหลักสูตรใหม่ด่วน</span>
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsQuickCurrOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleQuickCreateCurriculum} className="space-y-4 text-xs">
              <LiyonField label="ชื่อหลักสูตร (ไทย) *">
                <input
                  type="text"
                  value={quickCurrForm.nameTh}
                  onChange={(e) => setQuickCurrForm({ ...quickCurrForm, nameTh: e.target.value })}
                  placeholder="เช่น พุทธศาสตรบัณฑิต สาขาวิชาสันติศึกษา"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background"
                  required
                />
              </LiyonField>

              <LiyonField label="ชื่อหลักสูตร (English)">
                <input
                  type="text"
                  value={quickCurrForm.nameEn}
                  onChange={(e) => setQuickCurrForm({ ...quickCurrForm, nameEn: e.target.value })}
                  placeholder="e.g. Bachelor of Arts in Peace Studies"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background"
                />
              </LiyonField>

              <div className="grid grid-cols-2 gap-3">
                <LiyonField label="ระดับการศึกษา *">
                  <select
                    value={quickCurrForm.degree}
                    onChange={(e) =>
                      setQuickCurrForm({ ...quickCurrForm, degree: e.target.value as any })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background"
                  >
                    <option value="BACHELOR">ปริญญาตรี (Bachelor)</option>
                    <option value="MASTER">ปริญญาโท (Master)</option>
                    <option value="DOCTORATE">ปริญญาเอก (Doctorate)</option>
                    <option value="CERTIFICATE">ประกาศนียบัตร (Certificate)</option>
                  </select>
                </LiyonField>

                <LiyonField label="สังกัดภาควิชา/สาขา">
                  <select
                    value={quickCurrForm.departmentId}
                    onChange={(e) =>
                      setQuickCurrForm({ ...quickCurrForm, departmentId: e.target.value })
                    }
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

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsQuickCurrOpen(false)}
                  disabled={quickSubmitting}
                  className="text-xs"
                >
                  ยกเลิก
                </Button>
                <Button type="submit" size="sm" disabled={quickSubmitting} className="text-xs font-semibold">
                  {quickSubmitting ? "กำลังบันทึก..." : "สร้างหลักสูตร"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── QUICK CREATE DEPARTMENT MODAL ── */}
      {isQuickDeptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-background rounded-2xl max-w-md w-full p-6 space-y-4 border border-border shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                <span>เพิ่มภาควิชา / สาขาวิชาใหม่ด่วน</span>
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsQuickDeptOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleQuickCreateDepartment} className="space-y-4 text-xs">
              <LiyonField label="ชื่อภาควิชา / สาขาวิชา (ไทย) *">
                <input
                  type="text"
                  value={quickDeptForm.nameTh}
                  onChange={(e) => setQuickDeptForm({ ...quickDeptForm, nameTh: e.target.value })}
                  placeholder="เช่น สาขาวิชาสันติศึกษา หรือ ภาควิชาปรัชญา"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background"
                  required
                />
              </LiyonField>

              <LiyonField label="ชื่อภาษาอังกฤษ (English)">
                <input
                  type="text"
                  value={quickDeptForm.nameEn}
                  onChange={(e) => setQuickDeptForm({ ...quickDeptForm, nameEn: e.target.value })}
                  placeholder="e.g. Department of Peace Studies"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background"
                />
              </LiyonField>

              <LiyonField label="ประเภทหน่วยงาน">
                <select
                  value={quickDeptForm.type}
                  onChange={(e) =>
                    setQuickDeptForm({ ...quickDeptForm, type: e.target.value as any })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background"
                >
                  <option value="DEPARTMENT">ภาควิชา (Department)</option>
                  <option value="PROGRAM">สาขาวิชา / หลักสูตร (Program)</option>
                  <option value="DIVISION">ฝ่าย / หน่วยงาน (Division)</option>
                </select>
              </LiyonField>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsQuickDeptOpen(false)}
                  disabled={quickSubmitting}
                  className="text-xs"
                >
                  ยกเลิก
                </Button>
                <Button type="submit" size="sm" disabled={quickSubmitting} className="text-xs font-semibold">
                  {quickSubmitting ? "กำลังบันทึก..." : "สร้างสาขาวิชา"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
