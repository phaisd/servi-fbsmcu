import { NextResponse } from "next/server";
import { getSessionContext } from "@/features/identity/server";
import { ATTENDANCE_P } from "@/features/attendance/permissions";
import { hasPermission } from "@/features/identity/server";
import {
  generateRollingQrToken,
  getSessionScannedStudents,
  assertCourseAccess,
} from "@/features/attendance/server";
import { prisma as db } from "@/shared/lib/infra/prisma";

export async function GET(
  request: Request,
  props: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await props.params;
    const session = await getSessionContext();

    if (!session) {
      return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    // ตรวจสอบสิทธิ์
    if (!session.isSuperAdmin && !hasPermission(session, ATTENDANCE_P.manage)) {
      return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const classSession = await db.classSession.findUnique({
      where: { id: sessionId },
      select: { id: true, courseId: true, tenantId: true },
    });

    if (!classSession || classSession.tenantId !== session.tenantId) {
      return NextResponse.json({ success: false, error: "NOT_FOUND" }, { status: 404 });
    }

    await assertCourseAccess(session.tenantId, classSession.courseId, session.userId, session.isSuperAdmin);

    // สร้าง Token และดึงรายชื่อนิสิตที่สแกนแล้วพร้อมกันในคำขอเดียว
    const [tokenData, scannedData] = await Promise.all([
      generateRollingQrToken(session.tenantId, sessionId),
      getSessionScannedStudents(session.tenantId, sessionId),
    ]);

    return NextResponse.json({
      success: true,
      ...tokenData,
      scanned: scannedData,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
