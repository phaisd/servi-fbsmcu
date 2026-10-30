import Link from "next/link";
import { resolveTenantSettings } from "@/features/identity/server";
import {
  DEFAULT_FOOTER_SETTINGS,
  DEFAULT_FOOTER_QUICK_LINKS,
  DEFAULT_FOOTER_SYSTEM_LINKS,
} from "@/features/identity";
import { getLocale } from "@/shared/lib/i18n/server";
import {
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Globe,
} from "lucide-react";

export async function PortalFooter() {
  const [settings, locale] = await Promise.all([
    resolveTenantSettings(),
    getLocale(),
  ]);

  const footer = settings?.footer ?? DEFAULT_FOOTER_SETTINGS;

  if (footer.enabled === false) {
    return null;
  }

  const brandName =
    locale === "th"
      ? settings?.nameTh || "คณะพุทธศาสตร์"
      : settings?.nameEn || "Faculty of Buddhism";

  const brandTagline =
    locale === "th"
      ? footer.subTaglineTh || "มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย (มจร)"
      : footer.subTaglineEn || "Mahachulalongkornrajavidyalaya University (MCU)";

  const currentYear = new Date().getFullYear();

  const desc = locale === "th" ? footer.descTh : footer.descEn;
  const address = locale === "th" ? footer.addressTh : footer.addressEn;
  const copyright = locale === "th" ? footer.copyrightTh : footer.copyrightEn;
  const quickLinksTitle = locale === "th" ? footer.quickLinksTitleTh : footer.quickLinksTitleEn;
  const systemsTitle = locale === "th" ? footer.systemsTitleTh : footer.systemsTitleEn;
  const mainWebsiteText = locale === "th" ? footer.mainWebsiteTextTh : footer.mainWebsiteTextEn;
  const facultyWebsiteText =
    locale === "th"
      ? footer.facultyWebsiteTextTh || "เว็บไซต์หลัก คณะพุทธศาสตร์"
      : footer.facultyWebsiteTextEn || "Faculty of Buddhism Website";

  const rawQuickLinks = (footer.quickLinks ?? DEFAULT_FOOTER_QUICK_LINKS).filter(
    (l) => l.enabled !== false
  );
  const quickLinks = [...rawQuickLinks];
  const systemLinks = (footer.systemLinks ?? DEFAULT_FOOTER_SYSTEM_LINKS).filter(
    (l) => l.enabled !== false
  );

  return (
    <footer className="mt-16 w-full border-t border-white/10">
      {/* Upper Grid (Liyon .foot-in) */}
      <div className="foot-in">
        {/* Column 1: Brand & About */}
        <div>
          <Link href="/" className="brand inline-flex items-center gap-3">
            <i className="overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={settings?.logoUrl || "/uploads/mcu-logo.png"}
                alt={brandName}
                className="h-full w-full object-contain p-0.5 rounded-[inherit]"
              />
            </i>
            <span className="font-bold tracking-tight text-base sm:text-lg">
              {brandName}
            </span>
          </Link>

          {desc && (
            <p className="foot-tag text-sm leading-relaxed">
              {desc}
            </p>
          )}

          <div className="mt-5 space-y-2 text-xs">
            {address && (
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 shrink-0 opacity-70 mt-0.5" />
                <span>{address}</span>
              </div>
            )}
            {footer.phone && (
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 opacity-70" />
                <span>{footer.phone}</span>
              </div>
            )}
            {footer.email && (
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 opacity-70" />
                <span>{footer.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Quick Links / เมนูลัด */}
        <div>
          <h4>{quickLinksTitle}</h4>
          <ul className="space-y-2 text-sm">
            {quickLinks.map((link) => (
              <li key={link.id || link.href}>
                <Link href={link.href} className="transition-colors hover:underline">
                  {locale === "th" ? link.labelTh || link.labelEn : link.labelEn || link.labelTh}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: ระบบบริการ & ระบบจัดการ */}
        <div>
          <h4>{systemsTitle}</h4>
          <ul className="space-y-2 text-sm">
            {systemLinks.map((link) => (
              <li key={link.id || link.href}>
                <Link href={link.href} className="transition-colors hover:underline">
                  {locale === "th" ? link.labelTh || link.labelEn : link.labelEn || link.labelTh}
                </Link>
              </li>
            ))}
            {footer.mainWebsiteUrl && (
              <li>
                <a
                  href={footer.mainWebsiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 transition-colors hover:underline"
                >
                  <Globe className="h-3.5 w-3.5 opacity-80" />
                  <span>{mainWebsiteText}</span>
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </a>
              </li>
            )}
            {footer.facultyWebsiteUrl && (
              <li>
                <a
                  href={footer.facultyWebsiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 transition-colors hover:underline text-primary dark:text-primary font-medium"
                >
                  <Globe className="h-3.5 w-3.5 opacity-80" />
                  <span>{facultyWebsiteText}</span>
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </a>
              </li>
            )}
            {footer.showStaffConsole && (
              <li className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-white/10 hover:bg-white/15 text-xs font-medium transition-colors"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>{locale === "th" ? "ระบบบริหารจัดการ (Staff Console)" : "Staff Console (Admin)"}</span>
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Bottom Bar (Liyon .foot-bottom) */}
      <div className="foot-bottom">
        <div className="foot-bottom-in">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>
              © {currentYear} {brandName} · {brandTagline}. {copyright}
            </span>
            {(footer.showDevCredit ?? true) && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/10 text-[11px] font-semibold text-white/90">
                {locale === "th"
                  ? (footer.devCreditTh || "Dev. by สำนักงานคณบดีคณะพุทธศาสตร์")
                  : (footer.devCreditEn || "Dev. by Office of the Dean, Faculty of Buddhism")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/portal/news" className="hover:underline">
              {locale === "th" ? "ข่าวประชาสัมพันธ์" : "News"}
            </Link>
            <span>·</span>
            <Link href="/portal/documents" className="hover:underline">
              {locale === "th" ? "เอกสารเผยแพร่" : "Documents"}
            </Link>
            {footer.showStaffConsole && (
              <>
                <span>·</span>
                <Link href="/login" className="hover:underline">
                  {locale === "th" ? "สำหรับเจ้าหน้าที่" : "Staff Login"}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
