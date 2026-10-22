import { resolvePublicTenantId } from "@/features/news/server";
import { getPublicPersonnelList } from "@/features/personnel/server";
import { getLocale } from "@/shared/lib/i18n/server";
import { Users, Mail, Phone, Briefcase, FileText } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default async function PublicPersonnelPage() {
  const locale = await getLocale();
  const tenantId = await resolvePublicTenantId();
  
  const items = await getPublicPersonnelList(tenantId);

  // Group by department
  const grouped = items.reduce((acc, item) => {
    const dept = item.department?.nameTh || "ทั่วไป";
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  return (
    <div className="space-y-10 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-3">
          <Users className="h-3.5 w-3.5" />
          {locale === "th" ? "ทำเนียบบุคลากร" : "Personnel Directory"}
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          {locale === "th" ? "บุคลากรคณะพุทธศาสตร์" : "Faculty of Buddhism Personnel"}
        </h1>
      </div>

      <div className="space-y-12">
        {Object.entries(grouped).map(([deptName, personnel]) => (
          <section key={deptName} className="space-y-6">
            <h2 className="text-2xl font-bold border-b pb-2">{deptName}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {personnel.map((person) => (
                <div key={person.id} className="group relative overflow-hidden rounded-2xl border bg-card hover:shadow-lg transition-all duration-300">
                  <div className="aspect-[4/3] w-full bg-muted overflow-hidden">
                    {person.imageUrl ? (
                      <Image 
                        src={person.imageUrl} 
                        alt={`${person.firstNameTh} ${person.lastNameTh}`}
                        fill
                        className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary/30 text-secondary-foreground/20">
                        <Users className="h-20 w-20" />
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex flex-wrap items-center gap-1.5 mb-3">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-semibold tracking-wide uppercase">
                        <Briefcase className="h-3 w-3" />
                        {person.type === "EXECUTIVE" ? "ผู้บริหาร" : person.type === "ACADEMIC" ? "สายวิชาการ" : "สายสนับสนุน"}
                      </div>
                      {(person.positionTh?.includes("พิเศษ") || person.positionTh?.includes("ภายนอก")) && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 text-[11px] font-semibold">
                          ⭐ ผู้ทรงคุณวุฒิภายนอก / อาจารย์พิเศษ
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-foreground">
                      {person.firstNameTh} {person.lastNameTh}
                    </h3>
                    <p className="text-sm font-medium text-muted-foreground mt-1">
                      {person.positionTh}
                    </p>
                    
                    <div className="mt-4 pt-4 border-t space-y-2">
                      {person.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                          <a href={`mailto:${person.email}`} className="hover:text-primary transition-colors">
                            {person.email}
                          </a>
                        </div>
                      )}
                      {person.phoneNumber && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                          <a href={`tel:${person.phoneNumber}`} className="hover:text-primary transition-colors">
                            {person.phoneNumber}
                          </a>
                        </div>
                      )}

                      <div className="pt-2">
                        <Link
                          href={`/portal/certificates/request?mode=personnel&personnelId=${person.id}`}
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 py-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200 shadow-2xs"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>{locale === "th" ? "ขอหนังสือรับรองอาจารย์/บุคลากร →" : "Request Certificate →"}</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
        {items.length === 0 && (
          <div className="py-20 text-center text-muted-foreground">
            {locale === "th" ? "ยังไม่มีข้อมูลบุคลากร" : "No personnel data available."}
          </div>
        )}
      </div>
    </div>
  );
}
