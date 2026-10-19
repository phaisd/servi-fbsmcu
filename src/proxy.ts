import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { CURRENT_PATH_HEADER } from "@/shared/lib/security/callback-url";

const PUBLIC_PREFIXES = [
  "/portal",
  "/verify",
  "/reset-password/",
  "/verify-email/",
  "/api/auth/",
  "/uploads/",
  "/_next/",
  "/favicon.ico",
];
const GUEST_ONLY = ["/login", "/forgot-password"];

/** ด่านตรวจระดับ route — ไม่แตะ DB (edge) · สิทธิ์ละเอียดตรวจใน Server Action ผ่าน requirePermission */
export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // 1. Root landing: เข้าถึงหน้าหลักได้โดยตรงที่ "/" โดยไม่ต้องมี "/portal" ใน URL
  if (pathname === "/") {
    return NextResponse.rewrite(new URL(`/portal${search}`, req.url));
  }

  // 2. Direct Public Aliases: เข้าถึงหน้าบริการสาธารณะได้โดยตรงโดยไม่ต้องมี "/portal"
  if (pathname === "/verify/certificate" || pathname.startsWith("/verify/certificate/")) {
    const sub = pathname.replace("/verify/certificate", "");
    return NextResponse.rewrite(new URL(`/portal/certificates/verify${sub}${search}`, req.url));
  }
  if (pathname === "/meetings" || pathname === "/meetings/book") {
    return NextResponse.rewrite(new URL(`/portal${pathname}${search}`, req.url));
  }
  if (pathname === "/programs" || pathname.startsWith("/programs/")) {
    return NextResponse.rewrite(new URL(`/portal${pathname}${search}`, req.url));
  }
  if (pathname === "/documents" || pathname.startsWith("/documents/")) {
    return NextResponse.rewrite(new URL(`/portal${pathname}${search}`, req.url));
  }

  // 3. Setting singular alias redirect
  if (pathname === "/setting") {
    return NextResponse.redirect(new URL(`/settings${search}`, req.url));
  }

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const secureCookie = (process.env.APP_URL ?? "").startsWith("https://");
  const token = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie });
  const loggedIn = !!token && !token.invalid && !!token.userId && !!token.tenantId;

  if (GUEST_ONLY.includes(pathname)) {
    if (req.nextUrl.searchParams.has("callbackUrl") || req.nextUrl.searchParams.has("error")) {
      const res = NextResponse.next();
      res.cookies.delete("authjs.session-token");
      res.cookies.delete("__Secure-authjs.session-token");
      return res;
    }
    return loggedIn ? NextResponse.redirect(new URL("/dashboard", req.url)) : NextResponse.next();
  }
  if (!loggedIn) {
    const login = new URL("/login", req.url);
    login.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(login);
  }
  if (token?.mustChangePassword && pathname !== "/change-password") {
    return NextResponse.redirect(new URL("/change-password", req.url));
  }
  // B1.5: ด่านนี้อยู่บน edge จึงมองไม่เห็นว่าเซสชันถูกเพิกถอนไปแล้ว (ต้องแตะ DB) คำขอแรกหลังถูกเพิกถอน
  // จึงผ่านมาถึงเพจเสมอ แล้วไปตายที่ requireSession — ส่งเส้นทางปัจจุบันไปให้ requireSession เอาไว้ทำ
  // callbackUrl ตอนเด้งกลับหน้า login · ทับค่าเดิมเสมอ ไม่ให้ client ปลอม header นี้ส่งเข้ามาได้
  const headers = new Headers(req.headers);
  headers.set(CURRENT_PATH_HEADER, pathname + search);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
