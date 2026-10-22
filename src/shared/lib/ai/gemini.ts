import { prisma } from "@/shared/lib/infra/prisma";

export interface GeminiConfig {
  apiKey: string;
  model: string;
}

/**
 * ดึงการตั้งค่า Gemini จาก Tenant Settings หรือ environment variable
 */
export async function getGeminiConfig(tenantId?: string): Promise<GeminiConfig> {
  let apiKey = "";
  let model = "gemini-2.5-flash";

  if (tenantId) {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { settings: true },
      });
      const settings = (tenant?.settings as Record<string, unknown>)?.gemini as
        | { apiKey?: string; model?: string }
        | undefined;

      if (settings?.apiKey?.trim()) {
        apiKey = settings.apiKey.trim();
      }
      if (settings?.model?.trim()) {
        model = settings.model.trim();
      }
    } catch {
      // fallback to env
    }
  }

  // Fallback ไปยัง Environment Variable ถ้า tenant ยังไม่ได้ตั้งค่า
  if (!apiKey) {
    apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "";
  }

  return { apiKey, model };
}

/**
 * ทดสอบการเชื่อมต่อ Gemini API ด้วย API Key และ Model ที่ระบุ
 */
export async function testGeminiApiKey(apiKey: string, model: string = "gemini-2.5-flash") {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    throw new Error("กรุณาระบุ Gemini API Key");
  }

  const cleanModel = model.trim() || "gemini-2.5-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    cleanModel
  )}:generateContent?key=${encodeURIComponent(cleanKey)}`;

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: "Hello, reply with the word OK." }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 10,
          temperature: 0.1,
        },
      }),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`ไม่สามารถเชื่อมต่อเครือข่ายไปยัง Google Gemini API ได้ (${message})`);
  }

  if (!res.ok) {
    const errorJson = (await res.json().catch(() => null)) as {
      error?: { message?: string; status?: string };
    } | null;
    const errorMsg = errorJson?.error?.message || `HTTP ${res.status}: ${res.statusText}`;
    throw new Error(`การเชื่อมต่อล้มเหลว (${errorMsg})`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("ไม่ได้รับข้อความตอบกลับจาก Gemini API");
  }

  return { ok: true, model: cleanModel };
}

export interface NewsTranslationResult {
  titleEn: string;
  summaryEn: string;
  contentEn: string;
}

/**
 * แปลและเรียบเรียงเนื้อหาข่าวสารภาษาไทยเป็นภาษาอังกฤษสากลด้วย Gemini API
 */
export async function translateNewsWithGemini(
  tenantId: string,
  input: { titleTh: string; summaryTh?: string | null; contentTh: string }
): Promise<NewsTranslationResult> {
  const config = await getGeminiConfig(tenantId);

  if (!config.apiKey) {
    throw new Error(
      "ยังไม่ได้ตั้งค่า Gemini API Key ในระบบ กรุณาไปที่เมนู 'การตั้งค่า (Settings) > AI & Gemini API' เพื่อใส่ API Key ก่อนใช้งาน"
    );
  }

  const prompt = `You are a professional bilingual journalist and academic editor for Mahachulalongkornrajavidyalaya University (MCU), Faculty of Buddhism.
Your task is to translate and polish the following Thai university news announcement into formal, engaging, and professional English suitable for an international university news portal.

Instructions:
1. "titleEn": Professional, clear, engaging, and faithful to the Thai announcement.
2. "summaryEn": A concise 1-2 sentence executive overview summarizing the announcement.
3. "contentEn": Full translated article with fluent academic/institutional phrasing, well-structured paragraphs, keeping all dates, numbers, course/curriculum names, and person titles accurate.

Input Thai News:
- Title (Thai): ${input.titleTh}
- Summary (Thai): ${input.summaryTh || "(ไม่มีคำโปรย)"}
- Content (Thai): ${input.contentTh}

Respond STRICTLY with a valid JSON object matching this schema:
{
  "titleEn": "...",
  "summaryEn": "...",
  "contentEn": "..."
}`;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    config.model
  )}:generateContent?key=${encodeURIComponent(config.apiKey)}`;

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`ไม่สามารถเชื่อมต่อไปยัง Google Gemini API ได้ (${message})`);
  }

  if (!res.ok) {
    const errorJson = (await res.json().catch(() => null)) as {
      error?: { message?: string; status?: string };
    } | null;
    const errorMsg = errorJson?.error?.message || `HTTP ${res.status}: ${res.statusText}`;
    throw new Error(`Gemini API Error: ${errorMsg}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error("ไม่ได้รับเนื้อหาจาก Gemini API");
  }

  try {
    const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned) as {
      titleEn?: string;
      summaryEn?: string;
      contentEn?: string;
    };
    return {
      titleEn: String(parsed.titleEn || "").trim(),
      summaryEn: String(parsed.summaryEn || "").trim(),
      contentEn: String(parsed.contentEn || "").trim(),
    };
  } catch {
    throw new Error("ไม่สามารถแปลงข้อมูลผลลัพธ์ที่ได้รับจาก AI เป็น JSON ได้");
  }
}
