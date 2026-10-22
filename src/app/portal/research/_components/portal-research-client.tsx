"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  ExternalLink,
  GraduationCap,
  Sparkles,
  FileText,
  Award,
  Layers,
  Calendar,
  User,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResearchPubItem {
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
  personnel?: {
    id: string;
    firstNameTh: string;
    lastNameTh: string;
    positionTh: string;
    academicPosition?: string | null;
    imageUrl?: string | null;
  } | null;
}

interface Props {
  publications: ResearchPubItem[];
  locale: string;
}

export function PortalResearchClient({ publications, locale }: Props) {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedAuthor, setSelectedAuthor] = useState<string>("ALL");

  // Unique authors
  const authors = Array.from(
    new Set(
      publications
        .map((p) =>
          p.personnel ? `${p.personnel.firstNameTh} ${p.personnel.lastNameTh}` : null
        )
        .filter(Boolean) as string[]
    )
  );

  // Filter
  const filtered = publications.filter((pub) => {
    const q = search.toLowerCase().trim();
    const titleTh = pub.titleTh.toLowerCase();
    const titleEn = (pub.titleEn || "").toLowerCase();
    const authorsStr = pub.authors.toLowerCase();
    const journal = pub.journalName.toLowerCase();
    const year = (pub.publicationYear || "").toLowerCase();

    const matchesSearch =
      !q ||
      titleTh.includes(q) ||
      titleEn.includes(q) ||
      authorsStr.includes(q) ||
      journal.includes(q) ||
      year.includes(q);

    const matchesType = selectedType === "ALL" || pub.type === selectedType;

    const authorName = pub.personnel
      ? `${pub.personnel.firstNameTh} ${pub.personnel.lastNameTh}`
      : "";
    const matchesAuthor = selectedAuthor === "ALL" || authorName === selectedAuthor;

    return matchesSearch && matchesType && matchesAuthor;
  });

  // Stats
  const totalCount = publications.length;
  const researchCount = publications.filter((p) => p.type === "RESEARCH").length;
  const academicCount = publications.filter((p) => p.type === "ACADEMIC").length;
  const dissertationCount = publications.filter((p) => p.type === "DISSERTATION").length;
  const tci1Count = publications.filter((p) => (p.tier || "").includes("๑") || (p.tier || "").includes("1")).length;
  const tci2Count = publications.filter((p) => (p.tier || "").includes("๒") || (p.tier || "").includes("2")).length;

  return (
    <div className="space-y-8">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-card border shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>ผลงานทั้งหมด</span>
            <BookOpen className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground">{totalCount}</div>
          <p className="text-[11px] text-muted-foreground">ผลงานวิจัย & บทความวิชาการ</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>บทความวิจัย</span>
            <Sparkles className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground">{researchCount}</div>
          <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">Research Articles</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>บทความวิชาการ</span>
            <FileText className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground">{academicCount}</div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Academic Articles</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>วารสาร TCI</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
            {tci1Count + tci2Count}
          </div>
          <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
            TCI กลุ่ม 1 ({tci1Count}) • กลุ่ม 2 ({tci2Count})
          </p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-2xl bg-card border shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อผลงานวิจัย, คณะผู้วิจัย, ชื่อวารสาร, ปี พ.ศ..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Author filter dropdown if multiple authors */}
          {authors.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">อาจารย์:</span>
              <select
                value={selectedAuthor}
                onChange={(e) => setSelectedAuthor(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">คณาจารย์ทุกคน ({authors.length} ท่าน)</option>
                {authors.map((author) => (
                  <option key={author} value={author}>
                    {author}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Type Filter Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin pt-1 border-t border-border/50">
          <button
            type="button"
            onClick={() => setSelectedType("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedType === "ALL"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            ทุกประเภท ({publications.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedType("RESEARCH")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedType === "RESEARCH"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            บทความวิจัย ({researchCount})
          </button>
          <button
            type="button"
            onClick={() => setSelectedType("ACADEMIC")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedType === "ACADEMIC"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            บทความวิชาการ ({academicCount})
          </button>
          {dissertationCount > 0 && (
            <button
              type="button"
              onClick={() => setSelectedType("DISSERTATION")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedType === "DISSERTATION"
                  ? "bg-purple-600 text-white shadow-xs"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              ดุษฎีนิพนธ์ ({dissertationCount})
            </button>
          )}
        </div>
      </div>

      {/* Publications List */}
      <div className="space-y-4">
        {filtered.map((pub, idx) => (
          <div
            key={pub.id}
            className="p-5 sm:p-6 rounded-2xl border bg-card hover:shadow-lg hover:border-primary/40 transition-all duration-200 space-y-3"
          >
            {/* Header badges */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                  {idx + 1}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                    pub.type === "RESEARCH"
                      ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20"
                      : pub.type === "DISSERTATION"
                      ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20"
                      : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                  }`}
                >
                  {pub.type === "RESEARCH"
                    ? "บทความวิจัย"
                    : pub.type === "DISSERTATION"
                    ? "ดุษฎีนิพนธ์"
                    : "บทความวิชาการ"}
                </span>

                {pub.tier && (
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                    ⭐ {pub.tier}
                  </span>
                )}

                {pub.publicationYear && (
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-muted text-muted-foreground">
                    พ.ศ. {pub.publicationYear}
                  </span>
                )}
              </div>

              {/* Author Chip Link */}
              {pub.personnel && (
                <Link
                  href={`/portal/personnel`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/60 hover:bg-muted text-xs font-semibold text-foreground transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-primary" />
                  <span>
                    {pub.personnel.firstNameTh} {pub.personnel.lastNameTh}
                  </span>
                </Link>
              )}
            </div>

            {/* Title */}
            <div>
              <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug">
                {pub.titleTh}
              </h3>
              {pub.titleEn && (
                <p className="text-xs sm:text-sm text-muted-foreground font-medium italic mt-0.5">
                  {pub.titleEn}
                </p>
              )}
            </div>

            {/* Authors */}
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">คณะผู้วิจัย/ผู้แต่ง: </strong>
              {pub.authors}
            </p>

            {/* Journal Metadata Strip */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 p-3 rounded-xl bg-muted/30 border border-border/50 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="font-semibold text-foreground">{pub.journalName}</span>
              </div>
              {pub.volume && <span>{pub.volume}</span>}
              {pub.issue && <span>{pub.issue}</span>}
              {pub.pages && <span>หน้า {pub.pages}</span>}
              {pub.issn && <span>ISSN: {pub.issn}</span>}
            </div>

            {/* Action Bar */}
            {pub.url && (
              <div className="pt-2 flex items-center justify-between">
                <a
                  href={pub.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs transition-all shadow-xs cursor-pointer"
                >
                  <span>เปิดอ่านบทความฉบับเต็มบนฐานข้อมูล ThaiJO</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                {pub.tier && (
                  <span className="text-[11px] text-muted-foreground hidden sm:inline-block">
                    รับรองมาตรฐานโดยศูนย์ดัชนีการอ้างอิงวารสารไทย ({pub.tier})
                  </span>
                )}
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16 border rounded-2xl bg-card">
            <BookOpen className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-foreground">ไม่พบผลงานวิจัยตามเงื่อนไขที่ค้นหา</h3>
            <p className="text-xs text-muted-foreground mt-1">กรุณาลองเปลี่ยนคำค้นหา หรือเลือกตัวกรองประเภทอื่น</p>
          </div>
        )}
      </div>
    </div>
  );
}
