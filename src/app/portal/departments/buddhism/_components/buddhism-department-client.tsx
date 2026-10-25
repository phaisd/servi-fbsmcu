"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  GraduationCap,
  Users,
  Calendar,
  Mail,
  Phone,
  Briefcase,
  ExternalLink,
  Search,
  Sparkles,
  Award,
  Building2,
  FileText,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import {
  LiyonDialog,
  LiyonDialogHeader,
  LiyonDialogBody,
  LiyonDialogFooter,
  LiyonDialogCloseButton,
} from "@/shared/components/liyon";
import { Button } from "@/components/ui/button";
import type { Curriculum, Department } from "@/generated/prisma";
import type { PersonnelItem, ResearchPub } from "@/app/portal/personnel/_components/portal-personnel-client";
import {
  normalizePublicationYear,
  formatPublicationYearLabel,
} from "@/app/portal/personnel/_components/portal-personnel-client";

interface Props {
  teachers: PersonnelItem[];
  curriculums: Array<Curriculum & { department?: Department | null }>;
  locale?: string;
}

export function BuddhismDepartmentClient({
  teachers,
  curriculums,
  locale = "th",
}: Props) {
  const [activeTab, setActiveTab] = useState<"teachers" | "research" | "programs" | "about">("teachers");

  // Selected Teacher Modal State
  const [selectedPerson, setSelectedPerson] = useState<PersonnelItem | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<"research" | "education" | "experience" | "contact">("research");
  const [modalYearFilter, setModalYearFilter] = useState<string>("ALL");
  const [modalPubSearch, setModalPubSearch] = useState("");

  // Search & Filters in Department Research
  const [teacherSearch, setTeacherSearch] = useState("");
  const [researchSearch, setResearchSearch] = useState("");
  const [selectedResearchYear, setSelectedResearchYear] = useState<string>("ALL");

  // All research publications by Buddhism Department Teachers
  const departmentPublications = useMemo(() => {
    const list: Array<ResearchPub & { personnel: PersonnelItem; normalizedYear: string }> = [];
    teachers.forEach((person) => {
      person.researchPublications?.forEach((pub: ResearchPub) => {
        list.push({
          ...pub,
          personnel: person,
          normalizedYear: normalizePublicationYear(pub.publicationYear),
        });
      });
    });
    return list;
  }, [teachers]);

  // Unique publication years in Buddhism Department
  const departmentYears = useMemo(() => {
    const set = new Set<string>();
    departmentPublications.forEach((p) => {
      set.add(p.normalizedYear);
    });
    return Array.from(set).sort((a, b) => {
      if (a === "ไม่ระบุปี") return 1;
      if (b === "ไม่ระบุปี") return -1;
      return b.localeCompare(a);
    });
  }, [departmentPublications]);

  // Filtered teachers (Sorted strictly by orderIndex)
  const filteredTeachers = useMemo(() => {
    const q = teacherSearch.toLowerCase().trim();
    const list = !q
      ? teachers
      : teachers.filter((t) => {
          const nameTh = `${t.firstNameTh} ${t.lastNameTh}`.toLowerCase();
          const nameEn = `${t.firstNameEn || ""} ${t.lastNameEn || ""}`.toLowerCase();
          const pos = (t.positionTh || "").toLowerCase();
          return nameTh.includes(q) || nameEn.includes(q) || pos.includes(q);
        });

    return [...list].sort((a, b) => {
      const orderDiff = (a.orderIndex ?? 0) - (b.orderIndex ?? 0);
      if (orderDiff !== 0) return orderDiff;
      return a.firstNameTh.localeCompare(b.firstNameTh, "th");
    });
  }, [teachers, teacherSearch]);

  // Filtered department research
  const filteredResearch = useMemo(() => {
    return departmentPublications.filter((pub) => {
      const q = researchSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        pub.titleTh.toLowerCase().includes(q) ||
        (pub.titleEn && pub.titleEn.toLowerCase().includes(q)) ||
        pub.authors.toLowerCase().includes(q) ||
        pub.journalName.toLowerCase().includes(q);

      const matchesYear = selectedResearchYear === "ALL" || pub.normalizedYear === selectedResearchYear;
      return matchesSearch && matchesYear;
    });
  }, [departmentPublications, researchSearch, selectedResearchYear]);

  // Grouped research by year
  const groupedResearchByYear = useMemo(() => {
    const map = new Map<string, typeof filteredResearch>();
    filteredResearch.forEach((pub) => {
      const y = pub.normalizedYear;
      if (!map.has(y)) map.set(y, []);
      map.get(y)!.push(pub);
    });

    const sortedKeys = Array.from(map.keys()).sort((a, b) => {
      if (a === "ไม่ระบุปี") return 1;
      if (b === "ไม่ระบุปี") return -1;
      return b.localeCompare(a);
    });

    return sortedKeys.map((key) => ({
      year: key,
      label: formatPublicationYearLabel(key, locale),
      publications: map.get(key)!,
    }));
  }, [filteredResearch, locale]);

  // Modal teacher helper
  const selectedPersonYears = useMemo(() => {
    if (!selectedPerson?.researchPublications) return [];
    const set = new Set<string>();
    selectedPerson.researchPublications.forEach((p: ResearchPub) => {
      set.add(normalizePublicationYear(p.publicationYear));
    });
    return Array.from(set).sort((a, b) => {
      if (a === "ไม่ระบุปี") return 1;
      if (b === "ไม่ระบุปี") return -1;
      return b.localeCompare(a);
    });
  }, [selectedPerson]);

  const selectedPersonGroupedByYear = useMemo(() => {
    if (!selectedPerson?.researchPublications) return [];
    const q = modalPubSearch.toLowerCase().trim();

    const filtered = selectedPerson.researchPublications.filter((pub: ResearchPub) => {
      const normY = normalizePublicationYear(pub.publicationYear);
      const matchesYear = modalYearFilter === "ALL" || normY === modalYearFilter;
      const matchesSearch =
        !q ||
        pub.titleTh.toLowerCase().includes(q) ||
        (pub.titleEn && pub.titleEn.toLowerCase().includes(q)) ||
        pub.journalName.toLowerCase().includes(q);
      return matchesYear && matchesSearch;
    });

    const map = new Map<string, ResearchPub[]>();
    filtered.forEach((pub: ResearchPub) => {
      const y = normalizePublicationYear(pub.publicationYear);
      if (!map.has(y)) map.set(y, []);
      map.get(y)!.push(pub);
    });

    const sortedKeys = Array.from(map.keys()).sort((a, b) => {
      if (a === "ไม่ระบุปี") return 1;
      if (b === "ไม่ระบุปี") return -1;
      return b.localeCompare(a);
    });

    return sortedKeys.map((k) => ({
      year: k,
      label: formatPublicationYearLabel(k, locale),
      publications: map.get(k)!,
    }));
  }, [selectedPerson, modalYearFilter, modalPubSearch, locale]);

  const openTeacherModal = (person: PersonnelItem, tab: "research" | "education" = "research", targetYear: string = "ALL") => {
    setSelectedPerson(person);
    setModalYearFilter(targetYear);
    setModalPubSearch("");
    if (tab === "research" && (!person.researchPublications || person.researchPublications.length === 0)) {
      setActiveModalTab("education");
    } else {
      setActiveModalTab(tab);
    }
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* ── 1. Department Hero Banner ── */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-card to-background p-6 sm:p-10 shadow-lg">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                ภาควิชาสังกัดคณะพุทธศาสตร์ มจร
              </span>
              <a
                href="https://fb.mcu.ac.th/?page_id=9032"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground text-[11px] font-medium transition-colors"
              >
                <span>อ้างอิงข้อมูล: fb.mcu.ac.th/?page_id=9032</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              ภาควิชาพระพุทธศาสนา
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground font-medium">
              Department of Buddhist Studies • Faculty of Buddhism, Mahachulalongkornrajavidyalaya University
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
              ศูนย์กลางแห่งการเรียนรู้และการวิจัยพระไตรปิฎกศึกษา พระพุทธศาสนาเถรวาท ปรัชญา และศาสนาเปรียบเทียบ ผลิตบัณฑิตผู้เปี่ยมด้วยปัญญาและคุณธรรม พร้อมเผยแผ่พระธรรมสู่สังคมไทยและประชาคมโลก
            </p>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="p-4 rounded-2xl bg-card/80 backdrop-blur-md border border-border shadow-xs space-y-0.5 text-center">
              <div className="flex items-center justify-center gap-1 text-primary text-xs font-semibold">
                <Users className="w-4 h-4" />
                <span>อาจารย์ประจำ</span>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground">{teachers.length}</p>
              <p className="text-[10px] text-muted-foreground">รูป/ท่าน</p>
            </div>

            <div className="p-4 rounded-2xl bg-card/80 backdrop-blur-md border border-border shadow-xs space-y-0.5 text-center">
              <div className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                <BookOpen className="w-4 h-4" />
                <span>ผลงานวิจัย</span>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground">{departmentPublications.length}</p>
              <p className="text-[10px] text-muted-foreground">เรื่องในระบบ</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Navigation Tabs Bar ── */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-muted/60 border border-border overflow-x-auto scrollbar-thin">
        <button
          type="button"
          onClick={() => setActiveTab("teachers")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "teachers"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>คณาจารย์ประจำภาควิชา</span>
          <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-xs">
            {teachers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("research")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "research"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen className="w-4 h-4 text-amber-300" />
          <span>ผลงานวิจัย & วิชาการแยกตามปี</span>
          <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-xs">
            {departmentPublications.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("programs")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "programs"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>หลักสูตรที่เปิดสอน</span>
          <span className="px-1.5 py-0.2 rounded-full bg-primary/10 text-primary text-xs">
            {curriculums.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("about")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "about"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>เกี่ยวกับภาควิชา & การติดต่อ</span>
        </button>
      </div>

      {/* ── 3. Tab 1: คณาจารย์ประจำภาควิชาพระพุทธศาสนา ── */}
      {activeTab === "teachers" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span>ทำเนียบคณาจารย์ประจำภาควิชาพระพุทธศาสนา</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                รายนามคณาจารย์ผู้ทรงคุณวุฒิ จากเว็บไซต์ทางการ fb.mcu.ac.th/?page_id=9032
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                placeholder="ค้นหาชื่ออาจารย์..."
                className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Teachers Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeachers.map((person) => {
              const pubCount = person.researchPublications?.length ?? 0;
              return (
                <div
                  key={person.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-card hover:shadow-xl hover:border-amber-500/50 transition-all duration-300"
                >
                  <div>
                    {/* Teacher Photo */}
                    <Link
                      href={`/portal/personnel/${person.id}`}
                      className="block relative aspect-[4/3] w-full bg-gradient-to-br from-amber-500/10 via-muted to-muted/40 overflow-hidden cursor-pointer"
                    >
                      {person.imageUrl ? (
                        <Image
                          src={person.imageUrl}
                          alt={`${person.firstNameTh} ${person.lastNameTh}`}
                          fill
                          unoptimized
                          className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/40 gap-2">
                          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <GraduationCap className="h-10 w-10" />
                          </div>
                          <span className="text-xs font-medium text-muted-foreground/70">อาจารย์ประจำภาควิชา</span>
                        </div>
                      )}

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-background/90 backdrop-blur-md text-foreground text-[11px] font-semibold shadow-xs">
                          <Briefcase className="h-3 w-3 text-primary" />
                          {person.type === "EXECUTIVE" ? "ผู้บริหาร" : person.type === "ACADEMIC" ? "อาจารย์ประจำ" : "สายสนับสนุน"}
                        </span>

                        {pubCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500 text-white text-[11px] font-bold shadow-xs">
                            <BookOpen className="h-3 w-3" />
                            <span>{pubCount} ผลงานวิจัย</span>
                          </span>
                        )}
                      </div>
                    </Link>

                    {/* Content */}
                    <div className="p-5 space-y-3">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          {person.academicPosition && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300">
                              {person.academicPosition}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                            ภาควิชาพระพุทธศาสนา
                          </span>
                        </div>

                        <Link href={`/portal/personnel/${person.id}`}>
                          <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors cursor-pointer">
                            {person.academicPosition ? `${person.academicPosition} ` : ""}
                            {person.firstNameTh} {person.lastNameTh}
                          </h3>
                        </Link>
                        {person.firstNameEn && (
                          <p className="text-xs text-muted-foreground font-medium">
                            {person.firstNameEn} {person.lastNameEn}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                          {person.positionTh}
                        </p>
                      </div>

                      {/* Contact Info */}
                      {person.email && (
                        <div className="pt-2 border-t border-border/60 space-y-1.5 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2 truncate">
                            <Mail className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                            <a href={`mailto:${person.email}`} className="hover:text-primary transition-colors truncate font-medium">
                              {person.email}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-5 pt-0">
                    <Button
                      asChild
                      variant="default"
                      className="w-full gap-2 text-xs font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer"
                    >
                      <Link href={`/portal/personnel/${person.id}`}>
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>ดูประวัติ & รายวิชาที่สอน (หน้าเต็ม)</span>
                        {pubCount > 0 && <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">{pubCount}</span>}
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 4. Tab 2: ผลงานวิจัยและวิชาการแยกตามปี พ.ศ. ── */}
      {activeTab === "research" && (
        <div className="space-y-8 animate-in fade-in-50 duration-300">
          {/* Year Filter Buttons */}
          <div className="p-4 rounded-2xl bg-card border shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-foreground">เลือกดูผลงานวิจัยของภาควิชาพระพุทธศาสนา ตามปี พ.ศ.</h3>
              </div>
              <span className="text-xs text-muted-foreground">
                แสดงผลงาน {filteredResearch.length} จากทั้งหมด {departmentPublications.length} เรื่อง
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              <button
                type="button"
                onClick={() => setSelectedResearchYear("ALL")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedResearchYear === "ALL"
                    ? "bg-primary text-primary-foreground shadow-md scale-102"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                <span>ทุกปีการศึกษา</span>
                <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                  {departmentPublications.length}
                </span>
              </button>

              {departmentYears.map((yearKey) => {
                const count = departmentPublications.filter((p) => p.normalizedYear === yearKey).length;
                const label = formatPublicationYearLabel(yearKey, locale);
                const isSelected = selectedResearchYear === yearKey;
                return (
                  <button
                    key={yearKey}
                    type="button"
                    onClick={() => setSelectedResearchYear(yearKey)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-md scale-102"
                        : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    }`}
                  >
                    <span>{label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        isSelected ? "bg-white/20 text-white" : "bg-background text-muted-foreground"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Research Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={researchSearch}
              onChange={(e) => setResearchSearch(e.target.value)}
              placeholder="ค้นหาชื่อเรื่องวิจัย, ผู้วิจัย, หรือชื่อวารสาร..."
              className="w-full pl-8 pr-4 py-2 text-xs rounded-xl border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Grouped Research List */}
          <div className="space-y-8">
            {groupedResearchByYear.map(({ year, label, publications }) => (
              <section key={year} className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-primary/10 to-transparent border border-amber-500/20">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <h3 className="text-sm sm:text-base font-bold text-foreground">
                      ผลงานตีพิมพ์ประจำ {label} ({publications.length} เรื่อง)
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {publications.map((pub, idx) => (
                    <div
                      key={pub.id}
                      className="group flex flex-col justify-between p-4 rounded-xl border bg-card hover:shadow-md hover:border-amber-500/40 transition-all space-y-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[10px]">
                              {idx + 1}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded font-bold ${
                                pub.type === "RESEARCH"
                                  ? "bg-blue-500/10 text-blue-700 dark:text-blue-300"
                                  : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                              }`}
                            >
                              {pub.type === "RESEARCH" ? "งานวิจัย" : "บทความวิชาการ"}
                            </span>
                            {pub.tier && (
                              <span className="px-2 py-0.5 rounded font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                ⭐ {pub.tier}
                              </span>
                            )}
                          </div>
                          <span className="font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            {label}
                          </span>
                        </div>

                        <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors leading-snug">
                          {pub.titleTh}
                        </h4>
                        {pub.titleEn && (
                          <p className="text-xs text-muted-foreground italic font-medium">{pub.titleEn}</p>
                        )}

                        {/* Author Card */}
                        <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-muted/40 border border-border/40">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="relative w-7 h-7 rounded-full overflow-hidden bg-primary/10 shrink-0">
                              {pub.personnel.imageUrl ? (
                                <Image
                                  src={pub.personnel.imageUrl}
                                  alt={pub.personnel.firstNameTh}
                                  fill
                                  unoptimized
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-primary text-xs font-bold">
                                  {pub.personnel.firstNameTh.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-foreground truncate">
                                {pub.personnel.academicPosition ? `${pub.personnel.academicPosition} ` : ""}
                                {pub.personnel.firstNameTh} {pub.personnel.lastNameTh}
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate">อาจารย์ประจำภาควิชาพระพุทธศาสนา</p>
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-[11px] h-6 px-2 shrink-0 cursor-pointer"
                            onClick={() => openTeacherModal(pub.personnel, "research", pub.normalizedYear)}
                          >
                            ดูประวัติ
                          </Button>
                        </div>

                        {/* Journal Info */}
                        <div className="text-xs text-muted-foreground bg-muted/20 p-2 rounded-lg space-y-0.5">
                          <p>
                            <strong className="text-foreground">วารสาร: </strong>
                            <span>{pub.journalName}</span>
                          </p>
                          <div className="flex flex-wrap gap-x-2 text-[11px]">
                            {pub.volume && <span>{pub.volume}</span>}
                            {pub.issue && <span>{pub.issue}</span>}
                            {pub.pages && <span>หน้า {pub.pages}</span>}
                            {pub.issn && <span>ISSN: {pub.issn}</span>}
                          </div>
                        </div>
                      </div>

                      {pub.url && (
                        <div className="pt-2 border-t border-border/50">
                          <a
                            href={pub.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs transition-colors"
                          >
                            <span>เปิดอ่านบทความวิจัยบน ThaiJO</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {groupedResearchByYear.length === 0 && (
              <div className="text-center py-12 border rounded-2xl bg-card">
                <BookOpen className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm font-semibold text-foreground">ไม่พบผลงานวิจัยตามเงื่อนไขที่เลือก</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 5. Tab 3: หลักสูตรที่เปิดสอนในภาควิชาพระพุทธศาสนา ── */}
      {activeTab === "programs" && (
        <div className="space-y-6">
          <div className="border-b pb-3">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              <span>หลักสูตรที่เปิดสอนในภาควิชาพระพุทธศาสนา</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              หลักสูตรระดับปริญญาตรีและบัณฑิตศึกษา ทั้งหลักสูตรภาษาไทยและหลักสูตรนานาชาติ
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {curriculums.map((c) => (
              <div
                key={c.id}
                className="p-6 rounded-2xl border bg-card hover:shadow-lg hover:border-amber-500/40 transition-all space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                      {c.degree === "BACHELOR" ? "ปริญญาตรี" : c.degree === "MASTER" ? "ปริญญาโท" : "ปริญญาเอก"}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-muted text-muted-foreground">
                      ภาควิชาพระพุทธศาสนา
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground leading-snug">{c.nameTh}</h3>
                  {c.nameEn && <p className="text-xs text-muted-foreground italic font-medium">{c.nameEn}</p>}
                </div>

                {c.descriptionTh && (
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {c.descriptionTh}
                  </p>
                )}

                <div className="pt-3 border-t flex items-center justify-between gap-3 text-xs">
                  <span className="text-muted-foreground">ระยะเวลาการศึกษา: 4 ปี (120-140 หน่วยกิต)</span>
                  <Link
                    href="/portal/timetables"
                    className="inline-flex items-center gap-1 text-primary font-semibold hover:underline"
                  >
                    <span>ดูตารางเรียน</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 6. Tab 4: เกี่ยวกับภาควิชาและการติดต่อ ── */}
      {activeTab === "about" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl border bg-card space-y-4">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                <span>ประวัติความเป็นมาและวิสัยทัศน์ภาควิชา</span>
              </h2>
              <div className="space-y-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                <p>
                  <strong>ภาควิชาพระพุทธศาสนา คณะพุทธศาสตร์</strong> มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย เป็นภาควิชาหลักที่มุ่งเน้นการจัดการเรียนการสอนและการวิจัยทางด้านพระไตรปิฎกศึกษา พระพุทธศาสนาเถรวาท ปรัชญาพุทธศาสน์ และศาสตร์บูรณาการร่วมสมัย
                </p>
                <p>
                  โดยมีพันธกิจสำคัญในการผลิตบัณฑิตทั้งบรรพชิตและคฤหัสถ์ ให้มีความรู้ความเข้าใจในหลักพุทธธรรมอย่างแตกฉาน สามารถนำหลักธรรมไปประยุกต์ใช้เพื่อแก้ไขปัญหาสังคม พัฒนาจิตวิญญาณ และสร้างสันติภาพในประชาคมโลก
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-muted/40 border space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ปรัชญาภาควิชา</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    จัดการศึกษาพระพุทธศาสนา บูรณาการกับศาสตร์สมัยใหม่ พัฒนาจิตใจและสังคม
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/40 border space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                    <Award className="w-4 h-4" />
                    <span>ปณิธาน</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    รอบรู้พระไตรปิฎก เชิดชูปัญญาวิชาการ สืบสานพระพุทธศาสนาสู่สากล
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-2xl border bg-card space-y-4">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                <span>ข้อมูลการติดต่อภาควิชา</span>
              </h3>
              <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                <div>
                  <strong className="text-foreground block mb-0.5">ที่ตั้งสำนักงาน:</strong>
                  <span>ห้องสำนักงานภาควิชาพระพุทธศาสนา อาคารเรียนรวม คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย อ.วังน้อย จ.พระนครศรีอยุธยา 13170</span>
                </div>
                <div>
                  <strong className="text-foreground block mb-0.5">เว็บไซต์ทางการ:</strong>
                  <a
                    href="https://fb.mcu.ac.th/?page_id=9032"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <span>fb.mcu.ac.th/?page_id=9032</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div>
                  <strong className="text-foreground block mb-0.5">เวลาทำการ:</strong>
                  <span>จันทร์ - ศุกร์: 08:30 - 16:30 น.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. Teacher Detail Modal ── */}
      <LiyonDialog open={!!selectedPerson} onOpenChange={(open) => !open && setSelectedPerson(null)}>
        <LiyonDialogCloseButton label="ปิด" />
        {selectedPerson && (
          <>
            <LiyonDialogHeader
              title={`${selectedPerson.academicPosition ? selectedPerson.academicPosition + " " : ""}${selectedPerson.firstNameTh} ${selectedPerson.lastNameTh}`}
              description="อาจารย์ประจำภาควิชาพระพุทธศาสนา คณะพุทธศาสตร์ มจร"
            />
            <LiyonDialogBody>
              <div className="space-y-5 py-1">
                {/* Profile Header */}
                <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-muted/40 border">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-primary/10 shrink-0">
                    {selectedPerson.imageUrl ? (
                      <Image
                        src={selectedPerson.imageUrl}
                        alt={selectedPerson.firstNameTh}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary">
                        <GraduationCap className="h-10 w-10" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-primary/10 text-primary">
                        อาจารย์ประจำภาควิชาพระพุทธศาสนา
                      </span>
                      {selectedPerson.academicPosition && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400">
                          {selectedPerson.academicPosition}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-foreground">
                      {selectedPerson.academicPosition ? `${selectedPerson.academicPosition} ` : ""}
                      {selectedPerson.firstNameTh} {selectedPerson.lastNameTh}
                    </h3>
                    <p className="text-xs text-muted-foreground">{selectedPerson.positionTh}</p>
                  </div>
                </div>

                {/* Sub-tabs */}
                <div className="flex items-center gap-2 border-b border-border text-xs overflow-x-auto scrollbar-thin">
                  <button
                    type="button"
                    onClick={() => setActiveModalTab("research")}
                    className={`pb-2.5 px-3 font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      activeModalTab === "research"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>ผลงานวิจัย & วิชาการ</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-primary/10 text-[10px]">
                      {selectedPerson.researchPublications?.length ?? 0}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveModalTab("education")}
                    className={`pb-2.5 px-3 font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      activeModalTab === "education"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>ประวัติการศึกษา</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveModalTab("contact")}
                    className={`pb-2.5 px-3 font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      activeModalTab === "contact"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>การติดต่อ</span>
                  </button>
                </div>

                {/* Modal Tab 1: Research Publications */}
                {activeModalTab === "research" && (
                  <div className="space-y-4">
                    {selectedPersonYears.length > 0 && (
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin text-xs p-2 rounded-lg bg-muted/30 border">
                        <span className="text-muted-foreground text-[11px] font-semibold flex items-center gap-1 shrink-0">
                          <Calendar className="w-3.5 h-3.5 text-primary" />
                          <span>เลือกปี:</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setModalYearFilter("ALL")}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                            modalYearFilter === "ALL"
                              ? "bg-primary text-primary-foreground"
                              : "bg-background text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          ทั้งหมด ({selectedPerson.researchPublications?.length ?? 0})
                        </button>
                        {selectedPersonYears.map((y) => (
                          <button
                            key={y}
                            type="button"
                            onClick={() => setModalYearFilter(y)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                              modalYearFilter === y
                                ? "bg-primary text-primary-foreground"
                                : "bg-background text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            {formatPublicationYearLabel(y, locale)}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
                      {selectedPersonGroupedByYear.length > 0 ? (
                        selectedPersonGroupedByYear.map(({ year, label, publications }) => (
                          <div key={year} className="space-y-2">
                            <div className="flex items-center gap-2 pt-1 sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-1">
                              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{label}</span>
                              </span>
                              <span className="text-[11px] text-muted-foreground">({publications.length} ผลงาน)</span>
                              <div className="flex-1 h-px bg-border/60" />
                            </div>

                            <div className="space-y-2">
                              {publications.map((pub, idx) => (
                                <div key={pub.id} className="p-3 rounded-xl border bg-card space-y-1.5 text-xs">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[10px]">
                                      {idx + 1}
                                    </span>
                                    <span className="font-bold text-foreground">{pub.titleTh}</span>
                                  </div>
                                  <p className="text-muted-foreground">ผู้แต่ง: {pub.authors}</p>
                                  <div className="text-muted-foreground/80 bg-muted/30 p-2 rounded-lg">
                                    วารสาร: {pub.journalName} {pub.volume && `(${pub.volume})`} {pub.pages && `หน้า ${pub.pages}`}
                                  </div>
                                  {pub.url && (
                                    <a
                                      href={pub.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 text-primary hover:underline font-semibold pt-1"
                                    >
                                      <span>อ่านบทความบน ThaiJO</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center py-8 text-xs text-muted-foreground">ยังไม่มีข้อมูลผลงานวิจัย</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Modal Tab 2: Education */}
                {activeModalTab === "education" && (
                  <div className="p-4 rounded-xl border bg-card space-y-2 text-xs">
                    <h4 className="font-bold text-sm text-foreground">ประวัติการศึกษา</h4>
                    {selectedPerson.educationTh ? (
                      <div className="space-y-1.5">
                        {selectedPerson.educationTh.split("\n").map((line: string, idx: number) => (
                          <p key={idx} className="p-2 rounded bg-muted/30 text-foreground">
                            {line}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">ยังไม่มีข้อมูลประวัติการศึกษา</p>
                    )}
                  </div>
                )}

                {/* Modal Tab 3: Contact */}
                {activeModalTab === "contact" && (
                  <div className="p-4 rounded-xl border bg-card space-y-2 text-xs">
                    <h4 className="font-bold text-sm text-foreground">ข้อมูลการติดต่อ</h4>
                    {selectedPerson.email ? (
                      <p>
                        <strong>อีเมล: </strong>
                        <a href={`mailto:${selectedPerson.email}`} className="text-primary hover:underline">
                          {selectedPerson.email}
                        </a>
                      </p>
                    ) : (
                      <p className="text-muted-foreground">ไม่มีข้อมูลการติดต่อสาธารณะเพิ่มเติม</p>
                    )}
                  </div>
                )}
              </div>
            </LiyonDialogBody>
            <LiyonDialogFooter>
              <Button variant="outline" onClick={() => setSelectedPerson(null)}>
                ปิดหน้าต่าง
              </Button>
            </LiyonDialogFooter>
          </>
        )}
      </LiyonDialog>
    </div>
  );
}
