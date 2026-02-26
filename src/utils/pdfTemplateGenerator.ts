import type { Event } from '@/src/types'

export interface PdfTableRow {
  s_no: number
  name: string
  kg: number
  gram: number
  alavu: string
}

export interface PdfProfile {
  name: string
  mobile: string
  address: string
  profile_image: string | null
}

const ROWS_PER_PAGE = 40
const PER_COLUMN = 20

function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildHeader(
  profile: PdfProfile,
  selectedDesign: 'default' | 'custom',
  customDesignUrl: string | null
) {
  // If custom design is selected and URL exists, render custom header image
  if (selectedDesign === 'custom' && customDesignUrl) {
    const escapedUrl = escapeHtml(customDesignUrl)
    return `
    <div class="header-wrapper">
      <div class="custom-header">
        <img src="${escapedUrl}" class="custom-header-img" />
      </div>
    </div>
    `
  }

  // Default header: profile image + name + address + mobile
  const name = escapeHtml(profile.name || '')
  const mobile = escapeHtml(profile.mobile || '')
  const address = escapeHtml(profile.address || '')
  const img = profile.profile_image

  return `
  <div class="header-wrapper">
    <div class="header">
      <div class="header-left">
        <div class="logo-wrap">
          ${
            img
              ? `<img src="${img}" class="logo-img" />`
              : `<div class="logo-placeholder">${name.charAt(0)}</div>`
          }
        </div>
        <div class="company-info">
          <div class="company-name">${name}</div>
          <div class="company-address">${address}</div>
        </div>
      </div>

      <div class="header-right">
        <div class="company-mobile">${mobile}</div>
      </div>
    </div>
  </div>
  `
}

function tableRows(rows: PdfTableRow[], start: number) {
  let html = ''

  for (let i = 0; i < PER_COLUMN; i++) {
    const row = rows[start + i]
    const sNo = start + i + 1

    html += `
    <tr>
      <td>${sNo}</td>
      <td>${row?.name ? escapeHtml(row.name) : ''}</td>
      <td>${row?.kg && row.kg !== 0 ? row.kg : ''}</td>
      <td>${row?.gram && row.gram !== 0 ? row.gram : ''}</td>
      <td>${row?.alavu ? escapeHtml(row.alavu) : ''}</td>
    </tr>
    `
  }

  return html
}
export function generatePdfHtmlTemplate(
  event: Pick<Event, 'title' | 'date'>,
  type: 'grocery' | 'vegetable',
  items: PdfTableRow[],
  profile: PdfProfile,
  selectedDesign: 'default' | 'custom' = 'default',
  customDesignUrl: string | null = null,
  footerText: string = ''   // ✅ ADD THIS
) {
  const totalPages = Math.max(1, Math.ceil(items.length / ROWS_PER_PAGE))
// ✅ DEFINE TAMIL TYPE HERE (CORRECT PLACE)
  const tamilType =
    type === 'grocery'
      ? 'மளிகை பட்டியல்'
      : 'காய்கறி பட்டியல்'

  let html = `
  <html>
  <head>
  <meta charset="utf-8" />
  <style>

  @page {
    size: A4;
    margin: 0;
  }

  body {
    margin: 0;
    font-family: Arial, sans-serif;
    background: #ffffff;
  }

  .page {
  width: 210mm;
  height: 297mm;
  page-break-after: always;
  display: flex;
  flex-direction: column;
}

.table-wrap {
  flex: 1;
}

.footer {
  width: 95%;
  margin: 0 auto 20px auto;
  text-align: center;
  font-size: 13px;
  font-weight: 500;
  border-top: 1px solid #B3B3B3;
  padding-top: 8px;
}
  /* HEADER WRAPPER */
  .header-wrapper {
    width: 100%;
    margin-top: 25px; /* move header down */
    display: flex;
    justify-content: center;
  }

  .header {
    width: 95%; /* increased width */
    background: linear-gradient(90deg,#1B319F,#3B7DC4);
    color: white;
    padding: 25px 35px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 18px;
  }

  .logo-wrap {
    width: 75px;
    height: 75px;
    border-radius: 50%;
    overflow: hidden;
    background: yellow;
  }

  .logo-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .logo-placeholder {
    width:100%;
    height:100%;
    display:flex;
    align-items:center;
    justify-content:center;
    font-size:32px;
    font-weight:bold;
  }

  .company-name {
    font-size: 28px;
    font-weight: bold;
  }

  .company-address {
    font-size: 14px;
    margin-top: 6px;
  }

  .company-mobile {
    font-size: 20px;
    font-weight: bold;
  }

  /* CUSTOM HEADER */
  .custom-header {
    width: 95%;
    margin: 25px auto 10px auto;
  }

  .custom-header-img {
    width: 100%;
    height: 160px;
    object-fit: cover;
    border-radius: 8px;
  }

  /* EVENT ROW */
  .event-row {
    width: 95%;
    margin: 15px auto;
    display:flex;
    justify-content: space-between;
    font-weight: 600;
  }

  /* TABLE WRAP */
  .table-wrap {
    width: 95%;
    margin: 0 auto;
    margin-bottom: 25px; /* add bottom space so last row doesn't touch bottom edge */
    flex: 1;
    display: flex;
    gap: 20px; /* horizontal gap between left and right tables */
  }

  .column {
    flex: 1; /* equal width distribution with gap */
  }

  table {
    width: 100%;
    height: 100%;
    border-collapse: collapse;
    font-size: 12px;
    border:1px solid #1B319F;
    table-layout: fixed;
  }

  th {
    background: #EDE7F6;
    border:1px solid #B3B3B3;
    padding:6px;
    text-align:center;
  }

  /* Fixed column widths */
  th:nth-child(1),
  td:nth-child(1) {
    width: 5%;
  }

  th:nth-child(2),
  td:nth-child(2) {
    width: 65%;
  }

  th:nth-child(3),
  td:nth-child(3) {
    width: 10%;
  }

  th:nth-child(4),
  td:nth-child(4) {
    width: 10%;
  }

  th:nth-child(5),
  td:nth-child(5) {
    width: 10%;
  }

  td {
    border:1px solid #B3B3B3;
    padding:6px;
    text-align:center;
  }

  td:nth-child(2) {
    text-align:left;
  }

 tbody tr {
  height: 24px;
}
  </style>
  </head>
  <body>
  `

  for (let p = 0; p < totalPages; p++) {
    const start = p * ROWS_PER_PAGE

html += `
<div class="page">

  ${buildHeader(profile, selectedDesign, customDesignUrl)}

  <div class="event-row">
    <div>
      ${escapeHtml(event.title)}<br/>
      <span style="font-weight:500;font-size:14px;">
        ${tamilType}
      </span>
    </div>

    <div>
      ${event.date ? new Date(event.date).toLocaleDateString('en-IN') : ''}
    </div>
  </div>

  <div class="table-wrap">
    <div class="column">
      <table>
        <thead>
          <tr>
            <th>எ</th>
            <th>பொருள்கள்</th>
            <th>கி</th>
            <th>கிரா</th>
            <th>அ</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows(items, start)}
        </tbody>
      </table>
    </div>

    <div class="column">
      <table>
        <thead>
          <tr>
            <th>எ</th>
            <th>பொருள்கள்</th>
            <th>கி</th>
            <th>கிரா</th>
            <th>அ</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows(items, start + PER_COLUMN)}
        </tbody>
      </table>
    </div>
  </div>

  ${footerText ? `
    <div class="footer">
      ${escapeHtml(footerText)}
    </div>
  ` : ''}

</div>
`  }

  html += `</body></html>`

  return html
}
