import { describe, it, expect } from "vitest";
import { assignTeacherSchema } from "./validations";

describe("Course Multiple Teachers & Roles Validations", () => {
  it("validates assignTeacherSchema accepts valid roles", () => {
    const primary = assignTeacherSchema.parse({
      courseId: "123e4567-e89b-12d3-a456-426614174000",
      userId: "123e4567-e89b-12d3-a456-426614174001",
      role: "PRIMARY_TEACHER",
    });
    expect(primary.role).toBe("PRIMARY_TEACHER");

    const coTeacher = assignTeacherSchema.parse({
      courseId: "123e4567-e89b-12d3-a456-426614174000",
      userId: "123e4567-e89b-12d3-a456-426614174002",
      role: "CO_TEACHER",
    });
    expect(coTeacher.role).toBe("CO_TEACHER");

    const assistant = assignTeacherSchema.parse({
      courseId: "123e4567-e89b-12d3-a456-426614174000",
      userId: "123e4567-e89b-12d3-a456-426614174003",
      role: "TEACHING_ASSISTANT",
    });
    expect(assistant.role).toBe("TEACHING_ASSISTANT");
  });

  it("defaults role to CO_TEACHER if not specified", () => {
    const parsed = assignTeacherSchema.parse({
      courseId: "123e4567-e89b-12d3-a456-426614174000",
      userId: "123e4567-e89b-12d3-a456-426614174001",
    });
    expect(parsed.role).toBe("CO_TEACHER");
  });

  it("rejects invalid role names", () => {
    expect(() =>
      assignTeacherSchema.parse({
        courseId: "123e4567-e89b-12d3-a456-426614174000",
        userId: "123e4567-e89b-12d3-a456-426614174001",
        role: "STUDENT_MONITOR", // not allowed
      })
    ).toThrow();
  });
});
