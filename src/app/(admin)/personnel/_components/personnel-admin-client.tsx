"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Users,
  BookOpen,
  Building,
  Search,
  ExternalLink,
  Phone,
  Mail,
} from "lucide-react";
import { useT } from "@/shared/lib/i18n/client";
import { LiyonCard } from "@/shared/components/liyon";
import { Button } from "@/components/ui/button";
import type { Personnel, Department, ResearchPublication } from "@/generated/prisma";

type PersonnelWithRelations = Personnel & {
  department: Department | null;
  researchPublications?: ResearchPublication[];
};

export function PersonnelAdminClient({ initialItems }: { initialItems: PersonnelWithRelations[] }) {
  const t = useT();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [deptFilter, setDeptFilter] = useState<string>("ALL");

  // Collect unique departments
  const departments = Array.from(
    new Map(
      initialItems
        .filter((item) => item.department)
        .map((item) => [item.department!.id, item.department!])
    ).values()
  );

  const filteredItems = initialItems.filter((item) => {
    const q = search.toLowerCase().trim();
    const fullNameTh = `${item.firstNameTh} ${item.lastNameTh}`.toLowerCase();
    const fullNameEn = `${item.firstNameEn || ""} ${item.lastNameEn || ""}`.toLowerCase();
    const posTh = (item.positionTh || "").toLowerCase();
    const acadPos = (item.academicPosition || "").toLowerCase();
    const deptName = (item.department?.nameTh || "").toLowerCase();

    const matchesSearch =
      !q ||
      fullNameTh.includes(q) ||
      fullNameEn.includes(q) ||
      posTh.includes(q) ||
      acadPos.includes(q) ||
      deptName.includes(q);

    const matchesType = typeFilter === "ALL" || item.type === typeFilter;
    const matchesDept = deptFilter === "ALL" || item.departmentId === deptFilter;

    return matchesSearch && matchesType && matchesDept;
  });

  const totalResearchCount = initialItems.reduce(
    (acc, item) => acc + (item.researchPublications?.length || 0),
    0
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("personnel.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("personnel.subtitle")} ({initialItems.length} ท่าน)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/portal/personnel" target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm" className="gap-2 cursor-pointer">
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
              <span>ดูหน้าพอร์ทัลบุคลากร</span>
            </Button>
          </Link>
          <Link href="/personnel/research">
            <Button size="sm" className="gap-2 cursor-pointer shadow-xs">
              <BookOpen className="w-4 h-4" />
              <span>ผลงานวิจัย ({totalResearchCount})</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Module Navigation Strip */}
      <div className="flex items-center gap-2 border-b border-border pb-px text-sm">
        <Link
          href="/personnel"
          className="px-4 py-2 font-semibold text-primary border-b-2 border-primary flex items-center gap-2"
        >
          <Users className="w-4 h-4" />
          <span>ทำเนียบคณาจารย์และบุคลากร ({initialItems.length})</span>
        </Link>
        <Link
          href="/personnel/research"
          className="px-4 py-2 font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
        >
          <BookOpen className="w-4 h-4" />
          <span>ผลงานวิจัยและวิชาการ ({totalResearchCount})</span>
        </Link>
        <Link
          href="/personnel/departments"
          className="px-4 py-2 font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
        >
          <Building className="w-4 h-4" />
          <span>จัดการภาควิชา ({departments.length})</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <LiyonCard>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ, ตำแหน่ง, วุฒิการศึกษา..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full py-2 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">-- ทุกประเภทสายงาน --</option>
                <option value="ACADEMIC">สายวิชาการ (อาจารย์/นักวิจัย)</option>
                <option value="SUPPORT">สายสนับสนุน (เจ้าหน้าที่)</option>
                <option value="EXECUTIVE">สายผู้บริหาร</option>
              </select>
            </div>

            <div>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full py-2 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">-- ทุกภาควิชา / หน่วยงาน --</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.nameTh}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </LiyonCard>

      {/* Personnel Table */}
      <LiyonCard>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-muted-foreground border-b border-border text-xs uppercase font-medium">
              <tr>
                <th className="py-3 px-4">ชื่อ - นามสกุล / คณาจารย์</th>
                <th className="py-3 px-4">ตำแหน่งและหน้าที่</th>
                <th className="py-3 px-4">ภาควิชา / สังกัด</th>
                <th className="py-3 px-4">สายงาน</th>
                <th className="py-3 px-4 text-center">ผลงานวิจัย / ตีพิมพ์</th>
                <th className="py-3 px-4 text-center">สถานะ</th>
                <th className="py-3 px-4 text-right">ลิงก์</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    ไม่พบข้อมูลบุคลากรที่ตรงกับเงื่อนไขการค้นหา
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const researchCount = item.researchPublications?.length || 0;
                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 text-sm overflow-hidden border border-primary/20">
                            {item.imageUrl ? (
                              <Image
                                src={item.imageUrl}
                                alt={item.firstNameTh}
                                width={40}
                                height={40}
                                unoptimized
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{item.firstNameTh?.[0] || "U"}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground flex items-center gap-1.5 flex-wrap">
                              {item.academicPosition && (
                                <span className="text-xs font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                  {item.academicPosition}
                                </span>
                              )}
                              <span>
                                {item.firstNameTh} {item.lastNameTh}
                              </span>
                            </div>
                            {(item.firstNameEn || item.lastNameEn) && (
                              <p className="text-xs text-muted-foreground">
                                {item.firstNameEn} {item.lastNameEn}
                              </p>
                            )}
                            {item.email && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Mail className="w-3 h-3" />
                                {item.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-sm font-medium text-foreground">{item.positionTh}</div>
                        {item.positionEn && (
                          <div className="text-xs text-muted-foreground">{item.positionEn}</div>
                        )}
                        {item.phoneNumber && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            {item.phoneNumber}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-sm text-foreground">
                          {item.department?.nameTh || "-"}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            item.type === "ACADEMIC"
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : item.type === "EXECUTIVE"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}
                        >
                          {t(`personnel.type.${item.type}`)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {researchCount > 0 ? (
                          <Link
                            href={`/personnel/research`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition-colors"
                          >
                            <BookOpen className="w-3 h-3 text-emerald-600" />
                            <span>{researchCount} เรื่อง</span>
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {item.isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            เผยแพร่
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
                            ซ่อน
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/portal/personnel`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                        >
                          <span>ดูพอร์ทัล</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </LiyonCard>
    </div>
  );
}
