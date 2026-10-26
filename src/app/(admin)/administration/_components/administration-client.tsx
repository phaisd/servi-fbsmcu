"use client";

import { useState, useTransition, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Upload,
  Download,
  ExternalLink,
  Lock,
  Globe,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  FileUp,
  FileCode,
  FileCheck,
  AlertCircle,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { useT, useLocale } from "@/shared/lib/i18n/client";
import { formatDate } from "@/shared/lib/format";
import {
  LiyonCard,
  DataTable,
  StatusPill,
  LiyonDialog,
  LiyonDialogCloseButton,
  LiyonDialogHeader,
  LiyonDialogBody,
  LiyonDialogFooter,
  LiyonField,
  RowMenuItem,
  type DataTableColumn,
} from "@/shared/components/liyon";
import { Button } from "@/components/ui/button";
import type { AdminDocument, DocumentCategory, DocumentVisibility } from "@/generated/prisma";
import {
  createAdminDocumentAction,
  updateAdminDocumentAction,
  deleteAdminDocumentAction,
  getAdminDocumentsAction,
  uploadAdminDocumentFileAction,
  importAdminDocumentsAction,
  getFacultySarPackageAction,
} from "@/features/administration/actions";

interface Props {
  initialItems: AdminDocument[];
  canManage: boolean;
}

export function AdministrationClient({ initialItems, canManage }: Props) {
  const t = useT();
  const locale = useLocale();
  const [items, setItems] = useState<AdminDocument[]>(initialItems);
  const [isPending, startTransition] = useTransition();

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [visibilityFilter, setVisibilityFilter] = useState<string>("ALL");
  const [yearFilter, setYearFilter] = useState<string>("ALL");
  const [issuerLevelFilter, setIssuerLevelFilter] = useState<string>("ALL");
  const [docTypeFilter, setDocTypeFilter] = useState<string>("ALL");

  // Create / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminDocument | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState<DocumentCategory>("FORM");
  const [formDocType, setFormDocType] = useState<string>("GENERAL");
  const [formDocNumber, setFormDocNumber] = useState("");
  const [formYear, setFormYear] = useState("2569");
  const [formIssuerLevel, setFormIssuerLevel] = useState<"FACULTY" | "UNIVERSITY">("FACULTY");
  const [formVisibility, setFormVisibility] = useState<DocumentVisibility>("PUBLIC");
  const [formIsPublished, setFormIsPublished] = useState(true);
  const [fileMode, setFileMode] = useState<"upload" | "url">("upload");
  const [formFileUrl, setFormFileUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete Modal State
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<AdminDocument | null>(null);

  // Import Modal State
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreviewCount, setImportPreviewCount] = useState<number>(0);
  const [importParsedData, setImportParsedData] = useState<Array<Record<string, unknown>>>([]);
  const [isImporting, setIsImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const refreshItems = async () => {
    startTransition(async () => {
      const res = await getAdminDocumentsAction();
      if (res.ok) {
        setItems(res.data);
      }
    });
  };

  // Distinct Available Years for Filter
  const availableYears = useMemo(() => {
    const set = new Set<string>();
    items.forEach((it) => {
      if (it.year) set.add(it.year);
    });
    ["2569", "2568", "2567", "2566"].forEach((y) => set.add(y));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [items]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !search.trim() ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(search.toLowerCase())) ||
        (item.docNumber && item.docNumber.toLowerCase().includes(search.toLowerCase())) ||
        (item.year && item.year.includes(search.trim()));

      const matchesCategory =
        categoryFilter === "ALL" || item.category === categoryFilter;

      const matchesVisibility =
        visibilityFilter === "ALL" || item.visibility === visibilityFilter;

      const matchesYear =
        yearFilter === "ALL" || item.year === yearFilter;

      const matchesIssuer =
        issuerLevelFilter === "ALL" || item.issuerLevel === issuerLevelFilter;

      const matchesDocType =
        docTypeFilter === "ALL" || item.docType === docTypeFilter;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesVisibility &&
        matchesYear &&
        matchesIssuer &&
        matchesDocType
      );
    });
  }, [items, search, categoryFilter, visibilityFilter, yearFilter, issuerLevelFilter, docTypeFilter]);

  // Open Create Dialog
  const openCreateDialog = (defaultDocType: string = "GENERAL") => {
    setEditingItem(null);
    setFormTitle("");
    setFormDescription("");
    setFormDocType(defaultDocType);
    setFormDocNumber("");
    setFormYear("2569");
    setFormIssuerLevel("FACULTY");
    const initCategory: DocumentCategory =
      defaultDocType === "ORDER" || defaultDocType === "ANNOUNCEMENT" || defaultDocType === "REGULATION"
        ? "POLICY"
        : defaultDocType === "MANUAL"
        ? "MANUAL"
        : defaultDocType === "FORM"
        ? "FORM"
        : "OTHER";
    setFormCategory(initCategory);
    setFormVisibility("PUBLIC");
    setFormIsPublished(true);
    setFileMode("upload");
    setFormFileUrl("");
    setUploadedFileName(null);
    setModalOpen(true);
  };

  // Open Edit Dialog
  const openEditDialog = (item: AdminDocument) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormDescription(item.description ?? "");
    setFormCategory(item.category);
    setFormDocType(item.docType || "GENERAL");
    setFormDocNumber(item.docNumber ?? "");
    setFormYear(item.year ?? "2569");
    setFormIssuerLevel((item.issuerLevel as "FACULTY" | "UNIVERSITY") || "FACULTY");
    setFormVisibility(item.visibility);
    setFormIsPublished(item.isPublished);
    setFormFileUrl(item.fileUrl);
    setFileMode(item.fileUrl.startsWith("/uploads/") ? "upload" : "url");
    setUploadedFileName(
      item.fileUrl.startsWith("/uploads/") ? item.fileUrl.split("/").pop() || null : null
    );
    setModalOpen(true);
  };

  // Handle File Upload to Server
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await uploadAdminDocumentFileAction(formData);
      if (res.ok) {
        setFormFileUrl(res.data.url);
        setUploadedFileName(res.data.fileName);
        toast.success(t("administration.upload.success"));
      } else {
        toast.error(res.error?.message || "อัปโหลดไฟล์ไม่สำเร็จ");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการอัปโหลดไฟล์");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Save (Create / Update)
  const handleSave = () => {
    if (!formTitle.trim()) {
      toast.error("กรุณาระบุชื่อเอกสาร");
      return;
    }
    if (!formFileUrl.trim()) {
      toast.error("กรุณาอัปโหลดไฟล์เอกสาร หรือระบุลิงก์ดาวน์โหลด");
      return;
    }

    startTransition(async () => {
      const payload = {
        title: formTitle.trim(),
        description: formDescription.trim() || null,
        category: formCategory,
        docType: formDocType,
        docNumber: formDocNumber.trim() || null,
        year: formYear.trim() || null,
        issuerLevel: formIssuerLevel,
        visibility: formVisibility,
        isPublished: formIsPublished,
        fileUrl: formFileUrl.trim(),
      };

      if (editingItem) {
        const res = await updateAdminDocumentAction(editingItem.id, payload);
        if (res.ok) {
          toast.success(t("administration.updateSuccess"));
          setModalOpen(false);
          await refreshItems();
        } else {
          toast.error(res.error?.message || "บันทึกข้อมูลไม่สำเร็จ");
        }
      } else {
        const res = await createAdminDocumentAction(payload);
        if (res.ok) {
          toast.success(t("administration.createSuccess"));
          setModalOpen(false);
          await refreshItems();
        } else {
          toast.error(res.error?.message || "เพิ่มเอกสารไม่สำเร็จ");
        }
      }
    });
  };

  // Handle Delete
  const handleDelete = () => {
    if (!deleteConfirmItem) return;

    startTransition(async () => {
      const res = await deleteAdminDocumentAction(deleteConfirmItem.id);
      if (res.ok) {
        toast.success(t("administration.deleteSuccess"));
        setDeleteConfirmItem(null);
        await refreshItems();
      } else {
        toast.error(res.error?.message || "ลบเอกสารไม่สำเร็จ");
      }
    });
  };

  const [_isExportingSar, setIsExportingSar] = useState(false);

  const _handleExportSarPackage = async () => {
    setIsExportingSar(true);
    try {
      const res = await getFacultySarPackageAction();
      if (!res.ok) {
        toast.error(res.error.message || "ไม่สามารถดึงข้อมูลรายงาน SAR ได้");
        return;
      }
      const blob = new Blob([res.data.csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `MCU_Buddhism_Faculty_SAR_Report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("ส่งออกรายงานข้อมูลสังเคราะห์ SAR / ประกันคุณภาพการศึกษา เรียบร้อยแล้ว (เปิดใน Excel ได้ทันที)");
    } catch {
      toast.error("เกิดข้อผิดพลาดในการส่งออกรายงาน SAR");
    } finally {
      setIsExportingSar(false);
    }
  };

  // Export to CSV with UTF-8 BOM
  const handleExportCsv = () => {
    if (items.length === 0) {
      toast.error("ไม่มีข้อมูลสำหรับส่งออก");
      return;
    }

    const headers = [
      "DocNumber",
      "Year",
      "IssuerLevel",
      "DocType",
      "Title",
      "Description",
      "Category",
      "Visibility",
      "IsPublished",
      "FileUrl",
      "CreatedAt",
    ];
    const rows = items.map((doc) => [
      `"${(doc.docNumber || "").replace(/"/g, '""')}"`,
      `"${(doc.year || "").replace(/"/g, '""')}"`,
      doc.issuerLevel || "FACULTY",
      doc.docType || "GENERAL",
      `"${(doc.title || "").replace(/"/g, '""')}"`,
      `"${(doc.description || "").replace(/"/g, '""')}"`,
      doc.category,
      doc.visibility,
      doc.isPublished ? "TRUE" : "FALSE",
      `"${(doc.fileUrl || "").replace(/"/g, '""')}"`,
      doc.createdAt ? new Date(doc.createdAt).toISOString() : "",
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `mcu_documents_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("ส่งออกไฟล์ CSV สำเร็จ (เปิดใน Excel ได้ภาษาไทยไม่เพี้ยน)");
  };

  // Export to JSON
  const handleExportJson = () => {
    if (items.length === 0) {
      toast.error("ไม่มีข้อมูลสำหรับส่งออก");
      return;
    }

    const exportData = items.map((doc) => ({
      docNumber: doc.docNumber,
      year: doc.year,
      issuerLevel: doc.issuerLevel,
      docType: doc.docType,
      title: doc.title,
      description: doc.description,
      category: doc.category,
      visibility: doc.visibility,
      isPublished: doc.isPublished,
      fileUrl: doc.fileUrl,
    }));

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(exportData, null, 2))}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `mcu_documents_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    toast.success("ส่งออกไฟล์ JSON สำเร็จ");
  };

  // Download Sample CSV Template
  const handleDownloadTemplate = () => {
    const templateContent =
      "\uFEFFDocNumber,Year,IssuerLevel,DocType,Title,Description,Category,Visibility,IsPublished,FileUrl\n" +
      '"๑๕/๒๕๖๘","2568","FACULTY","ORDER","คำสั่งคณะพุทธศาสตร์ เรื่อง แต่งตั้งคณะกรรมการพัฒนาหลักสูตร","คำสั่งแต่งตั้งคณะกรรมการปรับปรุงหลักสูตรพุทธศาสตรบัณฑิต",POLICY,PUBLIC,TRUE,"https://example.com/orders/order-15-2568.pdf"\n' +
      '"๑/๒๕๖๙","2569","FACULTY","ANNOUNCEMENT","ประกาศคณะพุทธศาสตร์ เรื่อง ปฏิทินการศึกษาประจำปี ๒๕๖๙","กำหนดการเปิด-ปิดภาคเรียนและการลงทะเบียน",POLICY,PUBLIC,TRUE,"https://example.com/announcements/ann-1-2569.pdf"\n' +
      '"-","2569","FACULTY","FORM","แบบฟอร์มขออนุมัติโครงการ","แบบฟอร์มเสนอโครงการประจำปีการศึกษา",FORM,PUBLIC,TRUE,"https://example.com/forms/project.pdf"\n';

    const blob = new Blob([templateContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "documents_import_template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  // Handle Import File Selection & Parsing
  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    const text = await file.text();

    try {
      if (file.name.endsWith(".json")) {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          setImportParsedData(parsed);
          setImportPreviewCount(parsed.length);
          toast.success(`พบข้อมูลเอกสาร ${parsed.length} รายการพร้อมนำเข้า`);
        } else {
          toast.error("ไฟล์ JSON ต้องเป็น Array ของเอกสาร");
        }
      } else {
        // Parse CSV
        const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
        if (lines.length < 2) {
          toast.error("ไฟล์ CSV ต้องมีหัวตารางและข้อมูลอย่างน้อย 1 แถว");
          return;
        }

        const headerLine = lines[0].toLowerCase();
        const hasDocNumberHeader = headerLine.includes("docnumber");

        const dataRows = lines.slice(1);
        const parsedRows = dataRows.map((line) => {
          // Simple CSV splitter handling quotes
          const match = line.match(/(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^,]*))/g);
          const fields = (match || []).map((m) =>
            m.replace(/^,/, "").replace(/^"(.*)"$/, "$1").replace(/""/g, '"').trim()
          );

          if (hasDocNumberHeader) {
            return {
              docNumber: fields[0] || null,
              year: fields[1] || null,
              issuerLevel: ["UNIVERSITY", "FACULTY"].includes(fields[2]?.toUpperCase())
                ? fields[2].toUpperCase()
                : "FACULTY",
              docType: fields[3]?.toUpperCase() || "GENERAL",
              title: fields[4] || "",
              description: fields[5] || "",
              category: ["FORM", "MANUAL", "POLICY", "OTHER"].includes(fields[6]?.toUpperCase())
                ? fields[6].toUpperCase()
                : "FORM",
              visibility: ["PUBLIC", "INTERNAL"].includes(fields[7]?.toUpperCase())
                ? fields[7].toUpperCase()
                : "PUBLIC",
              isPublished: fields[8]?.toUpperCase() !== "FALSE",
              fileUrl: fields[9] || "",
            };
          } else {
            return {
              title: fields[0] || "",
              description: fields[1] || "",
              category: ["FORM", "MANUAL", "POLICY", "OTHER"].includes(fields[2]?.toUpperCase())
                ? fields[2].toUpperCase()
                : "FORM",
              visibility: ["PUBLIC", "INTERNAL"].includes(fields[3]?.toUpperCase())
                ? fields[3].toUpperCase()
                : "PUBLIC",
              isPublished: fields[4]?.toUpperCase() !== "FALSE",
              fileUrl: fields[5] || "",
            };
          }
        }).filter((item) => item.title && item.fileUrl);

        setImportParsedData(parsedRows);
        setImportPreviewCount(parsedRows.length);
        toast.success(`พบข้อมูลเอกสาร ${parsedRows.length} รายการพร้อมนำเข้า`);
      }
    } catch {
      toast.error("ไม่สามารถอ่านข้อมูลในไฟล์ได้ กรุณาตรวจสอบรูปแบบไฟล์");
    }
  };

  // Execute Import
  const handleExecuteImport = async () => {
    if (importParsedData.length === 0) {
      toast.error("ไม่มีข้อมูลที่สามารถนำเข้าได้");
      return;
    }

    setIsImporting(true);
    try {
      const res = await importAdminDocumentsAction(importParsedData);
      if (res.ok) {
        toast.success(`นำเข้าเอกสารสำเร็จ ${res.data.count} รายการ`);
        setImportModalOpen(false);
        setImportParsedData([]);
        setImportFile(null);
        await refreshItems();
      } else {
        toast.error(res.error?.message || "เกิดข้อผิดพลาดในการนำเข้า");
      }
    } catch {
      toast.error("นำเข้าข้อมูลล้มเหลว");
    } finally {
      setIsImporting(false);
    }
  };

  // Table Columns Definition
  const columns: DataTableColumn<AdminDocument>[] = [
    {
      key: "docNumber",
      header: "เลขที่ / พ.ศ.",
      className: "w-32",
      render: (row) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-slate-800 text-xs">
            {row.docNumber || "-"}
          </div>
          {row.year && (
            <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
              พ.ศ. {row.year}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "title",
      header: t("administration.field.title"),
      render: (row) => (
        <div className="space-y-1 py-1 max-w-md">
          <div className="flex items-center gap-1.5 flex-wrap">
            {row.issuerLevel === "UNIVERSITY" && (
              <span className="inline-flex items-center gap-0.5 rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-700 ring-1 ring-purple-600/20">
                🏛️ ระดับมหาวิทยาลัย
              </span>
            )}
            {row.issuerLevel === "FACULTY" && (
              <span className="inline-flex items-center gap-0.5 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 ring-1 ring-indigo-600/20">
                🛕 คณะพุทธศาสตร์
              </span>
            )}
            {row.docType && row.docType !== "GENERAL" && (
              <span className="inline-flex items-center rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 ring-1 ring-amber-600/20">
                {row.docType === "ORDER"
                  ? "คำสั่ง"
                  : row.docType === "ANNOUNCEMENT"
                  ? "ประกาศ"
                  : row.docType === "REGULATION"
                  ? "ระเบียบ"
                  : row.docType === "FORM"
                  ? "แบบฟอร์ม"
                  : row.docType === "MANUAL"
                  ? "คู่มือ"
                  : row.docType}
              </span>
            )}
          </div>
          <div className="font-semibold text-slate-900 line-clamp-1">{row.title}</div>
          {row.description && (
            <p className="text-xs text-slate-500 line-clamp-1">{row.description}</p>
          )}
        </div>
      ),
    },
    {
      key: "category",
      header: t("administration.field.category"),
      render: (row) => {
        const catMap: Record<DocumentCategory, { label: string; tone: "ok" | "warn" | "info" | "off" }> = {
          FORM: { label: t("administration.category.FORM"), tone: "info" },
          MANUAL: { label: t("administration.category.MANUAL"), tone: "ok" },
          POLICY: { label: t("administration.category.POLICY"), tone: "warn" },
          OTHER: { label: t("administration.category.OTHER"), tone: "off" },
        };
        const config = catMap[row.category] || { label: row.category, tone: "off" };
        return <StatusPill tone={config.tone}>{config.label}</StatusPill>;
      },
    },
    {
      key: "visibility",
      header: t("administration.field.visibility"),
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            row.visibility === "PUBLIC"
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
              : "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
          }`}
        >
          {row.visibility === "PUBLIC" ? (
            <>
              <Globe className="h-3 w-3" /> สาธารณะ
            </>
          ) : (
            <>
              <Lock className="h-3 w-3" /> บุคลากรภายใน
            </>
          )}
        </span>
      ),
    },
    {
      key: "isPublished",
      header: t("administration.field.isPublished"),
      render: (row) => (
        <span
          className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${
            row.isPublished ? "bg-slate-100 text-slate-700" : "bg-rose-50 text-rose-600"
          }`}
        >
          {row.isPublished ? t("administration.published") : t("administration.draft")}
        </span>
      ),
    },
    {
      key: "updatedAt",
      header: "อัปเดตล่าสุด",
      className: "nowrap text-xs text-slate-500",
      render: (row) => <span>{formatDate(row.updatedAt, locale)}</span>,
    },
    {
      key: "fileUrl",
      header: "เปิดไฟล์",
      render: (row) => (
        <a
          href={row.fileUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-slate-50 hover:text-indigo-700"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          ดูเอกสาร
        </a>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                {t("administration.title")}
              </h1>
              <p className="text-xs text-slate-500">{t("administration.subtitle")}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Public View Shortcut Button */}
          <Link
            href="/documents"
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/80 px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-xs transition hover:bg-indigo-100"
            title="เปิดดูหน้าทำเนียบคำสั่ง ประกาศ และแบบฟอร์มสาธารณะ (/documents)"
          >
            <Globe className="h-3.5 w-3.5 text-indigo-600" />
            <span>ดูหน้าสาธารณะ (View Public View ↗)</span>
          </Link>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={refreshItems}
            disabled={isPending}
            className="gap-1.5 text-xs"
            title="รีเฟรชรายการเอกสาร"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
            รีเฟรช
          </Button>

          {/* Export Dropdown / Buttons */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-xs">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
              title="ส่งออกรายการเอกสารเป็นไฟล์ CSV เพื่อเปิดใน Excel"
            >
              <Download className="h-3.5 w-3.5 text-emerald-600" />
              CSV
            </button>
            <span className="h-3.5 w-[1px] bg-slate-200" />
            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
              title="ส่งออกรายการเอกสารเป็นไฟล์ JSON"
            >
              <FileCode className="h-3.5 w-3.5 text-indigo-600" />
              JSON
            </button>
          </div>

          {/* Manage Actions */}
          {canManage && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImportModalOpen(true)}
                className="gap-1.5 text-xs"
              >
                <Upload className="h-3.5 w-3.5 text-indigo-600" />
                {t("administration.import")}
              </Button>

              <Button
                size="sm"
                onClick={() => openCreateDialog()}
                className="gap-1.5 bg-indigo-600 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                {t("administration.add")}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="space-y-2.5 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
          <div className="relative sm:col-span-6 md:col-span-5">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อเอกสาร, เลขที่คำสั่ง/ประกาศ, คำอธิบาย..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-800 shadow-xs focus:border-indigo-500 focus:bg-white focus:outline-hidden"
            />
          </div>

          <div className="sm:col-span-3 md:col-span-2">
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-xs focus:border-indigo-500 focus:outline-hidden"
            >
              <option value="ALL">-- ทุกปี พ.ศ. --</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  พ.ศ. {yr}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3 md:col-span-3">
            <select
              value={issuerLevelFilter}
              onChange={(e) => setIssuerLevelFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-xs focus:border-indigo-500 focus:outline-hidden"
            >
              <option value="ALL">-- ทุกระดับหน่วยงาน --</option>
              <option value="FACULTY">🛕 คณะพุทธศาสตร์</option>
              <option value="UNIVERSITY">🏛️ มหาวิทยาลัย (มจร.)</option>
            </select>
          </div>

          <div className="sm:col-span-3 md:col-span-2">
            <select
              value={docTypeFilter}
              onChange={(e) => setDocTypeFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-xs focus:border-indigo-500 focus:outline-hidden"
            >
              <option value="ALL">-- ทุกประเภท --</option>
              <option value="ORDER">📋 คำสั่ง</option>
              <option value="ANNOUNCEMENT">📢 ประกาศ</option>
              <option value="REGULATION">⚖️ ระเบียบ/ข้อบังคับ</option>
              <option value="FORM">📁 แบบฟอร์ม</option>
              <option value="MANUAL">📖 คู่มือ</option>
              <option value="GENERAL">📄 เอกสารทั่วไป</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500">ตัวกรองเพิ่มเติม:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 shadow-xs focus:border-indigo-500 focus:outline-hidden"
            >
              <option value="ALL">หมวดหมู่ทั้งหมด</option>
              <option value="FORM">แบบฟอร์ม (Form)</option>
              <option value="MANUAL">คู่มือปฏิบัติงาน (Manual)</option>
              <option value="POLICY">ระเบียบ/ประกาศ (Policy)</option>
              <option value="OTHER">อื่นๆ (Other)</option>
            </select>

            <select
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 shadow-xs focus:border-indigo-500 focus:outline-hidden"
            >
              <option value="ALL">ระดับสิทธิ์ทั้งหมด</option>
              <option value="PUBLIC">สาธารณะ (Public)</option>
              <option value="INTERNAL">เฉพาะบุคลากรภายใน (Internal)</option>
            </select>
          </div>

          {(search ||
            yearFilter !== "ALL" ||
            issuerLevelFilter !== "ALL" ||
            docTypeFilter !== "ALL" ||
            categoryFilter !== "ALL" ||
            visibilityFilter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setYearFilter("ALL");
                setIssuerLevelFilter("ALL");
                setDocTypeFilter("ALL");
                setCategoryFilter("ALL");
                setVisibilityFilter("ALL");
              }}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          )}
        </div>
      </div>

      {/* Statistics Header */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500">เอกสารทั้งหมด</div>
          <div className="mt-1 text-xl font-bold text-slate-900">{items.length}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="text-[11px] font-medium text-purple-600">คำสั่งและประกาศ</div>
          <div className="mt-1 text-xl font-bold text-purple-700">
            {
              items.filter(
                (i) =>
                  i.docType === "ORDER" ||
                  i.docType === "ANNOUNCEMENT" ||
                  i.docType === "REGULATION" ||
                  i.category === "POLICY"
              ).length
            }
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="text-[11px] font-medium text-indigo-600">แบบฟอร์ม & คู่มือ</div>
          <div className="mt-1 text-xl font-bold text-indigo-700">
            {
              items.filter(
                (i) =>
                  i.category === "FORM" ||
                  i.category === "MANUAL" ||
                  i.docType === "FORM" ||
                  i.docType === "MANUAL"
              ).length
            }
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="text-[11px] font-medium text-emerald-600">เผยแพร่สาธารณะ</div>
          <div className="mt-1 text-xl font-bold text-emerald-700">
            {items.filter((i) => i.visibility === "PUBLIC").length}
          </div>
        </div>
      </div>

      {/* Main Documents DataTable */}
      <LiyonCard>
        <DataTable<AdminDocument>
          state={filteredItems.length === 0 ? "empty" : "data"}
          rows={filteredItems}
          columns={columns}
          getRowId={(row) => row.id}
          headHeading="รายการเอกสารและแบบฟอร์มทั้งหมด"
          headMeta={`แสดง ${filteredItems.length} จากทั้งหมด ${items.length} รายการ`}
          renderRowMenu={
            canManage
              ? (row) => (
                  <>
                    <RowMenuItem
                      onSelect={() => openEditDialog(row)}
                      icon={<Edit2 className="h-4 w-4" />}
                    >
                      {t("administration.edit")}
                    </RowMenuItem>
                    <RowMenuItem
                      onSelect={() => setDeleteConfirmItem(row)}
                      danger
                      icon={<Trash2 className="h-4 w-4" />}
                    >
                      {t("administration.delete")}
                    </RowMenuItem>
                  </>
                )
              : undefined
          }
          empty={{
            icon: <Layers className="h-10 w-10 text-slate-300" />,
            title: "ไม่พบรายการเอกสาร",
            description: "ยังไม่มีเอกสารในหมวดหมู่ที่เลือก หรือไม่มีผลลัพธ์จากการค้นหา",
          }}
          error={{
            icon: <AlertCircle className="h-10 w-10 text-rose-500" />,
            title: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
          }}
        />
      </LiyonCard>

      {/* CREATE / EDIT DIALOG */}
      <LiyonDialog open={modalOpen} onOpenChange={setModalOpen}>
        <LiyonDialogCloseButton label="ปิด" />
        <LiyonDialogHeader
          title={editingItem ? t("administration.edit") : t("administration.add")}
          description="กรอกข้อมูลเอกสารและเลือกไฟล์ที่ต้องการเผยแพร่"
        />
        <LiyonDialogBody>
          <div className="space-y-4 py-2">
            {/* Document Type & Issuer Level */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <LiyonField label={t("administration.field.docType")} htmlFor="doc-type">
                <select
                  id="doc-type"
                  value={formDocType}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setFormDocType(newType);
                    if (newType === "ORDER" || newType === "ANNOUNCEMENT" || newType === "REGULATION") {
                      setFormCategory("POLICY");
                    } else if (newType === "FORM") {
                      setFormCategory("FORM");
                    } else if (newType === "MANUAL") {
                      setFormCategory("MANUAL");
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-xs focus:border-indigo-500 focus:outline-hidden"
                >
                  <option value="GENERAL">{t("administration.docType.GENERAL")}</option>
                  <option value="ORDER">{t("administration.docType.ORDER")}</option>
                  <option value="ANNOUNCEMENT">{t("administration.docType.ANNOUNCEMENT")}</option>
                  <option value="REGULATION">{t("administration.docType.REGULATION")}</option>
                  <option value="FORM">{t("administration.docType.FORM")}</option>
                  <option value="MANUAL">{t("administration.docType.MANUAL")}</option>
                </select>
              </LiyonField>

              <LiyonField label={t("administration.field.issuerLevel")} htmlFor="doc-issuer">
                <select
                  id="doc-issuer"
                  value={formIssuerLevel}
                  onChange={(e) => setFormIssuerLevel(e.target.value as "FACULTY" | "UNIVERSITY")}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-xs focus:border-indigo-500 focus:outline-hidden"
                >
                  <option value="FACULTY">{t("administration.issuerLevel.FACULTY")}</option>
                  <option value="UNIVERSITY">{t("administration.issuerLevel.UNIVERSITY")}</option>
                </select>
              </LiyonField>
            </div>

            {/* Document Number & Year */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <LiyonField label={t("administration.field.docNumber")} htmlFor="doc-number">
                <input
                  id="doc-number"
                  type="text"
                  value={formDocNumber}
                  onChange={(e) => setFormDocNumber(e.target.value)}
                  placeholder="เช่น ๑๕/๒๕๖๙ หรือ มจร ๐๐๑/๒๕๖๙"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-xs focus:border-indigo-500 focus:outline-hidden"
                />
              </LiyonField>

              <LiyonField label={t("administration.field.year")} htmlFor="doc-year">
                <input
                  id="doc-year"
                  type="text"
                  value={formYear}
                  onChange={(e) => setFormYear(e.target.value)}
                  placeholder="เช่น 2569, 2568 (ปี พ.ศ.)"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-xs focus:border-indigo-500 focus:outline-hidden"
                />
              </LiyonField>
            </div>

            {/* Title */}
            <LiyonField label={t("administration.field.title")} htmlFor="doc-title">
              <input
                id="doc-title"
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="เช่น คำสั่งแต่งตั้งคณะกรรมการประจำคณะพุทธศาสตร์, แบบฟอร์มขออนุมัติโครงการ"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-xs focus:border-indigo-500 focus:outline-hidden"
                required
              />
            </LiyonField>

            {/* Description */}
            <LiyonField label={t("administration.field.description")} htmlFor="doc-desc">
              <textarea
                id="doc-desc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
                placeholder="คำอธิบายรายละเอียดเพิ่มเติมของเอกสาร (ถ้ามี)"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-xs focus:border-indigo-500 focus:outline-hidden"
              />
            </LiyonField>

            {/* Category & Visibility */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <LiyonField label={t("administration.field.category")} htmlFor="doc-category">
                <select
                  id="doc-category"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as DocumentCategory)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-xs focus:border-indigo-500 focus:outline-hidden"
                >
                  <option value="POLICY">ระเบียบ/คำสั่ง/ประกาศ (Policy)</option>
                  <option value="FORM">แบบฟอร์ม (Form)</option>
                  <option value="MANUAL">คู่มือปฏิบัติงาน (Manual)</option>
                  <option value="OTHER">อื่นๆ (Other)</option>
                </select>
              </LiyonField>

              <LiyonField label={t("administration.field.visibility")} htmlFor="doc-visibility">
                <select
                  id="doc-visibility"
                  value={formVisibility}
                  onChange={(e) => setFormVisibility(e.target.value as DocumentVisibility)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-xs focus:border-indigo-500 focus:outline-hidden"
                >
                  <option value="PUBLIC">สาธารณะ (ทุกคนดาวน์โหลดได้)</option>
                  <option value="INTERNAL">เฉพาะบุคลากรภายใน (ต้องล็อกอิน)</option>
                </select>
              </LiyonField>
            </div>

            {/* Publish Toggle */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <div>
                <div className="text-xs font-semibold text-slate-800">
                  {t("administration.field.isPublished")}
                </div>
                <div className="text-[11px] text-slate-500">
                  {formIsPublished
                    ? "เอกสารนี้จะปรากฏให้ผู้ใช้งานดาวน์โหลดได้ทันที"
                    : "ซ่อนเอกสารไว้เป็นแบบร่าง ยังไม่แสดงในหน้ารวมเอกสาร"}
                </div>
              </div>
              <input
                type="checkbox"
                checked={formIsPublished}
                onChange={(e) => setFormIsPublished(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
            </div>

            {/* File Source (Upload vs URL) */}
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  {t("administration.field.fileUrl")}
                </label>
                <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setFileMode("upload")}
                    className={`rounded-md px-2.5 py-1 font-medium transition ${
                      fileMode === "upload"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    อัปโหลดไฟล์
                  </button>
                  <button
                    type="button"
                    onClick={() => setFileMode("url")}
                    className={`rounded-md px-2.5 py-1 font-medium transition ${
                      fileMode === "url"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    ระบุลิงก์ URL
                  </button>
                </div>
              </div>

              {fileMode === "upload" ? (
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.zip,.rar"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-indigo-200 bg-white p-4 text-center transition hover:border-indigo-400 hover:bg-indigo-50/40"
                  >
                    {isUploading ? (
                      <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        กำลังอัปโหลดไฟล์ไปยังเซิร์ฟเวอร์...
                      </div>
                    ) : formFileUrl ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-600">
                          <FileCheck className="h-4 w-4" />
                          {uploadedFileName || "ไฟล์เอกสารถูกอัปโหลดแล้ว"}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          คลิกเพื่อเลือกและอัปโหลดไฟล์ใหม่แทนที่
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <FileUp className="mx-auto h-7 w-7 text-indigo-600" />
                        <div className="text-xs font-semibold text-slate-700">
                          คลิกเพื่อเลือกไฟล์เอกสารจากเครื่อง
                        </div>
                        <div className="text-[11px] text-slate-400">
                          รองรับ PDF, Word, Excel, PPT, รูปภาพ (สูงสุด 30MB)
                        </div>
                      </div>
                    )}
                  </div>
                  {formFileUrl && (
                    <div className="flex items-center justify-between rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-600">
                      <span className="truncate max-w-[340px]">เส้นทางไฟล์: {formFileUrl}</span>
                      <a
                        href={formFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:underline"
                      >
                        ทดสอบเปิดไฟล์
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <input
                    type="url"
                    value={formFileUrl}
                    onChange={(e) => setFormFileUrl(e.target.value)}
                    placeholder="https://drive.google.com/... หรือ https://mcu.ac.th/..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-xs focus:border-indigo-500 focus:outline-hidden"
                  />
                  <p className="text-[11px] text-slate-500">
                    ใส่ลิงก์ URL ที่เปิดให้ดาวน์โหลดได้โดยตรง เช่น Google Drive, OneDrive หรือ MCU Cloud
                  </p>
                </div>
              )}
            </div>
          </div>
        </LiyonDialogBody>
        <LiyonDialogFooter>
          <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
            {t("administration.cancel")}
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isPending || isUploading}
            className="bg-indigo-600 hover:bg-indigo-700 font-semibold"
          >
            {isPending ? t("administration.saving") : t("administration.save")}
          </Button>
        </LiyonDialogFooter>
      </LiyonDialog>

      {/* DELETE CONFIRM DIALOG */}
      <LiyonDialog
        open={!!deleteConfirmItem}
        onOpenChange={(open) => !open && setDeleteConfirmItem(null)}
      >
        <LiyonDialogCloseButton label="ปิด" />
        <LiyonDialogHeader
          title={t("administration.delete")}
          description={t("administration.deleteConfirm")}
        />
        <LiyonDialogBody>
          <div className="py-2 text-xs text-slate-600">
            คุณต้องการลบเอกสาร{" "}
            <span className="font-bold text-slate-900">{deleteConfirmItem?.title}</span>{" "}
            ออกจากระบบอย่างถาวรหรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
          </div>
        </LiyonDialogBody>
        <LiyonDialogFooter>
          <Button variant="outline" size="sm" onClick={() => setDeleteConfirmItem(null)}>
            {t("administration.cancel")}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={handleDelete}
            className="font-semibold"
          >
            {isPending ? "กำลังลบ..." : "ยืนยันการลบ"}
          </Button>
        </LiyonDialogFooter>
      </LiyonDialog>

      {/* IMPORT DIALOG */}
      <LiyonDialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <LiyonDialogCloseButton label="ปิด" />
        <LiyonDialogHeader
          title={t("administration.import")}
          description={t("administration.import.description")}
        />
        <LiyonDialogBody>
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
              <div className="text-xs text-slate-600">
                ยังไม่มีรูปแบบไฟล์นำเข้า? ดาวน์โหลดเทมเพลตมาตรฐานได้ที่นี่
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="gap-1.5 text-xs shrink-0"
              >
                <Download className="h-3.5 w-3.5 text-emerald-600" />
                โหลดตัวอย่าง CSV
              </Button>
            </div>

            <input
              ref={importInputRef}
              type="file"
              accept=".csv,.json"
              onChange={handleImportFileChange}
              className="hidden"
            />

            <div
              onClick={() => importInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-indigo-200 bg-white p-6 text-center transition hover:border-indigo-400 hover:bg-indigo-50/40"
            >
              <Upload className="mx-auto h-8 w-8 text-indigo-600" />
              <div className="mt-2 text-xs font-semibold text-slate-800">
                {importFile ? importFile.name : "คลิกเลือกไฟล์ CSV หรือ JSON สำหรับนำเข้า"}
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                ระบบจะตรวจสอบความถูกต้องของหัวตารางและนำเข้ารายการอัตโนมัติ
              </div>
            </div>

            {importPreviewCount > 0 && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                  <FileCheck className="h-4 w-4" />
                  พร้อมนำเข้าเอกสารจำนวน {importPreviewCount} รายการ
                </div>
                <div className="mt-1 text-[11px] text-emerald-700">
                  กดปุ่ม &quot;ยืนยันนำเข้าข้อมูล&quot; ด้านล่างเพื่อเพิ่มข้อมูลทั้งหมดลงในระบบ
                </div>
              </div>
            )}
          </div>
        </LiyonDialogBody>
        <LiyonDialogFooter>
          <Button variant="outline" size="sm" onClick={() => setImportModalOpen(false)}>
            {t("administration.cancel")}
          </Button>
          <Button
            size="sm"
            onClick={handleExecuteImport}
            disabled={isImporting || importPreviewCount === 0}
            className="bg-indigo-600 hover:bg-indigo-700 font-semibold"
          >
            {isImporting ? "กำลังนำเข้า..." : `ยืนยันนำเข้าข้อมูล (${importPreviewCount})`}
          </Button>
        </LiyonDialogFooter>
      </LiyonDialog>
    </div>
  );
}
