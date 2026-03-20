import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const SPARES = [
  {id:'SP-0021',name:'Ring Traveller Set',cat:'Spinning',unit:'Set',stock:12,reorder:5,price:240,supplier:'KG Spare Parts',sb:'badge-pass',sl:'In Stock'},
  {id:'SP-0022',name:'Spindle Bearing 6205 ZZ',cat:'Bearing',unit:'Nos',stock:8,reorder:10,price:580,supplier:'SKF Bearings',sb:'badge-review',sl:'Low Stock'},
  {id:'SP-0023',name:'V-Belt B68',cat:'Drive',unit:'Nos',stock:15,reorder:5,price:320,supplier:'Gates India',sb:'badge-pass',sl:'In Stock'},
  {id:'SP-0042',name:'Spindle Bearing 6302 ZZ',cat:'Bearing',unit:'Nos',stock:3,reorder:8,price:420,supplier:'SKF Bearings',sb:'badge-fail',sl:'Critical'},
  {id:'SP-0055',name:'Spindle Oil (1L)',cat:'Lubricant',unit:'Ltr',stock:24,reorder:10,price:320,supplier:'Castrol India',sb:'badge-pass',sl:'In Stock'},
  {id:'SP-0061',name:'Carding Flat Wire',cat:'Carding',unit:'Mtr',stock:50,reorder:20,price:180,supplier:'Lakshmi Cards',sb:'badge-pass',sl:'In Stock'},
  {id:'SP-0072',name:'Winding Drum Motor 0.5HP',cat:'Electrical',unit:'Nos',stock:1,reorder:2,price:8500,supplier:'Kirloskar',sb:'badge-fail',sl:'Critical'},
  {id:'SP-0081',name:'Rotor Bearing 6004 ZZ',cat:'Bearing',unit:'Nos',stock:6,reorder:6,price:360,supplier:'SKF Bearings',sb:'badge-review',sl:'Low Stock'},
  {id:'SP-0088',name:'Draw Frame Top Roller',cat:'Drafting',unit:'Nos',stock:10,reorder:4,price:750,supplier:'Texparts India',sb:'badge-pass',sl:'In Stock'},
  {id:'SP-0091',name:'Fuse 10A / 20A Set',cat:'Electrical',unit:'Set',stock:30,reorder:10,price:45,supplier:'Havells',sb:'badge-pass',sl:'In Stock'},
]

const CHIPS = ['All','Critical','Low Stock','In Stock']
const CATS = ['All Categories','Bearing','Spinning','Drive','Lubricant','Carding','Electrical','Drafting']

export default function SparePartsList() {
  const nav = useNavigate()
  const [chip, setChip] = useState('All')
  const [cat, setCat] = useState('All Categories')

  const filtered = SPARES.filter(s =>
    (chip==='All' || s.sl===chip) &&
    (cat==='All Categories' || s.cat===cat)
  )

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Spare Parts Register <small>Stock & Reorder Status</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={() => nav('/pm/spares/issue')}>Issue Spares</button>
          <button className="btn btn-p sd-bsm">Add Spare Part</button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'16px'}}>
        {[['Total Parts',SPARES.length,'var(--odoo-purple)'],
          ['Critical — Reorder Now',SPARES.filter(s=>s.sl==='Critical').length,'var(--odoo-red)'],
          ['Low Stock',SPARES.filter(s=>s.sl==='Low Stock').length,'var(--odoo-orange)'],
          ['In Stock',SPARES.filter(s=>s.sl==='In Stock').length,'var(--odoo-green)'],
        ].map(([l,v,c])=>(
          <div key={l} style={{background:'#fff',borderRadius:'8px',padding:'12px',boxShadow:'0 1px 4px rgba(0,0,0,.08)',textAlign:'center'}}>
            <div style={{fontSize:'10px',fontWeight:'700',color:'var(--odoo-gray)',textTransform:'uppercase',marginBottom:'4px'}}>{l}</div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:'22px',fontWeight:'800',color:c}}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',gap:'10px',marginBottom:'14px',flexWrap:'wrap',alignItems:'center'}}>
        <div className="pp-chips" style={{margin:0}}>
          {CHIPS.map(c=>(
            <div key={c} className={`pp-chip${chip===c?' on':''}`} onClick={() => setChip(c)}>{c}
              <span>{c==='All'?SPARES.length:SPARES.filter(s=>s.sl===c).length}</span>
            </div>
          ))}
        </div>
        <select className="fi-filter-select" onChange={e=>setCat(e.target.value)} style={{width:'160px'}}>
          {CATS.map(c=><option key={c}>{c}</option>)}
        </select>
        <div className="fi-filter-search" style={{flex:1}}><input placeholder="Search part name, ID..."/></div>
      </div>

      <table className="fi-data-table">
        <thead><tr>
          <th>Part No.</th><th>Name</th><th>Category</th><th>Unit</th>
          <th>Current Stock</th><th>Reorder Level</th><th>Unit Price</th><th>Supplier</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>
          {filtered.map(s=>(
            <tr key={s.id} style={{background:s.sl==='Critical'?'#FFF5F5':s.sl==='Low Stock'?'#FFFBF0':'inherit'}}>
              <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>{s.id}</strong></td>
              <td><strong>{s.name}</strong></td>
              <td>{s.cat}</td>
              <td>{s.unit}</td>
              <td>
                <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                  <span style={{fontWeight:'700',color:s.sl==='Critical'?'var(--odoo-red)':s.sl==='Low Stock'?'var(--odoo-orange)':'var(--odoo-green)',fontSize:'14px'}}>{s.stock}</span>
                  <span style={{fontSize:'11px',color:'var(--odoo-gray)'}}>{s.unit}</span>
                </div>
              </td>
              <td style={{color:'var(--odoo-gray)',fontSize:'12px'}}>{s.reorder} {s.unit}</td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px'}}>₹{s.price}</td>
              <td style={{fontSize:'12px'}}>{s.supplier}</td>
              <td><span className={`badge ${s.sb}`}>
                {s.sl==='Critical'?' '+s.sl:s.sl==='Low Stock'?' '+s.sl:' '+s.sl}
              </span></td>
              <td>
                <div style={{display:'flex',gap:'4px'}}>
                  <button className="btn-xs" onClick={() => nav('/pm/spares/issue')}>Issue</button>
                  {s.sl!=='In Stock' && <button className="btn-xs pri">Reorder</button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
