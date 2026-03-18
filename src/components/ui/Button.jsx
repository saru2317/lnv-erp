import React from 'react'
import styles from './Button.module.css'

export default function Button({ children, variant='primary', size='md', loading=false, disabled=false, icon, onClick, type='button', className='' }) {
  const varMap = { primary:'bp', secondary:'bs', success:'bgr', danger:'br', ghost:'bg' }
  const szMap  = { xs:'xs', sm:'sm', md:'', lg:'lg' }
  return (
    <button
      type={type}
      className={`${styles.btn} ${styles[varMap[variant]||'bp']} ${szMap[size]?styles[szMap[size]]:''} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? <span className={styles.sp} /> : icon && <span>{icon}</span>}
      {children}
    </button>
  )
}
