import { z } from "zod";

export const adminDocumentSchema = z.object({
  title: z.string().min(1, "Required").max(255),
  description: z.string().optional().nullable(),
  fileUrl: z
    .string()
    .min(1, "Required")
    .max(1000)
    .refine(
      (url) =>
        url.startsWith("http://") ||
        url.startsWith("https://") ||
        url.startsWith("/uploads/"),
      {
        message: "Must be a valid URL (http/https) or an uploaded file path (/uploads/...)",
      }
    ),
  category: z.enum(["FORM", "MANUAL", "POLICY", "OTHER"]),
  visibility: z.enum(["PUBLIC", "INTERNAL"]),
  isPublished: z.boolean().default(true),
  docNumber: z.string().optional().nullable(),
  year: z.string().optional().nullable(),
  issuerLevel: z.enum(["UNIVERSITY", "FACULTY"]).optional().nullable().default("FACULTY"),
  docType: z.enum(["ORDER", "ANNOUNCEMENT", "REGULATION", "FORM", "MANUAL", "OTHER", "GENERAL"]).optional().nullable().default("GENERAL"),
});

export const updateAdminDocumentSchema = adminDocumentSchema.partial();

