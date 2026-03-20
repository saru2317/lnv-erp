import React from 'react'

export default function ListViewToggle({ viewMode, onToggle }) {
  return (
    <div style={{display:'flex',gap:0,border:'1px solid var(--odoo-border)',
      borderRadius:6,overflow:'hidden',background:'#fff'}}>
      <button onClick={() => onToggle('normal')}
        title="Normal Table View"
        style={{padding:'5px 12px',border:'none',cursor:'pointer',
          background: viewMode==='normal' ? 'var(--odoo-purple)' : '#fff',
          color: viewMode==='normal' ? '#fff' : 'var(--odoo-gray)',
          fontSize:12,fontWeight:600,display:'flex',alignItems:'center',gap:5,
          transition:'all .15s'}}>
        <span style={{fontSize:13}}></span>
        <span>List</span>
      </button>
      <button onClick={() => onToggle('detail')}
        title="Detail Card View"
        style={{padding:'5px 12px',border:'none',cursor:'pointer',
          borderLeft:'1px solid var(--odoo-border)',
          background: viewMode==='detail' ? 'var(--odoo-purple)' : '#fff',
          color: viewMode==='detail' ? '#fff' : 'var(--odoo-gray)',
          fontSize:12,fontWeight:600,display:'flex',alignItems:'center',gap:5,
          transition:'all .15s'}}>
        <span style={{fontSize:13}}>⊞</span>
        <span>Detail</span>
      </button>
    </div>
  )
}
