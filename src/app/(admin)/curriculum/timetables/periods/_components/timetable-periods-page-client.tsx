"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Clock, ExternalLink, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  TimetablePeriodsEditor,
} from "@/features/curriculum/_components/timetable-periods-editor";
import type { TimetablePeriodConfig } from "@/features/curriculum";

interface TimetablePeriodsPageClientProps {
  initialPeriods: TimetablePeriodConfig[];
}

export function TimetablePeriodsPageClient({
  initialPeriods,
}: TimetablePeriodsPageClientProps) {
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              ตั้งค่าคาบเรียนและเวลา (Timetable Periods & Times)
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              ปรับแต่งโครงสร้างคาบเรียน เวลาเริ่ม-สิ้นสุด และช่วงเวลาพักกลางวันสำหรับแสดงผลตารางเรียนและเอกสารพิมพ์
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/curriculum/timetables">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs cursor-pointer">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>กลับหน้าจัดการตารางเรียน</span>
            </Button>
          </Link>
          <Link href="/portal/timetables" target="_blank">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-primary cursor-pointer">
              <ExternalLink className="w-3.5 h-3.5" />
              <Calendar className="w-3.5 h-3.5" />
              <span>ดูตารางเรียนนิสิต</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* ── EDITOR ── */}
      <TimetablePeriodsEditor initialPeriods={initialPeriods} />
    </div>
  );
}
