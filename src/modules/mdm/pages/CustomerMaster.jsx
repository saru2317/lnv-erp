import React, { useState } from 'react'
import toast from 'react-hot-toast'

export default function CustomerMaster() {
  const [search, setSearch] = useState('')
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Customer Master <small>SAP: XD01/XD03</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">Export</button>
          <button className="btn btn-p" onClick={()=>toast.success('New Customer Master form coming soon!')}>+ New</button>
        </div>
      </div>
      <div style={{padding:'8px 12px',background:'#E6F7F7',border:'1px solid #00A09D',borderRadius:6,marginBottom:14,fontSize:12,color:'#005A58'}}>
        <strong>Customer Master</strong> — All customers, Bill To, Ship To addresses
      </div>
      <div style={{display:'flex',gap:8,marginBottom:12}}>
        <input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}
          style={{padding:'6px 12px',border:'1px solid var(--odoo-border)',borderRadius:6,fontSize:12,outline:'none',width:280}}/>
      </div>
      <table className="fi-data-table">
        <thead><tr>
          <th>Code</th>          <th>Customer Name</th>          <th>GSTIN</th>          <th>City</th>          <th>Payment Terms</th>          <th>Status</th>          <th>Actions</th>
        </tr></thead>
        <tbody>
          <tr>
            <td style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:'var(--odoo-purple)',fontSize:12}}>C-001</td>
            <td style={{fontWeight:600,fontSize:12}}>Sri Lakshmi Mills Pvt Ltd</td>
            <td style={{fontSize:11}}>33AABCS1429B1Z5</td>
            <td style={{fontSize:11}}>Coimbatore</td>
            <td style={{fontSize:11}}>Net 30</td>
            <td><span style={{padding:'2px 8px',borderRadius:8,fontSize:10,fontWeight:600,background:'#D4EDDA',color:'#155724'}}>Active</span></td>
            <td><button onClick={()=>toast.success('Edit CustomerMaster')} style={{padding:'3px 8px',fontSize:10,fontWeight:600,borderRadius:4,border:'1px solid var(--odoo-purple)',background:'var(--odoo-purple-lt)',color:'var(--odoo-purple)',cursor:'pointer'}}>Edit</button></td>
          </tr>
          <tr>
            <td style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:'var(--odoo-purple)',fontSize:12}}>C-002</td>
            <td style={{fontWeight:600,fontSize:12}}>Coimbatore Spinners Ltd</td>
            <td style={{fontSize:11}}>33AABCC2341B1Z1</td>
            <td style={{fontSize:11}}>Coimbatore</td>
            <td style={{fontSize:11}}>Net 45</td>
            <td><span style={{padding:'2px 8px',borderRadius:8,fontSize:10,fontWeight:600,background:'#D4EDDA',color:'#155724'}}>Active</span></td>
            <td><button onClick={()=>toast.success('Edit CustomerMaster')} style={{padding:'3px 8px',fontSize:10,fontWeight:600,borderRadius:4,border:'1px solid var(--odoo-purple)',background:'var(--odoo-purple-lt)',color:'var(--odoo-purple)',cursor:'pointer'}}>Edit</button></td>
          </tr>
          <tr>
            <td style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:'var(--odoo-purple)',fontSize:12}}>C-003</td>
            <td style={{fontWeight:600,fontSize:12}}>Ashok Leyland Ltd</td>
            <td style={{fontSize:11}}>33AAACE5678M1Z2</td>
            <td style={{fontSize:11}}>Chennai</td>
            <td style={{fontSize:11}}>Net 45</td>
            <td><span style={{padding:'2px 8px',borderRadius:8,fontSize:10,fontWeight:600,background:'#D4EDDA',color:'#155724'}}>Active</span></td>
            <td><button onClick={()=>toast.success('Edit CustomerMaster')} style={{padding:'3px 8px',fontSize:10,fontWeight:600,borderRadius:4,border:'1px solid var(--odoo-purple)',background:'var(--odoo-purple-lt)',color:'var(--odoo-purple)',cursor:'pointer'}}>Edit</button></td>
          </tr>
          <tr>
            <td style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:'var(--odoo-purple)',fontSize:12}}>C-004</td>
            <td style={{fontWeight:600,fontSize:12}}>TVS Motors</td>
            <td style={{fontSize:11}}>33AAACT1234N1Z2</td>
            <td style={{fontSize:11}}>Hosur</td>
            <td style={{fontSize:11}}>Net 30</td>
            <td><span style={{padding:'2px 8px',borderRadius:8,fontSize:10,fontWeight:600,background:'#D4EDDA',color:'#155724'}}>Active</span></td>
            <td><button onClick={()=>toast.success('Edit CustomerMaster')} style={{padding:'3px 8px',fontSize:10,fontWeight:600,borderRadius:4,border:'1px solid var(--odoo-purple)',background:'var(--odoo-purple-lt)',color:'var(--odoo-purple)',cursor:'pointer'}}>Edit</button></td>
          </tr>
          <tr>
            <td style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:'var(--odoo-purple)',fontSize:12}}>C-005</td>
            <td style={{fontWeight:600,fontSize:12}}>ARS Cotton Mills</td>
            <td style={{fontSize:11}}>33AABCA5631B1Z2</td>
            <td style={{fontSize:11}}>Salem</td>
            <td style={{fontSize:11}}>Net 30</td>
            <td><span style={{padding:'2px 8px',borderRadius:8,fontSize:10,fontWeight:600,background:'#FFF3CD',color:'#856404'}}>Overdue</span></td>
            <td><button onClick={()=>toast.success('Edit CustomerMaster')} style={{padding:'3px 8px',fontSize:10,fontWeight:600,borderRadius:4,border:'1px solid var(--odoo-purple)',background:'var(--odoo-purple-lt)',color:'var(--odoo-purple)',cursor:'pointer'}}>Edit</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
