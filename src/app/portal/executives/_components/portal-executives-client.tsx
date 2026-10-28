"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Users,
  Award,
  Mail,
  Phone,
  GraduationCap,
  BookOpen,
  ExternalLink,
  Building2,
  Download,
  FileText,
  ChevronRight,
  Sparkles,
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
  classifyExecutivePersonnel,
  exportPersonnelDoc,
  formatPersonnelName,
  parseTeachingExperiences,
  formatDegreeLevelLabel,
  getDegreeLevelColor,
  type ClassifiedExecutive,
} from "@/features/personnel";
import type { PersonnelItem } from "../../personnel/_components/portal-personnel-client";

interface Props {
  items: PersonnelItem[];
  locale: string;
}

export function PortalExecutivesClient({ items, locale }: Props) {
  const [selectedPerson, setSelectedPerson] = useState<ClassifiedExecutive<PersonnelItem> | null>(
    null
  );

  const classifiedList = useMemo(() => {
    const result: ClassifiedExecutive<PersonnelItem>[] = [];
    for (const item of items) {
      const classified = classifyExecutivePersonnel(item);
      if (classified) {
        result.push(classified);
      }
    }
    return result.sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier;
      if (a.tierOrder !== b.tierOrder) return a.tierOrder - b.tierOrder;
      return (a.person.orderIndex ?? 99) - (b.person.orderIndex ?? 99);
    });
  }, [items]);

  const tier1Deans = useMemo(
    () => classifiedList.filter((item) => item.tier === 1),
    [classifiedList]
  );
  const tier2ViceDeans = useMemo(
    () => classifiedList.filter((item) => item.tier === 2),
    [classifiedList]
  );
  const tier3DeptHeads = useMemo(
    () => classifiedList.filter((item) => item.tier === 3),
    [classifiedList]
  );
  const tier4Others = useMemo(
    () => classifiedList.filter((item) => item.tier === 4),
    [classifiedList]
  );

  const renderExecutiveCard = (
    exec: ClassifiedExecutive<PersonnelItem>,
    featured: boolean = false
  ) => {
    const { person } = exec;
    const displayName = formatPersonnelName(person);
    const displayNameEn =
      person.firstNameEn || person.lastNameEn
        ? [person.academicPositionEn, person.firstNameEn, person.lastNameEn].filter(Boolean).join(" ")
        : null;
    const teachingCourses = parseTeachingExperiences(person.experiencesTh);
    const pubCount = person.researchPublications?.length ?? 0;

    return (
      <div
        key={person.id}
        onClick={() => setSelectedPerson(exec)}
        className={`group relative rounded-2xl border bg-card transition-all duration-200 cursor-pointer overflow-hidden flex flex-col ${
          featured
            ? "max-w-md mx-auto w-full border-amber-500/40 shadow-lg hover:shadow-xl ring-2 ring-amber-500/20"
            : "w-full sm:w-[320px] max-w-sm border-border/80 shadow-xs hover:shadow-md hover:border-primary/40"
        }`}
      >
        {/* Top Accent Banner */}
        <div
          className={`h-2 w-full ${
            exec.tier === 1
              ? "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600"
              : exec.tier === 2
                ? "bg-gradient-to-r from-primary via-amber-500 to-primary"
                : exec.tier === 3
                  ? "bg-gradient-to-r from-emerald-600 to-teal-500"
                  : "bg-gradient-to-r from-sky-600 to-indigo-600"
          }`}
        />

        <div className="p-5 flex flex-col items-center text-center flex-1 space-y-3.5">
          {/* Portrait */}
          <div
            className={`relative rounded-2xl overflow-hidden border-2 bg-muted shrink-0 shadow-sm ${
              featured
                ? "w-36 h-44 border-amber-500/40"
                : "w-28 h-36 border-border group-hover:border-primary/40"
            }`}
          >
            {person.imageUrl ? (
              <Image
                src={person.imageUrl}
                alt={displayName}
                fill
                sizes={featured ? "144px" : "112px"}
                className="object-cover object-top group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                <Users className="w-10 h-10" />
              </div>
            )}
          </div>

          {/* Executive Badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              exec.tier === 1
                ? "bg-amber-500 text-white shadow-xs"
                : exec.tier === 2
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : exec.tier === 3
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                    : "bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20"
            }`}
          >
            <Award className="w-3.5 h-3.5 shrink-0" />
            <span>{locale === "th" ? exec.executiveBadgeTh : exec.executiveBadgeEn}</span>
          </span>

          {/* Full Name & Academic Title */}
          <div className="space-y-1">
            <h3
              className={`font-extrabold text-foreground group-hover:text-primary transition-colors ${
                featured ? "text-lg sm:text-xl" : "text-base"
              }`}
            >
              {displayName}
            </h3>
            {displayNameEn && (
              <p className="text-xs text-muted-foreground font-medium">{displayNameEn}</p>
            )}
            <p className="text-xs text-muted-foreground line-clamp-2 pt-0.5">
              {person.positionTh}
            </p>
          </div>

          {/* Department & Stats Pills */}
          <div className="pt-2 mt-auto w-full border-t border-border/60 flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            {person.department?.nameTh && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted font-medium">
                <Building2 className="w-3 h-3 text-primary" />
                <span>{person.department.nameTh}</span>
              </span>
            )}
            {teachingCourses.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 font-medium">
                <BookOpen className="w-3 h-3" />
                <span>{teachingCourses.length} วิชา</span>
              </span>
            )}
            {pubCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium">
                <FileText className="w-3 h-3" />
                <span>{pubCount} งานวิจัย</span>
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10">
      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-muted/50 border border-border">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-primary text-primary-foreground shadow-sm">
            <Award className="w-4 h-4 text-amber-300" />
            <span>
              {locale === "th"
                ? `ทำเนียบผู้บริหาร (${classifiedList.length} ท่าน)`
                : `Executive Board (${classifiedList.length})`}
            </span>
          </span>

          <Link
            href="/portal/personnel"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-background/60 transition-all"
          >
            <Users className="w-4 h-4" />
            <span>
              {locale === "th"
                ? `ทำเนียบคณาจารย์และบุคลากร (${items.length} ท่าน)`
                : `All Faculty & Personnel (${items.length})`}
            </span>
          </Link>

          <Link
            href="/portal/personnel?view=research"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-background/60 transition-all"
          >
            <BookOpen className="w-4 h-4 text-amber-500" />
            <span>
              {locale === "th" ? "ผลงานวิจัย & วิชาการแยกตามปี" : "Research Publications"}
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2 px-3 text-xs text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>คลิกที่การ์ดผู้บริหารเพื่อดูประวัติและผลงานทางวิชาการ</span>
        </div>
      </div>

      {/* TIER 1: DEAN */}
      {tier1Deans.length > 0 && (
        <section className="space-y-4">
          <div className="text-center space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
              Tier 1 • Dean of the Faculty
            </span>
            <h2 className="text-xl font-extrabold text-foreground">คณบดีคณะพุทธศาสตร์</h2>
          </div>
          <div className="flex justify-center">
            {tier1Deans.map((exec) => renderExecutiveCard(exec, true))}
          </div>
        </section>
      )}

      {/* TIER 2: VICE DEANS */}
      {tier2ViceDeans.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-border/60">
          <div className="text-center space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-primary">
              Tier 2 • Vice Deans
            </span>
            <h2 className="text-xl font-extrabold text-foreground">รองคณบดีคณะพุทธศาสตร์</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-5">
            {tier2ViceDeans.map((exec) => renderExecutiveCard(exec, false))}
          </div>
        </section>
      )}

      {/* TIER 3: DEPARTMENT HEADS */}
      {tier3DeptHeads.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-border/60">
          <div className="text-center space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Tier 3 • Heads of Academic Departments
            </span>
            <h2 className="text-xl font-extrabold text-foreground">
              {locale === "th" ? "หัวหน้าภาควิชาและรองหัวหน้าภาควิชา" : "Heads & Deputy Heads of Academic Departments"}
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-5">
            {tier3DeptHeads.map((exec) => renderExecutiveCard(exec, false))}
          </div>
        </section>
      )}

      {/* TIER 4: PROGRAM DIRECTORS & OFFICE OF THE DEAN */}
      {tier4Others.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-border/60">
          <div className="text-center space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400">
              Tier 4 • Program Directors & Office of the Dean
            </span>
            <h2 className="text-xl font-extrabold text-foreground">
              ผู้อำนวยการหลักสูตรและสำนักงานคณบดี
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-5 max-w-4xl mx-auto">
            {tier4Others.map((exec) => renderExecutiveCard(exec, false))}
          </div>
        </section>
      )}

      {/* EXECUTIVE PROFILE DETAIL DIALOG */}
      <LiyonDialog
        open={Boolean(selectedPerson)}
        onOpenChange={(open) => {
          if (!open) setSelectedPerson(null);
        }}
      >
        {selectedPerson && (
          <div className="max-w-2xl w-full">
            <LiyonDialogHeader
              title={formatPersonnelName(selectedPerson.person)}
              description={
                <span className="text-xs font-bold text-primary">
                  {selectedPerson.executiveBadgeTh}
                </span>
              }
            />
            <LiyonDialogCloseButton label="ปิดหน้าต่าง" />

            <LiyonDialogBody className="space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Top summary */}
              <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start p-4 rounded-xl bg-muted/40 border">
                <div className="relative w-24 h-32 rounded-xl overflow-hidden border bg-muted shrink-0">
                  {selectedPerson.person.imageUrl ? (
                    <Image
                      src={selectedPerson.person.imageUrl}
                      alt={selectedPerson.person.firstNameTh}
                      fill
                      sizes="96px"
                      className="object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                      <Users className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="space-y-1.5 text-center sm:text-left flex-1">
                  <p className="text-sm font-bold text-foreground">
                    {selectedPerson.person.positionTh}
                  </p>
                  {selectedPerson.person.positionEn && (
                    <p className="text-xs text-muted-foreground">
                      {selectedPerson.person.positionEn}
                    </p>
                  )}
                  {selectedPerson.person.department?.nameTh && (
                    <p className="text-xs font-semibold text-primary flex items-center justify-center sm:justify-start gap-1.5 pt-1">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>สังกัด: {selectedPerson.person.department.nameTh}</span>
                    </p>
                  )}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs text-muted-foreground">
                    {selectedPerson.person.email && (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-primary" />
                        <span>{selectedPerson.person.email}</span>
                      </span>
                    )}
                    {selectedPerson.person.phoneNumber && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-primary" />
                        <span>{selectedPerson.person.phoneNumber}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Education */}
              {selectedPerson.person.educationTh && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    <span>ประวัติการศึกษา</span>
                  </h4>
                  <ul className="space-y-1 text-xs text-foreground pl-5 list-disc">
                    {selectedPerson.person.educationTh
                      .split(/\r?\n/)
                      .map((line) => line.trim())
                      .filter(Boolean)
                      .map((line, idx) => (
                        <li key={idx}>{line}</li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Teaching Courses */}
              {(() => {
                const courses = parseTeachingExperiences(selectedPerson.person.experiencesTh);
                if (courses.length === 0) return null;
                return (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-amber-500" />
                      <span>รายวิชาที่สอน ({courses.length} รายวิชา)</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {courses.map((c, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg border bg-background flex items-start justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0">
                            {c.courseCode && (
                              <span className="font-mono font-bold text-primary mr-1.5">
                                {c.courseCode}
                              </span>
                            )}
                            <span className="font-medium text-foreground">{c.courseNameTh}</span>
                          </div>
                          <span
                            className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-semibold ${getDegreeLevelColor(
                              c.level
                            )}`}
                          >
                            {formatDegreeLevelLabel(c.level)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Research Publications */}
              {selectedPerson.person.researchPublications &&
                selectedPerson.person.researchPublications.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-primary" />
                      <span>
                        ผลงานวิจัยและบทความวิชาการ (
                        {selectedPerson.person.researchPublications.length} เรื่อง)
                      </span>
                    </h4>
                    <div className="space-y-2">
                      {selectedPerson.person.researchPublications.map((pub) => (
                        <div
                          key={pub.id}
                          className="p-3 rounded-xl border bg-muted/20 space-y-1 text-xs"
                        >
                          <p className="font-bold text-foreground">{pub.titleTh}</p>
                          <p className="text-muted-foreground">
                            {pub.journalName}
                            {pub.publicationYear ? ` • พ.ศ. ${pub.publicationYear}` : ""}
                            {pub.tier ? ` (${pub.tier})` : ""}
                          </p>
                          {pub.url && (
                            <a
                              href={pub.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-primary hover:underline font-semibold pt-0.5"
                            >
                              <span>เปิดดูบทความ</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </LiyonDialogBody>

            <LiyonDialogFooter className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => exportPersonnelDoc(selectedPerson.person, "full")}
                  className="text-xs gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ดาวน์โหลดประวัติ (Word)</span>
                </Button>
                <Link href={`/portal/personnel/${selectedPerson.person.id}`}>
                  <Button type="button" size="sm" className="text-xs gap-1.5 cursor-pointer">
                    <span>ดูหน้าโปรไฟล์ฉบับเต็ม</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPerson(null)}
                className="text-xs cursor-pointer"
              >
                ปิดหน้าต่าง
              </Button>
            </LiyonDialogFooter>
          </div>
        )}
      </LiyonDialog>
    </div>
  );
}
