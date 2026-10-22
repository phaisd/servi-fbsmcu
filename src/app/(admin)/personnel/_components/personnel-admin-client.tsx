"use client";

import { useState, useTransition } from "react";
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
  deletePersonnelAction,
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

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PersonnelWithRelations | null>(null);
  const [activeTab, setActiveTab] = useState<"general" | "academic" | "contact">("general");

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
    setActiveTab("general");
    setDialogOpen(true);
  };

  const openEdit = (item: PersonnelWithRelations) => {
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
    setActiveTab("general");
    setDialogOpen(true);
  };

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

  const filteredItems = items.filter((item) => {
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
            <Button onClick={openCreate} className="gap-2 cursor-pointer shadow-xs">
              <Plus className="w-4 h-4" />
              <span>เพิ่มข้อมูลอาจารย์ / บุคลากร</span>
            </Button>
          )}
          <Link href="/portal/personnel" target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm" className="gap-2 cursor-pointer">
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
              <span>ดูหน้าพอร์ทัลบุคลากร</span>
            </Button>
          </Link>
          <Link href="/personnel/research">
            <Button variant="outline" size="sm" className="gap-2 cursor-pointer">
              <BookOpen className="w-4 h-4" />
              <span>ผลงานวิจัย ({totalResearchCount})</span>
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
                <th className="py-3 px-4">ชื่อ - นามสกุล / คณาจารย์</th>
                <th className="py-3 px-4">ตำแหน่งและหน้าที่</th>
                <th className="py-3 px-4">ภาควิชา / สังกัด</th>
                <th className="py-3 px-4">สายงาน</th>
                <th className="py-3 px-4 text-center">ผลงานวิจัย</th>
                <th className="py-3 px-4 text-center">สถานะ</th>
                <th className="py-3 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    ไม่พบข้อมูลบุคลากรที่ตรงกับเงื่อนไขการค้นหา
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const researchCount = item.researchPublications?.length || 0;
                  const fullName = `${item.firstNameTh} ${item.lastNameTh}`.trim();

                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
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
                              <span>{fullName}</span>
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
                        {researchCount > 0 ? (
                          <Link
                            href={`/personnel/research`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition-colors"
                            title="คลิกเพื่อดูรายการงานวิจัย"
                          >
                            <BookOpen className="w-3 h-3 text-emerald-600" />
                            <span>{researchCount} เรื่อง</span>
                          </Link>
                        ) : (
                          <Link
                            href={`/personnel/research`}
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                            title="เพิ่มผลงานวิจัยให้อาจารย์ท่านนี้"
                          >
                            <span>0 เรื่อง</span>
                            <Plus className="w-3 h-3" />
                          </Link>
                        )}
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
                                onClick={() => openEdit(item)}
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
                            href="/portal/personnel"
                            target="_blank"
                            rel="noreferrer"
                            className="h-8 w-8 inline-flex items-center justify-center text-muted-foreground hover:text-primary"
                            title="เปิดดูในพอร์ทัล"
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
              ? `แก้ไขรายละเอียดของ ${editingItem.firstNameTh} ${editingItem.lastNameTh}`
              : "บันทึกประวัติ วุฒิการศึกษา และข้อมูลการติดต่อ"
          }
        />

        <LiyonDialogBody className="overflow-y-auto p-4 space-y-4 max-h-[70vh]">
          {/* Dialog Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-border pb-2 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("general")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
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
              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
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
              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === "contact"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>การติดต่อ & รูปภาพ</span>
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
                  label="ประสบการณ์การสอน / ภาระหน้าที่งาน (Experiences)"
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
          </LiyonDialogBody>

          <LiyonDialogFooter className="p-4 border-t border-border flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {editingItem && (
                <Link
                  href="/personnel/research"
                  className="text-primary hover:underline flex items-center gap-1 font-medium"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>จัดการผลงานวิจัยของอาจารย์ ({editingItem.researchPublications?.length || 0} เรื่อง)</span>
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
                {isPending ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
              </Button>
            </div>
          </LiyonDialogFooter>
      </LiyonDialog>
    </div>
  );
}
