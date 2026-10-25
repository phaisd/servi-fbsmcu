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
  type TeachingCourse,
  type DegreeLevel,
  type CurriculumLanguage,
  MCU_LATEST_TIMETABLE_YEAR,
  MCU_LATEST_TIMETABLE_SEMESTER,
  parseTeachingExperiences,
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
