import type { Dictionary } from "@/shared/lib/i18n/translate";

export const MESSAGES: Dictionary = {
  "administration.nav": { th: "ดาวน์โหลดเอกสาร", en: "Document Center" },
  "administration.title": { th: "จัดการเอกสารและแบบฟอร์ม", en: "Manage Documents & Forms" },
  "administration.subtitle": { th: "อัปโหลดและเผยแพร่เอกสารดาวน์โหลดสำหรับบุคลากรและนิสิต", en: "Upload and publish documents for staff and students" },
  
  "administration.add": { th: "เพิ่มเอกสารใหม่", en: "Add New Document" },
  "administration.edit": { th: "แก้ไขเอกสาร", en: "Edit Document" },
  "administration.delete": { th: "ลบเอกสาร", en: "Delete Document" },
  "administration.deleteConfirm": { th: "คุณแน่ใจหรือไม่ว่าต้องการลบเอกสารนี้?", en: "Are you sure you want to delete this document?" },
  "administration.save": { th: "บันทึกเอกสาร", en: "Save Document" },
  "administration.saving": { th: "กำลังบันทึก...", en: "Saving..." },
  "administration.cancel": { th: "ยกเลิก", en: "Cancel" },

  "administration.field.title": { th: "ชื่อเอกสาร / แบบฟอร์ม", en: "Document / Form Title" },
  "administration.field.description": { th: "คำอธิบาย / รายละเอียด", en: "Description / Details" },
  "administration.field.category": { th: "หมวดหมู่เอกสาร", en: "Category" },
  "administration.field.visibility": { th: "ระดับสิทธิ์การเข้าถึง", en: "Visibility" },
  "administration.field.fileUrl": { th: "ลิงก์หรือไฟล์เอกสาร", en: "File or URL" },
  "administration.field.isPublished": { th: "สถานะการเผยแพร่", en: "Publish Status" },

  "administration.upload.btn": { th: "เลือกไฟล์เอกสาร", en: "Select File" },
  "administration.upload.hint": { th: "รองรับไฟล์ PDF, Word (.doc/.docx), Excel (.xls/.xlsx), PPT, รูปภาพ (สูงสุด 20MB)", en: "Supports PDF, Word, Excel, PPT, Images (Max 20MB)" },
  "administration.upload.success": { th: "อัปโหลดไฟล์สำเร็จ", en: "File uploaded successfully" },
  "administration.upload.orUrl": { th: "หรือระบุ URL ลิงก์ดาวน์โหลดโดยตรง", en: "Or enter direct download URL" },

  "administration.import": { th: "นำเข้าเอกสาร (Import)", en: "Import Documents" },
  "administration.import.description": { th: "นำเข้ารายการเอกสารพร้อมกันจากไฟล์ CSV หรือ JSON", en: "Batch import document list from CSV or JSON file" },
  "administration.import.success": { th: "นำเข้าเอกสารสำเร็จ", en: "Documents imported successfully" },
  "administration.import.error": { th: "รูปแบบไฟล์นำเข้าไม่ถูกต้อง", en: "Invalid import file format" },
  "administration.export": { th: "ส่งออก (Export)", en: "Export" },
  "administration.export.excel": { th: "ส่งออกเป็น CSV / Excel", en: "Export as CSV / Excel" },
  "administration.export.json": { th: "ส่งออกเป็น JSON", en: "Export as JSON" },
  "administration.downloadTemplate": { th: "ดาวน์โหลดไฟล์ตัวอย่าง (Template)", en: "Download Sample Template" },

  "administration.createSuccess": { th: "เพิ่มเอกสารเรียบร้อยแล้ว", en: "Document added successfully" },
  "administration.updateSuccess": { th: "แก้ไขเอกสารเรียบร้อยแล้ว", en: "Document updated successfully" },
  "administration.deleteSuccess": { th: "ลบเอกสารเรียบร้อยแล้ว", en: "Document deleted successfully" },

  "administration.search": { th: "ค้นหาเอกสาร...", en: "Search documents..." },
  "administration.filterAll": { th: "หมวดหมู่ทั้งหมด", en: "All Categories" },
  "administration.published": { th: "เผยแพร่แล้ว", en: "Published" },
  "administration.draft": { th: "แบบร่าง (ซ่อน)", en: "Draft" },

  "administration.category.FORM": { th: "แบบฟอร์ม", en: "Form" },
  "administration.category.MANUAL": { th: "คู่มือปฏิบัติงาน", en: "Manual" },
  "administration.category.POLICY": { th: "ระเบียบ/ประกาศ", en: "Policy" },
  "administration.category.OTHER": { th: "อื่นๆ", en: "Other" },

  "administration.visibility.PUBLIC": { th: "สาธารณะ (ทุกคน)", en: "Public" },
  "administration.visibility.INTERNAL": { th: "เฉพาะบุคลากรภายใน", en: "Internal Only" },

  "administration.field.docNumber": { th: "เลขที่คำสั่ง / ประกาศ", en: "Document Number" },
  "administration.field.year": { th: "ปี พ.ศ. (เช่น ๒๕๖๘)", en: "Buddhist Year (e.g. 2568)" },
  "administration.field.issuerLevel": { th: "ระดับหน่วยงานผู้ออกเอกสาร", en: "Issuing Organization Level" },
  "administration.field.docType": { th: "ประเภทเอกสารเจาะจง", en: "Specific Document Type" },

  "administration.issuer.FACULTY": { th: "คณะพุทธศาสตร์", en: "Faculty of Buddhism" },
  "administration.issuer.UNIVERSITY": { th: "มหาวิทยาลัย (มจร.)", en: "University (MCU)" },

  "administration.type.ORDER": { th: "คำสั่ง", en: "Order" },
  "administration.type.ANNOUNCEMENT": { th: "ประกาศ", en: "Announcement" },
  "administration.type.REGULATION": { th: "ระเบียบ / ข้อบังคับ", en: "Regulation" },
  "administration.type.FORM": { th: "แบบฟอร์มคำร้อง", en: "Form" },
  "administration.type.MANUAL": { th: "คู่มือปฏิบัติงาน", en: "Manual" },
  "administration.type.OTHER": { th: "เอกสารทั่วไป", en: "General Document" },
  "administration.type.GENERAL": { th: "ทั่วไป", en: "General" },

  "roles.module.administration": { th: "ระบบดาวน์โหลดเอกสาร", en: "Document Center" },
  "perm.administration:read": { th: "ดูเอกสาร", en: "View documents" },
  "perm.administration:manage": { th: "จัดการเอกสาร", en: "Manage documents" },
};
