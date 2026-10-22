export { CERTIFICATES_P, CERTIFICATES_PERMISSIONS } from "./permissions";
export {
  CERTIFICATE_TEMPLATE_TYPES,
  CERTIFICATE_APPLICANT_TYPES,
  CERTIFICATE_PURPOSES,
  certificateMetadataSchema,
  parseCertificateNote,
  serializeCertificateNote,
  type CertificateTemplateType,
  type CertificateApplicantType,
  type CertificateRequestMetadata,
  SIGNER_PRESETS,
  SIGNER_NAME_PRESETS_TH,
  SIGNER_NAME_PRESETS_EN,
  SIGNER_TITLE_PRESETS_TH,
  SIGNER_TITLE_PRESETS_EN,
  type SignerPreset,
} from "./_internal/validations";
export {
  buildCertificateDocumentText,
  inferDefaultTemplate,
  isNewStudentAdmission,
  isFacultyOrStaffApplicant,
  INITIAL_EXCEL_CERTIFICATE_RECORDS,
  type BuiltCertificateText,
} from "./_internal/templates";
export {
  CertificateA4Document,
  CERTIFICATE_FONT_PRESETS,
  resolveFontFamilyCss,
  type CertificateFontPreset,
} from "./_internal/certificate-a4-document";
export {
  generateCertificateWordHtml,
  downloadCertificateAsWordDoc,
} from "./_internal/word-export";
