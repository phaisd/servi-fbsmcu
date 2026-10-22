"use client";

import Link from "next/link";
import { Users, BookOpen, Building } from "lucide-react";
import { useT } from "@/shared/lib/i18n/client";
import { LiyonCard } from "@/shared/components/liyon";
import type { Department } from "@/generated/prisma";

export function DepartmentsAdminClient({ initialItems }: { initialItems: Department[] }) {
  const t = useT();

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t("personnel.nav")} (Departments)</h1>
          <p className="text-sm text-muted-foreground mt-0.5">จัดการโครงสร้างภาควิชาและหน่วยงาน</p>
        </div>
      </div>

      {/* Module Navigation Strip */}
      <div className="flex items-center gap-2 border-b border-border pb-px text-sm">
        <Link
          href="/personnel"
          className="px-4 py-2 font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
        >
          <Users className="w-4 h-4" />
          <span>ทำเนียบคณาจารย์และบุคลากร</span>
        </Link>
        <Link
          href="/personnel/research"
          className="px-4 py-2 font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
        >
          <BookOpen className="w-4 h-4" />
          <span>ผลงานวิจัยและวิชาการ</span>
        </Link>
        <Link
          href="/personnel/departments"
          className="px-4 py-2 font-semibold text-primary border-b-2 border-primary flex items-center gap-2"
        >
          <Building className="w-4 h-4" />
          <span>จัดการภาควิชา ({initialItems.length})</span>
        </Link>
      </div>

      <LiyonCard>
        <div className="p-4">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-2">Name (TH)</th>
                <th className="py-2">Name (EN)</th>
                <th className="py-2">Order</th>
              </tr>
            </thead>
            <tbody>
              {initialItems.map((item) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-2">{item.nameTh}</td>
                  <td className="py-2">{item.nameEn}</td>
                  <td className="py-2">{item.orderIndex}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LiyonCard>
    </div>
  );
}
