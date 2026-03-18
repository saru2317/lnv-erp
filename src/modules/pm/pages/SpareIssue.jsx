import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const SPARE_OPTIONS = [
  {id:'SP-0021',name:'Ring Traveller Set',stock:12,unit:'Set',price:240},
  {id:'SP-0023',name:'V-Belt B68',stock:15,unit:'Nos',price:320},
  {id:'SP-0042',name:'Spindle Bearing 6302 ZZ',stock:3,unit:'Nos',price:420},
  {id:'SP-0055',name:'Spindle Oil (1L)',stock:24,unit:'Ltr',price:320},
  {id:'SP-0072',name:'Winding Drum Motor 0.5HP',stock:1,unit:'Nos',price:8500},
  {id:'SP-0088',name:'Draw Frame Top Roller',stock:10,unit:'Nos',price:750},
]

export default function SpareIssue() {
  const nav = useNavigate()
  const [rows, setRows] = useState([{id:0,spare:'SP-0021',qty:1}])
  const [saved, setSaved] = useState(false)

  const addRow = () => setRows([...rows,{id:Date.now(),spare:'SP-0055',qty:1}])
  const removeRow = (id) => setRows(rows.filter(r=>r.id!==id))
  const updateRow = (id,field,val) => setRows(rows.map(r=>r.id===id?{...r,[field]:val}:r))

  const total = rows.reduce((s,r)=>{
    const sp = SPARE_OPTIONS.find(o=>o.id===r.spare)
    return s + (sp ? sp.price*r.qty : 0)
  },0)

  if (saved) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'60px',gap:'16px'}}>
      <div style={{fontSize:'48px'}}>📦</div>
      <div style={{fontFamily:'Syne,sans-serif',fontSize:'20px',fontWeight:'800',color:'var(--odoo-purple)'}}>SPI-2025-032 — Issued!</div>
      <div style={{fontSize:'13px',color:'var(--odoo-gray)'}}>Stock updated · Maintenance log entry created · ₹{total.toLocaleString()} cost recorded</div>
      <div style={{display:'flex',gap:'10px'}}>
        <button className="btn btn-s sd-bsm" onClick={() => nav('/pm/spares')}>← Spare Parts</button>
        <button className="btn btn-s sd-bsm" onClick={() => { setSaved(false); setRows([{id:0,spare:'SP-0021',qty:1}]) }}>➕ New Issue</button>
      </div>
    </div>
  )

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Issue Spare Parts <small>SPI-2025-032</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={() => nav('/pm/spares')}>✕ Cancel</button>
          <button className="btn btn-p sd-bsm" onClick={() => setSaved(true)}>📤 Issue & Deduct Stock</button>
        </div>
      </div>

      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">📋 Issue Details</div>
        <div className="fi-form-sec-body">
          <div className="fi-form-row">
            <div className="fi-form-grp"><label>Issue No.</label><input className="fi-form-ctrl" defaultValue="SPI-2025-032" readOnly/></div>
            <div className="fi-form-grp"><label>Issue Date <span>*</span></label><input type="date" className="fi-form-ctrl" defaultValue="2025-03-01"/></div>
            <div className="fi-form-grp"><label>Issue Against <span>*</span></label>
              <select className="fi-form-ctrl">
                <option>PM Work Order — PMW-2025-012</option>
                <option>Breakdown — BD-2025-008</option>
                <option>General Maintenance</option>
              </select>
            </div>
          </div>
          <div className="fi-form-row">
            <div className="fi-form-grp"><label>Machine <span>*</span></label>
              <select className="fi-form-ctrl">
                <option>SPG-01 · Ring Frame 01</option><option>WND-01 · Winding M/C</option>
                <option>OE-02 · OE Spinning</option><option>CRD-01 · Carding M/C</option>
              </select>
            </div>
            <div className="fi-form-grp"><label>Issued To (Technician)</label>
              <select className="fi-form-ctrl">
                <option>Suresh M. — Mechanical</option><option>Ravi K. — Mechanical</option>
                <option>Kannan E. — Electrical</option>
              </select>
            </div>
            <div className="fi-form-grp"><label>Authorised By</label>
              <select className="fi-form-ctrl"><option>Ramesh K. — Plant Manager</option></select>
            </div>
          </div>
        </div>
      </div>

      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">📦 Spare Parts to Issue</div>
        <div style={{padding:'0'}}>
          <table className="fi-data-table">
            <thead><tr><th>#</th><th>Part ID</th><th>Spare Part Name</th><th>Available</th><th>Qty to Issue</th><th>Unit</th><th>Cost</th><th></th></tr></thead>
            <tbody>
              {rows.map((r,i)=>{
                const sp = SPARE_OPTIONS.find(o=>o.id===r.spare)
                const rowCost = sp ? sp.price*r.qty : 0
                const lowStock = sp && r.qty > sp.stock
                return (
                  <tr key={r.id} style={{background:lowStock?'#FFF5F5':'inherit'}}>
                    <td>{i+1}</td>
                    <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px',color:'var(--odoo-purple)'}}>
                      {r.spare}
                    </td>
                    <td>
                      <select value={r.spare} onChange={e=>updateRow(r.id,'spare',e.target.value)}
                        style={{width:'220px',border:'1px solid var(--odoo-border)',borderRadius:'5px',padding:'5px 8px',fontSize:'12px'}}>
                        {SPARE_OPTIONS.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
                      </select>
                    </td>
                    <td>
                      <span style={{fontWeight:'700',color:sp&&sp.stock>5?'var(--odoo-green)':sp&&sp.stock>0?'var(--odoo-orange)':'var(--odoo-red)'}}>
                        {sp?.stock} {sp?.unit}
                      </span>
                    </td>
                    <td>
                      <input type="number" min="1" value={r.qty} onChange={e=>updateRow(r.id,'qty',parseInt(e.target.value)||1)}
                        style={{width:'70px',border:`2px solid ${lowStock?'var(--odoo-red)':'var(--odoo-border)'}`,borderRadius:'5px',
                          padding:'5px 8px',fontSize:'13px',fontWeight:'600',textAlign:'center'}}/>
                      {lowStock && <div style={{fontSize:'10px',color:'var(--odoo-red)',marginTop:'2px'}}>⚠️ Exceeds stock!</div>}
                    </td>
                    <td style={{fontSize:'12px',color:'var(--odoo-gray)'}}>{sp?.unit}</td>
                    <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px',fontWeight:'700',color:'var(--odoo-blue)'}}>₹{rowCost.toLocaleString()}</td>
                    <td>
                      {rows.length>1 && <button onClick={()=>removeRow(r.id)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--odoo-red)',fontSize:'16px'}}>✕</button>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{background:'#F8F9FA',fontWeight:'700'}}>
                <td colSpan={6} style={{textAlign:'right'}}>Total Issue Cost:</td>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:'14px',color:'var(--odoo-blue)'}}>₹{total.toLocaleString()}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
          <div style={{padding:'10px 14px'}}>
            <button className="btn btn-s sd-bsm" onClick={addRow}>➕ Add More Parts</button>
          </div>
        </div>
      </div>

      <div className="pp-alert info">💡 Issuing spare parts will auto-deduct stock and create a cost entry in the Maintenance Cost Report. FI integration posts to maintenance expense account.</div>

      <div className="fi-form-acts">
        <button className="btn btn-s sd-bsm" onClick={() => nav('/pm/spares')}>✕ Cancel</button>
        <button className="btn btn-p sd-bsm" onClick={() => setSaved(true)}>📤 Issue & Deduct Stock</button>
      </div>
    </div>
  )
}
