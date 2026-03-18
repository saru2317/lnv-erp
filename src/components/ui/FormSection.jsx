/**
 * FormSection — Reusable form card with header
 * Replaces the repeated mm-fs / sd-fs / fi-fs pattern from the monolith
 */
import React from 'react'
import styles from './FormSection.module.css'

export default function FormSection({ title, children }) {
  return (
    <div className={styles.section}>
      <div className={styles.header}>{title}</div>
      <div className={styles.body}>{children}</div>
    </div>
  )
}

export function FormRow({ cols = 3, children }) {
  return (
    <div className={styles.row} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {children}
    </div>
  )
}

export function FormField({ label, required, children }) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>
        {label} {required && <span className={styles.req}>*</span>}
      </label>
      {children}
    </div>
  )
}

export function FormInput({ ...props }) {
  return <input className={styles.input} {...props} />
}

export function FormSelect({ children, ...props }) {
  return <select className={styles.input} {...props}>{children}</select>
}

export function FormTextarea({ ...props }) {
  return <textarea className={`${styles.input} ${styles.textarea}`} {...props} />
}
