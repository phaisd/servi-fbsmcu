/**
 * ฟังก์ชันคำนวณวันทำการสำหรับระบบจองห้องประชุม คณะพุทธศาสตร์
 * เงื่อนไข: ยื่นขอใช้ห้องประชุมล่วงหน้าเว้น 1 วันทำการ (ไม่รวมวันเสาร์-อาทิตย์และวันหยุดราชการ)
 */

/**
 * ตรวจสอบว่าวันที่กำหนดเป็นวันเสาร์หรืออาทิตย์หรือไม่
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

/**
 * จัดรูปแบบวันที่เป็น YYYY-MM-DD ตามเขตเวลาท้องถิ่น
 */
export function formatDateToIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * คำนวณวันแรกสุดที่สามารถขอใช้ห้องประชุมได้
 * ตามเงื่อนไข "เว้น 1 วันทำการก่อนวันขอใช้งาน ไม่รวมวันหยุดเสาร์-อาทิตย์" (หรือล่วงหน้า 2 วันทำการ)
 *
 * ตัวอย่าง:
 * - ยื่นวันจันทร์  -> เว้นวันอังคาร (1 วันทำการ) -> วันแรกที่ขอใช้ได้คือ วันพุธ
 * - ยื่นวันอังคาร -> เว้นวันพุธ    (1 วันทำการ) -> วันแรกที่ขอใช้ได้คือ วันพฤหัสบดี
 * - ยื่นวันพุธ    -> เว้นวันพฤหัสบดี (1 วันทำการ) -> วันแรกที่ขอใช้ได้คือ วันศุกร์
 * - ยื่นวันพฤหัสบดี -> เว้นวันศุกร์ (1 วันทำการ) -> เสาร์/อาทิตย์หยุด -> วันแรกที่ขอใช้ได้คือ วันจันทร์ถัดไป
 * - ยื่นวันศุกร์   -> เสาร์/อาทิตย์หยุด -> เว้นวันจันทร์ (1 วันทำการ) -> วันแรกที่ขอใช้ได้คือ วันอังคารถัดไป
 * - ยื่นวันเสาร์/อาทิตย์ -> นับเหมือนยื่นวันจันทร์ -> เว้นวันอังคาร -> วันแรกที่ขอใช้ได้คือ วันพุธ
 */
export function getEarliestBookingDate(
  fromDate: Date = new Date(),
  businessDaysBetween: number = 1
): Date {
  const cursor = new Date(fromDate);
  cursor.setHours(0, 0, 0, 0);

  // หากวันที่ยื่นตกวันหยุดเสาร์-อาทิตย์ ให้ขยับวันยื่นไปเป็นวันจันทร์ก่อน
  while (isWeekend(cursor)) {
    cursor.setDate(cursor.getDate() + 1);
  }

  // เว้นวันทำการตามจำนวนที่กำหนด (เช่น 1 วันทำการ)
  let skippedBusinessDays = 0;
  while (skippedBusinessDays < businessDaysBetween) {
    cursor.setDate(cursor.getDate() + 1);
    if (!isWeekend(cursor)) {
      skippedBusinessDays++;
    }
  }

  // วันถัดไปคือวันแรกสุดที่สามารถขอใช้ห้องได้
  cursor.setDate(cursor.getDate() + 1);
  while (isWeekend(cursor)) {
    cursor.setDate(cursor.getDate() + 1);
  }

  cursor.setHours(0, 0, 0, 0);
  return cursor;
}

/**
 * ตรวจสอบว่าวันที่ขอใช้ (targetDate) ผ่านเกณฑ์ล่วงหน้าเว้นวันทำการหรือไม่
 */
export function validateAdvanceBookingDate(
  targetDate: Date | string,
  fromDate: Date = new Date(),
  businessDaysBetween: number = 1
): { isValid: boolean; earliestAllowedDate: Date; message?: string } {
  const target = typeof targetDate === "string" ? new Date(targetDate) : new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  const earliest = getEarliestBookingDate(fromDate, businessDaysBetween);

  if (target.getTime() < earliest.getTime()) {
    const earliestStr = earliest.toLocaleDateString("th-TH", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return {
      isValid: false,
      earliestAllowedDate: earliest,
      message: `การขอใช้ห้องประชุมต้องยื่นล่วงหน้าเว้นอย่างน้อย ${businessDaysBetween} วันทำการ (ไม่รวมวันเสาร์-อาทิตย์) โดยวันที่สามารถขอใช้ได้เร็วที่สุดคือ ${earliestStr}`,
    };
  }

  return {
    isValid: true,
    earliestAllowedDate: earliest,
  };
}
