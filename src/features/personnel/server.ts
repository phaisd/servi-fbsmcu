import "server-only";

export {
  getDepartments,
  getPersonnelList,
  getPublicPersonnelList,
  getPublicPersonnelById,
  getResearchPublications,
  getPersonnelPortalConfig,
  updatePersonnelPortalConfig,
  type PersonnelPortalConfig,
} from "./_internal/services";
