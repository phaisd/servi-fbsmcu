"use client";

import { useState, useTransition, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Users,
  BookOpen,
  Building,
  Search,
  ExternalLink,
  Phone,
  Mail,
  Plus,
  Pencil,
  Trash2,
  GraduationCap,
  UserCheck,
  Download,
  Upload,
  FileSpreadsheet,
  FileJson,
  Check,
  AlertCircle,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Camera,
  CheckCircle2,
  Award,
  MapPin,
  Filter,
} from "lucide-react";
import { ExecutiveRoleManagerDialog } from "./executive-role-manager-dialog";
import { useT } from "@/shared/lib/i18n/client";
import {
  LiyonCard,
  LiyonDialog,
  LiyonDialogHeader,
  LiyonDialogBody,
  LiyonDialogFooter,
  LiyonDialogCloseButton,
  LiyonField,
  LiyonSelect,
} from "@/shared/components/liyon";
import { Button } from "@/components/ui/button";
import {
  createPersonnelAction,
  uploadPersonnelImageAction,
  uploadPersonnelAttachmentAction,
  syncTeacherCoursesFromTimetablesAction,
  updatePersonnelAction,
  updatePersonnelOrderAction,
  reorderPersonnelBatchAction,
  deletePersonnelAction,
  createResearchPublicationAction,
  deleteResearchPublicationAction,
  importPersonnelBatchAction,
  updatePersonnelPortalConfigAction,
  type ImportPersonnelItem,
} from "@/features/personnel/actions";
import {
  type TeachingCourse,
  type DegreeLevel,
  parseTeachingExperiences,
  formatTeachingCoursesToText,
  formatDegreeLevelLabel,
  getDegreeLevelColor,
  normalizeCourseYear,
  MCU_STANDARD_COURSES,
  getCourseUniqueKey,
  upsertTeachingCourses,
} from "@/features/personnel/teaching-courses";
import {
  formatPersonnelName,
  type AcademicPositionItem,
  parseAcademicPositions,
  serializeExperiencesWithPositions,
  detectAttachmentType,
} from "@/features/personnel";
import type { Personnel, Department, ResearchPublication } from "@/generated/prisma";

type PersonnelWithRelations = Personnel & {
  department: Department | null;
  researchPublications?: ResearchPublication[];
};

interface Props {
  initialItems: PersonnelWithRelations[];
  departmentList: Department[];
  canManage: boolean;
  initialPublicationYearsLimit?: number;
  initialShowAllAffiliationsTab?: boolean;
}

export function PersonnelAdminClient({
  initialItems,
  departmentList,
  canManage,
  initialPublicationYearsLimit = 5,
  initialShowAllAffiliationsTab = true,
}: Props) {
  const t = useT();
  const router = useRouter();
  const [items, setItems] = useState<PersonnelWithRelations[]>(initialItems);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [deptFilter, setDeptFilter] = useState<string>("ALL");
  const [isPending, startTransition] = useTransition();
  const [pubYearsLimit, setPubYearsLimit] = useState<number>(initialPublicationYearsLimit);
  const [showAllAffiliationsTab, setShowAllAffiliationsTab] = useState<boolean>(initialShowAllAffiliationsTab);
  const [isSavingPortalConfig, setIsSavingPortalConfig] = useState(false);
  const [executiveDialogOpen, setExecutiveDialogOpen] = useState(false);

  const handleToggleShowAllAffiliations = async (enabled: boolean) => {
    setShowAllAffiliationsTab(enabled);
    try {
      setIsSavingPortalConfig(true);
      await updatePersonnelPortalConfigAction({
        publicationYearsLimit: pubYearsLimit,
        showAllAffiliationsTab: enabled,
      });
      toast.success(
        enabled
          ? "เปิดแสดงปุ่ม 'ทุกสังกัด' บนหน้าเว็บไซต์ Portal เรียบร้อยแล้ว"
          : "ปิดการแสดงปุ่ม 'ทุกสังกัด' เรียบร้อยแล้ว (หน้า Portal จะเริ่มที่แท็บผู้บริหารอัตโนมัติ)"
      );
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึกตั้งค่า");
    } finally {
      setIsSavingPortalConfig(false);
    }
  };

  const handleSavePortalYearsLimit = async (nextLimit: number) => {
    const clean = Math.max(0, Math.min(50, Math.floor(Number(nextLimit) || 0)));
    setPubYearsLimit(clean);
    try {
      setIsSavingPortalConfig(true);
      await updatePersonnelPortalConfigAction({
        publicationYearsLimit: clean,
        showAllAffiliationsTab,
      });
      if (clean === 0) {
        toast.success("บันทึกตั้งค่า: แสดงผลงานวิจัยทุกปี พ.ศ. ทั้งหมดบนหน้า Portal เรียบร้อยแล้ว");
      } else {
        const minYr = 2569 - clean + 1;
        toast.success(`บันทึกตั้งค่า: แสดงผลงานวิจัยย้อนหลัง ${clean} ปี (พ.ศ. 2569 ถึง พ.ศ. ${minYr}) เรียบร้อยแล้ว`);
      }
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึกตั้งค่า");
    } finally {
      setIsSavingPortalConfig(false);
    }
  };

  // Personnel Modal Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PersonnelWithRelations | null>(null);
  const [activeTab, setActiveTab] = useState<"general" | "academic" | "teaching" | "contact" | "research">("general");

  // Form Fields
  const [formFirstNameTh, setFormFirstNameTh] = useState("");
  const [formLastNameTh, setFormLastNameTh] = useState("");
  const [formFirstNameEn, setFormFirstNameEn] = useState("");
  const [formLastNameEn, setFormLastNameEn] = useState("");
  const [formPositionTh, setFormPositionTh] = useState("");
  const [formPositionEn, setFormPositionEn] = useState("");
  const [formAcademicPosition, setFormAcademicPosition] = useState("");
  const [formAcademicPositionEn, setFormAcademicPositionEn] = useState("");
  const [formTitlePlacement, setFormTitlePlacement] = useState<"PREFIX" | "SUFFIX">("PREFIX");
  const [formType, setFormType] = useState<"EXECUTIVE" | "ACADEMIC" | "SUPPORT" | "SPECIAL">("ACADEMIC");
  const [formDepartmentId, setFormDepartmentId] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhoneNumber, setFormPhoneNumber] = useState("");
  const [formContactInfo, setFormContactInfo] = useState("");
  const [formOfficeLocation, setFormOfficeLocation] = useState("");
  const [formGoogleScholarUrl, setFormGoogleScholarUrl] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formEducationTh, setFormEducationTh] = useState("");
  const [formExperiencesTh, setFormExperiencesTh] = useState("");
  const [formBioTh, setFormBioTh] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formOrderIndex, setFormOrderIndex] = useState(0);

  const previewFormattedName = useMemo(() => {
    return formatPersonnelName({
      firstNameTh: formFirstNameTh || "พระราชญาณวชิรเวที",
      lastNameTh: formLastNameTh,
      academicPosition: formAcademicPosition || "ผศ.ดร.",
      titlePlacement: formTitlePlacement,
    });
  }, [formFirstNameTh, formLastNameTh, formAcademicPosition, formTitlePlacement]);

    // ─── Teaching Courses State ──────────────────────────────
  const [editingTeachingCourses, setEditingTeachingCourses] = useState<TeachingCourse[]>([]);
  const [isSyncingCourses, setIsSyncingCourses] = useState(false);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  // Teaching Courses Filter States
  const [courseFilterLevel, setCourseFilterLevel] = useState<"ALL" | DegreeLevel>("ALL");
  const [courseFilterYear, setCourseFilterYear] = useState<string>("ALL");
  const [courseFilterSearch, setCourseFilterSearch] = useState<string>("");

  const availableCourseYears = useMemo(() => {
    const set = new Set<string>();
    for (const c of editingTeachingCourses) {
      const norm = normalizeCourseYear(c.year) || c.year?.trim() || "";
      if (norm) set.add(norm);
    }
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [editingTeachingCourses]);

  const filteredTeachingCourses = useMemo(() => {
    return editingTeachingCourses.filter((c) => {
      // 1. Level filter
      if (courseFilterLevel !== "ALL" && c.level !== courseFilterLevel) {
        return false;
      }
      // 2. Year filter
      if (courseFilterYear !== "ALL") {
        const norm = normalizeCourseYear(c.year) || c.year?.trim();
        if (norm !== courseFilterYear) {
          return false;
        }
      }
      // 3. Search query filter
      if (courseFilterSearch.trim()) {
        const q = courseFilterSearch.trim().toLowerCase();
        const codeMatch = c.courseCode.toLowerCase().includes(q);
        const nameThMatch = c.courseNameTh.toLowerCase().includes(q);
        const nameEnMatch = c.courseNameEn?.toLowerCase().includes(q) || false;
        const progMatch = c.programTh?.toLowerCase().includes(q) || false;
        const roleMatch = c.role?.toLowerCase().includes(q) || false;
        if (!codeMatch && !nameThMatch && !nameEnMatch && !progMatch && !roleMatch) {
          return false;
        }
      }
      return true;
    });
  }, [editingTeachingCourses, courseFilterLevel, courseFilterYear, courseFilterSearch]);

  // Course Form States
  const [cCode, setCCode] = useState("");
  const [cNameTh, setCNameTh] = useState("");
  const [cNameEn, setCNameEn] = useState("");
  const [cYear, setCYear] = useState("2569");
  const [cSemester, setCSemester] = useState("1");
  const [cLevel, setCLevel] = useState<DegreeLevel>("BACHELOR");
  const [cCredits, setCCredits] = useState(3);
  const [cProgramTh, setCProgramTh] = useState("หลักสูตรพุทธศาสตรบัณฑิต (พธ.บ.) สาขาวิชาพระพุทธศาสนา");
  const [cRole, setCRole] = useState("อาจารย์ผู้สอนประจำวิชา");
  const [cDescription, setCDescription] = useState("");

  const resetCourseForm = () => {
    setEditingCourseId(null);
    setCCode("");
    setCNameTh("");
    setCNameEn("");
    setCYear("2569");
    setCSemester("1");
    setCLevel("BACHELOR");
    setCCredits(3);
    setCProgramTh("หลักสูตรพุทธศาสตรบัณฑิต (พธ.บ.) สาขาวิชาพระพุทธศาสนา");
    setCRole("อาจารย์ผู้สอนประจำวิชา");
    setCDescription("");
    setShowCourseForm(false);
  };

  const handleOpenAddCourse = () => {
    resetCourseForm();
    setShowCourseForm(true);
  };

  const handleEditCourse = (course: TeachingCourse) => {
    setEditingCourseId(course.id);
    setCCode(course.courseCode);
    setCNameTh(course.courseNameTh);
    setCNameEn(course.courseNameEn || "");
    setCYear(course.year);
    setCSemester(course.semester);
    setCLevel(course.level);
    setCCredits(course.credits);
    setCProgramTh(course.programTh);
    setCRole(course.role);
    setCDescription(course.description || "");
    setShowCourseForm(true);
  };

  const handleSaveCourse = () => {
    if (!cCode.trim() || !cNameTh.trim()) {
      toast.error("กรุณาระบุรหัสวิชาและชื่อรายวิชา");
      return;
    }

    const courseItem: TeachingCourse = {
      id: editingCourseId || `tc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      year: cYear.trim() || "2569",
      semester: cSemester.trim() || "1",
      level: cLevel,
      courseCode: cCode.trim(),
      courseNameTh: cNameTh.trim(),
      courseNameEn: cNameEn.trim() || undefined,
      credits: Number(cCredits) || 3,
      programTh: cProgramTh.trim() || "หลักสูตรพุทธศาสตรบัณฑิต",
      role: cRole.trim() || "อาจารย์ผู้สอนประจำวิชา",
      description: cDescription.trim() || undefined,
    };

    let updated: TeachingCourse[];
    if (editingCourseId) {
      updated = editingTeachingCourses.map((c) => (c.id === editingCourseId ? courseItem : c));
      toast.success("แก้ไขข้อมูลรายวิชาเรียบร้อย");
    } else {
      // ตรวจสอบว่ามีรายวิชานี้ในปีและภาคการศึกษานี้อยู่แล้วหรือไม่
      const targetKey = getCourseUniqueKey(courseItem.courseCode, courseItem.year, courseItem.semester);
      const existsIndex = editingTeachingCourses.findIndex(
        (c) => getCourseUniqueKey(c.courseCode, c.year, c.semester) === targetKey
      );

      if (existsIndex >= 0) {
        // หากมีอยู่แล้ว ให้เป็นการอัปเดตข้อมูลเดิม แทนการเพิ่มซ้ำ
        updated = editingTeachingCourses.map((c, idx) =>
          idx === existsIndex ? { ...courseItem, id: c.id } : c
        );
        toast.success(`อัปเดตข้อมูลรายวิชา ${courseItem.courseCode} เรียบร้อย (เนื่องจากมีวิชานี้ในภาค/ปีการศึกษานี้อยู่แล้ว)`);
      } else {
        // เพิ่มใหม่
        updated = [courseItem, ...editingTeachingCourses];
        toast.success("เพิ่มรายวิชาเรียบร้อย");
      }
    }

    setEditingTeachingCourses(updated);
    setFormExperiencesTh(JSON.stringify(updated));
    resetCourseForm();
  };

  const handleDeleteCourse = (id: string) => {
    const updated = editingTeachingCourses.filter((c) => c.id !== id);
    setEditingTeachingCourses(updated);
    setFormExperiencesTh(updated.length > 0 ? JSON.stringify(updated) : "");
    toast.success("ลบรายวิชาเรียบร้อย");
  };

  const handleSyncFromTimetables = async () => {
    const teacherName = `${formFirstNameTh} ${formLastNameTh}`.trim();
    if (!teacherName) {
      toast.error("กรุณาระบุชื่ออาจารย์ก่อนทำการดึงตารางสอน");
      return;
    }

    try {
      setIsSyncingCourses(true);
      const synced = await syncTeacherCoursesFromTimetablesAction(teacherName, editingItem?.id, {
        firstNameEn: formFirstNameEn,
        lastNameEn: formLastNameEn,
      });
      if (!synced || synced.length === 0) {
        toast.info("ไม่พบรายวิชาที่ตรงกับชื่ออาจารย์ในตารางสอนภาคเรียนนี้");
        return;
      }

      // Upsert: อัปเดตรายวิชาเดิมที่มีอยู่แล้ว และเพิ่มรายวิชาใหม่เข้ามา (ไม่สร้างซ้ำ)
      const { merged, addedCount, updatedCount } = upsertTeachingCourses(
        editingTeachingCourses,
        synced
      );

      setEditingTeachingCourses(merged);
      setFormExperiencesTh(formatTeachingCoursesToText(merged));

      if (addedCount > 0 && updatedCount > 0) {
        toast.success(`ดึงข้อมูลตารางสอนสำเร็จ: เพิ่มวิชาใหม่ ${addedCount} วิชา และอัปเดตข้อมูลเดิม ${updatedCount} วิชา`);
      } else if (addedCount > 0) {
        toast.success(`ดึงรายวิชาจากตารางสอนสำเร็จ เพิ่มใหม่ ${addedCount} วิชา!`);
      } else if (updatedCount > 0) {
        toast.success(`อัปเดตข้อมูลรายวิชาเดิมจากตารางสอนล่าสุดเรียบร้อย ${updatedCount} วิชา!`);
      } else {
        toast.info("รายวิชาทั้งหมดจากตารางสอนเป็นปัจจุบันแล้ว");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการดึงข้อมูลตารางสอน";
      toast.error(msg);
    } finally {
      setIsSyncingCourses(false);
    }
  };

  const handleAddStandardMcuCourses = (level: DegreeLevel) => {
    let sourceList: Array<{ code: string; th: string; en: string; cr: number; prog: string }> = [];
    if (level === "BACHELOR") sourceList = MCU_STANDARD_COURSES.bachelor;
    else if (level === "MASTER") sourceList = MCU_STANDARD_COURSES.master;
    else if (level === "DOCTORAL") sourceList = MCU_STANDARD_COURSES.doctoral;

    const toUpsert: TeachingCourse[] = sourceList.slice(0, 3).map((s, idx) => ({
      id: `std-${level.toLowerCase()}-${Date.now()}-${idx}`,
      year: "2569",
      semester: "1",
      level,
      courseCode: s.code,
      courseNameTh: s.th,
      courseNameEn: s.en,
      credits: s.cr,
      programTh: s.prog,
      role: "อาจารย์ผู้สอนประจำวิชา",
    }));

    const { merged, addedCount } = upsertTeachingCourses(
      editingTeachingCourses,
      toUpsert
    );

    setEditingTeachingCourses(merged);
    setFormExperiencesTh(formatTeachingCoursesToText(merged));

    if (addedCount > 0) {
      toast.success(`เพิ่มรายวิชามาตรฐาน มจร (${formatDegreeLevelLabel(level)}) จำนวน ${addedCount} วิชา!`);
    } else {
      toast.success(`อัปเดตข้อมูลรายวิชามาตรฐาน (${formatDegreeLevelLabel(level)}) เรียบร้อยแล้ว`);
    }
  };

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("กรุณาเลือกไฟล์รูปภาพ (JPG, PNG, WEBP)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("ขนาดไฟล์รูปภาพต้องไม่เกิน 10MB");
      return;
    }

    try {
      setIsUploadingImage(true);
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadPersonnelImageAction(formData);
      setFormImageUrl(res.url);
      toast.success("อัปโหลดรูปภาพสำเร็จ");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ";
      toast.error(msg);
    } finally {
      setIsUploadingImage(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  };


  // Teacher's Linked Research Publications inside Dialog
  const [editingResearchList, setEditingResearchList] = useState<ResearchPublication[]>([]);
  const [showAddResearchForm, setShowAddResearchForm] = useState(false);
  const [newPubTitleTh, setNewPubTitleTh] = useState("");
  const [newPubTitleEn, setNewPubTitleEn] = useState("");
  const [newPubJournal, setNewPubJournal] = useState("");
  const [newPubYear, setNewPubYear] = useState("๒๕๖๙");
  const [newPubTier, setNewPubTier] = useState("TCI กลุ่ม 2");
  const [newPubType, setNewPubType] = useState<"RESEARCH" | "ACADEMIC" | "DISSERTATION">("RESEARCH");
  const [newPubUrl, setNewPubUrl] = useState("");

  // Positions & Appointments with Official Evidence
  const [editingPositions, setEditingPositions] = useState<AcademicPositionItem[]>([]);
  const [showAddPosForm, setShowAddPosForm] = useState(false);
  const [newPosCategory, setNewPosCategory] = useState<"ACADEMIC_ADMIN" | "COMMITTEE">("ACADEMIC_ADMIN");
  const [newPosTitle, setNewPosTitle] = useState("");
  const [newPosOrderNo, setNewPosOrderNo] = useState("");
  const [newPosYear, setNewPosYear] = useState("");
  const [newPosFileUrl, setNewPosFileUrl] = useState("");
  const [isUploadingPosFile, setIsUploadingPosFile] = useState(false);
  const posFileInputRef = useRef<HTMLInputElement>(null);

  // Research Publication Attachment Upload
  const [isUploadingResearchFile, setIsUploadingResearchFile] = useState(false);
  const researchFileInputRef = useRef<HTMLInputElement>(null);

  const handleResearchFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      toast.error("ขนาดไฟล์ต้องไม่เกิน 15MB");
      return;
    }
    try {
      setIsUploadingResearchFile(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "research");
      const res = await uploadPersonnelAttachmentAction(formData);
      setNewPubUrl(res.url);
      toast.success(`อัปโหลดไฟล์ "${res.fileName}" สำเร็จ`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการอัปโหลดไฟล์วิจัย");
    } finally {
      setIsUploadingResearchFile(false);
      if (researchFileInputRef.current) researchFileInputRef.current.value = "";
    }
  };

  const handlePosFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      toast.error("ขนาดไฟล์ต้องไม่เกิน 15MB");
      return;
    }
    try {
      setIsUploadingPosFile(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "appointments");
      const res = await uploadPersonnelAttachmentAction(formData);
      setNewPosFileUrl(res.url);
      toast.success(`อัปโหลดไฟล์คำสั่ง "${res.fileName}" สำเร็จ`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการอัปโหลดไฟล์คำสั่ง");
    } finally {
      setIsUploadingPosFile(false);
      if (posFileInputRef.current) posFileInputRef.current.value = "";
    }
  };

  const handleAddPosition = () => {
    if (!newPosTitle.trim()) {
      toast.error("กรุณาระบุชื่อตำแหน่ง");
      return;
    }
    const item: AcademicPositionItem = {
      id: `pos-${Date.now()}`,
      category: newPosCategory,
      title: newPosTitle.trim(),
      orderNo: newPosOrderNo.trim() || undefined,
      year: newPosYear.trim() || undefined,
      fileUrl: newPosFileUrl.trim() || undefined,
      fileType: detectAttachmentType(newPosFileUrl) || undefined,
    };
    setEditingPositions((prev) => [...prev, item]);
    setNewPosTitle("");
    setNewPosOrderNo("");
    setNewPosYear("");
    setNewPosFileUrl("");
    setShowAddPosForm(false);
    toast.success("เพิ่มตำแหน่งและหลักฐานเรียบร้อยแล้ว");
  };

  const handleDeletePosition = (id: string) => {
    setEditingPositions((prev) => prev.filter((p) => p.id !== id));
    toast.success("ลบรายการตำแหน่งเรียบร้อย");
  };

  // Import / Export State
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importPreviewItems, setImportPreviewItems] = useState<ImportPersonnelItem[]>([]);
  const [importFileName, setImportFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─────────────────────────────────────────────────────────
  // Open Modals
  // ─────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingItem(null);
    setFormFirstNameTh("");
    setFormLastNameTh("");
    setFormFirstNameEn("");
    setFormLastNameEn("");
    setFormPositionTh("");
    setFormPositionEn("");
    setFormAcademicPosition("อาจารย์");
    setFormAcademicPositionEn("Lecturer");
    setFormTitlePlacement("PREFIX");
    setFormType("ACADEMIC");
    setFormDepartmentId(departmentList[0]?.id || "");
    setFormEmail("");
    setFormPhoneNumber("");
    setFormContactInfo("");
    setFormOfficeLocation("");
    setFormGoogleScholarUrl("");
    setFormImageUrl("");
    setFormEducationTh("");
    setFormExperiencesTh("");
    setFormBioTh("");
    setFormIsActive(true);
    setFormOrderIndex(items.length + 1);
    setEditingResearchList([]);
    setEditingTeachingCourses([]);
    setEditingPositions([]);
    setShowAddPosForm(false);
    resetCourseForm();
    setCourseFilterLevel("ALL");
    setCourseFilterYear("ALL");
    setCourseFilterSearch("");
    setShowAddResearchForm(false);
    setActiveTab("general");
    setDialogOpen(true);
  };

  const openEdit = (item: PersonnelWithRelations, defaultTab: "general" | "academic" | "teaching" | "contact" | "research" = "general") => {
    setEditingItem(item);
    setFormFirstNameTh(item.firstNameTh || "");
    setFormLastNameTh(item.lastNameTh || "");
    setFormFirstNameEn(item.firstNameEn || "");
    setFormLastNameEn(item.lastNameEn || "");
    setFormPositionTh(item.positionTh || "");
    setFormPositionEn(item.positionEn || "");
    setFormAcademicPosition(item.academicPosition || "");
    setFormAcademicPositionEn(item.academicPositionEn || "");
    setFormTitlePlacement(item.titlePlacement === "SUFFIX" ? "SUFFIX" : "PREFIX");
    setFormType(item.type);
    setFormDepartmentId(item.departmentId || "");
    setFormEmail(item.email || "");
    setFormPhoneNumber(item.phoneNumber || "");
    setFormContactInfo(item.contactInfo || "");
    setFormOfficeLocation(item.officeLocation || "");
    setFormGoogleScholarUrl(item.googleScholarUrl || "");
    setFormImageUrl(item.imageUrl || "");
    setFormEducationTh(item.educationTh || "");
    const parsedTeaching = parseTeachingExperiences(item.experiencesTh, {
      id: item.id,
      firstNameTh: item.firstNameTh,
      lastNameTh: item.lastNameTh,
      departmentName: item.department?.nameTh,
    });
    const cleanTeaching = upsertTeachingCourses([], parsedTeaching).merged;
    setEditingTeachingCourses(cleanTeaching);

    const isRawJson = item.experiencesTh?.trim().startsWith("[") || item.experiencesTh?.trim().startsWith("{");
    if (isRawJson) {
      setFormExperiencesTh(formatTeachingCoursesToText(cleanTeaching));
    } else {
      setFormExperiencesTh(item.experiencesTh || "");
    }
    setFormBioTh(item.bioTh || "");
    setFormIsActive(item.isActive);
    setFormOrderIndex(item.orderIndex);
    const parsedPositions = parseAcademicPositions(item.experiencesTh);
    setEditingPositions(parsedPositions);
    setShowAddPosForm(false);
    setEditingResearchList(item.researchPublications || []);
    resetCourseForm();
    setCourseFilterLevel("ALL");
    setCourseFilterYear("ALL");
    setCourseFilterSearch("");
    setShowAddResearchForm(false);
    setActiveTab(defaultTab);
    setDialogOpen(true);
  };

  // ─────────────────────────────────────────────────────────
  // Save Personnel
  // ─────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!formFirstNameTh.trim()) {
      toast.error("กรุณาระบุชื่อ (ภาษาไทย)");
      return;
    }
    if (!formPositionTh.trim()) {
      toast.error("กรุณาระบุตำแหน่งงาน / หน้าที่");
      return;
    }

    startTransition(async () => {
      const payload = {
        firstNameTh: formFirstNameTh.trim(),
        lastNameTh: formLastNameTh.trim(),
        firstNameEn: formFirstNameEn.trim() || null,
        lastNameEn: formLastNameEn.trim() || null,
        positionTh: formPositionTh.trim(),
        positionEn: formPositionEn.trim() || null,
        academicPosition: formAcademicPosition.trim() || null,
        academicPositionEn: formAcademicPositionEn.trim() || null,
        titlePlacement: formTitlePlacement,
        type: formType,
        departmentId: formDepartmentId || null,
        email: formEmail.trim() || null,
        phoneNumber: formPhoneNumber.trim() || null,
        contactInfo: formContactInfo.trim() || null,
        officeLocation: formOfficeLocation.trim() || null,
        googleScholarUrl: formGoogleScholarUrl.trim() || null,
        imageUrl: formImageUrl.trim() || null,
        educationTh: formEducationTh.trim() || null,
        experiencesTh: serializeExperiencesWithPositions(editingTeachingCourses, editingPositions) || (formExperiencesTh.trim() || null),
        bioTh: formBioTh.trim() || null,
        isActive: formIsActive,
        orderIndex: Number(formOrderIndex) || 0,
      };

      try {
        if (editingItem) {
          const updated = await updatePersonnelAction(editingItem.id, payload);
          if (updated) {
            toast.success("อัปเดตข้อมูลอาจารย์/บุคลากรเรียบร้อยแล้ว");
            setItems((prev) =>
              prev.map((p) =>
                p.id === editingItem.id
                  ? {
                      ...p,
                      ...updated,
                      department:
                        departmentList.find((d) => d.id === updated.departmentId) || null,
                      researchPublications: editingResearchList,
                    }
                  : p
              )
            );
            setDialogOpen(false);
            router.refresh();
          }
        } else {
          const created = await createPersonnelAction(payload);
          if (created) {
            toast.success("เพิ่มข้อมูลอาจารย์/บุคลากรใหม่เรียบร้อยแล้ว");
            const newPersonnel: PersonnelWithRelations = {
              ...created,
              department: departmentList.find((d) => d.id === created.departmentId) || null,
              researchPublications: [],
            };
            setItems((prev) => [newPersonnel, ...prev]);
            setDialogOpen(false);
            router.refresh();
          }
        }
      } catch (err: unknown) {
        let errorMsg = "เกิดข้อผิดพลาดในการบันทึกข้อมูล";
        if (err instanceof Error) {
          try {
            const parsed = JSON.parse(err.message);
            if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.message) {
              errorMsg = parsed.map((e) => `${e.path?.join(".") || "ข้อมูล"}: ${e.message}`).join(", ");
            } else {
              errorMsg = err.message;
            }
          } catch {
            errorMsg = err.message;
          }
        }
        toast.error(errorMsg);
      }
    });
  };

  // ─────────────────────────────────────────────────────────
  // Delete Personnel
  // ─────────────────────────────────────────────────────────
  const handleDelete = (id: string, name: string) => {
    if (!confirm(`คุณต้องการลบข้อมูลของ "${name}" ออกจากระบบใช่หรือไม่?`)) return;

    startTransition(async () => {
      try {
        await deletePersonnelAction(id);
        toast.success("ลบข้อมูลบุคลากรเรียบร้อยแล้ว");
        setItems((prev) => prev.filter((p) => p.id !== id));
        router.refresh();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการลบข้อมูล");
      }
    });
  };

  // ─────────────────────────────────────────────────────────
  // Add Research Publication directly inside Dialog
  // ─────────────────────────────────────────────────────────
  const handleAddResearchToTeacher = () => {
    if (!editingItem) {
      toast.error("กรุณาบันทึกข้อมูลอาจารย์ก่อนเพิ่มผลงานวิจัย");
      return;
    }
    if (!newPubTitleTh.trim() || !newPubJournal.trim()) {
      toast.error("กรุณากรอกชื่อเรื่องและชื่อวารสารให้ครบถ้วน");
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          personnelId: editingItem.id,
          titleTh: newPubTitleTh.trim(),
          titleEn: newPubTitleEn.trim() || null,
          authors: `${formFirstNameTh} ${formLastNameTh}`.trim(),
          journalName: newPubJournal.trim(),
          publicationYear: newPubYear.trim() || null,
          tier: newPubTier || null,
          type: newPubType,
          url: newPubUrl.trim() || null,
        };

        const res = await createResearchPublicationAction(payload);
        if (res) {
          toast.success("บันทึกผลงานวิจัยให้อาจารย์เรียบร้อยแล้ว");
          setEditingResearchList((prev) => [...prev, res as ResearchPublication]);
          setItems((prev) =>
            prev.map((p) =>
              p.id === editingItem.id
                ? {
                    ...p,
                    researchPublications: [...(p.researchPublications || []), res as ResearchPublication],
                  }
                : p
            )
          );
          setNewPubTitleTh("");
          setNewPubTitleEn("");
          setNewPubJournal("");
          setNewPubUrl("");
          setShowAddResearchForm(false);
          router.refresh();
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "ไม่สามารถบันทึกผลงานวิจัยได้");
      }
    });
  };

  // ─────────────────────────────────────────────────────────
  // Delete Research Publication directly inside Dialog
  // ─────────────────────────────────────────────────────────
  const handleDeleteResearchFromTeacher = (pubId: string, title: string) => {
    if (!confirm(`คุณต้องการลบผลงานวิจัย "${title}" ใช่หรือไม่?`)) return;

    startTransition(async () => {
      try {
        await deleteResearchPublicationAction(pubId);
        toast.success("ลบผลงานวิจัยเรียบร้อยแล้ว");
        setEditingResearchList((prev) => prev.filter((r) => r.id !== pubId));
        setItems((prev) =>
          prev.map((p) =>
            p.id === editingItem?.id
              ? {
                  ...p,
                  researchPublications: (p.researchPublications || []).filter((r) => r.id !== pubId),
                }
              : p
          )
        );
        router.refresh();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการลบ");
      }
    });
  };

  // ─────────────────────────────────────────────────────────
  // Reorder Personnel Handlers (Inline & Up/Down)
  // ─────────────────────────────────────────────────────────
  const handleUpdateOrder = (id: string, newOrder: number) => {
    const target = items.find((p) => p.id === id);
    if (!target) return;
    const cleanOrder = Math.max(0, Math.floor(newOrder));
    if (target.orderIndex === cleanOrder) return;

    // Optimistic UI update
    setItems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, orderIndex: cleanOrder } : p))
    );

    startTransition(async () => {
      try {
        await updatePersonnelOrderAction(id, cleanOrder);
        const name = `${target.academicPosition ? `${target.academicPosition} ` : ""}${target.firstNameTh} ${target.lastNameTh}`.trim();
        toast.success(`เปลี่ยนลำดับของ "${name}" เป็น ${cleanOrder} เรียบร้อยแล้ว`);
        router.refresh();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเปลี่ยนลำดับ");
        // Revert on error
        setItems((prev) =>
          prev.map((p) => (p.id === id ? { ...p, orderIndex: target.orderIndex } : p))
        );
      }
    });
  };

  const handleMoveOrder = (id: string, direction: -1 | 1) => {
    const currentIndex = filteredItems.findIndex((p) => p.id === id);
    if (currentIndex === -1) return;
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= filteredItems.length) return;

    const currentItem = filteredItems[currentIndex];
    const targetItem = filteredItems[targetIndex];

    let currentNewOrder: number;
    let targetNewOrder: number;

    if (currentItem.orderIndex !== targetItem.orderIndex) {
      currentNewOrder = targetItem.orderIndex;
      targetNewOrder = currentItem.orderIndex;
    } else {
      if (direction === -1) {
        currentNewOrder = Math.max(0, currentItem.orderIndex - 1);
        targetNewOrder = currentItem.orderIndex;
      } else {
        currentNewOrder = currentItem.orderIndex + 1;
        targetNewOrder = currentItem.orderIndex;
      }
    }

    // Optimistic update
    setItems((prev) =>
      prev.map((p) => {
        if (p.id === currentItem.id) return { ...p, orderIndex: currentNewOrder };
        if (p.id === targetItem.id) return { ...p, orderIndex: targetNewOrder };
        return p;
      })
    );

    startTransition(async () => {
      try {
        await reorderPersonnelBatchAction([
          { id: currentItem.id, orderIndex: currentNewOrder },
          { id: targetItem.id, orderIndex: targetNewOrder },
        ]);
        const name = `${currentItem.academicPosition ? `${currentItem.academicPosition} ` : ""}${currentItem.firstNameTh} ${currentItem.lastNameTh}`.trim();
        toast.success(`ปรับลำดับ "${name}" ${direction === -1 ? "ขึ้น" : "ลง"} เรียบร้อยแล้ว`);
        router.refresh();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการปรับลำดับ");
        // Revert on error
        setItems((prev) =>
          prev.map((p) => {
            if (p.id === currentItem.id) return { ...p, orderIndex: currentItem.orderIndex };
            if (p.id === targetItem.id) return { ...p, orderIndex: targetItem.orderIndex };
            return p;
          })
        );
      }
    });
  };

  // ─────────────────────────────────────────────────────────
  // EXPORT FUNCTIONS (CSV & JSON)
  // ─────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const headers = [
      "คำนำหน้า/ตำแหน่งทางวิชาการ (ไทย)",
      "ชื่อ (ไทย)",
      "นามสกุล (ไทย)",
      "Academic Position (EN)",
      "First Name (EN)",
      "Last Name (EN)",
      "ตำแหน่งงาน (ไทย)",
      "Position (EN)",
      "สายงาน",
      "ภาควิชา",
      "อีเมล",
      "เบอร์โทรศัพท์",
      "ข้อมูลติดต่อเพิ่มเติม",
      "สถานที่ทำงาน",
      "Google Scholar",
      "ประวัติการศึกษา",
      "ประสบการณ์สอน/ภาระงาน",
      "ประวัติย่อ/ความเชี่ยวชาญ",
      "URL รูปภาพ",
      "จำนวนผลงานวิจัย",
      "ลำดับ",
      "สถานะ",
    ];

    const escapeCell = (v: unknown): string => {
      if (v === null || v === undefined) return '""';
      const str = String(v).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = items.map((p) => [
      escapeCell(p.academicPosition || ""),
      escapeCell(p.firstNameTh),
      escapeCell(p.lastNameTh || ""),
      escapeCell(p.academicPositionEn || ""),
      escapeCell(p.firstNameEn || ""),
      escapeCell(p.lastNameEn || ""),
      escapeCell(p.positionTh),
      escapeCell(p.positionEn || ""),
      escapeCell(p.type),
      escapeCell(p.department?.nameTh || ""),
      escapeCell(p.email || ""),
      escapeCell(p.phoneNumber || ""),
      escapeCell(p.contactInfo || ""),
      escapeCell(p.officeLocation || ""),
      escapeCell(p.googleScholarUrl || ""),
      escapeCell(p.educationTh || ""),
      escapeCell(p.experiencesTh || ""),
      escapeCell(p.bioTh || ""),
      escapeCell(p.imageUrl || ""),
      escapeCell(p.researchPublications?.length || 0),
      escapeCell(p.orderIndex),
      escapeCell(p.isActive ? "1" : "0"),
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `personnel_directory_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("ส่งออกไฟล์ CSV เรียบร้อยแล้ว (รองรับ Excel ภาษาไทย)");
  };

  const handleExportJSON = () => {
    const exportData = items.map((p) => ({
      id: p.id,
      academicPosition: p.academicPosition,
      firstNameTh: p.firstNameTh,
      lastNameTh: p.lastNameTh,
      firstNameEn: p.firstNameEn,
      lastNameEn: p.lastNameEn,
      positionTh: p.positionTh,
      positionEn: p.positionEn,
      type: p.type,
      departmentName: p.department?.nameTh || null,
      departmentId: p.departmentId,
      email: p.email,
      phoneNumber: p.phoneNumber,
      contactInfo: p.contactInfo,
      officeLocation: p.officeLocation,
      googleScholarUrl: p.googleScholarUrl,
      imageUrl: p.imageUrl,
      educationTh: p.educationTh,
      experiencesTh: p.experiencesTh,
      bioTh: p.bioTh,
      isActive: p.isActive,
      orderIndex: p.orderIndex,
      researchPublications: (p.researchPublications || []).map((r) => ({
        id: r.id,
        titleTh: r.titleTh,
        titleEn: r.titleEn,
        authors: r.authors,
        journalName: r.journalName,
        volume: r.volume,
        issue: r.issue,
        publicationYear: r.publicationYear,
        pages: r.pages,
        issn: r.issn,
        tier: r.tier,
        url: r.url,
        type: r.type,
        orderIndex: r.orderIndex,
      })),
    }));

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `personnel_full_portfolio_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("ส่งออกไฟล์ JSON ครบชุด (รวมผลงานวิจัย) เรียบร้อยแล้ว");
  };

  // ─────────────────────────────────────────────────────────
  // Download Template
  // ─────────────────────────────────────────────────────────
  const downloadCsvTemplate = () => {
    const headers = [
      "คำนำหน้า/ตำแหน่งทางวิชาการ (ไทย)",
      "ชื่อ (ไทย)",
      "นามสกุล (ไทย)",
      "Academic Position (EN)",
      "First Name (EN)",
      "Last Name (EN)",
      "ตำแหน่งงาน (ไทย)",
      "Position (EN)",
      "สายงาน",
      "ภาควิชา",
      "อีเมล",
      "เบอร์โทรศัพท์",
      "ข้อมูลติดต่อเพิ่มเติม",
      "สถานที่ทำงาน",
      "Google Scholar",
      "ประวัติการศึกษา",
      "ประสบการณ์สอน/ภาระงาน",
      "ประวัติย่อ/ความเชี่ยวชาญ",
      "URL รูปภาพ",
      "ลำดับ",
      "สถานะ",
    ];

    const sampleRow = [
      '"อาจารย์, ดร."',
      '"ไชยา"',
      '"เสนแสนยา"',
      '"Chaiya"',
      '"Sensaenya"',
      '"อาจารย์ประจำหลักสูตรพุทธศาสตรบัณฑิต"',
      '"Lecturer in Religion and Philosophy"',
      '"ACADEMIC"',
      '"ภาควิชาศาสนาและปรัชญา"',
      '"chaiya.sen@mcu.ac.th"',
      '"098-387-5997"',
      '"Line ID: 0983875997"',
      '"พ.ศ. ๒๕๖๘ พธ.ด. (ปรัชญา) มจร"',
      '"อาจารย์ผู้สอนรายวิชาปรัชญาเบื้องต้น"',
      '"ความเชี่ยวชาญด้านพุทธปรัชญาเถรวาท"',
      '""',
      '"1"',
      '"1"',
    ];

    const csvContent = "\uFEFF" + [headers.join(","), sampleRow.join(",")].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_personnel_import.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("ดาวน์โหลดแม่แบบ CSV เรียบร้อยแล้ว");
  };

  // ─────────────────────────────────────────────────────────
  // CSV / JSON Parser for Import
  // ─────────────────────────────────────────────────────────
  const parseCSV = (text: string): string[][] => {
    const lines: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let curVal = "";
    const clean = text.replace(/^\uFEFF/, "");

    for (let i = 0; i < clean.length; i++) {
      const char = clean[i];
      const nextChar = clean[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          curVal += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        row.push(curVal.trim());
        curVal = "";
      } else if ((char === "\r" || char === "\n") && !inQuotes) {
        if (char === "\r" && nextChar === "\n") i++;
        row.push(curVal.trim());
        if (row.some((cell) => cell.length > 0)) {
          lines.push(row);
        }
        row = [];
        curVal = "";
      } else {
        curVal += char;
      }
    }
    if (curVal.length > 0 || row.length > 0) {
      row.push(curVal.trim());
      if (row.some((cell) => cell.length > 0)) lines.push(row);
    }
    return lines;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    const reader = new FileReader();

    if (file.name.endsWith(".json")) {
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (!Array.isArray(parsed)) {
            toast.error("รูปแบบไฟล์ JSON ต้องเป็น Array ของบุคลากร");
            return;
          }
          setImportPreviewItems(parsed);
          toast.success(`โหลดข้อมูลสำเร็จ ${parsed.length} รายการ (พร้อมตรวจสอบ)`);
        } catch {
          toast.error("ไม่สามารถอ่านไฟล์ JSON ได้ กรุณาตรวจสอบความถูกต้องของไฟล์");
        }
      };
      reader.readAsText(file, "utf-8");
    } else {
      // CSV
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const rows = parseCSV(text);
          if (rows.length < 2) {
            toast.error("ไฟล์ CSV ต้องมีแถวหัวตารางและข้อมูลอย่างน้อย 1 แถว");
            return;
          }

          // Header: คำนำหน้า, ชื่อ, นามสกุล, First Name, Last Name, ตำแหน่ง, Position, สายงาน, ภาควิชา, อีเมล, โทร, ข้อมูลติดต่อ, การศึกษา, ประสบการณ์, ประวัติย่อ, รูปภาพ, ลำดับ, สถานะ
          const dataRows = rows.slice(1);
          const parsedList: ImportPersonnelItem[] = dataRows
            .filter((r) => r[1]?.trim() && r[5]?.trim())
            .map((r) => {
              const acadPos = r[0]?.trim() || null;
              const fTh = r[1]?.trim() || "";
              const lTh = r[2]?.trim() || "";
              const fEn = r[3]?.trim() || null;
              const lEn = r[4]?.trim() || null;
              const posTh = r[5]?.trim() || "";
              const posEn = r[6]?.trim() || null;
              const rawType = r[7]?.trim().toUpperCase();
              const type = rawType === "SUPPORT" || rawType === "EXECUTIVE" || rawType === "SPECIAL" ? rawType : "ACADEMIC";
              const deptName = r[8]?.trim() || null;
              const email = r[9]?.trim() || null;
              const phone = r[10]?.trim() || null;
              const contact = r[11]?.trim() || null;
              const edu = r[12]?.trim() || null;
              const exp = r[13]?.trim() || null;
              const bio = r[14]?.trim() || null;
              const img = r[15]?.trim() || null;
              const order = parseInt(r[17] || "0", 10) || 0;
              const isActive = r[18] !== "0";

              return {
                academicPosition: acadPos,
                firstNameTh: fTh,
                lastNameTh: lTh,
                firstNameEn: fEn,
                lastNameEn: lEn,
                positionTh: posTh,
                positionEn: posEn,
                type,
                departmentName: deptName,
                email,
                phoneNumber: phone,
                contactInfo: contact,
                educationTh: edu,
                experiencesTh: exp,
                bioTh: bio,
                imageUrl: img,
                orderIndex: order,
                isActive,
              };
            });

          setImportPreviewItems(parsedList);
          toast.success(`โหลดข้อมูลสำเร็จ ${parsedList.length} รายการ (พร้อมตรวจสอบ)`);
        } catch {
          toast.error("ไม่สามารถแยกวิเคราะห์ไฟล์ CSV ได้");
        }
      };
      reader.readAsText(file, "utf-8");
    }
  };

  const handleConfirmImport = () => {
    if (importPreviewItems.length === 0) return;

    startTransition(async () => {
      try {
        const result = await importPersonnelBatchAction(importPreviewItems);
        toast.success(
          `นำเข้าเรียบร้อย: เพิ่มใหม่ ${result.createdCount} ท่าน, อัปเดต ${result.updatedCount} ท่าน, ผลงานวิจัย ${result.totalResearchCount} เรื่อง`
        );
        setImportModalOpen(false);
        setImportPreviewItems([]);
        setImportFileName("");
        router.refresh();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการนำเข้า");
      }
    });
  };

  // ─────────────────────────────────────────────────────────
  // Filtered Items (Sorted by orderIndex strictly)
  // ─────────────────────────────────────────────────────────
  const filteredItems = items
    .filter((item) => {
      const q = search.toLowerCase().trim();
      const fullNameTh = `${item.firstNameTh} ${item.lastNameTh}`.toLowerCase();
      const fullNameEn = `${item.firstNameEn || ""} ${item.lastNameEn || ""}`.toLowerCase();
      const posTh = (item.positionTh || "").toLowerCase();
      const acadPos = (item.academicPosition || "").toLowerCase();
      const deptName = (item.department?.nameTh || "").toLowerCase();

      const matchesSearch =
        !q ||
        fullNameTh.includes(q) ||
        fullNameEn.includes(q) ||
        posTh.includes(q) ||
        acadPos.includes(q) ||
        deptName.includes(q);

      const matchesType = typeFilter === "ALL" || item.type === typeFilter;
      const matchesDept = deptFilter === "ALL" || item.departmentId === deptFilter;

      return matchesSearch && matchesType && matchesDept;
    })
    .sort((a, b) => {
      const orderA = a.orderIndex ?? 0;
      const orderB = b.orderIndex ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return a.firstNameTh.localeCompare(b.firstNameTh, "th");
    });

  // ─────────────────────────────────────────────────────────
  // SINGLE PERSONNEL EXPORT & IMPORT (เฉพาะข้อมูลอาจารย์ท่านนี้)
  // ─────────────────────────────────────────────────────────
  const singleImportInputRef = useRef<HTMLInputElement>(null);

  const handleExportSinglePersonnelJson = () => {
    const teacherName = `${formAcademicPosition ? formAcademicPosition + " " : ""}${formFirstNameTh} ${formLastNameTh}`.trim() || "personnel";
    const deptName = departmentList.find((d) => d.id === formDepartmentId)?.nameTh || "";

    const exportData = {
      _format: "ums_fbm_personnel_single",
      version: "1.0",
      exportedAt: new Date().toISOString(),
      personnel: {
        academicPosition: formAcademicPosition || null,
        firstNameTh: formFirstNameTh,
        lastNameTh: formLastNameTh || "",
        firstNameEn: formFirstNameEn || null,
        lastNameEn: formLastNameEn || null,
        positionTh: formPositionTh,
        positionEn: formPositionEn || null,
        type: formType,
        departmentId: formDepartmentId || null,
        departmentName: deptName || null,
        email: formEmail || null,
        phoneNumber: formPhoneNumber || null,
        contactInfo: formContactInfo || null,
        imageUrl: formImageUrl || null,
        educationTh: formEducationTh || null,
        experiencesTh: editingTeachingCourses.length > 0 ? JSON.stringify(editingTeachingCourses) : (formExperiencesTh || null),
        bioTh: formBioTh || null,
        isActive: formIsActive,
        orderIndex: Number(formOrderIndex) || 0,
      },
      teachingCourses: editingTeachingCourses,
      researchPublications: editingResearchList.map((r, idx) => ({
        titleTh: r.titleTh,
        titleEn: r.titleEn || null,
        authors: r.authors,
        journalName: r.journalName,
        volume: r.volume || null,
        issue: r.issue || null,
        publicationYear: r.publicationYear || null,
        pages: r.pages || null,
        issn: r.issn || null,
        tier: r.tier || null,
        url: r.url || null,
        type: r.type,
        orderIndex: r.orderIndex || idx + 1,
      })),
    };

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const cleanFileName = (formFirstNameTh || "teacher").replace(/[\/\\:*?"<>|]/g, "_");
    a.download = `personnel_${cleanFileName}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`ส่งออกไฟล์ JSON ของ "${teacherName}" เรียบร้อยแล้ว`);
  };

  const handleExportSinglePersonnelCsv = () => {
    const teacherName = `${formAcademicPosition ? formAcademicPosition + " " : ""}${formFirstNameTh} ${formLastNameTh}`.trim() || "personnel";
    const deptName = departmentList.find((d) => d.id === formDepartmentId)?.nameTh || "";

    const headers = [
      "คำนำหน้า/ตำแหน่งทางวิชาการ (ไทย)",
      "ชื่อ (ไทย)",
      "นามสกุล (ไทย)",
      "Academic Position (EN)",
      "First Name (EN)",
      "Last Name (EN)",
      "ตำแหน่งงาน (ไทย)",
      "Position (EN)",
      "สายงาน",
      "ภาควิชา",
      "อีเมล",
      "เบอร์โทรศัพท์",
      "ข้อมูลติดต่อเพิ่มเติม",
      "สถานที่ทำงาน",
      "Google Scholar",
      "ประวัติการศึกษา",
      "ประสบการณ์สอน/ภาระงาน",
      "ประวัติย่อ/ความเชี่ยวชาญ",
      "URL รูปภาพ",
      "ลำดับ",
      "สถานะ",
    ];

    const escapeCsv = (v: unknown): string => {
      if (v === null || v === undefined) return '""';
      const str = String(v).replace(/"/g, '""');
      return `"${str}"`;
    };

    const row = [
      escapeCsv(formAcademicPosition || ""),
      escapeCsv(formFirstNameTh || ""),
      escapeCsv(formLastNameTh || ""),
      escapeCsv(formFirstNameEn || ""),
      escapeCsv(formLastNameEn || ""),
      escapeCsv(formPositionTh || ""),
      escapeCsv(formPositionEn || ""),
      escapeCsv(formType),
      escapeCsv(deptName),
      escapeCsv(formEmail || ""),
      escapeCsv(formPhoneNumber || ""),
      escapeCsv(formContactInfo || ""),
      escapeCsv(formEducationTh || ""),
      escapeCsv(editingTeachingCourses.length > 0 ? JSON.stringify(editingTeachingCourses) : (formExperiencesTh || "")),
      escapeCsv(formBioTh || ""),
      escapeCsv(formImageUrl || ""),
      escapeCsv(formOrderIndex),
      escapeCsv(formIsActive ? "1" : "0"),
    ];

    const csvContent = "\uFEFF" + [headers.join(","), row.join(",")].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const cleanFileName = (formFirstNameTh || "teacher").replace(/[\/\\:*?"<>|]/g, "_");
    a.download = `personnel_${cleanFileName}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`ส่งออกไฟล์ CSV ของ "${teacherName}" เรียบร้อยแล้ว`);
  };

  const handleSingleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    if (file.name.endsWith(".json")) {
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const parsed = JSON.parse(text);

          interface ImportRecord {
            academicPosition?: string | null;
            firstNameTh?: string;
            lastNameTh?: string | null;
            firstNameEn?: string | null;
            lastNameEn?: string | null;
            positionTh?: string;
            positionEn?: string | null;
            type?: "EXECUTIVE" | "ACADEMIC" | "SUPPORT" | "SPECIAL";
            departmentId?: string | null;
            departmentName?: string | null;
            department?: string | null;
            email?: string | null;
            phoneNumber?: string | null;
            contactInfo?: string | null;
            imageUrl?: string | null;
            educationTh?: string | null;
            experiencesTh?: string | null;
            bioTh?: string | null;
            isActive?: boolean;
            orderIndex?: number;
            teachingCourses?: TeachingCourse[];
            researchPublications?: Array<Partial<ResearchPublication>>;
          }

          let pObj: ImportRecord | null = null;
          let courses: TeachingCourse[] = [];
          let research: Array<Partial<ResearchPublication>> = [];

          if (parsed && typeof parsed === "object") {
            if (parsed._format === "ums_fbm_personnel_single" && parsed.personnel) {
              pObj = parsed.personnel;
              if (Array.isArray(parsed.teachingCourses)) courses = parsed.teachingCourses;
              if (Array.isArray(parsed.researchPublications)) research = parsed.researchPublications;
            } else if (Array.isArray(parsed) && parsed.length > 0) {
              pObj = parsed[0] as ImportRecord;
              if (pObj && Array.isArray(pObj.teachingCourses)) courses = pObj.teachingCourses;
              if (pObj && Array.isArray(pObj.researchPublications)) research = pObj.researchPublications;
            } else {
              pObj = parsed as ImportRecord;
              if (Array.isArray(pObj.teachingCourses)) courses = pObj.teachingCourses;
              if (Array.isArray(pObj.researchPublications)) research = pObj.researchPublications;
            }
          }

          if (!pObj || typeof pObj !== "object") {
            toast.error("รูปแบบไฟล์ JSON ไม่ถูกต้อง หรือไม่พบข้อมูลอาจารย์");
            return;
          }

          if (pObj.firstNameTh !== undefined) setFormFirstNameTh(pObj.firstNameTh || "");
          if (pObj.lastNameTh !== undefined) setFormLastNameTh(pObj.lastNameTh || "");
          if (pObj.firstNameEn !== undefined) setFormFirstNameEn(pObj.firstNameEn || "");
          if (pObj.lastNameEn !== undefined) setFormLastNameEn(pObj.lastNameEn || "");
          if (pObj.academicPosition !== undefined) setFormAcademicPosition(pObj.academicPosition || "");
          if (pObj.positionTh !== undefined) setFormPositionTh(pObj.positionTh || "");
          if (pObj.positionEn !== undefined) setFormPositionEn(pObj.positionEn || "");
          if (pObj.type && ["EXECUTIVE", "ACADEMIC", "SUPPORT", "SPECIAL"].includes(pObj.type)) {
            setFormType(pObj.type);
          }

          if (pObj.departmentId && departmentList.some((d) => d.id === pObj.departmentId)) {
            setFormDepartmentId(pObj.departmentId);
          } else if (pObj.departmentName || pObj.department) {
            const targetName = String(pObj.departmentName || pObj.department || "").trim().toLowerCase();
            const found = departmentList.find(
              (d) => d.nameTh.toLowerCase().includes(targetName) || targetName.includes(d.nameTh.toLowerCase())
            );
            if (found) setFormDepartmentId(found.id);
          }

          if (pObj.email !== undefined) setFormEmail(pObj.email || "");
          if (pObj.phoneNumber !== undefined) setFormPhoneNumber(pObj.phoneNumber || "");
          if (pObj.contactInfo !== undefined) setFormContactInfo(pObj.contactInfo || "");
          if (pObj.imageUrl !== undefined) setFormImageUrl(pObj.imageUrl || "");
          if (pObj.educationTh !== undefined) setFormEducationTh(pObj.educationTh || "");
          if (pObj.bioTh !== undefined) setFormBioTh(pObj.bioTh || "");
          if (pObj.orderIndex !== undefined && !isNaN(Number(pObj.orderIndex))) {
            setFormOrderIndex(Number(pObj.orderIndex));
          }
          if (pObj.isActive !== undefined) {
            setFormIsActive(Boolean(pObj.isActive));
          }

          // Teaching courses
          if (courses.length > 0) {
            setEditingTeachingCourses(courses);
            setFormExperiencesTh(formatTeachingCoursesToText(courses));
          } else if (pObj.experiencesTh) {
            const isRawJson = pObj.experiencesTh.trim().startsWith("[") || pObj.experiencesTh.trim().startsWith("{");
            const parsedCourses = parseTeachingExperiences(pObj.experiencesTh, {
              id: editingItem?.id,
              firstNameTh: pObj.firstNameTh,
              lastNameTh: pObj.lastNameTh || undefined,
            });
            setEditingTeachingCourses(parsedCourses);
            setFormExperiencesTh(isRawJson ? formatTeachingCoursesToText(parsedCourses) : pObj.experiencesTh);
          }

          // Research publications
          if (research.length > 0) {
            setEditingResearchList(
              research.map((r, idx) => ({
                id: r.id || `imp-pub-${Date.now()}-${idx}`,
                tenantId: editingItem?.tenantId || "",
                personnelId: editingItem?.id || null,
                titleTh: r.titleTh || "",
                titleEn: r.titleEn || null,
                authors: r.authors || `${pObj?.firstNameTh || ""} ${pObj?.lastNameTh || ""}`.trim(),
                journalName: r.journalName || "",
                volume: r.volume || null,
                issue: r.issue || null,
                publicationYear: r.publicationYear || null,
                pages: r.pages || null,
                issn: r.issn || null,
                tier: r.tier || null,
                url: r.url || null,
                type: (r.type as "RESEARCH" | "ACADEMIC" | "DISSERTATION") || "RESEARCH",
                orderIndex: r.orderIndex || idx + 1,
                createdAt: new Date(),
                updatedAt: new Date(),
              }))
            );
          }

          setActiveTab("general");
          toast.success(`นำเข้าข้อมูลอาจารย์ "${pObj.firstNameTh || ""}" สำเร็จ ตรวจสอบแต่ละแท็บและกดบันทึก`);
        } catch {
          toast.error("ไม่สามารถอ่านไฟล์ JSON ได้ กรุณาตรวจสอบความถูกต้องของไฟล์");
        }
      };
      reader.readAsText(file, "utf-8");
    } else if (file.name.endsWith(".csv")) {
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const rows = parseCSV(text);
          if (rows.length < 2) {
            toast.error("ไฟล์ CSV ไม่มีแถวข้อมูลสำหรับนำเข้า");
            return;
          }

          const dataRow = rows[1];
          const [
            academicPos,
            fTh,
            lTh,
            academicPosEn,
            fEn,
            lEn,
            posTh,
            posEn,
            typeVal,
            deptName,
            emailVal,
            phoneVal,
            contactVal,
            eduVal,
            expVal,
            bioVal,
            imgVal,
            orderVal,
            activeVal,
          ] = dataRow;

          if (academicPos !== undefined) setFormAcademicPosition(academicPos);
          if (academicPosEn !== undefined) setFormAcademicPositionEn(academicPosEn);
          if (fTh) setFormFirstNameTh(fTh);
          if (lTh !== undefined) setFormLastNameTh(lTh);
          if (fEn !== undefined) setFormFirstNameEn(fEn);
          if (lEn !== undefined) setFormLastNameEn(lEn);
          if (posTh) setFormPositionTh(posTh);
          if (posEn !== undefined) setFormPositionEn(posEn);
          if (typeVal && ["EXECUTIVE", "ACADEMIC", "SUPPORT", "SPECIAL"].includes(typeVal)) {
            setFormType(typeVal as "EXECUTIVE" | "ACADEMIC" | "SUPPORT" | "SPECIAL");
          }
          if (deptName) {
            const found = departmentList.find((d) => d.nameTh.includes(deptName) || deptName.includes(d.nameTh));
            if (found) setFormDepartmentId(found.id);
          }
          if (emailVal !== undefined) setFormEmail(emailVal);
          if (phoneVal !== undefined) setFormPhoneNumber(phoneVal);
          if (contactVal !== undefined) setFormContactInfo(contactVal);
          if (eduVal !== undefined) setFormEducationTh(eduVal);
          if (bioVal !== undefined) setFormBioTh(bioVal);
          if (imgVal !== undefined) setFormImageUrl(imgVal);
          if (orderVal && !isNaN(Number(orderVal))) setFormOrderIndex(Number(orderVal));
          if (activeVal !== undefined) setFormIsActive(activeVal === "1" || activeVal.toLowerCase() === "true");

          if (expVal) {
            const parsedCourses = parseTeachingExperiences(expVal, {
              id: editingItem?.id,
              firstNameTh: fTh,
              lastNameTh: lTh,
            });
            setEditingTeachingCourses(parsedCourses);
            const isRawJson = expVal.trim().startsWith("[") || expVal.trim().startsWith("{");
            setFormExperiencesTh(isRawJson ? formatTeachingCoursesToText(parsedCourses) : expVal);
          }

          setActiveTab("general");
          toast.success(`นำเข้าข้อมูลจาก CSV ของ "${fTh || "อาจารย์"}" สำเร็จ ตรวจสอบและกดบันทึก`);
        } catch {
          toast.error("ไม่สามารถอ่านไฟล์ CSV ได้ กรุณาตรวจสอบความถูกต้องของไฟล์");
        }
      };
      reader.readAsText(file, "utf-8");
    } else {
      toast.error("กรุณาเลือกไฟล์ .json หรือ .csv เท่านั้น");
    }

    if (singleImportInputRef.current) singleImportInputRef.current.value = "";
  };

  const totalResearchCount = items.reduce(
    (acc, item) => acc + (item.researchPublications?.length || 0),
    0
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("personnel.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("personnel.subtitle")} ({items.length} ท่าน)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canManage && (
            <>
              <Button onClick={openCreate} className="gap-2 cursor-pointer shadow-xs">
                <Plus className="w-4 h-4" />
                <span>เพิ่มอาจารย์ / บุคลากร</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExecutiveDialogOpen(true)}
                className="gap-1.5 cursor-pointer border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-semibold"
              >
                <Award className="w-4 h-4 text-amber-600" />
                <span>สลับตำแหน่งผู้บริหาร</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImportModalOpen(true)}
                className="gap-1.5 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>นำเข้าไฟล์ (Import)</span>
              </Button>
            </>
          )}

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="gap-1.5 cursor-pointer"
              title="ส่งออกไฟล์ Excel/CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>ส่งออก CSV</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportJSON}
              className="gap-1.5 cursor-pointer"
              title="ส่งออกไฟล์ JSON รวมผลงานวิจัยครบชุด"
            >
              <FileJson className="w-4 h-4 text-blue-600" />
              <span>ส่งออก JSON ครบชุด</span>
            </Button>
          </div>

          <Link href="/portal/personnel" target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm" className="gap-1.5 cursor-pointer">
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
              <span>พอร์ทัล</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Module Navigation Strip */}
      <div className="flex items-center gap-2 border-b border-border pb-px text-sm">
        <Link
          href="/personnel"
          className="px-4 py-2 font-semibold text-primary border-b-2 border-primary flex items-center gap-2"
        >
          <Users className="w-4 h-4" />
          <span>ทำเนียบคณาจารย์และบุคลากร ({items.length})</span>
        </Link>
        <Link
          href="/personnel/research"
          className="px-4 py-2 font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
        >
          <BookOpen className="w-4 h-4" />
          <span>ผลงานวิจัยและวิชาการ ({totalResearchCount})</span>
        </Link>
        <Link
          href="/personnel/departments"
          className="px-4 py-2 font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
        >
          <Building className="w-4 h-4" />
          <span>จัดการภาควิชา ({departmentList.length})</span>
        </Link>
      </div>

      {/* Portal Publication Years Limit Setting Bar */}
      {canManage && (
        <div className="space-y-3">
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span>ตั้งค่าจำนวนปีที่แสดงในส่วน &ldquo;เลือกดูผลงาน&rdquo; หน้าเว็บไซต์ (Portal)</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {pubYearsLimit > 0 ? (
                  <>
                    กำลังแสดงผลย้อนหลัง <strong className="text-primary">{pubYearsLimit} ปี</strong>:{" "}
                    <strong className="text-foreground">
                      ตั้งแต่ พ.ศ. 2569 ถึงปี พ.ศ. {2569 - pubYearsLimit + 1}
                    </strong>{" "}
                    (เช่น 5 = พ.ศ. 2569 ถึง 2565, 7 = พ.ศ. 2569 ถึง 2563)
                  </>
                ) : (
                  <>
                    กำลังแสดงผล <strong className="text-primary">ทุกปี พ.ศ. ทั้งหมด (ไม่จำกัดจำนวนปี)</strong>
                  </>
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[
                { label: "3 ปี (ถึง 2567)", val: 3 },
                { label: "5 ปี (ถึง 2565)", val: 5 },
                { label: "7 ปี (ถึง 2563)", val: 7 },
                { label: "10 ปี (ถึง 2560)", val: 10 },
                { label: "ทุกปี (ทั้งหมด)", val: 0 },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  disabled={isSavingPortalConfig}
                  onClick={() => handleSavePortalYearsLimit(opt.val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                    pubYearsLimit === opt.val
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-background text-muted-foreground hover:bg-muted border-border"
                  }`}
                >
                  {opt.label}
                </button>
              ))}

              <div className="flex items-center gap-1.5 pl-2 border-l border-border">
                <span className="text-xs text-muted-foreground">กำหนดเอง:</span>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={pubYearsLimit}
                  onChange={(e) => setPubYearsLimit(Math.max(0, parseInt(e.target.value || "0", 10)))}
                  className="w-16 px-2 py-1 text-xs font-bold text-center rounded-md border border-input bg-background"
                  aria-label="จำนวนปีที่แสดงผลงานวิจัย"
                />
                <span className="text-xs text-muted-foreground">ปี</span>
                <Button
                  type="button"
                  size="sm"
                  disabled={isSavingPortalConfig}
                  onClick={() => handleSavePortalYearsLimit(pubYearsLimit)}
                  className="h-7 px-3 text-xs cursor-pointer"
                >
                  บันทึก
                </Button>
              </div>
            </div>
          </div>

          {/* Portal "ทุกสังกัด" Tab Toggle Bar */}
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Filter className="w-4 h-4 text-primary shrink-0" />
                <span>การแสดงปุ่ม &ldquo;ทุกสังกัด&rdquo; ในแถบตัวกรองหน้า Portal</span>
              </div>
              <p className="text-xs text-muted-foreground">
                เมื่อปิดการแสดงผล ผู้เข้าชมจะไม่เห็นปุ่ม &ldquo;ทุกสังกัด&rdquo; และระบบจะเลือกแท็บแรก (ผู้บริหาร) ให้อัตโนมัติ
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={isSavingPortalConfig}
                onClick={() => handleToggleShowAllAffiliations(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                  showAllAffiliationsTab
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-background text-muted-foreground hover:bg-muted border-border"
                }`}
              >
                ✓ เปิดแสดง
              </button>
              <button
                type="button"
                disabled={isSavingPortalConfig}
                onClick={() => handleToggleShowAllAffiliations(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                  !showAllAffiliationsTab
                    ? "bg-destructive text-destructive-foreground border-destructive shadow-xs"
                    : "bg-background text-muted-foreground hover:bg-muted border-border"
                }`}
              >
                ✕ ปิดการแสดง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <LiyonCard>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ, ตำแหน่ง, วุฒิการศึกษา..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full py-2 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">-- ทุกประเภทสายงาน --</option>
                <option value="ACADEMIC">สายวิชาการ (อาจารย์/นักวิจัย)</option>
                <option value="SPECIAL">อาจารย์พิเศษ (วิทยากร/อาจารย์รับเชิญ)</option>
                <option value="SUPPORT">สายสนับสนุน (เจ้าหน้าที่)</option>
                <option value="EXECUTIVE">สายผู้บริหาร</option>
              </select>
            </div>

            <div>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full py-2 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">-- ทุกภาควิชา / หน่วยงาน --</option>
                {departmentList.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.nameTh}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </LiyonCard>

      {/* Personnel Table */}
      <LiyonCard>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-muted-foreground border-b border-border text-xs uppercase font-medium">
              <tr>
                <th className="py-3 px-3 text-center w-28">ลำดับ</th>
                <th className="py-3 px-4">ชื่อ - นามสกุล / คณาจารย์</th>
                <th className="py-3 px-4">ตำแหน่งและหน้าที่</th>
                <th className="py-3 px-4">ภาควิชา / สังกัด</th>
                <th className="py-3 px-4">สายงาน</th>
                <th className="py-3 px-4 text-center">ผลงานวิจัย / ตีพิมพ์</th>
                <th className="py-3 px-4 text-center">สถานะ</th>
                <th className="py-3 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    ไม่พบข้อมูลบุคลากรที่ตรงกับเงื่อนไขการค้นหา
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, index) => {
                  const researchCount = item.researchPublications?.length || 0;
                  const fullName = formatPersonnelName(item);

                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      {/* Order Column (Inline Reorder) */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center justify-center gap-1">
                          {canManage ? (
                            <>
                              <div className="flex flex-col -space-y-0.5">
                                <button
                                  type="button"
                                  onClick={() => handleMoveOrder(item.id, -1)}
                                  disabled={isPending || index === 0}
                                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-primary disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                  title="เลื่อนขึ้น (ย้ายไปลำดับก่อนหน้า)"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveOrder(item.id, 1)}
                                  disabled={isPending || index === filteredItems.length - 1}
                                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-primary disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                  title="เลื่อนลง (ย้ายไปลำดับถัดไป)"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <input
                                type="number"
                                min="1"
                                defaultValue={item.orderIndex || 0}
                                key={`${item.id}-${item.orderIndex}`}
                                onBlur={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  if (!isNaN(val) && val !== item.orderIndex) {
                                    handleUpdateOrder(item.id, val);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    const val = parseInt((e.target as HTMLInputElement).value, 10);
                                    if (!isNaN(val) && val !== item.orderIndex) {
                                      handleUpdateOrder(item.id, val);
                                    }
                                    (e.target as HTMLInputElement).blur();
                                  }
                                }}
                                className="w-12 h-7 text-center text-xs font-semibold rounded border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                title="พิมพ์ตัวเลขลำดับ แล้วกด Enter หรือคลิกด้านนอกเพื่อบันทึก"
                              />
                            </>
                          ) : (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted/60 text-muted-foreground">
                              {item.orderIndex || "-"}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-start gap-3">
                          <div className="w-11 h-14 rounded-lg bg-muted border border-border flex items-center justify-center font-bold shrink-0 text-sm overflow-hidden shadow-xs relative">
                            {item.imageUrl ? (
                              <Image
                                src={item.imageUrl}
                                alt={item.firstNameTh}
                                width={44}
                                height={56}
                                unoptimized
                                className="w-full h-full object-cover object-top"
                              />
                            ) : (
                              <span className="text-primary">{item.firstNameTh?.[0] || "U"}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground flex items-center gap-1.5 flex-wrap">
                              <Link
                                href={`/portal/personnel/${item.id}`}
                                target="_blank"
                                className="hover:text-primary transition-colors cursor-pointer"
                                title="เปิดดูหน้าโปรไฟล์อาจารย์ฉบับเต็ม"
                              >
                                {fullName}
                              </Link>
                            </div>
                            {(item.academicPositionEn || item.firstNameEn || item.lastNameEn) && (
                              <p className="text-xs text-muted-foreground">
                                {[item.academicPositionEn, item.firstNameEn, item.lastNameEn].filter(Boolean).join(" ")}
                              </p>
                            )}
                            {item.email && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Mail className="w-3 h-3" />
                                {item.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-sm font-medium text-foreground">{item.positionTh}</div>
                        {item.positionEn && (
                          <div className="text-xs text-muted-foreground">{item.positionEn}</div>
                        )}
                        {item.phoneNumber && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            {item.phoneNumber}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-sm text-foreground">
                          {item.department?.nameTh || "-"}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            item.type === "ACADEMIC"
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : item.type === "EXECUTIVE"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : item.type === "SPECIAL"
                              ? "bg-teal-100 text-teal-800 border border-teal-200"
                              : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}
                        >
                          {t(`personnel.type.${item.type}`)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {researchCount > 0 ? (
                            <Link
                              href={`/personnel/research?author=${item.id}`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition-colors"
                              title="คลิกเพื่อกรองดูผลงานวิจัยของอาจารย์ท่านนี้"
                            >
                              <BookOpen className="w-3 h-3 text-emerald-600" />
                              <span>{researchCount} เรื่อง</span>
                            </Link>
                          ) : (
                            <span className="text-xs text-muted-foreground">0 เรื่อง</span>
                          )}

                          {canManage && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(item, "research")}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-primary cursor-pointer"
                              title="จัดการผลงานวิจัยของอาจารย์ท่านนี้โดยตรง"
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {item.isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            เผยแพร่
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
                            ซ่อน
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canManage && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEdit(item, "general")}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                                title="แก้ไขข้อมูลอาจารย์"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(item.id, fullName)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                                title="ลบข้อมูล"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                          <Link
                            href={`/portal/personnel/${item.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="h-8 w-8 inline-flex items-center justify-center text-muted-foreground hover:text-primary"
                            title="เปิดดูหน้าโปรไฟล์อาจารย์ฉบับเต็ม (Full Profile)"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
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

      {/* Edit / Create Personnel Dialog */}
      <LiyonDialog open={dialogOpen} onOpenChange={setDialogOpen} wide>
        <LiyonDialogCloseButton label="ปิดหน้าต่าง" />
        <LiyonDialogHeader
          title={
            <div className="flex items-center gap-2.5">
              {formImageUrl && (
                <div className="w-8 h-10 rounded-md overflow-hidden border border-border shrink-0 relative bg-muted shadow-xs">
                  <Image
                    src={formImageUrl}
                    alt="รูปโปรไฟล์"
                    width={32}
                    height={40}
                    unoptimized
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              )}
              <span>{editingItem ? "แก้ไขข้อมูลอาจารย์ / บุคลากร" : "เพิ่มอาจารย์ / บุคลากรใหม่"}</span>
            </div>
          }
          description={
            editingItem
              ? `แก้ไขรายละเอียดและผลงานของ ${formAcademicPosition ? formAcademicPosition + " " : ""}${editingItem.firstNameTh} ${editingItem.lastNameTh || ""}`.trim()
              : "บันทึกประวัติ วุฒิการศึกษา ภาระงานสอน และผลงานวิจัย"
          }
        />

        <LiyonDialogBody className="overflow-y-auto p-4 space-y-4 max-h-[70vh]">
          {/* Dialog Navigation Tabs & Single Teacher Import/Export Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-border pb-2.5">
            <div className="flex items-center gap-1.5 text-xs flex-wrap">
              <button
                type="button"
                onClick={() => setActiveTab("general")}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "general"
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>ข้อมูลทั่วไป & ตำแหน่งงาน</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("academic")}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "academic"
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>วุฒิการศึกษา & ประวัติ</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("teaching")}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "teaching"
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>รายวิชาที่สอน ({editingTeachingCourses.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("contact")}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "contact"
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>การติดต่อ & รูปภาพ</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("research")}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "research"
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>ผลงานวิจัย ({editingResearchList.length})</span>
              </button>
            </div>

            {/* Single Personnel Import / Export Action Buttons */}
            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
              <input
                type="file"
                ref={singleImportInputRef}
                onChange={handleSingleImportFile}
                accept=".json,.csv"
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => singleImportInputRef.current?.click()}
                className="h-7 px-2.5 text-xs gap-1.5 cursor-pointer bg-muted/40 hover:bg-muted font-medium"
                title="นำเข้าไฟล์ JSON หรือ CSV เพื่อเติมข้อมูลอาจารย์ท่านนี้ลงในฟอร์มทันที"
              >
                <Upload className="w-3.5 h-3.5 text-primary" />
                <span>นำเข้าไฟล์</span>
              </Button>

              <div className="relative group">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-xs gap-1.5 cursor-pointer bg-muted/40 hover:bg-muted font-medium"
                  title="ส่งออกข้อมูลอาจารย์ท่านนี้เป็นไฟล์ JSON หรือ CSV"
                >
                  <Download className="w-3.5 h-3.5 text-primary" />
                  <span>ส่งออกไฟล์ ▾</span>
                </Button>
                <div className="absolute right-0 top-full mt-1 hidden group-hover:flex flex-col bg-popover text-popover-foreground border border-border rounded-lg shadow-lg z-30 py-1 min-w-[185px]">
                  <button
                    type="button"
                    onClick={handleExportSinglePersonnelJson}
                    className="px-3 py-1.5 text-xs text-left hover:bg-muted transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <FileJson className="w-3.5 h-3.5 text-amber-600" />
                    <span>ส่งออกเป็น JSON (ครบถ้วน)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportSinglePersonnelCsv}
                    className="px-3 py-1.5 text-xs text-left hover:bg-muted transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ส่งออกเป็น CSV / Excel</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tab 1: General Info */}
          {activeTab === "general" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <LiyonField
                  label="ตำแหน่งทางวิชาการ / คำนำหน้า"
                  htmlFor="field-academic-pos"
                  hint="เช่น อาจารย์, ผศ.ดร., รศ.ดร., ดร."
                >
                  <input
                    id="field-academic-pos"
                    value={formAcademicPosition}
                    onChange={(e) => setFormAcademicPosition(e.target.value)}
                    placeholder="เช่น อาจารย์, ผศ.ดร."
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </LiyonField>

                <LiyonField label="ชื่อ (ภาษาไทย) *" htmlFor="field-fname-th">
                  <input
                    id="field-fname-th"
                    value={formFirstNameTh}
                    onChange={(e) => setFormFirstNameTh(e.target.value)}
                    placeholder="เช่น ไชยา"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    required
                  />
                </LiyonField>

                <LiyonField label="นามสกุล (ภาษาไทย)" htmlFor="field-lname-th">
                  <input
                    id="field-lname-th"
                    value={formLastNameTh}
                    onChange={(e) => setFormLastNameTh(e.target.value)}
                    placeholder="เช่น เสนแสนยา (เว้นว่างได้ถ้าเป็นพระภิกษุ)"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </LiyonField>
              </div>

              {/* รูปแบบการจัดวางคำนำหน้า/ตำแหน่งวิชาการ (สำหรับพระภิกษุสงฆ์และคณาจารย์) */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    รูปแบบการจัดวางคำนำหน้า/ตำแหน่งวิชาการ (สำหรับพระภิกษุสงฆ์และคณาจารย์)
                  </span>
                  <div className="text-xs text-muted-foreground">
                    ตัวอย่างแสดงผลจริง: <strong className="text-primary font-bold">{previewFormattedName}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    formTitlePlacement === "SUFFIX"
                      ? "bg-amber-500/20 border-amber-500/60 font-semibold text-amber-900 dark:text-amber-100 shadow-xs"
                      : "bg-background/90 hover:bg-muted border-border text-muted-foreground"
                  }`}>
                    <input
                      type="radio"
                      name="titlePlacement"
                      value="SUFFIX"
                      checked={formTitlePlacement === "SUFFIX"}
                      onChange={() => setFormTitlePlacement("SUFFIX")}
                      className="mt-0.5 cursor-pointer accent-amber-600"
                    />
                    <div>
                      <div className="font-bold text-foreground">วางไว้หลังชื่อ / สมณศักดิ์ (Suffix)</div>
                      <div className="text-[11px] text-muted-foreground leading-snug">
                        เช่น พระราชญาณวชิรเวที, ผศ.ดร. (ธรรมเนียมสงฆ์ / มจร)
                      </div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    formTitlePlacement === "PREFIX"
                      ? "bg-amber-500/20 border-amber-500/60 font-semibold text-amber-900 dark:text-amber-100 shadow-xs"
                      : "bg-background/90 hover:bg-muted border-border text-muted-foreground"
                  }`}>
                    <input
                      type="radio"
                      name="titlePlacement"
                      value="PREFIX"
                      checked={formTitlePlacement === "PREFIX"}
                      onChange={() => setFormTitlePlacement("PREFIX")}
                      className="mt-0.5 cursor-pointer accent-amber-600"
                    />
                    <div>
                      <div className="font-bold text-foreground">วางไว้หน้าชื่อ (Prefix)</div>
                      <div className="text-[11px] text-muted-foreground leading-snug">
                        เช่น ผศ.ดร. พระราชญาณวชิรเวที (สำหรับระเบียบราชการ / มคอ.)
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <LiyonField label="Academic position / Title (English)" htmlFor="field-academic-pos-en">
                  <input
                    id="field-academic-pos-en"
                    value={formAcademicPositionEn}
                    onChange={(e) => setFormAcademicPositionEn(e.target.value)}
                    placeholder="e.g. Asst. Prof. Dr., Lecturer, Ven. Dr."
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </LiyonField>

                <LiyonField label="First Name (English)" htmlFor="field-fname-en">
                  <input
                    id="field-fname-en"
                    value={formFirstNameEn}
                    onChange={(e) => setFormFirstNameEn(e.target.value)}
                    placeholder="e.g. Chaiya"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </LiyonField>

                <LiyonField label="Last Name (English)" htmlFor="field-lname-en">
                  <input
                    id="field-lname-en"
                    value={formLastNameEn}
                    onChange={(e) => setFormLastNameEn(e.target.value)}
                    placeholder="e.g. Sensaenya"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </LiyonField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <LiyonField label="ตำแหน่งงาน / ภาระหน้าที่ (ไทย) *" htmlFor="field-pos-th">
                  <input
                    id="field-pos-th"
                    value={formPositionTh}
                    onChange={(e) => setFormPositionTh(e.target.value)}
                    placeholder="เช่น อาจารย์ประจำหลักสูตรพุทธศาสตรบัณฑิต สาขาวิชาศาสนาและปรัชญา"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    required
                  />
                </LiyonField>

                <LiyonField label="Position (English)" htmlFor="field-pos-en">
                  <input
                    id="field-pos-en"
                    value={formPositionEn}
                    onChange={(e) => setFormPositionEn(e.target.value)}
                    placeholder="e.g. Lecturer in Religion and Philosophy"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </LiyonField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <LiyonField label="สายงานบุคลากร *" htmlFor="field-type">
                  <LiyonSelect
                    id="field-type"
                    value={formType}
                    onChange={(e) =>
                      setFormType(e.target.value as "EXECUTIVE" | "ACADEMIC" | "SUPPORT" | "SPECIAL")
                    }
                  >
                    <option value="ACADEMIC">สายวิชาการ (อาจารย์/นักวิจัย)</option>
                    <option value="SPECIAL">อาจารย์พิเศษ (วิทยากร/อาจารย์รับเชิญ)</option>
                    <option value="SUPPORT">สายสนับสนุน (เจ้าหน้าที่)</option>
                    <option value="EXECUTIVE">สายผู้บริหาร</option>
                  </LiyonSelect>
                </LiyonField>

                <LiyonField label="ภาควิชา / สังกัด" htmlFor="field-dept">
                  <LiyonSelect
                    id="field-dept"
                    value={formDepartmentId}
                    onChange={(e) => setFormDepartmentId(e.target.value)}
                  >
                    <option value="">-- ไม่ระบุภาควิชา --</option>
                    {departmentList.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nameTh}
                      </option>
                    ))}
                  </LiyonSelect>
                </LiyonField>

                <LiyonField label="ลำดับการแสดงผล" htmlFor="field-order">
                  <input
                    type="number"
                    id="field-order"
                    value={formOrderIndex}
                    onChange={(e) => setFormOrderIndex(Number(e.target.value))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </LiyonField>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="rounded border-input text-primary focus:ring-primary w-4 h-4"
                  />
                  <span>เปิดแสดงข้อมูลบนหน้าพอร์ทัลสาธารณะ (Active)</span>
                </label>
              </div>
            </div>
          )}

          {/* Tab 2: Academic & Experience */}
          {activeTab === "academic" && (
            <div className="space-y-4">
              <LiyonField
                label="ประวัติการศึกษา (Education)"
                htmlFor="field-education"
                hint="ขึ้นบรรทัดใหม่ตามแต่ละปีหรือระดับการศึกษา (เช่น พ.ศ. ๒๕๖๘ พธ.ด. (ปรัชญา)...)"
              >
                <textarea
                  id="field-education"
                  rows={4}
                  value={formEducationTh}
                  onChange={(e) => setFormEducationTh(e.target.value)}
                  placeholder="พ.ศ. ๒๕๔๒ พธ.บ. (ภาษาไทย) มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย&#10;พ.ศ. ๒๕๔๗ พธ.ม. (พระพุทธศาสนา)...&#10;พ.ศ. ๒๕๖๘ พธ.ด. (ปรัชญา)..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring font-sans"
                />
              </LiyonField>

              <LiyonField
                label="ประสบการณ์การสอน / ภาระหน้าที่งาน (Teaching Experiences)"
                htmlFor="field-experiences"
                hint="ระบุประสบการณ์สอนในระดับปริญญาตรี โท เอก หรือภาระงานหลักสูตร"
              >
                <div className="space-y-2">
                  <textarea
                    id="field-experiences"
                    rows={4}
                    value={formExperiencesTh}
                    onChange={(e) => setFormExperiencesTh(e.target.value)}
                    placeholder="อาจารย์ประจำหลักสูตรพุทธศาสตรบัณฑิต...&#10;อาจารย์ผู้สอนรายวิชา: ปรัชญาเบื้องต้น, พุทธปรัชญาเถรวาท..."
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring font-sans leading-relaxed"
                  />
                  {editingTeachingCourses.length > 0 && (
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-primary/5 border border-primary/20 text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <BookOpen className="w-3.5 h-3.5 text-primary" />
                        <span>
                          มีรายวิชาที่สอนในระบบ <strong>{editingTeachingCourses.length} รายวิชา</strong>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab("teaching")}
                        className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <span>จัดการรายวิชาแบบละเอียดที่แท็บ &quot;รายวิชาที่สอน&quot; →</span>
                      </button>
                    </div>
                  )}
                </div>
              </LiyonField>

              {/* Positions and Appointments Section (ตรงตามแบบ มจร คณะสังคมศาสตร์) */}
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-2.5">
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Award className="w-4 h-4 text-primary" />
                      <span>ตำแหน่งปัจจุบันและคำสั่งแต่งตั้ง (ก. วิชาการ/บริหาร และ ข. กรรมการ)</span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ระบุตำแหน่งทางวิชาการ/บริหาร หรือตำแหน่งกรรมการ พร้อมแนบไฟล์สำเนาคำสั่งแต่งตั้ง (PDF/JPG)
                    </p>
                  </div>
                  {!showAddPosForm && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setShowAddPosForm(true)}
                      className="gap-1.5 cursor-pointer text-xs h-8 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>เพิ่มตำแหน่งและแนบคำสั่ง</span>
                    </Button>
                  )}
                </div>

                {/* Form to add position */}
                {showAddPosForm && (
                  <div className="p-3.5 bg-background rounded-lg border border-primary/30 space-y-3 shadow-xs">
                    <div className="font-semibold text-xs text-primary flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>แบบฟอร์มเพิ่มตำแหน่งและแนบหลักฐาน</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <LiyonField label="หมวดหมู่ตำแหน่ง *" htmlFor="pos-cat">
                        <LiyonSelect
                          id="pos-cat"
                          value={newPosCategory}
                          onChange={(e) =>
                            setNewPosCategory(e.target.value as "ACADEMIC_ADMIN" | "COMMITTEE")
                          }
                        >
                          <option value="ACADEMIC_ADMIN">ก. ตำแหน่งทางวิชาการ / บริหาร</option>
                          <option value="COMMITTEE">ข. ตำแหน่งกรรมการประจำหน่วยงาน</option>
                        </LiyonSelect>
                      </LiyonField>

                      <div className="sm:col-span-2">
                        <LiyonField label="ชื่อตำแหน่ง *" htmlFor="pos-title">
                          <input
                            id="pos-title"
                            value={newPosTitle}
                            onChange={(e) => setNewPosTitle(e.target.value)}
                            placeholder="เช่น อาจารย์ประจำหลักสูตรพุทธศาสตรบัณฑิต, หัวหน้าภาควิชา..."
                            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                            required
                          />
                        </LiyonField>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <LiyonField label="เลขที่คำสั่ง / วันที่แต่งตั้ง (ถ้ามี)" htmlFor="pos-order">
                        <input
                          id="pos-order"
                          value={newPosOrderNo}
                          onChange={(e) => setNewPosOrderNo(e.target.value)}
                          placeholder="เช่น คำสั่งที่ ๑๒/๒๕๖๗ หรือ ๑ พ.ย. ๒๕๖๗"
                          className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </LiyonField>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label htmlFor="pos-file" className="text-xs font-medium text-foreground">
                            ไฟล์สำเนาคำสั่งแต่งตั้ง (PDF / JPG)
                          </label>
                          <div className="flex items-center gap-1">
                            <input
                              type="file"
                              ref={posFileInputRef}
                              onChange={handlePosFileUpload}
                              accept=".pdf,.jpg,.jpeg,.png,.webp"
                              className="hidden"
                            />
                            <button
                              type="button"
                              disabled={isUploadingPosFile}
                              onClick={() => posFileInputRef.current?.click()}
                              className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Upload className="w-3 h-3" />
                              <span>{isUploadingPosFile ? "กำลังอัปโหลด..." : "อัปโหลดไฟล์ (PDF/JPG)"}</span>
                            </button>
                          </div>
                        </div>
                        <input
                          id="pos-file"
                          value={newPosFileUrl}
                          onChange={(e) => setNewPosFileUrl(e.target.value)}
                          placeholder="/uploads/personnel/appointments/... หรือ URL ลิงก์"
                          className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/50">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAddPosForm(false)}
                        className="text-xs h-7 cursor-pointer"
                      >
                        ยกเลิก
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddPosition}
                        className="text-xs h-7 cursor-pointer gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>บันทึกตำแหน่ง</span>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Table of positions */}
                {editingPositions.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg bg-background">
                    ยังไม่มีข้อมูลตำแหน่งและคำสั่งแต่งตั้ง กดปุ่ม &quot;+ เพิ่มตำแหน่งและแนบคำสั่ง&quot; ด้านบนเพื่อเพิ่มได้ทันที
                  </div>
                ) : (
                  <div className="space-y-2">
                    {editingPositions.map((pos) => {
                      const fileType = detectAttachmentType(pos.fileUrl);
                      return (
                        <div
                          key={pos.id}
                          className="p-2.5 bg-background rounded-lg border border-border flex items-center justify-between gap-3 text-xs hover:border-primary/40 transition-colors"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                  pos.category === "ACADEMIC_ADMIN"
                                    ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20"
                                    : "bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20"
                                }`}
                              >
                                {pos.category === "ACADEMIC_ADMIN" ? "ก. วิชาการ/บริหาร" : "ข. กรรมการ"}
                              </span>
                              <span className="font-semibold text-foreground">{pos.title}</span>
                              {pos.orderNo && (
                                <span className="text-muted-foreground text-[11px]">
                                  ({pos.orderNo})
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {pos.fileUrl ? (
                              <a
                                href={pos.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 rounded-full text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-1 shadow-xs transition-colors"
                                title="เปิดดูเอกสารหลักฐานคำสั่ง"
                              >
                                <span>{fileType === "pdf" ? "(PDF)" : fileType === "jpg" || fileType === "png" ? "(jpg.)" : "(ลิงก์)"}</span>
                                <ExternalLink className="w-3 h-3 opacity-80" />
                              </a>
                            ) : (
                              <span className="text-[11px] text-muted-foreground italic">ไม่มีไฟล์แนบ</span>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeletePosition(pos.id)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                              title="ลบตำแหน่งนี้"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <LiyonField
                label="ประวัติย่อ / ความเชี่ยวชาญพิเศษ (Bio & Expertise)"
                htmlFor="field-bio"
              >
                <textarea
                  id="field-bio"
                  rows={3}
                  value={formBioTh}
                  onChange={(e) => setFormBioTh(e.target.value)}
                  placeholder="ความเชี่ยวชาญด้านพระไตรปิฎกศึกษา ภาษาไทย และพุทธปรัชญาเถรวาท..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring font-sans"
                />
              </LiyonField>
            </div>
          )}

          
          {/* Tab 3: Teaching Courses (แยกปี & ระดับ) */}
          {activeTab === "teaching" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-muted/30 rounded-xl border border-border">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span>รายวิชาที่สอนตามปี & ระดับการศึกษา ({editingTeachingCourses.length} วิชา)</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    จัดเก็บและแสดงรายวิชาที่อาจารย์สอน แยกตามปีการศึกษาและระดับปริญญาตรี โท เอก
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSyncingCourses}
                    onClick={handleSyncFromTimetables}
                    className="gap-1.5 h-8 text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30 font-medium"
                    title="ค้นหารายวิชาของอาจารย์จากตารางเรียนและคอร์สเรียนในระบบ"
                  >
                    {isSyncingCourses ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                        <span>กำลังดึงข้อมูล...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>ดึงจากตารางสอน</span>
                      </>
                    )}
                  </Button>

                  <div className="relative group">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5 h-8 text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>เพิ่มวิชามาตรฐาน มจร ▾</span>
                    </Button>
                    <div className="absolute right-0 top-full mt-1 hidden group-hover:flex flex-col bg-popover text-popover-foreground border border-border rounded-lg shadow-lg z-20 py-1 min-w-[190px]">
                      <button
                        type="button"
                        onClick={() => handleAddStandardMcuCourses("BACHELOR")}
                        className="px-3 py-1.5 text-xs text-left hover:bg-muted transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <span>🏛️</span>
                        <span>ระดับปริญญาตรี (พธ.บ.)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddStandardMcuCourses("MASTER")}
                        className="px-3 py-1.5 text-xs text-left hover:bg-muted transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <span>📜</span>
                        <span>ระดับปริญญาโท (พธ.ม.)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddStandardMcuCourses("DOCTORAL")}
                        className="px-3 py-1.5 text-xs text-left hover:bg-muted transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <span>🪷</span>
                        <span>ระดับปริญญาเอก (พธ.ด.)</span>
                      </button>
                    </div>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    onClick={handleOpenAddCourse}
                    className="gap-1.5 h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มรายวิชาเอง</span>
                  </Button>
                </div>
              </div>

              {/* Stats badges & Filters */}
              {editingTeachingCourses.length > 0 && (
                <div className="p-3 bg-muted/40 rounded-xl border border-border/80 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    {/* Level Filter Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setCourseFilterLevel("ALL")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                          courseFilterLevel === "ALL"
                            ? "bg-primary text-primary-foreground border-primary shadow-2xs font-semibold"
                            : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        ทั้งหมด ({editingTeachingCourses.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setCourseFilterLevel(courseFilterLevel === "BACHELOR" ? "ALL" : "BACHELOR")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border flex items-center gap-1 ${
                          courseFilterLevel === "BACHELOR"
                            ? "bg-blue-600 text-white border-blue-600 shadow-2xs font-semibold"
                            : "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 hover:bg-blue-500/20"
                        }`}
                      >
                        <span>🏛️</span>
                        <span>ป.ตรี ({editingTeachingCourses.filter((c) => c.level === "BACHELOR").length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCourseFilterLevel(courseFilterLevel === "MASTER" ? "ALL" : "MASTER")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border flex items-center gap-1 ${
                          courseFilterLevel === "MASTER"
                            ? "bg-purple-600 text-white border-purple-600 shadow-2xs font-semibold"
                            : "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20 hover:bg-purple-500/20"
                        }`}
                      >
                        <span>📜</span>
                        <span>ป.โท ({editingTeachingCourses.filter((c) => c.level === "MASTER").length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCourseFilterLevel(courseFilterLevel === "DOCTORAL" ? "ALL" : "DOCTORAL")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border flex items-center gap-1 ${
                          courseFilterLevel === "DOCTORAL"
                            ? "bg-amber-600 text-white border-amber-600 shadow-2xs font-semibold"
                            : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 hover:bg-amber-500/20"
                        }`}
                      >
                        <span>🪷</span>
                        <span>ป.เอก ({editingTeachingCourses.filter((c) => c.level === "DOCTORAL").length})</span>
                      </button>
                    </div>

                    {/* Year Filter Dropdown & Search Input */}
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      {/* Year select */}
                      <div className="relative min-w-[135px]">
                        <select
                          value={courseFilterYear}
                          onChange={(e) => setCourseFilterYear(e.target.value)}
                          className="w-full text-xs rounded-lg border border-input bg-background pl-2.5 pr-6 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring font-medium"
                          title="กรองตามปีการศึกษา"
                        >
                          <option value="ALL">📅 ทุกปีการศึกษา</option>
                          {availableCourseYears.map((yr) => (
                            <option key={yr} value={yr}>
                              ปี พ.ศ. {yr} ({editingTeachingCourses.filter((c) => (normalizeCourseYear(c.year) || c.year) === yr).length} วิชา)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quick Search */}
                      <div className="relative flex-1 sm:w-44">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="text"
                          value={courseFilterSearch}
                          onChange={(e) => setCourseFilterSearch(e.target.value)}
                          placeholder="ค้นหารหัส/ชื่อวิชา..."
                          className="w-full text-xs rounded-lg border border-input bg-background pl-8 pr-6 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                        {courseFilterSearch && (
                          <button
                            type="button"
                            onClick={() => setCourseFilterSearch("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                          >
                            ×
                          </button>
                        )}
                      </div>

                      {/* Reset filter button if any filter is active */}
                      {(courseFilterLevel !== "ALL" || courseFilterYear !== "ALL" || courseFilterSearch.trim()) && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCourseFilterLevel("ALL");
                            setCourseFilterYear("ALL");
                            setCourseFilterSearch("");
                          }}
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground shrink-0"
                          title="ล้างตัวกรองทั้งหมด"
                        >
                          ล้างตัวกรอง
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Filter Status Text if filtered */}
                  {(courseFilterLevel !== "ALL" || courseFilterYear !== "ALL" || courseFilterSearch.trim()) && (
                    <div className="text-[11px] text-muted-foreground flex items-center justify-between border-t border-border/50 pt-1.5">
                      <span>
                        พบ <strong>{filteredTeachingCourses.length}</strong> จากทั้งหมด {editingTeachingCourses.length} รายวิชา
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Course Form (Add/Edit) */}
              {showCourseForm && (
                <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-primary/20 pb-2">
                    <h4 className="text-sm font-bold text-foreground">
                      {editingCourseId ? "แก้ไขรายวิชาที่สอน" : "เพิ่มรายวิชาที่สอนใหม่"}
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={resetCourseForm}
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      ยกเลิก
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <LiyonField label="รหัสวิชา *" htmlFor="cf-code">
                      <input
                        id="cf-code"
                        value={cCode}
                        onChange={(e) => setCCode(e.target.value)}
                        placeholder="เช่น 000 135"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                      />
                    </LiyonField>

                    <LiyonField label="ระดับการศึกษา *" htmlFor="cf-level">
                      <LiyonSelect
                        id="cf-level"
                        value={cLevel}
                        onChange={(e) => setCLevel(e.target.value as DegreeLevel)}
                      >
                        <option value="BACHELOR">ปริญญาตรี (พธ.บ.)</option>
                        <option value="MASTER">ปริญญาโท (พธ.ม.)</option>
                        <option value="DOCTORAL">ปริญญาเอก (พธ.ด.)</option>
                      </LiyonSelect>
                    </LiyonField>

                    <LiyonField label="ปีการศึกษา (พ.ศ.)" htmlFor="cf-year">
                      <input
                        id="cf-year"
                        value={cYear}
                        onChange={(e) => setCYear(e.target.value)}
                        placeholder="เช่น 2569"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </LiyonField>

                    <div className="grid grid-cols-2 gap-2">
                      <LiyonField label="ภาคเรียน" htmlFor="cf-semester">
                        <LiyonSelect
                          id="cf-semester"
                          value={cSemester}
                          onChange={(e) => setCSemester(e.target.value)}
                        >
                          <option value="1">ภาคเรียนที่ 1</option>
                          <option value="2">ภาคเรียนที่ 2</option>
                          <option value="3">ภาคฤดูร้อน</option>
                        </LiyonSelect>
                      </LiyonField>

                      <LiyonField label="หน่วยกิต" htmlFor="cf-credits">
                        <input
                          type="number"
                          id="cf-credits"
                          value={cCredits}
                          onChange={(e) => setCCredits(Number(e.target.value))}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </LiyonField>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <LiyonField label="ชื่อวิชา (ภาษาไทย) *" htmlFor="cf-nameth">
                      <input
                        id="cf-nameth"
                        value={cNameTh}
                        onChange={(e) => setCNameTh(e.target.value)}
                        placeholder="เช่น พระไตรปิฎกศึกษา"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </LiyonField>

                    <LiyonField label="Course Name (English)" htmlFor="cf-nameen">
                      <input
                        id="cf-nameen"
                        value={cNameEn}
                        onChange={(e) => setCNameEn(e.target.value)}
                        placeholder="e.g. Tipitaka Studies"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </LiyonField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <LiyonField label="หลักสูตร / สาขาวิชา" htmlFor="cf-prog">
                        <input
                          id="cf-prog"
                          value={cProgramTh}
                          onChange={(e) => setCProgramTh(e.target.value)}
                          placeholder="เช่น หลักสูตรพุทธศาสตรบัณฑิต (พธ.บ.) สาขาวิชาพระพุทธศาสนา"
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </LiyonField>
                    </div>

                    <LiyonField label="บทบาทผู้สอน" htmlFor="cf-role">
                      <input
                        id="cf-role"
                        value={cRole}
                        onChange={(e) => setCRole(e.target.value)}
                        placeholder="เช่น อาจารย์ผู้สอนประจำวิชา"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </LiyonField>
                  </div>

                  <LiyonField label="หมายเหตุ / ห้องเรียน (ถ้ามี)" htmlFor="cf-desc">
                    <input
                      id="cf-desc"
                      value={cDescription}
                      onChange={(e) => setCDescription(e.target.value)}
                      placeholder="เช่น ห้องเรียน B402 หรือ บรรยายวันพุธ 09.00 - 11.30 น."
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </LiyonField>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={resetCourseForm}
                      className="text-xs"
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveCourse}
                      className="text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {editingCourseId ? "บันทึกการแก้ไข" : "เพิ่มลงรายการ"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Course list rendering */}
              {editingTeachingCourses.length === 0 ? (
                <div className="p-8 text-center bg-muted/20 rounded-xl border border-dashed border-border space-y-2">
                  <BookOpen className="w-8 h-8 text-muted-foreground mx-auto opacity-50" />
                  <p className="text-sm font-medium text-foreground">
                    ยังไม่มีข้อมูลรายวิชาที่สอนของอาจารย์ท่านนี้
                  </p>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    กดปุ่ม <strong>&quot;⚡ ดึงจากตารางสอน&quot;</strong> เพื่อดึงข้อมูลรายวิชาที่อาจารย์ท่านนี้สอนจากตารางเรียนตามหลักสูตรอัตโนมัติ หรือกดปุ่ม <strong>&quot;+ เพิ่มรายวิชาเอง&quot;</strong>
                  </p>
                </div>
              ) : filteredTeachingCourses.length === 0 ? (
                <div className="p-8 text-center bg-muted/20 rounded-xl border border-dashed border-border space-y-2">
                  <Search className="w-8 h-8 text-muted-foreground mx-auto opacity-50" />
                  <p className="text-sm font-medium text-foreground">
                    ไม่พบรายวิชาที่ตรงกับเงื่อนไขตัวกรอง
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ลองเปลี่ยนระดับการศึกษา ปีการศึกษา หรือคำค้นหา
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCourseFilterLevel("ALL");
                      setCourseFilterYear("ALL");
                      setCourseFilterSearch("");
                    }}
                    className="h-7 text-xs mt-1"
                  >
                    ล้างตัวกรองทั้งหมด
                  </Button>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {filteredTeachingCourses.map((c) => {
                    const style = getDegreeLevelColor(c.level);
                    return (
                      <div
                        key={c.id}
                        className="p-3 bg-card rounded-lg border border-border hover:border-primary/40 transition-colors flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full font-bold border text-[10px] ${style.bg}`}>
                              {style.icon} {formatDegreeLevelLabel(c.level)}
                            </span>
                            <span className="font-mono font-bold text-foreground">
                              {c.courseCode}
                            </span>
                            <span className="font-semibold text-foreground truncate">
                              {c.courseNameTh}
                            </span>
                            {c.courseNameEn && (
                              <span className="text-muted-foreground italic truncate">
                                ({c.courseNameEn})
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-muted-foreground text-[11px] flex-wrap">
                            <span>ปี พ.ศ. {c.year} (ภาคเรียนที่ {c.semester})</span>
                            <span>•</span>
                            <span className="font-medium text-foreground">{c.credits} หน่วยกิต</span>
                            <span>•</span>
                            <span>{c.programTh}</span>
                            <span>•</span>
                            <span className="text-primary font-medium">{c.role}</span>
                            {c.description && (
                              <>
                                <span>•</span>
                                <span>{c.description}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCourse(c)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            title="แก้ไขวิชานี้"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCourse(c.id)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            title="ลบวิชานี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Contact & Image */}
          {activeTab === "contact" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <LiyonField label="อีเมลติดต่อ (Email)" htmlFor="field-email">
                  <input
                    type="email"
                    id="field-email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="chaiya.sen@mcu.ac.th"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </LiyonField>

                <LiyonField label="เบอร์ติดต่อที่ทำงาน (Work Phone Number)" htmlFor="field-phone">
                  <input
                    id="field-phone"
                    value={formPhoneNumber}
                    onChange={(e) => setFormPhoneNumber(e.target.value)}
                    placeholder="035-248-000 หรือ 098-387-5997"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </LiyonField>
              </div>

              <LiyonField
                label="ช่องทางการติดต่อเพิ่มเติม (Contact Info)"
                htmlFor="field-contact-info"
                hint="เช่น Facebook, Line ID, เบอร์โทรสาร หรือช่องทางโซเชียลมีเดีย"
              >
                <input
                  id="field-contact-info"
                  value={formContactInfo}
                  onChange={(e) => setFormContactInfo(e.target.value)}
                  placeholder="Tel. 098 387 5997, Facebook: ไชยา เสนแสนยา, Line ID: 0983875997"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </LiyonField>

              <LiyonField
                label="สถานที่ทำงาน / ห้องพักอาจารย์ (Workplace / Office Location)"
                htmlFor="field-office-location"
                hint="เช่น อาคารเรียนรวม ชั้น 3 ห้อง 305 คณะพุทธศาสตร์ มจร วังน้อย อยุธยา"
              >
                <div className="relative">
                  <input
                    id="field-office-location"
                    value={formOfficeLocation}
                    onChange={(e) => setFormOfficeLocation(e.target.value)}
                    placeholder="ห้อง 305 อาคารเรียนรวม คณะพุทธศาสตร์ มจร วังน้อย อยุธยา"
                    className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <MapPin className="w-4 h-4 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </LiyonField>

              <LiyonField
                label="ลิงก์โปรไฟล์ผลงาน Google Scholar (Google Scholar Profile URL)"
                htmlFor="field-google-scholar"
                hint="เช่น https://scholar.google.com/citations?user=... หรือลิงก์หน้าคลังผลงานวิจัย"
              >
                <div className="relative">
                  <input
                    id="field-google-scholar"
                    value={formGoogleScholarUrl}
                    onChange={(e) => setFormGoogleScholarUrl(e.target.value)}
                    placeholder="https://scholar.google.com/citations?user=..."
                    className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring font-mono text-xs"
                  />
                  <GraduationCap className="w-4 h-4 text-sky-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {(formFirstNameTh || formFirstNameEn) && (
                  <div className="flex items-center justify-between gap-2 pt-1.5 text-xs">
                    <span className="text-[11px] text-muted-foreground">
                      หากมีบัญชีทางการ ให้คัดลอกลิงก์มาวางในช่องนี้
                    </span>
                    <a
                      href={`https://scholar.google.com/scholar?q=${encodeURIComponent(
                        `"${[formFirstNameTh, formLastNameTh].filter(Boolean).join(" ")}"` +
                          (formFirstNameEn ? ` OR "${[formFirstNameEn, formLastNameEn].filter(Boolean).join(" ")}"` : "")
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline shrink-0"
                    >
                      <Search className="w-3 h-3" />
                      <span>🔍 ค้นหาผลงานอาจารย์ท่านนี้บน Google Scholar</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  </div>
                )}
              </LiyonField>

              {/* Photo Upload & Portrait Preview Section */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Camera className="w-4 h-4 text-primary" />
                      <span>รูปถ่ายโปรไฟล์ (ภาพใบหน้าและรูปร่าง)</span>
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      อัปโหลดรูปภาพแนวตั้ง (แนะนำอัตราส่วน 3:4) ระบบจะแสดงภาพใบหน้าและรูปร่างอย่างคมชัด
                    </p>
                  </div>
                  {formImageUrl && (
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      มีรูปภาพแล้ว
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  {/* Portrait Preview Box */}
                  <div className="w-36 sm:w-44 shrink-0 mx-auto sm:mx-0">
                    <div className="aspect-[3/4] w-full rounded-xl border-2 border-dashed border-border bg-muted/30 overflow-hidden relative shadow-sm flex flex-col items-center justify-center group hover:border-primary transition-all">
                      {formImageUrl ? (
                        <>
                          <Image
                            src={formImageUrl}
                            alt="รูปภาพอาจารย์"
                            width={176}
                            height={235}
                            unoptimized
                            className="w-full h-full object-cover object-top"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <a
                              href={formImageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 bg-white/90 text-foreground rounded-full hover:bg-white text-xs shadow"
                              title="ดูรูปขนาดเต็ม"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            <button
                              type="button"
                              onClick={() => setFormImageUrl("")}
                              className="p-1.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 text-xs shadow cursor-pointer"
                              title="ลบรูป"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/60 backdrop-blur-xs text-[10px] text-white text-center py-0.5 px-1 rounded font-medium">
                            พรีวิว: ใบหน้า & รูปร่าง
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-3 space-y-2">
                          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                            <Camera className="w-6 h-6" />
                          </div>
                          <div className="text-xs font-medium text-foreground">ยังไม่มีรูปถ่าย</div>
                          <p className="text-[10px] text-muted-foreground leading-tight">
                            คลิกปุ่มอัปโหลดรูปภาพด้านขวา
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Upload Controls & URL Input */}
                  <div className="flex-1 space-y-3.5 w-full">
                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1.5">
                        อัปโหลดไฟล์รูปภาพจากคอมพิวเตอร์
                      </label>
                      <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                        <input
                          type="file"
                          ref={imageInputRef}
                          onChange={handleImageUpload}
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isUploadingImage}
                          onClick={() => imageInputRef.current?.click()}
                          className="gap-2 shrink-0 h-9 bg-primary/5 hover:bg-primary/10 border-primary/30 text-primary font-medium"
                        >
                          {isUploadingImage ? (
                            <>
                              <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              <span>กำลังอัปโหลดรูปภาพ...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              <span>เลือกรูปภาพจากเครื่อง</span>
                            </>
                          )}
                        </Button>
                        {formImageUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setFormImageUrl("")}
                            className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 h-9"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            ลบรูปภาพ
                          </Button>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                        รองรับไฟล์ JPG, PNG, WEBP ขนาดไม่เกิน 10MB ระบบจะจัดเก็บลงเซิร์ฟเวอร์โดยตรง และพร้อมแสดงผลทันทีเมื่อกดบันทึก
                      </p>
                    </div>

                    <div className="pt-2 border-t border-border">
                      <label htmlFor="field-image-url" className="text-xs font-semibold text-foreground block mb-1.5">
                        หรือระบุ URL รูปภาพโดยตรง (Image URL)
                      </label>
                      <input
                        id="field-image-url"
                        value={formImageUrl}
                        onChange={(e) => setFormImageUrl(e.target.value)}
                        placeholder="/uploads/personnel/... หรือ https://..."
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                      />
                      {formImageUrl && (
                        <div className="mt-1 text-[11px] text-muted-foreground truncate">
                          {formImageUrl.startsWith("/uploads/")
                            ? "📁 รูปภาพที่จัดเก็บบนเซิร์ฟเวอร์ระบบ (Local Upload)"
                            : "🌐 รูปภาพจากเว็บภายนอก (External Link)"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Linked Research Publications */}
          {activeTab === "research" && (
            <div className="space-y-4">
              {!editingItem ? (
                <div className="p-8 text-center bg-muted/20 rounded-lg border border-dashed border-border text-muted-foreground text-sm">
                  กรุณาบันทึกข้อมูลอาจารย์ใหม่ในแท็บ &quot;ข้อมูลทั่วไป&quot; ให้เสร็จสิ้นก่อน จึงจะสามารถเพิ่มผลงานวิจัยผูกกับอาจารย์ได้
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        ผลงานวิจัยและวิชาการของอาจารย์ ({editingResearchList.length} เรื่อง)
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        ผลงานวิจัย บทความวิชาการ และดุษฎีนิพนธ์ที่ผูกกับอาจารย์ท่านนี้
                      </p>
                    </div>

                    {!showAddResearchForm && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setShowAddResearchForm(true)}
                        className="gap-1.5 cursor-pointer text-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>เพิ่มผลงานวิจัยให้อาจารย์</span>
                      </Button>
                    )}
                  </div>

                  {/* Inline Form to Add Research */}
                  {showAddResearchForm && (
                    <div className="p-4 bg-muted/30 rounded-lg border border-border space-y-3">
                      <div className="font-semibold text-xs text-primary flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>แบบฟอร์มเพิ่มผลงานวิจัยของ {formFirstNameTh} {formLastNameTh}</span>
                      </div>

                      <div className="space-y-2">
                        <LiyonField label="ชื่อบทความวิจัย / บทความวิชาการ (ไทย) *" htmlFor="new-pub-title">
                          <input
                            id="new-pub-title"
                            value={newPubTitleTh}
                            onChange={(e) => setNewPubTitleTh(e.target.value)}
                            placeholder="ระบุชื่อเรื่องบทความวิจัย"
                            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                            required
                          />
                        </LiyonField>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <LiyonField label="ชื่อวารสารที่ตีพิมพ์ *" htmlFor="new-pub-journal">
                            <input
                              id="new-pub-journal"
                              value={newPubJournal}
                              onChange={(e) => setNewPubJournal(e.target.value)}
                              placeholder="เช่น วารสาร มจร ปรัชญาปริทรรศน์"
                              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                              required
                            />
                          </LiyonField>

                          <LiyonField label="ประเภทผลงาน" htmlFor="new-pub-type">
                            <LiyonSelect
                              id="new-pub-type"
                              value={newPubType}
                              onChange={(e) =>
                                setNewPubType(e.target.value as "RESEARCH" | "ACADEMIC" | "DISSERTATION")
                              }
                            >
                              <option value="RESEARCH">บทความวิจัย (Research)</option>
                              <option value="ACADEMIC">บทความวิชาการ (Academic)</option>
                              <option value="DISSERTATION">ดุษฎีนิพนธ์ / วิทยานิพนธ์</option>
                            </LiyonSelect>
                          </LiyonField>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <LiyonField label="ปีที่ตีพิมพ์ (พ.ศ.)" htmlFor="new-pub-year">
                            <input
                              id="new-pub-year"
                              value={newPubYear}
                              onChange={(e) => setNewPubYear(e.target.value)}
                              placeholder="๒๕๖๙"
                              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                          </LiyonField>

                          <LiyonField label="ระดับกลุ่มวารสาร" htmlFor="new-pub-tier">
                            <LiyonSelect
                              id="new-pub-tier"
                              value={newPubTier}
                              onChange={(e) => setNewPubTier(e.target.value)}
                            >
                              <option value="TCI กลุ่ม 1">TCI กลุ่ม 1</option>
                              <option value="TCI กลุ่ม 2">TCI กลุ่ม 2</option>
                              <option value="นานาชาติ / Scopus">นานาชาติ / Scopus</option>
                              <option value="อื่นๆ">อื่นๆ</option>
                            </LiyonSelect>
                          </LiyonField>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label htmlFor="new-pub-url" className="text-xs font-medium text-foreground">
                                ไฟล์บทความวิจัย หรือ URL ลิงก์
                              </label>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="file"
                                  ref={researchFileInputRef}
                                  onChange={handleResearchFileUpload}
                                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                                  className="hidden"
                                />
                                <button
                                  type="button"
                                  disabled={isUploadingResearchFile}
                                  onClick={() => researchFileInputRef.current?.click()}
                                  className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <Upload className="w-3 h-3" />
                                  <span>{isUploadingResearchFile ? "กำลังอัปโหลด..." : "อัปโหลดไฟล์ (PDF/JPG)"}</span>
                                </button>
                              </div>
                            </div>
                            <input
                              id="new-pub-url"
                              value={newPubUrl}
                              onChange={(e) => setNewPubUrl(e.target.value)}
                              placeholder="/uploads/personnel/research/... หรือ https://..."
                              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                            />
                            {newPubUrl && (
                              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-0.5">
                                {detectAttachmentType(newPubUrl) === "pdf" ? (
                                  <span className="font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">(PDF)</span>
                                ) : detectAttachmentType(newPubUrl) === "jpg" || detectAttachmentType(newPubUrl) === "png" ? (
                                  <span className="font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">(JPG)</span>
                                ) : (
                                  <span className="font-medium text-purple-600 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800">(Link)</span>
                                )}
                                <a href={newPubUrl} target="_blank" rel="noreferrer" className="hover:underline truncate max-w-xs text-primary font-medium">
                                  เปิดดูไฟล์ที่แนบ
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAddResearchForm(false)}
                          disabled={isPending}
                          className="text-xs h-7 cursor-pointer"
                        >
                          ยกเลิก
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAddResearchToTeacher}
                          disabled={isPending}
                          className="text-xs h-7 cursor-pointer gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>บันทึกผลงาน</span>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Publications List */}
                  {editingResearchList.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                      ยังไม่มีผลงานวิจัยของอาจารย์ท่านนี้ กดปุ่ม &quot;เพิ่มผลงานวิจัยให้อาจารย์&quot; ด้านบนเพื่อเพิ่มได้ทันที
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {editingResearchList.map((pub, idx) => (
                        <div
                          key={pub.id}
                          className="p-3 bg-card rounded-md border border-border flex items-start justify-between gap-3 text-xs hover:border-primary/40 transition-colors"
                        >
                          <div className="space-y-1">
                            <div className="font-semibold text-foreground flex items-center gap-2 flex-wrap">
                              <span className="text-muted-foreground">{idx + 1}.</span>
                              <span>{pub.titleTh}</span>
                              {pub.tier && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {pub.tier}
                                </span>
                              )}
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                                {pub.type}
                              </span>
                            </div>

                            <p className="text-muted-foreground">
                              {pub.journalName} {pub.volume && `· ${pub.volume}`} {pub.publicationYear && `· พ.ศ. ${pub.publicationYear}`}
                            </p>

                            {pub.url && (
                              <a
                                href={pub.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-primary hover:underline text-[11px] pt-0.5"
                              >
                                {detectAttachmentType(pub.url) === "pdf" ? (
                                  <span className="font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-800">(PDF) เอกสารวิจัย</span>
                                ) : detectAttachmentType(pub.url) === "jpg" || detectAttachmentType(pub.url) === "png" ? (
                                  <span className="font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">(jpg.) ไฟล์ภาพ</span>
                                ) : (
                                  <span>เปิดดูบทความวิจัย (Link)</span>
                                )}
                                <ExternalLink className="w-2.5 h-2.5 opacity-80" />
                              </a>
                            )}
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteResearchFromTeacher(pub.id, pub.titleTh)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive cursor-pointer shrink-0"
                            title="ลบผลงานวิจัยนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </LiyonDialogBody>

        <LiyonDialogFooter className="p-4 border-t border-border flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs text-muted-foreground flex items-center gap-2.5 flex-wrap">
            {editingItem && (
              <Link
                href={`/personnel/research?author=${editingItem.id}`}
                className="text-primary hover:underline flex items-center gap-1 font-medium"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>ผลงานวิจัย ({editingResearchList.length})</span>
              </Link>
            )}
            <span className="hidden sm:inline text-border">|</span>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <span>💡</span>
              <span>นำเข้า/ส่งออกไฟล์เฉพาะอาจารย์ท่านนี้ได้ที่ปุ่มด้านบน</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(false)}
              disabled={isPending}
              className="cursor-pointer"
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isPending}
              className="cursor-pointer gap-2"
            >
              {isPending ? "กำลังบันทึก..." : "บันทึกข้อมูลอาจารย์"}
            </Button>
          </div>
        </LiyonDialogFooter>
      </LiyonDialog>

      {/* Import Modal Dialog */}
      <LiyonDialog open={importModalOpen} onOpenChange={setImportModalOpen} wide>
        <LiyonDialogCloseButton label="ปิดหน้าต่าง" />
        <LiyonDialogHeader
          title="นำเข้าข้อมูลอาจารย์และบุคลากร (Import)"
          description="รองรับทั้งไฟล์ Excel / CSV และไฟล์ JSON ครบชุด (รวมผลงานวิจัย วุฒิการศึกษา และภาระงานสอน)"
        />

        <LiyonDialogBody className="overflow-y-auto p-4 space-y-4 max-h-[70vh]">
          {/* Instructions and Download Template */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-muted/30 rounded-lg border border-border text-xs">
            <div className="space-y-0.5">
              <span className="font-semibold text-foreground">ต้องการแม่แบบสำหรับเตรียมข้อมูลหรือไม่?</span>
              <p className="text-muted-foreground">
                ดาวน์โหลดแม่แบบ CSV เพื่อนำไปกรอกใน Microsoft Excel แล้วอัปโหลดกลับเข้ามาในระบบ
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={downloadCsvTemplate}
                className="gap-1 text-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ดาวน์โหลดแม่แบบ CSV</span>
              </Button>
            </div>
          </div>

          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border hover:border-primary/60 rounded-xl p-8 text-center cursor-pointer transition-colors bg-muted/10 hover:bg-muted/20"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv,.json"
              className="hidden"
            />
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">
                  {importFileName ? importFileName : "คลิกเพื่อเลือกไฟล์ CSV หรือ JSON จากเครื่องของคุณ"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  รองรับไฟล์ .csv (Excel UTF-8) หรือ .json ที่ส่งออกไว้
                </p>
              </div>
            </div>
          </div>

          {/* Preview Table */}
          {importPreviewItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                <span>รายการที่จะนำเข้า / อัปเดต ({importPreviewItems.length} ท่าน)</span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  ตรวจสอบความถูกต้องแล้ว
                </span>
              </div>

              <div className="border border-border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 text-muted-foreground border-b border-border font-medium">
                    <tr>
                      <th className="py-2 px-3">ชื่อ - นามสกุล</th>
                      <th className="py-2 px-3">ตำแหน่งงาน</th>
                      <th className="py-2 px-3">สายงาน</th>
                      <th className="py-2 px-3">ภาควิชา</th>
                      <th className="py-2 px-3 text-center">ผลงานวิจัย</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {importPreviewItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-muted/20">
                        <td className="py-2 px-3 font-medium">
                          {item.academicPosition && (
                            <span className="text-[10px] text-amber-700 mr-1">
                              [{item.academicPosition}]
                            </span>
                          )}
                          {item.firstNameTh} {item.lastNameTh}
                        </td>
                        <td className="py-2 px-3 text-muted-foreground">{item.positionTh}</td>
                        <td className="py-2 px-3">{item.type || "ACADEMIC"}</td>
                        <td className="py-2 px-3">{item.departmentName || "-"}</td>
                        <td className="py-2 px-3 text-center">
                          {item.researchPublications?.length ? (
                            <span className="font-semibold text-emerald-700">
                              {item.researchPublications.length} เรื่อง
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </LiyonDialogBody>

        <LiyonDialogFooter className="p-4 border-t border-border flex items-center justify-between">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />
            <span>หากชื่อและนามสกุลตรงกับอาจารย์ที่มีอยู่ ระบบจะทำการอัปเดตข้อมูลให้อัตโนมัติ</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setImportModalOpen(false);
                setImportPreviewItems([]);
                setImportFileName("");
              }}
              disabled={isPending}
              className="cursor-pointer"
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmImport}
              disabled={isPending || importPreviewItems.length === 0}
              className="cursor-pointer gap-2"
            >
              {isPending
                ? "กำลังนำเข้าข้อมูล..."
                : `ยืนยันนำเข้าข้อมูล (${importPreviewItems.length} ท่าน)`}
            </Button>
          </div>
        </LiyonDialogFooter>
      </LiyonDialog>

      <ExecutiveRoleManagerDialog
        open={executiveDialogOpen}
        onOpenChange={setExecutiveDialogOpen}
        items={items}
        onUpdatedItems={(updatedBatch) => {
          setItems((prev) =>
            prev.map((item) => {
              const found = updatedBatch.find((u) => u.id === item.id);
              return found ? { ...item, ...found } : item;
            })
          );
          router.refresh();
        }}
      />
    </div>
  );
}
