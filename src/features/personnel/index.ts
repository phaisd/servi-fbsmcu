export { PERSONNEL_P, PERSONNEL_PERMISSIONS } from "./permissions";
export {
  exportPersonnelDoc,
  type ExportPersonnelDocData,
  type ExportDocMode,
} from "./export-profile-doc";
export {
  formatPersonnelName,
  type PersonnelNameInput,
} from "./format-name";
export {
  type AcademicPositionItem,
  detectAttachmentType,
  parseAcademicPositions,
  serializeExperiencesWithPositions,
} from "./academic-positions";
export {
  type TeachingCourse,
  type DegreeLevel,
  type CurriculumLanguage,
  MCU_LATEST_TIMETABLE_YEAR,
  MCU_LATEST_TIMETABLE_SEMESTER,
  parseTeachingExperiences,
  getTeachingCoursesForPersonnel,
  getLatestTeachingSummary,
  getCurriculumLanguageInfo,
  toThaiDigits,
  normalizeCourseYear,
  normalizeCourseCode,
  getCourseUniqueKey,
  upsertTeachingCourses,
  type UpsertTeachingCoursesResult,
  formatDegreeLevelLabel,
  getDegreeLevelColor,
} from "./teaching-courses";
export {
  type ExecutiveTier,
  type ExecutiveSlotDefinition,
  type MinimalPersonnelForExecutive,
  type ClassifiedExecutive,
  FACULTY_EXECUTIVE_SLOTS,
  matchExecutiveSlot,
  classifyExecutivePersonnel,
  computeStepDownUpdates,
  computeAppointExecutiveUpdates,
} from "./executive-roles";
