import React from 'react'
import styles from './PageLoader.module.css'

export default function PageLoader({ text = 'Loading…' }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.logoIcon}>LNV</div>
      <div className={styles.spinner} />
      <p className={styles.text}>{text}</p>
    </div>
  )
}
