"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/shared/lib/result";
import { getLocale } from "@/shared/lib/i18n/server";
import { zodErrorMap } from "@/shared/lib/i18n/zod-locale";
import { requirePermission } from "@/features/identity/server";
import { errors } from "@/shared/lib/errors";
import { translateNewsWithGemini } from "@/shared/lib/ai/gemini";
import { NEWS_P } from "../permissions";
import {
  createNewsArticleSchema,
  updateNewsArticleSchema,
  changeNewsStatusSchema,
  togglePinNewsSchema,
} from "./validations";
import {
  listNewsArticles,
  createNewsArticle,
  updateNewsArticle,
  changeNewsStatus,
  togglePinNewsArticle,
  deleteNewsArticle,
  getNewsArticleById,
  type NewsArticleDto,
  type ListNewsOptions,
} from "./services";

export async function getNewsArticlesAction(
  options: ListNewsOptions = {}
): Promise<ActionResult<{ items: NewsArticleDto[]; total: number }>> {
  return runAction(async () => {
    const ctx = await requirePermission(NEWS_P.newsRead);
    return listNewsArticles(ctx.tenantId, options);
  });
}

export async function getNewsArticleByIdAction(
  id: string
): Promise<ActionResult<NewsArticleDto | null>> {
  return runAction(async () => {
    const ctx = await requirePermission(NEWS_P.newsRead);
    return getNewsArticleById(ctx.tenantId, id);
  });
}

export async function createNewsArticleAction(
  input: unknown
): Promise<ActionResult<NewsArticleDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(NEWS_P.newsCreate);
    const parsed = createNewsArticleSchema.parse(input, {
      error: zodErrorMap(await getLocale()),
    });
    const result = await createNewsArticle(ctx.tenantId, ctx.userId, parsed);
    revalidatePath("/news");
    revalidatePath("/dashboard");
    return result;
  });
}

export async function updateNewsArticleAction(
  input: unknown
): Promise<ActionResult<NewsArticleDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(NEWS_P.newsUpdate);
    const parsed = updateNewsArticleSchema.parse(input, {
      error: zodErrorMap(await getLocale()),
    });
    const result = await updateNewsArticle(ctx.tenantId, ctx.userId, parsed);
    revalidatePath("/news");
    revalidatePath(`/news/${result.slug}`);
    return result;
  });
}

export async function changeNewsStatusAction(
  input: unknown
): Promise<ActionResult<NewsArticleDto>> {
  return runAction(async () => {
    const parsed = changeNewsStatusSchema.parse(input, {
      error: zodErrorMap(await getLocale()),
    });

    const requiredPerm =
      parsed.status === "PUBLISHED" || parsed.status === "ARCHIVED"
        ? NEWS_P.newsPublish
        : NEWS_P.newsReview;

    const ctx = await requirePermission(requiredPerm);
    const result = await changeNewsStatus(ctx.tenantId, ctx.userId, parsed);
    revalidatePath("/news");
    revalidatePath(`/news/${result.slug}`);
    return result;
  });
}

export async function togglePinNewsAction(
  input: unknown
): Promise<ActionResult<NewsArticleDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(NEWS_P.newsPublish);
    const parsed = togglePinNewsSchema.parse(input, {
      error: zodErrorMap(await getLocale()),
    });
    const result = await togglePinNewsArticle(ctx.tenantId, ctx.userId, parsed);
    revalidatePath("/news");
    return result;
  });
}

export async function deleteNewsArticleAction(
  id: string
): Promise<ActionResult<void>> {
  return runAction(async () => {
    const ctx = await requirePermission(NEWS_P.newsDelete);
    await deleteNewsArticle(ctx.tenantId, ctx.userId, id);
    revalidatePath("/news");
  });
}

export async function translateNewsWithAiAction(input: {
  titleTh: string;
  summaryTh?: string | null;
  contentTh: string;
}): Promise<ActionResult<{ titleEn: string; summaryEn: string; contentEn: string }>> {
  return runAction(async () => {
    const ctx = await requirePermission(NEWS_P.newsCreate);
    if (!input.titleTh?.trim() || !input.contentTh?.trim()) {
      throw errors.validation("validation_failed", {
        titleTh: ["กรุณากรอกหัวข้อข่าวและเนื้อหาข่าวภาษาไทยให้เรียบร้อยก่อนให้ AI แปล"],
      });
    }
    return translateNewsWithGemini(ctx.tenantId, input);
  });
}
