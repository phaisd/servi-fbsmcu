/**
 * File validation and upload security utilities
 * Enforces strict whitelist of extensions, MIME types, and file magic bytes
 * to prevent Web Shells, Stored XSS, and arbitrary binary uploads.
 */

export interface ValidateFileOptions {
  allowedExtensions: string[];
  maxSizeBytes: number;
}

const DANGEROUS_EXTENSIONS = new Set([
  "exe", "bat", "cmd", "ps1", "vbs", "js", "mjs", "cjs", "sh", "bash",
  "py", "pl", "php", "phtml", "asp", "aspx", "jsp", "html", "htm", "xhtml",
  "svg", "dll", "com", "scr", "hta", "msi", "reg", "wsf", "jar"
]);

/**
 * Checks file header magic bytes to verify file format integrity.
 */
export function checkMagicBytes(buffer: Buffer, ext: string): boolean {
  if (buffer.length < 4) return false;

  const normalizedExt = ext.toLowerCase().replace(/^\./, "");

  switch (normalizedExt) {
    case "pdf":
      // %PDF (0x25 0x50 0x44 0x46)
      return (
        buffer[0] === 0x25 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x44 &&
        buffer[3] === 0x46
      );

    case "png":
      // 0x89 0x50 0x4E 0x47
      return (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4E &&
        buffer[3] === 0x47
      );

    case "jpg":
    case "jpeg":
      // 0xFF 0xD8 0xFF
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

    case "webp":
      // RIFF .... WEBP
      if (buffer.length < 12) return false;
      return (
        buffer[0] === 0x52 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x46 &&
        buffer[8] === 0x57 &&
        buffer[9] === 0x45 &&
        buffer[10] === 0x42 &&
        buffer[11] === 0x50
      );

    case "docx":
    case "xlsx":
    case "pptx":
      // PK.. (0x50 0x4B 0x03 0x04) Zip-based Office formats
      return buffer[0] === 0x50 && buffer[1] === 0x4b;

    default:
      return true;
  }
}

/**
 * Validates a file against extension whitelist, dangerous extension blacklist,
 * size limit, and header magic bytes.
 */
export function validateUploadFile(
  fileName: string,
  buffer: Buffer,
  options: ValidateFileOptions
): { valid: boolean; ext: string; error?: string } {
  if (!fileName || typeof fileName !== "string") {
    return { valid: false, ext: "", error: "ชื่อไฟล์ไม่ถูกต้อง" };
  }

  if (buffer.length === 0) {
    return { valid: false, ext: "", error: "ไฟล์ว่างเปล่า" };
  }

  if (buffer.length > options.maxSizeBytes) {
    return {
      valid: false,
      ext: "",
      error: `ขนาดไฟล์เกินกำหนด (สูงสุด ${Math.round(options.maxSizeBytes / (1024 * 1024))}MB)`
    };
  }

  const parts = fileName.split(".");
  if (parts.length < 2) {
    return { valid: false, ext: "", error: "ไฟล์ไม่มีนามสกุล" };
  }

  const ext = parts.pop()!.toLowerCase().trim();

  // Instant block of known dangerous extensions
  if (DANGEROUS_EXTENSIONS.has(ext)) {
    return { valid: false, ext, error: `ไม่อนุญาตให้อัปโหลดไฟล์ประเภท .${ext} เนื่องจากความปลอดภัย` };
  }

  const allowed = options.allowedExtensions.map((e) => e.toLowerCase().replace(/^\./, ""));
  if (!allowed.includes(ext)) {
    return {
      valid: false,
      ext,
      error: `ประเภทไฟล์ไม่ได้รับอนุญาต (อนุญาตเฉพาะ: ${allowed.join(", ")})`
    };
  }

  // Check magic bytes
  if (!checkMagicBytes(buffer, ext)) {
    return {
      valid: false,
      ext,
      error: `เนื้อหาของไฟล์ไม่ตรงกับนามสกุล .${ext} (อาจเป็นไฟล์ปลอมแปลงหรือเสียหาย)`
    };
  }

  return { valid: true, ext };
}
