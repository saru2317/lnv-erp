/**
 * LNV ERP — Formatters
 * All formatting utilities used across modules
 */
import { format, parseISO, isValid } from 'date-fns'

// ─── Currency ─────────────────────────────────────────────────────────────────
export function formatCurrency(amount, compact = false) {
  if (amount == null) return '—'
  const num = Number(amount)
  if (compact) {
    if (num >= 10_000_000) return `₹${(num / 10_000_000).toFixed(2)} Cr`
    if (num >= 100_000)    return `₹${(num / 100_000).toFixed(1)}L`
    if (num >= 1_000)      return `₹${(num / 1_000).toFixed(1)}K`
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num)
}

// ─── Number ───────────────────────────────────────────────────────────────────
export function formatNumber(num, decimals = 0) {
  if (num == null) return '—'
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: decimals,
  }).format(Number(num))
}

// ─── Date ─────────────────────────────────────────────────────────────────────
export function formatDate(date, fmt = 'dd MMM yyyy') {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : date
  return isValid(d) ? format(d, fmt) : '—'
}

export function formatDateTime(date) {
  return formatDate(date, 'dd MMM yyyy, HH:mm')
}

// ─── GST ──────────────────────────────────────────────────────────────────────
export function calcGST(taxable, rate, isInterstate = false) {
  const gst = (taxable * rate) / 100
  if (isInterstate) return { igst: gst, cgst: 0, sgst: 0, total: taxable + gst }
  const half = gst / 2
  return { igst: 0, cgst: half, sgst: half, total: taxable + gst }
}

// ─── Percentage ───────────────────────────────────────────────────────────────
export function formatPercent(value, decimals = 1) {
  if (value == null) return '—'
  return `${Number(value).toFixed(decimals)}%`
}
