/**
 * Teacher Account Handover Print Engine
 * Handles isolated, high-fidelity printing for:
 * 1. Individual slips (4 cards per A4 page with dashed cutting guides)
 * 2. Summary overview table with signature blocks
 */

export interface TeacherCredentialItem {
  teacherName: string;
  email: string;
  initialPassword?: string;
  courses: string[];
  isNew?: boolean;
}

export type HandoverViewMode = "slips4" | "slips6" | "slips8" | "table" | "slips";

export interface PrintHandoverOptions {
  viewMode: HandoverViewMode;
  credentials: TeacherCredentialItem[];
  issuerText: string;
  semesterText?: string;
  loginUrl?: string;
  singleEmail?: string | null;
}

export function generateHandoverPrintHtml(options: PrintHandoverOptions): string {
  const {
    viewMode,
    credentials,
    issuerText = "ฝ่ายวิชาการ คณะพุทธศาสตร์ มจร.",
    semesterText = "ภาคการศึกษาที่ 2/2569 (Semester 2/2026)",
    loginUrl = "http://localhost:3010/login",
    singleEmail,
  } = options;

  const targetCredentials = singleEmail
    ? credentials.filter((c) => c.email === singleEmail)
    : credentials;

  // CSS Styles for A4 Print
  const styles = `
    @page {
      size: A4 portrait;
      margin: 8mm 8mm 8mm 8mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      font-family: 'Sarabun', 'Prompt', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #0f172a;
      background: #ffffff;
      font-size: 11px;
      line-height: 1.35;
    }

    /* ══════ SLIPS VIEW (4 CARDS PER A4 PAGE) ══════ */
    .a4-page {
      width: 100%;
      height: 278mm;
      max-height: 280mm;
      page-break-after: always;
      break-after: page;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      margin-bottom: 0;
    }
    .a4-page:last-child {
      page-break-after: avoid;
      break-after: avoid;
    }
    .slips-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: repeat(2, 1fr);
      gap: 5mm;
      height: 100%;
      width: 100%;
    }
    .slips-grid-6 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: repeat(3, 1fr);
      gap: 3.5mm;
      height: 100%;
      width: 100%;
    }
    .slip-card {
      border: 1.5px dashed #94a3b8;
      border-radius: 12px;
      padding: 10px 12px;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
      overflow: hidden;
      page-break-inside: avoid;
      break-inside: avoid;
      position: relative;
    }
    .slip-card-6 {
      border: 1.2px dashed #94a3b8;
      border-radius: 9px;
      padding: 6px 10px;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
      overflow: hidden;
      page-break-inside: avoid;
      break-inside: avoid;
      position: relative;
      font-size: 10px;
      line-height: 1.25;
    }
    .slip-card-6 .slip-cut-guide {
      font-size: 8px;
      padding-bottom: 2px;
    }
    .slip-card-6 .slip-header {
      padding: 3px 0;
      gap: 6px;
    }
    .slip-card-6 .slip-logo {
      width: 24px;
      height: 24px;
      font-size: 9px;
      border-radius: 6px;
    }
    .slip-card-6 .slip-title-org {
      font-size: 8.5px;
    }
    .slip-card-6 .slip-title-main {
      font-size: 10px;
    }
    .slip-card-6 .slip-title-sem {
      font-size: 8px;
    }
    .slip-card-6 .slip-teacher-row {
      margin-top: 2px;
      padding-top: 2px;
    }
    .slip-card-6 .slip-teacher-label {
      font-size: 8px;
    }
    .slip-card-6 .slip-teacher-name {
      font-size: 11px;
    }
    .slip-card-6 .slip-creds-box {
      padding: 4px 6px;
      gap: 4px;
      margin-top: 3px;
      border-radius: 6px;
    }
    .slip-card-6 .cred-label {
      font-size: 7.5px;
    }
    .slip-card-6 .cred-val-user {
      font-size: 9.5px;
    }
    .slip-card-6 .cred-val-pass {
      font-size: 10px;
    }
    .slip-card-6 .slip-login-url {
      font-size: 8.5px;
      margin-top: 3px;
    }
    .slip-card-6 .slip-courses-area {
      margin-top: 2px;
    }
    .slip-card-6 .slip-courses-label {
      font-size: 8px;
    }
    .slip-card-6 .slip-courses-list {
      max-height: 24px;
      gap: 2px;
      margin-top: 1px;
    }
    .slip-card-6 .slip-course-badge {
      font-size: 7.5px;
      padding: 0 4px;
    }
    .slip-card-6 .slip-notice {
      font-size: 7px;
      padding-top: 2px;
      margin-top: 2px;
      line-height: 1.15;
    }
    .slip-card-6 .slip-signature-area {
      margin-top: 3px;
      padding-top: 3px;
      font-size: 8px;
    }
    .slip-card-6 .sig-issuer {
      font-size: 7.5px;
    }

    /* ══════ SLIPS VIEW (8 CARDS PER A4 PAGE: 2 COLS x 4 ROWS) ══════ */
    .slips-grid-8 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: repeat(4, 1fr);
      gap: 2.5mm;
      height: 100%;
      width: 100%;
    }
    .slip-card-8 {
      border: 1px dashed #94a3b8;
      border-radius: 7px;
      padding: 4px 8px;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
      overflow: hidden;
      page-break-inside: avoid;
      break-inside: avoid;
      position: relative;
      font-size: 8.5px;
      line-height: 1.18;
    }
    .slip-card-8 .slip-cut-guide {
      font-size: 7px;
      padding-bottom: 1.5px;
    }
    .slip-card-8 .slip-header {
      padding: 1.5px 0;
      gap: 4px;
    }
    .slip-card-8 .slip-logo {
      width: 20px;
      height: 20px;
      font-size: 8px;
      border-radius: 4px;
    }
    .slip-card-8 .slip-title-org {
      font-size: 7.5px;
    }
    .slip-card-8 .slip-title-main {
      font-size: 9px;
      font-weight: 800;
      color: #1e3a8a;
      line-height: 1.1;
    }
    .slip-card-8 .slip-title-sem {
      font-size: 7px;
    }
    .slip-card-8 .slip-teacher-row {
      margin-top: 1px;
      padding-top: 1px;
      border-top: 1px solid #f1f5f9;
    }
    .slip-card-8 .slip-teacher-label {
      font-size: 7px;
      color: #64748b;
    }
    .slip-card-8 .slip-teacher-name {
      font-size: 10px;
      font-weight: 800;
      color: #0f172a;
    }
    .slip-card-8 .slip-creds-box {
      padding: 3px 5px;
      gap: 4px;
      margin-top: 2px;
      border-radius: 5px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
    .slip-card-8 .cred-label {
      font-size: 6.5px;
      text-transform: uppercase;
      font-weight: bold;
      color: #64748b;
      display: block;
    }
    .slip-card-8 .cred-val-user {
      font-family: monospace;
      font-size: 8.5px;
      font-weight: 600;
      color: #3730a3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .slip-card-8 .cred-val-pass {
      font-family: monospace;
      font-size: 9.5px;
      font-weight: 800;
      color: #b45309;
    }
    .slip-card-8 .slip-login-url {
      font-size: 7px;
      margin-top: 1.5px;
      color: #475569;
    }
    .slip-card-8 .slip-login-url span.url {
      font-family: monospace;
      font-weight: bold;
      color: #2563eb;
    }
    .slip-card-8 .slip-courses-area {
      margin-top: 1.5px;
    }
    .slip-card-8 .slip-courses-label {
      font-size: 7px;
      font-weight: bold;
      color: #64748b;
    }
    .slip-card-8 .slip-courses-list {
      max-height: 18px;
      gap: 2px;
      margin-top: 1px;
      display: flex;
      flex-wrap: wrap;
      overflow: hidden;
    }
    .slip-card-8 .slip-course-badge {
      font-size: 6.5px;
      padding: 0 3px;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 3px;
      color: #334155;
      font-weight: 500;
    }
    .slip-card-8 .slip-notice {
      font-size: 6.5px;
      padding-top: 1px;
      margin-top: 1px;
      line-height: 1.1;
      color: #64748b;
      border-top: 1px solid #f1f5f9;
    }
    .slip-card-8 .slip-signature-area {
      margin-top: 2px;
      padding-top: 2px;
      font-size: 7px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      color: #334155;
    }
    .slip-card-8 .sig-issuer {
      font-size: 6.5px;
      font-weight: 600;
      color: #475569;
    }
    .slip-cut-guide {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 4px;
      border-bottom: 1px dashed #cbd5e1;
      font-size: 9px;
      color: #64748b;
      font-family: monospace;
    }
    .slip-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 0;
    }
    .slip-logo {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: #fef3c7;
      color: #b45309;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 11px;
      border: 1px solid #fde68a;
      flex-shrink: 0;
    }
    .slip-title-org {
      font-size: 10px;
      font-weight: bold;
      color: #334155;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .slip-title-main {
      font-size: 11px;
      font-weight: 800;
      color: #1e3a8a;
      line-height: 1.2;
    }
    .slip-title-sem {
      font-size: 9px;
      color: #64748b;
    }
    .slip-teacher-row {
      margin-top: 4px;
      padding-top: 4px;
      border-top: 1px solid #f1f5f9;
    }
    .slip-teacher-label {
      font-size: 9px;
      color: #64748b;
    }
    .slip-teacher-name {
      font-size: 12.5px;
      font-weight: 800;
      color: #0f172a;
    }
    .slip-creds-box {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 6px 8px;
      margin-top: 5px;
    }
    .cred-col {
      min-width: 0;
    }
    .cred-label {
      font-size: 8.5px;
      text-transform: uppercase;
      font-weight: bold;
      color: #64748b;
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .cred-val-user {
      font-family: monospace;
      font-size: 10.5px;
      font-weight: 600;
      color: #3730a3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .cred-val-pass {
      font-family: monospace;
      font-size: 11px;
      font-weight: 800;
      color: #b45309;
    }
    .slip-login-url {
      font-size: 9.5px;
      color: #475569;
      margin-top: 5px;
    }
    .slip-login-url span.url {
      font-family: monospace;
      font-weight: bold;
      color: #2563eb;
    }
    .slip-courses-area {
      margin-top: 4px;
    }
    .slip-courses-label {
      font-size: 9px;
      font-weight: bold;
      color: #64748b;
    }
    .slip-courses-list {
      display: flex;
      flex-wrap: wrap;
      gap: 3px;
      margin-top: 2px;
      max-height: 38px;
      overflow: hidden;
    }
    .slip-course-badge {
      font-size: 8.5px;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 1px 5px;
      color: #334155;
      font-weight: 500;
    }
    .slip-notice {
      font-size: 8px;
      color: #64748b;
      border-top: 1px solid #f1f5f9;
      padding-top: 4px;
      margin-top: 4px;
      line-height: 1.25;
    }
    .slip-signature-area {
      margin-top: 6px;
      padding-top: 5px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 9px;
      color: #334155;
    }
    .sig-issuer {
      font-size: 8.5px;
      font-weight: 600;
      color: #475569;
      margin-top: 2px;
    }

    /* ══════ SUMMARY TABLE VIEW ══════ */
    .table-container {
      width: 100%;
      padding: 0;
    }
    .table-header {
      text-align: center;
      padding-bottom: 12px;
      margin-bottom: 12px;
      border-bottom: 2px solid #0f172a;
    }
    .table-header .uni-title {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
    }
    .table-header .doc-title {
      font-size: 13px;
      font-weight: bold;
      color: #1e3a8a;
      margin-top: 2px;
    }
    .table-header .doc-meta {
      font-size: 10px;
      color: #475569;
      margin-top: 3px;
    }
    .handover-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    .handover-table th {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
      font-weight: bold;
      text-align: left;
      font-size: 10px;
    }
    .handover-table td {
      border: 1px solid #e2e8f0;
      padding: 5px 8px;
      vertical-align: middle;
    }
    .handover-table tr:nth-child(even) td {
      background: #f8fafc;
    }
    .pass-badge {
      font-family: monospace;
      font-weight: bold;
      color: #b45309;
      background: #fef3c7;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #fde68a;
      display: inline-block;
    }
    .user-text {
      font-family: monospace;
      color: #3730a3;
      font-weight: 600;
    }
    .table-signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      padding-top: 28px;
      margin-top: 24px;
      text-align: center;
      font-size: 10.5px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .sig-line {
      margin-bottom: 4px;
    }
    .sig-date {
      color: #64748b;
      margin-top: 4px;
    }
  `;

  let contentHtml = "";

  if (viewMode === "slips8") {
    // Slips mode (8 cards per A4 page: 2 columns x 4 rows)
    const chunkSize = 8;
    const pages: TeacherCredentialItem[][] = [];
    for (let i = 0; i < targetCredentials.length; i += chunkSize) {
      pages.push(targetCredentials.slice(i, i + chunkSize));
    }

    contentHtml = pages
      .map(
        (pageCards) => `
      <div class="a4-page">
        <div class="slips-grid-8">
          ${pageCards
            .map(
              (cred) => `
            <div class="slip-card-8">
              <div>
                <!-- เส้นประตัดตามรอยปรุ -->
                <div class="slip-cut-guide">
                  <span>ใบส่งมอบบัญชีอาจารย์ (8/หน้า)</span>
                  <span>✂️ ตัดตามรอยปรุ</span>
                </div>

                <!-- หัวเอกสาร -->
                <div class="slip-header">
                  <div class="slip-logo">มจร</div>
                  <div style="min-width: 0; flex: 1;">
                    <div class="slip-title-org">มหาจุฬาลงกรณราชวิทยาลัย • คณะพุทธศาสตร์</div>
                    <div class="slip-title-main">ใบส่งมอบบัญชีผู้ใช้ระบบสารสนเทศอาจารย์</div>
                    <div class="slip-title-sem">${semesterText}</div>
                  </div>
                </div>

                <!-- อาจารย์ผู้สอน -->
                <div class="slip-teacher-row">
                  <div class="slip-teacher-label">อาจารย์ผู้สอน:</div>
                  <div class="slip-teacher-name">${cred.teacherName}</div>
                </div>

                <!-- กล่อง Username & Password -->
                <div class="slip-creds-box">
                  <div class="cred-col">
                    <span class="cred-label">อีเมล (Username)</span>
                    <div class="cred-val-user">${cred.email}</div>
                  </div>
                  <div class="cred-col">
                    <span class="cred-label">รหัสผ่านเริ่มต้น</span>
                    <div class="cred-val-pass">${cred.initialPassword || "(ใช้รหัสผ่านเดิม)"}</div>
                  </div>
                </div>

                <!-- ลิงก์เข้าสู่ระบบ -->
                <div class="slip-login-url">
                  เว็บไซต์: <span class="url">${loginUrl}</span>
                </div>

                <!-- รายวิชาที่สอน -->
                <div class="slip-courses-area">
                  <div class="slip-courses-label">รายวิชาที่สอน (${cred.courses?.length || 0}):</div>
                  <div class="slip-courses-list">
                    ${(cred.courses || [])
                      .map((c) => `<span class="slip-course-badge">${c}</span>`)
                      .join("")}
                  </div>
                </div>

                <!-- คำแนะนำ -->
                <div class="slip-notice">
                  * บันทึกเวลาเรียน 16 คาบ ประเมินสิทธิ์สอบ ส่งเกรด • เปลี่ยนรหัสผ่านทันทีเมื่อเข้าใช้งาน
                </div>
              </div>

              <!-- ส่วนลงนามรับมอบ -->
              <div class="slip-signature-area">
                <div>
                  <div>ลงชื่อ ..................................... ผู้รับมอบ</div>
                  <div style="margin-top: 1px; padding-left: 10px; font-weight: 600;">(${cred.teacherName})</div>
                </div>
                <div style="text-align: right;">
                  <div>วันที่ ..... / ..... / 2569</div>
                  <div class="sig-issuer">${issuerText}</div>
                </div>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `
      )
      .join("");
  } else if (viewMode === "slips6") {
    // Slips mode (6 cards per A4 page: 2 columns x 3 rows)
    const chunkSize = 6;
    const pages: TeacherCredentialItem[][] = [];
    for (let i = 0; i < targetCredentials.length; i += chunkSize) {
      pages.push(targetCredentials.slice(i, i + chunkSize));
    }

    contentHtml = pages
      .map(
        (pageCards) => `
      <div class="a4-page">
        <div class="slips-grid-6">
          ${pageCards
            .map(
              (cred) => `
            <div class="slip-card-6">
              <div>
                <!-- เส้นประตัดตามรอยปรุ -->
                <div class="slip-cut-guide">
                  <span>ใบส่งมอบบัญชีอาจารย์ (Handover Slip)</span>
                  <span>✂️ ตัดตามรอยปรุ</span>
                </div>

                <!-- หัวเอกสาร -->
                <div class="slip-header">
                  <div class="slip-logo">มจร</div>
                  <div style="min-width: 0; flex: 1;">
                    <div class="slip-title-org">มหาจุฬาลงกรณราชวิทยาลัย • คณะพุทธศาสตร์</div>
                    <div class="slip-title-main">ใบส่งมอบบัญชีผู้ใช้ระบบสารสนเทศอาจารย์ผู้สอน</div>
                    <div class="slip-title-sem">${semesterText}</div>
                  </div>
                </div>

                <!-- อาจารย์ผู้สอน -->
                <div class="slip-teacher-row">
                  <div class="slip-teacher-label">อาจารย์ผู้สอน:</div>
                  <div class="slip-teacher-name">${cred.teacherName}</div>
                </div>

                <!-- กล่อง Username & Password -->
                <div class="slip-creds-box">
                  <div class="cred-col">
                    <span class="cred-label">อีเมล (Username)</span>
                    <div class="cred-val-user">${cred.email}</div>
                  </div>
                  <div class="cred-col">
                    <span class="cred-label">รหัสผ่านเริ่มต้น</span>
                    <div class="cred-val-pass">${cred.initialPassword || "(ใช้รหัสผ่านเดิม)"}</div>
                  </div>
                </div>

                <!-- ลิงก์เข้าสู่ระบบ -->
                <div class="slip-login-url">
                  เว็บไซต์: <span class="url">${loginUrl}</span>
                </div>

                <!-- รายวิชาที่สอน -->
                <div class="slip-courses-area">
                  <div class="slip-courses-label">รายวิชาที่สอน (${cred.courses?.length || 0} วิชา):</div>
                  <div class="slip-courses-list">
                    ${(cred.courses || [])
                      .map((c) => `<span class="slip-course-badge">${c}</span>`)
                      .join("")}
                  </div>
                </div>

                <!-- คำแนะนำ -->
                <div class="slip-notice">
                  * ใช้บันทึกเวลาเรียน 16 คาบ ประเมินสิทธิ์สอบ และส่งเกรด • เปลี่ยนรหัสผ่านทันทีในการเข้าสู่ระบบครั้งแรก
                </div>
              </div>

              <!-- ส่วนลงนามรับมอบ -->
              <div class="slip-signature-area">
                <div>
                  <div>ลงชื่อ ......................................... ผู้รับมอบ</div>
                  <div style="margin-top: 1px; padding-left: 14px; font-weight: 600;">(${cred.teacherName})</div>
                </div>
                <div style="text-align: right;">
                  <div>วันที่ ..... / ..... / 2569</div>
                  <div class="sig-issuer">${issuerText}</div>
                </div>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `
      )
      .join("");
  } else if (viewMode === "slips" || viewMode === "slips4") {
    // Slips mode (4 cards per A4 page: 2 columns x 2 rows)
    const chunkSize = 4;
    const pages: TeacherCredentialItem[][] = [];
    for (let i = 0; i < targetCredentials.length; i += chunkSize) {
      pages.push(targetCredentials.slice(i, i + chunkSize));
    }

    contentHtml = pages
      .map(
        (pageCards) => `
      <div class="a4-page">
        <div class="slips-grid">
          ${pageCards
            .map(
              (cred) => `
            <div class="slip-card">
              <div>
                <!-- เส้นประตัดตามรอยปรุ -->
                <div class="slip-cut-guide">
                  <span>ใบส่งมอบบัญชีอาจารย์ (Handover Slip)</span>
                  <span>✂️ ตัดตามรอยปรุ</span>
                </div>

                <!-- หัวเอกสาร -->
                <div class="slip-header">
                  <div class="slip-logo">มจร</div>
                  <div style="min-width: 0; flex: 1;">
                    <div class="slip-title-org">มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย • คณะพุทธศาสตร์</div>
                    <div class="slip-title-main">ใบส่งมอบบัญชีผู้ใช้ระบบสารสนเทศอาจารย์ผู้สอน</div>
                    <div class="slip-title-sem">${semesterText}</div>
                  </div>
                </div>

                <!-- อาจารย์ผู้สอน -->
                <div class="slip-teacher-row">
                  <div class="slip-teacher-label">อาจารย์ผู้สอน:</div>
                  <div class="slip-teacher-name">${cred.teacherName}</div>
                </div>

                <!-- กล่อง Username & Password -->
                <div class="slip-creds-box">
                  <div class="cred-col">
                    <span class="cred-label">อีเมลเข้าสู่ระบบ (Username)</span>
                    <div class="cred-val-user">${cred.email}</div>
                  </div>
                  <div class="cred-col">
                    <span class="cred-label">รหัสผ่านเริ่มต้น (Initial Password)</span>
                    <div class="cred-val-pass">${cred.initialPassword || "(ใช้รหัสผ่านเดิม)"}</div>
                  </div>
                </div>

                <!-- ลิงก์เข้าสู่ระบบ -->
                <div class="slip-login-url">
                  เว็บไซต์เข้าสู่ระบบ: <span class="url">${loginUrl}</span>
                </div>

                <!-- รายวิชาที่สอน -->
                <div class="slip-courses-area">
                  <div class="slip-courses-label">รายวิชาที่สอน (${cred.courses?.length || 0} วิชา):</div>
                  <div class="slip-courses-list">
                    ${(cred.courses || [])
                      .map((c) => `<span class="slip-course-badge">${c}</span>`)
                      .join("")}
                  </div>
                </div>

                <!-- คำแนะนำ -->
                <div class="slip-notice">
                  * ใช้บันทึกเวลาเรียน 16 คาบ ประเมินสิทธิ์สอบ และส่งเกรด • กรุณาเปลี่ยนรหัสผ่านทันทีในการเข้าสู่ระบบครั้งแรก
                </div>
              </div>

              <!-- ส่วนลงนามรับมอบ -->
              <div class="slip-signature-area">
                <div>
                  <div>ลงชื่อ .................................................... ผู้รับมอบ</div>
                  <div style="margin-top: 2px; padding-left: 20px; font-weight: 600;">(${cred.teacherName})</div>
                </div>
                <div style="text-align: right;">
                  <div>วันที่ ..... / ..... / 2569</div>
                  <div class="sig-issuer">${issuerText}</div>
                </div>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `
      )
      .join("");
  } else {
    // Table mode: Summary overview
    contentHtml = `
      <div class="table-container">
        <div class="table-header">
          <div class="uni-title">มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย คณะพุทธศาสตร์</div>
          <div class="doc-title">บัญชีรายชื่ออาจารย์ผู้สอนและรหัสผ่านเริ่มต้น สำหรับเข้าสู่ระบบสารสนเทศ</div>
          <div class="doc-meta">${semesterText} • เอกสารควบคุมภายใน • ${issuerText} (จำนวนทั้งหมด ${targetCredentials.length} ท่าน)</div>
        </div>

        <table class="handover-table">
          <thead>
            <tr>
              <th style="width: 32px; text-align: center;">#</th>
              <th style="width: 170px;">อาจารย์ผู้สอน</th>
              <th style="width: 160px;">อีเมลเข้าสู่ระบบ (Username)</th>
              <th style="width: 120px;">รหัสผ่านเริ่มต้น</th>
              <th>รายวิชาที่รับผิดชอบสอน</th>
              <th style="width: 70px; text-align: center;">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            ${targetCredentials
              .map(
                (c, idx) => `
              <tr>
                <td style="text-align: center; color: #64748b; font-family: monospace;">${idx + 1}</td>
                <td style="font-weight: 600;">${c.teacherName}</td>
                <td class="user-text">${c.email}</td>
                <td>
                  ${
                    c.initialPassword
                      ? `<span class="pass-badge">${c.initialPassword}</span>`
                      : `<span style="color: #94a3b8; font-style: italic;">บัญชีเดิมในระบบ</span>`
                  }
                </td>
                <td style="color: #475569; font-size: 9.5px;">${c.courses?.join(", ") || "-"}</td>
                <td style="text-align: center;">
                  ${
                    c.isNew
                      ? `<span style="color: #059669; font-weight: bold;">สร้างใหม่</span>`
                      : `<span style="color: #64748b;">บัญชีเดิม</span>`
                  }
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div class="table-signatures">
          <div>
            <div class="sig-line">เจ้าหน้าที่ผู้ส่งมอบ: ....................................................</div>
            <div style="font-weight: 600;">(${issuerText})</div>
            <div class="sig-date">วันที่ ..... / ..... / 2569</div>
          </div>
          <div>
            <div class="sig-line">หัวหน้าฝ่าย/ผู้ตรวจรับ: ....................................................</div>
            <div style="font-weight: 600;">(....................................................)</div>
            <div class="sig-date">วันที่ ..... / ..... / 2569</div>
          </div>
        </div>
      </div>
    `;
  }

  const docModeTitle =
    viewMode === "slips8"
      ? "ตัดแจก8ใบต่อหน้า"
      : viewMode === "slips6"
      ? "ตัดแจก6ใบต่อหน้า"
      : viewMode === "slips" || viewMode === "slips4"
      ? "ตัดแจก4ใบต่อหน้า"
      : "ตารางสรุป";

  return `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <title>ใบส่งมอบบัญชีอาจารย์ผู้สอน_${docModeTitle}</title>
      <style>${styles}</style>
    </head>
    <body>
      ${contentHtml}
    </body>
    </html>
  `;
}

/**
 * Triggers an isolated print action using a hidden iframe
 */
export function printHandoverDocument(options: PrintHandoverOptions) {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  iframe.style.zIndex = "-9999";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  const html = generateHandoverPrintHtml(options);
  doc.open();
  doc.write(html);
  doc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      iframe.remove();
    }, 2500);
  }, 300);
}
