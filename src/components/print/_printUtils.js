export const CO = {
  name:    'LNV Manufacturing Pvt. Ltd.',
  gstin:   '33AABCL1234F1Z5',
  pan:     'AABCL1234F',
  cin:     'U28910TN2018PTC123456',
  addr:    'Plot No. 42, SIDCO Industrial Estate, Ranipet — 632401, Tamil Nadu',
  phone:   '+91 99440 01234',
  email:   'info@lnvmfg.com',
  state:   'Tamil Nadu', stCode:'33',
  bank:    { name:'State Bank of India', acNo:'12345678901', ifsc:'SBIN0001234', branch:'Ranipet Branch' },
}

export const fmt = (n, dec=2) =>
  n != null ? Number(n).toLocaleString('en-IN',{minimumFractionDigits:dec,maximumFractionDigits:dec}) : '—'

export const fmtInt = n => n != null ? Number(n).toLocaleString('en-IN') : '—'

// Table header cell
export const TH = (color='#714B67') => ({
  padding:'6px 8px', border:'1px solid #bbb',
  background:color, color:'#fff',
  fontSize:10, fontWeight:700, textAlign:'center',
})

// Table data cell
export const TD = (align='center', bg='#fff') => ({
  padding:'5px 8px', border:'1px solid #ddd',
  fontSize:10, textAlign:align, background:bg, verticalAlign:'middle',
})

// Label-value row helper
export const LV = (label, value, mono=false) => ({
  label, value: value ?? '—',
  style: mono ? { fontFamily:'DM Mono,monospace', fontWeight:600 } : {}
})

// Amount in words
const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
  'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']
export function toWords(n) {
  if (!n || n===0) return 'Zero'
  n = Math.round(n)
  if (n < 20)      return ones[n]
  if (n < 100)     return tens[Math.floor(n/10)] + (n%10 ? ' '+ones[n%10] : '')
  if (n < 1000)    return ones[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' '+toWords(n%100) : '')
  if (n < 100000)  return toWords(Math.floor(n/1000)) + ' Thousand' + (n%1000 ? ' '+toWords(n%1000) : '')
  if (n < 10000000)return toWords(Math.floor(n/100000)) + ' Lakh' + (n%100000 ? ' '+toWords(n%100000) : '')
  return toWords(Math.floor(n/10000000)) + ' Crore' + (n%10000000 ? ' '+toWords(n%10000000) : '')
}
