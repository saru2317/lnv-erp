import React, { useState } from 'react'

const PIPELINE = [
  { stage:'Lead',        count:48, value:9600000,  conv:100 },
  { stage:'Qualified',   count:32, value:7040000,  conv:67  },
  { stage:'Proposal',    count:21, value:5040000,  conv:66  },
  { stage:'Negotiation', count:14, value:3640000,  conv:67  },
  { stage:'Won',         count:9,  value:2340000,  conv:64  },
]

const MONTHLY = [
  { m:'Oct', leads:18, qualified:11, proposals:8, won:5, lostDeals:3, revenue:1840000 },
  { m:'Nov', leads:22, qualified:14, proposals:10,won:6, lostDeals:4, revenue:2160000 },
  { m:'Dec', leads:16, qualified:10, proposals:7, won:4, lostDeals:3, revenue:1440000 },
  { m:'Jan', leads:25, qualified:16, proposals:11,won:7, lostDeals:4, revenue:2520000 },
  { m:'Feb', leads:20, qualified:13, proposals:9, won:5, lostDeals:4, revenue:1800000 },
  { m:'Mar', leads:28, qualified:18, proposals:12,won:8, lostDeals:4, revenue:2880000 },
]

const TOP_SOURCES = [
  { src:'Referral',       leads:42, won:18, conv:43 },
  { src:'Trade Shows',    leads:28, won:8,  conv:29 },
  { src:'Cold Outreach',  leads:35, won:7,  conv:20 },
  { src:'Website',        leads:22, won:4,  conv:18 },
  { src:'Existing Base',  leads:18, won:10, conv:56 },
]

const fmtL = n => '₹' + (n/100000).toFixed(1) + 'L'

export default function CRMReport() {
  const [view, setView] = useState('pipeline')
  const totalPipeVal = PIPELINE[0].value
  const totalWon = MONTHLY.reduce((s, m) => s + m.won, 0)
  const totalLeads = MONTHLY.reduce((s, m) => s + m.leads, 0)
  const winRate = ((totalWon / totalLeads) * 100).toFixed(1)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">CRM Report <small>Pipeline · Conversions · Revenue</small></div>
        <div className="fi-lv-actions">
          <select className="fi-filter-select"><option>FY 2025-26</option></select>
          <button className="btn btn-s sd-bsm">Export</button>
        </div>
      </div>

      <div className="fi-kpi-grid" style={{ gridTemplateColumns:'repeat(4,1fr)', marginBottom:16 }}>
        {[
          { cls:'purple', l:'Pipeline Value',   v:fmtL(totalPipeVal),   s:'Total open pipeline'  },
          { cls:'green',  l:'Deals Won (FY)',   v:totalWon,             s:'Closed this year'     },
          { cls:'blue',   l:'Win Rate',          v:winRate+'%',          s:'Lead to closure'      },
          { cls:'orange', l:'Active Leads',      v:PIPELINE[0].count,   s:'Currently tracked'    },
        ].map(k => (
          <div key={k.l} className={`fi-kpi-card ${k.cls}`}>
            <div className="fi-kpi-label">{k.l}</div>
            <div className="fi-kpi-value">{k.v}</div>
            <div className="fi-kpi-sub">{k.s}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:14 }}>
        {[['pipeline',' Sales Pipeline'],['monthly',' Monthly Trend'],['source',' Lead Sources']].map(([k, l]) => (
          <button key={k} onClick={() => setView(k)}
            style={{ padding:'6px 16px', borderRadius:20, fontSize:12, fontWeight:600,
              cursor:'pointer', border:'1px solid var(--odoo-border)',
              background: view===k ? 'var(--odoo-purple)' : '#fff',
              color: view===k ? '#fff' : 'var(--odoo-gray)' }}>
            {l}
          </button>
        ))}
      </div>

      {view === 'pipeline' && (
        <div style={{ background:'#fff', borderRadius:8, border:'1px solid var(--odoo-border)',
          padding:20, boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
          <h4 style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, marginBottom:16 }}>
             Sales Pipeline Funnel
          </h4>
          {PIPELINE.map((p, i) => {
            const w = (p.count / PIPELINE[0].count) * 100
            const colors = ['#714B67','#875A7B','#9B6E8F','#AF82A3','#C396B7']
            return (
              <div key={p.stage} style={{ marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:12, fontWeight:700 }}>{p.stage}</span>
                  <div style={{ display:'flex', gap:16, fontSize:12 }}>
                    <span style={{ fontFamily:'DM Mono,monospace', fontWeight:700, color:'var(--odoo-purple)' }}>
                      {p.count} deals
                    </span>
                    <span style={{ fontFamily:'DM Mono,monospace', color:'var(--odoo-gray)' }}>
                      {fmtL(p.value)}
                    </span>
                    {i > 0 && (
                      <span style={{ color:'var(--odoo-green)', fontWeight:700 }}>
                        {p.conv}% conv.
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ height:28, background:'var(--odoo-border)', borderRadius:4, overflow:'hidden' }}>
                  <div style={{ height:'100%', borderRadius:4, background:colors[i],
                    width: w + '%', display:'flex', alignItems:'center', paddingLeft:10,
                    transition:'width .5s' }}>
                    <span style={{ color:'#fff', fontSize:10, fontWeight:700, whiteSpace:'nowrap' }}>
                      {w.toFixed(0)}% of total
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {view === 'monthly' && (
        <table className="fi-data-table">
          <thead>
            <tr><th>Month</th><th>Leads</th><th>Qualified</th><th>Proposals</th>
              <th>Won</th><th>Lost</th><th>Win Rate</th><th>Revenue</th></tr>
          </thead>
          <tbody>
            {MONTHLY.map((m, i) => {
              const wr = ((m.won / m.leads) * 100).toFixed(0)
              return (
                <tr key={m.m} style={{ background: i===MONTHLY.length-1?'#EDE0EA':'', fontWeight: i===MONTHLY.length-1?700:400 }}>
                  <td style={{ fontWeight:600 }}>{m.m}</td>
                  <td style={{ textAlign:'center' }}>{m.leads}</td>
                  <td style={{ textAlign:'center', color:'var(--odoo-blue)' }}>{m.qualified}</td>
                  <td style={{ textAlign:'center' }}>{m.proposals}</td>
                  <td style={{ textAlign:'center', color:'var(--odoo-green)', fontWeight:700 }}>{m.won}</td>
                  <td style={{ textAlign:'center', color:'var(--odoo-red)' }}>{m.lostDeals}</td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ width:60, height:5, background:'var(--odoo-border)', borderRadius:3 }}>
                        <div style={{ height:'100%', borderRadius:3, background:'var(--odoo-green)', width: wr+'%' }} />
                      </div>
                      <span style={{ fontSize:11, fontWeight:600 }}>{wr}%</span>
                    </div>
                  </td>
                  <td style={{ fontFamily:'DM Mono,monospace', fontWeight:700, color:'var(--odoo-purple)' }}>{fmtL(m.revenue)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {view === 'source' && (
        <table className="fi-data-table">
          <thead><tr><th>Lead Source</th><th>Leads</th><th>Deals Won</th><th>Conversion %</th><th>Performance</th></tr></thead>
          <tbody>
            {TOP_SOURCES.sort((a, b) => b.conv - a.conv).map(s => (
              <tr key={s.src}>
                <td style={{ fontWeight:700 }}>{s.src}</td>
                <td style={{ textAlign:'center' }}>{s.leads}</td>
                <td style={{ textAlign:'center', fontWeight:700, color:'var(--odoo-green)' }}>{s.won}</td>
                <td style={{ textAlign:'center', fontWeight:700,
                  color: s.conv > 40 ? 'var(--odoo-green)' : s.conv > 25 ? 'var(--odoo-orange)' : 'var(--odoo-red)' }}>
                  {s.conv}%
                </td>
                <td style={{ minWidth:150 }}>
                  <div style={{ height:8, background:'var(--odoo-border)', borderRadius:4 }}>
                    <div style={{ height:'100%', borderRadius:4,
                      background: s.conv > 40 ? 'var(--odoo-green)' : s.conv > 25 ? 'var(--odoo-orange)' : 'var(--odoo-red)',
                      width: s.conv + '%' }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
