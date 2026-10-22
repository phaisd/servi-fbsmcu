"use server";

import { requireSession, requirePermission } from "@/features/identity/server";
import { PERSONNEL_P } from "./permissions";
import {
  createDepartment,
  updateDepartment,
  deleteDepartment,
  createPersonnel,
  updatePersonnel,
  deletePersonnel,
  createResearchPublication,
  updateResearchPublication,
  deleteResearchPublication,
  importPersonnelBatch,
  type ImportPersonnelItem,
} from "./_internal/services";

export type { ImportPersonnelItem };
import {
  departmentSchema,
  updateDepartmentSchema,
  personnelSchema,
  updatePersonnelSchema,
  researchPublicationSchema,
  updateResearchPublicationSchema,
} from "./_internal/validations";

export async function createDepartmentAction(data: unknown) {
  const session = await requireSession();
  await requirePermission(PERSONNEL_P.manage);
  const parsed = departmentSchema.parse(data);
  return createDepartment(session.tenantId, session.userId, parsed);
}

export async function updateDepartmentAction(id: string, data: unknown) {
  const session = await requireSession();
  await requirePermission(PERSONNEL_P.manage);
  const parsed = updateDepartmentSchema.parse(data);
  return updateDepartment(session.tenantId, session.userId, id, parsed);
}

export async function deleteDepartmentAction(id: string) {
  const session = await requireSession();
  await requirePermission(PERSONNEL_P.manage);
  return deleteDepartment(session.tenantId, session.userId, id);
}

export async function createPersonnelAction(data: unknown) {
  const session = await requireSession();
  await requirePermission(PERSONNEL_P.manage);
  const parsed = personnelSchema.parse(data);
  return createPersonnel(session.tenantId, session.userId, parsed);
}

export async function updatePersonnelAction(id: string, data: unknown) {
  const session = await requireSession();
  await requirePermission(PERSONNEL_P.manage);
  const parsed = updatePersonnelSchema.parse(data);
  return updatePersonnel(session.tenantId, session.userId, id, parsed);
}

export async function deletePersonnelAction(id: string) {
  const session = await requireSession();
  await requirePermission(PERSONNEL_P.manage);
  return deletePersonnel(session.tenantId, session.userId, id);
}

export async function createResearchPublicationAction(data: unknown) {
  const session = await requireSession();
  await requirePermission(PERSONNEL_P.manage);
  const parsed = researchPublicationSchema.parse(data);
  return createResearchPublication(session.tenantId, session.userId, parsed);
}

export async function updateResearchPublicationAction(id: string, data: unknown) {
  const session = await requireSession();
  await requirePermission(PERSONNEL_P.manage);
  const parsed = updateResearchPublicationSchema.parse(data);
  return updateResearchPublication(session.tenantId, session.userId, id, parsed);
}

export async function deleteResearchPublicationAction(id: string) {
  const session = await requireSession();
  await requirePermission(PERSONNEL_P.manage);
  return deleteResearchPublication(session.tenantId, session.userId, id);
}

export async function importPersonnelBatchAction(items: ImportPersonnelItem[]) {
  const session = await requireSession();
  await requirePermission(PERSONNEL_P.manage);
  return importPersonnelBatch(session.tenantId, session.userId, items);
}
