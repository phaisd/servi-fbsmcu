import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicNewsBySlug, resolvePublicTenantId } from "@/features/news/server";
import { getLocale } from "@/shared/lib/i18n/server";
import { formatDate } from "@/shared/lib/format";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Eye,
  User,
  ArrowLeft,
  Download,
  Share2,
  FileText,
  Tag,
} from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  const locale = await getLocale();
  const tenantId = await resolvePublicTenantId();

  const article = await getPublicNewsBySlug(tenantId, slug, true);

  if (!article) {
    notFound();
  }

  const title = locale === "en" && article.titleEn ? article.titleEn : article.titleTh;
  const content = locale === "en" && article.contentEn ? article.contentEn : article.contentTh;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back button and breadcrumb */}
      <div className="flex items-center justify-between text-xs text-muted-foreground border-b pb-4">
        <Link
          href="/portal/news"
          className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          {locale === "th" ? "กลับหน้ารายการข่าว" : "Back to news list"}
        </Link>
        <span className="flex items-center gap-1">
          <Tag className="h-3 w-3" />
          {article.category}
        </span>
      </div>

      {/* Article Header */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(article.publishedAt || article.createdAt, locale)}
          </span>
          {article.authorName && (
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {article.authorName}
            </span>
          )}
          <span className="flex items-center gap-1 font-mono">
            <Eye className="h-3.5 w-3.5" />
            {article.viewCount.toLocaleString()} {locale === "th" ? "ครั้ง" : "views"}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground leading-snug">
          {title}
        </h1>

        {article.summaryTh && (
          <p className="text-base text-muted-foreground font-medium border-l-4 border-primary pl-4 py-1 italic bg-muted/30 rounded-r">
            {locale === "en" && article.summaryEn ? article.summaryEn : article.summaryTh}
          </p>
        )}
      </div>

      {/* Cover Image */}
      {article.coverImageUrl && (
        <div className="rounded-xl overflow-hidden border bg-muted shadow-sm max-h-[500px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.coverImageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Main Content Body */}
      {content && /<\/?[a-z][\s\S]*>/i.test(content) ? (
        <div
          className="prose prose-neutral dark:prose-invert max-w-none text-foreground leading-relaxed text-sm sm:text-base"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      ) : (
        <div className="prose prose-neutral dark:prose-invert max-w-none text-foreground leading-relaxed whitespace-pre-line text-sm sm:text-base">
          {content}
        </div>
      )}

      {/* Attachments Section */}
      {article.attachments && article.attachments.length > 0 && (
        <div className="rounded-xl border bg-card p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-sm text-foreground">
            <Download className="h-4 w-4 text-primary" />
            <span>{locale === "th" ? "เอกสารแนบดาวน์โหลด" : "Downloadable Attachments"}</span>
          </div>
          <div className="divide-y divide-border">
            {article.attachments.map((att) => (
              <div
                key={att.id}
                className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="rounded p-2 bg-muted text-muted-foreground">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {att.fileName}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {formatBytes(att.fileSize)}
                    </p>
                  </div>
                </div>
                <Button asChild size="sm" variant="outline" className="gap-1.5 shrink-0">
                  <a href={att.fileUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{locale === "th" ? "ดาวน์โหลด" : "Download"}</span>
                  </a>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Share & Back */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Button asChild variant="outline" size="sm">
          <Link href="/portal/news" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {locale === "th" ? "ดูข่าวอื่น ๆ" : "Explore more news"}
          </Link>
        </Button>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Share2 className="h-4 w-4" />
          <span>{locale === "th" ? "แชร์ข่าวนี้" : "Share article"}</span>
        </div>
      </div>
    </div>
  );
}
