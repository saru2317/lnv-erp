// ═══════════════════════════════════════════════════════════
// LNV ERP — Import/Export Utility
// src/utils/importExport.js
// Used by: ItemMaster, VendorMaster, CustomerMaster,
//          COA, HSNMaster, BankRecon
// ═══════════════════════════════════════════════════════════

// ── Template Definitions ─────────────────────────────────
export const TEMPLATES = {

  item: {
    name:    'Item Master',
    filename:'LNV_ItemMaster_Template.csv',
    columns: [
      { key:'itemCode',    label:'Item Code',      required:false, example:'ITM-001',   hint:'Leave blank to auto-generate' },
      { key:'itemName',    label:'Item Name',       required:true,  example:'SS Pipe 1"',hint:'' },
      { key:'itemGroup',   label:'Item Group',      required:true,  example:'Raw Material',hint:'Must match existing group' },
      { key:'itemType',    label:'Item Type',       required:true,  example:'Material',  hint:'Material | Service | Asset' },
      { key:'uom',         label:'Base UOM',        required:true,  example:'KG',        hint:'KG | NOS | MTR | LTR | SET' },
      { key:'hsnCode',     label:'HSN/SAC Code',    required:false, example:'7304',      hint:'4 or 8 digit HSN code' },
      { key:'gstRate',     label:'GST Rate %',      required:false, example:'18',        hint:'0 | 5 | 12 | 18 | 28' },
      { key:'gstCategory', label:'GST Category',    required:false, example:'taxable',   hint:'taxable | exempt | nil_rated' },
      { key:'itcEligibility',label:'ITC Eligibility',required:false,example:'full',     hint:'full | partial | blocked | na' },
      { key:'stdCost',     label:'Standard Cost',   required:false, example:'250.00',    hint:'Per base UOM' },
      { key:'sellingPrice',label:'Selling Price',   required:false, example:'350.00',    hint:'Per base UOM' },
      { key:'minStock',    label:'Min Stock',        required:false, example:'100',       hint:'Reorder trigger qty' },
      { key:'leadDays',    label:'Lead Days',        required:false, example:'7',         hint:'Purchase lead time' },
      { key:'description', label:'Description',     required:false, example:'SS seamless pipe 1 inch', hint:'' },
    ]
  },

  vendor: {
    name:    'Vendor Master',
    filename:'LNV_VendorMaster_Template.csv',
    columns: [
      { key:'vendorCode',  label:'Vendor Code',     required:false, example:'CA0001',    hint:'Leave blank to auto-generate' },
      { key:'name',        label:'Vendor Name',      required:true,  example:'Raj Steel Traders', hint:'' },
      { key:'gstin',       label:'GSTIN',            required:false, example:'33AABCA1234A1Z5', hint:'15-digit GSTIN' },
      { key:'gstRegType',  label:'GST Reg Type',     required:false, example:'registered', hint:'registered | unregistered | composition | non_gst' },
      { key:'pan',         label:'PAN No',           required:false, example:'AABCA1234A', hint:'10-digit PAN' },
      { key:'phone',       label:'Phone',            required:false, example:'9876543210',hint:'' },
      { key:'email',       label:'Email',            required:false, example:'vendor@email.com',hint:'' },
      { key:'address',     label:'Address',          required:false, example:'123 Main St, Chennai', hint:'' },
      { key:'city',        label:'City',             required:false, example:'Chennai',   hint:'' },
      { key:'state',       label:'State',            required:false, example:'Tamil Nadu',hint:'' },
      { key:'pincode',     label:'Pincode',          required:false, example:'600001',    hint:'' },
      { key:'creditDays',  label:'Credit Days',      required:false, example:'30',        hint:'Payment terms in days' },
      { key:'bankName',    label:'Bank Name',        required:false, example:'HDFC Bank', hint:'' },
      { key:'accountNo',   label:'Account No',       required:false, example:'50100123456', hint:'' },
      { key:'ifsc',        label:'IFSC Code',        required:false, example:'HDFC0001234', hint:'' },
    ]
  },

  customer: {
    name:    'Customer Master',
    filename:'LNV_CustomerMaster_Template.csv',
    columns: [
      { key:'code',        label:'Customer Code',   required:false, example:'DA0001',    hint:'Leave blank to auto-generate' },
      { key:'name',        label:'Customer Name',    required:true,  example:'ARS Cotton Mills',hint:'' },
      { key:'type',        label:'Type',             required:false, example:'B',         hint:'B=Business | I=Individual' },
      { key:'gstin',       label:'GSTIN',            required:false, example:'33AABCA1234A1Z5', hint:'15-digit GSTIN' },
      { key:'gstRegType',  label:'GST Reg Type',     required:false, example:'registered', hint:'registered | unregistered | composition | sez | overseas' },
      { key:'phone',       label:'Phone',            required:false, example:'9876543210', hint:'' },
      { key:'email',       label:'Email',            required:false, example:'customer@email.com', hint:'' },
      { key:'address',     label:'Address',          required:false, example:'456 Park St', hint:'' },
      { key:'city',        label:'City',             required:false, example:'Coimbatore', hint:'' },
      { key:'state',       label:'State',            required:false, example:'Tamil Nadu', hint:'' },
      { key:'pincode',     label:'Pincode',          required:false, example:'641001',    hint:'' },
      { key:'creditLimit', label:'Credit Limit',     required:false, example:'500000',    hint:'In rupees' },
      { key:'creditDays',  label:'Credit Days',      required:false, example:'30',        hint:'Payment terms' },
      { key:'salesRep',    label:'Sales Rep',        required:false, example:'Admin',     hint:'' },
    ]
  },

  coa: {
    name:    'Chart of Accounts',
    filename:'LNV_COA_Template.csv',
    columns: [
      { key:'code',        label:'Account Code',    required:true,  example:'5100',      hint:'Unique 4-digit code' },
      { key:'name',        label:'Account Name',    required:true,  example:'Rent Expense', hint:'' },
      { key:'type',        label:'Account Type',    required:true,  example:'expense',   hint:'asset | liability | equity | income | expense' },
      { key:'group',       label:'Account Group',   required:false, example:'Operating Expenses', hint:'' },
      { key:'currency',    label:'Currency',        required:false, example:'INR',       hint:'INR | USD | EUR' },
      { key:'openingBal',  label:'Opening Balance', required:false, example:'0',         hint:'Dr positive / Cr negative' },
      { key:'description', label:'Description',     required:false, example:'Monthly factory rent', hint:'' },
    ]
  },

  hsn: {
    name:    'HSN/SAC Master',
    filename:'LNV_HSN_Template.csv',
    columns: [
      { key:'hsnCode',     label:'HSN/SAC Code',    required:true,  example:'7304',      hint:'4 or 8 digit code' },
      { key:'description', label:'Description',     required:true,  example:'Tubes, pipes and hollow profiles, seamless', hint:'' },
      { key:'gstRate',     label:'GST Rate %',      required:true,  example:'18',        hint:'0 | 5 | 12 | 18 | 28' },
      { key:'cessRate',    label:'Cess Rate %',      required:false, example:'0',         hint:'Additional cess if applicable' },
      { key:'type',        label:'Type',            required:false, example:'goods',     hint:'goods | services' },
    ]
  },

  bank_statement: {
    name:    'Bank Statement (BRS)',
    filename:'LNV_BankStatement_Template.csv',
    columns: [
      { key:'date',        label:'Date',            required:true,  example:'01-Apr-2026', hint:'DD-Mon-YYYY or DD/MM/YYYY' },
      { key:'description', label:'Description',     required:true,  example:'NEFT to Vendor ABC', hint:'Transaction narration' },
      { key:'chequeNo',    label:'Cheque No / Ref', required:false, example:'CHQ001234', hint:'Reference number if any' },
      { key:'debit',       label:'Debit (Withdrawal)',required:false,example:'85000',    hint:'Amount debited from bank' },
      { key:'credit',      label:'Credit (Deposit)', required:false,example:'250000',   hint:'Amount credited to bank' },
      { key:'balance',     label:'Closing Balance',  required:false,example:'450000',   hint:'Running balance' },
    ],
    notes: [
      'Either Debit or Credit must have a value for each row',
      'Accepted date formats: 01-Apr-2026 / 01/04/2026 / 2026-04-01',
      'Supported bank formats: HDFC / SBI / ICICI / Axis / Kotak',
      'Do NOT include header-description rows or totals row',
      'Remove any merged cells or summary rows before upload',
    ]
  },
}

// ── Download Template as CSV ──────────────────────────────
export function downloadTemplate(templateKey) {
  const tmpl = TEMPLATES[templateKey]
  if (!tmpl) return

  const rows = []

  // Row 1: Instructions header
  rows.push(`# LNV ERP — ${tmpl.name} Import Template`)
  rows.push(`# Required columns are marked with * in the header row`)
  rows.push(`# Do NOT delete or rename column headers`)
  if (tmpl.notes) tmpl.notes.forEach(n => rows.push(`# ${n}`))
  rows.push(`# Generated: ${new Date().toLocaleDateString('en-IN')}`)
  rows.push('')  // blank line

  // Row 2: Column headers
  rows.push(tmpl.columns.map(c => `${c.label}${c.required?'*':''}`).join(','))

  // Row 3: Hints row (greyed comment)
  rows.push(tmpl.columns.map(c => `# ${c.hint||''}`).join(','))

  // Row 4: Example row
  rows.push(tmpl.columns.map(c => c.example).join(','))

  // Rows 5-14: Blank data rows
  for (let i = 0; i < 10; i++) {
    rows.push(tmpl.columns.map(() => '').join(','))
  }

  const blob = new Blob([rows.join('\n')], { type:'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = tmpl.filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── Parse uploaded CSV / Excel ────────────────────────────
export function parseImportFile(text, templateKey) {
  const tmpl   = TEMPLATES[templateKey]
  if (!tmpl) return { rows:[], errors:[] }

  const lines  = text.split('\n').map(l => l.trim()).filter(Boolean)
  // Skip comment/instruction lines starting with #
  const dataLines = lines.filter(l => !l.startsWith('#') && l.trim())
  if (dataLines.length < 2) return { rows:[], errors:['File appears empty or invalid format'] }

  // Detect header row
  const headerLine = dataLines[0]
  const headers    = headerLine.split(',').map(h =>
    h.trim().replace(/"/g,'').replace(/\*$/,'').toLowerCase().replace(/\s+/g,'_')
  )

  // Build column key map (label → key)
  const colMap = {}
  tmpl.columns.forEach(c => {
    const normalLabel = c.label.toLowerCase().replace(/\s+/g,'_')
    colMap[normalLabel] = c.key
    colMap[c.key]       = c.key
  })

  const rows   = []
  const errors = []

  dataLines.slice(1).forEach((line, lineIdx) => {
    if (line.startsWith('#')) return  // skip hint rows
    const vals = splitCSVLine(line)
    if (vals.every(v => !v.trim())) return  // skip empty rows

    const row = {}
    headers.forEach((h, i) => {
      const key  = colMap[h] || h
      row[key]   = vals[i]?.trim().replace(/^"|"$/g,'') || ''
    })

    // Validate required fields
    const rowErrors = []
    tmpl.columns.forEach(c => {
      if (c.required && !row[c.key]) {
        rowErrors.push(`Row ${lineIdx+2}: ${c.label} is required`)
      }
    })

    if (rowErrors.length) errors.push(...rowErrors)
    rows.push({ ...row, _rowNum: lineIdx+2, _hasError: rowErrors.length > 0 })
  })

  return { rows, errors, template: tmpl }
}

// ── CSV line splitter (handles quoted commas) ──────────────
function splitCSVLine(line) {
  const result = []
  let cur   = ''
  let inQ   = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') { inQ = !inQ }
    else if (ch === ',' && !inQ) { result.push(cur); cur = '' }
    else { cur += ch }
  }
  result.push(cur)
  return result
}

// ── Validate a parsed row against template rules ───────────
export function validateRow(row, templateKey) {
  const tmpl  = TEMPLATES[templateKey]
  if (!tmpl) return []
  const errors = []
  tmpl.columns.forEach(c => {
    if (c.required && !row[c.key]) errors.push(`${c.label} is required`)
    // Type checks
    if (row[c.key]) {
      if (['gstRate','creditLimit','creditDays','stdCost','sellingPrice','minStock','leadDays','openingBal','cessRate'].includes(c.key)) {
        if (isNaN(parseFloat(row[c.key]))) errors.push(`${c.label} must be a number`)
      }
      if (c.key==='gstin' && row[c.key] && row[c.key].length !== 15) errors.push('GSTIN must be 15 characters')
      if (c.key==='pan'   && row[c.key] && row[c.key].length !== 10) errors.push('PAN must be 10 characters')
    }
  })
  return errors
}

// ── Generate summary stats for preview ────────────────────
export function importSummary(rows) {
  return {
    total:   rows.length,
    valid:   rows.filter(r => !r._hasError).length,
    errors:  rows.filter(r => r._hasError).length,
    readyToImport: rows.filter(r => !r._hasError).length > 0,
  }
}
