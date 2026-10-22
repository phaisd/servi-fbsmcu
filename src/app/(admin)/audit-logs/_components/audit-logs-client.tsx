"use client";

import React, { useState, useTransition } from "react";
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Download,
  Calendar,
  User,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  FileSpreadsheet,
  PlusCircle,
  Edit3,
  Trash2,
  Upload,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getAuditLogsAction } from "@/features/identity/actions";
import type { AuditLogQueryResult } from "@/features/identity/_internal/audit";

export type AuditLogsInitialData = AuditLogQueryResult;
export type AuditLogItem = AuditLogQueryResult["items"][number];

interface Props {
  initialData: AuditLogsInitialData;
}

export function AuditLogsClient({ initialData }: Props) {
  const [data, setData] = useState<AuditLogsInitialData>(initialData);
  const [search, setSearch] = useState("");
  const [selectedEntity, setSelectedEntity] = useState("ALL");
  const [selectedAction, setSelectedAction] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isPending, startTransition] = useTransition();

  // Diff Modal State
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [diffViewMode, setDiffViewMode] = useState<"TABLE" | "JSON">("TABLE");

  const loadLogs = (page: number = 1) => {
    startTransition(async () => {
      try {
        const res = await getAuditLogsAction({
          page,
          pageSize: data.pagination.pageSize,
          search: search.trim() || undefined,
          entity: selectedEntity !== "ALL" ? selectedEntity : undefined,
          action: selectedAction !== "ALL" ? selectedAction : undefined,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
        });
        setData(res as any);
      } catch (err: any) {
        toast.error(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูลประวัติระบบ");
      }
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadLogs(1);
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedEntity("ALL");
    setSelectedAction("ALL");
    setFromDate("");
    setToDate("");
    startTransition(async () => {
      try {
        const res = await getAuditLogsAction({ page: 1, pageSize: data.pagination.pageSize });
        setData(res as any);
      } catch (err: any) {
        toast.error(err.message || "เกิดข้อผิดพลาด");
      }
    });
  };

  // Export Audit Logs to CSV (UTF-8 BOM)
  const handleExportCSV = () => {
    const BOM = "\uFEFF";
    const headers = [
      "ลำดับ",
      "วันเวลา (Timestamp)",
      "ผู้ดำเนินการ (Actor)",
      "อีเมล (Email)",
      "โมดูล/ส่วนงาน (Module/Entity)",
      "การกระทำ (Action)",
      "รหัสอ้างอิง (Entity ID)",
      "ข้อมูลก่อนแก้ไข (Before)",
      "ข้อมูลหลังแก้ไข (After)",
      "IP Address",
    ];

    const rows = data.items.map((item, idx) => {
      const d = new Date(item.createdAt);
      const dateStr = d.toLocaleString("th-TH", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const beforeStr = item.before ? JSON.stringify(item.before).replace(/"/g, '""') : "-";
      const afterStr = item.after ? JSON.stringify(item.after).replace(/"/g, '""') : "-";

      return [
        `"${idx + 1}"`,
        `"${dateStr}"`,
        `"${(item.actor?.name || "ระบบ / ไม่ระบุ").replace(/"/g, '""')}"`,
        `"${item.actor?.email || "-"}"`,
        `"${item.entity}"`,
        `"${item.action}"`,
        `"${item.entityId}"`,
        `"${beforeStr}"`,
        `"${afterStr}"`,
        `"${item.ip || "-"}"`,
      ].join(",");
    });

    const csvContent = BOM + headers.join(",") + "\n" + rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MCU_Audit_Logs_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("ส่งออกไฟล์ประวัติระบบ (Audit Logs CSV) เรียบร้อยแล้ว");
  };

  const getActionBadge = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes("create") || act.includes("assign") || act.includes("add")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <PlusCircle className="w-3 h-3 text-emerald-600 shrink-0" />
          <span>เพิ่มข้อมูล ({action})</span>
        </span>
      );
    }
    if (act.includes("update") || act.includes("edit") || act.includes("change") || act.includes("status")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <Edit3 className="w-3 h-3 text-amber-600 shrink-0" />
          <span>แก้ไขปรับปรุง ({action})</span>
        </span>
      );
    }
    if (act.includes("delete") || act.includes("remove")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          <Trash2 className="w-3 h-3 text-rose-600 shrink-0" />
          <span>ลบข้อมูล ({action})</span>
        </span>
      );
    }
    if (act.includes("import") || act.includes("batch")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          <Upload className="w-3 h-3 text-blue-600 shrink-0" />
          <span>นำเข้าชุด ({action})</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
        <span>{action}</span>
      </span>
    );
  };

  const getEntityDisplay = (entity: string) => {
    switch (entity) {
      case "Student":
        return { label: "🎓 ทะเบียนนิสิต (Student)", color: "text-blue-700 dark:text-blue-400" };
      case "Event":
        return { label: "🎪 โครงการ/กิจกรรม (Event)", color: "text-purple-700 dark:text-purple-400" };
      case "EventRegistration":
        return { label: "📝 ลงทะเบียนกิจกรรม (Registration)", color: "text-indigo-700 dark:text-indigo-400" };
      case "Course":
      case "CourseTeacher":
      case "ClassSession":
        return { label: "📚 วิชาเรียนและการสอน (Course)", color: "text-emerald-700 dark:text-emerald-400" };
      case "Personnel":
        return { label: "👥 ทำเนียบบุคลากร (Personnel)", color: "text-teal-700 dark:text-teal-400" };
      case "AdminDocument":
        return { label: "📄 งานสารบรรณ (AdminDocument)", color: "text-amber-700 dark:text-amber-400" };
      case "User":
      case "Role":
        return { label: "👤 บัญชีผู้ใช้และสิทธิ์ (User/Role)", color: "text-rose-700 dark:text-rose-400" };
      case "TenantSettings":
        return { label: "⚙️ ตั้งค่าระบบ (Settings)", color: "text-slate-700 dark:text-slate-400" };
      default:
        return { label: entity, color: "text-slate-700 dark:text-slate-400" };
    }
  };

  return (
    <div className="space-y-6">
      {/* ══════════ Header Banner ══════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>ความปลอดภัยและการตรวจสอบระบบ (Security & IT Audit)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            บันทึกประวัติการปรับปรุงระบบ (Audit Logs)
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            สำหรับผู้ดูแลระบบ (Admin) ตรวจสอบว่ามีการเพิ่ม แก้ไข หรือลบข้อมูลโดยผู้ใช้คนใด วันเวลา และส่วนใดในระบบ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => loadLogs(data.pagination.page)}
            disabled={isPending}
            className="gap-1.5 text-xs rounded-xl shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
            <span>รีเฟรชข้อมูล</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleExportCSV}
            className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ส่งออก Excel (CSV)</span>
          </Button>
        </div>
      </div>

      {/* ══════════ Summary KPI Cards ══════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-card border border-border rounded-2xl p-4 shadow-2xs text-center">
          <span className="text-2xs font-bold text-muted-foreground uppercase block">ประวัติทั้งหมดในระบบ</span>
          <div className="text-2xl sm:text-3xl font-black text-foreground mt-1">
            {data.stats.totalAll.toLocaleString()}
          </div>
          <span className="text-2xs text-muted-foreground">รายการบันทึก</span>
        </div>

        <div className="bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent border border-indigo-200 dark:border-indigo-900/40 rounded-2xl p-4 shadow-2xs text-center">
          <span className="text-2xs font-bold text-indigo-700 dark:text-indigo-400 uppercase block">กิจกรรมวันนี้</span>
          <div className="text-2xl sm:text-3xl font-black text-indigo-900 dark:text-indigo-200 mt-1">
            {data.stats.todayCount.toLocaleString()}
          </div>
          <span className="text-2xs text-indigo-600 dark:text-indigo-400">รายการในวันนี้</span>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-4 shadow-2xs text-center">
          <span className="text-2xs font-bold text-emerald-700 dark:text-emerald-400 uppercase block">เพิ่มข้อมูล (CREATE)</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-900 dark:text-emerald-200 mt-1">
            {data.stats.createCount.toLocaleString()}
          </div>
          <span className="text-2xs text-emerald-600 dark:text-emerald-400">ข้อมูลใหม่</span>
        </div>

        <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4 shadow-2xs text-center">
          <span className="text-2xs font-bold text-amber-700 dark:text-amber-400 uppercase block">แก้ไข (UPDATE)</span>
          <div className="text-2xl sm:text-3xl font-black text-amber-900 dark:text-amber-200 mt-1">
            {data.stats.updateCount.toLocaleString()}
          </div>
          <span className="text-2xs text-amber-600 dark:text-amber-400">การปรับปรุง</span>
        </div>

        <div className="bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border border-rose-200 dark:border-rose-900/40 rounded-2xl p-4 shadow-2xs text-center col-span-2 sm:col-span-1">
          <span className="text-2xs font-bold text-rose-700 dark:text-rose-400 uppercase block">ลบข้อมูล (DELETE)</span>
          <div className="text-2xl sm:text-3xl font-black text-rose-900 dark:text-rose-200 mt-1">
            {data.stats.deleteCount.toLocaleString()}
          </div>
          <span className="text-2xs text-rose-600 dark:text-rose-400">การลบออก</span>
        </div>
      </div>

      {/* ══════════ Search & Filters Toolbar ══════════ */}
      <form onSubmit={handleSearchSubmit} className="bg-card border border-border rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Keyword Search */}
          <div className="sm:col-span-4 relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อผู้ทำ, อีเมล, Action, ID..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-xs focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>

          {/* Entity Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value="ALL">โมดูลงาน: ทั้งหมด (All Modules)</option>
              {data.entities.map((ent) => (
                <option key={ent} value={ent}>
                  {getEntityDisplay(ent).label}
                </option>
              ))}
            </select>
          </div>

          {/* Action Type Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value="ALL">ประเภทการกระทำ: ทั้งหมด</option>
              <option value="create">🟢 เพิ่มข้อมูล (CREATE)</option>
              <option value="update">🟡 แก้ไขปรับปรุง (UPDATE)</option>
              <option value="delete">🔴 ลบข้อมูล (DELETE)</option>
              <option value="import">🔵 นำเข้าชุด (IMPORT)</option>
            </select>
          </div>

          {/* Submit Search Button */}
          <div className="sm:col-span-2 flex items-center gap-1.5">
            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-9 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-2xs"
            >
              <span>ค้นหา</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleResetFilters}
              title="ล้างตัวกรอง"
              className="h-9 px-2.5 text-xs rounded-xl"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* Date Range Row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/50 text-2xs text-muted-foreground">
          <span className="font-semibold text-foreground flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>ช่วงวันที่:</span>
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">จาก</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-2 py-1 rounded-lg border border-border bg-background text-2xs"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">ถึง</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-2 py-1 rounded-lg border border-border bg-background text-2xs"
            />
          </div>
          {(fromDate || toDate) && (
            <button
              type="button"
              onClick={() => { setFromDate(""); setToDate(""); loadLogs(1); }}
              className="text-primary hover:underline font-semibold cursor-pointer"
            >
              ล้างวันที่
            </button>
          )}
        </div>
      </form>

      {/* ══════════ Audit Logs Table ══════════ */}
      <div className="bg-card border border-border rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-muted/40 border-b border-border text-muted-foreground text-2xs uppercase">
                <th className="py-3 px-4 font-semibold w-12 text-center">#</th>
                <th className="py-3 px-4 font-semibold w-44">วันเวลา (Timestamp)</th>
                <th className="py-3 px-4 font-semibold w-52">ผู้ดำเนินการ (Actor)</th>
                <th className="py-3 px-4 font-semibold w-48">โมดูลงาน (Module)</th>
                <th className="py-3 px-4 font-semibold w-52">การกระทำ (Action)</th>
                <th className="py-3 px-4 font-semibold">รหัสอ้างอิง (Entity ID)</th>
                <th className="py-3 px-4 font-semibold text-center w-28">รายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground text-xs">
                    ไม่พบข้อมูลบันทึกประวัติระบบตามเงื่อนไขที่ค้นหา
                  </td>
                </tr>
              ) : (
                data.items.map((item, idx) => {
                  const d = new Date(item.createdAt);
                  const dateStr = d.toLocaleDateString("th-TH", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  });
                  const timeStr = d.toLocaleTimeString("th-TH", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  });

                  const ent = getEntityDisplay(item.entity);
                  const itemIndex = (data.pagination.page - 1) * data.pagination.pageSize + idx + 1;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-4 text-center text-2xs font-mono text-muted-foreground">
                        {itemIndex}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span>{dateStr}</span>
                        </div>
                        <span className="text-2xs text-muted-foreground font-mono block pl-5">
                          {timeStr} น.
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                            {item.actor?.name?.charAt(0) || <User className="w-3.5 h-3.5" />}
                          </div>
                          <div className="truncate">
                            <span className="font-semibold text-foreground block truncate">
                              {item.actor?.name || "ระบบอัตโนมัติ (System)"}
                            </span>
                            <span className="text-2xs text-muted-foreground truncate block font-mono">
                              {item.actor?.email || item.ip || "-"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`font-semibold text-xs ${ent.color}`}>
                          {ent.label}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {getActionBadge(item.action)}
                      </td>

                      <td className="py-3 px-4 font-mono text-2xs text-muted-foreground">
                        <span className="truncate block max-w-[180px]" title={item.entityId}>
                          {item.entityId}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(item)}
                          className="h-7 px-2 text-2xs gap-1 text-primary hover:bg-primary/10 rounded-lg cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>ดูความต่าง</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ══════════ Pagination Controls ══════════ */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-border bg-muted/20 text-xs text-muted-foreground">
          <div>
            แสดงหน้า <strong>{data.pagination.page}</strong> จากทั้งหมด <strong>{data.pagination.totalPages || 1}</strong> หน้า (
            {data.pagination.total.toLocaleString()} รายการ)
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={data.pagination.page <= 1 || isPending}
              onClick={() => loadLogs(data.pagination.page - 1)}
              className="gap-1 h-8 text-xs rounded-lg"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>ก่อนหน้า</span>
            </Button>

            <span className="px-3 py-1 text-xs font-mono font-bold text-foreground bg-card border border-border rounded-lg">
              {data.pagination.page} / {data.pagination.totalPages || 1}
            </span>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={data.pagination.page >= data.pagination.totalPages || isPending}
              onClick={() => loadLogs(data.pagination.page + 1)}
              className="gap-1 h-8 text-xs rounded-lg"
            >
              <span>ถัดไป</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ══════════ Diff Inspector Modal ══════════ */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-muted/30 shrink-0">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-foreground text-sm sm:text-base">
                    รายละเอียดการปรับปรุงข้อมูล (Audit Diff Inspector)
                  </h3>
                </div>
                <p className="text-2xs text-muted-foreground">
                  รหัสรายการ: {selectedLog.id} • บันทึกเมื่อ {new Date(selectedLog.createdAt).toLocaleString("th-TH")}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-lg border border-border p-0.5 bg-background text-2xs">
                  <button
                    type="button"
                    onClick={() => setDiffViewMode("TABLE")}
                    className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                      diffViewMode === "TABLE"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    ตารางเปรียบเทียบ
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiffViewMode("JSON")}
                    className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                      diffViewMode === "JSON"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Raw JSON
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              {/* Meta details bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-muted/40 rounded-xl border border-border text-xs">
                <div>
                  <span className="text-2xs text-muted-foreground block">ผู้ดำเนินการ (Actor):</span>
                  <span className="font-bold text-foreground">{selectedLog.actor?.name || "ระบบอัตโนมัติ"}</span>
                  <span className="text-2xs text-muted-foreground block font-mono">{selectedLog.actor?.email || "-"}</span>
                </div>
                <div>
                  <span className="text-2xs text-muted-foreground block">โมดูลและส่วนงาน:</span>
                  <span className="font-bold text-foreground">{getEntityDisplay(selectedLog.entity).label}</span>
                  <span className="text-2xs text-muted-foreground block font-mono">Entity ID: {selectedLog.entityId}</span>
                </div>
                <div>
                  <span className="text-2xs text-muted-foreground block">การกระทำ (Action):</span>
                  <div className="mt-0.5">{getActionBadge(selectedLog.action)}</div>
                  {selectedLog.ip && (
                    <span className="text-2xs text-muted-foreground block font-mono mt-1">IP: {selectedLog.ip}</span>
                  )}
                </div>
              </div>

              {/* View Mode 1: Table Comparison */}
              {diffViewMode === "TABLE" ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-2xs text-muted-foreground">
                    <span>ตารางเปรียบเทียบฟิลด์ข้อมูลที่มีการเปลี่ยนแปลง:</span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-sm bg-rose-200 border border-rose-400 inline-block"></span>
                        <span>ข้อมูลก่อนหน้า (Before)</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-sm bg-emerald-200 border border-emerald-400 inline-block"></span>
                        <span>ข้อมูลปัจจุบัน (After)</span>
                      </span>
                    </div>
                  </div>

                  {(() => {
                    const before = selectedLog.before && typeof selectedLog.before === "object" ? (selectedLog.before as Record<string, any>) : {};
                    const after = selectedLog.after && typeof selectedLog.after === "object" ? (selectedLog.after as Record<string, any>) : {};
                    const allKeys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));

                    if (allKeys.length === 0) {
                      return (
                        <div className="py-8 text-center text-muted-foreground text-xs border border-dashed border-border rounded-xl">
                          ไม่มีข้อมูลโครงสร้างเปรียบเทียบในรายการนี้
                        </div>
                      );
                    }

                    return (
                      <div className="border border-border rounded-xl overflow-hidden text-xs">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-muted/50 border-b border-border text-muted-foreground text-2xs uppercase">
                              <th className="py-2.5 px-3 text-left w-36 sm:w-48">ชื่อฟิลด์ (Property)</th>
                              <th className="py-2.5 px-3 text-left w-1/2">ค่าเดิม (Before)</th>
                              <th className="py-2.5 px-3 text-left w-1/2">ค่าใหม่ (After)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {allKeys.map((key) => {
                              const bVal = before[key];
                              const aVal = after[key];
                              const isDiff = JSON.stringify(bVal) !== JSON.stringify(aVal);

                              const formatVal = (val: any) => {
                                if (val === undefined) return <span className="text-muted-foreground/60 italic">(ไม่มีข้อมูล)</span>;
                                if (val === null) return <span className="text-muted-foreground/60 italic">null</span>;
                                if (typeof val === "boolean") return val ? "true" : "false";
                                if (typeof val === "object") return JSON.stringify(val);
                                return String(val);
                              };

                              return (
                                <tr
                                  key={key}
                                  className={isDiff ? "bg-amber-50/40 dark:bg-amber-950/20 font-medium" : "text-muted-foreground"}
                                >
                                  <td className="py-2 px-3 font-mono text-2xs text-foreground font-semibold">
                                    {key}
                                    {isDiff && <span className="text-amber-600 ml-1 text-2xs">•</span>}
                                  </td>
                                  <td className={`py-2 px-3 font-mono text-2xs break-all ${isDiff ? "text-rose-700 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20" : ""}`}>
                                    {formatVal(bVal)}
                                  </td>
                                  <td className={`py-2 px-3 font-mono text-2xs break-all ${isDiff ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 font-bold" : ""}`}>
                                    {formatVal(aVal)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* View Mode 2: Raw JSON Comparison */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      ข้อมูลก่อนแก้ไข (Before Payload)
                    </span>
                    <pre className="p-3 bg-muted/50 border border-border rounded-xl font-mono text-2xs overflow-x-auto max-h-80 text-foreground">
                      {selectedLog.before ? JSON.stringify(selectedLog.before, null, 2) : "// ไม่มีข้อมูลก่อนหน้า (เช่น การสร้างใหม่)"}
                    </pre>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      ข้อมูลหลังแก้ไข (After Payload)
                    </span>
                    <pre className="p-3 bg-muted/50 border border-border rounded-xl font-mono text-2xs overflow-x-auto max-h-80 text-foreground">
                      {selectedLog.after ? JSON.stringify(selectedLog.after, null, 2) : "// ไม่มีข้อมูลหลังการกระทำ (เช่น การลบออก)"}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border flex items-center justify-end bg-muted/20 shrink-0">
              <Button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="bg-primary text-primary-foreground text-xs font-semibold rounded-xl"
              >
                ปิดหน้าต่าง
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
