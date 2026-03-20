import React, { useState } from 'react'
import { PRINT_TEMPLATES } from './_configData'

const FORMAT_ICONS = { A4:'', A5:'', Label:'' }

export default function PrintTemplates() {
  const [templates, setTemplates] = useState(PRINT_TEMPLATES)

  const toggleDefault = id => {
    setTemplates(ts => ts.map(t => {
      if (t.id === id) return { ...t, default: true }
      if (t.module === ts.find(x=>x.id===id)?.module && t.id !== id) return { ...t, default: false }
      return t
    }))
  }

  const toggleStatus = id => setTemplates(ts => ts.map(t => t.id===id ? {...t, status:t.status==='Active'?'Inactive':'Active'} : t))

  const moduleColor = m => ({ SD:'#117A65', MM:'#1A5276', PP:'#714B67', FI:'#196F3D', QM:'#C0392B', HCM:'#6C3483', WM:'#1F618D' }[m] || '#555')

  const grouped = templates.reduce((acc, t) => { (acc[t.module] = acc[t.module]||[]).push(t); return acc }, {})

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Print Templates <small>Invoice · PO · Labels · Pay slip</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-p btn-s">+ New Template</button>
        </div>
      </div>

      <div style={{ padding:'10px 14px', background:'#EDE0EA', borderRadius:'8px', marginBottom:'16px', fontSize:'12px', color:'var(--odoo-purple)' }}>
         <strong>Print Templates</strong> define the layout for all printed/PDF documents. One template per document type can be set as <strong>Default</strong>.
      </div>

      {Object.entries(grouped).map(([module, tmps]) => (
        <div key={module} className="fi-panel" style={{ marginBottom:'12px' }}>
          <div className="fi-panel-hdr">
            <h3>
              <span style={{ padding:'2px 8px', borderRadius:'6px', fontSize:'11px', fontWeight:'800',
                background:moduleColor(module)+'22', color:moduleColor(module), marginRight:'8px' }}>{module}</span>
              {tmps[0] && ({SD:'Sales',MM:'Purchase',PP:'Production',FI:'Finance',QM:'Quality',HCM:'HR',WM:'Warehouse'}[module])} Templates
            </h3>
          </div>
          <div className="fi-panel-body">
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {tmps.map(t => (
                <div key={t.id} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 12px',
                  background:'#F8F9FA', borderRadius:'8px',
                  border:`1px solid ${t.default?moduleColor(module):t.status==='Active'?'var(--odoo-border)':'#E8E8E8'}`,
                  opacity: t.status==='Inactive' ? 0.6 : 1 }}>
                  <div style={{ width:'36px', height:'36px', borderRadius:'6px', background:moduleColor(module)+'22',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0 }}>
                    {FORMAT_ICONS[t.format] || ''}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                      <strong style={{ fontSize:'12px' }}>{t.name}</strong>
                      {t.default && <span style={{ fontSize:'9px', fontWeight:'800', padding:'1px 5px', background:'#FFD700', color:'#000', borderRadius:'4px' }}>DEFAULT</span>}
                    </div>
                    <div style={{ fontSize:'11px', color:'var(--odoo-gray)', marginTop:'1px' }}>
                      Format: {t.format} &nbsp;·&nbsp; ID: {t.id}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
                    <span style={{ padding:'2px 7px', borderRadius:'6px', fontSize:'10px', fontWeight:'700',
                      background:t.status==='Active'?'#E8F5E9':'#F5F5F5', color:t.status==='Active'?'#2E7D32':'#757575' }}>
                      ● {t.status}
                    </span>
                    {!t.default && t.status==='Active' && (
                      <button className="btn btn-s sd-bsm" style={{ fontSize:'10px', padding:'3px 8px' }} onClick={()=>toggleDefault(t.id)}>
                        Set Default
                      </button>
                    )}
                    <button className="btn-act-edit" onClick={()=>toggleStatus(t.id)}>
                      {t.status==='Active'?'':''}
                    </button>
                    <button className="btn-act-view" style={{ fontSize:'10px' }}>Preview</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
