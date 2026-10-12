import "server-only";

export {
  getCurriculums,
  getPublicCurriculums,
  createCurriculum,
  updateCurriculum,
  deleteCurriculum,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getTimetables,
  getPublicTimetables,
  getTimetableById,
  createTimetable,
  updateTimetable,
  deleteTimetable,
  batchImportTimetables,
  type BatchImportTimetableItem,
} from "./_internal/services";
