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
  ExternalLink,
  Search,
  Award,
  Building2,
  ChevronRight,
  Compass,
} from "lucide-react";
import {
  LiyonDialog,
  LiyonDialogCloseButton,
  LiyonDialogTitle,
} from "@/shared/components/liyon";
import { Button } from "@/components/ui/button";
import { formatPersonnelName } from "@/features/personnel";
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

export function PhilosophyDepartmentClient({
  teachers,
  curriculums,
  locale: _locale = "th",
}: Props) {
  const [activeTab, setActiveTab] = useState<"teachers" | "research" | "programs" | "about">("teachers");

  // Selected Teacher Modal State
  const [selectedPerson, setSelectedPerson] = useState<PersonnelItem | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<"research" | "education" | "experience" | "contact">("research");
  const [_modalYearFilter, setModalYearFilter] = useState<string>("ALL");
  const [_modalPubSearch, setModalPubSearch] = useState("");

  // Search & Filters in Department Research
  const [teacherSearch, setTeacherSearch] = useState("");
  const [researchSearch, setResearchSearch] = useState("");
  const [selectedResearchYear, setSelectedResearchYear] = useState<string>("ALL");

  // 1. Filtered Teachers
  const filteredTeachers = useMemo(() => {
    if (!teacherSearch.trim()) return teachers;
    const q = teacherSearch.toLowerCase().trim();
    return teachers.filter((t) => {
      const fullTh = `${t.academicPosition || ""} ${t.firstNameTh} ${t.lastNameTh || ""}`.toLowerCase();
      const fullEn = `${t.firstNameEn || ""} ${t.lastNameEn || ""}`.toLowerCase();
      const pos = (t.positionTh || "").toLowerCase();
      return fullTh.includes(q) || fullEn.includes(q) || pos.includes(q);
    });
  }, [teachers, teacherSearch]);

  // 2. All Department Publications Flattened with Teacher Link
  const departmentPublications = useMemo(() => {
    const list: Array<ResearchPub & { teacher: PersonnelItem }> = [];
    for (const t of teachers) {
      if (t.researchPublications && t.researchPublications.length > 0) {
        for (const pub of t.researchPublications) {
          list.push({ ...pub, teacher: t });
        }
      }
    }
    return list;
  }, [teachers]);

  // Distinct Publication Years in Department
  const distinctPubYears = useMemo(() => {
    const yearSet = new Set<string>();
    for (const p of departmentPublications) {
      const norm = normalizePublicationYear(p.publicationYear);
      if (norm) yearSet.add(norm);
    }
    return Array.from(yearSet).sort((a, b) => {
      const na = parseInt(a, 10);
      const nb = parseInt(b, 10);
      if (!isNaN(na) && !isNaN(nb)) return nb - na;
      return b.localeCompare(a);
    });
  }, [departmentPublications]);

  // Filtered Department Publications
  const filteredPublications = useMemo(() => {
    return departmentPublications.filter((pub) => {
      if (selectedResearchYear !== "ALL") {
        const norm = normalizePublicationYear(pub.publicationYear);
        if (norm !== selectedResearchYear) return false;
      }
      if (researchSearch.trim()) {
        const q = researchSearch.toLowerCase().trim();
        const titleMatch = (pub.titleTh || "").toLowerCase().includes(q) || (pub.titleEn || "").toLowerCase().includes(q);
        const authorsMatch = (pub.authors || "").toLowerCase().includes(q);
        const journalMatch = (pub.journalName || "").toLowerCase().includes(q);
        const teacherMatch = `${pub.teacher.firstNameTh} ${pub.teacher.lastNameTh || ""}`.toLowerCase().includes(q);
        return titleMatch || authorsMatch || journalMatch || teacherMatch;
      }
      return true;
    });
  }, [departmentPublications, selectedResearchYear, researchSearch]);

  // Group filtered publications by Year
  const pubsGroupedByYear = useMemo(() => {
    const map = new Map<string, Array<ResearchPub & { teacher: PersonnelItem }>>();
    for (const pub of filteredPublications) {
      const y = normalizePublicationYear(pub.publicationYear) || "ไม่ระบุปี";
      if (!map.has(y)) map.set(y, []);
      map.get(y)!.push(pub);
    }
    return Array.from(map.entries()).sort((a, b) => {
      const na = parseInt(a[0], 10);
      const nb = parseInt(b[0], 10);
      if (!isNaN(na) && !isNaN(nb)) return nb - na;
      return b[0].localeCompare(a[0]);
    });
  }, [filteredPublications]);

  const openTeacherModal = (person: PersonnelItem, tab: "research" | "education" | "experience" = "research") => {
    setSelectedPerson(person);
    setModalYearFilter("ALL");
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
      <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-card to-background p-6 sm:p-10 shadow-lg">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-gradient-to-br from-indigo-400/20 to-purple-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Compass className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                ภาควิชาสังกัดคณะพุทธศาสตร์ มจร
              </span>
              <a
                href="https://fb.mcu.ac.th/?page_id=9084"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground text-[11px] font-medium transition-colors"
              >
                <span>อ้างอิงข้อมูล: fb.mcu.ac.th/?page_id=9084</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              ภาควิชาศาสนาและปรัชญา
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground font-medium">
              Department of Religion and Philosophy • Faculty of Buddhism, Mahachulalongkornrajavidyalaya University
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
              มุ่งเน้นการศึกษาค้นคว้า วิจัย และพัฒนาองค์ความรู้ทางปรัชญาตะวันออกและตะวันตก ศาสนาเปรียบเทียบ และพุทธปรัชญา บูรณาการความคิดเชิงวิพากษ์และจริยธรรมเพื่อสังคมแห่งปัญญา
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
              <div className="flex items-center justify-center gap-1 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
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
          <BookOpen className="w-4 h-4 text-indigo-300" />
          <span>ผลงานวิจัย & วิชาการ</span>
          <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-xs">
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
          <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-xs">
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
          <span>เกี่ยวกับภาควิชา</span>
        </button>
      </div>

      {/* ── 3. Tab 1: Teachers Directory ── */}
      {activeTab === "teachers" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>รายนามคณาจารย์ประจำภาควิชาศาสนาและปรัชญา</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                คลิกที่การ์ดเพื่อดูข้อมูลประวัติการศึกษา ประสบการณ์สอน และผลงานวิจัยวิชาการ
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                placeholder="ค้นหาชื่ออาจารย์ หรือตำแหน่ง..."
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeachers.map((person) => {
              const pubCount = person.researchPublications?.length ?? 0;
              const formattedName = formatPersonnelName({
                academicPosition: person.academicPosition,
                firstNameTh: person.firstNameTh,
                lastNameTh: person.lastNameTh,
                titlePlacement: person.titlePlacement,
              });

              return (
                <div
                  key={person.id}
                  className="group relative flex flex-col justify-between rounded-2xl border bg-card hover:shadow-xl hover:border-indigo-500/50 transition-all duration-300"
                >
                  <div>
                    {/* Photo / Avatar */}
                    <div
                      onClick={() => openTeacherModal(person, "education")}
                      className="block relative aspect-[3/4] w-full bg-gradient-to-br from-indigo-500/10 via-muted to-muted/40 rounded-t-2xl overflow-hidden cursor-pointer"
                    >
                      {person.imageUrl ? (
                        <Image
                          src={person.imageUrl}
                          alt={person.firstNameTh}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                          <Users className="w-16 h-16 opacity-30 stroke-[1.5]" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />

                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <div className="text-[11px] font-semibold text-indigo-300 drop-shadow-sm flex items-center gap-1">
                          <Compass className="w-3 h-3" />
                          <span>ภาควิชาศาสนาและปรัชญา</span>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold leading-tight drop-shadow-md">
                          {formattedName}
                        </h3>
                        {person.firstNameEn && (
                          <p className="text-[11px] text-white/80 font-light truncate drop-shadow-sm">
                            {person.academicPositionEn ? `${person.academicPositionEn} ` : ""}
                            {person.firstNameEn} {person.lastNameEn || ""}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-4 space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-primary line-clamp-2">
                          {person.positionTh}
                        </p>
                        {person.positionEn && (
                          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                            {person.positionEn}
                          </p>
                        )}
                      </div>

                      {person.bioTh && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {person.bioTh}
                        </p>
                      )}

                      {/* Badges / Stats */}
                      <div className="flex items-center gap-2 pt-1 border-t border-border/60">
                        {pubCount > 0 ? (
                          <button
                            type="button"
                            onClick={() => openTeacherModal(person, "research")}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-medium text-xs transition-colors cursor-pointer"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            <span>ผลงานวิจัย {pubCount} เรื่อง</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5 opacity-50" />
                            <span>ยังไม่มีผลงานวิจัยในระบบ</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-3 pt-0 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openTeacherModal(person, "education")}
                      className="flex-1 text-xs h-8 cursor-pointer hover:bg-indigo-500/10 hover:text-indigo-600 hover:border-indigo-500/30"
                    >
                      <GraduationCap className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                      ดูประวัติและผลงาน
                    </Button>
                    <Link
                      href={`/portal/personnel/${person.id}`}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted text-xs transition-colors"
                      title="เปิดหน้าโปรไฟล์เดี่ยว"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 4. Tab 2: Research & Publications ── */}
      {activeTab === "research" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>คลังผลงานวิจัยและวิชาการ ภาควิชาศาสนาและปรัชญา</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                ผลงานตีพิมพ์ในวารสารระดับชาติและนานาชาติ (TCI) จำแนกตามปี พ.ศ.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={researchSearch}
                  onChange={(e) => setResearchSearch(e.target.value)}
                  placeholder="ค้นหาชื่อผลงาน, ผู้เขียน, หรือวารสาร..."
                  className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                />
              </div>

              {/* Year Dropdown Filter */}
              <select
                value={selectedResearchYear}
                onChange={(e) => setSelectedResearchYear(e.target.value)}
                className="px-3 py-2 text-xs sm:text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
              >
                <option value="ALL">ทุกปี พ.ศ. ({departmentPublications.length})</option>
                {distinctPubYears.map((y) => {
                  const cnt = departmentPublications.filter(
                    (p) => normalizePublicationYear(p.publicationYear) === y
                  ).length;
                  return (
                    <option key={y} value={y}>
                      พ.ศ. {y} ({cnt} เรื่อง)
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {pubsGroupedByYear.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/50 space-y-3">
              <BookOpen className="w-10 h-10 text-muted-foreground mx-auto opacity-50" />
              <p className="text-sm font-medium text-foreground">ไม่พบผลงานวิจัยตามเงื่อนไขที่เลือก</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setResearchSearch("");
                  setSelectedResearchYear("ALL");
                }}
              >
                ล้างการค้นหา
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {pubsGroupedByYear.map(([year, pubs]) => (
                <div key={year} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <h3 className="text-lg font-bold text-foreground">
                      {formatPublicationYearLabel(year)}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-semibold">
                      {pubs.length} เรื่อง
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pubs.map((pub) => (
                      <div
                        key={pub.id}
                        className="p-4 rounded-xl border bg-card hover:shadow-md transition-shadow flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-800 dark:text-indigo-300">
                              {pub.tier || "บทความวิจัย"}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              พ.ศ. {pub.publicationYear || "—"}
                            </span>
                          </div>

                          <h4 className="text-sm font-semibold text-foreground leading-snug">
                            {pub.titleTh}
                          </h4>
                          {pub.titleEn && (
                            <p className="text-xs text-muted-foreground italic leading-tight">
                              {pub.titleEn}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground pt-1">
                            <span className="font-medium text-foreground">ผู้เขียน:</span> {pub.authors}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">วารสาร:</span> {pub.journalName}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs">
                          <button
                            type="button"
                            onClick={() => openTeacherModal(pub.teacher, "research")}
                            className="text-primary hover:underline font-medium text-left truncate cursor-pointer"
                          >
                            โดย: {pub.teacher.academicPosition ? `${pub.teacher.academicPosition} ` : ""}
                            {pub.teacher.firstNameTh} {pub.teacher.lastNameTh || ""}
                          </button>
                          {pub.url && (
                            <a
                              href={pub.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-semibold"
                            >
                              <span>อ่านบทความ</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 5. Tab 3: Curriculums / Programs ── */}
      {activeTab === "programs" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>หลักสูตรที่เปิดสอนในภาควิชาศาสนาและปรัชญา</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              หลักสูตรระดับปริญญาตรี ปริญญาโท และปริญญาเอก ด้านปรัชญา ศาสนาเปรียบเทียบ และพุทธปรัชญา
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {curriculums.map((c) => (
              <div
                key={c.id}
                className="p-6 rounded-2xl border bg-card hover:shadow-lg transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-bold">
                      {c.degree === "BACHELOR"
                        ? "ระดับปริญญาตรี"
                        : c.degree === "MASTER"
                        ? "ระดับปริญญาโท"
                        : "ระดับปริญญาเอก"}
                    </span>
                    <span className="text-xs text-muted-foreground">ระยะเวลา {c.durationYears} ปี</span>
                  </div>

                  <h3 className="text-lg font-bold text-foreground leading-snug">
                    {c.nameTh}
                  </h3>
                  {c.nameEn && (
                    <p className="text-xs text-muted-foreground font-medium">
                      {c.nameEn}
                    </p>
                  )}

                  {c.descriptionTh && (
                    <p className="text-xs text-muted-foreground leading-relaxed pt-2">
                      {c.descriptionTh}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <Link
                    href={`/portal/timetables`}
                    className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>ดูตารางเรียน / ตารางสอน</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    href={`/portal/programs`}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    ดูรายละเอียดหลักสูตร
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 6. Tab 4: About Department ── */}
      {activeTab === "about" && (
        <div className="space-y-8">
          <div className="p-6 sm:p-8 rounded-3xl border bg-card space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Building2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                <span>เกี่ยวกับภาควิชาศาสนาและปรัชญา</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
              </p>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-foreground/90 leading-relaxed">
              <p>
                <strong>ภาควิชาศาสนาและปรัชญา</strong> มุ่งมั่นผลิตบัณฑิตและนักวิชาการที่มีความเชี่ยวชาญทั้งพุทธปรัชญา ปรัชญาตะวันออก ปรัชญาตะวันตก และศาสนาเปรียบเทียบ สามารถบูรณาการหลักคิดทางปรัชญาเข้ากับการดำเนินชีวิตและการแก้ปัญหาสังคมร่วมสมัย
              </p>
              <p>
                คณาจารย์ประจำภาควิชามีความเชี่ยวชาญรอบด้าน ครอบคลุมอภิปรัชญา ญาณวิทยา จริยศาสตร์ สุนทรียศาสตร์ รวมถึงการวิจัยเชิงลึกด้านปรัชญาและศาสนาในระดับสากล
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
              <div className="p-4 rounded-xl bg-muted/40 space-y-2">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-indigo-600" />
                  <span>ปรัชญาและวิสัยทัศน์</span>
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  บูรณาการศาสตร์สากล พัฒนาปัญญาญาณ เชี่ยวชาญศาสนาและปรัชญาเปรียบเทียบ นำธรรมสู่สังคมร่วมสมัย
                </p>
              </div>

              <div className="p-4 rounded-xl bg-muted/40 space-y-2">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>ที่ตั้งและสำนักงานภาควิชา</span>
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  ภาควิชาศาสนาและปรัชญา คณะพุทธศาสตร์ (อาคารเรียนรวม) มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย ต.ลำไทร อ.วังน้อย จ.พระนครศรีอยุธยา 13170
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. Teacher Detail Modal Popup ── */}
      {selectedPerson && (
        <LiyonDialog open={!!selectedPerson} onOpenChange={(open) => !open && setSelectedPerson(null)}>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="relative w-full max-w-3xl max-h-[90vh] bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col">
              <LiyonDialogCloseButton label="ปิด" />

              {/* Modal Header */}
              <div className="p-6 bg-gradient-to-r from-indigo-500/10 via-muted/50 to-card border-b border-border flex items-start gap-4">
                <div className="relative w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden bg-muted shrink-0 border">
                  {selectedPerson.imageUrl ? (
                    <Image
                      src={selectedPerson.imageUrl}
                      alt={selectedPerson.firstNameTh}
                      fill
                      className="object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Users className="w-8 h-8 opacity-40" />
                    </div>
                  )}
                </div>

                <div className="space-y-1 pr-8">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-800 dark:text-indigo-300">
                      อาจารย์ประจำภาควิชาศาสนาและปรัชญา
                    </span>
                  </div>
                  <LiyonDialogTitle asChild>
                    <h3 className="text-lg sm:text-xl font-bold text-foreground">
                    {formatPersonnelName({
                      academicPosition: selectedPerson.academicPosition,
                      firstNameTh: selectedPerson.firstNameTh,
                      lastNameTh: selectedPerson.lastNameTh,
                      titlePlacement: selectedPerson.titlePlacement,
                    })}
                  </h3>
                  </LiyonDialogTitle>
                  <p className="text-xs text-primary font-medium">
                    {selectedPerson.positionTh}
                  </p>
                  {selectedPerson.email && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 pt-0.5">
                      <Mail className="w-3.5 h-3.5" />
                      <span>{selectedPerson.email}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Modal Subtabs */}
              <div className="flex items-center gap-1 px-6 pt-3 border-b border-border bg-muted/30">
                <button
                  type="button"
                  onClick={() => setActiveModalTab("research")}
                  className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    activeModalTab === "research"
                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  ผลงานวิจัย ({selectedPerson.researchPublications?.length ?? 0})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModalTab("education")}
                  className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    activeModalTab === "education"
                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  ประวัติการศึกษา
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModalTab("experience")}
                  className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    activeModalTab === "experience"
                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  ประสบการณ์สอน
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModalTab("contact")}
                  className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    activeModalTab === "contact"
                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  ข้อมูลติดต่อ
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-4 max-h-[50vh]">
                {activeModalTab === "research" && (
                  <div className="space-y-3">
                    {(!selectedPerson.researchPublications || selectedPerson.researchPublications.length === 0) ? (
                      <p className="text-xs text-muted-foreground text-center py-8">
                        ยังไม่มีข้อมูลผลงานวิจัยในระบบ
                      </p>
                    ) : (
                      selectedPerson.researchPublications.map((pub) => (
                        <div key={pub.id} className="p-3.5 rounded-xl border bg-card space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-indigo-600">พ.ศ. {pub.publicationYear || "—"}</span>
                            <span className="px-1.5 py-0.2 rounded bg-muted text-muted-foreground text-[10px]">
                              {pub.tier || "บทความวิจัย"}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-foreground leading-snug">{pub.titleTh}</h4>
                          {pub.titleEn && <p className="text-[11px] text-muted-foreground italic">{pub.titleEn}</p>}
                          <p className="text-[11px] text-muted-foreground pt-0.5">
                            <span className="font-medium text-foreground">วารสาร:</span> {pub.journalName}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeModalTab === "education" && (
                  <div className="space-y-2 text-xs leading-relaxed text-foreground/90 whitespace-pre-line">
                    {selectedPerson.educationTh || "ไม่มีข้อมูลประวัติการศึกษา"}
                  </div>
                )}

                {activeModalTab === "experience" && (
                  <div className="space-y-2 text-xs leading-relaxed text-foreground/90 whitespace-pre-line">
                    {selectedPerson.experiencesTh || "ไม่มีข้อมูลประสบการณ์สอน"}
                  </div>
                )}

                {activeModalTab === "contact" && (
                  <div className="space-y-3 text-xs">
                    {selectedPerson.email && (
                      <div className="flex items-center gap-2 text-foreground">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>อีเมล: {selectedPerson.email}</span>
                      </div>
                    )}
                    {selectedPerson.phoneNumber && (
                      <div className="flex items-center gap-2 text-foreground">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>โทรศัพท์: {selectedPerson.phoneNumber}</span>
                      </div>
                    )}
                    {selectedPerson.contactInfo && (
                      <div className="flex items-start gap-2 text-foreground pt-1">
                        <Building2 className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        <span>{selectedPerson.contactInfo}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-muted/40 border-t border-border flex items-center justify-between">
                <Link
                  href={`/portal/personnel/${selectedPerson.id}`}
                  className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>เปิดดูหน้าโปรไฟล์ฉบับเต็ม</span>
                </Link>

                <Button size="sm" variant="outline" onClick={() => setSelectedPerson(null)}>
                  ปิดหน้าต่าง
                </Button>
              </div>
            </div>
          </div>
        </LiyonDialog>
      )}
    </div>
  );
}
