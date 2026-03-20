import React, { useState } from 'react'
import { LEADS, OPPORTUNITIES, QUOTATIONS, ACTIVITIES, SALESREPS, CUSTOMERS, fmt, fmtFull } from './_crmData'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun']
const REVENUE = [3000000,3500000,4200000,3800000,4500000,4800000]
const LEAD_BY_SOURCE = [
  {source:'Website',leads:120,converted:30},{source:'Exhibition',leads:60,converted:18},
  {source:'Referral',leads:40,converted:20},{source:'Cold Calling',leads:80,converted:6},
  {source:'Email',leads:50,converted:12},{source:'Social Media',leads:30,converted:5},
]

export default function CRMReports() {
  const [activeReport, setActiveReport] = useState('pipeline')

  const REPORTS = [
    {key:'pipeline',      label:' Pipeline Report'},
    {key:'leads',         label:' Lead Analysis'},
    {key:'quotation',     label:' Quotation Report'},
    {key:'salesperson',   label:' Salesperson'},
    {key:'activity',      label:' Activity Report'},
    {key:'customer',      label:' Customer Report'},
    {key:'lost',          label:' Lost Analysis'},
    {key:'forecast',      label:' Forecast'},
    {key:'revenue',       label:' Revenue Trend'},
    {key:'ai',            label:' AI Insights'},
  ]

  const totalPipeline = OPPORTUNITIES.filter(o=>o.stage!=='Won'&&o.stage!=='Lost').reduce((s,o)=>s+o.value,0)
  const wonVal        = OPPORTUNITIES.filter(o=>o.stage==='Won').reduce((s,o)=>s+o.value,0)
  const winRate       = Math.round(OPPORTUNITIES.filter(o=>o.stage==='Won').length/OPPORTUNITIES.filter(o=>o.stage==='Won'||o.stage==='Lost').length*100)

  const Bar = ({v,max,color='var(--odoo-purple)',label,subLabel}) => (
    <div style={{marginBottom:'10px'}}>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',marginBottom:'3px'}}>
        <span>{label}</span><strong style={{color}}>{subLabel}</strong>
      </div>
      <div style={{background:'#F0EEEB',borderRadius:'4px',height:'8px'}}>
        <div style={{width:`${max>0?v/max*100:0}%`,height:'100%',borderRadius:'4px',background:color,transition:'width .3s'}}></div>
      </div>
    </div>
  )

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">CRM Reports <small>Analytics & Intelligence</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">Export</button>
          <button className="btn btn-s sd-bsm">Print</button>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'200px 1fr',gap:'16px'}}>
        {/* Sidebar */}
        <div>
          {REPORTS.map(r=>(
            <div key={r.key} onClick={()=>setActiveReport(r.key)}
              style={{padding:'8px 12px',borderRadius:'6px',cursor:'pointer',marginBottom:'4px',fontSize:'12px',fontWeight:'600',
                background:activeReport===r.key?'#EDE0EA':'transparent',
                color:activeReport===r.key?'var(--odoo-purple)':'var(--odoo-text)',
                borderLeft:activeReport===r.key?'3px solid var(--odoo-purple)':'3px solid transparent',
                transition:'all .15s'}}>
              {r.label}
            </div>
          ))}
        </div>

        {/* Report Content */}
        <div>
          {activeReport==='pipeline'&&(
            <div>
              <div style={{fontFamily:'Syne,sans-serif',fontWeight:'700',fontSize:'16px',marginBottom:'14px'}}>Opportunity Pipeline Report</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',marginBottom:'16px'}}>
                {[{l:'Total Pipeline',v:fmt(totalPipeline),c:'var(--odoo-purple)'},{l:'Won This Month',v:fmt(wonVal),c:'var(--odoo-green)'},{l:'Win Rate',v:winRate+'%',c:'var(--odoo-orange)'}].map(k=>(
                  <div key={k.l} style={{padding:'14px',background:'#fff',borderRadius:'8px',boxShadow:'0 1px 4px rgba(0,0,0,.08)',borderLeft:`4px solid ${k.c}`,textAlign:'center'}}>
                    <div style={{fontSize:'22px',fontWeight:'800',color:k.c,fontFamily:'Syne,sans-serif'}}>{k.v}</div>
                    <div style={{fontSize:'11px',color:'var(--odoo-gray)',fontWeight:'700',textTransform:'uppercase'}}>{k.l}</div>
                  </div>
                ))}
              </div>
              <table className="sd-table">
                <thead><tr><th>Stage</th><th>Count</th><th>Value</th><th>%</th></tr></thead>
                <tbody>
                  {['Requirement Understanding','Solution Discussion','Demo / Presentation','Proposal Submitted','Negotiation','Decision Pending'].map(s=>{
                    const opps = OPPORTUNITIES.filter(o=>o.stage===s)
                    const val  = opps.reduce((a,o)=>a+o.value,0)
                    const pct  = totalPipeline>0?Math.round(val/totalPipeline*100):0
                    return (
                      <tr key={s} className="sd-tr-hover">
                        <td><strong style={{fontSize:'12px'}}>{s}</strong></td>
                        <td style={{textAlign:'center'}}>{opps.length}</td>
                        <td style={{fontFamily:'DM Mono,monospace',fontWeight:'700',color:'var(--odoo-purple)'}}>{fmtFull(val)}</td>
                        <td>
                          <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                            <div style={{width:'60px',height:'5px',background:'#F0EEEB',borderRadius:'2px'}}>
                              <div style={{width:`${pct}%`,height:'100%',background:'var(--odoo-purple)',borderRadius:'2px'}}></div>
                            </div>
                            <span style={{fontSize:'12px'}}>{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeReport==='leads'&&(
            <div>
              <div style={{fontFamily:'Syne,sans-serif',fontWeight:'700',fontSize:'16px',marginBottom:'14px'}}>Lead Source Analysis</div>
              <table className="sd-table">
                <thead><tr><th>Lead Source</th><th>Total Leads</th><th>Converted</th><th>Conversion %</th><th>Performance</th></tr></thead>
                <tbody>
                  {LEAD_BY_SOURCE.map(l=>{
                    const pct = Math.round(l.converted/l.leads*100)
                    return (
                      <tr key={l.source} className="sd-tr-hover">
                        <td><strong style={{fontSize:'12px'}}>{l.source}</strong></td>
                        <td style={{textAlign:'center',fontWeight:'700'}}>{l.leads}</td>
                        <td style={{textAlign:'center',color:'var(--odoo-green)',fontWeight:'700'}}>{l.converted}</td>
                        <td style={{fontFamily:'DM Mono,monospace',fontWeight:'700',color:pct>=30?'var(--odoo-green)':pct>=15?'var(--odoo-orange)':'var(--odoo-red)'}}>{pct}%</td>
                        <td>
                          <div style={{width:'100px',height:'6px',background:'#F0EEEB',borderRadius:'3px'}}>
                            <div style={{width:`${pct*2}%`,height:'100%',borderRadius:'3px',background:pct>=30?'var(--odoo-green)':pct>=15?'var(--odoo-orange)':'var(--odoo-red)'}}></div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeReport==='salesperson'&&(
            <div>
              <div style={{fontFamily:'Syne,sans-serif',fontWeight:'700',fontSize:'16px',marginBottom:'14px'}}> Salesperson Performance</div>
              <table className="sd-table">
                <thead><tr><th>Salesperson</th><th>Target</th><th>Achieved</th><th>Achievement %</th><th>Deals Won</th><th>Pipeline</th></tr></thead>
                <tbody>
                  {SALESREPS.map(r=>{
                    const pct = Math.round(r.achieved/r.target*100)
                    const won = OPPORTUNITIES.filter(o=>o.owner===r.name&&o.stage==='Won').length
                    const pipe = OPPORTUNITIES.filter(o=>o.owner===r.name&&o.stage!=='Won'&&o.stage!=='Lost').reduce((s,o)=>s+o.value,0)
                    const clr = pct>=90?'var(--odoo-green)':pct>=70?'var(--odoo-orange)':'var(--odoo-red)'
                    return (
                      <tr key={r.id} className="sd-tr-hover">
                        <td><strong style={{fontSize:'12px'}}>{r.name}</strong></td>
                        <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px'}}>{fmtFull(r.target)}</td>
                        <td style={{fontFamily:'DM Mono,monospace',fontWeight:'700',fontSize:'12px'}}>{fmtFull(r.achieved)}</td>
                        <td><span style={{fontWeight:'800',color:clr}}>{pct}%</span></td>
                        <td style={{textAlign:'center',color:'var(--odoo-green)',fontWeight:'700'}}>{won}</td>
                        <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-orange)'}}>{fmt(pipe)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeReport==='activity'&&(
            <div>
              <div style={{fontFamily:'Syne,sans-serif',fontWeight:'700',fontSize:'16px',marginBottom:'14px'}}> Activity Report</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',marginBottom:'16px'}}>
                {['Call','Meeting','Demo','Email','Site Visit'].map(t=>{
                  const cnt = ACTIVITIES.filter(a=>a.type===t).length
                  return (
                    <div key={t} style={{padding:'12px',background:'#fff',borderRadius:'8px',boxShadow:'0 1px 4px rgba(0,0,0,.08)',textAlign:'center'}}>
                      <div style={{fontSize:'20px',fontWeight:'800',color:'var(--odoo-purple)'}}>{cnt}</div>
                      <div style={{fontSize:'11px',color:'var(--odoo-gray)',fontWeight:'700'}}>{t}s</div>
                    </div>
                  )
                })}
              </div>
              <table className="sd-table">
                <thead><tr><th>Rep</th><th>Calls</th><th>Meetings</th><th>Demos</th><th>Emails</th><th>Total</th></tr></thead>
                <tbody>
                  {SALESREPS.map(r=>{
                    const acts = ACTIVITIES.filter(a=>a.owner===r.name)
                    return (
                      <tr key={r.id}>
                        <td><strong style={{fontSize:'12px'}}>{r.name}</strong></td>
                        {['Call','Meeting','Demo','Email'].map(t=>(
                          <td key={t} style={{textAlign:'center',fontWeight:'700'}}>{acts.filter(a=>a.type===t).length||'—'}</td>
                        ))}
                        <td style={{textAlign:'center',fontWeight:'800',color:'var(--odoo-purple)'}}>{acts.length}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeReport==='customer'&&(
            <div>
              <div style={{fontFamily:'Syne,sans-serif',fontWeight:'700',fontSize:'16px',marginBottom:'14px'}}> Customer Revenue Report</div>
              {CUSTOMERS.sort((a,b)=>b.annualValue-a.annualValue).map(c=>(
                <Bar key={c.id} v={c.annualValue} max={CUSTOMERS[0].annualValue} label={c.name} subLabel={fmt(c.annualValue)+'/yr'} />
              ))}
            </div>
          )}

          {activeReport==='forecast'&&(
            <div>
              <div style={{fontFamily:'Syne,sans-serif',fontWeight:'700',fontSize:'16px',marginBottom:'14px'}}> Sales Forecast</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'12px',marginBottom:'16px'}}>
                {[{q:'Q1 2025',v:'₹1.05 Cr',t:'₹1.2 Cr',p:87},{q:'Q2 2025',v:'₹1.35 Cr',t:'₹1.5 Cr',p:90}].map(q=>(
                  <div key={q.q} style={{padding:'14px',background:'#fff',borderRadius:'8px',boxShadow:'0 1px 4px rgba(0,0,0,.08)'}}>
                    <div style={{fontWeight:'700',fontSize:'13px',marginBottom:'8px'}}>{q.q}</div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',marginBottom:'4px'}}>
                      <span>Forecast</span><strong style={{color:'var(--odoo-purple)'}}>{q.v}</strong>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',marginBottom:'8px'}}>
                      <span>Target</span><strong>{q.t}</strong>
                    </div>
                    <div style={{background:'#F0EEEB',borderRadius:'4px',height:'8px'}}>
                      <div style={{width:`${q.p}%`,height:'100%',borderRadius:'4px',background:'var(--odoo-purple)'}}></div>
                    </div>
                    <div style={{fontSize:'11px',color:'var(--odoo-gray)',marginTop:'4px',textAlign:'right'}}>{q.p}% of target</div>
                  </div>
                ))}
              </div>
              <table className="sd-table">
                <thead><tr><th>Opportunity</th><th>Value</th><th>Win %</th><th>Weighted Value</th><th>Expected Close</th></tr></thead>
                <tbody>
                  {OPPORTUNITIES.filter(o=>o.stage!=='Won'&&o.stage!=='Lost').map(o=>(
                    <tr key={o.id}>
                      <td><strong style={{fontSize:'12px'}}>{o.company}</strong><br/><span style={{fontSize:'10px',color:'var(--odoo-gray)'}}>{o.product}</span></td>
                      <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px'}}>{fmtFull(o.value)}</td>
                      <td style={{fontWeight:'700',color:o.winProb>=70?'var(--odoo-green)':o.winProb>=40?'var(--odoo-orange)':'var(--odoo-red)'}}>{o.winProb}%</td>
                      <td style={{fontFamily:'DM Mono,monospace',fontWeight:'700',color:'var(--odoo-purple)'}}>{fmtFull(Math.round(o.value*o.winProb/100))}</td>
                      <td style={{fontSize:'12px'}}>{o.closeDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeReport==='revenue'&&(
            <div>
              <div style={{fontFamily:'Syne,sans-serif',fontWeight:'700',fontSize:'16px',marginBottom:'14px'}}>Revenue Trend</div>
              <div style={{display:'flex',gap:'6px',alignItems:'flex-end',height:'120px',marginBottom:'8px'}}>
                {MONTHS.map((m,i)=>{
                  const maxR = Math.max(...REVENUE)
                  const h = REVENUE[i]/maxR * 100
                  return (
                    <div key={m} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'4px'}}>
                      <div style={{fontSize:'10px',color:'var(--odoo-purple)',fontWeight:'700'}}>{fmt(REVENUE[i])}</div>
                      <div style={{width:'100%',height:`${h}px`,background:'var(--odoo-purple)',borderRadius:'4px 4px 0 0',transition:'height .3s'}}></div>
                      <div style={{fontSize:'11px',color:'var(--odoo-gray)'}}>{m}</div>
                    </div>
                  )
                })}
              </div>
              <div style={{padding:'10px',background:'#F0EEEB',borderRadius:'6px',fontSize:'12px',display:'flex',justifyContent:'space-between'}}>
                <span>H1 Total</span><strong style={{fontFamily:'DM Mono,monospace',color:'var(--odoo-purple)'}}>{fmtFull(REVENUE.reduce((s,v)=>s+v,0))}</strong>
              </div>
            </div>
          )}

          {activeReport==='quotation'&&(
            <div>
              <div style={{fontFamily:'Syne,sans-serif',fontWeight:'700',fontSize:'16px',marginBottom:'14px'}}>Quotation Performance</div>
              <table className="sd-table">
                <thead><tr><th>Salesperson</th><th>Total Quotes</th><th>Won</th><th>Lost</th><th>Pending</th><th>Conversion %</th></tr></thead>
                <tbody>
                  {SALESREPS.map(r=>{
                    const myQ = QUOTATIONS.filter(q=>q.owner===r.name)
                    const won  = myQ.filter(q=>q.status==='Won').length
                    const lost = myQ.filter(q=>q.status==='Lost').length
                    const pend = myQ.filter(q=>q.status==='Sent'||q.status==='Negotiation').length
                    const pct  = myQ.length>0?Math.round(won/myQ.length*100):0
                    return (
                      <tr key={r.id}>
                        <td><strong style={{fontSize:'12px'}}>{r.name}</strong></td>
                        <td style={{textAlign:'center',fontWeight:'700'}}>{myQ.length}</td>
                        <td style={{textAlign:'center',color:'var(--odoo-green)',fontWeight:'700'}}>{won}</td>
                        <td style={{textAlign:'center',color:'var(--odoo-red)',fontWeight:'700'}}>{lost}</td>
                        <td style={{textAlign:'center',color:'var(--odoo-orange)',fontWeight:'700'}}>{pend}</td>
                        <td><span style={{fontWeight:'800',color:pct>=50?'var(--odoo-green)':pct>=30?'var(--odoo-orange)':'var(--odoo-red)'}}>{pct}%</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeReport==='lost'&&(
            <div>
              <div style={{fontFamily:'Syne,sans-serif',fontWeight:'700',fontSize:'16px',marginBottom:'14px'}}> Lost Deals Summary</div>
              {['Price Too High','Competitor Won','Delivery Timeline','Budget Cancelled','No Response'].map((r,i)=>{
                const pct=[40,30,20,7,3][i]
                return <Bar key={r} v={pct} max={100} label={r} subLabel={pct+'%'} color={['var(--odoo-red)','var(--odoo-orange)','#B7950B','var(--odoo-gray)','var(--odoo-blue)'][i]} />
              })}
            </div>
          )}

          {activeReport==='ai'&&(
            <div>
              <div style={{fontFamily:'Syne,sans-serif',fontWeight:'700',fontSize:'16px',marginBottom:'14px'}}> AI Sales Insights</div>
              <div style={{display:'grid',gap:'12px'}}>
                <div style={{background:'linear-gradient(135deg,var(--odoo-purple),#875A7B)',borderRadius:'10px',padding:'16px',color:'#fff'}}>
                  <div style={{fontWeight:'700',fontSize:'13px',marginBottom:'8px'}}>Win Probability Scores</div>
                  {OPPORTUNITIES.filter(o=>o.stage!=='Won'&&o.stage!=='Lost').map(o=>(
                    <div key={o.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:'1px solid rgba(255,255,255,.2)',fontSize:'12px'}}>
                      <span>{o.company}</span>
                      <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                        <div style={{width:'60px',height:'5px',background:'rgba(255,255,255,.3)',borderRadius:'2px'}}>
                          <div style={{width:`${o.winProb}%`,height:'100%',borderRadius:'2px',background:o.winProb>=70?'#4CAF50':'#FF9800'}}></div>
                        </div>
                        <strong>{o.winProb}%</strong>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="fi-panel">
                  <div className="fi-panel-hdr"><h3> AI Recommendations</h3></div>
                  <div className="fi-panel-body">
                    <div style={{display:'grid',gap:'8px'}}>
                      {[
                        {icon:'',title:'Hot Opportunity',desc:'Star Fab Works — ₹12L deal. 60% win prob. Competitor detected. Revise pricing.'},
                        {icon:'',title:'Quick Win',desc:'Meenakshi Pharma — No competitor. Demo done. Follow up NOW for proposal acceptance.'},
                        {icon:'',title:'At Risk',desc:'Velocity Auto — 5 days since last contact. Customer may be evaluating others.'},
                        {icon:'',title:'Upsell Opportunity',desc:'Sri Lakshmi Mills — Long-time customer. Offer AMC upgrade to Premium plan.'},
                      ].map(item=>(
                        <div key={item.title} style={{padding:'10px',background:'#F8F9FA',borderRadius:'6px',display:'flex',gap:'10px'}}>
                          <div style={{fontSize:'20px'}}>{item.icon}</div>
                          <div>
                            <div style={{fontWeight:'700',fontSize:'12px',marginBottom:'2px'}}>{item.title}</div>
                            <div style={{fontSize:'12px',color:'var(--odoo-gray)'}}>{item.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
