import React from 'react'
import styles from './Badge.module.css'

const BADGE_MAP = {
  approved: styles.g, confirmed: styles.g, active: styles.g,
  received: styles.g, paid: styles.g, delivered: styles.g,
  pending: styles.o, draft: styles.gr, partial: styles.o,
  sent: styles.b, open: styles.b,
  overdue: styles.r, cancelled: styles.r,
  new: styles.p, created: styles.p,
}

export default function Badge({ status, children }) {
  const cls = BADGE_MAP[status?.toLowerCase()] || styles.gr
  return <span className={`${styles.bdg} ${cls}`}>{children || status}</span>
}
