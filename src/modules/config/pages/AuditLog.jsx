import React, { useState } from 'react'

const AUDIT_ENTRIES = [
  { id:'AL-001', ts:'2026-03-11 09:05:12', user:'Saravana Kumar', role:'admin',   module:'Config', action:'LOGIN',  doc:'—',          change:'User logged in from 192.168.1.10',  ip:'192.168.1.10' },
  { id:'AL-002', ts:'2026-03-11 08:55:03', user:'Ramesh P',       role:'manager', module:'PP',     action:'UPDATE', doc:'JC-0042',    change:'Status changed: Pending → In Progress', ip:'192.168.1.11' },
  { id:'AL-003', ts:'2026-03-11 08:30:44', user:'Priya S',        role:'accounts',module:'FI',     action:'CREATE', doc:'INV/2217',   change:'Invoice created · Amt ₹48,500',     ip:'192.168.1.13' },
  { id:'AL-004', ts:'2026-03-10 17:45:22', user:'Saravana Kumar', role:'admin',   module:'Config', action:'UPDATE', doc:'USR-003',    change:'User Priya S role changed: accounts → accounts (no change)', ip:'192.168.1.10' },
  { id:'AL-005', ts:'2026-03-10 17:20:11', user:'Karthik M',      role:'operations',module:'WM',   action:'CREATE', doc:'GRN/0444',   change:'GRN created · Vendor: Delta Chemicals · Items: 3', ip:'192.168.1.14' },
  { id:'AL-006', ts:'2026-03-10 16:55:00', user:'Ramesh P',       role:'manager', module:'PP',     action:'DELETE', doc:'WO/0126',    change:'Work Order deleted (reason: Duplicate)',ip:'192.168.1.11' },
  { id:'AL-007', ts:'2026-03-10 14:10:33', user:'Vijay T',        role:'sales',   module:'SD',     action:'CREATE', doc:'SO/1041',    change:'Sales Order created · Customer: Kovai Auto · ₹92,000', ip:'192.168.1.16' },
  { id:'AL-008', ts:'2026-03-10 13:22:45', user:'Saravana Kumar', role:'admin',   module:'Config', action:'UPDATE', doc:'NS-006',     change:'Number series JC prefix changed: JC/ → JC-', ip:'192.168.1.10' },
  { id:'AL-009', ts:'2026-03-10 11:05:17', user:'Kavitha R',      role:'hr',      module:'HCM',    action:'CREATE', doc:'EMP-034',    change:'New employee added: Selvam R · Dept: Production', ip:'192.168.1.15' },
  { id:'AL-010', ts:'2026-03-10 10:44:00', user:'Priya S',        role:'accounts',module:'FI',     action:'UPDATE', doc:'PV/0333',    change:'Payment voucher updated · Amt: ₹12,000 → ₹15,000', ip:'192.168.1.13' },
  { id:'AL-011', ts:'2026-03-10 09:30:22', user:'Saravana Kumar', role:'admin',   module:'MM',     action:'APPROVE',doc:'PO/0566',    change:'Purchase Order approved · Vendor: Sri Ram Chemicals · ₹62,400', ip:'192.168.1.10' },
  { id:'AL-012', ts:'2026-03-09 18:15:00', user:'Karthik M',      role:'operations',module:'QM',   action:'CREATE', doc:'QR/0088',    change:'Quality report filed · Batch: BATCH-007 · Pass', ip:'192.168.1.14' },
]

const ACTION_COLORS = {
  LOGIN:  { bg:'#E3F2FD', c:'#1565C0' },
  CREATE: { bg:'#E8F5E9', c:'#2E7D32' },
  UPDATE: { bg:'#FFF3E0', c:'#E65100' },
  DELETE: { bg:'#FFEBEE', c:'#C62828' },
  APPROVE:{ bg:'#F3E5F5', c:'#6A1B9A' },
}

export default function AuditLog() {
  const [search,   setSearch]   = useState('')
  const [moduleF,  setModuleF]  = useState('All')
  const [actionF,  setActionF]  = useState('All')
  const [entries]              = useState(AUDIT_ENTRIES)

  const modules = [...new Set(entries.map(e => e.module))]
  const actions = [...new Set(entries.map(e => e.action))]

  const filtered = entries.filter(e => {
    const mM = moduleF==='All' || e.module===moduleF
    const mA = actionF==='All' || e.action===actionF
    const mS = !search || e.user.toLowerCase().includes(search.toLowerCase()) ||
               e.doc.toLowerCase().includes(search.toLowerCase()) ||
               e.change.toLowerCase().includes(search.toLowerCase())
    return mM && mA && mS
  })

  const moduleColor = m => ({ SD:'#117A65', MM:'#1A5276', PP:'#714B67', FI:'#196F3D', QM:'#C0392B', HCM:'#6C3483', CRM:'#784212', WM:'#1F618D', Config:'#4D5656' }[m] || '#555')

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Audit Log <small>All system changes tracked automatically</small></div>
        <div className="fi-lv-actions">
          <input className="sd-search" placeholder="🔍 User / Document / Change…" value={search} onChange={e=>setSearch(e.target.value)} style={{width:'200px'}} />
          <select className="sd-select" value={moduleF} onChange={e=>setModuleF(e.target.value)}>
            <option value="All">All Modules</option>
            {modules.map(m=><option key={m}>{m}</option>)}
          </select>
          <select className="sd-select" value={actionF} onChange={e=>setActionF(e.target.value)}>
            <option value="All">All Actions</option>
            {actions.map(a=><option key={a}>{a}</option>)}
          </select>
          <button className="btn btn-s sd-bsm">Export</button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'10px',marginBottom:'14px'}}>
        {[
          {l:'Total Entries',v:entries.length,c:'var(--odoo-purple)',i:'📋'},
          ...Object.entries(ACTION_COLORS).map(([a,col])=>({
            l:`${a[0]+a.slice(1).toLowerCase()}s`,
            v:entries.filter(e=>e.action===a).length,
            c:col.c, i:a==='LOGIN'?'🔑':a==='CREATE'?'➕':a==='UPDATE'?'✏️':a==='DELETE'?'🗑️':'✅'
          }))
        ].map(k=>(
          <div key={k.l} className="crm-kpi-card" style={{borderLeftColor:k.c}}>
            <div className="crm-kpi-icon">{k.i}</div>
            <div className="crm-kpi-val" style={{color:k.c}}>{k.v}</div>
            <div className="crm-kpi-lbl">{k.l}</div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
        {filtered.map((e,i)=>{
          const ac = ACTION_COLORS[e.action] || {bg:'#F5F5F5',c:'#555'}
          return (
            <div key={e.id} style={{display:'flex',gap:'12px',alignItems:'flex-start',
              padding:'10px 14px',background:'#fff',borderRadius:'8px',border:'1px solid var(--odoo-border)'}}>
              {/* Action badge */}
              <span style={{padding:'3px 8px',borderRadius:'6px',fontSize:'10px',fontWeight:'800',
                background:ac.bg,color:ac.c,flexShrink:0,minWidth:'60px',textAlign:'center',marginTop:'1px'}}>
                {e.action}
              </span>
              {/* Module badge */}
              <span style={{padding:'3px 7px',borderRadius:'5px',fontSize:'10px',fontWeight:'800',
                background:moduleColor(e.module)+'22',color:moduleColor(e.module),flexShrink:0,marginTop:'1px'}}>
                {e.module}
              </span>
              {/* Doc */}
              <span style={{fontFamily:'DM Mono,monospace',fontSize:'11px',fontWeight:'700',color:'var(--odoo-purple)',
                flexShrink:0,minWidth:'90px',marginTop:'2px'}}>{e.doc}</span>
              {/* Change description */}
              <div style={{flex:1}}>
                <div style={{fontSize:'12px',fontWeight:'600'}}>{e.change}</div>
                <div style={{fontSize:'10px',color:'var(--odoo-gray)',marginTop:'2px'}}>
                  👤 {e.user} ({e.role}) &nbsp;·&nbsp; 🌐 {e.ip}
                </div>
              </div>
              {/* Timestamp */}
              <div style={{fontSize:'11px',color:'var(--odoo-gray)',flexShrink:0,textAlign:'right',fontFamily:'DM Mono,monospace'}}>
                {e.ts.split(' ')[0]}<br/>
                <strong>{e.ts.split(' ')[1]}</strong>
              </div>
            </div>
          )
        })}
        {filtered.length===0&&<div style={{textAlign:'center',padding:'40px',color:'var(--odoo-gray)'}}>No entries match your filters</div>}
      </div>
    </div>
  )
}
