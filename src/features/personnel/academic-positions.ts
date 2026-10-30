/**
 * Academic Positions and Official Appointment Attachments
 * Represents official appointment orders, academic executive roles, and committee appointments
 * along with verifiable file attachments (PDF, JPG, PNG).
 */

export interface AcademicPositionItem {
  id: string;
  category: "ACADEMIC_ADMIN" | "COMMITTEE"; // ก. ตำแหน่งทางวิชาการ/บริหาร หรือ ข. กรรมการ
  title: string; // ชื่อตำแหน่ง เช่น ประธานหลักสูตรพุทธศาสตรบัณฑิต สาขาวิชาการจัดการเชิงพุทธ
  orderNo?: string; // เลขที่คำสั่งแต่งตั้ง (ถ้ามี)
  year?: string; // ปี พ.ศ.
  fileUrl?: string; // ลิงก์ไฟล์หลักฐาน (PDF หรือ รูปภาพ)
  fileType?: "pdf" | "jpg" | "png" | "link";
}

/** ตรวจสอบนามสกุลไฟล์หลักฐานเพื่อคืนค่า badge type */
export function detectAttachmentType(url?: string | null): "pdf" | "jpg" | "png" | "link" | null {
  if (!url || typeof url !== "string") return null;
  const clean = url.toLowerCase().split("?")[0].trim();
  if (clean.endsWith(".pdf") || clean.includes(".pdf")) return "pdf";
  if (clean.endsWith(".jpg") || clean.endsWith(".jpeg")) return "jpg";
  if (clean.endsWith(".png")) return "png";
  if (clean.startsWith("http://") || clean.startsWith("https://")) return "link";
  return "pdf";
}

/** ดึงรายการตำแหน่งและคำสั่งแต่งตั้งทั้งหมดจากฟิลด์ experiencesTh */
export function parseAcademicPositions(rawExperiences?: string | null): AcademicPositionItem[] {
  if (!rawExperiences) return [];
  const trimmed = rawExperiences.trim();

  // 1. JSON object with { positions: [...] }
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed.positions)) {
        return parsed.positions.map((p: Partial<AcademicPositionItem>, idx: number) => ({
          id: p.id || `pos-${idx}-${Date.now()}`,
          category: (p.category === "COMMITTEE" ? "COMMITTEE" : "ACADEMIC_ADMIN") as "ACADEMIC_ADMIN" | "COMMITTEE",
          title: String(p.title || "").trim(),
          orderNo: p.orderNo ? String(p.orderNo).trim() : undefined,
          year: p.year ? String(p.year).trim() : undefined,
          fileUrl: p.fileUrl ? String(p.fileUrl).trim() : undefined,
          fileType: p.fileType || detectAttachmentType(p.fileUrl) || undefined,
        })).filter((p: AcademicPositionItem) => Boolean(p.title));
      }
    } catch {
      // fallback
    }
  }

  // 2. Direct JSON Array of positions
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.some((p) => p && typeof p === "object" && ("category" in p || "fileUrl" in p))) {
        return parsed.map((p: Partial<AcademicPositionItem>, idx: number) => ({
          id: p.id || `pos-${idx}-${Date.now()}`,
          category: (p.category === "COMMITTEE" ? "COMMITTEE" : "ACADEMIC_ADMIN") as "ACADEMIC_ADMIN" | "COMMITTEE",
          title: String(p.title || "").trim(),
          orderNo: p.orderNo ? String(p.orderNo).trim() : undefined,
          year: p.year ? String(p.year).trim() : undefined,
          fileUrl: p.fileUrl ? String(p.fileUrl).trim() : undefined,
          fileType: p.fileType || detectAttachmentType(p.fileUrl) || undefined,
        })).filter((p: AcademicPositionItem) => Boolean(p.title));
      }
    } catch {
      // fallback
    }
  }

  // 3. Plain Text fallback: หากเป็นข้อความธรรมดา แต่ไม่ใช่ Teaching Courses JSON
  if (!trimmed.startsWith("[") && !trimmed.startsWith("{")) {
    const lines = trimmed.split("\n").map((l) => l.trim()).filter(Boolean);
    const result: AcademicPositionItem[] = [];
    lines.forEach((line, idx) => {
      // ข้ามหัวข้อหรือเส้นคั่น
      if (line.startsWith("#") || line.startsWith("---") || line.length < 3) return;

      const isCommittee =
        line.includes("กรรมการ") || line.includes("คณะกรรมการ") || line.includes("อนุกรรมการ");

      result.push({
        id: `pos-txt-${idx}`,
        category: isCommittee ? "COMMITTEE" : "ACADEMIC_ADMIN",
        title: line.replace(/^[-•*]\s*/, ""),
      });
    });
    return result;
  }

  return [];
}

/** รวม courses และ positions ให้เป็น JSON String เดียวกันเพื่อบันทึกใน experiencesTh */
export function serializeExperiencesWithPositions(courses: unknown[], positions: AcademicPositionItem[]): string {
  if (positions.length === 0 && courses.length > 0) {
    return JSON.stringify(courses);
  }
  if (courses.length === 0 && positions.length === 0) {
    return "";
  }
  return JSON.stringify({
    courses,
    positions,
  });
}
