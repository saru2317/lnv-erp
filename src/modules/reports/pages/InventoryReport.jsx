import React, { useState } from 'react'
const STOCK = [
  {code:'RM-001',name:'Powder Coat - RAL 9005 (Black)',  cat:'Raw Material',uom:'Kg', qty:480, minStock:200, value:768000,  age:12, status:'ok'},
  {code:'RM-002',name:'Powder Coat - RAL 9010 (White)',  cat:'Raw Material',uom:'Kg', qty:320, minStock:150, value:512000,  age:8,  status:'ok'},
  {code:'RM-003',name:'Phosphating Chemical',             cat:'Chemicals',   uom:'Kg', qty:85,  minStock:100, value:212500,  age:22, status:'low'},
  {code:'RM-004',name:'Masking Tape - 25mm',              cat:'Consumables', uom:'Roll',qty:12, minStock:50,  value:3600,    age:45, status:'critical'},
  {code:'SP-001',name:'Conveyor Chain Link',              cat:'Spare Parts', uom:'Nos', qty:24, minStock:10,  value:48000,   age:90, status:'ok'},
  {code:'SP-002',name:'Burner Nozzle',                    cat:'Spare Parts', uom:'Nos', qty:3,  minStock:5,   value:9000,    age:35, status:'low'},
  {code:'FG-001',name:'Coated Parts — Batch A-2026-047', cat:'Finished Goods',uom:'Kg',qty:1240,minStock:0, value:2480000, age:2,  status:'ok'},
  {code:'FG-002',name:'Coated Parts — Batch A-2026-046', cat:'Finished Goods',uom:'Kg',qty:680, minStock:0, value:1360000, age:5,  status:'ok'},
]
const ST = {ok:{label:'OK',bg:'#D4EDDA',c:'#155724'}, low:{label:'Low Stock',bg:'#FFF3CD',c:'#856404'}, critical:{label:'Critical',bg:'#F8D7DA',c:'#721C24'}}
const fmtL = n => '₹'+(n/100000).toFixed(1)+'L'
export default function InventoryReport() {
  const [view,setView]=useState('stock')
  const totalVal = STOCK.reduce((s,r)=>s+r.value,0)
  const lowCount = STOCK.filter(r=>r.status!=='ok').length
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Inventory Report <small>WM Module · Stock Analytics</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">Export</button>
        </div>
      </div>
      <div className="fi-kpi-grid" style={{gridTemplateColumns:'repeat(4,1fr)',marginBottom:16}}>
        {[
          {cls:'purple',l:'Total Stock Items', v:STOCK.length,            s:'All categories'},
          {cls:'green', l:'Stock Value',        v:fmtL(totalVal),          s:'At cost price'},
          {cls:'orange',l:'Low / Critical',     v:lowCount,                s:'Need reorder'},
          {cls:'blue',  l:'Slow Moving (>30d)', v:STOCK.filter(r=>r.age>30).length, s:'Needs review'},
        ].map(k=>(<div key={k.l} className={`fi-kpi-card ${k.cls}`}><div className="fi-kpi-label">{k.l}</div><div className="fi-kpi-value">{k.v}</div><div className="fi-kpi-sub">{k.s}</div></div>))}
      </div>
      <div style={{display:'flex',gap:6,marginBottom:14}}>
        {[['stock','📦 Stock Register'],['low','⚠️ Reorder Required'],['aging','⏰ Aging Analysis']].map(([k,l])=>(
          <button key={k} onClick={()=>setView(k)} style={{padding:'6px 16px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',border:'1px solid var(--odoo-border)',background:view===k?'var(--odoo-purple)':'#fff',color:view===k?'#fff':'var(--odoo-gray)'}}>{l}</button>
        ))}
      </div>
      <table className="fi-data-table">
        <thead><tr><th>Code</th><th>Description</th><th>Category</th><th>UOM</th><th>Qty</th><th>Min Stock</th><th>Stock Value</th><th>Age (days)</th><th>Status</th></tr></thead>
        <tbody>
          {STOCK.filter(r=> view==='low'?r.status!=='ok': view==='aging'?r.age>20:true).map(r=>{
            const st=ST[r.status]
            return(<tr key={r.code}>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--odoo-purple)',fontWeight:600}}>{r.code}</td>
              <td style={{fontSize:12,fontWeight:600,maxWidth:200}}>{r.name}</td>
              <td style={{fontSize:11}}>{r.cat}</td>
              <td style={{textAlign:'center'}}>{r.uom}</td>
              <td style={{fontFamily:'DM Mono,monospace',textAlign:'right',fontWeight:700,color:r.status!=='ok'?'var(--odoo-red)':'var(--odoo-dark)'}}>{r.qty.toLocaleString('en-IN')}</td>
              <td style={{fontFamily:'DM Mono,monospace',textAlign:'right',color:'var(--odoo-gray)'}}>{r.minStock||'—'}</td>
              <td style={{fontFamily:'DM Mono,monospace',textAlign:'right',fontWeight:700}}>{fmtL(r.value)}</td>
              <td style={{textAlign:'center',color:r.age>30?'var(--odoo-red)':r.age>14?'var(--odoo-orange)':'var(--odoo-gray)',fontWeight:r.age>30?700:400}}>{r.age}d</td>
              <td><span style={{padding:'3px 8px',borderRadius:10,fontSize:11,fontWeight:600,background:st.bg,color:st.c}}>{st.label}</span></td>
            </tr>)
          })}
        </tbody>
      </table>
    </div>
  )
}
