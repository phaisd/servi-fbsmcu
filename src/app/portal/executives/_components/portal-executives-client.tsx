"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Users,
  Award,
  BookOpen,
  Building2,
  FileText,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  classifyExecutivePersonnel,
  formatPersonnelName,
  parseTeachingExperiences,
  type ClassifiedExecutive,
} from "@/features/personnel";
import type { PersonnelItem } from "../../personnel/_components/portal-personnel-client";

interface Props {
  items: PersonnelItem[];
  locale: string;
}

export function PortalExecutivesClient({ items, locale }: Props) {
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
  const tier4ProgramDirectors = useMemo(
    () => classifiedList.filter((item) => item.tier === 4),
    [classifiedList]
  );
  const tier5DeanOffice = useMemo(
    () => classifiedList.filter((item) => item.tier === 5),
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
      <Link
        key={person.id}
        href={`/portal/personnel/${person.id}`}
        className={`group relative rounded-2xl border bg-card transition-all duration-300 cursor-pointer overflow-hidden flex flex-col hover:-translate-y-1 hover:shadow-lg ${
          featured
            ? "max-w-md mx-auto w-full border-amber-500/40 shadow-md hover:shadow-xl ring-2 ring-amber-500/20"
            : "w-full sm:w-[320px] max-w-sm border-border/80 shadow-xs hover:border-primary/50"
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
                  : exec.tier === 4
                    ? "bg-gradient-to-r from-sky-600 to-indigo-600"
                    : "bg-gradient-to-r from-violet-600 to-purple-600"
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
                    : exec.tier === 4
                      ? "bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20"
                      : "bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20"
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

          {/* Direct Link Action Hint */}
          <div className="w-full pt-1.5 flex items-center justify-center gap-1 text-xs font-bold text-primary group-hover:translate-x-0.5 transition-transform">
            <span>{locale === "th" ? "ดูหน้าประวัติฉบับเต็ม" : "View Full Profile"}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </Link>
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
          <span>
            {locale === "th"
              ? "คลิกที่การ์ดผู้บริหารเพื่อดูหน้าประวัติฉบับเต็ม"
              : "Click an executive card to view full profile"}
          </span>
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

      {/* TIER 4: PROGRAM DIRECTORS */}
      {tier4ProgramDirectors.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-border/60">
          <div className="text-center space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400">
              Tier 4 • Graduate Program Directors
            </span>
            <h2 className="text-xl font-extrabold text-foreground">
              {locale === "th" ? "ผู้อำนวยการหลักสูตร" : "Graduate Program Directors"}
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-5 max-w-4xl mx-auto">
            {tier4ProgramDirectors.map((exec) => renderExecutiveCard(exec, false))}
          </div>
        </section>
      )}

      {/* TIER 5: OFFICE OF THE DEAN */}
      {tier5DeanOffice.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-border/60">
          <div className="text-center space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">
              Tier 5 • Office of the Dean
            </span>
            <h2 className="text-xl font-extrabold text-foreground">
              {locale === "th" ? "สำนักงานคณบดี" : "Office of the Dean"}
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-5 max-w-4xl mx-auto">
            {tier5DeanOffice.map((exec) => renderExecutiveCard(exec, false))}
          </div>
        </section>
      )}
    </div>
  );
}
