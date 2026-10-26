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
  Settings,
  BookOpen,
} from "lucide-react";
import { useT } from "@/shared/lib/i18n/client";
import {
  LiyonCard,
  LiyonField,
  LiyonSwitch,
  StatusPill,
  LiyonDialog,
  LiyonDialogHeader,
  LiyonDialogBody,
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
  type TimetablePeriodConfig,
  DEFAULT_TIMETABLE_PERIODS,
} from "@/features/curriculum/_components/timetable-grid-view";
import { TimetablePeriodsEditor } from "@/features/curriculum/_components/timetable-periods-editor";
import type { Curriculum, Department, MasterCourse } from "@/generated/prisma";

type MasterCourseWithRelations = MasterCourse & {
  department?: Department | null;
  curriculum?: Curriculum | null;
};

type TimetableWithRelations = TimetableData & {
  curriculum?: Curriculum | null;
  department?: Department | null;
  isActive: boolean;
  orderIndex: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

interface TimetablesAdminClientProps {
  initialItems: TimetableWithRelations[];
  curriculums: Curriculum[];
  departments: Department[];
  initialPeriods?: TimetablePeriodConfig[];
  masterCourses?: MasterCourseWithRelations[];
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
  initialPeriods,
  masterCourses = [],
}: TimetablesAdminClientProps) {
  const _t = useT();
  const [items, setItems] = React.useState<TimetableWithRelations[]>(initialItems);
  const [curriculums, setCurriculums] = React.useState<Curriculum[]>(initialCurriculums);
  const [departments, setDepartments] = React.useState<Department[]>(initialDepartments);
  const [periods, setPeriods] = React.useState<TimetablePeriodConfig[]>(
    initialPeriods && initialPeriods.length > 0 ? initialPeriods : DEFAULT_TIMETABLE_PERIODS
  );
  const [isPeriodSettingsOpen, setIsPeriodSettingsOpen] = React.useState(false);

  const dynamicTimePresets = React.useMemo(() => {
    const configured = periods
      .filter((p) => p.type === "CLASS")
      .map((p) => ({
        label: `${p.labelTh}${p.subLabelTh ? ` - ${p.subLabelTh}` : ""} (${p.startTime} - ${p.endTime})`,
        start: p.startTime,
        end: p.endTime,
      }));
    const combined = [...configured];
    STANDARD_TIME_PRESETS.filter((p) => p.start).forEach((std) => {
      if (!combined.some((c) => c.start === std.start && c.end === std.end)) {
        combined.push(std);
      }
    });
    return combined;
  }, [periods]);
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
    credits: 3,
    notes: "",
  });

  // Course Catalog (MasterCourse) picker & autocomplete states
  const [catalogSearch, setCatalogSearch] = React.useState("");
  const [isCatalogOpen, setIsCatalogOpen] = React.useState(false);
  const [catalogMatchOnly, setCatalogMatchOnly] = React.useState(false);
  const [selectedCatalogCourse, setSelectedCatalogCourse] =
    React.useState<MasterCourseWithRelations | null>(null);
  const [activeAutocompleteField, setActiveAutocompleteField] = React.useState<
    "code" | "name" | null
  >(null);

  const matchAndSortCourses = React.useCallback(
    (query: string, filterByContext: boolean) => {
      const activeCourses = masterCourses.filter((c) => c.isActive !== false);
      const q = query.trim().toLowerCase();

      const contextFiltered = filterByContext
        ? activeCourses.filter((c) => {
            if (formData.curriculumId && c.curriculumId === formData.curriculumId) return true;
            if (formData.departmentId && c.departmentId === formData.departmentId) return true;
            return !formData.curriculumId && !formData.departmentId;
          })
        : activeCourses;

      const baseList =
        filterByContext && contextFiltered.length === 0 ? activeCourses : contextFiltered;

      const searched = q
        ? baseList.filter(
            (c) =>
              c.courseCode.toLowerCase().includes(q) ||
              c.courseCode.replace(/\s+/g, "").toLowerCase().includes(q.replace(/\s+/g, "")) ||
              c.courseNameTh.toLowerCase().includes(q) ||
              (c.courseNameEn && c.courseNameEn.toLowerCase().includes(q)) ||
              (c.instructor && c.instructor.toLowerCase().includes(q)) ||
              (c.department?.nameTh && c.department.nameTh.toLowerCase().includes(q))
          )
        : baseList;

      return [...searched].sort((a, b) => {
        const aScore =
          (formData.curriculumId && a.curriculumId === formData.curriculumId ? 2 : 0) +
          (formData.departmentId && a.departmentId === formData.departmentId ? 1 : 0);
        const bScore =
          (formData.curriculumId && b.curriculumId === formData.curriculumId ? 2 : 0) +
          (formData.departmentId && b.departmentId === formData.departmentId ? 1 : 0);
        if (bScore !== aScore) return bScore - aScore;
        return a.courseCode.localeCompare(b.courseCode);
      });
    },
    [masterCourses, formData.curriculumId, formData.departmentId]
  );

  const catalogResults = React.useMemo(
    () => matchAndSortCourses(catalogSearch, catalogMatchOnly),
    [matchAndSortCourses, catalogSearch, catalogMatchOnly]
  );

  const inlineSuggestions = React.useMemo(() => {
    if (!activeAutocompleteField) return [];
    const rawQuery =
      activeAutocompleteField === "code"
        ? newSlot.courseCode || ""
        : newSlot.courseName || "";
    if (!rawQuery.trim()) return [];
    return matchAndSortCourses(rawQuery, false).slice(0, 8);
  }, [activeAutocompleteField, newSlot.courseCode, newSlot.courseName, matchAndSortCourses]);

  const handleSelectCatalogCourse = (course: MasterCourseWithRelations) => {
    const formattedCourseName =
      course.courseNameEn &&
      course.courseNameEn.trim() !== "" &&
      course.courseNameEn.trim() !== course.courseNameTh.trim()
        ? `${course.courseNameTh.trim()} (${course.courseNameEn.trim()})`
        : course.courseNameTh.trim();

    setNewSlot((prev) => ({
      ...prev,
      courseCode: course.courseCode,
      courseName: formattedCourseName,
      instructor: course.instructor?.trim() || prev.instructor || "",
      credits: course.credits ?? prev.credits ?? 3,
      notes: prev.notes?.trim() ? prev.notes : course.notes?.trim() || "",
    }));
    setSelectedCatalogCourse(course);
    setCatalogSearch("");
    setIsCatalogOpen(false);
    setActiveAutocompleteField(null);
    toast.success(`ดึงข้อมูลวิชา "${course.courseCode} ${course.courseNameTh}" จากทะเบียนรายวิชาแล้ว`);
  };

  const openCreateDialog = () => {
    setEditingItem(null);
    setEditingSlotId(null);
    setSelectedCatalogCourse(null);
    setCatalogSearch("");
    setIsCatalogOpen(false);
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
    setSelectedCatalogCourse(null);
    setCatalogSearch("");
    setIsCatalogOpen(false);
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
                credits: newSlot.credits ? Number(newSlot.credits) : null,
                notes: newSlot.notes?.trim() || null,
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
        credits: newSlot.credits ? Number(newSlot.credits) : null,
        notes: newSlot.notes?.trim() || null,
      };

      setFormData((prev) => ({
        ...prev,
        scheduleData: [...prev.scheduleData, slotToAdd],
      }));

      toast.success("เพิ่มวิชาในตารางเรียบร้อย");
    }

    // Reset slot input
    setSelectedCatalogCourse(null);
    setCatalogSearch("");
    setNewSlot((prev) => ({
      ...prev,
      courseCode: "",
      courseName: "",
      instructor: "",
      room: "",
      credits: 3,
      notes: "",
    }));
  };

  const handleStartEditSlot = (slot: TimetableSlot) => {
    setEditingSlotId(slot.id);
    const matchedMaster =
      masterCourses.find(
        (c) => c.courseCode.trim().toLowerCase() === slot.courseCode.trim().toLowerCase()
      ) || null;
    setSelectedCatalogCourse(matchedMaster);
    setNewSlot({
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      courseCode: slot.courseCode,
      courseName: slot.courseName,
      instructor: slot.instructor || "",
      room: slot.room || "",
      periodLabel: slot.periodLabel || "เช้า",
      credits: slot.credits ?? matchedMaster?.credits ?? 3,
      notes: slot.notes || "",
    });
  };

  const handleCancelEditSlot = () => {
    setEditingSlotId(null);
    setSelectedCatalogCourse(null);
    setCatalogSearch("");
    setNewSlot((prev) => ({
      ...prev,
      courseCode: "",
      courseName: "",
      instructor: "",
      room: "",
      credits: 3,
      notes: "",
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
      setCurriculums((prev) => [created as Curriculum, ...prev]);
      setFormData((prev) => ({
        ...prev,
        curriculumId: created.id,
        departmentId: created.departmentId || prev.departmentId,
      }));
      toast.success(`สร้างหลักสูตร "${created.nameTh}" เรียบร้อยแล้ว`);
      setIsQuickCurrOpen(false);
      setQuickCurrForm({ nameTh: "", nameEn: "", degree: "BACHELOR", departmentId: "" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "ไม่สามารถสร้างหลักสูตรได้");
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
      setDepartments((prev) => [created as Department, ...prev]);
      setFormData((prev) => ({
        ...prev,
        departmentId: created.id,
      }));
      toast.success(`สร้างภาควิชา/สาขาวิชา "${created.nameTh}" เรียบร้อยแล้ว`);
      setIsQuickDeptOpen(false);
      setQuickDeptForm({ nameTh: "", nameEn: "", type: "DEPARTMENT" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "ไม่สามารถสร้างภาควิชาได้");
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
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
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
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "ไม่สามารถลบตารางเรียนได้");
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
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
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
          <Link href="/curriculum/courses">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              <span>ทะเบียนรายวิชา ({masterCourses.length})</span>
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPeriodSettingsOpen(true)}
            className="gap-1.5 text-xs font-semibold border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>ตั้งค่าคาบเรียนและเวลา</span>
          </Button>
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
            <TimetableGridView timetable={previewItem} periods={periods} showHeaderActions={true} />
          </LiyonDialogBody>
        </LiyonDialog>
      )}

      {/* ── PERIODS & TIMES SETTINGS MODAL ── */}
      {isPeriodSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-background rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-border overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-foreground">
                    ตั้งค่าคาบเรียนและเวลา (Timetable Periods & Times)
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    กำหนดคอลัมน์คาบเรียน เวลาเริ่ม-สิ้นสุด และช่วงพักกลางวันสำหรับแสดงผลตารางเรียน
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/curriculum/timetables/periods">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs cursor-pointer">
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>เปิดหน้าตั้งค่าแบบเต็มจอ</span>
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPeriodSettingsOpen(false)}
                  className="h-8 w-8 p-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <TimetablePeriodsEditor
                initialPeriods={periods}
                onSaved={(updated) => {
                  setPeriods(updated);
                  setIsPeriodSettingsOpen(false);
                }}
                onCancel={() => setIsPeriodSettingsOpen(false)}
              />
            </div>
          </div>
        </div>
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
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>รายวิชาในตารางเรียน ({formData.scheduleData.length} วิชา)</span>
                  </h4>
                  <Link
                    href="/curriculum/courses"
                    target="_blank"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/15 transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>จัดการทะเบียนรายวิชา ({masterCourses.length} วิชา)</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                {/* Add/Edit slot form box */}
                <div
                  className={`p-4 rounded-xl border transition-colors space-y-3.5 ${
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

                  {/* ── COURSE CATALOG AUTOCOMPLETE / PICKER ── */}
                  {masterCourses.length > 0 && (
                    <div className="p-3 rounded-xl border border-primary/25 bg-primary/5 space-y-2 relative">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="text-xs font-bold text-primary flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>เลือกจากทะเบียนรายวิชา (Course Catalog Autocomplete)</span>
                        </label>
                        <div className="flex items-center gap-2">
                          {(formData.curriculumId || formData.departmentId) && (
                            <button
                              type="button"
                              onClick={() => setCatalogMatchOnly((prev) => !prev)}
                              className={`text-[11px] px-2 py-0.5 rounded-md border font-medium transition-colors cursor-pointer ${
                                catalogMatchOnly
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background text-muted-foreground border-border hover:text-foreground"
                              }`}
                            >
                              {catalogMatchOnly ? "✓ เฉพาะหลักสูตร/สาขานี้" : "แสดงทุกสาขา (จัดลำดับสาขาตรงก่อน)"}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="relative">
                        <div className="flex gap-1.5">
                          <div className="relative flex-1">
                            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={catalogSearch}
                              onFocus={() => setIsCatalogOpen(true)}
                              onChange={(e) => {
                                setCatalogSearch(e.target.value);
                                setIsCatalogOpen(true);
                              }}
                              placeholder="พิมพ์ค้นหารหัสวิชา (เช่น 000 102, 108) หรือชื่อวิชา (ไทย/อังกฤษ) หรืออาจารย์ผู้สอน..."
                              className="w-full pl-8 pr-8 py-1.5 text-xs rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:outline-hidden"
                            />
                            {catalogSearch && (
                              <button
                                type="button"
                                onClick={() => setCatalogSearch("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsCatalogOpen((prev) => !prev)}
                            className="text-xs px-3 shrink-0 cursor-pointer"
                          >
                            {isCatalogOpen ? "ปิดรายการ" : `ดูรายวิชา (${catalogResults.length})`}
                          </Button>
                        </div>

                        {isCatalogOpen && (
                          <div className="absolute z-30 left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-xl border border-border bg-background shadow-xl divide-y divide-border/60">
                            {catalogResults.length > 0 ? (
                              catalogResults.slice(0, 30).map((course) => {
                                const isCurrMatch =
                                  Boolean(formData.curriculumId) &&
                                  course.curriculumId === formData.curriculumId;
                                const isDeptMatch =
                                  Boolean(formData.departmentId) &&
                                  course.departmentId === formData.departmentId;
                                const degreeBadge =
                                  course.degreeLevel === "BACHELOR"
                                    ? "ป.ตรี"
                                    : course.degreeLevel === "MASTER"
                                    ? "ป.โท"
                                    : course.degreeLevel === "DOCTORATE"
                                    ? "ป.เอก"
                                    : course.degreeLevel;

                                return (
                                  <button
                                    key={course.id}
                                    type="button"
                                    onClick={() => handleSelectCatalogCourse(course)}
                                    className="w-full text-left px-3 py-2 hover:bg-primary/10 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 cursor-pointer"
                                  >
                                    <div className="min-w-0 flex-1 space-y-0.5">
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="font-mono font-bold text-xs px-1.5 py-0.5 rounded bg-primary/15 text-primary shrink-0">
                                          {course.courseCode}
                                        </span>
                                        <span className="font-bold text-xs text-foreground truncate">
                                          {course.courseNameTh}
                                        </span>
                                        {course.courseNameEn &&
                                          course.courseNameEn !== course.courseNameTh && (
                                            <span className="text-[11px] text-muted-foreground truncate">
                                              ({course.courseNameEn})
                                            </span>
                                          )}
                                      </div>
                                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                                        {course.instructor && (
                                          <span className="truncate max-w-xs">
                                            👨‍🏫 {course.instructor}
                                          </span>
                                        )}
                                        {course.department?.nameTh && (
                                          <span className="truncate">
                                            🏛️ {course.department.nameTh}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {(isCurrMatch || isDeptMatch) && (
                                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                                          ตรงหลักสูตร/สาขา
                                        </span>
                                      )}
                                      <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-semibold">
                                        {course.credits} นก.
                                      </span>
                                      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] font-semibold">
                                        {degreeBadge}
                                      </span>
                                    </div>
                                  </button>
                                );
                              })
                            ) : (
                              <div className="p-4 text-center text-xs text-muted-foreground">
                                ไม่พบรายวิชาที่ตรงกับ &ldquo;{catalogSearch}&rdquo; ในทะเบียนรายวิชา
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {selectedCatalogCourse && (
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-muted-foreground border-t border-primary/15">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-primary">
                              ✓ ดึงจากทะเบียนรายวิชา:
                            </span>
                            <span className="font-mono font-bold text-foreground">
                              {selectedCatalogCourse.courseCode}
                            </span>
                            <span>• {selectedCatalogCourse.credits} หน่วยกิต</span>
                            <span>
                              • ระดับ{" "}
                              {selectedCatalogCourse.degreeLevel === "BACHELOR"
                                ? "ปริญญาตรี"
                                : selectedCatalogCourse.degreeLevel === "MASTER"
                                ? "ปริญญาโท"
                                : "ปริญญาเอก"}
                            </span>
                            {selectedCatalogCourse.department?.nameTh && (
                              <span>• {selectedCatalogCourse.department.nameTh}</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedCatalogCourse(null)}
                            className="text-[10px] text-muted-foreground hover:text-foreground underline cursor-pointer"
                          >
                            ล้างสถานะ
                          </button>
                        </div>
                      )}
                    </div>
                  )}

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
                            dynamicTimePresets.find(
                              (p) => p.start === newSlot.startTime && p.end === newSlot.endTime
                            )?.label || "custom"
                          }
                          onChange={(e) => {
                            const found = dynamicTimePresets.find((p) => p.label === e.target.value);
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
                          {dynamicTimePresets.map((p) => (
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

                    <div className="relative">
                      <label className="text-[11px] text-muted-foreground mb-1 block">
                        รหัสวิชา * <span className="text-[10px] text-primary">(พิมพ์เพื่อค้นหาอัตโนมัติ)</span>
                      </label>
                      <input
                        type="text"
                        value={newSlot.courseCode}
                        onFocus={() => setActiveAutocompleteField("code")}
                        onBlur={() => setTimeout(() => setActiveAutocompleteField(null), 180)}
                        onChange={(e) => {
                          setNewSlot({ ...newSlot, courseCode: e.target.value });
                          setActiveAutocompleteField("code");
                        }}
                        placeholder="เช่น 101 101, 000 102"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background"
                      />
                      {activeAutocompleteField === "code" && inlineSuggestions.length > 0 && (
                        <div className="absolute z-30 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-background shadow-lg divide-y divide-border/50">
                          {inlineSuggestions.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelectCatalogCourse(c);
                              }}
                              className="w-full text-left px-2.5 py-1.5 hover:bg-primary/10 text-xs flex items-center justify-between gap-2 cursor-pointer"
                            >
                              <div className="truncate">
                                <span className="font-mono font-bold text-primary mr-1.5">
                                  {c.courseCode}
                                </span>
                                <span className="text-foreground">{c.courseNameTh}</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground shrink-0">
                                {c.credits} นก.
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <label className="text-[11px] text-muted-foreground mb-1 block">
                        ชื่อวิชา * <span className="text-[10px] text-primary">(พิมพ์เพื่อค้นหาอัตโนมัติ)</span>
                      </label>
                      <input
                        type="text"
                        value={newSlot.courseName}
                        onFocus={() => setActiveAutocompleteField("name")}
                        onBlur={() => setTimeout(() => setActiveAutocompleteField(null), 180)}
                        onChange={(e) => {
                          setNewSlot({ ...newSlot, courseName: e.target.value });
                          setActiveAutocompleteField("name");
                        }}
                        placeholder="เช่น Buddhism and Science"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background"
                      />
                      {activeAutocompleteField === "name" && inlineSuggestions.length > 0 && (
                        <div className="absolute z-30 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-background shadow-lg divide-y divide-border/50">
                          {inlineSuggestions.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelectCatalogCourse(c);
                              }}
                              className="w-full text-left px-2.5 py-1.5 hover:bg-primary/10 text-xs flex items-center justify-between gap-2 cursor-pointer"
                            >
                              <div className="truncate">
                                <span className="font-mono font-bold text-primary mr-1.5">
                                  {c.courseCode}
                                </span>
                                <span className="text-foreground">{c.courseNameTh}</span>
                                {c.courseNameEn && c.courseNameEn !== c.courseNameTh && (
                                  <span className="text-muted-foreground ml-1">
                                    ({c.courseNameEn})
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground shrink-0">
                                {c.credits} นก.
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
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

                    <div>
                      <label className="text-[11px] text-muted-foreground mb-1 block">หมายเหตุรายวิชา (Notes)</label>
                      <input
                        type="text"
                        value={newSlot.notes || ""}
                        onChange={(e) => setNewSlot({ ...newSlot, notes: e.target.value })}
                        placeholder="เช่น วิชาบังคับ / เรียนร่วม"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background"
                      />
                    </div>

                    <div className="sm:col-span-2 md:col-span-4 flex justify-end pt-1">
                      <Button
                        type="button"
                        onClick={handleAddSlot}
                        className={`text-xs font-semibold px-5 ${
                          editingSlotId
                            ? "bg-amber-600 hover:bg-amber-700 text-white"
                            : ""
                        }`}
                      >
                        {editingSlotId ? (
                          <>
                            <Edit2 className="w-3.5 h-3.5 mr-1" />
                            บันทึกการแก้ไขรายวิชา
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            เพิ่มวิชานี้ลงตารางเรียน
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
                          {slot.credits && (
                            <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-semibold shrink-0">
                              {slot.credits} นก.
                            </span>
                          )}
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
                      setQuickCurrForm({ ...quickCurrForm, degree: e.target.value as typeof quickCurrForm.degree })
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
                    setQuickDeptForm({ ...quickDeptForm, type: e.target.value as typeof quickDeptForm.type })
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
