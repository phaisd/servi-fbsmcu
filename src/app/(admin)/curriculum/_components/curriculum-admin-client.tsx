"use client";

import * as React from "react";
import Link from "next/link";
import {
  GraduationCap,
  Plus,
  Search,
  Building2,
  Edit2,
  Trash2,
  Clock,
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
  createCurriculumAction,
  updateCurriculumAction,
  deleteCurriculumAction,
  toggleCurriculumActiveAction,
} from "@/features/curriculum/actions";
import type { Curriculum, Department, DegreeLevel } from "@/generated/prisma";

type CurriculumWithDept = Curriculum & { department?: Department | null };

interface CurriculumAdminClientProps {
  initialItems: CurriculumWithDept[];
  departments: Department[];
}

const DEGREE_LABELS: Record<DegreeLevel, { th: string; en: string }> = {
  BACHELOR: { th: "ปริญญาตรี", en: "Bachelor's" },
  MASTER: { th: "ปริญญาโท", en: "Master's" },
  DOCTORATE: { th: "ปริญญาเอก", en: "Doctorate" },
  CERTIFICATE: { th: "ประกาศนียบัตร", en: "Certificate" },
};

export function CurriculumAdminClient({
  initialItems,
  departments,
}: CurriculumAdminClientProps) {
  const t = useT();
  const [items, setItems] = React.useState<CurriculumWithDept[]>(initialItems);
  const [search, setSearch] = React.useState("");
  const [filterDegree, setFilterDegree] = React.useState<string>("ALL");
  const [filterDept, setFilterDept] = React.useState<string>("ALL");
  const [filterActive, setFilterActive] = React.useState<string>("ALL");

  // Dialog state
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<CurriculumWithDept | null>(null);
  const [isDeleting, setIsDeleting] = React.useState<CurriculumWithDept | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  // Form state
  const [formData, setFormData] = React.useState({
    nameTh: "",
    nameEn: "",
    degree: "BACHELOR" as DegreeLevel,
    durationYears: 4,
    departmentId: "",
    descriptionTh: "",
    descriptionEn: "",
    imageUrl: "",
    isActive: true,
    orderIndex: 0,
  });

  const openCreateDialog = () => {
    setEditingItem(null);
    setFormData({
      nameTh: "",
      nameEn: "",
      degree: "BACHELOR",
      durationYears: 4,
      departmentId: "",
      descriptionTh: "",
      descriptionEn: "",
      imageUrl: "",
      isActive: true,
      orderIndex: items.length,
    });
    setIsFormOpen(true);
  };

  const openEditDialog = (item: CurriculumWithDept) => {
    setEditingItem(item);
    setFormData({
      nameTh: item.nameTh,
      nameEn: item.nameEn || "",
      degree: item.degree,
      durationYears: item.durationYears,
      departmentId: item.departmentId || "",
      descriptionTh: item.descriptionTh || "",
      descriptionEn: item.descriptionEn || "",
      imageUrl: item.imageUrl || "",
      isActive: item.isActive,
      orderIndex: item.orderIndex,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameTh.trim()) {
      toast.error("กรุณาระบุชื่อหลักสูตรภาษาไทย");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        nameTh: formData.nameTh.trim(),
        nameEn: formData.nameEn.trim() || null,
        degree: formData.degree,
        durationYears: Number(formData.durationYears) || 4,
        departmentId: formData.departmentId || null,
        descriptionTh: formData.descriptionTh.trim() || null,
        descriptionEn: formData.descriptionEn.trim() || null,
        imageUrl: formData.imageUrl.trim() || null,
        isActive: formData.isActive,
        orderIndex: Number(formData.orderIndex) || 0,
      };

      if (editingItem) {
        const updated = await updateCurriculumAction(editingItem.id, payload);
        const dept = departments.find((d) => d.id === payload.departmentId) || null;
        setItems((prev) =>
          prev.map((it) => (it.id === editingItem.id ? { ...updated, department: dept } : it))
        );
        toast.success("แก้ไขข้อมูลหลักสูตรเรียบร้อยแล้ว");
      } else {
        const created = await createCurriculumAction(payload);
        const dept = departments.find((d) => d.id === payload.departmentId) || null;
        setItems((prev) => [{ ...created, department: dept }, ...prev]);
        toast.success("เพิ่มหลักสูตรใหม่เรียบร้อยแล้ว");
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
      await deleteCurriculumAction(isDeleting.id);
      setItems((prev) => prev.filter((it) => it.id !== isDeleting.id));
      toast.success("ลบหลักสูตรเรียบร้อยแล้ว");
      setIsDeleting(null);
    } catch {
      toast.error("ไม่สามารถลบหลักสูตรได้");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (item: CurriculumWithDept) => {
    const nextState = !item.isActive;
    try {
      await toggleCurriculumActiveAction(item.id, nextState);
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, isActive: nextState } : it))
      );
      toast.success(nextState ? "เปิดการแสดงผลหลักสูตรแล้ว" : "ปิดการแสดงผลหลักสูตรแล้ว");
    } catch {
      toast.error("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
    }
  };

  // Filtered items
  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTh = item.nameTh.toLowerCase().includes(q);
        const matchEn = (item.nameEn || "").toLowerCase().includes(q);
        const matchDept = (item.department?.nameTh || "").toLowerCase().includes(q);
        if (!matchTh && !matchEn && !matchDept) return false;
      }
      // Degree
      if (filterDegree !== "ALL" && item.degree !== filterDegree) return false;
      // Department
      if (filterDept !== "ALL") {
        if (filterDept === "NONE" && item.departmentId) return false;
        if (filterDept !== "NONE" && item.departmentId !== filterDept) return false;
      }
      // Active
      if (filterActive === "ACTIVE" && !item.isActive) return false;
      if (filterActive === "INACTIVE" && item.isActive) return false;

      return true;
    });
  }, [items, search, filterDegree, filterDept, filterActive]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>{t("curriculum.title")}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-muted font-normal text-muted-foreground">
                  {items.length} หลักสูตร
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {t("curriculum.subtitle")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/curriculum/timetables">
            <Button variant="outline" className="gap-2 text-xs">
              <Clock className="w-4 h-4 text-primary" />
              <span>ตารางเรียน / ตารางสอน</span>
            </Button>
          </Link>
          <Link href="/curriculum/departments">
            <Button variant="outline" className="gap-2 text-xs">
              <Building2 className="w-4 h-4 text-primary" />
              <span>ภาควิชา / สาขาวิชา / ส่วนงาน</span>
              <span className="px-1.5 py-0.2 rounded-md bg-muted text-[10px] text-muted-foreground">
                {departments.length}
              </span>
            </Button>
          </Link>
          <Button onClick={openCreateDialog} className="gap-2 text-xs font-semibold">
            <Plus className="w-4 h-4" />
            <span>เพิ่มหลักสูตรใหม่</span>
          </Button>
        </div>
      </div>

      {/* ── FILTERS ── */}
      <LiyonCard>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อหลักสูตร หรือ ภาควิชา..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <LiyonSelect
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="text-xs"
          >
            <option value="ALL">🏛️ ทุกภาควิชา / ส่วนงาน ({departments.length})</option>
            <option value="NONE">⚠️ ยังไม่ระบุภาควิชา</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nameTh} {d.code ? `(${d.code})` : ""}
              </option>
            ))}
          </LiyonSelect>

          <LiyonSelect
            value={filterDegree}
            onChange={(e) => setFilterDegree(e.target.value)}
            className="text-xs"
          >
            <option value="ALL">🎓 ทุกระดับการศึกษา</option>
            <option value="BACHELOR">ปริญญาตรี (Bachelor)</option>
            <option value="MASTER">ปริญญาโท (Master)</option>
            <option value="DOCTORATE">ปริญญาเอก (Doctorate)</option>
            <option value="CERTIFICATE">ประกาศนียบัตร (Certificate)</option>
          </LiyonSelect>

          <LiyonSelect
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="text-xs"
          >
            <option value="ALL">🔘 ทุกสถานะ</option>
            <option value="ACTIVE">เปิดใช้งาน (Active)</option>
            <option value="INACTIVE">ปิดใช้งาน (Inactive)</option>
          </LiyonSelect>
        </div>
      </LiyonCard>

      {/* ── CURRICULUM TABLE ── */}
      <LiyonCard>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b bg-muted/30 text-muted-foreground font-semibold">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">ชื่อหลักสูตร (Curriculum Name)</th>
                <th className="py-3 px-4">ภาควิชา / สาขาวิชา / ส่วนงาน</th>
                <th className="py-3 px-4">ระดับการศึกษา</th>
                <th className="py-3 px-4">ระยะเวลา</th>
                <th className="py-3 px-4 text-center">สถานะ</th>
                <th className="py-3 px-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredItems.map((item, index) => (
                <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 text-center text-muted-foreground font-mono">
                    {index + 1}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-bold text-foreground text-sm">{item.nameTh}</p>
                    {item.nameEn && (
                      <p className="text-muted-foreground text-[11px] font-sans">{item.nameEn}</p>
                    )}
                    {item.descriptionTh && (
                      <p className="text-muted-foreground text-[11px] line-clamp-1 mt-0.5 max-w-md">
                        {item.descriptionTh}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {item.department ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-medium text-xs">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{item.department.nameTh}</span>
                        {item.department.code && (
                          <span className="text-[10px] opacity-75 font-mono">
                            [{item.department.code}]
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/70 text-[11px] italic">
                        ยังไม่ระบุภาควิชา
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted text-foreground font-medium text-[11px]">
                      <GraduationCap className="w-3 h-3 text-muted-foreground" />
                      <span>{DEGREE_LABELS[item.degree]?.th || item.degree}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-muted-foreground text-xs font-mono">
                      <Clock className="w-3 h-3" />
                      <span>{item.durationYears} ปี</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(item)}
                      className="cursor-pointer inline-flex items-center transition-transform hover:scale-105"
                      title={item.isActive ? "คลิกเพื่อปิดใช้งาน" : "คลิกเพื่อเปิดใช้งาน"}
                    >
                      <StatusPill tone={item.isActive ? "ok" : "off"}>
                        {item.isActive ? "เปิดรับสมัคร / ใช้งาน" : "ปิดชั่วคราว"}
                      </StatusPill>
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEditDialog(item)}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        title="แก้ไขหลักสูตร"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setIsDeleting(item)}
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        title="ลบหลักสูตร"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <GraduationCap className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                    <p className="font-medium">ไม่พบข้อมูลหลักสูตรที่ตรงกับเงื่อนไข</p>
                    <p className="text-[11px] mt-1">สามารถกด &ldquo;เพิ่มหลักสูตรใหม่&rdquo; เพื่อสร้างข้อมูลได้ทันที</p>
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
          title={editingItem ? "แก้ไขข้อมูลหลักสูตร" : "เพิ่มหลักสูตรใหม่"}
          description="กรอกข้อมูลหลักสูตรการศึกษาและระบุภาควิชาที่สังกัด"
        />
        <form onSubmit={handleSubmit}>
          <LiyonDialogBody className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <LiyonField label="ชื่อหลักสูตร (ภาษาไทย) *" hint="เช่น พุทธศาสตรบัณฑิต">
                <input
                  type="text"
                  required
                  value={formData.nameTh}
                  onChange={(e) => setFormData({ ...formData, nameTh: e.target.value })}
                  placeholder="พุทธศาสตรบัณฑิต"
                />
              </LiyonField>
              <LiyonField label="ชื่อหลักสูตร (ภาษาอังกฤษ)" hint="เช่น Bachelor of Buddhism">
                <input
                  type="text"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  placeholder="Bachelor of Arts in Buddhism"
                />
              </LiyonField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <LiyonField label="สังกัดภาควิชา / สาขาวิชา / ส่วนงาน" hint="เลือกหน่วยงานที่รับผิดชอบ">
                <LiyonSelect
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                >
                  <option value="">-- ไม่ระบุภาควิชา --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nameTh} {d.code ? `(${d.code})` : ""}
                    </option>
                  ))}
                </LiyonSelect>
              </LiyonField>

              <LiyonField label="ระดับการศึกษา" hint="วุฒิการศึกษา">
                <LiyonSelect
                  value={formData.degree}
                  onChange={(e) =>
                    setFormData({ ...formData, degree: e.target.value as DegreeLevel })
                  }
                >
                  <option value="BACHELOR">ปริญญาตรี (Bachelor)</option>
                  <option value="MASTER">ปริญญาโท (Master)</option>
                  <option value="DOCTORATE">ปริญญาเอก (Doctorate)</option>
                  <option value="CERTIFICATE">ประกาศนียบัตร (Certificate)</option>
                </LiyonSelect>
              </LiyonField>

              <LiyonField label="ระยะเวลาศึกษา (ปี)" hint="จำนวนปีตามเกณฑ์">
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={formData.durationYears}
                  onChange={(e) =>
                    setFormData({ ...formData, durationYears: Number(e.target.value) || 1 })
                  }
                />
              </LiyonField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <LiyonField label="รายละเอียดหลักสูตร (ภาษาไทย)">
                <textarea
                  rows={3}
                  value={formData.descriptionTh}
                  onChange={(e) => setFormData({ ...formData, descriptionTh: e.target.value })}
                  placeholder="คำอธิบาย วัตถุประสงค์ หรือจุดเด่นของหลักสูตร..."
                />
              </LiyonField>
              <LiyonField label="รายละเอียดหลักสูตร (ภาษาอังกฤษ)">
                <textarea
                  rows={3}
                  value={formData.descriptionEn}
                  onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                  placeholder="Program overview and academic highlights..."
                />
              </LiyonField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <LiyonField label="ลิงก์รูปภาพประกอบ (Image URL)" hint="รูปภาพโปรโมทหลักสูตร">
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="/images/curriculum/bachelor.jpg หรือ https://..."
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

            <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
              <div>
                <p className="text-xs font-semibold">เปิดรับสมัคร / แสดงผลบนเว็บไซต์</p>
                <p className="text-[11px] text-muted-foreground">
                  เมื่อเปิดใช้งาน ผู้ใช้งานหน้า Portal จะมองเห็นหลักสูตรนี้
                </p>
              </div>
              <LiyonSwitch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
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
              {submitting ? "กำลังบันทึก..." : editingItem ? "บันทึกการแก้ไข" : "บันทึกหลักสูตร"}
            </Button>
          </LiyonDialogFooter>
        </form>
      </LiyonDialog>

      {/* ── DELETE CONFIRM DIALOG ── */}
      <LiyonDialog open={!!isDeleting} onOpenChange={() => setIsDeleting(null)} danger>
        <LiyonDialogCloseButton label="ปิด" />
        <LiyonDialogHeader
          title="ยืนยันการลบหลักสูตร"
          description="การดำเนินการนี้ไม่สามารถเรียกคืนได้ ข้อมูลหลักสูตรจะถูกลบออกจากระบบอย่างถาวร"
        />
        <LiyonDialogBody>
          <p className="text-sm text-foreground">
            คุณแน่ใจหรือไม่ว่าต้องการลบหลักสูตร{" "}
            <span className="font-bold text-destructive">&ldquo;{isDeleting?.nameTh}&rdquo;</span>?
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
