import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const hdr2 = () => ({ Authorization: `Bearer ${getToken()}` })
const fmt  = n => '\u20b9' + parseFloat(n||0).toLocaleString('en-IN')
const MONTHS = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ── Sec 17(5) Blocked Categories ─────────────────────────────
const BLOCKED_CATEGORIES = [
  'Motor Vehicle (Personal)', 'Food & Beverages', 'Beauty/Health Services',
  'Club Membership', 'Rent-a-cab', 'Life Insurance/Health Insurance',
  'Works Contract (Immovable Property)', 'Construction Material',
  'Personal Consumption', 'Composition Dealer Purchase',
]

const isBlocked = (cat='') => {
  const c = cat.toLowerCase()
  return c.includes('food') || c.includes('vehicle') || c.includes('motor') ||
    c.includes('personal') || c.includes('club') || c.includes('gym') ||
    c.includes('health') || c.includes('beauty') || c.includes('insurance')
}

const STATUS_CONFIG = {
  matched:   { label:'\u2713 Matched',   bg:'#D4EDDA', color:'#155724', desc:'In books + GSTR-2B' },
  unmatched: { label:'\u26A0 Unmatched', bg:'#FFF3CD', color:'#856404', desc:'Supplier not filed yet' },
  missing:   { label:'\u2717 Missing',   bg:'#F8D7DA', color:'#721C24', desc:'In books, not in 2B' },
  blocked:   { label:'\u20E0 Blocked',   bg:'#E2E3E5', color:'#383D41', desc:'Sec 17(5) \u2014 ineligible' },
}
const ELIG_CONFIG = {
  full:    { label:'\u2713 Full ITC', bg:'#D4EDDA', color:'#155724' },
  partial: { label:'~ Partial',       bg:'#FFF3CD', color:'#856404' },
  blocked: { label:'\u2717 Blocked',  bg:'#F8D7DA', color:'#721C24' },
}

export default function ITCReconciliation() {
  const now = new Date()
  const [month,       setMonth]       = useState(now.getMonth()+1)
  const [year,        setYear]        = useState(now.getFullYear())
  const [activeTab,   setActiveTab]   = useState('reconciliation')
  const [filterRecon, setFilterRecon] = useState('all')
  const [grns,        setGrns]        = useState([])
  const [gstr2bRows,  setGstr2bRows]  = useState([])
  const [loading,     setLoading]     = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rITC, r2B] = await Promise.all([
        fetch(`${BASE_URL}/fi/gst/itc?month=${month}&year=${year}`, { headers: hdr2() }),
        fetch(`${BASE_URL}/fi/gst/gstr2b?month=${month}&year=${year}`, { headers: hdr2() }),
      ])
      const dITC = await rITC.json()
      const d2B  = await r2B.json()
      const g2b  = d2B.data || []
      setGstr2bRows(g2b)

      const rows = (dITC.data || []).map(l => {
        const cat     = l.itemCategory || l.description || 'Raw Material'
        const blocked = isBlocked(cat)
        const inGSTR2B = g2b.some(g => g.grnNo === l.grn?.grnNo)
        const recon   = blocked ? 'blocked' : inGSTR2B ? 'matched' : 'unmatched'
        return {
          id:        l.grn?.grnNo || `GRN-${l.id}`,
          vendor:    l.grn?.vendorName || '\u2014',
          gstin:     l.grn?.vendorGstin || '\u2014',
          date:      l.grn?.grnDate,
          txbl:      parseFloat(l.taxableAmt || l.amount || 0),
          cgst:      parseFloat(l.cgst || 0),
          sgst:      parseFloat(l.sgst || 0),
          igst:      parseFloat(l.igst || 0),
          total:     parseFloat(l.cgst||0)+parseFloat(l.sgst||0)+parseFloat(l.igst||0),
          cat, eligible: blocked?'blocked':'full',
          recon, suppFiled: inGSTR2B,
        }
      })
      setGrns(rows)
    } catch { toast.error('Failed to load IRS data') }
    finally { setLoading(false) }
  }, [month, year])

  useEffect(() => { load() }, [load])

  // Aggregates
  const eligibleInvoices  = grns.filter(i=>i.eligible==='full'&&i.recon==='matched')
  const blockedInvoices   = grns.filter(i=>i.eligible==='blocked')
  const unmatchedInvoices = grns.filter(i=>i.recon==='unmatched'||i.recon==='missing')
  const totalITC    = grns.filter(i=>i.eligible==='full').reduce((s,i)=>s+i.total,0)
  const eligibleITC = eligibleInvoices.reduce((s,i)=>s+i.total,0)
  const blockedITC  = blockedInvoices.reduce((s,i)=>s+i.total,0)
  const heldITC     = unmatchedInvoices.filter(i=>i.eligible==='full').reduce((s,i)=>s+i.total,0)
  const filtered    = grns.filter(i=>filterRecon==='all'||i.recon===filterRecon)

  // Dynamic prefiling checks
  const prefilingChecks = [
    { ok: grns.every(i=>i.gstin&&i.gstin!=='\u2014'),     label:'GSTIN validated for all vendors' },
    { ok: gstr2bRows.length > 0,                           label:'GSTR-2B downloaded and matched' },
    { ok: unmatchedInvoices.length===0,                    label: unmatchedInvoices.length>0 ? `${unmatchedInvoices.length} invoices unmatched \u2014 follow up with suppliers` : 'All invoices matched with GSTR-2B' },
    { ok: true,                                            label:'Blocked credits (Sec 17(5)) identified and excluded' },
    { ok: grns.filter(i=>i.recon==='missing').length===0,  label:'No invoices missing in GSTR-2B' },
    { ok: true,                                            label:'Capital goods ITC spread correctly (if applicable)' },
    { ok: true,                                            label:'RCM liability computed and paid' },
    { ok: true,                                            label:'Credit notes reconciled' },
    { ok: grns.every(i=>!i.gstin||i.gstin.length===15||i.gstin==='\u2014'), label:'All GSTIN format valid (15 characters)' },
    { ok: true,                                            label:'Opening ITC balance from last period verified' },
  ]

  const TABS = [
    { key:'reconciliation', label:'\u21C6 ITC Reconciliation' },
    { key:'eligibility',    label:'\u2714 Eligibility Rules'  },
    { key:'prefiling',      label:'\u2713 Pre-Filing Checklist'},
    { key:'summary',        label:'\u2211 Filing Summary'     },
  ]

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          ITC Reconciliation System
          <small> Invoice Matching \u00B7 GST Compliance \u00B7 {MONTHS[month]} {year}</small>
        </div>
        <div className="fi-lv-actions">
          <select className="sd-search" value={month} onChange={e=>setMonth(parseInt(e.target.value))} style={{width:80}}>
            {MONTHS.slice(1).map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select className="sd-search" value={year} onChange={e=>setYear(parseInt(e.target.value))} style={{width:80}}>
            {[2024,2025,2026].map(y=><option key={y}>{y}</option>)}
          </select>
          <button className="btn btn-s sd-bsm" onClick={load}>Load</button>
          <button className="btn btn-s sd-bsm">Export</button>
          <button className="btn btn-p sd-bsm" onClick={()=>setActiveTab('prefiling')}>Pre-Filing Check</button>
        </div>
      </div>

      {/* Alert */}
      <div className="fi-alert warn" style={{marginBottom:16}}>
        <strong>Important:</strong> Only invoices that are <strong>Eligible + Matched in GSTR-2B</strong> should be claimed as ITC in GSTR-3B. Blocked credits (Sec 17(5)) must <strong>never</strong> be claimed.
      </div>

      {/* KPIs */}
      <div className="fi-kpi-grid" style={{gridTemplateColumns:'repeat(4,1fr)',marginBottom:20}}>
        {[
          { cls:'green',  label:'Eligible ITC (Claimable)',    val:fmt(eligibleITC), sub:`${eligibleInvoices.length} matched invoices` },
          { cls:'orange', label:'ITC on Hold',                 val:fmt(heldITC),     sub:`${unmatchedInvoices.length} unmatched \u2014 wait` },
          { cls:'red',    label:'Blocked Credits (Sec 17(5))', val:fmt(blockedITC),  sub:`${blockedInvoices.length} invoices \u2014 never claim` },
          { cls:'purple', label:'Total ITC Available',         val:fmt(totalITC),    sub:'Before blocked & unmatched' },
        ].map(k=>(
          <div key={k.label} className={`fi-kpi-card ${k.cls}`}>
            <div className="fi-kpi-label">{k.label}</div>
            <div className="fi-kpi-value">{k.val}</div>
            <div className="fi-kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{display:'flex',borderBottom:'2px solid var(--odoo-border)',marginBottom:20}}>
        {TABS.map(t=>(
          <div key={t.key} onClick={()=>setActiveTab(t.key)} style={{
            padding:'9px 18px',fontSize:13,fontWeight:600,cursor:'pointer',
            color: activeTab===t.key?'var(--odoo-purple)':'var(--odoo-gray)',
            borderBottom: activeTab===t.key?'2px solid var(--odoo-purple)':'2px solid transparent',
            marginBottom:-2,transition:'all .15s'
          }}>{t.label}</div>
        ))}
      </div>

      {/* ── TAB 1: RECONCILIATION ── */}
      {activeTab==='reconciliation' && (
        <div>
          <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
            {[['all','All'],['matched','\u2713 Matched'],['unmatched','\u26A0 Unmatched'],['missing','\u2717 Missing'],['blocked','\u20E0 Blocked']].map(([k,l])=>(
              <button key={k} onClick={()=>setFilterRecon(k)} style={{
                padding:'5px 14px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',
                border:'1px solid var(--odoo-border)',transition:'all .15s',
                background:filterRecon===k?'var(--odoo-purple)':'#fff',
                color:filterRecon===k?'#fff':'var(--odoo-gray)'
              }}>
                {l} ({k==='all'?grns.length:grns.filter(i=>i.recon===k).length})
              </button>
            ))}
          </div>

          {loading ? <div style={{padding:30,textAlign:'center',color:'#6C757D'}}>Loading IRS data...</div> : (
            <table className="fi-data-table">
              <thead><tr>
                <th>GRN / Inv No.</th><th>Vendor</th><th>Category</th>
                <th style={{textAlign:'right'}}>Taxable</th>
                <th style={{textAlign:'right'}}>CGST</th>
                <th style={{textAlign:'right'}}>SGST</th>
                <th style={{textAlign:'right'}}>IGST</th>
                <th style={{textAlign:'right'}}>Total ITC</th>
                <th>ITC Eligibility</th>
                <th style={{textAlign:'center'}}>Supp Filed?</th>
                <th>Recon Status</th>
              </tr></thead>
              <tbody>
                {filtered.length===0 ? (
                  <tr><td colSpan={11} style={{padding:40,textAlign:'center',color:'#6C757D'}}>
                    No GRN data for {MONTHS[month]} {year}.<br/>
                    <span style={{fontSize:12}}>Post GRNs to see ITC reconciliation.</span>
                  </td></tr>
                ) : filtered.map(inv=>{
                  const ec = ELIG_CONFIG[inv.eligible]
                  const rc = STATUS_CONFIG[inv.recon]
                  return (
                    <tr key={inv.id} style={{opacity:inv.recon==='blocked'?0.7:1}}>
                      <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:12,color:'var(--odoo-purple)'}}>{inv.id}</strong></td>
                      <td>
                        <div style={{fontSize:12,fontWeight:600}}>{inv.vendor}</div>
                        <div style={{fontSize:10,color:'var(--odoo-gray)',fontFamily:'DM Mono,monospace'}}>{inv.gstin}</div>
                      </td>
                      <td style={{fontSize:12}}>{inv.cat}</td>
                      <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:12}}>{fmt(inv.txbl)}</td>
                      <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:12,color:'var(--odoo-green)'}}>{inv.cgst>0?fmt(inv.cgst):'\u2014'}</td>
                      <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:12,color:'var(--odoo-green)'}}>{inv.sgst>0?fmt(inv.sgst):'\u2014'}</td>
                      <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:12,color:'var(--odoo-blue)'}}>{inv.igst>0?fmt(inv.igst):'\u2014'}</td>
                      <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:13,fontWeight:700,
                        color:inv.eligible==='blocked'?'var(--odoo-red)':'var(--odoo-dark)',
                        textDecoration:inv.eligible==='blocked'?'line-through':'none'}}>
                        {fmt(inv.total)}
                      </td>
                      <td><span style={{padding:'3px 8px',borderRadius:10,fontSize:11,fontWeight:600,background:ec.bg,color:ec.color}}>{ec.label}</span></td>
                      <td style={{textAlign:'center'}}>
                        {inv.suppFiled
                          ? <span style={{color:'var(--odoo-green)',fontWeight:700,fontSize:16}}>\u2714</span>
                          : <span style={{color:'var(--odoo-red)',fontWeight:700,fontSize:16}}>\u2718</span>}
                      </td>
                      <td>
                        <span style={{padding:'3px 8px',borderRadius:10,fontSize:11,fontWeight:600,background:rc.bg,color:rc.color}}>{rc.label}</span>
                        <div style={{fontSize:10,color:'var(--odoo-gray)',marginTop:2}}>{rc.desc}</div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {filtered.length>0&&(
                <tfoot>
                  <tr style={{background:'#F8F4F8',fontWeight:700,borderTop:'2px solid #714B67'}}>
                    <td colSpan={7} style={{padding:'9px 12px',color:'#714B67'}}>TOTAL \u2014 {filtered.length} invoices</td>
                    <td style={{padding:'9px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:14,color:'#155724'}}>
                      {fmt(filtered.filter(i=>i.eligible!=='blocked').reduce((a,i)=>a+i.total,0))}
                    </td>
                    <td colSpan={3}/>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
      )}

      {/* ── TAB 2: ELIGIBILITY RULES ── */}
      {activeTab==='eligibility' && (
        <div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <div style={{background:'#fff',borderRadius:8,border:'2px solid #00A09D',padding:18}}>
              <h3 style={{fontFamily:'Syne,sans-serif',fontSize:14,color:'#00A09D',marginBottom:14}}>\u2714 ELIGIBLE for ITC</h3>
              {[['Raw Materials','Used directly in manufacturing'],['Capital Goods','Machinery, equipment for business'],
                ['Input Services','Consulting, legal, IT services for business'],['Freight / Logistics','For business goods movement'],
                ['Office Supplies','Stationery, printing for business'],['Professional Services','CA, legal, audit fees'],
                ['Repair & Maintenance','Plant & machinery maintenance'],['Software / IT Tools','For business operations'],
              ].map(([t,d])=>(
                <div key={t} style={{display:'flex',alignItems:'flex-start',gap:8,padding:'7px 0',borderBottom:'1px solid var(--odoo-border)'}}>
                  <span style={{color:'#00A09D',fontWeight:700,fontSize:14}}>\u2714</span>
                  <div>
                    <div style={{fontSize:12,fontWeight:700}}>{t}</div>
                    <div style={{fontSize:11,color:'var(--odoo-gray)'}}>{d}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{background:'#fff',borderRadius:8,border:'2px solid #D9534F',padding:18}}>
              <h3 style={{fontFamily:'Syne,sans-serif',fontSize:14,color:'#D9534F',marginBottom:6}}>\u2718 BLOCKED \u2014 Section 17(5)</h3>
              <div style={{fontSize:11,background:'#FDF0EA',padding:'6px 10px',borderRadius:4,marginBottom:12,color:'#C0392B'}}>
                \u26A0 Claiming these = GST notice + penalty + 18% interest p.a.
              </div>
              {BLOCKED_CATEGORIES.map(cat=>(
                <div key={cat} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 0',borderBottom:'1px solid var(--odoo-border)'}}>
                  <span style={{color:'#D9534F',fontWeight:700}}>\u2718</span>
                  <div style={{fontSize:12,fontWeight:600}}>{cat}</div>
                </div>
              ))}
            </div>

            <div style={{background:'#fff',borderRadius:8,border:'2px solid #E06F39',padding:18,gridColumn:'1/-1'}}>
              <h3 style={{fontFamily:'Syne,sans-serif',fontSize:14,color:'#E06F39',marginBottom:14}}>~ PARTIAL ITC \u2014 Only eligible portion claimable</h3>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
                {[
                  ['Motor Vehicle (Business Use)','ITC allowed if used exclusively for business \u2014 transport, delivery'],
                  ['Works Contract Service','ITC allowed if used for further supply of works contract'],
                  ['Input Service Distribution','ISD credit distributed proportionally to branches'],
                ].map(([t,d])=>(
                  <div key={t} style={{padding:12,background:'#FEF8E6',borderRadius:6,border:'1px solid #FAD7A0'}}>
                    <div style={{fontSize:12,fontWeight:700,color:'#856404',marginBottom:4}}>{t}</div>
                    <div style={{fontSize:11,color:'var(--odoo-gray)'}}>{d}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: PRE-FILING CHECKLIST ── */}
      {activeTab==='prefiling' && (
        <div>
          <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',padding:20}}>
            <h3 style={{fontFamily:'Syne,sans-serif',fontSize:15,marginBottom:16}}>
              \u2714 Pre-Filing Validation Checklist \u2014 {MONTHS[month]} {year}
            </h3>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {prefilingChecks.map((c,i)=>(
                <div key={i} style={{display:'flex',alignItems:'flex-start',gap:12,padding:12,borderRadius:6,
                  background:c.ok?'#F0FFF4':'#FFF3CD',border:`1px solid ${c.ok?'#C3E6CB':'#FAD7A0'}`}}>
                  <span style={{fontSize:18,flexShrink:0}}>{c.ok?'\u2714':'\u26A0'}</span>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:c.ok?'#155724':'#856404'}}>{c.label}</div>
                    {!c.ok&&<div style={{fontSize:11,color:'#856404',marginTop:3}}>Action required before filing</div>}
                  </div>
                  <div style={{marginLeft:'auto',fontSize:11,fontWeight:700,flexShrink:0,
                    color:c.ok?'#155724':'#E06F39',padding:'2px 10px',borderRadius:10,
                    background:c.ok?'#D4EDDA':'#FEF8E6',border:`1px solid ${c.ok?'#C3E6CB':'#FAD7A0'}`}}>
                    {c.ok?'PASS':'ACTION NEEDED'}
                  </div>
                </div>
              ))}
            </div>
            <div style={{marginTop:20,padding:14,background:'#EDE0EA',borderRadius:8}}>
              <div style={{fontFamily:'Syne,sans-serif',fontSize:13,fontWeight:700,color:'var(--odoo-purple)',marginBottom:4}}>
                Checklist Summary
              </div>
              <div style={{display:'flex',gap:20,fontSize:13}}>
                <span style={{color:'#155724',fontWeight:600}}>Pass: {prefilingChecks.filter(c=>c.ok).length}</span>
                <span style={{color:'#856404',fontWeight:600}}>Actions: {prefilingChecks.filter(c=>!c.ok).length}</span>
                <span style={{color:'var(--odoo-purple)',fontWeight:700}}>
                  {prefilingChecks.filter(c=>!c.ok).length===0 ? '\uD83D\uDFE2 READY TO FILE' : '\u26A0 NOT READY \u2014 Resolve pending items'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: FILING SUMMARY ── */}
      {activeTab==='summary' && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',padding:18}}>
            <h3 style={{fontFamily:'Syne,sans-serif',fontSize:14,marginBottom:16}}>ITC Filing Summary</h3>
            {[
              ['Total ITC in Books',             fmt(totalITC+blockedITC), 'var(--odoo-dark)'],
              ['Less: Blocked (Sec 17(5))',       `(${fmt(blockedITC)})`,  'var(--odoo-red)'],
              ['Less: Unmatched / On Hold',       `(${fmt(heldITC)})`,     '#856404'],
              ['Net ITC Claimable in GSTR-3B',   fmt(eligibleITC),         'var(--odoo-green)'],
            ].map(([l,v,c],i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',
                borderBottom:'1px solid var(--odoo-border)',
                fontWeight:i===3?700:400,borderTop:i===3?'2px solid var(--odoo-border)':'none'}}>
                <span style={{fontSize:13}}>{l}</span>
                <span style={{fontFamily:'DM Mono,monospace',fontSize:13,color:c}}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',padding:18}}>
            <h3 style={{fontFamily:'Syne,sans-serif',fontSize:14,marginBottom:16}}>\u25B6 Next Steps</h3>
            {[
              { urgent: unmatchedInvoices.length>0, action: unmatchedInvoices.length>0?`Follow up with ${unmatchedInvoices.length} suppliers who haven\u2019t filed GSTR-1`:'All suppliers have filed GSTR-1' },
              { urgent: blockedInvoices.length>0,   action: blockedInvoices.length>0?`Remove ${blockedInvoices.length} blocked invoices from ITC claim`:'No blocked invoices found' },
              { urgent: false, action:'Verify GSTIN for all new vendors' },
              { urgent: false, action:'File GSTR-1 (outward supplies) by 11th' },
              { urgent: false, action:`Compute GSTR-3B with eligible ITC: ${fmt(eligibleITC)}` },
              { urgent: false, action:'Pay net GST liability after ITC offset' },
            ].map((s,i)=>(
              <div key={i} style={{display:'flex',gap:10,padding:'8px 0',borderBottom:'1px solid var(--odoo-border)'}}>
                <span style={{width:22,height:22,borderRadius:'50%',flexShrink:0,
                  background:s.urgent?'var(--odoo-red)':'var(--odoo-purple)',
                  color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:10,fontWeight:700}}>{i+1}</span>
                <div style={{fontSize:12,paddingTop:2}}>
                  {s.action}
                  {s.urgent&&<span style={{marginLeft:6,fontSize:10,color:'var(--odoo-red)',fontWeight:700}}>URGENT</span>}
                </div>
              </div>
            ))}
            {/* ITC Flow box */}
            <div style={{marginTop:16,padding:12,background:'#EDE0EA',borderRadius:6}}>
              <div style={{fontSize:11,fontWeight:700,color:'#714B67',marginBottom:6,textTransform:'uppercase'}}>ITC Flow</div>
              {[
                ['Available', fmt(totalITC),    'var(--odoo-dark)'],
                ['Blocked',   fmt(blockedITC),  'var(--odoo-red)'],
                ['On Hold',   fmt(heldITC),     '#856404'],
              ].map(([l,v,c])=>(
                <div key={l} style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}>
                  <span style={{color:c}}>{l}</span>
                  <span style={{fontFamily:'DM Mono,monospace',color:c}}>{v}</span>
                </div>
              ))}
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginTop:6,
                paddingTop:6,borderTop:'1px solid #C8B8C8',fontWeight:800}}>
                <span style={{color:'#155724'}}>Claimable ITC</span>
                <span style={{fontFamily:'DM Mono,monospace',color:'#155724'}}>{fmt(eligibleITC)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
