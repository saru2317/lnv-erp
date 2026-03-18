/**
 * LNV ERP — Format utilities (currency, dates, numbers)
 */

// Indian currency format: ₹1,23,456.00
export const formatINR = (amount, decimals = 0) => {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)
}

// Compact: ₹12.4L, ₹2.1Cr
export const formatINRCompact = (amount) => {
  if (amount == null) return '—'
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`
  if (amount >= 100000)   return `₹${(amount / 100000).toFixed(1)}L`
  if (amount >= 1000)     return `₹${(amount / 1000).toFixed(1)}K`
  return formatINR(amount)
}

// Date: 25 Feb 2025
export const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

// Date + Time
export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

// Number with commas (Indian system)
export const formatNumber = (n, decimals = 0) => {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n)
}

// GST calculation
export const calcGST = (amount, rate, isInterState = false) => {
  const gstAmount = (amount * rate) / 100
  if (isInterState) return { igst: gstAmount, cgst: 0, sgst: 0, total: amount + gstAmount }
  return { igst: 0, cgst: gstAmount / 2, sgst: gstAmount / 2, total: amount + gstAmount }
}

// Status badge color map
export const STATUS_COLOR = {
  draft:    { bg: '#F8F9FA', color: '#6C757D', border: '#DEE2E6' },
  pending:  { bg: '#FEF5E7', color: '#D68910', border: '#FAD7A0' },
  approved: { bg: '#EAF9F6', color: '#00A09D', border: '#A2DED0' },
  received: { bg: '#EAF9F6', color: '#00A09D', border: '#A2DED0' },
  paid:     { bg: '#EAF9F6', color: '#1E8449', border: '#A2DED0' },
  overdue:  { bg: '#FDEDEC', color: '#E74C3C', border: '#F5B7B1' },
  partial:  { bg: '#FEF5E7', color: '#E06F39', border: '#FAD7A0' },
  cancelled:{ bg: '#FDEDEC', color: '#E74C3C', border: '#F5B7B1' },
  active:   { bg: '#EAF9F6', color: '#00A09D', border: '#A2DED0' },
  inactive: { bg: '#F8F9FA', color: '#6C757D', border: '#DEE2E6' },
  sent:     { bg: '#EBF5FB', color: '#2980B9', border: '#AED6F1' },
  new:      { bg: '#EDE0EA', color: '#714B67', border: '#D5BEEF' },
  open:     { bg: '#EDE0EA', color: '#714B67', border: '#D5BEEF' },
  confirmed:{ bg: '#EAF9F6', color: '#00A09D', border: '#A2DED0' },
  delivered:{ bg: '#D4EDDA', color: '#155724', border: '#A2DED0' },
}
