import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CUSTOMERS, QUOTATIONS, OPPORTUNITIES, CONTACTS, fmtFull, fmt } from './_crmData'

export default function CustomerView() {
  const nav = useNavigate()
  const { id } = useParams()
  const cust = CUSTOMERS.find(c=>c.id===id) || CUSTOMERS[0]
  const [tab, setTab] = useState('overview')

  const oppHistory = OPPORTUNITIES.filter(o=>o.company===cust.name)
  const qtHistory  = QUOTATIONS.filter(q=>q.company===cust.name)
  const contacts   = CONTACTS.filter(c=>c.company===cust.name)

  const wonVal  = oppHistory.filter(o=>o.stage==='Won').reduce((s,o)=>s+o.value,0)
  const lostVal = oppHistory.filter(o=>o.stage==='Lost').reduce((s,o)=>s+o.value,0)

  const TABS = ['overview','opportunities','quotations','contacts']

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          <button style={{background:'none',border:'none',cursor:'pointer',color:'var(--odoo-purple)',marginRight:'6px'}} onClick={()=>nav('/crm/customers')}>← Customers</button>
          {cust.name}
        </div>
        <div className="fi-lv-actions">
          <span className={cust.status==='Active'?'crm-stage-won':'crm-badge-notq'} style={{padding:'4px 12px',fontSize:'12px'}}>{cust.status}</span>
          <button className="btn btn-p btn-s" onClick={()=>nav('/crm/leads/new')}>+ New Lead</button>
          <button className="btn btn-s sd-bsm" onClick={()=>nav('/crm/quotations/new')}>📋 New Quotation</button>
        </div>
      </div>

      {/* Profile Header */}
      <div className="fi-panel" style={{marginBottom:'14px'}}>
        <div className="fi-panel-body">
          <div style={{display:'flex',gap:'16px',alignItems:'center'}}>
            <div style={{width:'60px',height:'60px',borderRadius:'50%',background:'var(--odoo-purple)',
              display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'20px',fontWeight:'800',flexShrink:0}}>
              {cust.name.split(' ').map(w=>w[0]).slice(0,2).join('')}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:'20px',fontWeight:'800',fontFamily:'Syne,sans-serif',color:'var(--odoo-purple)'}}>{cust.name}</div>
              <div style={{fontSize:'13px',color:'var(--odoo-gray)'}}>🏭 {cust.industry} · 📍 {cust.city}, {cust.state} · Customer since {cust.since}</div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px',textAlign:'center'}}>
              {[['Annual Value',fmt(cust.annualValue),'var(--odoo-purple)'],['Won Deals',fmt(wonVal),'var(--odoo-green)'],['Lost Deals',fmt(lostVal),'var(--odoo-red)']].map(([l,v,c])=>(
                <div key={l}>
                  <div style={{fontSize:'18px',fontWeight:'800',fontFamily:'Syne,sans-serif',color:c}}>{v}</div>
                  <div style={{fontSize:'10px',color:'var(--odoo-gray)',fontWeight:'700',textTransform:'uppercase'}}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:'4px',marginBottom:'14px',borderBottom:'2px solid var(--odoo-border)'}}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            style={{padding:'8px 16px',border:'none',borderBottom:tab===t?'2px solid var(--odoo-purple)':'2px solid transparent',
              background:'none',color:tab===t?'var(--odoo-purple)':'var(--odoo-gray)',
              fontWeight:tab===t?'700':'400',textTransform:'capitalize',cursor:'pointer',fontSize:'13px',marginBottom:'-2px'}}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {tab==='overview'&&(
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'16px'}}>
          <div className="fi-panel">
            <div className="fi-panel-hdr"><h3>🏢 Company Details</h3></div>
            <div className="fi-panel-body">
              <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'10px'}}>
                {[['Customer ID',cust.id],['Industry',cust.industry],['City',cust.city],['State',cust.state],
                  ['Primary Contact',cust.contact],['Phone',cust.phone],['Email',cust.email],['Customer Since',cust.since]
                ].map(([k,v])=>(
                  <div key={k} style={{padding:'8px 10px',background:'#F8F9FA',borderRadius:'6px'}}>
                    <div style={{fontSize:'10px',color:'var(--odoo-gray)',fontWeight:'700',textTransform:'uppercase',marginBottom:'3px'}}>{k}</div>
                    <div style={{fontSize:'13px',fontWeight:'600'}}>{v||'—'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div>
            <div className="fi-panel" style={{marginBottom:'14px'}}>
              <div className="fi-panel-hdr"><h3>📊 Purchase Pattern</h3></div>
              <div className="fi-panel-body">
                {['Jan','Feb','Mar'].map((m,i)=>{
                  const val=[320000,450000,280000][i]
                  return (
                    <div key={m} style={{marginBottom:'8px'}}>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',marginBottom:'2px'}}>
                        <span>{m} 2025</span><strong style={{color:'var(--odoo-purple)'}}>{fmtFull(val)}</strong>
                      </div>
                      <div style={{background:'#F0EEEB',borderRadius:'3px',height:'6px'}}>
                        <div style={{width:`${val/500000*100}%`,height:'100%',borderRadius:'3px',background:'var(--odoo-purple)'}}></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="fi-panel">
              <div className="fi-panel-hdr"><h3>🤖 AI Insights</h3></div>
              <div className="fi-panel-body">
                <div style={{background:'#EDE0EA',borderRadius:'6px',padding:'10px',fontSize:'12px',lineHeight:'1.7'}}>
                  <div style={{fontWeight:'700',color:'var(--odoo-purple)',marginBottom:'4px'}}>Customer Health: <strong style={{color:'var(--odoo-green)'}}>Good</strong></div>
                  <div>Retention probability: <strong>85%</strong></div>
                  <div>Next purchase prediction: <strong>Apr 2025</strong></div>
                  <div style={{marginTop:'4px',color:'var(--odoo-orange)'}}>💡 Upsell opportunity: Annual maintenance contract</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab==='opportunities'&&(
        <div className="sd-table-wrap">
          <table className="sd-table">
            <thead><tr><th>Opp ID</th><th>Product</th><th>Value</th><th>Stage</th><th>Owner</th><th>Close Date</th></tr></thead>
            <tbody>
              {oppHistory.length===0
                ? <tr><td colSpan={6} style={{textAlign:'center',padding:'32px',color:'var(--odoo-gray)'}}>No opportunities</td></tr>
                : oppHistory.map(o=>(
                  <tr key={o.id} className="sd-tr-hover" onClick={()=>nav(`/crm/opportunities/${o.id}`)}>
                    <td><span style={{fontFamily:'DM Mono,monospace',fontWeight:'700',color:'var(--odoo-purple)'}}>{o.id}</span></td>
                    <td><strong style={{fontSize:'12px'}}>{o.product}</strong></td>
                    <td style={{fontFamily:'DM Mono,monospace',fontWeight:'700'}}>{fmt(o.value)}</td>
                    <td><span className={`crm-badge ${o.stage==='Won'?'crm-stage-won':o.stage==='Lost'?'crm-stage-lost':'crm-badge-contacted'}`}>{o.stage}</span></td>
                    <td>{o.owner}</td>
                    <td style={{fontSize:'12px'}}>{o.closeDate}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}

      {tab==='quotations'&&(
        <div className="sd-table-wrap">
          <table className="sd-table">
            <thead><tr><th>Quotation</th><th>Product</th><th>Amount</th><th>Discount</th><th>Final</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {qtHistory.length===0
                ? <tr><td colSpan={7} style={{textAlign:'center',padding:'32px',color:'var(--odoo-gray)'}}>No quotations</td></tr>
                : qtHistory.map(q=>(
                  <tr key={q.id} className="sd-tr-hover" onClick={()=>nav(`/crm/quotations/${q.id}`)}>
                    <td><span style={{fontFamily:'DM Mono,monospace',fontWeight:'700',color:'var(--odoo-purple)'}}>{q.id}</span></td>
                    <td><strong style={{fontSize:'12px'}}>{q.product}</strong></td>
                    <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px'}}>{fmtFull(q.amount)}</td>
                    <td style={{color:'var(--odoo-orange)',fontSize:'12px'}}>{q.discount}%</td>
                    <td style={{fontFamily:'DM Mono,monospace',fontWeight:'700',fontSize:'12px'}}>{fmtFull(q.finalAmount)}</td>
                    <td><span className={`crm-badge ${q.status==='Won'?'crm-stage-won':q.status==='Lost'?'crm-stage-lost':'crm-badge-contacted'}`}>{q.status}</span></td>
                    <td style={{fontSize:'12px'}}>{q.date}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}

      {tab==='contacts'&&(
        <div className="sd-table-wrap">
          <table className="sd-table">
            <thead><tr><th>Name</th><th>Designation</th><th>Phone</th><th>Email</th><th>Last Contact</th><th>Status</th></tr></thead>
            <tbody>
              {contacts.length===0
                ? <tr><td colSpan={6} style={{textAlign:'center',padding:'32px',color:'var(--odoo-gray)'}}>No contacts</td></tr>
                : contacts.map(c=>(
                  <tr key={c.id} className="sd-tr-hover">
                    <td><strong style={{fontSize:'12px'}}>{c.name}</strong></td>
                    <td style={{fontSize:'12px'}}>{c.designation}</td>
                    <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px'}}>{c.phone}</td>
                    <td style={{fontSize:'12px'}}>{c.email}</td>
                    <td style={{fontSize:'12px'}}>{c.lastContact}</td>
                    <td><span className={c.status==='Active'?'crm-stage-won':'crm-badge-notq'}>{c.status}</span></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
