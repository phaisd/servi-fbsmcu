export { CERTIFICATES_P, CERTIFICATES_PERMISSIONS } from "./permissions";
export {
  CERTIFICATE_TEMPLATE_TYPES,
  CERTIFICATE_PURPOSES,
  certificateMetadataSchema,
  parseCertificateNote,
  serializeCertificateNote,
  type CertificateTemplateType,
  type CertificateRequestMetadata,
} from "./_internal/validations";
export {
  buildCertificateDocumentText,
  inferDefaultTemplate,
  INITIAL_EXCEL_CERTIFICATE_RECORDS,
  type BuiltCertificateText,
} from "./_internal/templates";
export { CertificateA4Document } from "./_internal/certificate-a4-document";

