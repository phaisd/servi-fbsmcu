import { describe, it, expect } from "vitest";
import { validateUploadFile, checkMagicBytes } from "./file-validation";

describe("file-validation security", () => {
  it("rejects dangerous executable and script extensions", () => {
    const dangerousNames = [
      "malware.exe",
      "shell.php",
      "script.ps1",
      "attack.bat",
      "xss.html",
      "xss.svg",
      "worm.vbs",
      "miner.sh"
    ];

    for (const name of dangerousNames) {
      const dummyBuffer = Buffer.from("dummy payload");
      const res = validateUploadFile(name, dummyBuffer, {
        allowedExtensions: ["pdf", "png", "jpg"],
        maxSizeBytes: 10 * 1024 * 1024,
      });
      expect(res.valid).toBe(false);
      expect(res.error).toBeDefined();
    }
  });

  it("rejects files exceeding size limit", () => {
    const largeBuffer = Buffer.alloc(100);
    const res = validateUploadFile("document.pdf", largeBuffer, {
      allowedExtensions: ["pdf"],
      maxSizeBytes: 50,
    });
    expect(res.valid).toBe(false);
    expect(res.error).toContain("ขนาดไฟล์เกินกำหนด");
  });

  it("rejects spoofed extension if magic bytes do not match (e.g. .exe renamed to .pdf)", () => {
    // Windows executable starts with MZ (0x4D, 0x5A)
    const fakePdf = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]);
    const res = validateUploadFile("invoice.pdf", fakePdf, {
      allowedExtensions: ["pdf"],
      maxSizeBytes: 10 * 1024 * 1024,
    });
    expect(res.valid).toBe(false);
    expect(res.error).toContain("เนื้อหาของไฟล์ไม่ตรงกับนามสกุล");
  });

  it("accepts valid PDF with %PDF magic bytes", () => {
    const validPdf = Buffer.from("%PDF-1.7 actual pdf content here");
    const res = validateUploadFile("my-document.pdf", validPdf, {
      allowedExtensions: ["pdf"],
      maxSizeBytes: 10 * 1024 * 1024,
    });
    expect(res.valid).toBe(true);
    expect(res.ext).toBe("pdf");
  });

  it("accepts valid PNG with PNG magic bytes", () => {
    const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const res = validateUploadFile("photo.png", validPng, {
      allowedExtensions: ["png", "jpg"],
      maxSizeBytes: 10 * 1024 * 1024,
    });
    expect(res.valid).toBe(true);
    expect(res.ext).toBe("png");
  });
});
