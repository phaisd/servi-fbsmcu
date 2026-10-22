"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Search,
  Users,
  Building,
  GraduationCap,
  Sparkles,
} from "lucide-react";
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
  createResearchPublicationAction,
  updateResearchPublicationAction,
  deleteResearchPublicationAction,
} from "@/features/personnel/actions";

interface PersonnelOption {
  id: string;
  firstNameTh: string;
  lastNameTh: string;
  positionTh: string;
  academicPosition?: string | null;
}

interface PublicationItem {
  id: string;
  titleTh: string;
  titleEn?: string | null;
  authors: string;
  journalName: string;
  volume?: string | null;
  issue?: string | null;
  publicationYear?: string | null;
  pages?: string | null;
  issn?: string | null;
  tier?: string | null;
  url?: string | null;
  type: string;
  personnelId?: string | null;
  personnel?: {
    id: string;
    firstNameTh: string;
    lastNameTh: string;
    positionTh: string;
    academicPosition?: string | null;
  } | null;
}

interface Props {
  initialPublications: PublicationItem[];
  personnelList: PersonnelOption[];
  canManage: boolean;
}

export function ResearchAdminClient({ initialPublications, personnelList, canManage }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<PublicationItem[]>(initialPublications);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [authorFilter, setAuthorFilter] = useState("ALL");
  const [isPending, startTransition] = useTransition();

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PublicationItem | null>(null);

  // Form fields
  const [formPersonnelId, setFormPersonnelId] = useState("");
  const [formTitleTh, setFormTitleTh] = useState("");
  const [formTitleEn, setFormTitleEn] = useState("");
  const [formAuthors, setFormAuthors] = useState("");
  const [formJournalName, setFormJournalName] = useState("");
  const [formVolume, setFormVolume] = useState("");
  const [formIssue, setFormIssue] = useState("");
  const [formPublicationYear, setFormPublicationYear] = useState("");
  const [formPages, setFormPages] = useState("");
  const [formIssn, setFormIssn] = useState("");
  const [formTier, setFormTier] = useState("TCI กลุ่ม 2");
  const [formUrl, setFormUrl] = useState("");
  const [formType, setFormType] = useState<"RESEARCH" | "ACADEMIC" | "DISSERTATION">("RESEARCH");

  const openCreate = () => {
    setEditingItem(null);
    setFormPersonnelId(personnelList[0]?.id || "");
    setFormTitleTh("");
    setFormTitleEn("");
    setFormAuthors("");
    setFormJournalName("");
    setFormVolume("");
    setFormIssue("");
    setFormPublicationYear("๒๕๖๙");
    setFormPages("");
    setFormIssn("");
    setFormTier("TCI กลุ่ม 2");
    setFormUrl("");
    setFormType("RESEARCH");
    setDialogOpen(true);
  };

  const openEdit = (item: PublicationItem) => {
    setEditingItem(item);
    setFormPersonnelId(item.personnelId || "");
    setFormTitleTh(item.titleTh);
    setFormTitleEn(item.titleEn || "");
    setFormAuthors(item.authors);
    setFormJournalName(item.journalName);
    setFormVolume(item.volume || "");
    setFormIssue(item.issue || "");
    setFormPublicationYear(item.publicationYear || "");
    setFormPages(item.pages || "");
    setFormIssn(item.issn || "");
    setFormTier(item.tier || "");
    setFormUrl(item.url || "");
    setFormType((item.type as any) || "RESEARCH");
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formTitleTh.trim() || !formAuthors.trim() || !formJournalName.trim()) {
      toast.error("กรุณากรอกชื่อเรื่อง คณะผู้วิจัย และชื่อวารสารให้ครบถ้วน");
      return;
    }

    startTransition(async () => {
      const payload = {
        personnelId: formPersonnelId || null,
        titleTh: formTitleTh.trim(),
        titleEn: formTitleEn.trim() || null,
        authors: formAuthors.trim(),
        journalName: formJournalName.trim(),
        volume: formVolume.trim() || null,
        issue: formIssue.trim() || null,
        publicationYear: formPublicationYear.trim() || null,
        pages: formPages.trim() || null,
        issn: formIssn.trim() || null,
        tier: formTier.trim() || null,
        url: formUrl.trim() || null,
        type: formType,
      };

      if (editingItem) {
        const res = await updateResearchPublicationAction(editingItem.id, payload);
        if (res) {
          toast.success("อัปเดตข้อมูลผลงานวิจัยเรียบร้อยแล้ว");
          setDialogOpen(false);
          router.refresh();
        }
      } else {
        const res = await createResearchPublicationAction(payload);
        if (res) {
          toast.success("เพิ่มผลงานวิจัยใหม่เรียบร้อยแล้ว");
          setDialogOpen(false);
          router.refresh();
        }
      }
    });
  };

  const handleDelete = (id: string, titleTh: string) => {
    if (!confirm(`คุณต้องการลบผลงาน "${titleTh}" ใช่หรือไม่?`)) return;

    startTransition(async () => {
      await deleteResearchPublicationAction(id);
      toast.success("ลบผลงานวิจัยเรียบร้อยแล้ว");
      setItems((prev) => prev.filter((p) => p.id !== id));
      router.refresh();
    });
  };

  const filtered = items.filter((pub) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      pub.titleTh.toLowerCase().includes(q) ||
      (pub.titleEn || "").toLowerCase().includes(q) ||
      pub.authors.toLowerCase().includes(q) ||
      pub.journalName.toLowerCase().includes(q);

    const matchesType = typeFilter === "ALL" || pub.type === typeFilter;
    const matchesAuthor = authorFilter === "ALL" || pub.personnelId === authorFilter;

    return matchesSearch && matchesType && matchesAuthor;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Page Title & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">จัดการผลงานวิจัยและบทความวิชาการ</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            บันทึกและจัดการผลงานวิจัย บทความวิชาการ และดุษฎีนิพนธ์ของคณาจารย์คณะพุทธศาสตร์
          </p>
        </div>

        {canManage && (
          <Button onClick={openCreate} className="gap-2 cursor-pointer shadow-xs">
            <Plus className="w-4 h-4" />
            <span>เพิ่มผลงานวิจัย</span>
          </Button>
        )}
      </div>

      {/* Module Navigation Strip */}
      <div className="flex items-center gap-2 border-b border-border pb-px text-sm">
        <Link
          href="/personnel"
          className="px-4 py-2 font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
        >
          <Users className="w-4 h-4" />
          <span>ทำเนียบคณาจารย์และบุคลากร</span>
        </Link>
        <Link
          href="/personnel/research"
          className="px-4 py-2 font-semibold text-primary border-b-2 border-primary flex items-center gap-2"
        >
          <BookOpen className="w-4 h-4" />
          <span>ผลงานวิจัยและวิชาการ ({items.length})</span>
        </Link>
        <Link
          href="/personnel/departments"
          className="px-4 py-2 font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
        >
          <Building className="w-4 h-4" />
          <span>จัดการภาควิชา</span>
        </Link>
      </div>

      {/* Toolbar */}
      <LiyonCard>
        <div className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาชื่อผลงาน, คณะผู้วิจัย, วารสาร..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={authorFilter}
                onChange={(e) => setAuthorFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border bg-background text-foreground"
              >
                <option value="ALL">คณาจารย์ทุกคน</option>
                {personnelList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstNameTh} {p.lastNameTh}
                  </option>
                ))}
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border bg-background text-foreground"
              >
                <option value="ALL">ทุกประเภท</option>
                <option value="RESEARCH">บทความวิจัย</option>
                <option value="ACADEMIC">บทความวิชาการ</option>
                <option value="DISSERTATION">ดุษฎีนิพนธ์</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-muted-foreground font-semibold">
                  <th className="py-3 px-3 w-12 text-center">#</th>
                  <th className="py-3 px-3">ชื่อผลงานวิจัย / บทความวิชาการ</th>
                  <th className="py-3 px-3">อาจารย์ / คณะผู้วิจัย</th>
                  <th className="py-3 px-3">วารสาร / แหล่งตีพิมพ์</th>
                  <th className="py-3 px-3">กลุ่ม TCI</th>
                  <th className="py-3 px-3">ประเภท</th>
                  <th className="py-3 px-3 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((pub, idx) => (
                  <tr key={pub.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-3 text-center text-muted-foreground font-mono">{idx + 1}</td>
                    <td className="py-3 px-3 max-w-md">
                      <div className="font-semibold text-foreground text-sm leading-snug">{pub.titleTh}</div>
                      {pub.titleEn && (
                        <div className="text-[11px] text-muted-foreground italic mt-0.5 line-clamp-1">
                          {pub.titleEn}
                        </div>
                      )}
                      {pub.url && (
                        <a
                          href={pub.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline mt-1 font-medium"
                        >
                          <span>เปิดลิงก์ ThaiJO</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-foreground">
                        {pub.personnel
                          ? `${pub.personnel.firstNameTh} ${pub.personnel.lastNameTh}`
                          : "-"}
                      </div>
                      <div className="text-[11px] text-muted-foreground line-clamp-2 max-w-xs mt-0.5">
                        {pub.authors}
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-medium text-foreground">{pub.journalName}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {pub.volume} {pub.issue} {pub.publicationYear ? `(ปี ${pub.publicationYear})` : ""}
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {pub.tier ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                          {pub.tier}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          pub.type === "RESEARCH"
                            ? "bg-blue-500/10 text-blue-700 dark:text-blue-300"
                            : pub.type === "DISSERTATION"
                            ? "bg-purple-500/10 text-purple-700 dark:text-purple-300"
                            : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        }`}
                      >
                        {pub.type === "RESEARCH"
                          ? "งานวิจัย"
                          : pub.type === "DISSERTATION"
                          ? "ดุษฎีนิพนธ์"
                          : "บทความวิชาการ"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEdit(pub)}
                          className="h-8 w-8 p-0"
                          title="แก้ไข"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(pub.id, pub.titleTh)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          title="ลบ"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      ไม่พบผลงานวิจัยตามเงื่อนไขที่ระบุ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </LiyonCard>

      {/* Add / Edit Dialog */}
      <LiyonDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <LiyonDialogCloseButton label="ปิด" />
        <LiyonDialogHeader
          title={editingItem ? "แก้ไขผลงานวิจัย" : "เพิ่มผลงานวิจัยใหม่"}
          description="กรอกข้อมูลผลงานวิจัย บทความวิชาการ หรือดุษฎีนิพนธ์"
        />
        <LiyonDialogBody>
          <div className="space-y-4 py-2">
            <LiyonField label="อาจารย์เจ้าของผลงาน (สังกัดคณะพุทธศาสตร์)" htmlFor="pub-personnel">
              <LiyonSelect
                id="pub-personnel"
                value={formPersonnelId}
                onChange={(e) => setFormPersonnelId(e.target.value)}
              >
                <option value="">-- ไม่ระบุ / เป็นผลงานส่วนกลาง --</option>
                {personnelList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstNameTh} {p.lastNameTh} ({p.positionTh})
                  </option>
                ))}
              </LiyonSelect>
            </LiyonField>

            <LiyonField label="ชื่อผลงานวิจัย / บทความ (ภาษาไทย) *" htmlFor="pub-title-th">
              <input
                id="pub-title-th"
                value={formTitleTh}
                onChange={(e) => setFormTitleTh(e.target.value)}
                placeholder="เช่น ศาสนารมณ์: เทคนิคการจัดการอารมณ์ตามแนวทางพระพุทธศาสนา"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring font-medium"
                required
              />
            </LiyonField>

            <LiyonField label="Title (English)" htmlFor="pub-title-en">
              <input
                id="pub-title-en"
                value={formTitleEn}
                onChange={(e) => setFormTitleEn(e.target.value)}
                placeholder="e.g. Religion and Emotion: A Technique on Emotional Management..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring italic"
              />
            </LiyonField>

            <LiyonField label="คณะผู้วิจัย / ผู้แต่งทั้งหมด *" htmlFor="pub-authors" hint="ระบุชื่อผู้แต่งทุกคนตามที่ปรากฏในบทความ">
              <input
                id="pub-authors"
                value={formAuthors}
                onChange={(e) => setFormAuthors(e.target.value)}
                placeholder="เช่น นายไชยา เสนแสนยา, พระธรรมวชิรมุนี วิ.,รศ.ดร., รศ.ดร.กฤต ศรียะอาจ..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                required
              />
            </LiyonField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <LiyonField label="ชื่อวารสารที่ตีพิมพ์ *" htmlFor="pub-journal">
                <input
                  id="pub-journal"
                  value={formJournalName}
                  onChange={(e) => setFormJournalName(e.target.value)}
                  placeholder="เช่น วารสาร มจร ปรัชญาปริทรรศน์"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  required
                />
              </LiyonField>

              <LiyonField label="ประเภทผลงาน" htmlFor="pub-type">
                <LiyonSelect
                  id="pub-type"
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as any)}
                >
                  <option value="RESEARCH">บทความวิจัย (Research Article)</option>
                  <option value="ACADEMIC">บทความวิชาการ (Academic Article)</option>
                  <option value="DISSERTATION">ดุษฎีนิพนธ์ / วิทยานิพนธ์ (Dissertation)</option>
                </LiyonSelect>
              </LiyonField>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <LiyonField label="ปีที่ตีพิมพ์ (พ.ศ.)" htmlFor="pub-year">
                <input
                  id="pub-year"
                  value={formPublicationYear}
                  onChange={(e) => setFormPublicationYear(e.target.value)}
                  placeholder="๒๕๖๙"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>

              <LiyonField label="ปีที่ / เล่มที่ (Volume)" htmlFor="pub-vol">
                <input
                  id="pub-vol"
                  value={formVolume}
                  onChange={(e) => setFormVolume(e.target.value)}
                  placeholder="ปีที่ ๙"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>

              <LiyonField label="ฉบับที่ (Issue)" htmlFor="pub-issue">
                <input
                  id="pub-issue"
                  value={formIssue}
                  onChange={(e) => setFormIssue(e.target.value)}
                  placeholder="ฉบับที่ ๑"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>

              <LiyonField label="เลขหน้า (Pages)" htmlFor="pub-pages">
                <input
                  id="pub-pages"
                  value={formPages}
                  onChange={(e) => setFormPages(e.target.value)}
                  placeholder="๒๖๔-๒๗๕"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <LiyonField label="ระดับมาตรฐานวารสาร (TCI Tier)" htmlFor="pub-tier">
                <input
                  id="pub-tier"
                  value={formTier}
                  onChange={(e) => setFormTier(e.target.value)}
                  placeholder="เช่น TCI กลุ่ม 1, TCI กลุ่ม 2, TCI ฐาน 1"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>

              <LiyonField label="ISSN" htmlFor="pub-issn">
                <input
                  id="pub-issn"
                  value={formIssn}
                  onChange={(e) => setFormIssn(e.target.value)}
                  placeholder="3027-7388 (Online)"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                />
              </LiyonField>
            </div>

            <LiyonField label="ลิงก์อ่านบทความฉบับเต็ม (ThaiJO / Journal URL)" htmlFor="pub-url">
              <input
                id="pub-url"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="https://so06.tci-thaijo.org/index.php/jmpr/article/view/..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
              />
            </LiyonField>
          </div>
        </LiyonDialogBody>
        <LiyonDialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isPending}>
            ยกเลิก
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {editingItem ? "บันทึกการแก้ไข" : "เพิ่มผลงานวิจัย"}
          </Button>
        </LiyonDialogFooter>
      </LiyonDialog>
    </div>
  );
}
