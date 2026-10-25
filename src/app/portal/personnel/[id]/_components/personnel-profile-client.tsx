"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  Briefcase,
  Mail,
  Printer,
  Share2,
  Calendar,
  Sparkles,
  ArrowLeft,
  Building,
  Award,
  ExternalLink,
  ChevronRight,
  Layers,
  Search,
  MapPin,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import {
  type TeachingCourse,
  type DegreeLevel,
  parseTeachingExperiences,
  formatDegreeLevelLabel,
  getDegreeLevelColor,
} from "@/features/personnel/teaching-courses";
import { Button } from "@/components/ui/button";

interface ResearchPublication {
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
}

interface PersonnelDetail {
  id: string;
  firstNameTh: string;
  lastNameTh: string;
  firstNameEn?: string | null;
  lastNameEn?: string | null;
  positionTh: string;
  positionEn?: string | null;
  academicPosition?: string | null;
  type: string;
  imageUrl?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  educationTh?: string | null;
  experiencesTh?: string | null;
  bioTh?: string | null;
  contactInfo?: string | null;
  department?: {
    id: string;
    nameTh: string;
    nameEn?: string | null;
  } | null;
  researchPublications?: ResearchPublication[];
}

interface Props {
  person: PersonnelDetail;
  locale: string;
}

export function PersonnelProfileClient({ person, locale }: Props) {
  const [activeTab, setActiveTab] = useState<"teaching" | "research" | "education" | "honors">("teaching");

  // Teaching Courses Filter State
  const [selectedLevel, setSelectedLevel] = useState<DegreeLevel | "ALL">("ALL");
  const [selectedCourseYear, setSelectedCourseYear] = useState<string>("ALL");
  const [courseSearch, setCourseSearch] = useState("");

  // Research Publications Filter State
  const [selectedResearchYear, setSelectedResearchYear] = useState<string>("ALL");
  const [researchSearch, setResearchSearch] = useState("");

  // Parse structured teaching courses
  const teachingCourses: TeachingCourse[] = useMemo(() => {
    return parseTeachingExperiences(person.experiencesTh, {
      id: person.id,
      firstNameTh: person.firstNameTh,
      lastNameTh: person.lastNameTh,
      departmentName: person.department?.nameTh,
    });
  }, [person]);

  // Available teaching years
  const availableCourseYears = useMemo(() => {
    const set = new Set(teachingCourses.map((c) => c.year));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [teachingCourses]);

  // Counts by level
  const bachelorCount = useMemo(
    () => teachingCourses.filter((c) => c.level === "BACHELOR").length,
    [teachingCourses]
  );
  const masterCount = useMemo(
    () => teachingCourses.filter((c) => c.level === "MASTER").length,
    [teachingCourses]
  );
  const doctoralCount = useMemo(
    () => teachingCourses.filter((c) => c.level === "DOCTORAL").length,
    [teachingCourses]
  );

  // Filtered teaching courses
  const filteredCourses = useMemo(() => {
    return teachingCourses.filter((c) => {
      const q = courseSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.courseCode.toLowerCase().includes(q) ||
        c.courseNameTh.toLowerCase().includes(q) ||
        (c.courseNameEn && c.courseNameEn.toLowerCase().includes(q)) ||
        c.programTh.toLowerCase().includes(q);

      const matchesLevel = selectedLevel === "ALL" || c.level === selectedLevel;
      const matchesYear = selectedCourseYear === "ALL" || c.year === selectedCourseYear;

      return matchesSearch && matchesLevel && matchesYear;
    });
  }, [teachingCourses, courseSearch, selectedLevel, selectedCourseYear]);

  // Publications
  const publications = person.researchPublications || [];
  const availablePubYears = useMemo(() => {
    const set = new Set(publications.map((p) => p.publicationYear || "ไม่ระบุปี"));
    return Array.from(set).sort((a, b) => {
      if (a === "ไม่ระบุปี") return 1;
      if (b === "ไม่ระบุปี") return -1;
      return b.localeCompare(a);
    });
  }, [publications]);

  const filteredPublications = useMemo(() => {
    return publications.filter((p) => {
      const q = researchSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.titleTh.toLowerCase().includes(q) ||
        (p.titleEn && p.titleEn.toLowerCase().includes(q)) ||
        p.journalName.toLowerCase().includes(q);

      const matchesYear =
        selectedResearchYear === "ALL" || (p.publicationYear || "ไม่ระบุปี") === selectedResearchYear;

      return matchesSearch && matchesYear;
    });
  }, [publications, researchSearch, selectedResearchYear]);

  // Parse education into Dham (religious) & Secular
  const parsedEducation = useMemo(() => {
    const text = person.educationTh || "";
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const dhamLines = lines.filter((l) => l.includes("การศึกษาทางธรรม") || l.includes("เปรียญธรรม") || l.includes("ป.ธ.") || l.includes("น.ธ."));
    const secularLines = lines.filter((l) => !dhamLines.includes(l));
    return { dhamLines, secularLines, allLines: lines };
  }, [person.educationTh]);

  // Parse bio into expertise, awards, sangha roles
  const parsedBio = useMemo(() => {
    const text = person.bioTh || "";
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const awards = lines.filter((l) => l.includes("รางวัล") || l.includes("เกียรติยศ"));
    const expertise = lines.filter((l) => l.includes("เชี่ยวชาญ") || l.includes("ความเชี่ยวชาญ"));
    const sangha = lines.filter((l) => l.includes("สมณศักดิ์") || l.includes("คณะสงฆ์") || l.includes("เจ้าอาวาส"));
    const other = lines.filter((l) => !awards.includes(l) && !expertise.includes(l) && !sangha.includes(l));
    return { awards, expertise, sangha, other, hasContent: lines.length > 0 };
  }, [person.bioTh]);

  // Extract Office / Room
  const officeRoom = useMemo(() => {
    const contact = person.contactInfo || "";
    const match = contact.match(/ห้องพักอาจารย์:\s*([^|]+)/);
    return match ? match[1].trim() : null;
  }, [person.contactInfo]);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("คัดลอกลิงก์โปรไฟล์อาจารย์เรียบร้อยแล้ว");
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const fullNameTh = `${person.academicPosition ? `${person.academicPosition} ` : ""}${person.firstNameTh} ${person.lastNameTh}`.trim();
  const fullNameEn = person.firstNameEn
    ? `${person.firstNameEn} ${person.lastNameEn || ""}`.trim()
    : null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* ── Top Bar: Back Link & Quick Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4 print:hidden">
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/portal/personnel"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-primary" />
            <span>กลับสู่ทำเนียบคณาจารย์</span>
          </Link>

          {person.department?.nameTh?.includes("พระพุทธศาสนา") && (
            <Link
              href="/portal/departments/buddhism"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-bold transition-colors border border-amber-500/20"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>ภาควิชาพระพุทธศาสนา</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          )}

          <a
            href="https://fb.mcu.ac.th/?page_id=9032"
            target="_blank"
            rel="noreferrer"
            className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground text-[11px] font-medium transition-colors"
          >
            <span>แหล่งข้อมูลทางการ: fb.mcu.ac.th/?page_id=9032</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="gap-1.5 text-xs font-medium rounded-xl cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>แชร์โปรไฟล์</span>
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>พิมพ์ประวัติ / Export CV</span>
          </Button>
        </div>
      </div>

      {/* ── Hero Faculty Dossier Banner ── */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-card to-background p-6 sm:p-8 lg:p-10 shadow-lg">
        {/* Glow ambient background decoration */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
          {/* Portrait Photo */}
          <div className="relative w-44 h-56 sm:w-52 sm:h-64 rounded-2xl overflow-hidden border-2 border-amber-500/30 shadow-xl bg-muted/60 shrink-0">
            {person.imageUrl ? (
              <Image
                src={person.imageUrl}
                alt={fullNameTh}
                fill
                unoptimized
                className="object-cover object-top"
                priority
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-3 bg-gradient-to-br from-amber-500/10 to-muted">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <GraduationCap className="w-10 h-10" />
                </div>
                <span className="text-xs font-medium text-center px-4">
                  คณาจารย์ประจำคณะพุทธศาสตร์
                </span>
              </div>
            )}
          </div>

          {/* Dossier Information */}
          <div className="space-y-4 flex-1 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider border border-amber-500/20">
                <Building className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                {person.department?.nameTh || "สำนักงานคณบดีและผู้บริหาร"}
              </span>

              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                <Briefcase className="w-3.5 h-3.5" />
                {person.type === "EXECUTIVE"
                  ? "ผู้บริหาร"
                  : person.type === "ACADEMIC"
                  ? "สายวิชาการ"
                  : "สายสนับสนุน"}
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                {fullNameTh}
              </h1>
              {fullNameEn && (
                <p className="text-base sm:text-lg text-muted-foreground font-medium mt-1">
                  {fullNameEn}
                </p>
              )}
              <p className="text-sm sm:text-base text-primary font-semibold mt-2">
                {person.positionTh}
              </p>
            </div>

            {/* Public Official Contact & Office Location */}
            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-muted-foreground">
              {person.email && (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-card border shadow-xs">
                  <Mail className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <a
                    href={`mailto:${person.email}`}
                    className="hover:text-primary transition-colors font-medium text-foreground"
                  >
                    {person.email}
                  </a>
                </div>
              )}

              {officeRoom && (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-card border shadow-xs text-foreground font-medium">
                  <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{officeRoom}</span>
                </div>
              )}

              <div className="flex items-center gap-2 p-2 rounded-xl bg-card border shadow-xs">
                <Building className="w-4 h-4 text-primary shrink-0" />
                <span>คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย อยุธยา</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Key Metrics Overview ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:hidden">
        <div className="p-4 rounded-2xl bg-card border shadow-xs space-y-1">
          <div className="flex items-center gap-2 text-primary text-xs font-semibold">
            <BookOpen className="w-4 h-4" />
            <span>รายวิชาที่สอน</span>
          </div>
          <p className="text-2xl font-extrabold text-foreground">
            {teachingCourses.length} <span className="text-xs font-normal text-muted-foreground">วิชา</span>
          </p>
          <p className="text-[11px] text-muted-foreground">ครอบคลุมทุกระดับการศึกษา</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border shadow-xs space-y-1">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-semibold">
            <Award className="w-4 h-4" />
            <span>ผลงานวิจัย & สิ่งตีพิมพ์</span>
          </div>
          <p className="text-2xl font-extrabold text-foreground">
            {publications.length} <span className="text-xs font-normal text-muted-foreground">เรื่อง</span>
          </p>
          <p className="text-[11px] text-muted-foreground">วารสาร TCI / สิ่งพิมพ์ทางการ</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border shadow-xs space-y-1">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 text-xs font-semibold">
            <GraduationCap className="w-4 h-4" />
            <span>ระดับการศึกษา</span>
          </div>
          <p className="text-lg sm:text-xl font-extrabold text-foreground">ตรี • โท • เอก</p>
          <p className="text-[11px] text-muted-foreground">พธ.บ. / พธ.ม. / พธ.ด.</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border shadow-xs space-y-1">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <Calendar className="w-4 h-4" />
            <span>ปีการศึกษาล่าสุด</span>
          </div>
          <p className="text-2xl font-extrabold text-foreground">๒๕๖๘</p>
          <p className="text-[11px] text-muted-foreground">ปีการศึกษาที่เปิดสอน</p>
        </div>
      </div>

      {/* ── Main Tab Navigation Bar (ตรงตามโครงสร้างทางการของ มจร) ── */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-2 overflow-x-auto scrollbar-thin print:hidden">
        <button
          type="button"
          onClick={() => setActiveTab("teaching")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "teaching"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>ประสบการณ์รายวิชาที่สอน (แยกปี & ระดับ)</span>
          <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs">
            {teachingCourses.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("research")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "research"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Award className="w-4 h-4 text-amber-400" />
          <span>ผลงานวิจัย สิ่งตีพิมพ์ และหนังสือ</span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-xs">
            {publications.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("education")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "education"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>ประวัติการศึกษาและตำแหน่ง</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("honors")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "honors"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>รางวัล เกียรติยศ และความเชี่ยวชาญ</span>
        </button>
      </div>

      {/* ── TAB 1: ประสบการณ์รายวิชาที่สอน (แยกปี พ.ศ. และระดับ ป.ตรี / ป.โท / ป.เอก) ── */}
      {activeTab === "teaching" && (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
          {/* Controls: Level Pills + Year Filter + Course Search */}
          <div className="p-4 sm:p-5 rounded-2xl bg-card border shadow-xs space-y-4 print:hidden">
            {/* Level Selector Pills */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-primary" />
                <span>เลือกระดับการศึกษา:</span>
              </span>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                <button
                  type="button"
                  onClick={() => setSelectedLevel("ALL")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedLevel === "ALL"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  }`}
                >
                  ทุกระดับการศึกษา ({teachingCourses.length})
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedLevel("BACHELOR")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedLevel === "BACHELOR"
                      ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-400/40"
                      : "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 hover:bg-blue-500/20"
                  }`}
                >
                  <span>🏛️ ระดับปริญญาตรี (พธ.บ.)</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-blue-500/20 text-[10px]">
                    {bachelorCount} วิชา
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedLevel("MASTER")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedLevel === "MASTER"
                      ? "bg-purple-600 text-white shadow-md ring-2 ring-purple-400/40"
                      : "bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 hover:bg-purple-500/20"
                  }`}
                >
                  <span>📜 ระดับปริญญาโท (พธ.ม.)</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-purple-500/20 text-[10px]">
                    {masterCount} วิชา
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedLevel("DOCTORAL")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedLevel === "DOCTORAL"
                      ? "bg-amber-500 text-white shadow-md ring-2 ring-amber-400/50"
                      : "bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/20"
                  }`}
                >
                  <span>🪷 ระดับปริญญาเอก (พธ.ด.)</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-[10px]">
                    {doctoralCount} วิชา
                  </span>
                </button>
              </div>
            </div>

            {/* Year & Search Bar */}
            <div className="pt-2 border-t border-border/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span>ปีการศึกษา:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedCourseYear("ALL")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCourseYear === "ALL"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  ทุกปีการศึกษา
                </button>
                {availableCourseYears.map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setSelectedCourseYear(yr)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCourseYear === yr
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    ปี พ.ศ. {yr}
                  </button>
                ))}
              </div>

              <div className="relative sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="ค้นหารหัสวิชา หรือชื่อวิชา..."
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Courses List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <span>
                  รายวิชาที่สอน ({filteredCourses.length} วิชา)
                </span>
              </h3>
            </div>

            {filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCourses.map((c) => {
                  const style = getDegreeLevelColor(c.level);
                  return (
                    <div
                      key={c.id}
                      className="p-5 rounded-2xl border bg-card hover:shadow-md transition-all space-y-3 relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${style.bg}`}>
                            {style.icon} {formatDegreeLevelLabel(c.level)}
                          </span>

                          <span className="px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[11px] font-semibold flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>ปี พ.ศ. {c.year} (ภาคเรียนที่ {c.semester})</span>
                          </span>
                        </div>

                        <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-bold shrink-0">
                          {c.credits} หน่วยกิต
                        </span>
                      </div>

                      <div>
                        <div className="text-xs font-mono font-bold text-muted-foreground">
                          รหัสวิชา: {c.courseCode}
                        </div>
                        <h4 className="text-base font-bold text-foreground mt-0.5 leading-snug">
                          {c.courseNameTh}
                        </h4>
                        {c.courseNameEn && (
                          <p className="text-xs text-muted-foreground font-medium italic mt-0.5">
                            {c.courseNameEn}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-border/60 text-xs text-muted-foreground space-y-1">
                        <p>
                          <strong className="text-foreground">หลักสูตร: </strong>
                          {c.programTh}
                        </p>
                        <p>
                          <strong className="text-foreground">บทบาทหน้าที่: </strong>
                          <span className="text-primary font-medium">{c.role}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 border rounded-2xl bg-card">
                <BookOpen className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-foreground">ไม่พบรายวิชาที่สอนตามเงื่อนไขที่เลือก</h4>
                <p className="text-xs text-muted-foreground mt-1">กรุณาลองเปลี่ยนระดับการศึกษาหรือปีการศึกษา</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: ผลงานวิจัย สิ่งตีพิมพ์ และหนังสือ (RESEARCH & PUBLICATIONS) ── */}
      {activeTab === "research" && (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
          {/* Research Filter Bar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-card border shadow-xs space-y-3 print:hidden">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span>เลือกปี พ.ศ.:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedResearchYear("ALL")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedResearchYear === "ALL"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  ทุกปี พ.ศ. ({publications.length})
                </button>
                {availablePubYears.map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setSelectedResearchYear(yr)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedResearchYear === yr
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    พ.ศ. {yr}
                  </button>
                ))}
              </div>

              <div className="relative sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อเรื่อง หรือวารสาร..."
                  value={researchSearch}
                  onChange={(e) => setResearchSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Publications List */}
          <div className="space-y-4">
            {filteredPublications.length > 0 ? (
              filteredPublications.map((pub, idx) => (
                <div
                  key={pub.id}
                  className="p-5 rounded-2xl border bg-card hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                          {idx + 1}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
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
                            : "บทความวิชาการ/หนังสือ"}
                        </span>
                        {pub.tier && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                            ⭐ {pub.tier}
                          </span>
                        )}
                        {pub.publicationYear && (
                          <span className="px-2 py-0.5 rounded text-[11px] bg-muted text-muted-foreground font-medium">
                            พ.ศ. {pub.publicationYear}
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-bold text-foreground leading-snug pt-1">
                        {pub.titleTh}
                      </h4>
                      {pub.titleEn && (
                        <p className="text-xs text-muted-foreground font-medium italic">
                          {pub.titleEn}
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">ผู้วิจัย/ผู้แต่ง: </strong>
                    {pub.authors}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground bg-muted/30 p-3 rounded-xl border border-border/50">
                    <span>
                      <strong className="text-foreground">วารสาร/แหล่งตีพิมพ์: </strong> {pub.journalName}
                    </span>
                    {pub.volume && <span>{pub.volume}</span>}
                    {pub.issue && <span>{pub.issue}</span>}
                    {pub.pages && <span>หน้า {pub.pages}</span>}
                    {pub.issn && <span>ISSN: {pub.issn}</span>}
                  </div>

                  {pub.url && (
                    <div className="pt-1 print:hidden">
                      <a
                        href={pub.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs transition-colors"
                      >
                        <span>เปิดดูแหล่งอ้างอิงต้นฉบับ</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-16 border rounded-2xl bg-card">
                <Award className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-foreground">ไม่พบผลงานวิจัยตามเงื่อนไขที่เลือก</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  อาจารย์ยังไม่มีรายการผลงานวิจัยในระบบหรือลองเลือกดูปีอื่น
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: ประวัติการศึกษาและตำแหน่ง (EDUCATION & POSITIONS) ── */}
      {activeTab === "education" && (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Education: Dham & Secular */}
            <div className="p-6 rounded-2xl border bg-card space-y-4">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2 border-b pb-3">
                <GraduationCap className="w-5 h-5 text-primary" />
                <span>ประวัติการศึกษา (ทางธรรมและทางโลก)</span>
              </h3>

              {parsedEducation.allLines.length > 0 ? (
                <div className="space-y-3">
                  {parsedEducation.dhamLines.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>การศึกษาทางธรรม (พระปริยัติธรรม)</span>
                      </h4>
                      {parsedEducation.dhamLines.map((line, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                          <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                          <span className="text-foreground font-semibold leading-relaxed">
                            {line.replace(/^การศึกษาทางธรรม:\s*/, "")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {parsedEducation.secularLines.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>การศึกษาทางโลก (อุดมศึกษา)</span>
                      </h4>
                      {parsedEducation.secularLines.map((line, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-muted/40 text-xs border border-border/50">
                          <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                          <span className="text-foreground font-medium leading-relaxed">
                            {line.replace(/^การศึกษาทางโลก:\s*/, "")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-6 text-center">
                  ยังไม่มีข้อมูลประวัติการศึกษาบันทึกไว้ในระบบ
                </p>
              )}
            </div>

            {/* Positions & Appointments */}
            <div className="p-6 rounded-2xl border bg-card space-y-4">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2 border-b pb-3">
                <Briefcase className="w-5 h-5 text-amber-500" />
                <span>ตำแหน่งทางบริหารและคณะสงฆ์</span>
              </h3>

              {person.experiencesTh ? (
                <div className="space-y-2.5">
                  {person.experiencesTh.split("\n").map((line, idx) => {
                    const isSangha = line.includes("คณะสงฆ์") || line.includes("วัด");
                    const isAdmin = line.includes("บริหาร") || line.includes("คณบดี") || line.includes("อธิการบดี") || line.includes("ผู้อำนวยการ");
                    return (
                      <div
                        key={idx}
                        className={`flex items-start gap-2.5 p-3 rounded-xl text-xs border ${
                          isSangha
                            ? "bg-amber-500/10 border-amber-500/30 text-foreground"
                            : isAdmin
                            ? "bg-primary/5 border-primary/20 text-foreground"
                            : "bg-muted/30 border-border/50 text-muted-foreground"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${isSangha ? "bg-amber-500" : "bg-primary"}`} />
                        <span className="leading-relaxed font-medium">{line}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-6 text-center">
                  ยังไม่มีข้อมูลประสบการณ์บันทึกไว้ในระบบ
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: รางวัล เกียรติยศ และความเชี่ยวชาญ (HONORS & EXPERTISE) ── */}
      {activeTab === "honors" && (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Honors & Awards Card */}
            <div className="p-6 rounded-2xl border bg-card space-y-4">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2 border-b pb-3">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span>รางวัลและเกียรติยศ (Honors & Awards)</span>
              </h3>

              {parsedBio.awards.length > 0 ? (
                <div className="space-y-3">
                  {parsedBio.awards.map((award, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                      <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                      <p className="text-xs font-semibold text-foreground leading-relaxed">
                        {award.replace(/^รางวัลและเกียรติยศ:\s*/, "")}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-xs space-y-2">
                  <Trophy className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                  <p>ข้อมูลรางวัลและเกียรติยศอยู่ในระหว่างการรวบรวมเพิ่มเติม</p>
                </div>
              )}
            </div>

            {/* Academic Expertise Card */}
            <div className="p-6 rounded-2xl border bg-card space-y-4">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2 border-b pb-3">
                <Sparkles className="w-5 h-5 text-primary" />
                <span>สาขาความเชี่ยวชาญและวิชาการ (Academic Expertise)</span>
              </h3>

              {parsedBio.expertise.length > 0 || person.bioTh ? (
                <div className="space-y-3">
                  {parsedBio.expertise.map((exp, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 flex items-start gap-3">
                      <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-xs font-semibold text-foreground leading-relaxed">
                        {exp.replace(/^สาขาความเชี่ยวชาญ:\s*/, "")}
                      </p>
                    </div>
                  ))}

                  {parsedBio.other.length > 0 && (
                    <div className="p-4 rounded-xl bg-muted/40 text-xs text-foreground leading-relaxed space-y-1">
                      {parsedBio.other.map((line, idx) => (
                        <p key={idx}>{line}</p>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-xs space-y-2">
                  <Sparkles className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                  <p>ยังไม่มีการระบุสาขาความเชี่ยวชาญเฉพาะ</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
