import React from 'react'
import styles from './KPICard.module.css'

export default function KPICard({ icon, label, value, sub, trend, trendType = 'up', accentColor, onClick }) {
  return (
    <div
      className={styles.kc}
      style={{ '--ac': accentColor || 'var(--odoo-purple)' }}
      onClick={onClick}
    >
      <div className={styles.kIc}>{icon}</div>
      <div className={styles.kLb}>{label}</div>
      <div className={styles.kVl}>{value}</div>
      {trend && (
        <div className={`${styles.kTr} ${styles[trendType]}`}>
          {trendType === 'up' ? '▲' : trendType === 'dn' ? '▼' : '●'} {trend}
        </div>
      )}
      {sub && <div className={styles.kSb}>{sub}</div>}
    </div>
  )
}
