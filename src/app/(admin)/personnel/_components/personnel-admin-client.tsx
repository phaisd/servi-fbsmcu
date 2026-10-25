"use client";

import { useState, useTransition, useRef } from "react";
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
  ArrowUpDown,
} from "lucide-react";
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
  updatePersonnelAction,
  updatePersonnelOrderAction,
  reorderPersonnelBatchAction,
  deletePersonnelAction,
  createResearchPublicationAction,
  deleteResearchPublicationAction,
  importPersonnelBatchAction,
  type ImportPersonnelItem,
} from "@/features/personnel/actions";
import type { Personnel, Department, ResearchPublication } from "@/generated/prisma";

type PersonnelWithRelations = Personnel & {
  department: Department | null;
  researchPublications?: ResearchPublication[];
};

interface Props {
  initialItems: PersonnelWithRelations[];
  departmentList: Department[];
  canManage: boolean;
}

export function PersonnelAdminClient({ initialItems, departmentList, canManage }: Props) {
  const t = useT();
  const router = useRouter();
  const [items, setItems] = useState<PersonnelWithRelations[]>(initialItems);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [deptFilter, setDeptFilter] = useState<string>("ALL");
  const [isPending, startTransition] = useTransition();

  // Personnel Modal Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PersonnelWithRelations | null>(null);
  const [activeTab, setActiveTab] = useState<"general" | "academic" | "contact" | "research">("general");

  // Form Fields
  const [formFirstNameTh, setFormFirstNameTh] = useState("");
  const [formLastNameTh, setFormLastNameTh] = useState("");
  const [formFirstNameEn, setFormFirstNameEn] = useState("");
  const [formLastNameEn, setFormLastNameEn] = useState("");
  const [formPositionTh, setFormPositionTh] = useState("");
  const [formPositionEn, setFormPositionEn] = useState("");
  const [formAcademicPosition, setFormAcademicPosition] = useState("");
  const [formType, setFormType] = useState<"EXECUTIVE" | "ACADEMIC" | "SUPPORT">("ACADEMIC");
  const [formDepartmentId, setFormDepartmentId] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhoneNumber, setFormPhoneNumber] = useState("");
  const [formContactInfo, setFormContactInfo] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formEducationTh, setFormEducationTh] = useState("");
  const [formExperiencesTh, setFormExperiencesTh] = useState("");
  const [formBioTh, setFormBioTh] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formOrderIndex, setFormOrderIndex] = useState(0);

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
    setFormType("ACADEMIC");
    setFormDepartmentId(departmentList[0]?.id || "");
    setFormEmail("");
    setFormPhoneNumber("");
    setFormContactInfo("");
    setFormImageUrl("");
    setFormEducationTh("");
    setFormExperiencesTh("");
    setFormBioTh("");
    setFormIsActive(true);
    setFormOrderIndex(items.length + 1);
    setEditingResearchList([]);
    setShowAddResearchForm(false);
    setActiveTab("general");
    setDialogOpen(true);
  };

  const openEdit = (item: PersonnelWithRelations, defaultTab: "general" | "academic" | "contact" | "research" = "general") => {
    setEditingItem(item);
    setFormFirstNameTh(item.firstNameTh || "");
    setFormLastNameTh(item.lastNameTh || "");
    setFormFirstNameEn(item.firstNameEn || "");
    setFormLastNameEn(item.lastNameEn || "");
    setFormPositionTh(item.positionTh || "");
    setFormPositionEn(item.positionEn || "");
    setFormAcademicPosition(item.academicPosition || "");
    setFormType(item.type);
    setFormDepartmentId(item.departmentId || "");
    setFormEmail(item.email || "");
    setFormPhoneNumber(item.phoneNumber || "");
    setFormContactInfo(item.contactInfo || "");
    setFormImageUrl(item.imageUrl || "");
    setFormEducationTh(item.educationTh || "");
    setFormExperiencesTh(item.experiencesTh || "");
    setFormBioTh(item.bioTh || "");
    setFormIsActive(item.isActive);
    setFormOrderIndex(item.orderIndex);
    setEditingResearchList(item.researchPublications || []);
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
        type: formType,
        departmentId: formDepartmentId || null,
        email: formEmail.trim() || null,
        phoneNumber: formPhoneNumber.trim() || null,
        contactInfo: formContactInfo.trim() || null,
        imageUrl: formImageUrl.trim() || null,
        educationTh: formEducationTh.trim() || null,
        experiencesTh: formExperiencesTh.trim() || null,
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
        toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
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
      "คำนำหน้า/ตำแหน่งทางวิชาการ",
      "ชื่อ (ไทย)",
      "นามสกุล (ไทย)",
      "First Name (EN)",
      "Last Name (EN)",
      "ตำแหน่งงาน (ไทย)",
      "Position (EN)",
      "สายงาน",
      "ภาควิชา",
      "อีเมล",
      "เบอร์โทรศัพท์",
      "ข้อมูลติดต่อเพิ่มเติม",
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
      escapeCell(p.firstNameEn || ""),
      escapeCell(p.lastNameEn || ""),
      escapeCell(p.positionTh),
      escapeCell(p.positionEn || ""),
      escapeCell(p.type),
      escapeCell(p.department?.nameTh || ""),
      escapeCell(p.email || ""),
      escapeCell(p.phoneNumber || ""),
      escapeCell(p.contactInfo || ""),
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
      "คำนำหน้า/ตำแหน่งทางวิชาการ",
      "ชื่อ (ไทย)",
      "นามสกุล (ไทย)",
      "First Name (EN)",
      "Last Name (EN)",
      "ตำแหน่งงาน (ไทย)",
      "Position (EN)",
      "สายงาน",
      "ภาควิชา",
      "อีเมล",
      "เบอร์โทรศัพท์",
      "ข้อมูลติดต่อเพิ่มเติม",
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
              const type = rawType === "SUPPORT" || rawType === "EXECUTIVE" ? rawType : "ACADEMIC";
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
                  const fullName = `${item.firstNameTh} ${item.lastNameTh}`.trim();

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
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 text-sm overflow-hidden border border-primary/20">
                            {item.imageUrl ? (
                              <Image
                                src={item.imageUrl}
                                alt={item.firstNameTh}
                                width={40}
                                height={40}
                                unoptimized
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{item.firstNameTh?.[0] || "U"}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground flex items-center gap-1.5 flex-wrap">
                              {item.academicPosition && (
                                <span className="text-xs font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                  {item.academicPosition}
                                </span>
                              )}
                              <Link
                                href={`/portal/personnel/${item.id}`}
                                target="_blank"
                                className="hover:text-primary transition-colors cursor-pointer"
                                title="เปิดดูหน้าโปรไฟล์อาจารย์ฉบับเต็ม"
                              >
                                {fullName}
                              </Link>
                            </div>
                            {(item.firstNameEn || item.lastNameEn) && (
                              <p className="text-xs text-muted-foreground">
                                {item.firstNameEn} {item.lastNameEn}
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
          title={editingItem ? "แก้ไขข้อมูลอาจารย์ / บุคลากร" : "เพิ่มอาจารย์ / บุคลากรใหม่"}
          description={
            editingItem
              ? `แก้ไขรายละเอียดและผลงานของ ${editingItem.firstNameTh} ${editingItem.lastNameTh}`
              : "บันทึกประวัติ วุฒิการศึกษา ภาระงานสอน และผลงานวิจัย"
          }
        />

        <LiyonDialogBody className="overflow-y-auto p-4 space-y-4 max-h-[70vh]">
          {/* Dialog Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-border pb-2 text-xs flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab("general")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === "general"
                  ? "bg-primary text-primary-foreground font-semibold"
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
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>วุฒิการศึกษา & ภาระงานสอน</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("contact")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === "contact"
                  ? "bg-primary text-primary-foreground font-semibold"
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
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>ผลงานวิจัย & วิชาการ ({editingResearchList.length})</span>
            </button>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      setFormType(e.target.value as "EXECUTIVE" | "ACADEMIC" | "SUPPORT")
                    }
                  >
                    <option value="ACADEMIC">สายวิชาการ (อาจารย์/นักวิจัย)</option>
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
                <textarea
                  id="field-experiences"
                  rows={4}
                  value={formExperiencesTh}
                  onChange={(e) => setFormExperiencesTh(e.target.value)}
                  placeholder="อาจารย์ประจำหลักสูตรพุทธศาสตรบัณฑิต...&#10;อาจารย์ผู้สอนรายวิชา: ปรัชญาเบื้องต้น, พุทธปรัชญาเถรวาท..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring font-sans"
                />
              </LiyonField>

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

                <LiyonField label="เบอร์โทรศัพท์ (Phone Number)" htmlFor="field-phone">
                  <input
                    id="field-phone"
                    value={formPhoneNumber}
                    onChange={(e) => setFormPhoneNumber(e.target.value)}
                    placeholder="098-387-5997"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </LiyonField>
              </div>

              <LiyonField
                label="ช่องทางการติดต่อเพิ่มเติม (Contact Info)"
                htmlFor="field-contact-info"
                hint="เช่น ที่ตั้งห้องพักอาจารย์, Facebook, Line ID"
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
                label="URL รูปถ่ายโปรไฟล์ (Image URL)"
                htmlFor="field-image-url"
                hint="ลิงก์รูปภาพของอาจารย์เพื่อแสดงบนทำเนียบ"
              >
                <input
                  id="field-image-url"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </LiyonField>

              {formImageUrl && (
                <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-md border border-border">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-border shrink-0">
                    <Image
                      src={formImageUrl}
                      alt="Preview"
                      width={48}
                      height={48}
                      unoptimized
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ตัวอย่างการแสดงผลรูปถ่ายของอาจารย์
                  </div>
                </div>
              )}
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

                          <LiyonField label="URL ลิงก์บทความ (ThaiJO)" htmlFor="new-pub-url">
                            <input
                              id="new-pub-url"
                              value={newPubUrl}
                              onChange={(e) => setNewPubUrl(e.target.value)}
                              placeholder="https://..."
                              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                          </LiyonField>
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
                                className="inline-flex items-center gap-1 text-primary hover:underline text-[11px] pt-0.5"
                              >
                                <span>เปิดดูบทความ ThaiJO</span>
                                <ExternalLink className="w-2.5 h-2.5" />
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

        <LiyonDialogFooter className="p-4 border-t border-border flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {editingItem && (
              <Link
                href={`/personnel/research?author=${editingItem.id}`}
                className="text-primary hover:underline flex items-center gap-1 font-medium"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>เปิดดูในหน้าระบบผลงานวิจัย ({editingResearchList.length} เรื่อง)</span>
              </Link>
            )}
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
    </div>
  );
}
