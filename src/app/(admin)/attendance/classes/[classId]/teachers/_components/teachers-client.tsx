"use client";

import { useState } from "react";
import {
  GraduationCap,
  Users,
  Calendar,
  FileSpreadsheet,
  Plus,
  Trash2,
  ShieldCheck,
  UserCheck,
  ArrowLeft,
  Mail,
  Award,
} from "lucide-react";
import {
  LiyonCard,
  LiyonDialog,
  LiyonDialogHeader,
  LiyonDialogBody,
  LiyonDialogFooter,
  LiyonDialogCloseButton,
} from "@/shared/components/liyon";
import Link from "next/link";
import {
  assignCourseTeacherAction,
  removeCourseTeacherAction,
} from "@/features/attendance/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface TeacherClientProps {
  course: any;
  assignedTeachers: any[];
  availableTeachers: any[];
  isPrimary: boolean;
  currentUserId: string;
}

export function TeachersClient({
  course,
  assignedTeachers,
  availableTeachers,
  isPrimary,
  currentUserId,
}: TeacherClientProps) {
  const router = useRouter();
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<"PRIMARY_TEACHER" | "CO_TEACHER" | "TEACHING_ASSISTANT">("CO_TEACHER");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  // กรองอาจารย์ที่ยังไม่ได้มอบหมายในวิชานี้
  const assignedUserIds = new Set(assignedTeachers.map((t) => t.userId));
  if (course.primaryTeacherId) {
    assignedUserIds.add(course.primaryTeacherId);
  }
  const unassignedTeachers = availableTeachers.filter(
    (t) => !assignedUserIds.has(t.id)
  );

  async function handleAssignTeacher() {
    if (!selectedUserId) {
      toast.error("กรุณาเลือกอาจารย์ที่ต้องการมอบหมาย");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await assignCourseTeacherAction({
        courseId: course.id,
        userId: selectedUserId,
        role: selectedRole,
      });

      if (res.success) {
        toast.success("มอบหมายอาจารย์ผู้สอนเรียบร้อยแล้ว");
        setIsAssignOpen(false);
        setSelectedUserId("");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการมอบหมายผู้สอน");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemoveTeacher() {
    if (!deleteTarget) return;

    try {
      setIsSubmitting(true);
      const res = await removeCourseTeacherAction(course.id, deleteTarget.userId);
      if (res.success) {
        toast.success("ถอดถอนผู้สอนออกจากรายวิชาเรียบร้อยแล้ว");
        setDeleteTarget(null);
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการถอดถอน");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-500 hover:text-primary text-xs font-semibold mb-2 transition">
            <Link href="/attendance/classes" className="inline-flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> ย้อนกลับไปรายวิชาทั้งหมด
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary font-bold text-xs">
              {course.courseCode}
            </span>
            <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
              กลุ่ม {course.section || "1"}
            </span>
            <span className="text-xs text-slate-400">ภาคการศึกษา {course.term}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            อาจารย์ผู้สอนและผู้ช่วยสอน (Course Teachers)
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{course.courseName}</p>
        </div>

        {/* Action Tabs & Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/attendance/classes/${course.id}/sessions`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition"
          >
            <Calendar className="w-3.5 h-3.5" />
            ตารางคาบเรียน
          </Link>

          <Link
            href={`/attendance/classes/${course.id}/students`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition"
          >
            <Users className="w-3.5 h-3.5" />
            รายชื่อนิสิต
          </Link>

          <Link
            href={`/attendance/classes/${course.id}/eligibility`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-semibold shadow-2xs transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            สรุปสิทธิ์สอบ
          </Link>

          <Link
            href={`/attendance/classes/${course.id}/grades`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 text-xs font-semibold shadow-2xs transition"
          >
            <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            บันทึกคะแนน/เกรด
          </Link>

          {isPrimary && (
            <button
              type="button"
              onClick={() => setIsAssignOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              มอบหมายผู้สอนเพิ่ม
            </button>
          )}
        </div>
      </div>

      {/* Role Explanations Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-amber-50/70 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200">
            <Award className="w-4 h-4 text-amber-600" />
            <span>อาจารย์ผู้รับผิดชอบหลัก (Primary)</span>
          </div>
          <p className="text-amber-800/80 dark:text-amber-300/80 text-2xs">
            มีสิทธิ์จัดการวิชาเต็มรูปแบบ ล็อค/ปลดล็อคคาบเรียน มอบหมายผู้สอนร่วม และอนุมัติผลสิทธิ์สอบ
          </p>
        </div>

        <div className="bg-blue-50/70 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-200">
            <Users className="w-4 h-4 text-blue-600" />
            <span>อาจารย์ผู้สอนร่วม (Co-Teacher)</span>
          </div>
          <p className="text-blue-800/80 dark:text-blue-300/80 text-2xs">
            ร่วมจัดการคาบเรียน บันทึกเวลาเข้าเรียน เช็กชื่อนิสิต และตรวจสอบรายงานสิทธิ์สอบ
          </p>
        </div>

        <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-200">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>ผู้ช่วยสอน (Teaching Assistant)</span>
          </div>
          <p className="text-emerald-800/80 dark:text-emerald-300/80 text-2xs">
            ช่วยตรวจนับเวลาเรียน บันทึกการเข้าเรียน และช่วยอำนวยความสะดวกในชั้นเรียน
          </p>
        </div>
      </div>

      {/* Teachers List Table */}
      <LiyonCard className="overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            รายชื่อผู้สอนที่ได้รับมอบหมายในวิชานี้ ({assignedTeachers.length + (course.primaryTeacher ? 1 : 0)} ท่าน)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 font-semibold uppercase">
              <tr>
                <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                <th className="py-3 px-4">อีเมล</th>
                <th className="py-3 px-4">บทบาทในวิชา</th>
                <th className="py-3 px-4">สถานะสิทธิ์</th>
                {isPrimary && <th className="py-3 px-4 text-center">จัดการ</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {/* Primary Teacher Row */}
              {course.primaryTeacher && (
                <tr className="bg-amber-50/30 dark:bg-amber-950/10">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                      {course.primaryTeacher.name?.charAt(0) || "อ"}
                    </span>
                    <span>{course.primaryTeacher.name}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 text-xs">
                    {course.primaryTeacher.email}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-300/80 dark:border-amber-800">
                      <Award className="w-3 h-3" /> ผู้รับผิดชอบหลัก (Primary)
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-semibold text-emerald-600">
                    จัดการได้เต็มรูปแบบ
                  </td>
                  {isPrimary && (
                    <td className="py-3.5 px-4 text-center text-xs text-slate-400">
                      (อาจารย์หลัก)
                    </td>
                  )}
                </tr>
              )}

              {/* Co-Teachers & Assistants Rows */}
              {assignedTeachers
                .filter((t) => t.userId !== course.primaryTeacherId)
                .map((t) => {
                  const roleConfig: Record<string, { label: string; color: string }> = {
                    PRIMARY_TEACHER: {
                      label: "ผู้รับผิดชอบหลัก",
                      color: "bg-amber-100 text-amber-800 border-amber-300",
                    },
                    CO_TEACHER: {
                      label: "ผู้สอนร่วม (Co-Teacher)",
                      color: "bg-blue-100 text-blue-800 border-blue-300",
                    },
                    TEACHING_ASSISTANT: {
                      label: "ผู้ช่วยสอน (Assistant)",
                      color: "bg-emerald-100 text-emerald-800 border-emerald-300",
                    },
                  };

                  const cfg = roleConfig[t.role] || roleConfig.CO_TEACHER;

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs">
                          {t.user.name?.charAt(0) || "อ"}
                        </span>
                        <span>{t.user.name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs">
                        {t.user.email}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
                        เช็กชื่อและดูสถิติ
                      </td>
                      {isPrimary && (
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(t)}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                            title="ถอดถอนผู้สอน"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}

              {assignedTeachers.length === 0 && !course.primaryTeacher && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                    ยังไม่มีการมอบหมายผู้สอนในรายวิชานี้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </LiyonCard>

      {/* Assign Teacher Modal */}
      <LiyonDialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <LiyonDialogHeader
          title="มอบหมายอาจารย์ผู้สอนเพิ่ม"
          description={`วิชา ${course.courseCode} — ${course.courseName}`}
        />
        <LiyonDialogCloseButton label="ปิด" />
        <LiyonDialogBody className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              เลือกอาจารย์: <span className="text-red-500">*</span>
            </label>
            {unassignedTeachers.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">
                อาจารย์ทุกคนในระบบได้รับการมอบหมายในวิชานี้แล้ว
              </p>
            ) : (
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">-- กรุณาเลือกอาจารย์ --</option>
                {unassignedTeachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              กำหนดบทบาทในวิชา: <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <input
                  type="radio"
                  name="role"
                  value="CO_TEACHER"
                  checked={selectedRole === "CO_TEACHER"}
                  onChange={() => setSelectedRole("CO_TEACHER")}
                  className="text-primary"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">ผู้สอนร่วม (Co-Teacher)</span>
                  <p className="text-2xs text-slate-400">เช็กชื่อ บันทึกเวลาเรียน และดูรายงานสิทธิ์สอบ</p>
                </div>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <input
                  type="radio"
                  name="role"
                  value="TEACHING_ASSISTANT"
                  checked={selectedRole === "TEACHING_ASSISTANT"}
                  onChange={() => setSelectedRole("TEACHING_ASSISTANT")}
                  className="text-primary"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">ผู้ช่วยสอน (Teaching Assistant)</span>
                  <p className="text-2xs text-slate-400">ช่วยบันทึกการเข้าเรียนและตรวจเช็กชื่อ</p>
                </div>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20 cursor-pointer hover:bg-amber-50">
                <input
                  type="radio"
                  name="role"
                  value="PRIMARY_TEACHER"
                  checked={selectedRole === "PRIMARY_TEACHER"}
                  onChange={() => setSelectedRole("PRIMARY_TEACHER")}
                  className="text-amber-600"
                />
                <div>
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200">โอนเป็นผู้รับผิดชอบหลัก (Transfer Primary)</span>
                  <p className="text-2xs text-amber-700/80 dark:text-amber-400">โอนสิทธิ์การเป็นอาจารย์หลักของวิชานี้ให้ท่านนี้</p>
                </div>
              </label>
            </div>
          </div>
        </LiyonDialogBody>
        <LiyonDialogFooter className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setIsAssignOpen(false)}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={isSubmitting || !selectedUserId}
            onClick={handleAssignTeacher}
            className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 disabled:opacity-50"
          >
            {isSubmitting ? "กำลังมอบหมาย..." : "บันทึกการมอบหมาย"}
          </button>
        </LiyonDialogFooter>
      </LiyonDialog>

      {/* Remove Confirmation Modal */}
      <LiyonDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <LiyonDialogHeader
          title="ยืนยันการถอดถอนผู้สอน"
          description={`คุณต้องการถอดถอน ${deleteTarget?.user?.name} ออกจากรายวิชานี้ใช่หรือไม่?`}
        />
        <LiyonDialogCloseButton label="ปิด" />
        <LiyonDialogBody className="text-xs text-slate-500">
          เมื่อถอดถอนแล้ว อาจารย์ท่านนี้จะไม่สามารถเข้าถึงหรือจัดการข้อมูลการเช็กชื่อของรายวิชานี้ได้อีก
        </LiyonDialogBody>
        <LiyonDialogFooter className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setDeleteTarget(null)}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleRemoveTeacher}
            className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-50"
          >
            {isSubmitting ? "กำลังถอดถอน..." : "ยืนยันการถอดถอน"}
          </button>
        </LiyonDialogFooter>
      </LiyonDialog>
    </div>
  );
}
