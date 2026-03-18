import React, { useState } from 'react'
import { KPI_MASTER_DEFAULT } from './_kpiData'

export default function KPIMaster({ kpiMaster, onUpdate }) {
  const [master, setMaster] = useState(kpiMaster || KPI_MASTER_DEFAULT)
  const [adding, setAdding] = useState(false)
  const [newKPI, setNewKPI] = useState({code:'',cat:'Major',desc:'',uom:'%',dir:'up',wt:5,tgt:100,threshold:70,maxOver:30,scope:'all'})

  const inp = {padding:'6px 10px',border:'1.5px solid var(--odoo-border)',borderRadius:5,fontSize:12,outline:'none',background:'#FFFDE7',width:'100%',boxSizing:'border-box'}

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">KPI Master Configuration <small>{master.length} KPIs defined</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={()=>setAdding(!adding)}>+ Add KPI</button>
          <button className="btn btn-p sd-bsm">💾 Save</button>
        </div>
      </div>

      {adding && (
        <div style={{background:'#fff',borderRadius:8,border:'2px solid var(--odoo-purple)',padding:16,marginBottom:14}}>
          <div style={{fontFamily:'Syne,sans-serif',fontSize:13,fontWeight:700,marginBottom:12}}>➕ New KPI</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:10}}>
            {[['KPI Code','code'],['Description','desc'],['UoM','uom']].map(([l,k])=>(
              <div key={k}><label style={{fontSize:11,fontWeight:700,color:'var(--odoo-gray)',display:'block',marginBottom:4}}>{l}</label>
                <input value={newKPI[k]} onChange={e=>setNewKPI(n=>({...n,[k]:e.target.value}))} style={inp}/></div>
            ))}
            <div><label style={{fontSize:11,fontWeight:700,color:'var(--odoo-gray)',display:'block',marginBottom:4}}>Category</label>
              <select value={newKPI.cat} onChange={e=>setNewKPI(n=>({...n,cat:e.target.value}))} style={inp}>
                <option>Major</option><option>Minor</option>
              </select></div>
            <div><label style={{fontSize:11,fontWeight:700,color:'var(--odoo-gray)',display:'block',marginBottom:4}}>Direction</label>
              <select value={newKPI.dir} onChange={e=>setNewKPI(n=>({...n,dir:e.target.value}))} style={inp}>
                <option value="up">↑ Higher better</option><option value="down">↓ Lower better</option>
              </select></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
            {[['Weightage','wt'],['Target','tgt'],['Min Threshold %','threshold'],['Max Over %','maxOver']].map(([l,k])=>(
              <div key={k}><label style={{fontSize:11,fontWeight:700,color:'var(--odoo-gray)',display:'block',marginBottom:4}}>{l}</label>
                <input type="number" value={newKPI[k]} onChange={e=>setNewKPI(n=>({...n,[k]:parseFloat(e.target.value)||0}))} style={inp}/></div>
            ))}
          </div>
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-p sd-bsm" onClick={()=>{setMaster(m=>[...m,{...newKPI}]);setAdding(false)}}>✅ Add KPI</button>
            <button className="btn btn-s sd-bsm" onClick={()=>setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      <table className="fi-data-table">
        <thead><tr><th>Code</th><th>Category</th><th>Description</th><th>UoM</th><th>Direction</th><th>Weightage</th><th>Target</th><th>Min Threshold%</th><th>Max Over%</th><th>Scope</th><th>Action</th></tr></thead>
        <tbody>
          {master.map((k,i)=>(
            <tr key={k.code}>
              <td style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:'var(--odoo-purple)',fontSize:12}}>{k.code}</td>
              <td><span style={{padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:600,
                background:k.cat==='Major'?'#EDE0EA':'#D1ECF1',color:k.cat==='Major'?'#714B67':'#0C5460'}}>{k.cat}</span></td>
              <td style={{fontSize:12,fontWeight:600}}>{k.desc}</td>
              <td style={{fontFamily:'DM Mono,monospace',textAlign:'center'}}>{k.uom}</td>
              <td style={{textAlign:'center',fontWeight:700,color:k.dir==='up'?'#00A09D':'#E06F39',fontSize:16}}>
                {k.dir==='up'?'↑':'↓'}
              </td>
              <td style={{textAlign:'center',fontWeight:800,color:'var(--odoo-purple)',fontSize:13}}>{k.wt||'—'}</td>
              <td style={{fontFamily:'DM Mono,monospace',textAlign:'right'}}>{k.tgt}</td>
              <td style={{textAlign:'center'}}>{k.threshold}%</td>
              <td style={{textAlign:'center'}}>{k.maxOver}%</td>
              <td style={{fontSize:11,color:'var(--odoo-gray)'}}>{k.scope}</td>
              <td><button className="btn-xs" onClick={()=>setMaster(m=>m.filter((_,j)=>j!==i))}>🗑️ Del</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
