import { prisma as db } from "@/shared/lib/infra/prisma";

export type { SubQuestion, EvaluationCriterion } from "../templates";
export { DEFAULT_EVALUATION_QUESTIONS, EVALUATION_TEMPLATES } from "../templates";
import { DEFAULT_EVALUATION_QUESTIONS, EVALUATION_TEMPLATES, type EvaluationCriterion } from "../templates";

/**
 * ดึงการตั้งค่าแบบประเมินของกิจกรรม (ถ้ายังไม่มี ให้ใช้แบบประเมินมาตรฐาน มจร)
 */
export async function getEventEvaluationConfig(tenantId: string, eventId: string) {
  const event = await db.event.findFirst({
    where: { id: eventId, tenantId },
  });

  if (!event) {
    throw new Error("ไม่พบข้อมูลกิจกรรมนี้");
  }

  const rows = await db.$queryRaw<Array<{
    id: string;
    title: string;
    description: string | null;
    is_active: boolean;
    questions: any;
  }>>`
    SELECT id, title, description, is_active, questions
    FROM event_evaluation_configs
    WHERE tenant_id = ${tenantId}::uuid AND event_id = ${eventId}::uuid
    LIMIT 1
  `;

  if (rows && rows.length > 0) {
    const config = rows[0];
    let questions = config.questions;
    if (typeof questions === "string") {
      try {
        questions = JSON.parse(questions);
      } catch {
        questions = DEFAULT_EVALUATION_QUESTIONS;
      }
    }
    if (Array.isArray(questions)) {
      questions = questions.map((q: any) => {
        if (!q.subQuestions || !Array.isArray(q.subQuestions) || q.subQuestions.length === 0) {
          const defaultMatch = DEFAULT_EVALUATION_QUESTIONS.find((d) => d.category === q.category);
          if (defaultMatch && defaultMatch.subQuestions) {
            return { ...q, subQuestions: defaultMatch.subQuestions };
          }
        }
        return q;
      });
    }

    return {
      id: config.id,
      title: config.title || "แบบประเมินความพึงพอใจการเข้าร่วมกิจกรรม",
      description: config.description || "เพื่อนำผลการประเมินไปพัฒนาและปรับปรุงการจัดกิจกรรมในครั้งต่อไป",
      isActive: config.is_active ?? true,
      questions: questions || DEFAULT_EVALUATION_QUESTIONS,
    };
  }

  const eventTypeKey = event.eventType ? event.eventType.toUpperCase() : "STANDARD";
  const defaultQuestions = EVALUATION_TEMPLATES[eventTypeKey]?.questions || DEFAULT_EVALUATION_QUESTIONS;

  return {
    id: null,
    title: `แบบประเมินความพึงพอใจ: ${event.title}`,
    description: "เพื่อนำผลการประเมินไปพัฒนาและปรับปรุงการจัดกิจกรรมของคณะพุทธศาสตร์ มจร ในครั้งต่อไป",
    isActive: true,
    questions: defaultQuestions,
  };
}

/**
 * อัปเดต / บันทึกการตั้งค่าแบบประเมิน (แก้ไขหัวข้อคำถามและเปิด-ปิดได้)
 */
export async function updateEventEvaluationConfig(
  tenantId: string,
  eventId: string,
  data: {
    title: string;
    description?: string;
    isActive?: boolean;
    questions: EvaluationCriterion[];
  }
) {
  const questionsJson = JSON.stringify(data.questions);

  await db.$executeRawUnsafe(
    `
    INSERT INTO event_evaluation_configs (tenant_id, event_id, title, description, is_active, questions, updated_at)
    VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6::jsonb, NOW())
    ON CONFLICT (event_id)
    DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      is_active = EXCLUDED.is_active,
      questions = EXCLUDED.questions,
      updated_at = NOW();
    `,
    tenantId,
    eventId,
    data.title,
    data.description || null,
    data.isActive ?? true,
    questionsJson
  );

  return { success: true };
}

/**
 * บันทึกการส่งแบบประเมินความพึงพอใจของนิสิต/ผู้เข้าร่วม (พร้อมเช็คชื่อเข้าร่วมกิจกรรมอัตโนมัติ)
 */
export async function submitEventEvaluation(
  tenantId: string,
  eventId: string,
  submission: {
    studentCode?: string;
    studentName?: string;
    role?: string;
    ratingLecturer: number;
    ratingContent: number;
    ratingFacility: number;
    ratingTime: number;
    ratingOverall: number;
    customAnswers?: Record<string, any>;
    feedback?: string;
  }
) {
  const isAnonymous = !submission.studentCode || submission.studentCode.trim() === "" || submission.studentCode.trim().toUpperCase() === "ANONYMOUS";
  const cleanCode = isAnonymous ? "ANONYMOUS" : (submission.studentCode?.trim() || "ANONYMOUS");

  const event = await db.event.findFirst({
    where: { id: eventId, tenantId },
  });

  if (!event) {
    throw new Error("ไม่พบกิจกรรมนี้");
  }

  let reg: any = null;
  let resolvedName = isAnonymous ? "ผู้ตอบแบบประเมิน (ไม่ระบุตัวตน)" : (submission.studentName || "");
  let resolvedRole = isAnonymous ? "ANONYMOUS" : (submission.role || "STUDENT");

  // หากระบุรหัสนิสิต (ไม่ใช่ Anonymous) ให้ตรวจสอบการลงทะเบียนและเช็คชื่อ
  if (!isAnonymous) {
    reg = await db.eventRegistration.findFirst({
      where: {
        tenantId,
        eventId,
        OR: [
          { studentCode: cleanCode },
          { studentCode: { equals: cleanCode, mode: "insensitive" } },
        ],
      },
    });

    if (reg) {
      resolvedName = reg.studentName;
      resolvedRole = reg.role;
      if (reg.status !== "ATTENDED") {
        await db.eventRegistration.update({
          where: { id: reg.id },
          data: {
            status: "ATTENDED",
            attendedAt: new Date(),
            remarks: "เช็คชื่อผ่านการส่งแบบประเมินความพึงพอใจ",
          },
        });
      }
    } else {
      // ค้นหาในฐานข้อมูลนิสิตเพื่อ Auto Walk-in Registration
      const student = await db.student.findFirst({
        where: { tenantId, studentCode: cleanCode },
      });

      if (student) {
        resolvedName = `${student.title ? student.title + " " : ""}${student.firstName} ${student.lastName}`.trim();
        reg = await db.eventRegistration.create({
          data: {
            tenantId,
            eventId,
            studentCode: student.studentCode,
            studentName: resolvedName,
            role: "STUDENT",
            major: student.major || student.curriculumName || "สาขาวิชาพระพุทธศาสนา",
            yearLevel: student.yearLevel,
            department: student.department || student.faculty || "คณะพุทธศาสตร์",
            status: "ATTENDED",
            attendedAt: new Date(),
            remarks: "เช็คชื่อผ่านการส่งแบบประเมินความพึงพอใจ (Walk-in)",
          },
        });
      } else {
        const personnel = await db.personnel.findFirst({
          where: {
            tenantId,
            OR: [{ email: cleanCode }, { firstNameTh: { contains: cleanCode, mode: "insensitive" } }],
          },
        });

        if (personnel) {
          resolvedName = `${personnel.firstNameTh} ${personnel.lastNameTh}`.trim();
          resolvedRole = personnel.positionTh?.includes("คณบดี") || personnel.positionTh?.includes("อธิการ") ? "EXECUTIVE" : "TEACHER";
          reg = await db.eventRegistration.create({
            data: {
              tenantId,
              eventId,
              studentCode: personnel.email || cleanCode,
              studentName: resolvedName,
              role: resolvedRole,
              department: personnel.positionTh || "บุคลากร มจร",
              status: "ATTENDED",
              attendedAt: new Date(),
              remarks: "เช็คชื่อผ่านการส่งแบบประเมินความพึงพอใจ",
            },
          });
        } else {
          resolvedName = submission.studentName || `รหัส ${cleanCode}`;
        }
      }
    }
  }

  // 3. บันทึกผลการประเมินลงในตาราง event_evaluations
  const customAnswersJson = submission.customAnswers ? JSON.stringify(submission.customAnswers) : null;

  await db.$executeRawUnsafe(
    `
    INSERT INTO event_evaluations (
      tenant_id, event_id, registration_id, student_code, student_name, role,
      rating_lecturer, rating_content, rating_facility, rating_time, rating_overall,
      custom_answers, feedback, created_at
    )
    VALUES (
      $1::uuid, $2::uuid, $3::uuid, $4, $5, $6,
      $7, $8, $9, $10, $11,
      $12::jsonb, $13, NOW()
    )
    `,
    tenantId,
    eventId,
    reg ? reg.id : null,
    cleanCode,
    resolvedName,
    resolvedRole,
    submission.ratingLecturer,
    submission.ratingContent,
    submission.ratingFacility,
    submission.ratingTime,
    submission.ratingOverall,
    customAnswersJson,
    submission.feedback || null
  );

  return {
    success: true,
    studentName: resolvedName,
    studentCode: cleanCode,
    activityHours: event.activityHours,
    eventTitle: event.title,
    certificateEligible: true,
  };
}

/**
 * ดึงรายงานสรุปผลการประเมินความพึงพอใจ (Average Score, S.D., ข้อเสนอแนะ)
 */
export async function getEventEvaluationStats(tenantId: string, eventId: string) {
  const event = await db.event.findFirst({
    where: { id: eventId, tenantId },
  });

  if (!event) {
    throw new Error("ไม่พบกิจกรรมนี้");
  }

  // สรุปค่าเฉลี่ยและส่วนเบี่ยงเบนมาตรฐาน (Mean & S.D.)
  const statsRows = await db.$queryRaw<Array<{
    total_responses: number;
    avg_lecturer: number | null;
    sd_lecturer: number | null;
    avg_content: number | null;
    sd_content: number | null;
    avg_facility: number | null;
    sd_facility: number | null;
    avg_time: number | null;
    sd_time: number | null;
    avg_overall: number | null;
    sd_overall: number | null;
  }>>`
    SELECT
      COUNT(*)::int as total_responses,
      ROUND(AVG(rating_lecturer)::numeric, 2)::float as avg_lecturer,
      COALESCE(ROUND(STDDEV_SAMP(rating_lecturer)::numeric, 2)::float, 0.00) as sd_lecturer,
      ROUND(AVG(rating_content)::numeric, 2)::float as avg_content,
      COALESCE(ROUND(STDDEV_SAMP(rating_content)::numeric, 2)::float, 0.00) as sd_content,
      ROUND(AVG(rating_facility)::numeric, 2)::float as avg_facility,
      COALESCE(ROUND(STDDEV_SAMP(rating_facility)::numeric, 2)::float, 0.00) as sd_facility,
      ROUND(AVG(rating_time)::numeric, 2)::float as avg_time,
      COALESCE(ROUND(STDDEV_SAMP(rating_time)::numeric, 2)::float, 0.00) as sd_time,
      ROUND(AVG(rating_overall)::numeric, 2)::float as avg_overall,
      COALESCE(ROUND(STDDEV_SAMP(rating_overall)::numeric, 2)::float, 0.00) as sd_overall
    FROM event_evaluations
    WHERE tenant_id = ${tenantId}::uuid AND event_id = ${eventId}::uuid
  `;

  const stats = statsRows[0] || {
    total_responses: 0,
    avg_lecturer: 0,
    sd_lecturer: 0,
    avg_content: 0,
    sd_content: 0,
    avg_facility: 0,
    sd_facility: 0,
    avg_time: 0,
    sd_time: 0,
    avg_overall: 0,
    sd_overall: 0,
  };

  const totalResponses = stats.total_responses || 0;
  const avgLecturer = stats.avg_lecturer || 0;
  const sdLecturer = stats.sd_lecturer || 0;
  const avgContent = stats.avg_content || 0;
  const sdContent = stats.sd_content || 0;
  const avgFacility = stats.avg_facility || 0;
  const sdFacility = stats.sd_facility || 0;
  const avgTime = stats.avg_time || 0;
  const sdTime = stats.sd_time || 0;
  const avgOverall = stats.avg_overall || 0;
  const sdOverall = stats.sd_overall || 0;

  // คำนวณคะแนนเฉลี่ยและ SD รวมทุกด้าน
  const grandMean = totalResponses > 0
    ? Number(((avgLecturer + avgContent + avgFacility + avgTime + avgOverall) / 5).toFixed(2))
    : 0;

  const grandSd = totalResponses > 0
    ? Number(((sdLecturer + sdContent + sdFacility + sdTime + sdOverall) / 5).toFixed(2))
    : 0;

  // แปลผลระดับความพึงพอใจตามเกณฑ์มาตรฐาน Likert Scale
  let qualitativeLevel = "ยังไม่มีข้อมูลการประเมิน";
  if (totalResponses > 0) {
    if (grandMean >= 4.51) qualitativeLevel = "มากที่สุด (Highest)";
    else if (grandMean >= 3.51) qualitativeLevel = "มาก (High)";
    else if (grandMean >= 2.51) qualitativeLevel = "ปานกลาง (Moderate)";
    else if (grandMean >= 1.51) qualitativeLevel = "น้อย (Low)";
    else qualitativeLevel = "น้อยที่สุด (Lowest)";
  }

  // ดึงข้อเสนอแนะล่าสุด
  const feedbacks = await db.$queryRaw<Array<{
    student_name: string;
    role: string;
    feedback: string;
    created_at: Date;
  }>>`
    SELECT student_name, role, feedback, created_at
    FROM event_evaluations
    WHERE tenant_id = ${tenantId}::uuid AND event_id = ${eventId}::uuid AND feedback IS NOT NULL AND TRIM(feedback) != ''
    ORDER BY created_at DESC
    LIMIT 30
  `;

  return {
    eventTitle: event.title,
    totalResponses,
    grandMean,
    grandSd,
    qualitativeLevel,
    averages: {
      lecturer: avgLecturer,
      content: avgContent,
      facility: avgFacility,
      time: avgTime,
      overall: avgOverall,
    },
    sds: {
      lecturer: sdLecturer,
      content: sdContent,
      facility: sdFacility,
      time: sdTime,
      overall: sdOverall,
    },
    stats: {
      totalResponses,
      grandMean,
      grandSd,
      qualitativeLevel,
      avgLecturer,
      avgContent,
      avgFacility,
      avgTime,
      avgOverall,
    },
    feedbacks: feedbacks.map((f) => ({
      name: f.student_name,
      role: f.role,
      comment: f.feedback,
      date: f.created_at.toISOString(),
    })),
  };
}
