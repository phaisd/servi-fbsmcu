"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  Lock,
  Search,
  ExternalLink,
  Layers,
  ScrollText,
  FolderOpen,
  Building2,
  Calendar,
  Settings,
} from "lucide-react";
import type { AdminDocument } from "@/generated/prisma";
import { formatDate } from "@/shared/lib/format";

interface Props {
  initialItems: AdminDocument[];
  isInternalUser: boolean;
  locale: string;
}

type ViewMode = "forms" | "directory";

export function PublicDocumentsClient({ initialItems, isInternalUser, locale }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("directory");
  const [search, setSearch] = useState("");

  // Filter states for Forms & General Documents view
  const [activeCategory, setActiveCategory] = useState<string>("ALL");

  // Filter states for Orders & Announcements Directory view
  const [selectedYear, setSelectedYear] = useState<string>("ALL");
  const [selectedIssuer, setSelectedIssuer] = useState<string>("ALL");
  const [selectedDocType, setSelectedDocType] = useState<string>("ALL");

  // Compute available years from documents
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    // Default current Buddhist years
    ["2569", "2568", "2567"].forEach((y) => yearsSet.add(y));
    initialItems.forEach((item) => {
      if (item.year && item.year.trim()) {
        yearsSet.add(item.year.trim());
      }
    });
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [initialItems]);

  // Categories for Form View
  const categories: { id: string; label: string }[] = [
    { id: "ALL", label: locale === "th" ? "เอกสารทั้งหมด" : "All Documents" },
    { id: "FORM", label: locale === "th" ? "แบบฟอร์มคำขอ" : "Forms" },
    { id: "MANUAL", label: locale === "th" ? "คู่มือปฏิบัติงาน" : "Manuals" },
    { id: "POLICY", label: locale === "th" ? "ระเบียบและแนวปฏิบัติ" : "Policies & Guidelines" },
    { id: "OTHER", label: locale === "th" ? "เอกสารทั่วไปอื่นๆ" : "Others" },
  ];

  // Filter items for Forms View
  const filteredFormsItems = useMemo(() => {
    return initialItems.filter((item) => {
      const matchSearch =
        !search.trim() ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(search.toLowerCase())) ||
        (item.docNumber && item.docNumber.toLowerCase().includes(search.toLowerCase()));

      const matchCategory = activeCategory === "ALL" || item.category === activeCategory;

      return matchSearch && matchCategory;
    });
  }, [initialItems, search, activeCategory]);

  // Filter items for Orders & Announcements Directory View
  const filteredDirectoryItems = useMemo(() => {
    return initialItems.filter((item) => {
      // In directory mode, we prioritize ORDER, ANNOUNCEMENT, REGULATION, or POLICY category
      // If user chose a specific docType, filter by that; otherwise show all directory-relevant items
      const matchSearch =
        !search.trim() ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(search.toLowerCase())) ||
        (item.docNumber && item.docNumber.toLowerCase().includes(search.toLowerCase()));

      const matchYear = selectedYear === "ALL" || item.year === selectedYear;

      const matchIssuer = selectedIssuer === "ALL" || item.issuerLevel === selectedIssuer;

      const matchDocType =
        selectedDocType === "ALL"
          ? true
          : item.docType === selectedDocType;

      return matchSearch && matchYear && matchIssuer && matchDocType;
    });
  }, [initialItems, search, selectedYear, selectedIssuer, selectedDocType]);

  // Group filtered forms items by category
  const groupedForms = useMemo(() => {
    return filteredFormsItems.reduce((acc, item) => {
      const cat = item.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {} as Record<string, typeof filteredFormsItems>);
  }, [filteredFormsItems]);

  const getCategoryName = (cat: string) => {
    switch (cat) {
      case "FORM":
        return locale === "th" ? "แบบฟอร์มคำขอ (Forms)" : "Forms";
      case "MANUAL":
        return locale === "th" ? "คู่มือปฏิบัติงาน (Manuals)" : "Manuals";
      case "POLICY":
        return locale === "th" ? "ระเบียบและข้อกำหนด (Policies & Regulations)" : "Policies";
      default:
        return locale === "th" ? "เอกสารทั่วไป (General Documents)" : "Others";
    }
  };

  const getFileBadge = (fileUrl: string) => {
    const ext = fileUrl.split(".").pop()?.toLowerCase();
    if (ext === "pdf") {
      return <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">PDF</span>;
    }
    if (ext === "doc" || ext === "docx") {
      return <span className="rounded bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">WORD</span>;
    }
    if (ext === "xls" || ext === "xlsx" || ext === "csv") {
      return <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">EXCEL</span>;
    }
    if (fileUrl.startsWith("http")) {
      return <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">LINK</span>;
    }
    return <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">FILE</span>;
  };

  const getDocTypeBadge = (docType: string | null) => {
    switch (docType) {
      case "ORDER":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700 ring-1 ring-purple-600/20">
            📋 {locale === "th" ? "คำสั่ง" : "Order"}
          </span>
        );
      case "ANNOUNCEMENT":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-600/20">
            📢 {locale === "th" ? "ประกาศ" : "Announcement"}
          </span>
        );
      case "REGULATION":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-600/20">
            ⚖️ {locale === "th" ? "ระเบียบ/ข้อบังคับ" : "Regulation"}
          </span>
        );
      case "FORM":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
            📁 {locale === "th" ? "แบบฟอร์ม" : "Form"}
          </span>
        );
      case "MANUAL":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-600/20">
            📖 {locale === "th" ? "คู่มือ" : "Manual"}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            📄 {locale === "th" ? "เอกสารทั่วไป" : "General"}
          </span>
        );
    }
  };

  const getIssuerBadge = (level: string | null) => {
    if (level === "UNIVERSITY") {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-indigo-600/20">
          🏛️ {locale === "th" ? "ระดับมหาวิทยาลัย (มจร.)" : "University Level (MCU)"}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-600/20">
        🛕 {locale === "th" ? "ระดับคณะพุทธศาสตร์" : "Faculty of Buddhism"}
      </span>
    );
  };

  // Counts for quick metrics
  const orderAnnouncementCount = initialItems.filter(
    (i) => i.docType === "ORDER" || i.docType === "ANNOUNCEMENT" || i.docType === "REGULATION" || i.category === "POLICY"
  ).length;

  const formManualCount = initialItems.filter(
    (i) => i.category === "FORM" || i.category === "MANUAL" || i.docType === "FORM" || i.docType === "MANUAL"
  ).length;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700">
            <Building2 className="h-4 w-4" />
            {locale === "th"
              ? "ศูนย์บริการเอกสารและทำเนียบคำสั่ง-ประกาศ คณะพุทธศาสตร์"
              : "Faculty Document & Orders Center"}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            {locale === "th"
              ? "ทำเนียบคำสั่ง ประกาศ และแบบฟอร์ม"
              : "Orders, Announcements & Forms"}
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-3xl">
            {locale === "th"
              ? "รวบรวมคำสั่งมหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย คำสั่งคณะพุทธศาสตร์ ประกาศ ระเบียบ และแบบฟอร์มสำหรับอาจารย์ เจ้าหน้าที่ และนิสิต"
              : "Official repository of university & faculty orders, announcements, regulations, and official request forms."}
          </p>

          {!isInternalUser && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">
              <Lock className="h-3.5 w-3.5 text-amber-600" />
              <span>
                {locale === "th"
                  ? "เข้าสู่ระบบเพื่อเข้าถึงเอกสารและคำสั่งเฉพาะสำหรับบุคลากรภายใน"
                  : "Log in to access internal staff documents"}
              </span>
            </div>
          )}
        </div>

        {/* View Mode Toggle Tabs & Staff Manage Shortcut */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/administration"
            className="inline-flex items-center gap-1.5 rounded-2xl border border-indigo-200 bg-indigo-50/90 px-3.5 py-2.5 text-xs font-bold text-indigo-700 shadow-xs transition hover:bg-indigo-100"
            title="เข้าสู่หน้าจัดการทำเนียบคำสั่ง ประกาศ และแบบฟอร์มสำหรับเจ้าหน้าที่ (/administration)"
          >
            <Settings className="h-4 w-4 text-indigo-600" />
            <span>จัดการเอกสาร (Manage Documents ⚙️)</span>
          </Link>

          <div className="flex rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode("directory")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                viewMode === "directory"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ScrollText className="h-4 w-4" />
              <span>{locale === "th" ? "ทำเนียบคำสั่ง & ประกาศ" : "Orders & Announcements"}</span>
              <span
                className={`rounded-full px-2 py-0.2 text-[10px] font-semibold ${
                  viewMode === "directory"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {orderAnnouncementCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("forms")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                viewMode === "forms"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FolderOpen className="h-4 w-4" />
              <span>{locale === "th" ? "แบบฟอร์ม & คู่มือ" : "Forms & Manuals"}</span>
              <span
                className={`rounded-full px-2 py-0.2 text-[10px] font-semibold ${
                  viewMode === "forms"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {formManualCount}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODE 1: ORDERS & ANNOUNCEMENTS DIRECTORY (ทำเนียบคำสั่งและประกาศ) */}
      {/* ============================================================== */}
      {viewMode === "directory" && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={
                    locale === "th"
                      ? "ค้นหาเลขที่คำสั่ง/ประกาศ, ชื่อคำสั่ง, หรือเนื้อหา..."
                      : "Search order number, title, or keywords..."
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-800 transition focus:border-indigo-500 focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* Organization Level Filter */}
              <div className="w-full sm:w-56">
                <select
                  value={selectedIssuer}
                  onChange={(e) => setSelectedIssuer(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-xs focus:border-indigo-500 focus:outline-hidden"
                >
                  <option value="ALL">🏛️ {locale === "th" ? "ทุกระดับหน่วยงาน" : "All Issuers"}</option>
                  <option value="FACULTY">🛕 {locale === "th" ? "ระดับคณะพุทธศาสตร์" : "Faculty Level"}</option>
                  <option value="UNIVERSITY">🏛️ {locale === "th" ? "ระดับมหาวิทยาลัย (มจร.)" : "University Level"}</option>
                </select>
              </div>

              {/* Document Type Filter */}
              <div className="w-full sm:w-48">
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-xs focus:border-indigo-500 focus:outline-hidden"
                >
                  <option value="ALL">{locale === "th" ? "ทุกประเภทเอกสาร" : "All Types"}</option>
                  <option value="ORDER">📋 {locale === "th" ? "คำสั่ง" : "Orders"}</option>
                  <option value="ANNOUNCEMENT">📢 {locale === "th" ? "ประกาศ" : "Announcements"}</option>
                  <option value="REGULATION">⚖️ {locale === "th" ? "ระเบียบ/ข้อบังคับ" : "Regulations"}</option>
                  <option value="GENERAL">📄 {locale === "th" ? "เอกสารทั่วไป" : "General"}</option>
                </select>
              </div>
            </div>

            {/* Year Selector Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
              <span className="flex items-center gap-1 text-xs font-bold text-slate-600">
                <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                {locale === "th" ? "ประจำปี พ.ศ.:" : "Year:"}
              </span>
              <button
                type="button"
                onClick={() => setSelectedYear("ALL")}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                  selectedYear === "ALL"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {locale === "th" ? "ทุกปี พ.ศ." : "All Years"}
              </button>
              {availableYears.map((yr) => {
                const isActive = selectedYear === yr;
                return (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setSelectedYear(yr)}
                    className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    พ.ศ. {yr}
                  </button>
                );
              })}

              {(search || selectedYear !== "ALL" || selectedIssuer !== "ALL" || selectedDocType !== "ALL") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSelectedYear("ALL");
                    setSelectedIssuer("ALL");
                    setSelectedDocType("ALL");
                  }}
                  className="ml-auto text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  {locale === "th" ? "ล้างตัวกรอง" : "Reset Filter"}
                </button>
              )}
            </div>
          </div>

          {/* Directory Count Info */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div>
              {locale === "th"
                ? `พบทั้งหมด ${filteredDirectoryItems.length} รายการ ${
                    selectedYear !== "ALL" ? `(ประจำปี พ.ศ. ${selectedYear})` : ""
                  }`
                : `Showing ${filteredDirectoryItems.length} items ${
                    selectedYear !== "ALL" ? `(Year ${selectedYear})` : ""
                  }`}
            </div>
          </div>

          {/* Orders & Announcements List */}
          <div className="space-y-3">
            {filteredDirectoryItems.map((doc) => (
              <div
                key={doc.id}
                className="group flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-indigo-400 hover:shadow-md sm:flex-row sm:items-center"
              >
                <div className="space-y-2 flex-1">
                  {/* Badges row */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Document Number badge */}
                    {doc.docNumber ? (
                      <span className="inline-flex items-center rounded-md bg-slate-900 px-2.5 py-0.5 text-xs font-bold text-white">
                        เลขที่ {doc.docNumber}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {locale === "th" ? "ไม่มีเลขที่" : "No Doc No."}
                      </span>
                    )}

                    {/* Year badge */}
                    {doc.year && (
                      <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-600/20">
                        พ.ศ. {doc.year}
                      </span>
                    )}

                    {/* Document Type Badge */}
                    {getDocTypeBadge(doc.docType)}

                    {/* Issuer Level Badge */}
                    {getIssuerBadge(doc.issuerLevel)}

                    {/* File type badge */}
                    {getFileBadge(doc.fileUrl)}

                    {/* Internal access badge */}
                    {doc.visibility === "INTERNAL" && (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                        <Lock className="h-3 w-3" /> ภายใน
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-slate-900 transition group-hover:text-indigo-600">
                    {doc.title}
                  </h3>

                  {/* Description */}
                  {doc.description && (
                    <p className="text-xs text-slate-600 line-clamp-2">{doc.description}</p>
                  )}

                  <div className="text-[11px] text-slate-400">
                    วันที่เผยแพร่: {formatDate(doc.createdAt, locale === "en" ? "en" : "th")}
                  </div>
                </div>

                {/* Download Button */}
                <div className="shrink-0">
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700"
                  >
                    <Download className="h-4 w-4" />
                    <span>{locale === "th" ? "ดาวน์โหลดเอกสาร" : "Download"}</span>
                    <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                  </a>
                </div>
              </div>
            ))}

            {filteredDirectoryItems.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center">
                <ScrollText className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="mt-3 text-sm font-bold text-slate-900">
                  {locale === "th" ? "ไม่พบคำสั่งหรือประกาศตามเงื่อนไขที่เลือก" : "No orders or announcements found"}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {locale === "th"
                    ? "ลองเลือกปี พ.ศ. อื่น หรือเปลี่ยนคำค้นหา"
                    : "Try adjusting the year or search keywords."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODE 2: FORMS & MANUALS VIEW (แบบฟอร์มคำขอและคู่มือปฏิบัติงาน)    */}
      {/* ============================================================== */}
      {viewMode === "forms" && (
        <div className="space-y-8">
          {/* Search and Category Filter Bar */}
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  locale === "th"
                    ? "ค้นหาชื่อแบบฟอร์ม คำร้อง คู่มือ หรือคำสำคัญ..."
                    : "Search form title, manuals, or keywords..."
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-800 transition focus:border-indigo-500 focus:bg-white focus:outline-hidden"
              />
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Document Sections */}
          <div className="space-y-10">
            {Object.entries(groupedForms).map(([cat, docs]) => (
              <section key={cat} className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h2 className="text-lg font-bold text-slate-900">{getCategoryName(cat)}</h2>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    {docs.length} รายการ
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {docs.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-indigo-500 hover:shadow-md"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="flex items-center gap-1.5">
                            {getFileBadge(doc.fileUrl)}
                            {doc.visibility === "INTERNAL" && (
                              <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                                <Lock className="h-3 w-3" /> ภายใน
                              </span>
                            )}
                          </div>
                        </div>

                        {doc.docNumber && (
                          <div className="mt-2 text-[11px] font-semibold text-slate-500">
                            เลขที่ {doc.docNumber} {doc.year ? `(พ.ศ. ${doc.year})` : ""}
                          </div>
                        )}

                        <h3 className="mt-2 font-bold text-slate-900 line-clamp-2 transition group-hover:text-indigo-600">
                          {doc.title}
                        </h3>

                        {doc.description && (
                          <p className="mt-1.5 text-xs text-slate-500 line-clamp-2">
                            {doc.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-semibold text-indigo-600">
                        <span className="inline-flex items-center gap-1.5">
                          <Download className="h-4 w-4" />
                          {locale === "th" ? "เปิด / ดาวน์โหลดเอกสาร" : "Download Document"}
                        </span>
                        <ExternalLink className="h-3.5 w-3.5 opacity-60 transition group-hover:opacity-100" />
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            ))}

            {filteredFormsItems.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center">
                <Layers className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="mt-3 text-sm font-bold text-slate-900">
                  {locale === "th" ? "ไม่พบเอกสารที่ค้นหา" : "No documents found"}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {locale === "th"
                    ? "ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่น"
                    : "Try adjusting your search terms or filter."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
