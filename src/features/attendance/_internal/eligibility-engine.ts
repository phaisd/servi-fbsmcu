/**
 * Engine สำหรับคำนวณอัตราการเข้าเรียนและสิทธิ์สอบ
 * ตามเกณฑ์ไม่น้อยกว่า 80% (สอดคล้องกับระเบียบมหาวิทยาลัย)
 */

export interface CalculationRules {
  lateCountsAsFull: boolean;
  excuseDeductsDenominator: boolean;
  minPercent: number;
}

export const DEFAULT_RULES: CalculationRules = {
  lateCountsAsFull: true,
  excuseDeductsDenominator: false,
  minPercent: 80.0,
};

export type AttendanceStatusType = "PENDING" | "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

export interface StudentAttendanceSummary {
  studentId: string;
  enrollmentId: string;
  studentCode: string;
  studentName: string;
  yearLevel?: number;
  department?: string | null;
  
  // สรุปจำนวนคาบ
  pendingCount: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  excusedCount: number;
  
  // ตัวเลขที่ใช้คิดคำนวณ
  attendedCount: number;       // จำนวนคาบที่นับเป็นการเข้าเรียน
  evaluatedCount: number;      // จำนวนคาบที่จัดและใช้คำนวณ (ตัวหาร)
  totalCourseSessions: number; // จำนวนคาบทั้งหมดที่กำหนดไว้ของวิชา (เช่น 16)
  remainingSessions: number;   // จำนวนคาบที่ยังไม่จัดและคิดสิทธิ์ได้
  
  // ผลลัพธ์
  percentage: number;          // ค่าจริงทศนิยม (Unrounded)
  percentageDisplay: string;   // แสดงผลทศนิยม 2 ตำแหน่ง
  hasEnoughData: boolean;      // มีข้อมูลคาบที่จัดแล้วเพียงพอหรือไม่
  isEligible: boolean | null;  // true=มีสิทธิ์สอบ, false=หมดสิทธิ์สอบ, null=ยังไม่มีข้อมูล
  statusText: string;          // ข้อความอธิบายสถานะภาษาไทย
  
  // การคาดการณ์
  maxPossiblePercentage: number; // ร้อยละสูงสุดที่เป็นไปได้หากเข้าเรียนครบทุกคาบที่เหลือ
  requiredRemainingToPass: number; // จำนวนคาบที่ต้องเข้าเพิ่มเป็นอย่างน้อยเพื่อให้ได้สิทธิ์สอบ
}

/**
 * คำนวณสรุปเวลาเรียนและสิทธิ์สอบของนิสิต 1 คน
 */
export function calculateStudentEligibility(params: {
  studentId: string;
  enrollmentId: string;
  studentCode: string;
  studentName: string;
  yearLevel?: number;
  department?: string | null;
  records: Array<{ status: AttendanceStatusType; isCountedSession: boolean; sessionStatus: string }>;
  totalScheduledCountedSessions: number; // จำนวนคาบที่เปิดสอนและคิดคะแนนทั้งหมดในรายวิชา
  totalConductedCountedSessions: number; // จำนวนคาบที่จัดสอนแล้ว (COMPLETED หรือ IN_PROGRESS)
  rules?: Partial<CalculationRules>;
}): StudentAttendanceSummary {
  const rules = { ...DEFAULT_RULES, ...(params.rules || {}) };
  
  let pending = 0;
  let present = 0;
  let late = 0;
  let absent = 0;
  let excused = 0;

  for (const r of params.records) {
    if (!r.isCountedSession || r.sessionStatus === "CANCELLED") continue;
    switch (r.status) {
      case "PENDING":
        pending++;
        break;
      case "PRESENT":
        present++;
        break;
      case "LATE":
        late++;
        break;
      case "ABSENT":
        absent++;
        break;
      case "EXCUSED":
        excused++;
        break;
    }
  }

  // 1. จำนวนคาบที่นับเป็นเข้าเรียน
  const attendedCount = present + (rules.lateCountsAsFull ? late : late * 0.5);

  // 2. ตัวหารที่ใช้คำนวณ
  let evaluatedCount = params.totalConductedCountedSessions;
  if (rules.excuseDeductsDenominator) {
    evaluatedCount = Math.max(0, evaluatedCount - excused);
  }

  // 3. คิดร้อยละ (ใช้ค่าจริง Exact Double precision)
  let percentage = 0;
  let hasEnoughData = false;
  let isEligible: boolean | null = null;
  let statusText = "ยังไม่มีข้อมูลเพียงพอ";

  if (evaluatedCount > 0) {
    hasEnoughData = true;
    percentage = (attendedCount / evaluatedCount) * 100;
    
    // เกณฑ์ตัดสิน: ใช้ค่าจริงก่อนปัดเศษ เช่น 79.999% < 80.00% = ไม่มีสิทธิ์
    if (percentage >= rules.minPercent) {
      isEligible = true;
      statusText = "มีสิทธิ์สอบ";
    } else {
      isEligible = false;
      statusText = "หมดสิทธิ์สอบ (เวลาเรียนไม่ถึง 80%)";
    }
  } else {
    hasEnoughData = false;
    isEligible = null;
    statusText = "ยังไม่มีข้อมูลการเรียนการสอน";
  }

  // 4. การคาดการณ์คาบที่เหลือ
  const remainingSessions = Math.max(0, params.totalScheduledCountedSessions - params.totalConductedCountedSessions);
  const totalPotentialSessions = evaluatedCount + remainingSessions;
  const maxPossibleAttended = attendedCount + remainingSessions;
  const maxPossiblePercentage = totalPotentialSessions > 0 ? (maxPossibleAttended / totalPotentialSessions) * 100 : 0;

  // คาบที่ต้องเข้าเรียนเพิ่มเพื่อให้ร้อยละของทั้งเทอมถึง 80%
  // Formula: (attendedCount + X) / totalPotentialSessions >= 0.80
  // => attendedCount + X >= 0.80 * totalPotentialSessions
  // => X >= (0.80 * totalPotentialSessions) - attendedCount
  const targetAttended = (rules.minPercent / 100) * totalPotentialSessions;
  let requiredRemainingToPass = Math.max(0, Math.ceil(targetAttended - attendedCount));
  if (requiredRemainingToPass > remainingSessions) {
    requiredRemainingToPass = -1; // ไม่สามารถเข้าเรียนให้ทัน 80% ได้แล้ว
  }

  return {
    studentId: params.studentId,
    enrollmentId: params.enrollmentId,
    studentCode: params.studentCode,
    studentName: params.studentName,
    yearLevel: params.yearLevel,
    department: params.department,
    pendingCount: pending,
    presentCount: present,
    lateCount: late,
    absentCount: absent,
    excusedCount: excused,
    attendedCount,
    evaluatedCount,
    totalCourseSessions: params.totalScheduledCountedSessions,
    remainingSessions,
    percentage,
    percentageDisplay: percentage.toFixed(2),
    hasEnoughData,
    isEligible,
    statusText,
    maxPossiblePercentage,
    requiredRemainingToPass,
  };
}
