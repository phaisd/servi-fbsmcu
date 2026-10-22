import { z } from "zod";

export const departmentSchema = z.object({
  nameTh: z.string().min(1, "Required"),
  nameEn: z.string().optional().nullable(),
  orderIndex: z.number().int().default(0),
});

export const personnelSchema = z.object({
  departmentId: z.string().uuid().optional().nullable(),
  firstNameTh: z.string().min(1, "Required"),
  lastNameTh: z.string().min(1, "Required"),
  firstNameEn: z.string().optional().nullable(),
  lastNameEn: z.string().optional().nullable(),
  positionTh: z.string().min(1, "Required"),
  positionEn: z.string().optional().nullable(),
  academicPosition: z.string().optional().nullable(),
  type: z.enum(["EXECUTIVE", "ACADEMIC", "SUPPORT"]),
  imageUrl: z.string().url().optional().or(z.literal("")).nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  phoneNumber: z.string().optional().nullable(),
  educationTh: z.string().optional().nullable(),
  experiencesTh: z.string().optional().nullable(),
  bioTh: z.string().optional().nullable(),
  contactInfo: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  orderIndex: z.number().int().default(0),
});

export const researchPublicationSchema = z.object({
  personnelId: z.string().uuid().optional().nullable(),
  titleTh: z.string().min(1, "Required"),
  titleEn: z.string().optional().nullable(),
  authors: z.string().min(1, "Required"),
  journalName: z.string().min(1, "Required"),
  volume: z.string().optional().nullable(),
  issue: z.string().optional().nullable(),
  publicationYear: z.string().optional().nullable(),
  pages: z.string().optional().nullable(),
  issn: z.string().optional().nullable(),
  tier: z.string().optional().nullable(),
  url: z.string().url().optional().or(z.literal("")).nullable(),
  type: z.enum(["RESEARCH", "ACADEMIC", "DISSERTATION"]).default("RESEARCH"),
  orderIndex: z.number().int().default(0),
});

export const updateDepartmentSchema = departmentSchema.partial();
export const updatePersonnelSchema = personnelSchema.partial();
export const updateResearchPublicationSchema = researchPublicationSchema.partial();
