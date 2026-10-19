import type { CertificateRequestMetadata } from "./validations";
import { buildCertificateDocumentText } from "./templates";

/**
 * แปลงฟอนต์เป็นชื่อฟอนต์ที่ Microsoft Word รู้จักเป็นอย่างดี
 */
function getWordFontName(fontFamily?: string, isEng?: boolean): string {
  const chosen = fontFamily || (isEng ? "Times New Roman" : "TH SarabunPSK");
  if (chosen.includes("Sarabun")) return "TH SarabunPSK, TH Sarabun New, Sarabun, sans-serif";
  if (chosen.includes("Times")) return "Times New Roman, Times, serif";
  if (chosen.includes("Noto Serif")) return "Noto Serif Thai, TH SarabunPSK, serif";
  if (chosen.includes("Angsana")) return "Angsana New, AngsanaUPC, TH SarabunPSK, sans-serif";
  if (chosen.includes("Cordia")) return "Cordia New, CordiaUPC, TH SarabunPSK, sans-serif";
  return `${chosen}, TH SarabunPSK, Sarabun, sans-serif`;
}

/**
 * สร้าง HTML สำหรับเปิดใน Microsoft Word โดยตรง (.doc)
 * รองรับ Page Setup แบบ A4 ขอบมาตรฐานราชการไทย, ตัวอักษร TH Sarabun, ย่อหน้า 2.5 ซม.
 */
export function generateCertificateWordHtml(
  meta: CertificateRequestMetadata,
  requestId?: string,
  verificationUrl?: string
): string {
  const doc = buildCertificateDocumentText(meta);
  const isEng = doc.template === "ENG_CERT";
  const fontSizePt = meta.fontSizePt || (isEng ? 12.5 : 16);
  const fontName = getWordFontName(meta.fontFamily, isEng);
  const topMargin = meta.marginTopMm || 25;
  const sideMargin = meta.marginSideMm || 25;
  const verifyUrl =
    verificationUrl ||
    meta.portalVerifyUrl ||
    (requestId
      ? `https://fb.mcu.ac.th/portal/certificates/verify?id=${requestId}`
      : "https://fb.mcu.ac.th/");

  let bodyContent = "";

  if (doc.template === "RESIDENCE_MEMO") {
    // บันทึกข้อความ (Memo Template)
    bodyContent = `
      <!-- ตรามหาวิทยาลัย และ หัวเรื่องบันทึกข้อความ -->
      <table style="width:100%; border-collapse:collapse; margin-bottom:12pt;">
        <tr>
          <td style="width:30%; vertical-align:top;">
            <div style="font-size:18pt; font-weight:bold; color:#b91c1c;">(ตรา มจร)</div>
          </td>
          <td style="width:70%; text-align:center; vertical-align:middle;">
            <div style="font-size:${fontSizePt + 10}pt; font-weight:bold; letter-spacing:1px; line-height:1.1;">บันทึกข้อความ</div>
          </td>
        </tr>
      </table>

      <!-- ส่วนหัวตารางราชการ -->
      <table style="width:100%; border-collapse:collapse; margin-bottom:14pt; font-size:${fontSizePt}pt;">
        <tr style="border-bottom:1.5pt solid black;">
          <td style="padding:4pt 0; width:60%;">
            <b>ส่วนงาน</b> คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
          </td>
          <td style="padding:4pt 0; width:40%; text-align:right;">
            <b>โทรศัพท์</b> ๐-๓๕๒๔-๘๐๙๖ ภายใน ๘๐๙๖
          </td>
        </tr>
        <tr style="border-bottom:1.5pt solid black;">
          <td style="padding:4pt 0;">
            <b>ที่</b> อว ${doc.docNo.replace(/^(ที่\s*)?อว\s*/i, "")}
          </td>
          <td style="padding:4pt 0;">
            <b>วันที่</b> ${doc.issueDateTh}
          </td>
        </tr>
        <tr style="border-bottom:1.5pt solid black;">
          <td colspan="2" style="padding:4pt 0;">
            <b>เรื่อง</b> ${doc.subjectTh || "ขอความอนุเคราะห์ออกหนังสือรับรองที่อยู่"}
          </td>
        </tr>
      </table>

      <div style="margin-top:14pt; margin-bottom:14pt; font-size:${fontSizePt}pt;">
        <b>เรียน</b> ${doc.recipientTh || "ผู้อำนวยการกองกิจการนิสิต"}
      </div>

      <p class="indent" style="font-size:${fontSizePt}pt; line-height:1.4; text-align:justify; margin-bottom:12pt;">
        ${doc.paragraph1}
      </p>

      ${
        doc.paragraph2
          ? `<p class="indent" style="font-size:${fontSizePt}pt; line-height:1.4; text-align:justify; margin-bottom:12pt;">
              ${doc.paragraph2}
            </p>`
          : ""
      }

      ${
        doc.paragraph3
          ? `<p class="indent" style="font-size:${fontSizePt}pt; line-height:1.4; text-align:justify; margin-bottom:18pt;">
              ${doc.paragraph3}
            </p>`
          : ""
      }

      <!-- ส่วนลงนาม -->
      <table style="width:100%; border-collapse:collapse; margin-top:24pt; font-size:${fontSizePt}pt;">
        <tr>
          <td style="width:35%;"></td>
          <td style="width:65%; text-align:center;">
            <div style="height:36pt;"></div>
            <div>${doc.signerName}</div>
            <div>${doc.signerTitle}</div>
          </td>
        </tr>
      </table>

      <!-- ส่วนท้าย Footer 2 คอลัมน์ -->
      <table style="width:100%; border-collapse:collapse; margin-top:40pt; border-top:1pt solid #999; padding-top:6pt; font-size:${Math.max(10, fontSizePt - 5)}pt; color:#333;">
        <tr>
          <td style="vertical-align:bottom; width:65%;">
            <div><b>สำนักงานคณบดีคณะพุทธศาสตร์</b></div>
            <div>มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย</div>
            <div>โทรศัพท์ ๐-๓๕๒๔-๘๐๙๖ ภายใน ๘๐๙๖</div>
            <div>https://fb.mcu.ac.th/</div>
          </td>
          <td style="vertical-align:bottom; width:35%; text-align:right;">
            <div><b>ตรวจสอบความถูกต้องของเอกสาร</b></div>
            <div style="font-size:8pt; color:#666;">Ref: ${doc.docNo}</div>
            <div style="font-size:7.5pt; color:#0066cc;">${verifyUrl}</div>
          </td>
        </tr>
      </table>
    `;
  } else if (doc.template === "ENG_CERT") {
    // หนังสือรับรองภาษาอังกฤษ (TO WHOM IT MAY CONCERN)
    bodyContent = `
      <table style="width:100%; border-collapse:collapse; margin-bottom:12pt; font-size:${fontSizePt - 2}pt;">
        <tr>
          <td style="vertical-align:top;">
            <b>Office of Dean</b><br/>
            Faculty of Buddhism<br/>
            Mahachulalongkornrajavidyalaya University<br/>
            Tel. +66 3524 8000 ext. 8323, 8096<br/>
            https://fb.mcu.ac.th/
          </td>
          <td style="text-align:right; vertical-align:top;">
            <b>MCU No.</b> ${doc.docNo}<br/>
            <b>Date:</b> ${doc.issueDateEn}
          </td>
        </tr>
      </table>

      <div style="text-align:center; font-weight:bold; font-size:${fontSizePt + 3}pt; margin-top:24pt; margin-bottom:24pt; letter-spacing:1px;">
        TO WHOM IT MAY CONCERN
      </div>

      <p class="indent" style="font-size:${fontSizePt}pt; line-height:1.5; text-align:justify; margin-bottom:14pt;">
        ${doc.paragraph1}
      </p>

      ${
        doc.paragraph2
          ? `<p class="indent" style="font-size:${fontSizePt}pt; line-height:1.5; text-align:justify; margin-bottom:18pt;">
              ${doc.paragraph2}
            </p>`
          : ""
      }

      <!-- Signer -->
      <table style="width:100%; border-collapse:collapse; margin-top:28pt; font-size:${fontSizePt}pt;">
        <tr>
          <td style="width:35%;">
            <div style="border:1pt solid black; width:28mm; height:34mm; text-align:center; vertical-align:middle; line-height:34mm; font-size:9pt; color:#999;">Photo</div>
            <div style="margin-top:6pt; font-size:10pt;">Signature: ........................................</div>
            <div style="font-weight:bold; font-size:10pt; margin-top:2pt;">(${meta.fullName || "...................................."})</div>
          </td>
          <td style="width:65%; text-align:center; vertical-align:top;">
            <div style="height:32pt;"></div>
            <div>${doc.signerName}</div>
            <div>${doc.signerTitle}</div>
            <div>${doc.signerOrg || "Mahachulalongkornrajavidyalaya University"}</div>
          </td>
        </tr>
      </table>

      <!-- Footer -->
      <table style="width:100%; border-collapse:collapse; margin-top:36pt; border-top:1pt solid #999; padding-top:6pt; font-size:${Math.max(9, fontSizePt - 5)}pt; color:#333;">
        <tr>
          <td style="vertical-align:bottom; width:65%;">
            <div><b>Office of Dean, Faculty of Buddhism</b></div>
            <div>Mahachulalongkornrajavidyalaya University</div>
            <div>Tel. +66 3524 8000 ext. 8323, 8096 | https://fb.mcu.ac.th/</div>
          </td>
          <td style="vertical-align:bottom; width:35%; text-align:right;">
            <div><b>Official Verification • MCU</b></div>
            <div style="font-size:7.5pt; color:#0066cc;">${verifyUrl}</div>
          </td>
        </tr>
      </table>
    `;
  } else if (doc.template === "BANK_LETTER") {
    // หนังสือขอความอนุเคราะห์ธนาคาร (Bank Letter)
    bodyContent = `
      <table style="width:100%; border-collapse:collapse; margin-bottom:14pt; font-size:${fontSizePt}pt;">
        <tr>
          <td style="width:60%;">ที่ อว ${doc.docNo.replace(/^(ที่\s*)?อว\s*/i, "")}</td>
          <td style="width:40%; text-align:right;">คณะพุทธศาสตร์ มจร</td>
        </tr>
        <tr>
          <td colspan="2" style="text-align:center; padding-top:12pt; padding-bottom:12pt;">
            ${doc.issueDateTh}
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding-top:4pt;"><b>เรื่อง</b> ${doc.subjectTh}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding-top:4pt;"><b>เจริญพร</b> ${doc.recipientTh}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding-top:4pt;"><b>สิ่งที่ส่งมาด้วย</b> ${doc.attachmentTh || "หนังสือรับรองนิสิต จำนวน ๑ ฉบับ"}</td>
        </tr>
      </table>

      <p class="indent" style="font-size:${fontSizePt}pt; line-height:1.45; text-align:justify; margin-bottom:12pt;">
        ${doc.paragraph1}
      </p>

      ${
        doc.paragraph2
          ? `<p class="indent" style="font-size:${fontSizePt}pt; line-height:1.45; text-align:justify; margin-bottom:16pt;">
              ${doc.paragraph2}
            </p>`
          : ""
      }

      <table style="width:100%; border-collapse:collapse; margin-top:20pt; font-size:${fontSizePt}pt;">
        <tr>
          <td style="width:40%;"></td>
          <td style="width:60%; text-align:center;">
            <div>ขอเจริญพร</div>
            <div style="height:36pt;"></div>
            <div>${doc.signerName}</div>
            <div>${doc.signerTitle}</div>
            <div>${doc.signerOrg || "มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย"}</div>
          </td>
        </tr>
      </table>

      <table style="width:100%; border-collapse:collapse; margin-top:36pt; border-top:1pt solid #999; padding-top:6pt; font-size:${Math.max(10, fontSizePt - 5)}pt; color:#333;">
        <tr>
          <td style="vertical-align:bottom; width:65%;">
            <div><b>ติดต่อผู้ประสานงาน:</b></div>
            <div>${doc.coordinatorName || "สำนักงานคณบดีคณะพุทธศาสตร์"}</div>
            <div>โทร. ${doc.coordinatorPhone || "035-248-096"} | https://fb.mcu.ac.th/</div>
          </td>
          <td style="vertical-align:bottom; width:35%; text-align:right;">
            <div><b>ตรวจสอบความถูกต้องของเอกสาร</b></div>
            <div style="font-size:7.5pt; color:#0066cc;">${verifyUrl}</div>
          </td>
        </tr>
      </table>
    `;
  } else {
    // Default: THAI_CERT (หนังสือรับรองนิสิต ภาษาไทย - สำหรับ ตม. / ทั่วไป)
    bodyContent = `
      <table style="width:100%; border-collapse:collapse; margin-bottom:16pt; font-size:${fontSizePt}pt;">
        <tr>
          <td style="width:50%; vertical-align:top;">ที่ อว ${doc.docNo.replace(/^(ที่\s*)?อว\s*/i, "")}</td>
          <td style="width:50%; text-align:right; vertical-align:top;">
            มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย<br/>
            ตำบลลำไทร อำเภอวังน้อย<br/>
            จังหวัดพระนครศรีอยุธยา ๑๓๑๗๐
          </td>
        </tr>
      </table>

      <div style="text-align:center; font-weight:bold; font-size:${fontSizePt + 4}pt; margin-top:16pt; margin-bottom:20pt;">
        หนังสือรับรอง
      </div>

      <p class="indent" style="font-size:${fontSizePt}pt; line-height:1.45; text-align:justify; margin-bottom:14pt;">
        ${doc.paragraph1}
      </p>

      <div style="margin-left:2.5cm; margin-top:14pt; margin-bottom:16pt; font-size:${fontSizePt}pt;">
        ให้ไว้ ณ วันที่ ${doc.issueDateTh}
      </div>

      <table style="width:100%; border-collapse:collapse; margin-top:24pt; font-size:${fontSizePt}pt;">
        <tr>
          <td style="width:35%; vertical-align:bottom;">
            <div style="border:1pt solid black; width:28mm; height:34mm; text-align:center; vertical-align:middle; line-height:34mm; font-size:9pt; color:#999; margin-bottom:6pt;">รูปถ่าย 1.5 นิ้ว</div>
            <div>ลงชื่อ ..................................................</div>
            <div style="font-weight:bold; margin-top:2pt;">(${meta.fullName || "............................................"})</div>
          </td>
          <td style="width:65%; text-align:center; vertical-align:top;">
            <div style="height:36pt;"></div>
            <div>${doc.signerName}</div>
            <div>${doc.signerTitle}</div>
          </td>
        </tr>
      </table>

      <table style="width:100%; border-collapse:collapse; margin-top:36pt; border-top:1pt solid #999; padding-top:6pt; font-size:${Math.max(10, fontSizePt - 5)}pt; color:#333;">
        <tr>
          <td style="vertical-align:bottom; width:65%;">
            <div><b>สำนักงานคณบดีคณะพุทธศาสตร์</b></div>
            <div>มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย</div>
            <div>โทรศัพท์ ๐-๓๕๒๔-๘๐๙๖ ภายใน ๘๐๙๖ | https://fb.mcu.ac.th/</div>
          </td>
          <td style="vertical-align:bottom; width:35%; text-align:right;">
            <div><b>ตรวจสอบความถูกต้องของเอกสาร</b></div>
            <div style="font-size:7.5pt; color:#0066cc;">${verifyUrl}</div>
          </td>
        </tr>
      </table>
    `;
  }

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>หนังสือรับรอง_${doc.docNo}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page Section1 {
          size: 210mm 297mm;
          margin: ${topMargin}mm ${sideMargin}mm 20mm ${sideMargin}mm;
          mso-header-margin: 35.4pt;
          mso-footer-margin: 35.4pt;
          mso-paper-source: 0;
        }
        div.Section1 {
          page: Section1;
        }
        body, p, div, td, span {
          font-family: ${fontName};
          color: #000000;
        }
        p.MsoNormal {
          margin: 0cm;
          margin-bottom: .0001pt;
          font-size: ${fontSizePt}pt;
          font-family: ${fontName};
          text-align: justify;
          text-justify: inter-cluster;
        }
        p.indent {
          margin: 0cm;
          margin-bottom: .0001pt;
          text-indent: 2.5cm;
          text-align: justify;
          text-justify: inter-cluster;
          line-height: 1.35;
        }
        table {
          border-collapse: collapse;
        }
      </style>
    </head>
    <body>
      <div class="Section1">
        ${bodyContent}
      </div>
    </body>
    </html>
  `.trim();
}

/**
 * ฟังก์ชันดาวน์โหลดไฟล์ Microsoft Word (.doc) บนเบราว์เซอร์
 */
export function downloadCertificateAsWordDoc(
  meta: CertificateRequestMetadata,
  docNo?: string,
  studentName?: string,
  requestId?: string
) {
  const html = generateCertificateWordHtml(meta, requestId);
  const blob = new Blob(["\ufeff" + html], {
    type: "application/msword;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const cleanDoc = (docNo || meta.docNo || "doc").replace(/[^a-zA-Z0-9ก-๙]/g, "_");
  const cleanName = (studentName || meta.fullName || "student").replace(/[^a-zA-Z0-9ก-๙]/g, "_");
  a.href = url;
  a.download = `หนังสือรับรอง_${cleanDoc}_${cleanName}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
