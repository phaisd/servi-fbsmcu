/**
 * Utility for formatting personnel names with flexible Academic Title placement (PREFIX or SUFFIX)
 * Specifically supports Thai Buddhist monks where academic titles can be placed before or after their monastic name/somnasak.
 */

export interface PersonnelNameInput {
  firstNameTh: string;
  lastNameTh?: string | null;
  academicPosition?: string | null;
  titlePlacement?: string | null;
}

export function formatPersonnelName(person: PersonnelNameInput): string {
  const academic = (person.academicPosition || "").trim();
  let baseFirst = (person.firstNameTh || "").trim();
  const last = (person.lastNameTh || "").trim();

  // 1. Strip duplicate academic title if already present at the end of baseFirst
  if (academic) {
    const escaped = academic.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    baseFirst = baseFirst.replace(new RegExp(`[,\\s]*${escaped}[,\\s]*$`, "g"), "").trim();
  }
  // Strip common trailing titles if mistakenly attached to name
  baseFirst = baseFirst.replace(/[,，]\s*(ศ\.ดร\.|รศ\.ดร\.|ผศ\.ดร\.|ดร\.|อาจารย์, ดร\.|อาจารย์|ผศ\.|รศ\.)\s*$/g, "").trim();

  const fullName = `${baseFirst} ${last}`.trim();

  if (!academic) {
    return fullName;
  }

  // 2. Title Placement: "PREFIX" (e.g. "ผศ.ดร. พระราชญาณวชิรเวที") or "SUFFIX" (e.g. "พระราชญาณวชิรเวที, ผศ.ดร.")
  const placement = person.titlePlacement?.toUpperCase() === "SUFFIX" ? "SUFFIX" : "PREFIX";

  if (placement === "SUFFIX") {
    return `${fullName}, ${academic}`;
  }

  // Default PREFIX
  return `${academic} ${fullName}`;
}
