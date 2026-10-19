import { describe, it, expect } from "vitest";
import { adminDocumentSchema } from "./validations";

describe("Administration Validations", () => {
  it("validates document creation", () => {
    const validData = {
      title: "แบบฟอร์มขออนุมัติ",
      fileUrl: "https://example.com/form.pdf",
      category: "FORM",
      visibility: "PUBLIC",
    };
    expect(() => adminDocumentSchema.parse(validData)).not.toThrow();
    expect(() => adminDocumentSchema.parse({ ...validData, fileUrl: "not-a-url" })).toThrow();
  });

  it("validates university/faculty orders and announcements with docNumber and year", () => {
    const orderData = {
      title: "คำสั่งแต่งตั้งคณะกรรมการบริหารคณะพุทธศาสตร์ ประจำปี พ.ศ. ๒๕๖๙",
      description: "คำสั่งแต่งตั้งคณะกรรมการบริหารและคณาจารย์ประจำหลักสูตร",
      category: "POLICY",
      docType: "ORDER",
      docNumber: "๑๕/๒๕๖๙",
      year: "2569",
      issuerLevel: "FACULTY",
      visibility: "PUBLIC",
      isPublished: true,
      fileUrl: "/uploads/admin-documents/order-15-2569.pdf",
    };

    const parsed = adminDocumentSchema.parse(orderData);
    expect(parsed.docType).toBe("ORDER");
    expect(parsed.docNumber).toBe("๑๕/๒๕๖๙");
    expect(parsed.year).toBe("2569");
    expect(parsed.issuerLevel).toBe("FACULTY");
  });
});
