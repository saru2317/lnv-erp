import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OPPORTUNITIES, LOST_REASONS, fmt, fmtFull } from './_crmData'

const LOST_DATA = [
  {id:'OPP-0012',company:'Rajasthan Auto Parts',product:'Powder Coating Line',value:1800000,reason:'Price Too High',competitor:'Akzo Nobel',owner:'Ravi Kumar',date:'2025-02-20',stage:'Negotiation',notes:'Customer said our price was 15% higher than Akzo Nobel quote.'},
  {id:'OPP-0010',company:'Sun Industries',product:'Chrome Plating Unit',value:950000,reason:'Competitor Won',competitor:'Local Vendor',owner:'Suresh M.',date:'2025-02-10',stage:'Proposal Submitted',notes:'Customer preferred local vendor due to proximity.'},
  {id:'OPP-0008',company:'Global Forge',product:'Zinc Phosphating',value:650000,reason:'Delivery Timeline',competitor:'',owner:'Vijay A.',date:'2025-01-28',stage:'Decision Pending',notes:'Customer needed delivery in 15 days. We could not commit below 30.'},
  {id:'OPP-0006',company:'North Star Pvt Ltd',product:'E-Coat System',value:2100000,reason:'Budget Cancelled',competitor:'',owner:'Ravi Kumar',date:'2025-01-15',stage:'Negotiation',notes:'Customer cancelled project due to internal budget freeze.'},
  {id:'OPP-0004',company:'Omega Engineering',product:'Passivation Pack',value:280000,reason:'No Response',competitor:'',owner:'Preethi S.',date:'2025-01-05',stage:'Proposal Submitted',notes:'Customer stopped responding after receiving quotation.'},
]

const REASON_COLORS = {
  'Price Too High':'var(--odoo-red)','Competitor Won':'var(--odoo-orange)',
  'Delivery Timeline':'#B7950B','Budget Cancelled':'var(--odoo-gray)',
  'No Response':'var(--odoo-blue)','Technical Mismatch':'var(--odoo-purple)',
}

export default function LostAnalysis() {
  const nav = useNavigate()
  const [reason, setReason] = useState('All')

  const allLost  = [...OPPORTUNITIES.filter(o=>o.stage==='Lost'), ...LOST_DATA.filter(x=>!OPPORTUNITIES.find(o=>o.id===x.id))]
  const filtered = reason==='All' ? LOST_DATA : LOST_DATA.filter(l=>l.reason===reason)

  const totalLostVal = LOST_DATA.reduce((s,l)=>s+l.value,0)
  const reasonCounts = LOST_REASONS.map(r=>({r,count:LOST_DATA.filter(l=>l.reason===r).length,val:LOST_DATA.filter(l=>l.reason===r).reduce((s,l)=>s+l.value,0)})).filter(x=>x.count>0)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Lost Sales Analysis <small>Understand why deals are lost</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">Export Report</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'14px'}}>
        {[
          {l:'Total Lost Deals',  v:LOST_DATA.length,         clr:'var(--odoo-red)',   ic:''},
          {l:'Lost Revenue',      v:fmt(totalLostVal),         clr:'var(--odoo-orange)',ic:''},
          {l:'Top Reason',        v:'Price Too High',           clr:'var(--odoo-purple)',ic:''},
          {l:'Win Rate Overall',  v:'62%',                     clr:'var(--odoo-green)', ic:''},
        ].map(k=>(
          <div key={k.l} className="crm-kpi-card" style={{borderLeftColor:k.clr}}>
            <div className="crm-kpi-icon">{k.ic}</div>
            <div className="crm-kpi-val" style={{color:k.clr,fontSize:'15px'}}>{k.v}</div>
            <div className="crm-kpi-lbl">{k.l}</div>
          </div>
        ))}
      </div>

      <div className="fi-panel-grid">
        {/* Reason Breakdown */}
        <div className="fi-panel">
          <div className="fi-panel-hdr"><h3>Loss Reason Analysis</h3></div>
          <div className="fi-panel-body">
            {reasonCounts.sort((a,b)=>b.count-a.count).map(x=>{
              const pct = Math.round(x.count/LOST_DATA.length*100)
              const clr = REASON_COLORS[x.r]||'var(--odoo-gray)'
              return (
                <div key={x.r} style={{marginBottom:'14px',cursor:'pointer'}} onClick={()=>setReason(reason===x.r?'All':x.r)}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'4px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <div style={{width:'10px',height:'10px',borderRadius:'50%',background:clr}}></div>
                      <strong style={{fontSize:'12px'}}>{x.r}</strong>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <span style={{fontWeight:'700',color:clr,marginRight:'8px'}}>{pct}%</span>
                      <span style={{fontSize:'11px',color:'var(--odoo-gray)'}}>{x.count} deal{x.count>1?'s':''} · {fmt(x.val)}</span>
                    </div>
                  </div>
                  <div style={{background:'#F0EEEB',borderRadius:'4px',height:'8px'}}>
                    <div style={{width:`${pct}%`,height:'100%',borderRadius:'4px',background:clr,transition:'width .3s'}}></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Competitor Analysis */}
        <div className="fi-panel">
          <div className="fi-panel-hdr"><h3> Competitor Analysis</h3></div>
          <div className="fi-panel-body">
            <div style={{marginBottom:'14px',padding:'12px',background:'#F8D7DA',borderRadius:'6px'}}>
              <div style={{fontWeight:'700',fontSize:'12px',color:'#721C24',marginBottom:'4px'}}> Price is the #1 loss reason (40%)</div>
              <div style={{fontSize:'12px',color:'#721C24'}}>Review pricing strategy for competitive deals. Consider value-based pricing.</div>
            </div>
            {[{comp:'Akzo Nobel',wins:2,val:2750000},{comp:'Local Vendors',wins:1,val:950000},{comp:'Henkel India',wins:0,val:0}].map(c=>(
              <div key={c.comp} style={{padding:'8px 0',borderBottom:'1px solid var(--odoo-border)'}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px'}}>
                  <strong>{c.comp}</strong>
                  <span style={{color:'var(--odoo-red)',fontWeight:'700'}}>{c.wins} deal{c.wins!==1?'s':''} lost</span>
                </div>
                {c.val>0&&<div style={{fontSize:'11px',color:'var(--odoo-gray)',marginTop:'2px'}}>Value lost: {fmtFull(c.val)}</div>}
              </div>
            ))}
            <div style={{marginTop:'12px',padding:'10px',background:'#EDE0EA',borderRadius:'6px',fontSize:'12px'}}>
              <div style={{fontWeight:'700',color:'var(--odoo-purple)',marginBottom:'4px'}}> Recommendations</div>
              <div style={{lineHeight:'1.7'}}>
                • Offer <strong>extended payment terms</strong> for large deals<br/>
                • Emphasize <strong>quality certification</strong> over local vendors<br/>
                • Create <strong>urgency pricing</strong> for time-sensitive requirements
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lost Deals Table */}
      <div className="fi-panel" style={{marginTop:'14px'}}>
        <div className="fi-panel-hdr">
          <h3>Lost Deals — {reason==='All'?'All Reasons':reason}</h3>
          {reason!=='All'&&<button className="btn btn-s sd-bsm" onClick={()=>setReason('All')}>Clear Filter</button>}
        </div>
        <div className="fi-panel-body" style={{padding:'0'}}>
          <table className="sd-table">
            <thead><tr><th>Opp ID</th><th>Company</th><th>Product</th><th>Value</th><th>Reason</th><th>Competitor</th><th>Owner</th><th>Lost Date</th></tr></thead>
            <tbody>
              {filtered.map(l=>(
                <tr key={l.id} className="sd-tr-hover">
                  <td><span style={{fontFamily:'DM Mono,monospace',fontWeight:'700',color:'var(--odoo-red)'}}>{l.id}</span></td>
                  <td><strong style={{fontSize:'12px'}}>{l.company}</strong></td>
                  <td style={{fontSize:'12px'}}>{l.product}</td>
                  <td style={{fontFamily:'DM Mono,monospace',fontWeight:'700',fontSize:'12px'}}>{fmtFull(l.value)}</td>
                  <td><span style={{background:REASON_COLORS[l.reason]||'var(--odoo-gray)',color:'#fff',padding:'2px 8px',borderRadius:'10px',fontSize:'11px',fontWeight:'700'}}>{l.reason}</span></td>
                  <td style={{fontSize:'12px'}}>{l.competitor||'—'}</td>
                  <td style={{fontSize:'12px'}}>{l.owner}</td>
                  <td style={{fontSize:'12px'}}>{l.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
