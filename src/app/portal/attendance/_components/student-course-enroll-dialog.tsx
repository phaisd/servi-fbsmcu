/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  BookOpen,
  Plus,
  Check,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Upload,
  FileText,
  User,
  FileCheck,
} from "lucide-react";
import {
  LiyonDialog,
  LiyonDialogHeader,
  LiyonDialogBody,
  LiyonDialogFooter,
  LiyonDialogCloseButton,
} from "@/shared/components/liyon";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  getAvailableCoursesForStudentAction,
  studentSelfEnrollCoursesAction,
} from "@/features/attendance/actions";

interface AvailableCourse {
  id: string;
  courseCode: string;
  courseName: string;
  courseNameEn?: string | null;
  term: string;
  academicYear: string;
  semester: number;
  credits: number;
  section: string;
  room?: string | null;
  dayOfWeek?: number | null;
  startTime?: string | null;
  endTime?: string | null;
  description?: string | null;
  primaryTeacherName: string;
  totalEnrolled: number;
  totalSessions: number;
  isEnrolled: boolean;
}

interface StudentProfileInfo {
  id?: string;
  studentCode?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  department?: string | null;
  degree?: string | null;
  yearLevel?: number | null;
}

interface StudentCourseEnrollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentCode: string;
  initialStudentData?: StudentProfileInfo | null;
  onEnrollmentSuccess?: () => void;
}

export function StudentCourseEnrollDialog({
  open,
  onOpenChange,
  studentCode,
  initialStudentData,
  onEnrollmentSuccess,
}: StudentCourseEnrollDialogProps) {
  const [activeTab, setActiveTab] = useState<"catalog" | "import">("catalog");
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [availableCourses, setAvailableCourses] = useState<AvailableCourse[]>([]);
  const [availableTerms, setAvailableTerms] = useState<string[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [degreeFilter, setDegreeFilter] = useState<string>("ALL");
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Profile data for student (if not in DB)
  const [studentInfo, setStudentInfo] = useState<StudentProfileInfo | null>(initialStudentData || null);
  const [newProfileForm, setNewProfileForm] = useState({
    firstName: "",
    lastName: "",
    title: "นาย",
    degree: "ปริญญาตรี",
    department: "สาขาวิชาพระพุทธศาสนา",
    yearLevel: 1,
  });
  const [needsProfileForm, setNeedsProfileForm] = useState(false);

  // Tab 2: Import from Registration Slip / Text
  const [slipText, setSlipText] = useState("");
  const [fileName, setFileName] = useState("");
  const [isParsingSlip, setIsParsingSlip] = useState(false);
  const [parsedMatchedCourseIds, setParsedMatchedCourseIds] = useState<string[]>([]);
  const [unmatchedCodes, setUnmatchedCodes] = useState<string[]>([]);
  const [hasScanned, setHasScanned] = useState(false);

  const loadCourses = React.useCallback(async () => {
    setIsLoadingCourses(true);
    try {
      const res = await getAvailableCoursesForStudentAction(studentCode);
      if (res && res.courses) {
        setAvailableCourses(res.courses || []);
        setAvailableTerms(res.availableTerms || []);
        if (res.availableTerms && res.availableTerms.length > 0 && selectedTerm === "ALL") {
          setSelectedTerm(res.availableTerms[0]); // Default to latest term
        }
        if (res.student) {
          setStudentInfo(res.student);
          setNeedsProfileForm(false);
        } else if (!initialStudentData) {
          setNeedsProfileForm(true);
        }
      }
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || "ไม่สามารถดึงรายวิชาที่เปิดสอนได้");
    } finally {
      setIsLoadingCourses(false);
    }
  }, [studentCode, selectedTerm, initialStudentData]);

  // Fetch courses when dialog opens or studentCode changes
  useEffect(() => {
    if (open && studentCode) {
      void loadCourses();
    }
  }, [open, studentCode, loadCourses]);

  useEffect(() => {
    if (initialStudentData) {
      setStudentInfo(initialStudentData);
      setNeedsProfileForm(false);
    }
  }, [initialStudentData]);

  // Filtered courses in catalog
  const filteredCourses = useMemo(() => {
    return availableCourses.filter((course) => {
      // 1. Term filter
      if (selectedTerm !== "ALL" && course.term !== selectedTerm) {
        return false;
      }

      // 2. Search query (code, name, instructor)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const code = course.courseCode.toLowerCase().replace(/\s+/g, "");
        const name = course.courseName.toLowerCase();
        const nameEn = (course.courseNameEn || "").toLowerCase();
        const teacher = course.primaryTeacherName.toLowerCase();
        const cleanQ = q.replace(/\s+/g, "");

        const matches =
          code.includes(cleanQ) ||
          course.courseCode.toLowerCase().includes(q) ||
          name.includes(q) ||
          nameEn.includes(q) ||
          teacher.includes(q);

        if (!matches) return false;
      }

      // 3. Degree / Department tag filter
      if (degreeFilter !== "ALL") {
        const meta = `${course.description || ""} ${course.courseName} ${course.courseCode}`.toLowerCase();
        if (degreeFilter === "BACHELOR" && (meta.includes("โท") || meta.includes("เอก") || meta.includes("มหาบัณฑิต") || meta.includes("ดุษฎีบัณฑิต"))) {
          return false;
        }
        if (degreeFilter === "MASTER" && !meta.includes("โท") && !meta.includes("มหาบัณฑิต")) {
          return false;
        }
        if (degreeFilter === "DOCTORATE" && !meta.includes("เอก") && !meta.includes("ดุษฎีบัณฑิต")) {
          return false;
        }
      }

      return true;
    });
  }, [availableCourses, selectedTerm, searchQuery, degreeFilter]);

  // Toggle selection for batch enroll
  function toggleCourseSelection(courseId: string) {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  }

  function handleSelectAllFiltered() {
    const unEnrolledFilteredIds = filteredCourses.filter((c) => !c.isEnrolled).map((c) => c.id);
    const allSelected = unEnrolledFilteredIds.every((id) => selectedCourseIds.includes(id));
    if (allSelected) {
      setSelectedCourseIds((prev) => prev.filter((id) => !unEnrolledFilteredIds.includes(id)));
    } else {
      setSelectedCourseIds((prev) => Array.from(new Set([...prev, ...unEnrolledFilteredIds])));
    }
  }

  // Handle Enrollment Submission
  async function handleSubmitEnrollment(courseIdsToEnroll: string[], notes?: string) {
    if (courseIdsToEnroll.length === 0) {
      toast.error("กรุณาเลือกรายวิชาที่ต้องการลงทะเบียนอย่างน้อย 1 วิชา");
      return;
    }

    if (needsProfileForm) {
      if (!newProfileForm.firstName.trim() || !newProfileForm.lastName.trim()) {
        toast.error("กรุณากรอกชื่อและนามสกุลของนิสิตให้ครบถ้วน");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await studentSelfEnrollCoursesAction({
        studentCode,
        courseIds: courseIdsToEnroll,
        notes: notes || "นิสิตลงทะเบียนรายวิชาด้วยตนเองผ่าน Student Portal",
        studentProfile: needsProfileForm ? newProfileForm : undefined,
      });

      if (res.success) {
        toast.success(
          `ลงทะเบียนสำเร็จ ${res.enrolledCount} รายวิชา` +
            (res.alreadyEnrolledCount > 0 ? ` (ลงทะเบียนไว้แล้ว ${res.alreadyEnrolledCount} วิชา)` : "")
        );
        setSelectedCourseIds([]);
        setParsedMatchedCourseIds([]);
        setSlipText("");
        setHasScanned(false);
        onOpenChange(false);
        if (onEnrollmentSuccess) {
          onEnrollmentSuccess();
        }
      }
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || "เกิดข้อผิดพลาดในการลงทะเบียน");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Text / File Parsing for Tab 2
  function handleScanSlip() {
    const raw = slipText.trim();
    if (!raw) {
      toast.error("กรุณาวางข้อความตารางเรียน หรือรหัสวิชาจากใบลงทะเบียน");
      return;
    }

    setIsParsingSlip(true);
    try {
      // 1. Extract course code candidates from text
      // Regex 1: 3 digits + optional space + 3 digits (e.g. 400 101, 000 115, 401201)
      const regex6Digit = /\b(\d{3})\s?(\d{3})\b/g;
      // Regex 2: Standard alphanumeric codes like ENG101, PY302
      const regexAlpha = /\b([A-Za-z]{2,4})\s?(\d{3,4})\b/g;

      const candidates = new Set<string>();
      let match;
      while ((match = regex6Digit.exec(raw)) !== null) {
        // Store both unified format "400 101" and "400101"
        candidates.add(`${match[1]} ${match[2]}`);
        candidates.add(`${match[1]}${match[2]}`);
      }
      while ((match = regexAlpha.exec(raw)) !== null) {
        candidates.add(`${match[1]} ${match[2]}`.toUpperCase());
        candidates.add(`${match[1]}${match[2]}`.toUpperCase());
      }

      // Also check against all known course codes in availableCourses
      const matchedCourseIds: string[] = [];
      const foundCourseCodes = new Set<string>();

      availableCourses.forEach((c) => {
        const code = c.courseCode.trim();
        const codeCompact = code.replace(/\s+/g, "");
        if (
          candidates.has(code) ||
          candidates.has(codeCompact) ||
          raw.includes(code) ||
          raw.includes(codeCompact)
        ) {
          if (!c.isEnrolled) {
            matchedCourseIds.push(c.id);
          }
          foundCourseCodes.add(code);
        }
      });

      // Find candidates that didn't match any course in faculty system
      const unmatched: string[] = [];
      candidates.forEach((cand) => {
        if (!cand.includes(" ")) return; // only keep spaced standard format for display
        const isMatched = Array.from(foundCourseCodes).some(
          (fc) => fc.replace(/\s+/g, "") === cand.replace(/\s+/g, "")
        );
        if (!isMatched) {
          unmatched.push(cand);
        }
      });

      setParsedMatchedCourseIds(matchedCourseIds);
      setUnmatchedCodes(unmatched);
      setHasScanned(true);

      if (matchedCourseIds.length > 0) {
        toast.success(`ตรวจพบ ${matchedCourseIds.length} รายวิชาที่เปิดสอนในคณะ`);
      } else {
        toast.info("ไม่พบรหัสวิชาที่ตรงกับรายวิชาที่เปิดสอนในคณะในข้อความนี้");
      }
    } finally {
      setIsParsingSlip(false);
    }
  }

  // Handle File Upload text extraction
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    // Simple reader for txt / csv / json
    if (file.type.includes("text") || file.name.endsWith(".txt") || file.name.endsWith(".csv")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = (event.target?.result as string) || "";
        setSlipText(text);
        toast.success(`อ่านไฟล์ ${file.name} เรียบร้อยแล้ว กด 'วิเคราะห์และตรวจหารหัสวิชา' ได้เลยครับ`);
      };
      reader.readAsText(file);
    } else {
      // PDF or Image notice
      toast.info(
        `เลือกไฟล์ ${file.name} แล้ว — แนะนำให้คัดลอก (Copy) ข้อความรหัสวิชาจากระบบ reg.mcu.ac.th มาวางในช่องด้านล่างเพื่อความแม่นยำสูงสุด`
      );
    }
  }

  return (
    <LiyonDialog open={open} onOpenChange={onOpenChange} wide>
      <LiyonDialogCloseButton label="ปิด" />
      <LiyonDialogHeader
        title={
          <span className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <span>ลงทะเบียนรายวิชาเข้าชั้นเรียน (Add Courses)</span>
          </span>
        }
        description="เลือกรายวิชาเพื่อเข้าชั้นเรียนตามการลงทะเบียนฝ่ายทะเบียนกลาง มจร."
      />

      <LiyonDialogBody className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
        {/* Student Profile Identity Banner */}
        <div className="p-3.5 rounded-xl bg-muted/50 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">
                  {studentInfo ? studentInfo.fullName : `นิสิตรหัส ${studentCode}`}
                </span>
                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-mono font-bold">
                  {studentCode}
                </span>
              </div>
              <div className="text-muted-foreground mt-0.5">
                {studentInfo?.department || "คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย"}
                {studentInfo?.yearLevel ? ` • ชั้นปีที่ ${studentInfo.yearLevel}` : ""}
              </div>
            </div>
          </div>

          <div className="text-muted-foreground text-[11px] bg-background/80 px-2.5 py-1 rounded-md border border-border/60">
            สถานะ: บัญชีนิสิตถูกต้องพร้อมลงทะเบียน
          </div>
        </div>

        {/* First time Student Profile prompt if not in DB */}
        {needsProfileForm && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">ยังไม่พบข้อมูลประวัตินิสิตรหัสนี้ในฐานข้อมูลคณะ</p>
                <p className="text-muted-foreground text-[11px]">
                  กรุณาระบุชื่อ-นามสกุล และสาขาวิชาเพื่อบันทึกประวัตินิสิตเข้าสู่ระบบพร้อมลงทะเบียน
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div>
                <label className="block text-[11px] font-semibold mb-1">คำนำหน้า</label>
                <select
                  value={newProfileForm.title}
                  onChange={(e) => setNewProfileForm({ ...newProfileForm, title: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs"
                >
                  <option value="พระ">พระ</option>
                  <option value="พระมหา">พระมหา</option>
                  <option value="พระครู">พระครู</option>
                  <option value="สามเณร">สามเณร</option>
                  <option value="แม่ชี">แม่ชี</option>
                  <option value="นาย">นาย</option>
                  <option value="นางสาว">นางสาว</option>
                  <option value="นาง">นาง</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1">ชื่อ</label>
                <input
                  type="text"
                  placeholder="เช่น มหาประสงค์"
                  value={newProfileForm.firstName}
                  onChange={(e) => setNewProfileForm({ ...newProfileForm, firstName: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1">นามสกุล</label>
                <input
                  type="text"
                  placeholder="เช่น ญาณเมธี"
                  value={newProfileForm.lastName}
                  onChange={(e) => setNewProfileForm({ ...newProfileForm, lastName: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab("catalog")}
            className={`pb-3 px-4 text-xs font-bold transition-all relative flex items-center gap-2 ${
              activeTab === "catalog"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Search className="w-4 h-4" />
            <span>1. ค้นหาและเลือกลงทะเบียนรายวิชา (ฟังก์ชันหลัก)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("import")}
            className={`pb-3 px-4 text-xs font-bold transition-all relative flex items-center gap-2 ${
              activeTab === "import"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>2. วางข้อความ / แนบใบลงทะเบียนเพื่อดึงวิชาอัตโนมัติ (ตัวช่วย)</span>
          </button>
        </div>

        {/* TAB 1: Search & Catalog Selection */}
        {activeTab === "catalog" && (
          <div className="space-y-4">
            {/* Filter Controls Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหารหัสวิชา (เช่น 400 101), ชื่อวิชา, หรือชื่ออาจารย์ผู้สอน..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-input bg-background text-xs focus:ring-2 focus:ring-primary shadow-2xs"
                />
              </div>

              {/* Term Filter */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-input bg-background text-xs font-medium focus:ring-2 focus:ring-primary"
                >
                  <option value="ALL">ทุกภาคการศึกษา</option>
                  {availableTerms.map((t) => (
                    <option key={t} value={t}>
                      ภาคเรียน {t}
                    </option>
                  ))}
                </select>

                <select
                  value={degreeFilter}
                  onChange={(e) => setDegreeFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-input bg-background text-xs font-medium focus:ring-2 focus:ring-primary"
                >
                  <option value="ALL">ทุกระดับการศึกษา</option>
                  <option value="BACHELOR">ปริญญาตรี</option>
                  <option value="MASTER">ปริญญาโท</option>
                  <option value="DOCTORATE">ปริญญาเอก</option>
                </select>
              </div>
            </div>

            {/* Selection Status & Batch Controls */}
            <div className="flex items-center justify-between text-xs py-1 px-1">
              <span className="text-muted-foreground">
                แสดง {filteredCourses.length} รายวิชาที่เปิดสอน
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="text-primary hover:underline font-semibold"
                >
                  เลือกทั้งหมดในหน้านี้
                </button>
                {selectedCourseIds.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                    เลือกไว้ {selectedCourseIds.length} วิชา
                  </span>
                )}
              </div>
            </div>

            {/* Course Cards List */}
            {isLoadingCourses ? (
              <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p>กำลังโหลดรายวิชาที่เปิดสอน...</p>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground border border-dashed rounded-xl space-y-1">
                <p className="font-semibold text-foreground">ไม่พบรายวิชาตามเงื่อนไขที่ค้นหา</p>
                <p>ลองปรับคำค้นหา หรือเลือกภาคการศึกษาอื่น</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {filteredCourses.map((course) => {
                  const isSelected = selectedCourseIds.includes(course.id);
                  const isEnrolled = course.isEnrolled;

                  return (
                    <div
                      key={course.id}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isEnrolled
                          ? "bg-muted/30 border-border opacity-70"
                          : isSelected
                          ? "bg-primary/5 border-primary shadow-xs"
                          : "bg-card border-border hover:border-primary/40 hover:shadow-2xs"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {!isEnrolled && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleCourseSelection(course.id)}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                          />
                        )}

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-muted text-foreground font-mono font-bold text-xs">
                              {course.courseCode}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {course.credits} หน่วยกิต • ภาคเรียน {course.term} • กลุ่ม {course.section}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-foreground">
                            {course.courseName}
                          </h4>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span>ผู้สอน: {course.primaryTeacherName}</span>
                            {course.room && <span>• ห้องเรียน: {course.room}</span>}
                            {course.startTime && (
                              <span>
                                • เวลา: {course.startTime} - {course.endTime || ""} น.
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Action */}
                      <div className="shrink-0 flex items-center justify-end">
                        {isEnrolled ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                            <Check className="w-3.5 h-3.5" />
                            ลงทะเบียนแล้ว
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant={isSelected ? "default" : "outline"}
                            disabled={isSubmitting}
                            onClick={() => handleSubmitEnrollment([course.id])}
                            className="text-xs gap-1 rounded-xl h-8 px-3"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>ลงทะเบียนวิชานี้</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Text / Slip Import Helper */}
        {activeTab === "import" && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-900 dark:text-blue-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>ตัวช่วยดึงวิชาอัตโนมัติจากระบบทะเบียนกลาง มจร. (reg.mcu.ac.th)</span>
              </div>
              <p className="text-muted-foreground text-[11px]">
                เพียงคัดลอกข้อความตารางเรียน หรือรหัสวิชาจากใบลงทะเบียน/ใบเสร็จมาวางในช่องด้านล่าง
                ระบบจะวิเคราะห์และจับคู่รหัสวิชาของคณะให้ทันทีโดยไม่ต้องค้นหาทีละวิชา
              </p>
            </div>

            {/* Input Options: File Upload & Text Area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  วางข้อความตารางเรียน หรือรหัสวิชา
                </label>

                {/* Optional File Picker */}
                <label className="cursor-pointer text-primary hover:underline inline-flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" />
                  <span>แนบไฟล์ตารางเรียน (.txt, .csv)</span>
                  <input
                    type="file"
                    accept=".txt,.csv,.pdf,image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {fileName && (
                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 bg-muted/60 px-3 py-1.5 rounded-lg">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ไฟล์ที่เลือก: <strong>{fileName}</strong></span>
                </div>
              )}

              <textarea
                rows={5}
                value={slipText}
                onChange={(e) => setSlipText(e.target.value)}
                placeholder="ตัวอย่างข้อความที่วางได้:&#10;400 101 พระไตรปิฎกศึกษา 3 หน่วยกิต&#10;000 115 ภาษาบาลี 2 หน่วยกิต&#10;401 201 ประวัติศาสตร์พระพุทธศาสนา..."
                className="w-full p-3 rounded-xl border border-input bg-background font-mono text-xs focus:ring-2 focus:ring-primary shadow-inner"
              />

              <div className="flex justify-end pt-1">
                <Button
                  type="button"
                  disabled={isParsingSlip || !slipText.trim()}
                  onClick={handleScanSlip}
                  className="gap-2 rounded-xl text-xs px-4"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isParsingSlip ? "กำลังวิเคราะห์..." : "⚡ วิเคราะห์และตรวจหารหัสวิชา"}</span>
                </Button>
              </div>
            </div>

            {/* Scanned Results */}
            {hasScanned && (
              <div className="space-y-3 pt-3 border-t border-border animate-in fade-in-50">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>ผลการวิเคราะห์: พบ {parsedMatchedCourseIds.length} รายวิชาในคณะ</span>
                  </h4>

                  {parsedMatchedCourseIds.length > 0 && (
                    <span className="text-[11px] text-muted-foreground">
                      พร้อมลงทะเบียนในคลิกเดียว
                    </span>
                  )}
                </div>

                {parsedMatchedCourseIds.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed text-center text-xs text-muted-foreground">
                    ไม่พบรหัสวิชาที่ตรงกับรายวิชาที่คณะเปิดสอนในข้อความที่ระบุ
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {parsedMatchedCourseIds.map((courseId) => {
                      const course = availableCourses.find((c) => c.id === courseId);
                      if (!course) return null;

                      return (
                        <div
                          key={course.id}
                          className="p-3 rounded-xl border bg-emerald-500/5 border-emerald-500/20 flex items-center justify-between text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-mono font-bold text-[11px]">
                                {course.courseCode}
                              </span>
                              <span className="font-bold text-foreground">
                                {course.courseName}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              {course.credits} หน่วยกิต • ผู้สอน: {course.primaryTeacherName}
                            </p>
                          </div>

                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
                            ตรวจพบในระบบ
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Unmatched Notice */}
                {unmatchedCodes.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
                    <p className="font-semibold">
                      ตรวจพบรหัสเพิ่มเติมที่ไม่ได้เปิดในคณะพุทธศาสตร์ ({unmatchedCodes.length} รหัส):
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-1 font-mono text-[11px]">
                      {unmatchedCodes.map((code) => (
                        <span key={code} className="px-1.5 py-0.5 rounded bg-amber-500/15">
                          {code}
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      *อาจเป็นรายวิชาศึกษาทั่วไปส่วนกลาง หรือรายวิชาของคณะอื่น
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </LiyonDialogBody>

      <LiyonDialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border">
        <div className="text-xs text-muted-foreground">
          {activeTab === "catalog" && selectedCourseIds.length > 0 && (
            <span>เลือกไว้แล้ว <strong>{selectedCourseIds.length}</strong> วิชา</span>
          )}
          {activeTab === "import" && parsedMatchedCourseIds.length > 0 && (
            <span>พร้อมลงทะเบียน <strong>{parsedMatchedCourseIds.length}</strong> วิชาจากใบลงทะเบียน</span>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="rounded-xl text-xs"
          >
            ยกเลิก
          </Button>

          {activeTab === "catalog" ? (
            <Button
              type="button"
              disabled={isSubmitting || selectedCourseIds.length === 0}
              onClick={() => handleSubmitEnrollment(selectedCourseIds)}
              className="gap-2 rounded-xl text-xs font-bold shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>ลงทะเบียนวิชาที่เลือก ({selectedCourseIds.length} วิชา)</span>
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              disabled={isSubmitting || parsedMatchedCourseIds.length === 0}
              onClick={() =>
                handleSubmitEnrollment(
                  parsedMatchedCourseIds,
                  `นิสิตลงทะเบียนผ่านระบบ Import ใบลงทะเบียน (${parsedMatchedCourseIds.length} วิชา)`
                )
              }
              className="gap-2 rounded-xl text-xs font-bold shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>ยืนยันลงทะเบียนทั้งหมด ({parsedMatchedCourseIds.length} วิชา)</span>
                </>
              )}
            </Button>
          )}
        </div>
      </LiyonDialogFooter>
    </LiyonDialog>
  );
}