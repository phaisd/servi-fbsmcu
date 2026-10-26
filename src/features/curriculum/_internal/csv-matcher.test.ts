import { describe, it, expect } from "vitest";
import {
  normalizeCurriculumText,
  isEnglishProgramText,
  findBestMatchingCurriculum,
  findBestMatchingDepartment,
} from "./csv-matcher";

describe("curriculum csv-matcher", () => {
  const sampleCurriculums = [
    {
      id: "curr-rel-phil",
      nameTh: "พุทธศาสตรบัณฑิต สาขาวิชาศาสนาและปรัชญา",
      nameEn: null,
    },
    {
      id: "curr-rel-phil-en",
      nameTh: "พุทธศาสตรบัณฑิต สาขาวิชาศาสนาและปรัชญา (หลักสูตรภาษาอังกฤษ)",
      nameEn: "Bachelor of Arts in Religion and Philosophy (English Program)",
    },
    {
      id: "curr-buddhism",
      nameTh: "พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา",
      nameEn: "Bachelor of Arts in Buddhism",
    },
    {
      id: "curr-buddhism-en",
      nameTh: "พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา (หลักสูตรภาษาอังกฤษ)",
      nameEn: "Bachelor of Arts in Buddhism (English Program)",
    },
    {
      id: "curr-vipassana",
      nameTh: "พุทธศาสตรบัณฑิต สาขาวิชาวิปัสสนาภาวนา",
      nameEn: "Bachelor of Arts in Vipassana Meditation",
    },
    {
      id: "curr-pali",
      nameTh: "พุทธศาสตรบัณฑิต สาขาวิชาบาลีและสันสกฤต",
      nameEn: "Bachelor of Arts in Pali and Sanskrit",
    },
  ];

  const sampleDepartments = [
    {
      id: "dept-rel-phil",
      nameTh: "ภาควิชาศาสนาและปรัชญา",
      nameEn: "Department of Religion and Philosophy",
    },
    {
      id: "dept-buddhism",
      nameTh: "ภาควิชาพระพุทธศาสนา",
      nameEn: "Department of Buddhism",
    },
    {
      id: "dept-pali",
      nameTh: "ภาควิชาบาลีและสันสกฤต",
      nameEn: "Department of Pali and Sanskrit",
    },
  ];

  describe("normalizeCurriculumText & isEnglishProgramText", () => {
    it("normalizes spacing, prefix, Pali/Sanskrit variants, and English Program tags", () => {
      expect(
        normalizeCurriculumText("หลักสูตร พุทธศาสตรบัณฑิต สาขาวิชาบาลีและสันสกฤต (English Program)")
      ).toBe("พุทธศาสตรบัณฑิต สาขาวิชาบาลีสันสกฤต (หลักสูตรภาษาอังกฤษ)");
    });

    it("detects English / International program text accurately", () => {
      expect(isEnglishProgramText("พุทธศาสตรบัณฑิต (หลักสูตรภาษาอังกฤษ)")).toBe(true);
      expect(isEnglishProgramText("Bachelor of Arts (English Program)")).toBe(true);
      expect(isEnglishProgramText("หลักสูตรนานาชาติ")).toBe(true);
      expect(isEnglishProgramText("พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา")).toBe(false);
    });
  });

  describe("findBestMatchingCurriculum", () => {
    it("matches 'พุทธศาสตรบัณฑิต สาขาวิชาวิปัสสนาภาวนา' even when an earlier curriculum has nameEn: null", () => {
      const match = findBestMatchingCurriculum(
        "พุทธศาสตรบัณฑิต สาขาวิชาวิปัสสนาภาวนา",
        sampleCurriculums
      );
      expect(match?.id).toBe("curr-vipassana");

      const subMatch = findBestMatchingCurriculum("สาขาวิชาวิปัสสนาภาวนา", sampleCurriculums);
      expect(subMatch?.id).toBe("curr-vipassana");
    });

    it("distinguishes regular Thai programs vs (หลักสูตรภาษาอังกฤษ) / (English Program) for พระพุทธศาสนา and ศาสนาและปรัชญา", () => {
      expect(
        findBestMatchingCurriculum("พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา", sampleCurriculums)?.id
      ).toBe("curr-buddhism");

      expect(
        findBestMatchingCurriculum(
          "พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา (หลักสูตรภาษาอังกฤษ)",
          sampleCurriculums
        )?.id
      ).toBe("curr-buddhism-en");

      expect(
        findBestMatchingCurriculum(
          "สาขาวิชาพระพุทธศาสนา (English Program)",
          sampleCurriculums
        )?.id
      ).toBe("curr-buddhism-en");

      expect(
        findBestMatchingCurriculum("พุทธศาสตรบัณฑิต สาขาวิชาศาสนาและปรัชญา", sampleCurriculums)?.id
      ).toBe("curr-rel-phil");

      expect(
        findBestMatchingCurriculum(
          "พุทธศาสตรบัณฑิต สาขาวิชาศาสนาและปรัชญา (English Program)",
          sampleCurriculums
        )?.id
      ).toBe("curr-rel-phil-en");
    });

    it("matches 'สาขาวิชาบาลีสันสกฤต' to 'พุทธศาสตรบัณฑิต สาขาวิชาบาลีและสันสกฤต'", () => {
      const match = findBestMatchingCurriculum("สาขาวิชาบาลีสันสกฤต", sampleCurriculums);
      expect(match?.id).toBe("curr-pali");
    });
  });

  describe("findBestMatchingDepartment", () => {
    it("ensures 'ภาควิชาพระพุทธศาสนา' never matches 'ภาควิชาศาสนาและปรัชญา'", () => {
      const onlyRelPhil = [sampleDepartments[0]]; // only ภาควิชาศาสนาและปรัชญา
      const match = findBestMatchingDepartment("ภาควิชาพระพุทธศาสนา", onlyRelPhil);
      expect(match).toBeUndefined();

      const fullMatch = findBestMatchingDepartment("ภาควิชาพระพุทธศาสนา", sampleDepartments);
      expect(fullMatch?.id).toBe("dept-buddhism");
    });

    it("matches department with normalized Pali/Sanskrit text", () => {
      const match = findBestMatchingDepartment("สาขาวิชาบาลีสันสกฤต", sampleDepartments);
      expect(match?.id).toBe("dept-pali");
    });
  });
});
