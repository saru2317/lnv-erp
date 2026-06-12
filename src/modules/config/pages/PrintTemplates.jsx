import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const MOD_COLOR = { SD:'#117A65', MM:'#1A5276', PP:'#714B67', FI:'#196F3D', QM:'#C0392B', PM:'#784212', HCM:'#6C3483', WM:'#1F618D', TM:'#17A589' }
const MOD_LABEL = { SD:'Sales', MM:'Purchase', PP:'Production', FI:'Finance', QM:'Quality', PM:'Maintenance', HCM:'HR', WM:'Warehouse', TM:'Transport' }

// ALL print templates — mapped to actual print components at /print/:type/:id
const ALL_TEMPLATES = [
  // SD
  { id:'PT-SD-01', name:'Sales Invoice',       module:'SD', format:'A4',    printType:'invoice',      icon:'🧾', desc:'Customer invoice with GST breakup',        status:'Active',  default:true  },
  { id:'PT-SD-02', name:'Sales Order',          module:'SD', format:'A4',    printType:'sales-order',  icon:'📋', desc:'Sales order confirmation document',        status:'Active',  default:true  },
  { id:'PT-SD-03', name:'Delivery Challan',     module:'SD', format:'A4',    printType:'dc',           icon:'🚚', desc:'Goods delivery challan (DC)',               status:'Active',  default:true  },
  { id:'PT-SD-04', name:'Sales Quotation',      module:'SD', format:'A4',    printType:'quotation',    icon:'💬', desc:'Customer quotation / proforma invoice',    status:'Active',  default:true  },
  // MM
  { id:'PT-MM-01', name:'Purchase Order',       module:'MM', format:'A4',    printType:'po',           icon:'📦', desc:'Vendor purchase order',                    status:'Active',  default:true  },
  { id:'PT-MM-02', name:'Comparative Statement',module:'MM', format:'A4',    printType:'cs',           icon:'📊', desc:'Supplier quote comparison statement',      status:'Active',  default:true  },
  { id:'PT-MM-03', name:'Purchase Requisition', module:'MM', format:'A4',    printType:'pr',           icon:'📝', desc:'Internal purchase request document',       status:'Active',  default:true  },
  { id:'PT-MM-04', name:'Goods Receipt Note',   module:'MM', format:'A4',    printType:'grn',          icon:'✅', desc:'GRN / Inward receipt document',            status:'Active',  default:true  },
  // WM
  { id:'PT-WM-01', name:'Stock Transfer',       module:'WM', format:'A4',    printType:'stock-transfer',icon:'🔄',desc:'Intra-warehouse transfer slip',           status:'Active',  default:true  },
  { id:'PT-WM-02', name:'Material Issue Slip',  module:'WM', format:'A5',    printType:'material-issue',icon:'📤',desc:'Shop floor material issue slip',          status:'Active',  default:true  },
  // PP
  { id:'PT-PP-01', name:'Job / Work Order',     module:'PP', format:'A4',    printType:'job-order',    icon:'⚙️', desc:'Production work order card',               status:'Active',  default:true  },
  { id:'PT-PP-02', name:'Bill of Materials',    module:'PP', format:'A4',    printType:'bom',          icon:'📋', desc:'BOM / component list print',               status:'Active',  default:true  },
  { id:'PT-PP-03', name:'Labour Card',          module:'PP', format:'A5',    printType:'labour-card',  icon:'👷', desc:'Worker time & labour tracking card',       status:'Active',  default:true  },
  // FI
  { id:'PT-FI-01', name:'Payment Voucher',      module:'FI', format:'A4',    printType:'payment-voucher',icon:'💸',desc:'Outgoing payment voucher',              status:'Active',  default:true  },
  { id:'PT-FI-02', name:'Receipt Voucher',      module:'FI', format:'A4',    printType:'receipt-voucher',icon:'💰',desc:'Incoming receipt voucher',              status:'Active',  default:true  },
  { id:'PT-FI-03', name:'Journal Entry',        module:'FI', format:'A4',    printType:'journal-entry',icon:'📒', desc:'Accounting journal entry print',          status:'Active',  default:true  },
  // QM
  { id:'PT-QM-01', name:'Inspection Report',   module:'QM', format:'A4',    printType:'inspection',   icon:'🔍', desc:'QC inspection report with results',        status:'Active',  default:true  },
  { id:'PT-QM-02', name:'NCR Report',           module:'QM', format:'A4',    printType:'ncr',          icon:'⚠️', desc:'Non-conformance report',                  status:'Active',  default:true  },
  // PM
  { id:'PT-PM-01', name:'Maintenance WO',       module:'PM', format:'A4',    printType:'maintenance-wo',icon:'🔧',desc:'Maintenance work order document',         status:'Active',  default:true  },
  { id:'PT-PM-02', name:'Breakdown Report',     module:'PM', format:'A4',    printType:'breakdown',    icon:'🛠️', desc:'Equipment breakdown report',               status:'Active',  default:true  },
  // HCM
  { id:'PT-HCM-01',name:'Pay Slip',             module:'HCM',format:'A5',    printType:'payslip',      icon:'💵', desc:'Employee monthly pay slip',                status:'Active',  default:true  },
  // TM
  { id:'PT-TM-01', name:'Trip Sheet',           module:'TM', format:'A4',    printType:'trip-sheet',   icon:'🚛', desc:'Vehicle trip sheet / log',                 status:'Active',  default:true  },
  { id:'PT-TM-02', name:'Fuel Log Report',      module:'TM', format:'A4',    printType:'fuel-log',     icon:'⛽', desc:'Vehicle fuel consumption report',          status:'Active',  default:false },
]

export default function PrintTemplates() {
  const navigate  = useNavigate()
  const [templates, setTemplates] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('lnv_print_templates') || 'null')
      if (saved) {
        // Merge saved status/default with ALL_TEMPLATES (in case new templates added)
        return ALL_TEMPLATES.map(t => ({ ...t, ...(saved.find(s => s.id===t.id) || {}) }))
      }
    } catch {}
    return ALL_TEMPLATES
  })
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')

  const save = (updated) => {
    setTemplates(updated)
    localStorage.setItem('lnv_print_templates', JSON.stringify(updated.map(t=>({id:t.id,status:t.status,default:t.default}))))
  }

  const toggleDefault = (id) => {
    const tpl = templates.find(t=>t.id===id)
    if (!tpl) return
    const updated = templates.map(t => {
      if (t.id===id)          return {...t, default:true}
      if (t.module===tpl.module) return {...t, default:false}
      return t
    })
    save(updated)
    toast.success(`${tpl.name} set as default`)
  }

  const toggleStatus = (id) => {
    const tpl = templates.find(t=>t.id===id)
    if (!tpl) return
    if (tpl.default && tpl.status==='Active') { toast.error('Cannot deactivate the default template'); return }
    const updated = templates.map(t => t.id===id ? {...t, status:t.status==='Active'?'Inactive':'Active'} : t)
    save(updated)
  }

  const handlePreview = (t) => {
    // Navigate to print preview with a sample ID
    navigate(`/print/${t.printType}/1`)
  }

  const modules = ['ALL', ...Object.keys(MOD_LABEL)]
  const filtered = templates
    .filter(t => filter==='ALL' || t.module===filter)
    .filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.desc.toLowerCase().includes(search.toLowerCase()))

  const grouped = filtered.reduce((acc,t) => { (acc[t.module]=acc[t.module]||[]).push(t); return acc }, {})
  const modOrder = Object.keys(MOD_LABEL)

  const activeCount = templates.filter(t=>t.status==='Active').length

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          Print Templates
          <small>PDF layout for all printed documents</small>
        </div>
        <div className="fi-lv-actions">
          <div style={{padding:'4px 12px',borderRadius:6,background:'#D4EDDA',color:'#155724',fontSize:12,fontWeight:700}}>
            ✅ {activeCount} Active Templates
          </div>
        </div>
      </div>

      {/* Info */}
      <div style={{background:'#EDE0EA',border:'1px solid #D4B8CE',borderRadius:8,padding:'10px 16px',marginBottom:14,fontSize:11,color:'var(--odoo-purple)',display:'flex',gap:20,flexWrap:'wrap'}}>
        <span>📄 <strong>A4</strong> — Standard documents (Invoices, POs, Reports)</span>
        <span>📋 <strong>A5</strong> — Half-page (Pay Slips, Labour Cards, Issue Slips)</span>
        <span>⭐ <strong>Default</strong> — Auto-selected when printing from the module</span>
        <span>🔍 <strong>Preview</strong> — Opens print with sample data</span>
      </div>

      {/* Filter + Search */}
      <div style={{display:'flex',gap:8,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search templates…"
          style={{padding:'6px 12px',border:'1px solid var(--odoo-border)',borderRadius:6,fontSize:12,outline:'none',width:200}} />
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {modules.map(m=>(
            <div key={m} onClick={()=>setFilter(m)}
              style={{padding:'5px 14px',borderRadius:20,cursor:'pointer',fontSize:11,fontWeight:700,transition:'all .15s',
                background:filter===m?(MOD_COLOR[m]||'var(--odoo-purple)'):'#fff',
                color:filter===m?'#fff':'var(--odoo-gray)',
                border:`1.5px solid ${filter===m?(MOD_COLOR[m]||'var(--odoo-purple)'):'var(--odoo-border)'}`}}>
              {m==='ALL'?'All Modules':MOD_LABEL[m]||m}
            </div>
          ))}
        </div>
      </div>

      {/* Template groups */}
      {modOrder.filter(m => grouped[m]?.length).map(mod => {
        const mColor = MOD_COLOR[mod] || '#714B67'
        return (
          <div key={mod} style={{marginBottom:16}}>
            {/* Module header */}
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,paddingBottom:6,borderBottom:`2px solid ${mColor}`}}>
              <span style={{padding:'2px 10px',borderRadius:6,fontSize:11,fontWeight:800,background:mColor+'22',color:mColor}}>
                {mod}
              </span>
              <span style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'#1C1C1C'}}>
                {MOD_LABEL[mod]} Templates
              </span>
              <span style={{fontSize:11,color:'#6C757D',marginLeft:'auto'}}>
                {grouped[mod].filter(t=>t.status==='Active').length}/{grouped[mod].length} active
              </span>
            </div>

            {/* Template rows */}
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {grouped[mod].map(t=>(
                <div key={t.id} style={{
                  display:'flex',alignItems:'center',gap:12,padding:'12px 16px',
                  background:'#fff',borderRadius:8,
                  border:`1px solid ${t.default?mColor:t.status==='Active'?'var(--odoo-border)':'#E8E8E8'}`,
                  borderLeft:`4px solid ${t.default?mColor:t.status==='Active'?'#CCC':'#E8E8E8'}`,
                  opacity:t.status==='Inactive'?0.6:1,transition:'all .15s'
                }}>
                  {/* Icon */}
                  <div style={{width:40,height:40,borderRadius:8,background:mColor+'18',
                    display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>
                    {t.icon}
                  </div>

                  {/* Info */}
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                      <span style={{fontWeight:700,fontSize:13}}>{t.name}</span>
                      {t.default && (
                        <span style={{fontSize:9,fontWeight:800,padding:'1px 6px',background:'#FFD700',color:'#000',borderRadius:4}}>
                          ⭐ DEFAULT
                        </span>
                      )}
                      <span style={{fontSize:10,padding:'1px 6px',borderRadius:4,background:'#F0EEEB',color:'#6C757D',fontFamily:'monospace'}}>
                        {t.format}
                      </span>
                    </div>
                    <div style={{fontSize:11,color:'#6C757D'}}>{t.desc}</div>
                  </div>

                  {/* Actions */}
                  <div style={{display:'flex',gap:6,alignItems:'center',flexShrink:0}}>
                    {/* Status badge */}
                    <span style={{padding:'3px 8px',borderRadius:10,fontSize:10,fontWeight:700,
                      background:t.status==='Active'?'#D4EDDA':'#F5F5F5',
                      color:t.status==='Active'?'#155724':'#757575'}}>
                      ● {t.status}
                    </span>

                    {/* Set Default */}
                    {!t.default && t.status==='Active' && (
                      <button onClick={()=>toggleDefault(t.id)}
                        style={{padding:'4px 10px',borderRadius:5,border:'1px solid '+mColor,background:'#fff',
                          color:mColor,fontSize:11,fontWeight:700,cursor:'pointer'}}>
                        Set Default
                      </button>
                    )}

                    {/* Toggle status */}
                    <div onClick={()=>toggleStatus(t.id)}
                      style={{width:36,height:20,borderRadius:10,position:'relative',cursor:'pointer',flexShrink:0,
                        background:t.status==='Active'?mColor:'#CCC',transition:'background .2s'}}>
                      <div style={{position:'absolute',top:2,borderRadius:'50%',width:16,height:16,
                        background:'#fff',transition:'left .2s',boxShadow:'0 1px 3px rgba(0,0,0,.3)',
                        left:t.status==='Active'?17:2}}/>
                    </div>

                    {/* Preview */}
                    <button onClick={()=>handlePreview(t)}
                      style={{padding:'4px 12px',borderRadius:5,border:'1px solid var(--odoo-border)',
                        background:'#F8F9FA',fontSize:11,cursor:'pointer',fontWeight:600}}>
                      🔍 Preview
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {filtered.length === 0 && (
        <div style={{padding:40,textAlign:'center',color:'#6C757D',background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)'}}>
          No templates match your filter
        </div>
      )}
    </div>
  )
}
