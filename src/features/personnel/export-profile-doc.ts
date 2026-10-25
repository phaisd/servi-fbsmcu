import {
  type TeachingCourse,
  parseTeachingExperiences,
  getCurriculumLanguageInfo,
} from "./teaching-courses";
import { formatPersonnelName } from "./format-name";

export interface ExportPersonnelDocData {
  id?: string;
  academicPosition?: string | null;
  academicPositionEn?: string | null;
  titlePlacement?: string | null;
  firstNameTh: string;
  lastNameTh?: string | null;
  firstNameEn?: string | null;
  lastNameEn?: string | null;
  positionTh: string;
  positionEn?: string | null;
  type?: string;
  departmentName?: string | null;
  department?: {
    nameTh: string;
    nameEn?: string | null;
  } | null;
  email?: string | null;
  phoneNumber?: string | null;
  contactInfo?: string | null;
  imageUrl?: string | null;
  educationTh?: string | null;
  experiencesTh?: string | null;
  bioTh?: string | null;
  researchPublications?: Array<{
    id?: string;
    titleTh: string;
    titleEn?: string | null;
    authors: string;
    journalName: string;
    volume?: string | null;
    issue?: string | null;
    publicationYear?: string | null;
    pages?: string | null;
    tier?: string | null;
    url?: string | null;
    type?: string;
  }>;
}

export type ExportDocMode = "one-page" | "full";

export function exportPersonnelDoc(data: ExportPersonnelDocData, mode: ExportDocMode = "full") {
  if (typeof window === "undefined") return;

  const fullNameTh = formatPersonnelName(data);
  const fullNameEn = [data.academicPositionEn, data.firstNameEn, data.lastNameEn].filter(Boolean).join(" ");
  const deptName = data.department?.nameTh || data.departmentName || "คณะพุทธศาสตร์";
  const facultyName = "คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย";

  const teachingCourses: TeachingCourse[] = parseTeachingExperiences(data.experiencesTh, {
    id: data.id,
    firstNameTh: data.firstNameTh,
    lastNameTh: data.lastNameTh || undefined,
    departmentName: deptName,
  });

  const bachelorCourses = teachingCourses.filter((c) => c.level === "BACHELOR");
  const masterCourses = teachingCourses.filter((c) => c.level === "MASTER");
  const doctoralCourses = teachingCourses.filter((c) => c.level === "DOCTORAL");

  const publications = data.researchPublications || [];
  const currentDateThai = new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const isOnePage = mode === "one-page";
  const docTitle = isOnePage
    ? `สรุปประวัติ_1หน้า_${fullNameTh.replace(/\s+/g, "_")}`
    : `รายงานประวัติฉบับเต็ม_${fullNameTh.replace(/\s+/g, "_")}`;

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>${docTitle}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: ${isOnePage ? "10mm 12mm" : "15mm 18mm"};
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Sarabun', system-ui, -apple-system, sans-serif;
      color: #1e293b;
      background-color: #f8fafc;
      font-size: ${isOnePage ? "12px" : "13px"};
      line-height: ${isOnePage ? "1.4" : "1.55"};
      -webkit-font-smoothing: antialiased;
    }

    /* Floating Action Bar (hidden in print) */
    .action-bar {
      position: sticky;
      top: 0;
      z-index: 9999;
      background: #0f172a;
      color: #f8fafc;
      padding: 10px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .action-bar .brand {
      font-size: 13px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .action-bar .badge {
      background: #b45309;
      color: #ffffff;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: bold;
    }
    .action-bar .btn-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn {
      appearance: none;
      border: none;
      padding: 6px 14px;
      border-radius: 8px;
      font-family: inherit;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .btn-primary {
      background: #d97706;
      color: #ffffff;
    }
    .btn-primary:hover {
      background: #b45309;
    }
    .btn-secondary {
      background: #334155;
      color: #f8fafc;
    }
    .btn-secondary:hover {
      background: #475569;
    }
    .btn-close {
      background: transparent;
      color: #94a3b8;
    }
    .btn-close:hover {
      color: #ffffff;
    }

    /* Printable Page Container */
    .page-container {
      max-width: 820px;
      margin: 20px auto;
      background: #ffffff;
      padding: ${isOnePage ? "24px 28px" : "36px 42px"};
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04);
    }

    /* Official Header */
    .doc-header {
      border-bottom: 2px solid #b45309;
      padding-bottom: 12px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .doc-header .org-info h1 {
      font-size: ${isOnePage ? "15px" : "17px"};
      font-weight: 700;
      color: #78350f;
      line-height: 1.25;
    }
    .doc-header .org-info h2 {
      font-size: ${isOnePage ? "12px" : "13px"};
      font-weight: 600;
      color: #92400e;
    }
    .doc-header .org-info p {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    .doc-header .meta-tag {
      text-align: right;
      font-size: 10px;
      color: #64748b;
      white-space: nowrap;
    }
    .doc-header .meta-tag .tag-badge {
      display: inline-block;
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
      padding: 2px 8px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 10.5px;
      margin-bottom: 3px;
    }

    /* Profile Hero Card */
    .profile-card {
      display: flex;
      align-items: flex-start;
      gap: 18px;
      background: #fffbeb;
      border: 1px solid #fde68a;
      padding: ${isOnePage ? "12px 16px" : "16px 20px"};
      border-radius: 10px;
      margin-bottom: ${isOnePage ? "14px" : "20px"};
    }
    .avatar-box {
      width: ${isOnePage ? "75px" : "96px"};
      height: ${isOnePage ? "100px" : "128px"};
      border-radius: 8px;
      overflow: hidden;
      border: 2px solid #d97706;
      background: #ffffff;
      flex-shrink: 0;
      box-shadow: 0 2px 6px rgba(180, 83, 9, 0.15);
    }
    .avatar-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: top;
      display: block;
    }
    .avatar-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fef3c7;
      color: #b45309;
      font-size: 28px;
      font-weight: bold;
    }
    .profile-info {
      flex: 1;
      min-width: 0;
    }
    .profile-name-th {
      font-size: ${isOnePage ? "16px" : "20px"};
      font-weight: 700;
      color: #0f172a;
      line-height: 1.2;
    }
    .profile-name-en {
      font-size: ${isOnePage ? "11.5px" : "13px"};
      color: #64748b;
      font-weight: 500;
      margin-top: 1px;
    }
    .profile-pos {
      font-size: ${isOnePage ? "12px" : "13.5px"};
      color: #b45309;
      font-weight: 600;
      margin-top: 4px;
    }
    .profile-contacts {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 8px;
      font-size: 11px;
      color: #475569;
    }
    .contact-item {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    /* Section Styles */
    .section {
      margin-bottom: ${isOnePage ? "14px" : "22px"};
    }
    .section-title {
      font-size: ${isOnePage ? "13px" : "14.5px"};
      font-weight: 700;
      color: #78350f;
      display: flex;
      align-items: center;
      gap: 6px;
      border-bottom: 1.5px solid #fed7aa;
      padding-bottom: 4px;
      margin-bottom: ${isOnePage ? "8px" : "10px"};
    }
    .section-title .bullet {
      width: 6px;
      height: 14px;
      background: #d97706;
      border-radius: 2px;
    }

    /* 2-Column Grid for One-Page Mode */
    .grid-2col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    /* Lists & Items */
    .text-block {
      white-space: pre-line;
      color: #334155;
      font-size: ${isOnePage ? "11.5px" : "12.5px"};
      line-height: 1.5;
    }
    .edu-list, .exp-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .edu-item {
      position: relative;
      padding-left: 14px;
      color: #334155;
      font-size: ${isOnePage ? "11.5px" : "12.5px"};
    }
    .edu-item::before {
      content: "•";
      position: absolute;
      left: 0;
      color: #d97706;
      font-weight: bold;
    }

    /* Course Table */
    .table-container {
      width: 100%;
      overflow-x: auto;
      margin-top: 6px;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: ${isOnePage ? "10.5px" : "12px"};
      text-align: left;
    }
    table.data-table th {
      background: #f8fafc;
      color: #475569;
      font-weight: 700;
      padding: 6px 8px;
      border-top: 1px solid #e2e8f0;
      border-bottom: 2px solid #cbd5e1;
    }
    table.data-table td {
      padding: 6px 8px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: top;
      color: #334155;
    }
    table.data-table tr:nth-child(even) {
      background: #fafafa;
    }
    .level-badge {
      display: inline-block;
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 9.5px;
      font-weight: 700;
      white-space: nowrap;
    }
    .badge-bachelor { background: #dbeafe; color: #1e40af; }
    .badge-master { background: #fef3c7; color: #92400e; }
    .badge-doctoral { background: #f3e8ff; color: #6b21a8; }

    /* Publications List */
    .pub-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .pub-item {
      padding: ${isOnePage ? "6px 8px" : "8px 12px"};
      border-radius: 6px;
      background: #f8fafc;
      border-left: 3px solid #d97706;
      font-size: ${isOnePage ? "11px" : "12px"};
    }
    .pub-title {
      font-weight: 700;
      color: #0f172a;
      line-height: 1.3;
    }
    .pub-meta {
      color: #64748b;
      font-size: 10.5px;
      margin-top: 3px;
    }
    .pub-tier {
      display: inline-block;
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      padding: 1px 5px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 9.5px;
      margin-left: 4px;
    }

    /* Footer Note & Official Stamp */
    .doc-footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 14px;
      margin-top: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 10px;
      color: #94a3b8;
    }

    /* Print Styles */
    @media print {
      body {
        background: #ffffff !important;
        font-size: ${isOnePage ? "11px" : "12px"} !important;
      }
      .action-bar {
        display: none !important;
      }
      .page-container {
        box-shadow: none !important;
        padding: 0 !important;
        margin: 0 !important;
        max-width: none !important;
        width: 100% !important;
      }
      .profile-card {
        background: #fffbeb !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .section {
        page-break-inside: avoid;
      }
      a {
        text-decoration: none !important;
        color: inherit !important;
      }
    }
  </style>
</head>
<body>

  <!-- Floating Actions (Non-Printable) -->
  <div class="action-bar">
    <div class="brand">
      <span>🏛️ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย</span>
      <span class="badge">${isOnePage ? "สรุปหน้าเดียว (1-Page CV)" : "รายงานประวัติฉบับเต็ม"}</span>
    </div>
    <div class="btn-group">
      <button type="button" class="btn btn-primary" onclick="window.print()">
        <span>🖨️ พิมพ์ / บันทึกเป็น PDF</span>
      </button>
      <button type="button" class="btn btn-secondary" onclick="downloadHtml()">
        <span>💾 ดาวน์โหลดไฟล์ HTML</span>
      </button>
      <button type="button" class="btn btn-close" onclick="window.close()">✕ ปิด</button>
    </div>
  </div>

  <!-- Document Page -->
  <div class="page-container">

    <!-- Official Header -->
    <header class="doc-header">
      <div class="org-info">
        <h1>${facultyName}</h1>
        <h2>แฟ้มประวัติและผลงานทางวิชาการ (Academic Dossier)</h2>
        <p>${deptName} • มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย อยุธยา</p>
      </div>
      <div class="meta-tag">
        <div class="tag-badge">${isOnePage ? "ONE-PAGE CV" : "FULL DOSSIER"}</div>
        <div>ข้อมูล ณ วันที่: ${currentDateThai}</div>
      </div>
    </header>

    <!-- Faculty Hero Profile Card -->
    <div class="profile-card">
      <div class="avatar-box">
        ${
          data.imageUrl
            ? `<img src="${data.imageUrl}" alt="${fullNameTh}" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'avatar-placeholder\\'>${data.firstNameTh[0] || 'U'}</div>';" />`
            : `<div class="avatar-placeholder">${data.firstNameTh[0] || "U"}</div>`
        }
      </div>
      <div class="profile-info">
        <div class="profile-name-th">${fullNameTh}</div>
        ${fullNameEn ? `<div class="profile-name-en">${fullNameEn}</div>` : ""}
        <div class="profile-pos">${data.positionTh}</div>
        <div class="profile-contacts">
          ${data.email ? `<span class="contact-item">✉️ ${data.email}</span>` : ""}
          ${data.phoneNumber ? `<span class="contact-item">📞 ${data.phoneNumber}</span>` : ""}
          ${data.contactInfo ? `<span class="contact-item">📍 ${data.contactInfo}</span>` : ""}
          <span class="contact-item">🏛️ ${deptName}</span>
        </div>
      </div>
    </div>

    ${
      isOnePage
        ? `
      <!-- ONE-PAGE COMPACT LAYOUT (พอดี 1 หน้ากระดาษ A4) -->
      <div class="grid-2col">
        <!-- Left Column -->
        <div>
          <!-- Section 1: Education -->
          <div class="section">
            <h3 class="section-title"><span class="bullet"></span> ประวัติการศึกษา (Education)</h3>
            ${
              data.educationTh
                ? `<ul class="edu-list">
                    ${data.educationTh
                      .split("\n")
                      .filter((l) => l.trim().length > 0)
                      .slice(0, 4)
                      .map((line) => `<li class="edu-item">${line.trim()}</li>`)
                      .join("")}
                  </ul>`
                : `<p class="text-block text-muted">ข้อมูลอยู่ระหว่างการประมวลผล</p>`
            }
          </div>

          <!-- Section 2: Expertise & Bio -->
          <div class="section">
            <h3 class="section-title"><span class="bullet"></span> ความเชี่ยวชาญพิเศษ (Expertise)</h3>
            <p class="text-block">${data.bioTh || "มีความเชี่ยวชาญด้านพระไตรปิฎกศึกษา พระพุทธศาสนาเถรวาท และปรัชญาอินเดีย"}</p>
          </div>
        </div>

        <!-- Right Column -->
        <div>
          <!-- Section 3: Key Teaching Courses -->
          <div class="section">
            <h3 class="section-title"><span class="bullet"></span> รายวิชาที่รับผิดชอบสอน (${teachingCourses.length} วิชา)</h3>
            ${
              teachingCourses.length > 0
                ? `<table class="data-table">
                    <thead>
                      <tr>
                        <th style="width: 25%;">รหัส</th>
                        <th>ชื่อรายวิชา</th>
                        <th style="width: 20%; text-align: center;">ระดับ</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${teachingCourses
                        .slice(0, 5)
                        .map(
                          (c) => `
                        <tr>
                          <td style="font-weight: 600; font-family: monospace;">${c.courseCode}</td>
                          <td>
                            <div>${c.courseNameTh}</div>
                            <div style="font-size: 9.5px; color: #059669; font-weight: 600;">[${getCurriculumLanguageInfo(c).label}]</div>
                            ${c.courseNameEn ? `<div style="font-size: 9px; color: #64748b;">${c.courseNameEn}</div>` : ""}
                          </td>
                          <td style="text-align: center;">
                            <span class="level-badge ${
                              c.level === "DOCTORAL" ? "badge-doctoral" : c.level === "MASTER" ? "badge-master" : "badge-bachelor"
                            }">${c.level === "DOCTORAL" ? "พธ.ด." : c.level === "MASTER" ? "พธ.ม." : "พธ.บ."}</span>
                          </td>
                        </tr>
                      `
                        )
                        .join("")}
                    </tbody>
                  </table>`
                : `<p class="text-block text-muted">${data.experiencesTh || "อาจารย์ผู้สอนประจำหลักสูตรพุทธศาสตรบัณฑิต"}</p>`
            }
          </div>

          <!-- Section 4: Key Research & Publications -->
          <div class="section">
            <h3 class="section-title"><span class="bullet"></span> ผลงานวิจัยและสิ่งตีพิมพ์เด่น (${publications.length})</h3>
            ${
              publications.length > 0
                ? `<div class="pub-list">
                    ${publications
                      .slice(0, 3)
                      .map(
                        (p) => `
                      <div class="pub-item">
                        <div class="pub-title">${p.titleTh}</div>
                        <div class="pub-meta">
                          <span>${p.journalName}</span>
                          ${p.publicationYear ? ` • พ.ศ. ${p.publicationYear}` : ""}
                          ${p.tier ? `<span class="pub-tier">${p.tier}</span>` : ""}
                        </div>
                      </div>
                    `
                      )
                      .join("")}
                  </div>`
                : `<p class="text-block text-muted">ผลงานวิจัยอยู่ระหว่างการตีพิมพ์เผยแพร่</p>`
            }
          </div>
        </div>
      </div>
      `
        : `
      <!-- FULL MULTI-SECTION DOSSIER (รายงานฉบับเต็ม ทุกแท็บต่อกัน) -->

      <!-- Tab 1: Education & Biography -->
      <div class="section">
        <h3 class="section-title"><span class="bullet"></span> ประวัติการศึกษาและการดำรงตำแหน่ง (Education & Qualifications)</h3>
        ${
          data.educationTh
            ? `<ul class="edu-list">
                ${data.educationTh
                  .split("\n")
                  .filter((l) => l.trim().length > 0)
                  .map((line) => `<li class="edu-item">${line.trim()}</li>`)
                  .join("")}
              </ul>`
            : `<p class="text-block text-muted">ข้อมูลวุฒิการศึกษาอยู่ระหว่างการบันทึกเพิ่มเติม</p>`
        }
      </div>

      <!-- Tab 2: Teaching Courses Categorized by Degree Level -->
      <div class="section">
        <h3 class="section-title">
          <span class="bullet"></span> ภาระงานสอนและประสบการณ์รายวิชา แยกตามระดับการศึกษา (${teachingCourses.length} รายวิชา)
        </h3>
        ${
          teachingCourses.length > 0
            ? `
          ${
            doctoralCourses.length > 0
              ? `
            <div style="margin-top: 10px; margin-bottom: 12px;">
              <h4 style="font-size: 12px; font-weight: 700; color: #6b21a8; margin-bottom: 4px;">
                🪷 ระดับปริญญาเอก (หลักสูตรพุทธศาสตรดุษฎีบัณฑิต พธ.ด. / Ph.D.) - ${doctoralCourses.length} วิชา
              </h4>
              <table class="data-table">
                <thead>
                  <tr>
                    <th style="width: 15%;">รหัสวิชา</th>
                    <th style="width: 45%;">ชื่อรายวิชา</th>
                    <th style="width: 10%; text-align: center;">หน่วยกิต</th>
                    <th style="width: 15%;">ภาคเรียน/ปี</th>
                    <th style="width: 15%;">บทบาทหน้าที่</th>
                  </tr>
                </thead>
                <tbody>
                  ${doctoralCourses
                    .map(
                      (c) => `
                    <tr>
                      <td style="font-weight: 600; font-family: monospace;">${c.courseCode}</td>
                      <td>
                        <div style="font-weight: 600;">${c.courseNameTh}</div>
                        <div style="font-size: 10px; color: #059669; font-weight: 600;">[${getCurriculumLanguageInfo(c).label}] ${c.programTh ? `• ${c.programTh}` : ""}</div>
                        ${c.courseNameEn ? `<div style="font-size: 10px; color: #64748b;">${c.courseNameEn}</div>` : ""}
                      </td>
                      <td style="text-align: center;">${c.credits}</td>
                      <td>${c.semester}/${c.year}</td>
                      <td>${c.role}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
            `
              : ""
          }

          ${
            masterCourses.length > 0
              ? `
            <div style="margin-top: 10px; margin-bottom: 12px;">
              <h4 style="font-size: 12px; font-weight: 700; color: #92400e; margin-bottom: 4px;">
                📜 ระดับปริญญาโท (หลักสูตรพุทธศาสตรมหาบัณฑิต พธ.ม. / M.A.) - ${masterCourses.length} วิชา
              </h4>
              <table class="data-table">
                <thead>
                  <tr>
                    <th style="width: 15%;">รหัสวิชา</th>
                    <th style="width: 45%;">ชื่อรายวิชา</th>
                    <th style="width: 10%; text-align: center;">หน่วยกิต</th>
                    <th style="width: 15%;">ภาคเรียน/ปี</th>
                    <th style="width: 15%;">บทบาทหน้าที่</th>
                  </tr>
                </thead>
                <tbody>
                  ${masterCourses
                    .map(
                      (c) => `
                    <tr>
                      <td style="font-weight: 600; font-family: monospace;">${c.courseCode}</td>
                      <td>
                        <div style="font-weight: 600;">${c.courseNameTh}</div>
                        <div style="font-size: 10px; color: #059669; font-weight: 600;">[${getCurriculumLanguageInfo(c).label}] ${c.programTh ? `• ${c.programTh}` : ""}</div>
                        ${c.courseNameEn ? `<div style="font-size: 10px; color: #64748b;">${c.courseNameEn}</div>` : ""}
                      </td>
                      <td style="text-align: center;">${c.credits}</td>
                      <td>${c.semester}/${c.year}</td>
                      <td>${c.role}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
            `
              : ""
          }

          ${
            bachelorCourses.length > 0
              ? `
            <div style="margin-top: 10px; margin-bottom: 12px;">
              <h4 style="font-size: 12px; font-weight: 700; color: #1e40af; margin-bottom: 4px;">
                🏛️ ระดับปริญญาตรี (หลักสูตรพุทธศาสตรบัณฑิต พธ.บ. / B.A.) - ${bachelorCourses.length} วิชา
              </h4>
              <table class="data-table">
                <thead>
                  <tr>
                    <th style="width: 15%;">รหัสวิชา</th>
                    <th style="width: 45%;">ชื่อรายวิชา</th>
                    <th style="width: 10%; text-align: center;">หน่วยกิต</th>
                    <th style="width: 15%;">ภาคเรียน/ปี</th>
                    <th style="width: 15%;">บทบาทหน้าที่</th>
                  </tr>
                </thead>
                <tbody>
                  ${bachelorCourses
                    .map(
                      (c) => `
                    <tr>
                      <td style="font-weight: 600; font-family: monospace;">${c.courseCode}</td>
                      <td>
                        <div style="font-weight: 600;">${c.courseNameTh}</div>
                        <div style="font-size: 10px; color: #059669; font-weight: 600;">[${getCurriculumLanguageInfo(c).label}] ${c.programTh ? `• ${c.programTh}` : ""}</div>
                        ${c.courseNameEn ? `<div style="font-size: 10px; color: #64748b;">${c.courseNameEn}</div>` : ""}
                      </td>
                      <td style="text-align: center;">${c.credits}</td>
                      <td>${c.semester}/${c.year}</td>
                      <td>${c.role}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
            `
              : ""
          }
        `
            : `
          <p class="text-block">${data.experiencesTh || "ข้อมูลภาระงานสอนอยู่ระหว่างการประมวลผลจากตารางสอนหลักสูตร"}</p>
        `
        }
      </div>

      <!-- Tab 3: Research, Publications & Books -->
      <div class="section">
        <h3 class="section-title">
          <span class="bullet"></span> ผลงานวิจัย สิ่งตีพิมพ์ บทความวิชาการ และหนังสือ (${publications.length} เรื่อง)
        </h3>
        ${
          publications.length > 0
            ? `
          <div class="pub-list">
            ${publications
              .map(
                (p, idx) => `
              <div class="pub-item">
                <div class="pub-title">${idx + 1}. ${p.titleTh}</div>
                ${p.titleEn ? `<div style="font-size: 11px; color: #475569; margin-top: 1px;">${p.titleEn}</div>` : ""}
                <div class="pub-meta">
                  <span>ผู้เขียน: ${p.authors}</span>
                  <span> • วารสาร: ${p.journalName}</span>
                  ${p.volume ? ` ปีที่ ${p.volume}` : ""}
                  ${p.issue ? ` ฉบับที่ ${p.issue}` : ""}
                  ${p.publicationYear ? ` (พ.ศ. ${p.publicationYear})` : ""}
                  ${p.pages ? ` หน้า ${p.pages}` : ""}
                  ${p.tier ? `<span class="pub-tier">${p.tier}</span>` : ""}
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        `
            : `
          <p class="text-block text-muted">ผลงานวิจัยอยู่ระหว่างการปรับปรุงฐานข้อมูล</p>
        `
        }
      </div>

      <!-- Tab 4: Honors, Expertise & Biography -->
      <div class="section">
        <h3 class="section-title"><span class="bullet"></span> ความเชี่ยวชาญพิเศษและประวัติย่อ (Expertise & Biography)</h3>
        <p class="text-block">${data.bioTh || "มีความเชี่ยวชาญด้านพระไตรปิฎกศึกษา พระพุทธศาสนาเถรวาท พระปรัชญา และการพัฒนาจิตตามหลักพุทธธรรม"}</p>
      </div>
      `
    }

    <!-- Official Footer Note -->
    <footer class="doc-footer">
      <div>
        เอกสารประวัติและผลงานทางวิชาการ ออกโดยระบบสารสนเทศคณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย (https://fb.mcu.ac.th)
      </div>
      <div style="font-weight: 600;">
        หน้า 1${isOnePage ? "" : " / ฉบับสมบูรณ์"}
      </div>
    </footer>

  </div>

  <script>
    function downloadHtml() {
      const clone = document.documentElement.cloneNode(true);
      const action = clone.querySelector('.action-bar');
      if (action) action.remove();
      const content = '<!DOCTYPE html>\\n' + clone.outerHTML;
      const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '${docTitle}.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  </script>
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
