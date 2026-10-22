"use client";

import { useState } from "react";
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
} from "lucide-react";
import {
  LiyonDialog,
  LiyonDialogHeader,
  LiyonDialogBody,
  LiyonDialogFooter,
  LiyonDialogCloseButton,
} from "@/shared/components/liyon";
import { Button } from "@/components/ui/button";

interface ResearchPub {
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

interface PersonnelItem {
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
  researchPublications?: ResearchPub[];
}

interface Props {
  items: PersonnelItem[];
  locale: string;
}

export function PortalPersonnelClient({ items, locale }: Props) {
  const [selectedPerson, setSelectedPerson] = useState<PersonnelItem | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<"research" | "education" | "experience" | "contact">("research");
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>("ALL");

  // Get unique departments
  const departments = Array.from(
    new Set(items.map((i) => i.department?.nameTh).filter(Boolean) as string[])
  );

  // Filter items
  const filtered = items.filter((person) => {
    const fullNameTh = `${person.firstNameTh} ${person.lastNameTh}`.toLowerCase();
    const fullNameEn = `${person.firstNameEn || ""} ${person.lastNameEn || ""}`.toLowerCase();
    const pos = (person.positionTh || "").toLowerCase();
    const q = search.toLowerCase().trim();

    const matchesSearch = !q || fullNameTh.includes(q) || fullNameEn.includes(q) || pos.includes(q);
    const matchesDept = selectedDept === "ALL" || person.department?.nameTh === selectedDept;

    return matchesSearch && matchesDept;
  });

  // Group by department
  const grouped = filtered.reduce((acc, item) => {
    const dept = item.department?.nameTh || "สำนักงานคณบดีและส่วนงานทั่วไป";
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(item);
    return acc;
  }, {} as Record<string, PersonnelItem[]>);

  const openDetail = (person: PersonnelItem, initialTab: "research" | "education" = "research") => {
    setSelectedPerson(person);
    // If person has no research publications, default to education or experience
    if (initialTab === "research" && (!person.researchPublications || person.researchPublications.length === 0)) {
      setActiveModalTab("education");
    } else {
      setActiveModalTab(initialTab);
    }
  };

  return (
    <div className="space-y-8">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-4 rounded-2xl bg-card border shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={locale === "th" ? "ค้นหาชื่ออาจารย์, ตำแหน่ง, สาขาวิชา..." : "Search faculty name, title..."}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
          <button
            type="button"
            onClick={() => setSelectedDept("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedDept === "ALL"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {locale === "th" ? "ทุกภาควิชา" : "All Departments"} ({items.length})
          </button>
          {departments.map((dept) => (
            <button
              key={dept}
              type="button"
              onClick={() => setSelectedDept(dept)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedDept === dept
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {dept} ({items.filter((i) => i.department?.nameTh === dept).length})
            </button>
          ))}
        </div>
      </div>

      {/* Personnel Grid by Department */}
      <div className="space-y-12">
        {Object.entries(grouped).map(([deptName, personnelList]) => (
          <section key={deptName} className="space-y-6">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span>{deptName}</span>
                <span className="text-xs font-normal text-muted-foreground ml-1">({personnelList.length} ท่าน)</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {personnelList.map((person) => {
                const pubCount = person.researchPublications?.length ?? 0;
                return (
                  <div
                    key={person.id}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-card hover:shadow-xl hover:border-primary/40 transition-all duration-300"
                  >
                    <div>
                      {/* Photo / Avatar */}
                      <div className="relative aspect-[4/3] w-full bg-gradient-to-br from-amber-500/10 via-muted to-muted/40 overflow-hidden">
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
                            <span className="text-xs font-medium text-muted-foreground/70">คณาจารย์ประจำคณะพุทธศาสตร์</span>
                          </div>
                        )}

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-background/90 backdrop-blur-md text-foreground text-[11px] font-semibold shadow-xs">
                            <Briefcase className="h-3 w-3 text-primary" />
                            {person.type === "EXECUTIVE" ? "ผู้บริหาร" : person.type === "ACADEMIC" ? "สายวิชาการ" : "สายสนับสนุน"}
                          </span>

                          {pubCount > 0 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500 text-white text-[11px] font-bold shadow-xs">
                              <BookOpen className="h-3 w-3" />
                              <span>{pubCount} ผลงานวิจัย</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 space-y-3">
                        <div>
                          <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                            {person.firstNameTh} {person.lastNameTh}
                          </h3>
                          {person.firstNameEn && (
                            <p className="text-xs text-muted-foreground font-medium">
                              {person.firstNameEn} {person.lastNameEn}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                            {person.positionTh}
                          </p>
                        </div>

                        {/* Education Highlight */}
                        {person.educationTh && (
                          <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 text-xs text-muted-foreground line-clamp-2">
                            <span className="font-semibold text-foreground">วุฒิการศึกษา: </span>
                            {person.educationTh.split("\n")[0]}
                          </div>
                        )}

                        {/* Contact details */}
                        <div className="pt-2 border-t border-border/60 space-y-1.5 text-xs text-muted-foreground">
                          {person.email && (
                            <div className="flex items-center gap-2 truncate">
                              <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                              <a href={`mailto:${person.email}`} className="hover:text-primary transition-colors truncate">
                                {person.email}
                              </a>
                            </div>
                          )}
                          {person.phoneNumber && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                              <a href={`tel:${person.phoneNumber}`} className="hover:text-primary transition-colors">
                                {person.phoneNumber}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="p-5 pt-0 space-y-2">
                      <Button
                        type="button"
                        variant="default"
                        className="w-full gap-2 text-xs font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer"
                        onClick={() => openDetail(person, pubCount > 0 ? "research" : "education")}
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>{locale === "th" ? "ดูประวัติ & ผลงานวิจัย" : "Profile & Research"}</span>
                        {pubCount > 0 && <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">{pubCount}</span>}
                      </Button>

                      <Link
                        href={`/portal/certificates/request?mode=personnel&personnelId=${person.id}`}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-background/80 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>{locale === "th" ? "ขอหนังสือรับรองบุคลากร" : "Request Certificate"}</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16 border rounded-2xl bg-card">
            <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-foreground">ไม่พบข้อมูลบุคลากรตามคำค้นหา</h3>
            <p className="text-xs text-muted-foreground mt-1">กรุณาลองเปลี่ยนคำค้นหาหรือเลือกภาควิชาอื่น</p>
          </div>
        )}
      </div>

      {/* Modal ประวัติและผลงานวิจัยของอาจารย์ */}
      <LiyonDialog open={!!selectedPerson} onOpenChange={(open) => !open && setSelectedPerson(null)}>
        <LiyonDialogCloseButton label="ปิด" />
        {selectedPerson && (
          <>
            <LiyonDialogHeader
              title={`${selectedPerson.firstNameTh} ${selectedPerson.lastNameTh}`}
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
                        {selectedPerson.type === "EXECUTIVE" ? "ผู้บริหาร" : "อาจารย์ประจำสายวิชาการ"}
                      </span>
                      {selectedPerson.academicPosition && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400">
                          {selectedPerson.academicPosition}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-foreground">
                      {selectedPerson.firstNameTh} {selectedPerson.lastNameTh}
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

                {/* Tab 1: Research Publications */}
                {activeModalTab === "research" && (
                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                    {selectedPerson.researchPublications && selectedPerson.researchPublications.length > 0 ? (
                      selectedPerson.researchPublications.map((pub, idx) => (
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
                            {pub.publicationYear && <span>(ปี {pub.publicationYear})</span>}
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
                      ))
                    ) : (
                      <div className="text-center py-10 text-muted-foreground">
                        <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p>ยังไม่มีข้อมูลผลงานวิจัยที่บันทึกไว้ในระบบ</p>
                      </div>
                    )}
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
                    {selectedPerson.experiencesTh ? (
                      <div className="space-y-2">
                        {selectedPerson.experiencesTh.split("\n").map((line, idx) => (
                          <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                            <span className="text-foreground">{line}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">ยังไม่มีข้อมูลประสบการณ์สอน</p>
                    )}
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
                      {selectedPerson.phoneNumber && (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30">
                          <Phone className="w-4 h-4 text-primary shrink-0" />
                          <div>
                            <span className="text-muted-foreground block text-[10px]">เบอร์โทรศัพท์:</span>
                            <a href={`tel:${selectedPerson.phoneNumber}`} className="text-foreground font-medium hover:underline">
                              {selectedPerson.phoneNumber}
                            </a>
                          </div>
                        </div>
                      )}
                      {selectedPerson.contactInfo && (
                        <div className="p-2.5 rounded-lg bg-muted/30">
                          <span className="text-muted-foreground block text-[10px] mb-1">ช่องทางติดต่ออื่นๆ:</span>
                          <span className="text-foreground font-medium">{selectedPerson.contactInfo}</span>
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
              <Button asChild>
                <Link href={`/portal/certificates/request?mode=personnel&personnelId=${selectedPerson.id}`}>
                  ขอหนังสือรับรองอาจารย์ท่านนี้
                </Link>
              </Button>
            </LiyonDialogFooter>
          </>
        )}
      </LiyonDialog>
    </div>
  );
}
