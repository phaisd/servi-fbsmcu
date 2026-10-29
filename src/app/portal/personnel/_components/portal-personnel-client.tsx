"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Users,
  Mail,
  Phone,
  Briefcase,
  FileText,
  GraduationCap,
  BookOpen,
  ExternalLink,
  Search,
  Calendar,
  Award,
  Filter,
  Sparkles,
  ChevronRight,
  Download,
  MapPin,
} from "lucide-react";
import {
  LiyonDialog,
  LiyonDialogHeader,
  LiyonDialogBody,
  LiyonDialogFooter,
  LiyonDialogCloseButton,
} from "@/shared/components/liyon";
import { Button } from "@/components/ui/button";
import {
  exportPersonnelDoc,
  formatPersonnelName,
  parseTeachingExperiences,
  getCurriculumLanguageInfo,
  formatDegreeLevelLabel,
  getDegreeLevelColor,
} from "@/features/personnel";

export interface ResearchPub {
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

export interface PersonnelItem {
  id: string;
  firstNameTh: string;
  lastNameTh: string;
  firstNameEn?: string | null;
  lastNameEn?: string | null;
  positionTh: string;
  positionEn?: string | null;
  academicPosition?: string | null;
  academicPositionEn?: string | null;
  titlePlacement?: string | null;
  type: string;
  imageUrl?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  educationTh?: string | null;
  experiencesTh?: string | null;
  bioTh?: string | null;
  contactInfo?: string | null;
  officeLocation?: string | null;
  googleScholarUrl?: string | null;
  orderIndex?: number;
  department?: {
    id: string;
    nameTh: string;
    nameEn?: string | null;
  } | null;
  researchPublications?: ResearchPub[];
}

interface Props {
  items: PersonnelItem[];
  locale: string;
  initialDept?: string;
  initialView?: string;
  publicationYearsLimit?: number;
}

/** ฟังก์ชันแปลงเลขปีไทย (เช่น ๒๕๖๗, 2567) ให้อยู่ในรูปแบบตัวเลขสากล 4 หลัก เพื่อการจัดกลุ่มและกรองที่แม่นยำ */
export function normalizePublicationYear(raw?: string | null): string {
  if (!raw) return "ไม่ระบุปี";
  const thaiDigits = ["๐", "๑", "๒", "๓", "๔", "๕", "๖", "๗", "๘", "๙"];
  let str = raw;
  for (let i = 0; i < 10; i++) {
    str = str.replaceAll(thaiDigits[i], String(i));
  }
  const match = str.match(/\b(25\d{2}|20\d{2})\b/);
  if (match) {
    return match[1];
  }
  return raw.trim() || "ไม่ระบุปี";
}

export function parseBeYearNumber(normalizedYear: string): number | null {
  if (/^25\d{2}$/.test(normalizedYear)) {
    return parseInt(normalizedYear, 10);
  }
  if (/^20\d{2}$/.test(normalizedYear)) {
    return parseInt(normalizedYear, 10) + 543;
  }
  return null;
}

/** ฟังก์ชันแสดงข้อความป้ายกำกับปี พ.ศ. ที่สวยงาม */
export function formatPublicationYearLabel(year: string, locale: string = "th"): string {
  if (year === "ไม่ระบุปี" || year === "OTHER") {
    return locale === "th" ? "ไม่ระบุปี" : "Unspecified";
  }
  if (/^25\d{2}$/.test(year)) {
    return `พ.ศ. ${year}`;
  }
  if (/^20\d{2}$/.test(year)) {
    const be = parseInt(year, 10) + 543;
    return `พ.ศ. ${be} (${year})`;
  }
  return year;
}

export function getPersonnelCardContact(person: PersonnelItem, locale: string) {
  // 1. Phone number
  let phone = person.phoneNumber?.trim() || "";
  if (!phone && person.contactInfo) {
    const match = person.contactInfo.match(/โทร[.\s:]*([0-9-—–\s,]+)/);
    if (match && match[1]) {
      phone = match[1].trim();
    }
  }
  if (!phone) {
    phone = locale === "th" ? "035-248-000 ต่อ 8323" : "+66 3524 8000 ext. 8323";
  }

  // 2. Office location / Workplace
  let office = person.officeLocation?.trim() || "";
  if (!office && person.contactInfo) {
    const match = person.contactInfo.match(/สถานที่ทำงาน:\s*([^|]+)/);
    if (match && match[1]) {
      office = match[1].trim();
    } else {
      office = person.contactInfo.split("|")[0].trim();
    }
  }
  if (!office) {
    office = person.department?.nameTh
      ? `${person.department.nameTh} คณะพุทธศาสตร์`
      : (locale === "th" ? "คณะพุทธศาสตร์ มจร วังน้อย" : "Faculty of Buddhism, MCU Wang Noi");
  }

  return { phone, office };
}

export function PortalPersonnelClient({
  items,
  locale,
  initialDept,
  initialView,
  publicationYearsLimit = 5,
}: Props) {
  // Navigation & View Mode
  const [viewMode, setViewMode] = useState<"directory" | "research">(
    initialView === "research" ? "research" : "directory"
  );

  // Directory Filters
  const computedInitialDept = useMemo(() => {
    if (!initialDept) return "ALL";
    if (initialDept.toLowerCase().includes("buddhism") || initialDept.includes("พระพุทธศาสนา")) {
      return "ภาควิชาพระพุทธศาสนา";
    }
    return initialDept;
  }, [initialDept]);

  // Selection & Modal State
  const [selectedPerson, setSelectedPerson] = useState<PersonnelItem | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<"research" | "education" | "experience" | "contact">("research");
  const [modalYearFilter, setModalYearFilter] = useState<string>("ALL");
  const [modalPubSearch, setModalPubSearch] = useState("");

  // Directory Filters
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>(computedInitialDept);

  // Research View Filters
  const [researchSearch, setResearchSearch] = useState("");
  const [selectedResearchYear, setSelectedResearchYear] = useState<string>("ALL");
  const [selectedResearchDept, setSelectedResearchDept] = useState<string>("ALL");
  const [selectedResearchType, setSelectedResearchType] = useState<string>("ALL");

  // Get unique departments sorted with ภาควิชาพระพุทธศาสนา first
  const departments = useMemo(() => {
    const hasExecutives = items.some((i) => i.type !== "SPECIAL" && (!i.department || !i.department.nameTh));
    const set = new Set(items.map((i) => i.department?.nameTh).filter(Boolean) as string[]);
    if (hasExecutives) {
      set.add("คณะผู้บริหารคณะพุทธศาสตร์");
    }
    const list = Array.from(set);
    const getDeptPriority = (d: string) => {
      if (d.includes("ผู้บริหาร") || d.includes("สำนักงานคณบดี")) return 1;
      if (d.includes("พระพุทธศาสนา")) return 2;
      if (d.includes("ศาสนา") || d.includes("ปรัชญา")) return 3;
      if (d.includes("บาลี") || d.includes("สันสกฤต")) return 4;
      return 5;
    };
    list.sort((a, b) => {
      const pA = getDeptPriority(a);
      const pB = getDeptPriority(b);
      if (pA !== pB) return pA - pB;
      return a.localeCompare(b, "th");
    });
    return list;
  }, [items]);

  // All raw publications across all teachers with author reference
  const allRawFacultyPublications = useMemo(() => {
    const list: Array<ResearchPub & { personnel: PersonnelItem; normalizedYear: string; beYearNum: number | null }> = [];
    items.forEach((person) => {
      person.researchPublications?.forEach((pub) => {
        const normalizedYear = normalizePublicationYear(pub.publicationYear);
        list.push({
          ...pub,
          personnel: person,
          normalizedYear,
          beYearNum: parseBeYearNumber(normalizedYear),
        });
      });
    });
    return list;
  }, [items]);

  // Latest BE Year and cutoff year based on admin setting (publicationYearsLimit)
  const { latestBeYear, minAllowedBeYear } = useMemo(() => {
    const validNums = allRawFacultyPublications
      .map((p) => p.beYearNum)
      .filter((n): n is number => n !== null);
    const latest = validNums.length > 0 ? Math.max(...validNums) : new Date().getFullYear() + 543;
    const minYear =
      publicationYearsLimit && publicationYearsLimit > 0
        ? latest - publicationYearsLimit + 1
        : null;
    return { latestBeYear: latest, minAllowedBeYear: minYear };
  }, [allRawFacultyPublications, publicationYearsLimit]);

  // All combined publications filtered by configured year limit
  const allFacultyPublications = useMemo(() => {
    if (minAllowedBeYear === null) return allRawFacultyPublications;
    return allRawFacultyPublications.filter(
      (p) => p.beYearNum !== null && p.beYearNum >= minAllowedBeYear
    );
  }, [allRawFacultyPublications, minAllowedBeYear]);

  // All unique publication years across the faculty (respecting year limit)
  const availableYears = useMemo(() => {
    const set = new Set<string>();
    allFacultyPublications.forEach((p) => {
      set.add(p.normalizedYear);
    });
    if (minAllowedBeYear !== null) {
      for (let y = latestBeYear; y >= minAllowedBeYear; y--) {
        set.add(String(y));
      }
    }
    return Array.from(set).sort((a, b) => {
      if (a === "ไม่ระบุปี") return 1;
      if (b === "ไม่ระบุปี") return -1;
      return b.localeCompare(a); // latest year first
    });
  }, [allFacultyPublications, minAllowedBeYear, latestBeYear]);

  // Statistics for Research Portfolio
  const researchStats = useMemo(() => {
    const totalCount = allFacultyPublications.length;
    const authorSet = new Set(allFacultyPublications.map((p) => p.personnel.id));
    const tciCount = allFacultyPublications.filter((p) => p.tier && p.tier.includes("TCI")).length;
    const validYears = availableYears.filter((y) => y !== "ไม่ระบุปี");
    const latestYear = validYears.length > 0 ? validYears[0] : "-";
    const oldestYear = validYears.length > 0 ? validYears[validYears.length - 1] : "-";

    return {
      totalCount,
      authorsCount: authorSet.size,
      tciCount,
      yearRange: validYears.length > 1 ? `พ.ศ. ${oldestYear} – ${latestYear}` : validYears.length === 1 ? `พ.ศ. ${latestYear}` : "-",
    };
  }, [allFacultyPublications, availableYears]);

  // Filter Directory items
  const filteredPersonnel = useMemo(() => {
    return items
      .filter((person) => {
        const fullNameTh = `${person.firstNameTh} ${person.lastNameTh}`.toLowerCase();
        const fullNameEn = `${person.firstNameEn || ""} ${person.lastNameEn || ""}`.toLowerCase();
        const pos = (person.positionTh || "").toLowerCase();
        const q = search.toLowerCase().trim();

        const matchesSearch = !q || fullNameTh.includes(q) || fullNameEn.includes(q) || pos.includes(q);
        const matchesDept =
          selectedDept === "ALL" ||
          (selectedDept === "อาจารย์พิเศษและผู้ทรงคุณวุฒิ"
            ? person.type === "SPECIAL"
            : (selectedDept === "คณะผู้บริหารคณะพุทธศาสตร์" || selectedDept.includes("ผู้บริหาร") || selectedDept.includes("สำนักงานคณบดี"))
              ? person.type !== "SPECIAL" && (!person.department || !person.department.nameTh)
              : person.type !== "SPECIAL" && person.department?.nameTh === selectedDept);

        return matchesSearch && matchesDept;
      })
      .sort((a, b) => {
        const orderDiff = (a.orderIndex ?? 0) - (b.orderIndex ?? 0);
        if (orderDiff !== 0) return orderDiff;
        return a.firstNameTh.localeCompare(b.firstNameTh, "th");
      });
  }, [items, search, selectedDept]);

  // Group directory by department (ภาควิชาพระพุทธศาสนา is sorted to the very top!)
  const groupedPersonnel = useMemo(() => {
    const raw = filteredPersonnel.reduce((acc, item) => {
      const dept =
        item.type === "SPECIAL"
          ? "อาจารย์พิเศษและผู้ทรงคุณวุฒิ"
          : item.department?.nameTh || "คณะผู้บริหารคณะพุทธศาสตร์";
      if (!acc[dept]) acc[dept] = [];
      acc[dept].push(item);
      return acc;
    }, {} as Record<string, PersonnelItem[]>);

    // เรียงลำดับอาจารย์ภายในแต่ละภาควิชาตาม orderIndex อย่างเคร่งครัด
    Object.values(raw).forEach((list) => {
      list.sort((a, b) => {
        const orderDiff = (a.orderIndex ?? 0) - (b.orderIndex ?? 0);
        if (orderDiff !== 0) return orderDiff;
        return a.firstNameTh.localeCompare(b.firstNameTh, "th");
      });
    });

    const getDeptPriority = (d: string) => {
      if (d.includes("ผู้บริหาร") || d.includes("สำนักงานคณบดี")) return 1;
      if (d.includes("พระพุทธศาสนา")) return 2;
      if (d.includes("ศาสนา") || d.includes("ปรัชญา")) return 3;
      if (d.includes("บาลี") || d.includes("สันสกฤต")) return 4;
      if (d.includes("อาจารย์พิเศษ")) return 5;
      return 6;
    };

    // เรียงลำดับ: ภาควิชาพระพุทธศาสนา ขึ้นก่อนเสมอ -> ภาควิชาศาสนาและปรัชญา -> ภาควิชาบาลีและสันสกฤต -> สำนักงานคณบดี -> อาจารย์พิเศษ
    const sorted = Object.entries(raw).sort(([a], [b]) => {
      const pA = getDeptPriority(a);
      const pB = getDeptPriority(b);
      if (pA !== pB) return pA - pB;
      return a.localeCompare(b, "th");
    });

    return Object.fromEntries(sorted);
  }, [filteredPersonnel]);

  // Counts by department (exclude "พระพุทธศาสนา" from philosophyCount so it doesn't double-count "ศาสนา")
  const buddhismCount = useMemo(() => {
    return items.filter((p) => p.type !== "SPECIAL" && p.department?.nameTh?.includes("พระพุทธศาสนา")).length;
  }, [items]);

  const philosophyCount = useMemo(() => {
    return items.filter(
      (p) =>
        p.type !== "SPECIAL" &&
        !p.department?.nameTh?.includes("พระพุทธศาสนา") &&
        (p.department?.nameTh?.includes("ปรัชญา") || p.department?.nameTh?.includes("ศาสนา"))
    ).length;
  }, [items]);

  const paliSanskritCount = useMemo(() => {
    return items.filter(
      (p) => p.type !== "SPECIAL" && (p.department?.nameTh?.includes("บาลี") || p.department?.nameTh?.includes("สันสกฤต"))
    ).length;
  }, [items]);

  const execCount = useMemo(() => {
    return items.filter((p) => p.type !== "SPECIAL" && (!p.department || !p.department.nameTh)).length;
  }, [items]);

  const specialCount = useMemo(() => {
    return items.filter((p) => p.type === "SPECIAL").length;
  }, [items]);

  // Filter Research Publications in "Research by Year" view
  const filteredResearchPublications = useMemo(() => {
    return allFacultyPublications.filter((pub) => {
      const q = researchSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        pub.titleTh.toLowerCase().includes(q) ||
        (pub.titleEn && pub.titleEn.toLowerCase().includes(q)) ||
        pub.authors.toLowerCase().includes(q) ||
        pub.journalName.toLowerCase().includes(q) ||
        `${pub.personnel.firstNameTh} ${pub.personnel.lastNameTh}`.toLowerCase().includes(q);

      const matchesYear = selectedResearchYear === "ALL" || pub.normalizedYear === selectedResearchYear;
      const matchesDept = selectedResearchDept === "ALL" || pub.personnel.department?.nameTh === selectedResearchDept;
      const matchesType = selectedResearchType === "ALL" || pub.type === selectedResearchType;

      return matchesSearch && matchesYear && matchesDept && matchesType;
    });
  }, [allFacultyPublications, researchSearch, selectedResearchYear, selectedResearchDept, selectedResearchType]);

  // Group Research Publications by Normalized Year (for display in Research View)
  const groupedResearchByYear = useMemo(() => {
    const map = new Map<string, typeof filteredResearchPublications>();
    filteredResearchPublications.forEach((pub) => {
      const y = pub.normalizedYear;
      if (!map.has(y)) {
        map.set(y, []);
      }
      map.get(y)!.push(pub);
    });

    // Sort years descending
    const sortedKeys = Array.from(map.keys()).sort((a, b) => {
      if (a === "ไม่ระบุปี") return 1;
      if (b === "ไม่ระบุปี") return -1;
      return b.localeCompare(a);
    });

    const result: Array<{ year: string; label: string; publications: typeof filteredResearchPublications }> = [];
    sortedKeys.forEach((key) => {
      result.push({
        year: key,
        label: formatPublicationYearLabel(key, locale),
        publications: map.get(key)!,
      });
    });
    return result;
  }, [filteredResearchPublications, locale]);

  // Years list for the currently selected person inside Modal
  const selectedPersonYears = useMemo(() => {
    if (!selectedPerson?.researchPublications) return [];
    const set = new Set<string>();
    selectedPerson.researchPublications.forEach((p) => {
      const normY = normalizePublicationYear(p.publicationYear);
      const yNum = parseBeYearNumber(normY);
      if (minAllowedBeYear === null || (yNum !== null && yNum >= minAllowedBeYear)) {
        set.add(normY);
      }
    });
    return Array.from(set).sort((a, b) => {
      if (a === "ไม่ระบุปี") return 1;
      if (b === "ไม่ระบุปี") return -1;
      return b.localeCompare(a);
    });
  }, [selectedPerson, minAllowedBeYear]);

  // Grouped publications for the selected person inside Modal
  const selectedPersonGroupedByYear = useMemo(() => {
    if (!selectedPerson?.researchPublications) return [];
    const q = modalPubSearch.toLowerCase().trim();

    const filtered = selectedPerson.researchPublications.filter((pub) => {
      const normY = normalizePublicationYear(pub.publicationYear);
      const yNum = parseBeYearNumber(normY);
      if (minAllowedBeYear !== null && (yNum === null || yNum < minAllowedBeYear)) {
        return false;
      }
      const matchesYear = modalYearFilter === "ALL" || normY === modalYearFilter;
      const matchesSearch =
        !q ||
        pub.titleTh.toLowerCase().includes(q) ||
        (pub.titleEn && pub.titleEn.toLowerCase().includes(q)) ||
        pub.journalName.toLowerCase().includes(q);
      return matchesYear && matchesSearch;
    });

    const map = new Map<string, ResearchPub[]>();
    filtered.forEach((pub) => {
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
  }, [selectedPerson, modalYearFilter, modalPubSearch, locale, minAllowedBeYear]);

  const openDetail = (person: PersonnelItem, initialTab: "research" | "education" = "research", targetYear: string = "ALL") => {
    setSelectedPerson(person);
    setModalYearFilter(targetYear);
    setModalPubSearch("");
    if (initialTab === "research" && (!person.researchPublications || person.researchPublications.length === 0)) {
      setActiveModalTab("education");
    } else {
      setActiveModalTab(initialTab);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Main View Switcher: ทำเนียบคณาจารย์ VS ผลงานวิจัย & วิชาการแยกตามปี */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-2 rounded-2xl bg-muted/60 border border-border/80">
        <div className="flex items-center gap-2 p-1 bg-background/80 rounded-xl shadow-xs">
          <button
            type="button"
            onClick={() => setViewMode("directory")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === "directory"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{locale === "th" ? "ทำเนียบคณาจารย์และบุคลากร" : "Faculty Directory"}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
              {items.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("research")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === "research"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-300" />
            <span>{locale === "th" ? "ผลงานวิจัย & วิชาการแยกตามปี" : "Research Publications by Year"}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px]">
              {allFacultyPublications.length} เรื่อง
            </span>
          </button>

          <Link
            href="/portal/executives"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all"
          >
            <Award className="w-4 h-4 text-amber-500" />
            <span>{locale === "th" ? "ทำเนียบผู้บริหาร" : "Executive Board"}</span>
          </Link>
        </div>

        <div className="flex items-center gap-3 px-3 text-xs text-muted-foreground">
          <span className="hidden lg:inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            {locale === "th" ? "ปรับปรุงข้อมูลล่าสุด คณะพุทธศาสตร์" : "Faculty of Buddhism Academic Repository"}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW MODE 1: ทำเนียบคณาจารย์และบุคลากร (DIRECTORY VIEW)                    */}
      {/* ========================================================================= */}
      {viewMode === "directory" && (
        <div className="space-y-8">
          {/* Executive Directory Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/25 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span>{locale === "th" ? "ทำเนียบผู้บริหารคณะพุทธศาสตร์" : "Executive Leadership Directory"}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold uppercase tracking-wider">
                    {locale === "th" ? "หน้าเฉพาะ" : "Dedicated Page"}
                  </span>
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {locale === "th"
                    ? "โครงสร้างการบริหาร คณบดี รองคณบดี หัวหน้าภาควิชา ผู้อำนวยการหลักสูตร และสำนักงานคณบดี แยกเป็นหน้าเฉพาะแล้ว"
                    : "Dean, Associate Deans, Department Heads, Program Directors, and Dean's Office are on the dedicated Executive page."}
                </p>
              </div>
            </div>
            <Link
              href="/portal/executives"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition-all shrink-0 shadow-sm hover:shadow-md cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>{locale === "th" ? "ไปยังหน้าทำเนียบผู้บริหาร" : "Go to Executives Directory"}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Search and Filters Bar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-card border shadow-xs space-y-4">
            {/* Top row: Search input + Department Dropdown */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={locale === "th" ? "ค้นหาชื่ออาจารย์, ตำแหน่ง, สาขาวิชา..." : "Search faculty name, title..."}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              {/* Department Dropdown Selector */}
              <div className="sm:w-72 relative">
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                  aria-label="เลือกกรองตามภาควิชา"
                >
                  <option value="ALL">🏛️ ทุกภาควิชา / สังกัดทั้งหมด ({items.length} ท่าน)</option>
                  {execCount > 0 && (
                    <option value="คณะผู้บริหารคณะพุทธศาสตร์">🏛️ คณะผู้บริหารคณะพุทธศาสตร์ ({execCount} ท่าน)</option>
                  )}
                  <option value="ภาควิชาพระพุทธศาสนา">🪷 ภาควิชาพระพุทธศาสนา ({buddhismCount} ท่าน)</option>
                  <option value="ภาควิชาศาสนาและปรัชญา">📜 ภาควิชาศาสนาและปรัชญา ({philosophyCount} ท่าน)</option>
                  {paliSanskritCount > 0 && (
                    <option value="ภาควิชาบาลีและสันสกฤต">📖 ภาควิชาบาลีและสันสกฤต ({paliSanskritCount} ท่าน)</option>
                  )}
                  {specialCount > 0 && (
                    <option value="อาจารย์พิเศษและผู้ทรงคุณวุฒิ">🎓 อาจารย์พิเศษและผู้ทรงคุณวุฒิ ({specialCount} ท่าน)</option>
                  )}
                </select>
              </div>
            </div>

            {/* Bottom row: Quick Filter Badges / Pills */}
            <div className="pt-2 border-t border-border/50 flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 shrink-0">
                <Filter className="w-3.5 h-3.5 text-primary" />
                <span>ตัวกรองภาควิชา:</span>
              </span>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full scrollbar-thin">
                <button
                  type="button"
                  onClick={() => setSelectedDept("ALL")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedDept === "ALL"
                      ? "bg-primary text-primary-foreground shadow-xs ring-2 ring-primary/30"
                      : "bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  ทุกสังกัด ({items.length})
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDept("ภาควิชาพระพุทธศาสนา")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedDept === "ภาควิชาพระพุทธศาสนา"
                      ? "bg-amber-500 text-white shadow-md ring-2 ring-amber-400/50"
                      : "bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/20"
                  }`}
                >
                  <span>🪷 ภาควิชาพระพุทธศาสนา</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      selectedDept === "ภาควิชาพระพุทธศาสนา"
                        ? "bg-white/30 text-white"
                        : "bg-amber-500/20 text-amber-800 dark:text-amber-300"
                    }`}
                  >
                    {buddhismCount} ท่าน
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDept("ภาควิชาศาสนาและปรัชญา")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedDept === "ภาควิชาศาสนาและปรัชญา"
                      ? "bg-primary text-primary-foreground shadow-xs ring-2 ring-primary/30"
                      : "bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span>📜 ภาควิชาศาสนาและปรัชญา</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-muted-foreground/15 text-[10px]">
                    {philosophyCount} ท่าน
                  </span>
                </button>

                {execCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedDept("คณะผู้บริหารคณะพุทธศาสตร์")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedDept === "คณะผู้บริหารคณะพุทธศาสตร์"
                        ? "bg-primary text-primary-foreground shadow-xs ring-2 ring-primary/30"
                        : "bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <span>🏛️ คณะผู้บริหาร</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-muted-foreground/15 text-[10px]">
                      {execCount} ท่าน
                    </span>
                  </button>
                )}

                <Link
                  href="/portal/executives"
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/20"
                >
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <span>{locale === "th" ? "เปิดหน้าทำเนียบผู้บริหารเฉพาะ" : "Open Executives Page"}</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </Link>

                {paliSanskritCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedDept("ภาควิชาบาลีและสันสกฤต")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedDept === "ภาควิชาบาลีและสันสกฤต"
                        ? "bg-primary text-primary-foreground shadow-xs ring-2 ring-primary/30"
                        : "bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <span>📖 ภาควิชาบาลีและสันสกฤต</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-muted-foreground/15 text-[10px]">
                      {paliSanskritCount} ท่าน
                    </span>
                  </button>
                )}

                {specialCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedDept("อาจารย์พิเศษและผู้ทรงคุณวุฒิ")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedDept === "อาจารย์พิเศษและผู้ทรงคุณวุฒิ"
                        ? "bg-primary text-primary-foreground shadow-xs ring-2 ring-primary/30"
                        : "bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <span>🎓 อาจารย์พิเศษและผู้ทรงคุณวุฒิ</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-muted-foreground/15 text-[10px]">
                      {specialCount} ท่าน
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Research Year Strip ("เลือกดูผลงาน") right on the Directory view */}
            {availableYears.length > 0 && (
              <div className="pt-2 border-t border-border/50 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  <span>
                    เลือกดูผลงาน
                    {minAllowedBeYear !== null
                      ? ` (${publicationYearsLimit} ปี • พ.ศ. ${latestBeYear}–${minAllowedBeYear})`
                      : " (แยกตามปี พ.ศ.)"}
                    :
                  </span>
                </span>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 w-full scrollbar-thin">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedResearchYear("ALL");
                      setViewMode("research");
                    }}
                    className="px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 hover:bg-amber-500/20"
                  >
                    ทุกปี ({allFacultyPublications.length})
                  </button>
                  {availableYears.map((yearKey) => {
                    const count = allFacultyPublications.filter((p) => p.normalizedYear === yearKey).length;
                    const label = formatPublicationYearLabel(yearKey, locale);
                    return (
                      <button
                        key={yearKey}
                        type="button"
                        onClick={() => {
                          setSelectedResearchYear(yearKey);
                          setViewMode("research");
                        }}
                        className="px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer bg-muted/70 text-muted-foreground hover:bg-primary hover:text-primary-foreground flex items-center gap-1"
                      >
                        <span>{label}</span>
                        <span className="text-[10px] opacity-80">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Personnel Grid by Department */}
          <div className="space-y-12">
            {Object.entries(groupedPersonnel).map(([deptName, personnelList]) => (
              <section key={deptName} className="space-y-6">
                <div className="flex items-center justify-between border-b pb-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                    <span>{deptName}</span>
                    <span className="text-xs font-normal text-muted-foreground ml-1">({personnelList.length} ท่าน)</span>
                  </h2>

                  {deptName.includes("พระพุทธศาสนา") && (
                    <Link
                      href="/portal/departments/buddhism"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold text-xs transition-colors border border-amber-500/20 shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>เข้าสู่หน้าเว็บเฉพาะภาควิชาพระพุทธศาสนา</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  )}

                  {(deptName.includes("บาลี") || deptName.includes("สันสกฤต")) && (
                    <Link
                      href="/portal/departments/pali"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-xs transition-colors border border-emerald-500/20 shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                      <span>เข้าสู่หน้าเว็บเฉพาะภาควิชาบาลีและสันสกฤต</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  )}

                  {(deptName.includes("ศาสนา") || deptName.includes("ปรัชญา")) && (
                    <Link
                      href="/portal/departments/philosophy"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-bold text-xs transition-colors border border-indigo-500/20 shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      <span>เข้าสู่หน้าเว็บเฉพาะภาควิชาศาสนาและปรัชญา</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  )}

                  {(deptName.includes("ผู้บริหาร") || deptName.includes("สำนักงานคณบดี")) && (
                    <Link
                      href="/portal/executives"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold text-xs transition-colors border border-amber-500/20 shadow-xs"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      <span>เข้าสู่หน้าทำเนียบผู้บริหารฉบับเต็ม</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {personnelList.map((person) => {
                    const pubCount = person.researchPublications?.length ?? 0;
                    return (
                      <div
                        key={person.id}
                        className="group/card relative flex flex-col justify-between rounded-2xl border bg-card hover:shadow-xl hover:border-primary/40 transition-all duration-300"
                      >
                        <div>
                          {/* Photo / Avatar */}
                          <Link
                            href={`/portal/personnel/${person.id}`}
                            className="block relative aspect-[3/4] w-full bg-gradient-to-br from-amber-500/10 via-muted to-muted/40 rounded-t-2xl overflow-hidden cursor-pointer"
                          >
                            {person.imageUrl ? (
                              <Image
                                src={person.imageUrl}
                                alt={`${person.firstNameTh} ${person.lastNameTh}`}
                                fill
                                unoptimized
                                className="object-cover object-top transition-transform duration-500 group-hover/card:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/40 gap-2">
                                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                  <GraduationCap className="h-10 w-10" />
                                </div>
                                <span className="text-xs font-medium text-muted-foreground/70">คณาจารย์ประจำคณะพุทธศาสตร์</span>
                              </div>
                            )}

                            {/* Top Badges */}
                            <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-background/90 backdrop-blur-md text-foreground text-[11px] font-semibold shadow-xs">
                                <Briefcase className="h-3 w-3 text-primary" />
                                {person.type === "EXECUTIVE" ? "ผู้บริหาร" : person.type === "ACADEMIC" ? "อาจารย์ประจำ" : person.type === "SPECIAL" ? "อาจารย์พิเศษ" : "สายสนับสนุน"}
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
                              <Link href={`/portal/personnel/${person.id}`}>
                                <h3 className="text-lg font-bold text-foreground group-hover/card:text-primary transition-colors cursor-pointer">
                                  {formatPersonnelName(person)}
                                </h3>
                              </Link>
                              {(person.academicPositionEn || person.firstNameEn || person.lastNameEn) && (
                                <p className="text-xs text-muted-foreground font-medium">
                                  {[person.academicPositionEn, person.firstNameEn, person.lastNameEn].filter(Boolean).join(" ")}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                                {person.positionTh}
                              </p>
                            </div>

                            {/* Contact details: Phone and Workplace (Replacing Education & Email) */}
                            {(() => {
                              const contact = getPersonnelCardContact(person, locale);
                              return (
                                <div className="pt-2.5 border-t border-border/60 space-y-2 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-2 truncate">
                                    <Phone className="h-3.5 w-3.5 shrink-0 text-primary/80" />
                                    <span className="font-semibold text-foreground shrink-0">
                                      {locale === "th" ? "เบอร์ติดต่อ:" : "Tel:"}
                                    </span>
                                    <span className="truncate">{contact.phone}</span>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-500 mt-0.5" />
                                    <div className="line-clamp-2 leading-relaxed">
                                      <span className="font-semibold text-foreground">
                                        {locale === "th" ? "สถานที่ทำงาน: " : "Office: "}
                                      </span>
                                      <span>{contact.office}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Action Buttons with Profile Link & Export Dropdown */}
                        <div className="p-5 pt-0 space-y-2">
                          <div className="flex items-center gap-2">
                            <Button
                              asChild
                              variant="default"
                              size="sm"
                              className="flex-1 gap-1.5 text-xs font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer"
                            >
                              <Link href={`/portal/personnel/${person.id}`}>
                                <BookOpen className="h-3.5 w-3.5" />
                                <span>{locale === "th" ? "ดูประวัติหน้าเต็ม" : "View Profile"}</span>
                                {pubCount > 0 && (
                                  <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                                    {pubCount}
                                  </span>
                                )}
                              </Link>
                            </Button>

                            <div className="relative group/export shrink-0">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-xl px-2.5 text-xs gap-1 cursor-pointer bg-card hover:bg-muted font-medium border-border/80 shadow-xs"
                                title="ส่งออกเอกสารประวัติอาจารย์ (Export CV / Portfolio)"
                              >
                                <Download className="w-3.5 h-3.5 text-primary" />
                                <span>Export ▾</span>
                              </Button>
                              <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover/export:flex flex-col bg-popover text-popover-foreground border border-border rounded-xl shadow-2xl z-50 py-1.5 min-w-[240px] before:content-[''] before:absolute before:inset-x-0 before:-bottom-3 before:h-3">
                                <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/60">
                                  ตัวเลือกการส่งออกเอกสาร
                                </div>
                                <button
                                  type="button"
                                  onClick={() => exportPersonnelDoc(person, "one-page")}
                                  className="px-3 py-2 text-xs text-left hover:bg-muted transition-colors flex items-center gap-2.5 cursor-pointer"
                                >
                                  <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  <div>
                                    <div className="font-semibold text-foreground">สรุปหน้าเดียว (1-Page CV)</div>
                                    <div className="text-[10px] text-muted-foreground">กระชับ พอดี 1 หน้า A4 (ประวัติ + วิชาหลัก)</div>
                                  </div>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => exportPersonnelDoc(person, "full")}
                                  className="px-3 py-2 text-xs text-left hover:bg-muted transition-colors flex items-center gap-2.5 cursor-pointer"
                                >
                                  <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                                  <div>
                                    <div className="font-semibold text-foreground">รายงานฉบับเต็ม รวมทุกแท็บ</div>
                                    <div className="text-[10px] text-muted-foreground">การศึกษา + วิชาสอน + งานวิจัย + เชี่ยวชาญ</div>
                                  </div>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}

            {filteredPersonnel.length === 0 && (
              <div className="text-center py-16 border rounded-2xl bg-card">
                <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-foreground">ไม่พบข้อมูลบุคลากรตามคำค้นหา</h3>
                <p className="text-xs text-muted-foreground mt-1">กรุณาลองเปลี่ยนคำค้นหาหรือเลือกภาควิชาอื่น</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODE 2: ผลงานวิจัย & วิชาการแยกตามปี (RESEARCH BY YEAR SHOWCASE)       */}
      {/* ========================================================================= */}
      {viewMode === "research" && (
        <div className="space-y-8 animate-in fade-in-50 duration-300">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-card border shadow-xs space-y-1">
              <div className="flex items-center gap-2 text-primary text-xs font-semibold">
                <BookOpen className="w-4 h-4" />
                <span>ผลงานวิจัยทั้งหมด</span>
              </div>
              <p className="text-2xl font-extrabold text-foreground">{researchStats.totalCount} <span className="text-xs font-normal text-muted-foreground">เรื่อง</span></p>
              <p className="text-[11px] text-muted-foreground">จากคณาจารย์ทุกภาควิชา</p>
            </div>

            <div className="p-4 rounded-2xl bg-card border shadow-xs space-y-1">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                <Calendar className="w-4 h-4" />
                <span>ช่วงปีที่เผยแพร่</span>
              </div>
              <p className="text-lg sm:text-xl font-extrabold text-foreground">{researchStats.yearRange}</p>
              <p className="text-[11px] text-muted-foreground">{availableYears.length} ปีการศึกษา</p>
            </div>

            <div className="p-4 rounded-2xl bg-card border shadow-xs space-y-1">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                <Users className="w-4 h-4" />
                <span>คณาจารย์ผู้วิจัย</span>
              </div>
              <p className="text-2xl font-extrabold text-foreground">{researchStats.authorsCount} <span className="text-xs font-normal text-muted-foreground">ท่าน</span></p>
              <p className="text-[11px] text-muted-foreground">ผู้ผลิตผลงานทางวิชาการ</p>
            </div>

            <div className="p-4 rounded-2xl bg-card border shadow-xs space-y-1">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
                <Award className="w-4 h-4" />
                <span>วารสาร TCI / ระดับชาติ</span>
              </div>
              <p className="text-2xl font-extrabold text-foreground">{researchStats.tciCount} <span className="text-xs font-normal text-muted-foreground">เรื่อง</span></p>
              <p className="text-[11px] text-muted-foreground">ได้รับการรับรองมาตรฐาน</p>
            </div>
          </div>

          {/* Interactive Year Selector Bar (แยกปีให้เห็นเด่นชัดตามที่ผู้ใช้ร้องขอ) */}
          <div className="p-4 rounded-2xl bg-card border shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Calendar className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">เลือกดูผลงานวิจัยจำแนกตามปี พ.ศ.</h3>
                {minAllowedBeYear !== null && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/20 text-[11px] font-bold">
                    แสดงย้อนหลัง {publicationYearsLimit} ปี (พ.ศ. {latestBeYear} – {minAllowedBeYear})
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                แสดงผลงาน {filteredResearchPublications.length} จากทั้งหมด {allFacultyPublications.length} เรื่อง
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
                  {allFacultyPublications.length}
                </span>
              </button>

              {availableYears.map((yearKey) => {
                const count = allFacultyPublications.filter((p) => p.normalizedYear === yearKey).length;
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

          {/* Additional Filter & Search Row */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between p-3 rounded-xl bg-muted/40 border">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={researchSearch}
                onChange={(e) => setResearchSearch(e.target.value)}
                placeholder="ค้นหาชื่อเรื่องวิจัย, ผู้วิจัย, หรือชื่อวารสาร..."
                className="w-full pl-8 pr-4 py-1.5 text-xs rounded-lg border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-thin text-xs">
              <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              {/* Department selector */}
              <select
                value={selectedResearchDept}
                onChange={(e) => setSelectedResearchDept(e.target.value)}
                aria-label="กรองตามภาควิชา"
                className="px-2.5 py-1.5 rounded-lg border bg-background text-foreground text-xs font-medium cursor-pointer"
              >
                <option value="ALL">ทุกภาควิชา</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              {/* Type selector */}
              <select
                value={selectedResearchType}
                onChange={(e) => setSelectedResearchType(e.target.value)}
                aria-label="กรองตามประเภทผลงาน"
                className="px-2.5 py-1.5 rounded-lg border bg-background text-foreground text-xs font-medium cursor-pointer"
              >
                <option value="ALL">ทุกประเภทผลงาน</option>
                <option value="RESEARCH">งานวิจัย (Research)</option>
                <option value="ACADEMIC">บทความวิชาการ (Academic)</option>
                <option value="DISSERTATION">ดุษฎีนิพนธ์ (Dissertation)</option>
              </select>
            </div>
          </div>

          {/* Grouped Publications Timeline / Year Sections */}
          <div className="space-y-10">
            {groupedResearchByYear.map(({ year, label, publications }) => (
              <section key={year} className="space-y-4">
                {/* Year Header Banner */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-primary/10 via-amber-500/10 to-transparent border border-primary/20">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-xs">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-foreground">
                        ผลงานตีพิมพ์ประจำ {label}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        รวมผลงานวิชาการของคณาจารย์คณะพุทธศาสตร์ที่ได้รับการเผยแพร่ในรอบปี
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-primary/15 text-primary font-bold text-xs">
                    {publications.length} ผลงาน
                  </span>
                </div>

                {/* Publications List Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {publications.map((pub, idx) => (
                    <div
                      key={pub.id}
                      className="group flex flex-col justify-between p-4 rounded-xl border bg-card hover:shadow-md hover:border-primary/40 transition-all space-y-3"
                    >
                      <div className="space-y-2.5">
                        {/* Top Badges */}
                        <div className="flex items-center justify-between gap-2 flex-wrap text-[11px]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[10px]">
                              {idx + 1}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded font-bold ${
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

                        {/* Article Title */}
                        <div>
                          <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors leading-snug">
                            {pub.titleTh}
                          </h3>
                          {pub.titleEn && (
                            <p className="text-xs text-muted-foreground italic font-medium mt-0.5 line-clamp-2">
                              {pub.titleEn}
                            </p>
                          )}
                        </div>

                        {/* Author info with link to modal */}
                        <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-muted/40 border border-border/40">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-primary/10 shrink-0">
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
                                {formatPersonnelName(pub.personnel)}
                              </p>
                              <p className="text-[11px] text-muted-foreground truncate">
                                {pub.personnel.department?.nameTh || "คณะพุทธศาสตร์"}
                              </p>
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-[11px] h-7 px-2 shrink-0 cursor-pointer"
                            onClick={() => openDetail(pub.personnel, "research", pub.normalizedYear)}
                          >
                            ดูประวัติ
                          </Button>
                        </div>

                        {/* Journal Info Details */}
                        <div className="text-xs text-muted-foreground bg-muted/20 p-2 rounded-lg space-y-0.5">
                          <p>
                            <strong className="text-foreground">วารสาร: </strong>
                            <span>{pub.journalName}</span>
                          </p>
                          <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[11px]">
                            {pub.volume && <span>{pub.volume}</span>}
                            {pub.issue && <span>{pub.issue}</span>}
                            {pub.pages && <span>หน้า {pub.pages}</span>}
                            {pub.issn && <span>ISSN: {pub.issn}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
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
              <div className="text-center py-16 border rounded-2xl bg-card space-y-2">
                <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                <h3 className="text-base font-semibold text-foreground">ไม่พบผลงานวิจัยตามเงื่อนไขที่เลือก</h3>
                <p className="text-xs text-muted-foreground">
                  กรุณาลองปรับเปลี่ยนปี พ.ศ. หรือล้างคำค้นหา
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedResearchYear("ALL");
                    setResearchSearch("");
                    setSelectedResearchDept("ALL");
                    setSelectedResearchType("ALL");
                  }}
                  className="mt-2 text-xs cursor-pointer"
                >
                  ล้างตัวกรองทั้งหมด
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MODAL ประวัติและผลงานวิจัยของอาจารย์ (INDIVIDUAL TEACHER DIALOG)          */}
      {/* ========================================================================= */}
      <LiyonDialog open={!!selectedPerson} onOpenChange={(open) => !open && setSelectedPerson(null)}>
        <LiyonDialogCloseButton label="ปิด" />
        {selectedPerson && (
          <>
            <LiyonDialogHeader
              title={formatPersonnelName(selectedPerson)}
              description={
                selectedPerson.firstNameEn && selectedPerson.lastNameEn
                  ? `${selectedPerson.firstNameEn} ${selectedPerson.lastNameEn} • ${selectedPerson.department?.nameTh || "คณะพุทธศาสตร์"}`
                  : selectedPerson.department?.nameTh || "คณะพุทธศาสตร์"
              }
            />
            <LiyonDialogBody>
              <div className="space-y-5 py-1">
                {/* Profile Header Card */}
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
                        {selectedPerson.type === "EXECUTIVE" ? "ผู้บริหาร" : selectedPerson.type === "ACADEMIC" ? "อาจารย์ประจำ" : selectedPerson.type === "SPECIAL" ? "อาจารย์พิเศษ" : "สายสนับสนุน"}
                      </span>
                      {selectedPerson.academicPosition && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400">
                          {selectedPerson.academicPosition}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-foreground">
                      {formatPersonnelName(selectedPerson)}
                    </h3>
                    <p className="text-xs text-muted-foreground">{selectedPerson.positionTh}</p>
                    {selectedPerson.bioTh && (
                      <p className="text-xs text-muted-foreground/90 pt-1 leading-relaxed">{selectedPerson.bioTh}</p>
                    )}
                  </div>
                </div>

                {/* Sub-Tabs Navigation */}
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
                    onClick={() => setActiveModalTab("experience")}
                    className={`pb-2.5 px-3 font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      activeModalTab === "experience"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>ภาระงาน & ประสบการณ์สอน</span>
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

                {/* Tab 1: Research Publications (จัดกลุ่มและกรองแยกเป็นปี พ.ศ. ตามที่ผู้ใช้ต้องการ) */}
                {activeModalTab === "research" && (
                  <div className="space-y-4">
                    {/* Controls inside Teacher Modal: Year Filter & Search */}
                    {selectedPersonYears.length > 0 && (
                      <div className="space-y-2 p-2.5 rounded-xl bg-muted/40 border">
                        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
                          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin text-xs">
                            <span className="text-muted-foreground text-[11px] font-semibold flex items-center gap-1 shrink-0">
                              <Calendar className="w-3.5 h-3.5 text-primary" />
                              <span>เลือกปี:</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setModalYearFilter("ALL")}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                                modalYearFilter === "ALL"
                                  ? "bg-primary text-primary-foreground shadow-xs"
                                  : "bg-background text-muted-foreground hover:bg-muted"
                              }`}
                            >
                              ทั้งหมด ({selectedPerson.researchPublications?.length ?? 0})
                            </button>
                            {selectedPersonYears.map((y) => {
                              const count = selectedPerson.researchPublications?.filter(
                                (p) => normalizePublicationYear(p.publicationYear) === y
                              ).length;
                              return (
                                <button
                                  key={y}
                                  type="button"
                                  onClick={() => setModalYearFilter(y)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                                    modalYearFilter === y
                                      ? "bg-primary text-primary-foreground shadow-xs"
                                      : "bg-background text-muted-foreground hover:bg-muted"
                                  }`}
                                >
                                  {formatPublicationYearLabel(y, locale)} ({count})
                                </button>
                              );
                            })}
                          </div>

                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                            <input
                              type="text"
                              value={modalPubSearch}
                              onChange={(e) => setModalPubSearch(e.target.value)}
                              placeholder="ค้นหาในผลงานอาจารย์..."
                              className="w-full sm:w-44 pl-7 pr-2.5 py-1 text-xs rounded-lg border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Publications List Grouped by Year */}
                    <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                      {selectedPersonGroupedByYear.length > 0 ? (
                        selectedPersonGroupedByYear.map(({ year, label, publications }) => (
                          <div key={year} className="space-y-2.5">
                            {/* Year Divider Header */}
                            <div className="flex items-center gap-2 pt-1 sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-1">
                              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{label}</span>
                              </span>
                              <span className="text-[11px] text-muted-foreground">({publications.length} ผลงาน)</span>
                              <div className="flex-1 h-px bg-border/60" />
                            </div>

                            {/* Publications in this year */}
                            <div className="space-y-2.5">
                              {publications.map((pub, idx) => (
                                <div
                                  key={pub.id}
                                  className="p-3.5 rounded-xl border bg-card hover:bg-muted/30 transition-all space-y-2 text-xs"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[10px]">
                                          {idx + 1}
                                        </span>
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
                                        {pub.tier && (
                                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                            ⭐ {pub.tier}
                                          </span>
                                        )}
                                      </div>
                                      <h4 className="font-bold text-sm text-foreground leading-snug">{pub.titleTh}</h4>
                                      {pub.titleEn && (
                                        <p className="text-xs text-muted-foreground font-medium italic">{pub.titleEn}</p>
                                      )}
                                    </div>
                                  </div>

                                  <p className="text-muted-foreground">
                                    <strong className="text-foreground">ผู้วิจัย/ผู้แต่ง: </strong>
                                    {pub.authors}
                                  </p>

                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground/90 bg-muted/30 p-2 rounded-lg">
                                    <span>
                                      <strong>วารสาร:</strong> {pub.journalName}
                                    </span>
                                    {pub.volume && <span>{pub.volume}</span>}
                                    {pub.issue && <span>{pub.issue}</span>}
                                    {pub.publicationYear && <span>({label})</span>}
                                    {pub.pages && <span>หน้า {pub.pages}</span>}
                                    {pub.issn && <span>ISSN: {pub.issn}</span>}
                                  </div>

                                  {pub.url && (
                                    <div className="pt-1">
                                      <a
                                        href={pub.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs transition-colors"
                                      >
                                        <span>เปิดอ่านบทความบน ThaiJO</span>
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10 text-muted-foreground">
                          <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          <p>
                            {modalPubSearch || modalYearFilter !== "ALL"
                              ? "ไม่พบผลงานวิจัยตามเงื่อนไขที่เลือก"
                              : "ยังไม่มีข้อมูลผลงานวิจัยที่บันทึกไว้ในระบบ"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab 2: Education History */}
                {activeModalTab === "education" && (
                  <div className="p-4 rounded-xl border bg-card space-y-3 text-xs leading-relaxed max-h-[350px] overflow-y-auto scrollbar-thin">
                    <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-primary" />
                      <span>ประวัติการศึกษา</span>
                    </h4>
                    {selectedPerson.educationTh ? (
                      <div className="space-y-2">
                        {selectedPerson.educationTh.split("\n").map((line, idx) => (
                          <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                            <span className="text-foreground">{line}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">ยังไม่มีข้อมูลประวัติการศึกษา</p>
                    )}
                  </div>
                )}

                {/* Tab 3: Experiences & Teaching */}
                {activeModalTab === "experience" && (
                  <div className="p-4 rounded-xl border bg-card space-y-3 text-xs leading-relaxed max-h-[350px] overflow-y-auto scrollbar-thin">
                    <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-primary" />
                      <span>ภาระงานและความรับผิดชอบ / ประสบการณ์สอน</span>
                    </h4>
                    {(() => {
                      const courses = parseTeachingExperiences(selectedPerson.experiencesTh, {
                        id: selectedPerson.id,
                        firstNameTh: selectedPerson.firstNameTh,
                        lastNameTh: selectedPerson.lastNameTh || undefined,
                        departmentName: selectedPerson.department?.nameTh,
                      });
                      if (courses.length > 0) {
                        return (
                          <div className="space-y-2.5">
                            {courses.map((c) => {
                              const style = getDegreeLevelColor(c.level);
                              const langInfo = getCurriculumLanguageInfo(c);
                              return (
                                <div
                                  key={c.id}
                                  className="p-3 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors space-y-1.5"
                                >
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <div className="flex items-center gap-1.5">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${style.bg}`}>
                                        {style.icon} {formatDegreeLevelLabel(c.level)}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground font-semibold">
                                        ปี {c.year} (ภาคเรียนที่ {c.semester})
                                      </span>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${langInfo.badgeClass}`}>
                                      {langInfo.flagIcon} {langInfo.label}
                                    </span>
                                  </div>
                                  <div className="font-bold text-foreground">
                                    <span className="text-muted-foreground font-mono mr-1.5">{c.courseCode}</span>
                                    <span>{c.courseNameTh}</span>
                                    {c.courseNameEn && (
                                      <span className="text-muted-foreground font-normal text-[11px] block italic">{c.courseNameEn}</span>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                                    <span>{c.programTh} ({langInfo.shortLabel})</span>
                                    <span className="font-medium text-primary">{c.role}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      }
                      if (selectedPerson.experiencesTh) {
                        return (
                          <div className="space-y-2">
                            {selectedPerson.experiencesTh.split("\n").map((line, idx) => (
                              <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                                <span className="text-foreground">{line}</span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return <p className="text-muted-foreground">ยังไม่มีข้อมูลประสบการณ์สอน</p>;
                    })()}
                  </div>
                )}

                {/* Tab 4: Contact details */}
                {activeModalTab === "contact" && (
                  <div className="p-4 rounded-xl border bg-card space-y-3 text-xs leading-relaxed">
                    <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-primary" />
                      <span>ข้อมูลการติดต่อ</span>
                    </h4>
                    <div className="space-y-2.5">
                      {selectedPerson.email && (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30">
                          <Mail className="w-4 h-4 text-primary shrink-0" />
                          <div>
                            <span className="text-muted-foreground block text-[10px]">อีเมล:</span>
                            <a href={`mailto:${selectedPerson.email}`} className="text-foreground font-medium hover:underline">
                              {selectedPerson.email}
                            </a>
                          </div>
                        </div>
                      )}
                      {selectedPerson.officeLocation && (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30">
                          <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                          <div>
                            <span className="text-muted-foreground block text-[10px]">สถานที่ทำงาน:</span>
                            <span className="text-foreground font-medium">{selectedPerson.officeLocation}</span>
                          </div>
                        </div>
                      )}
                      {selectedPerson.contactInfo && (
                        <div className="p-2.5 rounded-lg bg-muted/30">
                          <span className="text-muted-foreground block text-[10px] mb-1">ช่องทางติดต่ออื่นๆ:</span>
                          <span className="text-foreground font-medium">{selectedPerson.contactInfo}</span>
                        </div>
                      )}
                      {selectedPerson.googleScholarUrl && (
                        <div className="p-2.5 rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-sky-600 shrink-0" />
                            <span className="text-xs font-bold text-sky-700 dark:text-sky-300">Google Scholar Profile</span>
                          </div>
                          <a
                            href={selectedPerson.googleScholarUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-semibold"
                          >
                            <span>เปิดดู</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
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
