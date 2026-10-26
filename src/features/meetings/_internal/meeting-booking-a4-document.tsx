import React from "react";
import type { MeetingBookingMetadata } from "./validations";

interface Props {
  metadata: MeetingBookingMetadata;
  roomName?: string;
  roomCapacity?: number;
  docNo?: string;
}

export function MeetingBookingA4Document({
  metadata,
  roomName: _roomName = "ห้องประชุมคณะพุทธศาสตร์ (โซนดี)",
  roomCapacity = 70,
}: Props) {
  // Format Thai dates
  const parseThaiDateParts = (dStr: string) => {
    if (!dStr) return { day: "...", month: "...............", year: "........" };
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return { day: "...", month: "...............", year: "........" };
      const thMonths = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
      ];
      return {
        day: String(d.getDate()),
        month: thMonths[d.getMonth()] || "...............",
        year: String(d.getFullYear() + 543),
      };
    } catch {
      return { day: "...", month: "...............", year: "........" };
    }
  };

  const todayParts = parseThaiDateParts(metadata.requestDate || new Date().toISOString());
  const startParts = parseThaiDateParts(metadata.startDate);
  const endParts = metadata.endDate ? parseThaiDateParts(metadata.endDate) : startParts;

  return (
    <div
      className="mx-auto bg-white text-black print:m-0 print:p-0 shadow-lg print:shadow-none font-sarabun text-[14.5pt] leading-[1.75]"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "20mm 22mm 18mm 22mm",
        boxSizing: "border-box",
        fontFamily: "'TH Sarabun New', 'Sarabun', 'Segoe UI', Tahoma, sans-serif",
      }}
    >
      {/* Header with Emblem */}
      <div className="flex flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/uploads/mcu-official-seal.png"
          alt="MCU Emblem"
          className="h-[80px] w-auto object-contain mb-2 print:block"
          onError={(e) => {
            // Fallback if seal image path differs
            (e.target as HTMLImageElement).src = "/logo.png";
          }}
        />
        <h1 className="text-[17pt] font-bold leading-tight">
          ใบขอใช้ห้องประชุมประจำคณะพุทธศาสตร์
        </h1>
        <p className="text-[14pt] leading-tight">
          มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย ตำบลลำไทร อำเภอวังน้อย จังหวัดพระนครศรีอยุธยา
        </p>
      </div>

      {/* Date */}
      <div className="mt-4 flex justify-end text-[14pt]">
        <div className="w-[60%] text-right">
          วันที่ <span className="font-semibold underline underline-offset-4 decoration-dotted">{todayParts.day}</span> เดือน{" "}
          <span className="font-semibold underline underline-offset-4 decoration-dotted">{todayParts.month}</span> พ.ศ.{" "}
          <span className="font-semibold underline underline-offset-4 decoration-dotted">{todayParts.year}</span>
        </div>
      </div>

      {/* Recipient */}
      <div className="mt-3 text-[14.5pt] font-bold">
        เรียน <span className="font-normal ml-3">เลขานุการสำนักงานคณบดีคณะพุทธศาสตร์</span>
      </div>

      {/* Applicant info */}
      <div className="mt-3 space-y-1.5 text-[14pt]">
        <div className="flex items-baseline flex-wrap">
          <span className="shrink-0 mr-2 indent-8">ข้าพเจ้า</span>
          <span className="flex-1 font-semibold underline underline-offset-4 decoration-dotted min-w-[200px]">
            {metadata.requesterName || ".........................................................................................."}
          </span>
          <span className="shrink-0 mx-2">ตำแหน่ง</span>
          <span className="flex-1 font-semibold underline underline-offset-4 decoration-dotted min-w-[180px]">
            {metadata.requesterPosition || ".........................................................."}
          </span>
        </div>

        <div className="flex items-baseline flex-wrap">
          <span className="shrink-0 mr-2">สังกัดงาน/หน่วยงาน</span>
          <span className="flex-1 font-semibold underline underline-offset-4 decoration-dotted">
            {metadata.requesterDepartment || "............................................................................................................................................."}
          </span>
        </div>

        <div className="flex items-baseline flex-wrap">
          <span className="shrink-0 mr-2">อีเมล์</span>
          <span className="flex-1 font-semibold underline underline-offset-4 decoration-dotted">
            {metadata.requesterEmail || "............................................................................................................................................."}
          </span>
          {metadata.requesterPhone && (
            <>
              <span className="shrink-0 mx-2">โทรศัพท์</span>
              <span className="font-semibold underline underline-offset-4 decoration-dotted min-w-[140px]">
                {metadata.requesterPhone}
              </span>
            </>
          )}
        </div>

        <div className="pt-1">
          <span className="font-bold">มีความประสงค์จะใช้ห้องประชุมคณะพุทธศาสตร์ </span>
          <span>(รองรับจำนวนได้ {roomCapacity || 70} รูป/คน) โซนดี มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย</span>
        </div>

        {/* Purpose selection */}
        <div className="flex items-center gap-4 flex-wrap pt-0.5">
          <span className="font-semibold mr-1">เพื่อ</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-[13pt]">{metadata.purposeType === "MEETING" ? "🔘" : "⚪"}</span> ประชุม
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-[13pt]">{metadata.purposeType === "TRAINING" ? "🔘" : "⚪"}</span> อบรม
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-[13pt]">{metadata.purposeType === "SEMINAR" ? "🔘" : "⚪"}</span> สัมมนา
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-[13pt]">
              {metadata.purposeType !== "MEETING" && metadata.purposeType !== "TRAINING" && metadata.purposeType !== "SEMINAR" ? "🔘" : "⚪"}
            </span>{" "}
            อื่นๆ
            <span className="font-semibold underline underline-offset-4 decoration-dotted ml-1 min-w-[120px]">
              {metadata.purposeType !== "MEETING" && metadata.purposeType !== "TRAINING" && metadata.purposeType !== "SEMINAR"
                ? metadata.purposeOther || metadata.purposeType
                : metadata.purposeOther || "................................................."}
            </span>
          </span>
        </div>

        {/* Topic */}
        <div className="flex items-baseline flex-wrap">
          <span className="shrink-0 mr-2">เรื่อง</span>
          <span className="flex-1 font-semibold underline underline-offset-4 decoration-dotted">
            {metadata.topic || "........................................................................................................................................................................."}
          </span>
        </div>

        {/* Date & Time range */}
        <div className="flex items-baseline flex-wrap">
          <span className="shrink-0 mr-1.5">ใน วันที่</span>
          <span className="font-semibold underline underline-offset-4 decoration-dotted px-1 min-w-[28px] text-center">
            {startParts.day}
          </span>
          <span className="shrink-0 mx-1">เดือน</span>
          <span className="font-semibold underline underline-offset-4 decoration-dotted px-2 min-w-[90px] text-center">
            {startParts.month}
          </span>
          <span className="shrink-0 mx-1">พ.ศ.</span>
          <span className="font-semibold underline underline-offset-4 decoration-dotted px-1 min-w-[50px] text-center">
            {startParts.year}
          </span>
          <span className="shrink-0 ml-2 mr-1">ตั้งแต่เวลา</span>
          <span className="font-semibold underline underline-offset-4 decoration-dotted px-1 min-w-[65px] text-center">
            {metadata.startTimeStr || ".........."}
          </span>
          <span className="shrink-0 mx-1">น. ถึง</span>
          <span className="font-semibold underline underline-offset-4 decoration-dotted px-1 min-w-[65px] text-center">
            {metadata.endTimeStr || ".........."}
          </span>
          <span className="shrink-0 ml-1">น.</span>
        </div>

        <div className="flex items-baseline flex-wrap">
          <span className="shrink-0 mr-1.5">ถึง วันที่</span>
          <span className="font-semibold underline underline-offset-4 decoration-dotted px-1 min-w-[28px] text-center">
            {endParts.day}
          </span>
          <span className="shrink-0 mx-1">เดือน</span>
          <span className="font-semibold underline underline-offset-4 decoration-dotted px-2 min-w-[90px] text-center">
            {endParts.month}
          </span>
          <span className="shrink-0 mx-1">พ.ศ.</span>
          <span className="font-semibold underline underline-offset-4 decoration-dotted px-1 min-w-[50px] text-center">
            {endParts.year}
          </span>
          <span className="shrink-0 ml-2 mr-1">ตั้งแต่เวลา</span>
          <span className="font-semibold underline underline-offset-4 decoration-dotted px-1 min-w-[65px] text-center">
            {metadata.startTimeStr || ".........."}
          </span>
          <span className="shrink-0 mx-1">น. ถึง</span>
          <span className="font-semibold underline underline-offset-4 decoration-dotted px-1 min-w-[65px] text-center">
            {metadata.endTimeStr || ".........."}
          </span>
          <span className="shrink-0 ml-1">น.</span>
        </div>

        <div className="flex items-baseline flex-wrap">
          <span className="shrink-0 mr-2">มีจำนวนผู้เข้าใช้ห้องประชุมประมาณ</span>
          <span className="font-semibold underline underline-offset-4 decoration-dotted px-2 min-w-[60px] text-center">
            {metadata.attendeeCount || "......"}
          </span>
          <span className="shrink-0 ml-1">รูป/คน</span>
        </div>

        {/* Equipment requested */}
        <div className="pt-0.5">
          <div className="font-semibold mb-1">ต้องการใช้อุปกรณ์ ดังนี้ :-</div>
          <div className="flex items-center gap-4 flex-wrap pl-6">
            <span className="inline-flex items-center gap-1.5">
              <span className="text-[13pt]">{metadata.equipments?.computer ? "🔘" : "⚪"}</span> คอมพิวเตอร์
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-[13pt]">{metadata.equipments?.ledDisplay ? "🔘" : "⚪"}</span> จอ LED
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-[13pt]">{metadata.equipments?.soundSystem ? "🔘" : "⚪"}</span> เครื่องขยายเสียง
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-[13pt]">{metadata.equipments?.zoomOnline ? "🔘" : "⚪"}</span> Zoom Online
            </span>
            {/* Any additional dynamic equipments */}
            {Object.entries(metadata.equipments || {})
              .filter(([k, v]) => !["computer", "ledDisplay", "soundSystem", "zoomOnline", "other"].includes(k) && Boolean(v))
              .map(([k]) => (
                <span key={k} className="inline-flex items-center gap-1.5 font-semibold">
                  <span className="text-[13pt]">🔘</span> {k}
                </span>
              ))}
            <span className="inline-flex items-center gap-1.5">
              <span className="text-[13pt]">{metadata.equipments?.other ? "🔘" : "⚪"}</span> อื่น ๆ
              <span className="font-semibold underline underline-offset-4 decoration-dotted ml-1 min-w-[100px]">
                {typeof metadata.equipments?.other === "string" ? metadata.equipments.other : "........................."}
              </span>
            </span>
          </div>
        </div>

        {/* Commitment */}
        <div className="indent-10 pt-2 text-[14pt]">
          ข้าพเจ้ายินดีปฏิบัติตามกฎระเบียบของการใช้ห้องประชุมของคณะพุทธศาสตร์ทุกประการ
        </div>
        <div className="indent-10 text-[14pt]">
          จึงเรียนมาเพื่อพิจารณาต่อไป
        </div>

        {/* Applicant Signature */}
        <div className="flex justify-end pt-2">
          <div className="w-[50%] text-center space-y-1">
            <div className="flex items-baseline justify-center">
              <span>ลงชื่อ</span>
              <span className="mx-2 font-semibold underline underline-offset-4 decoration-dotted flex-1">
                {metadata.requesterName || ".............................................................."}
              </span>
              <span>ผู้ยืม</span>
            </div>
            <div>
              ( <span className="font-semibold">{metadata.requesterName || "..........................................................."}</span> )
            </div>
          </div>
        </div>

        {/* Coordinator Info - Updated to Email */}
        <div className="flex items-baseline flex-wrap pt-1 text-[13.5pt]">
          <span className="shrink-0 mr-1.5">โดยมี ชื่อ</span>
          <span className="font-semibold underline underline-offset-4 decoration-dotted px-2 flex-1 min-w-[150px]">
            {metadata.coordinatorName || metadata.requesterName || "...................................."}
          </span>
          <span className="shrink-0 mx-2">อีเมล์</span>
          <span className="font-semibold underline underline-offset-4 decoration-dotted px-2 min-w-[180px]">
            {metadata.coordinatorEmail || metadata.requesterEmail || metadata.coordinatorPhone || "...................................."}
          </span>
          {metadata.coordinatorPhone && (
            <>
              <span className="shrink-0 mx-2">โทร.</span>
              <span className="font-semibold underline underline-offset-4 decoration-dotted px-2 min-w-[120px]">
                {metadata.coordinatorPhone}
              </span>
            </>
          )}
          <span className="shrink-0 ml-1">ผู้ประสานงาน</span>
        </div>
      </div>

      {/* Review & Approval 2-Column Box */}
      <div className="mt-4 grid grid-cols-2 border border-black text-[13.5pt] rounded-xs">
        {/* Officer Review column */}
        <div className="p-3 border-r border-black flex flex-col justify-between min-h-[175px]">
          <div>
            <div className="font-bold underline mb-1">ความเห็นของเจ้าหน้าที่</div>
            <div className="text-[13pt] flex items-baseline">
              <span>(ระบุ)</span>
              <span className="ml-1 font-semibold underline underline-offset-4 decoration-dotted flex-1">
                {metadata.officerNote || "........................................................................."}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <span>ในวัน/เวลาที่ขอใช้ห้องประชุม</span>
              <span className="inline-flex items-center gap-1 font-semibold">
                <span>{metadata.isRoomAvailable === true ? "🔘" : "⚪"}</span> ว่าง
              </span>
              <span className="inline-flex items-center gap-1 font-semibold">
                <span>{metadata.isRoomAvailable === false ? "🔘" : "⚪"}</span> ไม่ว่าง
              </span>
            </div>
          </div>

          <div className="mt-3 text-center space-y-0.5">
            <div>
              ลงชื่อ <span className="underline underline-offset-4 decoration-dotted font-semibold">{metadata.officerSignName || "................................................."}</span>
            </div>
            <div>
              ( <span className="font-semibold">{metadata.officerSignName || "................................................"}</span> )
            </div>
            <div className="text-[12pt] text-gray-700">
              {metadata.officerReviewDate || "............/................../.........."}
            </div>
          </div>
        </div>

        {/* Approver column */}
        <div className="p-3 flex flex-col justify-between min-h-[175px]">
          <div>
            <div className="font-bold underline mb-1">ความเห็น</div>
            <div className="flex items-center gap-6 mt-1 text-[14pt]">
              <span className="inline-flex items-center gap-1 font-semibold">
                <span>{metadata.approverDecision === "APPROVED" ? "🔘" : "⚪"}</span> อนุมัติ
              </span>
              <span className="inline-flex items-center gap-1 font-semibold">
                <span>{metadata.approverDecision === "REJECTED" ? "🔘" : "⚪"}</span> ไม่อนุมัติ
              </span>
            </div>
          </div>

          <div className="mt-3 text-center space-y-0.5">
            <div>
              ลงชื่อ <span className="underline underline-offset-4 decoration-dotted font-semibold">{metadata.approverDecision === "APPROVED" && metadata.approverSignName ? metadata.approverSignName : "......................................................"}</span>
            </div>
            <div className="font-semibold">
              ({metadata.approverSignName || "พระครูปลัดสมเกียรติ กิตฺติญาโณ"})
            </div>
            <div className="text-[12.5pt] leading-tight">
              {metadata.approverPosition || "เลขานุการสำนักงานคณบดีคณะพุทธศาสตร์"}
            </div>
            <div className="text-[12pt] text-gray-700">
              {metadata.approverDate || "......../............./........."}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Remarks */}
      <div className="mt-3 pt-2 text-[12.5pt] leading-relaxed text-black/90">
        <div className="font-semibold">หมายเหตุ</div>
        <div className="pl-4">
          <div>๑. ผู้ยืม (หน่วยงานที่ขอใช้ห้องประชุม) จะต้องดูแลการใช้ห้องประชุมให้เป็นที่เรียบร้อย</div>
          <div>๒. ผู้ยืม (หน่วยงานที่ขอใช้ห้องประชุม) จะต้องติดต่อขอใช้ห้องก่อน อย่างน้อย ๒ วัน (เว้นอย่างน้อย ๑ วันทำการ ไม่รวมวันเสาร์-อาทิตย์)</div>
          <div>๓. สำหรับการขอใช้ห้องประชุมแบบไป-กลับภายในวันเดียว แนะนำให้เสร็จสิ้นไม่เกิน ๑๖.๔๕ น. เพื่อให้เจ้าหน้าที่ตรวจสอบอุปกรณ์และปิดระบบตามเวลาราชการ</div>
        </div>
      </div>
    </div>
  );
}
