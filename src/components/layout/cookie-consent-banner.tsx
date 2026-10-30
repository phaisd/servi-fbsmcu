"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();

  // ไม่แสดงแบนเนอร์คุกกี้ในหน้าจัดการหลังบ้าน (Admin/Console) เช่น /settings, /personnel, /dashboard ฯลฯ
  // ให้แสดงเฉพาะหน้าเว็บไซต์สาธารณะ เช่นหน้าแรก (/) หรือหน้า Portal (/portal/...)
  const isAdminRoute =
    pathname.startsWith("/settings") ||
    pathname.startsWith("/personnel") ||
    pathname.startsWith("/users") ||
    pathname.startsWith("/roles") ||
    pathname.startsWith("/audit") ||
    pathname.startsWith("/documents") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/rooms") ||
    pathname.startsWith("/certificates") ||
    pathname.startsWith("/activities") ||
    pathname.startsWith("/news-admin") ||
    pathname.startsWith("/timetable-admin") ||
    pathname.startsWith("/admin");

  useEffect(() => {
    try {
      const consent = localStorage.getItem("cookie_consent");
      if (!consent) {
        setIsVisible(true);
      }
    } catch {
      // Fallback if localStorage is inaccessible
      setIsVisible(true);
    }
  }, []);

  const handleConsent = (choice: "accepted" | "declined") => {
    try {
      localStorage.setItem("cookie_consent", choice);
    } catch {
      // Ignore localStorage errors
    }
    setIsVisible(false);
  };

  if (!isVisible || isAdminRoute) return null;

  return (
    <aside
      aria-label="การแจ้งเตือนคุกกี้และความเป็นส่วนตัว"
      className="fixed bottom-0 inset-x-0 z-50 bg-[#121212]/95 backdrop-blur-md text-white border-t border-white/10 shadow-2xl transition-all duration-300 py-3.5 px-4 sm:px-6 md:px-10"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* ข้อความแจ้งเตือน PDPA / คุกกี้ */}
        <div className="text-xs sm:text-sm leading-relaxed text-gray-200 tracking-normal">
          เว็บไซต์ fb.mcu.ac.th มีการใช้งานเทคโนโลยีคุกกี้ หรือ เทคโนโลยีอื่นที่มีลักษณะใกล้เคียงกันกับคุกกี้ บนเว็บไซต์ของเรา โปรดศึกษา นโยบายการใช้คุกกี้ และนโยบายความเป็นส่วนตัวของข้อมูล ก่อนใช้บริการเว็บไซต์{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-2 text-white hover:text-blue-400 font-medium transition-colors inline-block"
          >
            [ประกาศนโยบายคุ้มครองส่วนบุคคล]
          </Link>
        </div>

        {/* ปุ่มกดยอมรับ / ไม่ยอมรับ */}
        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
          <button
            type="button"
            onClick={() => handleConsent("accepted")}
            className="rounded-full bg-[#0066cc] hover:bg-[#0055aa] active:scale-95 text-white text-xs sm:text-sm font-medium px-6 py-2 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            ยอมรับ
          </button>
          <button
            type="button"
            onClick={() => handleConsent("declined")}
            className="rounded-full bg-[#0a3871] hover:bg-[#0c4488] active:scale-95 text-white text-xs sm:text-sm font-medium px-5 py-2 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            ไม่ยอมรับ
          </button>
        </div>
      </div>
    </aside>
  );
}
